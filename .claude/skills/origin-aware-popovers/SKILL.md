---
name: origin-aware-popovers
description: Dropdown menus, popovers and tooltips that grow out of their trigger — content placed on a side with flip + shift collision handling, transform-origin computed toward the trigger, data-state/data-side keyframe enter/exit (fade + zoom 95% + 8px slide from the trigger side, ~150 ms), exit animation finished before unmount, tooltip delay groups (700 ms first, instant within 300 ms of the last one closing), menus with roving focus, typeahead, Esc and focus return. Use for any app toolbar, select-like menu, share/filter popover or icon-button tooltips that should feel Linear/Raycast-grade. From Radix UI primitives (react-tooltip 1.3.0, react-popover 1.2.0, react-dropdown-menu/react-menu 2.1.25, react-popper 1.3.8, react-presence 1.1.11, read from the npm dist) and shadcn/ui new-york-v4 classes + tw-animate-css 1.4.0.
---

# Origin-aware popovers, menus and tooltips

One idea: **floating UI should look like it came out of the thing you pressed.** Position it on a side, flip and shift it to stay in bounds, scale it from the point nearest the trigger, slide it a few pixels away from the trigger, and let it finish leaving before it is removed. Everything below is read from Radix/shadcn source unless marked *(inferred)* or *(house)*.

## Verified numbers (source)
| What | Value | Where |
|---|---|---|
| Tooltip open delay | `delayDuration = 700` ms (`DEFAULT_DELAY_DURATION`) | react-tooltip `TooltipProvider` |
| Tooltip skip window | `skipDelayDuration = 300` ms | same |
| shadcn override | `TooltipProvider delayDuration = 0` (opens instantly) | shadcn `tooltip.tsx` |
| Popper defaults | `side="bottom"`, `align="center"`, `sideOffset=0`, `avoidCollisions=true`, `collisionPadding=0` | react-popper `PopperContent` |
| Tooltip default side | `top` | react-tooltip `TooltipContent` |
| shadcn offsets | dropdown and popover `sideOffset=4`; tooltip `sideOffset=0` plus a 10 px rotated-square arrow | shadcn `*.tsx` |
| Enter/exit | `animate-in` = keyframes `enter` over `var(--tw-duration, .15s) ease`; `fade-in-0` (opacity 0), `zoom-in-95` (scale .95), `slide-in-from-top-2` (translateY −0.5rem = −8 px) | tw-animate-css 1.4.0 |
| Side → slide | `data-[side=bottom]:slide-in-from-top-2`, `top → from-bottom-2`, `left → from-right-2`, `right → from-left-2` | shadcn |
| Exit | `data-[state=closed]:animate-out fade-out-0 zoom-out-95` (no slide on exit) | shadcn |
| Menu typeahead reset | `1000` ms after the last character; a repeated single character (`"bbb"`) cycles the items starting with `b` | react-menu `getNextMatch` |

### Collision order (react-popper)
Floating UI middleware, in this order: `offset({ mainAxis: sideOffset + arrowHeight, alignmentAxis: alignOffset })` → `shift({ mainAxis: true, crossAxis: false, limiter: limitShift() })` (slide along the trigger edge) → `flip()` (swap to the opposite side if it overflows) → `size()` (writes `--radix-popper-available-width/height`, used by shadcn as `max-h-(--radix-dropdown-menu-content-available-height)`) → `arrow` → `transformOrigin` → `hide`. Strategy is `fixed`. The placed side and align land on the content as `data-side` and `data-align`, and every CSS hook keys off those.

### Transform origin (react-popper `transformOrigin` middleware)
Exposed as `--radix-popper-transform-origin` and renamed per primitive (`--radix-dropdown-menu-content-transform-origin`, `--radix-popover-content-transform-origin`, `--radix-tooltip-content-transform-origin`). shadcn applies it with `origin-(--radix-…-transform-origin)`.
- side `bottom`: `x = arrow centre px` (or `{start:0%, center:50%, end:100%}[align]` when there is no arrow), `y = -arrowHeight px`
- side `top`: same x, `y = contentHeight + arrowHeight px`
- side `right`: `x = -arrowHeight px`, y = arrow centre (or align %)
- side `left`: `x = contentWidth + arrowHeight px`, same y

So the origin sits on the edge facing the trigger, at the arrow tip. *(inferred)* Without an arrow, Radix falls back to the align percentage, so content that `shift` slid sideways scales from the wrong point. Fix it by computing the origin as the trigger's centre projected onto the near edge, clamped to the content box. The skeleton does this.

### Exit before unmount (react-presence)
A three-state machine: `mounted → unmountSuspended → unmounted`.
- On close, read the computed `animation-name`. If it is `none` (or `display:none`), unmount at once. If it **changed** from the open animation, enter `unmountSuspended` and keep the node.
- Unmount on `animationend`/`animationcancel` only when `event.target === node` and the event's `animationName` is the current one (bubbling child animations are ignored).
- Just before removal it sets `animationFillMode = 'forwards'` for one tick, so the last frame doesn't flash back to the open state.
- Reopening during `unmountSuspended` sends `MOUNT` and keeps the same node. Use **CSS keyframes, not transitions**: `animationend` plus the name check is what makes this reliable.

