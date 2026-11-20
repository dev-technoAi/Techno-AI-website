"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { BLUE, INK, materials, modelFor, REAL_POSE, type Model } from "./models";
import { SOLUTIONS } from "./data";

/* ============================== shared helpers ============================== */

const reduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function createStage(canvas: HTMLCanvasElement, fov = 35, z = 8) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, window.innerWidth < 760 ? 1 : 1.5));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.debug.checkShaderErrors = false; // don't stall on every shader compile (≈1.4 s on the first load)
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(fov, 1, 0.1, 200);
  camera.position.set(0, 0.4, z);
  scene.add(new THREE.HemisphereLight(0xdfefff, INK, 1.1));
  const key = new THREE.DirectionalLight(0xffffff, 2.4);
  key.position.set(4, 6, 5);
  scene.add(key);
  const rimA = new THREE.PointLight(BLUE, 140, 40);
  rimA.position.set(-4, 2, -2);
  scene.add(rimA);
  const rimB = new THREE.PointLight(BLUE, 90, 40);
  rimB.position.set(4, -1.5, -3);
  scene.add(rimB);
  const resize = () => {
    const w = canvas.clientWidth || 1;
    const h = canvas.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  const dispose = () => {
    ro.disconnect();
    scene.traverse((o) => (o as THREE.Mesh).geometry?.dispose?.());
    renderer.dispose();
  };
  return { renderer, scene, camera, dispose };
}

/** Runs frame() every animation frame while `watch` is on screen. */
/** Like useEffect, but runs `init` only when the element is about a screen away (keeps page load light). */
function useNearEffect(ref: React.RefObject<HTMLElement | null>, init: () => void | (() => void)) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let cleanup: void | (() => void);
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        cleanup = init();
      },
      { rootMargin: "120% 0px" },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cleanup?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

function runWhileVisible(watch: Element, frame: (t: number, dt: number) => void) {
  const clock = new THREE.Clock();
  let raf = 0;
  let on = false;
  const tick = () => {
    const dt = Math.min(clock.getDelta(), 0.05);
    frame(clock.elapsedTime, dt);
    if (on) raf = requestAnimationFrame(tick);
  };
  let inView = false;
  const sync = () => {
    cancelAnimationFrame(raf);
    on = inView && !document.hidden;
    // Reset the delta after a hidden tab so springs do not jump on return.
    clock.getDelta();
    if (on) raf = requestAnimationFrame(tick);
  };
  const io = new IntersectionObserver(([e]) => {
    inView = e.isIntersecting;
    sync();
  });
  io.observe(watch);
  document.addEventListener("visibilitychange", sync);
  return () => {
    on = false;
    cancelAnimationFrame(raf);
    io.disconnect();
    document.removeEventListener("visibilitychange", sync);
  };
}

/** Page-space position of sections, measured only when the page size changes (no layout read per frame). */
const geoCache = new Map<Element, { top: number; h: number }>();
let geoObserver: ResizeObserver | null = null;
function sectionGeo(el: Element) {
  if (!geoObserver && typeof ResizeObserver !== "undefined") {
    geoObserver = new ResizeObserver(() => geoCache.clear());
    geoObserver.observe(document.body);
  }
  let g = geoCache.get(el);
  if (!g) {
    const r = el.getBoundingClientRect();
    g = { top: r.top + window.scrollY, h: r.height };
    geoCache.set(el, g);
  }
  return g;
}

/** 0..1 scroll progress of a tall (pinned) section. */
function sectionProgress(el: Element) {
  const g = sectionGeo(el);
  const lenis = (window as unknown as { lenis?: { scroll: number } }).lenis;
  const top = g.top - (lenis ? lenis.scroll : window.scrollY); // no layout read per frame
  const total = Math.max(g.h - window.innerHeight, 1);
  return Math.min(Math.max(-top / total, 0), 1);
}

const damp = (a: number, b: number, k: number) => a + (b - a) * k;

/* ============================== hero ============================== */

