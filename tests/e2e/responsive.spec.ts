import { expect, test, type Page } from "@playwright/test";

const BREAKPOINTS = [
  { name: "iphone-se", width: 320, height: 568 },
  { name: "iphone-15", width: 393, height: 852 },
  { name: "ipad-portrait", width: 768, height: 1024 },
  { name: "ipad-landscape", width: 1024, height: 768 },
  { name: "laptop-13", width: 1280, height: 800 },
  { name: "desktop-1440", width: 1440, height: 900 },
  { name: "desktop-1920", width: 1920, height: 1080 },
  { name: "desktop-2560", width: 2560, height: 1440 },
] as const;

const PUBLIC_ROUTES = [
  { path: "/", name: "landing" },
  { path: "/login", name: "login" },
  { path: "/signup", name: "signup" },
] as const;

/**
 * Returns the horizontal overflow in pixels — `documentElement.scrollWidth`
 * exceeding `clientWidth`. Anything > 1px is a layout bug.
 */
async function horizontalOverflow(page: Page): Promise<number> {
  return page.evaluate(() => {
    const el = document.documentElement;
    return Math.max(0, el.scrollWidth - el.clientWidth);
  });
}

for (const route of PUBLIC_ROUTES) {
  test.describe(`${route.name} responsive matrix`, () => {
    for (const bp of BREAKPOINTS) {
      test(`${bp.name} (${bp.width}×${bp.height}) has no horizontal overflow`, async ({
        page,
      }) => {
        await page.setViewportSize({ width: bp.width, height: bp.height });
        // Use `load`, not `networkidle` — the landing route keeps fonts/WebGL/
        // animation-related requests alive so networkidle may never settle.
        await page.goto(route.path, { waitUntil: "load", timeout: 30_000 });
        await page.waitForTimeout(250);

        const overflow = await horizontalOverflow(page);
        expect(
          overflow,
          `Horizontal overflow ${overflow}px at ${bp.width}×${bp.height} on ${route.path}`,
        ).toBeLessThanOrEqual(1);
      });
    }
  });
}

test.describe("landing — critical above-the-fold elements visible", () => {
  for (const bp of BREAKPOINTS) {
    test(`${bp.name}: hero heading and primary CTA visible`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: bp.width, height: bp.height });
      await page.goto("/", { waitUntil: "load", timeout: 30_000 });

      // Hero heading text — present in hero copy.
      const heading = page.getByRole("heading", { level: 1 });
      await expect(heading).toBeVisible();

      // At least one of the primary signup CTAs should be visible above the
      // fold (header signup link or hero "Start planning free" link).
      const signupLinks = page.locator('a[href="/signup"]');
      await expect(signupLinks.first()).toBeVisible();
    });
  }
});

test.describe("login — form fits and is usable at every breakpoint", () => {
  for (const bp of BREAKPOINTS) {
    test(`${bp.name}: email and password fields are interactable`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: bp.width, height: bp.height });
      await page.goto("/login", { waitUntil: "load", timeout: 30_000 });

      const email = page.locator('input[type="email"]');
      const password = page.locator('input[type="password"]');
      await expect(email).toBeVisible();
      await expect(password).toBeVisible();

      // The submit button should not be clipped off-screen
      const submit = page.getByRole("button", { name: /sign in/i });
      await expect(submit).toBeVisible();
      const box = await submit.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.x).toBeGreaterThanOrEqual(0);
      expect(box!.x + box!.width).toBeLessThanOrEqual(bp.width);
    });
  }
});
