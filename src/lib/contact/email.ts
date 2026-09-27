import { escapeHtml, singleLine } from "./sanitize";
import type { ContactInput } from "./schema";
import type { OutgoingMail } from "./types";

const SUBJECT_PREFIX = "Portfolio message from";
const SUBJECT_NAME_MAX = 60;

/** The email sent to me. It carries no IP address and no hash. */
export function buildEmail(
  input: ContactInput,
  route: { from: string; to: string },
): OutgoingMail {
  const name = singleLine(input.name).slice(0, SUBJECT_NAME_MAX);
  const text = `From: ${input.name} <${input.email}>\n\n${input.message}\n`;
  const html =
    `<p><strong>From:</strong> ${escapeHtml(input.name)} ` +
    `&lt;${escapeHtml(input.email)}&gt;</p>` +
    `<p style="white-space:pre-wrap">${escapeHtml(input.message)}</p>`;
  return {
    from: route.from,
    to: route.to,
    subject: `${SUBJECT_PREFIX} ${name}`,
    text,
    html,
    replyTo: input.email,
  };
}
