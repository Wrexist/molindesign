# Treatment: "GTA Was Almost Canceled" (Delta, gta-origin)

One hard idea: **the first GTA was almost canceled, and what turned it around was cops who suddenly tried to ram you off the road, which one of its developers (Gary Penn) thinks was a bug.** One hero object: the paper police car. One hero sound: the ram crunch.

## Benchmarks
| | Learn | Don't take |
|---|---|---|
| film/gta-longestwait (paper waiting room, both juries called it hand-made) | Paper pieces with grain and pale cut edges, torn newsprint quote strips, caption tape, the VAD-gated SFX in the pauses, `duck.smr_db` 22.5 so the hits are heard. | Its identical centred composition on every beat and its static wall: here the background itself moves (a scrolling paper city) and the hero changes side and size each beat. |
| film/gta-preload (jury r1 7.0) | One physical instrument the viewer reads at a glance; hits in written pauses. | The synthwave sunset, the empty kraft floor in the bottom 27 %, a title-card frame 0 with nothing threatening anything, and 0.8 s gaps with nothing moving. |

## Three structures
1. **Top-down chase on a paper city (chosen).** The 1997 game was played from above, so the whole film sits over a hand-cut paper city seen from above, with one road scrolling down the frame. Act 1 (the dying project) puts paper props over the moving city (game case, trash can, crash windows); Act 2 the camera drops onto the road where the paper cop car goes rogue, rams, and a paper beetle crawls out of its hood; Act 3 returns to the case and the calendar.
2. A development timeline 1995 → 1997 with milestone cards. Rejected: a list of cards is the dashboard look that held five Delta films.
3. A paper "project file" folder whose pages turn (memo, crash log, bug report). Rejected: all paper on a desk, nothing for the cop car to do, and the ram (the DM-able moment) would be a drawing of a drawing.

## Native move
The scrolling road. Its speed tells the story: calm cruising (hook), a stutter and freeze-jerk (crash), a spin-out (handling), a surge (crazy, ram), a slow push in (bug), cruise again (release, end). It is periodic in the film's length, so the loop is seamless.

## Rules this cut is built to pass
- Frame 0: `GTA WAS ALMOST CANCELED` (caption tape) + `GTA` on the case = 5 tokens; the CANCELED stamp drops in from 0.3 s (6 at most). The city scrolls ≥ 300 px in the first second; the stamp lands in the pause after "canceled".
- No Rockstar logo, key art, footage, sprites or box art. The case is a blank cream case with our own hand-lettered `GTA`; the cars are our own shapes, no real livery.
- Every quote is Penn's exact words with his credit on the same strip; "I think" always kept; nothing in a quote highlighted. The bug strip: `"I THINK IT WAS A BUG"` + `GARY PENN · DMA DESIGN · GAMASUTRA 2011`.
- Each quote strip peels off under the move that leaves its beat (LESSONS gta-gators r2).
- Release year only (1997), no day. No derived gap number.
- Hits only in voice pauses (`vo/vad.js`), every hit ≥ 3 dB under the voice, the ram crunch the loudest.

