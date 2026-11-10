import { z } from "zod";
import { localized, slug } from "./common";

export const createPageSchema = z.object({
  slug: slug,
  title: localized,
  body: localized,
  published: z.boolean().default(true),
});

export type CreatePageInput = z.infer<typeof createPageSchema>;

export const updatePageSchema = createPageSchema.partial().extend({
  id: z.number().int().positive(),
});

export type UpdatePageInput = z.infer<typeof updatePageSchema>;

export const listPagesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),
  published: z.coerce.boolean().optional(),
});

export type ListPagesQuery = z.infer<typeof listPagesQuerySchema>;
