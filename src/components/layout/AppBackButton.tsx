"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface AppBackButtonProps {
  fallbackHref: string;
  label?: string;
  className?: string;
}

function hasSameOriginReferrer() {
  if (typeof window === "undefined") return false;
  if (!document.referrer) return false;

  try {
    return new URL(document.referrer).origin === window.location.origin;
  } catch {
    return false;
  }
}

export function AppBackButton({
  fallbackHref,
  label = "Back",
  className,
}: AppBackButtonProps) {
  const router = useRouter();

  function handleBack() {
    if (window.history.length > 1 && hasSameOriginReferrer()) {
      router.back();
      return;
    }

    router.push(fallbackHref);
  }

  return (
    <button
      type="button"
      onClick={handleBack}
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex min-h-10 min-w-10 items-center justify-center rounded-xl border border-border/70 bg-card/72 text-foreground shadow-sm backdrop-blur transition-colors hover:bg-muted/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className
      )}
    >
      <ArrowLeft className="h-4 w-4" />
    </button>
  );
}
