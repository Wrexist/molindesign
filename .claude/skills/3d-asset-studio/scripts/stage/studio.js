// Studio: environment, lights, floor shadow catcher and contact shadows, all sized to the scene.
// Light directions are given for a camera looking from the front (+z); they turn with the camera azimuth,
// so "key from the upper left" stays true from every viewing angle.
import * as THREE from 'three';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {HorizontalBlurShader} from 'three/addons/shaders/HorizontalBlurShader.js';
import {VerticalBlurShader} from 'three/addons/shaders/VerticalBlurShader.js';

export const PRESETS = {
  // Soft daylight studio: the weight-plate look. Neutral, readable on light pages.
  soft: {exposure: 1, env: 0.95, envRotation: 0,
    key: {dir: [-3.2, 5.5, 2.6], intensity: 2.1, color: 0xffffff, softness: 1},
    fill: {dir: [3, 2, 3], intensity: 0.55, color: 0xf5f5f0},
    rim: null, floor: 0.5, contact: 0.45},
  // Brighter and flatter: white or pastel products, e-commerce.
  bright: {exposure: 1.02, env: 1.25, envRotation: 0,
    key: {dir: [-2.4, 6, 3.2], intensity: 1.55, color: 0xffffff, softness: 1.5},
    fill: {dir: [3.2, 2.4, 3.4], intensity: 0.85, color: 0xffffff},
    rim: null, floor: 0.34, contact: 0.4},
  // Low key with a rim: dark pages, premium, moody.
  dramatic: {exposure: 1, env: 0.4, envRotation: 0.6,
    key: {dir: [-4.6, 3.6, 1.4], intensity: 3.3, color: 0xfff6ea, softness: 0.75},
    fill: {dir: [3, 1.2, 3], intensity: 0.12, color: 0xdde6ff},
    rim: {dir: [2.6, 3.2, -4.2], intensity: 2.4, color: 0xffffff},
    floor: 0.62, contact: 0.55},
  // Light from almost straight above: flat lays and top-down cameras.
  top: {exposure: 1, env: 0.9, envRotation: 0,
    key: {dir: [-0.9, 7, 1.4], intensity: 2, color: 0xffffff, softness: 1.3},
    fill: {dir: [2, 3, 2.5], intensity: 0.5, color: 0xf5f5f0},
    rim: null, floor: 0.42, contact: 0.5},
  // Clay render: big soft light, lots of bounce, gentle shadows (pairs with look: 'clay').
  clay: {exposure: 1.02, env: 1.15, envRotation: 0, envMap: 'overcast',
    key: {dir: [-2.6, 6, 3.4], intensity: 1.35, color: 0xfffaf2, softness: 2.4},
    fill: {dir: [3.4, 2.2, 3], intensity: 0.45, color: 0xf2f4ff},
    rim: null, floor: 0.32, contact: 0.5},
  // Golden hour: warm low key light from the side, long soft shadows, sunset reflections.
  golden: {exposure: 1, env: 0.8, envRotation: 0, envMap: 'sunset',
    key: {dir: [-5.5, 2.4, 1.8], intensity: 2.6, color: 0xffd2a1, softness: 1.2},
    fill: {dir: [3, 2, 3], intensity: 0.3, color: 0xbfd0ff},
    rim: null, floor: 0.5, contact: 0.45},
  // Glass, liquids, perfume, chrome, jewellery: dark-field reflections (defining dark edges, long strip
  // highlights) and lighter shadows. Render glass on its final background (backdrop) so it has something to refract.
  glass: {exposure: 1, env: 1, envRotation: 0, envMap: 'strips',
    key: {dir: [-3.2, 5.5, 2.6], intensity: 1.9, color: 0xffffff, softness: 1.4},
    fill: {dir: [3, 2, 3], intensity: 0.7, color: 0xffffff},
    rim: null, floor: 0.4, contact: 0.42},
  // Night / neon: almost dark, rim strips; emissive materials and bloom carry the image.
  night: {exposure: 1, env: 0.9, envRotation: 0, envMap: 'dark',
    key: {dir: [-3, 5, 2], intensity: 0.5, color: 0xc8d4ff, softness: 1.5},
    fill: null, rim: {dir: [2.5, 3, -4], intensity: 1.6, color: 0xb8c8ff},
    floor: 0.55, contact: 0.5},
};

