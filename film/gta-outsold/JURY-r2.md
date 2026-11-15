# gta-outsold, jury round 2 (fresh eyes, 2026-11-15)

Film: `/mnt/project-files/factory/gta-outsold/gta-outsold-vo.mp4` (1080x1920, 30 fps, 36.6 s; render of 08:34, not byte-identical to `film/gta-outsold/out/gta-outsold-vo.mp4`, judged on the factory copy). Poster: `/mnt/project-files/factory/gta-outsold/poster.jpg`.

How I judged it: a 2 fps contact sheet of all 73 frames, full frames at 0.0, 1.0, 2.5, 5.5, 9.0, 12.0, 13.4, 13.8, 14.5, 18.0, 19.9, 20.2, 21.0, 22.5, 23.0, 26.5, 27.2, 29.0, 30.0, 32.0, 33.4, 35.0, 36.0 and 36.5 s, crops at 10.9–16.3 s (NO stamps, Tetris rise) and on both counter rolls, the poster, `pacecheck.py` on the factory file, ebur128 and blackdetect, my own faster-whisper (base.en) pass on the final mix, peak levels of mix against voice-only in every pause, `out/events.json`, `vo/script.json`, `vo/vo.js`, BRIEF.md, TREATMENT.md, `film.js` (the counter lines), SAFE-EDIT.md, BROAD-TOPICS.md and LESSONS.md. I scored before I read JURY.md (round 1).

## Scores
| Axis | Score | Why |
|---|---|---|
| Hook | 7.5 | Frame 0 has 5 words, `WHICH GAME OUTSOLD GTA 5?`. GTA is on screen and spoken at 1.14 s, and the `GTA 5` plate is on the stack from frame 0. A covered tower with a pink `?` sets a real test. Motion is 0.427 over 0–1 s and 0.356 over 0–3 s (OK). Minus: as a still, the top 300 px is empty curtain and the GTA stack is a small object at the bottom left (y about 1000–1400). "Best-selling game", the main search phrase, never appears on screen. |
| Retention | 7.5 | 36.6 s, no frozen stretch (pace OK, median motion 0.227). There's a turn every 2.5–3.5 s ("Not", "Tetris?", "But", "Minecraft", "190M", "GTA 6", the vote), and the calendar now flips. The middle never feels dead. Minus: the payoff most gamers already half-know (Minecraft) lands at 22 s, and nothing after 30.6 s re-hooks except the question. |
| Clarity | 8.0 | One idea, readable by a 14-year-old: GTA 5 is huge, Minecraft is bigger, and Tetris's number is a pile of games. The honest scale does the explaining. Minus: 29–30.6 s shows seven labels at once (190M+ MORE, MARIO KART + WII SPORTS STILL SHORT, EACH COMPANY'S OWN COUNT, NEARLY 235M tag, XBOX CEO chip, 425,000,000+, two plates). The Tetris fan cases read as "T T T T" at phone size. |
| **Truth** | **9.0** | Every spoken and printed number checks out (table below). The counters now roll in whole millions (`film.js` 554, 589: `Math.floor(v/1e6)*1e6`, frames show `23,000,000`, `409,000,000`). `SOLD-IN`, `CLAIMED`, `EACH COMPANY'S OWN COUNT` and `GUINNESS WORLD RECORDS` scope every claim, and there is no GTA 6 forecast. The towers are drawn to scale: in the poster the GTA 5 tower is 425 px and Minecraft is 768 px (ratio 1.81 = 425/235), the 343 px gap = 190M, and the Nintendo stack tops at about 155M of it. Not a full 9.5 because of two sound-off misreads: 19.73–20.25 s `ONE SINGLE GAME SOLD MORE:` sits over the still-hanging `TETRIS · 520M+ CLAIMED` tag and a `1984 →` arrow that curves into the covered tower, so for about 0.5 s it reads "Tetris is the one single game". And `#1 SINGLE GAME` is our gloss on Guinness's "Best-selling videogame" (fair, but not their words). |
| Motion and design craft | 7.0 | The paper cases, kraft floor, taped tags and honest rescaling ruler are genuinely hand-made, and the strings from round 1 are gone. Minus: the owners of the numbers (`THE TETRIS COMPANY`, `NINTENDO`, `GUINNESS WORLD RECORDS`) are printed at about 20–26 px, under the 36 px rule, so with the sound off the sources are unreadable on a phone. Transient collisions: the YES / NO tags slide over the `NOVEMBER 19.` caption at 33.3–33.6 s; the torn sheet flies across the GTA 5 tag at 22.4–22.7 s; the Tetris fan still covers the GTA 5 base and the bottom of the cover at 17–19.6 s. The top 0–300 px is empty curtain in every beat. The look is still a labelled bar chart, made of paper. |
| Voice and sound | 6.5 | Ming is clean: my Whisper pass on the final mix hears all 11 lines word for word, and the director's in-mix check agrees. −14.0 LUFS, true peak −2.6 dBTP, no black frames, no music. Minus: there are only 16 SFX events in 36.6 s, and the VAD gate has pushed them away from the picture. The `NO` stamps land on screen at about 11.3 s and 11.9 s silently, then both slaps fire together at 12.82 and 12.93 s. The Tetris fan splits at about 17.2 s, but its riffle plays at 19.36 s. The native move (cases stacking into towers: GTA 5, Tetris rising 13.8–15.9 s, Minecraft, the Nintendo cases dropping into the gap) has one tick, at 0.08 s, although BRIEF promised "a tick per case". **Docked a full point for a repeated LESSONS mistake** (gta-vicecity r1: "the native move needs its own sound"; gta-songs r2: the gate starves the hero beat). Round 1's level fix overshot: the hero hits now peak at −14.8 (rip), −14.7 (stamp), −13.6 / −14.0 (thunks) and −11.7 (snap) dBFS against voice peaks of about −3. That is 9–12 dB under, and they read as faint. |
| Loop and ending | 8.0 | "Can GTA 6 catch Minecraft?" leads back into "Which game outsold GTA 5? Guess." The last frame (36.5 s) is frame 0 at full opacity. YES and NO are identical, and the GTA 6 plate is empty. |
| Shareability | 7.5 | The poster now has a second "huh" on top of the known answer. `190M+ MORE` beside Minecraft, with both Nintendo giants stacked into the gap and `STILL SHORT`, is the screenshot to send the friend who says GTA 5 is the biggest game. |

