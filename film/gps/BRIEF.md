# GPS: how your phone knows where you are

Factory #4 · slug `gps` · researched 2026-10-23 · follows `film/hallucinate/` (jury 8.2). Channel: Tech, explained (not named in the script). American English, US audience, AI voice Ming US_James (seed 7), disclosed in the post.

## 1. Topic and one hard idea

**Your phone finds you by timing radio signals from clocks in orbit, and those clocks run fast (Einstein) by 38 millionths of a second a day, which is about seven miles of distance error a day if nobody corrected it.**

The first half is the mechanism in five pictures: satellites broadcast *time + where I am*, your phone only listens, trip time × light speed = distance, three distances pin you, a fourth fixes your phone's bad clock. The second half is the twist (time runs faster up there) and a true story with a year to carry it past the 50 s sag (lesson from hallucinate): in 1977 a test satellite, NTS‑2, flew its atomic clock uncorrected for about 20 days, and it ran fast almost exactly as general relativity predicted.

**Main search phrase: `how does GPS work`**. Spoken at about 3.6 s (line `why`); show it on screen in the first 2 s and put it in the caption's first line. Secondary phrases for the SEO agent: `how does my phone know where I am` (the topic row's phrasing), `GPS relativity`, `GPS Einstein`. I didn't check search volumes (Semrush had no API units on the last run; not retried).

**DM-able moment:** lines `net` + `miles`: "they gain 38 millionths of a second a day… about seven miles of distance error. Every day." Runner-up: `listen` ("your phone never talks back, it only listens"), which most people get wrong.

## 2. Hook options

1. **"Your phone finds you using clocks in space."** (chosen; the backlog hook, unchanged)
2. "Without Einstein, your map app would be miles off by tomorrow." (rejected: overclaims; see "Kept out")
3. "Your phone never tells the satellites where it is. It only listens." (kept as line `listen`, 16.6 s)

**Why 1:** it's short (8 words), true, and a contradiction a viewer can picture (a phone, a clock, orbit). It opens the question without giving away the answer, so frame 0 can show the conflict (a blue dot and an orbiting clock whose readout is drifting) rather than the explanation. Line 2 names the question ("So how does GPS work? And why does it need Einstein?"), and the last line, "Einstein, built into the blue dot on your map.", runs straight back into "Your phone finds you using clocks in space."

**One correction to the backlog angle:** the angle says satellites "only broadcast the time". They broadcast the time **and their own position** (gps.gov: "one-way signals that give the current GPS satellite position and time"). Without the position the phone couldn't do the math. Line `say` states both.

## 3. Facts used

All checked 2026-10-23. Primary sources:
- **gps.gov** (U.S. government). The live gps.gov paths return 404 to our fetcher; the archived copies at archive.gps.gov say the site "has not been updated since February 2025 due to staffing shortages". Nothing used here moves fast.
- **Ashby 2003**: Neil Ashby, "Relativity in the Global Positioning System", *Living Reviews in Relativity* 6, 1 (2003), doi:10.12942/lrr-2003-1, full text at https://pmc.ncbi.nlm.nih.gov/articles/PMC5253894/
- **Ashby 2006**: Neil Ashby, "Relativistic Effects in the Global Positioning System" (Univ. of Colorado, dated July 18, 2006), AAPT: https://www.aapt.org/doorway/tgru/articles/ashbyarticle.pdf (read in full via pdftotext).

