"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * A keyboard-key glyph. Pass either a single key (e.g. "K", "Esc", "↑") or a
 * space-separated chord (e.g. "⌘ K", "G D").
 *
 * - Single key or modifier+key: rendered as a joined kbd group.
 * - `asChord` (for multi-step "press X then Y" shortcuts) adds a muted "then"
 *   between keys so users understand it's sequential, not simultaneous.
 */
export function Kbd({
  keys,
  className,
  asChord = false,
}: {
  keys: string;
  className?: string;
  asChord?: boolean;
}) {
  const parts = keys.trim().split(/\s+/);

  return (
    <span className={cn("inline-flex items-center gap-1 align-middle", className)}>
      {parts.map((k, i) => (
        <React.Fragment key={`${k}-${i}`}>
          {i > 0 && asChord && (
            <span className="text-[9px] text-muted-foreground/70 select-none">
              then
            </span>
          )}
          <KbdKey>{k}</KbdKey>
        </React.Fragment>
      ))}
    </span>
  );
}

function KbdKey({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded border border-border bg-muted px-1.5 text-[10px] font-mono font-medium text-muted-foreground shadow-[inset_0_-1px_0_0_hsl(var(--border))] select-none">
      {children}
    </kbd>
  );
}
