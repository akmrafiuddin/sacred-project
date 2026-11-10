import { z } from "zod";
import { router, adminProcedure } from "../init";
import { auditLogQuerySchema } from "../../../shared/schemas/audit";
import { AuditService } from "../../services/audit";
import { RetentionService } from "../../services/retention";

export const auditRouter = router({
  list: adminProcedure
    .input(auditLogQuerySchema)
    .query(async ({ ctx, input }) => {
      return AuditService.list(ctx.db, input);
    }),

  purgeOldRecords: adminProcedure
    .input(
      z.object({
        retentionDays: z.number().int().min(30).default(365),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return RetentionService.purgeOldRecords(
        ctx.db,
        input.retentionDays,
        ctx.user.id
      );
    }),
});

