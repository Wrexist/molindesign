# Jury r2: gta-secrets ("GTA 5 Still Hides These 3 Secrets", Delta)

Jury: video-jury, fresh eyes, 2026-11-10. What I checked: the render out/gta-secrets-vo.mp4 (39.0 s, 1080x1920, 30 fps). I pulled my own frames at 0.0, 0.5, 1.0, 1.2, 1.4, 1.6, 2.0, 2.5, 3.0, 4.4, 4.55, 4.7, 5.2, 6.0, 6.8, 7.4, 9.0, 10.9, 12.6, 12.75, 12.85, 12.9, 13.3, 14.0, 14.6, 15.0-15.4, 16.9, 17.05, 17.2, 18.0, 20.3, 22.6, 23.0 (full-res crop), 23.9, 24.0, 24.15, 24.6, 26.2, 27.6, 29.0, 31.5, 32.3 (full-res crop), 32.6, 33.2, 33.45-33.6, 35.0, 36.3-36.8, 37.5, 38.4 and 38.9. I also looked at sheet.jpg, pace.txt, mix.log and events.json, ran ebur128 and blackdetect myself, ran silencedetect on the voice-only stem, measured each SFX peak in the voice gaps, and read BRIEF.md, TREATMENT.md, vo/script.json and jury-r1.md. I fetched both GamesRadar+ articles myself (JSON-LD dates 2024-11-05 and 2025-08-14). Reddit returned 403, so I could not see the subreddit's current size or activity.

Transcript (in-mix Whisper, matches the script 12/12): "GTA 5 still hides secrets. / Three you can go find yourself. / One. In the very first mission, / an alien is frozen under the ice. / Shoot the ice? Nothing happens. / Two. Ride the cable car up Mount Chiliad. / A mural: a UFO, an egg, maybe a jetpack. / But what it means? 44,000 fans still argue. / Three. Climb Mount Gordo at 11 PM. / A ghost appears. On the rock, in blood: Jock. / Her husband's name. / GTA 6 lands November 19th. Will it have a ghost? Yes or no?"

## Did round 1's fixes land?
| r1 fix | Status |
|---|---|
| 1 CAN'T BREAK IT on SECRET 2 | Landed. It is now NO CRACK, still up at 12.85 s and gone by 13.3 s. Nothing pink sits on the foil. |
| 2 chips on the foil, "cable car" split | Landed. The chips appear inside the first scraped band (14.0 s) and the caption reads RIDE THE CABLE CAR / UP MOUNT CHILIAD. |
| 3 yes/no end | Landed. Both chips are cream. YES pops about 0.1 s before NO, which is fine. |
| 4 frame-0 contrast, "secrets" by 2 s | Landed. The figure is near-black on cyan-white. The 3 SECRETS ticket shows at 1.4-1.6 s, but small (about 40 px). |
| 5 scratch reads as a scratch | Partly. The bands are straight now, the flakes fly, and the coin is about 186 px and sharp. Each foil slate still holds about 1.2 s of mostly empty grey, with only the number and coin (4.6-5.9, 12.8-14.0, 24.1-25.3). |
| 6 44,000 sticky note | Landed, and **it is the new Truth problem** (below). It also covers the mural's eye. |
| 7 midnight payoff | Landed well. The clock rings at 12 and the ghost and JOCK fade at 33.4 s. |
| 8 quiet hits | Landed. Every gap hit is -4.6 to -10.5 dBFS against a voice peaking near -1.5, and pUfo sits cleanly in the 17.05-17.32 gap. |
| 9 confetti on GTA 6 | Landed. |
| 10 "A UFO," early | Landed (17.2-18.0). |

## The "44,000 fans still argue" ruling
- **GamesRadar+ 2024-11-05 (Bardhan)** says: "Since 2013, players have failed to solve the Mt. Chiliad mystery, as it's known, but the mystery's active and dedicated subreddit with 44,000 members indicates no one is giving up yet". The source makes three points: it is a count of **subreddit members**, it is dated **Nov 2024**, and its verb is "not giving up", not "argue".
- **GamesRadar+ 2025-08-14 (Lewis)** has the headline "GTA 5 sleuths **finally work out** the infamous Mount Chiliad mystery after 12 years…". The body is hedged: "one GTA 5 detective is **convinced** we have the answer". In it, YouTuber Gator Keys reads the mural as hints toward 100% completion and the UFO, and the writer says it "certainly seems to make the most sense". GamesRadar's own framing is now "worked out", and no Rockstar confirmation is mentioned.
- **Ruling.** "Fans still argue", meaning the mural's meaning was never settled, is defensible: one creator's reading is not a settled answer. But **"44,000 fans still argue" spoken in the present tense in Nov 2026 is not fair**, for three reasons:
  1. The number is two years old.
  2. Its noun changed from "subreddit members" to "fans who argue".
  3. The most recent source the brief itself cites is headlined "finally work out". A GTA commenter will paste that headline under the video.
