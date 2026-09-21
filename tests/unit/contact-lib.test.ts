import { describe, expect, it } from "vitest";
import { buildEmail } from "@/lib/contact/email";
import { clientIp, hashIp } from "@/lib/contact/hash";
import { multiLine, singleLine } from "@/lib/contact/sanitize";
import { validateContact } from "@/lib/contact/schema";
import { createMemoryLimiter, LIMIT, WINDOW_MS } from "@/services/ratelimit";

const good = {
  name: "Ada Lovelace",
  email: "ada@example.com",
  message: "Hello, I would like to talk about a project.",
};

describe("sanitize", () => {
  it("singleLine turns newlines, tabs and control characters into one space", () => {
    expect(singleLine("  Ada\r\nBcc: x@y.z\t\u0000Lovelace  ")).toBe(
      "Ada Bcc: x@y.z Lovelace",
    );
  });

  it("multiLine keeps line breaks, normalises CRLF and drops control characters", () => {
    expect(multiLine("one\r\ntwo\u0000\n\n\n\nthree\u0007")).toBe(
      "one\ntwo\n\nthree",
    );
  });
});

describe("validateContact", () => {
  it("accepts good input and returns cleaned values", () => {
    const result = validateContact({ ...good, name: "  Ada \n Lovelace " });
    expect(result).toEqual({ ok: true, data: good });
  });

  it("reports one code per bad field", () => {
    const result = validateContact({ name: " ", email: "nope", message: "hi" });
    expect(result).toEqual({
      ok: false,
      errors: {
        name: "nameRequired",
        email: "emailInvalid",
        message: "messageTooShort",
      },
    });
  });

  it("enforces the length limits", () => {
    const result = validateContact({
      name: "a".repeat(101),
      email: `${"a".repeat(250)}@x.io`,
      message: "m".repeat(4001),
    });
    expect(result).toEqual({
      ok: false,
      errors: {
        name: "nameTooLong",
        email: "emailInvalid",
        message: "messageTooLong",
      },
    });
  });

  it("asks for an email when it is empty", () => {
    const result = validateContact({ ...good, email: "" });
    expect(result).toMatchObject({ errors: { email: "emailRequired" } });
  });
});

describe("buildEmail", () => {
  const route = { from: "site@example.com", to: "me@example.com" };

  it("sets replyTo, a fixed subject prefix and no IP information", () => {
    const mail = buildEmail(good, route);
    expect(mail.replyTo).toBe(good.email);
    expect(mail.subject).toBe("Portfolio message from Ada Lovelace");
    expect(mail.text).toContain(good.message);
    expect(JSON.stringify(mail)).not.toMatch(/ip|hash/i);
  });

  it("cannot inject headers through the name", () => {
    const name = "Eve\r\nBcc: victim@example.com";
    const clean = validateContact({ ...good, name });
    if (!clean.ok) throw new Error("expected valid input");
    expect(buildEmail(clean.data, route).subject).not.toMatch(/[\r\n]/);
  });

  it("limits the name in the subject to 60 characters", () => {
    const mail = buildEmail({ ...good, name: "n".repeat(100) }, route);
    expect(mail.subject).toBe(`Portfolio message from ${"n".repeat(60)}`);
  });

  it("escapes HTML in the html body", () => {
    const mail = buildEmail(
      { ...good, message: '<script>alert("x")</script> & more' },
      route,
    );
    expect(mail.html).not.toContain("<script>");
    expect(mail.html).toContain("&lt;script&gt;");
    expect(mail.html).toContain("&amp; more");
  });
});

describe("hashIp and clientIp", () => {
  it("hashes with the salt, deterministically, without leaking the IP", () => {
    const a = hashIp("203.0.113.9", "salt-one");
    expect(a).toBe(hashIp("203.0.113.9", "salt-one"));
    expect(a).not.toBe(hashIp("203.0.113.9", "salt-two"));
    expect(a).toMatch(/^[0-9a-f]{64}$/);
    expect(a).not.toContain("203");
  });

  it("uses the first x-forwarded-for entry, then x-real-ip, then a label", () => {
    const from = (values: Record<string, string>) => ({
      get: (name: string) => values[name] ?? null,
    });
    expect(clientIp(from({ "x-forwarded-for": "1.1.1.1, 2.2.2.2" }))).toBe(
      "1.1.1.1",
    );
    expect(clientIp(from({ "x-real-ip": "3.3.3.3" }))).toBe("3.3.3.3");
    expect(clientIp(from({}))).toBe("unknown");
  });
});

describe("memory limiter", () => {
  it("allows five per hour per key and refuses the sixth", async () => {
    let now = 1_000_000;
    const limiter = createMemoryLimiter(() => now);
    for (let i = 0; i < LIMIT; i++) {
      expect(await limiter.allow("a")).toBe(true);
    }
    expect(await limiter.allow("a")).toBe(false);
    expect(await limiter.allow("b")).toBe(true);
    now += WINDOW_MS + 1;
    expect(await limiter.allow("a")).toBe(true);
  });
});
