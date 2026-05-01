"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { activityToClientJson, stayToClientJson, stopToClientJson } from "@/lib/serialize/prisma-json";
import { assertCanContribute, getAuthUser } from "@/lib/auth/trip-permissions";
import { logAuditEvent } from "@/lib/observability/audit";
import { deriveDurationMins } from "@/lib/utils";
import {
  assertDateOrder,
  parsePlanningDateInput,
} from "@/lib/calendar/planning-dates";

function revalidateItinerary(tripId: string) {
  revalidatePath(`/trips/${tripId}/itinerary`);
}

function revalidateStopPage(tripId: string, stopId: string) {
  revalidatePath(`/trips/${tripId}/stops/${stopId}`);
}

function revalidateItineraryAndStop(tripId: string, stopId: string) {
  revalidateItinerary(tripId);
  revalidateStopPage(tripId, stopId);
}

function changedFieldKeys<T extends object>(input: T) {
  return (Object.keys(input) as Array<keyof T & string>).filter(
    (key) => input[key] !== undefined
  );
}

function normalizeOptionalText(value: string | null | undefined) {
  if (value == null) return value;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

// ── Stops ────────────────────────────────────────────────────────────────────

export async function createStop(
  tripId: string,
  data: {
    name: string;
    country?: string;
    description?: string;
    arrivalDate?: string;
    departureDate?: string;
    latitude?: number;
    longitude?: number;
    placeId?: string;
  }
) {
  const user = await getAuthUser();
  await assertCanContribute(tripId, user.id);
  const arrivalDate = await parsePlanningDateInput(data.arrivalDate, "Arrival date");
  const departureDate = await parsePlanningDateInput(data.departureDate, "Departure date");
  await assertDateOrder(data.arrivalDate ?? null, data.departureDate ?? null);

  const maxOrder = await prisma.stop.aggregate({
    where: { tripId, deletedAt: null },
    _max: { sortOrder: true },
  });

  const stop = await prisma.stop.create({
    data: {
      tripId,
      name: data.name,
      country: data.country,
      description: data.description,
      latitude: Number.isFinite(data.latitude) ? data.latitude : undefined,
      longitude: Number.isFinite(data.longitude) ? data.longitude : undefined,
      placeId: data.placeId,
      arrivalDate,
      departureDate,
      sortOrder: (maxOrder._max.sortOrder ?? -1) + 1,
    },
  });

  revalidateItineraryAndStop(tripId, stop.id);
  await logAuditEvent({
    action: "stop.created",
    actorUserId: user.id,
    tripId,
    targetId: stop.id,
    summary: `Added stop ${stop.name}`,
    metadata: {
      country: stop.country,
      hasDates: Boolean(stop.arrivalDate || stop.departureDate),
    },
  });
  return { stop: stopToClientJson(stop) };
}

export async function updateStop(
  stopId: string,
  data: Partial<{ name: string; country: string; description: string; arrivalDate: string; departureDate: string; status: string }>
) {
  const user = await getAuthUser();
  const stop = await prisma.stop.findUnique({ where: { id: stopId } });
  if (!stop) throw new Error("Stop not found");
  await assertCanContribute(stop.tripId, user.id);
  const arrivalDate = await parsePlanningDateInput(data.arrivalDate, "Arrival date");
  const departureDate = await parsePlanningDateInput(data.departureDate, "Departure date");
  await assertDateOrder(
    data.arrivalDate ?? stop.arrivalDate?.toISOString().slice(0, 10) ?? null,
    data.departureDate ?? stop.departureDate?.toISOString().slice(0, 10) ?? null
  );

  const updated = await prisma.stop.update({
    where: { id: stopId },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.country !== undefined && { country: data.country }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.arrivalDate && { arrivalDate }),
      ...(data.departureDate && { departureDate }),
      ...(data.status && { status: data.status as never }),
    },
  });

  revalidateItineraryAndStop(stop.tripId, stopId);
  await logAuditEvent({
    action: "stop.updated",
    actorUserId: user.id,
    tripId: stop.tripId,
    targetId: stopId,
    summary: `Updated stop ${updated.name}`,
    metadata: {
      changedFields: changedFieldKeys(data),
    },
  });
  return { stop: stopToClientJson(updated) };
}

