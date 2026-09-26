// Using an existing model: load a GLB (Draco-compressed here), give it its real size, turn it to the camera,
// swap a material, and render it like anything else. Any glb/gltf/obj/fbx/stl/ply/3mf/dae/usdz/vox works.
// node scripts/inspect.mjs assets/examples/models/desk-set.glb        ← look at a model first
// node scripts/render.mjs assets/examples/imported-model.scene.js --out out/imported
import * as M from 'w3d/materials.js';
import {loadModel, describe} from 'w3d/models.js';

export const settings = {name: 'imported-model', mode: 'still', size: [1200, 800], studio: 'soft', camera: {elevation: 18},
  backdrop: {radial: ['#f5f2ec', '#e7e1d7']}};

export default async function build(ctx) {
  const set = await loadModel(new URL('./models/desk-set.glb', import.meta.url).href, {
    height: '27cm',                 // the plant's height: everything scales with it
    rotate: [0, -25, 0],            // three-quarter view
    // restyle one part by its material, keep the rest as the file has it
    material: (mesh, old) => (old.name === 'pot' ? M.ceramic({color: 0x2f4a3a}) : old), // names: cup, coffee, pot, soil, leaf
  });
  ctx.log(describe(set));
  return [{name: 'desk-set', object: set}];
}
