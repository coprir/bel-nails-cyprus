-- Bel Nails Cyprus — admin backend schema (Postgres / Vercel Postgres)
-- Run once against your database, e.g.:
--   vercel env pull .env.development.local
--   psql "$POSTGRES_URL" -f db/schema.sql
-- (or paste this file into the Vercel Postgres "Query" tab in your dashboard)

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================================
-- USERS  (admin accounts only — MASTER and DEPUTY. Public site has no accounts.)
-- Email case-insensitivity is enforced with a lower(email) unique index
-- rather than CITEXT, since CITEXT isn't available on every managed
-- Postgres provider. Always lower-case the email in application code
-- before inserting or looking one up (see api/_lib/db.js).
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                 TEXT NOT NULL,
  email                TEXT NOT NULL,
  password_hash        TEXT NOT NULL,
  role                 TEXT NOT NULL CHECK (role IN ('MASTER', 'DEPUTY')),
  status               TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disabled')),
  must_change_password BOOLEAN NOT NULL DEFAULT FALSE,
  failed_login_attempts INTEGER NOT NULL DEFAULT 0,
  locked_until         TIMESTAMPTZ,
  last_login           TIMESTAMPTZ,
  two_factor_enabled   BOOLEAN NOT NULL DEFAULT FALSE, -- reserved: TOTP not yet implemented (Phase 3)
  created_by           UUID REFERENCES users(id),
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower_idx ON users (lower(email));

-- Only one MASTER should normally exist. Enforced in application logic
-- (see api/admin/administrators.js) rather than a hard DB constraint,
-- because the brief allows the Master to explicitly create another
-- Master later.

-- ============================================================================
-- SESSIONS  (server-side session store — only a hash of the token is stored)
-- ============================================================================
CREATE TABLE IF NOT EXISTS sessions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash    TEXT UNIQUE NOT NULL,
  ip            TEXT,
  user_agent    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at    TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON sessions (user_id);
CREATE INDEX IF NOT EXISTS sessions_expires_at_idx ON sessions (expires_at);

-- ============================================================================
-- SETTINGS  (simple key/value store for Master-controlled toggles)
-- ============================================================================
CREATE TABLE IF NOT EXISTS settings (
  key         TEXT PRIMARY KEY,
  value       JSONB NOT NULL,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by  UUID REFERENCES users(id)
);

INSERT INTO settings (key, value)
VALUES ('deputy_content_approval', 'true'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- ============================================================================
-- PORTFOLIO ITEMS  (the public Lookbook — also holds Instagram-sourced fields
-- directly, rather than a separate imports table, since every imported post
-- becomes exactly one portfolio design)
-- ============================================================================
CREATE TABLE IF NOT EXISTS portfolio_items (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_number   SERIAL,                      -- powers the "BN / 0XX" display number
  title              TEXT NOT NULL,
  style              TEXT[] NOT NULL DEFAULT '{}', -- minimal | glam | classic | bold | cute | luxury
  shape              TEXT,                         -- almond | oval | square | squoval | coffin | stiletto
  length             TEXT,                         -- short | medium | long | extra-long
  finish             TEXT,                         -- glossy | matte | chrome | french | glitter | pearl | metallic | cat-eye
  color              TEXT[] NOT NULL DEFAULT '{}', -- nude | pink | red | black | brown | blue | purple | green | metallic
  art_style          TEXT,                         -- french | minimal | floral | abstract | chrome | rhinestones | 3d | animal-print | line-art | no-art
  recommended_service TEXT,                        -- Acrylic | Builder Gel | Gel-X
  price_label        TEXT,

  image_url          TEXT,
  alt_text           TEXT,

  source             TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'instagram')),
  instagram_url      TEXT,
  instagram_media_id TEXT UNIQUE,                  -- prevents duplicate imports
  instagram_caption  TEXT,
  instagram_posted_at TIMESTAMPTZ,

  featured           BOOLEAN NOT NULL DEFAULT FALSE,
  seasonal           BOOLEAN NOT NULL DEFAULT FALSE,
  trending           BOOLEAN NOT NULL DEFAULT FALSE,

  status             TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending_approval', 'published', 'rejected')),
  rejection_note     TEXT,

  created_by         UUID REFERENCES users(id),
  approved_by        UUID REFERENCES users(id),
  approved_at        TIMESTAMPTZ,

  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS portfolio_items_status_idx ON portfolio_items (status);
CREATE INDEX IF NOT EXISTS portfolio_items_created_by_idx ON portfolio_items (created_by);

-- ============================================================================
-- ACTIVITY LOG  (Master-only view; append-only — no delete endpoint exists,
-- and Deputy accounts are never granted access to this table)
-- ============================================================================
CREATE TABLE IF NOT EXISTS activity_log (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES users(id),
  user_name    TEXT,       -- denormalised snapshot so history survives account changes
  user_role    TEXT,
  action       TEXT NOT NULL,
  object_type  TEXT,
  object_id    TEXT,
  status       TEXT NOT NULL DEFAULT 'success' CHECK (status IN ('success', 'failed')),
  meta         JSONB,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS activity_log_created_at_idx ON activity_log (created_at DESC);
