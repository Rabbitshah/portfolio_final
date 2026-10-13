import { expect, test, type Locator, type Page } from "@playwright/test";
import baseline from "./fixtures/roll-links-baseline.json";

// Rolling-text links (C2): on hover or keyboard focus the label slides up and out and an identical
// copy slides in from below. These tests protect the rules: the name is the label once, the copy is
// not in the DOM, the focus ring is not clipped, descenders and accents fit, the link is exactly
// the size it was, and with touch, reduced motion, forced colors or no JavaScript nothing rolls.

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)"; // --ease-soft
const SHIFT_TOLERANCE_PX = 0.5;

// Every link and button that rolls, found the way the baseline fixture was measured.
const GROUPS = {
  nav: 'nav[aria-label="Primary"] a',
  hero: 'section[aria-labelledby="hero-title"] a.group',
  contact: "#contact a.group, #contact button.group",
} as const;

const hosts = (page: Page, group: keyof typeof GROUPS) =>
  page.locator(GROUPS[group]).filter({ has: page.locator(".roll") });

async function ready(page: Page) {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  // The copy-email button only exists once the page has hydrated.
  await expect(page.getByRole("button", { name: "Copy email" })).toBeVisible();
}

const labelOf = (host: Locator) =>
  host.locator(".roll").evaluate((el) => (el as HTMLElement).dataset.label);

const state = (host: Locator) =>
  host.evaluate((el) => {
    const roll = el.querySelector(".roll") as HTMLElement;
    const text = el.querySelector(".roll-text") as HTMLElement;
    const after = getComputedStyle(roll, "::after");
    const shift = (transform: string) =>
      transform === "none"
        ? 0
        : Number(transform.split(",")[5]?.replace(")", ""));
    return {
      hostOverflow: getComputedStyle(el).overflow,
      rollOverflow: getComputedStyle(roll).overflow,
      afterContent: after.content,
      textShift: shift(getComputedStyle(text).transform),
      afterShift: shift(after.transform),
      boxHeight: roll.getBoundingClientRect().height,
      transitionDuration: getComputedStyle(text).transitionDuration,
      transitionTiming: getComputedStyle(text).transitionTimingFunction,
    };
  });

// ---------------------------------------------------------------- it rolls, when it may

test("rolls on hover and on keyboard focus: 200 ms, --ease-soft, copy lands where the label was", async ({
  page,
}) => {
  await ready(page);
  for (const group of ["nav", "hero", "contact"] as const) {
    const host = hosts(page, group).first();
    const rest = await state(host);
    expect(rest.textShift, `${group} at rest`).toBe(0);
    expect(rest.afterContent).toContain("/");
    expect(rest.transitionDuration).toBe("0.2s");
    expect(rest.transitionTiming).toBe(EASE);

    await host.hover();
    await expect
      .poll(async () => (await state(host)).textShift, { timeout: 2000 })
      .toBeLessThan(-rest.boxHeight + SHIFT_TOLERANCE_PX);
    await page.waitForTimeout(400); // let the ease finish
    const rolled = await state(host);
    // Label and copy move together, by the height of the clip box: the label is fully out of it.
    expect(Math.abs(rolled.afterShift - rolled.textShift)).toBeLessThan(0.01);
    expect(Math.abs(rolled.textShift)).toBeGreaterThanOrEqual(rest.boxHeight);
    await page.mouse.move(2, 2);
    await expect
      .poll(async () => (await state(host)).textShift, { timeout: 2000 })
      .toBe(0);
  }

  // Keyboard focus rolls too.
  const link = hosts(page, "hero").first();
  await page.keyboard.press("Tab");
  for (let i = 0; i < 60; i++) {
    if (await link.evaluate((el) => el === document.activeElement)) break;
    await page.keyboard.press("Tab");
  }
  await expect(link).toBeFocused();
  await expect
    .poll(async () => (await state(link)).textShift, { timeout: 2000 })
    .toBeLessThan(0);
});

test("hovering out reverses smoothly: a transition is running, it does not snap back", async ({
  page,
}) => {
  await ready(page);
  const host = hosts(page, "nav").first();
  await host.hover();
  await expect
    .poll(async () => (await state(host)).textShift, { timeout: 2000 })
    .toBeLessThan(-10);
  await page.mouse.move(2, 2);
  const leaving = await host.evaluate((el) => {
    const text = el.querySelector(".roll-text") as HTMLElement;
    return {
      transitions: text.getAnimations().length,
      shiftNow: getComputedStyle(text).transform,
    };
  });
  expect(
    leaving.transitions,
    "a reverse transition is running",
  ).toBeGreaterThan(0);
  expect(leaving.shiftNow, "it has not snapped to rest").not.toBe("none");
});

