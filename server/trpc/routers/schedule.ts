import { z } from "zod";
import { router, staffProcedure } from "../init";
import {
  createScheduleSchema,
  updateScheduleSchema,
  listScheduleQuerySchema,
  reorderScheduleSchema,
} from "../../../shared/schemas/schedule";
import { ScheduleService } from "../../services/schedule";

export const scheduleRouter = router({
  list: staffProcedure
    .input(listScheduleQuerySchema.optional())
    .query(async ({ ctx, input }) => {
      return ScheduleService.list(ctx.db, input);
    }),

  get: staffProcedure
    .input(z.object({ id: z.number().int() }))
    .query(async ({ ctx, input }) => {
      return ScheduleService.getById(ctx.db, input.id);
    }),

  create: staffProcedure
    .input(createScheduleSchema)
    .mutation(async ({ ctx, input }) => {
      return ScheduleService.create(ctx.db, input);
    }),

  update: staffProcedure
    .input(updateScheduleSchema)
    .mutation(async ({ ctx, input }) => {
      return ScheduleService.update(ctx.db, input);
    }),

  reorder: staffProcedure
    .input(reorderScheduleSchema)
    .mutation(async ({ ctx, input }) => {
      return ScheduleService.reorder(ctx.db, input);
    }),

  setActive: staffProcedure
    .input(z.object({ id: z.number().int(), active: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      return ScheduleService.update(ctx.db, { id: input.id, active: input.active });
    }),

  delete: staffProcedure
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      return ScheduleService.delete(ctx.db, input.id);
    }),
});
