// A library of parametric objects at real size (1 unit = 10 cm), each standing on y = 0 and centred on x/z.
// Use them as they are, recolour them, or read them as worked examples of the techniques: every generator is
// short on purpose. All take an options object and return a THREE.Group (or Mesh) named after the object.
import * as THREE from 'three';
import {lathe, roundCorners, spline, tube, ribbon, roundedBox, extrudeSVG} from './geometry.js';
import * as M from './materials.js';
import {displace, bend, taper, squash} from './deform.js';
import {scatter} from './scatter.js';

const group = (name, ...parts) => { const g = new THREE.Group(); g.name = name; for (const p of parts) if (p) g.add(p); return g; };
const mesh = (geometry, material, name) => { const m = new THREE.Mesh(geometry, material); if (name) m.name = name; return m; };
const place = (o, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) => { o.position.set(x, y, z); o.rotation.set(rx, ry, rz); return o; };
const hex = c => (typeof c === 'string' ? parseInt(c.replace('#', ''), 16) : c);

function roundedRectShape(w, h, r) {
  const s = new THREE.Shape(), x = -w / 2, y = -h / 2; r = Math.min(r, w / 2, h / 2);
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r); s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h); s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
  return s;
}
export {roundedRectShape};

/* ================================================================== fitness */

/** Rubber weight plate with a steel hub. diameter 4.5 = a 20 kg Olympic plate. */
export function weightPlate({diameter = 4.5, thickness = 0.5, hole = 0.51, color = 0x252625} = {}) {
  const R = diameter / 2, t = thickness, b = Math.min(t * 0.3, R * 0.06), hr = hole / 2 + 0.06, rec = t * 0.09, pts = [];
  const arc = (cx, cy, r, a0, a1, n = 10) => { for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); } };
  pts.push([hr, 0]); arc(R - b, b, b, -Math.PI / 2, 0); arc(R - b, t - b, b, 0, Math.PI / 2);
  pts.push([R - b - R * 0.05, t]); arc(R * 0.86, t - rec - R * 0.02, R * 0.02, Math.PI / 2 - 0.2, Math.PI, 6);
  pts.push([hr + R * 0.06, t - rec], [hr + R * 0.02, t - rec * 0.3], [hr, t - rec * 0.3], [hr, 0]);
  const e = 0.012, r0 = hole / 2, r1 = hr + 0.01, top = t + 0.004;
  const hub = [[r0, -0.002], [r1, -0.002], [r1, top - e], [r1 - e, top], [r0 + e, top], [r0, top - e], [r0, -0.002]];
  return group('weight-plate', mesh(lathe(pts), M.rubber({color: hex(color)})), mesh(lathe(hub, {segments: 120}), M.brushedSteel()));
}

/** Competition-style kettlebell. size 1 ≈ 16 kg (body ⌀ 2.1). */
export function kettlebell({size = 1, color = 0x2a2b2b, handle = 0xbdbab4} = {}) {
  const R = 1.05 * size, cy = 0.88 * size, a0 = Math.asin(-cy / R), pts = [[0, 0], [Math.sqrt(R * R - cy * cy), 0]];
  for (let i = 1; i <= 48; i++) { const a = a0 + (Math.PI / 2 - a0) * (i / 48); pts.push([R * Math.cos(a), cy + R * Math.sin(a)]); }
  const iron = M.powderCoat({color: hex(color)});
  const k = size * 2.1;
  const path = [[-0.335, 0.6], [-0.365, 0.86], [-0.356, 1.04], [-0.27, 1.17], [-0.1, 1.215], [0.1, 1.215], [0.27, 1.17], [0.356, 1.04], [0.365, 0.86], [0.335, 0.6]].map(([x, y]) => [x * k, y * k, 0]);
  const horn = lathe(roundCorners([[0, 0], [0.15, 0], [0.108, 0.06], [0.084, 0.16], [0.077, 0.29], [0, 0.3]].map(([x, y]) => [x * k, y * k]), [0, 0, 0.05 * k, 0.08 * k, 0.012 * k, 0], 8), {segments: 72});
  const g = group('kettlebell', mesh(lathe(roundCorners(pts, [0, 0.08 * size], 8), {segments: 180}), iron), mesh(tube(path, 0.066 * k, {tubular: 260, radial: 40}), M.brushedSteel({color: hex(handle)}, {roughness: 0.3})));
  for (const side of [-1, 1]) g.add(place(mesh(horn, iron), side * 0.33 * k, 0.6 * k, 0, 0, 0, side * -0.11));
  return g;
}

/** Hex dumbbell: rubber heads, knurled chrome handle. length 3.2 ≈ a 10 kg dumbbell. */
export function dumbbell({length = 3.2, head = 0.95, color = 0x252625} = {}) {
  const hexShape = new THREE.Shape(); for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2 + Math.PI / 6; const p = [Math.cos(a) * head / 2, Math.sin(a) * head / 2]; i ? hexShape.lineTo(...p) : hexShape.moveTo(...p); }
  const w = length * 0.24;
  const headGeo = new THREE.ExtrudeGeometry(hexShape, {depth: w, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05, bevelSegments: 5, curveSegments: 1});
  headGeo.translate(0, 0, -w / 2);
  const steel = M.withGrain(M.chrome({}, {roughness: 0.18}), {scale: 900, bump: 0.6, roughVar: 0.05, tintVar: 0});
  const bar = new THREE.CylinderGeometry(0.16, 0.16, length - 2 * w, 48, 1).rotateZ(Math.PI / 2);
  const g = group('dumbbell', mesh(bar, steel));
  for (const s of [-1, 1]) g.add(place(mesh(headGeo, M.rubber({color: hex(color)})), s * (length / 2 - w / 2), 0, 0, 0, Math.PI / 2, 0));
  g.position.y = head / 2 * Math.cos(Math.PI / 6) + 0.05; // rests on a flat of the hex
  return group('dumbbell', g);
}

