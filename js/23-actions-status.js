// 23-actions-status.js
// Status change logic (none -> done -> fail -> fixed -> wrong -> none)
// Currently status toggling is handled inline inside render() event listeners.
// This file is reserved for future extraction of status-related business logic.

// Example future function:
// function getNextStatus(currentStatus) {
//   if (currentStatus === "none") return "done";
//   if (currentStatus === "done") return "fail";
//   if (currentStatus === "fail") return "fixed";
//   if (currentStatus === "fixed") return "wrong";
//   return "none";
// }
