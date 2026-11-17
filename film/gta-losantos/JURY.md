# gta-losantos, jury round 1 (fresh eyes, 2026-11-17)

Film: `/mnt/project-files/factory/gta-losantos/gta-losantos-vo.mp4` (1080x1920, 30 fps, 39.3 s) and `gta-losantos-vo-upload.mp4` (39.317 s, same cut). Poster: `/mnt/project-files/factory/gta-losantos/poster.jpg`.

How I judged it: `out/check/sheet.jpg` (1 fps), full frames at 0.0, 1.0, 2.0, 2.5, 4.5, 7.6, 12.0, 15.0, 17.2, 21.6, 26.9, 28.0, 30.5, 33.0, 36.5 and 39.25 s, the poster, `out/pace.txt`, ebur128 and blackdetect on the upload file, my own **unhinted** faster-whisper (base.en) pass on the final mix, pause-hit peaks measured on the mix against voice-only, `out/events.json`, the SFX gate and SCORE in `film.js`, BRIEF.md, TREATMENT.md, seo.md, `vo/script.json`, LESSONS.md, and the gta-outsold juries (last Delta film: 7.8 / Truth 9.0 in round 2).

## Scores
| Axis | Score | Why |
|---|---|---|
| Hook | 6.0 | Frame 0 is `IS THE GTA 5 CITY REAL?` (6 words) over an orange vellum mid-slide on a cobalt skyline. GTA is on screen at 0.0 s and spoken by 0.46 s; motion is 0.81 over 0–1 s and 0.58 over 0–3 s. It meets the channel's ≤ 6-word rule, but the jury rubric caps Hook at 6 for more than 5 words on frame 0 (LESSONS 152 asks for ≤ 4). As a still, frame 0 is a thin-line skyline with palm trees and a sun inside a dark-framed box. It reads as a generic "LA" clip-art doodle, with nothing on it a GTA player would recognise. |
| Retention | 6.5 | Pace is OK (no frozen stretch, median motion 0.49). The sheet changes every 3–4 s. But all 39 s are the same centred box (x 100–925, y 560–1425) under a caption strip, so the frame never changes layout. 21.0–22.4 s is a near-empty sheet with one `LOS SANTOS` tag (`EVEN THE NAME:`). 32.0–35.6 s, the GTA 6 detour, is a dead end at the point where viewers decide to leave: palms and a sunset with no link back to Los Santos. |
| Clarity | 7.5 | A 14-year-old gets "Los Santos is a remixed L.A., but not a copy". Sign, pier and name are each one read. Minus: the GTA 6 line is a non sequitur in a Los Santos film. "Which first?" doesn't say first for what (visit? find?). The quote strip `"WE USE IT AS A STARTING POINT"` doesn't say what "it" is. |
| **Truth** | **8.0** | Every spoken line matches BRIEF's sources (table below), and the voice credits the L.A. link correctly. The picture doesn't: **3.1–7.5 s, `ROCKSTAR NORTH, ON GTA V` and Rockstar's "re-imagined, present day Southern California" quote sit on the same sheet as the taped `REAL · LOS ANGELES` / `GAME · LOS SANTOS` tags.** With the sound off, that reads as Rockstar North saying Los Santos is Los Angeles, which is exactly the link the brief says Rockstar never makes (same failure as gta-gators r2: a quote read against the wrong thing). Smaller: "GTA 6 is set in Vice City, Leonida" narrows Rockstar's framing (the state of Leonida, "Vice City and beyond") to one city. |
| Motion and design craft | 6.0 | The cutting mat, register pins, vellum and taped tags are a real step away from the plum-wall stage. The vellum slide, the off-register `NOT A COPY` and the halos are good ideas. **Docked a full point for repeating the old template**, which the caller lists as banned: **palm trees and a sun on frame 0 and in the loop frame, and palms plus a rayed sunset for the whole GTA 6 beat (32–35.6 s)**. That last picture also sits close to GTA VI's own sunset-and-palms imagery. Also: one hard 820 px box on flat ground in every frame, which reads as a small window (LESSONS 288, gta-kalaga r2). The impact-ring spokes cross `GARBUT · BUZZFEED 2013` and the owner chip at 12–13 s. The caption at 32–35.6 s breaks `VICE / CITY` across lines (LESSONS 146). The empty band at y 0–300 holds nothing. |
| Voice and sound | 6.5 | Ming is clean and paced well. −14.0 LUFS, true peak −2.6 dBTP, no black frames, no music. The pause hits measure −8.4 (stamp), −8.9 (counter thock), −10.9/−11.3 (pins), −12.3 (swish), −12.7 (snap), −13.8 (slap) and −16.6 (print thock) dBFS against voice peaks of about −2.7, so the ≥ 3 dB rule holds. Minus: the native move (the vellum registering onto the pins) has no `click` event at all. It gets only `tick`s at −20 dB, mostly between words, while TREATMENT promised a click per register. Most hits sit 9–14 dB under the voice, which is the faint zone outsold r2 was docked for. **Vinewood risk:** my unhinted Whisper pass hears "**Veenwood**" both times (15.9 s, 35.8 s) and "Del **Pero**". The director's check passed only with name hints. Check it by ear: a GTA audience will comment on a wrong "Vinewood". |
| Loop and ending | 7.5 | The last frame (39.25 s) is frame 0 with the vellum mid-slide, so the loop is seamless, and SIGN / PIER are identical chips. "Which first?" is weaker than a real question that leads back into "Is the GTA 5 city real?". |
| Shareability | 7.0 | The poster `LOS SANTOS = THE SAINTS / LOS ANGELES = THE ANGELS · SPANISH · VIA EDGE MAGAZINE` is clean and sendable. But many GTA fans already know the saints/angels pun, so it gets a nod, not a "wait, what". The film never shows the one thing people want to send: the game sign and the real sign laid over each other at the same scale. |

