import { describe, it, expect, beforeEach } from "vitest";
import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import * as schema from "../server/db/schema";
import { MediaService } from "../server/services/media";
import { detectImageInfo, generateMediaKey } from "../server/utils/media";
import { updateMediaSchema, mediaQuerySchema } from "../shared/schemas/media";

describe("Phase 5 — Media Storage & Protection", () => {
  let sqlite: Database;
  let db: any;

  beforeEach(() => {
    sqlite = new Database(":memory:");
    sqlite.run(`
      CREATE TABLE user (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        email_verified INTEGER NOT NULL DEFAULT 0,
        image TEXT,
        role TEXT NOT NULL DEFAULT 'user',
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );

      CREATE TABLE media (
        id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        key TEXT NOT NULL UNIQUE,
        mime TEXT NOT NULL,
        size INTEGER NOT NULL,
        width INTEGER,
        height INTEGER,
        alt TEXT NOT NULL,
        uploaded_by TEXT REFERENCES user(id) ON DELETE SET NULL,
        created_at INTEGER NOT NULL
      );

      CREATE TABLE deities (
        id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        subtitle TEXT,
        description TEXT NOT NULL,
        image_id TEXT,
        sort_order INTEGER NOT NULL DEFAULT 0,
        active INTEGER NOT NULL DEFAULT 1,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );

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

      CREATE TABLE album_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        album_id INTEGER NOT NULL REFERENCES albums(id) ON DELETE CASCADE,
        media_id TEXT NOT NULL,
        caption TEXT,
        sort_order INTEGER NOT NULL DEFAULT 0,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );
    `);
    db = drizzle(sqlite, { schema });
  });

  describe("Magic bytes detection & key generator", () => {
    it("detects PNG images and dimensions", () => {
      // 8-byte PNG signature + minimal IHDR (13 bytes)
      const buffer = new Uint8Array(24);
      buffer.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]); // PNG signature
      const view = new DataView(buffer.buffer);
      view.setUint32(16, 800, false); // width 800
      view.setUint32(20, 600, false); // height 600

      const info = detectImageInfo(buffer);
      expect(info).not.toBeNull();
      expect(info?.mime).toBe("image/png");
      expect(info?.extension).toBe("png");
      expect(info?.width).toBe(800);
      expect(info?.height).toBe(600);
    });

    it("detects JPEG images", () => {
      const buffer = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]);
      const info = detectImageInfo(buffer);
      expect(info).not.toBeNull();
      expect(info?.mime).toBe("image/jpeg");
      expect(info?.extension).toBe("jpg");
    });

    it("detects WebP images", () => {
      // RIFF .... WEBP
      const buffer = new Uint8Array([
        0x52, 0x49, 0x46, 0x46, // RIFF
        0x20, 0x00, 0x00, 0x00,
        0x57, 0x45, 0x42, 0x50, // WEBP
        0x56, 0x50, 0x38, 0x20, // VP8
      ]);
      const info = detectImageInfo(buffer);
      expect(info).not.toBeNull();
      expect(info?.mime).toBe("image/webp");
      expect(info?.extension).toBe("webp");
    });

    it("rejects non-image files and arbitrary payloads", () => {
      const pdf = new TextEncoder().encode("%PDF-1.5 fake pdf content");
      expect(detectImageInfo(pdf)).toBeNull();

      const html = new TextEncoder().encode("<script>alert('xss')</script>");
      expect(detectImageInfo(html)).toBeNull();

      const short = new Uint8Array([0x01, 0x02, 0x03]);
      expect(detectImageInfo(short)).toBeNull();
    });

    it("generates a random, non-guessable storage key", () => {
      const key1 = generateMediaKey("jpg");
      const key2 = generateMediaKey("webp");
      expect(key1).toMatch(/^\d+-[a-f0-9]{12}\.jpg$/);
      expect(key2).toMatch(/^\d+-[a-f0-9]{12}\.webp$/);
      expect(key1).not.toBe(key2);
    });
  });

  describe("Validation schemas", () => {
    it("validates updateMediaSchema", () => {
      const valid = updateMediaSchema.safeParse({
        id: 1,
        alt: { en: "Maa Kali Vigraha", bn: "মা কালী বিগ্রহ" },
      });
      expect(valid.success).toBe(true);

      const invalid = updateMediaSchema.safeParse({
        id: -1,
        alt: { en: "" }, // missing en
      });
      expect(invalid.success).toBe(false);
    });

    it("validates mediaQuerySchema", () => {
      const valid = mediaQuerySchema.safeParse({
        page: 1,
        pageSize: 20,
        mime: "image/webp",
      });
      expect(valid.success).toBe(true);

      const invalid = mediaQuerySchema.safeParse({
        mime: "application/pdf", // not allowed
      });
      expect(invalid.success).toBe(false);
    });
  });

  describe("Media CRUD & Reference Protection", () => {
    it("creates, retrieves, and updates media records", async () => {
      const created = await MediaService.createMedia(db, {
        key: "test-img-01.webp",
        mime: "image/webp",
        size: 102400,
        width: 1200,
        height: 800,
        alt: { en: "Temple Sanctum", bn: "গর্ভগৃহ" },
      });

      expect(created.id).toBe(1);
      expect(created.key).toBe("test-img-01.webp");
      expect(created.alt.en).toBe("Temple Sanctum");

      const fetched = await MediaService.getMediaById(db, 1);
      expect(fetched).not.toBeNull();
      expect(fetched?.size).toBe(102400);

      const updated = await MediaService.updateMedia(db, {
        id: 1,
        alt: { en: "Updated Sanctum View", bn: "নতুন গর্ভগৃহ" },
      });
      expect(updated.alt.en).toBe("Updated Sanctum View");
    });

    it("blocks deletion when referenced in deities table (409 Conflict)", async () => {
      const mediaItem = await MediaService.createMedia(db, {
        key: "kali-vigraha.jpg",
        mime: "image/jpeg",
        size: 204800,
        width: 1080,
        height: 1920,
        alt: { en: "Maa Kali", bn: "মা কালী" },
      });

      // Insert deity referencing this media by id
      sqlite.run(`
        INSERT INTO deities (slug, name, subtitle, description, image_id, sort_order, active, created_at, updated_at)
        VALUES ('maa-kali', '{"en":"Maa Kali","bn":"মা কালী"}', null, '{"en":"Desc","bn":""}', '${mediaItem.id}', 1, 1, 1000, 1000);
      `);

      // Attempt to delete
      await expect(MediaService.deleteMedia(db, null, mediaItem.id)).rejects.toThrow(
        /Media cannot be deleted because it is in use/
      );

      // Now clear deity reference and delete should succeed
      sqlite.run(`UPDATE deities SET image_id = NULL WHERE slug = 'maa-kali';`);
      const res = await MediaService.deleteMedia(db, null, mediaItem.id);
      expect(res.success).toBe(true);

      const check = await MediaService.getMediaById(db, mediaItem.id);
      expect(check).toBeNull();
    });

    it("blocks deletion when referenced in album cover or album items", async () => {
      const mediaItem = await MediaService.createMedia(db, {
        key: "gallery-01.webp",
        mime: "image/webp",
        size: 51200,
        width: 800,
        height: 600,
        alt: { en: "Aarti", bn: "আরতি" },
      });

      // Insert album referencing cover
      sqlite.run(`
        INSERT INTO albums (slug, title, description, cover, sort_order, active, created_at, updated_at)
        VALUES ('puja-2026', '{"en":"Puja 2026","bn":""}', null, '${mediaItem.key}', 1, 1, 1000, 1000);
      `);

      await expect(MediaService.deleteMedia(db, null, mediaItem.id)).rejects.toThrow(
        /Media cannot be deleted because it is in use/
      );

      // Change album cover
      sqlite.run(`UPDATE albums SET cover = 'other-cover.jpg' WHERE slug = 'puja-2026';`);

      // Insert album item referencing mediaId
      sqlite.run(`
        INSERT INTO album_items (album_id, media_id, caption, sort_order, created_at, updated_at)
        VALUES (1, '${mediaItem.id}', null, 1, 1000, 1000);
      `);

      await expect(MediaService.deleteMedia(db, null, mediaItem.id)).rejects.toThrow(
        /Media cannot be deleted because it is in use/
      );

      // Remove album item
      sqlite.run(`DELETE FROM album_items WHERE album_id = 1;`);
      const res = await MediaService.deleteMedia(db, null, mediaItem.id);
      expect(res.success).toBe(true);
    });
  });
});
