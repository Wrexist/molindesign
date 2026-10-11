---
name: animated-number-flow
description: NumberFlow-style animated numbers — Intl.NumberFormat parts split into keyed digit wheels and symbols, each digit spins by the shortest (or trend-forced) path, new digits roll in from 0 and fade, leaving digits roll to 0 and fade, the whole number FLIPs when its width changes, rapid updates add up instead of jumping, and the element carries a role="img" label with the formatted string. Use for prices, counters, stats, timers, plan pickers and dashboards where a changing number should feel alive but stay readable. From number-flow 0.6.2 (dist/lite.mjs, ssr chunk, plugins.mjs read on unpkg) and the docs at number-flow.barvian.me by Maxwell Barvian.
---

# Animated number flow

Source: `number-flow@0.6.2` (vanilla custom element; `@number-flow/react@0.6.2` wraps the same core). Everything marked **[src]** was read in `dist/lite.mjs`, `dist/ssr-*.mjs`, `dist/plugins.mjs`; **[docs]** is from number-flow.barvian.me/vanilla; **[lib]** is this library's own choice or inference. Credit: Maxwell Barvian (digit looping after Sam Selikoff, edge mask after Artur Bień, idea from the Family app).

## The model [src]
1. **Format, then split.** `new Intl.NumberFormat(locales, format).formatToParts(value)`, optional `numberPrefix`/`numberSuffix` pushed as parts. Parts go into four sections: `pre` (currency, sign, literals before the number), `integer`, `fraction` (decimal + fraction digits), `post` (suffix, `%`, unit).
2. **Key by position, not index.** Integer digits are keyed `integer:n` and carry `pos` = place value counted from the ones digit (`342.5` → 3=pos 2, 4=pos 1, 2=pos 0, 5=pos −1). Group separators, the decimal and symbols are keyed `type:count`. Keying from the ones digit means `999 → 1,000` keeps the three right-hand wheels and *adds* a wheel and a separator on the left.
3. **A digit is a wheel.** Each digit holds every numeral `0..max` (`max` = 9, or `digits[pos].max`, e.g. `{1:{max:5}}` for the tens of seconds so `59 → 00` rolls forward). Only the current numeral is in flow; the rest are `inert`, absolutely stacked, and `display:none` unless the wheel is spinning.
4. **Offset in CSS.** `c = current + d` where `d` is an animated registered property. Each numeral `n` sits at `offset = wrap(n − c)` into `[−L/2, L/2)` and `translateY(clamp(-100%, offset·100%, 100%))`: the visible one at 0, its neighbours just above/below, everything else parked at ±100% behind the mask.
5. **Spin delta** (`getDelta`, with `L` = wheel length and `trend`):
   ```js
   const diff = value - prev, dir = trend || Math.sign(diff);
   if (dir < 0 && value > prev) return value - L - prev;   // forced down, wrap
   if (dir > 0 && value < prev) return L - prev + value;   // forced up, wrap
   return diff;
   ```
   The spin animates `d` from `-delta → 0`. Default `trend = (old, v) => Math.sign(v - old)`: the whole number rolls up when it grows, down when it shrinks. `trend: 0` = each digit takes its own direction; `+1`/`-1` force it [docs].
6. **Enter / exit.** New digits are created at **0** and spin to their value while fading in; removed digits are `inert`, pinned with `position:absolute` at their last offset, **spin to 0** and fade out, and are deleted on `animationsfinish`. Symbols that change (`$`→`€`, `+`→`−`) cross-fade inside one slot with `mix-blend-mode: plus-lighter`.
7. **Layout FLIP.** Before the update every section/digit/symbol measures its offset from its justified edge (integer + pre justify right, fraction + post left); after it, each moved piece animates `translateX(prev − now) → none`. The whole number animates its width as `scaleX` while the inner span counter-scales, so glyphs never stretch.
8. **Interruptible by addition.** Every animation is WAAPI with `composite: 'accumulate'`. A second update during a spin adds a new `-delta→0` on top; the wheel never jumps back.

