# Jury r3: gta-sametrailer ("Same trailer?", rebuild)

Judged 2026-11-20 on `out/gta-sametrailer-vo.mp4` (07:13 render, 21.8 s, 1080x1920, 30 fps). I looked at the contact sheet and the poster, at frames 0.0 / 1.0 / 2.5 / 4.2 / 10.45-11.35 (full-res crops of the cops card) / 13.9 / 14.2 / 14.5 / 14.8 / 18.2 / 18.8 / 21.0 and the last frame, and at 10 fps strips of 13.4-14.7 s (the hero) and 17.8-19.0 s (into the tail). I also read script.json, BRIEF.md (with its log), seo.md, clips.json, jury-r2.md and LESSONS.md.

## Measurements (re-run by the jury)
- pacecheck on the final MP4: 1 hard cut, motion 0-1 s 1.222, 0-3 s 0.636, median 0.554, stills 0.3 %, no frozen stretches. This matches what the director reported. pace.txt is current this time.
- Loudness: -14.0 LUFS integrated, -2.6 dBTP. **LRA 1.8 LU**, which is very flat: the 6/6 slam barely stands out from the voice. No black frames.
- Voice gaps (voice-only track, -40 dB): every gap is 0.26-0.68 s, and the longest is 17.99-18.67 s. **The last word ends at 21.21 s and the film ends at 21.80 s, so the tail is 0.59 s, not the 0.4 s the BRIEF log claims.** The loop whoosh fills it, so it is not silent.
- Loop seam: the last frame puts both cards at the same offsets as frame 0. It is clean.
- Frame 0 tokens: SAME TRAILER? + 2011 + 2023 = 4, plus the 22 px credit strips, which I didn't count. This passes.

## Fact check
| Claim | Verdict |
|---|---|
| "Same trailer? Twelve years apart." / 2011, 2023 | OK. 2 Nov 2011 to 4 Dec 2023 (F1-F3). It is phrased as a question, so it does not overclaim. |
| "Both open on a sunset." | OK. Both trailers show the rating card first, then a sunset (verified r2). |
| "Then a beach crowd." | Weak. The "then" is true among the beats. But the GTA VI excerpt (11.6-14.3) is an aerial shot of open green water with a handful of swimmers, which is not a "crowd" on screen. That is a mild overstatement in the picture. |
| "Rockstar Games Presents, over the skyline." | OK. Both cards show the title over a city. |
| "Someone tearing across the water." | OK (jet ski / speedboat). |
| "Trouble with the cops." | OK and **now shown on screen**: POLICE lettering on the vest can be read at 10.75 and 11.35 s, the BODY 3 OSD is visible, and the GTA V card has a cruiser. r2 fix 7 is done. |
| "And a giant sign. Vinewood." / "Vice!" | OK. |
| "Trailer one drew over 93 million views in a day." / 93 MILLION+ VIEWS IN 24 HOURS | OK (YouTube Official Blog, F4). |
| script.json `about`, seo.md title "GTA 5 vs GTA 6: The Same Trailer?" | Corrected and honest now. |

**Truth 8.5.** Everything checks out. It stays at 8.5 rather than higher because of the "crowd" picture and because "6/6 MATCH!" is our own framing of beats where two come in a different order. The seo description says the order caveat out loud ("the first four even come in the same order"), but the film itself never does.

