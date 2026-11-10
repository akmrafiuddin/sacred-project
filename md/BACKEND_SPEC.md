# BACKEND_SPEC.md — Backend Setup for the Whole Temple Site

> Instructions for the coding agent. This covers the **entire site backend**, not only the home page.
> Home page customization comes later and builds on this (see `HOME_CMS_SPEC.md`, which stays valid but is postponed).
> Work **one phase at a time**. After each phase run typecheck + lint, run the app locally, and confirm the "Done when" list before moving on.

## 0. Scope

Site: a Kali Mandir website for Chittagong, Bangladesh. Public pages: Home, About, Deities, Puja List & Charges, Festivals & Events, Gallery, Contact, Book a Puja, Plan a Visit, Seva/Offering info, Notices.

The backend must provide:

1. Authentication with three roles (`admin`, `editor`, `user`) and a secure admin area.
2. Content for every public page, editable by admins.
3. Public forms: contact, puja booking requests, volunteer registration.
4. Media storage (images).
5. Speed (edge caching), safety (validation, spam protection, rate limits) and operability (migrations, seeding, backups, audit log, tests).

Out of scope for now: online payments, email sending, SEO tooling, analytics. Leave clean extension points for them (see section 11).

## 1. Stack and fixed decisions

- Nuxt 4 + Nitro on Cloudflare Workers, Bun, TypeScript everywhere.
- Cloudflare D1 + Drizzle ORM (`drizzle-kit` migrations), R2 for media, Zod for validation.
- Better Auth (Drizzle adapter) for authentication. Three roles: `admin`, `editor`, `user`. Public sign-up (when enabled) creates `user` only.
- Public reads: Nitro routes (cacheable). Admin writes and admin reads: tRPC (`trpc-nuxt`) with `adminProcedure`.
- Public form submissions: Nitro `POST` routes (they need Turnstile and IP rate limiting at the HTTP layer).
- All visible text is bilingual `{ en, bn }`.

**Step 0 for the agent:** read the existing code (`schema.ts`, `server/api/cms/*`, `server/trpc/*`, `useAdminAuth.ts`, `wrangler.jsonc`, `nuxt.config.ts`) and list any conflict with this spec before changing anything. Do not delete working code without need. The existing `home_cms` table stays as is; it becomes the generic key/value content store (`site_content`) used later for home page customization.

## 2. Folder structure (target)

```
server/
  db/
    index.ts              # getDb(event) -> drizzle(env.DB)
    schema/               # split by domain, re-exported from schema/index.ts
      auth.ts  content.ts  deities.ts  pujas.ts  events.ts  notices.ts
      gallery.ts  media.ts  bookings.ts  messages.ts  volunteers.ts  audit.ts
  services/               # business logic, no HTTP: bookings.ts, events.ts, ...
  trpc/
    trpc.ts               # context, publicProcedure, adminProcedure, requireRole()
    routers/              # one router per domain
  api/
    auth/[...all].ts      # Better Auth handler
    public/               # cached GET routes
    forms/                # public POST routes (contact, booking, volunteer)
    media/[...key].get.ts # serve from R2
  middleware/             # security headers, admin route guard
  utils/                  # requireSession, rateLimit, turnstile, cache, audit, errors
shared/
  schemas/                # ALL Zod schemas, imported by server and admin UI
  types/
drizzle/                  # generated migrations
scripts/                  # seed.ts, seed-admin.ts, import scripts
```

Rule: **handlers stay thin** (parse, authorize, call a service, return). Logic lives in `services/` so it can be tested without HTTP.

## 3. Conventions (apply everywhere)

