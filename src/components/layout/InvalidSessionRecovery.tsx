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
    m.includes("refresh token not found") ||
    m.includes("invalid jwt") ||
    (m.includes("jwt expired") && m.includes("session"))
  );
}

function hasSupabaseRefreshTokenCookie() {
  if (typeof document === "undefined") return false;

  const cookies = document.cookie
    .split(";")
    .map((entry) => entry.trim())
    .filter(Boolean);

  for (const cookie of cookies) {
    const [rawName, ...rawValueParts] = cookie.split("=");
    const name = rawName?.trim();
    if (!name || !name.startsWith("sb-") || !name.includes("-auth-token")) continue;

    const value = rawValueParts.join("=");
    if (!value) continue;

    const decoded = decodeURIComponent(value);
    if (
      decoded.includes('"refresh_token":"') ||
      decoded.includes('"refresh_token": "')
    ) {
      return true;
    }
  }

  return false;
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
      if (!hasSupabaseRefreshTokenCookie()) {
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
