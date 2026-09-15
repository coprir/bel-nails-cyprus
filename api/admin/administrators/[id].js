import bcrypt from 'bcryptjs';
import { sql, getUserById, countMasterAdmins, deleteAllUserSessions, logActivity } from '../../_lib/db.js';
import { requireAuth } from '../../_lib/auth.js';
import { withHandler } from '../../_lib/http.js';

const MIN_PASSWORD_LENGTH = 10;

export default withHandler(async function handler(req, res) {
  const { id } = req.query;
  if (req.method === 'PATCH') return handlePatch(req, res, id);
  if (req.method === 'DELETE') return handleDelete(req, res, id);
  res.setHeader('Allow', 'PATCH, DELETE');
  return res.status(405).json({ error: 'Method not allowed' });
});

async function guardTarget(master, target, { forDeletionOrDisable = false } = {}) {
  if (!target) return { error: 'Administrator not found.', status: 404 };
  if (target.id === master.id && forDeletionOrDisable) {
    return { error: 'You cannot disable or delete your own account.', status: 400 };
  }
  if (forDeletionOrDisable && target.role === 'MASTER') {
    const masters = await countMasterAdmins();
    if (masters <= 1) return { error: 'You cannot remove the only remaining Master Admin.', status: 400 };
  }
  return null;
}

async function handlePatch(req, res, id) {
  const session = await requireAuth(req, res, ['MASTER']);
  if (!session) return;
  const { user: master } = session;

  const target = await getUserById(id);
  const { action, name, newPassword } = req.body || {};

  const log = (a, meta) => logActivity({ userId: master.id, userName: master.name, userRole: master.role, action: a, objectType: 'user', objectId: target?.email, meta });

  if (action === 'disable') {
    const guard = await guardTarget(master, target, { forDeletionOrDisable: true });
    if (guard) return res.status(guard.status).json({ error: guard.error });
    await sql`UPDATE users SET status = 'disabled', updated_at = now() WHERE id = ${id}`;
    await deleteAllUserSessions(id);
    await log('deputy_disabled');
    return res.status(200).json({ ok: true });
  }

  if (action === 'enable') {
    if (!target) return res.status(404).json({ error: 'Administrator not found.' });
    await sql`UPDATE users SET status = 'active', updated_at = now() WHERE id = ${id}`;
    await log('deputy_enabled');
    return res.status(200).json({ ok: true });
  }

  if (action === 'reset_password') {
    if (!target) return res.status(404).json({ error: 'Administrator not found.' });
    if (!newPassword || newPassword.length < MIN_PASSWORD_LENGTH) {
      return res.status(400).json({ error: `New password must be at least ${MIN_PASSWORD_LENGTH} characters.` });
    }
    const hash = await bcrypt.hash(newPassword, 12);
    await sql`UPDATE users SET password_hash = ${hash}, must_change_password = TRUE, failed_login_attempts = 0, locked_until = NULL, updated_at = now() WHERE id = ${id}`;
    await deleteAllUserSessions(id); // force re-login with the new password everywhere
    await log('deputy_password_reset');
    return res.status(200).json({ ok: true }); // the new password is never echoed back
  }

  if (action === 'revoke_sessions') {
    if (!target) return res.status(404).json({ error: 'Administrator not found.' });
    await deleteAllUserSessions(id);
    await log('sessions_revoked');
    return res.status(200).json({ ok: true });
  }

  if (action === 'edit') {
    if (!target) return res.status(404).json({ error: 'Administrator not found.' });
    if (!name || !String(name).trim()) return res.status(400).json({ error: 'Name is required.' });
    await sql`UPDATE users SET name = ${name}, updated_at = now() WHERE id = ${id}`;
    await log('deputy_edited');
    return res.status(200).json({ ok: true });
  }

  return res.status(400).json({ error: 'Unknown action.' });
}

async function handleDelete(req, res, id) {
  const session = await requireAuth(req, res, ['MASTER']);
  if (!session) return;
  const { user: master } = session;

  if (req.body?.confirm !== true) {
    return res.status(400).json({ error: 'Deletion requires explicit confirmation.' });
  }

  const target = await getUserById(id);
  const guard = await guardTarget(master, target, { forDeletionOrDisable: true });
  if (guard) return res.status(guard.status).json({ error: guard.error });

  await sql`DELETE FROM users WHERE id = ${id}`; // sessions cascade-delete via FK
  await logActivity({ userId: master.id, userName: master.name, userRole: master.role, action: 'deputy_deleted', objectType: 'user', objectId: target.email });

  return res.status(200).json({ ok: true });
}
