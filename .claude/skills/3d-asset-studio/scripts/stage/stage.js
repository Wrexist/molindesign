// The stage runs inside headless Chromium. It loads a scene module, applies a look, lights and frames it,
// and renders one of four outputs:
//   layers   — one sprite + one shadow sprite per object, for web choreography (verified to rebuild the render)
//   still    — one finished image at any size and aspect (hero, product shot, social card, poster)
//   icons    — every object as its own image with identical camera, light and size (icon sets, catalogues)
//   sequence — frames of an animation or turntable (flipbooks, animated WebP, video)
// plus optional model exports (GLB, USDZ, STL, OBJ) and previews for review.
import * as THREE from 'three';
import {Studio, resolveStudio, merge, loadEnvironment, pathTraceEnvironment} from './studio.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import * as px from './pixels.js';
import {applyLook, LOOKS} from './looks.js';
import {bloom, paintBackground, vignette, filmGrain} from './post.js';
import {exportRoot, toGLB, toUSDZ, toSTL, toOBJ} from './exporters.js';
import {rng} from 'w3d/materials.js';

const A = window.W3D_ARGS;
const state = (window.__w3d = {done: false});
const warnings = [];
const UNIT_SCALE = {glb: 0.1, usdz: 0.1, obj: 0.1, stl: 100};
const log = m => (window.w3dLog ? window.w3dLog(String(m)) : console.log(m));
const warn = m => { warnings.push(m); log('warning: ' + m); };
const t0 = performance.now();
const clock = () => ((performance.now() - t0) / 1000).toFixed(1) + 's';
const save = async (target, blob) => window.w3dSave(target, await px.toBase64(blob));
const round = (v, d = 3) => +v.toFixed(d);
// file names: letters with accents keep their base letter (säkerhet → sakerhet, not s-kerhet)
const slug = s => String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ø/gi, 'o').replace(/æ/gi, 'ae').replace(/ß/g, 'ss').replace(/ł/gi, 'l')
  .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'layer';

const DEFAULTS = {
  mode: 'layers',        // layers | still | icons | sequence | none
  look: 'photoreal',     // photoreal | clay | mono | toon | lowpoly | lineart | wireframe
  width: 1000,           // output width in px (layers/still/sequence); height follows the content, or `size`
  size: null,            // [w, h]: exact output size for still/sequence (content fitted inside with `margin`, placed by `align`)
  margin: 0.1, align: [0.5, 0.5],
  ss: 2, quality: 0.9, formats: ['webp'], padding: 4,
  studio: 'soft',
  camera: {elevation: 16, azimuth: 0, distance: 5.8, position: null, target: null, projection: 'perspective', iso: false},
  floor: {y: 0}, contact: {}, shadowColor: '#000000',
  background: '#f2f2ee', // the page colour: previews only
  backdrop: 'transparent', // painted behind still/icon/sequence outputs: 'transparent' | '#hex' | {linear: [a, b]} | {radial: [a, b]}
  order: 'auto',
  ao: false,             // baked ambient occlusion: true | {strength, distance, samples, self}
  post: {bloom: false, vignette: 0, grain: 0},
  icons: {size: [512, 512], margin: 0.07, uniform: false},
  sequence: {frames: 48, fps: 24, turntable: false, loop: true},
  motion: {type: 'drop', stagger: 480},
};

try {
  await main();
} catch (e) {
  state.error = (e && e.stack) || String(e);
} finally {
  state.done = true;
}

