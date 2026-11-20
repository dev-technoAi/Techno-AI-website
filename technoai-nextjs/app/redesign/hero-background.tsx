"use client";

import { useEffect, useRef, useState } from "react";

export default function HeroBackground() {
  const [started, setStarted] = useState(false);
  const [visible, setVisible] = useState(false);
  const video = useRef<HTMLVideoElement>(null);

  // Show the small poster immediately; start the decorative video after the opener.
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const hero = document.querySelector(".hx-hero");
    if (!hero) return;
    const observer = new IntersectionObserver(([entry]) => {
      setVisible(entry.isIntersecting);
      if (entry.isIntersecting) setStarted(true);
    });
    const timer = window.setTimeout(() => observer.observe(hero), 2200);
    return () => { clearTimeout(timer); observer.disconnect(); };
  }, []);

  useEffect(() => {
    const el = video.current;
    if (!el) return;
    const sync = () => {
      if (visible && !document.hidden) {
        el.muted = true;
        el.play().catch(() => { /* A device power-saving policy may require the next touch. */ });
      } else el.pause();
    };
    sync();
    document.addEventListener("visibilitychange", sync);
    document.addEventListener("pointerdown", sync, { passive: true });
    return () => {
      el.pause();
      document.removeEventListener("visibilitychange", sync);
      document.removeEventListener("pointerdown", sync);
    };
  }, [started, visible]);

  return <div className="hx-video-parallax">
    <img className="hx-bg-video" src="/redesign/landing/hero-poster.jpg" alt="" fetchPriority="high" />
    {started && <video ref={video} className="hx-bg-video" autoPlay muted loop playsInline preload="metadata" poster="/redesign/landing/hero-poster.jpg">
      <source src="/redesign/landing/hero-bg.mp4" type="video/mp4" />
    </video>}
  </div>;
}
