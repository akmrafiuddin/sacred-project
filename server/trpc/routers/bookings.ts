import { z } from "zod";
import { router, adminProcedure } from "../init";
import {
  listBookingsQuerySchema,
  updateBookingStatusSchema,
} from "../../../shared/schemas/forms";
import { BookingsService } from "../../services/bookings";

export const bookingsRouter = router({
  list: adminProcedure
    .input(listBookingsQuerySchema)
    .query(async ({ ctx, input }) => {
      return BookingsService.adminList(ctx.db, input);
    }),

  get: adminProcedure
    .input(z.object({ id: z.number().int() }))
    .query(async ({ ctx, input }) => {
      return BookingsService.adminGet(ctx.db, input.id);
    }),

  updateStatus: adminProcedure
    .input(updateBookingStatusSchema)
    .mutation(async ({ ctx, input }) => {
      return BookingsService.adminUpdateStatus(
        ctx.db,
        input.id,
        input.status,
        input.adminNote,
        input.handledBy || ctx.user?.name || "Admin"
      );
    }),

  delete: adminProcedure
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      return BookingsService.adminDelete(ctx.db, input.id);
    }),
});
