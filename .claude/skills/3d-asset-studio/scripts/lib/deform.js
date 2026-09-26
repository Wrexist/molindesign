// Deformers: reshape any geometry after it is built. Each returns a new geometry with fresh normals.
// Organic shapes come from simple ones: a sphere + displace = rock, blob, fruit; a box + bend = a curved
// panel; a cylinder + twist = a screw or a candle; a lathe + taper = a leaning vase.
import * as THREE from 'three';
import {mergeVertices} from 'three/addons/utils/BufferGeometryUtils.js';
import {fbm3} from './noise.js';

const AXES = {x: 0, y: 1, z: 2};

function map(geometry, fn, {weld = false} = {}) {
  let g = geometry.clone();
  if (weld && !g.index) g = mergeVertices(g.deleteAttribute('normal'));
  const p = g.attributes.position, v = new THREE.Vector3(), box = (g.computeBoundingBox(), g.boundingBox);
  for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); fn(v, box, i); p.setXYZ(i, v.x, v.y, v.z); }
  p.needsUpdate = true;
  g.computeVertexNormals();
  g.computeBoundingBox(); g.computeBoundingSphere();
  return g;
}

/** Bend around an axis: the geometry curls by `angle` radians over its length along `along`. */
export function bend(geometry, {angle = Math.PI / 4, along = 'y', toward = 'x'} = {}) {
  const a = AXES[along], t = AXES[toward];
  return map(geometry, (v, box) => {
    const c = [v.x, v.y, v.z], min = box.min.getComponent(a), len = box.max.getComponent(a) - min || 1;
    const u = (c[a] - min) / len, theta = u * angle, R = len / (angle || 1e-6);
    if (Math.abs(angle) < 1e-6) return;
    const r = R - c[t];
    c[a] = min + r * Math.sin(theta); c[t] = R - r * Math.cos(theta);
    v.set(c[0], c[1], c[2]);
  });
}

/** Twist around an axis by `angle` radians from one end to the other (screws, candles, twisted vases). */
export function twist(geometry, {angle = Math.PI / 2, axis = 'y'} = {}) {
  const a = AXES[axis], [b, c] = [0, 1, 2].filter(i => i !== a);
  return map(geometry, (v, box) => {
    const k = [v.x, v.y, v.z], min = box.min.getComponent(a), len = box.max.getComponent(a) - min || 1;
    const th = ((k[a] - min) / len) * angle, cs = Math.cos(th), sn = Math.sin(th);
    const x = k[b], y = k[c]; k[b] = x * cs - y * sn; k[c] = x * sn + y * cs;
    v.set(k[0], k[1], k[2]);
  });
}

/** Scale the cross-section along an axis: 1 at the start, `scale` at the end (`curve` shapes the change). */
export function taper(geometry, {scale = 0.6, axis = 'y', curve = 1} = {}) {
  const a = AXES[axis];
  return map(geometry, (v, box) => {
    const k = [v.x, v.y, v.z], min = box.min.getComponent(a), len = box.max.getComponent(a) - min || 1;
    const s = 1 + (scale - 1) * Math.pow((k[a] - min) / len, curve);
    for (let i = 0; i < 3; i++) if (i !== a) k[i] *= s;
    v.set(k[0], k[1], k[2]);
  });
}

/**
 * Push vertices along their normals by fractal noise: rocks, blobs, fruit skin, clay wobble, dough.
 * amount: in scene units; scale: noise features per unit. The geometry needs enough vertices
 * (IcosahedronGeometry(r, 32+) or a dense lathe). Seams are welded first so the surface stays closed.
 */
export function displace(geometry, {amount = 0.05, scale = 2, seed = 1, octaves = 4, fn = null} = {}) {
  const noise = fn ?? fbm3(seed, {octaves});
  let g = geometry.clone();
  if (g.attributes.normal) g.deleteAttribute('normal');
  g = mergeVertices(g.index ? g : g, 1e-5);
  g.computeVertexNormals();
  const p = g.attributes.position, n = g.attributes.normal, v = new THREE.Vector3(), d = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i); d.fromBufferAttribute(n, i);
    const h = noise(v.x * scale, v.y * scale, v.z * scale);
    v.addScaledVector(d, h * amount);
    p.setXYZ(i, v.x, v.y, v.z);
  }
  p.needsUpdate = true;
  g.computeVertexNormals();
  return g;
}

/** Inflate (or shrink with a negative amount) along the normals: puffy shapes, soft cushions, thicker shells. */
export function inflate(geometry, amount = 0.02) {
  return displace(geometry, {amount, fn: () => 1});
}

/** Squash & stretch a geometry about its base (volume-preserving): cartoon weight, soft materials. */
export function squash(geometry, {amount = 0.1, axis = 'y'} = {}) {
  const a = AXES[axis], s = 1 - amount, side = 1 / Math.sqrt(s);
  return map(geometry, (v, box) => {
    const k = [v.x, v.y, v.z], min = box.min.getComponent(a);
    for (let i = 0; i < 3; i++) k[i] = i === a ? min + (k[i] - min) * s : k[i] * side;
    v.set(k[0], k[1], k[2]);
  });
}
