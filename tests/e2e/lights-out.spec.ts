import { expect, test, type Browser, type Page } from "@playwright/test";
import { site } from "../../content/site";
import layoutBaseline from "./fixtures/hero-layout-baseline.json";

// The hero "lights out" intro: three dots light up, go out, and the headline words rise in.
// About 0.71 s, once per load, CSS only. These tests protect the safety rules: the default page
// is the final page, nothing moves with reduced motion, nothing shifts, nothing repeats.

const HEADLINE = site.headline;
const MAX_TOTAL_SECONDS = 0.8;
const WORD_COUNT = HEADLINE.split(" ").length;

// Everything the intro animates: the gantry, its dots, and the headline words.
const introAnimations = (page: Page) =>
  page
    .evaluate(() => {
      const parts = [
        ...document.querySelectorAll(".gantry, .gantry i, h1 .hero-word"),
      ];
      return parts.flatMap((el) => el.getAnimations());
    })
    .then((animations) => animations.length);

// Counts the intro's animation starts through the DevTools Animation domain, from before the
// page loads. This works with JavaScript off (a page script could not), and unlike "how many are
// running right now" it does not depend on how long the load took (the first dot is over in 70 ms).
async function trackStarts(page: Page) {
  const session = await page.context().newCDPSession(page);
  await session.send("Animation.enable");
  const names: string[] = [];
  session.on("Animation.animationStarted", ({ animation }) => {
    names.push(animation.name);
  });
  return () => {
    const count = (name: string) => names.filter((n) => n === name).length;
    return {
      words: count("word-in"),
      dots: count("light-on"),
      gantry: count("gantry"),
    };
  };
}

// Pauses every intro animation at its first start (call before page.goto), so a test can then put
// them at any moment with freezeIntroAt(). Words and dots are still at their "from" state at 0 ms.
const pauseIntroOnStart = (page: Page) =>
  page.addInitScript(() => {
    document.addEventListener(
      "animationstart",
      () => document.getAnimations().forEach((animation) => animation.pause()),
      { capture: true, once: true },
    );
  });
const freezeIntroAt = (page: Page, time: number) =>
  page.evaluate((time) => {
    for (const animation of document.getAnimations()) {
      if (
        (animation.effect as KeyframeEffect | null)?.target?.closest(
          ".gantry, h1",
        )
      ) {
        animation.pause();
        animation.currentTime = time;
      }
    }
  }, time);

const words = (page: Page) => page.locator("h1 .hero-word");
const gantry = (page: Page) => page.locator(".gantry");

async function expectFinalState(page: Page, label: string) {
  const state = await page.evaluate(() => ({
    words: [...document.querySelectorAll("h1 .hero-word")].map((el) => {
      const style = getComputedStyle(el);
      return { opacity: style.opacity, transform: style.transform };
    }),
    gantryOpacity: getComputedStyle(
      document.querySelector(".gantry") as Element,
    ).opacity,
  }));
  expect(state.words, `${label}: words`).toHaveLength(WORD_COUNT);
  for (const word of state.words) {
    expect(word, `${label}: a word is not in its final state`).toEqual({
      opacity: "1",
      transform: "none",
    });
  }
  expect(state.gantryOpacity, `${label}: gantry is hidden`).toBe("0");
}

// delay + duration x count of every intro animation, from the computed styles.
const timings = (page: Page) =>
  page.evaluate(() => {
    const seconds = (value: string) =>
      value.endsWith("ms") ? parseFloat(value) / 1000 : parseFloat(value);
    return [
      ...document.querySelectorAll(".gantry, .gantry i, h1 .hero-word"),
    ].map((el) => {
      const style = getComputedStyle(el);
      const count = style.animationIterationCount;
      return {
        name: style.animationName,
        delay: seconds(style.animationDelay),
        duration: seconds(style.animationDuration),
        count,
        total:
          seconds(style.animationDelay) +
          seconds(style.animationDuration) * Number(count),
      };
    });
  });

// ---------------------------------------------------------------- safe default states

test.describe("with reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("the page is in its final state at load and nothing in the intro animates", async ({
    page,
  }) => {
    await page.goto("/");
    await expectFinalState(page, "at load");
    expect(await introAnimations(page)).toBe(0);
  });
});

