import { expect, test, type Page } from "@playwright/test";

const TEST_EMAIL = process.env.PLAYWRIGHT_TEST_EMAIL;
const TEST_PASSWORD = process.env.PLAYWRIGHT_TEST_PASSWORD;
const HAS_PRIMARY = Boolean(TEST_EMAIL && TEST_PASSWORD);

async function signIn(page: Page) {
  await page.goto("/login", { waitUntil: "load", timeout: 30_000 });
  await page.locator('input[type="email"]').fill(TEST_EMAIL!);
  await page.locator('input[type="password"]').fill(TEST_PASSWORD!);
  await page.getByRole("button", { name: /sign in/i }).click();
  await expect(page).toHaveURL(/\/dashboard$/, { timeout: 30_000 });
}

async function createTrip(page: Page) {
  await page.getByRole("link", { name: /new trip/i }).click();
  await expect(page).toHaveURL(/\/trips\/new$/);
  await page.locator('input[name="name"]').fill(`Layout Trip ${Date.now()}`);
  await page.getByRole("button", { name: /create trip/i }).click();
  await expect(page).toHaveURL(/\/trips\/[^/]+\/(overview|itinerary)$/);
}

async function horizontalOverflow(page: Page) {
  return page.evaluate(() => {
    const el = document.documentElement;
    return Math.max(0, el.scrollWidth - el.clientWidth);
  });
}

test.describe("authenticated trip layouts", () => {
  test.skip(!HAS_PRIMARY, "Primary Playwright credentials not configured");

  test("core trip pages stay within the viewport on mobile width", async ({ page }) => {
    await page.setViewportSize({ width: 393, height: 852 });
    await signIn(page);
    await createTrip(page);

    const routes = [
      { name: /overview/i, expected: /trip summary/i },
      { name: /members/i, expected: /crew access/i },
      { name: /expenses/i, expected: /expenses/i },
      { name: /votes/i, expected: /votes/i },
      { name: /supplies/i, expected: /supplies/i },
    ];

    for (const route of routes) {
      await page.getByRole("link", { name: route.name }).click();
      await expect(page.getByText(route.expected)).toBeVisible({ timeout: 30_000 });
      expect(await horizontalOverflow(page)).toBeLessThanOrEqual(1);
    }
  });
});
