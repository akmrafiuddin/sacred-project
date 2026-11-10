import { describe, it, expect, beforeEach } from "vitest";
import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import * as schema from "../server/db/schema";
import { DeitiesService } from "../server/services/deities";
import { createDeitySchema } from "../shared/schemas/deities";

describe("Phase 3 — Deities Domain", () => {
  let sqlite: Database;
  let db: any;

  beforeEach(() => {
    sqlite = new Database(":memory:");
    sqlite.run(`
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
  });

  it("creates, updates, and reorders deities", async () => {
    const d1 = await DeitiesService.create(db, {
      slug: "maa-kali",
      name: { en: "Maa Kali", bn: "" },
      description: { en: "Presiding Divine Mother", bn: "" },
      sortOrder: 1,
      active: true,
    });

    const d2 = await DeitiesService.create(db, {
      slug: "lord-shiva",
      name: { en: "Lord Shiva", bn: "" },
      description: { en: "The Eternal Auspicious One", bn: "" },
      sortOrder: 2,
      active: true,
    });

    const publicList = await DeitiesService.getPublicList(db);
    expect(publicList.length).toBe(2);
    expect(publicList[0].slug).toBe("maa-kali");
    expect(publicList[1].slug).toBe("lord-shiva");

    // Reorder: swap orders
    await DeitiesService.reorder(db, {
      items: [
        { id: d1.id, sortOrder: 5 },
        { id: d2.id, sortOrder: 1 },
      ],
    });

    const reorderedList = await DeitiesService.getPublicList(db);
    expect(reorderedList[0].slug).toBe("lord-shiva");
    expect(reorderedList[1].slug).toBe("maa-kali");
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
