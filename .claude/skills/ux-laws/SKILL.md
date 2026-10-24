---
name: ux-laws
description: REQUIRED on every website, landing page, web app or UI screen — the 20 laws of UX (Hick, Fitts, Jakob, Miller, Aesthetic-Usability, Pareto, Occam, Parkinson, Postel, Peak-End, Von Restorff, Zeigarnik, Tesler, Doherty 400 ms, Goal-Gradient, Proximity, Similarity, Closure, Common Region, Uniform Connectedness) turned into concrete web rules with numbers, a plan-time pass, a pre-ship audit and a report format. Apply while planning, while building and before handing over; the immersive and motion skills decide how a site moves, this one decides whether people can use it. Sources - lawsofux.com (Jon Yablonski), the original papers named per law, Nielsen Norman Group.
---

# UX laws: the required checklist

Every site or UI built in this repo goes through this skill three times: **plan** (section 1), **build** (the rules in section 2), **ship** (the audit in section 3, reported as in section 4). It sits beside `premium-micro-details` (craft and a11y polish) and `ui-motion-principles` (motion timing); where they overlap, they agree and the stricter number wins.

Labels: **[src]** the law as stated by its source (paper or lawsofux.com); **[lib]** this library's web rule or number derived from it. Rules marked **must** fail the audit if broken; **should** needs a one-line reason when skipped.

The cheatsheet Isac shared (Oct 2026) lists the 20 laws below in this order. Keep the numbering, the audit refers to it.

