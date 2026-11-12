import { drizzle } from "drizzle-orm/d1";
import { eq } from "drizzle-orm";
import * as schema from "../../db/schema";
import { defaultAboutData, type AboutPageData } from "../../cms/aboutDefaults";
import { requireRole } from "../../utils/session";

export default defineEventHandler(async (event) => {
  // Only admin and editor can modify CMS data
  await requireRole(event, ["admin", "editor"]);

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
        key: "aboutpage",
        data: JSON.stringify(defaultAboutData),
        updatedAt: new Date().toISOString(),
      })
      .onConflictDoUpdate({
        target: schema.homeCms.key,
        set: {
          data: JSON.stringify(defaultAboutData),
          updatedAt: new Date().toISOString(),
        },
      });

    return { success: true, data: defaultAboutData };
  }

  const dataToSave = (body?.data ? body.data : body) as Partial<AboutPageData>;
  const existing = await db
    .select()
    .from(schema.homeCms)
    .where(eq(schema.homeCms.key, "aboutpage"))
    .limit(1);

  let merged: AboutPageData = defaultAboutData;
  const existingRecord = existing[0];
  if (existingRecord?.data) {
    try {
      merged = { ...merged, ...JSON.parse(existingRecord.data) };
    } catch (e) {
      console.warn("Failed to parse existing about CMS JSON:", e);
    }
  }

  merged = {
    ...merged,
    ...dataToSave,
    hero: { ...merged.hero, ...(dataToSave.hero || {}) },
    history: { ...merged.history, ...(dataToSave.history || {}) },
    administration: { ...merged.administration, ...(dataToSave.administration || {}) },
  };

  if (dataToSave.images) merged.images = dataToSave.images;

  const now = new Date().toISOString();
  await db
    .insert(schema.homeCms)
    .values({
      key: "aboutpage",
      data: JSON.stringify(merged),
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: schema.homeCms.key,
      set: {
        data: JSON.stringify(merged),
        updatedAt: now,
      },
    });

  // Harmonize with pages table for slug: 'about'
  try {
    const epochNow = Date.now();
    await db
      .insert(schema.pages)
      .values({
        slug: "about",
        title: JSON.stringify({ en: merged.hero.title, bn: "" }),
        body: JSON.stringify({
          en: merged.history.narrativeParagraphs.join("\n\n"),
          bn: merged.hero.subtitle,
        }),
        published: true,
        createdAt: epochNow,
        updatedAt: epochNow,
      })
      .onConflictDoUpdate({
        target: schema.pages.slug,
        set: {
          title: JSON.stringify({ en: merged.hero.title, bn: "" }),
          body: JSON.stringify({
            en: merged.history.narrativeParagraphs.join("\n\n"),
            bn: merged.hero.subtitle,
          }),
          updatedAt: epochNow,
        },
      });
  } catch (err) {
    console.warn("Could not sync pages table for slug 'about':", err);
  }

  return { success: true, data: merged };
});