/** Exercise ball with latitude seams (⌀ 6.5 = 65 cm) — or any smooth ball with seams: 'none'. */
export function exerciseBall({diameter = 6.5, color = 0x767d33, seams = 15} = {}) {
  const r = diameter / 2;
  const tex = (fill) => M.canvasTexture(8, 1024, (g, w, h) => { const img = g.createImageData(w, h); for (let y = 0; y < h; y++) { const v = fill(y / h); for (let x = 0; x < w; x++) img.data.set(v, (y * w + x) * 4); } g.putImageData(img, 0, 0); });
  const height = v => { const f = (v * seams) % 1, d = Math.min(f, 1 - f) / 0.035; return d < 1 ? -(1 - d * d) : 0; };
  const normalMap = tex(v => { const dy = (height(v + 1 / 1024) - height(v - 1 / 1024)) * 2.2, l = Math.hypot(dy, 1); return [128, 128 + 127 * dy / l, 255 / l, 255]; });
  normalMap.colorSpace = THREE.NoColorSpace;
  const map = tex(v => { const k = 255 * (1 + height(v) * 0.07); return [k, k, k, 255]; });
  const mat = new THREE.MeshPhysicalMaterial({color: hex(color), map: seams ? map : null, normalMap: seams ? normalMap : null, roughness: 0.6, clearcoat: 0.18, clearcoatRoughness: 0.45, sheen: 0.3, sheenRoughness: 0.55, sheenColor: new THREE.Color(0xc9d08a)});
  const m = mesh(new THREE.SphereGeometry(r, 160, 120), mat, 'ball');
  m.position.y = r; m.rotation.set(-0.16, 0.4, 0.17);
  return group('exercise-ball', m);
}

/** Tennis ball: felt with the classic curved seam (⌀ 0.67). */
export function tennisBall({diameter = 0.67, color = 0xd6e04a} = {}) {
  const r = diameter / 2, pts = [];
  for (let i = 0; i < 128; i++) { // the tennis-ball curve on a sphere
    const t = i / 128 * Math.PI * 2, a = 0.44;
    const v = new THREE.Vector3(Math.cos(t) + a * Math.cos(3 * t), Math.sin(t) - a * Math.sin(3 * t), 2 * Math.sqrt(a * (1 - a)) * Math.sin(2 * t)).normalize().multiplyScalar(r * 1.0);
    pts.push([v.x, v.y, v.z]);
  }
  const ball = mesh(new THREE.SphereGeometry(r, 96, 72), M.felt({color: hex(color)}));
  const seam = mesh(tube(pts, r * 0.035, {closed: true, tubular: 256, radial: 12}), M.felt({color: 0xf4f4ee}, {sheen: 0.6}));
  const g = group('tennis-ball', ball, seam); g.position.y = r; g.rotation.set(0.5, 0.3, 0.2);
  return group('tennis-ball', g);
}

/** Closed resistance band lying on the floor with a half twist (loop ~1.3 × 0.8). */
export function resistanceBand({color = 0x979087, width = 0.2, length = 1.3} = {}) {
  const w = width, t0 = 0.022, smooth = (a, b, x) => { const u = Math.min(1, Math.max(0, (x - a) / (b - a))); return u * u * (3 - 2 * u); };
  const turn = t => Math.PI * smooth(0.04, 0.3, t), k = length / 1.26;
  const outline = [[0, 0.02], [0.2, -0.26], [0.62, -0.38], [1.05, -0.26], [1.26, 0.04], [1.08, 0.3], [0.64, 0.4], [0.22, 0.32]].map(([x, z]) => [(x - 0.63) * k, z * k]);
  const curve = new THREE.CatmullRomCurve3(outline.map(([x, z]) => new THREE.Vector3(x, 0, z)), true), pts = [];
  for (let i = 0; i < 80; i++) { const t = i / 80, p = curve.getPointAt(t), a = turn(t); pts.push([p.x, (w / 2) * Math.abs(Math.cos(a)) + (t0 / 2) * Math.abs(Math.sin(a)) + 0.002, p.z]); }
  return group('resistance-band', mesh(ribbon(pts, {width: w, thickness: t0, closed: true, segments: 560, twist: turn}), M.fabric({color: hex(color)})));
}

/** Rolled yoga mat (61 cm wide), the spiral end showing. unrolled: 0 = fully rolled. */
export function yogaMat({width = 6.1, thickness = 0.06, turns = 4.5, core = 0.28, color = 0x8f9b86} = {}) {
  const pts = [], n = 360, gap = thickness * 1.02;
  for (let i = 0; i <= n; i++) { const a = i / n * turns * Math.PI * 2, r = core + gap * a / (Math.PI * 2); pts.push([0, Math.sin(a) * r, Math.cos(a) * r]); }
  const geo = ribbon(pts, {width, thickness, closed: false, segments: 900, up: [1, 0, 0], round: 0.5, caps: true, tension: 0.5});
  const outer = core + gap * turns;
  const m = mesh(geo, M.foam({color: hex(color)}), 'mat'); m.position.y = outer + thickness / 2;
  return group('yoga-mat', m);
}

/** Yoga block (23 × 15 × 7.5 cm) in cork or foam. */
export function yogaBlock({w = 2.3, h = 1.5, d = 0.75, material = 'cork', color} = {}) {
  const mat = material === 'cork' ? M.cork(color ? {color: hex(color)} : {}) : M.foam({color: hex(color ?? 0x7d8b9a)});
  const m = mesh(roundedBox(w, d, h, Math.min(d, h) * 0.12, 5), mat, 'block'); m.position.y = d / 2;
  return group('yoga-block', m);
}

/* ================================================================== kitchen & table */