// ---------------------------------------------------------------- 1 and 2: name and DOM

test("1. the accessible name is the label exactly once", async ({ page }) => {
  await ready(page);
  for (const group of ["nav", "hero", "contact"] as const) {
    const all = hosts(page, group);
    const count = await all.count();
    expect(count, group).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      const label = (await labelOf(all.nth(i))) ?? "";
      const role =
        (await all.nth(i).evaluate((el) => el.tagName)) === "BUTTON"
          ? "button"
          : "link";
      await expect(
        page.getByRole(role, { name: label, exact: true }),
        `${group}: "${label}"`,
      ).toHaveCount(1);
    }
  }
});

test("2. the copy is not in the DOM: text, copy and paste show the label once", async ({
  page,
}) => {
  await ready(page);
  for (const group of ["nav", "hero", "contact"] as const) {
    const all = hosts(page, group);
    for (let i = 0; i < (await all.count()); i++) {
      const host = all.nth(i);
      const label = (await labelOf(host)) ?? "";
      const dom = await host.evaluate((el) => {
        const selection = window.getSelection() as Selection;
        selection.removeAllRanges();
        const range = document.createRange();
        range.selectNodeContents(el);
        selection.addRange(range);
        return {
          textContent: el.textContent?.trim(),
          innerText: (el as HTMLElement).innerText.trim(),
          selected: selection.toString().trim(),
          spans: el.querySelectorAll(".roll-text").length,
        };
      });
      const clean = (text: string | undefined) =>
        (text ?? "").replace(/\s+/g, " ").trim();
      expect(clean(dom.textContent), `${label}: textContent`).toBe(label);
      expect(clean(dom.innerText), `${label}: innerText`).toBe(label);
      expect(clean(dom.selected), `${label}: what copy gives`).toBe(label);
      expect(dom.spans).toBe(1);
    }
  }
});

// ---------------------------------------------------------------- 3: focus ring

test("3. the focus ring is drawn on the link itself and is not clipped on any side", async ({
  page,
}) => {
  await ready(page);
  for (const group of ["nav", "hero"] as const) {
    const host = hosts(page, group).first();
    // Tab until this link has focus by keyboard (so :focus-visible matches).
    await page.mouse.move(2, 2);
    await page.keyboard.press("Tab");
    for (let i = 0; i < 60; i++) {
      if (await host.evaluate((el) => el === document.activeElement)) break;
      await page.keyboard.press("Tab");
    }
    await expect(host).toBeFocused();
    await expect(host).toHaveCSS("outline-style", "solid");
    await expect(host).toHaveCSS("outline-width", "2px");
    // The link's transition-colors fades the outline colour in; read it once it has settled.
    await page.waitForTimeout(400);

    const geometry = await host.evaluate((el) => ({
      hostOverflow: getComputedStyle(el).overflow,
      clipIsInside: el.contains(el.querySelector(".roll")),
      rollOverflow: getComputedStyle(el.querySelector(".roll") as Element)
        .overflow,
      outlineColor: getComputedStyle(el).outlineColor,
      offset: parseFloat(getComputedStyle(el).outlineOffset),
    }));
    expect(
      geometry.hostOverflow,
      `${group}: the link itself is never the clip box`,
    ).toBe("visible");
    expect(geometry.rollOverflow).toBe("hidden");
    expect(geometry.clipIsInside).toBe(true);

    // And the ring is really painted just outside the link on all four sides.
    await page.waitForTimeout(300);
    const box = await host.boundingBox();
    if (!box) throw new Error("no box");
    const probe = geometry.offset + 1; // inside the 2px ring, which starts `offset` px out
    const points: [number, number][] = [
      [box.x + box.width / 2, box.y - probe],
      [box.x + box.width / 2, box.y + box.height + probe],
      [box.x - probe, box.y + box.height / 2],
      [box.x + box.width + probe, box.y + box.height / 2],
    ];
    const pad = 12;
    const clip = {
      x: Math.floor(box.x - pad),
      y: Math.floor(box.y - pad),
      width: Math.ceil(box.width + 2 * pad),
      height: Math.ceil(box.height + 2 * pad),
    };
    const shot = (await page.screenshot({ clip })).toString("base64");
    const hits = await page.evaluate(
      async ({ shot, clip, points, color }) => {
        const blob = await (
          await fetch(`data:image/png;base64,${shot}`)
        ).blob();
        const bitmap = await createImageBitmap(blob);
        const scale = bitmap.width / clip.width;
        const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
        const context = canvas.getContext(
          "2d",
        ) as OffscreenCanvasRenderingContext2D;
        context.drawImage(bitmap, 0, 0);
        const want = (color.match(/\d+/g) ?? []).slice(0, 3).map(Number);
        return points.map(([x, y]) => {
          let best = Infinity;
          for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
              const px = Math.round((x - clip.x) * scale) + dx;
              const py = Math.round((y - clip.y) * scale) + dy;
              const data = context.getImageData(px, py, 1, 1).data;
              best = Math.min(
                best,
                Math.max(...want.map((c, i) => Math.abs(c - (data[i] ?? 0)))),
              );
            }
          }
          return best;
        });
      },
      { shot, clip, points, color: geometry.outlineColor },
    );
    for (const [i, side] of ["top", "bottom", "left", "right"].entries()) {
      expect(
        hits[i],
        `${group}: ring colour found on the ${side} side (all sides: ${hits.join(", ")}; probe points ${JSON.stringify(points)}; colour ${geometry.outlineColor})`,
      ).toBeLessThan(40);
    }
  }
});

