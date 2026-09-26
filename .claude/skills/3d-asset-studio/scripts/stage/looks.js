// Looks: whole-scene styles applied after build(). They swap or adjust materials, add outlines or edges and
// pick matching studio defaults, so the same model can come out photoreal, clay, toon, low-poly or line art.
import * as THREE from 'three';
import {LineSegments2} from 'three/addons/lines/LineSegments2.js';
import {LineSegmentsGeometry} from 'three/addons/lines/LineSegmentsGeometry.js';
import {LineMaterial} from 'three/addons/lines/LineMaterial.js';
import {withGrain} from 'w3d/materials.js';
import {facet} from 'w3d/geometry.js';

/** Defaults each look brings (the scene's own settings still win). */
export const LOOKS = {
  photoreal: {},
  clay: {studio: 'clay', ao: true},          // matte pastel clay, soft light: friendly 3D illustration
  mono: {studio: 'clay', ao: true},          // clay in one warm white: architectural models, product concepts
  toon: {studio: 'soft', ao: false, contact: {opacity: 0.3}},             // cel shading with ink outlines
  lowpoly: {studio: 'soft', ao: false},                                   // faceted, flat-shaded remesh
  lineart: {studio: 'bright', ao: false, floor: {shadow: 0.18}, contact: {opacity: 0.22}}, // ink outlines and creases on white
  wireframe: {studio: 'bright', ao: false, floor: {shadow: 0.15}, contact: {opacity: 0.2}}, // the low-poly mesh drawn as lines
};

const keepAsIs = m => m.transmission > 0 || (m.emissive && m.emissive.getHex() !== 0 && (m.emissiveIntensity ?? 1) > 0) || m.userData?.w3dKeep;
const colorOf = m => (m.color ? m.color.clone() : new THREE.Color(0xdddddd));
const lift = (c, satMul, minL, add) => { const h = {}; c.getHSL(h); return new THREE.Color().setHSL(h.h, Math.min(1, h.s * satMul), Math.min(0.96, Math.max(h.l, minL) * (1 - add) + add)); };

const gradients = {};
function toonGradient(steps = [110, 185, 255]) {
  const key = steps.join(',');
  if (gradients[key]) return gradients[key];
  const data = new Uint8Array(steps.flatMap(v => [v, v, v, 255]));
  const t = new THREE.DataTexture(data, steps.length, 1, THREE.RGBAFormat);
  t.minFilter = t.magFilter = THREE.NearestFilter; t.generateMipmaps = false; t.needsUpdate = true;
  return (gradients[key] = t);
}

function convert(m, look, o) {
  if (keepAsIs(m)) return m;
  const side = m.side, map = m.map ?? null;
  if (look === 'clay' || look === 'mono') {
    const color = look === 'mono' ? new THREE.Color(o.tint ?? 0xeceae5) : lift(colorOf(m), 0.72, 0.2, 0.1);
    const clay = new THREE.MeshPhysicalMaterial({color, map: look === 'mono' ? null : map, normalMap: m.normalMap ?? null, normalScale: m.normalScale?.clone(), roughness: 0.74, metalness: 0, sheen: 0.45, sheenRoughness: 0.8, sheenColor: new THREE.Color(0xffffff), side});
    return withGrain(clay, {scale: 200, bump: 0.22, roughVar: 0.02, tintVar: 0.01, seed: 3});
  }
  if (look === 'toon') return new THREE.MeshToonMaterial({color: lift(colorOf(m), 1.1, 0.3, 0.06), map, gradientMap: toonGradient(o.bands), side});
  if (look === 'lowpoly') return new THREE.MeshStandardMaterial({color: colorOf(m), map: null, roughness: 0.78, metalness: 0, flatShading: true, side});
  if (look === 'lineart') return new THREE.MeshToonMaterial({color: o.fill ?? 0xffffff, gradientMap: toonGradient([214, 242, 255]), side});
  if (look === 'wireframe') return new THREE.MeshStandardMaterial({color: o.fill ?? 0xf4f5f7, roughness: 0.9, flatShading: true, side, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1});
  return m;
}

function volumeArea(geometry) {
  const g = geometry.index ? geometry.toNonIndexed() : geometry, p = g.attributes.position;
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), ab = new THREE.Vector3(), ac = new THREE.Vector3();
  let volume = 0, area = 0;
  for (let i = 0; i + 2 < p.count; i += 3) {
    a.fromBufferAttribute(p, i); b.fromBufferAttribute(p, i + 1); c.fromBufferAttribute(p, i + 2);
    volume += a.dot(ab.copy(b).cross(c)) / 6;
    area += ab.subVectors(b, a).cross(ac.subVectors(c, a)).length() / 2;
  }
  return {volume: Math.abs(volume), area};
}

