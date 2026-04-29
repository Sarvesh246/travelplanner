export function computeTripSupplyCost(
  items: Array<{ estimatedCost: number | null; actualCost: number | null }>
) {
  return items.reduce(
    (sum, item) => sum + Number(item.actualCost ?? item.estimatedCost ?? 0),
    0
  );
}

export function computeEstimatedTripCost(input: {
  totalExpenses: number;
  supplyItems: Array<{ estimatedCost: number | null; actualCost: number | null }>;
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
