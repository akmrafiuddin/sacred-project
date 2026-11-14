import { sqliteTable, integer, text, index } from "drizzle-orm/sqlite-core";
import { user } from "./auth";
import { pujas } from "./pujas";

export const pujaBookings = sqliteTable(
  "puja_bookings",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    ref: text("ref").notNull().unique(), // Unique public non-guessable code (e.g. KM-2026-7F3K9)
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }), // Nullable for guests
    pujaId: integer("puja_id").references(() => pujas.id, { onDelete: "set null" }), // Nullable for custom/other
    pujaType: text("puja_type", {
      enum: ["standard", "custom"],
    })
      .notNull()
      .default("standard"),
    customPujaName: text("custom_puja_name"), // Specified name when pujaType is 'custom'
    customDakshina: integer("custom_dakshina"), // Admin-approved / quoted amount in BDT for custom rituals
    specialInstructions: text("special_instructions"), // Custom sankalpa/samagri/priest instructions
    name: text("name").notNull(),
    phone: text("phone").notNull(),
    email: text("email"),
    gotra: text("gotra"),
    preferredDate: text("preferred_date").notNull(), // YYYY-MM-DD
    note: text("note"),
    status: text("status", {
      enum: ["new", "confirmed", "completed", "cancelled"],
    })
      .notNull()
      .default("new"),
    handledBy: text("handled_by"), // Admin user ID or name who confirmed
    adminNote: text("admin_note"),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => ({
    refIdx: index("puja_bookings_ref_idx").on(table.ref),
    userIdIdx: index("puja_bookings_user_id_idx").on(table.userId),
    pujaTypeIdx: index("puja_bookings_type_idx").on(table.pujaType),
    statusIdx: index("puja_bookings_status_idx").on(table.status),
    preferredDateIdx: index("puja_bookings_pref_date_idx").on(table.preferredDate),
  })
);
