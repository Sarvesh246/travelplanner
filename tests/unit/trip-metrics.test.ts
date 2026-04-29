import { describe, expect, it } from "vitest";
import { computeEstimatedTripCost, computeTripSupplyCost } from "@/lib/trip-metrics";

describe("trip metrics", () => {
  it("prefers actual supply costs and falls back to estimates", () => {
    expect(
      computeTripSupplyCost([
        { actualCost: 24, estimatedCost: 10 },
        { actualCost: null, estimatedCost: 18 },
        { actualCost: null, estimatedCost: null },
      ])
    ).toBe(42);
  });

  it("uses the manual trip estimate override when present", () => {
    expect(
      computeEstimatedTripCost({
        totalExpenses: 75,
        supplyItems: [{ actualCost: 20, estimatedCost: 15 }],
        estimatedCostOverride: 140,
      })
    ).toEqual({
      automaticCost: 95,
      estimatedCost: 140,
    });
  });

  it("falls back to the automatic total without an override", () => {
    expect(
      computeEstimatedTripCost({
        totalExpenses: 75,
        supplyItems: [{ actualCost: null, estimatedCost: 20 }],
        estimatedCostOverride: null,
      })
    ).toEqual({
      automaticCost: 95,
      estimatedCost: 95,
    });
  });
});
