// ============================================
// SAVE.JS — Save/Load via localStorage
// ============================================

const SAVE_KEY = "flipperGame_save";
const SAVE_VERSION = 1;

// ── Save the full game state ─────────────────
export function saveGame(state) {
  try {
    const saveData = {
      version: SAVE_VERSION,
      timestamp: Date.now(),
      state: {
        player: state.player,
        economy: state.economy,
        activeEvents: state.activeEvents,
        currentScreen: state.currentScreen,
      },
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
    return true;
  } catch (e) {
    console.error("Save failed:", e);
    return false;
  }
}

// ── Load game state ──────────────────────────
export function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const saveData = JSON.parse(raw);
    if (saveData.version !== SAVE_VERSION) {
      console.warn("Save version mismatch. Starting fresh.");
      return null;
    }
    return saveData.state;
  } catch (e) {
    console.error("Load failed:", e);
    return null;
  }
}

// ── Check if save exists ─────────────────────
export function hasSave() {
  return localStorage.getItem(SAVE_KEY) !== null;
}

// ── Delete save data ─────────────────────────
export function deleteSave() {
  localStorage.removeItem(SAVE_KEY);
}

// ── Get save info (for display) ──────────────
export function getSaveInfo() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const saveData = JSON.parse(raw);
    return {
      exists: true,
      timestamp: new Date(saveData.timestamp).toLocaleString(),
      day: saveData.state?.player?.day || "?",
      cash: saveData.state?.player?.cash || 0,
      title: saveData.state?.player?.totalProfit || 0,
    };
  } catch {
    return null;
  }
}
