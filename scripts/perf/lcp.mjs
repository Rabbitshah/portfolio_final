// LCP / FCP / CLS measurement for the home page of a PRODUCTION build.
//
//   pnpm build
//   pnpm perf:lcp <output path without extension> [--label <name>] [--url <running server>]
//
// Writes <path>.json (everything, per run) and <path>.md (a short summary table).
// By default it starts `next start` itself on a free-ish port and stops it afterwards, so it
// always measures the build in `.next`. With --url it measures a server you already started
// (it refuses a dev server). The settings are in settings.mjs and are not configurable.
import { chromium } from "@playwright/test";
import { spawn, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { describeSettings, SETTINGS } from "./settings.mjs";

const PORT = 3210;

function parseArgs(argv) {
  const args = { out: null, label: null, url: null };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--label") args.label = argv[++i];
    else if (arg === "--url") args.url = argv[++i];
    else if (!arg.startsWith("--") && !args.out) args.out = arg;
    else throw new Error(`Unknown argument: ${arg}`);
  }
  if (!args.out) {
    throw new Error(
      "Usage: pnpm perf:lcp <output path without extension> [--label name] [--url http://localhost:3000]",
    );
  }
  return args;
}

const git = (...args) => {
  const result = spawnSync("git", args, { encoding: "utf8" });
  return result.status === 0 ? result.stdout.trim() : "unknown";
};

async function waitForServer(url, timeoutMs = 60000) {
  const end = Date.now() + timeoutMs;
  while (Date.now() < end) {
    try {
      if ((await fetch(url)).ok) return;
    } catch {
      // not up yet
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(
    `Server did not answer at ${url} within ${timeoutMs / 1000} s`,
  );
}

function startServer() {
  if (!existsSync(".next/BUILD_ID")) {
    throw new Error(
      "No production build found in .next. Run `pnpm build` first.",
    );
  }
  const child = spawn(`pnpm exec next start -p ${PORT}`, {
    shell: true,
    stdio: "ignore",
    detached: process.platform !== "win32",
  });
  return {
    url: `http://localhost:${PORT}/`,
    stop() {
      if (process.platform === "win32") {
        spawnSync("taskkill", ["/pid", String(child.pid), "/T", "/F"], {
          stdio: "ignore",
        });
      } else {
        try {
          process.kill(-child.pid);
        } catch {
          child.kill();
        }
      }
    },
  };
}

async function assertProduction(url) {
  const html = await (await fetch(url)).text();
  if (/hmr-client|webpack-hmr/i.test(html)) {
    throw new Error(
      `${url} looks like a dev server. Measure a production build (pnpm build, then pnpm start).`,
    );
  }
}

const median = (values) =>
  [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];
const round1 = (n) => Math.round(n * 10) / 10;

/** One cold page load. Returns the metrics of that load. */
async function measureOnce(browser, url, profile) {
  const context = await browser.newContext({
    viewport: profile.viewport,
    isMobile: profile.isMobile,
    hasTouch: profile.hasTouch,
    deviceScaleFactor: profile.deviceScaleFactor,
  });
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  await cdp.send("Network.enable");
  await cdp.send("Network.setCacheDisabled", {
    cacheDisabled: SETTINGS.cacheDisabled,
  });
  if (profile.network) {
    await cdp.send("Network.emulateNetworkConditions", {
      offline: false,
      latency: profile.network.latencyMs,
      downloadThroughput: profile.network.downloadBytesPerSecond,
      uploadThroughput: profile.network.uploadBytesPerSecond,
    });
  }
  if (profile.cpuThrottleRate) {
    await cdp.send("Emulation.setCPUThrottlingRate", {
      rate: profile.cpuThrottleRate,
    });
  }
  await page.addInitScript((watchMs) => {
    const state = (window.__perf = {
      lcp: [],
      fcp: null,
      shifts: [],
      headline: [],
    });
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        state.lcp.push({
          time: entry.startTime,
          tag: entry.element?.tagName,
          id: entry.element?.id,
        });
      }
    }).observe({ type: "largest-contentful-paint", buffered: true });
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries())
        if (entry.name === "first-contentful-paint")
          state.fcp = entry.startTime;
    }).observe({ type: "paint", buffered: true });
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput)
          state.shifts.push({ time: entry.startTime, value: entry.value });
      }
    }).observe({ type: "layout-shift", buffered: true });
    // Sample the headline's size every frame: a change after the first sample is a font swap or a reflow.
    const start = () => {
      const began = performance.now();
      let last = "";
      const tick = () => {
        const h1 = document.querySelector("h1");
        const em = document.querySelector("h1 em");
        if (h1) {
          const signature = `${h1.offsetWidth}x${h1.offsetHeight}|${em ? em.offsetWidth + "x" + em.offsetHeight : ""}`;
          if (signature !== last) {
            state.headline.push({ time: performance.now(), signature });
            last = signature;
          }
        }
        if (performance.now() - began < watchMs) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };
    if (document.readyState === "loading")
      document.addEventListener("DOMContentLoaded", start);
    else start();
  }, SETTINGS.fontSwapWatchMs);

  await page.goto(url, { waitUntil: "load" });
  await page.waitForTimeout(SETTINGS.settleMs);
  const raw = await page.evaluate(() => window.__perf);
  await context.close();

  const lcp = raw.lcp[raw.lcp.length - 1];
  if (!lcp || raw.fcp === null) throw new Error("No LCP or FCP was recorded");
  return {
    lcp: round1(lcp.time),
    fcp: round1(raw.fcp),
    lcpMinusFcp: round1(lcp.time - raw.fcp),
    lcpElement: `${lcp.tag}${lcp.id ? "#" + lcp.id : ""}`,
    cls: raw.shifts.reduce((sum, shift) => sum + shift.value, 0),
    shiftsInFirstSecond: raw.shifts.filter(
      (shift) => shift.time < SETTINGS.earlyShiftMs,
    ).length,
    headlineSizeChanges: Math.max(0, raw.headline.length - 1),
  };
}

