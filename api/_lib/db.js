// Thin data-access layer over plain `pg` (node-postgres) — chosen over
// @vercel/postgres because that package is deprecated (Vercel's Postgres
// offering now runs on Neon via the Marketplace) and `pg` works against
// any standard Postgres connection string, including Neon's, so this
// isn't locked to one storage vendor. Every query the admin backend needs
// lives here so API route handlers stay focused on request/response +
// authorization, not raw SQL.
//
// `sql` below mimics the tagged-template call shape the rest of this
// codebase uses (`sql\`SELECT ... WHERE id = ${id}\``, plus a `.query(text,
// params)` escape hatch for dynamic WHERE clauses) so route handlers don't
// need to know or care which driver is underneath.
import pg from 'pg';

const { Pool } = pg;
const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;

// Reused across warm serverless invocations (module scope = one pool per
// function instance, not one per request). Deliberately NOT created when
// there's no connection string: without this guard, `pg` silently falls
// back to its default local-connection behaviour (reading PGHOST/PGUSER/
// etc, or worse, whatever ambient Postgres happens to be running on the
// machine) instead of failing with a clear, actionable message.
const pool = connectionString
  ? new Pool({
      connectionString,
      ssl: !/localhost|127\.0\.0\.1/.test(connectionString) ? { rejectUnauthorized: false } : false,
    })
  : null;

const NOT_CONFIGURED = 'Database is not configured — set POSTGRES_URL (see README.md → "Set up the database").';

async function sql(strings, ...values) {
  if (!pool) throw new Error(NOT_CONFIGURED);
  let text = strings[0];
  const params = [];
  values.forEach((value, i) => {
    params.push(value);
    text += `$${params.length}` + strings[i + 1];
  });
  return pool.query(text, params);
}

sql.query = async (text, params = []) => {
  if (!pool) throw new Error(NOT_CONFIGURED);
  return pool.query(text, params);
};

export { sql };

export function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

export async function getUserByEmail(email) {
  const { rows } = await sql`
    SELECT * FROM users WHERE lower(email) = ${normalizeEmail(email)} LIMIT 1
  `;
  return rows[0] || null;
}

export async function getUserById(id) {
  const { rows } = await sql`SELECT * FROM users WHERE id = ${id} LIMIT 1`;
  return rows[0] || null;
}

export async function countMasterAdmins() {
  const { rows } = await sql`SELECT count(*)::int AS n FROM users WHERE role = 'MASTER'`;
  return rows[0].n;
}

export async function getSetting(key, fallback = null) {
  const { rows } = await sql`SELECT value FROM settings WHERE key = ${key} LIMIT 1`;
  return rows.length ? rows[0].value : fallback;
}

export async function setSetting(key, value, updatedBy) {
  await sql`
    INSERT INTO settings (key, value, updated_by, updated_at)
    VALUES (${key}, ${JSON.stringify(value)}::jsonb, ${updatedBy}, now())
    ON CONFLICT (key) DO UPDATE SET value = ${JSON.stringify(value)}::jsonb, updated_by = ${updatedBy}, updated_at = now()
  `;
}

export async function deleteSession(sessionId) {
  await sql`DELETE FROM sessions WHERE id = ${sessionId}`;
}

export async function deleteAllUserSessions(userId) {
  await sql`DELETE FROM sessions WHERE user_id = ${userId}`;
}

export async function logActivity({ userId, userName, userRole, action, objectType = null, objectId = null, status = 'success', meta = null }) {
  await sql`
    INSERT INTO activity_log (user_id, user_name, user_role, action, object_type, object_id, status, meta)
    VALUES (${userId}, ${userName}, ${userRole}, ${action}, ${objectType}, ${objectId}, ${status}, ${meta ? JSON.stringify(meta) : null}::jsonb)
  `;
}
