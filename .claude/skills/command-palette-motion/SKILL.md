---
name: command-palette-motion
description: A cmdk-style ⌘K command palette — dialog that scales in from .96, combobox input with aria-activedescendant, fuzzy command-score ranking (word-jump and transposition weights), groups re-sorted by best match, first result auto-selected, ↑↓/Home/End/⌘↑↓/Alt-group/Ctrl-N-P keys, pointer-move selection, list height animated through a ResizeObserver-fed --cmdk-list-height variable, nested pages with Backspace/Esc back and a 100 ms "bounce" on Enter. Use for app shells, docs sites and dashboards that want Linear/Raycast-grade keyboard navigation. From cmdk 1.1.1 by Paco Coursey (src/index.tsx + command-score.ts read on GitHub/npm) and its website's Linear/Raycast/Vercel recreations; Raycast manual for behaviour.
---

# Command palette motion (cmdk pattern)

One idea: **the palette is one text field that drives a list.** Focus never leaves the input. The list re-ranks on every keystroke, the selection is a value (not DOM focus), and the panel's height glides to fit the results. Numbers are from cmdk source unless marked *(observed)*, *(inferred)* or *(house)*.

## Verified (cmdk 1.1.1 source)
**Ranking: `commandScore(value, search, keywords)`**, a recursive fuzzy matcher with memoisation. It walks the search characters through the value (`value + ' ' + keywords.join(' ')`, lower-cased, `[\s-]` → space) and keeps the best path:
| Constant | Value | Meaning |
|---|---|---|
| `SCORE_CONTINUE_MATCH` | 1 | next char directly follows the previous match |
| `SCORE_SPACE_WORD_JUMP` | 0.9 | jump to the start of a word after a space or `-` |
| `SCORE_NON_SPACE_WORD_JUMP` | 0.8 | jump to after `\ / _ + . # " @ [ ( { &` |
| `SCORE_CHARACTER_JUMP` | 0.17 | jump into the middle of a word |
| `SCORE_TRANSPOSITION` | 0.1 | swapped letters (`"ab"` matching `"ba…"`) |
| `PENALTY_SKIPPED` | 0.999 | per skipped char/word break (only once past the start) |
| `PENALTY_CASE_MISMATCH` | 0.9999 | case differs |
| `PENALTY_NOT_COMPLETE` | 0.99 | search consumed but value continues |
`PENALTY_DISTANCE_FROM_START = 0.9` is declared but unused. A score of `0` means hidden. `"gs"` ranks "Go to Settings" (two word starts) far above "Assign" (mid-word jumps).

**Filter + sort**
- Each item's score is stored in a map. Items with `> 0` stay and the rest unmount.
- Items are re-appended inside their group in descending score. Groups are re-appended in descending order of their **best** item, and ungrouped items sit on top.
- A group stays visible if any child scores > 0. The empty state (`role="presentation"`) shows when the count is 0.
- On every search change cmdk filters, sorts, then **selects the first valid item**.

**Keys (on the root, skipped while `isComposing` or `keyCode 229` for IME)**
- `ArrowDown`/`ArrowUp` move the selection by one. With `metaKey` they jump to last/first, with `altKey` to the next/previous group.
- `Ctrl+N`/`Ctrl+J` go down and `Ctrl+P`/`Ctrl+K` go up (`vimBindings` default true).
- `Home`/`End` jump to first/last. `Enter` dispatches `cmdk-item-select` on the selected item.
- `loop` is **off** by default.
- Selection changes call `scrollIntoView({ block: 'nearest' })`. When the item is first in its group, the group heading scrolls in first.

**Pointer**: items select on **`pointermove`** (not `pointerenter`), so a resting mouse doesn't steal the selection while you arrow through the list. `disablePointerSelection` turns it off. Click selects and runs.

**ARIA**
- Input: `role="combobox" aria-autocomplete="list" aria-expanded="true" aria-controls=<list> aria-activedescendant=<selected item id>`, plus a screen-reader-only `<label>`.
- List: `role="listbox" aria-label="Suggestions"`. Items: `role="option" aria-selected aria-disabled` with `data-selected`.
- Groups: wrapper `role="presentation"`, items wrapper `role="group" aria-labelledby=<heading>`, heading `aria-hidden`. Separator: `role="separator"`.
- The dialog is a Radix Dialog: focus trap, Esc closes, focus returns to the opener.

**List height**: a `ResizeObserver` on the inner sizer writes `--cmdk-list-height: <offsetHeight>px` (toFixed(1)) inside a `requestAnimationFrame`. The README CSS is `height: var(--cmdk-list-height); max-height: 500px; transition: height 100ms ease;`, plus `scroll-padding-block: 8px` so `scrollIntoView` keeps a gap.

## From cmdk's website themes (recreations by the cmdk author, not Linear/Raycast code)
- Linear theme: list `height: min(300px, var(--cmdk-list-height)); max-height: 400px; transition: height 100ms ease`. Items 48 px tall, 4 px apart. The selected item gets a background plus a **3 px accent bar** on its left edge. `transition-property: none` on items; only `:active` transitions its background.
- Raycast theme: dialog keyframes `opacity 0 → 1, scale(.96) → 1` in and the reverse out, `transform-origin: center`. Item 40 px, list 393 px, footer with the primary action + `⌘K` actions.
- Vercel theme: nested pages shown as breadcrumb badges. On `Enter` and on `Backspace` page-pop the root gets `transform: scale(.96)` for **100 ms** (`transition: transform 100ms ease`) and the input clears. This "bounce" confirms the action.
- README nested pages: keep a `pages` stack. `Escape`, or `Backspace` while the input is empty, pops a page.

