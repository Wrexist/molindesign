# gta-online, jury round 2 (fresh eyes, 2026-11-17)

File judged: `/mnt/project-files/factory/gta-online/gta-online-vo-upload.mp4` (1080x1920, 30 fps, 38.83 s, 1165 frames). I also looked at `poster.jpg`, `sheet.jpg` and `seo.md` in the same folder (`seo.md` is identical to the repo copy).

How I judged it:
- A 2 fps contact sheet of the whole film, plus full frames at 0.0, 1.0, 2.5, 12.5, 17.5, 24.3, 31.5, 33.6 and 38.8 s (the last frame).
- 4 fps strips over 20–26 s (the unplug) and 25–29 s (the year roll).
- Spot frames at 11.5, 14.3, 14.7, 15.3, 15.9, 16.6, 25.3, 33.3, 34.2 and 35.5 s.
- A picture-change profile in 0.5 s windows (10 fps, grey).
- A pixel scan for the x 90–930 rail on every frame (10 fps over the whole film, 30 fps over 20–26 s).
- My own faster-whisper small.en pass on the final mix, with word times.
- The SFX residual: the final mix minus the voice-only render (lag 48 samples, gain 1.003, 2.5 % residual energy), with each hit compared to the voice peak within ±1 s.
- ebur128, blackdetect and pacecheck.
- BRIEF.md, TREATMENT.md, vo/script.json, JURY.md (round 1) and LESSONS.md (the Delta section and the later films).

Measured:
- Loudness −14.1 LUFS, true peak −2.6 dBTP, LRA 3.7. No black frames.
- Pacecheck on the upload file: 0 hard cuts; motion 0.717 over 0–1 s and 0.388 over 0–3 s; 11.1 % still frames; "no frozen stretches".
- Whisper heard all 10 lines word for word, including "Take-Two's" at 30.0 s. It wrote the end question with a period ("…GTA 6 or GTA Online."). The pause before "13 years later" is there (26.3 → 27.56 s).
- SFX: every hit is at least 4.9 dB under the voice within ±1 s. The plug pops at 24.05 / 24.35 s are −8.2 / −6.4 dBFS, 6.7 / 4.9 dB under; the unit slap at 6.35 s is 8.5 dB under. Rule (≥ 3 dB): **pass**.
- Rail: the pixel scan finds the `XBOX 360` tag at **x 936** from 24.2 to 24.4 s, at the 1.3× push. Nothing else leaves x 90–930.
- Change profile: the flattest windows are **10.5–14.0 s** (mean frame change 0.32–0.40 in five of the seven half-seconds, one bump to 0.97 at 12.5 s) and **30.5–33.0 s** (0.57–0.99).

Channel rules:
- **Pass:** no music; no Rockstar footage, logo or key art; consoles are generic boxes; "AI" appears nowhere (grepped seo.md and the script); 1080x1920; 38.8 s; GTA is the first word on frame 0; the year counter moves in whole years and its label hides while it rolls; SFX are ≥ 3 dB under the voice; the wording stays true after Nov 19 2026.
- **Set:** slate pegboard, black rack and grey cabinet. There is no plum wall, palm, sunset, kraft floor, case towers or "?" tower, and the wall clock from round 1 is gone.

**Frame-0 word rule, my ruling: pass.** Frame 0 has the 6-word caption `GTA ONLINE OUTLIVED / ITS LAUNCH CONSOLES.` plus the `PS3` and `XBOX 360` tags on the two boxes. I don't count the tags against the ≤ 6-word rule:
- They are object labels, not a second sentence.
- Each is a single name that reads in under 0.3 s.
- They are the drawn referent of "launch consoles", which is what round 1 asked for so the stake reads with the sound off.

The rule exists to stop a title card (a block of text to read), and these don't make one. On a literal token count, frame 0 is 9 tokens. If Isac wants the rule read literally, this fails. Flagging it so the call is his, not hidden.

