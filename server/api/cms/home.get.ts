import { drizzle } from "drizzle-orm/d1";
import { eq } from "drizzle-orm";
import * as schema from "../../db/schema";
import { defaultHomeData, type HomePageData } from "../../cms/defaults";

export default defineEventHandler(async (event) => {
  const env = event.context.cloudflare?.env as { DB: any } | undefined;
  if (!env?.DB) {
    return defaultHomeData;
  }

  const db = drizzle(env.DB, { schema });
  try {
    const records = await db
      .select()
      .from(schema.homeCms)
      .where(eq(schema.homeCms.key, "homepage"))
      .limit(1);

    const first = records[0];
    if (first?.data) {
      const parsed = JSON.parse(first.data);
      return {
        ...defaultHomeData,
        ...parsed,
      } as HomePageData;
    }

    // Seed default data if not yet present
    await db
      .insert(schema.homeCms)
      .values({
        key: "homepage",
        data: JSON.stringify(defaultHomeData),
        updatedAt: new Date().toISOString(),
      })
      .onConflictDoNothing();

    return defaultHomeData;
  } catch (err) {
    console.error("Failed to load CMS home data:", err);
    return defaultHomeData;
  }
});
