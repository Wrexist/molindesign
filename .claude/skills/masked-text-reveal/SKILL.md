---
name: masked-text-reveal
description: Premium text/UI entrance animations — headline lines sliding up from an overflow mask with stagger, and blur-fade-rise for small labels and panels, with reduced-motion fallback. Use for any hero headline, chapter title, caption or spec block that should appear/disappear in sync with a scene. From amv.tarunvishwakarma.dev.
---

# Masked line reveal + blur-rise

## 1. Masked line reveal (headlines)
Each line is wrapped in an `overflow:hidden` span; the inner span translates `110% → 0%`.
```html
<span class="mask"><span class="line">No road</span></span>
<span class="mask"><span class="line">will ever <em>hold it.</em></span></span>
```
```css
.mask { display:block; overflow:hidden; padding-bottom:.12em; margin-bottom:-.12em; } /* room for descenders, no layout shift */
.line { display:block; transform:translateY(110%); transition:transform 1.1s cubic-bezier(.23,1,.32,1); }
.on .line { transform:none; }
.on .mask:nth-child(1) .line{transition-delay:.2s} .on .mask:nth-child(2) .line{transition-delay:.29s} /* stagger .09s */
```
- Enter: `1.1 s`, `ease-out-quint`, `delay = .2 + .09·i`. **Exit is faster and un-staggered**: `.35 s`, same ease (leaving should never linger).
- `em` carries the emotional phrase (italic, often `text-white/80`): "will ever *hold it.*", "Nothing on it *is there for show.*".
- Headline type: `font-size: clamp(38px, 4.9vw, 82px); line-height:.98; letter-spacing:-.03em; font-weight:400` (display, wide width axis). Giant single-word titles (VULCAN): `clamp(52px, 8.4vw, 140px); line-height:.95; font-weight:300; letter-spacing:.04em` — light weight + positive tracking for all-caps.
- **Reduced motion**: replace the `translateY` with an opacity fade (`.8 s`) — never keep the slide.
- Swapping chapter titles: use `AnimatePresence mode="wait"` (React/Motion) or run exit → then enter, so two titles never overlap.

## 2. Blur-rise (labels, spec rows, buttons, panels)
```js
// Motion/framer-motion
initial={{ opacity:0, y:12, filter:'blur(6px)' }}
animate={on ? { opacity:1, y:0, filter:'blur(0px)' } : { opacity:0, y:8, filter:'blur(4px)' }}
transition={on ? { duration:1, ease:[.23,1,.32,1], delay } : { duration:.3, ease:[.23,1,.32,1] }}
```
CSS equivalent: `opacity, transform, filter` transition 1 s ease-out-quint; exit 0.3 s.
- Stagger groups by `delay` (0.1, 0.35, 0.6, 0.8 …) so a scene's text assembles in reading order: eyebrow → title → spec table → CTA → secondary controls.
- Add `text-shadow: 0 1px 14px rgb(0 0 0 / .8)` whenever text sits over 3D/imagery (also `0 2px 24px rgb(0 0 0/.55)` for big display lines).

## 3. Rolling counters/labels
Slot-machine swap for the chapter number: wrap in `overflow:hidden`, new value enters `y:100% → 0`, old exits `0 → -100%` (`.5 s` ease-out-quint, `AnimatePresence mode="popLayout"`).

## 4. Underline-grow links
`<span class="absolute inset-x-0 bottom-.5 h-px bg-white/70 origin-left scale-x-0 transition-transform duration-300 ease-[cubic-bezier(.23,1,.32,1)] group-hover:scale-x-100 group-focus-visible:scale-x-100">`.

## Don'ts
No bounce/overshoot on text; no entrance longer than ~1.2 s; never animate `width/height/top/left` (use transform/opacity/filter); always provide the reduced-motion path.
