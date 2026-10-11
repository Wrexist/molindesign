---
name: kinetic-variable-type
description: Kinetic typography with a variable font — every other letter morphs in the OPPOSITE direction along weight/width axes (wght 1000/wdth 60 narrow-heavy vs wght 700/wdth 150 wide), driven by pointer X with a GSAP quickTo smoother, plus a "slot-machine roll" intro where each letter spins through clones. Text stays real text (readable, selectable). Use for hero headlines, big CTA buttons and menu words that should feel alive without becoming illegible. Source - matvoyce.tv (F37 Judge variable font, GSAP + split-type, verified in its JS/CSS bundles).
---

# Kinetic variable type (matvoyce.tv)

Effect: letters "stretch and snap and recombine" because neighbours trade width/weight. Total ink width stays roughly constant, so the line does not reflow wildly and stays readable. Verified: there is NO scroll-scrubbed letter morph on the site; the stretch is pointer-X driven (hover/CTA/menu) and the scroll part is a one-shot reveal (see `char-split-scroll-reveal`). Don't claim otherwise.

## Font requirement
Needs a variable font with `wght` and `wdth` axes (site: F37 Judge VF, `font-weight:100 900; font-stretch:75% 125%`; the CSS also drives a `slnt` axis at 500 - optional). Without a wdth axis the effect collapses to weight-only; use font-weight alone then. Self-host woff2, `font-display: swap`, and wait for `document.fonts.ready` before splitting (measure after the real font loads).

## Axis values (exact, from source)
| Letter parity | rest | at progress 1 |
|---|---|---|
| even index (`.isRegular`) | wght 1000, wdth 60 | wght 700, wdth 150 |
| odd index (`.isBold`) | wght 700, wdth 150 | wght 1000, wdth 60 |
Interpolate linearly: even `wght = lerp(1000→700, p)`, `wdth = lerp(60→150, p)`; odd is the mirror. `p` = pointer X inside the element, 0..1. Default (un-hovered) static state: `wght 700, wdth 100`.

## CSS
```css
.kin { --wght:700; --wdth:100; --slnt:0; }
.kin .char {
  font-family: var(--font-vf);
  font-variation-settings: "wght" var(--wght), "wdth" var(--wdth);
  /* settle after leaving: */
  transition: font-variation-settings .8s cubic-bezier(.165,.84,.44,1);   /* easeOutQuart */
  /* chars grow past their box when wide - pad + negative margin so clipping masks don't cut them */
  padding-inline: .1em; margin-inline: -.1em; padding-top: .1em;
}
.kin.is-live .char { transition: none; }          /* while pointer drives it, no CSS lag; GSAP smooths instead */
.kin .line { overflow: hidden; vertical-align: bottom; line-height: .7 }  /* mask only until intro is done */
.kin.is-done .line { overflow: visible }
```
Site details: big display text uses `line-height: 70%` on `.line` and `.char` with `padding-top:.1em` so ascenders do not clip inside the overflow mask; intro transition on `font-variation-settings` is `1.2s easeInOutQuart` (`cubic-bezier(.76,0,.24,1)`), re-settle is `.8s easeOutQuart`.

## JS skeleton (vanilla + GSAP + split-type)
```js
import SplitType from 'split-type';
import gsap from 'gsap';
const lerp = (a,b,t)=>a+(b-a)*t;

function kinetic(el, { area = el } = {}) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || !matchMedia('(pointer: fine)').matches) return;
  el.setAttribute('aria-label', el.textContent);           // split text is announced as one string
  const st = new SplitType(el, { types: 'words,chars' });
  st.chars.forEach(c => c.setAttribute('aria-hidden', 'true'));
  el.classList.add('kin');
  const s = { v: 0 };
  const apply = () => st.chars.forEach((c, i) => {
    const p = s.v, even = i % 2 === 0;
    c.style.setProperty('--wght', even ? lerp(1000,700,p) : lerp(700,1000,p));
    c.style.setProperty('--wdth', even ? lerp(60,150,p)  : lerp(150,60,p));
  });
  const to = gsap.quickTo(s, 'v', { ease: 'power3', duration: .2, onUpdate: apply });  // .2 CTA button; .4 for full-width headlines
  apply();
  area.addEventListener('mousemove', e => { const r = area.getBoundingClientRect(); to(Math.min(1, Math.max(0, (e.clientX - r.left) / r.width))); });
  area.addEventListener('mouseleave', () => to(0));
}
```
Site variants: CTA button ("contact mat") listens on the button and maps x within the button (`quickTo` duration .2). The big headline/menu variant listens on `window` mousemove and uses `clientX / innerWidth` with `quickTo` duration .4, desktop only (`isDesktop` >=1200px) and only after the intro finished.

## Slot-roll intro ("snap" in)
Each char gets a wrapper holding 3 clones (4 glyphs stacked in a column, `.wrap{display:flex;flex-direction:column;position:absolute}`), then:
```js
gsap.fromTo(chars, { yPercent: 100 }, { yPercent: -300, ease: 'power3.inOut', duration: 1.8, stagger: 0.1,
  onComplete: () => { st.split(); /* rebuild clean chars, drop clones */ el.classList.add('is-done'); } });
```
(`yPercent:0 -> -300` is used for the "on show" variant.) After it completes the clones are discarded by re-splitting, so the DOM returns to one glyph per char. Keep clones `aria-hidden`.

## Hover pop for icon/word clusters (also on site)
`gsap.to(items, { scale: 1, ease: 'bounce.out', duration: .6, stagger: { from: 'random', each: .05 } })` on enter; out: `scale: 0, ease: 'power3.out', duration: .6`, same random stagger, `overwrite: 'auto'`, `killTweensOf` first. Use sparingly, once per section.

## Accessibility and reduced motion
- Set `aria-label` on the element with the full string, `aria-hidden` on the char spans (split-type's own `aria` handling differs by version - verify with a screen reader). Never replace text with canvas/SVG paths; text must stay selectable and searchable.
- `prefers-reduced-motion: reduce`: skip the roll intro and the pointer morph; render static `wght 700 / wdth 100`. Touch / coarse pointer: no morph (there is no hover); optionally one slow auto 0->1 tween.
- Contrast and size must hold at the widest state (wdth 150). Test wrapping at both extremes; add `white-space: nowrap` per word.

## Rules / don'ts
- Alternate parity by char index so widths cancel; if you stretch all letters the same way the line reflows and readability drops.
- Do not animate `font-variation-settings` per frame via CSS transitions while pointer-driven (double smoothing = mush); drive CSS variables from one tween instead.
- Re-split on resize (ResizeObserver) and after fonts load, or line breaks are wrong.
- Keep mask `overflow:hidden` only during the intro, otherwise stretched letters get clipped.
- Cap to 1-2 kinetic elements per viewport; body copy stays static.
