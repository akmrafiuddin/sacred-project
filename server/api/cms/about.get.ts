import { drizzle } from "drizzle-orm/d1";
import { eq } from "drizzle-orm";
import * as schema from "../../db/schema";
import { defaultAboutData, type AboutPageData } from "../../cms/aboutDefaults";

export default defineEventHandler(async (event) => {
  // Edge & browser caching for high-speed delivery
  setHeader(event, "Cache-Control", "public, max-age=60, s-maxage=300, stale-while-revalidate=600");

  const env = event.context.cloudflare?.env as { DB: any } | undefined;
  if (!env?.DB) {
    return defaultAboutData;
  }

  const db = drizzle(env.DB, { schema });
  try {
    const records = await db
      .select()
      .from(schema.homeCms)
      .where(eq(schema.homeCms.key, "aboutpage"))
      .limit(1);

    const first = records[0];
    if (first?.data) {
      const parsed = JSON.parse(first.data);
      return {
        ...defaultAboutData,
        ...parsed,
      } as AboutPageData;
    }

    // Seed default data if not yet present
    await db
      .insert(schema.homeCms)
      .values({
        key: "aboutpage",
        data: JSON.stringify(defaultAboutData),
        updatedAt: new Date().toISOString(),
      })
      .onConflictDoNothing();

    return defaultAboutData;
  } catch (err) {
    console.error("Failed to load CMS about data:", err);
    return defaultAboutData;
  }
});