const isObj = v => v && typeof v === 'object' && !Array.isArray(v) && !v.isColor;
export function merge(base, over) {
  if (!isObj(over)) return over === undefined ? base : over;
  const out = {...(isObj(base) ? base : {})};
  for (const [k, v] of Object.entries(over)) out[k] = isObj(v) && isObj(out[k]) ? merge(out[k], v) : v;
  return out;
}

// ------------------------------------------------------------------ environments (what reflections see)

function skyDome(fragment) {
  return new THREE.Mesh(new THREE.SphereGeometry(60, 64, 32), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false,
    vertexShader: 'varying vec3 vDir; void main() { vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: 'varying vec3 vDir; void main() { float y = vDir.y; vec3 c; ' + fragment + ' gl_FragColor = vec4(c, 1.0); }',
  }));
}
function panel(scene, w, h, pos, intensity, color = 0xffffff) {
  const c = new THREE.Color(color).multiplyScalar(intensity);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({color: c, side: THREE.DoubleSide}));
  m.position.set(...pos); m.lookAt(0, 0, 0); scene.add(m);
}

/** Photo studio: dark floor to bright ceiling, a big softbox front left, a strip right, a rim strip behind. Metals, gloss, glass. */
export function softboxEnvironment() {
  const scene = new THREE.Scene();
  scene.add(skyDome('c = mix(vec3(0.16), vec3(0.62), smoothstep(-0.35, 0.05, y)); c = mix(c, vec3(0.95), smoothstep(0.05, 0.9, y));'));
  panel(scene, 34, 22, [-12, 26, 20], 5);   // key softbox
  panel(scene, 9, 44, [32, 8, 4], 2.6);      // strip, right
  panel(scene, 44, 7, [0, 10, -36], 2.2);    // rim strip, behind
  panel(scene, 20, 12, [8, 4, 34], 1.2);     // soft fill from the camera side
  return scene;
}

/** Low sun: warm horizon glow, blue zenith, a bright sun disc low on the left. Lifestyle, outdoors, golden hour. */
export function sunsetEnvironment() {
  const scene = new THREE.Scene();
  scene.add(skyDome('c = mix(vec3(0.22,0.2,0.2), vec3(1.0,0.62,0.38), smoothstep(-0.25, 0.02, y)); c = mix(c, vec3(0.35,0.5,0.85), smoothstep(0.05, 0.75, y));'));
  const sun = new THREE.Mesh(new THREE.SphereGeometry(3.2, 32, 16), new THREE.MeshBasicMaterial({color: new THREE.Color(1, 0.8, 0.55).multiplyScalar(40)}));
  sun.position.set(-40, 9, 22); scene.add(sun);
  return scene;
}

/** Overcast sky: soft, shadowless, even. Matte, clay, ceramics, architecture. */
export function overcastEnvironment() {
  const scene = new THREE.Scene();
  scene.add(skyDome('c = mix(vec3(0.34), vec3(0.8), smoothstep(-0.3, 0.1, y)); c = mix(c, vec3(1.05), smoothstep(0.1, 1.0, y));'));
  return scene;
}

/** Dark studio: near-black with two narrow rim strips and a dim top light. Dark pages, premium, neon. */
export function darkEnvironment() {
  const scene = new THREE.Scene();
  scene.add(skyDome('c = mix(vec3(0.015), vec3(0.05), smoothstep(-0.2, 1.0, y));'));
  panel(scene, 5, 40, [-30, 10, -18], 3.5);
  panel(scene, 5, 40, [30, 10, -18], 3.5);
  panel(scene, 26, 18, [0, 34, 6], 1.2);
  return scene;
}

