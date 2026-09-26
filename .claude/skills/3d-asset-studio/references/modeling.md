# Modeling

## Contents
- How to approach any object
- Shape families and their helpers
- The helpers (w3d/geometry.js)
- Booleans (w3d/csg.js)
- Deformers and organic shapes (w3d/deform.js, w3d/noise.js)
- Lettering (w3d/text.js) and logos (extrudeSVG)
- Scatter (w3d/scatter.js)
- The object catalogue (w3d/objects.js)
- Real-world dimensions
- Recipes: turned objects, handles, bands, boxes and devices, balls, food, plants, soft things, liquids, labels
- Worked example: a table lamp from scratch
- Groups, stacks, arrangements, interlocking
- What makes it look real

## How to approach any object

1. **Measure.** Look up the real dimensions (table below, the product page, or reason from something known),
   then work in 1 unit = 10 cm. Real scale makes grain, bevels, shadow softness and AO come out right.
2. **Silhouette first.** Sketch the side or top outline in real proportions and decide the shape family.
   Most of what makes an object recognisable is its outline and its proportions.
3. **Parts.** Split it into the parts a factory would make: body, lid, handle, label, screen. Each part is one
   helper call; group them in a `THREE.Group`.
4. **Edges.** Round every edge a hand would touch (`roundCorners`, bevels). Keep sharp only what is truly sharp
   (a knife edge, a paper edge).
5. **Materials,** then **details** (seams, rims, screws, a camera bump), one or two per object and never noise.
6. **Draft, look, fix** one thing at a time.

## Shape families and their helpers

| shape family | examples | build with |
|---|---|---|
| turned (round in plan) | plates, cups, bottles, vases, bowls, lamps, candles, kettlebell bodies, knobs | `lathe(profile)` |
| swept round section | handles, cables, hoops, pipes, straws, wires, chair frames | `tube(points, radius)` |
| swept flat section | resistance bands, straps, ribbons, belts, watch straps | `ribbon(points, {width, thickness, twist})` |
| box-like | packaging, books, blocks, cushions, devices, furniture panels | `roundedBox`, or `ExtrudeGeometry` of a rounded `Shape` |
| outline with depth | logos, icons, lettering, keys, cookie cutters, brackets | `extrudeSVG(svg)`, `text3d(text)`, `new THREE.ExtrudeGeometry(shape, {bevel…})` |
| organic | fruit, rocks, blobs, dough, clay, pebbles, clouds | a dense sphere or lathe + `displace` / `squash` / `inflate` |
| cut and combined | holes, slots, buttons, grilles, engravings, one watertight solid | `subtract`, `union`, `intersect` |
| bent, twisted, tapered | curved panels, twisted candles, leaning vases, horns | `bend`, `twist`, `taper` |
| many small things | sprinkles, seeds, confetti, pebbles, leaves on the ground | `scatter`, `scatterVolume` |

## The helpers (w3d/geometry.js)

```js
import {lathe, roundCorners, spline, tube, ribbon, roundedBox, roundedDisc, extrudeSVG, creased, smooth, facet, evenUV, onFloor} from 'w3d/geometry.js';
```
- `roundCorners(points, radius | radii[], segments = 8, {closed})`: fillets the corners of a 2D polyline. Use a radii
  array for per-corner control, with 0 to keep a corner (the axis points of a lathe profile). `{closed: true}` rounds
  every corner of a closed outline, which is what you want for a `THREE.Shape` to extrude.
  `roundedRectShape(w, h, r)` from objects.js is a ready rounded rectangle `Shape`.
- `spline(points, samples = 48)`: a smooth curve through 2D points. Use it for organic walls. A handful of
  straight segments shows as flat bands of shading.
- `lathe(profile, {segments = 160, crease = 35})`: revolves `[radius, height]` points around y. Go bottom to top,
  outside first, then back down the inside for hollow things, ending on the axis. Profile corners sharper than
  `crease` stay crisp.
- `roundedDisc({outer, inner, height, radius})`: a washer or puck with rounded edges.
- `tube(points3d, radius, {tubular, radial, closed, tension})`: a round tube along a smooth curve.
- `ribbon(points3d, {width, thickness, closed, twist: t => radians, up})`: a flat band along a curve, standing on
  its edge. `twist` rotates it around the curve (closed loops: whole multiples of π at t = 1).
