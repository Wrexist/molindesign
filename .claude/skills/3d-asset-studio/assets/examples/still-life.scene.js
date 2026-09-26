// A small still life for trying looks: render it with --look clay, toon, lowpoly, lineart, wireframe or mono.
// node scripts/render.mjs assets/examples/still-life.scene.js --out out/still-life --look toon
import * as THREE from 'three';
import * as O from 'w3d/objects.js';

export const settings = {name: 'still-life', mode: 'still', size: [900, 700], margin: 0.1, camera: {elevation: 22, azimuth: -20},
  backdrop: {radial: ['#f6f2ea', '#e8e0d2']}};

export default function build() {
  const stack = new THREE.Group();                          // two books with a mug on top: one layer
  [0x2f4a3a, 0xc9953f].forEach((c, i) => { const b = O.book({color: c}); b.position.y = i * 0.32; b.rotation.y = 0.25 - i * 0.35; stack.add(b); });
  const mug = O.mug({color: 0xf1eee8}); mug.position.set(0.2, 0.64, 0.1); mug.rotation.y = -0.6; stack.add(mug);
  const plant = O.pottedPlant({potHeight: 1.1, potRadius: 0.6, leafLength: 1.4, seed: 6}); plant.position.set(-1.9, 0, -0.5);
  const apple = O.fruit({type: 'apple'}); apple.position.set(1.7, 0, 0.7);
  return [{name: 'stack', object: stack}, {name: 'plant', object: plant}, {name: 'apple', object: apple}];
}
