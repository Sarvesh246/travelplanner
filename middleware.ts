import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

interface CookieToSet {
  name: string;
  value: string;
  options?: CookieOptions;
}

function isRecoverableAuthError(err: { message?: string; name?: string } | null) {
  if (!err?.message) return false;
  const message = err.message.toLowerCase();
  return (
    message.includes("refresh") ||
    message.includes("refresh token not found") ||
    message.includes("invalid jwt") ||
    (message.includes("jwt expired") && message.includes("session"))
  );
}

function clearSupabaseAuthCookies(
  request: NextRequest,
  response: NextResponse,
) {
  const authCookieNames = request.cookies
    .getAll()
    .map((cookie) => cookie.name)
    .filter(
      (name) => name.startsWith("sb-") && name.includes("-auth-token"),
    );

  for (const name of authCookieNames) {
    request.cookies.delete(name);
    response.cookies.delete(name);
  }
}

export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  if (pathname === "/api/health") {
    return NextResponse.next();
  }

  // Recover OAuth flows that land on the wrong route but still include the auth code.
  if (searchParams.has("code") && pathname !== "/auth/callback") {
    const callbackUrl = request.nextUrl.clone();
    callbackUrl.pathname = "/auth/callback";
    return NextResponse.redirect(callbackUrl);
  }

  let supabaseResponse = NextResponse.next({ request });

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
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }: CookieToSet) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  /** Stale or missing refresh token — treat as signed out; avoid redirect loops as logged-in */
  const userOrNull = authError ? null : user;
  if (isRecoverableAuthError(authError)) {
    clearSupabaseAuthCookies(request, supabaseResponse);
  }

  const protectedRoutes = ["/dashboard", "/trips"];
  const isProtected = protectedRoutes.some((r) => pathname.startsWith(r));
  const isAuthRoute = pathname.startsWith("/login") || pathname.startsWith("/signup");

  if (isProtected && !userOrNull) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (isAuthRoute && userOrNull) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    // Skip static assets so Edge middleware only runs for real app routes.
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\..*).*)",
  ],
};
