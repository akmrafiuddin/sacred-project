import { describe, it, expect, beforeEach } from "vitest";
import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import * as schema from "../server/db/schema";
import { ScheduleService } from "../server/services/schedule";
import { createScheduleSchema } from "../shared/schemas/schedule";

describe("Phase 3 — Daily Schedule Domain", () => {
  let sqlite: Database;
  let db: any;

  beforeEach(() => {
    sqlite = new Database(":memory:");
    sqlite.run(`
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

  it("validates schedule input with Zod", () => {
    const valid = createScheduleSchema.safeParse({
      time: "05:30",
      title: { en: "Mangala Aarti", bn: "মঙ্গলারতি" },
      description: { en: "First darshan of the day", bn: "দিনের প্রথম দর্শন" },
      sortOrder: 1,
      active: true,
    });
    expect(valid.success).toBe(true);

    const invalidTime = createScheduleSchema.safeParse({
      time: "5:30", // Must be 2-digit HH:mm
      title: { en: "Test", bn: "" },
      description: { en: "Desc", bn: "" },
    });
    expect(invalidTime.success).toBe(false);
  });

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

    // Case 1: Early morning at 04:00 -> Next is Mangala at 05:30 today
    const at0400 = await ScheduleService.getPublicSchedule(db, "04:00");
    expect(at0400.nextAarti?.item.time).toBe("05:30");
    expect(at0400.nextAarti?.isTomorrow).toBe(false);

    // Case 2: Afternoon at 14:00 -> Next is Sandhya at 18:30 today
    const at1400 = await ScheduleService.getPublicSchedule(db, "14:00");
    expect(at1400.nextAarti?.item.time).toBe("18:30");
    expect(at1400.nextAarti?.isTomorrow).toBe(false);

    // Case 3: Late night at 22:00 (after 21:30 Shayan Aarti) -> Rolls over to Mangala at 05:30 tomorrow!
    const at2200 = await ScheduleService.getPublicSchedule(db, "22:00");
    expect(at2200.nextAarti?.item.time).toBe("05:30");
    expect(at2200.nextAarti?.isTomorrow).toBe(true);

    // Case 4: Midnight at 23:59 -> Rolls over to Mangala tomorrow
    const atMidnight = await ScheduleService.getPublicSchedule(db, "23:59");
    expect(atMidnight.nextAarti?.item.time).toBe("05:30");
    expect(atMidnight.nextAarti?.isTomorrow).toBe(true);
  });
});
