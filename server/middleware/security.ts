import { defineEventHandler, setHeader } from "h3";

export default defineEventHandler((event) => {
  // Prevent MIME-sniffing
  setHeader(event, "X-Content-Type-Options", "nosniff");

  // Prevent clickjacking
  setHeader(event, "X-Frame-Options", "SAMEORIGIN");

  // Referrer Policy
  setHeader(event, "Referrer-Policy", "strict-origin-when-cross-origin");

  // Permissions Policy
  setHeader(event, "Permissions-Policy", "camera=(), microphone=(), geolocation=()");

  // Content Security Policy (allows Turnstile, Google Fonts, and local assets)
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' https://challenges.cloudflare.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: blob: https:",
    "connect-src 'self' https://challenges.cloudflare.com",
    "frame-src 'self' https://challenges.cloudflare.com",
    "frame-ancestors 'self'",
    "object-src 'none'",
    "base-uri 'self'",
  ];

  setHeader(event, "Content-Security-Policy", cspDirectives.join("; "));

  // HSTS in production environments
  if (!import.meta.dev) {
    setHeader(
      event,
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload"
    );
  }
});