/**
 * Dark-field product studio: near-black surroundings, two tall strip softboxes at the sides, a top light.
 * Glass and liquids get dark defining edges and the long vertical highlights of bottle shots; chrome and
 * jewellery get crisp contrast. Nothing bright behind the subject, so grazing reflections at the edges stay dark.
 */
export function stripsEnvironment() {
  const scene = new THREE.Scene();
  scene.add(skyDome('c = mix(vec3(0.03), vec3(0.09), smoothstep(-0.3, 0.9, y));'));
  panel(scene, 6, 48, [-30, 8, 12], 4.2);  // strip, left and a little in front: a highlight line ~40% in from the edge
  panel(scene, 5, 48, [30, 8, 8], 3.2);    // strip, right
  panel(scene, 30, 14, [0, 36, 2], 2.4);   // top: caps, shoulders, rims
  panel(scene, 16, 8, [0, 3, 36], 0.6);    // faint front fill so faces toward the camera are not black
  panel(scene, 44, 22, [0, 17, -34], 1.3); // high behind: lids and flat tops reflect it; glass edges look below it and stay dark
  return scene;
}

/** Plain grey: neutral, low-contrast reflections that do not tint anything. Technical renders, colour-critical work. */
export function neutralEnvironment() {
  const scene = new THREE.Scene();
  scene.add(skyDome('c = vec3(0.5) + 0.12 * y;'));
  return scene;
}

const PROCEDURAL = {room: () => new RoomEnvironment(), softbox: softboxEnvironment, strips: stripsEnvironment, sunset: sunsetEnvironment, overcast: overcastEnvironment, dark: darkEnvironment, neutral: neutralEnvironment};
export const ENVIRONMENTS = Object.keys(PROCEDURAL);

/** An equirectangular image (.hdr / .exr / .jpg / .png URL) as a texture with equirect mapping. */
async function loadEquirect(url) {
  const ext = String(url).split('?')[0].split('.').pop().toLowerCase();
  let src;
  if (ext === 'hdr') { const {RGBELoader} = await import('three/addons/loaders/RGBELoader.js'); src = await new RGBELoader().loadAsync(url); }
  else if (ext === 'exr') { const {EXRLoader} = await import('three/addons/loaders/EXRLoader.js'); src = await new EXRLoader().loadAsync(url); }
  else { src = await new THREE.TextureLoader().loadAsync(url); src.colorSpace = THREE.SRGBColorSpace; }
  src.mapping = THREE.EquirectangularReflectionMapping;
  return src;
}

/** PMREM environment texture from a name above or an .hdr / .exr / .jpg / .png URL (equirectangular). */
export async function loadEnvironment(renderer, name = 'room') {
  const pmrem = new THREE.PMREMGenerator(renderer);
  let tex;
  if (PROCEDURAL[name]) tex = pmrem.fromScene(PROCEDURAL[name](), 0.04).texture;
  else { const src = await loadEquirect(name); tex = pmrem.fromEquirectangular(src).texture; src.dispose(); }
  pmrem.dispose();
  return tex;
}

/** The same environment as the path tracer samples it: a cube texture (procedural) or the equirect image itself. */
export async function pathTraceEnvironment(renderer, name = 'room') {
  if (!PROCEDURAL[name]) return loadEquirect(name);
  const rt = new THREE.WebGLCubeRenderTarget(256, {type: THREE.HalfFloatType});
  new THREE.CubeCamera(0.1, 1000, rt).update(renderer, PROCEDURAL[name]());
  return rt.texture;
}

export function resolveStudio(studio) {
  if (typeof studio === 'string') {
    if (!PRESETS[studio]) throw new Error(`Unknown studio preset "${studio}". Use one of: ${Object.keys(PRESETS).join(', ')}`);
    return structuredClone(PRESETS[studio]);
  }
  const base = PRESETS[studio?.preset ?? 'soft'];
  if (!base) throw new Error(`Unknown studio preset "${studio.preset}"`);
  return merge(structuredClone(base), studio);
}

/**
 * three.js refracts only opaque objects (and the background) through transmissive materials, so a transparent
 * shadow catcher vanishes behind glass. Drawn in the opaque list with its own alpha blending, it shows through.
 */
