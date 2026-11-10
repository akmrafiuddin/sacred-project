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
  active: z.coerce.boolean().optional(),
});

export type ListScheduleQuery = z.infer<typeof listScheduleQuerySchema>;

export const reorderScheduleSchema = z.object({
  items: z.array(
    z.object({
      id: z.number().int().positive(),
      sortOrder: z.number().int(),
    })
  ),
});

export type ReorderScheduleInput = z.infer<typeof reorderScheduleSchema>;
