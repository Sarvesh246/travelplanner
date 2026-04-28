/** Hash fragments for scrolling / selection on trip sub-pages (auth still required). */

export function expenseAnchorForId(id: string) {
  return `expense-${id}`;
}

export function supplyAnchorForId(id: string) {
  return `supply-${id}`;
}

export function parseExpenseHash(hash: string): string | null {
  const m = hash.replace(/^#/, "").match(/^expense-(.+)$/);
  return m?.[1] ?? null;
}

export function parseSupplyHash(hash: string): string | null {
  const m = hash.replace(/^#/, "").match(/^supply-(.+)$/);
  return m?.[1] ?? null;
}
