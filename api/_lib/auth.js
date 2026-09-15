// Session + authorization helpers shared by every protected API route.
//
// Session model: a random 256-bit token is set in an httpOnly cookie. Only
// a SHA-256 hash of that token is ever stored server-side (in `sessions`),
// the same way a password reset token would be handled — so a database
// leak alone can't be used to forge a session. The cookie never contains
// the user's identity or role; those are always looked up server-side on
// every request, which is what makes "a Deputy can't just edit the JWT to
// become Master" true here (there is no JWT to edit).
import crypto from 'node:crypto';
import { parse as parseCookie, serialize as serializeCookie } from 'cookie';
import { sql, getUserById } from './db.js';

const COOKIE_NAME = 'bn_admin_session';
const SHORT_SESSION_MS = 8 * 60 * 60 * 1000;       // 8 hours (no "remember me")
const LONG_SESSION_MS = 30 * 24 * 60 * 60 * 1000;  // 30 days ("remember me")
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes

function randomToken() {
  return crypto.randomBytes(32).toString('hex');
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function isHttps(req) {
  // Vercel terminates TLS in front of the function; `vercel dev` runs
  // plain HTTP locally, where a Secure cookie would silently not be set
  // by the browser at all — so only require Secure when we're actually
  // being served over HTTPS.
  return (req.headers['x-forwarded-proto'] || '').includes('https');
}

export async function createSession(req, userId, { rememberMe = false, ip = null, userAgent = null } = {}) {
  const token = randomToken();
  const tokenHash = hashToken(token);
  const ttl = rememberMe ? LONG_SESSION_MS : SHORT_SESSION_MS;
  const expiresAt = new Date(Date.now() + ttl);

  await sql`
    INSERT INTO sessions (user_id, token_hash, ip, user_agent, expires_at)
    VALUES (${userId}, ${tokenHash}, ${ip}, ${userAgent}, ${expiresAt.toISOString()})
  `;

  return serializeCookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: isHttps(req),
    sameSite: 'lax',
    path: '/',
    maxAge: Math.floor(ttl / 1000),
  });
}

export function clearSessionCookie(req) {
  return serializeCookie(COOKIE_NAME, '', {
    httpOnly: true,
    secure: isHttps(req),
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}

function readToken(req) {
  const header = req.headers.cookie;
  if (!header) return null;
  const parsed = parseCookie(header);
  return parsed[COOKIE_NAME] || null;
}

/** Resolves the current request's session + user, or null if not logged in,
 *  the session expired, or the account was disabled after login. */
export async function getSessionUser(req) {
  const token = readToken(req);
  if (!token) return null;

  const tokenHash = hashToken(token);
  const { rows } = await sql`
    SELECT s.id AS session_id, s.expires_at, u.*
    FROM sessions s
    JOIN users u ON u.id = s.user_id
    WHERE s.token_hash = ${tokenHash}
    LIMIT 1
  `;
  if (!rows.length) return null;

  const row = rows[0];
  if (new Date(row.expires_at) <= new Date()) {
    await sql`DELETE FROM sessions WHERE id = ${row.session_id}`;
    return null;
  }
  if (row.status !== 'active') return null;

  sql`UPDATE sessions SET last_seen_at = now() WHERE id = ${row.session_id}`.catch(() => {});

  const { session_id, expires_at, password_hash, ...user } = row;
  return { user, sessionId: session_id };
}

/** Call at the top of a protected handler. Sends 401/403 and returns null
 *  itself when access should be denied — callers should `return` when this
 *  returns null. This is the ONLY gate that matters: the frontend hides
 *  nav links for UX, but every route re-checks role here regardless of
 *  what the client sent. */
export async function requireAuth(req, res, allowedRoles = null) {
  const session = await getSessionUser(req);
  if (!session) {
    res.status(401).json({ error: 'Not authenticated' });
    return null;
  }
  if (allowedRoles && !allowedRoles.includes(session.user.role)) {
    res.status(403).json({ error: 'Forbidden' });
    return null;
  }
  return session;
}

export function isLocked(user) {
  return Boolean(user.locked_until && new Date(user.locked_until) > new Date());
}

export async function registerFailedLogin(user) {
  const attempts = user.failed_login_attempts + 1;
  if (attempts >= MAX_FAILED_ATTEMPTS) {
    const lockedUntil = new Date(Date.now() + LOCKOUT_MS);
    await sql`UPDATE users SET failed_login_attempts = 0, locked_until = ${lockedUntil.toISOString()} WHERE id = ${user.id}`;
    return { locked: true, lockedUntil };
  }
  await sql`UPDATE users SET failed_login_attempts = ${attempts} WHERE id = ${user.id}`;
  return { locked: false, remaining: MAX_FAILED_ATTEMPTS - attempts };
}

export async function registerSuccessfulLogin(user) {
  await sql`
    UPDATE users
    SET failed_login_attempts = 0, locked_until = NULL, last_login = now()
    WHERE id = ${user.id}
  `;
}

export function getClientIp(req) {
  const fwd = req.headers['x-forwarded-for'];
  if (typeof fwd === 'string' && fwd.length) return fwd.split(',')[0].trim();
  return req.socket && req.socket.remoteAddress || null;
}

export { COOKIE_NAME };
