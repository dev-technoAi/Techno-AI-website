"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState, type MutableRefObject } from "react";
import * as THREE from "three";
import { StudioEnvironment } from "./core-scene";

// Section 03 — one continuous brushed-metal signal path: SENSE → DECIDE → ACT.
// Scroll progress (0..1 of the pinned section) moves the camera along the path and sends the data
// pulse from node to node; everything is reversible because it is a pure function of progress.

const TEAL = new THREE.Color("#289fb7");
const AQUA = new THREE.Color("#9fe7e7");

const clamp01 = (v: number) => Math.min(Math.max(v, 0), 1);
const smooth = (v: number) => {
  const x = clamp01(v);
  return x * x * (3 - 2 * x);
};
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Where each node sits on the path (0..1 along its length). */
export const NODES = { sense: 0.3, decide: 0.6, act: 0.8 } as const;

/** Scroll → story. Returns the camera's path position, the pulse head and the stage (0 sense, 1 decide, 2 act, 3 connected). */
export function story(p: number) {
  // pulse head along the path
  const head =
    p < 0.1 ? lerp(0.02, NODES.sense, smooth(p / 0.1))
    : p < 0.38 ? lerp(NODES.sense, NODES.decide, smooth((p - 0.1) / 0.28))
    : p < 0.64 ? lerp(NODES.decide, NODES.act, smooth((p - 0.38) / 0.26))
    : lerp(NODES.act, 1, smooth((p - 0.64) / 0.18));
  // camera focus point along the path, then pull back to show the whole system
  const focus = p < 0.64 ? Math.max(head, NODES.sense) : NODES.act;
  const wide = smooth((p - 0.66) / 0.18); // 0 close follow … 1 full connected view
  const stage = p < 0.3 ? 0 : p < 0.56 ? 1 : p < 0.8 ? 2 : 3;
  return { head, focus, wide, stage };
}

/* ---------------------------------- the path ---------------------------------- */

function makeCurve() {
  return new THREE.CatmullRomCurve3(
    [
      [-11, -1.7, 1.2], [-7, -1.6, 0.8], [-4, -1.45, 0.5], [-1.5, -1.1, 0.3], [0.3, -0.2, 0.15],
      [1.6, 0.55, 0], [3, 0.6, -0.1], [4.2, -0.1, -0.2], [5.3, -0.9, -0.3], [7, -1.1, -0.5],
      [8.6, -0.6, -0.7], [9.6, 0.6, -0.9], [10.2, 2.2, -1.1],
    ].map(([x, y, z]) => new THREE.Vector3(x, y, z)),
    false,
    "centripetal",
  );
}

/** Frame (tangent, in-plane normal, face normal) at u — the band keeps its broad face towards the viewer. */
function frameAt(curve: THREE.Curve<THREE.Vector3>, u: number) {
  const p = curve.getPointAt(u);
  const t = curve.getTangentAt(u);
  const n = new THREE.Vector3(0, 0, 1).cross(t).normalize(); // "up" across the band
  const b = new THREE.Vector3().crossVectors(t, n).normalize(); // broad face normal (≈ +z)
  return { p, t, n, b };
}

