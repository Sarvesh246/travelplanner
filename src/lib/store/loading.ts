import { create } from "zustand";

export type LoadingSource = "manual" | "navigation";

interface LoadingStore {
  isLoading: boolean;
  message?: string;
  source: LoadingSource | null;
  /** Show immediately (used for explicit user-initiated work like sign-out, file upload). */
  startLoading: (message?: string) => void;
  /** Show after a short grace period — only used by navigation; suppressed if nav finishes quickly. */
  startNavigation: (message?: string) => void;
  /** Stop loading. Honors a small minimum on-screen time to avoid flicker. */
  stopLoading: () => void;
  /** Imperative setter — used by tests or low-level callers. */
  setLoading: (loading: boolean, message?: string) => void;
}

// Grace period before a navigation-initiated spinner appears. Quick page changes
// (cached, prefetched, or local) finish before this elapses, so we never show.
const NAV_GRACE_MS = 180;
// Minimum time the spinner stays on screen once shown — prevents flashing.
const MIN_SHOW_MS = 320;

let pendingShow: ReturnType<typeof setTimeout> | null = null;
let pendingHide: ReturnType<typeof setTimeout> | null = null;
let shownAt: number | null = null;

function clearTimers() {
  if (pendingShow) {
    clearTimeout(pendingShow);
    pendingShow = null;
  }
  if (pendingHide) {
    clearTimeout(pendingHide);
    pendingHide = null;
  }
}

export const useLoadingStore = create<LoadingStore>((set, get) => ({
  isLoading: false,
  message: undefined,
  source: null,

  setLoading: (loading, message) => {
    clearTimers();
    shownAt = loading ? Date.now() : null;
    set({
      isLoading: loading,
      message: loading ? message : undefined,
      source: loading ? "manual" : null,
    });
  },

  startLoading: (message) => {
    clearTimers();
    shownAt = Date.now();
    set({ isLoading: true, message, source: "manual" });
  },

  startNavigation: (message) => {
    // Already visible — leave it alone, just (optionally) update the message.
    if (get().isLoading) {
      if (message && get().message !== message) set({ message });
      return;
    }
    if (pendingShow) clearTimeout(pendingShow);
    if (pendingHide) {
      clearTimeout(pendingHide);
      pendingHide = null;
    }
    pendingShow = setTimeout(() => {
      pendingShow = null;
      shownAt = Date.now();
      set({ isLoading: true, message, source: "navigation" });
    }, NAV_GRACE_MS);
  },

  stopLoading: () => {
    if (pendingShow) {
      clearTimeout(pendingShow);
      pendingShow = null;
    }
    if (!get().isLoading) {
      // Nothing visible; just reset.
      shownAt = null;
      if (get().message || get().source) set({ message: undefined, source: null });
      return;
    }
    const elapsed = shownAt ? Date.now() - shownAt : MIN_SHOW_MS;
    const remaining = Math.max(0, MIN_SHOW_MS - elapsed);
    if (remaining === 0) {
      shownAt = null;
      if (pendingHide) {
        clearTimeout(pendingHide);
        pendingHide = null;
      }
      set({ isLoading: false, message: undefined, source: null });
      return;
    }
    if (pendingHide) clearTimeout(pendingHide);
    pendingHide = setTimeout(() => {
      pendingHide = null;
      shownAt = null;
      set({ isLoading: false, message: undefined, source: null });
    }, remaining);
  },
}));
