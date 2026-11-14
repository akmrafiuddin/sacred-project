import { describe, it, expect, beforeEach } from "vitest";
import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import * as schema from "../server/db/schema";
import { GalleryService } from "../server/services/gallery";
import { createAlbumSchema, createAlbumItemSchema } from "../shared/schemas/gallery";

describe("Phase 3 — Gallery & Albums Domain", () => {
  let sqlite: Database;
  let db: any;

  beforeEach(() => {
    sqlite = new Database(":memory:");
    sqlite.run(`
      CREATE TABLE albums (
        id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        title TEXT NOT NULL,
        description TEXT,
        cover TEXT,
        sort_order INTEGER NOT NULL DEFAULT 0,
        active INTEGER NOT NULL DEFAULT 1,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );
      CREATE INDEX albums_slug_idx ON albums (slug);
      CREATE INDEX albums_sort_order_idx ON albums (sort_order);

      CREATE TABLE album_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        album_id INTEGER NOT NULL REFERENCES albums(id) ON DELETE CASCADE,
        media_id TEXT NOT NULL,
        caption TEXT,
        sort_order INTEGER NOT NULL DEFAULT 0,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );
      CREATE INDEX album_items_album_id_idx ON album_items (album_id);
      CREATE INDEX album_items_sort_order_idx ON album_items (sort_order);
    `);
    db = drizzle(sqlite, { schema });
  });

  it("validates album and item schemas with Zod", () => {
    const validAlbum = createAlbumSchema.safeParse({
      slug: "kali-puja-2026-album",
      title: { en: "Kali Puja 2026 Highlights", bn: "" },
      description: { en: "Divine celebration photos", bn: "" },
      cover: "media-cover-01",
      sortOrder: 1,
      active: true,
    });
    expect(validAlbum.success).toBe(true);

    const validItem = createAlbumItemSchema.safeParse({
      albumId: 1,
      mediaId: "media-photo-01",
      caption: { en: "Aarti in sanctum", bn: "" },
      sortOrder: 1,
    });
    expect(validItem.success).toBe(true);
  });

  it("creates an album, adds items, and fetches public album with items", async () => {
    const album = await GalleryService.createAlbum(db, {
      slug: "mandir-architecture",
      title: { en: "Mandir Architecture", bn: "" },
      cover: "media-mandir-cover",
      sortOrder: 1,
      active: true,
    });

    expect(album.id).toBeDefined();

    const item1 = await GalleryService.addItem(db, {
      albumId: album.id,
      mediaId: "media-sanctum-01",
      caption: { en: "Garbhagriha entrance", bn: "" },
      sortOrder: 1,
    });

    const item2 = await GalleryService.addItem(db, {
      albumId: album.id,
      mediaId: "media-temple-tower",
      caption: { en: "Shikhara spire", bn: "" },
      sortOrder: 2,
    });

    const publicAlbum = await GalleryService.getPublicAlbumWithItems(db, "mandir-architecture");
    expect(publicAlbum).not.null;
    expect(publicAlbum?.slug).toBe("mandir-architecture");
    expect(publicAlbum?.items.length).toBe(2);
    expect(publicAlbum?.items[0].mediaId).toBe("media-sanctum-01");
    expect(publicAlbum?.items[1].mediaId).toBe("media-temple-tower");

    // Cascade delete test: deleting album deletes its items
    await GalleryService.deleteAlbum(db, album.id);
    expect(await GalleryService.getAlbumById(db, album.id)).toBeNull();
    const remainingItems = await GalleryService.listItems(db, album.id);
    expect(remainingItems.length).toBe(0);
  });
});
