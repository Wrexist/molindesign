# Jury r2: gta-trunkstream ("GTA 6 has a trunk streamer")

Fresh jury, 2026-11-24. Render `out/gta-trunkstream-vo.mp4` (25.3 s, 1080x1920). Frames pulled at 0.0, 0.5, 0.95, 1.0, 1.2, 1.4, 2.0, 2.5, 3.0, 5.0, 6.0, 8.3, 9.0, 10.3, 16.0, 19.0, 20.5, 21.8, 22.0, 24.5, 24.8 and 25.25 s. Source checked in `src.mp4` at 1092.0, 1104.3, 1105.0, 1106.5 (plus a right-third crop) and 1107.8 s. I also ran my own faster-whisper small.en pass over 1086–1110 s.

## Measurements
- pacecheck: 1 hard cut, motion 0–1 s 0.759, 0–3 s 1.748, median 0.462, 2.6 % still. OK, nothing frozen.
- Loudness: −13.9 LUFS integrated, true peak −2.5 dBTP, LRA 2.7 LU. blackdetect found no black frames. No music bed.
- In-mix listen check: 10/10 lines at wer 0.00.
- Source dialogue (my pass): 1086 "The cops are on their way." · 1092 "…Who the f*** are you?" · 1097 "Wait, did you steal my friend's car?" / 1099 "Yeah." · 1100 "Holy s***, **chat**! What do I do?" (Whisper prints "Chad") · 1104 "No, no, no… The actual cops are chasing us!". This supports "She steals a car", "He goes live" (he talks to his chat before the overlay appears) and "real cops".
- Real overlay: at 1104.3 `LIVE 51k`, at 1106.5 `LIVE 53k`, 6 stars with the two right-hand ones lit, `VIEW LIVESTREAM` + R3 at the bottom right. The chat order is dayum → Bro loves attention lol → sup camilo and chat → Dale dale dale → KING OF TRUNK!!! → That's tuff → gotchu… → FACTOLOGY → métele más → first stream!!! → Que fuerte che → CAMILO COME TO LOS SANTOS. At 1104.3 the police car is in the lower right, beside and behind the trunk car, with the light bar lit.

## Did the r1 fixes land?
| r1 fix | Status |
|---|---|
| 1 `WATCHING`/`+2K` out of the overlay, voice reworded, tag on the 0.95 s badge | **Landed**, with one gap. At 0.95 s `LIVE 51k` shows on the 18:12 clip with no tag. `RE-DRAWN · 18:24` arrives at about 1.2 s. |
| 2 Drop pnight/pdrive plates | **Landed.** |
| 3 Hand-built hero picture | **Partly.** The composition matches 1104.3 well: car from behind with the lid up, the man in the trunk, the police car lower right, a transparent chat column right, stars top right, VIEW LIVESTREAM bottom right. The drawing is still crude. The man is a green capsule with a tan disc and a black visor bar. The car reads as a box van, and the police car is a white slab over a black box. |
| 4 Disclaimer beat → re-hook "first stream. At 53K." | **Landed.** `first stream!!!` and `LIVE 53k` really do share the 18:26–18:28 frames. |
| 5 Fill y 1150–1450 | **Mostly landed.** It slips at 19.2–22.3 s: a 520 px phone. |
| 6 Frame 0 shows him in the trunk | **Landed.** The open trunk, his blond head and an arrow are visible. The woman's back is still the largest shape. |
| 7 Title cleared before the next read | **Landed.** |
| 8 Chat order | **Landed.** The real order is kept, with skips, and the description discloses them. |
| 9 Clean seam, run-on end line | **Landed.** The swipe is clean by 24.75 s, and "Because again," runs into the hook. |
| 10 Pings, ticks, chirp | Placed according to the log. I did not hear them separately. |
| r1 "Generic": two-rectangle light bar gone | **Not landed.** The police car still has a flat red rectangle and a flat blue rectangle (8–19 s, poster). BRIEF.md's log says it is gone. |

