import type { MetadataRoute } from "next";
import { env } from "@/env";
import { buildSitemap, resolveSiteUrl } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  return buildSitemap(env.SITE_INDEXABLE, resolveSiteUrl(env));
}
