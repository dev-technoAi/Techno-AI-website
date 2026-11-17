# TechnoAi project reference

Verified from repository source on 17 November 2026.

## Purpose and current scope

TechnoAi is a technology company website covering robotics, drones, satellite connectivity, financial/procurement solutions, industrial infrastructure and security. It combines archived WordPress/Elementor content with a Next.js redesign. WordPress/PHP is not required to serve the local snapshots or process the implemented forms.

Two independent projects exist: technoai-nextjs is the main dark website; technoai-white is a separate white homepage prototype. Their changes are not automatically synchronized.

## Stack

Main project: Next.js 15.5.29 App Router, React/React DOM 19.1.10, TypeScript 5.9.2, Lenis ^1.3.27, node-html-parser ^7.0.1, Nodemailer ^7.0.6. package.json specifies Node 24.x. Styling is custom CSS. Content uses local JSON models and HTML snapshots; no database integration appears in the application source reviewed.

## Architecture

- app/redesign/page.tsx: current homepage, publicly served at / through a rewrite.
- app/redesign/layout.tsx: root layout, brand stylesheet imports, metadata and viewport.
- app/redesign/home.css: home sections and responsive/motion layouts.
- app/redesign/motion.tsx: reveal observer, scene sizing, chapter progress, smooth scrolling, cursor, menu, transitions and visible video playback.
- app/redesign/hero-film.tsx: decorative video playback, viewport/tab visibility and preference handling.
- app/redesign/hero-heading.tsx: interactive hero lettering.
- app/redesign/ui.tsx: shared Arrow, Eyebrow and Words components.
- app/chrome.ts: current shared header, menu, CTA and footer markup.
- app/redesign/chrome.css: shared chrome styles and design tokens.
- app/brand-font.css: self-hosted Noto Sans TC Latin font and brand artwork mask.
- app/type-spacing.css: shared typography scale and spacing rhythm.
- app/p/[...slug]/page.tsx: statically generated rebuilt interior pages.
- app/p/model.ts: typed content model.
- app/p/render.tsx: hero, card, prose, split, story, article, video and section renderers.
- app/p/form.tsx: React form component.
- app/p/pages.css: interior page-specific layouts and form/media styles.
- app/[[...slug]]/route.ts: archived HTML fallback, old-home alias and unknown-page 404 response.
- app/theme-document.ts: adds current theme/chrome to archived HTML; custom quote presentation.
- app/brand.css/route.ts: combines font, Lenis, chrome, interior-dark and typography CSS for archived pages.
- app/image.tsx: intrinsic sizing and responsive Next image properties for indexed local assets; optimized poster helper.
- app/wp-admin/admin-ajax.php/route.ts: dynamic form POST endpoint preserving Elementor action names.
- lib/form-submissions.ts: payload parsing, validation, SMTP delivery, local backup and rate limiting.
- next.config.mjs: public URL rewrites, trailing slashes, dev/build directory separation, file tracing and selected media cache headers.

## Content and assets

- content/routes.json: 96 archived public URL mappings.
- content/pages/: archived HTML content, including the 404 page.
- content/templated.json: 88 public URLs mapped to rebuilt page models.
- content/models/: structured page content consumed by the React renderer.
- content/forms.json: recognized classic Elementor form identifiers, labels and required flags.
- content/image-dimensions.json: intrinsic media dimension index.
- public/wp-content/ and public/wp-includes/: copied WordPress assets.
- public/redesign/: cinematic films, posters, solution visuals, domain images and earlier frame assets.
- public/fonts/: local brand font and license.
- public/site.js: archived-page menu, motion and navigation behavior.
- public/brand-select.js: enhanced select controls preserving native values/validation.
- public/technoai-form-fixes.js: archived atomic partner-form field fixes.

88 rebuilt models contain 319 sections. Inventory: 409 headings, 538 paragraphs, 93 grids, 122 image blocks, 83 buttons, 44 lists, 138 icons, 6 eyebrows and 8 form blocks. Inventory counts do not mean visual verification.

## Homepage

Robotics video hero and project CTA; drone feature scene; manifesto; six solution chapters; five technology-domain cards plus catalogue CTA; industries; partners/clients marquee; closing CTA; shared footer. Current six solutions are AI & Robotics, Aerial & Drone, Financial & Transaction, Connectivity & Satellite, Industrial & Infrastructure and Security Systems.

## Brand and interaction

Near-black background #030505, ink #0f1a1b and blue #146b8c; white/grey text. Shared font is Noto Sans TC. Light display headings, readable body hierarchy, responsive spacing, rounded media/cards and focus indicators. Motion includes pinned scenes, reveals, smooth desktop scrolling, page curtains and decorative video. Current main layouts respect reduced motion at initialization; the controller needs a reload after changing the OS preference. Hero film listens for preference changes.

