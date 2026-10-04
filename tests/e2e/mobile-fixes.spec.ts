import { expect, test } from "@playwright/test";

// Toolbox collapse and eyebrow wrapping on narrow screens.

const toolbox = (page: import("@playwright/test").Page) =>
  page.locator("article", { hasText: "Toolbox" }).first();

test.describe("Toolbox below 700px", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("shows three groups, and the rest open from 'Show all skills'", async ({
    page,
  }) => {
    await page.goto("/");
    const card = toolbox(page);
    await expect(card.locator("h3", { hasText: "Frontend" })).toBeVisible();
    const hidden = card.locator("h3", { hasText: "Game development" });
    await expect(hidden).toHaveCount(2); // one in the wide grid, one in the toggle
    await expect(hidden.first()).toBeHidden();
    await expect(hidden.last()).toBeHidden();

    await card.getByText("Show all skills").click();
    await expect(hidden.last()).toBeVisible();
    await expect(hidden.first()).toBeHidden();
  });

  test.describe("with JavaScript off", () => {
    test.use({ javaScriptEnabled: false });

    test("the toggle still works", async ({ page }) => {
      await page.goto("/");
      const card = toolbox(page);
      const hidden = card.locator("h3", { hasText: "Game development" });
      await expect(hidden.last()).toBeHidden();
      await card.getByText("Show all skills").click();
      await expect(hidden.last()).toBeVisible();
    });
  });
});

test.describe("Toolbox at 700px and up", () => {
  test.use({ viewport: { width: 1024, height: 800 } });

  test("shows every group with no toggle", async ({ page }) => {
    await page.goto("/");
    const card = toolbox(page);
    await expect(
      card.locator("h3", { hasText: "Game development" }).first(),
    ).toBeVisible();
    await expect(card.getByText("Show all skills")).toBeHidden();
  });
});

for (const width of [320, 360, 390, 430]) {
  test(`hero eyebrow wraps between phrases, never inside one, at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.goto("/");
    const phrases = page
      .locator("#hero-title")
      .locator("xpath=preceding-sibling::p[1]")
      .locator("span.whitespace-nowrap");
    const count = await phrases.count();
    expect(count).toBeGreaterThan(1);
    for (let i = 0; i < count; i++) {
      const box = await phrases.nth(i).boundingBox();
      expect(box?.height).toBeLessThan(24); // one line of .78rem text
      expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(width);
    }
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width);
  });
}
