"use client";

import { useEffect, useRef } from "react";

/**
 * Interactive dot grid for a section background (own implementation of the "dot grid" idea the owner liked).
 * Dots sit still at low opacity; near the mouse they grow, darken and circle around their spot, then settle
 * back when the mouse leaves. Cheap on purpose: one 2D canvas, redrawn only while the section is on screen
 * AND the mouse is in it (or the dots are still settling). Otherwise it is a still image. Touch screens /
 * reduced motion get the still grid only.
 */
export default function DotField({ color = "20,107,140", spacing = 26, size = 2.4, radius = 120 }: { color?: string; spacing?: number; size?: number; radius?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const host = canvas?.parentElement;
    if (!canvas || !host) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches; // touch screens never send mouse pointer events

    let W = 0;
    let H = 0;
    let dots: { x: number; y: number; ph: number; inc: number; asc: number; sp: number }[] = [];
    const mouse = { x: -9999, y: -9999, on: false, off: 0 };
    let visible = false;
    let raf = 0;
    let last = 0;
    let angle = 0;
    let energy = 0; // 0 = everything at rest → stop drawing

    const build = () => {
      const r = canvas.getBoundingClientRect();
      W = r.width;
      H = r.height;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      dots = [];
      for (let y = spacing / 2; y < H; y += spacing)
        for (let x = spacing / 2; x < W; x += spacing)
          dots.push({ x, y, ph: Math.random() * Math.PI * 2, inc: Math.random() * Math.PI, asc: Math.random() * Math.PI * 2, sp: 0.7 + Math.random() * 0.6 });
      draw(0);
    };

    const ease = (t: number) => {
      const c = Math.min(Math.max(t, 0), 1);
      return c * c * (3 - 2 * c);
    };

    const draw = (fade: number) => {
      ctx.clearRect(0, 0, W, H);
      // resting dots in one batch
      ctx.fillStyle = `rgba(${color},0.22)`;
      ctx.beginPath();
      const near: typeof dots = [];
      for (const d of dots) {
        if (fade > 0 && Math.abs(d.x - mouse.x) < radius && Math.abs(d.y - mouse.y) < radius) {
          near.push(d);
          continue;
        }
        ctx.moveTo(d.x + size / 2, d.y);
        ctx.arc(d.x, d.y, size / 2, 0, Math.PI * 2);
      }
      ctx.fill();
      // dots around the mouse: grow, darken and orbit their spot
      for (const d of near) {
        const dist = Math.hypot(d.x - mouse.x, d.y - mouse.y);
        const k = ease(1 - dist / radius) * fade;
        const th = angle * d.sp + d.ph;
        const orbit = k * spacing * 0.6;
        const lx = Math.cos(th);
        const ly = Math.sin(th) * Math.cos(d.inc);
        const depth = 0.75 + 0.25 * ((Math.sin(th) * Math.sin(d.inc) + 1) / 2);
        const x = d.x + (lx * Math.cos(d.asc) - ly * Math.sin(d.asc)) * orbit;
        const y = d.y + (lx * Math.sin(d.asc) + ly * Math.cos(d.asc)) * orbit;
        ctx.fillStyle = `rgba(${color},${((0.22 + 0.7 * k) * depth).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(x, y, (size / 2) * (1 + 0.9 * k) * depth, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const loop = (ts: number) => {
      const dt = Math.min((ts - (last || ts)) / 1000, 0.05);
      last = ts;
      angle += dt * 1.5;
      energy = mouse.on ? 1 : Math.max(0, energy - dt * 1.6); // settle back after the mouse leaves
      draw(ease(energy));
      if (visible && (mouse.on || energy > 0)) raf = requestAnimationFrame(loop);
      else raf = 0;
    };
    const kick = () => {
      if (!raf && visible && !still) {
        last = 0;
        raf = requestAnimationFrame(loop);
      }
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const r = canvas.getBoundingClientRect();
      mouse.x = e.clientX - r.left;
      mouse.y = e.clientY - r.top;
      mouse.on = true;
      kick();
    };
    const onLeave = () => {
      mouse.on = false;
      kick();
    };

    const ro = new ResizeObserver(build);
    ro.observe(canvas);
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (!visible) mouse.on = false;
    });
    io.observe(canvas);
    if (!still) {
      host.addEventListener("pointermove", onMove, { passive: true });
      host.addEventListener("pointerleave", onLeave);
    }
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerleave", onLeave);
    };
  }, [color, spacing, size, radius]);

  return <canvas ref={ref} className="dot-field" aria-hidden="true" />;
}
