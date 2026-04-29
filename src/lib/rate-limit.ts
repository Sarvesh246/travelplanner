import { prisma } from "@/lib/prisma";

export class RateLimitError extends Error {
  retryAfterSeconds: number;

  constructor(message: string, retryAfterSeconds: number) {
    super(message);
    this.name = "RateLimitError";
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

interface RateLimitInput {
  scope: string;
  identifier: string;
  key?: string | null;
  limit: number;
  windowMs: number;
  message: string;
}

export async function assertRateLimit(input: RateLimitInput) {
  const now = new Date();
  const windowStart = new Date(now.getTime() - input.windowMs);
  const retryAfterSeconds = Math.max(1, Math.ceil(input.windowMs / 1000));

  const count = await prisma.rateLimitEvent.count({
    where: {
      scope: input.scope,
      identifier: input.identifier,
      ...(input.key ? { key: input.key } : {}),
      createdAt: { gte: windowStart },
    },
  });

  if (count >= input.limit) {
    throw new RateLimitError(input.message, retryAfterSeconds);
  }

  await prisma.rateLimitEvent.create({
    data: {
      scope: input.scope,
      identifier: input.identifier,
      key: input.key ?? null,
    },
  });
}
