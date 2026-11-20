import { readFile } from "node:fs/promises";
import path from "node:path";
import routes from "../../content/routes.json";
import { themeDocument } from "../theme-document";

// Every page of technoai.ae is served exactly as WordPress/Elementor rendered it.
// Pages are pre-rendered at build time; unknown paths get the site's own 404 page.
export const dynamic = "force-static";
export const dynamicParams = true; // unknown paths fall through to GET -> site 404 page

const PAGES_DIR = path.join(process.cwd(), "content", "pages");
// "/" now shows the redesign (rewrite in next.config.mjs); the old home page stays at /old-home/.
const routeMap: Record<string, string> = { ...(routes as Record<string, string>), "/old-home/": "index.html" };

// Pages that keep their WordPress content but get a live 3D model in the hero (owner, 2026-11-17).
// The model runs in its own small page (app/redesign/*-hero) shown in a transparent iframe inside the hero.
const HERO_MODELS: Record<string, { container: string; src: string; title: string }> = {
  "/ai-robotics/": { container: "elementor-element-0d18253", src: "/redesign/c40-hero/", title: "KEENON KLEENBOT C40 3D model" },
};

function addHeroModel(html: string, hero: { container: string; src: string; title: string }) {
  const style = `<style id="hero-model-css">
.${hero.container}{position:relative!important;overflow:hidden}
.${hero.container}::after{content:"";position:absolute;inset:0;background:rgba(9,18,30,.55);pointer-events:none;z-index:0}
.${hero.container}>*{position:relative;z-index:2}
.${hero.container}>.hero-model-frame{position:absolute!important;z-index:1;right:3%;top:96px;height:calc(100% - 250px);width:44%;border:0;background:transparent;color-scheme:normal}
@media(max-width:767px){.${hero.container}>.hero-model-frame{right:0;left:0;width:100%;top:84px;bottom:auto;height:42%}}
</style>`;
  const open = html.indexOf(`class="elementor-element ${hero.container} `);
  if (open < 0) return html;
  const end = html.indexOf(">", open) + 1;
  const frame = `<iframe class="hero-model-frame" src="${hero.src}" title="${hero.title}" loading="eager" allowtransparency="true"></iframe>`;
  return (html.slice(0, end) + frame + html.slice(end)).replace("</head>", `${style}</head>`);
}

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
  if (HERO_MODELS[key]) html = addHeroModel(html, HERO_MODELS[key]);
  if (key !== "/" && key !== "/old-home/") html = themeDocument(html, key);
  return new Response(html, {
    status: file ? 200 : 404,
    headers: { "Content-Type": "text/html; charset=UTF-8" },
  });
}
