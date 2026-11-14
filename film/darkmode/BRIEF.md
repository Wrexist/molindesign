# Does dark mode save battery?

Factory #31 · slug `darkmode` · backlog row 35 · researched 2026-11-14. Channel: Tech, explained (not named in the script). American English, US audience, Ming US_James (seed 7, `"engine": "ming"`), no music, **no AI tag** anywhere (LESSONS, Not slop). 11 lines, 92 caption words. Chained `at` (2.8 w/s formula plus the written pauses) gives 38.3 s, `dur` 38.6. Ming reads faster than the formula (unlimiteddata: formula 36.2 s, real 35.2 s), so **expect about 35–37 s**. If the voice comes back over 39 s, cut "Even then," from `indoor` first, then merge `lamp` and `dip` into "Its backlight stays on, even for black." (the dip then rides on the still needle with no extra line).

Timely: no news hook. Evergreen. The same check works on any phone in the viewer's hand, today.

## 0. Packaging score: 6/6 (PERFORMANCE.md §7)

| # | Mark | Score | Why |
|---|---|---|---|
| 1 | Mine | 1 | Dark mode is a setting on every phone the viewer owns; most have tried it "to save battery". |
| 2 | Myth / threat | 1 | Breaks "dark mode saves battery" (the belief the setting is sold on). Phone myth, the shape of coldbattery (1.2k), airplanemode (930) and deletephoto (900). |
| 3 | Frame-0 test | 1 | The viewer can run the test in the room they're in: lights off, black photo, does it glow? Frame 0 is a phone half white, half black, in a room going dark. |
| 4 | Takeaway | 1 | Run the glow test; if your screen glows, dark mode is for your eyes, not your battery; if it's OLED, the saving shows mostly at high brightness. |
| 5 | Title | 1 | **"Dark Mode Doesn't Always Save Battery 🤔"** (6 words, the thing in words 1–2, consequence verb) or **"Your Dark Mode Might Not Save Battery 😮"**. SEO agent picks. |
| 6 | Searched | 1 | "does dark mode save battery" is a stock question (Purdue titled its paper "How much battery does dark mode save?"; every phone site has a page on it). Volume not measured (no Semrush run). |

**Main search phrase:** `does dark mode save battery` (spoken in `ask`, about 2.8–5.5 s; on screen by ~1.5 s as a typed search bar **DOES DARK MODE SAVE BATTERY**; SEO captions it, plus "dark mode OLED vs LCD").

**DM-able moment:** the **lights-out glow test** (`test` → `glow` → `oled`): "turn off the lights, open a black photo: if it glows gray, dark mode can't help your battery". And the hero contrast: **3–9 % indoors vs 39–47 % at full brightness** (same phones, same study).

## 1. Topic and one hard idea

**Dark mode only saves real power on OLED screens, where every pixel is its own light and a black pixel switches off; an LCD keeps its backlight on even for black. And even on OLED, the saving depends on brightness: about 3–9 % at indoor brightness, 39–47 % at full brightness (Purdue, 2021).**

**Backlog hook kept as is:** "Dark mode doesn't always save battery." (6 words). Is it true? Yes on two counts, both sourced: on LCD the backlight stays on for black (fact 3, fact 2), and on OLED the saving at 30–50 % brightness is "only 3%-9%", which Purdue says "most users wouldn't notice" (fact 1). It never says "never": `oled` and `sun` give dark mode its real win.

The orchestrator's angle kept; one addition: the **glow test**, so the takeaway is something the viewer does with the phone in their hand from second 6 (the brief asked for "your phone, right now" from frame 0).

## 2. Hook options

1. **"Dark mode doesn't always save battery."** (chosen, 6 words) The belief turned over, in the incognito shape ("doesn't make you invisible"). Every word is the viewer's own setting. Loops: "Does your black glow? Yes or no." → "Dark mode doesn't always save battery."
2. "Turn your lights off. Now look." (6 words, rejected as the hook) The strongest frame-0 test, but with no belief to break; the viewer doesn't know why yet. Kept as `test`, line 3.
3. "Your dark mode might do nothing." (6 words, rejected) Overclaims for OLED phones (most phones today, fact 4), where it does save something.

