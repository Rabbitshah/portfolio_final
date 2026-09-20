import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1).optional(),
  UPSTASH_REDIS_REST_URL: z.url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1).optional(),
  RESEND_API_KEY: z.string().min(1).optional(),
  CONTACT_TO_EMAIL: z.email().optional(),
  CONTACT_FROM_EMAIL: z.string().min(1).optional(),
  IP_HASH_SALT: z.string().min(1).optional(),
  LLM_PROVIDER: z.string().min(1).optional(),
  LLM_MODEL: z.string().min(1).optional(),
  LLM_API_KEY: z.string().min(1).optional(),
  ASK_DAILY_TOKEN_CAP: z.coerce.number().int().positive().optional(),
  ADMIN_PASSWORD_HASH: z.string().min(1).optional(),
  JWT_SECRET: z.string().min(1).optional(),
  TURNSTILE_SECRET_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_SITE_URL: z.url().optional(),
  // "true" lets search engines index the site; anything else (or unset) keeps it noindex.
  SITE_INDEXABLE: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
  // Set by Vercel (the hosts have no https:// prefix). See resolveSiteUrl in src/lib/seo.ts.
  VERCEL_ENV: z.enum(["production", "preview", "development"]).optional(),
  VERCEL_URL: z.string().min(1).optional(),
  VERCEL_PROJECT_PRODUCTION_URL: z.string().min(1).optional(),
});

export type Env = z.infer<typeof envSchema>;

export function parseEnv(source: Record<string, string | undefined>): Env {
  // An empty value (e.g. `KEY=` copied from .env.example) counts as unset.
  const cleaned = Object.fromEntries(
    Object.entries(source).filter(([, value]) => value !== ""),
  );
  const result = envSchema.safeParse(cleaned);
  if (!result.success) {
    throw new Error(
      `Invalid environment variables:\n${z.prettifyError(result.error)}`,
    );
  }
  return result.data;
}

// NEXT_PUBLIC_SITE_URL is referenced directly so Next.js inlines it into client bundles.
// Other vars are undefined in the browser because process.env is empty there.
export const env = parseEnv({
  ...process.env,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
});
