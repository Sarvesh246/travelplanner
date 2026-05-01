import { SUPPLY_CATEGORIES } from "@/lib/constants";

export const SUPPLY_IMPORT_MAX_FILE_SIZE = 5 * 1024 * 1024;

export type SupplyImportCategory = (typeof SUPPLY_CATEGORIES)[number];

export interface SupplyImportMember {
  userId: string;
  name: string;
  email?: string | null;
}

export interface SupplyImportDraftRow {
  name: string;
  category: SupplyImportCategory;
  quantityNeeded: number;
  estimatedCost: number | null;
  whoBringsId: string | null;
  notes: string | null;
  sourceText: string | null;
  confidence: number;
  warnings: string[];
}

export interface RawSupplyImportDraftRow {
  name?: unknown;
  category?: unknown;
  quantityNeeded?: unknown;
  estimatedCost?: unknown;
  whoBringsId?: unknown;
  notes?: unknown;
  sourceText?: unknown;
  confidence?: unknown;
  warnings?: unknown;
}

export interface NormalizeSupplyImportOptions {
  members: SupplyImportMember[];
}

const CATEGORY_SET = new Set<string>(SUPPLY_CATEGORIES);

export function getSupplyImportSchema() {
  return {
    type: "object",
    additionalProperties: false,
    properties: {
      items: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            name: {
              type: "string",
              description: "Clean supply item name without quantity or assignee notes.",
            },
            category: {
              type: "string",
              enum: [...SUPPLY_CATEGORIES],
              description: "Best matching supply category.",
            },
            quantityNeeded: {
              type: "integer",
              minimum: 0,
              description: "Quantity needed. Use active trip member count for 'each person'.",
            },
            estimatedCost: {
              type: ["number", "null"],
              minimum: 0,
              description: "Estimated cost per item when explicitly stated, otherwise null.",
            },
            whoBringsId: {
              type: ["string", "null"],
              description: "Active trip member userId when the source clearly assigns a person.",
            },
            notes: {
              type: ["string", "null"],
              description: "Relevant notes from parentheses or context that are not assignees.",
            },
            sourceText: {
              type: ["string", "null"],
              description: "Original line or text span used for this item.",
            },
            confidence: {
              type: "number",
              minimum: 0,
              maximum: 1,
              description: "Confidence in this parsed row.",
            },
            warnings: {
              type: "array",
              items: { type: "string" },
              description: "Short warnings for ambiguous values the user should review.",
            },
          },
          required: [
            "name",
            "category",
            "quantityNeeded",
            "estimatedCost",
            "whoBringsId",
            "notes",
            "sourceText",
            "confidence",
            "warnings",
          ],
        },
      },
    },
    required: ["items"],
  };
}

export function normalizeSupplyImportRows(
  rows: RawSupplyImportDraftRow[],
  options: NormalizeSupplyImportOptions
): SupplyImportDraftRow[] {
  const activeUserIds = new Set(options.members.map((member) => member.userId));

  return rows
    .map((row) => normalizeSupplyImportRow(row, activeUserIds))
    .filter((row): row is SupplyImportDraftRow => row !== null);
}

export function validateSupplyImportRowsForCommit(
  rows: RawSupplyImportDraftRow[],
  options: NormalizeSupplyImportOptions
) {
  const activeUserIds = new Set(options.members.map((member) => member.userId));
  const normalized = rows.map((row, index) => validateSupplyImportRowForCommit(row, index, activeUserIds));
  if (normalized.length === 0) {
    throw new Error("Choose at least one valid supply item to import");
  }
  return normalized;
}

function normalizeSupplyImportRow(
  row: RawSupplyImportDraftRow,
  activeUserIds: Set<string>
): SupplyImportDraftRow | null {
  const name = stringOrNull(row.name)?.trim();
  if (!name) return null;

  const category = stringOrNull(row.category);
  const warnings = arrayOfStrings(row.warnings);
  const normalizedCategory = CATEGORY_SET.has(category ?? "") ? category : "Other";
  if (category && normalizedCategory === "Other" && category !== "Other") {
    warnings.push(`Category "${category}" was changed to Other.`);
  }

  const quantityNeeded = normalizeInteger(row.quantityNeeded, 1);
  const estimatedCost = normalizeOptionalNumber(row.estimatedCost);
  const whoBringsId = stringOrNull(row.whoBringsId)?.trim() || null;
  const safeWhoBringsId = whoBringsId && activeUserIds.has(whoBringsId) ? whoBringsId : null;
  if (whoBringsId && !safeWhoBringsId) {
    warnings.push("Assignee was removed because they are not an active trip member.");
  }

  return {
    name,
    category: normalizedCategory as SupplyImportCategory,
    quantityNeeded,
    estimatedCost,
    whoBringsId: safeWhoBringsId,
    notes: stringOrNull(row.notes),
    sourceText: stringOrNull(row.sourceText),
    confidence: clamp(normalizeOptionalNumber(row.confidence) ?? 0.6, 0, 1),
    warnings,
  };
}

function validateSupplyImportRowForCommit(
  row: RawSupplyImportDraftRow,
  index: number,
  activeUserIds: Set<string>
): SupplyImportDraftRow {
  const label = `Import row ${index + 1}`;
  const name = stringOrNull(row.name);
  if (!name) throw new Error(`${label} needs an item name`);

  const category = stringOrNull(row.category);
  if (!category || !CATEGORY_SET.has(category)) {
    throw new Error(`${label} has an invalid category`);
  }

  if (!isNonNegativeInteger(row.quantityNeeded)) {
    throw new Error(`${label} has an invalid quantity`);
  }
  const quantityNeeded = Number(row.quantityNeeded);

  if (!isOptionalNonNegativeNumber(row.estimatedCost)) {
    throw new Error(`${label} has an invalid estimated cost`);
  }
  const estimatedCost = normalizeOptionalNumber(row.estimatedCost);

  const whoBringsId = stringOrNull(row.whoBringsId);
  if (whoBringsId && !activeUserIds.has(whoBringsId)) {
    throw new Error(`${label} has an invalid assignee`);
  }

  const confidence = normalizeOptionalNumber(row.confidence);

  return {
    name,
    category: category as SupplyImportCategory,
    quantityNeeded,
    estimatedCost,
    whoBringsId,
    notes: stringOrNull(row.notes),
    sourceText: stringOrNull(row.sourceText),
    confidence: clamp(confidence ?? 0.6, 0, 1),
    warnings: arrayOfStrings(row.warnings),
  };
}

function stringOrNull(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function arrayOfStrings(value: unknown) {
  return Array.isArray(value)
    ? value
        .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
        .map((item) => item.trim())
    : [];
}

function normalizeInteger(value: unknown, fallback: number) {
  const num = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  if (!Number.isFinite(num)) return fallback;
  return Math.max(0, Math.trunc(num));
}

function normalizeOptionalNumber(value: unknown) {
  if (value == null || value === "") return null;
  const num = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  if (!Number.isFinite(num) || num < 0) return null;
  return num;
}

function isNonNegativeInteger(value: unknown) {
  const num = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  return Number.isInteger(num) && num >= 0;
}

function isOptionalNonNegativeNumber(value: unknown) {
  if (value == null || value === "") return true;
  const num = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  return Number.isFinite(num) && num >= 0;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
