# Jury r2: gta-fridge ("GTA 6 has a fridge menu"), final round

I'm a fresh juror, 2026-11-24. I scored the render as it is now (`out/gta-fridge-vo.mp4`, 27.95 s, 1080x1920) before reading JURY-r1.md. Frames pulled: 0.0, 1.0, 2.0, 2.4, 3.6, 3.8, 3.9, 4.0, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.8, 5.0, 5.2, 7.0, 12.9, 16.6, 19.6, 21.6, 22.6, 25.5 and the last frame, plus the 1 fps sheet and the poster. Source checked myself (`src.mp4`, An Extended Look) at 430.2, 431.5, 433.0, 433.9 (pwalk plate), 436.6, 439.1, 439.25, 439.3, 439.8, 441.0, 442.7 (pkitchen plate), 443.0 and 443.1 s, with crops of the FRIDGE prompt, the list, the shake row (contrast-boosted ×4) and the bottom-right prompts.

## Measurements
- pacecheck (`out/pace.txt`): 1 hard cut, motion 0–1 s 1.586, 0–3 s 2.495, median 0.515, 1.0 % still frames. **OK**, nothing frozen, so no cap on Hook.
- Loudness: −14.1 LUFS integrated, true peak −2.6 dBTP, LRA 4.3 LU. blackdetect found no black frames. No music bed.
- **Drink line in the final mix (21.4–21.8 s):** I ran faster-whisper small.en on three slices of the final mix: 20.9–24.3, 21.2–23.2 and 18.6–24.4. All three hear "Drink, or drop, that's the prompt once you grab one." **Nothing comes before "Drink".** r1's stray syllable is gone. The door hit before it peaks at −6.5 dBFS (21.2–21.3 s), with nearby voice peaks at −3 to −5, so it is only about 2 dB under the voice. That is close, but it doesn't mask anything.
- Frame-0 hit: peaks at −8.5 dBFS before the first word, and "GTA" peaks at −4.4. Its RMS (−14.5) is above the RMS of "GTA" (−18.5), though, so the thump plays a little hotter than the first syllable.
- Clip lint: 8 uses. Rockstar footage in the foreground is 46 %, background plates 28 %, real footage on screen 74 %. Each use is under 5 s. **Pass** (it warns that the foreground is close to the 50 % cap).
- Loop seam: the encoded last frame against the encoded first frame gives a mean difference of **6.65**. The LESSONS target is < 2. The layout is the same, but frame 0 is motion-blurred footage and the last frame is a sharp hold.
- `out/picture.log` is stale: it is r1's 28.5 s readcheck, so the r2 render has no readcheck on record. Also, the `FRIDGE` tag (Tx 'fridge') isn't in the r1 list.

## SAFE-EDIT checks
- **Never:** I checked every plate and clip range on the source. There is no in-game TV anywhere. The pwalk plate (430–434 s) shows only wall art and the living room, and the drink cut ends at 443.11 s, before the TV picture at about 443.6 s. There is no Rockstar logo or key art; the credit is plain text, `CLIP · ROCKSTAR · AN EXTENDED LOOK`. No leak, no ending, no trailer or radio music. **Pass.**
- **Jury checklist:** no unannotated footage over 5 s, no rumor stated as fact ("Rockstar hasn't said what they do" is careful), and no number at all. **Pass.**
- **Hook rule:** frame 0 shows `GTA 6` and `FRIDGE MENU`, which is 3–4 words, readable muted. The payoff, the real menu, is on the card from frame 0, pushed in so the rows read at about 45 px. By 1.0 s, LOGGER BEER, LAVAZAS BEER and BLITZ BERRY SMOOTHIE are crisp. At 2.0 s the menu is still up; the first door wipe starts at about 2.24 s. **Pass.**
- **Launch-week length** 27.95 s (20–30 s). **Pass.** "GTA 6" is spoken from 0.12 s and is on screen at frame 0.

