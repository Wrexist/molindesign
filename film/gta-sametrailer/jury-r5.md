# Jury r5: gta-sametrailer (v5, from the jury-r4 fix list)

Judged 2026-11-20 on `out/gta-sametrailer-vo.mp4` (21.8 s, 1080x1920). I looked at the sheet, frames at 0.0 / 1.0 / 2.5 / 6.0 / 8.7 / 10.6 / 12.6 / 14.3 / 15.2 / 15.6 / 16.0 / 16.2 / 17.5 / 18.0 / 19.5 / 21.75 s, a 10 fps strip of 14.6-16.2 s (the hero and the replay), and full-resolution crops of the caption band (x 930 marker) and the lower plate edge (y 1450 marker). I read script.json, BRIEF.md and its log, seo.md, clips.json, jury-r4.md and LESSONS.md.

## Measurements (re-run)
- -14.0 LUFS, -2.6 dBTP, **LRA 1.7 LU** (r4 1.9, r3 1.8). The mix is still flat, so the 6/6 hit doesn't stand out. No black frames.
- pace.txt matches the render: 7 cuts, motion 0-1 s 0.967, 0-3 s 0.745, still frames 6.3 %, OK.
- Voice-only: the last word ends about 21.66 s, so the **tail is about 0.14 s** (r4 0.78 s). Fixed. There is a 1.05 s voice gap at 18.07-19.12 s, over the 93M+ card.
- Right rail: the n/6 pill ends at about x 928, so it's inside. The caption no longer touches it.
- The BRIEF log has **no v5 entry**. The last line describes v4 at 22.5 s. Add v5 before merge.

## What r4's fixes became
| r4 fix | Status |
|---|---|
| 1 Six-pair replay in place of the ring | **Half.** A 6 x ~0.17 s replay runs from 14.9 to 15.9 s and lands on VINEWOOD/VICE. But it then cuts away to the same ring/93M+ scene, now 16.0-19.0 s. The replay is about 1 s; the ring still runs 3 s. |
| 2 Phrase captions | **Mostly done.** "BOTH OPEN ON A SUNSET", "THEN THE BEACH", "TROUBLE WITH THE COPS" and "AND A GIANT SIGN" are good. The views line still breaks mid-phrase: "TRAILER ONE DREW OVER" / "93 MILLION VIEWS" / "IN A DAY", under a headline that already says 93M+ VIEWS IN 24 HOURS. |
| 3 End within 0.5 s | Done (about 0.14 s). |
| 4 6/6 hold and loudest slam | **Not done.** The 6/6 MATCH! stamp is up from about 13.9 to 14.85 s (about 0.95 s), and LRA is 1.7 LU. |
| 5 Search phrase by 2 s | **Half.** The GTA 5 / GTA 6 chips are bigger and readable by about 1.5 s, but they're still two pills on two plates. "GTA 5 vs GTA 6" is never one read before 19.5 s. |
| 6 Frame-0 still | Better. The lower plate's offset is smaller, but at t=0 an ink gap still shows at the lower plate's right edge and the 2023 plate is cut at the left. |
| 7 "First 4 in the same order" | **Not done.** |
| 8 Source on the 93 | Done. A SOURCE: YOUTUBE OFFICIAL BLOG chip is up from about 16.9 s. |
| 9 Vote cards over their sunsets | **Not done.** The cards are still on bare ink (19.2-21.4 s). |

## Fact check
| Claim | Verdict |
|---|---|
| 2011 / 2023, "Twelve years apart" | OK (F1-F3: Nov 2, 2011 → Dec 4, 2023). |
| "Both open on a sunset." "Then the beach." "Rockstar Games Presents, over the skyline." "Someone tearing across the water." | OK. The frames match the clip table, and both plates show RGP at about 6.0 s. |
| "Trouble with the cops." | OK. The bodycam POLICE vest is readable at 11.5 and 15.6 s, and the GTA V police car at 10.6 s. |
| VINEWOOD / VICE | OK. |
| "over 93 million views in a day" / 93M+ VIEWS IN 24 HOURS | OK (YouTube Official Blog, F4), and the source is now on screen. |
| "6/6 MATCH!" | Our own framing. The six beats do appear in both trailers. Two of them come in a different order, and the film never says the first four match in order. The voice uses "Then" only on beach, which is honest, so this isn't false. |
| "VINEWOOD?" / "VICE?" cards (12.4-13.4 s) | Fine as a tease, but the voice says "Vinewood." (no question mark). Cosmetic. |

