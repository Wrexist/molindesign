# FYP: how the TikTok algorithm picks your next video

Factory #6 · slug `fyp` · topic row 7 · researched 2026-10-24 · follows `film/noise/`. Channel: Tech, explained (not named in the script). American English, US audience, AI voice Ming US_James (seed 7), disclosed in the post. Built to the stats rules: 30–45 s, 8–13 lines, a hook of 6 words or fewer from 0.2 s, a puzzle the viewer can test on themselves, and an ending that asks for a one-word answer.

## 1. Topic and one hard idea

**Before you see a video, TikTok has already bet that you'll watch it. It learns that bet from what you finish, skip, replay and linger on, and from strangers who watched the same videos you did.** TikTok's own transparency page describes that last part: if another user engaged with two of the same videos as you, the system may predict you'll engage with a third video that person engaged with.

**The film is a meta puzzle.** It plays on TikTok, so line 1 is literally true for anyone who gets it on their For You feed: TikTok scored this video for them and served it because the score was high (§3, fact 1). Each line hands the viewer something they can test on their own thumb: finish, skip, replay, linger. The twist is the stranger. The last line asks "did you finish this one? Yes or no?", a one-word comment that is also the signal the film just explained. Then it loops back to "TikTok bet you'd watch this."

**The "map" angle from the sheet (every viewer and video as a point, pulled toward neighbors) is a picture, not a published fact.** TikTok publishes the neighbor rule (fact 4 and fact 6) but not how it's built: no embeddings, maps or "points". So the voice never says "map". The director can draw the neighbor idea as dots joining, labeled ILLUSTRATION (§4).

**Main search phrase: `TikTok algorithm`.** Spoken at about 2.4 s in line `know`. Show it on screen in the first 2 s and put it in the caption's first line. Secondary phrases for the SEO agent: `how does the TikTok algorithm work`, `how TikTok For You page works`, `For You page algorithm`, `why TikTok knows what I like`. I didn't check search volumes.

**DM-able moment:** lines `stranger` → `helped`: "Say a stranger watched the same two videos you did. TikTok may guess you'll like her third one too. So a stranger you'll never meet helped pick your feed." It's TikTok's own example, and people send it to whoever shares their feed.

**Proposed YouTube title (viral style: 4–8 words, Title Case, one emoji):** **"Why TikTok Knew You'd Watch This 🤔"**. Alternatives: "The Stranger Who Picks Your TikTok Feed 😮" and "How TikTok Knows What You Like 🤔".

## 2. Hook options

1. **"TikTok bet you'd watch this."** (chosen, 5 words) It's a contradiction aimed at the viewer ("you didn't choose this, it chose you"), it's in second person about their own phone, and it's true. TikTok gives each candidate video a prediction score, "an estimate of how likely you are to interact", and serves the highest scores (fact 1). It also sets up the loop, because the last line asks whether they finished this one. "Bet" is a figure of speech for "predicted"; that's fair, because a prediction score is literally a wager on your behavior. Caveat: this is strictly true only for viewers who reach the film through For You, not through search or the profile page. That's most of a new account's views, but it's inferred.
2. "TikTok knew what you liked before you did. Here's the math." (the sheet hook, rejected) It's 12 words, twice the limit. "Before you did" overclaims: TikTok predicts from what you already did. And "the math" promises a formula the film can't honestly show. The only formula on record is the NYT's "highly simplified" one (fact 7).
3. "You're grading this video right now." (6 words, kept as a backup) It's true while you watch, because finishes, skips and time spent are signals (facts 2–3). But it's less of a twist than "it bet on you first", and "grading" isn't TikTok's word.

## 3. Facts used

All checked 2026-10-24. Primary sources first: TikTok's own newsroom and transparency pages, both fetched as raw HTML and read in full.

