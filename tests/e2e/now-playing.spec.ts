import { expect, test } from "@playwright/test";

// The now-playing chip (1320px and up) must show every fact in full, and keep one width.

for (const width of [1320, 1440, 1920]) {
  test(`no fact is clipped, and the chip stays inside the bar, at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.goto("/");
    const chip = page.locator('div[aria-hidden="true"]:has(.eq-bar)');
    await expect(chip).toBeVisible();
    const facts = await chip.locator(".grid > span").evaluateAll((spans) =>
      spans.map((span) => ({
        text: span.textContent,
        clipped: span.scrollWidth > span.clientWidth,
      })),
    );
    expect(facts.length).toBeGreaterThan(1);
    for (const fact of facts)
      expect(fact, String(fact.text)).toMatchObject({ clipped: false });

    const box = await chip.boundingBox();
    const nav = await page.locator('nav[aria-label="Primary"]').boundingBox();
    if (!box || !nav) throw new Error("missing box");
    expect(nav.x + nav.width).toBeLessThanOrEqual(box.x);
    expect(box.x + box.width).toBeLessThanOrEqual(width);
  });
}