## 3. Facts used

All read **2026-11-14** from the live pages (curl, text extracted) unless noted. Quotes are word for word.

| # | Fact (quote) | Line | Source |
|---|---|---|---|
| 1 | Purdue news release, **July 28, 2021**: "At 30%-50% brightness, Purdue researchers found that switching from light mode to dark mode saves only 3%-9% power on average for several different OLED smartphones. This percentage is so small that most users wouldn't notice the slightly longer battery life." · "Many people use their phone's default auto-brightness setting, which tends to keep brightness levels around 30%-40% most of the time when indoors." · "The Purdue study found that switching from light mode to dark mode at 100% brightness saves an average of 39%-47% battery power." (scenario: "sitting outside watching a baseball game on a bright and sunny day") · "But the higher the brightness when switching from light mode to dark mode, the higher the energy savings." · Method: "six of the most-downloaded apps on Google Play: Google Maps, Google News, Google Phone, Google Calendar, YouTube and Calculator … 60 seconds of activity within each of these apps on the Pixel 2, Moto Z3, Pixel 4 and Pixel 5." · "The team recently presented this work at MobiSys 2021". | indoor, sun | Purdue University News: https://www.purdue.edu/newsroom/releases/2021/Q3/dark-mode-may-not-save-your-phones-battery-life-as-much-as-you-think,-but-there-are-a-few-silver-linings.html |
| 1b | The paper: Pranab Dash, Y. Charlie Hu, "How much battery does dark mode save? An accurate OLED display power profiler for modern smartphones", MobiSys '21, pp. 323–335, published June 24, 2021, DOI 10.1145/3458864.3467682. Abstract (via Semantic Scholar API): "By omitting external lighting, OLED display significantly reduces the power draw compared to its predecessor LCD …" **The ACM PDF returned 403 to every fetch today**, so the percentages are quoted from Purdue's release, not the paper's tables. | indoor, sun (credit) | https://doi.org/10.1145/3458864.3467682 · https://api.semanticscholar.org/graph/v1/paper/DOI:10.1145/3458864.3467682 |
| 2 | Purdue release on the mechanism: "Smartphones that came out after 2017 likely have an OLED (organic light-emitting diode) screen. Because this type of screen doesn't have a backlight like the LCD (liquid crystal display) screens of older phones, the screen will draw less power when displaying dark-colored pixels." | lamp, oled, pixels | same Purdue release |
| 3 | Samsung Display (May 6, 2021, reported by Asia Economy, read via WebFetch): "each pixel in OLED emits light by itself and expresses black by turning off pixels" · "LCD backlights are always on even when displaying black". (Same report: dark mode cut display power about 25 % on its OLED laptops, 9.9 h vs 11 h battery; **not used**, a maker's own laptop claim.) | lamp, dip, pixels | https://www.asiae.co.kr/en/article/2021050608523229816 (secondary report of Samsung Display's announcement; Samsung Display's own newsroom post not found today) |
| 4 | Apple specs. iPhone 11: "Liquid Retina HD display · 6.1-inch (diagonal) all-screen LCD Multi-Touch display with IPS technology … 1400:1 contrast ratio (typical)". iPhone 17: "Super Retina XDR display · 6.3‑inch (diagonal) all‑screen OLED display … 2,000,000:1 contrast ratio (typical)". Apple's compare page lists every current model with a "Super Retina XDR display"; "Liquid Retina HD display" (LCD) and "Retina HD display" appear only on older models (iPhone 11, XR, SE, 8 and earlier). | glow, oled (chips only) | https://support.apple.com/en-us/111865 · https://www.apple.com/iphone-17/specs/ · https://www.apple.com/iphone/compare/ |
| 5 | Android Developers, "Implement dark theme" (last updated 2026-10-28): dark theme "Reduces power usage by a significant amount, depending on the device's screen technology." | dip/oled (optional chip) | https://developer.android.com/develop/ui/views/theming/darktheme |

**Derived (list as facts):** "pitch black vs gray glow" is the visible result of facts 3 and 4: an OLED black pixel is off (no light), an LCD's black is the backlight seen through closed crystals (1400:1 on iPhone 11 means black still gives off light). "Indoors" in the voice = Purdue's "around 30%-40% … when indoors" auto-brightness, inside the 30–50 % band the 3–9 % comes from. "Out in the sun" = Purdue's own sunny-day scenario for the 100 % figure.

**Wording choices tied to sources**
- `hook` "doesn't always" = fact 1 ("only 3%-9%", "most users wouldn't notice") + facts 2–3 (LCD). Never "doesn't save battery" or "is a myth".
- `glow` "that's an LCD screen": phones only. Mini-LED laptops and tablets with local dimming can show deep black too; keep laptops and TVs out of the film.
- `lamp` "Its backlight stays on, even for black." = Samsung Display's "LCD backlights are always on even when displaying black" (fact 3).
- `dip` "So dark mode can't switch it off." Our words, follows from fact 3. **Never "saves nothing" / "zero"**: no source measured LCD dark mode at exactly zero.
- `oled` / `pixels` = fact 3 ("emits light by itself and expresses black by turning off pixels"), fact 2.
- `indoor` "Purdue measured just 3 to 9 percent" = fact 1 ("saves only 3%-9% power on average"). Scope on screen ≥ 48 px: **PURDUE · 2021 · 4 ANDROID OLED PHONES · 30–50% BRIGHTNESS**.
- `sun` "39 to 47 percent" = fact 1 ("saves an average of 39%-47% battery power" at 100 % brightness). On screen ≥ 48 px: **AT 100% BRIGHTNESS · LESS POWER**. Never "your battery lasts 47 % longer".
- `end` "Does your black glow?" = the test from `test`; both answers are fair.

**Kept out on purpose (truth)**
- **Google's Android Dev Summit 2018 numbers.** The orchestrator asked for them. The source is a talk ("Cost of a pixel color (Android Dev Summit '18)", Nov 8, 2018, https://www.youtube.com/watch?v=N_6sPd0Jd3g), and YouTube blocked the transcript today (sign-in wall), so I couldn't read the slides. Secondary reports disagree: 9to5Google says YouTube dark mode gave "a 60% reduction of battery draw from the display"; a 2018 blog post says "up to 43%" while playing and "up to 60%" paused; Digital Trends says Maps night mode cut Pixel power "by 63%"; Android Authority gives 92 mA (Pixel) vs 230 mA (iPhone 7) in night mode. With four different numbers and no primary text, **none goes on screen or in the voice**. The current Android docs line (fact 5) stands in for Google.
- **"Saves battery" in hours.** Purdue gives power percentages, not hours; no line converts them.
- **Whether 39–47 % is display power or whole-phone power.** Purdue's release says "battery power"; the paper's tool isolates display power, and XDA and others read it as display power. Since I couldn't read the paper, the voice says only "39 to 47 percent" after "full brightness", and the screen says **LESS POWER** with Purdue's own words as a quote chip: **"…SAVES AN AVERAGE OF 39%-47% BATTERY POWER." · PURDUE, 2021**.
- **iPhone results.** Purdue tested Android phones only (fact 1: "studied only Android apps and phones"). The voice says "Purdue measured"; the screen scope says ANDROID.
- **Laptops.** The backlog angle mentions them; no source today tells a viewer which laptops are OLED, and the glow test misleads on mini-LED. Pinned comment only, phrased as "same rule: OLED or LCD".
- **Eye comfort.** Purdue's "easier on your eyes" bit is a second idea; cut.

