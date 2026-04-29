import { expect, test } from "@playwright/test";

const PUBLIC_ROUTES = ["/", "/login", "/signup"];

test.describe("accessibility basics", () => {
  for (const route of PUBLIC_ROUTES) {
    test(`${route} has one visible h1 and keyboard-reachable primary actions`, async ({
      page,
    }) => {
      await page.goto(route, { waitUntil: "load", timeout: 30_000 });

      const h1 = page.getByRole("heading", { level: 1 });
      await expect(h1).toHaveCount(1);
      await expect(h1).toBeVisible();

      await page.keyboard.press("Tab");
      await expect(page.locator(":focus")).toBeVisible();
    });
  }
});
