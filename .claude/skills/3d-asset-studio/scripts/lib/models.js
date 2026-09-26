// Bring existing 3D models into a scene: glTF/GLB (with Draco, Meshopt and KTX2 compression), OBJ (+MTL), FBX,
// STL, PLY, 3MF, DAE, USDZ, VOX. Models come out at a known size (1 unit = 10 cm), centred, standing on the floor,
// casting shadows, with materials the studio lights well — then render them like anything else.
//
//   const chair = await loadModel(new URL('./chair.glb', import.meta.url).href, {height: '78cm'});
//   const part  = await loadModel('/abs/path/bracket.stl', {material: M.powderCoat({color: 0x2b2d31}), smooth: 30});
import * as THREE from 'three';
import {clone as cloneSkinned} from 'three/addons/utils/SkeletonUtils.js';
import {creased} from './geometry.js';

const LIBS = new URL('libs/', import.meta.resolve('three/addons/')).href;
const UNIT = {mm: 0.01, cm: 0.1, dm: 1, m: 10, in: 0.254, ft: 3.048, unit: 1};
// what a file's numbers usually mean when nothing is said (glTF is metres by spec; STL/3MF come from CAD and printers)
const FILE_UNITS = {glb: 'm', gltf: 'm', usdz: 'm', dae: 'm', fbx: 'cm', stl: 'mm', '3mf': 'mm'};
const Z_UP = new Set(['stl', '3mf']);

/** '78cm', '1.2 m', '300mm', '12in' or a plain number (scene units) → scene units. */
export function length(v) {
  if (v == null || typeof v === 'number') return v;
  const m = String(v).trim().match(/^([\d.]+)\s*(mm|cm|dm|m|in|ft)?$/i);
  if (!m) throw new Error(`Cannot read the length "${v}" (use 78cm, 1.2m, 300mm, 12in or a number in scene units)`);
  return parseFloat(m[1]) * (m[2] ? UNIT[m[2].toLowerCase()] : 1);
}

async function parse(url, ext, opts) {
  const renderer = opts.renderer ?? globalThis.w3dRenderer;
  if (ext === 'glb' || ext === 'gltf') {
    const [{GLTFLoader}, {DRACOLoader}, {MeshoptDecoder}] = await Promise.all([
      import('three/addons/loaders/GLTFLoader.js'), import('three/addons/loaders/DRACOLoader.js'), import('three/addons/libs/meshopt_decoder.module.js')]);
    const loader = new GLTFLoader().setDRACOLoader(new DRACOLoader().setDecoderPath(LIBS + 'draco/')).setMeshoptDecoder(MeshoptDecoder);
    if (renderer) { const {KTX2Loader} = await import('three/addons/loaders/KTX2Loader.js'); loader.setKTX2Loader(new KTX2Loader().setTranscoderPath(LIBS + 'basis/').detectSupport(renderer)); }
    const gltf = await loader.loadAsync(url);
    return {root: gltf.scene, animations: gltf.animations, extensions: gltf.parser.json.extensionsUsed ?? []};
  }
  if (ext === 'obj') {
    const {OBJLoader} = await import('three/addons/loaders/OBJLoader.js');
    const loader = new OBJLoader();
    const mtl = opts.mtl === false ? null : opts.mtl ?? url.replace(/\.obj(\?.*)?$/i, '.mtl');
    if (mtl) {
      try {
        const {MTLLoader} = await import('three/addons/loaders/MTLLoader.js');
        const materials = await new MTLLoader().setResourcePath(new URL('.', mtl).href).loadAsync(mtl);
        materials.preload(); loader.setMaterials(materials);
      } catch { /* no .mtl next to the .obj: plain materials */ }
    }
    return {root: await loader.loadAsync(url)};
  }
  if (ext === 'fbx') { const {FBXLoader} = await import('three/addons/loaders/FBXLoader.js'); const r = await new FBXLoader().loadAsync(url); return {root: r, animations: r.animations}; }
  if (ext === 'dae') { const {ColladaLoader} = await import('three/addons/loaders/ColladaLoader.js'); const r = await new ColladaLoader().loadAsync(url); return {root: r.scene, animations: r.scene.animations}; }
  if (ext === '3mf') { const {ThreeMFLoader} = await import('three/addons/loaders/3MFLoader.js'); return {root: await new ThreeMFLoader().loadAsync(url)}; }
  if (ext === 'usdz') { const {USDZLoader} = await import('three/addons/loaders/USDZLoader.js'); return {root: await new USDZLoader().loadAsync(url)}; }
  if (ext === 'vox') {
    const {VOXLoader, VOXMesh} = await import('three/addons/loaders/VOXLoader.js');
    const chunks = await new VOXLoader().loadAsync(url), g = new THREE.Group();
    for (const c of chunks) g.add(new VOXMesh(c));
    return {root: g};
  }
  if (ext === 'stl' || ext === 'ply') {
    const {[ext === 'stl' ? 'STLLoader' : 'PLYLoader']: Loader} = await import(`three/addons/loaders/${ext === 'stl' ? 'STLLoader' : 'PLYLoader'}.js`);
    const geometry = await new Loader().loadAsync(url);
    if (!geometry.attributes.normal) geometry.computeVertexNormals();
    const colors = !!geometry.attributes.color;
    return {root: new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({color: colors ? 0xffffff : 0xcfcac2, roughness: 0.55, vertexColors: colors})), geometryOnly: true};
  }
  throw new Error(`Cannot load ".${ext}" models (glb, gltf, obj, fbx, stl, ply, 3mf, dae, usdz, vox). Convert other formats to glTF first (Blender: File › Export › glTF 2.0).`);
}

