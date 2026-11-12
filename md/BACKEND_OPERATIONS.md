# Mandir Backend Operations Guide

This document outlines operations, data retention, backup procedures, disaster recovery, caching, and health observability for the Mandir application on Cloudflare Workers + D1 + R2.

---

## 1. Backups and Disaster Recovery

### 1.1 Cloudflare D1 Time Travel (Automated Point-in-Time Recovery)
Cloudflare D1 automatically retains continuous transaction logs for point-in-time recovery up to 30 days.

- **Check available restore points:**
  ```bash
  wrangler d1 time-travel info DB --remote
  ```
- **Restore D1 to a specific Unix timestamp:**
  ```bash
  wrangler d1 time-travel restore DB --timestamp=1731234567 --remote
  ```
- **Local simulation:**
  For local development, the SQLite state is preserved in `.wrangler/state/v3/d1/miniflare-D1DatabaseObject/`.

### 1.2 Snapshot Export (`bun run db:export`)
To take an offline, portable snapshot of all database tables:
```bash
bun run db:export
```
This script queries all content domains, users (with sensitive authentication secrets redacted), forms, and audit logs, generating a timestamped JSON file in `backups/backup-YYYY-MM-DDTHH-mm-ss-msZ.json`.

### 1.3 Media in Cloudflare R2
- Media files are saved with immutable, random keys in the Cloudflare R2 bucket `temple-cf-media`.
- The database `media` table maintains mappings (`key`, `mime`, `size`, `width`, `height`, `alt`).
- Deleting a media file is strictly guarded by the backend: if any deity, album cover, or album item references the media, deletion returns `409 Conflict`.

---

## 2. Data Retention Policy

To comply with privacy best practices and minimize storage of Personally Identifiable Information (PII):

- **Scope:** Public forms (`puja_bookings`, `contact_messages`, `volunteers`).
- **Retention Period:** Default threshold is **365 days (12 months)**.
- **Admin On-Demand Purge:**
  An authenticated super admin can trigger the retention purge at any time via the tRPC procedure:
  ```ts
  await trpc.audit.purgeOldRecords.mutate({ retentionDays: 365 });
  ```
  This atomically deletes matching records and writes an immutable entry into `audit_logs`.
- **Scheduled Automated Cleanup (Cron Trigger):**
  Add a scheduled trigger in `wrangler.jsonc` if automatic monthly cleanup is desired:
  ```jsonc
  "triggers": {
    "crons": ["0 0 1 * *"] // Run at 00:00 on the 1st day of every month
  }
  ```

---

## 3. Audit Logging

Every critical administrative mutation (create, update, delete, role elevation, record purge) is recorded in the `audit_logs` table:
- `id`: Auto-incrementing identifier
- `user_id`: ID of the authenticated user performing the action (references `user.id`)
- `action`: `create`, `update`, `delete`, `login`, `purge`, `cancel`
- `entity`: `event`, `notice`, `puja`, `deity`, `schedule`, `page`, `album`, `media`, `booking`, `message`, `volunteer`, `retention`
- `entity_id`: Slug, ID, or public reference code
- `details`: Non-PII JSON payload detailing the changes made
- `at`: Timestamp (Unix milliseconds)

The audit log is accessible exclusively to administrators with the `admin` role via `trpc.audit.list`.

---

## 4. Edge Caching & Cache Invalidation

- **Public Endpoints:** Served through cached routes (`stale-while-revalidate`).
- **Cache Purge Helper:**
  `purgeCache(tags?: string[])` in `server/utils/cache.ts` invalidates Nitro handler cache entries across Cloudflare Worker isolates.
- **Media Caching:**
  Served from `/api/media/[...key]` with:
  ```
  Cache-Control: public, max-age=31536000, immutable
  ETag: <r2-etag>
  ```
  HTTP conditional requests (`If-None-Match`) return `304 Not Modified` without transferring bytes.

---

## 5. Health Check & Observability

- **Endpoint:** `GET /api/health`
- **Behavior:**
  Executes an active probe query against Cloudflare D1 (`SELECT 1`).
  - **Healthy response (`200 OK`):**
    ```json
    {
      "status": "ok",
      "timestamp": 1731238910000,
      "d1": "healthy",
      "service": "mandir-backend"
    }
    ```
  - **Degraded response (`503 Service Unavailable`):**
    ```json
    {
      "status": "degraded",
      "timestamp": 1731238910000,
      "d1": "unhealthy",
      "error": "Failed to communicate with D1 database"
    }
    ```
