"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

const SYNC_MESSAGES: Record<string, string> = {
  "db-failed":
    "Signed in, but we couldn't sync your profile. Some details may load slowly until the next sign-in.",
};

export function SyncStatusToast() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reportedRef = useRef<string | null>(null);

  useEffect(() => {
    const sync = searchParams.get("sync");
    if (!sync || reportedRef.current === sync) return;
    reportedRef.current = sync;

    const message = SYNC_MESSAGES[sync];
    if (message) toast.warning(message);

    const next = new URLSearchParams(searchParams);
    next.delete("sync");
    const qs = next.toString();
    router.replace(qs ? `?${qs}` : "?", { scroll: false });
  }, [router, searchParams]);

  return null;
}
