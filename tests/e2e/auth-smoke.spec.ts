import { expect, test, type Browser, type Page } from "@playwright/test";

const TEST_EMAIL = process.env.PLAYWRIGHT_TEST_EMAIL;
const TEST_PASSWORD = process.env.PLAYWRIGHT_TEST_PASSWORD;
const SECONDARY_EMAIL = process.env.PLAYWRIGHT_TEST_SECONDARY_EMAIL;
const SECONDARY_PASSWORD = process.env.PLAYWRIGHT_TEST_SECONDARY_PASSWORD;

const HAS_PRIMARY = Boolean(TEST_EMAIL && TEST_PASSWORD);
const HAS_SECONDARY = Boolean(SECONDARY_EMAIL && SECONDARY_PASSWORD);

async function signIn(page: Page, email: string, password: string) {
  await page.goto("/login", { waitUntil: "load" });
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.getByRole("button", { name: /sign in/i }).click();
  await expect(page).toHaveURL(/\/dashboard$/, { timeout: 30_000 });
}

async function createTrip(page: Page) {
  const tripName = `Playwright Trip ${Date.now()}`;
  await page.getByRole("link", { name: /new trip/i }).click();
  await expect(page).toHaveURL(/\/trips\/new$/);
  await page.locator('input[name="name"]').fill(tripName);
  await page.getByRole("button", { name: /create trip/i }).click();
  await expect(page).toHaveURL(/\/trips\/[^/]+\/(overview|itinerary)$/);
  await expect(page.getByText(tripName, { exact: false })).toBeVisible();
  return tripName;
}

async function createPendingInvite(page: Page) {
  const inviteEmail = HAS_SECONDARY ? SECONDARY_EMAIL! : `invite-${Date.now()}@example.com`;
  await page.getByRole("link", { name: /members/i }).click();
  await page.getByRole("button", { name: /invite/i }).click();
  await page.locator('input[type="email"]').fill(inviteEmail);
  await page.getByRole("button", { name: /send invite/i }).click();
  await expect(page.getByText(/share invite link/i)).toBeVisible();
  const inviteLink = await page.locator('input[value*="/invite/"]').inputValue();
  await page.getByRole("button", { name: /done/i }).click();
  return { inviteLink, inviteEmail };
}

async function addExpense(page: Page) {
  await page.getByRole("link", { name: /expenses/i }).click();
  await page.getByRole("button", { name: /add expense|new expense/i }).click();
  await page.locator('input[name="title"]').fill("Trail dinner");
  await page.locator('input[name="totalAmount"]').fill("60");
  await page.getByRole("button", { name: /save|create/i }).click();
  await expect(page.getByText("Trail dinner")).toBeVisible();
}

async function createVote(page: Page) {
  await page.getByRole("link", { name: /votes/i }).click();
  await page.getByRole("button", { name: /create vote|new vote/i }).click();
  await page.locator('input[name="title"]').fill("Where should we eat?");
  await page.locator('input[name*="option"]').first().fill("Pizza");
  const secondOption = page.locator('input[name*="option"]').nth(1);
  if (await secondOption.isVisible()) {
    await secondOption.fill("Sushi");
  }
  await page.getByRole("button", { name: /save|create/i }).click();
  await expect(page.getByText("Where should we eat?")).toBeVisible();
}

async function setManualEstimate(page: Page) {
  await page.getByRole("link", { name: /overview/i }).click();
  const estimateField = page.getByLabel(/estimated trip cost/i);
  await estimateField.fill("250");
  await estimateField.blur();
  await expect(estimateField).toHaveValue("250");
  await page.reload({ waitUntil: "load" });
  await expect(page.getByLabel(/estimated trip cost/i)).toHaveValue("250");
}

async function acceptInviteAsSecondary(browser: Browser, inviteLink: string) {
  const context = await browser.newContext();
  const page = await context.newPage();
  await signIn(page, SECONDARY_EMAIL!, SECONDARY_PASSWORD!);
  await page.goto(inviteLink, { waitUntil: "load" });
  await page.getByRole("button", { name: /accept invite/i }).click();
  await expect(page).toHaveURL(/\/trips\/[^/]+\/overview$/, { timeout: 30_000 });
  return { context, page };
}

async function removeSecondaryMember(page: Page, secondaryEmail: string) {
  await page.getByRole("link", { name: /members/i }).click();
  const memberCard = page.locator("div").filter({ hasText: secondaryEmail }).first();
  await memberCard.getByRole("button", { name: /member actions/i }).click();
  await page.getByRole("menuitem", { name: /remove/i }).click();
  await page.getByRole("button", { name: /^remove$/i }).click();
  await expect(page.getByText(new RegExp(`${secondaryEmail}`, "i"))).not.toBeVisible({
    timeout: 30_000,
  });
}

test.describe("authenticated trip coverage", () => {
  test.skip(!HAS_PRIMARY, "Primary Playwright credentials not configured");

  test("primary user can create a trip, add planning data, and set a manual estimate", async ({
    page,
  }) => {
    test.setTimeout(120_000);

    await signIn(page, TEST_EMAIL!, TEST_PASSWORD!);
    await createTrip(page);
    await createPendingInvite(page);
    await addExpense(page);
    await createVote(page);
    await setManualEstimate(page);
  });

  test("secondary member can accept an invite and loses access immediately after removal", async ({
    page,
    browser,
  }) => {
    test.skip(!HAS_SECONDARY, "Secondary Playwright credentials not configured");
    test.setTimeout(180_000);

    await signIn(page, TEST_EMAIL!, TEST_PASSWORD!);
    await createTrip(page);
    const { inviteLink } = await createPendingInvite(page);

    const secondary = await acceptInviteAsSecondary(browser, inviteLink);
    await expect(page.getByText(SECONDARY_EMAIL!, { exact: false })).toBeVisible({
      timeout: 30_000,
    });

    await removeSecondaryMember(page, SECONDARY_EMAIL!);

    await expect(secondary.page).toHaveURL(/\/dashboard\?access=revoked$/, {
      timeout: 30_000,
    });
    await secondary.context.close();
  });
});
