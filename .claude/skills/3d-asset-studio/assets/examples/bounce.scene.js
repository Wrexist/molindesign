// A looping bounce with squash and stretch: the pattern for any animate(t) sequence.
// node scripts/render.mjs assets/examples/bounce.scene.js --out out/bounce            → animated WebP (transparent)
// node scripts/render.mjs assets/examples/bounce.scene.js --out out/bounce --video webp,webm
import * as THREE from 'three';
import * as M from 'w3d/materials.js';

export const settings = {
  name: 'bounce', mode: 'sequence', width: 360,
  sequence: {frames: 24, fps: 30, loop: true}, // 0.8 s per bounce; loop: frame 24 would equal frame 0, so it is left out
  studio: 'soft', camera: {elevation: 8},
};

export default function build() {
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.6, 96, 48), M.plastic({color: 0xe8505b, glossy: true}));
  ball.geometry.translate(0, 0.6, 0); // pivot at the bottom, so squash happens about the point that touches the floor
  const g = new THREE.Group(); g.add(ball);
  return [{name: 'ball', object: g}];
}

/**
 * Called once per frame before it is rendered. t runs 0 → 1 over the sequence (without reaching 1 when looping).
 * Move, turn, scale or swap anything; the framing covers every pose and the shadows follow.
 */
export function animate({t, layers}) {
  const b = layers.ball, H = 2.4;              // peak 24 cm
  const u = 2 * t - 1;                          // -1 → 1; the floor is at both ends
  const h = H * (1 - u * u);                    // a parabola is what gravity draws
  const speed = Math.abs(u);                    // fastest at the floor, still at the top
  const contact = Math.max(0, 1 - h / 0.25);    // the last 2.5 cm before the floor
  const s = 1 + 0.12 * speed * (1 - contact) - 0.24 * contact; // stretch while falling fast, squash on impact
  b.position.y = h;
  b.scale.set(1 / Math.sqrt(s), s, 1 / Math.sqrt(s)); // keep the volume: thinner when longer
}
