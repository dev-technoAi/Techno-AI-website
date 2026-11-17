import { SiteImage, videoPoster } from "./image";
import { ctaHtml, footerHtml, headerHtml } from "./chrome";
import { HeroHeading } from "./hero-heading";
import { HeroFilm } from "./hero-film";
import { Arrow, Eyebrow, Words } from "./ui";
import { Motion } from "./motion";

// Home page — WHITE theme copy of technoai-nextjs/app/redesign/page.tsx. Theme overrides: app/theme-white.css.
// Motion: see motion.tsx. Styles: chrome.css (header/menu/footer, shared) + home.css.

// User-supplied robotics film leads the hero; the original drone film stays in solution 02.
const HERO = {
  poster: "/redesign/hero-brand-poster.jpg",
  video: "/redesign/hero-brand.mp4",
};

const UP = "/wp-content/uploads";

type Solution = {
  title: string;
  text: string;
  href: string;
  icon: string;
  // Realistic product film (generated, graded like the hero — see CLAUDE.md). Without `video` the
  // poster still is shown; without `film` a line-drawn schematic.
  film?: { video?: string; poster: string };
};

const SOLUTIONS: Solution[] = [
  { title: "AI & Robotics", text: "Automation that actually fits into day to day operations.", href: "/ai-robotics/", icon: "robot", film: { video: "/redesign/solutions/robotics.mp4", poster: "/redesign/solutions/robotics.jpg" } },
  { title: "Aerial & Drone", text: "From deployment to data capture for inspection, monitoring, and security.", href: "/aerial-drone-solutions/", icon: "drone", film: { video: "/redesign/hero-film.mp4", poster: "/redesign/hero-film.jpg" } },
  { title: "Financial & Transaction", text: "Structure deals, manage procurement, and keep projects financially controlled.", href: "/financial-transaction-solutions/", icon: "card", film: { video: "/redesign/solutions/financial.mp4", poster: "/redesign/solutions/financial.jpg" } },
  { title: "Connectivity & Satellite", text: "Reliable communication where traditional networks do not work.", href: "/connectivity-satellite-systems/", icon: "satellite", film: { video: "/redesign/solutions/satellite.mp4", poster: "/redesign/solutions/satellite.jpg" } },
  { title: "Industrial & Infrastructure", text: "Systems built for continuous operation in demanding environments.", href: "/industrial-smart-infrastructure/", icon: "industry", film: { video: "/redesign/solutions/industrial.mp4", poster: "/redesign/solutions/industrial.jpg" } },
  { title: "Security Systems", text: "Detection, monitoring, and response for critical sites and assets.", href: "/security-mission-critical-systems/", icon: "shield", film: { video: "/redesign/solutions/security.mp4", poster: "/redesign/solutions/security.jpg" } },
];

// [title, text, image] — images generated + graded like the hero (public/redesign/domains).
const DOMAINS = [
  ["Drones & UAV Systems", "Aerial platforms for inspection, mapping, surveillance, monitoring, and mission support.", "/redesign/domains/drones.jpg"],
  ["AI & Robotics", "Autonomous robots, AI-powered systems, automation tools, and smart operational support.", "/redesign/domains/robotics.jpg"],
  ["Satellite Communication", "Connectivity solutions for remote sites, field operations, maritime, and critical communication.", "/redesign/domains/satellite.jpg"],
  ["AI Hardware", "Advanced computing hardware, edge AI systems, NVIDIA platforms, and embedded intelligence.", "/redesign/domains/hardware.jpg"],
  ["Security & Monitoring", "Detection, surveillance, monitoring, and protection systems for critical assets and locations.", "/redesign/domains/security.jpg"],
];

const INDUSTRIES = [
  ["Government & Public Sector", "Systems aligned with national scale operations", "/government-public-sector/"],
  ["Defense & Security", "Built for high-risk and mission-critical environments", "/defense-security/"],
  ["Agriculture", "Monitoring, automation, and field intelligence", "/agriculture/"],
  ["Energy & Infrastructure", "Inspection, control, and long-term system reliability.", "/energy-infrastructure/"],
  ["Logistics & Mobility", "Tracking, coordination, and operational visibility", "/logistics-mobility/"],
  ["Research & Development", "Flexible platforms for testing and innovation", "/research-and-development/"],
];

