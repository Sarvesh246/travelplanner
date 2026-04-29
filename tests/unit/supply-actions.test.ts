import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  prisma: {
    supplyItem: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
  getAuthUser: vi.fn(),
  assertCanContribute: vi.fn(),
  assertActiveTripMembers: vi.fn(),
  revalidatePath: vi.fn(),
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

import { createSupplyItem, updateSupplyItem } from "@/actions/supplies";

describe("supply actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getAuthUser.mockResolvedValue({ id: "user-1" });
    mocks.assertCanContribute.mockResolvedValue({ role: "MEMBER" });
    mocks.assertActiveTripMembers.mockResolvedValue(new Set(["user-2"]));
    mocks.prisma.supplyItem.findUnique.mockResolvedValue({
      id: "item-1",
      tripId: "trip-1",
      quantityNeeded: 2,
      quantityOwned: 0,
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
});
