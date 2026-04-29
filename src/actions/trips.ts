"use server";

import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { prisma } from "@/lib/prisma";
import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { tripToClientJson } from "@/lib/serialize/prisma-json";
import { CURRENCIES } from "@/lib/constants";
import {
  assertCanManage,
  assertCanView,
  assertOwner,
  getAuthUser,
} from "@/lib/auth/trip-permissions";
import { TripStatus } from "@prisma/client";
import { logAuditEvent } from "@/lib/observability/audit";
import { reportServerError } from "@/lib/observability/errors";
import { publishTripMembershipEvent } from "@/lib/supabase/trip-membership-realtime";

const currencyCodes = CURRENCIES.map((currency) => currency.code) as [string, ...string[]];

function parseDateInput(value: string | null | undefined, label: string) {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`${label} is not a valid date`);
  }
  return date;
}

function assertDateOrder(startDate: Date | undefined, endDate: Date | undefined) {
  if (startDate && endDate && startDate > endDate) {
    throw new Error("End date must be after the start date");
  }
}

const createTripSchema = z.object({
  name: z.string().trim().min(1, "Trip name is required").max(100, "Trip name is too long"),
  description: z.string().trim().max(1000, "Description is too long").optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  currency: z.enum(currencyCodes).default("USD"),
  budgetTarget: z.number().finite().nonnegative("Budget must be 0 or more").optional(),
  estimatedCostOverride: z.number().finite().nonnegative("Estimated cost must be 0 or more").nullable().optional(),
});

const updateTripSchema = createTripSchema.partial().extend({
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
  status: z.nativeEnum(TripStatus).optional(),
  coverImageUrl: z.string().url().nullable().optional(),
});

export async function createTrip(input: z.infer<typeof createTripSchema>) {
  const user = await getAuthUser();
  const data = createTripSchema.parse(input);
  const startDate = parseDateInput(data.startDate, "Start date");
  const endDate = parseDateInput(data.endDate, "End date");
  assertDateOrder(startDate, endDate);

  const trip = await prisma.trip.create({
    data: {
      name: data.name,
      description: data.description || undefined,
      startDate,
      endDate,
      currency: data.currency,
      budgetTarget: data.budgetTarget,
      estimatedCostOverride: data.estimatedCostOverride,
      members: {
        create: { userId: user.id, role: "OWNER" },
      },
    },
  });

  revalidatePath("/dashboard");
  revalidateTag(`trip-${trip.id}`, "max");
  await logAuditEvent({
    action: "trip.created",
    actorUserId: user.id,
    tripId: trip.id,
    summary: `Created trip ${trip.name}`,
    metadata: {
      currency: trip.currency,
      hasManualEstimate: data.estimatedCostOverride != null,
    },
  });
  return { trip: tripToClientJson(trip) };
}

export async function updateTrip(
  tripId: string,
  input: z.infer<typeof updateTripSchema>
) {
  const user = await getAuthUser();
  await assertCanManage(tripId, user.id);
  const data = updateTripSchema.parse(input);
  const startDate = parseDateInput(data.startDate, "Start date");
  const endDate = parseDateInput(data.endDate, "End date");

  if (startDate || endDate) {
    const existing = await prisma.trip.findUnique({
      where: { id: tripId },
      select: { startDate: true, endDate: true },
    });
    if (!existing) throw new Error("Trip not found");
    assertDateOrder(startDate ?? existing.startDate ?? undefined, endDate ?? existing.endDate ?? undefined);
  }

  const trip = await prisma.trip.update({
    where: { id: tripId },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.description !== undefined && { description: data.description || null }),
      ...(data.startDate !== undefined && { startDate: startDate ?? null }),
      ...(data.endDate !== undefined && { endDate: endDate ?? null }),
      ...(data.currency !== undefined && { currency: data.currency }),
      ...(data.budgetTarget !== undefined && { budgetTarget: data.budgetTarget }),
      ...(data.estimatedCostOverride !== undefined && { estimatedCostOverride: data.estimatedCostOverride }),
      ...(data.status !== undefined && { status: data.status }),
      ...(data.coverImageUrl !== undefined && { coverImageUrl: data.coverImageUrl }),
    },
  });

  revalidatePath("/dashboard");
  revalidatePath(`/trips/${tripId}`);
  revalidatePath(`/trips/${tripId}/overview`);
  revalidateTag(`trip-${tripId}`, "max");
  await logAuditEvent({
    action: "trip.updated",
    actorUserId: user.id,
    tripId,
    summary: "Updated trip details",
    metadata: {
      changedFields: Object.keys(data),
      status: data.status ?? null,
      coverImageUrlUpdated: data.coverImageUrl !== undefined,
      estimatedCostOverride: data.estimatedCostOverride ?? null,
    },
  });
  return { trip: tripToClientJson(trip) };
}

