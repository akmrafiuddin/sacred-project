import type { H3Event } from "h3";
import type { D1Database } from "@cloudflare/workers-types";
import { drizzle, type DrizzleD1Database } from "drizzle-orm/d1";
import * as schema from "./schema";

export function getDb(event: H3Event): DrizzleD1Database<typeof schema> {
  const env = event.context.cloudflare?.env as { DB?: D1Database } | undefined;
  const dbBinding = env?.DB;

  if (!dbBinding) {
    throw createError({
      statusCode: 500,
      statusMessage: "Cloudflare D1 Database binding 'DB' is not available in environment",
    });
  }

  return drizzle(dbBinding, { schema });
}

export { schema };