const PARTNERS = [
  ["DJI Enterprise", "2025/10/DJI-Enterprise.png"],
  ["Seeed Studio", "2025/10/Seeed-Studio.png"],
  ["Holybro", "2026/03/Holybro.png"],
  ["Amtech", "2026/03/amtech-logo-bg.png"],
  ["Keenon Robotics", "2025/10/Keenon.png"],
  ["Thuraya", "2025/10/thuraya-.png"],
  ["Ingram Micro", "2026/03/Ingram-Partner-logo.png"],
  ["Etihad", "2026/07/Etihad@72x.png"],
  ["Emirates", "2026/07/Emirates@72x.png"],
  ["dnata", "2026/07/Dnata@72x.png"],
  ["AD Ports", "2026/07/AD-Port@72x.png"],
];





// pathLength="1" on every shape lets the CSS "draw" the line icons (stroke-dashoffset 1 -> 0).
const L = { pathLength: 1 } as const;
const ICONS: Record<string, React.ReactNode> = {
  card: <><rect {...L} x="2.5" y="5" width="19" height="14" rx="2.5" /><path {...L} d="M2.5 9.5h19M6 15h4" /></>,
  drone: <><circle {...L} cx="5" cy="6" r="2.5" /><circle {...L} cx="19" cy="6" r="2.5" /><circle {...L} cx="5" cy="18" r="2.5" /><circle {...L} cx="19" cy="18" r="2.5" /><rect {...L} x="9.5" y="9.5" width="5" height="5" rx="1" /><path {...L} d="M7 8l2.5 1.5M17 8l-2.5 1.5M7 16l2.5-1.5M17 16l-2.5-1.5" /></>,
  robot: <><rect {...L} x="4.5" y="8" width="15" height="11" rx="3" /><path {...L} d="M12 8V4.5M2.5 12.5v3M21.5 12.5v3M9.5 16h5" /><circle {...L} cx="12" cy="3.5" r="1" /><circle {...L} cx="9" cy="12.5" r="1" /><circle {...L} cx="15" cy="12.5" r="1" /></>,
  satellite: <><path {...L} d="M9.5 9.5l5 5M11 8l5 5-2.5 2.5-5-5zM8.5 5.5L5 9l2.5 2.5M18.5 15.5L15 19l-2.5-2.5M4 15a5 5 0 005 5M4 18.5A1.5 1.5 0 005.5 20M15.5 6.5l2-2" /></>,
  industry: <><path {...L} d="M3 20V10l5.5 3.5V10l5.5 3.5V5h4v15zM3 20h18M7.5 16.5h1M12 16.5h1M16.5 16.5h1" /></>,
  shield: <><path {...L} d="M12 3l7.5 2.8v5.4c0 4.4-3 8-7.5 9.8-4.5-1.8-7.5-5.4-7.5-9.8V5.8z" /><path {...L} d="M9 12l2.2 2.2L15.5 10" /></>,
};

const num = (i: number) => String(i + 1).padStart(2, "0");

const MANIFESTO =
  "Not every project needs more technology. It needs the right combination of systems, delivered and integrated properly.";

