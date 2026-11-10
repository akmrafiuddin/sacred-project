import { getDb } from "../../../db";
import { GalleryService } from "../../../services/gallery";
import { createApiError } from "../../../utils/errors";

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, "slug");
  if (!slug) {
    throw createApiError(400, "BAD_REQUEST", "Album slug is required");
  }

  const db = getDb(event);
  const album = await GalleryService.getPublicAlbumWithItems(db, slug);

  if (!album) {
    throw createApiError(404, "NOT_FOUND", `Album with slug '${slug}' not found`);
  }

  return album;
});