- **Validation:** every input validated by a Zod schema from `shared/schemas`. Never trust client data. Unknown keys are stripped.
- **Localized text:** `localized = z.object({ en: z.string().min(1), bn: z.string().default('') })`. Rendering falls back to `en` when `bn` is empty.
- **IDs:** integer autoincrement for internal rows; for anything shown to the public or used in URLs, add a unique `slug` (kebab-case) or a random public reference (bookings: e.g. `KM-2026-7F3K9`, never a guessable sequence).
- **Timestamps:** `createdAt`, `updatedAt` on every table (integer, Unix ms). Dates meant for people (event date) are `YYYY-MM-DD` text in `Asia/Dhaka`; times `HH:mm` 24h. Never parse a bare date with `new Date()`.
- **Soft visibility:** lists have `active` (boolean) and, where order matters, `sortOrder`. Prefer deactivating over deleting; hard delete only for messages/bookings after the retention period.
- **Errors:** one error shape `{ code, message, fieldErrors? }`. Use proper status codes (400 validation, 401, 403, 404, 409, 429). Never leak stack traces or SQL to clients.
- **Pagination:** all admin list queries take `{ page, pageSize (max 100), search?, filters? }` and return `{ items, total }`.
- **Transactions:** D1 has no long interactive transactions. Use `db.batch([...])` for multi-statement writes.
- **Money:** integer BDT. Format on the client with `Intl.NumberFormat('en-BD' | 'bn-BD')`.
- **PII:** bookings, messages and volunteers contain personal data. Admin-only, never in public payloads, never in logs, include a retention rule (section 9).

## 4. Phase 1 — Foundation

