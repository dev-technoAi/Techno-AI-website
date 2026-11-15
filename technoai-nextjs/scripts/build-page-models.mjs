// Turns every archived WordPress page (content/pages/*.html) into a small JSON "page model" that the
// redesigned page template (app/p/[...slug]/page.tsx) renders in the same design as the home page.
//
//   node scripts/build-page-models.mjs        -> content/models/<file>.json + content/templated.json
//
// A model keeps ALL visible content of the page (headings, text, lists, pictures, links, buttons,
// card grids, forms) but none of the Elementor layout. Pages the template cannot reproduce stay on the
// themed WordPress HTML (see SKIP / reasons in the report): WooCommerce, the quote page, contact cards.
// The report at the end shows, per page, how much of the original visible text made it into the model.

import { parse } from "node-html-parser";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1")), "..");
const PAGES = path.join(ROOT, "content", "pages");
const OUT = path.join(ROOT, "content", "models");
const PUBLIC = path.join(ROOT, "public");
const routes = JSON.parse(fs.readFileSync(path.join(ROOT, "content", "routes.json"), "utf8"));

// Routes that keep the themed WordPress page.
const SKIP = {
  "/": "home is app/redesign",
  "/request-a-quote/": "custom quote layout (theme-document.ts)",
  "/cart/": "WooCommerce",
  "/shop/": "WooCommerce",
  "/my-account/": "WooCommerce",
  "/checkout/": "WooCommerce",
};

// ---------------------------------------------------------------- helpers
const decode = (s) =>
  s.replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&#0?39;|&#8217;|&rsquo;/g, "’").replace(/&#8216;|&lsquo;/g, "‘")
    .replace(/&#8220;|&ldquo;/g, "“").replace(/&#8221;|&rdquo;/g, "”").replace(/&#8211;|&ndash;/g, "–").replace(/&#8212;|&mdash;/g, "—")
    .replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n));
