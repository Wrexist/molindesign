# Jury round 2: gta-leaks ("Fixing some leaks"), Delta, trailer mode

Juried 2026-11-12 on `/mnt/project-files/factory/gta-leaks/gta-leaks-vo.mp4` (29.0 s, 1080x1920, 30 fps; the repo copy in out/ differs only by a few bytes, same render). I formed my view first and only then read round1.md.

Looked at: a 2 fps contact sheet, full frames at 0.0, 1.0, 2.5, 4.0, 4.6, 6.0, 9.6, 10.2, 13.5, 17.5, 17.8, 21.0, 23.5, 26.5 and 28.9 s, the factory poster.jpg, BRIEF.md, vo/script.json, seo.md, clips.json, out/clips-used.json, out/mix.log, film.js (SFX events), SAFE-EDIT.md and gta-clip-short/SKILL.md.

Measured:
- **Pace:** pacecheck OK. 5 hard cuts, motion 0.79 over 0-1 s and 0.549 over 0-3 s, 3.2 % still frames, no frozen stretch.
- **Loudness:** -13.9 LUFS integrated, true peak -2.7 dBTP, LRA 3.6 LU.
- **Black frames:** blackdetect found none.
- **Clip lint:** `clipkit.py lint gta-leaks` OK. 3 uses, footage 25 % of 29.0 s, each use under 5 s, every use has a note.
- **Speech check:** the in-mix Whisper check is WER 0.00 on all 10 lines.

## Scores

| # | Criterion | Score | Why |
|---|---|---|---|
| 1 | Hook | 7.0 | Frame 0 shows only the GTA 6 pill (2 words) over the real moving Trailer 2 house shot. That is a good still for a GTA viewer and the opening moves. But nothing on frame 0 asks a question. Round 1's fix 2 asked for a circle drawn on the roof from frame 0, and it is not there. OPENS WITH A LINE lands at about 0.5 s, but the key phrase ABOUT LEAKS only lands at about 2.3 s, after the 2 s mark. The spoken hook is factual and in the first words. |
| 2 | Retention | 7.5 | Something changes on screen at least every 1.5 s. Re-hooks come at 7.6 (HIS ANSWER?), 11.1 (WHY DOES THAT MATTER?), 16.6 (CONFIRMED), 19.2 (LEAKED!), 22.8 (THEORY) and 25.5 (vote). The round-1 empty stage at 24.6-25.5 s is fixed: the dripping house stays behind SO. One soft spot is 5.0-7.6 s, where a static drawing and a speech bubble sit on screen for 2.6 s and the only motion is the drips. |
| 3 | Clarity | 7.5 | One idea, one read at a time, and a 14-year-old gets the double meaning. The JASON · SAME SHOT chip (8.6-11 s) is insider wording: "same as what?" The drawn man below is a dark silhouette at the far-left edge and is easy to miss. |
| 4 | Truth | 8.5 | Every substantive claim matches the fact table. The hook is literal. The 90 is "about 90" plus the ABOUT 90 VIDEOS · PER REPORTS chip. CONFIRMED sits on Rockstar's own quote card, not on the tile grid. THEORY and UNCONFIRMED are on screen while "never said" is spoken. The quote plays on the roof frames (source 11.47-13.6 s) where Jason says it (11.76-12.9 s). Two small quote-fidelity issues keep it from 9 (see the fact check below). |
| 5 | Motion and design craft | 6.0 | 7.0 before the penalty. Captions now sit at y about 476, the clip card spans x 93-925, and the house is redrawn in the trailer's teal and labeled OUR DRAWING, all real gains. But the rail still breaks on a pixel scan. At 21.0 s the ROCKSTAR: "OUR TRAILER HAS LEAKED" pill spans x 45-974, outside on both sides. At 17.8 s the CONFIRMED stamp reaches x 962. That is the same LESSONS rail repeat round 1 charged, so it costs a full point again. The trailer footage still sits in a small square window (about 830 x 830 px) on a big stripe field. The 4.0-4.9 s roof annotation is only a yellow arrow under the leftover hook text; the brief's "JASON · ON THE ROOF" label is missing. The end card stacks ONE WORD BELOW on top of the house drawing, which looks cramped. |
| 6 | Voice and sound | 7.0 | The hook is in the first words. There is a 0.4 s pause before the punchline, now read at 0.92, and no music bed. Ticks after "leaks", a ratchet on the tiles and a pop on 90 sit on the hits. Our narrator still voices Jason's line, unavoidable when the trailer must be muted, but it is flat. There is still no real drip sound in a film about leaks: the "ticks" stand in for one. |
| 7 | Loop and ending | 7.0 | No fade: the vote card is at full opacity on the last frame. The picture loops (drawn house to the real house) and the words loop reasonably ("One word." into "GTA 6 Trailer 2 opens..."). The last line asks for a comment, not a re-watch, so the loop is accidental, not built. |
| 8 | Shareability | 7.0 | "Just fixing some leaks" over the roof freeze is the share line. But the poster in the factory folder (poster.jpg) is not that frame. It shows half a caption, WHY DOES THAT, plus the quote card on an empty stripe field with no footage. seo.md says the cover is the freeze with the quote card, so the packaging contradicts itself. |

