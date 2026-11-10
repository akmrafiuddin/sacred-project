import { and, asc, eq, like, sql } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import * as schema from "../db/schema";
import { albums, albumItems } from "../db/schema/gallery";
import type {
  CreateAlbumInput,
  UpdateAlbumInput,
  ListAlbumsQuery,
  ReorderAlbumsInput,
  CreateAlbumItemInput,
  UpdateAlbumItemInput,
  ReorderAlbumItemsInput,
} from "../../shared/schemas/gallery";

export class GalleryService {
  // --- ALBUMS ---
  static async listAlbums(db: DrizzleD1Database<typeof schema>, query: ListAlbumsQuery) {
    const page = query.page || 1;
    const pageSize = Math.min(query.pageSize || 50, 100);
    const offset = (page - 1) * pageSize;

    const conditions = [];

    if (query.active !== undefined) {
      conditions.push(eq(albums.active, query.active));
    }

    if (query.search) {
      conditions.push(like(albums.title, `%${query.search}%`));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [items, totalResult] = await Promise.all([
      db
        .select()
        .from(albums)
        .where(whereClause)
        .orderBy(asc(albums.sortOrder), asc(albums.id))
        .limit(pageSize)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(albums)
        .where(whereClause),
    ]);

    const total = Number(totalResult[0]?.count || 0);

    return {
      items: items.map(this.formatAlbumRow),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  static async getAlbumById(db: DrizzleD1Database<typeof schema>, id: number) {
    const rows = await db.select().from(albums).where(eq(albums.id, id)).limit(1);
    const row = rows[0];
    if (!row) return null;
    return this.formatAlbumRow(row);
  }

  static async getAlbumBySlug(db: DrizzleD1Database<typeof schema>, slug: string) {
    const rows = await db.select().from(albums).where(eq(albums.slug, slug)).limit(1);
    const row = rows[0];
    if (!row) return null;
    return this.formatAlbumRow(row);
  }

  static async createAlbum(db: DrizzleD1Database<typeof schema>, input: CreateAlbumInput) {
    const now = Date.now();
    const [inserted] = await db
      .insert(albums)
      .values({
        slug: input.slug,
        title: JSON.stringify(input.title),
        description: input.description ? JSON.stringify(input.description) : null,
        cover: input.cover || null,
        sortOrder: input.sortOrder ?? 0,
        active: input.active ?? true,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    if (!inserted) {
      throw new Error("Failed to insert album");
    }

    return this.formatAlbumRow(inserted);
  }

  static async updateAlbum(db: DrizzleD1Database<typeof schema>, input: UpdateAlbumInput) {
    const existing = await this.getAlbumById(db, input.id);
    if (!existing) {
      throw new Error(`Album with ID ${input.id} not found`);
    }

    const now = Date.now();
    const updateData: Partial<typeof albums.$inferInsert> = {
      updatedAt: now,
    };

    if (input.slug !== undefined) updateData.slug = input.slug;
    if (input.title !== undefined) updateData.title = JSON.stringify(input.title);
    if (input.description !== undefined)
      updateData.description = input.description ? JSON.stringify(input.description) : null;
    if (input.cover !== undefined) updateData.cover = input.cover || null;
    if (input.sortOrder !== undefined) updateData.sortOrder = input.sortOrder;
    if (input.active !== undefined) updateData.active = input.active;

    const [updated] = await db
      .update(albums)
      .set(updateData)
      .where(eq(albums.id, input.id))
      .returning();

    if (!updated) {
      throw new Error(`Failed to update album ${input.id}`);
    }

    return this.formatAlbumRow(updated);
  }

  static async reorderAlbums(db: DrizzleD1Database<typeof schema>, input: ReorderAlbumsInput) {
    const now = Date.now();
    for (const item of input.items) {
      await db
        .update(albums)
        .set({ sortOrder: item.sortOrder, updatedAt: now })
        .where(eq(albums.id, item.id));
    }
    return true;
  }

  static async deleteAlbum(db: DrizzleD1Database<typeof schema>, id: number) {
    // Clean up items first to ensure cascade deletion across all SQLite environments
    await db.delete(albumItems).where(eq(albumItems.albumId, id));
    const [deleted] = await db.delete(albums).where(eq(albums.id, id)).returning();
    return !!deleted;
  }

  // --- ALBUM ITEMS ---
  static async listItems(db: DrizzleD1Database<typeof schema>, albumId: number) {
    const rows = await db
      .select()
      .from(albumItems)
      .where(eq(albumItems.albumId, albumId))
      .orderBy(asc(albumItems.sortOrder), asc(albumItems.id));

    return rows.map(this.formatItemRow);
  }

  static async getItemById(db: DrizzleD1Database<typeof schema>, id: number) {
    const rows = await db.select().from(albumItems).where(eq(albumItems.id, id)).limit(1);
    const row = rows[0];
    if (!row) return null;
    return this.formatItemRow(row);
  }

  static async addItem(db: DrizzleD1Database<typeof schema>, input: CreateAlbumItemInput) {
    const now = Date.now();
    const [inserted] = await db
      .insert(albumItems)
      .values({
        albumId: input.albumId,
        mediaId: input.mediaId,
        caption: input.caption ? JSON.stringify(input.caption) : null,
        sortOrder: input.sortOrder ?? 0,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    if (!inserted) {
      throw new Error("Failed to insert album item");
    }

    return this.formatItemRow(inserted);
  }

  static async updateItem(db: DrizzleD1Database<typeof schema>, input: UpdateAlbumItemInput) {
    const existing = await this.getItemById(db, input.id);
    if (!existing) {
      throw new Error(`Album item with ID ${input.id} not found`);
    }

    const now = Date.now();
    const updateData: Partial<typeof albumItems.$inferInsert> = {
      updatedAt: now,
    };

    if (input.mediaId !== undefined) updateData.mediaId = input.mediaId;
    if (input.caption !== undefined)
      updateData.caption = input.caption ? JSON.stringify(input.caption) : null;
    if (input.sortOrder !== undefined) updateData.sortOrder = input.sortOrder;

    const [updated] = await db
      .update(albumItems)
      .set(updateData)
      .where(eq(albumItems.id, input.id))
      .returning();

    if (!updated) {
      throw new Error(`Failed to update album item ${input.id}`);
    }

    return this.formatItemRow(updated);
  }

  static async reorderItems(db: DrizzleD1Database<typeof schema>, input: ReorderAlbumItemsInput) {
    const now = Date.now();
    for (const item of input.items) {
      await db
        .update(albumItems)
        .set({ sortOrder: item.sortOrder, updatedAt: now })
        .where(and(eq(albumItems.id, item.id), eq(albumItems.albumId, input.albumId)));
    }
    return true;
  }

  static async deleteItem(db: DrizzleD1Database<typeof schema>, id: number) {
    const [deleted] = await db.delete(albumItems).where(eq(albumItems.id, id)).returning();
    return !!deleted;
  }

  // --- PUBLIC ROUTES ---
  static async getPublicAlbums(db: DrizzleD1Database<typeof schema>) {
    const rows = await db
      .select()
      .from(albums)
      .where(eq(albums.active, true))
      .orderBy(asc(albums.sortOrder), asc(albums.id));

    return rows.map(this.formatAlbumRow);
  }

  static async getPublicAlbumWithItems(db: DrizzleD1Database<typeof schema>, slug: string) {
    const albumRows = await db
      .select()
      .from(albums)
      .where(and(eq(albums.slug, slug), eq(albums.active, true)))
      .limit(1);

    const album = albumRows[0];
    if (!album) return null;

    const items = await db
      .select()
      .from(albumItems)
      .where(eq(albumItems.albumId, album.id))
      .orderBy(asc(albumItems.sortOrder), asc(albumItems.id));

    return {
      ...this.formatAlbumRow(album),
      items: items.map(this.formatItemRow),
    };
  }

  private static formatAlbumRow(row: typeof albums.$inferSelect) {
    return {
      ...row,
      title: parseJson(row.title, { en: "", bn: "" }),
      description: row.description ? parseJson(row.description, { en: "", bn: "" }) : null,
    };
  }

  private static formatItemRow(row: typeof albumItems.$inferSelect) {
    return {
      ...row,
      caption: row.caption ? parseJson(row.caption, { en: "", bn: "" }) : null,
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
