import { buildEmail } from "./email";
import { hashIp } from "./hash";
import { errorName, type ContactLog } from "./logger";
import { validateContact, type ContactInput, type FieldErrors } from "./schema";
import type { Mailer, MessageStore, SubmissionLimiter } from "./types";

export type ContactState =
  | { status: "idle" }
  | { status: "success" }
  | {
      status: "error";
      kind: "invalid";
      fieldErrors: FieldErrors;
      values: ContactInput;
    }
  | {
      status: "error";
      kind: "failed" | "unavailable" | "limited";
      values: ContactInput;
    };

export const initialContactState: ContactState = { status: "idle" };

export type SubmissionDeps = {
  store: MessageStore;
  limiter: SubmissionLimiter;
  mailer: Mailer;
  log: ContactLog;
  salt: string;
  to: string;
  from: string;
};

export type Submission = ContactInput & {
  /** The hidden field. Real people leave it empty. */
  honeypot: string;
  ip: string;
};

/**
 * Honeypot, validate, rate limit, store, email, mark as notified.
 * Fails closed: if the limiter cannot be reached the message is not accepted.
 * If the email fails after the message is stored, the sender still sees success and
 * `notified_at` stays null so the message can be found and answered.
 */
export async function handleSubmission(
  deps: SubmissionDeps,
  submission: Submission,
): Promise<ContactState> {
  const { honeypot, ip, ...raw } = submission;

  // Bots get the same answer as people, and nothing is stored or sent.
  if (honeypot.trim() !== "") {
    deps.log("honeypot_filled");
    return { status: "success" };
  }

  const checked = validateContact(raw);
  if (!checked.ok) {
    return {
      status: "error",
      kind: "invalid",
      fieldErrors: checked.errors,
      values: raw,
    };
  }
  const values = checked.data;

  const ipHash = hashIp(ip, deps.salt);

  try {
    if (!(await deps.limiter.allow(ipHash))) {
      deps.log("rate_limited");
      return { status: "error", kind: "limited", values };
    }
  } catch (error) {
    deps.log("limiter_failed", { errorName: errorName(error) });
    return { status: "error", kind: "unavailable", values };
  }

  let id: string;
  try {
    id = await deps.store.insert({
      name: values.name,
      email: values.email,
      body: values.message,
      ipHash,
    });
  } catch (error) {
    deps.log("store_failed", { errorName: errorName(error) });
    return { status: "error", kind: "failed", values };
  }

  try {
    await deps.mailer.send(
      buildEmail(values, { from: deps.from, to: deps.to }),
    );
  } catch (error) {
    deps.log("mail_failed", { errorName: errorName(error) });
    return { status: "success" };
  }

  try {
    await deps.store.markNotified(id);
  } catch (error) {
    deps.log("mark_notified_failed", { errorName: errorName(error) });
  }
  return { status: "success" };
}
