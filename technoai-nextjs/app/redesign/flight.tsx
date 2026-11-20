"use client";

import { useOpeningReady } from "./opening-ready";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

// Keep the complete drone experience in its own chunk, without blocking page hydration.
const FlightScene = dynamic(() => import("./flight-scene"), { ssr: false });

// Mounts the scroll-flight drone (flight-scene.tsx).
// Skipped for users who prefer reduced motion.
export default function Flight() {
  const [mounted, setMounted] = useState(false);
  const openingReady = useOpeningReady();
  useEffect(() => {
    if (!openingReady) return;
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }
    setMounted(true);
  }, [openingReady]);
  return mounted ? <FlightScene /> : null;
}