| # | Fact | Line | Source |
|---|---|---|---|
| 1 | GPS satellites fly at "approximately 20,200 km (12,550 miles)" and each "circles the Earth twice a day". "As of July 3, 2023, there were a total of 31 operational satellites." Users can see "at least four satellites from virtually any point on the planet." | sky | https://archive.gps.gov/systems/gps/space/ (live: https://www.gps.gov/systems/gps/space/) |
| 2 | Satellites "transmit one-way signals that give the current GPS satellite position and time." The user segment "receives the signals". Civil GPS is "freely available to all users". Operated by the U.S. Space Force. | say, listen | https://archive.gps.gov/systems/gps/ |
| 3 | Navigation equations c(t − tⱼ) = \|r − rⱼ\|, j = 1…4: "Time signals from at least four satellites are received"; the receiver solves for position **and** time. "From four measurements the three components of the receiver's position vector, and the local clock bias, can be determined." | math, three, fourth | Ashby 2006 §III.A; Ashby 2003 |
| 4 | "An error of 3 nanoseconds (ns) in time would correspond to a position error of about 1 meter." Light covers 0.98 ft per ns (from the defined speed of light, 299,792,458 m/s), so "about a foot every billionth of a second". | catch | Ashby 2006 §III.A; SI definition of the meter |
| 5 | Trip time: 20,200 km ÷ c = 67 ms overhead, about 86 ms near the horizon. "Under a tenth of a second" holds for every visible satellite. | trip | My arithmetic from fact 1 and c |
| 6 | Gravitational shift of the satellite clocks vs the ground: +5.288 × 10⁻¹⁰ (clocks run **faster**). "If not accounted for, in one day it could build up to a timing error that would translate into a navigational error of 13.7 km." | weird | Ashby 2006 eq. 23 |
| 7 | Speed: "satellite velocities are close to 4000 m/s"; time dilation vs a clock on the equator −8.228 × 10⁻¹¹ (clocks run **slower**), "a navigational error of order 2.13 km/day". Circular-orbit speed at a = 26,562 km is 3,874 m/s = **about 8,700 mph** (my arithmetic). | speed | Ashby 2006 eqs. 29–30 |
| 8 | Net constant offset: 4.4647 × 10⁻¹⁰. × 86,400 s = **38.6 µs/day** fast (45.7 gravity − 7.1 speed, my arithmetic from facts 6–7). Older satellites were compensated by "setting the atomic clock frequencies down by this amount before launch", the "factory frequency offset" (10.23 MHz → 10.22999999543 MHz). Newer rubidium clocks are measured after launch and "the necessary frequency corrections are transmitted to the receivers in the navigation message." | net, fixed | Ashby 2006 eq. 34 and the text after it; 10.22999999543 MHz is 10.23 MHz × (1 − 4.4647 × 10⁻¹⁰), matching Ashby 2003 |
| 9 | **The "miles a day" number, stated precisely:** 38.6 µs × c = **11.6 km ≈ 7.2 miles** of light-travel distance. That is the size of the **range (distance) error** the clock offset would add per day. Ashby's own wording is a "navigational error" of 13.7 km/day (gravity alone) and 2.13 km/day (speed alone). The script says "about seven miles of distance error. Every day.", which is exactly this, and never says your dot would be seven miles off. | miles | Arithmetic from fact 8; Ashby 2006 |
| 10 | **NTS‑2**, launched **June 23, 1977**: "there was uncertainty as to its magnitude as well as its sign", and "there were some who doubted that relativistic effects were truths that would need to be incorporated". A frequency synthesizer was built in so the correction could be applied after launch; the clock "was operated for about 20 days to measure its clock rate before turning on the synthesizer". Measured "+442.5 parts in 10¹²" vs general relativity's "+446.5 parts in 10¹²" (within 1%; 442.5 × 10⁻¹² × 86,400 s = 38.2 µs/day). | doubt, switch, result | Ashby 2003 (PMC text), NTS-2 passage; NRL report "Initial Results of the NAVSTAR GPS NTS-2 Satellite": https://apps.dtic.mil/sti/html/tr/ADA058591/index.html |
| 11 | NTS‑2 carried cesium clocks (Frequency and Time Systems), described as the first cesium clocks in orbit; NRL built the satellite; it was the first NAVSTAR GPS Phase I satellite. | switch (screen only) | NRL/DTIC report above; https://space.skyrocket.de/doc_sdat/nts-2.htm (secondary) |
| 12 | "GPS-enabled smartphones are typically accurate to within a 4.9 m (16 ft.) radius under open sky… their accuracy worsens near buildings, bridges, and trees." (gps.gov cites ION.) | feet | https://archive.gps.gov/systems/gps/performance/accuracy/ |

