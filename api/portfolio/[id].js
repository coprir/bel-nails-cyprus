import { sql, getSetting, logActivity } from '../_lib/db.js';
import { requireAuth } from '../_lib/auth.js';
import { withHandler } from '../_lib/http.js';

const EDITABLE_FIELDS = [
  'title', 'style', 'shape', 'length', 'finish', 'color', 'art_style',
  'recommended_service', 'price_label', 'image_url', 'alt_text',
  'featured', 'seasonal', 'trending',
];
const FIELD_MAP = {
  title: 'title', style: 'style', shape: 'shape', length: 'length', finish: 'finish',
  color: 'color', artStyle: 'art_style', recommendedService: 'recommended_service',
  priceLabel: 'price_label', imageUrl: 'image_url', altText: 'alt_text',
  featured: 'featured', seasonal: 'seasonal', trending: 'trending',
};

export default withHandler(async function handler(req, res) {
  const { id } = req.query;

  if (req.method === 'GET') return handleGet(req, res, id);
  if (req.method === 'PATCH') return handlePatch(req, res, id);
  if (req.method === 'DELETE') return handleDelete(req, res, id);
  res.setHeader('Allow', 'GET, PATCH, DELETE');
  return res.status(405).json({ error: 'Method not allowed' });
});

async function fetchItem(id) {
  const { rows } = await sql`SELECT * FROM portfolio_items WHERE id = ${id} LIMIT 1`;
  return rows[0] || null;
}

async function handleGet(req, res, id) {
  const session = await requireAuth(req, res, ['MASTER', 'DEPUTY']);
  if (!session) return;
  const item = await fetchItem(id);
  if (!item) return res.status(404).json({ error: 'Not found' });
  return res.status(200).json({ item });
}

async function handlePatch(req, res, id) {
  const session = await requireAuth(req, res, ['MASTER', 'DEPUTY']);
  if (!session) return;
  const { user } = session;

  const item = await fetchItem(id);
  if (!item) return res.status(404).json({ error: 'Not found' });

  const isOwner = item.created_by === user.id;
  const isMaster = user.role === 'MASTER';
  const body = req.body || {};

  // --- Field edits -------------------------------------------------------
  const hasFieldEdits = Object.keys(FIELD_MAP).some((k) => Object.prototype.hasOwnProperty.call(body, k));
  if (hasFieldEdits) {
    const contentLocked = item.status === 'published';
    if (!isMaster && (!isOwner || contentLocked)) {
      return res.status(403).json({ error: contentLocked ? 'Only the Master can edit a published design.' : 'You can only edit your own designs.' });
    }
    const sets = [];
    const values = [];
    for (const [bodyKey, column] of Object.entries(FIELD_MAP)) {
      if (!Object.prototype.hasOwnProperty.call(body, bodyKey)) continue;
      let value = body[bodyKey];
      if (column === 'style' || column === 'color') value = toArray(value);
      values.push(value);
      sets.push(`${column} = $${values.length}`);
    }
    if (sets.length) {
      values.push(id);
      await sql.query(`UPDATE portfolio_items SET ${sets.join(', ')}, updated_at = now() WHERE id = $${values.length}`, values);
    }
  }

  // --- Status transition ---------------------------------------------------
  const transition = body.transition;
  if (transition) {
    const allowed = await applyTransition({ transition, item, user, isMaster, isOwner, rejectionNote: body.rejectionNote });
    if (allowed.error) return res.status(allowed.status || 403).json({ error: allowed.error });
  }

  const updated = await fetchItem(id);
  return res.status(200).json({ item: updated });
}

async function applyTransition({ transition, item, user, isMaster, isOwner, rejectionNote }) {
  const ref = `BN-${item.reference_number}`;
  const log = (action, meta) => logActivity({ userId: user.id, userName: user.name, userRole: user.role, action, objectType: 'portfolio_item', objectId: ref, meta });

  if (transition === 'approve' || transition === 'reject' || transition === 'request_changes') {
    if (!isMaster) return { error: 'Only the Master can approve or reject designs.', status: 403 };
    if (item.status !== 'pending_approval') return { error: 'This design is not awaiting approval.', status: 400 };

    if (transition === 'approve') {
      await sql`UPDATE portfolio_items SET status = 'published', approved_by = ${user.id}, approved_at = now(), rejection_note = NULL, updated_at = now() WHERE id = ${item.id}`;
      await log('design_approved');
    } else {
      await sql`UPDATE portfolio_items SET status = 'rejected', rejection_note = ${rejectionNote || null}, updated_at = now() WHERE id = ${item.id}`;
      await log('design_rejected');
    }
    return {};
  }

  if (transition === 'submit') {
    if (!isMaster && !isOwner) return { error: 'You can only submit your own designs.', status: 403 };
    if (isMaster) {
      await sql`UPDATE portfolio_items SET status = 'published', approved_by = ${user.id}, approved_at = now(), updated_at = now() WHERE id = ${item.id}`;
      await log('design_published');
    } else {
      const approvalRequired = await getSetting('deputy_content_approval', true);
      const status = approvalRequired ? 'pending_approval' : 'published';
      await sql`UPDATE portfolio_items SET status = ${status}, updated_at = now() WHERE id = ${item.id}`;
      await log(status === 'published' ? 'design_published' : 'design_submitted_for_approval');
    }
    return {};
  }

  if (transition === 'unpublish' || transition === 'draft') {
    if (!isMaster && !isOwner) return { error: 'You can only manage your own designs.', status: 403 };
    await sql`UPDATE portfolio_items SET status = 'draft', updated_at = now() WHERE id = ${item.id}`;
    await log('design_unpublished');
    return {};
  }

  return { error: `Unknown transition "${transition}".`, status: 400 };
}

async function handleDelete(req, res, id) {
  const session = await requireAuth(req, res, ['MASTER']); // deleting is Master-only
  if (!session) return;
  const { user } = session;

  if (req.body?.confirm !== true) {
    return res.status(400).json({ error: 'Deletion requires explicit confirmation.' });
  }

  const item = await fetchItem(id);
  if (!item) return res.status(404).json({ error: 'Not found' });

  await sql`DELETE FROM portfolio_items WHERE id = ${id}`;
  await logActivity({ userId: user.id, userName: user.name, userRole: user.role, action: 'design_deleted', objectType: 'portfolio_item', objectId: `BN-${item.reference_number}` });

  return res.status(200).json({ ok: true });
}

function toArray(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string' && value.trim()) return value.split(',').map((v) => v.trim()).filter(Boolean);
  return [];
}

export { EDITABLE_FIELDS };
