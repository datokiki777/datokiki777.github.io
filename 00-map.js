// JS MAP (functions) - NEW STRUCTURE
//
// LATEST SYNC UPDATE:
// - 03-state.js: appState now includes dataUpdatedAt; normalizeAppState() preserves it.
// - 04-storage.js: saveState() is split by intent.
//   await saveState() = UI-only/local IndexedDB save.
//   await saveState({ dataChanged: true }) = real data save + dataUpdatedAt + backup dirty + cloud autosync.
// - 16-import-export.js: JSON merge/replace and Excel replace use saveState({ dataChanged: true }).
// - 17-cloud-sync.js: debounce is 8000ms, snapshots are deep-cloned, payload includes dataUpdatedAt,
//   edits during in-flight sync queue another sync, and syncFromCloudOnStartup() implements latest-device-wins.
//   getSnapshotAppData() reads latest/history snapshots from current, legacy, or nested payload shapes.
// - 20-actions-groups.js / 22-actions-rows.js / 31-render-periods.js / 50-bind-events.js:
//   real data edits call saveState({ dataChanged: true }); UI-only navigation/toggles remain plain saveState().
// - 60-app-init.js: after loadState(), waits for Firebase when available and runs syncFromCloudOnStartup().
// Status: ✅ PRODUCTION READY (REFACTORED)

═══════════════════════════════════════
01-config.js
═══════════════════════════════════════
- IndexedDB config: DB_NAME, DB_VERSION, DB_STORE_MAIN
- Legacy localStorage keys (for migration only)
- New IndexedDB KV keys:
  - DB_KEY_APP_STATE, DB_KEY_THEME, DB_KEY_CONTROLS_COLLAPSED
  - DB_KEY_SUMMARY_COLLAPSED, DB_KEY_MONTH_CURSOR, DB_KEY_COLLAPSED_PERIODS
  - DB_KEY_BACKUP_REMINDER_DIRTY, DB_KEY_BACKUP_REMINDER_LAST_CHANGE
  - DB_KEY_BACKUP_REMINDER_LAST_SHOWN, DB_KEY_PIN_VERIFIED
- APP_PIN, PIN_VERIFIED_KEY

═══════════════════════════════════════
02-dom.js
═══════════════════════════════════════
- DOM element references
- rootEl, modeEditBtn, modeReviewBtn
- workspaceActiveBtn, workspaceArchiveBtn
- editView, reviewView, elPeriods
- tplPeriod, tplRow, defaultRateInput
- defaultSalaryInput
- grandGrossEl, grandNetEl, grandMyEl
- grandUnpaidEl, grandIncomeEl
- summaryCollapseBtn, monthPrevBtn, monthNextBtn
- monthLabel, monthGrossEl, monthNetEl, monthMyEl
- overviewDateRangeEl, overviewDurationEl
- groupPickerBtn, groupPickerBtnText
- addGroupBtn, renameGroupBtn, deleteGroupBtn
- groupPickerModal, groupPickerList, groupPickerClose
- totalsActiveBtn, totalsAllBtn
- topMenuBtn, topMenuBackdrop, topMenuPanel
- menuExportJsonBtn, menuImportJsonInput
- menuPdfBtn, menuExportExcelBtn, menuImportExcelInput
- editActions, reviewActions, toTopBtn
- controlsToggle, fabAddClient
- confirmBackdrop, confirmTitleEl, confirmTextEl, confirmNoBtn, confirmYesBtn
- statusListModal, statusListTitle, statusListBody, statusListClose
- themeSwitch, textPromptModal, textPromptTitle, textPromptText
- textPromptInput, textPromptCancel, textPromptOk
- pinLockModal, pinLockInput, pinUnlockBtn, pinLockError
- bodyOverflowBeforePinLock
- Data & Backup DOM refs:
  - dataBackupBtn, dataBackupModal, dataBackupClose
  - dbStorageEl, dbActiveEl, dbArchiveEl
  - dbLastBackupEl, dbCountEl, dbStatusEl
  - dbCloudSyncStatusEl
  - createBackupBtn, restoreBackupBtn
  - cloudSaveBtn, cloudLoadBtn

═══════════════════════════════════════
03-state.js
═══════════════════════════════════════
- appState (initialized via initAppState)
- getAppState(), setAppState()
- activeGroup(), getGroupsByMode()
- isReviewGroupCollapsed(), toggleReviewGroupCollapsed()
  → Review group cards default collapsed / expandable state
  → All mode: current group first, then newest groups below
