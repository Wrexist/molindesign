---
name: stacked-toasts
description: Sonner-style toast stack — newest toast in front, older ones tucked 14 px behind and scaled down 5 % each, the stack fans out on hover using measured heights, swipe-to-dismiss with a 45 px / 0.11 px·ms velocity rule and damped wrong-way drag, timers that pause on hover, while pressing and while the tab is hidden, promise toasts (loading → success/error), and an aria-live region with an Alt+T hotkey. Use for any app or site notification system that should feel calm and physical. From the sonner 2.0.8 source (npm dist/index.mjs + styles.css) and emilkowal.ski "Building a toast component".
---

# Stacked toasts (Sonner pattern)

Source: `sonner@2.0.8` (`dist/index.mjs`, `dist/styles.css`, MIT, Emil Kowalski) and the article *Building a toast component* (emilkowal.ski/ui/building-a-toast-component). Numbers below were read from that dist unless marked **(inferred)**. Reimplement the idea; don't paste the library.

## Constants (verified)
| Constant | Value | Meaning |
|---|---|---|
| `VISIBLE_TOASTS_AMOUNT` | `3` | toasts with `index + 1 > 3` get `opacity:0; pointer-events:none` |
| `VIEWPORT_OFFSET` / mobile | `24px` / `16px` | distance from the viewport edge (mobile = `max-width: 600px`) |
| `TOAST_LIFETIME` | `4000` ms | auto-dismiss |
| `TOAST_WIDTH` | `356` px | toaster width (full width minus 2×16 px on mobile) |
| `GAP` | `14` px | lift per stacked toast and gap when expanded |
| `SWIPE_THRESHOLD` | `45` px | dismiss distance |
| velocity | `> 0.11` px/ms | dismiss on a flick ("a number I ended up on through trial and error") |
| `TIME_BEFORE_UNMOUNT` | `200` ms | equals the exit animation |
| transitions | `transform 400ms, opacity 400ms, height 400ms, box-shadow 200ms` | no timing function, so the default `ease`. The article says it is "a bit slower than usual and uses ease rather than ease-out to make it feel more elegant" |

## Geometry: every toast is `position:absolute; bottom:0`
State lives in `data-*` attributes; CSS variables carry the numbers. For a bottom toaster `lift = -1`.
```css
.toast { --y: translateY(100%); opacity: 0; transform: var(--y);
  transition: transform .4s, opacity .4s, height .4s, box-shadow .2s; z-index: var(--z); touch-action: none; }
.toast[data-mounted=true] { --y: translateY(0); opacity: 1; }
/* collapsed stack: lift 14px per toast, scale 1 - .05·index, clamp to the FRONT toast's height */
.toast[data-expanded=false][data-front=false] {
  --y: translateY(calc(var(--i) * -14px)) scale(calc(1 - var(--i) * .05));
  height: var(--front-h); }
.toast[data-expanded=false][data-front=false] > * { opacity: 0; }   /* hide content behind */
.toast[data-visible=false] { opacity: 0; pointer-events: none; }
/* expanded (hover): sit at the measured offset */
.toast[data-mounted=true][data-expanded=true] { --y: translateY(calc(-1 * var(--offset))); height: var(--h); }
```
- `--z = toasts.length - index` so the newest is on top. `transform-origin` stays at the default centre.
- Same-height trick: in the collapsed stack every toast takes the front toast's height. Without it, toasts of different heights stick out unevenly.
- **Offset when expanded** = `index * GAP + sum(heights of the toasts in front)`.
- **Measure heights.** On mount, read `getBoundingClientRect().height` into a `heights[]` list (newest first). When content changes (a promise resolves), set `height:auto`, measure, restore the inline height, then update. `--front-h = heights[0]`.
- Gap filler: `[data-expanded=true]::after { content:''; position:absolute; left:0; bottom:100%; width:100%; height: calc(var(--gap) + 1px); }` covers the 14 px gaps, so hover doesn't flicker between toasts.

## Enter / exit
- **Enter** uses a transition, not a keyframe. Render with `data-mounted=false`, then set it to `true` after the first paint. Transitions can be retargeted when a second toast arrives mid-flight (see `interruptible-css-transitions`). `@starting-style` is the modern equivalent.
- **Exit** sets `removed=true` and freezes `--offset` at its last value. `heights` drops the toast immediately, so the others re-layout at once. The node is unmounted after 200 ms. Exit target by situation:
  - front toast: `translateY(100%)`, opacity 0 (slides back down)
  - behind, expanded: from its expanded offset, `100%` back down (`translateY(calc(-offset + 100%))`), opacity 0
  - behind, collapsed: `translateY(40%)`, opacity 0, with `transition: transform 500ms, opacity 200ms`
