import { readFile } from "node:fs/promises";
import path from "node:path";
import routes from "../../content/routes.json";
import { themeDocument } from "../theme-document";

// Preserve the archived page content with the shared homepage design system.
// Pages are pre-rendered at build time; unknown paths get the site's own 404 page.
export const dynamic = "force-static";
export const dynamicParams = true; // unknown paths fall through to GET -> site 404 page

const PAGES_DIR = path.join(process.cwd(), "content", "pages");
// "/" now shows the redesign (rewrite in next.config.mjs); the old home page stays at /old-home/.
const routeMap: Record<string, string> = { ...(routes as Record<string, string>), "/old-home/": "index.html" };

export function generateStaticParams() {
  return Object.keys(routeMap).map((p) => ({
    slug: p.split("/").filter(Boolean),
  }));
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug?: string[] }> },
) {
  const { slug = [] } = await params;
  const key = slug.length ? `/${slug.map(decodeURIComponent).join("/")}/` : "/";
  const file = routeMap[key];
  let html = await readFile(path.join(PAGES_DIR, file ?? "_404.html"), "utf8");
  // Pages with the Elementor atomic form get small data fixes (see public/technoai-form-fixes.js).
  if (html.includes("e-form-base")) {
    html = html.replace("</body>", '<script src="/technoai-form-fixes.js" defer></script></body>');
  }
  html = themeDocument(html, key);
  return new Response(html, {
    status: file ? 200 : 404,
    headers: { "Content-Type": "text/html; charset=UTF-8" },
  });
}
