import { getSessionUser } from '../_lib/auth.js';
import { withHandler } from '../_lib/http.js';

// Returns the currently authenticated admin user, or 401. This is what the
// admin frontend calls on every page load to decide whether to redirect to
// /admin/login.html and which role's UI to render — but it is never the
// source of truth for what an action is allowed to do; every mutating
// endpoint re-checks the role itself server-side.
export default withHandler(async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getSessionUser(req);
  if (!session) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const { user } = session;
  return res.status(200).json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      mustChangePassword: user.must_change_password,
      twoFactorEnabled: user.two_factor_enabled,
      lastLogin: user.last_login,
    },
  });
});
