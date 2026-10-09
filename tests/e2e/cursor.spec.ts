import { expect, test, type Locator, type Page } from "@playwright/test";

// The cursor follower ring: a decorative ring that trails the mouse. The real cursor is never
// hidden or changed. These tests protect the rules: mouse only, nothing without JavaScript or on
// touch, off for reduced motion and forced colors, never in the way of a click, never over a
// text field.

const ring = (page: Page) => page.locator("[data-cursor-ring]");

const center = async (locator: Locator) => {
  const box = await locator.boundingBox();
  if (!box) throw new Error("ring has no box");
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
};

async function ready(page: Page) {
  await page.goto("/");
  await expect(ring(page)).toBeAttached();
}

// ---------------------------------------------------------------- follows the mouse

test("is hidden until the mouse moves, then follows it to within 2 px", async ({
  page,
}) => {
  await ready(page);
  await expect(ring(page)).toHaveAttribute("data-state", "hidden");
  await expect(ring(page)).toHaveCSS("opacity", "0");

  await page.mouse.move(300, 300);
  await page.mouse.move(700, 450, { steps: 6 });
  await expect
    .poll(
      async () => {
        const point = await center(ring(page));
        return Math.hypot(point.x - 700, point.y - 450);
      },
      { timeout: 4000 },
    )
    .toBeLessThan(2);
  await expect(ring(page)).not.toHaveAttribute("data-state", "hidden");
});

test("is one fixed element that never changes the cursor: no `cursor: none` anywhere", async ({
  page,
}) => {
  await ready(page);
  await page.mouse.move(400, 300);
  expect(await ring(page).count()).toBe(1);

  const noneRules = await page.evaluate(() => {
    const found: string[] = [];
    const walk = (rules: CSSRuleList) => {
      for (const rule of Array.from(rules)) {
        const styled = rule as CSSStyleRule;
        if (styled.style?.cursor === "none") found.push(styled.cssText);
        if ("cssRules" in rule) walk((rule as CSSGroupingRule).cssRules);
      }
    };
    for (const sheet of Array.from(document.styleSheets)) walk(sheet.cssRules);
    return found;
  });
  expect(noneRules).toEqual([]);

  const cursors = await page.evaluate(() =>
    ["body", "a[href]", "button", "[data-cursor-ring]"].map(
      (selector) =>
        getComputedStyle(document.querySelector(selector) as Element).cursor,
    ),
  );
  expect(cursors).not.toContain("none");
  // Normal browser values, untouched (buttons keep the browser's own default).
  expect(cursors.slice(0, 2)).toEqual(["auto", "pointer"]);
});

// ---------------------------------------------------------------- states

test("grows over a link in the bar, is plain over text, and shrinks while pressed", async ({
  page,
}) => {
  await ready(page);
  const work = page
    .getByRole("navigation", { name: "Primary" })
    .getByRole("link", { name: "Work" });
  await work.hover();
  await expect(ring(page)).toHaveAttribute("data-state", "interactive");
  const width = async () => (await ring(page).boundingBox())?.width ?? 0;
  await expect.poll(width).toBeCloseTo(44, 0); // 44 px, not a scaled 28

  await page.locator("h1").hover();
  await expect(ring(page)).toHaveAttribute("data-state", "default");
  await expect.poll(width).toBeCloseTo(28, 0);

  await page.getByRole("link", { name: "See projects" }).hover();
  await expect(ring(page)).toHaveAttribute("data-state", "interactive");

  await page.locator("h1").hover();
  await expect(ring(page)).not.toHaveAttribute("data-pressed", "");
  await page.mouse.down();
  await expect(ring(page)).toHaveAttribute("data-pressed", "");
  await page.mouse.up();
  await expect(ring(page)).not.toHaveAttribute("data-pressed", "");
});

// ---------------------------------------------------------------- never in the way

