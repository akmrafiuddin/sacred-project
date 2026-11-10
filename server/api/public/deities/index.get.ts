import { getDb } from "../../../db";
import { DeitiesService } from "../../../services/deities";

export default defineEventHandler(async (event) => {
  const db = getDb(event);
  const items = await DeitiesService.getPublicList(db);
  return { items };
});
