# Jury round 2 (final): gta-holdup ("GTA 6 Trailer 1 Ended on This")

A fresh jury on 2026-11-24 that did not make this film. I scored `out/gta-holdup-vo.mp4` cold, before reading jury-r1.md. The file is 25.87 s, 1080x1920, 30 fps, rendered 11:26Z. I used `.claude/agents/video-jury.md`, the SAFE-EDIT jury checklist and the frame-0 rule in delta/RUN.md ("Launch week").

What I looked at:
- **Stills:** 0.0, 1.0, 2.0, 2.5, 7.0, 9.9, 12.6, 13.5, 16.8, 17.3, 17.6, 17.9, 20.5, 23.25 and 25.8 s, plus the 1 fps sheet and the poster.
- **Source check:** I compared the `elsame` and `t1aisle` source frames side by side.
- **Sound:** I read the current make2.log and mix.log Whisper results and voice.log. picture.log and mixrun.log are stale: they are from the 27.4 s r1 render and show the old lines. I measured loudness myself and measured the mix peaks in every voice gap.

## Verdict: **PASS, fix then post** (overall 7.6, Truth 9.0)

| Criterion | Score | Why |
|---|---|---|
| Hook | **7.5** | Frame 0 shows `TRAILER 1 / ENDED ON THIS` in 5 words, plus a `GTA 6` chip. Behind it, Rockstar's last shot is already moving, about 804 px wide, with the arrow on her head. `A STORE HOLDUP` is up by 0.95 s and the ring is on the bandana by 1.0 s, so the frame-0 rule **passes**. Motion is 0.98 over 0–1 s and 1.02 over 0–3 s. The spoken hook is 6 words, with a tock at about −22 dBFS before it. What holds it back: the robbers are small figures inside a monitor inside a dark frame. The whole bottom 40 % of frame 0 is empty checker floor. Frame 0 uses three emphasis systems at once (yellow arrow, red ring arriving, red bar). A sound-off stranger who never watched Trailer 1 gets "a robbery" but no reason to care yet. |
| Retention | **7.5** | Something changes every 1–1.5 s, and re-hooks land at 7.0 (doubt), 9.9 (August), 12.6 (split), 15.1 (HUD push), 17.6 (redraw), 20.4 (quote) and 23.3 (vote). There are no freezes; pacecheck passes with 0.1 % still frames. Soft spots: 17.4–17.9 s is a mostly black monitor with two stars drawing in (it carries the ticks, but it reads as a loading box). 23.2–24.3 s shows two grey text-only tiles (`TRAILER 1` / `EXTENDED LOOK`) before the footage stills arrive on "which". The `t1aisle` shot appears twice within 9 s (3.85 s and 12.6 s). That is defensible for the comparison, but a viewer has already seen it. |
| Clarity | **8.0** | One idea, in order: last shot, date, doubt, the Extended Look, the match, the HUD, the source, the vote. Captions now break on phrases, one read at a time. "HUD" is shown (the yellow frame on the real corner, then the redraw) as it is said. "Extended Look" is never explained beyond its name. A casual 14-year-old won't know it is Rockstar's 26-minute in-game video until the quote card at 20.4 s. |
| Truth | **9.0** | Every spoken and on-screen claim traces to BRIEF §3. Dec 4 2023 is F1. "Ended here" is the last shot before the logo (F2), and the cut stops before the VI logo. Aug 27 2026 and the in-game-footage line are F3; `"IN-GAME FOOTAGE"` is an exact excerpt under `AN EXTENDED LOOK`, and the cap line now names "that whole video". The HUD is F4, and my look at 17.3 s matches the redraw: 4 filled and 2 outline stars, 5 discs, `20 73`, a pistol, tagged `RE-DRAWN`. The bandana is F5. The dip question is now one the film can answer honestly. There are no names, no "same scene" and no "mission". Residual: (a) the redraw fills the 4 stars bright white where the source's are dim grey, which makes them look more "lit" than the source. (b) "Same low camera" is our reading of two shots; it is fair, but it is stated as fact. |
| Motion & design craft | **7.0** | The r1 fixes are visible. The split is tilted and offset, the HUD push sits on the real corner with the credit moved bottom-left, and the redraw now has the five discs and a real pistol shape. The quote card sits low on the bright `pcar` plate. Everything stays inside x 90–930 and above y 1450. Still: about 8 of 11 beats are the same caption → centred monitor → 2023–2026 rail stack. y ~1330–1450 is dead on almost every beat. The split's two footage windows are only about 470 px wide, so the money shot is the smallest footage in the film. The 17.4–17.9 s black box looks unfinished. I make it not a full LESSONS repeat this round, because three beats break the stack. |
| Voice & sound | **7.5** | Ming US_James: WER 0 on all 10 lines through the mix, 2.3–3.5 w/s, −13.9 LUFS, −2.7 dBTP, LRA 2.1 LU, no black frames, no music bed. Hits are audible in the gaps: about −4 dBFS at 1.95–2.1 s, −11.8 at 4.8 s, −7.3 at 9.5 s, −11.6 at 12.5 s, −12.2 at 15.0 s, −8.4 in the star-tick gap at 17.6–18.2 s and −12.7 at 23.0 s. The native move finally has sound. Soft words in the dry listen check: "Trailer" 0.09 (end line), "Wanted" 0.10 and "HUD" 0.39. They pass through the mix but may sound mushy. The −22 dBFS frame-0 tock is timid. The 20.0–20.4 s gap into the quote card is silent (−27.8 dBFS), and that is the source beat. |
| Loop & ending | **8.0** | "Trailer or game: which holdup hits harder?" sits over a two-option vote with neither side highlighted. Then the frame-0 layout returns with the rail hidden, so the last frame cuts cleanly into frame 0 and the question leads back into "Trailer 1 ended on this". The tail is 0.45 s after the last word (25.42 s). |
| Shareability | **7.0** | The `SAME BANDANA` split (also the poster, now with GTA 6 and the cover text) is a decent DM image, and the HUD push gives a "wait, it's real" beat. But the payoff, "the HUD is on", is still mild for fans who saw the Extended Look in August. No single line makes someone send it. |

