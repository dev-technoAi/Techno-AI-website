// Site header, menu overlay and footer — ONE source for the home page (app/redesign/page.tsx) and the
// ~96 archived WordPress pages (app/theme-document.ts swaps their Elementor header/footer for these).
// Styles: app/redesign/chrome.css. Behaviour: app/redesign/motion.tsx (home) and public/site.js (other pages).

export const NAV = [
  ["Solutions", "/solutions/"],
  ["Industries", "/industries/"],
  ["Services", "/services/"],
  ["Products", "/all-products/"],
  ["Partners", "/partners/"],
  ["Insights", "/insights/"],
] as const;

export const SOLUTION_LINKS = [
  ["Financial & Transaction", "/financial-transaction-solutions/"],
  ["Aerial & Drone", "/aerial-drone-solutions/"],
  ["AI & Robotics", "/ai-robotics/"],
  ["Connectivity & Satellite", "/connectivity-satellite-systems/"],
  ["Industrial & Infrastructure", "/industrial-smart-infrastructure/"],
  ["Security Systems", "/security-mission-critical-systems/"],
] as const;

export const OFFICES = [
  ["Headquarter", "Abu Dhabi, United Arab Emirates"],
  ["Europe Innovation Hub", "Prague - Czech Republic"],
  ["Asia Innovation Hub", "Lahore - Pakistan"],
] as const;

export const SOCIAL = [
  ["Instagram", "https://www.instagram.com/technoai.ae/"],
  ["Facebook", "https://www.facebook.com/share/1GxWMW32L1/?mibextid=wwXIfr"],
  ["LinkedIn", "https://www.linkedin.com/company/technoai/"],
  ["TikTok", "https://www.tiktok.com/@technoai.ae"],
] as const;

const FOOTER = [
  ["Solutions", [["Financial", "/financial-transaction-solutions/"], ["Aerial & Drones", "/aerial-drone-solutions/"], ["AI & Robotics", "/ai-robotics/"], ["Connectivity", "/connectivity-satellite-systems/"], ["Smart Infrastructure", "/industrial-smart-infrastructure/"], ["Security", "/security-mission-critical-systems/"]]],
  ["Industries", [["Gov & Public", "/government-public-sector/"], ["Agriculture", "/agriculture/"], ["Energy", "/energy-infrastructure/"], ["Logistics", "/logistics-mobility/"], ["R&D", "/research-and-development/"]]],
  ["Services", [["Procurement", "/procurement/"], ["Integration", "/integration/"], ["Project Management", "/project-management/"], ["Technical Support", "/technical-support/"]]],
  ["Company", [["Products", "/all-products/"], ["Partners", "/partners/"], ["Insights", "/insights/"]]],
] as const;

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
const num = (i: number) => String(i + 1).padStart(2, "0");
const ext = (t: string, h: string) => `<a href="${esc(h)}" target="_blank" rel="noopener noreferrer">${esc(t)}</a>`;

export const headerHtml = `<div class="grain" aria-hidden="true"></div>
<div class="px" aria-hidden="true"><span class="px-mark"><span>//:</span>ai</span></div>
<header class="hx">
  <a class="hx-logo" href="/" aria-label="TechnoAi home"></a>
  <nav class="hx-nav" aria-label="Main">${NAV.map(([t, h]) => `<a href="${h}"><span data-t="${esc(t)}">${esc(t)}</span></a>`).join("")}</nav>
  <a class="pill" href="/request-a-quote/" data-magnetic>Start a Project</a>
  <button class="hx-menu" type="button" aria-expanded="false" aria-controls="menu">
    <span class="hx-menu-t">Menu</span><span class="hx-menu-i" aria-hidden="true"><i></i><i></i></span>
  </button>
</header>
<div class="menu" id="menu" inert>
  <div class="menu-in">
    <nav class="menu-nav" aria-label="Menu">${NAV.map(([t, h], i) => `<a href="${h}" style="--d:${i}"><span class="n">${num(i)}</span><span class="menu-t">${esc(t)}</span></a>`).join("")}</nav>
    <div class="menu-side">
      <div><h4>Solutions</h4>${SOLUTION_LINKS.map(([t, h]) => `<a href="${h}">${esc(t)}</a>`).join("")}</div>
      <div><h4>Offices</h4>${OFFICES.map(([t, p]) => `<p><strong>${esc(t)}</strong>${esc(p)}</p>`).join("")}</div>
      <div class="menu-social">${SOCIAL.map(([t, h]) => ext(t, h)).join("")}</div>
    </div>
  </div>
</div>`;

/** Words that rise out of a mask when revealed (same markup as <Words> in app/redesign/page.tsx). */
function words(lines: string[]) {
  let i = 0;
  return lines
    .map((line) => `<span class="wl" aria-hidden="true">${line.split(" ").map((w) => `<span><span class="w"><span style="--d:${i++}">${esc(w)}</span></span> </span>`).join("")}</span>`)
    .join("");
}

/** Closing call to action, shown above the footer on every page except the quote form itself. */
export const ctaHtml = `<section class="cta" data-glow>
  <div class="cta-glow" aria-hidden="true"></div>
  <div class="fo-wrap cta-in">
    <p class="eyebrow"><span aria-hidden="true">//:</span>Let’s build what’s next</p>
    <h2 class="words cta-t" data-reveal aria-label="Your ambition. Our expertise.">${words(["Your ambition.", "Our expertise."])}</h2>
    <div class="cta-row">
      <p class="fade" data-reveal>Bring us your challenge. We’ll bring the right technology together.</p>
      <a class="cta-btn" href="/request-a-quote/" data-magnetic><span>Start a<br />Project</span></a>
    </div>
  </div>
</section>`;

export const footerHtml = `<footer class="fo">
  <div class="fo-wrap fo-grid">
    <div class="fo-brand">
      <span class="hx-logo fo-logo" role="img" aria-label="TechnoAi"></span>
      <ul>${OFFICES.map(([t, p]) => `<li><strong>${esc(t)}</strong>${esc(p)}</li>`).join("")}</ul>
    </div>
    ${FOOTER.map(([h, links]) => `<nav aria-label="${h}"><h4>${h}</h4>${links.map(([t, href]) => `<a href="${href}">${esc(t)}</a>`).join("")}</nav>`).join("")}
  </div>
  <div class="fo-wrap fo-bottom">
    <span>© TechnoAi · technoai.ae</span>
    <div>${SOCIAL.map(([t, h]) => ext(t, h)).join("")}</div>
  </div>
  <div class="fo-word" aria-hidden="true"><span>//:</span>technoai</div>
</footer>`;