**Overall: 6.8** (55.0 / 8 = 6.875, not rounded up). The last Delta film, gta-outsold, scored 7.8 / Truth 9.0 in round 2. This first cut is below it on picture and sound, and level on the voice script.

## Verdict: **don't post. Gate FAIL** (overall 6.8 < 7.0, Truth 8.0 < 8.5)
Truth fails on one picture fault, and fix 1 corrects it mechanically. Overall needs fixes 1–4 to clear 7.0. After those, I'd expect about 7.3 / Truth 9.0.

## Caller checklist
| Rule | Result |
|---|---|
| No Rockstar footage, logo or key art | OK. Everything is drawn in our own type. Watch the GTA 6 palms-and-sunset sheet (fix 3). |
| No music; never "AI" | OK. No music bed; "AI" appears nowhere in script, captions or seo.md. |
| Every fact sourced, rumors labeled | OK in the voice. No rumors used. |
| L.A. link credited correctly | **FAIL in the picture** at 3.1–7.5 s (REAL LOS ANGELES tag under the Rockstar North chip). OK in the voice: "Rockstar … Southern California", then "Its art director says … all of L.A." |
| Frame 0 ≤ 6 words, GTA early | 6 words; GTA at 0.0 s on screen and 0.46 s spoken. Passes the channel rule but hits the rubric's Hook cap. |
| 1080x1920, 25–40 s | OK: 39.3 s (the upload file is 39.317 s). That's at the edge; trimming 2–3 s would help. |
| True after Nov 19 2026 | OK. No "coming", "isn't out yet" or countdown. "GTA 6 is set in" is present tense and stays true. |
| Counters in round units | OK. 0 → 250,000+ in 10,000 steps (frame 11.5 s shows `210,000`). |
| SFX ≥ 3 dB under the voice | OK (−8.4 dBFS loudest pause hit against about −2.7 voice). |
| Not the old template | **Partly FAIL**: no plum wall, kraft floor, towers or covered "?", but palms and a sun/sunset on frame 0, the loop frame and the GTA 6 beat. |

## Fact check (spoken lines, unhinted Whisper on the mix)
| Time | Heard | Source | Verdict |
|---|---|---|---|
| 0.00 | "Is the GTA 5 city real?" | — | Question, OK. |
| 2.90 | "Rockstar sets it in a reimagined Southern California." | Rockstar North GTA V page | OK, Rockstar's own words. |
| 6.66 | "Its art director says it takes in all of LA." | Garbut, BuzzFeed 2013 ("incorporates all of Los Angeles") | OK. Fair paraphrase, credited to the art director. |
| 10.20 | "His team shot over 250,000 images." | Garbut, BuzzFeed ("We've shot over 250,000 images") | OK. |
| 14.24 | "The Hollywood sign? Now it says Vinewood." | Edge/GamesRadar+ ("Hollywood and its signage transmogrify into Vinewood") | OK. |
| 17.52 | "Santa Monica's pier? That's Del Perro Pier." | Edge ("homage to Santa Monica's pier") | OK. On screen as `EDGE: "AN HOMAGE"`. |
| 20.78 | "Even the name: Santos means saints, Angeles means angels." | Edge | OK. |
| 26.30 | "But it's not a copy." | Edge ("isn't an exact recreation") | OK. |
| 28.48 | "Rockstar's art director calls the real city a starting point." | Garbut to Edge, 2014 | OK. |
| 32.06 | "GTA 6 is set in Vice City, Leonida." | rockstargames.com/VI | Narrow. Rockstar's framing is the state of Leonida, "Vice City and beyond". Not false, but it implies the whole game is one city. |
| 35.76 | "Vinewood sign or Del Perro Pier: which first?" | — | Question, OK. Heard as "Veenwood … Del Pero". |

