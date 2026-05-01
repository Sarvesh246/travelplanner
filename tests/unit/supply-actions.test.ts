import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  prisma: {
    $transaction: vi.fn((queries: Promise<unknown>[]) => Promise.all(queries)),
    supplyItem: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
      updateMany: vi.fn(),
    },
    tripMember: {
      findMany: vi.fn(),
    },
  },
  getAuthUser: vi.fn(),
  assertCanContribute: vi.fn(),
  assertActiveTripMembers: vi.fn(),
  revalidatePath: vi.fn(),
  issueUndoToken: vi.fn(),
  logAuditEvent: vi.fn(),
  generateContent: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({ prisma: mocks.prisma }));
vi.mock("@/lib/auth/trip-permissions", () => ({
  getAuthUser: mocks.getAuthUser,
  assertCanContribute: mocks.assertCanContribute,
  assertActiveTripMembers: mocks.assertActiveTripMembers,
}));
vi.mock("next/cache", () => ({
  revalidatePath: mocks.revalidatePath,
}));
vi.mock("@/actions/undo", () => ({
  issueUndoToken: mocks.issueUndoToken,
}));
vi.mock("@/lib/observability/audit", () => ({
  logAuditEvent: mocks.logAuditEvent,
}));
vi.mock("@google/genai", () => ({
  GoogleGenAI: vi.fn(function GoogleGenAI() {
    return {
      models: {
        generateContent: mocks.generateContent,
      },
    };
  }),
}));

import {
  commitSupplyImport,
  createSupplyItem,
  parseSupplyImport,
  updateSupplyItem,
} from "@/actions/supplies";

