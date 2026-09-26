# Live 3D on the web

## Contents
- Live or rendered?
- The assets: GLB, USDZ, poster
- `<model-viewer>`: product viewers and AR
- `w3d-viewer`: a light viewer with the studio look
- React Three Fiber
- Budgets and performance
- Accessibility

## Live or rendered?

Go live only when the visitor must **control** the object: turn it, zoom in, switch colours, open it, or place it
in their room (AR). Everything else (decoration, entrances, turntables, heroes) is better rendered. Rendered
images have no JavaScript or GPU cost, look identical everywhere, and are sharper. A live scene costs 150–600 kB
of JavaScript plus the model, GPU time and battery, and needs a fallback.

A good pattern for both: render a poster still with this kit, and load the live viewer only on interaction or
when it scrolls into view.

## The assets: GLB, USDZ, poster

```bash
node <skill>/scripts/render.mjs product.scene.js --out public/3d --mode still --size 1200x1200 --export glb,usdz
npx @gltf-transform/cli optimize public/3d/product.glb public/3d/product.glb --compress meshopt --texture-compress webp
```
- GLB for the web and Android AR, USDZ for iOS AR Quick Look. Both come out at real size (metres), so AR places
  the object at its true scale.
- The poster is the still: the same object, camera and light, and it shows instantly.
- Materials export as plain PBR. Procedural grain is a render-time effect and does not travel, so give live models
  real textures if the grain matters, or accept a smoother look.

## `<model-viewer>`: product viewers and AR

Google's `<model-viewer>` web component is the robust default: camera controls, lazy loading, a poster,
AR on iOS and Android, accessibility and many tested edge cases.
```html
<script type="module" src="https://cdn.jsdelivr.net/npm/@google/model-viewer@4/dist/model-viewer.min.js"></script>
<model-viewer src="/3d/product.glb" ios-src="/3d/product.usdz" poster="/3d/product.webp" alt="Stoneware mug, sage glaze"
  camera-controls auto-rotate auto-rotate-delay="1500" rotation-per-second="18deg" interaction-prompt="none"
  shadow-intensity="0.9" shadow-softness="0.8" environment-image="neutral" exposure="1"
  camera-orbit="-30deg 75deg 105%" loading="lazy" reveal="auto" ar ar-modes="webxr scene-viewer quick-look"
  style="width: 100%; aspect-ratio: 1; background: transparent; --poster-color: transparent"></model-viewer>
```
- `camera-orbit="azimuth polar radius"`: polar 75deg = 15° above the horizon, matching the kit's default
  elevation.
- `environment-image` takes "neutral" or an `.hdr` URL (Poly Haven HDRIs). `tone-mapping="neutral"` matches the kit.
- Colour variants: `modelViewer.model.materials[i].pbrMetallicRoughness.setBaseColorFactor([r, g, b, 1])`, or
  `variant-name` for glTF material variants.
- Hotspots: `<button slot="hotspot-1" data-position="0 0.1 0" data-normal="0 1 0">…</button>`.
- Reduced motion: remove `auto-rotate` when `matchMedia('(prefers-reduced-motion: reduce)')` matches.
- Self-host the script for production (`npm i @google/model-viewer`).

## `w3d-viewer`: a light viewer with the studio look

`assets/live/w3d-viewer.js` is a ~200-line custom element for one GLB. It shows the poster at once and loads
three.js only near the viewport. It gives studio environment light, a soft VSM shadow, drag-to-turn and optional
auto-rotate. It stops drawing when idle or off screen, respects reduced motion, and needs no build step. It has
no AR, so use `<model-viewer>` for that.
```html
<script type="importmap">{"imports": {
  "three": "https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js",
  "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/"}}</script>
<script type="module" src="/js/w3d-viewer.js"></script>
<w3d-viewer src="/3d/product.glb" poster="/3d/product.webp" alt="Stoneware mug" auto-rotate style="width: 100%; aspect-ratio: 4/3"></w3d-viewer>
```
Attributes: `src`, `poster`, `alt`, `auto-rotate`, `camera-orbit="azimuth elevation"` (degrees, default "20 18"),
`exposure`, `shadow` (0–1, default 0.5), `environment` ("studio" or an `.hdr` URL), `fov`, `no-zoom`. It fires
`load` when the model is shown. Bundlers: install `three@0.170.0` and import the file; the import map is then not
needed. It is tested headless (Draco GLB, auto-rotate, reduced motion, a single render loop that stops when
idle).

## React Three Fiber

For React sites that already use it, or need custom interaction:
```jsx
import * as THREE from 'three';
import {Canvas} from '@react-three/fiber';
import {useGLTF, Environment, ContactShadows, OrbitControls, Bounds} from '@react-three/drei';
import {Suspense} from 'react';

function Model(props) { const {scene} = useGLTF('/3d/product.glb'); return <primitive object={scene} {...props} />; }

export default function Product() {
  const still = typeof window !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  return (
    <div style={{position: 'relative', aspectRatio: '1'}}>
      <img src="/3d/product.webp" alt="Stoneware mug" style={{position: 'absolute', inset: 0, width: '100%'}} />
      <Canvas dpr={[1, 2]} camera={{fov: 30, position: [0.3, 0.15, 0.5]}} gl={{toneMapping: THREE.NeutralToneMapping}}>
        <Suspense fallback={null}>
          <Bounds fit clip observe margin={1.25}><Model /></Bounds>   {/* frames the model whatever its size */}
          <Environment preset="studio" />
          <ContactShadows opacity={0.45} blur={2.4} scale={0.4} far={0.2} />  {/* scale ≈ 2–4× the footprint, in metres */}
        </Suspense>
        <OrbitControls autoRotate={!still} autoRotateSpeed={0.8} enablePan={false} makeDefault />
      </Canvas>
    </div>
  );
}
useGLTF.preload('/3d/product.glb');
```
The GLB is in metres (a 9.5 cm mug is 0.095 tall); `<Bounds>` frames it anyway. Without auto-rotate, add
`frameloop="demand"` to the Canvas so it renders only when something changes.

## Budgets and performance

| item | budget |
|---|---|
| triangles | hero product < 100k, a background object < 20k |
| textures | ≤ 2048 px, WebP or KTX2 (gltf-transform `--texture-compress`) |
| draw calls | < 50 (join meshes: gltf-transform `optimize` does) |
| GLB size | < 1 MB ideal, < 3 MB max for a product page |
| JavaScript | three.js core is about 170 kB gzipped; `<model-viewer>` about 250 kB gzipped |
| pixels | cap the device pixel ratio at 2; one live canvas per screen |

Load late (on interaction or when it scrolls near), show the poster first, pause when off screen, never
auto-rotate with reduced motion, and test on a mid-range phone. A 60 fps desktop is no proof.

## Accessibility

Give the viewer a meaningful `alt` (both components set `role="img"` and the label). Keep information out of the
3D-only view: anything important (dimensions, colours, features) also belongs in text. Provide the poster
without JavaScript. Do not hijack page scroll: horizontal drags turn the model, vertical swipes scroll the page
(`touch-action: pan-y`, which both components use).
