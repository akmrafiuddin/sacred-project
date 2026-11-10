import { z } from "zod";
import { pagination, isoDate } from "./common";

export const AUDIT_ACTIONS = [
  "create",
  "update",
  "delete",
  "login",
  "purge",
  "cancel",
  "status_change",
] as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[number];

export const auditLogQuerySchema = pagination.extend({
  userId: z.string().optional(),
  action: z.string().optional(),
  entity: z.string().optional(),
  startDate: isoDate.optional(),
  endDate: isoDate.optional(),
});

export type AuditLogQueryInput = z.infer<typeof auditLogQuerySchema>;

export const createAuditLogSchema = z.object({
  userId: z.string().nullable().optional(),
  action: z.string(),
  entity: z.string(),
  entityId: z.string().nullable().optional(),
  details: z.record(z.string(), z.unknown()).nullable().optional(),
});

export type CreateAuditLogInput = z.infer<typeof createAuditLogSchema>;
