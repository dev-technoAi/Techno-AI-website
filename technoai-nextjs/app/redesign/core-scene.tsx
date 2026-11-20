"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Component, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

// "Intelligence Core" — the 3D object of the home hero, built with React Three Fiber.
// Glass sphere + circuit shells + glowing //:ai core + metallic orbital rings + pedestal + particles.
// Brand colours only (TechnoAi Brand Identity PDF).

const INK = new THREE.Color("#0f1a1b");
const BLUE = new THREE.Color("#146b8c");
const TEAL = new THREE.Color("#146b8c"); // 3-colour theme: teal retired, uses brand blue
const AQUA_LINE = new THREE.Color("#146b8c"); // selected Brand Blue core accents
const AQUA = new THREE.Color("#9fe7e7");

/** Points on the glass surface the floating labels point at (local to the floating group). */
export const LABEL_ANCHORS: Record<string, [number, number, number]> = {
  ai: [-0.66, 0.95, 0.8],
  robotics: [1.3, 0.12, 0.55],
  edge: [-0.9, -0.8, 0.66],
};

type Pts = Record<string, { x: number; y: number }>;

/* ---------------------------------- shaders ---------------------------------- */

const VERT = /* glsl */ `
  varying vec3 vN; varying vec3 vV; varying vec2 vUv;
  void main() {
    vUv = uv;
    vec4 mv = modelViewMatrix * vec4(position, 1.);
    vN = normalize(normalMatrix * normal);
    vV = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }`;

// Deep blue energy sphere with moving circuit traces and a bright fresnel rim.
const CORE_FRAG = /* glsl */ `
  uniform float uTime; uniform vec3 uInk; uniform vec3 uBlue; uniform vec3 uTeal; uniform vec3 uAqua;
  varying vec3 vN; varying vec3 vV; varying vec2 vUv;
  float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float trace(vec2 uv, float scale, float t) {
    vec2 g = uv * vec2(scale * 2., scale);
    vec2 id = floor(g); vec2 f = fract(g);
    float r = h(id);
    float lineH = smoothstep(.06, .0, abs(f.y - .5)) * step(.45, r);
    float lineV = smoothstep(.06, .0, abs(f.x - .5)) * step(r, .35);
    float node = smoothstep(.16, .08, length(f - .5)) * step(.78, r);
    float k = fract(g.x * .07 + g.y * .03 - t * .35 + r);
    float pulse = smoothstep(.0, .25, k) * smoothstep(.5, .25, k);
    return max(max(lineH, lineV) * (.35 + pulse * 1.4), node);
  }
  void main() {
    float fres = pow(1. - max(dot(vN, vV), 0.), 2.2);
    float c = trace(vUv, 18., uTime) + trace(vUv + .37, 34., uTime * 1.3) * .6;
    vec3 base = mix(uInk * 1.2, uBlue, .55 + .45 * (1. - fres));
    gl_FragColor = vec4(base + uTeal * c * .9 + mix(uBlue, uAqua, .16) * fres * 1.15, 1.);
  }`;

// Fine circuit lines on a transparent shell (normal blending, reads on a white page).
const SHELL_FRAG = /* glsl */ `
  uniform float uTime; uniform vec3 uColor; uniform float uOpacity;
  varying vec3 vN; varying vec3 vV; varying vec2 vUv;
  float h(vec2 p){ return fract(sin(dot(p, vec2(41.3, 289.1))) * 15731.743); }
  void main() {
    vec2 g = vUv * vec2(64., 32.);
    vec2 id = floor(g); vec2 f = fract(g); float r = h(id);
    float l = max(smoothstep(.05, .0, abs(f.y - .5)) * step(.62, r), smoothstep(.05, .0, abs(f.x - .5)) * step(r, .16));
    float node = smoothstep(.18, .1, length(f - .5)) * step(.9, r);
    float pulse = smoothstep(.85, 1., fract(vUv.x * 3. - uTime * .12 + r * .2));
    float facing = max(dot(vN, vV), 0.);
    gl_FragColor = vec4(uColor, max(l, node) * uOpacity * (.45 + .55 * facing) * (1. + pulse));
  }`;

