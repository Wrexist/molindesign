# gta-online, jury round 1 (fresh eyes, 2026-11-17)

File judged: `/mnt/project-files/factory/gta-online/gta-online-vo-upload.mp4` (1080x1920, 30 fps, 36.7 s, H.264 + AAC). I also looked at `poster.jpg` and `sheet.jpg` from the same folder.

How I judged it:
- A 2 fps contact sheet over the whole film, and full frames at 0.0, 1.0, 2.5, 13.0, 17.0, 21.0, 23.2, 25.5, 27.6, 30.5, 34.0 and 36.65 s.
- 2 fps strips over 22.4–27.9 s (the unplug and the year roll) and 32.0–36.6 s (the end and the loop), plus a native-resolution crop of the 2021 card.
- A picture-change profile in 0.5 s windows (10 fps, grey).
- My own faster-whisper small.en pass on the final mix, with word times.
- SFX against the voice: the final mix minus the voice-only render (lag 48 samples, gain 1.024, residual 2 % of the energy), comparing each hit with the voice peaks within ±1 s.
- ebur128 and blackdetect.
- The film's own files: BRIEF.md, TREATMENT.md, seo.md, `vo/script.json`, `out/pace.txt`, `out/events.json`, LESSONS.md (Delta section), and the earlier Delta juries.

Measured:
- Loudness −14.0 LUFS, true peak −2.4 dBTP, LRA 2.9. No black frames.
- Pacecheck: 0 hard cuts; motion 0.614 over 0–1 s and 0.355 over 0–3 s; 5.6 % still frames; "no frozen stretches".
- Whisper heard all 9 lines. "Take-Two's" came back as **"Take Tool's"** (28.7 s), "kept going. Thirteen years" ran together with no pause, and the end question came back with a period, not a question mark.
- All hits are at least 4.0 dB under the neighbouring voice (rule ≥ 3 dB). Unit slap 6.39 s: 4.0 dB. Pin 15.58 s: 5.9 dB. Plug pops 24.05 / 24.17 s: 7.4 / 10.1 dB. Stamp 28.17 s: 6.3 dB. Tag slaps 32.36 / 32.50 s: 7.9 / 9.1 dB. Sweep 36.43 s: 8.5 dB.

Channel rules:
- **Pass:** no music, no Rockstar footage, logo or key art; "AI" appears nowhere; 1080x1920; 36.7 s; frame 0 is 6 words with GTA as the first word; counters move in whole years; every hit is ≥ 3 dB under the voice; the wording stays true after Nov 19 2026.
- **New set:** a slate pegboard server closet. It has no plum wall, palm, sunset, kraft floor, case towers or "?" tower. The wall clock is the one carry-over from the gta-longestwait waiting room.

