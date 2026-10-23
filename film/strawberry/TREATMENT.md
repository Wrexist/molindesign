# Strawberry: why AI couldn't count the r's

A vertical (1080×1920) explainer of about 75 seconds (74.8 s) for TikTok, Reels and Shorts, written in code. Part 2 of the "AI explained" series after `film/nextword/`. One hard idea: **in the question you type, "strawberry" reaches the model as one sealed chip (one number, 101830), so the r's are inside something it can't open; it has to recall the spelling and count in its head, and the fix is to spell the word out so every letter becomes a chip of its own.** Facts and sources: `BRIEF.md`.

## Benchmarks

- **Next word (`film/nextword/`, part 1)**: learn the house look (ink stage, cream type, one coral accent, chips, stamps in the low band), word-keyed foley and the caret wipe. Don't take its many unrelated set pieces: here one object, the sealed chip, carries the whole film, so the viewer always knows where to look.
- **3Blue1Brown's GPT chapter (token chips with real IDs)**: learn showing the real numbers the machine sees. Don't take the slow pace or the blue palette; every reveal here is one word long.

## Three structures we considered

1. **Myth-buster list** ("3 reasons AI can't count letters"). Rejected: a list has no turn and no loop, and it would bury the one surprising fact (the whole word is one number).
2. **The endless zoom**: push from the chat into the word, into the chip, into the number. Kept as the first 20 s, but on its own it ends on a fact, not a payoff.
3. **The locked box** (chosen): the failure (chat says 2), find the lock (the word is one sealed chip, 101830), why guessing from memory slips (repeated letters), then open the lock on screen (spell it out → ten chips, three of them 428 = r), show the lock is still there (blueberry, GPT-5) and end on the sealed chip, which dissolves back into the opening question.

## The native move

