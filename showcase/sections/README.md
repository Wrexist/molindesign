# Showcase section contract

The showcase (`showcase/index.html`) is a launch site for a made-up field camera, **Halden LF‑1**. It puts every skill in `.claude/skills/` to work on one page. `site.js` is the shell (tokens, loader, cursor, sound, ⌘K, toasts, page transitions, scroll signals, background WebGL). Each section lives in `sections/<id>.js` and only touches its own `<section>`.

Static site, no build, no CDN libraries, no modules. Classic scripts loaded after `site.js`. Relative paths only.

## Registering a section

```js
Site.section('hero', {
  css: `#hero .hero-title { … }`,   // injected once; ALWAYS scope selectors under #<id>
  mount(root, ctx) {               // root = <section class="sec" id="hero">, already in index.html, empty
    root.innerHTML = `…`;          // build your own markup (real text, headings, buttons)
    return {
      start() {},                  // section is on screen (any pixel): start loops, listeners
      stop() {},                   // off screen: cancel rAF/timers/global listeners/audio. Cheap + idempotent.
      scroll(m) {},                // every frame while live, see metrics below. Never hijack page scroll.
      enter() {},                  // optional: called ONCE, the first time the section is ≥ 15% visible
                                   //   AFTER the loader/page cover has lifted (gated entrances).
    };
  }
});
```

`mount` runs once when the section is within one viewport of the screen and the loader has finished. The section's `<h2>` must exist after mount (screen readers, ⌘K jumps).

### Scroll metrics `m` (scroll-velocity-section-metrics)
- `m.progress` 0..1: 0 when the section top meets the viewport bottom, 1 when its bottom meets the viewport top.
- `m.pin` 0..1: for tall sections with a `position: sticky` stage: `-top / (height - innerHeight)`, clamped.
- `m.transition` −1..0..1: −1 entering from below, 0 fully covering, +1 leaving above (based on the top/bottom edges).
- `m.offset` px: section top relative to viewport top.
- `m.vel` −1..1: smoothed, clamped page scroll velocity (positive = scrolling down).
- `m.vh`, `m.vw`: viewport size.

## ctx (also on `window.Site`)
- `ctx.reduced` bool (prefers-reduced-motion), `ctx.fine` bool (pointer: fine, hover: hover).
- `ctx.tier` `{ tier: 0..3, dpr: maxDpr, webgl2: bool, mobile: bool }`. Tier 0 = static, no WebGL loops. Cap your canvas DPR at `ctx.tier.dpr`.
- `ctx.loop(fn)` → `{ start(), stop() }`, `fn(dt, tSeconds)`, dt clamped to .05.
- `ctx.fitCanvas(canvas, box, maxDpr)` → `{ w, h, dpr }`.
- `ctx.clamp, ctx.lerp, ctx.damp(a, b, lambda, dt), ctx.el(tag, cls, html), ctx.map(v, a, b, c, d)` (clamped remap).
- `ctx.audio`: `on` bool, `ctx` AudioContext|null, `out` master GainNode, `noise()` buffer, `click(gain)` short tick, `shutter()` camera shutter, `whoosh(gain)`, `tone(freq, dur, gain)`, `onChange(fn)`, `muffle(bool)`. Never create your own AudioContext. Sound is opt-in from the nav; when off, these are silent no-ops.
- `ctx.toast(title, { description, type: 'success'|'error'|'info'|'loading', action: { label, onClick }, duration })` → id. Sonner-style stack in the bottom-right (stacked-toasts). `ctx.toast.dismiss(id)`, `ctx.toast.update(id, opts)`.
- `ctx.bg.set({ aperture, warmth, energy, focus })`: fixed full-screen WebGL bokeh field behind the page (scroll-scrubbed-webgl-sections). All 0..1. `aperture` = bokeh size, `warmth` = night blue → dawn amber, `energy` = drift/kick, `focus` = 1 sharp points, 0 soft blobs. The shell damps toward the last values you set. Only the film section and the field section should drive it; others leave it alone.
- `ctx.palette.add({ id, title, group, keywords, run })`: add a ⌘K command (command-palette-motion). Group names: `Go to`, `Actions`, `Settings`.
- `ctx.lockScroll(bool)`: for modals/sheets.
- `ctx.go(url)`: gated page transition to another page (gated-page-transitions).
- Cursor (reticle-cursor): any element with `data-cursor="Drag"` shows a label in the reticle; buttons/links/`[data-magnet]` get bracket snapping. Put `data-native-cursor` on an element that draws its own cursor.
- Shared utility classes (already styled in `site.css`): `.mask > .line` (masked line reveal: add `.is-in` to the parent to play), `.rise` (blur-fade-rise, add `.is-in`), `.label` (HUD uppercase), `.mono`, `.serif` (Instrument Serif italic), `.btn` / `.btn.ghost`, `.kicker` (section number + title line, e.g. `<p class="kicker"><span>04</span>Anatomy</p>`), `.wrap` (container with gutters), `.grid12`.

## Visual language
- Ink `--ink: #0d0d0c`, paper `--paper: #ece8df`, greys at opacity steps of paper (`--p90 --p70 --p45 --p15 --p08`), ONE accent `--signal: #ff4d1f` (also the comic spot colour), muted gold `--brass: #b89a5e` only for the journal.
- Type: Archivo variable (`wght 100–900`, `wdth 62–125`) for display; `.serif` Instrument Serif italic for one or two words per headline; Geist Mono for numbers/labels. Display uses `font-stretch: 125%`, tight tracking `-0.02em`.
- Sizes in **rem** (viewport-rem-grid-tokens): `html` is 10px on phones and `100vw/144` (10px at 1440) from 768px up, min 8px. Body copy ≥ 1.5rem.
- Easing tokens: `--ease-out: cubic-bezier(.23,1,.32,1)` (entrances), `--ease-io: cubic-bezier(.76,0,.24,1)` (wipes/covers), `--ease-drawer: cubic-bezier(.32,.72,0,1)`. UI feedback ≤ 300 ms; scene moves 0.8–1.2 s.
- The camera itself: an inline SVG `<symbol id="lf1">` (viewBox `0 0 400 240`, front view, uses `currentColor` for the body outline and `var(--signal)` for the shutter) and `<symbol id="lf1-xray">` (same outline, internals: sensor, shutter blades, battery, board). Use `<svg viewBox="0 0 400 240"><use href="#lf1"/></svg>`. Lens centre is at (200, 128), lens outer radius 62.
- Product facts (use consistently): Halden LF‑1, 24 MP full-frame monochrome-and-colour sensor, 35 mm f/1.4 fixed lens, ISO 50–102 400, shutter 1/8000 s, 412 g, weather sealed, 40-hour battery, price **SEK 18 900** (body) / with grip SEK 20 400 / with field kit SEK 23 900. Made in Lysekil, Sweden.

## Rules
- Respect `ctx.reduced`: show end states or gentle fades, same information.
- Touch works (pointer events; `touch-action` only on drag surfaces). Layout works at 360 px wide; no horizontal page scroll.
- Keyboard: every control is a real `<button>`/`<input>` or has tabindex/role/key handling; visible focus.
- If WebGL2 is missing or tier 0, render a Canvas 2D or CSS fallback, never an empty box.
- Each section file stays under ~600 lines. Comments: short, say which skill a block implements.
- Each section's root has `data-skills="a,b,c"` in index.html; keep that list accurate to what you built.
