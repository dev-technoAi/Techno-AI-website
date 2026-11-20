"use client";

import "./signal-path.css";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";

// Section 03 — "Solutions built around real operations": one continuous signal path SENSE → DECIDE → ACT.
// Pinned while scrolling. The page's [data-progress] system (fx.tsx + Lenis) sets --p on the section;
// the 3D scene reads the same scroll position and writes data-stage. No second animation library.

const SignalPathScene = dynamic(() => import("./signal-path-scene"), { ssr: false, loading: () => null });

const LINE_1 = "Not every project needs more technology.";
const LINE_2 = "It needs the right combination of systems, delivered and integrated properly.";
const BLUE_WORDS = new Set(["right", "combination", "integrated", "properly."]);

const STAGES = [
  ["Sense", "Cameras, sensors and field devices capture what is happening on site."],
  ["Decide", "AI processors and edge computing turn that data into decisions, locally."],
  ["Act", "Robotics and actuators respond. TechnoAi supplies and integrates the whole chain."],
] as const;

function hasWebGL() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

/** Static drawing of the same path for browsers without WebGL. */
function Fallback() {
  return (
    <svg className="sp-fallback" viewBox="0 0 1200 400" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
      <defs>
        <linearGradient id="sp-fb-g" x1="0" x2="1">
          <stop offset="0" stopColor="#9fe7e7" />
          <stop offset=".35" stopColor="#289fb7" />
          <stop offset="1" stopColor="#146b8c" />
        </linearGradient>
      </defs>
      <path d="M-20 340 C 200 330 300 320 380 280 S 470 150 560 150 S 660 250 720 290 S 900 300 980 270 S 1080 160 1110 20" fill="none" stroke="url(#sp-fb-g)" strokeWidth="26" strokeLinecap="round" />
      {[[330, 300], [600, 165], [880, 292]].map(([x, y], i) => (
        <g key={i} transform={`translate(${x} ${y})`}>
          {i === 1 ? <rect x="-24" y="-24" width="48" height="48" rx="6" fill="#d8dee1" stroke="#0f1a1b" strokeOpacity=".2" /> : <circle r="24" fill="#d8dee1" stroke="#0f1a1b" strokeOpacity=".2" />}
          <circle r="8" fill={i === 2 ? "#289fb7" : "#0f1a1b"} />
        </g>
      ))}
    </svg>
  );
}

export default function SignalPath() {
  const ref = useRef<HTMLElement>(null);
  const [show, setShow] = useState(false);
  const [mode, setMode] = useState<"gl" | "fallback">("gl");
  const fail = useCallback(() => setMode("fallback"), []);

  useEffect(() => {
    if (!hasWebGL()) setMode("fallback");
    const io = new IntersectionObserver(([e]) => e.isIntersecting && (setShow(true), io.disconnect()), { rootMargin: "1200px 0px" });
    io.observe(ref.current!);
    return () => io.disconnect();
  }, []);

  const words = [...LINE_1.split(" ").map((w) => ({ w, line: 1 })), ...LINE_2.split(" ").map((w) => ({ w, line: 2 }))];
  return (
    <section ref={ref} className="sp" data-progress data-stage="0" data-mode={mode} aria-labelledby="sp-title">
      <div className="sp-sticky">
        <div className="sp-stage">
          {mode === "gl" ? show && <SignalPathScene section={ref} onFail={fail} /> : <Fallback />}
        </div>

        <div className="sp-inner">
          <div className="sp-copy">
            <p className="sp-eyebrow">
              <span className="sp-chip" aria-hidden="true">//:</span>
              Solutions built around real operations
            </p>
            <h2 id="sp-title" className="sp-title" style={{ ["--n" as string]: words.length }}>
              {words.map(({ w, line }, i) => (
                <span key={i} className={`sp-w${line === 1 ? " sp-l1" : ""}${BLUE_WORDS.has(w) ? " sp-blue" : ""}`} style={{ ["--i" as string]: i }}>
                  {w}{" "}
                  {i === LINE_1.split(" ").length - 1 && <br />}
                </span>
              ))}
            </h2>
          </div>

          <ol className="sp-steps" aria-label="How a connected system works">
            {STAGES.map(([t, d], i) => (
              <li key={t} data-i={i}>
                <span className="sp-num">0{i + 1}</span>
                <strong>{t}</strong>
                <p>{d}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
