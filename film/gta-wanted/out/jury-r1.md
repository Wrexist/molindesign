# gta-wanted · fresh jury r1 (2026-11-21)

MP4 `film/gta-wanted/out/gta-wanted-vo.mp4`, 28.3 s, 1080x1920 30 fps, -13.9 LUFS, true peak -2.6 dBTP, no black frames, pace OK (motion 0-1 s 3.65, 0-3 s 2.78, 3 hard cuts, no frozen stretch). Whisper in-mix 12/12 WER 0. Clip lint ok: Rockstar foreground 49 %, plates 61 %, all real footage 78 % (cap 85 %).

## Scores
| Criterion | Score | Why |
|---|---|---|
| Hook | 6.5 | Frame 0 = 4-word card + GTA 6 pill (at the limit), payoff (4 icons in the tray, real HUD in lens) on screen by 2.0 s, search chip in by 2.0 s. But frame 0 as a still is a blurred empty road: no Jason, no gun, the HUD is a speck. The lens only opens at ~0.7 s. |
| Retention | 7.0 | Countdown + a change roughly every 1.2 s. Holes: 20.4-21.0 s and 23.1-24.3 s the clip card vanishes and y 400-1150 is empty ink; 15.3-17.5 s shake beat is a small tray on a big empty field. |
| Clarity | 7.5 | Four labelled discs, one read at a time, three left at the end. "THAT THERE'S TWO OF YOU" is clumsy; the red-star meaning lives only in a ~26 px mono chip. |
| Truth | 8.0 | Icons, count and car-icon vanish all verified on frames and sources. But "Get out of sight, and the stars turn red" contradicts the cited source, and the masked beat leans toward "masks don't work" (see fixes 1-2). |
| Motion/design craft | 6.5 | HUD lens to tray is a real native move and the sharp HUD crops are good evidence. Smeared lens at 8.9 s, stray half-ring at 21.4-22.2 s, STILL LIT chip on the "2" badge, tiny mono chips, empty bands. The discs look like a stock icon set on a red/navy template gradient. |
| Voice/sound | 6.5 | GTA 6 is the first word, clean pace, no music. SFX exist but sit 12-17 dB under the voice peaks; the hero vanish hit (~-17.6 dBFS peak) is squeezed into a ~0.2 s gap between "car." and "Its". This repeats the LESSONS rule "the biggest visual beats need a sound" (-1). |
| Loop/ending | 7.5 | The last frame is frame 0, and "three" hands back to "four things". About 0.9 s after the last word, but it moves (grow-back), so no penalty. |
| Shareability | 7.0 | The real car icon blinking out is a genuine DM moment, but it lasts 0.2 s in a 640 px lens with no hold, before/after or stamp. |

**Overall 7.0** (56.5 / 8 = 7.06). **Truth 8.0.** **Verdict: don't post (FAIL: Truth < 8.5).** One re-voiced line and two picture fixes should clear Truth. Previous Delta first cuts were gta-daysales 7.2 / T 9.0 and gta-thingstodo 7.0 / T 9.0, so this is level on craft and behind on Truth.

## Rule audit (SAFE-EDIT 3, 7, 11; RUN.md frame 0)
- Foreground clips: the longest use is 2.1 s (icondrop). All are muted, ringed or lensed, and credited (CLIP · ROCKSTAR GAMES · AN EXTENDED LOOK). Pass.
- Plates: dimmed 52 % and blurred 3 px, always under the title, tray or chips, every range under 5 s, no range used twice (hud4 is reused only for the loop seam). Pass. There is no unbroken stretch that reads as raw footage.
- No Rockstar logo or trailer music seen or heard. No in-game TV, and the 882-916 s cutscene is not used. Pass.
- Frame 0: 4 words + GTA 6 pill, payoff by 2.0 s. Pass, but weak as a still.
- HUD truth: there really are four icons at 1.0 s (couple, hanger, head, car; 4 white stars). The car icon is present at 22.2 s and gone at 22.4 s as Lucia steps out (lens frame-checked). Three icons with red stars at the end. Pass.

