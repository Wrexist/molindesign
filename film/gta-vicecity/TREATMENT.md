# GTA 6: Vice City is 29 years old (Delta)

Vertical 1080x1920 Short, about 42 s, 30 fps. One hard idea: **GTA 6's Vice City first appeared in 1997; four Vice Cities on one timeline (1997, 2002, 2006, 2026) make it 29 years old by release year.** Own flat graphics, own voice, no Rockstar footage, logo, key art, map art or music. In-game years (1986, 1984) always carry an IN-GAME YEAR tag; release years carry RELEASE YEAR.

## Benchmarks
- **Split-flap departure boards and hotel flip clocks**: learn the flap that falls on a hinge, one digit at a time, a click per flap; a number you can read at every rest. Don't take the airport-board clutter (rows of destinations) or a counter caught mid-roll on frame 0.
- **`film/gta-13years/` and `film/gta-leonida/`** (our last two Delta films): learn the striped Vice City sun as a backdrop that always moves, the Leonida silhouette, one hero stamp, the torn three-stripe wipe from `gta-transition`. Don't take a map that sits in the same place for the whole film, or stamps on every beat.

## Three structures
1. **Ranked list** of the four Vice Cities: rejected, ranking is our opinion and it buries the one number.
2. **Side-by-side map comparison** (1997 map vs 2026 map): rejected, it needs Rockstar's map art and no source gives a GTA 1 layout.
3. **The year dial** (chosen): one big four-digit flip counter owns the top of the frame for the whole film; it flips forward on release years and **rolls backwards** on story years, and the card under it changes era with it (pixel tile, neon postcard, pocket handheld, Leonida). The film ends with the dial rolling 2026 back to 1997, which is exactly frame 0, so the loop is seamless.

## Native move
**The flip.** Every digit change is a flap falling on a hinge. Release years flip forward with a teal RELEASE YEAR tag; story years roll backwards through every year with an orange IN-GAME YEAR tag, so the "game newer than its year" surprise is the motion itself. Scene changes are the torn three-stripe wipe passing under the dial, with the next card already drawn underneath.

## Line to picture
| Line | Picture |
|---|---|
| hook "GTA 6's city is from 1997." | Frame 0: huge pink 1997 flip dial over the striped sunset, GTA 6 chip under it. Three words on screen. The dial breathes down from 1.1x, sun stripes slide, palms sway. |
| ask "So how old is GTA 6's Vice City?" | Dial settles to its home size; a ghosted dashed 2026 tile row (GTA 6 OUT) and a big cream "?" between them; HOW OLD? chip. |
| gta1 "It's 1997. The first Grand Theft Auto." | RELEASE YEAR tag; our own pixel top-down tile slides up (blocky roads, a car sprite driving, chunky palms), FIRST GTA chip. OUR DRAWING label. |
| map "Seen from above. Three cities. Vice City was one." | The tile shrinks into the first of three city rows: LIBERTY CITY, SAN ANDREAS, VICE CITY; TOP-DOWN tag on "above"; the Vice City row lights pink on "one". |
| vc "Then 2002. GTA Vice City goes 3D." | Wipe. Dial flips 1997 → 2002. Neon postcard "GREETINGS FROM VICE CITY": flat skyline outlines extrude up into 3D blocks on "3D"; PS2 · OCT 2002 chip. |
| set "Its story is set in 1986." | Dial rolls backwards 2002 → 1986, tag turns orange IN-GAME YEAR. Card: RELEASED 2002 and STORY SET 1986 with an arrow running backwards and a little car reversing along it. |
| forty "That's forty years before GTA 6 comes out." | Wipe. Ruler 1986 → 2026, the sun rolls along it, brace, hero stamp **40 YEARS** (the screenshot frame, held 3 s+). |
| vcs "Then 2006. Vice City Stories rewinds to 1984." | Wipe. Dial flips to 2006 (RELEASE YEAR), handheld card (generic, no logo) with the skyline on its screen, PSP · 2006 chip; on "rewinds" the screen shows a rewind arrow and the dial rolls back to 1984 (IN-GAME YEAR). |
| now "Now, on November 19th, GTA 6 brings it back." | Wipe. Dial flips to 2026; Leonida silhouette (from gta-leonida) with a pulsing pink Vice City dot; NOV 19, 2026 and PS5 · XBOX SERIES X\|S chips; source ROCKSTARGAMES.COM/VI. |
| quote "In Rockstar's words, we're a long way from the '80s." | Wipe. Taped cream paper quote: "We're a long way from the '80s…" (Rockstar's sentence, cut, so it ends in …), pink underline draws under the '80s, source line. |
| span "That's twenty-nine years of Vice City." | Wipe. Proportional timeline with the four mini props at 1997 · 2002 · 2006 · 2026; brace 1997 → 2026, 29 YEARS chip, BY RELEASE YEAR tag. The dial rolls 2026 → 1997. |
| best "Best Vice City? '97, '02, '06 or '26?" | Four vote chips pop on their words, none highlighted; the dial reads 1997 and the frame dissolves into frame 0. |

## Notes for fixes
- Every beat is keyed with `at(id, word)`; dial keys live in `DIAL`, wipes in `SC`.
- SFX pass through a word gate (`gate()` in `initTimes`): hits move into the gap before a word with 0.15 s / 0.14 s margins, or are dropped; rolls are silent except a final flap in a pause.
