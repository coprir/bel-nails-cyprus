import { getSessionUser, clearSessionCookie } from '../_lib/auth.js';
import { deleteSession, logActivity } from '../_lib/db.js';
import { withHandler } from '../_lib/http.js';

export default withHandler(async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getSessionUser(req);
  if (session) {
    await deleteSession(session.sessionId);
    await logActivity({ userId: session.user.id, userName: session.user.name, userRole: session.user.role, action: 'admin_logout', status: 'success' });
  }

  res.setHeader('Set-Cookie', clearSessionCookie(req));
  return res.status(200).json({ ok: true });
});
