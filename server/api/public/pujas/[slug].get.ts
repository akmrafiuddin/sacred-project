import { setHeader } from "h3";
import { getDb } from "../../../db";
import { PujasService } from "../../../services/pujas";
import { createApiError } from "../../../utils/errors";

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, "slug");
  if (!slug) {
    throw createApiError(400, "BAD_REQUEST", "Puja slug is required");
  }

  const db = getDb(event);
  setHeader(
    event,
    "Cache-Control",
    "public, max-age=60, s-maxage=300, stale-while-revalidate=600"
  );
  const puja = await PujasService.getPublicBySlug(db, slug);

  if (!puja) {
    throw createApiError(404, "NOT_FOUND", `Puja with slug '${slug}' not found`);
  }

  return puja;
});
