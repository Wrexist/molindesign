---
name: gated-stage-scroll
description: Virtual-scroll "game level" structure — a fixed WebGL/DOM stage driven by a custom scroll manager with per-stage scroll lengths, input clamps, hold-locks, auto-scrolling gates, a hold-to-unlock transition between stages, a countdown ruler HUD (-100 BZ to 0 BZ), a gamified XP counter (+100 per stage, once), mouse/gyro parallax rig, and a finale reward reveal (certificate folds into an origami animal). Use for story/onboarding/recruitment sites where progress should feel earned and trackable. From why.zero.university (all numbers verified in its bundle).
---

# Gated stage scroll

Complements `scroll-driven-chapters` (free scrubbing) and `hold-to-advance` (the unlock gesture). This is the **state machine + HUD** around them.

## Stage table (single source of truth)
```js
const STAGES = [
  { id:'gate0to1', scrollVh:50,  autoScroll:true, autoScrollDuration:3.5 },
  { id:'stage1',   scrollVh:175, holdTrigger:{ showAt:.95, hideAt:.9, holdDuration:3 } },
  { id:'gate1to2', scrollVh:50,  autoScroll:true },
  { id:'stage2',   scrollVh:250, advanceAtEnd:true, advanceThreshold:.99 },
  { id:'stage3',   scrollVh:325, holdTrigger:{ showAt:.95, hideAt:.9, holdDuration:1.5, ripple:false } },
  { id:'gate3to4', scrollVh:50,  autoScroll:true, autoScrollDuration:3 },
  { id:'stage4',   scrollVh:368, advanceAtEnd:true, advanceThreshold:.99 },
  { id:'stage5',   scrollVh:50 },                      // finale
];
// px length = scrollVh * innerHeight * (innerWidth < 768 ? .7 : 1)   // mobile = 30% shorter
```
Each stage has `enter(ctx)`, `scrub(ctx, p)`, `update(ctx, dt, p)`, `exit(ctx)`; `gate*` stages are short cinematic transitions that auto-scroll; only one stage is "active"; scroll position resets to 0 on `setActiveStage`. Preload the *next* stage's assets in `enter` (`loadStageAssets('stage3')`) and precompile shaders before showing it.

## Scroll manager (exact math)
- No native scroll (`body{overflow:hidden}`). `wheel` (passive) adds to a *target*: `target += clamp(e.deltaY, -500, 500) * 35` then clamp to `[min, stageLength]`. (Constants: `MAX_DELTA=500`, `GAIN=35`.) Touch: same clamp on `lastY - y`, `touchmove` non-passive.
- Smoothing frame-rate independent: `k = 1 − exp(−smoothSpeed·dt)` with `smoothSpeed = −ln(1 − .075)·60`; `pos = lerp(pos, target, k)`; snap when `|Δ| < .5`. `progress = pos / stageLength` → notify subscribers.
- **Locks**: `setHeld(true)` ignores wheel/touch (used for the first ~1 s of stage 1 until the first text is visible, and while a hold is active); `setScrollClamp(min, max)` caps progress until a task is done; `startAutoScroll(target, seconds)` returns a Promise and eases with smoothstep `n*n*(3-2n)`.
- Advance rule: `advanceAtEnd && progress >= .99` → next stage; or reveal the hold button at `.95`.

## Hold-to-unlock between stages
At `progress > showAt` show the hold button (see `hold-to-advance`); `progress <= hideAt` hides it (hysteresis). While holding: suppress idle hints, drive a ripple/zoom shader with hold progress (`intensity = .4 + .6p`, `halfWidth = .75 − .55p`, hand scale eased with in-out-cubic `.7 + .3·ease(p)`), crossfade ambient audio. Completion calls `advanceToNext()`; cancel restores everything.

