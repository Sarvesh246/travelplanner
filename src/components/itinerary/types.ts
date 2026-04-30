import { StopStatus, StayStatus, ActivityStatus } from "@prisma/client";

export interface StaySerialized {
  id: string;
  name: string;
  address: string | null;
  url: string | null;
  roomSiteNumbers: string[];
  arrivalTime: string | null;
  checkIn: string | null;
  checkInTime: string | null;
  checkOut: string | null;
  checkOutTime: string | null;
  leaveTime: string | null;
  pricePerNight: number | null;
  totalPrice: number | null;
  status: StayStatus;
  notes: string | null;
  confirmationNo: string | null;
}

export interface ActivitySerialized {
  id: string;
  name: string;
  description: string | null;
  scheduledDate: string | null;
  startTime: string | null;
  endTime: string | null;
  durationMins: number | null;
  estimatedCost: number | null;
  actualCost: number | null;
  status: ActivityStatus;
  url: string | null;
  sortOrder: number;
}

export interface StopSerialized {
  id: string;
  name: string;
  country: string | null;
  description: string | null;
  /** From DB — plain numbers for RSC / client */
  latitude: number | null;
  longitude: number | null;
  placeId: string | null;
  sortOrder: number;
  arrivalDate: string | null;
  departureDate: string | null;
  status: StopStatus;
  stays: StaySerialized[];
  activities: ActivitySerialized[];
}

export type StopDetailTab = "stays" | "activities";

export type DayPlanItemKind = "stop-arrival" | "stop-departure" | "stay" | "activity";

export interface DayPlanItemBase {
  id: string;
  kind: DayPlanItemKind;
  sourceId: string;
  stopId: string;
  stopName: string;
  date: string;
  title: string;
  subtitle: string | null;
  timeLabel: string | null;
  href: string;
  targetTab: StopDetailTab;
}

export interface DayPlanStopItem extends DayPlanItemBase {
  kind: "stop-arrival" | "stop-departure";
}

export interface DayPlanStayItem extends DayPlanItemBase {
  kind: "stay";
  status: StayStatus;
  phase: "single" | "start" | "middle" | "end";
}

export interface DayPlanActivityItem extends DayPlanItemBase {
  kind: "activity";
  status: ActivityStatus;
}

export type DayPlanItem = DayPlanStopItem | DayPlanStayItem | DayPlanActivityItem;

export interface DayPlan {
  date: string;
  label: string;
  items: DayPlanItem[];
  counts: {
    stops: number;
    stays: number;
    activities: number;
  };
}