| # | Fact | Line | Source |
|---|---|---|---|
| 1 | "We use these signals to create a prediction score for different videos. This score is an estimate of how likely you are to interact with each of those videos. Videos with the highest score are selected to be served to your For You feed." Ranking "sorts videos by their prediction scores". | hook | TikTok Transparency Center, "Introduction to the TikTok recommendation system" (undated page, © 2025 footer, read 2026-10-24): https://www.tiktok.com/transparency/en-us/recommendation-system/ |
| 2 | Signals include "Videos you've recently interacted with, including those you watched, finished, liked, or skipped." The system predicts your likelihood to "Finish, skip, or favorite a video" and to "Spend a certain amount of time viewing a video." | clue, linger | same transparency page, Appendix |
| 3 | **Replays are named by TikTok:** "Your first set of likes, comments, and replays will initiate an early round of recommendations". | clue | TikTok Newsroom, "How TikTok recommends videos #ForYou", June 18, 2020: https://newsroom.tiktok.com/en-us/how-tiktok-recommends-videos-for-you (the same text was reposted Nov 1, 2023: https://newsroom.tiktok.com/how-tik-tok-recommends-video-for-you?lang=en-MY) |
| 4 | "A strong indicator of interest, such as whether a user finishes watching a longer video from beginning to end, would receive greater weight than a weak indicator, such as whether the video's viewer and creator are both in the same country." | strong | Newsroom, June 18, 2020 (above) |
| 5 | **The stranger rule:** "if another user has engaged with two of the same videos that you have interacted with, the system may predict that you are likely to also engage with a third video that this user has interacted with." | stranger, third, helped | Transparency page, "Signals from you" (above) |
| 6 | Supporting: "you might be recommended a video that's been well received by other users who share similar interests." | helped | Newsroom, June 18, 2020 (above) |
| 7 | **The internal doc.** Ben Smith, "How TikTok Reads Your Mind", The New York Times, Dec 5, 2021: an internal document headed "TikTok Algo 101", produced by TikTok's engineering team in Beijing. A TikTok spokeswoman, Hilary McQuaide, confirmed it is authentic and said it was written to explain the algorithm to nontechnical employees. TikTok "has chosen to optimize for two closely related metrics in the stream of videos it serves: 'retention', that is, whether a user comes back, and 'time spent'." Smith: "This system means that watch time is key." Rough equation: Plike × Vlike + Pcomment × Vcomment + Eplaytime × Vplaytime + Pplay × Vplay, which the article calls highly simplified. | doc, two | NYT: https://www.nytimes.com/2021/12/05/business/media/tiktok-algorithm.html (blocked to our fetcher; read via the NYT News Service syndication on Boston.com, Dec 6, 2021: https://www.boston.com/news/commentary/2021/12/06/how-tiktok-reads-your-mind) |
| 8 | Optional, screen only: "your For You feed generally won't show two videos in a row made with the same sound or by the same creator." The transparency page adds that if top-ranked videos are too similar, "for example, they use the same sound", it replaces some of them. | none (a possible pinned comment) | Newsroom 2020; transparency page "Similarity check" |
| 9 | Optional: "neither follower count nor whether the account has had previous high-performing videos are direct factors in the recommendation system." | none (a possible pinned comment) | Newsroom 2020 |

**Wording choices tied to sources**
- `third` says TikTok "**may** guess", because the source says "may predict". Never say "will".
- `doc` says "**saw**", not "leaked". The NYT says it obtained the document, and TikTok confirmed it. I couldn't read how the Times got it in the original, so the film doesn't say "leaked".
- `two` gives the doc's two metrics as plain questions: "come back" for retention, "how long you stay" for time spent. "Watch time is key" is Ben Smith's summary, not the doc's words. If it goes on screen, credit it to the NYT, not to TikTok.
- `linger` gets "counted" from "watched" and "spend a certain amount of time viewing" (fact 2). TikTok doesn't publish a unit, so the screen shows no seconds threshold.

**Kept out on purpose**
- **Shadowbans, "the first 3 seconds decide everything", "post at X o'clock", "likes don't matter", a fixed test batch of 200–500 viewers.** None of these are in TikTok's published material. They're myths or creator folklore. Isac's note excludes them.
- **Which counts more, a like or a finish?** TikTok compares a finish only with "same country", not with a like. So the film never ranks a finish above a like.
- **The WSJ bot experiment (July 2021).** The WSJ ran "dozens" or "100" bot accounts, depending on the reprint, and reported that time spent lingering was the strongest signal and that interests were learned in under 2 hours. It's a great story, but I could only reach secondary reprints (e.g. https://www.tubefilter.com/2021/07/21/tiktok-recommendation-algorithm-wall-street-journal-guillaume-chaslot/), the bot count conflicts between them, and it isn't TikTok-published. Left out.
- **Embeddings or "points on a map".** TikTok doesn't publish its model internals. ByteDance's research papers (e.g. Monolith, 2022) are about ByteDance recommendation infrastructure in general, not confirmed as the For You feed. Picture only, labeled ILLUSTRATION.
- **"Before you did."** The sheet hook's claim is unsupported. TikTok predicts from past behavior, not from your future mind.
- **The ByteDance/Beijing politics.** True and sourced (fact 7), but it's a second idea.

## 4. Shot ideas per line

House look: ink-dark stage, cream type, one hot coral accent, chips, labels, stamps. Everything is hand-built, with no AI imagery. **Don't use real TikTok UI screenshots or the TikTok logo as a prop.** Draw a generic phone with a vertical feed of blank cream "video cards". Name TikTok in type only.

**Proposed native move: the swipe card.** A stack of cream video cards in a drawn phone frame. Each card the viewer "does something" to (finish, skip, replay, linger) flicks up or loops, and leaves a coral tally mark on a running **SCORE** strip at the side. That strip is the visual spine. The caret from Next word doesn't fit.

Frame 0 (GPS and stats lessons): not a dark text card. One huge moving object: the phone with this very video's card in it and a coral betting chip sliding onto it.