export default function Home() {
  const words = MANIFESTO.split(" ");
  return (
    <>
      <link rel="preload" as="image" href={HERO.poster} fetchPriority="high" />
      <Motion />
      {/* header, menu overlay, grain: shared with every other page (app/chrome.ts) */}
      <div className="chrome" dangerouslySetInnerHTML={{ __html: headerHtml }} />

      <main>
        {/* ---------- Hero: the robotics film always plays; scrolling pushes the camera in ---------- */}
        <section className="hero-scroll" data-progress>
          <div className="hero-pin">
            <HeroFilm video={HERO.video} poster={videoPoster(HERO.poster)} />
            <div className="hero-shade" aria-hidden="true" />

            <div className="hero-body">
              <Eyebrow>TechnoAi Advanced Solutions</Eyebrow>
              <HeroHeading />
              <div className="hero-foot">
                <p className="lead">
                  Delivering drones, robotics, satellite connectivity, AI hardware, security systems and
                  infrastructure technology for government, enterprise and industrial sectors.
                </p>
                <div className="actions">
                  <a className="btn btn-fill" href="/request-a-quote/" data-magnetic>Start a Project <Arrow /></a>
                  <a className="btn btn-line" href="#solutions">Explore Solutions</a>
                </div>
              </div>
            </div>

            {/* Second half of the scroll: the robotics capability shown in the film. */}
            <div className="hero-cap">
              <Eyebrow>AI &amp; Robotics</Eyebrow>
              <p className="hero-cap-t">Automation that actually fits into day to day operations.</p>
              <a className="link" href="/ai-robotics/">Learn More <Arrow /></a>
            </div>

            <div className="hero-meta" aria-hidden="true">
              <span>Abu Dhabi</span><span>Prague</span><span>Lahore</span>
            </div>
            <div className="hero-hint" aria-hidden="true"><span>Scroll to explore</span><i /></div>
            <div className="hero-progress" aria-hidden="true"><i /></div>
          </div>
        </section>

        {/* The drone scene shares the hero's pinned zoom and text transitions on every screen. */}
        <section className="hero-scroll drone-scroll" data-progress aria-labelledby="drone-feature-title">
          <div className="hero-pin">
            <HeroFilm video="/redesign/hero-film.mp4" poster={videoPoster("/redesign/hero-film.jpg")} />
            <div className="hero-shade" aria-hidden="true" />
            <div className="hero-body drone-scroll-copy">
              <Eyebrow>Aerial &amp; Drone</Eyebrow>
              <h2 id="drone-feature-title">From deployment<br />to data capture.</h2>
              <p>Drone solutions for inspection, monitoring, and security.</p>
            </div>
            <div className="hero-cap">
              <Eyebrow>Aerial &amp; Drone</Eyebrow>
              <p className="hero-cap-t">From deployment to data capture for inspection, monitoring, and security.</p>
              <a className="link" href="/aerial-drone-solutions/">Explore Drone Solutions <Arrow /></a>
            </div>
            <div className="hero-progress" aria-hidden="true"><i /></div>
          </div>
        </section>

        {/* ---------- Manifesto: words light up with the scroll ---------- */}
        <section className="manifesto" data-progress="view">
          <div className="wrap">
            <Eyebrow>Complex challenges. Considered solutions.</Eyebrow>
            <p className="manifesto-t" style={{ "--n": words.length } as React.CSSProperties}>
              {words.map((w, i) => (
                <span key={i} style={{ "--i": i } as React.CSSProperties}>{w} </span>
              ))}
            </p>
          </div>
        </section>

        {/* ---------- Solutions: pinned chapters ---------- */}
        <section
          className="chapters"
          id="solutions"
          data-progress
          data-count={SOLUTIONS.length}
          data-active="0"
          style={{ "--n": SOLUTIONS.length } as React.CSSProperties}
        >
          <div className="ch-pin">
            <div className="ch-glow" aria-hidden="true" />
            <div className="ch-head">
              <Eyebrow>TechnoAi Solutions</Eyebrow>
              <div className="ch-count" aria-hidden="true">
                <span className="ch-roll">{SOLUTIONS.map((_, i) => <span key={i}>{num(i)}</span>)}</span>
                <span className="ch-of">/ {num(SOLUTIONS.length - 1)}</span>
              </div>
            </div>

            <ol className="ch-list">
              {SOLUTIONS.map((s, i) => (
                <li key={s.href} data-i={i}>
                  <a href={s.href}>{s.title}</a>
                  <i aria-hidden="true" />
                </li>
              ))}
            </ol>

            <div className="ch-stage">
              {SOLUTIONS.map((s, i) => (
                <article className="ch-panel" key={s.href} data-i={i}>
                  <div className="ch-visual" aria-hidden="true">
                    {s.film?.video ? (
                      <video data-src={s.film.video} poster={videoPoster(s.film.poster)} muted loop playsInline preload="none" />
                    ) : s.film ? (
                      <SiteImage src={s.film.poster} alt="" loading="lazy" />
                    ) : (
                      <div className="schem">
                        <span className="schem-ring" /><span className="schem-ring" /><span className="schem-ring" />
                        <svg viewBox="0 0 24 24">{ICONS[s.icon]}</svg>
                      </div>
                    )}
                  </div>
                  <div className="ch-copy">
                    <span className="n">{num(i)}</span>
                    <h3>{s.title}</h3>
                    <p>{s.text}</p>
                    <a className="link" href={s.href}>Learn More <Arrow /></a>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ---------- Technology domains: horizontal track ---------- */}
        <section className="hscroll" data-progress>
          <div className="hs-pin">
            <div className="wrap hs-head">
              <div>
                <Eyebrow>Technology Domains</Eyebrow>
                <Words text={"Integrated Technologies\nfor Advanced Projects"} />
              </div>
              <p>
                TechnoAi brings together hardware, software, communication systems, and field-ready
                technologies to support complex operational requirements.
              </p>
            </div>
            <div className="hscroll-track">
              {DOMAINS.map(([t, d, img], i) => (
                <div className="dom dom-img" key={t} data-glow>
                  <SiteImage className="dom-pic" src={img} alt="" loading="lazy" />
                  <span className="dom-n" aria-hidden="true">{num(i)}</span>
                  <div className="dom-b">
                    <h3>{t}</h3>
                    <p>{d}</p>
                  </div>
                </div>
              ))}
              <a className="dom dom-end" href="/all-products/" data-cursor="View" data-glow>
                <span className="dom-n brand-mark" aria-hidden="true" />
                <div className="dom-b">
                  <h3>View All Products</h3>
                  <span className="link">Browse the catalogue <Arrow /></span>
                </div>
              </a>
            </div>
            <div className="wrap hs-bar" aria-hidden="true"><i /></div>
          </div>
        </section>

        {/* ---------- Industries ---------- */}
        <section className="wrap sec inds">
          <div className="sec-head">
            <div>
              <Eyebrow>Industries We Serve</Eyebrow>
              <Words text={"Built for Sectors Where\nReliability Matters"} />
            </div>
            <p data-reveal className="fade">
              TechnoAi supports organizations that need advanced technology for monitoring, security,
              communication, automation, and field operations.
            </p>
          </div>
          <div className="ind-list">
            {INDUSTRIES.map(([t, d, h], i) => (
              <a className="ind" href={h} key={h} data-reveal data-cursor="Open">
                <span className="n">{num(i)}</span>
                <h3>{t}</h3>
                <p>{d}</p>
                <span className="ind-go" aria-hidden="true"><Arrow /></span>
              </a>
            ))}
          </div>
        </section>

        {/* ---------- Partners ---------- */}
        <section className="sec partners">
          <div className="wrap sec-head">
            <div>
              <Eyebrow>Trusted by Organizations</Eyebrow>
              <Words text="Technology Partners & Clients" />
            </div>
            <p data-reveal className="fade">
              TechnoAi works with leading organizations across defense, security, maritime,
              infrastructure, research, and advanced technology sectors.
            </p>
          </div>
          <div className="marquee">
            <div className="track">
              {[...PARTNERS, ...PARTNERS].map(([name, src], i) => (
                <SiteImage key={i} src={`${UP}/${src}`} alt={i < PARTNERS.length ? name : ""} sizes="180px" loading="lazy" />
              ))}
            </div>
          </div>
          <div className="wrap actions" data-reveal>
            <a className="btn btn-line" href="/partners/">All Partners <Arrow /></a>
            <a className="btn btn-line" href="/partners/">Become a Partner</a>
          </div>
        </section>

      </main>

      <div className="chrome" dangerouslySetInnerHTML={{ __html: ctaHtml + footerHtml }} />
    </>
  );
}
