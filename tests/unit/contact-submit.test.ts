import { NeonDbError } from "@neondatabase/serverless";
import { DrizzleQueryError } from "drizzle-orm";
import { afterEach, describe, expect, it, vi } from "vitest";
import { logContact, type ContactEvent } from "@/lib/contact/logger";
import {
  handleSubmission,
  type Submission,
  type SubmissionDeps,
} from "@/lib/contact/submit";
import type { OutgoingMail } from "@/lib/contact/types";

const submission: Submission = {
  name: "Ada Lovelace",
  email: "ada@example.com",
  message: "Hello, I would like to talk about a project.",
  honeypot: "",
  ip: "203.0.113.9",
};

type Calls = {
  inserted: object[];
  notified: string[];
  sent: OutgoingMail[];
  limited: string[];
  events: ContactEvent[];
};

function setup(overrides: Partial<SubmissionDeps> = {}) {
  const calls: Calls = {
    inserted: [],
    notified: [],
    sent: [],
    limited: [],
    events: [],
  };
  const deps: SubmissionDeps = {
    store: {
      async insert(message) {
        calls.inserted.push(message);
        return "id-1";
      },
      async markNotified(id) {
        calls.notified.push(id);
      },
    },
    limiter: {
      async allow(key) {
        calls.limited.push(key);
        return true;
      },
    },
    mailer: {
      async send(mail) {
        calls.sent.push(mail);
      },
    },
    log: (event) => calls.events.push(event),
    salt: "test-salt",
    to: "me@example.com",
    from: "site@example.com",
    ...overrides,
  };
  return { deps, calls };
}

describe("handleSubmission", () => {
  it("stores, emails and marks a good message as notified", async () => {
    const { deps, calls } = setup();
    const state = await handleSubmission(deps, submission);
    expect(state).toEqual({ status: "success" });
    expect(calls.inserted).toHaveLength(1);
    expect(calls.inserted[0]).toMatchObject({
      name: "Ada Lovelace",
      email: "ada@example.com",
      body: submission.message,
    });
    expect(calls.sent).toHaveLength(1);
    expect(calls.sent[0]?.to).toBe("me@example.com");
    expect(calls.notified).toEqual(["id-1"]);
  });

  it("stores only a hash of the IP, and rate limits on the same hash", async () => {
    const { deps, calls } = setup();
    await handleSubmission(deps, submission);
    const stored = calls.inserted[0] as { ipHash: string };
    expect(stored.ipHash).toMatch(/^[0-9a-f]{64}$/);
    expect(JSON.stringify(calls.inserted)).not.toContain(submission.ip);
    expect(calls.limited).toEqual([stored.ipHash]);
  });

  it("honeypot: says success but stores, emails and limits nothing", async () => {
    const { deps, calls } = setup();
    const state = await handleSubmission(deps, {
      ...submission,
      honeypot: "https://spam.example",
    });
    expect(state).toEqual({ status: "success" });
    expect(calls.inserted).toEqual([]);
    expect(calls.sent).toEqual([]);
    expect(calls.limited).toEqual([]);
    expect(calls.events).toEqual(["honeypot_filled"]);
  });

  it("invalid input: returns field errors and the typed values, touches nothing", async () => {
    const { deps, calls } = setup();
    const state = await handleSubmission(deps, {
      ...submission,
      email: "nope",
      message: "short",
    });
    expect(state).toEqual({
      status: "error",
      kind: "invalid",
      fieldErrors: { email: "emailInvalid", message: "messageTooShort" },
      values: { name: "Ada Lovelace", email: "nope", message: "short" },
    });
    expect(calls.inserted).toEqual([]);
    expect(calls.limited).toEqual([]);
  });

  it("over the limit: refuses and stores nothing", async () => {
    const { deps, calls } = setup({
      limiter: { allow: async () => false },
    });
    const state = await handleSubmission(deps, submission);
    expect(state).toMatchObject({ status: "error", kind: "limited" });
    expect(calls.inserted).toEqual([]);
    expect(calls.sent).toEqual([]);
    expect(calls.events).toEqual(["rate_limited"]);
  });

  it("limiter unreachable: fails closed, stores nothing", async () => {
    const { deps, calls } = setup({
      limiter: {
        allow: async () => {
          throw new Error("network down");
        },
      },
    });
    const state = await handleSubmission(deps, submission);
    expect(state).toMatchObject({ status: "error", kind: "unavailable" });
    expect(calls.inserted).toEqual([]);
    expect(calls.events).toEqual(["limiter_failed"]);
  });

  it("store fails: friendly error, no email", async () => {
    const { deps, calls } = setup({
      store: {
        insert: async () => {
          throw new Error("db down");
        },
        markNotified: async () => {},
      },
    });
    const state = await handleSubmission(deps, submission);
    expect(state).toMatchObject({ status: "error", kind: "failed" });
    expect(calls.sent).toEqual([]);
    expect(calls.events).toEqual(["store_failed"]);
  });

  it("email fails: sender sees success, row stays un-notified", async () => {
    const { deps, calls } = setup({
      mailer: {
        send: async () => {
          throw new Error("resend down");
        },
      },
    });
    const state = await handleSubmission(deps, submission);
    expect(state).toEqual({ status: "success" });
    expect(calls.inserted).toHaveLength(1);
    expect(calls.notified).toEqual([]);
    expect(calls.events).toEqual(["mail_failed"]);
  });

  it("marking as notified fails: still success, logged", async () => {
    const { deps, calls } = setup({
      store: {
        insert: async () => "id-1",
        markNotified: async () => {
          throw new Error("db blip");
        },
      },
    });
    const state = await handleSubmission(deps, submission);
    expect(state).toEqual({ status: "success" });
    expect(calls.events).toEqual(["mark_notified_failed"]);
  });
});

