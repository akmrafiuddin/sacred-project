import { getDb } from "../../../db";
import { NoticesService } from "../../../services/notices";

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const db = getDb(event);

  const category = typeof query.category === "string" ? query.category : undefined;
  const limit = Math.min(Number(query.limit) || 20, 100);

  const items = await NoticesService.getPublicList(db, { category, limit });
  return { items };
});
