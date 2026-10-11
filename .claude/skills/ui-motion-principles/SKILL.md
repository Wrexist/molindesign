---
name: ui-motion-principles
description: A concise rulebook for product-UI motion (apps, dashboards, menus, buttons, not cinematic hero scenes) — purpose and frequency first (never animate keyboard-initiated or hundred-times-a-day actions), durations (≤ 200–300 ms), ease-out for enter/exit with real custom curves, transform-origin at the trigger, never scale from 0, transitions over keyframes for anything interruptible, transform/opacity only, tooltip delay rules, blur-bridged crossfades, theme-switch and hover hygiene, reduced motion. With observed timing tokens from Linear, Vercel Geist and rauno.me. Use as the checklist before and after adding any UI animation. Sources - emilkowal.ski (7 practical animation tips, Great animations, You don't need animations), rauno.me "Invisible details of interaction design", interfaces.rauno.me, vercel.com/design/guidelines, linear.app + vercel.com/geist CSS.
---

# UI motion principles

Labels: **[src]** stated in a named article/guideline; **[obs]** read from the site's shipped CSS (Oct 2026); **[lib]** this library's inference. This is the rulebook; the deep dives live in siblings: `interruptible-css-transitions` (transitions vs keyframes, mounted flag, drag hand-off), `origin-aware-popovers` (computed origins, tooltip groups), `button-state-morphs` (press/async/copy/hold), `animated-number-flow`, `premium-micro-details` (site-wide polish). Cinematic marketing pages follow `immersive-site-playbook` instead; their 0.6–1.1 s entrances are not UI timings.

## 0. Decide whether to animate at all
1. **Purpose.** Animate only when motion explains cause and effect, keeps spatial continuity, gives feedback, or adds deliberate, rare delight [src: Vercel "Necessity check"; Emil "Great animations have a purpose"].
2. **Frequency rule.** The more often an action happens, the less it should animate. Raycast opens with no animation "and it feels right" [src: Emil]; macOS right-click menus appear with no motion and only fade out [src: Rauno essay + interfaces.rauno.me]; Rauno removed list add/remove and highlight motion from bmrks.com after days of use because it felt sluggish [src: Rauno]. Interfaces list: right-click menu, deleting/adding list items, hovering trivial buttons → no extraneous animation [src: interfaces.rauno.me].
3. **Keyboard-initiated actions: never animate** (arrow-key highlight, ⌘K open, tab switching by key, focus moves) [src: Emil "You don't need animations"]. Peripheral input feels mechanical; on-screen motion after a key press reads as lag [src: Rauno].
4. **Instant in, soft out** for highlights: Linear's tokens are `--speed-highlightFadeIn: 0s; --speed-highlightFadeOut: .15s` [obs]. The thing you point at responds now; what you leave fades.

## 1. Duration
| context | value |
|---|---|
| general UI | **< 300 ms** [src: Emil]; "≤ 200 ms for interactions to feel immediate" [src: interfaces.rauno.me] |
| dropdown/select | 180 ms feels responsive, 400 ms sluggish (Emil's side-by-side) [src] |
| press/hover/color | Linear `.16s` buttons, `--speed-quickTransition: .1s`, `--speed-regularTransition: .25s` [obs]; rauno.me `150ms ease-out` [obs]; Geist/Tailwind default `.15s` [obs] |
| popover / overlay | Geist `--ds-motion-popover-duration: .2s`, `--ds-motion-overlay-duration: .3s` [obs] |
| toast / sheet (rarer, larger) | Sonner `400ms ease`, Vaul `.5s cubic-bezier(.32,.72,0,1)` (see `interruptible-css-transitions`) |
| exit | shorter than enter [lib, matches `premium-micro-details`] |
A faster spinner makes the same load feel faster [src: Emil]. Marketing pages may go longer; product UI may not.

## 2. Easing
- **Enter and exit: ease-out** (starts fast = responsive). Same 300 ms with ease-in feels slower; ease-in "is just not made for UI" [src: Emil tip #4].
- Built-in keywords are weak; use custom curves [src: Emil]. Tokens Linear ships [obs]: `--ease-out-quad cubic-bezier(.25,.46,.45,.94)` (hover/press), `--ease-out-quint cubic-bezier(.23,1,.32,1)` (this library's default ease), `--ease-out-expo cubic-bezier(.19,1,.22,1)`, `--ease-in-out-quart cubic-bezier(.77,0,.175,1)`. rauno.me `--transitions-snappy: cubic-bezier(.2,.8,.2,1)` [obs]. Geist `--ds-motion-timing-swift: cubic-bezier(.175,.885,.32,1.1)` (slight overshoot, overlays only) [obs].
- **On-screen A → B moves** (an element already visible changing position): ease-in-out [lib, Emil only compares built-in vs custom ease-in-out].
- **Springs / `linear()`** for anything physical or gesture-driven; NumberFlow ships its spring as a 90-point `linear()` over 900 ms [src: number-flow]. Bounce only where the object is physical; never on press.
- Match the product's tone (Sonner's slower `ease` is intentional) [src: Emil].

## 3. Origin and scale
- **`transform-origin` at the trigger.** Default `center` "is wrong in most cases" for popovers; Radix/Base UI expose `--radix-…-transform-origin` / `--transform-origin` [src: Emil tip #5]. Modals with no trigger can scale from center [lib]. Vercel: "Anchor motion to where it physically starts" [src].
- **Never from `scale(0)`**; start ≥ .9 (Emil uses .93 for a popover) [src: Emil tip #2]; "scale from ~0.8 with opacity, not 0 → 1" [src: interfaces.rauno.me]. Geist overlay `--ds-motion-overlay-scale: .96` [obs]; Radix/shadcn zoom 95% (see `origin-aware-popovers`).
- **Press**: `scale(.97)` [src: Emil; obs: Linear], `.96` [obs: rauno.me]. Proportional to size: big surfaces move less [src: interfaces.rauno.me "values proportional to the trigger size"].

## 4. Interruptibility
- Anything the user can reverse or retrigger uses **CSS transitions** (they retarget from the current value); `@keyframes` restart from their first frame and jump [src: Emil "Great animations", Sonner story]. Details + patterns: `interruptible-css-transitions`.
- Gestures respond from the first pixel (apply the delta immediately, animate past a threshold), and are cancellable mid-flight [src: Rauno "Responsive gestures"]. Lightweight actions may fire during the gesture; destructive ones only on release [src: Rauno "Swipe gestures"].
- "Animations are cancelable by user input"; don't block input until an animation finishes [src: Vercel].

## 5. Performance
- Animate `transform`, `opacity` (and `filter`/`clip-path` sparingly). Never `transition: all` [src: Vercel]. Avoid width/height/top/left [src: Vercel; Emil].
- Preference **CSS > WAAPI > JS** [src: Vercel]; CSS/WAAPI stay smooth when the main thread is busy (Vercel dashboard tab fix) [src: Emil].
- Pause looping animations off-screen [src: interfaces.rauno.me]. `will-change` only as a last resort, toggled for the duration [src: interfaces.rauno.me].

## 6. Small rules that add up
- **Tooltips**: delay the first, then open neighbours instantly with no animation (`[data-instant]{transition-duration:0ms}`) [src: Emil tip #3; Vercel]. Geist: tooltip fade `.1s ease-in` after a `.4s` delay, `.1s` delay for the "faster" variant [obs]. Radix numbers: `origin-aware-popovers`.
- **Blur bridges crossfades**: add `filter: blur(2px)` while two states swap [src: Emil tip #7].
- **Theme switches** must not trigger transitions; disable them for the swap [src: interfaces.rauno.me].
- **Hover only on hover devices**: `@media (hover:hover)`, else touch flashes the hover state [src: interfaces.rauno.me].
- **Spatial consistency**: things leave the way they came; a swipe-dismissable toast enters from that edge [src: Emil on Sonner; Rauno "Spatial consistency"].
- **Tabular numerals** for anything that counts [src: interfaces.rauno.me].

## 7. Reduced motion
`@media (prefers-reduced-motion: reduce)`: replace movement (translate, scale, spin, parallax, shake) with a short opacity change; keep every state change and piece of information [src: Emil, Vercel "Honor prefers-reduced-motion. Provide a reduced-motion variant"]. Sonner and NumberFlow remove motion entirely; progress fills (hold-to-confirm) may stay because they are information [lib]. Auto-playing motion > 5 s next to content needs pause/stop [src: Vercel].

## 8. Never animate (quick list)
Keyboard-driven navigation and highlights · command palette open · context-menu open · frequent list add/remove · theme switch · font-weight on hover (layout shift) [src: interfaces.rauno.me] · layout properties on big trees · scroll position (no scroll hijack) · anything from scale(0) · disabled controls (no press scale) · tooltips after the first in a group.

## Review loop
Watch it slowed down (Emil's demos have a slow-mo key; DevTools Animations panel at 10–25%) [lib], check it interrupted (click twice fast) [lib], imagine the hundredth use [src: Emil, "imagine you interact with this list often during the day"], and review it again the next day with fresh eyes [src: Emil "Great animations"].
