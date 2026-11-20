"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { addMotionDetail, preloadModel } from "./models";
import { SOLUTIONS } from "./data";

/**
 * Phase 2: the drone flies with the scroll from the end of the hero, across Section 02,
 * and arrives directly into Section 03 (Solutions journey: Aerial & Drone). A fixed, transparent, click-through canvas.
 * Its route is a list of keyframes in screen space (NDC) over the scroll range; the "alive" springs add banking,
 * hover and the reaction to the mouse on top.
 * The same flying drone remains visible throughout the aerial station.
 */
type K = [q: number, x: number, y: number, s: number];
const ROUTE: K[] = [
  // q (0..1 of the scroll range), x, y (screen, -1..1), size (small in section 2, grows big into section 3)
  [0.0, 0.5, 0.05, 1.2],
  [0.12, 0.5, 0.05, 1.3],
  [0.24, 0.3, -0.04, 1.35],
  [0.38, -0.25, -0.12, 1.4],
  [0.52, -0.28, -0.22, 1.45],
  [0.68, 0.28, -0.2, 1.55], // A shallow curve across the capability cards.
  [0.82, 0.4, -0.18, 1.8],
  [0.92, 0.4, -0.16, 2.35],
  [1.0, 0.38, -0.158, 3.05], // Fully arrived in Section 03 Station 01, full size 3.05!
];

const smooth = (t: number) => t * t * (3 - 2 * t);

function along(q: number, isWide: boolean, aspect: number) {
  // Matches exact station 01 apex coordinates across all screen aspect ratios
  const endX = isWide ? Math.min(0.44, Math.max(0.32, 0.674 / Math.max(aspect, 1))) : 0.0;
  const endY = isWide ? -0.158 : 0.32;
  const endS = isWide ? 3.05 : 2.2;
  const value = (point: K, axis: 1 | 2 | 3) => {
    if (axis === 3) return point[axis];
    const last = ROUTE[ROUTE.length - 1];
    const offset = axis === 1 ? endX - last[1] : endY - last[2];
    return point[axis] + offset * smooth(THREE.MathUtils.clamp((point[0] - .52) / .48, 0, 1));
  };
  for (let i = 0; i < ROUTE.length - 1; i++) {
    const a = ROUTE[i];
    const b = ROUTE[i + 1];
    if (q <= b[0]) {
      const span = b[0] - a[0];
      const u = (q - a[0]) / span;
      const k = smooth(u);
      // Match velocity across neighbouring waypoints so flight continues through each turn.
      const prev = ROUTE[Math.max(0, i - 1)];
      const next = ROUTE[Math.min(ROUTE.length - 1, i + 2)];
      function interpolate(axis: 1 | 2 | 3) {
        const start = value(a, axis), dest = value(b, axis);
        const startSlope = i === 0 ? 0 : (dest - value(prev, axis)) / (b[0] - prev[0]);
        const endSlope = i === ROUTE.length - 2 ? 0 : (value(next, axis) - start) / (next[0] - a[0]);
        return THREE.MathUtils.lerp(start, dest, k)
          + span * u * (1 - u) * ((1 - u) * startSlope - u * endSlope);
      }
      const routeSize = interpolate(3);
      // Fit the entire size curve to mobile, rather than shrinking only its final waypoint.
      const size = isWide ? routeSize : 1.05 + (routeSize - ROUTE[0][3])
        * (endS - 1.05) / (ROUTE[ROUTE.length - 1][3] - ROUTE[0][3]);
      return { x: interpolate(1), y: interpolate(2), s: size };
    }
  }
  return { x: endX, y: endY, s: endS };
}

