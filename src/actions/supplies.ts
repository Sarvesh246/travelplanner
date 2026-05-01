"use server";

import { GoogleGenAI } from "@google/genai";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { SupplyItemStatus } from "@prisma/client";
import {
  assertActiveTripMembers,
  assertCanContribute,
  getAuthUser,
} from "@/lib/auth/trip-permissions";
import { issueUndoToken } from "@/actions/undo";
import { logAuditEvent } from "@/lib/observability/audit";
import {
  getSupplyImportSchema,
  normalizeSupplyImportRows,
  SUPPLY_IMPORT_MAX_FILE_SIZE,
  validateSupplyImportRowsForCommit,
  type RawSupplyImportDraftRow,
  type SupplyImportMember,
} from "@/lib/supplies/import";

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

interface CommitSupplyImportInput {
  sourceType: "text" | "pdf";
  rows: RawSupplyImportDraftRow[];
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

function changedFieldKeys<T extends object>(input: T) {
  return (Object.keys(input) as Array<keyof T & string>).filter(
    (key) => input[key] !== undefined
  );
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
  await logAuditEvent({
    action: "supply.created",
    actorUserId: user.id,
    tripId,
    targetId: item.id,
    summary: `Added supply item ${item.name}`,
    metadata: {
      quantityNeeded,
      whoBringsId,
      category: item.category,
    },
  });
  return { item };
}

export async function parseSupplyImport(tripId: string, formData: FormData) {
  const user = await getAuthUser();
  await assertCanContribute(tripId, user.id);

  const { sourceType, contents } = await readSupplyImportInput(formData);
  const members = await getSupplyImportMembers(tripId);
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("Gemini is not configured. Add GEMINI_API_KEY to your environment.");
  }

  const ai = new GoogleGenAI({ apiKey });
  const prompt = buildSupplyImportPrompt(members);
  const response = await ai.models.generateContent({
    model: process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash",
    contents:
      sourceType === "pdf"
        ? [
            { text: prompt },
            {
              inlineData: {
                mimeType: "application/pdf",
                data: contents,
              },
            },
          ]
        : [{ text: `${prompt}\n\nSupply list text:\n${contents}` }],
    config: {
      responseMimeType: "application/json",
      responseJsonSchema: getSupplyImportSchema(),
      temperature: 0.1,
    },
  });

  const parsed = parseGeminiImportResponse(response.text);
  const rows = normalizeSupplyImportRows(parsed.items, { members });
  if (rows.length === 0) {
    throw new Error("No supply items were found. Try pasting a cleaner checklist or a text-based PDF.");
  }

  return { sourceType, rows };
}