## Source check
- Dexerto: icons = CCTV, couple, clothes, physical description, weapon, vehicle. Matches "two of you / clothes / looks / car" and the ALSO: WEAPON · CCTV chip.
- Beebom: car = vehicle known, and abandoning it removes that information. Matches "leave the car, its icon's gone". **Beebom also says hats, glasses or bandanas "can alter your physical description".**
- Engadget citing GameSpot: **solid white = line of sight; flashing white once you've broken line of sight; red = near a crime scene but police don't know where you are.** The film's "Get out of sight, and the stars turn red" states breaking sight as the trigger for red, which the source gives as flashing white. The chip also drops "near the scene".

## Fixes ranked by impact
1. **[voice + chip] 17.6-21.0 s, Truth.** The line says breaking sight turns the stars red; GameSpot says that gives flashing white, and red = near the scene with police not knowing where you are. Re-voice to "Lose them, and the stars turn red." (or "Hide near the scene: the stars turn red."). Change the chip to `RED = NEAR THE SCENE, THEY DON'T KNOW WHERE YOU ARE · GAMESPOT` at ≥ 36 px cap height, on two lines if needed.
2. **[picture] 11.8-13.6 s, Truth.** The masked beat is all graphics: our disc gets a bandana and a STILL LIT stamp, which reads with the sound off as "masks don't work". Beebom says bandanas can alter the description. Put the real proof under the stamp instead: freeze the 10.6 s looks frame (Jason in a bandana, lens ringing the lit description icon) and stamp `STILL LIT HERE`. Add the chip `MASK WAS ON DURING THE CRIME`. Keep the voice "Masks on. Still lit." as it is.
3. **[sound + voice timing] 22.1-22.4 s, the hero hit.** The vanish scratch/slam peaks at about -17.6 dBFS while the voice peaks at -2.5, in a 0.2 s gap. Open a 0.45 s pause between "car." and "Its" (split the line into two takes), freeze the lens 0.3 s on the vanish frame, and raise the slam to about 3 dB under the next voice peak (around -6 dBFS). Raise the ignition slam at 25.2 s (-14 dBFS) the same way.
4. **[picture, WOW] 22.2-23.1 s.** Make the DM moment the biggest frame in the film. Widen the lens to x 90-930 at 3x on the HUD and hold a 0.5 s before/after split: 4 icons on top, 3 icons below, with a hard white flash on the swap. The cracked car disc then falls out of the tray, through the frame, and shatters at y 1440 with the hit. Make this the poster.
5. **[picture] 0.0-0.7 s, Hook.** Frame 0 is a blurred empty road. Start from the 851.7-852 s frame where Jason is firing out of the window with the gun in frame. Have the cream lens already open on the HUD at frame 0 (4 white stars + 4 icons readable at ≥ 60 px), and add no new words. Keep the ≥ 300 px glide.
6. **[picture] 20.39-21.0 s and 23.12-24.27 s, Retention/fill.** The clip card disappears and leaves an empty band from y 400 to 1150 (frames 20.5 and 23.6). Hold the red clip's last frame annotated until 21.0, and hold the icondrop vanish frame (or the p6load plate under the card) until the burn clip starts at 24.27.
7. **[picture] 8.69-9.5 s, clothes beat.** The lens shows a whip-pan smear, so the hanger icon can't be read, and the ring sits on Jason's cap, not his shirt. Freeze the HUD crop on a steady frame (841.0-841.3) and move the ring to his torso.
8. **[picture] 21.3-22.2 s.** A half-ellipse hangs at the left edge (x 40-125) around an empty door before Lucia appears. Start the ring at 22.3 s when she's in frame, and keep it whole inside the card.
9. **[picture] 13.6-21 s.** The STILL LIT chip sits on top of the "2" badge on the LOOKS disc. Move the chip 40 px up or drop the badge while the chip shows. Raise every mono chip (RED =, ALSO:, CLIP credit) from ~26 px to ≥ 34 px. The lens box right edge touches x 932 on the poster frame, so pull it to ≤ 925.
10. **[voice] 5.6 s.** "Four: that there's two of you." reads as a typo on screen. Use the brief's own fallback, "Four: there are two of you." The caption becomes `THERE ARE TWO OF YOU.`

## Generic or AI-made tells
- Red circular discs with white glyphs read as a stock icon pack (Material-style person/hanger/car), not the cut-paper hand-made look that earlier Delta juries praised. Give them a paper edge, an offset print or the real HUD glyph shapes.
- Red-to-navy vignette gradient plus red/blue "police light" bars on the shake beat is a template look.
- Shake beat 15.3-17.5 s: four small discs on a mostly empty field, no real footage and no prop. It is the weakest stretch.
