# Jury r2: gta-origin ("GTA Was Almost Canceled", Delta)

Jury: video-jury, fresh eyes, 2026-11-11, round 2 (the last allowed round). I scored this round before opening jury-r1.md.

**What I checked**
- Render: `out/gta-origin-vo.mp4`, 33.22 s, 1080x1920, h264/aac.
- Frames:
  - `check/sheet.jpg`.
  - My own frames at 0.0 and every second through 33.1.
  - 4 fps strips over 0-3, 8.5-11.5, 12.5-15.5, 17-20, 21-26.5 and 30-33.2 s.
  - Full-resolution frames at 0.0, 4.9, 19.8 and 26.5 s.
- Files: BRIEF.md, TREATMENT.md, vo/script.json, pace.txt, mix.log, LESSONS.md.
- Sources, re-opened today:
  - Game Developer/Gamasutra Penn article (2011-01-31), full text.
  - Engadget Race'n'Chase report (2011-03-22).
  - rockstargames.com/VI, which shows "Coming November 19, 2026".

## Measurements
- **Loudness:** -13.9 LUFS integrated, true peak -2.6 dBTP, LRA 2.9 LU. No black frames.
- **Pace (pacecheck):** 0 hard cuts. Motion is 2.83 over 0-1 s and 2.58 over 0-3 s. No frozen stretch, because the city scrolls all the time.
- **In-mix Whisper:** 13/13 lines at WER 0. "GTA" is the first spoken word, starting at about 0.3 s.
- **SFX, measured on the final mix** (voice-only track scaled and subtracted, 0.1 s windows). Voice peaks run -2 to -5 dBFS.
  - The ram at 18.4 s is -10 and the siren at 16.3 s is -12. Both are clearly heard.
  - Most other hits are -16 to -26: pen/clank 4.0, 5.3, crash pops 8.7 and 10.6, KEEP slap 22.5, peel 25.4, swish 24.6.
  - **The CANCELED stamp lands at about 1.1 s, under the word "canceled". Its residual is -21 to -26, masked by the voice, and the 1.8-2.3 s pause written for it is silent (-51 dBFS).**
  - Other dead-silent pauses: 23.4-24.5 s (1.1 s), 27.3-28.2 s (0.9 s) and the loop tail 32.5-33.2 s.
- **Type:**
  - Credit chips have a cap height of about 27 px, so the font is about 37 px: passes 36.
  - `PC · EUROPE` has a cap height of about 33 px: passes.
  - Captions sit at y ≈ 315-490, labels stay left of x 930 and above y 1450, and the backgrounds bleed full frame.
  - The hero props fill y 300-1430 on every beat except the ram (17.0-18.3 s), where y 1150-1430 is only road.

## Checklists
| SAFE-EDIT jury checklist (fail if true) | Result |
|---|---|
| Footage we don't own, over 5 s, unannotated | No. Everything is our own cut-paper drawing, with no GTA 1 sprites. |
| A rumor stated as fact | No. The bug is always hedged ("One developer thinks", "I THINK IT WAS A BUG"). |
| A leak or ending shown | No |
| Trailer or radio music audible | No. There is no music at all. |
| A number without a source in BRIEF.md | No. 1995, 1997, 2011 and NOV 19 2026 are facts 1 and 7-10. |

| Caller check | Result |
|---|---|
| Frame-0 text ≤ 6 words, GTA early | **6 words, at the limit.** The caption reads GTA WAS ALMOST CANCELED. (4), the stamp reads CANCELED (it is already in frame at 0.0 s) and the case reads GTA. GTA is the first word. Under the jury rubric, more than 5 caps Hook at 6 (see Hook). |
| GTA spoken in the first second | Yes, at about 0.3 s. Note: SAFE-EDIT rule 6 asks for **"GTA 6"** in the first spoken second, and it is first said at 28.3 s. The caller accepted "GTA". The title, description or pinned text must carry "GTA 6". |
| Type ≥ 36 px | Pass (smallest: credit chips at about 37 px) |
| Frame filled y 300-1430 | Pass, except the ram beat's lower band (17.0-18.3 s) |
| A new object every 3-4 s | Pass. Case 0, trash can 2.3, ? 4.3, 1995/cars/sign 6, CRASH 9.2, spin/APPALLING 11.2, ONE DAY 14, RAM!/star/2nd cop 17-18.7, beetle 20.3, KEEP 22.6, 1997 card 25, NOV 19 28.5, beetle crawl 31.3, loop case 32.7. |
| No Rockstar logo, key art, footage or music | Pass. The `GTA` is our own heavy sans, not Pricedown, and the cars carry no real livery. |
| No "AI" anything | Pass |

