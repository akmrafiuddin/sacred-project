import { and, desc, eq, like, sql } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import * as schema from "../db/schema";
import { pujaBookings } from "../db/schema/bookings";
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
    let ref = generateBookingRef();

    // Ensure unique ref
    let attempts = 0;
    while (attempts < 5) {
      const existing = await db
        .select({ id: pujaBookings.id })
        .from(pujaBookings)
        .where(eq(pujaBookings.ref, ref))
        .limit(1);

      if (existing.length === 0) break;
      ref = generateBookingRef();
      attempts++;
    }

    await db.insert(pujaBookings).values({
      ref,
      userId: userId || null,
      pujaId: input.pujaId || null,
      name: input.name,
      phone: input.phone,
      email: input.email || null,
      gotra: input.gotra || null,
      preferredDate: input.preferredDate,
      note: input.note || null,
      status: "new",
      createdAt: now,
      updatedAt: now,
    });

    return {
      ref,
      message:
        "Your puja booking request has been received. Our sanctum office will contact you via phone to verify details and finalize the sankalp timing.",
    };
  }

  /**
   * Devotee user profile query: returns ONLY bookings owned by the authenticated userId.
   */
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

  /**
   * Devotee user cancellation: only works if userId matches AND status is currently 'new'.
   */
  static async cancelUserBooking(
    db: DrizzleD1Database<typeof schema>,
    ref: string,
    userId: string
  ) {
    const rows = await db
      .select()
      .from(pujaBookings)
      .where(and(eq(pujaBookings.ref, ref), eq(pujaBookings.userId, userId)))
      .limit(1);

    const booking = rows[0];
    if (!booking) {
      throw new Error(`Booking request '${ref}' not found`);
    }

    if (booking.status !== "new") {
      throw new Error(
        `Cannot cancel booking request with status '${booking.status}'. Only 'new' requests can be cancelled online. Please contact the temple office.`
      );
    }

    const now = Date.now();
    await db
      .update(pujaBookings)
      .set({
        status: "cancelled",
        updatedAt: now,
      })
      .where(eq(pujaBookings.id, booking.id));

    return { success: true, message: `Booking request ${ref} has been cancelled.` };
  }

  // --- Admin Queries (adminProcedure only) ---
  static async adminList(db: DrizzleD1Database<typeof schema>, query: ListBookingsQuery) {
    const page = query.page || 1;
    const pageSize = Math.min(query.pageSize || 20, 100);
    const offset = (page - 1) * pageSize;

    const conditions = [];

    if (query.status) {
      conditions.push(eq(pujaBookings.status, query.status));
    }

    if (query.date) {
      conditions.push(eq(pujaBookings.preferredDate, query.date));
    }

    if (query.search) {
      conditions.push(like(pujaBookings.name, `%${query.search}%`));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [items, totalResult] = await Promise.all([
      db
        .select()
        .from(pujaBookings)
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

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  static async adminGet(db: DrizzleD1Database<typeof schema>, id: number) {
    const rows = await db
      .select()
      .from(pujaBookings)
      .where(eq(pujaBookings.id, id))
      .limit(1);

    return rows[0] || null;
  }

  static async adminUpdateStatus(
    db: DrizzleD1Database<typeof schema>,
    id: number,
    status: BookingStatus,
    adminNote?: string,
    handledBy?: string
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

    return updated;
  }

  static async adminDelete(db: DrizzleD1Database<typeof schema>, id: number) {
    const [deleted] = await db
      .delete(pujaBookings)
      .where(eq(pujaBookings.id, id))
      .returning();

    return !!deleted;
  }
}
