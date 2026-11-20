import * as T from "three";
import type { SceneApi } from "./host";

export function create(canvas: HTMLCanvasElement): SceneApi {
  const renderer = new T.WebGLRenderer({ canvas, alpha: true, antialias: true });
  const scene = new T.Scene();
  const camera = new T.PerspectiveCamera(38, 1, .1, 40);
  camera.position.set(0, .25, 9);
  const sculpture = new T.Group();
  scene.add(sculpture, new T.AmbientLight(0x7bc4de, 2));
  const light = new T.PointLight(0xb4f3ff, 65);
  light.position.set(-3, 4, 4);
  scene.add(light);
  const sphere = new T.Mesh(new T.SphereGeometry(.93, 48, 32), new T.MeshPhongMaterial({ color: 0x02324e, shininess: 95, transparent: true, opacity: .94 }));
  sculpture.add(sphere);
  const grid = new T.Mesh(new T.SphereGeometry(.95, 36, 24), new T.MeshBasicMaterial({ color: 0x1684ad, wireframe: true, transparent: true, opacity: .24 }));
  sculpture.add(grid);
  const rings: T.Mesh[] = [];
  for (let i = 0; i < 5; i++) {
    const ring = new T.Mesh(new T.TorusGeometry(1.8 + i * .11, i < 2 ? .025 : .008, 8, 180), new T.MeshPhongMaterial({ color: i % 2 ? 0x7fb6c7 : 0x086486, shininess: 100, transparent: true, opacity: .8 }));
    ring.rotation.set(.4 + i * .55, .35 + i * .65, i * .42);
    sculpture.add(ring);
    rings.push(ring);
  }
  const cubes: T.Mesh[] = [];
  for (let i = 0; i < 4; i++) {
    const cube = new T.Mesh(new T.BoxGeometry(.23, .23, .23), new T.MeshPhongMaterial({ color: 0xc3e5eb, shininess: 80 }));
    sculpture.add(cube);
    cubes.push(cube);
  }
  for (let i = 0; i < 3; i++) {
    const base = new T.Mesh(new T.CylinderGeometry(1.4 + i * .22, 1.6 + i * .22, .12, 96), new T.MeshPhongMaterial({ color: i === 0 ? 0x28505c : 0x10232a, shininess: 80 }));
    base.position.y = -2.25 - i * .12;
    sculpture.add(base);
  }
  let px = 0, py = 0;
  return {
    resize(w, h, dpr) {
      renderer.setPixelRatio(dpr);
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.position.z = camera.aspect < .85 ? 11 : 9;
      camera.updateProjectionMatrix();
    },
    pointer(x, y) { px = x; py = y; },
    frame(t) {
      sculpture.rotation.y += (px * .12 - sculpture.rotation.y) * .035;
      sculpture.rotation.x += (py * .05 - sculpture.rotation.x) * .035;
      grid.rotation.y = t * .08;
      rings.forEach((ring, i) => { ring.rotation.z = i * .42 + t * .035 * (i % 2 ? 1 : -1); });
      cubes.forEach((cube, i) => {
        const angle = i * Math.PI / 2 + .6;
        cube.position.set(Math.cos(angle) * 2.55, Math.sin(angle) * 1.8 + Math.sin(t * .5 + i) * .12, Math.sin(angle) * .6);
        cube.rotation.set(t * .12 + i, t * .16, .4);
      });
      renderer.render(scene, camera);
    },
    dispose() {
      scene.traverse(object => {
        if (object instanceof T.Mesh) {
          object.geometry.dispose();
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          materials.forEach(material => material.dispose());
        }
      });
      renderer.dispose();
    },
  };
}
