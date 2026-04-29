import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

interface ErrorContext {
  source: string;
  message?: string;
  error: unknown;
  userId?: string | null;
  tripId?: string | null;
  context?: Prisma.InputJsonObject | null;
}

function serializeError(error: unknown) {
  if (error instanceof Error) {
    return {
      message: error.message,
      stack: error.stack?.slice(0, 8_000) ?? null,
      name: error.name,
    };
  }

  return {
    message: typeof error === "string" ? error : "Unknown error",
    stack: null,
    name: null,
  };
}

export async function reportServerError(input: ErrorContext) {
  const serialized = serializeError(input.error);
  const context: Prisma.InputJsonObject = {
    ...(input.context ?? {}),
    errorName: serialized.name,
  };
  const payload = {
    source: input.source,
    message: input.message ?? serialized.message,
    tripId: input.tripId ?? null,
    userId: input.userId ?? null,
    context,
  };

  console.error(`[${input.source}]`, {
    ...payload,
    stack: serialized.stack,
  });

  try {
    await prisma.appErrorLog.create({
      data: {
        source: input.source,
        message: payload.message,
        stack: serialized.stack,
        tripId: payload.tripId,
        userId: payload.userId,
        context: payload.context,
      },
    });
  } catch (persistError) {
    console.error("[observability] failed to persist app error log", {
      source: input.source,
      error: persistError instanceof Error ? persistError.message : String(persistError),
    });
  }
}
