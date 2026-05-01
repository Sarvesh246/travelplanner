import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  prisma: {
    trip: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
  getAuthUser: vi.fn(),
  assertCanManage: vi.fn(),
  logAuditEvent: vi.fn(),
  reportServerError: vi.fn(),
  publishTripMembershipEvent: vi.fn(),
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
  parsePlanningDateInput: vi.fn(),
  assertDateOrder: vi.fn(),
  normalizePlanningDateKey: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({ prisma: mocks.prisma }));
vi.mock("@/lib/auth/trip-permissions", () => ({
  getAuthUser: mocks.getAuthUser,
  assertCanManage: mocks.assertCanManage,
  assertCanView: vi.fn(),
  assertOwner: vi.fn(),
}));
vi.mock("@/lib/observability/audit", () => ({
  logAuditEvent: mocks.logAuditEvent,
}));
vi.mock("@/lib/observability/errors", () => ({
  reportServerError: mocks.reportServerError,
}));
vi.mock("@/lib/supabase/trip-membership-realtime", () => ({
  publishTripMembershipEvent: mocks.publishTripMembershipEvent,
}));
vi.mock("@/lib/calendar/planning-dates", () => ({
  parsePlanningDateInput: mocks.parsePlanningDateInput,
  assertDateOrder: mocks.assertDateOrder,
  normalizePlanningDateKey: mocks.normalizePlanningDateKey,
}));
vi.mock("next/cache", () => ({
  revalidatePath: mocks.revalidatePath,
  revalidateTag: mocks.revalidateTag,
}));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@/lib/supabase/admin", () => ({ getSupabaseAdminClient: vi.fn() }));
import { createTrip, updateTrip } from "@/actions/trips";

describe("trip actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getAuthUser.mockResolvedValue({ id: "user-1" });
    mocks.assertCanManage.mockResolvedValue({ role: "OWNER" });
    mocks.parsePlanningDateInput.mockImplementation(async (value: string | null | undefined) =>
      value ? new Date(`${value}T00:00:00.000Z`) : undefined
    );
    mocks.assertDateOrder.mockImplementation(async (startDate: string | null | undefined, endDate: string | null | undefined) => {
      if (startDate && endDate && startDate > endDate) {
        throw new Error("End date must be after the start date");
      }
    });
    mocks.normalizePlanningDateKey.mockImplementation((value: string | Date | null | undefined) => {
      if (!value) return null;
      if (typeof value === "string") return value.slice(0, 10);
      return value.toISOString().slice(0, 10);
    });
    mocks.prisma.trip.findUnique.mockResolvedValue({
      startDate: new Date("2026-06-01T00:00:00.000Z"),
      endDate: new Date("2026-06-05T00:00:00.000Z"),
    });
  });

  it("rejects trips whose end date is before the start date", async () => {
    await expect(
      createTrip({
        name: "High Sierra",
        startDate: "2026-06-05",
        endDate: "2026-06-01",
        currency: "USD",
      })
    ).rejects.toThrow("End date must be after the start date");

    expect(mocks.prisma.trip.create).not.toHaveBeenCalled();
  });

  it("rejects unsupported status values before updating", async () => {
    await expect(
      updateTrip("trip-1", { status: "LAUNCHED" as never })
    ).rejects.toThrow();

    expect(mocks.prisma.trip.update).not.toHaveBeenCalled();
  });

  it("trims names and stores blank descriptions as null on update", async () => {
    mocks.prisma.trip.update.mockResolvedValue({
      id: "trip-1",
      name: "Alpine Loop",
      description: null,
      coverImageUrl: null,
      status: "PLANNING",
      currency: "USD",
      budgetTarget: null,
      estimatedCostOverride: null,
      costSplitMemberCountOverride: null,
      startDate: null,
      endDate: null,
      createdAt: new Date("2026-04-28T00:00:00.000Z"),
      updatedAt: new Date("2026-04-28T00:00:00.000Z"),
      deletedAt: null,
    });

    await updateTrip("trip-1", { name: "  Alpine Loop  ", description: "   " });

    expect(mocks.prisma.trip.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: "Alpine Loop",
          description: null,
        }),
      })
    );
  });

  it("clears dates when the client sends null", async () => {
    mocks.prisma.trip.update.mockResolvedValue({
      id: "trip-1",
      name: "Alpine Loop",
      description: null,
      coverImageUrl: null,
      status: "PLANNING",
      currency: "USD",
      budgetTarget: null,
      estimatedCostOverride: null,
      costSplitMemberCountOverride: null,
      startDate: null,
      endDate: null,
      createdAt: new Date("2026-04-28T00:00:00.000Z"),
      updatedAt: new Date("2026-04-28T00:00:00.000Z"),
      deletedAt: null,
    });

    await updateTrip("trip-1", { startDate: null, endDate: null });

    expect(mocks.prisma.trip.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          startDate: null,
          endDate: null,
        }),
      })
    );
  });

  it("stores a custom split member count override", async () => {
    mocks.prisma.trip.update.mockResolvedValue({
      id: "trip-1",
      name: "Alpine Loop",
      description: null,
      coverImageUrl: null,
      status: "PLANNING",
      currency: "USD",
      budgetTarget: null,
      estimatedCostOverride: null,
      costSplitMemberCountOverride: 5,
      startDate: null,
      endDate: null,
      createdAt: new Date("2026-04-28T00:00:00.000Z"),
      updatedAt: new Date("2026-04-28T00:00:00.000Z"),
      deletedAt: null,
    });

    await updateTrip("trip-1", { costSplitMemberCountOverride: 5 });

    expect(mocks.prisma.trip.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          costSplitMemberCountOverride: 5,
        }),
      })
    );
  });
});
