# gta-secrets: jury r3 (independent, fresh eyes)

Film `out/gta-secrets-vo.mp4`: 1080x1920, 30 fps, 39.0 s. Juried 2026-11-15. I scored before reading anything from r1/r2. The only r2 context I used is the BRIEF.md log, and only to check which fixes landed.

## Measurements
- Loudness (ebur128): **-14.1 LUFS integrated**, LRA 3.8 LU, true peak **-2.5 dBFS**. OK.
- blackdetect (d 0.1 s): **no black frames**. silencedetect (-40 dB, 0.4 s): no dead-air gaps.
- pace.txt: 2 hard cuts, motion 0-1 s 0.568, 0-3 s 0.858, median 0.26, 1.5 % still frames. OK, no frozen stretch, so Hook is not capped.
- Whisper: `faster_whisper` and `whisper` are **not installed** here, so I could not check what the voice actually says. Voice is judged from script.json and the timed captions. That stays an open risk until someone runs a listen check: does Ming say "Jock" and not "Jack", and "Chilly add"?
- Frames read: 0.0, 1.0, 2.5, then every 1.5 s to 38.5 and 38.9, plus poster.jpg.

## Delta / SAFE-EDIT checks
| Check | Result |
|---|---|
| Frame 0 ≤ 6 words, GTA early | ✓ `GTA 5 / STILL HIDES THIS` (5 words, GTA 5 first) |
| "GTA" in first spoken second | ✓ "G T A five still hides secrets" at 0.2 s |
| No Rockstar footage, logo or key art | ✓ everything is our own flat paper drawings, tagged `OUR DRAWING` |
| Rumors and theories labeled | ✓ mostly: `FAN THEORIES` chip with both readings as questions. ⚠ `JUST TO MESS WITH YOU?` is an ex-Rockstar designer's remark, but it sits under the FAN THEORIES chip (see fix 5) |
| Every number sourced in BRIEF.md | ✓ 3 secrets, 2013, 11 PM, 44,000 (fact 11, dated), Nov 19 2026, "over a decade" (GamesRadar+ 2025) |
| GTA 6 date | ✓ `NOV 19 2026 · PS5 · XBOX SERIES X\|S` matches fact 10 |
| Trailer or radio music, leaks, endings | none |

None of the jury-checklist fail conditions apply.

## Scores
| # | Criterion | Score | Why |
|---|---|---|---|
| 1 | Hook | **7.5** | The frame 0 still works: a pale ice sheet, a creeping crack, a dark arms-up figure and the search phrase in 5 words. But the silhouette already reads plainly as a big-headed alien with eyes, so the mystery is half spent. Then 2.5 s is a **blank `3 SECRETS` card** with the alien's legs sticking out under it, so it reads as a sign on stilts. The second read in the hook window is empty. |
| 2 | Retention | **7.0** | Something changes about every 1.5 s, and the 1/2/3 numerals give a re-hook every 8-11 s. Weak spots: each numeral card (5.5, 13.0, 25.0 s) is a ~1 s grey-lilac title beat with nothing in it but a digit and a coin. The mural holds one composition from 17.5 to 23.5 s, and at ~20.5 the top 60 % of the frame is empty brick between captions. |
| 3 | Clarity | **8.0** | Three items, one place each, map chips, captions match the voice. A 14-year-old gets it. One small slip: the `100% COMPLETION?` / `JUST TO MESS WITH YOU?` notes are about ~22 px tall and sit over the mural boxes, so they don't read in one pass. |
| 4 | Truth | **8.5** | Every spoken line matches the sources: alien under the ice in the first mission, can't break it, the mural as PC Gamer describes it with "maybe" on the jetpack, past-tense "argued for over a decade", the ghost at 11 PM, Jock in blood, Jock as her husband, Nov 19. Docked for two things. (a) Ben Hinchliffe's remark is filed under `FAN THEORIES`, which mislabels its source. (b) "GTA 5 *still* hides" is present tense on all versions, but BRIEF.md's patch caveat says no source tests the 2022/2025 versions. The film should carry a `STORY MODE` chip at least. |
| 5 | Motion and design craft | **7.0** | The paper look is consistent and the scratch-off panels, coin, bridge and ghost read as hand-made. Flaws: the poster/ghost scene leaves a **dead navy band from y ≈ 1515 to 1920** (21 % of the frame). The `OUR DRAWING` tag sits on the alien's torso at 8.5-11.5 s. There are the stilt legs at 2.5 s. Theory notes are under 36 px. Nearly every beat is the same centred single object again (LESSONS gta-longestwait). The lighthouse beam runs straight through the clock at 29-33 s. |
| 6 | Voice and sound | **7.0** | The hook is in the first words and the mix is at spec. I couldn't hear-check it (no Whisper here). The script has hero pauses after "ice", "Jock" and "name", but nothing proves the SFX land in them. The end line has 12 spoken words in 5 s ("Will it have a ghost? Yes or no?") and runs straight into the loop with little air. Scored conservatively. |
| 7 | Loop and ending | **7.5** | The visual loop is clean: 38.5-39.0 s wipes back to the exact frame 0 composition, and the little ghost peeking behind `GTA 6 · ???` is a nice touch. The spoken loop is weaker: "Yes or no?" → "GTA 5 still hides secrets" is a non sequitur, and it changes the subject from GTA 6 back to GTA 5. |
| 8 | Shareability | **7.5** | The ghost over `JOCK` + `HER HUSBAND` is a real send-to-a-friend frame, and the poster carries it. "Go check at 11 PM tonight" is never said or shown as a call to action, though, so the DM-able task isn't spelled out. |

