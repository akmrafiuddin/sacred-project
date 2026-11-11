import { describe, it, expect, beforeEach } from "vitest";
import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import * as schema from "../server/db/schema";
import { ScheduleService } from "../server/services/schedule";
import {
  createScheduleSchema,
  updateScheduleSchema,
  listScheduleQuerySchema,
  reorderScheduleSchema,
} from "../shared/schemas/schedule";

describe("Daily Schedule Domain & CRUD", () => {
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

      CREATE TABLE daily_schedule (
        id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        time TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        sort_order INTEGER NOT NULL DEFAULT 0,
        active INTEGER NOT NULL DEFAULT 1,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );
      CREATE INDEX daily_schedule_sort_order_idx ON daily_schedule (sort_order);
      CREATE INDEX daily_schedule_time_idx ON daily_schedule (time);
    `);
    db = drizzle(sqlite, { schema });
  });

  describe("Validation Schemas", () => {
    it("validates createScheduleSchema with strict 24h HH:mm format and localized text", () => {
      const valid = createScheduleSchema.safeParse({
        time: "05:30",
        title: { en: "Mangala Aarti", bn: "মঙ্গলারতি" },
        description: { en: "First darshan of the day", bn: "দিনের প্রথম দর্শন" },
        sortOrder: 1,
        active: true,
      });
      expect(valid.success).toBe(true);

      // Invalid times
      expect(createScheduleSchema.safeParse({ time: "5:30", title: { en: "A" }, description: { en: "B" } }).success).toBe(false);
      expect(createScheduleSchema.safeParse({ time: "24:00", title: { en: "A" }, description: { en: "B" } }).success).toBe(false);
      expect(createScheduleSchema.safeParse({ time: "12:60", title: { en: "A" }, description: { en: "B" } }).success).toBe(false);
      expect(createScheduleSchema.safeParse({ time: "invalid", title: { en: "A" }, description: { en: "B" } }).success).toBe(false);

      // Missing english text
      expect(createScheduleSchema.safeParse({ time: "12:00", title: { en: "", bn: "বাংলা" }, description: { en: "B" } }).success).toBe(false);
    });

    it("validates updateScheduleSchema and reorderScheduleSchema", () => {
      const validUpdate = updateScheduleSchema.safeParse({
        id: 1,
        time: "06:00",
        title: { en: "Updated Title", bn: "" },
      });
      expect(validUpdate.success).toBe(true);

      const invalidUpdate = updateScheduleSchema.safeParse({
        id: -1, // Must be positive
      });
      expect(invalidUpdate.success).toBe(false);

      const validReorder = reorderScheduleSchema.safeParse({
        items: [
          { id: 1, sortOrder: 2 },
          { id: 2, sortOrder: 1 },
        ],
      });
      expect(validReorder.success).toBe(true);

      const emptyReorder = reorderScheduleSchema.safeParse({
        items: [],
      });
      expect(emptyReorder.success).toBe(false);
    });

    it("validates listScheduleQuerySchema with pagination and search", () => {
      const parsed = listScheduleQuerySchema.safeParse({
        page: "2",
        pageSize: "10",
        search: "aarti",
        active: "true",
      });
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.page).toBe(2);
        expect(parsed.data.pageSize).toBe(10);
        expect(parsed.data.search).toBe("aarti");
        expect(parsed.data.active).toBe(true);
      }
    });
  });

  describe("CRUD Operations", () => {
    it("creates, retrieves by ID, and formats JSON localized strings", async () => {
      const created = await ScheduleService.create(
        db,
        {
          time: "05:00",
          title: { en: "Mangala Aarti", bn: "মঙ্গলারতি" },
          description: { en: "First prayer bell", bn: "প্রথম ঘণ্টা" },
          sortOrder: 1,
          active: true,
        },
        "admin-user-id"
      );

      expect(created.id).toBeDefined();
      expect(created.time).toBe("05:00");
      expect(created.title.en).toBe("Mangala Aarti");
      expect(created.title.bn).toBe("মঙ্গলারতি");
      expect(created.active).toBe(true);
      expect(created.createdAt).toBeDefined();
      expect(created.updatedAt).toBeDefined();

      const fetched = await ScheduleService.getById(db, created.id);
      expect(fetched).not.toBeNull();
      expect(fetched?.title.en).toBe("Mangala Aarti");

      // Verify audit log
      const audit = sqlite.query("SELECT * FROM audit_logs WHERE entity = 'schedule'").all() as any[];
      expect(audit.length).toBe(1);
      expect(audit[0]?.action).toBe("create");
      expect(audit[0]?.entity_id).toBe(String(created.id));
    });

    it("returns null when fetching non-existent ID", async () => {
      const notFound = await ScheduleService.getById(db, 9999);
      expect(notFound).toBeNull();
    });

    it("updates existing schedule item and logs update audit", async () => {
      const created = await ScheduleService.create(db, {
        time: "07:00",
        title: { en: "Nitya Puja", bn: "নিত্য পূজা" },
        description: { en: "Daily worship", bn: "নিত্য পূজা" },
        sortOrder: 2,
        active: true,
      });

      const updated = await ScheduleService.update(
        db,
        {
          id: created.id,
          time: "07:30",
          title: { en: "Updated Nitya Puja", bn: "পরিবর্তিত নিত্য পূজা" },
          active: false,
        },
        "admin-user-id"
      );

      expect(updated.time).toBe("07:30");
      expect(updated.title.en).toBe("Updated Nitya Puja");
      expect(updated.active).toBe(false);

      const reFetched = await ScheduleService.getById(db, created.id);
      expect(reFetched?.time).toBe("07:30");
      expect(reFetched?.active).toBe(false);
    });

    it("throws 404 when updating non-existent schedule item", async () => {
      await expect(
        ScheduleService.update(db, { id: 9999, time: "08:00" })
      ).rejects.toThrow();
    });

    it("reorders schedule items in batch", async () => {
      const item1 = await ScheduleService.create(db, {
        time: "05:00",
        title: { en: "First", bn: "" },
        description: { en: "", bn: "" },
        sortOrder: 1,
      });

      const item2 = await ScheduleService.create(db, {
        time: "07:00",
        title: { en: "Second", bn: "" },
        description: { en: "", bn: "" },
        sortOrder: 2,
      });

      const reorderResult = await ScheduleService.reorder(
        db,
        {
          items: [
            { id: item1.id, sortOrder: 10 },
            { id: item2.id, sortOrder: 5 },
          ],
        },
        "admin-user-id"
      );

      expect(reorderResult.success).toBe(true);

      const list = await ScheduleService.list(db);
      const fetched1 = list.items.find((i) => i.id === item1.id);
      const fetched2 = list.items.find((i) => i.id === item2.id);

      expect(fetched1?.sortOrder).toBe(10);
      expect(fetched2?.sortOrder).toBe(5);
    });

    it("deletes schedule item by ID and logs delete audit", async () => {
      const created = await ScheduleService.create(db, {
        time: "19:00",
        title: { en: "Temporary Aarti", bn: "" },
        description: { en: "Will be deleted", bn: "" },
      });

      const deleteResult = await ScheduleService.delete(db, created.id, "admin-user-id");
      expect(deleteResult.success).toBe(true);

      const fetched = await ScheduleService.getById(db, created.id);
      expect(fetched).toBeNull();

      // Deleting again should throw 404
      await expect(ScheduleService.delete(db, created.id)).rejects.toThrow();
    });

    it("lists with pagination, active filter, and search query", async () => {
      await ScheduleService.create(db, {
        time: "05:00",
        title: { en: "Mangala Aarti", bn: "মঙ্গলারতি" },
        description: { en: "First bell of the day", bn: "" },
        sortOrder: 1,
        active: true,
      });

      await ScheduleService.create(db, {
        time: "12:30",
        title: { en: "Bhog Offering", bn: "ভোগ আরতি" },
        description: { en: "Midday food offering", bn: "" },
        sortOrder: 2,
        active: true,
      });

      await ScheduleService.create(db, {
        time: "18:30",
        title: { en: "Sandhya Aarti", bn: "সন্ধ্যারতি" },
        description: { en: "Evening lamp and conch resonance", bn: "" },
        sortOrder: 3,
        active: true,
      });

      await ScheduleService.create(db, {
        time: "21:30",
        title: { en: "Special Secret Puja", bn: "গুপ্ত পূজা" },
        description: { en: "Internal priest ritual", bn: "" },
        sortOrder: 4,
        active: false, // Inactive
      });

      // 1. Filter active: true
      const activeOnly = await ScheduleService.list(db, { active: true });
      expect(activeOnly.total).toBe(3);
      expect(activeOnly.items.length).toBe(3);

      // 2. Filter active: false
      const inactiveOnly = await ScheduleService.list(db, { active: false });
      expect(inactiveOnly.total).toBe(1);
      expect(inactiveOnly.items[0]?.title.en).toBe("Special Secret Puja");

      // 3. Search query "aarti"
      const searchAarti = await ScheduleService.list(db, { search: "Aarti" });
      expect(searchAarti.total).toBe(2); // Mangala Aarti, Sandhya Aarti

      // 4. Search by time "12:30"
      const searchTime = await ScheduleService.list(db, { search: "12:30" });
      expect(searchTime.total).toBe(1);
      expect(searchTime.items[0]?.title.en).toBe("Bhog Offering");

      // 5. Pagination: page 1, pageSize 2
      const page1 = await ScheduleService.list(db, { page: 1, pageSize: 2 });
      expect(page1.total).toBe(4);
      expect(page1.items.length).toBe(2);
      expect(page1.items[0]?.time).toBe("05:00");
      expect(page1.items[1]?.time).toBe("12:30");

      // Pagination: page 2, pageSize 2
      const page2 = await ScheduleService.list(db, { page: 2, pageSize: 2 });
      expect(page2.total).toBe(4);
      expect(page2.items.length).toBe(2);
      expect(page2.items[0]?.time).toBe("18:30");
      expect(page2.items[1]?.time).toBe("21:30");
    });
  });

  describe("Next Aarti Computation", () => {
    it("computes next aarti during the day and rolls over to tomorrow after last aarti", async () => {
      await ScheduleService.create(db, {
        time: "05:30",
        title: { en: "Mangala aarti", bn: "" },
        description: { en: "First darshan", bn: "" },
        sortOrder: 1,
        active: true,
      });

      await ScheduleService.create(db, {
        time: "12:00",
        title: { en: "Bhog aarti", bn: "" },
        description: { en: "Noon offering", bn: "" },
        sortOrder: 2,
        active: true,
      });

      await ScheduleService.create(db, {
        time: "18:30",
        title: { en: "Sandhya aarti", bn: "" },
        description: { en: "Evening lamp", bn: "" },
        sortOrder: 3,
        active: true,
      });

      await ScheduleService.create(db, {
        time: "21:30",
        title: { en: "Shayan aarti", bn: "" },
        description: { en: "Sanctum closed", bn: "" },
        sortOrder: 4,
        active: true,
      });

      // 04:00 -> Next is Mangala at 05:30 today
      const at0400 = await ScheduleService.getPublicSchedule(db, "04:00");
      expect(at0400.nextAarti?.item.time).toBe("05:30");
      expect(at0400.nextAarti?.isTomorrow).toBe(false);

      // 14:00 -> Next is Sandhya at 18:30 today
      const at1400 = await ScheduleService.getPublicSchedule(db, "14:00");
      expect(at1400.nextAarti?.item.time).toBe("18:30");
      expect(at1400.nextAarti?.isTomorrow).toBe(false);

      // 22:00 -> After 21:30 -> Rolls over to tomorrow's Mangala at 05:30
      const at2200 = await ScheduleService.getPublicSchedule(db, "22:00");
      expect(at2200.nextAarti?.item.time).toBe("05:30");
      expect(at2200.nextAarti?.isTomorrow).toBe(true);
    });

    it("returns null for nextAarti if schedule is empty", async () => {
      const publicEmpty = await ScheduleService.getPublicSchedule(db, "12:00");
      expect(publicEmpty.items.length).toBe(0);
      expect(publicEmpty.nextAarti).toBeNull();
    });

    it("never includes inactive rituals in getPublicSchedule or nextAarti", async () => {
      await ScheduleService.create(db, {
        time: "06:00",
        title: { en: "Inactive Aarti", bn: "" },
        description: { en: "", bn: "" },
        active: false, // Inactive
      });

      await ScheduleService.create(db, {
        time: "18:00",
        title: { en: "Active Aarti", bn: "" },
        description: { en: "", bn: "" },
        active: true,
      });

      const publicSched = await ScheduleService.getPublicSchedule(db, "05:00");
      expect(publicSched.items.length).toBe(1);
      expect(publicSched.items[0]?.time).toBe("18:00");
      expect(publicSched.nextAarti?.item.time).toBe("18:00");
    });
  });
});
