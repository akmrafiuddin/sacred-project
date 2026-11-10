import { lte, and, or, eq, inArray } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import { contactMessages } from "../db/schema/messages";
import { pujaBookings } from "../db/schema/bookings";
import { volunteers } from "../db/schema/volunteers";
import { AuditService } from "./audit";
import type * as schema from "../db/schema";

export interface PurgeResult {
  retentionDays: number;
  cutoff: number;
  purged: {
    messages: number;
    bookings: number;
    volunteers: number;
  };
}

export class RetentionService {
  /**
   * Purges personal data records older than retentionDays (default 365 days / 12 months).
   * Automatically records an audit log entry.
   */
  static async purgeOldRecords(
    db: DrizzleD1Database<typeof schema>,
    retentionDays: number = 365,
    executedBy: string | null = null
  ): Promise<PurgeResult> {
    const cutoff = Date.now() - retentionDays * 24 * 60 * 60 * 1000;

    // 1. Purge old contact messages
    const deletedMessages = await db
      .delete(contactMessages)
      .where(lte(contactMessages.createdAt, cutoff))
      .returning({ id: contactMessages.id });

    // 2. Purge old bookings (only completed or cancelled or all past cutoff)
    const deletedBookings = await db
      .delete(pujaBookings)
      .where(
        and(
          lte(pujaBookings.createdAt, cutoff),
          inArray(pujaBookings.status, ["completed", "cancelled", "new"])
        )
      )
      .returning({ id: pujaBookings.id });

    // 3. Purge old volunteer applications
    const deletedVolunteers = await db
      .delete(volunteers)
      .where(lte(volunteers.createdAt, cutoff))
      .returning({ id: volunteers.id });

    const result: PurgeResult = {
      retentionDays,
      cutoff,
      purged: {
        messages: deletedMessages.length,
        bookings: deletedBookings.length,
        volunteers: deletedVolunteers.length,
      },
    };

    // Record audit log
    await AuditService.record(db, {
      userId: executedBy,
      action: "purge",
      entity: "retention",
      details: {
        retentionDays,
        cutoff,
        ...result.purged,
      },
    });

    return result;
  }
}