## Truth: every on-screen word and drawn icon against the source
| Claim / mark | Source | Verdict |
|---|---|---|
| "the prompt just says: fridge" / `△ FRIDGE` tag | 436.6 s: `⋮ FRIDGE` prompt beside the fridge (BRIEF F2: △ ⋮ FRIDGE) | ✓ |
| List LOGGER BEER, LAVAZAS BEER, BLITZ BERRY SMOOTHIE, BLITZ GREEN SMOOTHIE, PROTEIN SHAKE | 439.25 s full frame | ✓ order and spelling |
| Smoothie rows: teal-ringed bolt + purple-ringed eye | 439.25 s crop | ✓ shapes and colours now match |
| Shake row: pink-ringed two-lobe icon, then teal bolt, no eye | 439.1 / 439.3 s, crop ×4 with contrast boost | ✓ matches exactly (the r1 error is fixed) |
| "The beers get no icons" / `NO ICONS` | 439.25 s | ✓ |
| `ZOOM ×3` loupe of the real list | is the real 439.25 s frame | ✓ honest, labelled |
| `FLEECA BANK` magnet | 439.25 s, 439.8 s: round magnet reading FLEECA BANK | ✓ |
| `DRINK R1` / `DROP ◯` | 443.0 s crop: DRINK (R1), DROP (◯) | ✓ |
| Vote buttons: BEER (bottle), SMOOTHIE (bolt + eye) | our graphic; the icon pair matches the smoothie rows | ✓ |
| The ✕ cursor walks down the RE-DRAWN panel to BERRY, GREEN and SHAKE (8.5–11.5 s) | the source only ever highlights LOGGER and LAVAZAS | minor: tagged RE-DRAWN and read as a read-along, but it suggests those rows were selected |

Every spoken line is supported by BRIEF F1–F8, and nothing is overstated. **Truth 9.0.** It isn't higher because of the ✕ walking onto rows Rockstar never highlighted.

## Scores
| # | Criterion | Score | Why |
|---|---|---|---|
| 1 | Hook | **7.0** | 3 big words, a real menu as the payoff on frame 0, strong motion. As a still, though, frame 0 is a motion-blurred card about 830 px wide with ghosted rows (it is crisp only from about 0.5 s), and y 1430–1920 is flat ink. "Fridge menu" is a mild stake: curiosity, not a threat or a test. |
| 2 | Retention | **7.0** | Something changes about every 1–1.5 s and nothing is frozen. Re-hooks: the list lighting up (7.6), NO ICONS / NOT EXPLAINED plus the ×3 loupe (13–17), Fleeca (19), DRINK/DROP (21.6), the vote (24.5). Weak spots: 2.5–4.0 s is dark footage of a man's back with no mark or caption, and its payoff (the FRIDGE prompt and tag) is on screen for only about 0.15 s (4.0–4.15) before the door wipe covers it. There are four full-frame cream door wipes (about 1.2 s of near-blank cream in total). 4.5–5.0 s is a small, still drawn fridge on empty ink. |
| 3 | Clarity | **8.0** | A 14-year-old gets it: walk up, a menu appears, you pick a drink, some drinks have mystery icons. One read at a time now; r1's seven-item pile-up is gone. Docked because the "the prompt just says: fridge" beat can't be read: the tag flashes and the real prompt is about 15 px on the card. |
| 4 | Truth | **9.0** | See the table. Every word and icon matches the source, and the corrected shake row is exactly right. Small deduction for the ✕ cursor on rows that were never highlighted. |
| 5 | Motion and design craft | **6.5** | Better than r1: full-width five-row panel, real ×3 loupe, the credit is never covered, no TURN ON fragment, a clean freeze instead of judder. Still weak: (a) the FRIDGE tag is drawn under the door wipe and never gets its dwell, so the line's one payoff is lost; (b) the drawn fridge (about 470 px wide, flat vector, red/green clip-art bottles) is under 700 px and sits still on empty ink from 4.5 to 5.0 s. This repeats LESSONS "a hero shape under 700 px reads as stock" (−1). (c) The door wipe frames (2.3, 4.3, 18.5, 21.5 s) look like empty cream screens on a phone; the hinge and edge shadow are too subtle to read as a door. (d) Most beats are a card floating in the top 75 % over flat berry ink. |
| 6 | Voice and sound | **7.0** | Hook in the first words, −14 LUFS, no music, and the drink line is clean in the mix (verified). The pairs in the items line help. Against that: Ming is flat on the list; the frame-0 thump's RMS is above "GTA"; the door hit before "Drink" is only about 2 dB under the voice. |
| 7 | Loop and ending | **7.0** | "Beer or smoothie? Pick one, because GTA 6 has a fridge menu." reads much better than r1's "because again", and the last frame returns the frame-0 layout. But the seam measures a mean difference of 6.65 against the LESSONS target of < 2 (a sharp hold jumps to a blurred moving frame 0). That is a repeated LESSONS mistake, −1. |
| 8 | Shareability | **6.5** | "They gave a fridge a menu with brands" is a good detail to DM, and "beer or smoothie" is easy to comment on. But the real list is never shown at full screen width. The most shareable frame, the real door with the Fleeca magnet, Polaroids and the list together (source 439.25 s), never appears large. |