const DOT_VERT = /* glsl */ `
  uniform float uTime; uniform vec2 uMouse; uniform float uScan; uniform vec2 uScanAt;
  attribute float aRand;
  varying float vLight;
  void main() {
    vec3 p = position;
    float w = sin(p.x * .35 + uTime * .6) * .18 + sin(p.z * .45 + uTime * .45) * .14;
    float dm = distance(p.xz, uMouse);
    float lift = smoothstep(3.2, 0., dm) * .55;
    float ds = distance(p.xz, uScanAt);
    float ring = uScan * smoothstep(.9, 0., abs(ds - uScan * 9.)) ;
    p.y += w + lift + ring * .6;
    vLight = .32 + lift * 1.2 + ring * 1.6 + aRand * .2;
    vec4 mv = modelViewMatrix * vec4(p, 1.);
    gl_PointSize = (2.4 + lift * 3. + ring * 3.) * (30. / -mv.z);
    gl_Position = projectionMatrix * mv;
  }`;
const DOT_FRAG = /* glsl */ `
  uniform vec3 uColor; varying float vLight;
  void main() {
    vec2 c = gl_PointCoord - .5;
    if (length(c) > .5) discard;
    vec3 col = mix(uColor, vec3(1.), clamp(vLight - .55, 0., 1.));
    gl_FragColor = vec4(col, clamp(vLight, 0., 1.));
  }`;

/** Real-time hero: placeholder (or real) robot over a field of dots; press & hold to scan. */
export function HeroScene({ particlesOnly = false }: { particlesOnly?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [noGL, setNoGL] = useState(false);

  useEffect(() => {
    const canvas = ref.current;
    const host = canvas?.closest<HTMLElement>(".hero");
    if (!canvas || !host) return;
    let stage: ReturnType<typeof createStage>;
    try {
      stage = createStage(canvas, 35, 9);
    } catch {
      setNoGL(true);
      return;
    }
    const { scene, camera, renderer } = stage;
    const mobile = window.innerWidth < 760;

    // dot field
    const COLS = mobile ? 70 : 130;
    const ROWS = mobile ? 50 : 70;
    const pos = new Float32Array(COLS * ROWS * 3);
    const rnd = new Float32Array(COLS * ROWS);
    for (let i = 0; i < COLS; i++)
      for (let j = 0; j < ROWS; j++) {
        const k = i * ROWS + j;
        pos[k * 3] = (i - COLS / 2) * 0.32;
        pos[k * 3 + 1] = 0;
        pos[k * 3 + 2] = (j - ROWS * 0.8) * 0.32;
        rnd[k] = Math.random();
      }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("aRand", new THREE.BufferAttribute(rnd, 1));
    const uniforms = {
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2(99, 99) },
      uScan: { value: 0 },
      uScanAt: { value: new THREE.Vector2(0, 0) },
      uColor: { value: new THREE.Color(BLUE) },
    };
    const field = new THREE.Points(
      geo,
      new THREE.ShaderMaterial({ vertexShader: DOT_VERT, fragmentShader: DOT_FRAG, uniforms, transparent: true, depthWrite: false }),
    );
    field.position.y = -1.7;
    scene.add(field);

    // drone
    const M = materials();
    const robot: Model = modelFor("robot", M);
    robot.group.visible = !particlesOnly;
    scene.add(robot.group);
    const beamMat = new THREE.MeshBasicMaterial({ color: BLUE, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending });
    const beam = new THREE.Mesh(new THREE.ConeGeometry(1.4, 2.6, 48, 1, true), beamMat);
    beam.visible = !particlesOnly;
    scene.add(beam);

    // input
    const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
    const ray = new THREE.Raycaster();
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 1.7);
    const hit = new THREE.Vector3();
    let holding = false;
    let scan = 0;
    const onMove = (e: PointerEvent) => {
      const r = host.getBoundingClientRect();
      mouse.tx = ((e.clientX - r.left) / r.width) * 2 - 1;
      mouse.ty = ((e.clientY - r.top) / r.height) * 2 - 1;
      ray.setFromCamera(new THREE.Vector2(mouse.tx, -mouse.ty), camera);
      if (ray.ray.intersectPlane(plane, hit)) uniforms.uMouse.value.set(hit.x, hit.z);
    };
    const down = (e: PointerEvent) => {
      if ((e.target as HTMLElement).closest("a,button")) return;
      holding = true;
      host.classList.add("scanning");
    };
    const up = () => {
      holding = false;
      host.classList.remove("scanning");
    };
    host.addEventListener("pointermove", onMove);
    host.addEventListener("pointerdown", down);
    window.addEventListener("pointerup", up);
    host.addEventListener("pointerleave", () => uniforms.uMouse.value.set(99, 99));

    const frame = (t: number, dt: number) => {
      mouse.x = damp(mouse.x, mouse.tx, 0.05);
      mouse.y = damp(mouse.y, mouse.ty, 0.05);
      const wide = camera.aspect > 1.2;
      const p = Math.min(Math.max(window.scrollY / (host.clientHeight || 1), 0), 1);
      const intro = 1 - Math.pow(1 - Math.min(t / 2.4, 1), 3);

      uniforms.uTime.value = t;
      scan = holding ? Math.min(scan + dt * 0.55, 1) : Math.max(scan - dt * 1.4, 0);
      uniforms.uScan.value = holding ? (t * 0.45) % 1 : scan;

      const d = robot.group;
      robot.update(t);
      const bx = wide ? 2.3 : 0;
      const by = wide ? 0.5 : 1.5;
      d.scale.setScalar(wide ? 1.15 : 0.6);
      d.position.set(bx + (1 - intro) * 6 + mouse.x * 0.5, by + (1 - intro) * 2 + Math.sin(t * 1.3) * 0.12 + p * 2.4 - mouse.y * 0.25, -p * 2);
      d.rotation.set(0.18 + mouse.y * 0.18, -0.5 + mouse.x * 0.55 + Math.sin(t * 0.35) * 0.2, -mouse.x * 0.25 - (1 - intro) * 0.5);
      uniforms.uScanAt.value.set(d.position.x, d.position.z);

      beam.position.set(d.position.x, d.position.y - 1.55, d.position.z);
      beam.scale.set(1, 1, 1);
      beamMat.opacity = scan * 0.22;

      camera.position.set(mouse.x * 0.35, 0.5 - mouse.y * 0.2 + p * 0.8, 9);
      camera.lookAt(0, -0.5, 0);
      renderer.render(scene, camera);
    };
    let stop = () => {};
    if (reduced()) frame(3, 0);
    else stop = runWhileVisible(host, frame);

    return () => {
      stop();
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerdown", down);
      window.removeEventListener("pointerup", up);
      stage.dispose();
    };
  }, []);

  if (noGL) return null;
  return <canvas ref={ref} className="hero-gl" aria-hidden="true" />;
}

