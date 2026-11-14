import { z } from "zod";
import { router, staffProcedure, adminProcedure, protectedProcedure } from "../init";
import {
  listVisitationsQuerySchema,
  updateVisitationStatusSchema,
  checkInVisitationSchema,
} from "../../../shared/schemas/visitations";
import { VisitationsService } from "../../services/visitations";

export const visitationsRouter = router({
  list: staffProcedure
    .input(listVisitationsQuerySchema.optional())
    .query(async ({ ctx, input }) => {
      return VisitationsService.adminList(ctx.db, input);
    }),

  get: staffProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      return VisitationsService.adminGet(ctx.db, input.id);
    }),

  updateStatus: staffProcedure
    .input(updateVisitationStatusSchema)
    .mutation(async ({ ctx, input }) => {
      return VisitationsService.adminUpdateStatus(
        ctx.db,
        input.id,
        input.status,
        input.adminNotes,
        input.handledBy || ctx.user?.name || "Admin",
        ctx.user?.id
      );
    }),

  checkIn: staffProcedure
    .input(checkInVisitationSchema)
    .mutation(async ({ ctx, input }) => {
      return VisitationsService.adminCheckIn(
        ctx.db,
        input.id,
        input.notes,
        ctx.user?.name || "Temple Office Staff",
        ctx.user?.id
      );
    }),

  delete: adminProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      return VisitationsService.adminDelete(ctx.db, input.id, ctx.user?.id);
    }),

  getStats: staffProcedure
    .input(z.object({ date: z.string().optional() }).optional())
    .query(async ({ ctx, input }) => {
      return VisitationsService.getStats(ctx.db, input?.date);
    }),

  // Devotee session endpoints
  myVisitations: protectedProcedure.query(async ({ ctx }) => {
    return VisitationsService.listUserVisitations(ctx.db, ctx.user.id);
  }),

  cancelMyVisitation: protectedProcedure
    .input(z.object({ ref: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return VisitationsService.cancelUserVisitation(
        ctx.db,
        input.ref,
        ctx.user.id
      );
    }),
});
