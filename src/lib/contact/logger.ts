// The only logging the contact flow does. Event codes and error class names only: never names,
// emails, message bodies, IP addresses or environment values.

export type ContactEvent =
  | "honeypot_filled"
  | "rate_limited"
  | "limiter_failed"
  | "store_failed"
  | "mail_failed"
  | "mark_notified_failed"
  | "not_configured";

export type ContactLog = (
  event: ContactEvent,
  detail?: { errorName?: string; missing?: readonly string[] },
) => void;

export const logContact: ContactLog = (event, detail) => {
  console.error(JSON.stringify({ scope: "contact", event, ...detail }));
};

export function errorName(error: unknown): string {
  return error instanceof Error ? error.name : "UnknownError";
}
