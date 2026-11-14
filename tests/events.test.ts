import { describe, it, expect, beforeEach } from "vitest";
import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import * as schema from "../server/db/schema";
import { EventsService } from "../server/services/events";
import {
  createEventSchema,
  updateEventSchema,
  listEventsQuerySchema,
} from "../shared/schemas/events";

describe("Events & Festivals Domain & CRUD", () => {
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

      CREATE TABLE events (
        id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        date TEXT NOT NULL,
        kind TEXT NOT NULL DEFAULT 'special_puja',
        title TEXT NOT NULL,
        label TEXT,
        time TEXT,
        description TEXT NOT NULL,
        active INTEGER NOT NULL DEFAULT 1,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );
      CREATE INDEX events_date_idx ON events (date);
      CREATE INDEX events_slug_idx ON events (slug);
    `);
    db = drizzle(sqlite, { schema });
  });

  describe("Validation Schemas", () => {
    it("validates event input with Zod", () => {
      const valid = createEventSchema.safeParse({
        slug: "kali-puja-2026",
        date: "2026-11-10",
        kind: "festival",
        title: { en: "Maha Kali Puja", bn: "" },
        label: { en: "Deepavali Amavasya", bn: "" },
        time: "20:00",
        description: { en: "Grand annual worship", bn: "" },
        active: true,
      });
      expect(valid.success).toBe(true);

      const invalidSlug = createEventSchema.safeParse({
        slug: "Invalid Slug!",
        date: "2026-11-10",
        title: { en: "Test", bn: "" },
        description: { en: "Desc", bn: "" },
      });
      expect(invalidSlug.success).toBe(false);

      const invalidDate = createEventSchema.safeParse({
        slug: "valid-slug",
        date: "10-11-2026",
        title: { en: "Test", bn: "" },
        description: { en: "Desc", bn: "" },
      });
      expect(invalidDate.success).toBe(false);
    });

    it("validates updateEventSchema and listEventsQuerySchema", () => {
      const validUpdate = updateEventSchema.safeParse({
        id: 1,
        time: "19:30",
        title: { en: "Updated Puja", bn: "" },
      });
      expect(validUpdate.success).toBe(true);

      const invalidUpdate = updateEventSchema.safeParse({
        id: -2,
      });
      expect(invalidUpdate.success).toBe(false);

      const parsedQuery = listEventsQuerySchema.parse({
        page: "2",
        pageSize: "15",
        month: "2026-11",
        kind: "festival",
        active: "true",
      });
      expect(parsedQuery.page).toBe(2);
      expect(parsedQuery.pageSize).toBe(15);
      expect(parsedQuery.month).toBe("2026-11");
      expect(parsedQuery.kind).toBe("festival");
      expect(parsedQuery.active).toBe(true);
    });
  });

  describe("CRUD Operations & Audit Logging", () => {
    it("creates, retrieves, and updates an event with audit log", async () => {
      const created = await EventsService.create(
        db,
        {
          slug: "kali-deepam-2026",
          date: "2026-11-12",
          kind: "special_puja",
          title: { en: "Kali Deepam", bn: "" },
          label: { en: "Kartika Deepam", bn: "" },
          time: "18:30",
          description: { en: "Lamp offering ritual", bn: "" },
          active: true,
        },
        "admin-user-1"
      );

      expect(created.id).toBeDefined();
      expect(created.slug).toBe("kali-deepam-2026");
      expect(created.title.en).toBe("Kali Deepam");

      // Verify audit log
      const auditRows = sqlite
        .query("SELECT * FROM audit_logs WHERE entity = 'events' AND action = 'create'")
        .all();
      expect(auditRows.length).toBe(1);

      // Fetch by ID
      const byId = await EventsService.getById(db, created.id);
      expect(byId).not.toBeNull();
      expect(byId?.id).toBe(created.id);

      // Fetch by slug
      const fetched = await EventsService.getBySlug(db, "kali-deepam-2026");
      expect(fetched).not.toBeNull();
      expect(fetched?.slug).toBe("kali-deepam-2026");

      // Update
      const updated = await EventsService.update(
        db,
        {
          id: created.id,
          title: { en: "Maha Kali Deepam", bn: "" },
          time: "19:00",
        },
        "admin-user-1"
      );
      expect(updated.title.en).toBe("Maha Kali Deepam");
      expect(updated.time).toBe("19:00");

      // Verify update audit log
      const updateAudits = sqlite
        .query("SELECT * FROM audit_logs WHERE entity = 'events' AND action = 'update'")
        .all();
      expect(updateAudits.length).toBe(1);

      // List
      const list = await EventsService.list(db, { page: 1, pageSize: 10 });
      expect(list.total).toBe(1);
      expect(list.items[0].title.en).toBe("Maha Kali Deepam");
    });

    it("rejects duplicate slug on create and update", async () => {
      const first = await EventsService.create(db, {
        slug: "durga-puja-2026",
        date: "2026-10-15",
        kind: "festival",
        title: { en: "Durga Puja 2026", bn: "" },
        description: { en: "Autumn Festival", bn: "" },
      });

      await expect(
        EventsService.create(db, {
          slug: "durga-puja-2026",
          date: "2026-10-16",
          kind: "festival",
          title: { en: "Duplicate Event", bn: "" },
          description: { en: "Duplicate", bn: "" },
        })
      ).rejects.toThrow("already exists");

      const second = await EventsService.create(db, {
        slug: "lakshmi-puja-2026",
        date: "2026-10-25",
        kind: "festival",
        title: { en: "Lakshmi Puja", bn: "" },
        description: { en: "Kojagari", bn: "" },
      });

      // Update second event with first event's slug should fail
      await expect(
        EventsService.update(db, {
          id: second.id,
          slug: "durga-puja-2026",
        })
      ).rejects.toThrow("already exists");
    });

    it("throws 404 when updating or deleting non-existent event", async () => {
      await expect(
        EventsService.update(db, { id: 99999, time: "18:00" })
      ).rejects.toThrow("not found");

      await expect(EventsService.delete(db, 99999)).rejects.toThrow("not found");
    });

    it("deletes event and records audit log", async () => {
      const created = await EventsService.create(db, {
        slug: "temp-event",
        date: "2026-11-20",
        kind: "special_puja",
        title: { en: "Temp Event", bn: "" },
        description: { en: "Temporary", bn: "" },
      });

      const deleted = await EventsService.delete(db, created.id, "admin-user-1");
      expect(deleted).toBe(true);

      const check = await EventsService.getById(db, created.id);
      expect(check).toBeNull();

      const deleteAudits = sqlite
        .query("SELECT * FROM audit_logs WHERE entity = 'events' AND action = 'delete'")
        .all();
      expect(deleteAudits.length).toBe(1);
    });
  });

  describe("Filtering, Search, and Public Endpoints", () => {
    it("filters events by month and upcoming date", async () => {
      await EventsService.create(db, {
        slug: "nov-event-1",
        date: "2026-11-05",
        kind: "festival",
        title: { en: "Nov Event 1", bn: "" },
        description: { en: "Nov", bn: "" },
        active: true,
      });

      await EventsService.create(db, {
        slug: "nov-event-2",
        date: "2026-11-20",
        kind: "festival",
        title: { en: "Nov Event 2", bn: "" },
        description: { en: "Nov", bn: "" },
        active: true,
      });

      await EventsService.create(db, {
        slug: "dec-event",
        date: "2026-12-01",
        kind: "festival",
        title: { en: "Dec Event", bn: "" },
        description: { en: "Dec", bn: "" },
        active: true,
      });

      const novEvents = await EventsService.getByMonth(db, "2026-11");
      expect(novEvents.length).toBe(2);

      const upcomingFromNov10 = await EventsService.getUpcoming(db, {
        today: "2026-11-10",
        limit: 5,
      });
      expect(upcomingFromNov10.length).toBe(2); // nov-event-2 and dec-event
      expect(upcomingFromNov10[0].slug).toBe("nov-event-2");
    });

    it("searches across title, slug, label, and description", async () => {
      await EventsService.create(db, {
        slug: "amavasya-puja",
        date: "2026-11-15",
        kind: "special_puja",
        title: { en: "Monthly Shyama Puja", bn: "" },
        label: { en: "Kartika Amavasya", bn: "" },
        description: { en: "Sacred night aarti and havan", bn: "" },
      });

      await EventsService.create(db, {
        slug: "saraswati-puja",
        date: "2027-02-10",
        kind: "festival",
        title: { en: "Vasant Panchami", bn: "" },
        label: { en: "Shukla Panchami", bn: "" },
        description: { en: "Students prayer for wisdom", bn: "" },
      });

      // Search by label "Amavasya"
      const resLabel = await EventsService.list(db, { search: "Amavasya" });
      expect(resLabel.items.length).toBe(1);
      expect(resLabel.items[0].slug).toBe("amavasya-puja");

      // Search by description "havan"
      const resDesc = await EventsService.list(db, { search: "havan" });
      expect(resDesc.items.length).toBe(1);
      expect(resDesc.items[0].slug).toBe("amavasya-puja");

      // Search by slug "saraswati"
      const resSlug = await EventsService.list(db, { search: "saraswati" });
      expect(resSlug.items.length).toBe(1);
      expect(resSlug.items[0].slug).toBe("saraswati-puja");
    });

    it("never includes inactive events in public queries", async () => {
      await EventsService.create(db, {
        slug: "active-event",
        date: "2026-11-15",
        kind: "special_puja",
        title: { en: "Active", bn: "" },
        description: { en: "Active", bn: "" },
        active: true,
      });

      await EventsService.create(db, {
        slug: "inactive-event",
        date: "2026-11-16",
        kind: "special_puja",
        title: { en: "Inactive", bn: "" },
        description: { en: "Inactive", bn: "" },
        active: false,
      });

      const publicMonthList = await EventsService.getByMonth(db, "2026-11");
      expect(publicMonthList.length).toBe(1);
      expect(publicMonthList[0].slug).toBe("active-event");

      const upcoming = await EventsService.getUpcoming(db, { today: "2026-11-01" });
      expect(upcoming.length).toBe(1);
      expect(upcoming[0].slug).toBe("active-event");

      const publicBySlug = await EventsService.getPublicBySlug(db, "inactive-event");
      expect(publicBySlug).toBeNull();

      const activeBySlug = await EventsService.getPublicBySlug(db, "active-event");
      expect(activeBySlug).not.toBeNull();
      expect(activeBySlug?.slug).toBe("active-event");

      const publicList = await EventsService.getPublicList(db);
      expect(publicList.length).toBe(1);
      expect(publicList[0].slug).toBe("active-event");
    });
  });
});
