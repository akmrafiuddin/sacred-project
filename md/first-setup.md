# Project Setup (local-first, Cloudflare Workers-ready)

**Stack:** Nuxt 4 (Vue 3 + Vite + Nitro server) · tRPC (`trpc-nuxt`) · Zod · Drizzle ORM · SQLite via Cloudflare D1 · Bun (package manager only)

**Goal:** build and run everything locally now, and deploy to Cloudflare Workers later with no rewrites. No Cloudflare account is needed until deploy time.

**What changed from the earlier Hono-based plan:** Hono, `vue-router` and TanStack Query are gone. Nuxt handles the server (Nitro), file-based routing and data fetching. Vite+ is skipped because Nuxt manages Vite itself.

---

## 0. Rules (read first)

1. **Bun is the package manager only.** Run Nuxt with Node (plain `nuxt dev` / `nuxt build`). Do not use `bunx --bun` or `Bun.*` APIs, because Nitro's Cloudflare dev proxy and `wrangler` expect Node.
2. **Server code must be Workers-compatible:** web-standard APIs (`fetch`, `Request`/`Response`, Web Crypto), no `fs`, no native Node modules, no `bun:sqlite`.
3. **Database only through the D1 binding** (`event.context.cloudflare.env.DB`) with `drizzle-orm/d1`. No local `.db` files.
4. **Create the Drizzle instance per request** (inside the tRPC context). Never at module level.
5. **No interactive transactions** (D1 does not support them). Use `db.batch([...])` for atomic multi-statement writes.
6. **App code imports server types with `import type` only.** Never import runtime server code in `app/`.
7. **Secrets and private config:** use Nuxt `runtimeConfig` with `NUXT_`-prefixed env vars (`.env` locally, git-ignored). Read them with `useRuntimeConfig(event)`.
8. **Schema changes** always go through Drizzle migrations, never manual edits.

---

## 1. Create the project and install

```bash
bunx nuxi@latest init my-app     # choose "bun" as package manager, no extra modules
cd my-app

bun add @trpc/server @trpc/client trpc-nuxt zod drizzle-orm

bun add -d drizzle-kit wrangler nitro-cloudflare-dev \
  @cloudflare/workers-types typescript vue-tsc
```

Make sure `.gitignore` contains:

```
node_modules
.nuxt
.output
dist
.wrangler
.env
```

---

## 2. Folder structure (Nuxt 4)

```
my-app/
├─ nuxt.config.ts
├─ wrangler.jsonc
├─ drizzle.config.ts
├─ .env
├─ drizzle/                    # generated migrations (commit these)
├─ app/
│  ├─ app.vue
│  ├─ pages/index.vue
│  └─ plugins/trpc.ts
└─ server/
   ├─ api/trpc/[trpc].ts       # tRPC HTTP handler
   ├─ db/schema.ts
   └─ trpc/
      ├─ init.ts
      ├─ context.ts
      └─ routers/index.ts
```

---

## 3. Config files

### `nuxt.config.ts`

```ts
export default defineNuxtConfig({
  compatibilityDate: "2026-11-01",
  devtools: { enabled: true },
  modules: ["nitro-cloudflare-dev"],
  build: { transpile: ["trpc-nuxt"] },
  nitro: {
    preset: "cloudflare_module",
    cloudflare: { nodeCompat: true },
  },
});
```

`nitro-cloudflare-dev` exposes the D1 binding to `nuxt dev` using the local simulation. The `cloudflare_module` preset is what makes the production build a Worker.

### `wrangler.jsonc` (project root)

The `database_id` is a placeholder. Local mode does not need a real one.

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "my-app",
  "compatibility_date": "2026-11-01",
  "compatibility_flags": ["nodejs_compat"],
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "my-app-db",
      "database_id": "local-placeholder",
      "migrations_dir": "drizzle"
    }
  ]
}
```

### `drizzle.config.ts`

```ts
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "sqlite",
  schema: "./server/db/schema.ts",
  out: "./drizzle",
});
```

### `package.json` scripts

Keep the scripts Nuxt generated (`postinstall: nuxt prepare`) and make sure these exist:

```json
{
  "scripts": {
    "dev": "nuxt dev",
    "build": "nuxt build",
    "preview": "nuxt preview",
    "typecheck": "nuxt typecheck",
    "db:generate": "drizzle-kit generate",
    "db:local": "wrangler d1 migrations apply DB --local"
  }
}
```

---

## 4. Server code

### `server/db/schema.ts`

```ts
import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";

export const todos = sqliteTable("todos", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  done: integer("done", { mode: "boolean" }).notNull().default(false),
});
```

### `server/trpc/context.ts`

Use relative imports inside `server/` to avoid alias confusion.

```ts
import type { H3Event } from "h3";
import type { D1Database } from "@cloudflare/workers-types";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "../db/schema";

