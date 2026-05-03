import { beforeEach, describe, expect, it, vi } from "vitest";
import { getApproxUserLocationFromIp, getClientIpFromHeaders } from "@/lib/location/ipapi";

describe("ipapi location utilities", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("extracts the first public client IP from forwarded headers", () => {
    const headers = new Headers({
      "x-forwarded-for": "203.0.113.42, 10.0.0.1",
    });

    expect(getClientIpFromHeaders(headers)).toBe("203.0.113.42");
  });

  it("uses Vercel geolocation headers before falling back to ipapi", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    const headers = new Headers({
      "x-vercel-ip-city": "Denver",
      "x-vercel-ip-country-region": "CO",
      "x-vercel-ip-latitude": "39.7392",
      "x-vercel-ip-longitude": "-104.9903",
    });

    await expect(getApproxUserLocationFromIp(headers)).resolves.toEqual({
      city: "Denver",
      region: "CO",
      lat: 39.7392,
      lon: -104.9903,
    });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("falls back to x-vercel-forwarded-for when extracting the client IP", () => {
    const headers = new Headers({
      "x-vercel-forwarded-for": "198.51.100.4",
    });

    expect(getClientIpFromHeaders(headers)).toBe("198.51.100.4");
  });

  it("returns an approximate location from ipapi", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          city: "Austin",
          region: "Texas",
          latitude: 30.2672,
          longitude: -97.7431,
        }),
      })
    );

    await expect(getApproxUserLocationFromIp("203.0.113.42")).resolves.toEqual({
      city: "Austin",
      region: "Texas",
      lat: 30.2672,
      lon: -97.7431,
    });
  });

  it("fails soft when location lookup is unavailable", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));

    await expect(getApproxUserLocationFromIp("203.0.113.42")).resolves.toBeNull();
  });
});
