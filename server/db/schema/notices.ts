import { sqliteTable, integer, text, index } from "drizzle-orm/sqlite-core";

export const notices = sqliteTable(
  "notices",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(), // JSON: Localized { en, bn }
    category: text("category").notNull().default("general"),
    date: text("date").notNull(), // YYYY-MM-DD
    body: text("body").notNull(), // JSON: Localized { en, bn }
    pinned: integer("pinned", { mode: "boolean" }).notNull().default(false),
    active: integer("active", { mode: "boolean" }).notNull().default(true),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => ({
    slugIdx: index("notices_slug_idx").on(table.slug),
    dateIdx: index("notices_date_idx").on(table.date),
    pinnedIdx: index("notices_pinned_idx").on(table.pinned),
  })
);
