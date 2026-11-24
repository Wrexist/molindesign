# Jury r2: gta-cast ("GTA 6: Who do you trust?")

Fresh-eyes jury, round 2, 2026-11-24. I did not make this film or write round 1. I scored the current render (`out/gta-cast-vo.mp4`, 27.37 s, 1080×1920, 30 fps) on my own and read `jury-r1.md` only after scoring. I checked it against `.claude/agents/video-jury.md`, the SAFE-EDIT jury checklist and the launch-week frame-0 rule in `delta/RUN.md`.

**Verdict: PASS the gate, fix then post.** Overall **7.2**, Truth **9.0**. The gate is 7.0+ and Truth 8.5+. Under 8.0, so the video-jury verdict is "fix then post", not "post".

## What I checked
- **Frames:** `out/check/sheet.jpg`, `hook.jpg`, and my own ffmpeg grabs at 0.0, 1.0, 1.6, 2.0, 2.5, 4.0, 5.3, 6.0, 7.9, 9.0, 11.0, 12.0, 13.2, 14.0, 15.5, 16.2, 17.0, 18.5, 20.0, 20.9, 22.5, 24.0, 25.2, 25.5, 26.9 and 27.1 s.
- **Audio:** my own faster-whisper transcription of the final mix with two models (base.en and small.en). ebur128: −13.9 LUFS integrated, −2.6 dBTP true peak, LRA 2.6. blackdetect found no black frames.
- **Pace:** `pace.txt` OK. Motion over 0–1 s is 0.904 and over 0–3 s is 1.104, with no frozen stretches. The length is 27.4 s, inside 20–30 s.
- **Clips:** `clips.json` and `out/clips-used.json`. Every foreground use is 1.3 s, the ballot is 3.0 s and the plates run 1.1–2.4 s, so all are under 5 s. Each sits in a labeled card (`CLIP · ROCKSTAR · …`). The lint figures I was given are Rockstar footage 49 % (cap 50 %) and real footage on screen 65 % (cap 85 %). Creator clips: none.
- **Truth:** on 2026-11-24 I fetched all 8 pages at `rockstargames.com/VI/only-in-leonida/<name>` with curl. The bios are in the server-rendered HTML.

## SAFE-EDIT jury checklist
| Check | Result |
|---|---|
| Footage we don't own over 5 s unannotated | None. The longest use is the 3.0 s ballot of 8 tiny face tiles. Every card clip is 1.3 s and labeled. |
| Rumor stated as fact | None. Every line is Rockstar's bio text. |
| Leak or ending shown | None. There is no plot past the bios. |
| Trailer or radio music audible | None. The clips are muted (`film.js` line 8), and Whisper hears only the voice over the procedural score, with no lyrics or trailer bed. |
| Number without a source | None. The 1–8 card numbers follow Rockstar's People menu order, which I checked on /VI. |
| Rockstar logo or key art | None in any frame I pulled. The plate ranges (Out Now 2.2–4.6, 11.0–12.8, 18.0–18.9 and 19.0–20.6) avoid the console, logo and PRE-LOAD ranges in BRIEF §5, and the Extended Look key art isn't used. |
| **Frame-0 rule** | **Pass.** Frame 0 is `WHO DO YOU TRUST?` (4 words) with a `GTA 6` chip above it, readable with the sound off, over a dimmed street plate. The `GTA 6 CHARACTERS` chip is up by 1.0 s. Card 1 shows Jason's face, the `1` tile and `JASON DUVAL` by 1.6 s, and it is still there at 2.0 s. No cap. |
| Real Dimez as a duo | Pass. The voice says "two friends", the card subline says `BAE-LUXE & ROXY`, and the ballot tile says `REAL DIMEZ / BAE-LUXE & ROXY`. "8 faces" and "8 people" never appear. The weak spot is that the card's subline is small (about 24 px) and the clip crop puts one woman center frame, with the second only at the left edge (fix 4). |
| Dre'Quan intelligibility | Borderline. A cold Whisper hears "**Trehuan's** more hustler…" (base.en) and "**Dre Juan's** more hustler…" (small.en). r1's "Dre wants" is gone and the name now reads as a name, but not cleanly as "Dre'Quan". The caption carries the spelling. |

