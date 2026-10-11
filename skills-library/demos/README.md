# Demo contract

Each file `demos/<skill-id>.js` is a classic script (no modules, no build, no external libraries) that calls `Lib.register` once. `core.js` loads every demo, mounts it lazily when its stage nears the viewport, and starts or stops it as the stage enters or leaves view.

```js
Lib.register('skill-id', {
  hint: 'Drag the handle along the arc',      // one line: what the viewer should do
  notes: [                                     // 3–5 short items: numbers or rules worth stealing
    'Ease <code>cubic-bezier(.23,1,.32,1)</code>, 1.1 s enter, .35 s exit',
  ],
  simplified: 'No Matter.js; a 40-line circle solver stands in.', // honest gap vs the SKILL.md
  css: `.d-skill-id .thing { … }`,             // optional; ALWAYS prefix selectors with .d-<skill-id>
  mount(stage, ctx) {
    // stage: an empty <div class="stage d-skill-id">, position:relative, overflow:hidden,
    //        black background, 16:10 (4:5 on phones), min-height 340px.
    // ctx: { id, reduced, fine, audio, loop, fitCanvas, el, clamp, lerp, damp }
    return {
      start() {},          // stage visible: begin loops/animation
      stop() {},           // stage hidden: cancel rAF, timers, audio sources. Must be cheap and idempotent.
      scroll(p, v) {},     // optional, every frame while live: p = the STAGE's progress through the viewport 0..1
                           //   (0 = stage top at viewport bottom, 1 = stage bottom at viewport top),
                           //   v = smoothed page scroll velocity −1..1. Use this for scroll-driven demos; never hijack page scroll.
      replay() {},         // optional: shows a "Replay ↺" button under the stage
    };
  }
});
```

## Helpers (`ctx` and `window.Lib`)
- `ctx.loop(fn)` → `{ start(), stop() }`; `fn(dt, tSeconds)` with `dt` clamped to 0.05 s.
- `ctx.fitCanvas(canvas, box, maxDpr = 2)` → `{ w, h, dpr }`; call on start and on resize. Draw with `ctx.setTransform(dpr,0,0,dpr,0,0)`.
- `ctx.damp(a, b, lambda, dt)` frame-rate-independent smoothing; `ctx.clamp`, `ctx.lerp`, `ctx.el(tag, className, html)`.
- `ctx.audio`: shared engine. `audio.on` (bool), `audio.ctx` (AudioContext, null until the user turns sound on), `audio.out` (master GainNode — connect everything here), `audio.noise()` (2 s stereo noise buffer), `audio.whoosh(gain)`, `audio.onChange(fn)`. Never create your own AudioContext, never autoplay; if sound is off, show a small note "Turn Sound on (top right) to hear this".
- Use a `ResizeObserver` on the stage when layout depends on size; disconnect it in `stop()` or keep it cheap.

## Rules
- Vanilla JS + DOM/CSS/Canvas 2D/WebGL 2 only. No CDN libraries. Keep each file under ~350 lines.
- Prefix every class you create (e.g. `d-xyz-rail`). The page shell styles these names globally, so don't reuse them unprefixed: `rail`, `hero`, `chip`, `rows`, `links`, `frame`, `tick`, `drawer`, `tabs`, `close`, `steps`, `empty`, `rise`, `revealed`, `label`, `display`, `accent`, `mono`, `ulink` (the last five are meant to be shared tokens).
- Everything scoped inside `stage`. No global listeners unless added in `start()` and removed in `stop()`.
- `stop()` must leave nothing running (rAF, setInterval, audio nodes, global listeners).
- Respect `ctx.reduced` (prefers-reduced-motion): show the end state or a gentle fade, keep information identical.
- Work on touch (pointer events, `touch-action` only on elements that need drags) and on small stages (≥ 320×340 px).
- Keyboard: every interactive control is a real `<button>`/`<input>` or has `tabindex="0"`, a role and key handling.
- Visual language: black stage, white at opacity steps (/90 /70 /45 /15), ONE accent `#f97316`, labels with the global `.label` class (uppercase, .2em tracking, 10.5px). Display text: `font-family: Archivo; font-stretch: 125%`. Easing `cubic-bezier(0.23, 1, 0.32, 1)`.
- `[data-cursor="Drag"]` on an element gives the global reticle cursor a label. Add `data-native-cursor` on the stage if the demo draws its own cursor and the reticle should hide there.
- If WebGL 2 is missing, render a Canvas 2D or CSS fallback, never a blank stage.
- Notes must be accurate to the SKILL.md. Read `.claude/skills/<id>/SKILL.md` before writing the demo.
