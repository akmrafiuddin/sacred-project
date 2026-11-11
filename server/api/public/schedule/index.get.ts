import { setHeader } from "h3";
import { getDb } from "../../../db";
import { ScheduleService } from "../../../services/schedule";

export default defineEventHandler(async (event) => {
  const db = getDb(event);
  setHeader(event, "Cache-Control", "public, max-age=60, s-maxage=300, stale-while-revalidate=600");
  const result = await ScheduleService.getPublicSchedule(db);
  return result;
});
