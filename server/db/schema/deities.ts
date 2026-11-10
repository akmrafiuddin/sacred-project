import { sqliteTable, integer, text, index } from "drizzle-orm/sqlite-core";

export const deities = sqliteTable(
  "deities",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(), // JSON: Localized { en, bn }
    subtitle: text("subtitle"), // JSON: Localized { en, bn }
    description: text("description").notNull(), // JSON: Localized { en, bn }
    imageId: text("image_id"), // URL or Media reference ID
    sortOrder: integer("sort_order").notNull().default(0),
    active: integer("active", { mode: "boolean" }).notNull().default(true),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => ({
    slugIdx: index("deities_slug_idx").on(table.slug),
    sortOrderIdx: index("deities_sort_order_idx").on(table.sortOrder),
  })
);