## Frame-0 / launch-week hook rule
- 0.0 s: the `GTA 6` chip plus `STREAMER / IN THE TRUNK` makes 4 words plus the chip. The small credit `CLIP · ROCKSTAR · AN EXTENDED LOOK` sits at the bottom of the clip. **Pass.**
- `LIVE 51k` payoff at 0.95 s: **pass** (≤ 2.0 s).
- Weakness: at 1.0–1.4 s the yellow ring sits on her elbow, not on his head, because the clip moves and the ring doesn't follow. The one thing frame 0 points at gets lost in the second the viewer decides.

## Scores
| # | Criterion | Score | Why |
|---|---|---|---|
| 1 | Hook | **7.0** | The rule passes, the payoff lands at 0.95 s, and motion over 0–3 s is 1.75. The still is still "a woman's back at a car". He is a small blond head under an arrow in the right third. From 1.0 s the ring drifts onto her elbow. The top 280 px and the bottom 470 px are empty purple. |
| 2 | Retention | **7.5** | Something changes about every 1.5 s and the re-hook lands at 19.2 s. 8–19 s (11 s, 43 % of the film) is one composition, with stickers ticking in. It holds, but just barely. |
| 3 | Clarity | **7.5** | A 14-year-old gets it. "His stream shows live: 51K" is clumsy English. At 19.0 s the caption `THERE'S EVEN A BUTTON: VIEW LIVESTREAM.` rides over the next scene's selfie phone mid-swipe. The ring misses the man at 1.0–1.4 s. |
| 4 | Truth | **8.5** | Every voice claim checks out against the footage and the dialogue (see Measurements). Deductions: the `LIVE 51k` badge sits on the 18:12 trunk-opening clip for about 0.25 s with no tag (0.95–1.2 s), so a time-shifted overlay reads as live at that moment. `● GOES LIVE` at 5.6–8 s is our own red-dot pill in the same style as the re-drawn LIVE badge, stamped across Rockstar's selfie footage and over its credit, so it can read as game UI. `+2,000` is more exact than 51k→53k allows (anything from about +1,000 to +3,000), and `51,000`/`53,000` need a "≈". No LESSONS repeat here. |
| 5 | Motion & design craft | **6.0** | The overlay redraw is accurate and transparent now, which is good work. The props are not. The green capsule man with a visor bar is still a placeholder, the car reads as a van, and the police car is a white slab plus black box with the **two-rectangle light bar that r1 flagged and the log says is gone**. At 19.2–22.3 s the hero phone is about 520 px wide (LESSONS wifibattery: a hero under 700 px reads as stock, a repeat, −1). The credit is cut off as `CLIP · ROCKSTAR · AN EXTEN` at 19.5–22 s, and `GOES LIVE` covers the clip credit at 6 s. The swipe at 19.0 s smears the old caption over the new scene. |
| 6 | Voice & sound | **7.0** | The hook comes in the first words, −13.9 LUFS, no music, all lines clean. "His stream shows live: fifty-one K" is a stilted read. The film leaves its best native sound on the table: the man's own line in the source, "Chat, what do I do?", which Delta can't play but can quote on screen. |
| 7 | Loop & ending | **7.5** | "Would you watch him? Be honest. Because again, / GTA 6 has a trunk streamer." reads on as one sentence, and the frame-0 layout is clean by 24.75 s. At 24.5 s the incoming title is a heavy blur smear over the vote card. |
| 8 | Shareability | **7.0** | `KING OF TRUNK!!!` is DM-able and `first stream!!!` at 53K is a good joke. The poster is our crude redraw, so the image that would get sent (the real 18:24 frame) isn't the one we have. The `CAMILO COME TO LOS SANTOS` chat line (1107.8 s, a Los Santos tease inside a Vice City stream) is unused. |

**Overall: 7.2** (58.0 / 8 = 7.25, not rounded up). **Truth: 8.5.** **Verdict: fix then post** (7.0–7.9, Truth ≥ 8.5).
That is up from r1 (6.9 / T7.5) but below the previous Delta film gta-holdup r2 (7.6 / T9.0), so this does not yet beat the last video.