**Overall: 7.1 (57.5 / 8 = 7.19, not rounded up). Truth 8.5.**

**Verdict: PASS the gate (overall ≥ 7.0 and Truth ≥ 8.5). By the jury scale this is "fix then post".** Fixes 1-3 below are cheap and should be done before upload.

Against the record: round 1 scored 6.5 / Truth 7.5, the last posted Delta Short (gta-money) 7.2 / 8.5, and the previous factory video (unlimiteddata) 7.1 / 9.0. This is a clear step up from round 1, but still not above the last posted Delta Short.

## SAFE-EDIT checklist
- **Footage over 5 s or unannotated: pass.** There are 3 uses: house 3.15 s from 1.55 s of source, roof 1.73 s, and roof again 2.32 s from 1.55 s of source with a freeze. All are muted and credited CLIP · ROCKSTAR GAMES · TRAILER 2. Footage is 25 % of runtime, and there is never more than 5 s of footage without our graphics in between. The annotations are weak: the house shot has only the hook text, and the first roof use has only an arrow.
- **Rumor stated as fact: pass.** THEORY and UNCONFIRMED are on screen, and the ending asks "joke or coincidence?".
- **Leak or ending shown: pass.** The leak is shown only as our own tiles.
- **Trailer or radio music: pass.** The mix is voice and SFX only, per mix.log and film.js.
- **Number without a source: pass.** The 90 is sourced as reporting, and NOV 19 is now a facts row (5a), used in the description only.
- **Rule 6 (GTA 6 in the title and in the first spoken second): pass.**
- **Clip reuse:** the roof range (source 11.47-13.6 s) is used twice in this film. That is allowed within one film and lint is OK. No other film may now use Trailer 2 at 8.15-9.74 s or 11.47-13.6 s.

## Fact check
| Claim | Where | Verdict |
|---|---|---|
| "GTA 6 Trailer 2 opens with a line about leaks." / OPENS WITH A LINE ABOUT LEAKS | 0.2 s voice, 0.5-4.9 s screen | OK, literal (fact 2: it is the first dialogue, at about 9.5-12.9 s of the post). |
| "Jason is up on a roof. A man below asks what he's doing up there." | 3.25-7.5 s | OK (fact 2). |
| Speech bubble "WHAT YOU DOING UP THERE?" | 5.5-7.5 s | **Small mismatch.** Fact 2 transcribes the line as "What are you doing up there?". The script's "about" says "What you doing up there?". A quote in quote marks has to match the transcript. Re-listen and fix either the bubble or the fact row. |
| Voice "I'm just fixing some leaks." / card "JUST FIXING SOME LEAKS." | 8.75-10.9 s | **Small mismatch.** The fact table and the card have no "I'm". If Jason says "Just fixing some leaks", the narrator adds a word to a quote. Make the voice and the card match the transcript. |
| Quote on the shot where it is spoken | 8.63-10.95 s, roof source 0.25-1.8 s = trailer 11.72-13.27 s | OK, covers 11.76-12.9 s. |
| "about 90 videos" + ABOUT 90 VIDEOS · PER REPORTS | 11.1-16.5 s | OK, presented as reporting. |
| "Rockstar confirmed it was their early footage." + quote card ROCKSTAR · SEPT 19, 2022, CONFIRMED | 16.6-19 s | OK (fact 4). The stamp is on the quote, not on the grid. |
| "Then in 2023, Trailer 1 leaked before its premiere." + ROCKSTAR: "OUR TRAILER HAS LEAKED", PREMIERE · DEC 2023 | 19.2-22.5 s | OK (fact 5). |
| "Rockstar never said the roof line is a joke." + UNCONFIRMED, THEORY | 22.75-25 s | OK (fact 6). |

## Round-1 fixes: are they really done?
1. **Factual hook: done.**
2. **Frame 0 with 5 words or fewer: done (2 words).** Circle on the roof from frame 0: **not done**. Hook slam at 0.5 s: done for line 1, but ABOUT LEAKS comes at about 2.3 s.
3. **Quote on the right shot: done** (now verified against the transcript times).
4. **90 scoped, CONFIRMED moved: done.**
5. **Rail and safe zone: mostly done.** Captions are at y 476 and the card is inside x 93-925. **Two breaches remain:** the T1 quote pill at x 45-974 (21 s) and CONFIRMED at x 962 (17.8 s).
6. **Fade removed: done.** The top-left GTA 6 pill is still on the end card next to YOUR CALL. That is minor.
7. **Empty stage: done.**
8. **WOW (drips become tiles): partly done.** Drips fall from the card and tiles drop in, but there is no drip SFX and the drop does not visibly read as "the drip becomes a video".
9. **Pause before the quote: done.**
10. **Redraw in the trailer's colours, OUR DRAWING, man below: done.** The man below is barely visible.
11. **Docs: done.**

