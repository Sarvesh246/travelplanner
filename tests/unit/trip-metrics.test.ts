import { describe, expect, it } from "vitest";
import { computeEstimatedTripCost, computeTripSupplyCost } from "@/lib/trip-metrics";

describe("trip metrics", () => {
  it("multiplies supply estimated cost by quantity needed", () => {
    expect(
      computeTripSupplyCost([{ estimatedCost: 20, actualCost: null, quantityNeeded: 3 }])
    ).toBe(60);
  });

  it("uses the group total when calculating the estimated trip cost", () => {
    expect(
      computeEstimatedTripCost({
        totalExpenses: 40,
        supplyItems: [{ estimatedCost: 20, actualCost: null, quantityNeeded: 3 }],
        estimatedCostOverride: null,
      })
    ).toEqual({
      automaticCost: 100,
      estimatedCost: 100,
    });
  });

  it("prefers actual supply cost as the final group amount", () => {
    expect(
      computeTripSupplyCost([{ estimatedCost: 20, actualCost: 42, quantityNeeded: 3 }])
    ).toBe(42);
  });
});
