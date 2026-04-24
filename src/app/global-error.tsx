"use client";

import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  console.error("Global app error:", error);

  return (
    <html lang="en">
      <body className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 text-center">
          <h1 className="text-xl font-semibold">Unexpected application error</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            A critical error occurred. Try resetting the app or return to the home page.
          </p>
          <div className="mt-5 flex items-center justify-center gap-3">
            <button
              onClick={reset}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              Reset app
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