function seenThroughGlass(material) {
  Object.assign(material, {transparent: false, blending: THREE.CustomBlending, blendEquation: THREE.AddEquation,
    blendSrc: THREE.SrcAlphaFactor, blendDst: THREE.OneMinusSrcAlphaFactor, blendSrcAlpha: THREE.OneFactor, blendDstAlpha: THREE.OneMinusSrcAlphaFactor});
  material.needsUpdate = true;
}

/** Floor hit point of a ray from p along -dir (for estimating where shadows land). */
export function floorHit(p, dir, floorY) {
  const t = (p.y - floorY) / Math.max(dir.y, 0.05);
  return new THREE.Vector3(p.x - dir.x * t, floorY, p.z - dir.z * t);
}

export class Studio {
  /**
   * @param renderer WebGLRenderer
   * @param scene    Scene
   * @param P        resolved preset (see PRESETS)
   * @param bounds   {center: Vector3, radius: number, box: Box3}
   * @param opts     {azimuth (rad), floor: {y, shadow}, contact: false | {opacity, blur, height}, shadowColor}
   */
  constructor(renderer, scene, P, bounds, opts) {
    this.renderer = renderer; this.scene = scene; this.P = P; this.bounds = bounds;
    const az = opts.azimuth ?? 0, rot = d => new THREE.Vector3(...d).normalize().applyAxisAngle(new THREE.Vector3(0, 1, 0), az);
    renderer.toneMapping = P.toneMapping === 'aces' ? THREE.ACESFilmicToneMapping : P.toneMapping === 'agx' ? THREE.AgXToneMapping : THREE.NeutralToneMapping;
    renderer.toneMappingExposure = P.exposure;
    scene.environment = opts.environment; // from loadEnvironment(P.envMap)
    scene.environmentIntensity = P.env;
    scene.environmentRotation.y = az + (P.envRotation ?? 0);

    const {center, radius} = bounds;
    this.floorY = opts.floor?.y ?? 0;
    this.lights = new THREE.Group(); this.lights.name = 'w3d-studio'; scene.add(this.lights);
    const light = (spec, cast) => {
      const l = new THREE.DirectionalLight(spec.color ?? 0xffffff, spec.intensity);
      l.userData.dir = rot(spec.dir);
      l.position.copy(center).addScaledVector(l.userData.dir, radius * 6);
      l.target.position.copy(center);
      this.lights.add(l, l.target);
      if (cast) l.castShadow = true;
      return l;
    };
    this.key = light(P.key, true);
    if (P.fill?.intensity) this.fill = light(P.fill);
    if (P.hemi) { this.hemi = new THREE.HemisphereLight(P.hemi.sky ?? 0xffffff, P.hemi.ground ?? 0x888888, P.hemi.intensity ?? 0.5); this.lights.add(this.hemi); }
    if (P.rim?.intensity) this.rim = light(P.rim);
    this.keyDir = this.key.userData.dir.clone();

    // Directional shadow fitted tightly around the objects and the floor area their shadow can reach.
    const s = this.key.shadow;
    s.mapSize.set(2048, 2048);
    s.bias = -0.0004;
    s.normalBias = 0.002 * radius;
    this.softness = P.key.softness ?? 1;
    this.fitShadow();

    // Shadow catcher: invisible floor that only shows shadows (black with alpha).
    const floorOpacity = opts.floor?.shadow ?? P.floor;
    this.floor = null;
    if (opts.floor !== false && floorOpacity > 0) {
      // not tone-mapped: the shadow colour on screen is exactly shadowColor, which the shadow sprites rely on
      const mat = new THREE.ShadowMaterial({opacity: floorOpacity, color: opts.shadowColor ?? 0x000000, depthWrite: false, toneMapped: false});
      if (opts.transmissive) seenThroughGlass(mat);
      this.floorMaterial = mat;
      // a floor that is not wanted in a pass stays in place with a material that draws nothing
      this.floorGhost = new THREE.MeshBasicMaterial({colorWrite: false, depthWrite: false});
      this.floor = new THREE.Mesh(new THREE.PlaneGeometry(radius * 60, radius * 60), mat);
      this.floor.rotation.x = -Math.PI / 2; this.floor.position.set(center.x, this.floorY, center.z);
      this.floor.receiveShadow = true; this.floor.name = 'w3d-floor';
      // VSM would also draw this receiver into the shadow map, and where the endless floor leaves the fitted
      // shadow frustum that shows up as a stray line. It only needs to receive, so give it a depth pass that draws nothing.
      this.floor.customDepthMaterial = new THREE.MeshDepthMaterial({colorWrite: false, depthWrite: false});
      scene.add(this.floor);
    }
    const contactOpacity = opts.contact === false ? 0 : (opts.contact?.opacity ?? P.contact);
    this.contact = opts.floor !== false && contactOpacity > 0 ? new ContactShadow(renderer, scene, bounds, this.floorY, {...opts.contact, opacity: contactOpacity, color: opts.shadowColor}) : null;
    if (this.contact && opts.transmissive) seenThroughGlass(this.contact.plane.material);
  }

