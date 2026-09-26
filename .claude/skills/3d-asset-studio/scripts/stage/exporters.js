// Model exports: GLB (web, three.js, model-viewer, Blender), USDZ (iOS AR Quick Look), STL (3D printing), OBJ.
// The caller scales the root to the file's units (metres for glTF/USDZ/OBJ, millimetres for STL).
// Baked AO travels as vertex colour; procedural grain is a render-time shader and does not.
import * as THREE from 'three';
import {GLTFExporter} from 'three/addons/exporters/GLTFExporter.js';

/** World-space copy of the layers with real materials, helpers (outlines, edge lines) removed, AO in COLOR_0. */
/** glTF has no sheen intensity: three exports sheenColor as is and imports it at full strength. Bake it in. */
const exportable = new Map();
function forExport(m) {
  if (!m || !(m.sheen > 0 && m.sheen !== 1)) return m;
  if (!exportable.has(m)) { const k = m.clone(); k.sheenColor.multiplyScalar(m.sheen); k.sheen = 1; k.name = m.name; exportable.set(m, k); }
  return exportable.get(m);
}

export function exportRoot(layers, name, {bakeAOColor = true} = {}) {
  const root = new THREE.Group(); root.name = name;
  for (const L of layers) {
    const c = L.object.clone(true); c.name = L.name;
    if (L.object.parent) c.applyMatrix4(L.object.parent.matrixWorld);
    const drop = [];
    let part = 0;
    c.traverse(o => {
      if (o.userData.w3dHelper) { drop.push(o); return; }
      if (o !== c && !o.name) o.name = `${L.name}-${o.isMesh ? 'mesh' : 'node'}${part++}`;
      if (o.isMesh) for (const m of [].concat(o.material)) if (m && !m.name) m.name = o.name; // parts stay addressable after import
      if (o.isMesh) o.material = Array.isArray(o.material) ? o.material.map(forExport) : forExport(o.material);
      if (o.isMesh && o.geometry.attributes.w3dAO && bakeAOColor) {
        const g = o.geometry.clone(), ao = g.attributes.w3dAO, col = new Float32Array(ao.count * 3);
        for (let i = 0; i < ao.count; i++) col[i * 3] = col[i * 3 + 1] = col[i * 3 + 2] = 0.35 + 0.65 * ao.getX(i);
        g.setAttribute('color', new THREE.BufferAttribute(col, 3));
        g.deleteAttribute('w3dAO');
        o.geometry = g;
        o.material = [].concat(o.material).map(m => { const k = m.clone(); k.vertexColors = true; return k; });
        if (o.material.length === 1) o.material = o.material[0];
      } else if (o.isMesh && o.geometry.attributes.w3dAO) { const g = o.geometry.clone(); g.deleteAttribute('w3dAO'); o.geometry = g; }
    });
    for (const o of drop) o.parent?.remove(o);
    root.add(c);
  }
  root.updateMatrixWorld(true);
  return root;
}

export async function toGLB(root) {
  root.traverse(o => { for (const m of [].concat(o.material ?? [])) for (const v of Object.values(m)) if (v?.isTexture && !v.userData.mimeType) v.userData.mimeType = 'image/jpeg'; });
  return new GLTFExporter().parseAsync(root, {binary: true, maxTextureSize: 1024});
}

/** A copy of a geometry facing the other way: reversed triangles, flipped normals. */
function flipped(g) {
  const f = g.clone();
  if (f.index) {
    const a = f.index.array;
    for (let i = 0; i < a.length; i += 3) { const t = a[i + 1]; a[i + 1] = a[i + 2]; a[i + 2] = t; }
    f.index.needsUpdate = true;
  } else {
    for (const attr of Object.values(f.attributes)) {
      const s = attr.itemSize, arr = attr.array;
      for (let i = 0; i + 2 < attr.count; i += 3) for (let k = 0; k < s; k++) { const t = arr[(i + 1) * s + k]; arr[(i + 1) * s + k] = arr[(i + 2) * s + k]; arr[(i + 2) * s + k] = t; }
      attr.needsUpdate = true;
    }
  }
  const n = f.attributes.normal;
  if (n) { for (let i = 0; i < n.array.length; i++) n.array[i] = -n.array[i]; n.needsUpdate = true; }
  return f;
}

/**
 * USDZ for AR Quick Look. USDZ has no double-sided surfaces (three drops DoubleSide with only a console
 * warning), so thin double-sided parts (leaves, paper, fabric, cards) get real back faces here. Textures must be
 * images or canvases; procedural shader effects do not carry over. Returns {data, doubled}.
 */
export async function toUSDZ(root) {
  const {USDZExporter} = await import('three/addons/exporters/USDZExporter.js');
  const copy = root.clone(true);
  let doubled = 0;
  copy.traverse(o => {
    if (!o.isMesh || o.isSkinnedMesh || o.userData.w3dBackFace) return;
    const mats = [].concat(o.material);
    if (!mats.some(m => m.side === THREE.DoubleSide)) return;
    const front = mats.map(m => (m.side === THREE.DoubleSide ? Object.assign(m.clone(), {side: THREE.FrontSide}) : m));
    o.material = Array.isArray(o.material) ? front : front[0];
    const back = new THREE.Mesh(flipped(o.geometry), o.material);
    back.name = (o.name || 'part') + '-back'; back.userData.w3dBackFace = true;
    o.add(back); doubled++;
  });
  copy.updateMatrixWorld(true);
  return {data: await new USDZExporter().parseAsync(copy, {quickLookCompatible: true}), doubled};
}

export async function toSTL(root) {
  const {STLExporter} = await import('three/addons/exporters/STLExporter.js');
  return new STLExporter().parse(root, {binary: true}); // DataView
}

export async function toOBJ(root) {
  const {OBJExporter} = await import('three/addons/exporters/OBJExporter.js');
  return new OBJExporter().parse(root);
}
