export function computeTripSupplyCost(
  items: Array<{
    estimatedCost: number | null;
    actualCost: number | null;
    quantityNeeded?: number | null;
  }>
) {
  return items.reduce(
    (sum, item) =>
      sum +
      (item.actualCost != null
        ? Number(item.actualCost)
        : Number(item.estimatedCost ?? 0) * Math.max(1, item.quantityNeeded ?? 1)),
    0
  );
}

export function computeEstimatedTripCost(input: {
  totalExpenses: number;
  supplyItems: Array<{
    estimatedCost: number | null;
    actualCost: number | null;
    quantityNeeded?: number | null;
  }>;
  estimatedCostOverride: number | null;
}) {
  const automaticCost = input.totalExpenses + computeTripSupplyCost(input.supplyItems);
  return {
    automaticCost,
    estimatedCost:
      input.estimatedCostOverride != null
        ? Number(input.estimatedCostOverride)
        : automaticCost,
  };
}
