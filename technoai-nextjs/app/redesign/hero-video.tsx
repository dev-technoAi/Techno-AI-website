"use client";
import { useEffect, useRef, useState } from "react";
export default function HeroVideo() {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => { if (media.matches) ref.current?.pause(); else ref.current?.play().catch(() => {}); };
    sync(); media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);
  return <div className="hero-film">
    <video ref={ref} muted loop playsInline preload="metadata" poster="/redesign/landing/hero-poster.jpg" onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} aria-label="TechnoAi enterprise technology showcase"><source src="/redesign/landing/hero.mp4" type="video/mp4" /></video>
    <div className="film-shade" /><div className="film-caption"><span className="film-label"><i /> TECHNOLOGY IN ACTION</span><p>Real technology.<br />Real-world possibilities.</p></div>
    <button className="video-toggle" onClick={() => { if (playing) ref.current?.pause(); else ref.current?.play().catch(() => {}); }} aria-label={playing ? "Pause hero video" : "Play hero video"}>{playing ? "Ⅱ" : "▶"}<span>{playing ? "Pause" : "Play"}</span></button>
  </div>;
}