describe("console capture", () => {
  afterEach(() => vi.restoreAllMocks());

  it("no console output during any path contains a name, email, message, IP, salt or env value", async () => {
    const secrets = {
      name: "Zebulon Quimby",
      email: "zebulon.quimby@example.org",
      message: "The quick brown fox needs a quote by Friday.",
      ip: "198.51.100.77",
      salt: "salt-value-9f3a1c",
      env: "postgres://user:hunter2@db.example/neon",
    };
    const spies = (["log", "info", "warn", "error", "debug"] as const).map(
      (method) => vi.spyOn(console, method).mockImplementation(() => {}),
    );

    const failing = (message: string) => () => {
      // Errors that carry secrets in their message, as real drivers sometimes do.
      throw new Error(`${message} ${secrets.env} ${secrets.email}`);
    };
    const input: Submission = {
      name: secrets.name,
      email: secrets.email,
      message: secrets.message,
      honeypot: "",
      ip: secrets.ip,
    };
    const base = setup().deps;
    const paths: SubmissionDeps[] = [
      { ...base, log: logContact },
      { ...base, log: logContact, limiter: { allow: async () => false } },
      { ...base, log: logContact, limiter: { allow: failing("limiter") } },
      {
        ...base,
        log: logContact,
        store: { insert: failing("store"), markNotified: async () => {} },
      },
      { ...base, log: logContact, mailer: { send: failing("mail") } },
      {
        ...base,
        log: logContact,
        store: { insert: async () => "id", markNotified: failing("mark") },
      },
    ].map((deps) => ({ ...deps, salt: secrets.salt }));

    for (const deps of paths) await handleSubmission(deps, input);
    await handleSubmission(paths[0]!, { ...input, honeypot: "bot" });
    await handleSubmission(paths[0]!, { ...input, email: "invalid" });

    const output = spies
      .flatMap((spy) => spy.mock.calls)
      .map((args) => args.map(String).join(" "))
      .join("\n");
    expect(output).not.toBe("");
    for (const value of Object.values(secrets)) {
      expect(output).not.toContain(value);
    }
    expect(output).not.toContain("hunter2");
  });

  it("each failure logs a fixed event, the error class and a status or SQLSTATE, never text", async () => {
    const secret = "zebulon.quimby@example.org";
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    // The shapes the real services throw. Drizzle puts the query parameters in its message.
    const wrapped = (cause: Error) =>
      new DrizzleQueryError("insert into messages ...", [secret], cause);
    const sqlError = Object.assign(new NeonDbError(`duplicate ${secret}`), {
      code: "23505",
    });
    const httpError = new NeonDbError(
      `Server error (HTTP status 503): ${secret}`,
    );
    const resendError = Object.assign(new Error("Resend rejected the email"), {
      name: "Resend_rate_limit_exceeded",
      statusCode: 429,
    });
    const timeout = Object.assign(new Error("Upstash did not answer in time"), {
      name: "RatelimitTimeout",
    });
    const throws = (value: Error) => async () => {
      throw value;
    };

    const base = { ...setup().deps, log: logContact };
    const cases: [SubmissionDeps, object][] = [
      [
        { ...base, limiter: { allow: throws(timeout) } },
        { event: "limiter_failed", errorName: "RatelimitTimeout" },
      ],
      [
        { ...base, limiter: { allow: throws(new TypeError(secret)) } },
        { event: "limiter_failed", errorName: "TypeError" },
      ],
      [
        {
          ...base,
          store: {
            insert: throws(wrapped(sqlError)),
            markNotified: async () => {},
          },
        },
        { event: "store_failed", errorName: "NeonDbError", sqlState: "23505" },
      ],
      [
        {
          ...base,
          store: {
            insert: throws(wrapped(httpError)),
            markNotified: async () => {},
          },
        },
        { event: "store_failed", errorName: "NeonDbError", status: 503 },
      ],
      [
        { ...base, mailer: { send: throws(resendError) } },
        {
          event: "mail_failed",
          errorName: "Resend_rate_limit_exceeded",
          status: 429,
        },
      ],
      [
        {
          ...base,
          store: {
            insert: async () => "id",
            markNotified: throws(wrapped(sqlError)),
          },
        },
        {
          event: "mark_notified_failed",
          errorName: "NeonDbError",
          sqlState: "23505",
        },
      ],
    ];

    for (const [deps, expected] of cases) {
      error.mockClear();
      await handleSubmission(deps, submission);
      expect(error).toHaveBeenCalledTimes(1);
      const line = String(error.mock.calls[0]?.[0]);
      expect(JSON.parse(line)).toEqual({ scope: "contact", ...expected });
      expect(line).not.toContain(secret);
    }
  });
});