## Scores
| Axis | Score | Why |
|---|---|---|
| Hook | 7.0 | Better than round 1. The search phrase is readable at 0.0 s, GTA is the first word, the tags name the consoles, the rack is bigger (x 285–735, y 510–1430), and there is real opening motion (0.388 over 0–3 s). As a still, though, frame 0 is still a tidy, healthy server rack with two calm boxes. Nothing on screen is old, threatened or ending, so "outlived" is only in the caption and not in the picture. A stranger sees "server rack, text" and nothing GTA-shaped. |
| Retention | 5.5 | Re-hooks are now regular: units at 3–6 s, the date-card slam at 9.5 s, the red room at 16 s, the 2021 card at 19 s, the push at 21.5–22.5 s, the unplug at 24 s, the roll at 25 s, the stamp at 27.5 s, the tear at 33.4 s, the tags at 33.7 s and the loop sweep at 38 s. **Dead stretch at 10.5–14.0 s:** 3.5 s on the date card where only the `GTA ONLINE` plate creeps in. Round 1 asked to fill 10.5–13.0 s, and it got longer. 30.5–33.0 s is another 2.5 s near-hold under Zelnick's line. **−1 for a repeated LESSONS mistake** (gta-longestwait r2: "A reveal shown before its question gives it away"). NBC's "…lags and complete outages." strip and its credit are up from **14.3 s**, 1.9 s before the voice asks "Day one?" (16.2 s). The film's own question is answered before it is asked, which wastes the dip's re-hook. |
| Clarity | 6.5 | A 14-year-old gets the arc: rough launch, old versions shut down, still running. Three things cost it. 27.5–33.4 s holds 8 reads at once: caption, `GTA ONLINE` plate, `SINCE OCT 2013`, `2026`, the stamp, `NEWER CONSOLES + PC`, the Zelnick quote and its three-line credit. Zelnick's quote goes up on "Thirteen years later", 2.5 s before the voice says who he is. "Temperamental" is still in the voice, and it isn't a 14-year-old's word. The date card works as one read: well done. |
| Truth | 8.5 | Every spoken line matches BRIEF.md (table below). The pre-launch Rockstar strips are torn off by 9.5 s, before the `OCT 1, 2013` card lands at 9.5–10 s, and are said with "Before launch" / "It even warned". They do not read as a reaction to day one. The Zelnick strip keeps his hedge, carries `STRAUSS ZELNICK · TAKE-TWO CEO · FEB 2026` and is torn off at 33.4 s, before the vote tags at 33.7 / 34.0 s. It stays in scope and does not hang over the vote. **"Outlived its launch consoles"** is fair but not literal. The only sourced fact is that Rockstar ended GTA Online's PS3 / Xbox 360 versions on Dec 16 2021 while it kept running elsewhere. The `PS3 + XBOX 360 VERSIONS / SHUT DOWN` card scopes it, and the voice says "versions". But the picture still shows the consoles' lights dying and the boxes sinking out of the frame, and that reads as the hardware dying. Nothing in BRIEF.md says the hardware ended, and PS3 / 360 still run games and still have online stores. Held at 8.5, the bar, not above it. |
| Motion & design craft | 5.5 | Real progress: hand-made paper set, varied layouts (full-width date card, red push, 1.3× shelf push, rack-left with quote-right, spread vote tags), better newer hardware (vents, light bar, PC tower), and a red stamp with grain. Flaws: (a) the unplug, the native move, plays under four stacked text items (caption, `GTA ONLINE` plate, `DEC 16, 2021` card, credit band), so the rack it's about is mostly covered; (b) at **25.1–25.4 s** the "GTA ONLINE / KEPT GOING." caption collides with the `2013` year card as it drops in, and the two plates overlap; (c) at **14.3 s** the NBC credit flies across the `OCT 1, 2013` card, and a ghost of the strip shows on the left; (d) at **33.3 s** a torn scrap is left floating at x ≈ 905, y ≈ 940; (e) the bottom 470 px is a flat grey slab in every frame (acceptable as the UI zone, but it's the same slab for 39 s); (f) the poster has 550 px of empty pegboard on top. **−1 for a repeated LESSONS mistake** (gta-lucia: "Dolly and push scales multiply the rail … pixel-scan every rendered frame"). At the 1.3× push the `XBOX 360` tag reaches x 936 (24.2–24.4 s), and boundscheck didn't catch it. |
| Voice & sound | 7.0 | The hook is in the first two words, there is no music, and Whisper hears 10 of 10 lines with "Take-Two's" right. The written pauses carry their hits. The unplug now has two pops plus a power-down, 4.9–6.7 dB under the voice, so the hero sound is there. The end question still lands flat to the ear (Whisper writes a period) despite the pitch-rise claim in BRIEF.md. The year roll's ticks are faint (−25 to −30 dBFS) and are lost on a phone speaker. |
| Loop & ending | 7.5 | The last frame (38.8 s) is frame 0: caption, rack, `PS3` / `XBOX 360` cabled in. "…or GTA Online?" hands into "GTA Online outlived…". The vote frame is clean of quotes, and the two tags are identical with neither one highlighted (only "LONGER?" is red). A mild tilt remains: the whole set during the vote is GTA Online's (an orange `GTA ONLINE` plate on the running rack, `NEWER CONSOLES + PC` cabled in), so `GTA 6` hangs on GTA Online's server as a guest. |
| Shareability | 6.5 | `STILL RUNNING / 13 YEARS LATER` on the rack is a clean screenshot line, and the vote is good comment bait. But the poster is crowded (stamp, year card, `SINCE`, plate, tag and a 6-line quote with its credit) and pushed into the lower half. A generic server rack is still not a GTA image. The unplug is the one "send this" moment, and it happens under four text plates. |