/**
 * Copies trip metadata, stops, and supply templates into a new trip owned by the current user.
 * Expenses and votes are not copied—useful as a repeatable planning scaffold.
 */
export async function duplicateTrip(sourceTripId: string) {
  const user = await getAuthUser();
  await assertCanView(sourceTripId, user.id);

  const src = await prisma.trip.findFirst({
    where: { id: sourceTripId, deletedAt: null },
    include: {
      stops: { where: { deletedAt: null }, orderBy: { sortOrder: "asc" } },
      supplyItems: { where: { deletedAt: null }, take: 500 },
    },
  });
  if (!src) throw new Error("Trip not found");

  const trimmed = src.name.trim();
  const baseName = trimmed.length > 92 ? `${trimmed.slice(0, 89)}…` : trimmed;

  const newTrip = await prisma.trip.create({
    data: {
      name: `${baseName} (copy)`,
      description: src.description,
      currency: src.currency,
      status: "PLANNING",
      budgetTarget: src.budgetTarget,
      estimatedCostOverride: null,
      startDate: null,
      endDate: null,
      members: {
        create: { userId: user.id, role: "OWNER" },
      },
      stops: {
        create: src.stops.map((s) => ({
          name: s.name,
          country: s.country,
          description: s.description,
          latitude: s.latitude,
          longitude: s.longitude,
          placeId: s.placeId,
          sortOrder: s.sortOrder,
          arrivalDate: null,
          departureDate: null,
          status: "DRAFT" as const,
        })),
      },
    },
  });

  if (src.supplyItems.length > 0) {
    await prisma.supplyItem.createMany({
      data: src.supplyItems.map((si) => ({
        tripId: newTrip.id,
        createdById: user.id,
        name: si.name,
        category: si.category,
        description: si.description,
        quantityNeeded: si.quantityNeeded,
        quantityOwned: 0,
        quantityRemaining: Math.max(0, si.quantityNeeded),
        estimatedCost: si.estimatedCost,
        actualCost: null,
        status: "NEEDED" as const,
        whoBringsId: null,
        whoBoughtId: null,
        notes: si.notes,
      })),
    });
  }

  revalidatePath("/dashboard");
  revalidatePath(`/trips/${newTrip.id}/overview`);
  revalidateTag(`trip-${newTrip.id}`, "max");

  await logAuditEvent({
    action: "trip.duplicated",
    actorUserId: user.id,
    tripId: newTrip.id,
    targetId: sourceTripId,
    summary: `Duplicated trip into ${newTrip.name}`,
    metadata: { sourceTripId },
  });

  return { tripId: newTrip.id };
}

const TRIP_COVERS_BUCKET = "trip-covers";

/**
 * The cover URL is stored once on the Trip row — every member reads the same
 * `coverImageUrl` from the DB. Browsers then load the image from Supabase
 * using that URL, so the bucket must allow unauthenticated GETs (public bucket
 * or equivalent read policy), or other members will see a broken image.
 */
async function assertCoverUrlIsWorldReadable(publicUrl: string) {
  let res = await fetch(publicUrl, { method: "HEAD", cache: "no-store" });
  if (res.status === 405) {
    res = await fetch(publicUrl, { headers: { Range: "bytes=0-0" }, cache: "no-store" });
  }
  if (!res.ok) {
    throw new Error(
      `The file uploaded, but the image URL is not publicly readable (HTTP ${res.status}). In Supabase: Storage → "${TRIP_COVERS_BUCKET}" → set the bucket to Public, or add a policy so unauthenticated reads are allowed for that bucket, so all trip members can load the same cover URL.`
    );
  }
}