## Truth, claim by claim (sources re-read today)
| Claim (voice / screen) | Source | OK? |
|---|---|---|
| GTA was almost canceled. / The publisher wanted to scrap it. Strip `"THE PUBLISHER … WANTED TO CAN IT …"` · GARY PENN · DMA DESIGN | Penn: "It was almost canned. The publisher, BMG Interactive, wanted to can it…" | Yes. The ellipses are honest. |
| So what saved it? (`SAVED` highlighted pink) | Gamasutra: "a serendipitous moment … turned things around for the team, said Penn". PC Gamer headline: "saved by psycho police car bug". | Acceptable as a question, but at the edge. Penn also calls fixing the crashes "pivotal … the first step", and the film never says the crashes were fixed. So the film implies the bug alone saved it. The pink on SAVED pushes the press word. Credit placement: Penn's canned strip and `GARY PENN · DMA DESIGN` stay under "SO WHAT SAVED IT?" from 4.2 to about 5.7 s (frame 4.9 s). With the sound off, Penn's name sits under the "saved" question. |
| It began in 1995 as Race'n'Chase. `1995`, `RACE'N'CHASE`, `DMA DESIGN DOC · 1995` | Engadget: design docs posted by Mike Dailly, dated 16 years before 2011-03-22. Hammond: first meeting 23 Jan 1995. | Yes. The credit sits only under the 1995 beat and is gone by 9.0 s. |
| But it crashed all the time. CRASH stack + `GARY PENN · DMA DESIGN` | Penn: "it crashed all the f---ing time" | Yes. The sign and the 1995 card share frame with "BUT IT CRASHED" for about 0.3 s (9.0-9.3 s). That is harmless, because it is the same project. |
| And the handling was terrible. `"…APPALLING"` · Penn | Penn: "the car handling was appalling" | Yes. The credit is still fading under "THEN ONE DAY, THE COPS WENT CRAZY" at 13.5 s. That is harmless, because it is also Penn's claim, but it should be gone by then. |
| Then one day, the cops went crazy. / They tried to ram you off the road. | Penn: "the police suddenly became mental and aggressive … trying to ram me off the road" | Yes. It is first-hand. There is no on-screen credit on these two beats, but the credit arrives on the next card. |
| One developer thinks it was a bug. `"I THINK IT WAS A BUG"` · GARY PENN · DMA DESIGN · GAMASUTRA 2011 | Exact words, hedge kept, credit on the same card | Yes |
| He called it awesome. It stayed in. `"THAT WAS AWESOME …"` · same credit | "That was awesome, so that stayed in." | Yes. The bug strip peels before the awesome strip lands, so there is one quote at a time. |
| GTA came out in 1997. `1997 · PC · EUROPE · FIRST RELEASE` | BRIEF fact 9 (year only) | Yes. The CANCELED stamp peels on "came out". |
| GTA 6 lands November 19. `NOV 19 2026` + `GTA 6` pill | rockstargames.com/VI, today: "Coming November 19, 2026" | Yes |
| Good thing nobody fixed it. | "so that stayed in" | Acceptable as a joke. It treats "I think it was a bug" as settled, together with the "saved" framing (see above). |

Every spoken sentence matches a re-read source word for word, and every credit sits under its own claim, with two small spills (4.2-5.7 and 13.5 s). The 0.5 docked is for the "saved" framing (question, pink highlight, Penn credit under it, and the fixed crashes left out), which the end line closes as settled. **Truth 8.5.**