/* ============================== services journey ============================== */

/** Pinned 3D stage: scrolling moves through the six solutions, one model per station. */
/* ---------- journey scene effects (robot cleaning route + dust, drone flight route + roof scan) ---------- */

const FLOOR = -1.75;
const AQUA_C = new THREE.Color("#9fe7e7");
const BLUE_C = new THREE.Color("#146b8c");

type Fx = { group: THREE.Group; mats: [THREE.Material & { opacity: number }, number][] };
function fxMat<T extends THREE.Material & { opacity: number }>(fx: Fx, m: T) {
  m.transparent = true;
  m.depthWrite = false;
  fx.mats.push([m, m.opacity]);
  return m;
}
function fadeFx(fx: Fx, a: number) {
  fx.group.visible = a > 0.02;
  fx.mats.forEach(([m, o]) => (m.opacity = o * a));
}
function chevron() {
  const sh = new THREE.Shape();
  sh.moveTo(-0.09, -0.11);
  sh.lineTo(0.03, 0);
  sh.lineTo(-0.09, 0.11);
  sh.lineTo(-0.05, 0.11);
  sh.lineTo(0.07, 0);
  sh.lineTo(-0.05, -0.11);
  return new THREE.ShapeGeometry(sh);
}

function buildRobotFx() {
  const fx: Fx = { group: new THREE.Group(), mats: [] };
  // cleaning route on the floor (x, z relative to the robot's spot)
  const route = new THREE.CatmullRomCurve3(
    [[-6, 3.6], [-3.4, 2.7], [-1.4, 1.5], [0, 0.35], [1, -0.5], [2.5, -1.15], [3.7, -0.7], [4.3, 0.5]].map(([x, z]) => new THREE.Vector3(x, 0, z)),
  );
  const ROBOT_U = 0.4;
  const glow = new THREE.Mesh(new THREE.TubeGeometry(route, 220, 0.05, 6), fxMat(fx, new THREE.MeshBasicMaterial({ color: AQUA_C, opacity: 0.55, toneMapped: false })));
  const core = new THREE.Mesh(new THREE.TubeGeometry(route, 220, 0.014, 6), fxMat(fx, new THREE.MeshBasicMaterial({ color: BLUE_C, opacity: 0.9, toneMapped: false })));
  glow.scale.y = core.scale.y = 0.15; // flat on the floor
  fx.group.add(glow, core);
  const chevMat = fxMat(fx, new THREE.MeshBasicMaterial({ color: BLUE_C, opacity: 0.85, side: THREE.DoubleSide, toneMapped: false }));
  const chevGeo = chevron();
  const chevs = [0.18, 0.205, 0.72, 0.745].map((u) => {
    const m = new THREE.Mesh(chevGeo, chevMat);
    m.rotation.x = -Math.PI / 2;
    m.rotation.order = "YXZ";
    fx.group.add(m);
    return { m, u };
  });
  // dust kicked up by the brushes
  const N = 70;
  const pos = new Float32Array(N * 3);
  const col = new Float32Array(N * 4);
  const vel = new Float32Array(N * 3);
  const life = new Float32Array(N).map(() => Math.random());
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  dustGeo.setAttribute("color", new THREE.BufferAttribute(col, 4));
  const dustMat = fxMat(fx, new THREE.PointsMaterial({ size: 0.035, vertexColors: true, opacity: 1, sizeAttenuation: true }));
  const dust = new THREE.Points(dustGeo, dustMat);
  dust.frustumCulled = false;
  fx.group.add(dust);

  // A soft clean strip grows behind the C40 as it travels across the floor.
  const cleanStrip = new THREE.Mesh(
    new THREE.PlaneGeometry(1.85, 0.78),
    fxMat(fx, new THREE.MeshBasicMaterial({ color: AQUA_C, opacity: 0.18, side: THREE.DoubleSide, toneMapped: false })),
  );
  cleanStrip.rotation.x = -Math.PI / 2;
  fx.group.add(cleanStrip);

  const p0 = route.getPointAt(ROBOT_U);
  const tmp = new THREE.Vector3();
  const offsetAt = (progress: number) => {
    const eased = progress * progress * (3 - 2 * progress);
    route.getPointAt(ROBOT_U - 0.065 + eased * 0.13, tmp);
    return { x: tmp.x - p0.x, z: tmp.z - p0.z };
  };
  let lastT = 0;
  const update = (t: number, a: number, cx: number, robotPos: THREE.Vector3, progress: number) => {
    fadeFx(fx, Math.min(1, a));
    if (!fx.group.visible) return;
    fx.group.position.set(cx - p0.x, FLOOR + 0.004, -p0.z);
    cleanStrip.position.set(p0.x - 0.58 + progress * 0.56, 0.006, p0.z + 0.18);
    cleanStrip.scale.x = 0.08 + progress * 0.92;
    chevs.forEach(({ m, u }) => {
      const uu = (u + t * 0.012) % 1;
      route.getPointAt(uu, tmp);
      m.position.set(tmp.x, 0.003, tmp.z);
      const tan = route.getTangentAt(uu);
      m.rotation.y = Math.atan2(-tan.z, tan.x);
    });
    // dust: spawn at the two front brushes, drift out and settle
    const dt = Math.min(0.05, Math.max(0, t - lastT));
    lastT = t;
    const bx = robotPos.x - fx.group.position.x;
    const bz = robotPos.z - fx.group.position.z;
    for (let i = 0; i < N; i++) {
      life[i] += dt * 0.7;
      if (life[i] >= 1) {
        life[i] = 0;
        const side = i % 2 ? 1 : -1;
        pos[i * 3] = bx + side * (0.42 + Math.random() * 0.1);
        pos[i * 3 + 1] = 0.02;
        pos[i * 3 + 2] = bz + 0.35 + Math.random() * 0.1;
        vel[i * 3] = side * (0.25 + Math.random() * 0.4);
        vel[i * 3 + 1] = 0.12 + Math.random() * 0.2;
        vel[i * 3 + 2] = 0.2 + Math.random() * 0.4;
      }
      pos[i * 3] += vel[i * 3] * dt;
      pos[i * 3 + 1] = Math.max(0.01, pos[i * 3 + 1] + vel[i * 3 + 1] * dt);
      pos[i * 3 + 2] += vel[i * 3 + 2] * dt;
      vel[i * 3 + 1] -= dt * 0.6;
      const fade = Math.sin(life[i] * Math.PI);
      col[i * 4] = col[i * 4 + 1] = col[i * 4 + 2] = 0.42;
      col[i * 4 + 3] = fade * 0.75;
    }
    dustGeo.attributes.position.needsUpdate = true;
    dustGeo.attributes.color.needsUpdate = true;
  };
  return { group: fx.group, update, offsetAt };
}