## Scores
| Axis | Score | Why |
|---|---|---|
| Hook | 7.0 | Frame 0 is `GTA ONLINE OUTLIVED / ITS LAUNCH CONSOLES.` (6 words, GTA first, the search phrase readable at 0.0 s), and there is real push motion (0.355 over 0–3 s). As a still, though, frame 0 is a tidy dark rack with two small unlabeled boxes, about 95 px tall, at the bottom. Nothing tells a stranger those boxes *are* the launch consoles: the `PS3` / `XBOX 360` tags only arrive around 11–12 s. Nothing looks dead, threatened or old either. The stake the caption promises isn't drawn. |
| Retention | 6.0 | Re-hooks land: the red room at 16 s, the unplug at 24 s, the stamp at 28 s. The 0.5 s change profile shows three flat stretches, though. **20.5–24.0 s** is 3.5 s with only a red underline on "SHUT" and LED blinks, right before the native move. 10.5–13.0 s and 29.5–32.0 s are 2.5 s each. Pacecheck passes only because the LEDs and the pegboard drift never stop. **−1 for a repeated LESSONS mistake** (gta-longestwait: "what they docked was the identical centred composition on every beat"). Every beat in all 36 s is the same locked, centred rack under a top caption. |
| Clarity | 7.0 | A 14-year-old gets it: launched rough, old versions shut down, still running. Three things cost it. At 12–14 s the screen holds 6 reads at once: caption, Rockstar's "temperamental" strip, its credit, the `OCT 1, 2013` card, `TAKE-TWO`, and the `GTA ONLINE` plate. "It still warned…" is a backwards link: Rockstar warned *because of* the extra scale, not despite it. "Temperamental" is not a 14-year-old's word. On the 2021 card, `ROCKSTAR · VIA VGC, JUNE 2021` sits under `DEC 16, 2021`, two dates for one event, and nothing says which is the announcement. |
| Truth | 8.5 | Every spoken line matches BRIEF.md (table below). Rockstar's pre-launch lines are said and printed before the launch date, credited `SEPT 2013`. The Zelnick line keeps his hedge. The 2021 card prints the scope `PS3 + XBOX 360 VERSIONS / SHUT DOWN`. Docked for the **hook**. "Outlived its launch consoles" is defensible figuratively: GTA Online kept going after Rockstar dropped those versions, and the consoles are long out of production. But the film's only evidence is Rockstar *ending the game on* those consoles, which reads the other way round, and the picture shows the consoles going dark and sinking, as if the hardware died. BRIEF.md has no source for the consoles' end of life, so "outlived" rests on a metaphor. **seo.md's title "Outlived Its Own Consoles"** is a step further: GTA Online has no consoles of its own, and it still runs on consoles. The Zelnick strip also stays on screen over the end vote (see Loop). It isn't false, but it reads as the CEO answering "which lasts longer", and he never said that. |
| Motion & design craft | 6.0 | The set is genuinely new and hand-made: punched pegboard, a cut-card rack, amber cables, newsprint captions, torn quote strips, and a good red stamp. Weaknesses: the hero is small (the rack is about 370 px wide; rack plus consoles span y ≈ 540–1290), and the lower 470 px is a flat grey slab on every frame. The unplug, the native move, plays out on two ≈ 200 x 95 px boxes at the bottom edge and is over in about 0.5 s. The "newer consoles" are boxes with a plain `+` cross on them, which looks like placeholder art, and there is no PC even though the tag says `+ PC`. Credits are about 24 px cap height, readable but small on a phone. **−1 for a repeated LESSONS mistake** (gta-vicecity r1: "never show a tag on a year that is still moving"). From 25.4 to 26.3 s, `SINCE OCT 2013` sits over digits rolling 2013 → 2020 → 2026. |
| Voice & sound | 6.5 | The hook is in the first words, there is no music, and every hit sits in a written pause, 4–10 dB under the voice. The hero sound is thin, though: the second plug pop is 10 dB under the voice, and the consoles dying makes no sound of its own (no power-down). Ming says "Take-Two's" so that Whisper hears "Take Tool's". "GTA Online kept going. Thirteen years later" runs on with no breath, which blurs the film's top line. The end question lands flat, like a statement. |
| Loop & ending | 7.0 | The loop itself is excellent. The last frame is frame 0 (old consoles cabled in, the hook caption), and "…or GTA Online?" hands straight into "GTA Online outlived…". The end vote uses two identical tags. **−1 for a repeated LESSONS mistake** (gta-gators r2 / gta-firsts r1: a quote strip peels off before the film moves to the next beat; gta-songs r2: an end vote must not favour one option). From 32.4 to 36.2 s, Zelnick's "I have every reason to believe we'll continue to support GTA Online." and his credit hang directly above `GTA 6` / `GTA ONLINE`. With the sound off, the CEO's sentence is the biggest text over the vote, and it tilts the vote. |
| Shareability | 6.5 | The poster (`STILL RUNNING / 13 YEARS LATER` stamped on the rack) is clean and carries the one number. But a generic server rack is not a GTA image, and nothing in the film is a "send this to a friend" moment: no visible "the PS3 died, the game didn't" contrast big enough to screenshot. The vote is a fair comment bait. |

**Overall: 6.8** ((7.0 + 6.0 + 7.0 + 8.5 + 6.0 + 6.5 + 7.0 + 6.5) / 8 = 54.5 / 8 = 6.81, not rounded up). For comparison, gta-budget r1 scored 7.0 / Truth 8.5, gta-firsts r1 6.8 / 8.0, and gta-outsold r2 7.8 / 9.0. This cut is 0.2 under budget and level with firsts on overall, with a cleaner Truth score.

