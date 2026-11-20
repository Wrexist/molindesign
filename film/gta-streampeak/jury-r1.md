# Jury round 1: gta-streampeak (Delta Short, 27.8 s)

Read on 2026-11-20 by a fresh jury. Checked: out/check/sheet.jpg, out/poster.jpg, frames from the final mp4 at 0.0, 1.0, 2.0, 2.5, 12.4, 14.6-16.7 (5 frames), 17.0-19.6 (7 frames), 22.0, 24.0, 26.0, 27.3 and 27.7 s; pace.txt (OK: 0 frozen, motion 0-1 s 0.694, 0-3 s 0.828); ebur128 (-13.9 LUFS, true peak -2.7 dBTP, LRA 3.2); blackdetect (none); hit levels against vo/vad.js; loop seam (encoded first vs last frame).

## Truth check (both Streams Charts pages re-fetched with curl on 2026-11-20)
- Day-one recap: "reaching a peak of 7.91 million concurrent viewers", "Overall Peak Viewers 7,915,475", "Twitch Peak Viewers 3,313,371", "more than 4.5 times that of the previous record holder, Valorant (1.74 million)", "most popular game ever on Twitch". All match the counter, 7.9 MILLION, ×4.5, 3.31M and the voice.
- Nov 18 article: table "Valorant (Closed Beta) 2020 1,737,267"; "closed beta reached 1.74 million concurrent viewers in April 2020" (matches APRIL 2020 and 1.74M); "the gaming category with the highest Peak Viewers in Twitch history", "surpassing League of Legends (3.11 million)"; FAQ "This is a record among games, not across all Twitch categories" (matches #1 GAME EVER ON TWITCH · BY PEAK VIEWERS).
- Platform peaks are never summed or shown as slices of 7.9M. No sales number. No footage, music, rumor or leak. Every number has a source in BRIEF.md. The SAFE-EDIT fail list is clean.
- Picture problems (not false, but they can mislead with the sound off): the 4.5x grey stack carries a single "1.74M · 2020" tag at full GTA height (poster frame); "7.9" and "GTA" peek out beside the SALES receipt for about 0.6 s before the ≠ stamp; the "at once" condition is a ~32 px chip until 4.5 s.

## Hook rule (SAFE-EDIT)
Frame 0: plate GTA 6 + counter 7,915,475 + "7.9 MILLION VIEWERS" (5 words plus the counter digits). The LAUNCH RECORD payoff is on screen by 2.0 s. No cap. The same number appears twice on frame 0, and the frame shows a count but no contrast.

## Scores
| Criterion | Score | Note |
|---|---|---|
| Hook | 7.0 | Strong hand-made counter, "G T A six" spoken at 0.24 s, motion OK. But the number has no stake until ×4.5 at 15.7 s, and frame 0 spends its space printing the number twice |
| Retention | 6.5 | Pace is good (a change about every 1.2 s). **-1 repeat** (gta-longestwait r2, Delta batch 11-17: reveal up before the line that asks for it): LAUNCH RECORD sits on screen from 1.9 s while the voice asks "Is that a record?" at 6.2 s, so the film's only question is already answered |
| Clarity | 7.0 | A 14-year-old gets it. The DM frame confuses, though: two equal towers tagged 7.9M and 1.74M |
| Truth | 8.5 | Every spoken and printed number checks out. Docked for the 1.74M tag on the 4.5x stack, the 7.9/SALES adjacency and the small "at once" scope (see above) |
| Craft | 6.5 | The brass tally counter and paper stamps read as hand-made. **-1 repeat** (darkmode r2 and gta-pc: locked layout or dashboard look reads as a template): from 7.5 to 25 s it is two towers left and right on one shelf, which is the bar chart TREATMENT.md itself rejected |
| Voice/sound | 6.5 | Whisper WER 0 on all 10 lines, no music, hits 4+ dB under the voice. **-1 repeat** (password r2, gta-songs r2: the biggest visual beats need their sound): ×4.5 lands silent at about 15.7 s and its stamp sound plays 1.0 s later; VIEWERS ≠ SALES lands silent at about 18.1 s and its sound plays at 19.26 s, quiet (-27 dB RMS) and stacked on the Twitch swish |
| Loop | 7.5 | The end returns to the frame-0 layout and the vote leads back into "GTA 6. 7.9 million". The seam's mean difference is 2.35, over the < 2 target (5gbattery) |
| Shareability | 7.0 | "4.5x the old record" is sendable, but the poster frame muddles it |
| **Overall** | **7.0** | (56.5 / 8 = 7.06) |

**Truth 8.5. Gate: PASS** (exactly on both lines). Verdict: **fix then post**. The previous factory video, gta-99, scored 7.4 / Truth 8.5. This one is 0.4 lower, and three LESSONS repeats cost it 3 points across Retention, Craft and Voice.

## Fixes by impact
1. **6.2 s, the question is already answered.** LAUNCH RECORD is on screen while the voice asks "Is that a record?". Keep the stamp for the hook (1.9 s) but peel it under the out1 swish at 3.13 s. Re-voice only `ask` as "But how big is that?" (Ming US_James seed 7, same 1.5 s slot, `at` 6.15) so ×4.5 answers it. No new beat.
2. **13.4-18.0 s and the poster: the 4.5x stack reads as one 1.74M tower.** Give the five grey blocks visible seams: an 8-10 px dark gap between blocks and alternating 20 % shade. Add a cream notch tag on the right edge of each block (`1×` `2×` `3×` `4×` `½`, ≥ 36 px, x ≤ 910). Move the tag to the top of the stack as "1.74M × 4.5" and keep "1.74M · 2020" only on the bottom block. **Wow:** land each block on its spoken word ("four" puts 4× down, "half" the ½), with one short tick per block in the gaps the gate allows, so the viewer counts the towers.
3. **15.7 s (×4.5) and 18.1 s (≠): both hero stamps land silent and their sounds play about 1 s later.** Move the ×4.5 stamp so it lands at 16.55 s on the `lvl` stamp sound (inside the 16.49-17.85 voice gap) while the blocks fill during the phrase. Move the VIEWERS ≠ SALES landing to 19.15 s, onto `neq` (gap 19.08-19.63). Push the `tw` swish to 19.5 s and raise `neq` to about -7 dBFS peak (voice peaks -2.7). Re-run the SFX gate and regenerate events.json.
4. **7.5-25 s, locked two-tower bar-chart layout.** Change the layout twice across the middle. At `twitch` (19.3 s), truck the camera about 300 px sideways into a new shelf bay rather than reusing the same left/right slots. At `hist`, put the LoL tower in front, lower and offset (not mirrored), and push 1.00→1.08 on the GTA top during 22.4-25.0 s (check the rail on every frame of the push). This also fixes the ~2.6 s near-still hold on the #1 plate.
5. **0-4.5 s, the scope of "viewers".** "7.9 MILLION VIEWERS" can read as total views. The PEAK chip is ~32 px and arrives at 1.0 s; ALL AT ONCE arrives only at 4.5 s. Make the 1.0 s chip "AT ONCE · PEAK" at ≥ 44 px and put STREAMS CHARTS DATA on a second line (frame 0's word count is unchanged).
6. **17.3-18.1 s: "7.9" and "GTA" peek out beside the SALES receipt before the ≠ stamp lands.** With the sound off, that reads "GTA 7.9 … SALES". Fade the 7.9M and GTA 6 tags out at 17.2 s, before the receipt rises, or dim the towers to 15 % instead of the current ~35 %.
7. **Frame 0: the same number twice, no contrast.** Make the counter carry the exact figure and shrink "7.9 MILLION VIEWERS" to one band. Alternatively, a small grey disc stack (no label) can sit at the shelf's right edge from t = 0 so the size question exists on frame 0. Only do this if fixes 1-6 leave the time; it is a layout change, not a new line.
8. **27.75 s, loop seam diff 2.35.** Drive the disc rain from (t mod DUR) so the encoded last frame matches frame 0 (target < 2).
9. **12.3-12.6 s.** The GTA 6 plate flies through the "IN 2020" caption. Route it below y 600 or hide it under the caption.
10. **File size 12.1 MB.** It is fine for Higgsfield, but any Chrome web upload caps at 10 MB (whatif-password). Set the x264 bitrate so 27.8 s lands near 9 MB.

## Generic / AI-made look
- Stacked coin or chip towers as bar charts are a stock infographic trope, and the eye icon on each top disc makes them read as poker chips (a casino reading on a GTA channel).
- Torn-paper caption strips on every line are now the channel formula. Let one beat (the ≠ or the #1 plate) carry its words without a strip.
- The brass tally counter is the best hand-made hero Delta has had. Keep it, and give it a job in the middle of the film (for example, it clicks once per Valorant block) rather than parking it from 7.5 to 25 s.
