import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const envMock = vi.hoisted(() => ({ value: {} as Record<string, unknown> }));
vi.mock("@/env", () => ({
  get env() {
    return envMock.value;
  },
}));

// What the Resend SDK resolves with; each test sets it.
const resendMock = vi.hoisted(() => ({ result: {} as unknown }));
vi.mock("resend", () => ({
  Resend: class {
    emails = { send: async () => resendMock.result };
  },
}));

vi.mock("next/headers", () => ({
  headers: async () => new Headers({ "x-forwarded-for": "203.0.113.9" }),
}));

import { submitContact } from "@/lib/contact/actions";
import { initialContactState } from "@/lib/contact/state";
import { handleSubmission } from "@/lib/contact/submit";
import { getContactServices } from "@/services/contact";
import { createResendMailer } from "@/services/mailer";

const full = {
  DATABASE_URL: "postgres://u:secret-pw@db.example/x",
  RESEND_API_KEY: "re_secret_key",
  IP_HASH_SALT: "salt",
  CONTACT_TO_EMAIL: "me@example.com",
  CONTACT_FROM_EMAIL: "site@example.com",
  UPSTASH_REDIS_REST_URL: "https://redis.example",
  UPSTASH_REDIS_REST_TOKEN: "redis-secret-token",
};

beforeEach(() => {
  envMock.value = {};
});

describe("getContactServices", () => {
  it("names every missing variable and never a value", () => {
    envMock.value = { VERCEL_ENV: "production" };
    const result = getContactServices();
    expect(result).toEqual({
      ok: false,
      missing: [
        "DATABASE_URL",
        "RESEND_API_KEY",
        "IP_HASH_SALT",
        "CONTACT_TO_EMAIL",
        "CONTACT_FROM_EMAIL",
        "UPSTASH_REDIS_REST_URL",
        "UPSTASH_REDIS_REST_TOKEN",
      ],
    });
  });

  it("requires Upstash in production", () => {
    const { UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN, ...rest } = full;
    void UPSTASH_REDIS_REST_URL;
    void UPSTASH_REDIS_REST_TOKEN;
    envMock.value = { ...rest, VERCEL_ENV: "production" };
    expect(getContactServices()).toEqual({
      ok: false,
      missing: ["UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN"],
    });
  });

  it("falls back to the in-process limiter outside production", () => {
    const { UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN, ...rest } = full;
    void UPSTASH_REDIS_REST_URL;
    void UPSTASH_REDIS_REST_TOKEN;
    envMock.value = { ...rest, VERCEL_ENV: "preview" };
    expect(getContactServices().ok).toBe(true);
  });

  it("is ready with every variable set", () => {
    envMock.value = { ...full, VERCEL_ENV: "production" };
    expect(getContactServices().ok).toBe(true);
  });

  it("uses fakes, with no other variables, when E2E_FAKE_SERVICES=1", () => {
    envMock.value = { E2E_FAKE_SERVICES: "1" };
    expect(getContactServices().ok).toBe(true);
  });

  it("does not use fakes just because the other variables are missing", () => {
    envMock.value = {};
    expect(getContactServices().ok).toBe(false);
  });
});

describe("production fails closed on the rate limiter", () => {
  const input = {
    name: "Ada Lovelace",
    email: "ada@example.com",
    message: "Hello, I would like to talk about a project.",
    honeypot: "",
    ip: "203.0.113.9",
  };

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("Upstash missing: the form answers 'unavailable' and names only the variables", async () => {
    const { UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN, ...rest } = full;
    void UPSTASH_REDIS_REST_URL;
    void UPSTASH_REDIS_REST_TOKEN;
    envMock.value = { ...rest, VERCEL_ENV: "production" };
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const form = new FormData();
    form.set("name", input.name);
    form.set("email", input.email);
    form.set("message", input.message);

    const state = await submitContact(initialContactState, form);

    expect(state).toMatchObject({ status: "error", kind: "unavailable" });
    expect(JSON.parse(String(error.mock.calls[0]?.[0]))).toEqual({
      scope: "contact",
      event: "not_configured",
      missing: ["UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN"],
    });
  });

  // The real Upstash client, with fetch replaced. Fake timers skip its retry back-off.
  async function submitWithUpstash(fetch: () => Promise<Response>) {
    vi.useFakeTimers();
    vi.stubGlobal("fetch", vi.fn(fetch));
    envMock.value = { ...full, VERCEL_ENV: "production" };
    const services = getContactServices();
    if (!services.ok) throw new Error("expected every variable to be set");
    const log = vi.fn();
    const insert = vi.fn(async () => "id");
    const pending = handleSubmission(
      {
        ...services.deps,
        log,
        store: { insert, markNotified: async () => {} },
      },
      input,
    );
    await vi.advanceTimersByTimeAsync(60_000);
    return { state: await pending, log, insert };
  }

  it("Upstash throwing: the form answers 'unavailable' and stores nothing", async () => {
    const { state, log, insert } = await submitWithUpstash(async () => {
      throw new TypeError("fetch failed");
    });
    expect(state).toMatchObject({ status: "error", kind: "unavailable" });
    expect(insert).not.toHaveBeenCalled();
    expect(log).toHaveBeenCalledWith("limiter_failed", expect.any(Object));
  });

  it("Upstash not answering: its 'allowed on timeout' answer is refused", async () => {
    const { state, log, insert } = await submitWithUpstash(
      () => new Promise<Response>(() => {}),
    );
    expect(state).toMatchObject({ status: "error", kind: "unavailable" });
    expect(insert).not.toHaveBeenCalled();
    expect(log).toHaveBeenCalledWith("limiter_failed", {
      errorName: "RatelimitTimeout",
    });
  });
});

describe("createResendMailer", () => {
  const mail = {
    from: "site@example.com",
    to: "me@example.com",
    subject: "Portfolio message from Ada",
    text: "Hi",
    html: "<p>Hi</p>",
    replyTo: "ada@example.com",
  };

  it("resolves when Resend accepts the email", async () => {
    resendMock.result = { data: { id: "email-1" }, error: null };
    await expect(createResendMailer("re_key").send(mail)).resolves.toBe(
      undefined,
    );
  });

  it("throws with Resend's fixed error name and HTTP status, not its message", async () => {
    resendMock.result = {
      data: null,
      error: {
        name: "validation_error",
        statusCode: 422,
        message: "Invalid `to` field: ada@example.com",
      },
    };
    const failure = await createResendMailer("re_key")
      .send(mail)
      .catch((error: unknown) => error);
    expect(failure).toBeInstanceOf(Error);
    expect(failure).toMatchObject({
      name: "Resend_validation_error",
      statusCode: 422,
    });
    expect(String((failure as Error).message)).not.toContain("ada@");
  });
});