## 1. Plan-time pass (before any code)
Answer these in the brief or BRIEF.md. If you cannot, the plan isn't ready.
1. **The one job** (Pareto, Occam): what the 20 % of content and actions are that 80 % of visitors come for. Name the primary action in five words or fewer. Everything else is secondary or cut.
2. **The familiar skeleton** (Jakob): which conventional pattern each page uses (logo top-left links home, nav top or burger top-right on phones, footer with contact, cart/CTA top-right). List every deliberate break and its escape hatch.
3. **The peak and the end** (Peak-End): name the single most memorable moment (usually the site's "one hard idea" from `immersive-site-playbook`) and what the last screen of the main flow shows (confirmation, thank-you, footer sign-off). Both are designed, not left over.
4. **Where the complexity lives** (Tesler): list the hard parts (pricing, booking, forms, variants) and decide which ones the site absorbs (defaults, auto-detect, formatting) instead of the visitor.
5. **Budgets** (Parkinson, Doherty): page weight, LCP ≤ 2.5 s, feedback ≤ 400 ms, form ≤ N fields, flow ≤ N steps. Write the numbers down; work expands to fill whatever isn't capped.

## 2. The 20 laws as web rules

### 1. Hick's law: fewer choices, faster decisions
[src] Decision time grows with the number and complexity of choices (Hick 1952, Hyman 1953).
- **must** One primary CTA per viewport; at most one secondary next to it (ghost/link style). [lib]
- **must** Top nav ≤ 7 items on desktop (≤ 5 is better); group the rest under a menu or the footer. [lib]
- **should** Long option lists (countries, variants, filters) get search, sensible defaults or progressive disclosure, not a wall of buttons. Show 3–4 pricing tiers at most and mark one "recommended". [lib]
- **should** Multi-step forms ask one question group per step instead of everything at once. [lib]
- Don't apply it to: lists people scan for a known item (an index, a menu card). Search beats hiding there. [lib]

### 2. Fitts's law: big and close to hit
[src] Time to acquire a target depends on its distance and size (Fitts 1954).
- **must** Touch targets ≥ 44×44 CSS px (WCAG 2.5.5 / Apple HIG; 2.5.8 sets the 24 px floor); spacing ≥ 8 px between adjacent targets. Enlarge hit areas with padding or `::before` without moving layout (see `premium-micro-details`). [src]
- **must** The primary CTA is the largest interactive element in its section and sits where the eye and thumb already are: after the pitch on desktop, in the lower half or a sticky bottom bar on phones. [lib]
- **must** Whole cards/rows are clickable when they lead to one place (stretched link, not three tiny links). Labels toggle their checkbox/radio. [lib]
- **should** Destructive actions are small and away from the primary action (no "Delete" next to "Save"). [lib]
- **should** Menus open next to their trigger (`origin-aware-popovers`); screen edges and corners are infinitely deep on desktop, so edge-pinned controls are easy. [src]

### 3. Jakob's law: work like the sites people know
[src] Users spend most of their time on other sites and expect yours to work the same way (Nielsen 2000).
- **must** Logo top-left (or centered) and links home; links look like links (underline or clear color + hover); buttons look pressable; the cart/account lives top-right. [lib]
- **must** Native scroll, back button, text selection, Cmd/Ctrl-click and pinch zoom keep working. Never `user-scalable=no`. [lib]
- **must** When an immersive site breaks a convention (wheel scrubs a timeline, custom cursor, gated stages), it gives the convention back: a visible hint, Esc/skip, a "View as page" or chapter menu, and a plain-DOM fallback under reduced motion. [lib]
- **should** Standard words for standard things: "Contact", "Menu", "Cart", "Book a table", not clever labels. Icons that aren't universal get a text label. [lib]

### 4. Miller's law: chunk it
[src] People hold about 7 ± 2 items in working memory (Miller 1956); later work puts it nearer 4 chunks (Cowan 2001). Use it for chunking, not as a hard limit on menus.
- **must** Paragraphs ≤ 4 lines on phones; line length 45–75 characters (`max-width: 65ch` on body copy). [lib]
- **must** Long content is chunked: a heading every 3–5 paragraphs, lists for anything with 3+ parallel items, specs in rows. [lib]
- **should** Phone numbers, card numbers, codes and prices are formatted in groups (`070 123 45 67`, `SEK 18 900`). [lib]
- **should** Never ask people to remember something from a previous screen: repeat the selected plan, date or product on the next step. [lib]

### 5. Aesthetic-usability effect: beauty buys patience
[src] People perceive attractive designs as easier to use and forgive small problems more (Kurosu & Kashimura 1995).
- **must** A real visual system: one type scale, one spacing scale (4/8 px based), a limited palette with one accent, consistent radii and shadows (`viewport-rem-grid-tokens`). [lib]
- **must** It is not a cover for broken usability: run the usability tests (keyboard pass, phone pass, the 5-second "what is this and what do I do?" test) even when it looks finished. [lib]
- **should** Real images and copy before review; lorem ipsum and placeholder boxes hide problems and lower trust. [lib]

### 6. Pareto principle: build the 20 % that matters
[src] Roughly 80 % of effects come from 20 % of causes.
- **must** The primary action and the top content from the plan-time pass get the best position, the most polish and the fastest path. Spend the motion budget there first. [lib]
- **should** Order nav and sections by visitor demand (opening hours, menu, booking for a restaurant), not by org chart. [lib]
- **should** Test and fix the main flow on a mid-range phone before polishing secondary pages. [lib]

### 7. Occam's razor: remove until it breaks
[src] Among options that work equally well, prefer the one with the fewest assumptions.
- **must** Every element answers "what would the visitor lose without this?" If nothing, cut it: duplicate CTAs, decorative carousels, stock filler, "Welcome to our website". [lib]
- **must** One way to do each thing. Two newsletter forms, two contact pages or two nav systems for the same links fail. [lib]
- **should** No carousel for key content (later slides go unseen); use a grid or a single strong image. [lib]
- **should** Effects follow the playbook rule: one hard idea per site; every extra effect must support it or go. [lib]

### 8. Parkinson's law: constrain the task
[src] Work expands to fill the time available (Parkinson 1955).
- **must** Forms ask only for what the next step needs; name and email/phone for a contact form, nothing "nice to have". Mark optional fields, don't star required ones (most are required). [lib]
- **must** Autofill works: correct `type`, `inputmode`, `autocomplete` (`name`, `email`, `tel`, `street-address`, `postal-code`, `cc-number`, `one-time-code`). [lib]
- **should** Show how long things take up front ("3 steps · about 1 minute", "Reply within 24 h"). [lib]
- **should** Team-side: write budgets (page weight, time per section) into the brief before building; see plan-time pass item 5. [lib]

### 9. Postel's law: liberal in, strict out
[src] Be liberal in what you accept and conservative in what you send (Postel, RFC 761, 1980).
- **must** Inputs accept the formats people type: spaces and dashes in phone/card numbers, `+46` or `0` prefixes, any case in emails and codes, trailing spaces, pasted values. Normalise on blur or submit, never reject for formatting. [lib]
- **must** Validate on blur or submit, not on every keystroke; error messages say what to do next, next to the field, and keep what was typed (`aria-describedby`, `aria-invalid`). [lib]
- **must** Layout survives any input: long names, 200 % zoom, translated text, missing images (alt + background color), slow networks, no JS for core content where feasible. [lib]
- **should** Output is consistent: one date format, one currency format, one tone. [lib]

### 10. Peak-end rule: design the high point and the ending
[src] People judge an experience mostly by its most intense moment and its end (Kahneman et al. 1993).
- **must** The peak from the plan-time pass gets the site's best craft (the hero reveal, the product moment), and it runs smoothly on a mid-range phone. A janky peak is remembered as the whole site. [lib]
- **must** Every flow ends on a designed screen: success state after a form (what happens next, when, a way back), a thank-you after purchase, a footer that signs off. Never a bare "Submitted." [lib]
- **should** Soften the low points: friendly 404 with a way home, helpful empty states, errors with a fix. [lib]

### 11. Von Restorff effect: the different one is remembered
[src] Among similar items, the one that differs is the one remembered (von Restorff 1933).
- **must** The accent color is reserved for the primary action and the one thing per view that must stand out; it isn't spread over decoration. (The library's "ONE accent" token is this law.) [lib]
- **must** Don't rely on color alone: pair the standout with size, weight, position or an icon (color blindness, WCAG 1.4.1). [src]
- **should** One highlight per group (the recommended plan, the new item); if three things are highlighted, none is. [lib]
- **should** Motion as emphasis is used sparingly and stops: a ping dot or pulse, never several looping at once (and none under reduced motion). [lib]

