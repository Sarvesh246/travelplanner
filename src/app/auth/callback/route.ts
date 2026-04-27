import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getRequestOrigin } from "@/lib/app-url";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function redirectToApp(request: Request, path: string) {
  return NextResponse.redirect(new URL(path, getRequestOrigin(request)));
}

function getSafeNext(searchParams: URLSearchParams): string {
  const next = searchParams.get("next") ?? "/dashboard";
  return next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = getSafeNext(searchParams);

  if (!code) {
    return redirectToApp(request, "/login?error=auth-failed");
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error || !data.user) {
      return redirectToApp(request, "/login?error=auth-failed");
    }

    const dbUrl = process.env.DATABASE_URL?.trim();
    if (dbUrl) {
      try {
        await prisma.user.upsert({
          where: { externalId: data.user.id },
          update: {
            email: data.user.email!,
            name:
              data.user.user_metadata?.name ||
              data.user.email?.split("@")[0] ||
              "Traveler",
            avatarUrl: data.user.user_metadata?.avatar_url ?? null,
          },
          create: {
            externalId: data.user.id,
            email: data.user.email!,
            name:
              data.user.user_metadata?.name ||
              data.user.email?.split("@")[0] ||
              "Traveler",
            avatarUrl: data.user.user_metadata?.avatar_url ?? null,
          },
        });
      } catch (e) {
        console.error("[auth/callback] Prisma user upsert failed:", e);
        const sep = next.includes("?") ? "&" : "?";
        return redirectToApp(request, `${next}${sep}sync=db-failed`);
      }
    } else if (process.env.NODE_ENV === "development") {
      console.warn(
        "[auth/callback] DATABASE_URL is not set; skipping app DB user sync. Sign-in still works."
      );
    }

    return redirectToApp(request, next);
  } catch (e) {
    console.error("[auth/callback] Unexpected error:", e);
    return redirectToApp(request, "/login?error=auth-failed");
  }
}
