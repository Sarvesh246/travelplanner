"use client";

import { startTransition, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    console.error("App route error:", error);
  }, [error]);

  function handleRetry() {
    setRetrying(true);
    startTransition(() => {
      reset();
      router.refresh();
      setRetrying(false);
    });
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 text-center">
        <h2 className="text-xl font-semibold">We lost the trail for a moment</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Try again, or head back to your trips and reopen the plan.
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
            href="/dashboard"
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