  /** Points whose projection must stay inside the frame: box corners plus where their shadow lands. */
  extentPoints(box = this.bounds.box) {
    const pts = [];
    for (const x of [box.min.x, box.max.x]) for (const y of [box.min.y, box.max.y]) for (const z of [box.min.z, box.max.z]) {
      const p = new THREE.Vector3(x, y, z); pts.push(p);
      if (this.floor || this.contact) pts.push(floorHit(p, this.keyDir, this.floorY));
    }
    return pts;
  }

  fitShadow(points = this.extentPoints()) {
    const cam = this.key.shadow.camera;
    // a plain Object3D's lookAt points +z at the target, so +z is the distance from the light here
    const view = new THREE.Object3D(); view.position.copy(this.key.position); view.lookAt(this.key.target.position); view.updateMatrixWorld();
    const inv = view.matrixWorld.clone().invert();
    let m = 0, zmin = Infinity, zmax = -Infinity;
    for (const p of points) { const q = p.clone().applyMatrix4(inv); m = Math.max(m, Math.abs(q.x), Math.abs(q.y)); zmin = Math.min(zmin, q.z); zmax = Math.max(zmax, q.z); }
    m *= 1.15;
    Object.assign(cam, {left: -m, right: m, top: m, bottom: -m, near: Math.max(0.01, zmin - this.bounds.radius), far: zmax + this.bounds.radius});
    cam.updateProjectionMatrix();
    // VSM blur is measured in shadow-map texels; keep the penumbra a fixed share of the object size.
    const s = this.key.shadow;
    s.radius = Math.max(2, (0.0273 * this.softness * this.bounds.radius) / ((2 * m) / s.mapSize.x));
    s.blurSamples = Math.round(Math.min(64, Math.max(12, s.radius * 0.6)));
  }

  /** Show or hide the floor's shadows for a pass; refreshes the contact shadow from whatever is visible. */
  setFloor(on) {
    if (this.floor) this.floor.material = on ? this.floorMaterial : this.floorGhost;
    if (this.contact) {
      this.contact.group.visible = false;
      if (on) { if (this.floor) this.floor.visible = false; this.contact.update(); if (this.floor) this.floor.visible = true; }
      this.contact.group.visible = on;
    }
  }
}

/**
 * Soft contact shadow (ambient occlusion where objects meet the floor), after three.js' webgl_shadow_contact:
 * render the scene's depth from below, blur it, show it as a dark plane on the floor.
 */
