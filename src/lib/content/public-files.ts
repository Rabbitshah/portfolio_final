import { readdirSync } from "node:fs";
import { join } from "node:path";

/**
 * True when a path like "/assets/nexgen.png" exists under public/ with exactly this case.
 * Each segment is compared against a directory listing, so a case mismatch fails on
 * Windows and macOS too (fs.existsSync alone would accept it there).
 */
export function existsWithExactCase(
  publicPath: string,
  publicDir: string = join(process.cwd(), "public"),
): boolean {
  let dir = publicDir;
  for (const segment of publicPath.split("/").filter(Boolean)) {
    let entries: string[];
    try {
      entries = readdirSync(dir);
    } catch {
      return false; // a file where a folder was expected, or a missing folder
    }
    if (!entries.includes(segment)) return false;
    dir = join(dir, segment);
  }
  return true;
}
