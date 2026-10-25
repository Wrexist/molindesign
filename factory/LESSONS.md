# Factory lessons

The factory's memory of what made videos better or worse. Every run reads this before starting and adds to it at the end (skill step 8). Keep each lesson one line, concrete, with the video it came from. Remove a lesson when a later video proves it wrong.

Isac's standing ask (2026-10-23): each video must be better than the last. Look at every video harshly, criticise everything, learn, and never repeat a mistake.

## Real numbers, first stats review (2026-10-24, under 5 h after posting; early signal)
- Every video lost almost everyone at 0:01. The dark, text-heavy title card on frame 0 is the problem. Open on one huge moving object, ≤ 5 words, hook spoken ≤ 6 words.
- 80 s is far too long: average watch 10–16 s. Make 30–45 s, never over 59 s.
- Story and puzzle beat abstract: Hallucinate (real lawyers) best completion 9.1 %, Strawberry (a puzzle) most views 220; Next word (abstract) worst at 3 %.
- Never repost a video: the duplicates got 0–70 views (TikTok suppresses them).
- Zero shares, follows and comments so far: end with a one-word-answer question to pull comments.

## What the viral "What if" stickman channels teach (studied 2026-10-24)
Example Isac sent: Jeremy Bearimy (@JeremyBearimyTheory), "What If You Could See 10 Seconds Into the Future?" 252k views. Its channel feed (read 2026-10-24) shows the pattern: 1–2 uploads a day, all titled "What if you/your …?". The hits are about **your own body or senses** ("What If Your Heart Beat 10x Faster?" 491k, "What if You Stopped Feeling Pain?" 352k, "…See 10 Seconds Into the Future?" 252k). The powers and money ones flop (Firebending 4k, Control Water 5k, Infinite Money 11k).
- Title in second person, about the viewer's own body, phone or day: "What if your phone…", "Why your…", never "How X works" alone (bearimy feed).
- One dial turned to an extreme number ("10x", "10 seconds", "100x") beats a vague superpower; give the number in the title (bearimy feed).
- Structure as escalating consequences (second → minute → day → year); each step is a new picture (bearimy format).
- Run a "what if" spin on a sourced fact, e.g. "What if GPS forgot Einstein?", "What if your password were 20 letters?": the hook of a hypothetical, with our true answer. That is the edge they don't have.

## The most viral explainer Shorts channels (studied 2026-10-24, YouTube feeds)
- **Zack D. Films** is the benchmark: ~5 Shorts a day, almost every one 1–14M views within 1–3 days (feed read 2026-10-24). Top this week: "Why ChatGPT Contradicted Itself 🤔" 14.0M, "Why Consistency Beats Hard Work 🤔" 9.4M, "Why Most Sperm Never Reach The Egg 🤔" 7.8M, "How Banana Slugs Glide Across Razor Blades 😮" 7.2M, "How Pencil Sharpeners Work 🤔" 2.7M.
- **Branch Education** (closest to our hardware niche) gets far less: 0.1–0.8M per Short ("Printing 92 GPU Chips in Just 18 Seconds! 🤯" 0.3M). Pure gadget mechanics cap out; human stakes travel.
- Copy: titles are 4–8 plain words, "Why …" / "How …" / "The … Who …", Title Case, one emoji at the end (🤔 for why/how, 😮 for wow, 😱 for danger). No colon, no "explained", no channel name.
- Copy: pick topics where tech meets the body, a person or a surprise ("Why ChatGPT contradicted itself", "the man who…"). Our AI topics fit; frame them around what the viewer saw happen.
- Copy: a named person or a single object on screen, one fact, one twist; no lists.
- Don't copy: the volume (5/day) or anything unsourced; our edge is that every claim checks out.

