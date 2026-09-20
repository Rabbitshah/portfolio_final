import type { MetadataRoute } from "next";
import { env } from "@/env";
import { buildRobots, resolveSiteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return buildRobots(env.SITE_INDEXABLE, resolveSiteUrl(env));
}
