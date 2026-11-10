import { sqliteTable, integer, text, index } from "drizzle-orm/sqlite-core";

export const albums = sqliteTable(
  "albums",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(), // JSON: Localized { en, bn }
    description: text("description"), // JSON: Localized { en, bn }
    cover: text("cover"), // mediaId or image URL
    sortOrder: integer("sort_order").notNull().default(0),
    active: integer("active", { mode: "boolean" }).notNull().default(true),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => ({
    slugIdx: index("albums_slug_idx").on(table.slug),
    sortOrderIdx: index("albums_sort_order_idx").on(table.sortOrder),
  })
);

export const albumItems = sqliteTable(
  "album_items",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    albumId: integer("album_id")
      .notNull()
      .references(() => albums.id, { onDelete: "cascade" }),
    mediaId: text("media_id").notNull(), // media ID or URL
    caption: text("caption"), // JSON: Localized { en, bn }
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => ({
    albumIdIdx: index("album_items_album_id_idx").on(table.albumId),
    sortOrderIdx: index("album_items_sort_order_idx").on(table.sortOrder),
  })
);