- `roundedBox(w, h, d, radius, segments)`: a box with every edge rounded.
- `extrudeSVG(svgText, {size, depth, bevel, bevelSegments, curveSegments, unit, center})`: filled SVG paths to a solid,
  centred, standing on y = 0, facing +z, with `size` as the final width. For parts that must fit together (puzzle
  pieces, a logo split by colour), give them all the same `unit` (scene units per SVG unit) and `center: false`, so
  they keep the SVG's shared scale and positions.
- `refine(geometry, maxEdge)`: subdivide until no edge is longer than `maxEdge`, crack-free (shared edges split the
  same way on both sides). Use it before deformers or `displace` on sparse geometry.
- `fixTJunctions(geometry)`: closes hairline cracks where a vertex lies on another triangle's edge (booleans do
  this automatically; imported models sometimes need it).
- `flatCaps(geometry)`: exact flat normals on the front and back of an extrusion (`extrudeSVG` and `text3d` apply it).
- `creased(geometry, angle = 40)`: smooth normals that stay crisp where faces fold. Welding follows the object's
  size, so small bevels are safe. `smooth(geometry, {crease})` is the same with a tolerance option.
- `facet(geometry, {cell, jitter, seed})`: vertex-clustering remesh to low-poly facets (the `lowpoly` look uses
  it; call it yourself for one faceted object).
- `evenUV(geometry)`: even UV density for image textures (grain materials need no UVs).
- `onFloor(object)`: moves an object so its lowest point sits on y = 0, measuring the real vertices even when
  rotated.

## Booleans (w3d/csg.js)

```js
import {subtract, union, intersect, cutter} from 'w3d/csg.js';
const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.16, 96), M.plastic({color: 0xe8505b, glossy: true}));
disc.position.y = 0.08;
const holes = [[-0.14, -0.14], [0.14, -0.14], [-0.14, 0.14], [0.14, 0.14]]
  .map(([x, z]) => cutter(new THREE.CylinderGeometry(0.07, 0.07, 0.5, 48), [x, 0.08, z]));
const dish = cutter(new THREE.SphereGeometry(1.6, 96, 48), [0, 1.72, 0]);   // a shallow dish in the top
const button = subtract(disc, dish, ...holes);                               // a world-space mesh
```
- Inputs are meshes with their transforms. The result is one mesh in world space: add it as is. Cut edges are
  closed automatically (no hairline cracks), and normals come from the inputs.
- Cut faces take the base's material unless the cutter has its own (`cutter(geo, pos, rot, M.gold())` inlays
  gold into the cut: engraving, filled lettering).
- `union` merges overlapping parts into one clean solid: no internal faces, a clean silhouette, and a better STL.
- Give curved inputs enough segments (the result keeps their facets), and bevel afterwards by modeling the
  rounded cutter itself (a `roundedBox` cutter makes a rounded slot).
- Good for: drilled holes, slots, vents, keyholes, the notch in a phone, embossed or engraved text
  (`subtract(plate, textMesh)`), pie slices, cut fruit.

## Deformers and organic shapes (w3d/deform.js, w3d/noise.js)

```js
import {bend, twist, taper, displace, inflate, squash} from 'w3d/deform.js';
const candle = twist(new THREE.BoxGeometry(0.4, 1.6, 0.4, 8, 64, 8), {angle: Math.PI});        // twisted column
const panel  = bend(new THREE.BoxGeometry(0.12, 1.6, 0.8, 2, 64, 8), {angle: Math.PI * 0.6, along: 'y', toward: 'x'});
const tower  = taper(new THREE.CylinderGeometry(0.4, 0.4, 1.6, 64, 32), {scale: 0.35, curve: 1.6});
const rock   = displace(new THREE.IcosahedronGeometry(0.3, 40), {amount: 0.04, scale: 6, seed: 3, octaves: 5});
const pillow = inflate(roundedBox(1.4, 0.3, 1, 0.12, 8), 0.04);
const soft   = squash(geometry, {amount: 0.12});   // cartoon weight, volume kept
```
- Deformers move vertices, so **the geometry needs segments along the deformation** (`BoxGeometry(…, 64 …)`),
  or the bend comes out as a few kinks.
