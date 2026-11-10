import { z } from "zod";
import { router, staffProcedure } from "../init";
import {
  createPujaSchema,
  updatePujaSchema,
  listPujasQuerySchema,
  reorderPujasSchema,
} from "../../../shared/schemas/pujas";
import { PujasService } from "../../services/pujas";

export const pujasRouter = router({
  list: staffProcedure
    .input(listPujasQuerySchema)
    .query(async ({ ctx, input }) => {
      return PujasService.list(ctx.db, input);
    }),

  get: staffProcedure
    .input(z.object({ id: z.number().int() }))
    .query(async ({ ctx, input }) => {
      return PujasService.getById(ctx.db, input.id);
    }),

  getBySlug: staffProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      return PujasService.getBySlug(ctx.db, input.slug);
    }),

  create: staffProcedure
    .input(createPujaSchema)
    .mutation(async ({ ctx, input }) => {
      return PujasService.create(ctx.db, input);
    }),

  update: staffProcedure
    .input(updatePujaSchema)
    .mutation(async ({ ctx, input }) => {
      return PujasService.update(ctx.db, input);
    }),

  reorder: staffProcedure
    .input(reorderPujasSchema)
    .mutation(async ({ ctx, input }) => {
      return PujasService.reorder(ctx.db, input);
    }),

  setActive: staffProcedure
    .input(z.object({ id: z.number().int(), active: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      return PujasService.update(ctx.db, { id: input.id, active: input.active });
    }),

  delete: staffProcedure
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      return PujasService.delete(ctx.db, input.id);
    }),
});