- defaultAppState(), normalizeAppState(), normalizeGroupData()
- emptyRow(), defaultGroupData()
  → group data includes defaultSalaryPer28Days
  → period data includes paidWeeks
  → normalizeAppState() migrates older groups with salary = 0
- isDefaultEmptyGroup(g)
- cleanupDefaultGroup()
  → removes empty default template group when real groups exist
  → auto-switches activeGroup if needed
- initAppState() - async loader

═══════════════════════════════════════
04-storage.js
═══════════════════════════════════════
- openDb(), dbGet(), dbSet(), dbDelete()
- migrateFromLocalStorage() - one-time migration
- saveState(), loadState()
- getSavedSummaryCollapsed(), setSummaryCollapsed()
- getSavedMonthCursor(), setSavedMonthCursor()
- getSavedCollapsedPeriods(), saveCollapsedPeriods()
- isPeriodCollapsed(), setPeriodCollapsed()
- isDeviceVerified(), setDeviceVerified()
- getCurrentMonthKey()
- Backup reminder:
  - markBackupReminderDirty()
  - shouldShowBackupReminder()
  - getWeekKeyForReminder()
  - isBackupReminderWindow()
- Data & Backup meta:
  - BACKUP_META_KEY
  - getBackupMeta(), setBackupMeta()
- saveState(options)
  → local save unchanged
  → can skip backup reminder dirty flag
  → now also schedules cloud autosync unless skipped

═══════════════════════════════════════
05-utils-core.js
═══════════════════════════════════════
- uuid(), fmt(), animateNumber()
- parseMoney(), clampRate(), safeFileName()
- escapeHtml()
- getDigitsOnly(), isSuspiciousNetComparedToGross()
- sanitizeIntegerMoneyInput()
- normalizeMoneyToStoredInteger()
- normalizeSalaryAmount()
- normalizePaidWeeks()
  → whole-euro only input/import normalization
  → decimals/cent values rounded on import
  → salary values normalize to non-negative whole euros
  → paidWeeks normalizes to a non-negative integer

═══════════════════════════════════════
10-calc-dates.js
═══════════════════════════════════════
- startOfDay(), daysBetweenInclusive()
- parseDateOnly(), getDurationMonthsDays()
- monthKeyFromDateObj(), formatMonthKey()
- getMonthStart(), getMonthEnd(), getOverlapDaysInclusive()
- formatDateLocal(), formatPeriodPreview(), formatDateForRange()
- getGroupsDateRange(), getAllMonthKeysForMode()

═══════════════════════════════════════
11-calc-status.js
═══════════════════════════════════════
- isMarkedRow(), countMarkedInPeriod(), countMarkedInGroup()
- getMarkedClientsCount()
- calcMonthlyStatus(), calcGroupStatusCounts()
- calcStatusCountsByMode(), calcOverallStatusCounts()

═══════════════════════════════════════
12-calc-totals.js
═══════════════════════════════════════
- calcPeriodTotals(), calcEditPeriodMyOnly()
- calcGrandTotalsByMode()

═══════════════════════════════════════
13-calc-monthly.js
═══════════════════════════════════════
- calcMonthlyTotals() - proportional by day overlap

═══════════════════════════════════════
14-search.js (renamed from 10-search.js)
═══════════════════════════════════════
- buildReviewSearchIndex(), refreshSearchIndex()
- goToClientFromSearch() - structural navigation (uses render)
- initReviewSearch(), renderSearchResults()
- bindSearchResultClicks(), highlightMatch()
- clearSearch()

═══════════════════════════════════════
15-theme.js
═══════════════════════════════════════
THEME:
- initThemeAsync(), setTheme(), toggleTheme()

COLLAPSE:
- initControlsToggleAsync(), setControlsCollapsed()
- initSummaryPanel(), setSummaryCollapsed()

WORKSPACE & MODE:
- setWorkspaceMode(), updateWorkspaceSwitchUI()
- setMode() - async
  → mode switch uses refreshFullUiState()
  → forces render() in Edit mode
  → forces renderReview() in Review mode
- shiftMonthCursor() - async, uses renderMonthlySection()
- updateGrandToggleUI(), setControlsForMode()
- initWorkspaceSwitch()