- `displace` welds seams first, so the surface stays closed. Organic shapes want a dense base
  (`IcosahedronGeometry(r, 32–48)`). `amount` is in scene units and `scale` is features per unit; 2–3 octaves read
  as smooth lumps, 5–6 as rough stone.
- `noise3`, `fbm3`, `ridged3` (w3d/noise.js) are seeded 3D noise functions for your own displacements (bark,
  terrain, waves: `displace(g, {fn: (x, y, z) => ridged(x, y, z) * 0.5})`).
- Low-poly on purpose: `facet(geometry, {cell: 0.1})` after displacing gives the faceted-stone look.

## Lettering (w3d/text.js) and logos (extrudeSVG)

```js
import {text3d, FONTS} from 'w3d/text.js';
const g = await text3d('Hej!', {font: 'helvetiker_bold', size: 0.9, depth: 0.3, bevel: 0.03});  // centred, on y = 0, facing +z
const brand = await text3d('Studio', {font: new URL('./Brand-Bold.ttf', import.meta.url).href, size: 0.6, letterSpacing: 0.02});
```
- Bundled fonts: `helvetiker optimer gentilis` (`_regular`/`_bold`) and `droid/droid_sans_*`,
  `droid/droid_serif_*`. Any `.ttf`/`.otf` next to the scene works too, so use the brand's font.
- Depth ~0.25–0.4× the letter height, and a bevel of 3–5% of the height with 5+ segments. The bevel catches light,
  so lettering without one looks cheap. `'\n'` makes lines; `align: 'left' | 'center' | 'right'`.
- Logos: a single-colour SVG with filled paths (outline strokes and convert text to paths first). Use
  `extrudeSVG(svg, {size, depth: 0.15 × size, bevel: 0.04 × size, bevelSegments: 10})`. Very thin parts and
  sharp inner corners limit the bevel: if the bevel notches a tip, lower `bevel`.
- Hovering logos: lift them 0.2–0.4 units, `studio: 'top'` so the shadow sits under them, `idle: 'float'`.
  Metals need `envMap: 'softbox'`.

## Scatter (w3d/scatter.js)

```js
import {scatter, scatterVolume} from 'w3d/scatter.js';
const sprinkle = new THREE.CapsuleGeometry(0.008, 0.035, 4, 8).rotateZ(Math.PI / 2);
scatter(icingMesh, sprinkle, M.plastic({glossy: true}), {count: 140, seed: 5, colors: ['#e8505b', '#f9c74f', '#6cc3d5'],
  align: 'normal', tilt: 0.3, lift: 0.004, where: (p, n) => n.y > 0.3});                    // only on top
const confetti = scatterVolume(new THREE.PlaneGeometry(0.05, 0.03), M.paper(), {count: 80, box: [[-1, 0.2, -1], [1, 1.6, 1]]});
```
One InstancedMesh, seeded and repeatable. `where` filters by position and normal (only the top, only one side).
Instances skip baked AO; the path tracer expands them automatically.

## The object catalogue (w3d/objects.js)

Every generator takes an options object and returns a Group standing on y = 0, centred, at real size. Read the
source of any of them as a worked example: each is short on purpose.