/** Glazed mug with a loop handle (⌀ 8.4 cm, 9.5 cm tall). */
export function mug({height = 0.95, radius = 0.42, color = 0xf1eee8, wall = 0.035} = {}) {
  const outer = spline([[radius * 0.92, 0], [radius, 0.1], [radius, height * 0.9], [radius * 0.99, height]], 24);
  const inner = spline([[radius - wall, height], [radius - wall, height * 0.5], [radius - wall * 1.2, 0.12]], 16);
  const pts = [[0, 0.01], [radius * 0.85, 0.01], ...outer, ...inner, [0, 0.1]];
  const r = pts.map((_, i) => (i === 1 ? 0.012 : i === 1 + outer.length || i === 2 + outer.length ? 0.012 : 0));
  const glaze = M.ceramic({color: hex(color)});
  const handle = tube([[radius - 0.01, height * 0.78, 0], [radius + 0.2, height * 0.8, 0], [radius + 0.28, height * 0.55, 0], [radius + 0.2, height * 0.28, 0], [radius - 0.01, height * 0.26, 0]], 0.045, {tubular: 120, radial: 24, tension: 0.4});
  const coffee = place(mesh(new THREE.CircleGeometry(radius - wall, 64), new THREE.MeshPhysicalMaterial({color: 0x3b2314, roughness: 0.25, clearcoat: 0.8}), 'coffee'), 0, height * 0.86, 0, -Math.PI / 2);
  return group('mug', mesh(lathe(roundCorners(pts, r, 6), {segments: 180}), glaze, 'cup'), mesh(handle, glaze, 'handle'), coffee);
}

/** Bottle: 'wine' (75 cl), 'water', 'cosmetic' (pump-less), 'beer'. glass: true uses tinted glass. */
export function bottle({type = 'wine', color = 0x2f4a3a, label = null, glass = true} = {}) {
  const P = {wine: [[0.37, 0], [0.38, 1.9], [0.3, 2.25], [0.14, 2.45], [0.13, 2.95], [0.145, 3.0]], water: [[0.34, 0], [0.35, 1.6], [0.25, 1.95], [0.12, 2.15], [0.12, 2.3]], beer: [[0.3, 0], [0.31, 1.2], [0.22, 1.65], [0.12, 1.95], [0.12, 2.25], [0.135, 2.3]], cosmetic: [[0.25, 0], [0.26, 1.15], [0.2, 1.24], [0.11, 1.28], [0.11, 1.38]]}[type];
  const body = spline(P, 60);
  const pts = [[0, 0.02], [P[0][0] - 0.02, 0.02], ...body, [0, body[body.length - 1][1]]];
  const mat = glass ? M.glass({color: hex(color), frost: 0.06}, {thickness: 0.3, attenuationDistance: 0.4}) : M.plastic({color: hex(color), glossy: true});
  const g = group(`bottle-${type}`, mesh(lathe(roundCorners(pts, [0, 0.04, ...body.map(() => 0), 0], 6), {segments: 160}), mat));
  const top = body[body.length - 1];
  const capH = type === 'wine' ? 0.35 : 0.22;
  g.add(place(mesh(lathe(roundCorners([[0, 0], [top[0] + 0.02, 0], [top[0] + 0.02, capH], [0, capH]], [0, 0.02, 0.02, 0])), type === 'wine' ? M.paint({color: 0x6e2a2a}) : M.plastic({color: 0x1d1f22, glossy: true})), 0, top[1] - capH * 0.3, 0));
  if (label) {
    const h = P[0][0] * 2.2, r = P[0][0] + 0.004;
    const lab = mesh(new THREE.CylinderGeometry(r, r, h, 96, 1, true, -Math.PI * 0.45, Math.PI * 0.9), new THREE.MeshPhysicalMaterial({map: label, roughness: 0.6}));
    lab.position.y = body[Math.floor(body.length * 0.35)][1];
    g.add(lab);
  }
  return g;
}

/** Glass jar with a metal lid (jam, candles, cosmetics). */
export function jar({height = 1.1, radius = 0.45, lid = 0xbdbab4, glassColor = 0xcfe3da, frost = 0.04, fill = null} = {}) {
  const pts = [[0, 0.01], [radius - 0.05, 0.01], ...spline([[radius, 0.06], [radius, height * 0.8], [radius * 0.86, height * 0.92], [radius * 0.86, height]], 30), [0, height]];
  const g = group('jar', mesh(lathe(roundCorners(pts, [0, 0.05, ...pts.slice(2, -1).map(() => 0), 0])), M.glass({color: hex(glassColor), frost}, {thickness: 0.3, attenuationDistance: 0.6})));
  g.add(place(mesh(lathe(roundCorners([[0, 0], [radius * 0.9, 0], [radius * 0.9, 0.18], [0, 0.18]], [0, 0.03, 0.03, 0])), M.brushedSteel({color: hex(lid)})), 0, height - 0.04, 0));
  if (fill) g.add(mesh(lathe([[0, 0.03], [radius - 0.03, 0.03], [radius - 0.03, height * 0.7], [0, height * 0.7]]), fill));
  return g;
}

/** Vase from a silhouette: 'bud', 'amphora', 'cylinder', 'bulb' (or your own [[r, y]…]). */
export function vase({style = 'amphora', height = 2.4, color = 0xdcd3c4, material = null} = {}) {
  const S = {bud: [[0.3, 0], [0.42, 0.3], [0.38, 0.9], [0.12, 1.6], [0.1, 2.1], [0.16, 2.4]], amphora: [[0.3, 0], [0.62, 0.7], [0.66, 1.1], [0.4, 1.8], [0.3, 2.1], [0.38, 2.4]], cylinder: [[0.45, 0], [0.46, 1.2], [0.46, 2.4]], bulb: [[0.35, 0], [0.8, 0.7], [0.62, 1.4], [0.22, 1.8], [0.2, 2.1], [0.3, 2.4]]};
  const src = Array.isArray(style) ? style : S[style];
  const k = height / src[src.length - 1][1];
  const outer = spline(src.map(([r, y]) => [r * k, y * k]), 60), wall = 0.035 * k;
  const inner = outer.slice(-18).reverse().map(([r, y]) => [Math.max(0.01, r - wall), y]);
  const pts = [[0, 0.01], [outer[0][0] - 0.03, 0.01], ...outer, ...inner, [0, inner[inner.length - 1][1]]];
  return group('vase', mesh(lathe(roundCorners(pts, pts.map((_, i) => (i === 1 ? 0.02 : i === 1 + outer.length || i === 2 + outer.length ? 0.015 : 0)), 6), {segments: 180}), material ?? M.ceramic({color: hex(color)}, {roughness: 0.5, clearcoat: 0.4})));
}

