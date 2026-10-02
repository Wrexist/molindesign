---
name: physics-on-flat-art
description: Give 2D illustration panels/objects mass — a 2D rigid-body engine (Matter.js) runs invisibly beside a WebGL/DOM scene, each body drives a mesh/element transform, gravity is fed by scroll velocity and pointer velocity, pieces can be grabbed and thrown with a soft mouse constraint, walls track the viewport. Also covers the album-track chapter framing (cover, "NN:MM" timecode, "next track"). Use for playful brand/music/comic sites where flat art should feel like physical cut-outs. From ponpon-mania.com (values read from its bundle).
---

# Physics on flat art

Verified in the ponpon-mania.com Nuxt bundle: Matter.js (full lib inlined), GSAP + ScrollTrigger + Lenis, a WebGL scene using an orthographic camera and `Transform`/`Camera`/`RenderTarget`-style classes. Whether the renderer is literally OGL is **inferred** from API shape (`camera.orthographic()`, `addChild`, `lookAt`, uniform objects); the string "ogl" is not in the bundle. The technique works the same with any renderer or plain DOM.

## Architecture (as found)
- One physics wrapper owns `Engine.create({ constraintIterations: 3 })` and `engine.enableSleeping = true` (resting pieces cost nothing). Bodies are added once (`_added` flag), meshes never own physics.
- **Entity = { mesh, body }.** Every frame after `Engine.update(engine, dt)`: `mesh.x = body.position.x; mesh.y = -body.position.y; mesh.rotation.z = -body.angle % (2π)`. Physics Y points down from the top of the page; the ortho camera is `top:0, bottom:-H, left:-W/2, right:W/2`, hence the sign flips and x measured from viewport centre.
- **Only simulate and render while the scene matters**: the scene updates physics only when `viewportOutProgress < .75 || needsUpdate` (i.e. when still on screen). Do the same with `IntersectionObserver`.
- Debug view: Matter's own `Render` onto a 30 %-opacity canvas behind a `?physics` query flag. Keep one.

## Numbers
| What | Value |
|---|---|
| Panel/cut-out body | `restitution .4, friction .5` (rectangles sized to the sprite, 100–200 px in the demo scene) |
| Walls/ground | static rectangles, `restitution .3`; ground centred at `y = H + 50`; side walls `100` px outside viewport (`x = ±(W/2 + 100)`), height `H*10`, centred `y = 2H` |
| Ragdoll limbs | `friction 0, restitution .2, frictionAir .004, slop .01`, `chamfer` radius 12–25 px, joints `stiffness .4` (loose) / `1` (rigid); every limb `collisionFilter.group = Body.nextGroup(true)` so limbs don't collide with each other |
| Grab | `MouseConstraint` `{ stiffness .1, damping .01, length 20 }` on `document.body` |
| Gravity (per frame) | `gravity.y = map(outProgress, 0→.6, 1.4→.5) + scrollVelocity * .1` (×.9 on mobile); `gravity.x = pointerVelocityX * .001` |
| Count by width | ponpon count `clamp(map(W, 1400→1920, 11→16))`; swap big/small sprite sets at `W > H \|\| W > 819` |

Matter's `gravity.scale` stays at its default `.001`; the app only changes `gravity.x/y`. So a scroll fling literally tilts and pulls the world — heavy objects, one signal, no extra code per object.

