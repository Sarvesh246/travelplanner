"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { isAppWorkspacePath } from "@/lib/app-workspace";
import { CommandPalette } from "@/components/layout/CommandPalette";
import { KeyboardShortcuts } from "@/components/layout/KeyboardShortcuts";
import { useCommandPalette } from "@/hooks/useCommandPalette";

function CommandPaletteScrollLock() {
  const open = useCommandPalette((s) => s.open);
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);
  return null;
}

/**
 * Command palette, global trip/dashboard shortcuts, and scroll lock — only
 * for authenticated app surfaces (not marketing or auth pages).
 */
export function AppWorkspaceOverlays() {
  const pathname = usePathname();
  if (!isAppWorkspacePath(pathname)) return null;

  return (
    <>
      <KeyboardShortcuts />
      <CommandPalette />
      <CommandPaletteScrollLock />
    </>
  );
}
