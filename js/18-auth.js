// 18-auth.js
// One-time device sign-in for Firebase Auth (protects Firestore rules)

const authLockModal = document.getElementById("authLockModal");
const authEmailInput = document.getElementById("authEmailInput");
const authPasswordInput = document.getElementById("authPasswordInput");
const authLockError = document.getElementById("authLockError");
const authUnlockBtn = document.getElementById("authUnlockBtn");

function showAuthLockError(show) {
  if (!authLockError) return;
  authLockError.style.display = show ? "block" : "none";
}

function openAuthLockModal() {
  if (!authLockModal) return;
  authLockModal.style.display = "grid";
  showAuthLockError(false);
  setAppInteractionLocked(true);
  setTimeout(() => authEmailInput?.focus(), 30);
}

function closeAuthLockModal() {
  if (!authLockModal) return;
  authLockModal.style.display = "none";
  setAppInteractionLocked(false);
}

function initAuthLockAsync() {
  return new Promise((resolve) => {
    if (!window.__auth) {
      resolve();
      return;
    }

    let settled = false;

    window.__auth.onAuthStateChanged((user) => {
      if (user) {
        closeAuthLockModal();
        if (!settled) { settled = true; resolve(); }
        return;
      }
      openAuthLockModal();
    });

    const trySignIn = async () => {
      const email = (authEmailInput?.value || "").trim();
      const password = authPasswordInput?.value || "";

      if (!email || !password) { showAuthLockError(true); return; }

      authUnlockBtn.disabled = true;
      authUnlockBtn.textContent = "Signing in...";

      try {
        await window.__auth.signInWithEmailAndPassword(email, password);
        showAuthLockError(false);
      } catch (error) {
        console.error("Sign in failed:", error);
        if (authLockError) {
          authLockError.textContent = "Error: " + (error?.code || "") + " " + (error?.message || "Sign in failed");
        }
        showAuthLockError(true);
      } finally {
        authUnlockBtn.disabled = false;
        authUnlockBtn.textContent = "Sign In";
      }
    };

    authUnlockBtn?.addEventListener("click", trySignIn);
    authPasswordInput?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") { e.preventDefault(); trySignIn(); }
    });

    setTimeout(() => {
      if (!settled) { settled = true; resolve(); }
    }, 4000);
  });
}

window.initAuthLockAsync = initAuthLockAsync;