### Tooltip delay group (react-tooltip, exact logic)
- Provider holds `isOpenDelayed = true`. When any tooltip opens it becomes `false`. When one closes, a 300 ms timer sets it back to `true`.
- Trigger `pointermove` (ignored for `pointerType === 'touch'`): if `isOpenDelayed`, start a 700 ms timer, else open now. `pointerleave` cancels the timer.
- `data-state` is `closed | delayed-open | instant-open`, so CSS can tell a slow first reveal from a sweep along a toolbar.
- Opening any tooltip dispatches `document` event `tooltip.open`. Every open tooltip closes on it, so **only one is ever visible**.
- `focus` opens immediately (no delay) unless the focus came from a pointerdown. `blur`, `pointerdown` and `click` close it. So do Esc (DismissableLayer) and scrolling any ancestor of the trigger.
- `role="tooltip"` with an id. The trigger gets `aria-describedby` **only while open**.
- Hoverable content (the default): on leave, build a convex hull from the exit point (padded 5 px) and the other element's rect corners. Stay open while the pointer is inside it (`isPointInPolygon`). Set `disableHoverableContent` for plain label tooltips.

### Dropdown menu (react-dropdown-menu / react-menu)
- Trigger: opens on **`pointerdown`** (button 0, no ctrlKey), not click. That is why menus feel instant. `Enter`/`Space` toggle, `ArrowDown` opens. `aria-haspopup="menu"`, `aria-expanded`, `aria-controls` while open. `modal` defaults to `true` (outside pointer events blocked, scroll locked).
- Items are `role="menuitem"` with `tabindex=-1`. **Real focus moves to the item** (roving focus), and the highlighted one gets `data-highlighted`. A mouse `pointermove` focuses the item and `pointerleave` focuses the content. Highlight is a background swap with **no transition**: menus must not lag the pointer.
- On the content: `ArrowDown/PageUp/Home` focus the first item, `ArrowUp/PageDown/End` the last. `Tab` is prevented, character keys go to typeahead, Esc closes and focus returns to the trigger. `loop` is off by default.

### Popover (react-popover)
`modal` defaults to `false`. Trigger has `aria-haspopup="dialog"` and `aria-expanded`. Content is `role="dialog"`, focus moves into it on open and back to the trigger on close. Esc and an outside pointerdown dismiss it.

## Motion recipe
```css
.pop { transform-origin: var(--origin); animation: pop-in var(--d-in,150ms) var(--ease-in-curve, ease) both; }
.pop[data-state=closed] { animation: pop-out var(--d-out,150ms) ease both; }
.pop[data-side=bottom] { --sx:0; --sy:-8px; } .pop[data-side=top]   { --sx:0; --sy:8px; }
.pop[data-side=right]  { --sx:-8px; --sy:0; } .pop[data-side=left]  { --sx:8px; --sy:0; }
@keyframes pop-in  { from { opacity:0; transform: translate(var(--sx),var(--sy)) scale(.95); } }
@keyframes pop-out { to   { opacity:0; transform: scale(.95); } }
.tip[data-state=instant-open] { animation: none; }               /* (house) a sweep across a toolbar reads as one tooltip moving */
@media (prefers-reduced-motion: reduce) { .pop, .pop[data-state=closed] { animation-name: fade-in-only; } } /* keep a 100 ms opacity-only fade */
```
*(house)* The shadcn defaults (150 ms `ease` both ways) are verified. A slightly crisper feel uses enter `160ms cubic-bezier(.23,1,.32,1)` and exit `120ms ease`, with exit faster than enter. Tooltips scale from `.96`, not `.95`, because they are small.