**The sealed chip.** The word *strawberry* inside one rounded token chip, its ID 101830 stamped on it, the letters a faint ghost behind frosted glass. Letter probes bounce off it (No s, no t, no r's), it twists on "twist", and on "Spell it out" a crack runs across it and it **breaks into ten letter chips**; the three ` r` chips carry the same ID, 428, and light coral. At the end blueberry seals the same way (177717) and the strawberry chip closes again for the loop. Scene changes are a coral knife that slices the old scene away (the token cut from part 1).

## Voice first

Chatterbox, recorded before any picture (`vo/script.json`, `film-voiceover` §3b). Every beat, caption and sound reads its time from `vo/vo.js` through `at(id, word)`. No music (`MUSIC = false`): voice + sound effects and voice only.

| Line | Stressed word(s) | Picture |
|---|---|---|
| hook | **strawberry**, **two** | Frame 0: the question in the caption band, the word STRAWBERRY huge with its three r's ringed and numbered, and the ChatGPT reply already up: "There are **2** r's in strawberry." (the conflict on frame 0, silent). On *two* the 2 stamps (coral flash, stamp sound). |
| sure | **sure**, **Two** | "Are you sure?" pops in; the reply "Yes. **2**." stamps (STILL 2, low band). Label GPT-4o · AUG 2024. |
| why | **smart**, **letter** | Camera pushes into the big word; one r swings out of line with a coral "?". |
| tokens | **letters**, **tokens** | Letters strike out; the typed question is sliced by the coral knife into chips: How · many · r · 's · are · in · strawberry · ? |
| single | **single** | The "str · aw · berry" split everybody shows flashes, then snaps shut into ONE chip ("NOT str·aw·berry"). |
| number | **number** | Every chip flips to its ID; strawberry becomes **101830** (o200k_base, OpenAI's tokenizer). The DM moment: that chip lifts out of the row to ~900 px wide (digits ~160–180 px), the rest dim to 20 %, a big flip, a 0.4 s hold, and the same chip carries straight into the sealed scene (one move, no cut). |
| nothing | **s**, **t**, **r's**, **Nothing** | The sealed chip fills the frame, letters as ghosts behind frosted glass; letter probes s, t, r fly at it and bounce off with a ✗ each. |
| knows | **twist**, **spelled** | The chip twists; a thought card writes s-t-r-a-w-b-e-r-r-y from memory. |
| head | **head**, **one go** | A one-pass reel: letters stream past a window, a tally counts r's in a single breath. |
| slip | **repeated**, **slip** | The r·r pair slides together into one r; the tally misses a tick and stops at 2. |
| berry | **one**, **two**, **Two** | straw → 1, berry → 2, 1 + 2 = … **2** (stamp 1 + 2 = 2). |
| watch | **fix**, **Spell**, **spaces** | The native move: the sealed chip cracks and breaks into ten letter chips with spaces. |
| plain | **token**, **Three** | Each letter flips its ID (82, 260, 428, …); the three 428s light coral and the tally hits 3 (stamp 3 r's). |
| think | **thinking**, **spell**, **first**, **run**, **code** | One line ("Newer thinking models spell it first, or run a little code."), two panels stacked and visible together: a `thinking` chip + caret trace spelling s·t·r(1)·a·w·b·e·r(2)·r(3)·y = 3, and a `python` terminal typing `"strawberry".count("r")` → 3 ✓. BOTH SEE EVERY LETTER. |
| codename | **Strawberry** | A dossier typing three real lines: PROJECT STRAWBERRY · Reuters, Jul 2024 / → o1-preview · Sep 12, 2024 / trained to think before answering; stamped CODENAME STRAWBERRY. A wink, no arrow to the meme. |
| today | **2025**, **right**, **gone** | "By 2025, most chatbots got strawberry right. But it's not gone." One big ✓ tally: AUG 2025 TEST · 100 TRIES PER MODEL → ALL BUT ONE, then a wobbling NOT GONE chip. |
| blue | **GPT-5**, **three** | The wobbling card becomes a new chat: "how many b's are there in blueberry?" → 3 (it's 2). GPT-5 · AUG 2025. |
| same | **blindness**, **token** | blueberry seals into one chip, **177717**, next to strawberry's 101830. |
| end | **count**, **see** | The ten letters fold back into the strawberry chip and it seals; the end dissolves into frame 0's question. |

## Rules it follows

- Something moves every frame: drifting faint chips behind everything, the frosted chip breathes, tallies tick, the camera pushes 3 % per scene.
- A visual hit on every stressed word, keyed with `at(id, word)`; next scene pre-rolls into silences.
- Captions in the upper third (y ≈ 360) highlight the spoken word; labels ≥ 30 px, left of x 930, above y 1450; stamps in the low band (y 1480) outlive their scene.
- Honest numbers only: 101830, 428, 177717 and the per-letter IDs are o200k_base (tiktoken 0.14.0, BRIEF fact 1, 3, 5); GPT-4o "2" Aug 2024 (fact 6); repeated letters (fact 9); o1 Sep 2024 (fact 11); "most" chatbots today (fact 12); GPT-5 blueberry Aug 2025 (fact 13).
- Ban list respected: no glowing nets, grid floors, particles, flares, shake, bouncy easing, AI-brain imagery.

## Jury round 2 polish

- Lines from `codename` on moved 1.2 s earlier (film 74.8 s; HOME = end + .25).
- Captions: one layer at a time (old card fully out, 0.12 s gap, new card fades in); the frame-0 question is full cream.
- Hook: the 2 in ChatGPT's reply stamps 1.6 → 1.0 in 0.12 s on "two" with a coral flash and a big stamp; a mint "3?" pops at 1.5 s; RE-CREATED tags on the GPT-4o and GPT-5 chats; the GPT-5 prompt is the reported wording ("how many b's are there in blueberry?").
- 21.5–22.1 s: the lifted chip reads as a still: "strawberry =" over 101830, with ONE NUMBER · OPENAI · o200k_base.
- Head/slip reel: one pass, "st" in view at the cut, the r·r pair arrives on "repeated", merges on "slip" with one tick and a buzz; "r: 2" appears only then.
- "3 R's ✓" is a global stamp on "Three" (replaces the old tally); the terminal panel enters after it leaves.
- Drift chips stay out of the headline band around the loop point; the closing chip shows no ghost letters until the fold lands; the poster has no progress rail.
