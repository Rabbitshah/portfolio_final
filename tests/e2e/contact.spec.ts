import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { randomInt, randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { contact } from "../../content/contact";
import { site } from "../../content/site";
import { FAKE_MAIL_FILE, FAKE_MESSAGES_FILE } from "../../src/services/fakes";

// The web servers start with E2E_FAKE_SERVICES=1 (see playwright.config.ts): the database, the
// rate limiter and the mailer are local fakes that append JSON lines to files read back here.

type Line = Record<string, unknown>;

function lines(file: string): Line[] {
  try {
    return readFileSync(file, "utf8")
      .split("\n")
      .filter(Boolean)
      .map((line) => JSON.parse(line) as Line);
  } catch {
    return [];
  }
}

// Every test gets its own client address, so the rate limit never leaks between tests.
async function ownAddress(page: Page): Promise<void> {
  const ip = `10.${randomInt(256)}.${randomInt(256)}.${randomInt(1, 255)}`;
  await page.context().setExtraHTTPHeaders({ "x-forwarded-for": ip });
}

async function fill(page: Page, message: string, name = "Ada Lovelace") {
  await page.getByLabel(contact.labels.name).fill(name);
  await page.getByLabel(contact.labels.email).fill("ada@example.com");
  await page.getByLabel(contact.labels.message).fill(message);
}

const submit = (page: Page) =>
  page.getByRole("button", { name: contact.submit });
const status = (page: Page) => page.locator('#contact [role="status"]');
const emailErrorText = (text: string) =>
  text.replace("{email}", site.contact.email);

test.describe("contact form with JavaScript", () => {
  test.beforeEach(async ({ page }) => {
    await ownAddress(page);
    await page.goto("/");
  });

  test("a valid message is stored, emailed and confirmed, with line breaks kept", async ({
    page,
  }) => {
    const tag = randomUUID();
    const message = `First line ${tag}\nSecond line\n\nFourth line`;
    await fill(page, message);
    await submit(page).click();

    await expect(status(page)).toHaveText(contact.success);
    // The form is empty again after success.
    await expect(page.getByLabel(contact.labels.message)).toHaveValue("");

    await expect
      .poll(() => lines(FAKE_MESSAGES_FILE).filter((l) => l.body === message))
      .toHaveLength(1);
    const stored = lines(FAKE_MESSAGES_FILE).find((l) => l.body === message);
    expect(stored).toMatchObject({
      name: "Ada Lovelace",
      email: "ada@example.com",
    });
    expect(String(stored?.ipHash)).toMatch(/^[0-9a-f]{64}$/);
    expect(
      lines(FAKE_MESSAGES_FILE).some(
        (l) => l.type === "notified" && l.id === stored?.id,
      ),
    ).toBe(true);

    const mail = lines(FAKE_MAIL_FILE).find((l) =>
      String(l.text).includes(tag),
    );
    expect(mail).toMatchObject({
      replyTo: "ada@example.com",
      subject: "Portfolio message from Ada Lovelace",
    });
    expect(String(mail?.text)).toContain("First line");
    expect(JSON.stringify(mail)).not.toMatch(/10\.\d+\.\d+\.\d+/);
  });

  test("empty submit shows an Error: message per field, marks them invalid and focuses the first", async ({
    page,
  }) => {
    await submit(page).click();
    const name = page.getByLabel(contact.labels.name);
    await expect(name).toHaveAttribute("aria-invalid", "true");
    await expect(name).toBeFocused();
    for (const [field, text] of [
      ["name", contact.fieldErrors.nameRequired],
      ["email", contact.fieldErrors.emailRequired],
      ["message", contact.fieldErrors.messageTooShort],
    ] as const) {
      const error = page.locator(`#contact-${field}-error`);
      await expect(error).toHaveText(`${contact.errorPrefix} ${text}`);
      await expect(page.locator(`#contact-${field}`)).toHaveAttribute(
        "aria-describedby",
        new RegExp(`contact-${field}-error`),
      );
    }
  });

  test("keeps what was typed when a field is wrong", async ({ page }) => {
    await page.getByLabel(contact.labels.name).fill("Grace Hopper");
    await page.getByLabel(contact.labels.email).fill("not-an-email");
    await page
      .getByLabel(contact.labels.message)
      .fill("A message that is long enough.");
    await submit(page).click();
    await expect(page.locator("#contact-email-error")).toHaveText(
      `${contact.errorPrefix} ${contact.fieldErrors.emailInvalid}`,
    );
    await expect(page.getByLabel(contact.labels.name)).toHaveValue(
      "Grace Hopper",
    );
    await expect(page.getByLabel(contact.labels.message)).toHaveValue(
      "A message that is long enough.",
    );
    await expect(page.getByLabel(contact.labels.email)).toBeFocused();
  });

  test("honeypot: a filled hidden field looks like success but stores and sends nothing", async ({
    page,
  }) => {
    const tag = randomUUID();
    await fill(page, `Bot message ${tag} with enough text`);
    await page
      .locator('input[name="reply_window"]')
      .fill("https://spam.example");
    await submit(page).click();
    await expect(status(page)).toHaveText(contact.success);
    // Give the server a moment, then check nothing was written.
    await page.waitForTimeout(500);
    expect(
      lines(FAKE_MESSAGES_FILE).some((l) => String(l.body).includes(tag)),
    ).toBe(false);
    expect(
      lines(FAKE_MAIL_FILE).some((l) => String(l.text).includes(tag)),
    ).toBe(false);
  });

  test("the sixth message within an hour is refused with an Error: and my email", async ({
    page,
  }) => {
    for (let index = 1; index <= 5; index++) {
      await fill(page, `Rate limit message number ${index}`);
      await submit(page).click();
      await expect(status(page)).toHaveText(contact.success);
      // React resets the form just after the result renders; wait so the next fill is not wiped.
      await expect(page.getByLabel(contact.labels.message)).toHaveValue("");
    }
    // Clear the success text before the sixth attempt so the assertion cannot match stale text.
    await fill(page, "Rate limit message number 6");
    await submit(page).click();
    await expect(status(page)).toHaveText(
      `${contact.errorPrefix} ${emailErrorText(contact.errors.limited)}`,
    );
    await expect(page.getByLabel(contact.labels.message)).toHaveValue(
      "Rate limit message number 6",
    );
    expect(
      lines(FAKE_MESSAGES_FILE).some(
        (l) => l.body === "Rate limit message number 6",
      ),
    ).toBe(false);
  });
});

test.describe("contact form with JavaScript off", () => {
  // Smooth scrolling on a page this long keeps the button "moving" while Playwright retries the
  // click, so these tests ask for reduced motion (which turns smooth scrolling off).
  test.use({ javaScriptEnabled: false, reducedMotion: "reduce" });

  test("the form still posts and shows the result", async ({ page }) => {
    await ownAddress(page);
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    const tag = randomUUID();
    await fill(page, `No script message ${tag}`);
    await submit(page).click();
    await expect(status(page)).toHaveText(contact.success, { timeout: 15_000 });
    expect(
      lines(FAKE_MESSAGES_FILE).some((l) => String(l.body).includes(tag)),
    ).toBe(true);
  });

  test("validation errors show without JavaScript and keep the typed values", async ({
    page,
  }) => {
    await ownAddress(page);
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.getByLabel(contact.labels.name).fill("Grace Hopper");
    await submit(page).click();
    await expect(page.locator("#contact-email-error")).toHaveText(
      `${contact.errorPrefix} ${contact.fieldErrors.emailRequired}`,
    );
    await expect(page.getByLabel(contact.labels.name)).toHaveValue(
      "Grace Hopper",
    );
  });
});

// PLAN §11 viewport matrix, with the form showing errors.
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
  test(`contact form in its error state has no horizontal scroll at ${width}x${height}`, async ({
    page,
  }) => {
    await ownAddress(page);
    await page.setViewportSize({ width, height });
    await page.goto("/");
    await submit(page).click();
    await expect(page.locator("#contact-name-error")).toBeVisible();
    const { scrollWidth, innerWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
    }));
    expect(scrollWidth).toBeLessThanOrEqual(innerWidth);
  });
}

