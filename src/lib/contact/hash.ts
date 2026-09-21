import { createHash } from "node:crypto";

/** Salted SHA-256 of the client IP. The raw IP is never stored or logged. */
export function hashIp(ip: string, salt: string): string {
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex");
}

/**
 * The client IP as Vercel reports it: `x-forwarded-for` is overwritten by Vercel's edge, so the
 * first entry cannot be spoofed by the caller. Falls back to a fixed label so rate limiting
 * still applies to requests with no address.
 */
export function clientIp(headers: {
  get(name: string): string | null;
}): string {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || headers.get("x-real-ip")?.trim() || "unknown";
}
