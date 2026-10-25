# Memory: TikTok and YouTube packaging

Factory #8 · slug `memory` · about 39.4 s · **How AI works, part 5** (after Next word, Strawberry, Hallucinate and Noise). Account: Tech, explained (@techexplained.daily on TikTok, "Tech, explained" on YouTube). Written 2026-10-25 for a **US audience**. The machine-readable version is `seo.json`.

Jury: round 2 says **post** (8.0, Truth 9.0; round 1 was 7.8). The director is applying small round-2 polish fixes. The only spoken change allowed is the size line, "On free ChatGPT, it's under 20,000 words, replies included." The caption and description already use "under 20,000 words, replies included". If any other line changes, check the caption and description against it.

## Post

**Title / search phrase:** Why does ChatGPT forget? The context window

**Caption** (260 characters):

> Why does ChatGPT forget your name, even in the same chat? It's the context window.
> Between replies it remembers nothing. Every send, it rereads the whole chat, and free ChatGPT holds under 20,000 words, replies included.
> Has it ever forgotten yours? Yes or no.

- **Line 1** is the spoken hook plus the top Google US autocomplete for the main phrase ("why does chatgpt forget things in the same chat", pulled 2026-10-25). It also names the context window. The phrase WHY DOES CHATGPT FORGET? is on screen from frame 0 and spoken at 0.2 s.
- **Line 2** is the twist and the number, worded as carefully as the script:
  - "between replies" (the model and the API are stateless; the app's Memory is the patch).
  - "**free** ChatGPT".
  - "**under** 20,000 words, replies included" (27K × 0.75 ≈ 20,250 is the *total* window, and OpenAI says the usable share is smaller).
  - No message count is given. None is published.
- **Line 3** is the film's ending, a yes-or-no answer. It's what the video asks, so it isn't bait.

**Hashtags:** #ai #chatgpt #contextwindow #chatgpttips #learnontiktok
- **#ai** is the series' broad tag.
- **#chatgpt** is the product people search.
- **#contextwindow** is the exact concept.
- **#chatgpttips** catches US users looking for fixes.
- **#learnontiktok** is the US education feed.
- No #fyp or #viral.

**Search keywords** (main phrase first):
1. why does ChatGPT forget
2. why does ChatGPT forget things in the same chat
3. ChatGPT forgets conversation
4. ChatGPT context window
5. ChatGPT context window size
6. why does ChatGPT forget information in long conversations
7. ChatGPT forgets previous messages
8. ChatGPT memory

Where they come from: Google US autocomplete, pulled 2026-10-25 (`gl=us`):
- "why does chatgpt forget" suggests *things*, *information in long conversations*, *things in the same chat*, *so much*, *instructions*.
- "chatgpt forgets" suggests *conversation*, *context*, *everything*, *previous messages*.
- "chatgpt context window" suggests *size*, *limit*, *vs claude*, *2026*.
- "chatgpt memory" suggests *limit*, *full*, *settings*.

I didn't check search volumes, and TikTok's own suggestions can't be read from here. Before posting, type "why does chatgpt forget" into TikTok search (English (US)). If a different phrase tops the list, swap it into line 1.

**Cover:** frame 0 (`cover_time` 0.0), the erased SAM name tag under WHY DOES CHATGPT FORGET? (the round-2 frame 0).
- Cover text: **ChatGPT forgot your name** (4 words). It puts "your name" into OCR rather than repeating the headline.
- Place it mid-frame below the tag, around y 1000, so the 3:4 profile-grid crop keeps it.
- `out/poster.jpg` is the YouTube thumbnail if the app offers a custom one.

**Pinned comment** (300 characters):

> Even inside the window, the middle gets fuzzy: Stanford researchers found AI models use info at the start and end of a long prompt best, and the middle worst (Liu et al., "Lost in the Middle", 2024). Tip: in a very long chat, start a new one with a short summary. Do you start fresh chats? Yes or no.

This is the brief's first pinned-comment idea: Liu et al. 2024 (Stanford; BRIEF fact 9), kept out of the film because it's a second idea. It adds a practical tip and ends with a yes-or-no question. Post and pin it after the video is live; comments can't go up on a scheduled video before its slot.

**When:** **19:00 ET, Sunday Oct 25, 2026** = **00:00 Monday Oct 26 in Stockholm** = 23:00 UTC.
- It's scheduled in TikTok Studio, the playbook's 19:00–21:00 ET scheduled window.
- It's US Sunday evening, and the earliest free slot after battery's 13:00 ET today.
- The US stays on EDT until Nov 1, and Sweden went to CET this morning, so the gap is 5 h this week.
- In Stockholm the slot falls on the next calendar day, so pick **Oct 26** in any Stockholm-time picker. On YouTube, pick from the dropdown and check the saved time (clock-change lesson).

**Disclosure:** AI-generated voice (Ming TTS, US_James). Turn on TikTok's **AI-generated content** label (`is_aigc: true`); on YouTube set **Altered content: Yes**.

## Sound (add before posting; it can't be changed after)

- The film is about 39.4 s, and the sound must be **at least 45 s**.
- The film has no music bed, so lay the sound at about **5–10 %** under `out/memory-voice-only.mp4`. TikTok drafts don't keep music, so add it in the app.
- **Skipped by rule (the last 3 posts):** Espresso Soul (battery), Sunset in Girona (fyp) and Self Aware (noise).

| # | Sound | Why it fits | Checked (source, date) | Length |
|---|---|---|---|---|
| 1 | **Mint Breeze**, RITA (**first pick**, conditional) | Cool, smooth, relaxed. Metricool: "this song has no lyrics". Not used on any of our posts. | #9 on Metricool, "Trending TikTok Songs This Week: Oct 19th, 2026" (read 2026-10-25; still the latest list). | **Not checked.** Use only if the app shows at least 0:45. |
| 2 | **Zamba Tuya**, Daniel Frascoli (conditional) | "Soothing keys with beautiful strings"; peaceful under the yes-or-no ending. Not used on any of our posts. | #8 on Metricool (week of Oct 19, 2026; also spelled "Zumba Tuya" there). | **Not checked**, and vocals not checked. Preview first. |
| 3 | **Final Game Showdown**, ProdByLucK (conditional) | A slow suspense build for the scroll filling up and the name strip falling off. Keep it near 5 %. Not used on any of our posts. | #3 on Metricool (week of Oct 19, 2026). | **Not checked**, and vocals not checked. Preview first. |

**How I checked, and what I couldn't check:**
- **Metricool** (metricool.com/tiktok-songs), re-read 2026-10-25. The newest weekly list is still Oct 19, 2026, and the page doesn't say the list is US-only.
- **Higgsfield `tiktok_music_trending`** (US, ALL, 7DAY and 30DAY, limit 30), called 2026-10-25. It returned **0 tracks** both times, so no sound here is claimed from TikTok's own chart.
- **tokchart.com/trending/US** (dated Oct 25, 2026) shows its list to subscribers only.
- **New Engen's "October 2026 TikTok Trends"** (updated Oct 14) names only dialogue or vocal audios (Two Fishes, Ramalama), which won't work under narration.
- **Durations:** web searches for each pick's duration found nothing. None of the three has a verified length, so go down the list in the app until one shows 0:45 or more with no vocals.
- **Passed over:** Time Back (#4, techno), DUNG DING BREGA (#5), Cavendish Banana (#7) and Mari-Mari (#10), as too driving or festive under a calm explainer.

## YouTube Shorts

**Title:** **Why ChatGPT Forgets Your Name 🤔** (5 words, Title Case, "Why …", one emoji). It's the brief's pick and is true with the hedge: the film asks, and says Memory can save a name. Playlist: **How AI works**.
- Alternative: "Why ChatGPT Forgets What You Said 🤔".

**Description** (paste it in full, because the PC can't read repo files). It contains no < or > characters (checked by script):

> Why does ChatGPT forget your name, even in the same chat? Because between replies, the model remembers nothing. OpenAI's API docs say "each text generation request is independent and stateless": to continue a conversation, the earlier messages are sent back in with your new one. So every time you hit send, it rereads the whole chat from the top. By reply 100, it has read your first message 100 times.
>
> That reading space is the context window, and it only holds so much. On the ChatGPT pricing page, the Free plan's GPT Instant model has a 27K-token total context window. OpenAI says a token is about three-quarters of a word, so that's roughly 20,000 words in total, and OpenAI notes the part left for your chat is smaller, because ChatGPT's own replies, system instructions and memories share it. Hence "under 20,000 words, replies included". Paid plans and reasoning models get more (Plus 54K, Pro 128K, reasoning models up to 400K tokens).
>
> Go past the limit and the oldest messages can fall off. Anthropic's docs say chat apps can manage the window on a rolling "first in, first out" basis, and the first message, the one with your name, is the oldest. Apps patch this with summaries and saved memories: on paid Claude plans with code execution on, Claude summarizes earlier content near the limit, and with Memory on, ChatGPT "can remember a name that you provide". But OpenAI also says "Memory does not retain every detail from every conversation."
>
> So, has it ever forgotten yours? Yes or no, in the comments.
>
> Fine print: context limits vary by app, plan and model and change often; the figures were read Oct 25, 2026 and are OpenAI's published totals, not a measured count. 27K tokens is about 20,250 words by OpenAI's own rule of thumb (an estimate). OpenAI doesn't publish exactly what ChatGPT does when a chat outgrows the window, so the video says the oldest messages "can" fall off; some apps summarize or save memories instead of dropping old messages. "Reads" is the plain word for the whole chat being the model's input on every turn; providers can cache a repeated start, but it still counts toward the window. The chat in the video is re-created and "Sam" is an example name; no real app interface or logo is shown, and the props are drawn by hand.
>
> Sources:
> - OpenAI API docs, "Conversation state" (read Oct 25, 2026): https://developers.openai.com/api/docs/guides/conversation-state
> - OpenAI, "ChatGPT Plans and Pricing", plan table and context-window footnote (read Oct 25, 2026): https://openai.com/chatgpt/pricing/
> - OpenAI Help Center, "What are tokens and how to count them?" (read Oct 25, 2026): https://help.openai.com/en/articles/4936856-what-are-tokens-and-how-to-count-them
> - OpenAI Help Center, "Memory in ChatGPT" (read Oct 25, 2026): https://help.openai.com/en/articles/8590148-memory-in-chatgpt
> - Anthropic, Claude Platform docs, "Context windows" (read Oct 25, 2026): https://platform.claude.com/docs/en/build-with-claude/context-windows
> - Anthropic Help Center, "How large is the context window on paid Claude plans?" (read Oct 25, 2026): https://support.claude.com/en/articles/8606394-how-large-is-the-context-window-on-paid-claude-plans
> - Google AI for Developers, "Long context" (updated Oct 15, 2026): https://ai.google.dev/gemini-api/docs/long-context
> - Liu et al., "Lost in the Middle: How Language Models Use Long Contexts", TACL 12 (2024): https://arxiv.org/abs/2307.03172
>
> How AI works, part 5. Narration is an AI voice (Ming TTS); the research, script and hand-built animation are made for this channel.
>
> #shorts #ai #chatgpt

**Tags:** why does chatgpt forget, chatgpt forgets conversation, chatgpt context window, context window, chatgpt memory, why does chatgpt forget things in the same chat, how ai works, tech explained, shorts

**Pinned comment:** the same as on TikTok.

## Two alternative hooks (for an A/B test, not a repost)

Reposts get suppressed (LESSONS: 0–70 views), so use these as TikTok's caption/cover A/B or on YouTube, never as a second upload.
1. **"It rereads your whole chat. Every reply."** This is the brief's backup and the strongest true surprise. It gives the answer early, so use it as the caption's first line, not on frame 0. Cover: *It rereads your whole chat*.
2. **"By reply 100, it's read message 1 100 times."** It leads with the DM-able number, for viewers who won't wait 12 s. Cover: *Your first message, read 100×*.

## US growth actions for Isac after posting

1. **Reply to the first US commenters within the hour.**
   - Every "yes" gets one sourced extra: Plus gets 54K tokens and Pro gets 128K (OpenAI pricing, Oct 25, 2026), or Memory "can remember a name that you provide" (OpenAI Help Center).
   - Some people will say "mine remembers everything". Answer with Memory and its limit ("does not retain every detail") and the link, without arguing.
   - Answer a "this is AI" comment with the source link and what we drew by hand.
2. **One US creator to stitch or duet:** a US AI-tips or productivity creator who posts ChatGPT how-tos. Check that they're US-based and on-topic before asking. Their own "ChatGPT forgot my instructions" moment next to our name-strip fall is a natural stitch. The film is under 60 s, so stitch and duet are on.
3. **Promote boost:** a good candidate, because nearly every US ChatGPT user has seen it forget something, and the yes-or-no comment is easy. Wait 24 h, and boost only if completion beats Hallucinate's 9.1 % and average watch is over 20 s. Then put a small US-targeted budget on it, interest "Technology". Otherwise save it.
