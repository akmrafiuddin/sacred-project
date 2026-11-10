import { sqliteTable, integer, text, index } from "drizzle-orm/sqlite-core";
import { user } from "./auth";

export const auditLogs = sqliteTable(
  "audit_logs",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    action: text("action").notNull(), // create, update, delete, login, purge, cancel
    entity: text("entity").notNull(), // event, notice, puja, deity, schedule, page, album, media, booking, message, volunteer, auth
    entityId: text("entity_id"), // row id, slug, or ref
    details: text("details"), // JSON metadata (safe, no PII)
    at: integer("at").notNull(), // Unix timestamp (ms)
  },
  (table) => ({
    atIdx: index("audit_logs_at_idx").on(table.at),
    userIdIdx: index("audit_logs_user_id_idx").on(table.userId),
    entityIdx: index("audit_logs_entity_idx").on(table.entity),
  })
);