## Skeleton (vanilla)
```js
import Matter from 'matter-js';
const { Engine, Bodies, Body, World, Mouse, MouseConstraint, Events } = Matter;
const engine = Engine.create({ constraintIterations: 3 }); engine.enableSleeping = true;
let walls = [];
function fitWalls() { const W = innerWidth, H = innerHeight;
  World.remove(engine.world, walls);               // rebuild instead of Body.scale chains
  walls = [Bodies.rectangle(W/2, H+50, W*2, 100, { isStatic:true, restitution:.3 }),          // ground
           Bodies.rectangle(-100, H, 100, H*10, { isStatic:true, restitution:.3 }),           // left, 100 px outside
           Bodies.rectangle(W+100, H, 100, H*10, { isStatic:true, restitution:.3 })];         // right
  World.add(engine.world, walls); }
addEventListener('resize', fitWalls); fitWalls(); setTimeout(fitWalls, 1200);  // source re-runs once after 1200 ms

const items = els.map(el => { const r = el.getBoundingClientRect();
  const body = Bodies.rectangle(r.left+r.width/2, r.top+r.height/2, r.width, r.height, { restitution:.4, friction:.5 });
  World.add(engine.world, body); return { el, body, w:r.width, h:r.height }; });

const mc = MouseConstraint.create(engine, { mouse: Mouse.create(document.body), constraint:{ stiffness:.1, damping:.01, length:20 } });
World.add(engine.world, mc);
// Touch: remove Matter's default touch listeners, re-add start as passive and forward move/end ONLY while mc.body is set,
// otherwise the page can't scroll on phones.
Events.on(mc,'startdrag',()=>document.body.classList.add('grabbing'));
Events.on(mc,'enddrag',()=>document.body.classList.remove('grabbing'));

let last = performance.now();
(function tick(t){ requestAnimationFrame(tick); const dt = Math.min(t-last, 1000/30); last = t;
  engine.gravity.y = 0.5 + scrollVelocity*0.1; engine.gravity.x = pointerVx*0.001;
  Engine.update(engine, dt);
  for (const {el,body,w,h} of items) el.style.transform =
    `translate3d(${body.position.x-w/2}px,${body.position.y-h/2}px,0) rotate(${body.angle}rad)`;
})(last);
```
Cursor feedback (found in source): `grab` when `Query.point(grabbableBodies, mouse)` hits, `grabbing` during drag.

## Scroll + physics together
- Lenis config in the source: `smoothWheel:true`, `syncTouch` only on Android, `wheelMultiplier 1.6` for Firefox-on-Windows else 1. `lenis.on('scroll', ScrollTrigger.update)`; `lenis.raf(t*1000)` driven by the **same** ticker as the renderer and physics (one clock). `lenis.velocity` is the `scrollVelocity` above.
- Keyboard added by the site: ArrowDown/`S` → `lenis.scrollTo(scroll + H/2)`, ArrowUp/`W` → `- H/2`. Hash deep-links (`/about#team`) call `lenis.scrollTo(section)`.

## Album-track chapter framing (verified in the chapters chunk)
Chapters are presented as tracks of "PonponMania Vol. I": cover art `/images/album-{n}-sm.jpg`, label `NN.Title` (two-digit index), a **timecode** `"{current}:{next}"` e.g. `03:04`, a "Next track" button with a play-triangle, and titles longer than 20 chars scroll as a linear marquee (10 s loop; the next-title marquee runs 13 s and uses a blinking-char effect). Entrance: `y 200px, scale 0, rotateX -50` → `elastic.out(.2)` over 1 s, then `expo.out` for rotation. Reuse the idea: name chapters like tracks, show `NN:MM` progress, give "next" a single obvious affordance.

## Accessibility and reduced motion
**Not present in the source** (no `prefers-reduced-motion` in its JS or CSS) — add it:
- Reduced motion: do not create the engine; lay items out in their rest positions (final `getBoundingClientRect` layout), disable drag, keep a plain scroll.
- Keep all real content in the DOM (`<h2>`, `<p>`, links) even if panels are also textures; physics layer is `aria-hidden`, `pointer-events:none` except grabbable items.
- Grabbable items need a non-drag alternative if they carry content (links stay real `<a>`). Never trap vertical touch scroll.

## Rules
- Fixed or clamped `dt` (≤ 33 ms) — Matter tunnels with big steps.
- Don't scale static bodies every frame; rebuild walls on resize (the source scales then re-translates and re-runs after 1200 ms; rebuilding is the simpler equivalent — inference).
- Sleep + off-screen pause are what make 10–20 bodies cheap; keep both.
- Tune with the debug canvas, not by eye. Tweak restitution/friction per art style: .2–.4 reads "cardboard", >.7 reads "rubber".
