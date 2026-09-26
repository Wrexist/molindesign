// A glazed cappuccino cup on a saucer, with latte art. Shows: lathe profiles with wall thickness,
// a tube handle, and a canvas-drawn texture (the coffee). Cafés, food, lifestyle pages.
import * as THREE from 'three';
import {lathe, roundCorners, spline, tube} from 'w3d/geometry.js';
import {ceramic, canvasTexture, rng} from 'w3d/materials.js';

export const settings = {
  name: 'coffee-cup',
  width: 800,
  camera: {elevation: 24, azimuth: -18, distance: 6},
  studio: 'soft',
  background: '#f3efe8',
  motion: {stagger: 420},
};

/** Saucer: foot ring underneath, a shallow dish, a rolled rim and a well for the cup. Profile runs outside, then back across the top. */
function saucer() {
  const pts = [[0, 0.016], [0.33, 0.016], [0.35, 0], [0.42, 0], [0.44, 0.02], [0.62, 0.05], [0.77, 0.1], [0.8, 0.13], [0.785, 0.145], [0.62, 0.088], [0.45, 0.062], [0.34, 0.052], [0.3, 0.058], [0, 0.058]];
  return lathe(roundCorners(pts, [0, 0.01, 0.006, 0.006, 0.01, 0.05, 0.03, 0.012, 0.012, 0.05, 0.02, 0.006, 0.006, 0], 8), {segments: 200});
}

/** Cup: a rounded bowl with a thin wall. Walls are splines (smooth), the rim and foot are small fillets. */
function cupBody() {
  const outer = spline([[0.2, 0.05], [0.27, 0.068], [0.34, 0.15], [0.39, 0.29], [0.413, 0.42], [0.42, 0.5]], 40);
  const inner = spline([[0.396, 0.5], [0.39, 0.42], [0.367, 0.29], [0.315, 0.17], [0.24, 0.1], [0.12, 0.086]], 40);
  const pts = [[0, 0.06], [0.17, 0.06], ...outer, ...inner, [0, 0.085]];
  const rimOut = 2 + outer.length - 1, rimIn = rimOut + 1;
  const r = pts.map((_, i) => (i === 1 ? 0.012 : i === 2 ? 0.01 : i === rimOut || i === rimIn ? 0.011 : 0));
  return lathe(roundCorners(pts, r, 8), {segments: 220});
}

function latteArt() {
  return canvasTexture(1024, 1024, (g, w, h) => {
    const c = w / 2;
    const bg = g.createRadialGradient(c, c, w * 0.05, c, c, w * 0.5);
    bg.addColorStop(0, '#8a5a36'); bg.addColorStop(0.7, '#7a4b2c'); bg.addColorStop(0.93, '#5d3820'); bg.addColorStop(1, '#4a2c19');
    g.fillStyle = bg; g.fillRect(0, 0, w, h);
    // crema mottling (seeded: every render is identical)
    const rand = rng(21);
    for (let i = 0; i < 900; i++) {
      const a = rand() * Math.PI * 2, r = Math.sqrt(rand()) * w * 0.47, s = 4 + rand() * 14;
      g.fillStyle = `rgba(${rand() < 0.5 ? '160,110,70' : '90,55,30'},${0.05 + rand() * 0.08})`;
      g.beginPath(); g.arc(c + Math.cos(a) * r, c + Math.sin(a) * r, s, 0, Math.PI * 2); g.fill();
    }
    // foam heart: soft edge, slightly lopsided like a real pour, with a pulled tail
    g.save(); g.translate(c * 1.02, c * 1.02); g.rotate(-0.08); g.scale(w / 1024, h / 1024);
    const heart = new Path2D('M4,205 C-44,158 -226,70 -222,-58 C-219,-148 -148,-196 -80,-186 C-38,-180 -12,-156 2,-126 C14,-158 44,-182 84,-186 C154,-192 228,-142 224,-52 C219,64 44,158 4,205 Z');
    g.filter = 'blur(10px)'; g.fillStyle = 'rgba(214,180,140,.9)'; g.fill(heart);
    g.filter = 'blur(2.5px)'; g.fillStyle = '#f1e4cf'; g.scale(0.94, 0.94); g.fill(heart);
    g.filter = 'blur(3px)'; g.strokeStyle = 'rgba(241,228,207,.9)'; g.lineWidth = 12; g.beginPath(); g.moveTo(4, 150); g.quadraticCurveTo(2, 250, 0, 330); g.stroke();
    g.restore();
    g.filter = 'none';
    // a ring of darker crema at the wall
    g.strokeStyle = 'rgba(60,34,18,.5)'; g.lineWidth = w * 0.03; g.beginPath(); g.arc(c, c, w * 0.485, 0, Math.PI * 2); g.stroke();
  });
}

export default function build() {
  const glaze = ceramic({color: 0xf3f0ea});
  const plate = new THREE.Mesh(saucer(), glaze);

  const cup = new THREE.Group();
  cup.add(new THREE.Mesh(cupBody(), glaze));
  // handle: a loop on the side, thicker where it joins the cup
  const handle = tube([[0.39, 0.43, 0], [0.52, 0.45, 0], [0.6, 0.37, 0], [0.57, 0.24, 0], [0.45, 0.18, 0], [0.33, 0.17, 0]], 0.036, {tubular: 160, radial: 32, tension: 0.4});
  cup.add(new THREE.Mesh(handle, glaze));
  const coffee = new THREE.Mesh(new THREE.CircleGeometry(0.378, 128), new THREE.MeshPhysicalMaterial({map: latteArt(), roughness: 0.3, clearcoat: 0.8, clearcoatRoughness: 0.12}));
  coffee.rotation.x = -Math.PI / 2; coffee.rotation.z = 0.5; coffee.position.y = 0.44;
  cup.add(coffee);
  cup.position.y = 0.058 - 0.05;  // the foot rests in the saucer's well
  cup.rotation.y = -0.9;          // handle toward the right, a little behind

  return [
    {name: 'saucer', object: plate, motion: 'rise'},
    {name: 'cup', object: cup, motion: 'drop', style: {'--squash': 0.02, '--drop': '26cqw'}},
  ];
}
