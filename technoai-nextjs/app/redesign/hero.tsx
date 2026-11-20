import "./hero.css";
import "./menu.css";
import { INDUSTRIES, SOLUTIONS } from "./data";
import CoreStage from "./core-stage";
import HeroBackground from "./hero-background";

// Home hero: floating glass navbar + headline + 3D "Intelligence Core".
// Brand: Noto Sans (TC), #0f1a1b / #146b8c / #289fb7 / #9fe7e7 (TechnoAi Brand Identity PDF).

export const NAV_ITEMS = [
  { label: "Solutions", href: "#solutions", links: SOLUTIONS.map((s) => [s.title, s.href] as [string, string]) },
  {
    label: "Hardware",
    href: "/all-products/",
    links: [
      ["All Products", "/all-products/"],
      ["Drones", "/drones/"],
      ["Robotics", "/robotics/"],
      ["Satellites", "/satellites/"],
      ["Dev Kits", "/dev-kits/"],
    ] as [string, string][],
  },
  { label: "Industries", href: "#industries", links: INDUSTRIES.map(([t, , h]) => [t, h] as [string, string]) },
  {
    label: "Services",
    href: "/services/",
    links: [
      ["Procurement", "/procurement/"],
      ["Integration", "/integration/"],
      ["Project Management", "/project-management/"],
      ["Technical Support", "/technical-support/"],
    ] as [string, string][],
  },
];

const words = (text: string, from: number) =>
  text.split(" ").map((w, i) => (
    <span key={i}>
      <span className="hx-w" style={{ ["--i" as string]: from + i }}>
        <span>{w}</span>
      </span>{" "}
    </span>
  ));

export default function Hero() {
  return (
    <>
      <section className="hx-hero" aria-labelledby="hx-title">
        <div className="hx-bg" aria-hidden="true">
          <HeroBackground />
          <span className="hx-bg-veil" />
          <span className="hx-flow"><i /><i /><i /></span>
          <span className="hx-bg-floor" />
        </div>

        <div className="hx-inner">
          <div className="hx-copy">
            <span className="hx-uae-mark hx-rise" role="img" aria-label="Proud of UAE" style={{ ["--d" as string]: "0.05s" }}>
              <img src="/redesign/hero/proud-of-uae.png" width="269" height="300" alt="" loading="eager" decoding="async" />
            </span>
            <h1 id="hx-title" className="hx-title">
              <span className="hx-line">{words("Intelligence, built", 0)}</span>
              <span className="hx-line hx-blue">{words("for the real world.", 2)}</span>
            </h1>
            <p className="hx-lead hx-rise" style={{ ["--d" as string]: "0.75s" }}>
              AI systems, autonomous robotics, and computing hardware, selected and integrated for your operations.
            </p>
            <div className="hx-actions hx-rise" style={{ ["--d" as string]: "0.9s" }}>
              <a className="hx-btn hx-btn-primary" href="/request-a-quote/">
                Start a Project
                <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 10h12M11 5l5 5-5 5" /></svg>
              </a>
              <a className="hx-btn hx-btn-ghost" href="#solutions">
                Explore Solutions
              </a>
            </div>
          </div>
          <CoreStage />
        </div>

        <a className="hx-scroll" href="#solutions" aria-label="Scroll to explore">
          <span className="hx-mouse" aria-hidden="true"><i /></span>
          <span className="hx-scroll-text">Scroll to explore</span>
        </a>
      </section>
    </>
  );
}
