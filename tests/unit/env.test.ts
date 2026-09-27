import { describe, expect, it } from "vitest";
import { parseEnv } from "@/env";

describe("parseEnv", () => {
  it("leaves optional vars unset and does not invent a site URL", () => {
    const env = parseEnv({});
    expect(env.NEXT_PUBLIC_SITE_URL).toBeUndefined();
    expect(env.DATABASE_URL).toBeUndefined();
  });

  it("treats empty strings as unset", () => {
    const env = parseEnv({ CONTACT_TO_EMAIL: "", NEXT_PUBLIC_SITE_URL: "" });
    expect(env.CONTACT_TO_EMAIL).toBeUndefined();
    expect(env.NEXT_PUBLIC_SITE_URL).toBeUndefined();
  });

  it("throws a readable error for invalid values", () => {
    expect(() => parseEnv({ CONTACT_TO_EMAIL: "not-an-email" })).toThrow(
      /CONTACT_TO_EMAIL/,
    );
  });

  it("keeps the site out of search engines unless SITE_INDEXABLE is exactly true", () => {
    expect(parseEnv({}).SITE_INDEXABLE).toBe(false);
    expect(parseEnv({ SITE_INDEXABLE: "" }).SITE_INDEXABLE).toBe(false);
    expect(parseEnv({ SITE_INDEXABLE: "false" }).SITE_INDEXABLE).toBe(false);
    expect(parseEnv({ SITE_INDEXABLE: "true" }).SITE_INDEXABLE).toBe(true);
  });

  it("rejects an unexpected SITE_INDEXABLE value instead of guessing", () => {
    expect(() => parseEnv({ SITE_INDEXABLE: "yes" })).toThrow(/SITE_INDEXABLE/);
  });

  it("accepts E2E_FAKE_SERVICES=1 outside production", () => {
    expect(parseEnv({ E2E_FAKE_SERVICES: "1" }).E2E_FAKE_SERVICES).toBe("1");
    expect(
      parseEnv({ E2E_FAKE_SERVICES: "1", VERCEL_ENV: "preview" })
        .E2E_FAKE_SERVICES,
    ).toBe("1");
  });

  it("refuses E2E_FAKE_SERVICES=1 on Vercel production", () => {
    expect(() =>
      parseEnv({ E2E_FAKE_SERVICES: "1", VERCEL_ENV: "production" }),
    ).toThrow(/E2E_FAKE_SERVICES/);
  });

  it("rejects any other E2E_FAKE_SERVICES value", () => {
    expect(() => parseEnv({ E2E_FAKE_SERVICES: "true" })).toThrow(
      /E2E_FAKE_SERVICES/,
    );
  });
});
