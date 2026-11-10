import type { H3Event } from "h3";
import type { D1Database } from "@cloudflare/workers-types";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "../db/schema";

export const createContext = (event: H3Event) => {
  const env = event.context.cloudflare.env as { DB: D1Database };
  return {
    event,
    db: drizzle(env.DB, { schema }),
  };
};

export type Context = ReturnType<typeof createContext>;
