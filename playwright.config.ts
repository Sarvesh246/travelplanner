import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig, devices } from "@playwright/test";

/** Load `.env.local` so `npx playwright test` sees PLAYWRIGHT_* without `--env-file` (Codex/CI). */
function loadEnvLocal(): void {
  // Project root (run Playwright from repo root). Avoid `import.meta` — Playwright’s TS loader
  // can compile this file in a way that breaks ESM-only APIs.
  const path = resolve(process.cwd(), ".env.local");
  if (!existsSync(path)) return;
  let text = readFileSync(path, "utf8");
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    if (!key) continue;
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

loadEnvLocal();

const PORT = Number(process.env.PORT ?? 3000);
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${PORT}`;

/**
 * Playwright covers two layers:
 *
 * 1. **Public responsive** — landing/login/signup at every breakpoint in the QA
 *    matrix. Runs against `npm run dev` with no credentials needed.
 * 2. **Auth smoke** (`tests/e2e/auth-smoke.spec.ts`) — full user journey through
 *    create-trip → invite → expense → vote. Skipped unless
 *    `PLAYWRIGHT_TEST_EMAIL` / `PLAYWRIGHT_TEST_PASSWORD` are set against a
 *    Supabase project with that user already created and confirmed.
 */
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // The auto-started Next dev server compiles routes on demand and serializes
  // first-compile under load. One worker avoids spurious timeouts. When
  // pointing at an external pre-built server (PLAYWRIGHT_BASE_URL), ramp up.
  workers: process.env.PLAYWRIGHT_BASE_URL ? undefined : 1,
  timeout: 60_000,
  reporter: process.env.CI ? "github" : [["list"]],
  outputDir: "test-results",

  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },

  projects: [
    { name: "chromium-desktop", use: { ...devices["Desktop Chrome"] } },
  ],

  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: "npm run dev",
        url: BASE_URL,
        reuseExistingServer: !process.env.CI,
        stdout: "ignore",
        stderr: "pipe",
        timeout: 180_000,
      },
});
