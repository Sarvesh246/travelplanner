"use client";

import { createContext, useContext } from "react";
import { MemberRole } from "@prisma/client";

interface TripMemberInfo {
  id: string;
  userId: string;
  role: MemberRole;
  joinedAt: string;
  user: { id: string; name: string; email: string; avatarUrl: string | null };
}

interface CurrentUser {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  role: MemberRole;
}

interface TripInfo {
  id: string;
  name: string;
  currency: string;
  status: string;
  startDate: string | null;
  endDate: string | null;
  budgetTarget: number | null;
  coverImageUrl: string | null;
}

interface TripContextValue {
  trip: TripInfo;
  currentUser: CurrentUser;
  members: TripMemberInfo[];
  /** Can create or edit trip content (stops, expenses, comments, votes, etc.). Not viewers. */
  canEdit: boolean;
  /** Can manage members, invites, and close/delete structural items that require admin. */
  canManage: boolean;
  isOwner: boolean;
  isViewer: boolean;
}

const TripContext = createContext<TripContextValue | null>(null);

export function useTripContext() {
  const ctx = useContext(TripContext);
  if (!ctx) throw new Error("useTripContext must be used inside TripProvider");
  return ctx;
}

export function TripProvider({
  children,
  trip,
  currentUser,
  members,
}: {
  children: React.ReactNode;
  trip: TripInfo;
  currentUser: CurrentUser;
  members: TripMemberInfo[];
}) {
  const canEdit = ["OWNER", "ADMIN", "MEMBER"].includes(currentUser.role);
  const canManage = ["OWNER", "ADMIN"].includes(currentUser.role);
  const isOwner = currentUser.role === "OWNER";
  const isViewer = currentUser.role === "VIEWER";

  return (
    <TripContext.Provider
      value={{ trip, currentUser, members, canEdit, canManage, isOwner, isViewer }}
    >
      {children}
    </TripContext.Provider>
  );
}
