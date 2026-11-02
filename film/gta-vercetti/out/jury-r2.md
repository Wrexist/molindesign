# Jury r2: gta-vercetti ("GTA 6's page names Tommy Vercetti"), Delta

Fresh jury. I did not read jury-r1.md. Film: `out/gta-vercetti-vo.mp4`, 1080×1920, 30 fps, 30.20 s. Poster: `out/poster.jpg` (19.017 s).

**Overall 6.8. Verdict: don't post.** Truth is 7.5, below the 8.5 gate. The cause is one cheap but serious on-screen inversion. The overall is also under 7.4.

## What I checked
- **Frames.** Every 0.25 s over 0–5 s and every 0.5 s after that. Full-size stills at 0.0, 1.0, 2.5, 4.3, 6.4, 9.6, 11.0, 13.2, 14.3, 16.3, 17.4–19.0, 20.0–25.2, 27.5, 29.5, 30.0 and 30.1. Every 0.2 s over 21.8–25.0. Frame difference sampled at 10 fps (270 px) to find still stretches.
- **Audio.** `ebur128` gives −13.9 LUFS integrated and −2.6 dBTP. `blackdetect` finds no black frames. I ran unhinted faster-whisper base.en (the factory's model) on the final mix, and took peak levels per 50 ms in every pause to find where the hits are.
- **Facts.** Plain curl with no user agent set, 2026-11-02:
  - rockstargames.com/VI: HTTP 200, 1,205,725 bytes. I decoded the Next.js payload.
  - Steam app 1546990: HTTP 200.
  - Take-Two PDF: HTTP 200, read with pdftotext.

## Fact check
| Claim (voice or screen) | Result |
|---|---|
| "GTA 6's page names Tommy Vercetti" | ✓ "Tommy" appears once. "Vercetti" appears 9 times, all in the Weapon Pattern item and the Hawk & Little Morgan item plus their alt texts. |
| "Channel the Original Kingpin" / "…inspired by Tommy Vercetti's iconic palm tree button-up." | ✓ Exact substrings, each found once in the payload, under "Weapon Pattern". The straight apostrophe matches the source. |
| "a pattern for most guns" | ✓ The source says "Adorn most guns…". |
| "His story was GTA Vice City" | ✓ Steam og:description: "Tommy Vercetti’s tale of betrayal and revenge…". |
| 2002 / OCT 2002 · PS2 | ✓ Take-Two PDF: "originally released in October 2002 for the PlayStation® 2". |
| "Any pre-order gets it, Standard or Ultimate" | ✓ The pack has a PRE-ORDER BONUS badge. Its benefit slides carry `"editions":{"ultimate":true,"standard":true}`. The Standard text says "along with pre-order bonuses". |
| "the page never says Tommy's in GTA 6" / PAGE: NAME ONLY | ✓ No story or character text names him. |
| GTA 6 · NOV 19, 2026 · PS5 · XBOX SERIES X\|S | ✓ "Coming<br/>November 19, 2026", "PlayStation 5" and "Xbox Series X\|S" are all on the page. |

All of the voice is true, and every number has a source in BRIEF.md.

**The picture contradicts the voice.** From 23.2 to 24.9 s (about 1.7 s, see fix 1), the frame reads top to bottom as **GTA 6'S PAGE / SAYS TOMMY'S IN GTA 6.** The word "NEVER" was on the previous caption card. That card was readable for only about 0.4 s (22.6–23.0) and was still fading in at 22.4. The PAGE: NAME ONLY card lower down softens this, but a viewer with the sound off reads the top two lines as one sentence. That sentence is the exact claim BRIEF.md's guardrail forbids. The LESSONS rule "a stamp must sit where it can't be read as confirming the wrong thing" (fyp r1) is repeated here. That costs Truth 1 point: 8.5 minus 1 = **7.5**.

## SAFE-EDIT jury checklist
| Check | Result |
|---|---|
| Footage we don't own, over 5 s and unannotated | ✓ None. All of it is our own paper art. No Rockstar footage, logo, key art or likeness. |
| A rumor stated as fact | ✗ **Borderline, on screen.** "GTA 6'S PAGE / SAYS TOMMY'S IN GTA 6." states an unconfirmed appearance for 1.7 s. The voice negates it; the picture doesn't. Treat it as a fail until fix 1 is in. |
| A leak or ending shown | ✓ None. |
| Trailer or radio music | ✓ None. The audio is voice and factory SFX only. |
| A number without a source | ✓ None (6, 2002, Nov 19 2026). |
| "GTA 6" in the first spoken second | ✓ It starts at about 0.32 s (Whisper pins it at 0.00). |
| Own voice on 80% or more of the runtime | ✓ |

## Scores
| # | Criterion | Score | Why |
|---|---|---|---|
| 1 | Hook | **6.0** | The base is 7.0. A GTA fan stops for "Tommy Vercetti", and the shirt on its hanger is a clean, readable object. But frame 0 is calm: a shirt on a rail, nothing at stake. The name tag is mid-spin and blurred on frame 0 ("TOMMY VERCETT"). At 0.25 s it shows its blank back, and it only reads sharp from about 0.7 s. Frame 0 also carries 5 words against LESSONS' limit of 4 (qrcode r1), a repeated mistake: −1. |
| 2 | Retention | **6.5** | There is always some motion (sway, grain), but the real changes are slow. 2.2–2.8 s is nearly still (frame difference 0.2–0.5/255, right at the drop-off). The native move, the scissors, only arrives at 17 s, 56% of the way in. From 9 to 17 s it is a quote strip, a caption and faint dashed lines. 10.9–12.3 and 18.9–20.0 are low-change holds of over 1 s. |
| 3 | Clarity | **6.5** | The one idea lands with sound on: a GTA 6 pre-order gun skin is based on Tommy's shirt. Sound off, three things hurt. The inverted caption at 23–25 s. The dashed pistol outline at 13.8–17 s, which reads as random dashes over the shirt's hem. And the hero pistol, whose slide is a flat teal slab with nearly no palms on it, so "palms on a gun" is not visible on the payoff frame. |
| 4 | Truth | **7.5** | The voice is 100% sourced and well scoped. The on-screen inversion at 23.2–24.9 s costs a point (repeated lesson, see above). |
| 5 | Motion and design craft | **6.5** | The base is 7.5. The cut-paper set reads as hand-made, the palette is coherent, the rail is respected and the hole in the shirt is a good image. Against that: <br>• The bottom y 1370–1920 is an empty brown floor for the whole film, and y 1270–1370 is empty in most shots. <br>• The pistol is clip-art flat. <br>• The Kingpin strip ghosts through the shirt at about 14.3 s. <br>• The PRE-ORDER BONUS and OCT 2002 · PS2 chips are at the 36 px floor. <br>Captions break mid-phrase all through the film: "HIS STORY WAS GTA / VICE CITY," (3.0 s), "SO WHY IS HE / ON GTA 6'S PAGE?" (6.4 s), "BUT THE PAGE NEVER / SAYS TOMMY'S IN GTA 6." (22.4 s). That repeats LESSONS fyp r1: −1. |
| 6 | Voice and sound | **7.0** | Ming is clean and well paced, and the hook is in the first words. Unhinted Whisper gets all 10 lines right, apart from the spelling "Versetti" (the same sound). There is no music bed. The hits are thin, though. I measured only five SFX moments: the clack at 0.0, snip/snip/stamp at 18.2/18.4/18.65, a hit at 25.8 and the swatch seat at 29.85. These pauses hold room tone only (about −46 dB) while something new lands on screen: <br>• 8.75–9.2 (the ? tag) <br>• 14.35–15.0 (the dashed outline and scissors entering) <br>• 21.9–22.45 (the edition tags) <br>• 25.05–25.75 (the PAGE: NAME ONLY push) |
| 7 | Loop and ending | **7.5** | The swatch flies back into the hole and the hanger returns to its frame-0 swing: a good seam. "Yes or no." flows back into "GTA 6's page names…". The YES/NO tags leave at about 29.2 s, though, so the last second asks for a vote with no options on screen. |
| 8 | Shareability | **7.0** | "GTA 6's page puts Tommy's palm shirt on your guns" is a real DM line for GTA fans. The poster undersells it: the shirt is small, the "gun" is a slab, and the print on it is barely visible. |

**Mean: (6.0 + 6.5 + 6.5 + 7.5 + 6.5 + 7.0 + 7.5 + 7.0) / 8 = 6.81, so 6.8.** The previous Delta film (gta-kalaga) ended at 7.0 / Truth 8.5. This cut is below it, so it is not yet better than the last.

## Fixes, ranked by impact
1. **22.4–24.9: the inverted claim.** <br>• **Seen:** the "BUT THE PAGE NEVER" card is readable for about 0.4 s. Then "SAYS TOMMY'S IN GTA 6." holds for about 1.7 s directly under the GTA 6'S PAGE pill, which returns at 23.0. <br>• **Why it matters:** sound off, it reads "GTA 6's page says Tommy's in GTA 6". That costs Truth and blocks posting. <br>• **Change:** one card for the whole line, for example "PAGE NEVER SAYS HE'S IN GTA 6" with "NEVER" in pink at ≥ 64 px, held 22.5–25.0. Keep the pill hidden until 25.0. <br>• **Then:** read every caption card together with whatever sits above and below it, as one sentence, frame by frame.
2. **Captions break mid-phrase (3.0, 6.4, 22.4 s).** <br>• **Seen:** names and clauses are split across cards. "SO WHY IS HE" shows alone, then "ON GTA 6'S PAGE?" sits under the GTA 6'S PAGE pill and repeats it. <br>• **Change:** cut each caption on phrase boundaries: "HIS STORY:" then "GTA VICE CITY", and "SO WHY IS HE ON IT?" as one card. Never pair a caption with the pill so that the two read as a different sentence.
3. **Frame 0 (0.0–0.7).** <br>• **Seen:** 5 words, and the tag spins through its blank back at 0.25 s. <br>• **Change:** start with the tag already facing the camera and sharp for 0.0–0.6 s, then sway. Shorten the pill to "GTA 6", for 4 words in all. <br>• **Wow:** put the open scissors at the pocket palm on frame 0 (blades about 220 px, orange, already touching the dashed circle). That gives frame 0 a threat to the shirt, not a still life, and it promises the native move instead of hiding it until 17 s.
4. **The hero and poster frame (18.2–19.4, poster 19.017).** <br>• **Seen:** the shirt shrinks to about 380 px. The slide is a flat teal rectangle with one faint palm, and it reads as a stapler. <br>• **Wow change:** make the pistol at least 640 px wide with real slide serrations, and put the cut swatch's palm on the slide at 140 px or more, the same palm as the hole. Keep the shirt at 480 px or more beside it. Draw a dashed string from the hole to the slide, so the poster tells the story in one look: hole in the shirt, then the same palm on the gun. <br>• **Sound:** add a paper "wrap" swish to the wrap itself.
5. **13.8–17.0: the dashed pistol outline.** <br>• **Seen:** it overlaps the shirt's hem at 50% contrast and reads as noise. The "Channel the Original Kingpin" strip also ghosts through the shirt at about 14.3. <br>• **Change:** bring the outline in only on "guns" (13.8), fully clear of the shirt (below y 1150), at full cream contrast. Kill the strip completely before the outline appears.
6. **Dead stretches near the drop-off.** <br>• **2.2–2.8:** frame difference 0.2–0.5/255. Snap the tag on "Vercetti" with a tick at about 2.6 (the pause runs 2.5–2.95). <br>• **10.9–12.3:** the Kingpin strip is a 1.4 s still. Make the strip land in two parts ("CHANNEL THE" then "ORIGINAL KINGPIN") at 56 px or more, or let the collar pop on "Kingpin".
7. **Silent beats in free pauses.** <br>• **Seen:** these windows are room tone only. <br>• **Change:** add a hit to each, at least 3 dB under the neighbouring words, and gate it on vad.js: <br>  • 8.75–9.2: ? tag drop tick <br>  • 14.35–15.0: scissors open, "shk" <br>  • 21.9–22.45: tag clip for STANDARD / ULTIMATE <br>  • 25.05–25.75: card slap for PAGE: NAME ONLY
8. **The end vote (about 29.2–30.2).** <br>• **Seen:** YES/NO leave about 1 s before the end. <br>• **Change:** hold them to 29.9 s and do the swatch return inside the last 0.3 s. Alternatively, let the swatch's flight pass behind the tags, so the vote is on screen when the viewer decides to comment.
9. **Fill.** <br>• **Seen:** in most shots the brown floor is empty from y 1270 to 1920, and the wall is empty from y 420 to 600. YouTube Shorts shows most of that. <br>• **Change:** lower the rail by about 120 px and scale the shirt up 10% in the non-hero beats, so the hero object fills y 500–1400. Put chips and strips on the floor band (above y 1430).
10. **Small chips.** <br>• **Seen:** OCT 2002 · PS2, SOURCE: TAKE-TWO and PRE-ORDER BONUS sit at the 36 px floor or below by eye. <br>• **Change:** set them to 40 px or more, cream on ink, and move PRE-ORDER BONUS next to the edition tags it qualifies.

## Generic or AI-looking
- The striped purple wallpaper and flat brown "cork" floor are bare. They read as a stock flat background more than a built set: no visible cut edges, pins or texture at phone size.
- The shirt is clean vector with a soft drop shadow. The "cut-paper" claim only shows at the hole's pinking edge. Add visible card thickness (2–3 px lighter edge) and a glue shadow on the collar and pocket.
- The pistol is a flat clip-art silhouette.
- The caption cards (cream tape, condensed caps) are now the channel's default on every Delta film. They are fine, but not distinctive.

## Notes for the maker
- The voice script is the best-scoped Delta script so far. Everything that blocks posting is in the picture.
- Fixes 1–2 take minutes and lift Truth back to about 8.5–9.0.
- Fixes 3–5 are what would move the film from about 7.0 toward 7.8. Re-run every LESSONS check after them: frame-0 word count, caption-plus-pill sentences, the rail, and hits against vad.js.
