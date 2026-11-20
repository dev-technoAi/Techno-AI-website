import { readFile } from "node:fs/promises";
import path from "node:path";

export const dynamic = "force-static";

// Stylesheet for the archived WordPress pages: Lenis base CSS + the shared site chrome (same header,
// menu and footer as the home page) + the dark re-skin of the Elementor content.
const FILES = ["app/brand-font.css", "node_modules/lenis/dist/lenis.css", "app/interior-kit/chrome.css", "app/interior-dark.css", "app/type-spacing.css", "app/interior-responsive.css", "app/shared-header.css", "app/interior-theme.css", "app/page-transition.css"];

export async function GET() {
  const parts = await Promise.all(FILES.map((f) => readFile(path.join(process.cwd(), f), "utf8")));
  return new Response(parts.join("\n"), {
    headers: {
      "Content-Type": "text/css; charset=utf-8",
      "Cache-Control": "public, max-age=0, must-revalidate",
    },
  });
}