/** Bowl (serving, cereal, planter) — style 'deep' or 'shallow'. */
export function bowl({radius = 0.8, depth = 0.5, color = 0xf1eee8, wall = 0.05, material = null} = {}) {
  const outer = spline([[radius * 0.45, 0.04], [radius * 0.8, depth * 0.35], [radius, depth]], 30);
  const inner = spline([[radius - wall, depth], [radius * 0.78, depth * 0.45], [radius * 0.4, depth * 0.12]], 30);
  const pts = [[0, 0.01], [radius * 0.42, 0.01], ...outer, ...inner, [0, depth * 0.1]];
  return group('bowl', mesh(lathe(roundCorners(pts, pts.map((_, i) => (i === 1 ? 0.015 : i === 1 + outer.length || i === 2 + outer.length ? 0.02 : 0)), 6), {segments: 180}), material ?? M.ceramic({color: hex(color)})));
}

/** Dinner plate (⌀ 2.7). */
export function plate({diameter = 2.7, color = 0xf4f1eb} = {}) {
  const R = diameter / 2;
  const pts = [[0, 0.03], [R * 0.55, 0.03], [R * 0.58, 0], [R * 0.64, 0], [R * 0.66, 0.03], [R * 0.95, 0.12], [R, 0.16], [R * 0.985, 0.18], [R * 0.93, 0.15], [R * 0.66, 0.07], [0, 0.07]];
  return group('plate', mesh(lathe(roundCorners(pts, [0, 0.01, 0.01, 0.01, 0.01, 0.06, 0.02, 0.01, 0.02, 0.08, 0], 6), {segments: 200}), M.ceramic({color: hex(color)})));
}

/** Ring donut with icing and sprinkles (⌀ 0.9). */
export function donut({diameter = 0.9, icing: icingColor = 0xf3a6b8, sprinkles = ['#f4f1e8', '#e8505b', '#f9c74f', '#6cc3d5', '#9b5de5'], seed = 5} = {}) {
  const R = diameter * 0.3, r = diameter * 0.2;
  const base = displace(new THREE.TorusGeometry(R, r, 64, 160).rotateX(Math.PI / 2), {amount: r * 0.05, scale: 6, seed});
  const dough = mesh(squash(base, {amount: 0.18}), M.dough(), 'dough');
  // icing: the top of a slightly fatter torus, with a wavy drip edge
  const ice = new THREE.TorusGeometry(R, r * 1.06, 64, 200).rotateX(Math.PI / 2);
  const p = ice.attributes.position, keep = [];
  const idx = ice.index;
  const wave = (x, z) => 0.1 + 0.35 * Math.sin(Math.atan2(z, x) * 7 + 1.3) * Math.sin(Math.atan2(z, x) * 3);
  for (let i = 0; i < idx.count; i += 3) {
    const ok = [0, 1, 2].every(k => { const v = idx.getX(i + k); return p.getY(v) > -r * wave(p.getX(v), p.getZ(v)) * 0.8; });
    if (ok) keep.push(idx.getX(i), idx.getX(i + 1), idx.getX(i + 2));
  }
  ice.setIndex(keep);
  const icingGeo = squash(displace(ice, {amount: r * 0.02, scale: 4, seed: seed + 1}), {amount: 0.18});
  const glaze = mesh(icingGeo, M.icing({color: hex(icingColor)}), 'icing');
  const g = group('donut', dough, glaze);
  g.position.y = r * 0.82 * 1.0;
  if (sprinkles?.length) scatter(glaze, new THREE.CapsuleGeometry(0.012, 0.05, 4, 8), new THREE.MeshPhysicalMaterial({roughness: 0.35, clearcoat: 0.6}), {count: 140, seed, scale: [0.8, 1.1], align: 'normal', tilt: 1.5, colors: sprinkles, lift: 0.004, where: (pos, n) => n.y > 0.35});
  return group('donut', g);
}

/** Fruit: 'apple', 'orange', 'lemon', 'pear' (real sizes). */
export function fruit({type = 'apple', color, seed = 3} = {}) {
  const T = {
    apple: {c: 0xc8322d, prof: [[0, 0.06], [0.28, 0], [0.42, 0.18], [0.42, 0.46], [0.3, 0.68], [0.06, 0.64], [0, 0.6]], rough: 0.32, bump: 0.01},
    pear: {c: 0xb9c44f, prof: [[0, 0.05], [0.28, 0], [0.4, 0.2], [0.34, 0.5], [0.2, 0.72], [0.12, 0.92], [0.04, 0.96], [0, 0.95]], rough: 0.45, bump: 0.01},
    orange: {c: 0xf08a24, prof: [[0, 0.02], [0.3, 0.04], [0.4, 0.2], [0.4, 0.4], [0.3, 0.58], [0.05, 0.62], [0, 0.61]], rough: 0.55, bump: 0.035},
    lemon: {c: 0xf2d33b, prof: [[0, 0.02], [0.08, 0.05], [0.28, 0.16], [0.33, 0.4], [0.26, 0.64], [0.08, 0.76], [0, 0.8]], rough: 0.5, bump: 0.03},
  }[type];
  let geo = lathe(spline(T.prof, 40), {segments: 120});
  if (type === 'lemon') { geo.translate(0, -0.4, 0).rotateZ(Math.PI / 2); geo.computeBoundingBox(); geo.translate(0, -geo.boundingBox.min.y, 0); }
  geo = displace(geo, {amount: T.bump * 0.15, scale: 12, seed, octaves: 2});
  const citrus = type === 'orange' || type === 'lemon';
  const skin = M.withGrain(new THREE.MeshPhysicalMaterial({color: hex(color ?? T.c), roughness: T.rough, clearcoat: type === 'apple' ? 0.6 : 0.3, clearcoatRoughness: 0.3, sheen: 0.2}), {scale: citrus ? 190 : 300, bump: citrus ? 0.55 : 0.3, roughVar: 0.05, tintVar: type === 'apple' ? 0.12 : 0.04, pits: citrus ? 0.45 : 0});
  const g = group(`fruit-${type}`, mesh(geo, skin));
  if (type === 'apple' || type === 'pear') {
    const top = T.prof[T.prof.length - 2][1];
    g.add(mesh(tube([[0, top - 0.04, 0], [0.01, top + 0.06, 0], [0.04, top + 0.14, 0.01]], 0.012, {tubular: 20, radial: 8}), M.wood({color: 0x5b3a22})));
    const leaf = mesh(bend(leafGeometry(0.2, 0.09, {rows: 16, cols: 6}), {angle: 0.7, along: 'y', toward: 'z'}), new THREE.MeshPhysicalMaterial({color: 0x4f7d2e, roughness: 0.5, side: THREE.DoubleSide, sheen: 0.2}));
    g.add(place(leaf, 0.03, top + 0.1, 0, -0.6, 0.4, -0.9));
  }
  return g;
}