- Indices come from the toast array, which still holds the removed toast for those 200 ms. Offsets come from `heights`, which no longer do. That is why the expanded layout closes the gap instantly.

## Hover-to-expand, pause logic
- The list (`ol`) sets `expanded=true` on `mouseenter`/`mousemove` and `false` on `mouseleave`, unless the user is interacting. `pointerdown` on the list sets `interacting=true`, `pointerup` clears it. With 1 toast or none, `expanded` is forced to false.
- **Timer**: keep `remaining` per toast. Pause when `expanded || interacting || document.hidden`: subtract the elapsed time and clear the timeout. Resume with the remaining time. The article's point: a toast fired just before the user switched tabs would otherwise expire unseen. Loading/promise toasts and `duration: Infinity` never start a timer.

## Swipe to dismiss
```js
// pointerdown (not right-click, not loading): t0 = Date.now(); el.setPointerCapture(id); if target is a BUTTON stop here; swiping = true
// pointermove: ignore while text is selected
const dx = x - x0, dy = y - y0;
if (!axis && (Math.abs(dx) > 1 || Math.abs(dy) > 1)) axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
const damp = d => 1 / (1.5 + Math.abs(d) / 20);              // wrong-way friction
let amt = axis === 'x' ? dx : dy;
if (!allowed(axis, amt)) { const dd = amt * damp(amt); amt = Math.abs(dd) < Math.abs(amt) ? dd : amt; }
el.style.setProperty(axis === 'x' ? '--sx' : '--sy', amt + 'px');   // CSS: transform: var(--y) translate(var(--sx), var(--sy)); transition: none
// pointerup
const v = Math.abs(amt) / (Date.now() - t0);                  // average px/ms over the whole drag
if (allowed(axis, amt) && (Math.abs(amt) >= 45 || v > 0.11)) swipeOut(dir); else reset to 0px (transition returns it);
```
- Default allowed directions come from the position string. `bottom-right` allows down and right; `top-center` allows only up.
- **Wrong-way drag is damped, not blocked.** A fast flick can still pass the velocity test, but the toast is only dismissed if the direction is allowed. The article: "It's nicer than just stopping the toast immediately."
- **Swipe-out** is a 200 ms `ease-out` keyframe (`forwards`) from `var(--y) translateX(var(--sx))` to `calc(var(--sx) ± 100%)`, opacity 1→0. A keyframe is fine here because it ends in removal and is never retargeted.
- Pointer capture keeps the drag alive when the finger leaves the toast. `[data-swiping=true]::before` widens the hit area (`left/right:-100%`, `scaleY(3)`).

## Promise toast
Start as `type:'loading'`: no timer, not dismissible, spinner of 12 bars (`1.2s linear infinite`, opacity 1→.15, delays −1.2 s…−0.1 s, each `rotate(30°·i) translate(146%)`). On settle, update the same toast id to `success`/`error`. The icon enters with `scale(.8)→1, opacity 0→1, 300ms ease`, the height is re-measured, then the 4 s timer starts. An action button runs its handler and then dismisses, unless the handler calls `event.preventDefault()`.

## Accessibility (verified)
- Wrapper `<section aria-label="Notifications alt+T" tabindex="-1" aria-live="polite" aria-relevant="additions text" aria-atomic="false">`, then `<ol tabindex="-1">`, each toast `<li tabindex="0">`.
- Hotkey `Alt+T` (`altKey` + `KeyT`) expands and focuses the list. `Esc` collapses it while focus is inside. When focus leaves the list, return it to the element that had focus before.
- Close button `aria-label="Close toast"`. Don't steal focus when a toast appears.
- Sonner's reduced-motion rule is `@media (prefers-reduced-motion) { toast, toast > *, spinner { transition:none!important; animation:none!important } }`. **(Recommended)** Keep a 150 ms opacity fade rather than cutting to nothing, so arrivals still register.

## Dark theme values (verified, `theme="dark"`)
`--normal-bg #000`, `--normal-border hsl(0 0% 20%)`, hover bg `hsl(0 0% 12%)`, description `hsl(0 0% 91%)`. Toast: radius 8 px, padding 16 px, font 13 px, title weight 500 / line-height 1.5, `box-shadow 0 4px 12px rgb(0 0 0/.1)`. Action button: 24 px tall, radius 4, 12 px, inverted colours.

## Don'ts
- Don't animate the stack with keyframes. Fast repeated toasts will jump.
- Don't let the collapsed stack show mismatched heights. Clamp to the front toast's height.
- Don't block wrong-way drags. Damp them.
- Don't keep counting down while hovered, pressed or in a hidden tab.
- Don't put critical, must-act information only in a toast. It is polite and it expires.
