import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { MembersClient } from "@/components/members/MembersClient";
import { assertCanView, getAuthUser } from "@/lib/auth/trip-permissions";

export const metadata = { title: "Members" };

export default async function MembersPage({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const dbUser = await getAuthUser();
  const membership = await assertCanView(tripId, dbUser.id);
  const canManage = membership.role === "OWNER" || membership.role === "ADMIN";

  const members = await prisma.tripMember.findMany({
    where: { tripId, status: "ACTIVE" },
    include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } },
    orderBy: [{ role: "asc" }, { joinedAt: "asc" }],
  });

  const pendingInvites = canManage
    ? await prisma.tripInvite.findMany({
      where: { tripId, status: "PENDING" },
      include: { sender: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    })
    : [];

  return (
    <MembersClient
      tripId={tripId}
      members={members.map((m) => ({
        id: m.id,
        userId: m.userId,
        role: m.role,
        joinedAt: m.joinedAt.toISOString(),
        user: m.user,
      }))}
      pendingInvites={pendingInvites.map((inv) => ({
        id: inv.id,
        email: inv.email ?? "",
        role: inv.role,
        token: inv.token,
        expiresAt: inv.expiresAt?.toISOString() ?? null,
        senderName: inv.sender.name,
      }))}
    />
  );
}
