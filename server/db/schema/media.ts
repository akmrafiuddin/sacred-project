import { sqliteTable, integer, text, index } from "drizzle-orm/sqlite-core";
import { user } from "./auth";

export const media = sqliteTable(
  "media",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    key: text("key").notNull().unique(), // Random immutable storage key in R2
    mime: text("mime").notNull(), // image/jpeg, image/png, image/webp
    size: integer("size").notNull(), // size in bytes
    width: integer("width"),
    height: integer("height"),
    alt: text("alt").notNull(), // JSON: Localized { en, bn }
    uploadedBy: text("uploaded_by").references(() => user.id, { onDelete: "set null" }),
    createdAt: integer("created_at").notNull(),
  },
  (table) => ({
    keyIdx: index("media_key_idx").on(table.key),
    createdAtIdx: index("media_created_at_idx").on(table.createdAt),
  })
);
