import { cache } from "react";
import { readFile } from "node:fs/promises";
import path from "node:path";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import templated from "../../../content/templated.json";
import { ctaHtml, footerHtml, SOLUTION_LINKS } from "../../chrome";
import { Motion } from "../../interior-kit/motion";
import type { PageModel } from "../model";
import { PageHero, PageSections } from "../render";
import HeroNav from "../../redesign/hero-nav";

// Every archived WordPress page, rebuilt in the home page's design from its page model
// (content/models/*.json, made by scripts/build-page-models.mjs). next.config.mjs rewrites the
// public URL (/ai-robotics/) to this route (/p/ai-robotics/). Pages not in content/templated.json
// keep the themed WordPress HTML (app/[[...slug]]/route.ts).

export const dynamicParams = false;
const MODELS: Record<string, string> = templated;

export function generateStaticParams() {
  return Object.keys(MODELS).map((route) => ({ slug: route.split("/").filter(Boolean) }));
}

const load = cache(async (route: string): Promise<PageModel | null> => {
  const name = MODELS[route];
  if (!name) return null;
  return JSON.parse(await readFile(path.join(process.cwd(), "content", "models", `${name}.json`), "utf8"));
});

const routeOf = (slug: string[]) => `/${slug.map(decodeURIComponent).join("/")}/`;

export async function generateMetadata({ params }: { params: Promise<{ slug: string[] }> }): Promise<Metadata> {
  const model = await load(routeOf((await params).slug));
  if (!model) return {};
  return {
    title: model.title,
    description: model.description,
    alternates: model.canonical ? { canonical: model.canonical } : undefined,
    openGraph: { title: model.title, description: model.description, images: model.ogImage ? [model.ogImage] : undefined, url: model.canonical },
  };
}

const INDUSTRIES = ["/government-public-sector/", "/defense-security/", "/agriculture/", "/energy-infrastructure/", "/logistics-mobility/", "/research-and-development/", "/maritime/", "/oil-gas/", "/public-safety/", "/utilities/", "/industries/"];
const SERVICES = ["/services/", "/procurement/", "/integration/", "/project-management/", "/technical-support/", "/financial-services/", "/logistics-supply-chain/", "/installation/", "/training/", "/professional-services/"];

/** Small label above the page title when the page has none of its own. */
function groupOf(model: PageModel) {
  const r = model.route;
  if (model.kind === "post" || /\/(insights|news-updates|blogs|category|author|leadership-thoughts)\//.test(r)) return "Insights";
  if (/case-study/.test(r)) return "Case Study";
  if (r === "/solutions/" || SOLUTION_LINKS.some(([, h]) => h === r)) return "TechnoAi Solutions";
  if (INDUSTRIES.includes(r)) return "Industries We Serve";
  if (SERVICES.includes(r)) return "TechnoAi Services";
  if (r === "/partners/") return "Trusted by Organizations";
  return "TechnoAi";
}

export default async function Page({ params }: { params: Promise<{ slug: string[] }> }) {
  const model = await load(routeOf((await params).slug));
  if (!model) notFound();
  return (
    <>
      <Motion />
      <HeroNav />
      <main className="pg">
        <PageHero model={model} group={groupOf(model)} />
        <PageSections model={model} />
      </main>
      <div className="chrome" dangerouslySetInnerHTML={{ __html: ctaHtml + footerHtml }} />
    </>
  );
}
