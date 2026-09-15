# Bel Nails Cyprus — website

A multi-page, no-build website for Bel Nails (Nicosia, Cyprus). Plain HTML/CSS/JS —
no framework, no build step, no templating. Open `index.html` in a browser or deploy
the folder as-is.

## Design system

A "futuristic luxury editorial" identity: deep near-black surfaces, soft ivory
counter-surfaces, Bodoni Moda (dramatic high-contrast serif, oversized display type)
+ Inter (body/UI), and a restrained champagne/deepened-rose accent palette — see the
tokens at the top of `css/styles.css`. Every interior page opens with a dark
`.page-hero` moment (mirroring the homepage hero) so the whole site reads as one
brand, per the design tokens' own comment block. Shared, page-agnostic pieces built
entirely in `js/main.js` (no per-page markup needed): a custom cursor (desktop/fine
-pointer only — see `initCursor()`), a short once-per-session loading screen on the
home page (`initLoader()`), and the mobile bottom nav / page-hero CSS components.

## Pages

Each major section is its own static HTML file, sharing `css/styles.css` and
`js/main.js`. There's no templating engine, so the header, mobile menu, footer,
mobile bottom nav, icon sprite and saved-looks drawer are duplicated at the top/bottom
of every file — if you change any of that shared chrome, change it in every page.

| File                  | Page                              |
|------------------------|-----------------------------------|
| `index.html`           | Home (hero + brand statement)     |
| `services.html`        | Services (editorial numbered rows)|
| `portfolio.html`       | The Lookbook                      |
| `style-finder.html`    | Design Your Set (the configurator)|
| `why-bel-nails.html`   | Why Bel Nails                     |
| `about.html`           | Studio (the Artist + the Process) |
| `reviews.html`         | Reviews                           |
| `try-on.html`          | Try Your Look                     |
| `booking.html`         | Booking                           |
| `instagram.html`       | Instagram                         |
| `contact.html`         | Location & Contact                |
| `collection.html`      | Your Collection (saved looks)     |

`portfolio.html` and `style-finder.html` also include the full-screen design viewer
modal, since both render portfolio cards that open it. Every page's icon sprite only
includes the icons that page actually uses, plus a small shared set (menu, close,
heart, camera, Instagram) needed by the header, footer and saved-looks drawer that
appear everywhere — if you add an icon to a page's content, add its `<symbol>` to
that page's sprite too. The mobile bottom nav's 5 icons are inlined directly in each
page's markup rather than via the sprite, so it never depends on a page's own symbol set.

### What was intentionally simplified from the original brief
A few asks were scoped down to keep everything honest and genuinely functional
rather than decorative-only:
- **No scroll-hijacked horizontal "runway" gallery** — a nice effect, but fragile and
  motion-heavy for a feature the portfolio can't yet populate with real photos.
- **No fake multi-step booking wizard with time slots** — there's no real booking
  backend, so `booking.html` stays an honest "request" form (see below) rather than
  pretending to check availability.
- **No "YOU'RE BOOKED" confirmation** — submitting only opens a pre-filled email in
  the visitor's own email app (see `revealBookingSent()` in `js/main.js`); the reveal
  screen says exactly that, plus an optional, honestly-labelled "Add to Calendar"
  link (Google Calendar) for the *requested*, unconfirmed date.
- **No separate Artist/Process pages** — folded into `about.html` as sections, since
  there isn't enough real content yet to justify their own URLs.

### How state survives page-to-page navigation
- **Saved looks / wishlist** — `localStorage`, so the heart icon and its count in the
  header stay in sync across every page.
- **"Book This Look" / "Book / Enquire" handoff** — `sessionStorage`. Clicking one of
  these on any page stores the look, then navigates to `booking.html`, which reads it
  back out on load to show the attached-look card and pre-fill the service + message.
  See `handoffAndBook()` and `applyHandoffToForm()` in `js/main.js`.
- Every page-specific function in `js/main.js` (portfolio filters, the quiz, the
  try-on app, the booking form) guards itself on the DOM elements it needs, so the
  same script loads harmlessly on pages that don't use that feature.

## What's real vs. what's a placeholder

Everything on this site falls into one of three buckets. This matters because the
brief for this project was explicit: **never invent business information.**

