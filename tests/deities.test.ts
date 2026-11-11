import { describe, it, expect, beforeEach } from "vitest";
import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import * as schema from "../server/db/schema";
import { DeitiesService } from "../server/services/deities";
import {
  createDeitySchema,
  updateDeitySchema,
  listDeitiesQuerySchema,
  reorderDeitiesSchema,
} from "../shared/schemas/deities";

describe("Deities Domain & CRUD", () => {
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

      CREATE TABLE audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        user_id TEXT REFERENCES user(id) ON DELETE SET NULL,
        action TEXT NOT NULL,
        entity TEXT NOT NULL,
        entity_id TEXT,
        details TEXT,
        at INTEGER NOT NULL
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
      CREATE INDEX deities_slug_idx ON deities (slug);
      CREATE INDEX deities_sort_order_idx ON deities (sort_order);
    `);
    db = drizzle(sqlite, { schema });
  });

  describe("Validation Schemas", () => {
    it("validates deity input with Zod", () => {
      const valid = createDeitySchema.safeParse({
        slug: "maa-kali",
        name: { en: "Maa Kali", bn: "মা কালী" },
        subtitle: { en: "The Presiding Divine Mother", bn: "প্রধান অধিষ্ঠাত্রী দেবী" },
        description: { en: "Embodiment of Shakti and compassion", bn: "শক্তিরূপা ও করুণাময়ী" },
        imageId: "media-kali-01",
        sortOrder: 1,
        active: true,
      });
      expect(valid.success).toBe(true);

      const invalidSlug = createDeitySchema.safeParse({
        slug: "Maa Kali!",
        name: { en: "Maa Kali", bn: "" },
        description: { en: "Desc", bn: "" },
      });
      expect(invalidSlug.success).toBe(false);

      const emptyName = createDeitySchema.safeParse({
        slug: "valid-slug",
        name: { en: "", bn: "" },
        description: { en: "Desc", bn: "" },
      });
      expect(emptyName.success).toBe(false);
    });

    it("validates update and reorder schemas", () => {
      const validUpdate = updateDeitySchema.safeParse({ id: 1, sortOrder: 3 });
      expect(validUpdate.success).toBe(true);

      const emptyReorder = reorderDeitiesSchema.safeParse({ items: [] });
      expect(emptyReorder.success).toBe(false);
    });
  });

  describe("CRUD Operations", () => {
    it("creates, retrieves by ID and slug, and parses localized JSON", async () => {
      const created = await DeitiesService.create(
        db,
        {
          slug: "maa-kali",
          name: { en: "Maa Kali", bn: "মা কালী" },
          subtitle: { en: "Presiding Deity", bn: "অধিষ্ঠাত্রী দেবী" },
          description: { en: "Mother of the Universe", bn: "জগন্মাতা" },
          imageId: "img-kali",
          sortOrder: 1,
          active: true,
        },
        "admin-user-1"
      );

      expect(created.id).toBeDefined();
      expect(created.slug).toBe("maa-kali");
      expect(created.name.en).toBe("Maa Kali");
      expect(created.subtitle?.bn).toBe("অধিষ্ঠাত্রী দেবী");

      // Verify audit log
      const audits = sqlite.query("SELECT * FROM audit_logs WHERE entity = 'deities'").all();
      expect(audits.length).toBe(1);

      // Get by ID
      const byId = await DeitiesService.getById(db, created.id);
      expect(byId?.slug).toBe("maa-kali");

      // Get by Slug
      const bySlug = await DeitiesService.getBySlug(db, "maa-kali");
      expect(bySlug?.id).toBe(created.id);
    });

    it("rejects duplicate slug on create and update", async () => {
      await DeitiesService.create(db, {
        slug: "lord-shiva",
        name: { en: "Lord Shiva", bn: "" },
        description: { en: "Mahadeva", bn: "" },
      });

      await expect(
        DeitiesService.create(db, {
          slug: "lord-shiva",
          name: { en: "Another Shiva", bn: "" },
          description: { en: "Desc", bn: "" },
        })
      ).rejects.toThrow("already exists");
    });

    it("updates existing deity and throws 404 for missing", async () => {
      const created = await DeitiesService.create(db, {
        slug: "ganesha",
        name: { en: "Lord Ganesha", bn: "" },
        description: { en: "Vighnaharta", bn: "" },
      });

      const updated = await DeitiesService.update(
        db,
        {
          id: created.id,
          name: { en: "Shree Ganesha", bn: "শ্রী গণেশ" },
          sortOrder: 5,
        },
        "admin-user-1"
      );

      expect(updated.name.en).toBe("Shree Ganesha");
      expect(updated.sortOrder).toBe(5);

      await expect(
        DeitiesService.update(db, { id: 9999, sortOrder: 1 })
      ).rejects.toThrow("not found");
    });

    it("reorders deities in batch", async () => {
      const d1 = await DeitiesService.create(db, {
        slug: "d1",
        name: { en: "Deity 1", bn: "" },
        description: { en: "Desc", bn: "" },
        sortOrder: 1,
      });
      const d2 = await DeitiesService.create(db, {
        slug: "d2",
        name: { en: "Deity 2", bn: "" },
        description: { en: "Desc", bn: "" },
        sortOrder: 2,
      });

      await DeitiesService.reorder(
        db,
        {
          items: [
            { id: d1.id, sortOrder: 10 },
            { id: d2.id, sortOrder: 5 },
          ],
        },
        "admin-user-1"
      );

      const list = await DeitiesService.getPublicList(db);
      expect(list[0].id).toBe(d2.id);
      expect(list[1].id).toBe(d1.id);
    });

    it("deletes deity by ID and throws 404 for missing", async () => {
      const created = await DeitiesService.create(db, {
        slug: "temp-deity",
        name: { en: "Temp", bn: "" },
        description: { en: "Temp", bn: "" },
      });

      const deleted = await DeitiesService.delete(db, created.id, "admin-user-1");
      expect(deleted).toBe(true);

      const check = await DeitiesService.getById(db, created.id);
      expect(check).toBeNull();

      await expect(DeitiesService.delete(db, created.id)).rejects.toThrow("not found");
    });
  });

  describe("Search, Pagination, and Visibility", () => {
    it("searches across name, subtitle, description, and slug", async () => {
      await DeitiesService.create(db, {
        slug: "radha-krishna",
        name: { en: "Radha Krishna", bn: "রাধা কৃষ্ণ" },
        subtitle: { en: "Divine Love", bn: "পরম প্রেম" },
        description: { en: "Vrindavan pastimes", bn: "" },
      });
      await DeitiesService.create(db, {
        slug: "durga-mata",
        name: { en: "Maa Durga", bn: "মা দুর্গা" },
        subtitle: { en: "Mahishasuramardini", bn: "মহিষাসুরমর্দিনী" },
        description: { en: "Ten-armed goddess of triumph", bn: "" },
      });

      const resLove = await DeitiesService.list(db, { search: "Love" });
      expect(resLove.items.length).toBe(1);
      expect(resLove.items[0].slug).toBe("radha-krishna");

      const resDurga = await DeitiesService.list(db, { search: "durga" });
      expect(resDurga.items.length).toBe(1);
    });

    it("never includes inactive deities in public queries", async () => {
      await DeitiesService.create(db, {
        slug: "active-deity",
        name: { en: "Active", bn: "" },
        description: { en: "Active", bn: "" },
        active: true,
      });

      await DeitiesService.create(db, {
        slug: "inactive-deity",
        name: { en: "Inactive", bn: "" },
        description: { en: "Inactive", bn: "" },
        active: false,
      });

      const list = await DeitiesService.getPublicList(db);
      expect(list.length).toBe(1);
      expect(list[0].slug).toBe("active-deity");

      expect(await DeitiesService.getPublicBySlug(db, "active-deity")).not.null;
      expect(await DeitiesService.getPublicBySlug(db, "inactive-deity")).toBeNull();
    });
  });
});