// WCAG 2.4.11 Focus Not Obscured: the fixed bar must not cover the field focus moves to.
// The page starts with the name field tucked under the bar, so focus() has to scroll it clear
// (html's scroll-padding-top is what makes it stop below the bar).
for (const [width, height] of [
  [390, 844],
  [1440, 900],
] as const) {
  test(`the focused invalid field is not hidden by the fixed bar at ${width}px`, async ({
    page,
  }) => {
    await ownAddress(page);
    await page.setViewportSize({ width, height });
    await page.goto("/");
    const name = page.getByLabel(contact.labels.name);
    await name.evaluate((el) => {
      const top = el.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top: top - 10, behavior: "instant" });
    });
    await submit(page).click();
    await expect(name).toBeFocused();

    // Smooth scrolling: wait until the page has stopped moving.
    await expect
      .poll(async () => {
        const first = await page.evaluate(() => window.scrollY);
        await page.waitForTimeout(150);
        return (await page.evaluate(() => window.scrollY)) === first;
      })
      .toBe(true);

    const bar = await page
      .locator("div.fixed.top-0 > div")
      .first()
      .boundingBox();
    const field = await name.boundingBox();
    if (!bar || !field) throw new Error("bar or field not rendered");
    expect(field.y).toBeGreaterThanOrEqual(bar.y + bar.height + 8);
    expect(field.y + field.height).toBeLessThanOrEqual(height);
    expect(field.x).toBeGreaterThanOrEqual(0);
    expect(field.x + field.width).toBeLessThanOrEqual(width);
  });
}

