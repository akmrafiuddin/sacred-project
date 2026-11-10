import { describe, it, expect, beforeEach } from "vitest";
import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import * as schema from "../server/db/schema";
import { PagesService } from "../server/services/pages";
import { createPageSchema } from "../shared/schemas/pages";

describe("Phase 3 — Pages Domain", () => {
  let sqlite: Database;
  let db: any;

  beforeEach(() => {
    sqlite = new Database(":memory:");
    sqlite.run(`
      CREATE TABLE pages (
        id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        title TEXT NOT NULL,
        body TEXT NOT NULL,
        published INTEGER NOT NULL DEFAULT 1,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );
      CREATE INDEX pages_slug_idx ON pages (slug);
      CREATE INDEX pages_published_idx ON pages (published);
    `);
    db = drizzle(sqlite, { schema });
  });

  it("validates page input with Zod", () => {
    const valid = createPageSchema.safeParse({
      slug: "about",
      title: { en: "About Kali Mandir", bn: "কালী মন্দির সম্পর্কে" },
      body: { en: "History and sacred origins...", bn: "ইতিহাস ও পবিত্র সূচনা..." },
      published: true,
    });
    expect(valid.success).toBe(true);
  });

  it("creates, updates, and fetches pages by slug", async () => {
    const created = await PagesService.create(db, {
      slug: "history",
      title: { en: "Temple History", bn: "" },
      body: { en: "Founded in the sacred heart of Chittagong", bn: "" },
      published: true,
    });

    expect(created.id).toBeDefined();
    expect(created.slug).toBe("history");

    const fetched = await PagesService.getBySlug(db, "history");
    expect(fetched).not.null;
    expect(fetched?.title.en).toBe("Temple History");

    const updated = await PagesService.update(db, {
      id: created.id,
      published: false,
    });
    expect(updated.published).toBe(false);

    // Published-only public getter returns null when published is false
    expect(await PagesService.getPublicBySlug(db, "history")).toBeNull();

    // Re-publish
    await PagesService.update(db, {
      id: created.id,
      published: true,
    });
    expect(await PagesService.getPublicBySlug(db, "history")).not.null;
  });
});
