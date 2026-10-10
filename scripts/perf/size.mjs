// Gzipped (level 9) size of the CSS files and the HTML of the home page, from a running server.
//   node scripts/perf/size.mjs <output .json path> [--url http://localhost:3000]
// Start the production build first (pnpm build, then pnpm start). The first-load JS size is
// already reported by tests/e2e/bundle.spec.ts.
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { gzipSync } from "node:zlib";

const args = process.argv.slice(2);
const out = args.find((arg) => !arg.startsWith("--"));
const urlIndex = args.indexOf("--url");
const base = (
  urlIndex >= 0 ? args[urlIndex + 1] : "http://localhost:3000"
).replace(/\/$/, "");
if (!out) {
  console.error(
    "Usage: node scripts/perf/size.mjs <output .json path> [--url http://localhost:3000]",
  );
  process.exit(1);
}

const html = Buffer.from(await (await fetch(`${base}/`)).arrayBuffer());
const hrefs = [
  ...html.toString().matchAll(/<link[^>]*rel="stylesheet"[^>]*href="([^"]+)"/g),
].map((match) => match[1]);
const css = [];
for (const href of hrefs) {
  const body = Buffer.from(await (await fetch(base + href)).arrayBuffer());
  css.push({
    href,
    raw: body.length,
    gzip: gzipSync(body, { level: 9 }).length,
  });
}
const report = {
  html: { raw: html.length, gzip: gzipSync(html, { level: 9 }).length },
  css,
  cssTotal: {
    raw: css.reduce((sum, file) => sum + file.raw, 0),
    gzip: css.reduce((sum, file) => sum + file.gzip, 0),
  },
};
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify(report, null, 2) + "\n");
console.log(
  `HTML ${report.html.gzip} B gzip (${report.html.raw} raw); CSS ${report.cssTotal.gzip} B gzip (${report.cssTotal.raw} raw)`,
);
