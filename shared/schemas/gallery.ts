import { z } from "zod";
import { localized, slug } from "./common";

export const createAlbumSchema = z.object({
  slug: slug,
  title: localized,
  description: localized.optional(),
  cover: z.string().optional(),
  sortOrder: z.number().int().default(0),
  active: z.boolean().default(true),
});

export type CreateAlbumInput = z.infer<typeof createAlbumSchema>;

export const updateAlbumSchema = createAlbumSchema.partial().extend({
  id: z.number().int().positive(),
});

export type UpdateAlbumInput = z.infer<typeof updateAlbumSchema>;

export const listAlbumsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(50),
  search: z.string().trim().optional(),
  active: z.coerce.boolean().optional(),
});

export type ListAlbumsQuery = z.infer<typeof listAlbumsQuerySchema>;

export const reorderAlbumsSchema = z.object({
  items: z.array(
    z.object({
      id: z.number().int().positive(),
      sortOrder: z.number().int(),
    })
  ),
});

export type ReorderAlbumsInput = z.infer<typeof reorderAlbumsSchema>;

export const createAlbumItemSchema = z.object({
  albumId: z.number().int().positive(),
  mediaId: z.string().min(1),
  caption: localized.optional(),
  sortOrder: z.number().int().default(0),
});

export type CreateAlbumItemInput = z.infer<typeof createAlbumItemSchema>;

export const updateAlbumItemSchema = createAlbumItemSchema.partial().extend({
  id: z.number().int().positive(),
});

export type UpdateAlbumItemInput = z.infer<typeof updateAlbumItemSchema>;

export const reorderAlbumItemsSchema = z.object({
  albumId: z.number().int().positive(),
  items: z.array(
    z.object({
      id: z.number().int().positive(),
      sortOrder: z.number().int(),
    })
  ),
});

export type ReorderAlbumItemsInput = z.infer<typeof reorderAlbumItemsSchema>;
