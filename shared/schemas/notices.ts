import { z } from "zod";
import { localized, slug, isoDate } from "./common";

export const createNoticeSchema = z.object({
  slug: slug,
  title: localized,
  category: z.string().min(1).default("general"),
  date: isoDate,
  body: localized,
  pinned: z.boolean().default(false),
  active: z.boolean().default(true),
});

export type CreateNoticeInput = z.infer<typeof createNoticeSchema>;

export const updateNoticeSchema = createNoticeSchema.partial().extend({
  id: z.number().int().positive(),
});

export type UpdateNoticeInput = z.infer<typeof updateNoticeSchema>;

export const listNoticesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),
  category: z.string().trim().optional(),
  pinned: z.coerce.boolean().optional(),
  active: z.coerce.boolean().optional(),
});

export type ListNoticesQuery = z.infer<typeof listNoticesQuerySchema>;
