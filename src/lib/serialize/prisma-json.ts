import type { Prisma, Trip } from "@prisma/client";

/** JSON-safe for React Server / server-action payloads (no Decimal, Date as ISO). */
export function tripToClientJson(t: Trip) {
  return {
    id: t.id,
    name: t.name,
    description: t.description,
    coverImageUrl: t.coverImageUrl,
    status: t.status,
    currency: t.currency,
    budgetTarget: decimalToNumberOrNull(t.budgetTarget),
    startDate: t.startDate ? t.startDate.toISOString() : null,
    endDate: t.endDate ? t.endDate.toISOString() : null,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
    deletedAt: t.deletedAt ? t.deletedAt.toISOString() : null,
  };
}

export function decimalToNumberOrNull(v: Prisma.Decimal | null | undefined): number | null {
  if (v == null) return null;
  return v.toNumber();
}
