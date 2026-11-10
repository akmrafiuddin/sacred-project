import { z } from "zod";
import { router, staffProcedure } from "../init";
import {
  createEventSchema,
  updateEventSchema,
  listEventsQuerySchema,
} from "../../../shared/schemas/events";
import { EventsService } from "../../services/events";

export const eventsRouter = router({
  list: staffProcedure
    .input(listEventsQuerySchema)
    .query(async ({ ctx, input }) => {
      return EventsService.list(ctx.db, input);
    }),

  get: staffProcedure
    .input(z.object({ id: z.number().int() }))
    .query(async ({ ctx, input }) => {
      return EventsService.getById(ctx.db, input.id);
    }),

  getBySlug: staffProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      return EventsService.getBySlug(ctx.db, input.slug);
    }),

  create: staffProcedure
    .input(createEventSchema)
    .mutation(async ({ ctx, input }) => {
      return EventsService.create(ctx.db, input);
    }),

  update: staffProcedure
    .input(updateEventSchema)
    .mutation(async ({ ctx, input }) => {
      return EventsService.update(ctx.db, input);
    }),

  setActive: staffProcedure
    .input(z.object({ id: z.number().int(), active: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      return EventsService.update(ctx.db, { id: input.id, active: input.active });
    }),

  delete: staffProcedure
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      return EventsService.delete(ctx.db, input.id);
    }),
});
