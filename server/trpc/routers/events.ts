import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, staffProcedure } from "../init";
import {
  createEventSchema,
  updateEventSchema,
  listEventsQuerySchema,
} from "../../../shared/schemas/events";
import { EventsService } from "../../services/events";

export const eventsRouter = router({
  list: staffProcedure
    .input(listEventsQuerySchema.optional())
    .query(async ({ ctx, input }) => {
      return EventsService.list(ctx.db, input);
    }),

  get: staffProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const item = await EventsService.getById(ctx.db, input.id);
      if (!item) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Event with ID ${input.id} not found`,
        });
      }
      return item;
    }),

  getBySlug: staffProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      const item = await EventsService.getBySlug(ctx.db, input.slug);
      if (!item) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Event with slug '${input.slug}' not found`,
        });
      }
      return item;
    }),

  create: staffProcedure
    .input(createEventSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        return await EventsService.create(ctx.db, input, ctx.user?.id);
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
    .input(updateEventSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        return await EventsService.update(ctx.db, input, ctx.user?.id);
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

  setActive: staffProcedure
    .input(z.object({ id: z.number().int().positive(), active: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      try {
        return await EventsService.update(
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
        return await EventsService.delete(ctx.db, input.id, ctx.user?.id);
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
