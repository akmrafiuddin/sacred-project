import type { H3Event } from "h3";
import type { D1Database, R2Bucket } from "@cloudflare/workers-types";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "../db/schema";
import { getAuthSession } from "../utils/session";

export const createContext = async (event: H3Event) => {
  const env = event.context.cloudflare?.env as { DB?: D1Database; MEDIA?: R2Bucket } | undefined;
  const authContext = await getAuthSession(event);

  return {
    event,
    db: env?.DB ? drizzle(env.DB, { schema }) : (null as any),
    mediaBucket: env?.MEDIA ?? null,
    session: authContext?.session ?? null,
    user: authContext?.user ?? null,
  };
};

export type Context = Awaited<ReturnType<typeof createContext>>;
