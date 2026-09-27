// U+2028 and U+2029 are built from char codes so no invisible separator sits in this file.
const SEPARATORS = String.fromCharCode(0x2028, 0x2029);

// Control characters except tab and newline. Applied after CRLF is turned into \n.
const CONTROL = new RegExp(
  `[\\x00-\\x08\\x0B-\\x1F\\x7F-\\x9F${SEPARATORS}]`,
  "g",
);
// Everything that counts as whitespace or a control character, newlines included.
const BLANKS = new RegExp(`[\\s\\x00-\\x1F\\x7F-\\x9F${SEPARATORS}]+`, "g");

/** One line: every run of whitespace or control characters becomes a single space. */
export function singleLine(value: string): string {
  return value.replace(BLANKS, " ").trim();
}

/** Keeps line breaks and tabs, drops other control characters, trims the ends. */
export function multiLine(value: string): string {
  return value
    .replace(/\r\n?/g, "\n")
    .replace(CONTROL, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
