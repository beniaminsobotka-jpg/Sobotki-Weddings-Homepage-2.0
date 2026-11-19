import {
  Color,
  Mesh,
  OrthographicCamera,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  Vector2,
  WebGLRenderer,
} from 'three';

export type LiquidVariant = 'paper' | 'noir';

// Paper keeps the warm wedding palette; noir is the Portraits palette:
// mostly black, a red undercurrent and a faint white sheen.
const palettes: Record<LiquidVariant, { base: string; a: string; b: string; c: string; grain: number }> = {
  paper: { base: '#F3F2ED', a: '#E8DFC4', b: '#D9D8D2', c: '#FFFFFF', grain: 0.035 },
  noir: { base: '#030303', a: '#FF0000', b: '#160404', c: '#FFFFFF', grain: 0.05 },
};

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform float uTime;
  uniform vec2 uResolution;
  uniform vec2 uPointer;
  uniform vec3 uBase;
  uniform vec3 uA;
  uniform vec3 uB;
  uniform vec3 uC;
  uniform float uGrain;
  uniform float uNoir;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
               mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
  }

  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 4; i++) {
      v += a * noise(p);
      p = p * 2.03 + vec2(17.0, 9.0);
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec2 aspect = vec2(uResolution.x / uResolution.y, 1.0);
    vec2 p = vUv * aspect * 1.6;
    float t = uTime * 0.045;

    // Domain warping gives the slow, viscous "liquid" motion.
    vec2 q = vec2(fbm(p + t), fbm(p + vec2(5.2, 1.3) - t));
    vec2 pointer = (uPointer * aspect - vUv * aspect);
    float pull = exp(-dot(pointer, pointer) * 6.0) * 0.35;
    vec2 r = vec2(fbm(p + 3.0 * q + vec2(1.7, 9.2) + t * 1.4 + pull),
                  fbm(p + 3.0 * q + vec2(8.3, 2.8) - t * 1.1));
    float f = fbm(p + 2.5 * r);

    vec3 col = uBase;
    col = mix(col, uB, smoothstep(0.25, 0.85, f));
    // Accent ribbons: sparse red in noir, warm wash in paper.
    float ribbon = smoothstep(0.62, 0.92, length(r) * f * 1.6);
    col = mix(col, uA, ribbon * mix(0.55, 0.22, uNoir));
    // Specular sheen along the ridges, like light on glass.
    float sheen = pow(smoothstep(0.55, 1.0, q.x * r.y * 1.8), 3.0);
    col = mix(col, uC, sheen * mix(0.6, 0.07, uNoir));

    // Keep black dominant in noir with a soft vignette.
    float vig = smoothstep(1.25, 0.2, length((vUv - 0.5) * aspect));
    col *= mix(1.0, mix(0.35, 1.0, vig), uNoir);

    col += (hash(vUv * uResolution + fract(uTime)) - 0.5) * uGrain;
    gl_FragColor = vec4(col, 1.0);
  }
`;

export interface LiquidSceneHandle {
  dispose: () => void;
}

export function createLiquidScene(canvas: HTMLCanvasElement, variant: LiquidVariant): LiquidSceneHandle {
  const palette = palettes[variant];
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const coarse = window.matchMedia('(pointer: coarse)').matches;

  const renderer = new WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: 'low-power' });
  // The field is soft, so rendering under native resolution is invisible and much cheaper.
  const pixelRatio = Math.min(window.devicePixelRatio || 1, coarse ? 0.75 : 1);
  renderer.setPixelRatio(pixelRatio);

  const scene = new Scene();
  const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const uniforms = {
    uTime: { value: Math.random() * 100 },
    uResolution: { value: new Vector2(1, 1) },
    uPointer: { value: new Vector2(0.5, 0.5) },
    uBase: { value: new Color(palette.base) },
    uA: { value: new Color(palette.a) },
    uB: { value: new Color(palette.b) },
    uC: { value: new Color(palette.c) },
    uGrain: { value: palette.grain },
    uNoir: { value: variant === 'noir' ? 1 : 0 },
  };
  const material = new ShaderMaterial({ vertexShader, fragmentShader, uniforms, depthTest: false, depthWrite: false });
  const geometry = new PlaneGeometry(2, 2);
  scene.add(new Mesh(geometry, material));

  const target = new Vector2(0.5, 0.5);
  let frame = 0;
  let last = performance.now();
  let visible = true;

  const resize = () => {
    const { clientWidth: w, clientHeight: h } = canvas;
    renderer.setSize(w, h, false);
    uniforms.uResolution.value.set(w * pixelRatio, h * pixelRatio);
    renderer.render(scene, camera);
  };

  const tick = (now: number) => {
    frame = 0;
    if (!visible || document.hidden || reduced.matches) return;
    // Phones get ~30 fps; the motion is slow enough that nobody can tell.
    if (coarse && now - last < 30) {
      frame = requestAnimationFrame(tick);
      return;
    }
    uniforms.uTime.value += Math.min(now - last, 64) / 1000;
    last = now;
    uniforms.uPointer.value.lerp(target, 0.04);
    renderer.render(scene, camera);
    frame = requestAnimationFrame(tick);
  };

  const start = () => {
    if (frame || !visible || document.hidden || reduced.matches) return;
    last = performance.now();
    frame = requestAnimationFrame(tick);
  };

  const onPointer = (event: PointerEvent) => {
    target.set(event.clientX / window.innerWidth, 1 - event.clientY / window.innerHeight);
  };

  const observer = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    start();
  });
  observer.observe(canvas);

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(canvas);
  document.addEventListener('visibilitychange', start);
  reduced.addEventListener('change', start);
  if (!coarse) window.addEventListener('pointermove', onPointer, { passive: true });

  resize();
  start();

  return {
    dispose: () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      resizeObserver.disconnect();
      document.removeEventListener('visibilitychange', start);
      reduced.removeEventListener('change', start);
      window.removeEventListener('pointermove', onPointer);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    },
  };
}