### 1. Verified (confirmed from [@belnails.cy](https://www.instagram.com/belnails.cy/) on Instagram, 2026-09-14)
- Business name: **Bel Nails**
- Handle: **@belnails.cy**
- Location: **Nicosia, Cyprus**
- Specialities: **Acrylic, Builder Gel, Gel-X**
- Status: **"Appointments opening soon"** — the studio has not opened bookings yet
- Brand logo colours: black + deep rose/magenta (the site's palette is derived from this)

### 2. Needs the owner's input
Marked in the UI with dashed borders, italic grey text, or `[Add ...]`-style copy.
Search the codebase for `PLACEHOLDER` to find every instance. This includes:
- Exact studio address, opening hours, phone number, WhatsApp number, business email
- Pricing and appointment durations for each service
- Owner name, photo, bio, years of experience, certifications
- Client reviews / testimonials
- Google Maps embed / link

### 3. Fully-built placeholder data (the interactive features)
The nail-style configurator ("Find Your Style"), the portfolio grid, the wishlist,
the full-screen viewer and "Inspire Me" are **fully functional** — they just have no
photography to show yet, because none is publicly available. They all read from one
array:

```js
// js/main.js
var portfolioItems = [];
```

Add real, tagged photos and every feature lights up automatically — filtering,
the style quiz's recommendations, the wishlist, the swipeable viewer. Each item
looks like this:

```js
{
  id: 'design-01',
  src: 'images/portfolio/design-01.jpg',
  alt: 'Short almond nails, glossy nude',
  style: ['minimal', 'classic'],   // minimal | glam | classic | bold | cute | luxury
  shape: 'almond',                 // almond | oval | square | squoval | coffin | stiletto
  length: 'short',                 // short | medium | long | extra-long
  finish: 'glossy',                // glossy | matte | chrome | french | glitter | pearl | metallic | cat-eye
  color: ['nude'],                 // nude | pink | red | black | brown | blue | purple | green | metallic
  artStyle: 'minimal',             // french | minimal | floral | abstract | chrome | rhinestones | 3d | animal-print | line-art | no-art
  service: 'Gel-X',                // Acrylic | Builder Gel | Gel-X
  priceLabel: ''                   // e.g. '€35', once pricing is confirmed
}
```

Put the actual image files in `images/portfolio/` (create the folder) and reference
them by relative path in `src`.

## Before going live — a checklist for the owner

- [ ] Replace every `[Add ...]` / "to be added" placeholder across the pages listed
      above (address in `contact.html`, hours, phone, WhatsApp, email, pricing and
      durations in `services.html`, bio and certifications in `about.html`)
- [ ] Replace the placeholder booking email `hello@belnails.cy` in `js/main.js`
      (search for `PLACEHOLDER: replace with Bel Nails' confirmed booking email`)
      with the real inbox that should receive appointment requests
- [ ] Once a WhatsApp number exists, remove `disabled` from the WhatsApp button in
      `booking.html` and set its `href` to `https://wa.me/<number>`
- [ ] Add real portfolio photography to `portfolioItems` in `js/main.js` (see above)
- [ ] Add a real hero photo (replace the placeholder panel in `index.html`'s
      `.hero-visual` div)
- [ ] Add a founder/owner photo (replace the placeholder panel in `about.html`'s
      `.about-photo` div)
- [ ] Add a Google Maps embed once the exact address is confirmed
      (`.map-placeholder` in `contact.html`)
- [ ] Add the `NailSalon` structured-data `address` and `telephone` fields in the
      `<script type="application/ld+json">` block in `index.html`'s `<head>` once
      confirmed — don't add placeholder values there, search engines will index them
      as real
- [ ] Add an Open Graph image (`og:image`) to each page once there's real photography
- [ ] Replace real client reviews into `reviews.html` as they come in
- [ ] "Try Your Look" is intentionally a "coming soon" camera preview, not a faked
      AR demo — wire up a real AR/virtual try-on provider in `try-on.html` when one
      is chosen

## Structure

```
index.html, services.html, portfolio.html, style-finder.html, why-bel-nails.html,
about.html, reviews.html, try-on.html, booking.html, instagram.html, contact.html
                   one page each — see "Pages" above
css/styles.css     design tokens (colors/type/spacing) + all component styles
js/main.js         portfolio data, quiz logic, filters, wishlist, viewer, booking handoff
admin/             the staff admin panel (Master/Deputy) — see "Admin system" below
api/               Vercel Serverless Functions backing the admin panel
db/schema.sql      Postgres schema for the admin panel
scripts/init-master.mjs   one-time Master Admin bootstrap script (local only)
```

The public site itself (everything above `admin/`) has no build tooling and no
dependencies — Fonts (Playfair Display + Inter) load from Google Fonts, everything
else is self-contained. The admin panel is the one part of this repo with real
dependencies (`package.json`) and a real backend, described below.

## Local preview (public site only)

```bash
python -m http.server 5173
```
then open `http://localhost:5173`. (Opening any page directly as a `file://` URL
also works, but a local server is more representative of production.) This does
**not** serve the `/api` routes — for those, use `vercel dev` as described below.

## Admin system (Master / Deputy)

`/admin` is a separate, password-protected staff panel for managing the portfolio
(including Instagram imports), site settings, and other admin accounts. It's built
as Vercel Serverless Functions (`api/`) backed by Postgres, with real bcrypt password
hashing and server-side session cookies — there is no client-side-only "fake login."
Every role check happens on the server, not just by hiding buttons.

**Roles:**
- **MASTER** — full control: create/disable/delete Deputy (and additional Master)
  accounts, reset their passwords, approve/reject Deputy-submitted designs, change
  the approval-required setting, view the activity log, delete portfolio items.
- **DEPUTY** — manage their own portfolio items (add/edit/import from Instagram,
  submit for publish), view (but not edit) services/settings. Cannot reach any
  Master-only page or endpoint, even by calling the API URL directly.

### One-time setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Provision a Postgres database.** The easiest path is Vercel's own Postgres
   integration (Neon under the hood): in the Vercel dashboard, open this project →
   **Storage** → **Create Database** → Postgres, and connect it to the project.
   This automatically sets a `POSTGRES_URL` env var on the project. (Any other
   Postgres host works too — just set `POSTGRES_URL` or `DATABASE_URL` yourself.)

3. **Provision Vercel Blob** (for portfolio image uploads): **Storage** →
   **Create Database** → Blob, connect it to the project. This sets
   `BLOB_READ_WRITE_TOKEN` automatically.

4. **Pull the real env vars down locally:**
   ```bash
   vercel link
   vercel env pull .env.development.local
   ```

5. **Set the Master Admin bootstrap variables.** Add these in the Vercel project's
   **Environment Variables** settings (Production **and** Preview/Development as
   needed), then re-run `vercel env pull` — or, for local-only testing, add them
   directly to `.env.development.local`:
   ```
   MASTER_ADMIN_EMAIL=<a real email address you control>
   MASTER_ADMIN_PASSWORD=<a real, strong password — 12+ characters>
   MASTER_ADMIN_NAME=<your name>
   ```
   **Never** commit these to git or hardcode them anywhere in the app — `.env*`
   files are already git-ignored. `scripts/init-master.mjs` refuses to run if it
   sees the placeholder values from `.env.example`.

6. **Apply the database schema.** Run the contents of `db/schema.sql` against your
   database once — e.g. via the Vercel/Neon dashboard's SQL editor, or:
   ```bash
   psql "$POSTGRES_URL" -f db/schema.sql
   ```

7. **Create the Master Admin account:**
   ```bash
   npm run init-master
   ```
   This is idempotent — if a Master already exists, it does nothing. It hashes the
   password with bcrypt before storing it; the plaintext password is never written
   to the database, logged, or exposed through any API. The account is created with
   `must_change_password = true`, so the first login forces a password change.

8. **Run it locally:**
   ```bash
   vercel dev
   ```
   then open `http://localhost:3000/admin/login.html` and log in with the
   `MASTER_ADMIN_EMAIL` / `MASTER_ADMIN_PASSWORD` you set. You'll be prompted to
   change the password immediately — do that before using the account for
   anything real, especially if that password ever touched a shared terminal
   or chat log.

If `POSTGRES_URL` isn't set, every `/api/*` route responds with a clean
`{"error": "Something went wrong..."}` (logged server-side as "Database is not
configured") instead of crashing — so the public site and the admin *pages*
still load fine even before the database is provisioned.

### What's deliberately not built yet (Phase 2/3)

Scoped out for now, per the agreed "core first" build order — the dashboard says
so explicitly rather than hiding the gap:
- Customers, appointments, services/pricing editing, promotions, reviews management
- Real Instagram OAuth import (for now: paste a post URL and upload the image
  manually — no scraping, no password login, no undocumented APIs)
- Analytics, 2FA, a dedicated Security Center, CSV/data exports

## Deployment

The public site works as a static deploy anywhere (Vercel, Netlify, GitHub Pages,
Cloudflare Pages) with no build command. The admin system additionally needs
Vercel (for Serverless Functions) plus the Postgres/Blob setup above:

```bash
vercel --prod
```
