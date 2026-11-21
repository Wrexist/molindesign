# gta-busted: jury round 1 (fresh eyes)

Film `film/gta-busted/out/gta-busted-vo.mp4`, 1080x1920, 41.85 s. Integrated -14.0 LUFS, true peak -2.5 dBTP, LRA 3.3. No black frames. pacecheck OK: motion 0-1 s 0.864, 0-3 s 0.648, no frozen stretches. `clipkit.py lint`: plates 84 % (rule 11 cap 85 %), foreground footage 0 %, lint ok. In-mix Whisper: all 13 lines ok ("Bot guns" for "Bought guns", wer 0.10).

## Scores
| Criterion | Score | Why |
|---|---|---|
| Hook | 6.5 | Frame 0 passes the rule: BEFORE YOU / GET BUSTED is 4 words, and all four CONFISCATED stamps are on by 2.0 s. But the count, the format's whole promise ("do these **4**"), is not on screen until a STEPS 4 tag at 3.3 s. The GTA 6 pill pops at 0.25 s, so it is missing on frame 0. Lucia is dimmed and cut in half by the left edge, and the receipt is a blurry white box on frame 0. As a still it reads "title over a dark trailer frame". |
| Retention | 6.5 | Something changes at least every 1.5 s and nothing freezes. But Step 1 only arrives at 9.3 s, and the first KEPT lands at about 17.5 s. "So what do the cops take?" (6.7-9.2 s) asks a question the receipt already answered on screen at 2.0 s. At 41.9 s the film is 12 s over the usual 30 s cap, and the 0-9 s preamble doesn't earn that extra time. |
| Clarity | 7.0 | The receipt idea is instantly clear and the counter 0/4 to 4/4 reads well. But the tag shows STEPS 4 from 3.3 to 9.2 s, which reads as STEP 4 before Step 1 at phone size. The impound dip undoes Step 2 and gives no way out (GamesRadar: recover via ScooterBros "for a significant fee"). And STASH BAGS stamped KEPT is wrong as a picture: you sold them, you didn't keep them. |
| Truth | 8.5 | Checked live against GamesRadar+ (money, vehicles, weapons) and PC Gamer. Game Rant timed out from the cloud, so it is checked only through BRIEF.md's quotes. $20,000 per character, all pocket cash lost when Wasted or Busted, unowned guns lost with the gold-icon exception on screen, the locker at most Ammu-Nations, Pay 'n' Spray registering for a fee, impounded when busted while driving your personal vehicle, and BuckMe unlocking in Ch. 1 all match the sources. The pocket-cash conflict is voiced as "Guides say", which is good. But the big stamp says COPS TAKE IT with no hedge, and the only scope is a small PER GAME RANT · GAMESRADAR+ line. That stamp is the poster and the share frame, while PC Gamer says "a few hundred dollars". Plates are mood only and none states a story fact. Lucia in the T1 jumpsuit is public Trailer 1 footage with no line about her story. |
| Motion and design craft | 6.5 | The property receipt is a genuinely hand-built prop: the evidence tape, the manila tag and the rip-and-stamp all work. There are flaws. Collisions at 32.4-34.6 s: the MOST IMPORTANT ONE ribbon sits over the BANK / YOUR CASH caption and the card top, and the BANK = SAFER, NOT FREE line runs into the receipt's torn edge. Plates are dimmed so far they read as black (9.5-12.5 s, 32.5 s), which wastes the "footage is the format" rule. All four steps repeat one identical layout (caption, card, prop, receipt), the flat dashboard LESSONS warns about (gta-pc). |
| Voice and sound | 7.0 | "G T A six. Do these four before you get busted" puts the hook in the first words. Pace is fine, Ming is clean, and the mix level is right. "Bought" is heard as "Bot". The 0.6 s impound pause is good. |
| Loop and ending | 7.5 | The last 0.2 s rebuilds frame 0 (rows clear, title back), and "How much are you carrying?" leads into "GTA 6, do these 4…". But the end caption reads HOW MUCH ON YOU? while the voice says "How much are you carrying?", a caption/voice mismatch. |
| Shareability | 6.5 | The $20,000 brick and COPS TAKE IT, and the KEPT 4/4 receipt, are both screenshot-able (7.5 on their own). Minus 1 for repeating a LESSONS mistake: the poster is picked mid-caption (gta-vicecity r1), and it shows $20,000 twice (caption plus hero), which splits the one hero number (gta-vicecity r2). |