// ---------------------------------------------------------------- 4: descenders and accents

// The ink (anything that is not background) of a label, in rows relative to its clip box.
async function inkRows(page: Page, host: Locator) {
  const roll = host.locator(".roll");
  await roll.scrollIntoViewIfNeeded();
  const box = await roll.boundingBox();
  if (!box) throw new Error("no box");
  const clip = {
    x: Math.floor(box.x) - 8,
    y: Math.floor(box.y),
    width: Math.ceil(box.width) + 8,
    height: Math.ceil(box.height),
  };
  const shot = (await page.screenshot({ clip })).toString("base64");
  return page.evaluate(
    async ({ shot, clip, boxX, boxY, boxHeight }) => {
      const blob = await (await fetch(`data:image/png;base64,${shot}`)).blob();
      const bitmap = await createImageBitmap(blob);
      const scale = bitmap.width / clip.width;
      const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
      const context = canvas.getContext(
        "2d",
      ) as OffscreenCanvasRenderingContext2D;
      context.drawImage(bitmap, 0, 0);
      const { data, width, height } = context.getImageData(
        0,
        0,
        bitmap.width,
        bitmap.height,
      );
      // Background: the link's own padding, just left of the clip box.
      const bgAt = (Math.floor(height / 2) * width + 2 * Math.round(scale)) * 4;
      const bg = [data[bgAt] ?? 0, data[bgAt + 1] ?? 0, data[bgAt + 2] ?? 0];
      const startX = Math.round((boxX - clip.x) * scale);
      let top = -1;
      let bottom = -1;
      for (let y = 0; y < height; y++) {
        let ink = false;
        for (let x = startX; x < width && !ink; x++) {
          const at = (y * width + x) * 4;
          ink = [0, 1, 2].some(
            (c) => Math.abs((data[at + c] ?? 0) - (bg[c] ?? 0)) > 48,
          );
        }
        if (ink) {
          if (top < 0) top = y;
          bottom = y;
        }
      }
      // Rows are relative to the clip box's real top edge, which is not on a whole pixel.
      const offset = boxY - clip.y;
      return top < 0
        ? null
        : {
            top: top / scale - offset,
            bottom: (bottom + 1) / scale - offset,
            boxHeight,
          };
    },
    { shot, clip, boxX: box.x, boxY: box.y, boxHeight: box.height },
  );
}

