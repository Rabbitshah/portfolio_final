import type { Metadata, MetadataRoute } from "next";
import type { Site } from "@/lib/content";

// TODO(content): do not add worksFor, employer names, the PraverseAI project or anything about
// Praverse Tech to metadata, Open Graph or JSON-LD until Maanav says so.

type SiteUrlEnv = {
  NEXT_PUBLIC_SITE_URL?: string | undefined;
  VERCEL_ENV?: string | undefined;
  VERCEL_URL?: string | undefined;
  VERCEL_PROJECT_PRODUCTION_URL?: string | undefined;
};

/**
 * The site's public origin, without a trailing slash.
 * 1. NEXT_PUBLIC_SITE_URL, if set.
 * 2. On Vercel: the production domain for production builds, the deployment URL otherwise.
 *    Vercel gives these as bare hosts (no https://).
 * 3. http://localhost:3000.
 */
export function resolveSiteUrl(env: SiteUrlEnv): string {
  let url = "http://localhost:3000";
  if (env.NEXT_PUBLIC_SITE_URL) {
    url = env.NEXT_PUBLIC_SITE_URL;
  } else if (
    env.VERCEL_ENV === "production" &&
    env.VERCEL_PROJECT_PRODUCTION_URL
  ) {
    url = `https://${env.VERCEL_PROJECT_PRODUCTION_URL}`;
  } else if (env.VERCEL_URL) {
    url = `https://${env.VERCEL_URL}`;
  }
  return url.replace(/\/+$/, "");
}

/** noindex/nofollow while the site is not indexable; nothing when it is. */
export function robotsMetadata(indexable: boolean): Metadata["robots"] {
  return indexable ? undefined : { index: false, follow: false };
}

export function buildRobots(
  indexable: boolean,
  siteUrl: string,
): MetadataRoute.Robots {
  if (!indexable) return { rules: { userAgent: "*", disallow: "/" } };
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}

export function buildSitemap(
  indexable: boolean,
  siteUrl: string,
): MetadataRoute.Sitemap {
  return indexable ? [{ url: `${siteUrl}/` }] : [];
}

type SiteForMetadata = Pick<Site, "name" | "role" | "intro">;

/** Title, description, canonical, Open Graph and Twitter tags. Emitted whether or not the site is indexable. */
export function buildMetadata(
  site: SiteForMetadata,
  siteUrl: string,
  indexable: boolean,
): Metadata {
  const title = `${site.name} — ${site.role}`;
  return {
    metadataBase: new URL(siteUrl),
    title,
    description: site.intro,
    alternates: { canonical: "/" },
    robots: robotsMetadata(indexable),
    openGraph: {
      type: "website",
      url: "/",
      siteName: site.name,
      title,
      description: site.intro,
    },
    twitter: { card: "summary_large_image", title, description: site.intro },
  };
}

/** Person structured data. Only what is public and safe: name, job title, address, profiles. */
export function personJsonLd(
  site: Pick<Site, "name" | "role" | "location" | "links">,
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: site.name,
    jobTitle: site.role,
    address: {
      "@type": "PostalAddress",
      addressLocality: site.location.city,
      addressRegion: site.location.region,
      addressCountry: site.location.country,
    },
    sameAs: [site.links.github, site.links.linkedin],
  };
}

/** JSON for a <script type="application/ld+json">. "<" is escaped so the data can never close the tag. */
export function serializeJsonLd(data: Record<string, unknown>): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

/** The only text drawn on the Open Graph image. */
export function ogContent(site: Pick<Site, "name" | "role" | "headline">): {
  name: string;
  role: string;
  headline: string;
} {
  return { name: site.name, role: site.role, headline: site.headline };
}
