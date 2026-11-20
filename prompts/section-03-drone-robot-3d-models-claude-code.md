# Claude Code task — two real 3D product models for the current Section 03

The old Section 03 Signal Path has been removed. The former Section 04 **Solutions journey** is now the third visible section of the Techno AI home page. Work on that current section only. The user has selected the exact drone and robot references below and wants **real 3D models**, not still images or videos.

## First inspect

Read `CLAUDE.md`, then inspect the current repository and running page at `http://localhost:3100/redesign/`. Check `app/redesign/page.tsx`, `data.ts`, `scenes.tsx`, `models.ts`, the existing `modelFor`/`REAL_MODELS` loading path, and available Magnific image-to-3D tools. The current journey contains six solution slots; create and integrate only the `robot` and `drone` models in this pass. Preserve the existing section layout, copy, navigation, scroll behavior, brand styling, and the other four solution slots. Do not restore the removed Signal Path section.

## Reference images and fidelity

**Drone — make `drone.glb`:**

- Primary geometry and appearance reference: `C:/Users/Hp/Downloads/Technoai/Techno AI main website/output/3d-model-references/drone-approved-reference.png` (the exact drone image the user just attached).
- Section composition reference only: `C:/Users/Hp/Downloads/Technoai/Techno AI main website/output/section-04-product-showroom-drone-reference.png`. This is a mockup, not a 3D asset and not a replacement for the primary drone reference.
- Preserve the visible grey angular body, four arms, four motors with two-blade propellers, short landing legs, prominent front multi-lens gimbal/sensor block, front-facing small lenses, and small green status light. Keep realistic proportions, material colors and camera position. Do not substitute a generic drone, add long landing skids, change the body silhouette, or invent a logo.

**Robot — make `robot.glb`:**

- Clean isolated reference: `C:/Users/Hp/Downloads/Technoai/Techno AI main website/output/3d-model-references/kleenbot-c40-front-three-quarter.png`.
- Original product photo for identity and visible details: `C:/Users/Hp/Downloads/Technoai/Techno AI main website/technoai-nextjs/public/wp-content/uploads/2026/07/C40.jpg`.
- Model the compact KEENON C40-style autonomous cleaning robot shown in those references: grey upright rounded body, large black front face/display with two blue eyes, dark lower cleaning base, visible front brushes, top emergency-stop button, front sensors and side ring/detail. Preserve its real product proportions. Do not use the existing humanoid mascot placeholder or turn it into a robot arm.

The references show mostly front/three-quarter views. Build hidden surfaces conservatively and consistently, but do not claim exact unseen geometry. Avoid inaccurate AI-generated text or logos; use original source artwork only where it is clear and licensed for this project.

## Required 3D workflow

1. Use the connected Magnific image-to-3D capability if it can create/export real mesh assets. Follow the project's `CLAUDE.md` credit rule before paid generation. If Magnific cannot export a usable 3D model, use Blender or another actual 3D modeling workflow. Do **not** replace this with a flat PNG plane, video, sprite, CSS 3D illusion, or a few crude Three.js primitives.
2. Produce actual, self-contained GLB files at:
   - `technoai-nextjs/public/redesign/models/drone.glb`
   - `technoai-nextjs/public/redesign/models/robot.glb`
3. Inspect each model in a 3D viewer from front, side, back and top. Check silhouette, propeller count/placement, gimbal detail, robot face/body/base, normals, textures, transparent surfaces, scale and origin. Repair obvious generated-mesh defects. Save preview renders/turntables for the user's review.
4. Optimize for the website without erasing distinctive details: sensible texture sizes, no unnecessary hidden geometry, reasonable triangle count, embedded or correctly referenced textures, and no broken external file dependencies. Report each GLB's file size and approximate triangle count.

## Integration

- Use the existing `modelFor` loader, or minimally improve it if necessary. Add only `"robot"` and `"drone"` to `REAL_MODELS`. Do not replace the other four models in this pass.
- Ensure the real models are centered, scaled and oriented correctly for the current Solutions journey. The C40 should visually rest on the stage rather than look like a floating humanoid. The drone may hover gently. Preserve the product geometry exactly; stage placement and subtle animation may be adjusted to display it well.
- If the drone propellers are separate mesh nodes, rotate them subtly. If not, keep them still instead of distorting the model. Avoid exaggerated spins or camera movement that hides the distinctive front camera and robot face.
- The page must never silently show a broken or missing model. Keep the existing placeholder as a fallback only if loading fails, and report any loading failure clearly during development.

## Verification and stop point

Run the website and inspect both active stations at desktop and mobile sizes. Confirm the actual GLBs load in the browser, interact correctly with the existing scroll scene, do not overlap copy/navigation, and show the correct product rather than the old placeholder. Check console errors, run `npx tsc --noEmit` and the available build. Show the user side-by-side reference and final model renders plus screenshots of both website stations. Report changed files, model sizes and any reference details that could not be reproduced. Stop after the drone and robot; do not generate or alter the other four solution models yet.
