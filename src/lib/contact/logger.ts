// The only logging the contact flow does. Event codes, error class names and numeric or fixed
// codes only: never error messages, names, emails, message bodies, IP addresses or env values.

export type ContactEvent =
  | "honeypot_filled"
  | "rate_limited"
  | "limiter_failed"
  | "store_failed"
  | "mail_failed"
  | "mark_notified_failed"
  | "not_configured";

export type ErrorDetail = {
  errorName: string;
  /** HTTP status from Resend or from Neon's HTTP endpoint. */
  status?: number;
  /** Postgres SQLSTATE, e.g. "23505". */
  sqlState?: string;
};

export type ContactLog = (
  event: ContactEvent,
  detail?: ErrorDetail | { missing: readonly string[] },
) => void;

export const logContact: ContactLog = (event, detail) => {
  console.error(JSON.stringify({ scope: "contact", event, ...detail }));
};

/**
 * What can safely be logged about a failure. Drizzle wraps driver errors in an error whose
 * message holds the query parameters (the visitor's name, email and message), so the cause is
 * read instead, and no message text is ever taken, except the digits of Neon's HTTP status.
 */
export function errorDetail(error: unknown): ErrorDetail {
  const root =
    error instanceof Error && error.cause instanceof Error
      ? error.cause
      : error;
  if (!(root instanceof Error)) return { errorName: "UnknownError" };

  const detail: ErrorDetail = { errorName: root.name };
  const fields = root as Error & { statusCode?: unknown; code?: unknown };
  if (typeof fields.statusCode === "number") detail.status = fields.statusCode;
  if (typeof fields.code === "string" && /^[0-9A-Z]{5}$/.test(fields.code)) {
    detail.sqlState = fields.code;
  }
  const neonStatus = /^Server error \(HTTP status (\d{3})\)/.exec(root.message);
  if (root.name === "NeonDbError" && neonStatus?.[1]) {
    detail.status = Number(neonStatus[1]);
  }
  return detail;
}
