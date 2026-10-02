---
name: cinematic-loader
description: Build a branded cinematic loading screen — logo/silhouette that fills bottom-to-top as it loads, rolling-digit 000–100% counter, then a camera "fly-through" into the logo with warp streaks that cuts to the site. Use whenever a site needs a preloader/intro (product reveals, car/hardware/fashion/portfolio sites). Derived from amv.tarunvishwakarma.dev.
---

# Cinematic loader

## What the reference does (in order)
1. Pure black screen. An **SVG of the brand silhouette** (traced path, `fill-white/12` ghost) fades in with a blur-to-sharp (`opacity 0→1, blur 6px→0, 1.2s, ease-out-quint`).
2. **Fill reveal**: a `<clipPath>` rect grows upward (`y = H·(1−p)`, `height = H·p`) so a brighter copy (`fill white @ .78`) appears bottom→top. A **bloom band** (gradient rect + 20-unit white line, clipped to the silhouette) rides the fill edge and fades in after ~4 %.
3. **Counter** under the logo: three `0–9` digit columns, each a vertical strip translated by `-value em` with a **spring** (`stiffness 260, damping 30, mass .6`). Leading zeros dimmed (`text-white/25`), `%` in `white/35`. Label style = uppercase, .2em tracking, tabular nums.
4. **Honest-but-theatrical progress**: displayed `p = min(fakeProgress, ready ? 1 : 0.9·realProgress)`. Fake progress ticks randomly (`+0.03…0.15`, slowing to `+0.01…0.04` after 85 %, with occasional 700 ms stalls) so it feels organic but can never outrun real loading; when assets are `ready` it snaps to 1.
5. **Exit = fly-through**: on 100 %, a GSAP timeline zooms the SVG `viewBox` exponentially *into a point inside the logo* (e.g. the wheel arch): `z:0 → −0.08` (tiny pull-back, 0.45 s) then `z:−0.08 → 1` (`power2.in`, 2.1 s). A 2D `<canvas>` over it draws **120 radial warp streaks** whose speed derives from log-zoom velocity; the silhouette is cut out with `destination-out` so the page behind is revealed *through the logo shape*. Outline stroke flashes (`vector-effect: non-scaling-stroke`), label blurs up/out, the real scene scales `0.86→1` with `blur(8px) brightness(.45)→clear` (`expo.out`, 1.8 s, `clearProps`). Total ≈ 2.55 s then `onArrive()` mounts the HUD.
6. **Return visits**: `sessionStorage['<site>:loader-seen']='1'` → counter runs 2.5× faster and zoom is shorter (`L=1.7`).
7. **Reduced motion**: skip the fly-through; fade the loader out (0.8 s) and fire the sfx/arrive callback.
8. A swoosh SFX (`loader-exit.mp3`) is scheduled in sync with the zoom (only if sound already enabled).

## Implementation recipe (vanilla/GSAP; adapt to React as needed)
```html
<div id="loader" class="loader">
  <canvas id="streaks"></canvas>
  <svg id="logo" viewBox="0 0 W H" role="progressbar" aria-label="Loading" aria-valuemin="0" aria-valuemax="100">
    <defs>
      <clipPath id="loaded"><rect id="fill" x="0" y="H" width="W" height="0"/></clipPath>
      <clipPath id="silhouette"><path d="…"/></clipPath>
      <linearGradient id="bloom" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".25" stop-color="#fff" stop-opacity=".9"/>
        <stop offset=".45" stop-color="#fff" stop-opacity=".25"/><stop offset="1" stop-color="#fff" stop-opacity="0"/>
      </linearGradient>
    </defs>
    <g class="ghost" fill="#fff" fill-opacity=".12"><path d="…"/></g>
    <g fill="#fff" opacity=".78" clip-path="url(#loaded)"><path d="…"/></g>
    <g clip-path="url(#silhouette)"><g id="bloomband"><rect y="-50" width="W" height="200" fill="url(#bloom)"/><rect y="-10" width="W" height="20" fill="#fff"/></g></g>
  </svg>
  <p class="label" id="count">000%</p>
</div>
```
```js
// progress tween (feeds the clipPath + bloom band + counter)
const s = { p: 0 };
gsap.to(s, { p: target, duration: .9, ease: 'power3.out', overwrite: true, onUpdate() {
  const y = H * (1 - s.p);
  fill.setAttribute('y', y); fill.setAttribute('height', H - y);
  bloomband.setAttribute('transform', `translate(0 ${y})`);
  bloomband.setAttribute('opacity', Math.min(1, s.p * 25));
  count.textContent = String(Math.round(s.p * 100)).padStart(3, '0') + '%';
}});
```
Fly-through: animate a `{z}` object; each `onUpdate` compute `w = exp(lerp(log(w0), log(w1), z))`, centre = lerp(c0,c1, clamp(z/.82)), set `viewBox`, then redraw the streak canvas (clear black → draw streaks → `globalCompositeOperation='destination-out'` and fill the logo paths using the same transform). Convert the SVG logo to paths (Potrace/Illustrator "expand") so it can be reused as both `Path2D` and clip.

## Rules
- The loader must render with **no framework/3D dependency** (inline SVG + tiny script) so it paints before the heavy bundle.
- Never let the counter finish before assets are really ready; never block >~6 s without an error state (`role="alert"`, uppercase, `tracking-[.3em]`, `text-white/60`).
- Provide `aria-valuenow` updates, `aria-hidden` on the visual counter while an error shows.
- Use for a logo that has a distinctive silhouette (wide shapes read best; this one is ~4:1).
- Keep exit < 3 s; returning visitors get the fast variant.
