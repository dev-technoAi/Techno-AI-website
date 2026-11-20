"use client";

import { Component, useEffect, useRef, useState, type ReactNode } from "react";
import Spline from "@splinetool/react-spline";

// Preserve the owner's 16:10 composition/crop with a smaller drawing buffer.
// CSS applies the same final size; the GPU renders 56% fewer pixels.
const BASE_WIDTH = 960;
const BASE_HEIGHT = 600;
const CROP_PERCENT = 15;
const SIZE_MULTIPLIER = 0.85;
const SCENE = "/redesign/spline/robot-13bd456a.splinecode";

type SplineApp = { play?: () => void; stop?: () => void; requestRender?: () => void };
// Contain a failed WebGL context without interrupting the rest of the site.
class RobotBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? null : this.props.children; }
}

export default function Frame() {
  const outerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<SplineApp | null>(null);
  const [scale, setScale] = useState(1);
  // ?fit=card → small card view: zoom on the robot's upper body, centred (Section 02 "Robotics" card)
  const [card, setCard] = useState(false); // read after mount (no server/client mismatch)
  const [box, setBox] = useState({ w: 300, h: 250 });
  const readyFrame = useRef(0);
  const sizeFrame = useRef(0);
  const loaded = useRef(false);

  useEffect(() => {
    setCard(new URLSearchParams(window.location.search).get("fit") === "card");
  }, []);

  useEffect(() => {
    // the parent page pauses/resumes the scene when its section leaves/enters the screen
    const onMsg = (e: MessageEvent) => {
      if (e.origin !== window.location.origin || e.source !== window.parent) return;
      if (e.data === "spline:stop") appRef.current?.stop?.();
      if (e.data === "spline:play") appRef.current?.play?.();
      if (e.data === "spline:status" && loaded.current) window.parent.postMessage("spline:ready", location.origin);
      if (e.data?.type === "spline:pointer" && loaded.current && Number.isFinite(e.data.x) && Number.isFinite(e.data.y)) {
        const canvas = outerRef.current?.querySelector("canvas");
        if (!canvas) return;
        const point = { clientX: e.data.x, clientY: e.data.y, bubbles: true };
        canvas.dispatchEvent(new PointerEvent("pointermove", { ...point, pointerType: "mouse", isPrimary: true }));
        appRef.current?.requestRender?.();
      }
    };
    window.addEventListener("message", onMsg);
    let nativePointer: { x: number; y: number } | null = null;
    const onNativePointer = (event: PointerEvent) => {
      if (!event.isTrusted || event.pointerType !== "mouse") return;
      // Moving the iframe under a stationary cursor is not a new mouse gesture.
      if (nativePointer && nativePointer.x === event.screenX && nativePointer.y === event.screenY) {
        event.stopImmediatePropagation();
        return;
      }
      nativePointer = { x: event.screenX, y: event.screenY };
    };
    window.addEventListener("pointermove", onNativePointer, { capture: true, passive: true });
    // This embedded scene must not swallow the page's wheel gestures.
    const onWheel = (event: WheelEvent) => {
      if (window.parent === window || event.ctrlKey) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      window.parent.postMessage({ type: "spline:wheel", deltaY: event.deltaY, deltaMode: event.deltaMode }, window.location.origin);
    };
    window.addEventListener("wheel", onWheel, { passive: false, capture: true });
    return () => {
      cancelAnimationFrame(readyFrame.current);
      cancelAnimationFrame(sizeFrame.current);
      window.removeEventListener("message", onMsg);
      window.removeEventListener("pointermove", onNativePointer, true);
      window.removeEventListener("wheel", onWheel, true);
    };
  }, []);

  useEffect(() => {
    // Acknowledge the crop only after React and the scene have painted the new size.
    // The shared parent keeps a stale-sized frame hidden while switching placements.
    sizeFrame.current = requestAnimationFrame(() => {
      appRef.current?.requestRender?.();
      sizeFrame.current = requestAnimationFrame(() => {
        window.parent.postMessage({ type: "spline:viewport-ready", width: box.w, height: box.h }, location.origin);
      });
    });
    return () => cancelAnimationFrame(sizeFrame.current);
  }, [box, card]);

  useEffect(() => {
    const el = outerRef.current;
    if (!el) return;
    const update = (width: number, height: number) => {
      setScale((width / BASE_WIDTH) * SIZE_MULTIPLIER);
      setBox({ w: width, h: height });
    };
    update(el.offsetWidth, el.offsetHeight);
    const ro = new ResizeObserver((entries) => entries.forEach((en) => update(en.contentRect.width, en.contentRect.height)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const cropHeight = BASE_HEIGHT * (1 - CROP_PERCENT / 100);
  const spline = (
    <RobotBoundary>
      <Spline
        scene={SCENE}
        wasmPath="/redesign/spline/runtime-2.0.129"
        onLoad={(app) => {
          // Clear the scene background completely so the parent surface shows through.
          // Matching hex colours is unreliable across the canvas post-processing pipeline.
          app.setBackgroundColor("rgba(0, 0, 0, 0)");
          appRef.current = app;
          app.play?.();
          app.requestRender?.();
          // Let the first canvas frame paint before the parent fades out the poster.
          readyFrame.current = requestAnimationFrame(() => {
            app.requestRender?.();
            readyFrame.current = requestAnimationFrame(() => {
              loaded.current = true;
              window.parent?.postMessage("spline:ready", window.location.origin);
            });
          });
        }}
      />
    </RobotBoundary>
  );
  // Keep one component tree when the card crop is applied: remounting Spline loaded the scene twice.
  const s = (box.h / BASE_HEIGHT) * 1.05;
  return (
    <div ref={outerRef} style={{ width: "100%", height: "100vh", overflow: "hidden", position: "relative" }}>
      <div
        style={card ? {
          position: "absolute", left: box.w / 2 - BASE_WIDTH * .5 * s, top: box.h / 2 - BASE_HEIGHT * (560 / 900) * s,
          width: BASE_WIDTH, height: BASE_HEIGHT, transform: `scale(${s})`, transformOrigin: "0 0",
        } : {
          position: "absolute",
          bottom: 0,
          left: "50%",
          width: BASE_WIDTH,
          height: cropHeight,
          overflow: "hidden",
          transform: `translateX(-50%) scale(${scale})`,
          transformOrigin: "bottom center",
        }}
      >
        <div style={{ width: BASE_WIDTH, height: BASE_HEIGHT, transform: card ? undefined : `translateY(-${CROP_PERCENT / 2}%)` }}>
          {spline}
        </div>
      </div>
    </div>
  );
}
