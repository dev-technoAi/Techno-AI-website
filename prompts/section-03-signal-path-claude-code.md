# Techno AI — Section 03 Signal Path

Implement and polish **Section 03 only** in the existing Techno AI website. First inspect the current repository, running page, Section 02 and Section 03 components, existing React Three Fiber scene, scroll-progress/Lenis setup, dependencies, model assets, and brand tokens. Read these sources:

- `C:/Users/Hp/Downloads/TechnoAI_Website_3D_Design_Handoff.pdf`
- `C:/Users/Hp/Downloads/Technoai/Techno ai.pdf`
- `output/section-03-signal-path-concept.png`

The PNG is a **composition reference**, not an asset to display as a background. Build the scene in real 3D. Adapt the reference to the official Techno AI colors and typography; do not copy Notiune's branding or exact animation.

## Creative direction

Section 03 should tell the integration story through **one continuous, dimensional blue signal path**. It starts offscreen left, curves through depth across a spacious white/off-white stage, and leads the eye toward the next section. There are three restrained functional points along the path: **SENSE → DECIDE → ACT**. At SENSE, show a compact sensor or vision element integrated into the path. At DECIDE, show a small engineered AI processor integrated into the same path. At ACT, show an actuator or robotic endpoint. These are embedded nodes of one system, not separate floating product renders.

Use a confident editorial headline with generous whitespace. Keep the eyebrow `SOLUTIONS BUILT AROUND REAL OPERATIONS`. Preserve the approved Section 03 headline and supporting copy from the current project or handoff unless the user has already approved newer wording. The short copy in the sample image illustrates layout only. The story is Techno AI **supplying and integrating** technologies for customers; avoid claims that Techno AI manufactures them.

The visual should be clean and architectural: satin/brushed blue metal or glass-like conduit, soft realistic shadows, dark charcoal text, restrained blue highlights, sparse data particles, and small precise labels. Avoid a big floating product collage, three capability cards, a three-column layout, pedestal/display platform, glowing orb, robot mascot, heavy neon effects, and excessive labels. Section 02 remains the only three-card capability section.

## Scroll sequence

Build one pinned or controlled scroll story using the project's existing progress system. Keep motion tied to scroll position so it can reverse smoothly:

1. **Entry (0–25%)**: large headline and a clearly visible first stretch of the path. The SENSE node comes into view. A subtle pulse begins moving along the conduit.
2. **Travel (25–55%)**: camera moves gently along the path, or the path advances through the stage, revealing the DECIDE processor at the central bend. Typography and the first node remain readable; do not zoom so aggressively that the user loses context.
3. **Connection (55–80%)**: the pulse continues toward ACT. The three nodes light up in order; hairline data traces or a few particles reinforce flow without clutter.
4. **Exit (80–100%)**: the conduit leads toward the right/next section and the completed system holds for a moment. Transition out cleanly without abrupt jumps or a blank frame.

Make the path feel three-dimensional through depth, lighting and camera perspective. Implement it with efficient Three.js/R3F geometry (for example a curve and custom extrusion/tube profile), rather than a flat SVG or static image. Keep the curve smooth and mesh normals/shadows clean. The generated sample is a still of the intended visual language; the final interaction should feel polished in motion.

## Technical boundaries

- Refine or replace the current `app/redesign/ecosystem.tsx`, `ecosystem-scene.tsx`, and `ecosystem.css` only as needed. Preserve approved Hero, Section 02 and unrelated pages.
- Reuse current R3F, existing render helpers and Lenis/scroll progress. Do not add another smooth-scroll engine or duplicate animation framework.
- Use the official Techno AI logo, type and palette from existing assets/brand PDF. Do not invent a new logo or change the site's global theme.
- Keep copy outside the 3D object's hit area. No path or particle may cover important text or navigation.
- Build desktop, tablet and mobile layouts. On mobile, simplify geometry and camera motion while preserving the Sense → Decide → Act story.
- Respect `prefers-reduced-motion`; show a clear static composition with all three points visible. Provide a graceful fallback when WebGL is unavailable.
- Limit draw calls, particle count, material cost and device pixel ratio for smooth scroll. Dispose custom geometries/materials and remove listeners on unmount.

## Verification and deliverable

Run the app. Inspect Section 03 at the beginning, middle and end of its scroll range on desktop and mobile. Check console errors, hydration issues, layout overlap, transition into and out of the section, and the available build/typecheck. Fix issues found. Show screenshots or a short screen recording for review. Report exactly which files changed, what is real 3D, any placeholders, and any known limitations. **Stop after Section 03**; do not continue to Section 04.
