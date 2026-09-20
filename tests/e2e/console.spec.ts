import { expect, test, type Page } from "@playwright/test";

// Fails on any console error or warning, and on uncaught page errors. This includes
// Radix and hydration warnings. Runs against a production build and `next dev`.
function collectProblems(page: Page): string[] {
  const problems: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error" || message.type() === "warning") {
      problems.push(`console.${message.type()}: ${message.text()}`);
    }
  });
  page.on("pageerror", (error) => {
    problems.push(`pageerror: ${error.message}`);
  });
  return problems;
}

for (const path of ["/", "/dev/kit"]) {
  test(`no console errors or warnings: ${path}`, async ({ page }) => {
    const problems = collectProblems(page);
    await page.goto(path);
    await page.waitForLoadState("networkidle");
    expect(problems).toEqual([]);
  });

  test(`no console errors or warnings with the menu and theme toggle: ${path}`, async ({
    page,
  }) => {
    const problems = collectProblems(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(path);
    await page.waitForLoadState("networkidle");

    await page.getByRole("button", { name: "Open menu" }).click();
    const dialog = page.getByRole("dialog", { name: "Site menu" });
    await expect(dialog).toBeVisible();
    await dialog
      .getByRole("button", { name: "Toggle light and dark theme" })
      .click();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();

    expect(problems).toEqual([]);
  });
}
