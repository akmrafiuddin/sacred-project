import { and, desc, asc, eq, like, or, sql, gte } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import { createError } from "h3";
import * as schema from "../db/schema";
import { events } from "../db/schema/events";
import { AuditService } from "./audit";
import { purgeCache } from "../utils/cache";
import type {
  CreateEventInput,
  UpdateEventInput,
  ListEventsQuery,
  EventKind,
} from "../../shared/schemas/events";

export interface FormattedEventItem {
  id: number;
  slug: string;
  date: string;
  kind: "special_puja" | "festival" | "seva" | "other";
  title: { en: string; bn: string };
  label: { en: string; bn: string } | null;
  time: string | null;
  description: { en: string; bn: string };
  active: boolean;
  createdAt: number;
  updatedAt: number;
}

function getDhakaDate(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Dhaka",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export class EventsService {
  /**
   * List events with optional pagination, search, kind, month, upcoming, and active filters.
   */
  static async list(db: DrizzleD1Database<typeof schema>, query?: ListEventsQuery) {
    const page = query?.page || 1;
    const pageSize = Math.min(query?.pageSize || 20, 100);
    const offset = (page - 1) * pageSize;

    const conditions = [];

    if (query?.active !== undefined) {
      conditions.push(eq(events.active, query.active));
    }

    if (query?.kind) {
      conditions.push(eq(events.kind, query.kind));
    }

    if (query?.month) {
      // Matches 'YYYY-MM%'
      conditions.push(like(events.date, `${query.month}%`));
    }

    if (query?.upcoming) {
      const today = getDhakaDate();
      conditions.push(gte(events.date, today));
    }

    if (query?.search && query.search.trim()) {
      const q = `%${query.search.trim()}%`;
      conditions.push(
        or(
          like(events.title, q),
          like(events.slug, q),
          like(events.label, q),
          like(events.description, q)
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [items, totalResult] = await Promise.all([
      db
        .select()
        .from(events)
        .where(whereClause)
        .orderBy(desc(events.date), desc(events.id))
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

  /**
   * Get single event by integer ID.
   */
  static async getById(
    db: DrizzleD1Database<typeof schema>,
    id: number
  ): Promise<FormattedEventItem | null> {
    const rows = await db.select().from(events).where(eq(events.id, id)).limit(1);
    const row = rows[0];
    if (!row) return null;
    return this.formatRow(row);
  }

  /**
   * Get single event by slug.
   */
  static async getBySlug(
    db: DrizzleD1Database<typeof schema>,
    slug: string
  ): Promise<FormattedEventItem | null> {
    const rows = await db.select().from(events).where(eq(events.slug, slug)).limit(1);
    const row = rows[0];
    if (!row) return null;
    return this.formatRow(row);
  }

  /**
   * Create new event, invalidate edge cache, and record audit log.
   */
  static async create(
    db: DrizzleD1Database<typeof schema>,
    input: CreateEventInput,
    userId?: string | null
  ): Promise<FormattedEventItem> {
    // Check for unique slug
    const existing = await this.getBySlug(db, input.slug);
    if (existing) {
      throw createError({
        statusCode: 409,
        statusMessage: `An event with slug '${input.slug}' already exists`,
      });
    }

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
      throw createError({
        statusCode: 500,
        statusMessage: "Failed to insert event",
      });
    }

    // Invalidate edge cache
    await purgeCache(["events"]).catch((err) =>
      console.warn("Events cache purge error:", err)
    );

    // Audit log
    await AuditService.record(db, {
      userId,
      action: "create",
      entity: "events",
      entityId: String(inserted.id),
      details: {
        slug: input.slug,
        title: input.title.en,
        date: input.date,
        kind: input.kind,
      },
    }).catch((err) => console.warn("Audit record error:", err));

    return this.formatRow(inserted);
  }

  /**
   * Update event by ID, invalidate edge cache, and record audit log.
   */
  static async update(
    db: DrizzleD1Database<typeof schema>,
    input: UpdateEventInput,
    userId?: string | null
  ): Promise<FormattedEventItem> {
    const existing = await this.getById(db, input.id);
    if (!existing) {
      throw createError({
        statusCode: 404,
        statusMessage: `Event with ID ${input.id} not found`,
      });
    }

    // Check slug uniqueness if changed
    if (input.slug && input.slug !== existing.slug) {
      const slugConflict = await this.getBySlug(db, input.slug);
      if (slugConflict && slugConflict.id !== input.id) {
        throw createError({
          statusCode: 409,
          statusMessage: `An event with slug '${input.slug}' already exists`,
        });
      }
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
      throw createError({
        statusCode: 500,
        statusMessage: `Failed to update event ${input.id}`,
      });
    }

    // Invalidate edge cache
    await purgeCache(["events"]).catch((err) =>
      console.warn("Events cache purge error:", err)
    );

    // Audit log
    await AuditService.record(db, {
      userId,
      action: "update",
      entity: "events",
      entityId: String(input.id),
      details: {
        slug: input.slug ?? existing.slug,
        title: input.title?.en ?? existing.title.en,
        date: input.date ?? existing.date,
        active: input.active ?? existing.active,
      },
    }).catch((err) => console.warn("Audit record error:", err));

    return this.formatRow(updated);
  }

  /**
   * Delete event by ID, invalidate cache, and record audit log.
   */
  static async delete(
    db: DrizzleD1Database<typeof schema>,
    id: number,
    userId?: string | null
  ): Promise<boolean> {
    const existing = await this.getById(db, id);
    if (!existing) {
      throw createError({
        statusCode: 404,
        statusMessage: `Event with ID ${id} not found`,
      });
    }

    const [deleted] = await db.delete(events).where(eq(events.id, id)).returning();

    // Invalidate edge cache
    await purgeCache(["events"]).catch((err) =>
      console.warn("Events cache purge error:", err)
    );

    // Audit log
    await AuditService.record(db, {
      userId,
      action: "delete",
      entity: "events",
      entityId: String(id),
      details: {
        slug: existing.slug,
        title: existing.title.en,
      },
    }).catch((err) => console.warn("Audit record error:", err));

    return !!deleted;
  }

  /**
   * Public cached queries: only active rows
   */
  static async getUpcoming(
    db: DrizzleD1Database<typeof schema>,
    options?: { kind?: EventKind; limit?: number; today?: string }
  ): Promise<FormattedEventItem[]> {
    const limit = options?.limit || 10;
    const today = options?.today || getDhakaDate();

    const conditions = [eq(events.active, true), gte(events.date, today)];
    if (options?.kind) {
      conditions.push(eq(events.kind, options.kind));
    }

    const rows = await db
      .select()
      .from(events)
      .where(and(...conditions))
      .orderBy(asc(events.date), asc(events.id))
      .limit(limit);

    return rows.map(this.formatRow);
  }

  static async getByMonth(
    db: DrizzleD1Database<typeof schema>,
    month: string
  ): Promise<FormattedEventItem[]> {
    const rows = await db
      .select()
      .from(events)
      .where(and(eq(events.active, true), like(events.date, `${month}%`)))
      .orderBy(asc(events.date), asc(events.id));

    return rows.map(this.formatRow);
  }

  static async getPublicBySlug(
    db: DrizzleD1Database<typeof schema>,
    slug: string
  ): Promise<FormattedEventItem | null> {
    const rows = await db
      .select()
      .from(events)
      .where(and(eq(events.slug, slug), eq(events.active, true)))
      .limit(1);

    const row = rows[0];
    if (!row) return null;
    return this.formatRow(row);
  }

  static async getPublicList(
    db: DrizzleD1Database<typeof schema>,
    options?: { kind?: EventKind; limit?: number }
  ): Promise<FormattedEventItem[]> {
    const conditions = [eq(events.active, true)];
    if (options?.kind) {
      conditions.push(eq(events.kind, options.kind));
    }

    const queryBuilder = db
      .select()
      .from(events)
      .where(and(...conditions))
      .orderBy(asc(events.date), asc(events.id));

    if (options?.limit) {
      queryBuilder.limit(options.limit);
    }

    const rows = await queryBuilder;
    return rows.map(this.formatRow);
  }

  private static formatRow(row: typeof events.$inferSelect): FormattedEventItem {
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
