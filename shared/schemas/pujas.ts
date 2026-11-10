import { z } from "zod";
import { localized, slug } from "./common";

export const createPujaSchema = z.object({
  slug: slug,
  name: localized,
  description: localized,
  offered: localized.optional(),
  priceBdt: z.number().int().min(0).default(0),
  duration: z.string().max(100).optional(),
  bookable: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
  active: z.boolean().default(true),
});

export type CreatePujaInput = z.infer<typeof createPujaSchema>;

export const updatePujaSchema = createPujaSchema.partial().extend({
  id: z.number().int().positive(),
});

export type UpdatePujaInput = z.infer<typeof updatePujaSchema>;

export const listPujasQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(50),
  search: z.string().trim().optional(),
  bookable: z.coerce.boolean().optional(),
  active: z.coerce.boolean().optional(),
});

export type ListPujasQuery = z.infer<typeof listPujasQuerySchema>;

export const reorderPujasSchema = z.object({
  items: z.array(
    z.object({
      id: z.number().int().positive(),
      sortOrder: z.number().int(),
    })
  ),
});

export type ReorderPujasInput = z.infer<typeof reorderPujasSchema>;
