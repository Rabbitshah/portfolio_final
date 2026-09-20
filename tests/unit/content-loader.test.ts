import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, it } from "vitest";

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return /\.(ts|tsx)$/.test(entry.name) ? [path] : [];
  });
}

it("only src/lib/content reads content/*.ts; everything else uses the validating loader", () => {
  const root = process.cwd();
  const loaderDir = join(root, "src", "lib", "content");
  const offenders = sourceFiles(join(root, "src"))
    .filter((file) => !file.startsWith(loaderDir))
    .filter((file) => readFileSync(file, "utf8").includes('"@content/'))
    .map((file) => file.slice(root.length + 1));
  expect(offenders).toEqual([]);
});
