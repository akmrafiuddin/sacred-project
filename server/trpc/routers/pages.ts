import { z } from "zod";
import { router, staffProcedure } from "../init";
import {
  createPageSchema,
  updatePageSchema,
  listPagesQuerySchema,
} from "../../../shared/schemas/pages";
import { PagesService } from "../../services/pages";

export const pagesRouter = router({
  list: staffProcedure
    .input(listPagesQuerySchema)
    .query(async ({ ctx, input }) => {
      return PagesService.list(ctx.db, input);
    }),

  get: staffProcedure
    .input(z.object({ id: z.number().int() }))
    .query(async ({ ctx, input }) => {
      return PagesService.getById(ctx.db, input.id);
    }),

  getBySlug: staffProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      return PagesService.getBySlug(ctx.db, input.slug);
    }),

  create: staffProcedure
    .input(createPageSchema)
    .mutation(async ({ ctx, input }) => {
      return PagesService.create(ctx.db, input);
    }),

  update: staffProcedure
    .input(updatePageSchema)
    .mutation(async ({ ctx, input }) => {
      return PagesService.update(ctx.db, input);
    }),

  setPublished: staffProcedure
    .input(z.object({ id: z.number().int(), published: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      return PagesService.update(ctx.db, { id: input.id, published: input.published });
    }),

  delete: staffProcedure
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      return PagesService.delete(ctx.db, input.id);
    }),
});
