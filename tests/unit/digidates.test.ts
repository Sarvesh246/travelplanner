import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  reportServerError: vi.fn(),
}));

vi.mock("@/lib/observability/errors", () => ({
  reportServerError: mocks.reportServerError,
}));

import { digidatesCalendarProvider } from "@/lib/calendar/digidates";

describe("digidatesCalendarProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("returns API-backed values and caches stable responses", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => true,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => 27,
      });
    vi.stubGlobal("fetch", fetchMock);

    await expect(digidatesCalendarProvider.validateDate("2026-07-05")).resolves.toBe(true);
    await expect(digidatesCalendarProvider.validateDate("2026-07-05")).resolves.toBe(true);
    await expect(digidatesCalendarProvider.weekNumber("2026-07-06")).resolves.toBe(27);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(mocks.reportServerError).not.toHaveBeenCalled();
  });

  it("falls back locally when DigiDates returns an invalid payload", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ nope: true }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(digidatesCalendarProvider.daysUntil("2026-07-05")).resolves.toBeTypeOf("number");
    expect(mocks.reportServerError).toHaveBeenCalledTimes(1);
  });

  it("falls back locally on request timeout", async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn((_url: string, init?: { signal?: AbortSignal }) => {
      return new Promise((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => {
          reject(new DOMException("Aborted", "AbortError"));
        });
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    const pending = digidatesCalendarProvider.daysUntil("2026-09-01");
    await vi.advanceTimersByTimeAsync(1_600);

    await expect(pending).resolves.toBeTypeOf("number");
    expect(mocks.reportServerError).toHaveBeenCalledTimes(1);
  });
});
