import { describe, expect, it } from "vitest";
import { formatFromHeader, parseEmailAddress } from "@/lib/email/client";

describe("email sender parsing", () => {
  it("accepts a bare sender address", () => {
    expect(formatFromHeader(parseEmailAddress("onboarding@resend.dev"))).toBe(
      "onboarding@resend.dev"
    );
  });

  it("accepts a display name sender", () => {
    expect(formatFromHeader(parseEmailAddress("Beacon <onboarding@resend.dev>"))).toBe(
      "Beacon <onboarding@resend.dev>"
    );
  });

  it("strips wrapping quotes pasted into env vars", () => {
    expect(formatFromHeader(parseEmailAddress('"Beacon <onboarding@resend.dev>"'))).toBe(
      "Beacon <onboarding@resend.dev>"
    );
  });

  it("rejects malformed sender values before calling Resend", () => {
    expect(() => parseEmailAddress("Beacon onboarding@resend.dev")).toThrow(
      /EMAIL_FROM must be an email address/
    );
  });

  it("rejects malformed address parts in display name values", () => {
    expect(() => parseEmailAddress("Beacon <onboarding>")).toThrow(
      /EMAIL_FROM must be an email address/
    );
  });
});
