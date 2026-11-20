"use client";

import "./spotlight.css";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

// Pinned product spotlight (scroll effect after the "Matter" template the owner liked): the real KLEENBOT C40
// stays in the middle and turns while the intro fades away and the spec list rises in, one line at a time.
// Progress = the section's --p from fx.tsx Motion ([data-progress]); no extra animation library.
// Specs: KEENON official C40 product page (keenon.com/en/product/C40).

const Scene = dynamic(() => import("./spotlight-scene"), { ssr: false });

const FEATURES: [string, string, string][] = [
  ["4-in-1 cleaning", "Sweeps, vacuums, scrubs and mops in one pass.", "Sweep · Vacuum · Scrub · Mop"],
  ["Autonomous", "Maps the site and plans its own routes.", "Self-navigating"],
  ["Large areas", "Built for lobbies, offices and malls.", "Up to 1,100 m²/h"],
  ["Long shifts", "Quick battery swap between shifts.", "Up to 12 h"],
];

const SPECS: [string, string][] = [
  ["Size", "578 × 500 × 690 mm"],
  ["Weight", "70 kg"],
  ["Efficiency", "1,100 m²/h"],
  ["Runtime", "12 h sweep · 5 h scrub"],
  ["Battery", "25.6 V · 50 Ah"],
  ["Clean water", "16 L"],
];

export default function Spotlight() {
  const ref = useRef<HTMLElement>(null);
  const [near, setNear] = useState(false);
  useEffect(() => {
    // Creating a WebGL context costs ~0.5-1 s on laptop GPUs: do it in an idle moment well before the
    // section arrives (not while the user is scrolling past Section 02).
    let idle = 0;
    const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number; cancelIdleCallback?: (id: number) => void };
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        idle = w.requestIdleCallback ? w.requestIdleCallback(() => setNear(true), { timeout: 2500 }) : window.setTimeout(() => setNear(true), 400);
      },
      { rootMargin: "300% 0px" },
    );
    io.observe(ref.current!);
    return () => {
      io.disconnect();
      if (w.cancelIdleCallback) w.cancelIdleCallback(idle);
      clearTimeout(idle);
    };
  }, []);

  return (
    <section ref={ref} className="sl" data-progress aria-labelledby="sl-title">
      <div className="sl-sticky">
        <p className="sl-word" aria-hidden="true">KLEENBOT</p>
        <div className="sl-stage">{near && <Scene />}</div>

        <div className="sl-intro">
          <h2 id="sl-title">
            Autonomous cleaning,
            <br />
            <span>delivered and integrated.</span>
          </h2>
          <p>
            KEENON KLEENBOT C40 cleans large floors on its own, day or night. TechnoAi supplies it, sets it up on your site and
            supports it in operation.
          </p>
        </div>

        <ul className="sl-features">
          {FEATURES.map(([t, d, m]) => (
            <li key={t}>
              <strong>{t}</strong>
              <span>{d}</span>
              <em>{m}</em>
            </li>
          ))}
        </ul>

        <div className="sl-specs">
          <p className="sl-specs-head">KLEENBOT C40</p>
          <dl>
            {SPECS.map(([k, v], i) => (
              <div key={k} style={{ ["--i" as string]: i }}>
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
          <a className="sl-link" href="/technoai-keenon-robotics/">
            Explore KEENON robotics
            <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 10h12M11 5l5 5-5 5" /></svg>
          </a>
        </div>
      </div>
    </section>
  );
}
