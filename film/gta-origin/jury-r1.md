# Jury r1: gta-origin ("GTA Was Almost Canceled", Delta)

Jury: video-jury, fresh eyes, 2026-11-11. I checked the final render `out/gta-origin-vo.mp4` (32.32 s, 1080x1920, 30 fps). `check/sheet.jpg` dates from 07:51, before the 08:04 re-time, so it is stale and I did not use it. I pulled my own frames at 0.0, 0.5, 1.0, 1.5, 2.0, 2.5, 3.5, 4.6, 5.6, 6.6, 7.6, 8.6, 9.0, 9.3, 9.6, 10.6, 10.9, 11.1, 11.6, 12.6, 13.0, 13.6, 14.6, 15.0, 15.3, 15.6, 16.6, 17.6, 18.2, 18.6, 19.0, 19.2, 20-31 s (every second), 31.6 and 32.2 s. I read BRIEF.md, TREATMENT.md, vo/script.json, events.json, pace.txt, mixrun.log, film.js (credit sizes), LESSONS.md and the earlier Delta scores. I re-opened the Gamasutra/Game Developer Penn article (2011-01-31), the Engadget Race'n'Chase report (2011-03-22) and rockstargames.com/VI ("November 19, 2026") today.

**Measurements**
- Loudness: -14.0 LUFS integrated, true peak -2.6 dBTP, LRA 2.4. No black frames.
- Pace: OK. Motion is 3.14 over 0-1 s and 2.94 over 0-3 s, with no frozen stretches. The city scrolls all the time.
- In-mix Whisper (mixrun.log): 13/13 lines at WER 0. GTA is the first spoken word, at 0.2 s.
- Hits on the final mix (peak / RMS of the window):
  - stamp at 1.9 s: -10.5 / -23.2
  - crash pops at 10.6 s: -8.2 / -23.1
  - skid at 12.8 s: -9.3 / -23.9
  - **siren at 15.7 s: -15.4 / -26.5** (too quiet)
  - ram at 17.8 s: -7.6 / -18.9 (the loudest hit)
  - KEEP slap at 22.9 s: -13.3
  - peel at 26.5 s: -13.2
  - For comparison, the voice measures -3.3 peak / -15.7 RMS. No music bed.
- Type: the credit chips are 36-38 px in film.js. `PC · EUROPE` is set at 40 px, but the scaled calendar card renders it at about 30-33 px (my estimate from the frame). Measure it.

## SAFE-EDIT jury checklist (fail if any item is true)
| Item | Result |
|---|---|
| Footage we don't own, over 5 s, unannotated | No. Everything is our own paper drawing, with no GTA 1 sprites. |
| A rumor stated as fact | No. The bug is always "one developer thinks" / "I THINK IT WAS A BUG". |
| A leak or ending shown | No |
| Trailer or radio music audible | No. There is no music at all. |
| A number with no source in BRIEF.md | No. 1995, 1997, 2011 and NOV 19 2026 are all sourced (facts 1, 7-10). |

The checklist is clean. Other safe-edit notes:
- There is no Rockstar logo, key art, box art or livery. The `GTA` on the case is our own heavy sans, not the Pricedown logo.
- There is no "AI" anywhere.
- Frame 0 has 5 tokens: GTA WAS ALMOST CANCELED on the caption, plus GTA on the case. That is within the 6-word limit.
- Deviation from SAFE-EDIT rule 6: "GTA 6" is not in the first spoken second (first said at 27.35 s), and it is not in the planned title. The caller accepted "GTA". The SEO agent should still put "GTA 6" in the YouTube title or description.

