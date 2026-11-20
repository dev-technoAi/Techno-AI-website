"use client";

import { useEffect, useRef } from "react";

/**
 * "Venom" buttons (reference: owner's Instagram reel).
 * Cursor near (not touching) → black goo tendrils grow out of the button edge and reach for it.
 * CTA buttons get: hover → they stick to the cursor with thin elastic strings;
 * move away → strings stretch, the button tilts/leans after the cursor; too far → strings snap and
 * the button springs back with a wobble. One shared canvas, drawn only while something is active.
 * Mouse only (touch/pen pointer events are ignored); off for prefers-reduced-motion.
 */

type Str = { ax: number; ay: number; ex: number; ey: number; vx: number; vy: number; k: number; ox: number; oy: number };
type Item = {
  el: HTMLElement;
  attached: boolean;
  anchored: boolean; // strings re-anchored on the edge the cursor left through
  snapping: number; // 0..1 retract progress (1 = done)
  strings: Str[];
  reach: number; // 0..1 how far the venom tendrils have grown towards a near (not touching) cursor
  tx: number; ty: number; rx: number; ry: number; // current lean
  vtx: number; vty: number; vrx: number; vry: number;
};

const SNAP = 190; // px beyond the button edge before the strings snap
const N = 18; // strings per button
const REACH = 185; // px around the button where the venom tendrils start reaching for the cursor
const INK = "15, 26, 27";

/** Tapered, wobbling goo strand from (ax,ay) to (bx,by) bending through (cx,cy). Thick at the button, thin at the tip. */
function strand(ctx: CanvasRenderingContext2D, ax: number, ay: number, cx: number, cy: number, bx: number, by: number, w0: number, w1: number, amp: number, t: number, seed: number, alpha: number) {
  const n = 16;
  let px = ax;
  let py = ay;
  for (let i = 1; i <= n; i++) {
    const u = i / n;
    const iu = 1 - u;
    let x = iu * iu * ax + 2 * iu * u * cx + u * u * bx;
    let y = iu * iu * ay + 2 * iu * u * cy + u * u * by;
    // perpendicular wobble, strongest in the middle
    const dx = 2 * iu * (cx - ax) + 2 * u * (bx - cx);
    const dy = 2 * iu * (cy - ay) + 2 * u * (by - cy);
    const l = Math.hypot(dx, dy) || 1;
    const wob = Math.sin(u * 7 + t * 5 + seed) * amp * Math.sin(u * Math.PI);
    x += (-dy / l) * wob;
    y += (dx / l) * wob;
    ctx.lineWidth = w0 + (w1 - w0) * u;
    ctx.strokeStyle = `rgba(${INK}, ${alpha.toFixed(3)})`;
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(x, y);
    ctx.stroke();
    px = x;
    py = y;
  }
  return [px, py];
}