**Truth: 8.5**

## Verdict: **FAIL / don't post** (overall 6.8 < 7.0; Truth 8.5 meets the bar)
The script is the best-scoped Delta script I have read. The chronology and the Zelnick hedge are handled correctly. What fails is the picture: one locked composition, a 3.5 s dead stretch before the unplug, a native move too small to see on a phone, and three repeated LESSONS mistakes, each costing a full point. Fixes 1–3 below each restore that point mechanically, which would put the film at about 7.2.

## Claims checked
| Time | Voice / screen | Source (BRIEF.md) | Verdict |
|---|---|---|---|
| 0.2 | "GTA Online outlived its launch consoles." | facts 1, 5, 6, 7 | Fair as a figure of speech; nothing in BRIEF.md says the consoles themselves ended (see fix 6) |
| 3.6 | "Before launch, Rockstar was adding servers around the clock." + strip "…buy and add more servers…" `ROCKSTAR NEWSWIRE · SEPT 2013` | fact 2 (VideoGamer Sept 25 2013) | OK, placed before launch |
| 7.1 | "It still warned the first days would be temperamental." + "…the first few days even more temperamental…" | fact 2 | OK. "still" is a slightly wrong link (the warning was *because of* the scale) |
| 10.1 | "October 1st, 2013, it went live on PS3 and Xbox 360." `OCT 1, 2013 / PS3 · XBOX 360 / TAKE-TWO` | fact 1 (Take-Two Feb 2014 table) | OK |
| 16.1 | "Day one? Lags and complete outages." + NBC strip `NBC NEWS · OCT 1, 2013` | fact 3 | OK, NBC's own words, credited |
| 19.6 | "In 2021, Rockstar shut down the PS3 and Xbox 360 versions." `DEC 16, 2021 / PS3 + XBOX 360 VERSIONS / SHUT DOWN` `ROCKSTAR · VIA VGC, JUNE 2021` | facts 5, 6 | OK, scoped |
| 24.7 | "GTA Online kept going. Thirteen years later, it's still running." `NEWER CONSOLES + PC`, `SINCE OCT 2013 / 2026`, stamp | facts 6, 7, derived | OK (Oct 2013 → Nov 2026 = 13 whole years) |
| 28.8 | "Take-Two's boss has every reason to believe they'll keep supporting it." + Zelnick strip | fact 8 | OK, the hedge is kept and the strip drops only "At the same time,". The strip overstays into the vote (fix 2) |
| 32.9 | "Which lasts longer: GTA 6, or GTA Online?" | fact 9 | OK, both games exist after Nov 19 |
| seo.md | Title "GTA Online Outlived Its Own Consoles 😮" | none | Overstated (fix 6) |

