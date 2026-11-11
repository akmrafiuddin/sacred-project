import { describe, it, expect, beforeEach } from "vitest";
import { defaultAboutData, type AboutPageData } from "../server/cms/aboutDefaults";
import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import * as schema from "../server/db/schema";
import { eq } from "drizzle-orm";

describe("About Page CMS & Content Customization", () => {
  let sqlite: Database;
  let db: any;

  beforeEach(() => {
    sqlite = new Database(":memory:");
    sqlite.run(`
      CREATE TABLE home_cms (
        key TEXT PRIMARY KEY,
        data TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE pages (
        id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        title TEXT NOT NULL,
        body TEXT NOT NULL,
        published INTEGER NOT NULL DEFAULT 1,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );
    `);
    db = drizzle(sqlite, { schema });
  });

  it("verifies defaultAboutData structure and required fields", () => {
    expect(defaultAboutData.hero.titleEn).toBe("Sanctuary of Devotion, Peace & Community");
    expect(defaultAboutData.hero.titleBn).toBe("শ্রীশ্রী গোলপাহাড় মহাশ্মশান কালী মন্দির");
    expect(defaultAboutData.history.narrativeParagraphs.length).toBeGreaterThan(0);
    expect(defaultAboutData.pillars.length).toBe(4);
    expect(defaultAboutData.shrines.length).toBe(4);
    expect(defaultAboutData.guidelines.length).toBe(5);
  });

  it("stores and retrieves customized about page data", async () => {
    const customData: AboutPageData = {
      ...defaultAboutData,
      hero: {
        ...defaultAboutData.hero,
        titleEn: "Custom Sanctum Heritage",
      },
    };

    // Simulate saving to home_cms
    await db.insert(schema.homeCms).values({
      key: "aboutpage",
      data: JSON.stringify(customData),
      updatedAt: new Date().toISOString(),
    });

    const records = await db
      .select()
      .from(schema.homeCms)
      .where(eq(schema.homeCms.key, "aboutpage"))
      .limit(1);

    expect(records.length).toBe(1);
    const parsed = JSON.parse(records[0].data);
    expect(parsed.hero.titleEn).toBe("Custom Sanctum Heritage");
  });

  it("syncs about page to pages table with slug 'about'", async () => {
    const now = Date.now();
    await db.insert(schema.pages).values({
      slug: "about",
      title: JSON.stringify({ en: defaultAboutData.hero.titleEn, bn: defaultAboutData.hero.titleBn }),
      body: JSON.stringify({
        en: defaultAboutData.history.narrativeParagraphs.join("\n\n"),
        bn: defaultAboutData.hero.subtitle,
      }),
      published: true,
      createdAt: now,
      updatedAt: now,
    });

    const rows = await db.select().from(schema.pages).where(eq(schema.pages.slug, "about")).limit(1);
    expect(rows.length).toBe(1);
    expect(rows[0].slug).toBe("about");
    const title = JSON.parse(rows[0].title);
    expect(title.en).toBe("Sanctuary of Devotion, Peace & Community");
  });
});
