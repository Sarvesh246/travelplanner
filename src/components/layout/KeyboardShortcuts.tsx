"use client";

import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";

/**
 * Mounts global keyboard shortcuts. Renders nothing.
 *
 * Lives inside the theme + query providers (via `RootProvider`) so the
 * shortcut hook can call `useTheme()` / `useRouter()` safely.
 */
export function KeyboardShortcuts() {
  useKeyboardShortcuts();
  return null;
}
