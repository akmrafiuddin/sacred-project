import { describe, it, expect, beforeEach } from "vitest";
import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import * as schema from "../server/db/schema";
import { BookingsService } from "../server/services/bookings";
import { MessagesService } from "../server/services/messages";
import { VolunteersService } from "../server/services/volunteers";
import {
  pujaBookingSubmissionSchema,
  contactMessageSubmissionSchema,
  volunteerSubmissionSchema,
} from "../shared/schemas/forms";
import { enforceRateLimit } from "../server/utils/rate-limit";

describe("Phase 4 — Public Forms & Bookings", () => {
  let sqlite: Database;
  let db: any;

  beforeEach(() => {
    sqlite = new Database(":memory:");
    sqlite.run(`
      CREATE TABLE user (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        email_verified INTEGER NOT NULL DEFAULT 0,
        image TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        role TEXT NOT NULL DEFAULT 'user',
        phone TEXT
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

      CREATE TABLE pujas (
        id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        offered TEXT,
        price_bdt INTEGER NOT NULL DEFAULT 0,
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

      CREATE TABLE contact_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        name TEXT NOT NULL,
        phone TEXT,
        email TEXT,
        subject TEXT NOT NULL,
        message TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'new',
        admin_note TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );

      CREATE TABLE volunteers (
        id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        name TEXT NOT NULL,
        phone TEXT NOT NULL,
        area TEXT NOT NULL,
        note TEXT,
        status TEXT NOT NULL DEFAULT 'new',
        admin_note TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );
    `);
    db = drizzle(sqlite, { schema });
  });

  describe("Validation & Honeypot", () => {
    it("accepts valid Bangladesh phone numbers and rejects invalid ones", () => {
      const validForm = pujaBookingSubmissionSchema.safeParse({
        name: "Animesh Das",
        phone: "01819123456",
        preferredDate: "2026-11-20",
        turnstileToken: "dummy-token",
      });
      expect(validForm.success).toBe(true);

      const invalidPhone = pujaBookingSubmissionSchema.safeParse({
        name: "Animesh Das",
        phone: "12345",
        preferredDate: "2026-11-20",
        turnstileToken: "dummy-token",
      });
      expect(invalidPhone.success).toBe(false);
    });

    it("rejects honeypot bots", () => {
      const botSubmission = pujaBookingSubmissionSchema.safeParse({
        name: "Bot User",
        phone: "01819123456",
        preferredDate: "2026-11-20",
        honeypot: "I am a spam bot filling hidden fields",
        turnstileToken: "dummy-token",
      });
      expect(botSubmission.success).toBe(false);
    });

    it("requires turnstile token", () => {
      const missingToken = contactMessageSubmissionSchema.safeParse({
        name: "Devotee",
        subject: "Darshan query",
        message: "When does evening aarti start?",
        turnstileToken: "",
      });
      expect(missingToken.success).toBe(false);
    });
  });

  describe("Puja Booking Request Flow", () => {
    it("generates a non-guessable reference code and preserves user isolation", async () => {
      const res = await BookingsService.createBookingRequest(
        db,
        {
          name: "Rafi Uddin",
          phone: "01711000000",
          preferredDate: "2026-11-25",
          gotra: "Kashyapa",
          turnstileToken: "dummy",
        },
        "devotee_user_1"
      );

      expect(res.ref).toMatch(/^KM-2026-[A-Z0-9]{5}$/);
      expect(res.message).toBeDefined();

      // Devotee 1 can see their own booking
      const devotee1Bookings = await BookingsService.getUserBookings(db, "devotee_user_1");
      expect(devotee1Bookings.length).toBe(1);
      expect(devotee1Bookings[0].ref).toBe(res.ref);

      // Devotee 2 cannot see Devotee 1's booking
      const devotee2Bookings = await BookingsService.getUserBookings(db, "devotee_user_2");
      expect(devotee2Bookings.length).toBe(0);
    });

    it("allows devotee to cancel their own booking only while status is 'new'", async () => {
      const { ref } = await BookingsService.createBookingRequest(
        db,
        {
          name: "Devotee User",
          phone: "01819000000",
          preferredDate: "2026-11-25",
          turnstileToken: "dummy",
        },
        "devotee_user_1"
      );

      // Devotee 2 cannot cancel Devotee 1's booking
      await expect(
        BookingsService.cancelUserBooking(db, ref, "devotee_user_2")
      ).rejects.toThrow("not found");

      // Devotee 1 can cancel while status is 'new'
      const cancelRes = await BookingsService.cancelUserBooking(db, ref, "devotee_user_1");
      expect(cancelRes.success).toBe(true);

      // Once cancelled, further cancellation fails
      await expect(
        BookingsService.cancelUserBooking(db, ref, "devotee_user_1")
      ).rejects.toThrow("Only 'new' requests can be cancelled");
    });

    it("allows admin to process a booking from 'new' to 'confirmed'", async () => {
      const { ref } = await BookingsService.createBookingRequest(db, {
        name: "Devotee",
        phone: "01819000000",
        preferredDate: "2026-11-25",
        turnstileToken: "dummy",
      });

      const list = await BookingsService.adminList(db, { page: 1, pageSize: 10 });
      expect(list.total).toBe(1);
      const booking = list.items[0];
      expect(booking.status).toBe("new");

      const updated = await BookingsService.adminUpdateStatus(
        db,
        booking.id,
        "confirmed",
        "Devotee contacted via phone and timing locked",
        "Temple Administrator"
      );

      expect(updated?.status).toBe("confirmed");
      expect(updated?.handledBy).toBe("Temple Administrator");
    });
  });

  describe("Contact Messages & Volunteers", () => {
    it("creates contact messages and handles admin read updates", async () => {
      const res = await MessagesService.createMessage(db, {
        name: "Sunil Sen",
        email: "sunil@gmail.com",
        subject: "Temple Annadanam inquiry",
        message: "Can we sponsor the noon prasad on our parents anniversary?",
        turnstileToken: "dummy",
      });

      expect(res.id).toBeDefined();
      expect(typeof res.id).toBe("number");
      expect(res.message).toBe("Thank you for contacting the temple. Your message has been received.");

      const list = await MessagesService.adminList(db, { page: 1, pageSize: 10 });
      expect(list.total).toBe(1);
      expect(list.items[0].subject).toBe("Temple Annadanam inquiry");

      const updated = await MessagesService.adminUpdateStatus(db, list.items[0].id, "read");
      expect(updated?.status).toBe("read");
    });

    it("creates volunteer registrations", async () => {
      await VolunteersService.createVolunteer(db, {
        name: "Bikash Roy",
        phone: "01819222222",
        area: "annadanam",
        note: "Available on weekends",
        turnstileToken: "dummy",
      });

      const list = await VolunteersService.adminList(db, { page: 1, pageSize: 10 });
      expect(list.total).toBe(1);
      expect(list.items[0].area).toBe("annadanam");
    });
  });

  describe("Rate Limiting", () => {
    it("throws 429 when max requests exceeded in time window", () => {
      process.env.TEST_RATE_LIMIT = "true";
      const mockEvent = {
        clientIp: "192.168.1.100",
      } as any;

      const opts = { key: "test:limit", maxRequests: 2, windowSeconds: 60 };

      // 1st request -> ok
      expect(() => enforceRateLimit(mockEvent, opts)).not.toThrow();
      // 2nd request -> ok
      expect(() => enforceRateLimit(mockEvent, opts)).not.toThrow();
      // 3rd request -> exceeds maxRequests=2 -> 429 error!
      expect(() => enforceRateLimit(mockEvent, opts)).toThrow();

      delete process.env.TEST_RATE_LIMIT;
    });
  });
});
