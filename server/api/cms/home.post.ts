import { drizzle } from "drizzle-orm/d1";
import { eq } from "drizzle-orm";
import * as schema from "../../db/schema";
import { defaultHomeData, type HomePageData } from "../../cms/defaults";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const env = event.context.cloudflare?.env as { DB: any } | undefined;
  if (!env?.DB) {
    throw createError({ statusCode: 500, message: "Cloudflare D1 Database binding not available" });
  }

  const db = drizzle(env.DB, { schema });
  const action = body?.action;

  if (action === "reset") {
    await db
      .insert(schema.homeCms)
      .values({
        key: "homepage",
        data: JSON.stringify(defaultHomeData),
        updatedAt: new Date().toISOString(),
      })
      .onConflictDoUpdate({
        target: schema.homeCms.key,
        set: {
          data: JSON.stringify(defaultHomeData),
          updatedAt: new Date().toISOString(),
        },
      });

    return { success: true, data: defaultHomeData };
  }

  const dataToSave = (body?.data ? body.data : body) as Partial<HomePageData>;
  const existing = await db
    .select()
    .from(schema.homeCms)
    .where(eq(schema.homeCms.key, "homepage"))
    .limit(1);

  let merged: HomePageData = defaultHomeData;
  const existingRecord = existing[0];
  if (existingRecord?.data) {
    try {
      merged = { ...merged, ...JSON.parse(existingRecord.data) };
    } catch (e) {
      // fallback
    }
  }

  merged = { ...merged, ...dataToSave };

  await db
    .insert(schema.homeCms)
    .values({
      key: "homepage",
      data: JSON.stringify(merged),
      updatedAt: new Date().toISOString(),
    })
    .onConflictDoUpdate({
      target: schema.homeCms.key,
      set: {
        data: JSON.stringify(merged),
        updatedAt: new Date().toISOString(),
      },
    });

  return { success: true, data: merged };
});