### 12. Zeigarnik effect: unfinished tasks pull people back
[src] People remember interrupted or unfinished tasks better than finished ones (Zeigarnik 1927).
- **must** Multi-step flows show where you are and what's left ("Step 2 of 3", a step list or progress bar with `role="progressbar"`/`aria-valuenow`). [lib]
- **should** Save progress (form drafts in `sessionStorage`, cart contents) so a returning visitor continues instead of starting over. [lib]
- **should** Story sites use a progress rail or chapter list (`scroll-driven-chapters`) so the unfinished story is visible. [lib]

### 13. Tesler's law: complexity has to live somewhere
[src] Every system has a core of complexity that can't be removed, only moved between the system and the user (Tesler, 1980s).
- **must** The site absorbs what it can: smart defaults (today's date, the most common option preselected), auto-detection (country from locale, card type from number, address lookup from postal code), computed totals shown live. [lib]
- **must** Don't oversimplify into ambiguity: hiding a price, a fee or a required step to look minimal moves complexity onto the visitor later. Show totals including fees before the final step. [lib]
- **should** Advanced options stay available behind a clear "More options" instead of being removed. [lib]

### 14. Doherty threshold: respond within 400 ms
[src] Productivity soars when computer and user interact at a pace (< 400 ms) where neither waits on the other (Doherty & Thadani, IBM 1982).
- **must** Every click, tap and key gets visible feedback within 100 ms (press state, focus, hover) and a result or progress indicator within 400 ms. [lib, 100 ms per Nielsen's response-time limits]
- **must** Anything slower than 400 ms shows progress: skeleton for content, spinner or `button-state-morphs` busy state for actions, a percentage or counter for loads over ~2 s (`cinematic-loader`). Optimistic UI where failure is rare and reversible (likes, add-to-cart, toggles). [lib]
- **must** Performance budget: LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1 on a mid-range phone (Core Web Vitals "good"); images sized with `width`/`height`, lazy below the fold, modern formats. [src: web.dev]
- **should** UI transitions ≤ 300 ms so animation never pushes feedback past the threshold (`ui-motion-principles`). A loader or intro must not hold the page longer than the content needs; let a return visit skip it. [lib]

### 15. Goal-gradient effect: effort rises near the finish
[src] Motivation increases as people get closer to a goal (Hull 1932; Kivetz et al. 2006, the coffee-card study).
- **must** Progress indicators count toward the goal ("1 step left", "Almost done") and the last step is visibly the last ("Place order", not another "Next"). [lib]
- **should** Give a head start where honest: the cart already holds the item, the first step is pre-filled from what's known, a checklist starts with one item done ("Account created ✓"). [lib]
- **should** Keep the final steps short and frictionless; never add an upsell or surprise field right before completion. [lib]

### 16. Law of proximity: near means related
[src] Objects close to each other are perceived as a group (Gestalt).
- **must** Spacing encodes relationships: space inside a group < space between groups (e.g. 8 px label→input, 24 px field→field, 64–120 px section→section). Use the spacing scale, not ad-hoc gaps. [lib]
- **must** Labels sit directly above or beside their field, captions under their image, and the price next to its CTA; nothing floats equidistant between two things. [lib]
- **should** Headings have more space above than below, so they bind to the content they introduce. [lib]

### 17. Law of similarity: alike means same kind
[src] Elements that look similar are perceived as related or having the same function (Gestalt).
- **must** One look per function across the whole site: all primary buttons identical, all links styled the same, all cards the same structure. Never style a non-clickable element like a link or button. [lib]
- **must** States are consistent: the same hover, focus, active, disabled and error treatment everywhere (focus ring visible, `:focus-visible`). [lib]
- **should** Use a deliberate difference (Von Restorff) only to break a group on purpose. [lib]

### 18. Law of closure: the eye completes the shape
[src] People perceive incomplete shapes as whole by filling in the gaps (Gestalt).
- **must** A partly visible next card or item at the edge of a horizontal scroller signals "there's more" (show ~15–20 % of the next item); don't rely on hidden scrollbars alone. [lib]
- **should** Icons and logos can be minimal or broken-outline as long as the shape stays recognisable at 16–24 px; test at real size. [lib]
- **should** Masked reveals and corner-bracket frames (`hud-cinematic-ui`, `masked-text-reveal`) work because of closure; keep enough of the shape visible that it reads before the animation ends. [lib]

### 19. Law of common region: a box makes a group
[src] Elements inside a shared boundary are perceived as a group (Palmer 1992).
- **must** Related controls and content share a container when proximity alone is ambiguous: a card per product, a panel per form section, a bordered summary box at checkout. [lib]
- **should** Use the lightest boundary that works: background tint or hairline border before heavy shadows; don't nest boxes more than two deep. [lib]
- **should** Sections that change topic change background or get a divider, so the page reads as regions. [lib]

### 20. Law of uniform connectedness: lines tie things together
[src] Elements connected by uniform visual properties (lines, colors, frames) are perceived as more related than unconnected ones (Palmer & Rock 1994).
- **must** Steps in a process are visually connected (a line or rail between step markers), and timelines connect their dates. [lib]
- **should** Callouts connect to what they describe with a leader line (`hotspot-callout-pins`), not just proximity. [lib]
- **should** Selected states connect the control to its content: the active tab joins its panel (`sliding-indicator-tabs`), the open accordion header shares the panel's background. [lib]

## 3. Pre-ship audit (do it, then report it)
Run on the finished page at 360 px and ~1440 px wide, with a mouse, with only a keyboard and with `prefers-reduced-motion: reduce`. A **must** that fails blocks handover; fix it or list it as a known issue with a reason.

Quick checks that catch most failures:
- [ ] 5-second test: a screenshot of the first viewport says what this is and what to do (Hick, Pareto, Von Restorff).
- [ ] Count primary CTAs per viewport (1), top-nav items (≤ 7), accent uses per view (Hick, Von Restorff).
- [ ] Tab through the page: every control reachable, focus visible, Esc closes overlays, order matches the layout (Jakob, Similarity).
- [ ] Tap every target on a phone viewport: ≥ 44 px, nothing too close to a neighbour (Fitts).
- [ ] Submit every form empty, with odd formats (`+46 70-123 45 67`, ` NAME@MAIL.SE `) and with errors: accepted, normalised, clear messages, input kept (Postel, Parkinson).
- [ ] Throttle to "Fast 4G" / 4× CPU: feedback ≤ 400 ms or a progress state, LCP ≤ 2.5 s, no layout shift (Doherty).
- [ ] Walk the main flow to the end: progress visible, last step labelled, a designed success screen (Zeigarnik, Goal-Gradient, Peak-End).
- [ ] Squint test on each section: groups read from spacing, boxes and lines alone (Proximity, Common Region, Uniform Connectedness, Similarity).
- [ ] Look for anything you can delete without loss, then delete it (Occam).

## 4. Report format
End the build (final message, PR description or the site's README) with a compact table. One row per law, status and where it shows up; keep it honest.

```
UX laws pass — <site>
| # | Law | Status | Where / how |
|---|-----|--------|-------------|
| 1 | Hick | ✓ | One "Book a table" CTA per view; nav 5 items |
| 2 | Fitts | ✓ | 48 px targets; sticky book bar on phones |
| 14 | Doherty | ⚠ | Gallery images 1.2 s on 4G; skeletons added, AVIF todo |
| … | … | … | … |
```
Status: ✓ met, ⚠ partly met (say what's left), ✗ not met (say why), n/a (say why, e.g. no forms → Postel's input rules n/a).

## 5. When the laws pull against the brief
- **Immersive vs Jakob.** Scroll-hijacked films, custom cursors and gated stages break conventions on purpose. Allowed when the plan names the break, the first screen teaches it in one line, and an escape (skip, chapter menu, Esc, reduced-motion DOM version) exists.
- **Aesthetic vs Occam.** Decoration that carries the one hard idea stays; decoration that competes with the primary action goes.
- **Hick vs Tesler.** Removing choices is good until it hides something people need; move rare options behind disclosure instead of deleting them.
- **Doherty vs loaders.** A cinematic loader is fine when it covers real loading; it must not run longer than the assets need, and a return visit skips or shortens it.
