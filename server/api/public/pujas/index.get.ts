import { getDb } from "../../../db";
import { PujasService } from "../../../services/pujas";

export default defineEventHandler(async (event) => {
  const db = getDb(event);
  const items = await PujasService.getPublicList(db);
  return { items };
});
