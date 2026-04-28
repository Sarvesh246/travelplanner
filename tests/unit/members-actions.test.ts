import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  prisma: {
    user: { findUnique: vi.fn() },
    trip: { findUnique: vi.fn() },
    tripMember: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    tripInvite: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
  getAuthUser: vi.fn(),
  assertCanManage: vi.fn(),
  sendInviteEmail: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({ prisma: mocks.prisma }));
vi.mock("@/lib/auth/trip-permissions", () => ({
  getAuthUser: mocks.getAuthUser,
  assertCanManage: mocks.assertCanManage,
}));
vi.mock("@/lib/email/send-invite", () => ({
  sendInviteEmail: mocks.sendInviteEmail,
}));
vi.mock("next/cache", () => ({
  revalidatePath: mocks.revalidatePath,
}));

import {
  acceptInvite,
  inviteMember,
  removeMember,
  revokeInvite,
  updateMemberRole,
} from "@/actions/members";

describe("member invite actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-28T12:00:00.000Z"));
    delete process.env.RESEND_API_KEY;
    delete process.env.EMAIL_FROM;
    process.env.NEXT_PUBLIC_APP_URL = "https://app.example.com";

    mocks.getAuthUser.mockResolvedValue({
      id: "user-owner",
      email: "owner@example.com",
      name: "Trip Owner",
    });
    mocks.assertCanManage.mockResolvedValue({ role: "OWNER" });
    mocks.prisma.user.findUnique.mockResolvedValue(null);
    mocks.prisma.tripMember.findUnique.mockResolvedValue(null);
    mocks.prisma.tripInvite.findFirst.mockResolvedValue(null);
    mocks.prisma.tripInvite.create.mockResolvedValue({
      id: "invite-1",
      token: "token-1",
      expiresAt: new Date("2026-05-05T12:00:00.000Z"),
      createdAt: new Date("2026-04-28T12:00:00.000Z"),
      updatedAt: new Date("2026-04-28T12:00:00.000Z"),
    });
    mocks.prisma.trip.findUnique.mockResolvedValue({ name: "Trail Weekend" });
  });

  it("creates an invite and returns only client-safe fields", async () => {
    const result = await inviteMember("trip-1", " FRIEND@Example.COM ", "MEMBER");

    expect(mocks.assertCanManage).toHaveBeenCalledWith("trip-1", "user-owner");
    expect(mocks.prisma.tripInvite.findFirst).toHaveBeenCalledWith({
      where: {
        tripId: "trip-1",
        email: "friend@example.com",
        status: "PENDING",
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date("2026-04-28T12:00:00.000Z") } },
        ],
      },
    });
    expect(mocks.prisma.tripInvite.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        tripId: "trip-1",
        senderId: "user-owner",
        recipientId: null,
        email: "friend@example.com",
        role: "MEMBER",
        expiresAt: new Date("2026-05-05T12:00:00.000Z"),
      }),
    });
    expect(result).toEqual({
      inviteLink: "https://app.example.com/invite/token-1",
      emailSent: false,
      emailConfigured: false,
      emailSendError: null,
    });
    expect(result).not.toHaveProperty("invite");
    expect(() => JSON.stringify(result)).not.toThrow();
  });

  it("does not let expired pending invites block a fresh invite", async () => {
    await inviteMember("trip-1", "friend@example.com", "VIEWER");

    expect(mocks.prisma.tripInvite.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: "PENDING",
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date("2026-04-28T12:00:00.000Z") } },
          ],
        }),
      })
    );
    expect(mocks.prisma.tripInvite.create).toHaveBeenCalled();
  });

  it("keeps the invite usable when configured email delivery fails", async () => {
    process.env.RESEND_API_KEY = "resend-key";
    process.env.EMAIL_FROM = "Beacon <noreply@example.com>";
    mocks.sendInviteEmail.mockRejectedValue(new Error("domain is not verified"));

    const result = await inviteMember("trip-1", "friend@example.com", "ADMIN");

    expect(mocks.sendInviteEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "friend@example.com",
        inviteLink: "https://app.example.com/invite/token-1",
        tripName: "Trail Weekend",
        senderName: "Trip Owner",
        role: "ADMIN",
      })
    );
    expect(result).toMatchObject({
      inviteLink: "https://app.example.com/invite/token-1",
      emailSent: false,
      emailConfigured: true,
      emailSendError: "domain is not verified",
    });
  });

  it("rejects duplicate active members before creating an invite", async () => {
    mocks.prisma.user.findUnique.mockResolvedValue({ id: "user-friend" });
    mocks.prisma.tripMember.findUnique.mockResolvedValue({
      userId: "user-friend",
      status: "ACTIVE",
    });

    await expect(inviteMember("trip-1", "friend@example.com", "MEMBER")).rejects.toThrow(
      "Already a member"
    );
    expect(mocks.prisma.tripInvite.create).not.toHaveBeenCalled();
  });

  it("accepts an invite, creates membership, closes invite, and refreshes views", async () => {
    mocks.getAuthUser.mockResolvedValue({
      id: "user-friend",
      email: "friend@example.com",
      name: "Friend",
    });
    mocks.prisma.tripInvite.findUnique.mockResolvedValue({
      id: "invite-1",
      tripId: "trip-1",
      recipientId: null,
      email: "friend@example.com",
      role: "VIEWER",
      status: "PENDING",
      expiresAt: new Date("2026-05-05T12:00:00.000Z"),
    });
    mocks.prisma.tripMember.findUnique.mockResolvedValue(null);

    await expect(acceptInvite("token-1")).resolves.toEqual({ tripId: "trip-1" });
    expect(mocks.prisma.tripMember.create).toHaveBeenCalledWith({
      data: { tripId: "trip-1", userId: "user-friend", role: "VIEWER" },
    });
    expect(mocks.prisma.tripInvite.update).toHaveBeenCalledWith({
      where: { id: "invite-1" },
      data: { status: "ACCEPTED" },
    });
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/trips/trip-1/members");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/dashboard");
  });

  it("accepting while already active still closes the pending invite", async () => {
    mocks.getAuthUser.mockResolvedValue({
      id: "user-friend",
      email: "friend@example.com",
      name: "Friend",
    });
    mocks.prisma.tripInvite.findUnique.mockResolvedValue({
      id: "invite-1",
      tripId: "trip-1",
      recipientId: null,
      email: "friend@example.com",
      role: "MEMBER",
      status: "PENDING",
      expiresAt: new Date("2026-05-05T12:00:00.000Z"),
    });
    mocks.prisma.tripMember.findUnique.mockResolvedValue({ status: "ACTIVE" });

    await expect(acceptInvite("token-1")).resolves.toEqual({ tripId: "trip-1" });
    expect(mocks.prisma.tripMember.create).not.toHaveBeenCalled();
    expect(mocks.prisma.tripInvite.update).toHaveBeenCalledWith({
      where: { id: "invite-1" },
      data: { status: "ACCEPTED" },
    });
  });

  it("revokes an invite only after checking manager permissions", async () => {
    mocks.prisma.tripInvite.findUnique.mockResolvedValue({
      id: "invite-1",
      tripId: "trip-1",
    });

    await revokeInvite("invite-1");

    expect(mocks.assertCanManage).toHaveBeenCalledWith("trip-1", "user-owner");
    expect(mocks.prisma.tripInvite.update).toHaveBeenCalledWith({
      where: { id: "invite-1" },
      data: { status: "REVOKED" },
    });
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/trips/trip-1/members");
  });

  it("updates a member role and refreshes the members page", async () => {
    mocks.assertCanManage.mockResolvedValue({ role: "OWNER" });
    mocks.prisma.tripMember.findUnique.mockResolvedValue({
      id: "member-1",
      userId: "user-friend",
      role: "MEMBER",
      status: "ACTIVE",
    });

    await updateMemberRole("trip-1", "user-friend", "VIEWER");

    expect(mocks.prisma.tripMember.update).toHaveBeenCalledWith({
      where: { tripId_userId: { tripId: "trip-1", userId: "user-friend" } },
      data: { role: "VIEWER" },
    });
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/trips/trip-1/members");
  });

  it("prevents demoting the last owner", async () => {
    mocks.assertCanManage.mockResolvedValue({ role: "OWNER" });
    mocks.prisma.tripMember.findUnique.mockResolvedValue({
      id: "member-owner",
      userId: "user-owner",
      role: "OWNER",
      status: "ACTIVE",
    });
    mocks.prisma.tripMember.count.mockResolvedValue(1);

    await expect(updateMemberRole("trip-1", "user-owner", "ADMIN")).rejects.toThrow(
      "Trip must have at least one owner"
    );
    expect(mocks.prisma.tripMember.update).not.toHaveBeenCalled();
  });

  it("removes non-owner members by marking them removed", async () => {
    mocks.prisma.tripMember.findUnique.mockResolvedValue({
      id: "member-1",
      userId: "user-friend",
      role: "MEMBER",
      status: "ACTIVE",
    });

    await removeMember("trip-1", "user-friend");

    expect(mocks.assertCanManage).toHaveBeenCalledWith("trip-1", "user-owner");
    expect(mocks.prisma.tripMember.update).toHaveBeenCalledWith({
      where: { tripId_userId: { tripId: "trip-1", userId: "user-friend" } },
      data: { status: "REMOVED" },
    });
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/trips/trip-1/members");
  });
});
