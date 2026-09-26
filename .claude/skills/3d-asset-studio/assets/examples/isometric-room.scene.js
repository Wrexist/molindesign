// An isometric room illustration at real scale: a cut-away room with a window (a boolean), a desk with a laptop,
// a chair, books and a big plant. Clay look, true isometric camera.
// node scripts/render.mjs assets/examples/isometric-room.scene.js --out out/room
import * as THREE from 'three';
import * as O from 'w3d/objects.js';
import * as M from 'w3d/materials.js';
import {roundedBox} from 'w3d/geometry.js';
import {subtract, cutter} from 'w3d/csg.js';

export const settings = {
  name: 'isometric-room', mode: 'still', look: 'clay', size: [1200, 1200], margin: 0.08,
  camera: {iso: true},
  backdrop: {radial: ['#fbf6ef', '#efe4d6'], at: [0.5, 0.45], size: 0.8},
  contact: {opacity: 0.35},
};

const box = (w, h, d, r, material, [x, y, z]) => { const m = new THREE.Mesh(roundedBox(w, h, d, r, 4), material); m.position.set(x, y + h / 2, z); return m; };

export default function build() {
  const room = new THREE.Group();
  const S = 30, H = 26, T = 1.2;                                  // a 3 × 3 m room, 2.6 m high (1 unit = 10 cm)
  room.add(box(S, T, S, 0.3, M.paint({color: 0xe9d9c4, satin: false}), [0, 0, 0]));                       // floor slab
  const wallMat = M.paint({color: 0xf3ece2, satin: false});
  room.add(box(T, H, S, 0.3, wallMat, [-S / 2 + T / 2, T, 0]));                                           // left wall
  const back = box(S, H, T, 0.3, wallMat, [0, T, -S / 2 + T / 2]);
  room.add(subtract(back, cutter(new THREE.BoxGeometry(9, 9, 4), [4, T + 15, -S / 2 + T / 2])));        // back wall with a window
  room.add(box(9.6, 0.5, 1.6, 0.2, M.paint({color: 0xd2b48c}), [4, T + 10.2, -S / 2 + T + 0.6]));         // window sill
  room.add(box(18, 0.12, 12, 0.05, M.fabric({color: 0x9fb8a6}), [2, T, 2]));                              // rug

  // desk against the back wall, 72 cm high
  const wood = M.wood({color: 0xc49a6c});
  room.add(box(12, 0.5, 6, 0.15, wood, [0, T + 6.7, -S / 2 + T + 3.4]));
  for (const [x, z] of [[-5.5, -2.6], [5.5, -2.6], [-5.5, 2.6], [5.5, 2.6]]) room.add(box(0.5, 6.7, 0.5, 0.12, wood, [x, T, -S / 2 + T + 3.4 + z]));
  const laptop = O.laptop({angle: 108}); laptop.position.set(-0.5, T + 7.2, -S / 2 + T + 3.2); laptop.rotation.y = 0.12; room.add(laptop);
  const mug = O.mug({color: 0xef9bb1}); mug.position.set(3.6, T + 7.2, -S / 2 + T + 4.2); room.add(mug);
  [0x6f8fb3, 0xe0b25c, 0x9b6b8e].forEach((c, i) => { const b = O.book({color: c, width: 1.55, height: 2.2, depth: 0.3}); b.rotation.y = 0.2 * i - 0.2; b.position.set(-4.3, T + 7.2 + i * 0.3, -S / 2 + T + 4); room.add(b); });

  // chair: seat, back, legs
  const chair = new THREE.Group(), seatMat = M.paint({color: 0x94b8d8});
  chair.add(box(4.4, 0.6, 4.2, 0.25, seatMat, [0, 4.4, 0]), box(4.4, 4.2, 0.5, 0.25, seatMat, [0, 5, 2]));
  for (const [x, z] of [[-1.9, -1.8], [1.9, -1.8], [-1.9, 1.8], [1.9, 1.8]]) chair.add(box(0.35, 4.4, 0.35, 0.1, M.brushedSteel(), [x, 0, z]));
  chair.position.set(0.5, T, -S / 2 + T + 9.2); chair.rotation.y = 0.35; room.add(chair);

  // a framed print and a shelf with a vase on the left wall
  const art = M.canvasTexture(600, 800, (g, w, h) => {
    g.fillStyle = '#f4ede3'; g.fillRect(0, 0, w, h);
    [['#e8a48c', 0.38, 0.36, 0.26], ['#9fb8a6', 0.62, 0.58, 0.22], ['#f1cf7d', 0.42, 0.72, 0.12]].forEach(([c, x, y, r]) => { g.fillStyle = c; g.beginPath(); g.arc(x * w, y * h, r * w, 0, Math.PI * 2); g.fill(); });
  });
  const frame = box(0.4, 9.4, 7.4, 0.12, M.wood({color: 0x3b3029}), [-S / 2 + T + 0.2, T + 11, 3]);
  const print = new THREE.Mesh(new THREE.PlaneGeometry(6.6, 8.6), new THREE.MeshStandardMaterial({map: art, roughness: 0.9}));
  print.rotation.y = Math.PI / 2; print.position.set(-S / 2 + T + 0.42, T + 15.7, 3);
  room.add(frame, print);
  room.add(box(3.2, 0.4, 8, 0.12, wood, [-S / 2 + T + 1.6, T + 8, 11]));                                   // shelf
  const vase = O.vase({style: 'bulb', height: 2.6, color: 0xb4a2f2}); vase.position.set(-S / 2 + T + 1.6, T + 8.4, 12.2); room.add(vase);
  // a big floor plant in the corner
  const plant = O.pottedPlant({potHeight: 4, potRadius: 2.1, leaves: 12, leafLength: 7, seed: 9}); plant.position.set(-S / 2 + T + 3.5, T, -S / 2 + T + 3.5); room.add(plant);
  return [{name: 'room', object: room}];
}
