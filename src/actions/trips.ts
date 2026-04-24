"use server";

import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

async function getAuthUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const dbUser = await prisma.user.findUnique({ where: { externalId: user.id } });
  if (!dbUser) throw new Error("User not found");
  return dbUser;
}

const createTripSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  currency: z.string().default("USD"),
  budgetTarget: z.number().optional(),
});

export async function createTrip(input: z.infer<typeof createTripSchema>) {
  const user = await getAuthUser();
  const data = createTripSchema.parse(input);

  const trip = await prisma.trip.create({
    data: {
      name: data.name,
      description: data.description,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      endDate: data.endDate ? new Date(data.endDate) : undefined,
      currency: data.currency,
      budgetTarget: data.budgetTarget,
      members: {
        create: { userId: user.id, role: "OWNER" },
      },
    },
  });

  revalidatePath("/dashboard");
  return { trip };
}

export async function updateTrip(
  tripId: string,
  input: Partial<z.infer<typeof createTripSchema>> & { status?: string; coverImageUrl?: string }
) {
  const user = await getAuthUser();

  const member = await prisma.tripMember.findUnique({
    where: { tripId_userId: { tripId, userId: user.id } },
  });
  if (!member || !["OWNER", "ADMIN"].includes(member.role)) {
    throw new Error("Insufficient permissions");
  }

  const trip = await prisma.trip.update({
    where: { id: tripId },
    data: {
      ...(input.name && { name: input.name }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.startDate && { startDate: new Date(input.startDate) }),
      ...(input.endDate && { endDate: new Date(input.endDate) }),
      ...(input.currency && { currency: input.currency }),
      ...(input.budgetTarget !== undefined && { budgetTarget: input.budgetTarget }),
      ...(input.status && { status: input.status as never }),
      ...(input.coverImageUrl !== undefined && { coverImageUrl: input.coverImageUrl }),
    },
  });

  revalidatePath(`/trips/${tripId}`);
  return { trip };
}

export async function deleteTrip(tripId: string) {
  const user = await getAuthUser();

  const member = await prisma.tripMember.findUnique({
    where: { tripId_userId: { tripId, userId: user.id } },
  });
  if (!member || member.role !== "OWNER") throw new Error("Only owners can delete trips");

  await prisma.trip.update({
    where: { id: tripId },
    data: { deletedAt: new Date() },
  });

  revalidatePath("/dashboard");
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

  const isMember = trip.members.some((m) => m.userId === user.id);
  if (!isMember) throw new Error("Not a member of this trip");

  return trip;
}