async function main() {
  const mod = await import(A.scene);
  const build = mod.default ?? mod.build;
  if (typeof build !== 'function') throw new Error('The scene module must export a default function build(ctx) that returns layers.');
  const own = mod.settings ?? {};
  // A look brings studio/AO defaults. From the scene they sit under its own settings; from the CLI they win.
  const lookName = A.look ?? own.look ?? 'photoreal';
  if (!LOOKS[lookName]) throw new Error(`Unknown look "${lookName}". Use one of: ${Object.keys(LOOKS).join(', ')}`);
  let S = A.look ? merge(merge(structuredClone(DEFAULTS), own), LOOKS[lookName]) : merge(merge(structuredClone(DEFAULTS), LOOKS[lookName]), own);
  S.look = lookName;
  for (const k of ['width', 'ss', 'quality', 'mode']) if (A[k]) S[k] = A[k];
  if (A.size) S.size = A.size;
  if (A.frames) S.sequence.frames = A.frames;
  if (A.turntable) { S.mode = 'sequence'; S.sequence.turntable = true; S.sequence.frames = A.turntable; }
  if (A.ao != null) S.ao = A.ao;
  // --set path=value overrides any setting for one run (compare variants without editing the scene)
  for (const kv of [].concat(A.set ?? [])) {
    const i = String(kv).indexOf('=');
    if (i < 1) throw new Error(`--set wants path=value (camera.elevation=24, studio=bright), got "${kv}"`);
    const keys = kv.slice(0, i).split('.'), raw = kv.slice(i + 1);
    let v; try { v = JSON.parse(raw); } catch { v = raw; }
    let o = S;
    for (const k of keys.slice(0, -1)) {
      if (typeof o[k] === 'string' && k === 'studio') o[k] = {preset: o[k]}; // --set studio.key.softness=3 keeps the preset
      else if (typeof o[k] !== 'object' || o[k] === null) o[k] = {};
      o = o[k];
    }
    o[keys[keys.length - 1]] = v;
  }
  if (A.draft) {
    S.ss = 1; S.width = Math.min(S.width, 640);
    if (S.size) { const k = Math.min(1, 640 / Math.max(...S.size)); S.size = S.size.map(v => Math.round(v * k)); } // same framing, fewer pixels
    S.icons.size = S.icons.size.map(v => Math.min(v, 256));
    if (S.ao) S.ao = {...(typeof S.ao === 'object' ? S.ao : {}), samples: 12};
  }
  const mode = S.mode;
  if (!['layers', 'still', 'icons', 'sequence', 'none'].includes(mode)) throw new Error(`Unknown mode "${mode}" (layers, still, icons, sequence, or none to only export models)`);
  const name = slug(A.name ?? S.name ?? A.sceneName);
  await window.w3dName?.(name);

  const renderer = new THREE.WebGLRenderer({antialias: true, alpha: true, preserveDrawingBuffer: true, powerPreference: 'high-performance'});
  renderer.setPixelRatio(1);
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.VSMShadowMap;
  renderer.localClippingEnabled = true;
  document.body.appendChild(renderer.domElement);
  const gl = renderer.getContext();
  const maxSize = Math.min(renderer.capabilities.maxTextureSize, gl.getParameter(gl.MAX_RENDERBUFFER_SIZE));

  const scene = new THREE.Scene();
  globalThis.w3dRenderer = renderer; // models.js needs it for KTX2 textures
  const meta = {};
  const ctx = {THREE, scene, renderer, settings: S, rng, mode, look: lookName, log, warn, meta}; // meta: anything the scene wants in meta.json
  const layers = normalize(await build(ctx));
  for (const L of layers) if (!L.object.parent) scene.add(L.object);
  scene.updateMatrixWorld(true);

  // ---------------------------------------------------------------- bounds, look, studio, camera
  const measure = () => {
    const box = new THREE.Box3();
    for (const L of layers) { const b = new THREE.Box3().setFromObject(L.object, true); if (b.isEmpty()) throw new Error(`Layer "${L.name}" has no geometry.`); L.box = b; box.union(b); }
    return {box, center: box.getCenter(new THREE.Vector3()), radius: box.getBoundingSphere(new THREE.Sphere()).radius};
  };
  const bounds = measure();
  const lineMaterials = [];
  applyLook(lookName, layers, {...(S.lookOptions ?? {}), radius: bounds.radius, lineMaterials});
  const floorY = S.floor === false ? bounds.box.min.y : (S.floor.y ?? 0);
  if (S.floor !== false) {
    const gap = bounds.box.min.y - floorY;
    if (gap < -0.01 * bounds.radius) warn(`objects reach ${round(-gap)} below the floor (y = ${floorY}); stand them on it (see onFloor in w3d/geometry.js)`);
    else if (gap > 0.01 * bounds.radius) log(`note: objects hover ${round(gap)} above the floor, so their shadows detach`);
  }
  const P = resolveStudio(S.studio);
  // the colour the set is painted in (for the 'sweep' environment): the backdrop, or the page colour behind sprites
  const setTint = backdropTint(S.backdrop && S.backdrop !== 'transparent' ? S.backdrop : S.background);
  const environment = await loadEnvironment(renderer, P.envMap ?? 'room', {tint: setTint});
  const camCfg = S.camera.iso ? {...S.camera, projection: 'orthographic', elevation: 35.264, azimuth: S.camera.azimuth || 45} : S.camera;
  const azimuth = THREE.MathUtils.degToRad(camCfg.azimuth ?? 0);
  // glass: lighter, stochastic shadows (clear glass passes most light) and a floor the transmission pass can see
  let transmissive = false;
  for (const L of layers) L.object.traverse(o => {
    const mats = [].concat(o.material ?? []), t = Math.max(0, ...mats.map(m => m.transmission ?? 0));
    if (t <= 0 || !o.isMesh) return;
    transmissive = true;
    // light through one wall: transmission × the tint (dark wine-bottle glass still casts a dark shadow)
    const m = mats.find(m => m.transmission > 0), c = m.attenuationColor ?? new THREE.Color(1, 1, 1);
    const through = t * Math.pow((c.r * 0.3 + c.g * 0.59 + c.b * 0.11), (m.thickness || 0.3) / Math.max(m.attenuationDistance, 1e-3)) * ((m.color?.r + m.color?.g + m.color?.b) / 3 || 1);
    if (!o.customDepthMaterial) o.customDepthMaterial = new THREE.MeshDepthMaterial({depthPacking: THREE.RGBADepthPacking, alphaHash: true, opacity: 1 - 0.65 * through});
  });
  const studio = new Studio(renderer, scene, P, bounds, {azimuth, environment, transmissive, floor: S.floor === false ? false : {...S.floor, y: floorY}, contact: S.contact, shadowColor: S.shadowColor});
  // per-material reflections: with scene.environment three applies scene.environmentIntensity to every material, so
  // a material that asks for its own envMapIntensity (≠ 1), or for its own environment by name
  // (userData.w3dEnvMap: a gold cap wants 'softbox' while the glass under it wants 'sweep'), gets it directly
  const envs = new Map([[P.envMap ?? 'room', environment]]), ownEnv = new Set();
  for (const L of layers) L.object.traverse(o => {
    for (const m of [].concat(o.material ?? [])) if (m?.isMeshStandardMaterial && !m.envMap && (m.envMapIntensity !== 1 || m.userData.w3dEnvMap)) ownEnv.add(m);
  });
  for (const m of ownEnv) {
    const name = m.userData.w3dEnvMap ?? P.envMap ?? 'room';
    if (!envs.has(name)) envs.set(name, await loadEnvironment(renderer, name, {tint: setTint}));
    m.envMap = envs.get(name); m.envMapRotation.copy(scene.environmentRotation); m.envMapIntensity *= P.env; m.needsUpdate = true;
  }
  const camera = aimCamera(camCfg, bounds);
  const shadowRgb = px.hexToRgb(S.shadowColor);

  if (S.ao) {
    // AO is baked per vertex in the rest pose. Objects that move on their own (layers, icons, animations)
    // are only occluded by themselves, so no ghost darkening is left where a neighbour will be.
    const {bakeAO} = await import('w3d/ao.js');
    const o = typeof S.ao === 'object' ? S.ao : {};
    const moving = mode === 'sequence' && mod.animate && !S.sequence.turntable;
    const self = o.self ?? (mode === 'layers' || mode === 'icons' || moving);
    const r = bakeAO(layers.map(L => L.object), {samples: o.samples ?? 32, distance: o.distance ?? null, strength: o.strength ?? 1, self, radius: bounds.radius});
    log(`ambient occlusion baked on ${r.vertices} vertices (${self ? 'each object on its own' : 'objects on each other'}) · ${clock()}`);
  }

  // ---------------------------------------------------------------- materials per pass
  const ghosts = new Map(), holdouts = new Map(), ids = new Map(), glows = new Map();
  const ghostFor = m => { const key = m.side; if (!ghosts.has(key)) ghosts.set(key, new THREE.MeshBasicMaterial({colorWrite: false, depthWrite: false, side: m.side})); return ghosts.get(key); };
  const holdoutFor = m => { const key = m.side; if (!holdouts.has(key)) holdouts.set(key, new THREE.MeshBasicMaterial({colorWrite: false, depthWrite: true, side: m.side})); return holdouts.get(key); };
  const idFor = (L, m) => { const key = L.index + ':' + m.side; if (!ids.has(key)) ids.set(key, new THREE.MeshBasicMaterial({color: new THREE.Color().setRGB((L.index + 1) / 255, 0, 0, THREE.LinearSRGBColorSpace), side: m.side})); return ids.get(key); };
  const glowFor = m => {
    if (!glows.has(m)) {
      const e = m.emissive && (m.emissiveIntensity ?? 1) > 0 ? m.emissive.clone().multiplyScalar(m.emissiveIntensity ?? 1) : null;
      glows.set(m, e && e.getHex() ? new THREE.MeshBasicMaterial({color: e, map: m.emissiveMap ?? null, side: m.side, toneMapped: false}) : new THREE.MeshBasicMaterial({color: 0x000000, side: m.side}));
    }
    return glows.get(m);
  };
  const realMaterial = new WeakMap(), realOrder = new WeakMap(); // not userData: exporters serialise userData
  for (const L of layers) L.object.traverse(o => { if (o.material) { realMaterial.set(o, o.material); realOrder.set(o, o.renderOrder); if (!o.userData.w3dHelper) { o.castShadow = L.cast; o.receiveShadow = true; } } });
  const apply = (L, mode) => {
    L.object.visible = mode !== 'hidden';
    if (mode === 'hidden') return;
    L.object.traverse(o => {
      const real = realMaterial.get(o); if (!real) return;
      if (o.userData.w3dLine) { o.visible = mode === 'real'; return; }
      const pick = mode === 'real' ? m => m : mode === 'ghost' ? ghostFor : mode === 'holdout' ? holdoutFor : mode === 'glow' ? glowFor : m => idFor(L, m);
      o.material = Array.isArray(real) ? real.map(pick) : pick(real);
      o.renderOrder = mode === 'holdout' ? -1000 : realOrder.get(o); // a holdout must fill the depth buffer first
    });
  };

  // ---------------------------------------------------------------- framing
  // Crop the camera's view to the content (setViewOffset keeps the perspective), probe at low resolution to
  // find the real alpha extent, then frame that at the requested size.
  let W = 0, H = 0, ss = S.ss;
  const view = {F: 10000, x: 0, y: 0, w: 10000, h: 10000};
  // Frosted glass: three blurs rough transmission by about renderWidth^roughness pixels, so the same roughness looks
  // three times frostier in a 640 px draft than in a 3200 px render. Keep the blur a constant share of the frame,
  // with the authored value meaning "at 2048 px".
  const frosted = new Map();
  for (const L of layers) L.object.traverse(o => { for (const m of [].concat(o.material ?? [])) if (m?.transmission > 0 && !frosted.has(m)) frosted.set(m, m.userData.w3dFrost ?? m.roughness); });
  const matchFrost = w => { const k = Math.log(2048) / Math.log(Math.max(64, w)); for (const [m, r] of frosted) m.roughness = r > 0 ? Math.min(1, Math.max(0, 1 - (1 - r) * k)) : 0; };
  const setView = (rect, width, height = null) => {
    Object.assign(view, rect);
    W = Math.max(8, Math.round(width)); H = height ? Math.max(8, Math.round(height)) : Math.max(8, Math.round(W * rect.h / rect.w));
    view.h = view.w * H / W;
    ss = Math.max(1, Math.min(S.ss, Math.floor(maxSize / Math.max(W, H))));
    camera.setViewOffset(view.F, view.F, view.x, view.y, view.w, view.h); // also sets aspect to the full (square) view
    renderer.setSize(W * ss, H * ss, false);
    matchFrost(W * ss);
    for (const m of lineMaterials) m.resolution.set(W * ss, H * ss);
  };
  const extentRect = points => {
    camera.clearViewOffset();
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const p of points) { const v = p.clone().project(camera); x0 = Math.min(x0, v.x); x1 = Math.max(x1, v.x); y0 = Math.min(y0, v.y); y1 = Math.max(y1, v.y); }
    const F = view.F, r = {F, x: (x0 + 1) / 2 * F, y: (1 - y1) / 2 * F, w: (x1 - x0) / 2 * F, h: (y1 - y0) / 2 * F};
    const pad = Math.max(r.w, r.h) * 0.06;
    return {F, x: r.x - pad, y: r.y - pad, w: r.w + pad * 2, h: r.h + pad * 2};
  };
  const shoot = () => { renderer.setRenderTarget(null); renderer.render(scene, camera); return px.toImageData(renderer.domElement, W, H); };
  const beautyModes = (only = null) => { layers.forEach(L => apply(L, !only || only.includes(L) ? 'real' : 'hidden')); studio.setFloor(true); };
  const frameContent = (points, width, render) => {
    let rect = extentRect(points);
    for (let attempt = 0; attempt < 4; attempt++) {
      setView(rect, Math.min(480, width));
      const probe = render();
      const edge = px.touchesEdge(probe, 3);
      if (edge.left || edge.right || edge.top || edge.bottom) {
        const gx = rect.w * 0.25, gy = rect.h * 0.25;
        rect = {...rect, x: rect.x - (edge.left ? gx : 0), y: rect.y - (edge.top ? gy : 0), w: rect.w + (edge.left ? gx : 0) + (edge.right ? gx : 0), h: rect.h + (edge.top ? gy : 0) + (edge.bottom ? gy : 0)};
        continue;
      }
      const b = px.alphaBox(probe, 2);
      if (!b) throw new Error('Nothing visible: check that the objects are in front of the camera and have materials.');
      const k = rect.w / W, pad = (S.padding / width) * (b.w * k) + k;
      return {F: rect.F, x: rect.x + b.x * k - pad, y: rect.y + b.y * k - pad, w: b.w * k + pad * 2, h: b.h * k + pad * 2};
    }
    warn('content still touches the frame after widening; shadows may be clipped');
    return rect;
  };
  /** Grow a tight content rect to an exact aspect, with a margin and the content placed at `align`. */
  const fitRect = (tight, [w, h], margin = 0.1, [ax, ay] = [0.5, 0.5]) => {
    const aspect = w / h, inner = 1 - 2 * margin;
    let rw = tight.w / inner, rh = tight.h / inner;
    if (rw / rh > aspect) rh = rw / aspect; else rw = rh * aspect;
    const x = tight.x - (rw - tight.w) * ax, y = tight.y - (rh - tight.h) * ay;
    return {F: tight.F, x, y, w: rw, h: rh};
  };
  // A painted backdrop is rendered as the scene background, so glass and reflections see it too.
  const opaqueBackdrop = mode !== 'layers' && S.backdrop && S.backdrop !== 'transparent';
  const setBackdrop = () => {
    if (!opaqueBackdrop) return;
    const c = paintBackground(px.canvas(W, H), S.backdrop), tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    scene.background?.dispose?.();
    scene.background = tex;
  };
  const finish = async (img, {backdrop = S.backdrop, post = S.post} = {}) => {
    // img: ImageData of the render (transparent, or already on the backdrop); returns a finished canvas
    let c = px.canvas(img.width, img.height); px.ctx2d(c).putImageData(img, 0, 0);
    if (post?.bloom) {
      // glow sources = an emissive-only pass (everything else black), so only lit things bloom
      const bg = scene.background; scene.background = null;
      layers.forEach(L => apply(L, L.object.visible ? 'glow' : 'hidden'));
      studio.setFloor(false);
      const glow = shoot(), gc = px.canvas(W, H); px.ctx2d(gc).putImageData(glow, 0, 0);
      layers.forEach(L => apply(L, L.object.visible ? 'real' : 'hidden')); studio.setFloor(true);
      scene.background = bg;
      c = bloom(c, gc, post.bloom === true ? {} : post.bloom);
    }
    if (!opaqueBackdrop) c = paintBackground(c, backdrop);
    if (post?.vignette) vignette(c, post.vignette);
    if (post?.grain) filmGrain(c, post.grain);
    return c;
  };
  const files = [];
  const writeImage = async (c, base, formats = S.formats) => {
    for (const f of [].concat(formats)) {
      const type = f === 'png' ? 'image/png' : f === 'jpg' || f === 'jpeg' ? 'image/jpeg' : 'image/webp';
      let src = c;
      if (type === 'image/jpeg') src = paintBackground(c, S.backdrop === 'transparent' ? S.background : S.backdrop); // JPEG has no alpha
      const blob = await px.encode(src, type, S.quality);
      const file = `${base}.${f === 'jpeg' ? 'jpg' : f}`;
      await save('out/' + file, blob); files.push(file);
    }
  };
  const report = {name, mode, look: lookName, scene: meta, layers: [], warnings, files, background: typeof S.backdrop === 'string' && S.backdrop !== 'transparent' ? S.backdrop : S.background};

  // ---------------------------------------------------------------- modes
  if (mode === 'layers') await renderLayers();
  else if (mode === 'still') await renderStill();
  else if (mode === 'icons') await renderIcons();
  else if (mode === 'sequence') await renderSequence();

  // ---------------------------------------------------------------- model exports (any mode)
  const wants = [].concat(A.export ?? S.export ?? []).flatMap(s => String(s).split(',')).filter(Boolean);
  if (A.glb) wants.push('glb');
  if (wants.length) {
    layers.forEach(L => apply(L, 'real'));
    const root = exportRoot(layers, name);
    for (const f of [...new Set(wants)]) {
      let data, ext = f;
      // scene units are 10 cm: glTF, USDZ and OBJ files are in metres, STL in millimetres (what slicers assume)
      root.scale.setScalar(UNIT_SCALE[f] ?? 0.1);
      root.rotation.x = f === 'stl' ? Math.PI / 2 : 0; // slicers and CAD are Z-up
      root.updateMatrixWorld(true);
      if (f === 'glb') data = new Blob([await toGLB(root)], {type: 'model/gltf-binary'});
      else if (f === 'usdz') { const u = await toUSDZ(root); data = new Blob([u.data], {type: 'model/vnd.usdz+zip'}); if (u.doubled) log(`usdz: ${u.doubled} double-sided parts given real back faces (USDZ has no double-sided surfaces)`); }
      else if (f === 'stl') data = new Blob([(await toSTL(root)).buffer], {type: 'model/stl'});
      else if (f === 'obj') data = new Blob([await toOBJ(root)], {type: 'text/plain'});
      else { warn(`unknown export format "${f}" (glb, usdz, stl, obj)`); continue; }
      await save(`out/${name}.${ext}`, data); files.push(`${name}.${ext}`);
      log(`${ext} ${(data.size / 1024).toFixed(0)} kB`);
    }
    report.exports = wants;
  }
  report.renderSeconds = round((performance.now() - t0) / 1000, 1);
  state.report = report;

  // ================================================================ layers
  async function renderLayers() {
    const tight = frameContent(studio.extentPoints(), S.width, () => { beautyModes(); return shoot(); });
    setView(tight, S.width);
    log(`frame ${W}×${H} (render ${W * ss}×${H * ss}, ${ss}× supersampling) · ${clock()}`);
    const order = paintOrder(layers, S.order, () => idPasses(layers, apply, renderer, scene, camera, studio, W, H));
    const zOf = new Map(order.map((k, z) => [k, z]));
    for (const L of layers) for (const j of L.holdout) if (zOf.get(j) > zOf.get(L.index)) warn(`"${L.name}" holds out "${layers[j].name}" but is painted before it; put it after in settings.order`);
    log('paint order (back to front): ' + order.map(k => layers[k].name).join(' → '));
    report.frame = {width: W, height: H};
    report.order = order.map(k => layers[k].name);

    beautyModes();
    const beauty = shoot();
    const beautyCanvas = px.canvas(W, H); px.ctx2d(beautyCanvas).putImageData(beauty, 0, 0);
    if (A.draft) { await previews({name, W, H, S, beautyCanvas, layers: [], verify: null, draft: true}); log(`draft done · ${clock()}`); return; }

    // For the layer painted at position z:
    //   object = the object alone (earlier layers stay as invisible shadow casters, so their shadows on it are baked)
    //   shadow = ratio of "everything before z, with this object as an invisible caster" over "everything before z"
    // Painted back to front (shadow, object, shadow, object, …) the layers rebuild the beauty render exactly.
    const pass = (k, kind) => {
      const kz = zOf.get(k);
      layers.forEach((L, j) => {
        const jz = zOf.get(j);
        let m = 'hidden';
        if (kind === 'object') m = j === k ? 'real' : layers[k].holdout.includes(j) ? 'holdout' : jz < kz && !layers[k].clean ? 'ghost' : 'hidden';
        else if (kind === 'caster') m = j === k ? 'ghost' : jz < kz ? 'real' : 'hidden';
        else if (kind === 'upto') m = jz <= kz ? 'real' : 'hidden';
        apply(L, m);
      });
      studio.setFloor(kind !== 'object');
      return shoot();
    };
    const emit = async (img, box, file) => {
      const c = px.crop(img, box);
      const blob = await px.encode(c, 'image/webp', S.quality);
      await save('out/' + file, blob); files.push(file);
      if (A.png) { const png = await px.encode(c, 'image/png'); const f = file.replace(/\.webp$/, '.png'); await save('out/' + f, png); files.push(f); }
      return {file, box, blob, canvas: c, bytes: blob.size};
    };
    const pct = (v, of) => round(v / of * 100);
    const sprite = (s, origin) => s && {src: s.file, width: s.box.w, height: s.box.h, left: pct(s.box.x, W), top: pct(s.box.y, H), w: pct(s.box.w, W), origin: origin.map(v => round(v, 2)), bytes: s.bytes};

    let before = null;
    for (let z = 0; z < order.length; z++) {
      const k = order[z], L = layers[k];
      const objImg = pass(k, 'object');
      const obox = px.alphaBox(objImg, 1);
      if (!obox) { warn(`"${L.name}" is not visible from this camera; skipped`); before = z === order.length - 1 ? beauty : pass(k, 'upto'); continue; }
      L.sprite = await emit(objImg, obox, `${L.name}.webp`);
      if (L.shadow) {
        const after = pass(k, 'caster');
        const sh = px.ratioShadow(before, after, shadowRgb);
        const sbox = sh.weight > 3 ? px.alphaBox(sh.image, 2) : null;
        if (sbox) L.shadowSprite = await emit(sh.image, sbox, `${L.name}-shadow.webp`);
      }
      before = z === order.length - 1 ? beauty : pass(k, 'upto');
      const b = L.box, contact = new THREE.Vector3((b.min.x + b.max.x) / 2, b.min.y, (b.min.z + b.max.z) / 2).project(camera);
      const cx = (contact.x + 1) / 2 * W, cy = (1 - contact.y) / 2 * H;
      report.layers.push({
        name: L.name, index: L.index, z, contact: [pct(cx, W), pct(cy, H)],
        motion: L.motion ?? S.motion.type ?? 'drop', delay: L.delay ?? Math.round(L.index * (S.motion.stagger ?? 0)),
        ...(L.idle ?? S.motion.idle ? {idle: L.idle ?? S.motion.idle} : {}), ...(L.style ? {style: L.style} : {}),
        object: sprite(L.sprite, [(cx - obox.x) / obox.w * 100, 100]),
        shadow: L.shadowSprite ? sprite(L.shadowSprite, [(cx - L.shadowSprite.box.x) / L.shadowSprite.box.w * 100, (cy - L.shadowSprite.box.y) / L.shadowSprite.box.h * 100]) : null,
      });
      log(`layer ${z + 1}/${order.length} ${L.name}${L.shadowSprite ? ' + shadow' : ''} · ${clock()}`);
    }
    report.layers.sort((a, b) => a.z - b.z);

    // Paint the layers back to front like the browser does and compare with the beauty render:
    // first the exact sprites (does the layering hold?), then the decoded WebPs (what compression costs).
    const raw = [], shipped = [];
    for (const k of order) for (const s of [layers[k].shadowSprite, layers[k].sprite]) if (s) { raw.push({image: s.canvas, x: s.box.x, y: s.box.y}); shipped.push({image: await createImageBitmap(s.blob), x: s.box.x, y: s.box.y}); }
    const reference = px.composite(W, H, S.background, [{image: beautyCanvas}]);
    const rebuilt = px.composite(W, H, S.background, raw);
    const d = px.diff(reference, rebuilt);                                        // does the layering hold?
    const dz = px.diff(rebuilt, px.composite(W, H, S.background, shipped));       // what WebP compression alone costs
    report.verify = {mean: d.mean, p99: d.p99, p999: d.p999, max: d.max, over8pct: d.over8, webp: {mean: dz.mean, p99: dz.p99, lumaP99: dz.lumaP99, max: dz.max}};
    const culprit = () => { const [x, y] = d.maxAt; const hit = [...order].reverse().map(k => layers[k]).find(L => L.sprite && x >= L.sprite.box.x && y >= L.sprite.box.y && x < L.sprite.box.x + L.sprite.box.w && y < L.sprite.box.y + L.sprite.box.h); return hit ? ` near "${hit.name}"` : ''; };
    const transmissive = layers.some(L => { let t = false; L.object.traverse(o => { for (const m of [].concat(o.material ?? [])) if (m.transmission > 0) t = true; }); return t; });
    if (transmissive) log('note: glass/transmission refracts the other objects in the render; its layer cannot show them, so expect a mismatch behind glass');
    if ((d.p999 > 12 || d.over8 > 0.3) && !transmissive) warn(`layers do not rebuild the render exactly (p99.9 error ${d.p999}/255, ${d.over8}% of pixels off by more than 8)${culprit()}; see preview/sheet.png. Usual causes: two objects occluding each other both ways (use holdout), a shadow falling on a layer painted in front of its caster, or a strongly coloured shadowColor.`);
    if (dz.p99 > 14 && dz.lumaP99 <= 8) log(`note: WebP shifts colour at saturated edges (p99 ${dz.p99}/255, brightness only ${dz.lumaP99}): lossy WebP stores colour at half resolution, which no --quality fixes and nobody sees at page size; --png if colour must be pixel-exact`);
    else if (dz.p99 > 14) warn(`WebP compression is visible (p99 error ${dz.p99}/255, brightness ${dz.lumaP99}); try --quality 0.95, or --png for small sprites`);
    log(`verify: layers rebuild the render with mean error ${d.mean}/255 (p99 ${d.p99}, max ${d.max}); after WebP mean ${dz.mean} (p99 ${dz.p99}) · ${clock()}`);
    await previews({name, W, H, S, beautyCanvas, layers: order.map(k => layers[k]), verify: d});
  }

  // ================================================================ still
  async function renderStill() {
    const width = S.size ? S.size[0] : S.width;
    const tight = frameContent(studio.extentPoints(), width, () => { beautyModes(); return shoot(); });
    if (S.size) setView(fitRect(tight, S.size, S.margin, S.align), S.size[0], S.size[1]);
    else setView(tight, S.width);
    setBackdrop();
    log(`still ${W}×${H} (render ${W * ss}×${H * ss}) · ${clock()}`);
    report.frame = {width: W, height: H};
    let img;
    if (A.pathtrace || S.pathtrace) img = await pathTrace();
    else { beautyModes(); img = shoot(); }
    const c = await finish(img);
    await writeImage(c, name, A.png ? [...new Set([...S.formats, 'png'])] : S.formats);
    const preview = S.backdrop === 'transparent' ? paintBackground(c, S.background) : c;
    await save('preview/beauty.png', await px.encode(preview, 'image/png'));
    await save('preview/sheet.png', await px.encode(preview, 'image/png'));
    log(`still written · ${clock()}`);
  }

  // Path tracing (three-gpu-pathtracer): true soft shadows, glass that refracts and focuses light, bounce light and
  // colour bleeding. Composited like the layer shadows: the objects come from a trace of the scene on a real floor,
  // the floor's shadows and bounce light from its ratio to a trace of the floor alone, laid over the painted backdrop.
  async function pathTrace() {
    // A.pathtraceMock (tests only): the rasteriser stands in for the tracer, so the compositing can be checked without a GPU
    const {WebGLPathTracer} = A.pathtraceMock ? {WebGLPathTracer: await mockTracer()} : await import('three-gpu-pathtracer');
    const samples = (typeof A.pathtrace === 'number' ? A.pathtrace : null) ?? S.pathtrace?.samples ?? 128;
    const {center, radius} = bounds;
    const bg = scene.background;
    const backdropCanvas = paintBackground(px.canvas(W, H), opaqueBackdrop ? S.backdrop : S.background);
    const bd = px.ctx2d(backdropCanvas).getImageData(0, 0, W, H).data;

    // 1. coverage: which pixels are objects, anti-aliased, from the rasteriser (flat colours: alpha = geometry)
    scene.background = null;
    layers.forEach(L => apply(L, L.object.visible ? 'id' : 'hidden'));
    studio.setFloor(false);
    const cover = shoot().data;
    beautyModes();

    // 2. the tracer's scene: soft area lights where the directional ones were, the environment as the tracer samples
    //    it, a real matte floor, and scattered instances expanded (the tracer ignores InstancedMesh)
    const restore = [];
    for (const o of [studio.floor, studio.contact?.group]) if (o) { restore.push(() => { o.visible = true; }); o.visible = false; }
    const lights = [[studio.key, 0.055 * studio.softness], [studio.fill, 0.5], [studio.rim, 0.15]].filter(([l]) => l);
    for (const [l, k] of lights) {
      const d = l.position.distanceTo(l.target.position), size = Math.max(k * d, radius * 0.05);
      const area = new THREE.RectAreaLight(l.color, l.intensity * d * d / (size * size), size, size);
      area.position.copy(l.position); area.lookAt(l.target.position); scene.add(area);
      l.visible = false;
      restore.push(() => { scene.remove(area); l.visible = true; });
    }
    const envBefore = scene.environment;
    scene.environment = await pathTraceEnvironment(renderer, P.envMap ?? 'room', {tint: setTint});
    restore.push(() => { scene.environment = envBefore; });
    // the path tracer's frosting is physical: trace the authored roughness, not the raster compensation
    const rasterFrost = [...frosted.keys()].map(m => [m, m.roughness]);
    for (const [m, r] of frosted) m.roughness = r;
    restore.push(() => { for (const [m, r] of rasterFrost) m.roughness = r; });
    for (const L of layers) L.object.traverse(o => {
      if (!o.isInstancedMesh || !o.visible) return;
      const parts = [], m4 = new THREE.Matrix4(), col = new THREE.Color();
      for (let i = 0; i < o.count; i++) {
        o.getMatrixAt(i, m4);
        const g = o.geometry.clone().applyMatrix4(m4);
        if (o.instanceColor) { o.getColorAt(i, col); const n = g.attributes.position.count, c = new Float32Array(n * 3); for (let j = 0; j < n; j++) c.set([col.r, col.g, col.b], j * 3); g.setAttribute('color', new THREE.BufferAttribute(c, 3)); }
        parts.push(g.index ? g.toNonIndexed() : g);
      }
      if (!parts.length) return;
      const merged = mergeGeometries(parts.map(g => { for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv', 'color'].includes(k)) g.deleteAttribute(k); return g; }));
      const mat = o.material.clone(); if (o.instanceColor) mat.vertexColors = true;
      const flat = new THREE.Mesh(merged, mat); flat.matrix.copy(o.matrix); flat.matrixAutoUpdate = false;
      o.parent.add(flat); o.visible = false;
      restore.push(() => { o.parent.remove(flat); o.visible = true; });
    });
    const floorMat = new THREE.MeshStandardMaterial({color: 0xffffff, roughness: 1, metalness: 0});
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(radius * 80, radius * 80).rotateX(-Math.PI / 2), floorMat);
    floor.position.set(center.x, studio.floorY, center.z); scene.add(floor);
    restore.push(() => scene.remove(floor));
    const target = px.ctx2d(backdropCanvas).getImageData(0, 0, W, H).data;
    let tr = 0, tg = 0, tb = 0; for (let i = 0; i < target.length; i += 4) { tr += target[i]; tg += target[i + 1]; tb += target[i + 2]; }
    const n = target.length / 4, mean = new THREE.Color().setRGB(tr / n / 255, tg / n / 255, tb / n / 255, THREE.SRGBColorSpace);
    scene.background = mean; // what rays see through glass and past the floor

    const pt = new WebGLPathTracer(renderer);
    pt.tiles.set(2, 2);
    pt.bounces = S.pathtrace?.bounces ?? 8;
    pt.transmissiveBounces = 10;
    pt.renderScale = 1; pt.dynamicLowRes = false; pt.minSamples = 1; pt.fadeDuration = 0;
    const trace = async (count, label) => {
      pt.setScene(scene, camera); pt.reset();
      let shown = 0;
      while (pt.samples < count) {
        pt.renderSample();
        if (pt.samples >= shown + 16) { shown = Math.floor(pt.samples); log(`path tracing ${label} ${shown}/${count} · ${clock()}`); await new Promise(r => setTimeout(r, 0)); }
      }
      return px.toImageData(renderer.domElement, W, H).data;
    };
    const visible = layers.map(L => L.object.visible);
    const hideObjects = on => layers.forEach((L, i) => { L.object.visible = on ? false : visible[i]; });

    // 3. calibrate the floor so that, lit, it comes out at the backdrop colour (so glass refracts the right colour)
    hideObjects(true);
    const probe = await trace(4, 'floor probe');
    const lin = v => { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    let pr = 0, pg = 0, pb = 0, cnt = 0;
    for (let i = 0; i < probe.length; i += 4) if (i / 4 % W > W * 0.2 && i / 4 % W < W * 0.8) { pr += lin(probe[i]); pg += lin(probe[i + 1]); pb += lin(probe[i + 2]); cnt++; }
    floorMat.color.setRGB(...[[mean.r, pr], [mean.g, pg], [mean.b, pb]].map(([m, v]) => Math.min(1, m / Math.max(v / cnt, 1e-4))));
    const B = await trace(Math.max(16, Math.round(samples / 2)), 'floor');
    hideObjects(false);
    const Aimg = await trace(samples, 'scene');
    pt.dispose?.();
    restore.reverse().forEach(f => f()); scene.background = bg;
    studio.setFloor(true);

    // 4. composite: floor pixels take the backdrop times the traced floor's darkening (shadow) or brightening (caustics)
    const Bs = px.boxBlur(B, W, H, Math.max(2, Math.round(Math.max(W, H) / 160)));
    const out = new ImageData(W, H), o = out.data;
    const sc = px.hexToRgb(S.shadowColor ?? '#000000');
    for (let i = 0; i < o.length; i += 4) {
      const c = cover[i + 3] / 255;
      if (opaqueBackdrop) {
        for (let k = 0; k < 3; k++) { const f = bd[i + k] / Math.max(Bs[i + k], 1); o[i + k] = Aimg[i + k] * (f * (1 - c) + c); }
        o[i + 3] = 255;
      } else {
        const la = Aimg[i] * 0.3 + Aimg[i + 1] * 0.59 + Aimg[i + 2] * 0.11, lb = Math.max(1, Bs[i] * 0.3 + Bs[i + 1] * 0.59 + Bs[i + 2] * 0.11);
        const s = Math.min(1, Math.max(0, 1 - la / lb)), a = c + (1 - c) * s;
        for (let k = 0; k < 3; k++) { const pre = Math.min(a * 255, Math.max(0, c * Aimg[i + k] + (1 - c) * s * sc[k])); o[i + k] = a > 0 ? pre / a : 0; }
        o[i + 3] = a * 255;
      }
    }
    return out;
  }

  async function mockTracer() {
    const {RectAreaLightUniformsLib} = await import('three/addons/lights/RectAreaLightUniformsLib.js');
    RectAreaLightUniformsLib.init();
    return class {
      constructor(r) { this.r = r; this.samples = 0; this.tiles = {set() {}}; }
      setScene(s, c) { this.s = s; this.c = c; }
      reset() { this.samples = 0; }
      renderSample() { this.r.render(this.s, this.c); this.samples++; }
      dispose() {}
    };
  }

  // ================================================================ icons
  async function renderIcons() {
    const I = S.icons, [iw, ih] = I.size;
    const sheet = [];
    let uniform = null; // with icons.uniform the same world-to-pixel scale for all (relative sizes preserved)
    const rects = [];
    for (const L of layers) {
      const pts = studio.extentPoints(L.box);
      const tight = frameContent(pts, iw, () => { beautyModes([L]); return shoot(); });
      rects.push(tight);
    }
    if (I.uniform) uniform = Math.max(...rects.map(r => Math.max(r.w / iw, r.h / ih)));
    for (let i = 0; i < layers.length; i++) {
      const L = layers[i], tight = rects[i];
      let rect = fitRect(tight, I.size, I.margin, S.align);
      if (uniform) { const sc = uniform / (1 - 2 * I.margin); const cx = tight.x + tight.w / 2, cy = tight.y + tight.h / 2; rect = {F: tight.F, x: cx - iw * sc / 2, y: cy - ih * sc / 2, w: iw * sc, h: ih * sc}; }
      setView(rect, iw, ih);
      setBackdrop();
      studio.fitShadow(studio.extentPoints(L.box));
      beautyModes([L]);
      const c = await finish(shoot());
      await writeImage(c, `icons/${L.name}`, A.png ? [...new Set([...[].concat(S.formats), 'png'])] : S.formats);
      await save(`preview/icons/${L.name}.png`, await px.encode(S.backdrop === 'transparent' ? paintBackground(c, S.background) : c, 'image/png')); // full size, to judge details
      sheet.push({name: L.name, canvas: c});
      report.layers.push({name: L.name, src: `icons/${L.name}.${[].concat(S.formats)[0]}`, width: iw, height: ih});
      log(`icon ${i + 1}/${layers.length} ${L.name} · ${clock()}`);
    }
    studio.fitShadow();
    report.frame = {width: iw, height: ih};
    // contact sheet on the page colour
    const cols = Math.min(6, sheet.length), cell = Math.max(200, Math.min(iw, 300)), pad = 14, rows = Math.ceil(sheet.length / cols);
    const cs = px.canvas(pad + cols * (cell + pad), pad + rows * (cell + 34)), g = px.ctx2d(cs);
    g.fillStyle = '#fff'; g.fillRect(0, 0, cs.width, cs.height);
    sheet.forEach((s, i) => {
      const x = pad + (i % cols) * (cell + pad), y = pad + Math.floor(i / cols) * (cell + 34), ch = Math.round(cell * ih / iw);
      g.fillStyle = S.background; g.fillRect(x, y, cell, ch); g.drawImage(s.canvas, x, y, cell, ch);
      g.fillStyle = '#333'; g.font = '12px system-ui, sans-serif'; g.fillText(s.name, x, y + ch + 16);
    });
    await save('preview/sheet.png', await px.encode(cs, 'image/png'));
    await save('preview/beauty.png', await px.encode(cs, 'image/png'));
  }

  // ================================================================ sequence (animation / turntable)
  async function renderSequence() {
    const Q = S.sequence, N = Math.max(2, Q.frames);
    const turntable = Q.turntable || !mod.animate;
    const pivot = new THREE.Group(); pivot.position.set(bounds.center.x, 0, bounds.center.z); scene.add(pivot);
    if (turntable) for (const L of layers) pivot.attach(L.object);
    const animate = (i) => {
      const t = Q.loop ? i / N : i / (N - 1);
      if (turntable) pivot.rotation.y = t * Math.PI * 2 * (Q.turns ?? 1);
      else mod.animate({t, frame: i, frames: N, seconds: i / Q.fps, fps: Q.fps, layers: Object.fromEntries(layers.map(L => [L.name, L.object])), scene, THREE});
      scene.updateMatrixWorld(true);
    };
    // framing: union of every object's extent over the whole animation
    const pts = [];
    for (let i = 0; i < N; i += Math.max(1, Math.floor(N / 16))) {
      animate(i);
      const b = new THREE.Box3(); for (const L of layers) b.expandByObject(L.object, true);
      pts.push(...studio.extentPoints(b));
    }
    studio.fitShadow(pts);
    const width = S.size ? S.size[0] : S.width;
    const tight = frameContent(pts, width, () => {
      let union = null;
      for (let i = 0; i < N; i += Math.max(1, Math.floor(N / 8))) { animate(i); beautyModes(); const img = shoot(); union = union ? unionAlpha(union, img) : img; }
      return union;
    });
    // a turntable keeps its axis in the middle of the frame, so a shadow to one side does not push the product
    // off-centre (sequence.center: 'content' frames the content instead)
    let framed = tight;
    if (turntable && (Q.center ?? 'axis') === 'axis') {
      camera.clearViewOffset();
      const ax = (bounds.center.clone().project(camera).x + 1) / 2 * tight.F, half = Math.max(ax - tight.x, tight.x + tight.w - ax);
      framed = {...tight, x: ax - half, w: half * 2};
    }
    if (S.size) setView(fitRect(framed, S.size, S.margin, S.align), S.size[0], S.size[1]); else setView(framed, width);
    setBackdrop();
    log(`sequence ${N} frames ${W}×${H} at ${Q.fps} fps · ${clock()}`);
    const pad = String(N - 1).length;
    for (let i = 0; i < N; i++) {
      animate(i); beautyModes();
      const c = await finish(shoot());
      const f = `frames/${String(i).padStart(Math.max(3, pad), '0')}`;
      await save('out/' + f + '.webp', await px.encode(c, 'image/webp', S.quality)); files.push(f + '.webp');
      await save('tmp/' + f + '.png', await px.encode(c, 'image/png'));                                  // alpha, for a full ffmpeg
      await save('tmp/' + f + '.jpg', await px.encode(paintBackground(c, report.background), 'image/jpeg', 0.95)); // flattened, for Playwright's MJPEG-only ffmpeg
      if (i === 0) await save('preview/beauty.png', await px.encode(S.backdrop === 'transparent' ? paintBackground(c, S.background) : c, 'image/png'));
      if (i % 8 === 7) log(`frame ${i + 1}/${N} · ${clock()}`);
    }
    report.frame = {width: W, height: H};
    report.sequence = {frames: N, fps: Q.fps, loop: Q.loop, pattern: `frames/{i}.webp`, pad: Math.max(3, pad), turntable};
  }
}

// -------------------------------------------------------------------- helpers

function normalize(result) {
  const list = Array.isArray(result) ? result : result?.layers ?? [result];
  const seen = new Set();
  const layers = list.map((entry, i) => {
    const L = entry?.isObject3D ? {object: entry} : {...entry};
    if (!L.object?.isObject3D) throw new Error(`Layer ${i} has no "object" (a THREE.Object3D).`);
    let name = slug(L.name ?? (L.object.name || `layer-${i}`));
    while (seen.has(name)) name += '-' + i;
    seen.add(name);
    return {...L, name, index: i, shadow: L.shadow !== false, cast: L.shadow !== false && L.cast !== false, clean: !!L.clean, holdoutNames: [].concat(L.holdout ?? [])};
  });
  for (const L of layers) {
    L.holdout = L.holdoutNames.map(n => { const j = layers.findIndex(o => o.name === slug(n)); if (j < 0) throw new Error(`"${L.name}".holdout: unknown layer "${n}"`); return j; });
    delete L.holdoutNames;
  }
  return layers;
}

/** One colour for a backdrop spec: a hex, or the average of a gradient's stops. */
function backdropTint(spec) {
  if (!spec || spec === 'transparent') return 0xf2efe9;
  if (typeof spec === 'string' || typeof spec === 'number') return new THREE.Color(spec).getHex();
  const stops = spec.linear ?? spec.radial ?? [];
  if (!stops.length) return 0xf2efe9;
  const c = new THREE.Color(0, 0, 0);
  for (const s of stops) c.add(new THREE.Color(s));
  return c.multiplyScalar(1 / stops.length).getHex();
}

function aimCamera(C, bounds) {
  const ortho = C.projection === 'orthographic';
  const R = bounds.radius * 2.6;
  const camera = ortho ? new THREE.OrthographicCamera(-R, R, R, -R, 0.01, 1000) : new THREE.PerspectiveCamera(30, 1, 0.01, 1000);
  const target = C.target ? new THREE.Vector3(...C.target) : bounds.center.clone();
  let position;
  if (C.position) position = new THREE.Vector3(...C.position);
  else {
    const el = THREE.MathUtils.degToRad(C.elevation ?? 16), az = THREE.MathUtils.degToRad(C.azimuth ?? 0);
    position = target.clone().addScaledVector(new THREE.Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el)), bounds.radius * (ortho ? 10 : (C.distance ?? 5.8)));
  }
  camera.position.copy(position);
  camera.lookAt(target);
  const dist = position.distanceTo(bounds.center);
  if (!ortho && dist < bounds.radius * 1.2) throw new Error('The camera is inside the objects: increase camera.distance.');
  // wide enough for every object and the floor around it; the view is cropped to the content later
  if (!ortho) camera.fov = THREE.MathUtils.radToDeg(2 * Math.atan((bounds.radius * 2.6) / dist));
  camera.near = Math.max(0.01, dist - bounds.radius * 4);
  camera.far = dist + bounds.radius * 12;
  camera.updateProjectionMatrix();
  camera.updateMatrixWorld();
  return camera;
}

