# Importing, fixing and converting models

## Contents
- Look before you use it: inspect.mjs
- loadModel: options and what it fixes
- Fixing common problems
- Converting: convert.mjs
- Optimising GLBs for the web (gltf-transform)
- Where to get models, and licences
- AI-generated meshes
- CAD, scans and other sources

## Look before you use it: inspect.mjs

```bash
node <skill>/scripts/inspect.mjs chair.glb            # or .gltf .obj .fbx .stl .ply .3mf .dae .usdz .vox
```
It prints the real size, meshes, triangles, materials (and their types), textures (count, largest), animations
and compression extensions, plus advice for the web (too heavy, oversized textures, uncompressed). It renders
`chair.inspect/sheet.png` with front, three-quarter, side and back views in the studio. Read the sheet: it shows
at once whether the model is upright, facing the right way, the right size, and whether its materials survived.

## loadModel: options and what it fixes

```js
import {loadModel, fitTo, copyModel, poseAt, describe} from 'w3d/models.js';
const chair = await loadModel(new URL('./chair.glb', import.meta.url).href, {height: '82cm', rotate: [0, -30, 0]});
ctx.log(describe(chair));                      // one line: format, triangles, materials, size
return [{name: 'chair', object: chair}];
```
| option | meaning |
|---|---|
| `height`, `width`, `depth`, `size` | scale so this dimension matches (`'82cm'`, `'1.2m'`, `'300mm'`, `'12in'`, or scene units) |
| `units` | what the file's numbers mean when no size is given: `mm cm m in ft`. Defaults: glTF/USDZ/DAE metres, FBX centimetres, STL/3MF millimetres; OBJ/PLY/VOX have none (fitted to 30 cm with a note) |
| `up` | `'z'` for Z-up files (the default for STL/3MF; CAD and printing are Z-up) |
| `rotate` | `[x, y, z]` degrees after that: turn the front toward the camera |
| `material` | a Material for every mesh, or `(mesh, old) => Material` to replace some; otherwise legacy Phong/Lambert materials become PBR (shininess → roughness) |
| `smooth` | crease angle in degrees: recompute smooth normals (faceted scans, STLs) |
| `flat` | faceted shading |
| `center`, `ground` | `false` keeps the file's own origin (parts that must line up, rooms) |
| `shadows` | `false`: no shadows cast or received |
| `mtl` | an OBJ's material file (default: the same name `.mtl`; `false` for none) |

Every model comes back standing on y = 0, centred on x/z, casting shadows, with texture anisotropy raised.
`model.userData.w3dModel` holds the stats. `copyModel(model)` makes more instances (skinned models included),
and `fitTo(object, {height})` rescales anything.

Draco, Meshopt and KTX2-compressed glTF files load directly. The decoders ship with three.js.

## Fixing common problems

| problem (seen in the inspect sheet) | fix |
|---|---|
| lying on its back, face down | `up: 'z'` (or `rotate: [-90, 0, 0]`) |
| facing away or sideways | `rotate: [0, 180, 0]` or `[0, ±90, 0]` |
| tiny or gigantic | `height` / `size` with a real measurement; for mm files `units: 'mm'` |
| faceted when it should be smooth | `smooth: 30`–`60` |
| grey, black or plastic-looking materials | `material: (mesh, old) => …` with a preset per part (match by `mesh.name` or `old.name`) |
| textures dark or washed out | the colour map must be sRGB: `old.map.colorSpace = THREE.SRGBColorSpace` in a material function |
| lighting baked into the texture (AI meshes, scans) | render with softer, frontal light (`bright`), or replace the materials |
| holes, flipped faces (black patches) | `material: (mesh, m) => { m.side = THREE.DoubleSide; return m; }`; fix in Blender for exports |
| far too many triangles | simplify with gltf-transform (below) before rendering, or ship an image instead |
| a part you do not want (ground plane, backdrop, light props) | `model.traverse(o => { if (/ground|plane|backdrop/i.test(o.name)) o.visible = false; })` |

## Converting: convert.mjs

