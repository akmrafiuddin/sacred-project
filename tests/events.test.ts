import { describe, it, expect, beforeEach } from "vitest";
import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import * as schema from "../server/db/schema";
import { EventsService } from "../server/services/events";
import { createEventSchema, listEventsQuerySchema } from "../shared/schemas/events";

describe("Phase 3 — Events Domain", () => {
  let sqlite: Database;
  let db: any;

  beforeEach(() => {
    sqlite = new Database(":memory:");
    sqlite.run(`
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

  it("validates event input with Zod", () => {
    const valid = createEventSchema.safeParse({
      slug: "kali-puja-2026",
      date: "2026-11-10",
      kind: "festival",
      title: { en: "Maha Kali Puja", bn: "মহা কালী পূজা" },
      label: { en: "Deepavali Amavasya", bn: "দীপাবলি অমাবস্যা" },
      time: "20:00",
      description: { en: "Grand annual worship", bn: "বার্ষিক পূজা" },
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

  it("creates, retrieves, and updates an event through EventsService", async () => {
    const created = await EventsService.create(db, {
      slug: "kali-deepam-2026",
      date: "2026-11-12",
      kind: "special_puja",
      title: { en: "Kali Deepam", bn: "" },
      label: { en: "Kartika Deepam", bn: "" },
      time: "18:30",
      description: { en: "Lamp offering", bn: "" },
      active: true,
    });

    expect(created.id).toBeDefined();
    expect(created.slug).toBe("kali-deepam-2026");
    expect(created.title.en).toBe("Kali Deepam");

    // Fetch by slug
    const fetched = await EventsService.getBySlug(db, "kali-deepam-2026");
    expect(fetched).not.null;
    expect(fetched?.slug).toBe("kali-deepam-2026");

    // Update
    const updated = await EventsService.update(db, {
      id: created.id,
      title: { en: "Maha Kali Deepam", bn: "" },
    });
    expect(updated.title.en).toBe("Maha Kali Deepam");

    // List
    const list = await EventsService.list(db, { page: 1, pageSize: 10 });
    expect(list.total).toBe(1);
    expect(list.items[0].title.en).toBe("Maha Kali Deepam");
  });

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

    const publicList = await EventsService.getByMonth(db, "2026-11");
    expect(publicList.length).toBe(1);
    expect(publicList[0].slug).toBe("active-event");

    const upcoming = await EventsService.getUpcoming(db, { today: "2026-11-01" });
    expect(upcoming.length).toBe(1);
    expect(upcoming[0].slug).toBe("active-event");
  });
});
