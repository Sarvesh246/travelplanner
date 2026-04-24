import { ExpenseSplitMode, ExpenseStatus } from "@prisma/client";

export interface ExpenseShareSerialized {
  id: string;
  userId: string;
  user: { id: string; name: string; avatarUrl: string | null };
  weight: number | null;
  customAmount: number | null;
  hasPaid: boolean;
}

export interface ExpenseSerialized {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  totalAmount: number;
  currency: string;
  splitMode: ExpenseSplitMode;
  status: ExpenseStatus;
  expenseDate: string;
  receiptUrl: string | null;
  paidBy: { id: string; name: string; avatarUrl: string | null };
  paidById: string;
  shares: ExpenseShareSerialized[];
}
