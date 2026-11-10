import { describe, it, expect, beforeEach } from "vitest";
import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import * as schema from "../server/db/schema";
import { AuditService } from "../server/services/audit";
import { RetentionService } from "../server/services/retention";
import { purgeCache } from "../server/utils/cache";
import { auditLogQuerySchema } from "../shared/schemas/audit";

describe("Phase 6 — Operations, Audit Logging & Retention", () => {
  let sqlite: Database;
  let db: any;

  beforeEach(() => {
    sqlite = new Database(":memory:");
    sqlite.run(`
      CREATE TABLE user (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        email_verified INTEGER NOT NULL DEFAULT 0,
        image TEXT,
        role TEXT NOT NULL DEFAULT 'user',
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );

      CREATE TABLE audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        user_id TEXT REFERENCES user(id) ON DELETE SET NULL,
        action TEXT NOT NULL,
        entity TEXT NOT NULL,
        entity_id TEXT,
        details TEXT,
        at INTEGER NOT NULL
      );

      CREATE TABLE contact_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        name TEXT NOT NULL,
        phone TEXT,
        email TEXT,
        subject TEXT NOT NULL,
        message TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'new',
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );

      CREATE TABLE puja_bookings (
        id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        ref TEXT NOT NULL UNIQUE,
        user_id TEXT REFERENCES user(id) ON DELETE SET NULL,
        puja_id INTEGER,
        name TEXT NOT NULL,
        phone TEXT NOT NULL,
        email TEXT,
        gotra TEXT,
        preferred_date TEXT NOT NULL,
        note TEXT,
        status TEXT NOT NULL DEFAULT 'new',
        handled_by TEXT REFERENCES user(id) ON DELETE SET NULL,
        internal_notes TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );

      CREATE TABLE volunteers (
        id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        name TEXT NOT NULL,
        phone TEXT NOT NULL,
        area TEXT NOT NULL,
        note TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );
    `);
    db = drizzle(sqlite, { schema });
  });

  describe("Audit Service", () => {
    it("validates audit query schema", () => {
      const valid = auditLogQuerySchema.safeParse({
        page: 1,
        pageSize: 50,
        action: "create",
        entity: "deity",
        startDate: "2026-11-01",
      });
      expect(valid.success).toBe(true);

      const invalidDate = auditLogQuerySchema.safeParse({
        startDate: "invalid-date-format",
      });
      expect(invalidDate.success).toBe(false);
    });

    it("records and queries audit logs", async () => {
      // Insert user
      sqlite.run(`
        INSERT INTO user (id, name, email, role, created_at, updated_at)
        VALUES ('admin-01', 'Super Admin', 'admin@mandir.org', 'admin', 1000, 1000);
      `);

      const entry = await AuditService.record(db, {
        userId: "admin-01",
        action: "create",
        entity: "events",
        entityId: "kali-puja-2026",
        details: { title: "Grand Kali Puja" },
      });

      expect(entry).toBeDefined();
      expect(entry.action).toBe("create");
      expect(entry.entity).toBe("events");

      const list = await AuditService.list(db, {
        page: 1,
        pageSize: 10,
        action: "create",
      });

      expect(list.total).toBe(1);
      expect(list.items[0]?.entityId).toBe("kali-puja-2026");
      expect(list.items[0]?.userName).toBe("Super Admin");
      expect(list.items[0]?.details?.title).toBe("Grand Kali Puja");
    });
  });

  describe("Data Retention & Purge", () => {
    it("purges personal data records older than retention cutoff and preserves newer records", async () => {
      const now = Date.now();
      const twoYearsAgo = now - 2 * 365 * 24 * 60 * 60 * 1000;
      const oneMonthAgo = now - 30 * 24 * 60 * 60 * 1000;

      // Old records (2 years old)
      sqlite.run(`
        INSERT INTO contact_messages (name, subject, message, created_at, updated_at)
        VALUES ('Old User', 'Query', 'Old message', ${twoYearsAgo}, ${twoYearsAgo});

        INSERT INTO puja_bookings (ref, name, phone, preferred_date, status, created_at, updated_at)
        VALUES ('KM-OLD-001', 'Old Devotee', '+8801712345678', '2024-11-01', 'completed', ${twoYearsAgo}, ${twoYearsAgo});

        INSERT INTO volunteers (name, phone, area, created_at, updated_at)
        VALUES ('Old Volunteer', '+8801712345678', 'crowd', ${twoYearsAgo}, ${twoYearsAgo});
      `);

      // Fresh records (1 month old)
      sqlite.run(`
        INSERT INTO contact_messages (name, subject, message, created_at, updated_at)
        VALUES ('New User', 'Help', 'Recent message', ${oneMonthAgo}, ${oneMonthAgo});

        INSERT INTO puja_bookings (ref, name, phone, preferred_date, status, created_at, updated_at)
        VALUES ('KM-NEW-001', 'New Devotee', '+8801712345678', '2026-12-01', 'new', ${oneMonthAgo}, ${oneMonthAgo});

        INSERT INTO volunteers (name, phone, area, created_at, updated_at)
        VALUES ('New Volunteer', '+8801712345678', 'annadanam', ${oneMonthAgo}, ${oneMonthAgo});
      `);

      // Execute retention purge with 365 days threshold
      const purgeResult = await RetentionService.purgeOldRecords(db, 365, "admin-system");

      expect(purgeResult.purged.messages).toBe(1);
      expect(purgeResult.purged.bookings).toBe(1);
      expect(purgeResult.purged.volunteers).toBe(1);

      // Verify remaining records
      const remainingMessages = sqlite.query("SELECT * FROM contact_messages").all() as any[];
      expect(remainingMessages.length).toBe(1);
      expect(remainingMessages[0]?.name).toBe("New User");

      const remainingBookings = sqlite.query("SELECT * FROM puja_bookings").all() as any[];
      expect(remainingBookings.length).toBe(1);
      expect(remainingBookings[0]?.ref).toBe("KM-NEW-001");

      const remainingVolunteers = sqlite.query("SELECT * FROM volunteers").all() as any[];
      expect(remainingVolunteers.length).toBe(1);
      expect(remainingVolunteers[0]?.name).toBe("New Volunteer");

      // Verify audit log entry was created for the purge
      const auditLog = sqlite.query("SELECT * FROM audit_logs WHERE action = 'purge'").all() as any[];
      expect(auditLog.length).toBe(1);
      expect(auditLog[0]?.entity).toBe("retention");
    });
  });

  describe("Cache purge helper", () => {
    it("handles cache purge calls gracefully", async () => {
      const res = await purgeCache(["events", "site"]);
      expect(res).toBeDefined();
      expect(Array.isArray(res.purged)).toBe(true);
      expect(typeof res.count).toBe("number");
    });
  });
});
