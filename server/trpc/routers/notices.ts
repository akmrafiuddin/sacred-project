import { z } from "zod";
import { router, staffProcedure } from "../init";
import {
  createNoticeSchema,
  updateNoticeSchema,
  listNoticesQuerySchema,
} from "../../../shared/schemas/notices";
import { NoticesService } from "../../services/notices";

export const noticesRouter = router({
  list: staffProcedure
    .input(listNoticesQuerySchema)
    .query(async ({ ctx, input }) => {
      return NoticesService.list(ctx.db, input);
    }),

  get: staffProcedure
    .input(z.object({ id: z.number().int() }))
    .query(async ({ ctx, input }) => {
      return NoticesService.getById(ctx.db, input.id);
    }),

  getBySlug: staffProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      return NoticesService.getBySlug(ctx.db, input.slug);
    }),

  create: staffProcedure
    .input(createNoticeSchema)
    .mutation(async ({ ctx, input }) => {
      return NoticesService.create(ctx.db, input);
    }),

  update: staffProcedure
    .input(updateNoticeSchema)
    .mutation(async ({ ctx, input }) => {
      return NoticesService.update(ctx.db, input);
    }),

  setPinned: staffProcedure
    .input(z.object({ id: z.number().int(), pinned: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      return NoticesService.update(ctx.db, { id: input.id, pinned: input.pinned });
    }),

  setActive: staffProcedure
    .input(z.object({ id: z.number().int(), active: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      return NoticesService.update(ctx.db, { id: input.id, active: input.active });
    }),

  delete: staffProcedure
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      return NoticesService.delete(ctx.db, input.id);
    }),
});
