"use client";

import { startTransition, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();
  const [retrying, setRetrying] = useState(false);

  console.error("Global app error:", error);

  function handleRetry() {
    setRetrying(true);
    startTransition(() => {
      reset();
      router.refresh();
      setRetrying(false);
    });
  }

  return (
    <html lang="en">
      <body className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 text-center">
          <h1 className="text-xl font-semibold">Beacon needs a quick reset</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Try reloading this view, or return home and start from a fresh trailhead.
          </p>
          <div className="mt-5 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={handleRetry}
              disabled={retrying}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              {retrying ? "Retrying..." : "Try again"}
            </button>
            <Link
              href="/"
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              Home
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
