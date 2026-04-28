import { describe, expect, it } from "vitest";
import {
  calculateBalances,
  simplifyDebts,
  type ExpenseForBalance,
} from "@/lib/balance-calculator";

const equalShares = (userIds: string[]) =>
  userIds.map((userId) => ({
    userId,
    customAmount: null,
    weight: null,
    hasPaid: false,
  }));

describe("calculateBalances", () => {
  it("returns empty when no expenses", () => {
    expect(calculateBalances([])).toEqual(new Map());
  });

  it("nets payer credit and debtors", () => {
    // Alice paid $90, split equally between A/B/C → each share is $30
    const expenses: ExpenseForBalance[] = [
      {
        id: "e1",
        totalAmount: 90,
        paidById: "a",
        splitMode: "EQUAL",
        shares: equalShares(["a", "b", "c"]),
      },
    ];
    const balances = calculateBalances(expenses);
    expect(balances.get("a")?.net).toBe(60);
    expect(balances.get("b")?.net).toBe(-30);
    expect(balances.get("c")?.net).toBe(-30);
  });

  it("sum of nets is approximately zero across all members", () => {
    const expenses: ExpenseForBalance[] = [
      {
        id: "e1",
        totalAmount: 100,
        paidById: "a",
        splitMode: "EQUAL",
        shares: equalShares(["a", "b", "c"]),
      },
      {
        id: "e2",
        totalAmount: 60,
        paidById: "b",
        splitMode: "EQUAL",
        shares: equalShares(["a", "b", "c"]),
      },
    ];
    const balances = calculateBalances(expenses);
    const sum = [...balances.values()].reduce((acc, b) => acc + b.net, 0);
    expect(Math.abs(sum)).toBeLessThan(0.05);
  });

  it("handles WEIGHTED splits", () => {
    const expenses: ExpenseForBalance[] = [
      {
        id: "e1",
        totalAmount: 100,
        paidById: "a",
        splitMode: "WEIGHTED",
        shares: [
          { userId: "a", customAmount: null, weight: 1, hasPaid: false },
          { userId: "b", customAmount: null, weight: 4, hasPaid: false },
        ],
      },
    ];
    const balances = calculateBalances(expenses);
    expect(balances.get("a")?.net).toBe(80);
    expect(balances.get("b")?.net).toBe(-80);
  });

  it("handles CUSTOM splits", () => {
    const expenses: ExpenseForBalance[] = [
      {
        id: "e1",
        totalAmount: 50,
        paidById: "a",
        splitMode: "CUSTOM",
        shares: [
          { userId: "a", customAmount: 10, weight: null, hasPaid: false },
          { userId: "b", customAmount: 40, weight: null, hasPaid: false },
        ],
      },
    ];
    const balances = calculateBalances(expenses);
    expect(balances.get("a")?.net).toBe(40);
    expect(balances.get("b")?.net).toBe(-40);
  });
});

describe("simplifyDebts", () => {
  it("returns empty when nobody owes", () => {
    const balances = new Map([
      ["a", { userId: "a", paid: 0, owes: 0, net: 0 }],
    ]);
    expect(simplifyDebts(balances)).toEqual([]);
  });

  it("greedily matches biggest creditor with biggest debtor", () => {
    const balances = new Map([
      ["a", { userId: "a", paid: 100, owes: 0, net: 100 }],
      ["b", { userId: "b", paid: 0, owes: 60, net: -60 }],
      ["c", { userId: "c", paid: 0, owes: 40, net: -40 }],
    ]);
    const settlements = simplifyDebts(balances);
    expect(settlements).toHaveLength(2);
    expect(settlements[0]).toEqual({ from: "b", to: "a", amount: 60 });
    expect(settlements[1]).toEqual({ from: "c", to: "a", amount: 40 });
  });

  it("ignores sub-cent dust", () => {
    const balances = new Map([
      ["a", { userId: "a", paid: 0, owes: 0, net: 0.005 }],
      ["b", { userId: "b", paid: 0, owes: 0, net: -0.005 }],
    ]);
    expect(simplifyDebts(balances)).toEqual([]);
  });

  it("produces n-1 transfers at most for n participants", () => {
    const balances = new Map([
      ["a", { userId: "a", paid: 0, owes: 0, net: 30 }],
      ["b", { userId: "b", paid: 0, owes: 0, net: 20 }],
      ["c", { userId: "c", paid: 0, owes: 0, net: -25 }],
      ["d", { userId: "d", paid: 0, owes: 0, net: -25 }],
    ]);
    const settlements = simplifyDebts(balances);
    // 4 members → at most 3 transfers
    expect(settlements.length).toBeLessThanOrEqual(3);
    const totalMoved = settlements.reduce((acc, s) => acc + s.amount, 0);
    expect(totalMoved).toBe(50);
  });
});