## Ruler HUD + XP (the "game" layer)
- Bottom ruler: ticks every `12 px`, minor tick per ~`10 vh` of scroll, **major ticks labelled `-100 BZ`, `-75 BZ`, `-50 BZ`, `-25 BZ`, `0 BZ`** at stage starts (a countdown to the destination); a fixed centre indicator; ticks near it react (influence radius = 3 average tick gaps; exact visual is inferred). Nav buttons per stage: `aria-label="Go to stage -75 BZ"`; the track is `aria-hidden`. Counter text updates only when the rounded value changes.
- XP pill (top-left/right, glass): `border:1px solid #ffffff1a; background:#0006; backdrop-filter: saturate(120%) blur(14px); border-radius:999px; padding:11px 16px`; coin icon 16 px + number + `XP` label at `opacity .6`.
- Award rule (deduped): `awarded = new Set()`; on stage enter `if (awarded.has(id)) return; awarded.add(id); to = awarded.size * 100`. Play a "top-up" SFX, re-trigger CSS class `xp-ripple` (remove, force reflow via `offsetWidth`, add; remove on `animationend`), and count up the text node with `gsap.to({val}, {val:to, duration:2, ease:'power2.out', onUpdate: n.nodeValue = Math.round(val)})`. Glow keyframes: `1.8 s ease-out`, peak at 12 % (`border #ffc832e6`, `box-shadow 0 0 14px #ffbe28b3, 0 0 30px #ffaa004d`), pill background flashes to `#fffffff2`.
- Theme the HUD per stage (`setPageTheme('white'|'black')`) with `0.6 s` colour transitions.

## Parallax camera rig
`MAX_OFFSET .18`, `FOCAL_DISTANCE 1`, smoothing time constant `.12 s`, `CAMERA_LERP .08`. Input = normalized pointer (-1..1) on `(pointer:fine)`; on touch devices use `deviceorientation` (`GYRO_RANGE 20°`, reference angle slowly re-centred: `ref += (cur − ref)·.008`; iOS needs a permission request from a user gesture over HTTPS). Offset the camera (and a background parallax uniform) by `input·MAX_OFFSET`. Disable the rig during gate transitions.

## Finale reward: certificate folds into an origami animal (Zero)
After the waitlist form submit: draw the user's name onto a certificate texture with a 2D canvas (auto-shrink font to fit `960 px`), map it onto a Draco-compressed GLB with a **baked fold animation** (10 animals: angelfish, cat, dog, dolphin, elephant, fox, goldfish, rhino, seal, wolf), `AnimationMixer` clip played once (`LoopOnce`, `clampWhenFinished`), baked AO map multiplied into emissive so creases darken. Charge-up: emissive `7×` brightness, `1.1 s` hold, `1.2 s` charge, peak beat `.35 s`, `1.2 s` reveal, `260` sparks over `1.4 s` (easeOutCubic burst, `+t²·.5` upward drift), halo `#ffd98c`. Afterwards free horizontal orbit only (`polar = π/2`, damping `.08`, auto-rotate `1.2` after `2 s` idle). Fallback/pre-roll: SVG polygon morph through 7 silhouette point-sets (`.75 s sine.inOut` each). (Pattern inference: a baked clip is far cheaper than runtime cloth/fold sim.)

## Accessibility & performance
- The site ships wheel/touch only and a pointer-only hold. **Add**: ↑/↓/PageUp/PageDown/Space step the target (`±innerHeight·.5` px), Home/End jump stages, ruler buttons are real `<button>`s, hold has keyboard + click alternative, a visible "Skip to content" that sets all stages complete and shows the static page.
- `prefers-reduced-motion`: no auto-scroll gates (cut), no sparks/halo, static certificate, XP number set without count-up, parallax rig off.
- Provide a plain-HTML copy of the story for SEO/screen readers (`aria-hidden` canvas + `<main>` text); announce stage changes via `aria-live="polite"`.
- Cap DPR at 2, pause rAF when the tab is hidden, keep stage assets lazy.

## Don'ts
- Don't hard-lock users with no escape (add skip). Don't award XP for scrolling backwards or twice. Don't ship `user-scalable=no` (Zero does; it harms a11y).
