import { expect, test } from "@playwright/test";

test("home page loads with one h1", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("h1")).toHaveCount(1);
});
