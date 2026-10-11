---
name: scroll-driven-chapters
description: Pattern for a scroll/wheel-scrubbed, chaptered 3D or video "film" — scene table, progress rail with chapter ticks, animated chapter picker, live camera telemetry (mm, f-stop, focus), per-scene instrument readouts, timed text beats, and an "explore" free-orbit mode with Esc. Use for product stories, case studies, and any non-scrolling fixed-stage site. From amv.tarunvishwakarma.dev.
---

# Scroll-driven chapters

## Model
- The page never scrolls. A fixed stage + a normalized timeline `t ∈ [0, END]`. Wheel / touch-drag / keyboard change a *target* `t`; the rendered `t` eases toward it (critically-damped) so scrubbing feels weighty. `overscroll-behavior: contain`, `touch-action: none` on the stage.
- **Single source of truth**: `SCENES = [['bay',0],['drive',t1],['door',t2],['lift',t3],['grid',t4],['mark',t5]]` (6 chapters in the reference), `END`, plus `LABELS` (hotspots), `PAINTS` (colorways). Rail ticks, picker list, `01 / 06` counter, copy beats and audio cues all derive from it.
- Engine callbacks: `onChapter(phase)` (state machine: reveal → done → … → finale), `onBeat(beatKey, scene)` (timed one-liners), `onLabel(partKey)` (which hotspot is active), `onCue(name)` (sfx), `onIdle(bool)`, `onEnd()`.
- `jump(scene)` animates `t` to a scene start; "Watch it again" = `jump('bay')`.

## Bottom HUD bar (fixed, `z-[3]`, becomes `z-[6]` while picker open)
1. **Chapter button**: orange 6 px dot · slot-roll current number `03` · `/ 06` · chevron (rotates 135° when open). `aria-expanded`, `aria-controls="chapters"`, `aria-label="Chapter 3 of 6: Green light. Choose a chapter"`.
2. **Picker** (`ul`, opens upward `bottom-full mb-4`): `min-w-[14rem] rounded-2xl border-white/10 bg-black/60 backdrop-blur-2xl p-1.5`; rows `rounded-xl px-3 py-2.5 hover:bg-white/10`, number orange for current, `aria-current="step"`. Close on outside `pointerdown` and Esc.
3. **Rail**: `h-px flex-1 bg-white/15`; progress is a child `origin-left scaleX(t/END)` written directly from the engine each frame (no React state); chapter **ticks** `h-2 w-px bg-white/35` positioned at `start/END·100 %`.
4. **Camera telemetry** (md+): `35 mm · f/2.8 · Focus 4.2 m` and a clock — refs written by the engine from the *actual* virtual camera (fov→focal length, DoF aperture, focus distance). Tabular nums so digits don't jitter. Fake-but-consistent numbers are fine; static ones are not.

## Per-scene readouts
Right column (lg+) or inline chips (mobile): `{ drive:{title:'Roll-out', rows:[['Speed','speed','km/h'],['Travelled','trav','m'],['Wheels','rpm','rpm']]}, … }`. Rows whose value key is in a `LIVE` set render an empty `<span ref>` that the engine updates per frame (speed, distance, door %, climb m/s, drops, % formed, % stirred). Static rows ("Weight 1,350 kg dry") are plain text. Titles swap with `AnimatePresence mode="wait"` + masked reveal (`masked-text-reveal`).

## Timed beats (trivia over the film)
`BEATS = { hours:['Twenty-four were built,','one for every hour of Le Mans.'], downforce:['Past 190 mph it makes','more downforce than it weighs.'], … }` — 7 short two-line captions, `aria-live="polite"`, bottom-left (`bottom-[17vh]`), `display` type `clamp(30px, 3.2vw, 54px)`, text-balance, second line italic `white/80`; enter masked, exit `.35 s` blur-out. Engine emits the key at scripted times. Good beats: a number + a vivid comparison, ≤ 9 words per line.

## Scroll/gesture hints
Bottom-center `label` text + a 36 px vertical hairline with a 12 px white segment sliding down (`y:[-12,36]`, 1.6 s easeInOut, repeat ∞; static for reduced motion). Copy by input type via CSS: `[@media(hover:none)]` → "Drag a finger through it" / "pinch to come closer", else "Run the cursor through it" / "scroll to come closer". Hints are state-gated ("Scroll to drive", "Scroll", "Loading the circuit").

## Explore mode (free look after the finale)
Finale offers `Explore the car →` and `Watch it again`. Explore: drag to orbit, scroll/pinch to dolly, paint swatches (colorways) bottom-right, "Back to the car  [Esc]" button (`kbd` chip: `rounded border border-white/20 px-1.5 text-[9px]`). Esc exits. Colorway picker: 36 px (44 px coarse) hit area around a 20 px circle with `outline-offset-[3px]`, selected = white outline; name in `aria-live="polite"` (`PAINTS[i].name`).

## Gating & sequencing
Mount each overlay with an `on` boolean derived from phase so exactly one story-layer shows at a time; hide everything (`inert`) while a drawer/spec view is open; lock engine input while the drawer is open (`engine.lock(open)`).

## Implementation hints
- Vanilla: `let target=0, t=0; addEventListener('wheel', e=>{target=clamp(target+e.deltaY*k,0,END)},{passive:true}); rAF: t += (target-t)*(1-Math.exp(-6*dt));` then call the same `render(t)` the autoplay uses.
- Keep UI refs in a mutable map (`anchors.current.rail = el`) and let the render loop write `style.transform`/`textContent` — avoids React re-render per frame.
- Always give keyboard control: ↑/↓/PageUp/Down/Space step chapters; Esc leaves modes.