═══════════════════════════════════════
16-import-export.js (renamed from 11-import-export.js)
═══════════════════════════════════════
- handleExportJson(), handleImportJsonChange()
- JSON replace imports call cleanupDefaultGroup()
- JSON export updates backup meta (lastBackupAt, count)
- handleExportExcel(), handleImportExcelChange()
- Excel replace imports call cleanupDefaultGroup()
- handleExportPdf(), exportPdfAllGroups()
- downloadJson(), nowStamp()
- JSON menu buttons hidden from top menu UI
- JSON backup/restore now opened via Data & Backup modal
- JSON import normalizes gross/net to whole euros
- Excel import normalizes gross/net to whole euros
- decimal money values rounded automatically on import
- JSON merge / replace trigger immediate cloud sync
- Excel replace trigger immediate cloud sync

═══════════════════════════════════════
17-cloud-sync.js
═══════════════════════════════════════
- Firestore cloud sync layer (local-first app)
- Main latest snapshot path:
  → backups / main
- Daily history snapshot path:
  → backups_history / YYYY-MM-DD
- handleCloudSave()
- handleCloudLoad()
  → restore source picker + cleaned restore flow
- writeCloudMainSnapshot()
- scheduleCloudAutoSync()
  → 8s debounce for ordinary edits
- triggerImmediateCloudSync()
  → immediate sync for big actions
- force sync
  → 30s while editing continues
- refreshCloudSyncStatusFromServer()
- Cloud sync states:
  → Synced
  → Syncing...
  → Saved locally
  → Cloud error
- Online/offline listeners:
  → offline keeps local data safe
  → online retries pending cloud sync
- Daily history helpers:
  - toDayKey()
  - toDisplayDay()
  - getYesterdayKey()
  - markPendingHistoryDay()
  - getPendingHistoryDay()
  - setLastHistorySavedDay()
  - getLastHistorySavedDay()
- finalizePendingHistoryDayIfNeeded()
  → creates previous-day daily snapshot on next app launch
  → only if there were changes
  → only if that day was not already finalized
- Daily history document fields:
  - type
  - historyDay
  - historyDayDisplay
  - sourceUpdatedAt
  - savedAt
  - expireAt
  - data
- getCloudHistorySnapshots()
  → reads daily history restore points
- chooseCloudRestoreSource()
  → Cloud Load can restore:
    - Latest Cloud
    - Daily History snapshot(s)
→ card-style restore source modal (no text prompt / no number input)
- Restore display format:
  → DD-MM-YYYY shown to user
  → YYYY-MM-DD used internally / as doc id
- TTL-ready history:
  → expireAt stored in daily history docs for automatic cleanup later

═══════════════════════════════════════
20-actions-groups.js
═══════════════════════════════════════
- addGroup(), renameGroup(), deleteGroup()
  → addGroup() calls cleanupDefaultGroup()
- toggleArchiveGroup(), switchGroup()
- switchToNextGroup()
  → cycles current workspace groups
  → wraps from last group back to first
  → used by short press on controlsToggle
- findGroupByName(), cloneAndReIdGroup()
- mergeAppState(), isSameMergeRow(), normalizeMergeText()
  → mergeAppState() calls cleanupDefaultGroup()

═══════════════════════════════════════
21-actions-periods.js
═══════════════════════════════════════
- periodsStrictlyOverlap(), hasOverlappingPeriodInActiveGroup()
- isPeriodReversed(), validatePeriodWarnings()

═══════════════════════════════════════
22-actions-rows.js
═══════════════════════════════════════
- addClientToLastPeriod() - structural (uses render)

═══════════════════════════════════════
23-actions-status.js
═══════════════════════════════════════
- (reserved for future status-related business logic)

═══════════════════════════════════════
07-modals.js
═══════════════════════════════════════
- askConfirm(), askText()
- Pin lock: initPinLockAsync(), isDeviceVerified()
- setDeviceVerified(), tryUnlockApp()
- openPinLockModal(), closePinLockModal()
- setAppInteractionLocked(), showPinLockError()
- Top menu: initTopMenu(), openTopMenu(), closeTopMenu(), toggleTopMenu()
- Group picker: openGroupPickerModal(), closeGroupPickerModal()
- Status list: openStatusListModal(), closeStatusListModal()
- getClientsByStatus(), goToClientFromStatusList()
- Backup reminder: showBackupReminderPopup()
- initStatusBadgeActions()
- askRestoreSource() - card-style cloud restore source picker

