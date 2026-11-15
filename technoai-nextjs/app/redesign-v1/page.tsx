import { SiteHeader, SiteFooter } from "../site-chrome";
import { Reveal } from "../redesign/fx";
import { HeroScrub } from "../redesign/hero-scrub";

// Redesign sample of the home page. All text, links and logos come from the current technoai.ae
// home page; only the design changed (white / #0f1a1b + brand accents, Noto Sans).

// Hero visual: frames + looping video made from the generated drone film (see CLAUDE.md "Redesign").
const HERO = {
  frames: 97,
  dir: "/redesign/hero",
  poster: "/redesign/hero-drone.jpg",
  video: "/redesign/hero-loop.mp4",
  service: 1, // index in SOLUTIONS that the hero currently shows (Aerial & Drone)
};

const UP = "/wp-content/uploads";

const SOLUTIONS = [
  ["Financial & Transaction", "Structure deals, manage procurement, and keep projects financially controlled.", "/financial-transaction-solutions/", "card"],
  ["Aerial & Drone", "From deployment to data capture for inspection, monitoring, and security.", "/aerial-drone-solutions/", "drone"],
  ["AI & Robotics", "Automation that actually fits into day to day operations.", "/ai-robotics/", "robot"],
  ["Connectivity & Satellite", "Reliable communication where traditional networks do not work.", "/connectivity-satellite-systems/", "satellite"],
  ["Industrial & Infrastructure", "Systems built for continuous operation in demanding environments.", "/industrial-smart-infrastructure/", "industry"],
  ["Security Systems", "Detection, monitoring, and response for critical sites and assets.", "/security-mission-critical-systems/", "shield"],
];

