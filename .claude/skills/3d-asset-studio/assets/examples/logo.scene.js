// A brand mark from an SVG file, extruded into a solid with bevelled edges, hovering over its shadow.
// Swap logo-mark.svg for the client's logo (a single-colour SVG with filled paths works best).
// Shows: extrudeSVG, loading a file next to the scene, a floating object with a detached shadow, pop + float.
import * as THREE from 'three';
import {extrudeSVG} from 'w3d/geometry.js';
import {gold, withGrain} from 'w3d/materials.js'; // or paint({color: 0x…}) in the brand colour

export const settings = {
  name: 'logo',
  width: 700,
  camera: {elevation: 8, azimuth: 0, distance: 6.5},
  // light from above puts the shadow of a hovering object right under it (a side key would give it two shadows);
  // softbox reflections make metal read as metal
  studio: {preset: 'top', envMap: 'softbox', key: {softness: 2.2}},
  contact: {opacity: 0.3, blur: 1.6},
  background: '#f2f2ee',
  motion: {type: 'pop'},
};

export default async function build() {
  const svg = await (await fetch(new URL('./logo-mark.svg', import.meta.url))).text();
  const geo = extrudeSVG(svg, {size: 1.4, depth: 0.2, bevel: 0.055, bevelSegments: 10, curveSegments: 64});
  const satinGold = withGrain(gold({}, {roughness: 0.2}), {scale: 320, bump: 0.1, roughVar: 0.02, tintVar: 0.006}); // a faint satin grain
  const mark = new THREE.Mesh(geo, satinGold);
  mark.position.y = 0.32;                   // hover above the floor: the shadow detaches and the idle float reads
  mark.rotation.set(-0.1, -0.48, 0);       // turned and tipped back: the face catches the soft top light, the bevel shows the depth
  return [{name: 'mark', object: mark, motion: 'pop', idle: 'float'}];
}

