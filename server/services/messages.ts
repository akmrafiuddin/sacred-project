import { and, desc, eq, like, sql } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import * as schema from "../db/schema";
import { contactMessages } from "../db/schema/messages";
import type {
  ContactMessageSubmission,
  ListMessagesQuery,
  MessageStatus,
} from "../../shared/schemas/forms";

export class MessagesService {
  static async createMessage(
    db: DrizzleD1Database<typeof schema>,
    input: ContactMessageSubmission
  ) {
    const now = Date.now();
    const [inserted] = await db
      .insert(contactMessages)
      .values({
        name: input.name,
        phone: input.phone || null,
        email: input.email || null,
        subject: input.subject,
        message: input.message,
        status: "new",
        createdAt: now,
        updatedAt: now,
      })
      .returning({ id: contactMessages.id });

    return {
      id: inserted?.id,
      message: "Thank you for contacting the temple. Your message has been received.",
    };
  }

  // --- Admin Queries (adminProcedure only) ---
  static async adminList(db: DrizzleD1Database<typeof schema>, query?: Partial<ListMessagesQuery>) {
    const page = query?.page || 1;
    const pageSize = Math.min(query?.pageSize || 20, 100);
    const offset = (page - 1) * pageSize;

    const conditions = [];

    if (query?.status) {
      conditions.push(eq(contactMessages.status, query.status));
    }

    if (query?.search) {
      conditions.push(like(contactMessages.name, `%${query.search}%`));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [items, totalResult] = await Promise.all([
      db
        .select()
        .from(contactMessages)
        .where(whereClause)
        .orderBy(desc(contactMessages.createdAt))
        .limit(pageSize)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(contactMessages)
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
      .from(contactMessages)
      .where(eq(contactMessages.id, id))
      .limit(1);

    return rows[0] || null;
  }

  static async adminUpdateStatus(
    db: DrizzleD1Database<typeof schema>,
    id: number,
    status: MessageStatus,
    adminNote?: string
  ) {
    const now = Date.now();
    const updateData: Partial<typeof contactMessages.$inferInsert> = {
      status,
      updatedAt: now,
    };

    if (adminNote !== undefined) updateData.adminNote = adminNote;

    const [updated] = await db
      .update(contactMessages)
      .set(updateData)
      .where(eq(contactMessages.id, id))
      .returning();

    return updated;
  }

  static async adminDelete(db: DrizzleD1Database<typeof schema>, id: number) {
    const [deleted] = await db
      .delete(contactMessages)
      .where(eq(contactMessages.id, id))
      .returning();

    return !!deleted;
  }
}
