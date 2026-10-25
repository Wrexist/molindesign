# Memory: why AI forgets what you said

Factory #8 · slug `memory` · topic row 9 · researched 2026-10-25 · follows `film/battery/`. **How AI works, part 5** (after Next word, Strawberry, Hallucinate, Noise). Channel: Tech, explained (not named in the script). American English, US audience, AI voice Ming US_James (seed 7), disclosed in the post. Built to the stats rules: 30–45 s, 8–13 lines, a hook of 6 words or fewer from 0.2 s, a puzzle the viewer has lived through, and an ending that asks a yes-or-no question.

## 1. Topic and one hard idea

**The chatbot doesn't remember your conversation at all. It reads the whole chat again, from the top, every time you hit send, and that page only holds so much. Past the limit, the start can fall off.**

**The film is a viewer-as-subject puzzle** (fyp and battery lessons: the viewer as the subject gave the best openings). Line 1 is an annoyance most ChatGPT users have had or heard of: you told it something early and it lost it. The twist (line 3) is a contradiction: it was never remembering in the first place (OpenAI: each request is "independent and stateless", fact 1). The DM-able picture follows: by reply 100 it has read your first message 100 times. Then the limit, with a real dated number (free ChatGPT, about 20,000 words, fact 4), and the payoff: the oldest messages can fall off the top, the one with your name among them. The honest coda: apps patch it with summaries and saved memories, and OpenAI itself says memory doesn't keep every detail. The end asks "has it ever forgotten yours? Yes or no," which loops straight into "Why does ChatGPT forget your name?"

**Main search phrase: `why does ChatGPT forget`.** Spoken inside the hook (0.2–2.5 s). Show it on screen in the first 2 s and in the caption's first line. Secondary phrases for the SEO agent: `context window`, `ChatGPT context window`, `ChatGPT memory`, `why does ChatGPT forget what I said`, `ChatGPT forgets conversation`, `ChatGPT long chat`. I didn't check search volumes.

**DM-able moment:** line `hundred`: "By reply 100, it's read your first message 100 times." Easy to picture (one paper sheet fed through a reader 100 times, a tally counter), true by construction (fact 1–2), and the line someone sends to the friend with a 400-message chat.

**Proposed YouTube title (4–8 words, Title Case, one emoji):** **"Why ChatGPT Forgets Your Name 🤔"**. Alternatives: "Why ChatGPT Forgets What You Said 🤔" and "What ChatGPT Does Every Time You Hit Send 😮".

## 2. Hook options

1. **"Why does ChatGPT forget your name?"** (chosen, 6 words) Second person, a named product the viewer uses, a puzzle they've felt, and it carries the search phrase verbatim. "Your name" gives the director one object to build the whole film on: a paper name tag stuck to the top of the chat scroll, which falls off the top at the payoff. It asks rather than claims, which matters because ChatGPT **can** save a name with Memory on (fact 8); the `patch`/`detail` lines say so.
2. "Talk to ChatGPT long enough and it forgets your name." (the sheet hook, rejected) 10 words, nearly twice the limit, and as a flat statement it overclaims: with Memory on, ChatGPT "can remember a name that you provide" (fact 8), and the window size depends on plan and model (fact 4).
3. "It reads your whole chat. Every reply." (7 words, backup) The strongest true surprise, but it gives the answer on frame 0 (strawberry r1 lesson) and has no person or object. Kept as line 4.

## 3. Facts used

All read 2026-10-25. Primary sources only: OpenAI, Anthropic and Google docs, and the "Lost in the Middle" paper (pinned comment only). OpenAI's help and pricing pages block automated fetches (HTTP 403), so I read them as rendered text through a reader proxy (r.jina.ai) and quote the exact lines; the director or SEO agent should eyeball them in a browser before posting.

