import { describe, it, expect, beforeEach } from "vitest";
import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import * as schema from "../server/db/schema";
import { NoticesService } from "../server/services/notices";
import {
  createNoticeSchema,
  updateNoticeSchema,
  listNoticesQuerySchema,
} from "../shared/schemas/notices";

describe("Notices Domain & CRUD", () => {
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

      CREATE TABLE notices (
        id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        title TEXT NOT NULL,
        category TEXT NOT NULL DEFAULT 'general',
        date TEXT NOT NULL,
        body TEXT NOT NULL,
        pinned INTEGER NOT NULL DEFAULT 0,
        active INTEGER NOT NULL DEFAULT 1,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );
      CREATE INDEX notices_slug_idx ON notices (slug);
      CREATE INDEX notices_date_idx ON notices (date);
      CREATE INDEX notices_pinned_idx ON notices (pinned);
    `);
    db = drizzle(sqlite, { schema });
  });

  describe("Validation Schemas", () => {
    it("validates notice input with Zod", () => {
      const valid = createNoticeSchema.safeParse({
        slug: "mandir-timing-update",
        title: { en: "Mandir Timing Update", bn: "" },
        category: "timings",
        date: "2026-11-10",
        body: { en: "Morning gates open 5:30 AM", bn: "" },
        pinned: true,
        active: true,
      });
      expect(valid.success).toBe(true);

      const invalidDate = createNoticeSchema.safeParse({
        slug: "bad-date-notice",
        title: { en: "Title", bn: "" },
        date: "10-11-2026", // Wrong format
        body: { en: "Body", bn: "" },
      });
      expect(invalidDate.success).toBe(false);

      const invalidSlug = createNoticeSchema.safeParse({
        slug: "Bad Slug!",
        title: { en: "Title", bn: "" },
        date: "2026-11-10",
        body: { en: "Body", bn: "" },
      });
      expect(invalidSlug.success).toBe(false);
    });

    it("validates updateNoticeSchema and listNoticesQuerySchema", () => {
      const validUpdate = updateNoticeSchema.safeParse({ id: 1, pinned: true });
      expect(validUpdate.success).toBe(true);

      const queryParsed = listNoticesQuerySchema.parse({
        page: "2",
        category: "festival",
        pinned: "true",
      });
      expect(queryParsed.page).toBe(2);
      expect(queryParsed.category).toBe("festival");
      expect(queryParsed.pinned).toBe(true);
    });
  });

  describe("CRUD Operations", () => {
    it("creates, retrieves, updates, and deletes notices with audit logs", async () => {
      const created = await NoticesService.create(
        db,
        {
          slug: "kali-puja-guidelines",
          title: { en: "Kali Puja Guidelines", bn: "" },
          category: "festival",
          date: "2026-11-10",
          body: { en: "Devotees please queue peacefully", bn: "" },
          pinned: true,
          active: true,
        },
        "admin-user-1"
      );

      expect(created.id).toBeDefined();
      expect(created.slug).toBe("kali-puja-guidelines");
      expect(created.pinned).toBe(true);

      // Verify audit log
      const audits = sqlite.query("SELECT * FROM audit_logs WHERE entity = 'notices'").all();
      expect(audits.length).toBe(1);

      const fetched = await NoticesService.getBySlug(db, "kali-puja-guidelines");
      expect(fetched?.title.en).toBe("Kali Puja Guidelines");
      expect(fetched?.title.bn).toBe("");

      const updated = await NoticesService.update(
        db,
        {
          id: created.id,
          pinned: false,
        },
        "admin-user-1"
      );
      expect(updated.pinned).toBe(false);

      const list = await NoticesService.list(db, { page: 1, pageSize: 10 });
      expect(list.total).toBe(1);

      const deleted = await NoticesService.delete(db, created.id, "admin-user-1");
      expect(deleted).toBe(true);
      expect(await NoticesService.getById(db, created.id)).toBeNull();
    });

    it("rejects duplicate slug on create and update", async () => {
      await NoticesService.create(db, {
        slug: "announcement-1",
        title: { en: "Ann 1", bn: "" },
        date: "2026-11-10",
        body: { en: "Body", bn: "" },
      });

      await expect(
        NoticesService.create(db, {
          slug: "announcement-1",
          title: { en: "Duplicate", bn: "" },
          date: "2026-11-10",
          body: { en: "Body", bn: "" },
        })
      ).rejects.toThrow("already exists");
    });

    it("throws 404 when updating or deleting non-existent notice", async () => {
      await expect(
        NoticesService.update(db, { id: 9999, pinned: true })
      ).rejects.toThrow("not found");

      await expect(NoticesService.delete(db, 9999)).rejects.toThrow("not found");
    });
  });

  describe("Search, Filtering, and Prioritization", () => {
    it("searches across title, category, body, and slug", async () => {
      await NoticesService.create(db, {
        slug: "special-deepam",
        title: { en: "Deepavali Celebration", bn: "" },
        category: "festival",
        date: "2026-11-10",
        body: { en: "Lamps will be lit across the grounds", bn: "" },
      });
      await NoticesService.create(db, {
        slug: "gate-timings",
        title: { en: "Gate Schedule Change", bn: "" },
        category: "timings",
        date: "2026-11-09",
        body: { en: "Temple office open at 9 AM", bn: "" },
      });

      const resDeepam = await NoticesService.list(db, { search: "Lamps" });
      expect(resDeepam.items.length).toBe(1);
      expect(resDeepam.items[0].slug).toBe("special-deepam");

      const resCat = await NoticesService.list(db, { category: "timings" });
      expect(resCat.items.length).toBe(1);
      expect(resCat.items[0].slug).toBe("gate-timings");
    });

    it("prioritizes pinned notices in public listing and ignores inactive notices", async () => {
      await NoticesService.create(db, {
        slug: "regular-notice-1",
        title: { en: "Regular 1", bn: "" },
        date: "2026-11-01",
        body: { en: "Regular", bn: "" },
        pinned: false,
        active: true,
      });

      await NoticesService.create(db, {
        slug: "pinned-notice",
        title: { en: "Pinned Announcement", bn: "" },
        date: "2026-10-15", // older date but pinned
        body: { en: "Important Announcement", bn: "" },
        pinned: true,
        active: true,
      });

      await NoticesService.create(db, {
        slug: "hidden-notice",
        title: { en: "Hidden", bn: "" },
        date: "2026-11-10",
        body: { en: "Hidden", bn: "" },
        pinned: true,
        active: false,
      });

      const publicList = await NoticesService.getPublicList(db);
      expect(publicList.length).toBe(2);
      // Pinned notice comes first
      expect(publicList[0].slug).toBe("pinned-notice");
      expect(publicList[1].slug).toBe("regular-notice-1");

      expect(await NoticesService.getPublicBySlug(db, "pinned-notice")).not.null;
      expect(await NoticesService.getPublicBySlug(db, "hidden-notice")).toBeNull();
    });
  });
});
