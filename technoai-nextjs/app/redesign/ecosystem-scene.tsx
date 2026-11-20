"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState, type MutableRefObject, type ReactNode } from "react";
import * as THREE from "three";
import { EdgeServer, RobotArm, type Live } from "./capability-models";
import { StudioEnvironment } from "./core-scene";
import { buildDrone, materials } from "./models";

// Section 03 — one connected intelligence ecosystem.
// Scroll progress (0..1 of the pinned section) drives: float → assemble → connect → illuminate.

const BLUE = new THREE.Color("#146b8c");
const TEAL = new THREE.Color("#289fb7");
const AQUA = new THREE.Color("#9fe7e7");
// #9fe7e7 is very light: thin lines use a slightly deeper mix so they still read on white
const AQUA_LINE = new THREE.Color("#9fe7e7").lerp(new THREE.Color("#289fb7"), 0.35);

const clamp01 = (v: number) => Math.min(Math.max(v, 0), 1);
const ease = (v: number) => 1 - Math.pow(1 - clamp01(v), 3);
const range = (p: number, a: number, b: number) => ease((p - a) / (b - a));

type Progress = MutableRefObject<number>;

/** Components: target (assembled) position, where they float before, and the label anchor. */
export const PARTS = [
  { id: "robotics", label: "Robotics", target: [-2.75, -0.15, 0.7], from: [-4.1, 1.5, 1.0], spin: 0.9, scale: 0.72, anchor: [0, 1.15, 0] },
  { id: "edge", label: "Edge computing", target: [2.8, -0.35, 0.5], from: [4.2, 1.6, 0.4], spin: -1.1, scale: 0.8, anchor: [0, 0.65, 0] },
  { id: "sensorA", label: "Industrial sensors", target: [-1.55, -1.05, 2.15], from: [-2.9, -2.1, 2.9], spin: 1.6, scale: 1, anchor: [0, 0.7, 0] },
  { id: "sensorB", label: "", target: [1.6, -1.05, 2.2], from: [3.0, -2.2, 2.8], spin: -1.4, scale: 1, anchor: [0, 0.7, 0] },
  { id: "drone", label: "Autonomous devices", target: [1.75, 1.55, -0.9], from: [3.2, 2.7, -1.6], spin: 1.2, scale: 0.42, anchor: [0, 0.4, 0] },
  { id: "rover", label: "", target: [-1.7, -1.02, -1.75], from: [-3.2, -1.7, -2.8], spin: -0.8, scale: 1, anchor: [0, 0.35, 0] },
] as const;
const CORE_LABEL = { id: "core", label: "AI processor", anchor: [0, 1.15, 0] as const };

/* ---------------------------------- parts ---------------------------------- */

