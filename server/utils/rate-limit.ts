import { type H3Event, getRequestHeader } from "h3";
import { createApiError } from "./errors";

// In-memory sliding window rate limiter
// For Cloudflare Workers, isolate-level rate limiting blocks bursts/spam per edge instance
const rateLimitMap = new Map<string, number[]>();

export interface RateLimitOptions {
  key: string;
  maxRequests?: number;
  windowSeconds?: number;
}

function getClientIp(event: H3Event): string {
  try {
    return (
      getRequestHeader(event, "cf-connecting-ip") ||
      getRequestHeader(event, "x-forwarded-for")?.split(",")[0]?.trim() ||
      (event as any).clientIp ||
      "127.0.0.1"
    );
  } catch {
    return (event as any).clientIp || "127.0.0.1";
  }
}

export function enforceRateLimit(event: H3Event, options: RateLimitOptions): void {
  // Disable in vitest tests unless specifically testing rate limiter
  if (process.env.VITEST && !process.env.TEST_RATE_LIMIT) {
    return;
  }

  const clientIp = getClientIp(event);

  const maxRequests = options.maxRequests ?? 5;
  const windowMs = (options.windowSeconds ?? 600) * 1000; // 10 minutes default
  const now = Date.now();
  const mapKey = `${options.key}:${clientIp}`;

  const timestamps = rateLimitMap.get(mapKey) || [];
  // Filter out expired timestamps
  const activeTimestamps = timestamps.filter((t) => now - t < windowMs);

  if (activeTimestamps.length >= maxRequests) {
    throw createApiError(
      429,
      "RATE_LIMIT_EXCEEDED",
      "Too many form submissions from this connection. Please wait a few minutes before trying again."
    );
  }

  activeTimestamps.push(now);
  rateLimitMap.set(mapKey, activeTimestamps);

  // Periodically cleanup older entries if map grows large
  if (rateLimitMap.size > 2000) {
    for (const [k, v] of rateLimitMap.entries()) {
      if (!v.some((t) => now - t < windowMs)) {
        rateLimitMap.delete(k);
      }
    }
  }
}
