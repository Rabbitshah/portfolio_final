import { expect, test, type Page } from "@playwright/test";

// The now-playing chip (1320px and up): one fixed fact, shown in full, and bars that play for a
// few seconds and then rest, so nothing moves for more than 5 s (WCAG 2.2.2).

const FACT = "published: ieee icscds-2025";
const MAX_TOTAL_SECONDS = 4; // leaves a 1 s margin under the 5 s limit

const chip = (page: Page) =>
  page.locator('div[aria-hidden="true"]:has(.eq-bar)');
const bars = (page: Page) => chip(page).locator(".eq-bar");

const seconds = (value: string) =>
  value.endsWith("ms") ? parseFloat(value) / 1000 : parseFloat(value);

for (const width of [1320, 1440, 1920]) {
  test(`the fact is shown in full, and the chip stays inside the bar, at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.goto("/");
    await expect(chip(page)).toBeVisible();
    const fact = chip(page).locator("span.truncate");
    await expect(fact).toHaveText(FACT);
    expect(
      await fact.evaluate((el) => el.scrollWidth > el.clientWidth),
      "fact is clipped",
    ).toBe(false);

    const box = await chip(page).boundingBox();
    const nav = await page.locator('nav[aria-label="Primary"]').boundingBox();
    if (!box || !nav) throw new Error("missing box");
    expect(nav.x + nav.width).toBeLessThanOrEqual(box.x);
    expect(box.x + box.width).toBeLessThanOrEqual(width);
  });
}

test("the bars play a finite number of times, for at most 4 s in total", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 800 });
  await page.goto("/");
  const timings = await bars(page).evaluateAll((els) =>
    els.map((el) => {
      const style = getComputedStyle(el);
      return {
        delay: style.animationDelay,
        duration: style.animationDuration,
        count: style.animationIterationCount,
      };
    }),
  );
  expect(timings).toHaveLength(3);
  for (const { delay, duration, count } of timings) {
    expect(count, "iteration count must be finite").not.toBe("infinite");
    const total = seconds(delay) + seconds(duration) * Number(count);
    expect(
      total,
      `delay ${delay} + ${duration} x ${count}`,
    ).toBeLessThanOrEqual(MAX_TOTAL_SECONDS);
  }
});

// After 10 s the bars are at rest and the text has not changed. Checked with JavaScript on and
// off: the chip must behave the same either way.
for (const javaScriptEnabled of [true, false]) {
  test.describe(`with JavaScript ${javaScriptEnabled ? "on" : "off"}`, () => {
    test.use({ javaScriptEnabled });

    test("the bars move at first, then rest after 10 s, and the text never changes", async ({
      page,
    }) => {
      test.setTimeout(30_000);
      await page.setViewportSize({ width: 1440, height: 800 });
      await page.goto("/");
      const fact = chip(page).locator("span.truncate");
      await expect(fact).toHaveText(FACT);

      // Not vacuous: motion is allowed here, so the bars do start out running.
      const running = () =>
        bars(page).evaluateAll(
          (els) =>
            els
              .flatMap((el) => el.getAnimations())
              .filter((animation) => animation.playState === "running").length,
        );
      expect(await running()).toBeGreaterThan(0);

      await page.waitForTimeout(10_000);

      expect(await running(), "bars still animating after 10 s").toBe(0);
      const heights = await bars(page).evaluateAll((els) =>
        els.map((el) => el.getBoundingClientRect().height),
      );
      expect(heights).toEqual([3, 3, 3]);
      await expect(fact).toHaveText(FACT);
    });
  });
}
