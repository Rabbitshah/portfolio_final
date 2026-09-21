import { beforeEach, describe, expect, it, vi } from "vitest";

const envMock = vi.hoisted(() => ({ value: {} as Record<string, unknown> }));
vi.mock("@/env", () => ({
  get env() {
    return envMock.value;
  },
}));

import { getContactServices } from "@/services/contact";

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
