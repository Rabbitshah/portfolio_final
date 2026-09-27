import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import type { SubmissionLimiter } from "@/lib/contact/types";

export const LIMIT = 5;
export const WINDOW_MS = 60 * 60 * 1000;

// Upstash's own timeout (5 s by default) answers "allowed" with reason "timeout", which would
// fail open. That answer is turned into an error here, like a network error, and the caller
// turns both into a refusal.
export function createUpstashLimiter(
  url: string,
  token: string,
): SubmissionLimiter {
  const limiter = new Ratelimit({
    redis: new Redis({ url, token }),
    limiter: Ratelimit.slidingWindow(LIMIT, "1 h"),
    prefix: "portfolio:contact",
  });
  return {
    async allow(key) {
      const { success, reason } = await limiter.limit(key);
      if (reason === "timeout") {
        const failure = new Error("Upstash did not answer in time");
        failure.name = "RatelimitTimeout";
        throw failure;
      }
      return success;
    },
  };
}

/** In-process sliding window, for local development and tests. Not used in production. */
export function createMemoryLimiter(
  now: () => number = Date.now,
): SubmissionLimiter {
  const hits = new Map<string, number[]>();
  return {
    async allow(key) {
      const cutoff = now() - WINDOW_MS;
      const recent = (hits.get(key) ?? []).filter((time) => time > cutoff);
      if (recent.length >= LIMIT) {
        hits.set(key, recent);
        return false;
      }
      recent.push(now());
      hits.set(key, recent);
      return true;
    },
  };
}