## Timings [src]
| what | value |
|---|---|
| `transformTiming` (FLIP + width) | **900 ms**, `linear(0,.005,.019,…,.9989,1)`: a 90-point spring-like curve without overshoot; it is at 50% by ~172 ms, 90% by ~384 ms, 99% by ~647 ms [lib: sampled] |
| `spinTiming` | falls back to `transformTiming` |
| `opacityTiming` (enter/exit, symbol cross-fade) | **450 ms `ease-out`** |
| edge mask | `--number-flow-mask-height: .25em` (also the vertical padding), `--number-flow-mask-width: .5em` |
| line-height | `1` default; the docs' own examples use **.85** to tighten the wheel [docs] |

So it reads fast (half-way in ~170 ms, inside Emil's "under 300 ms" feel) while the tail settles softly. The docs show `{ duration: 700 }` / `{ duration: 350, easing: 'ease-out' }` as override examples [docs].

## When it does not animate [src]
`computedAnimated = canAnimate && animated && !(respectMotionPreference && prefers-reduced-motion) && el has size && document.visibilityState === 'visible'`. `canAnimate` needs `linear()` easing, CSS `mod()` and `CSS.registerProperty`. Otherwise the value swaps instantly. Keep that: **reduced motion = no spin, same text**.

## Accessibility
- [src] The host gets `ElementInternals.role = "img"` and `ariaLabel = valueAsString` (the full formatted string, prefix/suffix included). Screen readers read `"$1,249.00/mo"`, never the 40 stacked numerals. SSR output also renders `role="img" aria-label=…`.
- [lib] It does not announce changes. If the change matters (price after picking a plan), mirror it into a visually hidden `aria-live="polite"` element with a sentence ("Total 1,249 dollars per month"), debounced ~300 ms so a spin of rapid clicks reads once.
- [lib] Mark the visual wheels `aria-hidden="true"` in a home-grown version; every hidden numeral must be `inert` so it can't be found by find-in-page or focus.

## Options worth knowing [docs]
`format` (any `Intl.NumberFormatOptions`, e.g. `{style:'currency',currency:'USD',trailingZeroDisplay:'stripIfInteger'}`, `{notation:'compact'}`, `{style:'percent',signDisplay:'always',maximumFractionDigits:2}`), `locales`, `numberPrefix`/`numberSuffix`, `trend`, `digits`, `animated`, `respectMotionPreference`, `plugins: [continuous]`. The `continuous` plugin makes unchanged lower digits do a full turn in the trend direction when a higher digit changes (`19 → 20` passes visually through the in-between values); it does nothing when `trend` is 0. `<number-flow-group>` batches measure/animate for numbers that push each other (price + % change on one line). `data-will-change` adds `will-change: transform` only for numbers that change constantly. Not supported: scientific/engineering notation, non-Latin digits, RTL.

## Vanilla skeleton [lib reimplementation, no shadow DOM, no registered props]
```js
const EASE = [0,.005,.019,.039,.066,.096,.129,.165,.202,.24,.278,.316,.354,.39,.426,.461,.494,.526,.557,.586,.614,.64,.665,.689,.711,.731,.751,.769,.786,.802,.817,.831,.844,.856,.867,.877,.887,.896,.904,.912,.919,.925,.931,.937,.942,.947,.951,.955,.959,.962,.965,.968,.971,.973,.976,.978,.98,.981,.983,.984,.986,.987,.988,.989,.99,.991,.992,.992,.993,.994,.994,.995,.995,.996,.996,.9963,.9967,.9969,.9972,.9975,.9977,.9979,.9981,.9982,.9984,.9985,.9987,.9988,.9989,1];
const ease = t => { const x = Math.min(t,1)*(EASE.length-1), i = Math.floor(x); return i >= EASE.length-1 ? 1 : EASE[i]+(EASE[i+1]-EASE[i])*(x-i); };
// additive tracks: each change pushes {from, t0}; value = Σ from·(1 − ease(age/900))
const track = () => ({ list: [], add(from, now){ if (from) this.list.push({from, t0: now}); },
  value(now){ let s = 0; this.list = this.list.filter(a => { const k = (now-a.t0)/900; if (k >= 1) return false; s += a.from*(1-ease(k)); return true; }); return s; } });

function parts(value, fmt, prefix='', suffix='') {          // keyed parts, integer pos from the ones digit
  const raw = fmt.formatToParts(value); if (prefix) raw.unshift({type:'prefix',value:prefix}); if (suffix) raw.push({type:'suffix',value:suffix});
  const out = [], seen = {}, key = t => t + ':' + (seen[t] = (seen[t] ?? -1) + 1);
  const ints = raw.filter(p => p.type === 'integer').map(p => p.value).join('').length;
  let pos = ints, frac = 0;
  for (const p of raw) {
    if (p.type === 'integer') for (const ch of p.value) { pos--; out.push({ key: 'i' + pos, digit: true, pos, value: +ch }); }
    else if (p.type === 'fraction') for (const ch of p.value) { frac--; out.push({ key: 'f' + frac, digit: true, pos: frac, value: +ch }); }
    else if (p.type === 'group') out.push({ key: 'g' + pos, value: p.value });      // named by the digit on its left: the thousands separator is always g3
    else out.push({ key: p.type === 'minusSign' || p.type === 'plusSign' ? 'sign' : key(p.type), value: p.value });
  }
  return out;
}
// wheel render: numeral n of a wheel at continuous position c (L = 10)
function placeWheel(nums, c, L = 10) {
  nums.forEach((el, n) => { let o = ((n - c) % L + L) % L; if (o >= L/2) o -= L;
    el.style.transform = `translateY(${Math.max(-1, Math.min(1, o)) * 100}%)`; el.style.visibility = Math.abs(o) < 1 ? '' : 'hidden'; });
}
```
Update flow: measure every live char's `getBoundingClientRect().left` → reconcile keys (reuse, create at value 0, mark leavers) → reorder DOM → measure again → `x.add(prevLeft − newLeft)` per char, `spin.add(-getDelta(...))` per digit, WAAPI opacity `0→1` / `1→0` at 450 ms ease-out for entering/leaving → one rAF that paints `translateX(x.value)` and `placeWheel(value + spin.value)` until all tracks are empty. Leavers get `position:absolute; left:` their last offset and are removed when their fade ends. Mask the number with `mask-image: linear-gradient(to bottom, transparent, #000 .25em, #000 calc(100% - .25em), transparent)` plus `.25em` vertical padding.

## Style rules
- `font-variant-numeric: tabular-nums` always; `line-height` .85–1; `white-space: nowrap`.
- Prefix/suffix smaller and muted (`::part(suffix){ font-size:.75em; color: var(--muted) }` is the docs' example). Don't put backgrounds or borders on the number itself; they don't scale smoothly during the width FLIP [docs].
- One trend per meaning: money up = digits up. For a value that oscillates without meaning (a random shuffle, a timer reset), use `trend: 0`.
- Pair a delta badge (`+4.2%`, `signDisplay:'always'`) and show direction with text or an arrow too, not color alone.

## Don'ts
- Don't tween the numeric value (counting through 1,000 intermediate numbers): unreadable, and screen readers would get noise. Spin wheels and swap the label once.
- Don't animate on the first render or while the element is hidden or zero-sized; NumberFlow skips both.
- Don't animate numbers the user types or steps with the keyboard many times a second, e.g. a quantity field held on ArrowUp (see `ui-motion-principles`: frequency rule). A stepper button is fine.
- Don't use it for scientific notation or RTL digits.
- Related: `premium-micro-details` (spring digit columns, tabular numerals), `cinematic-loader` (rolling 000–100 counter), `button-state-morphs` (width-stable labels).
