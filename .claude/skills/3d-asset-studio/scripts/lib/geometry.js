// Geometry helpers for product-style objects. Units are arbitrary but keep objects around 0.5–2 units
// across and standing on y = 0; the studio frames and lights whatever you build.
import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {SVGLoader} from 'three/addons/loaders/SVGLoader.js';
import {mergeVertices, toCreasedNormals} from 'three/addons/utils/BufferGeometryUtils.js';

/**
 * Smooth normals that stay crisp where faces fold more than `angle` degrees. three's toCreasedNormals welds vertices
 * on a fixed 0.01 grid — 1 mm at 1 unit = 10 cm, coarser than small bevels — so scale the geometry up first.
 */
export function creased(geometry, angle = 40) {
  geometry.computeBoundingSphere();
  const k = 100 / Math.max(geometry.boundingSphere.radius, 1e-6);
  const g = toCreasedNormals(geometry.clone().scale(k, k, k), THREE.MathUtils.degToRad(angle));
  return g.scale(1 / k, 1 / k, 1 / k);
}

/**
 * Round the interior corners of a polyline with circular fillets.
 * points: [[x, y], ...]; radius: number or per-corner array (0 keeps a sharp corner).
 */
export function roundCorners(points, radius, segments = 8) {
  const out = [points[0]];
  for (let i = 1; i < points.length - 1; i++) {
    const r = Array.isArray(radius) ? radius[i] ?? 0 : radius;
    const [p0, p1, p2] = [points[i - 1], points[i], points[i + 1]];
    const a = new THREE.Vector2(p0[0] - p1[0], p0[1] - p1[1]), b = new THREE.Vector2(p2[0] - p1[0], p2[1] - p1[1]);
    const la = a.length(), lb = b.length();
    if (!r || la < 1e-6 || lb < 1e-6) { out.push(p1); continue; }
    a.divideScalar(la); b.divideScalar(lb);
    const angle = Math.acos(Math.min(1, Math.max(-1, a.dot(b))));
    if (angle > Math.PI - 1e-3) { out.push(p1); continue; }
    const t = Math.min(r / Math.tan(angle / 2), la / 2, lb / 2);
    const rr = t * Math.tan(angle / 2);
    const bis = a.clone().add(b).normalize();
    const c = new THREE.Vector2(p1[0], p1[1]).addScaledVector(bis, rr / Math.sin(angle / 2));
    const s = new THREE.Vector2(p1[0], p1[1]).addScaledVector(a, t), e = new THREE.Vector2(p1[0], p1[1]).addScaledVector(b, t);
    let a0 = Math.atan2(s.y - c.y, s.x - c.x), a1 = Math.atan2(e.y - c.y, e.x - c.x);
    let d = a1 - a0; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI;
    for (let k = 0; k <= segments; k++) { const ang = a0 + (d * k) / segments; out.push([c.x + rr * Math.cos(ang), c.y + rr * Math.sin(ang)]); }
  }
  out.push(points[points.length - 1]);
  return out;
}

/**
 * Smooth 2D curve through points (Catmull-Rom), sampled into `samples` points: organic lathe profiles
 * (cups, vases, bottles, bells) without the flat bands that a few straight segments leave.
 */
export function spline(points, samples = 48, tension = 0.5) {
  const curve = new THREE.SplineCurve(points.map(([x, y]) => new THREE.Vector2(x, y)));
  void tension;
  return curve.getSpacedPoints(samples - 1).map(v => [v.x, v.y]);
}

/**
 * Even texture density on any geometry: faces pointing up/down take plan (x, z) coordinates,
 * everything else takes arc length around the vertical axis. Fixes the radial streaks that
 * lathe UVs produce with grain textures.
 */
