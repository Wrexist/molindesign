---
name: cursor-mask-reveal
description: "Cursor-as-flashlight reveal — a soft, noise-distorted radius around the pointer that unveils a hidden layer (dim map → fully lit detail), with click-expand, plus companion tricks from hubtown.co.in: a time-driven sweeping scan reveal across a geometric hero monolith, GPGPU particles that repel from the cursor, a pixel-grid dot-matrix loader, and scene-to-scene displacement transitions. Includes a no-WebGL CSS version. Use for architecture/real-estate/product sites with a dark 3D or map stage. From hubtown.co.in (Unseen Studio)."
---

# Cursor mask reveal (+ monolith scan, loader, transitions)

Verified in `hubtown.co.in` `_nuxt/u1ipQrxM.js` (Nuxt + three.js + GSAP + Lenis + Theatre.js). **Correction to the brief**: the hero cube reveal is *time*-driven; the *mouse*-driven reveal is the map-scene composite mask + particle repel. The binary `/webgl/*.glb|ktx2` assets were not downloaded, so geometry itself is not inspected.

## 1. Mouse mask (final composite pass)
Fragment logic (condensed from the `USE_MAP_MASK` block; `uMask` is toggled on in map scenes):
```glsl
vec2 sq = vUv - .5; sq.y *= uResolution.y / uResolution.x;          // aspect-correct
float n  = texture2D(tMaskNoise, sq*uMaskNoiseRepeat + .5).r*2.-1.;  // noise texture
float d  = distance(sq*2., uMouse);                                   // uMouse in same space
d = blendSoftLight(vec3(d), vec3(n), uMaskNoiseStrength).r;           // ragged edge, strength .5
float size = mix(uMaskSize, uMaskClickSize, uMaskAnimationProgress);  // defaults .5 / .5
float feat = mix(uMaskFeather, uMaskClickFeather, uMaskAnimationProgress); // .5 / .5
float a = smoothstep(size+feat, size-feat, d);                        // 1 inside the lens
float disp = .5+.5*sin(texture2D(tMapMask, sq*uMaskRepeat+.5).r*6.2831 + uTime*uMaskShiftSpeed); // speed .5, repeat 2
float m = falloff(disp, 0., 1., 1., a);                               // pattern-modulated mask
color = mix(uMaskColor*color, color, m);                              // uMaskColor = black -> dark outside
```
JS side: `uMouse` = pointer in the same aspect-corrected space (smoothed), `uMaskAnimationProgress` tweened 0→1 on press via GSAP (click-expand), `uMask`/`uMaskSize` tweened during scene transitions. Surrounding composite (verified): vignette strength .842, radius .75, smoothness .25; film noise .19; barrel bend -.174, max distort .449; chromatic aberration off on low-tier GPUs.

### No-WebGL equivalent (adaptation, not from source)
```css
@property --r { syntax:'<length>'; inherits:true; initial-value:18vmax }
.stage{ --mx:50%; --my:50%; --f:10vmax; transition:--r .6s cubic-bezier(0,0,.2,1);
  -webkit-mask-image:radial-gradient(circle at var(--mx) var(--my), #000 calc(var(--r) - var(--f)), transparent calc(var(--r) + var(--f)));
          mask-image:radial-gradient(circle at var(--mx) var(--my), #000 calc(var(--r) - var(--f)), transparent calc(var(--r) + var(--f))); }
.stage-dim{ opacity:.25 } /* underlay = same art darkened; lit layer above has .stage */
```
```js
const lerp=(a,b,t)=>a+(b-a)*t; let tx=50,ty=50,x=50,y=50;
addEventListener('pointermove',e=>{tx=e.clientX/innerWidth*100;ty=e.clientY/innerHeight*100},{passive:true});
(function tick(){x=lerp(x,tx,.12);y=lerp(y,ty,.12);stage.style.setProperty('--mx',x+'%');stage.style.setProperty('--my',y+'%');requestAnimationFrame(tick)})();
addEventListener('pointerdown',()=>stage.style.setProperty('--r','28vmax'));
addEventListener('pointerup',()=>stage.style.setProperty('--r','18vmax'));
```

