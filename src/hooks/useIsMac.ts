"use client";

import { useSyncExternalStore } from "react";

const noopSubscribe = () => () => {};

/**
 * Returns `true` on macOS / iOS / iPadOS so we can render the right modifier
 * key glyph (⌘ vs Ctrl). Server-renders as `false` to keep the initial markup
 * stable, then resolves once the client takes over.
 *
 * Implementation note: reads `navigator.platform` via `useSyncExternalStore`
 * so we don't need a `useEffect`+`setState` pair (which the React 19 rules
 * flag as an avoidable cascading render).
 */
export function useIsMac(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () =>
      typeof navigator !== "undefined" &&
      /Mac|iPod|iPhone|iPad/.test(navigator.platform),
    () => false
  );
}
