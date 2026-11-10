import { sqliteTable, integer, text, index } from "drizzle-orm/sqlite-core";

export const dailySchedule = sqliteTable(
  "daily_schedule",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    time: text("time").notNull(), // HH:mm in 24-hour format
    title: text("title").notNull(), // JSON: Localized { en, bn }
    description: text("description").notNull(), // JSON: Localized { en, bn }
    sortOrder: integer("sort_order").notNull().default(0),
    active: integer("active", { mode: "boolean" }).notNull().default(true),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => ({
    sortOrderIdx: index("daily_schedule_sort_order_idx").on(table.sortOrder),
    timeIdx: index("daily_schedule_time_idx").on(table.time),
  })
);
