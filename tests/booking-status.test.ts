import { describe, it, expect, beforeEach } from "bun:test";
import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import * as schema from "../server/db/schema";
import { BookingsService } from "../server/services/bookings";

describe("Puja Booking Submission & Status Lookup", () => {
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

    // Insert a test puja
    sqlite.run(`
      INSERT INTO pujas (id, slug, name, description, offered, price_bdt, duration, bookable, sort_order, active, created_at, updated_at)
      VALUES (1, 'nitya-puja', '{"en":"Nitya Puja","bn":""}', '{"en":"Daily worship","bn":""}', '{"en":"Flowers","bn":""}', 501, '45 minutes', 1, 1, 1, 1000, 1000);
    `);
  });

  it("creates a guest puja booking and looks it up by reference code", async () => {
    const res = await BookingsService.createBookingRequest(db, {
      pujaId: 1,
      name: "Subir Roy",
      phone: "01712345678",
      email: "subir@example.com",
      gotra: "Kashyapa",
      preferredDate: "2026-11-20",
      note: "Family welfare and peace",
      turnstileToken: "dummy-token",
    });

    expect(res.success).toBe(true);
    expect(res.ref).toBeDefined();
    expect(res.ref.startsWith("KM-2026-")).toBe(true);

    // Look up by reference code (exact match)
    const booking = await BookingsService.getByRef(db, res.ref);
    expect(booking).not.toBeNull();
    expect(booking?.ref).toBe(res.ref);
    expect(booking?.name).toBe("Subir Roy");
    expect(booking?.gotra).toBe("Kashyapa");
    expect(booking?.status).toBe("new");
    expect(booking?.pujaPrice).toBe(501);

    // Look up by lowercase reference code (case insensitivity)
    const bookingLower = await BookingsService.getByRef(db, res.ref.toLowerCase());
    expect(bookingLower).not.toBeNull();
    expect(bookingLower?.ref).toBe(res.ref);
  });

  it("returns null for non-existent reference codes", async () => {
    const notFound = await BookingsService.getByRef(db, "KM-2026-NONEXIST");
    expect(notFound).toBeNull();
  });

  it("reflects status updates performed by admin", async () => {
    const { ref } = await BookingsService.createBookingRequest(db, {
      pujaId: 1,
      name: "Priya Sharma",
      phone: "01819111222",
      preferredDate: "2026-11-22",
      turnstileToken: "dummy-token",
    });

    const initial = await BookingsService.getByRef(db, ref);
    expect(initial?.status).toBe("new");

    // Admin confirms booking
    const list = await BookingsService.adminList(db, { page: 1, pageSize: 1 });
    const bookingId = list.items[0]?.id;
    expect(bookingId).toBeDefined();

    await BookingsService.adminUpdateStatus(
      db,
      bookingId,
      "confirmed",
      "Confirmed for 10:00 AM darshan",
      "Admin Priest"
    );

    const updated = await BookingsService.getByRef(db, ref);
    expect(updated?.status).toBe("confirmed");
    expect(updated?.adminNote).toBe("Confirmed for 10:00 AM darshan");
  });
});
