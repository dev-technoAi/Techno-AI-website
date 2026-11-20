import * as THREE from "three";

// One pooled point cloud connects the aerial inspection to the cleaning robot.
// Geometry and material are created once; the scroll frame only updates positions.
export function buildJourneyParticles() {
  const count = 220;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const seed = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    seed[i * 3] = Math.random();
    seed[i * 3 + 1] = Math.random();
    seed[i * 3 + 2] = Math.random();
    const color = new THREE.Color(i % 3 === 0 ? "#146b8c" : i % 2 === 0 ? "#289fb7" : "#9fe7e7");
    color.toArray(colors, i * 3);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  const material = new THREE.PointsMaterial({
    size: 0.058,
    vertexColors: true,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    sizeAttenuation: true,
    toneMapped: false,
  });
  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;
  points.visible = false;

  const update = (time: number, station: number, drone: THREE.Vector3, robotX: number) => {
    if (station >= 1.3) {
      points.visible = false;
      return;
    }
    const handoff = Math.min(1, Math.max(0, (station - 0.76) / 0.54));
    const eased = handoff * handoff * (3 - 2 * handoff);
    const fade = station < 0.76 ? 1 : 1 - eased;
    material.opacity = 0.72 * fade;
    points.visible = material.opacity > 0.015;
    if (!points.visible) return;

    for (let i = 0; i < count; i++) {
      const a = seed[i * 3] * Math.PI * 2 + time * (i % 2 ? 0.13 : -0.1);
      const spread = seed[i * 3 + 1];
      const drift = seed[i * 3 + 2];
      const r = 0.42 + spread * 1.2;
      const fromX = drone.x + Math.cos(a) * r;
      const fromY = drone.y + Math.sin(a * 1.5) * (0.22 + spread * 0.46);
      const fromZ = drone.z - 0.45 + Math.sin(a) * 0.55;
      const toX = robotX + (drift - 0.5) * 2.6;
      const toY = -1.68 + spread * 0.42;
      const toZ = (spread - 0.5) * 1.2;
      positions[i * 3] = fromX + (toX - fromX) * eased;
      positions[i * 3 + 1] = fromY + (toY - fromY) * eased;
      positions[i * 3 + 2] = fromZ + (toZ - fromZ) * eased;
    }
    geometry.attributes.position.needsUpdate = true;
  };

  return { points, update, dispose: () => { geometry.dispose(); material.dispose(); } };
}
