"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { makeAlive, type Alive } from "./alive";

/**
 * The real KLEENBOT C40 model for the pinned spotlight section. Its turn and position follow the section's
 * scroll progress (read from the section's --p, set by fx.tsx Motion). Renders only when that progress or
 * the size changes, never in an idle loop.
 */
export default function SpotlightScene() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const section = canvas?.closest<HTMLElement>(".sl");
    if (!canvas || !section) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
    } catch {
      return;
    }
    renderer.debug.checkShaderErrors = false;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    const scene = new THREE.Scene();
    // plain lights only: an environment map (PMREM) blocked the page ~2 s when the section came near
    scene.add(new THREE.HemisphereLight(0xffffff, 0xd9e4e7, 1.7));
    const key = new THREE.DirectionalLight(0xffffff, 2.2);
    key.position.set(-3, 5, 4);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0x9fe7e7, 1.4);
    rim.position.set(4, 2, -3);
    scene.add(rim);
    const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 100);

    const holder = new THREE.Group();
    scene.add(holder);
    // soft round shadow under the robot
    const shadowTex = (() => {
      const c = document.createElement("canvas");
      c.width = c.height = 128;
      const g = c.getContext("2d")!;
      const grd = g.createRadialGradient(64, 64, 4, 64, 64, 62);
      grd.addColorStop(0, "rgba(15,26,27,0.35)");
      grd.addColorStop(1, "rgba(15,26,27,0)");
      g.fillStyle = grd;
      g.fillRect(0, 0, 128, 128);
      return new THREE.CanvasTexture(c);
    })();
    const shadow = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.4), new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false }));
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.002;
    holder.add(shadow);

    let model: THREE.Object3D | null = null;
    let alive: Alive | null = null;
    const draco = new DRACOLoader().setDecoderPath("/redesign/draco/");
    const loader = new GLTFLoader().setDRACOLoader(draco);
    loader.load(
      "/redesign/models/robot.glb",
      (gltf) => {
        model = gltf.scene;
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const k = 1 / size.y; // 1 unit tall, standing on y = 0
        model.scale.setScalar(k);
        model.position.set(-box.getCenter(new THREE.Vector3()).x * k, -box.min.y * k, -box.getCenter(new THREE.Vector3()).z * k);
        model.traverse((o) => {
          const m = (o as THREE.Mesh).material as THREE.MeshStandardMaterial | undefined;
          if (m && m.map) {
            m.map.anisotropy = 8;
          }
        });
        alive = makeAlive("robot", model, 1); // looks at the mouse, blinks, recoils when the mouse comes close
        holder.add(alive.group);
        renderer.compileAsync(scene, camera).then(() => (dirty = true), () => (dirty = true));
      },
      undefined,
      (err) => console.error("[redesign] spotlight robot failed to load", err),
    );

    let dirty = true;
    let lastP = -1;
    let W = 0;
    let H = 0;
    const resize = () => {
      const r = canvas.getBoundingClientRect();
      W = r.width;
      H = r.height;
      renderer.setSize(W, H, false);
      camera.aspect = W / Math.max(H, 1);
      camera.updateProjectionMatrix();
      dirty = true;
    };
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();

    // section progress from its page position (measured on resize) + the Lenis scroll value: no style/layout reads per frame
    let geo = { top: 0, h: 1 };
    const measure = () => {
      const r = section.getBoundingClientRect();
      geo = { top: r.top + window.scrollY, h: r.height };
    };
    const bodyRo = new ResizeObserver(measure);
    bodyRo.observe(document.body);
    measure();
    const progress = () => {
      const lenis = (window as unknown as { lenis?: { scroll: number } }).lenis;
      const y = lenis ? lenis.scroll : window.scrollY;
      const total = Math.max(geo.h - window.innerHeight, 1);
      return Math.min(Math.max((y - geo.top) / total, 0), 1);
    };
    const ease = (t: number) => (t < 0 ? 0 : t > 1 ? 1 : t * t * (3 - 2 * t));
    let raf = 0;
    let visible = false;
    let sm = 0; // smoothed progress
    const clock = new THREE.Clock();
    const ndc = new THREE.Vector3();
    const frame = () => {
      raf = 0;
      const t = clock.getElapsedTime();
      const p = progress();
      sm += (p - sm) * 0.18;
      if (Math.abs(p - sm) < 0.0005) sm = p;
      // the robot is "alive" (blink, hum, mouse look), so it draws every frame while the section is on screen
      if (dirty || alive || Math.abs(sm - lastP) > 0.0002) {
        lastP = sm;
        dirty = false;
        const wide = W / Math.max(H, 1) > 1.1;
        // 0 → 0.35: hero view (front, centred); 0.35 → 1: turns to show its side and slides right of the spec list
        const turn = ease((sm - 0.15) / 0.75);
        const slide = wide ? ease((sm - 0.25) / 0.35) : 0;
        holder.rotation.y = -0.45 + turn * 1.35;
        holder.position.x = slide * 0.55;
        // robot fills the lower ~45% of the frame so the intro text above stays clear
        if (wide) {
          camera.position.set(0, 0.8, 4.4);
          camera.lookAt(slide * 0.12, 0.74, 0);
        } else {
          // phones: small robot between the intro and the feature list, then it moves up above the spec grid
          const up = ease((sm - 0.22) / 0.2);
          const ly = 0.67 - up * 0.74;
          camera.position.set(0, ly + 0.25, 6.9);
          camera.lookAt(0, ly, 0);
        }
        if (alive) {
          ndc.set(0, 0.55, 0).applyMatrix4(holder.matrixWorld).project(camera);
          alive.update(t, { x: ndc.x, y: ndc.y }, camera.position);
        }
        renderer.render(scene, camera);
      }
      if (visible && (alive || sm !== progress())) raf = requestAnimationFrame(frame);
    };
    const kick = () => {
      if (!raf && visible) raf = requestAnimationFrame(frame);
    };
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      kick();
    });
    io.observe(section);
    // --p changes as the page scrolls: listen to scroll (passive) and redraw in the next frame only
    const onScroll = () => kick();
    window.addEventListener("scroll", onScroll, { passive: true });
    const ri = window.setInterval(() => dirty && kick(), 250); // model loaded / resized while idle

    return () => {
      cancelAnimationFrame(raf);
      clearInterval(ri);
      io.disconnect();
      ro.disconnect();
      bodyRo.disconnect();
      window.removeEventListener("scroll", onScroll);
      draco.dispose();
      renderer.dispose();
    };
  }, []);

  return <canvas ref={ref} className="sl-canvas" aria-hidden="true" />;
}
