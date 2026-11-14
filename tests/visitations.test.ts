import { describe, it, expect, beforeEach } from "bun:test";
import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import * as schema from "../server/db/schema";
import { VisitationsService } from "../server/services/visitations";
import {
  createVisitationSchema,
  listVisitationsQuerySchema,
  updateVisitationStatusSchema,
} from "../shared/schemas/visitations";

describe("Devotee Visitations & Pilgrim Darshan Passes", () => {
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

      CREATE TABLE visitations (
        id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        ref TEXT NOT NULL UNIQUE,
        user_id TEXT REFERENCES user(id) ON DELETE SET NULL,
        name TEXT NOT NULL,
        phone TEXT NOT NULL,
        email TEXT,
        visit_date TEXT NOT NULL,
        time_slot TEXT NOT NULL DEFAULT 'morning',
        visitor_count INTEGER NOT NULL DEFAULT 1,
        purpose TEXT NOT NULL DEFAULT 'general_darshan',
        special_needs TEXT,
        status TEXT NOT NULL DEFAULT 'confirmed',
        check_in_at INTEGER,
        handled_by TEXT,
        admin_notes TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );

      CREATE TABLE audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        user_id TEXT,
        action TEXT NOT NULL,
        entity TEXT NOT NULL,
        entity_id TEXT,
        details TEXT,
        at INTEGER NOT NULL
      );
    `);
    db = drizzle(sqlite, { schema });
  });

  describe("Validation Schemas", () => {
    it("validates valid visitation submission input", () => {
      const valid = createVisitationSchema.safeParse({
        name: "Shyamal Kanti Das",
        phone: "01819123456",
        email: "shyamal@example.com",
        visitDate: "2026-11-20",
        timeSlot: "evening",
        visitorCount: 4,
        purpose: "special_darshan",
        specialNeeds: "Wheelchair assistance for elderly mother",
        turnstileToken: "mock-token",
      });
      expect(valid.success).toBe(true);
    });

    it("rejects invalid visitor counts and invalid phone numbers", () => {
      const invalidCount = createVisitationSchema.safeParse({
        name: "Shyamal",
        phone: "01819123456",
        visitDate: "2026-11-20",
        visitorCount: 0, // Must be at least 1
        turnstileToken: "mock-token",
      });
      expect(invalidCount.success).toBe(false);

      const invalidPhone = createVisitationSchema.safeParse({
        name: "Shyamal",
        phone: "12345", // Invalid format
        visitDate: "2026-11-20",
        visitorCount: 2,
        turnstileToken: "mock-token",
      });
      expect(invalidPhone.success).toBe(false);
    });
  });

  describe("Visitor Pass Generation & Lifecycle", () => {
    it("creates visitor pass, verifies lookup by reference, and checks slot stats", async () => {
      // 1. Devotee generates visitor pass
      const result = await VisitationsService.createVisitation(db, {
        name: "Pranab Mukherjee",
        phone: "01712345678",
        email: "pranab@example.com",
        visitDate: "2026-11-25",
        timeSlot: "morning",
        visitorCount: 3,
        purpose: "general_darshan",
        specialNeeds: null,
        honeypot: "",
        turnstileToken: "mock-token",
      });

      expect(result.success).toBe(true);
      expect(result.ref).toMatch(/^VST-2026-[A-Z0-9]{5}$/);
      expect(result.visitorCount).toBe(3);

      // 2. Devotee / Gate staff verifies pass by reference code
      const pass = await VisitationsService.getByRef(db, result.ref);
      expect(pass).not.toBeNull();
      expect(pass?.name).toBe("Pranab Mukherjee");
      expect(pass?.visitorCount).toBe(3);
      expect(pass?.timeSlot).toBe("morning");
      expect(pass?.status).toBe("confirmed");
      expect(pass?.timeSlotDescription).toContain("Morning Darshan");

      // 3. Stats for that date
      const stats = await VisitationsService.getStats(db, "2026-11-25");
      expect(stats.totalBookings).toBe(1);
      expect(stats.totalVisitors).toBe(3);
      expect(stats.bySlot.morning).toBe(3);
      expect(stats.checkedInVisitors).toBe(0);
    });

    it("supports devotee check-in at temple entrance", async () => {
      const created = await VisitationsService.createVisitation(db, {
        name: "Sudhir Roy",
        phone: "01912345678",
        visitDate: "2026-11-20",
        timeSlot: "evening",
        visitorCount: 2,
        purpose: "annadanam",
        turnstileToken: "mock-token",
      });

      const pass = await VisitationsService.getByRef(db, created.ref);
      expect(pass).not.toBeNull();

      // Gate staff performs check-in
      const checkInResult = await VisitationsService.adminCheckIn(
        db,
        pass!.id,
        "Arrived at east gate, admitted to dining hall",
        "Staff Ramesh",
        "staff-user-1"
      );

      expect(checkInResult.status).toBe("checked_in");
      expect(checkInResult.checkInAt).toBeDefined();

      // Check stats reflect checked in visitor
      const stats = await VisitationsService.getStats(db, "2026-11-20");
      expect(stats.checkedInVisitors).toBe(2);

      // Verify audit log
      const auditRows = sqlite
        .query("SELECT * FROM audit_logs WHERE entity = 'visitations' AND action = 'check_in'")
        .all() as any[];
      expect(auditRows.length).toBe(1);
    });

    it("allows devotee to view their passes and cancel upcoming visit", async () => {
      const userId = "devotee-123";

      const created = await VisitationsService.createVisitation(
        db,
        {
          name: "Devotee User",
          phone: "01811223344",
          visitDate: "2026-11-30",
          timeSlot: "special_aarti",
          visitorCount: 2,
          purpose: "special_darshan",
          turnstileToken: "mock-token",
        },
        userId
      );

      // List user's passes
      const userPasses = await VisitationsService.listUserVisitations(db, userId);
      expect(userPasses.length).toBe(1);
      expect(userPasses[0].ref).toBe(created.ref);

      // Cancel pass
      const cancelRes = await VisitationsService.cancelUserVisitation(db, created.ref, userId);
      expect(cancelRes.success).toBe(true);

      // Verify status changed
      const pass = await VisitationsService.getByRef(db, created.ref);
      expect(pass?.status).toBe("cancelled");
    });
  });
});
