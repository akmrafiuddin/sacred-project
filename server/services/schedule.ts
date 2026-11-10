import { and, asc, eq } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import * as schema from "../db/schema";
import { dailySchedule } from "../db/schema/schedule";
import type {
  CreateScheduleInput,
  UpdateScheduleInput,
  ListScheduleQuery,
  ReorderScheduleInput,
} from "../../shared/schemas/schedule";

export interface FormattedScheduleItem {
  id: number;
  time: string;
  title: { en: string; bn: string };
  description: { en: string; bn: string };
  sortOrder: number;
  active: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface NextAartiResult {
  item: FormattedScheduleItem;
  isTomorrow: boolean;
  timeInDhaka: string;
}

export class ScheduleService {
  static async list(db: DrizzleD1Database<typeof schema>, query?: ListScheduleQuery) {
    const conditions = [];

    if (query?.active !== undefined) {
      conditions.push(eq(dailySchedule.active, query.active));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const items = await db
      .select()
      .from(dailySchedule)
      .where(whereClause)
      .orderBy(asc(dailySchedule.sortOrder), asc(dailySchedule.time));

    return {
      items: items.map(this.formatRow),
      total: items.length,
    };
  }

  static async getById(db: DrizzleD1Database<typeof schema>, id: number) {
    const rows = await db.select().from(dailySchedule).where(eq(dailySchedule.id, id)).limit(1);
    const row = rows[0];
    if (!row) return null;
    return this.formatRow(row);
  }

  static async create(db: DrizzleD1Database<typeof schema>, input: CreateScheduleInput) {
    const now = Date.now();
    const [inserted] = await db
      .insert(dailySchedule)
      .values({
        time: input.time,
        title: JSON.stringify(input.title),
        description: JSON.stringify(input.description),
        sortOrder: input.sortOrder ?? 0,
        active: input.active ?? true,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    if (!inserted) {
      throw new Error("Failed to insert schedule item");
    }

    return this.formatRow(inserted);
  }

  static async update(db: DrizzleD1Database<typeof schema>, input: UpdateScheduleInput) {
    const existing = await this.getById(db, input.id);
    if (!existing) {
      throw new Error(`Schedule item with ID ${input.id} not found`);
    }

    const now = Date.now();
    const updateData: Partial<typeof dailySchedule.$inferInsert> = {
      updatedAt: now,
    };

    if (input.time !== undefined) updateData.time = input.time;
    if (input.title !== undefined) updateData.title = JSON.stringify(input.title);
    if (input.description !== undefined)
      updateData.description = JSON.stringify(input.description);
    if (input.sortOrder !== undefined) updateData.sortOrder = input.sortOrder;
    if (input.active !== undefined) updateData.active = input.active;

    const [updated] = await db
      .update(dailySchedule)
      .set(updateData)
      .where(eq(dailySchedule.id, input.id))
      .returning();

    if (!updated) {
      throw new Error(`Failed to update schedule item ${input.id}`);
    }

    return this.formatRow(updated);
  }

  static async reorder(db: DrizzleD1Database<typeof schema>, input: ReorderScheduleInput) {
    const now = Date.now();
    for (const item of input.items) {
      await db
        .update(dailySchedule)
        .set({ sortOrder: item.sortOrder, updatedAt: now })
        .where(eq(dailySchedule.id, item.id));
    }
    return true;
  }

  static async delete(db: DrizzleD1Database<typeof schema>, id: number) {
    const [deleted] = await db
      .delete(dailySchedule)
      .where(eq(dailySchedule.id, id))
      .returning();
    return !!deleted;
  }

  // Public cached list: returns active items and computes 'nextAarti'
  static async getPublicSchedule(
    db: DrizzleD1Database<typeof schema>,
    referenceTimeHhmm?: string
  ) {
    const rows = await db
      .select()
      .from(dailySchedule)
      .where(eq(dailySchedule.active, true))
      .orderBy(asc(dailySchedule.sortOrder), asc(dailySchedule.time));

    const formatted = rows.map(this.formatRow);
    const nextAarti = this.computeNextAarti(formatted, referenceTimeHhmm);

    return {
      items: formatted,
      nextAarti,
    };
  }

  /**
   * Computes the next aarti/ritual from daily_schedule in Asia/Dhaka time.
   * If all rituals for today have passed, rolls over to tomorrow's first item.
   */
  static computeNextAarti(
    items: FormattedScheduleItem[],
    referenceTimeHhmm?: string
  ): NextAartiResult | null {
    if (!items.length) return null;

    let currentHhmm = referenceTimeHhmm;
    if (!currentHhmm) {
      try {
        const dhakaFormatter = new Intl.DateTimeFormat("en-GB", {
          timeZone: "Asia/Dhaka",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        });
        currentHhmm = dhakaFormatter.format(new Date());
      } catch {
        currentHhmm = "12:00";
      }
    }

    // Sort items by time ascending
    const timeSorted = [...items].sort((a, b) => a.time.localeCompare(b.time));

    // Find the next item today where item.time > currentHhmm
    const nextToday = timeSorted.find((item) => item.time > currentHhmm!);
    if (nextToday) {
      return {
        item: nextToday,
        isTomorrow: false,
        timeInDhaka: currentHhmm,
      };
    }

    // All rituals today have passed -> roll over to tomorrow's first ritual
    const first = timeSorted[0];
    if (!first) return null;

    return {
      item: first,
      isTomorrow: true,
      timeInDhaka: currentHhmm,
    };
  }

  private static formatRow(row: typeof dailySchedule.$inferSelect): FormattedScheduleItem {
    return {
      ...row,
      title: parseJson(row.title, { en: "", bn: "" }),
      description: parseJson(row.description, { en: "", bn: "" }),
    };
  }
}

function parseJson<T>(raw: string, fallback: T): T {
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}