═══════════════════════════════════════
30-render-overview.js
═══════════════════════════════════════
- renderOverviewDateRange(), renderOverviewSection()
  → Working period + Clients + duration only
  → overview duration format: "X Clients", "Y Mo Z D"

═══════════════════════════════════════
31-render-periods.js
═══════════════════════════════════════
- render() - FULL EDIT VIEW RENDER (structural changes)
- Paid Weeks input appears only in edit period cards
  → shown inline inside period-head between period-title and period-actions
  → stored as period.paidWeeks
  → empty value counts as 0
  → capped to calcPeriodWeeks(period)
- Review period cards show only a compact paid weeks badge when paidWeeks > 0
  → badge format: 💶 1w
  → yellow partial badge when paidWeeks < total period weeks
  → no input in Review mode
- gross/net inputs restricted to digits only
- inputMode numeric + integer sanitizing on input

═══════════════════════════════════════
32-render-review.js
═══════════════════════════════════════
- renderReview() - FULL REVIEW VIEW RENDER
  → Review group cards are collapsible
  → Default state = collapsed
  → Expanded state shows KPI cards + period cards

═══════════════════════════════════════
33-render-monthly.js
═══════════════════════════════════════
- renderMonthlyStats(), renderMonthlySection()
  → month Gross / Net / My stay monthly
  → Done / Fail / Fixed / Wrong use FULL status counts:
    Current = current group full stats
    All = all groups full stats

═══════════════════════════════════════
34-render-shared.js
═══════════════════════════════════════
SHARED UI (no full render):
- renderGrandTotals()
  → Gross / Net / My
  → Unpaid / Income summary strip
- renderEditPeriodTotals(periodId)
- updateControlsButtonLabel(), renderGroupSelect()
- syncControlsInputs()
  → keeps Default % and Default salary / 28d inputs synced from activeGroup()
  → fixes Review startup before Edit render runs
- updateFloatingAddClientVisibility()
- openGroupPickerModal(), closeGroupPickerModal()
- updateGrandToggleUI()

═══════════════════════════════════════
35-ui-sync.js
═══════════════════════════════════════
CENTRAL UI SYNC:
- refreshUiChrome()
  - setControlsForMode()
  - updateGrandToggleUI()
  - updateWorkspaceSwitchUI()
  - renderGroupSelect()
  - updateControlsButtonLabel()
  - syncControlsInputs()
  - updateFloatingAddClientVisibility()
  - html.is-edit class sync
- refreshFullUiState()
  - refreshUiChrome()
  - updateAfterGlobalChange()
  - updateDataBackupInfo()
- updateDataBackupInfo()
  - Used Storage via navigator.storage.estimate() fallback
  - Active counts: groups / periods / rows
  - Archive counts: groups / periods / rows
  - Last backup / backup count
  - Backup status color sync
  - also refreshes Cloud Sync status in Data & Backup modal

═══════════════════════════════════════
40-update-flow.js
═══════════════════════════════════════
GRANULAR UPDATE ORCHESTRATORS:
- updateAfterRowChange(periodId)
- updateAfterPeriodMetaChange(periodId)
- updateAfterStatusChange(periodId)
- updateAfterSalaryChange()
  → salary changes update overview totals only
  → skips monthly recalculation because salary does not affect monthly Gross/Net/My
- updateAfterGlobalChange()
- recalcAndRenderTotals() - fallback

═══════════════════════════════════════
50-bind-events.js
═══════════════════════════════════════
GLOBAL EVENT LISTENERS:
- Mode buttons (edit/review)
- Grand total toggle (active/all)
- Group picker modal
- Group management (add/rename/delete)
- Archive group button
- Default rate input
- Default salary / 28d input
  → stores defaultSalaryPer28Days on active group
  → uses updateAfterSalaryChange() for lighter recalculation
- Controls button short/long press:
  → short press = switchToNextGroup()
  → long press = collapse/expand controls panel
- Add period / reset group buttons
- Scroll to top, floating add client
- Review group collapse toggle
- Status list modal close
- Keyboard detection, back button (popstate)
- Data & Backup modal:
  - open / close handlers
  - closes top menu before opening
  - Backup button → handleExportJson()
  - Restore button → menuImportJsonInput.click()
  - Cloud Save button → handleCloudSave()
  - Cloud Load button → handleCloudLoad()
  - popstate close support
