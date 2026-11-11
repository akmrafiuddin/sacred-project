import { and, desc, eq, like, or, sql } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import * as schema from "../db/schema";
import { pujaBookings } from "../db/schema/bookings";
import { pujas } from "../db/schema/pujas";
import { AuditService } from "./audit";
import type {
  PujaBookingSubmission,
  ListBookingsQuery,
  BookingStatus,
} from "../../shared/schemas/forms";

function generateBookingRef(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Removed ambiguous 0, O, 1, I
  let rand = "";
  for (let i = 0; i < 5; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `KM-2026-${rand}`;
}

function parseJson<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export class BookingsService {
  /**
   * Public submission creates a booking request.
   * Returns only ref and thank you message — never leaks personal data or internal ID.
   */
  static async createBookingRequest(
    db: DrizzleD1Database<typeof schema>,
    input: PujaBookingSubmission,
    userId?: string | null
  ) {
    const now = Date.now();

    // Generate unique reference code with collision retry (up to 3 times)
    let ref = generateBookingRef();
    for (let i = 0; i < 3; i++) {
      const existing = await db
        .select({ id: pujaBookings.id })
        .from(pujaBookings)
        .where(eq(pujaBookings.ref, ref))
        .limit(1);
      if (existing.length === 0) break;
      ref = generateBookingRef();
    }

    await db.insert(pujaBookings).values({
      ref,
      userId: userId || null,
      pujaId: input.pujaId || null,
      name: input.name.trim(),
      phone: input.phone.trim(),
      email: input.email ? input.email.trim() : null,
      gotra: input.gotra ? input.gotra.trim() : null,
      preferredDate: input.preferredDate,
      note: input.note ? input.note.trim() : null,
      status: "new",
      createdAt: now,
      updatedAt: now,
    });

    return {
      success: true,
      ref,
      message:
        "Your puja booking request has been received. Our temple office will review and confirm with you.",
    };
  }

  // --- Devotee Queries (Session-Scoped) ---
  static async getUserBookings(db: DrizzleD1Database<typeof schema>, userId: string) {
    const rows = await db
      .select({
        ref: pujaBookings.ref,
        pujaId: pujaBookings.pujaId,
        preferredDate: pujaBookings.preferredDate,
        status: pujaBookings.status,
        gotra: pujaBookings.gotra,
        createdAt: pujaBookings.createdAt,
      })
      .from(pujaBookings)
      .where(eq(pujaBookings.userId, userId))
      .orderBy(desc(pujaBookings.createdAt));

    return rows;
  }

  static async listUserBookings(db: DrizzleD1Database<typeof schema>, userId: string) {
    return this.getUserBookings(db, userId);
  }

  static async cancelUserBooking(
    db: DrizzleD1Database<typeof schema>,
    ref: string,
    userId: string
  ) {
    const [booking] = await db
      .select()
      .from(pujaBookings)
      .where(and(eq(pujaBookings.ref, ref), eq(pujaBookings.userId, userId)))
      .limit(1);

    if (!booking) {
      throw new Error("Booking request not found or does not belong to you.");
    }

    if (booking.status !== "new") {
      throw new Error("Only 'new' requests can be cancelled");
    }

    await db
      .update(pujaBookings)
      .set({
        status: "cancelled",
        updatedAt: Date.now(),
      })
      .where(eq(pujaBookings.id, booking.id));

    return { success: true, message: `Booking request ${ref} has been cancelled.` };
  }

  // --- Admin Queries (adminProcedure / staffProcedure) ---
  static async adminList(db: DrizzleD1Database<typeof schema>, query?: ListBookingsQuery) {
    const page = query?.page || 1;
    const pageSize = Math.min(query?.pageSize || 20, 100);
    const offset = (page - 1) * pageSize;

    const conditions = [];

    if (query?.status) {
      conditions.push(eq(pujaBookings.status, query.status));
    }

    if (query?.date) {
      conditions.push(eq(pujaBookings.preferredDate, query.date));
    }

    if (query?.search && query.search.trim()) {
      const q = `%${query.search.trim()}%`;
      conditions.push(
        or(
          like(pujaBookings.name, q),
          like(pujaBookings.phone, q),
          like(pujaBookings.email, q),
          like(pujaBookings.ref, q),
          like(pujaBookings.gotra, q)
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [items, totalResult] = await Promise.all([
      db
        .select({
          id: pujaBookings.id,
          ref: pujaBookings.ref,
          userId: pujaBookings.userId,
          pujaId: pujaBookings.pujaId,
          name: pujaBookings.name,
          phone: pujaBookings.phone,
          email: pujaBookings.email,
          gotra: pujaBookings.gotra,
          preferredDate: pujaBookings.preferredDate,
          note: pujaBookings.note,
          status: pujaBookings.status,
          handledBy: pujaBookings.handledBy,
          adminNote: pujaBookings.adminNote,
          createdAt: pujaBookings.createdAt,
          updatedAt: pujaBookings.updatedAt,
          pujaNameRaw: pujas.name,
          pujaSlug: pujas.slug,
          pujaPrice: pujas.priceBdt,
        })
        .from(pujaBookings)
        .leftJoin(pujas, eq(pujaBookings.pujaId, pujas.id))
        .where(whereClause)
        .orderBy(desc(pujaBookings.createdAt))
        .limit(pageSize)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(pujaBookings)
        .where(whereClause),
    ]);

    const total = Number(totalResult[0]?.count || 0);

    const formattedItems = items.map((row) => ({
      ...row,
      pujaName: parseJson(row.pujaNameRaw, { en: "", bn: "" }),
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
    const rows = await db
      .select({
        id: pujaBookings.id,
        ref: pujaBookings.ref,
        userId: pujaBookings.userId,
        pujaId: pujaBookings.pujaId,
        name: pujaBookings.name,
        phone: pujaBookings.phone,
        email: pujaBookings.email,
        gotra: pujaBookings.gotra,
        preferredDate: pujaBookings.preferredDate,
        note: pujaBookings.note,
        status: pujaBookings.status,
        handledBy: pujaBookings.handledBy,
        adminNote: pujaBookings.adminNote,
        createdAt: pujaBookings.createdAt,
        updatedAt: pujaBookings.updatedAt,
        pujaNameRaw: pujas.name,
        pujaSlug: pujas.slug,
        pujaPrice: pujas.priceBdt,
      })
      .from(pujaBookings)
      .leftJoin(pujas, eq(pujaBookings.pujaId, pujas.id))
      .where(eq(pujaBookings.id, id))
      .limit(1);

    const row = rows[0];
    if (!row) return null;

    return {
      ...row,
      pujaName: parseJson(row.pujaNameRaw, { en: "", bn: "" }),
    };
  }

  static async adminUpdateStatus(
    db: DrizzleD1Database<typeof schema>,
    id: number,
    status: BookingStatus,
    adminNote?: string,
    handledBy?: string,
    userId?: string | null
  ) {
    const now = Date.now();
    const updateData: Partial<typeof pujaBookings.$inferInsert> = {
      status,
      updatedAt: now,
    };

    if (adminNote !== undefined) updateData.adminNote = adminNote;
    if (handledBy !== undefined) updateData.handledBy = handledBy;

    const [updated] = await db
      .update(pujaBookings)
      .set(updateData)
      .where(eq(pujaBookings.id, id))
      .returning();

    if (updated) {
      await AuditService.record(db, {
        userId,
        action: "update_status",
        entity: "puja_bookings",
        entityId: String(id),
        details: {
          ref: updated.ref,
          status,
          handledBy,
          adminNote,
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
    const [booking] = await db
      .select({ ref: pujaBookings.ref, name: pujaBookings.name })
      .from(pujaBookings)
      .where(eq(pujaBookings.id, id))
      .limit(1);

    const [deleted] = await db
      .delete(pujaBookings)
      .where(eq(pujaBookings.id, id))
      .returning();

    if (deleted && booking) {
      await AuditService.record(db, {
        userId,
        action: "delete",
        entity: "puja_bookings",
        entityId: String(id),
        details: {
          ref: booking.ref,
          name: booking.name,
        },
      }).catch((err) => console.warn("Audit record error:", err));
    }

    return !!deleted;
  }
}
