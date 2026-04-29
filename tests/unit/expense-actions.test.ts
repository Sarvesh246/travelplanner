import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  prisma: {
    expense: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    expenseShare: {
      createMany: vi.fn(),
      deleteMany: vi.fn(),
    },
    trip: {
      findUnique: vi.fn(),
    },
    $transaction: vi.fn(),
  },
  getAuthUser: vi.fn(),
  assertCanContribute: vi.fn(),
  assertActiveTripMembers: vi.fn(),
  logAuditEvent: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({ prisma: mocks.prisma }));
vi.mock("@/lib/auth/trip-permissions", () => ({
  getAuthUser: mocks.getAuthUser,
  assertCanContribute: mocks.assertCanContribute,
  assertActiveTripMembers: mocks.assertActiveTripMembers,
}));
vi.mock("@/lib/observability/audit", () => ({
  logAuditEvent: mocks.logAuditEvent,
}));
vi.mock("next/cache", () => ({
  revalidatePath: mocks.revalidatePath,
}));

import { createExpense, updateExpense } from "@/actions/expenses";

describe("expense actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getAuthUser.mockResolvedValue({ id: "user-owner" });
    mocks.assertCanContribute.mockResolvedValue({ role: "MEMBER" });
    mocks.assertActiveTripMembers.mockResolvedValue(new Set(["user-owner", "user-2"]));
    mocks.prisma.trip.findUnique.mockResolvedValue({ currency: "USD" });
    mocks.prisma.expense.findUnique.mockResolvedValue({
      id: "expense-1",
      tripId: "trip-1",
      paidById: "user-owner",
      totalAmount: { toNumber: () => 120, valueOf: () => "120" },
      splitMode: "EQUAL",
      title: "Groceries",
      shares: [
        {
          userId: "user-owner",
          hasPaid: true,
          paidAt: new Date("2026-04-28T00:00:00.000Z"),
        },
        {
          userId: "user-2",
          hasPaid: false,
          paidAt: null,
        },
      ],
    });
    mocks.prisma.$transaction.mockImplementation(async (fn) =>
      fn({
        expense: mocks.prisma.expense,
        expenseShare: mocks.prisma.expenseShare,
      })
    );
    mocks.prisma.expense.create.mockResolvedValue({
      id: "expense-1",
      tripId: "trip-1",
      paidById: "user-owner",
      createdById: "user-owner",
      title: "Groceries",
      description: null,
      category: null,
      totalAmount: { toNumber: () => 120, valueOf: () => "120" },
      currency: "USD",
      splitMode: "EQUAL",
      receiptUrl: null,
      expenseDate: new Date("2026-04-28T00:00:00.000Z"),
      status: "PENDING",
      createdAt: new Date("2026-04-28T00:00:00.000Z"),
      updatedAt: new Date("2026-04-28T00:00:00.000Z"),
      deletedAt: null,
    });
  });

  it("rejects duplicate expense participants", async () => {
    await expect(
      createExpense("trip-1", {
        title: "Groceries",
        totalAmount: 120,
        splitMode: "EQUAL",
        paidById: "user-owner",
        shares: [{ userId: "user-2" }, { userId: "user-2" }],
      })
    ).rejects.toThrow("Each participant can only be added once");

    expect(mocks.prisma.expense.create).not.toHaveBeenCalled();
  });

  it("checks payer and participants against active trip membership", async () => {
    await createExpense("trip-1", {
      title: "Groceries",
      totalAmount: 120,
      splitMode: "EQUAL",
      paidById: "user-owner",
      shares: [{ userId: "user-owner" }, { userId: "user-2" }],
    });

    expect(mocks.assertActiveTripMembers).toHaveBeenCalledWith("trip-1", [
      "user-owner",
      "user-owner",
      "user-2",
    ]);
  });

  it("keeps the payer marked paid when shares are rebuilt", async () => {
    await updateExpense("expense-1", {
      shares: [{ userId: "user-owner" }, { userId: "user-2" }],
    });

    expect(mocks.prisma.expenseShare.createMany).toHaveBeenCalledWith({
      data: expect.arrayContaining([
        expect.objectContaining({
          userId: "user-owner",
          hasPaid: true,
          paidAt: expect.any(Date),
        }),
      ]),
    });
  });

  it("preserves existing paid status for other unchanged participants", async () => {
    mocks.prisma.expense.findUnique.mockResolvedValue({
      id: "expense-1",
      tripId: "trip-1",
      paidById: "user-owner",
      title: "Groceries",
      totalAmount: { toNumber: () => 120, valueOf: () => "120" },
      splitMode: "EQUAL",
      shares: [
        {
          userId: "user-owner",
          hasPaid: true,
          paidAt: new Date("2026-04-28T00:00:00.000Z"),
        },
        {
          userId: "user-2",
          hasPaid: true,
          paidAt: new Date("2026-04-29T00:00:00.000Z"),
        },
      ],
    });

    await updateExpense("expense-1", {
      shares: [{ userId: "user-owner" }, { userId: "user-2" }],
    });

    expect(mocks.prisma.expenseShare.createMany).toHaveBeenCalledWith({
      data: expect.arrayContaining([
        expect.objectContaining({
          userId: "user-2",
          hasPaid: true,
          paidAt: new Date("2026-04-29T00:00:00.000Z"),
        }),
      ]),
    });
  });
});
