import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, it } from "vitest";

// Private details from an offer letter must never reach the repo. Every file in content/ is
// read as plain text (comments included), so this also catches notes left in comments.
const forbidden: [string, RegExp][] = [
  ["83204", /83204/],
  ["CTC", /\bCTC\b/],
  ["₹", /₹/],
  ["probation", /probation/i],
  ["PT-EMP", /PT-EMP/],
  ["CIN", /\bCIN\b/],
  ["GSTIN", /\bGSTIN\b/],
  ["Annexure", /Annexure/i],
];

it("no file in content/ contains private offer-letter details", () => {
  const dir = join(process.cwd(), "content");
  const found: string[] = [];
  for (const file of readdirSync(dir)) {
    const text = readFileSync(join(dir, file), "utf8");
    for (const [name, pattern] of forbidden) {
      if (pattern.test(text)) found.push(`content/${file} contains "${name}"`);
    }
  }
  expect(found).toEqual([]);
});
