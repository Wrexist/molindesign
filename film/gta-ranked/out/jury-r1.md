# Jury r1: gta-ranked (fresh and independent: I did not see it being made)

**Overall 7.1 · Truth 8.5 · Verdict: fix then post** (passes the 7.0 / Truth 8.5 gate, but it is below gta-money's 7.2, so it is not better than the last film)

I judged `out/gta-ranked-vo.mp4`: 37.2 s, 1080x1920, -13.9 LUFS integrated, true peak -2.6 dBTP, no black frames. Pace: 0 hard cuts, motion 0.19 over 0-1 s and 0.516 over 0-3 s, no frozen stretches.

I looked at sheet.jpg, the poster, and frames I pulled myself at 0.0, 1.0, 2.5, 4.0, 12.4, 12.7, 13.0, 17.2, 19.9, 20.3, 22.0, 24.0, 26.0, 27.45, 27.7, 28.2, 29.5, 34.6, 35.0 and 37.15 s. I also measured on-screen change frame by frame at 10 fps and the peak level every 100 ms.

Whisper isn't installed in this container, so for the words I used the director's in-mix Whisper pass (`out/vo/heard.json`, `mix.log`: all 10 lines at WER 0) and checked those word times against my level trace. On "Guess" at about 2.0 s, Whisper also heard "Yes. Yes." That is the GUESS slam, which hits at voice level (-4 dBFS).

## Fact re-check at the sources (2026-11-06)
| Claim | Source re-fetched | Result |
|---|---|---|
| GTA 5 "sold-in over 230 million units", Q1 FY27, Aug 7 2026 | Game Developer, Aug 7 2026 | ✓ wording exact; on-screen `230,000,000+ · SOLD-IN · TAKE-TWO · AUG 2026` is correct |
| Franchise "sold-in almost 475 million" | same article | ✓; pie `ALL GTA ≈ 475M · SOLD-IN · AUG 2026` is correct; the slice is drawn at 230/475 = 48.4 % (film.js line 316) |
| San Andreas 27.5M, "remains the champ", Sept 15 2011 | Kotaku with correction | ✓; "Back then, Rockstar said it was still number one" is a fair paraphrase, with no quote marks |
| GTA 4 25M "from release through today", July 30 2013 | Game Informer | ✓ figure and date. GI attributes it to Take-Two's Q1 FY2014 call but names no speaker, so `TAKE-TWO` on the card is right and BRIEF.md's "Zelnick" is slightly loose. That name isn't on screen. |
| GTA 6 Nov 19 2026, PS5 and Xbox Series X\|S | rockstargames.com/VI | ✓ |
| "Almost half" | arithmetic | ✓ 230/475 = 48 %; holds for any value above 230 and below 475 |

**Is the ranking honestly framed? Mostly yes.** The voice scopes it once ("by the last official count"), and every number carries its own year on screen. GTA 5 is #1 by any reading: the series is about 475M, so every other GTA together is under 245M. Two soft spots:

- **The #2 / #3 order is only proven for 2011-2013.** Rank 1 is safe. The "LAST OFFICIAL COUNT" stamp is on screen only from about 4.5 to 6.6 s. After that, the #2 and #3 badges, the poster and the end frame show bare ranks. The 2013 and 2011 year tags next to them keep this acceptable.
- **Two different measures share one scale.** GTA 5 is counted as Take-Two "sold-in units", while San Andreas and GTA 4 are "copies sold". The gap is too large for this to change any rank, but only GTA 5 says SOLD-IN.

No number on screen lacks a source in BRIEF.md.

## SAFE-EDIT jury checklist (any yes = don't post)
| Condition | Result |
|---|---|
| Footage we don't own over 5 s unannotated | No. All paper graphics drawn in code: no Rockstar footage, logo, key art or box art. |
| Rumor stated as fact | No. No rumors in the film. |
| Leak or ending shown | No |
| Trailer or radio music audible | No. SCORE has `MUSIC = false`; the only bed is low-passed room noise at 0.03 and the factory SFX. |
| A number without a source in BRIEF.md | No. 25M, 27.5M, 230M+, ≈475M, "almost half" (derived) and Nov 19 2026 are all in BRIEF.md. "1 CASE = 2.5 MILLION" is a drawing scale, not a claim. |

**Result: passes.** One note: SAFE-EDIT "Always 6" asks for "GTA 6" in the title and in the first spoken second. The title "Best-Selling GTA Isn't Even Close" and the first word ("GTA") don't meet that. BROAD-TOPICS.md (newer, from 2026-11-02) relaxes it to "GTA or GTA 6 in the title or first line", so this is not a fail. The SEO step should still add "GTA 6" to the title or description.

## BROAD-TOPICS and "more graphical" check
- Pillar 3 (GTA history); the previous films were gta-money (pillar 1) and gta-pulled (pillar 7), so no pillar repeats. Packaging score 4/6 ✓.
- Anyone gets the hook; no insider jargon except "sold-in", which is never explained. List of 3 ✓. Length 37.2 s ✓ (25-40 s).
- One hero object per beat ✓. Hand-built paper cases ✓. Kinetic slams (GUESS, #3, #2, #1, ALMOST HALF) ✓. Paper wipes ✓.
- "Something new every 1-2 s" is ✗ in four stretches; see fixes 2 and 6.

## Scores
| Criterion | Score | Why |
|---|---|---|
| Hook | 7.0 | Frame 0 has 5 words, a real test ("Guess") and the search phrase on screen at 0 s. But the still is a stock "podium with ? boxes" trope, motion over 0-1 s is only 0.19 (a small arrow hop and drifting confetti), and the frame-0 pop peaks at -28 dBFS, so it is barely there. |
| Retention | 6.5 | Re-hooks land well: #3 at 6.8 s, #2 at 12.6, crown at 17.5, eruption at 22.1, wipe at 27.4. But four stretches change only about 1-3 % of pixels per frame: **4.0-6.6 s** (ledger card hold, right at the 5 s drop-off), 15.0-16.0, **28.6-30.6** (pie) and **31.5-33.6** (calendar). **-1 for a repeated LESSONS mistake** (gta-pc: "1.5-3 s freezes near the 5 s drop-off"). |
| Clarity | 7.5 | One idea, easy for a 14-year-old: GTA 5's tower dwarfs the other two. "Sold-in" is said and shown but never explained. "1 CASE = 2.5 MILLION" shows only from 10.5 to 13.5 s, and the units are thin spines, not cases. The film never says or shows "8×", which is the brief's own hard idea. |
| Truth | 8.5 | Every figure matches its source with its own date (see above). Costs: at 12.3-12.9 the caption "NUMBER TWO:" sits over GTA 4's fading `25,000,000 · JULY 2013` card, with a ghost #2 stamp on top of it (sound-off: "GTA 4 = number two"). The #2/#3 order is scoped only at 4.5-6.6 s. Sold-in and copies are mixed on one scale without saying so. |
| Motion and design craft | 6.5 | The paper cases, spines and calendar read as hand-made, and the honest scale is right: 5 px per million, 92 spines. Against it: at 23.3-25.0 the 230,000,000+ card covers the middle of the tower it is about, and at 25.3-26.9 the caption tape covers the GTA 5 case at the top. **That is -1 for a repeated mistake** (LESSONS gta-lucia r2: "a payoff plate must never cover the thing it is about"). At 34.0-37.0 the GTA 5 case is cut off by the top of the frame (only the lower half of the "5" shows). Ghost chips show at 12.4-12.8 and 27.6-27.9. From 20.5 to 26.9 the teal floor leaves y 1150-1430 empty. The synthwave sun with stripes, palm silhouettes, spotlights and confetti is a generic outrun template. |
| Voice and sound | 6.5 | Clean, intelligible Ming read; the deliberate 2.2 w/s with pauses after numbers works. But the hero hits are quiet: the 230M landing (23.4-23.9) peaks at about -18 dBFS against voice peaks of -4/-5, about 13 dB under the voice. The GTA 4 and San Andreas landings are -17/-15. The wipes are near-silent: 27.2-27.8 at -38 to -56, 30.7-31.0 at -46 to -58, and the loop swish at 36.5-37.2 at -39 to -51. There is a 0.35 s hole at 24.0-24.35 right after the payoff. **-1 for a repeated mistake** (LESSONS: juries mark down quiet hero sounds; gta-vicecity: hits ≥ 3 dB under the voice, not 13). Meanwhile the minor GUESS slam is the loudest hit in the film. |
| Loop and ending | 7.5 | "Yes or no?" plus a pink wipe back to the exact frame 0 ("Which GTA sold the most?") loops cleanly, question to question. YES and NO are identical, and nothing in the picture answers the vote ✓. |
| Shareability | 7.0 | The poster (the 230M tower over two stubs) and "almost half of all GTA sales, ever" are sendable. But most viewers already guess GTA 5, so the share line has to be the size of the gap, and the film never puts that number (8×) on screen. |

Mean: (7.0 + 6.5 + 7.5 + 8.5 + 6.5 + 6.5 + 7.5 + 7.0) / 8 = 7.125, rounded down to **7.1**. Previous Delta factory film: gta-money 7.2 (Truth 8.5), so this cut does not beat it.

## Fixes, ranked by impact
1. **Hero sounds (23.3-24.4, 11.5-12.2, 16.1-16.6, 0.0, wipes at 27.2, 30.7, 33.8, 36.5).**
   - What I saw: the 230M stamp peaks at about -18 dBFS under voice peaks of -4/-5, and the wipes are near-silent. This is the most-repeated Delta jury complaint.
   - Change: raise the hero stamp and boom so the final mix peaks at -7 to -8 dBFS, 3-4 dB under the neighbouring words.
     - Add a rising whoosh under the eruption, 21.8 → 22.1 (spine-drop ratchet speeding up, 92 ticks compressed).
     - Fill 24.0-24.35 with the boom's tail.
     - Bring the wipe swishes and the 30.8 tear up to about -14 dBFS.
     - Bring the frame-0 pop from -28 to about -12 dBFS.
     - Turn the GUESS slam (2.0, -4 dBFS) down below the hero.
   - Per LESSONS: raise the quiet hits only up to the loudest, then lower `duck.smr_db` (39 → about 33) and re-measure on the final mix.
2. **4.0-6.6 s: ledger dead stretch at the 5 s drop-off.**
   - What I saw: after the stamp, the card holds about 2.4 s with only confetti moving (1-4 % pixel change).
   - Change, keeping the line (it carries the scope):
     - Slam the stamp on "last" (5.13).
     - Before that, on "games" (4.13), have the three ? cases hop in turn under the card, 0.25 s apart.
     - Pull the ledger off at 6.0 so the #3 slam at 6.8 comes onto a clean shelf.
   - Target: a visible change every ≤ 1.2 s across 3.0-7.0.
3. **23.3-26.9: the payoff covers its own tower** (repeated LESSONS mistake).
   - What I saw: the 230,000,000+ card sits across the tower's middle (23.3-25.0), and then the caption tape "THAT'S TAKE-TWO'S SOLD-IN COUNT," covers the GTA 5 case (25.3-26.9).
   - Change:
     - Park the card in x 90-500, fully left of the tower (x ≥ 520), from its first frame.
     - In the pull-back, frame the case top at y ≥ 560 so the caption (y ≤ 520) never overlaps it, or drop the caption on `asof` since the card already says SOLD-IN · TAKE-TWO · AUG 2026.
   - Check every frame from 23.0 to 27.3.
4. **Wow: put the gap on screen (25.3-26.9).**
   - What I saw: the brief's hard idea is "more than eight times the runner-up", but neither the voice nor the screen ever says 8×.
   - Change, during the pull-back:
     - Tick the GTA 5 tower with 8 dashed rulers, each the height of San Andreas' stack (137.5 px at 5 px/M), counting up "1×… 8×" one per 0.12 s with a tick each.
     - Then slam `8× THE 2011 #2` (230 / 27.5 = 8.36; log it in BRIEF.md as derived).
   - This makes the shareable moment the size of the gap, not a winner everyone guessed. Keep the poster in that pause.
5. **12.3-12.9 and 27.6-27.9: ghosts that misread sound-off.**
   - What I saw: "NUMBER TWO:" over the fading GTA 4 `25,000,000 · JULY 2013 · TAKE-TWO` card with a ghost #2 stamp on top (reads "GTA 4 = #2"), and a smeared `SOLD-IN · AUG 2026` chip behind `ALL GTA ≈ 475M`.
   - Change:
     - Peel the GTA 4 card off by 12.2 and slam #2 only after it has left.
     - Pop the pie's SOLD-IN chip only once the wipe has fully cleared (≥ 27.9).
     - Re-check every scene boundary frame by frame (LESSONS gta-vicecity r1).
6. **28.6-30.6 (pie) and 31.5-33.6 (calendar): 2 s holds.**
   - Pie: on "all" (28.85) have a counter roll the teal side to `UNDER 245M = EVERY OTHER GTA` (475 − 230, derived; log it). On "ever" (30.35) bump the dashed ½ line with a tick.
   - Calendar: drop `PS5` and `XBOX SERIES X|S` as two separate chips on "comes" (32.0) and "November" (32.5) rather than one static strip, and flip the page 18 → 19 on "19th" (32.8) with a tick.
7. **Truth scope, 7.0-37.0.**
   - Put a small `LAST OFFICIAL COUNT` under the #2 and #3 badges whenever they show without their year tags (they always show with 2013 / 2011 in the comparison frames; keep it that way on the end frame too).
   - Change the GTA 4 / San Andreas sub-lines to `COPIES SOLD · JULY 2013 · TAKE-TWO` and `COPIES SOLD · SEPT 2011 · ROCKSTAR`, so SOLD-IN vs COPIES is visible.
   - Fix BRIEF.md fact 4's attribution ("Take-Two, Q1 FY2014 earnings call"; GI names no speaker).
   - **Before posting after Mon Nov 9:** Take-Two's Q2 FY27 report may raise 230M / 475M. Re-check, and keep number and month together.
8. **34.0-37.0: end frame crops the hero.**
   - What I saw: the GTA 5 case is cut off at y 0-80 (only half of the "5" shows), and the `GTA 6 ?` case is about 110 px wide.
   - Change: pull back so the whole GTA 5 case sits at y ≥ 300, and scale the GTA 6 case to ≥ 200 px wide (the same size as the others) so the "will it beat" comparison reads as two cases.
9. **0.0-1.0: first-second motion 0.19.**
   - Change: each ? case hops 20-30 px in turn as the arrow lands on it (0.0, 0.33, 0.66 s), and the spotlights swing 15° across the cases in the first second.
   - Target: motion over 0-1 s ≥ 0.30.
10. **Clarity of the scale and "sold-in".**
    - Re-show the scale chip as `1 SPINE = 2.5 MILLION` (spines are the units, not the case on top) at the pull-back (25.3) beside the tower.
    - Add one ≥ 36 px chip `SOLD-IN = SHIPPED TO STORES + DIGITAL` at 25.3-26.9, or cut "sold-in" from the voice and keep it on the card only.

## Generic or AI-looking
- The synthwave sun with horizontal stripes, palm silhouettes, sweeping spotlights and confetti is the stock outrun / "Vice" template. It is in every frame and says "GTA thumbnail generator" more than "hand-made". It also reads as a Vice City nod, which this film isn't about.
- Ranking on a 1-2-3 podium with ? boxes is a stock countdown trope.
- What reads as hand-made: the paper keep-cases, the spine stacks with cut edges, the crown and the torn calendar. Keep those props; make the backdrop quieter or our own.