/** Inverted-hull outline: a back-facing copy pushed out along the normals. Survives every render pass. */
function outline(mesh, width, color) {
  const mat = new THREE.MeshBasicMaterial({color, side: THREE.BackSide});
  mat.onBeforeCompile = shader => {
    shader.uniforms.w3dWidth = {value: width};
    shader.vertexShader = shader.vertexShader.replace('#include <common>', '#include <common>\nuniform float w3dWidth;').replace('#include <begin_vertex>', '#include <begin_vertex>\n\ttransformed += normalize(normal) * w3dWidth;');
  };
  mat.customProgramCacheKey = () => 'w3d-outline';
  const hull = new THREE.Mesh(mesh.geometry, mat);
  hull.name = (mesh.name || 'mesh') + '-outline';
  hull.userData.w3dSkipAO = true; hull.userData.w3dHelper = true;
  hull.castShadow = false; hull.receiveShadow = false;
  hull.renderOrder = -1;
  mesh.add(hull);
}

/**
 * applyLook(look, layers, {radius, outline, lineColor, lineWidth, tint, fill, lineMaterials})
 * Converts materials in place (shared materials convert once) and adds outlines/edges.
 */
export function applyLook(look, layers, o = {}) {
  if (!look || look === 'photoreal') return;
  if (!LOOKS[look]) throw new Error(`Unknown look "${look}". Use one of: ${Object.keys(LOOKS).join(', ')}`);
  const cache = new Map();
  const swap = m => { if (!cache.has(m)) cache.set(m, convert(m, look, o)); return cache.get(m); };
  const lines = (mesh, geometry, color, width) => {
    const geo = new LineSegmentsGeometry().fromEdgesGeometry(geometry);
    const mat = new LineMaterial({color, linewidth: width, worldUnits: false});
    o.lineMaterials?.push(mat);
    const l = new LineSegments2(geo, mat);
    l.userData.w3dSkipAO = true; l.userData.w3dHelper = true; l.userData.w3dLine = true;
    l.castShadow = false;
    mesh.add(l);
  };
  // Facet size per mesh: a share of its size, but never more than its thickness (3·volume/area), so
  // handles and bands keep their shape instead of collapsing into shards.
  const cellFor = mesh => {
    const g = mesh.geometry; g.computeBoundingSphere();
    const s = mesh.getWorldScale(new THREE.Vector3()).x || 1, r = g.boundingSphere.radius;
    const {volume, area} = volumeArea(g);
    const thick = area > 0 && volume > 0 ? 3 * volume / area : 0;
    const want = Math.min((o.cell ?? 0.2) * r, (o.cell != null ? Infinity : 1) * 0.9 * thick || Infinity, (o.maxCell ?? 0.12) * o.radius / s);
    return want > r * 0.02 ? want : 0; // too thin to facet: keep the shape, flat-shade it
  };
  for (const L of layers) {
    const meshes = [];
    L.object.traverse(x => { if (x.isMesh && !x.userData.w3dHelper) meshes.push(x); });
    for (const mesh of meshes) {
      mesh.material = Array.isArray(mesh.material) ? mesh.material.map(swap) : swap(mesh.material);
      const keep = mesh.userData.w3dKeepDetail || [].concat(mesh.material).some(keepAsIs);
      if ((look === 'lowpoly' || look === 'wireframe') && !keep) {
        const c = cellFor(mesh);
        const low = c ? facet(mesh.geometry, {cell: c, jitter: look === 'lowpoly' ? 0.2 : 0}) : null;
        if (low && low.attributes.position.count >= 9) mesh.geometry = low;
      }
      const ink = o.lineColor ?? 0x1d1f22;
      if ((look === 'toon' || look === 'lineart') && o.outline !== false) outline(mesh, (o.outlineWidth ?? (look === 'lineart' ? 0.008 : 0.012)) * o.radius, ink);
      if (look === 'lineart') lines(mesh, new THREE.EdgesGeometry(mesh.geometry, o.creaseAngle ?? 42), ink, o.lineWidth ?? 1.4);
      if (look === 'wireframe') lines(mesh, new THREE.WireframeGeometry(mesh.geometry), o.lineColor ?? 0x2a3b55, o.lineWidth ?? 1);
    }
  }
}