**Overall 7.0** (56.0 / 8) · **Truth 8.5** → **PASS at the gate (fix then post)**. Same level as the last Delta films (7.0-7.2); not better than the last one.

## Fixes ranked by impact
### Quick picture/sound (no re-voice)
1. **0.0-2.0 s, Hook.** The count is missing and frame 0 is soft. Add a coral `4 THINGS` badge (≥ 110 px) and the GTA 6 pill on frame 0. That keeps 5 words or fewer: `GTA 6` pill + BEFORE YOU / GET BUSTED, with the 4 as a numeral stamp on the receipt header (`0/4` → big `4` rows). Show the receipt sharp with its 4 ruled rows at t = 0 (no blur ramp). Push Lucia 15 % so her face sits fully in frame, x 200-700.
2. **3.3-9.2 s, STEPS 4 tag.** It reads as STEP 4 before Step 1. Show `4 STEPS` with the word over the numeral at equal weight, or keep the tag blank and flip to STEP 1 at 9.3 s.
3. **32.4-34.6 s, collisions.** Move THE MOST IMPORTANT ONE ribbon to y 400-440, above the card and under the caption, or onto the STEP tag. Move the caption up 40 px. Lift BANK = SAFER, NOT FREE to sit under the ATM at y ≥ 24 px clear of the receipt's torn edge (about y 1050).
4. **36.0-39.5 s and the poster, Truth and Share.** Put the hedge into the stamp itself: `GUIDES: COPS TAKE IT` (or keep the stamp and raise the scope line to ≥ 44 px cream). Drop the small `$20,000` caption line while the 200 px $20,000 hero is on screen. Re-pick the poster at about 38.9 s: stamp landed, caption gone, one $20,000.
5. **9.5-12.5 s and 32.5 s, plates read black.** Dim to about 40 %, not about 70 %. The rule asks for ≥ 35 %, and right now the real game footage the format is sold on is invisible on a phone. Keep the ink gradient only behind the caption band (y 260-460) and the receipt.
6. **26.5-28.5 s, STASH BAGS = KEPT.** Stamp that row `SOLD ✓` (or `CASHED`) instead of KEPT, and keep the counter `3/4`. That is honest and it sets up Step 4: the fence's cash is now pocket cash.
7. **WOW, 36-39 s.** Make the $20,000 sweep the film's one physical moment. A drawn cop hand slides the brick off the tray in 0.35 s with a cash-sweep whoosh, bills fan out and fly off-frame, and the tray is left empty for 0.3 s. Then the brick re-forms in the ATM slot with the ka-chunk and KEPT 4/4. Right now the brick just sits under a stamp; this is the frame people would send.
8. **40.0-41.6 s, end caption.** Make it HOW MUCH ARE YOU / CARRYING? (2 lines, 120 px), or re-voice to "How much is on you?" so voice and screen match.

### Voice (re-voice)
9. **6.7-9.2 s.** Cut `q` ("So what do the cops take?"). The receipt answered it at 2.0 s. Step 1 moves to about 6.8 s and the film drops to about 39.4 s.
10. **28.8-32.4 s, impound dip.** Add the way out, or the dip reads as "Step 2 is pointless": "…It's impounded. Buying it back costs you." (GamesRadar: ScooterBros, "a significant fee"). Card sub `PAY TO GET IT BACK`.

## Generic or AI-made tells
- Four identical step layouts (caption, dark card with an icon disc, prop, receipt) read as a slide template. Vary at least the prop scale and position per step.
- The dark card with an icon disc, a red pill and a mono source line is the same card system as several earlier Delta films.
- The receipt, tape and tag are the hand-made parts. Lean on them more and on the dashboard cards less.