const clean = (s) => decode(s).replace(/\s+/g, " ").trim();
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const cls = (el) => (el.getAttribute?.("class") || "").split(/\s+/);
const has = (el, c) => cls(el).includes(c);
const localUrl = (u) => {
  if (!u) return u;
  u = decode(u.trim().replace(/^['"]|['"]$/g, ""));
  return u.replace(/^https?:\/\/(www\.)?technoai\.ae(?=\/)/, "");
};
const hiddenOnDesktop = (el) => has(el, "elementor-hidden-desktop");

/** Inline HTML with only safe formatting kept: strong/b, em/i, a, br. */
function inline(el) {
  let out = "";
  for (const n of el.childNodes) {
    if (n.nodeType === 3) out += esc(decode(n.rawText));
    else if (n.nodeType === 1) {
      const tag = n.rawTagName?.toLowerCase();
      if (["script", "style", "svg", "noscript", "img"].includes(tag)) continue;
      if (tag === "br") out += "<br>";
      else if (tag === "strong" || tag === "b") out += `<strong>${inline(n)}</strong>`;
      else if (tag === "em" || tag === "i") out += `<em>${inline(n)}</em>`;
      else if (tag === "a" && n.getAttribute("href")) out += `<a href="${esc(localUrl(n.getAttribute("href")))}"${/^https?:/.test(localUrl(n.getAttribute("href"))) ? ' target="_blank" rel="noopener noreferrer"' : ""}>${inline(n)}</a>`;
      else out += inline(n);
    }
  }
  return out.replace(/\s+/g, " ").replace(/(<br>\s*)+$/g, "").trim();
}
const textOf = (html) => clean(html.replace(/<br>/g, " ").replace(/<[^>]+>/g, ""));

/** Elementor puts many pictures in CSS (background-image on an element id). Map id -> url. */
function backgroundMap(root) {
  let css = root.querySelectorAll("style").map((s) => s.rawText).join("\n");
  for (const l of root.querySelectorAll('link[rel="stylesheet"], link[as="style"]')) {
    const href = l.getAttribute("href") || l.getAttribute("data-href");
    if (!href || /^https?:\/\/(?!(www\.)?technoai\.ae)/.test(href)) continue;
    const file = path.join(PUBLIC, localUrl(href).split("?")[0]);
    if (fs.existsSync(file)) css += "\n" + fs.readFileSync(file, "utf8");
  }
  const map = new Map();
  // desktop rules come first; media-query overrides later are ignored because we keep the first hit
  const re = /([^{}]*)\{([^{}]*background-image\s*:\s*url\(([^)]+)\)[^{}]*)\}/g;
  let m;
  while ((m = re.exec(css))) {
    const sel = m[1];
    const url = localUrl(m[3]);
    if (/^data:/.test(url)) continue;
    for (const idm of sel.matchAll(/elementor-element-([0-9a-f]{6,8})|\.e-([0-9a-f]{7})-[0-9a-f]{7}/g)) {
      const id = idm[1] || idm[2];
      if (!map.has(id)) map.set(id, url);
    }
  }
  return map;
}
const elId = (el) => el.getAttribute?.("data-id") || el.getAttribute?.("data-interaction-id") || null;

// ---------------------------------------------------------------- block extraction
/**
 * Walks an element and returns content blocks in reading order:
 *  {t:"eyebrow",text} {t:"h",level,html} {t:"p",html} {t:"ul",items:[html]} {t:"img",src,alt}
 *  {t:"btn",text,href} {t:"icon",svg} {t:"grid",items:[card]} {t:"form",...} {t:"video",src}
 */
function walk(el, ctx, out = []) {
  for (const n of el.childNodes) {
    if (n.nodeType === 3) {
      const t = clean(n.rawText);
      // loose text inside a widget container (text editor without <p>)
      if (t && t.length > 1 && n.parentNode && !/^(script|style)$/i.test(n.parentNode.rawTagName || "")) out.push({ t: "p", html: esc(t) });
      continue;
    }
    if (n.nodeType !== 1) continue;
    const tag = n.rawTagName.toLowerCase();
    if (["script", "style", "noscript", "template", "link", "meta"].includes(tag)) continue;
    if (hiddenOnDesktop(n)) continue;
    if (n.getAttribute("aria-hidden") === "true" && tag !== "svg") continue;
    if (has(n, "elementor-screen-only") || has(n, "screen-reader-text")) continue;

    // background picture on this element (cards often use an empty container with a photo)
    const id = elId(n);
    const bg = id && ctx.bg.get(id);
    if (bg && n !== ctx.section) out.push({ t: "img", src: bg, alt: "", bg: true });

    if (tag === "form") { const f = formModel(n); if (f) out.push(f); continue; }
    if (isGrid(n, ctx)) { out.push({ t: "grid", items: gridItems(n, ctx) }); continue; }

    if (/^h[1-6]$/.test(tag) || tag === "summary") {
      const html = inline(n);
      if (!textOf(html)) continue;
      if (has(n, "colortextsmall") || has(n, "colortextsmallW")) out.push({ t: "eyebrow", text: textOf(html) });
      else out.push({ t: "h", level: tag === "summary" ? 4 : +tag[1], html });
      continue;
    }
    if (tag === "p" || (tag === "div" && has(n, "e-paragraph-base"))) {
      const html = inline(n);
      if (!textOf(html)) { walkImagesOnly(n, ctx, out); continue; }
      if (has(n, "colortextsmall") || has(n, "colortextsmallW")) out.push({ t: "eyebrow", text: textOf(html) });
      else out.push({ t: "p", html });
      walkImagesOnly(n, ctx, out);
      continue;
    }
    if (tag === "ul" || tag === "ol") {
      const items = n.querySelectorAll(":scope > li").map((li) => inline(li)).filter((h) => textOf(h));
      if (items.length) out.push({ t: "ul", items, ordered: tag === "ol" });
      continue;
    }
    if (tag === "img") {
      const src = localUrl(n.getAttribute("data-src") || n.getAttribute("src"));
      if (src && !/^data:/.test(src)) {
        const w = +(n.getAttribute("width") || 0);
        out.push({ t: "img", src, alt: clean(n.getAttribute("alt") || ""), small: w > 0 && w < 160 });
      }
      continue;
    }
    if (tag === "svg") {
      if (n.closest?.(".elementor-icon, .e-svg-base, .elementor-icon-list-icon, .elementor-icon-box-icon")) {
        out.push({ t: "icon", svg: n.toString().replace(/\s(fill|stroke)="(?!none)[^"]*"/g, ' $1="currentColor"').replace(/\sclass="[^"]*"/g, "") });
      }
      continue;
    }
    if (tag === "iframe" || tag === "video") {
      const src = localUrl(n.getAttribute("src") || n.getAttribute("data-src") || n.querySelector?.("source")?.getAttribute("src"));
      if (src) out.push({ t: "video", src, iframe: tag === "iframe" });
      continue;
    }
    if (tag === "a" && (has(n, "elementor-button") || has(n, "e-button-base") || has(n, "button") || has(n, "elementor-post__read-more"))) {
      const text = clean(n.text);
      const href = localUrl(n.getAttribute("href") || "");
      if (text) out.push({ t: "btn", text, href });
      continue;
    }
    if (tag === "button") continue; // UI chrome (sliders, toggles) — no content
    walk(n, ctx, out);
  }
  return out;
}
function walkImagesOnly(n, ctx, out) {
  for (const img of n.querySelectorAll("img")) {
    const src = localUrl(img.getAttribute("data-src") || img.getAttribute("src"));
    if (src && !/^data:/.test(src)) out.push({ t: "img", src, alt: clean(img.getAttribute("alt") || "") });
  }
}

/**
 * Repeated items: >= 2 direct children that each hold one heading (or two, when all of them do —
 * e.g. a title plus a "View All →" link styled as a heading).
 */
function isGrid(el, ctx) {
  const kids = el.childNodes.filter((k) => k.nodeType === 1 && !hiddenOnDesktop(k) && !/^(script|style)$/i.test(k.rawTagName));
  if (kids.length < 2) return false;
  const heads = (k) => k.querySelectorAll("h1,h2,h3,h4,h5,h6").filter((h) => !h.closest(".elementor-hidden-desktop") && clean(h.text)).length;
  const counts = kids.filter((k) => !/^h[1-6]$/i.test(k.rawTagName)).map(heads);
  const ones = counts.filter((c) => c === 1).length;
  const twos = counts.filter((c) => c === 2).length;
  return (ones >= 2 && ones >= kids.length * 0.6) || (twos >= 2 && twos >= kids.length * 0.6);
}
function gridItems(el, ctx) {
  const items = [];
  for (const k of el.childNodes) {
    if (k.nodeType !== 1 || hiddenOnDesktop(k)) continue;
    const blocks = walk(k, ctx, []);
    const bgOwn = ctx.bg.get(elId(k));
    if (bgOwn) blocks.unshift({ t: "img", src: bgOwn, alt: "", bg: true });
    const h = blocks.find((b) => b.t === "h");
    if (!h) { if (blocks.some((b) => b.t === "p")) items.push({ text: blocks.filter((b) => b.t === "p").map((b) => b.html) }); continue; }
    const link = k.rawTagName === "a" ? k : k.querySelector("a[href]");
    const heads = blocks.filter((b) => b.t === "h");
    const linkHead = heads[1] && /<a /.test(heads[1].html) ? heads[1] : null;
    const btn = blocks.find((b) => b.t === "btn") || (linkHead && { text: textOf(linkHead.html).replace(/\s*[→>]+$/, ""), href: linkHead.html.match(/href="([^"]+)"/)?.[1] });
    items.push({
      title: h.html,
      eyebrow: blocks.find((b) => b.t === "eyebrow")?.text,
      text: blocks.filter((b) => b.t === "p").map((b) => b.html),
      list: blocks.filter((b) => b.t === "ul").flatMap((b) => b.items),
      image: blocks.find((b) => b.t === "img" && !b.small)?.src,
      icon: blocks.find((b) => b.t === "icon")?.svg,
      href: btn?.href || (link ? localUrl(link.getAttribute("href")) : undefined),
      cta: btn?.text,
    });
  }
  return items;
}

function formModel(form) {
  const hidden = {};
  for (const i of form.querySelectorAll('input[type="hidden"]')) hidden[i.getAttribute("name")] = i.getAttribute("value") || "";
  if (!hidden.form_id) return null; // not an Elementor Pro form
  const fields = [];
  for (const g of form.querySelectorAll(".elementor-field-group")) {
    if (has(g, "elementor-field-type-submit")) continue;
    const input = g.querySelector("input, select, textarea");
    if (!input || input.getAttribute("type") === "hidden") continue;
    const label = clean(g.querySelector("label")?.text || input.getAttribute("placeholder") || "");
    fields.push({
      name: input.getAttribute("name"),
      type: input.rawTagName.toLowerCase() === "input" ? input.getAttribute("type") || "text" : input.rawTagName.toLowerCase(),
      label,
      placeholder: input.getAttribute("placeholder") || label,
      required: input.hasAttribute("required") || has(g, "elementor-field-required"),
      options: input.rawTagName.toLowerCase() === "select" ? input.querySelectorAll("option").map((o) => ({ value: o.getAttribute("value") ?? clean(o.text), label: clean(o.text) })) : undefined,
    });
  }
  const submit = clean(form.querySelector('button[type="submit"]')?.text || "Submit");
  return { t: "form", name: form.getAttribute("name") || "Form", hidden, fields, submit };
}

// ---------------------------------------------------------------- page model
function buildModel(route, file) {
  const html = fs.readFileSync(path.join(PAGES, file), "utf8");
  const root = parse(html, { comment: false });
  const body = root.querySelector("body");
  const bodyCls = cls(body);
  if (bodyCls.includes("woocommerce-page") || bodyCls.includes("woocommerce-cart")) return { skip: "WooCommerce" };
  if (root.querySelector(".e-link-in-bio")) return { skip: "contact card (link in bio)" };

  const meta = (sel, attr = "content") => root.querySelector(sel)?.getAttribute(attr) || undefined;
  const model = {
    route,
    file,
    title: clean(root.querySelector("title")?.text || ""),
    description: meta('meta[name="description"]') || meta('meta[property="og:description"]'),
    canonical: meta('link[rel="canonical"]', "href"),
    ogImage: meta('meta[property="og:image"]'),
    kind: bodyCls.includes("single-post") ? "post" : "page",
    date: meta('meta[property="article:published_time"]'),
    hero: null,
    sections: [],
  };

  const ctx = { bg: backgroundMap(root), section: null };
  // content roots: Elementor documents except header/footer/popups (outermost only)
  let roots = root.querySelectorAll("[data-elementor-type]").filter((d) => !["header", "footer", "popup"].includes(d.getAttribute("data-elementor-type")));
  roots = roots.filter((r) => !roots.some((o) => o !== r && o.querySelectorAll("[data-elementor-type]").includes(r)));

  // sections = the direct children of each Elementor document (unwrapping single wrapper divs)
  const kidsOf = (el) => el.childNodes.filter((k) => k.nodeType === 1 && !/^(script|style|link)$/i.test(k.rawTagName));
  let sectionEls = [];
  for (const r of roots) {
    let kids = kidsOf(r);
    while (kids.length === 1 && !has(kids[0], "e-con") && !has(kids[0], "elementor-top-section") && kidsOf(kids[0]).length) kids = kidsOf(kids[0]);
    sectionEls.push(...kids.filter((k) => !hiddenOnDesktop(k)));
  }

  let sections = sectionEls.map((s) => {
    ctx.section = s;
    const blocks = walk(s, ctx, []);
    return { bg: ctx.bg.get(elId(s)), blocks };
  });

  // plain WordPress pages (no Elementor): title + content
  if (!sections.length) {
    const main = root.querySelector("main") || body;
    ctx.section = main;
    const blocks = walk(main, ctx, []);
    sections = [{ blocks }];
  }

  // drop the old footer-like / site map blocks if a template leaked them in
  sections = sections.filter((s) => !s.blocks.some((b) => b.t === "h" && /^(site map|where we are)$/i.test(textOf(b.html))));
  sections = sections.filter((s) => s.blocks.length);

  // hero = first section's eyebrow + first heading + following text/buttons, picture = its background
  const first = sections[0];
  if (first) {
    const blocks = first.blocks;
    const hIdx = blocks.findIndex((b) => b.t === "h");
    const hero = { eyebrow: undefined, title: "", lead: [], buttons: [], image: first.bg };
    let cut = 0;
    if (hIdx >= 0 && hIdx <= 2) {
      hero.eyebrow = blocks.slice(0, hIdx).find((b) => b.t === "eyebrow")?.text;
      hero.title = blocks[hIdx].html;
      let i = hIdx + 1;
      for (; i < blocks.length; i++) {
        const b = blocks[i];
        if (b.t === "p" && hero.lead.length < 3) hero.lead.push(b.html);
        else if (b.t === "btn") hero.buttons.push({ text: b.text, href: b.href });
        else if (b.t === "img" && !hero.image && !b.small) hero.image = b.src;
        else if (b.t === "eyebrow" && !hero.eyebrow) hero.eyebrow = b.text;
        else break;
      }
      cut = i;
    }
    if (!hero.title) hero.title = esc(model.title.replace(/\s*[-–|]\s*TechnoAi\s*$/i, ""));
    model.hero = hero;
    const rest = blocks.slice(cut);
    if (rest.length) sections[0] = { ...first, blocks: rest };
    else sections.shift();
  }
  // empty WordPress pages still get a title hero
  if (!model.hero) model.hero = { title: esc(model.title.replace(/\s*[-–|]\s*TechnoAi\s*$/i, "")), lead: [], buttons: [] };
  model.sections = sections.map((s) => ({ blocks: s.blocks }));
  return model;
}

// ---------------------------------------------------------------- run
fs.mkdirSync(OUT, { recursive: true });
const templated = {};
const report = [];
const visibleWords = (html) => {
  const r = parse(html);
  const roots = r.querySelectorAll("[data-elementor-type]").filter((d) => !["header", "footer", "popup"].includes(d.getAttribute("data-elementor-type")));
  const scope = roots.length ? roots : [r.querySelector("main") || r.querySelector("body")];
  const txt = scope.map((s) => {
    s.querySelectorAll("script,style,noscript,.elementor-hidden-desktop,.elementor-screen-only,form,[aria-hidden=true]").forEach((x) => x.remove());
    return decode(s.toString().replace(/<[^>]+>/g, " "));
  }).join(" ");
  return new Set(clean(txt).toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 3));
};
for (const [route, file] of Object.entries(routes)) {
  if (SKIP[route]) { report.push([route, "skip", SKIP[route]]); continue; }
  let model;
  try { model = buildModel(route, file); } catch (e) { report.push([route, "ERROR", e.message]); continue; }
  if (model.skip) { report.push([route, "skip", model.skip]); continue; }
  const name = file.replace(/\.html$/, "");
  fs.writeFileSync(path.join(OUT, name + ".json"), JSON.stringify(model));
  templated[route] = name;
  // coverage: share of the original's visible words that exist in the model
  const orig = visibleWords(fs.readFileSync(path.join(PAGES, file), "utf8"));
  const mine = new Set(clean(JSON.stringify(model).replace(/<[^>]+>/g, " ")).toLowerCase().split(/[^a-z0-9]+/));
  const missing = [...orig].filter((w) => !mine.has(w));
  report.push([route, "ok", `${model.sections.length} sections, coverage ${orig.size ? Math.round(100 - (missing.length / orig.size) * 100) : 100}%${missing.length ? " missing: " + missing.slice(0, 8).join(",") : ""}`]);
}
fs.writeFileSync(path.join(ROOT, "content", "templated.json"), JSON.stringify(templated, null, 1));
for (const r of report) console.log(r.join(" | "));
console.log(`\n${Object.keys(templated).length} pages templated, ${report.filter((r) => r[1] !== "ok").length} kept as WordPress`);
