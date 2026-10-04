import { expect, test, type Page } from "@playwright/test";

// The marquee when it is NOT moving: with JavaScript off, and with reduced motion. It must be a
// wrapped list that lines up with the page, with real gaps, and every item fully visible.

const GAP_X = 32; // gap-x-8
const GAP_Y = 12; // gap-y-3
const TOLERANCE = 1;

// Where the page content starts: the left edge of a real <Container>, inside its padding.
const pageGutterLeft = (page: Page) =>
  page.evaluate(() => {
    const container = document.querySelector('[class*="max-w-[75rem]"]');
    if (!container) throw new Error("no Container found");
    return (
      container.getBoundingClientRect().left +
      parseFloat(getComputedStyle(container).paddingLeft)
    );
  });

type Box = { left: number; right: number; top: number; bottom: number };

const measure = (page: Page, index: number) =>
  page
    .locator(".marquee")
    .nth(index)
    .evaluate((strip) => {
      const first = strip.querySelector(".marquee-track > ul:first-child");
      if (!first) throw new Error("no list");
      const items = [...first.children] as HTMLElement[];
      const boxes = items.map((item): Box => {
        const r = item.getBoundingClientRect();
        return { left: r.left, right: r.right, top: r.top, bottom: r.bottom };
      });
      return {
        boxes,
        stripWidth: strip.getBoundingClientRect().width,
        trackWidth: (
          strip.querySelector(".marquee-track") as Element
        ).getBoundingClientRect().width,
        clipped: items.map((item) => item.scrollWidth > item.clientWidth),
        animations: strip.getAnimations({ subtree: true }).length,
        duplicateDisplay: getComputedStyle(
          strip.querySelector('ul[aria-hidden="true"]') as Element,
        ).display,
        viewport: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
      };
    });

async function checkStatic(page: Page, width: number) {
  await page.setViewportSize({ width, height: 800 });
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  const gutter = await pageGutterLeft(page);
  expect(gutter).toBeGreaterThanOrEqual(20);

  for (const index of [0, 1]) {
    const m = await measure(page, index);
    const label = `strip ${index} at ${width}px`;
    expect(m.animations, `${label}: not moving`).toBe(0);
    expect(m.duplicateDisplay, `${label}: loop copy hidden`).toBe("none");
    expect(m.boxes.length, label).toBeGreaterThan(1);
    // No room is kept for a pause button: the track takes the whole strip.
    expect(m.trackWidth, `${label}: track width`).toBeCloseTo(m.stripWidth, 0);

    // First item starts where the page content starts.
    const leftmost = Math.min(...m.boxes.map((b) => b.left));
    expect(leftmost, `${label}: left edge`).toBeGreaterThanOrEqual(
      gutter - TOLERANCE,
    );
    expect(m.boxes[0]?.left, `${label}: first item`).toBeGreaterThanOrEqual(
      gutter - TOLERANCE,
    );

    // Every item is fully on screen and not cut off inside itself.
    for (const box of m.boxes) {
      expect(box.left).toBeGreaterThanOrEqual(0);
      expect(box.right).toBeLessThanOrEqual(m.viewport + TOLERANCE);
    }
    expect(m.clipped.some(Boolean), `${label}: clipped item`).toBe(false);
    expect(m.scrollWidth, `${label}: horizontal scroll`).toBeLessThanOrEqual(
      m.viewport,
    );

    // Items do not touch: neighbours on a row, and rows above and below.
    const rows = new Map<number, Box[]>();
    for (const box of m.boxes) {
      const key = Math.round(box.top);
      rows.set(key, [...(rows.get(key) ?? []), box]);
    }
    const ordered = [...rows.entries()].sort((a, b) => a[0] - b[0]);
    for (const [, row] of ordered) {
      row.sort((a, b) => a.left - b.left);
      row.forEach((box, i) => {
        const before = row[i - 1];
        if (!before) return;
        expect(
          box.left - before.right,
          `${label}: horizontal gap`,
        ).toBeGreaterThanOrEqual(GAP_X - TOLERANCE);
      });
    }
    ordered.forEach(([, row], i) => {
      const previous = ordered[i - 1];
      if (!previous) return;
      const above = Math.max(...previous[1].map((b) => b.bottom));
      const below = Math.min(...row.map((b) => b.top));
      expect(below - above, `${label}: vertical gap`).toBeGreaterThanOrEqual(
        GAP_Y - TOLERANCE,
      );
    });
  }
}

for (const width of [390, 1280]) {
  test.describe(`static marquee at ${width}px`, () => {
    test.describe("with JavaScript off", () => {
      test.use({ javaScriptEnabled: false });
      test("lines up with the page, with gaps, nothing clipped", async ({
        page,
      }) => {
        await checkStatic(page, width);
      });
    });

    test.describe("with reduced motion", () => {
      test.use({ reducedMotion: "reduce" });
      test("lines up with the page, with gaps, nothing clipped", async ({
        page,
      }) => {
        await checkStatic(page, width);
      });
    });
  });
}
