// A table lamp modeled from scratch (the worked example in references/modeling.md): a turned ceramic foot,
// a brass stem, a linen shade and a glowing bulb.
// node scripts/render.mjs assets/examples/lamp.scene.js --out out/lamp
import * as THREE from 'three';
import {lathe, roundCorners, spline, tube} from 'w3d/geometry.js';
import * as M from 'w3d/materials.js';

export const settings = {
  name: 'lamp', mode: 'still', size: [1000, 1250], margin: 0.1,
  backdrop: {radial: ['#f7f1e8', '#e9dfd0']}, studio: 'soft',
  post: {bloom: {strength: 0.3, radius: 1}},
};

export default function build() {
  const lamp = new THREE.Group();
  // base: a turned ceramic foot (profile bottom → top, rounded)
  lamp.add(new THREE.Mesh(lathe(roundCorners([[0, 0], [0.8, 0], [0.78, 0.12], [0.35, 0.3], [0.12, 0.45], [0.1, 0.5], [0, 0.5]], [0, 0.03, 0.05, 0.1, 0.05, 0.01, 0])), M.ceramic({color: 0x5b7c6f})));
  // stem: a brass tube with a slight curve
  lamp.add(new THREE.Mesh(tube([[0, 0.45, 0], [0.02, 1.6, 0], [0, 2.75, 0]].map(p => new THREE.Vector3(...p)), 0.035), M.brass()));
  // shade: a thin conical wall of linen (outside up, inside down), open at both ends; lit from inside, so it glows
  const shade = spline([[1.5, 2.4], [1.1, 4.4]], 12), inside = shade.map(([r, y]) => [r - 0.02, y]).reverse();
  lamp.add(new THREE.Mesh(lathe([...shade, ...inside, shade[0]], {segments: 200}), M.linen({color: 0xf1e9dc}, {side: THREE.DoubleSide, emissive: new THREE.Color(0xffc27a), emissiveIntensity: 0.16})));
  // bulb: emissive, so it glows with bloom
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.28, 48, 24), M.glow({color: 0xffd9a0, intensity: 2.5}));
  bulb.position.y = 3.0; lamp.add(bulb);
  return [{name: 'lamp', object: lamp}];
}
