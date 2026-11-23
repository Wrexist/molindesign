# Jury r4: GTA 5 vs GTA 6, Every Trailer, Side by Side (long-form, 16:9, 4:26)

Render judged: `film/gta-everytrailer/out/gta-everytrailer-vo.mp4` (266.1 s, 1920x1080). I scored it cold before reading r1–r3, then used those files only to check their Truth items (see the end).

Frames checked: the contact sheet, plus my own pulls at 0.0, 1.0, 2.0, 2.5 and 5.5 s, then roughly every 3–5 s through 266 s. Full-resolution frames at 37.5, 38.6, 74.5, 100, 165.5 and 259 s.

Measured:
- Loudness: −14.0 LUFS integrated, true peak −2.3 dBTP, LRA 3.6 LU.
- `blackdetect`: no black frames.
- pacecheck: OK. Motion is 0.535 over 0–1 s and 0.725 over 0–3 s, median 0.135. Still frames are 23.1 %, with no frozen stretch and 0 hard cuts.
- `clipkit.py lint`: ok. 47 uses; Rockstar foreground footage 26 %, plates 16 %, real footage on screen 42 %, creator clips 0 %.
- mix.log in-context check: one FIX, `t1h` "Flamingo's". It is only an apostrophe in Whisper's spelling and makes no audible difference.
- No music bed in the gaps.
- Hit levels against the voice-only stem:
  - Slams at 60.9, 158.4 and 236.6 s peak at −2.6 / −2.7 dBFS. The neighbouring voice peaks at −2.9 to −3.1 dBFS.
  - A 0.7 s window around each slam averages −11.4 to −13.6 dB. Speech averages −15.7 to −17.2 dB.

The "over 59 s caps Retention at 6" rule is for Shorts. It is not applied to this long-form film.

