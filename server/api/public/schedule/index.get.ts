import { getDb } from "../../../db";
import { ScheduleService } from "../../../services/schedule";

export default defineEventHandler(async (event) => {
  const db = getDb(event);
  const result = await ScheduleService.getPublicSchedule(db);
  return result;
});
