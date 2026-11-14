import { describe, it, expect, beforeEach } from "vitest";
import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { eq } from "drizzle-orm";
import {
  siteSettingsSchema,
  defaultSiteSettingsData,
  THEME_PALETTES,
  FONT_OPTIONS_HEADING,
  FONT_OPTIONS_BODY,
  type SiteSettingsData,
} from "../shared/schemas/siteSettings";
import { homeCms } from "../server/db/schema/content";

describe("General Site Settings CMS & Backend Functionality", () => {
  describe("Validation & Default Data", () => {
    it("validates defaultSiteSettingsData structure and required fields", () => {
      const parsed = siteSettingsSchema.safeParse(defaultSiteSettingsData);
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.brand.siteTitle).toBe("Golpahar Mohashoshan Kali Mandir");
        expect(parsed.data.typography.headingFont).toBe("Cinzel");
        expect(parsed.data.typography.bodyFont).toBe("Plus Jakarta Sans");
        expect(parsed.data.theme.primaryColor).toBe("#6E0516");
        expect(parsed.data.theme.secondaryColor).toBe("#E0A526");
        expect(parsed.data.brand.faviconUrl).toBe("/favicon.ico");
      }
    });

    it("accepts valid custom fonts, color palettes, and social media URLs", () => {
      const customInput: SiteSettingsData = {
        brand: {
          siteTitle: "Sanctified Kali Mandir Chittagong",
          siteTagline: "Eternal Devotion and Heritage",
          faviconUrl: "/custom-favicon.png",
          logoUrl: "/custom-logo.svg",
          footerCopyright: "© 2026 Sacred Mandir. All rights reserved.",
        },
        typography: {
          headingFont: "Playfair Display",
          bodyFont: "Inter",
          baseFontSize: "17px",
        },
        theme: {
          colorPalette: "kesari_saffron",
          primaryColor: "#C2410C",
          secondaryColor: "#F59E0B",
          accentColor: "#EA580C",
          backgroundColor: "#FFFBEB",
          defaultThemeMode: "light",
        },
        social: {
          facebookUrl: "https://facebook.com/custommandir",
          youtubeUrl: "https://youtube.com/@custommandir",
          instagramUrl: "https://instagram.com/custommandir",
          whatsappNumber: "+8801819123456",
          twitterUrl: "https://x.com/custommandir",
        },
        contact: {
          email: "support@custommandir.org",
          phone: "+880 1819-000000",
          address: "Mehedibag, Chittagong",
          googleMapsUrl: "https://maps.google.com/?q=custom",
        },
        announcement: {
          enabled: true,
          message: "Mahashivratri special aarti schedule updated.",
          link: "/festivals-and-events",
        },
      };

      const parsed = siteSettingsSchema.safeParse(customInput);
      expect(parsed.success).toBe(true);
    });

    it("rejects invalid hex colors", () => {
      const invalidData = {
        ...defaultSiteSettingsData,
        theme: {
          ...defaultSiteSettingsData.theme,
          primaryColor: "not-a-color",
        },
      };

      const parsed = siteSettingsSchema.safeParse(invalidData);
      expect(parsed.success).toBe(false);
    });

    it("verifies preset theme palettes definitions", () => {
      expect(THEME_PALETTES.length).toBeGreaterThanOrEqual(4);
      const sindoor = THEME_PALETTES.find((p) => p.id === "sindoor_gold");
      expect(sindoor).toBeDefined();
      expect(sindoor?.primary).toBe("#6E0516");
      expect(sindoor?.secondary).toBe("#E0A526");
    });

    it("verifies font options for heading and body", () => {
      expect(FONT_OPTIONS_HEADING).toContain("Cinzel");
      expect(FONT_OPTIONS_HEADING).toContain("Playfair Display");
      expect(FONT_OPTIONS_BODY).toContain("Plus Jakarta Sans");
      expect(FONT_OPTIONS_BODY).toContain("Inter");
    });
  });

  describe("Database Persistence & Reset", () => {
    let sqlite: Database;
    let db: ReturnType<typeof drizzle>;

    beforeEach(() => {
      sqlite = new Database(":memory:");
      sqlite.run(`
        CREATE TABLE home_cms (
          key TEXT PRIMARY KEY,
          data TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );
      `);
      db = drizzle(sqlite, { schema: { homeCms } });
    });

    it("stores and retrieves customized site settings data", async () => {
      const customSettings: SiteSettingsData = {
        ...defaultSiteSettingsData,
        brand: {
          ...defaultSiteSettingsData.brand,
          siteTitle: "Updated Temple Title",
          faviconUrl: "/icons/custom-kali.ico",
        },
        theme: {
          ...defaultSiteSettingsData.theme,
          colorPalette: "kesari_saffron",
          primaryColor: "#C2410C",
        },
        social: {
          ...defaultSiteSettingsData.social,
          facebookUrl: "https://facebook.com/updated",
        },
      };

      const now = new Date().toISOString();
      await db.insert(homeCms).values({
        key: "site_settings",
        data: JSON.stringify(customSettings),
        updatedAt: now,
      });

      const records = await db
        .select()
        .from(homeCms)
        .where(eq(homeCms.key, "site_settings"))
        .limit(1);

      expect(records.length).toBe(1);
      const parsed = JSON.parse(records[0].data) as SiteSettingsData;
      expect(parsed.brand.siteTitle).toBe("Updated Temple Title");
      expect(parsed.brand.faviconUrl).toBe("/icons/custom-kali.ico");
      expect(parsed.theme.primaryColor).toBe("#C2410C");
      expect(parsed.social.facebookUrl).toBe("https://facebook.com/updated");
    });

    it("resets customized site settings back to temple defaults", async () => {
      // 1. Insert custom data
      await db.insert(homeCms).values({
        key: "site_settings",
        data: JSON.stringify({
          ...defaultSiteSettingsData,
          brand: { ...defaultSiteSettingsData.brand, siteTitle: "Temporary Title" },
        }),
        updatedAt: new Date().toISOString(),
      });

      // 2. Perform reset
      await db
        .insert(homeCms)
        .values({
          key: "site_settings",
          data: JSON.stringify(defaultSiteSettingsData),
          updatedAt: new Date().toISOString(),
        })
        .onConflictDoUpdate({
          target: homeCms.key,
          set: {
            data: JSON.stringify(defaultSiteSettingsData),
            updatedAt: new Date().toISOString(),
          },
        });

      const records = await db
        .select()
        .from(homeCms)
        .where(eq(homeCms.key, "site_settings"))
        .limit(1);

      const parsed = JSON.parse(records[0].data) as SiteSettingsData;
      expect(parsed.brand.siteTitle).toBe("Golpahar Mohashoshan Kali Mandir");
    });
  });
});