/** A leaf as a dense grid (so it bends smoothly): width follows a leaf profile, a soft fold along the midrib. */
export function leafGeometry(len = 1, wid = 0.3, {fold = 0.25, rows = 32, cols = 8, tip = 1.6} = {}) {
  const g = new THREE.PlaneGeometry(1, 1, cols, rows), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const u = p.getX(i) * 2, v = p.getY(i) + 0.5;           // u in [-1, 1] across, v in [0, 1] along
    const w = Math.pow(Math.sin(Math.PI * Math.pow(v, 0.8)), 0.9) * Math.pow(1 - v, 0.05 * tip);
    p.setXYZ(i, u * w * wid / 2, v * len, Math.abs(u) * w * wid * fold * 0.5);
  }
  g.computeVertexNormals();
  return g;
}

function leafShape(len, wid) {
  const s = new THREE.Shape();
  s.moveTo(0, 0); s.bezierCurveTo(wid, len * 0.25, wid, len * 0.7, 0, len); s.bezierCurveTo(-wid, len * 0.7, -wid, len * 0.25, 0, 0);
  return s;
}

/** Round frosted cake with icing drips and berries on top. */
export function cake({diameter = 2, height = 1.1, frosting = 0xf7efe4, berries = 0xc0233a} = {}) {
  const R = diameter / 2;
  const body = lathe(roundCorners([[0, 0], [R, 0], [R, height], [0, height]], [0, 0.05, 0.08, 0]), {segments: 160});
  const g = group('cake', mesh(body, M.withGrain(new THREE.MeshPhysicalMaterial({color: hex(frosting), roughness: 0.55, sheen: 0.3}), {scale: 60, bump: 0.5, roughVar: 0.04, tintVar: 0.02})));
  const drip = displace(new THREE.CylinderGeometry(R + 0.02, R + 0.02, height * 0.28, 160, 8, true), {amount: 0.02, scale: 5});
  g.add(place(mesh(drip, M.icing({color: 0xe8b4c0})), 0, height - height * 0.13, 0));
  for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2; g.add(place(mesh(new THREE.SphereGeometry(0.12, 32, 24), new THREE.MeshPhysicalMaterial({color: hex(berries), roughness: 0.25, clearcoat: 0.8})), Math.cos(a) * R * 0.6, height + 0.09, Math.sin(a) * R * 0.6)); }
  return g;
}

/* ================================================================== home & decor */

/** Potted plant: a pot (terracotta or glazed) and a rosette of curved leaves. */
export function pottedPlant({potHeight = 1.3, potRadius = 0.7, leaves = 9, leafLength = 1.6, leafColor = 0x3f6b3a, pot = 'terracotta', seed = 4} = {}) {
  const outer = spline([[potRadius * 0.72, 0], [potRadius * 0.86, potHeight * 0.5], [potRadius, potHeight * 0.92], [potRadius, potHeight]], 24);
  const pts = [[0, 0.01], [potRadius * 0.7, 0.01], ...outer, [potRadius - 0.06, potHeight], [potRadius - 0.07, potHeight * 0.85], [0, potHeight * 0.85]];
  const potMat = pot === 'terracotta' ? M.terracotta() : M.ceramic({color: 0xe8e2d6}, {roughness: 0.55});
  const g = group('potted-plant', mesh(lathe(roundCorners(pts, pts.map((_, i) => (i === 1 ? 0.02 : i === 1 + outer.length ? 0.02 : 0)), 6), {segments: 160}), potMat, 'pot'));
  g.add(place(mesh(displace(new THREE.CircleGeometry(potRadius - 0.07, 48).rotateX(-Math.PI / 2), {amount: 0.01, scale: 12}), M.stone({color: 0x4a3526}, {roughness: 0.95}), 'soil'), 0, potHeight * 0.87, 0));
  const leafMat = new THREE.MeshPhysicalMaterial({color: hex(leafColor), roughness: 0.45, sheen: 0.4, sheenColor: new THREE.Color(0xc9e0b0), side: THREE.DoubleSide, clearcoat: 0.3, clearcoatRoughness: 0.4});
  const rand = M.rng(seed);
  for (let i = 0; i < leaves; i++) {
    const L = leafLength * (0.7 + rand() * 0.45);
    // a dense leaf that arches outward and droops at the tip, fanned around the stem at varied angles
    const geo = bend(leafGeometry(L, L * 0.34, {fold: 0.3}), {angle: -(1.2 + rand() * 0.7), along: 'y', toward: 'z'});
    const leaf = mesh(geo, leafMat, 'leaf');
    const a = i / leaves * Math.PI * 2 + (rand() - 0.5) * 0.5;
    leaf.position.set(0, potHeight * 0.88, 0);
    leaf.rotation.set(0, a, 0);
    leaf.rotateX(0.18 + rand() * 0.3);
    g.add(leaf);
  }
  return g;
}

