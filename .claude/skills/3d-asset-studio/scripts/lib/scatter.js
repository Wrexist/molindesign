// Scatter many small things over a surface or in a volume with one InstancedMesh: sprinkles on a donut,
// seeds on a bun, pebbles on the floor, confetti, leaves, bubbles, stars. Seeded, so it is repeatable.
import * as THREE from 'three';
import {MeshSurfaceSampler} from 'three/addons/math/MeshSurfaceSampler.js';
import {rng} from './materials.js';

/**
 * scatter(target, geometry, material, {count, seed, scale: [min, max], align: 'normal' | 'up' | 'random',
 *   tilt (radians of random lean), lift (along the normal), where: (position, normal) => bool, colors: [hex…]})
 * target: a Mesh whose surface is sampled (in its local space; the result is added as its child).
 */
export function scatter(target, geometry, material, {count = 200, seed = 1, scale = [1, 1], align = 'normal', tilt = 0.3, lift = 0, where = null, colors = null, spin = true} = {}) {
  const rand = rng(seed);
  const sampler = new MeshSurfaceSampler(target).setRandomGenerator(rand).build();
  const mesh = new THREE.InstancedMesh(geometry, material, count);
  const p = new THREE.Vector3(), n = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0), q = new THREE.Quaternion(), s = new THREE.Vector3(), m = new THREE.Matrix4(), e = new THREE.Euler();
  let placed = 0, tries = 0;
  while (placed < count && tries++ < count * 30) {
    sampler.sample(p, n);
    if (where && !where(p, n)) continue;
    const k = scale[0] + (scale[1] - scale[0]) * rand();
    s.set(k, k, k);
    if (align === 'normal') q.setFromUnitVectors(up, n);
    else if (align === 'up') q.identity();
    else q.setFromEuler(e.set(rand() * Math.PI * 2, rand() * Math.PI * 2, rand() * Math.PI * 2));
    if (spin) q.multiply(new THREE.Quaternion().setFromAxisAngle(up, rand() * Math.PI * 2));
    if (tilt) q.multiply(new THREE.Quaternion().setFromEuler(e.set((rand() - 0.5) * tilt * 2, 0, (rand() - 0.5) * tilt * 2)));
    m.compose(p.clone().addScaledVector(n, lift), q, s);
    mesh.setMatrixAt(placed, m);
    if (colors) mesh.setColorAt(placed, new THREE.Color(colors[Math.floor(rand() * colors.length)]));
    placed++;
  }
  mesh.count = placed;
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  mesh.userData.w3dSkipAO = true; // instances share one geometry: per-vertex AO cannot differ per copy
  mesh.castShadow = mesh.receiveShadow = true;
  target.add(mesh);
  return mesh;
}

/** Scatter points in a box (bubbles, confetti, floating particles). Returns an InstancedMesh. */
export function scatterVolume(geometry, material, {count = 60, box = [[-1, 0, -1], [1, 1, 1]], seed = 1, scale = [0.6, 1.2], colors = null} = {}) {
  const rand = rng(seed), mesh = new THREE.InstancedMesh(geometry, material, count), m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
  for (let i = 0; i < count; i++) {
    const p = new THREE.Vector3(...[0, 1, 2].map(a => box[0][a] + (box[1][a] - box[0][a]) * rand()));
    const k = scale[0] + (scale[1] - scale[0]) * rand();
    q.setFromEuler(e.set(rand() * 6.28, rand() * 6.28, rand() * 6.28));
    m.compose(p, q, new THREE.Vector3(k, k, k)); mesh.setMatrixAt(i, m);
    if (colors) mesh.setColorAt(i, new THREE.Color(colors[Math.floor(rand() * colors.length)]));
  }
  mesh.instanceMatrix.needsUpdate = true;
  mesh.userData.w3dSkipAO = true;
  mesh.castShadow = mesh.receiveShadow = true;
  return mesh;
}
