"use server";

import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { MemberRole } from "@prisma/client";

async function getAuthUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const dbUser = await prisma.user.findUnique({ where: { externalId: user.id } });
  if (!dbUser) throw new Error("User not found");
  return dbUser;
}

async function assertCanManage(tripId: string, userId: string) {
  const member = await prisma.tripMember.findUnique({
    where: { tripId_userId: { tripId, userId } },
  });
  if (!member || !["OWNER", "ADMIN"].includes(member.role)) {
    throw new Error("Insufficient permissions");
  }
  return member;
}

export async function inviteMember(tripId: string, email: string, role: MemberRole = "MEMBER") {
  const user = await getAuthUser();
  await assertCanManage(tripId, user.id);

  // Check if user with this email exists
  const targetUser = await prisma.user.findUnique({ where: { email } });

  // Check if already a member
  if (targetUser) {
    const existing = await prisma.tripMember.findUnique({
      where: { tripId_userId: { tripId, userId: targetUser.id } },
    });
    if (existing && existing.status === "ACTIVE") throw new Error("Already a member");
  }

  // Check for existing pending invite
  const existingInvite = await prisma.tripInvite.findFirst({
    where: { tripId, email, status: "PENDING" },
  });
  if (existingInvite) throw new Error("Invite already sent to this email");

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  const invite = await prisma.tripInvite.create({
    data: {
      tripId,
      senderId: user.id,
      recipientId: targetUser?.id ?? null,
      email,
      role,
      expiresAt,
    },
  });

  revalidatePath(`/trips/${tripId}/members`);
  return { invite, inviteLink: `${process.env.NEXT_PUBLIC_APP_URL}/invite/${invite.token}` };
}

export async function acceptInvite(token: string) {
  const user = await getAuthUser();

  const invite = await prisma.tripInvite.findUnique({ where: { token } });
  if (!invite) throw new Error("Invite not found");
  if (invite.status !== "PENDING") throw new Error("Invite is no longer valid");
  if (invite.expiresAt && invite.expiresAt < new Date()) throw new Error("Invite has expired");

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

  if (myMembership.role !== "OWNER" && role === "OWNER") {
    throw new Error("Only owners can assign owner role");
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
