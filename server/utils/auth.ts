import type { H3Event } from "h3";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { createAuthMiddleware, APIError } from "better-auth/api";
import { getDb, schema } from "../db";

export function getAuth(event: H3Event) {
  // Memoize on the event context for the current request
  if ((event.context as any)._auth) {
    return (event.context as any)._auth;
  }

  const db = getDb(event);
  const cfEnv = (event.context.cloudflare?.env as Record<string, any>) || {};

  const secret =
    process.env.BETTER_AUTH_SECRET ||
    cfEnv.BETTER_AUTH_SECRET ||
    "temple-default-dev-secret-change-in-prod-min-32-chars";

  let baseURL = process.env.BETTER_AUTH_URL;
  if (!baseURL) {
    try {
      baseURL = getRequestURL(event).origin;
    } catch {
      baseURL = "http://localhost:3000";
    }
  }

  const authInstance = betterAuth({
    database: drizzleAdapter(db, {
      provider: "sqlite",
      schema,
    }),
    secret,
    baseURL,
    user: {
      additionalFields: {
        role: {
          type: "string",
          required: false,
          defaultValue: "user",
          input: false, // Server controlled: client input ignored at signup/profile
          returned: true,
        },
        phone: {
          type: "string",
          required: false,
          input: true,
          returned: true,
        },
      },
    },
    emailAndPassword: {
      enabled: true,
    },
    hooks: {
      before: createAuthMiddleware(async (ctx) => {
        // Enforce signup gate: ALLOW_PUBLIC_SIGNUP
        if (ctx.path === "/sign-up/email") {
          const allowSignup =
            process.env.ALLOW_PUBLIC_SIGNUP === "true" ||
            cfEnv.ALLOW_PUBLIC_SIGNUP === "true";

          if (!allowSignup) {
            throw new APIError("FORBIDDEN", {
              message: "Public sign-up is currently disabled.",
            });
          }
        }
      }),
    },
  });

  (event.context as any)._auth = authInstance;
  return authInstance;
}
