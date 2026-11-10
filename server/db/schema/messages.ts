import { sqliteTable, integer, text, index } from "drizzle-orm/sqlite-core";

export const contactMessages = sqliteTable(
  "contact_messages",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    phone: text("phone"),
    email: text("email"),
    subject: text("subject").notNull(),
    message: text("message").notNull(),
    status: text("status", {
      enum: ["new", "read", "replied", "archived"],
    })
      .notNull()
      .default("new"),
    adminNote: text("admin_note"),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => ({
    statusIdx: index("contact_messages_status_idx").on(table.status),
    createdAtIdx: index("contact_messages_created_at_idx").on(table.createdAt),
  })
);
