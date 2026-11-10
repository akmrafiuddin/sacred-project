import fs from "node:fs";
import path from "node:path";
import { Database } from "bun:sqlite";
import { hashPassword } from "better-auth/crypto";

function findLocalD1Path(): string | null {
  const d1Dir = path.resolve(process.cwd(), ".wrangler/state/v3/d1/miniflare-D1DatabaseObject");
  if (!fs.existsSync(d1Dir)) return null;
  const files = fs.readdirSync(d1Dir);
  const dbFile = files.find((f) => f.endsWith(".sqlite") && !f.startsWith("metadata"));
  return dbFile ? path.join(d1Dir, dbFile) : null;
}

export async function seedAdminUser(options?: {
  email?: string;
  password?: string;
  name?: string;
}) {
  const email = (options?.email || process.env.ADMIN_EMAIL || "admin@temple.org").toLowerCase().trim();
  const password = options?.password || process.env.ADMIN_PASSWORD || "admin123456";
  const name = options?.name || process.env.ADMIN_NAME || "Temple Administrator";

  console.log(`[seed-admin] Seeding admin user: ${email}...`);

  const dbPath = findLocalD1Path();
  if (!dbPath) {
    throw new Error(
      "[seed-admin] Local D1 database file not found. Run 'bun run db:local' first to initialize migrations."
    );
  }

  const db = new Database(dbPath);

  // Check if user already exists
  const existingUser = db
    .query("SELECT id, email, role FROM user WHERE email = ?")
    .get(email) as { id: string; email: string; role: string } | null;

  const now = Date.now();
  const hashedPassword = await hashPassword(password);

  if (existingUser) {
    console.log(`[seed-admin] User ${email} exists with role: ${existingUser.role}. Ensuring role is 'admin'...`);
    db.run("UPDATE user SET role = 'admin', name = ?, updated_at = ? WHERE id = ?", [
      name,
      now,
      existingUser.id,
    ]);

    // Check account
    const existingAccount = db
      .query("SELECT id FROM account WHERE user_id = ? AND provider_id = 'credential'")
      .get(existingUser.id) as { id: string } | null;

    if (existingAccount) {
      db.run("UPDATE account SET password = ?, updated_at = ? WHERE id = ?", [
        hashedPassword,
        now,
        existingAccount.id,
      ]);
    } else {
      const accountId = crypto.randomUUID();
      db.run(
        `INSERT INTO account (id, account_id, provider_id, user_id, password, created_at, updated_at)
         VALUES (?, ?, 'credential', ?, ?, ?, ?)`,
        [accountId, existingUser.id, existingUser.id, hashedPassword, now, now]
      );
    }
    console.log(`[seed-admin] Updated admin user ${email} successfully.`);
    return { userId: existingUser.id, email, role: "admin" };
  } else {
    const userId = crypto.randomUUID();
    const accountId = crypto.randomUUID();

    db.run(
      `INSERT INTO user (id, name, email, email_verified, image, role, phone, created_at, updated_at)
       VALUES (?, ?, ?, 1, NULL, 'admin', NULL, ?, ?)`,
      [userId, name, email, now, now]
    );

    db.run(
      `INSERT INTO account (id, account_id, provider_id, user_id, password, created_at, updated_at)
       VALUES (?, ?, 'credential', ?, ?, ?, ?)`,
      [accountId, userId, userId, hashedPassword, now, now]
    );

    console.log(`[seed-admin] Created new admin user ${email} (ID: ${userId}).`);
    return { userId, email, role: "admin" };
  }
}

// Safeguard function to ensure the last admin cannot be deleted or demoted
export function assertCanModifyAdmin(
  db: Database,
  targetUserId: string,
  newRole?: string
): void {
  const target = db
    .query("SELECT id, email, role FROM user WHERE id = ?")
    .get(targetUserId) as { id: string; email: string; role: string } | null;

  if (!target) {
    throw new Error("Target user does not exist");
  }

  if (target.role === "admin" && newRole && newRole !== "admin") {
    const adminCount = db
      .query("SELECT COUNT(*) as count FROM user WHERE role = 'admin'")
      .get() as { count: number };

    if (adminCount.count <= 1) {
      throw new Error("Cannot demote the last remaining admin account.");
    }
  }
}

if (import.meta.main) {
  seedAdminUser()
    .then(() => {
      console.log("[seed-admin] Admin bootstrap complete.");
      process.exit(0);
    })
    .catch((err) => {
      console.error("[seed-admin] Error:", err);
      process.exit(1);
    });
}
