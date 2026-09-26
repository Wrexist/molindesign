// A matching icon set in the soft clay style: one scene, one layer per icon, so camera, light and scale match.
// node scripts/render.mjs assets/examples/clay-icons.scene.js --out out/icons   → icons/<name>.webp + a contact sheet
import * as THREE from 'three';
import * as O from 'w3d/objects.js';
import * as M from 'w3d/materials.js';

export const settings = {
  name: 'clay-icons', mode: 'icons', look: 'clay',
  icons: {size: [512, 512], margin: 0.12},
  camera: {elevation: 26, azimuth: -28},
  background: '#f4f1fb',
};

// a pastel palette: high lightness, low saturation, one colour per icon
const P = {lilac: 0xb4a2f2, peach: 0xf5b596, mint: 0x94d8bd, sky: 0x96c3ef, butter: 0xf3d487, rose: 0xef9bb1};
const CHAT = '<svg viewBox="0 0 100 90"><path d="M22 2 H78 C90 2 98 10 98 22 V50 C98 62 90 70 78 70 H46 L25 88 L29 70 H22 C10 70 2 62 2 50 V22 C2 10 10 2 22 2Z"/></svg>';

export default function build() {
  const coins = new THREE.Group();
  [[0, 0], [0.03, 0.02], [-0.02, 0.05]].forEach(([dx, dz], i) => {
    const c = O.coin({diameter: 0.95, thickness: 0.13, material: M.gold()}); c.position.set(dx, i * 0.13, dz); c.rotation.y = i * 0.7; coins.add(c);
  });
  const leaning = O.coin({diameter: 0.95, thickness: 0.13, material: M.gold()}); // one coin leaning on the stack
  leaning.rotation.set(0, 0.3, -1.15); leaning.position.set(0.66, 0.44, 0.12); coins.add(leaning); // its rim touches the floor

  return [
    {name: 'heart', object: O.puffy({shape: 'heart', size: 1.1, depth: 0.42, color: P.rose})},
    {name: 'star', object: O.puffy({shape: 'star', size: 1.1, depth: 0.4, color: P.butter})},
    {name: 'chat', object: O.puffy({shape: CHAT, size: 1.1, depth: 0.38, color: P.sky})},
    {name: 'gift', object: O.giftBox({size: 0.95, color: P.lilac, ribbon: P.butter})},
    {name: 'coins', object: coins},
    {name: 'mug', object: O.mug({color: P.peach})},
  ];
}
