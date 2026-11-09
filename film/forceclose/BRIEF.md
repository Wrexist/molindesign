# Force close: does closing apps save your battery?

Factory #25 · slug `forceclose` · backlog row 29 · researched 2026-11-08. Channel: Tech, explained (not named in the script). American English, US audience, Ming US_James (seed 7, `"engine": "ming"`), no music, **no AI tag** (LESSONS, Not slop, 2026-11-03). Target 29–40 s; 13 lines, 98 words, expected about 38–40 s (memory read 103 words in 39.4 s, battery 99 in 40.0 s).

## 0. Packaging score: 6/6 (PERFORMANCE.md §7)

| # | Mark | Score | Why |
|---|---|---|---|
| 1 | Mine | 1 | Everyone with a phone has swiped apps out of the app switcher this week. |
| 2 | Myth / threat | 1 | Breaks a habit-belief ("closing apps saves battery") in six words; Apple republished the page that says otherwise on Oct 15, 2026, so it isn't an already-fixed myth (strawberry lesson). |
| 3 | Frame-0 test | 1 | The viewer can open their own app switcher right now and see the stack of cards; frame 0 is that stack. |
| 4 | Takeaway | 1 | Stop swiping; check Settings › Battery (iPhone) or Settings › Battery › Battery usage (Pixel); close only the frozen or hogging app. |
| 5 | Title | 1 | **"Closing Apps Won't Save Your Battery 🤔"**: the thing in the first two words, 6 words, Title Case, one emoji, consequence verb "Won't Save". |
| 6 | Searched | 1 | "does closing apps save battery" / "should I close apps on iPhone" is a long-running question with dedicated Apple and press pages. I did **not** check search volume (no Semrush run); score assumes it. |

Same shape as incognito (6) and battery (6): the hook is close to the source's own sentence and the proof is the maker's own page. Risk to the score: it sits next to `battery` on the same channel; the angle (a habit, not wear) is different, and the end question differs.

**Main search phrase: `closing apps battery`** (spoken in line 1 at 0.2 s: "Closing your apps won't save battery"). Show **CLOSING APPS** and **BATTERY** on frame 0. Secondary for SEO: `does closing apps save battery`, `should I close apps on iPhone`, `force close apps battery`, `swipe away apps battery`, `iPhone battery draining fast`.

**DM-able moment:** `email` → `answer`: a fan asked Tim Cook if he quits his apps and whether it's needed for battery, and Apple's software chief wrote back "no and no." It's the line people send to the friend who swipes everything away.

## 1. Topic and one hard idea

**Swiping apps out of the app switcher doesn't save battery: those apps are mostly paused, and an app you swipe away has to restart from scratch next time, which is more work, not less.** What does cost battery is the screen, a weak signal and background activity, and the phone already shows you which app uses what.

**The backlog hook was changed.** "Closing your apps is draining your battery" overclaims. Apple says closing all apps "does not impact" performance; it does not say closing drains the battery. The only first-party "worse" statement is Google's Android chief in 2016, and he said it "could very slightly worsen". The film says "won't save battery" (Apple) and "more work, not less" (Android's own developer docs), and never "drains" or "hurts".

**Scope, said in the film:** closing is right for an app that is **frozen** (Apple: "only if it's unresponsive") or **hogging battery** (Google Pixel Help tells you to restrict or force stop apps with high battery use). Line `scope`.

## 2. Hook options

1. **"Closing your apps won't save battery."** (chosen, 6 words) The belief turned over, matching Apple's page; contains the search phrase; true as stated for apps sitting in the switcher.
2. "Closing your apps is draining your battery." (backlog hook, rejected) 7 words and an overclaim: no primary source says closing drains the battery. Lockheimer's "could very slightly worsen" is a 2016 tweet with a big hedge; leading with it would be the math r1 mistake.
3. "Stop swiping your apps away." (backup, 5 words) An order with a stake, good as a YouTube title variant ("Stop Swiping Your Apps Away 🤔"), but it hides the battery keyword from the first second.

## 3. Facts used

All read 2026-11-08. Quotes are word for word from the page as fetched (curl of the live page), except where marked "as reported".