## Forms and data flow

Browser form -> POST /wp-admin/admin-ajax.php -> action-specific parser -> validation/rate limit -> local JSONL backup and optional SMTP -> success/error response.

Classic actions use elementor_pro_forms_send_form. Atomic forms use elementor_pro_atomic_forms_send_form. Other WordPress AJAX actions return 400. The endpoint checks request Origin against the forwarded/current host when both are present.

forms.json currently defines:

- 88:f99fb42, Quotation Form Main, /request-a-quote/: Name, Email, Mobile, Country, Product and Industry required; Message optional.
- 2006:6b6a6b8d, Newsletter Form: Full Name optional, Email required.

The classic parser can also accept nonempty field payloads without a recognized form definition; those do not receive definition-based required-field checks. The atomic parser extracts submitted field labels/types/values and email reply-to, without an explicit server-side required-field schema. These are existing implementation limits.

Local backup path is submissions/submissions.jsonl. SMTP configuration uses SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_FROM and MAIL_TO; SMTP_SECURE is optionally supported. Read .env.example for names/defaults. Real credentials are not included here.

If SMTP is absent, a successful local save can produce success. If SMTP is configured and delivery fails, the endpoint reports failure even if the local backup succeeded. On read-only/serverless storage, email can be the only available delivery channel. There is no implemented submissions dashboard or durable database. The rate limiter permits five attempts per IP in ten minutes per server process; it is memory-local rather than a distributed limit.

## Run and build

From technoai-nextjs:

    npm install
    npm run dev

Development URL: http://localhost:3100. Production: npm run build, then npm start on port 3100. Development output is .next-dev; production output is .next.

From technoai-white: npm install then npm run dev on port 3200. npm run build and npm start are also defined. Only the white homepage is implemented; other URLs show its explanatory not-found page.

## Content maintenance

- Homepage copy/solutions/domains: app/redesign/page.tsx.
- Current common nav/footer: app/chrome.ts.
- Individual rebuilt page: its content/models JSON.
- Render/layout behavior shared by those pages: app/p/render.tsx and pages.css.
- Archived content: content/pages HTML, transformed at serving time by theme-document.ts.
- Quote field labels/required flags for backend recognition: content/forms.json. Changing this alone does not automatically add/remove rendered fields; frontend markup and submitted field keys must agree.
- npm run clone runs scripts/clone-site.mjs to refresh the WordPress snapshot; inspect generated changes before retaining them.
- scripts/build-page-models.mjs generates structured models from snapshots.
- scripts/index-image-dimensions.cjs maintains intrinsic sizing metadata.
- scripts/optimize-posters.cjs prepares smaller poster assets.

Some README descriptions reference older chrome/CSS files. Current imports and runtime files listed above take precedence.

## Hosting

vercel.json declares Next.js; file tracing includes local content needed by the server build. The project also supports a Node server using npm start. SMTP variables must be set in the hosting environment. Deploying only static HTML does not provide the form POST endpoint. Existing Vercel configuration does not establish that the latest changes are deployed. No deployment was performed in the current work.

## Verification and limitations

Previous pass: TypeScript passed; production build passed and generated 191 static outputs (these include internal/fallback generated paths, not 191 distinct public content pages); 98 public audit URLs returned 200; unknown route returned 404; invalid form returned success:false. Menu, dropdown and responsive motion DOM regression checks passed.

Full rendered visual audit remains incomplete: browser host unavailable, native Chrome approval timed out. Actual browser console/network review, every-page responsive appearance, real SMTP delivery and external integrations were not verified. HTTP 200 does not establish working business features.

WooCommerce cart/account/checkout flows and site search have no implemented WordPress backend. The shipment tracking menu points to an external service; that service is outside this repository and was not verified. The partner atomic form is present in archived content; the current homepage Become a Partner CTA links to /partners/, so do not assume the old popup is active on the redesigned homepage. White theme is homepage-only.

## Complete archived public route inventory

Rendering below follows next.config.mjs: root is the redesigned home, mapped models use React, remaining URLs use archived/themed HTML.

