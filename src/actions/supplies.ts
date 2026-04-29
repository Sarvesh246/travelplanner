"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { SupplyItemStatus } from "@prisma/client";
import {
  assertActiveTripMembers,
  assertCanContribute,
  getAuthUser,
} from "@/lib/auth/trip-permissions";

function computeStatus(needed: number, owned: number): SupplyItemStatus {
  if (needed <= 0) return "NOT_NEEDED";
  if (owned <= 0) return "NEEDED";
  if (owned >= needed) return "COVERED";
  return "PARTIALLY_COVERED";
}

interface CreateSupplyInput {
  name: string;
  category?: string;
  description?: string;
  quantityNeeded?: number;
  estimatedCost?: number;
  whoBringsId?: string;
  notes?: string;
}

function assertNonNegativeNumber(value: number | undefined | null, label: string) {
  if (value == null) return;
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${label} must be 0 or more`);
  }
}

function assertNonNegativeInteger(value: number | undefined, label: string) {
  if (value === undefined) return;
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${label} must be a whole number 0 or higher`);
  }
}

function normalizeOptionalUserId(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function revalidateSupplyViews(tripId: string) {
  revalidatePath(`/trips/${tripId}/supplies`);
  revalidatePath(`/trips/${tripId}/overview`);
}

export async function createSupplyItem(tripId: string, input: CreateSupplyInput) {
  const user = await getAuthUser();
  await assertCanContribute(tripId, user.id);

  if (!input.name?.trim()) throw new Error("Name is required");
  assertNonNegativeInteger(input.quantityNeeded, "Quantity needed");
  assertNonNegativeNumber(input.estimatedCost, "Estimated cost");
  const whoBringsId = normalizeOptionalUserId(input.whoBringsId);
  if (whoBringsId) {
    await assertActiveTripMembers(tripId, [whoBringsId]);
  }

  const quantityNeeded = input.quantityNeeded ?? 1;
  const quantityOwned = 0;
  const status = computeStatus(quantityNeeded, quantityOwned);

  const item = await prisma.supplyItem.create({
    data: {
      tripId,
      createdById: user.id,
      name: input.name.trim(),
      category: input.category,
      description: input.description,
      quantityNeeded,
      quantityOwned,
      quantityRemaining: Math.max(0, quantityNeeded - quantityOwned),
      estimatedCost: input.estimatedCost,
      whoBringsId,
      notes: input.notes,
      status,
    },
  });

  revalidateSupplyViews(tripId);
  return { item };
}

interface UpdateSupplyInput {
  name?: string;
  category?: string;
  description?: string;
  quantityNeeded?: number;
  quantityOwned?: number;
  estimatedCost?: number | null;
  actualCost?: number | null;
  whoBringsId?: string | null;
  whoBoughtId?: string | null;
  status?: SupplyItemStatus;
  notes?: string;
}

export async function updateSupplyItem(itemId: string, input: UpdateSupplyInput) {
  const user = await getAuthUser();
  const existing = await prisma.supplyItem.findUnique({ where: { id: itemId } });
  if (!existing) throw new Error("Item not found");
  await assertCanContribute(existing.tripId, user.id);

  if (input.name !== undefined && !input.name.trim()) throw new Error("Name is required");
  assertNonNegativeInteger(input.quantityNeeded, "Quantity needed");
  assertNonNegativeInteger(input.quantityOwned, "Quantity owned");
  assertNonNegativeNumber(input.estimatedCost, "Estimated cost");
  assertNonNegativeNumber(input.actualCost, "Actual cost");
  const whoBringsId =
    input.whoBringsId !== undefined ? normalizeOptionalUserId(input.whoBringsId) : undefined;
  const whoBoughtId =
    input.whoBoughtId !== undefined ? normalizeOptionalUserId(input.whoBoughtId) : undefined;
  await assertActiveTripMembers(existing.tripId, [whoBringsId, whoBoughtId]);

  const needed = input.quantityNeeded ?? existing.quantityNeeded;
  const owned = input.quantityOwned ?? existing.quantityOwned;
  const remaining = Math.max(0, needed - owned);
  const autoStatus = input.status ?? computeStatus(needed, owned);

  const updated = await prisma.supplyItem.update({
    where: { id: itemId },
    data: {
      ...(input.name !== undefined && { name: input.name.trim() }),
      ...(input.category !== undefined && { category: input.category }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.notes !== undefined && { notes: input.notes }),
      ...(input.quantityNeeded !== undefined && { quantityNeeded: needed }),
      ...(input.quantityOwned !== undefined && { quantityOwned: owned }),
      quantityRemaining: remaining,
      ...(input.estimatedCost !== undefined && { estimatedCost: input.estimatedCost }),
      ...(input.actualCost !== undefined && { actualCost: input.actualCost }),
      ...(input.whoBringsId !== undefined && { whoBringsId }),
      ...(input.whoBoughtId !== undefined && { whoBoughtId }),
      status: autoStatus,
    },
  });

  revalidateSupplyViews(existing.tripId);
  return { item: updated };
}

export async function deleteSupplyItem(itemId: string) {
  const user = await getAuthUser();
  const existing = await prisma.supplyItem.findUnique({ where: { id: itemId } });
  if (!existing) throw new Error("Item not found");
  await assertCanContribute(existing.tripId, user.id);

  await prisma.supplyItem.update({
    where: { id: itemId },
    data: { deletedAt: new Date() },
  });
  revalidateSupplyViews(existing.tripId);
}

export async function restoreSupplyItem(itemId: string) {
  const user = await getAuthUser();
  const existing = await prisma.supplyItem.findUnique({ where: { id: itemId } });
  if (!existing) throw new Error("Item not found");
  await assertCanContribute(existing.tripId, user.id);

  await prisma.supplyItem.update({
    where: { id: itemId },
    data: { deletedAt: null },
  });
  revalidateSupplyViews(existing.tripId);
}

export async function assignBringer(itemId: string, userId: string | null) {
  return updateSupplyItem(itemId, { whoBringsId: userId });
}

export async function markBought(itemId: string, actualCost?: number | null) {
  const user = await getAuthUser();
  const existing = await prisma.supplyItem.findUnique({ where: { id: itemId } });
  if (!existing) throw new Error("Item not found");
  await assertCanContribute(existing.tripId, user.id);

  const needed = existing.quantityNeeded;

  const updated = await prisma.supplyItem.update({
    where: { id: itemId },
    data: {
      quantityOwned: needed,
      quantityRemaining: 0,
      status: "COVERED",
      whoBoughtId: user.id,
      ...(actualCost !== undefined && { actualCost }),
    },
  });

  revalidateSupplyViews(existing.tripId);
  return { item: updated };
}

export async function bulkMarkBought(itemIds: string[]) {
  const user = await getAuthUser();
  if (itemIds.length === 0) return;

  const items = await prisma.supplyItem.findMany({
    where: { id: { in: itemIds } },
    select: { id: true, tripId: true, quantityNeeded: true },
  });
  if (items.length === 0) return;

  const tripId = items[0].tripId;
  await assertCanContribute(tripId, user.id);
  if (items.some((i) => i.tripId !== tripId)) throw new Error("Items must belong to one trip");

  await prisma.$transaction(
    items.map((item) =>
      prisma.supplyItem.update({
        where: { id: item.id },
        data: {
          quantityOwned: item.quantityNeeded,
          quantityRemaining: 0,
          status: "COVERED",
          whoBoughtId: user.id,
        },
      })
    )
  );

  revalidateSupplyViews(tripId);
}

export async function bulkDeleteSupplyItems(itemIds: string[]) {
  const user = await getAuthUser();
  if (itemIds.length === 0) return;

  const items = await prisma.supplyItem.findMany({
    where: { id: { in: itemIds } },
    select: { id: true, tripId: true },
  });
  if (items.length === 0) return;

  const tripId = items[0].tripId;
  await assertCanContribute(tripId, user.id);
  if (items.some((i) => i.tripId !== tripId)) throw new Error("Items must belong to one trip");

  await prisma.supplyItem.updateMany({
    where: { id: { in: items.map((i) => i.id) } },
    data: { deletedAt: new Date() },
  });

  revalidateSupplyViews(tripId);
}