| generator | real size (default) | key options |
|---|---|---|
| `weightPlate` | ⌀ 45 cm (20 kg Olympic) | `diameter thickness hole color` |
| `kettlebell` | 16 kg, body ⌀ 21 cm | `size color handle` |
| `dumbbell` | 32 cm (10 kg hex) | `length head color` |
| `exerciseBall` | ⌀ 65 cm | `diameter color seams` |
| `tennisBall` | ⌀ 6.7 cm | `diameter color` |
| `resistanceBand` | loop ~13 × 8 cm | `color width length` |
| `yogaMat` | 61 cm wide, rolled | `width thickness turns core color` |
| `yogaBlock` | 23 × 15 × 7.5 cm | `material: 'cork' \| 'foam'`, `color` |
| `mug` | ⌀ 8.4 cm, 9.5 cm tall | `height radius color wall` |
| `bottle` | wine 75 cl | `type: 'wine' \| 'water' \| 'beer' \| 'cosmetic'`, `color label glass` |
| `jar` | 11 cm tall | `height radius lid glassColor frost fill` |
| `vase` | 24 cm | `style: 'bud' \| 'amphora' \| 'cylinder' \| 'bulb' \| [[r, y]…]`, `height color material` |
| `bowl`, `plate` | ⌀ 16 cm, ⌀ 27 cm | `radius depth wall color`; `diameter color` |
| `donut` | ⌀ 9 cm | `icing sprinkles seed` |
| `fruit` | real sizes | `type: 'apple' \| 'orange' \| 'lemon' \| 'pear'`, `color seed` |
| `cake` | ⌀ 20 cm | `diameter height frosting berries` |
| `pottedPlant` | pot 13 cm | `potHeight potRadius leaves leafLength leafColor pot: 'terracotta' \| 'glazed'` |
| `leafGeometry` | – | `(length, width, {fold, rows, cols, tip})`: one bendable leaf |
| `candle` | ⌀ 7 cm | `height radius color lit` (the flame glows: `post: {bloom: true}`) |
| `book` | 15.5 × 23.5 × 3.2 cm | `color title titleColor font standing pages` |
| `box`, `giftBox` | 12 cm cube | `w h d color material label`; `size color ribbon` |
| `gem` | ⌀ 8 mm × 10 (jewellery scale up) | `diameter color facets` |
| `coin` | ⌀ 2.5 cm | `diameter thickness material` |
| `pill` | 2 cm capsule | `length radius colors` |
| `puffy` | 10 cm icon shape | `shape: 'heart' \| 'star' \| 'cloud' \| 'drop' \| 'bolt' \| '<svg…>'`, `size depth color material` |
| `blob` | ⌀ 12 cm | `radius wobble color seed material` |
| `rock` | 6 cm pebble | `size flat color seed faceted` |
| `phone` | 7.4 × 15.2 cm | `screen` (a texture), `body` |
| `laptop` | 14", 31 × 22 cm | `angle screen body` |

`CATALOG` maps every name to its generator (for contact sheets: render them all in `icons` mode to choose).

## Real-world dimensions

In cm; divide by 10 for scene units.

| object | size |
|---|---|
| coffee mug | ⌀ 8–8.5, height 9.5; handle ~1/12 of the height thick |
| espresso cup / cappuccino cup | ⌀ 6 × 6 / ⌀ 9.5 × 7.5 |
| wine glass | height 20–23, bowl ⌀ 8–9, stem ⌀ 0.7 |
| wine bottle 75 cl / beer 33 cl / water 50 cl | ⌀ 7.5 × 30 / ⌀ 6 × 23 / ⌀ 6.5 × 21 |
| drink can 33 cl | ⌀ 6.6 × 11.5 |
| dinner plate / side plate / cereal bowl | ⌀ 26–28 / ⌀ 20 / ⌀ 15 × 7 |
| fork, knife | 20–23 long |
| smartphone | 7.1–7.8 × 14.7–16.3 × 0.8; corner radius ~1 |
| tablet 11" | 17.8 × 24.8 × 0.6 |
| laptop 14" / 16" | 31 × 22 × 1.6 / 35.5 × 24.8 × 1.7 |
| smartwatch | case 4–4.9 × 3.5–4.2 × 1 |
| over-ear headphones | ~18 × 16 × 8 |
| sneaker | 28–30 long, 10 wide, 11 high |
| hardcover / paperback | 16 × 24 × 3 / 11 × 18 × 2 |
| A4 / business card / credit card | 21 × 29.7 / 8.5 × 5.5 / 8.56 × 5.4 × 0.08 |
| chair | seat height 45, total 80–90, seat 45 × 45 |
| dining table / desk | height 72–75 |
| sofa | seat height 42–45, depth 85–95, arm 60 |
| door | 200–210 × 80–90 |
| kettlebell 16 kg / 24 kg | ⌀ 21 × 28 / ⌀ 21 × 28 (competition bells share a size) |
| bumper plate 20 kg | ⌀ 45 × 5–7 thick |
| yoga mat | 61 × 173–183 × 0.4–0.6; rolled ⌀ 12–15 |
| tennis / football / basketball / golf ball | ⌀ 6.7 / 22 / 24 / 4.3 |
| apple, orange / lemon / banana / egg | ⌀ 7–8 / 6 × 8 / 18–20 long / 4.5 × 5.7 |
| donut / croissant | ⌀ 9 / 13 × 7 |
| perfume bottle 50 ml / lipstick | ~5 × 3 × 9 / ⌀ 2 × 7.5 |
| wristwatch case / ring | ⌀ 3.8–4.2 × 1–1.2 / inner ⌀ 1.6–2, band 0.2–0.6 |
| key / pen / 1 € coin | 5–6 long / 14 × 1 / ⌀ 2.3 × 0.23 |
| potted house plant | pot ⌀ 12–14 × 12, plant 30–60 |
| LEGO 2×4 brick | 3.2 × 1.6 × 0.96 (+ studs 0.17) |

