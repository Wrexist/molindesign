---
name: gpu-renderer-fallback-warmup
description: Robust boot sequence for a heavy WebGPU/WebGL scene — pick WebGPU else WebGL2 with a device-based downgrade, optionally move rendering to an OffscreenCanvas worker, cap DPR, shrink textures, cheapen CSS effects on the WebGL path, then "warm up" every scene state for a few hidden frames before dropping the loader so the first scroll never janks. Use for any Three.js/TSL cinematic site with several scenes and expensive shaders. From brand.ivress.co.jp (IVRESS "Spin a Tale"); verified in its shipped bundles.
---

# GPU renderer fallback + shader warm-up

All numbers below were read from the IVRESS bundles (`CommonScripts…js`, `renderer…js`, `loader…js`). Items marked (inference) were not directly confirmed.

## 1. Renderer selection (exact logic)
```js
const ua = navigator.userAgent;
const isIOS = /iPhone|iPad|iPod/i.test(ua) || (/Macintosh/.test(ua) && 'ontouchend' in document); // iPadOS reports as Mac
const isMobile = isIOS || /android/i.test(ua);
const lowCores = isIOS && (!navigator.hardwareConcurrency || navigator.hardwareConcurrency <= 4);

let useWebGPU = navigator.gpu !== undefined;
if (useWebGPU && lowCores) useWebGPU = false;          // weak iPhones: skip WebGPU entirely

const canvas = document.createElement('canvas');        // create ONE canvas up front
const ctx = canvas.getContext(useWebGPU ? 'webgpu' : 'webgl2');
if (!useWebGPU && isMobile) document.body.classList.add('webgl-mobile'); // CSS hook, see §4
```
- Feature-detect only `navigator.gpu !== undefined`; the site does not await `requestAdapter()` itself (three's `WebGPURenderer` does that and, with `forceWebGL: !isWebGPU`, falls back internally). Safer in your build: `const ok = navigator.gpu && await navigator.gpu.requestAdapter();`.
- Renderer: `new WebGPURenderer({ canvas, antialias:true, alpha:true, powerPreference:'high-performance', forceWebGL: !useWebGPU })` — one code path (TSL node materials) for both backends; `forceWebGL` just flips the backend.
- Heavy compute (particles) must be written for both: IVRESS uses TSL `compute()` for GPU particles (55 000 stars desktop / 41 250 mobile; 10 000 / 7 500 flow particles). Reduce counts ~25% on mobile.
- `?hd=true` sets DPR 2, default is **DPR 1** (`dpr = Math.min(S.dpr, devicePixelRatio)`) — render the film at 1x and let CSS upscale; film grain hides it. Offer a `?hd` query for stills/capture.

## 2. Optional OffscreenCanvas worker
```js
let off = 'transferControlToOffscreen' in HTMLCanvasElement.prototype;
if (isSafari || isIOS) off = (parseInt(ua.match(/version\/(\d+)/i)?.[1] ?? 0) >= 17) && off; // Safari < 17: no
if (off) { const w = new Worker(new URL('./offscreen.js', import.meta.url), {type:'module'});
  const oc = canvas.transferControlToOffscreen(); w.postMessage({canvas: oc, webgpu: useWebGPU}, [oc]); }
```
- Forward pointer/wheel/resize events to the worker as plain objects (clientX/Y, deltaY, pointerType, pressure…) — DOM events can't cross. IVRESS keeps an event bus (`on/trigger`) so the same site code runs main-thread or worker.
- Default in IVRESS is `offscreen:false` (flag exists, not switched on) — treat the worker as an opt-in for pages whose main thread is busy with DOM/Lenis. Don't enable it for debugging (stats/GUI need the main thread).

## 3. Warm-up pass (the best idea here)
Pipelines compile on first draw, so scene 4's shader would hitch mid-scroll. Instead, while the loader is still up, force-render every state:
```js
warmupFramesPerSection = 3; warmupTotalSections = 6; warmupOverlayFrames = 3;
// each frame while warmupPhase:
//   at frame 0 of section i: zero all section-progress uniforms, set progress[i] = 0.5, currentIndex = i
//   temporarily set frustumCulled=false on every culled mesh so its pipeline is built, render, restore
//   after 3 frames -> next section; after the last, 3 frames of the overlay scene with progress 0.8
// complete: restore original progress, activate section 0, then (rAF → rAF → microtask):
//   emit 'compileEnd' → 'renderedReady' → 'reveal'
```
- Loader shows real asset progress (`loaded/total*100`, capped to `99` until `compileEnd`), then `100%`, then `#loader.fade-out` (`opacity .8s ease`), then `display:none`. The "100" is only shown after warm-up, so it is honest.
- Hold the render loop until `assetsLoaded`; do nothing in `onRaf` before that.
- Downscale oversized textures before upload: draw to `new OffscreenCanvas(w',h')` with `w' = w*max/maxSide`, `transferToImageBitmap()`, set `generateMipmaps=false`, `minFilter=Linear`, and `close()` the source bitmap (loader.js does this per map slot: map/normal/roughness/metalness/emissive/ao/alpha/bump/light; on mobile it can drop normal+roughness maps entirely).

## 4. Cheaper CSS on the WebGL/mobile path
`body.webgl-mobile` removes every `filter: blur()` from text reveals (animating blur costs a compositor pass over a busy WebGL canvas) and lengthens the opacity transition instead (`3s` vs `1.4s`), keeping only `opacity`+`transform`. Do the same: `will-change: opacity, filter, transform` on desktop, `opacity, transform` on the fallback.

## 5. Post stack defaults (from the renderer params)
`bloom {threshold 0, strength .012, radius .21}`, exposure 1, exponential fog density `.0041`, film grain `{intensity .5, scale 1.8, speed 30, response .85}` (grain strength is modulated by luminance: `1 - luma` mixed by `response`, so darks get more grain), scanlines off (`0`, freq 900). Subtle on purpose — bloom strength is ~1%.

## Rules
- One canvas, one node-material code path; never maintain a separate GLSL fallback scene.
- Provide a no-JS/poster fallback and a *static* path for `prefers-reduced-motion` (the IVRESS bundles contain **no** reduced-motion handling — don't copy that gap): show a still frame + chapter text, no autoplay camera, no grain animation.
- Warm-up must run behind an opaque loader; never run it on a visible canvas.
- Keep the loader accessible: `role="progressbar" aria-valuemin=0 aria-valuemax=100 aria-valuenow` updated with the number.
- Always `try/catch` the init and log; on failure remove the loader and show the static poster.