**Truth 8.5.** Nothing is false or overstated. It stays below 9 because the order caveat is still unshown (fix 7, asked for twice).

## LESSONS repeats on this render (a full point each)
1. **Empty stage under a transition** (LESSONS 82/139; also r4 repeat 3). From 15.9 to 16.2 s the replay cuts to bare ink with a ghost VICE, an 18 px "GTA 6 · TRAILER 1" pill and the caption "TRAILER ONE DREW OVER". The number only blurs in at about 16.2 s. That's 0.3 s of dead stage right after the best moment in the film. → Craft.

I don't count the mid-roll counter again: 93M+ now enters printed, with motion blur. I don't count the tail or the word-by-word captions again either, since both are fixed.

## Scores
| # | Criterion | Score | Why |
|---|---|---|---|
| 1 | Hook | 7.0 | Two moving sunsets, SAME TRAILER?, 4 tokens on frame 0, and motion 0-3 s 0.745. The spoken hook is in the first five words. It's held at 7 because the search phrase isn't one read by 2 s and the frame-0 still shows the lower plate offset with an ink gap. It doesn't stop the scroll on its own: two orange sunsets look like any "GTA 5 vs 6" thumbnail. |
| 2 | Retention | 7.0 | 0-16 s changes about every 0.5-1 s, and the 1 s replay is a real re-hook. Then 16.0-19.0 s has no footage, one static number with a drifting ghost word behind it, and a 1.05 s voice gap (18.07-19.12 s). 19-21.4 s is two vote cards on ink. That's about 5.5 s of the last 7 s with no trailer in it, on a film whose whole selling point is the trailers. |
| 3 | Clarity | 6.5 | One idea, and a 14-year-old gets it. Phrase captions fix most of r4. But the 93 scene shows the same fact three times (93M+ headline, "93 MILLION VIEWS", "IN A DAY" vs "IN 24 HOURS"), and its caption breaks after "OVER". The replay re-counts 1/6 to 6/6 right after 6/6 MATCH!, which reads at first as the counter resetting. "SOMEONE TEARING ACROSS THE WATER" is shrunk to about a 24 px cap to fit, smaller than every other caption. |
| 4 | Truth | 8.5 | See above. |
| 5 | Motion and design craft | 5.5 | The full-width plates, the clean chips and the replay rhythm work. The ring/rays/ghost-word scene and the two pill vote cards on ink are still stock Shorts infographics (the third round of asking). -1 for the empty-stage repeat. |
| 6 | Voice and sound | 6.5 | Hook first, a good split on "Vinewood." / "Vice!", and no music. Still a flat list read with LRA 1.7 LU: the 6/6 slam and the replay ticks sit at voice level, so the payoff doesn't land with sound on either. |
| 7 | Loop and ending | 7.0 | The tail is fixed, and the fly-back to the frame-0 sunsets under "SAME TRAILER?" is a clean seam. "Which one wins?" → "Same trailer?" is a good loop line. But the 2.2 s before the seam is the most generic frame in the film, so the loop lands from a weak place. |
| 8 | Shareability | 7.0 | VINEWOOD over VICE at full width, with 6/6 MATCH!, is the frame people will send, and the replay makes it feel earned. It's up for less than 1 s with the stamp, under the 3 s screenshot rule (LESSONS, Picture). |

**Overall: 6.9** (55.0 / 8 = 6.875, not rounded up). Truth 8.5.

**Verdict: don't post** (below 7.0). r1 6.2 → r2 6.2 → r3 6.3 → r4 6.6 → r5 6.9. This is the best version yet, and it's close. The previous Delta film, gta-99, scored 7.4, and this one is still under it. What holds it back is the 16-21.4 s stretch: the replay was built, but the ring and the vote cards it was meant to replace were kept behind it.

