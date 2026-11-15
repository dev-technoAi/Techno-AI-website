"use client";

import { useEffect, useRef } from "react";

/** Muted looping film, resumed after buffering, tab restoration or an autoplay-blocking gesture. */
export function HeroFilm({ video, poster }: { video: string; poster: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const film = ref.current;
    if (!film) return;
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    const scene = film.closest<HTMLElement>(".hero-pin") ?? film;
    let visible = scene.getBoundingClientRect().bottom > 0 && scene.getBoundingClientRect().top < innerHeight;
    let pending = false;
    let disposed = false;
    // Set properties too: Safari must see muted before the first play() call.
    film.muted = true;
    film.defaultMuted = true;
    film.playsInline = true;
    const sync = () => {
      if (disposed) return;
      const fullMotion = document.documentElement.dataset.motion === "full";
      if (!visible || document.hidden || (!fullMotion && (preference.matches || connection?.saveData))) {
        film.pause();
        return;
      }
      if (film.paused && !pending) {
        pending = true;
        film.play().catch(() => {
          // Browsers can reject autoplay until the first tap; the listeners below retry it.
        }).finally(() => { pending = false; });
      }
    };
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); });
    observer.observe(scene);
    document.addEventListener("visibilitychange", sync);
    document.addEventListener("pointerdown", sync, { passive: true });
    document.addEventListener("keydown", sync);
    window.addEventListener("pageshow", sync);
    window.addEventListener("focus", sync);
    film.addEventListener("canplay", sync);
    film.addEventListener("loadeddata", sync);
    preference.addEventListener("change", sync);
    sync();
    return () => {
      disposed = true;
      observer.disconnect();
      document.removeEventListener("visibilitychange", sync);
      document.removeEventListener("pointerdown", sync);
      document.removeEventListener("keydown", sync);
      window.removeEventListener("pageshow", sync);
      window.removeEventListener("focus", sync);
      film.removeEventListener("canplay", sync);
      film.removeEventListener("loadeddata", sync);
      preference.removeEventListener("change", sync);
      film.pause();
    };
  }, [video]);
  return <video ref={ref} className="hero-video hero-film" src={video} poster={poster}
    autoPlay muted loop playsInline preload="metadata" aria-hidden="true" />;
}
