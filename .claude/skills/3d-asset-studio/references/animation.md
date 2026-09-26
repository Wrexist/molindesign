# Animation

## Contents
- Two ways to move
- Sequences: settings and CLI
- animate(t): patterns
- Timing and the principles that matter
- Animated models (glTF clips)
- Containers: animated WebP, WebM, MP4, frames
- On the page: autoplay, posters, reduced motion

## Two ways to move

| | CSS choreography of sprites (`layers`) | rendered sequence (`sequence`) |
|---|---|---|
| what moves | whole objects: drop, bounce, pop, float, stack | anything: rotation, opening lids, deforming, camera-like turns, light on moving surfaces |
| size | tiny (one image per object) | frames × pixels (0.3–3 MB) |
| interactivity | triggered on scroll or load, replayable, perfectly sharp | plays like a video; `w3d-spin` can scrub or drag through the frames |
| lighting | fixed per object (a rotating sprite would rotate its light) | correct in every frame |
| use for | web decoration, loaders, section entrances | turntables, product demos, loops, hero animations, social video |

Rule: if the object only translates or scales, use sprites. If it must turn, change or catch moving light,
render a sequence.

## Sequences: settings and CLI

```js
export const settings = {mode: 'sequence', width: 720, sequence: {frames: 48, fps: 24, loop: true}};
```
- `--turntable 60` (or `sequence: {turntable: true, turns: 1}`): everything turns once around its centre under
  fixed lights, so the shadows move correctly. Use 36 frames for a drag player and 60–120 for smooth video.
- **Half a turn is enough for symmetric products** (bottles, jars, cans, vases, turned wood): `turns: 0.5`
  loops seamlessly because the view after 180° is the same. It halves frames, render time and file size at the
  same spin speed. Two-fold symmetry is enough; a label or logo on one side breaks it.
- `--frames <n>` overrides the frame count, and `--video webp,webm,mp4` picks the containers (webp is the
  default).
- Framing is the union of every pose, so nothing leaves the frame and the size is stable. A turntable keeps its
  axis in the middle of the frame, so a shadow to one side does not push the product off-centre
  (`sequence.center: 'content'` centres the content instead). `align` and `margin` work as for stills, also as
  `--set align=[0.6,0.5]`.
- The contact shadow and AO are recomputed per frame. The key light's shadow softness stays constant with
  height, so for big jumps lower `floor.shadow` or soften the key.
- Render cost in software rendering: 3–15 s per frame, mostly fixed per frame, so smaller frames help less than
  expected. Soft keys cost the most (the shadow blur is redone for every pose: `key.softness` 4 is about twice as
  slow as 1.5), then glass, AO and `ss`. Before frame 1, framing renders up to 8 test poses. A 48-frame loop
  takes about 3–12 min; draft with `--frames 8 --width 360` and judge the final look on one full-size frame
  (`--mode still`).

## animate(t): patterns

```js
export function animate({t, frame, frames, seconds, fps, layers, scene, THREE}) { … }
```
`t` runs 0 → 1. With `loop: true` the frame at t = 1 is left out, so frame N would equal frame 0 and the
loop is seamless. Layers are addressed by name. Keep `animate` pure: the pose must depend only on `t`
(frames render out of order while framing).