| id | at | Line | Picture |
|---|---|---|---|
| hook | 0.2 | "TikTok bet you'd watch this." | **Frame 0:** a big drawn phone fills the frame, and its card reads "THIS VIDEO". A coral casino chip slides onto it and stamps **BET: YOU'LL WATCH**. Headline ≤ 5 words, ≥ 64 px, upper third: **TIKTOK BET ON YOU**. |
| know | 2.39 | "So how does the TikTok algorithm know?" | Chip **TIKTOK ALGORITHM** (the search phrase), with a big coral **?** stamp. The phone tilts toward the viewer. |
| clue | 5.29 | "Every swipe is a clue: finish, skip, or replay." | **Native move:** three cards in quick succession, 1 s each. One plays to a full progress bar (**FINISH ✓**), one flicks away (**SKIP**), one loops with a ↻ icon (**REPLAY**). Each drops a coral tally on the SCORE strip. |
| linger | 8.9 | "Even the seconds you linger get counted." | A thumb hovers over a card without swiping. A stopwatch chip ticks 0:01, 0:02, 0:03, and a tally lands with each tick. |
| strong | 11.8 | "Finish a long video? TikTok calls that a strong sign." | A long card with a progress bar that fills all the way. Stamp **STRONG SIGNAL**. Small print, quoted: "finishes watching a longer video from beginning to end" · TikTok Newsroom, Jun 18, 2020. |
| turn | 16.13 | "But here's the trick. It's not just you." | The camera pulls back. Your phone shrinks to one of many drawn phones on the stage. |
| stranger | 19.39 | "Say a stranger watched the same two videos you did." | Two phones side by side, **YOU** and **STRANGER** (a plain silhouette, no face). Cards A and B light coral on both, and a coral line joins the matching cards. |
| third | 23.36 | "TikTok may guess you'll like her third one too." | The stranger's phone shows card C. It slides across the line into your feed. Label **MAY PREDICT** (TikTok's word). Small print: TikTok Transparency Center. |
| helped | 26.97 | "So a stranger you'll never meet helped pick your feed." | **DM-able frame:** your feed column with card C in it, tagged **PICKED WITH HELP FROM A STRANGER**, ≥ 40 px, held ≥ 3 s. A faint dot field behind it (the "neighbors" picture, small label ILLUSTRATION). |
| doc | 30.94 | "In 2021, the New York Times saw TikTok's internal playbook." | A re-created paper doc drops in, headed **"TikTok Algo 101"**, with a **RE-CREATED** tag and a stamp **CONFIRMED BY TIKTOK** (spokeswoman, NYT Dec 5, 2021). No fake body text: blur bars only. |
| two | 34.91 | "Two numbers mattered: do you come back? How long do you stay?" | Two big coral chips slap onto the doc: **RETENTION** ("come back?") and **TIME SPENT** ("how long?"). A counter could roll the seconds of this film so far. |
| end | 39.6 | "So, did you finish this one? Yes or no?" | Back to the frame-0 phone with the progress bar of this video almost full. Two cream buttons, **YES** / **NO**, and a blinking comment box. On "no?" it cuts to frame 0 and the loop replays. |

Pacing: a new object every 3–4 s, and no hold over 4 s except the DM frame.

## 5. Open questions for the director

1. **Length.** 12 lines, 106 spoken words. The chained `at` puts `end` at 39.6 s and `dur` at 43.8 s. Ming usually reads a bit faster, so expect about 38–42 s. If it runs long, cut `turn` first (`strong` → `stranger` still flows, with "Say" as the turn).
2. **Turn words.** "So" (2.4 s), "Even" (8.9 s), "But here's the trick" (16.1 s), "So" (27 s), "In 2021" (30.9 s), "So" (39.6 s). The 2.4–16 s stretch rides on the fast card montage rather than a spoken turn. If the jury flags a sag around 12 s, slap the STRONG SIGNAL stamp hard on the beat.
3. **Trademark and UI.** I'd keep TikTok's logo, music-note mark and real interface off screen. A generic drawn phone and the word "TikTok" in house type are enough, and they read as not-AI.
4. **The doc prop.** Re-create only the title "TikTok Algo 101" and the two metric names. Don't invent body text or the formula's look. If the formula appears at all, show it as a line of type credited "as printed by the NYT, simplified".
5. **Pronunciation.** "Algo 101" isn't spoken, on purpose. "2021" has a `say` ("twenty twenty-one"). "New York Times" is in `names` for the Whisper check. Ming may drop "TikTok" at the start of line 1, the GPS lesson about names at the start of a short line. If it does, try `say`: "So, TikTok bet you'd watch this." Or re-roll with `take` before rewording.
6. **Pinned comment idea for the SEO agent:** "TikTok says it won't usually show you two videos in a row with the same sound or the same creator, on purpose (TikTok Newsroom, June 18, 2020)." Or: "Follower count isn't a direct factor, per TikTok's own post." Both are sourced (facts 8–9).
7. **On-screen sources (end card):** "TikTok Newsroom, Jun 18 2020 · TikTok Transparency Center · NYT, Ben Smith, Dec 5 2021".
