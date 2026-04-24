import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { VotesClient } from "@/components/votes/VotesClient";

export const metadata = { title: "Votes" };

export default async function VotesPage({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const dbUser = await prisma.user.findUnique({ where: { externalId: user.id } });
  if (!dbUser) redirect("/login");

  const votes = await prisma.vote.findMany({
    where: { tripId },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    include: {
      options: {
        orderBy: { sortOrder: "asc" },
        include: {
          responses: {
            select: {
              userId: true,
              user: { select: { id: true, name: true, avatarUrl: true } },
            },
          },
        },
      },
    },
  });

  const serialized = votes.map((v) => ({
    id: v.id,
    title: v.title,
    description: v.description,
    topicType: v.topicType,
    allowMultiple: v.allowMultiple,
    isAnonymous: v.isAnonymous,
    deadline: v.deadline?.toISOString() ?? null,
    status: v.status,
    createdAt: v.createdAt.toISOString(),
    options: v.options.map((o) => ({
      id: o.id,
      label: o.label,
      dateStart: o.dateStart?.toISOString() ?? null,
      dateEnd: o.dateEnd?.toISOString() ?? null,
      sortOrder: o.sortOrder,
      voters: o.responses.map((r) => r.user),
      myVote: o.responses.some((r) => r.userId === dbUser.id),
    })),
  }));

  return <VotesClient tripId={tripId} votes={serialized} />;
}
