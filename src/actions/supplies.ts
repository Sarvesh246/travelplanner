"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { SupplyItemStatus } from "@prisma/client";
import { assertCanContribute, getAuthUser } from "@/lib/auth/trip-permissions";

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

export async function createSupplyItem(tripId: string, input: CreateSupplyInput) {
  const user = await getAuthUser();
  await assertCanContribute(tripId, user.id);

  if (!input.name?.trim()) throw new Error("Name is required");

  const quantityNeeded = Math.max(0, input.quantityNeeded ?? 1);
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
      whoBringsId: input.whoBringsId ?? null,
      notes: input.notes,
      status,
    },
  });

  revalidatePath(`/trips/${tripId}/supplies`);
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

  const needed = input.quantityNeeded ?? existing.quantityNeeded;
  const owned = input.quantityOwned ?? existing.quantityOwned;
  const remaining = Math.max(0, needed - owned);
  const autoStatus = input.status ?? computeStatus(needed, owned);

  const updated = await prisma.supplyItem.update({
    where: { id: itemId },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.category !== undefined && { category: input.category }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.notes !== undefined && { notes: input.notes }),
      ...(input.quantityNeeded !== undefined && { quantityNeeded: needed }),
      ...(input.quantityOwned !== undefined && { quantityOwned: owned }),
      quantityRemaining: remaining,
      ...(input.estimatedCost !== undefined && { estimatedCost: input.estimatedCost }),
      ...(input.actualCost !== undefined && { actualCost: input.actualCost }),
      ...(input.whoBringsId !== undefined && { whoBringsId: input.whoBringsId }),
      ...(input.whoBoughtId !== undefined && { whoBoughtId: input.whoBoughtId }),
      status: autoStatus,
    },
  });

  revalidatePath(`/trips/${existing.tripId}/supplies`);
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
  revalidatePath(`/trips/${existing.tripId}/supplies`);
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

  revalidatePath(`/trips/${existing.tripId}/supplies`);
  return { item: updated };
}