**Overall: 7.2** (58.0 / 8 = 7.25, not rounded up) · **Truth: 9.0**

**Gate (Overall ≥ 7.0 AND Truth ≥ 8.5): PASS.** In factory terms the verdict is **fix then post** (7.0–7.9). The two polish fixes below can be done without another jury round. It ties gta-trunkstream (7.2 / T8.5) with a cleaner Truth, and is below gta-holdup (7.6 / T9.0).

## r1 issues: status
1. Shake-row icons and teal bolt: **fixed** (I verified them on the source).
2. Hook payoff readable muted, and no blank cream by 2.0 s: **fixed** (the ×3 push, the wipe from 2.24 s).
3. Half-empty list panel: **fixed** (all five rows dimmed, each lit on its word).
4. Real icons at source pixels (loupe): **done**, but the ringed shake row is still a faded smudge at ×3. The BLITZ GREEN row above it carries the proof.
5. List paired, drink line re-rolled: **fixed** (the drink line is clean in the final mix).
6. Credit covered: **fixed.** 7. TURN ON fragment: **fixed.** 8. menuB judder: **fixed** (freeze).
9. Loop line: **fixed** in wording; the seam still doesn't match pixel for pixel.
10. Poster: still the frame-0 card, which is fine as a hook frame but isn't the most shareable picture.

## Remaining fixes, ranked by impact

### Must fix before posting
None. The gate passes, and nothing in the film is false or breaks a SAFE-EDIT rule.

### Polish (apply before upload if the run has time, as LESSONS asks; no new jury round needed)
1. **4.0–4.6 s: give FRIDGE its dwell.** The prompt appears at 4.0 and "fridge" is spoken at 4.02–4.16, but the door wipe covers the frame by 4.2, so the `△ FRIDGE` tag (80 px) is readable for about 0.15 s. Freeze the walk card on 436.6 s from 3.9 s, show the tag from 3.95 s, and start the door wipe no earlier than 5.0 s (the "open" line starts at 5.0; the drawn fridge's door swing on "Open" can be the wipe). Then the tag gets at least 1.0 s. Register 'fridge' in readcheck and re-run it, since `out/picture.log` is still r1's.
2. **Wow: on "two" (about 14.9 s) or as the poster, show the real door big.** Put the full 439.25 s frame on a card about 1000 px wide: the Fleeca magnet, the dog Polaroid, LOMBANK and the list together. Ring the list's icon column and push in 1.0 → 1.4× onto the green-smoothie row. That one frame is the "they really made this" image people send. Use it as `poster.jpg` too, instead of the blurred frame-0 card.
3. **0.0–0.5 s: a sharp frame 0.** Hold menuA's sharpest frame (the source is crisp at about 438.8 s) for the first 0.3 s, then play, and keep the push glide for motion. This also closes the loop seam: hold the same frame as the last frame, and target a first-to-last mean difference under 2.
4. **4.5–5.0 s: the drawn fridge.** Scale it up to at least 700 px wide (about 1.5×), give it a 1.0 → 1.06 push while it's closed, and fill it with what the real fridge holds (Logger bottles, Blitz bottles), not generic red and green blocks. Otherwise it reads as stock clip art next to real footage.
5. **Door wipes (2.24, 4.2, 18.4, 21.4 s): make them read as a door.** Add a 40 px dark hinge-edge shadow, the door's gasket line and a 6–8 px gap of light, and cut each to 0.25 s of full cover or less. Right now they read as blank cream frames.
6. **8.5–11.5 s: stop the ✕ on the redrawn rows.** Use the yellow row light only (no ✕ glyph) for BERRY, GREEN and SHAKE. Keep the ✕ on LOGGER and LAVAZAS, the only rows the source highlights.
7. **Sound:** bring the frame-0 thump down about 3 dB, so its RMS is under "GTA". Bring the door hit at 21.2 s down 2 dB, so it sits at least 3 dB under "Drink".
8. **2.5–4.0 s: the walk card.** Add a yellow ring that tracks the fridge (the target) from 2.6 s, so the 1.5 s of a dark back has something to watch.

## Generic / AI-made look
- The cream sticker captions with one yellow word and the berry-ink gradient are Delta's house template. They're competent, but they read as a template, not as something made for this fridge.
- The drawn fridge is plain flat vector: rows of red and green blocks for drinks, a plain circle for a magnet. Next to Rockstar's real cluttered door it looks like stock art. The dog Polaroid helps a little.
- The red tilted `NOT EXPLAINED` stamp is a stock "mystery" trope, though it is honest here.
