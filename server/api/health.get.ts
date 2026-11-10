import { defineEventHandler, setResponseStatus } from "h3";
import { sql } from "drizzle-orm";
import { getDb } from "../db";

export default defineEventHandler(async (event) => {
  let d1Status = "healthy";
  let errorMessage: string | null = null;

  try {
    const db = getDb(event);
    await db.run(sql`SELECT 1`);
  } catch (err: any) {
    d1Status = "unhealthy";
    errorMessage = err?.message || "Failed to communicate with D1 database";
  }

  if (d1Status !== "healthy") {
    setResponseStatus(event, 503);
    return {
      status: "degraded",
      timestamp: Date.now(),
      d1: d1Status,
      error: errorMessage,
    };
  }

  return {
    status: "ok",
    timestamp: Date.now(),
    d1: d1Status,
    service: "mandir-backend",
  };
});
