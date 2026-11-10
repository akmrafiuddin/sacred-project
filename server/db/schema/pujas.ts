import { sqliteTable, integer, text, index } from "drizzle-orm/sqlite-core";

export const pujas = sqliteTable(
  "pujas",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(), // JSON: Localized { en, bn }
    description: text("description").notNull(), // JSON: Localized { en, bn }
    offered: text("offered"), // JSON: Localized { en, bn } (samagri / offerings included)
    priceBdt: integer("price_bdt").notNull().default(0), // Integer BDT
    duration: text("duration"), // e.g. "45 minutes", "2 hours"
    bookable: integer("bookable", { mode: "boolean" }).notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    active: integer("active", { mode: "boolean" }).notNull().default(true),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => ({
    slugIdx: index("pujas_slug_idx").on(table.slug),
    sortOrderIdx: index("pujas_sort_order_idx").on(table.sortOrder),
  })
);
