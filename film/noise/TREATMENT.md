# Noise: how AI turns static into pictures

A vertical (1080×1920) explainer for TikTok, Reels and Shorts, written in code. Factory #5 on Tech, explained, after `film/gps/`. One hard idea: **the picture is never hidden in the static; the AI paints it in, about 50 small steps at a time, and the prompt steers every step.** Facts and sources: `BRIEF.md`.

Built to the 2026-10-24 stats rules: no title card. Frame 0 is one huge bright object already moving (a full-bleed field of static under a coral magnifier that is already searching), three words on screen (FIND THE CAT), and the magnifier and the rolling TV bar visibly move by 0.3 s. 30–45 s.

## Benchmarks

- **Strawberry (`film/strawberry/`, most views)**: learn that a puzzle the viewer can try holds the first seconds; frame 0 shows the conflict (static, no cat), never the answer. Don't take its chat-bubble set: here the puzzle is a picture, so the picture is the whole frame.
- **A TV "magic eye" / hidden-picture puzzle (the 1990s Magic Eye posters, the "find the hidden object" page)**: learn the magnifier that roams a busy field; it is something a hand does. Don't take the trick itself: here the twist is that nothing is hidden, so the magnifier comes back at the end and finds nothing.

## Three structures we considered

1. **Mechanism first** ("AI image generators start from noise", then training). Rejected: an abstract "how X works" opening, the shape that did worst (Next word, 3 % completion), and "every image starts as noise" isn't true (BRIEF §3).
2. **The dog reveal first** (same static, two prompts, cat and dog on frame 0). Rejected: frame 0 would show the answer (strawberry r1).
3. **Puzzle → training → reversal → twist → question** (chosen): find the cat in the static (you can't), how the tool learned (sprinkle static on a photo until it's pure noise; guess the static), flip it (the same static as frame 0), the native move paints a cat in 50 wipes while the prompt steers, then the twist: same static, type dog, a dog. The cat was never in there. The last line asks for one word and loops to frame 0.

## The native move: the wipe

A coral squeegee bar sweeps down the field; above it the field is one step cleaner. The same bar is the scene transition (it sweeps the old scene away and the next one is already drawn under it). The step chip ticks with every sweep (STEP 1/50 … 50/50): slow at first so the viewer reads one wipe, then faster to 50. Run backwards (sweeping up) it puts the static back, which is how the dog beat returns to the very same static.

## One static, really the same

One seeded field (`#4127`, 90 × 121 cells of 12 px) is drawn on frame 0, `flip`, `dog` and `end`, and is the noise the cat and the dog are painted out of. "Same static" is literally true on screen: a rewatcher can compare frame 0 with the dog beat cell for cell.

## Look (Isac, 2026-10-23: must not look AI-made)

Flat, hand-built things on the ink stage: chunky cream TV static, a coral magnifier, a paper photo print (a drawn orange cat on a porch), a salt shaker that sprinkles grain, a filmstrip, two static tiles, a flicking stack of drawn picture cards, a prompt bar with a caret, a cream squeegee bar. The cat and the dog are bold cream silhouettes in the same sitting pose with one coral collar, drawn with paths (no AI imagery anywhere); the denoise sequence is tagged "ILLUSTRATION · not real model output". Type: Archivo for headlines, Geist Mono for readouts, prompts and small print. One coral accent.

## Voice first

Ming US_James (`vo/script.json`, `film-voiceover` §3c), recorded before any picture; every beat, caption and sound reads its time from `vo/vo.js` through `at(id, word)`. No music (`MUSIC = false`): voice + sound effects, and voice only.

| Line | Stressed word(s) | Picture |
|---|---|---|
| hook | **cat**, **static** | Frame 0: full-bleed bright static, a coral magnifier already gliding over it (2× inside the lens), a rolling TV bar; headline FIND THE CAT. The search phrase chip AI IMAGE GENERATOR pops in at ≈1.6 s. |
| can | **can't**, **can**, **How** | The magnifier stops; a coral ✕ NO CAT on "can't"; the chip knocks on "can"; a big coral ? stamp on "How". |
| trick | **backwards** | A filmstrip: photo → noisier → noisier → static, "ADD STATIC →" under it; on "backwards" a coral ← arrow "LEARN TO UNDO IT" and a ◀◀ chip. |
| photo | **real photo**, **sprinkle** | A paper photo print (an orange cat on a porch) drops in, TRAINING PHOTO; a salt shaker tilts and sprinkles grain; the photo gets grainy, STEP 1 → 50. |
| more | **more**, **pure noise** | STEP 250 → 600 → 1,000 (the real DDPM schedule), the photo dissolves into static. Small print "DDPM 2020: 1,000 steps". |
| guess ("One job: guess which static you added.") | **one job**, **guess** | Two tiles, STATIC ADDED and ITS GUESS; the guess morphs to match; a MISS meter shrinks; a coral ✓ MATCH. |
| good | **hundreds of millions**, **good** | A stack of drawn picture cards flicks past; a counter rolls to 460,000,000+ with TRAINING LOOKS / IN THE LAST ROUND ALONE at 48 px cream and the credit "Stable Diffusion v1-4 model card: 225k steps × batch 2,048"; stamp REALLY GOOD. |
| flip | **flip**, **pure static** | The card flips 180° and the field #4127 is back, the same static as frame 0. Small print "Stable Diffusion starts from random noise in a compressed grid, decoded at the end". |
| steps | **wipe**, **again**, **50** | The native move: wipe 1, wipe 2, then faster; STEP n/50; soft shapes condense. Chip "Stable Diffusion default · 50 steps". Tag "ILLUSTRATION · not real model output". |
| steer | **prompt**, **every step**, **cat** | A prompt bar "a cat" types in; a coral arrow from the prompt into every wipe; the cat sharpens and lands on "cat". |
| dog | **same static**, **dog**, **dog** | Wipes run backwards to the same static (SAME STATIC #4127); the prompt retypes a cat → a dog; fast wipes, a dog. Then the DM frame: the static tile on top, arrows to a cat card and a dog card (≥ 44 px labels), held ≥ 3 s. |
| never | **never**, **painted** | The magnifier crosses the static tile and finds nothing: stamp NEVER IN THERE. |
| end | **one word**, **Go** | The field #4127 again with the magnifier and a prompt box "type one word_"; on "Go" it dissolves into frame 0. |

## Rules it follows

- Something moves every frame: the rolling TV bar, the magnifier, the shaker, the wipes, the card stack, papers sway 1–2°, the camera pushes 1.5 % per scene.
- A visual hit on every stressed word, keyed with `at(id, word)`; the next scene is drawn under each wipe (no bare cuts).
- Safe area is measured, not eyeballed: `node film/tools/boundscheck.mjs --film noise` renders every frame at 15 fps and fails on any glyph box, chip or stamp outside x 90–930 or below y 1450.
- Captions in the upper third (y ≈ 360), one block at a time, pills only on stressed words; meaning labels ≥ 36 px cream; everything inside x 90–930 and above y 1450 (measured with `still`, not by eye); stamps at y ≈ 1280.
- Honest: 1,000 steps (DDPM), 50 steps (Stable Diffusion default), 460,000,000+ training looks in the last round alone (225k × batch 2,048, SD v1-4 model card), "often about 50 times" in the voice, "AI IMAGE GENERATORS like Stable Diffusion" on screen, DRAWN STAND-IN on the training photo, the latent-grid small print, ILLUSTRATION tag; the voice never says "every" or "exact".
- Ban list respected: no glowing nets, grid floors, particle bursts, lens flares, shake, bouncy easing, AI imagery.
