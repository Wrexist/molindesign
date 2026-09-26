# Troubleshooting

Run `node scripts/check-env.mjs` first. It tests Node, Playwright, Chromium, WebGL and three.js and prints
the exact fix for each.

## Environment and speed

| message / symptom | cause and fix |
|---|---|
| `Playwright is not installed` | `npm i -D playwright-core` (uses an installed Chrome) or `npm i -D playwright && npx playwright install chromium`. A global install works too. |
| `could not start Chromium` | `npx playwright install chromium`, or `--browser "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"` (any Chrome ≥ 115). |
| `one-time setup: installing …` fails | The pinned three.js packages come from the npm registry once. Offline: install `three@0.170.0` anywhere and pass `--three <dir>/node_modules/three` (booleans and path tracing then need their packages too). |
| WebGL fails, blank frame | The kit uses SwiftShader (software WebGL). If a sandbox blocks it, try `--browser` with a full Chrome instead of the headless shell. |
| requests to localhost refused, proxy errors | Not used: files reach the page from a fake origin (`http://w3d.local/fs/…`) inside Playwright, so no server, port or `file://` is involved. |
| slow (minutes) | Run renders one after another: parallel renders share the CPU (three at once took ~80 s each against ~12 s alone). Software rendering scales with pixels × passes. Iterate with `--draft`; use `ss: 1` or a smaller `width` for big scenes; icons render one by one, sequences frame by frame. A busy machine can double the times. `--gpu` helps where a GPU exists. |
| `Timeout … exceeded` | `--timeout 1800` for large sequences, or split the work (fewer frames, smaller width). |
| `path tracing needs a GPU` | Correct: in software the path tracer cannot finish. Render the raster still (studio `glass` for glass) or run where a GPU is available. |

## Scene errors

| symptom | fix |
|---|---|
| `scene failed:` with a stack | A JavaScript error in the scene module; the line numbers refer to your file. |
| `Failed to resolve module specifier` | Only `three`, `three/addons/…`, `three-mesh-bvh`, `three-bvh-csg` and `w3d/…` are mapped; import other files by relative path (`./parts.js`). |
| a texture, SVG, font or model does not load | Build URLs from the module: `new URL('./logo.svg', import.meta.url)`. Plain relative strings resolve against the stage page. |
| `Cannot load ".xyz" models` | Supported: glb gltf obj fbx stl ply 3mf dae usdz vox. Export glTF from the authoring tool. |
| `Layer "x" has no geometry`, `contains no geometry` | The object or file is empty, or everything in it is hidden. |
| `objects reach … below the floor` | Something sinks into y < 0: `onFloor(object)` or raise it. Intentional hovering only prints a note. |
| `Nothing visible` | The camera looks away, the objects are far too small or large (1 unit = 10 cm), or every material is transparent. |
| `The camera is inside the objects` | Raise `camera.distance`. |
| renders differ run to run | `Math.random()` somewhere: use `rng(seed)`. |
| `Unknown look` / `Unknown studio preset` / `Unknown mode` | The message lists the valid names. |

## Look

| symptom | fix |
|---|---|
| plasticky, CG, too perfect | rounder edges, grain, imperfection (materials-lighting.md has the full table) |
| colours paler than the brand | `M.swatch(hex)`; slightly less saturation |
| glass looks like milky plastic | render it on its backdrop with `studio: 'glass'`; lower `frost` |
| metal brown, grey or dull | `envMap: 'softbox'`; turn the object so a face catches a softbox |
| two shadows under a hovering object | `studio: 'top'`, or `contact: false` |
| dotted lines where two surfaces nearly touch (z-fighting) | surfaces < ~0.5 mm apart seen edge-on: leave a gap, or `polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1` on the inner part's material (a factor of 2 already hides real detail) |
| dotted or pale patches on thin parts | shadow acne: give the part thickness, or `shadowSide: THREE.BackSide` |
| hard seams or faceting on small bevels | use `creased()` (size-aware welding) rather than three's `toCreasedNormals`, which welds on a fixed 1 mm grid |
| a bevel notches sharp tips of a logo | lower `bevel` in `extrudeSVG`, or simplify very thin parts of the SVG |
| an imported model is dark, flat or plastic | inspect it; replace materials with presets (importing.md) |
| a dark liquid or screen mirrors the studio (reads grey) | lower its `material.envMapIntensity` (0.2–0.4) |
| low-poly collapses thin parts | lower `lookOptions.cell`, or keep a mesh intact: `mesh.userData.w3dKeepDetail = true` |

## Layers and the rebuild check

`sheet.png` shows the beauty render, every layer on a checkerboard and a heat map of layers vs render.

| warning / heat map | meaning and fix |
|---|---|
| `"a" and "b" hide each other` | Interlocking objects. Add `holdout: ['a']` to b's layer, or move them apart. |
| red area on one object | A paint-order conflict, or a shadow falling on a layer painted in front of its caster. Check `order` in meta.json; set `settings.order` explicitly if the automatic order is wrong. |
| faint red rings on the floor, stacks | Soft shadows of layers overlapping (VSM). Harmless below a mean of ~0.5/255. |
| `WebP shifts colour at saturated edges` (a note) | Lossy WebP stores colour at half resolution; no quality setting changes it and it is invisible at page size. `--png` if colour must be exact. |
| `WebP compression is visible` (a warning) | Real brightness error, usually very fine grain: `--quality 0.95`, `--png` for small sprites, or a slightly coarser grain `scale`. |
| mismatch behind glass | Expected: glass refracts neighbours in the render, but its own layer cannot. |
| `is completely hidden` | A layer never shows: remove it or change the camera. |

## Exports and imports

| symptom | fix |
|---|---|
| a model is 10× too big or small elsewhere | Exports are real size (glTF/USDZ/OBJ metres, STL mm). Imports need `units` or a `height` when the file has no units (OBJ, PLY). |
| STL lies on its side in the slicer | STL exports are Z-up already; for imports use `up: 'z'` (the default for STL). |
| GLB lacks the grain or looks smoother | Procedural grain is render-time only; exports carry plain PBR. |
| USDZ missing textures in Quick Look | Keep textures as images or canvases (no procedural shaders); test on an iPhone. |
| leaves or paper vanish from behind in AR | USDZ has no double-sided surfaces. Exports from this kit add back faces automatically; for other files, give thin parts two sides in Blender (Solidify) or re-export through `convert.mjs`. |
| Draco / Meshopt GLB fails to load elsewhere | The viewer needs the decoder: `<model-viewer>` and `w3d-viewer` include it; other tools may not. |

## On the page

| symptom | fix |
|---|---|
| stage has zero height | `.w3d` needs a width (its children are absolutely positioned), and w3d.css must be loaded. |
| layers misaligned or stretched | A global `img` rule (height, max-width, object-fit) or a transform on an ancestor: scope it away from `.w3d`. |
| nothing plays | w3d.js not loaded or not started (`data-auto`, or `window.w3d.init()`), or `data-play` missing; with reduced motion it is static by design. |
| plays before it is visible | `data-play="load"` was used; use `view` below the fold. |
| flash of the final state, then the entrance | Add `<html class="w3d-js">` early in `<head>`, or bind in a layout effect (W3D.jsx does). |
| drops look different on each layer | Custom keyframes with `translate(%)`: use `cqw` or px. |
| idle restarts the entrance | Something swaps `animation-name`; freeze with `animation: none` instead. |
| live viewer stays on the poster | The import map for `three` is missing or blocked (check the console), or `src` 404s. |
| live viewer drains the battery | One live canvas per screen, no auto-rotate, pixel ratio ≤ 2; the viewer stops drawing when idle. |
