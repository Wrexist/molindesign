# Battery: why your phone battery wears out

A vertical (1080×1920) explainer for TikTok, Reels and Shorts, written in code. Factory #7 on Tech, explained, after `film/fyp/`. One hard idea: **your phone's battery is losing capacity right now, and what ages it fastest isn't use, it's sitting full (and hot)**; that's why iPhone, Pixel and Samsung now let your phone stop at 80 %. Facts and sources: `BRIEF.md`.

Built to the 2026-10-24 stats rules: no title card. Frame 0 is one huge cream battery (about 600 × 1000 px, coral fill at 100 %) whose outline is already squeezing inward, a dashed ghost of its old edge left behind; four words on screen (YOUR BATTERY IS SHRINKING). The squeeze is visible by 0.3 s. The search phrase chip BATTERY HEALTH pops in at 1.5 s. 30–45 s.

## Benchmarks

- **FYP (`film/fyp/`, jury 8.1)**: learn the viewer-as-subject puzzle (here: the viewer's own Battery Health number), the phrase-boundary captions hidden under each wipe, the next scene drawn under every cut, 16 motion-blur sub-frames, re-created tags. Don't take its middle-third crowd of 24 tiny phones: here every scene has one or two big objects.
- **Zack D. Films "Why Most Sperm Never Reach The Egg"**: learn one object the whole way through (here the battery, which keeps returning and keeps shrinking), one fact, one twist. Don't take the 3D-render look: everything here is flat, hand-built shapes.

## Three structures we considered

1. **Chemistry first** ("Lithium ions get trapped in the anode…"). Rejected: an abstract mechanism opening, the shape that did worst (Next word, 3 % completion), and the brief's sources don't let us draw the chemistry.
2. **The 80 % limit first** ("Why does your phone stop at 80 %?"). Rejected: it only hooks people who've noticed the limit, and it gives away the answer before the puzzle.
3. **Your battery is shrinking → check your number → the twist (full ages it) → the numbers (80 vs 96) → heat, drain → the fix (80 % limits) → your number** (chosen): it starts on the viewer's own phone, hands them a check they can do now, turns once (it's not use, it's sitting full), gives the one DM-able pair of numbers the whole frame, then pays off with what their phone already does about it, and asks for their number, a one-number comment that loops to frame 0.

## The native move: the shrinking outline

The battery's outline physically contracts while the fill stays: capacity lost, not charge. A dashed ghost stays where the old edge was, with coral notch ticks between them. It opens the film, returns on "ages", on "80 %", on "permanent damage" and on "wears it too". Scene changes are the battery's own fill: the next scene rises from the bottom of the frame like a charge level, with a coral level line at its edge (the next scene is always drawn under it; captions fade out under the line).

## Look (Isac, 2026-10-23: must not look AI-made)

Flat, hand-built things on the ink stage: a cream battery with a coral fill, a generic drawn phone (no logos, no real interface; the Settings screen is a plain list re-created from Apple's and Google's help pages, tagged RE-CREATED), a paper armchair, a wall clock, a paper wall calendar, a thermometer card in °F, a sun, a bedside table with a moon in the window and an alarm clock. Type: Archivo for headlines, Geist Mono for readouts and small print. One coral accent.

## Voice first

Ming US_James (`vo/script.json`, `film-voiceover` §3c), recorded before any picture; every beat, caption and sound reads its time from `vo/vo.js` through `at(id, word)`. No music (`MUSIC = false`): voice + sound effects, and voice only.

| Line | Stressed word(s) | Picture |
|---|---|---|
| hook "Your phone battery is already shrinking." | **already**, **shrinking** | Frame 0: the huge battery, outline squeezing in, dashed ghost of the old edge, coral notch ticks; headline YOUR BATTERY / IS SHRINKING, SHRINKING lights coral on "shrinking". BATTERY HEALTH chip at 1.5 s. |
| check "Check your battery health in the Settings app." | **battery health**, **Settings** | A drawn phone rises from the bottom; the big battery shrinks into its screen as the row icon. Re-created screen: a plain ruled list in house type (BATTERY, Capacity vs. new ??%), RE-CREATED tag, iPhone · Pixel 8a and later at 38 px under the chip. |
| why "Below 100%? So why does it drop?" | **below**, **why** | The ?? rolls to 87 % (EXAMPLE tag); a coral WHY? stamp slaps on "why". |
| twist "Here's the twist: sitting at 100% ages it faster." | **twist**, **sitting**, **ages** | Fill wipe; a battery at 100 % sits in a paper armchair, a wall clock spins; on "ages" the outline squeezes a notch. Samsung's words: “CAN REDUCE ITS LIFESPAN”. |
| year "Leave a battery full for a year at room temp." | **full**, **year**, **room temp** | The battery stands left as STORED FULL (its outline shrinks in height only, so area = capacity); a wall calendar flips JAN → DEC; a thermometer card 77 °F; STORED 1 YEAR in big type. |
| eighty "It keeps about 80% of its capacity." | **80 %** | Its outline drops to 80 % of its height; the lost 20 % is a hatched coral band under the dashed ghost with a −20% chip; the chip rolls KEEPS 100% → KEEPS 80%. |
| forty "Leave it at 40% instead? About 96%." | **40 %**, **96** | A second battery drops in on the right at 40 % fill; its outline barely moves: a thin coral sliver, −4% chip beside the terminal, KEEPS 96%. STORED FULL / STORED AT 40 %, STORED 1 YEAR · 77 °F, ESTIMATE · BATTERY UNIVERSITY. Then a coral 5× THE LOSS stamp (20 ÷ 4, same estimate) and a pulse of the −20% band fill the pause. The screenshot frame: held ≥ 3 s, ≥ 40 px body type. |
| heat "And heat over 95°F can do permanent damage." | **heat**, **95**, **permanent** | Fill wipe; a sun, a thermometer climbs past a coral line at 95 °F; ABOVE 95 °F in big type; the battery's outline squeezes on "permanent"; APPLE: “CAN PERMANENTLY DAMAGE” CAPACITY. |
| drain "Draining it to zero wears it too." | **zero**, **too** | The fill drains 100 → 0 % (whole-number counter), DEEP DRAIN with FEWER CYCLES · ESTIMATE · BATTERY UNIVERSITY; on "too" the outline twitches smaller and WEARS IT TOO stamps. |
| limit "That's why iPhone, Pixel and Samsung let you stop at 80%." | **iPhone**, **Pixel**, **Samsung**, **80 %** | Fill wipe; three generic drawn phones (no logos) slap in on the three names, each gets a coral 80 % chip on "eighty". Small print iPhone 15+ · Pixel 6a+ · One UI 6.1+. ILLUSTRATION tag. |
| night "Charging overnight? Your phone can wait at 80 until you wake." | **overnight**, **80**, **wake** | Bedside: moon in the window, the phone on a cable holds at 80 % with a pause bar (CAN WAIT AT 80 %), the alarm clock's hands run to 7:00, it rings on "wake" and the fill tops up to 100 %. |
| end "So what's your battery health? Drop your number." | **battery health**, **number** | Back to the re-created Battery Health screen, ??% and a comment box "my number: __%" with a 0.5 s blinking caret from "So what's"; sources in 34 px under the phone; on "number" it dissolves into frame 0. |

## Rules it follows

- Something moves every frame: the fill's surface wobble, the squeezing outline, the clock hands, the calendar, the thermometer, the camera drifts 1.5 % per scene.
- A visual hit on every stressed word, keyed with `at(id, word)`; the next scene is drawn under each fill wipe (no bare cuts).
- Safe area is measured: `node film/tools/boundscheck.mjs --film battery`.
- Captions in the upper third (y ≈ 380), one block at a time, broken on phrase boundaries, hidden under the wipes; pills only on stressed words; meaning labels ≥ 36 px cream; stamps at y ≤ 1280.
- Honest: the 80 % / 96 % figures carry ESTIMATE · BATTERY UNIVERSITY and STORED 1 YEAR · 77 °F in big type in the same frame; "ages it faster" and "can" as the sources say; temperatures in °F; Settings screens re-created, tagged RE-CREATED; phones generic, tagged ILLUSTRATION; no logos.
- Ban list respected: no glowing nets, grid floors, particle bursts, lens flares, shake, bouncy easing, AI imagery.
