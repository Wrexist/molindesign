# Jury r2: gta-calmchaos ("GTA 6: Small Talk to Shootout in 59 Seconds")

Fresh-eyes jury, round 2 (final), 2026-11-28. File: `film/gta-calmchaos/out/gta-calmchaos-vo.mp4` (27.6 s). I formed my scores before I read JURY-r1.md. Checked: sheet.jpg. My own frames at 0.0, 1.0, 2.0, 4.6, 9.5, 10.8, 13.5, 15.8, 17.4, 17.5, 17.6, 17.7, 18.0, 18.6, 21.0, 24.5 and 27.5 s. Also script.json, BRIEF.md, clips.json, clips-used.json, pace.txt, heard.json, ebur128 and blackdetect, and the peak levels at each stopwatch splash. Source check against `src.mp4` at 840.35, 840.75 and 841.1 s for the re-cut beat. I also read gta-wanted's clips.json to check for overlapping ranges.

Measured: integrated -14.0 LUFS, true peak -2.6 dBTP, LRA 3.2. pacecheck OK (0 hard cuts, motion 0–1 s 1.49, 0–3 s 1.29, 2.7 % still). No music. Every footage use is under 5 s, muted and tagged.

## Source verification
| Claim | Verdict |
|---|---|
| Hook: `SMALL TALK TO SHOOTOUT` + `0:59`, truck 083 flipping (849.35–850.5) | Holds. Unit 083 is on two wheels by 1.0 s and ringed. |
| 0:00 car and phone (790.3) and the cop dialogue | Holds. The plate is now `talk` 794–797 under 0:04–0:06, so the clock matches its footage. The `pdrive` plate from before the clock start is gone. |
| 0:31 back seat (821.1) / 0:38 masks (828.25) | Holds. The rings sit on the glasses and the bandana. |
| **0:50 "Shooting out the window."** (840.3–841.15) | **The claim holds.** At 840.35 s a man leans out of the passenger window firing a rifle; at 840.75 s the camera cuts to a new angle of the same man firing at the police truck. floor(840.3 − 790) = 50, which is right. Two problems with the cut: (a) the clip contains a camera cut at about 840.5 s, and after it the ring stays where the shooter used to be, so from about 17.6 to 18.95 s it circles **trees and the building**, while the shooter is at lower left. (b) srcTo 0.82 ends at 841.12 s, which runs **0.12 s into gta-wanted's 841.0–844.5 plate**. BRIEF §1 says "we stay out of both", so the brief is now slightly wrong. |
| 0:59 flip, "in 59 seconds" / "under a minute" | Holds (849.5 − 790 = 59.5). |
| Quote attribution | The tails are gone. The bubbles still sit left (near Jason) and right (near Lucia), which hints at who said what, but nothing points at a speaker, and the voice says "one / the other". Acceptable. |

SAFE-EDIT fail list: none triggered. Hook rule: frame 0 shows 4 words + `0:59`, and the payoff (the flip, ringed, `FROM 0:00 CALM`) is on screen by 1.0–2.0 s. **Pass.**

## Scores
| Axis | Score | Why |
|---|---|---|
| Hook | 7.5 | It passes the rule, and "G T A six" is the first thing heard. At frame 0 the truck is still upright (sparks, no ring), so the still says "police truck" rather than "flip". `0:59` reads as a clock time until the voice explains it. |
| Retention | 7.0 | The stopwatch splashes re-hook every 2.5 s from 11.6 to 21 s. The end card at 22.9–26.6 s is still about 3.7 s of near-static tiles, and 3.0–4.3 s is still a lone splash on navy. |
| Clarity | 7.5 | One idea, with a clock on it. The 8 s cop debate is still the longest beat with the least picture, and it stacks three text objects plus a caption. |
| Truth | **8.5** | All three gate issues from r1 were fixed (the rifle line, the speaker tails, the plate under the clock). It loses points because the SHOOTING ring circles empty trees for about 1.3 s after the in-clip camera cut, so the annotation points at nothing. It also overlaps gta-wanted's range by 0.12 s, which BRIEF denies. Both are small and neither is a false spoken claim. |
| Motion & design craft | 6.5 | The new source ruler (`13:10 ── AN EXTENDED LOOK ── 14:09` with a playhead and beat dots) is a real idea and partly fills the band. Below y ≈ 1580 is still empty navy in every frame, though, and the footage cards are still about 830 px stamps (a LESSONS repeat, reduced but not gone). At 17.5 s the motion-blurred `0:50` splash flies across the shooting card. At 12.5 s a ghosted `AT 31…` caption overlaps the splash. The label chip still covers `CLIP · ROCKSTAR` on every card. |
| Voice & sound | 7.0 | WER 0 and on loudness. The splash hits at 11.5 / 14.6 / 16.4 s now peak at -16.7 / -17.6 / -16.0 dBFS, up from -21, but they are still about 9 dB under the 2.7 / 18.9 / 21.1 s hits (-7.2 / -6.6 / -9.7). The end line is still two questions in a row. |
| Loop & ending | 6.5 | The picture seam is good. "Which one are you here for? Because again, GTA 6, small talk…" joins into a sentence of sorts, but "again" is filler and the join still sounds patched. |
| Shareability | 6.5 | The 083 flip is the screenshot, but it plays in a card, never full-bleed. The vote prompt sits on a static card. |

