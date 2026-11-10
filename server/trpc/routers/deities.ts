import { z } from "zod";
import { router, staffProcedure } from "../init";
import {
  createDeitySchema,
  updateDeitySchema,
  listDeitiesQuerySchema,
  reorderDeitiesSchema,
} from "../../../shared/schemas/deities";
import { DeitiesService } from "../../services/deities";

export const deitiesRouter = router({
  list: staffProcedure
    .input(listDeitiesQuerySchema)
    .query(async ({ ctx, input }) => {
      return DeitiesService.list(ctx.db, input);
    }),

  get: staffProcedure
    .input(z.object({ id: z.number().int() }))
    .query(async ({ ctx, input }) => {
      return DeitiesService.getById(ctx.db, input.id);
    }),

  getBySlug: staffProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      return DeitiesService.getBySlug(ctx.db, input.slug);
    }),

  create: staffProcedure
    .input(createDeitySchema)
    .mutation(async ({ ctx, input }) => {
      return DeitiesService.create(ctx.db, input);
    }),

  update: staffProcedure
    .input(updateDeitySchema)
    .mutation(async ({ ctx, input }) => {
      return DeitiesService.update(ctx.db, input);
    }),

  reorder: staffProcedure
    .input(reorderDeitiesSchema)
    .mutation(async ({ ctx, input }) => {
      return DeitiesService.reorder(ctx.db, input);
    }),

  setActive: staffProcedure
    .input(z.object({ id: z.number().int(), active: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      return DeitiesService.update(ctx.db, { id: input.id, active: input.active });
    }),

  delete: staffProcedure
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      return DeitiesService.delete(ctx.db, input.id);
    }),
});