## Scores
| # | Criterion | Score | Why |
|---|---|---|---|
| 1 | Hook | **6.0** | Capped. Frame 0 shows 6 words (the caption's 4, plus CANCELED on the stamp, plus GTA on the case), and "CANCELED" appears twice. The rubric caps more than 5 at 6. **Not docked again** as a LESSONS repeat (gta-editions r2: a round-1 fix pushed frame 0 up), because the caller's limit (≤ 6) and the brief's own limit hold. Strengths: GTA in the first word printed and spoken, motion 2.83, and the cop car's nose in frame. Uncapped it would be 7: the cream case reads as a notebook, and the hit is masked under the voice. |
| 2 | Retention | **6.5** | Under 60 s, a new object every ≤ 3.5 s and the city always moving. Weaknesses:<ul><li>The setup sags with no re-hook from "SO WHAT SAVED IT?" (4.3 s) to ONE DAY (14.0 s): about 10 s of 1995 → crash → handling, right in the swipe zone.</li><li>Prop holds where only the scroll moves: 14.0-16.2 s (ONE DAY plus a cruising cop car; the swerve comes only at about 16 s), 25.9-28.2 s (1997 card, with 0.9 s of silence) and 28.5-31.2 s (calendar).</li></ul> |
| 3 | Clarity | **7.5** | A 14-year-old gets it: nearly scrapped, then the cops went rogue by accident, then they kept it. Quotes now come one at a time. Weaknesses:<ul><li>Caption, quote strip and credit still read together at 2.3-5.7, 11-13.5 and 19-24.6 s.</li><li>RAM! and the caption "THEY TRIED TO RAM YOU OFF THE ROAD" are two reads of the same idea.</li><li>Which car is "you" is never set up; the orange car is only implied as the player.</li></ul> |
| 4 | Truth | **8.5** | See the table above. |
| 5 | Motion & design craft | **7.0** | Strengths: the cut-paper top-down city, cars, ladybug and DOS-style CRASH boxes read as hand-made, and the rail and safe zones hold. Weaknesses:<ul><li>The stamp lands with a smeared double ghost at 1.0 s.</li><li>The quote strip sits on top of a second cop car for 19-24.6 s, so a light bar and wheels poke out between the strip and the credit and look like a layering bug.</li><li>RAM! lingers into the bug caption at 19.0-19.2 s.</li><li>The same centred caption tape on all 13 beats.</li><li>The tile city is uniform wallpaper at full saturation, competing with the props.</li><li>The ram's lower band is empty road.</li></ul> |
| 6 | Voice & sound | **6.0** | Strengths: the hook is in the first words, the voice is clean at WER 0, there is no bed, and the ram is the loudest hit. Weaknesses:<ul><li>The frame-0 stamp, the hook's own hit, now fires under "canceled" and is masked, and its written 0.4 s pause is silent.</li><li>Three more written pauses are silent: 23.4-24.5, 27.3-28.2 and 32.5-33.2 (the loop swish).</li><li>Most hits are 14-22 dB under the voice.</li><li>About 2.3 words/s with long gaps, so it feels slow.</li></ul>**-1 for repeating LESSONS gta-songs r2 / memory r2 / longestwait:** hero hits not in their written pauses, and quiet hits. |
| 7 | Loop & ending | **7.5** | "Good thing nobody fixed it." leads into "GTA was almost canceled.", and the last 0.5 s returns to the frame-0 layout with the stamp mid-swing. That works. It loses points because the tail is silent, so the seam has no sound, and the beetle leaves frame before the cut. |
| 8 | Shareability | **7.0** | The fact is sendable: "GTA's cops trying to run you off the road was a bug they kept". But no single frame carries it:<ul><li>The ram is two cars side by side, then a mid-size star, and the orange car never leaves the road.</li><li>The best still (ladybug on the cop car) is cute rather than chaotic.</li></ul> |

**Overall: 7.0** (56.0 / 8 = 7.00, not rounded). **Truth 8.5.**

**Gate (overall ≥ 7.0 AND Truth ≥ 8.5): PASS, at the floor on both.** Under the rubric's own verdict scale this is **fix then post**.

Comparison:
- r1 was 7.1 with Truth 8.0. Truth is up 0.5, and all r1 attribution slips are fixed (doc credit, peeled strips, one quote at a time).
- Hook dropped a point: the r1 frame-0 fix put the stamp on frame 0 (5 → 6 words) and moved its thud under the voice.
- Equal to gta-preload r1 (7.0 / 8.5).

## Fixes, ranked by impact (apply only if a re-render is allowed; none are needed for the gate)
1. **0.0-2.3 s, frame 0 at 6 words with CANCELED twice, and the stamp hit masked (Hook, Voice).**
   - Cut the caption at frame 0 to `ALMOST` on tape between the case and the stamp, so the frame reads GTA · ALMOST · CANCELED (3 words). Bring the full caption in at 0.3 s with the voice.
   - Slow the swing so the stamp lands at 1.85-2.0 s, inside the silent pause after "canceled", with a thud of about -9 dBFS peak, ≥ 3 dB under the neighbouring words.
   - Kill the double-ghost blur at 1.0 s: cap the motion-blur samples on the stamp, or limit its rotation to ≤ 8° per frame.
2. **4.2-5.7 s, Penn's strip and credit under "SO WHAT SAVED IT?", with SAVED in pink (Truth margin).**
   - Peel the canned strip and credit under the `?` slam, fully gone by 4.2 s.
   - Change the caption to `SO WHAT TURNED IT AROUND?` (Gamasutra's words; BRIEF open question 2), or at least drop the pink from SAVED.
   - The voice can stay.
3. **16.3-18.7 s, the ram is the DM moment and still doesn't leave the road (raises the wow; best poster).**
   - At the 18.35 crunch, shove the orange car ≥ 280 px sideways over the kerb onto a city block and spin it 40-60°, with pencil skid marks.
   - Add a 10-14 px screen shake for 0.2 s and a star ≥ 320 px with paper flecks. Light the whole frame pink/teal from the light bar for 6 frames.
   - Drop the caption on this beat and let `RAM!` (≥ 140 px) be the only read.
   - Put the second cop car in y 1150-1430 so the lower band isn't empty. Use the landed frame as the poster, inside the x 90-930 rail.
4. **23.4-24.5, 27.3-28.2 and 32.5-33.2 s, silent written pauses, and quiet hits (Voice, Loop).**
   - Fill them: the KEEP slap moved into 23.45 s, calendar flaps 1997 → 2026 in 27.3-28.2 s (the flips finish before the NOV 19 page shows, LESSONS gta-vicecity r2), and a paper swish into the stamp swing at 32.6 s, so the loop seam has sound.
   - Lift the crash pops, KEEP, the peel and the trash clank from -16 to -26 up to -10 to -12 peak.
5. **5.7-14.0 s, no re-hook for about 10 s (Retention).** Use the existing 1.0 s pause after "terrible" (12.5-13.5 s): slide the trash can from line 2 back in toward the case with a clank, and tilt the case toward it. That brings the threat back right before ONE DAY.
6. **14.0-16.2 s, the cop car cruises for 2 s on "the cops went crazy".** Start the swerve on "crazy" (about 15.3 s), not after it. Flash the light bar from the first frame of ONE DAY, and turn the road scroll up 1.5x on "cops".
7. **19.0-24.6 s, the quote strip sits on the second cop car (craft).** Drive the second cop car out of frame by 19.0 s, or park it at y ≥ 1500. Hide RAM! before the bug caption shows (by 19.0 s).
8. **25.9-31.2 s, two long holds on case + card (Retention).** Give each a beat of life: the beetle peeks from behind the 1997 card at about 27 s, and the GTA 6 pill pops with a tick on "six" (28.6 s).
9. **13.4-13.6 s:** finish the `GARY PENN · DMA DESIGN` fade before the ONE DAY caption appears.
10. **Upload:** put "GTA 6" in the YouTube title or the first line of the description (SAFE-EDIT rule 6 is not met in the voice).

## Generic or AI-made?
- **Reads as hand-made:** the paper city, kraft roads, palms, cut-paper cars, the ladybug and the DOS CRASH boxes. Nothing morphs, and there is no stock imagery or AI-made footage.
- **Generic risks:**
  - The same centred cream caption tape on every beat (the Delta template).
  - The uniform, fully saturated tile city with no landmark (add a DMA-style office block or a police station once per act, and drop the tile saturation by about 20 %).
  - The CANCELED stamp and the question-mark cut-out are stock explainer moves.