**Overall: 7.1** ((7.5+7.0+7.5+8.5+6.5+7.0+6.5+6.5)/8 = 57.0/8 = 7.13). **Truth: 8.5.** It clears the gate (7.0+ overall, Truth 8.5+). **Verdict: PASS the gate. By the agent rule this is "fix then post".** r1 scored 7.0 with Truth 8.0. Peers: gta-texts r2 6.9, gta-trunkstream r2 7.2.

## Did r1's fixes land?
| r1 fix | Status |
|---|---|
| 1 Rifle line | **Landed**, now "50. Shooting out the window." on the 840.3 shot. New problems: the ring loses the shooter after the in-clip cut, and the range overlaps gta-wanted by 0.12 s. |
| 2 Quote tails | **Landed**: the tails are removed. |
| 3 Plate under the clock | **Landed**: `pdrive` is gone and the plate is 794–797 under 0:04–0:06. |
| 4 Empty lower band | **Partial**: the source ruler was added, but y > 1580 is still empty and the cards are still small. |
| 5 Flip as money shot / frame 0 | **Not landed.** |
| 6 Static end card | **Not landed.** |
| 7 Quiet splash hits | **Partial**: raised from -21 to about -16.5 dBFS. The target was about -10. |
| 8 Loop line | **Partial**: "Because again," is still filler. |
| 9 Wipe and splash overlaps, covered CLIP tag | **Not landed.** |

## Fixes, ranked by impact
1. **17.45–18.95 s, SHOOTING ring (Truth/Craft).** Trim the shoot clip to 840.55–841.0 s, after the camera cut and clear of gta-wanted's 841.0. Slow it to fill 1.5 s, and keep the ring on the shooter at about focus (0.3, 0.6) of the frame. Then fix BRIEF §1 to match.
2. **0.0 s and 19.97–22.08 s, the flip (wow/Hook/Share).** Start the hook clip at 849.55 s so frame 0 already shows 083 on two wheels with the ring up. At 0:59, play 849.3–850.5 s full-bleed at about 1080x1350, with a 1.00→1.12 punch-in, a low impact hit and a 2-frame flash at the tip, and the `0:59` stamped at 160 px beside it.
3. **22.9–26.6 s, end card (Retention).** Cut it to about 2.2 s. Give each tile a looping 1 s thumbnail (the car on SMALL TALK, the flip on SHOOT OUT) with a tap ring alternating between them. Ask one question only: "Small talk or shootout?"
4. **Whole film, y 1580–1920 and card size (Craft, a LESSONS repeat).** Grow the cards to about 1000x1250 and drop the ruler to about y 1650, or lift the cards so the ruler and label chip fill y 1450–1800. Measure YAVG > 50 in that band every second. Move the label chip so `CLIP · ROCKSTAR` is never covered.
5. **11.5 / 14.6 / 16.4 s, splash hits (Sound).** Raise them by about 7 dB to around -9 dBFS so all five clock beats land the same way.
6. **17.4–17.6 s and 12.5 s, splash overlaps (Craft).** Finish the splash fly-up before the card lands. Clear the line caption before the sweep passes.
7. **27.0 s, loop (Loop).** Cut "again". End on "Pick one. Because GTA 6 goes from small talk to shootout in under a minute", so the join reads as one sentence.

## Generic / AI-made look
It uses the same navy-plus-sticker Delta kit. The stopwatch and the new source ruler are the only design that belongs to this film, and they should carry more of the frame.
