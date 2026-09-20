// Lists every "TODO(content):" marker in content/, grouped by file.
// Report only (exit 0) by default. With CONTENT_STRICT=1 it exits 1 if any marker is left.
// Usage: node scripts/content-check.mjs [dir]   (dir defaults to "content")
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const dir = process.argv[2] ?? "content";
const marker = /TODO\(content\):/;

const groups = [];
for (const file of readdirSync(dir)
  .filter((name) => name.endsWith(".ts"))
  .sort()) {
  const lines = readFileSync(join(dir, file), "utf8").split("\n");
  const hits = [];
  lines.forEach((line, index) => {
    if (marker.test(line)) hits.push({ line: index + 1, text: line.trim() });
  });
  if (hits.length > 0) groups.push({ file, hits });
}

const total = groups.reduce((sum, group) => sum + group.hits.length, 0);

if (total === 0) {
  console.log("content:check: no TODO(content) markers.");
} else {
  console.log("content:check: open TODO(content) markers\n");
  for (const { file, hits } of groups) {
    console.log(`${dir}/${file} (${hits.length})`);
    for (const { line, text } of hits) console.log(`  L${line}  ${text}`);
    console.log("");
  }
  console.log(`${total} marker(s) in ${groups.length} file(s).`);
}

if (process.env.CONTENT_STRICT === "1" && total > 0) {
  console.error(
    "CONTENT_STRICT=1: resolve every TODO(content) marker before launch.",
  );
  process.exit(1);
}
if (total > 0)
  console.log(
    "Report only. Set CONTENT_STRICT=1 to fail when any marker is left.",
  );
