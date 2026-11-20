import {
  AdditiveBlending, BufferAttribute, BufferGeometry, Color, Group, Line, LineBasicMaterial, Mesh,
  MeshBasicMaterial, PerspectiveCamera, Points, QuadraticBezierCurve3, RingGeometry, Scene,
  ShaderMaterial, SphereGeometry, TubeGeometry, Vector3, WebGLRenderer, BackSide,
} from "three";
import type { SceneApi, SceneOptions } from "./host";

/**
 * "Our Global Ecosystem": a dot-matrix globe in the brand blue. The three TechnoAi offices
 * (Abu Dhabi HQ, Prague and Lahore innovation hubs) pulse on it, data arcs run from the HQ to the
 * hubs, and two satellites orbit — the connectivity / satellite story in one quiet object.
 * Drag to turn it; hovering an office in the list turns the globe to that city.
 * DOM labels (.gl-tag[data-i]) inside the section are positioned on the markers every frame.
 */

const BLUE = new Color("#146b8c");
const AQUA = new Color("#6fc3dc"); // lighter tint of the same blue, only for the brightest points
const R = 1;

// lat, lon (degrees) — same order as the office list in page.tsx
const OFFICES: [number, number][] = [
  [24.45, 54.38], // Abu Dhabi
  [50.08, 14.44], // Prague
  [31.55, 74.34], // Lahore
];

const rad = (d: number) => (d * Math.PI) / 180;
const onSphere = (lat: number, lon: number, r = R) =>
  new Vector3(r * Math.cos(rad(lat)) * Math.sin(rad(lon)), r * Math.sin(rad(lat)), r * Math.cos(rad(lat)) * Math.cos(rad(lon)));

