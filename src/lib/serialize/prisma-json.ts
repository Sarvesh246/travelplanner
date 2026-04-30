import type { Activity, Expense, Prisma, Stay, Stop, Trip } from "@prisma/client";

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
    estimatedCostOverride: decimalToNumberOrNull(t.estimatedCostOverride),
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

/** Prisma `Stop` — `latitude` / `longitude` are Decimals. */
export function stopToClientJson(s: Stop) {
  return {
    id: s.id,
    tripId: s.tripId,
    name: s.name,
    country: s.country,
    description: s.description,
    latitude: decimalToNumberOrNull(s.latitude),
    longitude: decimalToNumberOrNull(s.longitude),
    placeId: s.placeId,
    sortOrder: s.sortOrder,
    arrivalDate: s.arrivalDate ? s.arrivalDate.toISOString() : null,
    departureDate: s.departureDate ? s.departureDate.toISOString() : null,
    status: s.status,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
    deletedAt: s.deletedAt ? s.deletedAt.toISOString() : null,
  };
}

export function stayToClientJson(s: Stay) {
  return {
    id: s.id,
    stopId: s.stopId,
    createdById: s.createdById,
    name: s.name,
    address: s.address,
    url: s.url,
    roomSiteNumbers: s.roomSiteNumbers,
    confirmationNo: s.confirmationNo,
    arrivalTime: s.arrivalTime,
    checkIn: s.checkIn ? s.checkIn.toISOString() : null,
    checkInTime: s.checkInTime,
    checkOut: s.checkOut ? s.checkOut.toISOString() : null,
    checkOutTime: s.checkOutTime,
    leaveTime: s.leaveTime,
    pricePerNight: decimalToNumberOrNull(s.pricePerNight),
    totalPrice: decimalToNumberOrNull(s.totalPrice),
    currency: s.currency,
    status: s.status,
    notes: s.notes,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
    deletedAt: s.deletedAt ? s.deletedAt.toISOString() : null,
  };
}

export function activityToClientJson(a: Activity) {
  return {
    id: a.id,
    stopId: a.stopId,
    createdById: a.createdById,
    name: a.name,
    description: a.description,
    address: a.address,
    url: a.url,
    scheduledDate: a.scheduledDate ? a.scheduledDate.toISOString() : null,
    startTime: a.startTime,
    endTime: a.endTime,
    durationMins: a.durationMins,
    estimatedCost: decimalToNumberOrNull(a.estimatedCost),
    actualCost: decimalToNumberOrNull(a.actualCost),
    status: a.status,
    sortOrder: a.sortOrder,
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
    deletedAt: a.deletedAt ? a.deletedAt.toISOString() : null,
  };
}

export function expenseToClientJson(e: Expense) {
  return {
    id: e.id,
    tripId: e.tripId,
    paidById: e.paidById,
    createdById: e.createdById,
    title: e.title,
    description: e.description,
    category: e.category,
    totalAmount: e.totalAmount.toNumber(),
    currency: e.currency,
    splitMode: e.splitMode,
    receiptUrl: e.receiptUrl,
    expenseDate: e.expenseDate.toISOString(),
    status: e.status,
    createdAt: e.createdAt.toISOString(),
    updatedAt: e.updatedAt.toISOString(),
    deletedAt: e.deletedAt ? e.deletedAt.toISOString() : null,
  };
}
