import { socialIconHtml } from "../social-icons";
import { FOOTER, INDUSTRIES, NAV, OFFICES, PARTNERS, SOCIAL, SOLUTIONS, UP } from "./data";
import { Loader, Motion } from "./fx";
import Hero from "./hero";
import HeroNav from "./hero-nav";
import Capabilities from "./capabilities";
import Flight from "./flight";
import GlobalPresence from "./global-presence";
import "./sector-presence.css";
import FibreBackground from "./fibre-background";
import InkSample from "./ink-sample"; // SAMPLE ONLY: ?ink=1
import JourneyPeek from "./journey-peeks";
import "./journey-scenes.css";
import "./responsive.css";
import { JourneyScene } from "./deferred-scenes";
import "./section-robot.css";
import JourneyFilms from "./journey-films";
import MobileJourney from "./mobile-journey";
import "./cursor.css";
import SplineCard from "./spline-card";
import SplineStage from "./spline-stage";
import "./imported-buttons.css";

// New TechnoAi home page ("Mission Control"). Text and links come from the current technoai.ae
// home page. Brand: Noto Sans, ink #0f1a1b + blue #146b8c (TechnoAi Brand Identity PDF).
// 3D: placeholder models built in code (models.ts) until real .glb files are added.

const ICONS: Record<string, React.ReactNode> = {
  financial: <><rect x="2.5" y="5" width="19" height="14" rx="2.5" /><path d="M2.5 9.5h19M6 15h4" /></>,
  drone: <><circle cx="5" cy="6" r="2.5" /><circle cx="19" cy="6" r="2.5" /><circle cx="5" cy="18" r="2.5" /><circle cx="19" cy="18" r="2.5" /><rect x="9.5" y="9.5" width="5" height="5" rx="1" /><path d="M7 8l2.5 1.5M17 8l-2.5 1.5M7 16l2.5-1.5M17 16l-2.5-1.5" /></>,
  robot: <><rect x="4.5" y="8" width="15" height="11" rx="3" /><path d="M12 8V4.5M2.5 12.5v3M21.5 12.5v3M9.5 16h5" /><circle cx="12" cy="3.5" r="1" /><circle cx="9" cy="12.5" r="1" /><circle cx="15" cy="12.5" r="1" /></>,
  satellite: <><path d="M9.5 9.5l5 5M11 8l5 5-2.5 2.5-5-5zM8.5 5.5L5 9l2.5 2.5M18.5 15.5L15 19l-2.5-2.5M4 15a5 5 0 005 5M4 18.5A1.5 1.5 0 005.5 20M15.5 6.5l2-2" /></>,
  industry: <><path d="M3 20V10l5.5 3.5V10l5.5 3.5V5h4v15zM3 20h18M7.5 16.5h1M12 16.5h1M16.5 16.5h1" /></>,
  security: <><path d="M12 3l7.5 2.8v5.4c0 4.4-3 8-7.5 9.8-4.5-1.8-7.5-5.4-7.5-9.8V5.8z" /><path d="M9 12l2.2 2.2L15.5 10" /></>,
};

// Supporting imagery for the industries served below.
const INDUSTRY_MEDIA = [
  { src: "/redesign/industries/government.webp", alt: "Abu Dhabi skyline and UAE flag" },
  { src: "/redesign/industries/security.webp", alt: "Surveillance and security monitoring" },
  { src: "/redesign/industries/agriculture.webp", alt: "Agricultural drone flying over crop rows" },
  { src: "/redesign/industries/energy.webp", alt: "Enterprise drone inspecting bridge infrastructure" },
  { src: "/redesign/industries/logistics.webp", alt: "Logistics and mobility operations" },
  { src: "/redesign/industries/research.webp", alt: "Research and technology development" },
];

const ROBOT_USES = ["Service robotics", "Autonomous cleaning", "Delivery & logistics", "Industrial automation"];

const num = (i: number) => String(i + 1).padStart(2, "0");

