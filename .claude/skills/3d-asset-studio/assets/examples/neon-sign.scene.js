// A neon sign: glowing tubes (a heart drawn as a curve) and lettering on a dark board, with bloom.
// node scripts/render.mjs assets/examples/neon-sign.scene.js --out out/neon
import * as THREE from 'three';
import * as M from 'w3d/materials.js';
import {tube, roundedBox} from 'w3d/geometry.js';
import {text3d} from 'w3d/text.js';

export const settings = {
  name: 'neon-sign', mode: 'still', size: [1200, 900], margin: 0.12,
  studio: 'night', camera: {elevation: 6, azimuth: -12},
  backdrop: {radial: ['#1f1a33', '#07060c'], at: [0.5, 0.42], size: 0.9},
  post: {bloom: {strength: 1.1, radius: 1.3}, vignette: 0.2},
  floor: {shadow: 0.6}, contact: {opacity: 0.5},
};

export default async function build() {
  const sign = new THREE.Group();
  // the board: dark satin, standing on the floor, leaning back a little
  const board = new THREE.Mesh(roundedBox(9, 6.4, 0.35, 0.18), M.paint({color: 0x17151f}));
  board.position.y = 3.2; sign.add(board);
  // the heart as a tube along the classic heart curve (drawn in the plane of the board)
  const pts = [];
  for (let i = 0; i <= 200; i++) {
    const t = (i / 200) * Math.PI * 2;
    const x = 16 * Math.sin(t) ** 3, y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
    pts.push(new THREE.Vector3(x * 0.1, y * 0.1 + 4.1, 0.32));
  }
  sign.add(new THREE.Mesh(tube(pts, 0.07, {closed: true, tubular: 400, radial: 16}), M.glow({color: 0xff4f9a, intensity: 4})));
  // lettering: emissive text standing off the board
  const words = new THREE.Mesh(await text3d('open late', {font: 'helvetiker_bold', size: 0.7, depth: 0.12, bevel: 0.02}), M.glow({color: 0x59d8ff, intensity: 3.2}));
  words.position.set(0, 0.8, 0.25); sign.add(words);
  // mounting stand-offs catch a little of the glow
  for (const x of [-4, 4]) { const s = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.3, 24), M.chrome()); s.rotation.x = Math.PI / 2; s.position.set(x, 5.9, 0.3); sign.add(s); }
  sign.rotation.x = -0.06;
  return [{name: 'sign', object: sign}];
}
