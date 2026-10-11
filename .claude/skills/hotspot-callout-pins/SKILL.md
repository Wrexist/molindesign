---
name: hotspot-callout-pins
description: Annotation callouts pinned to points on a 3D model/video — glowing orange dot, hairline leader that draws out, blurred-rise text with numbered title, auto-flip to left/right side, plus a big pulsing "call to action" hotspot (e.g. "Open the door"). Use for product breakdowns/anatomy views. From amv.tarunvishwakarma.dev.
---

# Hotspot callout pins

## Anatomy of a pin
A zero-size fixed container (`fixed top-0 left-0 h-0 w-0 pointer-events-none`, initially `visibility:hidden`) that the **engine moves each frame** via `transform: translate3d(x,y,0)` (projected from a 3D anchor) and shows/hides by `data-side="l|r"` + `visibility`. React renders only the contents.
Inside (Motion):
1. **Dot** — `10×10 rounded-full border border-white/80 bg-orange-500/90 shadow-[0_0_12px_rgb(249_115_22/.7)]`, centred (`-5px`).
2. **Leader line** — `h-px bg-white/80 origin-left`, `width: 72px`, `scaleX 0→1` over `.5 s ease-out-quint`; for `data-side=l` flip origin to right and anchor `right-0`. Give it a faint dark shadow `0 0 6px rgb(0 0 0/.6)` to survive bright frames.
3. **Text** — positioned at `left-[84px] bottom-3` (mirrored for left side), `w-[min(280px, calc(var(--room,380px) − 100px))]` — the engine sets `--room` so copy never runs off-screen. Fade-up with blur (`delay .15`). Title row: orange number + part name in `label` style (`01 Engine`); body 15 px / 1.5, `white/90`; `text-shadow: 0 1px 14px rgb(0 0 0/.75)`.
4. Exit: opacity 0 in `.25 s` (`AnimatePresence`).

## Copy pattern (one fact, one sentence, a contrast)
```
01 Engine   Front-mid and naturally aspirated: no turbos to soften it.
02 Brakes   Carbon-ceramic discs behind every wheel.
03 Chassis  One carbon-fibre tub, and a carbon body over it.
04 Aero     Wing, splitter and diffuser, pressing it into the track.
```
Order follows the camera path (front→back) so each callout appears as the camera passes the part; only **one pin active at a time** (`onLabel(key|null)`).

## CTA hotspot (interactive pin)
`<button>` 56 px circle (`border-white/50 bg-black/30 backdrop-blur-md`, hover border white), inside: ping ring (`animate-ping`, `border-orange-500/60`, `[animation-duration:2.2s]`, `motion-reduce:hidden`) + 10 px orange dot with `0 0 14px rgb(249 115 22/.9)` glow; label to the right ("Open the door", `label` style, text-shadow). Enter `scale .9→1, blur 6→0` (`.7 s`), `whileTap: scale .95`. Clicking calls `engine.openDoor()`. Keep ≥ 44 px target.

## Rules
- Pins are `aria-hidden` when inactive; the active text is real DOM (selectable, translatable).
- Don't use boxes/cards behind pin text; rely on text-shadow + the vignette (`hud-cinematic-ui`).
- Cap simultaneous labels at 1; fade previous out before next in.
- Provide the same facts in the Specification drawer for non-visual access.