1. Create the folder structure above; move the existing schema into `schema/` without changing table definitions.
2. `getDb(event)` helper; fail with a clear error when the `DB` binding is missing (no silent fallback in production; keep the `defaults.ts` fallback only in local dev if already used).
3. Shared error helper, `shared/schemas/common.ts` (`localized`, `pagination`, `slug`, `isoDate`, `hhmm`).
4. Env/bindings checklist in `wrangler.jsonc`: `DB` (D1), `MEDIA` (R2), secrets `BETTER_AUTH_SECRET`, `TURNSTILE_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` (seed only). Document every variable in `.env.example`. Never commit secrets.
5. Scripts: `db:generate`, `db:local`, `db:remote`, `seed`, `seed:admin`, `typecheck`, `test`.
6. Security headers middleware: `X-Content-Type-Options`, `X-Frame-Options`/`frame-ancestors`, `Referrer-Policy`, a sensible CSP (allow Turnstile, fonts and the site's own assets), HSTS in production.

Done when: [ ] app runs unchanged, [ ] migrations apply cleanly from an empty DB, [ ] `.env.example` is complete.

## 5. Phase 2 — Authentication, roles and permissions (before any admin feature)

The existing cookie-only login is not verified by the server and must be replaced first.

### 5.1 Roles

Exactly three roles:

| Role | Who | Can do |
|---|---|---|
| `admin` | Temple trust / site owner (the "super admin") | Everything: users and roles, site settings, theme, all content, media, bookings, messages, volunteers, audit log |
| `editor` | Content volunteers | Create/edit content (deities, pujas, events, notices, pages, gallery) and upload media. No users, settings, theme, bookings or messages |
| `user` | Registered devotee | No admin access. Own profile, own puja booking requests (view, and cancel while status is `new`) |

Visitors who are not logged in are "guests": they can read the public site and submit the public forms (contact, booking, volunteer) exactly as before. An account is optional.

### 5.2 Tasks

1. Configure Better Auth with the Drizzle adapter on D1; generate its tables into `schema/auth.ts`. Follow the current official docs for the Nuxt/Nitro handler.
2. Add a `role` field (`admin` | `editor` | `user`, default `user`). **The role must never be settable from client input**: configure it as a server-controlled field (not accepted at sign-up or in profile updates). Only an `admin` can change a user's role.
3. **Sign-up** creates `user` accounts only, protected by Turnstile and rate limiting. Gate it behind an env flag `ALLOW_PUBLIC_SIGNUP` (default `false`). Reason: email is out of scope for now, so there is no email verification and no emailed password reset. Turn the flag on only after an email provider is added, or accept unverified low-privilege accounts consciously. Until then `admin` creates `editor` accounts and can reset a password manually.
4. `seed:admin` creates the first `admin` from env vars (`ADMIN_EMAIL`, `ADMIN_PASSWORD`). Safeguards: an admin cannot demote, disable or delete themselves if they are the last remaining `admin`.
5. Helpers: `requireSession(event)` and `requireRole(event, roles[])` throw 401/403. tRPC: `protectedProcedure` (any logged-in user), `staffProcedure` (`admin` or `editor`), `adminProcedure` (`admin` only). Every admin mutation uses one of the latter two. Never rely on a client-sent role.
6. **Ownership rule for `user`:** a `user` may only read or change rows where `userId === session.user.id` (their bookings, their profile). Enforce it in the service layer, with the filter in the query, not after fetching.
7. Permission matrix (enforce on the server, mirror it in the UI):

| Area | admin | editor | user | guest |
|---|---|---|---|---|
| Users, roles, site settings, theme | ✅ | ❌ | ❌ | ❌ |
| Content: deities, pujas, events, notices, gallery, pages | ✅ | ✅ | ❌ | read only |
| Media upload | ✅ | ✅ | ❌ | ❌ |
| Bookings, contact messages, volunteers (all) | ✅ | ❌ | ❌ | ❌ |
| Own bookings and profile | ✅ | ✅ | ✅ | ❌ |
| Submit contact / booking / volunteer forms | ✅ | ✅ | ✅ | ✅ |
| Audit log | ✅ | ❌ | ❌ | ❌ |

8. Front end routing: `/admin/**` requires `admin` or `editor` (a `user` is redirected to `/account`); `/account/**` requires any login. The client guard is UX only, the server check is the real protection. Within `/admin`, hide screens the role cannot use.
9. Rewrite `useAdminAuth.ts` (rename to `useAuth.ts` if sensible), `login.vue` and the guards on Better Auth sessions. Remove the old `temple_super_admin_session` cookie logic.
10. Login rate limiting, `httpOnly`, `secure` (production), `sameSite=lax` cookies. Test login on a **deployed** Worker as well as locally, because password hashing is CPU-heavy on Workers.
11. Minimal `/account` page: profile (name, phone) and "My booking requests".

Done when: [ ] `POST /api/cms/home` without a session returns 401, [ ] a `user` gets 403 on every `/api/admin/**` and admin tRPC call, [ ] an `editor` gets 403 on users, settings, theme, bookings and messages, [ ] a `user` cannot read another user's booking, [ ] a sign-up request that includes `role: "admin"` still creates a `user`, [ ] the last admin cannot be removed, [ ] no credentials in the repo.

## 6. Phase 3 — Content domain (tables, public reads, admin CRUD)

Create these tables (localized columns are JSON typed as `Localized`; all have `createdAt`, `updatedAt`):

| Table | Key columns |
|---|---|
| `site_content` (existing `home_cms`) | `key` PK, `data` JSON. Site settings, footer, contact info, theme, page blocks. |
| `pages` | `slug` unique, `title`, `body` (structured JSON or Markdown), `published`. For About, Plan a Visit, Seva info. |
| `deities` | `slug`, `name`, `subtitle`, `description`, `imageId` → media, `sortOrder`, `active` |
| `pujas` | `slug`, `name`, `offered`, `priceBdt`, `duration`, `bookable`, `sortOrder`, `active` |
| `daily_schedule` | `time` (HH:mm), `title`, `description`, `sortOrder`, `active` |
| `events` | `date` (indexed), `kind` (`special_puja`/`festival`/`seva`/`other`), `title`, `label` (tithi/Bengali date), `time`, `description`, `active` |
| `notices` | `slug`, `title`, `category`, `date`, `body`, `pinned`, `active` |
| `albums` / `album_items` | album: `slug`, `title`, `cover`, `sortOrder`; item: `albumId`, `mediaId`, `caption`, `sortOrder` |
| `media` | see Phase 5 |

**Public read routes** (`server/api/public/*`, `GET`, cached, only `active`/published rows, only needed fields):
`/site`, `/schedule`, `/pujas`, `/pujas/[slug]`, `/deities`, `/deities/[slug]`, `/events?month=YYYY-MM`, `/events/upcoming?kind=festival&limit=`, `/notices`, `/notices/[slug]`, `/albums`, `/albums/[slug]`, `/pages/[slug]`.
Existing `/api/cms/home` keeps working and later becomes the aggregated home payload.

**Admin tRPC routers**, one per domain, each with `list` (paginated, searchable), `get`, `create`, `update`, `delete`/`setActive`, and `reorder` where `sortOrder` exists. Use `staffProcedure` for content domains and `adminProcedure` for users, settings and theme. Use a small helper to avoid copy-paste for simple lists, but keep explicit code where a domain has real logic. Role checks per the matrix above.

**Seed/import:** write `scripts/seed.ts` that loads the current `defaults.ts` and existing `home_cms` content into these tables. It must be safe to re-run (upsert by slug/key).

Computed on the server, not stored: the "next aarti" value (from `daily_schedule` + current time in `Asia/Dhaka`, rolling to tomorrow's first item after the last).

Build order: **events → notices → pujas → deities → daily_schedule → pages → albums**. Commit after each domain.

Done when (per domain): [ ] public route returns the same content the site shows today, [ ] admin can create/edit/deactivate/reorder through tRPC, [ ] Zod rejects invalid input, [ ] inactive rows never appear publicly.

## 7. Phase 4 — Public forms (contact, puja booking, volunteer)

Tables:

- `puja_bookings`: `ref` (unique public code), `userId` (nullable: set when the submitter is logged in, null for guests), `pujaId` (nullable for "other"), `name`, `phone`, `email?`, `gotra?`, `preferredDate`, `note?`, `status` (`new`/`confirmed`/`completed`/`cancelled`), `handledBy?`, timestamps.
- `contact_messages`: `name`, `phone?`, `email?`, `subject`, `message`, `status` (`new`/`read`/`replied`/`archived`), timestamps.
- `volunteers`: `name`, `phone`, `area` (e.g. annadanam, crowd, decoration), `note?`, `status`, timestamps.

Rules for every public `POST /api/forms/*`:

1. Verify the **Cloudflare Turnstile** token server-side before doing anything else.
2. **Rate limit** per IP (e.g. a few submissions per hour per form). Use KV or a Durable Object or Cloudflare's rate limiting rules; document the choice.
3. Validate with Zod (phone format for Bangladesh, length limits, strip HTML). Add a hidden **honeypot** field.
4. Booking requests are **requests, not confirmed bookings** (the office confirms by phone). The response returns only the `ref` and a thank-you message, never other users' data.
5. Do not log PII. Log only the `ref`, the form type and the outcome.
6. Store, don't email (email is out of scope). Admins see new items in the dashboard with a "new" count.

Admin (role `admin` only): list with filters by status and date, detail view, change status, internal note, export CSV, delete after the retention period.

Logged-in `user` accounts: `GET /api/me/bookings` returns only their own bookings (`userId` filter in the query) and `POST /api/me/bookings/[ref]/cancel` works only while the status is `new`. Guest submissions keep working; a guest booking is never linked to an account afterwards.

Done when: [ ] each form works with Turnstile, [ ] a missing/invalid token returns 400, [ ] the rate limit returns 429, [ ] `editor` and `user` cannot read all bookings/messages (403), [ ] a `user` sees only their own bookings, [ ] admin can process a booking from `new` to `confirmed`.

## 8. Phase 5 — Media (R2)

- `media` table: `id`, `key` (random, immutable), `mime`, `size`, `width`, `height`, `alt` (Localized), `uploadedBy`, `createdAt`.
- `POST /api/admin/media` (roles `admin`/`editor`): images only (jpeg/png/webp), max ~5 MB, check the real content type (magic bytes), random key, store in R2, insert the row.
- `GET /api/media/[...key]`: stream from R2 with `Cache-Control: public, max-age=31536000, immutable` and `ETag`. A new upload always gets a new key, so no purge is needed.
- Images served as WebP / resized: use Cloudflare Image Resizing if the account has it, otherwise generate a few widths at upload time.
- Domain tables reference `mediaId`, not URLs. Deleting a media row is blocked while it is referenced (return 409).
- Rendering rule for the front end: always `width`/`height`, `loading="lazy"` except the first visible image, `alt` from the row.

Done when: [ ] admin uploads and attaches an image to a deity and the public page shows it, [ ] non-images and oversized files are rejected, [ ] deleting an in-use image is refused.

## 9. Phase 6 — Performance, caching, hardening and operations

**Caching**
- Public `GET` routes use cached handlers with `stale-while-revalidate`.
- One `purgeCache(tags)` helper called after **every** successful admin mutation (same helper writes the audit log).
- Verify caching and purging **on Cloudflare Workers**, not only locally. Nitro's default cache storage may not be shared across isolates; if so use the Cache API or a KV binding. Test: cached hit, then admin edit, then fresh content within seconds.

**Audit log**: `audit_log(id, userId, action, entity, entityId, at)`; written for every admin create/update/delete and every login. Viewable by `admin`.

**Data retention**: configurable period for bookings/messages/volunteers (default suggestion: delete or anonymize after 12 months); a scheduled cleanup (Cron Trigger) or an admin "purge old records" action. Document it in the repo.

**Backups**: document how to restore D1 (Time Travel) and how to export data; add a `db:export` script. Keep R2 object keys referenced by `media` so media can be re-linked.

**Observability**: structured logs (no PII), request IDs, a basic health route (`/api/health` checking D1), error reporting hook (Sentry or Workers logs) behind an env flag.

**Tests** (Vitest): Zod schemas, `requireRole` and the permission matrix, booking/contact/volunteer services (including rate limit and Turnstile failure paths), "next aarti" computation across midnight in `Asia/Dhaka`, slug uniqueness, pagination bounds.

Done when: [ ] the cache purges correctly on Workers, [ ] audit entries exist for admin actions, [ ] the test suite passes, [ ] the restore procedure is documented and tried once.

## 10. Definition of done for the whole backend

- Roles `admin`, `editor`, `user` are enforced on the server for every route and procedure.
- Every public page can get its data from a public API route backed by D1, with fallbacks only in local dev.
- No admin write path exists without server-side role checks.
- All inputs validated by shared Zod schemas.
- All public forms protected by Turnstile + rate limit, and PII never leaks in responses or logs.
- Media in R2 with immutable keys.
- Migrations, seed and admin bootstrap work from an empty database in one command each.

## 11. Extension points (do NOT build now)

- **Home page customization** (`HOME_CMS_SPEC.md`): section registry, `home_sections`, Home Builder UI, theme tokens. Builds on `site_content`, the list tables and media from above.
- **Email** (booking confirmations, contact replies): add a `notifications` service interface now (no-op implementation), plug a provider in later.
- **Payments / donations**: a `donations` table and provider adapter later; keep amounts in integer BDT.
- **SEO and analytics**: `pages` and slugs already support clean URLs and sitemaps.
- **Other languages**: `Localized` can be widened to more locale keys without a schema change.

## 12. Rules for the agent

1. One phase at a time; commit after each completed step with a clear message.
2. Write the migration, apply it locally, and confirm existing data survives before building on it.
3. Never leave an admin route unguarded, even temporarily.
4. Do not break the current public site at any step.
5. Ask before any destructive action (dropping tables, deleting data, rewriting git history).
6. If this spec conflicts with the real code, stop and report instead of guessing.
7. Never log or return personal data from bookings, messages or volunteers outside admin views.
