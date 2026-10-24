# FYP: how the TikTok algorithm picks your next video

A vertical (1080×1920) explainer for TikTok, Reels and Shorts, written in code. Factory #6 on Tech, explained, after `film/noise/`. One hard idea: **before you see a video, TikTok has already bet you'll watch it; it learns that bet from what you finish, skip, replay and linger on, and from a stranger who watched the same videos you did.** Facts and sources: `BRIEF.md`.

Built to the 2026-10-24 stats rules: no title card. Frame 0 is one huge moving object (a drawn phone, close up, filling most of the frame, a bright cat video playing in it; a THIS VIDEO tag lands on "this") and a coral betting chip already sliding onto it; four words on screen (TIKTOK BET ON YOU). The chip lands by 0.45 s. The search phrase chip TIKTOK ALGORITHM pops in at 1.6 s. 30–45 s.

## Benchmarks

- **Strawberry (`film/strawberry/`, most views)** and **Noise (`film/noise/`, best loop)**: learn the puzzle the viewer can test on themselves (here: their own thumb) and the loop that ends on the frame-0 object. Don't take Noise's dark-gradient-plus-one-centred-prop middle third (the round-2 jury called it template): here every scene keeps two layers, the phone and the SIGNALS strip, or two phones, or the dot field.
- **Zack D. Films "Why ChatGPT Contradicted Itself"**: learn a single object (a phone) on screen, one fact, one twist, told about what the viewer just saw happen. Don't take the 3D-render look: everything here is flat, hand-built shapes.

## Three structures we considered

1. **Mechanism first** ("TikTok scores every video with signals…"). Rejected: an abstract "how X works" opening, the shape that did worst (Next word, 3 % completion).
2. **The stranger first** ("A stranger picked this video for you"). Rejected: frame 0 would show the twist, the answer (strawberry r1), and the stranger needs the signals first to make sense.
3. **Bet → your clues → the stranger → the playbook → your answer** (chosen): TikTok bet you'd watch *this*; you check it on your own thumb (finish, skip, replay, linger, a strong sign); the turn (it's not just you): a stranger who watched the same two videos; the playbook the NYT saw (come back, how long you stay); and the last line asks whether you finished this one, a one-word comment that is itself the signal. It loops to frame 0.

## The native move: the swipe

The whole stage is a feed. Scene changes are a vertical swipe: the old scene slides up and out, the next one is already drawn underneath and slides up into place (never an empty stage). Inside the phone the same move carries the clues: a finished card swipes on, a skipped card flicks up, a replayed card loops. Each clue drops a coral tally on the **SIGNALS** strip beside the phone, the visual spine of the first half.

## Look (Isac, 2026-10-23: must not look AI-made)

Flat, hand-built things on the ink stage: a generic drawn phone (no TikTok logo, no real interface: a rounded body, a notch, a vertical card with a progress bar), drawn video cards (a cat, a house, a tree, a car, a boat, a flower, mountains), a coral casino chip, a stopwatch, a paper doc with a RE-CREATED tag and a rubber stamp. Type: Archivo for headlines, Geist Mono for readouts and small print. One coral accent.

## Voice first

Ming US_James (`vo/script.json`, `film-voiceover` §3c), recorded before any picture; every beat, caption and sound reads its time from `vo/vo.js` through `at(id, word)`. No music (`MUSIC = false`): voice + sound effects, and voice only.

| Line | Stressed word(s) | Picture |
|---|---|---|
| hook "TikTok bet you'd watch this." | **bet**, **this** | Frame 0: the phone close up, this video playing in it (a phone in the phone), a coral chip sliding onto the card and landing on "bet"; headline TIKTOK BET ON YOU, YOU lights coral. TIKTOK ALGORITHM chip pops at 1.6 s. |
| know "So how does the TikTok algorithm know?" | **algorithm**, **know** | The camera pulls back, the phone settles left; the chip knocks on "algorithm"; a big coral ? stamp on "know". The SIGNALS strip slides in on the right. |
| clue "Every swipe is a clue. Finish, skip, or replay." | **clue**, **finish**, **skip**, **replay** | Native move: a card plays to a full bar (FINISH ✓), the next flicks up and away (SKIP), the next loops with ↻ (REPLAY). Each drops a coral tally on SIGNALS. |
| linger "Even the seconds you linger get counted." | **seconds**, **linger**, **counted** | A drawn thumb hovers over a card without swiping; a stopwatch hand sweeps (no digital readout: TikTok publishes no unit); a plain LINGER tally. |
| strong "Finish a long video? TikTok calls that a strong sign." | **long**, **strong** | A LONG VIDEO card, its bar fills end to end; a thick tally lands, STRONG SIGNAL stamp; quoted small print, TikTok Newsroom, Jun 18, 2020. |
| turn "But here's the trick. It's not just you." | **trick**, **not just you** | Swipe; the camera pulls back: your phone (YOU) is one of 24 phones. |
| stranger "Say a stranger saw two of the same videos you did." | **stranger**, **same two** | Two phones, YOU and STRANGER (a plain silhouette); cards A and B light coral on both; coral lines join them. |
| third "TikTok may guess you'll like her third one too." | **may guess**, **third** | Her card C slides across into your feed; MAY PREDICT (TikTok's word); small print TikTok Transparency Center. |
| helped "So a stranger you'll never meet helped pick your feed." | **never meet**, **helped** | The DM frame (jury r1): the YOU / STRANGER pair held at about 350 px per phone, A and B joined, her flower copied into your slot with a coral arrow; tag PICKED WITH HELP FROM A STRANGER at 56 px; held ≥ 3 s. No dot network. |
| doc "In 2021, the New York Times saw TikTok's internal guide." | **2021**, **New York Times** | Swipe on "In"; a re-created page: INTERNAL DOCUMENT, "TikTok Algo 101", RE-CREATED, stamp REAL, SAYS TIKTOK by the title; a clipping "How TikTok Reads Your Mind", Ben Smith, Dec 5, 2021. Only the title and the two metric names are re-created (BRIEF §5.4). |
| two "Two numbers mattered. Do you come back? How long do you stay?" | **two**, **come back**, **how long** | Two coral chips (76 px) slap in under the page: RETENTION (come back?) and TIME SPENT (how long?); a stopwatch shows how long you've stayed in this film so far (the real t). |
| end "So, did you finish this one? Yes or no?" | **finish**, **yes**, **no** | The camera pushes back into the frame-0 phone, its bar almost full; YES / NO buttons and a blinking comment box; on "no?" it dissolves into frame 0. |

## Rules it follows

- Something moves every frame: the playing progress bars, phone sway, the chip, the swipes, the tallies, the stopwatch, the dot field drifts, the camera pushes 1.5 % per scene.
- A visual hit on every stressed word, keyed with `at(id, word)`; the next scene is drawn under each swipe (no bare cuts).
- Safe area is measured: `node film/tools/boundscheck.mjs --film fyp`.
- Captions in the upper third (y ≈ 380), one block at a time, pills only on stressed words; meaning labels ≥ 36 px cream; stamps at y ≤ 1280.
- Honest: "may predict" (TikTok's words), "strong sign" quoted from TikTok's Newsroom, the doc shown re-created with only its title and two metric names (both from the NYT), "saw" not "leaked", the dot field tagged ILLUSTRATION, no TikTok logo or interface.
- Ban list respected: no glowing nets, grid floors, particle bursts, lens flares, shake, bouncy easing, AI imagery.
