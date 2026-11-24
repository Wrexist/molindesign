# Jury r1: gta-fridge ("GTA 6 has a fridge menu")

Fresh jury, 2026-11-24. Render `out/gta-fridge-vo.mp4` (28.5 s, 1080x1920, 9.9 MB). I pulled frames at 0.0, 1.0, 1.9, 2.0, 2.5, 2.6, 4.0, 7.0, 8.0, 9.0, 10.0, 12.0, 17.0, 19.3, 21.0, 23.0, 27.8 and 28.4 s, plus the 1 fps sheet. I checked the source (`src.mp4`, An Extended Look) myself at full resolution at 435.3, 435.5, 435.9, 436.2, 436.6, 438.45, 438.8, 439.25, 439.27, 439.28, 439.30, 439.34, 439.37 and 443.0 s, with crops of the list, the icon rows and the bottom-right prompts.

## Measurements
- pacecheck: 1 hard cut, motion 0–1 s 0.845, 0–3 s 2.478, median 0.525, 0.7 % still. **OK**, nothing frozen.
- Loudness: −14.0 LUFS integrated, true peak −2.7 dBTP, LRA 3.5 LU. No black stretches. No music bed (SCORE has `MUSIC = false`, plus a 600 Hz low-passed room tone at 0.03).
- In-mix listen check: 9/9 ok. In the drink line Whisper heard **"Just** drink or drop" (wer 0.10), which points to a stray syllable before "Drink". In the icons line "two" was heard as "too", which doesn't matter.
- Clip lint (from BRIEF): Rockstar footage is 47 % of the foreground and 72 % of all footage, each use under 5 s, muted and annotated. **Pass.**

## SAFE-EDIT checks
- **Never items:** no in-game TV picture or show is used (the drink cut ends at 443.11 s, before the TV at about 443.6 s). There is no Rockstar logo or key art; the credit is plain text, `CLIP · ROCKSTAR · AN EXTENDED LOOK`. No leak, ending, trailer or radio music. **Pass.**
- **Jury checklist:** no unannotated footage over 5 s, no rumor stated as fact, no unsourced number. **Pass.**
- **Hook rule:** frame 0 shows the `GTA 6` chip and `FRIDGE MENU`, 3 words, readable muted. For the payoff by 2.0 s, the real menu is on the card from frame 0 with a ring from 0.2 s. **Pass, but weak.** On a phone the real list text is about 20 px tall at 1080 wide, so "LOGGER BEER…" reads as a smudge of white UI rather than words. `PICK A DRINK` was dropped. At 1.9–2.2 s the whole frame is the blank cream door wipe, so the 2-second decision window ends on an empty cream screen.
- Length: 28.5 s, inside 20–30 s. **Pass.**

## Truth check against the source (every on-screen word)
| Claim / word | Source | Verdict |
|---|---|---|
| `△ ⋮ FRIDGE` prompt, "the prompt just says: fridge" | 436.6 s: `△ ⋮ FRIDGE` beside the fridge | ✓ |
| List order: LOGGER BEER, LAVAZAS BEER, BLITZ BERRY SMOOTHIE, BLITZ GREEN SMOOTHIE, PROTEIN SHAKE | 438.8 s and 439.25 s | ✓ |
| ✕ highlight moves LOGGER → LAVAZAS | 438.8 s → 439.25 s | ✓ (the film also walks the ✕ down to the shake; that is our re-typed read-along and is tagged RE-TYPED, so acceptable) |
| "The beers get no icons" / `NO ICONS` | 439.25 s | ✓ |
| Smoothie rows: lightning bolt + eye | 439.25 s crop: **cyan/teal-ringed** bolt, purple-ringed eye | ✓ shape. ✗ colour: the redraw rings the bolt in **green** |
| **PROTEIN SHAKE row: bolt + eye** (the `RE-DRAWN · 7:18` panel, 16.0–19.3 s, and on the poster-grade icons beat) | 439.27–439.30 s, contrast-boosted crop at x 990–1290, y 665–735: the shake row carries a **pink/red-ringed icon followed by a teal bolt. It has no eye.** | **✗ Wrong.** The film redraws the shake's icons as the smoothies' pair, under a tag that says RE-DRAWN from 7:18. BRIEF F5 has the same error. The voice ("the smoothies and the shake get two") is still true, but the picture is not. |
| `FLEECA BANK` magnet | 438.8 s, 439.6 s | ✓ |
| `DRINK R1` / `DROP ◯` | 443.0 s crop | ✓ |
| "Open it, and you pick from a list" | The list is a selection UI with ✕ and BACK. The pick itself is never seen confirmed. | ✓ (the wording is fair) |
| Drawn fridge, 4.5–7.5 s | Our own drawing, not tagged; the real fridge is a grey-white top-freezer covered in magnets. It doesn't claim anything. | OK |

