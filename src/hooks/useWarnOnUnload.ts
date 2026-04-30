"use client";

import { useEffect } from "react";

export function useWarnOnUnload(shouldWarn: boolean) {
  useEffect(() => {
    if (!shouldWarn) return;

    function handleBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
      event.returnValue = "";
    }

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [shouldWarn]);
}
