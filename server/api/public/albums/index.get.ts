import { getDb } from "../../../db";
import { GalleryService } from "../../../services/gallery";

export default defineEventHandler(async (event) => {
  const db = getDb(event);
  const items = await GalleryService.getPublicAlbums(db);
  return { items };
});
