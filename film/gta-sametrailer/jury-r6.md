# Jury r6: gta-sametrailer (v6, from the jury-r5 fix list)

Judged 2026-11-20 on `out/gta-sametrailer-vo.mp4` (21.2 s, 1080x1920). I looked at sheet.jpg and poster.jpg, frames at 0.0 / 1.0 / 2.5 / 14.2 / 14.9 / 15.6 / 15.95 / 16.1 / 18.0 / 19.5 / 21.1 s, 10 fps strips of 12.4-13.8 s and 13.6-16.4 s, and contact sheets of the opening 13 s (GTA V) and 26 s (GTA VI) of both source trailers in /mnt/project-files/delta/sources/. I read script.json, BRIEF.md and its log, seo.md, clips.json, the GTA VI provenance.json, jury-r5.md, SAFE-EDIT rule 7 and LESSONS.md.

## Measurements (re-run)
- -14.0 LUFS, -2.6 dBTP, **LRA 1.6 LU** (r5 1.7). No black frames.
- 6/6 slam window (13.7-14.3 s): peak -2.7 dBFS, compared with -3.6 / -3.7 dBFS in voice-only stretches (2-4 s, 8-10 s). The "louder hit" is **about 1 dB over the voice peaks**. r5 asked for 3 dB and LRA of at least 4.
- pace.txt matches: 9 cuts, motion 0-1 s 0.697, 0-3 s 0.654, still 6.6 %, OK.
- Voice-only silences: the gap before the vote is now **0.61 s** (17.91-18.52 s; r5 1.05 s). Fixed.
- Listen check: all 10 lines wer 0.00.
- Provenance: the GTA VI source is uploader RockstarGames, channel_id 29758446, upload_date 20231205 (UTC), verdict OFFICIAL. The folder key (…653743517697) is the media id. The URL is the BRIEF's status …9328779571313. OK.

## What r5's fixes became
| r5 fix | Status |
|---|---|
| 1 Kill the ring scene, **put the 93 on footage** | **Half.** The empty stage is gone: 93M+ is there on the first frame after the replay (about 15.9 s), and VIEWS, IN 24 HOURS and the source chip build in over about 0.4 s. The rays and captions are gone. But the scene is still bare ink with a ghost VICE. The core of the fix was "hold the VINEWOOD/VICE plates and print the 93 over them", and that wasn't done. 15.9-21.0 s still has no trailer footage. |
| 2 Hold the hero 1.5 s, loudest slam 3 dB over, rising replay ticks, LRA ≥ 4 | **Not done.** The 6/6 MATCH! stamp is up from about 13.8 to 14.9 s (1.1 s). The slam is about 1 dB over the voice peaks. LRA is 1.6. |
| 3 Vote cards over their sunsets | **Not built** (footage cap). See the cost below. |
| 4 Views captions | Done. There's no caption under the 93. |
| 5 Freeze the counter during the replay | Done. It reads 6/6 throughout. |
| 6 Search phrase as one read by 1.5 s | **Not done.** "GTA 5" and "GTA 6" are still two pills on two plates. |
| 7 "First 4 in the same order" | **Not built.** See the cost below. |
| 8 Frame-0 still | Done. The lower plate is flush and only the top plate slides in. |
| 9 Water caption | Acceptable. It's now split by phrase ("SOMEONE TEARING" / "ACROSS THE WATER"). |
| 10 BRIEF log | Done. There are v5 and v6 entries. |

