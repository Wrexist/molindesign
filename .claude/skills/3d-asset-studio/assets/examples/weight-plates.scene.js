// Three rubber weight plates with steel hubs, stacked by hand. Each plate is its own layer so they can
// land one after another. This is the scene behind the plates on the Maya Haglund site.
import * as THREE from 'three';
import {lathe} from 'w3d/geometry.js';
import {rubber, brushedSteel} from 'w3d/materials.js';

export const settings = {
  name: 'plates',
  width: 760,
  camera: {elevation: 15.6, distance: 5.8},
  // fill tinted toward the page's sage green so the shadows sit in the palette
  studio: {preset: 'soft', fill: {color: 0xf3f6ec}},
  background: '#f4f5f0',
  motion: {type: 'drop', stagger: 480},
};

/** Cross-section of a rubber plate: rounded outer rim, slightly recessed face, flat base, hole for the hub. */
function plateProfile(R, t) {
  const b = Math.min(0.055, t * 0.3), hole = 0.215, rec = 0.018, pts = [];
  const arc = (cx, cy, r, a0, a1, n = 10) => { for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); } };
  pts.push([hole, 0]);
  arc(R - b, b, b, -Math.PI / 2, 0);                                // bottom outer round
  arc(R - b, t - b, b, 0, Math.PI / 2);                             // top outer round
  pts.push([R - b - 0.05, t]);                                      // rim top
  arc(R - 0.14, t - rec - 0.02, 0.02, Math.PI / 2 - 0.2, Math.PI, 6); // step down into the recess
  pts.push([hole + 0.06, t - rec], [hole + 0.02, t - rec * 0.3], [hole, t - rec * 0.3], [hole, 0]);
  return pts;
}

/** Steel sleeve that lines the hole, standing a hair proud of the rubber. */
function hubProfile(t) {
  const r0 = 0.105, r1 = 0.225, e = 0.012, top = t + 0.004;
  return [[r0, -0.002], [r1, -0.002], [r1, top - e], [r1 - e, top], [r0 + e, top], [r0, top - e], [r0, -0.002]];
}

export default function build() {
  const rubberMat = rubber({seed: 7});
  const steel = brushedSteel();
  const specs = [{R: 1.0, t: 0.2}, {R: 0.8, t: 0.17}, {R: 0.62, t: 0.145}];
  let y = 0;
  return specs.map((s, i) => {
    const plate = new THREE.Group();
    plate.add(new THREE.Mesh(lathe(plateProfile(s.R, s.t), {segments: 160}), rubberMat));
    plate.add(new THREE.Mesh(lathe(hubProfile(s.t), {segments: 120}), steel));
    plate.position.set([0, 0.035, -0.03][i], y, 0); // stacked by hand, never perfectly centred
    plate.rotation.y = i * 0.9;                      // so the grain never lines up
    y += s.t;
    return {name: `plate${i}`, object: plate};
  });
}