## Fixes, ranked by impact
1. **20.5–24.5 s: turn the dead stretch into the wow, a big unplug (Retention, Craft, Share).** From 20.6 s ("Rockstar shut…"), push the camera 1.00 → 1.30 down onto the console shelf over 3.0 s. Keep the dolly inside x 90–930 and pixel-scan every frame (gta-lucia). The `PS3` and `XBOX 360` tags should fill about 300 px each. On "PS3" (21.66 s) and "Xbox 360" (22.36 s), give each tag its own light tick and a 6 px jolt. In the written pause at 24.0 s, the two cables whip out in ≥ 250 px arcs. Each console's light dies with a falling power-down tone (0.35 s, about −9 dBFS, ≥ 4 dB under the voice). Then the boxes drop behind the lip, and the camera pulls back to 1.00 by 24.9 s for "kept going". Raise the second pop from −11.3 to about −8.5 dBFS. This is the one moment people would screenshot, so make it as big as it can be.
2. **32.3–36.2 s: peel the Zelnick strip and its credit under the tag slaps (Loop −1 back, Truth).** Tear both off between 32.0 and 32.35 s, in the pause after "supporting it.". The vote frame should show only the caption and two identical `GTA 6` / `GTA ONLINE` tags. Re-check every frame from 32.0 to 36.7 s for leftover quote text.
3. **25.4–26.3 s: hide `SINCE OCT 2013` while the digits roll (Craft −1 back).** Roll neutral cream digits 2013 → 2026 with a tick per year, landing on "thirteen" (26.24 s). Pop the tag only when 2026 lands, and hold it ≥ 0.6 s before the stamp. Better still, end the roll on `2013 → 2026` so the 13 is arithmetic you can see.
4. **Whole film: break the centred composition (Retention −1 back).** Give at least four beats a different frame:
   - 10.1–15.5 s: the date card full width at y 700–1100, with the rack out of focus.
   - 16.1–18.6 s: a push to 1.20 into the red LEDs.
   - 28.8–32.3 s: offset the rack left (to x ≈ 330) and run the quote strip on the right.
   - 32.4 s: spread the vote tags to x 200 and x 760 on the shelf, one on each empty port.

   Also fill 10.5–13.0 s and 29.5–32.0 s: time the `PS3` / `XBOX 360` tags to their words (13.14 s, 14.12 s), not before. Run a slow 1.00 → 1.06 push under Zelnick's line.
5. **Frame 0 to 1.5 s: show the stake on frame 0 and scale up the hero (Hook).** Put the `PS3` and `XBOX 360` tags on the shelf from frame 0. That adds no caption words, and it makes "launch consoles" visible with the sound off. Scale the rack and consoles 1.25x, so the group spans about y 420–1430 and x 110–910, and raise the shelf so the bottom grey slab starts at about y 1450, not 1300. Keep the 0–3 s motion ≥ 0.30 after the change.
6. **Truth and packaging: make "outlived" literal, or soften the title.** In seo.md, change the title to **"GTA Online Outlived Its Launch Consoles 😮"**, matching frame 0. "Its Own Consoles" overstates. Make the hook literally sourced: add primary sources to BRIEF.md for the end of the hardware (Microsoft's April 2016 end of Xbox 360 production, and Sony's end of PS3 shipments), and say it in the cut line, e.g. "Both consoles left stores years ago. In 2021, Rockstar shut down…". If those sources can't be fetched, keep the hook and let the `PS3 + XBOX 360 VERSIONS` card carry the scope, as it does now.
7. **9.9–13.5 s: one read at a time, and a cleaner pre-launch/launch seam (Clarity, Truth).** Peel both Rockstar Newswire strips under the 9.69 s thock, before "October 1st". Today the `SEPT 2013` "temperamental" strip hangs over the `OCT 1, 2013` card until about 13.5 s. It is dated, so it isn't false, but it is the one frame where a pre-launch warning sits on top of launch day. That leaves no more than 3 text items on screen through 10–15 s.
8. **Voice (28.7 s, 25.9 s, 33–36 s).** Respell `say` to "Take Two's boss…" and confirm with Whisper; it currently hears "Take Tool's". Add a 0.25 s pause between "kept going." and "Thirteen years later". For the end, try the seed or line split ("Which lasts longer? GTA six… or GTA Online?") so it rises like a question.
9. **24.9–36.6 s: draw real-feeling "newer" hardware (Craft).** The `+` cross boxes read as placeholders or medical kits. Use generic vents, a disc slot, or a light bar (no trade dress), and add a small generic PC tower, since the tag says `+ PC`.
10. **Clarity on the 2021 card (19.6–24.0 s).** Change the credit to `ROCKSTAR, ANNOUNCED JUNE 2021 · VIA VGC` so the two dates don't compete. Also swap "temperamental" in the voice for "shaky" while keeping the quote strip verbatim, or keep it but drop "still": "It even warned the first days would be temperamental."

## Generic / template risk
- The look is new for Delta and reads as hand-made.
- The generic parts are the locked centre composition on every beat (the pattern the infographic template had), the `+` placeholder consoles, and the reused paper wall clock from gta-longestwait.
- A server rack is the stock "online" symbol. It needs the big unplug (fix 1) to feel like this film's own image.
