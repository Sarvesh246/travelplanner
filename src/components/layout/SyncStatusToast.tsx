"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

const SYNC_MESSAGES: Record<string, string> = {
  "db-failed":
    "Signed in, but we couldn't sync your profile. Some details may load slowly until the next sign-in.",
};

const ACCESS_MESSAGES: Record<string, string> = {
  revoked: "Your access to that trip was removed. Ask the trip owner for a new invite if you still need access.",
};

export function SyncStatusToast() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reportedRef = useRef<string | null>(null);

  useEffect(() => {
    const sync = searchParams.get("sync");
    const access = searchParams.get("access");
    const reportKey = `${sync ?? ""}:${access ?? ""}`;
    if ((!sync && !access) || reportedRef.current === reportKey) return;
    reportedRef.current = reportKey;

    const message = sync ? SYNC_MESSAGES[sync] : undefined;
    if (message) toast.warning(message);

    const accessMessage = access ? ACCESS_MESSAGES[access] : undefined;
    if (accessMessage) toast.warning(accessMessage);

    const next = new URLSearchParams(searchParams);
    next.delete("sync");
    next.delete("access");
    const qs = next.toString();
    router.replace(qs ? `?${qs}` : "?", { scroll: false });
  }, [router, searchParams]);

  return null;
}
