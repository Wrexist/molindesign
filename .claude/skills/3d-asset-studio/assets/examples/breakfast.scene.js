// A food still: donuts on a plate beside a coffee, backlit so the icing glistens, on a warm gradient.
// node scripts/render.mjs assets/examples/breakfast.scene.js --out out/breakfast
import * as THREE from 'three';
import * as O from 'w3d/objects.js';
import * as M from 'w3d/materials.js';

export const settings = {
  name: 'breakfast', mode: 'still', size: [1200, 900], margin: 0.1,
  camera: {elevation: 32, azimuth: -18, distance: 6.5},
  studio: {preset: 'soft', key: {dir: [-3, 4.2, -1.6], intensity: 2.3, softness: 2}, fill: {dir: [3, 2.5, 3.5], intensity: 0.8, color: 0xfff1e0}},
  backdrop: {radial: ['#fbf3e8', '#ecdcc7'], at: [0.45, 0.4], size: 0.85},
};

export default function build() {
  const plate = O.plate({diameter: 2.4, color: 0xf6f2ea});
  const pink = O.donut({icing: 0xf3a6b8, seed: 5});
  pink.position.set(-0.28, 0.07, 0.1); pink.rotation.set(0.05, 0.4, 0.03);
  const choc = O.donut({icing: 0x5a3322, sprinkles: ['#f4f1e8', '#f9c74f', '#e8505b'], seed: 11});
  choc.position.set(0.38, 0.2, -0.22); choc.rotation.set(0.22, -0.9, 0.12); // leaning on the other
  plate.add(pink, choc);
  const mug = O.mug({color: 0x5f7d6e}); mug.position.set(1.75, 0, -0.75); mug.rotation.y = -0.9;
  return [{name: 'plate', object: plate}, {name: 'coffee', object: mug}];
}