export function evenUV(geometry, scale = 0.5) {
  const p = geometry.attributes.position, n = geometry.attributes.normal, uv = geometry.attributes.uv;
  if (!uv || !n) return geometry;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    if (Math.abs(n.getY(i)) > 0.6) uv.setXY(i, x * scale, z * scale);
    else uv.setXY(i, Math.atan2(z, x) * Math.hypot(x, z) * scale, y * scale);
  }
  uv.needsUpdate = true;
  return geometry;
}

/**
 * Solid of revolution around the y axis from a profile of [radius, height] points
 * (bottom to top, outside first). Pair with roundCorners for soft product edges.
 * Corners sharper than `crease` degrees stay crisp (the point is doubled so each side keeps its own normal);
 * LatheGeometry's own normals are kept, so there is no shading seam where the revolution closes.
 */
export function lathe(profile, {segments = 160, uvScale = 0.5, crease = 35} = {}) {
  const pts = [];
  profile.forEach(([r, y], i) => {
    const p = new THREE.Vector2(Math.max(0, r), y);
    pts.push(p);
    if (i > 0 && i < profile.length - 1) {
      const a = new THREE.Vector2(r - profile[i - 1][0], y - profile[i - 1][1]), b = new THREE.Vector2(profile[i + 1][0] - r, profile[i + 1][1] - y);
      if (a.lengthSq() > 1e-12 && b.lengthSq() > 1e-12 && a.angleTo(b) > THREE.MathUtils.degToRad(crease)) pts.push(p.clone());
    }
  });
  const g = new THREE.LatheGeometry(pts, segments);
  return evenUV(g, uvScale);
}

/** Closed ring profile helper: outer/inner radius, height, corner radius. Returns a lathe geometry. */
export function roundedDisc({outer = 1, inner = 0, height = 0.2, radius = 0.05, segments = 160} = {}) {
  const pts = inner > 0
    ? [[inner, 0], [outer, 0], [outer, height], [inner, height], [inner, 0]]
    : [[0, 0], [outer, 0], [outer, height], [0, height]];
  const r = inner > 0 ? [0, radius, radius, radius * 0.5, 0] : [0, radius, radius, 0];
  return lathe(roundCorners(pts, r), {segments});
}

/** Tube along a smooth curve through points (handles, cables, pipes). */
export function tube(points, radius, {tubular = 220, radial = 36, closed = false, tension = 0.5} = {}) {
  const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)), closed, 'catmullrom', tension);
  const g = new THREE.TubeGeometry(curve, tubular, radius, radial, closed);
  return g;
}

/**
 * Flat band along a curve (resistance bands, straps, ribbons, belts, cables with a flat section).
 * The band's width runs along `up` (world +y: it stands on its edge like a loop band on the floor);
 * `twist(t)` turns it around the curve, in radians, for t from 0 to 1 (a closed loop needs whole turns
 * of π to meet itself: 0, π, 2π…). Points are the centre line, so a band standing on the floor has y = width / 2.
 */