/** Object ids per pixel: each layer alone (coverage) and all together (who is in front). */
function idPasses(layers, apply, renderer, scene, camera, studio, W, H) {
  const w = Math.min(W, 640), h = Math.max(4, Math.round(w * H / W));
  const rt = new THREE.WebGLRenderTarget(w, h);
  const buf = new Uint8Array(w * h * 4);
  studio.setFloor(false);
  const background = scene.background; scene.background = null;
  const read = () => { renderer.setRenderTarget(rt); renderer.setClearColor(0x000000, 0); renderer.clear(); renderer.render(scene, camera); renderer.readRenderTargetPixels(rt, 0, 0, w, h, buf); renderer.setRenderTarget(null); const ids = new Uint8Array(w * h); for (let i = 0; i < w * h; i++) ids[i] = buf[i * 4 + 3] > 127 ? buf[i * 4] : 0; return ids; };
  const solo = layers.map(L => { layers.forEach(o => apply(o, o === L ? 'id' : 'hidden')); return read(); });
  layers.forEach(L => apply(L, 'id'));
  const front = read();
  scene.background = background;
  rt.dispose();
  layers.forEach(L => apply(L, 'real'));
  return {solo, front, w, h};
}

function paintOrder(layers, setting, idPass) {
  const n = layers.length, declared = layers.map((_, i) => i);
  if (Array.isArray(setting)) {
    const order = setting.map(nm => { const i = layers.findIndex(L => L.name === slug(nm)); if (i < 0) throw new Error(`order: unknown layer "${nm}"`); return i; });
    for (const i of declared) if (!order.includes(i)) order.push(i);
    return order;
  }
  if (setting === 'declared' || n < 2) return declared;
  const {solo, front, w, h} = idPass();
  const cnt = Array.from({length: n}, () => new Float64Array(n)); // cnt[i][j]: pixels where j hides i (paint i first)
  for (let p = 0; p < w * h; p++) {
    const f = front[p] - 1; if (f < 0) continue;
    for (let i = 0; i < n; i++) if (i !== f && solo[i][p] === i + 1) cnt[i][f]++;
  }
  const min = Math.max(4, w * h * 0.00004);
  const edges = Array.from({length: n}, () => new Set()), indeg = new Array(n).fill(0);
  const link = (from, to) => { if (!edges[from].has(to)) { edges[from].add(to); indeg[to]++; } };
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
    // a holdout layer is cut out where its occluder is in front of it, so it simply goes after the occluder
    if (layers[j].holdout.includes(i)) { link(i, j); continue; }
    if (layers[i].holdout.includes(j)) { link(j, i); continue; }
    const a = cnt[i][j], b = cnt[j][i];
    if (a > min && b > min) warn(`"${layers[i].name}" and "${layers[j].name}" hide each other (${a} px / ${b} px at probe size), and layers cannot interlock. Add holdout: ['${layers[i].name}'] to "${layers[j].name}" (it is then cut out where "${layers[i].name}" is in front and painted after it), or move them apart.`);
    if (Math.max(a, b) > min) { const [from, to] = a >= b ? [i, j] : [j, i]; link(from, to); }
  }
  for (let i = 0; i < n; i++) { const covered = solo[i].some(v => v); const shown = front.some(v => v === i + 1); if (covered && !shown) warn(`"${layers[i].name}" is completely hidden behind other objects.`); }
  const order = [], ready = declared.filter(i => indeg[i] === 0);
  while (order.length < n) {
    if (!ready.length) { // a cycle between three or more objects: release the earliest declared one
      const rest = declared.filter(i => !order.includes(i)); ready.push(rest[0]); warn(`occlusion cycle involving ${rest.map(i => `"${layers[i].name}"`).join(', ')}; using declared order there`);
      for (const i of rest) edges[i].delete(rest[0]);
    }
    ready.sort((a, b) => a - b);
    const i = ready.shift(); if (order.includes(i)) continue;
    order.push(i);
    for (const j of edges[i]) if (--indeg[j] === 0 && !order.includes(j)) ready.push(j);
  }
  return order;
}

