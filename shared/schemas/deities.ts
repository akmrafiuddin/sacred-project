import { z } from "zod";
import { localized, slug } from "./common";

export const createDeitySchema = z.object({
  slug: slug,
  name: localized,
  subtitle: localized.optional(),
  description: localized,
  imageId: z.string().optional(),
  sortOrder: z.number().int().default(0),
  active: z.boolean().default(true),
});

export type CreateDeityInput = z.infer<typeof createDeitySchema>;

export const updateDeitySchema = createDeitySchema.partial().extend({
  id: z.number().int().positive(),
});

export type UpdateDeityInput = z.infer<typeof updateDeitySchema>;

export const listDeitiesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(50),
  search: z.string().trim().optional(),
  active: z.coerce.boolean().optional(),
});

export type ListDeitiesQuery = z.infer<typeof listDeitiesQuerySchema>;

export const reorderDeitiesSchema = z.object({
  items: z.array(
    z.object({
      id: z.number().int().positive(),
      sortOrder: z.number().int(),
    })
  ).min(1, "At least one item is required for reordering"),
});

export type ReorderDeitiesInput = z.infer<typeof reorderDeitiesSchema>;
