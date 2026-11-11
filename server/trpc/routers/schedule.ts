import { z } from "zod";
import { TRPCError } from "@trpc/server";
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
    .input(z.object({ id: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const item = await ScheduleService.getById(ctx.db, input.id);
      if (!item) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Daily schedule item with ID ${input.id} not found`,
        });
      }
      return item;
    }),

  create: staffProcedure
    .input(createScheduleSchema)
    .mutation(async ({ ctx, input }) => {
      return ScheduleService.create(ctx.db, input, ctx.user?.id);
    }),

  update: staffProcedure
    .input(updateScheduleSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        return await ScheduleService.update(ctx.db, input, ctx.user?.id);
      } catch (err: any) {
        if (err?.statusCode === 404 || err?.status === 404) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: err.statusMessage || err.message,
          });
        }
        throw err;
      }
    }),

  reorder: staffProcedure
    .input(reorderScheduleSchema)
    .mutation(async ({ ctx, input }) => {
      return ScheduleService.reorder(ctx.db, input, ctx.user?.id);
    }),

  setActive: staffProcedure
    .input(z.object({ id: z.number().int().positive(), active: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      try {
        return await ScheduleService.update(
          ctx.db,
          { id: input.id, active: input.active },
          ctx.user?.id
        );
      } catch (err: any) {
        if (err?.statusCode === 404 || err?.status === 404) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: err.statusMessage || err.message,
          });
        }
        throw err;
      }
    }),

  delete: staffProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      try {
        return await ScheduleService.delete(ctx.db, input.id, ctx.user?.id);
      } catch (err: any) {
        if (err?.statusCode === 404 || err?.status === 404) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: err.statusMessage || err.message,
          });
        }
        throw err;
      }
    }),
});
