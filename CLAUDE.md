# TechnoAi website — project notes

The owner talks in Roman Urdu/Hindi. Reply in the same language, keep technical terms in English.

## What this is

A Next.js copy of the live WordPress/Elementor site **https://technoai.ae**.

**Direction changed on 2026-11-12:** the head now wants the site *redesigned* (prototype first):
unique, "AI company" look, simple and well organised, smooth animation, no flashy stuff. See
"Redesign" below. The identical clone stays as-is as the content source and for comparison — the
redesign lives beside it, don't restyle the cloned pages.

```
Techno AI main website/
├── tracking-system-backend-updated-2026-10-27.zip   original Hostinger backup (keep, never delete)
├── site/                 extracted WordPress files (no database dump in the backup)
├── technoai-nextjs/      ← the actual project
└── .claude/launch.json   preview config: "technoai-nextjs" on port 3100
```

Removed on purpose earlier (the owner asked for only the main website): the `track/` React app
(track.technoai.ae), the root `assets/` build and Hostinger's `default.php`. Don't bring them back.

## technoai-nextjs — how it works

- `scripts/clone-site.mjs` crawls the live site (sitemap + links) and saves:
  - `content/pages/*.html` — 96 pages + `_404.html`, exactly as WordPress rendered them
  - `content/routes.json` — URL → file, `content/forms.json` — Elementor Pro form field labels
  - `public/wp-content/**`, `public/wp-includes/**` — all CSS/JS/fonts/images at their original paths
  - Internal URLs are made relative (also inside LiteSpeed's base64 `data:text/javascript` scripts).
    Canonical, og:/twitter: tags and JSON-LD stay absolute to https://technoai.ae on purpose (SEO).
  - It sends LiteSpeed's `_lscache_vary` cookie (from POST guest.vary.php) — without it LiteSpeed
    serves a stripped "guest" page with missing Google Fonts.
  - Files are copied from `../site` (backup) when present, otherwise downloaded.
  - `node scripts/clone-site.mjs --rewrite-only` re-applies URL rewriting + forms.json without network.
- `app/[[...slug]]/route.ts` serves each page HTML (static, pre-rendered at build). Not React pages —
  this keeps Elementor/LiteSpeed output byte-for-byte identical. Unknown paths → site's 404 page.
- `next.config.mjs`: `trailingSlash: true` (WordPress URLs end in `/`).
- Elementor + LiteSpeed JS is "delayed": many elements appear only after the first mouse move/scroll.
  That is normal (same on live). Trigger a scroll before judging a screenshot.

## Redesign (in progress)

- Brief (from the head): copy the whole current site and redesign it; white + brand "black" theme with
  the brand accents; hero image of the home page will be replaced by a video (being made with Basit).
- Brand (from "TechnoAi Brand Identity Final.pdf"): ink `#0f1a1b` (use instead of black — the PDF's
  label on that swatch is a typo), `#9fe7e7`, `#289fb7`, `#146b8c`, white. Typeface Noto Sans
  (Light/Regular/Medium/Bold). Logo motif `//:ai`.
- The redesign IS the home page now (2026-11-13): `/` is rewritten to `/redesign/` in next.config.mjs
  (beforeFiles). The old WordPress home stays reachable at `/old-home/` (alias in route.ts).
  All other URLs still serve the old cloned pages.
- **Current design = "Mission Control" (2026-11-13)**, built after analysing cerebrium.ai, apple.com/apple-vision-pro,
  lusion.co, activetheory.net and unseen.co. Owner's rules: brand font Noto Sans + PDF colours only
  (ink #0f1a1b — page uses it a little darker, #0b1415, owner asked 2026-11-13 — blue #146b8c accent, text white/grey), and **no Magnific generation until the
  whole design is approved** — placeholders are built in code.
- Files in `app/redesign/`:
  - `data.ts` all text/links (copied from the current home page) — `SOLUTIONS[].slug` names the 3D slot.
  - `page.tsx` sections: loader → hero (real-time 3D drone over a dot field, press & hold = scan) →
    statement (words light up with scroll) → closer look (drone film frames scrub, 4 uses) →
    solutions journey (pinned, 6 stations, one 3D model each + rail) → domains + typing "mission log"
    terminal → industries (horizontal scroll) → where we are (3D dotted globe, 3 hubs) → partners
    marquee → CTA → footer with big wordmark.
  - `scenes.tsx` three.js scenes (HeroScene, JourneyScene, GlobeScene, DroneFilm).
  - `models.ts` placeholder models made of primitives (drone, robot, satellite, financial terminal,
    industrial plant, security camera). **To use a real model:** put `public/redesign/models/<slug>.glb`
    and add the slug to `REAL_MODELS` in models.ts — it replaces the placeholder, auto-scaled.
  - `fx.tsx` Lenis smooth scroll, reveal, `[data-progress]` → CSS `--p`, `[data-hscroll]`, Loader, Terminal.
  - `redesign.css` the whole look (one file, no theme override blocks any more).
- Old colour-experiment notes above this line are history; the palette rule is: #0f1a1b + #146b8c only.
- Drone film frames: `public/redesign/hero/f001..f097.jpg` (+ `hero-loop.mp4` for phones), graded with
  hue=h=16,eq=brightness=-0.05:contrast=1.35:saturation=0.85,curves=all='0/0 0.25/0.13 1/1'.
  Source: `public/redesign/hero-source.mp4` (Seedance 2.5, 6,320 credits). Magnific: ask + quote credits
  before every paid generation (models3d_generate ≈ 1,035 credits, image ≈ 65, 8 s video 6,320).
- Visual check: the in-app browser pane throttles/pauses rAF when hidden, so WebGL looks empty there.
  Use headless Chrome via CDP instead (a small node script: launch chrome --headless=new
  --remote-debugging-port, navigate, scroll with `window.lenis.scrollTo(y,{immediate:true})`,
  Page.captureScreenshot) — that is how the 2026-11-13 design was checked at 1440x900 and 390x844.
- Not done yet: real 3D models / extra videos (after approval), inner pages in the new style
  (nav/footer links still open the old cloned pages), "Become a Partner" popup form.

## Home hero (2026-11-14) — white theme, 3D "Intelligence Core"

- Built from the owner's spec + reference image: `app/redesign/hero.tsx` (markup, nav data),
  `hero-nav.tsx` (floating glass navbar, dropdowns, mobile panel), `core-stage.tsx` (lazy-loads the
  scene with next/dynamic, CSS orb fallback without WebGL, HTML labels), `core-scene.tsx` (React
  Three Fiber 9 since 2026-11-14 — @react-three/fiber only, no drei; components: StudioEnvironment
  (RoomEnvironment), ResponsiveCamera, IntelligenceCore, Band, Cube, Particles; glass sphere, circuit shells, //:ai core from the
  official Logo.svg, chrome orbital bands, pedestal, particles, glass cubes, mouse parallax, label
  lines projected every frame, pauses off-screen, still frame for reduced motion), `hero.css`
  (all classes prefixed `hx-`). page.tsx just renders `<Hero />` in place of the old header + hero.
- Existing hero film `/redesign/landing/hero.mp4` is only a 7% grey texture behind the core.
- Font: layout uses `Noto_Sans_TC`. In a dev server whose font download failed it shows Arial
  ("Noto Sans TC Fallback"); restart the dev server. Production build has the real font.
- Verify builds without touching a running dev server: `NEXT_BUILD_DIR=.next-verify npx next build`.

## Section 02 (2026-11-14) — "Find your starting point", 3 capability cards

- `app/redesign/capabilities.tsx` (+ `capabilities.css`, prefix `cx-`) replaces the old `.overview` block.
  `capability-models.tsx` = three small R3F canvases (AI processor in a glass cube + neural net, robot
  arm, edge server stack), lazy-loaded when the section is near, frameloop "never" off screen, shared
  window mouse parallax, more motion on card hover. Reuses `StudioEnvironment` exported from core-scene.
- Reveal = the page's existing `[data-reveal]` (fx.tsx + Lenis) with staggered transition-delay.
  GSAP is NOT installed; the spec asked for GSAP ScrollTrigger but also "no duplicate animation
  systems" — install gsap only if the owner insists.
- Decorative robot hand + glass AI chip: Magnific image (65 credits) at
  `public/redesign/capabilities/robot-hand.jpg`, multiply-blended on the light background.

## Section 03 (2026-11-14) — connected intelligence ecosystem

- `app/redesign/ecosystem.tsx` (+ `ecosystem.css`, prefix `ex-`) replaces the old `.statement` section.
  Pinned 320vh section; uses the page's `[data-progress]` + `data-steps` (fx.tsx/Lenis) for the
  headline word light-up, the 5-step list and the "Integrated" meter. `ecosystem-scene.tsx` (R3F)
  reads the same scroll position: parts float → assemble (staggered) → blue data streams draw +
  particles flow → platform/processor glow + labels. Parts: processor (new), RobotArm + EdgeServer
  (exported from capability-models.tsx), sensors, rover, drone (buildDrone from models.ts), nodes.
- Again no GSAP (not installed; same reason as section 02).

## Forms (work without WordPress)

- `app/wp-admin/admin-ajax.php/route.ts` replaces WordPress admin-ajax for:
  - `elementor_pro_forms_send_form` — Quotation Form (`/request-a-quote/`), Newsletter (8 news posts)
  - `elementor_pro_atomic_forms_send_form` — "Become a Partner" popup (popup id 6549 on home page)
- `lib/form-submissions.ts`: validation (required, email), rate limit 5/IP/10 min, sends email via
  nodemailer SMTP, and appends to `submissions/submissions.jsonl` as a backup.
- SMTP settings go in `technoai-nextjs/.env.local` (template: `.env.example`, Hostinger
  smtp.hostinger.com:465). **Not configured yet** — email sending is untested. The owner fills in the
  password themselves; never ask them to paste it in chat.
- `public/technoai-form-fixes.js` (injected only on pages with the atomic form) fixes bugs that also
  exist on the live site: Areas of Interest / Partnership Type options had value="", Industries
  checkboxes were never copied into the hidden `industries-values` field.

## Not working (needs a real backend)

WooCommerce cart / checkout / my-account login, site search. Shown as static snapshots.

## Commands (inside technoai-nextjs)

```bash
npm run dev        # http://localhost:3100  (port 3000 is taken by Docker on this PC)
npm run build      # don't run while dev server is running — they share .next and pages return 500
npm start
npm run clone      # re-snapshot live site after content changes in WordPress
```

## Verified so far

- `next build` passes, all 96 pages pre-rendered.
- 17 pages compared with live: same page height and title, no failed requests.
- All 3 forms submitted in the browser: success message shown, all fields saved with labels.

## Open items

- SMTP not set up → email not tested (owner said "later").
- Not deployed anywhere yet.
- Git: repo at the project root (this folder), pushed to https://github.com/dev-technoAi/Techno-AI-website
  (PUBLIC repo), branch main. Root .gitignore keeps the backup zip, site/, reference .mp4s and
  personal PDFs out — never commit them.
- The WordPress database was never provided, so the WordPress site itself can't run locally.

## Real 3D models in the Solutions journey (2026-11-16)

- `public/redesign/models/robot.glb` (KEENON C40, ~2.0 MB, 56k tris) and `drone.glb` (~2.0 MB, 57k tris):
  Magnific image-to-3D, Tripo H3.1 detailed (1,160 credits each), from `output/3d-model-references/`
  (`kleenbot-c40-front-three-quarter.png`, `drone-approved-reference.png`). Cleaned in Blender 5.3
  (installed at C:/Program Files/Blender Foundation/Blender 5.3): front = glTF +Z, origin = bottom centre,
  decimate 50 %, texture 4096 → 2048 JPEG. Single mesh each → propellers can't spin separately.
- `models.ts`: `REAL_MODELS = ["robot", "drone"]`, `REAL_POSE` (robot "ground" = stands on the rings,
  drone "hover"); load errors are logged and the placeholder stays. Real models get a little
  emissive self-light so the stage's blue rim lights don't turn the grey products blue.
- `scenes.tsx` JourneyScene: real models only turn slightly (face / camera stay in view).
- Review renders: `output/3d-model-renders/`. Other four slots are still placeholders.

## 3-colour theme (2026-11-16)

- Owner: white theme with only ink #0f1a1b, blue #146b8c and aqua #9fe7e7, **no gradients**. `app/redesign/three-colour.css`
  (imported last in layout.tsx) overrides the old brand-gradient blocks; teal #289fb7 retired (TEAL const = blue in
  core-scene.tsx / capability-models.tsx). Glossy "venom" buttons (hx-gloss) still use their ink shine.

## Fast loading + Vercel (2026-11-16)

- GLBs re-exported from Blender with Draco + WebP: ~0.5 MB each (was ~2 MB). Decoder files in
  `public/redesign/draco/` (copied from three/examples/jsm/libs/draco/gltf). `models.ts` starts both downloads
  as soon as the page JS runs (`preloadModel`), page.tsx adds `<link rel="preload">` so they start with the HTML.
- Hero background video is `landing/hero-bg.mp4` (720p, 0.9 MB) instead of the 6 MB 1080p file.
- Drone film frames (97 jpgs) only start downloading when the section is ~2 screens away.
- Splash loader: min 0.6 s, max 2.5 s.
- Vercel (basitnayab1 repo, project root = technoai-nextjs) refused Next 15.5.4 (CVE-2025-66478) →
  upgraded to next 15.5.29 + react/react-dom 19.1.10.

## Opening (2026-11-16)

- After the owner's Instagram reel (alphenex.ai, first site in the reel): `fx.tsx` Loader + `opening.css` (prefix op-).
  Ink dotted screen, blue left panel with white //:ai logo + 000→100 counter → panel slides left → "● Ready"
  → screen lifts up and the hero animates in. Whole timeline is CSS keyframes (transform/opacity) started by
  data-phase="play", so it stays smooth while the 3D hero compiles. Once per session (sessionStorage), skipped
  for reduced motion. Old `.loader` CSS in redesign.css is now unused.

## Load-time fixes (2026-11-16, from owner's screen recording)

- Measured with real GPU (Intel Iris Xe) headless Chrome + CPU profile: ~3.2 s main-thread blocking at load.
- Fixes: `debug.checkShaderErrors = false` on every renderer; hero shaders compiled with
  `gl.compileAsync` (Warmup in core-scene.tsx) while the CSS orb shows, canvas fades in on `data-ready`;
  `hasWebGL()` no longer creates a test WebGL context (~0.9 s); JourneyScene/GlobeScene build only when
  ~1 screen away (`useNearEffect` in scenes.tsx). Result: blocking ~1.8 s, opening done ~2.5 s (was ~4.5 s).
- Remaining cost is WebGL context creation + first frame of the hero (~0.65 s + ~0.75 s).

## Owner/agent changes reviewed (2026-11-17)

- `deferred-scenes.tsx` lazy-loads scenes.tsx (first-load JS 302 → 115 kB); `hero-background.tsx` poster first,
  video after 1.8 s; font Noto_Sans (variable); new opening = dark screen, centred logo, sweep + circle wave (~1.3 s,
  uses gradients + old teal — owner's call).
- Fixed after review: JourneyScene also on phones (was disabled), starts 2 screens early (`useNear("200% 0px")`);
  model + Draco `<link rel="preload">` restored in page.tsx; journey shaders `compileAsync` right after setup.