function Arrow() {
  return (
    <svg className="arrow" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Icon({ name, className = "ico" }: { name: string; className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      {ICONS[name]}
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

// Download the 3D models + Draco decoder with the HTML (network only, no main-thread work); the
// journey scene picks them up from the cache when it starts.
const PRELOAD = ["/redesign/models/robot.glb", "/redesign/models/drone.glb", "/redesign/draco/draco_wasm_wrapper.js", "/redesign/draco/draco_decoder.wasm"];

/** Stations that show a real 3D product get a scene photo behind them: [slot, image name]. */
const JX: [string, string][] = [
  ["robot", "lobby"],
  ["drone", "rooftop"],
];

export default function Home() {
  return (
    <>
      <link rel="preload" href="/redesign/spline/robot-13bd456a.splinecode" as="fetch" crossOrigin="anonymous" />
      <link rel="preload" href="/redesign/spline/runtime-2.0.129/process.wasm" as="fetch" crossOrigin="anonymous" />
      <link rel="preload" href="/redesign/spline/runtime-2.0.129/bevel.wasm" as="fetch" crossOrigin="anonymous" />
      {PRELOAD.map((href) => (
        <link key={href} rel="preload" href={href} as="fetch" crossOrigin="anonymous" />
      ))}
      <Loader preload={[`${UP}/2026/07/Logo.svg`]} />
      <Motion />
      <SplineStage />
      <HeroNav />
      <div className="glow" aria-hidden="true"><i /><i /></div>

      <a className="skip-link" href="#main">Skip to content</a>

      <main id="main">
        {/* 1 ── Hero: glass navbar + 3D Intelligence Core (hero.tsx) */}
        <InkSample />
        <Hero />
        <FibreBackground />
        {/* Phase 2: the drone flies with the scroll from the hero to the journey (flight-scene.tsx) */}
        <Flight />

        {/* 2 ── Find your starting point: three capability cards with live 3D models (capabilities.tsx) */}
        <Capabilities />

        {/* Solutions journey: one 3D station per solution */}
        <section className="journey" id="technology" data-active="0">
          <div className="sticky">
            {/* scene photos behind the real robot / drone stations (fade in with data-active) */}
            <div className="jx-bg" aria-hidden="true">
              {JX.map(([slug, img]) => (
                <img key={slug} data-i={SOLUTIONS.findIndex((s) => s.slug === slug)} src={`/redesign/journey/${img}.webp`} srcSet={`/redesign/journey/${img}-sm.webp 960w, /redesign/journey/${img}.webp 1920w`} sizes="100vw" alt="" loading="lazy" decoding="async" />
              ))}
              <span className="jx-dust-floor" />
              <JourneyFilms />
              <svg className="jx-ink-crescent" viewBox="0 0 1920 1080" preserveAspectRatio="none" focusable="false">
                <path d="M0 0 H85 C-30 275 -25 625 150 1080 H0 Z" />
              </svg>
            </div>
            <JourneyScene />
            <div className="wrap journey-in">
              <div className="journey-head">
                <Eyebrow>TechnoAi Solutions</Eyebrow>
                <p className="count"><b /> / {num(SOLUTIONS.length - 1)}</p>
              </div>
              <div className="stations">
                {SOLUTIONS.map((s, i) => (
                  <article className="station" data-i={i} key={s.slug}>
                    <span className="n">{num(i)}</span>
                    <div className="jx-title-wrap" data-peek={s.slug}>
                      <span className="jx-peek-product" aria-hidden="true"><JourneyPeek slug={s.slug} /></span>
                      <h2>{s.title}</h2>
                    </div>
                    <p>{s.text}</p>
                    <a className="btn btn-line" href={s.href} aria-label={`Explore ${s.title}`} data-stringy={i === 0 ? "" : undefined}>Explore Solution <Arrow /></a>
                  </article>
                ))}
              </div>
              <div className="jx-card jx-clean" data-i={SOLUTIONS.findIndex((s) => s.slug === "robot")} aria-hidden="true">
                <p className="jx-card-head">
                  <svg viewBox="0 0 24 24"><path d="M9 3h6M12 3v6M7 9h10l1.5 6h-13zM5.5 15 4 21M9 15l-.5 6M12 15v6M15 15l.5 6M18.5 15l1.5 6" /></svg>
                  Cleaning in progress
                </p>
                <span className="jx-bar"><i /></span>
                <p className="jx-card-foot"><b data-jx="clean">40%</b> Area complete</p>
              </div>
              <nav className="rail" aria-label="Solutions">
                {SOLUTIONS.map((s, i) => (
                  <a key={s.slug} href={s.href} data-i={i} aria-label={s.title}>
                    <Icon name={s.slug} />
                    <span>{s.title}</span>
                  </a>
                ))}
              </nav>
            </div>
          </div>
        </section>

        <MobileJourney />

        {/* 3 ── Robotics with the same interactive Spline model as Section 02 */}
        <section id="robotics" className="closer closer-robot" data-progress data-steps={ROBOT_USES.length}>
          <div className="sticky">
            <div className="wrap closer-in">
              <div className="closer-text">
                <Eyebrow>Intelligence in motion</Eyebrow>
                <h2>Robotics &amp; Automation</h2>
                <p>Intelligent robots for service, cleaning, delivery, and industrial operations—built to support your teams and simplify everyday work.</p>
                <a className="btn btn-line" href="/robotics/">Explore Robotics Solutions <Arrow /></a>
                <ol className="uses">
                  {ROBOT_USES.map((u, i) => (
                    <li key={u} data-i={i}>
                      <span className="n">{num(i)}</span>
                      {u}
                    </li>
                  ))}
                </ol>
              </div>
              <div className="section-robot">
                <SplineCard />
              </div>
            </div>
          </div>
        </section>

        {/* 6 ── Industries: horizontal scroll */}
        <section id="industries" className="industries" data-progress data-hscroll>
          <div className="sticky">
            <div className="wrap ind-head">
              <Eyebrow>Industries We Serve</Eyebrow>
              <h2>Technology that works in your world.</h2>
              <p className="sub">
                Purpose-built systems for the environments you operate in.
              </p>
            </div>
            <div className="h-track">
              {INDUSTRIES.map(([title, text, href], i) => (
                <a className="ind" href={href} key={href}>
                  <div className="ind-photo"><img src={INDUSTRY_MEDIA[i].src} alt={INDUSTRY_MEDIA[i].alt} width="720" height="680" loading="lazy" decoding="async" /></div>
                  <div className="ind-copy"><h3>{title}</h3>
                  <p>{text}</p>
                  <span className="more">Explore Industry</span></div>
                </a>
              ))}
            </div>
            <div className="wrap h-bar" aria-hidden="true"><i /></div>
          </div>
        </section>

        <GlobalPresence />

        {/* 8 ── Partners */}
        <section className="sec partners">
          <div className="wrap center-head" data-reveal>
            <Eyebrow>Trusted by Organizations</Eyebrow>
            <h2>Technology Partners &amp; Clients</h2>
            <p className="sub">
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
            <a className="btn btn-blue" href="/partners/">All Partners <Arrow /></a>
            <a className="btn btn-line" href="/partners/">Become a Partner</a>
          </div>
        </section>

        {/* 9 ── Call to action */}
        <section className="wrap">
          <div className="cta" data-reveal>
            <p>
              Build your next AI or robotics project with us. Tell us what you need to automate, connect, or compute — we’ll help you choose the right systems.
            </p>
            <a className="btn btn-white" href="/request-a-quote/">Start a Project <Arrow /></a>
          </div>
        </section>
      </main>

      <footer className="ft">
        <div className="ft-main">
          <div className="ft-company">
            <a className="ft-logo" href="/" aria-label="TechnoAI home"><img src={`${UP}/2025/01/Technoai-Logo-transaparent-1.png`} width="512" height="240" alt="TechnoAI" loading="lazy" /></a>
            <ul className="ft-offices">
              {OFFICES.map(office => <li key={office.city}><strong>{office.name}</strong><span>{office.place}</span></li>)}
            </ul>
          </div>
          {FOOTER.map(([heading, links]) => <nav className="ft-links" key={heading} aria-label={heading}>
            <h2>{heading}</h2>
            <ul>{links.map(([label, href]) => <li key={href}><a href={href}>{label}</a></li>)}</ul>
          </nav>)}
        </div>
        <div className="ft-bottom">
          <span>© TechnoAi <span aria-hidden="true">·</span> <a href="https://technoai.ae/">technoai.ae</a></span>
          <nav aria-label="Social media">
            {SOCIAL.map(([label, href]) => (
              <a key={label} href={href} target="_blank" rel="noopener noreferrer"><span className="social-mark" dangerouslySetInnerHTML={{ __html: socialIconHtml(label) }} />{label}</a>
            ))}
          </nav>
        </div>
        <div className="ft-word" aria-hidden="true">//:technoai</div>
      </footer>
    </>
  );
}

