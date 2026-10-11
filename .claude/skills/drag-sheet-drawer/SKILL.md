---
name: drag-sheet-drawer
description: iOS-style draggable bottom sheet (Vaul pattern) — direct-manipulation drag with no transition while the finger is down, momentum close (0.4 px/ms) or 25 % distance, logarithmic damping past the open edge, snap points (fractions or px) with flick-to-skip at velocity > 2, overlay fade toward the top snap, the page behind scaling into a card ((W−26)/W, 8 px radius, 14 px down), scroll-vs-drag arbitration, handle tap to cycle snaps. 0.5 s cubic-bezier(0.32, 0.72, 0, 1). Use for mobile-first menus, filters, detail sheets and map panels. Not the right-side tabbed panel; that is slide-over-drawer. From the vaul 1.1.2 source (npm dist/index.mjs + style.css) and emilkowal.ski "Building a drawer component".
---

# Drag sheet drawer (Vaul pattern)

Source: `vaul@1.1.2` (`dist/index.mjs`, `style.css`, MIT, Emil Kowalski), built on Radix Dialog, and the article *Building a drawer component* (emilkowal.ski/ui/building-a-drawer-component). Values were read from the dist unless marked **(inferred)** or **(our addition)**. For the static right-side panel with tabs, use `slide-over-drawer`. This skill covers the physics.

## Constants (verified)
| Name | Value | Use |
|---|---|---|
| `TRANSITIONS` | `0.5s cubic-bezier(0.32, 0.72, 0, 1)` | every settle: sheet, overlay, background. Curve from Ionic, "closely matches iOS"; 500 ms mimics the iOS sheet |
| `VELOCITY_THRESHOLD` | `0.4` px/ms | flick closes (no snaps) or steps one snap |
| `CLOSE_THRESHOLD` | `0.25` | close if dragged ≥ 25 % of the visible sheet height |
| `SCROLL_LOCK_TIMEOUT` | `100` ms | after inner scroll hits the top, ignore drags this long |
| `BORDER_RADIUS` | `8` px | radius of the scaled background |
| `WINDOW_TOP_OFFSET` | `26` px | background scale = `(innerWidth − 26) / innerWidth` |
| `NESTED_DISPLACEMENT` | `16` px | parent sheet shrinks/moves up 16 px for a nested sheet |
| swipe start | `10` px touch, `2` px mouse | before the gesture is claimed; must be mostly vertical |
| handle | 32×5 px, radius 1rem, opacity .7 → 1 on hover/active; hit area `max(100%, 44px)` | tap moves to the next snap after a 120 ms double-tap guard, and closes from the last one; a press > 250 ms cancels the tap |

## Drag (direct manipulation)
- On `pointerdown`, store `pageY`, `Date` and the sheet height, then `setPointerCapture`. Ignore further presses while a drag is in progress, so a second finger can't make the sheet jump. The article shows this guard; the 1.1.2 dist handles it with pointer capture plus a `pointerStart` ref.
- On move: `dragged = startY − pageY` (positive = toward open). Set `transition:none` on the sheet and overlay, then write `transform: translate3d(0, Ypx, 0)` **directly on the element**. The article explains why not a CSS variable: inherited custom properties recalc style for every child, and drag got laggy beyond ~20 list items.
- **Past the open edge** (no snap points): `dampen(v) = 8 * (Math.log(v + 1) − 2)`, `y = Math.min(-dampen(dragged), 0)`. The sheet doesn't move for the first ≈ 6.4 px, then creeps logarithmically: ≈ 21 px at 100 px of finger travel, ≈ 30 px at 300 px. Things in real life slow down before they stop.
- `::after { top:100%; height:200%; background:inherit }` so overshoot never reveals a gap under the sheet.

## Release (no snap points)
```js
const v = Math.abs(dist) / (endTime - startTime);        // AVERAGE px/ms over the whole gesture, not instantaneous
if (draggedTowardOpen) return reset();                    // up-swipe = spring back
if (v > 0.4) return close();
if (Math.abs(currentTranslateY) >= sheetHeight * 0.25) return close();
reset();                                                  // transform → 0 with the 0.5 s curve; overlay → 1
```
`currentTranslateY` is read back from the computed matrix (`matrix(...)[5]` / `matrix3d(...)[13]`), so it is right even mid-transition.

