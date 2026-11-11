import { z } from "zod";
import { router, staffProcedure, adminProcedure } from "../init";
import {
  listBookingsQuerySchema,
  updateBookingStatusSchema,
} from "../../../shared/schemas/forms";
import { BookingsService } from "../../services/bookings";

export const bookingsRouter = router({
  list: staffProcedure
    .input(listBookingsQuerySchema.optional())
    .query(async ({ ctx, input }) => {
      return BookingsService.adminList(ctx.db, input);
    }),

  get: staffProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      return BookingsService.adminGet(ctx.db, input.id);
    }),

  updateStatus: staffProcedure
    .input(updateBookingStatusSchema)
    .mutation(async ({ ctx, input }) => {
      return BookingsService.adminUpdateStatus(
        ctx.db,
        input.id,
        input.status,
        input.adminNote,
        input.handledBy || ctx.user?.name || "Admin",
        ctx.user?.id
      );
    }),

  delete: adminProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      return BookingsService.adminDelete(ctx.db, input.id, ctx.user?.id);
    }),
});