/** Pillar candle with a flame (the flame is emissive: render with post: {bloom: true}). */
export function candle({height = 1.2, radius = 0.35, color = 0xf2ead9, lit = true} = {}) {
  const top = spline([[radius, height - 0.06], [radius * 0.94, height], [radius * 0.5, height - 0.05], [0, height - 0.06]], 12);
  const pts = [[0, 0], [radius, 0], ...top];
  const g = group('candle', mesh(lathe(roundCorners(pts, [0, 0.01, 0.02, 0, 0, 0]), {segments: 120}), M.wax({color: hex(color)})));
  g.add(place(mesh(tube([[0, height - 0.07, 0], [0.004, height + 0.05, 0], [0.015, height + 0.09, 0]], 0.008, {tubular: 16, radial: 8}), new THREE.MeshStandardMaterial({color: 0x1d1a17})), 0, 0, 0));
  if (lit) {
    const flame = lathe(spline([[0, 0], [0.035, 0.03], [0.045, 0.08], [0.02, 0.17], [0, 0.22]], 20), {segments: 32});
    const f = mesh(flame, M.glow({color: 0xffb347, intensity: 6}), 'flame'); f.position.y = height + 0.06;
    f.castShadow = false; f.userData.w3dKeep = true;
    g.add(f);
    const light = new THREE.PointLight(0xffa64d, 0.6, radius * 6, 2); light.position.y = height + 0.12; g.add(light);
  }
  return g;
}

/** Hardcover book lying flat or standing: boards, a rounded spine, a page block, a title on the spine. */
export function book({width = 1.55, height = 2.35, depth = 0.32, color = 0x2f4a3a, title = '', titleColor = '#c9953f', font = 'Georgia, serif', standing = false, pages = 0xf1ead9} = {}) {
  const board = 0.022, over = 0.03;
  const cover = M.linen({color: hex(color)});
  const g = group('book');
  // page block
  const block = mesh(roundedBox(width - over, depth - board * 2, height - over * 2, 0.008, 2), M.paper({color: hex(pages)}), 'pages');
  block.position.set(over / 2, depth / 2, 0);
  g.add(block);
  // boards
  for (const y of [board / 2, depth - board / 2]) g.add(place(mesh(roundedBox(width, board, height, 0.01, 3), cover), 0, y, 0));
  // spine: half tube on the left edge
  const spine = mesh(new THREE.CylinderGeometry(depth / 2, depth / 2, height, 48, 1, false, Math.PI, Math.PI).rotateX(Math.PI / 2), cover, 'spine');
  spine.scale.set(0.35, 1, 1); spine.position.set(-width / 2, depth / 2, 0);
  g.add(spine);
  if (title) {
    // the title wraps onto the curved spine: a slightly larger copy of the spine, text drawn along its length
    const tex = M.canvasTexture(256, 2048, (c, w, h) => {
      c.clearRect(0, 0, w, h); c.save(); c.translate(w / 2, h / 2); c.rotate(Math.PI / 2);
      c.fillStyle = titleColor; c.font = `600 ${w * 0.34}px ${font}`; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText(title, 0, 4); c.fillRect(-h * 0.44, -w * 0.36, h * 0.88, 5); c.fillRect(-h * 0.44, w * 0.33, h * 0.88, 5);
      c.restore();
    });
    const label = mesh(new THREE.CylinderGeometry(depth / 2 + 0.003, depth / 2 + 0.003, height * 0.94, 48, 1, true, Math.PI, Math.PI).rotateX(Math.PI / 2), new THREE.MeshPhysicalMaterial({map: tex, transparent: true, roughness: 0.35, metalness: 0.4}), 'title');
    label.scale.set(0.35, 1, 1); label.position.copy(spine.position);
    label.castShadow = false;
    g.add(label);
  }
  if (standing) { // on a shelf: height up, spine towards the viewer (+z), the book's thickness along x
    g.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(new THREE.Vector3(0, 0, -1), new THREE.Vector3(-1, 0, 0), new THREE.Vector3(0, 1, 0)));
    g.position.set(depth / 2, height / 2, 0);
  }
  return group('book', g);
}

/** Box / package with rounded edges and an optional printed label on the front. */
export function box({w = 1.2, h = 1.2, d = 1.2, color = 0xd2b48c, material = null, label = null} = {}) {
  const m = mesh(roundedBox(w, h, d, Math.min(w, h, d) * 0.03, 4), material ?? M.paper({color: hex(color)}, {roughness: 0.85}), 'box');
  m.position.y = h / 2;
  const g = group('box', m);
  if (label) g.add(place(mesh(new THREE.PlaneGeometry(w * 0.8, h * 0.6), new THREE.MeshPhysicalMaterial({map: label, transparent: true, roughness: 0.6})), 0, h / 2, d / 2 + 0.002));
  return g;
}

/** Gift box with a lid, ribbon bands and a bow. */
export function giftBox({size = 1.2, color = 0xc0392b, ribbon: ribbonColor = 0xf4d35e} = {}) {
  const s = size, paperMat = M.paint({color: hex(color)}, {roughness: 0.5}), rib = M.fabric({color: hex(ribbonColor)}, {roughness: 0.4, sheen: 1});
  const g = group('gift-box', place(mesh(roundedBox(s, s * 0.8, s, 0.02, 3), paperMat), 0, s * 0.4, 0), place(mesh(roundedBox(s * 1.04, s * 0.2, s * 1.04, 0.02, 3), paperMat), 0, s * 0.82, 0));
  for (const rot of [0, Math.PI / 2]) {
    const band = mesh(roundedBox(s * 0.14, s * 0.94, s * 1.06, 0.005, 2), rib); band.position.y = s * 0.47; band.rotation.y = rot; g.add(band);
  }
  const loop = new THREE.TorusGeometry(s * 0.16, s * 0.035, 16, 48, Math.PI * 1.6);
  for (const a of [0.5, -0.5 + Math.PI]) { const m = mesh(squash(loop, {amount: 0.35, axis: 'y'}), rib); m.position.set(0, s * 0.96, 0); m.rotation.set(Math.PI / 2 - 0.4, a, 0); g.add(m); }
  return g;
}

