---
name: device-agnostic-input-actions
description: Input layer for playable/explorable sites — gameplay reads named actions (MOVE, JUMP, SHOOT) bound to keyboard codes, gamepad axes/buttons and a touch "virtual gamepad" at once; per-frame gamepad polling with 0.1 dead-zone, auto-detected active device that swaps on-screen key/button glyphs, action maps that enable/disable per scene, and gated haptics. Use for game-like portfolios, interactive worlds, kiosks — anywhere mouse, keyboard, touch and controller must all work. From paodao.fr (read from its bundle).
---

# Device-agnostic input actions

Verified in the paodao.fr bundle (React + three.js r17x + Rapier WASM, `rapier_wasm3d_bg.wasm` found; no GSAP/Lenis). Its input module is a small Unity-style "Input System": **ActionMap → InputAction → InputBinding**. Dialogs, menus and the player all consume actions, never raw events.

## Model (as found)
- `InputAction` kinds: **button** (`onPressed/onReleased`, `isPressed`), **scalar** (`value`; picks the binding with the largest `|value|`), **vec2** (`x,y`; picks the binding with the largest magnitude, `isPressed` when `> EPSILON`).
- A single action holds many bindings, e.g. `MOVE` = WASD **+** Arrow keys **+** left analog stick. `SHOOT` = keyboard key **+** gamepad button. Winning binding = strongest, so mixed input never double-counts.
- `ActionMap` groups actions per context (one per mini-game/scene). `Enable(name)`, `Disable`, `EnableOnly([names])` — opening a dialog disables the world map; closing re-enables it. Disabling releases held actions (fires `onReleased`) so nothing sticks.
- Keyboard binding reads **`event.code`** (layout-independent: `KeyW`, `Space`, `ArrowUp`) and also `key`; held state in a Map, cleared on window blur/out. It ignores keys while an `<input>/<textarea>` is focused.
- Vec2 helpers: `WASD(KeyA,KeyD,KeyW,KeyS)`, `IJKL`, `ARROW`, `DPAD` (4 buttons → axis), `AnalogLeft/Right` (gamepad axes), `MouseMove` (**drag-relative stick**: delta from mouse-down point ÷ radius, clamped −1…1, so a mouse/touch drag acts as a joystick).
- Vec2 preprocessors: `Circular(deadzone)`, `InvertX/Y/XY`, `NormalizeVec2` — defaults: analog `{ deadzone .1, invertY true }`, keyboard/dpad `{ normalize true }` (diagonals don't move faster).

## Gamepad polling (copy this)
```js
const pads = [], pressed = new Map();                 // index -> Map(buttonIdx -> bool)
const dead = (v, d = .1) => Math.abs(v) < d ? 0 : Math.sign(v) * Math.min(1, (Math.abs(v) - d) / (1 - d));
function pollPads() {                                  // call once per frame
  pads.length = 0; for (const p of navigator.getGamepads()) if (p) pads.push(p);
  for (const p of pads) { const m = pressed.get(p.index) ?? pressed.set(p.index, new Map()).get(p.index);
    p.buttons.forEach((b, i) => { const down = b.value > .5, was = !!m.get(i);   // threshold .5 on value
      if (down !== was) { m.set(i, down); emit(down ? 'down' : 'up', p, i); } }); } }
const axis = i => pads.reduce((s, p) => s + (p.axes[i] ?? 0), 0);   // multiple pads add up
```
The dead-zone is **rescaled** (`(|v|-d)/(1-d)`), so output still starts at 0 — no jump at the threshold.

## Active-device detection → glyph swap
```js
let device = matchMedia('(pointer: coarse)').matches ? 'gamepad' : 'keyboard';   // source: IsMobile -> GAMEPAD (virtual pad)
addEventListener('keydown', () => set('keyboard')); addEventListener('mousemove', () => set('keyboard'));
setInterval(() => { for (let a = 0; a < 4; a++) if (dead(axis(a))) return set('gamepad');
                    for (let b = 0; b < 12; b++) if (anyPadPressed(b)) return set('gamepad'); }, 200);  // 5 Hz is enough
```
Every on-screen button asks its action for a readable label for the *current* device (`getReadable()`: `W`, `Space`, or a gamepad glyph image such as `images/gamepads/{up,down,left,right,jump,run,shoot,enter,escape}.webp`) and re-renders on device change. The button also **fires when its bound action is pressed**, so menus work by key/pad without a click.

## Touch = a virtual gamepad that is just another gamepad
On touch devices the app registers a `VirtualGamepad` object shaped like a real `Gamepad` (`axes`, `buttons[].value`, `index`) and pushes it into the same pad list, so **no gameplay code knows about touch**. A per-scene config (`virtualGamePadConfigId`) lists which of `A B X Y LT LB RT RB DPad ANALOG_LEFT ANALOG_RIGHT` are shown; the visible set is computed from the **currently enabled action maps**. Build the on-screen pad with `touch-action:none`, pointer events and per-pointer ids (multi-touch: stick + buttons). (The pad's DOM/drawing code was not read; the structure above is what the input module shows.)

## Haptics (gated)
`navigator.vibrate` only if: it exists, **a user gesture already happened** (one-shot `pointerdown`/`keydown` listener), and `document.visibilityState === 'visible'`. Light tick pattern in source: `[20, 40, 20]`. `vibrate(0)` stops.

## Non-linear discovery (what paodao pairs this with)
A world, not a scroll: five destinations (asset names `navigations/{island, appletree, lighthouse, shooter, skiing}`), a `#quickLinks` menu, an inventory of collectibles, per-area music loops, and a persisted quality setting (low/medium/high; default high, medium on mobile). Make every destination reachable by walking **and** by a menu shortcut. (Mini-game internals not analysed.)

## Accessibility and reduced motion
**Not in the source** (no `prefers-reduced-motion`, canvas-driven UI) — required additions:
- A "skip the game" route: plain HTML list of the same destinations (real `<a>`), first in tab order, reachable from the loader.
- Calm mode on `prefers-reduced-motion`: no camera shake/screen flash/vibration, slower camera lerp, no autoplay audio.
- Menus are real `<button>`s with `:focus-visible`; `inert` the world layer while a dialog is open (the source sets `inert` on non-live views).
- Show and allow remapping the current binding; never require rapid repetition without an alternative.
- Sound and haptics opt-in with a mute toggle (source persists music/sfx mute and volume .5).

## Rules
- One action layer; gameplay code never reads `keydown`.
- Poll gamepads every frame; button threshold `.5`, rescaled `.1` dead-zone for axes.
- Clear all held state on `blur`, tab hide and map disable.
- `event.code` for movement, `event.key` for text shortcuts.
