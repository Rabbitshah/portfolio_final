import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

const script = join(process.cwd(), "scripts", "content-check.mjs");
const dirs: string[] = [];

function makeDir(files: Record<string, string>): string {
  const dir = mkdtempSync(join(tmpdir(), "content-check-"));
  dirs.push(dir);
  for (const [name, body] of Object.entries(files)) {
    writeFileSync(join(dir, name), body);
  }
  return dir;
}

function run(dir: string, strict: boolean) {
  return spawnSync("node", [script, dir], {
    encoding: "utf8",
    env: { ...process.env, CONTENT_STRICT: strict ? "1" : "" },
  });
}

afterEach(() => {
  for (const dir of dirs.splice(0))
    rmSync(dir, { recursive: true, force: true });
});

describe("content:check", () => {
  const withMarkers = {
    "a.ts": "export const a = 1;\n// TODO(content): confirm this\n",
    "b.ts": "// TODO(content): one\n// TODO(content): two\n",
    "c.ts": "export const c = 1;\n",
  };

  it("reports markers grouped by file and exits 0 by default", () => {
    const result = run(makeDir(withMarkers), false);
    expect(result.status).toBe(0);
    expect(result.stdout).toMatch(/a\.ts \(1\)/);
    expect(result.stdout).toMatch(/b\.ts \(2\)/);
    expect(result.stdout).not.toMatch(/c\.ts/);
    expect(result.stdout).toContain("3 marker(s) in 2 file(s)");
    expect(result.stdout).toContain("L2  // TODO(content): confirm this");
  });

  it("exits 1 only when CONTENT_STRICT=1 and a marker is left", () => {
    expect(run(makeDir(withMarkers), true).status).toBe(1);
  });

  it("exits 0 in strict mode when there are no markers", () => {
    const result = run(makeDir({ "c.ts": "export const c = 1;\n" }), true);
    expect(result.status).toBe(0);
    expect(result.stdout).toContain("no TODO(content) markers");
  });
});
