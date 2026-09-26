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
 * {closed: true} treats the points as a closed outline and rounds every corner (shapes to extrude: a soft star,
 * a shield, a speech bubble): new THREE.Shape(roundCorners(pts, 0.05, 8, {closed: true}).map(([x, y]) => new THREE.Vector2(x, y))).
 */
export function roundCorners(points, radius, segments = 8, {closed = false} = {}) {
  const n = points.length, rOf = i => (Array.isArray(radius) ? radius[i] ?? 0 : radius);
  const fillet = (p0, p1, p2, r) => {
    const a = new THREE.Vector2(p0[0] - p1[0], p0[1] - p1[1]), b = new THREE.Vector2(p2[0] - p1[0], p2[1] - p1[1]);
    const la = a.length(), lb = b.length();
    if (!r || la < 1e-6 || lb < 1e-6) return [p1];
    a.divideScalar(la); b.divideScalar(lb);
    const angle = Math.acos(Math.min(1, Math.max(-1, a.dot(b))));
    if (angle > Math.PI - 1e-3) return [p1];
    const t = Math.min(r / Math.tan(angle / 2), la / 2, lb / 2);
    const rr = t * Math.tan(angle / 2);
    const bis = a.clone().add(b).normalize();
    const c = new THREE.Vector2(p1[0], p1[1]).addScaledVector(bis, rr / Math.sin(angle / 2));
    const st = new THREE.Vector2(p1[0], p1[1]).addScaledVector(a, t), e = new THREE.Vector2(p1[0], p1[1]).addScaledVector(b, t);
    const a0 = Math.atan2(st.y - c.y, st.x - c.x), a1 = Math.atan2(e.y - c.y, e.x - c.x);
    let d = a1 - a0; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI;
    const arc = [];
    for (let k = 0; k <= segments; k++) { const ang = a0 + (d * k) / segments; arc.push([c.x + rr * Math.cos(ang), c.y + rr * Math.sin(ang)]); }
    return arc;
  };
  if (closed) { // a ring: every corner is filleted, including the first (a repeated closing point is ignored)
    const ring = n > 2 && points[0][0] === points[n - 1][0] && points[0][1] === points[n - 1][1] ? points.slice(0, -1) : points;
    return ring.flatMap((p, i) => fillet(ring[(i - 1 + ring.length) % ring.length], p, ring[(i + 1) % ring.length], rOf(i)));
  }
  const out = [points[0]];
  for (let i = 1; i < n - 1; i++) out.push(...fillet(points[i - 1], points[i], points[i + 1], rOf(i)));
  out.push(points[n - 1]);
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
export function extrudeSVG(svgText, {size = 1.2, depth = 0.12, bevel = 0.012, bevelSegments = 6, curveSegments = 24, unit = null, center = true} = {}) {
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
  // unit: scene units per SVG unit (a shared scale for parts that must fit together); otherwise fit to `size`
  const k = unit ? 1 / unit : (box.max.x - box.min.x) / size;
  const g = new THREE.ExtrudeGeometry(shapes, {depth: depth * k, bevelEnabled: bevel > 0, bevelThickness: bevel * k, bevelSize: bevel * k * 0.8, bevelSegments, curveSegments: 1});
  g.scale(1 / k, 1 / k, 1 / k);
  g.computeBoundingBox();
  const bb = g.boundingBox;
  // center: false keeps the SVG's own coordinates (y up), so separately extruded parts stay aligned
  if (center) g.translate(-(bb.min.x + bb.max.x) / 2, -bb.min.y, -(bb.min.z + bb.max.z) / 2);
  return flatCaps(creased(g, 40)); // smooth bevels and curves, crisp where faces fold, dead flat front and back
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

// ------------------------------------------------------------------ crack-free subdivision and repair

/** Non-indexed copy as plain arrays: [{name, size, data: Float32Array}], plus a material index per triangle. */
function unpack(geometry) {
  const g = geometry.index ? geometry.toNonIndexed() : geometry;
  const attrs = Object.entries(g.attributes).map(([name, a]) => ({name, size: a.itemSize, data: Float32Array.from(a.array)}));
  const tris = g.attributes.position.count / 3, mats = new Int32Array(tris);
  for (const gr of g.groups) for (let t = gr.start / 3; t < Math.min(tris, (gr.start + gr.count) / 3); t++) mats[t] = gr.materialIndex ?? 0;
  return {attrs, mats, grouped: g.groups.length > 0};
}

/** Back to a BufferGeometry; groups rebuilt from runs of equal material index. Normals renormalised. */
function pack({attrs, mats, grouped}) {
  const g = new THREE.BufferGeometry();
  for (const a of attrs) g.setAttribute(a.name, new THREE.BufferAttribute(a.data, a.size));
  const n = g.attributes.normal;
  if (n) for (let i = 0; i < n.count; i++) { const x = n.getX(i), y = n.getY(i), z = n.getZ(i), l = Math.hypot(x, y, z) || 1; n.setXYZ(i, x / l, y / l, z / l); }
  if (grouped) { let start = 0; for (let t = 1; t <= mats.length; t++) if (t === mats.length || mats[t] !== mats[start]) { g.addGroup(start * 3, (t - start) * 3, mats[start]); start = t; } }
  return g;
}

const edgeKey = (P, i, j) => {
  const k = v => `${Math.round(P[v * 3] * 1e5)},${Math.round(P[v * 3 + 1] * 1e5)},${Math.round(P[v * 3 + 2] * 1e5)}`;
  const a = k(i), b = k(j);
  return a < b ? a + '|' + b : b + '|' + a;
};

/**
 * Subdivide until no edge is longer than `maxEdge`, splitting each edge the same way in both triangles that share
 * it (edges are keyed by their end positions), so no T-junctions or hairline cracks appear. three's
 * TessellateModifier splits per triangle and leaves such cracks. Keeps every attribute and the material groups.
 * Use it before deformers or displacement on sparse geometry, and before baking AO on big flat faces.
 */
export function refine(geometry, maxEdge, {passes = 12, maxTriangles = 600000} = {}) {
  const G = unpack(geometry), max2 = maxEdge * maxEdge;
  for (let pass = 0; pass < passes; pass++) {
    const P = G.attrs.find(a => a.name === 'position').data, T = P.length / 9;
    const long = (i, j) => (P[i * 3] - P[j * 3]) ** 2 + (P[i * 3 + 1] - P[j * 3 + 1]) ** 2 + (P[i * 3 + 2] - P[j * 3 + 2]) ** 2 > max2;
    const split = new Set();
    for (let t = 0; t < T; t++) for (const [i, j] of [[0, 1], [1, 2], [2, 0]]) if (long(t * 3 + i, t * 3 + j)) split.add(edgeKey(P, t * 3 + i, t * 3 + j));
    if (!split.size) break;
    // corners 0..2 and midpoints 3 (0–1), 4 (1–2), 5 (2–0); which edges split decides the pattern
    const patterns = [];
    let outT = 0;
    for (let t = 0; t < T; t++) {
      const v = t * 3, s = [split.has(edgeKey(P, v, v + 1)), split.has(edgeKey(P, v + 1, v + 2)), split.has(edgeKey(P, v + 2, v))];
      const f = s[0] && s[1] && s[2] ? [[0, 3, 5], [3, 1, 4], [5, 4, 2], [3, 4, 5]]
        : s[0] && s[1] ? [[3, 1, 4], [0, 3, 4], [0, 4, 2]] : s[1] && s[2] ? [[4, 2, 5], [0, 1, 4], [0, 4, 5]] : s[2] && s[0] ? [[0, 3, 5], [3, 1, 2], [3, 2, 5]]
        : s[0] ? [[0, 3, 2], [3, 1, 2]] : s[1] ? [[0, 1, 4], [0, 4, 2]] : s[2] ? [[0, 1, 5], [5, 1, 2]] : [[0, 1, 2]];
      patterns.push(f); outT += f.length;
    }
    if (outT > maxTriangles) break;
    const out = G.attrs.map(a => new Float32Array(outT * 3 * a.size)), mats = new Int32Array(outT);
    let o = 0;
    for (let t = 0; t < T; t++) {
      const v = t * 3;
      for (const tri of patterns[t]) {
        for (let c = 0; c < 3; c++) {
          const k = tri[c];
          G.attrs.forEach((a, ai) => {
            const s = a.size, d = a.data, dst = out[ai], at = (o * 3 + c) * s;
            if (k < 3) for (let q = 0; q < s; q++) dst[at + q] = d[(v + k) * s + q];
            else { const i = v + (k - 3), j = v + ((k - 2) % 3); for (let q = 0; q < s; q++) dst[at + q] = (d[i * s + q] + d[j * s + q]) * 0.5; }
          });
        }
        mats[o++] = G.mats[t];
      }
    }
    G.attrs.forEach((a, ai) => { a.data = out[ai]; });
    G.mats = mats;
  }
  return pack(G);
}

/**
 * Close T-junctions: where a vertex lies on another triangle's edge (typical along boolean cuts), split that
 * triangle through it, so the surface has no hairline cracks (dotted lines and pinholes in transparent renders).
 * Only edges used by a single triangle can hide a T-junction, so only those are searched.
 */
export function fixTJunctions(geometry, {tolerance = 1e-5} = {}) {
  const G = unpack(geometry);
  geometry.computeBoundingSphere();
  const eps = Math.max(1e-7, geometry.boundingSphere.radius * tolerance);
  for (let pass = 0; pass < 4; pass++) {
    const P = G.attrs.find(a => a.name === 'position').data, T = P.length / 9;
    const vk = i => `${Math.round(P[i * 3] / eps)},${Math.round(P[i * 3 + 1] / eps)},${Math.round(P[i * 3 + 2] / eps)}`;
    const ek = (i, j) => { const a = vk(i), b = vk(j); return a < b ? a + '|' + b : b + '|' + a; };
    const uses = new Map();
    for (let t = 0; t < T; t++) for (let e = 0; e < 3; e++) { const k = ek(t * 3 + e, t * 3 + (e + 1) % 3); uses.set(k, (uses.get(k) ?? 0) + 1); }
    const open = [], ends = new Map();
    for (let t = 0; t < T; t++) for (let e = 0; e < 3; e++) {
      const i = t * 3 + e, j = t * 3 + (e + 1) % 3;
      if (uses.get(ek(i, j)) !== 1) continue;
      open.push([t, e]);
      for (const v of [i, j]) ends.set(vk(v), [P[v * 3], P[v * 3 + 1], P[v * 3 + 2]]);
    }
    if (!open.length) break;
    const cand = [...ends.values()], splits = new Map(); // triangle → {e, ts}
    for (const [t, e] of open) {
      if (splits.has(t)) continue; // one edge per triangle per pass; the rest follow in the next pass
      const i = t * 3 + e, j = t * 3 + (e + 1) % 3;
      const a = [P[i * 3], P[i * 3 + 1], P[i * 3 + 2]], d = [P[j * 3] - a[0], P[j * 3 + 1] - a[1], P[j * 3 + 2] - a[2]];
      const L2 = d[0] ** 2 + d[1] ** 2 + d[2] ** 2, L = Math.sqrt(L2);
      if (L < eps * 4) continue;
      const ts = [];
      for (const p of cand) {
        const u = ((p[0] - a[0]) * d[0] + (p[1] - a[1]) * d[1] + (p[2] - a[2]) * d[2]) / L2;
        if (u * L < eps * 2 || (1 - u) * L < eps * 2) continue;
        const q = [a[0] + d[0] * u - p[0], a[1] + d[1] * u - p[1], a[2] + d[2] * u - p[2]];
        if (q[0] ** 2 + q[1] ** 2 + q[2] ** 2 < eps * eps) ts.push(u);
      }
      if (ts.length) splits.set(t, {e, ts: [...new Set(ts)].sort((x, y) => x - y)});
    }
    if (!splits.size) break;
    // fan from the opposite corner through the points on the split edge: (e, p1, opp), (p1, p2, opp), …, (pk, e+1, opp)
    const plan = [];
    for (let t = 0; t < T; t++) {
      const sp = splits.get(t);
      if (!sp) { plan.push({t, e: -1}); continue; }
      const stops = [0, ...sp.ts, 1];
      for (let k = 0; k + 1 < stops.length; k++) plan.push({t, e: sp.e, t0: stops[k], t1: stops[k + 1]});
    }
    const out = G.attrs.map(a => new Float32Array(plan.length * 3 * a.size)), mats = new Int32Array(plan.length);
    plan.forEach((n, o) => {
      const v = n.t * 3;
      G.attrs.forEach((a, ai) => {
        const s = a.size, d = a.data, dst = out[ai], put = (c, get) => { for (let q = 0; q < s; q++) dst[(o * 3 + c) * s + q] = get(q); };
        if (n.e < 0) { for (let c = 0; c < 3; c++) put(c, q => d[(v + c) * s + q]); return; }
        const A = v + n.e, B = v + (n.e + 1) % 3, C = v + (n.e + 2) % 3, lerp = (u, q) => d[A * s + q] + (d[B * s + q] - d[A * s + q]) * u;
        put(0, q => lerp(n.t0, q)); put(1, q => lerp(n.t1, q)); put(2, q => d[C * s + q]);
      });
      mats[o] = G.mats[n.t];
    });
    G.attrs.forEach((a, ai) => { a.data = out[ai]; });
    G.mats = mats;
  }
  return pack(G);
}

/** Give the flat front and back of an extrusion (along z) exact flat normals: smoothed rims otherwise streak across big faces. */
export function flatCaps(geometry, {axis = 'z'} = {}) {
  const k = {x: 0, y: 1, z: 2}[axis], p = geometry.attributes.position, n = geometry.attributes.normal;
  if (!n || geometry.index) return geometry; // needs one vertex per triangle corner (creased() output)
  let lo = Infinity, hi = -Infinity;
  for (let i = 0; i < p.count; i++) { const v = p.getComponent(i, k); lo = Math.min(lo, v); hi = Math.max(hi, v); }
  const eps = (hi - lo) * 1e-4;
  // only triangles lying in a cap plane: the first bevel ring shares the rim positions but keeps its own normals
  for (let t = 0; t < p.count; t += 3) {
    const zs = [0, 1, 2].map(c => p.getComponent(t + c, k));
    const top = zs.every(z => z > hi - eps), bottom = zs.every(z => z < lo + eps);
    if (!top && !bottom) continue;
    for (let c = 0; c < 3; c++) { n.setXYZ(t + c, 0, 0, 0); n.setComponent(t + c, k, top ? 1 : -1); }
  }
  n.needsUpdate = true;
  return geometry;
}