### What the skipped fixes cost
- **Fix 3 (vote over sunsets): about 0.19 overall.** It's worth about +0.5 each on Retention, Craft and Loop, and those three are what keep the film under 7. The footage cap isn't a real blocker. (a) SAFE-EDIT rule 7 explicitly allows "extending" shots with our own drawn graphics. A flat-style silhouette of the lifeguard tower and of the causeway in each plate's palette costs 0 % footage. (b) Or trim 0.2 s off each of the six pair clips. That frees about 1.2 s, about 6 % of runtime, which is enough for the last 1.2 s of the vote.
- **Fix 7 (order line): about 0.06 overall**, by moving Truth from 8.5 to 9. "Can't be read in the hold time" is only true because the hold is still 1.1 s (fix 2 wasn't built either). With the 1.5 s hold, a 4-word 40 px line "FIRST 4: SAME ORDER" reads fine. Or say it: "The first four, in order." fits in the 0.61 s gap plus the 0.56 s gap at 14.53-15.08 s.
- Together with fix 2 (which also clears the LESSONS repeat below), these three are worth about +0.37. That's the gap between this film and the gate.

## Fact check
| Claim | Verdict |
|---|---|
| 2011 / 2023, "Twelve years apart" | OK (F1-F3). |
| "Both open on a sunset." | OK. GTA V: ESRB card 0-6 s, then the lifeguard tower at sunset. GTA VI: rating card 0-2 s, then the causeway at sunset. I checked both on the source contact sheets. |
| "Then the beach." | OK, but loose. GTA VI runs about 6 s of prison and Lucia shots (5-11 s) between the sunset and the aerial beach. GTA V's "beach" is the Del Perro pier boardwalk crowd. "Then" means "later", not "next", so this isn't false. It is also why the order caveat (fix 7) is worth showing. |
| ROCKSTAR GAMES PRESENTS over the skyline | OK. Both are visible in the sources (GTA V about 12 s, GTA VI about 15-17 s). |
| Water, cops, VINEWOOD / VICE | OK. The bodycam POLICE vest is readable. |
| "over 93 million views in a day" / 93M+ VIEWS IN 24 HOURS + SOURCE chip | OK (F4). |
| 6/6 MATCH! | This is our own framing. All six beats appear in both trailers. Nothing on screen claims they're in the same order. |
| seo.md "The first four even come in the same order." | True (BRIEF order check), but it's in the description only. |

**Truth 8.5.** Nothing is false. It's below 9 because the film shows six beats picked from 90 s without saying how many shots it skipped ("Then the beach" skips 6 s of prison footage), and the order caveat is still off screen.

## LESSONS repeats on this render (a full point each)
1. **Hero frame on screen under 3 s** (LESSONS 141, hallucinate r1; also 75). VINEWOOD/VICE is on screen as footage from 13.3 to 14.9 s, plus about 0.2 s at the end of the replay. That's about 1.8 s in total, and the 6/6 MATCH! stamp is up for 1.1 s. r5 flagged this (fix 2) and it wasn't fixed. → Shareability.

I don't count the empty stage again, since it's fixed.

## Other things I saw
- **12.4-13.3 s: the reveals don't land on their words.** For about 0.9 s the screen shows two typographic cards, VINEWOOD? / VICE?, on purple ink. Then both plates cut in together at about 13.3 s. That's 0.65 s **before** "Vice!" is spoken (13.96 s), so the voice's split ("Vinewood." beat "Vice!") isn't matched by the picture. VICE is already on screen when the voice says it, which spends the film's best reveal early.
- The VINEWOOD caption in the band (from about 13.0 s) sits over the VINEWOOD? text card, so the same word is on screen twice.
- The skyline captions are set at two sizes: "ROCKSTAR GAMES PRESENTS" (about 5.5-6.5 s) is visibly smaller than "OVER THE SKYLINE" (7.5 s).
- The replay is built from cross-dissolves (each 0.17 s tile ghosts into the next on the strip), not hard cuts. That softens the slot-machine feel the replay is meant to have.
- The bottom ~450 px are empty ink on every frame. This is deliberate (YouTube overlay), but along with the 0.9 s of text cards and the 5 s ink tail, the frame is mostly purple stripes for about a third of the runtime.

## Scores
| # | Criterion | Score | Why |
|---|---|---|---|
| 1 | Hook | 7.0 | Two sunsets moving from frame 0, 4 tokens, SAME TRAILER?, motion 0-3 s 0.654, and a 5-word spoken hook. Frame 0 is cleaner now (lower plate flush). It's held at 7 because "GTA 5 vs GTA 6" is still never one read by 2 s, and two orange sunsets look like every comparison thumbnail. |
| 2 | Retention | 7.0 | 0-15.9 s changes every 0.5-1 s and the replay re-hooks. 15.9-21.0 s is still about 5 s of ink: a number, then two vote pills, with no trailer. The voice gap is down to 0.6 s. 12.4-13.3 s is 0.9 s of text cards. |
| 3 | Clarity | 7.0 | One idea, and a 14-year-old gets it. The 93 scene now says it once, and the counter no longer resets. Small cost for the doubled VINEWOOD word and the mixed caption sizes. |
| 4 | Truth | 8.5 | See above. |
| 5 | Motion and design craft | 6.0 | The full-width plates, the clean chips and the poster frame are good. The ghost-word + big-number scene and the pill vote on ink are still stock Shorts infographic, the fourth round calling them out, and r5 fix 1 asked for footage under the 93. The reveals cut early, before their words. The replay dissolves instead of cutting. |
| 6 | Voice and sound | 6.5 | Hook first, no music, gaps fixed. Still a flat list read: LRA 1.6, and the 6/6 hit is about 1 dB over speech, so the payoff doesn't hit with sound on. |
| 7 | Loop and ending | 7.0 | The fly-back to the frame-0 sunsets under SAME TRAILER? is a clean seam, and "Which one wins?" → "Same trailer?" loops. It still lands from the most generic frame in the film (vote pills on ink). |
| 8 | Shareability | 6.0 | VINEWOOD over VICE with 6/6 MATCH! (the poster) is the frame people would send, but it's on screen for about 1.8 s and the stamp for 1.1 s. 7 - 1 for the LESSONS 141 repeat. |

**Overall: 6.8** (55.0 / 8 = 6.875, not rounded up; r5 wrote the same 6.875 as 6.9). Truth 8.5.

**Verdict: don't post** (below 7.0). r1 6.2 → r2 6.2 → r3 6.3 → r4 6.6 → r5 6.9 (6.875) → r6 6.8 (6.875). This is the same sum as r5. The gains (no empty stage, vote gap, frozen counter, flush frame 0) were cancelled by a LESSONS repeat r5 already flagged: the hero hold is still under 3 s. Previous Delta film gta-99: 7.4. This one is under it.

## Fixes, ranked by impact
1. **13.3-16.0 s: give the hero 3 s, and put the reveals on their words (Share +1, Craft, Sound).** Cut the VINEWOOD plate in on "Vinewood" (about 12.9 s) and the VICE plate on "Vice!" (13.96 s), not both at 13.3. Hold VINEWOOD/VICE with 6/6 MATCH! from 13.96 to 15.5 s (1.55 s), then run the replay (15.5-16.5 s, **hard cuts**, no dissolves), and land back on VINEWOOD/VICE. The pair is then on screen for about 3.4 s. Make the slam 3 dB over the "Vice!" peak (target -0.7 dBFS on the hit and -3.7 on the voice, checked with astats), with a 55 Hz sub plus a 2 kHz click. Give the replay six ticks, each a semitone higher. Target LRA ≥ 4 LU. Removes the LESSONS repeat.
2. **Wow: print the 93 over VICE, not ink (Retention, Craft).** After the replay, keep the VINEWOOD/VICE plates. Darken the VINEWOOD plate 40 % and punch the VICE plate 1.00 → 1.06x over 2.5 s. Print "93M+ VIEWS IN 24 H" at 120 px over the VICE plate, with the source chip under it, all there on the first frame. Drop the ghost VICE. Footage: this adds about 2.5 s. Pay for it by trimming 0.25 s off each of the 6 pair clips (1.5 s) and by holding the VICE plate on a frozen frame for the last 1.0 s. If lint still counts the frozen frame, swap the GTA V plate for a flat drawn VINEWOOD silhouette.
3. **18.5-21.0 s: vote over the sunsets (Loop, Craft; about +0.19).** The background is the two frame-0 sunset plates, already in their frame-0 positions. If footage is at the cap, use flat drawn silhouettes of the lifeguard tower and the causeway in the plates' gradients (own graphics, SAFE-EDIT rule 7 "extending"). Then the yellow GTA 5 · 2011 card sits on the top plate and the pink GTA 6 · 2023 card on the bottom one. The loop seam becomes an un-blur rather than a scene change.
4. **Order line (Truth 8.5 → 9).** Once the hold is 1.5 s (fix 1), add "FIRST 4: SAME ORDER" at a 40 px cap under 6/6 MATCH!. Or voice it, "The first four, in order.", in the 0.56 s gap after "Vice!", moving "Trailer one…" 0.5 s later.
5. **12.4-13.3 s: drop the VINEWOOD?/VICE? text cards (Retention, Clarity).** These are 0.9 s of words on ink, followed by the same word as a caption. Instead, run a 0.3 s whip from the cops plates straight into VINEWOOD footage on "Vinewood", and give the 0.9 s back to fix 1.
6. **Search phrase by 1.5 s (Hook).** At 1.0 s, set "GTA 5 vs GTA 6" at a 56 px cap in the band in place of SAME TRAILER? (which moves up as a small kicker), or merge the chips into "GTA 5 · 2011" / "GTA 6 · 2023" and drop the separate year pills. Frame 0 stays at 4 tokens.
7. **Caption sizes (Craft).** Set every band caption at one cap height (the "OVER THE SKYLINE" size). Split "ROCKSTAR GAMES / PRESENTS" over two beats instead of shrinking it.
8. **Replay cuts (Craft).** Use 0.17 s hard cuts with a 2-frame white flash on the first and last. The current dissolves read as ghosting on a phone.

## Generic / AI-made
- The ghost-word + giant yellow number + pill + teal source chip scene is a stock Shorts stat card, the fourth round to call it out.
- The yellow/pink stacked vote pills with "VS" on ink look like a Canva poll.
- The VINEWOOD?/VICE? question cards on flat purple are template filler.
- Not generic: the full-width paired Rockstar footage, the bodycam POLICE shot, VINEWOOD over VICE (the poster), and the 6-tile replay. As in r5, every gain has come from more footage and less chrome. Fixes 1-3 move the last 8 s that way.
