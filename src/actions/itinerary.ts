"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { activityToClientJson, stayToClientJson, stopToClientJson } from "@/lib/serialize/prisma-json";
import { assertCanContribute, getAuthUser } from "@/lib/auth/trip-permissions";

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
      arrivalDate: data.arrivalDate ? new Date(data.arrivalDate) : undefined,
      departureDate: data.departureDate ? new Date(data.departureDate) : undefined,
      sortOrder: (maxOrder._max.sortOrder ?? -1) + 1,
    },
  });

  revalidateItineraryAndStop(tripId, stop.id);
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

  const updated = await prisma.stop.update({
    where: { id: stopId },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.country !== undefined && { country: data.country }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.arrivalDate && { arrivalDate: new Date(data.arrivalDate) }),
      ...(data.departureDate && { departureDate: new Date(data.departureDate) }),
      ...(data.status && { status: data.status as never }),
    },
  });

  revalidateItineraryAndStop(stop.tripId, stopId);
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
}

export async function restoreStop(stopId: string) {
  const user = await getAuthUser();
  const stop = await prisma.stop.findUnique({ where: { id: stopId } });
  if (!stop) throw new Error("Stop not found");
  await assertCanContribute(stop.tripId, user.id);

  await prisma.stop.update({ where: { id: stopId }, data: { deletedAt: null } });
  revalidateItinerary(stop.tripId);
  revalidateStopPage(stop.tripId, stopId);
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
}

// ── Stays ────────────────────────────────────────────────────────────────────

export async function createStay(
  stopId: string,
  data: { name: string; address?: string; url?: string; checkIn?: string; checkOut?: string; pricePerNight?: number; totalPrice?: number; notes?: string }
) {
  const user = await getAuthUser();
  const stop = await prisma.stop.findUnique({ where: { id: stopId } });
  if (!stop) throw new Error("Stop not found");
  await assertCanContribute(stop.tripId, user.id);

  const stay = await prisma.stay.create({
    data: {
      stopId,
      createdById: user.id,
      name: data.name,
      address: data.address,
      url: data.url,
      checkIn: data.checkIn ? new Date(data.checkIn) : undefined,
      checkOut: data.checkOut ? new Date(data.checkOut) : undefined,
      pricePerNight: data.pricePerNight,
      totalPrice: data.totalPrice,
      notes: data.notes,
    },
  });

  revalidateItineraryAndStop(stop.tripId, stopId);
  return { stay: stayToClientJson(stay) };
}

export async function updateStay(
  stayId: string,
  data: Partial<{ name: string; address: string; url: string; checkIn: string; checkOut: string; pricePerNight: number; totalPrice: number; notes: string; status: string; confirmationNo: string }>
) {
  const user = await getAuthUser();
  const stay = await prisma.stay.findUnique({ where: { id: stayId }, include: { stop: true } });
  if (!stay) throw new Error("Stay not found");
  await assertCanContribute(stay.stop.tripId, user.id);

  const updated = await prisma.stay.update({
    where: { id: stayId },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.address !== undefined && { address: data.address }),
      ...(data.url !== undefined && { url: data.url }),
      ...(data.checkIn && { checkIn: new Date(data.checkIn) }),
      ...(data.checkOut && { checkOut: new Date(data.checkOut) }),
      ...(data.pricePerNight !== undefined && { pricePerNight: data.pricePerNight }),
      ...(data.totalPrice !== undefined && { totalPrice: data.totalPrice }),
      ...(data.notes !== undefined && { notes: data.notes }),
      ...(data.status && { status: data.status as never }),
      ...(data.confirmationNo !== undefined && { confirmationNo: data.confirmationNo }),
    },
  });

  revalidateItineraryAndStop(stay.stop.tripId, stay.stopId);
  return { stay: stayToClientJson(updated) };
}

export async function deleteStay(stayId: string) {
  const user = await getAuthUser();
  const stay = await prisma.stay.findUnique({ where: { id: stayId }, include: { stop: true } });
  if (!stay) throw new Error("Stay not found");
  await assertCanContribute(stay.stop.tripId, user.id);

  await prisma.stay.update({ where: { id: stayId }, data: { deletedAt: new Date() } });
  revalidateItineraryAndStop(stay.stop.tripId, stay.stopId);
}

// ── Activities ───────────────────────────────────────────────────────────────

export async function createActivity(
  stopId: string,
  data: { name: string; description?: string; scheduledDate?: string; scheduledTime?: string; durationMins?: number; estimatedCost?: number; url?: string }
) {
  const user = await getAuthUser();
  const stop = await prisma.stop.findUnique({ where: { id: stopId } });
  if (!stop) throw new Error("Stop not found");
  await assertCanContribute(stop.tripId, user.id);

  const activity = await prisma.activity.create({
    data: {
      stopId,
      createdById: user.id,
      name: data.name,
      description: data.description,
      scheduledDate: data.scheduledDate ? new Date(data.scheduledDate) : undefined,
      scheduledTime: data.scheduledTime,
      durationMins: data.durationMins,
      estimatedCost: data.estimatedCost,
      url: data.url,
    },
  });

  revalidateItineraryAndStop(stop.tripId, stopId);
  return { activity: activityToClientJson(activity) };
}

export async function updateActivity(
  activityId: string,
  data: Partial<{ name: string; description: string; scheduledDate: string; scheduledTime: string; durationMins: number; estimatedCost: number; actualCost: number; status: string; url: string }>
) {
  const user = await getAuthUser();
  const activity = await prisma.activity.findUnique({ where: { id: activityId }, include: { stop: true } });
  if (!activity) throw new Error("Activity not found");
  await assertCanContribute(activity.stop.tripId, user.id);

  const updated = await prisma.activity.update({
    where: { id: activityId },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.scheduledDate && { scheduledDate: new Date(data.scheduledDate) }),
      ...(data.scheduledTime !== undefined && { scheduledTime: data.scheduledTime }),
      ...(data.durationMins !== undefined && { durationMins: data.durationMins }),
      ...(data.estimatedCost !== undefined && { estimatedCost: data.estimatedCost }),
      ...(data.actualCost !== undefined && { actualCost: data.actualCost }),
      ...(data.status && { status: data.status as never }),
      ...(data.url !== undefined && { url: data.url }),
    },
  });

  revalidateItineraryAndStop(activity.stop.tripId, activity.stopId);
  return { activity: activityToClientJson(updated) };
}

export async function deleteActivity(activityId: string) {
  const user = await getAuthUser();
  const activity = await prisma.activity.findUnique({ where: { id: activityId }, include: { stop: true } });
  if (!activity) throw new Error("Activity not found");
  await assertCanContribute(activity.stop.tripId, user.id);

  await prisma.activity.update({ where: { id: activityId }, data: { deletedAt: new Date() } });
  revalidateItineraryAndStop(activity.stop.tripId, activity.stopId);
}
