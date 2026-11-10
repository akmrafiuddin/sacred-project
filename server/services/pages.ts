import { and, desc, eq, like, sql } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import * as schema from "../db/schema";
import { pages } from "../db/schema/pages";
import type {
  CreatePageInput,
  UpdatePageInput,
  ListPagesQuery,
} from "../../shared/schemas/pages";

export class PagesService {
  static async list(db: DrizzleD1Database<typeof schema>, query: ListPagesQuery) {
    const page = query.page || 1;
    const pageSize = Math.min(query.pageSize || 20, 100);
    const offset = (page - 1) * pageSize;

    const conditions = [];

    if (query.published !== undefined) {
      conditions.push(eq(pages.published, query.published));
    }

    if (query.search) {
      conditions.push(like(pages.title, `%${query.search}%`));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [items, totalResult] = await Promise.all([
      db
        .select()
        .from(pages)
        .where(whereClause)
        .orderBy(desc(pages.updatedAt))
        .limit(pageSize)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(pages)
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
    const rows = await db.select().from(pages).where(eq(pages.id, id)).limit(1);
    const row = rows[0];
    if (!row) return null;
    return this.formatRow(row);
  }

  static async getBySlug(db: DrizzleD1Database<typeof schema>, slug: string) {
    const rows = await db.select().from(pages).where(eq(pages.slug, slug)).limit(1);
    const row = rows[0];
    if (!row) return null;
    return this.formatRow(row);
  }

  static async create(db: DrizzleD1Database<typeof schema>, input: CreatePageInput) {
    const now = Date.now();
    const [inserted] = await db
      .insert(pages)
      .values({
        slug: input.slug,
        title: JSON.stringify(input.title),
        body: JSON.stringify(input.body),
        published: input.published ?? true,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    if (!inserted) {
      throw new Error("Failed to insert page");
    }

    return this.formatRow(inserted);
  }

  static async update(db: DrizzleD1Database<typeof schema>, input: UpdatePageInput) {
    const existing = await this.getById(db, input.id);
    if (!existing) {
      throw new Error(`Page with ID ${input.id} not found`);
    }

    const now = Date.now();
    const updateData: Partial<typeof pages.$inferInsert> = {
      updatedAt: now,
    };

    if (input.slug !== undefined) updateData.slug = input.slug;
    if (input.title !== undefined) updateData.title = JSON.stringify(input.title);
    if (input.body !== undefined) updateData.body = JSON.stringify(input.body);
    if (input.published !== undefined) updateData.published = input.published;

    const [updated] = await db
      .update(pages)
      .set(updateData)
      .where(eq(pages.id, input.id))
      .returning();

    if (!updated) {
      throw new Error(`Failed to update page ${input.id}`);
    }

    return this.formatRow(updated);
  }

  static async delete(db: DrizzleD1Database<typeof schema>, id: number) {
    const [deleted] = await db.delete(pages).where(eq(pages.id, id)).returning();
    return !!deleted;
  }

  // Public single page route: published only
  static async getPublicBySlug(db: DrizzleD1Database<typeof schema>, slug: string) {
    const rows = await db
      .select()
      .from(pages)
      .where(and(eq(pages.slug, slug), eq(pages.published, true)))
      .limit(1);

    const row = rows[0];
    if (!row) return null;
    return this.formatRow(row);
  }

  private static formatRow(row: typeof pages.$inferSelect) {
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
