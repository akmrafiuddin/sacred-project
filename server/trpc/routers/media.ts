import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, staffProcedure } from "../init";
import { updateMediaSchema, mediaQuerySchema } from "../../../shared/schemas/media";
import { MediaService } from "../../services/media";

export const mediaRouter = router({
  list: staffProcedure
    .input(mediaQuerySchema)
    .query(async ({ ctx, input }) => {
      return MediaService.listMedia(ctx.db, input);
    }),

  get: staffProcedure
    .input(z.object({ id: z.number().int() }))
    .query(async ({ ctx, input }) => {
      const item = await MediaService.getMediaById(ctx.db, input.id);
      if (!item) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Media with id ${input.id} not found`,
        });
      }
      return item;
    }),

  update: staffProcedure
    .input(updateMediaSchema)
    .mutation(async ({ ctx, input }) => {
      return MediaService.updateMedia(ctx.db, input);
    }),

  checkReferences: staffProcedure
    .input(z.object({ id: z.number().int() }))
    .query(async ({ ctx, input }) => {
      const item = await MediaService.getMediaById(ctx.db, input.id);
      if (!item) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Media with id ${input.id} not found`,
        });
      }
      return MediaService.checkMediaReferences(ctx.db, item.id, item.key);
    }),

  delete: staffProcedure
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      try {
        return await MediaService.deleteMedia(ctx.db, ctx.mediaBucket, input.id);
      } catch (err: any) {
        if (err?.statusCode === 409 || err?.status === 409) {
          throw new TRPCError({
            code: "CONFLICT",
            message: err.statusMessage || err.message,
          });
        }
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