export const createContext = (event: H3Event) => {
  const env = event.context.cloudflare.env as { DB: D1Database };
  return {
    event,
    db: drizzle(env.DB, { schema }),
  };
};

export type Context = ReturnType<typeof createContext>;
```

### `server/trpc/init.ts`

```ts
import { initTRPC } from "@trpc/server";
import type { Context } from "./context";

const t = initTRPC.context<Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure;
```

### `server/trpc/routers/index.ts`

```ts
import { z } from "zod";
import { eq } from "drizzle-orm";
import { router, publicProcedure } from "../init";
import { todos } from "../../db/schema";

export const appRouter = router({
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
});

export type AppRouter = typeof appRouter;
```

### `server/api/trpc/[trpc].ts`

```ts
import { createTRPCNuxtHandler } from "trpc-nuxt/server";
import { appRouter } from "../../trpc/routers";
import { createContext } from "../../trpc/context";

export default createTRPCNuxtHandler({
  router: appRouter,
  createContext,
});
```

---

## 5. App code

### `app/plugins/trpc.ts`

```ts
import { createTRPCNuxtClient, httpBatchLink } from "trpc-nuxt/client";
import type { AppRouter } from "~~/server/trpc/routers";

export default defineNuxtPlugin(() => {
  const trpc = createTRPCNuxtClient<AppRouter>({
    links: [httpBatchLink({ url: "/api/trpc" })],
  });

  return { provide: { trpc } };
});
```

### `app/app.vue`

```vue
<template>
  <NuxtPage />
</template>
```

### `app/pages/index.vue`

```vue
<script setup lang="ts">
const { $trpc } = useNuxtApp();
const title = ref("");

const { data: todos, refresh } = await $trpc.todo.list.useQuery();

async function add() {
  if (!title.value.trim()) return;
  await $trpc.todo.create.mutate({ title: title.value });
  title.value = "";
  await refresh();
}
</script>

<template>
  <main>
    <h1>Todos</h1>
    <input v-model="title" placeholder="New todo" @keyup.enter="add" />
    <ul>
      <li v-for="t in todos" :key="t.id">{{ t.title }}</li>
    </ul>
  </main>
</template>
```

---

## 6. First run (local only)

```bash
bun run db:generate    # create SQL migration from schema
bun run db:local       # apply migration to the local D1 database
bun run dev            # Nuxt dev server with local D1 binding
```

Check: open the app, add a todo, and confirm it persists after a refresh.

**Workflow for every schema change:** edit `schema.ts`, then `bun run db:generate`, then `bun run db:local`.

---

## 7. Shipping later (about 10-15 minutes)

Only do this when ready to deploy.

1. `bunx wrangler login`
2. `bunx wrangler d1 create my-app-db`, then copy the printed `database_id` into `wrangler.jsonc`.
3. Add scripts to `package.json`:
   ```json
   "db:remote": "wrangler d1 migrations apply DB --remote"
   ```
4. `bun run db:remote`
5. Set production secrets as `NUXT_`-prefixed values: `bunx wrangler secret put NUXT_SOME_SECRET`
6. `bun run build`
7. **Verify the generated Wrangler config** in the build output (`.output/server/` or `dist/`, depending on the Nuxt/Nitro version) contains the `DB` D1 binding. If it does not, mirror the binding in `nuxt.config.ts` under `nitro.cloudflare.wrangler.d1_databases`.
8. Deploy per Nuxt's current Cloudflare Workers docs. This is usually `bunx wrangler deploy` pointed at the generated config, or connecting the Git repo to Cloudflare Workers Builds.

---

## 8. Known gotchas

- **Dev vs production runtime:** `nuxt dev` runs Nitro in Node with a proxied local D1. Production runs in `workerd`. Anything that only works in Node (filesystem, native modules) will pass locally and fail after deploy, so avoid them from the start and test a production build before your first deploy: run `bun run build`, then run the build output locally with `wrangler dev` (check Nuxt's current Cloudflare docs for the exact command, since `nuxt preview` may not do this for the Cloudflare preset).
- **"No such table" in dev:** run `bun run db:local` again.
- **Server code in the client bundle:** only `import type` from `server/` inside `app/`.
- **SSR runs inside the Worker:** avoid heavy server-side dependencies. Check Workers CPU and bundle size limits for your plan.
- **`compatibilityDate`:** pin it and bump it deliberately.
- **Versions move fast:** Nuxt, Nitro, `trpc-nuxt` and `nitro-cloudflare-dev` change often. If a step fails, check each project's current Cloudflare docs before debugging your own code.
- **Optional later:** Vitest via `@nuxt/test-utils`, Tailwind, auth (for example Better Auth on D1), R2 for uploads.