**Overall: 6.7** ((7.0 + 5.5 + 6.5 + 8.5 + 5.5 + 7.0 + 7.5 + 6.5) / 8 = 54.0 / 8 = 6.75, not rounded up).
**Truth: 8.5**

Comparison: round 1 scored 6.8 / Truth 8.5. Round 2 fixed everything round 1 listed: the Zelnick strip over the vote, the tag on the rolling year, the locked composition, Take-Two's, the end order and the title. But it picked up two new repeated LESSONS mistakes (reveal before question, rail at the push), each costing a full point. Without those two points the film would be 7.0. That is the familiar Delta pattern from LESSONS: round 2 found about as many new flaws as round 1 fixed.

## Verdict: **FAIL / don't post** (overall 6.7 < 7.0; Truth 8.5 meets the bar exactly)
The script, chronology and Zelnick scope are right. What fails is mechanical, in the picture: the NBC answer shown before its question, a 6 px rail break at the hero push, a 3.5 s hold on the date card, and the unplug buried under text. Fixes 1–3 are cheap and restore the two penalty points. Fix 4 is the wow.

## Claims checked
| Time (voice) | Voice / screen | Source (BRIEF.md) | Verdict |
|---|---|---|---|
| 0.0 | "GTA Online outlived its launch consoles." | facts 1, 5, 6, 7 | Fair as a figure, scoped by the 2021 card. The consoles-die picture leans literal (fix 8) |
| 3.3 | "Before launch, Rockstar was adding servers around the clock." + "…buy and add more servers…" `ROCKSTAR NEWSWIRE · SEPT 2013` | fact 2 | OK, pre-launch, placed before the date |
| 7.0 | "It even warned the first days would be temperamental." + "…even more temperamental…" | fact 2 | OK. The voice drops "than such things usually are", which is fair compression. Strips gone by 9.5 s |
| 10.1 | "October 1st, 2013, it went live on PS3 and Xbox 360." `OCT 1, 2013 / WENT LIVE · PS3 · XBOX 360 / TAKE-TWO` | fact 1 | OK |
| 16.2 | "Day one? Lags and complete outages." NBC strip `NBC NEWS · OCT 1, 2013` | fact 3 | OK, NBC's words, credited. Shown from 14.3 s, before the question (fix 1) |
| 19.6 | "In 2021, Rockstar shut down the PS3 and Xbox 360 versions." `DEC 16, 2021 / PS3 + XBOX 360 VERSIONS / SHUT DOWN` `ROCKSTAR, ANNOUNCED JUNE 2021 · VIA VGC` | fact 5 | OK, scoped, and the two dates are now explained |
| 25.0 | "GTA Online kept going." `NEWER CONSOLES + PC` | fact 6 | OK |
| 27.6 | "Thirteen years later, it's still running." `SINCE OCT 2013 / 2026`, `STILL RUNNING / 13 YEARS LATER` | fact 7, derived | OK (Oct 2013 → Nov 2026 = 13 whole years) |
| 30.0 | "Take-Two's boss has every reason to believe they'll keep supporting it." + "…every reason to believe we'll continue to support GTA Online." `STRAUSS ZELNICK · TAKE-TWO CEO · FEB 2026` | fact 8 | OK, hedge kept, torn off before the vote. The red pop on **EVERY** in the caption is a word-karaoke pop, not a quote highlight, and the word is his. Moving it to **BELIEVE** would be safer (gta-pc lesson) |
| 34.9 | "Which lasts longer? GTA 6, or GTA Online?" | fact 9 | OK, both games exist after Nov 19 |
| seo.md | Title "GTA Online Outlived Its Launch Consoles 😮", description, sources | facts 1–9 | OK. Matches frame 0 (6 words). The description scopes "shut down the PS3 and Xbox 360 versions". Sources are linked, and the derived 13 is labelled |

## Fixes, ranked by impact
1. **14.3–17.1 s: don't show the answer before the question (Retention −1 back).**
   - Keep the `OCT 1, 2013` card up until the end of "Xbox 360" (14.9 s), then tear it off.
   - 14.9–16.1 s: show no quote. Start the LEDs flickering amber, one slot every 0.3 s, as tension.
   - "Day one?" (16.2 s): the room dims.
   - NBC's "…lags and complete outages." strip and its credit slap on at "Lags" (17.1 s).
   - Re-check that no NBC text exists on any frame before 16.2 s.
