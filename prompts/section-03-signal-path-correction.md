# Claude Code — correct the current Section 03 implementation

The Signal Path concept is integrated, but the current live desktop result at `http://localhost:3100/redesign/` is not ready. Fix **Section 03 only** (`signal-path.tsx`, `signal-path-scene.tsx`, `signal-path.css` as needed). Preserve Hero, Section 02, Section 04 and approved copy. Inspect the page at the start, middle, final state and exit before editing.

Observed defects:

1. The path renders as a giant mostly grey metal band across much of the viewport. At the middle and end it expands into the headline and step-list regions. Reframe/rebuild the camera and path geometry so the conduit stays a restrained, clearly blue, engineered element in a dedicated lower/right visual zone. Keep clean negative space around the headline and step list at every scroll position. Avoid a CSS-only cover-up that hides the core interaction.
2. The stage starts with headline words at very low opacity, so the primary message looks disabled or unreadable. Keep readable contrast from the first visible frame. Any word-by-word reveal should finish quickly and should not leave most copy pale for a significant part of the section.
3. Scene labels such as `SENSE`, `DECIDE`, and `ACT` overlap the headline, list, and sometimes the navigation. Anchor and show labels only when their node is visible inside a safe scene area; hide them rather than clamping them into text zones.
4. At the final/exit stage the path moves out of frame and leaves a large blank gap before Section 04. Hold an intentional complete-system composition through the final scroll range and make the transition into Section 04 smooth.
5. The path's surface reads grey instead of the official Techno AI blue. Adjust material/lighting/tone mapping so blue remains visible without neon glow, while preserving believable satin metal detail.

Desired composition: off-white editorial page, legible copy at the top/left, three compact step labels in their own area, and one slim dimensional blue signal path in the lower/right area. Sense → Decide → Act remains the scroll story. Use the reference `output/section-03-signal-path-concept.png` for visual hierarchy, not as a website background. The section must use real React Three Fiber geometry.

Investigate the current `makeCurve`, `ribbonGeometry`, camera `nearDist`/`farDist`, focus tracking, stage container sizing, annotation projection, and title opacity calculation. Fix the causes rather than layering more gradients over them. Keep all motion tied to existing scroll progress and reversible. Ensure the end state remains visible until the transition. Reduce section scroll length if the corrected animation has less content to justify 360vh.

Verify desktop and mobile screenshots at beginning/middle/end, including the transition to Section 04. Check text contrast, no overlap, no clipping, no blank state, reduced-motion behavior and WebGL fallback. Run `npx tsc --noEmit` and browser console check. Report changed files and show screenshots before calling Section 03 done. Do not work on Section 04.