## Linear / Raycast behaviour *(observed and docs)*
- Raycast manual: `⌘K` opens the Action Panel. Typing filters "in real-time using fuzzy matching". **While searching, all matches show as one flat list regardless of sections.** `Esc` goes back from a sub-menu before it closes. `↵` runs the primary (first) action.
- Neither Linear nor Raycast publishes motion timings. *(observed)* Both open in well under 200 ms with a short scale from ~.96–.98 and no slide, show no highlight animation, and keep the list height tracking the results.

## Motion recipe *(house values, tuned from the above)*
```css
.pal-back { animation: fade 140ms ease both; }                     .pal-back[data-state=closed] { animation: fade-out 120ms ease both; }
.pal      { transform-origin: 50% 0; animation: pal-in 160ms cubic-bezier(.23,1,.32,1) both; }
.pal[data-state=closed] { animation: pal-out 120ms ease both; }
@keyframes pal-in  { from { opacity:0; transform: scale(.96); } }
@keyframes pal-out { to   { opacity:0; transform: scale(.98); } }
.pal-list { height: var(--list-h); max-height: min(340px, 60%); overflow: auto; overscroll-behavior: contain;
            transition: height 140ms cubic-bezier(.23,1,.32,1); scroll-padding-block: 8px; }
.pal-item[aria-selected=true] { background: rgb(255 255 255/.07); box-shadow: inset 2px 0 0 var(--accent); } /* no transition */
.pal.bounce { transform: scale(.96); transition: transform 100ms ease; }
@media (prefers-reduced-motion: reduce) { .pal, .pal-back { animation-name: fade; } .pal-list { transition: none; } .pal.bounce { transform: none; } }
```
Anchor the origin at the **top** (`50% 0`). The list grows downward and the input must not move while the height animates.

## Skeleton (vanilla)
```js
// sizer inside the scrolling list → --list-h on the list (cmdk pattern)
const ro = new ResizeObserver(() => { raf = requestAnimationFrame(() => list.style.setProperty('--list-h', sizer.offsetHeight.toFixed(1) + 'px')); });
ro.observe(sizer);

function render(q) {
  const rows = items.map((it) => ({ it, s: q ? score(it.label, q, it.keywords) : 1 })).filter((r) => r.s > 0);
  if (q) rows.sort((a, b) => b.s - a.s);                       // q: flat-ranked list (Raycast) or regroup by best score (cmdk)
  sizer.replaceChildren(...rows.map(({ it }) => it.el));
  empty.hidden = rows.length > 0;
  select(rows[0]?.it);                                         // first result is always selected after a search change
}
function select(it, scroll = true) {
  current?.el.setAttribute('aria-selected', 'false'); current = it;
  if (!it) return input.removeAttribute('aria-activedescendant');
  it.el.setAttribute('aria-selected', 'true'); input.setAttribute('aria-activedescendant', it.el.id);
  if (scroll) it.el.scrollIntoView({ block: 'nearest' });
}
input.addEventListener('keydown', (e) => {
  if (e.isComposing || e.keyCode === 229) return;
  const vis = visible(), i = vis.indexOf(current);
  const down = e.key === 'ArrowDown' || (e.ctrlKey && (e.key === 'n' || e.key === 'j'));
  const up   = e.key === 'ArrowUp'   || (e.ctrlKey && (e.key === 'p' || e.key === 'k'));
  if (down || up) { e.preventDefault(); select(e.metaKey ? vis[up ? 0 : vis.length - 1] : vis[Math.max(0, Math.min(vis.length - 1, i + (down ? 1 : -1)))]); }
  else if (e.key === 'Home' || e.key === 'End') { e.preventDefault(); select(vis[e.key === 'Home' ? 0 : vis.length - 1]); }
  else if (e.key === 'Enter') { e.preventDefault(); bounce(); run(current); }
  else if (e.key === 'Escape' || (e.key === 'Backspace' && !input.value && pages.length)) { e.preventDefault(); pages.length ? popPage() : close(); }
});
list.addEventListener('pointermove', (e) => { const el = e.target.closest('[role=option]'); if (el && el !== current?.el) select(byEl.get(el), false); });
```
`score()` is a reimplementation of `commandScore` with the constants above (about 40 lines). A plain `includes()` filter feels noticeably worse, because "gs" should find "Go to Settings".

Opening: a global `keydown` for `(e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k'` with `preventDefault()` (Ctrl+K is the browser's search shortcut). Inside an embedded widget, only listen while focus is within it. Remember `document.activeElement`, open, focus the input, trap Tab, and on close restore focus.

## Rules / don'ts
- Never move DOM focus to items. The selection is `aria-activedescendant`, so typing never stops.
- Always auto-select the first result after typing, so `Enter` works blind.
- Animate height only through the sizer variable. Don't animate `max-height` or re-measure inside the transition.
- No highlight easing, no stagger on result rows. They change on every keystroke and any motion there reads as lag.
- Close fast (≤120 ms). Run the command after the close starts, then show feedback (toast/state) in the app, not in the palette.
- Keep shortcut hints as `<kbd>` on the right of rows, plus a footer `↑↓ navigate · ↵ run · esc close`.
- Reduced motion: opacity-only fades, no height transition, no bounce. Ranking and keys stay identical.
