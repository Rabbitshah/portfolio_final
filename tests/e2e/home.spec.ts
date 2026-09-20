import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { faq } from "../../content/faq";
import { visibleProjects } from "../../content/projects";

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

for (const [width, height] of viewports) {
  test(`no horizontal scroll at ${width}x${height}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto("/");
    const { scrollWidth, innerWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
    }));
    expect(scrollWidth).toBeLessThanOrEqual(innerWidth);
  });
}

test.describe("JavaScript disabled", () => {
  test.use({ javaScriptEnabled: false });

  test("shows the h1, every project title and every FAQ question", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toBeVisible();
    for (const project of visibleProjects) {
      await expect(
        page.getByRole("heading", { name: project.title, exact: true }),
      ).toBeVisible();
    }
    for (const item of faq) {
      await expect(
        page.getByRole("heading", { name: item.question, exact: true }),
      ).toBeVisible();
    }
  });
});

test.describe("touch context at 390px", () => {
  test.use({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  });

  test("every visible link and button is at least 44px, except links in paragraphs", async ({
    page,
  }) => {
    await page.goto("/");
    const small = await page.evaluate(() => {
      const problems: string[] = [];
      for (const el of document.querySelectorAll("a, button")) {
        if (!el.checkVisibility()) continue;
        if (el.tagName === "A" && el.closest("p")) continue;
        const { width, height } = el.getBoundingClientRect();
        if (width < 43.99 || height < 43.99) {
          const label = (el.textContent ?? "").trim().slice(0, 30);
          problems.push(
            `<${el.tagName.toLowerCase()}> "${label}" is ${Math.round(width)}x${Math.round(height)}`,
          );
        }
      }
      return problems;
    });
    expect(small).toEqual([]);
  });

  test("no visible text is under 11.5px", async ({ page }) => {
    await page.goto("/");
    const tiny = await page.evaluate(() => {
      const problems: string[] = [];
      for (const el of document.body.querySelectorAll("*")) {
        if (["SCRIPT", "STYLE", "NOSCRIPT"].includes(el.tagName)) continue;
        const hasOwnText = [...el.childNodes].some(
          (node) =>
            node.nodeType === Node.TEXT_NODE && node.textContent?.trim(),
        );
        if (!hasOwnText || !el.checkVisibility()) continue;
        const rect = el.getBoundingClientRect();
        if (rect.width < 2 || rect.height < 2) continue; // visually hidden text
        const size = parseFloat(getComputedStyle(el).fontSize);
        if (size < 11.5) {
          problems.push(
            `<${el.tagName.toLowerCase()}> "${(el.textContent ?? "").trim().slice(0, 30)}" is ${size}px`,
          );
        }
      }
      return problems;
    });
    expect(tiny).toEqual([]);
  });
});

// Serious and critical violations fail the test.
for (const colorScheme of ["light", "dark"] as const) {
  for (const width of [390, 1440]) {
    test(`axe: /, ${colorScheme}, ${width}px`, async ({ page }) => {
      await page.emulateMedia({ colorScheme });
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/");
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
    await page.goto("/");
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
    await page.goto("/");
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