## LESSONS repeats on this render (a full point each)
1. **Hero hold of at least 1 s** (LESSONS phonephoto r2, line 75). The poster frame (VINEWOOD over VICE, 6/6 MATCH!) is fully landed for only about 0.55 s (13.9-14.4 s). Then a light flash washes the frame grey and it is gone. The best image in the film can't be screenshotted. This costs Shareability.
2. **Captions break mid-phrase** (LESSONS fyp r1/r2, line 146: "never after the/a"). The centre band shows "THEN A" (4.2 s), "SOMEONE —" (8.5 s), "TROUBLE —" (10.5 s), "OR" (19.5 s) and "SAME" (18.5 s, under the SAME FORMULA? headline). This costs Clarity.
3. **Small windows over flat ink / the dashboard template** (LESSONS gta-kalaga line 291, gta-pc line 283). It is still two 800 px boxes on striped ink with pills, a MATCHES n/6 counter and a 6-tick bar, and the bottom 480 px are empty in every scene. The BRIEF's reason is the YouTube overlay, which is fair for y > 1450, but the boxes don't bleed. This costs Craft.
4. **Empty stage under a transition** (LESSONS gps/wifi line 82). At 18.4-18.8 s only "SAME FORMULA?" and a stray caption word sit on bare ink, and the GTA 5 / GTA 6 cards fly in afterwards. This costs Craft.
5. **End within 0.5 s of the last word** (LESSONS wifi r2). The measured tail is 0.59 s. It is filled by the whoosh fly-back, so I charge it at the edge of the rule. This costs Loop.

## Scores
| # | Criterion | Score | Why |
|---|---|---|---|
| 1 | Hook | 6.5 | Real progress: 4 tokens, a 5-word spoken hook, motion 0-3 s 0.636 (r2: 0.256), and both sunsets sliding in from opposite sides. But frame 0 as a still is two small dim windows on dark ink, with the lower one cut off by the left edge. "GTA 5 vs GTA 6", the search phrase, is not readable by 2 s: the GTA 5 / GTA 6 chips fade in at 1.0 s at about 30 px cap height inside the cards. |
| 2 | Retention | 6.5 | 0-14.4 s changes every ~1 s, and the hard pairs/cards rhythm works. From 14.4 to 21.8 s (34 % of the runtime) there is no trailer footage at all: a grey flash, an empty ring, a counter, a 93 that is static from about 17.3 to 18.3 s (only the background rays move), then the empty stage. r2 fix 1 (a replay montage of the six pairs) was not built. A counter ring stands in for it. |
| 3 | Clarity | 6.0 | One idea, and a 14-year-old gets it: six beats, a counter to 6/6. Captions repeat what the chips say (the COPS caption under the COPS chip; "93 MILLION+ VIEWS / IN 24 HOURS / OVER 93 MILLION / DAY" is three reads of one number), and they break mid-phrase (-1, repeat). |
| 4 | Truth | 8.5 | See the fact check above. |
| 5 | Motion & design craft | 4.0 | The rail is fixed, the punch is 1.03x, the BODY 3 OSD shows, the slides are well eased, and there is no duplicate #n text. Against that: the grey flash at 14.4-14.6 s reads as a render glitch (the whole frame goes 40 % grey over an empty ring). The counter is caught mid-roll ("3▮" at 14.8 s). The top-left "GTA 6" pill sits over every GTA 5 card. The bottom quarter is empty. Two repeats (-2). |
| 6 | Voice & sound | 6.5 | The hook is in the first words and all 10 lines are heard right. "Vinewood." and "Vice!" are split with a beat, and there is no music. But it is still a flat list read. LRA 1.8 LU means the 6/6 slam and the 93 landing have no headroom over the voice. |
| 7 | Loop & ending | 6.5 | "Which one wins?" leads back into "Same trailer?" over the same sunsets, and the seam is frame-exact. -1 for the 0.59 s tail (repeat). The vote ends on two equal cards, which is good (LESSONS gta-songs). |
| 8 | Shareability | 6.0 | VINEWOOD over VICE with 6/6 MATCH! is still the frame people would send, and the poster is good. But it is on screen for 0.55 s inside two 800 px windows (-1, repeat). The film never shows the trailers running side by side at full width, which is what the 5M-view comparisons do. |

**Overall: 6.3** (50.5 / 8 = 6.31). Truth 8.5.

**Verdict: don't post** (below 7.0). r1 6.2, r2 6.2, r3 6.3: the rebuild fixed the hook mechanics (tokens, motion, word count, rail, police evidence) and moved the total by 0.1. The previous Delta film, gta-99, scored 7.4. Per LESSONS (line 72, and the Delta lines 269-300), three rounds without a climb means the format is the ceiling, not the fixes. Park this film. Only reopen it if fixes 1-3 below are built as a new layout.

