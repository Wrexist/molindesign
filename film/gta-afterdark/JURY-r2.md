# Jury r2: gta-afterdark ("GTA 6. Last to second.")

Fresh-eyes jury, round 2, 2026-11-25. Video: `film/gta-afterdark/out/gta-afterdark-vo.mp4` (28.50 s, 1080x1920, 30 fps).

**What I checked myself:** frames every 0.5 s from 0.0 to 28.45 s plus 1.6 s, and frame 0 at full resolution. From the cached An Extended Look (`src.mp4`, 1608.07 s) I pulled HUD crops (x 1620–1920, y 860–1060) at 1221.44, .90, .95, 1222.02, .10, 1223.02, .08, .62, .68, 1225.32, .38, .42, .45 and .58; a 1 fps sheet over 1212–1236; and the balcony frame plus its prompt crop at 1230.05. I also ran faster-whisper base.en on the full mix, ebur128, blackdetect, a 0.2 s RMS comparison of the mix against the voice-only track, and read pace.txt and mix.log.

**Measured:** −14.1 LUFS integrated, true peak −2.6 dBTP, LRA 2.2 LU. No black frames. Pacecheck OK (1 hard cut; motion 0–1 s 4.68, 0–3 s 2.97; 1.6 % still). Whisper on the full mix hears every line correctly ("…pool party, dance floor, or the race in last place"; mix.log's in-context pass heard "Pull party"). Hits: the beeps at 9.6, 10.4, 11.2 and 12.0 s and the hit at 2.0–2.2 s sit at about −21 to −18 dB RMS, roughly 5–6 dB under the voice (about −15), so they are audible now. The sweep at 4.2 s is −17.6. The loop sweep at 28.0 s is −16.4.

## Source verification (against src.mp4 frames, not the brief)
| On screen | Source frame | Match |
|---|---|---|
| `6 / 6`, `PROGRESS 5%`, `00:04.79` (frame 0, 8.5 s) | 1221.44: 5 %, 6/6, 00:04.79 | yes |
| `6 / 6`, `6%`, `00:05.05` (9.0 s) | 1221.90: 6 %, 6/6, 00:05.17; 1221.95: 6 %, 6/6, 00:05.22 | yes (6 % comes before 5/6) |
| `5 / 6`, `6%`, `00:05.28` (10.0 s) | 1222.02: 6 %, 5/6, 00:05.28 | yes |
| `4 / 6`, `7%`, `00:06.30` (11.0 s) | 1223.08: 7 %, 4/6, 00:06.22 | yes |
| `3 / 6`, `8%`, `00:06.77`/`06.80` (1.0, 11.5 s) | 1223.68: 8 %, 3/6, 00:06.74 | yes |
| `3 / 6`, `9%`, `00:08.23` (1.5 s) | 1225.38: 9 %, 3/6, 00:08.23 | yes |
| `2 / 6`, `9%`, `00:08.26` (1.6 s) | 1225.42: 9 %, 2/6, 00:08.26 | yes |
| `2 / 6`, `10%`, `00:08.29` (2.0, 12.5 s) | 1225.45: 10 %, 2/6, 00:08.29; last frame 1225.58: 10 %, 2/6, 00:08.40 | yes |
| `3.47 S` | 08.26 − 04.79 = 3.47 | yes (HUD timer) |
| `DRINK (R1)` / `DROP (◯)` | 1230.05 bottom right | yes |
| Chips 20:14 tower, 20:18 pool, 20:27 dance, 20:29 balcony; strip 20:14 → 20:34 | 1 fps sheet: tower 1214–15, pool 1218–20, race 1221.5–1225.6 (orange-purple sky), dance 1226–28, balcony 1229–31, MEGAMUNDO skyline 1231–33, rainbow tower 1233–34, story scene (man in car, MEGAMUNDO sign) from ~1235 | yes |
| "A race at sunset" | 1222–1225: orange-violet sky, street lights on | yes (dusk) |

Every HUD number in the film is exactly right. These are the only truth issues I found:
- **3.0–4.2 s, `HUD TIMER · 20:21 → 20:25`:** the label says HUD TIMER but prints video timecodes. Read sound-off, it says the HUD timer ran 20:21 to 20:25 (4 s), which clashes with the 3.47 S printed right above it. −0.5.
- **4.5–8.3 s, quote `“…CAPTURED ENTIRELY FROM IN-GAME FOOTAGE…”`:** Rockstar's sentence starts with "Captured", so the opening "…" marks a cut that doesn't exist. It's harmless and hides no hedge, but it isn't the source text exactly. No deduction; quick polish.
- **Compliance note (SAFE-EDIT rule 11):** the plate under the source card (4.24–8.29 s) is the same race range (1221.45–1225.58) as the hook and the count, and the race range is used 4 times in all (hook, plate, count, seam). Rule 11 says plates "cut to a new range (no range twice)". Lint passed, so this is a reading of the rule, not a fail. Still, a new range for that plate removes the question.

## Frame checks
- **0.0 s:** `GTA 6` chip, `LAST → ?`, the real HUD `6 / 6`, over the race at full bleed (KEMUKAWA car, pink tail lights). That's 4 readable tokens and passes the ≤ 5 rule, and it shows the conflict, not the answer. Weak spot: the HUD-zoom panel is a 500 x 400 px black rectangle with only `6 / 6` in it (PROGRESS and the timer are masked), a dead slab over the best part of the shot. The `?` floats about 120 px from the arrow.
- **1.0 s:** HUD `3 / 6` 8 % 00:06.80, the leaderboard with YOU at slot 3, the credit up. Busy (around 20 small tokens), but it is the payoff in motion.
- **1.6 / 2.0 s:** `LAST → 2ND`, HUD `2 / 6`, the `3.47 S · 4 PLACES` stamp. Payoff by 1.6 s: **pass**.
- **2.5 s:** the readout card over flat ink restates the hook's numbers.
- **Last second (28.0–28.45 s):** the checkered sweep returns frame 0 (`LAST → ?`, `6 / 6`) at full opacity, so the seam is clean.

## Scores
| # | Criterion | Score | Why |
|---|---|---|---|
| 1 | Hook | **7.5** | Big gain on r1. Real footage fills the frame, frame 0 is 4 tokens and shows the conflict, the payoff `LAST → 2ND` + HUD `2 / 6` + stamp is up by 1.6 s, "GTA 6" is spoken at 0.12 s, and opening motion is high (4.68). It doesn't go higher for three reasons: the black HUD-zoom slab at frame 0 (x 95–600, y 465–870) sits as an empty rectangle over the shot; from 0.5 to 1.5 s the frame carries around 20 small tokens (board numbers, car icons, PROGRESS, timer, zoom tag, credit); and the stake ("passed four cars at 5 % of a race") still isn't something a stranger cares about. |
| 2 | Retention | **6.5** | 0–13 s holds: a change at least every 1.2 s, and the count with beeps is a real re-hook at 8.6 s. Soft stretches: **2.5–4.2 s**, a static readout over flat ink that repeats the 3.47 S / 4 PLACES the viewer saw 1 s earlier (nothing new at the 3 s drop point); **13.3–15.6 s**, a progress card over flat ink where only a 5→10 % sliver moves; **16.0–17.9 s**, an abstract grey strip over a plate dimmed nearly to black; **24.5–27.9 s**, a 3.4 s vote card over a blurred plate where buttons only add. After 13 s the film is a list tour (tower, pool, dance floor, balcony) with no new stake, which LESSONS calls a drag. |
| 3 | Clarity | **6.5** | The race half is now very clear: HUD position, board, beeps, each place on its word. The second half is still a second idea, joined only by "Part of a run of night scenes". The balcony "drink" beat has nothing to do with last-to-second. A 14-year-old leaves with "the car went from last to second fast, then some party clips". The cyan "glass" ring on the balcony sits on her shoulder and then on empty dark (22.0–24.0 s; the glass is at about x 300/960 of the source frame, mid-chest), so the eye is sent to nothing. |
| 4 | Truth | **8.5** | Every HUD value, timecode and prompt checks out against source frames (table above). The quote sits on footage from the video it describes, and the r1 "six shots / 17 s" claim is gone. −0.5 for the `HUD TIMER · 20:21 → 20:25` label (video timecodes under a HUD-timer label, which reads as a 4 s timer next to 3.47 S). The ×3.3 hook speed-up is labelled, but in a tag about 20 px tall. |
| 5 | Motion and design craft | **6.5** | Strong, consistent HUD language (checker, pink edge bar, condensed type), footage full bleed, the real HUD zoom as proof, a clean count. Against: **−1 LESSONS repeat** (gta-kalaga r2, "hard box over flat ink reads as a small window"): the balcony beat (21.5–24.4 s) is an 840 px card over a plate dimmed so far it reads as black, with the lower ~450 px of the frame empty. Polish faults: the scrubber labels collide (`20:2126:48`, 7.0–8.3 s); the ring misses the glass; `RACE` is centred while `POOL PARTY` / `DANCE FLOOR` are left-set after the icon; at 21.0 s the strip and credit cross-dissolve through the balcony card as visible ghost text; the frame-0 black slab. |
| 6 | Voice and sound | **7.0** | The hook is in the first words, all 13 lines are heard right in the mix, pace is fine, no music. The beeps and transition hits now sit about 5–6 dB under the voice and are audible on a phone (r1 fix landed). There's no hit of its own on the payoff: "second" (1.2–1.8 s) carries the `2ND` reveal with the thump at 2.0 s, after the word. Ming stays flat on "Two." and on the end question. In the in-context check "Pool" came back as "Pull". |
| 7 | Loop and ending | **7.0** | "…or the race in last place?" leads into "Last to second." and the frame-0 layout returns at full opacity. But there's about 0.8 s of still vote card after the last word (27.1–27.9 s) before the sweep (LESSONS wifi r2: end within 0.5 s of the last word; a partial repeat, −0.5 not −1, because the seam itself moves). |
| 8 | Shareability | **6.0** | The HUD flipping 6→2 with a beep per place is a neat, checkable detail, but it's niche. A race position change early in a race isn't news anyone sends a friend. The vote is decent comment bait. Nothing here beats "look at this" footage everyone already saw on Aug 27. |

**Overall: 6.9** (55.5 / 8 = 6.94, not rounded up) · **Truth: 8.5**

**Gate (Overall ≥ 7.0 AND Truth ≥ 8.5): HOLD.** Truth passes; overall misses by 0.06. Factory verdict: **don't post** (below 7.0).

Comparison: r1 was 6.5 / T8.0, so r2 is +0.4 overall and +0.5 Truth. The previous Extended Look deep dive, gta-fridge, reached 7.2 / T9.0 in r2. This one is 0.3 under it. The race half is now the best footage work in the Delta set; the nightlife tour in the second half is what keeps it under the bar.

## Fixes, ranked by impact
1. **13.0–24.4 s: cut the second idea (Retention + Clarity + Share; the biggest lever).** Drop "run of night scenes", the tour and the balcony (about 9 s), and make it one race film of about 20 s. In their place, two race beats from footage the film hasn't shown: (a) a freeze on the 5/6 → 4/6 flip (1223.02 → 1223.08) with a leader line to the car being passed on screen, so viewers see who got overtaken; (b) the `PROGRESS 10%` beat over the real race's last frames (1225.45–1225.58, full bleed) instead of flat ink. End on the vote over the race. Expected: Retention +1, Clarity +1, total length about 20–22 s.
2. **WOW, 1.53–2.0 s: a hit and a hold on the payoff.** Put a 0.35 s gap after "second" and land a low thump plus a 1–3 kHz click there (about −16 dB RMS), with a 1.08× punch-in on the HUD zoom and a 4-frame pink flash on `2 / 6`. Make the four flips during 0.35–1.53 s each tick a short rising note (four notes up a scale), so the climb is heard as well as seen. This is the DM-able moment; it should sound like one.
3. **Frame 0: fill the black HUD slab (Hook).** Show the real HUD crop (dark street pixels) behind `6 / 6` instead of a solid black panel, or shrink the zoom box to about 300 x 160 px around `6 / 6` (x 340–600, y 600–720), so the car and street read as the frame. Close the `→ ?` gap to about 40 px.
4. **2.5–4.2 s: no recap card at the 3 s drop (Retention).** Replace the readout's repeat of 3.47 S / 4 PLACES with something new: the two real HUD crops side by side (00:04.79 vs 00:08.26) over the race plate, the subtraction drawn between them (`08.26 − 04.79 = 3.47`). This is also proof the viewer can check.
5. **3.0–4.2 s: fix the timer label (Truth, quick polish).** Change `HUD TIMER · 20:21 → 20:25` to `VIDEO 20:21 → 20:25` on its own row, and keep `HUD TIMER` only beside 04.79 / 08.26.
6. **21.5–24.4 s, if the balcony stays: bleed it full frame (Craft, LESSONS repeat).** Run the balcony clip full bleed (crop around her and the glass, about 608 x 1080 from the 1920 frame, x 120–728), the prompt zoom as an inset ≥ 400 px wide, and move the cyan ring onto the glass (source about x 600/1920, y 640/1080) with tracking. No empty lower third.
7. **27.1–27.9 s: end within 0.5 s of the last word (Loop).** Start the loop sweep at 27.35 s and trim the film to about 27.9 s.
8. **4.24–8.29 s: use a fresh range for the plate (compliance).** The race range is already the hook and the count. Use the race's sky-only crop from a range outside 1221.45–1225.58 if one exists, or a different night range (for example the MEGAMUNDO skyline, 1231.4–1232.8), dimmed ≥ 35 %, so no range appears twice as plate and foreground.
9. **Quick polish:**
   - Drop the leading "…" from the quote (`“CAPTURED ENTIRELY FROM IN-GAME FOOTAGE…”`; Rockstar's sentence starts with "Captured").
   - Separate the scrubber labels (`20:21` above the knob, `26:48` below the end).
   - Left-set `RACE` after its flag like the other two buttons.
   - Remove the ghosted strip and credit from the 21.0 s dissolve (peel before the cut).
   - Raise the `×3.3 SPEED` tag to ≥ 28 px during the hook.

## Looks generic or AI-made
- The vote card (three checkered pill buttons with emoji-style icons, "PICK ONE ↓") over a blurred plate is the template end card every Short uses.
- The night-run strip (grey bars of different widths with a pink one) is abstract; with no thumbnails it reads like a stock progress widget.
- The progress card on flat ink (big `10%`, a dashed track, `0 / 100%`) looks like dashboard filler.
- Genuine: the real HUD zoom at source pixels, the full-bleed race, the board swapping on each beep. Build the whole film from those.
