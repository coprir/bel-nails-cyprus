import { sql, getSetting, logActivity } from '../_lib/db.js';
import { requireAuth } from '../_lib/auth.js';
import { withHandler } from '../_lib/http.js';

const ARRAY_FIELDS = new Set(['style', 'color']);
const EDITABLE_FIELDS = [
  'title', 'style', 'shape', 'length', 'finish', 'color', 'art_style',
  'recommended_service', 'price_label', 'image_url', 'alt_text',
  'featured', 'seasonal', 'trending',
];

export default withHandler(async function handler(req, res) {
  if (req.method === 'GET') return handleList(req, res);
  if (req.method === 'POST') return handleCreate(req, res);
  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({ error: 'Method not allowed' });
});

async function handleList(req, res) {
  const session = await requireAuth(req, res, ['MASTER', 'DEPUTY']);
  if (!session) return;

  const { status, source, q } = req.query || {};
  const conditions = [];
  const params = [];

  if (status) { params.push(status); conditions.push(`status = $${params.length}`); }
  if (source) { params.push(source); conditions.push(`source = $${params.length}`); }
  if (q) { params.push(`%${q}%`); conditions.push(`title ILIKE $${params.length}`); }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const { rows } = await sql.query(
    `SELECT p.*, u.name AS created_by_name, a.name AS approved_by_name
     FROM portfolio_items p
     LEFT JOIN users u ON u.id = p.created_by
     LEFT JOIN users a ON a.id = p.approved_by
     ${where}
     ORDER BY p.created_at DESC
     LIMIT 200`,
    params
  );

  return res.status(200).json({ items: rows });
}

async function handleCreate(req, res) {
  const session = await requireAuth(req, res, ['MASTER', 'DEPUTY']);
  if (!session) return;
  const { user } = session;

  const body = req.body || {};
  if (!body.title || !String(body.title).trim()) {
    return res.status(400).json({ error: 'Design name is required.' });
  }

  const source = body.source === 'instagram' ? 'instagram' : 'manual';
  if (source === 'instagram' && !body.instagramUrl) {
    return res.status(400).json({ error: 'An Instagram post URL is required for an Instagram-sourced design.' });
  }

  const status = await resolveInitialStatus(user, body.action);

  let row;
  try {
    const { rows } = await sql`
      INSERT INTO portfolio_items (
        title, style, shape, length, finish, color, art_style,
        recommended_service, price_label, image_url, alt_text,
        source, instagram_url, instagram_media_id, instagram_caption, instagram_posted_at,
        featured, seasonal, trending, status, created_by,
        approved_by, approved_at
      ) VALUES (
        ${body.title}, ${toArray(body.style)}, ${body.shape || null}, ${body.length || null},
        ${body.finish || null}, ${toArray(body.color)}, ${body.artStyle || null},
        ${body.recommendedService || null}, ${body.priceLabel || null}, ${body.imageUrl || null}, ${body.altText || null},
        ${source}, ${body.instagramUrl || null}, ${body.instagramMediaId || null}, ${body.instagramCaption || null},
        ${body.instagramPostedAt || null}, ${Boolean(body.featured)}, ${Boolean(body.seasonal)}, ${Boolean(body.trending)},
        ${status}, ${user.id},
        ${status === 'published' && user.role === 'MASTER' ? user.id : null},
        ${status === 'published' && user.role === 'MASTER' ? new Date().toISOString() : null}
      )
      RETURNING *
    `;
    row = rows[0];
  } catch (err) {
    if (String(err.message || '').includes('portfolio_items_instagram_media_id_key')) {
      return res.status(409).json({ error: 'This Instagram post has already been imported.' });
    }
    throw err;
  }

  await logActivity({
    userId: user.id,
    userName: user.name,
    userRole: user.role,
    action: source === 'instagram' ? 'instagram_post_imported' : 'design_created',
    objectType: 'portfolio_item',
    objectId: `BN-${row.reference_number}`,
    meta: { status },
  });

  return res.status(201).json({ item: row });
}

async function resolveInitialStatus(user, action) {
  if (action === 'draft' || !action) return 'draft';

  // Master never needs approval from anyone.
  if (user.role === 'MASTER') return 'published';

  // Deputy: whether "submit" becomes live immediately or waits for Master
  // approval is entirely controlled by the Master's setting — a Deputy
  // cannot self-approve by passing a different `action` value.
  const approvalRequired = await getSetting('deputy_content_approval', true);
  return approvalRequired ? 'pending_approval' : 'published';
}

function toArray(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string' && value.trim()) return value.split(',').map((v) => v.trim()).filter(Boolean);
  return [];
}

export { EDITABLE_FIELDS, ARRAY_FIELDS };