- The sticky note does scope it (GAMESRADAR 2024), but the voice does not. The credit is also about 22 px cap height, under the 36 px floor. This repeats **LESSONS gta-editions r2: "Scope the voice, not just the chip."** It also repeats math r2: a fix round added a new fact, and that new fact is where Truth was lost.
- **Exact wording I would accept:**
  - **Preferred.** Voice mur3: **"But what it means? Fans argued for over a decade."** (GamesRadar+ 2025: "haunted GTA fans for over a decade … many theories"). Same slot, 9 words. Caption: BUT WHAT IT MEANS? / FANS ARGUED FOR 10+ YEARS. Sticky note: `44,000 JOINED THE HUNT` / `SUBREDDIT · GAMESRADAR, NOV 2024`, past tense, with the credit at ≥ 36 px.
  - **To keep the number in the voice.** **"By 2024, 44,000 fans had joined the hunt."** The note then reads `44,000 ON ITS SUBREDDIT · GAMESRADAR 2024`.
  - **Not acceptable.** "still argue", "still hunting", "no one has solved it" or "Rockstar never explained" in the present tense, or any present-tense line attached to the 2024 number.
  - **Either way,** add the 2025 article to BRIEF §3 fact 7/11 as context (one fan's 100%-completion reading, not confirmed by Rockstar). Consider replacing the UFOS? / EGG? / JETPACK? notes with `100% COMPLETION?` and `JUST A TROLL?`: the current notes repeat the mural's own symbols, not fan readings.

## Scores
| Criterion | Score | Why |
|---|---|---|
| Hook | 7.5 | Frame 0 has 5 tokens (GTA / 5 / STILL / HIDES / THIS) and "GTA 5" comes first. The figure is near-black on bright ice, it moves from frame 1 (0-1 s 0.558, 0-3 s 0.854), and the spoken first line is the search phrase. Against it: the figure is a stick-man silhouette (ball head, line limbs) that reads as generic clip art, not "something frozen". SECRETS is readable only as a small ticket header at 1.6-2.0 s. From 2.2 to 2.8 s the ticket body is a blank cream card. |
| Retention | 7.0 | No frozen stretch (pacecheck OK, 1.9 % still) and changes come about every 1-1.5 s. Against it: the three foil slates are still a recurring title card, each about 1.2 s of grey with a big number and a coin. The voice has three gaps of 1.12-1.35 s (11.89-13.12, 23.42-24.54, 32.61-33.96). At 2.1 words/s it drags by secret 3, and 39 s is long for three well-known Easter eggs. |
| Clarity | 7.5 | A 14-year-old gets "three things in GTA 5 you can go see", one at a time. The mural beat says 44,000 twice in the same frame with two different verbs (caption FANS STILL ARGUE, note STILL HUNTING), and the "theory" notes only repeat the mural's symbols, so the viewer learns no fan reading. |
| **Truth** | **8.0** | The rest of the voice matches BRIEF §3: the alien in the Prologue ice, can't break it, the cable-car mural (eye, boxes, UFO, egg, maybe a jetpack), the ghost at 11 PM, JOCK in blood, her husband, gone at midnight, Nov 19 2026. "Nothing happens" is a little stronger than GamingBolt's "cannot break through the ice", which is acceptable. Before the deduction this was 9.0. **-1 for a repeated LESSONS mistake (gta-editions r2, voice unscoped while the chip is scoped):** "44,000 fans still argue" turns a Nov 2024 subreddit-member count into a present-tense claim about arguing fans in Nov 2026, against a 2025 GamesRadar+ headline saying sleuths "finally work out" the mystery. Minor: the ghost scene has no OUR DRAWING tag while the alien and the mural do, and the patch caveat is still open. |
| Motion and design craft | 6.5 | The worlds still read as hand-made: truss bridge, layered dusk mountain, brick mural wall, lighthouse night. The ghost now reads as a woman (hair, waist, dress folds) and the hero frame at 32.3 s is clean. That is a 7.5 base. **-1 repeat (a label or payoff plate must not cover the thing it is about: gta-lucia r2, qrcode r2, agent r2):** the 44,000 note sits on the mural's glowing eye from 22.4 to 24.0 s, so the mural's top symbol disappears for the rest of the beat. Also: the FAN THEORIES chip butts against the caption tape (22.6-23.0, no gap). GAMESRADAR 2024 is about 22 px cap height. The 2.5 s ticket is a blank card. "A MURAL:" captions the cable-car mountain at 16.9-17.05, before the mural appears. The clock in the hero is about 100 px. |
| Voice and sound | 7.5 | The hook is in the first five words. There is no music bed. -14.1 LUFS, -2.6 dBTP, no black frames. Every gap hit is audible (-4.6 to -10.5 dBFS), JOCK's brush is the loudest, and the tock lands at midnight. Against it: 2.1 words/s with three gaps over 1.1 s feels slow, and Ming's "A mural? A UFO? An egg?" comes out as three rising questions (Whisper even punctuates them that way), which sounds unsure. |
| Loop and ending | 7.5 | The yes/no question has both chips cream. The last frame (38.9 s) is frame 0, and "Will it have a ghost?" leads back into "GTA 5 still hides secrets." The last word ends at 38.03 and the film at 39.0, but the 0.97 s tail carries the foil sweep home (moving, not a still), so no deduction. The GTA 6 · ??? foil plus coin is a good callback. |
| Shareability | 6.5 | The ghost over JOCK, gone at midnight, is a real "go check at 11" DM moment, and the midnight fade improved it. But all three are on every GTA 5 Easter-egg list since 2013, so for a Delta GTA audience "still hides" overpromises (LESSONS gta-kalaga r2: the stake must be new to GTA players). |

**Overall: 7.2** (58.0 / 8 = 7.25, never rounded up). **Truth 8.0.**
**Gate (overall 7.0+ AND Truth 8.5+): FAIL. Verdict: don't post** (Truth < 8.5).
- Without the two repeat deductions this cut would be about 7.5 / Truth 9.0, a "fix then post".
- Fix 1 alone (a re-voice of one line plus the note) should bring Truth back to 9.0 and the overall to about 7.4.
- Against the previous factory film, gta-longestwait r2 at 7.1 / Truth 8.5: this cut is better made but fails on Truth. Against r1 (6.9 / 8.0): +0.3 overall, Truth flat, and the cause moved from a picture overlap to a voice overstatement that r1's own fix 6 introduced.

## SAFE-EDIT jury checklist (delta/SAFE-EDIT.md)
- Footage we don't own over 5 s unannotated: **no**. Everything is our own drawing; there are no trailer clips.
- Rumor stated as fact: **no**. "Still argue" is an overstatement of a dated source, not a rumor. The mural readings are labeled FAN THEORIES.
- Leak or ending shown: **no**.
- Trailer or radio music audible: **no**. Room tone only, own SFX.
- Number without a BRIEF source: **no**. 3, 2013, 44,000 (fact 11), 11 PM, 12, Nov 19 2026 and PS5 · XBOX SERIES X|S are all in BRIEF §3.

Checklist: no fail item. The block is the rubric's Truth < 8.5.

## Fixes, ranked by impact
1. **20.6-24.0 s, the 44,000 line (Truth, blocks posting).**
   - Re-voice mur3 as "But what it means? Fans argued for over a decade." Or, to keep the number, "By 2024, 44,000 fans had joined the hunt."
   - Change the caption to match.
   - Change the note to `44,000 JOINED THE HUNT` / `SUBREDDIT · GAMESRADAR, NOV 2024`, with the credit line at ≥ 36 px.
   - Add the 2025-08-14 article to BRIEF fact 7 and fact 11 as "one fan's 100%-completion reading, not confirmed".
   - Re-run in-mix Whisper and the vad.js gate on the new line, because the pin thock at 23.58 must stay in the gap.
2. **22.4-24.0 s, the sticky note covers the mural's eye (Craft, repeat).** Slap the note onto the brick wall right of the mural (about x 640-900, y 1180-1400 at full res), angled 6°, with a red string to the board. Keep the eye, boxes and symbols uncovered. Leave ≥ 16 px between the FAN THEORIES chip and the caption tape: drop the chip to y ≥ caption bottom + 16 or tuck it under the board's top edge.
3. **20.6-23.4 s, fan theories that are actually theories (Clarity).** Replace UFOS? / EGG? / JETPACK? (the mural's own symbols) with two readings from the sources: `100% COMPLETION?` (GamesRadar+ 2025, PC Gamer) and `JUST TO MESS WITH YOU?` (Hinchliffe, GamesRadar+ 2024, said by someone who didn't work on it, so keep the "?"). Each note ≥ 36 px, pinned on its word.
4. **4.6-5.9, 12.8-14.0, 24.1-25.3 s, foil slates (Retention).** Cut each pre-scratch hold to ≤ 0.6 s and start stroke 1 on the swish's tail. Or keep SECRET n but print the place on the foil (`NORTH YANKTON`, `MOUNT CHILIAD`, `MOUNT GORDO`, ≥ 48 px) so the slate carries information instead of a grey number. This also trims about 1.5 s off the film (target ≤ 37.5 s).
5. **Wow: make midnight the hero beat (31.7-33.4 s).** Today the clock is about 100 px in the corner. Bring it to ≥ 300 px beside the ghost on "Her husband's name". Sweep the minute hand from 11:00 to 12:00 in 1.0 s with a tick per 5 min (12 ticks in the 1.35 s gap at 32.6-33.96), then the tock, ghost and JOCK flicker out, and a stamp `11 PM-MIDNIGHT ONLY` (sourced, fact 8). That one hour is the DM line ("go check at 11") and today it is barely visible.
6. **0.0-2.0 s, frame 0 (Hook, wow).** Replace the stick-man silhouette with the film's own cut-paper alien's outline (big almond head, long arms, the white paper border), blurred 6 px and 88 % dark, with one eye-glint (2 small pale ovals at about 70 % cream) so it reads as "something looking back" through the ice. Bring the 3 SECRETS ticket in at ≥ 64 px header by 1.5 s, and fill the ticket body as it lands (panels drawn before 2.2 s, not a blank card).
7. **16.9-17.05 s, "A MURAL:" over the mountain.** Start the caption on the first frame where the mural board is on screen, or bring the board in under the zoom by 16.9 s.
8. **29-33.4 s, missing tag.** Add `OUR DRAWING` (≥ 36 px, x ≤ 930, y ≤ 1450) to the ghost scene, as on the alien and the mural, so all three secrets are tagged the same way.
9. **17.2-20.0 s, voice.** Ming reads the mural list as three questions. Re-say as "A mural. A UFO, an egg, and maybe a jetpack." ("and" pulls the list into one falling sentence), or split it into two lines with a 0.3 s gap.
10. **Packaging (Share).** The film can't change that these are famous Easter eggs. For the SEO title, lean on the time-boxed ghost (the BRIEF's backup "GTA 5's Ghost Only Shows Up at 11 PM 👻") rather than "still hides", which GTA players will dispute in comments.

## Generic / AI-looking
- Frame 0's stick-man silhouette (ball head, line arms) is clip-art stock and doesn't match the paper alien that appears at 8.5 s. Use the film's own alien outline (fix 6).
- The grey foil slate with a giant number, three times, is still the "SECRET #1 / #2 / #3" countdown template the treatment said it rejected. The ice-blue / purple / navy tints help only a little.
- Pink-highlighted last words in every other caption (ARGUE., CHILIAD., GHOST?, 11, NOVEMBER) drift toward auto-caption styling. Keep the highlight for the stressed word of hero lines only (ALIEN, JOCK, GHOST).
- Hand-made and worth keeping: the truss bridge with the paper car, the layered dusk mountain and cable car, the brick-wall mural board, the lighthouse night, the ghost with dress folds, and the brushed JOCK. The hero frame at 32.3 s is the best still Delta has made.

Files: /home/user/molindesign/film/gta-secrets/out/gta-secrets-vo.mp4, /home/user/molindesign/film/gta-secrets/BRIEF.md (facts 7 and 11), /home/user/molindesign/film/gta-secrets/vo/script.json (mur3).