## Truth audit
| Card | Rockstar (curl, 2026-11-24) | Film | Judgment |
|---|---|---|---|
| Jason | "Jason wants an easy life, but things just keep getting harder." | "Jason wants an easy life. It just gets harder." | Faithful. |
| Lucia | "Lucia's father taught her to fight as soon as she could walk." | "Lucia learned to fight as soon as she could walk." | Faithful. |
| Cal | "…hanging at home, snooping on Coast Guard comms…" | "Cal snoops on the Coast Guard from home." | Faithful. |
| Boobie | "…all smiles until it's time to talk business." | "Boobie's all smiles, until it's business." | Faithful. |
| Dre'Quan | "…always more of a hustler than a gangster." | "Dre'Quan's more hustler than gangster." | Faithful. The spelling matches Rockstar's (`Dre'Quan Priest`). |
| Real Dimez | "Bae-Luxe and Roxy aka Real Dimez have been friends since high school…" and "Viral hooks." | "Real Dimez: two friends, viral hooks." plus `BAE-LUXE & ROXY` | Faithful. The duo is named. |
| Raul | "…a seasoned bank robber always on the hunt for talent…" | "Raul's a bank robber, hunting talent." | Faithful compression. |
| Brian | "…let others do his dirty work." and "…with his third wife, Lori…" | "He lets others do his dirty work." and the sticker `…WITH HIS THIRD WIFE, LORI` | Faithful, an exact quote with the ellipsis. |

The People menu order matches the cards. There are no role words Rockstar doesn't use. BRIEF.md's r2 log records how the Jason (Extended Look 182.65 s) and Lucia (209.1 s) ranges were matched to the characters, and my frames agree: a single Jason close-up, and Lucia's half of the two-shot.

**Small Truth deductions (−1.0 total from 10):**
- −0.5: `ROCKSTARGAMES.COM/VI` is stamped in the top-right corner of our own drawn icon panels (for example Jason's "EASY LIFE" stairs, 2.5–4.5 s). It credits the quote, but placed on a drawing it reads as if the drawing were Rockstar's material.
- −0.5: during every deal (for example 7.9, 13.2, 15.5, 18.5 and 20.9 s), the next person's live face sits for about 0.3–0.4 s under a `?` tile. Meanwhile the rail still lights the previous number, and the previous card's name bar is half visible beside it (`LU…` next to Cal, `RA…` next to Brian). This lasts only an instant, but for those frames the face and the label disagree.

**Truth: 9.0.**

## Scores
| Dimension | Score | Why |
|---|---|---|
| Hook | **7.0** | It passes the frame-0 rule cleanly, and GTA 6 is spoken in the first second. Motion over 0–3 s is strong. But frame 0 as a still is still a text board over a plate so dark it barely reads as the game, and "who do you trust?" has no stakes until you know the people. It is a competent hook, not a scroll-stopper. |
| Retention | **6.5** | There is a change every 1.3–1.5 s and no dead stretch. But it is the same beat eight times: the card deals, the face plays for 1.3 s, a flat icon replaces it, then the next card. The 13.5 s rail pulse is too small to read as a re-hook. "And Brian?" at 21 s is the only real turn. |
| Clarity | **7.5** | One idea, one read at a time, and the captions are big. The end ballot of faces finally ties names to faces. But on each card the face is gone after 1.3 s, and for the rest of the line the viewer looks at a boxing glove or a vault, not the person. |
| Truth | **9.0** | Every quote and paraphrase is faithful. −1.0 for the two picture-label issues above. |
| Motion and design craft | **6.5** | The flap board, coral number tiles and ink cards are specific and well made, and the layout stays in the safe zones (content sits between y≈300 and 1400). The icon set (stairs chart, boxing glove, radio scanner, playing card with a smiley, vinyl record, two phones, vault, sunset boat) reads as generic flat clip art and fills about 60 % of each card's time. The clip-to-icon crossfade double-exposes (9.0 s shows Cal's face ghosted through the scanner). On the ballot, `REAL DIMEZ` touches its tile's right edge, and the Lori sticker overlaps the Raul and Brian tiles. |
| Voice and sound | **7.0** | It is clean and on pace: 10 lines in 26 s, no gap after 0.2 s and no music bed. The loudness is right. Dre'Quan is still misheard by both cold models. small.en hears "Ral's" for Raul, and base.en hears "Coast Guard? From home." (the comma in `say` adds a questioning lift). |
| Loop and ending | **8.0** | "So who do you trust? Drop the number." goes back to the frame-0 board at 26.9 s, and the last frame matches frame 0. It is a clean loop. |
| Shareability | **6.5** | "Drop the number" invites comments. The Lori sticker is the right DM line, but it is fine print (about 22 px) riding the ballot for under 3 s, so nobody will screenshot it. |

**Overall: (7.0 + 6.5 + 7.5 + 9.0 + 6.5 + 7.0 + 8.0 + 6.5) / 8 = 58.0 / 8 = 7.25, scored 7.2** (never rounded up).

**Gate: PASS** (7.2 ≥ 7.0, Truth 9.0 ≥ 8.5). Verdict: **fix then post.**

## Fixes, ranked by impact
1. **Keep the face on every card (2.4–23 s, all 8 cards). This is a wow fix.** At about 1.3 s into each card, the live clip crossfades into a flat icon (a glove, vault or phones), so for about 60 % of each line the viewer sees clip art instead of the person.
   - Hold the clip's last frame as the card image, with a slow 1.00→1.06 push, and drop the icon panels.
   - Or shrink the icon to a 160 px corner badge over the held face.
   - This adds no footage seconds if the frozen frame is counted as a still. Re-run the lint: if a hold counts as footage, trim Jason and Lucia to 1.0 s live each to stay at or under 50 %.
   - This one change lifts Clarity, Craft and Retention together.
