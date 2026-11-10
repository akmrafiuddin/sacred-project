import { and, asc, eq, like, sql } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import * as schema from "../db/schema";
import { deities } from "../db/schema/deities";
import type {
  CreateDeityInput,
  UpdateDeityInput,
  ListDeitiesQuery,
  ReorderDeitiesInput,
} from "../../shared/schemas/deities";

export class DeitiesService {
  static async list(db: DrizzleD1Database<typeof schema>, query: ListDeitiesQuery) {
    const page = query.page || 1;
    const pageSize = Math.min(query.pageSize || 50, 100);
    const offset = (page - 1) * pageSize;

    const conditions = [];

    if (query.active !== undefined) {
      conditions.push(eq(deities.active, query.active));
    }

    if (query.search) {
      conditions.push(like(deities.name, `%${query.search}%`));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [items, totalResult] = await Promise.all([
      db
        .select()
        .from(deities)
        .where(whereClause)
        .orderBy(asc(deities.sortOrder), asc(deities.id))
        .limit(pageSize)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(deities)
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
    const rows = await db.select().from(deities).where(eq(deities.id, id)).limit(1);
    const row = rows[0];
    if (!row) return null;
    return this.formatRow(row);
  }

  static async getBySlug(db: DrizzleD1Database<typeof schema>, slug: string) {
    const rows = await db.select().from(deities).where(eq(deities.slug, slug)).limit(1);
    const row = rows[0];
    if (!row) return null;
    return this.formatRow(row);
  }

  static async create(db: DrizzleD1Database<typeof schema>, input: CreateDeityInput) {
    const now = Date.now();
    const [inserted] = await db
      .insert(deities)
      .values({
        slug: input.slug,
        name: JSON.stringify(input.name),
        subtitle: input.subtitle ? JSON.stringify(input.subtitle) : null,
        description: JSON.stringify(input.description),
        imageId: input.imageId || null,
        sortOrder: input.sortOrder ?? 0,
        active: input.active ?? true,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    if (!inserted) {
      throw new Error("Failed to insert deity");
    }

    return this.formatRow(inserted);
  }

  static async update(db: DrizzleD1Database<typeof schema>, input: UpdateDeityInput) {
    const existing = await this.getById(db, input.id);
    if (!existing) {
      throw new Error(`Deity with ID ${input.id} not found`);
    }

    const now = Date.now();
    const updateData: Partial<typeof deities.$inferInsert> = {
      updatedAt: now,
    };

    if (input.slug !== undefined) updateData.slug = input.slug;
    if (input.name !== undefined) updateData.name = JSON.stringify(input.name);
    if (input.subtitle !== undefined)
      updateData.subtitle = input.subtitle ? JSON.stringify(input.subtitle) : null;
    if (input.description !== undefined)
      updateData.description = JSON.stringify(input.description);
    if (input.imageId !== undefined) updateData.imageId = input.imageId || null;
    if (input.sortOrder !== undefined) updateData.sortOrder = input.sortOrder;
    if (input.active !== undefined) updateData.active = input.active;

    const [updated] = await db
      .update(deities)
      .set(updateData)
      .where(eq(deities.id, input.id))
      .returning();

    if (!updated) {
      throw new Error(`Failed to update deity ${input.id}`);
    }

    return this.formatRow(updated);
  }

  static async reorder(db: DrizzleD1Database<typeof schema>, input: ReorderDeitiesInput) {
    const now = Date.now();
    for (const item of input.items) {
      await db
        .update(deities)
        .set({ sortOrder: item.sortOrder, updatedAt: now })
        .where(eq(deities.id, item.id));
    }
    return true;
  }

  static async delete(db: DrizzleD1Database<typeof schema>, id: number) {
    const [deleted] = await db.delete(deities).where(eq(deities.id, id)).returning();
    return !!deleted;
  }

  // Public cached list: active only
  static async getPublicList(db: DrizzleD1Database<typeof schema>) {
    const rows = await db
      .select()
      .from(deities)
      .where(eq(deities.active, true))
      .orderBy(asc(deities.sortOrder), asc(deities.id));

    return rows.map(this.formatRow);
  }

  static async getPublicBySlug(db: DrizzleD1Database<typeof schema>, slug: string) {
    const rows = await db
      .select()
      .from(deities)
      .where(and(eq(deities.slug, slug), eq(deities.active, true)))
      .limit(1);

    const row = rows[0];
    if (!row) return null;
    return this.formatRow(row);
  }

  private static formatRow(row: typeof deities.$inferSelect) {
    return {
      ...row,
      name: parseJson(row.name, { en: "", bn: "" }),
      subtitle: row.subtitle ? parseJson(row.subtitle, { en: "", bn: "" }) : null,
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
