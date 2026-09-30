import { expect, test, type Page } from "@playwright/test";

// WCAG 2.2.2: every moving strip has a keyboard-operable pause control. The animation state is
// read from the browser (getAnimations), not from the attribute.

const strips = (page: Page) => page.locator(".marquee");

const playStates = (page: Page, index: number) =>
  strips(page)
    .nth(index)
    .locator("ul")
    .evaluateAll((lists) =>
      lists.map((list) => list.getAnimations().map((a) => a.playState)),
    );

test.describe("with motion allowed", () => {
  test("each strip pauses and resumes from the keyboard, and the animation really stops", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await expect(strips(page)).toHaveCount(2);

    for (const index of [0, 1]) {
      const button = strips(page).nth(index).getByRole("button");
      await expect(button).toHaveAttribute("aria-pressed", "false");
      expect(await playStates(page, index)).toEqual([["running"], ["running"]]);

      await button.focus();
      await page.keyboard.press("Enter");
      await expect(button).toHaveAttribute("aria-pressed", "true");
      await expect(button).toHaveAccessibleName("Resume scrolling text");
      expect(await playStates(page, index)).toEqual([["paused"], ["paused"]]);

      await page.keyboard.press("Space");
      await expect(button).toHaveAttribute("aria-pressed", "false");
      await expect(button).toHaveAccessibleName("Pause scrolling text");
      expect(await playStates(page, index)).toEqual([["running"], ["running"]]);
    }
  });

  test("pausing one strip leaves the other moving", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await strips(page).nth(0).getByRole("button").focus();
    await page.keyboard.press("Enter");
    expect(await playStates(page, 0)).toEqual([["paused"], ["paused"]]);
    expect(await playStates(page, 1)).toEqual([["running"], ["running"]]);
  });
});

test.describe("with reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("the control is still there and still toggles, over a strip that does not move", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    const button = strips(page).nth(0).getByRole("button");
    await expect(button).toBeVisible();
    await button.focus();
    await page.keyboard.press("Enter");
    await expect(button).toHaveAttribute("aria-pressed", "true");
    expect(await playStates(page, 0)).toEqual([[], []]);
  });
});
