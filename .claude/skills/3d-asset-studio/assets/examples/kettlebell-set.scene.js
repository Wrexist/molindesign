// Kettlebell, exercise ball and resistance band — the loader sculpture from the Maya Haglund site rebuilt
// procedurally. Shows: lathe bodies, a tube handle with powder-coated horns, a ribbon band with a twist,
// a hand-made canvas texture (the ball's seams), and three layers that shadow each other.
import * as THREE from 'three';
import {lathe, roundCorners, tube, ribbon} from 'w3d/geometry.js';
import {powderCoat, brushedSteel, fabric} from 'w3d/materials.js';

export const settings = {
  name: 'kettlebell-set',
  width: 900,
  camera: {elevation: 11, azimuth: -10, distance: 6.2},
  studio: {preset: 'soft', fill: {color: 0xf3f6ec}},
  background: '#f4f5f0',
  motion: {stagger: 300},
};

function kettlebell() {
  const g = new THREE.Group();
  // body: a sphere cut flat at the base, with a soft fillet where it meets the floor
  const R = 0.5, cy = 0.42, a0 = Math.asin(-cy / R), pts = [[0, 0], [Math.sqrt(R * R - cy * cy), 0]];
  for (let i = 1; i <= 48; i++) { const a = a0 + (Math.PI / 2 - a0) * (i / 48); pts.push([R * Math.cos(a), cy + R * Math.sin(a)]); }
  const iron = powderCoat({color: 0x2c2d2d, seed: 11});
  g.add(new THREE.Mesh(lathe(roundCorners(pts, [0, 0.04], 8), {segments: 180}), iron));

  // handle: one steel tube; its lower legs disappear into cast "horns" that grow out of the body
  const path = [[-0.335, 0.6], [-0.365, 0.86], [-0.356, 1.04], [-0.27, 1.17], [-0.1, 1.215], [0.1, 1.215], [0.27, 1.17], [0.356, 1.04], [0.365, 0.86], [0.335, 0.6]];
  g.add(new THREE.Mesh(tube(path.map(([x, y]) => [x, y, 0]), 0.066, {tubular: 260, radial: 40}), brushedSteel({color: 0xbdbab4}, {roughness: 0.3})));
  const horn = lathe(roundCorners([[0, 0], [0.15, 0], [0.108, 0.06], [0.084, 0.16], [0.077, 0.29], [0, 0.3]], [0, 0, 0.05, 0.08, 0.012, 0], 8), {segments: 72});
  for (const side of [-1, 1]) {
    const h = new THREE.Mesh(horn, iron);
    h.position.set(side * 0.33, 0.6, 0);
    h.rotation.z = side * -0.11; // follow the legs, which lean out slightly
    g.add(h);
  }
  return g;
}

/** Normal + colour maps for the ball's latitude seams (canvas textures you can adapt for any stripes). */
function seams(count = 15) {
  const H = 1024, W = 8, groove = 0.035; // share of each band taken by the seam
  const height = y => { const f = (y / H * count) % 1, d = Math.min(f, 1 - f) / groove; return d < 1 ? -(1 - d * d) : 0; };
  const make = fill => { const c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d'), img = x.createImageData(W, H); for (let y = 0; y < H; y++) { const v = fill(y); for (let i = 0; i < W; i++) img.data.set(v, (y * W + i) * 4); } x.putImageData(img, 0, 0); const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; };
  const normalMap = make(y => { const dy = (height(y + 1) - height(y - 1)) * 2.2, l = Math.hypot(dy, 1); return [128, 128 + 127 * (dy / l), 255 / l, 255]; });
  const map = make(y => { const v = 255 * (1 + height(y) * 0.07); return [v, v, v, 255]; });
  return {normalMap, map};
}

function ball() {
  const s = seams();
  const mat = new THREE.MeshPhysicalMaterial({color: 0x767d33, map: s.map, normalMap: s.normalMap, normalScale: new THREE.Vector2(1, 1), roughness: 0.6, clearcoat: 0.18, clearcoatRoughness: 0.45, sheen: 0.3, sheenRoughness: 0.55, sheenColor: new THREE.Color(0xc9d08a)});
  const m = new THREE.Mesh(new THREE.SphereGeometry(0.76, 160, 120), mat);
  m.position.y = 0.76;
  m.rotation.set(-0.16, 0.4, 0.17); // tip the pole away and to the side so the seams run across the ball
  return m;
}

function band() {
  // A loop standing on its edge, with one half twist on the left where it dips flat to the floor —
  // how a resistance band falls when you drop it. The centre line drops wherever the band lies flat.
  const w = 0.2, t0 = 0.022;
  const smooth = (a, b, x) => { const u = Math.min(1, Math.max(0, (x - a) / (b - a))); return u * u * (3 - 2 * u); };
  const turn = t => Math.PI * smooth(0.04, 0.3, t); // half a turn: 0 → π
  const outline = [[0.0, 0.02], [0.2, -0.26], [0.62, -0.38], [1.05, -0.26], [1.26, 0.04], [1.08, 0.3], [0.64, 0.4], [0.22, 0.32]];
  const curve = new THREE.CatmullRomCurve3(outline.map(([x, z]) => new THREE.Vector3(x, 0, z)), true);
  const pts = [];
  for (let i = 0; i < 80; i++) {
    const t = i / 80, p = curve.getPointAt(t), a = turn(t);
    pts.push([p.x, (w / 2) * Math.abs(Math.cos(a)) + (t0 / 2) * Math.abs(Math.sin(a)) + 0.002, p.z]); // lowest edge just touches the floor
  }
  const geo = ribbon(pts, {width: w, thickness: t0, closed: true, segments: 560, twist: turn});
  return new THREE.Mesh(geo, fabric({color: 0x979087}));
}

export default function build() {
  const kb = kettlebell(); kb.position.set(-0.42, 0, 0.3); kb.rotation.y = -0.18;
  const b = ball(); b.position.x = 0.5; b.position.z = -0.62;
  const loop = band(); loop.position.set(-0.12, 0, 0.62);
  return [
    {name: 'kettlebell', object: kb, motion: 'drop'},
    {name: 'ball', object: b, motion: 'bounce', idle: 'hop'},
    // the band runs behind the kettlebell and in front of it: cut it out where the kettlebell is in front
    {name: 'band', object: loop, motion: 'snap', holdout: ['kettlebell']},
  ];
}
