# Jury r2: stolendevice (Factory #43)

Film: film/stolendevice/out/stolendevice-vo.mp4 (36.57 s, 1080x1920). Judged cold, first with the sound off and then with the mix. I did not score r1.
Frames checked: 0.0, 1.0, 2.5, 5.5, 9.5, 14.0, 15.9, 17.6, 17.8, 17.9, 18.3, 22.6, 22.8, 22.95, 26.9, 33.0, 34.6, 35.1, 35.3, 35.6, 36.0, 36.15, 36.25, 36.3 and 36.5, plus the contact sheet and the poster. I cropped the OFF plate, the AWAY chip, the ON plate and the MIGHT chip at full resolution.
Measured:
- Loudness: −14.1 LUFS integrated, true peak −2.6 dBTP, LRA 3.4 LU.
- No black frames.
- pacecheck: OK. 0 hard cuts, motion 0–1 s 0.473 and 0–3 s 0.387, 24.7 % still frames (r1 had 35.1 %), no frozen stretch.
- In-mix Whisper: wer 0.00 on all 12 lines (mix.log).

## Hit measurement (method, so the director can match it)
- **Audio.** Both the final mix (`stolendevice-vo.mp4`) and `stolendevice-voice-only.mp4` were decoded to mono 48 kHz.
- **RMS.** A 50 ms rectangular window, stepped every 5 ms, reported in dBFS.
- **Hit span.** For each event in `out/events.json`, I took every window that *starts* between `t − 0.01` and `t1`. The hit level is the maximum of those windows in the mix.
- **Voice reference.** I took the 50 ms windows where the voice-only track is within 25 dB of its own loudest window (−7.5 dBFS), then the median of the mix's RMS over those windows: **−16.1 dB**. This is not r1's −16.7. r1's speech gate was looser, and on its −16.7 these hits would read 2.3–2.6 dB under.
- **Voice clearance.** I compared a 0.15 s hit body (`t … t + 0.15`) against the `VOICED` spans in `vo/heard.js`.

| id | t | max 50 ms RMS | under speech median | voice gap before / after |
|---|---|---|---|---|
| rg | 2.22 | −19.0 | 2.8 | 0.31 / 0.44 |
| tk | 4.10 | −19.0 | 2.9 | 0.31 / 0.38 |
| q | 7.03 | −19.1 | 2.9 | 0.32 / 0.48 |
| cs | 10.33 | −19.2 | 3.0 | 0.31 / 0.23 |
| yd | 12.98 | −19.1 | 3.0 | 0.35 / 0.66 |
| sw | 15.85 | −19.1 | 3.0 | 0.31 / 0.41 |
| kb | 17.62 | −19.2 | 3.1 | 0.11 / 0.10 (click body is 0.06 s, so it clears) |
| hl | 19.47 | −19.3 | 3.1 | 0.35 / 0.41 |
| st | 22.76 | −19.3 | 3.2 | 0.12 / **0.18** (knock body 0.14 s, so 0.04 s clear of "another") |
| op | 24.03 | −19.2 | 3.0 | 0.40 / 0.80 |
| lo | 27.09 | −19.2 | 3.1 | 0.32 / 0.72 |
| py | 29.97 | −19.0 | 2.9 | 0.31 / 0.65 |
| ck | 33.38 | −19.1 | 2.9 | 0.25 / 0.21 |
| yn | 36.02 | −19.3 | 3.1 | **0.07** after "yours?" / end |

**Result:**
- **Level: pass.** All 14 hits are between −19.0 and −19.3 dB, inside the −18.5 to −19.5 dB target.
- **Distance under the voice: borderline.** The hits sit 2.8–3.2 dB under the speech median, and six of them are 0.1–0.2 dB short of 3.0.
- **The hook tick (rg) is 1.3 dB under the hook line's own local level** (−17.7). That is not louder than the first word, so it is acceptable.
- **No hit overlaps a voiced span.** st and yn are the tightest: 0.04 s and 0.07 s clear, against the LESSONS margin of 0.14 s. Whisper still reads every line at wer 0, so this is polish, not blocking.

