import { eq, desc, and, sql, gte, lte } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import { auditLogs } from "../db/schema/audit";
import { user } from "../db/schema/auth";
import type * as schema from "../db/schema";
import type { AuditLogQueryInput, CreateAuditLogInput } from "../../shared/schemas/audit";

export class AuditService {
  static async record(
    db: DrizzleD1Database<typeof schema>,
    input: CreateAuditLogInput
  ) {
    const at = Date.now();
    const detailsJson = input.details ? JSON.stringify(input.details) : null;

    const [inserted] = await db
      .insert(auditLogs)
      .values({
        userId: input.userId ?? null,
        action: input.action,
        entity: input.entity,
        entityId: input.entityId ?? null,
        details: detailsJson,
        at,
      })
      .returning();

    return inserted;
  }

  static async list(
    db: DrizzleD1Database<typeof schema>,
    input: AuditLogQueryInput
  ) {
    const { page, pageSize, userId, action, entity, startDate, endDate } = input;
    const offset = (page - 1) * pageSize;

    const conditions = [];

    if (userId) {
      conditions.push(eq(auditLogs.userId, userId));
    }

    if (action) {
      conditions.push(eq(auditLogs.action, action));
    }

    if (entity) {
      conditions.push(eq(auditLogs.entity, entity));
    }

    if (startDate) {
      const startMs = new Date(`${startDate}T00:00:00+06:00`).getTime();
      conditions.push(gte(auditLogs.at, startMs));
    }

    if (endDate) {
      const endMs = new Date(`${endDate}T23:59:59+06:00`).getTime();
      conditions.push(lte(auditLogs.at, endMs));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(auditLogs)
      .where(whereClause);

    const total = Number(countResult?.count || 0);

    const items = await db
      .select({
        id: auditLogs.id,
        userId: auditLogs.userId,
        userName: user.name,
        userEmail: user.email,
        action: auditLogs.action,
        entity: auditLogs.entity,
        entityId: auditLogs.entityId,
        details: auditLogs.details,
        at: auditLogs.at,
      })
      .from(auditLogs)
      .leftJoin(user, eq(auditLogs.userId, user.id))
      .where(whereClause)
      .orderBy(desc(auditLogs.at))
      .limit(pageSize)
      .offset(offset);

    return {
      items: items.map((item) => ({
        ...item,
        details: item.details ? JSON.parse(item.details) : null,
      })),
      total,
      page,
      pageSize,
    };
  }
}
