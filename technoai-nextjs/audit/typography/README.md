# Company typography verification - 16 November 2026

Reference: user-supplied `Techno ai.pdf`, page 8, "Typeface | Latin".

The specified family is **Noto Sans TC**, with Light (300), Regular (400), Medium (500), and Bold (700). The existing self-hosted `noto-sans-tc-latin.woff2` is a variable Noto Sans TC font supporting weights 100-900, including all four required weights.

The site already uses this family. No substitute font was introduced. The shared stylesheet now identifies the exact brand-guide reference.

Browser verification used the user's existing local Next.js server at port 3100. All 98 public routes were inspected, including the homepage, model-driven content, archived routes, forms, and previous homepage version. Across 11765 rendered text observations, there were **zero font-family mismatches**, and the Noto Sans TC font was loaded on every route. `font-check.json` contains the route-level results. Icon glyphs, vector artwork, code, and development overlays were excluded from the text-family check.

No application layout, font weight, logo artwork, media formatting, or animation logic was changed. The user's existing server was left running.
