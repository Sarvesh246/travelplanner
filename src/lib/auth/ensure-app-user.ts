import { Prisma } from "@prisma/client";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { prisma } from "@/lib/prisma";

/**
 * Ensure a row exists in Prisma `User` for this Supabase auth user.
 * Safe under concurrent dashboard/callback loads (handles unique collisions).
 */
export async function ensureAppUserForAuth(supabaseUser: SupabaseUser) {
  const externalId = supabaseUser.id;

  const cached = await prisma.user.findUnique({
    where: { externalId },
  });
  if (cached) return cached;

  /** Placeholder unique per Auth id — used only if Supabase has no email (rare OAuth/phone setups). */
  const fallbackEmail = `${externalId.replace(/-/g, "")}@oauth.beacon.internal`;
  const email = supabaseUser.email?.trim() || fallbackEmail;
  const name =
    supabaseUser.user_metadata?.name ||
    supabaseUser.email?.split("@")[0] ||
    "Traveler";

  try {
    return await prisma.user.create({
      data: {
        externalId,
        email,
        name,
        avatarUrl:
          typeof supabaseUser.user_metadata?.avatar_url === "string"
            ? supabaseUser.user_metadata.avatar_url
            : null,
      },
    });
  } catch (e: unknown) {
    if (!(e instanceof Prisma.PrismaClientKnownRequestError) || e.code !== "P2002") {
      throw e;
    }
    const afterRace = await prisma.user.findUnique({ where: { externalId } });
    if (afterRace) return afterRace;

    throw e;
  }
}