| Public route | Rendering |
| --- | --- |
| / | Current redesigned homepage |
| /aerial-drone-solutions/ | Rebuilt React page |
| /agras-project-management-case-study/ | Rebuilt React page |
| /agriculture/ | Rebuilt React page |
| /ahmed-bakr/ | Archived HTML with shared theme |
| /ai-robotics/ | Rebuilt React page |
| /all-products/ | Rebuilt React page |
| /anti-drone/ | Rebuilt React page |
| /author/technoai2024gmail-com/ | Rebuilt React page |
| /automation-control-systems/ | Rebuilt React page |
| /blogs/ | Rebuilt React page |
| /cart/ | Archived HTML with shared theme |
| /case-study-boat-factory/ | Rebuilt React page |
| /case-study/ | Rebuilt React page |
| /category/news/ | Rebuilt React page |
| /catering/ | Rebuilt React page |
| /cleaning/ | Rebuilt React page |
| /cloud-computing/ | Rebuilt React page |
| /company-profile/ | Rebuilt React page |
| /connectivity-satellite-systems/ | Rebuilt React page |
| /contact-card-a-s/ | Archived HTML with shared theme |
| /contact-card-r-a/ | Archived HTML with shared theme |
| /controllers-peripherals/ | Rebuilt React page |
| /cyber-security/ | Rebuilt React page |
| /data/ | Rebuilt React page |
| /defense-security/ | Rebuilt React page |
| /dev-kits/ | Rebuilt React page |
| /digital-transformation-iiot/ | Rebuilt React page |
| /dji_agriculture/ | Rebuilt React page |
| /dji_marine/ | Rebuilt React page |
| /dji_rd/ | Rebuilt React page |
| /drones/ | Rebuilt React page |
| /energy-infrastructure/ | Rebuilt React page |
| /faq/ | Rebuilt React page |
| /financial-services-case-study/ | Rebuilt React page |
| /financial-services/ | Rebuilt React page |
| /financial-transaction-solutions/ | Rebuilt React page |
| /fixed-wings/ | Rebuilt React page |
| /fpv-products/ | Rebuilt React page |
| /government-public-sector/ | Rebuilt React page |
| /gps-systems/ | Rebuilt React page |
| /header-test/ | Rebuilt React page |
| /heavy-load/ | Rebuilt React page |
| /home-page/ | Rebuilt React page |
| /hotel/ | Rebuilt React page |
| /industrial-smart-infrastructure/ | Rebuilt React page |
| /industries-2/ | Rebuilt React page |
| /industries/ | Rebuilt React page |
| /insights/ | Rebuilt React page |
| /installation/ | Rebuilt React page |
| /integration/ | Rebuilt React page |
| /iot-ai/ | Rebuilt React page |
| /land/ | Rebuilt React page |
| /leadership-thoughts/ | Rebuilt React page |
| /logistics-mobility/ | Rebuilt React page |
| /logistics-supply-chain/ | Rebuilt React page |
| /marine/ | Rebuilt React page |
| /maritime/ | Rebuilt React page |
| /menu-home/ | Rebuilt React page |
| /multirotor/ | Rebuilt React page |
| /my-account/ | Archived HTML with shared theme |
| /networking-communication/ | Rebuilt React page |
| /news-updates/ | Rebuilt React page |
| /oil-gas/ | Rebuilt React page |
| /partners/ | Rebuilt React page |
| /procurement-case-study/ | Rebuilt React page |
| /procurement/ | Rebuilt React page |
| /professional-services/ | Rebuilt React page |
| /project-management/ | Rebuilt React page |
| /public-safety/ | Rebuilt React page |
| /raspberry-pi/ | Rebuilt React page |
| /request-a-quote/ | Archived HTML with shared theme |
| /research-and-development/ | Rebuilt React page |
| /robotics/ | Rebuilt React page |
| /sales-inquiry/ | Rebuilt React page |
| /satellites/ | Rebuilt React page |
| /security-mission-critical-systems/ | Rebuilt React page |
| /seeed-studio-2/ | Rebuilt React page |
| /seeed-studio-xiao/ | Rebuilt React page |
| /services/ | Rebuilt React page |
| /shop/ | Archived HTML with shared theme |
| /smart-manufacturing/ | Rebuilt React page |
| /solutions/ | Rebuilt React page |
| /technical-support/ | Rebuilt React page |
| /technoai-achieves-diamond-local-content-partner-certification-from-etihad-aviation-group/ | Rebuilt React page |
| /technoai-amtech/ | Rebuilt React page |
| /technoai-and-ingram-micro-gulf-announce-strategic-partnership-to-expand-global-technology-access-and-digital-transformation-solutions/ | Rebuilt React page |
| /technoai-holybro/ | Rebuilt React page |
| /technoai-keenon-robotics/ | Rebuilt React page |
| /technoai-registered-as-official-supplier-on-abu-dhabi-government-procurement-gate/ | Rebuilt React page |
| /technoai-seeed-studio/ | Rebuilt React page |
| /test-measurement-systems/ | Rebuilt React page |
| /tii-technoai-in-cpo-strategy-magazine/ | Rebuilt React page |
| /tracking/ | Rebuilt React page |
| /training/ | Rebuilt React page |
| /utilities/ | Rebuilt React page |

Additional access URLs: /old-home/ (archived original home), /redesign/ (current home internal route), /redesign-v1/ (earlier prototype). /p/... routes are internal rendering destinations. Unknown public URLs return the site 404.
