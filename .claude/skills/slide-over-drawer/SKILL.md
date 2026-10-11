---
name: slide-over-drawer
description: Accessible right-side slide-over drawer with tabs (Specification / About), frosted-glass panel, dimmed backdrop, staggered hairline rows, Esc to close, arrow-key tabs, focus management, and optional hand-off to the 3D engine (lock input). Use for secondary info on immersive/full-screen sites instead of navigating to another page. From amv.tarunvishwakarma.dev.
---

# Slide-over drawer with tabs

## Structure
```html
<div class="fixed inset-0 z-20">
  <div class="absolute inset-0 bg-black/40" (click→close)></div>   <!-- fade .3s -->
  <aside role="dialog" aria-modal="true" aria-label="Specification"
         class="absolute inset-y-0 right-0 flex w-[min(440px,100vw)] flex-col overflow-y-auto overscroll-contain
                border-l border-white/10 bg-black/55 px-8 py-8 backdrop-blur-2xl md:px-10">
    <header class="flex items-center justify-between">
      <div role="tablist" aria-label="Drawer" class="flex gap-5"> <button role="tab" …>Specification</button> <button role="tab">About</button> </div>
      <button autofocus>Close ✕</button>
    </header>
    <div role="tabpanel" id="panel-spec" aria-labelledby="tab-spec"> … </div>
  </aside>
</div>
```
- Panel motion: `transform: translateX(100%) → 0`, `.5 s`, `cubic-bezier(.32,.72,0,1)` (iOS-sheet feel); exit the reverse. Use `transform`, not `right`. Backdrop `opacity` `.3 s`.
- **Tabs**: `aria-selected`, roving `tabIndex` (0 on active, −1 others), `aria-controls`; Left/Right arrow cycles and moves focus to the new tab. Active indicator = 1 px orange underline `scale-x-0 → 100` (`300 ms` ease-out-quint, `origin-left`) under the label (`absolute inset-x-0 bottom-.5`).
- **Focus**: focus the Close button on open; close on **Esc** (listener bound only while open; keep latest `onClose` in a ref to avoid re-binding); backdrop click closes; return focus to the trigger.
- Lock the underlying experience while open: `engine.lock(open)` and `inert` the HUD layers beneath.
- Mobile: the top nav shows a two-line hamburger (44 px circle) that opens the same drawer ("Specification and About").

## Content patterns
- **Spec tab**: big display word (`VULCAN`, 44 px, light, `tracking-[.04em]`), then `<dl>` of rows `border-t border-white/10 py-4` (last row also `border-b`), each row staggered in (`opacity 0→1, y 8→0, .5 s, delay .15 + .04·i`); footnote pinned bottom (`mt-auto pt-8 text-[12px] text-white/40`): "Figures as announced at the car's reveal."
- **About tab**: poetic header ("One car, *one take.*"), 15 px paragraph, 2-up `figure` grid of making-of images (`aspect-video rounded-lg border-white/10 object-cover`, width/height attrs set, descriptive alt, caption in label style), credits `dl` (Design/3D/code, Made with, Sound, Type), social links with orange `↗` that nudges `-translate-y-.5 translate-x-.5` on hover, and the **non-affiliation disclaimer**.
- Credits row example: `["Made with","Blender, Cycles, three.js, Next.js"]`, `["Sound","Web Audio, mixed live"]`, `["Type","Archivo, Geist Mono"]` — telling the stack is part of the showpiece.

## Gotchas
`overscroll-contain` on the panel so wheel doesn't scrub the scene behind; `z-20` above HUD (`z-10`) but below cursor (`z-[70]`); remember `prefers-reduced-motion` → shorten to a plain fade.
