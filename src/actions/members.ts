"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath, revalidateTag } from "next/cache";
import { MemberRole } from "@prisma/client";
import {
  assertCanManage,
  getAuthUser,
} from "@/lib/auth/trip-permissions";
import { sendInviteEmail } from "@/lib/email/send-invite";
import { getAppUrl } from "@/lib/app-url";
import { logAuditEvent } from "@/lib/observability/audit";
import { reportServerError } from "@/lib/observability/errors";
import { assertRateLimit } from "@/lib/rate-limit";
import { publishTripMembershipEvent } from "@/lib/supabase/trip-membership-realtime";

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
  await assertRateLimit({
    scope: "trip-invite",
    identifier: user.id,
    key: `${tripId}:${normalizedEmail}`,
    limit: 8,
    windowMs: 15 * 60 * 1000,
    message: "Too many invites sent. Give it a few minutes, then try again.",
  });

  // Check if user with this email exists
  const targetUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });

  // Check if already a member
  if (targetUser) {
    const existing = await prisma.tripMember.findUnique({
      where: { tripId_userId: { tripId, userId: targetUser.id } },
    });
    if (existing && existing.status === "ACTIVE") throw new Error("Already a member");
  }

  const now = new Date();

  // Check for existing usable pending invite. Expired pending rows should not
  // block creating a fresh invite for the same email.
  const existingInvite = await prisma.tripInvite.findFirst({
    where: {
      tripId,
      email: normalizedEmail,
      status: "PENDING",
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    },
  });
  if (existingInvite) throw new Error("Invite already sent to this email");

  const expiresAt = new Date(now);
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
  revalidateTag(`trip-${tripId}`, "max");
  const inviteLink = getAppUrl(`/invite/${invite.token}`);

  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    select: { name: true },
  });
  const tripName = trip?.name ?? "a trip";

  const emailConfigured = Boolean(
    process.env.RESEND_API_KEY?.trim() && process.env.EMAIL_FROM?.trim()
  );

  let emailSent = false;
  let emailSendError: string | undefined;

  const senderDisplay =
    user.name?.trim() ||
    user.email.split("@")[0] ||
    "Someone";

  if (emailConfigured) {
    try {
      await sendInviteEmail({
        to: normalizedEmail,
        inviteLink,
        tripName,
        senderName: senderDisplay,
        role,
        expiresAt: expiresAt,
      });
      emailSent = true;
    } catch (err) {
      const raw = err instanceof Error ? err.message : String(err);
      await reportServerError({
        source: "inviteMember.emailDelivery",
        error: err,
        userId: user.id,
        tripId,
        context: {
          email: normalizedEmail,
          role,
        },
      });
      emailSendError = raw.slice(0, 600);
    }
  }

  await logAuditEvent({
    action: "trip.invite.created",
    actorUserId: user.id,
    tripId,
    targetUserId: targetUser?.id ?? null,
    targetId: invite.id,
    summary: `Invited ${normalizedEmail} as ${role.toLowerCase()}`,
    metadata: {
      email: normalizedEmail,
      role,
      emailSent,
    },
  });

  return {
    inviteLink,
    emailSent,
    emailConfigured,
    emailSendError: emailSendError ?? null,
  };
}

export async function acceptInvite(token: string) {
  const user = await getAuthUser();
  await assertRateLimit({
    scope: "trip-invite-accept",
    identifier: user.id,
    key: token,
    limit: 12,
    windowMs: 10 * 60 * 1000,
    message: "Too many invite attempts. Give it a minute, then try again.",
  });

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
    if (existing.status === "ACTIVE") {
      await prisma.tripInvite.update({
        where: { id: invite.id },
        data: { status: "ACCEPTED" },
      });
      await logAuditEvent({
        action: "trip.invite.accepted",
        actorUserId: user.id,
        tripId: invite.tripId,
        targetId: invite.id,
        summary: "Accepted an invite while already an active member",
        metadata: { role: invite.role },
      });
      revalidatePath(`/trips/${invite.tripId}/members`);
      revalidatePath("/dashboard");
      revalidateTag(`trip-${invite.tripId}`, "max");
      return { tripId: invite.tripId };
    }
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

  await logAuditEvent({
    action: "trip.invite.accepted",
    actorUserId: user.id,
    tripId: invite.tripId,
    targetId: invite.id,
    summary: `Accepted invite as ${invite.role.toLowerCase()}`,
    metadata: { role: invite.role },
  });

  revalidatePath(`/trips/${invite.tripId}/members`);
  revalidatePath("/dashboard");
  revalidateTag(`trip-${invite.tripId}`, "max");
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

  await logAuditEvent({
    action: "trip.member.role-updated",
    actorUserId: user.id,
    tripId,
    targetUserId,
    summary: `Changed member role to ${role.toLowerCase()}`,
    metadata: { role },
  });

  await publishTripMembershipEvent({
    type: "membership-updated",
    tripId,
    targetUserId,
    role,
  });

  revalidatePath(`/trips/${tripId}/members`);
  revalidateTag(`trip-${tripId}`, "max");
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

  await logAuditEvent({
    action: "trip.member.removed",
    actorUserId: user.id,
    tripId,
    targetUserId,
    summary: "Removed a member from the trip",
  });

  await publishTripMembershipEvent({
    type: "access-revoked",
    tripId,
    targetUserId,
    reason: "removed",
  });

  revalidatePath(`/trips/${tripId}/members`);
  revalidateTag(`trip-${tripId}`, "max");
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

  await logAuditEvent({
    action: "trip.member.left",
    actorUserId: user.id,
    tripId,
    targetUserId: user.id,
    summary: "Left the trip",
  });

  await publishTripMembershipEvent({
    type: "access-revoked",
    tripId,
    targetUserId: user.id,
    reason: "left",
  });

  revalidatePath("/dashboard");
  revalidateTag(`trip-${tripId}`, "max");
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

  await logAuditEvent({
    action: "trip.invite.revoked",
    actorUserId: user.id,
    tripId: invite.tripId,
    targetUserId: invite.recipientId,
    targetId: inviteId,
    summary: "Revoked a pending invite",
    metadata: { email: invite.email, role: invite.role },
  });

  revalidatePath(`/trips/${invite.tripId}/members`);
  revalidateTag(`trip-${invite.tripId}`, "max");
}
