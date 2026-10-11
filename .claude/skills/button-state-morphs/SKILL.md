---
name: button-state-morphs
description: Buttons that answer every press — scale(.97) press feedback (no scale when disabled), an async save that morphs idle → "Saving…" → saved / error inside a width-stable label stack, copy-to-clipboard that swaps to an inline check for ~2 s, hold-to-confirm for destructive actions with a clip-path fill that snaps back on release, toggle buttons with aria-pressed, and proper disabled/aria-busy/aria-live semantics. Use for forms, settings, dashboards, code blocks, pricing CTAs, any app UI. Sources - emilkowal.ski (7 practical animation tips), linear.app CSS (button tokens, observed), rauno.me + interfaces.rauno.me, vercel.com/design/guidelines (Web Interface Guidelines).
---

# Button state morphs

Labels: **[src]** read from a named source; **[obs]** observed in shipped CSS (Oct 2026); **[lib]** this library's choice or inference. Overlaps `premium-micro-details` (press .97 one-liner) and `hold-to-advance` (ring hold for big story moments); this skill is the app-UI version with all states.

## 1. Press feedback
- **`scale(.97)` on `:active`** [src: Emil, "7 practical animation tips" #1]. Linear ships exactly this on every button variant [obs]: `.variant:not([disabled]):active { transform: scale(.97); filter: brightness(98%) }` with `transition: .16s var(--ease-out-quad)` (`cubic-bezier(.25,.46,.45,.94)`) over `border, background-color, color, box-shadow, opacity, filter, transform`. rauno.me uses `scale(.96)` with `transform 150ms ease-out` [obs]. Guideline: "~0.96, ~0.9, never 1 → 0.8" [src: interfaces.rauno.me].
- Never `transition: all` [src: Vercel guidelines]; list the properties.
- **Disabled = no scale**: gate with `:not(:disabled):not([aria-disabled="true"])`. Disabled look: `opacity:.5; cursor:not-allowed` [obs: Linear].
- **Touch**: iOS only applies `:active` if a touch listener exists [lib: platform behaviour], so mirror press with pointer events → `data-pressed`. Add `touch-action: manipulation` (no double-tap zoom) and replace the tap highlight, don't just remove it [src: Vercel]. Hover styles only inside `@media (hover:hover)` [src: interfaces.rauno.me].
- **Keyboard** [lib]: Space/Enter fire `click` natively; mirror the press for Space keydown→keyup so keyboard users see the same .97.

```css
.btn { transition: transform .16s cubic-bezier(.25,.46,.45,.94), background-color .16s, opacity .16s; touch-action: manipulation; -webkit-tap-highlight-color: transparent; }
.btn:not(:disabled):not([aria-disabled="true"]):is(:active, [data-pressed]) { transform: scale(.97); }
.btn:disabled, .btn[aria-disabled="true"] { opacity: .5; cursor: not-allowed; }
@media (hover: hover) { .btn:hover { background: var(--hover); } }
```

## 2. Width-stable label stack (the core trick) [lib]
Every state label lives in the button at once, stacked in one grid cell; only one is visible. The button's width is the widest label, so idle → "Saving…" → "Saved" never shifts layout or makes the button jump under the cursor.
```html
<button class="btn" data-state="idle" aria-describedby="save-status">
  <span class="stack">
    <span data-for="idle">Save changes</span>
    <span data-for="loading" aria-hidden="true"><i class="spinner"></i>Saving…</span>
    <span data-for="success" aria-hidden="true"><svg class="check">…</svg>Saved</span>
    <span data-for="error" aria-hidden="true">Retry</span>
  </span>
</button>
<span id="save-status" class="sr-only" aria-live="polite"></span>
```
```css
.stack { display: grid; } .stack > * { grid-area: 1 / 1; display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  opacity: 0; transform: translateY(6px) scale(.96); filter: blur(2px);
  transition: opacity .2s cubic-bezier(.23,1,.32,1), transform .2s cubic-bezier(.23,1,.32,1), filter .2s; }
.btn[data-state="idle"] [data-for="idle"], .btn[data-state="loading"] [data-for="loading"],
.btn[data-state="success"] [data-for="success"], .btn[data-state="error"] [data-for="error"] { opacity: 1; transform: none; filter: none; }
```
- Cross-fade with **2 px blur** bridges the two labels [src: Emil tip #7]; enter from scale ≥ .9, never 0 [src: Emil tip #2]; **≤ 200–300 ms** [src: interfaces.rauno.me "≤ 200 ms for interactions"; Emil "under 300 ms"]. Ease-out [src: Emil tip #4]. The leaving label moves up, the arriving one rises from below [lib].
- Because states are CSS transitions, a fast success right after loading simply retargets mid-fade (see `interruptible-css-transitions`).

## 3. Async save state machine
```
idle --click--> pending(show-delay) --150–300 ms--> loading --resolve--> success --2 s--> idle
                       \--resolves first--> success                  \--reject--> error --click--> pending
```
- **Show-delay ~150–300 ms, minimum visible ~300–500 ms** for spinners so fast responses don't flicker [src: Vercel "Minimum loading-state duration"]. If the request resolves inside the show-delay, go straight to success.
- **Loading label keeps the meaning and ends with an ellipsis**: "Saving…" [src: Vercel "Loading buttons… keep the original label", "Ellipsis for loading states"].
- **Block duplicate submits** while in flight [src: interfaces.rauno.me, Vercel "Submission rule"]. Use `aria-disabled="true"` + ignore clicks rather than `disabled`, so the button keeps focus [lib]; set `aria-busy="true"` on the button or form.
- **Announce** "Saving…", "Saved", "Couldn't save. Retry?" in a polite live region [src: Vercel "Announce async updates. Use polite aria-live"]; visible label alone is not enough because the label swaps are `aria-hidden` copies.
- **Success holds ~2 s** then returns to idle [lib]. **Error stays** until the next action, shows text + icon (not color alone [src: Vercel "Redundant status cues"]) and may shake once: `translateX` 0 → −4 → 4 → −2 → 0 px over 300 ms [lib]; no shake under reduced motion.
- Prefer optimistic updates where success is likely and roll back on failure [src: Vercel].

## 4. Copy to clipboard
- "Show a temporary inline checkmark on a successful copy, not a notification" [src: interfaces.rauno.me]. Swap copy-icon → check in place with the same stack trick, blur 2 px, scale .8 → 1, 200 ms [lib values]; draw the check with `stroke-dashoffset` over ~250 ms ease-out [lib].
- Revert after ~2 s [lib]; a second click during the check restarts the timer without replaying the animation.
- `navigator.clipboard.writeText(text)` needs a secure context and a user gesture; fall back to a hidden `<textarea>` + `document.execCommand('copy')`, and on failure show "Press ⌘C" with the text selected [lib]. Announce "Copied" politely. Icon-only button needs `aria-label="Copy install command"` [src: Vercel].

## 5. Hold to confirm (destructive)
- Destructive actions need confirmation or Undo [src: Vercel]. A hold is a confirmation that costs no extra dialog.
- Fill: an overlay copy of the button (danger colors) clipped with `clip-path: inset(0 100% 0 0)`. While held: `transition: clip-path 1.5s linear` to `inset(0 0 0 0)`; on release before the end: `transition: clip-path .2s ease-out` back to 100% [lib timings; same clip-path reveal family as Emil's "The magic of clip-path"]. Linear while holding = honest progress; fast ease-out on release = forgiving.
- Commit on `transitionend` of the fill, not on a timer, so visual and action agree; pointer capture + `pointercancel`/`lostpointercapture` = release; Space/Enter keydown starts (ignore `e.repeat`), keyup releases [lib]. Rauno: destructive gestures commit only on intent, never mid-gesture by accident [src: rauno.me "Invisible details", iOS app switcher].
- Label states: "Hold to delete" → (holding) same label → "Deleted" + Undo for ~5 s [lib]. `aria-describedby` explains "Press and hold for 1.5 seconds" for screen-reader users; reduced motion keeps the fill (it is progress information) but drops any shake/scale.
- Big full-screen holds with a ring and audio: `hold-to-advance`.

## 6. Toggle and disabled
- Toggle buttons use `aria-pressed` and take effect immediately, no confirm [src: interfaces.rauno.me "Toggles should immediately take effect"]. Width-stable stack for "Follow" / "Following".
- Disabled buttons get no tooltip (not focusable, never announced) [src: interfaces.rauno.me]; explain why next to the button instead.
- Don't pre-disable submit buttons; let users submit and show validation [src: Vercel].

## Reduced motion
Keep every state change (labels, icons, colors, the hold fill) but replace movement with opacity: no translate/scale on label swaps, no shake, no press scale (an opacity/brightness press is fine). The information is identical.

## Don'ts
- No spinner without a label change, no label change without an announcement.
- No width change between states (measure the widest, or stack).
- No bouncy overshoot on press or check; press is .97, not .9 and not a spring wobble.
- Don't animate state changes that the user fires from the keyboard many times a second (see `ui-motion-principles`); a single Save is fine.
- Don't use a toast for copy; feedback lives on the trigger.
