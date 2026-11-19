# Can a public USB charger steal your data?

Factory #36 · slug `juicejacking` · backlog row 41 · researched 2026-11-19. Channel: Tech, explained (not named in the script). American English, US audience, Ming US_James (seed 7, `"engine": "ming"`), **no music**, **no AI tag** anywhere (LESSONS, Not slop). 11 lines, 90 caption words. Chained `at` (2.8 w/s formula on written words plus pauses) gives `dur` 39.09 s; Ming reads about 0.92× the formula, but "2023", "FBI", "FCC" and "USB" are spoken longer than written, so **expect about 36–37 s**. If it comes back over 37 s, cut in this order: `lab` "have" → "Researchers pulled it off, in labs."; `fear` "The FBI said bad actors use USB ports to plant malware." → "Bad actors use USB ports for malware, it said." (9); `os` and `lab` pauses 0.8 → 0.65.

Shape copied from phonelistening (#33, our best recent start: 98 views at 25 min, 423 now): a belief turned over in the hook, the searched question, an authority that seems to confirm the fear (low point), the twist that the authority's own record has no case, a "check yours" on the viewer's own phone, a yes/no end line that loops into line 1.

## 0. Packaging score: 6/6 (PERFORMANCE.md §7)

| # | Mark | Score | Why |
|---|---|---|---|
| 1 | Mine | 1 | The phone they plug into an airport, hotel or mall USB port; holiday travel is next week (Thanksgiving, Nov 26, 2026). |
| 2 | Myth / threat | 1 | Breaks "public USB chargers steal your data", a belief the FBI's and FCC's own 2023 warnings planted. Keeps the real threat honest: it has been shown in labs. |
| 3 | Frame-0 test | 1 | A phone on an airport kiosk with a re-created prompt **TRUST THIS COMPUTER?** and two blank buttons: the viewer decides in the first second whether they'd tap. |
| 4 | Takeaway | 1 | At a public port never tap Trust or Allow; or use your own wall plug (FBI's own advice). |
| 5 | Title | 1 | **"Public USB Chargers Probably Aren't Hacking You 🤔"** (7 words, thing in words 1–3, consequence verb). |
| 6 | Searched | 1 | "juice jacking", "is juice jacking real", "are public charging stations safe", "airport charger steal data" are stock queries (news cycle every travel season; TSA repeated it in 2025). Volume not measured (no Semrush run). |

**Main search phrase:** `juice jacking` (spoken in `ask` "So, is juice jacking real?", about 3.0–4.8 s; on screen by ~3 s as a typed search bar **IS JUICE JACKING REAL**, hold ≥ 1.5 s). SEO also captions "public USB charger", "airport charging station", "Trust This Computer".

**DM-able moment:** `twist`: **THE WARNING NAMED NO CASE.** The FBI post and the FCC page side by side, a coral empty "CASES" slot under each. "The FBI told everyone to avoid airport chargers and never named one real case" is what people send to the friend who carries a USB blocker.

**Title ideas (one emoji each, from 🤔 😮 😱):**
1. **Public USB Chargers Probably Aren't Hacking You 🤔** (chosen; "probably" is the hedge, it is the hook)
2. **Airport Chargers Probably Aren't Stealing Your Data 😮**
Never "Aren't Stealing" without "Probably": that would claim it can't happen (see §3b).

## 1. Topic and one hard idea

**The FBI and the FCC warned that public USB chargers can plant malware, but neither names a confirmed case (the FCC says it knows of none, only proofs of concept); your phone asks before any data moves, so at a public port never tap Trust or Allow.**

**Backlog hook rewritten.** "That airport charger probably isn't hacking you." is 8 words; the house limit is 6. Plural and shorter: **"Airport chargers probably aren't hacking you."** (6). Keeps "probably" (the hedge) and loops from the end line ("…on a public port? Yes or no." → "Airport chargers probably aren't hacking you.").

## 2. Hook options

1. **"Airport chargers probably aren't hacking you."** (chosen, 6 words) The belief turned over, a place every traveler pictures, hedged honestly, same shape as phonelistening's "Your phone probably isn't listening."
2. "The FBI warning had no case." (6, rejected for line 1) Strong, but it's the twist; frame 0 would give the answer away (LESSONS: frame 0 shows the conflict, never the answer). Used as `twist`.
3. "Would you tap Trust here?" (5, rejected) A pure test, but it hides the myth; it lives in frame 0's picture and the end question instead.

## 3. Facts used

Read **2026-11-19**. Quotes are word for word; "…" marks each cut.

| # | Fact (quote) | Line | Source | How read |
|---|---|---|---|---|
| 1 | **FBI Denver** on X, **April 6, 2023**: "Avoid using free charging stations in airports, hotels or shopping centers. Bad actors have figured out ways to use public USB ports to introduce malware and monitoring software onto devices. Carry your own charger and USB cord and use an electrical outlet instead." No case, place, date or victim is named in the post. | warn, fear, twist, wall | https://x.com/FBIDenver/status/1643947117650538498 | x.com returns 402 to fetchers; text and date read from X's own oEmbed endpoint (publish.x.com/oembed for that URL), curl, 2026-11-19. |
| 2 | **FCC**, "'Juice Jacking': The Dangers of Public USB Charging Stations" / "What is 'Juice Jacking' and Tips to Avoid It" (first published 2019, **updated April 27, 2023**): "Although "juice jacking" has been demonstrated to be technically possible as a proof of concept, the FCC is not aware of any confirmed instances of it occurring." The same page advises AC outlets, your own battery or charge-only cable, and choosing "charge only" if a device asks about sharing data or trusting a computer. | warn, twist, lab | https://www.fcc.gov/juice-jacking-tips-to-avoid-it (also indexed as https://www.fcc.gov/node/234682; older URL https://www.fcc.gov/juice-jacking-dangers-public-usb-charging-stations) | **⚠ Not fetched live.** fcc.gov returned **HTTP 403 (Akamai Access Denied)** to curl and WebFetch on 2026-11-19, as it did for airplanemode on 2026-11-11. The sentence was read from two search engines' index of the fcc.gov page (an exact-phrase search for "is not aware of any confirmed instances" restricted to fcc.gov returns this page first); update date "Thursday, April 27, 2023" from the same index and Wikipedia's citation. **Orchestrator: open the page in a normal browser before the render and confirm the sentence is still there word for word.** If it has changed, fall back to the FBI-only twist (see §5 q1). |
| 3 | **Apple**, "About the 'Trust This Computer' alert message on your iPhone, iPad, or iPod touch" (**Published Date: December 04, 2025**): "When you connect your iPhone, iPad, or iPod touch to a computer or other device for the first time, an alert message asks whether you trust the computer" · "Trusted computers can sync with your device and access your device's photos, videos, contacts, and other content." · "If you choose not to trust a computer, you block its access to content on your device." · "If you don't want to trust the computer or other connected device, tap Don't Trust on your device." · Reset: Settings › General › Transfer or Reset [Device] › Reset › Reset Location & Privacy. | asks, os, never | https://support.apple.com/en-us/109054 (old HT202778 redirects here) | curl, tags stripped |
| 4 | **Google**, Android Help "Transfer files between your computer & Android device": "With a USB cable, connect your device to your computer. On your device, tap the "Charging this device via USB" notification. Under "Use USB for," select File Transfer." · "Important: Some of these steps only work on Android 14 and up." | asks, os | https://support.google.com/android/answer/9064445?hl=en | curl, tags stripped |
| 5 | **Google**, Android Help "Protect your Android device from USB threats with Advanced Protection Mode": "When you connect a USB device, you may receive notifications that'll prompt you to unlock your screen and allow data transfer through USB." · "While the screen is locked, this prevents establishment of a USB data connection." · "Charging through USB continues to function even with a locked screen." · "This feature is available on Pixel 6 and later devices." · "No protection when the device is unlocked" | never ("Allow"), §3b | https://support.google.com/android/answer/16778864?hl=en | curl, tags stripped |
| 6 | **Draschbacher, Maar, Oberhuber, Mangard (Graz University of Technology)**, "ChoiceJacking: Compromising Mobile Devices through Malicious Chargers like a Decade ago", **USENIX Security 2025**: "…mobile OSs introduced user prompts for confirming data connections from a USB host to a mobile device." · "ChoiceJacking, which is the first to bypass existing JuiceJacking mitigations." · "…allow a malicious charger to autonomously spoof user input to enable its own data connection." · "…on all tested devices from 8 vendors including the top 6 by market share." · "All but one (including Google, Samsung, Xiaomi, and Apple) acknowledged our attacks and are in the process of integrating mitigations." | lab, §3b | https://www.usenix.org/conference/usenixsecurity25/presentation/draschbacher | curl, tags stripped |
| 7 | **Apple**, "About the security content of iOS 18.4 and iPadOS 18.4", MobileLockdown: "Impact: An attacker with a USB-C connection to an unlocked device may be able to programmatically access photos" · "This issue was addressed with improved authentication." · "CVE-2025-24193: Florian Draschbacher". Listed for **iPad** models only. | §3b only (not voiced) | https://support.apple.com/en-us/122371 | curl, tags stripped |

**Wording choices tied to sources**
- `hook` "Airport chargers probably aren't hacking you.": facts 1, 2 (no confirmed case). "Probably" stays; never "can't" or "aren't". Chip at ~1.5 s, held to 5 s: **NO CONFIRMED CASE ON RECORD · FCC**.
- `ask` "So, is juice jacking real?": the searched phrase. The answer the film gives: real in labs, no confirmed case.
- `warn` "In 2023, the FBI and FCC warned about it.": fact 1 (FBI Denver, Apr 6, 2023) and fact 2 (FCC update Apr 27, 2023). Scope chip: **FBI DENVER (A FIELD OFFICE) · APR 6, 2023** and **FCC · UPDATED APR 27, 2023**. The voice says "the FBI"; the chip must say Denver.
- `fear` "The FBI said bad actors use USB ports to plant malware.": fact 1. Quote chip, word for word: **"BAD ACTORS HAVE FIGURED OUT WAYS TO USE PUBLIC USB PORTS TO INTRODUCE MALWARE…" · FBI DENVER, 2023**. "Plant" is our spoken word for "introduce"; the chip carries the FBI's own word.
- `twist` "But neither named a confirmed case.": fact 1 (the post names none; checkable by anyone) and fact 2 ("not aware of any confirmed instances"). Quote chip **"…THE FCC IS NOT AWARE OF ANY CONFIRMED INSTANCES OF IT OCCURRING." · FCC**. Never "it never happened" or "it's a hoax".
- `lab` "Researchers have pulled it off, in labs.": fact 2 ("demonstrated to be technically possible as a proof of concept") and fact 6 (2025 lab attack on all 8 tested vendors). Chip **IN THE LAB · TU GRAZ · USENIX 2025**.
- `asks` "And your phone asks before it shares data.": fact 3 (alert asks whether you trust), fact 4 (pick File Transfer), fact 6 ("user prompts for confirming data connections"). It is a description of the design, not a promise it can't be beaten (§3b rule 3).
- `os` "iPhone shows Trust This Computer? Android waits for File Transfer.": facts 3 and 4. "Waits" = data waits until you choose File Transfer.
- `never` "At a public port, never tap Trust or Allow.": fact 3 ("tap Don't Trust"), fact 5 ("allow data transfer through USB"), fact 2 (choose "charge only"). The answer is **DON'T TRUST** (Apple's own button label).
- `wall` "Or skip the port. Use your own wall plug.": fact 1 ("Carry your own charger and USB cord and use an electrical outlet instead"), fact 2 (AC outlets).
- `end` "Ever tapped Trust on a public port? Yes or no.": the viewer's own memory; nothing on screen answers it.

## 3b. Truth rules for the director and jury (check every frame)

**What may be said and shown**
1. **"No confirmed case on record"**, credited to the FCC, is the only strength allowed. Never "impossible", "safe", "a myth", "a hoax", "fake", "never happened", "can't hack you". No ✓ SAFE stamp on any charger or port. The hook's "probably" must also appear on screen if the hook is printed (**PROBABLY**).
2. **It is real in the lab.** At `lab`, the film must show that researchers made it work (fact 6: a 2025 lab charger beat the prompt on all 8 tested brands). Don't hide this to make the twist cleaner; it's what keeps "probably" honest.
3. **The prompt is a lock, not a guarantee.** `asks`/`os` describe how phones are designed. No chip may say "THE PROMPT STOPS IT" or "PROTECTED". Fact 6 showed a charger can fake the tap in a lab; if the director adds one fine-print line at `lab` or `asks`, it reads **A 2025 LAB CHARGER FAKED THE TAP · VENDORS ADDING FIXES · TU GRAZ**. Never claim a specific OS version fixes it (Apple's listed fix, fact 7, is iPad-only and about photos).
4. **FBI scope.** It was one post from the **FBI's Denver field office** on X, not an FBI-wide alert, report or bulletin. Show it as a re-created social post card (no X logo, no real avatar), tagged **RE-CREATED · FBI DENVER ON X · APR 6, 2023**.
5. **"Neither named a case" is about their warnings**, not about the whole world. Don't extend it to "no one has ever found one" (we can't prove a negative). Show it as two empty **CASES:** slots under the two warnings.
6. **Quotes word for word, "…" at every cut.** FBI: "introduce malware", never "plant malware" in quotes. FCC: the sentence as in fact 2. Apple's button is "Don't Trust"; the prompt title is "Trust This Computer?". If the FCC page can't be confirmed in a browser before render, drop the FCC quote chip and keep only the FBI's empty CASES slot (see §5 q1).

**Scope per OS**
7. **iPhone:** the "Trust This Computer?" alert appears the first time you connect to "a computer or other device" (fact 3). Don't say it appears for every charger: a plain power outlet or charge-only cable shouldn't bring it up (inferred from fact 3's wording; keep it out of the voice).
8. **Android:** Google's steps (fact 4) are for Android and "only work on Android 14 and up"; menus vary by maker. Chip: **ANDROID 14+ · MENUS VARY BY MAKER · GOOGLE HELP**. The "unlock and allow" prompt quoted from fact 5 is Google's **Advanced Protection USB Protection, Pixel 6 and later**; if "ALLOW" is shown as an Android prompt, tag it **PIXEL · ADVANCED PROTECTION**, or show "Allow" only as a generic word chip, not as a screen.
9. **Samsung, others:** no primary source read in this run; don't draw a Galaxy screen.

**Re-created screens and no real UI or logos (LESSONS strawberry, notprivate, battery)**
10. Every phone prompt, notification and post is **re-created** in the house look (ink stage, cream type, coral accent), tagged **RE-CREATED** ≥ 36 px. No Apple, Google, Android, X, FBI or FCC logos or seals; agencies appear as cream text chips. Generic phones only, no notch shapes copied from a model.
11. The iPhone prompt shows only the title **Trust This Computer?** and two buttons **Trust** / **Don't Trust**. Don't invent body text. The Android card shows only **"Charging this device via USB"** and a **Use USB for** list with **File Transfer** as one row; don't add rows Google's page doesn't name (LESSONS hotcharging: a re-created screen shows only what the quote explains).
12. No airport brand, airline or real airport name; a generic kiosk labeled **FREE CHARGING**.
13. No hacker in a hoodie, skull, or glowing code: scare imagery would contradict the twist. The malware in `fear` is a coral paper bug icon labeled **MALWARE (CLAIMED)**, never shown entering a phone.

**Kept out on purpose**
- The 2019 LA County DA warning and news-cycle criticism (Slate, Ars Technica, Krebs): secondary sources; not needed.
- "USB data blockers" product advice: no primary source in this set; the FCC's "charge-only cable" is enough if a chip wants it.
- The TSA's 2025 social post: only read through secondary reporting.

## 4. Tension arc and shot ideas per line

Tension row: **4 3 3 1 4 3 3 3 4 4 5** (hook, ask, warn, fear, twist, lab, asks, os, never, wall, end). Opens on the belief turned over, asks the searched question, builds the fear with the FBI's words, bottoms out when the bug icon sits on the port (the myth wins), turns on the empty CASES slots, admits the lab result, hands over the prompt and the check, and ends on the viewer's own memory.

Time cards (sound-off follow): **2019 → 2023** at `warn` (FCC first published 2019, both warnings 2023), **2025** at `lab` (the ChoiceJacking paper), **TODAY** at `asks`. All are checkable dates.

**Hero object (new, vary from the tap, the meter and the cold dial): a paper airport charging kiosk.** A tall cut-paper pillar (≥ 700 px) with a **FREE CHARGING** header and four USB ports; one cable runs into a generic phone in the foreground. The cable is the film's thread: a coral current line flows phone-ward (power), and a dashed cream "data lane" runs alongside it, **closed by a paper gate at the phone end**.

**Native move: the gate.** The prompt is drawn as a gate on the data lane. It stays shut (power still flows) through `fear`, swings to show the question at `asks`, and at `never` the viewer's finger hovers, the coral **DON'T TRUST** gets pressed and the gate slams shut with the power line still flowing. At `end` the gate is back in frame 0's state, unanswered.

**Layout changes (two across the middle third, LESSONS darkmode):**
- **A (0–9 s) the kiosk close-up:** phone and prompt big, kiosk behind.
- **Change 1 at `warn` (~5.4 s): the evidence wall.** Camera pulls back; two re-created cards pin up beside the kiosk: the FBI Denver post and the FCC page header, each with an empty **CASES:** slot under it.
- **Change 2 at `asks` (~20 s): inside the cable.** Push into the cable: power lane and data lane side by side, gate at the phone end; then the two re-created prompts (iPhone, Android) drop in as the gate's two faces.
- **C at `end`:** back to frame 0's kiosk.

| id | at | tension | Line | Shot |
|---|---|---|---|---|
| hook | 0.2 | 4 | "Airport chargers probably aren't hacking you." | **Frame 0, moving from frame 1:** phone slides ≥ 300 px onto the kiosk cable; the re-created prompt **TRUST THIS COMPUTER?** (3 words, "?" coral) with two blank button shapes, tag **RE-CREATED** (4th word). Kiosk header **FREE CHARGING** arrives at ~0.6 s (after frame 0). On "probably" (~1.6 s): chip **PROBABLY · NO CONFIRMED CASE ON RECORD · FCC** ≥ 40 px, held to 5 s. 0.7 s gap: dry tick as the cable seats. |
| ask | 3.04 | 3 | "So, is juice jacking real?" | Typed search bar drops in: **IS JUICE JACKING REAL**, hold ≥ 1.5 s. Power dashes start flowing up the cable; data lane dashed, gate shut. |
| warn | 5.38 | 3 | "In 2023, the FBI and FCC warned about it." | **Layout change 1.** Date card **2019 → 2023** flips. Re-created FBI Denver post card pins left (**RE-CREATED · FBI DENVER ON X · APR 6, 2023**), FCC page header pins right (**FCC · UPDATED APR 27, 2023**). Empty **CASES:** slots under each, dashed. |
| fear | 9.09 | 1 | "The FBI said bad actors use USB ports to plant malware." | **Low point.** Quote chip from the FBI card: **"BAD ACTORS HAVE FIGURED OUT WAYS TO USE PUBLIC USB PORTS TO INTRODUCE MALWARE…"**. A coral paper bug icon (**MALWARE (CLAIMED)**) drops onto the kiosk port and sits there; the data lane flickers. 0.8 s gap: low thump. |
| twist | 13.82 | 4 | "But neither named a confirmed case." | Both **CASES:** slots stamp **NONE NAMED** in cream (the slots have been up since 5.4 s, LESSONS 5gbattery/hotcharging slot rule); FCC quote chip **"…THE FCC IS NOT AWARE OF ANY CONFIRMED INSTANCES OF IT OCCURRING."**. The bug icon is lifted off the port and pinned to the wall as **CLAIM**. 0.65 s gap: paper slap. **DM frame.** |
| lab | 16.61 | 3 | "Researchers have pulled it off, in labs." | Date card **2025**. A small paper lab bench with a homemade charger box; the bug icon walks through the gate here, inside a dashed **LAB** frame only. Chip **IN THE LAB · TU GRAZ · USENIX SECURITY 2025** (+ optional fine print rule 3). Screenshot hold ≥ 1.5 s across the 0.8 s pause. |
| asks | 19.91 | 3 | "And your phone asks before it shares data." | **Layout change 2.** Card **TODAY**. Push into the cable: power lane flowing, data lane blocked by the gate at the phone. Gate label **ASKS FIRST**. |
| os | 23.27 | 3 | "iPhone shows Trust This Computer? Android waits for File Transfer." | Gate's two faces: re-created iPhone alert **Trust This Computer?** / **Trust** / **Don't Trust** (RE-CREATED · iPHONE), then re-created Android card **"Charging this device via USB"** → **Use USB for: File Transfer** (RE-CREATED · ANDROID 14+ · MENUS VARY BY MAKER). Nothing selected. 0.8 s gap: soft click. |
| never | 27.64 | 4 | "At a public port, never tap Trust or Allow." | Back on the kiosk. A paper finger hovers over **Trust**, swings to **Don't Trust** (coral), presses; the gate slams shut; power dashes keep flowing. Chip **CHARGING STILL WORKS**. Word chips **TRUST ✕ · ALLOW ✕**. 0.6 s gap: gate thunk. |
| wall | 31.46 | 4 | "Or skip the port. Use your own wall plug." | Cable unplugs from the kiosk (paper pop) and a cut-paper brick charger with its own cord plugs into a wall outlet beside it. Credit **"…USE AN ELECTRICAL OUTLET INSTEAD." · FBI DENVER**. |
| end | 35.37 | 5 | "Ever tapped Trust on a public port? Yes or no." | Back to frame 0's kiosk and prompt, buttons blank again. **YES / NO** chips ≥ 110 px, both cream, neither highlighted. Cut to frame 0 within 0.5 s of "no." |

Pacing: a new object every ≤ 1.2 s (phone, prompt, kiosk header, chip, search bar, dashes, date card, two cards, slots, quote, bug, stamps, lab bench, gate, two prompts, finger, slam, brick, outlet). Coral only on frame 0's "?", the bug icon, Don't Trust and the power line.

## 5. Open questions and truth risks for the director

1. **FCC page not fetched live (403).** The FCC sentence comes from search-engine indexes of fcc.gov. Before the render, the orchestrator or Isac should open https://www.fcc.gov/juice-jacking-tips-to-avoid-it in a normal browser and confirm "the FCC is not aware of any confirmed instances of it occurring" word for word. If it's gone or changed, drop the FCC quote chip, stamp only the FBI slot **NONE NAMED**, and change `twist` to "But the FBI post named no case." (7 words).
2. **The "Trust" prompt as the hero.** It is a re-created generic dialog, never Apple's styling. If the jury reads frame 0 as a real iOS screenshot, make it a paper card with a coral border.
3. **The lab line must not undo the twist.** Keep `lab` short and boxed in the dashed LAB frame; the bug never crosses the gate outside that frame.
4. **No answer on the end card:** the buttons stay blank, the finger is gone.
5. **Planned silences:** 0.7 s after `hook` (tick), 0.8 s after `fear` (thump), 0.65 s after `twist` (slap), 0.8 s after `lab` (screenshot hold, no hit), 0.8 s after `os` (click), 0.6 s after `never` (gate thunk), 0.7 s after `wall` (pop). Hits at line end + 0.3 s, margin 0.2 (LESSONS phonelistening), capped at ~.05 gain in gaps (LESSONS hotcharging).
6. **Ming risks.** `say` spells "F B I", "F C C", "U S B" and "twenty twenty-three"; check Whisper hears "FBI", not "F.B. eye". "Trust This Computer?" mid-line: if Ming runs it into "Android", split `os` into two lines (`iphone` / `android`) rather than adding commas. "juice jacking" is two plain words; add to `names` only if Whisper mishears.
7. **Length.** Formula 39.09 s on written words; expect about 36–37 s. Cut order at the top.
8. **Frame 0 ≤ 4 words** (TRUST THIS COMPUTER? + RE-CREATED = 4; FREE CHARGING and the PROBABLY chip arrive later). Count on the render.

## Log
- 2026-11-19: researched and scripted. Read FBI Denver's X post via X's oEmbed (Apr 6, 2023), Apple 109054 (Dec 4, 2025), Google Android Help 9064445 and 16778864, USENIX Security 2025 ChoiceJacking abstract, Apple iOS 18.4 security notes (122371). fcc.gov returned 403 to every fetch; the FCC sentence is from search indexes and must be confirmed in a browser (§5 q1). Backlog hook cut to 6 words ("Airport chargers probably aren't hacking you."). Added the lab line because the 2025 paper beat the Trust prompt on all 8 tested brands; leaving it out would make "probably" dishonest. Backlog todo rows = 3, so no new topics added. scriptlint: OK, no FAILs or WARNs.
- 2026-11-19: FCC page disabled by its owner (checked in a browser); FBI-only twist per §5 q1.
