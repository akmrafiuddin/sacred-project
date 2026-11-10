import fs from "node:fs";
import path from "node:path";
import { Database } from "bun:sqlite";

function findLocalD1Path(): string | null {
  const d1Dir = path.resolve(process.cwd(), ".wrangler/state/v3/d1/miniflare-D1DatabaseObject");
  if (!fs.existsSync(d1Dir)) return null;
  const files = fs.readdirSync(d1Dir);
  const dbFile = files.find((f) => f.endsWith(".sqlite") && !f.startsWith("metadata"));
  return dbFile ? path.join(d1Dir, dbFile) : null;
}

export async function exportDatabase() {
  console.log("[db:export] Starting database backup export...");

  const dbPath = findLocalD1Path();
  if (!dbPath) {
    throw new Error(
      "[db:export] Local D1 database file not found. Run 'bun run db:local' first."
    );
  }

  const sqlite = new Database(dbPath);

  // List all tables
  const tables = [
    "home_cms",
    "events",
    "notices",
    "pujas",
    "deities",
    "daily_schedule",
    "pages",
    "albums",
    "album_items",
    "media",
    "puja_bookings",
    "contact_messages",
    "volunteers",
    "audit_logs",
    "user",
  ];

  const exportPayload: Record<string, any[]> = {};
  const counts: Record<string, number> = {};

  for (const tableName of tables) {
    try {
      const rows = sqlite.query(`SELECT * FROM ${tableName}`).all() as any[];
      // If table is 'user', sanitize sensitive hashes if any
      if (tableName === "user") {
        exportPayload[tableName] = rows.map((u) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role,
          createdAt: u.created_at,
          updatedAt: u.updated_at,
        }));
      } else {
        exportPayload[tableName] = rows;
      }
      counts[tableName] = rows.length;
    } catch {
      // Table might not exist yet
      counts[tableName] = 0;
    }
  }

  const backupDir = path.resolve(process.cwd(), "backups");
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const fileName = `backup-${timestamp}.json`;
  const filePath = path.join(backupDir, fileName);

  fs.writeFileSync(filePath, JSON.stringify(exportPayload, null, 2), "utf-8");

  console.log(`[db:export] Successfully exported backup to: ${filePath}`);
  console.log("[db:export] Row counts summary:");
  for (const [t, c] of Object.entries(counts)) {
    console.log(`  - ${t}: ${c} rows`);
  }

  return filePath;
}

if (import.meta.main) {
  exportDatabase().catch((err) => {
    console.error("[db:export] Error during export:", err);
    process.exit(1);
  });
}