export function JourneyScene() {
  const ref = useRef<HTMLCanvasElement>(null);

  useNearEffect(ref, () => {
    const canvas = ref.current;
    const section = canvas?.closest<HTMLElement>(".journey");
    if (!canvas || !section) return;
    let stage: ReturnType<typeof createStage>;
    try {
      stage = createStage(canvas, 32, 8.5);
    } catch {
      return;
    }
    const { scene, camera, renderer } = stage;
    const robotI = SOLUTIONS.findIndex((x) => x.slug === "robot");
    const droneI = SOLUTIONS.findIndex((x) => x.slug === "drone");
    const M = materials();
    const models = SOLUTIONS.slice(0, Math.max(robotI, droneI) + 1).map((s) => modelFor(s.slug, M));
    const holders = models.map((m) => {
      const h = new THREE.Group();
      h.add(m.group);
      scene.add(h);
      h.scale.setScalar(0.001);
      return h;
    });

    // Fit the mobile robot between its progress strip and copy, including short phones.
    const copy = section.querySelector<HTMLElement>(".stations");
    const clean = section.querySelector<HTMLElement>(".jx-clean");
    const phoneLayout = matchMedia("(max-width: 760px)");
    let robotArea = { top: 212, bottom: 500, height: 844, width: 390 };
    const measureRobotArea = () => {
      const height = canvas.clientHeight || innerHeight;
      const top = (clean ? clean.offsetTop + clean.offsetHeight : 196) + 14;
      const bottom = height - (copy?.offsetHeight || 230) - 64;
      robotArea = { top, bottom: Math.max(top + 60, bottom), height, width: canvas.clientWidth };
    };
    const robotLayout = new ResizeObserver(measureRobotArea);
    [canvas, copy, clean].forEach(el => { if (el) robotLayout.observe(el); });
    measureRobotArea();
    let robotBounds: { height: number; min: number; width: number; depth: number } | null = null;
    const robotRay = new THREE.Raycaster();
    const robotPoint = new THREE.Vector3();
    const robotNdc = new THREE.Vector2();
    const robotPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    const contactMaterial = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, side: THREE.DoubleSide,
      uniforms: { opacity: { value: .65 } },
      vertexShader: "varying vec2 uvShadow; void main(){uvShadow=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}",
      fragmentShader: "varying vec2 uvShadow; uniform float opacity; void main(){float d=length((uvShadow-.5)*2.);float a=1.-smoothstep(.12,1.,d);gl_FragColor=vec4(.015,.02,.02,a*a*opacity);}",
    });
    const contact = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), contactMaterial);
    contact.rotation.x = -Math.PI / 2;
    contact.visible = false;
    scene.add(contact);

    // floor rings
    const ringMat = (o: number) => new THREE.MeshBasicMaterial({ color: BLUE, transparent: true, opacity: o, side: THREE.DoubleSide });
    const rings = [1.9, 2.5, 3.3].map((r, i) => {
      const m = new THREE.Mesh(new THREE.RingGeometry(r, r + 0.012, 128), ringMat(0.55 - i * 0.15));
      m.rotation.x = -Math.PI / 2;
      m.position.y = -1.75;
      scene.add(m);
      return m;
    });
    const tick = new THREE.Mesh(new THREE.RingGeometry(3.3, 3.36, 128, 1, 0, Math.PI / 3), ringMat(0.9));
    tick.rotation.x = -Math.PI / 2;
    tick.position.y = -1.74;
    scene.add(tick);
    const ringMats = [...rings.map((r) => r.material as THREE.MeshBasicMaterial), tick.material as THREE.MeshBasicMaterial];
    const ringBase = ringMats.map((m) => m.opacity);

    // scene effects for the real robot (cleaning route + dust) and drone (flight route + scan of the roof)
    const robotFx = buildRobotFx();
    scene.add(robotFx.group);
    const cleanEl = section.querySelector<HTMLElement>('[data-jx="clean"]');
    const routeEl = section.querySelector<HTMLElement>('[data-jx="route"]');
    const stepsEl = section.querySelector<HTMLElement>(".jx-steps");
    let lastClean = "";
    let lastRoute = "";
    let ringFade = 1;
    // compile the stage's shaders in the background now (scene starts ~2 screens early), not on the first visible frame
    renderer.compileAsync(scene, camera).catch(() => {});

    const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
    const onMove = (e: PointerEvent) => {
      if (!Number.isFinite(e.clientX) || !Number.isFinite(e.clientY)) return;
      mouse.tx = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.ty = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    const _ndc = new THREE.Vector3();
    let shown = -1;
    let lastSp = "";
    let lastJp = "";
    const frame = (t: number) => {
      const n = phoneLayout.matches ? 2 : SOLUTIONS.length;
      const p = sectionProgress(section);
      const f = Math.min(p * n, n - 0.001);
      const idx = Math.floor(f);
      const local = f - idx; // 0..1 inside a station
      if (idx !== shown) {
        shown = idx;
        // JourneyFilms owns station selection, including boundary hysteresis.
      }
      const sp = local.toFixed(3);
      const jp = p.toFixed(3);
      if (sp !== lastSp) section.style.setProperty("--sp", (lastSp = sp)); // write only on change (no layout thrash)
      if (jp !== lastJp) section.style.setProperty("--jp", (lastJp = jp));
      if (idx !== robotI && idx !== droneI) {
        canvas.hidden = true;
        return;
      }
      canvas.hidden = false;
      contact.visible = idx === robotI && !!models[robotI].real;

      mouse.x = damp(mouse.x, mouse.tx, 0.05);
      mouse.y = damp(mouse.y, mouse.ty, 0.05);
      const wide = camera.aspect > 1.1;
      const sectionTop = sectionGeo(section).top - window.scrollY;
      const arrived = sectionTop <= 20;
      const arrivedValue = arrived ? "true" : "false";
      if (section.dataset.arrived !== arrivedValue) section.dataset.arrived = arrivedValue;

      holders.forEach((h, i) => {
        const showcase = i !== robotI && i !== droneI;
        if (showcase && i !== idx) {
          h.visible = false;
          return;
        }
        // The drone flying in from Section 2 is the sole 3D drone in this station.
        const target = i === idx && i !== droneI ? 1 : 0;
        // real products on a scene photo sit a little smaller on desktop so they clear the rail and the card
        let k = wide
          ? (models[i].real && i === robotI ? 0.78 : 1)
          : (i === droneI ? 0.42 : i === robotI ? 0.52 : 0.62);
        if (!wide && phoneLayout.matches && i === robotI && models[i].real) {
          if (!robotBounds) {
            h.updateMatrixWorld(true);
            const box = new THREE.Box3().setFromObject(models[i].group);
            box.applyMatrix4(new THREE.Matrix4().copy(h.matrixWorld).invert());
            robotBounds = { height: box.max.y - box.min.y, min: box.min.y, width: box.max.x - box.min.x, depth: box.max.z - box.min.z };
          }
          const viewHeight = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z;
          k = Math.max(.32, Math.min(k, (robotArea.bottom - robotArea.top) * .82 / robotArea.height * viewHeight / Math.max(robotBounds.height, .1)));
        }
        const s = showcase || i === droneI ? target : damp(h.scale.x / k, target, i === idx ? 0.12 : 0.28);
        h.scale.setScalar(s < 0.03 ? 0.001 : Math.max(s * k, 0.001));
        h.visible = s > 0.03;
        if (!h.visible) return;
        // where the model is on screen (NDC), so the "alive" motion reacts to the mouse relative to it
        _ndc.setFromMatrixPosition(h.matrixWorld).project(camera);
        models[i].screen = { x: _ndc.x, y: _ndc.y + 0.15 };
        models[i].cam = camera.position;
        models[i].update(t);
        const pose = models[i].real ? REAL_POSE[SOLUTIONS[i].slug] : undefined;
        const floorY = pose === "ground" && wide ? -1.75 - (models[i].base ?? 0) * h.scale.x : null; // stand on the rings
        h.position.set(wide ? 1.7 : 0, floorY ?? (wide ? 0 : pose === "ground" ? 0.8 : 1.25) + (pose === "ground" ? 0 : Math.sin(t * 1.1) * (pose ? 0.05 : 0.08)), 0);
        if (!wide && phoneLayout.matches && i === robotI && robotBounds) {
          camera.updateMatrixWorld();
          // Anchor the wheels to the floor, rather than centring the body in the free space.
          robotRay.setFromCamera(robotNdc.set(0, 1 - robotArea.bottom / robotArea.height * 2), camera);
          if (robotRay.ray.intersectPlane(robotPlane, robotPoint)) {
            h.position.y = robotPoint.y - (models[i].base ?? robotBounds.min) * h.scale.y;
          }
        }
        if (showcase && models[i].real) {
          h.position.set(wide ? 1.8 : 0, wide ? 0 : .85, 0);
        }
        if (models[i].real && wide && i === robotI) {
          // drive slowly along the cleaning route (face stays to the camera)
          const off = robotFx.offsetAt(local);
          h.position.x += off.x;
          h.position.z += off.z;
        }
        if (i === droneI) {
          // 3D inspection flight motion across the rooftop
          const arcX = Math.sin(local * Math.PI * 2) * 0.42;
          const arcY = Math.sin(local * Math.PI) * 0.18 - Math.sin(local * Math.PI * 2) * 0.06;
          const arcZ = Math.cos(local * Math.PI * 2) * 0.28 - 0.28;
          h.position.x += arcX;
          h.position.y += arcY;
          h.position.z += arcZ;
          // Bank smoothly into flight turns
          h.rotation.y = -0.55 + Math.sin(local * Math.PI * 2) * 0.32 + mouse.x * 0.2;
          h.rotation.x = 0.10 + Math.cos(local * Math.PI * 2) * 0.08 + mouse.y * 0.06;
          h.rotation.z = -Math.cos(local * Math.PI * 2) * 0.16;
        } else if (pose) {
          // real products: small turn only, so the robot face / drone camera stay in view
          h.rotation.y = -0.55 + local * 0.7 + mouse.x * 0.25 + (1 - s) * 0.8;
          if (showcase) {
            const slug = SOLUTIONS[i].slug;
            // The imported kiosk and solar arrays have their presentation face along X.
            if (slug === "financial" || slug === "satellite") h.rotation.y -= Math.PI / 2;
            if (slug === "industry") h.rotation.y += .85;
          }
          h.rotation.x = !wide && i === robotI ? 0 : (pose === "ground" ? 0.04 : 0.1) + mouse.y * 0.06;
        } else {
          h.rotation.y = local * Math.PI * 0.9 - 0.45 + mouse.x * 0.4 + (1 - s) * 1.6;
          h.rotation.x = 0.12 + mouse.y * 0.15;
        }
      });
      if (contact.visible) {
        const robot = holders[robotI];
        contact.position.set(robot.position.x, robot.position.y + (models[robotI].base ?? robotBounds?.min ?? -1) * robot.scale.y - .008, robot.position.z);
        contact.scale.set((robotBounds?.width ?? 2.6) * robot.scale.x * 1.3, (robotBounds?.depth ?? 2.2) * robot.scale.z * 1.45, 1);
        contactMaterial.uniforms.opacity.value = Math.min(.65, robot.scale.x * 1.4);
      }
      const realHere = (idx === robotI || idx === droneI) && models[idx].real;
      ringFade = damp(ringFade, realHere ? 0 : 1, 0.12);
      ringMats.forEach((m, i) => (m.opacity = ringBase[i] * ringFade));
      const cx = wide ? 1.7 : 0;
      robotFx.update(t, wide && models[robotI].real && idx === robotI ? holders[robotI].scale.x : 0, cx, holders[robotI].position, idx === robotI ? local : 0);
      if (idx === robotI) {
        const c = Math.round(local * 100) + "%";
        if (c !== lastClean && cleanEl) cleanEl.textContent = lastClean = c;
      }
      if (idx === droneI) {
        const r = String(Math.min(4, 1 + Math.floor(local * 4)));
        if (r !== lastRoute) {
          lastRoute = r;
          if (routeEl) routeEl.textContent = "0" + r;
          if (stepsEl) stepsEl.dataset.step = r;
        }
      }
      rings.forEach((r, i) => {
        r.position.x = wide ? 1.7 : 0;
        r.rotation.z = t * (0.1 + i * 0.05) * (i % 2 ? -1 : 1);
      });
      tick.position.x = wide ? 1.7 : 0;
      tick.rotation.z = -p * Math.PI * 2;
      camera.position.set(mouse.x * 0.3, 0.6 - mouse.y * 0.2, 8.5);
      camera.lookAt(wide ? 0.6 : 0, 0, 0);
      renderer.render(scene, camera);
    };
    let stop = () => {};
    if (reduced()) {
      section.dataset.active = "0";
      frame(2);
    } else stop = runWhileVisible(section, frame);
    return () => {
      stop();
      window.removeEventListener("pointermove", onMove);
      robotLayout.disconnect();
      contactMaterial.dispose();
      stage.dispose();
    };
  });

  return <canvas ref={ref} className="journey-gl" aria-hidden="true" />;
}