/** Sweeps a rounded-rectangle profile along the curve → a solid brushed-metal strap. */
function ribbonGeometry(curve: THREE.Curve<THREE.Vector3>, W: number, T: number, samples: number) {
  const r = 0.07;
  const prof: [number, number, number, number][] = []; // x across (n), y thickness (b), normal nx, ny
  const corner = (cx: number, cy: number, a0: number) => {
    for (let i = 0; i <= 4; i++) {
      const a = a0 + (i / 4) * (Math.PI / 2);
      prof.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r, Math.cos(a), Math.sin(a)]);
    }
  };
  const hw = W / 2 - r;
  const ht = T / 2 - r;
  corner(hw, ht, 0);
  corner(-hw, ht, Math.PI / 2);
  corner(-hw, -ht, Math.PI);
  corner(hw, -ht, Math.PI * 1.5);
  const P = prof.length;
  const pos: number[] = [];
  const nor: number[] = [];
  const uv: number[] = [];
  const idx: number[] = [];
  for (let s = 0; s <= samples; s++) {
    const u = s / samples;
    const { p, n, b } = frameAt(curve, u);
    for (let k = 0; k < P; k++) {
      const [x, y, nx, ny] = prof[k];
      pos.push(p.x + n.x * x + b.x * y, p.y + n.y * x + b.y * y, p.z + n.z * x + b.z * y);
      nor.push(n.x * nx + b.x * ny, n.y * nx + b.y * ny, n.z * nx + b.z * ny);
      uv.push(u * 40, k / P);
    }
  }
  for (let s = 0; s < samples; s++)
    for (let k = 0; k < P; k++) {
      const a = s * P + k;
      const bb = s * P + ((k + 1) % P);
      const c = (s + 1) * P + k;
      const d = (s + 1) * P + ((k + 1) % P);
      idx.push(a, c, bb, bb, c, d);
    }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  return g;
}

/* ---------------------------------- data pulse ---------------------------------- */

const PULSE_VERT = /* glsl */ `varying float vU; void main(){ vU = uv.x; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`;
const PULSE_FRAG = /* glsl */ `
  uniform float uHead; uniform float uTime; uniform vec3 uDim; uniform vec3 uLit; uniform vec3 uHot;
  varying float vU;
  void main() {
    float lit = step(vU, uHead);
    float packets = smoothstep(.75, 1., fract(vU * 26. - uTime * 1.6)) * lit;
    float headGlow = exp(-pow((vU - uHead) * 70., 2.));
    vec3 col = mix(uDim, uLit, lit) + uHot * (packets * .6 + headGlow * 1.4);
    float a = mix(.35, .95, lit) + headGlow;
    gl_FragColor = vec4(col, clamp(a, 0., 1.));
  }`;

/* ---------------------------------- nodes ---------------------------------- */

