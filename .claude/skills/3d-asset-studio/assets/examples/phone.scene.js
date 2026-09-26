// A phone standing at an angle with an app screen: the device mockup for SaaS and app landing pages.
// Put a real screenshot next to this file as screen.png (portrait, ~9:19.5) and it is used automatically;
// otherwise a placeholder interface is drawn. Shows: extruded rounded shapes, an emissive screen texture
// under a glossy glass, and loading an optional image.
import * as THREE from 'three';
import {canvasTexture, imageTexture} from 'w3d/materials.js';

export const settings = {
  name: 'phone',
  width: 640,
  camera: {elevation: 10, azimuth: 0, distance: 6.2},
  studio: {preset: 'soft', key: {softness: 1.4}},
  background: '#eef0f4',
  motion: {type: 'rise'},
};

const W = 0.74, H = 1.52, D = 0.085, R = 0.12; // body width, height, depth, corner radius

function roundedRect(w, h, r) {
  const s = new THREE.Shape(), x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

/** Placeholder app screen; replace by dropping screen.png next to the scene. */
function placeholderUI() {
  return canvasTexture(900, 1950, (g, w, h) => {
    g.fillStyle = '#f7f7f5'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#1d1f23'; g.font = '600 38px system-ui, sans-serif'; g.fillText('9:41', 70, 92);
    g.fillStyle = '#1d1f23'; g.font = '700 76px system-ui, sans-serif'; g.fillText('Today', 64, 260);
    g.fillStyle = '#8b8f97'; g.font = '400 40px system-ui, sans-serif'; g.fillText('3 sessions booked', 66, 322);
    const card = (y, hue, title, sub) => {
      g.fillStyle = '#ffffff'; g.beginPath(); g.roundRect(56, y, w - 112, 250, 42); g.fill();
      g.fillStyle = `hsl(${hue} 45% 86%)`; g.beginPath(); g.roundRect(92, y + 36, 178, 178, 36); g.fill();
      g.fillStyle = '#1d1f23'; g.font = '600 46px system-ui, sans-serif'; g.fillText(title, 304, y + 112);
      g.fillStyle = '#8b8f97'; g.font = '400 36px system-ui, sans-serif'; g.fillText(sub, 304, y + 168);
    };
    card(400, 95, 'Strength', '07:30 · 45 min');
    card(680, 200, 'Mobility', '12:00 · 30 min');
    card(960, 30, 'Intervals', '18:15 · 40 min');
    g.fillStyle = '#1d1f23'; g.beginPath(); g.roundRect(56, h - 330, w - 112, 150, 75); g.fill();
    g.fillStyle = '#ffffff'; g.font = '600 48px system-ui, sans-serif'; g.textAlign = 'center'; g.fillText('Book a session', w / 2, h - 238);
    g.fillStyle = '#1d1f23'; g.beginPath(); g.roundRect(w / 2 - 140, h - 44, 280, 12, 6); g.fill();
  });
}

export default async function build() {
  let screen;
  try { screen = await imageTexture(new URL('./screen.png', import.meta.url)); } catch { screen = placeholderUI(); }

  const phone = new THREE.Group();
  const bodyGeo = new THREE.ExtrudeGeometry(roundedRect(W, H, R), {depth: D - 0.03, bevelEnabled: true, bevelThickness: 0.015, bevelSize: 0.012, bevelSegments: 6, curveSegments: 24});
  bodyGeo.translate(0, 0, -(D - 0.03) / 2);
  phone.add(new THREE.Mesh(bodyGeo, new THREE.MeshPhysicalMaterial({color: 0x3b3d42, metalness: 0.85, roughness: 0.32, clearcoat: 0.4, clearcoatRoughness: 0.2})));

  // screen: black glass edge, then the lit display (emissive, so it reads bright under any lighting)
  const glassGeo = new THREE.ShapeGeometry(roundedRect(W - 0.03, H - 0.03, R - 0.015), 24);
  const glass = new THREE.Mesh(glassGeo, new THREE.MeshPhysicalMaterial({color: 0x050506, roughness: 0.08, clearcoat: 1, clearcoatRoughness: 0.04}));
  glass.position.z = D / 2 + 0.0015;
  const display = new THREE.ShapeGeometry(roundedRect(W - 0.075, H - 0.075, R - 0.04), 24);
  // ShapeGeometry UVs are in shape units: map them to 0..1 across the display
  display.computeBoundingBox();
  const bb = display.boundingBox, uv = display.attributes.uv, pos = display.attributes.position;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (pos.getX(i) - bb.min.x) / (bb.max.x - bb.min.x), (pos.getY(i) - bb.min.y) / (bb.max.y - bb.min.y));
  const lit = new THREE.Mesh(display, new THREE.MeshPhysicalMaterial({color: 0x000000, emissive: 0xffffff, emissiveMap: screen, emissiveIntensity: 0.92, roughness: 0.12, clearcoat: 1, clearcoatRoughness: 0.05}));
  lit.position.z = D / 2 + 0.003;
  // camera pill at the top of the display
  const pill = new THREE.Mesh(new THREE.ShapeGeometry(roundedRect(0.19, 0.052, 0.026), 12), new THREE.MeshPhysicalMaterial({color: 0x050506, roughness: 0.1, clearcoat: 1}));
  pill.position.set(0, H / 2 - 0.085, D / 2 + 0.0045);
  phone.add(glass, lit, pill);

  phone.position.y = H / 2 + 0.018; // stands on its bottom edge
  phone.rotation.set(-0.06, -0.42, 0); // turned to the side, leaning back a touch
  return [{name: 'phone', object: phone, motion: 'rise', idle: 'float', style: {'--float': '1.4cqw'}}];
}