## Line → picture
| Line | Hero object | Picture | Sound |
|---|---|---|---|
| hook "GTA was almost canceled." | game case | Blank paper case (our `GTA`) over the scrolling city; pink CANCELED stamp swings down from the top and lands in the pause. | case slide; stamp |
| canned "The publisher wanted to scrap it." | trash can | A paper trash can slides in from the right, the case tips toward it; strip `"THE PUBLISHER, BMG INTERACTIVE, WANTED TO CAN IT…"` · GARY PENN · DMA DESIGN. | clank |
| why "So what saved it?" | question mark | The can gets kicked away, the case springs upright; a big orange `?` cut-out slams beside it. | pop |
| began "It began in 1995 as Race'n'Chase." | the two cars | The case flips away and the camera drops to the road: a cream robber car and the teal cop car cruise politely; `1995` calendar page; hand-lettered `RACE'N'CHASE` sign; chip `DESIGN DOC · MARCH 1995 · VIA MIKE DAILLY`. | swish; tear |
| crash "But it crashed all the time." | crash windows | The road stutters; three paper error windows `CRASH` stack one after another over the cars. | pops ×3 (pause) |
| handling "And the cars handled terribly." | spinning car | Windows fly off; the robber car spins out with pencil skid marks; strip `"THE CAR HANDLING WAS APPALLING"` · GARY PENN. | skid |
| crazy "Then one day, the cops went crazy." | cop car | `ONE DAY` card slams; the cop car's light bar flashes pink/teal, the road surges, the cop swerves toward the player. | siren blip |
| ram "They tried to ram you off the road." | collision | The cop car rams the player car toward the road edge; impact star; a second cop car joins. | crunch (hero) |
| bug "One developer thinks it was a bug." | paper beetle | Camera pushes in on the cop car; a paper beetle crawls out of its hood; strip `"I THINK IT WAS A BUG"` + `GARY PENN · DMA DESIGN · GAMASUTRA 2011`. | tick-crawl |
| stayed "He called it awesome. It stayed in." | KEEP note | A sticky note `KEEP` slaps on beside the bug; strip `"THAT WAS AWESOME, SO THAT STAYED IN."` · GARY PENN. | slap |
| release "GTA came out in 1997." | case + 1997 page | Page sweep; the case returns, the CANCELED stamp peels off; `1997` page, chip `FIRST RELEASE · PC · EUROPE`. | swish; peel |
| gta6 "GTA 6 lands November 19." | calendar | The page flips to `NOV 19 · 2026`; `GTA 6` pill; the cop car cruises past below. | flips |
| end "Good thing nobody fixed it." | bug | The beetle crawls across the case; the calendar flies off; the case settles into its frame-0 pose under the caption tape. | swish |

## Log
- 2026-11-11 (director, first cut): set, props and beats as above.
- 2026-11-11 (director, first cut rendered): voice laid out from the takes (`voiceover.py layout`), pauses lengthened after "stayed in" (1.1 s) and "1997" (1.0 s) so the Penn strips and the 1997 page reach their read times; `handling` reworded to "And the handling was terrible." (Whisper heard "the cars handled" as "the car is handled"); `fit.min` 0.88 so `ram` isn't rushed. `vo/vad.js` from out/vo/vo.wav (40 dB under the loudest 10 ms frame). readcheck clean, boundscheck clean, in-mix Whisper 13/13 at WER 0, −14.0 LUFS, pace OK (motion 0–3 s 2.94, no frozen stretch). SFX on the final mix (0.2 s peak; voice median −1.7 dBFS): ram −4.6 (loudest), CANCELED stamp −7.5, others −5.6 to −14.5. `duck.smr_db` 23.
- 2026-11-11 jury r1 (HOLD 7.1, Truth 8.0): doc credit now "DMA DESIGN DOC · 1995" and gone before "But it crashed"; Penn credit sits on the CRASH stack; every Penn strip + credit peels before the next line starts (one quote at a time at 19–24.6 s); "…APPALLING" big strip. Ram: camera push 1→1.55, player shoved to the kerb, star ×2 with paper flecks, RAM! slam held ~1.9 s. ONE DAY moved to the left kerb; light bar ×1.7 at 4 Hz. Frame 0: stamp already swinging, lands 1.12 s; hook cop parked under the case, and the end cop parks there again for the loop. DOS-style CRASH boxes, PC · EUROPE 50 px, KEEP slaps on "stayed", CANCELED peels on "came". Poster = landed hook frame (GTA + CANCELED + cop).
- 2026-11-11 jury r2 (PASS 7.0 / Truth 8.5), voice untouched: frame 0 = caption + GTA (5 words, CANCELED once; stamp enters off-frame, hovers, drops into the pause at 1.93 s, ≈ −9 dBFS, ≤ 8° per frame on the drop). Publisher strip cut to “CAN IT” and gone by 4.2 s; "why" card reads SO WHAT TURNED IT AROUND? with no pink; handling strip/credit moved to the bottom slot and gone by 13.45 s. Pauses filled: trash can re-hook + clank 13.1, KEEP hovers on "stayed" and slaps at 23.5, three calendar flaps 27.4–27.9 + flip 28.17, loop-seam swish 32.7. Ram: player shoved to x 905 with a 57° spin; RAM! is the only read (ram caption dropped), out before the bug caption. Poster = stamp just landed (2.43 s).
