---
name: morphing-tray
description: Family-style dynamic tray — one container that morphs between content states (button → review sheet → confirm → "Sending…" pill → done) by animating its real width/height, crossfading the content inside, morphing button labels letter-by-letter where letters are shared ("Continue" → "Confirm"), and a back/close icon that morphs (✕ → ←). Covers the auto-height toolbox (measure-and-lock, grid-template-rows 0fr→1fr, interpolate-size / calc-size, ::details-content) and spring easing via CSS linear(). Use for checkout/confirm flows, multi-step actions, onboarding, compact settings — anywhere a full screen would lose context. Sources - Benji Taylor "Family Values" (benji.org/family-values, the design rules), Motion layout/AnimatePresence (motion-dom 14.1.0), vaul 1.1.2 (sheet curve), CSS spec drafts + MDN browser-compat-data (support).
---

# Morphing tray

Family publishes **design rules, not code or timings**. Rules marked **[src]** are quoted/paraphrased from Benji Taylor's article; all durations/curves are **[inferred]** unless marked otherwise.

## 1. The Family rules [src]
- Trays are transient: confirmation steps, warnings, short flows. They overlay the current screen so context is preserved; they can "emerge from within other components like buttons" and can grow into a full screen.
- **Each subsequent tray is a different height** — "this makes the progression or change unmistakably clear"; they rewrite copy to guarantee it.
- Every tray has a title + one icon. The icon dismisses the first tray and goes **back** on later ones; Family animates the chevron "from an ✕ to a ←".
- One tray = one piece of content or one primary action.
- Theme follows context (dark flow → dark tray).
- **Text morph**: label changes animate through shared letters ("the 'Con' in both Continue and Confirm"), so the user notices the step they're about to take. Constant parts of a sentence stay put; only the changing part animates.
- **No duplicates**: an element that persists into the next state must travel, never fade out and reappear as a copy.

## 2. Container morph (measure → lock → animate → release)
```js
function morphTo(tray, render) {                       // render() swaps the inner view
  const a = tray.getBoundingClientRect();               // First
  tray.style.width = tray.style.height = '';           // let it size naturally
  render();
  const b = tray.getBoundingClientRect();               // Last (natural size of the new state)
  tray.style.transition = 'none';
  tray.style.width = a.width + 'px'; tray.style.height = a.height + 'px';
  tray.offsetWidth;                                    // flush
  tray.style.transition = `width ${DUR}ms ${EASE}, height ${DUR}ms ${EASE}, border-radius ${DUR}ms ${EASE}`;
  tray.style.width = b.width + 'px'; tray.style.height = b.height + 'px';
  clearTimeout(tray._t); tray._t = setTimeout(() => {  // release to auto so inner changes still flow
    tray.style.transition = 'none'; tray.style.width = tray.style.height = ''; }, DUR + 20);
}
```
- Animate **real width/height** here, not `scale`: the tray contains text and a large radius; scaling would distort both (Motion needs its radius + child correctors precisely because it scales). One small element relayouting for ~0.5 s is cheap.
- Anchor the tray to the edge it grows from (bottom-centre: `position:absolute; bottom:16px; left:50%; translate:-50% 0`) so it unfolds upward like a sheet.
- Keep radius constant across states when you can (pill 56 px tall → `border-radius: 28px` on every state) — nothing to interpolate, nothing distorts.
- Interrupting: `getBoundingClientRect()` returns the mid-flight size, so a new `morphTo` starts from where the eye is.
- Width for pill states = content width (auto); for sheet states = `min(380px, 100% − 32px)`.

