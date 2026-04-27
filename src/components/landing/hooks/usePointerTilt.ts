"use client";

import { useMotionValue, useSpring, useTransform } from "framer-motion";
import { useCallback } from "react";
import {
  useRafPendingPointer,
  type RafPendingPointerPayload,
} from "./useRafPendingPointer";

type PointerTiltOptions = {
  bounds: {
    x: [number, number];
    y: [number, number];
  };
  inputRange: {
    x: number;
    y: number;
  };
  spring?: {
    damping: number;
    stiffness: number;
  };
  resolveOffset?: (payload: RafPendingPointerPayload) => { x: number; y: number };
};

export function usePointerTilt({
  bounds,
  inputRange,
  resolveOffset,
  spring,
}: PointerTiltOptions) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateYBase = useTransform(
    x,
    [-inputRange.x, inputRange.x],
    bounds.x,
  );
  const rotateXBase = useTransform(
    y,
    [-inputRange.y, inputRange.y],
    bounds.y,
  );
  const springConfig = spring ?? {
    damping: 999,
    stiffness: 999,
  };
  const rotateYSpring = useSpring(rotateYBase, springConfig);
  const rotateXSpring = useSpring(rotateXBase, springConfig);
  const rotateY = spring ? rotateYSpring : rotateYBase;
  const rotateX = spring ? rotateXSpring : rotateXBase;

  const updateFromPointer = useCallback(
    (payload: RafPendingPointerPayload) => {
      const offset = resolveOffset
        ? resolveOffset(payload)
        : {
            x: payload.clientX - payload.bounds.left - payload.bounds.width / 2,
            y: payload.clientY - payload.bounds.top - payload.bounds.height / 2,
          };
      x.set(offset.x);
      y.set(offset.y);
    },
    [resolveOffset, x, y],
  );

  const pointer = useRafPendingPointer(updateFromPointer);

  const reset = useCallback(() => {
    x.set(0);
    y.set(0);
  }, [x, y]);

  return {
    primePointerTarget: pointer.primePointerTarget,
    reset,
    rotateX,
    rotateY,
    schedulePointerMove: pointer.schedulePointerMove,
  };
}
