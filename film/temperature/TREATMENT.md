# Temperature: why the same question gets different answers

A vertical (1080×1920) explainer for TikTok, Reels and Shorts, written in code. Factory #10 on Tech, explained, How AI works part 6, after `film/qrcode/`. One hard idea: **a chatbot doesn't always pick the likeliest next word; it rolls weighted dice over the odds, on purpose, and the dial on those dice is called temperature.** Facts and sources: `BRIEF.md`.

Built to the stats rules: no title card. Frame 0 is one cream bubble, **"Best pizza topping?"**, sent down two coral leads into two big generic phones (round punch-hole, no logo): the left one has answered **Pepperoni.**, the right one shows typing dots and types **Mushrooms.** from 0.12 s, while a coral ≠ stamp is mid-slam across both. Four words on frame 0 (Best pizza topping? / Pepperoni.), plus the RE-CREATED provenance tag, which is there from frame 0 because the headline names ChatGPT over drawn chats. The search phrase WHY DOES CHATGPT GIVE DIFFERENT ANSWERS? comes in as the headline at 1.45 s. The loop back into frame 0 shows the right phone still typing and no ≠, so the last 0.3 s never hints at an answer.

## Benchmarks

- **Strawberry (`film/strawberry/`, most views)**: learn the puzzle the viewer can try on their own phone and the contradiction on frame 0. Don't take its chat-scroll: the object here is a die the viewer watches roll, not a transcript.
- **Zack D. Films "Why ChatGPT Contradicted Itself 🤔" (14.0M)**: learn the second-person "you saw this happen" premise and one object carrying the explanation. Don't take the 3D-render look or the unsourced claim: our dice are flat paper and every number is sourced.

## Three structures we considered

1. **The 80/1,000 number first** ("One lab asked an AI the same thing 1,000 times"). Rejected: it's temperature 0 and server math, a second mechanism; as a hook it promises the wrong film.
2. **The dial first** ("Every chatbot has a dial called temperature"). Rejected: abstract, nothing the viewer has seen; Next word (abstract) had our worst completion.
3. **Same question, two answers → why → it rolls dice, on purpose → the odds → weighted dice → the dial → down / up → why not always the favorite? → it got stuck → but even at zero: 80 of 1,000 → ask yours twice** (chosen). A contradiction the viewer has seen, one turn (the stuck loop shows why the dice are there), a twist (zero isn't zero), and an end that loops into frame 0.

## The native move: the die and the dial

A paper die (a real 3D cube, orthographic, flat-shaded paper faces with a drawn topping and its word) tumbles and lands on a word; that word's odds bar flashes and the word drops into a ROLLS tally. Under it, three odds bars (PEPPERONI / MUSHROOMS / PINEAPPLE, EXAMPLE ODDS) and a knob marked 0 · 1 · 2 (OpenAI's range). Turning the knob reshapes the bars by the real softmax rule (p^(1/T), renormalised): at 0.2 they read 99 / 1 / 0 %, at 1.8 they read 48 / 30 / 22 %. Rolls at each setting draw only words those odds make plausible.

**Scene cuts** use the house torn-paper edge rising from the bottom, the next scene drawn under it (jury r1: the radial dial sweep read as a laser-pointer glitch). The die itself follows the dial: the four non-PEPPERONI faces are painted pepperoni from the top by (6P − 2)/4, so PEPPERONI covers ~99 % of the die at 0.2 and shrinks at 1.8.

## Look

Flat, hand-built things on the ink stage: generic phones with paper chat bubbles, the paper die, chunky bars, a knob, a printout of the real GPT-2 output (re-created, line breaks at the repeats), a prompt slip and a stack of 1,000 slips, a paper sentence strip that forks. Archivo for headlines, Geist Mono for readouts. One coral accent. No dice clip-art, no casino.

## Line → picture

