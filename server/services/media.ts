import { eq, desc, and, like, sql, or } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import type { R2Bucket } from "@cloudflare/workers-types";
import { createError } from "h3";
import { media } from "../db/schema/media";
import { deities } from "../db/schema/deities";
import { albums, albumItems } from "../db/schema/gallery";
import type * as schema from "../db/schema";
import type { MediaQueryInput, UpdateMediaInput } from "../../shared/schemas/media";
import type { Localized } from "../../shared/schemas/common";

export class MediaService {
  static async listMedia(db: DrizzleD1Database<typeof schema>, input: MediaQueryInput) {
    const { page, pageSize, search, mime } = input;
    const offset = (page - 1) * pageSize;

    const conditions = [];

    if (mime) {
      conditions.push(eq(media.mime, mime));
    }

    if (search && search.trim()) {
      const q = `%${search.trim()}%`;
      conditions.push(
        or(
          like(media.key, q),
          like(media.alt, q)
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(media)
      .where(whereClause);

    const total = Number(countResult?.count || 0);

    const items = await db
      .select()
      .from(media)
      .where(whereClause)
      .orderBy(desc(media.createdAt))
      .limit(pageSize)
      .offset(offset);

    return {
      items: items.map((item) => ({
        ...item,
        alt: JSON.parse(item.alt) as Localized,
      })),
      total,
      page,
      pageSize,
    };
  }

  static async getMediaById(db: DrizzleD1Database<typeof schema>, id: number) {
    const [item] = await db.select().from(media).where(eq(media.id, id));
    if (!item) return null;
    return {
      ...item,
      alt: JSON.parse(item.alt) as Localized,
    };
  }

  static async getMediaByKey(db: DrizzleD1Database<typeof schema>, key: string) {
    const [item] = await db.select().from(media).where(eq(media.key, key));
    if (!item) return null;
    return {
      ...item,
      alt: JSON.parse(item.alt) as Localized,
    };
  }

  static async createMedia(
    db: DrizzleD1Database<typeof schema>,
    data: {
      key: string;
      mime: string;
      size: number;
      width: number | null;
      height: number | null;
      alt: Localized;
      uploadedBy?: string | null;
    }
  ) {
    const now = Date.now();
    const [inserted] = await db
      .insert(media)
      .values({
        key: data.key,
        mime: data.mime,
        size: data.size,
        width: data.width,
        height: data.height,
        alt: JSON.stringify(data.alt),
        uploadedBy: data.uploadedBy || null,
        createdAt: now,
      })
      .returning();

    if (!inserted) {
      throw new Error("Failed to insert media record");
    }

    return {
      ...inserted,
      alt: JSON.parse(inserted.alt) as Localized,
    };
  }

  static async updateMedia(
    db: DrizzleD1Database<typeof schema>,
    input: UpdateMediaInput
  ) {
    const existing = await this.getMediaById(db, input.id);
    if (!existing) {
      throw createError({
        statusCode: 404,
        statusMessage: `Media with id ${input.id} not found`,
      });
    }

    const [updated] = await db
      .update(media)
      .set({
        alt: JSON.stringify(input.alt),
      })
      .where(eq(media.id, input.id))
      .returning();

    if (!updated) {
      throw createError({
        statusCode: 404,
        statusMessage: `Media with id ${input.id} not found`,
      });
    }

    return {
      ...updated,
      alt: JSON.parse(updated.alt) as Localized,
    };
  }

  static async checkMediaReferences(
    db: DrizzleD1Database<typeof schema>,
    id: number,
    key: string
  ): Promise<{ inUse: boolean; references: string[] }> {
    const idStr = id.toString();
    const keyPattern = `%${key}%`;
    const references: string[] = [];

    // Check deities
    const deityRows = await db
      .select({ slug: deities.slug })
      .from(deities)
      .where(
        or(
          eq(deities.imageId, idStr),
          like(deities.imageId, keyPattern)
        )
      );
    if (deityRows.length > 0) {
      references.push(`Deities (${deityRows.map((d) => d.slug).join(", ")})`);
    }

    // Check albums cover
    const albumRows = await db
      .select({ slug: albums.slug })
      .from(albums)
      .where(
        or(
          eq(albums.cover, idStr),
          like(albums.cover, keyPattern)
        )
      );
    if (albumRows.length > 0) {
      references.push(`Album covers (${albumRows.map((a) => a.slug).join(", ")})`);
    }

    // Check album items
    const albumItemRows = await db
      .select({ id: albumItems.id, albumId: albumItems.albumId })
      .from(albumItems)
      .where(
        or(
          eq(albumItems.mediaId, idStr),
          like(albumItems.mediaId, keyPattern)
        )
      );
    if (albumItemRows.length > 0) {
      references.push(`Album items in albums [${albumItemRows.map((i) => i.albumId).join(", ")}]`);
    }

    return {
      inUse: references.length > 0,
      references,
    };
  }

  static async deleteMedia(
    db: DrizzleD1Database<typeof schema>,
    bucket: R2Bucket | null,
    id: number
  ) {
    const existing = await this.getMediaById(db, id);
    if (!existing) {
      throw createError({
        statusCode: 404,
        statusMessage: `Media with id ${id} not found`,
      });
    }

    // Check if referenced in deities, albums, or album items
    const refCheck = await this.checkMediaReferences(db, existing.id, existing.key);
    if (refCheck.inUse) {
      throw createError({
        statusCode: 409,
        statusMessage: `Media cannot be deleted because it is in use by: ${refCheck.references.join("; ")}`,
      });
    }

    // Delete from R2 bucket if bucket is present
    if (bucket) {
      try {
        await bucket.delete(existing.key);
      } catch (err) {
        console.error(`Failed to delete object ${existing.key} from R2:`, err);
      }
    }

    // Delete row from DB
    await db.delete(media).where(eq(media.id, id));

    return { success: true, id };
  }
}
