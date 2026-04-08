// 03-utils.js
// Core utility functions

function uuid() {
  return crypto?.randomUUID?.() ?? `id-${Math.random().toString(16).slice(2)}-${Date.now()}`;
}

function fmt(n) {
  const v = Number.isFinite(n) ? n : 0;
  return v.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function animateNumber(el, to, duration = 380) {
  if (!el) return;

  const target = Number(to) || 0;
  const prev = Number(el.dataset.value || 0);

  if (Math.abs(target - prev) < 0.01) {
    el.textContent = fmt(target);
    el.dataset.value = String(target);
    return;
  }

  const start = performance.now();

  function step(now) {
    const p = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - p, 3);
    const current = prev + (target - prev) * eased;

    el.textContent = fmt(current);

    if (p < 1) {
      requestAnimationFrame(step);
    } else {
      el.textContent = fmt(target);
      el.dataset.value = String(target);
    }
  }

  requestAnimationFrame(step);
}

function parseMoney(value) {
  if (value == null) return 0;

  let s = String(value).trim();
  if (!s) return 0;

  s = s.replace(/\s+/g, "");

  const lastComma = s.lastIndexOf(",");
  const lastDot = s.lastIndexOf(".");

  if (lastComma !== -1 && lastDot !== -1) {
    if (lastComma > lastDot) {
      s = s.replace(/\./g, "").replace(",", ".");
    } else {
      s = s.replace(/,/g, "");
    }
  } else if (lastComma !== -1 && lastDot === -1) {
    s = s.replace(",", ".");
  } else {
    s = s.replace(/,/g, "");
  }

  const num = Number(s);
  return Number.isFinite(num) ? num : 0;
}

function clampRate(percent) {
  let p = Number(percent);
  if (!Number.isFinite(p)) p = 0;
  if (p < 0) p = 0;
  if (p > 100) p = 100;
  return p;
}

function safeFileName(name) {
  return (name || "group").toString().trim().replace(/[^\w\-]+/g, "_");
}

function escapeHtml(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function startOfDay(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function daysBetweenInclusive(a, b) {
  const ms = startOfDay(b) - startOfDay(a);
  return Math.floor(ms / 86400000) + 1;
}

function parseDateOnly(dateStr) {
  if (!dateStr) return null;

  const s = String(dateStr).trim();

  const buildSafeDate = (y, m, d) => {
    if (!Number.isInteger(y) || !Number.isInteger(m) || !Number.isInteger(d)) return null;

    const out = new Date(y, m, d);

    if (
      Number.isNaN(out.getTime()) ||
      out.getFullYear() !== y ||
      out.getMonth() !== m ||
      out.getDate() !== d
    ) {
      return null;
    }

    return out;
  };

  if (s.includes("-")) {
    const parts = s.split("-");
    if (parts.length === 3) {
      const y = Number(parts[0]);
      const m = Number(parts[1]) - 1;
      const d = Number(parts[2]);
      return buildSafeDate(y, m, d);
    }
  }

  if (s.includes("/")) {
    const parts = s.split("/");
    if (parts.length === 3) {
      const d = Number(parts[0]);
      const m = Number(parts[1]) - 1;
      const y = Number(parts[2]);
      return buildSafeDate(y, m, d);
    }
  }

  return null;
}

function getDurationMonthsDays(from, to) {
  if (!from || !to) return { months: 0, days: 0 };

  let start = new Date(from);
  let end = new Date(to);

  if (start > end) return { months: 0, days: 0 };

  let months = 0;
  let temp = new Date(start);

  while (true) {
    let next = new Date(temp);
    next.setMonth(next.getMonth() + 1);

    if (next <= end) {
      temp = next;
      months++;
    } else {
      break;
    }
  }

  const days = Math.floor((end - temp) / 86400000);
  return { months, days };
}

function monthKeyFromDateObj(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function formatMonthKey(monthKey) {
  if (!monthKey) return "No data";
  const [y, m] = monthKey.split("-");
  const d = new Date(Number(y), Number(m) - 1, 1);
  return d.toLocaleString("en-US", { month: "long", year: "numeric" });
}

function getMonthStart(monthKey) {
  const [y, m] = monthKey.split("-");
  return new Date(Number(y), Number(m) - 1, 1);
}

function getMonthEnd(monthKey) {
  const [y, m] = monthKey.split("-");
  return new Date(Number(y), Number(m), 0);
}

function getOverlapDaysInclusive(periodFrom, periodTo, monthStart, monthEnd) {
  const start = periodFrom > monthStart ? periodFrom : monthStart;
  const end = periodTo < monthEnd ? periodTo : monthEnd;
  if (start > end) return 0;
  return daysBetweenInclusive(start, end);
}

function formatDateLocal(d) {
  if (!d) return "—";
  const parts = d.split("-");
  if (parts.length !== 3) return d;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function formatPeriodPreview(from, to) {
  const left = formatDateLocal(from);
  const right = formatDateLocal(to);
  return `${left} → ${right}`;
}

function formatDateForRange(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "";

  const d = String(date.getDate()).padStart(2, "0");
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const y = date.getFullYear();

  return `${d}/${m}/${y}`;
}

/* =========================
   Data Helper Functions
========================= */

function getGroupsDateRange(groups) {
  let min = null;
  let max = null;

  (groups || []).forEach((group) => {
    (group?.data?.periods || []).forEach((p) => {
      const from = parseDateOnly(p?.from);
      const to = parseDateOnly(p?.to);

      if (from && (!min || from < min)) min = from;
      if (to && (!max || to > max)) max = to;
    });
  });

  return { min, max };
}

function getAllMonthKeysForMode(mode = appState.grandMode) {
  const groups = getGroupsByMode(mode);
  const keys = new Set();

  groups.forEach((gr) => {
    (gr?.data?.periods || []).forEach((p) => {
      const from = parseDateOnly(p?.from);
      const to = parseDateOnly(p?.to);
      if (!from || !to) return;

      let cur = new Date(from.getFullYear(), from.getMonth(), 1);
      const last = new Date(to.getFullYear(), to.getMonth(), 1);

      while (cur <= last) {
        keys.add(monthKeyFromDateObj(cur));
        cur = new Date(cur.getFullYear(), cur.getMonth() + 1, 1);
      }
    });
  });

  return [...keys].sort();
}