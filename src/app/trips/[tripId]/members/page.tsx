import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { MembersClient } from "@/components/members/MembersClient";

export const metadata = { title: "Members" };

export default async function MembersPage({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [members, pendingInvites] = await Promise.all([
    prisma.tripMember.findMany({
      where: { tripId, status: "ACTIVE" },
      include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } },
      orderBy: [{ role: "asc" }, { joinedAt: "asc" }],
    }),
    prisma.tripInvite.findMany({
      where: { tripId, status: "PENDING" },
      include: { sender: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

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
        expiresAt: inv.expiresAt?.toISOString() ?? null,
        senderName: inv.sender.name,
        token: inv.token,
      }))}
    />
  );
}
