import bcrypt from 'bcryptjs';
import { sql, getUserByEmail, normalizeEmail, logActivity } from '../_lib/db.js';
import { createSession, isLocked, registerFailedLogin, registerSuccessfulLogin, getClientIp } from '../_lib/auth.js';
import { withHandler } from '../_lib/http.js';

const GENERIC_ERROR = 'Invalid email or password.';
const IP_WINDOW_MS = 5 * 60 * 1000;
const IP_MAX_ATTEMPTS = 20; // coarse anti-brute-force throttle, independent of per-account lockout

export default withHandler(async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const ip = getClientIp(req);
  const userAgent = req.headers['user-agent'] || null;

  // Coarse per-IP throttle, independent of the per-account lockout below.
  const since = new Date(Date.now() - IP_WINDOW_MS).toISOString();
  const { rows: ipRows } = await sql`
    SELECT count(*)::int AS n FROM activity_log
    WHERE action = 'admin_login_failed' AND meta->>'ip' = ${ip} AND created_at > ${since}
  `;
  if (ipRows[0].n >= IP_MAX_ATTEMPTS) {
    return res.status(429).json({ error: 'Too many attempts from this network. Please try again later.' });
  }

  const { email, password, rememberMe } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const user = await getUserByEmail(email);

  if (!user) {
    await logActivity({ userId: null, userName: normalizeEmail(email), userRole: null, action: 'admin_login_failed', status: 'failed', meta: { ip, reason: 'no_such_account' } });
    return res.status(401).json({ error: GENERIC_ERROR });
  }

  if (user.status !== 'active') {
    await logActivity({ userId: user.id, userName: user.name, userRole: user.role, action: 'admin_login_failed', status: 'failed', meta: { ip, reason: 'disabled' } });
    return res.status(403).json({ error: 'This account has been disabled. Contact the Master Admin.' });
  }

  if (isLocked(user)) {
    await logActivity({ userId: user.id, userName: user.name, userRole: user.role, action: 'admin_login_failed', status: 'failed', meta: { ip, reason: 'locked' } });
    const minutes = Math.ceil((new Date(user.locked_until) - new Date()) / 60000);
    return res.status(429).json({ error: `Too many failed attempts. Try again in ${minutes} minute${minutes === 1 ? '' : 's'}.` });
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    const result = await registerFailedLogin(user);
    await logActivity({ userId: user.id, userName: user.name, userRole: user.role, action: 'admin_login_failed', status: 'failed', meta: { ip, locked: result.locked } });
    if (result.locked) {
      return res.status(429).json({ error: 'Too many failed attempts. Your account is now locked for 15 minutes.' });
    }
    return res.status(401).json({ error: GENERIC_ERROR });
  }

  await registerSuccessfulLogin(user);
  const setCookie = await createSession(req, user.id, { rememberMe: Boolean(rememberMe), ip, userAgent });
  await logActivity({ userId: user.id, userName: user.name, userRole: user.role, action: 'admin_login', status: 'success', meta: { ip } });

  res.setHeader('Set-Cookie', setCookie);
  return res.status(200).json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      mustChangePassword: user.must_change_password,
    },
  });
});
