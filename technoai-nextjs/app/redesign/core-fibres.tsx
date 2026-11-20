"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/** A flowing bundle of optical strands: dark reflective shafts and luminous cut ends. */
export default function CoreFibres({ mobile, still }: { mobile: boolean; still: boolean }) {
  const strands = useRef<(THREE.Group | null)[]>([]);
  const pointer = useRef({ x: 0, y: 0, active: false });
  useEffect(() => {
    if (still) return;
    const move = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" || !Number.isFinite(event.clientX) || !Number.isFinite(event.clientY)) return;
      pointer.current = { x: event.clientX, y: event.clientY, active: true };
    };
    const leave = () => { pointer.current.active = false; };
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("blur", leave);
    document.addEventListener("pointerleave", leave);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("blur", leave);
      document.removeEventListener("pointerleave", leave);
    };
  }, [still]);
  const fibres = useMemo(() => {
    const count = mobile ? 12 : 22;
    return Array.from({ length: count }, (_, i) => {
      const a = i * 2.39996;
      const radius = Math.sqrt((i + .5) / count) * .32;
      const x = Math.cos(a) * radius;
      const z = Math.sin(a) * radius;
      const end = new THREE.Vector3(1.48 + x * 1.5, -.32 + Math.sin(a * 1.7) * .22, .25 + z * 1.6);
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(.55 + x, 3.65, -1.3 + z),
        new THREE.Vector3(1.4 + x * .8, 2.5, -1.0 + z),
        new THREE.Vector3(2.3 + x, 1.45, -.6 + z * 1.4),
        new THREE.Vector3(2.1 + x * 1.3, .5, -.05 + z * 1.6),
        end,
      ]);
      return { end, samples: curve.getPoints(12), phase: a, radius: .025 + (i % 4) * .004, geometry: new THREE.TubeGeometry(curve, mobile ? 48 : 72, .025 + (i % 4) * .004, 8, false) };
    });
  }, [mobile]);
  const glow = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 64;
    const ctx = canvas.getContext("2d")!;
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, "rgba(159,231,231,.9)");
    gradient.addColorStop(.15, "rgba(159,231,231,.65)");
    gradient.addColorStop(.45, "rgba(40,159,183,.18)");
    gradient.addColorStop(1, "rgba(20,107,140,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(canvas);
  }, []);
  useEffect(() => () => { fibres.forEach(f => f.geometry.dispose()); glow.dispose(); }, [fibres, glow]);
  const projected = useMemo(() => new THREE.Vector3(), []);
  useFrame(({ clock, camera, size }, delta) => {
    const t = still ? 0 : clock.elapsedTime;
    const ease = 1 - Math.exp(-7 * Math.min(Math.max(delta, 0), .05));
    strands.current.forEach((g, i) => {
      if (!g) return;
      let closest = 120;
      let dx = 0;
      let dy = 0;
      if (pointer.current.active && !still) {
        g.updateWorldMatrix(true, false);
        for (const sample of fibres[i].samples) {
          projected.copy(sample).applyMatrix4(g.matrixWorld).project(camera);
          const x = (projected.x * .5 + .5) * size.width;
          const y = (.5 - projected.y * .5) * size.height;
          const distance = Math.hypot(x - pointer.current.x, y - pointer.current.y);
          if (distance < closest) { closest = distance; dx = x - pointer.current.x; dy = y - pointer.current.y; }
        }
      }
      const influence = Math.pow(1 - closest / 120, 2);
      const pushX = THREE.MathUtils.clamp(dx / 60, -1, 1) * influence;
      const pushY = THREE.MathUtils.clamp(-dy / 60, -1, 1) * influence;
      g.position.x = THREE.MathUtils.lerp(g.position.x, pushX * .35, ease);
      g.position.y = THREE.MathUtils.lerp(g.position.y, pushY * .22, ease);
      // Individually staggered motion makes the bundle breathe instead of moving as rigid wires.
      g.rotation.z = THREE.MathUtils.lerp(g.rotation.z, Math.sin(t * .65 + fibres[i].phase * .12) * .055 - pushX * .14, ease);
      g.rotation.y = THREE.MathUtils.lerp(g.rotation.y, Math.sin(t * .42 + fibres[i].phase * .08) * .08 + pushY * .16, ease);
    });
  });
  return <group>
    {fibres.map((f, i) => <group key={i} ref={el => { strands.current[i] = el; }}>
      <mesh geometry={f.geometry}>
        <meshPhysicalMaterial color={i % 4 ? "#0f1a1b" : "#146b8c"} metalness={.65} roughness={.18} clearcoat={1} clearcoatRoughness={.12} envMapIntensity={1.4} />
      </mesh>
      <mesh position={f.end}>
        <sphereGeometry args={[f.radius * 1.12, 12, 8]} />
        <meshBasicMaterial color="#9fe7e7" toneMapped={false} />
      </mesh>
      <sprite position={f.end} scale={[.26, .26, 1]}>
        <spriteMaterial map={glow} transparent opacity={.75} depthWrite={false} toneMapped={false} />
      </sprite>
    </group>)}
  </group>;
}