2. **Brian payoff, 21.0–23.8 s. This is a wow fix too.** "He lets others do his dirty work" lands on a flat sunset-and-boat icon, and the Lori line only appears later as fine print.
   - Pop `…WITH HIS THIRD WIFE, LORI` on Brian's own card at 22.6 s ("dirty work"), at 44 px or larger, cream on coral, with a 1.08× slam.
   - Hold it 1.2 s with Brian's face behind it.
   - That gives a screenshot moment, and it is Rockstar's exact text.
3. **Clean the deal hand-off (7.9, 10.6, 13.2, 15.5, 18.5 and 20.9 s; Truth).** The next face plays under `?` for 0.3–0.4 s while the rail still lights the previous number and the old name bar is half visible.
   - Flip the number tile and advance the rail on the first frame the new face is visible, or start the clip 0.3 s later so the face and number arrive together.
   - Hide the outgoing name bar before the incoming card overlaps it.
4. **Real Dimez, 15.4–18.4 s (duo).** The `BAE-LUXE & ROXY` subline is about 24 px gold on ink and hard to read on a phone. The crop centers one woman.
   - Raise the subline to 34 px or larger, cream.
   - Reframe the crop (focus x about 0.40) so both women are in the card.
   - On the ballot, shrink `REAL DIMEZ` to fit its tile with an 8 px margin. It currently touches the right edge.
5. **Dre'Quan and Raul pronunciation, 13.5 s and 18.75 s.** Cold Whisper hears "Trehuan's" or "Dre Juan's", and "Ral's".
   - Try `say` "Dray-kwahn. More hustler than gangster." Ming leaves a gap after a bare name, which here helps the name land.
   - For Raul, try "Rah-ool's a bank robber".
   - Keep the check passing on both base.en and small.en, not only in context.
6. **Cal prosody, 8.2 s.** The comma in `say` ("Coast Guard, from home.") reads as a question ("Coast Guard? From home."). Drop the comma, or try "Cal snoops on the Coast Guard. From his couch." only if the bio supports it. It does: "hanging at home". Otherwise drop the comma.
7. **Frame 0 still, 0.0–1.0 s.** The street plate is so dim that the frame reads as a black title card.
   - Lift the plate to about 55 % brightness and move the board up 120 px so a lit Vice City street shows under it.
   - Or run the 8 rail tiles as tiny live face thumbnails, about 60 px, so frame 0 already shows people.
   - Keep the four words.
8. **Credit placement on drawn panels (2.5–4.5 s and every icon panel; Truth).** Move `ROCKSTARGAMES.COM/VI` off the drawings and into the caption strip as `ROCKSTAR'S WORDS`, or drop it from any panel that holds no Rockstar footage.
9. **Middle re-hook, about 13.5 s.** The rail pulse doesn't read.
   - Add one 4-word beat, `HALFWAY. PICKED ONE YET?`, for 0.6 s at 44 px or larger.
   - Or give card 5 a different entrance, for example a full flip.
10. **Clip-to-icon crossfade (9.0 s and similar).** If you keep icons, cut hard or wipe instead of dissolving. The 0.3 s double exposure looks muddy.

## Generic or AI-made tells
- The flat icon set (rising stairs with an arrow, boxing glove with motion lines, smiley card, vinyl, play-button phones, vault dial, sunset boat) is the clearest template tell. It reads as stock next to Rockstar footage.
- The flap board, coral tiles and ballot of faces are specific to this film. Keep them.

## After scoring: what landed from r1
I read `jury-r1.md` (6.7, Truth 8.5) only after scoring.
- **Landed:**
  - The frame-0 plate, the chip by 1.0 s and Jason named by 1.6 s (r1 fix 1). This removes the Hook cap.
  - The voice gap is closed.
  - Each card is dealt on its spoken name.
  - The captions peel before the next card. I saw no caption over the wrong person, so r1's −1 Truth repeat is gone.
  - The ballot is now eight face tiles (r1 fix 4).
  - The `BAE-LUXE & ROXY` subline is on the card (r1 fix 5), but it is small.
  - Dre'Quan is respelled (r1 fix 6), only partly successfully.
  - The Lori sticker is in (r1 fix 7), but as fine print on the ballot, not a card moment.
- **Not landed:**
  - r1 fix 2, the face held while the icon plays, is the biggest remaining gap and is my fix 1.
  - r1 fix 9's re-hook is only a rail pulse.
  - The quote strips were cut instead of replaced (r1 fix 8), which is fine.
- **Score movement:** 6.7 → 7.2, Truth 8.5 → 9.0.
