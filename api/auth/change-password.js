import bcrypt from 'bcryptjs';
import { sql, logActivity } from '../_lib/db.js';
import { requireAuth } from '../_lib/auth.js';
import { withHandler } from '../_lib/http.js';

const MIN_LENGTH = 10;

export default withHandler(async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await requireAuth(req, res); // any authenticated role
  if (!session) return;
  const { user, sessionId } = session;

  const { currentPassword, newPassword } = req.body || {};
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current and new password are required.' });
  }
  if (newPassword.length < MIN_LENGTH) {
    return res.status(400).json({ error: `New password must be at least ${MIN_LENGTH} characters.` });
  }
  if (newPassword === currentPassword) {
    return res.status(400).json({ error: 'New password must be different from the current password.' });
  }

  const valid = await bcrypt.compare(currentPassword, user.password_hash);
  if (!valid) {
    await logActivity({ userId: user.id, userName: user.name, userRole: user.role, action: 'password_change_failed', status: 'failed' });
    return res.status(401).json({ error: 'Current password is incorrect.' });
  }

  const newHash = await bcrypt.hash(newPassword, 12);
  await sql`
    UPDATE users
    SET password_hash = ${newHash}, must_change_password = FALSE, updated_at = now()
    WHERE id = ${user.id}
  `;

  // Invalidate every other session for this account — a password change
  // should mean "everywhere else is logged out", not just this device.
  await sql`DELETE FROM sessions WHERE user_id = ${user.id} AND id != ${sessionId}`;

  await logActivity({ userId: user.id, userName: user.name, userRole: user.role, action: 'password_changed', status: 'success' });
  return res.status(200).json({ ok: true });
});
