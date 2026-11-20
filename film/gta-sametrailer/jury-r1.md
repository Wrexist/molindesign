# Jury r1: gta-sametrailer ("Same trailer, 12 years apart")

Judged 2026-11-20 on `out/gta-sametrailer-vo.mp4` (30.0 s, 1080x1920, 30 fps), frames 0.0 / 1.0 / 2.0 / 2.5 s, 0.2-0.3 s sweeps at every pair boundary, the last second, the poster, both source files in /mnt/project-files/delta/sources/, the YouTube Blog page (curl, read today) and film.js.

## Measurements
- pacecheck: OK, 5 hard cuts, motion 0-1 s 0.453, 0-3 s 0.433, stills 1.6 %.
- Loudness: -13.8 LUFS integrated, true peak -2.7 dBTP, LRA 5.2. No black frames. No music bed.
- SFX: present (whoosh/pop/tick/slam per pair), about 15 dB under the voice peaks in the gaps (-19 dB vs voice -3 to -4 dB). Last ~0.5 s is silent (-51 dB).
- clipkit lint: OK, 12 uses, footage 46 % of 30.0 s (WARN close to the 50 % cap). Every excerpt under 5 s, muted, labeled, credited; own match cards break the footage between pairs. SAFE-EDIT rules 3 and 7 pass.
- Mix log: Whisper WER 0 on all 10 lines.

## Fact check
| Claim | Verdict |
|---|---|
| GTA V trailer Nov 2, 2011 | OK (BRIEF F1) |
| GTA VI Trailer 1 Dec 4, 2023 | OK (US time; BRIEF F2) |
| 12 years apart | OK (12 y 1 mo, our math) |
| "over 90 million views in a day", chip 93M+ in 24 h | OK. YouTube Blog (Dec 5 2023, read today): "With over 93 million views in 24 hours ... new views record for 24-hour debut of a non-music video". |
| Both open on a sunset (after the rating card) | OK: both sources open on ESRB cards, then the clipped sunsets. |
| "Both put Rockstar Games Presents over the skyline. **Then** the beach crowd." | WRONG ORDER. In both trailers the beach comes BEFORE Presents (GTA V beach 9.1 s / Presents 12.0 s; GTA VI beach 11.6 s / Presents 14.6 s). "Then" is false for both. |
| Sequence "cops ... and a giant sign" + hook "mirrors" | Overstated. GTA VI shows VICE at 39.8 s and the cops shot at 63.6 s, the reverse of GTA V (cops 64.4, sign 69.5). BRIEF says order is "not claimed", but "mirrors", "Then" and a left-to-right counter claim it. |
| COPS (GTA VI card, 12.6-14.3 s) | Evidence not visible. The shot is an aerial crash under a Weazel News bar; the only cop evidence is the ticker "COPS ARREST MAN WHO FLIPPED HIS CAR...", and our own CLIP credit strip sits on top of it. Sound off, the COPS label sits over a car crash with no police. |
| "Six matches" (brief, counter 0/6 → ?) | The counter never reaches 6/6: the sixth tick is scheduled at the sign pair's end, which is the same moment the years scene replaces the band. Film peaks at MATCHES 5/6 (and the poster shows 5/6). |

## Scores
| # | Criterion | Score | Why |
|---|---|---|---|
| 1 | Hook | 5.0 | Two stacked sunsets with years is a good still and the payoff (the comparison) is on screen from frame 0. But the rendered frame 0 carries ~14 words before credits (GTA 6, FIRST TRAILERS, GTA 5 · 2011, SUNSET, SAME TRAILER?, GTA 6 · 2023, SUNSET, MATCHES 0/6) → cap 6; repeat of LESSONS "count frame-0 words on the rendered frame" (temperature r2, qrcode r1) → -1. The sunsets barely change from 0 to 2 s; only the title bobs. |
| 2 | Retention | 6.5 | Good rhythm through the pairs (change every ~1-1.5 s). Dead-ish: 17.4-18.3 s a near-empty frame (a dotted line + teal chip) before "Twelve years"; 25.3-25.7 s a grey wash. The 6-slot goal gradient never completes, so the payoff the counter promised never arrives. Second half (18-30 s) is three generic cards. |
| 3 | Clarity | 6.5 | One idea, easy. But each MATCH! stamp lands over the NEXT pair's icon (MATCH! over a bar chart before any skyline footage, 4.5-5.0 s), so sound-off it reads as declaring a match before showing it; COPS shows no cops; counter ends 5/6 against a "six matches" premise. |
| 4 | Truth | 7.5 | Dates and 93M verified. Docked for "Then" (false order in both trailers), the implied mirrored order (VI sign before cops), and the COPS card whose only evidence our credit strip hides. |
| 5 | Motion & design craft | 5.0 | SAME TRAILER? (x ≈ 20-995) and SAME FORMULA? (x ≈ 0-1010) break the x 90-930 rail: repeat of LESSONS gta-songs/kalaga rail lessons → -1. MATCHES chip at y ≈ 1580 and the caption band at y ≈ 1470 sit below y 1450 (Shorts UI). Bottom 300 px empty in every scene. Match-card icons are template clip art (a bar chart for "skyline", two flashing squares for "cops", a mushroom umbrella). Captions shrink single short words to tiny ("THE" at ~20 px beside "TROUBLE WITH"). |
| 6 | Voice & sound | 6.5 | "GTA 6" is the first spoken word; pace fine; Whisper clean. Hook line is 7 words (LESSONS: ≤ 6). Hits are present but quiet (~15 dB under the voice) and the would-be hero sound (6/6) does not exist. Silent tail. |
| 7 | Loop & ending | 5.5 | End question works verbally ("Which trailer wins?" → "GTA 6's first trailer mirrors GTA 5's"), but the last frame is the SAME FORMULA? vote card, not frame 0: repeat of LESSONS energy r2 / 5gbattery loop seam → -1. |
| 8 | Shareability | 7.0 | VINEWOOD over VICE is a real send-to-a-friend image (and the right poster), but it is shown as two 830 px windows on empty ink, and the poster shows MATCHES 5/6. |

