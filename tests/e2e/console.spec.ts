import { randomInt } from "node:crypto";
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

for (const path of ["/"]) {
  test(`no console errors or warnings: ${path}`, async ({ page }) => {
    const problems = collectProblems(page);
    await page.goto(path);
    await page.waitForLoadState("networkidle");
    // Scroll through the page so lazy-loaded project images are requested too.
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 600) {
        window.scrollTo(0, y);
        await new Promise((resolve) => setTimeout(resolve, 60));
      }
    });
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

test("no console errors or warnings when the contact form is used", async ({
  page,
}) => {
  const problems = collectProblems(page);
  // Own client address, so the rate limit from other tests does not apply.
  await page.context().setExtraHTTPHeaders({
    "x-forwarded-for": `10.${randomInt(256)}.${randomInt(256)}.${randomInt(1, 255)}`,
  });
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  await page.getByRole("button", { name: "Send message" }).click();
  await expect(page.locator("#contact-name-error")).toBeVisible();

  await page.getByLabel("Your name").fill("Ada Lovelace");
  await page.getByLabel("Your email").fill("ada@example.com");
  await page.getByLabel("Message").fill("A console check message.");
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(page.locator('#contact [role="status"]')).not.toBeEmpty();

  expect(problems).toEqual([]);
});

// The cursor ring is added after hydration and driven by pointer events: moving, pressing,
// touch input and leaving the window must not log anything either.
test("no console errors or warnings while the mouse moves over the page", async ({
  page,
}) => {
  const problems = collectProblems(page);
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await expect(page.locator("[data-cursor-ring]")).toBeAttached();
  for (const [x, y] of [
    [200, 200],
    [640, 360],
    [1000, 120],
    [300, 600],
  ] as [number, number][]) {
    await page.mouse.move(x, y, { steps: 5 });
  }
  await page.mouse.down();
  await page.mouse.up();
  await page.evaluate(() => {
    document.dispatchEvent(
      new PointerEvent("pointermove", {
        pointerType: "touch",
        clientX: 50,
        clientY: 50,
        bubbles: true,
      }),
    );
    document.documentElement.dispatchEvent(
      new MouseEvent("mouseout", { relatedTarget: null, bubbles: true }),
    );
  });
  await page.mouse.move(500, 300);
  await page.waitForTimeout(300);
  expect(problems).toEqual([]);
});
