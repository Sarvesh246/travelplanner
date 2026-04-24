import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

function redirectToApp(request: Request, path: string) {
  const { origin } = new URL(request.url);
  const forwardedHost = request.headers.get("x-forwarded-host");
  const isLocalEnv = process.env.NODE_ENV === "development";

  if (isLocalEnv) {
    return NextResponse.redirect(`${origin}${path}`);
  }
  if (forwardedHost) {
    return NextResponse.redirect(`https://${forwardedHost}${path}`);
  }
  return NextResponse.redirect(`${origin}${path}`);
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=auth-failed`);
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error || !data.user) {
      return NextResponse.redirect(`${origin}/login?error=auth-failed`);
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
    return NextResponse.redirect(`${origin}/login?error=auth-failed`);
  }
}