```js
const TAU = Math.PI * 2;
const ease = {
  inOut: x => (x < 0.5 ? 4 * x ** 3 : 1 - (-2 * x + 2) ** 3 / 2),       // cubic ease in-out
  out: x => 1 - (1 - x) ** 3,
  back: x => 1 + 2.7 * (x - 1) ** 3 + 1.7 * (x - 1) ** 2,             // overshoot, then settle
};
const seg = (t, a, b) => Math.min(1, Math.max(0, (t - a) / (b - a)));  // local 0 → 1 between a and b

// seamless loops: anything periodic in t (sin/cos of TAU·t) returns exactly to its start
layers.logo.position.y = 0.3 + 0.08 * Math.sin(TAU * t);
layers.logo.rotation.y = 0.25 * Math.sin(TAU * t + 0.6);               // a different phase feels alive

// a sequence of beats: lid lifts (0–0.3), holds, drops back (0.6–0.8)
const up = ease.inOut(seg(t, 0, 0.3)) - ease.inOut(seg(t, 0.6, 0.8));
layers.lid.position.y = 1.1 + 0.4 * up; layers.lid.rotation.z = -0.3 * up;

// staggered objects: the same motion, offset per index
['a', 'b', 'c'].forEach((n, i) => { layers[n].position.y = 0.2 * Math.max(0, Math.sin(TAU * (t - i * 0.12))); });

// squash and stretch about the floor contact: see assets/examples/bounce.scene.js
```
- Pivot where the motion happens: translate geometry so its origin is at the hinge (a lid's back edge) or the
  contact point (a ball's bottom), or wrap it in a Group positioned at the pivot.
- "Camera" moves: turn or move the objects, not the camera. The framing is fixed for the whole sequence.
- Swapping things mid-sequence (a colour change, a label) is fine; `visible = false` hides a part.

## Timing and the principles that matter

- **Ease in and out**: nothing real starts or stops instantly. Use linear only for constant spins (turntables).
- **Squash and stretch** for soft or bouncy things (balls, clay, cartoon), none for rigid things (a phone does
  not squash).
- **Anticipation and follow-through**: a small dip before a jump, a small overshoot after a stop (`ease.back`).
- **Arcs**: things move along curves; offset rotation against translation.
- **Overlap**: parts start and stop at slightly different times (a lid, then its knob).
- **Durations**: a hover loop 3–6 s; a turntable 4–8 s per turn for products (faster reads as cheap); a
  bounce 0.6–1 s; UI-ish entrances 0.4–0.8 s.
- **fps**: 24–30 for video; 12–15 is fine for an animated WebP turntable in a small box (and half the size).

## Animated models (glTF clips)

Imported models keep their animations (`model.userData.animations`). Pose them per frame with
`poseAt(model, clip, seconds)`:
```js
import {loadModel, poseAt} from 'w3d/models.js';
let robot;
export default async function build() { robot = await loadModel(new URL('./robot.glb', import.meta.url).href, {height: '40cm'}); return [{name: 'robot', object: robot}]; }
export function animate({t}) { const d = robot.userData.animations[0].duration; poseAt(robot, 0, t * d); }
```
Set `sequence.frames = round(duration × fps)` so the clip loops exactly.

## Containers: animated WebP, WebM, MP4, frames

| container | alpha | plays in | notes |
|---|---|---|---|
| animated WebP (`<name>.webp`) | yes | every modern browser, as an `<img>` | the default: no controls, autoplays and loops; larger than video per frame |
| WebM VP9 (system ffmpeg) | yes | Chrome, Edge, Firefox | Safari plays WebM but not its alpha; give Safari the animated WebP or an MP4 |
| WebM VP8 (Playwright's ffmpeg) | no | Chrome, Edge, Firefox, Safari 16+ | flattened on `background` |
| MP4 H.264 (system ffmpeg) | no | everywhere, social platforms | flattened on `background`; the right choice for Instagram, LinkedIn, slides |
| frames (`frames/000.webp …`) | yes | the `w3d-spin` player | drag to turn, scroll-scrub, or auto-turn |

Without a system ffmpeg the kit uses Playwright's bundled one (WebM VP8 only). Install ffmpeg (`brew install
ffmpeg`, `apt install ffmpeg`) for VP9 with alpha and MP4. A GIF is almost never the right answer (256 colours,
large). Use an animated WebP instead.

Colours match across containers: the videos are converted to video range and tagged (BT.601 matrix, sRGB
transfer), so a WebM or MP4 plays in the same colours as the WebP frames. Smooth pastel gradients can show
faint steps in lossy WebP and video (below 0.5 ΔL*, invisible at page size); `post.grain` does not survive the
encoders. Where it matters, raise `--quality` or keep the gradient in CSS behind a transparent render (opaque
objects only: glass needs its backdrop in the render).

## On the page: autoplay, posters, reduced motion

```html
<!-- animated WebP: simplest, alpha, no JS -->
<img src="/assets/spin/spin.webp" width="720" height="560" alt="" loading="lazy" decoding="async">

<!-- video: muted + playsinline are required for autoplay on phones; poster = frame 0 -->
<video src="/assets/spin/spin.webm" poster="/assets/spin/frames/000.webp" width="720" height="560" autoplay muted loop playsinline preload="none"></video>
```
- `snippet.html` in the preview folder has the exact markup for the render.
- Reduced motion: show frame 0 instead of the animation.
  ```html
  <picture><source srcset="/assets/spin/frames/000.webp" media="(prefers-reduced-motion: reduce)"><img src="/assets/spin/spin.webp" alt=""></picture>
  ```
  For `<video>`, skip `autoplay` and call `play()` only when `matchMedia('(prefers-reduced-motion: reduce)')`
  does not match.
- Below the fold, load lazily (`loading="lazy"`, `preload="none"`). Do not autoplay several heavy loops on one
  screen.