## Skeleton (vanilla)
```js
// place content on a side of trigger inside a boundary rect; flip, then shift; returns side + origin
function place(trigger, content, boundary, { side = 'bottom', align = 'center', offset = 4, pad = 8 } = {}) {
  const b = boundary.getBoundingClientRect(), t = trigger.getBoundingClientRect();
  const w = content.offsetWidth, h = content.offsetHeight;           // offset* ignores the scale transform
  const opp = { top:'bottom', bottom:'top', left:'right', right:'left' };
  const room = { top: t.top - b.top, bottom: b.bottom - t.bottom, left: t.left - b.left, right: b.right - t.right };
  const need = (s) => (s === 'top' || s === 'bottom' ? h : w) + offset + pad;
  if (room[side] < need(side) && room[opp[side]] > room[side]) side = opp[side];          // flip
  const vert = side === 'top' || side === 'bottom';
  let x, y;
  if (vert) { y = side === 'bottom' ? t.bottom + offset : t.top - offset - h;
    x = align === 'start' ? t.left : align === 'end' ? t.right - w : t.left + t.width / 2 - w / 2; }
  else { x = side === 'right' ? t.right + offset : t.left - offset - w;
    y = align === 'start' ? t.top : align === 'end' ? t.bottom - h : t.top + t.height / 2 - h / 2; }
  x = Math.min(Math.max(x, b.left + pad), b.right - pad - w);                             // shift
  y = Math.min(Math.max(y, b.top + pad), b.bottom - pad - h);
  const cx = Math.min(Math.max(t.left + t.width / 2 - x, 0), w), cy = Math.min(Math.max(t.top + t.height / 2 - y, 0), h);
  const origin = vert ? `${cx}px ${side === 'bottom' ? 0 : h}px` : `${side === 'right' ? 0 : w}px ${cy}px`;
  content.style.left = x - b.left + 'px'; content.style.top = y - b.top + 'px';          // absolute inside boundary
  content.style.setProperty('--origin', origin); content.dataset.side = side; content.dataset.align = align;
}
// presence: show now, hide after the exit keyframes finish (or at once if there are none)
function present(node, open) {
  clearTimeout(node._t);
  if (open) { node.hidden = false; node.dataset.state = 'open'; return; }
  node.dataset.state = 'closed';
  const name = getComputedStyle(node).animationName;
  if (name === 'none') { node.hidden = true; return; }
  const done = (e) => { if (e && (e.target !== node || !name.includes(e.animationName))) return;
    node.removeEventListener('animationend', done); if (node.dataset.state === 'closed') node.hidden = true; };
  node.addEventListener('animationend', done); node._t = setTimeout(done, 400);             // safety net
}
// tooltip delay group
const group = { delayed: true, skipT: 0, current: null };
function tooltip(trigger, tip, { delay = 700, skip = 300 } = {}) {
  let t = 0;
  const open = (instant) => { group.current && group.current !== close && group.current();
    group.current = close; clearTimeout(group.skipT); group.delayed = false;
    tip.hidden = false; place(trigger, tip, stage, { side: 'top', offset: 6 });
    tip.dataset.state = instant ? 'instant-open' : 'delayed-open'; trigger.setAttribute('aria-describedby', tip.id); };
  function close() { clearTimeout(t); if (group.current !== close) return; group.current = null;
    trigger.removeAttribute('aria-describedby'); present(tip, false);
    clearTimeout(group.skipT); group.skipT = setTimeout(() => group.delayed = true, skip); }
  trigger.addEventListener('pointermove', (e) => { if (e.pointerType === 'touch' || t || group.current === close) return;
    if (group.delayed) t = setTimeout(() => { t = 0; open(false); }, delay); else open(true); });
  trigger.addEventListener('pointerleave', () => { clearTimeout(t); t = 0; close(); });
  trigger.addEventListener('pointerdown', close);
  trigger.addEventListener('focus', () => trigger.matches(':focus-visible') && open(true));
  trigger.addEventListener('blur', close);
}
```
Menu keyboard: on open by keyboard focus the first item (by pointer, focus the content). On `keydown` in the content: arrows move `focus()` among `[role=menuitem]:not([aria-disabled=true])`, `Home/End` jump, printable characters feed a typeahead buffer cleared after 1000 ms, `Enter/Space` activate, `Esc`/`Tab` close, and focus goes back to the trigger.

## Accessibility
- Menu: trigger `aria-haspopup="menu" aria-expanded aria-controls`. Content `role="menu" aria-labelledby=trigger`, items `role="menuitem"` (`menuitemradio` + `aria-checked` for a status picker). Popover: `role="dialog"` with an accessible name. Tooltip: `role="tooltip"`, linked by `aria-describedby` only while open. Never put interactive content in a tooltip.
- Icon-only buttons still need `aria-label`. The tooltip is a visual extra, not the name.
- Touch: tooltips never open from touch (Radix ignores `pointerType === 'touch'`), so anything important must be visible or in the label.
- Reduced motion: drop the zoom and slide and keep a ≤100 ms opacity fade. The presence logic still runs; with `animation: none` it unmounts immediately.

## Rules / don'ts
- Always use a computed origin. Scaling from `center` makes a dropdown look like it pops out of thin air.
- Slide **away from** the trigger (bottom side → start 8 px higher). Never slide toward it.
- Exit faster than enter, and never longer than ~150 ms. Nobody waits for a menu to leave.
- Don't transition the item highlight, and don't use `:hover` for menu highlight. Use focus/`data-highlighted` so mouse and keyboard share one state.
- Open dropdowns on `pointerdown` like Radix, which does this for every pointer type. It feels instant. *(house)* Use `click` for touch, so a scroll that starts on the trigger doesn't open the menu.
- Keep one tooltip on screen at a time. Skip the enter animation when `instant-open`.
- Re-place on resize/scroll while open (Radix uses Floating UI `autoUpdate`). Close tooltips on scroll.