## Scores
| # | Criterion | Score | Why |
|---|---|---|---|
| 1 | Hook | **7.5** | **For:** Frame 0 is strong as a still: two moving sunsets (oil pump / fence) and `GTA 5 vs GTA 6` (5 tokens), readable muted. The search phrase is spoken at 0.3 s. The comparison is the payoff and is on screen from frame 0. Motion 0–3 s is 0.725. The cold open then stacks three teases: the `13 YEARS` pair at 5.5 s, crossed first dates at 8.5 s, and `$800M+ vs $3.79B` at 10.5 s. **Against:** frame 0 carries a topic label, not a stake or a question. At 1.0 s the `GTA 6 · 2023` chip is still orange-on-dark-orange and barely legible (r3 item, still present). At 8.5 s the stage is nearly empty while the date cards fade in. |
| 2 | Retention | **7.0** | **For:** something changes every 1–2 s. Six chapter cards and a progress rail give a re-hook about every 35–45 s. Pacecheck is clean. **Against:** the "label card → clips → same card with MATCH" wrapper (`THE CITY…`, `ONE FACE`, `SAME KIND OF SHOT`, `SUNDOWN`, `DRIVE`, `ROB`) repeats about seven times and becomes predictable by chapter 3. The map beat (109–125 s) is two soft blobs. The quote card (169–175 s) and the 6 × ~3 s chapter cards add about 25 s of low-information screen. Footage is only 26 % foreground, under a title that promises "side by side". |
| 3 | Clarity | **8.0** | One idea per beat, captions ≤ 8 words, chapter titles that say what's coming, and a clean scoreboard. A 14-year-old gets "same launch moves, both late, GTA 6 sold far more". **Docked for:** (a) at 72–77 s the label `THE SWITCH: UP TO THE SKY, DOWN AGAIN` sits over Official Trailer shots of Trevor/Michael, before the switch clip plays. (b) The payoff clipboard ticks `3 THE MAP` as a match, although chapter 3's point was that the maps differ (city vs state). |
| 4 | Truth | **8.5** | Every voiced number and date matches BRIEF.md (checked list below). The r3 items are fixed. **Remaining nits:** (a) `12 YEARS APART` (31–40 s) and "Twelve years apart" have no BRIEF row. It is derivable from F1/F2 (Nov 2, 2011 → Dec 4, 2023 = 12.1 y), so it is a documentation gap, not a false number, but the checklist wants a row. (b) The chips at 225 s (`GTA 5 · SEPT 17, 2013` over GTA V Trailer 2011 footage) and 232 s (`GTA 6 · NOV 19, 2026` over An Extended Look, Aug 2026, footage) read as the date of the footage. That is the mismatch r1 fixed on frame 0. (c) The map row ticked MATCH is our reading. `OUR READING` is now printed, so it is acceptable. (d) seo.md says GTA 5 and GTA 6 "made" $800M / $3.79B. The source figures are sell-through and retail sales, company estimates, and the second sentence drops "on day one". |
| 5 | Motion and design craft | **6.5** | **For:** the type system holds (Archivo + Geist Mono), the grey/orange code is consistent, and the 685/1,081-day bars and the $800M blocks inside the $3.79B stack are in true proportion (checked: 0.63 and 84 %). **Against:** (a) **99–102 s: `STORY · 2 PEOPLE` overflows its own panel on both sides** (text x ≈ 970–1842 vs panel x 1000–1815). This is a LESSONS repeat ("check every label's box against its prop's box on the final frames", agent r2 / qrcode r2): **−1**. (b) At 258–261 s, `WHICH FIRST TRAILER WINS?` runs x ≈ 35–1885 (35 px margins, well outside 16:9 title-safe at about 96 px). The `2011` pill sits within about 10 px of the `06 / LAUNCH DAY` breadcrumb. (c) At 165 s, ghost text `CAR · MINIMAP` / `DRIVE` bleeds through the GTA 5 clip while the label card fades under it. (d) At 26 s, `NOV 2, 2011` is printed twice in one panel. (e) The overall look is a dark-mode dashboard, the kit LESSONS gta-pc already calls template-like. |
| 6 | Voice and sound | **6.5** | **For:** the hook is in the first words, the pace is steady at about 2.6 words/s, the chapter lines are clean, there's no music, and loudness is on target. **Against:** the slams now hit as hard as the voice. Peaks at 60.9 / 158.4 / 236.6 s are −2.6 dBFS against voice peaks of −2.9 to −3.1, and the window means are 4–5 dB louder than speech. LESSONS gta-vicecity r1 asks for hit peaks ≥ 3 dB under the neighbouring words: **repeat, −1**. The overcorrection from the gta-longestwait "too quiet" lesson went too far. The read is also flat for 4.5 minutes (LRA 3.6). |
| 7 | Loop and ending | **7.5** | The end returns to the frame-0 pair (oil pump / fence) with `2011` / `2023` in equal neutral pills. That is a true bookend into the first frame, and neither option is highlighted. Docked: from about 254 to 258 s the clips are swapped for plain `2011` / `2023` text cards again, so r3's fix 4 is only half done. The 5 s of empty `WATCH NEXT` slots works only if Studio end-screen elements are actually added. |
| 8 | Shareability | **7.0** | The `$800M+` vs `$3.79B` stack, with four dashed `$800M` blocks inside it under `MORE THAN 4× · NOT INFLATION-ADJUSTED`, is the screenshot frame. The "both missed their first date" calendar (199–210 s) is the DM-able surprise, but it's built from small 340×150 cards in a grid and never gets a hero hold. |

**Overall: 7.3** (7.5 + 7.0 + 8.0 + 8.5 + 6.5 + 6.5 + 7.5 + 7.0 = 58.5 / 8 = 7.31). **Truth: 8.5.**

**Gate: PASS** (overall ≥ 7.0 and Truth ≥ 8.5). Agent verdict: **fix then post** (7.0–7.9). Fixes 1–3 are cheap and should go in before upload. Fix 1 is a layout change; fixes 2 and 3 are a re-mix and text edits.

**Comparison:**
- r3 of this film: 7.0 / Truth 8.0.
- The last long-form, gta-moneymachine: 7.3 / Truth 8.5.

This round matches the last shipped long-form and finally clears Truth. It is not yet better than it. Two LESSONS repeats cost the points that would have put it there: a label overflowing its box, and hits not ≥ 3 dB under the voice.

## Numbers and dates checked against BRIEF.md
Every number below matches its BRIEF row; the `12 YEARS APART` line is the exception (derivable from F1/F2 but no row yet).

