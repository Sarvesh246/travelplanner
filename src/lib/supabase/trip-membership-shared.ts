export type TripMembershipRealtimeEvent =
  | {
      type: "access-revoked";
      tripId: string;
      targetUserId: string;
      reason: "removed" | "left" | "deleted";
    }
  | {
      type: "membership-updated";
      tripId: string;
      targetUserId: string;
      role: string;
    };

export function getTripMembershipChannelName(tripId: string, userId: string) {
  return `trip-membership:${tripId}:${userId}`;
}
