import { getSetting, setSetting, logActivity } from '../_lib/db.js';
import { requireAuth } from '../_lib/auth.js';
import { withHandler } from '../_lib/http.js';

// Only a small, safe subset of settings is ever exposed here. Anything
// touching payments, database/deployment config, or Instagram app secrets
// is deliberately NOT modelled as a toggle in this table — those live only
// in Vercel environment variables, which no admin UI can read or change.
const KNOWN_KEYS = ['deputy_content_approval'];

export default withHandler(async function handler(req, res) {
  if (req.method === 'GET') return handleGet(req, res);
  if (req.method === 'PATCH') return handlePatch(req, res);
  res.setHeader('Allow', 'GET, PATCH');
  return res.status(405).json({ error: 'Method not allowed' });
});

async function handleGet(req, res) {
  const session = await requireAuth(req, res, ['MASTER', 'DEPUTY']);
  if (!session) return;

  const approvalRequired = await getSetting('deputy_content_approval', true);
  return res.status(200).json({ settings: { deputyContentApproval: approvalRequired } });
}

async function handlePatch(req, res) {
  const session = await requireAuth(req, res, ['MASTER']); // Master-only to change
  if (!session) return;
  const { user } = session;

  const { deputyContentApproval } = req.body || {};
  if (typeof deputyContentApproval !== 'boolean') {
    return res.status(400).json({ error: 'deputyContentApproval must be true or false.' });
  }

  await setSetting('deputy_content_approval', deputyContentApproval, user.id);
  await logActivity({
    userId: user.id, userName: user.name, userRole: user.role,
    action: 'setting_changed', objectType: 'setting', objectId: 'deputy_content_approval',
    meta: { value: deputyContentApproval },
  });

  return res.status(200).json({ ok: true });
}