**Overall: 7.8** (63.0 / 8 = 7.875, not rounded up). Round 1 scored 7.5 / Truth 8.0. Last Delta pass, gta-stars r2: 7.3 / Truth 8.5. This is the best Delta cut the factory has made.

## Verdict: **fix then post**. Gate PASS (overall 7.8 ≥ 7.0, Truth 9.0 ≥ 8.5)
Nothing blocks posting. Fixes 1–3 are mechanical, take one re-mix plus a small re-time, and are where the remaining points are. Per LESSONS ("don't spend a fix round chasing 0.2 points"), if a re-render costs the slot, post as is.

## SAFE-EDIT and caller checklist
| Check | Result |
|---|---|
| Footage, logo, key art we don't own | None. Plain paper cases with name plates only. No Rockstar, Mojang, Nintendo or Tetris art, no tetrominoes, no grass block, no pixel font, no green on Minecraft. |
| Music | None. Own SFX only. |
| Rumor as fact / GTA 6 prediction | None. The end is a question, and the GTA 6 plate is empty. |
| Leak or ending | None. |
| Every on-screen number sourced or derived, and round | OK. 235M / NEARLY 235M (deck), SOLD-IN (10-Q), 72M and 82.9M (Nintendo IR), 520M+ (Tetris Co.), 425,000,000+ (Xbox CEO), 190M+ (derived), NOV 2026, SEPT 2026, 1984, NOV 19 2026. The counters roll in whole millions only. The Mario Kart + Wii Sports stack (154.9M) is derived and listed in BRIEF. |
| Overclaims | None. Sold vs sold-in is on the GTA tag all film long, "each company's own count" sits beside the gap, and "claims" / `CLAIMED` is used for Tetris. |
| Frame 0 ≤ 6 words, GTA early | OK. 5 words, GTA on screen at frame 0 and spoken at 1.14 s. |