## 3. Content crossfade inside the morph [inferred]
- Old view: lifted out of flow (`position:absolute; inset:0 auto auto 0; width: oldWidth` — Motion's `popLayout` idea [src: PopChild sets `position:absolute` + measured width/height/top/left]) and faded **opacity 1→0, scale 1→.97, blur 0→2 px over 150 ms**, then removed.
- New view: `opacity 0→1, translateY(8px)→0, blur(2px)→0` over **300 ms, 90 ms delay**, `cubic-bezier(.23,1,.32,1)`.
- The container's size animation runs **450–500 ms**, longer than the content fade, so content settles inside a still-moving tray — this is what reads as "fluid" rather than "slideshow".

## 4. Easing
- iOS-sheet curve for size: **`cubic-bezier(.32,.72,0,1)`, 0.5 s** [src: vaul 1.1.2 `TRANSITIONS = { DURATION: 0.5, EASE: [0.32,0.72,0,1] }`].
- Want a touch of spring (Family feels slightly elastic) — sample a damped spring into CSS `linear()`; support **[src: MDN BCD]** Chrome 113, Safari 17.2, Firefox 112:
```js
function springLinear(stiffness = 300, damping = 26, mass = 1, steps = 48) {
  const w0 = Math.sqrt(stiffness / mass), z = damping / (2 * Math.sqrt(stiffness * mass)), wd = w0 * Math.sqrt(1 - z * z);
  const T = 6 / (z * w0);                              // envelope e^-6 ≈ 0.25 % → settled (z < 1 assumed)
  const pts = []; for (let i = 0; i < steps; i++) { const t = i / steps * T;
    pts.push((1 - Math.exp(-z * w0 * t) * (Math.cos(wd * t) + z * w0 / wd * Math.sin(wd * t))).toFixed(4)); }
  pts.push('1');
  return { easing: `linear(${pts.join(',')})`, ms: Math.round(T * 1000) };
}
const s = springLinear(); const EASE = CSS.supports('transition-timing-function', s.easing) ? s.easing : 'cubic-bezier(.32,.72,0,1)';
```
300/26/1 → ζ ≈ 0.75, ~2.8 % overshoot, settles in ~460 ms (380/30 → 2.3 %, 400 ms; 260/26 → 1.4 %, 460 ms). Keep overshoot ≤ 3 % on containers with text; use the computed `ms` as the transition duration.

## 5. Text morph (shared letters)
Key every character by `char + occurrence` (`C0 o0 n0 t0 i0 n1 u0 e0`). Between two labels:
1. Measure each current glyph span's `offsetLeft`.
2. Rebuild: reuse spans whose key exists in the new string (in new order), create spans for new keys, keep removed spans as absolutely positioned ghosts at their old `left`.
3. FLIP the reused spans: `translateX(oldLeft − newLeft) → 0`; fade/blur in new ones (`opacity 0, blur(4px), translateY(.25em)` → rest, 20 ms stagger); fade ghosts out over 180 ms then remove.
4. Duration ~**400 ms** `cubic-bezier(.23,1,.32,1)` [inferred]. "Continue"→"Confirm": `C o n` travel; `t i n u e` leave; `f i r m` enter.
- The label element gets `aria-label` = the full new string (spans are `aria-hidden`), or keep the text in a visually hidden span — screen readers must read "Confirm", not letters.
- Spaces: render as ` ` spans so widths are measurable.
- Numbers (amount counters) use the same engine with `font-variant-numeric: tabular-nums` so digits don't jitter.

## 6. Icon morph ✕ → ←
Two 2 px bars. ✕: bars at ±45° crossing in the centre. ←: same bars rotated to ±45° but shortened to ~55 % and translated to the left so they meet at a point, plus a third bar (shaft) scaling in from 0. Animate `transform` only, 300 ms. Its accessible name switches "Close" ↔ "Back".

## 7. Auto-height toolbox (pick by support)
| Technique | How | Support [src: MDN BCD] |
|---|---|---|
| Measure + lock (§2) | px → px, release to `auto` | everywhere |
| Grid rows | wrapper `display:grid; grid-template-rows:0fr; transition: grid-template-rows .4s`, open `1fr`; child `min-height:0; overflow:hidden` | animatable rows: Chrome 107, Safari 16, Firefox 66 |
| `interpolate-size: allow-keywords` | set on `:root` (inherits), then `height: 0 ↔ auto` transitions | Chrome 129; **no** Safari/Firefox |
| `calc-size(auto, size)` | `height: calc-size(auto, size)` per property | Chrome 129 only |
| `::details-content` | style the `<details>` body; combine with interpolate-size + `transition-behavior: allow-discrete` on `content-visibility` | Chrome 131, Safari 18.4, Firefox 143 |
Use interpolate-size/calc-size as enhancement only; the grid trick is the safe CSS-only default for disclosure rows inside a tray.

## 8. A11y & behaviour
- The morphing sheet is a dialog: `role="dialog"`, `aria-labelledby` its title; move focus to the primary action (or title `tabindex=-1`) when a new state mounts; **Esc** = back/close; when it collapses to the button again, focus returns to that button.
- Status pills ("Sending…", "Sent") go through a polite live region; `aria-busy` on the tray while working.
- Backdrop click and Esc must not interrupt an irreversible in-flight step (disable during "Sending…").
- **Reduced motion**: no size animation (snap), content crossfade 150 ms, text morph becomes a plain swap with fade [inferred]. Information is identical.
- Lock pointer input only for the ~100 ms swap, never for the whole animation — users can tap Back mid-morph and it retargets.

## Rules
- Each step must change height noticeably (Family). If two steps are the same height, rewrite content.
- One primary action per tray state; the button stays in the same place across steps so its label morph is visible.
- Never run size and content animations on different curves that end at different times *visibly*; size finishes last.
- Don't morph through `display:none`; keep views mounted only for the crossfade, then remove.
