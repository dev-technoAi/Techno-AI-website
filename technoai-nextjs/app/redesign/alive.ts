import * as THREE from "three";

/**
 * "Alive" behaviour for the real robot and drone (Phase 1 of the lusion-style plan).
 * Everything is spring physics, so motion has weight and settles naturally:
 *  - robot: turns its head/body to look at the mouse, eyes follow and blink, a faint motor hum, recoils when the
 *    mouse comes very close, scans left/right on its own when there is no mouse.
 *  - drone: drifts after the mouse, banks/pitches with its own velocity, gets pushed away when the mouse comes close,
 *    hover bob.
 * Wraps the model in a group, so it composes with whatever the scene does to the holder.
 */

const ptr = { x: 0, y: 0, has: false, last: 0 };
if (typeof window !== "undefined") {
  window.addEventListener(
    "pointermove",
    (e) => {
      if (e.pointerType !== "mouse" || !Number.isFinite(e.clientX) || !Number.isFinite(e.clientY)) return;
      ptr.x = (e.clientX / window.innerWidth) * 2 - 1;
      ptr.y = -((e.clientY / window.innerHeight) * 2 - 1);
      ptr.has = true;
      ptr.last = performance.now();
    },
    { passive: true },
  );
}

class Spring {
  x = 0;
  v = 0;
  constructor(private k = 38, private c = 9) {}
  step(target: number, dt: number) {
    if (!Number.isFinite(this.x) || !Number.isFinite(this.v)) { this.x = 0; this.v = 0; }
    if (!Number.isFinite(target)) target = 0;
    dt = Number.isFinite(dt) ? Math.min(.05, Math.max(0, dt)) : .016;
    const a = this.k * (target - this.x) - this.c * this.v;
    this.v += a * dt;
    this.x += this.v * dt;
    return this.x;
  }
  kick(dv: number) {
    this.v += dv;
  }
}

const clamp = (v: number, a: number) => Math.max(-a, Math.min(a, v));

export type Alive = {
  group: THREE.Group;
  /** screen = the model's position in NDC (-1..1), so it can react to where the mouse is relative to it */
  update: (t: number, screen?: { x: number; y: number }, camPos?: THREE.Vector3) => void;
};

/** Glowing eye: rounded rectangle, aqua, used over the robot's display. */
function eyeMesh(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = 64;
  c.height = 64;
  const g = c.getContext("2d")!;
  g.fillStyle = "#bff4f7";
  g.shadowColor = "#9fe7e7";
  g.shadowBlur = 10;
  const r = 14;
  g.beginPath();
  g.roundRect(10, 10, 44, 44, r);
  g.fill();
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w * 1.45, h * 1.45), new THREE.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false, depthWrite: false }));
  return m;
}

/**
 * @param inner the model (in its own GLB space: front = +Z, origin = bottom centre)
 * @param unit  rough size of the model in the parent's units (scales the position offsets)
 */
