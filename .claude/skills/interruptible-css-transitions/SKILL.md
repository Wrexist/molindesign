---
name: interruptible-css-transitions
description: Rules for UI motion that can be changed mid-flight — use CSS transitions (retargetable) instead of @keyframes for any state that can change again before the animation ends (stack positions, open/close, hover expand), drive state with data-attributes plus a "mounted" flag (or @starting-style) for enter, hand off cleanly between finger-driven drag (transition:none) and released settle, keep keyframes only for one-shot exits/loops, and pick easing/duration by purpose (ease-out < 300 ms, Sonner 400 ms ease, Vaul 0.5 s iOS curve). Use whenever building toasts, drawers, menus, tabs or anything users can trigger repeatedly. From emilkowal.ski ("Great animations", "Building a toast component", "Building a drawer component") and the sonner / vaul sources.
---

# Interruptible CSS transitions

Sources: Emil Kowalski, *Great animations* (emilkowal.ski/ui/great-animations), *Building a toast component*, *Building a drawer component*, plus how `sonner@2.0.8` and `vaul@1.1.2` apply the rules in their shipped CSS/JS. Quotes are from those pages. Code is a reimplementation.

## The core rule
> "CSS keyframes … aren't interruptible … you can't smoothly change the end position while the animation is running. CSS transitions, on the other hand, can be interrupted and retargeted, even before the first transition has finished."

Sonner first used keyframes. Adding toasts quickly made the older ones "jump into their new position". Switching to transitions fixed it. Rule of thumb:

| Use a **transition** when… | Use a **keyframe** when… |
|---|---|
| the target can change again mid-flight: stack offset, open ↔ closed, hover expand, snap point, tab underline | the motion is one-shot and ends in removal (Sonner's 200 ms swipe-out), or loops (spinner: 12 bars, 1.2 s) |
| the user can trigger it repeatedly or reverse it | nothing can retarget it before it ends |

## Pattern 1: state in attributes, motion in CSS
```css
.item { transform: var(--y); opacity: 0; transition: transform .4s ease, opacity .4s ease; }
.item[data-mounted=true] { --y: translateY(calc(var(--i) * -14px)) scale(calc(1 - var(--i) * .05)); opacity: 1; }
.item[data-open=true]    { --y: translateY(calc(-1 * var(--offset))); }
```
JS only flips attributes and numbers (`el.dataset.open = true; el.style.setProperty('--i', i)`). Each change retargets from wherever the element is right now.

## Pattern 2: enter without keyframes
Insert with `data-mounted=false` (the off-screen state), then flip it after the browser has painted the first frame:
```js
list.prepend(el);
requestAnimationFrame(() => requestAnimationFrame(() => (el.dataset.mounted = 'true')));
// or force style: void el.offsetHeight; el.dataset.mounted = 'true';
```
Sonner does this with `useEffect(() => setMounted(true), [])`. The modern alternative is `@starting-style { .item { transform: translateY(100%); opacity: 0 } }`, which the article mentions.

## Pattern 3: drag hand-off (finger → spring-free settle)
- **Down / move**: `el.style.transition = 'none'` and write `transform` every move. Write it on the element itself, not through an inherited custom property on a large subtree. Vaul's drag got laggy past ~20 children because of the style recalc.
- **Up**: restore `transition: transform .5s cubic-bezier(.32,.72,0,1)` and set the target. The browser animates from the current visual position.
- If you need the mid-flight position (for example to decide a snap), read it from `getComputedStyle(el).transform` (`matrix(...)[5]`, `matrix3d(...)[13]`), as Vaul's `getTranslate` does.
- CSS transitions restart velocity from 0 at each retarget. That is fine for UI. If you need to carry momentum, use a spring (see `spring-input-physics`) **(inferred limitation)**.

## Easing and duration by purpose (verified values)
- General UI response: **ease-out, usually < 300 ms**. "Snappy animations feel responsive."
- Sonner toasts: `400ms`, default `ease`. "A bit slower than usual and uses ease rather than ease-out to make it feel more elegant." Match the motion to the product's tone.
- Vaul drawer: `0.5s cubic-bezier(0.32, 0.72, 0, 1)`, Ionic's iOS-sheet curve.
- Exit faster than enter. Sonner unmounts after 200 ms; collapsed back toasts use opacity 200 ms with transform 500 ms.
- **Don't animate keyboard-initiated actions** users repeat many times a day: "Raycast has no animations and it feels right."

## Performance
- Animate only `transform` and `opacity` (composite-only). Padding, margin and height trigger layout. Sonner does transition `height` on the stack, but only on a few small nodes.
- CSS transitions and WAAPI stay smooth when the main thread is busy. rAF-driven JS animation drops frames under load: Vercel's dashboard tab animation was fixed by moving it to CSS.

## Reduced motion
Swap movement for opacity, keep durations short, keep the information identical:
```css
@media (prefers-reduced-motion: reduce) {
  .item { transform: none !important; transition: opacity .15s ease; }
}
```
Sonner removes transitions and animations entirely under `prefers-reduced-motion`. Vaul has no rule. **(Recommended)** A brief opacity fade is kinder than an instant cut.

## Checklist
- [ ] Every state that can be re-triggered uses `transition`, not `animation`.
- [ ] Enter uses a mounted flag or `@starting-style`.
- [ ] Drag sets `transition:none`, and release restores it in the same frame as the new target.
- [ ] Only transform and opacity on large or many elements.
- [ ] Durations ≤ 300 ms for frequent UI. Longer only for deliberate, rarer moments (sheets 500 ms).
- [ ] Reduced motion becomes an opacity-only fade.
