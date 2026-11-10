import { and, desc, eq, like, sql } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import * as schema from "../db/schema";
import { volunteers } from "../db/schema/volunteers";
import type {
  VolunteerSubmission,
  ListVolunteersQuery,
  VolunteerStatus,
} from "../../shared/schemas/forms";

export class VolunteersService {
  static async createVolunteer(
    db: DrizzleD1Database<typeof schema>,
    input: VolunteerSubmission
  ) {
    const now = Date.now();
    await db.insert(volunteers).values({
      name: input.name,
      phone: input.phone,
      area: input.area,
      note: input.note || null,
      status: "new",
      createdAt: now,
      updatedAt: now,
    });

    return {
      message:
        "Thank you for registering your willingness to serve. The temple committee will reach out prior to upcoming festivals.",
    };
  }

  // --- Admin Queries (adminProcedure only) ---
  static async adminList(db: DrizzleD1Database<typeof schema>, query: ListVolunteersQuery) {
    const page = query.page || 1;
    const pageSize = Math.min(query.pageSize || 20, 100);
    const offset = (page - 1) * pageSize;

    const conditions = [];

    if (query.status) {
      conditions.push(eq(volunteers.status, query.status));
    }

    if (query.area) {
      conditions.push(eq(volunteers.area, query.area));
    }

    if (query.search) {
      conditions.push(like(volunteers.name, `%${query.search}%`));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [items, totalResult] = await Promise.all([
      db
        .select()
        .from(volunteers)
        .where(whereClause)
        .orderBy(desc(volunteers.createdAt))
        .limit(pageSize)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(volunteers)
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
      .from(volunteers)
      .where(eq(volunteers.id, id))
      .limit(1);

    return rows[0] || null;
  }

  static async adminUpdateStatus(
    db: DrizzleD1Database<typeof schema>,
    id: number,
    status: VolunteerStatus,
    adminNote?: string
  ) {
    const now = Date.now();
    const updateData: Partial<typeof volunteers.$inferInsert> = {
      status,
      updatedAt: now,
    };

    if (adminNote !== undefined) updateData.adminNote = adminNote;

    const [updated] = await db
      .update(volunteers)
      .set(updateData)
      .where(eq(volunteers.id, id))
      .returning();

    return updated;
  }

  static async adminDelete(db: DrizzleD1Database<typeof schema>, id: number) {
    const [deleted] = await db
      .delete(volunteers)
      .where(eq(volunteers.id, id))
      .returning();

    return !!deleted;
  }
}
