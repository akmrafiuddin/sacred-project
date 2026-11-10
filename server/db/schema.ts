import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";

export const todos = sqliteTable("todos", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  done: integer("done", { mode: "boolean" }).notNull().default(false),
});

export const homeCms = sqliteTable("home_cms", {
  key: text("key").primaryKey(),
  data: text("data").notNull(),
  updatedAt: text("updated_at").notNull(),
});
