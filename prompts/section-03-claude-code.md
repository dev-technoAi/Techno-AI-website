# Techno AI — Section 03 integration story

You are working in the existing Techno AI Next.js website. Implement and polish **Section 03 only**. First read `C:/Users/Hp/Downloads/TechnoAI_Website_3D_Design_Handoff.pdf` and `C:/Users/Hp/Downloads/Technoai/Techno ai.pdf`, then inspect the actual repository and running page. The approved visual direction is `output/section-03-integration-concept.png`. Use that image as a composition reference only; the website must render real interactive 3D objects, not the image as a background.

## Section intent

Show how Techno AI supplies and integrates the right combination of systems for client operations. Section 02 already presents three separate capability cards. Section 03 must tell an integration story in **one spacious editorial composition**, with copy on the left and one connected 3D ecosystem on the right. Do not repeat the Section 02 cards, a three-column layout, or three isolated category illustrations.

## Copy and layout

- Eyebrow: `SOLUTIONS BUILT AROUND REAL OPERATIONS`.
- Preserve the approved Section 03 headline and supporting copy in the current project or handoff unless there is a clear layout issue. The concept image uses shorter illustrative copy; its typography and composition are the reference, not necessarily its wording.
- White/off-white background, cool light-grey depth, dark charcoal text, and the official restrained Techno AI blue. Keep ample whitespace and a clean boundary between copy and 3D scene.
- Make the 3D ecosystem feel like a single engineered installation: a central AI processor, robotic arm/component, industrial camera or sensors, edge-computing hardware, and a small autonomous drone. Use realistic brushed metal and glass, delicate technical connections, and modest blue data pulses. Do not imply Techno AI manufactures these devices; the story is supply and integration.
- Use the supplied brand identity for logo, type and colors. Reuse the existing brand tokens and fonts. Do not invent a new logo or palette.

## Scroll choreography

Use the existing scroll progress/Lenis mechanism if present; avoid installing another scroll engine. The scene must look complete and intentional at every scroll position:

1. Entrance: a visible central processor and separated but clearly framed components float with restrained motion.
2. Assembly: as the section scrolls, components travel toward their final spatial arrangement, with staggered timing and smooth easing.
3. Connection: fine curved data paths draw from the components into the processor, and a small number of particles travel along them.
4. Integrated state: the final system holds together and gains a subtle blue illumination. Keep the final state visible long enough to read before the next section.

Use gentle camera parallax only where it improves depth. Avoid exaggerated spins, overlapping objects, cluttered labels, large glows, or a giant decorative base that dominates the section. If labels are useful, use a few precise labels anchored to components rather than card-like UI panels.

## Implementation boundaries and checks

- Inspect `app/redesign/ecosystem.tsx`, `ecosystem-scene.tsx`, `ecosystem.css`, the existing 3D helpers, page composition, available model assets and package versions before editing. Refine or replace the current Section 03 implementation as needed. Preserve approved Hero and Section 02.
- Use actual React Three Fiber geometry or optimized GLB/GLTF models. The generated product references in `output/3d-model-references/` can guide forms, but they are not substitutes for 3D assets. If an exact model is unavailable, make a clean engineered approximation and report it as such.
- Keep text legible and the 3D stage clear of copy and navigation at desktop, tablet and mobile widths. On mobile, simplify the scene and shorten the pinned scroll if needed.
- Respect `prefers-reduced-motion`. Provide a useful static or reduced-motion composition and a graceful WebGL fallback.
- Optimize geometry, textures, particle count and rendering for smooth scrolling. Avoid duplicate animation systems, memory leaks and unnecessary dependencies.
- Run the app and inspect Section 03 at desktop and mobile sizes, across beginning/middle/end scroll positions. Fix visual defects and console/runtime errors. Run the available build or typecheck. Report changed files, what is real 3D, any placeholder models, and remaining limitations.

Do not work on Section 04 or unrelated pages. Show screenshots of Section 03 after implementation so I can review it before you continue.
