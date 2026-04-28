import { describe, expect, it } from "vitest";
import { isTripItinerarySection } from "@/lib/nav/trip-sections";

describe("isTripItinerarySection", () => {
  it("matches the itinerary index page exactly", () => {
    expect(isTripItinerarySection("/trips/abc/itinerary", "abc")).toBe(true);
  });

  it("matches a stop detail subpage", () => {
    expect(isTripItinerarySection("/trips/abc/stops/xyz", "abc")).toBe(true);
  });

  it("does not match a different trip's itinerary", () => {
    expect(isTripItinerarySection("/trips/other/itinerary", "abc")).toBe(false);
  });

  it("does not match a sibling section", () => {
    expect(isTripItinerarySection("/trips/abc/expenses", "abc")).toBe(false);
  });

  it("does not match the trip root", () => {
    expect(isTripItinerarySection("/trips/abc", "abc")).toBe(false);
  });
});