| # | Fact | Line | Source |
|---|---|---|---|
| 1 | "Each text generation request is independent and stateless." To continue a conversation you "include the model's previous response output as input, and append that input to your next request." With `previous_response_id`, "all previous input tokens for responses in the chain are billed as input tokens." | secret, reread, hundred | OpenAI API docs, "Conversation state": https://developers.openai.com/api/docs/guides/conversation-state (undated) |
| 2 | Each turn's "Input phase: Contains all previous conversation history plus the current user message"; "each user message and assistant response accumulates within the context window, and previous turns are preserved completely." The context window is "all the text a language model can reference when generating a response, including the response itself… a 'working memory' for the model." | reread, hundred, limit | Anthropic, Claude Platform docs, "Context windows": https://platform.claude.com/docs/en/build-with-claude/context-windows (undated) |
| 3 | "Chat interfaces such as claude.ai can also manage the context window on a rolling 'first in, first out' basis." | fall, name | same Anthropic page, footnote 1 to the diagram |
| 4 | **The number.** ChatGPT pricing page, plan table: "GPT Instant total context window": **Free 27K**, Go 54K, Plus 54K, Pro 128K. "GPT Reasoning total context window": Free "Varies", Go/Plus 256K, Pro 400K. Footnote: "ChatGPT manages a shared context window… The portion available for user input is smaller than the total window, as space is also used for system instructions (including tools and personality), memories (if enabled), and internal processing." | size | OpenAI, "ChatGPT Plans and Pricing": https://openai.com/chatgpt/pricing/ (undated; read 2026-10-25) |
| 5 | "1 token is approximately three-quarters of a word." "100 tokens are approximately 75 words." "These are estimates, not exact counts." So 27K tokens ≈ **about 20,000 words** (27,000 × 0.75 = 20,250). | size | OpenAI Help Center, "What are tokens and how to count them?": https://help.openai.com/en/articles/4936856-what-are-tokens-and-how-to-count-them (undated) |
| 6 | Claude.ai, paid plans with code execution on: near the limit, Claude summarizes earlier content rather than stopping; the full chat history is kept. Chat context window "200K, meaning it can ingest 200K+ tokens (about 500 pages of text or more)"; several current models 1M. | patch (optional chip) | Anthropic Help Center, "How large is the context window on paid Claude plans?": https://support.claude.com/en/articles/8606394-how-large-is-the-context-window-on-paid-claude-plans ("updated over 2 weeks ago") |
| 7 | Gemini: "Many Gemini models come with large context windows of 1 million or more tokens" (cap "1,048,576 tokens"), about "8 average length English novels". "An analogy for the context window is short term memory." | limit (optional chip), pinned comment | Google AI for Developers, "Long context": https://ai.google.dev/gemini-api/docs/long-context (last updated 2026-10-15) |
| 8 | **Memory is real but partial.** "When Memory is enabled, ChatGPT can remember relevant preferences and details from your chats." "**Memory does not retain every detail from every conversation.**" "ChatGPT can remember a name that you provide." | patch, detail | OpenAI Help Center, "Memory in ChatGPT": https://help.openai.com/en/articles/8590148-memory-in-chatgpt (undated) |
| 9 | Pinned comment only: "performance is often highest when relevant information occurs at the beginning or end of the input context, and significantly degrades when models must access relevant information in the middle of long contexts." Anthropic calls the long-context decline "context rot": "As token count grows, accuracy and recall degrade." | none | Liu et al., "Lost in the Middle: How Language Models Use Long Contexts", TACL 12 (2024), arXiv:2307.03172 (2023): https://arxiv.org/abs/2307.03172; Anthropic fact 2 URL |

