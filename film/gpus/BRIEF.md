# GPUs: why AI made Nvidia rich

Factory #12 · slug `gpus` · backlog row 13 · researched 2026-10-27 · follows `film/password/` and `film/temperature/` (both parked at 7.2–7.5, falling with each fix round) and `film/qrcode/` / `film/memory/` (8.0). Channel: Tech, explained (not named in the script). American English, US audience, AI voice Ming US_James (seed 7), disclosed in the post. Built to the stats rules: 30–45 s (chain estimate 41.4 s), 13 lines, 99 spoken words, a 5-word hook from 0.2 s, the search phrase spoken from about 2.4 s, and a yes-or-no ending the picture doesn't answer.

**No investment advice, no stock price, no market cap.** Every money figure is from Nvidia's own earnings release or 10-K, dated, and is *sales* (revenue), never profit or share price.

**First cut has to land near 8** (LESSONS, password r1–r3). Everything in §0 is decided here, before any render, so the director builds it once instead of patching it.

## 0. Plan for the first cut (decided before render)

| Rule from LESSONS | This film |
|---|---|
| **One hero moment / stamp; the rest quieter** | **The hero is line `once` (≈ 31.3–33.5 s): the print-block slam.** A hand-carved print block the size of the sheet comes down once and inks **every** multiply-add cell on the sheet at the same instant, with the film's only coral stamp, **ALL AT ONCE**, and the film's biggest sound (a heavy wooden thump in the pause after "once"). Every other beat is a quiet change: a chip sliding in, a counter rolling, a pencil tick, a card flipping. No other coral stamp in the film. |
| **Hand-made hero prop, not icon-kit art** | **The multiply-add sheet and the print block.** A cream paper sheet (≤ 800 px wide) ruled into a grid of tiny cells, each cell a hand-lettered "×+" waiting to be inked. The laptop side gets **one small rubber stamp** that inks cells one at a time; the gaming-card side gets **a carved print block** (wood-grain edge, a visible knife-cut grid on its face) that inks the whole sheet in one press. The gaming card itself is a **cut-cardboard card**: flat card stock with a hand-cut PCB edge (the gold contact fingers drawn as paper tabs) and a hand-lettered "FOR GAMES" sticker. **Not allowed:** fan-grid GPU racks, server-rack icons, glowing chip renders, circuit-trace backgrounds, dot-and-line networks, a real Nvidia logo or a real product photo. |
| **Honest scale on the hero** | Grid = **64 × 34 = 2,176 cells, label "1 CELL = 10 CORES"** (2,176 × 10 = 21,760, the RTX 5090's exact CUDA-core count). The laptop gets **1 cell** (10 cores). So the sheet is to scale, not a vague "lots". |
| **No stretch over 1.5 s without voice** | The chain leaves 0.4 s between lines; the longest planned silence is the pause after `once` (keep it ≤ 0.8 s, it carries the hero thump). After `end`, cut to frame 0 within 1.0 s. If Ming runs fast and opens a gap > 1.2 s anywhere, move the next line up rather than fill with a prop. |
| **Screenshot frame planned** | **`cpu` → `once` (≈ 24.8–33.5 s, about 8.5 s):** the sheet with two columns, **LAPTOP CPU: 10 BIG CORES** (one cell) vs **GAMING CARD: 21,760 TINY CORES** (the whole grid). Both labels ≥ 48 px cream, the numbers ≥ 72 px, held still while the stamps work. This is also the DM-able frame. |
| **Every label stated with the moment it's true** | Listed per line in §4; the rule for the director: a label appears on the word that makes it true and leaves before the next line contradicts it (e.g. "$96 BILLION" shows "SALES · QUARTER ENDED JULY 26, 2026" by 1.5 s; "STARTED OUT IN GAMES" carries "FISCAL 2016" while it's on screen; "21,760" never shows before "twenty-one thousand" is spoken). |
| **No quotation longer than its source** | Only two quotes may go on screen, verbatim and complete: AlexNet paper **"two GTX 580 3GB GPUs"** and Nvidia's explainer **"…have to be done at once"** (starts mid-sentence, so it opens with "…"). No other text in quote marks. |
| **Frame 0 ≤ 4 words** | **$96 BILLION · 3 MONTHS** (4 tokens). Nothing else readable on frame 0. |
| **Stamp-on-everything ban** | One coral stamp (ALL AT ONCE). The contest result is a ruled tally, not a stamp; the sales number is a rolling counter, not a stamp. |

