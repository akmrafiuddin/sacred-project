import { sqliteTable, integer, text, index } from "drizzle-orm/sqlite-core";
import { user } from "./auth";

export const visitations = sqliteTable(
  "visitations",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    ref: text("ref").notNull().unique(), // Unique public visitor pass code (e.g. VST-2026-8K2L4)
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }), // Nullable for guest pilgrims
    name: text("name").notNull(),
    phone: text("phone").notNull(),
    email: text("email"),
    visitDate: text("visit_date").notNull(), // YYYY-MM-DD
    timeSlot: text("time_slot", {
      enum: ["morning", "midday", "evening", "special_aarti"],
    })
      .notNull()
      .default("morning"),
    visitorCount: integer("visitor_count").notNull().default(1),
    purpose: text("purpose", {
      enum: [
        "general_darshan",
        "special_darshan",
        "group_pilgrimage",
        "annadanam",
        "rites_guidance",
        "other",
      ],
    })
      .notNull()
      .default("general_darshan"),
    specialNeeds: text("special_needs"),
    status: text("status", {
      enum: ["requested", "confirmed", "checked_in", "cancelled"],
    })
      .notNull()
      .default("confirmed"),
    checkInAt: integer("check_in_at"),
    handledBy: text("handled_by"),
    adminNotes: text("admin_notes"),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => ({
    refIdx: index("visitations_ref_idx").on(table.ref),
    userIdIdx: index("visitations_user_id_idx").on(table.userId),
    visitDateIdx: index("visitations_date_idx").on(table.visitDate),
    statusIdx: index("visitations_status_idx").on(table.status),
    timeSlotIdx: index("visitations_slot_idx").on(table.timeSlot),
  })
);