test("a click on a link under the ring still goes to the link", async ({
  page,
}) => {
  await ready(page);
  const work = page
    .getByRole("navigation", { name: "Primary" })
    .getByRole("link", { name: "Work" });
  await work.hover();
  await expect(ring(page)).toHaveAttribute("data-state", "interactive");
  const point = await center(work);
  // Give the ring time to arrive, so it is really sitting on the link.
  await expect
    .poll(async () => {
      const at = await center(ring(page));
      return Math.hypot(at.x - point.x, at.y - point.y);
    })
    .toBeLessThan(2);

  const top = await page.evaluate(({ x, y }) => {
    const element = document.elementFromPoint(x, y);
    return {
      isRing: element?.hasAttribute("data-cursor-ring") ?? false,
      link: element?.closest("a")?.textContent?.trim(),
    };
  }, point);
  expect(top).toEqual({ isRing: false, link: "Work" });

  await page.mouse.click(point.x, point.y);
  await expect(page).toHaveURL(/#work$/);
});

test("steps aside over a text field, which keeps the native I-beam", async ({
  page,
}) => {
  await ready(page);
  const message = page.locator("#contact-message");
  await message.scrollIntoViewIfNeeded();
  await page.getByRole("link", { name: "GitHub" }).hover();
  await expect(ring(page)).toHaveAttribute("data-state", "interactive");

  await message.hover();
  await expect(ring(page)).toHaveAttribute("data-state", "hidden");
  await expect(ring(page)).toHaveCSS("opacity", "0");
  expect(await message.evaluate((el) => getComputedStyle(el).cursor)).toBe(
    "text",
  );

  await message.click();
  await expect(message).toBeFocused();
  await expect(ring(page)).toHaveAttribute("data-state", "hidden");
});

// ---------------------------------------------------------------- touch, pen, leaving

test("ignores touch and pen: hides without moving, and returns for the mouse", async ({
  page,
}) => {
  await ready(page);
  await page.mouse.move(250, 250);
  await page.mouse.move(500, 300, { steps: 4 });
  const translate = () => ring(page).evaluate((el) => el.style.translate);
  // Wait until the ring has fully settled on the mouse point (it snaps to it exactly), so the
  // reading below is not taken in the middle of its last little glide.
  await expect.poll(translate, { timeout: 4000 }).toBe("500px 300px");
  const before = await translate();

  await page.evaluate(() => {
    for (const pointerType of ["touch", "pen"]) {
      document.dispatchEvent(
        new PointerEvent("pointermove", {
          pointerType,
          clientX: 90,
          clientY: 90,
          bubbles: true,
        }),
      );
    }
  });
  await expect(ring(page)).toHaveAttribute("data-state", "hidden");
  await page.waitForTimeout(400);
  expect(await translate()).toBe(before);

  await page.mouse.move(800, 400);
  await expect(ring(page)).not.toHaveAttribute("data-state", "hidden");
  await expect
    .poll(async () => {
      const point = await center(ring(page));
      return Math.hypot(point.x - 800, point.y - 400);
    })
    .toBeLessThan(2);
});

test("hides when the pointer leaves the window, and shows again when it comes back", async ({
  page,
}) => {
  await ready(page);
  await page.mouse.move(300, 300);
  await expect(ring(page)).not.toHaveAttribute("data-state", "hidden");

  await page.evaluate(() => {
    document.documentElement.dispatchEvent(
      new MouseEvent("mouseout", { relatedTarget: null, bubbles: true }),
    );
  });
  await expect(ring(page)).toHaveAttribute("data-state", "hidden");

  await page.mouse.move(320, 310);
  await expect(ring(page)).not.toHaveAttribute("data-state", "hidden");
});

// ---------------------------------------------------------------- when it must not exist

test.describe("with forced colors or print", () => {
  test("is not displayed", async ({ page }) => {
    await ready(page);
    await page.mouse.move(300, 300);
    await expect(ring(page)).toBeVisible();

    await page.emulateMedia({ forcedColors: "active" });
    await expect(ring(page)).toHaveCSS("display", "none");
    await page.emulateMedia({ forcedColors: "none" });
    await expect(ring(page)).toBeVisible();

    await page.emulateMedia({ media: "print" });
    await expect(ring(page)).toHaveCSS("display", "none");
  });
});

test.describe("with reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("is not rendered at all", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.mouse.move(300, 300);
    await page.mouse.move(600, 400, { steps: 5 });
    await expect(ring(page)).toHaveCount(0);
  });
});

test("goes away if reduced motion is switched on during the visit", async ({
  page,
}) => {
  await ready(page);
  await page.mouse.move(300, 300);
  await expect(ring(page)).toBeVisible();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(ring(page)).toHaveCount(0);
});

test.describe("on a touch screen", () => {
  test.use({
    hasTouch: true,
    isMobile: true,
    viewport: { width: 390, height: 844 },
  });

  test("is not rendered", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    expect(
      await page.evaluate(() => matchMedia("(pointer: fine)").matches),
    ).toBe(false);
    await expect(ring(page)).toHaveCount(0);
  });
});

test.describe("with JavaScript off", () => {
  test.use({ javaScriptEnabled: false });

  test("there is no ring, and the cursor is the normal browser cursor", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(ring(page)).toHaveCount(0);
    const cursors = await page.evaluate(() => {
      const of = (selector: string) =>
        getComputedStyle(document.querySelector(selector) as Element).cursor;
      return {
        body: of("body"),
        link: of("a[href]"),
        message: of("#contact-message"),
      };
    });
    expect(cursors).toEqual({ body: "auto", link: "pointer", message: "text" });
  });
});

// ---------------------------------------------------------------- how it looks

test("uses the page's own colors in both themes, and sits above everything", async ({
  page,
}) => {
  for (const colorScheme of ["light", "dark"] as const) {
    await page.emulateMedia({ colorScheme });
    await ready(page);
    await page.mouse.move(300, 300);
    await expect(ring(page)).not.toHaveAttribute("data-state", "hidden");
    const look = await page.evaluate(() => {
      const probe = (property: "color" | "backgroundColor", token: string) => {
        const el = document.createElement("div");
        el.style[property] = `var(${token})`;
        document.body.append(el);
        const value = getComputedStyle(el)[property];
        el.remove();
        return value;
      };
      const style = getComputedStyle(
        document.querySelector("[data-cursor-ring]") as Element,
      );
      return {
        border: style.borderTopColor,
        ink: probe("color", "--ink"),
        halo: style.boxShadow,
        bg: probe("backgroundColor", "--bg"),
        zIndex: Number(style.zIndex),
        pointerEvents: style.pointerEvents,
      };
    });
    expect(look.border, `${colorScheme}: border is the ink color`).toBe(
      look.ink,
    );
    expect(look.halo.startsWith(look.bg), `${colorScheme}: halo`).toBe(true);
    expect(look.pointerEvents).toBe("none");
    // The bar is z-50 and the mobile menu z-60.
    expect(look.zIndex).toBeGreaterThan(60);
  }
});
