---
name: submenu-safe-triangle
description: Nested menus that don't snap shut when the pointer cuts diagonally toward a submenu — Radix's pointer grace area (a polygon from the exit point, with a 5 px bleed, to the submenu's near and far edges, valid for 300 ms, only while the pointer is moving toward the submenu side), 100 ms hover-open delay for sub-triggers, sibling items blocked from stealing the highlight while inside the area, keyboard ArrowRight/Enter/Space to open and ArrowLeft to close, and the Amazon "menu aim" slope variant (300 ms delay, 75 px tolerance, last 3 mouse positions). Use for context menus, nested dropdowns, mega-menus and nav flyouts. From @radix-ui/react-menu 2.1.25 (npm dist, MenuSubTrigger/MenuContentImpl) and kamens/jQuery-menu-aim (GitHub source).
---

# Submenu safe triangle (pointer grace area)

The problem: a submenu opens to the right of "Move to ▸". Your pointer heads diagonally toward its third item and crosses "Assign" on the way. Naive hover logic highlights "Assign", the submenu closes, and you miss. The fix is to accept that the pointer is **in transit** while it stays inside a triangle-ish polygon pointing at the submenu and keeps moving toward it.

## Radix implementation (react-menu 2.1.25, verified)
**Sub-trigger hover open**: `pointermove` (mouse only, via `whenMouse`) starts a **100 ms** timer → `onOpenChange(true)`. The timer is not restarted while one is pending, and `pointerleave` clears it.

**Grace area on leaving the sub-trigger** (only if the submenu content exists):
```
side  = content.dataset.side                       // 'right' (ltr) or 'left'
bleed = side === 'right' ? -5 : 5                  // move the exit point 5 px back into the trigger
near  = contentRect[side === 'right' ? 'left' : 'right']
far   = contentRect[side === 'right' ? 'right' : 'left']
area  = [ {x: clientX + bleed, y: clientY},
          {x: near, y: rect.top}, {x: far, y: rect.top},
          {x: far, y: rect.bottom}, {x: near, y: rect.bottom} ]
```
`onPointerGraceIntentChange({ area, side })`. A **300 ms** timer then clears the intent. If you dawdle, the grace expires.

**Direction gate** (`MenuContentImpl.onPointerMove`): whenever `clientX` changes inside the parent menu, `pointerDir = clientX > lastX ? 'right' : 'left'`.
`isPointerMovingToSubmenu(e) = pointerDir === intent.side && isPointInPolygon({x: clientX, y: clientY}, intent.area)`. Point-in-polygon is ray casting (even-odd).

**While moving to the submenu**:
- `onItemEnter`: `preventDefault()`, so a sibling item does **not** take focus/highlight.
- `onItemLeave`: ignored. The content doesn't steal focus back.
- `onTriggerLeave`: prevented.
- Otherwise normal hover rules apply: leaving the trigger for a sibling item focuses that sibling and closes the submenu.

**Keyboard**
- `SUB_OPEN_KEYS.ltr = ['Enter', ' ', 'ArrowRight']` (rtl uses `ArrowLeft`) on the sub-trigger opens the submenu and focuses its content/first item.
- `SUB_CLOSE_KEYS.ltr = ['ArrowLeft']` closes it and focuses the sub-trigger.
- `Esc` inside a submenu closes the **whole** menu tree (`rootContext.onClose()`).
- The sub-trigger carries `aria-haspopup="menu"`, `aria-expanded`, `aria-controls` (while open) and `data-state=open|closed`. Submenu content is `role="menu" aria-labelledby=<sub-trigger id>`.
- Typeahead (1000 ms buffer) and Home/End work per menu level.

**Submenu placement**: side `right` (ltr) with flip/shift collision handling like any popper. Tap or click on a sub-trigger opens it immediately (touch has no hover).

## Amazon "menu aim" variant (jQuery-menu-aim, verified)
- Track the last `MOUSE_LOCS_TRACKED = 3` mouse positions. When a new row is hovered while another row's submenu is open, compute slopes from the current and previous positions to the submenu's upper and lower corners.
- The corners are extended by `tolerance: 75` px above and below.
- If the pointer moves toward the submenu (the slope to the decreasing corner shrinks and the slope to the increasing corner grows), **delay activation by `DELAY = 300` ms** and re-check. Otherwise activate immediately (`0`).
- Same effect, different geometry. Radix's polygon is simpler and has no polling. Prefer it.

## Skeleton (vanilla)
```js
let intent = null, graceT = 0, dir = 'right', lastX = 0, openT = 0;
const inPoly = (p, poly) => { let ins = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i], b = poly[j];
    if ((a.y > p.y) !== (b.y > p.y) && p.x < (b.x - a.x) * (p.y - a.y) / (b.y - a.y) + a.x) ins = !ins; }
  return ins; };
const movingToSub = (e) => intent && dir === intent.side && inPoly({ x: e.clientX, y: e.clientY }, intent.area);

menu.addEventListener('pointermove', (e) => { if (e.pointerType !== 'mouse') return;
  if (e.clientX !== lastX) { dir = e.clientX > lastX ? 'right' : 'left'; lastX = e.clientX; } });

for (const item of items) item.addEventListener('pointermove', (e) => {
  if (e.pointerType !== 'mouse' || movingToSub(e)) return;   // in transit: siblings can't steal focus
  if (document.activeElement !== item) item.focus();
  if (item.dataset.sub) { if (!isOpen(item) && !openT) openT = setTimeout(() => { openT = 0; openSub(item); }, 100); }
  else closeSubs();
});
subTrigger.addEventListener('pointerleave', (e) => {
  clearTimeout(openT); openT = 0;
  const sub = subOf(subTrigger); if (!isOpen(subTrigger)) return;
  const r = sub.getBoundingClientRect(), side = sub.dataset.side, right = side === 'right';
  const near = right ? r.left : r.right, far = right ? r.right : r.left;
  intent = { side, area: [{ x: e.clientX + (right ? -5 : 5), y: e.clientY },
    { x: near, y: r.top }, { x: far, y: r.top }, { x: far, y: r.bottom }, { x: near, y: r.bottom }] };
  clearTimeout(graceT); graceT = setTimeout(() => { intent = null; }, 300);
});
```
Debug it the way the demo does: draw `intent.area` as an SVG polygon while it exists. It makes the 300 ms window and the direction gate obvious.

## Motion
Submenus use the same origin-aware enter as their parent (see `origin-aware-popovers`): origin on the edge facing the sub-trigger, `zoom 95% + 8 px slide from the left` for side `right`, ~150 ms. *(house)* Submenu exit is instant or ≤100 ms. A lingering ghost submenu while another opens looks broken. The sub-trigger keeps its highlight (`data-state=open`) while its submenu is open.

## Rules / don'ts
- Never close a submenu on a plain `mouseleave` timer alone. Use the grace area, or at least the direction check.
- Keep the 100 ms open delay. Zero makes submenus flicker when sweeping vertically past sub-triggers, and over ~150 ms feels sluggish.
- Expire the grace area (300 ms). Without expiry a parked pointer locks the menu.
- Mouse only. Touch and pen taps open submenus on click, and keyboard uses ArrowRight/ArrowLeft.
- Reduced motion: no zoom or slide, keep a short fade. The grace logic is not motion and stays on.
