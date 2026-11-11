import { z } from "zod";
import { router, adminProcedure, staffProcedure } from "../init";
import {
  listMessagesQuerySchema,
  updateMessageStatusSchema,
} from "../../../shared/schemas/forms";
import { MessagesService } from "../../services/messages";

export const messagesRouter = router({
  list: staffProcedure
    .input(listMessagesQuerySchema.optional())
    .query(async ({ ctx, input }) => {
      return MessagesService.adminList(ctx.db, input);
    }),

  get: staffProcedure
    .input(z.object({ id: z.number().int() }))
    .query(async ({ ctx, input }) => {
      return MessagesService.adminGet(ctx.db, input.id);
    }),

  updateStatus: staffProcedure
    .input(updateMessageStatusSchema)
    .mutation(async ({ ctx, input }) => {
      return MessagesService.adminUpdateStatus(
        ctx.db,
        input.id,
        input.status,
        input.adminNote
      );
    }),

  delete: adminProcedure
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      return MessagesService.adminDelete(ctx.db, input.id);
    }),
});
