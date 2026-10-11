---
name: sliding-indicator-tabs
description: Tabs and segmented controls whose active indicator glides between items instead of jumping — a measured underline (translateX + scaleX), a pill made by clipping a duplicated "active" copy of the list so the text colour flips exactly at the pill edge, a hover highlight that follows the pointer, and a tab-panel container that animates its height while content slides in from the side of the tapped tab. Full WAI-ARIA tabs / radiogroup keyboard model, reduced motion, resize + font-load re-measure. Use for product pages, dashboards, pricing toggles, settings, filters. Sources - Motion `layoutId` shared indicator (motion.dev, motion-dom 14.1.0 defaults), Emil Kowalski "The magic of clip-path" (emilkowal.ski; technique credited there to Paco Coursey), Benji Taylor "Family Values" (directional tab motion), WAI-ARIA APG Tabs, MDN browser-compat-data.
---

# Sliding-indicator tabs

**[src]** = read from source/docs; **[inferred]** = my choice for a premium default.

## 1. Where the idea comes from
- **Motion**: render `<motion.div layoutId="underline" />` only inside the active tab; when it mounts in another tab Motion animates it from the old box with the default layout transition **[src] `0.45 s`, `ease [0.4, 0, 0.1, 1]`** (motion-dom `defaultLayoutTransition`). The vanilla version below gives the same result with one persistent element and measured geometry.
- **Clip-path pill (Emil Kowalski, after Paco Coursey) [src]**: duplicate the whole list, style the copy as "active" (filled background, inverted text), mark it `aria-hidden`, lay it exactly over the real list and clip it to the active tab: `clip-path: inset(0 ${100 − right/W·100}% 0 ${left/W·100}% round 17px)` using the tab's `offsetLeft/offsetWidth` and the container's `offsetWidth`. Animating `clip-path` reveals the next tab, so the text colour swaps *exactly* at the pill edge — a colour `transition` can never line up like that.
- **Family (Benji Taylor) [src, article]**: "switching tabs in Family includes a flash of directional motion. If you tap on a tab on the left, the transition moves left, and vice versa… We fly instead of teleport." No timings are published.

## 2. Measuring (the only layout read)
```js
function geo(tab, list) {                    // offset* ignores transforms on ancestors (e.g. a scaling-in modal)
  return { x: tab.offsetLeft, w: tab.offsetWidth, W: list.offsetWidth };
}
// getBoundingClientRect works too: x = tabRect.left − listRect.left (+ list.scrollLeft for scrolling lists),
// but it is WRONG while an ancestor is mid-transform (scale) — prefer offset* or divide by the ancestor scale.
```
Re-measure on: selection, `ResizeObserver` on the list, `document.fonts.ready` (web fonts change widths), and container-query breakpoints. Do the first placement with transitions **off** (add a `.ready` class one frame later) so the indicator doesn't fly in from 0 on load.

## 3. Underline (no radius → scale is safe)
```css
.ind { position:absolute; left:0; bottom:0; width:100px; height:2px; background:var(--accent);
       transform-origin:0 0; transition: transform .45s cubic-bezier(.4,0,.1,1); }  /* Motion's default */
```
```js
ind.style.transform = `translateX(${g.x + pad}px) scaleX(${(g.w - 2 * pad) / 100})`;  // pad = tab inner padding
```
Underline width = text width (not the hit area) looks more designed **[inferred]**: measure an inner `<span>` instead of the button.

## 4. Pill (radius → never scale it)
Either:
- **A. Clip-path overlay** (best: also fixes text colour) — `transition: clip-path .45s cubic-bezier(.4,0,.1,1)`; `round` radius is applied by the clip, so it never distorts. The overlay is `pointer-events:none; aria-hidden="true"`.
- **B. Moving pill** — `transform: translateX(x)` + `width: w px` on an absolutely positioned pill (animating `width` on one tiny out-of-flow element is cheap). Do **not** use `scaleX` on a rounded pill; the radius stretches (Motion fixes that with its border-radius corrector, vanilla doesn't).
- **C. CSS-only (progressive)**: anchor positioning — `anchor-name: --active` on the checked item, the pill `position-anchor: --active; left: anchor(left); width: anchor-size(width); transition: left .45s, width .45s`. Support **[src: MDN BCD]** Chrome 125, Safari 26, Firefox 147 — ship with A/B as fallback.

## 5. Hover highlight that follows the pointer [inferred, common dashboard pattern]
One `.hover` element behind the tabs (white/6 %, radius 8 px). On `pointerenter` of a tab: if it was hidden, place it *without* transition then fade in (150 ms); if already visible, glide (`transform`/`width` .3 s). On `pointerleave` of the list: fade out. Fine pointers only (`(hover:hover)`).

## 6. Panel height + directional content
```js
function swapPanel(oldP, newP, dir) {                     // dir = sign(newIndex − oldIndex)
  const box = panels, h0 = box.offsetHeight;
  oldP.hidden = true; newP.hidden = false;
  const h1 = box.offsetHeight;                             // natural height of the new panel
  box.style.height = h0 + 'px'; box.offsetHeight;          // lock, force style flush
  box.style.transition = 'height .45s cubic-bezier(.4,0,.1,1)';
  box.style.height = h1 + 'px';
  box.addEventListener('transitionend', () => { box.style.height = ''; box.style.transition = ''; }, { once: true });
  newP.animate([{ opacity: 0, transform: `translateX(${dir * 24}px)`, filter: 'blur(4px)' },
                { opacity: 1, transform: 'none', filter: 'blur(0)' }],
               { duration: 360, easing: 'cubic-bezier(.23,1,.32,1)' });           // [inferred]
}
```
- Optional ghost of the old panel: keep it absolutely positioned at its old offset (Motion's `popLayout` idea) and fade it **150 ms** towards `-dir`, so content never overlaps in flow.
- Always clear the explicit height when done (back to `auto`) — otherwise later content changes and resizes get clipped.
- CSS-only alternatives for the height (see `morphing-tray`): `interpolate-size: allow-keywords` (Chrome 129+ only), or the `grid-template-rows: 0fr → 1fr` trick (all modern browsers).

## 7. A11y — WAI-ARIA APG
- **Tabs**: `role="tablist"` (+ `aria-label`), each `role="tab"` button with `aria-selected`, `aria-controls`, roving `tabindex` (0 on the selected, −1 on others). Panels: `role="tabpanel"`, `aria-labelledby`, `tabindex="0"` when they hold no focusable content, `hidden` when inactive.
- Keys: **←/→** move + wrap, **Home/End** first/last. Automatic activation (select on focus) when panels show without latency; manual (Enter/Space) when a panel fetches.
- **Segmented control** that changes a value (Day/Week/Month) is a `role="radiogroup"` with `role="radio"` + `aria-checked`, same arrow keys — not tabs.
- The duplicated clip-path list is `aria-hidden="true"` and not focusable; the indicator is decoration.
- Visible `:focus-visible` ring on the real button, not on the indicator.
- **Reduced motion**: indicator jumps (`transition: none`) or fades 120 ms; panels swap with height snapping and a 150 ms fade, no slide **[inferred]**.

## Rules
- One transition curve for indicator + panel height so they land together.
- Never animate `left` on the tab text itself; only the indicator moves.
- Indicator must survive: font swap, resize, tabs added/removed, RTL (mirror `dir`), list horizontal scroll (scroll the active tab into view with `scrollIntoView({inline:'nearest', block:'nearest'})`).
- Don't attach the indicator to `:hover` alone; touch has no hover.
- Keep hit areas ≥ 44 px tall on coarse pointers even if the visual pill is 32 px.
