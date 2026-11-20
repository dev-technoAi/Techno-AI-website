"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { StudioEnvironment, Warmup } from "./core-scene";

// Small R3F models for the three capability cards (section 02).
// Brand colours only: #0f1a1b, #146b8c, #289fb7, #9fe7e7, white/greys.

export type Kind = "ai" | "robotics" | "edge";

const BLUE = new THREE.Color("#146b8c");
const TEAL = new THREE.Color("#146b8c"); // 3-colour theme: teal retired, uses brand blue
const AQUA = new THREE.Color("#9fe7e7");
const AQUA_LINE = new THREE.Color("#9fe7e7"); // flat aqua (3-colour theme)

/** Shared mouse (window based) so all three cards react together. */
const mouse = { x: 0, y: 0 };
let mouseUsers = 0;
const onMove = (e: PointerEvent) => {
  mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.y = (e.clientY / window.innerHeight) * 2 - 1;
};

export type Live = { hover: number; still: boolean };

/** Rotates/tilts the children with the mouse; more movement while the card is hovered. */
function Parallax({ live, children, base = [0.25, -0.5] }: { live: Live; children: React.ReactNode; base?: [number, number] }) {
  const ref = useRef<THREE.Group>(null);
  const s = useRef({ x: 0, y: 0, h: 0 });
  useFrame((_, dt) => {
    const g = ref.current!;
    const k = Math.min(dt * 4, 1);
    s.current.h += (live.hover - s.current.h) * k;
    s.current.x += (mouse.x - s.current.x) * k * 0.6;
    s.current.y += (mouse.y - s.current.y) * k * 0.6;
    const amp = 0.18 + s.current.h * 0.22;
    g.rotation.x = base[0] + s.current.y * amp;
    g.rotation.y = base[1] + s.current.x * amp * 1.4;
    g.position.y = s.current.h * 0.12;
    g.scale.setScalar(1 + s.current.h * 0.06);
  });
  return <group ref={ref}>{children}</group>;
}

/* ---------------------------------- 01 AI processor ---------------------------------- */

const DIE_FRAG = /* glsl */ `
  uniform float uTime; varying vec2 vUv;
  float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
  void main() {
    vec2 g = vUv * 14.; vec2 id = floor(g); vec2 f = fract(g); float r = h(id);
    float l = max(smoothstep(.07, 0., abs(f.y - .5)) * step(.5, r), smoothstep(.07, 0., abs(f.x - .5)) * step(r, .3));
    float pulse = .55 + .45 * sin(uTime * 2.4 - length(vUv - .5) * 12.);
    float edge = smoothstep(.5, .42, max(abs(vUv.x - .5), abs(vUv.y - .5)));
    vec3 base = mix(vec3(.04, .16, .22), vec3(.08, .42, .55), edge * .6);
    vec3 col = base + vec3(.62, .9, .9) * l * pulse * edge;
    gl_FragColor = vec4(col, 1.);
  }`;
