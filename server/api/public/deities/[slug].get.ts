import { setHeader } from "h3";
import { getDb } from "../../../db";
import { DeitiesService } from "../../../services/deities";
import { createApiError } from "../../../utils/errors";

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, "slug");
  if (!slug) {
    throw createApiError(400, "BAD_REQUEST", "Deity slug is required");
  }

  const db = getDb(event);
  setHeader(
    event,
    "Cache-Control",
    "public, max-age=60, s-maxage=300, stale-while-revalidate=600"
  );
  const deity = await DeitiesService.getPublicBySlug(db, slug);

  if (!deity) {
    throw createApiError(404, "NOT_FOUND", `Deity with slug '${slug}' not found`);
  }

  return deity;
});
