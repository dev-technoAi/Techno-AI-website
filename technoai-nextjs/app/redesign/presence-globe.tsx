"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OFFICES } from "./data";

export function hubPosition(lat: number, lon: number, radius = 2) {
  const a = THREE.MathUtils.degToRad(lat);
  const b = THREE.MathUtils.degToRad(lon);
  return new THREE.Vector3(radius * Math.cos(a) * Math.cos(b), radius * Math.sin(a), -radius * Math.cos(a) * Math.sin(b));
}

export default function PresenceGlobe({ active = 0, onSelect }: { active?: number; onSelect?: (index: number) => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const labels = useRef<(HTMLButtonElement | null)[]>([]);
  const selected = useRef(active);
  const redraw = useRef<() => void>(() => {});
  useEffect(() => { selected.current = active; redraw.current(); }, [active]);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "low-power" }); }
    catch { canvas.parentElement?.setAttribute("data-unavailable", "true"); return; }
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, innerWidth < 760 ? 1 : 1.5));
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(30, 1, .1, 30);
    camera.position.set(0, 0, 9.1);
    camera.updateMatrixWorld();
    scene.add(new THREE.HemisphereLight(0xffffff, 0x146b8c, 2));
    const key = new THREE.DirectionalLight(0x9fe7e7, 2.2);
    key.position.set(-3, 4, 6);
    scene.add(key);
    const globe = new THREE.Group();
    scene.add(globe);
    const surface = new THREE.Mesh(new THREE.SphereGeometry(2, 64, 40), new THREE.MeshStandardMaterial({ color: 0x104054, roughness: .82, metalness: .15 }));
    globe.add(surface);
    const atmosphere = new THREE.Mesh(new THREE.SphereGeometry(2.035, 48, 32), new THREE.ShaderMaterial({
      transparent: true, depthWrite: false,
      uniforms: { tint: { value: new THREE.Color("#289fb7") } },
      vertexShader: "varying vec3 n; varying vec3 v; void main(){vec4 p=modelViewMatrix*vec4(position,1.); n=normalize(normalMatrix*normal); v=normalize(-p.xyz); gl_Position=projectionMatrix*p;}",
      fragmentShader: "uniform vec3 tint; varying vec3 n; varying vec3 v; void main(){float f=pow(1.-max(0.,dot(normalize(n),normalize(v))),3.); gl_FragColor=vec4(tint,f*.42);}",
    }));
    globe.add(atmosphere);
    let disposed = false;
    let texture: THREE.Texture | undefined;
    new THREE.TextureLoader().loadAsync("/redesign/globe/earth.webp").then(loaded => {
      if (disposed) { loaded.dispose(); return; }
      texture = loaded;
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = 2;
      surface.material.map = texture;
      surface.material.color.set(0xffffff);
      surface.material.emissive.set(0x16323c);
      surface.material.emissiveMap = texture;
      surface.material.emissiveIntensity = .6;
      surface.material.needsUpdate = true;
      redraw.current();
    }).catch(error => { if (!disposed) console.warn("[TechnoAI globe] Map texture could not load", error); });

    const markers = OFFICES.map(office => {
      const v = hubPosition(office.lat, office.lon, 2.025);
      const dot = new THREE.Mesh(new THREE.SphereGeometry(.035, 16, 12), new THREE.MeshBasicMaterial({ color: 0x9fe7e7 }));
      dot.position.copy(v);
      globe.add(dot);
      const halo = new THREE.Mesh(new THREE.RingGeometry(.065, .078, 48), new THREE.MeshBasicMaterial({ color: 0x9fe7e7, transparent: true, opacity: .7, side: THREE.DoubleSide, depthWrite: false }));
      halo.position.copy(v.clone().multiplyScalar(1.004));
      halo.lookAt(v.clone().multiplyScalar(2));
      globe.add(halo);
      return { v, dot, halo };
    });
    const arcs = [1, 2].map(i => {
      const a = markers[0].v;
      const b = markers[i].v;
      // Radial interpolation keeps every point above the Earth's surface.
      const points = Array.from({ length: 81 }, (_, n) => {
        const p = n / 80;
        return a.clone().lerp(b, p).normalize().multiplyScalar(2.03 + Math.sin(Math.PI * p) * .22);
      });
      const curve = new THREE.CatmullRomCurve3(points);
      const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), new THREE.LineBasicMaterial({ color: 0x289fb7, transparent: true, opacity: .8 }));
      const runner = new THREE.Mesh(new THREE.SphereGeometry(.022, 12, 8), new THREE.MeshBasicMaterial({ color: 0xc5ffff }));
      globe.add(line, runner);
      return { curve, runner };
    });
    const goal = new THREE.Quaternion();
    const euler = new THREE.Euler();
    const pointer = { x: 0, y: 0 };
    const screen = new THREE.Vector3();
    const world = new THREE.Vector3();
    const normal = new THREE.Vector3();
    const view = new THREE.Vector3();
    let width = 1, height = 1, raf = 0, visible = false, last = 0;
    const clock = new THREE.Clock();
    const frame = (time: number, dt: number, snap = false) => {
      const office = OFFICES[selected.current] ?? OFFICES[0];
      euler.set(THREE.MathUtils.degToRad(office.lat) + pointer.y * .025, -THREE.MathUtils.degToRad(office.lon + 90) + pointer.x * .045 + (still ? 0 : Math.sin(time * .16) * .035), 0);
      goal.setFromEuler(euler);
      globe.quaternion.slerp(goal, snap || still ? 1 : 1 - Math.exp(-4 * dt));
      globe.updateMatrixWorld(true);
      markers.forEach((m, i) => {
        const isActive = i === selected.current;
        m.dot.scale.setScalar(isActive ? 1.5 : 1);
        const pulse = still ? .3 : (time * .5) % 1;
        m.halo.scale.setScalar(isActive ? 1 + pulse * 1.4 : .8);
        m.halo.material.opacity = isActive ? (1 - pulse) * .75 : .28;
        world.copy(m.v).applyMatrix4(globe.matrixWorld);
        normal.copy(world).normalize();
        view.subVectors(camera.position, world).normalize();
        screen.copy(world).project(camera);
        const label = labels.current[i];
        if (label) {
          const front = normal.dot(view) > .1;
          label.style.visibility = front ? "visible" : "hidden";
          label.style.transform = `translate(${(screen.x * .5 + .5) * width}px,${(-screen.y * .5 + .5) * height}px)`;
        }
      });
      arcs.forEach((arc, i) => arc.runner.position.copy(arc.curve.getPoint((time * .14 + i * .45) % 1)));
      renderer.render(scene, camera);
    };
    redraw.current = () => { if (!disposed && (still || !visible)) frame(clock.getElapsedTime(), .016, true); };
    const resize = () => {
      width = canvas.clientWidth || 1; height = canvas.clientHeight || 1;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.position.z = camera.aspect < 1 ? 9.1 / camera.aspect : 9.1;
      camera.updateProjectionMatrix(); camera.updateMatrixWorld();
      frame(clock.getElapsedTime(), .016, true);
    };
    const ro = new ResizeObserver(resize); ro.observe(canvas); resize();
    const tick = (now: number) => {
      if (!visible || document.hidden || still || disposed) { raf = 0; return; }
      raf = requestAnimationFrame(tick);
      if (now - last < 1000 / 30) return;
      const dt = Math.min(.05, (now - last) / 1000); last = now;
      frame(clock.getElapsedTime(), dt);
    };
    const start = () => { if (visible && !document.hidden && !still && !raf) raf = requestAnimationFrame(tick); };
    const io = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; start(); }); io.observe(canvas);
    const move = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      const rect = canvas.getBoundingClientRect();
      pointer.x = THREE.MathUtils.clamp((event.clientX - rect.left) / rect.width * 2 - 1, -1, 1);
      pointer.y = THREE.MathUtils.clamp((event.clientY - rect.top) / rect.height * 2 - 1, -1, 1);
    };
    const leave = () => { pointer.x = pointer.y = 0; };
    canvas.addEventListener("pointermove", move); canvas.addEventListener("pointerleave", leave);
    document.addEventListener("visibilitychange", start);
    return () => {
      disposed = true; cancelAnimationFrame(raf); ro.disconnect(); io.disconnect();
      canvas.removeEventListener("pointermove", move); canvas.removeEventListener("pointerleave", leave);
      document.removeEventListener("visibilitychange", start); redraw.current = () => {};
      texture?.dispose();
      scene.traverse(object => { const mesh = object as THREE.Mesh; mesh.geometry?.dispose(); if (mesh.material) (Array.isArray(mesh.material) ? mesh.material : [mesh.material]).forEach(m => m.dispose()); });
      renderer.dispose();
    };
  }, []);

  return <div className="presence-globe-stage">
    <canvas ref={ref} className="globe-gl" aria-label="Globe connecting TechnoAI hubs in Abu Dhabi, Prague and Lahore" role="img" />
    <div className="presence-labels">{OFFICES.map((office, i) => <button type="button" key={office.city} ref={el => { labels.current[i] = el; }}
      className={active === i ? "is-active" : ""} onClick={() => onSelect?.(i)} aria-label={`Locate ${office.city}`} aria-pressed={active === i}>{office.city}</button>)}</div>
    <p className="presence-map-fallback">Abu Dhabi · Prague · Lahore</p>
  </div>;
}
