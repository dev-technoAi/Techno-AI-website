import { ctaHtml, footerHtml } from "./chrome";
import { sharedHeaderHtml as headerHtml } from "./shared-header-html";
import { THEME_BOOT_SCRIPT } from "./theme-preference";

// Same as ARRIVE_SCRIPT in app/redesign/layout.tsx: JS-on flag + keep the page-transition curtain up.
const ARRIVE_SCRIPT =
  "<script>var d=document.documentElement;d.classList.add('js');try{if(sessionStorage.getItem('tai-px')==='1')d.classList.add('arriving')}catch(e){}</script>";

const VOID = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"]);

/** Add layout hooks without changing the original content, IDs, links or form markup. */
export function themeDocument(html: string, route = "") {
  // The brand stylesheet supplies the same local Noto Sans TC on every archived page.
  html = html.replace(/<link\b[^>]*href=["']https:\/\/fonts\.googleapis\.com\/[^"']*["'][^>]*>/gi, "");
  // The snapshot contains an obsolete second smooth-scroll engine and its perpetual RAF loop.
  // Remove only that known initializer; keep forms, analytics and Elementor widgets intact.
  html = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, script => {
    const encoded = script.match(/data:text\/javascript;base64,([^"']+)/)?.[1];
    const source = encoded ? Buffer.from(encoded, "base64").toString("utf8") : script;
    return /studio-freight\/lenis@0\.2\.28|const lenis=new Lenis\(\{duration:1\.2/.test(source) ? "" : script;
  });
  // every page ends with the shared call to action, except the quote form it points to
  const endChrome = route === "/request-a-quote/" ? footerHtml : ctaHtml + footerHtml;
  if (route === "/request-a-quote/") html = premiumQuotePage(html);
  // Keep decorative pale discs separate from the foreground when recolouring icons.
  html = html.replace(/<svg\b[\s\S]*?<\/svg>/gi, (svg) => {
    const discClasses = [...svg.matchAll(/\.([\w-]+)\s*\{[^}]*fill:\s*#d5f2f3\s*;/gi)].map((match) => match[1]);
    if (!discClasses.length) return svg;
    return svg.replace(/<circle\b[^>]*>/gi, (circle) => {
      const classes = circle.match(/\bclass=["']([^"']*)["']/)?.[1].split(/\s+/) ?? [];
      return classes.some((name) => discClasses.includes(name))
        ? circle.replace(/(\/?>)$/, ' data-icon-disc="true"$1') : circle;
    });
  });
  let heroAssigned = false;
  const stack: { tag: string; grid: boolean; icon: boolean }[] = [];
  const oldHeader = /<header\b[^>]*data-elementor-type=["']header["'][\s\S]*?<\/header>/i;
  const oldFooter = /<footer\b[^>]*data-elementor-type=["']footer["'][\s\S]*?<\/footer>/i;
  // Standalone contact-card and menu templates do not include WordPress chrome.
  if (!oldHeader.test(html)) html = html.replace(/<body\b[^>]*>/i, (tag) => `${tag}${headerHtml}<div class="brand-content">`);
  if (!oldFooter.test(html)) html = html.replace(/<\/body>/i, `</div>${endChrome}</body>`);
  const themed = html.replace(oldHeader,
    `${headerHtml}<div class="brand-content">`)
    .replace(oldFooter,
      `</div>${endChrome}`);
  let inContent = false;
  const annotated = themed.replace(/<script\b[\s\S]*?<\/script>|<style\b[\s\S]*?<\/style>|<!--[\s\S]*?-->|<\/?[a-z][^>]*>/gi, (token) => {
    if (token === '<div class="brand-content">') inContent = true;
    if (/^<footer\b/i.test(token) && /class="fo"/.test(token)) inContent = false;
    if (/^<style\b/i.test(token) && stack.at(-1)?.icon) {
      return normalizePaint(token).replace(/(<style\b[^>]*>)([\s\S]*?)(<\/style>)/i, (_all, start, css, end) =>
        start + css.replace(/(^|})\s*([^{}]+)\{/g, (_rule: string, previous: string, selectors: string) =>
          `${previous}${selectors.split(",").map((selector: string) => `.brand-icon ${selector.trim()}`).join(",")} {`) + end);
    }
    if (/^<(script|style)\b|^<!--/i.test(token)) return token;
    const closing = /^<\//.test(token);
    const tag = token.match(/^<\/?([a-z][\w-]*)/i)?.[1].toLowerCase();
    if (!tag) return token;
    if (closing) {
      const index = stack.map((entry) => entry.tag).lastIndexOf(tag);
      if (index >= 0) stack.length = index;
      return token;
    }
    const classes = token.match(/\bclass=(['"])(.*?)\1/i)?.[2].split(/\s+/) ?? [];
    const icon = Boolean(stack.at(-1)?.icon) || classes.some((name) => ["elementor-icon", "e-svg-base", "elementor-icon-list-icon"].includes(name));
    const grid = classes.includes("e-grid") || classes.includes("elementor-loop-container") || classes.includes("products");
    const hooks: string[] = [];
    if (inContent) {
      if (icon && tag === "svg") hooks.push("brand-icon");
      if (classes.includes("e-parent")) {
        hooks.push("brand-section");
        if (!heroAssigned) { hooks.push("brand-hero"); heroAssigned = true; }
      }
      if (grid) hooks.push("brand-grid");
      const cardContainer = classes.includes("e-con") || classes.includes("product") || tag === "article" || tag === "li";
      if ((stack.at(-1)?.grid && cardContainer) || classes.some((name) => name.startsWith("solution-")) || classes.includes("e-loop-item")) {
        hooks.push("brand-card");
      }
    }
    if (icon && inContent) token = normalizePaint(token);
    if (!VOID.has(tag) && !token.endsWith("/>")) stack.push({ tag, grid, icon });
    if (!hooks.length) return token;
    return /\bclass=/.test(token)
      ? token.replace(/\bclass=(['"])(.*?)\1/i, (_all, quote, value) => `class=${quote}${value} ${hooks.join(" ")}${quote}`)
      : token.replace(/>$/, ` class="${hooks.join(" ")}">`);
  });
  return annotated
    // Some archived WooCommerce templates link to #content without providing that target.
    .replace('<div class="brand-content">', /\bid=["']content["']/i.test(annotated)
      ? '<div class="brand-content">'
      : '<div class="brand-content" id="content" tabindex="-1">')
    .replace(/<body\b([^>]*)>/i, (tag, attrs: string) => /\bclass=/.test(attrs)
      ? tag.replace(/\bclass=(['"])(.*?)\1/i, (_all: string, quote: string, value: string) => `class=${quote}${value} brand-site${quote}`)
      : `<body${attrs} class="brand-site">`)
    .replace(/<\/head>/i, `<link rel="stylesheet" href="/brand.css?v=dual-theme-1" /><script>${THEME_BOOT_SCRIPT}</script>${ARRIVE_SCRIPT}</head>`)
    .replace(/<\/body>/i, '<script src="/vendor/lenis.min.js?v=1.3.27" defer></script><script src="/site.js?v=playback-2" defer></script><script src="/brand-select.js?v=dark-1" defer></script></body>');
}

function normalizePaint(markup: string) {
  const paint = (value: string) => /^(none|currentcolor|transparent|url\(|var\()/i.test(value.trim()) ? value : "currentColor";
  return markup.replace(/\b(fill|stroke)=(['"])(.*?)\2/gi, (_all, prop, quote, value) => `${prop}=${quote}${paint(value)}${quote}`)
    .replace(/\b(fill|stroke)\s*:\s*([^;}"']+)/gi, (_all, prop, value) => `${prop}: ${paint(value)}`);
}

function premiumQuotePage(html: string) {
  const form = html.match(/<form\b[^>]*class="elementor-form"[\s\S]*?<\/form>/i)?.[0];
  const widget = html.match(/<div\b[^>]*data-widget_type="form\.default"[^>]*>/i)?.[0];
  if (!form || !widget) return html;
  const labeledForm = form.replace(/elementor-screen-only/g, "");
  const content = `<main id="content" class="quote-page">
    <div class="wrap quote-layout">
      <aside class="quote-intro">
        <p class="eyebrow"><span aria-hidden="true">//:</span> A conversation. A new possibility.</p>
        <h1>Let’s build<br />what’s <em>next.</em></h1>
        <p class="quote-lead">Tell us about your project. We’ll help bring the right technology, systems and expertise together.</p>
        <ol class="quote-steps">
          <li><span>01</span><div><h3>Share your vision</h3><p>Your goals, your requirements, your next challenge.</p></div></li>
          <li><span>02</span><div><h3>Connect with our team</h3><p>Explore the technologies that fit your operation.</p></div></li>
          <li><span>03</span><div><h3>Shape the solution</h3><p>A considered approach, built around your project.</p></div></li>
        </ol>
        <a class="quote-explore" href="/solutions/">Explore our solutions <span aria-hidden="true">↗</span></a>
      </aside>
      <section class="quote-panel" aria-labelledby="quote-title">
        <div class="quote-panel-head"><p class="eyebrow">Start a project</p><span class="brand-mark" aria-hidden="true"></span></div>
        <h2 id="quote-title">A little about your project.</h2>
        <p class="quote-caption">Share a few details and our team will be in touch. Fields marked * are required.</p>
        <div data-elementor-type="wp-page" data-elementor-id="88" class="elementor elementor-88">
          ${widget}<div class="elementor-widget-container">${labeledForm}</div></div>
        </div>
      </section>
    </div>
  </main>`;
  return html.replace(/<main\b[\s\S]*?<\/main>/i, content);
}
