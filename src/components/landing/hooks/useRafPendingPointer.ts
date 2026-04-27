"use client";

import { useCallback, useEffect, useRef } from "react";

export type RafPendingPointerPayload = {
  bounds: DOMRectReadOnly;
  clientX: number;
  clientY: number;
  currentTarget: HTMLElement;
  eventTarget: EventTarget | null;
};

/** Coalesces pointer/mouse moves to one update per animation frame (latest wins). */
export function useRafPendingPointer(
  handler: (p: RafPendingPointerPayload) => void,
): {
  primePointerTarget: (target: HTMLElement) => void;
  schedulePointerMove: (
    e: React.MouseEvent<HTMLElement> | React.PointerEvent<HTMLElement>,
  ) => void;
} {
  const rafRef = useRef<number | null>(null);
  const pendingRef = useRef<RafPendingPointerPayload | null>(null);
  const handlerRef = useRef(handler);
  const rectRef = useRef<DOMRectReadOnly | null>(null);
  const targetRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  const primePointerTarget = useCallback((target: HTMLElement) => {
    targetRef.current = target;
    rectRef.current = target.getBoundingClientRect();
  }, []);

  const flush = useCallback(() => {
    rafRef.current = null;
    const p = pendingRef.current;
    if (!p) return;
    pendingRef.current = null;
    handlerRef.current(p);
  }, []);

  const schedule = useCallback(
    (e: React.MouseEvent<HTMLElement> | React.PointerEvent<HTMLElement>) => {
      if (targetRef.current !== e.currentTarget || rectRef.current === null) {
        primePointerTarget(e.currentTarget);
      }
      pendingRef.current = {
        bounds: rectRef.current!,
        clientX: e.clientX,
        clientY: e.clientY,
        currentTarget: e.currentTarget,
        eventTarget: e.target,
      };
      if (rafRef.current === null) {
        rafRef.current = requestAnimationFrame(flush);
      }
    },
    [flush, primePointerTarget],
  );

  useEffect(
    () => () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    },
    [],
  );

  return {
    primePointerTarget,
    schedulePointerMove: schedule,
  };
}
