import { sqliteTable, integer, text, index } from "drizzle-orm/sqlite-core";

export const volunteers = sqliteTable(
  "volunteers",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    phone: text("phone").notNull(),
    area: text("area").notNull(), // e.g. "annadanam", "crowd", "decoration", "medical", "other"
    note: text("note"),
    status: text("status", {
      enum: ["new", "contacted", "active", "archived"],
    })
      .notNull()
      .default("new"),
    adminNote: text("admin_note"),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => ({
    statusIdx: index("volunteers_status_idx").on(table.status),
    areaIdx: index("volunteers_area_idx").on(table.area),
    createdAtIdx: index("volunteers_created_at_idx").on(table.createdAt),
  })
);
