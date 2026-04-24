export interface ExpenseForBalance {
  id: string;
  totalAmount: number;
  paidById: string;
  shares: { userId: string; customAmount: number | null; weight: number | null; hasPaid: boolean }[];
  splitMode: "EQUAL" | "WEIGHTED" | "CUSTOM";
}

export interface MemberBalance {
  userId: string;
  paid: number;
  owes: number;
  net: number; // positive = owed money, negative = owes money
}

export interface Settlement {
  from: string; // userId who pays
  to: string; // userId who receives
  amount: number;
}

export function calculateBalances(
  expenses: ExpenseForBalance[]
): Map<string, MemberBalance> {
  const balances = new Map<string, MemberBalance>();

  function getBalance(userId: string): MemberBalance {
    if (!balances.has(userId)) {
      balances.set(userId, { userId, paid: 0, owes: 0, net: 0 });
    }
    return balances.get(userId)!;
  }

  for (const expense of expenses) {
    const total = expense.totalAmount;
    const payer = getBalance(expense.paidById);
    payer.paid += total;
    payer.net += total;

    for (const share of expense.shares) {
      let shareAmount = 0;

      if (expense.splitMode === "CUSTOM" && share.customAmount !== null) {
        shareAmount = share.customAmount;
      } else if (expense.splitMode === "WEIGHTED" && share.weight !== null) {
        const totalWeight = expense.shares.reduce(
          (sum, s) => sum + (s.weight ?? 1),
          0
        );
        shareAmount = (share.weight / totalWeight) * total;
      } else {
        shareAmount = total / expense.shares.length;
      }

      shareAmount = Math.round(shareAmount * 100) / 100;

      const member = getBalance(share.userId);
      member.owes += shareAmount;
      member.net -= shareAmount;

      // If payer is also a participant, adjust their net
      if (share.userId === expense.paidById) {
        // Already credited for paying; just debiting their own share is correct
        // net = paid - owes handles this automatically
      }
    }
  }

  // Recalculate net correctly: net = paid - owes
  balances.forEach((balance) => {
    balance.net = Math.round((balance.paid - balance.owes) * 100) / 100;
  });

  return balances;
}

export function simplifyDebts(balances: Map<string, MemberBalance>): Settlement[] {
  const creditors: { userId: string; amount: number }[] = [];
  const debtors: { userId: string; amount: number }[] = [];

  balances.forEach((balance) => {
    if (balance.net > 0.01) {
      creditors.push({ userId: balance.userId, amount: balance.net });
    } else if (balance.net < -0.01) {
      debtors.push({ userId: balance.userId, amount: Math.abs(balance.net) });
    }
  });

  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  const settlements: Settlement[] = [];
  let ci = 0;
  let di = 0;

  while (ci < creditors.length && di < debtors.length) {
    const credit = creditors[ci];
    const debt = debtors[di];
    const amount = Math.min(credit.amount, debt.amount);
    const rounded = Math.round(amount * 100) / 100;

    if (rounded > 0.01) {
      settlements.push({ from: debt.userId, to: credit.userId, amount: rounded });
    }

    credit.amount -= amount;
    debt.amount -= amount;

    if (credit.amount < 0.01) ci++;
    if (debt.amount < 0.01) di++;
  }

  return settlements;
}
