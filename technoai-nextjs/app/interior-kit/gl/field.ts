import { BufferAttribute, BufferGeometry, Color, PerspectiveCamera, Points, Scene, ShaderMaterial, WebGLRenderer } from "three";
import type { SceneApi, SceneOptions } from "./host";

/**
 * Header visual for pages that have no photo of their own: a terrain of points — a sensor
 * survey / data surface — rolling slowly towards the horizon in the brand blue. Peaks catch a
 * lighter tint; a scan line sweeps across. The pointer moves the camera a little; scrolling the
 * header away lifts the camera (via the section's --p).
 */

const COLS = 190;
const ROWS = 110;

export function create(canvas: HTMLCanvasElement, { root }: SceneOptions): SceneApi {
  const renderer = new WebGLRenderer({ canvas, antialias: false, alpha: true, powerPreference: "default" });
  renderer.setClearColor(0x000000, 0);
  const scene = new Scene();
  const camera = new PerspectiveCamera(42, 1, 0.1, 60);

  const pos = new Float32Array(COLS * ROWS * 3);
  let k = 0;
  for (let z = 0; z < ROWS; z++) {
    for (let x = 0; x < COLS; x++) {
      pos[k++] = (x / (COLS - 1) - 0.5) * 22;
      pos[k++] = 0;
      pos[k++] = -(z / (ROWS - 1)) * 18 + 3;
    }
  }
  const geo = new BufferGeometry();
  geo.setAttribute("position", new BufferAttribute(pos, 3));

  const uniforms = {
    uTime: { value: 0 },
    uPx: { value: 1 },
    uBlue: { value: new Color("#146b8c") },
    uAqua: { value: new Color("#7fd0e6") },
  };
  const mat = new ShaderMaterial({
    uniforms,
    transparent: true,
    depthWrite: false,
    vertexShader: /* glsl */ `
      uniform float uTime; uniform float uPx;
      varying float vH; varying float vFade; varying float vScan;
      // 2D simplex noise (Ashima Arts, MIT)
      vec3 permute(vec3 x){ return mod(((x*34.0)+1.0)*x, 289.0); }
      float snoise(vec2 v){
        const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
        vec2 i = floor(v + dot(v, C.yy)); vec2 x0 = v - i + dot(i, C.xx);
        vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
        vec4 x12 = x0.xyxy + C.xxzz; x12.xy -= i1; i = mod(i, 289.0);
        vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
        vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
        m = m*m; m = m*m;
        vec3 x = 2.0 * fract(p * C.www) - 1.0; vec3 h = abs(x) - 0.5; vec3 ox = floor(x + 0.5); vec3 a0 = x - ox;
        m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
        vec3 g; g.x = a0.x * x0.x + h.x * x0.y; g.yz = a0.yz * x12.xz + h.yz * x12.yw;
        return 130.0 * dot(m, g);
      }
      void main() {
        vec3 p = position;
        vec2 q = vec2(p.x * 0.16, p.z * 0.16 - uTime * 0.05);
        float h = snoise(q) * 0.75 + snoise(q * 2.3 + 7.1) * 0.25;
        h = h * 0.5 + 0.5;
        p.y = pow(h, 2.2) * 1.9 - 0.6;
        vH = h;
        float scanZ = mod(uTime * 1.6, 26.0) - 20.0;
        vScan = (1.0 - smoothstep(0.0, 0.9, abs(p.z - scanZ)));
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        // fade into the horizon and towards the sides
        vFade = smoothstep(-24.0, -8.0, mv.z) * (1.0 - smoothstep(5.0, 11.0, abs(p.x))) * (1.0 - smoothstep(-1.5, 0.0, mv.z));
        gl_Position = projectionMatrix * mv;
        gl_PointSize = uPx * (1.4 + h * 1.6) * (7.0 / -mv.z);
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uBlue; uniform vec3 uAqua;
      varying float vH; varying float vFade; varying float vScan;
      void main() {
        vec2 c = gl_PointCoord - 0.5;
        if (dot(c, c) > 0.25) discard;
        float lit = smoothstep(0.55, 0.95, vH) + vScan * 0.6;
        vec3 col = mix(uBlue, uAqua, clamp(lit, 0.0, 1.0));
        gl_FragColor = vec4(col, vFade * (0.38 + vH * 0.7 + vScan * 0.55));
      }`,
  });
  scene.add(new Points(geo, mat));

  let px = 0, py = 0, sx = 0, sy = 0;

  return {
    resize(w, h, dpr) {
      renderer.setPixelRatio(dpr);
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      // narrow screens: wider view so the terrain still spans the screen
      camera.fov = w / h < 1 ? 58 : 42;
      camera.updateProjectionMatrix();
      uniforms.uPx.value = dpr * Math.min(1.3, Math.max(0.75, h / 800));
    },
    pointer(x, y) { px = x; py = y; },
    frame(t, dt) {
      uniforms.uTime.value = t;
      const p = parseFloat(root.style.getPropertyValue("--p")) || 0;
      sx += (px - sx) * Math.min(1, dt * 2);
      sy += (py - sy) * Math.min(1, dt * 2);
      camera.position.set(sx * 0.9, 2.0 + p * 1.6 - sy * 0.35, 5.5);
      camera.lookAt(sx * 0.4, 0.2 - p * 0.6, -6);
      renderer.render(scene, camera);
    },
    dispose() {
      geo.dispose();
      mat.dispose();
      renderer.dispose();
    },
  };
}
