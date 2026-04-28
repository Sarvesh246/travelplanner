import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getAppOrigin, getAppUrl, getRequestOrigin } from "@/lib/app-url";

/** `ProcessEnv.NODE_ENV` is readonly in typings; tests need to flip it. */
function mutableEnv(): Record<string, string | undefined> {
  return process.env as Record<string, string | undefined>;
}

const ENV_KEYS = [
  "NEXT_PUBLIC_APP_URL",
  "APP_URL",
  "VERCEL_PROJECT_PRODUCTION_URL",
  "VERCEL_URL",
  "VERCEL",
  "NODE_ENV",
] as const;

const snapshot: Record<string, string | undefined> = {};

beforeEach(() => {
  const e = mutableEnv();
  for (const key of ENV_KEYS) snapshot[key] = e[key];
  for (const key of ENV_KEYS) delete e[key];
});

afterEach(() => {
  const e = mutableEnv();
  for (const key of ENV_KEYS) {
    if (snapshot[key] === undefined) delete e[key];
    else e[key] = snapshot[key];
  }
});

describe("getAppOrigin", () => {
  it("falls back to localhost when nothing is set", () => {
    expect(getAppOrigin()).toBe("http://localhost:3000");
  });

  it("uses APP_URL when set", () => {
    mutableEnv().APP_URL = "https://beacon.example.com";
    expect(getAppOrigin()).toBe("https://beacon.example.com");
  });

  it("prefers NEXT_PUBLIC_APP_URL over APP_URL", () => {
    mutableEnv().NEXT_PUBLIC_APP_URL = "https://public.example.com";
    mutableEnv().APP_URL = "https://internal.example.com";
    expect(getAppOrigin()).toBe("https://public.example.com");
  });

  it("normalizes URLs missing a protocol", () => {
    mutableEnv().APP_URL = "beacon.example.com";
    expect(getAppOrigin()).toBe("https://beacon.example.com");
  });

  it("prefers Vercel URL in production over a local configured URL", () => {
    mutableEnv().NODE_ENV = "production";
    mutableEnv().APP_URL = "http://localhost:3000";
    mutableEnv().VERCEL_PROJECT_PRODUCTION_URL = "beacon.vercel.app";
    expect(getAppOrigin()).toBe("https://beacon.vercel.app");
  });

  it("keeps configured URL in development even when Vercel URL is set", () => {
    mutableEnv().NODE_ENV = "development";
    mutableEnv().APP_URL = "http://localhost:3000";
    mutableEnv().VERCEL_URL = "preview.vercel.app";
    expect(getAppOrigin()).toBe("http://localhost:3000");
  });
});

describe("getAppUrl", () => {
  it("appends a path to the origin", () => {
    mutableEnv().APP_URL = "https://beacon.example.com";
    expect(getAppUrl("/dashboard")).toBe("https://beacon.example.com/dashboard");
  });
});

describe("getRequestOrigin", () => {
  it("uses x-forwarded-host + x-forwarded-proto when present", () => {
    const request = new Request("http://localhost:3000/", {
      headers: {
        "x-forwarded-host": "beacon.example.com",
        "x-forwarded-proto": "https",
      },
    });
    expect(getRequestOrigin(request)).toBe("https://beacon.example.com");
  });

  it("defaults forwarded-proto to https when only forwarded-host is set", () => {
    const request = new Request("http://localhost:3000/", {
      headers: { "x-forwarded-host": "beacon.example.com" },
    });
    expect(getRequestOrigin(request)).toBe("https://beacon.example.com");
  });

  it("uses host header when request URL is loopback but host is public", () => {
    mutableEnv().NODE_ENV = "production";
    const request = new Request("http://localhost/", {
      headers: { host: "beacon.example.com" },
    });
    expect(getRequestOrigin(request)).toBe("https://beacon.example.com");
  });

  it("uses Host when it is the deployment hostname but request.url is loopback (no forwarded-host)", () => {
    mutableEnv().VERCEL = "1";
    const request = new Request("http://127.0.0.1:3000/auth/callback?code=x", {
      headers: { host: "beacon-prod.vercel.app" },
    });
    expect(getRequestOrigin(request)).toBe("https://beacon-prod.vercel.app");
  });

  it("falls back to request.url origin when nothing else helps", () => {
    const request = new Request("https://app.example.com/path");
    expect(getRequestOrigin(request)).toBe("https://app.example.com");
  });

  it("takes the first value of a comma-separated x-forwarded-host", () => {
    const request = new Request("http://localhost:3000/", {
      headers: { "x-forwarded-host": "first.example.com, internal.example.com" },
    });
    expect(getRequestOrigin(request)).toBe("https://first.example.com");
  });
});
