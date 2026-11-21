# Jury r1: gta-wildfinds ("GTA 6 lets aliens take you")

**Overall 7.3** (8.0 + 6.5 + 6.5 + 8.5 + 7.0 + 7.0 + 8.0 + 7.0 = 58.5 / 8). **Truth 8.5.**
**Verdict: fix then post. Gate PASS** (≥ 7.0 and Truth ≥ 8.5). That is level with gta-settings r2 (7.3) and slightly better than gta-eastereggs r1 (7.1). The plates make it more watchable than eastereggs, but the #1 item is the weakest stretch of the film.

Checked: sheet.jpg; frames at 0.0, 0.3, 1.0, 2.0, 2.5, 4.0, 7.0, 7.6, 11.3, 11.9, 12.0, 18.3, 19.0, 21.0, 22.0, 22.8, 25.0, 31.0, 31.8 and 32.6 s; clips-used.json; pace.txt (OK, motion 0–1 s 0.676, 0–3 s 1.635, no frozen stretch); ebur128 (−14.0 LUFS, TP −2.6 dBTP); blackdetect (no black frames); and the mix.log Whisper check (all 11 lines WER 0).

## Scores
| # | Criterion | Score | Why |
|---|---|---|---|
| 1 | Hook | 8.0 | Frame 0 has 3 words (ALIENS TAKE YOU?), Lucia under the moonlight inside a coral beam and a GTA 6 pill, so it works as a still. By 1.0 s she glows white (payoff by 2.0 s). The GTA 6 SECRETS chip is up at 2.0 s. Not a 9: at 2.0 s the card has already gone, leaving an empty beam over a dim plate, and the white-out lasts under a second. |
| 2 | Retention | 6.5 | Real changes come every ~1.5 s in 6–23 s. Two weak stretches: 2.4–6.0 s (dial prints 1, then ticks, then spins to 5, over a plate of a car driving; 3.5 s with no new proof) and 23.8–30.8 s (7 s of our drawn road and drawn trophy, no real footage, at the climax). |
| 3 | Clarity | 6.5 | The crab is clear. The bent car (7.6 s) reads as a normal top-down car with a blower; the kink is not visible at card size. In the suit clip (10.8–12.5 s) the man is a tiny dark figure walking across a street, with no readable suit and no getting in a car. The skunk clip is a brown blur. The #1 voice never says "UFO" in its own slot ("a car on a dark road. Nobody around."). |
| 4 | Truth | 8.5 | Every line traces to BRIEF §4: UFO, Kelly County and after 2 AM are chipped PER GUIDES; the trophy name comes from Beebom and is chipped PER GUIDES; scoliosis has HE SAYS; the quote card says IN-GAME LINE · HIS CLIP; Collateral is hedged ("Sounds like"); "Florida's Bigfoot" is from Wikipedia. Docked because "GTA 6 secrets" oversells a physics glitch (the bent car), and "a man in a suit gets in *your* car" turns one random event into a general game fact in the voice (only the chip hedges it). |
| 5 | Motion & design | 7.0 | Consistent house look. The beam drop and the dial are a real native move, rings follow their targets, chips sit inside x 930 / y 1450, and headline type is ≥ 96 px. Against: captions half-faded mid-transition read as ghosted (LIKE A BANANA at 8.5 s, FLORIDA'S BIGFOOT at 22.8 s). The planned roofline spline, height bar and banana are missing (rings only). The drawn #1 road and trophy are flat clip-art next to four real clips. |
| 6 | Voice & sound | 7.0 | The hook is in the first 5 words. Countdown turns land on "Five / Four / Three". Level is in spec and there is no music. The voice is even, with little lift on #1, and "Nobody around." is a flat dip that lasts too long. |
| 7 | Loop | 8.0 | "Walk toward that light, and…" finishes in "GTA 6 lets aliens take you.". The last frame (ufo src 0.95) matches frame 0 (src 0.95) at full opacity, so the replay is seamless. |
| 8 | Shareability | 7.0 | The crab on Jason (19.0 s) is the screenshot. The UFO white-out is the share line, but it is on screen for under a second in total and never in its own #1 slot. |

## Rule-10 audit (creator clips): PASS, with zero margin
- In every use (bent 6.5–8.2, suit 10.8–12.6, crab 17.8–19.8, skunk 21.6–23.5, ufo 0–1.65 and 30.8–32.7) there is no facecam, creator caption, stream overlay, handle, minimap, logo or watermark. The text on the bus ("VICE CITY'S SEXIEST NIGHTCLUB") and on Lucia's shorts is in-game.
- No creator credit appears on screen (chips say IN HIS CLIP / HE SAYS only).
- Each use is under 5 s (max 1.93 s on screen) and the voice makes a point about each one.
- **Screen-time total 10.86 s of 32.7 s = 33.2 %, against a cap of 10.90 s.** The margin is 0.04 s, so any fix that adds creator time has to trim elsewhere first. The ufo clip is used twice from different source ranges (0.95–1.77 and 0–0.95), so no range repeats.

## Rule-11 audit (plates): PASS, borderline in two places
- Plates are Extended Look only, muted and dimmed. Each is under 5 s with a new range (p7night 0–1.95 then 2.05–3.95, no overlap), and all sit under our cards, dial, chips or captions. Real footage of every kind is about 83 % of runtime (all-ours frames at 14.9–16.9 and 27.3–30.8), under the 85 % limit.
- Borderline: at 3.0–5.9 s the plate car is the biggest object in frame, with only the dial over it. At 10.1–13.3 (p5van) a dimmed man in dark clothes and a woman fill the lower half, right under the caption "A MAN IN A SUIT". The plate competes with the clip and looks like the man in question.

## Fixes ranked by impact
1. **[picture + voice, wow] 23.95–30.25, give #1 real proof.** The #1 is now a drawn road for 3.5 s and a drawn trophy for 2.9 s, so the climax is the least real item. Play the ufo engulf (src 1.0–1.77) full card at 25.4–26.8, beam widening to white with a shutter/whoomp SFX. Pay for it by trimming bent, suit, crab and skunk to 1.45 s on screen each (saves ~1.6 s) so the creator total stays ≤ 10.9 s. Revoice `dark` to name it: "One: a UFO, on a dark road." Keep the drawn road for 1.2 s max, as the "where" diagram after the clip.
2. **[picture] 2.42–6.0, the countdown intro is dead.** Shorten the dial spin to 1.2 s and land the bent card by 4.6 s. For the wow, replace the five plain tick circles with five tiny drawn icons (banana car, suit, crab claw, footprint, UFO) that go out one by one as items pass. That makes it a menu the viewer wants to finish (Zeigarnik), not a ring of digits.
3. **[picture] 10.83–12.55, the suit clip proves nothing at card size.** Zoom the card 2.2× on x 150–460 of the crop and track the man. If the budget allows after fix 1, swap in the in-car moment (his post 9.0–10.0 s, subtitle visible) instead of the street walk. "Gets in your car" needs him in the car.
4. **[picture] 6.49–8.24, the bend is invisible.** Freeze 0.3 s earlier on the most kinked frame, scale the card 1.3×, and draw the coral spline along the roofline as TREATMENT planned (a ring is not a bend). Slide in the drawn banana beside it on "banana".
5. **[picture] 10.13–13.3, swap the p5van plate** for a range with no people (or dim it to 60 %). A big dark-clothed man under "A MAN IN A SUIT" muddles which man is meant, and the plate becomes the hero.
6. **[picture] Caption ghosting at 8.5 s and 22.8 s.** Outgoing captions sit at ~50 % opacity and overlap the next read. Cut caption-out to ≤ 0.12 s, or mask-wipe, so only one read is on screen at a time.
7. **[picture] 27.4–30.25, trophy on a plain navy stage.** Put a plate under it (p7night unused tail or p8skyline) and move the all-ours seconds to the Collateral card (14.9–16.9), which already sits on plain navy. Real footage stays ≤ 85 %.
8. **[picture] 21.56–23.46, skunk legs.** Lift exposure +0.3 EV and add the "this tall?" height bar against a drawn Jason silhouette so the size reads. "Up close" currently just looks like a blurry close shot.
9. **[voice, truth polish] `list` 2.5 s.** "Secrets" oversells a glitch. Say "five wild GTA 6 finds" and keep GTA 6 SECRETS as the search chip only, or move the bent car out for a real event. `suit`: "a man in a suit got in **his** car", to match the other creator framing.

## Generic / AI-made look
- The drawn #1 road (flat red car, moon, telephone pole) and the bronze trophy are stock clip-art next to real footage. They read as filler at the exact moment the film should peak.
- The slanted two-tone headline plus coral pill chips is now the house template across five Delta films. The beam cone is the only new thing; push it further (fix 1) so this film has a signature frame.
- No LESSONS full-point repeat found: frame 0 is ≤ 5 words, the payoff is by 2.0 s, the loop frame equals frame 0 at full opacity, there is no number carried across items (the dial re-prints at each item), and there is no camera push past the rail.
