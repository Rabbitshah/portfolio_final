// Fails if any tracked or new non-ignored text file has a UTF-8 BOM or CRLF line endings.
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const listed = execFileSync(
  "git",
  ["ls-files", "-z", "--cached", "--others", "--exclude-standard"],
  { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 },
);
const files = [...new Set(listed.split("\0").filter(Boolean))];

const bad = [];
for (const file of files) {
  // A tracked file can be deleted in the working tree but not yet committed.
  if (!existsSync(file)) continue;
  const bytes = readFileSync(file);
  if (bytes.subarray(0, 8192).includes(0)) continue; // binary
  const problems = [];
  if (bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
    problems.push("UTF-8 BOM");
  }
  if (bytes.includes("\r\n")) problems.push("CRLF line endings");
  if (problems.length > 0) bad.push(`${file}: ${problems.join(", ")}`);
}

if (bad.length > 0) {
  console.error(`check:encoding failed (${bad.length} file(s)):`);
  for (const line of bad) console.error(`  ${line}`);
  process.exit(1);
}
console.log(`check:encoding ok (${files.length} files checked)`);
