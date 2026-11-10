import { and, desc, eq, like, sql } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import * as schema from "../db/schema";
import { notices } from "../db/schema/notices";
import type {
  CreateNoticeInput,
  UpdateNoticeInput,
  ListNoticesQuery,
} from "../../shared/schemas/notices";

export class NoticesService {
  static async list(db: DrizzleD1Database<typeof schema>, query: ListNoticesQuery) {
    const page = query.page || 1;
    const pageSize = Math.min(query.pageSize || 20, 100);
    const offset = (page - 1) * pageSize;

    const conditions = [];

    if (query.active !== undefined) {
      conditions.push(eq(notices.active, query.active));
    }

    if (query.pinned !== undefined) {
      conditions.push(eq(notices.pinned, query.pinned));
    }

    if (query.category) {
      conditions.push(eq(notices.category, query.category));
    }

    if (query.search) {
      conditions.push(like(notices.title, `%${query.search}%`));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [items, totalResult] = await Promise.all([
      db
        .select()
        .from(notices)
        .where(whereClause)
        .orderBy(desc(notices.pinned), desc(notices.date))
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

  static async getById(db: DrizzleD1Database<typeof schema>, id: number) {
    const rows = await db.select().from(notices).where(eq(notices.id, id)).limit(1);
    const row = rows[0];
    if (!row) return null;
    return this.formatRow(row);
  }

  static async getBySlug(db: DrizzleD1Database<typeof schema>, slug: string) {
    const rows = await db.select().from(notices).where(eq(notices.slug, slug)).limit(1);
    const row = rows[0];
    if (!row) return null;
    return this.formatRow(row);
  }

  static async create(db: DrizzleD1Database<typeof schema>, input: CreateNoticeInput) {
    const now = Date.now();
    const [inserted] = await db
      .insert(notices)
      .values({
        slug: input.slug,
        title: JSON.stringify(input.title),
        category: input.category,
        date: input.date,
        body: JSON.stringify(input.body),
        pinned: input.pinned ?? false,
        active: input.active ?? true,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    if (!inserted) {
      throw new Error("Failed to insert notice");
    }

    return this.formatRow(inserted);
  }

  static async update(db: DrizzleD1Database<typeof schema>, input: UpdateNoticeInput) {
    const existing = await this.getById(db, input.id);
    if (!existing) {
      throw new Error(`Notice with ID ${input.id} not found`);
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
      throw new Error(`Failed to update notice ${input.id}`);
    }

    return this.formatRow(updated);
  }

  static async delete(db: DrizzleD1Database<typeof schema>, id: number) {
    const [deleted] = await db.delete(notices).where(eq(notices.id, id)).returning();
    return !!deleted;
  }

  // Public active-only notices
  static async getPublicList(
    db: DrizzleD1Database<typeof schema>,
    options?: { limit?: number; category?: string }
  ) {
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

  static async getPublicBySlug(db: DrizzleD1Database<typeof schema>, slug: string) {
    const rows = await db
      .select()
      .from(notices)
      .where(and(eq(notices.slug, slug), eq(notices.active, true)))
      .limit(1);

    const row = rows[0];
    if (!row) return null;
    return this.formatRow(row);
  }

  private static formatRow(row: typeof notices.$inferSelect) {
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
