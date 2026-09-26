// Booleans (constructive solid geometry) with three-bvh-csg: drill holes, cut windows, carve grooves,
// merge parts into one watertight solid. Inputs are meshes with their transforms; the result is a mesh.
import * as THREE from 'three';
import {Brush, Evaluator, ADDITION, SUBTRACTION, INTERSECTION} from 'three-bvh-csg';

const evaluator = new Evaluator();
evaluator.attributes = ['position', 'uv', 'normal'];
evaluator.useGroups = true; // faces keep the material of the mesh they came from (cut faces take the cutter's)

function brush(mesh) {
  const g = mesh.geometry.index ? mesh.geometry : mesh.geometry;
  if (!g.attributes.uv) { const n = g.attributes.position.count; g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(n * 2), 2)); }
  if (!g.attributes.normal) g.computeVertexNormals();
  const b = new Brush(g, mesh.material);
  mesh.updateMatrixWorld(true);
  b.position.copy(mesh.getWorldPosition(new THREE.Vector3()));
  b.quaternion.copy(mesh.getWorldQuaternion(new THREE.Quaternion()));
  b.scale.copy(mesh.getWorldScale(new THREE.Vector3()));
  b.updateMatrixWorld(true);
  return b;
}

function run(op, first, rest) {
  let acc = brush(first);
  for (const m of rest) {
    const b = brush(m);
    if (m.userData.w3dInherit) b.material = first.material; // a cutter without its own material: cut faces match the base
    const out = evaluator.evaluate(acc, b, op); out.updateMatrixWorld(true); acc = out;
  }
  // one material for all groups (cutters that inherit): a plain single-material mesh is simpler for everything after
  const mats = [].concat(acc.material), single = mats.every(m => m === mats[0]);
  if (single) acc.geometry.clearGroups();
  const mesh = new THREE.Mesh(acc.geometry, single ? mats[0] : acc.material);
  mesh.geometry.computeVertexNormals();
  mesh.castShadow = mesh.receiveShadow = true;
  return mesh; // in world space: add it to the scene as is
}

/** base minus every cutter: holes, slots, engraved lines, hollowed shapes. */
export const subtract = (base, ...cutters) => run(SUBTRACTION, base, cutters);
/** one solid from overlapping parts (a clean silhouette and no internal faces). */
export const union = (...parts) => run(ADDITION, parts[0], parts.slice(1));
/** only where all overlap: rounded-off intersections, lens shapes, cut gems. */
export const intersect = (...parts) => run(INTERSECTION, parts[0], parts.slice(1));

/**
 * Convenience: a cutter mesh from a geometry and a position. The faces it cuts take its material; without one they
 * take the base's (a drilled hole in red plastic is red inside). Pass a material for a contrasting inlay or engraving.
 */
export function cutter(geometry, position = [0, 0, 0], rotation = [0, 0, 0], material = null) {
  const m = new THREE.Mesh(geometry, material ?? new THREE.MeshStandardMaterial());
  m.userData.w3dInherit = !material;
  m.position.set(...position); m.rotation.set(...rotation);
  return m;
}
