# Strawberry: why AI couldn't count the r's

Factory #2 · slug `strawberry` · researched 2026-10-23 · part 2 of the "AI explained" series after `film/nextword/` (Next word).

## 1. Topic and one hard idea

**In the question you type, "strawberry" reaches the model as one sealed chip (a single number), so the r's are inside something it can't open; it has to recall the spelling and count in its head, and the fix is to make it spell the word out so every letter becomes a chip of its own.**

Part 1 said "it sees tokens, not words" and showed `Un · believ · able`. This film goes one level deeper: what a token *hides*, why that breaks letter counting, and what newer models do about it. It does not re-explain next-word guessing.

## 2. Hook options

1. **"How many r's in strawberry? ChatGPT used to say two."** (chosen)
2. "Ask ChatGPT how many r's are in strawberry. It used to say two." (the backlog hook)
3. "To ChatGPT, strawberry isn't ten letters. It's the number 101,830."

Chose 1: it is the backlog hook made shorter (10 words instead of 13; the agent rules split lines over 12). The question comes first, so the viewer answers "three" in their head before the contradiction lands at about 2 s, and the last line ("…It can't see what it's counting.") runs straight back into "How many r's in strawberry?" for the loop. "Used to" keeps it honest: the famous failure is a 2024 one, and most chatbots get strawberry right today (see facts). Option 3 is the best *visual* fact and is kept for the screen (lines `single`/`number`), not the voice, because a six-digit number is a weak spoken opener.

## 3. Facts used

All checked 2026-10-23. "Measured" = I ran it myself.