export function ribbon(points, {width = 0.18, thickness = 0.02, closed = true, segments = 400, up = [0, 1, 0], twist = null, round = 0.35, tension = 0.5, caps = !closed} = {}) {
  const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)), closed, 'catmullrom', tension);
  const U = new THREE.Vector3(...up).normalize();
  // rounded-rectangle cross-section in (side, width) coordinates
  const hw = width / 2, ht = thickness / 2, cr = Math.min(ht, hw) * Math.min(1, round * 2);
  const section = roundCorners([[0, -hw], [ht, -hw], [ht, hw], [-ht, hw], [-ht, -hw], [0, -hw]], [0, cr, cr, cr, cr, 0], 4).slice(0, -1);
  const pos = [], uv = [], idx = [];
  // one extra ring on closed loops too, so the texture runs on across the seam instead of jumping back
  const n = section.length, rings = segments + 1;
  let length = 0, prev = null;
  for (let s = 0; s < rings; s++) {
    const t = s / segments, P = curve.getPointAt(Math.min(t, 1)), T = curve.getTangentAt(Math.min(t, 1));
    if (prev) length += P.distanceTo(prev);
    prev = P;
    let B = U.clone().addScaledVector(T, -U.dot(T)).normalize(); // width direction, square to the curve
    if (twist) B.applyAxisAngle(T, twist(t));
    const N = new THREE.Vector3().crossVectors(B, T).normalize();
    section.forEach(([sx, sy], k) => {
      const v = P.clone().addScaledVector(N, sx).addScaledVector(B, sy);
      pos.push(v.x, v.y, v.z);
      uv.push(length * 2, (sy / width + 0.5) * width * 4);
    });
  }
  for (let s = 0; s < rings - 1; s++) for (let k = 0; k < n; k++) {
    const a = s * n + k, b = s * n + ((k + 1) % n), c = (s + 1) * n + k, d = (s + 1) * n + ((k + 1) % n);
    idx.push(a, b, c, b, d, c);
  }
  if (caps && !closed) { // close both ends of an open band with a fan around the section's centre
    for (const [ring, flip] of [[0, true], [rings - 1, false]]) {
      // own copies of the rim vertices, so the cap gets its own (flat) normals and a crisp edge
      const src = ring * n, start = pos.length / 3, cx = [0, 0, 0];
      for (let k = 0; k < n; k++) { for (let j = 0; j < 3; j++) { const v = pos[(src + k) * 3 + j]; pos.push(v); cx[j] += v / n; } uv.push(0, 0); }
      const ci = pos.length / 3; pos.push(...cx); uv.push(0, 0);
      for (let k = 0; k < n; k++) { const a = start + k, b = start + ((k + 1) % n); if (flip) idx.push(ci, b, a); else idx.push(ci, a, b); }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  if (closed) { // the first and last ring are the same place: give them the same normals, or a seam shows
    const nrm = g.attributes.normal, last = (rings - 1) * n;
    for (let k = 0; k < n; k++) {
      const v = new THREE.Vector3().fromBufferAttribute(nrm, k).add(new THREE.Vector3().fromBufferAttribute(nrm, last + k)).normalize();
      nrm.setXYZ(k, v.x, v.y, v.z); nrm.setXYZ(last + k, v.x, v.y, v.z);
    }
  }
  return g;
}

/** Box with rounded edges (packaging, phones, blocks, cushions). */
export function roundedBox(w = 1, h = 1, d = 1, radius = 0.08, segments = 6) {
  return new RoundedBoxGeometry(w, h, d, segments, radius);
}

/**
 * Extrude an SVG (logo, icon, lettering) into a solid with bevelled edges.
 * Returns geometry centred on x/z and standing on y = 0, facing +z. `size` is the final width.
 * The SVG is flipped in 2D before extruding (SVG y points down), so faces keep their outward winding.
 */
export function extrudeSVG(svgText, {size = 1.2, depth = 0.12, bevel = 0.012, bevelSegments = 6, curveSegments = 24} = {}) {
  const data = new SVGLoader().parse(svgText);
  const src = data.paths.flatMap(p => SVGLoader.createShapes(p));
  if (!src.length) throw new Error('extrudeSVG: no filled shapes in the SVG (outline strokes must be converted to filled paths first)');
  const flip = pts => pts.map(p => new THREE.Vector2(p.x, -p.y));
  const shapes = src.map(sh => {
    const {shape, holes} = sh.extractPoints(curveSegments);
    const out = new THREE.Shape(flip(shape));
    out.holes = holes.map(h => new THREE.Path(flip(h)));
    return out;
  });
  // bevel and depth are in final units; the outline is scaled after extruding, so work in SVG units here
  const box = new THREE.Box2(); for (const sh of shapes) for (const p of sh.getPoints()) box.expandByPoint(p);
  const k = (box.max.x - box.min.x) / size;
  const g = new THREE.ExtrudeGeometry(shapes, {depth: depth * k, bevelEnabled: bevel > 0, bevelThickness: bevel * k, bevelSize: bevel * k * 0.8, bevelSegments, curveSegments: 1});
  g.scale(1 / k, 1 / k, 1 / k);
  g.computeBoundingBox();
  const bb = g.boundingBox;
  g.translate(-(bb.min.x + bb.max.x) / 2, -bb.min.y, -(bb.min.z + bb.max.z) / 2);
  return creased(g, 40); // smooth bevels and curves, crisp where faces fold
}

/** Signed volume of a closed mesh: positive when faces wind outward (a quick inside-out check). */
export function signedVolume(geometry) {
  const g = geometry.index ? geometry.toNonIndexed() : geometry, p = g.attributes.position;
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
  let v = 0;
  for (let i = 0; i < p.count; i += 3) { a.fromBufferAttribute(p, i); b.fromBufferAttribute(p, i + 1); c.fromBufferAttribute(p, i + 2); v += a.dot(b.cross(c)) / 6; }
  return v;
}

/** Smooth normals for hand-built or imported geometry; edges folding more than `crease` degrees stay crisp. */
export function smooth(geometry, {crease = 40, tolerance = 1e-4} = {}) {
  if (crease >= 180) { const g = mergeVertices(geometry, tolerance); g.computeVertexNormals(); return g; }
  return creased(geometry, crease);
}

/**
 * Low-poly remesh by vertex clustering: vertices snap to a 3D grid of `cell` size and merge, faces that
 * collapse are dropped. Fast on any mesh and gives the faceted, crystalline look; pair with flatShading.
 * `jitter` (0–0.5 of a cell) breaks the grid regularity. Returns non-indexed geometry with flat normals.
 */
export function facet(geometry, {cell = 0.08, jitter = 0.18, seed = 3} = {}) {
  // clustering is by position, so seams and duplicated vertices merge anyway
  const g = geometry.index ? geometry : mergeVertices(geometry.clone().deleteAttribute('normal').deleteAttribute('uv'));
  const p = g.attributes.position, idx = g.index;
  const key = new Map(), sums = [], remap = new Int32Array(p.count);
  for (let i = 0; i < p.count; i++) {
    const k = Math.round(p.getX(i) / cell) + ',' + Math.round(p.getY(i) / cell) + ',' + Math.round(p.getZ(i) / cell);
    let c = key.get(k);
    if (c === undefined) { c = sums.length; key.set(k, c); sums.push([0, 0, 0, 0]); }
    const s = sums[c]; s[0] += p.getX(i); s[1] += p.getY(i); s[2] += p.getZ(i); s[3]++;
    remap[i] = c;
  }
  let a = seed >>> 0; const rand = () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const verts = sums.map(([x, y, z, n]) => [x / n + (rand() - 0.5) * jitter * cell, y / n + (rand() - 0.5) * jitter * cell * 0.5, z / n + (rand() - 0.5) * jitter * cell]);
  const out = [], seen = new Set();
  for (let t = 0; t < idx.count; t += 3) {
    const i = remap[idx.getX(t)], j = remap[idx.getX(t + 1)], k = remap[idx.getX(t + 2)];
    if (i === j || j === k || k === i) continue;
    const id = [i, j, k].sort((x, y) => x - y).join(',');
    if (seen.has(id)) continue; seen.add(id);
    out.push(...verts[i], ...verts[j], ...verts[k]);
  }
  const res = new THREE.BufferGeometry();
  res.setAttribute('position', new THREE.Float32BufferAttribute(out, 3));
  res.computeVertexNormals(); // non-indexed: one normal per face, i.e. flat facets
  return res;
}

/** Move an object so its lowest point sits on the floor (y = 0). */
export function onFloor(object) {
  object.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(object, true); // precise: a rotated object's real lowest vertex
  object.position.y -= box.min.y;
  return object;
}
