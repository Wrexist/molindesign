# Jury r2: gta-sametrailer ("Same trailer, 12 years apart")

Judged 2026-11-20 on `out/gta-sametrailer-vo.mp4` (04:46 render, 30.5 s, 1080x1920). Looked at the contact sheet, the poster, frames 0.0 / 1.0 / 2.0 / 2.5 / 5.0 / 7.0 / 12.0 / 13.6 / 16.8 / 17.4 / 18.0 / 22.4 / 25.4 / 26.0 / 29.6 / 30.4 s, a 6 fps sweep of the cops pair (12.4-14.4 s), both source trailers in /mnt/project-files/delta/sources/ (1 fps sheets of the first 22-26 s, frames 48.8 and 49.4 s of Trailer 1), script.json, BRIEF.md, seo.md, film.js, mix.log, jury-r1.md and LESSONS.md.

## Measurements (re-run by the jury on this render)
- **pacecheck on the final MP4: motion 0-1 s 0.28, 0-3 s 0.256 (WARN < 0.30), median 0.287, stills 4.0 %, 5 hard cuts.** The 0.433 / 1.6 % quoted to the jury comes from `out/pace.txt`, written 04:35 on the earlier 30.0 s render; it is stale. 0-3 s < 0.30 caps Hook at 7.
- Own frame-diff scan (108x192, threshold 0.3): near-frozen 20.37-21.63 s (and 0.11-0.21 mean diff across 20.5-22.0 s), 24.77-25.37 s, 29.9-30.47 s (the intended loop hold). 28.0-29.5 s runs at 0.30-0.36, barely moving.
- Loudness: -13.9 LUFS integrated, -2.6 dBTP, LRA 5.3. No black frames.
- Voice gaps silent below -45 dBFS: 21.26-22.27 s (1.0 s) and **28.44-29.96 s (1.5 s) after the last word**.
- SFX: present and audible this round; hits in the gaps peak about -9 dBFS against voice peaks around -1 to -3 (about 6-8 dB under, fixed from r1's 15 dB). The frame-0 slam (-5.6 in the score) fires before the voice onset at 0.2 s. The 6/6 slam (16.7-16.9 s) is the loudest event in the score.
- Loop seam: mean abs diff between the first and the last frame 1.0 (on 0-255 grey). Passes.
- Rail (pixel scan of bright pixels on rendered frames): frame 0 x 93-926, OK. **18.5-19.5 s "12 YEARS APART" x 79-946; 26.5-28.8 s "SAME FORMULA?" x 8-1007.** Poster/6/6 punch-in: card frames at x 52-968 (1.1x punch multiplies the rail, LESSONS gta-lucia).
- Whisper flag on the hook ("GTA VI's ... GTA V's") is a numeral-normalisation false positive, not a misread; but "V's" came back at p 0.22, so "five's" is mushy.

## Fact check
| Claim (on screen or spoken) | Verdict |
|---|---|
| GTA 5 trailer 2011 / "November 2011" / NOV 2, 2011 | OK (BRIEF F1). |
| GTA 6 trailer 2023 / "December 2023" / DEC 4, 2023 | OK (US time; BRIEF F2). |
| "Twelve years apart" | OK (12 y 1 mo). |
| "Over 90 million views in a day", chip "YOUTUBE: 93M+ IN 24H" | OK (YouTube Blog, 93M+ in 24 h). |
| "Both open on a sunset" | OK. Seen in both sources: GTA V ESRB card 0-6 s then the lifeguard tower at sunset; GTA VI ESRB card then the causeway sunset at ~3 s. |
| "Then the beach crowd. Then Rockstar Games Presents over the skyline." | OK now. Sources: GTA V sunset 6 s, pier 9 s, PRESENTS 12 s; GTA VI sunset 3 s, (prison scene 5-11 s), beach 11.6 s, PRESENTS 14.6 s. r1's order error is fixed. |
| Water, cops, giant sign | OK as beats. Cops: the GTA VI excerpt is the bodycam shot (OSD "BODY 3"); **the POLICE vest the BRIEF cites (source 49.4 s) is cropped out of our card**: in 12 sampled frames 12.4-14.4 s no POLICE lettering is readable, and the bodycam OSD sits under our COPS chip. True, but not evidenced on screen. |
| Hook "GTA 6's first trailer **mirrors** GTA 5's" | Overstated, and r1 asked to change it. Four beats run in the same order, the last two are swapped (VICE 39.8 s before the police at 48.6 s), and GTA VI puts a 6 s prison scene between sunset and beach. "Mirrors" claims more than the film shows. |
| Off screen: script.json `about` | Stale: still says Presents "then a beach crowd" (the false r1 order) and cites Guinness 90,421,491, which BRIEF says returned 404. Not in the video, but it is the film's source of record. |
| Off screen: seo.md title "GTA 6's First Trailer Is GTA 5's" | Clickbait overstatement of the same kind as "mirrors"; the alternate "GTA 5 vs GTA 6: The Same Trailer? 🤯" is honest. |

Every on-screen number and date checks out. Truth holds at the gate, with no margin.

## LESSONS repeats found on this render (each costs a full point)
1. **Frame-0 words** (LESSONS "frame 0 at most 4 words", "count frame-0 words on the rendered frame", "the director's own count is not proof"). BRIEF/log says frame 0 is SAME TRAILER? plus two year chips. The rendered frame 0 reads SAME TRAILER? + "GTA 5 · 2011" + "GTA 6 · 2023" = 8 tokens (the 22 px credit strips not counted). That is over 5, so Hook is capped at 6, then -1 for the repeat. Hook.
2. **Rail x 90-930** (LESSONS gps, gta-songs, gta-lucia): SAME FORMULA? at x 8-1007, which r1 fix 6 named explicitly; 12 YEARS APART x 79-946; the 6/6 punch-in scales the cards to x 52-968. Craft.
3. **End within 0.5 s of the last word** (LESSONS wifi r2): "wins?" ends 28.44 s, then 1.5 s of silence on a nearly static vote card before the loop whoosh. Loop.
4. **Spoken hook ≤ 6 words** (LESSONS line 19; flagged in r1): still 7 words. Voice.
5. **Re-run every LESSONS check after a fix round** (temperature, gta-editions r2): pace.txt was not re-run on the final render, and the 0-3 s motion fell from 0.433 to 0.256 because the fade-in chrome was removed from the opening (the fix took away the movement too). Hook (not double-charged; the cap from 0.256 is 7 and the frame-0 cap is lower).

## Scores
| # | Criterion | Score | Why |
|---|---|---|---|
| 1 | Hook | 5.0 | Two sunsets stacked with years is a good still, and "GTA 5 / GTA 6" is readable at 0 s. But 8 tokens on frame 0 caps it at 6, minus 1 for the repeat. 0-3 s motion is 0.256 (< 0.30, a 7 cap): both sunsets are slow pans, and between 0 and 2.5 s the only change is the chrome fading in. Spoken hook is 7 words and starts with a letter-string ("G T A six's"). |
| 2 | Retention | 6.0 | 0-17.6 s changes every 1.0-1.5 s and the 6/6 lands. Then the footage stops: the last 12.9 s (42 % of the runtime) has no trailer shot. Dead stretch 20.4-22.0 s (frozen frame plus 1.0 s voice gap), slow 24.0-25.0 s, dead 28.4-29.9 s. The re-hook after 17.6 s is a YouTube play-button card. |
| 3 | Clarity | 7.0 | One idea, a 14-year-old gets it, and the 6/6 counter now completes. MATCH! now stamps the pair that is playing. COPS shows a dark bodycam scuffle with no readable POLICE, and the #2 BEACH / #5 COPS cards print the same words twice, stacked (both cards), which wastes a read. |
| 4 | Truth | 8.5 | All on-screen facts verified against the sources; r1's false "Then" order fixed. Not higher: "mirrors" kept against r1's advice (the last two beats are reversed in VI), the COPS evidence the BRIEF cites is cropped away, and script.json's `about` still carries the wrong order and the dead Guinness figure. |
| 5 | Motion & design craft | 5.0 | Better than r1: typographic #n cards replace the clip art, cards are bigger, and the 6/6 punch looks good. Still the striped-ink, pill-chip, MATCHES n/6 dashboard (LESSONS gta-pc: reads as a template). Below y 1450 the frame is empty in every scene, and 22-30 s fills about a third of y 300-1430. 22.4 s shows a counter mid-roll ("2" with blurred digits). Rail break repeated (-1). |
| 6 | Voice & sound | 5.5 | SFX now audible on the hits; no music; loudness fine. The hook is still 7 words (-1 repeat), "five's" is mushy (p 0.22), there is a 1.0 s hole at 21.3-22.3 s and a 1.5 s silent tail, and the reading is flat list-voice ("Then... Then... Someone... Trouble...") with no lift on "Vice". |
| 7 | Loop & ending | 6.0 | The seam is clean (diff 1.0, a whoosh into the frame-0 sunsets), and "Which trailer wins?" → "GTA 6's first trailer..." reads as a loop. -1 for the 1.5 s dead vote card after the last word. |
| 8 | Shareability | 7.0 | VINEWOOD over VICE with 6/6 MATCH! (poster) is a real send-to-a-friend frame. But it lasts 0.7 s and sits in two 900 px windows; the film never shows the two trailers literally side by side running in sync, which is what this format's 5M-view comparisons do. |

**Overall: 6.2** (50.0 / 8 = 6.25, not rounded up). Truth 8.5.

**Verdict: don't post** (below 7.0). Same as r1 (6.2), so the fix round fixed the facts and moved nothing else. The previous Delta film, gta-99, scored 7.4 / Truth 8.5 in r1, so this is 1.2 lower. LESSONS line 72: a film that does not climb across rounds is being patched, not fixed. One more round should rebuild the 17.6-30.5 s tail and the opening motion, not add props.

## Fixes, ranked by impact
1. **17.6-30.5 s, the footage-free tail (Retention, Shareability; the wow fix).** 42 % of the film has no trailer, and it holds the two dead stretches. Rebuild it as a **sync-split payoff**: after 6/6, replay all six pairs as a 0.4 s-per-pair rapid-fire montage (12 cuts in 2.4 s, the slots flashing in order, one tick per cut). Then hold 12 YEARS APART over the VINEWOOD/VICE frames instead of empty ink (dates as chips on the cards). Cut the YouTube play-button card: put "93M+ IN 24 H" as a chip on the VICE card at 22.3 s. Footage stays under 50 % if each montage cut uses the same excerpts (same-film reuse is allowed by rule 7; run lint). Target runtime 25-26 s.
2. **0.0-3.0 s, opening motion 0.256 and 8 frame-0 tokens (Hook).** Drop "GTA 5 ·" / "GTA 6 ·" from the frame-0 chips: show only "2011" and "2023", so frame 0 = SAME TRAILER? 2011 2023 (4 tokens). Add a real glide: both cards slide in from opposite sides with ≥ 300 px travel over 0-0.8 s (top from the left, bottom from the right), or a 1.00 → 1.08 push on both sunsets. Re-run pacecheck on the final MP4 until 0-3 s ≥ 0.35, and regenerate pace.txt.
3. **0.2 s hook line (Hook, Voice, Truth).** Cut to ≤ 6 words and drop "mirrors": "GTA 6's first trailer copies GTA 5's?" is still 6+ words; better "Same trailer, twelve years apart." (5 words, true, matches frame 0) or "GTA 6 remade GTA 5's trailer?" (5 words, a question). Spell the say-text so "five" is clear ("G T A five").
4. **26.5-28.8 s and 18.5-19.5 s, rail breaks (Craft, repeat).** SAME FORMULA? x 8-1007: set to ≤ 68 px or split onto two lines (SAME / FORMULA?) within x 90-930. 12 YEARS APART x 79-946: 88 px. At the 6/6 punch, cap the scale so the cards stay inside x 90-930 (cards are ~900 wide: make them 820 wide, or punch the footage inside the card frame instead of the frame). Pixel-scan every rendered frame, not stills.
5. **28.44-29.96 s, dead end (Loop, repeat).** Cut the end to last word + 0.4 s, then the loop whoosh into frame 0: total ≈ 29.4 s (or ≈ 25 s after fix 1). The vote buttons must land on "Which" and not sit 1.5 s afterwards.
6. **20.4-22.3 s, freeze plus 1.0 s voice gap (Retention).** Pull "views" to start 0.4 s after "2023" ends (at ≈ 21.6 s) and move something every ≤ 1.2 s in between (the date chips slamming onto the cards, the dotted timeline filling 2011 → 2023 over 1.0 s with a tick per year).
7. **12.4-14.4 s, COPS without visible police (Clarity, Truth).** Re-crop the GTA VI bodycam excerpt so the top of the source frame (POLICE vest at source 49.4 s, y ≈ 40-70 of 360) is inside the card, and end the excerpt on that frame; move the COPS chip off the "BODY 3" OSD, or add a 2 px arrow + "POLICE" label pointing at the vest.
8. **4.3-5.0 s and 12.3-12.6 s, duplicated #n cards (Clarity, Craft).** Both cards print "#2 BEACH", the same 2-word read twice. Use one card spanning the band (#2 in the top window, BEACH in the bottom), or skip the interstitial and go straight to footage with the label chip, which adds about 0.5 s of footage per pair.
9. **Voice read (Voice).** Lift "Vinewood. Vice." (0.92 speed, 120 ms pause before "Vice", that is the 6/6 hit) and vary the "Then... Then..." openers; the list reads flat.
10. **Records (Truth hygiene).** Update script.json `about` to the true order (sunset, beach, Presents) and drop the Guinness 90,421,491 figure (404, unverified). Change the seo.md title to the honest alternate "GTA 5 vs GTA 6: The Same Trailer? 🤯".

## Generic / AI-made
- Striped ink background, pink/cream pill chips, MATCHES n/6 and a 6-slot tick bar: the same Delta dashboard the last six juries called a template (LESSONS gta-pc, gta-editions).
- The 22-30 s tail (YouTube play-button card, "SAME FORMULA?" over two vote buttons, "COMMENT BELOW") could be any channel's Short.
- The bottom 470 px is empty ink in every scene.
- Not generic: the real VINEWOOD/VICE pairing and the two sunsets. Give them more time and more of the frame.
