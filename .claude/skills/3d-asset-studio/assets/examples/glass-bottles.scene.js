// Glass on its backdrop with the 'glass' studio: dark edges, strip highlights, the floor seen through the glass,
// lighter shadows for clear glass and darker for tinted. Glass must be rendered on its final background.
// node scripts/render.mjs assets/examples/glass-bottles.scene.js --out out/glass
import * as O from 'w3d/objects.js';

export const settings = {
  name: 'glass-bottles', mode: 'still', size: [1200, 800], margin: 0.1,
  studio: 'glass', camera: {elevation: 12},
  backdrop: {linear: ['#f6f3ee', '#e6e0d6']},
};

export default function build() {
  const jar = O.jar({fill: null});
  const water = O.bottle({type: 'water', color: 0xd7ebe4}); water.position.x = 1.05;
  const wine = O.bottle({type: 'wine'}); wine.position.set(2.15, 0, -0.6);
  const gem = O.gem({color: 0xf2b6c6}); gem.position.set(-0.95, 0, 0.35);
  return [{name: 'jar', object: jar}, {name: 'water', object: water}, {name: 'wine', object: wine}, {name: 'gem', object: gem}];
}