## 1. Topic and one hard idea

**Nvidia's chips were built to paint game pixels all at once, and AI training turned out to be the same kind of work, billions of tiny multiply-adds at once; so the gaming-chip company now makes over 90 % of its sales from data centers, about $96 billion in one quarter.**

Story order: a number (the stake) → the question → where the money comes from → the contradiction (it started in games) → the true story (Toronto, 2012, two $499 gaming cards win the image contest) → the mechanism (multiply-add; 10 big cores vs 21,760 tiny ones; **all at once** = hero) → the payoff (made for game pixels, now trains AI) → a yes/no question about the viewer's home.

**Native move for this film: the stamp sheet.** Work is shown as ink going onto paper cells. A CPU is a hand stamp (one cell per press); a GPU is a print block (every cell per press). The same sheet appears for game pixels (line `pixels`: the inked grid turns out to be a game frame's pixels) so the payoff is the hero prop re-read, not a new diagram.

**Main search phrase: `why is Nvidia so rich`** (spoken verbatim in `ask`, starting about 2.4 s, landing about 2.5–4.5 s). Show it on screen in the first 2–3 s (as the question chip, upper third) and in the caption's first line. Secondary phrases for the SEO agent (volumes not checked): `why is nvidia so big`, `nvidia AI chips`, `why do AI use GPUs`, `GPU vs CPU`, `how did nvidia get so rich`, `AlexNet GTX 580`, `CUDA cores`.

**DM-able moment:** the screenshot frame: **your laptop: 10 cores · a gaming card: 21,760**, all doing one multiply-add at once. Second: **2012: two $499 gaming cards won the contest that kicked off modern AI** (keep "kicked off modern AI" out of narration and on-screen claims; see §5).

**Proposed YouTube title (4–8 words, Title Case, one emoji):** **"Why AI Made Nvidia So Rich 🤔"**. Alternatives: "How Gaming Chips Made Nvidia Rich 🤔", "Why AI Runs on Gaming Chips 🤔".

## 2. Hook options

1. **"Ninety-six billion dollars. Three months."** (chosen, 5 spoken words, on screen **$96 BILLION · 3 MONTHS**) A number stake a viewer can't place yet: whose money? It opens the loop that line 2 names ("So why is Nvidia so rich?"), so the search phrase lands by 2.5 s without starting a line on a name (Ming drops names at the start of short lines, LESSONS gps). The number is Nvidia's own reported quarter (fact 1). Condition chip at 1.5 s: **SALES · NVIDIA · QUARTER ENDED JULY 26, 2026**.
2. "One company sells the shovels for the AI gold rush." (the backlog hook, rejected) 10 words, over the 6-word cap; a metaphor, not a stake or number; abstract openings did worst (stats 2026-10-24); and the shovel/gold-rush line is a commentator cliché the picture can't show without stock art. Its idea survives as the film's shape (Nvidia sells the tool, not the gold), unspoken.
3. "Two gaming cards started the AI boom." (6 words, rejected for truth) Strong story hook, but "started the AI boom" is an opinion no primary source states; the paper only shows they won ILSVRC-2012 by a wide margin. The true version lives in lines `toronto` / `won`.

## 3. Facts used

All read 2026-10-27. Primary sources only: Nvidia's earnings release (newsroom and SEC 8-K copy), Nvidia's FY2017 10-K, the NeurIPS 2012 paper, Nvidia's GTX 580 launch release and datasheet, Nvidia's RTX 5090 spec page, Nvidia's deep-learning performance docs and explainer blog, Apple's MacBook Air spec page.

| # | Fact | Line | Source |
|---|---|---|---|
| 1 | **Nvidia's latest reported quarter (Q2 fiscal 2027, ended July 26, 2026; released Aug 26, 2026): revenue $96.2 billion** ($96,221M), up 106 % from a year ago. Next report (Q3 FY27, guided at $108.0 billion ± 2 %) is due after this film; if it posts first, the director/SEO must swap to the new figures or keep "quarter ended July 26, 2026" on screen. | hook | Nvidia newsroom: https://nvidianews.nvidia.com/news/nvidia-announces-financial-results-for-second-quarter-fiscal-2027 ; SEC 8-K exhibit: https://www.sec.gov/Archives/edgar/data/0001045810/000104581026000073/q2fy27pr.htm |
| 2 | **Data Center revenue $89.0 billion** in that quarter, up 117 % from a year ago = **92.5 %** of $96.2B (our arithmetic). "Over ninety percent" is safe. The rest is the new "Edge Computing" segment, $7.2 billion (PCs, robotics, cars; the release no longer reports a separate Gaming line). Data Center includes networking as well as GPUs, so say "data centers", not "AI chips". | dc | same as fact 1 |
| 3 | **Ten years ago it was a gaming company.** Fiscal 2016 (year ended Jan 31, 2016): **Gaming $2,818M of $5,010M total (56 %); Datacenter $339M (about 7 %)**. Comparison point if wanted on screen (not narrated): Datacenter sold $339M in that whole year vs $89.0B in one quarter now. | games | Nvidia FY2017 Form 10-K, revenue by market table: https://www.sec.gov/Archives/edgar/data/1045810/000104581017000027/nvda-2017x10k.htm |
| 4 | **AlexNet, 2012.** Alex Krizhevsky, Ilya Sutskever, Geoffrey E. Hinton, all University of Toronto. "Our network takes between five and six days to train on **two GTX 580 3GB GPUs**." Entered ILSVRC-2012 and "achieved a **winning top-5 test error rate of 15.3%**, compared to **26.2%** achieved by the second-best entry." (The winning entry was "a variant of this model".) | toronto, won | Krizhevsky, Sutskever, Hinton, "ImageNet Classification with Deep Convolutional Neural Networks", NeurIPS 2012: https://papers.nips.cc/paper_files/paper/2012/hash/c399862d3b9d6b76c8436e924a68c45b-Abstract.html (PDF: https://papers.nips.cc/paper_files/paper/2012/file/c399862d3b9d6b76c8436e924a68c45b-Paper.pdf) |
| 5 | **The GTX 580 was a gaming card.** Nvidia's 2010 launch release: "GeForce GTX 580 GPU Brings New Level of Geometric Realism to PC Gaming", "the latest consumer GPU", "**512 cores** … deliver massive tessellation and compute firepower for games", "estimated SEP of **$499** USD". Datasheet: 32 CUDA cores per SM. | toronto | Nvidia launch release (PDF): https://nvidianews.nvidia.com/_gallery/download_pdf/54481926f6091d273500019d/ ; datasheet: https://www.nvidia.com/docs/IO/100940/GeForce_GTX_580_Datasheet.pdf |
| 6 | **Neural-network training is mostly multiply-adds.** Nvidia docs: "GEMMs (General Matrix Multiplications) are a fundamental building block for many operations in neural networks, for example fully-connected layers, recurrent layers … and convolutional layers." A matrix product needs "M * N * K **fused multiply-adds** (FMAs)… Each FMA is 2 operations, a multiply and an add." **Our arithmetic:** one 4,096 × 4,096 × 4,096 product = 68.7 billion multiply-adds, so "billions of times" understates it. "Mostly" is our word (layers are built on GEMMs; there are other operations too). | why, move | Nvidia Deep Learning Performance docs, Matrix Multiplication Background: https://docs.nvidia.com/deeplearning/performance/dl-performance-matrix-multiplication/index.html |
| 7 | **A laptop processor: 10 cores.** MacBook Air (Apple M5): "10-core CPU with 4 super cores and 6 efficiency cores". Narration says "about ten" because laptops vary; screen names this one as the example. | cpu | Apple, MacBook Air tech specs: https://www.apple.com/macbook-air/specs/ |
| 8 | **A gaming card today: 21,760 cores.** GeForce RTX 5090: "NVIDIA CUDA Cores: 21760". These are small, simple cores, not comparable one-for-one with a CPU core; narration says "tiny ones" and the screen says **TINY** vs **BIG**. | gpu, once | Nvidia RTX 5090 page: https://www.nvidia.com/en-us/geforce/graphics-cards/50-series/rtx-5090/ |
| 9 | **Built for doing graphics at once.** Nvidia's explainer: a CPU is "just a few cores with lots of cache memory"; a GPU is "hundreds of cores that can handle thousands of threads simultaneously. … That makes them ideal for graphics, where textures, lighting and the rendering of shapes **have to be done at once**." (Post from Dec 2009, updated; core counts in it are old, so use it only for the idea, the counts come from facts 7–8.) | once, pixels | Nvidia blog, "What's the Difference Between a CPU and a GPU?": https://blogs.nvidia.com/blog/whats-the-difference-between-a-cpu-and-a-gpu/ |

**Wording choices tied to sources**
- `hook` says dollars, not "made" or "earned": it's revenue (fact 1). Screen adds **SALES**. Never show net income (GAAP $59.7B includes investment gains, and it invites "profit" claims).
- `ask` "so rich" is the viewer's search phrase, a question, not a claim.
- `dc` "Over ninety percent came from data centers": 92.5 % (fact 2). Screen: **DATA CENTERS: $89.0B OF $96.2B**.
- `games` "its chips started out in video games": Nvidia's revenue was majority Gaming in fiscal 2016 and its 2010 flagship was sold "for games" (facts 3, 5). Not "were built for games" about today's data-center chips.
- `toronto` "a Toronto team used two gaming cards": three University of Toronto authors, two GTX 580s (facts 4, 5). Don't name Sutskever or Hinton in narration (Ming name risk, and it turns into a celebrity story); names can sit on the paper card.
- `won` "won a big image contest by a mile": 15.3 % vs 26.2 % top-5 error (fact 4). Screen shows both numbers and what they are.
- `why` "mostly one move": fact 6, "mostly" is ours.
- `move` "Billions of times": fact 6 arithmetic; real training runs are far more, so this is a floor.
- `cpu` "about ten cores": fact 7, the example is named on screen.
- `gpu` "over 21,000 tiny ones": fact 8.
- `once` "All doing that move at once": Nvidia's own "done at once" / "simultaneously" (fact 9).
- `pixels` "Made for game pixels. Now it trains AI.": facts 4, 5, 9.
- `end` asks the viewer; no claim.

**Kept out on purpose**
- Stock price, market cap ("most valuable company"), "buy/sell", any forecast beyond what the release states. No investment advice.
- "Nvidia invented the GPU" (Nvidia's own marketing claim, contested; not needed).
- "AlexNet started the AI boom" / "the big bang of deep learning": opinion, widely said but not in a primary source.
- CUDA, Tensor Cores, H100/Blackwell/Rubin names, China export rules, competitors (AMD, Google TPU): true but a second idea each.
- Net income and margins (fact 1 note).
- The gold-rush/shovels metaphor in narration (§2).

## 4. Shot ideas per line

House look: ink-dark stage, cream type, one hot coral accent (reserved for the hero stamp and the sales number), chips, labels. Everything hand-made paper: card stock, ruled sheets, rubber stamps, a carved block. Keep x 90–930, y 300–1430; sheets ≤ 800 px wide; fill the frame (no small hero under a headline). Quantize every rolling number to the sampled frame. A new object or change every 2–4 s; the torn-edge wipe moves along one axis only.

| id | at (est.) | Line | Shot · label and the moment it is true |
|---|---|---|---|
| hook | 0.2 | "Ninety-six billion dollars. Three months." | **Frame 0:** a long cream paper adding-machine tape curls down from the top, its total line huge in coral: **$96 BILLION**, with **3 MONTHS** hand-lettered under it (frame-0 words: 4). The tape is still printing (the last digit rolls in at 0.0–0.3 s so the frame moves). At ≈ 1.5 s, the condition chip pops beside it, not on it: **SALES · NVIDIA · QUARTER ENDED JULY 26, 2026**. |
| ask | 2.39 | "So why is Nvidia so rich?" | The search phrase appears big in the upper third: **WHY IS NVIDIA SO RICH?** The tape shrinks to the left third. |
| dc | 4.93 | "Over 90% came from data centers." | The tape is torn in two at a ruled line: a long piece (**DATA CENTERS $89.0B**) and a short stub (**EVERYTHING ELSE $7.2B**). Chip: **NVIDIA EARNINGS, AUG 26, 2026**. Label appears on "data centers". |
| games | 7.83 | "But its chips started out in video games." | The cardboard gaming card slides in on the cut (hand-cut gold-finger tabs, sticker **FOR GAMES**). Behind it a small paper pie for **FISCAL 2016: GAMING 56% · DATA CENTER 7%** (both ≥ 40 px), shown only while this line plays. |
| toronto | 11.09 | "In 2012, a Toronto team used two gaming cards." | The card duplicates into two, side by side, on a paper lab bench card: **TORONTO · 2012**. Card labels: **GTX 580 · $499 · 512 CORES** (each). Small verbatim tag: "two GTX 580 3GB GPUs" · KRIZHEVSKY, SUTSKEVER, HINTON, 2012. |
| won | 15.06 | "Their AI won a big image contest by a mile." | A ruled score card (re-created, tag **RE-CREATED**): **ILSVRC 2012 · WRONG GUESSES (TOP-5)**, two hand-drawn bars: **15.3%** (theirs, cream) and **26.2%** (2nd place, grey). The 26.2 bar draws first, then 15.3 stops short of it: "by a mile" is the gap. No stamp. |
| why | 19.03 | "Here's why. Training AI is mostly one move." | Torn-edge wipe; the hero sheet slides up under the tear (drawn before the tear clears). One cell zooms up big. |
| move | 22.29 | "Multiply, then add. Billions of times." | Inside the big cell, hand-lettered: **3 × 4 = 12, + 12 = 24** (labelled **EXAMPLE**). On "billions" the camera pulls back to show the whole 64 × 34 grid of blank cells. Chip: **ONE BIG MATRIX ≈ 69 BILLION OF THESE · NVIDIA DOCS, OUR MATH**. |
| cpu | 24.83 | "A laptop's processor has about ten cores." | **Screenshot frame starts.** Left column label **LAPTOP CPU: 10 BIG CORES** (example chip: MACBOOK AIR, M5). A small rubber stamp inks **one** cell (scale: **1 CELL = 10 CORES** shown now). Then it starts stamping cells one after another, slow, with soft ticks. |
| gpu | 27.73 | "A gaming card has over 21,000 tiny ones." | Right label lands on "twenty-one thousand": **GAMING CARD: 21,760 TINY CORES** (RTX 5090, NVIDIA). The carved print block lowers over the sheet, its knife-cut grid matching every cell. The laptop stamp is still on cell 3 or 4. |
| once | 31.34 | "All doing that move at once." | **HERO.** On "once": the block slams; every one of the 2,176 cells inks at the same frame (no ripple, no stagger: the point is *at once*). The only coral stamp: **ALL AT ONCE**, beside the sheet, not on it. Heavy wood thump in the pause after "once". The laptop stamp has reached cell 5. Verbatim tag after the slam: "…have to be done at once" · NVIDIA. **Screenshot frame ends.** |
| pixels | 33.89 | "Made for game pixels. Now it trains AI." | The inked sheet tilts: the ink pattern reads as a simple game frame (a pixel-art landscape the block printed). On "Now it trains AI" the same cells re-ink to the multiply-add marks. Same prop, re-read. |
| end | 37.14 | "Got an Nvidia chip at home? Yes or no." | A paper house outline with the door ajar and the inside **left dark** (picture doesn't answer). Two big chips **YES / NO**. Cut to frame 0 (the adding-machine tape) within 1 s of "no". |

Sound: soft ticks for the laptop stamp, a paper tear on `dc`, a card slap on `games`, the heavy block thump on `once` (the film's loudest hit, ≥ 3 dB under the neighbouring voice, in the pause after the word). Place every hit from Whisper's heard words, not vo.js (LESSONS Voice).

## 5. Open questions for the director

1. **Length.** 13 lines, 99 spoken words, chain estimate 41.4 s; Ming usually runs a little faster. If long, cut "Billions of times." (the grid pull-back still says it) before anything else.
2. **Turn words.** "So" 2.4 s, "But" 7.8 s, "In 2012" 11.1 s (story turn), "Here's why" 19.0 s, the laptop/card contrast 24.8–31 s, "Now" 33.9 s. 19–31 s has no spoken turn word; the picture turns carry it (pull-back, block lowering). Check the jury agrees.
3. **Ming risks.** "Nvidia" mid-line (en-VID-ee-uh); "twenty twelve" (should not come out "two thousand twelve", either is fine); "twenty-one thousand"; "Here's why." is a short sentence before a longer one, watch the pitch drop. Unhinted Whisper check on "Nvidia", "Toronto", "multiply".
4. **Hero prop build.** The print block must be drawn, not a stock icon: wood edge, knife-cut grid face, slight ink unevenness per cell (seeded, so frames are deterministic). The grid is exactly 64 × 34; label "1 CELL = 10 CORES" so the count stays honest.
5. **Truth on screen.** Sales are labelled SALES and dated; FISCAL 2016 shares only while `games` plays; CPU and GPU cores labelled BIG and TINY; the "69 billion" chip says OUR MATH; the contest card says what the percentages are (wrong guesses, top-5). If Nvidia reports Q3 FY27 before posting, re-check fact 1–2 and either update or keep the dated label.
6. **No real UI or brand art.** No Nvidia logo, no GeForce box art, no photo of a card; the cardboard card is generic with hand lettering. Product names appear only as text labels with their sources.
7. **Pinned comment ideas for the SEO agent:** (a) "The two cards in 2012 were GeForce GTX 580s, $499 each at launch in 2010, and training took five to six days (Krizhevsky et al., 2012)." (b) "Ten years ago gaming was 56% of Nvidia's sales; data centers were 7% (Nvidia 10-K, fiscal 2016)."
8. **End-card sources:** "Nvidia earnings release, Aug 26, 2026 · Nvidia 10-K FY2017 · Krizhevsky, Sutskever & Hinton, NeurIPS 2012 · Nvidia GTX 580 & RTX 5090 specs · Nvidia docs · Apple MacBook Air specs".
9. **Description fine print (for the SEO agent):** "Sales figures: Nvidia's Q2 fiscal 2027 earnings release (quarter ended July 26, 2026). Revenue, not profit. Not investment advice. Core counts: Apple MacBook Air (M5) 10-core CPU; GeForce RTX 5090 21,760 CUDA cores, which are much smaller than CPU cores."

## Log

- 2026-10-27 · researcher: brief and script written. Hook changed from the backlog's shovel metaphor to the sales number (§2). Hero = print-block slam on `once`; screenshot frame = 10 vs 21,760 cores (`cpu`–`once`).
