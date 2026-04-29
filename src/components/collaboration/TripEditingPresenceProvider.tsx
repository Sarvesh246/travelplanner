"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { useTripContext } from "@/components/trip/TripContext";

type ActiveEditorState = {
  surfaceId: string;
  surfaceLabel: string;
  resourceId: string;
  resourceLabel: string;
  fieldKey: string;
  fieldLabel: string;
};

type PresenceEnvelope = {
  userId: string;
  name: string;
  avatarUrl: string | null;
  active: ActiveEditorState | null;
  updatedAt: number;
};

export type ActiveTripEditor = PresenceEnvelope;

type TripEditingPresenceContextValue = {
  activeEditors: ActiveTripEditor[];
  setActiveState: (next: ActiveEditorState | null) => void;
};

const TripEditingPresenceContext =
  createContext<TripEditingPresenceContextValue | null>(null);

function getTripEditingChannelName(tripId: string) {
  return `trip-editing:${tripId}`;
}

function flattenPresenceState(
  state: Record<string, PresenceEnvelope[] | undefined>,
  currentUserId: string
) {
  return Object.values(state)
    .flatMap((entries) => entries ?? [])
    .filter(
      (entry): entry is PresenceEnvelope =>
        Boolean(entry?.userId) &&
        entry.userId !== currentUserId &&
        Boolean(entry.active)
    )
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

export function TripEditingPresenceProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { trip, currentUser, canEdit } = useTripContext();
  const [activeEditors, setActiveEditors] = useState<ActiveTripEditor[]>([]);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const latestStateRef = useRef<ActiveEditorState | null>(null);
  const subscribedRef = useRef(false);

  const syncTrackedState = useCallback(async () => {
    const channel = channelRef.current;
    if (!channel || !subscribedRef.current) return;

    await channel.track({
      userId: currentUser.id,
      name: currentUser.name,
      avatarUrl: currentUser.avatarUrl,
      active: latestStateRef.current,
      updatedAt: Date.now(),
    });
  }, [currentUser.avatarUrl, currentUser.id, currentUser.name]);

  useEffect(() => {
    if (!canEdit) return;

    const supabase = createClient();
    const channel = supabase.channel(getTripEditingChannelName(trip.id), {
      config: { presence: { key: currentUser.id } },
    });

    channelRef.current = channel;

    const handlePresenceSync = () => {
      setActiveEditors(
        flattenPresenceState(
          channel.presenceState<PresenceEnvelope>(),
          currentUser.id
        )
      );
    };

    channel
      .on("presence", { event: "sync" }, handlePresenceSync)
      .on("presence", { event: "join" }, handlePresenceSync)
      .on("presence", { event: "leave" }, handlePresenceSync)
      .subscribe(async (status) => {
        if (status !== "SUBSCRIBED") return;
        subscribedRef.current = true;
        await syncTrackedState();
      });

    function clearOnHide() {
      if (document.visibilityState === "hidden") {
        latestStateRef.current = null;
        void syncTrackedState();
      }
    }

    document.addEventListener("visibilitychange", clearOnHide);

    return () => {
      subscribedRef.current = false;
      document.removeEventListener("visibilitychange", clearOnHide);
      setActiveEditors([]);
      latestStateRef.current = null;
      channelRef.current = null;
      void supabase.removeChannel(channel);
    };
  }, [canEdit, currentUser.id, syncTrackedState, trip.id]);

  const setActiveState = useCallback(
    (next: ActiveEditorState | null) => {
      latestStateRef.current = next;
      void syncTrackedState();
    },
    [syncTrackedState]
  );

  const value = useMemo(
    () => ({ activeEditors, setActiveState }),
    [activeEditors, setActiveState]
  );

  return (
    <TripEditingPresenceContext.Provider value={value}>
      {children}
    </TripEditingPresenceContext.Provider>
  );
}

export function useTripEditingPresenceField(
  config:
    | {
        surfaceId: string;
        surfaceLabel: string;
        resourceId: string;
        resourceLabel: string;
        fieldKey: string;
        fieldLabel: string;
      }
    | null
) {
  const ctx = useContext(TripEditingPresenceContext);
  if (!ctx) {
    throw new Error(
      "useTripEditingPresenceField must be used inside TripEditingPresenceProvider"
    );
  }

  const activeState = useMemo<ActiveEditorState | null>(() => {
    if (!config) return null;
    return {
      surfaceId: config.surfaceId,
      surfaceLabel: config.surfaceLabel,
      resourceId: config.resourceId,
      resourceLabel: config.resourceLabel,
      fieldKey: config.fieldKey,
      fieldLabel: config.fieldLabel,
    };
  }, [config]);

  const activate = useCallback(() => {
    if (!activeState) return;
    ctx.setActiveState(activeState);
  }, [activeState, ctx]);

  const clear = useCallback(() => {
    ctx.setActiveState(null);
  }, [ctx]);

  const fieldEditors = useMemo(
    () =>
      !config
        ? []
        :
      ctx.activeEditors.filter(
        (entry) =>
          entry.active?.resourceId === config.resourceId &&
          entry.active?.fieldKey === config.fieldKey
      ),
    [config, ctx.activeEditors]
  );

  const surfaceEditors = useMemo(
    () =>
      !config
        ? []
        :
      ctx.activeEditors.filter(
        (entry) => entry.active?.surfaceId === config.surfaceId
      ),
    [config, ctx.activeEditors]
  );

  return {
    activate,
    clear,
    fieldEditors,
    surfaceEditors,
  };
}
