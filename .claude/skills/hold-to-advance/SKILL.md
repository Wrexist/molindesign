---
name: hold-to-advance
description: Press-and-hold interaction with a progress ring that commits a big moment (unlock next section) or a sustained hold that drives a scene (pour, draw, zoom) with audio/visuals tied to hold progress. Includes resume grace on early release, pointer capture, and mandatory keyboard / tap alternatives. Use for gated section transitions, "hold to enter" CTAs, and story beats that should feel earned. From why.zero.university (commit-hold, verified in bundle) and santionispirits.com (sustain-hold, verified in bundle).
---

# Hold to advance

Two flavours; pick per beat. Both are **verified in the sites' bundles** unless marked (inferred).

## A. Commit-hold (Zero): hold N seconds → advance
- Button = SVG ring (viewBox 100x100): `<circle cx=50 cy=50 r=46>`, `circumference = 2π·46`, `stroke-dasharray = C`, progress via `stroke-dashoffset = C·(1 − t)`. Label under it reads `TAP / HOLD`. Button fades to 0 on press (`0.2 s`) and back to 1 on cancel (`0.3 s`); ring resets with `0.3 s power2.out`.
- Durations used: **3 s** default (section 1→2), **1.5 s** (stage 3, shorter because it already has a zoom payoff). Rule of thumb: 1.5 s for secondary, 3 s for the hero transition. Never > 3.5 s.
- Loop is rAF, not setTimeout: `t = (now − start)/1000; p = min(t/dur, 1)`; call `onProgress(p, t)` every frame; at `p >= 1` remove listeners and `onComplete()`.
- **Resume grace** (nice detail): on release store `p` and the release time. If the user presses again within **500 ms**, restart at `p·(1 − dt/500)` (progress decays linearly over the grace window) and pass `{ resumeT }` to `onStart` so the scene doesn't snap to 0. Otherwise `onCancel()`.
- `pointerdown` on the button, `pointerup` + `pointercancel` on `document`; `setPointerCapture`; ignore other `pointerId`s (multi-touch); `preventDefault()` on down.
- Smooth the visual payoff with smoothstep of progress: `z = p*p*(3-2*p)` drives a camera dolly (`1.5` world units at p=1).
- The hold button only *appears* at scene progress `showAt = 0.95` and hides again below `hideAt = 0.9` (hysteresis, avoids flicker).
- Audio: a hold SFX is started on press with `seek = resumeP·duration` and `rate = (sfxDuration/holdDuration)·0.75`, so the sound's length matches the hold; stopped with a `0.1 s` fade on release. Two ambient beds crossfade **linearly with progress**: `bedA = (1−p)·volA`, `bedB = p·volB`; on cancel restore bed A with a `0.3 s` fade.

```js
function holdButton(btn, { dur = 3, onProgress, onComplete, onCancel, resumeMs = 500 }) {
  let down = false, start = 0, raf, lastP = 0, lastUp = 0, pid = null;
  const tick = () => { if (!down) return;
    const p = Math.min((performance.now() - start) / 1000 / dur, 1); onProgress(p);
    if (p >= 1) { down = false; return onComplete(); } raf = requestAnimationFrame(tick); };
  const press = e => { if (down) return; e.preventDefault(); down = true; pid = e.pointerId;
    const now = performance.now(), gap = now - lastUp;
    const resume = lastP > 0 && gap < resumeMs ? lastP * (1 - gap / resumeMs) : 0;
    start = now - resume * dur * 1000; btn.setPointerCapture?.(pid); raf = requestAnimationFrame(tick); };
  const release = e => { if (!down || (e.pointerId !== undefined && e.pointerId !== pid)) return;
    down = false; cancelAnimationFrame(raf); lastP = Math.min((performance.now() - start) / 1000 / dur, 1);
    lastUp = performance.now(); onCancel?.(); };
  btn.addEventListener('pointerdown', press);
  document.addEventListener('pointerup', release); document.addEventListener('pointercancel', release);
  // REQUIRED a11y (neither site ships this): keyboard hold + instant alternative
  btn.addEventListener('keydown', e => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) press({ preventDefault(){} , pointerId: 'kb' }); });
  btn.addEventListener('keyup',   e => { if (e.key === ' ' || e.key === 'Enter') release({ pointerId: 'kb' }); });
}
```

## B. Sustain-hold (Santioni): hold = the scene plays, release = it rewinds
- A white disc (`120 px`, `3 px solid #000`, uppercase label e.g. `HOLD`, hit area `1.3×` = 156 px) sits in the section. On press the disc shrinks to `scale .1` over `400 ms easeOutCubic` (label fades out), page scroll is **disabled** for the duration, and the disc then follows the pointer (lerp factor eases from 1 to `.08` over `1 s easeOutCubic`; on release it drifts home over `5 s easeOutSine`). Scroll re-enables **300 ms** after release. Desktop uses cursor text instead of the disc ("Hold & Pour", "Hold & Move").
- Pour scene: `progress` tweens **0→1 over 3000 ms linear** while held and **1→0 over 1000 ms linear** on release (fast, forgiving rewind). Every visual/audio reads that one number.
- Audio keyed to the same number: `pouring` loop gain = `range(p, .24, .28, 0, 1)` (fades in only after the pour has visibly started); one-shot `pouring_start` when `p` crosses `.24` upward, `pouring_stop` when it crosses back down. Water level `= lerp(.05, .4, easeInOutSine(range(p, 0, .7)))`. Gains use `setTargetAtTime(v·baseGain, now, 0.02)`.
- Takeaway: **one scalar drives picture and sound**; thresholds (not time) trigger one-shots; release always has a path back.

## Accessibility (mandatory, both sites omit most of this)
- Keyboard: Space/Enter held = hold (see skeleton). Provide a **non-hold alternative**: a visible secondary link/button "Skip / Continue" (single activation) or `aria-pressed` toggle; never gate content only behind a hold.
- `role="button"`, `aria-label="Hold to continue"`, live region announcing `Hold… 40%` at 25 % steps only, and "Continued" on complete. Expose `aria-valuenow` if rendered as progressbar.
- `prefers-reduced-motion`: replace hold with a single click/tap (Zero's own non-hold mode is `click` on the same button), no camera dolly, no ring animation; keep the ring static.
- Touch: `touch-action: none` on the button, `-webkit-touch-callout: none`, `user-select: none`; keep ≥ 48 px target. Cancel on `pointercancel` and on `visibilitychange`.
- Don't call it "hold" if it's not needed: use only for 1–3 key transitions per site.

## Rules / don'ts
- Don't use `setTimeout` for the duration (drifts on throttled tabs); use timestamps.
- Don't reset to 0 instantly on a tiny slip; use resume grace or fast rewind.
- Don't start audio before a user gesture (the press counts) and give a mute toggle.
- Don't use hold for primary navigation or forms; only for ceremony.
