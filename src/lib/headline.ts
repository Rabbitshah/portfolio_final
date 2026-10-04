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

export type HeadlineSegment = { text: string; emphasized: boolean };
/** One whitespace-free word, in pieces by emphasis: "ship," is [ship (emphasized), "," (plain)]. */
export type HeadlineWord = HeadlineSegment[];
/**
 * Either one word, or a run of words that are all emphasized (`phrase`), such as "hold up.",
 * which has to stay together on one line. Two emphasized phrases with only a space between
 * them would merge into one unit; the current headline has none.
 */
export type HeadlineUnit = { phrase: boolean; words: HeadlineWord[] };

/** The headline as words, grouped into units. Joined with single spaces, the words equal the text. */
export function headlineUnits(text: string): HeadlineUnit[] {
  const words: HeadlineWord[] = [];
  let current: HeadlineWord | null = null;
  for (const run of splitHeadline(text)) {
    for (const char of run.text) {
      if (/\s/.test(char)) {
        current = null;
        continue;
      }
      if (!current) {
        current = [];
        words.push(current);
      }
      const last = current[current.length - 1];
      if (last && last.emphasized === run.emphasized) last.text += char;
      else current.push({ text: char, emphasized: run.emphasized });
    }
  }
  const units: HeadlineUnit[] = [];
  for (const word of words) {
    const allEmphasized = word.every((segment) => segment.emphasized);
    const previous = units[units.length - 1];
    if (allEmphasized && previous?.phrase) previous.words.push(word);
    else units.push({ phrase: allEmphasized, words: [word] });
  }
  return units;
}
