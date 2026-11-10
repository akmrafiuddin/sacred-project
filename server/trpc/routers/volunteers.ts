import { z } from "zod";
import { router, adminProcedure } from "../init";
import {
  listVolunteersQuerySchema,
  updateVolunteerStatusSchema,
} from "../../../shared/schemas/forms";
import { VolunteersService } from "../../services/volunteers";

export const volunteersRouter = router({
  list: adminProcedure
    .input(listVolunteersQuerySchema)
    .query(async ({ ctx, input }) => {
      return VolunteersService.adminList(ctx.db, input);
    }),

  get: adminProcedure
    .input(z.object({ id: z.number().int() }))
    .query(async ({ ctx, input }) => {
      return VolunteersService.adminGet(ctx.db, input.id);
    }),

  updateStatus: adminProcedure
    .input(updateVolunteerStatusSchema)
    .mutation(async ({ ctx, input }) => {
      return VolunteersService.adminUpdateStatus(
        ctx.db,
        input.id,
        input.status,
        input.adminNote
      );
    }),

  delete: adminProcedure
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      return VolunteersService.adminDelete(ctx.db, input.id);
    }),
});