| Line | Stressed word(s) | Picture |
|---|---|---|
| hook "Same question. Two different answers." | **Same**, **different** | Two phones, same pizza "?" bubble; left says Pepperoni., right types Mushrooms.; ≠ stamp slams; SAME QUESTION. then TWO ANSWERS. |
| ask "So why does ChatGPT give different answers?" | **why**, **different** | Reply bubbles shake; a coral ? stamp drops between the phones; RE-CREATED tag. |
| dice "Here's the trick: it rolls dice. On purpose." | **trick**, **dice**, **purpose** | Dial wipe; the big paper die tumbles in and lands on PEPPERONI; ON PURPOSE stamp. |
| odds "Every next word has odds. Best pizza topping? Pepperoni gets 60%." | **odds**, **60%** | The die moves up-left; three odds bars grow one after another, each counting its % up as it rises (60 / 25 / 15), EXAMPLE ODDS chip; the 60% bar flashes. |
| weighted "Weighted dice, so mushrooms still win sometimes." | **weighted**, **mushrooms** | Three fast rolls: PEPPERONI, PEPPERONI, MUSHROOMS; each drops into the ROLLS tally, its bar flashes. |
| dial "They come with a dial. It's called temperature." | **temperature** | The die and bars lift as the knob slides in at 1; a test turn 1 → 1.3 → 1 on "dial" wobbles the bars; TEMPERATURE, T = 1.0; OPENAI API · 0–2 · DEFAULT 1. |
| down "Turn it down, and the favorite almost always wins." | **down**, **almost** | Knob to 0.2; bars squeeze to 99 / 1 / 0; four rolls, all PEPPERONI; LOW = FOCUSED. |
| up "Turn it up, and long shots get a chance." | **up**, **chance** | Knob to 1.8; bars even out to 48 / 30 / 22; rolls PINEAPPLE, MUSHROOMS, PEPPERONI; HIGH = MORE RANDOM. |
| why "Why not always pick the favorite?" | **always** | Knob snaps to 0; PEPPERONI bar 100 %; the tally clears; ? stamp on the die. |
| stuck "Researchers tried. It got stuck repeating itself." | **tried**, **stuck** | Dial wipe; the real GPT-2 beam-search output prints faster and faster, 34 px mono, the "Universidad Nacional Autónoma de México/" repeats highlighted coral and running on past the sheet so the paper feeds up through the window (the source's own line ends in "…", so the loop is shown continuing; the sheet is marked RE-CREATED); ALWAYS THE LIKELIEST WORDS · GPT-2 · HOLTZMAN ET AL., ICLR 2020; RE-CREATED; STUCK stamp. |
| zero "But at zero, a lab asked the same thing 1,000 times." | **zero**, **1,000** | The wipe brings up TEMPERATURE 0 with a mini dial at 0 straight away, then OPEN MODEL QWEN3; prompt slip "Tell me about Richard Feynman"; slips pile up, ×1,000. |
| eighty "80 different answers. Busy servers round the math differently." | **80**, **differently** | 80 DIFFERENT ANSWERS · OUT OF 1,000 RUNS (the screenshot frame, conditions still on screen); the sentence strip "…born on May 11, 1918, in" forks at token 103 into Queens, New York ×992 and New York City ×8; SAME FACT · DIFFERENT WORDS and SERVER LOAD CHANGES ROUNDING, both ≥ 38 px, over one source line, TOKEN 103 · THINKING MACHINES LAB, SEP 2025. |
| end "So ask yours twice. Same answer? Yes or no." | **twice**, **yes**, **no** | Dial wipe back to the two phones, both still typing (the picture doesn't answer); YES / NO pills; sources; dissolves into frame 0. |

## Sound

No music (Isac adds a trending sound). Foley from the same timeline: paper flaps for bubbles and slips, a wooden knock when the die lands (a short rattle while it tumbles), knob ratchet ticks only in real gaps between words, rubber-stamp thumps, a soft printer chatter in `stuck`, a whoosh on each dial wipe. Every hit's whole body is pushed into a real gap between words (`gapT`), and a hit that can't find one stays silent. The margin is per sound: a noisy or sustained one (rattle, swish, sweep, paper, slap, stamp) keeps 0.15 s clear of a word, a short transient (knock, pop, tick, printer key) 0.14 s, because Whisper hears a word up to ~0.12 s from where `vo.js` puts it. Bursts (the typing, the printer, the ratchet, the paper pile) keep their rhythm inside whatever gap they land in.
