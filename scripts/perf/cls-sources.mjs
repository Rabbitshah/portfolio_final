// When a page load has ANY layout shift, say which elements moved. Run it after perf:lcp reports
// a CLS that is not exactly 0, to see whether the shift is real or a one-off.
//   node scripts/perf/cls-sources.mjs [runs] [--url http://localhost:3000]
// Uses the desktop profile from settings.mjs, with no throttling.
import { chromium } from "@playwright/test";
import { SETTINGS } from "./settings.mjs";

const args = process.argv.slice(2);
const urlIndex = args.indexOf("--url");
const url = urlIndex >= 0 ? args[urlIndex + 1] : "http://localhost:3000/";
const runs = Number(args.find((arg) => /^\d+$/.test(arg)) ?? 30);

const browser = await chromium.launch();
const seen = {};
let withShift = 0;
for (let i = 0; i < runs; i++) {
  const context = await browser.newContext({
    viewport: SETTINGS.desktop.viewport,
  });
  const page = await context.newPage();
  await page.addInitScript(() => {
    window.__shifts = [];
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        window.__shifts.push({
          value: entry.value,
          time: entry.startTime,
          nodes: (entry.sources ?? []).map(
            (s) =>
              `${s.node?.nodeName}.${String(s.node?.className ?? "").slice(0, 30)}#${s.node?.id ?? ""}`,
          ),
        });
      }
    }).observe({ type: "layout-shift", buffered: true });
  });
  await page.goto(url, { waitUntil: "load" });
  await page.waitForTimeout(SETTINGS.settleMs);
  const shifts = await page.evaluate(() => window.__shifts);
  if (shifts.length) {
    withShift++;
    for (const shift of shifts) {
      const key = shift.nodes.join(" ; ");
      seen[key] = (seen[key] ?? 0) + 1;
      console.log(
        `run ${i + 1}: value ${shift.value} at ${Math.round(shift.time)} ms: ${key}`,
      );
    }
  }
  await context.close();
}
console.log(`runs with any layout shift: ${withShift} of ${runs}`);
console.log(JSON.stringify(seen, null, 2));
await browser.close();
