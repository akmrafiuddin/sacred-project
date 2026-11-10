import { sqliteTable, integer, text, index } from "drizzle-orm/sqlite-core";

export const pages = sqliteTable(
  "pages",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(), // JSON: Localized { en, bn }
    body: text("body").notNull(), // JSON: Localized { en, bn } (structured content or markdown)
    published: integer("published", { mode: "boolean" }).notNull().default(true),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => ({
    slugIdx: index("pages_slug_idx").on(table.slug),
    publishedIdx: index("pages_published_idx").on(table.published),
  })
);