**Overall: 7.5** (60.0 / 8) · **Truth 8.5**
**Verdict: fix then post.** The channel gate (overall ≥ 7.0 and Truth ≥ 8.5) passes, but only at the floor. The factory rule says 7.0-7.9 is fix then post.

The r2 fixes listed in the BRIEF log all landed:
- mur3 is past tense ("FANS ARGUED FOR OVER A DECADE.").
- The 44,000 plate is dated (`SUBREDDIT · GAMESRADAR, NOV 2024`) and not spoken.
- Both readings are shown as questions.
- `OUR DRAWING` is on the ghost scene.
- The foil hold shows the numeral only.

## Fixes, ranked by impact
1. **2.0-3.2 s: blank card with stilt legs.** The `3 SECRETS` card is empty until ~3.3 s, and the alien silhouette's legs show below it. Fade the alien out completely (opacity 0 by 1.9 s) before the card lands. Have the three `SECRET 1/2/3` foil panels already slotted at 2.2 s, dropping in 0.12 s apart, so the hook window never shows an empty card.
2. **29.0-33.5 s and the poster: dead bottom band.** y 1515-1920 is a flat navy floor. Extend the green hill and rock base down to y 1700 and move the ghost+rock group down ~150 px. Put a takeaway plate in y 1450-1650 (left of x 930) that reads `GO CHECK · 11 PM–MIDNIGHT · STORY MODE` (≥ 44 px). This is the wow fix: it gives viewers the "go check tonight" task the brief promised, it gives the poster a sendable instruction, and it fills the empty band.
3. **20.0-23.5 s: mural theory notes.** `100% COMPLETION?` and `JUST TO MESS WITH YOU?` are about 22 px and cover the mural boxes. Move them off the mural to either side as two ≥ 40 px cards on red string. Relabel the chip so the source is right: keep `FAN THEORY` for 100% COMPLETION and give the other one `EX-ROCKSTAR DEV (DIDN'T MAKE IT)`, or drop it. This is the Truth point.
4. **Whole film: version caveat.** Add a small `STORY MODE` chip next to `GTA 5 · 2013` on the 3 SECRETS card (2.2-4.8 s), so "still hides" isn't read as a claim that it was verified on today's patch. It costs nothing and lifts Truth.
5. **5.0-6.2, 12.8-14.0, 24.6-25.6 s: grey numeral beats.** Each 1/2/3 card is a lone digit on a flat lilac or grey field for ~1 s. Show the place chip and the first prop silhouette under the numeral during the foil hold (e.g. the bridge outline under "1", the summit station under "2", the lighthouse under "3"). Then the beat is a preview instead of a pause, and it stops repeating the centred-single-object layout.
6. **8.4-11.8 s: tag over the alien.** `OUR DRAWING` sits on the alien's torso. Move it to bottom-left (x 110, y ~1350) as on the ghost scene, and keep the alien's whole body clear.
7. **33.9-39.0 s: end line and loop.** The 12 words in about 5 s crowd the loop. Cut to "GTA 6: November 19th. Will it have a ghost?" (8 words). Hold the YES/NO chips silent for 0.6 s. Let the panel scrape reveal the frame-0 ice so the cut back to "GTA 5 still hides secrets" feels like an answer ("…here's one it already has").
8. **0.0-1.5 s: frame 0 gives the answer away.** The silhouette has visible eye whites and a clear alien outline. Blur it more (σ ≈ 2x) and drop the eye highlights until `ice2` at 7.4 s, as the BRIEF asked ("dark, unreadable shape"). The viewer should guess, not know.
9. **29-33 s: lighthouse beam through the clock.** The beam ends exactly on the clock face. Shorten the beam or move the clock to x ~760, y ~420, out of its path.
10. **Before posting: listen check.** Run the Whisper in-mix check on the PC. Confirm "Jock" (not "Jack"), "Chiliad", and that the coin-scrape, ting and brush SFX peak ≥ 3 dB under the neighbouring words (LESSONS gta-vicecity). This jury could not verify the sound.

## Generic or AI-made
- Centred single object, cream caption strip at top, chip below it: this layout repeats on almost every beat (ice, mural, ghost, calendar). That is the house template, but LESSONS gta-longestwait already flagged it. No full point is deducted, because the scratch-off panels and props vary.
- The confetti flecks on the end calendar are a stock "launch" flourish. They don't belong to the ghost or secret world. Use falling ice flecks or scratch-off foil dust instead.
- The flat grey alien (big head, almond eyes) is the default "alien" glyph. It's acceptable, since the brief deliberately avoids any film likeness, but it is the least hand-made prop in the film.