const DIE_VERT = /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`;

function AIProcessor({ live }: { live: Live }) {
  const uni = useMemo(() => ({ uTime: { value: 0 } }), []);
  const nodes = useRef<THREE.Group>(null);
  const spin = useRef<THREE.Group>(null);
  const pins = useMemo(() => {
    const out: [number, number, number][] = [];
    for (let s = 0; s < 4; s++)
      for (let i = -3; i <= 3; i++) {
        const a = i * 0.13;
        out.push(s === 0 ? [a, 0.62, 0] : s === 1 ? [a, -0.62, 0] : s === 2 ? [0.62, a, 0] : [-0.62, a, 0]);
      }
    return out;
  }, []);
  // small neural network around the chip
  const net = useMemo(() => {
    const pts = Array.from({ length: 14 }, (_, i) => {
      const t = (i / 14) * Math.PI * 2;
      return new THREE.Vector3(Math.cos(t) * (0.95 + (i % 3) * 0.12), Math.sin(t * 2) * 0.35, Math.sin(t) * (0.95 + (i % 2) * 0.1));
    });
    const seg: number[] = [];
    pts.forEach((p, i) => [1, 3].forEach((d) => seg.push(p.x, p.y, p.z, ...pts[(i + d) % pts.length].toArray())));
    return { pts, seg: new Float32Array(seg) };
  }, []);
  useFrame(({ clock }) => {
    const t = live.still ? 1.5 : clock.elapsedTime;
    uni.uTime.value = t;
    spin.current!.rotation.y = t * (0.25 + live.hover * 0.35);
    nodes.current!.rotation.y = -t * 0.2;
  });
  return (
    <group ref={spin}>
      {/* glass cube */}
      <mesh>
        <boxGeometry args={[1.5, 1.5, 1.5]} />
        <meshPhysicalMaterial color="#e8f6f8" metalness={0} roughness={0.05} transparent opacity={0.22} clearcoat={1} envMapIntensity={1.6} depthWrite={false} />
      </mesh>
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(1.5, 1.5, 1.5)]} />
        <lineBasicMaterial color={AQUA_LINE} transparent opacity={0.8} />
      </lineSegments>
      {/* chip */}
      <group rotation-x={-Math.PI / 2}>
        <mesh>
          <boxGeometry args={[1.05, 1.05, 0.12]} />
          <meshStandardMaterial color="#1c2a2d" metalness={0.7} roughness={0.3} />
        </mesh>
        <mesh position-z={0.065}>
          <planeGeometry args={[0.78, 0.78]} />
          <shaderMaterial vertexShader={DIE_VERT} fragmentShader={DIE_FRAG} uniforms={uni} />
        </mesh>
        {pins.map((p, i) => (
          <mesh key={i} position={p}>
            <boxGeometry args={[0.06, 0.06, 0.05]} />
            <meshStandardMaterial color="#c9d3d7" metalness={1} roughness={0.25} />
          </mesh>
        ))}
      </group>
      <pointLight color={TEAL} intensity={6} distance={3} position={[0, 0.4, 0]} />
      {/* neural network */}
      <group ref={nodes}>
        <lineSegments>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[net.seg, 3]} />
          </bufferGeometry>
          <lineBasicMaterial color={BLUE} transparent opacity={0.45} />
        </lineSegments>
        {net.pts.map((p, i) => (
          <mesh key={i} position={p}>
            <sphereGeometry args={[0.035, 12, 8]} />
            <meshStandardMaterial color={i % 3 === 0 ? BLUE : i % 3 === 1 ? AQUA : TEAL} emissive={i % 3 === 1 ? AQUA : TEAL} emissiveIntensity={0.6} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

/* ---------------------------------- 02 Robot arm ---------------------------------- */

export function RobotArm({ live }: { live: Live }) {
  const base = useRef<THREE.Group>(null);
  const shoulder = useRef<THREE.Group>(null);
  const elbow = useRef<THREE.Group>(null);
  const wrist = useRef<THREE.Group>(null);
  const fingers = useRef<(THREE.Mesh | null)[]>([]);
  useFrame(({ clock }) => {
    const t = live.still ? 1.2 : clock.elapsedTime * (1 + live.hover * 0.6);
    base.current!.rotation.y = Math.sin(t * 0.5) * 0.7;
    shoulder.current!.rotation.z = -0.35 + Math.sin(t * 0.8) * 0.18;
    elbow.current!.rotation.z = 1.2 + Math.sin(t * 0.8 + 1) * 0.25;
    wrist.current!.rotation.z = 0.6 + Math.sin(t * 1.1) * 0.2;
    const g = 0.06 + (Math.sin(t * 1.6) * 0.5 + 0.5) * 0.06;
    fingers.current.forEach((f, i) => f && (f.position.x = (i ? 1 : -1) * g));
  });
  const white = <meshPhysicalMaterial color="#f4f7f8" metalness={0.1} roughness={0.32} clearcoat={0.8} envMapIntensity={1.2} />;
  const joint = <meshStandardMaterial color="#1c2a2d" metalness={0.6} roughness={0.35} />;
  const ring = <meshStandardMaterial color={AQUA} emissive={AQUA} emissiveIntensity={0.9} />;
  return (
    <group position-y={-0.72} scale={0.92}>
      {/* platform */}
      <mesh position-y={-0.06}>
        <cylinderGeometry args={[0.95, 1.02, 0.1, 64]} />
        <meshStandardMaterial color="#dfe6ea" metalness={0.85} roughness={0.25} envMapIntensity={1.2} />
      </mesh>
      <mesh position-y={0.0} rotation-x={Math.PI / 2}>
        <torusGeometry args={[0.8, 0.012, 8, 96]} />
        {ring}
      </mesh>
      <group ref={base}>
        <mesh position-y={0.14}>
          <cylinderGeometry args={[0.32, 0.38, 0.28, 48]} />
          {white}
        </mesh>
        <mesh position-y={0.29} rotation-x={Math.PI / 2}>
          <torusGeometry args={[0.31, 0.018, 8, 48]} />
          {ring}
        </mesh>
        <group ref={shoulder} position-y={0.4}>
          <mesh rotation-x={Math.PI / 2}>
            <cylinderGeometry args={[0.2, 0.2, 0.36, 40]} />
            {joint}
          </mesh>
          <mesh position-y={0.42}>
            <capsuleGeometry args={[0.14, 0.62, 10, 28]} />
            {white}
          </mesh>
          <group ref={elbow} position-y={0.84}>
            <mesh rotation-x={Math.PI / 2}>
              <cylinderGeometry args={[0.16, 0.16, 0.3, 40]} />
              {joint}
            </mesh>
            <mesh rotation-x={Math.PI / 2}>
              <torusGeometry args={[0.165, 0.014, 8, 40]} />
              {ring}
            </mesh>
            <mesh position-y={0.36}>
              <capsuleGeometry args={[0.11, 0.5, 10, 28]} />
              {white}
            </mesh>
            <group ref={wrist} position-y={0.7}>
              <mesh rotation-x={Math.PI / 2}>
                <cylinderGeometry args={[0.11, 0.11, 0.22, 32]} />
                {joint}
              </mesh>
              <mesh position-y={0.14}>
                <cylinderGeometry args={[0.1, 0.12, 0.12, 32]} />
                {white}
              </mesh>
              {[0, 1].map((i) => (
                <mesh key={i} ref={(el) => void (fingers.current[i] = el)} position={[(i ? 1 : -1) * 0.08, 0.3, 0]}>
                  <boxGeometry args={[0.045, 0.22, 0.09]} />
                  {joint}
                </mesh>
              ))}
            </group>
          </group>
        </group>
      </group>
    </group>
  );
}

/* ---------------------------------- 03 Edge server ---------------------------------- */

export function EdgeServer({ live }: { live: Live }) {
  const leds = useRef<(THREE.MeshStandardMaterial | null)[]>([]);
  const stack = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    const t = live.still ? 1 : clock.elapsedTime;
    leds.current.forEach((m, i) => m && (m.emissiveIntensity = 0.8 + Math.max(0, Math.sin(t * (2 + i * 0.7) + i)) * (1.4 + live.hover)));
    stack.current!.position.y = Math.sin(t * 1.2) * 0.04;
  });
  const units = [0, 1, 2];
  return (
    <group position-y={-0.2}>
      <mesh position-y={-0.5}>
        <boxGeometry args={[1.7, 0.08, 1.2]} />
        <meshStandardMaterial color="#dfe6ea" metalness={0.85} roughness={0.25} envMapIntensity={1.2} />
      </mesh>
      <mesh position-y={-0.455} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[1.5, 1.0]} />
        <meshBasicMaterial color={AQUA} transparent opacity={0.35} />
      </mesh>
      <group ref={stack}>
        {units.map((u) => (
          <group key={u} position-y={-0.22 + u * 0.4}>
            <mesh>
              <boxGeometry args={[1.3, 0.34, 0.92]} />
              <meshPhysicalMaterial color="#eef2f4" metalness={0.55} roughness={0.28} clearcoat={0.6} envMapIntensity={1.3} />
            </mesh>
            {/* front panel */}
            <mesh position={[0, 0, 0.462]}>
              <planeGeometry args={[1.22, 0.27]} />
              <meshStandardMaterial color="#2a3a3e" metalness={0.5} roughness={0.4} />
            </mesh>
            {[-0.42, -0.3, -0.18].map((x) => (
              <mesh key={x} position={[x, 0, 0.465]}>
                <planeGeometry args={[0.07, 0.18]} />
                <meshStandardMaterial color="#506267" metalness={0.6} roughness={0.4} />
              </mesh>
            ))}
            <mesh position={[0.22, 0.04, 0.466]}>
              <planeGeometry args={[0.6, 0.035]} />
              <meshStandardMaterial ref={(m) => void (leds.current[u * 2] = m)} color={TEAL} emissive={TEAL} emissiveIntensity={1} toneMapped={false} />
            </mesh>
            <mesh position={[0.48, -0.06, 0.466]}>
              <circleGeometry args={[0.025, 16]} />
              <meshStandardMaterial ref={(m) => void (leds.current[u * 2 + 1] = m)} color="#9fe7e7" emissive="#9fe7e7" emissiveIntensity={1} toneMapped={false} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}

/* ---------------------------------- canvas per card ---------------------------------- */

const MODELS: Record<Kind, { el: (l: Live) => React.ReactNode; cam: [number, number, number]; base: [number, number] }> = {
  ai: { el: (l) => <AIProcessor live={l} />, cam: [0, 0.6, 5.3], base: [0.32, -0.6] },
  robotics: { el: (l) => <RobotArm live={l} />, cam: [0, 0.45, 5.6], base: [0.12, -0.5] },
  edge: { el: (l) => <EdgeServer live={l} />, cam: [0, 0.5, 5.9], base: [0.22, -0.55] },
};

export default function CapabilityModel({ kind, hovered }: { kind: Kind; hovered: boolean }) {
  const wrap = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [compiled, setCompiled] = useState(false); // shaders compiled in the background → start drawing
  const onCompiled = useCallback(() => setCompiled(true), []);
  const [still] = useState(() => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const live = useRef<Live>({ hover: 0, still }).current;
  live.hover = hovered ? 1 : 0;

  useEffect(() => {
    const el = wrap.current!;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting));
    io.observe(el);
    if (!still) {
      if (mouseUsers++ === 0) window.addEventListener("pointermove", onMove, { passive: true });
    }
    return () => {
      io.disconnect();
      if (!still && --mouseUsers === 0) window.removeEventListener("pointermove", onMove);
    };
  }, [still]);

  const m = MODELS[kind];
  return (
    <div ref={wrap} className="cx-canvas" data-ready={compiled || undefined}>
      <Canvas
        dpr={[1, 1.25]}
        gl={{ antialias: true, alpha: true, powerPreference: "low-power" }}
        camera={{ fov: 30, position: m.cam }}
        frameloop={!compiled ? "never" : still ? "demand" : visible ? "always" : "never"}
        onCreated={({ gl, camera }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.debug.checkShaderErrors = false; // no synchronous shader stall
          camera.lookAt(0, 0, 0);
        }}
        aria-hidden="true"
      >
        <StudioEnvironment />
        <hemisphereLight args={["#ffffff", "#d6e2e6", 1.3]} />
        <directionalLight position={[-2, 4, 4]} intensity={2} />
        <pointLight color={TEAL} intensity={8} distance={6} position={[2, 1, 2]} />
        <Parallax live={live} base={m.base}>
          {m.el(live)}
        </Parallax>
        <Warmup onReady={onCompiled} />
      </Canvas>
    </div>
  );
}
