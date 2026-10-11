---
name: shared-element-flip
description: Shared-element layout transitions without a framework — a card that grows into its detail view and back (same element, never a duplicate), list reorder/shuffle where every item glides to its new slot, and exit "pop" so siblings close the gap while the leaver fades. Vanilla FLIP (measure, invert, play) with Motion-style scale correction for border-radius and children, plus the View Transitions API path (startViewTransition, view-transition-name, crop + radius, cross-document @view-transition) with feature detection and fallback. Use for galleries, product grids, card→detail, sortable lists, filters. Sources - Motion (motion.dev / framer-motion 14.1.0, motion-dom projection source read on unpkg), Paul Lewis "FLIP your animations" (aerotwist.com), CSS View Transitions 1/2 drafts + developer.chrome.com docs, MDN browser-compat-data.
---

# Shared-element FLIP

Numbers marked **[src]** were read from source/spec (motion-dom 14.1.0 `dist/es`, framer-motion 14.1.0 `PopChild.mjs`, drafts.csswg.org UA stylesheet, aerotwist.com). **[inferred]** = my recommendation, not from a source.

## 1. The technique underneath: FLIP (Paul Lewis)
First → Last → Invert → Play. Read the element's rect, change the DOM/class so it lands in its final layout, read again, apply a `transform` that puts it visually back at First, then animate the transform to `none`.
- Lewis' own values **[src]**: WAAPI `duration: 300`, `easing: cubic-bezier(0,0,0.32,1)`. Rationale: there is ~**100 ms** after an input in which the synchronous `getBoundingClientRect` work goes unnoticed; only the motion itself must hold 60 fps.
- Only `transform` and `opacity` are animated. Width/height become `scale()`.

## 2. What Motion adds (`layout`, `layoutId`) — read in `motion-dom/projection`
- **Default layout transition [src]** `{ duration: 0.45, ease: [0.4, 0, 0.1, 1] }` (`defaultLayoutTransition`, create-projection-node). Overridden by `transition` on the element.
- **Delta [src]** (`calcAxisDelta`): origin = **0.5** (box centre); `scale = targetLength / sourceLength`; `translate = targetCentre − sourceCentre`. Scale within **±0.0001** of 1 snaps to 1, translate within **±0.01 px** snaps to 0 (avoids sub-pixel shimmer).
- **Progress [src]**: one value animates **0 → 1000** ("maps better to pixels than 0-1"); each frame the box is mixed between snapshot and layout, then rewritten as `translate3d(dx/treeScale, dy/treeScale, 0) scale(1/treeScale) … scale(delta.scale·treeScale)` — the `1/treeScale` part is what un-distorts children of a scaled parent.
- **Border-radius correction [src]** (`correctBorderRadius`): px radius is re-expressed as a **percentage of the target box per axis** → `"${r/w·100}% ${r/h·100}%"`. A 10 px radius on 100 px is 10%; scaled to 200 px it is still the 20 px the end state wants, and percent avoids repaints. Radius only gets corrected when it is set via `style`/`animate` (docs). `boxShadow` has its own corrector.
- **Shared `layoutId` crossfade [src]** (`mixValues`): incoming opacity eased **0→1 over the first 50 %** of progress with `circOut`; outgoing **1→0 between 50 % and 95 %**, linear. Radii are mixed in px, clamped ≥ 0.
- **Child distortion**: give direct children `layout` too, or use `layout="position"` for text/images whose aspect ratio changes (docs). Borders can't be scale-corrected below 1 px — use a padded parent as a "border" (docs).
- **AnimatePresence `mode="popLayout"` [src]** (`PopChild`): before the exiting child re-renders it reads `offsetTop/Left`, computed `width/height`, then injects `[data-motion-pop-id] { position:absolute!important; width; height; top|bottom; left|right }`. The leaver is lifted out of flow *immediately*, so siblings' layout animation starts on the same frame as the exit. Parent must be positioned (non-static).
- Layout animations are blocked during horizontal window resize (docs); use `scrollbar-gutter: stable` so a scrollbar appearing doesn't trigger layout animations everywhere (docs).

