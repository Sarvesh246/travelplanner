import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assertCanView, getAuthUser } from "@/lib/auth/trip-permissions";

export async function GET(_req: Request, { params }: { params: Promise<{ tripId: string }> }) {
  try {
    const { tripId } = await params;
    const user = await getAuthUser();
    await assertCanView(tripId, user.id);

    const [stops, expenses, supplies, votes, members] = await Promise.all([
      prisma.stop.findMany({
        where: { tripId, deletedAt: null },
        select: { id: true, name: true },
        orderBy: { sortOrder: "asc" },
        take: 200,
      }),
      prisma.expense.findMany({
        where: { tripId, deletedAt: null },
        select: { id: true, title: true, category: true },
        orderBy: { expenseDate: "desc" },
        take: 200,
      }),
      prisma.supplyItem.findMany({
        where: { tripId, deletedAt: null },
        select: { id: true, name: true, status: true },
        take: 200,
      }),
      prisma.vote.findMany({
        where: { tripId },
        select: { id: true, title: true, status: true },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      prisma.tripMember.findMany({
        where: { tripId, status: "ACTIVE" },
        select: { userId: true, role: true, user: { select: { id: true, name: true, email: true } } },
        take: 100,
      }),
    ]);

    return NextResponse.json({
      stops,
      expenses,
      supplies,
      votes,
      members: members.map((m) => ({
        userId: m.userId,
        role: m.role,
        name: m.user.name,
        email: m.user.email,
      })),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Search failed";
    const status = message === "Not authenticated" ? 401 : message.includes("Not a member") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