/** Phong/Lambert/Basic materials from older formats → PBR, keeping their maps. Shininess becomes roughness. */
function toStandard(m) {
  if (m.isMeshStandardMaterial || m.isShaderMaterial || m.isRawShaderMaterial || m.isMeshToonMaterial) return m;
  const s = new THREE.MeshStandardMaterial({
    name: m.name, color: m.color ?? 0xffffff, map: m.map ?? null, normalMap: m.normalMap ?? null, alphaMap: m.alphaMap ?? null,
    aoMap: m.aoMap ?? null, emissive: m.emissive ?? 0x000000, emissiveMap: m.emissiveMap ?? null, bumpMap: m.bumpMap ?? null, bumpScale: m.bumpScale ?? 1,
    transparent: m.transparent, opacity: m.opacity, alphaTest: m.alphaTest, side: m.side, vertexColors: m.vertexColors, flatShading: m.flatShading,
    roughness: m.shininess != null ? Math.min(1, Math.pow(2 / (m.shininess + 2), 0.25)) : 0.8, metalness: 0,
  });
  if (m.normalScale) s.normalScale.copy(m.normalScale);
  return s;
}

/**
 * loadModel(url, options) → THREE.Group, standing on y = 0 and centred on x/z.
 *   Size (pick one; a length like '78cm' or scene units): height | width | depth | size (largest side).
 *     Without one the file's units are used (glTF: metres; STL/3MF: mm; FBX: cm) — `units` overrides that;
 *     files with no units (OBJ, PLY, VOX) are fitted to 30 cm and say so in model.userData.w3dModel.note.
 *   up: 'y' | 'z' (STL/3MF default to Z-up)   rotate: [x, y, z] degrees after that (turn it to face the camera)
 *   material: undefined (keep; legacy types become PBR) | a Material | (mesh, old) => Material
 *   smooth: crease angle in degrees → recompute normals (faceted scans and STLs)   flat: true → faceted normals
 *   center / ground: false keeps the file's own origin (rooms, parts that must line up)
 *   shadows: true   renderer: needed for KTX2 textures outside the stage (the stage supplies its own)
 * Animations (glTF/FBX/DAE) are on model.userData.animations; pose one with poseAt(model, clip, seconds).
 */
