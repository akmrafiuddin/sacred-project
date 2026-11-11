import { z } from "zod";
import { localized, hhmm } from "./common";

export const createScheduleSchema = z.object({
  time: hhmm,
  title: localized,
  description: localized,
  sortOrder: z.number().int().default(0),
  active: z.boolean().default(true),
});

export type CreateScheduleInput = z.infer<typeof createScheduleSchema>;

export const updateScheduleSchema = createScheduleSchema.partial().extend({
  id: z.number().int().positive(),
});

export type UpdateScheduleInput = z.infer<typeof updateScheduleSchema>;

export const listScheduleQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(50),
  search: z.string().trim().optional(),
  active: z.coerce.boolean().optional(),
});

export type ListScheduleQuery = z.infer<typeof listScheduleQuerySchema>;

export const reorderScheduleSchema = z.object({
  items: z.array(
    z.object({
      id: z.number().int().positive(),
      sortOrder: z.number().int(),
    })
  ).min(1, "At least one item is required to reorder"),
});

export type ReorderScheduleInput = z.infer<typeof reorderScheduleSchema>;
