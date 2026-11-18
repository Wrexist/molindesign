# Is 5G draining your battery?

Factory #34 · slug `5gbattery` · backlog row 40 · researched 2026-11-17. Channel: Tech, explained (not named in the script). American English, US audience, Ming US_James (seed 7, `"engine": "ming"`), **no music**, **no AI tag** anywhere (LESSONS, Not slop). 10 lines, 87 caption words. Chained `at` (2.8 w/s formula plus written pauses) gives `dur` 36.3 s; Ming reads about 0.92× the formula (darkmode, overnightcharge, phonelistening), so **expect about 33–34 s**. If it comes back over 36 s, cut in this order: `pixel` → "Pixel's version: Adaptive connectivity." (4 words), then the `barely` hold 1.2 → 1.0 s.

Shape copied from phonelistening (#33, 411 YouTube views in 6 h): myth question, honest answer ("yes, sometimes"), one sourced twist, a "check yours" on the viewer's own phone, a yes/no end line. Distinct from **battery** (wear), **coldbattery**, **darkmode**, **overnightcharge**, **forceclose** and **airplanemode**: no shared facts; this is the only one about the cell radio's power.

## 0. Packaging score: 6/6 (PERFORMANCE.md §7)

| # | Mark | Score | Why |
|---|---|---|---|
| 1 | Mine | 1 | The 5G icon in their own status bar and their own battery. iPhone 12 and later, Pixel 4a (5G) and later. |
| 2 | Myth / threat | 1 | Threat the viewer already half-believes ("5G kills my battery"), answered honestly (yes, sometimes) and then turned: 5G costs extra when it's barely used and is *more* efficient at full speed. Kills the follow-on myth "just turn 5G off". |
| 3 | Frame-0 test | 1 | Look at the top of your phone: is there a 5G icon? Frame 0 is a big status-bar corner with **5G** next to a draining battery. |
| 4 | Takeaway | 1 | Check one setting: iPhone **Settings › Cellular › Cellular Data Options › Voice & Data → 5G Auto**; Pixel **Settings › Network & internet › Adaptive connectivity**. |
| 5 | Title | 1 | **"Is 5G Draining Your Battery? 🔋"** (5 words) or, with a consequence verb, **"5G Drains Your Battery When You Barely Use It 😮"** (too long at 9; SEO to trim to "5G Drains Battery When You Barely Use It"). SEO picks. |
| 6 | Searched | 1 | "does 5g drain battery", "should I turn off 5g to save battery", "5g battery drain iphone" are stock queries; Apple, Google and every carrier answer them. Volume not measured (no Semrush run). The backlog row said 5/6; frame 0's status-bar test earns the sixth point. |

**Main search phrase:** `does 5G drain battery` (spoken in `hook` "5G can drain your battery", 0.2–2.2 s; on screen by ~2.5 s as a typed search bar **DOES 5G DRAIN BATTERY**, hold ≥ 1.5 s). SEO also captions "should I turn off 5G", "5G Auto iPhone", "5G battery drain".

**DM-able moment:** `barely` with its plate **5G COSTS EXTRA WHEN YOU BARELY USE IT** over the two-curve drawing (slow: 5G worse · full speed: 5G better). "Turning off 5G isn't the fix, your phone already does it" is the thing people send. Second: the power-meter rig itself (a phone wired to a lab meter).

## 1. Topic and one hard idea

**5G can cost more battery than LTE, but mostly when it's barely used: in a 2021 power-meter study, 5G was up to 79% less efficient than 4G at slow speeds and up to five times more efficient at full speed, which is why iPhone's 5G Auto and Pixel's Adaptive connectivity drop to LTE when 5G won't help.**

**Backlog hook kept, turned into a yes.** "5G can drain your battery faster." (6 words) → **"Yes, 5G can drain your battery."** (6). The "Yes," makes it an answer to the question the viewer is already asking (it sits under a typed DOES 5G DRAIN BATTERY), sets up "Should you turn it off?" and makes the end loop seamless: "…Yes or no." → "Yes, 5G can drain your battery." "Faster" is cut because the efficiency is not always worse (twist).

## 2. Hook options

1. **"Yes, 5G can drain your battery."** (chosen, 6 words) Honest answer to a searched question, the threat in the viewer's own phone, and the "Yes" loops from the end line.
2. "5G drains your battery. Sometimes." (5, rejected) Same honesty, but "Sometimes" on its own reads as a hedge, not a stake, and doesn't loop.
3. "Don't turn off your 5G." (5, rejected) Belief-breaking, but it's the payoff: frame 0 would give away the answer (LESSONS: frame 0 shows the conflict, never the answer), and it's advice we can't fully back for every phone (Apple says 5G On *might* reduce battery life; LTE is a valid choice).

## 3. Facts used

All read **2026-11-17** from the live pages or PDFs (curl / pdftotext / WebFetch). Quotes are word for word.

| # | Fact (quote) | Line | Source |
|---|---|---|---|
| 1 | Narayanan, Zhang, Zhu, Hassan, Jin, Zhu, Zhang, Rybkin, Yang, Mao, Qian, Zhang, "A Variegated Look at 5G in the Wild: Performance, Power, and QoE Implications", ACM SIGCOMM 2021 (Aug 23–27, 2021), pp. 610–625, DOI 10.1145/3452296.3472923. University of Minnesota – Twin Cities and University of Michigan – Ann Arbor. Method: "We use Monsoon Power Monitor [17] to power smartphones and measure the power consumption." Phones: Pixel 5, Samsung Galaxy S20 Ultra, Galaxy S10 5G; carriers Verizon and T-Mobile; "2,336 minutes" of power measurements at 5000 Hz. | test | https://par.nsf.gov/servlets/purl/10291906 (author copy: https://www-users.cse.umn.edu/~fengqian/paper/5g_sigcomm21.pdf) |
| 2 | Same paper, key findings: "In terms of energy efficiency for downlink (and uplink), 5G can be 79% (74%) less efficient than 4G at a low throughput but up to 5× (2×) more when the throughput is high." §4.3: "These experiments were done on S20U over Verizon." · "Although at low throughput levels the power consumption for mmWave 5G is higher, it becomes more efficient when the throughput is high." · crossover where mmWave 5G becomes more efficient than 4G: "187 Mbps … for downlink". | slow, twist | same |
| 3 | Same paper §4.2: "5G radio consumes more power than 4G (when the throughput is zero …)" · "to save power, traffic patterns like periodical data transmission or intermittent waking up should be avoided under 5G. One solution would be forcing the UE to stay in 4G when high throughput is not needed." Table 2 tail power (Verizon): 4G 178 mW, NSA 5G mmWave 1,092 mW, NSA 5G low-band (DSS) 249 mW. | barely | same |
| 4 | Apple Support, "Use 5G with your iPhone" (Published Date: May 11, 2026): "5G Auto: Enables Smart Data mode. When 5G speeds don't provide a noticeably better experience, your iPhone automatically switches to LTE, saving battery life." · "5G On: Always uses 5G network when it's available. This might reduce battery life." · "LTE: Uses only LTE network, even when 5G is available." · "The default settings for 5G on iPhone optimize battery life and data usage based on your data plan." · Path: "Open the Settings app. Tap Cellular and then tap Cellular Data Options … Voice & Data". · "An iPhone 12 model or later". | auto, on, end | https://support.apple.com/en-us/108383 |
| 5 | Pixel Phone Help, "Control airplane mode, private DNS & other network settings": "Adaptive connectivity (Pixel 4a (5G) & later)" · "Adaptive connectivity turns on 5G only when your app needs increased speed, like when you stream or download videos." · "Tap Network & internet › Adaptive connectivity" · "Tip: To save battery power, turn on Adaptive connectivity." · "In the United States, some carriers may limit Adaptive connectivity." | pixel | https://support.google.com/pixelphone/answer/2819583?hl=en |
| 6 | Pixel Phone Help, "Connect to mobile networks on a Pixel phone": "Network & internet › SIMs" · "Preferred network type: Pick your preferred network type from options, like 5G and LTE." | pixel (chip, optional) | https://support.google.com/pixelphone/answer/2926415?hl=en |
| 7 | Apple (same page as 4): "If you turn on Low Power Mode, 5G disables except in some cases like video streaming and large downloads on iPhone 12 and iPhone 13 models." (Kept out of the voice; supports the idea that Apple itself keeps 5G for big jobs. Optional footnote only.) | — | https://support.apple.com/en-us/108383 |

**Note on the paper the orchestrator suggested.** Narayanan et al., "A First Look at Commercial 5G Performance on Smartphones" (WWW 2020, https://arxiv.org/pdf/1909.07532) has **no power measurements**: "energy" appears only in passing (handoff design that may "reduce the 5G standby time that may consume additional energy"). The same group's follow-up, SIGCOMM 2021 (fact 1), is the first one with a power monitor, so it's the film's source.

**Wording choices tied to sources**
- `hook` "Yes, 5G can drain your battery.": fact 2 (up to 79% less efficient at low throughput), fact 3 (more power than 4G at zero throughput), fact 4 (Apple: 5G On "might reduce battery life"). "Can", not "does".
- `test` "In 2021, researchers wired 5G phones to power meters.": fact 1 (Monsoon Power Monitor powering the phone). Card **2021**; credit **U. MINNESOTA · U. MICHIGAN · SIGCOMM 2021**.
- `slow` "At slow speeds, 5G was up to 79% less efficient.": fact 2, "79% … less efficient than 4G at a low throughput", downlink. On screen with it, same frame, ≥ 40 px: **UP TO 79% LESS EFFICIENT THAN 4G · AT LOW SPEEDS** and scope ≥ 36 px **ONE PHONE (GALAXY S20 ULTRA) · VERIZON · 2021 TESTS**. Never convert it to "4.8× more energy": the paper doesn't, and "79% less efficient" on energy per bit is ambiguous enough that a conversion would be our math.
- `twist` "But at full speed, it was up to five times more efficient.": fact 2, "up to 5× … more when the throughput is high", downlink. Chip: **UP TO 5× MORE EFFICIENT · AT HIGH SPEEDS** + same scope line. "Full speed", not "big downloads": the crossover is a speed (about 190 Mbps on that phone), not a file size.
- `barely` "So 5G costs extra when you barely use it.": our plain-words summary of facts 2–3 (low throughput and zero throughput both cost more on 5G than 4G); the authors' own advice is to "stay in 4G when high throughput is not needed". Plate credit **OUR SUMMARY · SIGCOMM 2021**.
- `auto` "On iPhone, 5G Auto drops to LTE when 5G won't help.": fact 4 ("automatically switches to LTE, saving battery life" when 5G "don't provide a noticeably better experience"). Quote chip: **"…SWITCHES TO LTE, SAVING BATTERY LIFE." · APPLE**.
- `pixel` "On Pixel, Adaptive connectivity does the same.": fact 5 ("turns on 5G only when your app needs increased speed"). "Does the same" = same idea (5G only when it helps); on screen use Google's own words, not Apple's. Chip **PIXEL 4a (5G) & LATER**; tag **OTHER ANDROID PHONES: "NETWORK MODE" · MENU NAMES VARY**.
- `on` "5G On always picks 5G. Apple says that might cost battery.": fact 4 ("Always uses 5G network when it's available. This might reduce battery life."). Keep "might" on screen: **"THIS MIGHT REDUCE BATTERY LIFE." · APPLE**.
- `end` "Is yours on 5G Auto? Yes or no.": the viewer checks their own setting; the picture must not show which option is selected.

**Kept out on purpose (truth risks)**
- **No health claims.** Nothing about radiation, towers or safety; off topic and a different evidence base.
- **No "hours of battery" number.** The 9to5Mac/BGR "1–2.5 hours longer on LTE" figures have no published method; not used.
- **No claim that today's phones still behave like the 2021 S20 Ultra.** Modems have changed (newer chips, more Standalone 5G). Every number carries **2021 · ONE PHONE · VERIZON** on screen; the voice says "In 2021".
- **No "always turn on 5G Auto" advice.** Apple says the defaults "optimize battery life and data usage based on your data plan"; some plans default to other modes. The voice only says what 5G Auto and 5G On do.
- **mmWave vs low-band.** The 79%/5× headline is the paper's general summary; §4.3's figure uses mmWave and low-band on S20U/Verizon, and low-band's downlink slope is "almost identical" to 4G. Don't draw "5G UW" vs "5G" icons as different results. Keep the scope line generic: **ONE PHONE · VERIZON · 2021**.
- **Tail power (1,092 vs 178 mW)** is vivid but adds a second mechanism (radio staying awake after data stops) and is mmWave-only; left out of the voice. Optional small chip under `barely`: **IDLE 5G mmWAVE: ~6× THE POWER OF 4G · 2021 TEST** only if the director wants a second number; my advice is to leave it out.
- **Pixel carrier caveat.** Google says "some carriers may limit Adaptive connectivity" in the US; tag **SOME US CARRIERS LIMIT IT** at ≥ 36 px under the Pixel path.

## 4. Tension arc and shot ideas per line

Tension row: **4 3 3 1 4 4 4 3 4 5** (hook, ask, test, slow, twist, barely, auto, pixel, on, end). Opens on the threat confirmed ("Yes"), asks the searched question, sets up the lab, drops to the low point when the meter needle pins on "79% less efficient" (the myth wins: 5G really is the battery thief), turns on "five times more efficient", lands the DM line, then hands the viewer the check, ending on their own yes/no.

Dated cards: **2021** at `test`, **TODAY** at `auto` (Apple page dated May 11, 2026).

**Hero object (vary from phonelistening's box and overnightcharge's column): the lab power meter.** A big cut-paper bench meter (≥ 650 px wide), cream face, needle, a numeric window, two paper leads clipped to a generic phone lying on the bench (phone back off, battery replaced by the meter's leads, as in the study). Label on the meter **POWER METER** (≥ 36 px). Two events:
1. **Fail (`slow`):** a thin trickle of data dots drips into the phone's antenna; the needle swings hard toward the red end; the meter prints a paper tape: **5G vs 4G AT LOW SPEED: UP TO 79% LESS EFFICIENT**. One dry thump in the 0.6 s gap.
2. **Pass (`twist`):** a fat stream of data blocks floods in; the 4G needle (ghost, cream outline) races past while the 5G needle stays calmer; tape prints **AT HIGH SPEED: UP TO 5× MORE EFFICIENT**. Paper slap in the 0.5 s gap.

**Summary drawing on the hero hold (`barely`, LESSONS overnightcharge):** chalk drawn over the bench: two lines on a hand-drawn chart, x **DATA SPEED**, y **ENERGY PER BIT** (lower is better), a cream 4G line and a coral 5G line that starts above 4G at the left (**SLOW: 5G COSTS MORE**) and crosses below it at the right (**FULL SPEED: 5G COSTS LESS**). Plate ≥ 48 px: **5G COSTS EXTRA WHEN YOU BARELY USE IT**. Credit **SIGCOMM 2021 · ONE PHONE · VERIZON**. Screenshot hold ≥ 1.5 s in the 1.2 s silence plus the line itself.

**Native move: the 5G icon.** The "5G" glyph from frame 0's status bar is the film's thread: it detaches from the status bar at `test` and becomes the label on the meter's lead, at `auto` it flips to **LTE** and back (Smart Data switching, a two-sided paper tile), and at `end` it returns to the status bar.

**Layout changes (two across the middle third, LESSONS darkmode):**
- **A (0–5 s) status-bar close-up:** huge phone top edge, **5G** icon and battery icon fill the width.
- **Change 1 at `test` (~5 s): the lab bench, wide.** Phone on its back on a bench, meter big at right, leads between them.
- **Change 2 at `auto` (~20 s): the settings screens, upright.** Re-created iPhone screen then Pixel screen, phone fills the frame.
- **C at `end`:** back to frame 0's status bar.

| id | at | tension | Line | Shot |
|---|---|---|---|---|
| hook | 0.2 | 4 | "Yes, 5G can drain your battery." | **Frame 0, moving from frame 1:** the phone's status-bar corner glides in ≥ 300 px, huge: **5G** icon (cream) and a battery icon whose fill visibly drains. Text **5G DRAINING IT?** (3 words; count on the render), "?" coral. A typed search bar drops in at ~1.5 s: **DOES 5G DRAIN BATTERY**, hold ≥ 1.5 s. **0.5 s gap after "battery."**: a dry tick as the battery bar drops one notch. |
| ask | 2.84 | 3 | "Should you turn it off?" | A paper finger reaches for a toggle beside the 5G icon and hovers (doesn't press). A coral **OFF?** tag swings on a string. |
| test | 5.03 | 3 | "In 2021, researchers wired 5G phones to power meters." | **Layout change 1 (lab bench).** Card **2021**. The phone flips onto its back on a bench; two paper leads snake from the meter and clip on; the **5G** icon rides the lead as its label. Credit chip ≥ 36 px: **U. MINNESOTA · U. MICHIGAN · SIGCOMM 2021**. Meter needle twitches awake. |
| slow | 8.64 | 1 | "At slow speeds, 5G was up to 79% less efficient." | **Fail event.** A thin trickle of data dots; needle swings hard; tape prints **UP TO 79% LESS EFFICIENT THAN 4G · AT LOW SPEEDS**, scope under it ≥ 36 px **ONE PHONE · GALAXY S20 ULTRA · VERIZON · 2021**. "79%" fully printed when it appears (no mid-roll). **0.6 s gap after "efficient."**: dry thump. |
| twist | 12.81 | 4 | "But at full speed, it was up to five times more efficient." | **Pass event.** The trickle becomes a flood of data blocks; a ghost 4G needle races past the 5G needle; the first tape is torn off and a second prints **UP TO 5× MORE EFFICIENT · AT HIGH SPEEDS** with the same scope line. **0.5 s gap**: paper slap. |
| barely | 17.6 | 4 | "So 5G costs extra when you barely use it." | **Hero hold.** Chalk chart draws over the bench: cream 4G line, coral 5G line crossing it (labels **SLOW: 5G COSTS MORE** / **FULL SPEED: 5G COSTS LESS**). Plate ≥ 48 px **5G COSTS EXTRA WHEN YOU BARELY USE IT** · credit **OUR SUMMARY · SIGCOMM 2021**. **Screenshot hold ≥ 1.5 s** in the 1.2 s silence; one dry hit only. |
| auto | 22.01 | 4 | "On iPhone, 5G Auto drops to LTE when 5G won't help." | **Layout change 2.** Card **TODAY**. Re-created iPhone screen (RE-CREATED ≥ 36 px), generic phone: header **Voice & Data**, three rows **5G Auto · 5G On · LTE** with **no checkmark on any row**. The status-bar **5G** tile flips to **LTE** on "drops to LTE" and back. Quote chip: **"…SWITCHES TO LTE, SAVING BATTERY LIFE." · APPLE**. Path chip: **Settings › Cellular › Cellular Data Options › Voice & Data**. |
| pixel | 26.34 | 3 | "On Pixel, Adaptive connectivity does the same." | Phone turns, re-created Pixel screen (RE-CREATED): **Network & internet › Adaptive connectivity**, row ends in a **neutral chevron, no switch**. Quote chip: **"…TURNS ON 5G ONLY WHEN YOUR APP NEEDS INCREASED SPEED…" · GOOGLE**. Tags ≥ 36 px: **PIXEL 4a (5G) & LATER · SOME US CARRIERS LIMIT IT**, **OTHER ANDROIDS: "NETWORK MODE" · MENU NAMES VARY**. |
| on | 29.24 | 4 | "5G On always picks 5G. Apple says that might cost battery." | Back to the iPhone rows; a paper arrow points at **5G On** (pointing only, no checkmark); the tile stays stuck on **5G** while the battery icon drains a notch. Quote chip: **"THIS MIGHT REDUCE BATTERY LIFE." · APPLE**. 0.5 s gap: soft pop. |
| end | 33.31 | 5 | "Is yours on 5G Auto? Yes or no." | Back to frame 0's status bar; the 5G tile settles back in. **YES / NO** chips ≥ 110 px, both cream, neither highlighted; nothing on screen shows a selected mode. Cut to frame 0 within 0.5 s of "no." |

Pacing: a new object every ≤ 1.2 s (battery notch, search bar, finger, OFF tag, bench, leads, card, trickle, needle, tapes, flood, ghost needle, chalk lines, plate, rows, tile flips, chips). Coral only on frame 0's "?", the 5G line in the chart and the 79% tape's needle zone. Generic phones, no Apple/Google/Samsung/Verizon logos.

## 5. Open questions and truth risks for the director

1. **Scope from the first frame each number appears** (LESSONS darkmode, phonelistening): 79% and 5× always share a frame with **2021 · ONE PHONE · VERIZON**; never a bare "79%". Say "efficient", not "battery": the study measured energy per bit of data, not phone battery hours. A battery icon draining beside the 79% tape is fine as mood, but never put "79%" inside or beside the battery icon (LESSONS coldbattery: % in a battery reads as charge).
2. **"Less efficient" is not "uses 79% more battery".** No tape, chip or caption may say MORE BATTERY or BATTERY LIFE next to the numbers.
3. **No ✓ or selected row on the settings screens** (LESSONS overnightcharge): it would answer the end question and imply a default.
4. **The chart is our summary drawing**, labelled **OUR SUMMARY**; draw it qualitatively (no axis numbers) so it can't be read as the paper's Fig. 12.
5. **Planned silences:** 0.5 s after `hook` (tick), 0.6 s after `slow` (thump), 0.5 s after `twist` (slap), 1.2 s after `barely` (one dry hit + screenshot hold), 0.5 s after `on` (soft pop). Place hits at line end + 0.3 s, margin 0.2 (LESSONS phonelistening).
6. **Ming risks.** "5G" is spelled "five G" in every `say`; "LTE" as "L T E"; "2021" as "twenty twenty-one"; "79%" as "seventy-nine percent". "5G On" might be heard as "five gone": if Whisper flags it, reword the line to "The 5G On setting always picks 5G." (don't add commas inside it; LESSONS fyp). "Adaptive connectivity" is two plain words; add to `names` if Whisper splits it.
7. **Length.** Formula 36.3 s; expect ~33–34 s. Cut order at the top.
8. **Frame 0 ≤ 4 words** (5G DRAINING IT? = 3; the search bar arrives at ~1.5 s). Count on the render.

## Log
- 2026-11-17: researched and scripted. Read the SIGCOMM 2021 "Variegated Look at 5G" paper (NSF PAR copy), the WWW 2020 "First Look" paper (no power data, so not used), Apple 108383 (May 11, 2026), Pixel Help 2819583 and 2926415. Backlog hook kept as "Yes, 5G can drain your battery." (drops "faster", which the paper contradicts at high speed). The paper's 79% / 5× crossover became the twist. scriptlint: OK, no FAILs or WARNs.
