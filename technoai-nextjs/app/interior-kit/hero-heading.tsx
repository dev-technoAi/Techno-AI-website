"use client";

import { useEffect, useRef } from "react";

const lines = ["Advanced Technology", "Solutions for Mission", "Critical Operations"];
const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

export function HeroHeading() {
  const ref = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    const heading = ref.current;
    if (!heading) return;
    const letters = Array.from(heading.querySelectorAll<HTMLElement>(".hero-letter-glyph"));
    const active = new Map<HTMLElement, number>();
    const reduce = matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    let last = 0;
    let touchTimer = 0;
    const restore = (letter: HTMLElement) => {
      letter.textContent = letter.dataset.letter ?? "";
      letter.parentElement?.classList.remove("is-near");
    };
    const shuffle = (time: number) => {
      frame = 0;
      let pending = false;
      if (time - last >= 55) {
        last = time;
        active.forEach((start, letter) => {
          const animating = (document.documentElement.dataset.motion === "full" || !reduce.matches) && time - start < 220;
          letter.textContent = animating ? alphabet[Math.floor(Math.random() * alphabet.length)] : letter.dataset.letter ?? "";
          pending ||= animating;
        });
      } else pending = [...active.values()].some(start => time - start < 220);
      if (pending) frame = requestAnimationFrame(shuffle);
    };
    const move = (event: PointerEvent) => {
      if (event.type === "pointermove" && event.pointerType === "touch") return;
      // Read all positions before writing styles to avoid repeated layout recalculation.
      const nearby = letters.filter(letter => {
        const r = letter.getBoundingClientRect();
        const dx = Math.max(r.left - event.clientX, 0, event.clientX - r.right);
        const dy = Math.max(r.top - event.clientY, 0, event.clientY - r.bottom);
        return Math.hypot(dx, dy) < 22;
      });
      const near = new Set(nearby);
      active.forEach((_start, letter) => {
        if (!near.has(letter)) { restore(letter); active.delete(letter); }
      });
      nearby.forEach(letter => {
        if (!active.has(letter)) {
          active.set(letter, performance.now());
          letter.parentElement?.classList.add("is-near");
        }
      });
      if (!frame && active.size) frame = requestAnimationFrame(shuffle);
    };
    const leave = () => {
      cancelAnimationFrame(frame); frame = 0;
      active.forEach((_start, letter) => restore(letter));
      active.clear();
    };
    const tap = (event: PointerEvent) => {
      if (event.pointerType !== "touch") return;
      move(event);
      window.clearTimeout(touchTimer);
      touchTimer = window.setTimeout(leave, 400);
    };
    heading.addEventListener("pointerdown", tap, { passive: true });
    heading.addEventListener("pointermove", move, { passive: true });
    heading.addEventListener("pointerleave", leave);
    window.addEventListener("blur", leave);
    return () => {
      leave();
      window.clearTimeout(touchTimer);
      heading.removeEventListener("pointerdown", tap);
      heading.removeEventListener("pointermove", move);
      heading.removeEventListener("pointerleave", leave);
      window.removeEventListener("blur", leave);
    };
  }, []);
  return <h1 ref={ref} className="hero-title" aria-label={lines.join(" ")}>
    {lines.map((line, i) => <span className={`hl ${i === 0 ? "hero-title-main" : "hero-title-sub"}`} key={line} aria-hidden="true">
      <span style={{ "--d": i } as React.CSSProperties}>
        {line.split(" ").map(word => <span className="hero-title-word" key={word}>
          {[...word].map((letter, j) => <span className="hero-letter" data-letter={letter} key={j}>
            <span className="hero-letter-width" aria-hidden="true">{letter}</span>
            <span className="hero-letter-glyph" data-letter={letter}>{letter}</span>
          </span>)}{" "}
        </span>)}
      </span>
    </span>)}
  </h1>;
}
