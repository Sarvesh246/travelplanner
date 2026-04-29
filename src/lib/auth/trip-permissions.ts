import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import type { MemberRole, TripMember, User } from "@prisma/client";

const CONTRIBUTE_ROLES: ReadonlySet<MemberRole> = new Set([
  "OWNER",
  "ADMIN",
  "MEMBER",
]);
const MANAGE_ROLES: ReadonlySet<MemberRole> = new Set(["OWNER", "ADMIN"]);

export async function getAuthUser(): Promise<User> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const dbUser = await prisma.user.findUnique({ where: { externalId: user.id } });
  if (!dbUser) throw new Error("User not found");
  return dbUser;
}

/** Active trip membership, or `null` if not a member. */
export async function getMembership(
  tripId: string,
  userId: string
): Promise<TripMember | null> {
  const member = await prisma.tripMember.findUnique({
    where: { tripId_userId: { tripId, userId } },
  });
  if (!member || member.status !== "ACTIVE") return null;
  return member;
}

export async function assertCanView(tripId: string, userId: string) {
  const m = await getMembership(tripId, userId);
  if (!m) throw new Error("Not a member of this trip");
  return m;
}

export async function assertActiveTripMembers(
  tripId: string,
  userIds: Iterable<string | null | undefined>
) {
  const uniqueUserIds = [...new Set([...userIds].map((id) => id?.trim()).filter(Boolean))] as string[];
  if (uniqueUserIds.length === 0) return new Set<string>();

  const members = await prisma.tripMember.findMany({
    where: {
      tripId,
      userId: { in: uniqueUserIds },
      status: "ACTIVE",
    },
    select: { userId: true },
  });
  const activeUserIds = new Set(members.map((member) => member.userId));
  const missing = uniqueUserIds.filter((userId) => !activeUserIds.has(userId));

  if (missing.length > 0) {
    throw new Error(
      missing.length === 1
        ? "Selected person is not an active trip member"
        : "Every selected person must be an active trip member"
    );
  }

  return activeUserIds;
}

export async function assertCanContribute(tripId: string, userId: string) {
  const m = await getMembership(tripId, userId);
  if (!m) throw new Error("Not a member of this trip");
  if (!CONTRIBUTE_ROLES.has(m.role)) {
    throw new Error("Insufficient permissions");
  }
  return m;
}

export async function assertCanManage(tripId: string, userId: string) {
  const m = await getMembership(tripId, userId);
  if (!m) throw new Error("Not a member of this trip");
  if (!MANAGE_ROLES.has(m.role)) {
    throw new Error("Insufficient permissions");
  }
  return m;
}

export async function assertOwner(tripId: string, userId: string) {
  const m = await getMembership(tripId, userId);
  if (!m) throw new Error("Not a member of this trip");
  if (m.role !== "OWNER") {
    throw new Error("Only owners can delete trips");
  }
  return m;
}
