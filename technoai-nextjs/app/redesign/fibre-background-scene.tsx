"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import CoreFibres from "./core-fibres";

// Decorative fibres share the GPU with the hero/drone. Leave the foreground and scroll at full speed.
function FibreFrames({ active }: { active: boolean }) {
  const invalidate = useThree(state => state.invalidate);
  useEffect(() => {
    invalidate();
    if (!active) return;
    let last = 0;
    const timer = window.setInterval(() => {
      if (document.hidden) return;
      const busy = document.querySelector('.robot-stage[data-visible="true"]');
      const now = performance.now();
      if (now - last < (busy ? 1000 / 15 : 1000 / 30) - 2) return;
      last = now;
      invalidate();
    }, 1000 / 30);
    return () => clearInterval(timer);
  }, [active, invalidate]);
  return null;
}

function ScrollBundle({ mobile, still }: { mobile: boolean; still: boolean }) {
  const root = useRef<THREE.Group>(null);
  const turn = useRef<THREE.Group>(null);
  const geo = useRef({ top: 0, height: 1 });
  useEffect(() => {
    const hero = document.querySelector(".hx-hero");
    if (!hero) return;
    const measure = () => {
      const rect = hero.getBoundingClientRect();
      geo.current = { top: rect.top + window.scrollY, height: rect.height };
    };
    const observer = new ResizeObserver(measure);
    observer.observe(hero);
    measure();
    return () => observer.disconnect();
  }, []);
  useFrame(({ clock }, dt) => {
    const group = root.current;
    if (!group) return;
    const scroll = (window as Window & { lenis?: { scroll: number } }).lenis?.scroll ?? window.scrollY;
    const travel = Math.max(0, (scroll - geo.current.top) / (geo.current.height * 1.2));
    const p = still ? 0 : travel <= 1 ? travel : .82 + Math.sin((travel - 1) * 1.5) * .15;
    const k = 1 - Math.exp(-8 * Math.min(dt, .05));
    const angle = still ? 0 : travel * .9 + clock.elapsedTime * .10;
    // Approach from the left and deep behind the text, then expand towards the viewer.
    group.position.x = THREE.MathUtils.lerp(group.position.x, (mobile ? -3.3 : -6.0) + p * 1.7, k);
    // Keep the strand tips just below the viewport centre as the bundle rotates.
    group.position.y = THREE.MathUtils.lerp(group.position.y, .7 - p * .55 - (still ? 0 : Math.sin(travel * .8) * .15), k);
    group.position.z = THREE.MathUtils.lerp(group.position.z, -5 + p * 6, k);
    group.scale.setScalar(THREE.MathUtils.lerp(group.scale.x, .85 + p * .95, k));
    group.rotation.z = -.25 + p * .3;
    if (turn.current) {
      // Rotate around the bundle's centre so it coils without swinging off screen.
      turn.current.rotation.y = THREE.MathUtils.lerp(turn.current.rotation.y, angle, k);
      turn.current.rotation.z = Math.sin(angle * .7) * .16;
      turn.current.rotation.x = Math.sin(angle * .45) * .10;
    }
  });
  return <group ref={root} position={[mobile ? -3.3 : -6, .7, -5]} scale={.85}>
    <group ref={turn} position={[1.5, 1.4, -.5]}>
      <group position={[-1.5, -1.4, .5]}>
        <CoreFibres mobile={mobile} still={still} />
      </group>
    </group>
  </group>;
}

export default function FibreScene({ visible }: { visible: boolean }) {
  const [mobile] = useState(() => window.innerWidth < 760);
  const [still] = useState(() => matchMedia("(prefers-reduced-motion: reduce)").matches);
  return <Canvas dpr={1} camera={{ position: [0, 0, 10], fov: 38 }} frameloop="demand" gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}>
    <FibreFrames active={visible && !still} />
    <hemisphereLight args={["#9fe7e7", "#0f1a1b", 1.5]} />
    <directionalLight position={[-4, 5, 6]} color="#9fe7e7" intensity={3} />
    <directionalLight position={[3, 0, 2]} color="#146b8c" intensity={4} />
    <ScrollBundle mobile={mobile} still={still} />
  </Canvas>;
}
