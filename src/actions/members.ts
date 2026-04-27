"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { MemberRole } from "@prisma/client";
import {
  assertCanManage,
  getAuthUser,
} from "@/lib/auth/trip-permissions";
import { sendInviteEmail } from "@/lib/email/send-invite";
import { getAppUrl } from "@/lib/app-url";

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function inviteMember(tripId: string, email: string, role: MemberRole = "MEMBER") {
  const user = await getAuthUser();
  const myMembership = await assertCanManage(tripId, user.id);
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail) throw new Error("Email is required");
  if (!normalizedEmail.includes("@")) throw new Error("Enter a valid email address");
  if (role === "OWNER" && myMembership.role !== "OWNER") {
    throw new Error("Only owners can invite another owner");
  }

  // Check if user with this email exists
  const targetUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });

  // Check if already a member
  if (targetUser) {
    const existing = await prisma.tripMember.findUnique({
      where: { tripId_userId: { tripId, userId: targetUser.id } },
    });
    if (existing && existing.status === "ACTIVE") throw new Error("Already a member");
  }

  // Check for existing pending invite
  const existingInvite = await prisma.tripInvite.findFirst({
    where: { tripId, email: normalizedEmail, status: "PENDING" },
  });
  if (existingInvite) throw new Error("Invite already sent to this email");

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  const invite = await prisma.tripInvite.create({
    data: {
      tripId,
      senderId: user.id,
      recipientId: targetUser?.id ?? null,
      email: normalizedEmail,
      role,
      expiresAt,
    },
  });

  revalidatePath(`/trips/${tripId}/members`);
  const inviteLink = getAppUrl(`/invite/${invite.token}`);

  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    select: { name: true },
  });
  const tripName = trip?.name ?? "a trip";

  let emailSent = false;
  if (process.env.RESEND_API_KEY && process.env.EMAIL_FROM) {
    try {
      await sendInviteEmail({
        to: normalizedEmail,
        inviteLink,
        tripName,
        senderName: user.name,
        role,
        expiresAt: expiresAt,
      });
      emailSent = true;
    } catch (err) {
      console.error("[inviteMember] email send failed:", err);
    }
  }

  return { invite, inviteLink, emailSent };
}

export async function acceptInvite(token: string) {
  const user = await getAuthUser();

  const invite = await prisma.tripInvite.findUnique({ where: { token } });
  if (!invite) throw new Error("Invite not found");
  if (invite.status !== "PENDING") throw new Error("Invite is no longer valid");
  if (invite.expiresAt && invite.expiresAt < new Date()) throw new Error("Invite has expired");
  if (invite.recipientId && invite.recipientId !== user.id) {
    throw new Error("This invite is linked to a different account");
  }
  if (invite.email) {
    const invitedEmail = normalizeEmail(invite.email);
    const currentEmail = normalizeEmail(user.email);
    if (invitedEmail !== currentEmail) {
      throw new Error("This invite was sent to a different email address");
    }
  }

  // Check not already a member
  const existing = await prisma.tripMember.findUnique({
    where: { tripId_userId: { tripId: invite.tripId, userId: user.id } },
  });

  if (existing) {
    if (existing.status === "ACTIVE") return { tripId: invite.tripId };
    // Re-activate if previously left
    await prisma.tripMember.update({
      where: { id: existing.id },
      data: { status: "ACTIVE", role: invite.role },
    });
  } else {
    await prisma.tripMember.create({
      data: { tripId: invite.tripId, userId: user.id, role: invite.role },
    });
  }

  await prisma.tripInvite.update({
    where: { id: invite.id },
    data: { status: "ACCEPTED" },
  });

  revalidatePath(`/trips/${invite.tripId}/members`);
  return { tripId: invite.tripId };
}

export async function updateMemberRole(tripId: string, targetUserId: string, role: MemberRole) {
  const user = await getAuthUser();
  const myMembership = await assertCanManage(tripId, user.id);
  const targetMembership = await prisma.tripMember.findUnique({
    where: { tripId_userId: { tripId, userId: targetUserId } },
  });
  if (!targetMembership || targetMembership.status !== "ACTIVE") {
    throw new Error("Member not found");
  }

  if (myMembership.role !== "OWNER" && role === "OWNER") {
    throw new Error("Only owners can assign owner role");
  }
  if (targetMembership.role === "OWNER" && myMembership.role !== "OWNER") {
    throw new Error("Only owners can change an owner's role");
  }
  if (targetMembership.role === "OWNER" && role !== "OWNER") {
    const ownerCount = await prisma.tripMember.count({
      where: { tripId, status: "ACTIVE", role: "OWNER" },
    });
    if (ownerCount <= 1) {
      throw new Error("Trip must have at least one owner");
    }
  }

  await prisma.tripMember.update({
    where: { tripId_userId: { tripId, userId: targetUserId } },
    data: { role },
  });

  revalidatePath(`/trips/${tripId}/members`);
}

export async function removeMember(tripId: string, targetUserId: string) {
  const user = await getAuthUser();
  await assertCanManage(tripId, user.id);

  const target = await prisma.tripMember.findUnique({
    where: { tripId_userId: { tripId, userId: targetUserId } },
  });
  if (target?.role === "OWNER") throw new Error("Cannot remove the owner");

  await prisma.tripMember.update({
    where: { tripId_userId: { tripId, userId: targetUserId } },
    data: { status: "REMOVED" },
  });

  revalidatePath(`/trips/${tripId}/members`);
}

export async function leaveTrip(tripId: string) {
  const user = await getAuthUser();

  const member = await prisma.tripMember.findUnique({
    where: { tripId_userId: { tripId, userId: user.id } },
  });
  if (!member) throw new Error("Not a member");
  if (member.role === "OWNER") throw new Error("Transfer ownership before leaving");

  await prisma.tripMember.update({
    where: { id: member.id },
    data: { status: "LEFT" },
  });

  revalidatePath("/dashboard");
  return { success: true };
}

export async function revokeInvite(inviteId: string) {
  const user = await getAuthUser();
  const invite = await prisma.tripInvite.findUnique({ where: { id: inviteId } });
  if (!invite) throw new Error("Invite not found");
  await assertCanManage(invite.tripId, user.id);

  await prisma.tripInvite.update({
    where: { id: inviteId },
    data: { status: "REVOKED" },
  });

  revalidatePath(`/trips/${invite.tripId}/members`);
}
