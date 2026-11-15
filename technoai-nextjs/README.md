# TechnoAi website — Next.js

A Next.js (App Router) version of **https://technoai.ae**, identical to the live WordPress/Elementor site.

## Home page

`/` shows the new design (`app/redesign/`, via a rewrite in `next.config.mjs`).
The old home page content is still available at `/old-home/`. Every content URL uses the
same brand theme as the redesigned homepage, while preserving the archived content and forms.

The shared header and footer live in `app/site-chrome.json`; both the React homepage and
HTML content routes use this source. `app/theme-document.ts` adds layout hooks to the
archived HTML at response generation time. `/brand.css/` serves the homepage stylesheet
plus `app/interior.css`, which adapts legacy sections, cards, forms and articles. The original
files in `content/pages/` remain the content source and are not rewritten by the theme.

For a local CSS contrast regression audit, run the dev server, install the optional Python
tools with `python -m pip install --target .theme-audit-tools tinycss2 cssselect2`, then run
`python scripts/audit-theme.py`. This checks the static CSS cascade across the archived
content routes; it does not replace visual checks of images, gradients or interactive states.

The quote page uses the original Elementor form inside a dedicated layout in
`app/theme-document.ts`, with presentation in `app/refinements.css`. `public/brand-select.js`
enhances the existing select controls while preserving their names, values and validation.
To run its DOM interaction tests, install the optional test library with
`npm install --prefix .theme-ui-tests --no-package-lock --no-save jsdom@26.1.0`, then run
`node scripts/test-brand-select.cjs` against the running dev server.

## How it works

- `scripts/clone-site.mjs` crawls the live site (sitemap + internal links) and saves:
  - `content/pages/*.html` — every page exactly as WordPress/Elementor rendered it (96 pages + the 404 page)
  - `content/routes.json` — URL → file map
  - `public/wp-content/...`, `public/wp-includes/...` — all CSS, JS, fonts and images at their original paths
- Internal links and asset URLs are made relative, so the site runs fully from this project.
  Canonical, Open Graph/Twitter tags and JSON-LD stay pointed at `https://technoai.ae` for SEO.
- `app/[[...slug]]/route.ts` serves each page; all pages are pre-rendered at build time (static).

## Commands

```bash
npm install
npm run dev      # http://localhost:3100
npm run build
npm start        # production server on http://localhost:3100
npm run clone    # re-snapshot the live site (when content changes in WordPress)
```

`npm run clone` looks for the extracted WordPress backup in `../site` and copies files from it when
possible, downloading the rest from the live site.

## Forms

All Elementor forms work without WordPress. Their scripts still post to `/wp-admin/admin-ajax.php`,
which is now a Next.js route ([app/wp-admin/admin-ajax.php/route.ts](app/wp-admin/admin-ajax.php/route.ts)):

| Form | Where |
|---|---|
| Quotation Form Main | `/request-a-quote/` |
| Become a Partner (atomic form) | popup on the home page |
| Newsletter Form | the 8 news posts |

Submissions are emailed via SMTP. Copy `.env.example` to `.env.local` and fill in the mailbox details
(restart `npm run dev` afterwards). Every submission is also appended to `submissions/submissions.jsonl`
when the disk is writable (local / VPS). Without SMTP settings, submissions are only saved to that file.

Required fields and email format are checked on the server; each IP may submit 5 times per 10 minutes.
`public/technoai-form-fixes.js` fixes three fields of the partner form that were always submitted
empty on the WordPress site (Areas of Interest, Partnership Type, Industries).

## Not working without the WordPress backend

- WooCommerce cart / checkout / my-account login (shown as static snapshots)
- Site search
