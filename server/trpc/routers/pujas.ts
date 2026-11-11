import { z } from "zod";
import { TRPCError } from "@trpc/server";
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
    .input(listPujasQuerySchema.optional())
    .query(async ({ ctx, input }) => {
      return PujasService.list(ctx.db, input);
    }),

  get: staffProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const item = await PujasService.getById(ctx.db, input.id);
      if (!item) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Puja offering with ID ${input.id} not found`,
        });
      }
      return item;
    }),

  getBySlug: staffProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      const item = await PujasService.getBySlug(ctx.db, input.slug);
      if (!item) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Puja offering with slug '${input.slug}' not found`,
        });
      }
      return item;
    }),

  create: staffProcedure
    .input(createPujaSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        return await PujasService.create(ctx.db, input, ctx.user?.id);
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
    .input(updatePujaSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        return await PujasService.update(ctx.db, input, ctx.user?.id);
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
    .input(reorderPujasSchema)
    .mutation(async ({ ctx, input }) => {
      return PujasService.reorder(ctx.db, input, ctx.user?.id);
    }),

  setActive: staffProcedure
    .input(z.object({ id: z.number().int().positive(), active: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      try {
        return await PujasService.update(
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

  setBookable: staffProcedure
    .input(z.object({ id: z.number().int().positive(), bookable: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      try {
        return await PujasService.update(
          ctx.db,
          { id: input.id, bookable: input.bookable },
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
        return await PujasService.delete(ctx.db, input.id, ctx.user?.id);
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