## Truth, claim by claim
| Claim (voice / screen) | Source today | OK? |
|---|---|---|
| GTA was almost canceled / the publisher wanted to scrap it; strip `"THE PUBLISHER … WANTED TO CAN IT …"` · GARY PENN · DMA DESIGN | Penn: "It was almost canned. The publisher, BMG Interactive, wanted to can it, as it didn't seem to be going anywhere." | Yes. The ellipses are correct. |
| So what saved it? | Gamasutra: "a serendipitous moment … turned things around"; PC Gamer: "saved by psycho police car bug" | Acceptable as a question (press framing). |
| It began in 1995 as Race'n'Chase; `DESIGN DOC · 1995 · VIA MIKE DAILLY` | Engadget: design docs posted by Mike Dailly, dated sixteen years before 2011-03-22 | Yes |
| But it crashed all the time | Penn: "it crashed all the f---ing time" | Voice yes. **Picture no:** the DESIGN DOC · VIA MIKE DAILLY chip sits under the CRASH windows from 9.0 to 11.1 s, so with the sound off the crash claim reads as credited to the 1995 design doc. It is Penn's. |
| And the handling was terrible; `"THE CAR HANDLING WAS APPALLING"` · PENN | Penn: "the handling -- the car handling was appalling" | Yes. The quote starts mid-sentence, so strictly it wants a leading "…" (LESSONS memory r1). Minor. |
| Then one day the cops went crazy / tried to ram you off the road | Penn: "One day, I think it was a bug, the police suddenly became mental and aggressive … trying to ram me off the road" | Yes |
| One developer thinks it was a bug; `"I THINK IT WAS A BUG"` · GARY PENN · DMA DESIGN · GAMASUTRA 2011 | Exact words, hedge kept, credit on the same card | Yes |
| He called it awesome. It stayed in.; `"THAT WAS AWESOME, SO THAT STAYED IN."` | Exact words | Yes |
| GTA came out in 1997; `1997 · PC · EUROPE · FIRST RELEASE` | BRIEF fact 9 (year only) | Yes |
| GTA 6 lands November 19; `NOV 19 2026` | rockstargames.com/VI, fetched today: "November 19, 2026" | Yes |
| Good thing nobody fixed it. | Penn: "so that stayed in" | Mostly. It treats Penn's "I think it was a bug" as settled. It works as a joke because "one developer thinks" came 12 s earlier. Not docked. |

Every spoken claim is clean and the hedges are kept. The losses are all in the picture:
- **-0.5:** the design-doc credit labels the crash claim (9.0-11.1 s).
- **-1.0 (repeat of LESSONS gta-gators r2, a Truth lesson):** quote strips stay up after their beat has left.
  - 13.0-~14.9 s: the handling strip "THE CAR HANDLING WAS APPALLING" hangs under "THEN ONE DAY, THE COPS WENT CRAZY" and beside the swerving cop car.
  - 23.6-~24.8 s: both Penn strips and their credit are still up under "GTA CAME OUT IN 1997."

