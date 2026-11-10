import { z } from "zod";
import { localized, slug, isoDate } from "./common";

export const eventKind = z.enum(["special_puja", "festival", "seva", "other"]);
export type EventKind = z.infer<typeof eventKind>;

export const createEventSchema = z.object({
  slug: slug,
  date: isoDate,
  kind: eventKind.default("special_puja"),
  title: localized,
  label: localized.optional(),
  time: z.string().max(50).optional(),
  description: localized,
  active: z.boolean().default(true),
});

export type CreateEventInput = z.infer<typeof createEventSchema>;

export const updateEventSchema = createEventSchema.partial().extend({
  id: z.number().int().positive(),
});

export type UpdateEventInput = z.infer<typeof updateEventSchema>;

export const listEventsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),
  kind: eventKind.optional(),
  month: z.string().regex(/^\d{4}-\d{2}$/, "Must be YYYY-MM").optional(),
  active: z.coerce.boolean().optional(),
});

export type ListEventsQuery = z.infer<typeof listEventsQuerySchema>;