## Recipes

### Turned objects (lathe)

Start the profile on the axis at the bottom (`[0, y]`), go out along the base, up the outside, over the rim
and, for hollow objects, back down the inside, ending on the axis. Round every corner except the axis points.
```js
const outer = spline([[0.2, 0.05], [0.27, 0.068], [0.34, 0.15], [0.39, 0.29], [0.413, 0.42], [0.42, 0.5]], 40);
const inner = spline([[0.396, 0.5], [0.39, 0.42], [0.367, 0.29], [0.315, 0.17], [0.24, 0.1], [0.12, 0.086]], 40);
const pts = [[0, 0.06], [0.17, 0.06], ...outer, ...inner, [0, 0.085]];
const cup = lathe(roundCorners(pts, pts.map((_, i) => (i === 1 ? 0.012 : i === 41 || i === 42 ? 0.011 : 0))));
```
Examples: `weight-plates.scene.js`, `coffee-cup.scene.js`, and in objects.js `mug`, `bottle`, `vase`, `bowl`, `plate`.

### Handles, cables, hoops (tube)

Draw the centre line through 6–10 points in a plane and push the ends slightly *into* the body, so no gap shows.
Size the radius from real proportions. Where a handle meets a cast body there is a fillet: a short lathe cone
flared at each end sells it (the kettlebell's horns).

### Bands and straps (ribbon)

A closed band lying on the floor: an irregular outline, `width` ~0.2, `thickness` ~0.02, the points' y =
width / 2 so it stands on its edge, and one half twist where it dips flat (`twist: t => Math.PI *
smoothstep(0.04, 0.3, t)`), lowering the centre line there so it keeps touching the floor. Material: `fabric`.

### Boxes, packaging and devices

- Packaging: `roundedBox(w, h, d, 0.02)` with `paint` or `plastic`, labels as thin planes 0.001 in front of a
  face (`canvasTexture`, `imageTexture`), or `box({label})`.
- Phones and tablets: `ExtrudeGeometry` of a rounded-rectangle `Shape` with a bevel (a rounded box cannot give the
  large plan-view corner radius), a black glass front, and the display as an **emissive** map under a clear coat.
  `phone({screen})`, `laptop({screen})` and `phone.scene.js` show it.

### Balls

`SphereGeometry(r, 160, 120)`. Seams, panels and stripes are canvas textures on the sphere's UVs (see
`kettlebell-set.scene.js`). Tilt the ball so the seams curve across it: a pole pointing at the camera looks like
a target.

### Food

Food looks real through irregularity and the right sheen. Dough gets `displace` for lumps plus the `dough` grain,
icing is a thicker torus top with a wavy drip edge, and sprinkles come from `scatter` (see `donut`). Fruit is a
lathe silhouette + `displace`, with citrus pores from `withGrain` pits. Keep highlights soft (roughness 0.4–0.6),
except for glazes and icing. A plate, a napkin (a bent, inflated thin box) and crumbs (scatter) make the scene.

### Plants

Leaves are dense grids (`leafGeometry`), bent with `bend` and arranged in a rosette with golden-angle turns
(137.5°); each leaf gets a slightly different length, tilt and green. Stems are `tube`s. Keep leaf material
double-sided with a little sheen. See `pottedPlant`.

### Soft things

Cushions, pillows, bean bags and puffy icons: a rounded box or an extruded outline, then `inflate` and `squash`.
For fabric use `fabric` or `linen` for the grain and `sheen` 0.4–0.8. Clay and toy looks: `puffy` shapes (a
heart, a star, a cloud) are already inflated extrusions.

### Liquids and fills

Coffee in a cup, jam in a jar, soap in a bottle: a lathe inside the container, 1–2 mm smaller than the inner
wall, with a flat top at the fill line. Give the surface a canvas texture (crema, latte art) or a clearcoat.
Liquids behind glass look right only on a backdrop (the glass must refract something): still mode with the
`glass` studio.

