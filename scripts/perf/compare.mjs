// Side-by-side table of several `pnpm perf:lcp` reports, in the order you give them.
//   node scripts/perf/compare.mjs .review/lcp-main.json .review/lcp-branch.json ...
// Refuses to compare reports measured with different settings.
import { readFileSync } from "node:fs";

const files = process.argv.slice(2);
if (files.length < 2) {
  console.error(
    "Usage: node scripts/perf/compare.mjs <report.json> <report.json> [...]",
  );
  process.exit(1);
}
const reports = files.map((file) => ({
  file,
  ...JSON.parse(readFileSync(file, "utf8")),
}));
const same = (a, b) =>
  JSON.stringify(a.settingsRaw) === JSON.stringify(b.settingsRaw);
if (!reports.every((report) => same(report, reports[0]))) {
  console.error(
    "These reports were measured with different settings and cannot be compared.",
  );
  process.exit(1);
}

for (const key of ["mobile", "desktop"]) {
  console.log(`\n### ${reports[0][key].name}\n`);
  console.log(
    "| report | commit | median LCP (ms) | min / max | median LCP-FCP | max CLS | shift in first 1 s |",
  );
  console.log("|---|---|---|---|---|---|---|");
  for (const r of reports) {
    const s = r[key].summary;
    const dirty = r.dirty ? " (uncommitted)" : "";
    console.log(
      `| ${r.label} | ${r.commit}${dirty} | ${s.medianLcp} | ${s.minLcp} / ${s.maxLcp} | ${s.medianLcpMinusFcp} ms | ${s.maxCls} | ${s.runsWithShiftInFirstSecond} of ${s.runs} runs |`,
    );
  }
}
console.log(
  "\nRead differences against the spread inside each batch (min / max), and against how far the SAME build moves between two batches (run main, branch, branch, main).",
);