// Glass rim: brighter at the edges, nearly clear in the middle.
const GLASS_FRAG = /* glsl */ `
  uniform vec3 uRim; uniform vec3 uTint;
  varying vec3 vN; varying vec3 vV;
  void main() {
    float fres = pow(1. - max(dot(vN, vV), 0.), 2.6);
    gl_FragColor = vec4(mix(uTint, uRim, fres), .05 + fres * .55);
  }`;

const BEAM_VERT = /* glsl */ `varying float vY; void main(){ vY = uv.y; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`;
const BEAM_FRAG = /* glsl */ `uniform vec3 uColor; varying float vY; void main(){ gl_FragColor = vec4(uColor, (1. - vY) * .07); }`;

/* ---------------------------------- textures ---------------------------------- */

/** The official white //:ai mark with a soft aqua glow, drawn into a texture. */
function useLogoTexture() {
  // Created in an effect (not a memo) so React's dev double-mount cannot dispose the texture in use;
  // returned only once the SVG has been drawn, so the material is built with the map present.
  const [tex, setTex] = useState<THREE.CanvasTexture | null>(null);
  useEffect(() => {
    let alive = true;
    const c = document.createElement("canvas");
    c.width = 512;
    c.height = 256;
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    const img = new Image();
    img.onload = () => {
      if (!alive) return;
      const x = c.getContext("2d")!;
      const w = 330;
      const hgt = (w * 105.44) / 225.31;
      const at = [(512 - w) / 2, (256 - hgt) / 2] as const;
      x.clearRect(0, 0, 512, 256);
      x.filter = "blur(14px)";
      x.globalAlpha = 0.85;
      x.drawImage(img, at[0], at[1], w, hgt);
      x.globalCompositeOperation = "source-in";
      x.fillStyle = "#9fe7e7";
      x.fillRect(0, 0, 512, 256);
      x.globalCompositeOperation = "source-over";
      x.filter = "none";
      x.globalAlpha = 1;
      x.drawImage(img, at[0], at[1], w, hgt);
      t.needsUpdate = true;
      setTex(t);
    };
    img.src = "/wp-content/uploads/2026/07/Logo.svg";
    return () => {
      alive = false;
      t.dispose();
    };
  }, []);
  return tex;
}

function useDotTexture() {
  const tex = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 64;
    const x = c.getContext("2d")!;
    const g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, "rgba(20,107,140,1)");
    g.addColorStop(0.45, "rgba(40,159,183,.55)");
    g.addColorStop(1, "rgba(40,159,183,0)");
    x.fillStyle = g;
    x.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(c);
  }, []);
  useEffect(() => () => tex.dispose(), [tex]);
  return tex;
}

/* ---------------------------------- scene parts ---------------------------------- */

/** Soft studio reflections for the chrome and glass (three's RoomEnvironment, no HDR download). */
export function StudioEnvironment() {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const env = pmrem.fromScene(new RoomEnvironment(), 0.035).texture;
    scene.environment = env;
    return () => {
      scene.environment = null;
      env.dispose();
      pmrem.dispose();
    };
  }, [gl, scene]);
  return null;
}

/** Keeps the whole object in view on narrow (mobile) stages. */
function ResponsiveCamera() {
  const camera = useThree((s) => s.camera);
  const aspect = useThree((s) => s.size.width / Math.max(s.size.height, 1));
  useEffect(() => {
    camera.position.z = aspect < 0.9 ? (8.7 / Math.max(aspect, 0.55)) * 0.92 : 8.7;
  }, [aspect, camera]);
  return null;
}

