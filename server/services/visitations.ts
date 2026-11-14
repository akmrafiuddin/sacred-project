import { and, desc, eq, like, or, sql } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import * as schema from "../db/schema";
import { visitations } from "../db/schema/visitations";
import { AuditService } from "./audit";
import {
  TIME_SLOT_DESCRIPTIONS,
  type CreateVisitationInput,
  type ListVisitationsQuery,
  type VisitationStatus,
} from "../../shared/schemas/visitations";

function generateVisitationRef(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let rand = "";
  for (let i = 0; i < 5; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `VST-2026-${rand}`;
}

export class VisitationsService {
  /**
   * Public or authenticated devotee generates a temple darshan / visitation pass.
   */
  static async createVisitation(
    db: DrizzleD1Database<typeof schema>,
    input: CreateVisitationInput,
    userId?: string | null
  ) {
    const now = Date.now();

    // Generate unique reference code with collision retry (up to 3 times)
    let ref = generateVisitationRef();
    for (let i = 0; i < 3; i++) {
      const existing = await db
        .select({ id: visitations.id })
        .from(visitations)
        .where(eq(visitations.ref, ref))
        .limit(1);
      if (existing.length === 0) break;
      ref = generateVisitationRef();
    }

    await db.insert(visitations).values({
      ref,
      userId: userId || null,
      name: input.name.trim(),
      phone: input.phone.trim(),
      email: input.email ? input.email.trim() : null,
      visitDate: input.visitDate,
      timeSlot: input.timeSlot,
      visitorCount: input.visitorCount,
      purpose: input.purpose,
      specialNeeds: input.specialNeeds ? input.specialNeeds.trim() : null,
      status: "confirmed", // Pre-confirmed e-pass for smooth devotee darshan
      createdAt: now,
      updatedAt: now,
    });

    return {
      success: true,
      ref,
      visitDate: input.visitDate,
      timeSlot: input.timeSlot,
      visitorCount: input.visitorCount,
      message:
        "Your temple darshan pass has been confirmed. Please present this reference code upon arrival at the sanctum entrance.",
    };
  }

  /**
   * Public reference code lookup for visitor pass verification.
   */
  static async getByRef(db: DrizzleD1Database<typeof schema>, ref: string) {
    const rows = await db
      .select({
        id: visitations.id,
        ref: visitations.ref,
        name: visitations.name,
        visitDate: visitations.visitDate,
        timeSlot: visitations.timeSlot,
        visitorCount: visitations.visitorCount,
        purpose: visitations.purpose,
        specialNeeds: visitations.specialNeeds,
        status: visitations.status,
        checkInAt: visitations.checkInAt,
        adminNotes: visitations.adminNotes,
        createdAt: visitations.createdAt,
      })
      .from(visitations)
      .where(eq(visitations.ref, ref.trim().toUpperCase()))
      .limit(1);

    const row = rows[0];
    if (!row) return null;

    return {
      ...row,
      timeSlotDescription:
        TIME_SLOT_DESCRIPTIONS[row.timeSlot] || row.timeSlot,
    };
  }

  /**
   * Devotee query: List all visits for the currently logged in user.
   */
  static async listUserVisitations(
    db: DrizzleD1Database<typeof schema>,
    userId: string
  ) {
    const rows = await db
      .select({
        id: visitations.id,
        ref: visitations.ref,
        visitDate: visitations.visitDate,
        timeSlot: visitations.timeSlot,
        visitorCount: visitations.visitorCount,
        purpose: visitations.purpose,
        status: visitations.status,
        checkInAt: visitations.checkInAt,
        createdAt: visitations.createdAt,
      })
      .from(visitations)
      .where(eq(visitations.userId, userId))
      .orderBy(desc(visitations.visitDate));

    return rows.map((r) => ({
      ...r,
      timeSlotDescription: TIME_SLOT_DESCRIPTIONS[r.timeSlot] || r.timeSlot,
    }));
  }

  /**
   * Devotee cancellation: Cancel a confirmed or requested visitation pass.
   */
  static async cancelUserVisitation(
    db: DrizzleD1Database<typeof schema>,
    ref: string,
    userId: string
  ) {
    const [visit] = await db
      .select()
      .from(visitations)
      .where(and(eq(visitations.ref, ref), eq(visitations.userId, userId)))
      .limit(1);

    if (!visit) {
      throw new Error("Visitation pass not found or does not belong to your account.");
    }

    if (visit.status === "checked_in") {
      throw new Error("Cannot cancel a visit that has already taken place.");
    }

    await db
      .update(visitations)
      .set({
        status: "cancelled",
        updatedAt: Date.now(),
      })
      .where(eq(visitations.id, visit.id));

    return { success: true, message: `Visitation pass ${ref} has been cancelled.` };
  }

  // --- Admin Methods (staffProcedure / adminProcedure) ---

  /**
   * Admin filterable list of devotee visits and pilgrim passes.
   */
  static async adminList(
    db: DrizzleD1Database<typeof schema>,
    query?: ListVisitationsQuery
  ) {
    const page = query?.page || 1;
    const pageSize = Math.min(query?.pageSize || 20, 100);
    const offset = (page - 1) * pageSize;

    const conditions = [];

    if (query?.status) {
      conditions.push(eq(visitations.status, query.status));
    }

    if (query?.timeSlot) {
      conditions.push(eq(visitations.timeSlot, query.timeSlot));
    }

    if (query?.purpose) {
      conditions.push(eq(visitations.purpose, query.purpose));
    }

    if (query?.date) {
      conditions.push(eq(visitations.visitDate, query.date));
    }

    if (query?.search && query.search.trim()) {
      const q = `%${query.search.trim()}%`;
      conditions.push(
        or(
          like(visitations.name, q),
          like(visitations.phone, q),
          like(visitations.email, q),
          like(visitations.ref, q)
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [items, totalResult] = await Promise.all([
      db
        .select()
        .from(visitations)
        .where(whereClause)
        .orderBy(desc(visitations.visitDate), desc(visitations.createdAt))
        .limit(pageSize)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(visitations)
        .where(whereClause),
    ]);

    const total = Number(totalResult[0]?.count || 0);

    const formattedItems = items.map((row) => ({
      ...row,
      timeSlotDescription:
        TIME_SLOT_DESCRIPTIONS[row.timeSlot] || row.timeSlot,
    }));

    return {
      items: formattedItems,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  static async adminGet(db: DrizzleD1Database<typeof schema>, id: number) {
    const [row] = await db
      .select()
      .from(visitations)
      .where(eq(visitations.id, id))
      .limit(1);

    if (!row) return null;

    return {
      ...row,
      timeSlotDescription:
        TIME_SLOT_DESCRIPTIONS[row.timeSlot] || row.timeSlot,
    };
  }

  static async adminUpdateStatus(
    db: DrizzleD1Database<typeof schema>,
    id: number,
    status: VisitationStatus,
    adminNotes?: string,
    handledBy?: string,
    userId?: string | null
  ) {
    const now = Date.now();
    const updateData: Partial<typeof visitations.$inferInsert> = {
      status,
      updatedAt: now,
    };

    if (adminNotes !== undefined) updateData.adminNotes = adminNotes;
    if (handledBy !== undefined) updateData.handledBy = handledBy;

    const [updated] = await db
      .update(visitations)
      .set(updateData)
      .where(eq(visitations.id, id))
      .returning();

    if (updated) {
      await AuditService.record(db, {
        userId,
        action: "update_status",
        entity: "visitations",
        entityId: String(id),
        details: {
          ref: updated.ref,
          status,
          handledBy,
          adminNotes,
        },
      }).catch((err) => console.warn("Audit record error:", err));
    }

    return updated;
  }

  /**
   * Record devotee check-in at temple entrance.
   */
  static async adminCheckIn(
    db: DrizzleD1Database<typeof schema>,
    id: number,
    notes?: string,
    handledBy?: string,
    userId?: string | null
  ) {
    const now = Date.now();
    const updateData: Partial<typeof visitations.$inferInsert> = {
      status: "checked_in",
      checkInAt: now,
      updatedAt: now,
    };

    if (notes !== undefined) updateData.adminNotes = notes;
    if (handledBy !== undefined) updateData.handledBy = handledBy;

    const [updated] = await db
      .update(visitations)
      .set(updateData)
      .where(eq(visitations.id, id))
      .returning();

    if (updated) {
      await AuditService.record(db, {
        userId,
        action: "check_in",
        entity: "visitations",
        entityId: String(id),
        details: {
          ref: updated.ref,
          checkInAt: now,
          handledBy,
          visitorCount: updated.visitorCount,
        },
      }).catch((err) => console.warn("Audit record error:", err));
    }

    return updated;
  }

  static async adminDelete(
    db: DrizzleD1Database<typeof schema>,
    id: number,
    userId?: string | null
  ) {
    const [visit] = await db
      .select({ ref: visitations.ref, name: visitations.name })
      .from(visitations)
      .where(eq(visitations.id, id))
      .limit(1);

    const [deleted] = await db
      .delete(visitations)
      .where(eq(visitations.id, id))
      .returning();

    if (deleted && visit) {
      await AuditService.record(db, {
        userId,
        action: "delete",
        entity: "visitations",
        entityId: String(id),
        details: {
          ref: visit.ref,
          name: visit.name,
        },
      }).catch((err) => console.warn("Audit record error:", err));
    }

    return !!deleted;
  }

  /**
   * Real-time visitor counts and slot stats for a given date (defaults to today in Asia/Dhaka).
   */
  static async getStats(
    db: DrizzleD1Database<typeof schema>,
    targetDate?: string
  ) {
    const date = targetDate || new Date().toISOString().slice(0, 10);

    const rows = await db
      .select({
        timeSlot: visitations.timeSlot,
        status: visitations.status,
        visitorCount: visitations.visitorCount,
      })
      .from(visitations)
      .where(eq(visitations.visitDate, date));

    let totalVisitors = 0;
    let checkedInVisitors = 0;
    const bySlot: Record<string, number> = {
      morning: 0,
      midday: 0,
      evening: 0,
      special_aarti: 0,
    };

    for (const r of rows) {
      if (r.status !== "cancelled") {
        totalVisitors += r.visitorCount;
        bySlot[r.timeSlot] = (bySlot[r.timeSlot] || 0) + r.visitorCount;
      }
      if (r.status === "checked_in") {
        checkedInVisitors += r.visitorCount;
      }
    }

    return {
      date,
      totalBookings: rows.length,
      totalVisitors,
      checkedInVisitors,
      bySlot,
    };
  }
}
