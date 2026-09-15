import { sql, logActivity } from '../_lib/db.js';
import { requireAuth } from '../_lib/auth.js';
import { withHandler } from '../_lib/http.js';

// Self-service "log out everywhere else" — any authenticated role can call
// this on their OWN account only. Revoking another user's sessions is a
// separate, Master-only action (api/admin/administrators/[id].js).
export default withHandler(async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await requireAuth(req, res);
  if (!session) return;
  const { user, sessionId } = session;

  await sql`DELETE FROM sessions WHERE user_id = ${user.id} AND id != ${sessionId}`;
  await logActivity({ userId: user.id, userName: user.name, userRole: user.role, action: 'self_sessions_revoked' });

  return res.status(200).json({ ok: true });
});
