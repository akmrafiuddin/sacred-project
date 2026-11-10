import { z } from "zod";
import { eq } from "drizzle-orm";
import { router, publicProcedure, staffProcedure } from "../init";
import { todos, homeCms } from "../../db/schema";
import { defaultHomeData, type HomePageData } from "../../cms/defaults";
import { eventsRouter } from "./events";
import { noticesRouter } from "./notices";
import { pujasRouter } from "./pujas";
import { deitiesRouter } from "./deities";
import { scheduleRouter } from "./schedule";
import { pagesRouter } from "./pages";
import { galleryRouter } from "./gallery";
import { bookingsRouter } from "./bookings";
import { messagesRouter } from "./messages";
import { volunteersRouter } from "./volunteers";

export const appRouter = router({
  events: eventsRouter,
  notices: noticesRouter,
  pujas: pujasRouter,
  deities: deitiesRouter,
  schedule: scheduleRouter,
  pages: pagesRouter,
  gallery: galleryRouter,
  bookings: bookingsRouter,
  messages: messagesRouter,
  volunteers: volunteersRouter,
  todo: router({
    list: publicProcedure.query(({ ctx }) => ctx.db.select().from(todos)),

    create: publicProcedure
      .input(z.object({ title: z.string().min(1) }))
      .mutation(({ ctx, input }) =>
        ctx.db.insert(todos).values(input).returning()
      ),

    toggle: publicProcedure
      .input(z.object({ id: z.number(), done: z.boolean() }))
      .mutation(({ ctx, input }) =>
        ctx.db
          .update(todos)
          .set({ done: input.done })
          .where(eq(todos.id, input.id))
          .returning()
      ),
  }),

  cms: router({
    getHomeData: publicProcedure.query(async ({ ctx }) => {
      try {
        const records = await ctx.db
          .select()
          .from(homeCms)
          .where(eq(homeCms.key, "homepage"))
          .limit(1);

        const record = records[0];
        if (record?.data) {
          const parsed = JSON.parse(record.data);
          return { ...defaultHomeData, ...parsed } as HomePageData;
        }

        await ctx.db
          .insert(homeCms)
          .values({
            key: "homepage",
            data: JSON.stringify(defaultHomeData),
            updatedAt: new Date().toISOString(),
          })
          .onConflictDoNothing();

        return defaultHomeData;
      } catch (err) {
        console.error("tRPC CMS getHomeData error:", err);
        return defaultHomeData;
      }
    }),

    saveHomeData: staffProcedure
      .input(z.record(z.string(), z.any()))
      .mutation(async ({ ctx, input }) => {
        const existing = await ctx.db
          .select()
          .from(homeCms)
          .where(eq(homeCms.key, "homepage"))
          .limit(1);

        let merged = defaultHomeData;
        const existingRecord = existing[0];
        if (existingRecord?.data) {
          try {
            merged = { ...merged, ...JSON.parse(existingRecord.data) };
          } catch (e) {}
        }
        merged = { ...merged, ...input };

        await ctx.db
          .insert(homeCms)
          .values({
            key: "homepage",
            data: JSON.stringify(merged),
            updatedAt: new Date().toISOString(),
          })
          .onConflictDoUpdate({
            target: homeCms.key,
            set: {
              data: JSON.stringify(merged),
              updatedAt: new Date().toISOString(),
            },
          });

        return merged;
      }),

    resetDefaults: staffProcedure.mutation(async ({ ctx }) => {
      await ctx.db
        .insert(homeCms)
        .values({
          key: "homepage",
          data: JSON.stringify(defaultHomeData),
          updatedAt: new Date().toISOString(),
        })
        .onConflictDoUpdate({
          target: homeCms.key,
          set: {
            data: JSON.stringify(defaultHomeData),
            updatedAt: new Date().toISOString(),
          },
        });

      return defaultHomeData;
    }),
  }),
});

export type AppRouter = typeof appRouter;
