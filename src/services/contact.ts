import { env } from "@/env";
import type { SubmissionDeps } from "@/lib/contact/submit";
import { logContact } from "@/lib/contact/logger";
import { createMessageStore } from "./db";
import { createFakeMailer, createFakeStore } from "./fakes";
import { createResendMailer } from "./mailer";
import { createMemoryLimiter, createUpstashLimiter } from "./ratelimit";

export type ContactServices =
  { ok: true; deps: SubmissionDeps } | { ok: false; missing: string[] };

// Kept across requests in one server process so the fake and memory limiters remember callers.
let fakeLimiter: ReturnType<typeof createMemoryLimiter> | undefined;

/**
 * Builds the services the contact form needs from the validated environment.
 * Checked on each submission, not at startup, so `next build` and the rest of the site work
 * without these variables. Only variable NAMES are ever reported, never values.
 */
export function getContactServices(): ContactServices {
  const salt = env.IP_HASH_SALT;
  const to = env.CONTACT_TO_EMAIL;
  const from = env.CONTACT_FROM_EMAIL;

  if (env.E2E_FAKE_SERVICES === "1") {
    fakeLimiter ??= createMemoryLimiter();
    return {
      ok: true,
      deps: {
        store: createFakeStore(),
        limiter: fakeLimiter,
        mailer: createFakeMailer(),
        log: logContact,
        salt: salt ?? "e2e-salt",
        to: to ?? "owner@example.test",
        from: from ?? "site@example.test",
      },
    };
  }

  const missing: string[] = [];
  const need = (name: string, value: string | undefined): string => {
    if (!value) missing.push(name);
    return value ?? "";
  };
  const databaseUrl = need("DATABASE_URL", env.DATABASE_URL);
  const apiKey = need("RESEND_API_KEY", env.RESEND_API_KEY);
  const saltValue = need("IP_HASH_SALT", salt);
  const toValue = need("CONTACT_TO_EMAIL", to);
  const fromValue = need("CONTACT_FROM_EMAIL", from);
  const redisUrl = env.UPSTASH_REDIS_REST_URL;
  const redisToken = env.UPSTASH_REDIS_REST_TOKEN;
  // Outside production a missing Upstash falls back to the in-process limiter. In production
  // it is required: without it the form is closed rather than left unlimited.
  const limiterOptional = env.VERCEL_ENV !== "production";
  if (!limiterOptional) {
    need("UPSTASH_REDIS_REST_URL", redisUrl);
    need("UPSTASH_REDIS_REST_TOKEN", redisToken);
  }
  if (missing.length > 0) return { ok: false, missing };

  let limiter;
  if (redisUrl && redisToken) {
    limiter = createUpstashLimiter(redisUrl, redisToken);
  } else {
    fakeLimiter ??= createMemoryLimiter();
    limiter = fakeLimiter;
  }
  return {
    ok: true,
    deps: {
      store: createMessageStore(databaseUrl),
      limiter,
      mailer: createResendMailer(apiKey),
      log: logContact,
      salt: saltValue,
      to: toValue,
      from: fromValue,
    },
  };
}