/* ============================== globe ============================== */

export { default as GlobeScene } from "./presence-globe";

/* ============================== drone film (closer look) ============================== */

/** Draws the drone film frames on a canvas; frame follows scroll through `.closer`. Phones loop the video. */
export function DroneFilm({ count, dir, poster, video }: { count: number; dir: string; poster: string; video: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<"still" | "loop" | "scrub">("still");

  // Keep the film dormant until the section approaches the viewport.
  useEffect(() => {
    if (reduced()) return;
    const section = document.querySelector(".closer");
    const go = () => setMode(window.innerWidth < 760 ? "loop" : "scrub");
    if (!section) return go();
    const io = new IntersectionObserver(([e]) => e.isIntersecting && (go(), io.disconnect()), { rootMargin: "500px 0px" });
    io.observe(section);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (mode !== "scrub") return;
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    const section = canvas?.closest<HTMLElement>(".closer");
    if (!canvas || !ctx || !section) return;
    const frames: (HTMLImageElement | null)[] = new Array(count).fill(null);
    const requested = new Set<number>();
    let active = true;
    let sized = false;
    let drawn = -1;
    const loadFrame = (i: number) => {
      if (i < 0 || i >= count || requested.has(i)) return;
      requested.add(i);
      const img = new Image();
      img.decoding = "async";
      img.onload = () => {
        if (!active) return;
        frames[i] = img;
        if (!sized) {
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          drawn = -1;
          sized = true;
        }
      };
      img.src = `${dir}/f${String(i + 1).padStart(3, "0")}.jpg`;
    };
    loadFrame(0);
    let cur = 0;
    const stop = runWhileVisible(section, () => {
      const target = sectionProgress(section) * (count - 1);
      cur = damp(cur, target, 0.15);
      let i = Math.round(cur);
      loadFrame(i);
      loadFrame(i + 1);
      loadFrame(i - 1);
      while (i > 0 && !frames[i]) i--;
      if (frames[i] && i !== drawn) {
        ctx.drawImage(frames[i]!, 0, 0, canvas.width, canvas.height);
        drawn = i;
        canvas.classList.add("ready");
      }
    });
    return () => { active = false; stop(); };
  }, [mode, count, dir]);

  return (
    <>
      {mode === "loop" ? (
        <video className="film" src={video} poster={poster} autoPlay muted loop playsInline />
      ) : (
        <img className="film" src={poster} alt="" />
      )}
      {mode === "scrub" && <canvas ref={ref} className="film film-frames" aria-hidden="true" />}
    </>
  );
}