async function previews({name, W, H, S, beautyCanvas, layers, verify, draft}) {
  const onBg = px.composite(W, H, S.background, [{image: beautyCanvas}]);
  await save('preview/beauty.png', await px.encode(onBg, 'image/png'));
  // contact sheet: beauty on the page colour, every layer on a checkerboard, and the verification heat map
  const sheetW = 1200, pad = 16, scale = Math.min(1, (sheetW - pad * 2) / W), bw = Math.round(W * scale), bh = Math.round(H * scale);
  const tileW = 270, cols = Math.max(1, Math.floor((sheetW - pad) / (tileW + pad))), tileH = Math.round(tileW * H / W) + 22;
  const rows = Math.ceil(layers.length / cols);
  const heatH = verify ? bh + 30 : 0;
  const sheetH = pad + 26 + bh + pad + (layers.length ? rows * (tileH + pad) : 0) + heatH + pad;
  const c = px.canvas(sheetW, sheetH), g = px.ctx2d(c);
  g.fillStyle = '#ffffff'; g.fillRect(0, 0, sheetW, sheetH);
  g.fillStyle = '#222'; g.font = '600 15px system-ui, sans-serif';
  g.fillText(`${name} — frame ${W}×${H}${draft ? ' — DRAFT (beauty only)' : ` — ${layers.length} layers`}${verify ? ` — rebuild error mean ${verify.mean}, p99 ${verify.p99}, max ${verify.max} /255` : ''}`, pad, pad + 14);
  let y = pad + 26;
  g.drawImage(onBg, pad, y, bw, bh); y += bh + pad;
  g.font = '12px system-ui, sans-serif';
  layers.forEach((L, i) => {
    const x = pad + (i % cols) * (tileW + pad), ty = y + Math.floor(i / cols) * (tileH + pad), s = tileW / W, th = tileH - 22;
    px.checker(g, x, ty, tileW, th);
    g.strokeStyle = '#ddd'; g.strokeRect(x + 0.5, ty + 0.5, tileW - 1, th - 1);
    L._tile = {x, y: ty, s};
    g.fillStyle = '#333'; g.fillText(`${i}  ${L.name}${L.shadowSprite ? ' + shadow' : ''}${L.sprite ? '' : ' (not visible)'}`, x, ty + th + 15);
  });
  for (const L of layers) for (const sp of [L.shadowSprite, L.sprite]) if (sp) g.drawImage(await createImageBitmap(sp.blob), L._tile.x + sp.box.x * L._tile.s, L._tile.y + sp.box.y * L._tile.s, sp.box.w * L._tile.s, sp.box.h * L._tile.s);
  y += layers.length ? rows * (tileH + pad) : 0;
  if (verify) {
    g.fillStyle = '#333'; g.fillText('layers repainted in order vs. the beauty render (red = mismatch, ×10)', pad, y + 12);
    g.drawImage(verify.heat, pad, y + 20, bw, bh);
  }
  await save('preview/sheet.png', await px.encode(c, 'image/png'));
}

function unionAlpha(a, b) {
  const out = new ImageData(a.width, a.height);
  for (let i = 3; i < out.data.length; i += 4) out.data[i] = Math.max(a.data[i], b.data[i]);
  return out;
}

