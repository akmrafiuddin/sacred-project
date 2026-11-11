import { setHeader } from "h3";
import { getDb } from "../../../db";
import { NoticesService } from "../../../services/notices";
import { createApiError } from "../../../utils/errors";

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, "slug");
  if (!slug) {
    throw createApiError(400, "BAD_REQUEST", "Notice slug is required");
  }

  const db = getDb(event);
  setHeader(
    event,
    "Cache-Control",
    "public, max-age=60, s-maxage=300, stale-while-revalidate=600"
  );
  const notice = await NoticesService.getPublicBySlug(db, slug);

  if (!notice) {
    throw createApiError(404, "NOT_FOUND", `Notice with slug '${slug}' not found`);
  }

  return notice;
});
