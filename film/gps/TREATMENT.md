# GPS: how your phone knows where you are

A vertical (1080×1920) explainer for TikTok, Reels and Shorts, written in code. Factory #4 on Tech, explained, after `film/hallucinate/` (jury 8.2). One hard idea: **your phone finds you by timing radio signals from clocks in orbit, and those clocks run fast (Einstein) by 38 millionths of a second a day, about seven miles of distance error a day if nobody corrected it.** Facts and sources: `BRIEF.md`.

## Benchmarks

- **Hallucinate (`film/hallucinate/`, jury 8.2)**: learn the paper-object set (real things, worn stamps, a true story with a year in the second half), stressed-word-only caption pills, the DM frame given the whole screen with ≥ 40 px body text, a new object every 3–4 s through the 45–65 s stretch. Don't take its single repeating blank: a mechanism film needs a move that *does the math* on screen, not a symbol.
- **Classroom trilateration (a pencil compass on a road map, as taught in every geography class)**: learn the drafting compass drawing one distance circle per satellite until the circles agree; it is the real method and it is something a hand does. Don't take the textbook's static three-circle diagram: here each circle is swung on a word and the crossing gets a pin with a thud.

## Three structures we considered

1. **Einstein first** ("your map would be wrong without Einstein", then the mechanism). Rejected: it overclaims (the brief's "kept out" list), and the twist lands before the viewer knows why a clock matters.
2. **The 1977 story as the frame** (open on NTS‑2, flash back to the mechanism). Rejected: the search phrase is "how does GPS work"; a 1977 satellite on frame 0 doesn't answer it and doesn't read on a muted scroll.
3. **Mechanism, then the twist, then the proof** (chosen): frame 0 shows the conflict (a satellite clock and your phone's clock that don't agree, over a phone map with a blue dot), the mechanism in five objects (the broadcast ticket, the one-way phone, the stopwatch, the equation, the compass circles), the catch (a foot per nanosecond on a wooden ruler) and the fourth satellite, then the weird part (gravity, speed, the adding-machine tally = the DM frame), the honest seven-mile range error, the 1977 test with a toggle switch and a tear-off calendar, and the end on the same phone, blue dot and two clocks, so the loop lands on frame 0.

## The native move: the compass circle

A drafting compass (steel legs, a pencil lead) stands on a satellite's point and swings a circle whose radius is the distance the signal travelled. It is how GPS actually finds you, drawn by a hand, not a shockwave: no expanding rings, every circle is drawn once and stays. It first draws three circles that cross (`three`), smears them when the phone's clock is bad and draws a fourth that snaps them sharp (`fourth`), and closes the film by drawing the 16‑ft circle round the blue dot (`feet`), which is frame 0's dot.

## Look (Isac, 2026-10-23: must not look AI-made)

Flat, hand-built, real objects on the ink stage: a phone with a plain drawn street map (no Apple/Google chrome), a flat satellite with gold foil body and blue panels, LCD clock cards, a printed ticket coming out of the satellite, a stopwatch, a 12‑inch wooden ruler, a drafting compass, an analog wall clock pair, a car speedometer, an adding-machine paper tape, a tape-measure line, a quote card, a toggle switch, a tear-off calendar, a typed report cover (RE-CREATED), worn rubber stamps. Type: Archivo for headlines, Geist Mono for readouts and small print, Instrument Serif italic for the quote. One coral accent for the error and the fix. Background: faint coordinates drifting (40.7128° N, 12,550 mi, L1 1575.42 MHz…), plain text.

## Voice first

Ming US_James (`vo/script.json`, `film-voiceover` §3c), recorded before any picture; every beat, caption and sound reads its time from `vo/vo.js` through `at(id, word)`. No music (`MUSIC = false`): voice + sound effects, and voice only. "GPS" is said "G.P.S."

| Line | Stressed word(s) | Picture |
|---|---|---|
| hook | **clocks**, **space** | Frame 0: headline HOW DOES GPS WORK?, a satellite with its clock card (12:00:00.000 038, the last digits racing) and your phone's clock card (…000 000) with a coral ≠ between them, a phone with a drawn map and a pulsing blue dot. On "clocks" both cards knock; on "space" the satellite drifts up. |
| why | **GPS**, **Einstein** | The headline's GPS lights coral; on "Einstein" a manila hang tag swings in on the satellite: EINSTEIN? |
| sky | **30**, **12,000 miles** | Earth to scale (r 100 px) with six orbit planes at 4.2 Earth radii and satellites gliding; a counter rolls to ≈30; a bracket ruler shows 12,550 MI UP. |
| say | **time**, **where** | One satellite, big. A paper ticket prints out of it: line 1 TIME 12:00:00.000000000 on "time", line 2 I'M AT x, y, z on "where". |
| listen | **never**, **listens** | The phone, big. An arrow from the phone up to the sky gets a coral ✕ on "never talks back"; three tickets arrive into the phone on "listens". Stamp RECEIVE ONLY. |
| trip | **tenth of a second** | A stopwatch runs 0.000 → 0.067 s while one ticket travels the dashed line from satellite to phone. |
| math | **time**, **speed of light**, **distance** | Paper tags drop into an equation: 0.0674 s × 186,282 mi/s ≈ 12,550 mi. |
| three | **three**, **one spot** | The native move: a paper map, three satellite marks; the compass swings circle 1, 2, 3; two circles leave two crossings, the third keeps one; a coral pin drops. |
| catch | **foot**, **billionth** | A 12‑inch wooden ruler; light streaks across it; label 1 FOOT ≈ 1 BILLIONTH OF A SECOND. Coral BUT chip on the cut. |
| fourth | **isn't that good**, **fourth** | The phone's clock card wobbles (±); the three circles smear into thick bands (label OFF 0.001 s = 186 MI); the compass swings a fourth circle and all four snap sharp: x, y, z + TIME. |
| weird | **weird**, **faster** | Two wall clocks: ON THE GROUND (by the Earth's edge, heavy gravity arrows) and IN ORBIT (light arrows); the orbit clock's second hand pulls ahead. Tag +45.7 µs/DAY · GRAVITY. |
| speed | **8,700 miles an hour**, **slows** | A car speedometer sweeps to 8,700 MPH; the orbit clock's hand eases back a touch. Tag −7.1 µs/DAY · SPEED. |
| net | **38 millionths** | The DM frame: an adding-machine tape prints +45.7 / −7.1 / +38.6 µs; then the whole frame: +38 MILLIONTHS OF A SECOND, EVERY DAY (≥ 40 px body, held ≥ 3 s). |
| miles | **seven miles**, **every day** | The satellite-to-phone signal line; a coral tape-measure extension grows +7 mi on DAY 1, +14 on DAY 2, +21 on DAY 3. Small print on screen the whole line: RANGE ERROR IF UNCORRECTED · 38.6 µs × c ≈ 11.6 km. No map, no city: the error is on the measured distance. |
| doubt | **1977**, **not everyone** | Dateline 1977; a quote card: "…some who doubted that relativistic effects were truths that would need to be incorporated." — Neil Ashby, physicist (2003). |
| switch | **test satellite**, **fix off** | NTS‑2 · LAUNCHED JUNE 23, 1977, a flat satellite with a CESIUM CLOCK box; a big toggle RELATIVITY FIX snaps to OFF. |
| result | **twenty days**, **Einstein predicted** | A tear-off calendar flips DAY 1 → 20; MEASURED +442.5 vs PREDICTED +446.5 (parts per trillion) on a typed report (RE-CREATED); WITHIN 1% stamp; the toggle flips ON. |
| fixed | **every**, **corrected** | The constellation returns; a coral ✓ lands on every satellite in turn; tag 10.23 MHz → 10.22999999543 MHz · SET SLOW BEFORE LAUNCH. |
| feet | **16 feet** | The phone, its map zoomed in; the compass draws the 16 FT circle round the blue dot; small print TYPICAL, OPEN SKY · GPS.GOV. |
| end | **Einstein**, **blue dot** | The satellite and the two clock cards return round the phone; the hang tag EINSTEIN clips to the blue dot; the last frame is frame 0. |

## Rules it follows

- Something moves every frame: drifting coordinates, the pulsing blue dot, racing clock digits, satellites gliding, papers sway 1–2°, the camera pushes 3 % per scene.
- A visual hit on every stressed word, keyed with `at(id, word)`; the next scene pre-rolls into silences. Scene changes are a coral signal line sweeping across (the broadcast) instead of a fade.
- Captions in the upper third (y ≈ 360), one block at a time, pills only on stressed words; labels ≥ 30 px inside x 90–930 and above y 1450; global stamps at y ≈ 1280.
- Honest numbers only (BRIEF facts 1–12): ~30 satellites, 12,550 mi, 0.0674 s, 186,282 mi/s, 1 ft ≈ 1 ns, +45.7 / −7.1 / +38.6 µs a day, 7 mi as **range error if uncorrected**, NTS‑2 launched June 23 1977, about 20 days, +442.5 vs +446.5 parts in 10¹², 10.22999999543 MHz, 16 ft typical under open sky. Never "only GPS", never "your map would be 7 miles off".
- Ban list respected: no glowing nets, grid floors, particle bursts, lens flares, shake, bouncy easing, shockwave rings.