**Mean:** (7.5 + 7.5 + 8.0 + 9.0 + 7.0 + 7.5 + 8.0 + 7.0) / 8 = 61.5 / 8 = 7.69, recorded as **7.6** (never rounded up).
- **Gate:** 7.0+ overall and Truth 8.5+, so it **passes**. Under 8.0, so the verdict is fix then post.
- **Comparison:** up from r1 6.6. It sits above gta-cast r2 7.2 and gta-daysales r2 7.0, and level with the best Delta passes. No LESSONS repeat cost a full point this round.

## SAFE-EDIT jury checklist
- **Footage we don't own over 5 s unannotated: pass.**
  - The longest continuous Rockstar run is 0–4.86 s (`tend` → `tend` punch-in → `t1aisle`), and every frame carries ring, chip and `CLIP · ROCKSTAR · …`.
  - Rockstar footage is 50 % of the runtime, right at the ½ cap; make2.log warns about it. Do not add footage time without cutting some.
- **Rumor stated as fact: pass.** None.
- **Leak or ending shown: pass.** Official videos only, and the cut stops at 78.35 s, before the VI logo.
- **Trailer or radio music audible: pass.** Clips are muted; the audio is voice, SFX and room tone.
- **Number with no source: pass.** Dec 4 2023, Aug 27 2026, `20 73` and 4/6 stars all trace to F1, F3 and F4. "5 ICONS" is a count of what is on screen, with no meaning claimed.
- **Frame-0 rule: pass.** 5 words on frame 0; the payoff `A STORE HOLDUP` is up by 0.95 s.
- **Length: pass.** 25.9 s, inside 20–30 s.

## r1 fixes: did they land?
| r1 fix | Status |
|---|---|
| 1 HUD hero with sound | **Landed.** 3× push onto the real corner, credit moved, full-width redraw with discs and pistol, ticks at about −8 dBFS in a reserved gap. |
| 2 Trailer-1 implication | **Landed.** The dip is "Just a trailer moment? Or in the game too?"; the cap is "Rockstar says that whole video is in-game footage." |
| 3 5 s freeze | **Landed.** Three shots by 4.86 s, a moving rewind board, a hit at 4.8 s. |
| 4 Caption breaks | **Landed.** Phrase breaks throughout. |
| 5 Break the centred stack | **Partly.** Tilted split, low quote card and full-bleed plate are done. The hook monitor is about 804 px, not full-bleed, and the floor is still empty. |
| 6 Tail | **Landed.** 0.45 s, rail hidden on the loop frame. |
| 7 6-word hook | **Landed.** Plus a frame-0 tock, though it is quiet. |
| 8 Aim annotations | **Landed.** Arrow on her head, ring on the bandana at 1.0 s and on the poster. |
| 9 Poster | **Landed.** GTA 6 and the cover text are on it, both rings on bandanas. |