/** Gemstone (brilliant cut): a crown and a pavilion of facets in coloured glass. */
export function gem({diameter = 0.8, color = 0x9fd8e8, facets = 16} = {}) {
  const r = diameter / 2, table = r * 0.56, crownH = r * 0.32, pavH = r * 0.86, girdle = r * 0.04;
  const pts = [];
  const ring = (rad, y, off = 0) => Array.from({length: facets}, (_, i) => { const a = (i + off) / facets * Math.PI * 2; return new THREE.Vector3(Math.cos(a) * rad, y, Math.sin(a) * rad); });
  const culet = new THREE.Vector3(0, 0, 0), g0 = ring(r, pavH), g1 = ring(r, pavH + girdle), t = ring(table, pavH + girdle + crownH, 0.5), top = new THREE.Vector3(0, pavH + girdle + crownH, 0);
  const tri = (a, b, c) => pts.push(a, b, c);
  for (let i = 0; i < facets; i++) {
    const j = (i + 1) % facets;
    tri(culet, g0[j], g0[i]);
    tri(g0[i], g0[j], g1[j]); tri(g0[i], g1[j], g1[i]);
    tri(g1[i], g1[j], t[i]); tri(g1[j], t[j], t[i]);
    tri(t[i], t[j], top);
  }
  for (let i = 0; i < pts.length; i += 3) { // wind every facet outwards
    const [a, b, c] = [pts[i], pts[i + 1], pts[i + 2]], n = b.clone().sub(a).cross(c.clone().sub(a)), mid = a.clone().add(b).add(c).divideScalar(3).sub(new THREE.Vector3(0, pavH, 0));
    if (n.dot(mid) < 0) { pts[i + 1] = c; pts[i + 2] = b; }
  }
  const geo = new THREE.BufferGeometry().setFromPoints(pts); geo.computeVertexNormals();
  const m = mesh(geo, new THREE.MeshPhysicalMaterial({color: hex(color), metalness: 0, roughness: 0.02, transmission: 1, thickness: r, ior: 2.1, dispersion: 0.3, attenuationColor: new THREE.Color(hex(color)), attenuationDistance: r * 1.5, flatShading: true, specularIntensity: 1}), 'gem');
  m.rotation.set(0.25, 0.2, 0.35); m.updateMatrixWorld(); const bb = new THREE.Box3().setFromObject(m, true); m.position.y = -bb.min.y; // precise: the rotated vertices, not a rotated box
  return group('gem', m);
}

/** Coin with a raised rim and an embossed disc (gold by default). */
export function coin({diameter = 0.25, thickness = 0.022, material = null} = {}) {
  const R = diameter / 2, t = thickness;
  const pts = [[0, 0], [R, 0], [R, t], [R * 0.9, t], [R * 0.88, t * 0.82], [0, t * 0.82]];
  const m = mesh(lathe(roundCorners(pts, [0, t * 0.3, t * 0.3, t * 0.1, t * 0.1, 0], 6), {segments: 128}), material ?? M.gold({}, {roughness: 0.25}));
  return group('coin', m);
}

/** Two-tone capsule pill. */
export function pill({length = 0.2, radius = 0.035, colors = [0xf4f1ea, 0x5b8dd9]} = {}) {
  const half = (c, s) => { const h = new THREE.Mesh(new THREE.CapsuleGeometry(radius, length / 2, 8, 24), M.plastic({color: hex(c), glossy: true})); h.position.x = s * length / 4; h.rotation.z = Math.PI / 2; return h; };
  const g = group('pill', half(colors[0], -1), half(colors[1], 1)); g.position.y = radius;
  return group('pill', g);
}

/** Puffy shapes for icons and illustrations: 'heart', 'star', 'cloud', 'drop', 'bolt'. */
export function puffy({shape = 'heart', size = 1, depth = 0.3, color = 0xe8505b, material = null} = {}) {
  const S = {
    heart: '<svg viewBox="0 0 100 90"><path d="M50 88 C20 66 2 48 2 28 C2 12 14 2 28 2 C38 2 46 8 50 16 C54 8 62 2 72 2 C86 2 98 12 98 28 C98 48 80 66 50 88Z"/></svg>',
    star: '<svg viewBox="0 0 100 95"><path d="M50 2 L62 36 L98 37 L69 58 L80 93 L50 72 L20 93 L31 58 L2 37 L38 36Z"/></svg>',
    cloud: '<svg viewBox="0 0 120 70"><path d="M30 68 C14 68 2 58 2 45 C2 32 13 23 26 24 C29 11 41 2 56 2 C72 2 84 12 87 26 C104 26 118 36 118 48 C118 60 106 68 92 68Z"/></svg>',
    drop: '<svg viewBox="0 0 70 100"><path d="M35 2 C50 28 68 48 68 66 C68 84 53 98 35 98 C17 98 2 84 2 66 C2 48 20 28 35 2Z"/></svg>',
    bolt: '<svg viewBox="0 0 70 100"><path d="M42 2 L6 58 L32 58 L24 98 L64 38 L38 38Z"/></svg>',
  }[shape] ?? shape;
  const geo = extrudeSVG(S, {size, depth, bevel: Math.min(depth * 0.45, size * 0.12), bevelSegments: 10, curveSegments: 48});
  const m = mesh(geo, material ?? M.plastic({color: hex(color), glossy: true}));
  return group(`puffy-${shape}`, m);
}

/** Organic blob (glossy or clay): a displaced sphere. */
export function blob({radius = 0.6, wobble = 0.22, color = 0x9b8cf2, seed = 2, material = null} = {}) {
  const geo = displace(new THREE.IcosahedronGeometry(radius, 48), {amount: radius * wobble, scale: 0.75 / radius, seed, octaves: 2});
  const m = mesh(geo, material ?? new THREE.MeshPhysicalMaterial({color: hex(color), roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.08, sheen: 0.3}));
  geo.computeBoundingBox(); m.position.y = -geo.boundingBox.min.y;
  return group('blob', m);
}