The icon beat is the film's one mystery and its re-hook, and the thing it draws is wrong on one of three rows. It is also a straight LESSONS repeat: "Drawing a real item from a source page means drawing it in the source's colours" (gta-vercetti r1). That costs a full point on top of the error.

## Scores
| # | Criterion | Score | Why |
|---|---|---|---|
| 1 | Hook | **6.5** | Three big words, motion over 0–3 s of 2.48 and an honest payoff, so the rule passes. As a still, frame 0 is the back of a dark head plus a fridge door. The payoff (the menu) is about 20 px text inside a 780 px card, so muted it reads as "some UI" and not as "beer, smoothie, protein shake". From 1.9 to 2.2 s the whole screen is blank cream. The bottom 25 % of frame 0 (y 1430–1920) is flat ink. |
| 2 | Retention | **7.0** | There is a change about every 1–1.5 s and nothing is frozen. From 7.6 to 19.3 s, though (11.7 s, 41 % of the film), the layout is one list panel: a highlight walks down, then the tags arrive. Five product names are read as a flat list for 5.4 s (LESSONS: "no lists"; gta-lucia: pair the names). menuB is 13 source frames stretched over about 2.5 s, which looks steppy at 8–10.4 s. The re-hook (`NOT EXPLAINED`) lands at about 17 s, more than 8 s after the last fresh picture. |
| 3 | Clarity | **7.5** | A 14-year-old gets it: you walk to a fridge, a menu appears, you pick a drink. At 16.5–19 s, though, there are seven things to read at once: the caption, five rows, `RE-DRAWN`, `RE-TYPED`, `NO ICONS`, two big icons and `NOT EXPLAINED`. The muted list on the hook card is too small to carry the idea. |
| 4 | Truth | **7.0** | Every spoken line checks out. The `RE-DRAWN · 7:18` panel gives PROTEIN SHAKE the bolt and eye, while the source shows a pink-ringed icon and a teal bolt (−1). The bolt ring is green where the source's is teal. This repeats the gta-vercetti lesson about drawing in the source's colours (−1 more). Without the icon error this would be 9.0. |
| 5 | Motion and design craft | **6.0** | The good: the cream fridge-door wipe is a native move, the drawn fridge is clean, captions sit inside the rail, and the re-typed list type is big and condensed. The problems: (a) y 1000–1430 is empty or dead plate at 8–15 s, under a half-filled list panel (1–2 rows in a 5-row box at 8–9 s). This repeats the energy r2 / gta-songs r2 fill lesson (−1). (b) The footage is a hard box over flat ink in most beats, which repeats gta-kalaga r2 ("reads as a small window"). (c) The `RE-TYPED · 7:18` tag sits on the clip credit and cuts it to `AN EXTEND` at 7.6–10.4 s. (d) The Fleeca leader line crosses the credit text at 19.6–22 s. (e) A cropped game prompt fragment, `…RN ON` (Rockstar's `△ TURN ON`), hangs at the left edge of the walk card at 2.3–3.2 s. (f) menuB judders. |
| 6 | Voice and sound | **7.0** | The hook is in the first words, −14 LUFS, no music, and the door thud, seal, ticks and clink are themed to the object. Against that: Whisper hears "Just drink or drop", a likely stray onset. The items line is a monotone list. "Because again," is a limp run-on. |
| 7 | Loop and ending | **7.0** | The seam is clean: the door wipe returns the exact frame-0 layout by 28.4 s, and the vote card highlights both options equally. But "Pick one. Because again, GTA 6 has a fridge menu" doesn't make sense as a sentence; it is the trunkstream trick reused without a reason. |
| 8 | Shareability | **6.5** | "They made a fridge menu" is a good send-to-a-friend detail and "beer or smoothie" is easy to comment on. The shareable picture, though (the real list with brand names), is never shown large. Our re-typed panel is a generic dark UI box, and the icons mystery is drawn wrong. |

**Overall: 6.8** (54.5 / 8) · **Truth: 7.0**

**Verdict: HOLD** (gate Overall ≥ 7.0 AND Truth ≥ 8.5 fails on both. In factory terms: don't post.) This is below Delta's recent passes, gta-trunkstream r2 (7.2 / T8.5) and gta-holdup (7.6 / T9.0). The idea and the facts are cleaner than trunkstream's, but one wrong redraw sinks Truth, and the picture repeats two layout lessons.

## Fixes, ranked by impact
1. **16.0–19.3 s (and wherever the icon pair appears): redraw the PROTEIN SHAKE icons from the source.** At 439.27–439.30 s, x≈990–1100, y≈680 the row shows a **pink/red-ringed icon, then a teal bolt**, with no eye. Draw exactly that, in that order. Change every bolt ring from green to the source's cyan-teal (sample it from 439.25 s, about #5fe3cf). The big icon pair under the list (bolt + eye) must then sit next to the smoothie rows only, with a leader to them, or show all three icons. The voice "the smoothies and the shake get two" can stay as it is. Also correct BRIEF F5. This alone takes Truth back to about 9.0 and Overall to about 7.1. Don't add a new spoken beat about the different icon (LESSONS math r2: fix rounds fix).
2. **0.0–2.0 s: make the payoff readable muted.** Add our re-typed list, at least 44 px, under the card from frame 0: `LOGGER BEER · LAVAZAS BEER · BLITZ BERRY SMOOTHIE` in 3 rows at y 1150–1420, with the `RE-TYPED · 7:18` tag. Alternatively, push menuA 1.6× onto the list so its real text is at least 36 px. Either way it fills the empty bottom of frame 0. Start the first door wipe no earlier than 2.25 s, so the 2.0 s frame still shows the menu and not blank cream.
3. **7.6–15.0 s: fill and move the locked panel (repeat of the fill lesson).** From 7.6 s draw all 5 rows dimmed at 35 % and light each one on its word, rather than growing a 1-row panel inside a 5-row box. Push the panel 1.0 → 1.15× over the beat. Put menuB in a card at least 900 px wide, or drop it and use a 3× loupe from the source (next fix). Keep y 1000–1430 occupied in every second, and pixel-check the render.
4. **Wow: show the real icons at source pixels.** On "two" (about 15.5 s) slam in a 4× loupe of the real list crop from 439.25 s (x 990–1140, y 540–660), showing the actual teal bolt and purple eye in Rockstar's own UI, ringed, beside our redraw. The proof becomes the picture, it reads as not-AI, and it gives the 11.7 s list stretch a real second composition. This is a picture change, not a new line.
5. **Pair the list read (7.6–13 s).** Ming reads five bare names flat. Re-voice as pairs ("Logger and Lavazas beer. Blitz berry and Blitz green. And a protein shake.") so the line takes about 1.5 s less, and use that time for a sound hit and a hold on the icons. Re-roll the drink line too, because the heard "Just" before "Drink" is a stray onset; check it on vo/vad.js.
6. **7.6–10.4 s and 19.6–22 s: stop covering the credit.** Move `RE-TYPED · 7:18` to the panel's top-left, outside the card's bottom 60 px. Route the Fleeca leader out of the card's right edge, not down through `AN EXTENDED LOOK`.
7. **2.3–3.2 s: remove the `…RN ON` fragment.** Crop the walk clip 220 px in from the left (`crop=1700:1080:220:0`) or mask the left 60 px of the card. A half word of game UI reads as sloppy.
8. **8.0–10.4 s: the steppy menuB.** At most 1.5× slow-motion on 0.43 s of source, then a freeze with a 1.0 → 1.1 push, instead of 13 frames stretched over about 2.5 s.
9. **27.4–28.5 s: the loop line.** "Pick one. Because again," doesn't read. Use a line that hands over cleanly: "Beer or smoothie? Because…" + "GTA 6 has a fridge menu." Or just "Pick one." with the door wipe carrying the loop. Then re-check the wipe frames.
10. **Poster:** pick a hold with the corrected icons and the re-typed list at full size, not the 1.5 s hook card where the list is unreadable.

## Generic / AI-made look
- Berry-ink gradient, cream sticker captions with one yellow word, and a dark rounded UI panel: this is Delta's house template now, and the middle third reads as an infographic, not a made object.
- The red tilted `NOT EXPLAINED` rubber stamp is a stock "mystery" trope.
- The drawn fridge is clean but is generic flat vector (magnets as plain squares), next to a real fridge that is covered in photos, Polaroids and a Fleeca magnet. Draw one recognisable item from the real door, for example the dog Polaroid, so it reads as our hand-made copy of that fridge.
- "Because again," as a loop device, a second film in a row.