export async function deleteStop(stopId: string) {
  const user = await getAuthUser();
  const stop = await prisma.stop.findUnique({ where: { id: stopId } });
  if (!stop) throw new Error("Stop not found");
  await assertCanContribute(stop.tripId, user.id);

  await prisma.stop.update({ where: { id: stopId }, data: { deletedAt: new Date() } });
  revalidateItinerary(stop.tripId);
  revalidateStopPage(stop.tripId, stopId);
  await logAuditEvent({
    action: "stop.deleted",
    actorUserId: user.id,
    tripId: stop.tripId,
    targetId: stopId,
    summary: `Deleted stop ${stop.name}`,
  });
}

export async function restoreStop(stopId: string) {
  const user = await getAuthUser();
  const stop = await prisma.stop.findUnique({ where: { id: stopId } });
  if (!stop) throw new Error("Stop not found");
  await assertCanContribute(stop.tripId, user.id);

  await prisma.stop.update({ where: { id: stopId }, data: { deletedAt: null } });
  revalidateItinerary(stop.tripId);
  revalidateStopPage(stop.tripId, stopId);
  await logAuditEvent({
    action: "stop.restored",
    actorUserId: user.id,
    tripId: stop.tripId,
    targetId: stopId,
    summary: `Restored stop ${stop.name}`,
  });
}

export async function reorderStops(tripId: string, orderedIds: string[]) {
  const user = await getAuthUser();
  await assertCanContribute(tripId, user.id);

  await Promise.all(
    orderedIds.map((id, idx) =>
      prisma.stop.update({ where: { id }, data: { sortOrder: idx } })
    )
  );

  revalidatePath(`/trips/${tripId}/itinerary`);
  await logAuditEvent({
    action: "stop.reordered",
    actorUserId: user.id,
    tripId,
    summary: `Reordered ${orderedIds.length} stops`,
    metadata: {
      orderedStopIds: orderedIds,
    },
  });
}

// ── Stays ────────────────────────────────────────────────────────────────────

export async function createStay(
  stopId: string,
  data: {
    name: string;
    address?: string;
    url?: string;
    roomSiteNumbers?: string[];
    arrivalTime?: string;
    checkIn?: string;
    checkInTime?: string;
    checkOut?: string;
    checkOutTime?: string;
    leaveTime?: string;
    pricePerNight?: number;
    totalPrice?: number;
    notes?: string;
  }
) {
  const user = await getAuthUser();
  const stop = await prisma.stop.findUnique({ where: { id: stopId } });
  if (!stop) throw new Error("Stop not found");
  await assertCanContribute(stop.tripId, user.id);
  const checkIn = await parsePlanningDateInput(data.checkIn, "Check-in date");
  const checkOut = await parsePlanningDateInput(data.checkOut, "Check-out date");
  await assertDateOrder(data.checkIn ?? null, data.checkOut ?? null);

  const stay = await prisma.stay.create({
    data: {
      stopId,
      createdById: user.id,
      name: data.name,
      address: data.address,
      url: data.url,
      roomSiteNumbers: data.roomSiteNumbers ?? [],
      arrivalTime: data.arrivalTime,
      checkIn,
      checkInTime: data.checkInTime,
      checkOut,
      checkOutTime: data.checkOutTime,
      leaveTime: data.leaveTime,
      pricePerNight: data.pricePerNight,
      totalPrice: data.totalPrice,
      notes: data.notes,
    },
  });

  revalidateItineraryAndStop(stop.tripId, stopId);
  await logAuditEvent({
    action: "stay.created",
    actorUserId: user.id,
    tripId: stop.tripId,
    targetId: stay.id,
    summary: `Added stay ${stay.name}`,
    metadata: {
      stopId,
      stopName: stop.name,
    },
  });
  return { stay: stayToClientJson(stay) };
}