| # | Fact | Line | Source |
|---|---|---|---|
| 1 | "If an app won't respond or seems frozen, you can close it, then open it again." / "You should close an app only if it's unresponsive." | apple, scope | Apple Support, "Close an app on your iPhone or iPod touch", **Published Date: October 15, 2026**: https://support.apple.com/en-us/109359 |
| 2 | "If your iPhone seems to run slowly or its battery-life drains too quickly, closing all of your apps does not impact your device's overall performance. Recently used apps only use resources and power when they're active or when they're performing specific background tasks or services." | hook, paused | same page (fact 1) |
| 3 | **As reported:** in March 2016 an iPhone user (Caleb) emailed Tim Cook asking whether Cook quits his multitasking apps and whether doing so is necessary for battery life; **Craig Federighi**, Apple's senior VP of Software Engineering, replied **"no and no."** The email is only published as a screenshot; I could not read its full text, so only "no and no" is quoted. | email, question, answer | 9to5Mac, Benjamin Mayo, "Apple's software SVP says quitting multitasking apps not necessary, won't offer improved battery life", Mar 10, 2016: https://9to5mac.com/?p=422403 · MacRumors, Mitchel Broussard, "Apple Reiterates: Force Quitting iOS Apps Doesn't Help Battery Life", Mar 10, 2016: https://www.macrumors.com/2016/03/10/force-quitting-apps-doesnt-help-battery/ |
| 4 | **As reported:** Hiroshi Lockheimer (then Google SVP of Android, Chrome, ChromeOS & Play, Oct 2015–Apr 2024 per Wikipedia), tweet of Mar 14, 2016, on whether killing apps helps battery: "could very slightly worsen unless you and algorithm are ONE (you kill something, system wants it back etc)" | work (chip only) | Techlicious, Elmer Montejo, "Closing Apps Can Hurt Battery Life", Mar 17, 2016: https://www.techlicious.com/blog/closing-apps-to-save-battery-bad-for-phone-tablet/ (tweet embedded; I couldn't open X directly) · title: https://en.wikipedia.org/wiki/Hiroshi_Lockheimer |
| 5 | Android cold start: "In a cold start, your app starts from scratch." "Cold starts happen in cases such as your app launching for the first time since the device booted or since the system killed the app." "This type of start presents the greatest challenge to minimizing startup time, because the system and app have more work to do than in the other launch states." Hot start: "the system brings your app's host activity to the foreground. If all of your app's UI is still resident in memory, then the app can avoid repeating object initialization, UI initialization, and rendering." | scratch, work | Android Developers, "App startup time": https://developer.android.com/topic/performance/vitals/launch-time (undated) |
| 6 | Android cached apps: "A well-running system has multiple cached processes always available, for efficient switching between applications, and regularly kills the cached apps as needed." "Since cached processes can be killed by the system at any time, apps should cease all work while in the cached state." | paused | Android Developers, "Processes and app lifecycle": https://developer.android.com/guide/components/activities/process-lifecycle (undated) |
| 7 | Drains. "There are two simple ways you can preserve battery life — no matter how you use your device: adjust your screen brightness and use Wi‑Fi." "Background Activity. This indicates that the battery was used by the app while it was in the background — that is, while you were using another app." "No Cell Coverage and Low Signal. This indicates either that you are in a poor cell coverage area and your iOS device is searching for a better signal or that you've used your device in low-signal conditions, which has affected your battery life." "Location and Background Location. This indicates that the app is using location services." | drains | Apple, "Maximizing Battery Life and Lifespan": https://www.apple.com/batteries/maximizing-performance/ (undated, © 2026) |
| 8 | iPhone check: "Open Settings. Tap Battery. Tap View All Battery Usage to view the battery usage percentage over the last eight days." Also: "you can see the proportion of your battery used by each app (unless the device is charging). To view your usage, go to Settings > Battery." | check | Apple Support, "Check battery usage on your iPhone", **Published Date: March 25, 2026**: https://support.apple.com/en-us/102432 · Apple maximizing page (fact 7) |
| 9 | Pixel check and the hogging case: "If your phone's battery life seems poor or short, it could be that a downloaded app uses too much battery." Heading "How do I close apps that use the most battery?"; "Step 1: Restrict apps that use the most battery"; path "Battery › Battery usage", "View by apps"; "Select the app › Force stop › OK". Warning: "If you force stop some essential apps or services, your phone won't work correctly." | check, scope | Google Pixel Phone Help, "Fix battery drain problem": https://support.google.com/pixelphone/answer/6090599?hl=en (undated, © 2026) |
| 10 | Pixel drains: "Reduce screen brightness", "Let your screen turn off sooner", "Reduce background battery drain". | drains | Google Pixel Phone Help, "Get the most life from your Pixel phone battery": https://support.google.com/pixelphone/answer/6090612?hl=en (undated, © 2026) |

