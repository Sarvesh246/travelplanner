"use client";

import { useLoadingStore } from "@/lib/store/loading";
import { useCallback } from "react";

export function useLoading() {
  const { startLoading, stopLoading } = useLoadingStore();

  const withLoading = useCallback(
    async <T,>(
      fn: () => Promise<T>,
      message?: string
    ): Promise<T> => {
      startLoading(message || "Loading...");
      try {
        return await fn();
      } finally {
        stopLoading();
      }
    },
    [startLoading, stopLoading]
  );

  return { withLoading, startLoading, stopLoading };
}
