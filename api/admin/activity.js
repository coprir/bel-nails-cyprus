import { sql } from '../_lib/db.js';
import { requireAuth } from '../_lib/auth.js';
import { withHandler } from '../_lib/http.js';

// Master-only, read-only. There is deliberately no DELETE handler for this
// resource anywhere in the API — the activity log is append-only and
// no role, including Master, gets an endpoint to erase it.
export default withHandler(async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await requireAuth(req, res, ['MASTER']);
  if (!session) return;

  const { rows } = await sql`
    SELECT id, user_name, user_role, action, object_type, object_id, status, meta, created_at
    FROM activity_log
    ORDER BY created_at DESC
    LIMIT 200
  `;

  return res.status(200).json({ events: rows });
});