test.describe("if animation is off or in print", () => {
  test("with animations forced off, every word is fully visible and the gantry stays hidden", async ({
    page,
  }) => {
    await page.goto("/");
    await page.addStyleTag({
      content: "*,*::before,*::after{animation:none !important}",
    });
    await expectFinalState(page, "animation: none");
  });

  test("in print, every word is fully visible and the gantry stays hidden", async ({
    page,
  }) => {
    await page.emulateMedia({ media: "print" });
    await page.goto("/");
    await expectFinalState(page, "print");
    expect(await introAnimations(page)).toBe(0);
  });
});

async function runsThenFinishes(browser: Browser, javaScriptEnabled: boolean) {
  const context = await browser.newContext({ javaScriptEnabled });
  const page = await context.newPage();
  const started = await trackStarts(page);
  await page.goto("/");
  const startTimings = await timings(page);
  await page.waitForTimeout(1500);
  await expectFinalState(
    page,
    `JavaScript ${javaScriptEnabled ? "on" : "off"}`,
  );
  const counts = started();
  await context.close();
  return { started: counts, startTimings };
}

test("with JavaScript off, the intro runs and ends exactly as it does with JavaScript on", async ({
  browser,
}) => {
  const withJs = await runsThenFinishes(browser, true);
  const withoutJs = await runsThenFinishes(browser, false);
  // Not vacuous: the whole intro starts, with and without JavaScript.
  expect(withJs.started).toEqual({ words: WORD_COUNT, dots: 3, gantry: 1 });
  expect(withoutJs.started).toEqual(withJs.started);
  expect(withoutJs.startTimings).toEqual(withJs.startTimings);
});

// ---------------------------------------------------------------- timing, flashing, once

test("every animation runs once, and the whole intro is over in 0.8 s or less", async ({
  page,
}) => {
  await page.goto("/");
  const all = await timings(page);
  expect(all).toHaveLength(1 + 3 + WORD_COUNT);
  for (const entry of all) {
    expect(entry.count, `${entry.name} must not repeat`).toBe("1");
    expect(entry.total, `${entry.name}: delay + duration`).toBeLessThanOrEqual(
      MAX_TOTAL_SECONDS,
    );
  }
  const total = Math.max(...all.map((entry) => entry.total));
  test.info().annotations.push({
    type: "total intro time",
    description: `${Math.round(total * 1000)} ms`,
  });
});

test("the dots never flash: each dot rises once and the gantry rises once and falls once", async ({
  page,
}) => {
  await page.goto("/");
  const shapes = await page.evaluate(() => {
    const opacities = (el: Element) =>
      el
        .getAnimations()
        .flatMap((animation) =>
          (animation.effect as KeyframeEffect).getKeyframes(),
        )
        .map((keyframe) => Number(keyframe.opacity))
        .filter((value) => !Number.isNaN(value));
    return {
      dots: [...document.querySelectorAll(".gantry i")].map(opacities),
      gantry: opacities(document.querySelector(".gantry") as Element),
    };
  });
  expect(shapes.dots).toHaveLength(3);
  for (const dot of shapes.dots) {
    // Only ever up: never lights, goes dark, and lights again.
    expect([...dot].sort((a, b) => a - b)).toEqual(dot);
  }
  expect(shapes.gantry).toEqual([0, 1, 1, 0]);
});

test("the intro plays exactly once per load: one animationstart per element, none after hydration", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const starts: { name: string; target: Element }[] = [];
    (window as unknown as { __starts: typeof starts }).__starts = starts;
    document.addEventListener(
      "animationstart",
      (event) => {
        if (event.target instanceof Element)
          starts.push({ name: event.animationName, target: event.target });
      },
      true,
    );
  });
  await page.goto("/", { waitUntil: "load" });
  await page.waitForTimeout(1500);
  const result = await page.evaluate(() => {
    const starts = (
      window as unknown as {
        __starts: { name: string; target: Element }[];
      }
    ).__starts.filter((start) =>
      ["word-in", "light-on", "gantry"].includes(start.name),
    );
    const perElement = new Map<Element, number>();
    for (const start of starts)
      perElement.set(start.target, (perElement.get(start.target) ?? 0) + 1);
    const count = (name: string) =>
      starts.filter((start) => start.name === name).length;
    return {
      words: count("word-in"),
      dots: count("light-on"),
      gantry: count("gantry"),
      mostStartsOnOneElement: Math.max(...perElement.values()),
    };
  });
  expect(result).toEqual({
    words: WORD_COUNT,
    dots: 3,
    gantry: 1,
    mostStartsOnOneElement: 1,
  });
});

// ---------------------------------------------------------------- layout