export async function updateStay(
  stayId: string,
  data: Partial<{
    name: string;
    address: string;
    url: string;
    roomSiteNumbers: string[];
    arrivalTime: string;
    checkIn: string;
    checkInTime: string;
    checkOut: string;
    checkOutTime: string;
    leaveTime: string;
    pricePerNight: number;
    totalPrice: number;
    notes: string;
    status: string;
    confirmationNo: string;
  }>
) {
  const user = await getAuthUser();
  const stay = await prisma.stay.findUnique({ where: { id: stayId }, include: { stop: true } });
  if (!stay) throw new Error("Stay not found");
  await assertCanContribute(stay.stop.tripId, user.id);
  const checkIn = await parsePlanningDateInput(data.checkIn, "Check-in date");
  const checkOut = await parsePlanningDateInput(data.checkOut, "Check-out date");
  await assertDateOrder(
    data.checkIn ?? stay.checkIn?.toISOString().slice(0, 10) ?? null,
    data.checkOut ?? stay.checkOut?.toISOString().slice(0, 10) ?? null
  );

  const updated = await prisma.stay.update({
    where: { id: stayId },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.address !== undefined && { address: data.address }),
      ...(data.url !== undefined && { url: data.url }),
      ...(data.roomSiteNumbers !== undefined && { roomSiteNumbers: data.roomSiteNumbers }),
      ...(data.arrivalTime !== undefined && { arrivalTime: data.arrivalTime }),
      ...(data.checkIn && { checkIn }),
      ...(data.checkInTime !== undefined && { checkInTime: data.checkInTime }),
      ...(data.checkOut && { checkOut }),
      ...(data.checkOutTime !== undefined && { checkOutTime: data.checkOutTime }),
      ...(data.leaveTime !== undefined && { leaveTime: data.leaveTime }),
      ...(data.pricePerNight !== undefined && { pricePerNight: data.pricePerNight }),
      ...(data.totalPrice !== undefined && { totalPrice: data.totalPrice }),
      ...(data.notes !== undefined && { notes: data.notes }),
      ...(data.status && { status: data.status as never }),
      ...(data.confirmationNo !== undefined && { confirmationNo: data.confirmationNo }),
    },
  });

  revalidateItineraryAndStop(stay.stop.tripId, stay.stopId);
  await logAuditEvent({
    action: "stay.updated",
    actorUserId: user.id,
    tripId: stay.stop.tripId,
    targetId: stayId,
    summary: `Updated stay ${updated.name}`,
    metadata: {
      stopId: stay.stopId,
      changedFields: changedFieldKeys(data),
    },
  });
  return { stay: stayToClientJson(updated) };
}

export async function deleteStay(stayId: string) {
  const user = await getAuthUser();
  const stay = await prisma.stay.findUnique({ where: { id: stayId }, include: { stop: true } });
  if (!stay) throw new Error("Stay not found");
  await assertCanContribute(stay.stop.tripId, user.id);

  await prisma.stay.update({ where: { id: stayId }, data: { deletedAt: new Date() } });
  revalidateItineraryAndStop(stay.stop.tripId, stay.stopId);
  await logAuditEvent({
    action: "stay.deleted",
    actorUserId: user.id,
    tripId: stay.stop.tripId,
    targetId: stayId,
    summary: `Deleted stay ${stay.name}`,
    metadata: {
      stopId: stay.stopId,
    },
  });
}

// ── Activities ───────────────────────────────────────────────────────────────

export async function createActivity(
  stopId: string,
  data: {
    name: string;
    description?: string;
    scheduledDate?: string;
    startTime?: string;
    endTime?: string;
    durationMins?: number;
    estimatedCost?: number;
    url?: string;
  }
) {
  const user = await getAuthUser();
  const stop = await prisma.stop.findUnique({ where: { id: stopId } });
  if (!stop) throw new Error("Stop not found");
  await assertCanContribute(stop.tripId, user.id);

  const previousActivityDate = await prisma.activity.findFirst({
    where: {
      stopId,
      deletedAt: null,
      scheduledDate: { not: null },
    },
    orderBy: [{ scheduledDate: "desc" }, { sortOrder: "desc" }, { createdAt: "desc" }],
    select: { scheduledDate: true },
  });

  const scheduledDate = normalizeOptionalText(data.scheduledDate);
  const parsedScheduledDate = await parsePlanningDateInput(scheduledDate, "Scheduled date");
  const startTime = normalizeOptionalText(data.startTime);
  const endTime = normalizeOptionalText(data.endTime);
  const durationMins =
    data.durationMins ??
    deriveDurationMins(startTime ?? undefined, endTime ?? undefined);

  const activity = await prisma.activity.create({
    data: {
      stopId,
      createdById: user.id,
      name: data.name,
      description: data.description,
      scheduledDate: parsedScheduledDate ?? previousActivityDate?.scheduledDate ?? undefined,
      startTime: startTime ?? undefined,
      endTime: endTime ?? undefined,
      durationMins,
      estimatedCost: data.estimatedCost,
      url: data.url,
    },
  });

  revalidateItineraryAndStop(stop.tripId, stopId);
  await logAuditEvent({
    action: "activity.created",
    actorUserId: user.id,
    tripId: stop.tripId,
    targetId: activity.id,
    summary: `Added activity ${activity.name}`,
    metadata: {
      stopId,
      stopName: stop.name,
    },
  });
  return { activity: activityToClientJson(activity) };
}

