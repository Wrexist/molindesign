# Memory: why AI forgets what you said

A vertical (1080×1920) explainer for TikTok, Reels and Shorts, written in code. Factory #8 on Tech, explained, How AI works part 5, after `film/battery/`. One hard idea: **the chatbot doesn't remember your conversation at all; it reads the whole chat again every time you hit send, and that page only holds so much, so the start can fall off.** Facts and sources: `BRIEF.md`.

Built to the 2026-10-24 stats rules: no title card. Frame 0 is one huge paper name tag, HELLO / my name is / SAM (about 760 × 540 px, cream and coral), already peeling at one corner and swaying; four words on screen (WHY DOES CHATGPT / FORGET?), which are also the search phrase. The peel visibly grows by 0.3 s. 30–45 s.

## Benchmarks

- **Battery (`film/battery/`, jury 8.0)**: learn one object the whole way through (the battery kept coming back and kept shrinking: here the name tag rides the first message, falls off, and comes back for the question), the condition in big type on the number's frame, the stamp that fills the beat after a payoff. Don't take its seven scenes with seven new props: here five of the twelve lines play on one chat scroll, so the native move gets time to land.
- **Zack D. Films "Why ChatGPT Contradicted Itself 🤔" (14.0M)**: learn the frame — what the viewer saw happen in their own chat, one fact, one twist. Don't take the 3D-render look or the real ChatGPT interface: everything here is flat paper, and the chat app is a generic re-creation, tagged.

## Three structures we considered

1. **Mechanism first** ("Every model has a context window…"). Rejected: an abstract opening, the shape that did worst (Next word, 3 % completion).
2. **The number first** ("ChatGPT can only read 20,000 words."). Rejected: a number with no stakes, and it needs four conditions before it's true.
3. **Your name → it never remembered → it rereads everything (100×) → the window → the number → your name falls off → the patch → yes or no** (chosen): it starts on something the viewer has felt, turns once (it was never remembering), gives the DM-able line the whole frame (REPLY 100 = MESSAGE 1 READ 100×), and pays off on the same object the film opened on.

## The native move: the chat scroll inside a fixed reading frame

The chat is one scroll of drawn bubbles (real short lines from a made-up trip-planning chat, never filler bars). On every send a coral reader bar sweeps the whole scroll from MESSAGE 1 down: that's the reread. When the coral CONTEXT WINDOW frame snaps around it, new bubbles keep pushing in at the bottom until the top strip, the one with the SAM tag, crosses the frame's edge, tears on a perforation and falls out. Scene changes are a torn paper edge rising from the bottom, the next scene already drawn under it.

## Look (Isac, 2026-10-23: must not look AI-made)

Flat, hand-built things on the ink stage: a paper name tag, a generic chat app (a plain header, two kinds of bubble, a SEND pill; no logo, no real interface, tagged RE-CREATED), a ruled index card stamped EMPTY, a mechanical tally counter, a sticky note and a saved-memory card, a quote card. Type: Archivo for headlines, Geist Mono for readouts and small print. One coral accent.

## Voice first

Ming US_James (`vo/script.json`, `film-voiceover` §3c), recorded before any picture; every beat, caption and sound reads its time from `vo/vo.js` through `at(id, word)`. No music (`MUSIC = false`): voice + sound effects, and voice only.

| Line | Stressed word(s) | Picture |
|---|---|---|
| hook "Why does ChatGPT forget your name?" | **forget**, **name** | Frame 0: the huge SAM name tag peeling and swaying; headline WHY DOES CHATGPT / FORGET?; a coral ? stamp slaps on "forget"; the peel jumps on "name". |
| told "You told it in your very first message." | **very first** | A re-created chat app rises from the bottom; the tag shrinks and sticks to bubble 1 ("Hi, I'm Sam!"), MESSAGE 1 chip, RE-CREATED tag. |
| secret "Here's the secret: between replies, it remembers nothing." | **secret**, **between**, **nothing** | Torn-edge cut; REPLY 1 above, REPLY 2 below, a ruled index card MEMORY between them with a clock ticking; EMPTY stamps on "nothing". OPENAI API DOCS: EACH REQUEST IS "STATELESS". |
| reread "Every time you hit send, it rereads the whole chat." | **send**, **whole** | Back to the chat: SEND pressed, a new bubble, the coral reader bar sweeps from MESSAGE 1 to the bottom; a second send, a second sweep; READS OF MESSAGE 1: 1, 2. |
| hundred "By reply 100, it's read your first message 100 times." | **100**, **100 times** | The chat slides left; a mechanical tally counter rolls 1 → 100 in round steps as the sweeps blur; REPLY 100 / = MESSAGE 1 READ 100× in ≥ 56 px type, held ≥ 3 s (the screenshot frame). |
| limit "But it can only hold so much. That's the context window." | **hold**, **context window** | Torn-edge cut; the coral frame snaps around the scroll on "hold"; CONTEXT WINDOW tab on its top edge; bubbles keep pushing in. |
| size "On free ChatGPT, that's about 20,000 words, replies included." | **free**, **20,000**, **replies** | ≈ 20,000 WORDS big on the frame; under it FREE PLAN · INSTANT MODEL · OCT 2026 and VARIES BY APP, PLAN AND MODEL (≥ 38 px), credit OPENAI PRICING, READ OCT 25 2026; 27K TOKENS · REPLIES INCLUDED. |
| fall "Go past that, and the oldest messages can fall off." | **past**, **fall off** | Two more bubbles push in; MESSAGE 1 crosses the top edge, tears and tumbles out; PAST THE LIMIT stamp. |
| name "Like the one with your name." | **name** | The torn strip lands under the frame, the SAM tag face up; the reader bar sweeps a scroll without it; "What's my name?" / "Sorry, I don't know." ILLUSTRATION tag. |
| patch "Apps patch it with summaries and saved memories." | **summaries**, **saved memories** | Torn-edge cut; a sticky note SUMMARY slaps on, then a card SAVED MEMORY · Name: Sam. |
| detail "But OpenAI says memory doesn't keep every detail." | **every detail** | Quote card: "MEMORY DOES NOT RETAIN EVERY DETAIL" — OPENAI HELP CENTER; the summary note's lines strike through. |
| end "So, has it ever forgotten yours? Yes or no." | **yours**, **yes**, **no** | Back to the SAM tag, peeling; sources line under the caption; a comment box "yes or no: __" with a caret; YES and NO chips slap on their words; the tag grows back into frame 0. |

## Rules it follows

- Something moves every frame: the tag sway and peel, the sweeps, the counter, new bubbles, the clock, the camera push of 1.5 % per scene.
- A visual hit on every stressed word, keyed with `at(id, word)`; sound effects sit between words, never on them; the next scene is drawn under each torn-edge cut.
- Safe area is measured: `node film/tools/boundscheck.mjs --film memory`.
- Captions in the upper third (y ≈ 380), one block at a time, broken on phrase boundaries, hidden under the cuts; pills only on stressed words; labels ≥ 36 px cream; stamps above y 1300; no sources line in the top 300 px.
- Honest: "free ChatGPT" carries FREE PLAN · INSTANT MODEL · OCT 2026 and VARIES BY APP, PLAN AND MODEL in big type in the same frame; "can fall off" as the sources say; the chat is a generic re-creation tagged RE-CREATED, the fall-off chat ILLUSTRATION; no logos.
- Ban list respected: no glowing nets, grid floors, particle bursts, lens flares, shake, bouncy easing, AI imagery.
