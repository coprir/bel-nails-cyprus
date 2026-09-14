# Bel Nails Cyprus — website

A single-page, no-build website for Bel Nails (Nicosia, Cyprus). Plain HTML/CSS/JS —
no framework, no build step. Open `index.html` in a browser or deploy the folder as-is.

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

- [ ] Replace every `[Add ...]` / "to be added" placeholder in `index.html`
      (address, hours, phone, WhatsApp, email, pricing, durations, bio, certifications)
- [ ] Replace the placeholder booking email `hello@belnails.cy` in `js/main.js`
      (search for `PLACEHOLDER: replace with Bel Nails' confirmed booking email`)
      with the real inbox that should receive appointment requests
- [ ] Once a WhatsApp number exists, remove `disabled` from the WhatsApp button in
      the Booking section of `index.html` and set its `href` to
      `https://wa.me/<number>`
- [ ] Add real portfolio photography to `portfolioItems` in `js/main.js` (see above)
- [ ] Add a real hero photo (replace the placeholder panel in the `.hero-visual` div)
- [ ] Add a founder/owner photo (replace the placeholder panel in `.about-photo`)
- [ ] Add a Google Maps embed once the exact address is confirmed
      (`.map-placeholder` in the Location & Contact section)
- [ ] Add the `NailSalon` structured-data `address` and `telephone` fields in the
      `<script type="application/ld+json">` block in `<head>` once confirmed
      — don't add placeholder values there, search engines will index them as real
- [ ] Add an Open Graph image (`og:image`) once there's real photography
- [ ] Replace real client reviews into the Reviews section as they come in
- [ ] "Try Your Look" is intentionally a "coming soon" placeholder, not a fake
      demo — wire up a real AR/virtual try-on provider there when one is chosen

## Structure

```
index.html        all markup, sections in document order match the page
css/styles.css     design tokens (colors/type/spacing) + all component styles
js/main.js         portfolio data, quiz logic, filters, wishlist, viewer, booking handoff
```

No build tooling, no dependencies. Fonts (Playfair Display + Inter) load from
Google Fonts; everything else is self-contained.

## Local preview

```bash
python -m http.server 5173
```
then open `http://localhost:5173`. (Opening `index.html` directly as a `file://`
URL also works, but a local server is more representative of production.)

## Deployment

Any static host works as-is: Vercel, Netlify, GitHub Pages, Cloudflare Pages.
Drag-and-drop the folder, or point the host at this directory — no build command
needed.
