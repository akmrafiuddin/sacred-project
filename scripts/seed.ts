import fs from "node:fs";
import path from "node:path";
import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { eq, and } from "drizzle-orm";
import * as schema from "../server/db/schema";
import { defaultHomeData } from "../server/cms/defaults";

function findLocalD1Path(): string | null {
  const d1Dir = path.resolve(process.cwd(), ".wrangler/state/v3/d1/miniflare-D1DatabaseObject");
  if (!fs.existsSync(d1Dir)) return null;
  const files = fs.readdirSync(d1Dir);
  const dbFile = files.find((f) => f.endsWith(".sqlite") && !f.startsWith("metadata"));
  return dbFile ? path.join(d1Dir, dbFile) : null;
}

export async function seedContentDatabase() {
  console.log("[seed] Seeding temple content from defaults.ts...");

  const dbPath = findLocalD1Path();
  if (!dbPath) {
    throw new Error(
      "[seed] Local D1 database file not found. Run 'bun run db:local' first to initialize migrations."
    );
  }

  const sqlite = new Database(dbPath);
  const db = drizzle(sqlite, { schema });
  const now = Date.now();

  // 1. Seed Site Content (home_cms)
  console.log("  → Seeding site_content (homepage)...");
  await db
    .insert(schema.homeCms)
    .values({
      key: "homepage",
      data: JSON.stringify(defaultHomeData),
      updatedAt: new Date().toISOString(),
    })
    .onConflictDoUpdate({
      target: schema.homeCms.key,
      set: {
        data: JSON.stringify(defaultHomeData),
        updatedAt: new Date().toISOString(),
      },
    });

  // 2. Seed Daily Schedule
  console.log("  → Seeding daily_schedule (5 items)...");
  const timeMap: Record<string, string> = {
    "01": "05:00",
    "02": "07:00",
    "03": "12:30",
    "04": "18:30",
    "05": "21:30",
  };

  for (let i = 0; i < defaultHomeData.dailySchedule.length; i++) {
    const item = defaultHomeData.dailySchedule[i];
    const time24 = timeMap[item.step] || "06:00";
    const existing = await db
      .select()
      .from(schema.dailySchedule)
      .where(eq(schema.dailySchedule.time, time24))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(schema.dailySchedule)
        .set({
          title: JSON.stringify({ en: item.title, bn: "" }),
          description: JSON.stringify({ en: item.description, bn: "" }),
          sortOrder: i + 1,
          updatedAt: now,
        })
        .where(eq(schema.dailySchedule.id, existing[0].id));
    } else {
      await db.insert(schema.dailySchedule).values({
        time: time24,
        title: JSON.stringify({ en: item.title, bn: "" }),
        description: JSON.stringify({ en: item.description, bn: "" }),
        sortOrder: i + 1,
        active: true,
        createdAt: now,
        updatedAt: now,
      });
    }
  }

  // 3. Seed Pujas
  console.log("  → Seeding pujas (4 items)...");
  const priceMap: Record<string, number> = {
    "nitya-puja": 501,
    "satyanarayan-puja": 1501,
    rudrabhishek: 2001,
    "kali-puja": 2501,
  };

  for (let i = 0; i < defaultHomeData.pujaOfferings.length; i++) {
    const p = defaultHomeData.pujaOfferings[i];
    const price = priceMap[p.id] || 501;

    const existing = await db
      .select()
      .from(schema.pujas)
      .where(eq(schema.pujas.slug, p.id))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(schema.pujas)
        .set({
          name: JSON.stringify({ en: p.title, bn: "" }),
          description: JSON.stringify({ en: p.description, bn: "" }),
          offered: JSON.stringify({ en: p.offered, bn: "" }),
          priceBdt: price,
          duration: p.duration,
          sortOrder: i + 1,
          updatedAt: now,
        })
        .where(eq(schema.pujas.id, existing[0].id));
    } else {
      await db.insert(schema.pujas).values({
        slug: p.id,
        name: JSON.stringify({ en: p.title, bn: "" }),
        description: JSON.stringify({ en: p.description, bn: "" }),
        offered: JSON.stringify({ en: p.offered, bn: "" }),
        priceBdt: price,
        duration: p.duration,
        bookable: true,
        sortOrder: i + 1,
        active: true,
        createdAt: now,
        updatedAt: now,
      });
    }
  }

  // 4. Seed Deities
  console.log("  → Seeding deities (5 items)...");
  for (let i = 0; i < defaultHomeData.deities.length; i++) {
    const d = defaultHomeData.deities[i];
    const existing = await db
      .select()
      .from(schema.deities)
      .where(eq(schema.deities.slug, d.id))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(schema.deities)
        .set({
          name: JSON.stringify({ en: d.name, bn: "" }),
          subtitle: JSON.stringify({ en: d.title, bn: "" }),
          description: JSON.stringify({ en: d.description, bn: "" }),
          imageId: d.image,
          sortOrder: i + 1,
          updatedAt: now,
        })
        .where(eq(schema.deities.id, existing[0].id));
    } else {
      await db.insert(schema.deities).values({
        slug: d.id,
        name: JSON.stringify({ en: d.name, bn: "" }),
        subtitle: JSON.stringify({ en: d.title, bn: "" }),
        description: JSON.stringify({ en: d.description, bn: "" }),
        imageId: d.image,
        sortOrder: i + 1,
        active: true,
        createdAt: now,
        updatedAt: now,
      });
    }
  }

  // 5. Seed Events (Special events + Upcoming festivals)
  console.log("  → Seeding events (8 items)...");
  for (const se of defaultHomeData.specialEvents) {
    const slug = `special-${se.id}`;
    const existing = await db
      .select()
      .from(schema.events)
      .where(eq(schema.events.slug, slug))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(schema.events)
        .set({
          date: se.dateStr,
          kind: "special_puja",
          title: JSON.stringify({ en: se.title, bn: "" }),
          label: JSON.stringify({ en: se.tithi, bn: "" }),
          time: se.time || null,
          description: JSON.stringify({ en: se.description, bn: "" }),
          updatedAt: now,
        })
        .where(eq(schema.events.id, existing[0].id));
    } else {
      await db.insert(schema.events).values({
        slug,
        date: se.dateStr,
        kind: "special_puja",
        title: JSON.stringify({ en: se.title, bn: "" }),
        label: JSON.stringify({ en: se.tithi, bn: "" }),
        time: se.time || null,
        description: JSON.stringify({ en: se.description, bn: "" }),
        active: true,
        createdAt: now,
        updatedAt: now,
      });
    }
  }

  const festivalDates: Record<string, string> = {
    "maha-shivaratri": "2026-03-08",
    "dol-purnima": "2026-03-25",
    "rama-navami": "2026-04-17",
    "guru-purnima": "2026-07-21",
  };

  for (const f of defaultHomeData.upcomingFestivals) {
    const iso = festivalDates[f.id] || "2026-11-20";
    const existing = await db
      .select()
      .from(schema.events)
      .where(eq(schema.events.slug, f.id))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(schema.events)
        .set({
          date: iso,
          kind: "festival",
          title: JSON.stringify({ en: f.name, bn: "" }),
          label: JSON.stringify({ en: f.tithi, bn: "" }),
          description: JSON.stringify({ en: f.description, bn: "" }),
          updatedAt: now,
        })
        .where(eq(schema.events.id, existing[0].id));
    } else {
      await db.insert(schema.events).values({
        slug: f.id,
        date: iso,
        kind: "festival",
        title: JSON.stringify({ en: f.name, bn: "" }),
        label: JSON.stringify({ en: f.tithi, bn: "" }),
        description: JSON.stringify({ en: f.description, bn: "" }),
        active: true,
        createdAt: now,
        updatedAt: now,
      });
    }
  }

  // 6. Seed Notices
  console.log("  → Seeding notices (4 items)...");
  const noticeDates: Record<string, string> = {
    "notice-1": "2026-11-12",
    "notice-2": "2026-11-18",
    "notice-3": "2026-11-24",
    "notice-4": "2026-12-02",
  };

  for (let i = 0; i < defaultHomeData.templeNotices.length; i++) {
    const n = defaultHomeData.templeNotices[i];
    const dateStr = noticeDates[n.id] || "2026-11-10";

    const existing = await db
      .select()
      .from(schema.notices)
      .where(eq(schema.notices.slug, n.id))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(schema.notices)
        .set({
          title: JSON.stringify({ en: n.title, bn: "" }),
          category: n.category.toLowerCase(),
          date: dateStr,
          body: JSON.stringify({ en: n.summary, bn: "" }),
          pinned: i === 0,
          updatedAt: now,
        })
        .where(eq(schema.notices.id, existing[0].id));
    } else {
      await db.insert(schema.notices).values({
        slug: n.id,
        title: JSON.stringify({ en: n.title, bn: "" }),
        category: n.category.toLowerCase(),
        date: dateStr,
        body: JSON.stringify({ en: n.summary, bn: "" }),
        pinned: i === 0,
        active: true,
        createdAt: now,
        updatedAt: now,
      });
    }
  }

  // 7. Seed Pages (About, Plan a visit, History, Seva)
  console.log("  → Seeding static pages...");
  const corePages = [
    {
      slug: "about",
      title: { en: "About the Holy Sanctum", bn: "" },
      body: {
        en: "Golpahar Mohashoshan Kali Mandir is a sacred refuge of worship, prayer, peace, and spiritual awakening in Chittagong, Bangladesh. For generations, devotees gather here for divine darshan of Bhavatarini Maa Kali, partake in evening aarti lamps, and partake in daily community Annadanam prasad.",
        bn: "",
      },
    },
    {
      slug: "plan-a-visit",
      title: { en: "Plan Your Holy Visit", bn: "" },
      body: {
        en: "Temple gates open daily from 5:00 AM to 1:00 PM, and re-open from 4:30 PM to 9:30 PM. Devotees are requested to dress respectfully, remove footwear before entering the parikrama hall, and maintain quiet sanctity within the garbhagriha.",
        bn: "",
      },
    },
    {
      slug: "history",
      title: { en: "Sacred Origins & History", bn: "" },
      body: {
        en: "Rooted in the eternal spiritual tradition of Chattogram, Golpahar is celebrated as an ancient seat of tantric sadhana and devotion to Mahashoshan Kali. The temple has stood through centuries as a beacon of resilience, faith, and unconditional divine sanctuary.",
        bn: "",
      },
    },
    {
      slug: "seva",
      title: { en: "Partake in Devotee Seva", bn: "" },
      body: {
        en: "Seva is at the heart of our mandir. From early morning flower garlands and Vedic Chandi chanting to mid-day Annadanam cooking and holy prasad distribution, all devotees are welcome to offer their heartfelt service.",
        bn: "",
      },
    },
  ];

  for (const page of corePages) {
    const existing = await db
      .select()
      .from(schema.pages)
      .where(eq(schema.pages.slug, page.slug))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(schema.pages)
        .set({
          title: JSON.stringify(page.title),
          body: JSON.stringify(page.body),
          published: true,
          updatedAt: now,
        })
        .where(eq(schema.pages.id, existing[0].id));
    } else {
      await db.insert(schema.pages).values({
        slug: page.slug,
        title: JSON.stringify(page.title),
        body: JSON.stringify(page.body),
        published: true,
        createdAt: now,
        updatedAt: now,
      });
    }
  }

  // 8. Seed Starter Albums
  console.log("  → Seeding starter gallery albums...");
  const starterAlbums = [
    {
      slug: "kali-puja-deepotsav",
      title: { en: "Kali Puja & Deepotsav Celebrations", bn: "" },
      description: { en: "Sacred lamps and grand aarti during annual festival", bn: "" },
      cover: "/images/deities/kali.jpg",
      sortOrder: 1,
      items: [
        { mediaId: "/images/deities/kali.jpg", caption: { en: "Bhavatarini Maa Kali Darshan", bn: "" }, sortOrder: 1 },
        { mediaId: "/images/deities/shiva.jpg", caption: { en: "Mahadeva Shiva Lingam", bn: "" }, sortOrder: 2 },
      ],
    },
    {
      slug: "mandir-sanctum-darshan",
      title: { en: "Mandir Sanctum & Deities", bn: "" },
      description: { en: "Divine shrines of Shiva, Ganesha, Krishna, and Lakshmi", bn: "" },
      cover: "/images/deities/shiva.jpg",
      sortOrder: 2,
      items: [
        { mediaId: "/images/deities/ganesha.jpg", caption: { en: "Vighnaharta Ganesha", bn: "" }, sortOrder: 1 },
        { mediaId: "/images/deities/krishna.jpg", caption: { en: "Sri Radha Krishna", bn: "" }, sortOrder: 2 },
        { mediaId: "/images/deities/lakshmi.jpg", caption: { en: "Maa Lakshmi", bn: "" }, sortOrder: 3 },
      ],
    },
  ];

  for (const a of starterAlbums) {
    const existing = await db
      .select()
      .from(schema.albums)
      .where(eq(schema.albums.slug, a.slug))
      .limit(1);

    let albumId: number;
    if (existing.length > 0) {
      albumId = existing[0].id;
      await db
        .update(schema.albums)
        .set({
          title: JSON.stringify(a.title),
          description: JSON.stringify(a.description),
          cover: a.cover,
          sortOrder: a.sortOrder,
          updatedAt: now,
        })
        .where(eq(schema.albums.id, albumId));
    } else {
      const [inserted] = await db
        .insert(schema.albums)
        .values({
          slug: a.slug,
          title: JSON.stringify(a.title),
          description: JSON.stringify(a.description),
          cover: a.cover,
          sortOrder: a.sortOrder,
          active: true,
          createdAt: now,
          updatedAt: now,
        })
        .returning();
      albumId = inserted.id;
    }

    // Insert album items
    for (const item of a.items) {
      const existingItem = await db
        .select()
        .from(schema.albumItems)
        .where(
          and(
            eq(schema.albumItems.albumId, albumId),
            eq(schema.albumItems.mediaId, item.mediaId)
          )
        )
        .limit(1);

      if (existingItem.length === 0) {
        await db.insert(schema.albumItems).values({
          albumId,
          mediaId: item.mediaId,
          caption: JSON.stringify(item.caption),
          sortOrder: item.sortOrder,
          createdAt: now,
          updatedAt: now,
        });
      }
    }
  }

  console.log("[seed] ✅ All content seeded and synchronized successfully!");
}

if (import.meta.main) {
  seedContentDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("[seed] ❌ Error seeding database:", err);
      process.exit(1);
    });
}
