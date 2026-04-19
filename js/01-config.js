// 01-config.js
// Storage keys, PIN constants, and configuration values

const DB_NAME = "client_totals_db";
const DB_VERSION = 1;
const DB_STORE_MAIN = "app_store";

const DB_KEY_APP_STATE = "appState";
const DB_KEY_THEME = "theme";
const DB_KEY_CONTROLS_COLLAPSED = "controlsCollapsed";
const DB_KEY_SUMMARY_COLLAPSED = "summaryCollapsed";
const DB_KEY_MONTH_CURSOR = "monthCursor";
const DB_KEY_COLLAPSED_PERIODS = "collapsedPeriods";
const DB_KEY_BACKUP_REMINDER_DIRTY = "backupReminderDirty";
const DB_KEY_BACKUP_REMINDER_LAST_CHANGE = "backupReminderLastChange";
const DB_KEY_BACKUP_REMINDER_LAST_SHOWN = "backupReminderLastShownWeek";
const DB_KEY_PIN_VERIFIED = "pinVerified";

const APP_PIN = "369700";

window.APP_CONFIG = {
  DB_NAME,
  DB_VERSION,
  DB_STORE_MAIN,
  DB_KEY_APP_STATE,
  DB_KEY_THEME,
  DB_KEY_CONTROLS_COLLAPSED,
  DB_KEY_SUMMARY_COLLAPSED,
  DB_KEY_MONTH_CURSOR,
  DB_KEY_COLLAPSED_PERIODS,
  DB_KEY_BACKUP_REMINDER_DIRTY,
  DB_KEY_BACKUP_REMINDER_LAST_CHANGE,
  DB_KEY_BACKUP_REMINDER_LAST_SHOWN,
  DB_KEY_PIN_VERIFIED,
  APP_PIN
};
