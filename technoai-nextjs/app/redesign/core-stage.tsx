"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";

/** CSS-only version of the core, shown while three.js loads and when WebGL is not available. */
function CoreFallback() {
  return (
    <div className="hx-fallback" aria-hidden="true">
      <div className="hx-fb-orb">
        <span className="hx-fb-core" />
        <span className="hx-fb-ring" />
        <span className="hx-fb-ring hx-fb-ring2" />
      </div>
      <div className="hx-fb-base" />
    </div>
  );
}

// Load the hero scene as soon as React hydrates; the opener covers shader warmup.
const CoreScene = dynamic(() => import("./core-scene"), { ssr: false, loading: () => <CoreFallback /> });

function hasWebGL() {
  // Cheap check only: creating a test WebGL context cost ~0.9 s on the first load. If the real
  // context fails, CoreScene's onFail switches to the CSS fallback anyway.
  return typeof window !== "undefined" && !!(window.WebGL2RenderingContext || window.WebGLRenderingContext);
}

const LABELS: [string, string][] = [
  ["ai", "AI Systems"],
  ["robotics", "Robotics"],
  ["edge", "Edge Computing"],
];

export default function CoreStage() {
  const stageRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<"wait" | "gl" | "fallback">("wait");
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      setMode(hasWebGL() ? "gl" : "fallback");
      observer.disconnect();
    }, { rootMargin: "150px" });
    observer.observe(stage);
    return () => observer.disconnect();
  }, []);
  const fail = useCallback(() => setMode("fallback"), []);
  const [ready, setReady] = useState(false); // 3D shaders compiled → swap the CSS orb for the real core
  const onReady = useCallback(() => setReady(true), []);

  return (
    <div ref={stageRef} className="hx-stage" data-mode={mode} data-ready={ready || undefined}>
      {mode === "gl" && <CoreScene onFail={fail} onReady={onReady} />}
      {(mode !== "gl" || !ready) && <CoreFallback />}
      {LABELS.map(([k, text]) => (
        <p className={`hx-label hx-label-${k}`} data-label={k} key={k}>
          <span>{text}</span>
          <i className="hx-label-dot" />
        </p>
      ))}
    </div>
  );
}
