"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Hero visual that plays with the scroll: a sequence of video frames is drawn on a canvas and the
 * frame shown follows how far the visitor has scrolled through the `.hero-scroll` section.
 * It also writes the progress (0..1) to the CSS variable `--p` on that section, which the text uses.
 *
 * Frames live in public{dir}/f001.jpg … (made from the hero video with ffmpeg, see CLAUDE.md).
 * On phones the video simply loops instead; with "reduce motion" only the still image is shown.
 */
export function HeroScrub({
  count,
  dir,
  poster,
  video,
}: {
  count: number;
  dir: string;
  poster: string;
  video: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<"still" | "loop" | "scrub">("still");

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setMode(window.matchMedia("(max-width: 640px)").matches ? "loop" : "scrub");
  }, []);

  useEffect(() => {
    if (mode !== "scrub") return;
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    const section = canvas?.closest<HTMLElement>(".hero-scroll");
    if (!canvas || !ctx || !section) return;

    const frames: (HTMLImageElement | null)[] = new Array(count).fill(null);
    for (let i = 0; i < count; i++) {
      const img = new Image();
      img.decoding = "async";
      img.onload = () => {
        frames[i] = img;
        if (i === 0) {
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          drawn = -1;
        }
      };
      img.src = `${dir}/f${String(i + 1).padStart(3, "0")}.jpg`;
    }

    const IDLE = Math.min(10, count - 1); // frames used for the gentle "hover" loop before scrolling
    let cur = 0;
    let drawn = -1;
    let raf = 0;
    let on = false;
    const t0 = performance.now();

    const tick = (now: number) => {
      const r = section.getBoundingClientRect();
      const total = Math.max(r.height - window.innerHeight, 1);
      const p = Math.min(Math.max(-r.top / total, 0), 1);
      section.style.setProperty("--p", p.toFixed(3));
      section.classList.toggle("late", p > 0.5);

      const idle = p < 0.01 ? (Math.sin((now - t0) / 1100) * 0.5 + 0.5) * IDLE : 0;
      const target = Math.min(idle + p * (count - 1), count - 1);
      cur += (target - cur) * 0.14;
      let i = Math.round(cur);
      while (i > 0 && !frames[i]) i--; // nearest frame that has loaded
      const img = frames[i];
      if (img && i !== drawn) {
        // A later frame can load before f001; never draw it into the default 300x150 canvas.
        if (canvas.width !== img.naturalWidth || canvas.height !== img.naturalHeight) {
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        drawn = i;
        canvas.classList.add("ready");
      }
      if (on) raf = requestAnimationFrame(tick);
    };

    const io = new IntersectionObserver(([e]) => {
      cancelAnimationFrame(raf);
      on = e.isIntersecting;
      if (on) raf = requestAnimationFrame(tick);
    });
    io.observe(section);

    return () => {
      on = false;
      cancelAnimationFrame(raf);
      io.disconnect();
      section.style.removeProperty("--p");
      section.classList.remove("late");
    };
  }, [mode, count, dir]);

  return (
    <>
      {mode === "loop" ? (
        <video className="hero-video" src={video} poster={poster} autoPlay muted loop playsInline />
      ) : (
        <img className="hero-video" src={poster} alt="" />
      )}
      {mode === "scrub" && <canvas ref={ref} className="hero-video hero-frames" aria-hidden="true" />}
    </>
  );
}