function Band({ r, h, seg }: { r: number; h: number; seg: number }) {
  return (
    <group>
      <mesh>
        <cylinderGeometry args={[r, r, h, seg * 2, 1, true]} />
        <meshStandardMaterial color="#0f1a1b" metalness={0.85} roughness={0.24} side={THREE.DoubleSide} envMapIntensity={1.35} />
      </mesh>
      <mesh>
        <cylinderGeometry args={[r - 0.012, r - 0.012, h * 0.96, seg * 2, 1, true]} />
        <meshStandardMaterial color="#146b8c" metalness={0.9} roughness={0.28} side={THREE.DoubleSide} />
      </mesh>
      <mesh rotation-x={Math.PI / 2} position-y={h / 2}>
        <torusGeometry args={[r, 0.004, 6, seg * 2]} />
        <meshBasicMaterial color={AQUA_LINE} transparent opacity={0.7} />
      </mesh>
    </group>
  );
}

const RINGS = [
  { r: 1.74, h: 0.17, tilt: [1.12, 0.18, -0.5] as const, speed: 0.32 },
  { r: 1.6, h: 0.12, tilt: [1.95, -0.45, 0.3] as const, speed: -0.22 },
  { r: 1.92, h: 0.075, tilt: [0.9, 0.85, 0.62] as const, speed: 0.15 },
];
const ORBITS = [
  { r: 2.2, tilt: [1.35, 0.4, 0.2] as const },
  { r: 2.45, tilt: [1.9, -0.7, -0.4] as const },
];
const CUBES = [
  [-2.6, 1.6, -0.6, 0.22],
  [2.6, 1.3, -0.4, 0.18],
  [2.75, -0.9, 0.2, 0.24],
  [-2.3, -1.4, 0.5, 0.16],
  [0.4, 2.45, -1.2, 0.12],
];

function Cube({ at, size, phase }: { at: [number, number, number]; size: number; phase: number }) {
  const ref = useRef<THREE.Group>(null);
  const geo = useMemo(() => new THREE.BoxGeometry(size, size, size, 2, 2, 2), [size]);
  const edges = useMemo(() => new THREE.EdgesGeometry(geo), [geo]);
  useEffect(() => () => (geo.dispose(), edges.dispose()), [geo, edges]);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const g = ref.current!;
    g.position.set(at[0] + Math.sin(t * 0.3 + phase) * 0.12, at[1] + Math.sin(t * 0.5 + phase) * 0.15, at[2]);
    g.rotation.set(t * 0.2 + phase, t * 0.3 + phase, 0);
  });
  return (
    <group ref={ref} position={at}>
      <mesh geometry={geo}>
        <meshPhysicalMaterial color="#dfe9ee" metalness={0.35} roughness={0.08} clearcoat={1} transparent opacity={0.85} envMapIntensity={1.5} />
      </mesh>
      <lineSegments geometry={edges}>
        <lineBasicMaterial color={TEAL} transparent opacity={0.7} />
      </lineSegments>
    </group>
  );
}

function Particles({ count }: { count: number }) {
  const map = useDotTexture();
  const { positions, speeds } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const speeds = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 7;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 5.5;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 3;
      speeds[i] = 0.05 + Math.random() * 0.15;
    }
    return { positions, speeds };
  }, [count]);
  const ref = useRef<THREE.BufferAttribute>(null);
  useFrame((_, dt) => {
    const a = ref.current;
    if (!a) return;
    const step = Math.min(dt, 0.05);
    for (let i = 0; i < count; i++) {
      let y = a.getY(i) + speeds[i] * step;
      if (y > 2.8) y = -2.8;
      a.setY(i, y);
    }
    a.needsUpdate = true;
  });
  return (
    <points>
      <bufferGeometry>
        <bufferAttribute ref={ref} attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.07} map={map} transparent depthWrite={false} opacity={0.75} />
    </points>
  );
}