## Fixes, ranked by impact (polish before posting; none blocks the gate)
1. **Wow: show that the store matches too, not only the bandana (12.6–14.85 s, Share, Clarity).**
   - My side-by-side of the `elsame` and `t1aisle` source frames shows the same red e-Cola "SPREAD THE FIZZ" sign top-left in **both** shots, and a "PI…" / `$14` Pißwasser price card in both.
   - BRIEF F5 says "a different store". That reading looks wrong, or at least unproven, so re-check it in the sources first.
   - If the signs hold up frame by frame, add a second ring on the sign in each monitor with a chip `SAME SIGN`, between "Same red bandana" and "Same low camera". Make the split bigger: footage windows ≥ 700 px wide, tilt ±3°, top monitor y 360–860, bottom y 820–1320.
   - Say only "same sign", not "same store", unless you confirm it. This is the one image people would screenshot.
2. **Grow the hero on frame 0 and use the floor (0–2.45 s, Hook).**
   - Make the monitor 1000 px wide (x 40–1040), footage ≥ 940 px, and lift the bottom of the frame to about y 1400 so the robbers fill the frame.
   - Drop the yellow arrow (the ring already does the job by 0.45 s). That leaves one emphasis system plus the headline.
3. **Fill the 17.4–17.9 s black box (Retention, Craft).**
   - Start the redraw with all six star outlines and the five disc outlines already drawn faintly at 17.4 s, so the ticks *fill* slots instead of appearing in a void.
   - Tint the 4 filled stars light grey (#cfcfcf), not white, to match the source's dim stars (Truth polish).
4. **Footage in the vote tiles from 23.2 s, not 24.3 s (Retention).**
   - The grey `TRAILER 1` / `EXTENDED LOOK` text tiles read as placeholders for about 1 s.
   - Show the stills from the start of the vote (the 50 % footage cap: trim the `pcar` plate by 1 s to pay for it), or slam the tiles in on "Trailer" (23.35 s) and "game" (23.9 s) with a hit each.
5. **Put a hit on the source beat (20.0–20.4 s, Sound).** The gap into the quote card is silent at −27.8 dBFS. Add a stamp at about −10 dBFS on the card's arrival, and raise the frame-0 tock from −22 to about −14 dBFS.
6. **Explain "Extended Look" once at 9.9 s (Clarity).**
   - Under the `EXTENDED LOOK` chip, add a 36 px sub-chip `ROCKSTAR · 26-MIN IN-GAME VIDEO`. "26-min" is F3; "in-game" is Rockstar's own word.
   - Keep it on screen for at least 2.3 s (readcheck).
7. **Swap the second `t1aisle` use, or vary it (3.85–4.86 s vs 12.62 s, Retention).**
   - Use `tend` guns-up for "red bandana" at 3.85 s, and save the aisle for the split, so the comparison shot is new when it lands.
   - Or crop the 3.85 s use tight on the face (2× punch) so the split reads as the reveal of the full frame.
8. **Clean up the logs and the BRIEF before posting (process).**
   - picture.log and mixrun.log are from the r1 render (27.4 s, old lines). Re-run or delete them so no one gates on the wrong file.
   - Fix the BRIEF F5 "different store" wording as in fix 1, and drop the BRIEF §1 "same low camera ... checked frame by frame" claim if the camera heights differ.

## Looks generic or AI-made
- The caption pill → centred CRT monitor → mono `CLIP · ROCKSTAR · …` kicker → 2023–2026 rail stack on most beats still reads as a kit.
- TV-static flicks on every switch are a stock "retro" move. They now carry sound, which saves them, but four or more in 26 s is the template showing.
- The yellow-highlighted keyword in every caption plus the red ring plus the yellow arrow: still one emphasis system too many on the hook.

## Measurements
- **pacecheck** (current pace.txt): 25.9 s, 1 hard cut, motion 0–1 s 0.984 and 0–3 s 1.021, median 0.72, still frames 0.1 %. OK, no frozen stretches.
- **ebur128:** I −13.9 LUFS, LRA 2.1 LU, true peak −2.7 dBFS.
- **blackdetect** (d=0.2): none.
- **Voice:** 0.12–25.42 s; tail 0.45 s; WER 0 on 10/10 lines through the mix (make2.log).
- **Gap peaks (dBFS):**

| Gap | Peak |
|---|---|
| 0–0.12 s | −22.4 |
| 4.79 s | −11.8 |
| 9.52 s | −7.3 |
| 12.48 s | −11.6 |
| 14.96 s | −12.2 |
| 17.6–18.2 s | −8.4 |
| 20.03–20.4 s | −27.8 |
| 23.0 s | −12.7 |
| tail | −21.4 |

- **Footage:** Rockstar 50 % (at the cap), all real footage including plates 73 %, creator clips 0 %, clip lint ok.
