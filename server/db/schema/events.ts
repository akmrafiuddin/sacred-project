import { sqliteTable, integer, text, index } from "drizzle-orm/sqlite-core";

export const events = sqliteTable(
  "events",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    slug: text("slug").notNull().unique(),
    date: text("date").notNull(), // YYYY-MM-DD in Asia/Dhaka
    kind: text("kind", {
      enum: ["special_puja", "festival", "seva", "other"],
    })
      .notNull()
      .default("special_puja"),
    title: text("title").notNull(), // JSON: Localized { en, bn }
    label: text("label"), // JSON: Localized { en, bn } (tithi / Bengali date)
    time: text("time"), // HH:mm or text
    description: text("description").notNull(), // JSON: Localized { en, bn }
    active: integer("active", { mode: "boolean" }).notNull().default(true),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => ({
    dateIdx: index("events_date_idx").on(table.date),
    slugIdx: index("events_slug_idx").on(table.slug),
  })
);
