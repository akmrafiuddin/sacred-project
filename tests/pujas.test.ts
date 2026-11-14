import { describe, it, expect, beforeEach } from "vitest";
import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import * as schema from "../server/db/schema";
import { PujasService } from "../server/services/pujas";
import {
  createPujaSchema,
  updatePujaSchema,
  listPujasQuerySchema,
  reorderPujasSchema,
} from "../shared/schemas/pujas";

describe("Puja Offerings Domain & CRUD", () => {
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

      CREATE TABLE pujas (
        id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        offered TEXT,
        price_bdt INTEGER NOT NULL DEFAULT 0,
        duration TEXT,
        bookable INTEGER NOT NULL DEFAULT 1,
        sort_order INTEGER NOT NULL DEFAULT 0,
        active INTEGER NOT NULL DEFAULT 1,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );
      CREATE INDEX pujas_slug_idx ON pujas (slug);
      CREATE INDEX pujas_sort_order_idx ON pujas (sort_order);
    `);
    db = drizzle(sqlite, { schema });
  });

  describe("Validation Schemas", () => {
    it("validates valid createPujaSchema", () => {
      const valid = createPujaSchema.safeParse({
        slug: "nitya-puja",
        name: { en: "Nitya Puja", bn: "" },
        description: { en: "Daily worship", bn: "" },
        offered: { en: "Flowers, bhog", bn: "" },
        priceBdt: 501,
        duration: "45 minutes",
        bookable: true,
        sortOrder: 1,
        active: true,
      });
      expect(valid.success).toBe(true);
    });

    it("rejects invalid inputs (negative price, bad slug, missing name)", () => {
      const negativePrice = createPujaSchema.safeParse({
        slug: "invalid-puja",
        name: { en: "Test", bn: "" },
        description: { en: "Desc", bn: "" },
        priceBdt: -100,
      });
      expect(negativePrice.success).toBe(false);

      const invalidSlug = createPujaSchema.safeParse({
        slug: "Invalid Slug!",
        name: { en: "Test", bn: "" },
        description: { en: "Desc", bn: "" },
        priceBdt: 500,
      });
      expect(invalidSlug.success).toBe(false);

      const missingName = createPujaSchema.safeParse({
        slug: "test-puja",
        name: { en: "", bn: "" },
        description: { en: "Desc", bn: "" },
      });
      expect(missingName.success).toBe(false);
    });

    it("validates updatePujaSchema and reorderPujasSchema", () => {
      const validUpdate = updatePujaSchema.safeParse({
        id: 1,
        priceBdt: 750,
      });
      expect(validUpdate.success).toBe(true);

      const invalidUpdate = updatePujaSchema.safeParse({
        id: -5,
      });
      expect(invalidUpdate.success).toBe(false);

      const validReorder = reorderPujasSchema.safeParse({
        items: [{ id: 1, sortOrder: 10 }],
      });
      expect(validReorder.success).toBe(true);

      const emptyReorder = reorderPujasSchema.safeParse({
        items: [],
      });
      expect(emptyReorder.success).toBe(false);
    });

    it("validates listPujasQuerySchema with defaults and coercion", () => {
      const parsed = listPujasQuerySchema.parse({
        page: "2",
        pageSize: "10",
        search: "Kali",
        bookable: "true",
      });
      expect(parsed.page).toBe(2);
      expect(parsed.pageSize).toBe(10);
      expect(parsed.search).toBe("Kali");
      expect(parsed.bookable).toBe(true);
    });
  });

  describe("CRUD Operations & Services", () => {
    it("creates, retrieves by ID and slug, and parses JSON fields", async () => {
      const created = await PujasService.create(
        db,
        {
          slug: "nitya-puja",
          name: { en: "Nitya Puja", bn: "" },
          description: { en: "Daily worship ritual", bn: "" },
          offered: { en: "Flowers & Bel Patra", bn: "" },
          priceBdt: 501,
          duration: "45 minutes",
          bookable: true,
          sortOrder: 1,
          active: true,
        },
        "admin-user-1"
      );

      expect(created.id).toBeDefined();
      expect(created.slug).toBe("nitya-puja");
      expect(created.name.en).toBe("Nitya Puja");
      expect(created.name.bn).toBe("");
      expect(created.offered?.en).toBe("Flowers & Bel Patra");
      expect(created.priceBdt).toBe(501);

      // Verify audit log
      const auditRows = sqlite.query("SELECT * FROM audit_logs WHERE entity = 'pujas'").all();
      expect(auditRows.length).toBe(1);

      // Get by ID
      const byId = await PujasService.getById(db, created.id);
      expect(byId?.slug).toBe("nitya-puja");

      // Get by Slug
      const bySlug = await PujasService.getBySlug(db, "nitya-puja");
      expect(bySlug?.id).toBe(created.id);
    });

    it("rejects duplicate slug on create", async () => {
      await PujasService.create(db, {
        slug: "satyanarayan-puja",
        name: { en: "Satyanarayan", bn: "" },
        description: { en: "Vow", bn: "" },
        priceBdt: 1501,
      });

      await expect(
        PujasService.create(db, {
          slug: "satyanarayan-puja",
          name: { en: "Duplicate", bn: "" },
          description: { en: "Duplicate", bn: "" },
          priceBdt: 1501,
        })
      ).rejects.toThrow("already exists");
    });

    it("updates existing puja and throws 404 for non-existent", async () => {
      const created = await PujasService.create(db, {
        slug: "rudrabhishek",
        name: { en: "Rudrabhishek", bn: "" },
        description: { en: "Shiva Puja", bn: "" },
        priceBdt: 2001,
      });

      const updated = await PujasService.update(
        db,
        {
          id: created.id,
          priceBdt: 2501,
          duration: "2 hours",
          name: { en: "Maha Rudrabhishek", bn: "" },
        },
        "admin-user-1"
      );

      expect(updated.priceBdt).toBe(2501);
      expect(updated.duration).toBe("2 hours");
      expect(updated.name.en).toBe("Maha Rudrabhishek");

      // 404 on missing
      await expect(
        PujasService.update(db, { id: 9999, priceBdt: 100 })
      ).rejects.toThrow("not found");
    });

    it("reorders pujas in batch and maintains sort order", async () => {
      const p1 = await PujasService.create(db, {
        slug: "puja-1",
        name: { en: "Puja 1", bn: "" },
        description: { en: "Desc 1", bn: "" },
        sortOrder: 1,
      });
      const p2 = await PujasService.create(db, {
        slug: "puja-2",
        name: { en: "Puja 2", bn: "" },
        description: { en: "Desc 2", bn: "" },
        sortOrder: 2,
      });

      await PujasService.reorder(
        db,
        {
          items: [
            { id: p1.id, sortOrder: 10 },
            { id: p2.id, sortOrder: 5 },
          ],
        },
        "admin-user-1"
      );

      const publicList = await PujasService.getPublicList(db);
      expect(publicList[0].id).toBe(p2.id); // sortOrder 5 comes before 10
      expect(publicList[1].id).toBe(p1.id);
    });

    it("deletes puja by ID and throws 404 for missing ID", async () => {
      const created = await PujasService.create(db, {
        slug: "temp-puja",
        name: { en: "Temp", bn: "" },
        description: { en: "Temp", bn: "" },
      });

      const deleted = await PujasService.delete(db, created.id, "admin-user-1");
      expect(deleted).toBe(true);

      const check = await PujasService.getById(db, created.id);
      expect(check).toBeNull();

      await expect(PujasService.delete(db, created.id)).rejects.toThrow("not found");
    });
  });

  describe("Search, Pagination, and Visibility", () => {
    it("searches across name, slug, description, and offered samagri", async () => {
      await PujasService.create(db, {
        slug: "kali-aradhana",
        name: { en: "Special Kali Puja", bn: "" },
        description: { en: "Shyama puja with midnight aarti", bn: "" },
        offered: { en: "Hibiscus flowers and prasad", bn: "" },
      });
      await PujasService.create(db, {
        slug: "satyanarayan-katha",
        name: { en: "Satyanarayan Vrat", bn: "" },
        description: { en: "Household blessings", bn: "" },
        offered: { en: "Panchamrit and batasha", bn: "" },
      });

      // Search by offered item "Hibiscus"
      const resHibiscus = await PujasService.list(db, { search: "Hibiscus" });
      expect(resHibiscus.items.length).toBe(1);
      expect(resHibiscus.items[0].slug).toBe("kali-aradhana");

      // Search by description "blessings"
      const resBlessings = await PujasService.list(db, { search: "blessings" });
      expect(resBlessings.items.length).toBe(1);
      expect(resBlessings.items[0].slug).toBe("satyanarayan-katha");

      // Search by slug "kali"
      const resSlug = await PujasService.list(db, { search: "kali" });
      expect(resSlug.items.length).toBe(1);
    });

    it("paginates and filters by active and bookable status", async () => {
      for (let i = 1; i <= 6; i++) {
        await PujasService.create(db, {
          slug: `puja-item-${i}`,
          name: { en: `Puja Item ${i}`, bn: "" },
          description: { en: `Desc ${i}`, bn: "" },
          sortOrder: i,
          active: i % 2 !== 0, // odd = active, even = inactive
          bookable: i <= 3, // 1..3 bookable, 4..6 not
        });
      }

      // Pagination
      const page1 = await PujasService.list(db, { page: 1, pageSize: 4 });
      expect(page1.items.length).toBe(4);
      expect(page1.total).toBe(6);
      expect(page1.totalPages).toBe(2);

      // Active only
      const activeOnly = await PujasService.list(db, { active: true });
      expect(activeOnly.items.length).toBe(3);

      // Bookable only
      const bookableOnly = await PujasService.list(db, { bookable: true });
      expect(bookableOnly.items.length).toBe(3);

      // Public endpoints never show inactive
      const publicList = await PujasService.getPublicList(db);
      expect(publicList.length).toBe(3);
      expect(publicList.every((p) => p.active)).toBe(true);
    });
  });
});