export function makeAlive(kind: "robot" | "drone", inner: THREE.Object3D, unit = 1): Alive {
  unit = Number.isFinite(unit) && unit > 0 ? unit : 1;
  const group = new THREE.Group();
  group.add(inner);
  const yaw = new Spring(30, 8);
  const pitch = new Spring(30, 8);
  const px = new Spring(22, 6.5);
  const py = new Spring(22, 6.5);
  const pz = new Spring(40, 9);
  let lastT = -1;

  // robot face: dark covers over the printed eyes + glowing eyes that blink and look around
  const eyes: THREE.Mesh[] = [];
  const faceMats: THREE.MeshBasicMaterial[] = [];
  const fwd = new THREE.Vector3();
  const toCam = new THREE.Vector3();
  const wpos = new THREE.Vector3();
  if (kind === "robot") {
    const W = 0.059;
    const H = 0.056;
    const cover = new THREE.MeshBasicMaterial({ color: "#121a1c", toneMapped: false, transparent: true, depthWrite: false });
    faceMats.push(cover);
    [-0.067, 0.069].forEach((x) => {
      const back = new THREE.Mesh(new THREE.PlaneGeometry(W * 1.5, H * 1.5), cover);
      back.position.set(x, 0.503, 0.266);
      inner.add(back);
      const e = eyeMesh(W, H);
      e.position.set(x, 0.503, 0.267);
      e.userData.base = new THREE.Vector2(x, 0.503);
      inner.add(e);
      eyes.push(e);
      faceMats.push(e.material as THREE.MeshBasicMaterial);
    });
  }
  let nextBlink = 2 + Math.random() * 2;
  let blinkT = -1;

  const update = (t: number, screen = { x: 0, y: 0 }, camPos?: THREE.Vector3) => {
    if (!Number.isFinite(t)) return;
    const dt = lastT < 0 ? 0.016 : Math.min(0.05, Math.max(0, t - lastT));
    lastT = t;
    const active = ptr.has && Number.isFinite(screen.x) && Number.isFinite(screen.y) && performance.now() - ptr.last < 6000;
    const dx = active ? ptr.x - screen.x : 0;
    const dy = active ? ptr.y - screen.y : 0;
    const dist = Math.hypot(dx, dy * 0.8);
    const near = active ? Math.max(0, 1 - dist / 0.32) : 0; // 0..1 when the mouse is right on top of it

    if (kind === "robot") {
      const scan = active ? 0 : Math.sin(t * 0.45) * 0.28 + Math.sin(t * 0.17) * 0.12;
      group.rotation.y = yaw.step(active ? clamp(dx * 0.55, 0.55) : scan, dt);
      group.rotation.x = pitch.step(active ? clamp(-dy * 0.16, 0.12) : 0, dt);
      // recoil from a very close mouse, then settle
      group.position.z = pz.step(-near * 0.12 * unit, dt);
      group.position.y = Math.sin(t * 13) * 0.0012 * unit + near * 0.01 * unit; // motor hum
      // eyes: follow + blink
      nextBlink -= dt;
      if (nextBlink <= 0 && blinkT < 0) {
        blinkT = 0;
        nextBlink = 2.2 + Math.random() * 3.2;
      }
      let open = 1;
      if (blinkT >= 0) {
        blinkT += dt;
        open = Math.abs(Math.cos(Math.min(1, blinkT / 0.16) * Math.PI));
        if (blinkT > 0.16) blinkT = -1;
      }
      const wide = 1 + near * 0.18;
      // the glowing eyes are flat overlays: show them only while the face points at the camera (they would
      // double up with the printed eyes when the robot is turned), fade smoothly in between
      let face = 1;
      if (camPos) {
        inner.updateWorldMatrix(true, false);
        fwd.set(0, 0, 1).transformDirection(inner.matrixWorld);
        wpos.setFromMatrixPosition(inner.matrixWorld);
        toCam.subVectors(camPos, wpos).normalize();
        const d = fwd.dot(toCam);
        face = Math.min(1, Math.max(0, (d - 0.86) / 0.08));
      }
      faceMats.forEach((m) => (m.opacity = face));
      eyes.forEach((e) => {
        const b = e.userData.base as THREE.Vector2;
        e.position.x = b.x + clamp(dx, 1) * 0.011;
        e.position.y = b.y + clamp(dy, 1) * 0.008;
        e.scale.set(wide, Math.max(0.08, open) * wide, 1);
      });
    } else {
      // drone: follow the mouse a little, get pushed away when it comes close
      const push = near * 0.35;
      const dirX = dist > 0.001 ? dx / dist : 0;
      const dirY = dist > 0.001 ? dy / dist : 0;
      const tx = active ? clamp(dx * 0.22, 0.22) - dirX * push : Math.sin(t * 0.33) * 0.08;
      const ty = active ? clamp(dy * 0.16, 0.16) - dirY * push : Math.sin(t * 0.5) * 0.05;
      group.position.x = px.step(tx * unit, dt);
      group.position.y = py.step(ty * unit, dt) + Math.sin(t * 2.3) * 0.012 * unit;
      // bank and pitch with velocity (like a real quad), small yaw toward the mouse
      group.rotation.z = clamp(-px.v / unit * 0.55, 0.35);
      group.rotation.x = clamp(py.v / unit * 0.25 + 0.02, 0.25);
      group.rotation.y = yaw.step(active ? clamp(dx * 0.25, 0.3) : 0, dt);
    }
  };
  return { group, update };
}
