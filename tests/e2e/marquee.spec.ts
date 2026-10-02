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

  test("there is no pause control: nothing moves, so there is nothing to pause", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    for (const index of [0, 1]) {
      const strip = strips(page).nth(index);
      const button = strip.locator("button");
      // React rendered it, so this is not vacuous; CSS hides it.
      await expect(button).toHaveCount(1);
      await expect(button).toBeHidden();
      // Not in the accessibility tree.
      await expect(
        strip.getByRole("button", { name: /scrolling text/ }),
      ).toHaveCount(0);
      // Not focusable, so not in the tab order.
      expect(
        await button.evaluate((el) => {
          el.focus();
          return document.activeElement === el;
        }),
      ).toBe(false);
      expect(await playStates(page, index)).toEqual([[], []]);
    }
  });
});

test.describe("layout", () => {
  for (const width of [320, 390, 1280]) {
    test(`the track ends before the button starts, with space after it, at ${width}px`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 800 });
      await page.goto("/");
      await page.waitForLoadState("networkidle");
      for (const index of [0, 1]) {
        const strip = strips(page).nth(index);
        const track = await strip.locator(".marquee-track").boundingBox();
        const button = await strip.getByRole("button").boundingBox();
        const box = await strip.boundingBox();
        if (!track || !button || !box) throw new Error("missing box");
        expect(track.x + track.width).toBeLessThanOrEqual(button.x);
        expect(
          box.x + box.width - (button.x + button.width),
        ).toBeGreaterThanOrEqual(12);
      }
    });
  }
});

test.describe("with JavaScript off", () => {
  test.use({ javaScriptEnabled: false });

  test("the strips do not move, so there is nothing to pause", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(strips(page)).toHaveCount(2);
    await expect(page.locator("html")).not.toHaveAttribute("data-js", /.*/);
    for (const index of [0, 1]) {
      const strip = strips(page).nth(index);
      expect(await playStates(page, index)).toEqual([[], []]);
      await expect(strip.getByRole("button")).toHaveCount(0);
      // Only the real list shows; the duplicate used for the loop is hidden.
      await expect(strip.locator("ul").first()).toBeVisible();
      await expect(strip.locator("ul[aria-hidden='true']")).toBeHidden();
    }
  });
});

test("with JavaScript on, the page is marked so the strips can move", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-js", "1");
});
