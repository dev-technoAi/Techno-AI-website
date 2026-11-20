"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

// Keep the three.js journey, globe, and frame player out of the first-page bundle.
const Journey = dynamic(() => import("./scenes").then((m) => m.JourneyScene), { ssr: false });
const Globe = dynamic(() => import("./presence-globe"), { ssr: false });
const Film = dynamic(() => import("./scenes").then((m) => m.DroneFilm), { ssr: false });

function useNear(margin = "500px 0px") {
  const ref = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);
  useEffect(() => {
    const target = ref.current;
    if (!target) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setNear(true);
        observer.disconnect();
      }
    }, { rootMargin: margin });
    observer.observe(target);
    return () => observer.disconnect();
  }, [margin]);
  return { ref, near };
}

export function JourneyScene() {
  // phones too (they show the robot/drone); start ~2 screens early so the models are ready on arrival
  const { ref, near } = useNear("200% 0px");
  return <div ref={ref} style={{ position: "absolute", inset: 0 }} aria-hidden="true">{near && <Journey />}</div>;
}

export function GlobeScene({ active = 0, onSelect }: { active?: number; onSelect?: (index: number) => void }) {
  const { ref, near } = useNear();
  return <div ref={ref} style={{ width: "100%", height: "100%" }} role={near ? undefined : "img"} aria-label={near ? undefined : "Globe showing TechnoAi hubs in Abu Dhabi, Prague and Lahore"}>{near && <Globe active={active} onSelect={onSelect} />}</div>;
}

export function DroneFilm({ count, dir, poster, video }: { count: number; dir: string; poster: string; video: string }) {
  const { ref, near } = useNear();
  return <div ref={ref} style={{ position: "absolute", inset: 0 }}>
    {near ? <Film count={count} dir={dir} poster={poster} video={video} /> : <img className="film" src={poster} alt="" loading="lazy" />}
  </div>;
}