## Scores
| # | Criterion | r1 | r2 | Why |
|---|---|---|---|---|
| 1 | Hook | 7.5 | 7.5 | Unchanged from r1. Frame 0 has 2 words (PASSCODE SEEN), the coral ring on the dots and the sight line. The search bar THIEF KNOWS MY IPHONE PASSCODE is complete by ~1.5 s, and motion over 0–3 s is 0.387. As a still it is still a calm tan table with a phone and a coffee cup, with no sign of loss or of the thief. It is curious but not urgent. |
| 2 | Retention | 7.0 | 7.5 | The new beats work: the key is refused at 17.6–17.9 s, a gear drops in at 30.3 s, the 520 px laptop drops its pin and LOST slams down (26–27 s), and the stamp now inks on its knock. Still frames fall from 35 % to 25 %. Two soft stretches remain. 13.3–15.85 s is a switch reading OFF plus the version card on flat green, with the bottom 45 % empty, for about 2.5 s. 28.3–30.2 s is the Apple Pay quote card and a small lock, and the frames at 28.5 and 29.5 are almost identical. |
| 3 | Clarity | 8.0 | 8.0 | The arc reads in one pass, with one idea per beat. Two snags remain. In "With one setting off, **it** opens…", "it" still points to nothing spoken (the passcode key carries it). "2 SECONDS LATER" (3.5–7 s) is unexplained: 2 seconds after what? |
| 4 | Truth | 8.5 | 9.0 | All r1 truth fixes landed. AWAY FROM FAMILIAR LOCATIONS · APPLE (~30 px caps in a 44 px chip) prints at 15.85 s, 0.3 s after the twist line ends, and then rides onto the map. MIGHT BE ON / BY DEFAULT · APPLE is about 32 px caps, readable on a phone, from 31.5 to 33.3 s. MUST BE ON / BEFORE IT'S STOLEN · APPLE runs from 33.3 s to the end card. The Apple Pay sentence is quoted in full, voiced, and the lock opens. FACE ID OR TOUCH ID and NO PASSCODE FALLBACK sit at 18–20 s and again on the poster. OR TOUCH ID & PASSCODE sits beside the Settings row. RE-CREATED is off the quote card. Docks: (a) The twist is absolute for ~1.9 s (13.64–15.54 s voiced) before the scope chip; this is acceptable now. (b) The poster says "Away from home, they still need your face.", which drops "or work" (A2), and "your face" leans on the chip for Touch ID. It also doesn't say what they need your face *for*, although the CHANGE YOUR APPLE ACCOUNT PASSWORD card under it carries that. (c) The OFF scope plate (5.3–13.3 s, ~34 px caps) does the job, but its OFF chip butts into "PROTECTION" (craft, below). |
| 5 | Motion and design craft | 7.0 | 7.0 | The r1 collisions are fixed: the chips stack under the hero lock, the cup clears YES, there is no slate band in the wipes, and the gear fills the empty Settings screen. New or remaining collisions: (1) on the scope plate, the yellow OFF chip touches the N of PROTECTION with a 0 px gap on every threat frame from 5.3 to 13.3 s; (2) the ON label kisses the left edge of the toggle on the SDP ON plate (16–25 s and the poster); (3) the HOME / WORK tag overlaps the top edge of the AWAY FROM FAMILIAR LOCATIONS chip (16–19 s). The Settings switch at 34.6 s is a pale track with the knob on the right and has no ON colour, so it does not read as ON. The house navy-pill, cream-quote-card look is unchanged. |
| 6 | Voice and sound | 6.5 | 7.5 | The r1 repeat is fixed. Hits sit at −19.0 to −19.3 dB, the stamp knock (22.76 s) lands on the 1 HOUR ink frame (22.8 s), and the switch (33.38 s) and YES/NO (36.02 s) are no longer silent. The voice is clean, pauses are ≤ 1.1 s, and there is no music. Docks: the hits are only 2.8–3.2 dB under the voice (six are a hair under 3), st and yn sit 0.04 / 0.07 s from words, and the YES slap has no visual (nothing is tapped on screen at 36.02 s). |
| 7 | Loop and ending | 7.0 | 7.5 | The frame-0 end card with MUST BE ON + YES/NO (~110 px) holds from 35.3 to ~36.15 s, about 0.85 s, which passes the 0.8 s bar. YES/NO then lift and leave ~0.25 s of clean frame 0 (dots, ring, cup and phone match frame 0). "Is yours?" leads into "They watched you type your passcode." The clean tail is short, but the seam is invisible. |
| 8 | Shareability | 7.5 | 7.5 | The poster now says what the thief still needs, and the 1 HOUR stamp is the DM frame. The key bounce at 17.6–17.9 s is still about 270 px long and over in 0.3 s, so it does not yet work as a second sendable shot. |

**Overall: 7.6** (61.5 / 8 = 7.69, not rounded up). Truth 9.0.
**Verdict: fix then post.** It clears the posting bar (7.0+ and Truth 8.5+). No fix below is blocking. Fixes 1–3 are cheap and should go in if there is a render slot.

