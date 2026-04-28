import { describe, expect, it } from "vitest";
import {
  computeShares,
  validateCustomSplit,
  defaultWeights,
  type SplitParticipant,
} from "@/lib/expense-splits";

const people = (n: number): SplitParticipant[] =>
  Array.from({ length: n }, (_, i) => ({ userId: `u${i}`, name: `User ${i}` }));

describe("computeShares — EQUAL", () => {
  it("returns empty array when no participants", () => {
    expect(computeShares(100, [], "EQUAL")).toEqual([]);
  });

  it("splits evenly when divisible", () => {
    const shares = computeShares(100, people(4), "EQUAL");
    expect(shares).toHaveLength(4);
    expect(shares.every((s) => s.amount === 25)).toBe(true);
    expect(shares.every((s) => s.percentage === 25)).toBe(true);
  });

  it("distributes remainder cents to the first participants", () => {
    // 10.00 / 3 = 3.33 with 1 cent remainder → first user gets 3.34
    const shares = computeShares(10, people(3), "EQUAL");
    const sumCents = shares.reduce((acc, s) => acc + Math.round(s.amount * 100), 0);
    expect(sumCents).toBe(1000);
    expect(shares[0].amount).toBeGreaterThanOrEqual(shares[1].amount);
  });

  it("never loses or invents cents", () => {
    for (const total of [12.34, 99.99, 100, 0.07]) {
      for (const n of [1, 2, 3, 5, 7]) {
        const shares = computeShares(total, people(n), "EQUAL");
        const sum = shares.reduce((acc, s) => acc + Math.round(s.amount * 100), 0);
        expect(sum).toBe(Math.round(total * 100));
      }
    }
  });
});

describe("computeShares — WEIGHTED", () => {
  it("scales by weight", () => {
    const participants: SplitParticipant[] = [
      { userId: "a", name: "A", weight: 1 },
      { userId: "b", name: "B", weight: 3 },
    ];
    const shares = computeShares(100, participants, "WEIGHTED");
    expect(shares[0].amount).toBe(25);
    expect(shares[1].amount).toBe(75);
  });

  it("falls back to weight=1 when missing", () => {
    const participants: SplitParticipant[] = [
      { userId: "a", name: "A" },
      { userId: "b", name: "B" },
    ];
    const shares = computeShares(50, participants, "WEIGHTED");
    expect(shares[0].amount).toBe(25);
    expect(shares[1].amount).toBe(25);
  });

  it("preserves cent total across odd weights", () => {
    const participants: SplitParticipant[] = [
      { userId: "a", name: "A", weight: 2 },
      { userId: "b", name: "B", weight: 3 },
      { userId: "c", name: "C", weight: 5 },
    ];
    const shares = computeShares(33.37, participants, "WEIGHTED");
    const sum = shares.reduce((acc, s) => acc + Math.round(s.amount * 100), 0);
    expect(sum).toBe(3337);
  });
});

describe("computeShares — CUSTOM", () => {
  it("uses provided customAmounts directly", () => {
    const participants: SplitParticipant[] = [
      { userId: "a", name: "A", customAmount: 12.5 },
      { userId: "b", name: "B", customAmount: 7.5 },
    ];
    const shares = computeShares(20, participants, "CUSTOM");
    expect(shares.map((s) => s.amount)).toEqual([12.5, 7.5]);
  });

  it("computes percentages from customAmount when total > 0", () => {
    const participants: SplitParticipant[] = [
      { userId: "a", name: "A", customAmount: 25 },
      { userId: "b", name: "B", customAmount: 75 },
    ];
    const shares = computeShares(100, participants, "CUSTOM");
    expect(shares[0].percentage).toBe(25);
    expect(shares[1].percentage).toBe(75);
  });

  it("returns 0% when total is 0", () => {
    const participants: SplitParticipant[] = [
      { userId: "a", name: "A", customAmount: 0 },
    ];
    const shares = computeShares(0, participants, "CUSTOM");
    expect(shares[0].percentage).toBe(0);
  });

  it("treats missing customAmount as 0", () => {
    const participants: SplitParticipant[] = [
      { userId: "a", name: "A" },
      { userId: "b", name: "B", customAmount: 10 },
    ];
    const shares = computeShares(10, participants, "CUSTOM");
    expect(shares[0].amount).toBe(0);
  });
});

describe("validateCustomSplit", () => {
  it("flags valid split when sum matches total", () => {
    const result = validateCustomSplit(100, [
      { userId: "a", name: "A", customAmount: 60 },
      { userId: "b", name: "B", customAmount: 40 },
    ]);
    expect(result.valid).toBe(true);
    expect(result.remaining).toBe(0);
  });

  it("returns positive remaining when under-allocated", () => {
    const result = validateCustomSplit(100, [
      { userId: "a", name: "A", customAmount: 30 },
    ]);
    expect(result.valid).toBe(false);
    expect(result.remaining).toBe(70);
  });

  it("returns negative remaining when over-allocated", () => {
    const result = validateCustomSplit(100, [
      { userId: "a", name: "A", customAmount: 60 },
      { userId: "b", name: "B", customAmount: 60 },
    ]);
    expect(result.valid).toBe(false);
    expect(result.remaining).toBe(-20);
  });

  it("tolerates sub-cent floating-point drift", () => {
    const result = validateCustomSplit(0.3, [
      { userId: "a", name: "A", customAmount: 0.1 },
      { userId: "b", name: "B", customAmount: 0.1 },
      { userId: "c", name: "C", customAmount: 0.1 },
    ]);
    expect(result.valid).toBe(true);
  });
});

describe("defaultWeights", () => {
  it("creates weight=1 for each id", () => {
    expect(defaultWeights(["a", "b", "c"])).toEqual({ a: 1, b: 1, c: 1 });
  });

  it("returns empty object for empty input", () => {
    expect(defaultWeights([])).toEqual({});
  });
});
