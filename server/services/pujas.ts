import { and, asc, eq, like, sql } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import * as schema from "../db/schema";
import { pujas } from "../db/schema/pujas";
import type {
  CreatePujaInput,
  UpdatePujaInput,
  ListPujasQuery,
  ReorderPujasInput,
} from "../../shared/schemas/pujas";

export class PujasService {
  static async list(db: DrizzleD1Database<typeof schema>, query: ListPujasQuery) {
    const page = query.page || 1;
    const pageSize = Math.min(query.pageSize || 50, 100);
    const offset = (page - 1) * pageSize;

    const conditions = [];

    if (query.active !== undefined) {
      conditions.push(eq(pujas.active, query.active));
    }

    if (query.bookable !== undefined) {
      conditions.push(eq(pujas.bookable, query.bookable));
    }

    if (query.search) {
      conditions.push(like(pujas.name, `%${query.search}%`));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [items, totalResult] = await Promise.all([
      db
        .select()
        .from(pujas)
        .where(whereClause)
        .orderBy(asc(pujas.sortOrder), asc(pujas.id))
        .limit(pageSize)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(pujas)
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
    const rows = await db.select().from(pujas).where(eq(pujas.id, id)).limit(1);
    const row = rows[0];
    if (!row) return null;
    return this.formatRow(row);
  }

  static async getBySlug(db: DrizzleD1Database<typeof schema>, slug: string) {
    const rows = await db.select().from(pujas).where(eq(pujas.slug, slug)).limit(1);
    const row = rows[0];
    if (!row) return null;
    return this.formatRow(row);
  }

  static async create(db: DrizzleD1Database<typeof schema>, input: CreatePujaInput) {
    const now = Date.now();
    const [inserted] = await db
      .insert(pujas)
      .values({
        slug: input.slug,
        name: JSON.stringify(input.name),
        description: JSON.stringify(input.description),
        offered: input.offered ? JSON.stringify(input.offered) : null,
        priceBdt: input.priceBdt ?? 0,
        duration: input.duration || null,
        bookable: input.bookable ?? true,
        sortOrder: input.sortOrder ?? 0,
        active: input.active ?? true,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    if (!inserted) {
      throw new Error("Failed to insert puja");
    }

    return this.formatRow(inserted);
  }

  static async update(db: DrizzleD1Database<typeof schema>, input: UpdatePujaInput) {
    const existing = await this.getById(db, input.id);
    if (!existing) {
      throw new Error(`Puja with ID ${input.id} not found`);
    }

    const now = Date.now();
    const updateData: Partial<typeof pujas.$inferInsert> = {
      updatedAt: now,
    };

    if (input.slug !== undefined) updateData.slug = input.slug;
    if (input.name !== undefined) updateData.name = JSON.stringify(input.name);
    if (input.description !== undefined)
      updateData.description = JSON.stringify(input.description);
    if (input.offered !== undefined)
      updateData.offered = input.offered ? JSON.stringify(input.offered) : null;
    if (input.priceBdt !== undefined) updateData.priceBdt = input.priceBdt;
    if (input.duration !== undefined) updateData.duration = input.duration || null;
    if (input.bookable !== undefined) updateData.bookable = input.bookable;
    if (input.sortOrder !== undefined) updateData.sortOrder = input.sortOrder;
    if (input.active !== undefined) updateData.active = input.active;

    const [updated] = await db
      .update(pujas)
      .set(updateData)
      .where(eq(pujas.id, input.id))
      .returning();

    if (!updated) {
      throw new Error(`Failed to update puja ${input.id}`);
    }

    return this.formatRow(updated);
  }

  static async reorder(db: DrizzleD1Database<typeof schema>, input: ReorderPujasInput) {
    const now = Date.now();
    for (const item of input.items) {
      await db
        .update(pujas)
        .set({ sortOrder: item.sortOrder, updatedAt: now })
        .where(eq(pujas.id, item.id));
    }
    return true;
  }

  static async delete(db: DrizzleD1Database<typeof schema>, id: number) {
    const [deleted] = await db.delete(pujas).where(eq(pujas.id, id)).returning();
    return !!deleted;
  }

  // Public cached list: active only
  static async getPublicList(db: DrizzleD1Database<typeof schema>) {
    const rows = await db
      .select()
      .from(pujas)
      .where(eq(pujas.active, true))
      .orderBy(asc(pujas.sortOrder), asc(pujas.id));

    return rows.map(this.formatRow);
  }

  static async getPublicBySlug(db: DrizzleD1Database<typeof schema>, slug: string) {
    const rows = await db
      .select()
      .from(pujas)
      .where(and(eq(pujas.slug, slug), eq(pujas.active, true)))
      .limit(1);

    const row = rows[0];
    if (!row) return null;
    return this.formatRow(row);
  }

  private static formatRow(row: typeof pujas.$inferSelect) {
    return {
      ...row,
      name: parseJson(row.name, { en: "", bn: "" }),
      description: parseJson(row.description, { en: "", bn: "" }),
      offered: row.offered ? parseJson(row.offered, { en: "", bn: "" }) : null,
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
