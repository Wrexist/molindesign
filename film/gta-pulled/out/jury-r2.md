# gta-pulled · jury r2 (fresh, independent; r1 not read)

Judged: `out/gta-pulled-vo.mp4` (30.0 s, 1080x1920, -14.0 LUFS, TP -2.6 dBTP, no black frames). Frames pulled at 0, 1.0, 2.5, 3.5-3.9, 4.8, 9.6, 13.2, 16.3, 16.6, 19.6, 22.0, 22.5, 25.0, 27.0, 27.4, 29.9 s; still detection on a 108x192 grey proxy (mean frame diff < 0.15 for >= 1 s); SFX located as mix minus the voice-only track.

## Scores
| # | Criterion | Score | Why |
|---|---|---|---|
| 1 | Hook | 6.5 | Frame 0 has 2 words (PULLED, GTA) and the loop shelf, good. But the stake of the spoken hook, WALMART, is not on screen until 17.3 s, so sound-off it reads "a pulled GTA case", not "a giant store pulled a game". Blank coloured cases on a shelf are not a still anyone stops for. |
| 2 | Retention | 5.5 | Near-still stretches: 1.13-3.03 (1.9 s), **3.9-6.6 (2.7 s, across the 5 s drop-off)**, 7.47-9.2 (1.7 s), 9.8-11.97 (2.2 s), 23.3-24.5, 27.7-29.0. 8.5 s of the first 12 s barely moves. Repeats LESSONS (memory r2 "no still frame near 5 s"; gta-pc "change every 1.2 s"): -1 applied. |
| 3 | Clarity | 7.5 | One idea, one read at a time, M/MATURE 17+ and AO/ADULTS ONLY spelled out. But the case in the rating close-up (12-17 s) and the new-version case (21-24 s) are blank green rectangles: sound-off you can't tell which game got the AO. |
| 4 | Truth | 8.5 | Every spoken claim matches BRIEF sources (ESRB revocation/AO, hidden content on final disc + third-party patch, Walmart/Target/Best Buy pulled copies, M-rated second edition, Nov 19). Never says "banned", box never opens. Deduction: an unlabeled 2005 tile on the SAN ANDREAS case (3.7-6.6 s) reads as the release year; the PS2 game came out in Oct 2004 (2005 was the pull). No source chip on the stores beat. |
| 5 | Motion/design craft | 6.5 | Paper props and rail are clean; AO slap with punch-in and dust is a real hero. But the cases are flat template rectangles with two coloured lines, the NOV 19 page sits alone at 24.5-25.4 s with the lower half empty, and the bottom ~25 % is a flat teal desk every frame. |
| 6 | Voice and sound | 6.5 | Hook in the first word, clean Whisper (WER 0 on every line). Only ~8 hits in 30 s, all in pauses (AO stamp at 16.05 s about 4-6 dB under the voice, fine). The scissors cut, the M slapping back (~22.5 s) and the NOV 19 page are silent; the second "payoff" has no sound. |
| 7 | Loop and ending | 7.5 | Ends on the frame-0 shelf with PULLED; question leads back into "Walmart once pulled GTA". YES/NO identical, picture doesn't answer. |
| 8 | Shareability | 6.5 | AO-over-M is a real screenshot frame and the question can pull comments, but Hot Coffee is a well-worn story and the film never shows the one surprising detail (the scene was finished and on every disc) as an image. |

**Overall: 6.8** (55.0 / 8, not rounded up) · **Truth: 8.5** · Verdict: **don't post** (below 7.0). Previous Delta films 6.7-7.2; this matches, not beats, them.

Generic/AI-made look: the blank game cases (green slab + pink line + orange line) read as placeholder UI; the rest reads hand-made.

## Fixes, ranked by impact
1. **3.9-6.6 s and 9.8-12.0 s (retention).** 2.7 s of a static case right across the 5 s drop-off. Add a change every <= 1.2 s: the case turns/flips to its back at 4.6 s, the 2005 tile stamps with a knock at 4.2 s, a second disc slides out at 5.5 s; in the locked-box beat, the key wiggles at 10.0 s and the lock shackle jumps at 10.8 s, box shakes at 11.4 s.
2. **Frame 0 / hook (sound-off stake).** Hang a plain WALMART store tag (text only, >= 90 px) on the shelf header at frame 0 in place of the small GTA label, or put WALMART on the PULLED tag ("PULLED · WALMART" = 3 words). The spoken stake must be readable by 1.5 s.
3. **12-24 s (clarity, raise the wow).** Keep "SAN ANDREAS" readable on the case in the rating close-up and the new-version beat (crop to the corner so the title is in frame at >= 60 px). Then make the hero moment bigger: the AO sticker slaps, and the whole shelf behind it empties in the same beat with a cascade sound, so the cause-effect is one image (and the poster).
4. **3.7-6.6 s (truth).** Scope the year: "2005 · PULLED" or move the 2005 tile off the case onto a calendar page, so it can't read as the release year (PS2 release Oct 2004).
5. **Sound.** Give the scissors cut (~20.9 s) a snip and the M slapping back a stamp in a written pause (add 0.4 s after "cut the scene,"), and a page flap on NOV 19 at 24.4 s. Hits >= 3 dB under neighbouring words, gated on vo/vad.js.
6. **17.2-20 s (truth/craft).** Add a small source chip "AP, JULY 20, 2005" under the WALMART / TARGET / BEST BUY sign; it is the only beat without a source.
7. **24.4-25.5 s (fill).** NOV 19 page alone with an empty lower half; rise the question card with it at 24.6 s or scale the page to >= 600 px.
8. **Cases (craft).** Replace the two-line green slabs with hand-drawn covers: our own type, a sticker price, a worn edge, the M tile printed on the case from frame 0 so the swap reads.