## 4. Tension arc and shot ideas per line

Tension row: **4 3 4 3 2 1 3 4 3 5 5** (hook, ask, test, glow, lamp, dip, oled, pixels, indoor, sun, end). Opens on the setting the viewer trusts, climbs with the test they can do right now, drops to the low point at `dip` (on a gray-glow screen, dark mode can't touch the backlight: the meter needle doesn't move), rises with OLED, takes a small step back at `indoor` (the "Even then" turn), and ends on the payoff, the needle slamming to 39–47 at full sun, then the test handed back.

Dated cards (sound-off cuts that double as checkable facts): **PURDUE · 2021** at `indoor` (stays through `sun`), **LIGHTS OFF** at `test`, **IN THE SUN** at `sun`.

House look: ink-dark stage, cream type, one hot coral accent, chips, labels, peel strips. **Hero device varied** (coldbattery: coral stamp over a phone; airplanemode: a rule page; unlimiteddata: a label; notprivate: a door chain). This film's hero is a **power meter**: a big cut-paper analog dial (≥ 700 px wide, needle ≥ 300 px), the kind on a workbench, with its cord clipped to the phone's charging port. Scale printed **0 · 10 · 20 · 30 · 40 · 50 %  LESS POWER** (no brand, no watts).

**Native move for this film: lights out.** The whole stage is a room; a cut-paper wall switch flips, and the room's light drops from warm cream to near-ink in 0.3 s. What's left glowing is the phone's black. On LCD a gray halo of backlight leaks round the edges (a paper "lamp" behind cut blinds, visible through the screen like an X-ray); on OLED the black is a hole in the dark with a grid of tiny paper bulbs, the black ones unlit. The meter needle answers every switch. Generic phones only (round punch-hole, no notch, no logo; LESSONS battery); any settings screen is re-created and tagged.