export async function commitSupplyImport(
  tripId: string,
  input: CommitSupplyImportInput
) {
  const user = await getAuthUser();
  await assertCanContribute(tripId, user.id);

  const members = await getSupplyImportMembers(tripId);
  const rows = validateSupplyImportRowsForCommit(input.rows, { members });

  const items = await prisma.$transaction(
    rows.map((row) => {
      const quantityOwned = 0;
      const status = computeStatus(row.quantityNeeded, quantityOwned);
      return prisma.supplyItem.create({
        data: {
          tripId,
          createdById: user.id,
          name: row.name,
          category: row.category,
          quantityNeeded: row.quantityNeeded,
          quantityOwned,
          quantityRemaining: Math.max(0, row.quantityNeeded - quantityOwned),
          estimatedCost: row.estimatedCost,
          whoBringsId: row.whoBringsId,
          notes: row.notes,
          status,
        },
      });
    })
  );

  revalidateSupplyViews(tripId);
  await logAuditEvent({
    action: "supply.imported",
    actorUserId: user.id,
    tripId,
    summary: `Imported ${items.length} supply item${items.length === 1 ? "" : "s"}`,
    metadata: {
      sourceType: input.sourceType,
      itemCount: items.length,
      itemIds: items.map((item) => item.id),
    },
  });

  return { count: items.length, itemIds: items.map((item) => item.id) };
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

export async function updateSupplyItem(
  itemId: string,
  input: UpdateSupplyInput,
  options?: { recordUndo?: boolean }
) {
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

  const snapshot = {
    name: existing.name,
    category: existing.category,
    description: existing.description,
    notes: existing.notes,
    quantityNeeded: existing.quantityNeeded,
    quantityOwned: existing.quantityOwned,
    quantityRemaining: existing.quantityRemaining,
    estimatedCost:
      existing.estimatedCost != null ? Number(existing.estimatedCost) : null,
    actualCost: existing.actualCost != null ? Number(existing.actualCost) : null,
    whoBringsId: existing.whoBringsId,
    whoBoughtId: existing.whoBoughtId,
    status: existing.status,
  };

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
  await logAuditEvent({
    action: "supply.updated",
    actorUserId: user.id,
    tripId: existing.tripId,
    targetId: itemId,
    summary: `Updated supply item ${updated.name}`,
    metadata: {
      changedFields: changedFieldKeys(input),
      status: updated.status,
      whoBringsId: updated.whoBringsId,
      whoBoughtId: updated.whoBoughtId,
    },
  });
  let undoTokenId: string | undefined;
  if (options?.recordUndo !== false) {
    const { tokenId } = await issueUndoToken({
      tripId: existing.tripId,
      kind: "SUPPLY_RESTORE",
      payload: { itemId, snapshot },
    });
    undoTokenId = tokenId;
  }

  return { item: updated, undoTokenId };
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
  await logAuditEvent({
    action: "supply.deleted",
    actorUserId: user.id,
    tripId: existing.tripId,
    targetId: itemId,
    summary: `Deleted supply item ${existing.name}`,
  });
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
  await logAuditEvent({
    action: "supply.restored",
    actorUserId: user.id,
    tripId: existing.tripId,
    targetId: itemId,
    summary: `Restored supply item ${existing.name}`,
  });
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
  await logAuditEvent({
    action: "supply.marked-bought",
    actorUserId: user.id,
    tripId: existing.tripId,
    targetId: itemId,
    summary: `Marked supply item ${existing.name} as bought`,
    metadata: {
      actualCost: actualCost ?? null,
    },
  });
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
  await logAuditEvent({
    action: "supply.bulk-marked-bought",
    actorUserId: user.id,
    tripId,
    summary: `Marked ${items.length} supply items as bought`,
    metadata: {
      itemIds: items.map((item) => item.id),
    },
  });
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
  await logAuditEvent({
    action: "supply.bulk-deleted",
    actorUserId: user.id,
    tripId,
    summary: `Deleted ${items.length} supply items`,
    metadata: {
      itemIds: items.map((item) => item.id),
    },
  });
}

async function getSupplyImportMembers(tripId: string): Promise<SupplyImportMember[]> {
  const members = await prisma.tripMember.findMany({
    where: {
      tripId,
      status: "ACTIVE",
    },
    select: {
      userId: true,
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
    orderBy: { joinedAt: "asc" },
  });

  return members.map((member) => ({
    userId: member.userId,
    name: member.user.name,
    email: member.user.email,
  }));
}

async function readSupplyImportInput(formData: FormData) {
  const text = formData.get("text");
  const file = formData.get("file");
  const pastedText = typeof text === "string" ? text.trim() : "";

  if (pastedText) {
    if (pastedText.length > 30_000) {
      throw new Error("Pasted text must be 30,000 characters or less");
    }
    return { sourceType: "text" as const, contents: pastedText };
  }

  if (!(file instanceof File) || file.size === 0) {
    throw new Error("Paste a supply list or choose a PDF to import");
  }
  if (file.type !== "application/pdf") {
    throw new Error("Supply import only supports PDF files");
  }
  if (file.size > SUPPLY_IMPORT_MAX_FILE_SIZE) {
    throw new Error("PDF must be 5MB or smaller");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  return { sourceType: "pdf" as const, contents: buffer.toString("base64") };
}

function buildSupplyImportPrompt(members: SupplyImportMember[]) {
  const memberCount = members.length;
  const memberLines = members
    .map((member) => `- ${member.name} (${member.email ?? "no email"}): ${member.userId}`)
    .join("\n");

  return `Extract a trip supply checklist into structured supply items.

Rules:
- Return only items that should become supply rows.
- Use exactly one of the allowed categories from the schema.
- Infer quantityNeeded from leading quantities like "2 tents".
- If a line says "for each person" or "each person", use ${memberCount} as quantityNeeded.
- Parentheses containing an active member name mean that member is bringing it only when the name uniquely matches the active member list.
- Parentheses that are not a member assignment should become notes.
- estimatedCost is the per-item cost only when explicitly clear. Use null for missing or ambiguous costs.
- whoBringsId must be one of the active member userIds below or null.
- sourceText should preserve the original line when possible.
- Add warnings for ambiguous assignees, costs, quantities, or jokes/slang that should be reviewed.

Active trip members:
${memberLines || "- None"}`;
}

function parseGeminiImportResponse(text: string | undefined): { items: RawSupplyImportDraftRow[] } {
  if (!text?.trim()) {
    throw new Error("Gemini did not return a parseable supply list");
  }

  try {
    const parsed = JSON.parse(text) as { items?: unknown };
    if (!Array.isArray(parsed.items)) {
      throw new Error("Missing items array");
    }
    return { items: parsed.items as RawSupplyImportDraftRow[] };
  } catch {
    throw new Error("Gemini returned an invalid supply list. Try again with cleaner input.");
  }
}