**Kept out of the narration on purpose**
- **"Without Einstein you'd be miles off."** The clock offset is the same for every satellite, so a receiver solving for its own clock would soak up a large part of it as a common bias; how much would actually show up in your position is not a clean "7 miles a day", and the ground control segment adjusts satellite clocks anyway. So the voice gives the honest, checkable quantity: **distance error** in the timing, 7 miles' worth per day. Screen small print should say "range error if uncorrected · ~11.6 km/day". Never caption it "your map would be 7 miles off".
- **"Satellites only broadcast the time."** Wrong (they also send their position); corrected in line `say`.
- **Phones use more than GPS.** Most phones also use Galileo, GLONASS and BeiDou, plus Wi‑Fi/cell assistance (A‑GPS) for a fast first fix. The film is about GPS, and every line is true of GPS; don't claim on screen that the phone uses *only* GPS. Not sourced in this run, so not spoken.
- **Exact satellite count.** 31 was gps.gov's number on July 3, 2023; the live count moves. Voice says "about 30"; don't print 31 as "today".
- **"Three satellites pin you to one spot."** Strictly, three spheres meet at two points; one is far out in space and gets thrown away. "Pinned to one spot" is fine for the ear; if a diagram shows the spheres, let one intersection fade out rather than drawing a false single point.
- **"The fix was turned off."** Ashby says the synthesizer wasn't turned on for about 20 days; "the fix off" says the same. Don't say the satellite was built to prove Einstein right or wrong, or that anyone wanted to "switch Einstein off".
- **Sagnac and eccentricity effects** (the second relativity correction, up to 75 ns, done in the receiver). True but a second idea; skip.

## 4. Shot ideas per line

House look: ink-dark stage, cream type, one hot coral accent, chips, labels, stamps.

**Proposed native move: the ripple ring.** Every satellite emits expanding cream rings (its broadcast). Wherever rings cross, a coral dot snaps. It is how GPS actually works (spheres of distance), it changes every beat, and it pays off: in `end`, the rings collapse into the phone's blue-dot halo. The caret from Next word doesn't fit here; don't force it.

Pacing note (hallucinate lesson): a new object every 3–4 s, and no two holds of 10+ s in a row in the 45–65 s stretch. The story (`doubt`–`result`) is there partly to give the second half new props.

