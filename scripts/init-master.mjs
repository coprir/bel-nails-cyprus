#!/usr/bin/env node
// One-time Master Admin bootstrap.
//
// This is a LOCAL SCRIPT, not an API route — it is never deployed and there
// is no public endpoint that does what this does. Run it once, from your
// own machine, after pulling real environment variables from Vercel:
//
//   vercel env pull .env.development.local
//   npm run init-master
//
// It is idempotent: if a Master Admin already exists, it does nothing and
// exits. To add a second Master later, use the Administrators page in the
// dashboard while logged in as the existing Master — not this script.
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { sql } from '../api/_lib/db.js';

const PLACEHOLDER_VALUES = new Set([
  'YOUR_PRIVATE_ADMIN_EMAIL',
  'GENERATE_A_STRONG_PASSWORD',
  '',
  undefined,
]);
const MIN_PASSWORD_LENGTH = 12;

async function main() {
  const email = process.env.MASTER_ADMIN_EMAIL;
  const password = process.env.MASTER_ADMIN_PASSWORD;
  const name = process.env.MASTER_ADMIN_NAME || 'Master Admin';

  if (PLACEHOLDER_VALUES.has(email) || PLACEHOLDER_VALUES.has(password)) {
    fail(
      'MASTER_ADMIN_EMAIL / MASTER_ADMIN_PASSWORD are still placeholder values.\n' +
      '  Set real values first — locally in .env.development.local, and in your\n' +
      '  Vercel project\'s Environment Variables for production — then re-run this script.'
    );
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    fail(`MASTER_ADMIN_EMAIL ("${email}") doesn't look like a valid email address.`);
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    fail(`MASTER_ADMIN_PASSWORD must be at least ${MIN_PASSWORD_LENGTH} characters.`);
  }

  const { rows: existingMasters } = await sql`SELECT id, email FROM users WHERE role = 'MASTER' LIMIT 1`;
  if (existingMasters.length) {
    console.log(`A Master Admin already exists (${existingMasters[0].email}). Nothing to do.`);
    console.log('To add a second Master, log in as the existing Master and use the Administrators page.');
    process.exit(0);
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const { rows } = await sql`
    INSERT INTO users (name, email, password_hash, role, status, must_change_password)
    VALUES (${name}, ${email.toLowerCase()}, ${passwordHash}, 'MASTER', 'active', TRUE)
    RETURNING id, email
  `;

  console.log(`✓ Master Admin created: ${rows[0].email}`);
  console.log('  It will be required to change its password on first login.');
  console.log('  You can now log in at /admin/login.html with the credentials from your .env file.');
  process.exit(0);
}

function fail(message) {
  console.error('\n✗ ' + message + '\n');
  process.exit(1);
}

main().catch((err) => {
  console.error('\n✗ init-master failed:', err.message || err);
  console.error('  Make sure POSTGRES_URL is set (run `vercel env pull .env.development.local` first)');
  console.error('  and that db/schema.sql has been applied to the database.');
  process.exit(1);
});