export default function FlightScene() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const hero = document.querySelector<HTMLElement>(".hx-hero");
    const journey = document.querySelector<HTMLElement>(".journey");
    const coreStage = document.querySelector<HTMLElement>(".hx-stage") as (HTMLElement & { __technoDroneDock?: { x: number; y: number } }) | null;
    if (!hero || !journey) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
    } catch {
      return;
    }
    renderer.debug.checkShaderErrors = false;
    renderer.setPixelRatio(1);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    const scene = new THREE.Scene();
    scene.add(new THREE.HemisphereLight(0xffffff, 0xd9e4e7, 1.8));
    const key = new THREE.DirectionalLight(0xffffff, 2);
    key.position.set(-2, 4, 3);
    scene.add(key);
    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
    camera.position.set(0, 0, 10);

    const holder = new THREE.Group();
    holder.visible = false;
    scene.add(holder);
    const shadowCanvas = document.createElement("canvas");
    shadowCanvas.width = shadowCanvas.height = 64;
    const shadowContext = shadowCanvas.getContext("2d")!;
    const shadowGradient = shadowContext.createRadialGradient(32, 32, 2, 32, 32, 32);
    shadowGradient.addColorStop(0, "rgba(0,0,0,.65)");
    shadowGradient.addColorStop(1, "rgba(0,0,0,0)");
    shadowContext.fillStyle = shadowGradient;
    shadowContext.fillRect(0, 0, 64, 64);
    const shadowTexture = new THREE.CanvasTexture(shadowCanvas);
    const shadow = new THREE.Mesh(new THREE.PlaneGeometry(.9, .2), new THREE.MeshBasicMaterial({ map: shadowTexture, transparent: true, depthWrite: false }));
    scene.add(shadow);
    let modelReady = false;
    let spin: [THREE.Object3D, number][] = [];
    let wrapObj: THREE.Group | null = null;
    let restingBottom = .18;
    let flightWidth = 1.15;
    let disposed = false;
    preloadModel("drone").then(
      (gltf) => {
        if (disposed) return;
        const model = gltf.scene.clone(true);
        // Journey cleanup can dispose its meshes. The flight owns its GPU resources.
        model.traverse((o) => {
          const mesh = o as THREE.Mesh;
          if (!mesh.isMesh) return;
          mesh.geometry = mesh.geometry.clone();
          mesh.material = Array.isArray(mesh.material)
            ? mesh.material.map((material) => material.clone())
            : mesh.material.clone();
        });
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const c = box.getCenter(new THREE.Vector3());
        model.position.set(-c.x, -c.y, -c.z);
        spin = addMotionDetail("drone", model);
        model.traverse((o) => {
          const m = (o as THREE.Mesh).material as THREE.MeshStandardMaterial | undefined;
          if (m && m.map && (m as THREE.MeshStandardMaterial).isMeshStandardMaterial) {
            m.emissiveMap = m.map;
            m.emissive = new THREE.Color(0.25, 0.25, 0.25);
          }
        });
        const wrap = new THREE.Group();
        wrap.scale.setScalar(1 / size.x); // 1 unit wide
        wrap.add(model);
        wrap.rotation.set(0.12, -0.55, 0); // three-quarter view from slightly above, matches journey station angle
        const flightBounds = new THREE.Box3().setFromObject(wrap);
        restingBottom = Math.max(0, -flightBounds.min.y);
        flightWidth = Math.max(1, flightBounds.getSize(new THREE.Vector3()).x) * 1.12;
        wrapObj = wrap;
        holder.add(wrap);
        // Prepare the real mesh before painting; no placeholder swap or competing render.
        holder.visible = true;
        renderer.compileAsync(scene, camera).then(
          () => { if (!disposed) modelReady = true; },
          () => { if (!disposed) modelReady = true; },
        );
      },
      (err) => console.error("[redesign] flight drone failed to load", err),
    );

    // Take off only when the next section has replaced most of the hero viewport.
    let range = { a: 0, b: 1 };
    let heroTop = 0;
    let fallbackDock = { x: 0, y: 0 };
    const measure = () => {
      const docY = window.pageYOffset || document.documentElement.scrollTop || window.scrollY || 0;
      const h = hero.getBoundingClientRect();
      const j = journey.getBoundingClientRect();
      heroTop = h.top + docY;
      const stageRect = coreStage?.getBoundingClientRect();
      fallbackDock = stageRect
        ? { x: stageRect.left + stageRect.width * .5, y: stageRect.top + docY + stageRect.height * .85 }
        : { x: h.left + h.width * .75, y: heroTop + h.height * .85 };
      range = { a: heroTop + h.height - Math.min(h.height, innerHeight) * .35, b: j.top + docY };
      canvas.dataset.takeoffStart = String(range.a);
      journeyHeight = j.height;
    };
    let journeyHeight = journey.offsetHeight;
    const bodyRo = new ResizeObserver(measure);
    bodyRo.observe(document.body);
    measure();

    let W = 0;
    let H = 0;
    const resize = () => {
      W = window.innerWidth;
      H = window.innerHeight;
      renderer.setSize(W, H, false);
      camera.aspect = W / Math.max(H, 1);
      camera.updateProjectionMatrix();
      measure();
    };
    resize();
    window.addEventListener("resize", resize);

    const clock = new THREE.Clock();
    const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
    const onPointer = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" || !Number.isFinite(event.clientX) || !Number.isFinite(event.clientY)) return;
      pointer.tx = THREE.MathUtils.clamp(event.clientX / Math.max(W, 1) * 2 - 1, -1, 1);
      pointer.ty = THREE.MathUtils.clamp(1 - event.clientY / Math.max(H, 1) * 2, -1, 1);
    };
    const resetPointer = () => { pointer.tx = 0; pointer.ty = 0; };
    window.addEventListener("pointermove", onPointer, { passive: true });
    window.addEventListener("blur", resetPointer);
    const ndc = new THREE.Vector3();
    let raf = 0;
    let wasOn = false;
    let lastOpacity = "";
    let lastT = 0;
    let flightProgress: number | null = null;
    let parkedFrame = "";
    const phase = (value: string) => { if (canvas.dataset.flight !== value) canvas.dataset.flight = value; };
    const halfH = Math.tan((camera.fov * Math.PI) / 360) * camera.position.z;
    const frame = () => {
      raf = requestAnimationFrame(frame);
      if (document.hidden) return;
      if (!modelReady || document.documentElement.classList.contains("op-entering")) {
        if (lastOpacity !== "0") { renderer.clear(); canvas.style.opacity = lastOpacity = "0"; }
        phase("loading");
        return;
      }
      const lenis = (window as unknown as { lenis?: { scroll: number } }).lenis;
      const y = lenis?.scroll ?? window.scrollY;
      const routeProgress = THREE.MathUtils.clamp((y - range.a) / Math.max(range.b - range.a, 1), 0, 1);

      // Aerial station keeps the flying drone; the journey canvas never draws a second copy.
      const aerialProgress = Math.max(0, (y - range.b) / Math.max(journeyHeight - H, 1) * (W <= 760 ? 2 : SOLUTIONS.length));
      const targetProgress = routeProgress + aerialProgress;
      const on = y >= heroTop - H && aerialProgress < 1;
      if (!on) {
        if (wasOn) {
          renderer.clear();
          canvas.style.opacity = "0";
          lastOpacity = "0";
        }
        wasOn = false;
        flightProgress = null;
        parkedFrame = "";
        phase("hidden");
        return;
      }
      wasOn = true;
      const opacity = Math.min(1, Math.max(0, (1 - aerialProgress) / 0.12)).toFixed(3);
      if (opacity !== lastOpacity) canvas.style.opacity = lastOpacity = opacity;

      const t = clock.getElapsedTime();
      const dt = Math.min(0.05, Math.max(0, t - lastT));
      lastT = t;
      // Native touch scroll and large wheel steps can skip hundreds of pixels. Ease the
      // route progress in time, so the same path stays continuous at any refresh rate.
      flightProgress = flightProgress === null ? targetProgress
        : THREE.MathUtils.lerp(flightProgress, targetProgress, 1 - Math.exp(-10 * dt));
      if (Math.abs(flightProgress - targetProgress) < .0002) flightProgress = targetProgress;
      const q = Math.min(1, flightProgress);
      const flightLocal = Math.max(0, flightProgress - 1);
      phase(q === 0 ? "parked" : q < .12 ? "taking-off" : q < 1 ? "flying" : "arrived");
      const follow = 1 - Math.exp(-6 * dt);
      pointer.x += (pointer.tx - pointer.x) * follow;
      pointer.y += (pointer.ty - pointer.y) * follow;
      const isWide = W / Math.max(H, 1) > 1.1;
      const p = along(Math.max(0, Math.min(q, 1.0)), isWide, camera.aspect);
      const halfW = halfH * camera.aspect;
      const small = W < 760 ? 0.6 : 1;
      const sizeFactor = small * Math.min(1.35, Math.max(0.75, halfW * 0.35));
      const takeoff = smooth(THREE.MathUtils.clamp(q / .12, 0, 1));
      shadow.visible = false;

      // Park this same drone on the hero platform, then join the original flight route smoothly.
      if (q < .12) {
        const dock = coreStage?.__technoDroneDock ?? fallbackDock;
        const dockSize = isWide ? .8 : 1.05;
        const dockX = dock.x / Math.max(W, 1) * 2 - 1;
        const surfaceY = 1 - (dock.y - y) / Math.max(H, 1) * 2;
        const dockY = surfaceY + Math.max(0, restingBottom - .015) * dockSize * sizeFactor / halfH;
        p.x = THREE.MathUtils.lerp(dockX, p.x, takeoff);
        p.y = THREE.MathUtils.lerp(dockY, p.y, takeoff);
        p.s = THREE.MathUtils.lerp(dockSize, p.s, takeoff);
        shadow.visible = true;
        shadow.position.set(dockX * halfW, surfaceY * halfH, -.02);
        shadow.scale.setScalar(dockSize * sizeFactor);
        shadow.material.opacity = 1 - takeoff;
      }

      let px = p.x;
      let py = p.y;
      if (q >= 1) {
        // Continue the flight through the aerial station as the visitor scrolls.
        px += Math.sin(flightLocal * Math.PI * 2) * (isWide ? 0.10 : 0.045);
        py += Math.sin(flightLocal * Math.PI) * 0.12;
        const arrival = smooth(Math.min(1, flightLocal / 0.12));
        px += (Math.sin(t * 0.45) * 0.012 + pointer.x * 0.045) * arrival;
        py += (Math.sin(t * 0.9) * 0.015 + pointer.y * 0.035) * arrival;
      }

      holder.position.set(px * halfW, py * halfH, 0);
      // Leave room for the propellers and mouse banking inside the viewport.
      const viewportScale = 2 * halfW * (isWide ? .42 : .82) / flightWidth;
      holder.scale.setScalar(Math.min(p.s * sizeFactor, viewportScale));
      holder.visible = true;
      if (wrapObj) {
        const rotK = Math.max(0, Math.min(1, (q - 0.68) / 0.32));
        const rotX = 0.18 + (0.12 - 0.18) * rotK;
        const rotY = -0.52 + (-0.55 - -0.52) * rotK;
        const response = THREE.MathUtils.smoothstep(q, 0.8, 1);
        const bank = q >= 1 ? Math.sin(flightLocal * Math.PI * 2) : 0;
        wrapObj.rotation.set(THREE.MathUtils.lerp(.12, rotX, takeoff) - pointer.y * 0.14 * response, THREE.MathUtils.lerp(-.55, rotY, takeoff) + pointer.x * 0.28 * response + bank * 0.18, -pointer.x * 0.10 * response - bank * 0.08);
      }
      ndc.copy(holder.position).project(camera);
      spin.forEach(([o, sp]) => { o.visible = takeoff > 0; o.rotation.z += dt * sp * takeoff; });
      if (q === 0) {
        const signature = `${W},${H},${holder.position.x.toFixed(4)},${holder.position.y.toFixed(4)},${holder.scale.x.toFixed(4)}`;
        if (parkedFrame === signature) return;
        parkedFrame = signature;
      } else parkedFrame = "";
      renderer.render(scene, camera);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      disposed = true;
      bodyRo.disconnect();
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("blur", resetPointer);
      scene.traverse(object => {
        const mesh = object as THREE.Mesh;
        if (!mesh.isMesh) return;
        mesh.geometry.dispose();
        (Array.isArray(mesh.material) ? mesh.material : [mesh.material]).forEach(material => material.dispose());
      });
      shadowTexture.dispose();
      renderer.dispose();
    };
  }, []);

  return <canvas ref={ref} className="flight-gl" aria-hidden="true" />;
}
