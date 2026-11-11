import { setHeader } from "h3";
import { getDb } from "../../../db";
import { EventsService } from "../../../services/events";
import { createApiError } from "../../../utils/errors";

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, "slug");
  if (!slug) {
    throw createApiError(400, "BAD_REQUEST", "Event slug is required");
  }

  const db = getDb(event);
  setHeader(
    event,
    "Cache-Control",
    "public, max-age=60, s-maxage=300, stale-while-revalidate=600"
  );
  const item = await EventsService.getPublicBySlug(db, slug);

  if (!item) {
    throw createApiError(404, "NOT_FOUND", `Event with slug '${slug}' not found`);
  }

  return item;
});
