// 03-state.js
// App state, activeGroup, getGroupsByMode, normalization

let appState = null;
let isUnlocked = false;

function defaultAppState() {
  const g1 = {
    id: uuid(),
    name: "Group 1",
    archived: false,
    data: defaultGroupData(15.0)
  };
  return {
    activeGroupId: g1.id,
    lastActiveGroupIdActive: g1.id,
    lastActiveGroupIdArchive: "",
    groups: [g1],
    workspaceMode: "active",
    grandMode: "active",
    lastReviewGrandMode: "active",
    uiMode: "review",
    reviewCollapsedGroups: {}
  };
}

function emptyRow() {
  return { id: uuid(), customer: "", city: "", gross: "", net: "", done: "none" };
}

function defaultGroupData(rate = 15.0) {
  return {
    defaultRatePercent: clampRate(rate),
    periods: [{ id: uuid(), from: "", to: "", rows: [emptyRow()] }],
  };
}

function normalizeGroupData(d) {
  const out = {
    defaultRatePercent: clampRate(d?.defaultRatePercent ?? 13.5),
    periods: Array.isArray(d?.periods) ? d.periods : [],
  };
  if (out.periods.length === 0) out.periods = defaultGroupData().periods;
  out.periods = out.periods.map((p) => ({
    id: p?.id || uuid(),
    from: p?.from || "",
    to: p?.to || "",
    rows: Array.isArray(p?.rows) && p.rows.length
      ? p.rows.map((r) => ({
          id: r?.id || uuid(),
          customer: r?.customer ?? "",
          city: r?.city ?? "",
          gross: r?.gross ?? "",
          net: r?.net ?? "",
          done: ["none", "done", "fail", "fixed"].includes(r?.done) ? r.done : "none",
        }))
      : [emptyRow()],
  }));
  return out;
}

function normalizeAppState(s) {
  const groups = Array.isArray(s?.groups) ? s.groups : [];
  const out = {
    activeGroupId: s?.activeGroupId || "",
    lastActiveGroupIdActive: s?.lastActiveGroupIdActive || "",
    lastActiveGroupIdArchive: s?.lastActiveGroupIdArchive || "",
    groups: [],
    workspaceMode: s?.workspaceMode === "archive" ? "archive" : "active",
    grandMode: s?.grandMode === "all" ? "all" : "active",
    lastReviewGrandMode: s?.lastReviewGrandMode === "all" ? "all" : "active",
    uiMode: s?.uiMode === "edit" ? "edit" : "review",
    reviewCollapsedGroups:
  s?.reviewCollapsedGroups && typeof s.reviewCollapsedGroups === "object"
    ? s.reviewCollapsedGroups
    : {},
  };
  out.groups = (groups.length ? groups : defaultAppState().groups).map((g) => ({
    id: g?.id || uuid(),
    name: (g?.name ?? "Group").toString().trim() || "Group",
    archived: g?.archived === true,
    data: normalizeGroupData(g?.data),
  }));
  if (!out.groups.some((g) => g.id === out.activeGroupId)) {
    out.activeGroupId = out.groups[0].id;
  }
  return out;
}

async function initAppState() {
  const loadedState = await loadState();
  appState = loadedState;
  return appState;
}

function getAppState() {
  if (!appState) {
    console.warn("appState accessed before initialization, using default");
    return defaultAppState();
  }
  return appState;
}

async function setAppState(newState, save = true) {
  appState = newState;
  if (save) await saveState();
}

function activeGroup() {
  const state = getAppState();
  const current = state.groups.find((g) => g.id === state.activeGroupId);
  if (current && (state.workspaceMode === "archive" ? current.archived === true : current.archived !== true)) {
    return current;
  }
  const firstInWorkspace = state.groups.find((g) =>
    state.workspaceMode === "archive" ? g.archived === true : g.archived !== true
  );
  return firstInWorkspace || null;
}

function getGroupsByMode(mode = null) {
  const state = getAppState();
  const effectiveMode = mode !== null ? mode : state.grandMode;
  const workspaceGroups = state.groups.filter((g) =>
    state.workspaceMode === "archive" ? g.archived === true : g.archived !== true
  );
  if (effectiveMode === "active") {
  const current = activeGroup();
  return current ? [current] : [];
}

// 👉 All რეჟიმი — დავალაგოთ
const current = activeGroup();

// დანარჩენი ჯგუფები (current-ის გარეშე)
const others = workspaceGroups.filter(g => g.id !== current?.id);

// უახლესი ზემოთ (ბოლოს დამატებული)
others.reverse();

// საბოლოო სია
return current ? [current, ...others] : others;
}

function isReviewGroupCollapsed(groupId) {
  const state = getAppState();
  return state.reviewCollapsedGroups?.[groupId] !== false;
}

async function toggleReviewGroupCollapsed(groupId) {
  const state = getAppState();

  if (!state.reviewCollapsedGroups || typeof state.reviewCollapsedGroups !== "object") {
    state.reviewCollapsedGroups = {};
  }

  const isCollapsedNow = state.reviewCollapsedGroups[groupId] !== false;
  state.reviewCollapsedGroups[groupId] = !isCollapsedNow;

  await saveState();
}

function isDefaultEmptyGroup(g) {
  if (!g) return false;

  // სახელი default-ის მსგავსი
  const name = (g.name || "").toLowerCase().trim();
  if (!name.startsWith("group")) return false;

  const periods = g?.data?.periods || [];
  if (periods.length !== 1) return false;

  const rows = periods[0]?.rows || [];
  if (rows.length !== 1) return false;

  const r = rows[0];

  // ყველა ველი ცარიელია
  const isEmpty =
    !r.customer &&
    !r.city &&
    !r.gross &&
    !r.net &&
    (!r.done || r.done === "none");

  return isEmpty;
}

function cleanupDefaultGroup() {
  const state = getAppState();

  if (!state.groups || state.groups.length <= 1) return;

  const defaultGroup = state.groups.find(isDefaultEmptyGroup);

  if (!defaultGroup) return;

  // თუ სხვა ჯგუფებიც არსებობს → წაშალე
  const realGroups = state.groups.filter(g => g.id !== defaultGroup.id);

  if (realGroups.length === 0) return;

  state.groups = realGroups;

  // activeGroup თუ default იყო → გადაიყვანე რეალურზე
  if (state.activeGroupId === defaultGroup.id) {
    state.activeGroupId = realGroups[0].id;
    state.lastActiveGroupIdActive = realGroups[0].id;
  }
}
