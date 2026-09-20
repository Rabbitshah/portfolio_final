import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

// PLAN §11 viewport matrix.
const viewports = [
  [320, 640],
  [360, 740],
  [390, 844],
  [430, 932],
  [600, 900],
  [768, 1024],
  [844, 390],
  [1024, 768],
  [1180, 820],
  [1280, 720],
  [1440, 900],
  [1920, 1080],
  [2560, 1440],
] as const;

for (const path of ["/", "/dev/kit"]) {
  for (const [width, height] of viewports) {
    test(`no horizontal scroll: ${path} at ${width}x${height}`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height });
      await page.goto(path);
      const { scrollWidth, innerWidth } = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        innerWidth: window.innerWidth,
      }));
      expect(scrollWidth).toBeLessThanOrEqual(innerWidth);
    });
  }
}

// Phase 1a covers /dev/kit only. Serious and critical violations fail the test.
for (const colorScheme of ["light", "dark"] as const) {
  for (const width of [390, 1440]) {
    test(`axe: /dev/kit, ${colorScheme}, ${width}px`, async ({ page }) => {
      await page.emulateMedia({ colorScheme });
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/dev/kit");
      const { violations } = await new AxeBuilder({ page }).analyze();
      const blocking = violations.filter(
        (v) => v.impact === "serious" || v.impact === "critical",
      );
      expect(
        blocking,
        blocking
          .map(
            (v) =>
              `${v.id} (${v.impact}): ${v.help}\n${v.nodes.map((n) => n.target.join(" ")).join("\n")}`,
          )
          .join("\n\n"),
      ).toEqual([]);
    });
  }
}

test.describe("mobile menu at 390px", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("opens, changes the theme, and closes with Escape", async ({ page }) => {
    await page.goto("/dev/kit");
    await page.getByRole("button", { name: "Open menu" }).click();
    const dialog = page.getByRole("dialog", { name: "Site menu" });
    await expect(dialog).toBeVisible();

    await dialog
      .getByRole("button", { name: "Toggle light and dark theme" })
      .click();
    await expect(page.locator("html")).toHaveAttribute(
      "data-theme",
      /light|dark/,
    );

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
  });

  test("moves focus into the dialog, locks page scroll, and returns focus on Escape", async ({
    page,
  }) => {
    await page.goto("/dev/kit");
    const trigger = page.getByRole("button", { name: "Open menu" });
    await trigger.click();
    const dialog = page.getByRole("dialog", { name: "Site menu" });
    await expect(dialog).toBeVisible();

    // Focus is inside the dialog, on the first link.
    await expect(dialog.getByRole("link", { name: /About/ })).toBeFocused();
    expect(
      await page.evaluate(() =>
        document
          .querySelector('[role="dialog"]')
          ?.contains(document.activeElement),
      ),
    ).toBe(true);

    // The page cannot scroll behind the open menu. The body is locked (this is what stops
    // keyboard and touch scrolling), and a wheel over the sheet does not move the page.
    const bodyOverflowY = () =>
      page.evaluate(() => getComputedStyle(document.body).overflowY);
    expect(await bodyOverflowY()).toBe("hidden");
    await page.mouse.move(195, 400);
    await page.mouse.wheel(0, 600);
    await page.waitForTimeout(300);
    expect(await page.evaluate(() => window.scrollY)).toBe(0);

    // Escape closes it and focus goes back to the menu button.
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
    expect(await bodyOverflowY()).not.toBe("hidden");

    // Scrolling works again, so the check above is not passing by accident.
    await page.mouse.wheel(0, 600);
    await expect
      .poll(() => page.evaluate(() => window.scrollY))
      .toBeGreaterThan(0);
  });
});
