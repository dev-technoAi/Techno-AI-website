"use client";

import { useEffect, useRef } from "react";
import { registerRobotSlot } from "./spline-stage";

/** Both placements reuse the same live Spline renderer and loaded model. */
export default function SplineCard() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => ref.current ? registerRobotSlot(ref.current) : undefined, []);
  return <div ref={ref} className="cx-spline" data-robot-slot aria-label="Interactive 3D robot" />;
}