describe("supply actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getAuthUser.mockResolvedValue({ id: "user-1" });
    mocks.assertCanContribute.mockResolvedValue({ role: "MEMBER" });
    mocks.assertActiveTripMembers.mockResolvedValue(new Set(["user-2"]));
    mocks.issueUndoToken.mockResolvedValue({
      tokenId: "tok-undo",
      expiresAt: new Date().toISOString(),
    });
    mocks.prisma.supplyItem.create.mockImplementation(
      async ({ data }: { data: Record<string, unknown> & { name: string } }) => ({
      id: `item-${data.name}`,
      ...data,
      })
    );
    mocks.prisma.tripMember.findMany.mockResolvedValue([
      {
        userId: "user-1",
        user: { name: "Sam", email: "sam@example.com" },
      },
      {
        userId: "user-2",
        user: { name: "Will", email: "will@example.com" },
      },
    ]);
    mocks.prisma.supplyItem.findUnique.mockResolvedValue({
      id: "item-1",
      tripId: "trip-1",
      name: "Camp stove",
      category: null,
      description: null,
      notes: null,
      quantityNeeded: 2,
      quantityOwned: 0,
      quantityRemaining: 2,
      estimatedCost: null,
      actualCost: null,
      whoBringsId: null,
      whoBoughtId: null,
      status: "NEEDED",
      createdById: "user-1",
    });
  });

  it("rejects negative quantities before creating an item", async () => {
    await expect(
      createSupplyItem("trip-1", {
        name: "Water filter",
        quantityNeeded: -1,
      })
    ).rejects.toThrow("Quantity needed must be a whole number 0 or higher");

    expect(mocks.prisma.supplyItem.create).not.toHaveBeenCalled();
  });

  it("verifies assignees are active trip members", async () => {
    await createSupplyItem("trip-1", {
      name: "Camp stove",
      whoBringsId: " user-2 ",
    });

    expect(mocks.assertActiveTripMembers).toHaveBeenCalledWith("trip-1", ["user-2"]);
  });

  it("turns blank assignees into unassigned instead of writing empty user ids", async () => {
    mocks.prisma.supplyItem.update.mockResolvedValue({ id: "item-1" });

    await updateSupplyItem("item-1", { whoBringsId: "   " });

    expect(mocks.prisma.supplyItem.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ whoBringsId: null }),
      })
    );
  });

  it("parses a pasted list through Gemini and normalizes quantities, categories, assignees, and notes", async () => {
    process.env.GEMINI_API_KEY = "test-key";
    mocks.generateContent.mockResolvedValue({
      text: JSON.stringify({
        items: [
          {
            name: "Tents",
            category: "Gear",
            quantityNeeded: 2,
            estimatedCost: null,
            whoBringsId: null,
            notes: "fit 5+ people",
            sourceText: "2 tents (fit 5+ people)",
            confidence: 0.9,
            warnings: [],
          },
          {
            name: "Cooler",
            category: "Gear",
            quantityNeeded: 1,
            estimatedCost: null,
            whoBringsId: "user-2",
            notes: null,
            sourceText: "Cooler (Will)",
            confidence: 0.95,
            warnings: [],
          },
          {
            name: "Compass",
            category: "Gear",
            quantityNeeded: 1,
            estimatedCost: null,
            whoBringsId: null,
            notes: "Cum-piss",
            sourceText: "Compass (Cum-piss)",
            confidence: 0.7,
            warnings: ["Review parenthetical note."],
          },
        ],
      }),
    });

    const fd = new FormData();
    fd.set("text", "2 tents (fit 5+ people)\nCooler (Will)\nCompass (Cum-piss)");

    const result = await parseSupplyImport("trip-1", fd);

    expect(result.sourceType).toBe("text");
    expect(result.rows).toMatchObject([
      { name: "Tents", category: "Gear", quantityNeeded: 2, notes: "fit 5+ people" },
      { name: "Cooler", whoBringsId: "user-2" },
      { name: "Compass", notes: "Cum-piss" },
    ]);
  });

  it("rejects empty pasted import input before calling Gemini", async () => {
    const fd = new FormData();
    fd.set("text", "   ");

    await expect(parseSupplyImport("trip-1", fd)).rejects.toThrow(
      "Paste a supply list or choose a PDF to import"
    );

    expect(mocks.generateContent).not.toHaveBeenCalled();
  });

  it("rejects oversized PDF imports before calling Gemini", async () => {
    const fd = new FormData();
    const oversized = new File([new Uint8Array(5 * 1024 * 1024 + 1)], "supplies.pdf", {
      type: "application/pdf",
    });
    fd.set("file", oversized);

    await expect(parseSupplyImport("trip-1", fd)).rejects.toThrow("PDF must be 5MB or smaller");

    expect(mocks.generateContent).not.toHaveBeenCalled();
  });

  it("commits reviewed import rows in a transaction", async () => {
    const result = await commitSupplyImport("trip-1", {
      sourceType: "text",
      rows: [
        {
          name: "Hiking shoes",
          category: "Clothing",
          quantityNeeded: 2,
          estimatedCost: 40,
          whoBringsId: "user-2",
          notes: null,
          sourceText: "Hiking shoes for each person",
          confidence: 0.8,
          warnings: [],
        },
      ],
    });

    expect(mocks.prisma.$transaction).toHaveBeenCalled();
    expect(mocks.prisma.supplyItem.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: "Hiking shoes",
          category: "Clothing",
          quantityNeeded: 2,
          quantityRemaining: 2,
          estimatedCost: 40,
          whoBringsId: "user-2",
          status: "NEEDED",
        }),
      })
    );
    expect(mocks.logAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({ action: "supply.imported" })
    );
    expect(result).toMatchObject({ count: 1, itemIds: ["item-Hiking shoes"] });
  });

  it("rejects invalid categories before committing import rows", async () => {
    await expect(commitSupplyImport("trip-1", {
      sourceType: "text",
      rows: [
        {
          name: "Mystery thing",
          category: "Tools",
          quantityNeeded: 1,
          estimatedCost: null,
          whoBringsId: null,
          notes: null,
          sourceText: "Mystery thing (Alex)",
          confidence: 0.4,
          warnings: [],
        },
      ],
    })).rejects.toThrow("Import row 1 has an invalid category");

    expect(mocks.prisma.supplyItem.create).not.toHaveBeenCalled();
  });

  it("rejects unknown assignees before committing import rows", async () => {
    await expect(commitSupplyImport("trip-1", {
      sourceType: "text",
      rows: [
        {
          name: "Cooler",
          category: "Gear",
          quantityNeeded: 1,
          estimatedCost: null,
          whoBringsId: "missing-user",
          notes: null,
          sourceText: "Cooler (Alex)",
          confidence: 0.4,
          warnings: [],
        },
      ],
    })).rejects.toThrow("Import row 1 has an invalid assignee");

    expect(mocks.prisma.supplyItem.create).not.toHaveBeenCalled();
  });

  it("rejects negative import quantities before committing rows", async () => {
    await expect(commitSupplyImport("trip-1", {
      sourceType: "text",
      rows: [
        {
          name: "Water",
          category: "Food",
          quantityNeeded: -1,
          estimatedCost: null,
          whoBringsId: null,
          notes: null,
          sourceText: "Water",
          confidence: 0.8,
          warnings: [],
        },
      ],
    })).rejects.toThrow("Import row 1 has an invalid quantity");

    expect(mocks.prisma.supplyItem.create).not.toHaveBeenCalled();
  });
});
