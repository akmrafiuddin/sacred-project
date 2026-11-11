import { and, asc, eq, like, or, sql } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import { createError } from "h3";
import * as schema from "../db/schema";
import { dailySchedule } from "../db/schema/schedule";
import { AuditService } from "./audit";
import { purgeCache } from "../utils/cache";
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
  /**
   * List schedule items with optional pagination, search, and active filtering.
   */
  static async list(db: DrizzleD1Database<typeof schema>, query?: ListScheduleQuery) {
    const conditions = [];

    if (query?.active !== undefined) {
      conditions.push(eq(dailySchedule.active, query.active));
    }

    if (query?.search && query.search.trim()) {
      const q = `%${query.search.trim()}%`;
      conditions.push(
        or(
          like(dailySchedule.time, q),
          like(dailySchedule.title, q),
          like(dailySchedule.description, q)
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Count total matching items
    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(dailySchedule)
      .where(whereClause);

    const total = Number(countResult?.count || 0);

    const page = query?.page ?? 1;
    const pageSize = query?.pageSize ?? 50;
    const offset = (page - 1) * pageSize;

    const items = await db
      .select()
      .from(dailySchedule)
      .where(whereClause)
      .orderBy(asc(dailySchedule.sortOrder), asc(dailySchedule.time))
      .limit(pageSize)
      .offset(offset);

    return {
      items: items.map(this.formatRow),
      total,
      page,
      pageSize,
    };
  }

  /**
   * Get single schedule item by integer ID.
   */
  static async getById(db: DrizzleD1Database<typeof schema>, id: number) {
    const rows = await db.select().from(dailySchedule).where(eq(dailySchedule.id, id)).limit(1);
    const row = rows[0];
    if (!row) return null;
    return this.formatRow(row);
  }

  /**
   * Create new daily schedule item, invalidate cache, and log audit event.
   */
  static async create(
    db: DrizzleD1Database<typeof schema>,
    input: CreateScheduleInput,
    userId?: string | null
  ) {
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
      throw createError({
        statusCode: 500,
        statusMessage: "Failed to insert schedule item",
      });
    }

    // Invalidate edge cache
    await purgeCache(["schedule"]).catch((err) =>
      console.warn("Schedule cache purge error:", err)
    );

    // Audit log
    await AuditService.record(db, {
      userId,
      action: "create",
      entity: "schedule",
      entityId: String(inserted.id),
      details: {
        time: input.time,
        title: input.title.en,
      },
    }).catch((err) => console.warn("Audit record error:", err));

    return this.formatRow(inserted);
  }

  /**
   * Update schedule item by ID, invalidate cache, and log audit event.
   */
  static async update(
    db: DrizzleD1Database<typeof schema>,
    input: UpdateScheduleInput,
    userId?: string | null
  ) {
    const existing = await this.getById(db, input.id);
    if (!existing) {
      throw createError({
        statusCode: 404,
        statusMessage: `Schedule item with ID ${input.id} not found`,
      });
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
      throw createError({
        statusCode: 404,
        statusMessage: `Failed to update schedule item ${input.id}`,
      });
    }

    // Invalidate edge cache
    await purgeCache(["schedule"]).catch((err) =>
      console.warn("Schedule cache purge error:", err)
    );

    // Audit log
    await AuditService.record(db, {
      userId,
      action: "update",
      entity: "schedule",
      entityId: String(input.id),
      details: {
        time: input.time,
        title: input.title?.en,
        active: input.active,
      },
    }).catch((err) => console.warn("Audit record error:", err));

    return this.formatRow(updated);
  }

  /**
   * Reorder schedule items in batch, invalidate cache, and log audit event.
   */
  static async reorder(
    db: DrizzleD1Database<typeof schema>,
    input: ReorderScheduleInput,
    userId?: string | null
  ) {
    const now = Date.now();
    for (const item of input.items) {
      await db
        .update(dailySchedule)
        .set({ sortOrder: item.sortOrder, updatedAt: now })
        .where(eq(dailySchedule.id, item.id));
    }

    // Invalidate edge cache
    await purgeCache(["schedule"]).catch((err) =>
      console.warn("Schedule cache purge error:", err)
    );

    // Audit log
    await AuditService.record(db, {
      userId,
      action: "reorder",
      entity: "schedule",
      details: {
        count: input.items.length,
      },
    }).catch((err) => console.warn("Audit record error:", err));

    return { success: true };
  }

  /**
   * Delete schedule item by ID, invalidate cache, and log audit event.
   */
  static async delete(
    db: DrizzleD1Database<typeof schema>,
    id: number,
    userId?: string | null
  ) {
    const existing = await this.getById(db, id);
    if (!existing) {
      throw createError({
        statusCode: 404,
        statusMessage: `Schedule item with ID ${id} not found`,
      });
    }

    const [deleted] = await db
      .delete(dailySchedule)
      .where(eq(dailySchedule.id, id))
      .returning();

    // Invalidate edge cache
    await purgeCache(["schedule"]).catch((err) =>
      console.warn("Schedule cache purge error:", err)
    );

    // Audit log
    await AuditService.record(db, {
      userId,
      action: "delete",
      entity: "schedule",
      entityId: String(id),
      details: {
        time: existing.time,
        title: existing.title.en,
      },
    }).catch((err) => console.warn("Audit record error:", err));

    return { success: !!deleted, id };
  }

  /**
   * Public cached list: returns active items and computes 'nextAarti'
   */
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
