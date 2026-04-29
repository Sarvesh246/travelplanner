"use client";

const KEY = (tripId: string) => `trip-ui:${tripId}`;

export interface TripUiPrefs {
  expenseSort?: "date" | "amount" | "payer" | "category";
  expenseMine?: boolean;
  supplyMine?: boolean;
  supplySort?: "status" | "name" | "assignee";
  votesFilter?: "open" | "closed" | "unanswered";
  memberSort?: "role" | "joined";
  compactNav?: boolean;
  lastSection?: string;
}

export function readTripUiPrefs(tripId: string): TripUiPrefs {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(KEY(tripId));
    if (!raw) return {};
    return JSON.parse(raw) as TripUiPrefs;
  } catch {
    return {};
  }
}

export function writeTripUiPrefs(tripId: string, patch: Partial<TripUiPrefs>) {
  if (typeof window === "undefined") return;
  const next = { ...readTripUiPrefs(tripId), ...patch };
  try {
    localStorage.setItem(KEY(tripId), JSON.stringify(next));
  } catch {
    /* ignore quota */
  }
}
