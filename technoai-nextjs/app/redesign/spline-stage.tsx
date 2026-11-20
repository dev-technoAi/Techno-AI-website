"use client";

import { useLayoutEffect, useRef } from "react";
import { useOpeningReady } from "./opening-ready";
import type Lenis from "lenis";
import "./spline-stage.css";

const slots = new Set<HTMLElement>();
const SLOT_EVENT = "technoai:robot-slots";
type StableContainer = HTMLElement & { moveBefore?: (node: Node, before: Node | null) => void };
export function registerRobotSlot(slot: HTMLElement) {
  slots.add(slot);
  window.dispatchEvent(new Event(SLOT_EVENT));
  return () => { slots.delete(slot); window.dispatchEvent(new Event(SLOT_EVENT)); };
}

/** One browsing context, model decode and GPU scene shared between the two robot placements. */
export default function SplineStage() {
  const openingReady = useOpeningReady();
  const host = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLIFrameElement>(null);
  useLayoutEffect(() => {
    const el = host.current;
    if (!el) return;
    const home = el.parentElement;
    const homeNext = el.nextSibling;
    let attachedSlot: HTMLElement | null = null;
    let raf = 0;
    let ready = false;
    let playing = false;
    let paintedSize = { width: 0, height: 0 };
    let lastPointer: { x: number; y: number } | null = null;
    const send = (value: string | { type: "spline:pointer"; x: number; y: number }) => frame.current?.contentWindow?.postMessage(value, location.origin);
    const pointer = { active: false, dirty: false, seen: false, x: 0, y: 0 };
    const setPlaying = (value: boolean) => {
      if (playing === value) return;
      playing = value;
      send(value ? "spline:play" : "spline:stop");
    };
    const write = (name: string, value: string) => {
      if (el.style.getPropertyValue(name) !== value) el.style.setProperty(name, value);
    };
    const update = () => {
      raf = 0;
      let best: { slot: HTMLElement; rect: DOMRect; area: number } | null = null;
      // Read all geometry before writing styles. No work runs while the page is idle.
      for (const slot of slots) {
        const rect = slot.getBoundingClientRect();
        const area = Math.max(0, Math.min(rect.bottom, innerHeight) - Math.max(rect.top, 0))
          * Math.max(0, Math.min(rect.right, innerWidth) - Math.max(rect.left, 0));
        if (area > 0 && (!best || area > best.area)) best = { slot, rect, area };
      }
      const attached = !!best && typeof (best.slot as StableContainer).moveBefore === "function";
      const width = best ? attached ? best.slot.clientWidth : best.rect.width : 0;
      const height = best ? attached ? best.slot.clientHeight : best.rect.height : 0;
      const sized = !!best && Math.abs(width - paintedSize.width) < 1 && Math.abs(height - paintedSize.height) < 1;
      const show = !!best && ready && sized && !document.hidden;
      if (best) {
        const { rect } = best;
        const container = best.slot as StableContainer;
        if (typeof container.moveBefore === "function") {
          // Preserve the browsing context while attaching its layer to the card.
          // Native scrolling then moves both together, without a JS-frame delay.
          if (attachedSlot !== best.slot) {
            attachedSlot?.removeAttribute("data-live-robot");
            container.moveBefore(el, null);
            attachedSlot = best.slot;
            attachedSlot.dataset.liveRobot = "true";
            el.dataset.attached = "true";
          }
          write("width", "100%");
          write("height", "100%");
          write("transform", "none");
        } else {
          write("width", `${rect.width}px`);
          write("height", `${rect.height}px`);
          write("transform", `translate3d(${rect.left}px,${rect.top}px,0)`);
        }
        const placement = best.slot.closest(".section-robot") ? "section" : "card";
        if (el.dataset.placement !== placement) el.dataset.placement = placement;
      }
      if (el.dataset.visible !== String(show)) el.dataset.visible = String(show);
      if (el.inert !== !show) el.inert = !show;
      setPlaying(show);
      if (!show) lastPointer = null;
      const moved = pointer.dirty;
      pointer.dirty = false;
      if (show && best && pointer.active && moved) {
        const x = Math.max(0, Math.min(width, (pointer.x - best.rect.left) * width / Math.max(1, best.rect.width)));
        const y = Math.max(0, Math.min(height, (pointer.y - best.rect.top) * height / Math.max(1, best.rect.height)));
        if (!lastPointer || Math.abs(x - lastPointer.x) > .5 || Math.abs(y - lastPointer.y) > .5) {
          send({ type: "spline:pointer", x, y });
          lastPointer = { x, y };
        }
      }
    };
    const schedule = () => { if (!raf) raf = requestAnimationFrame(update); };
    const onPointer = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" || !Number.isFinite(event.clientX) || !Number.isFinite(event.clientY)) return;
      if (pointer.seen && Math.abs(event.clientX - pointer.x) < .5 && Math.abs(event.clientY - pointer.y) < .5) return;
      pointer.active = true;
      pointer.dirty = true;
      pointer.seen = true;
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      schedule();
    };
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== location.origin || event.source !== frame.current?.contentWindow) return;
      if (event.data?.type === "spline:viewport-ready" && Number.isFinite(event.data.width) && Number.isFinite(event.data.height)) {
        paintedSize = { width: event.data.width, height: event.data.height };
        schedule();
      } else if (event.data === "spline:ready") {
        ready = true;
        el.dataset.ready = "true";
        playing = true; // the child's first rendered frame is live; pause if no placement is visible
        schedule();
      } else if (event.data?.type === "spline:wheel" && Number.isFinite(event.data.deltaY)) {
        if (document.documentElement.style.overflow === "hidden") return;
        const delta = event.data.deltaY * (event.data.deltaMode === 1 ? 16 : event.data.deltaMode === 2 ? innerHeight : 1);
        const lenis = (window as Window & { lenis?: Lenis }).lenis;
        if (lenis) lenis.scrollTo(lenis.targetScroll + delta, { programmatic: false });
        else window.scrollBy({ top: delta, behavior: "instant" });
      }
    };
    const resize = new ResizeObserver(schedule);
    const useNativePointer = () => { pointer.active = false; pointer.dirty = false; lastPointer = null; };
    const iframe = frame.current;
    iframe?.addEventListener("pointerenter", useNativePointer);
    resize.observe(document.body);
    window.addEventListener("message", onMessage);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    window.addEventListener(SLOT_EVENT, schedule);
    document.addEventListener("visibilitychange", schedule);
    window.addEventListener("pointermove", onPointer, { passive: true });
    schedule();
    send("spline:status");
    return () => {
      cancelAnimationFrame(raf);
      resize.disconnect();
      iframe?.removeEventListener("pointerenter", useNativePointer);
      window.removeEventListener("message", onMessage);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      window.removeEventListener(SLOT_EVENT, schedule);
      document.removeEventListener("visibilitychange", schedule);
      window.removeEventListener("pointermove", onPointer);
      attachedSlot?.removeAttribute("data-live-robot");
      // Restore React's host parent before it removes this component's DOM node.
      if (home && el.parentElement !== home) (home as StableContainer).moveBefore?.(el, homeNext?.parentNode === home ? homeNext : null);
    };
  }, []);
  return <div ref={host} className="robot-stage" data-visible="false" data-ready="false" inert>
    <iframe ref={frame} src={openingReady ? "/redesign/spline-frame/?fit=card&renderer=webgl" : undefined} title="Interactive 3D robot" loading="eager"
      onLoad={() => frame.current?.contentWindow?.postMessage("spline:status", location.origin)} />
  </div>;
}
