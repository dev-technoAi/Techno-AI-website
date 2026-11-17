# Media formatting review — 16 November 2026

Changes are limited to media presentation and the sizing needed to keep media and adjacent copy visible. Existing content, routes, links, forms, and the cinematic design remain intact.

## Reviewed components

| Media family | Result |
| --- | --- |
| Interior hero images | Full viewport responsive image hints; indexed local copies of absolute WordPress asset URLs now receive intrinsic sizing and optimization. |
| Card thumbnails | Dedicated 16:10 clipping frames prevent intrinsic image heights and hover zoom from overlapping card copy. |
| Announcement banners and portrait covers | Contained previews preserve the complete artwork. Banner-only grids use an 8:3 frame to avoid excessive letterboxing. |
| Split pictures and story rows | Explicit responsive heights, centered framing, consistent rounded clipping, and natural proportions for artwork. Phone layouts retain full images. |
| Article images | Natural proportions and image size hints appropriate for the reading column. |
| Partner logos | Bounded, aligned logo slots; the existing homepage monochrome treatment makes dark marks readable. Logo tracks cannot shrink their images. |
| Solution videos | Mobile frames follow 16:9 instead of filling oversized portrait boxes. Scene sizing includes the rendered media height, including on landscape screens. |
| Native videos and embeds | Native videos use intrinsic height; iframe videos keep a responsive 16:9 frame. Controls and fullscreen attributes remain intact. |
| Previous homepage canvas | Frame dimensions are established before drawing even when the first frame arrives out of order. |
| Legacy media and avatars | Contact-card avatars retain their circular cover presentation. The old-home portrait badge uses contain within its existing square slot. Existing logo-carousel clipping is preserved. |
| Icons and shared chrome | Existing vector proportions retained; interior icon slots resist flex shrinking. |

## Verification

- Production build passed compilation, type validation, and generation of all 191 outputs.
- `results.json`: 98 public routes at 1440, 768, 390, and 320 pixels; 392 route/viewport combinations and 1,538 media observations. Every route returned HTTP 200.
- `problems.json`: no broken loaded images, detected image stretching, or uncontained horizontal media overflow. Intentional clipping in heroes, carousels, reveal frames, and horizontal scenes is excluded from overflow findings.
- The final badge change was rebuilt and its four affected route/viewport observations replaced in the complete report.
- `playback.json`: all six solution films loaded and played through the active scroll sequence at 390×844, 768×1024, and 844×390. Video frames retained 16:9 and copy fit within each scene. Desktop active-film playback was also inspected directly.
- Existing `test-responsive-motion.cjs` and `test-site-motion.cjs` passed, including scene sizing, transitions, playback scheduling, and menu interaction regressions.
- Representative production screenshots in `review/` were visually inspected for desktop/mobile film framing, news previews, partner imagery, product imagery, and avatar presentation.

These are local Chrome checks. Third-party analytics and remote embeds are blocked during the route geometry audit; external services and physical-device/browser-specific behavior are not covered. Screenshot review is representative; geometry checks cover every listed route.

## Reproduction

From `technoai-nextjs`, build and start the application, then run `node scripts/audit-media.cjs`. The script uses the existing cached Puppeteer audit tooling, or `MEDIA_PUPPETEER` to select an installed module. `CHROME_PATH` overrides the local Chrome executable. No dependencies were added.

Optional environment variables: `MEDIA_ROUTES` (comma-separated routes), `MEDIA_WIDTHS` (comma-separated widths), `MEDIA_SCREENSHOTS=1`, `MEDIA_OUTPUT`, and `MEDIA_PROFILE`. `MEDIA_MERGE=1` updates only the selected route/viewport results in an existing report.
