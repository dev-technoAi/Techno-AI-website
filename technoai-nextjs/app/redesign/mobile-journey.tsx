"use client";

import { useEffect, useRef, useState } from "react";
import { SOLUTIONS } from "./data";
import JourneyPeek from "./journey-peeks";

function Film({ slug }: { slug: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [started, setStarted] = useState(false);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    const phone = matchMedia("(max-width: 760px)");
    const still = matchMedia("(prefers-reduced-motion: reduce)");
    const observer = new IntersectionObserver(([entry]) => {
      const on = entry.isIntersecting && phone.matches && !still.matches;
      setVisible(on);
      if (on) setStarted(true);
    }, { threshold: .15 });
    const sync = () => {
      observer.disconnect();
      setVisible(false);
      if (phone.matches && !still.matches) observer.observe(video);
    };
    sync();
    phone.addEventListener("change", sync);
    still.addEventListener("change", sync);
    return () => { observer.disconnect(); phone.removeEventListener("change", sync); still.removeEventListener("change", sync); };
  }, []);
  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    const sync = () => {
      if (started && visible && !document.hidden) video.play().catch(() => {});
      else video.pause();
    };
    sync();
    document.addEventListener("visibilitychange", sync);
    document.addEventListener("pointerdown", sync, { passive: true });
    return () => { video.pause(); document.removeEventListener("visibilitychange", sync); document.removeEventListener("pointerdown", sync); };
  }, [started, visible]);
  return <video ref={ref} autoPlay={visible} muted playsInline loop preload="none" disablePictureInPicture
    onCanPlay={() => {
      if (visible && !document.hidden) ref.current?.play().catch(() => {});
    }}
    poster={`/redesign/journey/films/${slug}.webp`}
    src={started ? `/redesign/journey/films/${slug}-1080.mp4` : undefined} />;
}

/** Full-height mobile scenes use the same background-and-copy composition as the robot. */
export default function MobileJourney() {
  return <section className="mobile-journey" aria-label="More technology solutions">
    {SOLUTIONS.slice(2).map((s, i) => <article className="mj-panel" data-solution={s.slug} key={s.slug}>
      <div className="mj-head"><span className="mj-brand"><i className="mj-chip" aria-hidden="true">//:</i>TechnoAi Solutions</span><span>0{i + 3} / 06</span></div>
      <div className="mj-media"><Film slug={s.slug} /></div>
      <div className="mj-copy">
        <span className="n mj-number">0{i + 3}</span>
        <div className="jx-title-wrap" data-peek={s.slug}>
          <span className="jx-peek-product" aria-hidden="true"><JourneyPeek slug={s.slug} /></span>
          <h2>{s.title}</h2>
        </div>
        <p>{s.text}</p>
        <a className="btn btn-white" href={s.href} aria-label={`Explore ${s.title}`}>Explore Solution <span aria-hidden="true">→</span></a>
      </div>
    </article>)}
  </section>;
}