test("4. descenders and accents are never clipped, at rest and after the roll: real labels and 'g y p é'", async ({
  page,
}) => {
  await ready(page);
  // A copy of a real nav link (same classes) with a test label full of descenders and an accent.
  await page.evaluate(() => {
    const source = document.querySelector(
      'nav[aria-label="Primary"] a',
    ) as HTMLElement;
    const copy = source.cloneNode(true) as HTMLElement;
    copy.id = "roll-test-link";
    copy.removeAttribute("href");
    copy.setAttribute("tabindex", "-1");
    (copy.querySelector(".roll-text") as HTMLElement).textContent = "g y p é";
    (copy.querySelector(".roll") as HTMLElement).dataset.label = "g y p é";
    copy.style.cssText =
      "position:fixed;left:300px;top:300px;z-index:5;background:var(--card);";
    document.body.append(copy);
    // The custom cursor (ring and dot) would be drawn over the link and counted as ink.
    const hide = document.createElement("style");
    hide.textContent =
      ".cursor-ring, .cursor-dot { display: none !important; }";
    document.head.append(hide);
  });
  const test = page.locator("#roll-test-link");
  const subjects: [string, Locator][] = [
    ["test label 'g y p é'", test],
    ["nav link", hosts(page, "nav").first()],
    ["hero primary button", hosts(page, "hero").first()],
    ["hero ghost button (Résumé)", hosts(page, "hero").nth(1)],
    ["contact link", hosts(page, "contact").nth(1)],
  ];
  for (const [name, host] of subjects) {
    await page.mouse.move(2, 2);
    await page.waitForTimeout(350);
    const rest = await inkRows(page, host);
    if (!rest) throw new Error(`${name}: no ink at rest`);
    expect(
      rest.top,
      `${name}: nothing touches the top edge at rest`,
    ).toBeGreaterThanOrEqual(1);
    expect(
      rest.boxHeight - rest.bottom,
      `${name}: nothing touches the bottom edge at rest`,
    ).toBeGreaterThanOrEqual(1);

    await host.hover();
    await page.waitForTimeout(450); // the 200 ms roll has finished: the copy is in place
    const rolled = await inkRows(page, host);
    if (!rolled) throw new Error(`${name}: no ink after the roll`);
    expect(
      rolled.top,
      `${name}: nothing touches the top edge after the roll`,
    ).toBeGreaterThanOrEqual(1);
    expect(
      rolled.boxHeight - rolled.bottom,
      `${name}: nothing touches the bottom edge after the roll`,
    ).toBeGreaterThanOrEqual(1);
    // The copy lands where the label was. The geometry is exact (test 1 checks the shift equals the
    // clip box height); here we only allow the two pixels by which Chrome's text rasterising and
    // antialiasing threshold can differ between an untransformed label and a copy at a fractional
    // translate (measured: 0 to 2 px, in both directions).
    expect(
      Math.abs(rolled.top - rest.top),
      `${name}: copy lands in place (top)`,
    ).toBeLessThanOrEqual(2);
    expect(
      Math.abs(rolled.bottom - rest.bottom),
      `${name}: copy lands in place (bottom)`,
    ).toBeLessThanOrEqual(2);
  }

  // Mid-roll, frozen at 100 ms: both the leaving label and the arriving copy are partly visible,
  // and the clip box is what cuts them (that is the effect).
  await page.mouse.move(2, 2);
  await page.waitForTimeout(350);
  await test.hover();
  await test.evaluate(() => {
    for (const animation of document.getAnimations()) {
      animation.pause();
      animation.currentTime = 100;
    }
  });
  const mid = await inkRows(page, test);
  expect(mid, "something is visible mid-roll").not.toBeNull();
});

// ---------------------------------------------------------------- 5: size

test.describe("5. every link and button is exactly the size it was on main, and touch targets stay 44px", () => {
  type Sizes = Record<
    string,
    { label: string; width: number; height: number }[]
  >;
  const fixture = baseline as Record<string, Sizes>;
  for (const [size, expected] of Object.entries(fixture)) {
    test(`at ${size}`, async ({ page }) => {
      const [width, height] = size.split("x").map(Number);
      await page.setViewportSize({ width: width ?? 0, height: height ?? 0 });
      await ready(page);
      const actual = await page.evaluate((groups) => {
        const result: Record<
          string,
          { label: string; width: number; height: number }[]
        > = {};
        for (const [name, selector] of Object.entries(groups)) {
          result[name] = [...document.querySelectorAll(selector)]
            .filter((el) => el.getBoundingClientRect().width > 0)
            .map((el) => {
              const r = el.getBoundingClientRect();
              return {
                label: (el.textContent ?? "").trim().replace(/\s+/g, " "),
                width: r.width,
                height: r.height,
              };
            });
        }
        return result;
      }, GROUPS);
      for (const group of Object.keys(GROUPS)) {
        const want = expected[group] ?? [];
        const got = actual[group] ?? [];
        expect(
          got.map((g) => g.label),
          `${size} ${group}: same links`,
        ).toEqual(want.map((w) => w.label));
        want.forEach((w, i) => {
          expect(
            got[i]?.width,
            `${size} ${group} "${w.label}" width`,
          ).toBeCloseTo(w.width, 0);
          expect(
            got[i]?.height,
            `${size} ${group} "${w.label}" height`,
          ).toBeCloseTo(w.height, 0);
        });
      }
    });
  }

  test.describe("on a touch screen", () => {
    test.use({
      hasTouch: true,
      isMobile: true,
      viewport: { width: 390, height: 844 },
    });
    test("every rolling link is at least 44px tall, and nothing rolls", async ({
      page,
    }) => {
      await page.goto("/");
      await page.waitForLoadState("networkidle");
      for (const group of ["hero", "contact"] as const) {
        const all = page.locator(GROUPS[group]);
        for (let i = 0; i < (await all.count()); i++) {
          const box = await all.nth(i).boundingBox();
          expect(box?.height, `${group} #${i}`).toBeGreaterThanOrEqual(44);
        }
      }
    });
  });
});