/** The object itself. Reports the screen position of the label anchors after every frame. */
function IntelligenceCore({ mobile, still, onAnchors }: { mobile: boolean; still: boolean; onAnchors: (p: Pts) => void }) {
  const seg = mobile ? 40 : 64;
  const logoMap = useLogoTexture();
  const time = useMemo(() => ({ value: 0 }), []);
  const coreShader = useRef<THREE.ShaderMaterial>(null);
  const shellAShader = useRef<THREE.ShaderMaterial>(null);
  const shellBShader = useRef<THREE.ShaderMaterial>(null);
  const coreUniforms = useMemo(() => ({ uTime: time, uInk: { value: INK }, uBlue: { value: BLUE }, uTeal: { value: TEAL }, uAqua: { value: AQUA } }), [time]);
  const shellA = useMemo(() => ({ uTime: time, uColor: { value: BLUE }, uOpacity: { value: 0.55 } }), [time]);
  const shellB = useMemo(() => ({ uTime: time, uColor: { value: TEAL }, uOpacity: { value: 0.32 } }), [time]);
  const glassUniforms = useMemo(() => ({ uRim: { value: new THREE.Color("#146b8c") }, uTint: { value: new THREE.Color("#0f1a1b") } }), []);
  const beamUniforms = useMemo(() => ({ uColor: { value: BLUE } }), []);

  const root = useRef<THREE.Group>(null);
  const float = useRef<THREE.Group>(null);
  const spin = useRef<THREE.Group>(null);
  const shellBRef = useRef<THREE.Mesh>(null);
  const logo = useRef<THREE.Mesh>(null);
  const inner = useRef<THREE.PointLight>(null);
  const glowRing = useRef<THREE.Mesh>(null);
  const rings = useRef<(THREE.Group | null)[]>([]);
  const nodes = useRef<(THREE.Mesh | null)[]>([]);
  const ripples = useRef<(THREE.Mesh | null)[]>([]);
  const anchors = useRef<Record<string, THREE.Object3D | null>>({});

  // window-relative mouse (the stage is only part of the hero)
  const mouse = useRef({ x: 0, y: 0, tx: 0, ty: 0 });
  useEffect(() => {
    if (still) return;
    const on = (e: PointerEvent) => {
      mouse.current.tx = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.current.ty = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", on, { passive: true });
    return () => window.removeEventListener("pointermove", on);
  }, [still]);

  const v = useMemo(() => new THREE.Vector3(), []);
  useFrame(({ clock, camera, size }) => {
    const t = still ? 2.5 : clock.elapsedTime;
    const orbitTime = t;
    // R3F preserves its own uniform objects; update the mounted materials,
    // rather than the input uniform object copied when they were created.
    for (const shader of [coreShader.current, shellAShader.current, shellBShader.current]) {
      if (shader) shader.uniforms.uTime.value = t;
    }
    const m = mouse.current;
    m.x += (m.tx - m.x) * 0.05;
    m.y += (m.ty - m.y) * 0.05;

    const intro = still ? 1 : 1 - Math.pow(1 - Math.min(Math.max(t / 0.45, 0), 1), 3);
    root.current!.scale.setScalar(0.82 + intro * 0.18);
    root.current!.rotation.y = (1 - intro) * -0.5;

    const f = float.current!;
    f.position.y = 0.2 + Math.sin(t * 0.8) * 0.07;
    f.rotation.set(m.y * 0.16, m.x * 0.26, 0);
    spin.current!.rotation.set(Math.sin(orbitTime * 0.21) * 0.08, orbitTime * 0.16, 0);
    shellBRef.current!.rotation.y = -orbitTime * 0.1;
    logo.current!.lookAt(camera.position);
    inner.current!.position.copy(f.position);
    inner.current!.intensity = 16 + Math.sin(t * 2.1) * 3;

    rings.current.forEach((r, i) => r && (r.rotation.y = orbitTime * RINGS[i].speed));
    nodes.current.forEach((n, i) => {
      if (!n) return;
      const a = orbitTime * (0.35 - i * 0.12) + i * 2;
      n.position.set(Math.cos(a) * ORBITS[i].r, Math.sin(a) * ORBITS[i].r, 0);
    });
    glowRing.current!.scale.setScalar(1 + Math.sin(t * 2) * 0.01);
    ripples.current.forEach((r, i) => r && ((r.material as THREE.MeshBasicMaterial).opacity = (0.42 - i * 0.08) * (0.75 + 0.25 * Math.sin(t * 1.2 - i))));

    // Cursor tilt belongs to the floating core. Keep the camera and landing
    // platform fixed so the parked drone does not drift with the cursor.
    camera.position.x = 0;
    camera.position.y = 0.25;
    camera.lookAt(0, 0.05, 0);

    // label anchors → canvas pixels
    const out: Pts = {};
    for (const [k, o] of Object.entries(anchors.current)) {
      if (!o) continue;
      o.getWorldPosition(v).project(camera);
      out[k] = { x: (v.x * 0.5 + 0.5) * size.width, y: (-v.y * 0.5 + 0.5) * size.height };
    }
    onAnchors(out);
  });

  return (
    <group ref={root} position-y={0.22}>
      <group ref={float}>
        <group ref={spin}>
          {/* inner energy core */}
          <mesh>
            <sphereGeometry args={[0.72, seg, seg / 2]} />
            <shaderMaterial ref={coreShader} vertexShader={VERT} fragmentShader={CORE_FRAG} uniforms={coreUniforms} />
          </mesh>
          {/* circuit shells */}
          <mesh>
            <sphereGeometry args={[1.02, seg, seg / 2]} />
            <shaderMaterial ref={shellAShader} vertexShader={VERT} fragmentShader={SHELL_FRAG} uniforms={shellA} transparent depthWrite={false} side={THREE.DoubleSide} />
          </mesh>
          <mesh ref={shellBRef} rotation={[0.6, 0, 0.3]}>
            <sphereGeometry args={[1.18, seg, seg / 2]} />
            <shaderMaterial ref={shellBShader} vertexShader={VERT} fragmentShader={SHELL_FRAG} uniforms={shellB} transparent depthWrite={false} side={THREE.DoubleSide} />
          </mesh>
        </group>

        {/* //:ai mark, always facing the camera */}
        <mesh ref={logo} position-z={0.8} renderOrder={2} visible={!!logoMap}>
          <planeGeometry args={[1.2, 0.6]} />
          {logoMap && <meshBasicMaterial key={logoMap.uuid} map={logoMap} transparent depthWrite={false} toneMapped={false} />}
        </mesh>

        {/* glass sphere: fresnel rim + glossy physical layer for reflections */}
        <mesh>
          <sphereGeometry args={[1.42, seg, seg / 2]} />
          <shaderMaterial vertexShader={VERT} fragmentShader={GLASS_FRAG} uniforms={glassUniforms} transparent depthWrite={false} />
        </mesh>
        <mesh>
          <sphereGeometry args={[1.43, seg, seg / 2]} />
          <meshPhysicalMaterial color="#146b8c" metalness={0} roughness={0.04} clearcoat={1} clearcoatRoughness={0.03} transparent opacity={0.08} envMapIntensity={0.8} depthWrite={false} />
        </mesh>

        {/* metallic orbital bands, each turning at its own speed */}
        {RINGS.map((r, i) => (
          <group key={i} rotation={r.tilt as unknown as THREE.Euler}>
            <group ref={(el) => void (rings.current[i] = el)}>
              <Band r={r.r} h={r.h} seg={seg} />
            </group>
          </group>
        ))}

        {/* thin orbit lines with travelling nodes */}
        {ORBITS.map((o, i) => (
          <group key={i} rotation={o.tilt as unknown as THREE.Euler}>
            <mesh>
              <torusGeometry args={[o.r, 0.0035, 4, 220]} />
              <meshBasicMaterial color={AQUA_LINE} transparent opacity={0.75} />
            </mesh>
            <mesh ref={(el) => void (nodes.current[i] = el)}>
              <sphereGeometry args={[0.055, 24, 16]} />
              <meshPhysicalMaterial color={i ? AQUA : BLUE} emissive={i ? AQUA : BLUE} emissiveIntensity={0.25} metalness={0.4} roughness={0.15} clearcoat={1} envMapIntensity={1.4} />
            </mesh>
          </group>
        ))}

        {/* label anchors (move with the float + parallax, not with the spin) */}
        {Object.entries(LABEL_ANCHORS).map(([k, p]) => (
          <object3D key={k} position={p} ref={(el) => void (anchors.current[k] = el)} />
        ))}
      </group>

      <pointLight ref={inner} color={TEAL} intensity={18} distance={6} decay={2} />

      {/* pedestal */}
      <group position-y={-2.3}>
        <object3D position-y={0.17} ref={el => { anchors.current.dock = el; }} />
        <mesh>
          <cylinderGeometry args={[1.55, 1.68, 0.1, seg * 2]} />
          <meshStandardMaterial color="#0f1a1b" metalness={0.85} roughness={0.28} envMapIntensity={0.9} />
        </mesh>
        <mesh position-y={0.1}>
          <cylinderGeometry args={[1.18, 1.3, 0.12, seg * 2]} />
          <meshStandardMaterial color="#0f1a1b" metalness={0.85} roughness={0.28} envMapIntensity={0.9} />
        </mesh>
        <mesh ref={glowRing} rotation-x={Math.PI / 2} position-y={0.165}>
          <torusGeometry args={[1.08, 0.011, 8, seg * 2]} />
          <meshBasicMaterial color={BLUE} toneMapped={false} />
        </mesh>
        <mesh position-y={0.65}>
          <cylinderGeometry args={[0.55, 1.05, 1, 64, 1, true]} />
          <shaderMaterial vertexShader={BEAM_VERT} fragmentShader={BEAM_FRAG} uniforms={beamUniforms} transparent depthWrite={false} side={THREE.DoubleSide} />
        </mesh>
        {[2.1, 2.7, 3.4, 4.2].map((r, i) => (
          <mesh key={r} ref={(el) => void (ripples.current[i] = el)} rotation-x={-Math.PI / 2} position-y={-0.04}>
            <ringGeometry args={[r, r + 0.008, 160]} />
            <meshBasicMaterial color={i === 0 ? AQUA_LINE : i === 1 ? AQUA : "#9fb2b8"} transparent opacity={0.5 - i * 0.1} side={THREE.DoubleSide} />
          </mesh>
        ))}
      </group>

      <Particles count={mobile ? 70 : 180} />
      {CUBES.map(([x, y, z, s], i) => (
        <Cube key={i} at={[x, y, z]} size={s} phase={i * 1.3} />
      ))}
    </group>
  );
}

/* ---------------------------------- canvas + labels ---------------------------------- */

/** Any error while creating the WebGL scene → CSS fallback (core-stage.tsx). */
class SceneBoundary extends Component<{ onFail: () => void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onFail();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

/** React wrapper: R3F canvas + the SVG lines to the HTML labels. Loaded lazily by core-stage.tsx. */
/**
 * Compiles every shader of the scene on the GPU driver's background threads (KHR_parallel_shader_compile)
 * before the first frame. Without this the first render blocked the page for ~1.5 s.
 */
export function Warmup({ onReady }: { onReady: () => void }) {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);
  useEffect(() => {
    let off = false;
    const done = () => !off && onReady();
    const t = window.setTimeout(() => gl.compileAsync(scene, camera).then(done, done), 0); // after the scene's own effects
    return () => {
      off = true;
      clearTimeout(t);
    };
  }, [gl, scene, camera, onReady]);
  return null;
}

function CoreFrames({ active, ready }: { active: boolean; ready: boolean }) {
  const invalidate = useThree(state => state.invalidate);
  const setFrameloop = useThree(state => state.setFrameloop);
  // Start the clock in the canvas lifecycle after shader warmup. Changing only
  // the outer Canvas prop can render demand frames with its initial clock stopped.
  useEffect(() => {
    setFrameloop(ready ? "demand" : "never");
  }, [ready, setFrameloop]);
  useEffect(() => {
    invalidate();
    if (!active) return;
    const timer = window.setInterval(() => { if (!document.hidden) invalidate(); }, 1000 / 30);
    return () => clearInterval(timer);
  }, [active, invalidate, ready]);
  return null;
}

export default function CoreScene({ onFail, onReady }: { onFail: () => void; onReady?: () => void }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [env] = useState(() => ({
    still: typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    mobile: typeof window !== "undefined" && window.innerWidth < 760,
  }));
  const [visible, setVisible] = useState(true);
  const [compiled, setCompiled] = useState(false);
  const ready = useCallback(() => {
    setCompiled(true);
    onReady?.();
  }, [onReady]);

  // pause rendering while the hero is off screen
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting));
    io.observe(el);
    const stage = el.parentElement!;
    stage.classList.add("hx-ready");
    return () => {
      io.disconnect();
      stage.classList.remove("hx-ready");
    };
  }, []);

  // Label dot positions (relative to the stage) are measured only now and then, not every frame:
  // reading layout each frame after the SVG writes forced a layout per frame.
  const anchorCache = useRef<{ at: number; dots: Record<string, [number, number]>; left: number; top: number }>({ at: -1, dots: {}, left: 0, top: 0 });
  const onAnchors = useMemo(
    () => (pts: Pts) => {
      const svg = svgRef.current;
      const stage = wrapRef.current?.parentElement;
      if (!svg || !stage) return;
      const c = anchorCache.current;
      const now = performance.now();
      if (now - c.at > 500 && !document.documentElement.classList.contains("op-entering")) {
        // labels animate in / layout can change: refresh twice a second (cheap, no per-frame thrash)
        c.at = now;
        const sr = stage.getBoundingClientRect();
        c.left = sr.left;
        c.top = sr.top + window.scrollY;
        stage.querySelectorAll<HTMLElement>("[data-label]").forEach((el) => {
          const r = (el.querySelector<HTMLElement>(".hx-label-dot") || el).getBoundingClientRect();
          c.dots[el.dataset.label!] = [r.left + r.width / 2 - sr.left, r.top + r.height / 2 - sr.top];
        });
      }
      // Share the projected platform position with the existing flight canvas, without a layout read per frame.
      if (pts.dock && c.at >= 0) {
        (stage as HTMLElement & { __technoDroneDock?: { x: number; y: number } }).__technoDroneDock = {
          x: c.left + pts.dock.x, y: c.top + pts.dock.y,
        };
      }
      for (const k of Object.keys(c.dots)) {
        const p = pts[k];
        const line = svg.querySelector<SVGPolylineElement>(`[data-line="${k}"]`);
        if (!p || !line) continue;
        const [lx, ly] = c.dots[k];
        const mx = lx + (p.x - lx) * 0.45;
        line.setAttribute("points", `${lx},${ly} ${mx},${ly} ${p.x},${p.y}`);
        const end = svg.querySelector<SVGCircleElement>(`[data-end="${k}"]`);
        end?.setAttribute("cx", String(p.x));
        end?.setAttribute("cy", String(p.y));
      }
    },
    [],
  );

  return (
    <div ref={wrapRef} className="hx-canvas">
      <SceneBoundary onFail={onFail}>
        <Canvas
          dpr={1}
          gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
          camera={{ fov: 30, position: [0, 0.25, 8.7], near: 0.1, far: 100 }}
          frameloop="never"
          onCreated={({ gl }) => {
            gl.toneMapping = THREE.ACESFilmicToneMapping;
            gl.debug.checkShaderErrors = false; // no synchronous shader stall
            gl.toneMappingExposure = 1.05;
          }}
          aria-hidden="true"
        >
          <StudioEnvironment />
          <ResponsiveCamera />
          <hemisphereLight args={["#ffffff", "#dbe6ea", 1.4]} />
          <directionalLight position={[-3, 5, 6]} intensity={2.2} />
          <IntelligenceCore mobile={env.mobile} still={env.still} onAnchors={onAnchors} />
          <Warmup onReady={ready} />
          <CoreFrames active={compiled && visible && !env.still} ready={compiled} />
        </Canvas>
      </SceneBoundary>
      <svg ref={svgRef} className="hx-lines" aria-hidden="true">
        {Object.keys(LABEL_ANCHORS).map((k) => (
          <g key={k}>
            <polyline data-line={k} />
            <circle data-end={k} r="3" />
          </g>
        ))}
      </svg>
    </div>
  );
}
