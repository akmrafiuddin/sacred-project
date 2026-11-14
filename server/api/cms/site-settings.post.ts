import { drizzle } from "drizzle-orm/d1";
import { eq } from "drizzle-orm";
import * as schema from "../../db/schema";
import { defaultSiteSettingsData, type SiteSettingsData } from "../../cms/siteSettingsDefaults";
import { siteSettingsSchema } from "../../../shared/schemas/siteSettings";
import { requireRole } from "../../utils/session";
import { AuditService } from "../../services/audit";

export default defineEventHandler(async (event) => {
  // 1. Authorize admin or editor
  const sessionUser = await requireRole(event, ["admin", "editor"]);

  const body = await readBody(event);
  const env = event.context.cloudflare?.env as { DB: any } | undefined;
  if (!env?.DB) {
    throw createError({ statusCode: 500, message: "Cloudflare D1 Database binding not available" });
  }

  const db = drizzle(env.DB, { schema });
  const action = body?.action;

  // Handle Reset to defaults action
  if (action === "reset") {
    const now = new Date().toISOString();
    await db
      .insert(schema.homeCms)
      .values({
        key: "site_settings",
        data: JSON.stringify(defaultSiteSettingsData),
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: schema.homeCms.key,
        set: {
          data: JSON.stringify(defaultSiteSettingsData),
          updatedAt: now,
        },
      });

    await AuditService.record(db as any, {
      userId: sessionUser.user.id,
      action: "update",
      entity: "site_settings",
      entityId: "site_settings",
      details: { action: "reset_to_defaults" },
    }).catch((err) => console.warn("Audit record error:", err));

    return { success: true, data: defaultSiteSettingsData };
  }

  // Retrieve existing record to merge safely
  const rawInput = body?.data ? body.data : body;
  const existing = await db
    .select()
    .from(schema.homeCms)
    .where(eq(schema.homeCms.key, "site_settings"))
    .limit(1);

  let merged: SiteSettingsData = defaultSiteSettingsData;
  const existingRecord = existing[0];
  if (existingRecord?.data) {
    try {
      const parsed = JSON.parse(existingRecord.data);
      merged = {
        ...merged,
        ...parsed,
        brand: { ...merged.brand, ...(parsed.brand || {}) },
        typography: { ...merged.typography, ...(parsed.typography || {}) },
        theme: { ...merged.theme, ...(parsed.theme || {}) },
        social: { ...merged.social, ...(parsed.social || {}) },
        contact: { ...merged.contact, ...(parsed.contact || {}) },
        announcement: { ...merged.announcement, ...(parsed.announcement || {}) },
      };
    } catch (e) {
      console.warn("Failed to parse existing site settings JSON:", e);
    }
  }

  merged = {
    ...merged,
    brand: { ...merged.brand, ...(rawInput.brand || {}) },
    typography: { ...merged.typography, ...(rawInput.typography || {}) },
    theme: { ...merged.theme, ...(rawInput.theme || {}) },
    social: { ...merged.social, ...(rawInput.social || {}) },
    contact: { ...merged.contact, ...(rawInput.contact || {}) },
    announcement: { ...merged.announcement, ...(rawInput.announcement || {}) },
  };

  // Validate with Zod schema
  const parseResult = siteSettingsSchema.safeParse(merged);
  if (!parseResult.success) {
    throw createError({
      statusCode: 400,
      statusMessage: "Validation failed for site settings",
      data: parseResult.error.format(),
    });
  }

  const validatedData = parseResult.data;
  const now = new Date().toISOString();

  await db
    .insert(schema.homeCms)
    .values({
      key: "site_settings",
      data: JSON.stringify(validatedData),
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: schema.homeCms.key,
      set: {
        data: JSON.stringify(validatedData),
        updatedAt: now,
      },
    });

  // Record audit log
  await AuditService.record(db as any, {
    userId: sessionUser.user.id,
    action: "update",
    entity: "site_settings",
    entityId: "site_settings",
    details: {
      siteTitle: validatedData.brand.siteTitle,
      colorPalette: validatedData.theme.colorPalette,
      headingFont: validatedData.typography.headingFont,
      bodyFont: validatedData.typography.bodyFont,
    },
  }).catch((err) => console.warn("Audit record error:", err));

  return { success: true, data: validatedData };
});