## Scores
| # | Criterion | Score | Why |
|---|---|---|---|
| 1 | Hook | **7.0** | Strengths:<ul><li>GTA is the first spoken and the first printed word.</li><li>The stake is clear in 4 words.</li><li>The city scrolls from frame 0, and the stamp is visible from 0.5 s.</li></ul>Weaknesses:<ul><li>As a still, frame 0 is a caption tape over a blank cream case, close to a title card. Nothing threatens anything until the stamp swings in.</li><li>The stamp only lands at 1.9-2.0 s.</li><li>The cop car, the film's hero, is nowhere on frame 0.</li></ul> |
| 2 | Retention | **7.0** | Strengths:<ul><li>32.3 s long, with no dead stretch.</li><li>A new object every 2-3 s.</li><li>Re-hooks at 4.2 s ("So what saved it?"), 13.0 (ONE DAY), 15.9 (ram) and 18.5 (bug).</li></ul>Weaknesses:<ul><li>The motion is mostly the same constant city scroll, and the eye stops counting it.</li><li>The hero props stand still at 4.6-5.7, 7.6-8.9 and 26.5-28.4 s.</li><li>The ram, the beat that should spike, is the smallest picture in the film (fix 3).</li></ul> |
| 3 | Clarity | **7.0** | A 14-year-old gets "nearly canceled, the cops went rogue by accident, they kept it". Weaknesses:<ul><li>Several reads at once: 11.6-14.6 s has caption, strip and credit; 21-24.5 s has caption, two strips, credit and KEEP (five reads).</li><li>Race'n'Chase's cops-and-robbers idea is never shown. Which car is the cop only reads from the small light bar.</li><li>With the sound off, "what saved it" is answered by a ladybug, not by the ram.</li></ul> |
| 4 | Truth | **8.0** | See the table: the voice is excellent, the picture has two attribution slips, and one of them is a repeated LESSONS mistake (-1). |
| 5 | Motion & design craft | **6.0** | Strengths:<ul><li>The top-down paper city is our own, hand-made, full-bleed and on palette.</li><li>Type is big and clean.</li><li>Credits are ≥ 36 px.</li></ul>Weaknesses:<ul><li>ONE DAY covers the cop car on "the cops went crazy" (13.0-15.3 s).</li><li>The CRASH windows half-cover the RACE'N'CHASE sign and the 1995 card, leaving "R…SE" and "19" fragments (9.3-11.1 s).</li><li>The crash windows carry macOS traffic-light dots, a 2020s UI in a 1995 DOS story.</li><li>The handling strip butts into the caption tape at 13.0 s.</li><li>Every beat uses the same centred caption tape.</li><li>The saturated pink/teal/orange blocks fight the props for figure-ground.</li><li>During the ram (16-18.5 s) the hero zone below y ≈ 1160 is only road.</li><li>**-1 for repeating LESSONS temperature r2 / math r2** (a credit left labelling the next beat's claim).</li></ul> |
| 6 | Voice & sound | **7.0** | Strengths:<ul><li>The hook is in the first words, and every line is heard clean.</li><li>Hits sit in the pauses.</li><li>The ram is the loudest hit, and there is no bed.</li></ul>Weaknesses:<ul><li>Delivery is about 2.3 words/s with long gaps, so it feels slow.</li><li>The siren, the "cops went crazy" sound, is near-inaudible at -15.4 peak / -26.5 RMS.</li><li>KEEP and the peel are at -13.</li><li>The stamp lands about 1.7 s after it first appears.</li></ul> |
| 7 | Loop & ending | **8.0** | "Good thing nobody fixed it." leads into "GTA was almost canceled.", and 32.2 s is the frame-0 layout with the ladybug just leaving. That is a clean loop. The caption is back about 0.5 s before the voice restarts, which is fine. |
| 8 | Shareability | **7.0** | The fact is very sendable: "GTA's cops trying to kill you was a bug they kept". But no frame carries it. The ram is two small cars side by side. The best still, the ladybug on the cop car with the "I THINK IT WAS A BUG" card, has the strip covering the cop car. |

**Overall: 7.1** (57.0 / 8 = 7.125, not rounded up). **Truth 8.0.**
**Gate (overall ≥ 7.0 AND Truth ≥ 8.5): HOLD. Truth fails.**
**Verdict: don't post (as rendered).** All of the Truth losses are mechanical. Fixes 1 and 2 alone restore Truth to about 9.0, and with them this becomes fix-then-post.

Compared with the previous Delta film (gta-preload r1, 7.0 / Truth 8.5), the overall is up 0.1 and Truth is down 0.5. The voice script is the best-sourced and best-hedged Delta script so far, and every Truth loss is in the picture again (the same pattern as vercetti).

## Fixes, ranked by impact
1. **9.0-11.1 s, wrong credit on the crash claim (Truth).** `DESIGN DOC · 1995 · VIA MIKE DAILLY` stays under the CRASH windows and "BUT IT CRASHED ALL THE TIME".
   - Fade it out by T.crash (9.0 s), so it is gone before "But".
   - Put a `GARY PENN · DMA DESIGN` credit (≥ 36 px) on the CRASH window stack from 9.3 s.
   - The crash claim is Penn's, not the design doc's.
2. **13.0-14.9 s and 23.6-24.8 s, quote strips carried into the next beat (Truth, repeat of LESSONS gta-gators r2).**
   - Peel the handling strip and its credit off under the ONE DAY slam, fully gone by 13.0 s, before "Then one day".
   - Peel both Penn strips and the GAMASUTRA credit before the `GTA CAME OUT IN 1997` caption appears (by about 23.9 s). Do it under the zoom-out, not after.
   - Then re-check every caption change frame by frame.
3. **15.9-18.6 s, the ram is the film's DM moment and it is tiny (raises the wow).** Both cars are about 300 px wide in mid-frame, parked side by side, and nobody leaves the road.
   - Push the camera 1.0 → 1.6x onto the pair over 15.9-17.8 s, so the cop car is ≥ 600 px wide and nose-in.
   - Shove the orange car ≥ 250 px sideways over the kerb onto a city block at 17.84 s.
   - Burst an impact star of ≥ 300 px with paper flecks on the crunch.
   - Slam `RAM` kinetic type (≥ 140 px, pink) in the 0.5 s pause.
   - Hold the landed frame ≥ 1.0 s as the poster.
   - Keep the push inside the x 90-930 rail (LESSONS gta-lucia: pixel-scan the frames).
4. **13.0-15.3 s, ONE DAY covers the cop car on "the cops went crazy".**
   - Move the ONE DAY tag to the left kerb (about x 120-430, y 1240-1340).
   - Keep the cop car fully visible, with its light bar flashing at ≥ 2x its current size (pink/teal, 4 Hz) while it swerves.
5. **Frame 0 to 2.0 s, the opening still is a caption over a blank case (Hook).**
   - Have the stamp already ≥ 40 % in frame and mid-swing at 0.0 s, so it lands at 1.0-1.2 s rather than 1.9 s. Keep the thud in the "canceled" pause, or let it fire before the first word, quieter than the voice (LESSONS memory r2).
   - Park the teal cop car on the road below the case (y 1300-1430) with its light bar blinking, so the film's hero is seen in the first second and the lower frame is filled.
   - Frame 0 stays at 5 tokens.
6. **15.6-15.9 s, the siren is inaudible.**
   - Raise it to about -10 dBFS peak, with a 1-3 kHz layer (LESSONS wifi r2), still ≥ 3 dB under the neighbouring words.
   - Bring the KEEP slap (-13.3) and the 26.5 s peel (-13.2) up to about -10.
7. **9.3-11.1 s, CRASH windows half-cover the RACE'N'CHASE sign and 1995 card (fragments "R…SE", "19").**
   - Fly the sign and the calendar out under the first window, or stack the windows so they fully cover both.
   - Replace the macOS traffic-light dots with a DOS-style box (a single title bar, `ERROR` text, no rounded dots). The story is set in 1995.
8. **21.0-24.5 s, five reads at once** (caption, "I THINK IT WAS A BUG" strip, "THAT WAS AWESOME" strip, credit, KEEP note).
   - Peel the bug strip as the awesome strip lands (about 21.0 s), and keep one shared credit.
   - Show one quote at a time, and keep the ladybug and the cop car visible above it rather than under a strip.
9. **24.6-26.47 s, CANCELED stays on the case beside `1997 · FIRST RELEASE` for about 1.9 s** (it only peels at 26.47 s). With the sound off, a released game reads as still canceled.
   - Peel the stamp on "came out" (about 24.6 s), with the tear sound in the pause after "1997".
10. **26 s card, `PC · EUROPE` renders at about 30-33 px after the card scale** (my estimate).
    - Measure it on the frame. If it is under 36, set it to 48 px in `cal97`, or move the text onto the FIRST RELEASE chip.
    - Add a leading "…" to `"…THE CAR HANDLING WAS APPALLING"` (it is cut mid-sentence).

## Generic or AI-made?
- **Reads as hand-made:** the paper city, kraft roads, palms, cut-paper cars and the ladybug sticker are clearly our own drawings. Nothing morphs, and there is no stock imagery.
- **Generic risks:**
  - The block-grid city is uniform wallpaper, with the same saturated tiles all the way down. It reads as a pattern fill rather than a place. Add one or two landmarks per act (a DMA-style office block, a police station) and lower the tile saturation by about 20 % so the props pop.
  - The same centred caption tape on all 13 beats is turning into the Delta template.
  - The macOS-style error windows are a stock UI cliche.