/** Pebble / rock: flattened, displaced; `faceted` for low-poly stones. */
export function rock({size = 0.6, flat = 0.55, color = 0x9a958d, seed = 7, faceted = false} = {}) {
  let geo = new THREE.IcosahedronGeometry(size / 2, faceted ? 2 : 40);
  geo.scale(1, flat, 0.85);
  geo = displace(geo, {amount: size * (faceted ? 0.12 : 0.07), scale: 2.2 / size, seed, octaves: faceted ? 2 : 5});
  const m = mesh(geo, M.stone({color: hex(color)}, faceted ? {flatShading: true} : {}));
  geo.computeBoundingBox(); m.position.y = -geo.boundingBox.min.y;
  return group('rock', m);
}

/* ================================================================== tech */

/** Phone standing on its bottom edge (7.4 × 15.2 cm); screen: a texture or null for a dark screen. */
export function phone({screen = null, body = 0x3b3d42} = {}) {
  const W = 0.74, H = 1.52, D = 0.085, R = 0.12;
  const g = new THREE.Group();
  const bodyGeo = new THREE.ExtrudeGeometry(roundedRectShape(W, H, R), {depth: D - 0.03, bevelEnabled: true, bevelThickness: 0.015, bevelSize: 0.012, bevelSegments: 6, curveSegments: 24});
  bodyGeo.translate(0, 0, -(D - 0.03) / 2);
  g.add(mesh(bodyGeo, new THREE.MeshPhysicalMaterial({color: hex(body), metalness: 0.85, roughness: 0.32, clearcoat: 0.4, clearcoatRoughness: 0.2})));
  g.add(place(mesh(new THREE.ShapeGeometry(roundedRectShape(W - 0.03, H - 0.03, R - 0.015), 24), new THREE.MeshPhysicalMaterial({color: 0x050506, roughness: 0.08, clearcoat: 1})), 0, 0, D / 2 + 0.0015));
  const display = new THREE.ShapeGeometry(roundedRectShape(W - 0.075, H - 0.075, R - 0.04), 24);
  display.computeBoundingBox();
  const bb = display.boundingBox, uv = display.attributes.uv, pos = display.attributes.position;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (pos.getX(i) - bb.min.x) / (bb.max.x - bb.min.x), (pos.getY(i) - bb.min.y) / (bb.max.y - bb.min.y));
  g.add(place(mesh(display, new THREE.MeshPhysicalMaterial({color: 0x000000, emissive: screen ? 0xffffff : 0x000000, emissiveMap: screen, emissiveIntensity: 0.92, roughness: 0.12, clearcoat: 1, clearcoatRoughness: 0.05})), 0, 0, D / 2 + 0.003));
  g.add(place(mesh(new THREE.ShapeGeometry(roundedRectShape(0.19, 0.052, 0.026), 12), new THREE.MeshPhysicalMaterial({color: 0x050506, roughness: 0.1, clearcoat: 1})), 0, H / 2 - 0.085, D / 2 + 0.0045));
  g.position.y = H / 2 + 0.018;
  return group('phone', g);
}

/** Laptop, lid open at `angle` degrees (a 14" machine: 3.1 × 2.2). screen: a texture. */
export function laptop({angle = 110, screen = null, body = 0xc9ccd1} = {}) {
  const W = 3.1, Dp = 2.2, T = 0.07, alu = new THREE.MeshPhysicalMaterial({color: hex(body), metalness: 1, roughness: 0.35, anisotropy: 0.4});
  const base = mesh(new THREE.ExtrudeGeometry(roundedRectShape(W, Dp, 0.12), {depth: T, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.01, bevelSegments: 4, curveSegments: 16}).rotateX(-Math.PI / 2), alu, 'base');
  const g = group('laptop', base);
  const keys = mesh(new THREE.PlaneGeometry(W * 0.86, Dp * 0.42).rotateX(-Math.PI / 2), new THREE.MeshPhysicalMaterial({color: 0x1d1e21, roughness: 0.7}), 'keyboard');
  keys.position.set(0, T + 0.011, -Dp * 0.12); g.add(keys);
  const pad = mesh(new THREE.PlaneGeometry(W * 0.34, Dp * 0.26).rotateX(-Math.PI / 2), new THREE.MeshPhysicalMaterial({color: hex(body), metalness: 1, roughness: 0.25}), 'trackpad');
  pad.position.set(0, T + 0.0105, Dp * 0.27); g.add(pad);
  const lid = new THREE.Group(); lid.position.set(0, T, -Dp / 2);
  const shell = mesh(new THREE.ExtrudeGeometry(roundedRectShape(W, Dp * 0.98, 0.12), {depth: 0.045, bevelEnabled: true, bevelThickness: 0.008, bevelSize: 0.008, bevelSegments: 4, curveSegments: 16}), alu, 'lid');
  shell.position.set(0, Dp * 0.49, -0.045); lid.add(shell);
  const disp = mesh(new THREE.PlaneGeometry(W * 0.92, Dp * 0.86), new THREE.MeshPhysicalMaterial({color: 0x000000, emissive: screen ? 0xffffff : 0x000000, emissiveMap: screen, emissiveIntensity: 0.9, roughness: 0.1, clearcoat: 1}), 'display');
  disp.position.set(0, Dp * 0.5, 0.013); lid.add(disp);
  lid.rotation.x = -(angle - 90) * Math.PI / 180;
  g.add(lid);
  return g;
}

/** Everything in this library, for contact sheets and discovery: name → () => object. */
export const CATALOG = {
  weightPlate, kettlebell, dumbbell, exerciseBall, tennisBall, resistanceBand, yogaMat, yogaBlock,
  mug, bottle, jar, vase, bowl, plate, donut, fruit, cake,
  pottedPlant, candle, book, box, giftBox, gem, coin, pill, puffy, blob, rock, phone, laptop,
};
