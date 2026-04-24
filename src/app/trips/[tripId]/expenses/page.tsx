import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { ExpensesClient } from "@/components/expenses/ExpensesClient";
import { calculateBalances, simplifyDebts } from "@/lib/balance-calculator";

export const metadata = { title: "Expenses" };

export default async function ExpensesPage({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [trip, expenses] = await Promise.all([
    prisma.trip.findUnique({ where: { id: tripId }, select: { currency: true } }),
    prisma.expense.findMany({
      where: { tripId, deletedAt: null },
      orderBy: { expenseDate: "desc" },
      include: {
        paidBy: { select: { id: true, name: true, avatarUrl: true } },
        shares: {
          include: { user: { select: { id: true, name: true, avatarUrl: true } } },
        },
      },
    }),
  ]);

  if (!trip) redirect("/dashboard");

  const serializedExpenses = expenses.map((e) => ({
    id: e.id,
    title: e.title,
    description: e.description,
    category: e.category,
    totalAmount: Number(e.totalAmount),
    currency: e.currency,
    splitMode: e.splitMode,
    status: e.status,
    expenseDate: e.expenseDate.toISOString(),
    receiptUrl: e.receiptUrl,
    paidBy: e.paidBy,
    paidById: e.paidById,
    shares: e.shares.map((s) => ({
      id: s.id,
      userId: s.userId,
      user: s.user,
      weight: s.weight ? Number(s.weight) : null,
      customAmount: s.customAmount ? Number(s.customAmount) : null,
      hasPaid: s.hasPaid,
    })),
  }));

  const balancesMap = calculateBalances(
    serializedExpenses.map((e) => ({
      id: e.id,
      totalAmount: e.totalAmount,
      paidById: e.paidById,
      splitMode: e.splitMode,
      shares: e.shares.map((s) => ({
        userId: s.userId,
        customAmount: s.customAmount,
        weight: s.weight,
        hasPaid: s.hasPaid,
      })),
    }))
  );

  const balances = Array.from(balancesMap.values());
  const settlements = simplifyDebts(balancesMap);

  return (
    <ExpensesClient
      tripId={tripId}
      currency={trip.currency}
      expenses={serializedExpenses}
      balances={balances}
      settlements={settlements}
    />
  );
}