function summarize(runs) {
  const lcps = runs.map((run) => run.lcp);
  const gaps = runs.map((run) => run.lcpMinusFcp);
  return {
    runs: runs.length,
    medianLcp: Math.round(median(lcps)),
    minLcp: Math.round(Math.min(...lcps)),
    maxLcp: Math.round(Math.max(...lcps)),
    medianLcpMinusFcp: round1(median(gaps)),
    maxLcpMinusFcp: round1(Math.max(...gaps)),
    maxCls: Math.max(...runs.map((run) => run.cls)),
    runsWithShiftInFirstSecond: runs.filter(
      (run) => run.shiftsInFirstSecond > 0,
    ).length,
    runsWithHeadlineSizeChange: runs.filter(
      (run) => run.headlineSizeChanges > 0,
    ).length,
    lcpElements: [...new Set(runs.map((run) => run.lcpElement))],
  };
}

async function measureProfile(browser, url, profile) {
  const runs = [];
  for (let i = 0; i < profile.runs; i++) {
    runs.push(await measureOnce(browser, url, profile));
    process.stdout.write(`  ${profile.name}: run ${i + 1}/${profile.runs}\r`);
  }
  process.stdout.write("\n");
  return { name: profile.name, summary: summarize(runs), runs };
}

function markdown(report) {
  const { label, commit, branch, dirty, browser, date, settings } = report;
  const head =
    "| profile | runs | median LCP (ms) | min / max LCP | median LCP-FCP | max LCP-FCP | max CLS | runs with a shift in first 1 s | runs where the h1 changed size |\n|---|---|---|---|---|---|---|---|---|\n";
  const row = (p) => {
    const s = p.summary;
    return `| ${p.name} | ${s.runs} | ${s.medianLcp} | ${s.minLcp} / ${s.maxLcp} | ${s.medianLcpMinusFcp} ms | ${s.maxLcpMinusFcp} ms | ${s.maxCls} | ${s.runsWithShiftInFirstSecond} | ${s.runsWithHeadlineSizeChange} |`;
  };
  const perRun = (p) =>
    `\n### Per run: ${p.name}\n\n| run | LCP (ms) | FCP (ms) | LCP-FCP (ms) | CLS | LCP element |\n|---|---|---|---|---|---|\n` +
    p.runs
      .map(
        (r, i) =>
          `| ${i + 1} | ${r.lcp} | ${r.fcp} | ${r.lcpMinusFcp} | ${r.cls} | ${r.lcpElement} |`,
      )
      .join("\n") +
    "\n";
  return `# LCP / CLS: ${label}

- Commit: \`${commit}\` on \`${branch}\`${dirty ? " (**uncommitted changes**)" : ""}
- Measured: ${date}, ${browser}
- Settings: ${settings}

${head}${row(report.mobile)}
${row(report.desktop)}

LCP element in every run: ${[...new Set([...report.mobile.summary.lcpElements, ...report.desktop.summary.lcpElements])].join(", ")}.
LCP-FCP is the gap between the largest paint and the first paint (0 means the largest element was painted in the first frame).
Compare reports measured back to back; see scripts/perf/README.md.
${perRun(report.mobile)}${perRun(report.desktop)}`;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const server = args.url ? null : startServer();
  const url = args.url ?? server.url;
  let browser;
  try {
    await waitForServer(url);
    await assertProduction(url);
    browser = await chromium.launch();
    const mobile = await measureProfile(browser, url, SETTINGS.mobile);
    const desktop = await measureProfile(browser, url, SETTINGS.desktop);
    const report = {
      label: args.label ?? git("rev-parse", "--abbrev-ref", "HEAD"),
      commit: git("rev-parse", "--short", "HEAD"),
      branch: git("rev-parse", "--abbrev-ref", "HEAD"),
      dirty: git("status", "--porcelain", "--untracked-files=no") !== "",
      date: new Date().toISOString(),
      browser: `Chromium ${browser.version()}`,
      settings: describeSettings(),
      settingsRaw: SETTINGS,
      mobile,
      desktop,
    };
    mkdirSync(dirname(args.out), { recursive: true });
    writeFileSync(`${args.out}.json`, JSON.stringify(report, null, 2) + "\n");
    writeFileSync(`${args.out}.md`, markdown(report));
    for (const profile of [mobile, desktop]) {
      const s = profile.summary;
      console.log(
        `${profile.name}: median LCP ${s.medianLcp} ms (min ${s.minLcp}, max ${s.maxLcp}); median LCP-FCP ${s.medianLcpMinusFcp} ms; max CLS ${s.maxCls}`,
      );
    }
    console.log(`Wrote ${args.out}.json and ${args.out}.md`);
  } finally {
    await browser?.close();
    server?.stop();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