Comparison: r1 scored 7.375 / Truth 8.5, and the previous factory film (#42 publicwifi) scored 7.4. This is better than both. No LESSONS repeat costs a point this round: hit level, end-card hold and stamp sync are all fixed. Hit-to-voice distance (LESSONS 203) is borderline at 2.8–3.0 dB and is listed as fix 4, not docked.

## r1 fix check
| r1 fix | Landed? |
|---|---|
| 1 Hits level, stamp sync, hits after 30 s | Yes. −19.0 to −19.3 dB, stamp on its ink frame, switch and YES/NO hits added. |
| 2 AWAY chip on "on." | Yes (15.85 s). |
| 3 MIGHT BE ON BY DEFAULT ≥ 40 px + MUST BE ON | Yes. Readable on a phone, shown one after the other rather than side by side, which is fine. |
| 4 End card ≥ 0.8 s, cup clear, dots match | Yes (~0.85 s). The clean tail is ~0.25 s. |
| 5 Key refused (wow) | Partly. It is there, but small and fast (17.6–17.9 s). |
| 6 Poster | Yes, with a nit (drops "or work"). |
| 7 Chips off the dial; map leaves before the lock grows | Yes. |
| 8 25–28 s laptop and LOST slam | Yes. |
| 9 `ask` caption on two lines | Yes. |
| 10 RE-CREATED off the quote card; version card from 13.3 s | Yes. |
| Regressions | The OFF and ON chips now touch their labels, and the HOME / WORK tag overlaps the AWAY chip. |

## Fixes, ranked by impact
1. **[polish, craft/truth] 5.3–13.3 s, the OFF scope plate.** The OFF chip touches "PROTECTION" with 0 px between them, on the plate that carries the film's truth scope. Give it ≥ 16 px of gap: widen the plate by 20 px or set the label 2 px tighter. Do the same on the ON plate (16–25 s and the poster), where "ON" touches the toggle: move the toggle 18 px right or drop the separate word ON, since the toggle says it.
2. **[polish, wow] 17.5–18.2 s, the refused key.** This is the film's argument, and it is over in 0.3 s. Hold the key in the keyhole for 4 frames, then shake the tumbler for 2 frames with the lock body flinching 6 px. Rebound the key 160 px with a 10° twist and let it settle for 0.25 s while the keyhole irises into the 200 px scan glyph. Scale the lock and key 1.15× for this beat only, inside the x 90–930 rail. It should read as the mirror of 9.5 s, and that mirror is the second shareable shot.
3. **[polish, retention] 13.3–15.85 s, the switch-only stage.** About 2.5 s pass with one small switch and the bottom 45 % empty. Start the switch at 1.6× (~480 px) and drift it 1 %/s. Start flipping the knob on "on" (~15.3 s) rather than after the line, so the flip and the click land together at 15.85 s. Or bring the A1 quote ("help prevent someone who has stolen your iPhone and knows your passcode…") in at y 1150–1400 on "Stolen Device Protection" (~14.5 s).
4. **[polish, sound] 22.76 s, 36.02 s and the overall margin.** The st knock sits 0.04 s before "another" and the yn slap 0.07 s after "yours?". Move st to 22.70 or shorten its body to 0.10 s. Move yn to ≥ 36.10 and draw a tap on YES (scale 0.92 → 1.0 over 4 frames) so the slap has a picture. Lower all hits 0.5 dB to −19.5…−19.8 so every one is ≥ 3.0 dB under the −16.1 dB speech median on the method above. If the 3 dB bar is strict, six hits fail it by 0.1–0.2 dB.
5. **[polish, truth] Poster.** Change it to "Away from home **or work**, they still need your face." That matches A2 word for word, and the FACE ID OR TOUCH ID chip already covers Touch ID.
6. **[polish, craft] 16–19 s.** The HOME / WORK tag overlaps the AWAY FROM FAMILIAR LOCATIONS chip. Move the tag inside the dashed circle (y −40 px) or drop the chip 24 px.
7. **[polish, clarity] 34.3–35.2 s.** The Settings switch flips to a pale track with no ON colour. Fill the track with the ON yellow used in the plate (#F2D27A), or print a 40 px "ON" in the row, so the payoff state reads with the sound off.
8. **[polish, clarity] 3.5–7.0 s.** "2 SECONDS LATER" is unexplained (later than what?), and "it" in `keys` has no spoken antecedent. Either drop the chip or make it "PHONE GONE"; in VO change "it opens" to "your passcode opens" (+1 word, still well under 38 s).
9. **[polish, hook] 0.0 s.** Frame 0 is pretty but calm. Add tension that survives as a still: a 2-frame torn-paper gap at the phone's right edge, as if it is being slid away, or tilt the phone 8° off the table edge with a motion smear. Do this without drawing people (§3b.8).
10. **[polish, retention] 28.3–30.2 s.** The Apple Pay stage is near-static. Have the tap-to-pay waves pulse twice and the lock pop on "passcode" (~29.2 s) with a 1.1× overshoot.

## Generic / AI-made look
- Same channel formula: navy pill plates, cream quote cards with APPLE tags, highlighter-word captions, paper tear wipes. It is consistent but no longer distinctive. Fingerprint-in-brackets and the analog dial are stock icons.
- The authored moments are the coral 1 HOUR rubber stamp, the key that turns at 9.5 s and is refused at 17.8 s, and LOST slamming down on the phone. The key mirror is the film's own idea and is still under-scaled (fix 2).