export async function updateActivity(
  activityId: string,
  data: Partial<{
    name: string;
    description: string;
    scheduledDate: string | null;
    startTime: string | null;
    endTime: string | null;
    durationMins: number | null;
    estimatedCost: number | null;
    actualCost: number;
    status: string;
    url: string;
  }>
) {
  const user = await getAuthUser();
  const activity = await prisma.activity.findUnique({ where: { id: activityId }, include: { stop: true } });
  if (!activity) throw new Error("Activity not found");
  await assertCanContribute(activity.stop.tripId, user.id);

  const normalizedScheduledDate =
    data.scheduledDate === undefined ? undefined : normalizeOptionalText(data.scheduledDate);
  const parsedScheduledDate = await parsePlanningDateInput(
    normalizedScheduledDate,
    "Scheduled date"
  );
  const normalizedStartTime =
    data.startTime === undefined ? undefined : normalizeOptionalText(data.startTime);
  const normalizedEndTime =
    data.endTime === undefined ? undefined : normalizeOptionalText(data.endTime);

  const nextStartTime = normalizedStartTime === undefined ? activity.startTime : normalizedStartTime;
  const nextEndTime = normalizedEndTime === undefined ? activity.endTime : normalizedEndTime;
  const derivedDuration = deriveDurationMins(nextStartTime, nextEndTime);
  const nextDuration =
    data.durationMins === undefined ? derivedDuration : data.durationMins;

  const updated = await prisma.activity.update({
    where: { id: activityId },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(normalizedScheduledDate !== undefined && {
        scheduledDate: normalizedScheduledDate ? parsedScheduledDate : null,
      }),
      ...(normalizedStartTime !== undefined && { startTime: normalizedStartTime }),
      ...(normalizedEndTime !== undefined && { endTime: normalizedEndTime }),
      ...(nextDuration !== undefined && { durationMins: nextDuration }),
      ...(data.estimatedCost !== undefined && { estimatedCost: data.estimatedCost }),
      ...(data.actualCost !== undefined && { actualCost: data.actualCost }),
      ...(data.status && { status: data.status as never }),
      ...(data.url !== undefined && { url: data.url }),
    },
  });

  revalidateItineraryAndStop(activity.stop.tripId, activity.stopId);
  await logAuditEvent({
    action: "activity.updated",
    actorUserId: user.id,
    tripId: activity.stop.tripId,
    targetId: activityId,
    summary: `Updated activity ${updated.name}`,
    metadata: {
      stopId: activity.stopId,
      changedFields: changedFieldKeys(data),
    },
  });
  return { activity: activityToClientJson(updated) };
}

export async function deleteActivity(activityId: string) {
  const user = await getAuthUser();
  const activity = await prisma.activity.findUnique({ where: { id: activityId }, include: { stop: true } });
  if (!activity) throw new Error("Activity not found");
  await assertCanContribute(activity.stop.tripId, user.id);

  await prisma.activity.update({ where: { id: activityId }, data: { deletedAt: new Date() } });
  revalidateItineraryAndStop(activity.stop.tripId, activity.stopId);
  await logAuditEvent({
    action: "activity.deleted",
    actorUserId: user.id,
    tripId: activity.stop.tripId,
    targetId: activityId,
    summary: `Deleted activity ${activity.name}`,
    metadata: {
      stopId: activity.stopId,
    },
  });
}