| id | at | Line | Picture |
|---|---|---|---|
| hook | 0.35 | "Your phone finds you using clocks in space." | **Frame 0, silent-readable:** a phone map with a pulsing blue dot (bottom half, inside y < 1450). Top third: a satellite with a big digital clock on its side, its seconds' digits racing slightly ahead of a ground clock next to it, both labeled. Headline: "Your phone finds you with clocks in space." The conflict (two clocks that don't agree) is visible; the answer isn't. |
| why | 3.61 | "So how does GPS work? And why does it need Einstein?" | Big label **HOW DOES GPS WORK?** (main search phrase, on screen ≤ 2 s and again here). A small Einstein chip (silhouette or just "E = …" type, no photo needed) pops in on "Einstein". |
| sky | 7.94 | "About 30 GPS satellites circle Earth, over 12,000 miles up." | Pull out: Earth, six orbit rings, dots sliding along them. Height ruler "12,550 mi". Counter "~30". |
| say | 12.26 | "Each one broadcasts two things: the time, and where it is." | One satellite; a ring leaves it carrying two chips: **12:00:00.000000000** and **pin: x, y, z**. |
| listen | 16.59 | "Here's the trick: your phone never talks back. It only listens." | An arrow from phone to sky gets a coral ✕; incoming rings land on the phone. Label "one-way". DM-able runner-up. |
| trip | 20.92 | "The signal reaches you in under a tenth of a second." | A stopwatch on the ring's travel: 0.000 → 0.067 s. |
| math | 25.25 | "Trip time, times the speed of light, equals distance." | Chips snap into an equation: `0.067 s` × `186,282 mi/s` = `12,550 mi` (US units). |
| three | 28.86 | "Three satellites, three distances: you're pinned to one spot." | **Native move:** three rings around three satellites; they cross on the map; coral dot snaps. The far-space intersection fades. |
| catch | 32.48 | "But light goes about a foot every billionth of a second." | A 12-inch ruler with light streaking across it, label "1 ns". Coral **BUT** stamp on the cut. |
| fourth | 36.81 | "Your phone's clock isn't that good. A fourth satellite fixes it." | The phone's clock wobbles (± chips); the three rings blur into a smear. A fourth ring arrives, everything snaps sharp. Label "x, y, z + time". |
| weird | 41.14 | "Now the weird part: weaker gravity up there makes clocks tick faster." | Split clocks: GROUND and ORBIT. A gravity "well" grid thins out toward orbit; ORBIT clock's ticks speed up. Tag "+45 µs/day". |
| speed | 45.82 | "Their speed, about 8,700 miles an hour, slows them a little." | Speedometer to 8,700 mph; ORBIT clock nudged back. Tag "−7 µs/day". |
| net | 50.51 | "Net result: they gain 38 millionths of a second a day." | Running tally: +45 − 7 = **+38 µs/day** in coral, big. **DM-able frame:** hold ≥ 3 s with ≥ 40 px body text (lesson). |
| miles | 54.84 | "At light speed, that's about seven miles of distance error. Every day." | A distance bar grows 7 mi along a US road map (e.g. across a city). Small print: "range error if uncorrected · 38.6 µs × c ≈ 11.6 km". Day counter ticks 1 → 2 → 3, bar doubles, triples. |
| doubt | 59.52 | "Back in 1977, not everyone believed that would matter." | Dateline chip **1977**. A typed memo-style card with a "?" stamp. A real object reads as "not AI" (lesson): use a recreated NRL report title "Initial Results of the NAVSTAR GPS NTS-2 Satellite", labeled RE-CREATED. |
| switch | 63.49 | "So a test satellite flew its atomic clock with the fix off." | Satellite card "NTS‑2 · June 23, 1977"; a toggle **RELATIVITY FIX: OFF**. Small tag "cesium clock". |
| result | 68.18 | "For twenty days it ran fast, almost exactly as Einstein predicted." | Day counter 1 → 20. Two numbers side by side: **measured +442.5** / **predicted +446.5** (parts per trillion). Coral check stamp. Toggle flips **ON**. |
| fixed | 72.51 | "Since then, every GPS clock gets corrected for it." | The constellation returns; every satellite gets a small coral "✓ corrected" chip in a ripple. Optional tag: "10.23 MHz → 10.22999999543 MHz". |
| feet | 76.12 | "That's how your phone finds you to within about 16 feet." | Map zooms to street level; blue dot halo with "16 ft" radius. Small print "typical, open sky · gps.gov". |
| end | 80.45 | "Einstein, built into the blue dot on your map." | **Native move payoff:** rings from the satellites collapse into the blue dot's halo. On "map", cut back to frame 0. Loop. |

## 5. Open questions for the director

1. **Length.** 20 lines, 212 spoken words. The chained `at` estimates put `end` at 80.5 s and `dur` at 85.1 s; Ming James reads somewhat faster than the 2.8 w/s + 0.4 s chain, so expect about 76–82 s. If it runs long, cut `trip` first (`listen` → `math` still flows with "Trip time" on screen), then `speed` (fold "−7" into the `net` tally on screen).
2. **"GPS" pronunciation.** `say` uses "G.P.S." (as hallucinate did with "S.A.T."). If Ming reads it as a word, try "G P S" or "gee pee ess" and re-roll with `take`. It's in `names` for the Whisper check.
3. **Units on screen.** Voice is all US units. µs (micro-seconds) is unfamiliar to many Americans; consider "38 millionths of a second" as the big text and "38 µs" as the small label.
4. **Frame 0.** The lessons ask for the conflict, not the answer, and a real object. The two drifting clocks give the conflict; the phone map gives the real object. Avoid any real map brand UI (Apple/Google Maps chrome); draw a generic map.
5. **The `miles` line is the one the jury will poke.** Keep the small print (range error, if uncorrected) on screen while it's spoken. Don't add a "you'd be in another city" picture.
6. **Pinned-comment idea for the SEO agent:** "The first GPS test clock in 1977 flew with Einstein's correction switched off for 20 days, just to check. It ran fast by almost exactly the predicted amount."
