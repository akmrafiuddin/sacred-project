import { and, desc, eq, like, sql, gte } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import * as schema from "../db/schema";
import { events } from "../db/schema/events";
import type {
  CreateEventInput,
  UpdateEventInput,
  ListEventsQuery,
  EventKind,
} from "../../shared/schemas/events";

export class EventsService {
  static async list(db: DrizzleD1Database<typeof schema>, query: ListEventsQuery) {
    const page = query.page || 1;
    const pageSize = Math.min(query.pageSize || 20, 100);
    const offset = (page - 1) * pageSize;

    const conditions = [];

    if (query.active !== undefined) {
      conditions.push(eq(events.active, query.active));
    }

    if (query.kind) {
      conditions.push(eq(events.kind, query.kind));
    }

    if (query.month) {
      // Matches 'YYYY-MM%'
      conditions.push(like(events.date, `${query.month}%`));
    }

    if (query.search) {
      conditions.push(like(events.title, `%${query.search}%`));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [items, totalResult] = await Promise.all([
      db
        .select()
        .from(events)
        .where(whereClause)
        .orderBy(desc(events.date))
        .limit(pageSize)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(events)
        .where(whereClause),
    ]);

    const total = Number(totalResult[0]?.count || 0);

    return {
      items: items.map(this.formatRow),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  static async getById(db: DrizzleD1Database<typeof schema>, id: number) {
    const rows = await db.select().from(events).where(eq(events.id, id)).limit(1);
    const row = rows[0];
    if (!row) return null;
    return this.formatRow(row);
  }

  static async getBySlug(db: DrizzleD1Database<typeof schema>, slug: string) {
    const rows = await db.select().from(events).where(eq(events.slug, slug)).limit(1);
    const row = rows[0];
    if (!row) return null;
    return this.formatRow(row);
  }

  static async create(db: DrizzleD1Database<typeof schema>, input: CreateEventInput) {
    const now = Date.now();
    const [inserted] = await db
      .insert(events)
      .values({
        slug: input.slug,
        date: input.date,
        kind: input.kind,
        title: JSON.stringify(input.title),
        label: input.label ? JSON.stringify(input.label) : null,
        time: input.time || null,
        description: JSON.stringify(input.description),
        active: input.active ?? true,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    if (!inserted) {
      throw new Error("Failed to insert event");
    }

    return this.formatRow(inserted);
  }

  static async update(db: DrizzleD1Database<typeof schema>, input: UpdateEventInput) {
    const existing = await this.getById(db, input.id);
    if (!existing) {
      throw new Error(`Event with ID ${input.id} not found`);
    }

    const now = Date.now();
    const updateData: Partial<typeof events.$inferInsert> = {
      updatedAt: now,
    };

    if (input.slug !== undefined) updateData.slug = input.slug;
    if (input.date !== undefined) updateData.date = input.date;
    if (input.kind !== undefined) updateData.kind = input.kind;
    if (input.title !== undefined) updateData.title = JSON.stringify(input.title);
    if (input.label !== undefined)
      updateData.label = input.label ? JSON.stringify(input.label) : null;
    if (input.time !== undefined) updateData.time = input.time || null;
    if (input.description !== undefined)
      updateData.description = JSON.stringify(input.description);
    if (input.active !== undefined) updateData.active = input.active;

    const [updated] = await db
      .update(events)
      .set(updateData)
      .where(eq(events.id, input.id))
      .returning();

    if (!updated) {
      throw new Error(`Failed to update event ${input.id}`);
    }

    return this.formatRow(updated);
  }

  static async delete(db: DrizzleD1Database<typeof schema>, id: number) {
    const [deleted] = await db.delete(events).where(eq(events.id, id)).returning();
    return !!deleted;
  }

  // Public cached queries: only active rows
  static async getUpcoming(
    db: DrizzleD1Database<typeof schema>,
    options?: { kind?: EventKind; limit?: number; today?: string }
  ) {
    const limit = options?.limit || 10;
    // Current date in Asia/Dhaka or provided
    const today = options?.today || new Date().toISOString().slice(0, 10);

    const conditions = [eq(events.active, true), gte(events.date, today)];
    if (options?.kind) {
      conditions.push(eq(events.kind, options.kind));
    }

    const rows = await db
      .select()
      .from(events)
      .where(and(...conditions))
      .orderBy(events.date)
      .limit(limit);

    return rows.map(this.formatRow);
  }

  static async getByMonth(db: DrizzleD1Database<typeof schema>, month: string) {
    const rows = await db
      .select()
      .from(events)
      .where(and(eq(events.active, true), like(events.date, `${month}%`)))
      .orderBy(events.date);

    return rows.map(this.formatRow);
  }

  private static formatRow(row: typeof events.$inferSelect) {
    return {
      ...row,
      title: parseJson(row.title, { en: "", bn: "" }),
      label: row.label ? parseJson(row.label, { en: "", bn: "" }) : null,
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
