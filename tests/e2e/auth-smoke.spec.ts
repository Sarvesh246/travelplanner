import { expect, test } from "@playwright/test";

/**
 * Full user-journey smoke test: login -> create trip -> invite -> expense -> vote.
 *
 * This requires a working Supabase project with an existing confirmed user.
 * Set these env vars to enable:
 *   PLAYWRIGHT_TEST_EMAIL    - existing confirmed Supabase user
 *   PLAYWRIGHT_TEST_PASSWORD - that user's password
 *
 * Without them the suite is skipped so CI doesn't fail on unrelated runs.
 */
const TEST_EMAIL = process.env.PLAYWRIGHT_TEST_EMAIL;
const TEST_PASSWORD = process.env.PLAYWRIGHT_TEST_PASSWORD;

const SHOULD_RUN = Boolean(TEST_EMAIL && TEST_PASSWORD);

test.describe("auth smoke (set PLAYWRIGHT_TEST_EMAIL+PASSWORD)", () => {
  test.skip(!SHOULD_RUN, "Test credentials not provided");

  test("login -> create trip -> invite member -> add expense -> create vote", async ({ page }) => {
    test.setTimeout(120_000);

    // 1. Sign in
    await page.goto("/login");
    await page.locator('input[type="email"]').fill(TEST_EMAIL!);
    await page.locator('input[type="password"]').fill(TEST_PASSWORD!);
    await page.getByRole("button", { name: /sign in/i }).click();

    await Promise.race([
      page.waitForURL(/\/dashboard$/, { waitUntil: "commit", timeout: 30_000 }),
      page.getByText(/invalid login credentials|email not confirmed|user not found/i).waitFor({
        state: "visible",
        timeout: 30_000,
      }),
    ]);
    await expect(page).toHaveURL(/\/dashboard$/);

    // 2. Create a trip
    const tripName = `Playwright Trip ${Date.now()}`;
    await page.getByRole("link", { name: /new trip/i }).click();
    await page.waitForURL(/\/trips\/new$/);
    await page.locator('input[name="name"]').fill(tripName);
    await page.getByRole("button", { name: /create trip/i }).click();

    await page.waitForURL(/\/trips\/[^/]+\/(overview|itinerary)$/);
    await expect(page.getByText(tripName, { exact: false })).toBeVisible();

    // 3. Invite a member
    await page.getByRole("link", { name: /members/i }).click();
    await page.getByRole("button", { name: /invite/i }).click();
    await page.locator('input[type="email"]').fill(`invite-${Date.now()}@example.com`);
    await page.getByRole("button", { name: /send invite/i }).click();
    await expect(page.getByText(/share invite link/i)).toBeVisible();
    await expect(page.locator('input[value*="/invite/"]')).toBeVisible();
    await page.getByRole("button", { name: /done/i }).click();

    // 4. Add an expense
    await page.getByRole("link", { name: /expenses/i }).click();
    await page.getByRole("button", { name: /add expense|new expense/i }).click();
    await page.locator('input[name="title"]').fill("Test dinner");
    await page.locator('input[name="totalAmount"]').fill("60");
    await page.getByRole("button", { name: /save|create/i }).click();
    await expect(page.getByText("Test dinner")).toBeVisible();

    // 5. Create a vote
    await page.getByRole("link", { name: /votes/i }).click();
    await page.getByRole("button", { name: /create vote|new vote/i }).click();
    await page.locator('input[name="title"]').fill("Where should we eat?");
    await page.locator('input[name*="option"]').first().fill("Pizza");
    const secondOption = page.locator('input[name*="option"]').nth(1);
    if (await secondOption.isVisible()) await secondOption.fill("Sushi");
    await page.getByRole("button", { name: /save|create/i }).click();
    await expect(page.getByText("Where should we eat?")).toBeVisible();
  });
});