## Fixes ranked by impact
1. **Craft/wow, 2.6–19.2 s and poster: redraw the three crude props.** Draw the man as a figure: a grey hoodie torso propped on one elbow, knees bent up, a head about 120 px with a sunglasses shape and hair, the phone held toward his face with a cyan glow (copy his pose at 1104.3 s). Give the car a sedan rear: a sloped rear window above the lifted lid, the lid as a thin raised panel showing its underside, and a body ≤ 620 px wide so it doesn't read as a van. Draw the police car as a real three-quarter rear (white door with dark lettering block, rounded roof, wheel). Animate the light bar as a single bar alternating red/blue at 4 Hz, with a 60 px bloom on the road. This is the poster and the share image, and it carries 43 % of the film.
2. **Truth, 0.95–1.2 s: the tag lands with the badge.** `RE-DRAWN · 18:24` prints on the same frame as `LIVE 51k`, or the badge appears at 1.2 s together with the tag. Better still, drop the badge onto the clip edge (outside the footage) with a leader line, so it never sits on the 18:12 picture as if it were live then.
3. **Truth/craft, 5.6–8.15 s: restyle `● GOES LIVE`.** Make it a cream sticker (our sticker style, not a red LIVE pill) placed outside the phone or above the credit band, so it can't read as Rockstar's UI and doesn't cover `CLIP · ROCKSTAR…`.
4. **Wow/share, 5.1–8.15 s or 19.2–22.3 s: use his real line.** Add a quote strip `"CHAT, WHAT DO I DO?"`, with the voice changed to "He even asks his chat what to do." (1100–1103 s; Whisper writes "Chad", but the context makes it "chat"). Add it to BRIEF.md as F3b with the timestamp. Of everything available, this is the one line people would quote, and it proves "he goes live" from inside the scene.
5. **Craft, 19.2–22.3 s: enlarge the selfie2 phone from about 520 to ≥ 760 px wide** (x 160–920, y 820–1430). Stack `first stream!!!` and `LIVE 53k` above it. Fix the truncated credit: shorten it to `CLIP · ROCKSTAR` or set it at 30 px so it fits inside the frame (it is a credit, below the 36 px read floor, as on other clips).
6. **Hook, 0.0–1.6 s: ring tracks his head.** Key the ring to the clip's head position per frame (it sits on her elbow at 1.0–1.4 s), or swap the ring for the arrow alone. Punch the clip 1.0 → 1.15× toward the trunk's right corner over 0–1.5 s so his head is ≥ 140 px tall by 1.0 s.
7. **Truth, 10.3–19 s stickers: `≈51,000`, `≈53,000`, `≈+2,000`** (or drop the +2,000 sticker and let the badge flip 51k→53k with a tick, which is cleaner).
8. **Clarity/voice, line "count":** rewrite as "His stream says LIVE: fifty-one K." or "His stream: live, fifty-one K." Re-voice that one line only.
9. **Clarity, 18.9–19.3 s and 24.4–24.75 s: the caption leaves before the swipe brings in the next scene,** so the old caption never rides over a new picture. Cut the motion-blur samples on the swipe so the incoming title isn't a smear for more than 2 frames.
10. **Share, 14–19 s (optional): add `CAMILO COME TO LOS SANTOS`** as the last chat row, if Rockstar's frame order (it sits under Que fuerte che at 1107.8 s) is kept with a skip. It's a Los Santos tease on a Vice City stream, and comment bait. List it in BRIEF.md F5 first.

## Generic / AI-looking
- The red/blue two-rectangle light bar and the slab police car are clip-art shorthand. A viewer who knows the real frame will see the gap between Rockstar's shot and ours.
- The capsule-with-visor figure reads as a placeholder, not hand-made craft.
- The cream caption strip at the top of every beat is the same Delta template again. Acceptable, but nothing in this film's typography is particular to a livestream (no chat-font or stream-UI type idea beyond the badge).