## 3. Vanilla skeleton (shared element with correction)
```js
const ease = bezier(.4, 0, .1, 1), DUR = 450;               // Motion default
let raf = 0;                                                  // cancelAnimationFrame(raf) to interrupt
function morph(el, from, to, { r0 = 12, r1 = 20, kids = [], reverse = false, done } = {}) {
  // el is ALREADY in its final layout (`to` = its rect). `from` = rect it should appear to start from.
  const sx = from.width / to.width, sy = from.height / to.height;
  const dx = from.left - to.left, dy = from.top - to.top;
  el.style.transformOrigin = '0 0';
  const t0 = performance.now();
  (function frame(now) {
    let p = Math.min((now - t0) / DUR, 1); const e = reverse ? 1 - ease(p) : ease(p), k = 1 - e;
    const ax = 1 + (sx - 1) * k, ay = 1 + (sy - 1) * k;   // current scale, 1 at the end
    el.style.transform = `translate(${dx * k}px,${dy * k}px) scale(${ax},${ay})`;
    const r = r0 + (r1 - r0) * e;                          // the radius the EYE should see
    el.style.borderRadius = `${r / ax}px / ${r / ay}px`;   // same result as Motion's percent-of-target trick
    kids.forEach(c => c.style.transform = `scale(${1 / ax},${1 / ay})`); // counter-scale children
    if (p < 1) raf = requestAnimationFrame(frame); else done?.();
  })(t0);
}
// Open: first = card.getBoundingClientRect(); show detail; last = detailArt.getBoundingClientRect();
//       card.style.visibility='hidden'; morph(detailArt, first, last, { kids:[chip] })
// bezier(x1,y1,x2,y2) = any cubic-bezier solver (Newton on x, ~8 iterations), or sample into CSS linear()
// Close: morph(detailArt, cardRect, detailRect, { reverse:true, done: hideDetail })
```
- Kids that should keep their own size get `transform-origin` matching their anchor (e.g. `0 0` for a top-left chip).
- Text shared between states (title): use **uniform** scale `s = firstHeight/lastHeight` on both axes (Motion's `layout="position"` idea) so glyphs never squash.
- Never show the source and the target at the same time (Benji Taylor's rule in "Family Values": a component that persists must not duplicate itself). Hide the card while the detail owns the element.

## 4. Reorder / shuffle
```js
const first = new Map(items.map(n => [n, n.getBoundingClientRect()]));
reorderDom();                                                 // moveBefore() keeps focus (Chrome 133, Firefox 144), else re-focus
items.forEach((n, i) => { const a = first.get(n), b = n.getBoundingClientRect();
  const dx = a.left - b.left, dy = a.top - b.top; if (!dx && !dy) return;
  n.animate([{ transform: `translate(${dx}px,${dy}px)` }, { transform: 'none' }],
            { duration: 450, easing: 'cubic-bezier(.4,0,.1,1)', delay: i * 18 });   // 18 ms stagger [inferred]
});
```
- Interrupting: before measuring `first`, read the *current* rect while the old animation is still running (getBoundingClientRect includes transforms), then `anim.cancel()` — the new FLIP starts from where the eye is.
- Removing an item: copy Motion's popLayout — set the leaver `position:absolute` at its `offsetTop/Left/width/height` *before* measuring siblings, fade it out, FLIP the siblings.

## 5. View Transitions API path
```js
function vt(update, names) {                     // names: [[el, 'hero'], …] to tag BEFORE and AFTER
  if (!document.startViewTransition || matchMedia('(prefers-reduced-motion: reduce)').matches) return update();
  return document.startViewTransition(update);    // returns { ready, finished, updateCallbackDone, skipTransition() }
}
```
- **UA defaults [src]** (spec UA stylesheet): `::view-transition-group(*) { animation-duration: .25s; animation-fill-mode: both }` with the initial `ease` timing. The group animates **`transform`, `width`, `height`** (not scale), old/new snapshots cross-fade with `mix-blend-mode: plus-lighter`. Snapshots are `inline-size:100%; block-size:auto` → they keep their aspect ratio and overflow when it changes.
- **Aspect change fix [src, Chrome docs + Motion animateView]**: `::view-transition-group(x){ overflow: clip }` and `::view-transition-old(x), ::view-transition-new(x){ width:100%; height:100%; object-fit:cover }`. Motion only crops when the aspect ratios differ by **> 0.2**, and then animates each corner radius on the group (otherwise clip squares the corners). Do the same from JS: `transition.ready.then(() => document.documentElement.animate({ borderRadius: ['12px', '20px'] }, { duration, easing, pseudoElement: '::view-transition-group(hero)' }))`.
- **No full-page crossfade**: Motion writes `:root { view-transition-name: none }` when the root isn't a target, so the rest of the page stays live instead of being snapshotted. Inject that rule (plus your timings) only for the duration of the transition and remove it on `finished`.
- `view-transition-name` **must be unique** among rendered elements, or the whole transition is skipped (Chrome docs). Assign names just-in-time and clear them in the update/finished callbacks. `view-transition-class` shares styling between unique names; `view-transition-name: match-element` auto-names.
- Text in VT is a bitmap: it scales blurry and swaps to live text at the end. For long titles prefer the FLIP path or keep title size equal across states.
- Cross-document: `@view-transition { navigation: auto; }` on both pages (same origin). `pageswap`/`pagereveal` events + `types` let you vary per navigation.
- **Support [src: MDN BCD]**: `startViewTransition` Chrome/Edge 111, Safari 18, Firefox 144; `{update, types}` options Chrome 125, Safari 18.2, Firefox 147; `view-transition-class` Chrome 125, Safari 18.2, Firefox 144; `match-element` Chrome 137, Safari 18.4, Firefox 144; cross-document `@view-transition` Chrome 126, Safari 18.2, **not in Firefox**; element-scoped `el.startViewTransition()` Chrome 147 only. Always feature-detect and run the update without animation otherwise (Motion's `animateView` does exactly that).
- While a VT runs the `::view-transition` overlay takes pointer input for the whole viewport; keep durations ≤ ~500 ms.

## 6. When to use which
| Need | Use |
|---|---|
| Interruptible, per-frame control, children/radius correction, drag | FLIP (JS) |
| Element moves between DOM trees / routes, zero measuring code | View Transitions |
| Different page | Cross-document VT (progressive enhancement) |

## A11y and rules
- Card→detail is a dialog: `role="dialog"`, `aria-modal`, label it with the title, move focus to the close button (or heading with `tabindex=-1`), `inert` on everything behind, **Esc** closes, focus returns to the originating card. Cards are real `<button>`s.
- Reorder: announce with a polite live region ("Shuffled, 6 items"); never steal focus; restore focus if DOM moves blurred it.
- **Reduced motion**: skip the transform entirely — swap state and do a 150–200 ms opacity fade **[inferred]**; for VT call `update()` directly or `transition.skipTransition()`.
- Measure all rects first, then write all styles (no read/write interleaving per item).
- Animate an element *inside* the card (the art) rather than the whole card when the card contains text that must not stretch.
- Don't FLIP during scroll-linked layout or window resize; cancel and jump to end instead.
- `display:inline` elements ignore transforms — make them `inline-block`.