## Fact check (done today, 2026-11-15)
| Claim | Verdict |
|---|---|
| GTA 5 "nearly 235 million sold", Take-Two's count, November | OK. I downloaded Take-Two's "Investor Presentation, November 2026" PDF; it says "Nearly 235 million units sold to date" and "Grand Theft Auto VI on November 19th". The SEC 10-Q (quarter ended Sept 30 2026) says GTA V "has sold-in over 230 million units worldwide", and the film carries `SOLD-IN`. |
| Minecraft "over 425 million copies", Xbox's boss | OK. VGChartz, Sept 26 2026: Xbox CEO Asha Sharma, "After 17+ years and 425M+ copies sold …", "425 million units sold lifetime". |
| Tetris "claims over 520 million", counting every Tetris game since 1984 | OK. The Tetris Company says "over 520 million units have been sold worldwide" and "Created in 1984". The all-versions aggregation rests on BRIEF fact 8 (Wikipedia's list), and the voice says "claims". |
| Mario Kart 8 Deluxe 72M, Wii Sports 82.9M | OK, with a caveat. MK8DX is 72.00M as of Sept 30 2026: Nintendo IR per search text, consistent with 71.53M in June. The Nintendo IR page returned only a shell to curl, and the Wii Sports page returned 328 bytes. Wii Sports 82.90M is long-standing and rests on search text plus Wikipedia, as BRIEF says. |
| "Over 190 million more" and the 154.9M stack | OK. Over 425M minus under 235M is over 190M; 72 + 82.9 = 154.9M, which is under 190M. Both are drawn to scale. |
| `#1 SINGLE GAME` · Guinness | OK in substance. Guinness's record is "Best-selling videogame: Minecraft, 350,000,000 units, April 2025". The word "single" is ours. |
| GTA 6 November 19 | OK. rockstargames.com/VI contains "November 19, 2026", and so do the deck and the 10-Q. |

## Fixes, ranked by impact
1. **11.0–19.6 s: put sound back on the picture (Voice +1).** The `NO` stamps hit the screen at about 11.3 s (Mario Kart) and 11.9 s (Wii Sports) in silence, and then both slaps fire 1–1.5 s late at 12.82 and 12.93 s. The fan splits at about 17.2 s, but the riffle plays at 19.36 s. Move the picture to the pauses, not the sound under the voice. Land the Mario Kart `NO` at 11.42–11.66 s (the gap after "Kart."), land the Wii Sports `NO` at 12.70 s with its slap, and start the fan split at 18.75 s (after "1984") so the 19.36 s riffle sits on it. Hold the whole Tetris tower until then, which also keeps `ALL VERSIONS` readable.
2. **The native move is silent (Voice; repeats gta-vicecity r1).** Add a soft case tick per case in every build: 0.0–0.9 s GTA 5, 13.8–15.9 s Tetris rising, 22.4 s Minecraft revealed, 30.0–30.6 s the Nintendo cases dropping into the gap. Make them quiet (peak ≤ −18 dBFS, so the VAD gate can let them through under or between words), speeding up as each tower climbs.
3. **Hero hits now too quiet (Voice).** The rip is at −14.8 dBFS, the stamp −14.7, the thunks −13.6 / −14.0 and the snap −11.7, against voice at about −3. Lower `duck.smr_db` from 31 to about 26, then re-measure on the final mix. Target hero hits at −7 to −8 dBFS: still at least 3 dB under the voice (round 1's rule), but no longer faint.
4. **19.6–20.3 s: Tetris tag under "ONE SINGLE GAME" (Truth).** `TETRIS · 520M+ CLAIMED` and the `1984 →` arrow are still up when `ONE SINGLE GAME SOLD MORE:` appears at 19.73 s. Peel the Tetris tag, the orange `EVERY TETRIS GAME, ADDED UP` and the fan by 19.70 s, inside the 19.23–19.73 s pause. Re-aim the `1984 →` arrow along the fan, not into the covered tower.
5. **Owner print too small (Craft and sound-off Truth).** `THE TETRIS COMPANY`, `NINTENDO` (on both tags) and `GUINNESS WORLD RECORDS` are about 20–26 px. Raise them to ≥ 36 px. Widen the tags or drop to two lines (for example `520M+ CLAIMED` / `TETRIS CO.`).
6. **Wow (picture only, no new voice): count the Nintendo drop.** At 30.0–30.6 s, drop the Mario Kart cases and then the Wii Sports cases into the bracket one after the other, each with its own tick (fix 2). A small counter beside them lands `72M` → `154.9M` (derived, already in BRIEF) under the `190M+` top, with `STILL SHORT` stamped on landing. The "both Nintendo giants can't fill the gap" moment becomes the film's peak instead of a static label, and it gives the poster its sound.
7. **29.0–30.6 s: seven labels in one frame (Clarity).** While the bracket holds, fade the `XBOX CEO · X POST` chip (it is already said) and shrink the GTA tag to `NEARLY 235M · SOLD-IN`. Keep at most five text objects.
8. **33.3–33.6 s: YES / NO slide over `NOVEMBER 19.`** Start the YES / NO entrance at 33.60 s, once the caption has swapped to `CAN GTA 6 CATCH MINECRAFT?`, or bring them in from below the question, never across the previous caption.
9. **0.0–3.5 s: frame 0 uses half the frame.** Push the camera about 1.15× so the GTA 5 stack and the cover fill y 350–1430 (the top 300 px is empty curtain). Consider `BEST-SELLING GAME?` as a 1.5 s pop-in after "Guess." (not on frame 0), so the search phrase is on screen by 3 s.
10. **17.0–19.6 s: Tetris fan legibility.** The fan still covers the GTA 5 base and the cover's foot, and its cases read "T T T". Pivot the fan from the Tetris base to the right of the GTA tower, and print 3–4 front cases large with plain years (`1984`, `1989`, `2006`, …; no platform names). "Every version" then reads with the sound off.

## Did round 1's fixes land?
| R1 fix | Status |
|---|---|
| 1. Counter noise (Truth blocker) | **Landed.** `film.js` 554/589 round to whole millions, and the frames I checked show only round values. Truth is up from 8.0 to 9.0. |
| 2. SFX level with the voice | **Landed, overshot.** The hits are now 9–12 dB under the voice and read faint (fix 3 above). |
| 3. Nintendo towers in the gap (wow) | **Landed.** It is the best moment in the film and the poster. It is static; fix 6 makes it a beat. |
| 4. String clutter, floating Nintendo tags | **Landed.** The strings are gone and the tags are taped. At 10.6–11.0 s the Mario Kart tag still floats at the 300M height for a few frames before settling. |
| 5. Poster ruler overlap and fill | **Mostly landed.** `190M+` is clear of the ruler labels and the hero now fills y 475–1400. The floor below y 1400 is still blank (it is under the UI line, so this is acceptable). |
| 6. `#1 SINGLE GAME` credit | **Landed.** `GUINNESS WORLD RECORDS` is under the stamp, but at about 22 px (fix 5). |
| 7. `SOLD-IN` on the GTA tag | **Landed.** It is in pink on the GTA 5 tag from 10.5 s to the end. |
| 8. Frame-0 plate and drape | **Landed.** The plate is on from frame 0, the sheet has a draped top, and the corner lifts on "Guess." |
| 9. Tetris fan covering things | **Partly.** It stays inside the rail now (about x 780), but it still covers the GTA 5 base and the cover's foot (fix 10). |
| 10. Soft stretches | **Landed.** `SOLD-IN` is underlined on "count", and the calendar flips from `NOV` to `19`. |

## Looks generic or AI-made?
No. The paper cases, grain and taped tags read as hand-made, and the honest scale is a craft choice a template wouldn't make. The one generic feel is structural: a labelled bar chart that adds a tag per beat. The beats that break it (the drape rip, the fan, the Nintendo stack) are where the film comes alive, so give those beats the sound and the timing (fixes 1, 2 and 6).
