import { readFileSync } from "node:fs";

// Pages rebuilt in the new design (app/p, see scripts/build-page-models.mjs). Their public URL is
// rewritten to /p/...; every other URL still gets the themed WordPress page (app/[[...slug]]/route.ts).
const templated = JSON.parse(readFileSync(new URL("./content/templated.json", import.meta.url), "utf8"));

/** @type {import('next').NextConfig} */
const nextConfig = {
  // WordPress URLs end with a slash (/partners/), keep them identical.
  trailingSlash: true,
  poweredByHeader: false,
  // Ship the snapshotted HTML with the server build (needed on Vercel / serverless).
  outputFileTracingIncludes: {
    "/[[...slug]]": ["./content/**/*"],
    "/p/[...slug]": ["./content/models/**/*", "./content/templated.json"],
    "/brand.css": ["./node_modules/lenis/dist/lenis.css", "./app/brand-font.css", "./app/redesign/chrome.css", "./app/interior-dark.css"],
  },
  // Reuse unchanged media on repeat visits; files may still be replaced at the same URL.
  async headers() {
    return ["/redesign/solutions/:path*", "/redesign/domains/:path*", "/redesign/hero-film.jpg", "/redesign/hero-film.mp4", "/fonts/:path*", "/vendor/:path*", "/wp-content/uploads/:path*"].map((source) => ({
      source,
      headers: [{ key: "Cache-Control", value: "public, max-age=3600, stale-while-revalidate=86400" }],
    }));
  },
  // The new design (app/redesign) is the home page. The old WordPress home stays at /old-home/.
  async rewrites() {
    return {
      beforeFiles: [
        { source: "/", destination: "/redesign/" },
        ...Object.keys(templated).map((route) => ({ source: route.replace(/\/$/, ""), destination: `/p${route}` })),
      ],
    };
  },
};

export default nextConfig;
