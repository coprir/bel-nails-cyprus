import bcrypt from 'bcryptjs';
import { sql, normalizeEmail, getUserByEmail, countMasterAdmins, logActivity } from '../_lib/db.js';
import { requireAuth } from '../_lib/auth.js';
import { withHandler } from '../_lib/http.js';

const MIN_PASSWORD_LENGTH = 10;

export default withHandler(async function handler(req, res) {
  if (req.method === 'GET') return handleList(req, res);
  if (req.method === 'POST') return handleCreate(req, res);
  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({ error: 'Method not allowed' });
});

async function handleList(req, res) {
  const session = await requireAuth(req, res, ['MASTER']); // Master-only page
  if (!session) return;

  const { rows } = await sql`
    SELECT u.id, u.name, u.email, u.role, u.status, u.two_factor_enabled, u.last_login, u.created_at,
           (SELECT count(*)::int FROM sessions s WHERE s.user_id = u.id AND s.expires_at > now()) AS active_sessions
    FROM users u
    ORDER BY (u.role = 'MASTER') DESC, u.created_at ASC
  `;
  return res.status(200).json({ users: rows });
}

async function handleCreate(req, res) {
  const session = await requireAuth(req, res, ['MASTER']);
  if (!session) return;
  const { user: master } = session;

  const { name, email, password, role } = req.body || {};
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email and password are required.' });
  }
  const targetRole = role === 'MASTER' ? 'MASTER' : 'DEPUTY';
  if (password.length < MIN_PASSWORD_LENGTH) {
    return res.status(400).json({ error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` });
  }

  const existing = await getUserByEmail(email);
  if (existing) {
    return res.status(409).json({ error: 'An account with this email already exists.' });
  }

  if (targetRole === 'MASTER') {
    // Allowed by design ("unless I explicitly create another one"), but
    // it's a big enough decision to require a deliberate confirmation flag
    // from the UI rather than falling out of a default role selection.
    if (req.body.confirmAdditionalMaster !== true) {
      return res.status(400).json({ error: 'Creating a second Master Admin requires explicit confirmation.' });
    }
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const { rows } = await sql`
    INSERT INTO users (name, email, password_hash, role, must_change_password, created_by)
    VALUES (${name}, ${normalizeEmail(email)}, ${passwordHash}, ${targetRole}, TRUE, ${master.id})
    RETURNING id, name, email, role, status, created_at
  `;

  await logActivity({
    userId: master.id, userName: master.name, userRole: master.role,
    action: targetRole === 'MASTER' ? 'master_created' : 'deputy_created',
    objectType: 'user', objectId: rows[0].email,
  });

  return res.status(201).json({ user: rows[0] });
}

export { MIN_PASSWORD_LENGTH, countMasterAdmins };
