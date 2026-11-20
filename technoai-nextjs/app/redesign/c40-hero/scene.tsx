"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { makeAlive, type Alive } from "../alive";
import { addMotionDetail } from "../models";

/**
 * Hero model for the AI & Robotics page: the real KLEENBOT C40, alive (looks at the mouse, blinks, recoils,
 * scans on its own), brushes spinning, slow idle turn, soft floor shadow. Transparent background: it sits in an
 * iframe over the page's own hero photo. Pauses when the page/tab is hidden.
 */
export default function C40HeroScene() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
    } catch {
      return;
    }
    renderer.debug.checkShaderErrors = false;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    const scene = new THREE.Scene();
    scene.add(new THREE.HemisphereLight(0xffffff, 0x1b2c3a, 1.6));
    const key = new THREE.DirectionalLight(0xffffff, 2.4);
    key.position.set(-3, 4, 5);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0x9fe7e7, 2.2); // aqua rim light to separate it from the dark photo
    rim.position.set(3, 2, -3);
    scene.add(rim);
    const camera = new THREE.PerspectiveCamera(26, 1, 0.1, 50);

    const holder = new THREE.Group();
    scene.add(holder);
    const shadowTex = (() => {
      const c = document.createElement("canvas");
      c.width = c.height = 128;
      const g = c.getContext("2d")!;
      const grd = g.createRadialGradient(64, 64, 4, 64, 64, 62);
      grd.addColorStop(0, "rgba(0,0,0,0.5)");
      grd.addColorStop(1, "rgba(0,0,0,0)");
      g.fillStyle = grd;
      g.fillRect(0, 0, 128, 128);
      return new THREE.CanvasTexture(c);
    })();
    const shadow = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.5), new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false }));
    shadow.rotation.x = -Math.PI / 2;
    holder.add(shadow);

    let alive: Alive | null = null;
    let spin: [THREE.Object3D, number][] = [];
    const draco = new DRACOLoader().setDecoderPath("/redesign/draco/");
    new GLTFLoader().setDRACOLoader(draco).load(
      "/redesign/models/robot.glb",
      (gltf) => {
        const model = gltf.scene;
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const k = 1 / size.y;
        model.scale.setScalar(k);
        const c = box.getCenter(new THREE.Vector3());
        model.position.set(-c.x * k, -box.min.y * k, -c.z * k);
        spin = addMotionDetail("robot", model);
        alive = makeAlive("robot", model, 1);
        holder.add(alive.group);
        renderer.compileAsync(scene, camera).catch(() => {});
      },
      undefined,
      (err) => console.error("[redesign] C40 hero model failed to load", err),
    );

    const resize = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / Math.max(h, 1);
      camera.updateProjectionMatrix();
      const fit = camera.aspect < 0.9 ? 1.25 : 1;
      camera.position.set(0, 0.78, 3.9 * fit);
      camera.lookAt(0, 0.5, 0);
    };
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();

    const clock = new THREE.Clock();
    const ndc = new THREE.Vector3();
    let last = 0;
    let raf = 0;
    const frame = () => {
      raf = requestAnimationFrame(frame);
      if (document.hidden) return;
      const t = clock.getElapsedTime();
      const dt = Math.min(0.05, t - last);
      last = t;
      holder.rotation.y = -0.35 + Math.sin(t * 0.25) * 0.12; // three-quarter view, slow sway
      spin.forEach(([o, sp]) => (o.rotation.z += dt * sp));
      if (alive) {
        ndc.set(0, 0.55, 0).applyMatrix4(holder.matrixWorld).project(camera);
        alive.update(t, { x: ndc.x, y: ndc.y }, camera.position);
      }
      renderer.render(scene, camera);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      draco.dispose();
      renderer.dispose();
    };
  }, []);

  return <canvas ref={ref} style={{ position: "fixed", inset: 0, width: "100vw", height: "100vh", display: "block" }} aria-hidden="true" />;
}
