// Words set in italic accent in the headline, as in the template. They are matched inside
// site.headline, so the rendered text always equals it exactly.
export const headlineEmphasis = ["ship", "hold up."];

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** The headline cut into runs, each marked as emphasized or not. Concatenated, they equal the text. */
export function splitHeadline(
  text: string,
): { text: string; emphasized: boolean }[] {
  const pattern = new RegExp(
    `(${headlineEmphasis.map(escapeRegExp).join("|")})`,
  );
  return text
    .split(pattern)
    .filter((part) => part !== "")
    .map((part) => ({
      text: part,
      emphasized: headlineEmphasis.includes(part),
    }));
}

/** The headline as whitespace-separated words, each marked emphasized when it falls inside an emphasized phrase. */
export function headlineWords(
  text: string,
): { word: string; emphasized: boolean }[] {
  const ranges = headlineEmphasis
    .map((phrase) => [text.indexOf(phrase), phrase.length] as const)
    .filter(([start]) => start >= 0)
    .map(([start, length]) => [start, start + length] as const);
  return [...text.matchAll(/\S+/g)].map((match) => {
    const start = match.index ?? 0;
    return {
      word: match[0],
      emphasized: ranges.some(([from, to]) => start >= from && start < to),
    };
  });
}