## Fixes, ranked by impact
1. **3.1–7.5 s: take L.A. off Rockstar's sheet (Truth blocker).** Peel the `REAL · LOS ANGELES` / `GAME · LOS SANTOS` tags off under the wipe at about 3.0 s, before the `ROCKSTAR NORTH, ON GTA V` strip lands. On the socal sheet the only labels are `REAL · SOUTHERN CALIFORNIA` and Rockstar's quote. Bring `LOS ANGELES` back only at 6.6 s, on "Its art director says", taped under Garbut's strip and his `AARON GARBUT · BUZZFEED 2013` chip. Then re-check every frame from 2.8 to 9.3 s: on no frame may "Los Angeles" share a sheet with a Rockstar North chip.
2. **32.0–35.6 s: cut the GTA 6 beat and its palms and sunset (Craft, Retention, Clarity, Truth).** The beat is a dead end, it uses the banned palm/sunset look, and its wording narrows Rockstar's Leonida. Delete the `gta6` line. Give the 3.9 s to fix 4 and to a 1.0 s hold on the off-register `NOT A COPY` sheet, and land the film at about 36–37 s. If a GTA 6 tie-in has to stay, make it the end question instead ("Will Vice City be next?"), with no palms and no sun, and say "Leonida".
3. **0.0–2.5 s and the loop frame: replace the palms-and-sun skyline (Hook, Craft).** Draw something only Los Angeles has, without palms or a sun: the hillside block letters, cobalt `HOLLYWOOD`, with the orange `VINEWOOD` vellum mid-slide over them at frame 0. That is the film's best image, it's instantly "GTA" to a player, and it's an answerable "real?" test. Scale the hero to ≥ 900 px wide by letting the sheet bleed past the table edges (props still inside x 90–930). Cut frame 0 to 5 words: `IS GTA 5'S CITY REAL?` on screen, even though the voice keeps "the GTA 5 city".
4. **Wow: an overlay that shows "not a copy" with the sound off (Share, Retention).** On "But it's not a copy" (26.3–28.4 s), don't just tilt the vellum. Slide the Vinewood vellum back over the real Hollywood letters at the same scale, register both pins, and let the mismatch show: different word, different letter heights, a different hill. Then stamp `NOT A COPY` in the 0.4 s pause. Then the pier vellum over the real pier, with the wheel moved. One overlay per 0.8 s gives the "spot the difference" frame people screenshot, and a second poster.
5. **Whole film: give the native move a sound (Voice/sound, repeats gta-vicecity r1 / outsold r2).** Add a `click` event (TYPE_DB about −10.5) on every vellum register: 2.0, 4.9, 14.8, 18.1 s and the off-register thud at 27.4 s. Write the 0.3–0.5 s pauses for them into `vo/script.json` before re-voicing, so the VAD gate can keep them. Lift the print thock (−16.6) and slap (−13.8) to about −10 dBFS peak, still ≥ 3 dB under the voice: lower `duck.smr_db` from 28 to about 24 rather than raising single hits.
6. **15.9 s and 35.8 s: check "Vinewood" by ear.** Unhinted Whisper hears "Veenwood" twice and "Del Pero". If Ming really says "veen", re-voice with `say: "Vine wood"` and `say: "Dell Perro"`, then re-run the in-mix check without name hints.
7. **21.0–22.4 s: the empty name sheet.** `LOS SANTOS` sits alone on a blank sheet for 1.4 s. Start `LOS ANGELES` as a ghosted cobalt outline in its slot from 21.0 s, and draw the halo over `SANTOS` on "name" (21.4 s), so something lands every ≤ 1.2 s.
8. **Every beat: break the single box.** For at least two beats in the middle third (sign 14–17.4 s, name 21–26 s), push the camera in to about 1.15×, so the sheet bleeds off the top and bottom of the table and the dark frame leaves the shot. Keep all type inside x 90–930 and above y 1450, and pixel-scan the render.
9. **12.0–13.2 s: the impact-ring spokes cross `GARBUT · BUZZFEED 2013` and the owner chip.** Clip the ring to the counter card, or end it 0.2 s before the owner chip shows.
10. **38.1 s: make the end question complete.** "Which first?" becomes "Which would you visit first?" (caption `WHICH WOULD YOU VISIT FIRST?`, keeping SIGN / PIER identical). It matches the pinned comment.

## Packaging (seo.md)
- Title `Is GTA 5's City Real? The L.A. Proof 🌴`: "The L.A. Proof" oversells a film whose turn is "not a copy", and the palm emoji is the old template again. Better: `Is GTA 5's City Real? Rockstar's Art Director Answers`, or `GTA 5's Los Santos vs Real L.A.`
- Cover `LOS SANTOS = THE SAINTS`: good, and it matches the poster.
- The description says "Sign or pier" while the film says "Vinewood sign or Del Perro Pier". Align them. Sources and the not-affiliated line are good. There's no "AI" anywhere.

## Looks generic / AI-made?
The light table, register pins and taped tags read as hand-made. The thin uniform-stroke line drawings (skyline, palms, sunrays) are the weakest part: they look like stock vector line icons, especially the frame-0 skyline and the GTA 6 sunset. Give the strokes some weight variation and paper texture, or replace those two drawings (fixes 2–3).