2. **24.2–24.4 s: the rail (Craft −1 back).** At the 1.3× push the `XBOX 360` tag reaches x 936. Cap the push at 1.28×, or move both console tags 10 px inward in shelf space. Then pixel-scan every frame from 20–26 s at 30 fps (my scan: brightness > 200, ≥ 4 px per column, y 250–1450).
3. **10.5–14.0 s: fill the 3.5 s hold on the date card.**
   - Run a slow push 1.00 → 1.06 on the card.
   - Thock the `GTA ONLINE` plate onto the rack on "went live" (12.5 s).
   - Give the `PS3` / `XBOX 360` tags a 10 px jolt plus a power-light flash on their words (13.18 / 14.16 s), each with its own tick.

   Target: no 0.5 s window under 0.8 mean change in this span.
4. **WOW, 23.4–24.9 s: give the unplug a clean frame.**
   - At the end of "versions." (23.4 s), tear the caption, the `DEC 16, 2021` card and the credit band up and out in one 0.25 s rip. The unplug then plays on a bare 1.3× shot of the rack ports and the two consoles.
   - Add a spark at each port as the plug leaves.
   - Let each console's tag swing on one corner and drop as the box sinks.
   - Hold the empty ports for 0.3 s with only the rack's LEDs still blinking green before "kept going".

   That frame (empty ports, rack still alive) is the screenshot this film is missing. Use it as the second poster.
5. **27.5–33.4 s: one read at a time (Clarity).**
   - Bring the Zelnick strip in on "Take-Two's" (30.0 s), not on "Thirteen years later".
   - Peel `SINCE OCT 2013` and `NEWER CONSOLES + PC` once the stamp lands (≈ 29.0 s).
   - From 28.9 to 30.0 s, show only caption + `2026` + stamp. That is the clean poster frame (LESSONS: poster in a pause, caption gone, one hero number).
   - From 30.0 s, slide the quote in and run a slow 1.00 → 1.05 push, which also fills the 30.5–33.0 s hold.
6. **Collisions and leftovers (Craft).**
   - 25.1–25.4 s: the "KEPT GOING." caption overlaps the dropping `2013` card. Drop the card below y 520, or delay it to 25.5 s.
   - 14.3 s: the NBC credit flies across the date card (solved by fix 1).
   - 33.3 s: a torn scrap is left at x ≈ 905, y ≈ 940. Kill it within 3 frames of the tear.
7. **0.0–1.5 s: draw the stake on frame 0 (Hook).** The caption says "outlived" but nothing looks old or at risk.
   - Put a thin layer of dust on the two consoles with a faint `2013` scuff.
   - Keep the console power lights on a slow, irregular flicker from frame 0.
   - Or let one cable already sag half-out of its port, with an amber LED on that slot.

   No new words; the 0–3 s motion stays ≥ 0.35.
8. **Truth to 9: make the picture match the sourced claim.** The source says GTA Online's PS3 / 360 versions shut down, not the consoles. When the plugs pop, let only each console's **online/port light** die and keep its power light on. Then the boxes slide back into the cabinet, not off-frame. Or add primary sources for the hardware ends (Microsoft's April 2016 end of Xbox 360 manufacturing; Sony's 2017 end of PS3 shipments in Japan) to BRIEF.md and keep the current picture. Either one lifts Truth above the 8.5 floor.
9. **33.7–38.0 s: balance the vote (Loop).** During the vote, hide the rack's orange `GTA ONLINE` plate and the `NEWER CONSOLES + PC` tag, or fade the rack to 60 % so neither option owns the set. Today `GTA 6` hangs on GTA Online's live server.
10. **Voice and ticks (Sound).**
    - End question: try "Which lasts longer… GTA 6? Or GTA Online?" with a written 0.3 s pause so each option gets its own rise. Re-check with Whisper for a "?".
    - Year-roll ticks: raise them from about −27 to about −16 dBFS (still ≥ 3 dB under "kept going" / "thirteen"), with an accelerating tick per year.
    - Optional: say "shaky" in the voice and keep "temperamental" verbatim on the strip.

## seo.md packaging
- Title "GTA Online Outlived Its Launch Consoles 😮": 6 words, GTA first, matches frame 0. Good.
- Description: scoped ("shut down the PS3 and Xbox 360 versions"), every source linked, the 13 marked as our arithmetic, no money and no "AI". Fine.
- The first line repeats the hook metaphor. That's fine, because the second paragraph scopes it.
- Hashtags: 5. The cover text `STILL RUNNING` and the pinned vote are good.
- After fix 5, re-pick the poster: the 28.9–30.0 s frame with no quote, or the fix-4 empty-ports frame.

## Generic / template risk
- The paper closet reads as hand-made, and the layouts now change per beat, which is a clear improvement on round 1.
- A dark server rack with green LEDs is still the stock "online / data" symbol. It only becomes this film's image when the unplug is unobstructed (fix 4).
- Torn newsprint strips with a navy credit band are now the house look across several Delta films. They're fine, but the strips are where the clutter builds up.
