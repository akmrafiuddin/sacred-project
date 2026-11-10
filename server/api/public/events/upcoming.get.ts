import { getDb } from "../../../db";
import { EventsService } from "../../../services/events";

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const db = getDb(event);

  const kind = typeof query.kind === "string" ? (query.kind as any) : undefined;
  const limit = Math.min(Number(query.limit) || 10, 50);

  const items = await EventsService.getUpcoming(db, { kind, limit });
  return { items };
});
