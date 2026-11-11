import { createError, setHeader } from "h3";
import { getDb } from "../../../db";
import { ScheduleService } from "../../../services/schedule";

export default defineEventHandler(async (event) => {
  const idParam = event.context.params?.id;
  const id = Number(idParam);

  if (!idParam || Number.isNaN(id) || !Number.isInteger(id) || id <= 0) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid schedule ID. Expected positive integer.",
    });
  }

  const db = getDb(event);
  const item = await ScheduleService.getById(db, id);

  if (!item || !item.active) {
    throw createError({
      statusCode: 404,
      statusMessage: `Schedule item with ID ${id} not found`,
    });
  }

  setHeader(event, "Cache-Control", "public, max-age=60, s-maxage=300, stale-while-revalidate=600");
  return item;
});
