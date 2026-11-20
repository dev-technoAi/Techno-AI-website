"use client";

import { useEffect, useRef } from "react";

/**
 * Mounts one WebGL scene (three.js) into a <canvas>, only when it is useful:
 *  - the scene module (and three.js) is downloaded only when the canvas comes near the viewport
 *  - the render loop runs only while the canvas is on screen and the tab is visible
 *  - no WebGL / Save-Data / very small devices: the canvas stays empty and the CSS fallback
 *    (whatever the parent draws behind it) is what people see
 *  - reduced motion: one still frame is rendered, nothing moves
 * Everything is disposed on unmount (page transitions, HMR).
 */

export type SceneKind = "globe" | "field" | "orb";

export type SceneOptions = {
  /** element that holds related DOM (labels, [data-office] items, --p progress) */
  root: HTMLElement;
  reduce: boolean;
  fine: boolean;
};

export type SceneApi = {
  resize(width: number, height: number, dpr: number): void;
  /** t = seconds since start, dt = seconds since previous frame */
  frame(t: number, dt: number): void;
  /** pointer position relative to the scene root, -1..1 */
  pointer(x: number, y: number): void;
  dispose(): void;
};

const loaders: Record<SceneKind, () => Promise<{ create(canvas: HTMLCanvasElement, o: SceneOptions): SceneApi }>> = {
  orb: () => import("./orb"),
  globe: () => import("./globe"),
  field: () => import("./field"),
};

function webglOk() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

export function GLScene({ kind, className, rootSelector }: { kind: SceneKind; className?: string; rootSelector?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const nav = navigator as Navigator & { connection?: { saveData?: boolean }; deviceMemory?: number };
    if (nav.connection?.saveData || (nav.deviceMemory !== undefined && nav.deviceMemory < 2) || !webglOk()) return;

    const root = (rootSelector && canvas.closest<HTMLElement>(rootSelector)) || canvas.parentElement!;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

    let api: SceneApi | null = null;
    let disposed = false;
    let visible = false;
    let raf = 0;
    let start = 0;
    let last = 0;

    const size = () => {
      if (!api) return;
      const r = canvas.getBoundingClientRect();
      // Large screens get a capped pixel ratio: the scenes are soft points/lines, 1.5x is plenty.
      api.resize(Math.max(1, r.width), Math.max(1, r.height), Math.min(window.devicePixelRatio || 1, r.width > 1200 ? 1.5 : 2));
    };

    const loop = (now: number) => {
      raf = 0;
      if (!api || disposed) return;
      if (!start) start = last = now;
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      api.frame((now - start) / 1000, dt);
      if (visible && !document.hidden && !reduce) raf = requestAnimationFrame(loop);
    };
    const kick = () => { if (!raf && api && visible && !document.hidden) raf = requestAnimationFrame(loop); };

    const onPointer = (e: PointerEvent) => {
      if (!api) return;
      const r = root.getBoundingClientRect();
      api.pointer(((e.clientX - r.left) / r.width) * 2 - 1, ((e.clientY - r.top) / r.height) * 2 - 1);
    };

    const ro = new ResizeObserver(() => { size(); if (reduce) kick(); });
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible && !api) {
        loaders[kind]().then((m) => {
          if (disposed) return;
          try {
            api = m.create(canvas, { root, reduce, fine });
          } catch {
            return; // context lost / unsupported: keep the CSS fallback
          }
          size();
          ro.observe(canvas);
          root.classList.add("gl-on");
          kick();
        }).catch(() => {});
      } else kick();
    }, { rootMargin: "200px 0px" });
    io.observe(canvas);

    const onVis = () => kick();
    document.addEventListener("visibilitychange", onVis);
    if (fine && !reduce) root.addEventListener("pointermove", onPointer, { passive: true });

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      root.removeEventListener("pointermove", onPointer);
      root.classList.remove("gl-on");
      api?.dispose();
    };
  }, [kind, rootSelector]);

  return <canvas ref={ref} className={`gl ${className ?? ""}`} aria-hidden="true" />;
}