## Not slop (the backlash against AI channels, 2026-10-24)
Viewers are pasting anti-"AI slop" comments under channels with AI scripts, AI animation and AI voices. Ours must read as made with care, and must be honest:
- Every video carries something checkable: a named source on screen and in the description, a real date, a real number. Slop has none (house rule since #1; now mandatory on YouTube too).
- The picture is hand-built (paper props, stamps, rulers, our palette), never generated stock or AI imagery; nothing morphs, no uncanny hands or faces (Isac's no-AI-look rule).
- Disclose the AI voice plainly (TikTok label, YouTube "Altered content", description line). Never hide it; hiding it is what gets channels piled on.
- Quality over count: 2 a day only while each passes the jury at 8.0+; if a run can't, skip that slot rather than post filler.
- Reply to real comments in the first hour with a sourced extra fact; a creator who answers isn't a slop farm.
- Never post the anti-slop copypasta or reply to it with arguments; answer a "this is AI" comment with the source link and what we made by hand.

## Hook and first frame
- Frame 0 shows the conflict, never the answer (strawberry r1: the answer on frame 0 killed the reason to watch).
- A tease hidden in frame 0 must be visible on a 540-wide phone frame: a 45 % brightness bias was invisible; it took ~90 % cream inside the lens, held 0.35 s (noise r2).
- A mid-film re-hook chip must not sit on the frame-0 puzzle image; with sound off it rewrites the puzzle's answer (noise r2: LOOK FAMILIAR? over the static implied the cat was hidden in it).
- A real document or object on frame 0 (a court filing) reads as "not AI" and gets the stamp hit in under 1.5 s (hallucinate, jury 8.2).

## Story and retention
- Making the viewer the subject ("TikTok bet you'd watch this", their own swipes as clues) gave the best-paced first 16 s yet (fyp, jury 8.1).
- A true story with a named place and year carries the first 30 s better than an abstract explanation (hallucinate).
- A paper prop the viewer can read (a re-created report, a frequency card with a number struck through) lifts a tail better than another diagram (gps r1, the 10.23 → 10.22999999543 MHz card).
- The second half sags when two props in a row hold for 10+ s; slap a new object in every 3–4 s (hallucinate r1, 52–64 s).
- Say the payoff once; repeated beats cost retention (strawberry r1).

## Picture
- Highlight only stressed words in captions; per-word highlighting looks like stock auto-captions (hallucinate r1).
- Wide paper sheets (880 px) push stamps and digits past x 930; make sheets ≤ 800 wide and measure the right rail every run, not by eye (gps r1 and r2: cost a point twice).
- Every scene change needs the next object drawn under the wipe; a 0.3 s empty stage reads as dead air (gps r1: 16 bare cuts).
- Keep everything inside x 90–930 and above y 1450; TikTok's buttons and caption cover the rest (strawberry, hallucinate). Check it with `node film/tools/boundscheck.mjs --film <slug>`, not by eye: the right rail broke in three films in a row until noise r2 made it programmatic.
- The frame people will screenshot needs ≥ 40 px body text and ≥ 3 s on screen (hallucinate r1).
- Labels that carry meaning are ≥ 36 px cream, never dim grey 30 px (gps r1, r2).
- Frame 0's conflict needs a big readable difference (a coral "+38 µs A DAY" chip), not three blurred digits (gps r1).
- Staged chats quoting a real model carry a "RE-CREATED" tag (strawberry r2). So does every re-created document or news clipping (fyp r2).
- Dot-and-line networks read as stock "AI" art; show the idea with the viewer's own objects instead (two phones sharing videos) (fyp r1).
- Captions break on phrase boundaries, never after "the/a/your/New", and never draw over a swipe's smear (fyp r1, r2).
- Motion-blur swipes need ≥ 16 sub-frames or they show ghost copies (fyp r1); `make.sh` now renders 16 by default (`SAMPLES=` overrides) after battery r1 ghosted at render.mjs's 4.
- No dead air after a payoff: give the beat a stamp or move the next line up (battery r1: 3.1 s still after the 96% reveal, fixed with "5× THE LOSS").
- Draw generic phones (round punch-hole, no notch or logo) and re-created settings screens, never a real UI (battery).
- Keep sources lines out of the top 300 px: the TikTok top bar covers them (battery r1).

## Truth
- Check physical details an American would know (the old SAT had 5 bubbles, not 4) (hallucinate r1).
- A comparison of two different things must say so on screen, or it reads as before/after (hallucinate r1).
- Rolling counters roll in round units ("9 MILLION"), not exact-looking 9-digit values the source never gave (noise r2).
- Say what a percentage is: "KEEPS 80%" of capacity, never a bare 80% that reads as charge level (battery r1).
- Show only what the source lets you show: a re-created doc page keeps the title and named metrics, not a formula the brief didn't allow; a stamp must sit where it can't be read as confirming the wrong thing (fyp r1).
- A scary number gets its condition in big type in the same frame ("+7 MI" / "IF UNCORRECTED" 66 px); small print reads as nothing with the sound off (gps r1).
- Every on-screen citation must say exactly what that source says; split credits when a figure comes from a different paper (gps r2: Ashby 2003 vs 2006).
- A claim from a court filing is "says", not fact, until a court found it (hallucinate r1).

## Voice
- Isac picked Ming US_James over Chatterbox and NVIDIA Magpie by ear (2026-10-23): "less robot". Keep it for every video so the channel has one recognisable voice.
- Ming drops a name at the start of a short line ("Einstein, built into…"); give it a lead-in word ("It's Einstein, …") (gps).
- Ming can blur a verb ending ("gain" → "gained"); reword rather than re-roll more than twice (gps).
- Unhinted Whisper is the real test for names; spell them phonetically in `say` until it hears them (hallucinate: "Var-gheez").
- A double space in `say` doesn't make a pause where you want it; split the line into two lines with a ≥ 0.3 s gap (noise r2: "Same static, type dog" ran together).
- Never put a comma between a verb and its object in `say`: Ming drops to sentence-end pitch and it plays as two sentences; reword instead (fyp r2).
- A sound effect on a spoken word can make Whisper mishear it; keep hits between words (hallucinate r1, again battery r1: "ages it faster").
- A line that starts too hot can take `"fade_in": <seconds>` in vo/script.json (linear ramp, voiceover.py) instead of a re-roll (battery).

## Posting and sound
- Every post gets one of the most popular trending sounds of the week, quiet (about 10%) under the voice. TikTok can't change a post's sound after posting (first three posts went up without one).
- Pick sounds at least as long as the video: many trending sounds are 1:00 clips and cut out under a 1:19 film (gps: Self Aware and Sunset in Girona were skipped for Espresso Soul).
- TikTok Studio scheduling works: the one-time consent was accepted on 2026-10-24 under Isac's "schedule all posts", so every post is scheduled in its slot (noise, fyp). Before that, gps went up at once.
- Paste the full YouTube description into the PC instructions; the PC can't read repo files, so it fell back to a short version (noise).
- YouTube Studio on the PC may open on Isac's game channel "Delta"; every posting instruction says to switch to and verify "Tech, explained" before uploading (fyp).
- Comments can't be posted before a scheduled video is live; the PC posts the pinned comment after the slot (noise).
- Web uploads through Chrome cap files at 10 MB; drafts through Higgsfield don't.

## Performance (fill in from TikTok analytics)
| Video | Posted | Views 24 h | Avg watch | % to end | Shares | What it taught |
|---|---|---|---|---|---|---|
| Next word | 2026-10-23 | 201 (5 h) | 9.6 s | 3.0 % | 0 | abstract opening, worst completion |
| Strawberry | 2026-10-23 | 220 (5 h) | 16.0 s | 7.3 % | 0 | puzzle: most views |
| Why AI makes things up | 2026-10-23 | 186 (5 h) | 14.7 s | 9.1 % | 0 | real story: best completion |
| How GPS works | 2026-10-24 00:30 UTC (Fri 20:30 ET) | 55 (10 min) | 1.2 s | 0 % | 0 | dense static text card on frame 0 |
| TikTok algorithm (fyp) | 2026-10-24 23:00 UTC (Sat 19:00 ET) | | | | | viewer-as-subject puzzle; jury 7.6 → 8.1 |
| Phone battery | 2026-10-25 17:00 UTC (Sun 13:00 ET) | | | | | self-check hook ("check yours"); jury 7.7 → 8.0, Truth 9.0 |
| Noise → pictures | 2026-10-24 17:00 UTC (Sat 13:00 ET) | | | | | first 30–45 s puzzle under the new rules; jury 7.4 → 7.8, fixed |