| id | at | tension | Line | Shot |
|---|---|---|---|---|
| hook | 0.2 | 4 | "Dark mode doesn't always save battery." | **Frame 0, moving from frame 1:** a big generic phone (≥ 600 px tall) glides up ≥ 300 px; its screen is split: left half white, right half black (no UI, so no RE-CREATED tag needed). Above it: **DARK MODE** cream, **SAVES BATTERY?** coral chip = 4 words (count on the render). The meter's dial edge already peeks in at the bottom. **0.5 s gap after "battery."**: frame-0 hit (paper flick) as the black half slides over the white half (the setting flips) and the meter needle twitches but barely moves. |
| ask | 2.84 | 3 | "So does dark mode save battery on your phone?" | Typed search bar drops above the phone: **DOES DARK MODE SAVE BATTERY** (on screen by ~3 s, hold ≥ 1.5 s). The meter slides fully in under the phone, cord to the phone's port, needle at 0. |
| test | 6.46 | 4 | "Turn off the lights and open a black photo." | Native move begins: a cut-paper wall switch slaps in on the left; on "lights" it flips down and the room drops to ink (soft click in the gap). Card **LIGHTS OFF**. The phone's screen shows a full black photo. |
| glow | 10.07 | 3 | "If the black glows gray, that's an LCD screen." | The phone's black turns a visible gray glow (≥ 25 % cream, readable at 540 px; LESSONS noise r2). Label beside the phone (not on it): **GLOWS GRAY = LCD**. Small chip: **iPHONE 11 · LCD · 1400:1 · APPLE SPECS** (fact 4). |
| lamp | 13.69 | 2 | "Its backlight stays on, even for black." | X-ray peel: the screen's front lifts like a flap to show a paper lamp behind cut blinds; the blinds close for black, the lamp keeps burning, light leaks round the slats. Quote strip ≥ 40 px: **"LCD BACKLIGHTS ARE ALWAYS ON EVEN WHEN DISPLAYING BLACK" · SAMSUNG DISPLAY, 2021**. |
| dip | 16.59 | 1 | "So dark mode can't switch it off." | **Low point.** A paper hand flips a re-created dark-mode toggle (tag **RE-CREATED** ≥ 36 px) on and off twice; the lamp stays lit and the big meter's needle doesn't move. **0.6 s gap after "off."**: a dull flat buzz, the toggle droops. No ZERO or 0 % chip (we have no source for exactly zero). |
| oled | 19.69 | 3 | "But if it's pitch black, it's OLED." | Hard cut (the tear peels left with the second phone already drawn under it): a second generic phone in the same dark room, its black screen invisible against the ink but for its cream outline. Label beside it: **PITCH BLACK = OLED**. Chip: **iPHONE 17 · OLED · 2,000,000:1 · APPLE SPECS**. |
| pixels | 22.59 | 4 | "Every pixel is its own light, and black ones switch off." | Push in 1.0 → 1.25× into the OLED screen: a grid of paper bulbs (each ≥ 40 px); a wave of black sweeps across and the bulbs under it click off one row at a time (tick per row, in the 0.45 s gap after "off."). The meter needle climbs a little as they go dark. |
| indoor | 26.96 | 3 | "Even then, indoors, Purdue measured just 3 to 9 percent." | Room lights back on to a dim indoor level (brightness slider chip **30–50% BRIGHTNESS**). Dated card slaps: **PURDUE · 2021**. The meter needle swings to a narrow band marked **3–9%** and wobbles there. Scope line ≥ 48 px under the meter: **4 ANDROID OLED PHONES · 6 GOOGLE APPS**. Tick in the 0.5 s gap. |
| sun | 31.04 | 5 | "Full brightness, out in the sun? 39 to 47 percent." | **Hero.** A cut-paper sun swings in over the top; the brightness slider slams to **100%**; on "thirty-nine" the needle sweeps across the dial and **slams into a coral band 39–47%** (the only coral on screen besides frame 0's chip) with a meter clunk + paper slap in the **1.2 s silence after "percent."**. Quote chip ≥ 40 px: **"…SAVES AN AVERAGE OF 39%-47% BATTERY POWER." · PURDUE, 2021**. **Screenshot plate, hold ≥ 1.5 s with the line's caption through the silence:** the meter (≥ 700 px) with both bands lit, labels **INDOORS 3–9%** (cream) and **FULL SUN 39–47%** (coral band), **OLED · PURDUE 2021** under it. |
| end | 35.81 | 5 | "Does your black glow? Yes or no." | Frame 0's phone returns at full opacity; the room dims once more; **YES / NO** chips ≥ 110 px, both cream, neither highlighted, nothing on screen hinting at an answer (no glow drawn on the phone). Cut to frame 0 within 0.5 s of "no." |

Pacing: a new object every ≤ 1.2 s (switch, lamp flap, toggle, bulb rows, sun, slider); no still stretch over 1.0 s while the voice runs. Fill y 1000–1430 every second: the meter lives in the lower half for the whole film (it is the film's spine), phones sit above it. Coral only on frame 0's SAVES BATTERY? chip and the hero 39–47 band.

## 5. Open questions and truth risks for the director

1. **Length.** Formula 38.3 s, `dur` 38.6; expect 35–37 s. Over 39 s: drop "Even then," from `indoor`, then merge `lamp` + `dip`.
2. **The glow test must read with the sound off and must be honest.** The LCD glow is gray, not white: draw it at about 25–35 % cream so it reads at 540 px, and draw OLED black as true ink. Say nothing about laptops, tablets or TVs (mini-LED can look black). The test assumes a full-screen black photo; the `test` shot shows exactly that.
3. **No "zero".** `dip` shows a still needle, never a 0 % or NO SAVINGS chip; no source measured LCD dark mode at exactly zero.
4. **Scope Purdue every time its number shows:** **PURDUE · 2021 · 4 ANDROID OLED PHONES** shares the frame with 3–9 % and with 39–47 % (LESSONS gps, math r2). "LESS POWER", never "MORE HOURS" or "LONGER BATTERY".
5. **One hero number.** The hero is the 39–47 band; 3–9 stays cream and smaller (LESSONS gta-vicecity r2: one hero number per film, and the poster carries it). Poster: the meter plate after the slam, caption gone.
6. **Apple chips.** Use only the model names and the spec words "LCD" / "OLED" and contrast ratios as printed by Apple (fact 4). No Apple logo, no iPhone outline (draw generic phones); the chip text credits APPLE SPECS.
7. **Re-created toggle.** The dark-mode toggle in `dip` is ours, generic, tagged RE-CREATED ≥ 36 px; no iOS or Android look.
8. **Planned silences.** 0.5 s after `hook` (frame-0 flick), 0.6 s after `dip` (flat buzz), 0.45 s after `pixels` (bulb ticks), 0.5 s after `indoor` (needle tick), 1.2 s after `sun` (needle slam + screenshot hold). Keep them through re-timing.
9. **Ming risks.** "OLED" is in `say` as "O-LED" (Whisper should hear "OLED"; if it hears "oh led", that's fine for captions since they show `text`). "LCD" is "L C D" in `say`. "Purdue" is in `names`; it sits mid-line ("indoors, Purdue measured"), which LESSONS says Ming handles better than a line-initial name. Numbers spoken in `say`, digits in `text`. "Does your black glow?" may be heard as "Does your blackglow"; harmless.
10. **End-question test (LESSONS: log comments):** a self-check vote ("Does your black glow?"), new shape for the channel; the viewer must try it to answer, which is the comment driver. Log the comment count.
11. **Pinned comment idea (SEO):** "Purdue, 2021: at 30–50% brightness dark mode saved 'only 3%-9% power'; at 100% brightness 'an average of 39%-47%' (4 Android OLED phones, 6 Google apps). LCD screens keep their backlight on even for black. Laptops follow the same rule: check if yours is OLED or LCD in its specs. Checked Nov 14, 2026."
12. **End-card sources:** "Purdue University, Dash & Hu, MobiSys 2021 · Samsung Display, 2021 · Apple iPhone 11 & iPhone 17 specs · Android Developers · checked Nov 14, 2026".

## LESSONS applied (from factory/LESSONS.md, read 2026-11-14)

- **Phone myth, "your phone, right now" from frame 0** (orchestrator; coldbattery, airplanemode, deletephoto led views): the phone is on frame 0 and the viewer gets a test at 6 s.
- **Hook is the sources' own claim, scoped** (incognito r2, forceclose): "doesn't always" rests on Purdue's "only 3%-9%" and the LCD backlight; `oled` and `sun` give dark mode its real win.
- **Copy the hedge words** (stepbystep r1): "on average", "only", "at 100% brightness" stay on the chips.
- **One study is not "your phone"** (math r2): Purdue is named in the voice and scoped on screen (Android, 4 phones, brightness).
- **Don't date the film in the voice** (airplanemode): no "recently"; 2021 lives on the card.
- **Vary the hero device** (coldbattery, airplanemode, notprivate): a power meter, not a phone stamp, a label or a door.
- **Hero prop ≥ 700 px, props ≥ 160 px with ≥ 48 px type** (unlimiteddata, vision): the meter is the hero and stays in the lower half throughout.
- **Physical pass/fail event and a push** (notprivate): the needle that doesn't move (`dip`) and slams (`sun`); push into the bulb grid.
- **Labels beside the thing they name** (incognito r1, qrcode r2): GLOWS GRAY = LCD and PITCH BLACK = OLED sit beside their phones.
- **No "OK"/✓ chips, no zero chip** (airplanemode): §5.3.
- **End question not answered by the picture** (qrcode r1, voiceclone r3): §4 `end`.
- **Planned gaps for every hit** (detect polish, coldbattery): written in the script's `pause` values.

## Log
- 2026-11-14: researched and scripted. Backlog hook kept (6 words). Read Purdue's release (3%-9% at 30–50 %, 39%-47% at 100 %, auto-brightness ~30–40 % indoors), Apple's iPhone 11 (LCD, 1400:1) and iPhone 17 (OLED, 2,000,000:1) specs, Android's dark-theme doc, and Samsung Display's 2021 statement via Asia Economy. ACM PDF of the paper and the ADS 2018 talk transcript were both blocked (403, YouTube sign-in wall); the Google 2018 figures conflict across secondary reports and were left out. Added the lights-out glow test as the viewer's check. scriptlint: OK, no FAILs or WARNs.
