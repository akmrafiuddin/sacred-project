import { describe, it, expect, beforeEach } from "bun:test";
import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import * as schema from "../server/db/schema";
import { BookingsService } from "../server/services/bookings";
import { pujaBookingSubmissionSchema } from "../shared/schemas/forms";

describe("Custom Puja Backend Functionality", () => {
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

      CREATE TABLE pujas (
        id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        offered TEXT,
        price_bdt INTEGER NOT NULL,
        duration TEXT,
        bookable INTEGER NOT NULL DEFAULT 1,
        sort_order INTEGER NOT NULL DEFAULT 0,
        active INTEGER NOT NULL DEFAULT 1,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );

      CREATE TABLE puja_bookings (
        id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        ref TEXT NOT NULL UNIQUE,
        user_id TEXT REFERENCES user(id) ON DELETE SET NULL,
        puja_id INTEGER REFERENCES pujas(id) ON DELETE SET NULL,
        puja_type TEXT NOT NULL DEFAULT 'standard',
        custom_puja_name TEXT,
        custom_dakshina INTEGER,
        special_instructions TEXT,
        name TEXT NOT NULL,
        phone TEXT NOT NULL,
        email TEXT,
        gotra TEXT,
        preferred_date TEXT NOT NULL,
        note TEXT,
        status TEXT NOT NULL DEFAULT 'new',
        handled_by TEXT,
        admin_note TEXT,
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

    // Seed standard test puja
    sqlite.run(`
      INSERT INTO pujas (id, slug, name, description, price_bdt, duration, bookable, sort_order, active, created_at, updated_at)
      VALUES (1, 'nitya-puja', '{"en":"Nitya Puja","bn":""}', 'Daily worship', 501, '45 minutes', 1, 1, 1, 1000, 1000);
    `);
  });

  describe("Validation & Constraints", () => {
    it("rejects custom puja submission without a custom puja name", () => {
      const result = pujaBookingSubmissionSchema.safeParse({
        pujaType: "custom",
        name: "Devotee Anirban",
        phone: "01819123456",
        preferredDate: "2026-11-20",
        turnstileToken: "mock-token",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.customPujaName).toBeDefined();
      }
    });

    it("accepts valid custom puja submission with custom name and special instructions", () => {
      const result = pujaBookingSubmissionSchema.safeParse({
        pujaType: "custom",
        customPujaName: "Maha Mrityunjaya Havan & Sankalpa",
        specialInstructions: "108 Ahutis with Bilva leaves for family well-being",
        name: "Devotee Anirban",
        phone: "01819123456",
        email: "devotee@example.com",
        gotra: "Kashyapa",
        preferredDate: "2026-11-25",
        turnstileToken: "mock-token",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.pujaType).toBe("custom");
        expect(result.data.customPujaName).toBe("Maha Mrityunjaya Havan & Sankalpa");
      }
    });
  });

  describe("Custom Puja Lifecycle & Admin Workflow", () => {
    it("creates custom booking, verifies reference lookup, and quotes custom dakshina", async () => {
      // 1. Devotee submits custom puja request
      const createRes = await BookingsService.createBookingRequest(db, {
        pujaType: "custom",
        customPujaName: "Griha Pravesh & Vastu Shanti Havan",
        specialInstructions: "Please arrange two priests for morning auspicious muhurat",
        name: "Debashish Roy",
        phone: "01712345678",
        email: "debashish@example.com",
        gotra: "Sandilya",
        preferredDate: "2026-12-05",
        note: "Arranging family gathering at private residence",
        turnstileToken: "mock-token",
      });

      expect(createRes.success).toBe(true);
      expect(createRes.ref).toMatch(/^KM-2026-[A-Z0-9]{5}$/);

      // 2. Devotee verifies status lookup by reference code
      const lookup = await BookingsService.getByRef(db, createRes.ref);
      expect(lookup).not.toBeNull();
      expect(lookup?.pujaType).toBe("custom");
      expect(lookup?.customPujaName).toBe("Griha Pravesh & Vastu Shanti Havan");
      expect(lookup?.pujaName.en).toBe("Griha Pravesh & Vastu Shanti Havan");
      expect(lookup?.pujaPrice).toBeNull(); // No Dakshina quoted yet
      expect(lookup?.pujaDuration).toBe("Personalized");
      expect(lookup?.status).toBe("new");

      // 3. Admin lists custom pujas specifically
      const customList = await BookingsService.adminList(db, { pujaType: "custom" });
      expect(customList.total).toBe(1);
      expect(customList.items[0].pujaType).toBe("custom");
      expect(customList.items[0].customPujaName).toBe("Griha Pravesh & Vastu Shanti Havan");

      // 4. Admin reviews request, quotes Dakshina of BDT 5,001 and confirms
      const bookingId = customList.items[0].id;
      const updated = await BookingsService.adminUpdateStatus(
        db,
        bookingId,
        "confirmed",
        "Priests confirmed for 8:00 AM muhurat. Samagri list shared with devotee.",
        "Head Priest Office",
        "admin-user-1",
        5001 // customDakshina in BDT
      );

      expect(updated.status).toBe("confirmed");
      expect(updated.customDakshina).toBe(5001);

      // 5. Devotee checks status again; custom Dakshina quote is now visible
      const lookupAfterQuote = await BookingsService.getByRef(db, createRes.ref);
      expect(lookupAfterQuote?.status).toBe("confirmed");
      expect(lookupAfterQuote?.pujaPrice).toBe(5001);
      expect(lookupAfterQuote?.adminNote).toBe("Priests confirmed for 8:00 AM muhurat. Samagri list shared with devotee.");

      // 6. Verify audit log entry
      const auditRows = sqlite
        .query("SELECT * FROM audit_logs WHERE entity = 'puja_bookings'")
        .all() as any[];
      expect(auditRows.length).toBe(1);
      expect(auditRows[0].action).toBe("update_status");
      const auditDetails = JSON.parse(auditRows[0].details);
      expect(auditDetails.customDakshina).toBe(5001);
    });
  });
});
