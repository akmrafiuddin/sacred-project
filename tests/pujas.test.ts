import { describe, it, expect, beforeEach } from "vitest";
import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import * as schema from "../server/db/schema";
import { PujasService } from "../server/services/pujas";
import { createPujaSchema } from "../shared/schemas/pujas";

describe("Phase 3 — Pujas Domain", () => {
  let sqlite: Database;
  let db: any;

  beforeEach(() => {
    sqlite = new Database(":memory:");
    sqlite.run(`
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

  it("validates puja input with Zod", () => {
    const valid = createPujaSchema.safeParse({
      slug: "nitya-puja",
      name: { en: "Nitya Puja", bn: "নিত্য পূজা" },
      description: { en: "Daily worship", bn: "দৈনিক অর্চনা" },
      offered: { en: "Flowers, bhog", bn: "ফুল, ভোগ" },
      priceBdt: 501,
      duration: "45 minutes",
      bookable: true,
      sortOrder: 1,
      active: true,
    });
    expect(valid.success).toBe(true);

    const negativePrice = createPujaSchema.safeParse({
      slug: "invalid-puja",
      name: { en: "Test", bn: "" },
      description: { en: "Desc", bn: "" },
      priceBdt: -100,
    });
    expect(negativePrice.success).toBe(false);
  });

  it("creates, updates, and reorders pujas", async () => {
    const p1 = await PujasService.create(db, {
      slug: "satyanarayan-puja",
      name: { en: "Satyanarayan Puja", bn: "" },
      description: { en: "Special vow", bn: "" },
      priceBdt: 1501,
      sortOrder: 2,
      active: true,
    });

    const p2 = await PujasService.create(db, {
      slug: "rudrabhishek",
      name: { en: "Rudrabhishek", bn: "" },
      description: { en: "Shiva worship", bn: "" },
      priceBdt: 2001,
      sortOrder: 1,
      active: true,
    });

    // Public list should be ordered by sortOrder: p2 (1), then p1 (2)
    const listBefore = await PujasService.getPublicList(db);
    expect(listBefore.length).toBe(2);
    expect(listBefore[0].slug).toBe("rudrabhishek");
    expect(listBefore[1].slug).toBe("satyanarayan-puja");

    // Reorder: set p1 to 0, p2 to 10
    await PujasService.reorder(db, {
      items: [
        { id: p1.id, sortOrder: 0 },
        { id: p2.id, sortOrder: 10 },
      ],
    });

    const listAfter = await PujasService.getPublicList(db);
    expect(listAfter[0].slug).toBe("satyanarayan-puja");
    expect(listAfter[1].slug).toBe("rudrabhishek");
  });

  it("does not expose inactive pujas to public endpoints", async () => {
    await PujasService.create(db, {
      slug: "active-puja",
      name: { en: "Active", bn: "" },
      description: { en: "Active", bn: "" },
      priceBdt: 501,
      active: true,
    });

    await PujasService.create(db, {
      slug: "inactive-puja",
      name: { en: "Inactive", bn: "" },
      description: { en: "Inactive", bn: "" },
      priceBdt: 501,
      active: false,
    });

    const publicList = await PujasService.getPublicList(db);
    expect(publicList.length).toBe(1);
    expect(publicList[0].slug).toBe("active-puja");

    expect(await PujasService.getPublicBySlug(db, "active-puja")).not.null;
    expect(await PujasService.getPublicBySlug(db, "inactive-puja")).toBeNull();
  });
});