| On screen or in the voice | BRIEF row |
|---|---|
| NOV 2, 2011 | F1 |
| DEC 4, 2023 | F2 |
| `12 YEARS APART` | **no row** (derivable, see Truth (a)) |
| Beat times 0:06 / 0:09 / 0:12 / 0:19 and 0:03 / 0:12 / 0:15 / 0:23 | F3, rounded |
| 93,000,000+ in 24 h; record for a non-music debut; YouTube blog, Dec 5, 2023 | F6 |
| Jason 0:19, Lucia 1:03; TRAILER 2 · MAY 6, 2025 | F10 |
| 4:50 (ROCKSTAR-HOSTED CUT) | F13 |
| 26:48; AUG 27, 2026 | F14 |
| 5.5× | F15 (1608 / 290 = 5.54) |
| RUNTIME 1:00 | F16 (60.7 s) |
| RUNTIME 1:29; OCT 15, 2026 | F17 |
| SEPTEMBER 17 | F16 |
| SPRING 2013 · TAKE-TWO, JAN 2013 | F18b |
| SEPT 17, 2013 · TAKE-TWO, JAN 31, 2013 | F18 |
| 2025 / MAY 26, 2026 / NOV 19, 2026 end cards | F19 |
| 685 days / 1,081 days | F20 (recomputed: both exact) |
| $800M+ · TAKE-TWO SEPT 18, 2013 | F21 |
| $3.79B · NOV 20, 2026 · COMPANY ESTIMATE | F22 |
| 32.5M | F22 |
| MORE THAN 4× · NOT INFLATION-ADJUSTED | F23, F18c |
| 13 years | F24 |

seo.md: the chapter stamps 0:00 / 0:17 / 1:07 / 1:46 / 2:21 / 2:56 / 3:39 match the chapter lines' `at` times. Every chapter is ≥ 10 s. The source list matches BRIEF, and the trailer-clips closing line is present.

## Fixes ranked by impact
1. **99–102 s, Craft (LESSONS repeat).** `STORY · 2 PEOPLE` overflows the GTA 6 panel (text about 872 px wide in an 815 px box).
   - Set it on two lines, `1 STORY` big and `2 PEOPLE` beneath at the same size as `STORIES`.
   - Or drop that line to about 0.8× (≤ 740 px wide, ≥ 35 px inside each panel edge).
   - Then pixel-scan every frame of 97–106 s for text outside its panel, not just this one.
2. **60.9, 158.4, 236.6 s and every slam, Sound (LESSONS repeat).** Hit peaks are −2.6 dBFS, level with the voice peaks.
   - Bring the hero hits down 4–5 dB so they peak at about −7 dBFS, ≥ 3 dB under the neighbouring words: raise `duck.smr_db` 22 → 27, or lower the slam level in SCORE.
   - Keep the 1–3 kHz transient so they still read on a phone.
   - Re-measure each hit against `gta-everytrailer-voice-only.mp4` and re-run the SFX gate.
3. **Truth housekeeping, no re-render.**
   - Add BRIEF row F2b: "Nov 2, 2011 → Dec 4, 2023 = 12.1 years, 'twelve years apart' / `12 YEARS APART`, OUR MATH from F1, F2".
   - In seo.md, replace "GTA 5 made more than 800 million dollars on day one. GTA 6 made 3.79 billion." with "GTA 5 sold more than 800 million dollars on day one. GTA 6 sold 3.79 billion dollars on day one (Take-Two estimates)."
   - Replace "the two launches open the same way" with "the two first trailers open the same way".
4. **225 s and 232 s, Truth/Clarity.** The launch-date chips sit on footage from other dates.
   - Change `GTA 5 · SEPT 17, 2013` to `GTA 5 · LAUNCH DAY`, and `GTA 6 · NOV 19, 2026` to `GTA 6 · LAUNCH DAY`.
   - Move each date onto the `$800M+` / `$3.79B` cards, where it belongs.
   - The source credit under each clip already names the trailer.
5. **The wow fix, 199–212 s (Shareability, Retention).** The DM-able beat from BRIEF ("both missed their first date") is a grid of small cards.
   - After `NOV 19, 2026` lands, collapse the grid into one hero frame. Put the two crossed first dates side by side at 2× scale (`SPRING 2013` and `2025`, each about 680×300, red strike 14 px), with `BOTH LATE` stamped across the seam at 160 px and its own dry thump in the 0.6 s pause after l5i.
   - Hold it ≥ 2.0 s. It is also the frame-0 for the chapter-5 Short planned in seo.md.
