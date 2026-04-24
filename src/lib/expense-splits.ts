export type SplitMode = "EQUAL" | "WEIGHTED" | "CUSTOM";

export interface SplitParticipant {
  userId: string;
  name: string;
  weight?: number;
  customAmount?: number;
}

export interface ComputedShare {
  userId: string;
  amount: number;
  percentage: number;
}

export function computeShares(
  totalAmount: number,
  participants: SplitParticipant[],
  mode: SplitMode
): ComputedShare[] {
  if (participants.length === 0) return [];
  const total = Math.round(totalAmount * 100); // work in cents

  if (mode === "EQUAL") {
    const base = Math.floor(total / participants.length);
    const remainder = total - base * participants.length;
    return participants.map((p, i) => ({
      userId: p.userId,
      amount: (base + (i < remainder ? 1 : 0)) / 100,
      percentage: 100 / participants.length,
    }));
  }

  if (mode === "WEIGHTED") {
    const weights = participants.map((p) => p.weight ?? 1);
    const sumWeights = weights.reduce((a, b) => a + b, 0);
    const rawAmounts = weights.map((w) => Math.floor((w / sumWeights) * total));
    const distributed = rawAmounts.reduce((a, b) => a + b, 0);
    const remainder = total - distributed;
    return participants.map((p, i) => ({
      userId: p.userId,
      amount: (rawAmounts[i] + (i < remainder ? 1 : 0)) / 100,
      percentage: ((p.weight ?? 1) / sumWeights) * 100,
    }));
  }

  // CUSTOM mode — use provided amounts directly
  return participants.map((p) => ({
    userId: p.userId,
    amount: p.customAmount ?? 0,
    percentage:
      totalAmount > 0 ? ((p.customAmount ?? 0) / totalAmount) * 100 : 0,
  }));
}

export function validateCustomSplit(
  totalAmount: number,
  participants: SplitParticipant[]
): { valid: boolean; remaining: number } {
  const sum = participants.reduce((a, p) => a + (p.customAmount ?? 0), 0);
  const remaining = Math.round((totalAmount - sum) * 100) / 100;
  return { valid: Math.abs(remaining) < 0.01, remaining };
}

export function defaultWeights(
  userIds: string[]
): Record<string, number> {
  return Object.fromEntries(userIds.map((id) => [id, 1]));
}
