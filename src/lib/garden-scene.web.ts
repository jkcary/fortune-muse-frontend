import * as THREE from "three";

type Motion = { active: boolean; reduced: boolean };
type Options = Motion & {
  decor: string[];
  lights: number;
  onReady: () => void;
  onUnavailable: () => void;
};
export type GardenScene = {
  setMotion: (motion: Motion) => void;
  dispose: () => void;
};

/** Orthographic, transparent 3D details registered to the 720 × 300 SVG. */
export function createGardenScene(
  host: HTMLDivElement,
  options: Options,
): GardenScene | null {
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "low-power",
    });
  } catch {
    options.onUnavailable();
    return null;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.setClearColor(0x000000, 0);
  renderer.domElement.style.cssText =
    "display:block;width:100%;height:100%;pointer-events:none";
  host.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-360, 360, 150, -150, 0.1, 2000);
  camera.position.z = 1000;
  const geometries: THREE.BufferGeometry[] = [];
  const materials: THREE.Material[] = [];
  const geometry = <T extends THREE.BufferGeometry>(g: T) => {
    geometries.push(g);
    return g;
  };
  const material = <T extends THREE.Material>(m: T) => {
    materials.push(m);
    return m;
  };
  const at = (object: THREE.Object3D, x: number, y: number, z = 0) => {
    object.position.set(x - 360, 150 - y, z);
    scene.add(object);
    return object;
  };
  const updates: ((time: number) => void)[] = [];
  // A tiny generated radial texture: no downloaded textures or postprocessing.
  const pixels = new Uint8Array(64 * 64 * 4);
  for (let y = 0; y < 64; y++)
    for (let x = 0; x < 64; x++) {
      const radius = Math.hypot((x - 31.5) / 31.5, (y - 31.5) / 31.5);
      const p = (y * 64 + x) * 4;
      pixels[p] = pixels[p + 1] = pixels[p + 2] = 255;
      pixels[p + 3] = Math.round(255 * Math.pow(Math.max(0, 1 - radius), 2.6));
    }
  const texture = new THREE.DataTexture(pixels, 64, 64, THREE.RGBAFormat);
  texture.needsUpdate = true;
  const glow = (
    x: number,
    y: number,
    width: number,
    height: number,
    color: number,
    opacity: number,
    z = 8,
  ) => {
    const mat = material(
      new THREE.SpriteMaterial({
        map: texture,
        color,
        opacity,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    const sprite = at(new THREE.Sprite(mat), x, y, z);
    sprite.scale.set(width, height, 1);
    return { sprite, mat };
  };

  const starGeometry = geometry(new THREE.CircleGeometry(1, 8));
  for (let i = 0; i < 28; i++) {
    const x = 25 + ((i * 97) % 670),
      y = 15 + ((i * 31) % 155);
    const base = 0.38 + (i % 3) * 0.17;
    const mat = material(
      new THREE.MeshBasicMaterial({
        color: 0xebd5b8,
        transparent: true,
        opacity: base,
        depthWrite: false,
      }),
    );
    const star = at(new THREE.Mesh(starGeometry, mat), x, y, 3);
    star.scale.setScalar(i % 4 === 0 ? 1.25 : 0.65);
    const halo = i % 4 === 0 ? glow(x, y, 13, 13, 0xf7e0cb, 0.2) : null;
    updates.push((t) => {
      const wave = 0.5 + 0.5 * Math.sin(t * (0.65 + (i % 5) * 0.14) + i * 2.39);
      mat.opacity = base * (0.38 + wave * 0.62);
      if (halo) halo.mat.opacity = 0.09 + wave * 0.22;
    });
  }

  const moon = glow(558, 62, 116, 116, 0xd8c5ed, 0.14);
  updates.push((t) => {
    moon.mat.opacity = 0.1 + Math.sin(t * 0.48) * 0.035;
  });
  scene.add(new THREE.AmbientLight(0xb6a2d2, 1.8));
  const key = new THREE.DirectionalLight(0xffedc9, 3);
  key.position.set(-150, 180, 300);
  scene.add(key);

  const lampGlow = (
    x: number,
    y: number,
    size: number,
    phase: number,
    strength: number,
  ) => {
    const halo = glow(x, y, size, size, 0xffdfaa, strength);
    const core = glow(
      x,
      y,
      size * 0.2,
      size * 0.2,
      0xfff5d9,
      strength * 0.8,
      10,
    );
    updates.push((t) => {
      const pulse =
        0.84 +
        0.12 * Math.sin(t * 0.94 + phase) +
        0.04 * Math.sin(t * 2.17 + phase);
      halo.mat.opacity = strength * pulse;
      core.mat.opacity = strength * 0.8 * pulse;
    });
  };
  for (let i = 0; i < Math.min(12, options.lights); i++) {
    const x = 192 + i * 29,
      y = 192 + Math.sin(i) * 12;
    lampGlow(x, y, 35, i * 1.7, 0.6);
    const pool = glow(x, y + 4, 35, 8, 0xffdcaa, 0.19, 1);
    updates.push((t) => {
      pool.mat.opacity = 0.14 + 0.045 * Math.sin(t * 0.94 + i * 1.7);
    });
  }
  if (options.decor.includes("moon-lamp")) {
    lampGlow(177, 121, 88, 0.8, 0.45);
    glow(177, 197, 100, 18, 0xffd6a3, 0.3, 1);
  }
  if (options.decor.includes("pearl-fountain")) {
    const pearl = glow(360, 165, 75, 75, 0xffdcea, 0.42, 7);
    const reflection = glow(360, 216, 94, 12, 0xd7b8ea, 0.28, 2);
    updates.push((t) => {
      pearl.mat.opacity = 0.33 + 0.09 * Math.sin(t * 0.8);
      reflection.mat.opacity = 0.22 + 0.07 * Math.sin(t * 0.8);
    });
    const points = Array.from({ length: 65 }, (_, i) => {
      const a = (i / 64) * Math.PI * 2;
      return new THREE.Vector3(Math.cos(a) * 57, Math.sin(a) * 11, 0);
    });
    for (let i = 0; i < 2; i++) {
      const mat = material(
        new THREE.LineBasicMaterial({
          color: 0xd6bfe3,
          transparent: true,
          opacity: 0.15,
          depthWrite: false,
        }),
      );
      const ring = at(
        new THREE.LineLoop(
          geometry(new THREE.BufferGeometry().setFromPoints(points)),
          mat,
        ),
        360,
        213,
        2,
      );
      updates.push((t) => {
        const progress = (t * 0.12 + i * 0.5) % 1;
        ring.scale.setScalar(0.38 + progress);
        mat.opacity = 0.19 * (1 - progress);
      });
    }
  }
  if (options.decor.includes("star-flowers")) {
    const shape = new THREE.Shape();
    for (let i = 0; i < 10; i++) {
      const angle = Math.PI / 2 + (i * Math.PI) / 5,
        r = i % 2 ? 4.1 : 9.2;
      if (i === 0) shape.moveTo(Math.cos(angle) * r, Math.sin(angle) * r);
      else shape.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
    }
    shape.closePath();
    const star = geometry(
      new THREE.ExtrudeGeometry(shape, {
        depth: 1.6,
        bevelEnabled: true,
        bevelSegments: 1,
        steps: 1,
        bevelSize: 0.55,
        bevelThickness: 0.5,
      }),
    );
    for (let i = 0; i < 5; i++) {
      const group = at(new THREE.Group(), 228 + i * 14, 229, 12);
      const height = 34 - (i % 2) * 9;
      const curve = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(-7, 27, 0),
        new THREE.Vector3(-1, height, 0),
      );
      const stem = new THREE.Mesh(
        geometry(new THREE.TubeGeometry(curve, 12, 0.45, 5, false)),
        material(
          new THREE.MeshStandardMaterial({ color: 0x91b6a6, roughness: 0.8 }),
        ),
      );
      group.add(stem);
      const mat = material(
        new THREE.MeshStandardMaterial({
          color: i % 2 ? 0xd1b0e1 : 0xe9cee8,
          emissive: 0x9971b3,
          emissiveIntensity: 0.32,
          metalness: 0.15,
          roughness: 0.45,
        }),
      );
      const flower = new THREE.Mesh(star, mat);
      flower.position.set(-1, height, 0);
      flower.rotation.y = -0.2 + i * 0.08;
      group.add(flower);
      const haloMat = material(
        new THREE.SpriteMaterial({
          map: texture,
          color: 0xd6a8ed,
          transparent: true,
          opacity: 0.25,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        }),
      );
      const halo = new THREE.Sprite(haloMat);
      halo.position.set(-1, height, 3);
      halo.scale.set(34, 34, 1);
      group.add(halo);
      glow(228 + i * 14, 230, 20, 4, 0xbaa0d8, 0.12, 1);
      updates.push((t) => {
        // Pivot at the planted root, with shared wind and individual response.
        group.rotation.z =
          Math.sin(t * 0.85 + i * 0.42) * 0.045 + Math.sin(t * 1.4 + i) * 0.014;
        flower.rotation.y = -0.2 + i * 0.08 + Math.sin(t * 0.7 + i) * 0.11;
        haloMat.opacity = 0.18 + 0.08 * Math.sin(t * 1.05 + i * 1.9);
        mat.emissiveIntensity = 0.26 + 0.1 * Math.sin(t * 1.05 + i * 1.9);
      });
    }
  }

  let disposed = false,
    lost = false,
    frame = 0,
    last = 0,
    time = 0;
  let motion: Motion = options,
    visible = true;
  const draw = () => {
    updates.forEach((update) => update(time));
    renderer.render(scene, camera);
  };
  const running = () =>
    !disposed &&
    !lost &&
    motion.active &&
    !motion.reduced &&
    visible &&
    !document.hidden;
  const tick = (now: number) => {
    frame = 0;
    if (!running()) return;
    const elapsed = now - last;
    if (elapsed >= 1000 / 30) {
      time += Math.min(elapsed, 80) / 1000;
      last = now;
      draw();
    }
    frame = requestAnimationFrame(tick);
  };
  const sync = () => {
    cancelAnimationFrame(frame);
    frame = 0;
    last = performance.now();
    if (motion.reduced && !lost && !disposed) {
      time = 0;
      draw();
    }
    if (running()) frame = requestAnimationFrame(tick);
  };
  const resize = () => {
    if (lost || disposed) return;
    const width = Math.max(1, host.clientWidth),
      height = Math.max(1, host.clientHeight);
    const scale = Math.min(width / 720, height / 300);
    camera.left = -width / (2 * scale);
    camera.right = -camera.left;
    camera.top = height / (2 * scale);
    camera.bottom = -camera.top;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
    draw();
  };
  const onLost = (event: Event) => {
    event.preventDefault();
    lost = true;
    renderer.domElement.style.visibility = "hidden";
    cancelAnimationFrame(frame);
    options.onUnavailable();
  };
  renderer.domElement.addEventListener("webglcontextlost", onLost);
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(host);
  const observer = new IntersectionObserver((entries) => {
    visible = entries[0]?.isIntersecting ?? false;
    sync();
  });
  observer.observe(host);
  document.addEventListener("visibilitychange", sync);
  resize();
  sync();
  options.onReady();
  return {
    setMotion(next) {
      motion = next;
      sync();
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      observer.disconnect();
      document.removeEventListener("visibilitychange", sync);
      renderer.domElement.removeEventListener("webglcontextlost", onLost);
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
      texture.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    },
  };
}
