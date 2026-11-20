import { socialIconHtml } from "./social-icons";
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

export const MENU_NAV = [
  ["Solutions", "/solutions/"],
  ["Products", "/all-products/"],
  ["Industries", "/industries/"],
  ["Services", "/services/"],
  ["Partners", "/partners/"],
  ["Insights", "/insights/"],
  ["Track Shipment", "https://track.technoai.ae/"],
  ["Contact Us", "/request-a-quote/"],
] as const;

export const SOLUTION_LINKS = [
  ["Financial & Transaction", "/financial-transaction-solutions/"],
  ["Aerial & Drone", "/aerial-drone-solutions/"],
  ["AI & Robotics", "/ai-robotics/"],
  ["Connectivity & Satellite", "/connectivity-satellite-systems/"],
  ["Industrial & Infrastructure", "/industrial-smart-infrastructure/"],
  ["Security Systems", "/security-mission-critical-systems/"],
] as const;

const SOLUTION_ICONS = [
  '<rect x="2.5" y="5" width="19" height="14" rx="2.5"/><path d="M2.5 9.5h19M6 15h4"/>',
  '<circle cx="5" cy="6" r="2.5"/><circle cx="19" cy="6" r="2.5"/><circle cx="5" cy="18" r="2.5"/><circle cx="19" cy="18" r="2.5"/><rect x="9.5" y="9.5" width="5" height="5" rx="1"/><path d="M7 8l2.5 1.5M17 8l-2.5 1.5M7 16l2.5-1.5M17 16l-2.5-1.5"/>',
  '<rect x="4.5" y="8" width="15" height="11" rx="3"/><path d="M12 8V4.5M2.5 12.5v3M21.5 12.5v3M9.5 16h5"/><circle cx="12" cy="3.5" r="1"/><circle cx="9" cy="12.5" r="1"/><circle cx="15" cy="12.5" r="1"/>',
  '<path d="M9.5 9.5l5 5M11 8l5 5-2.5 2.5-5-5zM8.5 5.5L5 9l2.5 2.5M18.5 15.5L15 19l-2.5-2.5M4 15a5 5 0 005 5M15.5 6.5l2-2"/>',
  '<path d="M3 20V10l5.5 3.5V10l5.5 3.5V5h4v15zM3 20h18M7.5 16.5h1M12 16.5h1M16.5 16.5h1"/>',
  '<path d="M12 3l7.5 2.8v5.4c0 4.4-3 8-7.5 9.8-4.5-1.8-7.5-5.4-7.5-9.8V5.8zM9 12l2.2 2.2L15.5 10"/>',
] as const;
const solutionIcon = (i: number) => `<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">${SOLUTION_ICONS[i]}</svg>`;

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
<div class="px site-page-transition" aria-hidden="true"><span class="px-mark brand-mark"></span></div>
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
    <nav class="menu-nav" aria-label="Menu">${MENU_NAV.map(([t, h], i) => `<a href="${h}" style="--d:${i}"><span class="n">${num(i)}</span><span class="menu-t">${esc(t)}</span></a>`).join("")}</nav>
    <div class="menu-side">
      <div class="menu-solutions"><h4>Solutions</h4>${SOLUTION_LINKS.map(([t, h], i) => `<a href="${h}">${solutionIcon(i)}<span>${esc(t)}</span></a>`).join("")}</div>
      <div class="menu-offices"><h4>Offices</h4>${OFFICES.map(([t, p]) => `<p><strong>${esc(t)}</strong>${esc(p)}</p>`).join("")}<span class="stacked-logo-card menu-office-logo"><img src="/brand/techno-ai-stacked.png" alt="TechnoAi" width="794" height="890" /></span></div>
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
    ${FOOTER.map(([h, links]) => `<nav class="fo-desktop-nav" aria-label="${h}"><h4>${h}</h4>${links.map(([t, href]) => `<a href="${href}">${esc(t)}</a>`).join("")}</nav>`).join("")}
    <nav class="fo-mobile-nav" aria-label="Footer navigation">${FOOTER.map(([h, links]) => `<details><summary>${h}</summary><div class="fo-mobile-links">${links.map(([t, href]) => `<a href="${href}">${esc(t)}</a>`).join("")}</div></details>`).join("")}</nav>
  </div>
  <div class="fo-wrap fo-bottom">
    <span>© TechnoAi · technoai.ae</span>
    <div>${SOCIAL.map(([t, h]) => ext(t, h).replace(">", `>${socialIconHtml(t)}`)).join("")}</div>
  </div>
  <div class="fo-word" aria-hidden="true"><span>//:</span>technoai</div>
</footer>`;
