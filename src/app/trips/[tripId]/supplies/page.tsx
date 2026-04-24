import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { SuppliesClient } from "@/components/supplies/SuppliesClient";

export const metadata = { title: "Supplies" };

export default async function SuppliesPage({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [trip, items] = await Promise.all([
    prisma.trip.findUnique({ where: { id: tripId }, select: { currency: true } }),
    prisma.supplyItem.findMany({
      where: { tripId, deletedAt: null },
      orderBy: [{ category: "asc" }, { createdAt: "asc" }],
      include: {
        whoBrings: { select: { id: true, name: true, avatarUrl: true } },
        whoBought: { select: { id: true, name: true, avatarUrl: true } },
      },
    }),
  ]);

  if (!trip) redirect("/dashboard");

  const serialized = items.map((i) => ({
    id: i.id,
    name: i.name,
    category: i.category,
    quantityNeeded: i.quantityNeeded,
    quantityOwned: i.quantityOwned,
    quantityRemaining: i.quantityRemaining,
    estimatedCost: i.estimatedCost ? Number(i.estimatedCost) : null,
    actualCost: i.actualCost ? Number(i.actualCost) : null,
    status: i.status,
    whoBrings: i.whoBrings,
    whoBought: i.whoBought,
    whoBringsId: i.whoBringsId,
    notes: i.notes,
  }));

  return (
    <SuppliesClient
      tripId={tripId}
      currency={trip.currency}
      items={serialized}
    />
  );
}