export async function loadModel(url, opts = {}) {
  const href = String(url instanceof URL ? url.href : url);
  const ext = (opts.format ?? href.split(/[?#]/)[0].split('.').pop()).toLowerCase();
  const {root, animations = [], extensions = [], geometryOnly = false} = await parse(href, ext, opts);
  const model = new THREE.Group(); model.name = opts.name ?? href.split(/[?#]/)[0].split('/').pop().replace(/\.[^.]+$/, '');
  model.add(root);

  // orientation: Z-up files stand up; then any turn the scene asks for
  if ((opts.up ?? (Z_UP.has(ext) ? 'z' : 'y')) === 'z') root.rotation.x = -Math.PI / 2;
  if (opts.rotate) { const [x = 0, y = 0, z = 0] = opts.rotate.map(THREE.MathUtils.degToRad); model.rotation.set(x, y, z); }

  // materials and normals
  const stats = {format: ext, meshes: 0, triangles: 0, vertices: 0, materials: new Set(), textures: new Set(), maxTexture: 0, skinned: false, morphs: false, animations: animations.map(a => ({name: a.name, seconds: +a.duration.toFixed(2)})), extensions};
  const cache = new Map();
  root.traverse(o => {
    if (!o.isMesh && !o.isPoints && !o.isLine) return;
    const g = o.geometry;
    if (o.isMesh) {
      stats.meshes++;
      const n = g.index ? g.index.count / 3 : g.attributes.position.count / 3;
      stats.triangles += (o.isInstancedMesh ? o.count : 1) * n;
      stats.vertices += g.attributes.position.count;
      if (o.isSkinnedMesh) stats.skinned = true;
      if (g.morphAttributes && Object.keys(g.morphAttributes).length) stats.morphs = true;
      if (!g.attributes.normal) g.computeVertexNormals();
      if (opts.smooth && !o.isSkinnedMesh) o.geometry = creased(g, opts.smooth);
      o.castShadow = o.receiveShadow = opts.shadows !== false;
    }
    const mats = [].concat(o.material ?? []).map(m => {
      let out = m;
      if (typeof opts.material === 'function') out = opts.material(o, m) ?? m;
      else if (opts.material?.isMaterial) out = opts.material;
      else { if (!cache.has(m)) cache.set(m, toStandard(m)); out = cache.get(m); }
      if (opts.flat) { out = out.clone(); out.flatShading = true; }
      if (out.isMeshStandardMaterial && !out.envMapIntensity) out.envMapIntensity = 1;
      stats.materials.add(out);
      for (const v of Object.values(out)) if (v?.isTexture) { stats.textures.add(v); const img = v.image; if (img?.width) stats.maxTexture = Math.max(stats.maxTexture, img.width, img.height); v.anisotropy = 8; }
      return out;
    });
    if (mats.length) o.material = Array.isArray(o.material) ? mats : mats[0];
  });

  // size: an asked-for dimension, else the file's own units, else fitted to 30 cm
  model.updateMatrixWorld(true);
  let box = new THREE.Box3().setFromObject(model, true);
  if (box.isEmpty()) throw new Error(`"${href}" contains no geometry`);
  const dims = box.getSize(new THREE.Vector3());
  const ask = [['height', dims.y], ['width', dims.x], ['depth', dims.z], ['size', Math.max(dims.x, dims.y, dims.z)]].find(([k]) => opts[k] != null);
  let k = 1, note = null;
  if (ask) k = length(opts[ask[0]]) / ask[1];
  else if (opts.units || FILE_UNITS[ext]) k = UNIT[opts.units ?? FILE_UNITS[ext]];
  else { k = 3 / Math.max(dims.x, dims.y, dims.z); note = `.${ext} files carry no units: fitted to 30 cm on its longest side; pass height/width/size for the real size`; }
  if (!Number.isFinite(k) || k <= 0) throw new Error(`Cannot scale "${href}" (size ${dims.toArray().map(v => v.toFixed(3)).join(' × ')})`);
  model.scale.multiplyScalar(k);
  model.updateMatrixWorld(true);
  box = new THREE.Box3().setFromObject(model, true);
  const c = box.getCenter(new THREE.Vector3());
  if (opts.center !== false) { model.position.x -= c.x; model.position.z -= c.z; }
  if (opts.ground !== false) model.position.y -= box.min.y;
  model.updateMatrixWorld(true);
  const final = new THREE.Box3().setFromObject(model, true).getSize(new THREE.Vector3());

  model.userData.animations = animations;
  model.userData.w3dModel = {
    ...stats, triangles: Math.round(stats.triangles), materials: stats.materials.size, textures: stats.textures.size,
    materialTypes: [...new Set([...stats.materials].map(m => m.type))],
    sizeCm: final.toArray().map(v => +(v * 10).toFixed(1)), // x (width) × y (height) × z (depth)
    fileSize: dims.toArray().map(v => +v.toPrecision(4)), scale: +k.toPrecision(4), geometryOnly, note,
  };
  return model;
}

/** Scale any object so one dimension matches: fitTo(obj, {height: '30cm'}) — then stand it on the floor. */
export function fitTo(object, {height, width, depth, size, ground = true, center = true} = {}) {
  object.updateMatrixWorld(true);
  let box = new THREE.Box3().setFromObject(object, true);
  const d = box.getSize(new THREE.Vector3());
  const [key, v] = [['height', d.y], ['width', d.x], ['depth', d.z], ['size', Math.max(d.x, d.y, d.z)]].find(([k]) => ({height, width, depth, size})[k] != null) ?? [];
  if (key) object.scale.multiplyScalar(length({height, width, depth, size}[key]) / v);
  object.updateMatrixWorld(true);
  box = new THREE.Box3().setFromObject(object, true);
  const c = box.getCenter(new THREE.Vector3());
  if (center) { object.position.x -= c.x; object.position.z -= c.z; }
  if (ground) object.position.y -= box.min.y;
  return object;
}

/** A copy that shares geometry and materials (skinned models get their own skeleton). */
export const copyModel = model => {
  const c = cloneSkinned(model);
  c.userData = {...model.userData};
  return c;
};

/** Pose an animated model at `seconds` into a clip (name, index or AnimationClip) — for stills and sequences. */
export function poseAt(model, clip = 0, seconds = 0) {
  const clips = model.userData.animations ?? [];
  const c = clip?.isAnimationClip ? clip : typeof clip === 'number' ? clips[clip] : THREE.AnimationClip.findByName(clips, clip);
  if (!c) throw new Error(`No animation "${clip}" (has: ${clips.map(a => a.name).join(', ') || 'none'})`);
  const mixer = model.userData.w3dMixer ??= new THREE.AnimationMixer(model);
  mixer.stopAllAction();
  const action = mixer.clipAction(c); action.play();
  mixer.setTime(seconds % Math.max(c.duration, 1e-6));
  model.updateMatrixWorld(true);
  return c.duration;
}

/** One-line summary for logs: triangles, materials, textures, size. */
export function describe(model) {
  const s = model.userData.w3dModel;
  if (!s) return model.name;
  return `${model.name}: ${s.format}, ${s.meshes} meshes, ${s.triangles.toLocaleString('en')} triangles, ${s.materials} materials (${s.materialTypes.join(', ')}), ${s.textures} textures${s.maxTexture ? ` up to ${s.maxTexture}px` : ''}, ${s.sizeCm.join(' × ')} cm${s.animations.length ? `, animations: ${s.animations.map(a => `${a.name} ${a.seconds}s`).join(', ')}` : ''}${s.extensions.length ? `, ${s.extensions.join(' ')}` : ''}`;
}