| # | Fact | Used in line | Source |
|---|---|---|---|
| 1 | In the question as people type it ("How many r's are in strawberry?"), **" strawberry" (with its leading space) is a single token** in both OpenAI public tokenizers: **ID 73700** in `cl100k_base` (GPT-4, GPT-3.5) and **ID 101830** in `o200k_base` (GPT-4o, o1, o3, GPT-4.1, GPT-5). Full question in o200k: `How`·` many`·` r`·`'s`·` are`·` in`·` strawberry`·`?` = [5299, 1991, 428, 885, 553, 306, 101830, 30]. | single, number | Measured with tiktoken 0.14.0 (`pip install tiktoken`), https://github.com/openai/tiktoken |
| 2 | The split everyone shows, **`str`·`aw`·`berry`**, is the word *without* a leading space in `cl100k_base` (IDs 496, 675, 15717). In `o200k_base` the bare word splits **`st`·`raw`·`berry`** (302, 1618, 19772). Capitalised `Strawberry` is `Str`·`aw`·`berry` in both. Inside a sentence the model gets the single token of fact 1. | (screen option, see `single`) | Measured, tiktoken 0.14.0 |
| 3 | Spelled with spaces, `s t r a w b e r r y` becomes **10 tokens, one per letter**; ` r` is **ID 428** in o200k (436 in cl100k) and appears **three times**: [82, 260, 428, 261, 286, 287, 319, 428, 428, 342]. | watch, plain | Measured, tiktoken 0.14.0 |
| 4 | Which model uses which tokenizer: tiktoken's own model table maps `gpt-4` → cl100k_base and `gpt-4o`, `o1`, `o3`, `gpt-4.1`, `gpt-5` → o200k_base (vocab sizes 100,277 and 200,019). | blue, same | Measured, `tiktoken.model.MODEL_PREFIX_TO_ENCODING` |
| 5 | In o200k, **" blueberry" is also one token, ID 177717** ("How many b's are in blueberry?" → [5299, 1991, 287, 885, 553, 306, 177717, 30]). In cl100k it was ` blue`·`berry`. | same | Measured, tiktoken 0.14.0 |
| 6 | ChatGPT (GPT-4o) said strawberry has **two** r's and **kept saying two when asked "Are you sure?"**. Asked about "straw" and "berry" separately it found **1 and 2**, then still said the whole word had two. Writing and running Python gave 3; spelling the word with spaces also gave 3 (author: "mixed" results). Blog post 2024-08-10. | hook, sure, berry, code, watch | Kunal Mehta, https://blog.legoktm.com/2024/08/10/how-many-rs-are-in-the-word-strawberry.html |
| 7 | Earliest dated report I found: OpenAI forum, 2024-06-19, "ChatGPT based on GPT-4" confirms two r's. | hook ("used to") | https://community.openai.com/t/incorrect-count-of-r-characters-in-the-word-strawberry/829618 |
| 8 | Models mostly **know the spelling** of their tokens but fail to *use* it (spelling vs. manipulating letters). CUTE benchmark, EMNLP 2024: "most of them seem to know the spelling of their tokens", yet fail to use it to manipulate text. | knows | Edman, Schmid, Fraser, https://aclanthology.org/2024.emnlp-main.177 (arXiv 2409.15452) |
| 9 | Letter counting errors track **repeated letters**, not word frequency: the strongest correlation is with letters that occur more than once; most models fail on words where a letter appears more than twice; models rarely report letters that aren't there ("capable of recognizing the letters but not counting them"). Even GPT-4o miscounted on about 17% of words. 8 models, Dec 2024. | slip, head | Fu, Ferrando, Conde, Arriaga, Reviriego, "Why Do LLMs Struggle to Count Letters?", https://arxiv.org/abs/2412.18626 |
| 10 | Karpathy lists "Why can't LLM spell words?" and "reversing a string" as tokenization problems (Feb 2024). Background for "it never sees letters". | tokens | https://github.com/karpathy/minbpe/blob/master/lecture.md |
| 11 | OpenAI's o1 was developed under the codename **"Strawberry"** (Reuters, July 2024); o1-preview released **2024-09-12**; it was trained to produce a long chain of thought before answering. | codename, think | Reuters https://www.reuters.com/technology/artificial-intelligence/openai-working-new-reasoning-technology-under-code-name-strawberry-2024-07-12/ ; NYT https://www.nytimes.com/2024/09/12/technology/openai-chatgpt-math.html ; OpenAI https://openai.com/index/learning-to-reason-with-llms/ ; summary https://en.wikipedia.org/wiki/OpenAI_o1 |
| 12 | By **August 2025**, in 100 trials each, every model tested counted strawberry correctly except Gemini 2.5 Flash. Claude Sonnet 4 and Opus 4.1 answered blueberry with per-letter breakdowns (spell, then count). | today, think | Max Woolf, 2025-08-12, https://minimaxir.com/2025/08/llm-blueberry/ |
| 13 | **GPT-5** (launched 2025-08-07), asked in the ChatGPT app "how many b's are there in blueberry?", said **three** (first reported by Michael Paulauski; Kieran Healy's post went viral). Altman said the auto-router was broken in those first days; results varied by user. | blue | https://minimaxir.com/2025/08/llm-blueberry/ ; https://kieranhealy.org/blog/archives/2025/08/07/blueberry-hill/ ; launch date https://en.wikipedia.org/wiki/GPT-5 |
| 14 | Background only (not in the script): Meta's Byte Latent Transformer reads raw bytes instead of tokens and matched token models at 8B scale (Dec 2024). Research, not a chatbot you can use. | none | https://arxiv.org/abs/2412.09871 |

**Kept out of the narration on purpose**
- *Why* the wrong answer was "two" and not some other number. A popular guess is that people mostly ask about the double r in "berry", so text says "two r's" a lot. Plausible, unproven.
- That tokenization is the *whole* cause. Fu et al. (fact 9) argue the counting step itself is the weak point and token boundaries matter less than repeated letters. The script says both honestly: the word is sealed (fact 1), the model knows the spelling (fact 8) but must spell and count in its head in one go, and repeats are where it slips (fact 9). The fix (spell it out, fact 3) addresses both.
- Whether today's ChatGPT, Claude or Gemini still fail strawberry. I could not query live chatbots from here; the "most get it right" line rests on the Aug 2025 test (fact 12). Say "most", never "all".
- Why o1 was named Strawberry. The origin of the codename isn't public; the Reuters report (July 2024) and the Q* name predate the August 2024 viral wave. The line just states the name; the picture must not imply the name came from the meme.
- Claude's and Gemini's tokenizers are not public in the same way, so every token ID on screen is OpenAI's (o200k_base), and the voice says "ChatGPT".

## 4. Shot ideas per line

House look: ink-dark stage, cream type, one hot coral accent (the r's / the pick), chips, labels, stamps.

**Proposed native move: the sealed chip.** Part 1's mouth was the caret; this film's is a **token chip that won't open**. The word *strawberry* sits inside one rounded chip with its ID (101830) stamped on it. Every scene pokes at it: it's lit from behind (letters as a faint silhouette you can't reach), it rattles, and in the fix it finally **cracks open into ten letter chips**, three of them coral. At the end the ten chips snap shut back into one, and the loop restarts. (The caret can make a cameo in `sure` as the chat cursor, as a nod to part 1.)

| id | at | Line | Picture |
|---|---|---|---|
| hook | 0.35 | "How many r's in strawberry? ChatGPT used to say two." | A chat bubble types the question; the reply types **2**. A coral "3" hovers over the viewer's side for a beat. |
| sure | 4.32 | "Even when you asked, are you sure? Two." | Second bubble "Are you sure?"; the reply **2** stamps again, harder (stamp sfx). Small dated label: "GPT-4o · Aug 2024". |
| why | 7.58 | "So how does a machine this smart miss a letter?" | Zoom into the word *strawberry* in the bubble; the camera pushes toward its letters. |
| tokens | 11.55 | "Because it never sees letters. It sees tokens." | The letters shrink-wrap into chips (callback to part 1's chip style). |
| single | 14.81 | "And in your question, strawberry is a single token." | The full question chips up: How · many · r · 's · are · in · **strawberry** · ? The famous `str · aw · berry` split flashes, then snaps together into ONE chip (optional label: "not str·aw·berry"). |
| number | 18.42 | "To the model, the whole word is just one number." | The chip flips: **101830**. Small label: "o200k_base, OpenAI's tokenizer". |
| nothing | 22.39 | "No s, no t, no r's. Nothing inside to count." | The sealed chip, letters as a faint ghost behind frosted glass; a magnifier finds nothing to grab. |
| knows | 26.36 | "But here's the twist. It knows how strawberry is spelled." | A thought card next to the chip: s-t-r-a-w-b-e-r-r-y written from memory, slightly handwritten. |
| head | 30.34 | "So it spells and counts in its head, all in one go." | Letters flicker past fast inside a head outline / thought cloud, a counter ticking in one breath. |
| slip | 35.02 | "And repeated letters are exactly where models slip." | The **rr** pair overlaps and blurs into one r; counter misses a tick. |
| berry | 38.28 | "It even said straw has one, berry has two. Total? Two." | Two chips: straw → 1, berry → 2; a sum bar 1 + 2 = … **2** (stamped WRONG in coral). |
| watch | 42.61 | "Now watch the fix. Spell it out, with spaces." | The native move: the sealed chip cracks open, letters spread with spaces. |
| plain | 46.22 | "Every letter becomes its own token. Three r's, in plain sight." | Ten chips with IDs (82, 260, **428**, 261, 286, 287, 319, **428**, **428**, 342); the three 428s light coral, a tally hits 3. |
| think | 50.55 | "Newer thinking models often do exactly that. Spell first, then count." | A "Thinking…" panel scrolls: s, t, r(1), a, w, b, e, r(2), r(3), y → "3". |
| code | 54.88 | "Or they run a little code, and let the computer count." | A code chip: `"strawberry".count("r")` → **3**. |
| codename | 59.21 | "And yes, OpenAI's first thinking model was codenamed Strawberry." | A stamped folder label: CODENAME: STRAWBERRY · o1 · Sept 2024. Keep it a wink, no causal arrow. |
| today | 62.82 | "Today, most chatbots get strawberry right. But it's not gone." | A row of chat replies all saying 3, ticks; one card at the end starts to wobble. |
| blue | 66.79 | "In 2025, a brand-new GPT-5 told someone blueberry has three b's." | New bubble: "how many b's are there in blueberry?" → **3**. Label "GPT-5 · Aug 2025". |
| same | 71.12 | "Same blindness. Blueberry is one token too." | *blueberry* seals into one chip: **177717**. Same frosted look as strawberry. |
| end | 74.02 | "It's not that it can't count. It can't see what it's counting." | Back to the strawberry chip, sealed; the ten letters fold back into it and the film cuts to the first frame's question. |

## 5. Open questions for the director

1. **"r's" and "b's" in Chatterbox.** I put `say` with capital "R's" / "B's" on the hook, `nothing`, `plain` and `blue`, and "G P T five" / "twenty twenty-five" on `blue`. Audition those four first; if "R's" reads as "ers" or "rus", try "ars".
2. **The 101830 vs str·aw·berry beat (`single`).** It is the most surprising true fact (the split most explainers show is not what the model gets when the word sits mid-sentence), but it costs a beat. Keep it visual only; cut the flash if `single` gets crowded.
3. **Tokenizer label.** All IDs are `o200k_base` (GPT-4o / GPT-5 family). If you'd rather match the 2024 GPT-4o screenshot era exactly, the same IDs apply; cl100k (GPT-4) IDs are in fact 1 if you need them.
4. **Tone of `codename`.** It's a fun fact, not a cause. If the jury reads it as implying OpenAI named the model after the meme, cut the line (about 3.6 s) and the film still runs about 76 s.
5. **Length.** 20 lines, 197 words; chained `at` estimates put the last word near 78 s and `dur` at 80.3 s. Chatterbox reads fast (3.5–4 w/s), so the real cut will likely land around 68–75 s. Re-time from `vo/vo.js` after synthesis as usual.
6. **Second example.** Blueberry (GPT-5, 2025) is used because it is verified and shows the same blindness in a newer model. Reversing a word is also a known tokenization weakness (Karpathy, fact 10) but I found no dated, citable viral case, so it stays out.
