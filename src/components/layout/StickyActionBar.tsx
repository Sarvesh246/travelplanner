"use client";

import { cn } from "@/lib/utils";

interface StickyActionBarProps {
  primary?: React.ReactNode;
  secondary?: React.ReactNode;
  className?: string;
}

export function StickyActionBar({
  primary,
  secondary,
  className,
}: StickyActionBarProps) {
  if (!primary && !secondary) return null;

  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-x-3 bottom-[calc(4.6rem+env(safe-area-inset-bottom,0px))] z-30 md:hidden",
        className
      )}
    >
      <div className="app-glass pointer-events-auto rounded-2xl border border-border/80 bg-card/90 p-2 shadow-[0_22px_44px_-24px_hsl(var(--foreground)/0.38)]">
        <div className="flex items-center gap-2">
          {secondary ? <div className="flex shrink-0">{secondary}</div> : null}
          {primary ? <div className="min-w-0 flex-1">{primary}</div> : null}
        </div>
      </div>
    </div>
  );
}