6. **254–258 s, Loop (half-fixed r3 item).**
   - Keep the oil-pump and fence-sunset clips playing (slowed about 0.5×) under "Now you pick. Which first trailer wins?" instead of the plain `2011` / `2023` text cards.
   - Cut to the `WATCH NEXT` slots only after "comments" (about 261 s).
7. **258–261 s, Craft.** `WHICH FIRST TRAILER WINS?` runs edge to edge (35 px margins).
   - Scale it to ≤ 1700 px wide (≥ 110 px margins).
   - Drop the `2011` / `2023` pills inside the clip frames (top-left of each panel, ≥ 24 px in), so they stop crossing the panel borders and crowding the breadcrumb.
8. **72–77 s, Clarity.** While the Official Trailer clips of Michael/Franklin/Trevor play, the label reads `THE SWITCH: UP TO THE SKY, DOWN AGAIN`.
   - Show `MICHAEL · FRANKLIN · TREVOR` there.
   - Swap to the switch label only when the Gameplay Video switch clip starts (about 78 s).
9. **0.6–1.2 s and 8.0–9.0 s, Hook.**
   - Land the `GTA 6 · 2023` chip at full opacity by 0.6 s with cream text on solid orange (≥ 4.5:1). This is r3's fix 7, still open.
   - Build the crossed-date cards in full under the wipe at about 8.0 s, so the 8.5 s frame isn't a near-empty stage (LESSONS: empty stage under a wipe).
10. **165 s and 26 s, Craft polish.**
    - Finish the label card's fade before the clip fades in, so no `CAR · MINIMAP` / `DRIVE` ghost text sits over the GTA 5 footage.
    - At 26 s, drop the duplicate `NOV 2, 2011` pill inside the panel that already says `NOV 2, 2011` in big type.

## Looks generic or AI-made
- The dark dashboard kit on every beat: rounded dark boxes, mono breadcrumbs, pills, `• CLIP` badges, film-strip placeholder frames. It's competent and consistent, but it is the house infographic template, not a GTA-channel look.
- The label-card wrapper before each pair (`THE CITY…`, `ONE FACE`, `SUNDOWN`, `DRIVE`, `ROB`) reads as filler.
- The blob maps (109–125 s) still look like a first draft. Leonida is now about the same height as Los Santos/Blaine, but still a generic bent bean.

## Rule checks (SAFE-EDIT jury checklist)
- No non-owned footage > 5 s unannotated: clip lint ok, and every clip has a `CLIP` badge and a source line.
- No rumour stated as fact.
- No leak or ending.
- No trailer or radio music audible.
- Numbers: all sourced. `12 YEARS APART` is derivable from F1/F2 but needs its own BRIEF row (fix 3).
- "GTA 6" is in the title and said at 0.3 s.
- No Rockstar logo or key art; the end cards are redrawn.

## Earlier Truth items (read after scoring)
- r1 (a) GTA 6 switch wheel: **resolved** (portrait cards, `ONE STORY`).
- r1 (c) year chips vs footage, frame 0 and end: **resolved** (Trailer 1 fence sunset under `2023`).
- r1 (d) "It came out": **resolved** ("GTA 6 came out November 19, 2026").
- r1 (e) / r2 (a) swamp clip running into the beach: **resolved** (MATCH lands on the flamingos, no beach at 44–47 s).
- r2 (b) "same five moves" in seo.md: **resolved**.
- r2 (c) 4:50 under JULY 9, 2013: **resolved** (`ROCKSTAR-HOSTED CUT`).
- r2 (d) / r3 (c) map size: **mostly resolved** (similar heights, prominent `NOT TO SCALE · NO SIZE CLAIM`; Leonida's area is still about 1.5×).
- r3 (a) `TAKE-TWO, 2012` with no source: **resolved** (`TAKE-TWO, JAN 2013`, BRIEF F18b).
- r3 (b) nominal 4×: **resolved** (`OUR MATH · NOT INFLATION-ADJUSTED`, F18c).
- r3 (d) `SAME SHOT? ✓ MATCH` and the unlabelled clipboard: **resolved** (`SAME KIND OF SHOT`, no tick; `OUR READING` under `YES · 4 OF 5 MATCH`).
- A similar mismatch remains at 225 / 232 s (launch-date chips over footage from other dates): fix 4.
