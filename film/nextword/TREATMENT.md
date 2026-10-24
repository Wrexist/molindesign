# Next word: how ChatGPT and Claude actually work

A vertical (1080×1920) explainer of about 80 seconds for TikTok, Reels and Shorts, written in code like the other films here. One hard idea: **a chatbot is a machine that guesses the next word**, and everything else (tokens, training, meaning, attention, manners) is how the guesses got good.

## Benchmarks

- **Kurzgesagt-style explainers**: learn the flat, bold shapes and one idea per beat. Don't take the slow, cosmic pacing or the narrator's gravitas.
- **The popcorn clip (`film/popcorn/`)**: learn voice-first timing and word-highlighted captions in the upper third. Don't take the paper palette or the single-object stage. This film moves through many small set pieces.

## Three structures we considered

1. **Glossary**: tokens, then training, then attention, one definition per card. Rejected: it's a lecture, and nothing pulls you forward.
2. **Inside the machine**: fly the camera into a neural net. Rejected: it's the cliché (glowing nodes, grid floors) and it hides the one thing worth knowing.
3. **The guessing game** (chosen): open on a chat reply that turns out to be a string of guesses, then answer the question the hook raises ("so how does a guess sound this smart?"). Every scene is a round of the same game, and the ending is the game again, so the clip loops.

## The native move

**The caret.** A blinking text cursor is the machine's mouth. It is on screen from the first frame to the last. Every scene grows out of it: the next-word odds hang under it, tokens are cut at it, training hides the word right where it sits, and at the end the whole film collapses back into it.

## Voice first

The narration was recorded before any picture existed (`vo/script.json`, Chatterbox engine, see the `film-voiceover` skill §3b). Every visual beat, caption and sound effect reads its time from `vo/vo.js`, so nothing drifts out of sync.

| Line | Words | Picture |
|---|---|---|
| hook | "Every word ChatGPT has ever written to you was a **guess**." | A chat reply types itself word by word; odds flicker under the caret. On *guess*, every word flips to show the odds it was picked at. |
| smart | "One word at a time. So how does a guess sound this **smart**?" | Words fire one at a time; a big question mark drops in. |
| tokens | "First, it never sees words. It sees **tokens**." | "Unbelievable!" is sliced into chips: Un · believ · able · ! |
| numbers | "Little chunks of text, and each one becomes a **number**." | Each chip flips to its number. |
| game | "Then it plays one game, over and over. Guess what comes **next**." | The caret sits at the end of "The cat sat on the". |
| cat | "The cat sat on the... **mat**? Probably. The **moon**? Almost never." | A bar chart of odds grows under the caret; *mat* lights up, *moon* is a sliver. |
| again | "Pick a word, stick it on the end, and guess again. That's the whole **trick**." | The chip flies in; new odds, pick, again, faster and faster: the sentence writes itself. |
| where | "But where do those odds come from? **Reading**. A ridiculous amount of reading." | Pages of text pour into the model from above. |
| hide | "**Trillions** of words. Hide the next one, make a guess, check the answer." | A counter rolls to 15 trillion; a sentence with its last word covered, a guess, a reveal. |
| dials | "Wrong? Nudge billions of tiny **dials**, just a little. Then do it again." | A wall of small dials twitches; the guess turns right. |
| weird | "And here's the weird part. To guess well, it has to learn what words **mean**." | Words float as dots in a map of meaning. |
| queen | "King, minus man, plus woman, lands right next to **queen**." | Arrows add up across the map and land on queen. |
| looks | "It also looks back at everything before, to work out what goes with what." | A sentence: "The trophy didn't fit in the suitcase because it was too big." |
| trophy | "Here, it figures out that *it* means the **trophy**." | Attention arcs from *it* to every earlier word; the thickest lands on *trophy*. |
| ramble | "Out of the box, it just rambles. So people rate its answers, and it learns to be **helpful**." | A rambling reply versus a helpful one; a thumbs-up picks the good one; the dials nudge. |
| names | "Do that at a huge scale, and you get **ChatGPT**. Or **Claude**." | The two names land as chat headers. |
| still | "But it's still guessing. When it doesn't know, it can sound **sure** and be **wrong**." | A confident made-up fact, 94% sure, stamped WRONG. |
| end | "So it's not magic. It's the best next-word guesser ever built." | Everything collapses into the caret; the odds under it read *word*, and the film loops to the first frame. |

## Rules it follows

- Something moves in every frame: the caret blinks, odds flicker, tokens drift. Each scene opens with a hit within 0.3 s of its first stressed word.
- Captions sit in the upper third, highlight each word as it is spoken, and stay out of the platform UI (labels left of x≈930, above y≈1450).
- One palette: ink-dark stage, cream type, one hot coral for "the pick", plus a few chip colours for tokens. No glows, no glowing neural-net clichés.
- No music: the clip goes out with a trending TikTok sound added on the platform, so it ships as voice plus sound effects (`next-word-vo.mp4`) and voice only (`next-word-voice-only.mp4`). The effects are cut to the word times and ducked 6 dB under the voice: typing clicks, slices, a counter whirr, dial ticks, stamps. The groove is still in `SCORE` behind `MUSIC = false`.
- Honest content: tokens are illustrative, the 15-trillion figure is the order of magnitude for today's big models, and the film says plainly that it can be confidently wrong.

## Make it

```
cd film/tools
node render.mjs audio --film nextword          # score + sfx → nextword/out/mix.wav
node render.mjs video --film nextword          # frames → nextword/out/video.mp4
python voiceover.py mix ../nextword/vo/script.json --score ../nextword/out/mix.wav \
  --video ../nextword/out/video.mp4 --out ../nextword/out/next-word-vo.mp4
```