export function create(canvas: HTMLCanvasElement, { root, reduce, fine }: SceneOptions): SceneApi {
  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "default" });
  renderer.setClearColor(0x000000, 0);

  const scene = new Scene();
  const camera = new PerspectiveCamera(28, 1, 0.1, 50);
  camera.position.set(0, 0, 6.4);

  const world = new Group(); // tilt + pointer parallax
  const globe = new Group(); // spins
  world.add(globe);
  scene.add(world);
  world.rotation.x = 0.32;

  const disposables: { dispose(): void }[] = [];
  const keep = <T extends { dispose(): void }>(x: T) => (disposables.push(x), x);

  // ---- occluder: hides the far side so the dot matrix reads as a solid planet
  const core = new Mesh(keep(new SphereGeometry(R * 0.985, 64, 48)), keep(new MeshBasicMaterial({ color: 0x030505 })));
  globe.add(core);

  // ---- dot matrix: latitude rows, evenly spaced along each row
  const pos: number[] = [];
  const rnd: number[] = [];
  for (let lat = -84; lat <= 84; lat += 2.2) {
    const n = Math.max(6, Math.round(Math.cos(rad(lat)) * 165));
    const off = (lat * 7.3) % 1; // break up the vertical alignment
    for (let i = 0; i < n; i++) {
      const p = onSphere(lat, ((i + off) / n) * 360 - 180);
      pos.push(p.x, p.y, p.z);
      rnd.push(Math.random());
    }
  }
  const dotsGeo = keep(new BufferGeometry());
  dotsGeo.setAttribute("position", new BufferAttribute(new Float32Array(pos), 3));
  dotsGeo.setAttribute("aRand", new BufferAttribute(new Float32Array(rnd), 1));

  const uniforms = {
    uTime: { value: 0 },
    uPx: { value: 1 },
    uBlue: { value: BLUE },
    uAqua: { value: AQUA },
    uFocus: { value: onSphere(OFFICES[0][0], OFFICES[0][1]) },
  };
  const dotsMat = keep(new ShaderMaterial({
    uniforms,
    transparent: true,
    depthWrite: false,
    vertexShader: /* glsl */ `
      uniform float uTime; uniform float uPx; uniform vec3 uFocus;
      attribute float aRand;
      varying float vLight; varying float vFace;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vec3 n = normalize(normalMatrix * position);
        vFace = n.z;
        // a slow scan band travelling over the latitudes + a halo around the focused office
        float band = (1.0 - smoothstep(0.0, 0.10, abs(position.y - sin(uTime * 0.18) * 0.95)));
        float halo = (1.0 - smoothstep(0.0, 0.55, distance(position, uFocus)));
        float tw = 0.5 + 0.5 * sin(uTime * (0.6 + aRand) + aRand * 40.0);
        vLight = clamp(0.5 + band * 0.5 + halo * 0.7 + tw * 0.15, 0.0, 1.5);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = uPx * (2.3 + halo * 1.6) * (6.0 / -mv.z);
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uBlue; uniform vec3 uAqua;
      varying float vLight; varying float vFace;
      void main() {
        vec2 c = gl_PointCoord - 0.5;
        if (dot(c, c) > 0.25) discard;
        float rim = smoothstep(0.0, 0.3, vFace) * (0.55 + 0.45 * vFace);
        vec3 col = mix(uBlue, uAqua, clamp(vLight - 0.35, 0.0, 1.0));
        gl_FragColor = vec4(col, rim * vLight);
      }`,
  }));
  globe.add(new Points(dotsGeo, dotsMat));

  // ---- atmosphere rim (back faces of a slightly larger sphere, fresnel)
  const atmo = new Mesh(
    keep(new SphereGeometry(R * 1.12, 64, 48)),
    keep(new ShaderMaterial({
      uniforms: { uBlue: { value: BLUE } },
      side: BackSide,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      vertexShader: `varying vec3 vN; void main(){ vN = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
      fragmentShader: `uniform vec3 uBlue; varying vec3 vN; void main(){ float f = 1.0 - smoothstep(-0.5, 0.0, vN.z); gl_FragColor = vec4(uBlue, f * f * 0.5); }`,
    })),
  );
  world.add(atmo);

  // ---- offices: bright core + expanding ring, oriented to the surface
  const officePts = OFFICES.map(([la, lo]) => onSphere(la, lo, R * 1.003));
  const rings: Mesh[] = [];
  const ringGeo = keep(new RingGeometry(0.035, 0.042, 48));
  const dotGeo = keep(new SphereGeometry(0.014, 16, 12));
  officePts.forEach((p, i) => {
    const dot = new Mesh(dotGeo, keep(new MeshBasicMaterial({ color: i === 0 ? 0xffffff : AQUA })));
    dot.position.copy(p);
    globe.add(dot);
    for (let k = 0; k < 2; k++) {
      const ring = new Mesh(ringGeo, keep(new MeshBasicMaterial({ color: AQUA, transparent: true, depthWrite: false, blending: AdditiveBlending })));
      ring.position.copy(p);
      ring.lookAt(p.clone().multiplyScalar(2));
      ring.userData = { phase: k * 0.5 + i * 0.21 };
      globe.add(ring);
      rings.push(ring);
    }
  });

  // ---- arcs HQ -> hubs (+ hub -> hub), a pulse travels along each one
  const arcMats: ShaderMaterial[] = [];
  const arc = (a: Vector3, b: Vector3, delay: number) => {
    const mid = a.clone().add(b).multiplyScalar(0.5);
    const lift = 1 + a.distanceTo(b) * 0.42;
    const curve = new QuadraticBezierCurve3(a, mid.normalize().multiplyScalar(R * lift), b);
    const mat = keep(new ShaderMaterial({
      uniforms: { uTime: uniforms.uTime, uDelay: { value: delay }, uBlue: { value: BLUE }, uAqua: { value: AQUA } },
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      vertexShader: `varying float vU; void main(){ vU = uv.x; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
      fragmentShader: `
        uniform float uTime; uniform float uDelay; uniform vec3 uBlue; uniform vec3 uAqua; varying float vU;
        void main(){
          float head = fract(uTime * 0.22 + uDelay);
          float d = head - vU;
          float pulse = (1.0 - smoothstep(0.0, 0.22, d)) * step(0.0, d);
          float ends = smoothstep(0.0, 0.06, vU) * (1.0 - smoothstep(0.94, 1.0, vU));
          gl_FragColor = vec4(mix(uBlue, uAqua, pulse), (0.45 + pulse * 1.0) * ends);
        }`,
    }));
    arcMats.push(mat);
    globe.add(new Mesh(keep(new TubeGeometry(curve, 64, 0.005, 6, false)), mat));
  };
  arc(officePts[0], officePts[1], 0);
  arc(officePts[0], officePts[2], 0.37);
  arc(officePts[1], officePts[2], 0.71);

  // ---- two orbits with a satellite each
  const orbits: { sat: Mesh; r: number; speed: number; tilt: Group }[] = [];
  const orbit = (r: number, tiltX: number, tiltZ: number, speed: number) => {
    const tilt = new Group();
    tilt.rotation.set(tiltX, 0, tiltZ);
    const pts: number[] = [];
    for (let i = 0; i <= 160; i++) {
      const a = (i / 160) * Math.PI * 2;
      pts.push(Math.cos(a) * r, 0, Math.sin(a) * r);
    }
    const g = keep(new BufferGeometry());
    g.setAttribute("position", new BufferAttribute(new Float32Array(pts), 3));
    tilt.add(new Line(g, keep(new LineBasicMaterial({ color: BLUE, transparent: true, opacity: 0.38 }))));
    const sat = new Mesh(keep(new SphereGeometry(0.016, 12, 10)), keep(new MeshBasicMaterial({ color: 0xffffff })));
    tilt.add(sat);
    world.add(tilt);
    orbits.push({ sat, r, speed, tilt });
  };
  orbit(1.38, 1.15, 0.35, 0.22);
  orbit(1.62, -0.55, -0.6, -0.14);

  // ---- interaction
  // face Abu Dhabi first (the HQ), a little west so the hubs are in view
  let rotY = -rad(48);
  let velocity = 0;
  let target: number | null = null;
  let holdUntil = 0;
  let px = 0, py = 0, sx = 0, sy = 0;
  let dragging = false, lastX = 0;
  let now = 0;

  const tags = Array.from(root.querySelectorAll<HTMLElement>(".gl-tag[data-i]"));
  const items = Array.from(root.querySelectorAll<HTMLElement>("[data-office]"));
  const focusOffice = (i: number) => {
    const [, lon] = OFFICES[i];
    // shortest turn to bring that longitude to the front
    let goal = -rad(lon);
    while (goal - rotY > Math.PI) goal -= Math.PI * 2;
    while (goal - rotY < -Math.PI) goal += Math.PI * 2;
    target = goal;
    holdUntil = now + 5;
    uniforms.uFocus.value = onSphere(OFFICES[i][0], OFFICES[i][1]);
    root.dataset.office = String(i);
  };
  root.dataset.office = "0";
  const onItem = (e: Event) => focusOffice(Number((e.currentTarget as HTMLElement).dataset.office));
  items.forEach((el) => { el.addEventListener("pointerenter", onItem); el.addEventListener("focusin", onItem); });

  const onDown = (e: PointerEvent) => { dragging = true; lastX = e.clientX; target = null; canvas.setPointerCapture(e.pointerId); };
  const onMove = (e: PointerEvent) => {
    if (!dragging) return;
    const d = (e.clientX - lastX) * 0.006;
    lastX = e.clientX;
    rotY += d;
    velocity = d * 60;
    holdUntil = now + 3;
  };
  const onUp = () => { dragging = false; };
  if (!reduce) {
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointercancel", onUp);
    if (fine) canvas.style.cursor = "grab";
  }

  const v = new Vector3();
  let width = 1, height = 1;

  return {
    resize(w, h, dpr) {
      width = w; height = h;
      renderer.setPixelRatio(dpr);
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      // keep the whole globe + orbits in frame on tall/narrow screens
      camera.position.z = w / h < 1 ? 6.4 / Math.max(w / h, 0.62) : 6.4;
      camera.updateProjectionMatrix();
      uniforms.uPx.value = dpr * Math.min(1.25, Math.max(0.8, h / 700));
    },
    pointer(x, y) { px = x; py = y; },
    frame(t, dt) {
      now = t;
      uniforms.uTime.value = t;
      // scroll progress of the section turns the globe a little as it passes
      const p = parseFloat(root.style.getPropertyValue("--p")) || 0;

      if (target !== null) {
        rotY += (target - rotY) * Math.min(1, dt * 3);
        if (Math.abs(target - rotY) < 0.002) target = null;
      } else if (!dragging) {
        rotY += velocity * dt;
        velocity *= Math.pow(0.04, dt);
        if (t > holdUntil) rotY += dt * 0.05;
      }
      globe.rotation.y = rotY + p * 0.6;

      sx += (px - sx) * Math.min(1, dt * 2.5);
      sy += (py - sy) * Math.min(1, dt * 2.5);
      world.rotation.x = 0.32 + sy * 0.08;
      world.rotation.z = -sx * 0.04;
      camera.position.x = sx * 0.12;
      camera.lookAt(0, 0, 0);

      for (const ring of rings) {
        const k = (t * 0.5 + ring.userData.phase) % 1;
        ring.scale.setScalar(0.6 + k * 2.4);
        (ring.material as MeshBasicMaterial).opacity = (1 - k) * 0.85;
      }
      for (const o of orbits) {
        const a = t * o.speed + o.r;
        o.sat.position.set(Math.cos(a) * o.r, 0, Math.sin(a) * o.r);
      }

      renderer.render(scene, camera);

      // DOM labels follow their markers; hidden when on the far side
      globe.updateMatrixWorld();
      tags.forEach((tag) => {
        const i = Number(tag.dataset.i);
        v.copy(officePts[i]).applyMatrix4(globe.matrixWorld);
        const facing = v.clone().sub(camera.position).normalize().dot(v.clone().normalize()) < -0.15;
        v.project(camera);
        const x = (v.x * 0.5 + 0.5) * width;
        const y = (-v.y * 0.5 + 0.5) * height;
        tag.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
        tag.style.opacity = facing ? "1" : "0";
      });
    },
    dispose() {
      items.forEach((el) => { el.removeEventListener("pointerenter", onItem); el.removeEventListener("focusin", onItem); });
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onUp);
      disposables.forEach((d) => d.dispose());
      arcMats.length = 0;
      renderer.dispose();
    },
  };
}