**Wording choices tied to sources**
- `hook` asks a question, it doesn't claim ChatGPT always forgets your name. With Memory on it may not (fact 8); `patch`/`detail` say so before the end.
- `secret` says "**between replies**, it remembers nothing": that's the model and the API (fact 1, "stateless"). The app's Memory feature is the patch in `patch`, so the film doesn't contradict OpenAI's memory page.
- `reread`/`hundred` say "rereads"/"read". The whole history is the input of every turn (facts 1, 2). Engineering detail kept out: prompt caching lets providers skip recomputing a repeated prefix, but the text is still the input and still counts toward the window (Anthropic page: "Cached prompt prefixes still occupy the context window"). "Read" is the honest lay word.
- `hundred` counts replies, not messages, so the arithmetic is clean: reply 1 reads message 1 once; reply 100 has had message 1 in its input 100 times (if it's still inside the window).
- `size` says "**free ChatGPT**", "**about** 20,000 words" and "**replies included**": the 27K is the Free plan's **Instant** model total window, shared with ChatGPT's replies, its hidden instructions and memories (fact 4 footnote). Screen: **FREE PLAN · INSTANT MODEL · 27K TOKENS ≈ 20,000 WORDS** and **OPENAI, READ OCT 25 2026**. Paid plans and reasoning models get more (Plus 54K, Pro 128K; reasoning up to 400K).
- `fall` says the oldest messages "**can** fall off". OpenAI doesn't publish what ChatGPT does when a chat outgrows the window; Anthropic says chat apps "can" drop the oldest turns first in, first out (fact 3), and Claude.ai summarizes instead on paid plans (fact 6). Hence `patch`.
- `detail` attributes the limit to OpenAI by name ("OpenAI says"), quoting fact 8 almost word for word.
- Fine print on the `size`/`fall` frames, ≥ 36 px: **VARIES BY APP, PLAN AND MODEL.**

**Kept out on purpose**
- **"ChatGPT forgets after X messages."** No first-party source gives a message count; it depends on message length, plan, model and memory.
- **Exactly what ChatGPT does past the limit** (drop, summarize, refuse). Not documented by OpenAI. The film says "can fall off" and "apps patch it".
- **"Lost in the middle" in the narration.** True and sourced, but it's a second idea; LESSONS says one idea per film. Pinned comment instead.
- **"Its memory is 8 novels" / Gemini and Claude sizes in narration.** Three numbers would turn it into a list; only the free ChatGPT number is spoken. The others can be small chips (see shots).
- **Model internals** (attention, KV cache, tokens explained). "Tokens" isn't spoken; the screen shows "27K TOKENS ≈ 20,000 WORDS" once.

## 4. Shot ideas per line

House look: ink-dark stage, cream type, one hot coral accent, chips, labels, stamps. **Native move for this film: the chat scroll inside a fixed reading frame.** One long cream paper scroll (the chat, drawn speech bubbles as ruled paper strips) runs through a coral-bordered window of fixed height (the context window). On every send, a reader bar sweeps the whole visible scroll top to bottom (the "reread"). When the scroll outgrows the frame, the top strip tears off and drops out of frame. The name tag rides on that top strip from the first frame.

| id | at | Line | Shot |
|---|---|---|---|
| hook | 0.2 | "Why does ChatGPT forget your name?" | Frame 0: a huge paper name tag "HELLO, MY NAME IS **SAM**" (≥ 60 % of frame), already peeling at one corner and tilting, with a coral "?" stamp mid-slap. Super ≤ 5 words, ≥ 64 px, upper third: **WHY DOES CHATGPT FORGET?** Conflict, not answer. |
| told | 2.75 | "You told it in your very first message." | Pull back: the tag is stuck to the first strip of a chat scroll, "Hi, I'm Sam" in a drawn bubble labeled **MESSAGE 1**. Generic drawn phone outline around it (no logo, no real UI), tag **RE-CREATED**. |
| secret | 6.0 | "Here's the secret: between replies, it remembers nothing." | Hard cut: a blank cream index card, stamp **MEMORY: EMPTY** in coral. A tiny clock ticks between two reply bubbles. |
| reread | 8.9 | "Every time you hit send, it rereads the whole chat." | A coral SEND button pressed; the reader bar sweeps the entire scroll from MESSAGE 1 down, fast. Sweep twice on two quick sends. Chip **OPENAI: "STATELESS"**. |
| hundred | 12.85 | "By reply 100, it's read your first message 100 times." | Tally counter (paper prop, mechanical digits) next to the MESSAGE 1 strip rolls 1 → **100** in round steps as the sweeps blur. Screenshot frame: **REPLY 100 = MESSAGE 1 READ 100×**, ≥ 40 px, hold ≥ 3 s. |
| limit | 17.55 | "But it can only hold so much. That's the context window." | The coral frame snaps in around the scroll: fixed height, label **CONTEXT WINDOW** big. The scroll keeps growing at the bottom, pushing up toward the frame's top edge. Optional small chips: "CLAUDE ~200K–1M TOKENS · GEMINI ~1M". |
| size | 21.9 | "On free ChatGPT, that's about 20,000 words, replies included." | Ruler down the frame's side: **≈ 20,000 WORDS**; chip **FREE PLAN · INSTANT MODEL · 27K TOKENS**; credit **OPENAI, READ OCT 25 2026**; fine print **VARIES BY APP, PLAN AND MODEL** (≥ 36 px). Bubbles from both sides fill it (user and reply), to show "replies included". |
| fall | 25.85 | "Go past that, and the oldest messages can fall off." | The native move: new strips push in at the bottom; the top strip crosses the frame edge, tears along a perforation and drops out of frame, tumbling. Condition big: **PAST THE LIMIT**. |
| name | 29.85 | "Like the one with your name." | The falling strip carries the SAM tag; it lands face up outside the frame, small. Inside the frame the reader bar sweeps a scroll that no longer has it. |
| patch | 32.4 | "Apps patch it with summaries and saved memories." | Two paper props slap on: a sticky note "SUMMARY: user is… ?" folded over the old strips, and a small card labeled **SAVED MEMORY** with "Name: Sam" on it. |
| detail | 35.65 | "But OpenAI says memory doesn't keep every detail." | Quote card, cream on ink: **"MEMORY DOES NOT RETAIN EVERY DETAIL"** credit **OPENAI HELP CENTER**. The summary note visibly drops lines (strikes through). |
| end | 38.9 | "So, has it ever forgotten yours? Yes or no." | Back to the name tag, peeling; two big chips **YES / NO** and a comment box "__". On "no", cut to frame 0 so the loop replays. |

Pacing: a new object every 3–4 s; only the `hundred` counter frame holds past 3 s.

## 5. Open questions for the director

1. **Length.** 12 lines, about 107 spoken words. The chained `at` puts `end` at 38.9 s and `dur` at 43 s. Ming usually reads a little faster than the 2.8 w/s chain, so expect about 39–42 s. If it runs long, cut `told` first (the hook plus the name tag on MESSAGE 1 already show it), then fold `detail` into `patch`.
2. **Turn words.** "Here's the secret" (6.0 s), "But" (17.55 s), "Go past that" (25.85 s), "But OpenAI says" (35.65 s), "So" (38.9 s). The 9–17 s stretch rides on the sweeps and the tally roll; slap the counter hard on "100 times".
3. **Ming risks.** "ChatGPT" mid-line in `hook` and `size` (spoken "chat G P T"); check Whisper hears it. "OpenAI" sits after "But", so the name-drop issue shouldn't bite. In `hundred`, check "a hundred times" doesn't blur into "hundred time". No comma between a verb and its object in any `say`.
4. **Logos and UI.** No ChatGPT or OpenAI logo, no real chat UI: drawn phone, paper strips, names in house type, **RE-CREATED** on the chat.
5. **The `size` frame** must say FREE PLAN, INSTANT MODEL and the date in big type in the same frame (Truth lesson: the condition in big type), so a Plus or Pro user doesn't call it wrong.
6. **Pinned comment idea for the SEO agent:** "Even inside the window, the middle gets fuzzy: Stanford researchers found models use info at the start and end of a long prompt best, and the middle worst (Liu et al., "Lost in the Middle", TACL 2024). Tip: in a very long chat, start a new one and paste a short summary." Second option: "Paid ChatGPT gets more room: about 54K tokens on Plus, 128K on Pro, up to 400K on reasoning models (OpenAI pricing page, Oct 25 2026)."
7. **On-screen sources (end card):** "OpenAI API docs & Help Center · ChatGPT pricing, read Oct 25 2026 · Anthropic Claude docs · Google Gemini docs, Oct 2026".
8. **Description fine print (for the SEO agent):** "Context limits vary by app, plan and model and change often; figures read Oct 25 2026. Some apps summarize or save memories instead of dropping old messages."
