# The cutaway explainer: what we took from @scroll.engineer's Apple Watch reel

Isac shared instagram.com/reel/DeVD1pnyopS on 2026-11-09 ("Make videos like this aswell"). It's @scroll.engineer, posted 2026-10-10: **163k likes, 301 comments**. It explains how an Apple Watch reads your pulse with green light. This folder holds the study and our first test film in the same format. It's an original topic and original art, not a copy.

Downloaded with `yt-dlp --impersonate chrome` (no login), transcribed with faster-whisper small.en, measured with `film/tools/pacecheck.py`.

## Anatomy

| Layer | What the reel does | Numbers |
|---|---|---|
| Length and voice | One calm, plain narrator. Not hype, no meme voice. A quiet ambient bed under it. | 84 s, 237 words, **2.84 words/s** |
| Hook (0–7 s) | A myth flip about a thing you own: "Your Apple Watch doesn't actually feel your heartbeat. It watches your blood, using green light." Then "Sounds strange, right?" | Flip lands at 3.4 s |
| Frame 0 | Already inside the cutaway: watch on skin, layers visible, light moving. No title card. | motion 0–1 s 0.38 |
| Story | Relatable scene (mid-run, heart rate climbing) → the question → step 1 → **"But here's where it gets clever"** → step 2 → result (number lands) → **"But there's another problem"** → the fix → recap that echoes the hook → "Did you know…?" | 2 turns, at 32 s and 57 s |
| World | One stylised 3D world, three sets reused: a cross-section (watch → skin → vessel → fat), a macro of the sensor underside, a low-poly runner. | 16 hard cuts (1.9 per 10 s) |
| Camera | Never still: slow drifts and pushes inside every shot, soft cuts between sets. | motion 0–3 s **0.75**, still frames 11.9 % |
| Colour | Dark navy. One accent is the subject (LED green). A second colour (amber) means noise or trouble. | 2 accents |
| Data | Shown as objects in the world: BPM numbers on the watch face (137, then 148), a live waveform drawn above the skin. | |
| Captions | Lower third, 3–4 words in a dark pill; the spoken word turns white and gets an underline, the rest stay grey (karaoke). | |
| Labels | Small dot chips ("● GREEN LED", "● LIGHT SENSOR", "● BEAT TO BEAT") and honesty tags in the corner ("Magnified illustration", "Swelling exaggerated", "Recreated, reading illustrative"). | |
| Ending | Recap repeats the hook's claim as a fact, then a yes/no-ish question for comments. | 301 comments |

For comparison, our factory Shorts score 0.13–0.4 on motion over 0–3 s, with 0–1 hard cuts.

## Why it works (our read)
- It explains one physical mechanism you can *see* once the object is cut open. The cutaway is the hero, not a character.
- It feels like a real engineer explaining, not a meme. The honesty tags add trust.
- The two "but…" turns reset attention at the midpoint, where Shorts usually lose people.
- Nothing is ever static, yet nothing is loud: no bursts, slams or shakes.

## What we kept and what we changed for our test
- **Kept:** the myth-flip hook about something you own, the cutaway world, two turns, one subject colour plus one trouble colour, karaoke pill captions, dot chips, honesty tags, constant drift, a full-screen number beat, the hook-echo recap and a comment question.
- **Changed:** 45 s instead of 84 s (factory rule, 30–45 s), no music bed (Isac adds the platform sound), 2D code-drawn "3D" (gradients and perspective) instead of real 3D renders, the factory voice (Ming, US_James) instead of a human.
- **Topic:** "Your screen can't feel your finger" (projected capacitive touch). It fits the format: a myth flip about a thing everyone owns, a mechanism you can cut open (glass → wire grid → display), a relatable failure (gloves) and a second problem (rain ghost taps).

## Test film: `film/touchscreen/`
See `vo/script.json` for the sourced claims, `out/pace.txt` for pace, and `out/check/sheet.jpg` for the contact sheet.

**Result (2026-11-09):** 47.2 s, Ming US_James, voice + SFX only.
- **Checks:** in-mix listen check WER 0 on all 15 lines; −14 LUFS; readcheck passes.
- **Pace:** motion 0–3 s 0.45 (the reel scores 0.75; our Shorts 0.13–0.4).
- **Jury, round 1: 6.8.**
  - The flip line named the wrong mechanism ("electricity in your finger").
  - Labels were too small.
  - Hits landed on words.
  - The ending had a 1.6 s tail.
- **Jury, round 2: 7.4** (Hook 7, Retention 7.5, Clarity 8, Truth 8, Craft 7.5, Voice 7, Loop 7, Share 7.5). Truth was blocked by an invented "−38 %".
  - After round 2 we replaced it with "FIELD DROPS" and an "Illustrative, not measured" tag.
  - We put the sources on screen and cut the tail to 0.4 s.
  - Not re-juried (max 2 rounds).
- **Lessons for the next cutaway film:**
  1. Frame 0 must read as *your* object. Open on the real phone and slice it open, not on an abstract slab.
  2. Never put an invented number on screen as a hero. Use a word ("FIELD DROPS") or a sourced figure.
  3. Use more hard cuts between sets. The reel has 16; we have 1, because our shots drift but rarely cut hard.
  4. Build one screenshot frame that explains the whole film (here: finger and raindrop on the same glass, both meters dipping).
  5. The finger needs texture (a fingerprint at the contact point). The smooth capsule reads as clip-art.