**Overall: 6.2** (49.5 / 8). Truth 7.5.

**Verdict: don't post** (below 7.0 and Truth under 8.5). Previous Delta factory video gta-99 got 7.4 / Truth 8.5 on round 1; this is 1.2 lower. The topic and the footage are stronger than the execution: the fixes below are mostly cheap.

## Fixes, ranked by impact
1. **0.0-2.0 s, frame-0 word count (Hook, cap).** Rendered frame 0 shows ~14 words. Hold the chrome back: GTA 6 pill, FIRST TRAILERS, both SUNSET chips, the 6 slots and MATCHES 0/6 fade in at 1.0-1.3 s. Frame 0 = the two sunsets + SAME TRAILER? + "2011" / "2023" year tags only (4 words). Keep the 22 px CLIP credits (unreadable at phone size, but required). Shrink SAME TRAILER? to fit x 90-930 (≈ 80 px instead of 92 and no ±6 % pulse past the rail).
2. **8.05 s voice line "Then the beach crowd." (Truth).** Both trailers show the beach before Presents. Re-voice as "Both hit the beach crowd." (or reorder the pairs to sunset → beach → presents, which is the true order in both). Change hook "mirrors" to "repeats"/"copies the beats of" and keep the BRIEF's "not the same order" honest: no "Then", no "And" chain implying sequence; the sign/cops order differs in GTA VI.
3. **12.6-14.3 s, GTA VI COPS card (Truth/Clarity).** Our CLIP credit strip covers the ticker "COPS ARREST MAN..." which is the only cop in frame. Either move the credit to the top-left inside the card for this use (so the ticker reads) and add a 2 px arrow + "COPS ARREST..." callout, or replace the excerpt with an unambiguous police shot from Trailer 1 (cruiser/arrest, ≤ 1.5 s, not used in another film).
4. **17.0-17.6 s, the missing 6/6 (Clarity/Retention/Wow).** Tick 6 is timed at PAIRS[5].b, the same instant the years scene takes over, so it never shows. End the sign pair 0.6 s earlier or hold the band 0.8 s longer: land tick 6 on "Vice." with the existing `n === 6` HOT chip, a 1.0 → 1.12× punch on both VINEWOOD/VICE cards and the loudest slam in the film (≥ the voice-adjacent hit level, ≥ 3 dB under the next word). Re-pick the poster after it lands so it reads 6/6. This is the film's wow beat and it currently does not exist.
5. **4.5-5.0, 7.6-8.1, 9.6-10.1, 12.1-12.5, 14.2-14.7 s, MATCH! timing (Clarity).** MATCH! stamps over the NEXT pair's icon. Put the stamp over the pair it belongs to (last 0.35 s of the footage, before the cut), then show the next icon card. And replace the icons with ones that read: a skyline silhouette with "ROCKSTAR GAMES PRESENTS" type for SKYLINE (not a bar chart), a light bar on a cruiser roof for COPS (not two squares).
6. **Whole film, safe zone and empty bottom (Craft).** Move the slots + MATCHES chip up to y ≤ 1400 and the caption band so its baseline sits ≤ 1440; reclaim the empty y 1600-1920 by growing both clip cards from ~450 to ~520 px tall (and using the top 60 px freed by dropping the FIRST TRAILERS pill). Pixel-scan every frame for x 90-930 / y ≤ 1450 (SAME FORMULA? at 25-30 s also breaks the rail).
7. **17.4-18.3 s and 25.3-25.7 s, dead frames (Retention).** 17.4-18.3 shows only a dotted line and a chip: bring 12 YEARS APART in on the whoosh at 17.4 s (not on "twelve") with both date cards already sliding in. Shorten the grey wash at 25.3 s to ≤ 0.2 s or replace it with a push from the 90M card.
8. **26-30 s, loop seam (Loop).** End on frame 0: after "Which trailer wins?" (≈ 28.3 s) cut back to the two sunsets with SAME TRAILER? at full opacity for the last ≥ 0.5 s, so the encoded last frame matches the encoded first frame (mean diff < 2). Fill the silent last 0.5 s with the frame-0 slam's pre-roll or the sunset whoosh.
9. **22.3-22.8 s, rolling counter under a tag (Craft/Truth repeat-adjacent).** "GTA 6 · TRAILER 1" sits over digits mid-roll ("3", "8", "9"); show the 90 MILLION+ printed and animate around it, or hide the tag until it lands (LESSONS gta-vicecity r1).
10. **All SFX (Sound).** Hits sit ~15 dB under voice peaks; raise the pair slams/ticks to ~8 dB under (LESSONS gta-lucia: lower `duck.smr_db` rather than gains) and re-gate.

## Generic / AI-made
- The match-card icons (bar chart, two squares, umbrella-on-a-bar, three sine waves) are stock-infographic clip art; LESSONS asks for hand-built props.
- Dark diagonal-stripe background + pill chips + MATCHES n/6 is the same dashboard look LESSONS (gta-pc, gta-kalaga) says reads as a template.
- The 18-30 s tail (timeline, YouTube play-button card, two vote buttons + "COMMENT") could be any channel's Short.
- What does not look generic: the real VINEWOOD/VICE pairing and the two sunsets; lead with them, bigger.
