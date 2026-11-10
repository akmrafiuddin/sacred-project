import { getDb } from "../../../db";
import { PagesService } from "../../../services/pages";
import { createApiError } from "../../../utils/errors";

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, "slug");
  if (!slug) {
    throw createApiError(400, "BAD_REQUEST", "Page slug is required");
  }

  const db = getDb(event);
  const page = await PagesService.getPublicBySlug(db, slug);

  if (!page) {
    throw createApiError(404, "NOT_FOUND", `Page '${slug}' not found or not published`);
  }

  return page;
});
