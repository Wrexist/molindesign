// Material swatches: every preset on the same small object, one layer each, so sheet.png labels them.
// Render it once when choosing materials:  node scripts/render.mjs assets/examples/materials.scene.js --out /tmp/w3d-materials
// (glass refracts its neighbours in the render but not in its own layer, so the rebuild check differs behind it)
import * as THREE from 'three';
import {lathe, roundCorners} from 'w3d/geometry.js';
import * as M from 'w3d/materials.js';

export const settings = {
  name: 'materials',
  width: 1200,
  camera: {elevation: 22, distance: 7},
  studio: {preset: 'soft', envMap: 'softbox'},
  order: 'auto',
};

// a pebble-like swatch: a squashed sphere with a flat base, so both form and grain read
const swatch = lathe(roundCorners([[0, 0], [0.22, 0], ...Array.from({length: 24}, (_, i) => { const a = -0.9 + (Math.PI / 2 + 0.9) * (i + 1) / 24; return [0.3 * Math.cos(a), 0.2 + 0.24 * Math.sin(a)]; })], [0, 0.03]), {segments: 120});

export default function build() {
  const list = [
    ['rubber', M.rubber()], ['powder-coat', M.powderCoat()], ['plastic', M.plastic()], ['plastic-glossy', M.plastic({color: 0xd9573b, glossy: true})],
    ['stone', M.stone()], ['ceramic', M.ceramic()], ['paint', M.paint()], ['wood', M.wood()],
    ['brushed-steel', M.brushedSteel()], ['chrome', M.chrome()], ['gold', M.gold()], ['copper', M.copper()],
    ['fabric', M.fabric()], ['glass', M.glass()],
  ];
  const cols = 7;
  return list.map(([name, mat], i) => {
    const m = new THREE.Mesh(swatch, mat);
    const row = Math.floor(i / cols), col = i % cols;
    m.position.set((col - (cols - 1) / 2) * 0.78 + (row ? 0.39 : 0), 0, row ? -0.72 : 0);
    m.rotation.y = i * 0.7;
    return {name, object: m, motion: 'pop', delay: i * 60};
  });
}
