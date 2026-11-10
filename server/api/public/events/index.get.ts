import { getDb } from "../../../db";
import { EventsService } from "../../../services/events";

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const db = getDb(event);

  if (query.month && typeof query.month === "string") {
    const items = await EventsService.getByMonth(db, query.month);
    return { items };
  }

  const result = await EventsService.list(db, {
    active: true,
    page: Number(query.page) || 1,
    pageSize: Math.min(Number(query.pageSize) || 20, 100),
    search: typeof query.search === "string" ? query.search : undefined,
    kind: typeof query.kind === "string" ? (query.kind as any) : undefined,
  });

  return result;
});
