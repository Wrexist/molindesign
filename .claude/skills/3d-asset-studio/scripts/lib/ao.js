// Baked ambient occlusion: rays from every vertex into its hemisphere, against the real geometry
// (three-mesh-bvh), stored per vertex and multiplied into indirect light. Unlike screen-space AO it has no
// halos, works on transparent layers, survives every render pass identically, and exports to GLB.
import * as THREE from 'three';
import {MeshBVH} from 'three-mesh-bvh';
import {refine} from './geometry.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {rng} from './materials.js';

const meshesOf = root => { const out = []; root.traverse(o => { if (o.isMesh && o.visible !== false && !o.userData.w3dSkipAO) out.push(o); }); return out; };

/** One BVH over every mesh in `roots`, in world space. */
function occluder(roots) {
  const parts = [];
  for (const root of roots) {
    root.updateMatrixWorld(true);
    for (const m of meshesOf(root)) {
      const g = m.geometry.index ? m.geometry.toNonIndexed() : m.geometry.clone();
      for (const k of Object.keys(g.attributes)) if (k !== 'position') g.deleteAttribute(k);
      g.applyMatrix4(m.matrixWorld);
      parts.push(g);
    }
  }
  if (!parts.length) return null;
  const merged = mergeGeometries(parts, false);
  return new MeshBVH(merged);
}

/**
 * bakeAO(groups, {samples, distance, strength, self})
 * groups: array of Object3D roots (one per layer). self: true → each group is only occluded by itself
 * (objects that animate independently keep no ghost darkening where a neighbour will land).
 * distance: how far occlusion reaches, in scene units (default: 18% of the bounding radius).
 */
export function bakeAO(groups, {samples = 32, distance = null, strength = 1, self = false, radius = 1, seed = 5} = {}) {
  const reach = distance ?? radius * 0.18;
  const rand = rng(seed);
  // stratified cosine-weighted hemisphere directions around +z, rotated onto each normal
  const dirs = [];
  const side = Math.ceil(Math.sqrt(samples));
  for (let i = 0; i < side; i++) for (let j = 0; j < side; j++) {
    const u = (i + rand()) / side, v = (j + rand()) / side, r = Math.sqrt(u), phi = 2 * Math.PI * v;
    dirs.push(new THREE.Vector3(r * Math.cos(phi), r * Math.sin(phi), Math.sqrt(Math.max(0, 1 - u))));
  }
  const shared = self ? null : occluder(groups);
  const ray = new THREE.Ray(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 0, 1);
  const p = new THREE.Vector3(), n = new THREE.Vector3(), d = new THREE.Vector3(), nm = new THREE.Matrix3();
  let vertices = 0;
  for (const g of groups) {
    const bvh = self ? occluder([g]) : shared;
    if (!bvh) continue;
    for (const m of meshesOf(g)) {
      // AO lives on the geometry: give every mesh its own copy, dense enough to carry a soft gradient
      let geo = m.geometry.clone();
      // only big flat faces need subdividing (a box side with four corners cannot hold a soft gradient)
      const maxEdge = Math.max(reach * 0.6, radius * 0.02) / Math.max(1e-6, m.getWorldScale(new THREE.Vector3()).x);
      if (longestEdge(geo) > maxEdge && geo.attributes.position.count < 60000) {
        try {
          const t = refine(geo, maxEdge); // crack-free: shared edges split the same way on both sides
          if (t.attributes.position.count < 300000) geo = t;
        } catch { /* keep the original */ }
      }
      if (!geo.attributes.normal) geo.computeVertexNormals();
      m.geometry = geo;
      m.updateMatrixWorld(true);
      nm.getNormalMatrix(m.matrixWorld);
      const pos = geo.attributes.position, nor = geo.attributes.normal, count = pos.count;
      const ao = new Float32Array(count);
      for (let i = 0; i < count; i++) {
        p.fromBufferAttribute(pos, i).applyMatrix4(m.matrixWorld);
        n.fromBufferAttribute(nor, i).applyMatrix3(nm).normalize();
        q.setFromUnitVectors(up, n);
        let occ = 0;
        for (const dir of dirs) {
          d.copy(dir).applyQuaternion(q);
          ray.origin.copy(p).addScaledVector(n, reach * 0.004);
          ray.direction.copy(d);
          const hit = bvh.raycastFirst(ray, THREE.DoubleSide, 0, reach);
          if (hit) occ += 1 - hit.distance / reach;
        }
        ao[i] = 1 - Math.min(1, (occ / dirs.length) * 1.6);
      }
      vertices += count;
      geo.setAttribute('w3dAO', new THREE.BufferAttribute(ao, 1));
      for (const mat of [].concat(m.material)) injectAO(mat, strength);
    }
  }
  return {vertices, rays: vertices * dirs.length};
}

function longestEdge(g) {
  const p = g.attributes.position, idx = g.index, a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
  const n = idx ? idx.count : p.count;
  let max = 0;
  for (let i = 0; i < n; i += 3) {
    const [i0, i1, i2] = idx ? [idx.getX(i), idx.getX(i + 1), idx.getX(i + 2)] : [i, i + 1, i + 2];
    a.fromBufferAttribute(p, i0); b.fromBufferAttribute(p, i1); c.fromBufferAttribute(p, i2);
    max = Math.max(max, a.distanceToSquared(b), b.distanceToSquared(c), c.distanceToSquared(a));
  }
  return Math.sqrt(max);
}

/** Multiply baked AO into a material's indirect light (and a little into direct light, like an area light would). */
export function injectAO(material, strength = 1) {
  if (!material || material.userData.w3dAO) return;
  material.userData.w3dAO = strength;
  const prev = material.onBeforeCompile, prevKey = material.customProgramCacheKey?.bind(material);
  material.onBeforeCompile = (shader, renderer) => {
    prev?.call(material, shader, renderer);
    shader.uniforms.w3dAOStrength = {value: strength};
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nattribute float w3dAO;\nvarying float vW3dAO;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\n\tvW3dAO = w3dAO;');
    const apply = `
	{
		float w3dOcc = mix(1.0, vW3dAO, w3dAOStrength);
		reflectedLight.indirectDiffuse *= w3dOcc;
		reflectedLight.indirectSpecular *= mix(1.0, w3dOcc, 0.75);
		reflectedLight.directDiffuse *= mix(1.0, w3dOcc, 0.35);
	}`;
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying float vW3dAO;\nuniform float w3dAOStrength;')
      .replace('#include <aomap_fragment>', '#include <aomap_fragment>' + apply);
  };
  material.customProgramCacheKey = () => (prevKey ? prevKey() : '') + '+w3dAO';
  material.needsUpdate = true;
}
