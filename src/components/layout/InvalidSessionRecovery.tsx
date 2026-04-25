"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const AUTH_RELATIVE_PATHS = ["/login", "/signup", "/auth/"];

function isRecoverableSessionError(err: { message?: string; name?: string } | null) {
  if (!err?.message) return false;
  const m = err.message.toLowerCase();
  return (
    m.includes("refresh") ||
    m.includes("invalid jwt") ||
    (m.includes("jwt expired") && m.includes("session"))
  );
}

/**
 * Stale or partial cookies (missing refresh token) cause Supabase to surface
 * AuthApiError on refresh. Clear local session and send to login so the error
 * does not keep repeating in the console.
 */
export function InvalidSessionRecovery() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      if (typeof window === "undefined") return;
      const pathname = window.location.pathname;
      if (AUTH_RELATIVE_PATHS.some((a) => pathname === a || pathname.startsWith(a))) {
        return;
      }

      const supabase = createClient();

      const { error: sessionError } = await supabase.auth.getSession();
      if (cancelled) return;
      if (sessionError && isRecoverableSessionError(sessionError)) {
        await supabase.auth.signOut({ scope: "local" });
        if (cancelled) return;
        router.replace(
          `/login?${new URLSearchParams({ next: pathname, reason: "session" }).toString()}`
        );
        return;
      }

      const { error: userError } = await supabase.auth.getUser();
      if (cancelled) return;
      if (userError && isRecoverableSessionError(userError)) {
        await supabase.auth.signOut({ scope: "local" });
        if (cancelled) return;
        router.replace(
          `/login?${new URLSearchParams({ next: pathname, reason: "session" }).toString()}`
        );
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  return null;
}
