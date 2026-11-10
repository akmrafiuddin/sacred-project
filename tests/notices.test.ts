import { describe, it, expect, beforeEach } from "vitest";
import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import * as schema from "../server/db/schema";
import { NoticesService } from "../server/services/notices";
import { createNoticeSchema } from "../shared/schemas/notices";

describe("Phase 3 — Notices Domain", () => {
  let sqlite: Database;
  let db: any;

  beforeEach(() => {
    sqlite = new Database(":memory:");
    sqlite.run(`
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

  it("validates notice input with Zod", () => {
    const valid = createNoticeSchema.safeParse({
      slug: "mandir-timing-update",
      title: { en: "Mandir Timing Update", bn: "মন্দিরের সময়সূচী" },
      category: "timings",
      date: "2026-11-10",
      body: { en: "Morning gates open 5:30 AM", bn: "সকাল ৫:৩০ টায় খোলা হবে" },
      pinned: true,
      active: true,
    });
    expect(valid.success).toBe(true);
  });

  it("creates, retrieves, updates, and deletes notices", async () => {
    const created = await NoticesService.create(db, {
      slug: "kali-puja-guidelines",
      title: { en: "Kali Puja Guidelines", bn: "" },
      category: "festival",
      date: "2026-11-10",
      body: { en: "Devotees please queue peacefully", bn: "" },
      pinned: true,
      active: true,
    });

    expect(created.id).toBeDefined();
    expect(created.slug).toBe("kali-puja-guidelines");
    expect(created.pinned).toBe(true);

    const fetched = await NoticesService.getBySlug(db, "kali-puja-guidelines");
    expect(fetched).not.null;
    expect(fetched?.title.en).toBe("Kali Puja Guidelines");

    const updated = await NoticesService.update(db, {
      id: created.id,
      pinned: false,
    });
    expect(updated.pinned).toBe(false);

    const list = await NoticesService.list(db, { page: 1, pageSize: 10 });
    expect(list.total).toBe(1);

    const deleted = await NoticesService.delete(db, created.id);
    expect(deleted).toBe(true);
    expect(await NoticesService.getById(db, created.id)).toBeNull();
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
      title: { en: "Hidden Notice", bn: "" },
      date: "2026-11-10",
      body: { en: "Draft", bn: "" },
      pinned: false,
      active: false,
    });

    const publicNotices = await NoticesService.getPublicList(db);
    expect(publicNotices.length).toBe(2);
    // Pinned notice comes first even if date is earlier
    expect(publicNotices[0].slug).toBe("pinned-notice");
    expect(publicNotices[1].slug).toBe("regular-notice-1");

    // Public get by slug returns active, but null for inactive
    expect(await NoticesService.getPublicBySlug(db, "pinned-notice")).not.null;
    expect(await NoticesService.getPublicBySlug(db, "hidden-notice")).toBeNull();
  });
});
