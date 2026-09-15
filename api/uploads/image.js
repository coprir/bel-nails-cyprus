import { put } from '@vercel/blob';
import { requireAuth } from '../_lib/auth.js';
import { withHandler } from '../_lib/http.js';

// Body parsing is disabled so we can stream the raw file straight through
// to Blob storage instead of buffering it in memory or requiring a
// multipart parser. The browser sends the raw file as the request body
// (see admin/js/portfolio.js) with its real content-type header.
export const config = { api: { bodyParser: false } };

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_BYTES = 8 * 1024 * 1024; // 8MB — comfortably under Vercel's request body ceiling

export default withHandler(async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await requireAuth(req, res, ['MASTER', 'DEPUTY']);
  if (!session) return;

  const contentType = req.headers['content-type'] || '';
  if (!ALLOWED_TYPES.has(contentType)) {
    return res.status(400).json({ error: 'Only JPEG, PNG or WebP images are supported.' });
  }

  const contentLength = Number(req.headers['content-length'] || 0);
  if (contentLength > MAX_BYTES) {
    return res.status(413).json({ error: 'Image is too large — please use a file under 8MB.' });
  }

  const rawName = String(req.query.filename || 'design').replace(/[^a-zA-Z0-9._-]/g, '-');
  const ext = contentType === 'image/png' ? 'png' : contentType === 'image/webp' ? 'webp' : 'jpg';
  const pathname = `portfolio/${Date.now()}-${session.user.id.slice(0, 8)}-${rawName}.${ext}`;

  try {
    const blob = await put(pathname, req, {
      access: 'public',
      contentType,
      addRandomSuffix: true,
    });
    return res.status(200).json({ url: blob.url });
  } catch (err) {
    console.error('Blob upload failed:', err);
    return res.status(502).json({ error: 'Image storage is not configured yet. See README.md → "Enable Vercel Blob".' });
  }
});
