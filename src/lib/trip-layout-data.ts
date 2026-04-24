import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

const tripLayoutInclude = {
  members: {
    where: { status: "ACTIVE" as const },
    include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } },
  },
} satisfies Prisma.TripInclude;

export type TripForLayout = Prisma.TripGetPayload<{ include: typeof tripLayoutInclude }>;

export type TripLayoutResult =
  | { ok: true; dbUser: NonNullable<Awaited<ReturnType<typeof prisma.user.findUnique>>>; trip: TripForLayout; membership: TripForLayout["members"][number] }
  | { ok: false; reason: "no_user" | "not_found" | "forbidden" };

/**
 * Cached trip + membership for the trip shell. Speeds up client navigations between
 * overview / itinerary / expenses / etc. Revalidates every 30s; use revalidateTag on mutations if needed.
 */
export function getTripLayoutData(tripId: string, supabaseUserId: string): Promise<TripLayoutResult> {
  const cached = unstable_cache(
    async (): Promise<TripLayoutResult> => {
      const dbUser = await prisma.user.findUnique({
        where: { externalId: supabaseUserId },
      });
      if (!dbUser) return { ok: false, reason: "no_user" };

      const trip = await prisma.trip.findUnique({
        where: { id: tripId },
        include: tripLayoutInclude,
      });

      if (!trip || trip.deletedAt) return { ok: false, reason: "not_found" };

      const membership = trip.members.find((m) => m.userId === dbUser.id);
      if (!membership) return { ok: false, reason: "forbidden" };

      return { ok: true, dbUser, trip, membership };
    },
    ["trip-layout", tripId, supabaseUserId],
    { revalidate: 30, tags: [`trip-${tripId}`] }
  );

  return cached();
}
