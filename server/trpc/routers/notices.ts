import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, staffProcedure } from "../init";
import {
  createNoticeSchema,
  updateNoticeSchema,
  listNoticesQuerySchema,
} from "../../../shared/schemas/notices";
import { NoticesService } from "../../services/notices";

export const noticesRouter = router({
  list: staffProcedure
    .input(listNoticesQuerySchema.optional())
    .query(async ({ ctx, input }) => {
      return NoticesService.list(ctx.db, input);
    }),

  get: staffProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const item = await NoticesService.getById(ctx.db, input.id);
      if (!item) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Notice with ID ${input.id} not found`,
        });
      }
      return item;
    }),

  getBySlug: staffProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      const item = await NoticesService.getBySlug(ctx.db, input.slug);
      if (!item) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Notice with slug '${input.slug}' not found`,
        });
      }
      return item;
    }),

  create: staffProcedure
    .input(createNoticeSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        return await NoticesService.create(ctx.db, input, ctx.user?.id);
      } catch (err: any) {
        if (err?.statusCode === 409 || err?.status === 409) {
          throw new TRPCError({
            code: "CONFLICT",
            message: err.statusMessage || err.message,
          });
        }
        throw err;
      }
    }),

  update: staffProcedure
    .input(updateNoticeSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        return await NoticesService.update(ctx.db, input, ctx.user?.id);
      } catch (err: any) {
        if (err?.statusCode === 404 || err?.status === 404) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: err.statusMessage || err.message,
          });
        }
        if (err?.statusCode === 409 || err?.status === 409) {
          throw new TRPCError({
            code: "CONFLICT",
            message: err.statusMessage || err.message,
          });
        }
        throw err;
      }
    }),

  setPinned: staffProcedure
    .input(z.object({ id: z.number().int().positive(), pinned: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      try {
        return await NoticesService.update(
          ctx.db,
          { id: input.id, pinned: input.pinned },
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

  setActive: staffProcedure
    .input(z.object({ id: z.number().int().positive(), active: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      try {
        return await NoticesService.update(
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
        return await NoticesService.delete(ctx.db, input.id, ctx.user?.id);
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