## 2. Monolith scan reveal (hero cube material)
Not mouse: a **sweeping shell** passes through the cube. In-shader: `revealUV = length(normalizedPos)*4+4; progress = clamp(fract(uTime*uRevealSpeed),0,1) * step(0, sin(uTime*uRevealSpeed*PI)); revealUV -= (progress+.25)*8; revealUV = abs(revealUV); reveal = clamp(pattern - smoothstep(thr.x,thr.y,revealUV), 0, 1)` where `pattern` = hex texture `pow(1-x,2)` smoothed with edge `(0,.6)`; colour mixes toward white at strength 1. `uRevealSpeed .1` → one pass per 10 s, every other half-cycle. Other verified cube params: rotation `-.1` rad/s about Y, vertical bob `sin(t*.7)*.15`, fresnel amount 3.5 / falloff 3.1 / addition 3.6, hairline edge mask thickness .01, grid + AO + details textures, bloom colour `(1.58, 3.17, 4.26)` (cold-blue push), gradient noise scale `(24, 3.35)` speed .25. Takeaway: a thin glowing wavefront plus hairline grid edges on a dark solid reads as "architectural scan". A single white point light sits at the cube's position in the scene.

## 3. Cursor-repel particles (GPGPU)
Position texture ping-pong; per particle: project to screen, `toMouse = screenPos - uMousePos`, `fx = smoothstep(uMouseRadius, 0, |toMouse|)`; `pos.x += toMouse.x*fx*dt*.1*uMouseRepelStrength; pos.z += toMouse.y*fx*...; pos.y += toMouse.y*fx*dt*.1*.25*...` (slight lift); constant rise `uMoveSpeed*dt*.1*rand(.1..0.6)`; `life -= uDecay*dt*.1*(rand*.5+.5)`; reset to origin offsets when `life<0`. Low-tier GPUs drop particles from the water reflection.

## 4. Dot-matrix loader (HTML + SVG + GSAP, reusable)
- Full-screen dark-blue (`bg-dark-blue`) overlay `z-[1000]`, centred 352x40 SVG of pixel-letter cells (8 px cells, 52 px advance, 5x5 grid per glyph) spelling the brand; mono 11 px tracked caps "0%" above, "Loading content" below. Pixel colour `#d5e0ff`.
- Phase 1: an 8 px flash-square scales `3→1` (0.2 s `power2.out`) and blinks 4x (0.05 s in/out). Phase 2: square pairs light up from the outside in (0.033 s stagger, opacity .2); as real `progress` crosses `(i+1)*16.67 %` each pair snaps to opacity 1 (0.3 s `power2.out`). Phase 3 at 100 %: after 1.5 s squares translate by per-square `--dx` (0.5 s `cubic-bezier(.2,0,0,1)`) and morph into glyphs (strokes draw via `stroke-dashoffset 1→0`, 1 s same bezier); "100% Loaded" / "Ready to Explore" scramble in; overlay fades after ~2.6 s.
- Counter is driven by real asset progress, not a fake timer.

## 5. Scene transitions & easing tokens
- Home = 4 WebGL scenes rendered to FBOs; a transition pass mixes `tFromScene→tToScene` through a displacement texture (`uDispAmount .08`, repeat .112, noise repeat 10, shift speed 1.91), `uProgress` 0→1 over **5 s** with ease `joe.out`, while Lenis auto-scrolls to the target (duration 5, `t*(2-t)`). Same-scene nav: 2 s. (Scroll specifics: see `inertial-scroll-ranges`.)
- Easing tokens (Tailwind theme, verified): `joe.out = cubic-bezier(0,0,.2,1)`, `joe.in = cubic-bezier(.8,0,1,1)`; loader uses `cubic-bezier(.2,0,0,1)`. Text uses GSAP ScrambleText (`chars:'upperCase'`, duration 1, ScrollTrigger `start:'top center'`) over an invisible copy of the real text so layout never reflows.
- Map pins: 40 px square frame, 8 px corner pips, centre dot, mono 11 px label chip; GSAP timeline default `duration 1, ease joe.out`: blink 4x → scale 1 → rotate 45° → label offsets 0→position + autoAlpha → rule width 0→100 % (0.5 s).

## Rules
- Mask is a reward, not the only path: all critical content is readable without hover. On touch (no cursor) animate `uMouse` along a slow Lissajous path or tap-to-place the lens.
- Keep the lens >= 18vmax with a wide feather; small hard circles read as a bug, not light.
- Do the mask in the existing composite pass (zero extra passes); in CSS only update custom properties while the pointer is active.
- **Reduced motion**: static fully-lit state (no mask), no scan sweep, no particles, loader replaced by a simple fade, scrambles show final text immediately, scene transitions become a 200 ms crossfade.
- Detect low-tier GPU (e.g. `detect-gpu`) and drop chromatic aberration, reflected particles and bloom first.
- Give scrambled strings an `aria-label`; the invisible-copy pattern keeps real text in the DOM.
