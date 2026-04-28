import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { prisma } from "@/lib/prisma";
import { NextResponse, type NextRequest } from "next/server";
import { getRequestOrigin } from "@/lib/app-url";

interface CookieToSet {
  name: string;
  value: string;
  options?: CookieOptions;
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function redirectTo(request: NextRequest, path: string) {
  const origin = getRequestOrigin(request);
  return NextResponse.redirect(new URL(path, origin));
}

/** Preserve Supabase session cookies when changing the redirect Location (e.g. after exchange). */
function redirectPreservingAuthCookies(from: NextResponse, destination: URL): NextResponse {
  const r = NextResponse.redirect(destination);
  const cookies = from.headers.getSetCookie?.() ?? [];
  for (const line of cookies) {
    r.headers.append("Set-Cookie", line);
  }
  return r;
}

function getSafeNext(searchParams: URLSearchParams): string {
  const next = searchParams.get("next") ?? "/dashboard";
  return next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
}

export async function GET(request: NextRequest) {
  const origin = getRequestOrigin(request);
  const code = request.nextUrl.searchParams.get("code");
  const nextPath = getSafeNext(request.nextUrl.searchParams);

  if (!code) {
    return redirectTo(request, "/login?error=auth-failed");
  }

  const destinationAfterAuth = new URL(nextPath, origin);
  let response = NextResponse.redirect(destinationAfterAuth);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }: CookieToSet) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.redirect(destinationAfterAuth);
          cookiesToSet.forEach(({ name, value, options }: CookieToSet) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  try {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error || !data.user) {
      return redirectTo(request, "/login?error=auth-failed");
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
        const sep = nextPath.includes("?") ? "&" : "?";
        const withSyncFlag = `${nextPath}${sep}sync=db-failed`;
        return redirectPreservingAuthCookies(response, new URL(withSyncFlag, origin));
      }
    } else if (process.env.NODE_ENV === "development") {
      console.warn(
        "[auth/callback] DATABASE_URL is not set; skipping app DB user sync. Sign-in still works."
      );
    }

    return response;
  } catch (e) {
    console.error("[auth/callback] Unexpected error:", e);
    return redirectTo(request, "/login?error=auth-failed");
  }
}