- Cloud sync hooks:
  → default rate input = autosync
  → default salary input = autosync
  → add period = immediate sync
  → reset group = immediate sync
  → archive/unarchive = immediate sync

═══════════════════════════════════════
60-app-init.js
═══════════════════════════════════════
APP INITIALIZATION:
- initApp() - async startup sequence:
  1. openDb()
  2. loadState()
  3. initThemeAsync()
  4. initControlsToggleAsync()
  5. initWorkspaceSwitch()
  6. initSummaryPanel()
  7. initTopMenu()
  8. initPinLockAsync()
  9. initStatusBadgeActions()
  10. setMode()
  10.5 finalizePendingHistoryDayIfNeeded()
  11. show backup reminder if needed
- Splash screen removal
- Service Worker (PWA)
  → manual update flow
  → Export All + Update popup
  → skipWaiting only after user action
  → reload only after accepted update
- beforeinstallprompt / appinstalled

═══════════════════════════════════════
99-debug.js
═══════════════════════════════════════
- runAppDebugChecks() - full state validation
- runQuickDebug() - quick summary
- debugCheckStorage() - check localStorage vs IndexedDB
- debugClearLegacyStorage() - clear old localStorage keys
- debugText(), debugNorm(), debugRowKey()
- addDebugIssue(), finishDebugReport()

═══════════════════════════════════════
ARCHITECTURE RULES:
═══════════════════════════════════════

STRUCTURAL CHANGE → render() (31-render-periods.js):
- add/remove row
- add/remove period
- switch group / workspace
- reset group
- import/replace data
- mode switch (edit/review)

DATA CHANGE → granular update (40-update-flow.js):
- gross/net input → updateAfterRowChange()
- status change → updateAfterStatusChange()
  → recalculates edit period totals and grand totals because Wrong excludes row money
- from/to date → updateAfterPeriodMetaChange()
- default rate → updateAfterGlobalChange()
- default salary → updateAfterSalaryChange()
- grand mode toggle → updateAfterGlobalChange()
- month cursor shift → renderMonthlySection()

SALARY / INCOME LOGIC:
- Rows marked Wrong are excluded from financial totals even if Gross/Net values are filled
- Wrong rows do not affect Gross, Net, My €, Unpaid, Income, monthly totals, or salary weeks
- defaultSalaryPer28Days = group salary for 28 days / 4 weeks
- weekly salary = defaultSalaryPer28Days / 4
- Gross period weeks:
  → periods with at least one valid Gross value
  → ranges are merged and rounded up by week
  → week duration uses elapsed days (20→27 = 7 days = 1 week)
- Per-period week cap:
  → calcPeriodWeeks(period)
  → Paid Weeks input cannot save more than this value
- Paid period weeks:
  → comes only from period.paidWeeks
  → empty / missing / 0 = unpaid salary
  → Net does not affect salaryPaid
- salaryAccrued = weekly salary * grossWeeks
- salaryPaid = weekly salary * min(paidWeeks, grossWeeks)
- salary remaining = max(0, salaryAccrued - salaryPaid)
- Unpaid = (Gross * group %) - (Net * group %)
- Income = Unpaid - salary remaining
- Current/All/Archive use the same workspace-aware group selection as existing totals

UI CHROME SYNC → refreshUiChrome() / refreshFullUiState() (35-ui-sync.js):
- workspace badges
- controls button label
- group selector
- grand toggle UI
- fab visibility
- html.is-edit class

STORAGE:
- All main app data stored in IndexedDB (client_totals_db)
- localStorage used ONLY for one-time migration / legacy cleanup
- After migration, localStorage is cleared automatically

CLOUD SYNC:
- IndexedDB remains the primary storage
- Firestore is a background sync layer only
- Latest snapshot:
  → backups/main
- Daily history:
  → backups_history/YYYY-MM-DD
- Ordinary edits:
  → save locally first
  → cloud autosync after 8s inactivity
- Long continuous editing:
  → force cloud sync every 30s
- Big actions:
  → trigger immediate cloud sync
- Daily history finalize:
  → previous day snapshot is created on next app launch
  → only if previous day had changes
  → only once per day
- Cloud Load supports:
  → latest snapshot restore
  → daily history restore
- History docs are TTL-ready via expireAt
- Manual JSON backup/restore remains unchanged

═══════════════════════════════════════
STATUS: ✅ PRODUCTION READY (REFACTORED)
═══════════════════════════════════════