const DIE_VERT = /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`;
const DIE_FRAG = /* glsl */ `
  uniform float uTime; uniform float uOn; varying vec2 vUv;
  float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
  void main() {
    vec2 g = vUv * 12.; vec2 id = floor(g); vec2 f = fract(g); float r = h(id);
    float l = max(smoothstep(.08, 0., abs(f.y - .5)) * step(.55, r), smoothstep(.08, 0., abs(f.x - .5)) * step(r, .25));
    float frame = smoothstep(.36, .34, max(abs(vUv.x - .5), abs(vUv.y - .5))) - smoothstep(.3, .28, max(abs(vUv.x - .5), abs(vUv.y - .5)));
    float pulse = .6 + .4 * sin(uTime * 2.5);
    vec3 base = mix(vec3(.04, .1, .13), vec3(.05, .28, .38), uOn);
    gl_FragColor = vec4(base + vec3(.62, .9, .9) * (l * .5 + frame * 1.2) * uOn * pulse + vec3(.1, .3, .35) * l * .3, 1.);
  }`;

function Screws({ d }: { d: number }) {
  return (
    <>
      {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([x, y], i) => (
        <mesh key={i} position={[x * d, y * d, 0.06]} rotation-x={Math.PI / 2}>
          <cylinderGeometry args={[0.028, 0.028, 0.02, 12]} />
          <meshStandardMaterial color="#8d999e" metalness={1} roughness={0.3} />
        </mesh>
      ))}
    </>
  );
}

const steel = { color: "#d8dee1", metalness: 0.95, roughness: 0.28, envMapIntensity: 1.3 } as const;

function SenseNode({ on }: { on: MutableRefObject<number> }) {
  const led = useRef<THREE.MeshStandardMaterial>(null);
  const ring = useRef<THREE.MeshBasicMaterial>(null);
  useFrame(() => {
    led.current!.emissiveIntensity = 0.3 + on.current * 2.4;
    ring.current!.opacity = on.current * 0.9;
  });
  return (
    <group>
      <mesh rotation-x={Math.PI / 2}>
        <cylinderGeometry args={[0.36, 0.38, 0.1, 48]} />
        <meshStandardMaterial {...steel} />
      </mesh>
      <mesh rotation-x={Math.PI / 2} position-z={0.05}>
        <torusGeometry args={[0.29, 0.03, 12, 48]} />
        <meshStandardMaterial color="#a9b4b8" metalness={1} roughness={0.22} />
      </mesh>
      <mesh position-z={0.04} scale={[1, 1, 0.55]}>
        <sphereGeometry args={[0.23, 40, 24]} />
        <meshPhysicalMaterial color="#0c1416" metalness={0.3} roughness={0.08} clearcoat={1} />
      </mesh>
      <mesh position={[0.05, 0.05, 0.17]}>
        <sphereGeometry args={[0.04, 16, 12]} />
        <meshStandardMaterial ref={led} color={TEAL} emissive={TEAL} emissiveIntensity={0.3} toneMapped={false} />
      </mesh>
      <mesh position-z={0.11}>
        <ringGeometry args={[0.4, 0.43, 48]} />
        <meshBasicMaterial ref={ring} color={AQUA} transparent opacity={0} toneMapped={false} />
      </mesh>
      <Screws d={0.25} />
    </group>
  );
}

function DecideNode({ on }: { on: MutableRefObject<number> }) {
  const uni = useMemo(() => ({ uTime: { value: 0 }, uOn: { value: 0 } }), []);
  const ring = useRef<THREE.MeshBasicMaterial>(null);
  useFrame(({ clock }) => {
    uni.uTime.value = clock.elapsedTime;
    uni.uOn.value = on.current;
    ring.current!.opacity = on.current * 0.85;
  });
  return (
    <group>
      <mesh>
        <boxGeometry args={[0.74, 0.74, 0.12]} />
        <meshStandardMaterial {...steel} />
      </mesh>
      <mesh position-z={0.065}>
        <boxGeometry args={[0.56, 0.56, 0.02]} />
        <meshStandardMaterial color="#1a2629" metalness={0.6} roughness={0.35} />
      </mesh>
      <mesh position-z={0.078}>
        <planeGeometry args={[0.46, 0.46]} />
        <shaderMaterial vertexShader={DIE_VERT} fragmentShader={DIE_FRAG} uniforms={uni} />
      </mesh>
      <mesh position-z={0.08}>
        <ringGeometry args={[0.44, 0.47, 4, 1, Math.PI / 4]} />
        <meshBasicMaterial ref={ring} color={AQUA} transparent opacity={0} toneMapped={false} />
      </mesh>
      <Screws d={0.3} />
    </group>
  );
}

function ActNode({ on }: { on: MutableRefObject<number> }) {
  const ring = useRef<THREE.MeshStandardMaterial>(null);
  const knob = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    ring.current!.emissiveIntensity = 0.2 + on.current * 2.2;
    knob.current!.position.z = 0.1 - on.current * 0.025 + Math.sin(clock.elapsedTime * 3) * 0.004 * on.current; // pressed when active
  });
  return (
    <group>
      <mesh rotation-x={Math.PI / 2}>
        <cylinderGeometry args={[0.32, 0.34, 0.1, 48]} />
        <meshStandardMaterial {...steel} />
      </mesh>
      <mesh rotation-x={Math.PI / 2} position-z={0.055}>
        <torusGeometry args={[0.215, 0.022, 12, 48]} />
        <meshStandardMaterial ref={ring} color={TEAL} emissive={TEAL} emissiveIntensity={0.2} toneMapped={false} />
      </mesh>
      <mesh ref={knob} rotation-x={Math.PI / 2} position-z={0.1}>
        <cylinderGeometry args={[0.17, 0.18, 0.12, 40]} />
        <meshStandardMaterial color="#c7d0d4" metalness={1} roughness={0.18} envMapIntensity={1.5} />
      </mesh>
    </group>
  );
}

/* ---------------------------------- scene ---------------------------------- */

type LabelPts = Record<string, { x: number; y: number; on: number; seen: number }>;

function Path({ progress, still, mobile, onFrame }: { progress: MutableRefObject<number>; still: boolean; mobile: boolean; onFrame: (pts: LabelPts, stage: number) => void }) {
  const curve = useMemo(makeCurve, []);
  const W = 0.72;
  const T = 0.18;
  const ribbon = useMemo(() => ribbonGeometry(curve, W, T, mobile ? 320 : 560), [curve, mobile]);
  const pulseGeo = useMemo(() => {
    const pts = Array.from({ length: 300 }, (_, i) => {
      const { p, n, b } = frameAt(curve, i / 299);
      return p.clone().addScaledVector(b, T / 2 + 0.02).addScaledVector(n, -W * 0.3);
    });
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 600, 0.024, 8, false);
  }, [curve]);
  useEffect(() => () => (ribbon.dispose(), pulseGeo.dispose()), [ribbon, pulseGeo]);
  const pulseUni = useMemo(() => ({ uHead: { value: 0 }, uTime: { value: 0 }, uDim: { value: new THREE.Color("#b9cdd3") }, uLit: { value: AQUA }, uHot: { value: new THREE.Color("#ffffff") } }), []);

  const nodes = useMemo(
    () =>
      (Object.entries(NODES) as [keyof typeof NODES, number][]).map(([id, u]) => {
        const { p, n, b, t } = frameAt(curve, u);
        const m = new THREE.Matrix4().makeBasis(t, n, b);
        const q = new THREE.Quaternion().setFromRotationMatrix(m);
        return { id, u, pos: p.clone().addScaledVector(b, T / 2).addScaledVector(n, 0.05), q, n, b };
      }),
    [curve],
  );
  const on = { sense: useRef(0), decide: useRef(0), act: useRef(0) };
  const sm = useRef(still ? 1 : 0);
  const cam = useThree((s) => s.camera);
  const look = useMemo(() => new THREE.Vector3(), []);
  const camPos = useMemo(() => new THREE.Vector3(), []);
  const v = useMemo(() => new THREE.Vector3(), []);
  const first = useRef(true);

  useFrame(({ clock, size }, dt) => {
    const k = 1 - Math.exp(-Math.min(dt, 0.1) * 5.5); // frame-rate independent damping
    sm.current += ((still ? 1 : progress.current) - sm.current) * (still ? 1 : k);
    const p = sm.current;
    const { head, focus, wide, stage } = story(p);
    pulseUni.uHead.value = head;
    pulseUni.uTime.value = clock.elapsedTime;
    on.sense.current = smooth((head - NODES.sense + 0.03) / 0.04);
    on.decide.current = smooth((head - NODES.decide + 0.03) / 0.04);
    on.act.current = smooth((head - NODES.act + 0.03) / 0.04);

    // camera: follow the focus point, then pull back for the connected overview
    const aspect = size.width / Math.max(size.height, 1);
    const portrait = aspect < 1;
    const fit = portrait ? Math.min(1.6 / Math.max(aspect, 0.45), 2.6) : aspect < 1.4 ? 1.3 : 1;
    const f = curve.getPointAt(clamp01(focus));
    const nearDist = 8 * fit;
    const farDist = portrait ? 13 * fit : 20.5 * fit;
    const dist = lerp(nearDist, farDist, wide);
    const tx = lerp(f.x + (portrait ? 0 : 1.4), portrait ? 4.2 : 0.4, wide);
    const ty = lerp(f.y + 1.25 * fit, portrait ? 2.2 * fit : 2.3, wide); // keeps the path in the lower part of the frame (text above)
    const tz = lerp(f.z, 0, wide);
    look.set(tx, ty, tz);
    camPos.set(tx - 1.6 * (1 - wide) - 0.8 * wide, ty + 1.2 + wide * 1.4, tz + dist);
    if (first.current || still) {
      cam.position.copy(camPos);
      first.current = false;
    } else cam.position.lerp(camPos, Math.min(1, k * 1.4));
    cam.lookAt(look);
    cam.updateMatrixWorld();

    // annotation positions
    const out: LabelPts = {};
    for (const nd of nodes) {
      v.copy(nd.pos).project(cam);
      out[nd.id] = { x: (v.x * 0.5 + 0.5) * size.width, y: (-v.y * 0.5 + 0.5) * size.height, on: on[nd.id].current, seen: v.z < 1 ? smooth((head - nd.u + 0.12) / 0.06) : 0 };
    }
    onFrame(out, stage);
  });

  return (
    <group>
      <mesh geometry={ribbon}>
        <meshPhysicalMaterial color="#146b8c" metalness={0.35} roughness={0.36} clearcoat={1} clearcoatRoughness={0.18} anisotropy={0.5} envMapIntensity={0.8} />
      </mesh>
      <mesh geometry={pulseGeo}>
        <shaderMaterial vertexShader={PULSE_VERT} fragmentShader={PULSE_FRAG} uniforms={pulseUni} transparent depthWrite={false} />
      </mesh>
      {nodes.map((nd) => (
        <group key={nd.id} position={nd.pos} quaternion={nd.q} scale={0.78}>
          {nd.id === "sense" ? <SenseNode on={on.sense} /> : nd.id === "decide" ? <DecideNode on={on.decide} /> : <ActNode on={on.act} />}
        </group>
      ))}
    </group>
  );
}

/** Canvas + labels; progress is read from the pinned section's scroll position. */
export default function SignalPathScene({ section, onFail }: { section: React.RefObject<HTMLElement | null>; onFail: () => void }) {
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

  const lastStage = useRef(-1);
  const onFrame = useMemo(
    () => (pts: LabelPts, stage: number) => {
      const host = wrap.current;
      if (!host) return;
      host.querySelectorAll<HTMLElement>("[data-sp-label]").forEach((el) => {
        const p = pts[el.dataset.spLabel!];
        if (!p) return;
        const x = Math.min(Math.max(p.x - el.offsetWidth - 22, 8), host.clientWidth - el.offsetWidth - 8);
        el.style.transform = `translate(${x}px, ${p.y - el.offsetHeight / 2}px)`;
        el.style.opacity = String(p.seen * Math.min(1, 0.45 + p.on));
        el.classList.toggle("is-on", p.on > 0.5);
      });
      if (stage !== lastStage.current) {
        lastStage.current = stage;
        section.current?.setAttribute("data-stage", String(stage));
      }
    },
    [section],
  );

  return (
    <div ref={wrap} className="sp-canvas">
      <Canvas
        dpr={[1, env.mobile ? 1.4 : 1.75]}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        camera={{ fov: 30, position: [0, 2, 16], near: 0.1, far: 120 }}
        frameloop={env.still ? "demand" : visible ? "always" : "never"}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.05;
        }}
        onError={onFail}
        aria-hidden="true"
      >
        <StudioEnvironment />
        <hemisphereLight args={["#ffffff", "#dfe7ea", 1.15]} />
        <directionalLight position={[-6, 9, 8]} intensity={1.9} />
        <directionalLight position={[8, 3, 6]} intensity={0.6} color="#dff6f7" />
        <Path progress={progress} still={env.still} mobile={env.mobile} onFrame={onFrame} />
      </Canvas>
      {(["sense", "decide", "act"] as const).map((k) => (
        <span key={k} className="sp-label" data-sp-label={k}>
          {k}
          <i />
        </span>
      ))}
    </div>
  );
}
