---
name: scissor-view-webgl-slots
description: Put several small 3D models/scenes into a normal DOM page with ONE fixed WebGL canvas - each DOM element is a "slot", the renderer sets scissor+viewport to that element's rect every frame, ScrollTrigger progress drives model rotation, and a pixel-matched perspective camera keeps CSS and 3D aligned. Includes a no-WebGL alternative (iventions.com) - a GSAP-scrubbed clip-path "spotlight beam" with a goo SVG filter. Use for portfolios/agency sites that want 3D objects inside a scrolling GSAP layout. Sources - minhpham.design (Three.js + GLTF, app.bundle.js) and iventions.com (clip-path, verified NOT WebGL).
---

# DOM-slot WebGL views (minhpham.design)

## Architecture (verified)
- One `<canvas class="three-app">` appended to body: `position:fixed; inset:0; width:100vw; height:100vh; pointer-events:none; touch-action:pan-y`. Single `WebGLRenderer`, `setScissorTest(true)`, `setPixelRatio(dpr)` (cap at 2 - inference), `toneMapping = ACESFilmic`, `toneMappingExposure = 0.5`, PMREM environment from a neutral room (`PMREMGenerator.fromScene(new RoomEnvironment())`), tone/encoding set once.
- Pixel-matched camera: `perspective = 100; camera.position.z = perspective; fov = 2*atan(height/2/perspective)*180/PI` (recompute on resize) so 1 world unit ~ 1 CSS px at z=0.
- Each 3D item is a class holding its own `Scene`, `PerspectiveCamera(45, aspect, .1, 5)` at `(0,0,2)` looking at origin, its own lights, and the DOM element it lives in. It pushes `render()` into a shared `renderList`. The main loop clears the whole canvas (`setScissorTest(false); setClearColor(color, 0); clear(); setScissorTest(true)`) then calls every render fn.

## Per-slot render (exact logic)
```js
render() {
  if (!this.isInview) return;                                   // toggled by ScrollTrigger onToggle
  const r = this.el.getBoundingClientRect();
  const y = renderer.domElement.clientHeight - r.bottom;        // GL origin is bottom-left
  renderer.setScissor(r.left, y, r.width, r.height);
  renderer.setViewport(r.left, y, r.width, r.height);
  this.camera.aspect = r.width / r.height; this.camera.updateProjectionMatrix();
  renderer.render(this.scene, this.camera);
}
```
`isInview` = `ScrollTrigger.create({ trigger: section, onToggle: s => this.isInview = s.isActive })`. Because the rect is read live each frame, it follows Lenis/ScrollTrigger movement with no extra sync. Lazy-load the GLTF (Draco/min gltf) and only then push to `renderList`.

## Scroll-linked rotation (values from site)
```js
ScrollTrigger.create({ trigger: aboutSection, onToggle: s => inview = s.isActive,
  onUpdate: s => { mesh.rotation.x = map(s.progress,0,1, 0,1.5); mesh.rotation.y = map(s.progress,0,1, 0,2); } });
```
Other slots on the site: globe `rotation.y = map(progress,0,1,-2,-0.8)`; a second model `rotation.z .5->1, x -.25->1, y -.5->0`. Model scale set from a per-model constant (`.02` for a raw GLB; `1.7` mobile / `1.9` desktop for the globe); globe materials forced `metalness 0, roughness .75`. Lights per slot: `DirectionalLight(0xffffff, 5)` at `(1,.5,-.5)` or `10-12` strength at `(1,.08,-.05)` + `HemisphereLight(0xffffff, ..., 20)`, `scene.fog = new Fog(0x0d0d0d, 0, 3)`, `scene.environment = neutralEnv` (lights are strong because exposure is .5 and physically-based units are used).

## Mouse and cursor smoothing
Normalized mouse `x = cx/w*2-1`, `y = -cy/h*2+1` stored for shaders/tilt. Custom DOM cursor uses frame-rate-independent lerp: `k = 1 - Math.pow(.001, dt)`; `pos = pos + (target-pos)*k`, written to CSS vars `--x/--y/--opacity` (no per-frame style thrash); fade in `power3.out .6s`, out `.3s`.

## Teardown and lifecycle
On page leave: remove scene children, `geometry.dispose()` + `material.dispose()` for every mesh, cancel the rAF (after ~150ms), clear `renderList`. Pause rendering when no slot is in view (skip RAF or early-out). Page uses one renderer across route changes - do not recreate the context.

## Accessibility / fallback
- Canvas is decorative: `aria-hidden="true"`, content (titles, links) stays in DOM above/around it. Provide a still `<img>` poster in the slot for `prefers-reduced-motion`, `saveData`, no-WebGL (`!canvas.getContext('webgl2')`) and coarse-pointer low-power devices. Under reduced motion: render once, no scroll-linked rotation.
- Never put interactive content only in 3D; `pointer-events:none` on the canvas.
- Honour `devicePixelRatio` cap and pause on `document.hidden`.

## No-WebGL alternative: scrubbed clip-path spotlight beam (iventions.com)
Despite the "spotlight" branding, iventions.com ships no Three.js (no WebGLRenderer/SpotLight in any chunk). The beam is CSS:
- Beam: element with `clip-path: polygon(49% 0, 51% 0, var(--poLeft) 100%, var(--poRight) 100%)` (default `--poLeft:75%; --poRight:25%`) i.e. a light cone widening downward; a larger wrapper has `filter: url(#goo)` where `#goo` = `feGaussianBlur stdDeviation=20` + `feColorMatrix values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 30 -15"` for a soft gooey edge. Size `max(110vw,110vh)` square, centered via translate(-50%,-50%), `will-change:transform`.
- Reveal polygons (verified strings): start `polygon(0% 50%, 110% 50%, 0% 50%, 0% 100%, 0% 0%)`; mid `polygon(40% 0%, 110% 50%, 40% 100%, 0% 100%, 0% 0%)`; end `polygon(100% 0%, 110% 50%, 100% 100%, 0% 100%, 0% 0%)`. All have the same vertex count so GSAP can tween between them.
```js
const tl = gsap.timeline({ paused: true });
[ 'polygon(0% 0%,110% 50%,0% 100%,0% 100%,0% 0%)', mid, end ].forEach(c => tl.to(el, { clipPath: c, ease: 'linear', duration: 1 }));
ScrollTrigger.create({ trigger: zone, start: 'top+=50% center+=25%', end: 'bottom-=50% top-=100%', scrub: true, animation: tl });
```
Content swap gates on progress inside `onUpdate` (e.g. `>= .075` show label, `>= .5` show CTA with `opacity/yPercent 50->0, 1.2s power3.out`). Desktop only (`md` up, `300vh` tall zone with a sticky 100vh stage); below that, render plain stacked content. Hover reveal of a CTA panel: `clipPath: polygon(35% 0%, 65% 0%, 100% 100%, 0% 100%)` from `polygon(50% 0% 50% 0% 50% 100% 50% 100%)` (a vertical sliver opening into a trapezoid).
Reduced motion: set the end polygon directly, no scrub.

## Rules / don'ts
- One canvas, one renderer, many scissor views - never one canvas per card (context limit, jank).
- Read `getBoundingClientRect` once per slot per frame; no layout writes in between.
- Keep clip-path keyframes with identical vertex counts; `filter:url(#goo)` is expensive - apply to one element only, not full-page.
- The iventions "Three.js spotlight lighting" claim was NOT found in source; don't attribute 3D lighting to it.
