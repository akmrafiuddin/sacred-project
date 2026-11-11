import { z } from "zod";
import { TRPCError } from "@trpc/server";
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
    .input(listDeitiesQuerySchema.optional())
    .query(async ({ ctx, input }) => {
      return DeitiesService.list(ctx.db, input);
    }),

  get: staffProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const item = await DeitiesService.getById(ctx.db, input.id);
      if (!item) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Deity with ID ${input.id} not found`,
        });
      }
      return item;
    }),

  getBySlug: staffProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      const item = await DeitiesService.getBySlug(ctx.db, input.slug);
      if (!item) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Deity with slug '${input.slug}' not found`,
        });
      }
      return item;
    }),

  create: staffProcedure
    .input(createDeitySchema)
    .mutation(async ({ ctx, input }) => {
      try {
        return await DeitiesService.create(ctx.db, input, ctx.user?.id);
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
    .input(updateDeitySchema)
    .mutation(async ({ ctx, input }) => {
      try {
        return await DeitiesService.update(ctx.db, input, ctx.user?.id);
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

  reorder: staffProcedure
    .input(reorderDeitiesSchema)
    .mutation(async ({ ctx, input }) => {
      return DeitiesService.reorder(ctx.db, input, ctx.user?.id);
    }),

  setActive: staffProcedure
    .input(z.object({ id: z.number().int().positive(), active: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      try {
        return await DeitiesService.update(
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
        return await DeitiesService.delete(ctx.db, input.id, ctx.user?.id);
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
