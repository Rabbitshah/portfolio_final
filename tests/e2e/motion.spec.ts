import { expect, test, type Page } from "@playwright/test";

// Reveal and CountUp (Phase 3, item 1). Content must never depend on the animation: it is
// visible with JavaScript off, with reduced motion, and on screen at load.

async function scrollThrough(page: Page) {
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 500) {
      window.scrollTo(0, y);
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  });
}

const revealOpacities = (page: Page) =>
  page.$$eval("[data-reveal]", (blocks) =>
    blocks.map((block) => Number(getComputedStyle(block).opacity)),
  );

// The visible digits and the screen-reader copy of each "By the numbers" stat.
const stats = (page: Page) =>
  page
    .locator("article", { hasText: "By the numbers" })
    .locator("b")
    .evaluateAll((values) =>
      values.map((value) => ({
        shown: value.querySelector('[aria-hidden="true"]')?.textContent,
        final: value.querySelector(".sr-only")?.textContent,
      })),
    );

// Lowest opacity seen on the on-screen [data-reveal] blocks, sampled every frame for a while.
const lowestOnScreenOpacity = (page: Page, ms: number) =>
  page.evaluate(async (duration) => {
    let lowest = 1;
    const end = performance.now() + duration;
    while (performance.now() < end) {
      for (const block of document.querySelectorAll("[data-reveal]")) {
        const box = block.getBoundingClientRect();
        if (box.bottom > 0 && box.top < window.innerHeight) {
          lowest = Math.min(lowest, Number(getComputedStyle(block).opacity));
        }
      }
      await new Promise(requestAnimationFrame);
    }
    return lowest;
  }, ms);

test("the server HTML never hides a Reveal block", async ({ request }) => {
  const html = await (await request.get("/")).text();
  const blocks = html.match(/<div[^>]*data-reveal[^>]*>/g) ?? [];
  expect(blocks.length).toBeGreaterThan(0);
  for (const block of blocks) expect(block).not.toMatch(/opacity:\s*0[;"]/);
});

test.describe("with reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("every Reveal block is visible and the stats show their final values", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    expect(await revealOpacities(page)).not.toContain(0);
    await scrollThrough(page);
    const opacities = await revealOpacities(page);
    expect(opacities.every((opacity) => opacity === 1)).toBe(true);
    const numbers = await stats(page);
    expect(numbers).toHaveLength(3);
    for (const { shown, final } of numbers) expect(shown).toBe(final);
  });
});

test.describe("with JavaScript off", () => {
  test.use({ javaScriptEnabled: false });

  test("every Reveal block is visible and the stats show their final values", async ({
    page,
  }) => {
    await page.goto("/");
    const opacities = await revealOpacities(page);
    expect(opacities.length).toBeGreaterThan(0);
    expect(opacities.every((opacity) => opacity === 1)).toBe(true);
    const numbers = await stats(page);
    expect(numbers).toHaveLength(3);
    for (const { shown, final } of numbers) expect(shown).toBe(final);
  });
});

test.describe("with motion allowed", () => {
  test("opening a #section link scrolls there and leaves its content fully visible", async ({
    page,
  }) => {
    // The browser smooth-scrolls from the top, so the target fades in as it arrives.
    await page.goto("/#work");
    await expect
      .poll(() => lowestOnScreenOpacity(page, 200), { timeout: 5000 })
      .toBe(1);
  });

  test("a block below the screen is revealed when scrolled to, and the stats count up to their final values", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    const head = page.locator("#about [data-reveal]");
    // Below the screen after load: hidden, ready to be revealed.
    await expect
      .poll(() => head.evaluate((el) => getComputedStyle(el).opacity))
      .toBe("0");
    await head.scrollIntoViewIfNeeded();
    await expect
      .poll(() => head.evaluate((el) => getComputedStyle(el).opacity))
      .toBe("1");

    await page
      .locator("article", { hasText: "By the numbers" })
      .scrollIntoViewIfNeeded();
    await expect
      .poll(async () =>
        (await stats(page)).every(({ shown, final }) => shown === final),
      )
      .toBe(true);
  });

  test("coming back with the Back button does not re-hide what is on screen", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.locator("#research").scrollIntoViewIfNeeded();
    await page.waitForTimeout(1500);
    await page.evaluate(() => {
      window.addEventListener("pageshow", (event) => {
        sessionStorage.setItem("restoredFromCache", String(event.persisted));
      });
    });
    await page.goto("/robots.txt");
    await page.goBack();
    expect(await lowestOnScreenOpacity(page, 1500)).toBe(1);
    test.info().annotations.push({
      type: "back navigation",
      description:
        (await page.evaluate(() =>
          sessionStorage.getItem("restoredFromCache"),
        )) === "true"
          ? "restored from the back/forward cache"
          : "page reloaded",
    });
  });

  // A reload restores the scroll position, like a Back navigation that misses the cache.
  test("reloading part-way down the page does not re-hide what is on screen", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.locator("#research").scrollIntoViewIfNeeded();
    await page.waitForTimeout(1500);
    const before = await page.evaluate(() => window.scrollY);
    await page.reload();
    expect(await lowestOnScreenOpacity(page, 1500)).toBe(1);
    expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(
      before / 2,
    );
  });
});
