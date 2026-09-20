import { expect, test } from "@playwright/test";

// These run against the production build with SITE_INDEXABLE unset, so the site is noindex.
// The indexable state is covered by unit tests (tests/unit/seo.test.ts).
const employerDetails = /praverse|worksfor|nexgen/i;

test("the head has the title, description, canonical, Open Graph and Twitter tags", async ({
  page,
}) => {
  await page.goto("/");
  const meta = (selector: string) =>
    page.locator(selector).first().getAttribute("content");

  await expect(page).toHaveTitle("Maanav Shah — Full-stack engineer");
  expect(await meta('meta[name="description"]')).toContain(
    "Recent CS graduate",
  );
  expect(await meta('meta[name="robots"]')).toBe("noindex, nofollow");
  await expect(page.locator('link[rel="canonical"]')).toHaveCount(1);

  expect(await meta('meta[property="og:title"]')).toBe(
    "Maanav Shah — Full-stack engineer",
  );
  expect(await meta('meta[property="og:type"]')).toBe("website");
  expect(await meta('meta[property="og:image"]')).toContain("/opengraph-image");
  expect(await meta('meta[property="og:image:width"]')).toBe("1200");
  expect(await meta('meta[name="twitter:card"]')).toBe("summary_large_image");
  expect(await meta('meta[name="twitter:image"]')).toContain("/twitter-image");
});

test("JSON-LD is a Person and no tag carries employer details", async ({
  page,
}) => {
  await page.goto("/");
  const raw = await page
    .locator('script[type="application/ld+json"]')
    .textContent();
  const data = JSON.parse(raw ?? "{}");
  expect(data).toMatchObject({
    "@type": "Person",
    name: "Maanav Shah",
    jobTitle: "Full-stack engineer",
    address: { addressLocality: "Vadodara", addressCountry: "India" },
  });
  expect(data.sameAs).toHaveLength(2);
  expect(Object.keys(data)).not.toContain("worksFor");

  // Everything a crawler reads from the head: the title, every meta tag, the JSON-LD.
  const headText = await page.evaluate(() =>
    [
      document.title,
      ...[...document.head.querySelectorAll("meta")].map(
        (meta) => meta.getAttribute("content") ?? "",
      ),
    ].join("\n"),
  );
  expect(headText).not.toMatch(employerDetails);
  expect(raw ?? "").not.toMatch(employerDetails);
});

test("robots.txt disallows everything and the sitemap is empty", async ({
  request,
}) => {
  const robots = await (await request.get("/robots.txt")).text();
  expect(robots).toContain("User-Agent: *");
  expect(robots).toContain("Disallow: /");
  expect(robots).not.toContain("Allow: /");

  const sitemap = await (await request.get("/sitemap.xml")).text();
  expect(sitemap).toContain("<urlset");
  expect(sitemap).not.toContain("<url>");
});

for (const path of ["/opengraph-image", "/twitter-image"]) {
  test(`${path} returns a 1200x630 PNG`, async ({ request }) => {
    const response = await request.get(path);
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toBe("image/png");
    const body = await response.body();
    expect([...body.subarray(0, 8)]).toEqual([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
    ]);
    // The PNG header stores width and height at bytes 16 and 20.
    expect(body.readUInt32BE(16)).toBe(1200);
    expect(body.readUInt32BE(20)).toBe(630);
  });
}
