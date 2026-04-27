/** Scroll-spine path math: pre-sampled geometry to avoid repeated SVG API calls during scroll. */

export const SPINE_CLAMP = { min: 0.015, max: 0.985 } as const;

export const SPINE_SAMPLE_COUNT = 384;

export type SpineSample = { p: number; x: number; y: number };

export function buildSpineSamples(path: SVGPathElement): {
  totalLength: number;
  samples: SpineSample[];
} {
  const totalLength = path.getTotalLength();
  const samples: SpineSample[] = [];
  const span = SPINE_CLAMP.max - SPINE_CLAMP.min;
  for (let i = 0; i < SPINE_SAMPLE_COUNT; i++) {
    const t = i / (SPINE_SAMPLE_COUNT - 1);
    const p = SPINE_CLAMP.min + t * span;
    const pt = path.getPointAtLength(totalLength * p);
    samples.push({ p, x: pt.x, y: pt.y });
  }
  return { totalLength, samples };
}

export function spineScreenY(sampleY: number, rect: DOMRect): number {
  return rect.top + (sampleY / 100) * rect.height;
}

export function interpolateSpinePoint(
  samples: SpineSample[],
  progress: number,
  rect: DOMRect,
): { progress: number; screenY: number; x: number; y: number } {
  const clamped = Math.max(SPINE_CLAMP.min, Math.min(SPINE_CLAMP.max, progress));
  const span = SPINE_CLAMP.max - SPINE_CLAMP.min;
  const t = (clamped - SPINE_CLAMP.min) / span;
  const fi = t * (samples.length - 1);
  const i = Math.floor(fi);
  const frac = fi - i;
  if (i >= samples.length - 1) {
    const s = samples[samples.length - 1];
    return {
      progress: clamped,
      screenY: spineScreenY(s.y, rect),
      x: s.x,
      y: s.y,
    };
  }
  const a = samples[i];
  const b = samples[i + 1];
  const x = a.x + (b.x - a.x) * frac;
  const y = a.y + (b.y - a.y) * frac;
  return {
    progress: clamped,
    screenY: spineScreenY(y, rect),
    x,
    y,
  };
}

export function exactSpinePoint(
  path: SVGPathElement,
  totalLength: number,
  progress: number,
  rect: DOMRect,
): { progress: number; screenY: number; x: number; y: number } {
  const clamped = Math.max(SPINE_CLAMP.min, Math.min(SPINE_CLAMP.max, progress));
  const pt = path.getPointAtLength(totalLength * clamped);
  return {
    progress: clamped,
    screenY: spineScreenY(pt.y, rect),
    x: pt.x,
    y: pt.y,
  };
}

/** Maps a viewport Y (px) to path progress; samples must follow increasing screen Y. */
export function progressForScreenY(
  samples: SpineSample[],
  rect: DOMRect,
  targetY: number,
): number {
  const n = samples.length;
  const sy = (i: number) => spineScreenY(samples[i].y, rect);
  const sy0 = sy(0);
  const syLast = sy(n - 1);

  if (targetY <= sy0) return samples[0].p;
  if (targetY >= syLast) return samples[n - 1].p;

  let lo = 0;
  let hi = n - 1;
  while (lo < hi) {
    const mid = Math.floor((lo + hi + 1) / 2);
    if (sy(mid) <= targetY) lo = mid;
    else hi = mid - 1;
  }

  const a = samples[lo];
  const b = samples[lo + 1];
  const syA = spineScreenY(a.y, rect);
  const syB = spineScreenY(b.y, rect);
  if (syB === syA) return a.p;
  const frac = (targetY - syA) / (syB - syA);
  return a.p + (b.p - a.p) * frac;
}