### Labels and prints

Wrap a label on a cylinder with `CylinderGeometry(r + 0.004, r + 0.004, h, 96, 1, true, start, length)` and a
`canvasTexture`. Flat faces get a `PlaneGeometry` 0.001 in front. Fonts in canvas text: load brand fonts with
`FontFace` first. Keep text large enough to survive the final size, or leave it out: blurred fake text looks
worse than none.

## Worked example: a table lamp from scratch

Measure: a table lamp is ~45 cm tall, the base ⌀ 16, the shade ⌀ 30 at the bottom and ⌀ 22 at the top, 20 tall.
```js
import * as THREE from 'three';
import {lathe, roundCorners, spline, tube} from 'w3d/geometry.js';
import * as M from 'w3d/materials.js';

export const settings = {name: 'lamp', mode: 'still', size: [1000, 1250], backdrop: {radial: ['#f7f1e8', '#e9dfd0']}, studio: 'soft', post: {bloom: {strength: 0.3, radius: 1}}};

export default function build() {
  const lamp = new THREE.Group();
  // base: a turned ceramic foot (profile bottom → top, rounded)
  lamp.add(new THREE.Mesh(lathe(roundCorners([[0, 0], [0.8, 0], [0.78, 0.12], [0.35, 0.3], [0.12, 0.45], [0.1, 0.5], [0, 0.5]], [0, 0.03, 0.05, 0.1, 0.05, 0.01, 0])), M.ceramic({color: 0x5b7c6f})));
  // stem: a brass tube with a slight curve
  lamp.add(new THREE.Mesh(tube([[0, 0.45, 0], [0.02, 1.6, 0], [0, 2.75, 0]].map(p => new THREE.Vector3(...p)), 0.035), M.brass()));
  // shade: a thin conical wall of linen (outside up, inside down), open at both ends; lit from inside, so it glows
  const shade = spline([[1.5, 2.4], [1.1, 4.4]], 12), inside = shade.map(([r, y]) => [r - 0.02, y]).reverse();
  const shadeMesh = new THREE.Mesh(lathe([...shade, ...inside, shade[0]], {segments: 200}), M.linen({color: 0xf1e9dc}, {side: THREE.DoubleSide, emissive: new THREE.Color(0xffc27a), emissiveIntensity: 0.16}));
  lamp.add(shadeMesh);
  // bulb: emissive, so it glows with bloom
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.28, 48, 24), M.glow({color: 0xffd9a0, intensity: 2.5}));
  bulb.position.y = 3.0; lamp.add(bulb);
  return [{name: 'lamp', object: lamp}];
}
```
Then draft, look and fix. A shade lit from inside is an emissive surface in a raster render (light does not pass
through it), so tune `emissiveIntensity` and the bloom. Base proportions off? Edit the profile numbers against the
measurements. The file is `assets/examples/lamp.scene.js`.

## Groups, stacks, arrangements, interlocking

- One layer per thing that moves or needs its own image. A cup with its coffee and handle is one layer; the
  saucer is another.
- Stacks: place each object on the one below (`y += thickness`), offset a few mm and rotate each a little.
  Hand-stacked, never CNC-aligned.
- Rounded parts resting on a surface (a bar on a tile, a coin on a card) z-fight where the fillet grazes the
  surface: sink them deeper than their fillet radius, lift them 0.5–1 mm, or give them a flat bottom.
- Groups of 2–4 read best as a triangle: a tall object at the back, the hero in front, a low object leading in.
  Let them overlap; objects that do not touch look like clip art.
- Scale everything from one real reference.
- Interlocking objects (a band through a kettlebell handle, a ring around a finger) cannot be a single paint
  order. Add `holdout: ['kettlebell']` to the band's layer: it is cut out where the kettlebell is in front and
  painted after it. The renderer warns when this is needed ("hide each other").

## What makes it look real

1. **Proportions** from the real object.
2. **Rounded edges everywhere.** Sharp CG edges are the biggest tell.
3. **Imperfection**: offsets of a few mm, small rotations, organic variation, nothing perfectly symmetric.
4. **Contact**: objects touch the floor and each other.
5. **Detail at the right scale**: seams, rims, a camera bump, one or two per object.
6. **Restraint**: two or three well-made objects beat six busy ones.
