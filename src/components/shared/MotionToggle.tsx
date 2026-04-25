"use client";

import { useSyncExternalStore } from "react";
import { Zap, ZapOff } from "lucide-react";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "beacon-motion";
const ATTR = "data-motion";

function getMotion(): "on" | "reduced" {
  if (typeof document === "undefined") return "on";
  return document.documentElement.getAttribute(ATTR) === "reduced" ? "reduced" : "on";
}

function subscribe(cb: () => void) {
  if (typeof document === "undefined") return () => {};
  const obs = new MutationObserver(cb);
  obs.observe(document.documentElement, { attributes: true, attributeFilter: [ATTR] });
  return () => obs.disconnect();
}

function setMotion(next: "on" | "reduced") {
  if (next === "reduced") document.documentElement.setAttribute(ATTR, "reduced");
  else document.documentElement.removeAttribute(ATTR);
  try {
    window.localStorage.setItem(STORAGE_KEY, next);
  } catch {
    /* storage may be unavailable — toggle still works for the session */
  }
}

type Props = {
  className?: string;
  /** Compact text+icon link (used in the landing footer). */
  variant?: "icon" | "text";
};

export function MotionToggle({ className, variant = "icon" }: Props) {
  const motion = useSyncExternalStore(subscribe, getMotion, () => "on" as const);
  const reduced = motion === "reduced";
  const label = reduced ? "Restore motion" : "Reduce motion";
  const Icon = reduced ? ZapOff : Zap;
  const onClick = () => setMotion(reduced ? "on" : "reduced");

  if (variant === "text") {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-pressed={reduced}
        title={label}
        className={cn(
          "inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground",
          className
        )}
      >
        <Icon className="h-3 w-3" />
        {label}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={reduced}
      aria-label={label}
      title={label}
      className={cn(
        "relative flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
        className
      )}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}
