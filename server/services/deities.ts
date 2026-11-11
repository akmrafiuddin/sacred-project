import { and, asc, eq, like, or, sql } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import { createError } from "h3";
import * as schema from "../db/schema";
import { deities } from "../db/schema/deities";
import { AuditService } from "./audit";
import { purgeCache } from "../utils/cache";
import type {
  CreateDeityInput,
  UpdateDeityInput,
  ListDeitiesQuery,
  ReorderDeitiesInput,
} from "../../shared/schemas/deities";

export interface FormattedDeityItem {
  id: number;
  slug: string;
  name: { en: string; bn: string };
  subtitle: { en: string; bn: string } | null;
  description: { en: string; bn: string };
  imageId: string | null;
  sortOrder: number;
  active: boolean;
  createdAt: number;
  updatedAt: number;
}

export class DeitiesService {
  /**
   * List deities with optional pagination, search, and active filtering.
   */
  static async list(db: DrizzleD1Database<typeof schema>, query?: ListDeitiesQuery) {
    const page = query?.page || 1;
    const pageSize = Math.min(query?.pageSize || 50, 100);
    const offset = (page - 1) * pageSize;

    const conditions = [];

    if (query?.active !== undefined) {
      conditions.push(eq(deities.active, query.active));
    }

    if (query?.search && query.search.trim()) {
      const q = `%${query.search.trim()}%`;
      conditions.push(
        or(
          like(deities.name, q),
          like(deities.slug, q),
          like(deities.subtitle, q),
          like(deities.description, q)
        )
      );
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

  /**
   * Get single deity by integer ID.
   */
  static async getById(db: DrizzleD1Database<typeof schema>, id: number): Promise<FormattedDeityItem | null> {
    const rows = await db.select().from(deities).where(eq(deities.id, id)).limit(1);
    const row = rows[0];
    if (!row) return null;
    return this.formatRow(row);
  }

  /**
   * Get single deity by slug.
   */
  static async getBySlug(db: DrizzleD1Database<typeof schema>, slug: string): Promise<FormattedDeityItem | null> {
    const rows = await db.select().from(deities).where(eq(deities.slug, slug)).limit(1);
    const row = rows[0];
    if (!row) return null;
    return this.formatRow(row);
  }

  /**
   * Create new deity profile, invalidate cache, and record audit log.
   */
  static async create(
    db: DrizzleD1Database<typeof schema>,
    input: CreateDeityInput,
    userId?: string | null
  ): Promise<FormattedDeityItem> {
    const existing = await this.getBySlug(db, input.slug);
    if (existing) {
      throw createError({
        statusCode: 409,
        statusMessage: `A deity with slug '${input.slug}' already exists`,
      });
    }

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
      throw createError({
        statusCode: 500,
        statusMessage: "Failed to insert deity profile",
      });
    }

    // Invalidate edge cache
    await purgeCache(["deities"]).catch((err) =>
      console.warn("Deities cache purge error:", err)
    );

    // Audit log
    await AuditService.record(db, {
      userId,
      action: "create",
      entity: "deities",
      entityId: String(inserted.id),
      details: {
        slug: input.slug,
        name: input.name.en,
      },
    }).catch((err) => console.warn("Audit record error:", err));

    return this.formatRow(inserted);
  }

  /**
   * Update deity by ID, invalidate cache, and record audit log.
   */
  static async update(
    db: DrizzleD1Database<typeof schema>,
    input: UpdateDeityInput,
    userId?: string | null
  ): Promise<FormattedDeityItem> {
    const existing = await this.getById(db, input.id);
    if (!existing) {
      throw createError({
        statusCode: 404,
        statusMessage: `Deity with ID ${input.id} not found`,
      });
    }

    // Check slug uniqueness if changed
    if (input.slug && input.slug !== existing.slug) {
      const slugConflict = await this.getBySlug(db, input.slug);
      if (slugConflict && slugConflict.id !== input.id) {
        throw createError({
          statusCode: 409,
          statusMessage: `A deity with slug '${input.slug}' already exists`,
        });
      }
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
      throw createError({
        statusCode: 500,
        statusMessage: `Failed to update deity ${input.id}`,
      });
    }

    // Invalidate edge cache
    await purgeCache(["deities"]).catch((err) =>
      console.warn("Deities cache purge error:", err)
    );

    // Audit log
    await AuditService.record(db, {
      userId,
      action: "update",
      entity: "deities",
      entityId: String(input.id),
      details: {
        slug: input.slug ?? existing.slug,
        name: input.name?.en ?? existing.name.en,
        active: input.active ?? existing.active,
      },
    }).catch((err) => console.warn("Audit record error:", err));

    return this.formatRow(updated);
  }

  /**
   * Reorder deities in batch, invalidate cache, and record audit log.
   */
  static async reorder(
    db: DrizzleD1Database<typeof schema>,
    input: ReorderDeitiesInput,
    userId?: string | null
  ) {
    const now = Date.now();
    for (const item of input.items) {
      await db
        .update(deities)
        .set({ sortOrder: item.sortOrder, updatedAt: now })
        .where(eq(deities.id, item.id));
    }

    // Invalidate edge cache
    await purgeCache(["deities"]).catch((err) =>
      console.warn("Deities cache purge error:", err)
    );

    // Audit log
    await AuditService.record(db, {
      userId,
      action: "reorder",
      entity: "deities",
      entityId: "batch",
      details: { count: input.items.length },
    }).catch((err) => console.warn("Audit record error:", err));

    return true;
  }

  /**
   * Delete deity by ID, invalidate cache, and record audit log.
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
        statusMessage: `Deity with ID ${id} not found`,
      });
    }

    const [deleted] = await db.delete(deities).where(eq(deities.id, id)).returning();

    // Invalidate edge cache
    await purgeCache(["deities"]).catch((err) =>
      console.warn("Deities cache purge error:", err)
    );

    // Audit log
    await AuditService.record(db, {
      userId,
      action: "delete",
      entity: "deities",
      entityId: String(id),
      details: {
        name: existing.name.en,
        slug: existing.slug,
      },
    }).catch((err) => console.warn("Audit record error:", err));

    return !!deleted;
  }

  /**
   * Public active-only deities listing sorted by sortOrder asc.
   */
  static async getPublicList(db: DrizzleD1Database<typeof schema>): Promise<FormattedDeityItem[]> {
    const rows = await db
      .select()
      .from(deities)
      .where(eq(deities.active, true))
      .orderBy(asc(deities.sortOrder), asc(deities.id));

    return rows.map(this.formatRow);
  }

  /**
   * Public active deity by slug.
   */
  static async getPublicBySlug(
    db: DrizzleD1Database<typeof schema>,
    slug: string
  ): Promise<FormattedDeityItem | null> {
    const rows = await db
      .select()
      .from(deities)
      .where(and(eq(deities.slug, slug), eq(deities.active, true)))
      .limit(1);

    const row = rows[0];
    if (!row) return null;
    return this.formatRow(row);
  }

  private static formatRow(row: typeof deities.$inferSelect): FormattedDeityItem {
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