test("inputs and the submit button are at least 44px tall on a touch screen", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  });
  const page = await context.newPage();
  await page.goto("/");
  for (const locator of [
    page.getByLabel(contact.labels.name),
    page.getByLabel(contact.labels.email),
    page.getByLabel(contact.labels.message),
    submit(page),
  ]) {
    const box = await locator.boundingBox();
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
  }
  await context.close();
});

test("text is at least 11.5px in the contact form", async ({ page }) => {
  await page.goto("/");
  const smallest = await page.evaluate(() => {
    const sizes = [...document.querySelectorAll("#contact form *")]
      .filter(
        (el) =>
          el.childNodes.length &&
          [...el.childNodes].some(
            (n) => n.nodeType === 3 && n.textContent?.trim(),
          ),
      )
      .map((el) => parseFloat(getComputedStyle(el).fontSize));
    return Math.min(...sizes);
  });
  expect(smallest).toBeGreaterThanOrEqual(11.5);
});

// Non-text contrast (WCAG 1.4.11): the field border and the invalid marker need 3:1.
for (const colorScheme of ["light", "dark"] as const) {
  test(`field borders have at least 3:1 contrast, ${colorScheme}`, async ({
    page,
  }) => {
    await ownAddress(page);
    await page.emulateMedia({ colorScheme });
    await page.goto("/");
    const idle = await borderContrast(page, "#contact-name");
    await submit(page).click();
    const invalid = await borderContrast(page, "#contact-name");
    expect(idle).toBeGreaterThanOrEqual(3);
    expect(invalid).toBeGreaterThanOrEqual(3);
  });
}

async function borderContrast(page: Page, selector: string): Promise<number> {
  return page.evaluate((sel) => {
    const parse = (value: string): [number, number, number, number] => {
      const match = value.match(/rgba?\(([^)]+)\)/);
      if (!match?.[1]) throw new Error(`Cannot read colour: ${value}`);
      const [r = 0, g = 0, b = 0, a = 1] = match[1].split(/[ ,/]+/).map(Number);
      return [r, g, b, a];
    };
    const over = (top: number[], bottom: number[]) => {
      const a = top[3] ?? 1;
      return [0, 1, 2].map(
        (i) => (top[i] ?? 0) * a + (bottom[i] ?? 0) * (1 - a),
      );
    };
    const backdrop = (el: Element | null): number[] => {
      if (!el) return [255, 255, 255];
      const own = parse(getComputedStyle(el).backgroundColor);
      return (own[3] ?? 1) >= 1 ? own : over(own, backdrop(el.parentElement));
    };
    const luminance = (rgb: number[]) => {
      const [r = 0, g = 0, b = 0] = rgb.map((c) => {
        const s = c / 255;
        return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
      });
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };
    const el = document.querySelector(sel);
    if (!el) throw new Error(`No element ${sel}`);
    const parent = backdrop(el.parentElement);
    const border = over(parse(getComputedStyle(el).borderTopColor), parent);
    const fill = backdrop(el);
    const ratio = (a: number[], b: number[]) => {
      const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
      return ((hi ?? 0) + 0.05) / ((lo ?? 0) + 0.05);
    };
    // The border has to stand out from both what is around it and what is inside it.
    return Math.min(ratio(border, parent), ratio(border, fill));
  }, selector);
}

// axe on the contact section in each state, both themes, phone and desktop widths.
for (const colorScheme of ["light", "dark"] as const) {
  for (const width of [390, 1440]) {
    for (const state of ["idle", "error", "success"] as const) {
      test(`axe: contact form, ${state}, ${colorScheme}, ${width}px`, async ({
        page,
      }) => {
        await ownAddress(page);
        await page.emulateMedia({ colorScheme });
        await page.setViewportSize({ width, height: 900 });
        await page.goto("/");
        if (state === "error") {
          await submit(page).click();
          await expect(page.locator("#contact-name-error")).toBeVisible();
        }
        if (state === "success") {
          await fill(page, "An accessibility check message.");
          await submit(page).click();
          await expect(status(page)).toHaveText(contact.success);
        }
        const results = await new AxeBuilder({ page })
          .include("#contact")
          .analyze();
        expect(results.violations).toEqual([]);
      });
    }
  }
}