## Fixes, ranked by impact
1. **13.85-14.6 s, the hero is gone in 0.55 s and exits through a grey glitch flash (Shareability, Retention, Craft).** Hold VINEWOOD / VICE + 6/6 MATCH! fully still for at least 1.2 s (to about 15.1 s). Move the `views` line from 14.92 to 15.3 s. Drop the K.flash exit at T.after (film.js:278) and use a hard cut or a 0.25 s wipe into a fully built next scene. Set POSTER inside that hold.
2. **Wow fix, 14.6-18.3 s: replace the counter ring with a sync replay.** Rapid-fire all six pairs at 0.25 s each (12 cuts in 1.5 s, a tick and a slot flash per cut), ending on full-width VICE. Put the "93M+ VIEWS IN 24 H · YOUTUBE" chip on that VICE frame instead of a separate ring scene. To stay at 50 % footage, trim 0.25 s off each #n interstitial and the pair excerpts. Run clip lint.
3. **Whole film: bleed the footage (Craft, Hook, Share; the repeat of LESSONS 291).** Two 800x490 windows on striped ink read as a template. Stack two full-width 1080x608 (16:9) plates edge to edge in y 220-1436, and keep only text and chips inside x 90-930. Same footage, about 1.8x the picture area. Frame 0 becomes two big sunsets instead of two thumbnails.
4. **Search phrase by 2 s (Hook).** At 1.0 s, grow the year chips into "GTA 5 · 2011" / "GTA 6 · 2023" at a cap height of at least 48 px (now about 30 px). Frame 0 stays at 4 tokens.
5. **Captions (Clarity, repeat).** Break on phrases only: "THEN A BEACH CROWD", "SOMEONE ON THE WATER", "TROUBLE WITH THE COPS", "SAME FORMULA, OR COINCIDENCE?". Drop the centre caption wherever a chip or headline already says the word (COPS, SAME FORMULA?, "DAY" under IN 24 HOURS). Highlight stressed words only.
6. **18.3-18.8 s, empty stage (Craft, repeat).** Build the GTA 5 / GTA 6 vote cards under the wipe's first frame. Fill 17.3-18.3 s, where 93 sits static, by starting the next scene there, or by sliding the VICE ghost at at least 300 px/s.
7. **14.8 s, counter mid-roll ("3▮") and grey ring (Craft).** Don't roll the number past the cut. Land "93" printed, then animate the ring around it (LESSONS gpus r2).
8. **4.0-5.4 s, "beach crowd" (Truth).** The GTA VI excerpt shows a few swimmers in open water. Either pick a Trailer 1 shot with a visible crowd on the sand or say "Then the beach." Also add the honest order line ("first four, same order") on screen at 6/6, so 6/6 MATCH! doesn't imply identical order.
9. **Sound (Voice).** Bring LRA up from 1.8 LU: leave a 0.4 s voice gap before "Vice!" and make the 6/6 slam the loudest event, at least 3 dB over the neighbouring words, with a sub thump. Give the replay montage a tick per cut.
10. **End (Loop, repeat).** Trim to the last word + 0.4 s (21.6 s), or start the fly-back whoosh under "wins?". Correct the BRIEF log's "0.4 s" claim.
11. **Top-left "GTA 6" pill on every frame (Clarity, LESSONS gta-money line 296).** It sits beside the GTA 5 card, so muted it can read as a label on it. Remove it, or make it the channel mark only.

## Generic / AI-made
- Striped ink, pink and yellow pill chips, MATCHES n/6, a 6-tick progress bar, MATCH! stickers: the same Delta dashboard that eight juries have called a template.
- The 93 ring over sun rays and a ghost word, and the "SAME FORMULA? / GTA 5 VS GTA 6 / WHICH ONE WINS?" vote card, could be any channel's Short.
- One-word karaoke captions look like stock auto-captions.
- Not generic: the real paired Rockstar shots, the POLICE bodycam and the VINEWOOD/VICE pairing. Give them the full frame and more time.
