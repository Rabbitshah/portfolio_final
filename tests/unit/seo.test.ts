import { describe, expect, it } from "vitest";
import { site } from "@/lib/content";
import { headlineUnits, headlineWords, splitHeadline } from "@/lib/headline";
import {
  buildMetadata,
  buildRobots,
  buildSitemap,
  ogContent,
  personJsonLd,
  resolveSiteUrl,
  robotsMetadata,
  serializeJsonLd,
} from "@/lib/seo";

const URL_ = "https://example.com";

describe("when the site is NOT indexable (the default)", () => {
  it("sets noindex and nofollow in the metadata", () => {
    expect(robotsMetadata(false)).toEqual({ index: false, follow: false });
    expect(buildMetadata(site, URL_, false).robots).toEqual({
      index: false,
      follow: false,
    });
  });

  it("disallows everything in robots.txt and lists nothing in the sitemap", () => {
    expect(buildRobots(false, URL_)).toEqual({
      rules: { userAgent: "*", disallow: "/" },
    });
    expect(buildSitemap(false, URL_)).toEqual([]);
  });
});

describe("when the site IS indexable", () => {
  it("has no noindex in the metadata", () => {
    expect(robotsMetadata(true)).toBeUndefined();
    expect(buildMetadata(site, URL_, true).robots).toBeUndefined();
  });

  it("allows everything in robots.txt and lists / in the sitemap", () => {
    expect(buildRobots(true, URL_)).toEqual({
      rules: { userAgent: "*", allow: "/" },
      sitemap: "https://example.com/sitemap.xml",
    });
    expect(buildSitemap(true, URL_)).toEqual([{ url: "https://example.com/" }]);
  });
});

describe("metadata is the same in both states apart from robots", () => {
  it("emits title, description, canonical, Open Graph and Twitter tags", () => {
    const on = buildMetadata(site, URL_, true);
    const off = buildMetadata(site, URL_, false);
    expect({ ...on, robots: undefined }).toEqual({
      ...off,
      robots: undefined,
    });
    expect(on.title).toBe("Maanav Shah — Full-stack engineer");
    expect(on.description).toBe(site.intro);
    expect(on.alternates).toEqual({ canonical: "/" });
    expect(on.openGraph).toMatchObject({
      type: "website",
      siteName: site.name,
    });
    expect(on.twitter).toMatchObject({ card: "summary_large_image" });
    expect(String(on.metadataBase)).toBe("https://example.com/");
  });
});

describe("resolveSiteUrl", () => {
  it("prefers NEXT_PUBLIC_SITE_URL and drops a trailing slash", () => {
    expect(
      resolveSiteUrl({
        NEXT_PUBLIC_SITE_URL: "https://me.dev/",
        VERCEL_ENV: "production",
        VERCEL_PROJECT_PRODUCTION_URL: "other.vercel.app",
      }),
    ).toBe("https://me.dev");
  });

  it("uses the production domain on Vercel production, with https added", () => {
    expect(
      resolveSiteUrl({
        VERCEL_ENV: "production",
        VERCEL_PROJECT_PRODUCTION_URL: "me.dev",
        VERCEL_URL: "site-abc123.vercel.app",
      }),
    ).toBe("https://me.dev");
  });

  it("uses the deployment URL on previews, with https added", () => {
    expect(
      resolveSiteUrl({
        VERCEL_ENV: "preview",
        VERCEL_PROJECT_PRODUCTION_URL: "me.dev",
        VERCEL_URL: "site-git-branch.vercel.app",
      }),
    ).toBe("https://site-git-branch.vercel.app");
  });

  it("falls back to localhost", () => {
    expect(resolveSiteUrl({})).toBe("http://localhost:3000");
  });
});

describe("employer details stay out of metadata, Open Graph and JSON-LD", () => {
  const forbidden = /praverse|worksFor|nexgen/i;

  it("JSON-LD is a Person with only name, job title, address and profiles", () => {
    const data = personJsonLd(site);
    expect(Object.keys(data).sort()).toEqual(
      ["@context", "@type", "address", "jobTitle", "name", "sameAs"].sort(),
    );
    expect(data["@type"]).toBe("Person");
    expect(data.jobTitle).toBe(site.role);
    expect(data.sameAs).toEqual([site.links.github, site.links.linkedin]);
    expect(serializeJsonLd(data)).not.toMatch(forbidden);
  });

  it("all meta tags are free of employer details", () => {
    expect(JSON.stringify(buildMetadata(site, URL_, false))).not.toMatch(
      forbidden,
    );
    expect(JSON.stringify(buildMetadata(site, URL_, true))).not.toMatch(
      forbidden,
    );
  });

  it("the Open Graph image draws only the name, role and headline", () => {
    const content = ogContent(site);
    expect(Object.keys(content).sort()).toEqual(["headline", "name", "role"]);
    expect(JSON.stringify(content)).not.toMatch(forbidden);
  });

  it('escapes "<" in JSON-LD so it cannot close the script tag', () => {
    expect(serializeJsonLd({ name: "</script><b>" })).not.toContain(
      "</script>",
    );
  });
});

describe("headline helpers", () => {
  it("splitHeadline runs concatenate back to the exact headline", () => {
    const runs = splitHeadline(site.headline);
    expect(runs.map((run) => run.text).join("")).toBe(site.headline);
    expect(runs.filter((run) => run.emphasized).map((run) => run.text)).toEqual(
      ["ship", "hold up."],
    );
  });

  it("headlineWords marks the emphasized words", () => {
    const words = headlineWords(site.headline);
    expect(words.map((entry) => entry.word).join(" ")).toBe(site.headline);
    expect(
      words.filter((entry) => entry.emphasized).map((entry) => entry.word),
    ).toEqual(["ship,", "hold", "up."]);
  });

  it("headlineUnits: words joined by a space equal the headline", () => {
    const units = headlineUnits(site.headline);
    const words = units.flatMap((unit) =>
      unit.words.map((word) => word.map((segment) => segment.text).join("")),
    );
    expect(words.join(" ")).toBe(site.headline);
  });

  it('headlineUnits: the comma stays with its word, plain, and "hold up." is one phrase', () => {
    const units = headlineUnits(site.headline);
    const ship = units.find((unit) => unit.words[0]?.[0]?.text === "ship");
    expect(ship?.phrase).toBe(false);
    expect(ship?.words[0]).toEqual([
      { text: "ship", emphasized: true },
      { text: ",", emphasized: false },
    ]);
    const phrase = units.find((unit) => unit.phrase);
    expect(
      phrase?.words.map((word) => word.map((segment) => segment.text).join("")),
    ).toEqual(["hold", "up."]);
    expect(units.filter((unit) => unit.phrase)).toHaveLength(1);
  });
});