const DOMAINS = [
  ["Drones & UAV Systems", "Aerial platforms for inspection, mapping, surveillance, monitoring, and mission support."],
  ["AI & Robotics", "Autonomous robots, AI-powered systems, automation tools, and smart operational support."],
  ["Satellite Communication", "Connectivity solutions for remote sites, field operations, maritime, and critical communication."],
  ["AI Hardware", "Advanced computing hardware, edge AI systems, NVIDIA platforms, and embedded intelligence."],
  ["Security & Monitoring", "Detection, surveillance, monitoring, and protection systems for critical assets and locations."],
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

const ICONS: Record<string, React.ReactNode> = {
  card: <><rect x="2.5" y="5" width="19" height="14" rx="2.5" /><path d="M2.5 9.5h19M6 15h4" /></>,
  drone: <><circle cx="5" cy="6" r="2.5" /><circle cx="19" cy="6" r="2.5" /><circle cx="5" cy="18" r="2.5" /><circle cx="19" cy="18" r="2.5" /><rect x="9.5" y="9.5" width="5" height="5" rx="1" /><path d="M7 8l2.5 1.5M17 8l-2.5 1.5M7 16l2.5-1.5M17 16l-2.5-1.5" /></>,
  robot: <><rect x="4.5" y="8" width="15" height="11" rx="3" /><path d="M12 8V4.5M2.5 12.5v3M21.5 12.5v3M9.5 16h5" /><circle cx="12" cy="3.5" r="1" /><circle cx="9" cy="12.5" r="1" /><circle cx="15" cy="12.5" r="1" /></>,
  satellite: <><path d="M9.5 9.5l5 5M11 8l5 5-2.5 2.5-5-5zM8.5 5.5L5 9l2.5 2.5M18.5 15.5L15 19l-2.5-2.5M4 15a5 5 0 005 5M4 18.5A1.5 1.5 0 005.5 20M15.5 6.5l2-2" /></>,
  industry: <><path d="M3 20V10l5.5 3.5V10l5.5 3.5V5h4v15zM3 20h18M7.5 16.5h1M12 16.5h1M16.5 16.5h1" /></>,
  shield: <><path d="M12 3l7.5 2.8v5.4c0 4.4-3 8-7.5 9.8-4.5-1.800-7.500-5.400-7.500-9.800V5.800z" /><path d="M9 12l2.200 2.200L15.500 10" /></>,
};

const num = (i: number) => String(i + 1).padStart(2, "0");

function Arrow() {
  return (
    <svg className="arrow" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="eyebrow">
      <span aria-hidden="true">//:</span>
      {children}
    </p>
  );
}

export default function RedesignHome() {
  return (
    <>
      <Reveal />
      <div className="glow" aria-hidden="true"><i /><i /><i /></div>

      <SiteHeader />

      <main>
        {/* ---------- Hero (visual plays with the scroll) ---------- */}
        <section className="hero-scroll">
          <div className="wrap hero-pin">
            <div className="hero">
              <HeroScrub count={HERO.frames} dir={HERO.dir} poster={HERO.poster} video={HERO.video} />
              <div className="hero-shade" aria-hidden="true" />

              <div className="hero-body">
                <Eyebrow>TechnoAi Advanced Solutions</Eyebrow>
                <h1>
                  Advanced Technology Solutions <span>for Mission Critical Operations</span>
                </h1>
                <p className="lead">
                  Delivering drones, robotics, satellite connectivity, AI hardware, security systems and
                  infrastructure technology for government, enterprise and industrial sectors.
                </p>
                <div className="actions">
                  <a className="btn btn-light" href="/request-a-quote/">Start a Project <Arrow /></a>
                  <a className="btn btn-ghost" href="#solutions">Explore Solutions</a>
                </div>
              </div>

              {/* shown in the second half of the scroll */}
              <div className="hero-cap">
                <Eyebrow>02 — TechnoAi Solutions</Eyebrow>
                <h2>{SOLUTIONS[HERO.service][0]}</h2>
                <p className="lead">{SOLUTIONS[HERO.service][1]}</p>
                <a className="btn btn-light" href={SOLUTIONS[HERO.service][2]}>Learn More <Arrow /></a>
              </div>

              <nav className="rail" aria-label="Solutions">
                {SOLUTIONS.map(([title, , href, icon], i) => (
                  <a key={href} href={href} className={i === HERO.service ? "on" : undefined} aria-label={title}>
                    <svg className="ico" viewBox="0 0 24 24" aria-hidden="true">{ICONS[icon]}</svg>
                    <span>{title}</span>
                  </a>
                ))}
              </nav>

              <div className="hero-hint" aria-hidden="true">Scroll</div>
            </div>
          </div>
        </section>

        {/* ---------- Solutions ---------- */}
        <section className="wrap sec" id="solutions">
          <div className="sec-head" data-reveal>
            <Eyebrow>TechnoAi Solutions</Eyebrow>
            <h2>Complex challenges.<br />Considered solutions.</h2>
            <p>
              Not every project needs more technology. It needs the right combination of systems,
              delivered and integrated properly.
            </p>
          </div>
          <div className="grid3">
            {SOLUTIONS.map(([title, text, href, icon], i) => (
              <a className="card" href={href} key={href} data-reveal style={{ transitionDelay: `${(i % 3) * 70}ms` }}>
                <div className="card-top">
                  <span className="n">{num(i)}</span>
                  <svg className="ico" viewBox="0 0 24 24" aria-hidden="true">{ICONS[icon]}</svg>
                </div>
                <h3>{title}</h3>
                <p>{text}</p>
                <span className="more">Learn More <Arrow /></span>
              </a>
            ))}
          </div>
        </section>

        {/* ---------- Technology domains ---------- */}
        <section className="tint">
          <div className="wrap sec split">
            <div className="split-side" data-reveal>
              <Eyebrow>Technology Domains</Eyebrow>
              <h2>Integrated Technologies for Advanced Projects</h2>
              <p>
                TechnoAi brings together hardware, software, communication systems, and field-ready
                technologies to support complex operational requirements.
              </p>
              <a className="btn btn-dark" href="/all-products/">View All Products <Arrow /></a>
            </div>
            <ol className="rows">
              {DOMAINS.map(([title, text], i) => (
                <li key={title} data-reveal>
                  <span className="n">{num(i)}</span>
                  <div>
                    <h3>{title}</h3>
                    <p>{text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ---------- Industries ---------- */}
        <section className="wrap sec">
          <div className="sec-head" data-reveal>
            <Eyebrow>Industries We Serve</Eyebrow>
            <h2>Built for Sectors Where Reliability Matters</h2>
            <p>
              TechnoAi supports organizations that need advanced technology for monitoring, security,
              communication, automation, and field operations.
            </p>
          </div>
          <div className="grid3 lines">
            {INDUSTRIES.map(([title, text, href], i) => (
              <a className="ind" href={href} key={href} data-reveal style={{ transitionDelay: `${(i % 3) * 70}ms` }}>
                <span className="n">{num(i)}</span>
                <h3>{title}</h3>
                <p>{text}</p>
                <span className="more">Learn More <Arrow /></span>
              </a>
            ))}
          </div>
        </section>

        {/* ---------- Partners ---------- */}
        <section className="sec partners">
          <div className="wrap sec-head center" data-reveal>
            <Eyebrow>Trusted by Organizations</Eyebrow>
            <h2>Technology Partners &amp; Clients</h2>
            <p>
              TechnoAi works with leading organizations across defense, security, maritime,
              infrastructure, research, and advanced technology sectors.
            </p>
          </div>
          <div className="marquee" data-reveal>
            <div className="track">
              {[...PARTNERS, ...PARTNERS].map(([name, src], i) => (
                <img key={i} src={`${UP}/${src}`} alt={i < PARTNERS.length ? name : ""} loading="lazy" />
              ))}
            </div>
          </div>
          <div className="wrap actions center" data-reveal>
            <a className="btn btn-dark" href="/partners/">All Partners <Arrow /></a>
            <a className="btn btn-line" href="/partners/">Become a Partner</a>
          </div>
        </section>

        {/* ---------- Call to action ---------- */}
        <section className="wrap">
          <div className="cta" data-reveal>
            <div className="cta-copy">
              <Eyebrow>Let’s build what’s next</Eyebrow>
              <h2>Your ambition.<br /><span>Our expertise.</span></h2>
              <p>Bring us your challenge. We’ll bring the right technology together.</p>
            </div>
            <a className="btn btn-light" href="/request-a-quote/">Start a Project <Arrow /></a>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