for (const [width, height] of [
  [390, 844],
  [1440, 900],
] as [number, number][]) {
  test(`no layout shift during load and the intro, and nothing moves, at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height });
    await page.addInitScript(() => {
      const w = window as unknown as {
        __shift: number;
        __start: unknown;
      };
      w.__shift = 0;
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const shift = entry as unknown as {
            hadRecentInput: boolean;
            value: number;
          };
          if (!shift.hadRecentInput) w.__shift += shift.value;
        }
      }).observe({ type: "layout-shift", buffered: true });
      const snapshot = () => {
        const h1 = document.querySelector("h1");
        const rect = (el: Element | null | undefined) => {
          const r = el?.getBoundingClientRect();
          return r && { x: r.x, y: r.y, w: r.width, h: r.height };
        };
        return {
          eyebrow: rect(h1?.previousElementSibling),
          h1: rect(h1),
          intro: rect(h1?.nextElementSibling),
        };
      };
      (window as unknown as { __snapshot: typeof snapshot }).__snapshot =
        snapshot;
      document.addEventListener(
        "animationstart",
        () => {
          w.__start ??= snapshot();
        },
        true,
      );
    });
    await page.goto("/", { waitUntil: "load" });
    await page.waitForTimeout(2500);
    const result = await page.evaluate(() => {
      const w = window as unknown as {
        __shift: number;
        __start: unknown;
        __snapshot: () => unknown;
      };
      return { shift: w.__shift, start: w.__start, end: w.__snapshot() };
    });
    // Zero in practice (40 desktop loads in a row had no layout shift at all). The bound only
    // forgives a rare sub-pixel entry (one load in a separate batch recorded 5e-8), which is
    // nowhere near a visible shift.
    expect(result.shift).toBeLessThan(1e-6);
    expect(result.start).toBeTruthy();
    expect(result.end).toEqual(result.start);
  });
}

// The h1 box and every line break match the page as it was before the intro existed.
// Measured with reduced motion so no transform is in play. To refresh the fixture after a
// deliberate typography change, re-measure the h1 box and line breaks at each size.
const baseline = layoutBaseline as Record<
  string,
  {
    h1: { x: number; width: number; height: number };
    fontSize: string;
    lines: string[];
  }
>;
test.describe("layout parity with the page before the intro", () => {
  test.use({ reducedMotion: "reduce" });

  for (const [size, expected] of Object.entries(baseline)) {
    test(`the h1 box and line breaks are unchanged at ${size}`, async ({
      page,
    }) => {
      const [width, height] = size.split("x").map(Number);
      await page.setViewportSize({ width: width ?? 0, height: height ?? 0 });
      await page.goto("/");
      await page.waitForLoadState("networkidle");
      const actual = await page.evaluate(() => {
        const h1 = document.querySelector("h1") as HTMLElement;
        const root = h1.querySelector(':scope > [aria-hidden="true"]') ?? h1;
        const box = h1.getBoundingClientRect();
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
        const chars: { c: string; top: number; left: number }[] = [];
        for (let n = walker.nextNode(); n; n = walker.nextNode()) {
          const text = (n as Text).data;
          for (let i = 0; i < text.length; i++) {
            const range = document.createRange();
            range.setStart(n, i);
            range.setEnd(n, i + 1);
            const rect = range.getClientRects()[0];
            if (rect && text.charAt(i).trim())
              chars.push({
                c: text.charAt(i),
                top: Math.round(rect.top),
                left: rect.left,
              });
          }
        }
        const lines: { top: number; chars: typeof chars }[] = [];
        for (const ch of chars) {
          let line = lines.find((l) => Math.abs(l.top - ch.top) < 6);
          if (!line) {
            line = { top: ch.top, chars: [] };
            lines.push(line);
          }
          line.chars.push(ch);
        }
        lines.sort((a, b) => a.top - b.top);
        return {
          h1: { x: box.x, width: box.width, height: box.height },
          fontSize: getComputedStyle(h1).fontSize,
          lines: lines.map((l) =>
            l.chars
              .sort((a, b) => a.left - b.left)
              .map((c) => c.c)
              .join(""),
          ),
        };
      });
      expect(actual.lines, "line breaks").toEqual(expected.lines);
      expect(actual.fontSize).toBe(expected.fontSize);
      expect(actual.h1.x).toBeCloseTo(expected.h1.x, 0);
      expect(actual.h1.width).toBeCloseTo(expected.h1.width, 0);
      expect(actual.h1.height).toBeCloseTo(expected.h1.height, 0);
    });
  }
});

// ---------------------------------------------------------------- the gantry itself

test.describe("the gantry dots", () => {
  for (const [width, height] of [
    [320, 640],
    [390, 844],
    [1280, 720],
    [1440, 900],
  ] as [number, number][]) {
    test(`sit between the status bar and the eyebrow at ${width}x${height}`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height });
      await page.goto("/");
      const boxes = await page.evaluate(() => {
        const rect = (el: Element | null) => el?.getBoundingClientRect();
        const bar = rect(
          document.querySelector(".pointer-events-auto.mx-auto.flex"),
        );
        const dots = rect(document.querySelector(".gantry"));
        const eyebrow = rect(
          document.querySelector("h1")?.previousElementSibling ?? null,
        );
        return {
          bar: bar?.bottom,
          top: dots?.top,
          bottom: dots?.bottom,
          eyebrow: eyebrow?.top,
        };
      });
      expect(boxes.top).toBeGreaterThanOrEqual(boxes.bar ?? Infinity);
      expect(boxes.bottom).toBeLessThanOrEqual(boxes.eyebrow ?? 0);
    });
  }

  test("are hidden on a short landscape screen, where the headline still animates", async ({
    page,
  }) => {
    const started = await trackStarts(page);
    await page.setViewportSize({ width: 844, height: 390 });
    await page.goto("/");
    await expect(gantry(page)).toBeHidden();
    expect(
      await gantry(page).evaluate((el) => getComputedStyle(el).display),
    ).toBe("none");
    expect(await words(page).count()).toBe(WORD_COUNT);
    expect(started()).toEqual({
      words: WORD_COUNT,
      dots: 0,
      gantry: 0,
    });
  });

  for (const [width, height] of [
    [390, 844],
    [1440, 900],
  ] as [number, number][]) {
    test(`take no room: hiding them moves nothing, at ${width}px`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height });
      await page.goto("/");
      await page.waitForLoadState("networkidle");
      const positions = () =>
        page.evaluate(() => {
          const h1 = document.querySelector("h1");
          const rect = (el: Element | null | undefined) => {
            const r = el?.getBoundingClientRect();
            return r && { x: r.x, y: r.y, w: r.width, h: r.height };
          };
          return {
            eyebrow: rect(h1?.previousElementSibling),
            h1: rect(h1),
            intro: rect(h1?.nextElementSibling),
            hero: rect(h1?.closest("section")),
          };
        });
      const withGantry = await positions();
      await page.addStyleTag({ content: ".gantry{display:none !important}" });
      expect(await positions()).toEqual(withGantry);
    });
  }

  test("look exactly like the window dots: 11px, 7px apart, red, yellow and green", async ({
    page,
  }) => {
    await page.goto("/");
    const look = await page.evaluate(() => {
      const describe = (wrapper: Element | null) => ({
        gap: wrapper && getComputedStyle(wrapper).columnGap,
        dots: [...(wrapper?.children ?? [])].map((dot) => {
          const style = getComputedStyle(dot);
          const rect = dot.getBoundingClientRect();
          return {
            width: rect.width,
            height: rect.height,
            color: style.backgroundColor,
            radius: style.borderRadius,
          };
        }),
      });
      return {
        gantry: describe(document.querySelector(".gantry > span")),
        window: describe(document.querySelector("article header > span")),
      };
    });
    expect(look.gantry).toEqual(look.window);
    expect(look.gantry.gap).toBe("7px");
    expect(look.gantry.dots.map((dot) => dot.color)).toEqual([
      "rgb(255, 95, 87)",
      "rgb(254, 188, 46)",
      "rgb(40, 200, 64)",
    ]);
    for (const dot of look.gantry.dots) {
      expect([dot.width, dot.height]).toEqual([11, 11]);
    }
  });
});

// ---------------------------------------------------------------- the headline

test.describe("the headline", () => {
  test("is the sentence once for assistive tech, with the visible words hidden from it", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toHaveCount(1);
    const parts = await page.evaluate(() => {
      const h1 = document.querySelector("h1") as HTMLElement;
      return {
        readable: h1.querySelector(".sr-only")?.textContent,
        visible: h1.querySelector(':scope > [aria-hidden="true"]')?.textContent,
        words: h1.querySelectorAll(".hero-word").length,
      };
    });
    expect(parts.readable).toBe(HEADLINE);
    expect(parts.visible).toBe(HEADLINE);
    expect(parts.words).toBeLessThanOrEqual(12);
    await expect(
      page.getByRole("heading", { level: 1, name: HEADLINE, exact: true }),
    ).toBeVisible();
  });

  test("copying the whole heading gives the sentence once", async ({
    page,
    context,
  }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/");
    // What the Selection API says is selected.
    const selected = await page.evaluate(() => {
      const h1 = document.querySelector("h1") as HTMLElement;
      const selection = window.getSelection() as Selection;
      selection.removeAllRanges();
      const range = document.createRange();
      range.selectNodeContents(h1);
      selection.addRange(range);
      return selection.toString();
    });
    const normalize = (text: string) => text.replace(/\s+/g, " ").trim();
    expect(normalize(selected)).toBe(HEADLINE);
    // And what a real Ctrl+C puts on the clipboard.
    await page.keyboard.press("Control+C");
    const copied = await page.evaluate(() => navigator.clipboard.readText());
    expect(normalize(copied)).toBe(HEADLINE);
    expect(copied.split("I build").length - 1, "headline appears once").toBe(1);
  });
});

// ---------------------------------------------------------------- the words never fade or crowd

// Transform only: the headline keeps full opacity, and so full contrast, at every moment.
test("every headline word has opacity 1 from the very first frame to the last", async ({
  page,
}) => {
  await pauseIntroOnStart(page);
  await page.goto("/");
  for (const time of [0, 200, 400, 500, 800]) {
    await freezeIntroAt(page, time);
    const opacities = await page.evaluate(() =>
      [...document.querySelectorAll("h1 .hero-word")].map(
        (el) => getComputedStyle(el).opacity,
      ),
    );
    expect(opacities, `at ${time} ms`).toEqual(
      Array.from({ length: WORD_COUNT }, () => "1"),
    );
  }
});

// At its lowest point (0 ms) the sliding headline must stay clear of the paragraph below it.
const MIN_GAP_PX = 8;
for (const [width, height] of [
  [390, 844],
  [1440, 900],
  [1920, 1080],
] as [number, number][]) {
  test(`the sliding words stay at least ${MIN_GAP_PX}px above the intro paragraph at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height });
    await pauseIntroOnStart(page);
    await page.goto("/");
    await freezeIntroAt(page, 0);
    const measured = await page.evaluate(() => {
      const h1 = document.querySelector("h1") as HTMLElement;
      const paragraph = h1.nextElementSibling as HTMLElement;
      const top = paragraph.getBoundingClientRect().top;
      const gaps = [...h1.querySelectorAll(".hero-word")].map(
        // getBoundingClientRect includes the transform: this is where the word really is.
        (word) => top - word.getBoundingClientRect().bottom,
      );
      return { gaps, lowest: Math.min(...gaps) };
    });
    expect(
      measured.lowest,
      `smallest gap ${measured.lowest.toFixed(1)}px (per word: ${measured.gaps
        .map((gap) => gap.toFixed(1))
        .join(", ")})`,
    ).toBeGreaterThanOrEqual(MIN_GAP_PX);
  });
}