## Fixes, ranked by impact
1. **Cover (poster.jpg), Shareability.** Now: half a caption (WHY DOES THAT) and the quote card on an empty field, with no footage. Re-export the cover at about 10.2 s, the roof freeze plus the full JUST FIXING SOME LEAKS. card, with no mid-sentence caption (hide the caption on the cover frame). This is the thumbnail on the Shorts shelf and the channel grid, and seo.md already promises it.
2. **17.8 s and 19.2-22.5 s, Craft: the last two rail breaches.** Cap the ROCKSTAR: "OUR TRAILER HAS LEAKED" pill at 820 px wide, inside x 130-910. Drop it to 30 px mono or split it into two lines. Pull the CONFIRMED stamp in, so its rotated box ends at x 910 or less (shift it 60 px left or scale it to 0.9). Pixel-scan every frame for anything bright outside x 90-930 before re-render.
3. **5.5-10.9 s, Truth: make both quotes verbatim.** Re-run faster-whisper on Trailer 2 9.5-12.9 s and listen. Set the bubble to the exact words ("WHAT ARE YOU DOING UP THERE?" if the fact row is right). Make the voice and the card agree on "I'm" or no "I'm". The fact table, the bubble, the card, the VO and seo.md (which says "Just fixing some leaks") must all say the same thing.
4. **0.0-2.0 s, Hook: put the question on frame 0 and the key phrase before 2 s.** Draw a pink circle around the tiny figure on the roof of the house shot, stroked on over 0.0-0.4 s, with a small "?" tag. Land ABOUT LEAKS at 1.2-1.5 s, not about 2.3 s, so the search phrase is readable by 2 s. As it stands, the stranger sees a nice house and has no reason to look at the roof.
5. **3.15-4.88 s, Craft and SAFE-EDIT annotation: label the roof clip properly.** Clear the hook text off the roof shot by 3.4 s (it covers the top third of Jason's shot). Add the JASON · ON THE ROOF chip inside the card (right edge at x 900 or less), and point the arrow at Jason, not at the roof edge. Every excerpt must read as evidence, and this one currently reads as leftover hook.
6. **WOW, 10.9-13.5 s: make the drip into a video leak literal and audible.** Let the 3-6 teal drips from LEAKS fall into the grid area. Each one splashes into a tile with a pitched drip blip (about 1.2 kHz, 60 ms, -10 dB under the voice), speeding up into the ratchet until the counter hits 90. Water leaks become video leaks in one continuous move. That is the shot worth sending to a friend, and it is the only real idea the film has beyond the quote.
7. **8.6-10.95 s, Clarity: rename JASON · SAME SHOT.** Use JASON · THE LINE · TRAILER 2 (0:12), or just 0:12. Viewers don't know what "same" refers to. A timestamp is also a credibility cue.
8. **Whole film, Craft: the footage is a small window.** Make the clip card 840 x 1000 (16:19) instead of 830 x 830, and bleed a blurred, darkened copy of the same frame behind it across the full stage (LESSONS gta-kalaga r2). Right now 70 % of the screen during the footage beats is stripe pattern.
9. **25.5-29 s, Loop: build the loop.** End the voice on a line that leads back into the start, for example: "...One word. And watch the opening again." Hard-cut the last frame to the first house frame's composition (the drawn house already sits where the clip house is). Drop the top-left GTA 6 pill on the end card. Give ONE WORD BELOW its own band under the house (y 1300-1400), not over the drawing.
10. **5.0-7.6 s, Retention: animate the man below.** Grow his silhouette to about 140 px, place it inside x 120 or more, and pop the bubble up from him on "asks". Hit the bubble with a small swish at 5.4 s. This 2.6 s stretch is the slowest of the film.

## What looks generic or AI-made
- The diagonal-stripe navy field with the GTA 6 pill is the same frame as every Delta Short, and with the footage in a small framed square it reads as a template.
- The pink "LEAKED!" video-player card for Trailer 1 is a stock infographic shape.
- The single-word pop captions at the top are standard auto-caption style. Now they are in the right place, at least.
- In its favour: the real Rockstar footage, the freeze with the quote, the THEORY stamp and the house redrawn in the trailer's teal all look made by hand, not AI.