// ---------------------------------------------------------------- 6: forced colors, and the other "no roll" cases

async function expectNoRoll(page: Page, why: string) {
  for (const group of ["nav", "hero", "contact"] as const) {
    const host = hosts(page, group).first();
    if ((await host.count()) === 0 || !(await host.isVisible())) continue;
    await host.hover();
    await page.waitForTimeout(350);
    const s = await state(host);
    expect(s.afterContent, `${why} (${group}): no copy exists`).toBe("none");
    expect(s.rollOverflow, `${why} (${group}): no clip box`).toBe("visible");
    expect(s.textShift, `${why} (${group}): nothing moved`).toBe(0);
    const visible = await host.locator(".roll-text").evaluate((el) => {
      const style = getComputedStyle(el);
      const box = el.getBoundingClientRect();
      return {
        shown: style.visibility === "visible" && style.display !== "none",
        width: box.width,
        height: box.height,
      };
    });
    expect(
      visible.shown && visible.width > 0 && visible.height > 0,
      `${why} (${group}): the label is visible`,
    ).toBe(true);
  }
}

test.describe("6. forced colors: the label is visible and nothing rolls", () => {
  test.use({ colorScheme: "light", forcedColors: "active" });
  test("hover and focus", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    expect(
      await page.evaluate(() => matchMedia("(forced-colors: active)").matches),
    ).toBe(true);
    await expectNoRoll(page, "forced colors");
  });
});

test.describe("with reduced motion", () => {
  test.use({ reducedMotion: "reduce" });
  test("nothing rolls and the hover style is the normal one", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await expectNoRoll(page, "reduced motion");
  });
});

test.describe("with JavaScript off", () => {
  test.use({ javaScriptEnabled: false });
  test("nothing rolls", async ({ page }) => {
    await page.goto("/");
    await expectNoRoll(page, "JavaScript off");
  });
});

test.describe("on a device that cannot hover", () => {
  test.use({
    hasTouch: true,
    isMobile: true,
    viewport: { width: 390, height: 844 },
  });
  test("nothing rolls", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    expect(
      await page.evaluate(() => matchMedia("(hover: hover)").matches),
    ).toBe(false);
    await expectNoRoll(page, "touch");
  });
});

// ---------------------------------------------------------------- the mobile menu does not roll

test("the full-screen mobile menu buttons do not roll", async ({ page }) => {
  await page.setViewportSize({ width: 700, height: 900 });
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: "Open menu" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("link", { name: "GitHub ↗" })).toBeVisible();
  expect(await dialog.locator(".roll, .roll-host").count()).toBe(0);
});

// ---------------------------------------------------------------- 7: the cursor

test("7. the cursor ring and dot still work over rolling links: interactive, ring centred on the pointer", async ({
  page,
}) => {
  await ready(page);
  const ring = page.locator("[data-cursor-ring]");
  const dot = page.locator("[data-cursor-dot]");
  for (const group of ["nav", "hero", "contact"] as const) {
    const host = hosts(page, group).first();
    await host.scrollIntoViewIfNeeded();
    const box = await host.boundingBox();
    if (!box) throw new Error("no box");
    const x = box.x + box.width / 2;
    const y = box.y + box.height / 2;
    await page.mouse.move(x, y, { steps: 8 });
    await expect(ring, group).toHaveAttribute("data-state", "interactive");
    await expect(dot, group).toHaveAttribute("data-state", "interactive");
    await expect
      .poll(
        async () => {
          const r = await ring.boundingBox();
          return r
            ? Math.hypot(r.x + r.width / 2 - x, r.y + r.height / 2 - y)
            : Infinity;
        },
        { timeout: 4000 },
      )
      .toBeLessThan(2);
    // The roll is under way or done: the ring is still interactive and still centred.
    await page.waitForTimeout(300);
    await expect(ring).toHaveAttribute("data-state", "interactive");
    const r = await ring.boundingBox();
    expect(
      Math.hypot(
        (r?.x ?? 0) + (r?.width ?? 0) / 2 - x,
        (r?.y ?? 0) + (r?.height ?? 0) / 2 - y,
      ),
    ).toBeLessThan(2);
  }
});
