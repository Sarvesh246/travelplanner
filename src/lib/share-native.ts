"use client";

export async function shareTripUrl(title: string, text: string, url: string) {
  const nav = typeof navigator !== "undefined" ? navigator : undefined;
  if (nav?.share) {
    try {
      await nav.share({ title, text, url });
      return true;
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") return false;
    }
  }
  return false;
}
