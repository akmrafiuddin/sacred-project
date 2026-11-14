import { drizzle } from "drizzle-orm/d1";
import { eq } from "drizzle-orm";
import * as schema from "../../db/schema";
import { defaultSiteSettingsData, type SiteSettingsData } from "../../cms/siteSettingsDefaults";

export default defineEventHandler(async (event) => {
  // Edge caching: 60s browser, 300s edge
  setHeader(event, "Cache-Control", "public, max-age=60, s-maxage=300, stale-while-revalidate=600");

  const env = event.context.cloudflare?.env as { DB: any } | undefined;
  if (!env?.DB) {
    return defaultSiteSettingsData;
  }

  const db = drizzle(env.DB, { schema });
  try {
    const records = await db
      .select()
      .from(schema.homeCms)
      .where(eq(schema.homeCms.key, "site_settings"))
      .limit(1);

    const first = records[0];
    if (first?.data) {
      const parsed = JSON.parse(first.data);
      return {
        ...defaultSiteSettingsData,
        ...parsed,
        brand: { ...defaultSiteSettingsData.brand, ...(parsed.brand || {}) },
        typography: { ...defaultSiteSettingsData.typography, ...(parsed.typography || {}) },
        theme: { ...defaultSiteSettingsData.theme, ...(parsed.theme || {}) },
        social: { ...defaultSiteSettingsData.social, ...(parsed.social || {}) },
        contact: { ...defaultSiteSettingsData.contact, ...(parsed.contact || {}) },
        announcement: { ...defaultSiteSettingsData.announcement, ...(parsed.announcement || {}) },
      } as SiteSettingsData;
    }

    // Seed default settings if not yet present in database
    await db
      .insert(schema.homeCms)
      .values({
        key: "site_settings",
        data: JSON.stringify(defaultSiteSettingsData),
        updatedAt: new Date().toISOString(),
      })
      .onConflictDoNothing();

    return defaultSiteSettingsData;
  } catch (err) {
    console.error("Failed to load CMS site settings:", err);
    return defaultSiteSettingsData;
  }
});