export default function Stringy() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current!;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = canvas.getContext("2d")!;
    const items: Item[] = Array.from(document.querySelectorAll<HTMLElement>("a.btn, a.hx-btn, [data-stringy]")).map((el) => ({
      el, attached: false, anchored: false, snapping: 1, strings: [], reach: 0, tx: 0, ty: 0, rx: 0, ry: 0, vtx: 0, vty: 0, vrx: 0, vry: 0,
    }));
    const available = (el: HTMLElement) => {
      const style = getComputedStyle(el);
      return style.display !== "none" && style.visibility !== "hidden" && style.pointerEvents !== "none" && el.getClientRects().length > 0;
    };
    const mouse = { x: -1e4, y: -1e4 };
    let raf = 0;
    let running = false;

    const size = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = innerWidth * dpr;
      canvas.height = innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    size();

    /** points along the button edge that faces the cursor */
    const anchorsFor = (r: DOMRect) => {
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const dx = (mouse.x - cx) / (r.width / 2);
      const dy = (mouse.y - cy) / (r.height / 2);
      const out: [number, number][] = [];
      for (let i = 0; i < N; i++) {
        const t = (i / (N - 1) - 0.5) * 0.8; // spread along the edge
        if (Math.abs(dy) >= Math.abs(dx) * 0.35) {
          out.push([cx + t * r.width, dy > 0 ? r.bottom - 3 : r.top + 3]);
        } else {
          out.push([dx > 0 ? r.right - r.height / 2 + Math.cos(t * 3) * r.height * 0.42 : r.left + r.height / 2 - Math.cos(t * 3) * r.height * 0.42, cy + Math.sin(t * 3) * r.height * 0.42]);
        }
      }
      return out;
    };

    const attach = (it: Item) => {
      const r = it.el.getBoundingClientRect();
      it.attached = true;
      it.snapping = 1;
      it.strings = anchorsFor(r).map(([ax, ay]) => ({
        ax: ax - r.left, ay: ay - r.top, // relative to the button, so they follow its lean
        ex: mouse.x, ey: mouse.y, vx: 0, vy: 0,
        k: 0.08 + Math.random() * 0.12,
        ox: (Math.random() - 0.5) * 12, oy: (Math.random() - 0.5) * 8,
      }));
      it.el.classList.add("is-stuck");
    };
    const snap = (it: Item) => {
      it.attached = false;
      it.snapping = 0;
      it.el.classList.remove("is-stuck");
      it.el.classList.remove("is-snap");
      void it.el.offsetWidth;
      it.el.classList.add("is-snap");
    };

    const t0 = performance.now();
    const frame = () => {
      const now = (performance.now() - t0) / 1000;
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      let busy = false;
      for (const it of items) {
        const el = it.el;
        if (!available(el)) {
          it.attached = false;
          it.snapping = 1;
          it.strings = [];
          it.reach = 0;
          el.classList.remove("is-reaching", "is-stuck", "is-snap");
          el.style.transform = "";
          continue;
        }
        const r = el.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        const inside = mouse.x >= r.left && mouse.x <= r.right && mouse.y >= r.top && mouse.y <= r.bottom;

        if (it.attached) {
          // distance from the button edge
          const ddx = Math.max(r.left - mouse.x, 0, mouse.x - r.right);
          const ddy = Math.max(r.top - mouse.y, 0, mouse.y - r.bottom);
          const far = Math.hypot(ddx, ddy);
          if (far > SNAP) snap(it);
          const pull = it.attached && !inside ? Math.min(far / SNAP, 1) : 0;
          // lean target: towards the cursor, more the further the strings stretch
          const ang = Math.atan2(mouse.y - cy, mouse.x - cx);
          const goal = { tx: Math.cos(ang) * 14 * pull, ty: Math.sin(ang) * 10 * pull, rx: -Math.sin(ang) * 14 * pull, ry: Math.cos(ang) * 18 * pull };
          spring(it, goal);
        } else {
          spring(it, { tx: 0, ty: 0, rx: 0, ry: 0 });
        }
        const moving = Math.abs(it.tx) + Math.abs(it.ty) + Math.abs(it.vtx) + Math.abs(it.vrx) > 0.05;
        el.style.transform = moving || it.attached ? `perspective(500px) translate(${it.tx}px, ${it.ty}px) rotateX(${it.rx}deg) rotateY(${it.ry}deg)` : "";

        // venom: the cursor is near but not touching → tendrils grow out of the edge towards it
        {
          const ddx = Math.max(r.left - mouse.x, 0, mouse.x - r.right);
          const ddy = Math.max(r.top - mouse.y, 0, mouse.y - r.bottom);
          const far = Math.hypot(ddx, ddy);
          const target = !it.attached && it.snapping >= 1 && !inside && far < REACH ? Math.pow(1 - far / REACH, 1.3) : 0;
          it.reach += (target - it.reach) * 0.14;
          el.classList.toggle("is-reaching", it.reach > 0.12 && !it.attached);
          if (it.reach > 0.01) {
            busy = true;
            ctx.lineCap = "round";
            ctx.shadowColor = "rgba(15, 26, 27, .3)";
            ctx.shadowBlur = 4;
            const anchors = anchorsFor(r);
            for (let i = 0; i < anchors.length; i += 2) {
              const [ax, ay] = anchors[i];
              const seed = i * 1.7;
              const grow = Math.min(1, it.reach * (1.05 + 0.12 * Math.sin(now * 2.2 + seed)) * (0.82 + 0.18 * (((i * 37) % 10) / 10)));
              const bx = ax + (mouse.x - ax) * grow * 0.92;
              const by = ay + (mouse.y - ay) * grow * 0.92;
              const cxp = (ax + bx) / 2 + Math.sin(now * 3 + seed) * 10 * it.reach;
              const cyp = (ay + by) / 2 + Math.cos(now * 2.4 + seed) * 8 * it.reach;
              const reachLen = Math.hypot(bx - ax, by - ay);
              const [tx2, ty2] = strand(ctx, ax, ay, cxp, cyp, bx, by, 3 + 5 * it.reach, 1, Math.min(2 + reachLen * 0.06, 6), now * 0.6, seed, 0.85 * Math.min(1, it.reach * 2.2));
              // little goo droplet at the tip and a swelling at the base
              ctx.fillStyle = `rgba(${INK}, ${(0.8 * Math.min(1, it.reach * 2)).toFixed(3)})`;
              ctx.beginPath();
              ctx.arc(tx2, ty2, 1.4 + 1.6 * it.reach, 0, Math.PI * 2);
              ctx.arc(ax, ay, 2 + 4 * it.reach, 0, Math.PI * 2);
              ctx.fill();
            }
            ctx.shadowBlur = 0;
          }
        }

        // strings
        if (it.attached && inside) it.anchored = false;
        if (it.attached && !inside && !it.anchored) {
          it.anchored = true;
          anchorsFor(r).forEach(([ax, ay], i) => {
            const s = it.strings[i];
            if (!s) return;
            s.ax = ax - r.left;
            s.ay = ay - r.top;
            s.ex = ax;
            s.ey = ay;
          });
        }
        if (it.attached || it.snapping < 1) {
          busy = true;
          if (!it.attached) it.snapping = Math.min(it.snapping + 0.06, 1);
          ctx.lineCap = "round";
          for (const s of it.strings) {
            const ax = r.left + s.ax + it.tx * 0.3;
            const ay = r.top + s.ay + it.ty * 0.3;
            // string end: follows the fingertip while attached, flies back to its anchor after the snap
            const gx = it.attached ? mouse.x + s.ox : ax;
            const gy = it.attached ? mouse.y + s.oy : ay;
            s.vx = (s.vx + (gx - s.ex) * s.k) * 0.72;
            s.vy = (s.vy + (gy - s.ey) * s.k) * 0.72;
            s.ex += s.vx;
            s.ey += s.vy;
            const len = Math.hypot(s.ex - ax, s.ey - ay);
            if (len < 2 || (it.attached && inside)) continue; // only visible once the cursor leaves the button
            // slack → the string sags; tight → nearly straight
            const sag = Math.max(0, 70 - len * 0.35) + Math.abs(s.vx) * 1.5;
            const mx = (ax + s.ex) / 2 + s.vx * 2;
            const my = (ay + s.ey) / 2 + sag;
            const alpha = (it.attached ? 0.55 : 0.55 * (1 - it.snapping)) * (0.5 + 0.5 * Math.min(1, 140 / Math.max(len, 1)));
            const seed = s.k * 97;
            strand(ctx, ax, ay, mx, my, s.ex, s.ey, 3.2, 0.7, 2.5 + Math.min(len / 60, 3), now, seed, Math.min(alpha * 1.4, 0.85));
          }
        }
        if (moving) busy = true;
      }
      if (busy || items.some((i) => i.attached)) raf = requestAnimationFrame(frame);
      else {
        running = false;
        ctx.clearRect(0, 0, innerWidth, innerHeight);
      }
    };
    const kick = () => {
      if (running) return;
      running = true;
      raf = requestAnimationFrame(frame);
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType && e.pointerType !== "mouse") return; // touch / pen: no strings
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      for (const it of items) {
        if (it.attached || !available(it.el)) continue;
        const r = it.el.getBoundingClientRect();
        if (mouse.x >= r.left && mouse.x <= r.right && mouse.y >= r.top && mouse.y <= r.bottom) attach(it);
      }
      const near = items.some((i) => {
        if (!available(i.el)) return false;
        const r = i.el.getBoundingClientRect();
        return Math.hypot(Math.max(r.left - mouse.x, 0, mouse.x - r.right), Math.max(r.top - mouse.y, 0, mouse.y - r.bottom)) < REACH;
      });
      if (near || items.some((i) => i.attached || i.reach > 0.01)) kick();
    };
    const onLeaveWindow = () => {
      mouse.x = -1e4;
      mouse.y = -1e4;
      items.forEach((it) => it.attached && snap(it));
      kick();
    };
    const onScroll = () => items.forEach((it) => it.attached && kick());
    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeaveWindow);
    window.addEventListener("resize", size);
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeaveWindow);
      window.removeEventListener("resize", size);
      window.removeEventListener("scroll", onScroll);
      items.forEach((it) => {
        it.el.style.transform = "";
        it.el.classList.remove("is-reaching", "is-stuck", "is-snap");
      });
    };
  }, []);

  return <canvas ref={ref} className="stringy-canvas" aria-hidden="true" />;
}

/** damped spring for the button lean */
function spring(it: Item, g: { tx: number; ty: number; rx: number; ry: number }) {
  const k = 0.12;
  const d = 0.78;
  it.vtx = (it.vtx + (g.tx - it.tx) * k) * d;
  it.vty = (it.vty + (g.ty - it.ty) * k) * d;
  it.vrx = (it.vrx + (g.rx - it.rx) * k) * d;
  it.vry = (it.vry + (g.ry - it.ry) * k) * d;
  it.tx += it.vtx;
  it.ty += it.vty;
  it.rx += it.vrx;
  it.ry += it.vry;
}