/** Upload a trip cover image to Supabase Storage and save the public URL on the trip. Buckets that back `getPublicUrl` must be publicly readable so every member (and `next/image`) can load the image. */
export async function uploadTripCover(tripId: string, formData: FormData) {
  const user = await getAuthUser();
  await assertCanManage(tripId, user.id);

  const raw = formData.get("file");
  if (!(raw instanceof File) || raw.size === 0) {
    throw new Error("No file selected");
  }
  if (!raw.type.startsWith("image/")) {
    throw new Error("Please choose an image file");
  }
  if (raw.size > 4 * 1024 * 1024) {
    throw new Error("Image must be 4MB or smaller");
  }

  const ext =
    raw.type === "image/png"
      ? "png"
      : raw.type === "image/webp"
        ? "webp"
        : raw.type === "image/gif"
          ? "gif"
          : "jpg";
  const path = `${user.id}/${tripId}/cover-${Date.now()}.${ext}`;

  const supabase = await createClient();
  const bytes = await raw.arrayBuffer();
  const { error: upErr } = await supabase.storage
    .from(TRIP_COVERS_BUCKET)
    .upload(path, bytes, { contentType: raw.type, upsert: true });

  if (upErr) {
    const hint =
      /not found|does not exist/i.test(upErr.message)
        ? ` Create a public storage bucket named "${TRIP_COVERS_BUCKET}" in the Supabase dashboard and add a policy so authenticated users can upload.`
        : "";
    throw new Error(`${upErr.message}${hint}`);
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(TRIP_COVERS_BUCKET).getPublicUrl(path);

  await assertCoverUrlIsWorldReadable(publicUrl);

  await prisma.trip.update({
    where: { id: tripId },
    data: { coverImageUrl: publicUrl },
  });

  revalidatePath("/dashboard");
  revalidatePath(`/trips/${tripId}`);
  revalidateTag(`trip-${tripId}`, "max");
  await logAuditEvent({
    action: "trip.cover.updated",
    actorUserId: user.id,
    tripId,
    summary: "Updated trip cover image",
  });
  return { coverImageUrl: publicUrl };
}

/**
 * Permanently delete a trip and every row that belongs to it. The Prisma
 * schema declares `onDelete: Cascade` from Trip to members, invites, stops,
 * stays, activities, expenses, shares, supplies, votes, options, responses,
 * and comments, so a single `trip.delete` cleans up all DB rows.
 *
 * Also removes every uploaded cover image under `trip-covers/{userId}/{tripId}/…`
 * for every member that may have uploaded one. Storage cleanup is best-effort:
 * if it fails the DB delete is still kept, and orphaned objects can be swept
 * later.
 */
export async function deleteTrip(tripId: string) {
  const user = await getAuthUser();
  await assertOwner(tripId, user.id);

  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    select: { id: true },
  });
  if (!trip) {
    throw new Error("Trip not found");
  }

  const uploaderIds = (
    await prisma.tripMember.findMany({
      where: { tripId },
      select: { userId: true },
    })
  ).map((m) => m.userId);

  await prisma.trip.delete({ where: { id: tripId } });

  await logAuditEvent({
    action: "trip.deleted",
    actorUserId: user.id,
    tripId,
    summary: "Deleted the trip",
  });

  await Promise.all(
    uploaderIds.map((memberUserId) =>
      publishTripMembershipEvent({
        type: "access-revoked",
        tripId,
        targetUserId: memberUserId,
        reason: "deleted",
      })
    )
  );

  try {
    const admin = getSupabaseAdminClient();
    const storage = admin ?? (await createClient());
    const pathsToRemove: string[] = [];
    const seen = new Set<string>();
    for (const uid of uploaderIds) {
      if (seen.has(uid)) continue;
      seen.add(uid);
      const folder = `${uid}/${tripId}`;
      const { data } = await storage.storage
        .from(TRIP_COVERS_BUCKET)
        .list(folder, { limit: 1000 });
      if (data) {
        for (const f of data) pathsToRemove.push(`${folder}/${f.name}`);
      }
    }
    if (pathsToRemove.length > 0) {
      await storage.storage.from(TRIP_COVERS_BUCKET).remove(pathsToRemove);
    }
  } catch (err) {
    // Best-effort: the trip DB row is already gone, don't fail the action.
    await reportServerError({
      source: "deleteTrip.coverCleanup",
      error: err,
      userId: user.id,
      tripId,
    });
  }

  revalidatePath("/dashboard");
  revalidatePath(`/trips/${tripId}`);
  revalidateTag(`trip-${tripId}`, "max");
}

export async function getTripWithMembers(tripId: string) {
  const user = await getAuthUser();

  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    include: {
      members: {
        where: { status: "ACTIVE" },
        include: { user: true },
      },
    },
  });

  if (!trip) throw new Error("Trip not found");

  await assertCanView(tripId, user.id);

  return {
    ...tripToClientJson(trip),
    members: trip.members.map((m) => ({
      id: m.id,
      tripId: m.tripId,
      userId: m.userId,
      role: m.role,
      status: m.status,
      joinedAt: m.joinedAt.toISOString(),
      updatedAt: m.updatedAt.toISOString(),
      user: {
        id: m.user.id,
        externalId: m.user.externalId,
        email: m.user.email,
        name: m.user.name,
        avatarUrl: m.user.avatarUrl,
        timezone: m.user.timezone,
        createdAt: m.user.createdAt.toISOString(),
        updatedAt: m.user.updatedAt.toISOString(),
        deletedAt: m.user.deletedAt ? m.user.deletedAt.toISOString() : null,
      },
    })),
  };
}
