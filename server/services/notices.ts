import { and, desc, eq, like, or, sql } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import { createError } from "h3";
import * as schema from "../db/schema";
import { notices } from "../db/schema/notices";
import { AuditService } from "./audit";
import { purgeCache } from "../utils/cache";
import type {
  CreateNoticeInput,
  UpdateNoticeInput,
  ListNoticesQuery,
} from "../../shared/schemas/notices";

export interface FormattedNoticeItem {
  id: number;
  slug: string;
  title: { en: string; bn: string };
  category: string;
  date: string;
  body: { en: string; bn: string };
  pinned: boolean;
  active: boolean;
  createdAt: number;
  updatedAt: number;
}

export class NoticesService {
  /**
   * List notices with optional pagination, search, category, pinned, and active filtering.
   */
  static async list(db: DrizzleD1Database<typeof schema>, query?: ListNoticesQuery) {
    const page = query?.page || 1;
    const pageSize = Math.min(query?.pageSize || 20, 100);
    const offset = (page - 1) * pageSize;

    const conditions = [];

    if (query?.active !== undefined) {
      conditions.push(eq(notices.active, query.active));
    }

    if (query?.pinned !== undefined) {
      conditions.push(eq(notices.pinned, query.pinned));
    }

    if (query?.category && query.category.trim()) {
      conditions.push(eq(notices.category, query.category.trim()));
    }

    if (query?.search && query.search.trim()) {
      const q = `%${query.search.trim()}%`;
      conditions.push(
        or(
          like(notices.title, q),
          like(notices.slug, q),
          like(notices.category, q),
          like(notices.body, q)
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [items, totalResult] = await Promise.all([
      db
        .select()
        .from(notices)
        .where(whereClause)
        .orderBy(desc(notices.pinned), desc(notices.date), desc(notices.id))
        .limit(pageSize)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(notices)
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
   * Get single notice by integer ID.
   */
  static async getById(db: DrizzleD1Database<typeof schema>, id: number): Promise<FormattedNoticeItem | null> {
    const rows = await db.select().from(notices).where(eq(notices.id, id)).limit(1);
    const row = rows[0];
    if (!row) return null;
    return this.formatRow(row);
  }

  /**
   * Get single notice by slug.
   */
  static async getBySlug(db: DrizzleD1Database<typeof schema>, slug: string): Promise<FormattedNoticeItem | null> {
    const rows = await db.select().from(notices).where(eq(notices.slug, slug)).limit(1);
    const row = rows[0];
    if (!row) return null;
    return this.formatRow(row);
  }

  /**
   * Create new temple notice, invalidate cache, and record audit log.
   */
  static async create(
    db: DrizzleD1Database<typeof schema>,
    input: CreateNoticeInput,
    userId?: string | null
  ): Promise<FormattedNoticeItem> {
    const existing = await this.getBySlug(db, input.slug);
    if (existing) {
      throw createError({
        statusCode: 409,
        statusMessage: `A notice with slug '${input.slug}' already exists`,
      });
    }

    const now = Date.now();
    const [inserted] = await db
      .insert(notices)
      .values({
        slug: input.slug,
        title: JSON.stringify(input.title),
        category: input.category || "general",
        date: input.date,
        body: JSON.stringify(input.body),
        pinned: input.pinned ?? false,
        active: input.active ?? true,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    if (!inserted) {
      throw createError({
        statusCode: 500,
        statusMessage: "Failed to insert notice",
      });
    }

    // Invalidate edge cache
    await purgeCache(["notices"]).catch((err) =>
      console.warn("Notices cache purge error:", err)
    );

    // Audit log
    await AuditService.record(db, {
      userId,
      action: "create",
      entity: "notices",
      entityId: String(inserted.id),
      details: {
        slug: input.slug,
        title: input.title.en,
        category: input.category,
      },
    }).catch((err) => console.warn("Audit record error:", err));

    return this.formatRow(inserted);
  }

  /**
   * Update notice by ID, invalidate cache, and record audit log.
   */
  static async update(
    db: DrizzleD1Database<typeof schema>,
    input: UpdateNoticeInput,
    userId?: string | null
  ): Promise<FormattedNoticeItem> {
    const existing = await this.getById(db, input.id);
    if (!existing) {
      throw createError({
        statusCode: 404,
        statusMessage: `Notice with ID ${input.id} not found`,
      });
    }

    // Check slug uniqueness if changed
    if (input.slug && input.slug !== existing.slug) {
      const slugConflict = await this.getBySlug(db, input.slug);
      if (slugConflict && slugConflict.id !== input.id) {
        throw createError({
          statusCode: 409,
          statusMessage: `A notice with slug '${input.slug}' already exists`,
        });
      }
    }

    const now = Date.now();
    const updateData: Partial<typeof notices.$inferInsert> = {
      updatedAt: now,
    };

    if (input.slug !== undefined) updateData.slug = input.slug;
    if (input.title !== undefined) updateData.title = JSON.stringify(input.title);
    if (input.category !== undefined) updateData.category = input.category;
    if (input.date !== undefined) updateData.date = input.date;
    if (input.body !== undefined) updateData.body = JSON.stringify(input.body);
    if (input.pinned !== undefined) updateData.pinned = input.pinned;
    if (input.active !== undefined) updateData.active = input.active;

    const [updated] = await db
      .update(notices)
      .set(updateData)
      .where(eq(notices.id, input.id))
      .returning();

    if (!updated) {
      throw createError({
        statusCode: 500,
        statusMessage: `Failed to update notice ${input.id}`,
      });
    }

    // Invalidate edge cache
    await purgeCache(["notices"]).catch((err) =>
      console.warn("Notices cache purge error:", err)
    );

    // Audit log
    await AuditService.record(db, {
      userId,
      action: "update",
      entity: "notices",
      entityId: String(input.id),
      details: {
        slug: input.slug ?? existing.slug,
        title: input.title?.en ?? existing.title.en,
        pinned: input.pinned ?? existing.pinned,
        active: input.active ?? existing.active,
      },
    }).catch((err) => console.warn("Audit record error:", err));

    return this.formatRow(updated);
  }

  /**
   * Delete notice by ID, invalidate cache, and record audit log.
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
        statusMessage: `Notice with ID ${id} not found`,
      });
    }

    const [deleted] = await db.delete(notices).where(eq(notices.id, id)).returning();

    // Invalidate edge cache
    await purgeCache(["notices"]).catch((err) =>
      console.warn("Notices cache purge error:", err)
    );

    // Audit log
    await AuditService.record(db, {
      userId,
      action: "delete",
      entity: "notices",
      entityId: String(id),
      details: {
        title: existing.title.en,
        slug: existing.slug,
      },
    }).catch((err) => console.warn("Audit record error:", err));

    return !!deleted;
  }

  /**
   * Public active-only notices listing: pinned first, then by date desc.
   */
  static async getPublicList(
    db: DrizzleD1Database<typeof schema>,
    options?: { limit?: number; category?: string }
  ): Promise<FormattedNoticeItem[]> {
    const limit = options?.limit || 20;
    const conditions = [eq(notices.active, true)];

    if (options?.category) {
      conditions.push(eq(notices.category, options.category));
    }

    const rows = await db
      .select()
      .from(notices)
      .where(and(...conditions))
      .orderBy(desc(notices.pinned), desc(notices.date))
      .limit(limit);

    return rows.map(this.formatRow);
  }

  /**
   * Public active notice by slug.
   */
  static async getPublicBySlug(
    db: DrizzleD1Database<typeof schema>,
    slug: string
  ): Promise<FormattedNoticeItem | null> {
    const rows = await db
      .select()
      .from(notices)
      .where(and(eq(notices.slug, slug), eq(notices.active, true)))
      .limit(1);

    const row = rows[0];
    if (!row) return null;
    return this.formatRow(row);
  }

  private static formatRow(row: typeof notices.$inferSelect): FormattedNoticeItem {
    return {
      ...row,
      title: parseJson(row.title, { en: "", bn: "" }),
      body: parseJson(row.body, { en: "", bn: "" }),
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