## Fixes, ranked by impact
1. **16.0-19.0 s: kill the ring scene and put the 93 on footage (Retention, Craft, removes the repeat).** After the replay lands on VINEWOOD/VICE at about 15.9 s, hold those plates, punch the VICE plate to 1.06x over 2.5 s, and print "93M+ VIEWS IN 24 H" as a 96 px chip over the VICE plate with SOURCE: YOUTUBE OFFICIAL BLOG under it, both there on the first frame. Drop the ghost VICE, the rays and the ring. This removes the empty stage at 15.9-16.2 s and the 3 s with no footage. If footage goes past 50 %, trim 0.15 s off each #n card (or freeze the VICE plate as a still, which shouldn't count as a clip use), then re-run clip lint.
2. **Wow: hold the hero for 1.5 s and make it hit (Share, Sound).** Freeze VINEWOOD/VICE with 6/6 MATCH! from "Vice!" (13.9 s) to 15.4 s, then run the replay. Make the slam the loudest event, 3 dB over the "Vice!" peak (check with astats), with a 50-60 Hz sub plus a 2 kHz transient. Give each replay cut a pitched-up tick (6 ticks rising a semitone each) so the replay sounds like a slot machine landing. Target LRA ≥ 4 LU.
3. **19.0-21.4 s: vote cards on their own sunsets (Loop, Craft).** Put the yellow GTA 5 · 2011 card over the 2011 sunset plate and the pink GTA 6 · 2023 card over the 2023 plate, already in frame-0 positions. The loop then lands from the frame-0 picture and the ink-only end goes away. Fill the 1.05 s voice gap at 18.07 s by moving "Same formula, or coincidence?" up 0.6 s.
4. **Views captions (Clarity).** Show no caption under the 93 chip, since the chip is the caption. If you keep one, show the whole line "TRAILER ONE: 93 MILLION VIEWS IN A DAY" at once, and use "IN 24 H" on the chip so there's one wording, not two.
5. **Replay counter (Clarity).** During the replay, hide the n/6 pill or freeze it at "6/6", and run 1-6 as small ticks on a strip instead. Don't count up from 1/6 again right after 6/6 MATCH!.
6. **Search phrase by 1.5 s (Hook).** At 1.0 s, set "GTA 5 vs GTA 6" at a 52 px cap in the centre band under SAME TRAILER?, replacing the band's first caption, or merge the chips into "GTA 5 · 2011" / "GTA 6 · 2023". Frame 0 stays at 4 tokens.
7. **"First 4 in the same order" (Truth, asked twice).** Add it as a 30 px line under 6/6 MATCH! during the hold. It's true, it strengthens the claim, and it moves Truth toward 9.
8. **Frame-0 still (Hook).** Start the lower plate at a 0 px offset with a 1.04x scale, and slide only the upper plate. Or fill the exposed edge with a blurred extension of the plate. No ink gap and no cut-off "2023" plate edge on frame 0.
9. **Water caption (Craft).** Shorten it to "SOMEONE ON THE WATER" (that word stays highlighted) so it sets at the same cap as the other captions instead of about 24 px.
10. **BRIEF log.** Add the v5 entry (21.8 s, replay, phrase captions, 0.14 s tail, 49 % footage) before the PR. The log currently ends at v4.

## Generic / AI-made
- The 93M+ scene (radial rays, ghost word, small pill, big yellow number) is a stock Shorts infographic template. This is the third round to call it out.
- The stacked yellow/pink "GTA 5 VS GTA 6" pill vote cards on ink look like a Canva poll.
- MATCH! stickers on every pair, then 6/6 MATCH!, then a recount, are close to the stamp-on-everything formula (LESSONS 166).
- Not generic: the Rockstar footage paired at full width, the bodycam POLICE shot, VINEWOOD over VICE, and the 0.17 s replay. Every point this film has gained came from showing more footage and less chrome. Fixes 1 and 3 continue that.