class ContactShadow {
  constructor(renderer, scene, bounds, floorY, {opacity = 0.45, blur = 1, height = 1, color = 0x000000, darkness = 1.4} = {}) {
    this.renderer = renderer; this.scene = scene;
    const {box, radius, center} = bounds;
    // square around the centre that still covers the footprint when the objects spin on a turntable
    let reach = 0;
    for (const x of [box.min.x, box.max.x]) for (const z of [box.min.z, box.max.z]) reach = Math.max(reach, Math.hypot(x - center.x, z - center.z));
    const size = reach * 2 + radius * 1.6;
    const res = 1024;
    this.rt = new THREE.WebGLRenderTarget(res, res); this.rt.texture.generateMipmaps = false;
    this.rtBlur = new THREE.WebGLRenderTarget(res, res); this.rtBlur.texture.generateMipmaps = false;
    this.group = new THREE.Group(); this.group.name = 'w3d-contact';
    this.group.position.set(center.x, floorY, center.z);
    const geo = new THREE.PlaneGeometry(size, size).rotateX(Math.PI / 2);
    // the blurred depth only carries alpha; colour comes from the shadow colour
    const mat = new THREE.MeshBasicMaterial({map: this.rt.texture, opacity, transparent: true, depthWrite: false, color, toneMapped: false});
    mat.onBeforeCompile = shader => { shader.fragmentShader = shader.fragmentShader.replace('#include <map_fragment>', '#include <map_fragment>\n\tdiffuseColor.rgb = diffuse;'); };
    this.plane = new THREE.Mesh(geo, mat); this.plane.renderOrder = 1; this.plane.scale.y = -1; this.plane.position.y = radius * 0.0005;
    this.blurPlane = new THREE.Mesh(geo); this.blurPlane.visible = false;
    this.group.add(this.plane, this.blurPlane);
    this.camera = new THREE.OrthographicCamera(-size / 2, size / 2, size / 2, -size / 2, 0, radius * 0.42 * height);
    this.camera.rotation.x = Math.PI / 2;
    this.group.add(this.camera);
    this.depth = new THREE.MeshDepthMaterial();
    this.depth.userData.darkness = {value: darkness};
    this.depth.onBeforeCompile = shader => {
      shader.uniforms.darkness = this.depth.userData.darkness;
      shader.fragmentShader = 'uniform float darkness;\n' + shader.fragmentShader.replace('gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );', 'gl_FragColor = vec4( vec3( 0.0 ), ( 1.0 - fragCoordZ ) * darkness );');
    };
    // depth-tested, so where objects overlap seen from below the one nearest the floor (the darkest) wins: stacks stay right
    this.depth.depthTest = true; this.depth.depthWrite = true;
    this.hBlur = new THREE.ShaderMaterial(HorizontalBlurShader); this.hBlur.depthTest = false;
    this.vBlur = new THREE.ShaderMaterial(VerticalBlurShader); this.vBlur.depthTest = false;
    // blur in texture space: ~6% of the object radius, a soft but hugging falloff
    this.amount = (0.06 * radius * blur) / size * 64 * (res / 256);
    scene.add(this.group);
    this.group.updateMatrixWorld(true);
  }

  update() {
    const r = this.renderer, s = this.scene;
    const target = r.getRenderTarget(), alpha = r.getClearAlpha(), color = r.getClearColor(new THREE.Color());
    const bg = s.background; s.background = null;
    this.group.visible = false;
    s.overrideMaterial = this.depth;
    r.setClearColor(0x000000, 0);
    r.setRenderTarget(this.rt); r.clear(); r.render(s, this.camera);
    s.overrideMaterial = null;
    this.group.visible = true;
    this.blur(this.amount); this.blur(this.amount * 0.4);
    r.setRenderTarget(target); r.setClearColor(color, alpha); s.background = bg;
  }

  blur(amount) {
    const r = this.renderer, res = this.rt.width;
    this.blurPlane.visible = true;
    this.blurPlane.material = this.hBlur; this.hBlur.uniforms.tDiffuse.value = this.rt.texture; this.hBlur.uniforms.h.value = amount / res;
    r.setRenderTarget(this.rtBlur); r.render(this.blurPlane, this.camera);
    this.blurPlane.material = this.vBlur; this.vBlur.uniforms.tDiffuse.value = this.rtBlur.texture; this.vBlur.uniforms.v.value = amount / res;
    r.setRenderTarget(this.rt); r.render(this.blurPlane, this.camera);
    this.blurPlane.visible = false;
  }
}