## Snap points
- `snapPoints` are fractions of the container height (`0.5`) or px strings (`'148px'`). Px values let an input "evenly stick out on all devices." Offset (translateY) = `H − snapHeight`. The default active snap point is the first.
- While dragging: `y = activeOffset − dragged`. Vaul ignores moves above the last (largest) snap. **(Our addition)** Apply the same `dampen()` there, so the top snap feels like the no-snap sheet.
- On release:
  1. `v > 2` downward: close, or go to the first snap if not dismissible. `v > 2` upward: go to the last snap.
  2. `v > 0.4` and `|dragged| < 0.4 × viewport height`: step one snap in the drag direction. At the first snap going down, close. At the last going up, stay.
  3. Otherwise go to the closest snap to `activeOffset − dragged`.
  Each settle sets `transition: transform .5s cubic-bezier(.32,.72,0,1)` and the target transform.
- **Overlay**: `fadeFromIndex` defaults to the last snap. The overlay is only opaque at snaps ≥ `fadeFromIndex`. Dragging between `fadeFromIndex−1` and `fadeFromIndex` maps opacity linearly to the distance between them. Lower snaps are effectively non-modal (Apple Maps).
- After reaching the last snap (and right after open), dragging is ignored for 500 ms so a scrollable sheet can scroll.

## Scale the background ("the page becomes a card")
The wrapper has `data-vaul-drawer-wrapper`. While open:
```js
body.style.background = 'black';                                    // what shows around the card
wrapper.style.cssText += `transform-origin: top; overflow: hidden; border-radius: 8px;
  transform: scale(${(innerWidth - 26) / innerWidth}) translate3d(0, calc(env(safe-area-inset-top) + 14px), 0);
  transition-property: transform, border-radius; transition-duration: .5s; transition-timing-function: cubic-bezier(.32,.72,0,1);`;
```
While dragging, with `p` = fraction dragged toward closed (0..1):
`scale = s + p·(1 − s)`, `radius = 8 − 8p`, `translateY = max(0, 14 − 14p)`, overlay `opacity = 1 − p`, all with `transition:none`. On close, restore the wrapper styles and the body background after 500 ms. The article: dragging 40 % sets the radius to 60 % of max.
**(Our addition, used in the demo)** Drive the background scale with the same overlay progress, between the second-to-last and last snap, so lower snaps leave the page untouched.

## Scroll vs drag (`shouldDrag`)
Return false (let the content scroll) when any of these hold:
- the target is a `<select>` or inside `[data-vaul-no-drag]`
- text is selected
- it is < 500 ms since open or since reaching the last snap
- the sheet is fully open and the gesture goes toward open (that is a scroll)
- a scrollable ancestor has `scrollTop !== 0`
- the drag comes within 100 ms of a prevented drag at the top

Otherwise drag. Once a drag has been allowed it stays allowed until release ("there's no reason to disable dragging mid way, ever").

## Accessibility
- Vaul gets `role="dialog"`, `aria-modal`, focus trap, `Esc` and restore-focus from Radix Dialog. Re-create these if you hand-roll it, and `inert` the page behind at the modal snap.
- Vaul's handle is `aria-hidden`. **(Our addition)** Make the handle a `<button aria-label="Resize sheet">`: `ArrowUp`/`ArrowDown` step snap points, `Enter` cycles, `Esc` closes. Announce the snap with `aria-valuetext` or a live label.
- Virtual keyboard: Vaul listens to `visualViewport` `resize` and resizes the sheet so focused inputs stay above the keyboard (bottom = keyboard height; a 60 px change marks an open/close).
- Reduced motion: Vaul ships **no** `prefers-reduced-motion` rule. **(Our addition)** Keep finger-driven drag, which is direct manipulation, but settle instantly or with a ≤ 200 ms opacity fade, and skip the background scale animation.

## Don'ts
- Don't animate while the finger is down. Use `transition:none` and write the transform every move.
- Don't hard-stop at the open edge. Damp it.
- Don't measure velocity from the last frame only if you want Vaul's feel. It averages over the whole drag, so slow long drags never "flick".
- Don't drive the transform through an inherited CSS variable on a big subtree.
- Don't let a fast scroll inside the sheet turn into an accidental close. Use the 100 ms scroll lock.
