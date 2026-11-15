# Performance and code audit ? 14 November 2026

Scope: current homepage, 88 model-driven React routes, archived WordPress fallbacks, previous prototype, shared chrome/motion, forms endpoint, static assets, dependency and build configuration. Existing uncommitted work was preserved. No redesign, palette, typography, layout, or animation sequence changes were made.

## Confirmed bottlenecks and implemented changes

- **Image transfer and sizing:** indexed 779 local images; React page templates and the homepage now emit responsive optimized image URLs and intrinsic dimensions. Existing CSS still controls composition. Partner logos use a small sizes hint. Decorative video posters are pre-generated WebP assets, avoiding an image-transform cold start. Six posters total about 139 KB; their original JPEGs were substantially larger.
- **Idle animation work:** mobile/touch and reduced-motion pages schedule work on scroll/resize instead of running an idle RAF loop. Desktop Lenis and cursor interpolation remain animated. Cursor transforms stop being rewritten once settled. Hidden-page loops are cancelled; chapter films pause on cleanup.
- **Scroll layout work:** section geometry is collected before progress writes and reused, removing duplicate getBoundingClientRect calls. Video visibility synchronization runs on scroll/viewport changes rather than polling every 250 ms.
- **Video loading:** chapter films have deferred data-src attributes, attaching their source only when active/visible. Hero and chapter loops are retained. Save-data, hidden-page and reduced-motion checks remain in place.
- **Duplicate archived-page animation:** removed the obsolete Lenis 0.2.28 CDN script and its encoded perpetual RAF initializer. The existing current Lenis engine remains.
- **Duplicate archived-page fonts:** removed Google Fonts stylesheets overridden by the existing local Noto Sans theme. This removes a roughly 300 KB Noto Sans TC stylesheet on the quote page without changing its selected typeface.
- **JavaScript:** desktop smooth scrolling is dynamically imported; unused preloader implementation removed. The app already has few runtime dependencies. React/Next, Lenis, mail delivery, and the content parser all have valid uses; none was blindly removed. Next's reported first-load JS remains approximately 112 KB, so no material bundle-size reduction is claimed.
- **Data/server work:** React request cache deduplicates page-model reads between metadata and rendering using the route string as key. All existing static generation is retained. There is no general client data-fetching layer to cache. Rate-limit storage no longer accumulates repeated blocked hits and prunes expired IP entries when the map grows.
- **Interaction/accessibility:** menu focus moves into the overlay, Tab wraps, Escape closes, and focus returns to its trigger. Dropdown native values and keyboard handling remain intact. Transition RAF/timers are cleaned up. Async React form submission now captures its form element before awaiting so successful reset works, and guards repeated sends.
- **SEO:** homepage canonical metadata added; interior page metadata/canonicals retained. Image dimensions fix Lighthouse's unsized-image finding on the homepage.

## Measurements

| Route | Performance before ? final | Transfer before ? final | LCP before ? final | TBT before ? final | Final CLS |
| --- | --- | --- | --- | --- | --- |
| Homepage (mobile) | 88 ? 91 | 1189 ? 969 KiB | 3.26 ? 3.30 s | 246 ? 143 ms | 0.001 |
| AI & Robotics (mobile) | 100 ? 100 | 1533 ? 399 KiB | 1.06 ? 1.06 s | 20 ? 21 ms | 0.012 |
| Quote (mobile)* | 49 ? 86 | 1012 ? 678 KiB | 4.66 ? 3.25 s | 1021 ? 20 ms | 0.022 |

*Quote baseline was captured after the initial shared-motion changes but before removing duplicate fonts/Lenis. Homepage final accessibility/SEO: 94/92; interior: 94/100; quote: 98/100. A desktop homepage run scored 100, with 0.3 s LCP and 0 ms TBT, before the final server-image helper/archived-only refinements. Mobile homepage performance varied between 90 and 92 during iteration; final retained run is 91. No desktop baseline comparison is claimed.

Raw files in `lighthouse/` include the original baselines, intermediate runs and final runs, rather than only the best score. The earlier poster-conversion run worsened homepage LCP; static WebP posters replaced that approach. Final mobile screenshots are retained in this directory.

## Verification

- Final production build passes compilation, Next type validation and generation of 191 static outputs without warnings.
- All 98 audited public routes return 200. An unknown route returns 404. Invalid form payload returns the expected `success: false` response; no real message was sent.
- Existing dropdown suite passes search, empty results, keyboard navigation, Escape, outside click, native values, validation, reset and disabled state.
- Added DOM checks pass menu focus, Tab wrap, Escape/inert state, and absence of idle RAF rescheduling on touch/reduced-motion pages.
- Verified archived output no longer references the old Lenis CDN or Google Fonts stylesheet.
- Lighthouse 13.6.0, local production server, installed Chrome, default simulated mobile throttling; desktop uses the desktop preset. Raw reports are retained alongside this report. Results are individual lab runs, not statistical medians or field Core Web Vitals. Image optimizer disk caches can affect individual runs.
- Baseline/final mobile homepage screenshots were inspected: composition is preserved. Desktop and quote measurements cover additional rendering paths. Interactive browser automation host was unavailable, so full manual scrolling, real-device visual comparison, tablet testing, and every interactive widget are **not verified**.

## Remaining work and limits

- Homepage mobile LCP is still around 3.3 seconds in these lab runs; it is not yet reliably below 2.5 seconds. Do not describe these results as passing field Core Web Vitals. INP requires representative interactions/field monitoring; TBT is a lab diagnostic, not INP.
- Animated dimmed text and some inherited heading order/link wording still trigger Lighthouse accessibility/SEO findings. Design colours and existing marketing content were preserved rather than changing them just to raise scores.
- The quote/fallback pages still carry Elementor, jQuery, analytics, and legacy styles. Only confirmed duplicates were removed; wholesale removal requires visual and form regression testing. Analytics integrations were retained.
- Archived contact-card and old-home routes have no h1 in their original markup; recorded in routes.json. The main React pages have one h1. Migrating the retained legacy pages/prototype is outside a performance-only refactor.
- SMTP credentials/delivery, static WooCommerce/search limitations, and production hosting behaviour were not changed or verified. No deployment was performed.
- Unknown local image paths preserve a plain img fallback. Regenerate dimensions when replacing/adding assets. Next image transformation caching must be available in the target Next.js hosting environment.

## Reproduction

Run from technoai-nextjs:

```text
node scripts/index-image-dimensions.cjs
node scripts/optimize-posters.cjs
npm run build
npm start
node scripts/audit-routes.cjs
node scripts/test-site-motion.cjs
node scripts/test-brand-select.cjs
```

The asset scripts use Sharp installed with Next. DOM audit/tests use the existing local `.theme-ui-tests/node_modules/jsdom`; a clean environment must install jsdom in that tooling directory first. Run Lighthouse against the production server, not next dev. Do not run a build concurrently with a server using the same .next output.
