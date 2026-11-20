"use client";

import "./ecosystem.css";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

// Section 03 — "Solutions built around real operations": one connected intelligence ecosystem.
// Pinned while scrolling; the page's [data-progress] system (fx.tsx + Lenis) sets --p and data-step,
// the 3D scene reads the same scroll position. No second animation library.

const EcosystemScene = dynamic(() => import("./ecosystem-scene"), { ssr: false, loading: () => <span className="ex-wait" aria-hidden="true" /> });

const LINE_1 = "Not every project needs more technology.";
const LINE_2 = "It needs the right combination of systems, delivered and integrated properly.";
const BLUE_WORDS = new Set(["right", "combination", "integrated", "properly."]);

const STEPS = ["AI processor", "Robotics", "Industrial sensors", "Edge computing", "Autonomous devices"];

export default function Ecosystem() {
  const ref = useRef<HTMLElement>(null);
  const [show, setShow] = useState(false);
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => e.isIntersecting && (setShow(true), io.disconnect()), { rootMargin: "1200px 0px" });
    io.observe(ref.current!);
    return () => io.disconnect();
  }, []);

  const words = [...LINE_1.split(" ").map((w) => ({ w, line: 1 })), ...LINE_2.split(" ").map((w) => ({ w, line: 2 }))];
  return (
    <section ref={ref} className="ex" data-progress data-steps={STEPS.length} aria-labelledby="ex-title">
      <div className="ex-sticky">
        <div className="ex-inner">
          <div className="ex-copy">
            <p className="ex-eyebrow">
              <span className="ex-chip" aria-hidden="true">//:</span>
              Solutions built around real operations
            </p>
            <h2 id="ex-title" className="ex-title" style={{ ["--n" as string]: words.length }}>
              {words.map(({ w, line }, i) => (
                <span key={i} className={`ex-w${line === 1 ? " ex-l1" : ""}${BLUE_WORDS.has(w) ? " ex-blue" : ""}`} style={{ ["--i" as string]: i }}>
                  {w}{" "}
                  {i === LINE_1.split(" ").length - 1 && <br />}
                </span>
              ))}
            </h2>
            <ol className="ex-steps" aria-label="Connected technologies">
              {STEPS.map((s, i) => (
                <li key={s} data-i={i}>
                  <span className="ex-dot" aria-hidden="true" />
                  {s}
                </li>
              ))}
            </ol>
            <div className="ex-meter" aria-hidden="true">
              <i />
              <span>Integrated</span>
            </div>
          </div>
          <div className="ex-stage">{show && <EcosystemScene section={ref} />}</div>
        </div>
      </div>
    </section>
  );
}
