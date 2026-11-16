# Which GTA sold the most? · treatment (Delta, pillar 3: GTA history)

## Benchmarks
- **film/gta-money/** (Delta, held ~7.0): keep its engine (voice-first `at(id, word)`, the `vo/vad.js` SFX gate, paper pieces with grain and pale cut edges, `fontStretch` re-applied after every font change, paper-tape captions, rail scan) and its tower of plain cases under a counter that rolls in round millions. Don't take its desk-lip staging (props rising one after another behind a lip read as a slideshow) or the 1.5-3 s holds the juries called still.
- **film/qrcode/** (passed 8.0): one physical prop that keeps changing state carries the film. Here that prop is the case shelf: three blank cases on a podium become three stacks on one scale, then one of them punches out of the frame.

## Three structures
1. **Bar chart race** of every GTA. Rejected: dashboard look (held five Delta films), and BRIEF.md only has three official counts.
2. **Three cards in a row** (#3, #2, #1, each its own card). Rejected: a list of cards hides the scale, and the scale is the claim.
3. **One shelf, one camera, one scale** (chosen). Frame 0: three blank `?` cases on a paper podium. The podium sinks, the cases stand on one floor, and each one rises on its own stack of case spines (one spine = 2.5 million copies, the same for all three). The camera pushes in on GTA 4, pans to San Andreas, pulls back for the crown, then follows the GTA 5 stack as it erupts out of the top of the frame, and pulls all the way back so the honest comparison fills the frame.

## The native move
**The stack.** Paper case spines drop onto the shelf, one per 2.5 million: 10 for GTA 4, 11 for San Andreas, 92 for GTA 5. The case rides on top, so the case climbs with its number. GTA 5's stack is 8x taller and the camera has to tilt up to follow it.

## Rules this cut is built to pass (LESSONS, Delta, "more graphical")
- Frame 0: `WHICH GTA SOLD THE MOST?` (5 words) over three big blank cases with `?` on a podium; spotlights sweep, flecks drift, a hand-drawn arrow hops case to case (glide over 400 px in the first second). No game names, no digits on frame 0.
- One honest scale, printed: `1 CASE = 2.5 MILLION` chip on the first stack; 25 / 27.5 / 230 all at 5 px per million.
- Every number carries its year: `25,000,000 · JULY 2013 · TAKE-TWO`, `27,500,000 · SEPT 2011 · ROCKSTAR`, `230,000,000+ · SOLD-IN · TAKE-TWO · AUG 2026`, `ALL GTA ≈ 475M · SOLD-IN · AUG 2026`.
- No quote marks on line `champ`: a paper crown is the picture.
- GTA 5 case stays `?` until its own line; no GTA 5 pill over another game's line.
- Tags show only after their number lands; counters quantized to the rendered frame.
- One hero number (230,000,000+) and the poster carries it, in the pause with the caption gone.
- Sound only in written pauses, gated on `vo/vad.js`. No music.
- End vote: YES and NO identical; nothing in the picture answers it.

## Line → picture
| Line | Picture | Sound (pauses only) |
|---|---|---|
| hook "Which GTA sold the most? Guess." | Frame 0 podium with three `?` cases, title, spotlights; arrow hops 1 → 2 → 3; `GUESS` slams on "Guess". | pop before the first word |
| count "The best-selling GTA games, by the last official count." | Podium sinks into the shelf, cases land on one floor; a ledger card `BEST-SELLING GTA` with #1-#3 rows of `?`; stamp `LAST OFFICIAL COUNT` lands on "last". | swish as the podium sinks |
| three "Number three: GTA 4. 25 million copies by 2013." | Push in on the left case: `#3` badge, case flips to GTA 4 on "three", 10 spines drop in on "25", counter lands `25,000,000`, sub-line `JULY 2013 · TAKE-TWO`, scale chip, `2013` tile on "2013". | flip tick; tile thock after "2013" |
| two "Number two: San Andreas. 27.5 million by 2011." | Pan to the middle case: `#2`, flips to SAN ANDREAS, 11 spines on "27.5", `27,500,000`, `SEPT 2011 · ROCKSTAR`, `2011` tile. | tile thock after "2011" |
| champ "Back then, Rockstar said it was still number one." | Pull back over both short stacks with compact tags; a paper crown drops onto San Andreas (held, calm). | — |
| one "But number one: GTA 5. Over 230 million." | Crown knocked off on "But"; pan right, `#1`, flip to GTA 5; on "Over" 92 spines erupt and the camera tilts up after the case; counter rolls and lands `230,000,000+`; impact + burst. | crown pop; hero stamp in the pause |
| asof "That's Take-Two's sold-in count, from this August." | Pull all the way back: the honest comparison fills the frame; sub-line `SOLD-IN · TAKE-TWO / AUG 2026`. Poster in the pause. | — |
| half "That's almost half of all GTA sales, ever." | Wipe; paper pie `ALL GTA ≈ 475M · SOLD-IN · AUG 2026`, GTA 5's 48% slice slides out on "half", dashed ½ line shows it is under half; `ALMOST HALF` slams. | wipe swish |
| six "GTA 6 comes out November 19th." | Wipe; torn calendar `NOV 19 2026`, `GTA 6` pill, `PS5 · XBOX SERIES X|S` chip. | tear |
| end "Will it beat GTA 5? Yes or no?" | Wipe back to the shelf: GTA 5 tower and a blank `GTA 6 ?` case on the floor; identical YES and NO tags. A pink wipe brings back frame 0. | tick; swish into the loop |

## Log
- 2026-11-06 (director, first cut): script `at`s re-chained to the voice (count 2.85, three 6.65, two 12.3, champ 16.75, one 19.75, asof 24.35, half 27.85, six 31.1, end 34.0; dur 37.2) so every line plays at natural speed with a pause after each number.
- 2026-11-06 (first cut, rendered): `asof` re-rolled to take 1 (take 0 was heard "Let's take two solden count"). `voiceover.py` wer now reads Whisper's list-mark "3." / "No. 1" for a spoken "number three/one" (it dropped "Number" on lines three and two in both checks). Camera for three/two pulled back to 1.08 so no neighbouring case is cut by the rail; counters land on a frame edge and switch to "+"/sub-lines on the quantized frame time (one blurred frame at the 230M landing before). Checks: boundscheck clean, readcheck all ok, in-mix Whisper 10/10 at wer 0, −13.9 LUFS, pace OK (0-3 s motion 0.516, no freezes), no black.
- 2026-11-06 (jury r1 fixes, 7.1 → fix then post): voice re-timed (half 28.3, six 31.55, end 34.7; dur 37.9; smr_db 28) to make room for the 8× beat; vad.js regenerated. (1) Hero sounds louder: LEVEL swish 3.4→14, tear 2.6→9, pop 2.6→4.6, rise 7 (wipes −25 → −13 dBFS, frame-0 pop −15 → −11), hero 230M stamp −6.9 dBFS peak, new `rise` under the eruption, the heavy 230M stamp carries a long boom tail through the pause. (2) No dead stretch at 4–6.6 s: cases hop on "games", stamp lands on "last", ledger leaves at 6.0. (3) The 230M card and captions sit left of the GTA 5 tower (caption x 305, width 410 from the payoff on). (4) `8× THE 2011 #2` with eight dashed rulers, each one San Andreas tower (derived, logged in BRIEF). (5) No chips leak across the 12.3–12.9 or 27.6–27.9 boundaries. (6) Pie: `UNDER 245M` rolls under EVERY OTHER GTA, ½ line knocked on "ever"; calendar: PS5 and XBOX chips land separately, 19 is circled on "19th". (7) `COPIES SOLD` sub-lines on GTA 4 / San Andreas vs `SOLD-IN` on GTA 5 and the pie; BRIEF fact 4 attribution now "Take-Two, Q1 FY2014 earnings call". Shelf front drawn at the rail edge while the camera follows the eruption up, so the tower never ends on an invisible cut line. (8) End frame: whole GTA 5 case on screen, GTA 6 case ×1.45 (≈220 px). (9) First second: spotlight swing plus arrow hop. (10) Scale chip `1 SPINE = 2.5 MILLION`. Backdrop toned down (palms removed, sun alpha lowered).