// ---------------------------------------------------------------- back and forward

test("after going away and coming back, the page is in its final state and the intro has not replayed twice", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const w = window as unknown as { __wordStarts: number };
    w.__wordStarts = 0;
    document.addEventListener(
      "animationstart",
      (event) => {
        if (event.animationName === "word-in") w.__wordStarts += 1;
      },
      true,
    );
    window.addEventListener("pageshow", (event) => {
      sessionStorage.setItem("restoredFromCache", String(event.persisted));
      // A restored page keeps its old count; only starts after the restore matter.
      if (event.persisted) w.__wordStarts = 0;
    });
  });
  await page.goto("/");
  await page.waitForTimeout(1500);
  await page.goto("/robots.txt");
  await page.goBack();
  await page.waitForTimeout(1500);
  await expectFinalState(page, "after back");
  const restored =
    (await page.evaluate(() => sessionStorage.getItem("restoredFromCache"))) ===
    "true";
  const starts = await page.evaluate(
    () => (window as unknown as { __wordStarts: number }).__wordStarts,
  );
  // Restored from the back/forward cache: the finished page comes back, no new start.
  // Reloaded instead: a new load, so the intro plays once more, once.
  expect(starts).toBe(restored ? 0 : WORD_COUNT);
  test.info().annotations.push({
    type: "back navigation",
    description: restored
      ? "restored from the back/forward cache, no replay"
      : "page reloaded, intro played once more",
  });
});
