# Is GTA 6 too expensive? · treatment (Delta, pillar 1: Numbers and money)

## Benchmarks
- **film/gta-ranked/** (Delta, latest engine): keep its engine whole (voice-first `at(id, word)`, the `vo/vad.js` SFX gate, paper pieces with grain and pale cut edges, `fontStretch` re-applied after every font change, paper-tape captions, pink torn-band wipes, rail scan, quantized counters whose tags pop only once the number lands). Don't take its shelf-and-camera staging: one long camera move over one prop held 2-3 s stretches mid-film.
- **film/gta-editions/** (Delta, the first prop juries called hand-made): paper price tags, a torn receipt slip. Take the props; don't take its "two prices" frame 0, which told a story everyone already knew. Here frame 0 asks the viewer's own question ("TOO MUCH?") and the film turns it.

## Three structures
1. **Line chart of CPI 2013-2026.** Rejected: a dashboard (held five Delta films), and the viewer has to read axes.
2. **Two receipts side by side, then a third with inflation.** Rejected: a list of cards, no physical cause.
3. **One balance scale and one pump** (chosen). Frame 0: the GTA 6 tag swinging on its string, `TOO MUCH?`. GTA 5's older tag swings in; both hook onto a brass scale that tips toward GTA 6 ("on paper"). Then a hand-built bicycle pump labelled CPI-U flips years 2013 → 2026 and pumps up a round "today's money" disc beside the GTA 5 tag ($59.99 → $86.33). Back on the scale the disc hangs under GTA 5 as a weight and the scale slams the other way.

## The native move
**The inflation pump.** Each pump stroke flips the year card one step and the disc swells; the printed $59.99 on the old tag never changes (that's the real 2013 price); the disc beside it carries the today's-money figure and gets its `CPI-U · SEPT 2026` tag only after the number lands.

## Rules this cut is built to pass (LESSONS: Delta, "more graphical", gta-*)
- Frame 0 fully printed, 5 tokens: `GTA 6` band, `$79.99`, `TOO MUCH?`. The tag swings ~200 px on its string in the first second.
- Every number carries its scope after it lands: `US LAUNCH PRICE · STANDARD`, `KOTAKU · MAY 2013`, `BLS CPI-U · SEPT 2013 → SEPT 2026`, `CPI-U · SEPT 2026`.
- No GTA 6 band over a GTA 5-only beat; the tags carry their own names, so a sound-off viewer never reads a price against the wrong game.
- One hero number (over $85, shown exactly as $86.33) and the poster carries it with both tags and the tipped scale.
- `CHEAPER` always with `IN TODAY'S $` in the same frame; the fine-print receipt resolves the asterisk two seconds later.
- Sound only in written pauses, gated on `vo/vad.js`. No music.
- End vote: YES and NO identical; nothing answers it.

## Line → picture
| Line | Picture | Sound (pauses only) |
|---|---|---|
| hook "GTA 6 costs $80. Too much?" | Frame 0: big GTA 6 tag swinging on its string, `TOO MUCH?` under it, coins on the floor. `TOO MUCH?` knocks on "Too much"; `US LAUNCH PRICE · STANDARD` chip after "$80". | creak before the first word; register ding after "$80" |
| then "GTA 5 was $59.99, back in 2013." | GTA 6 tag slides right and shrinks; the yellowed GTA 5 tag swings in from the left; `SEPT 2013` calendar card drops; controller doodle; `KOTAKU · MAY 2013` chip after the price. | flap on the card; thock after "2013" |
| ask "So which one really cost more?" | A brass scale rises from the floor; both tags hook onto it; a big `?` slams on the post. | clank as the tags hook on |
| paper "On paper, GTA 6, by twenty dollars." | Dip: the scale tips toward GTA 6; a receipt slides up `ON PAPER` / `$79.99 − $59.99 = $20`. | clank on the tip |
| prices "But since 2013, US prices rose over forty percent." | Wipe; the CPI-U pump: year card flips 2013 → 2026 (a tick per year, speeding up); milk, gas and burger stickers pop with rising arrows; `+43.9%` lands in the pause with `BLS CPI-U · SEPT 2013 → SEPT 2026`. | swish; ticks per year in the pause; pop on +43.9% |
| hero "So GTA 5's $59.99 is over $85 today." | GTA 5 tag swings in at right; pump strokes; the disc swells and rolls $59.99 → $86.33; stamp `OVER $85 TODAY` in the 0.9 s pause; `CPI-U · SEPT 2026` tag. | pump strokes; hero stamp in the pause |
| more "That's more than GTA 6 at $79.99." | Wipe back to the scale: the disc hangs under GTA 5 and the scale slams down on its side; `CHEAPER` / `IN TODAY'S $` under GTA 6. Poster in the pause. | clank + thud in the pause |
| fine "Both are US launch prices, standard edition." | A receipt prints up: `* US LAUNCH LIST PRICE` / `STANDARD EDITIONS` / `NO SALES, NO REGIONS`; chip `SEPT 2026 = LATEST BLS MONTH`. | receipt chatter (quiet, in gaps) |
| six "GTA 6 comes out November 19th." | Wipe; tear-off calendar `NOV 19 2026`, `GTA 6` pill, `PS5`, `XBOX SERIES X\|S`; 19 circled. | tear |
| end "So, is $80 too much? Yes or no?" | Wipe to the frame-0 tag and `TOO MUCH?`; identical YES and NO tags. A pink wipe brings back frame 0. | tick; swish into the loop |

## Log
- 2026-11-07 (director, first cut): built from film/gta-ranked's engine with new props (tags, scale, pump, disc, grocery stickers, receipts).
- 2026-11-07 (director, first cut rendered): voice re-timed (fine 28.65, six 32.1, end 35.0; dur 39.2) so no line is sped up; `prices` take 1 + tail_fade 0.1 (the solo check heard a phantom "percent" after "40%"; in-mix check clean). `vo/vad.js` generated from out/vo/vo.wav (40 dB under the loudest 10 ms frame); every hit sits in a VAD gap: pop before the first word, ding after "Too much?", swish + clank as the scale rises, pop on the `?`, year ticks speeding up into the pause after "percent" and a pop on `+43.9%`, heavy stamp `OVER $85 TODAY` in the hero pause, clank on `CHEAPER*`, receipt tick, tears/swishes on the wipes. Layout fixes after looking at frames: CHEAPER* moved inside the rail, stamp moved off the year box and the CPI-U chip, floor stamp moved off IN TODAY'S $, grocery stickers start on "since" so the pump scene's right half is never empty; swing/impact sizes cut so nothing leaves x 90–930 except the two tag entrances (clipped by the rail). Checks: boundscheck clean, readcheck all ok, in-mix Whisper 10/10 wer 0, −14.0 LUFS, pace OK (0–1 s motion 1.38, 0–3 s 1.12, no freezes), no black.
- 2026-11-07 (jury r1 fixes, 7.4 / Truth 8.5 → fix then post): (1) the rolling disc shows neutral grey digits and no `TODAY` until $86.33 lands. (2) SFX: SCORE compressor −16/3:1 → −8/2:1 (it squashed the hero to within 1 dB of the pops), per-type trims (pop/clank −8, tick/ding −5…−6, tear −5), `duck.smr_db` 28 → 36; measured on the final mix: hero stamp −5.9 dBFS (loudest hit, ~3 dB under the voice-span median −3.0), every other hit −8.4 or quieter. (3) `more`: a `$86.33 > $79.99` chip on "more", two scale bounces at +0.5/+1.0 s, `CHEAPER*` lands on "$79.99" (26.8) instead of after the line; the clank and receipt stay in the pause. (5) ask: the beam wobbles on "which" and "really", the `?` slams on "more" and holds to 11.7; paper: a brass `+$20` weight drops on the GTA 6 end with the tip. (6) pump and year card say `PRICES` (54 px); CPI-U stays in the source chips. (4, cheap version) disc grows to ~376 px (was 316), placed under the tag. Small: controller doodle leaves before the scale rises; no caption over the end card at the W4 wipe. Wording, facts, voice takes and duration (39.2 s) unchanged. Checks: boundscheck clean, readcheck 36/36, in-mix Whisper 10/10 wer 0, −13.9 LUFS / −2.6 dBTP, pace OK (0–1 s 1.38, 0–3 s 1.12, median 0.447), no black.