```bash
node <skill>/scripts/convert.mjs chair.fbx --to glb,usdz --height 82cm   # web + iOS AR Quick Look
node <skill>/scripts/convert.mjs part.obj --to stl --units mm            # 3D printing
```
It goes through three.js: the geometry, PBR materials and textures that three can read and write. Files are at
real size: glTF/USDZ/OBJ in metres, STL in millimetres and Z-up. For anything three cannot read (STEP, IGES,
Blend, MAX, C4D), export glTF from the authoring tool (Blender: File › Export › glTF 2.0; CAD tools export STL
or OBJ).

## Optimising GLBs for the web (gltf-transform)

[gltf-transform](https://gltf-transform.dev) is the standard tool (`npx @gltf-transform/cli`):
```bash
npx @gltf-transform/cli optimize in.glb out.glb --compress meshopt --texture-compress webp --texture-size 2048
npx @gltf-transform/cli optimize in.glb out.glb --compress draco --simplify false      # keep full detail
npx @gltf-transform/cli inspect in.glb                                                 # sizes per part
```
`optimize` welds, deduplicates, joins meshes and simplifies, then compresses geometry (Meshopt or Draco) and
textures. A tested example: a 1.08 MB export became 133 kB (Meshopt) or 77 kB (Draco), and both load with
`loadModel`, `<model-viewer>` and the `w3d-viewer`. Simplification changes the silhouette slightly, so check the
inspect sheet after. Budgets for live models: references/live-3d.md.

## Where to get models, and licences

Always check and state the licence. Prefer CC0 (no attribution needed), and credit CC-BY authors where the
licence requires it.

| source | what | licence |
|---|---|---|
| Poly Haven (polyhaven.com) | high-quality props, furniture, food, plus HDRIs and textures | CC0 |
| Kenney (kenney.nl) | stylized low-poly packs (furniture, food, city, space) | CC0 |
| Quaternius (quaternius.com) | stylized low-poly characters, animals, nature (often animated) | CC0 |
| Poly Pizza (poly.pizza) | thousands of low-poly models | per model: CC0 or CC-BY |
| Sketchfab | huge variety, many downloadable | per model: CC-BY, CC0, or paid: check each |
| Smithsonian 3D, museum scans | scanned artefacts | often CC0 |
| NASA 3D resources | spacecraft, planets | free to use, with guidelines |
| manufacturers | CAD models of real products | their terms: usually fine for showing their product |

The user's own files (CAD exports, earlier projects, a designer's GLB) come first. Never pass off a downloaded
model as the user's product.

## AI-generated meshes

Image-to-3D and text-to-3D services can turn a product photo or a prompt into a GLB in minutes. Use one when
the object is too complex to model in code (a character, a sculpted toy, a detailed shoe) and the tool is
actually available in the session.
- **Consent first.** Sending a user's photo or file to a third-party service uploads it outside the machine.
  Ask, say where it goes, and proceed only on a clear yes. Prompts and your own images are different from the
  user's files, but still mention which service you are using.
- **Expect to fix**: scale and orientation (`height`, `rotate`), lumpy or melted detail on edges and text,
  lighting baked into the texture (render with soft frontal light, or rematerial), and heavy triangle counts
  (simplify).
- Inspect before rendering, and be honest about the quality. For hero use, a modeled or real model often beats a
  generated one.

## CAD, scans and other sources

- **CAD** (SolidWorks, Fusion, Onshape): export STL or OBJ (or glTF where offered) at the finest tessellation,
  then `loadModel(url, {units: 'mm', up: 'z', smooth: 30, material: …})`. Assign materials per part by name.
- **Photogrammetry and LiDAR scans** (Polycam, RealityScan): GLB/OBJ with baked lighting; simplify, then light
  gently.
- **Blender, Cinema 4D, Spline**: export glTF 2.0 (`.glb`) with "Apply modifiers", and without cameras and lights
  unless wanted (the studio provides both).
- **Voxel art** (MagicaVoxel `.vox`): loads directly, and suits the `toon` or `lowpoly` looks and isometric
  cameras.
