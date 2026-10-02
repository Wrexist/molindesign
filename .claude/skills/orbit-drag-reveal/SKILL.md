---
name: orbit-drag-reveal
description: Arc-shaped "drag to reveal" slider that scrubs a hero animation (e.g., pulling a cover off a product) — pointer capture, rubber-band overshoot, spring-back on release, flick-to-commit by velocity, haptics, keyboard + ARIA slider, pulsing onboarding hint. Use as the first, delightful interaction of an immersive hero. From amv.tarunvishwakarma.dev.
---

# Orbit drag-to-reveal

A circular **arc** (radius R) is drawn around an anchor point on the product (the engine projects a 3D anchor to screen px: `{x, y, r}`). A glowing handle sits at the arc start; dragging it along the arc maps angle → progress `p∈[0,1]`, which the engine uses to scrub the reveal timeline (`onScrub(p)`). Reaching ≥ 0.97, or flicking fast, **commits** (`onCommit`) and the cinematic plays on its own.

## Geometry
- Landscape: `R = clamp(min(anchor.r, innerWidth − 64 − x), ≥80)`; arc angles `[a0,a1]` with `a1 = min(40°, asin((y − (headerBottom+32))/R))`, `a0 = max(a1 − 58°, asin((y − (innerHeight−64))/R))` — the arc is auto-fit so it never crosses the header or bottom bar. Portrait: arc angles `[−130°, −50°]` (a smile under the product), `R = clamp((W/2−28)/cos50°, 100, H−120−y)`.
- `point(t) = (cx + R·cos(θ(t)), cy − R·sin(θ(t)))`, `θ(t) = a0 + (a1−a0)·t` (degrees→rad). Draw with SVG `A` arc path; stroke `url(#fade)` gradient (white `.34` in the middle, transparent at both ends), `pathLength` 0→1 intro (1.8 s). A **mask with blurred rect** punches a soft gap where the header/nav sits so the arc never collides with UI. Progress segment in orange `#f97316` 1.5 px round caps; tick mark at the end (`white .7`, turns orange for 8 % of the hint loop).
- Pointer → progress: angle of pointer around centre, relative to arc mid; ignore if `|Δ| > 120°` (hold last value); allow slight negative rubber-band: `n<0 ? max(.25·n, −.06) : n`.

## Interaction details
- `onPointerDown`: `setPointerCapture`, stop spring, reset velocity samples; handle ring scales to 1.7 with `white/10` fill. `touch-none` + `cursor-grab/grabbing`.
- Keep last 5 `{p,t}` samples. On release: if `(Δp/Δt) > 1.4 /s && p > .12` → **commit** immediately (flick). Else spring back to 0 with a hand-rolled spring: `a = −170·x − 26·v` per frame (dt ≤ 50 ms) until `|x|<.001 && |v|<.01`.
- Haptics: `navigator.vibrate?.(4)` each quarter progress (`floor(4p)` change); on commit `navigator.vibrate?.([12,40,24])`.
- Label next to handle: `DRAG TO REVEAL` (`label` style, flips to the left side if within 200 px of right edge, fades to 50 % while dragging).
- **Onboarding hint loop** (until first hover/focus/press): after 3 s, up to 3 times every 5.5 s — a ghost handle (44 px ring + dot) animates along the arc using WAAPI (`offset`ed keyframes: fade in, `ease-in-out` ride, hold, fade out), the arc's dash draws via `strokeDashoffset 1→0`, and a ping ring scales 1→2.4 fading out. Disabled for reduced motion (static fade only).
- Accessibility: handle is `<button role="slider" aria-valuemin=0 aria-valuemax=100 aria-valuenow aria-label="Drag to reveal the car">`; Arrow keys ±10 %, Enter/Space commits. Visible `focus-visible:border-white`.
- `data-cursor="Drag"` so the reticle cursor labels it (see `reticle-cursor`).

## Contract with the engine
```ts
onScrub(p: number)   // continuous 0..1 while dragging (and during spring-back)
onRelease()          // engine eases back / stops scrub-follow
onCommit()           // lock the reveal, play the full take, start audio, vibrate
```
Audio coupling: while dragging, loop a "crank" sound with `gain = .4·p^.8`, `playbackRate = .85 + .5·p`; on commit stop it and fire the "reveal" stinger.

## Reuse ideas
Curtain/cover removal, "unlock" a product, open a case, switch light/dark of a scene, before/after sliders — any one-gesture threshold interaction that hands off to an autoplay animation.
