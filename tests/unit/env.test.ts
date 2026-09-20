import { describe, expect, it } from "vitest";
import { parseEnv } from "@/env";

describe("parseEnv", () => {
  it("defaults the site URL and leaves optional vars unset", () => {
    const env = parseEnv({});
    expect(env.NEXT_PUBLIC_SITE_URL).toBe("http://localhost:3000");
    expect(env.DATABASE_URL).toBeUndefined();
  });

  it("treats empty strings as unset", () => {
    const env = parseEnv({ CONTACT_TO_EMAIL: "", NEXT_PUBLIC_SITE_URL: "" });
    expect(env.CONTACT_TO_EMAIL).toBeUndefined();
    expect(env.NEXT_PUBLIC_SITE_URL).toBe("http://localhost:3000");
  });

  it("throws a readable error for invalid values", () => {
    expect(() => parseEnv({ CONTACT_TO_EMAIL: "not-an-email" })).toThrow(
      /CONTACT_TO_EMAIL/,
    );
  });
});
