import { readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const contentDir = join(root, "content");
const publicDir = join(root, "public");

// A path into public/, e.g. "/assets/nexgen.png". Hash links like "/#about" do not match.
const assetPath = /^\/[^\s#?]+\.[A-Za-z0-9]+$/;

interface Found {
  where: string;
  value: string;
}

async function loadContent() {
  const files = readdirSync(contentDir).filter((file) => file.endsWith(".ts"));
  return Promise.all(
    files.map(
      async (file) =>
        [
          file,
          await import(/* @vite-ignore */ join(contentDir, file)),
        ] as const,
    ),
  );
}

function walk(
  value: unknown,
  where: string,
  visit: (key: string, value: unknown, where: string) => void,
): void {
  if (Array.isArray(value)) {
    value.forEach((item, index) => walk(item, `${where}[${index}]`, visit));
  } else if (value && typeof value === "object") {
    for (const [key, child] of Object.entries(value)) {
      visit(key, child, `${where}.${key}`);
      walk(child, `${where}.${key}`, visit);
    }
  }
}

// Compares each path segment against a directory listing, so a case mismatch fails
// on Windows and macOS too (fs.existsSync alone would pass there).
function existsWithExactCase(publicPath: string): boolean {
  let dir = publicDir;
  for (const segment of publicPath.split("/").filter(Boolean)) {
    if (!readdirSync(dir).includes(segment)) return false;
    dir = join(dir, segment);
  }
  return true;
}

describe("content asset paths", () => {
  it("every file path in content/*.ts exists under public/ with exact case", async () => {
    const found: Found[] = [];
    const badMedia: string[] = [];

    for (const [file, module] of await loadContent()) {
      walk(module, file, (key, value, where) => {
        if (typeof value === "string" && assetPath.test(value)) {
          found.push({ where, value });
        }
        if (key === "media" && value && typeof value === "object") {
          const src = (value as { src?: unknown }).src;
          if (typeof src !== "string" || !assetPath.test(src)) {
            badMedia.push(
              `${where}.src is not a path into public/: ${String(src)}`,
            );
          }
        }
      });
    }

    expect(found.length).toBeGreaterThan(0);
    expect(badMedia).toEqual([]);
    const missing = found
      .filter(({ value }) => !existsWithExactCase(value))
      .map(({ where, value }) => `${where}: ${value}`);
    expect(missing).toEqual([]);
  });

  it('has no "#" in any links field', async () => {
    const bad: string[] = [];
    for (const [file, module] of await loadContent()) {
      walk(module, file, (key, value, where) => {
        if (key !== "links" || !value || typeof value !== "object") return;
        for (const [name, link] of Object.entries(value)) {
          if (typeof link === "string" && link.includes("#")) {
            bad.push(`${where}.${name}: ${link}`);
          }
        }
      });
    }
    expect(bad).toEqual([]);
  });
});