**Wording choices tied to sources**
- `hook` says "**won't save** battery", Apple's "does not impact" in plain words. Never "drains", "kills" or "hurts".
- `apple` uses Apple's own word "**unresponsive**". On screen print the full sentence in quotes: "You should close an app only if it's unresponsive." with **APPLE SUPPORT · OCT 15, 2026** and a RE-CREATED tag.
- `paused` says "**most**" of those apps are paused, because Apple allows "specific background tasks or services" and music or navigation keep running. Never "zero power" or "not running". If the jury pushes, the chip under it is Apple's own clause: "ONLY USE … POWER WHEN THEY'RE ACTIVE OR … PERFORMING SPECIFIC BACKGROUND TASKS" (with both "…").
- `scratch` / `work`: "restarts from scratch" and "more work" are Android Developers' own words (fact 5). That page is about **startup time**, not battery; the voice says "more work", not "more battery". The battery link sits on a small chip, credited and dated: **GOOGLE'S ANDROID CHIEF, 2016: "COULD VERY SLIGHTLY WORSEN"** (keep "very slightly"; LESSONS: copying the hedge exactly).
- `email` / `question`: the question is a paraphrase from 9to5Mac/MacRumors, so on screen it is **not** in quote marks. Only "No and no." is a quote. The re-created email carries **RE-CREATED · AS REPORTED BY 9TO5MAC, MAR 10, 2016**. Don't draw Apple logos or invent the email's other text.
- `answer`: "Apple's software chief" = Craig Federighi, SVP of Software Engineering (MacRumors). Show his name on the card (FEDERIGHI · APPLE SVP SOFTWARE).
- `drains` lists only what Apple's page names: a bright screen, low signal, background activity. Apple doesn't rank them; the voice says "what drains it", not "the biggest drains".
- `check`: "Settings, Battery" is the iPhone path. On screen, two chips: **iPHONE: SETTINGS › BATTERY** and **PIXEL: SETTINGS › BATTERY › BATTERY USAGE** (Samsung's path not verified; keep it off screen).
- `scope`: "frozen" = Apple's "unresponsive"; "hogging it" = Google's "apps that use the most battery". On iPhone Apple's fix for a background hog is turning off Background App Refresh or Location for that app, not swiping it; put **OR TURN OFF ITS BACKGROUND REFRESH** small under the line if room (see Open question 3).

**Kept out on purpose**
- **"Closing apps drains your battery"** as a fact (only a hedged 2016 tweet supports "slightly worse").
- **Any number** for how much battery a relaunch costs. No first-party source gives one; press pieces that quote percentages are secondhand.
- **"Closing apps slows your phone down."** Some press says so; Apple's page only says closing "does not impact" performance.
- **Android OEM task killers / Samsung's "Close all"** behavior; not sourced.
- **Location as a reason to close** (the orchestrator's example): Apple's fix is turning Location Services off for the app (fact 7), not closing it. Not in the voice.

## 4. Tension arc and shot ideas per line

Tension row: **4 3 3 2 1 2 3 3 4 4 4 4 5**. The dip is `scratch` (the viewer's own habit backfires); it climbs through the 2016 story to the payoff end question.

House look: ink-dark stage, cream type, one hot coral accent, chips, labels, one hero stamp. **Native move for this film: the card flick.** App cards are hand-cut paper rectangles on a string-line "switcher"; swiping one flings it up off frame, and its relaunch is a paper card rebuilt piece by piece (the "from scratch" picture). Generic drawn phone, round punch-hole, no logos or real UI.

| id | at | tension | Line | Shot |
|---|---|---|---|---|
| hook | 0.2 | 4 | "Closing your apps won't save battery." | Frame 0, moving from frame 1: a fan of five big paper app cards (≥ 700 px wide stack) gliding left ≥ 300 px; a thumb swipes the top card up and away. Super ≤ 4 words: **CLOSING APPS ≠ BATTERY** (≠ in coral). A small battery icon at 100% beside the stack doesn't move. |
| apple | 2.74 | 3 | "Apple says close an app only if it's unresponsive." | Re-created Apple Support page sheet slides up, RE-CREATED tag ≥ 36 px, the sentence in big cream type, **APPLE SUPPORT · OCT 15, 2026**. 1.0 s silence after: a paper-slap as **ONLY IF UNRESPONSIVE** underlines in coral. |
| ask | 6.96 | 3 | "So what's really draining your phone?" | The page peels off; the phone drops into the middle, battery icon ticking down, a coral **?** tag on the battery. |
| paused | 9.5 | 2 | "Most of those apps are paused." | The card stack returns inside the phone; each card gets a cream pause-bar stamp ‖ in rhythm. One card (a music card) keeps a moving equalizer to show "most", not all. Label next to that card only: **STILL PLAYING**. |
| scratch | 12.04 | 1 | "But swipe one away, and it restarts from scratch." | Thumb flings a card off frame; tap the icon and the card rebuilds from torn pieces (frame, header, rows, images), each piece landing with a tick. |
| work | 15.66 | 2 | "That's more work, not less." | Two cards side by side: **RESUME** (one piece slides in) vs **FROM SCRATCH** (eight pieces), a tally under each. Chip below, ≥ 40 px: **GOOGLE'S ANDROID CHIEF, 2016: "COULD VERY SLIGHTLY WORSEN"**, credit Android Developers on the tally. |
| email | 17.84 | 3 | "In 2016, a fan emailed Tim Cook." | Time-jump card **MARCH 2016** slaps in; a paper envelope addressed **TO: TIM COOK** slides across. |
| question | 20.74 | 3 | "Do you quit apps? Is that needed for battery?" | Envelope opens; two handwritten lines without quote marks: **1. DO YOU QUIT YOUR APPS?** **2. NEEDED FOR BATTERY?** RE-CREATED · AS REPORTED. |
| answer | 24.36 | 4 | "Apple's software chief wrote back. No and no." | Reply slip from **CRAIG FEDERIGHI · APPLE SVP SOFTWARE** slides under the envelope; on "No and no." the hero coral stamp **NO AND NO** lands across both lines, one "NO" per question. 1.0 s silence after for the stamp thump. **Screenshot hold ≥ 1.2 s**, source line **9TO5MAC · MACRUMORS · MAR 10, 2016**. Peel the slip before `drains` starts. |
| drains | 28.21 | 4 | "What drains it? A bright screen, weak signal, background apps." | Back to the phone, three paper props pop on in rhythm with the words: a sun over the screen (brightness), a one-bar signal card, a card with a background-refresh arrow. Credit **APPLE**. |
| check | 32.19 | 4 | "Check yours in Settings, Battery." | Re-created generic battery-usage list (RE-CREATED), bars per app; breadcrumb chips **iPHONE: SETTINGS › BATTERY** and **PIXEL: SETTINGS › BATTERY › BATTERY USAGE**. |
| scope | 34.37 | 4 | "One app frozen or hogging it? Close that one." | One bar is much longer; that one card shakes (frozen) and gets flicked off, the only "good" swipe. Labels **FROZEN · APPLE** and **HOGGING · GOOGLE**. |
| end | 37.99 | 5 | "So, still swiping them all away? Yes or no." | The full card stack from frame 0 returns at full opacity with **YES / NO** chips ≥ 110 px, neither highlighted; on "no" it is frame 0 again so the loop replays. Nothing hints at the answer. |

Pacing: a new object every 3 s or less; no still stretch over 1.0 s while the voice runs. Fill y 1000–1430 in every scene (the card stack and phone sit low). Coral only on ≠, ONLY IF UNRESPONSIVE underline, and the NO AND NO stamp.

## 5. Open questions for the director

1. **Length.** Chained `at` puts `dur` at 41.9 s (2.8 w/s formula); Ming reads closer to 2.6 w/s, so expect about 38–40 s. If it runs over 40 s, cut `work` first (the chip can ride on `scratch`), then shorten `drains` to "What drains it? Screen, signal, background apps."
2. **Planned silences.** 1.0 s after `apple` (paper-slap underline) and after `answer` (hero NO AND NO stamp). Keep them through re-timing; the SFX gate needs them.
3. **Scope on iPhone.** Google says force stop a battery hog; Apple says close only an unresponsive app and fix background hogs in Background App Refresh / Location Services. The `scope` line is true across both together; if a juror reads it as "Apple says close hogs", add the small chip **iPHONE: OR TURN OFF ITS BACKGROUND REFRESH**.
4. **Ming risks.** "Tim Cook" sits at the end of `email`, not the start (gps lesson). "No and no." is short; if Ming swallows it, try `say` "No. And no." as its own line with a 0.3 s gap. "unresponsive" should be checked with unhinted Whisper. `say` on `email` spells "twenty sixteen".
5. **Logos and UI.** No Apple, Google or Android logos and no real UI; generic phone, re-created pages with RE-CREATED tags ≥ 36 px.
6. **Pinned comment idea (SEO agent):** "Apple's own support page (updated Oct 15, 2026): 'You should close an app only if it's unresponsive.' Check what's really using your battery: iPhone Settings › Battery; Pixel Settings › Battery › Battery usage."
7. **End card sources:** "Apple Support Oct 2026 & Mar 2026 · Apple Batteries · Android Developers · Pixel Help · 9to5Mac/MacRumors Mar 2016 · Techlicious Mar 2016".
8. **Backup topic** (only if this one is dropped): why your phone dies faster in the cold. Not researched this run.

## Log
- 2026-11-08: researched and scripted. Backlog hook replaced (overclaimed "draining"). scriptlint: OK, no FAILs or WARNs.
- 2026-11-08 (director): built and rendered, 39.7 s (out/forceclose-vo.mp4, 8.0 MB). Voice changes: `answer` split into "The software chief at Apple wrote back." (Whisper kept hearing "Apple's" as "Apple") + `nono` "No and no." (say "No, and no."), so the hero stamp lands with its thump in the 0.7 s pause before the words and holds still through them; `check` text is now "Check yours: Settings, Battery." (Whisper heard "in" as "and"). `work` kept (39.7 s ≤ 40 s). Lockheimer chip dropped (never spoken; quote strips only carry spoken words). Coral only on “NO AND NO.” and YES / NO; ≠ and the highlighter are cream / mustard. The flick off the hero is silent so the stamp keeps its readcheck time (2.2 s) and the hold its silence. Gates in the director's report; pacecheck's only FAIL is the planned 1.9 s hero hold (25.27–27.17 s). heard.js = two merged gate passes (the shipped render's hit times come from them).
- 2026-11-08 (director, polish after jury r1 7.5 / Truth 8.5): no line re-voiced. Scope chips now FROZEN? CLOSE IT · APPLE and HOGGING? RESTRICT OR FORCE STOP · PIXEL HELP, plus iPHONE: OR TURN OFF ITS BACKGROUND APP REFRESH (42 px), all from "Battery" to the end wipe; the thumb comes in from the right so it never covers them. Drains row 3 is Apple's BACKGROUND ACTIVITY with FIX: TURN OFF BACKGROUND APP REFRESH · APPLE (36 px); the drains wipe moved to 26.7 s and the settings flick to 31.0 s so that line reads 4 s. Page: RE-CREATED from its first frame, the quote inks in phrase by phrase with the voice (printed light first), credit FORCE AN APP TO CLOSE / APPLE SUPPORT · OCT 15, 2026 at the foot. Envelope slides in on "emailed". Frame 0 says SWIPING ≠ SAVING with the thumb already on the card; the swipe has a soft flick at 0.17 s, before the first word. Hero thump GAIN .5 → .22: peak −11.1 dBFS against the "No and no" voice peak −6.4 (4.7 dB under), RMS −21.8, still the loudest hit; pop and slap .2; 2.18 s flick −23.9 dB RMS; two tonal paper ticks (−24.9/−23.7) at 13.60/13.74 s land the last two rebuilt pieces. The bed in the spoken spans is mostly hits, so raising hits pulled the voice up with them; smr_db 54 → 47 brings the hits back to these levels (voice and takes unchanged). FROM SCRATCH leads its card so RESUMES never lands on it. heard.js = four merged gate passes; the shipped hit times reproduce from it. No YES/NO pop: the 38.56–38.82 s gap is voiced (the SFX gate has no room). Tail trimmed to 0.41 s (dur 39.64 s in script.json/vo.js; the takes are unchanged). App cards have hand-cut edges.
