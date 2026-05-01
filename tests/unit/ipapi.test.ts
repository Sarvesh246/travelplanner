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
