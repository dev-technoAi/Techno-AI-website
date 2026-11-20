import { readFileSync } from "node:fs";

const interiorPages = JSON.parse(readFileSync(new URL("./content/templated.json", import.meta.url), "utf8"));

/** @type {import('next').NextConfig} */
const nextConfig = {
  // hide the Next.js "N" dev-tools button / issues badge in `npm run dev` (owner, 2026-11-18); errors still show in the browser console
  devIndicators: false,
  // Allow verification builds without overwriting a running preview.
  distDir: process.env.NEXT_BUILD_DIR || ".next",
  // WordPress URLs end with a slash (/partners/), keep them identical.
  trailingSlash: true,
  poweredByHeader: false,
  async headers() {
    return [
      // Cache static media on repeat visits; keep page HTML under Next.js cache control.
      ...["landing", "hero", "industries", "journey", "models", "draco", "capabilities", "globe", "solutions"].map(directory => ({
        source: `/redesign/${directory}/:path*`,
        headers: [{ key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" }],
      })),
      { source: "/wp-content/:path*", headers: [{ key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" }] },
      { source: "/redesign/spline/robot-13bd456a.splinecode", headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }] },
      { source: "/redesign/spline/runtime-2.0.129/:file*", headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }] },
    ];
  },
  // Ship the snapshotted HTML with the server build (needed on Vercel / serverless).
  outputFileTracingIncludes: {
    "/[[...slug]]": ["./content/**/*"],
    "/p/[...slug]": ["./content/models/**/*", "./content/templated.json"],
    "/brand.css": ["./node_modules/lenis/dist/lenis.css", "./app/brand-font.css", "./app/interior-kit/chrome.css", "./app/interior-dark.css", "./app/type-spacing.css", "./app/interior-responsive.css", "./app/shared-header.css", "./app/interior-theme.css", "./app/page-transition.css"],
  },
  // The new design (app/redesign) is the home page. The old WordPress home stays at /old-home/.
  async rewrites() {
    return {
      beforeFiles: [
        { source: "/", destination: "/redesign/" },
        ...Object.keys(interiorPages).filter(route => route !== "/").map(route => ({
          source: route.replace(/\/$/, ""), destination: `/p${route}`,
        })),
      ],
    };
  },
};

export default nextConfig;
