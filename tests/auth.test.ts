import { describe, it, expect } from "vitest";
import { Database } from "bun:sqlite";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { createAuthMiddleware, APIError } from "better-auth/api";
import { assertCanModifyAdmin } from "../scripts/seed-admin";
import { requireRole } from "../server/utils/session";
import * as schema from "../server/db/schema/auth";
import { localized, slug, isoDate, hhmm } from "../shared/schemas/common";

describe("Phase 2 — Authentication & Authorization", () => {
  describe("Role & Permission Matrix", () => {
    it("should allow admin on admin-required actions", async () => {
      const mockEvent = {
        context: {
          _session: {
            user: { id: "u1", name: "Admin", email: "admin@temple.org", role: "admin" },
            session: { id: "s1", userId: "u1" },
          },
        },
      } as any;

      const res = await requireRole(mockEvent, ["admin"]);
      expect(res.user.role).toBe("admin");
    });

    it("should allow editor on staff actions, but throw 403 on admin-only actions", async () => {
      const mockEvent = {
        context: {
          _session: {
            user: { id: "u2", name: "Editor", email: "editor@temple.org", role: "editor" },
            session: { id: "s2", userId: "u2" },
          },
        },
      } as any;

      // Staff action (admin or editor)
      const res = await requireRole(mockEvent, ["admin", "editor"]);
      expect(res.user.role).toBe("editor");

      // Admin-only action -> 403 Forbidden
      await expect(requireRole(mockEvent, ["admin"])).rejects.toThrow();
    });

    it("should throw 403 for user role on admin or editor actions", async () => {
      const mockEvent = {
        context: {
          _session: {
            user: { id: "u3", name: "Devotee", email: "devotee@temple.org", role: "user" },
            session: { id: "s3", userId: "u3" },
          },
        },
      } as any;

      await expect(requireRole(mockEvent, ["admin", "editor"])).rejects.toThrow();
      await expect(requireRole(mockEvent, ["admin"])).rejects.toThrow();
    });

    it("should throw 401 when unauthenticated", async () => {
      const mockEvent = {
        context: {
          _session: null,
        },
      } as any;

      await expect(requireRole(mockEvent, ["admin", "editor"])).rejects.toThrow();
    });
  });

  describe("Security: Server-Controlled Role & Signup Gate", () => {
    const sqlite = new Database(":memory:");
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
      CREATE TABLE session (
        id TEXT PRIMARY KEY,
        expires_at INTEGER NOT NULL,
        token TEXT NOT NULL UNIQUE,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        ip_address TEXT,
        user_agent TEXT,
        user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE
      );
      CREATE TABLE account (
        id TEXT PRIMARY KEY,
        account_id TEXT NOT NULL,
        provider_id TEXT NOT NULL,
        user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
        access_token TEXT,
        refresh_token TEXT,
        id_token TEXT,
        access_token_expires_at INTEGER,
        refresh_token_expires_at INTEGER,
        scope TEXT,
        password TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );
      CREATE TABLE verification (
        id TEXT PRIMARY KEY,
        identifier TEXT NOT NULL,
        value TEXT NOT NULL,
        expires_at INTEGER NOT NULL,
        created_at INTEGER,
        updated_at INTEGER
      );
    `);

    const db = drizzle(sqlite, { schema });

    it("should block sign-up when ALLOW_PUBLIC_SIGNUP is false", async () => {
      const auth = betterAuth({
        database: drizzleAdapter(db, { provider: "sqlite", schema }),
        user: {
          additionalFields: {
            role: { type: "string", defaultValue: "user", input: false, returned: true },
          },
        },
        emailAndPassword: { enabled: true },
        hooks: {
          before: createAuthMiddleware(async (ctx) => {
            if (ctx.path === "/sign-up/email") {
              const allow = process.env.ALLOW_PUBLIC_SIGNUP === "true";
              if (!allow) {
                throw new APIError("FORBIDDEN", { message: "Public sign-up is currently disabled." });
              }
            }
          }),
        },
      });

      await expect(
        auth.api.signUpEmail({
          body: {
            name: "Hacker Devotee",
            email: "hacker@temple.org",
            password: "password123",
          },
        })
      ).rejects.toThrow("Public sign-up is currently disabled");
    });

    it("should never accept client-provided role: 'admin' and always assign 'user'", async () => {
      const auth = betterAuth({
        database: drizzleAdapter(db, { provider: "sqlite", schema }),
        user: {
          additionalFields: {
            role: { type: "string", defaultValue: "user", input: false, returned: true },
          },
        },
        emailAndPassword: { enabled: true },
      });

      const res = await auth.api.signUpEmail({
        body: {
          name: "Test Devotee",
          email: "devotee@temple.org",
          password: "password123",
          role: "admin", // Malicious privilege escalation attempt
        },
      });

      expect(res).toBeDefined();
      expect(res.user.role).toBe("user");
    });
  });

  describe("Admin Safeguard", () => {
    it("should prevent demoting or deleting the last remaining admin", () => {
      const sqlite = new Database(":memory:");
      sqlite.run(`
        CREATE TABLE user (
          id TEXT PRIMARY KEY,
          email TEXT NOT NULL,
          role TEXT NOT NULL
        );
        INSERT INTO user (id, email, role) VALUES ('admin_1', 'admin@temple.org', 'admin');
        INSERT INTO user (id, email, role) VALUES ('editor_1', 'editor@temple.org', 'editor');
      `);

      // Attempting to demote the only admin must throw
      expect(() => {
        assertCanModifyAdmin(sqlite, "admin_1", "editor");
      }).toThrow("Cannot demote the last remaining admin account.");

      // Adding another admin should then allow demoting the first
      sqlite.run("INSERT INTO user (id, email, role) VALUES ('admin_2', 'admin2@temple.org', 'admin');");
      expect(() => {
        assertCanModifyAdmin(sqlite, "admin_1", "editor");
      }).not.toThrow();
    });
  });

  describe("Common Validation Schemas", () => {
    it("validates localized text", () => {
      expect(localized.parse({ en: "Kali Mandir", bn: "" })).toEqual({
        en: "Kali Mandir",
        bn: "",
      });
      // Fallback when bn is omitted
      expect(localized.parse({ en: "Kali Mandir" })).toEqual({
        en: "Kali Mandir",
        bn: "",
      });
      expect(() => localized.parse({ en: "" })).toThrow();
    });

    it("validates slug", () => {
      expect(slug.parse("kali-puja-2026")).toBe("kali-puja-2026");
      expect(() => slug.parse("Invalid Slug With Spaces")).toThrow();
      expect(() => slug.parse("UPPERCASE_SLUG")).toThrow();
    });

    it("validates isoDate and hhmm", () => {
      expect(isoDate.parse("2026-11-10")).toBe("2026-11-10");
      expect(() => isoDate.parse("10/11/2026")).toThrow();

      expect(hhmm.parse("06:30")).toBe("06:30");
      expect(hhmm.parse("23:59")).toBe("23:59");
      expect(() => hhmm.parse("25:00")).toThrow();
    });
  });
});
