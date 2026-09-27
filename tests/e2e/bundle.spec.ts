import { expect, test } from "@playwright/test";
import { appendFileSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";

// First-load JavaScript budget for "/", checked like a snapshot (see bundle-budget.json):
// - fails if the build grew more than `toleranceKb` over the recorded `baselineKb`;
// - only warns (never fails) when the size is above `warnAboveKb`.
// A deliberate increase is committed as a new baseline in the same PR.
// Size = every script the browser actually downloads for "/" (so `noModule` polyfills that
// modern browsers skip do not count), each gzipped at level 9 so the number does not depend
// on the server's own compression.

type Budget = {
  route: string;
  baselineKb: number;
  toleranceKb: number;
  warnAboveKb: number;
};

const budget = JSON.parse(
  readFileSync(join(process.cwd(), "bundle-budget.json"), "utf8"),
) as Budget;

test(`first-load JavaScript for ${budget.route} stays within ${budget.toleranceKb} KB of the baseline`, async ({
  page,
}) => {
  const sizes = new Map<string, number>();
  const pending: Promise<void>[] = [];
  page.on("response", (response) => {
    if (response.request().resourceType() !== "script") return;
    pending.push(
      response
        .body()
        .then((body) => {
          sizes.set(response.url(), gzipSync(body, { level: 9 }).length);
        })
        .catch(() => {}),
    );
  });
  await page.goto(budget.route, { waitUntil: "networkidle" });
  await Promise.all(pending);

  const kb = [...sizes.values()].reduce((sum, size) => sum + size, 0) / 1024;
  const measured = Math.round(kb * 10) / 10;
  const delta = Math.round((measured - budget.baselineKb) * 10) / 10;
  const line = `First-load JS for ${budget.route}: ${measured} KB gzipped, ${sizes.size} scripts (baseline ${budget.baselineKb} KB, ${delta >= 0 ? "+" : ""}${delta} KB)`;
  console.log(line);
  test.info().annotations.push({ type: "bundle", description: line });

  if (measured > budget.warnAboveKb) {
    const warning = `WARNING: first-load JS for ${budget.route} is ${measured} KB, above the ${budget.warnAboveKb} KB budget.`;
    console.warn(warning);
    test.info().annotations.push({ type: "warning", description: warning });
    if (process.env.GITHUB_STEP_SUMMARY) {
      appendFileSync(
        process.env.GITHUB_STEP_SUMMARY,
        `> [!WARNING]\n> ${warning}\n`,
      );
    }
  }

  expect(
    measured,
    `${line}. If this increase is deliberate, update baselineKb in bundle-budget.json and report it.`,
  ).toBeLessThanOrEqual(budget.baselineKb + budget.toleranceKb);
});