const DIE_VERT = /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`;
const DIE_FRAG = /* glsl */ `
  uniform float uTime; uniform float uOn; varying vec2 vUv;
  float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
  void main() {
    vec2 g = vUv * 18.; vec2 id = floor(g); vec2 f = fract(g); float r = h(id);
    float l = max(smoothstep(.07, 0., abs(f.y - .5)) * step(.52, r), smoothstep(.07, 0., abs(f.x - .5)) * step(r, .28));
    float pulse = .5 + .5 * sin(uTime * 2.2 - length(vUv - .5) * 14.);
    vec3 base = mix(vec3(.05, .14, .18), vec3(.08, .42, .55), uOn * .7);
    gl_FragColor = vec4(base + vec3(.62, .9, .9) * l * (.25 + uOn * pulse), 1.);
  }`;

function Processor({ progress, still }: { progress: Progress; still: boolean }) {
  const uni = useMemo(() => ({ uTime: { value: 0 }, uOn: { value: 0 } }), []);
  const ring = useRef<THREE.MeshBasicMaterial>(null);
  const beam = useRef<THREE.MeshBasicMaterial>(null);
  const light = useRef<THREE.PointLight>(null);
  const top = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    const p = progress.current;
    const on = range(p, 0.55, 0.95);
    const t = still ? 2 : clock.elapsedTime;
    uni.uTime.value = t;
    uni.uOn.value = on;
    ring.current!.opacity = 0.25 + on * 0.75;
    beam.current!.opacity = on * 0.16;
    light.current!.intensity = 4 + on * 26;
    top.current!.rotation.y = t * 0.25;
    top.current!.position.y = 0.55 + Math.sin(t * 1.2) * 0.04;
  });
  return (
    <group>
      {/* brushed-metal hex base */}
      <mesh position-y={-0.9}>
        <cylinderGeometry args={[1.05, 1.18, 0.32, 6]} />
        <meshStandardMaterial color="#d7dfe3" metalness={0.92} roughness={0.32} envMapIntensity={1.2} />
      </mesh>
      <mesh position-y={-0.66}>
        <cylinderGeometry args={[0.86, 0.98, 0.18, 6]} />
        <meshStandardMaterial color="#eef2f4" metalness={0.85} roughness={0.22} envMapIntensity={1.3} />
      </mesh>
      <mesh position-y={-0.555} rotation-x={Math.PI / 2}>
        <torusGeometry args={[0.8, 0.014, 8, 6]} />
        <meshBasicMaterial ref={ring} color={AQUA_LINE} transparent opacity={0.3} toneMapped={false} />
      </mesh>
      {/* glass slab with the chip */}
      <mesh position-y={-0.32}>
        <boxGeometry args={[1.25, 0.42, 1.25]} />
        <meshPhysicalMaterial color="#e8f6f8" roughness={0.05} clearcoat={1} transparent opacity={0.28} envMapIntensity={1.6} depthWrite={false} />
      </mesh>
      <group position-y={-0.3} rotation-x={-Math.PI / 2}>
        <mesh>
          <boxGeometry args={[0.82, 0.82, 0.1]} />
          <meshStandardMaterial color="#1c2a2d" metalness={0.7} roughness={0.3} />
        </mesh>
        <mesh position-z={0.055}>
          <planeGeometry args={[0.6, 0.6]} />
          <shaderMaterial vertexShader={DIE_VERT} fragmentShader={DIE_FRAG} uniforms={uni} />
        </mesh>
      </group>
      {/* floating glass core above */}
      <group ref={top} position-y={0.55}>
        <mesh>
          <octahedronGeometry args={[0.42, 0]} />
          <meshPhysicalMaterial color="#d9f1f4" metalness={0.1} roughness={0.04} clearcoat={1} transparent opacity={0.55} envMapIntensity={1.8} />
        </mesh>
        <mesh>
          <octahedronGeometry args={[0.2, 0]} />
          <meshStandardMaterial color={BLUE} emissive={AQUA} emissiveIntensity={1.1} toneMapped={false} />
        </mesh>
        <lineSegments>
          <edgesGeometry args={[new THREE.OctahedronGeometry(0.42, 0)]} />
          <lineBasicMaterial color={TEAL} transparent opacity={0.7} />
        </lineSegments>
      </group>
      <mesh position-y={0.2}>
        <cylinderGeometry args={[0.12, 0.42, 1.1, 32, 1, true]} />
        <meshBasicMaterial ref={beam} color={AQUA} transparent opacity={0} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      <pointLight ref={light} color={AQUA} intensity={4} distance={9} decay={2} position={[0, 0.6, 0]} />
    </group>
  );
}

function Sensor() {
  const led = useRef<THREE.MeshStandardMaterial>(null);
  useFrame(({ clock }) => led.current && (led.current.emissiveIntensity = 0.6 + Math.max(0, Math.sin(clock.elapsedTime * 3)) * 1.8));
  return (
    <group>
      <mesh position-y={-0.02}>
        <cylinderGeometry args={[0.22, 0.26, 0.06, 32]} />
        <meshStandardMaterial color="#cfd8dc" metalness={0.9} roughness={0.3} />
      </mesh>
      <mesh position-y={0.24}>
        <cylinderGeometry args={[0.035, 0.035, 0.5, 16]} />
        <meshStandardMaterial color="#9aa7ad" metalness={1} roughness={0.25} />
      </mesh>
      <mesh position-y={0.52}>
        <cylinderGeometry args={[0.12, 0.12, 0.14, 32]} />
        <meshPhysicalMaterial color="#f2f5f6" metalness={0.3} roughness={0.25} clearcoat={1} />
      </mesh>
      <mesh position-y={0.6}>
        <sphereGeometry args={[0.1, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshPhysicalMaterial color="#cfeef2" roughness={0.05} transparent opacity={0.6} clearcoat={1} />
      </mesh>
      <mesh position={[0, 0.52, 0.122]}>
        <circleGeometry args={[0.025, 16]} />
        <meshStandardMaterial ref={led} color={TEAL} emissive={TEAL} emissiveIntensity={1} toneMapped={false} />
      </mesh>
    </group>
  );
}

function Rover() {
  const wheels = useRef<THREE.Group>(null);
  useFrame(({ clock }) => wheels.current && wheels.current.children.forEach((w) => (w.rotation.x = clock.elapsedTime * 2)));
  return (
    <group position-y={0.14}>
      <mesh>
        <boxGeometry args={[0.62, 0.16, 0.4]} />
        <meshPhysicalMaterial color="#eef2f4" metalness={0.5} roughness={0.28} clearcoat={0.6} />
      </mesh>
      <mesh position={[0.1, 0.13, 0]}>
        <boxGeometry args={[0.26, 0.1, 0.28]} />
        <meshStandardMaterial color="#1c2a2d" metalness={0.6} roughness={0.35} />
      </mesh>
      <mesh position={[0.31, 0.02, 0]}>
        <boxGeometry args={[0.01, 0.04, 0.26]} />
        <meshStandardMaterial color={TEAL} emissive={TEAL} emissiveIntensity={1.5} toneMapped={false} />
      </mesh>
      <group ref={wheels}>
        {[[-0.2, -0.22], [0.2, -0.22], [-0.2, 0.22], [0.2, 0.22]].map(([x, z], i) => (
          <mesh key={i} position={[x, -0.09, z]} rotation-z={Math.PI / 2}>
            <cylinderGeometry args={[0.08, 0.08, 0.06, 20]} />
            <meshStandardMaterial color="#2a3436" metalness={0.4} roughness={0.6} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function Drone({ still }: { still: boolean }) {
  const d = useMemo(() => buildDrone(materials()), []);
  useEffect(() => () => d.group.traverse((o) => (o as THREE.Mesh).geometry?.dispose?.()), [d]);
  useFrame(({ clock }) => d.update(still ? 1 : clock.elapsedTime));
  return <primitive object={d.group} />;
}

/* ---------------------------------- streams ---------------------------------- */

/** A curved data line from a part to the processor that draws itself, with particles running along it. */
function Stream({ from, progress, delay }: { from: THREE.Vector3; progress: Progress; delay: number }) {
  const { curve, geo, n, line, mat } = useMemo(() => {
    const end = new THREE.Vector3(0, -0.45, 0);
    const mid = from.clone().add(end).multiplyScalar(0.5);
    mid.y += 0.9 + from.length() * 0.12;
    const curve = new THREE.QuadraticBezierCurve3(from.clone(), mid, end);
    const pts = curve.getPoints(80);
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    const mat = new THREE.LineBasicMaterial({ color: AQUA_LINE, transparent: true, opacity: 0.3 });
    return { curve, geo, n: pts.length, mat, line: new THREE.Line(geo, mat) };
  }, [from]);
  useEffect(() => () => (geo.dispose(), mat.dispose()), [geo, mat]);
  const dots = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    const p = progress.current;
    const draw = range(p, 0.5 + delay, 0.72 + delay);
    geo.setDrawRange(0, Math.max(2, Math.floor(n * draw)));
    mat.opacity = 0.25 + draw * 0.5;
    const flow = range(p, 0.68 + delay, 0.85);
    dots.current!.children.forEach((c, i) => {
      const t = (clock.elapsedTime * 0.35 + i / 3 + delay) % 1;
      c.position.copy(curve.getPoint(t));
      c.visible = flow > 0.02;
      c.scale.setScalar(flow);
    });
  });
  return (
    <group>
      <primitive object={line} />
      <group ref={dots}>
        {[0, 1, 2].map((i) => (
          <mesh key={i}>
            <sphereGeometry args={[0.035, 12, 8]} />
            <meshBasicMaterial color={AQUA} toneMapped={false} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

/* ---------------------------------- scene ---------------------------------- */

type Pts = Record<string, { x: number; y: number; on: number }>;

function Ecosystem({ progress, still, mobile, onLabels }: { progress: Progress; still: boolean; mobile: boolean; onLabels: (p: Pts) => void }) {
  const live = useMemo<Live>(() => ({ hover: 0, still }), [still]);
  const holders = useRef<(THREE.Group | null)[]>([]);
  const anchors = useRef<Record<string, THREE.Object3D | null>>({});
  const nodes = useRef<THREE.Group>(null);
  const world = useRef<THREE.Group>(null);
  const platformRing = useRef<THREE.MeshBasicMaterial>(null);
  const glow = useRef<THREE.Mesh>(null);
  const mouse = useRef({ x: 0, y: 0 });
  const smooth = useRef(0);
  const v = useMemo(() => new THREE.Vector3(), []);
  const targets = useMemo(() => PARTS.map((p) => new THREE.Vector3(...p.target)), []);
  const nodeData = useMemo(
    () => Array.from({ length: mobile ? 8 : 14 }, (_, i) => ({ a: (i / (mobile ? 8 : 14)) * Math.PI * 2, r: 3.3 + (i % 3) * 0.45, y: -0.6 + ((i * 37) % 10) / 4.5, s: 0.4 + (i % 4) * 0.2 })),
    [mobile],
  );

  useEffect(() => {
    if (still) return;
    const on = (e: PointerEvent) => {
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.current.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", on, { passive: true });
    return () => window.removeEventListener("pointermove", on);
  }, [still]);

  useFrame(({ clock, camera, size }) => {
    const t = still ? 2 : clock.elapsedTime;
    smooth.current += (progress.current - smooth.current) * 0.08;
    const p = still ? 1 : smooth.current;

    PARTS.forEach((part, i) => {
      const g = holders.current[i];
      if (!g) return;
      const k = range(p, 0.08 + i * 0.05, 0.42 + i * 0.05); // staggered assembly
      const fx = part.from[0] + Math.sin(t * 0.6 + i) * 0.25;
      const fy = part.from[1] + Math.sin(t * 0.8 + i * 1.7) * 0.3;
      const fz = part.from[2];
      g.position.set(fx + (part.target[0] - fx) * k, fy + (part.target[1] - fy) * k + Math.sin(t * 1.1 + i) * 0.04, fz + (part.target[2] - fz) * k);
      g.rotation.set((1 - k) * Math.sin(t * 0.5 + i) * 0.6, (1 - k) * part.spin * (1 + t * 0.15) + k * Math.atan2(-part.target[0], part.target[2] + 4) * 0.5, (1 - k) * 0.3);
    });

    const done = range(p, 0.82, 1);
    platformRing.current!.opacity = 0.15 + range(p, 0.45, 0.8) * 0.6;
    (glow.current!.material as THREE.MeshBasicMaterial).opacity = done * 0.6;
    glow.current!.scale.setScalar(1 + Math.sin(t * 1.5) * 0.03 * done);

    nodes.current!.children.forEach((c, i) => {
      const d = nodeData[i];
      const a = d.a + t * 0.08;
      const r = d.r * (1.4 - range(p, 0.3, 0.8) * 0.4);
      c.position.set(Math.cos(a) * r, d.y + Math.sin(t + i) * 0.12, Math.sin(a) * r);
    });

    // keep the whole platform in view on narrow (mobile) stages
    const aspect = size.width / Math.max(size.height, 1);
    camera.position.z = aspect >= 1.2 ? 11.5 : (11.5 * 1.2 * 0.86) / Math.max(aspect, 0.45);
    camera.position.y = aspect >= 1.2 ? 3.2 : 4.2;
    camera.lookAt(0, -0.2, 0);

    const m = mouse.current;
    world.current!.rotation.y = -0.35 + p * 0.25 + m.x * 0.12 + (still ? 0 : t * 0.02);
    world.current!.rotation.x = m.y * 0.05;

    // annotation positions
    const out: Pts = {};
    for (const [k, o] of Object.entries(anchors.current)) {
      if (!o) continue;
      o.getWorldPosition(v).project(camera);
      out[k] = { x: (v.x * 0.5 + 0.5) * size.width, y: (-v.y * 0.5 + 0.5) * size.height, on: range(p, 0.6, 0.9) };
    }
    onLabels(out);
  });

  const children: Record<string, ReactNode> = {
    robotics: <RobotArm live={live} />,
    edge: <EdgeServer live={live} />,
    sensorA: <Sensor />,
    sensorB: <Sensor />,
    drone: <Drone still={still} />,
    rover: <Rover />,
  };

  return (
    <group ref={world} position-y={-0.15}>
      {/* glass platform */}
      <mesh position-y={-1.12}>
        <cylinderGeometry args={[3.9, 4.05, 0.06, 96]} />
        <meshPhysicalMaterial color="#f3f8f9" roughness={0.12} clearcoat={1} transparent opacity={0.55} envMapIntensity={1.3} />
      </mesh>
      <mesh position-y={-1.085} rotation-x={-Math.PI / 2}>
        <ringGeometry args={[3.55, 3.57, 128]} />
        <meshBasicMaterial ref={platformRing} color={AQUA_LINE} transparent opacity={0.15} toneMapped={false} />
      </mesh>
      {[1.4, 2.3].map((r) => (
        <mesh key={r} position-y={-1.085} rotation-x={-Math.PI / 2}>
          <ringGeometry args={[r, r + 0.008, 128]} />
          <meshBasicMaterial color="#9fb2b8" transparent opacity={0.45} />
        </mesh>
      ))}
      <mesh ref={glow} position-y={-1.08} rotation-x={-Math.PI / 2}>
        <circleGeometry args={[3.4, 64]} />
        <meshBasicMaterial color={AQUA} transparent opacity={0} depthWrite={false} />
      </mesh>

      <Processor progress={progress} still={still} />
      <object3D position={CORE_LABEL.anchor as unknown as THREE.Vector3} ref={(el) => void (anchors.current.core = el)} />

      {PARTS.map((part, i) => (
        <group key={part.id} ref={(el) => void (holders.current[i] = el)} scale={part.scale}>
          {children[part.id]}
          {part.label && <object3D position={part.anchor as unknown as THREE.Vector3} ref={(el) => void (anchors.current[part.id] = el)} />}
        </group>
      ))}

      {targets.map((tv, i) => (
        <Stream key={i} from={tv.clone().add(new THREE.Vector3(0, PARTS[i].anchor[1] * PARTS[i].scale * 0.6, 0))} progress={progress} delay={i * 0.025} />
      ))}

      <group ref={nodes}>
        {nodeData.map((d, i) => (
          <mesh key={i} scale={d.s}>
            <sphereGeometry args={[0.07, 16, 12]} />
            <meshPhysicalMaterial color={i % 3 === 0 ? TEAL : i % 3 === 1 ? AQUA : "#eaf3f5"} metalness={0.3} roughness={0.12} clearcoat={1} envMapIntensity={1.4} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

/** Canvas + projected annotation labels. Progress comes from the pinned section's scroll position. */
export default function EcosystemScene({ section }: { section: React.RefObject<HTMLElement | null> }) {
  const wrap = useRef<HTMLDivElement>(null);
  const progress = useRef(0);
  const [visible, setVisible] = useState(false);
  const [env] = useState(() => ({
    still: typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    mobile: typeof window !== "undefined" && window.innerWidth < 760,
  }));

  useEffect(() => {
    const el = wrap.current!;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { rootMargin: "200px" });
    io.observe(el);
    let raf = 0;
    const read = () => {
      const s = section.current;
      if (s) {
        const r = s.getBoundingClientRect();
        progress.current = clamp01(-r.top / Math.max(r.height - window.innerHeight, 1));
      }
      raf = requestAnimationFrame(read);
    };
    raf = requestAnimationFrame(read);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [section]);

  const onLabels = useMemo(
    () => (pts: Pts) => {
      const host = wrap.current;
      if (!host) return;
      host.querySelectorAll<HTMLElement>("[data-ex-label]").forEach((el) => {
        const p = pts[el.dataset.exLabel!];
        if (!p) return;
        // keep labels inside the stage (narrow screens)
        const x = Math.min(Math.max(p.x, 10), host.clientWidth - el.offsetWidth - 4);
        el.style.transform = `translate(${x}px, ${p.y}px)`;
        el.style.opacity = String(p.on);
      });
    },
    [],
  );

  const labels = [CORE_LABEL, ...PARTS.filter((p) => p.label)];
  return (
    <div ref={wrap} className="ex-canvas">
      <Canvas
        dpr={[1, env.mobile ? 1.4 : 1.75]}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        camera={{ fov: 32, position: [0, 3.2, env.mobile ? 15 : 11.5] }}
        frameloop={env.still ? "demand" : visible ? "always" : "never"}
        onCreated={({ gl, camera }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          camera.lookAt(0, -0.2, 0);
        }}
        aria-hidden="true"
      >
        <StudioEnvironment />
        <hemisphereLight args={["#ffffff", "#d6e2e6", 1.25]} />
        <directionalLight position={[-4, 7, 6]} intensity={2.1} />
        <Ecosystem progress={progress} still={env.still} mobile={env.mobile} onLabels={onLabels} />
      </Canvas>
      {labels.map((l) => (
        <span key={l.id} className="ex-label" data-ex-label={l.id}>
          <i />
          {l.label}
        </span>
      ))}
    </div>
  );
}
