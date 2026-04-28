const LOCAL_APP_URL = "http://localhost:3000";

function normalizeUrl(value: string | undefined): string | null {
  if (!value?.trim()) return null;

  const withProtocol = /^https?:\/\//i.test(value)
    ? value
    : `https://${value}`;

  try {
    return new URL(withProtocol).origin;
  } catch {
    return null;
  }
}

function isLocalOrigin(origin: string): boolean {
  const { hostname } = new URL(origin);
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}

function firstHeaderValue(header: string | null): string | null {
  if (!header?.trim()) return null;
  return header.split(",")[0]!.trim();
}

function isLoopbackHostname(hostname: string): boolean {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1" ||
    hostname === "[::1]"
  );
}

function hostnameFromHostHeader(hostHeader: string): string {
  try {
    return new URL(`http://${hostHeader}`).hostname;
  } catch {
    return hostHeader;
  }
}

export function getAppOrigin(): string {
  const configuredOrigin =
    normalizeUrl(process.env.NEXT_PUBLIC_APP_URL) ??
    normalizeUrl(process.env.APP_URL);
  const vercelOrigin =
    normalizeUrl(process.env.VERCEL_PROJECT_PRODUCTION_URL) ??
    normalizeUrl(process.env.VERCEL_URL);

  if (
    configuredOrigin &&
    (process.env.NODE_ENV === "development" ||
      !vercelOrigin ||
      !isLocalOrigin(configuredOrigin))
  ) {
    return configuredOrigin;
  }

  return (
    vercelOrigin ??
    configuredOrigin ??
    LOCAL_APP_URL
  );
}

export function getAppUrl(path = "/"): string {
  return new URL(path, getAppOrigin()).toString();
}

/**
 * Public origin for redirects from Route Handlers / middleware. Prefer proxy headers — on
 * Vercel (and similar) `request.url` may be an internal loopback URL even though the browser
 * hit https://your-deployment.vercel.app.
 */
export function getRequestOrigin(request: Request): string {
  const url = new URL(request.url);

  // Local dev: always use the URL the browser actually hit. Tools or leaked proxy headers
  // (e.g. x-forwarded-host pointing at production) must not override loopback — otherwise OAuth
  // redirects and session cookies target the wrong host and sign-in appears to "bounce" home.
  if (process.env.NODE_ENV === "development" && isLoopbackHostname(url.hostname)) {
    return url.origin;
  }

  const forwardedHost = firstHeaderValue(request.headers.get("x-forwarded-host"));
  const forwardedProto =
    firstHeaderValue(request.headers.get("x-forwarded-proto")) ?? "https";

  if (forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`;
  }

  const hostHeader = firstHeaderValue(request.headers.get("host"));

  // Trust the public Host header next — on Vercel, `x-forwarded-host` is sometimes absent in
  // Route Handlers while `host` still matches the deployment (e.g. *.vercel.app). `request.url`
  // may still point at an internal loopback or wrong host, which would otherwise produce
  // redirects to http://localhost:3000 after OAuth.
  if (hostHeader && !isLoopbackHostname(hostnameFromHostHeader(hostHeader))) {
    return `${forwardedProto}://${hostHeader}`;
  }

  if (
    process.env.VERCEL === "1" &&
    isLoopbackHostname(url.hostname) &&
    (!hostHeader || isLoopbackHostname(hostnameFromHostHeader(hostHeader)))
  ) {
    const fallback =
      normalizeUrl(process.env.VERCEL_PROJECT_PRODUCTION_URL) ??
      normalizeUrl(process.env.VERCEL_URL);
    if (fallback && !isLocalOrigin(fallback)) {
      return fallback;
    }
  }

  return url.origin;
}
