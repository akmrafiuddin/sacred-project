import type { H3Event } from "h3";
import type { D1Database } from "@cloudflare/workers-types";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "../db/schema";

export const createContext = (event: H3Event) => {
  const env = event.context.cloudflare?.env as { DB?: D1Database } | undefined;
  return {
    event,
    db: env?.DB ? drizzle(env.DB, { schema }) : (null as any),
  };
};

export type Context = ReturnType<typeof createContext>;
