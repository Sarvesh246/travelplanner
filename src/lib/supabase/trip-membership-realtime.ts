import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  getTripMembershipChannelName,
  type TripMembershipRealtimeEvent,
} from "@/lib/supabase/trip-membership-shared";

export async function publishTripMembershipEvent(event: TripMembershipRealtimeEvent) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return;

  const channel = supabase.channel(
    getTripMembershipChannelName(event.tripId, event.targetUserId)
  );

  try {
    await channel.subscribe(async (status) => {
      if (status !== "SUBSCRIBED") return;
      await channel.send({
        type: "broadcast",
        event: "trip-membership",
        payload: event,
      });
      await supabase.removeChannel(channel);
    });
  } catch (error) {
    console.error("[trip-membership-realtime] failed to publish", {
      tripId: event.tripId,
      targetUserId: event.targetUserId,
      error: error instanceof Error ? error.message : String(error),
    });
    try {
      await supabase.removeChannel(channel);
    } catch {}
  }
}
