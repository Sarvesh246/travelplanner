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
  canEdit: boolean;
  isOwner: boolean;
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
  const canEdit = ["OWNER", "ADMIN"].includes(currentUser.role);
  const isOwner = currentUser.role === "OWNER";

  return (
    <TripContext.Provider value={{ trip, currentUser, members, canEdit, isOwner }}>
      {children}
    </TripContext.Provider>
  );
}
