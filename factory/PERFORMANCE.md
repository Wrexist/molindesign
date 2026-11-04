# Why our videos did well or badly

Analysis of every posted video (31 posts: 13 Tech, explained Shorts, 1 long-form, 3 Delta Shorts, 14 TikToks), 2026-11-03. Numbers are public counts read on 2026-11-03 00:17–00:21 UTC with `python3 factory/stats.py` (YouTube via yt-dlp, TikTok from the public video page). No retention data is in here: that lives in YouTube Studio and TikTok Studio, which need Isac's login.

## The short version
1. **Topic and title decide views, not polish.** The jury score has almost no link to YouTube views (Spearman ρ = 0.19 over 11 judged Shorts). A six-point packaging score that asks "is this about something you use, and does it break a belief you hold?" lines up with views at ρ = 0.85. That score was built after looking at the results, so it needs the next 10 videos to prove it.
2. **The winners all break a belief about something the viewer uses**: incognito ("doesn't make you invisible", 843 views in 6 h), battery ("already shrinking", 455), ChatGPT memory ("forgets your name", 441), or give a challenge to try in frame 0 (noise, "Find the cat in this static", 1,319, best like rate).
3. **The flops explain a thing instead**: "What an AI Agent Actually Is" (14), "Why Phone Photos Look Better" (22), "How does GPS work? #Shorts" (50), a strawberry puzzle that was already fixed (14).
4. **TikTok isn't a content problem.** 6 of our last 7 TikToks have exactly 0 plays, and their public pages are missing TikTok's `indexEnabled` flag, which every served post has. The AI label is set on all 13 posts, the 7 that were served included, so the label alone doesn't explain it.
5. **The gate parks too much for what it buys.** 5 factory films and 10 Delta films were parked to gain about 0.2–0.4 jury points each, and those points don't show up as views. The time is better spent choosing the topic.

## 1. The numbers

### Tech, explained, YouTube Shorts (views at 2026-11-03 00:17 UTC)
| Video | Posted (UTC) | Length | Jury | Views | Likes | Packaging /6 | Title |
|---|---|---|---|---|---|---|---|
| noise | Oct 24 17:00 | 45 s | 7.8 | **1,319** | 19 | 4 | How AI Pulls a Cat Out of Static 🤔 |
| incognito | Nov 2 18:00 | 30 s | 7.5 | **843 (6 h)** | 7 | 6 | What Incognito Mode Really Hides 🤔 |
| battery | Oct 25 17:00 | 40 s | 8.0 | 455 | 2 | 6 | Why Your Phone Battery Is Shrinking 🤔 |
| memory | Oct 25 23:00 | 39 s | 8.0 | 441 | 3 | 5 | Why ChatGPT Forgets Your Name 🤔 |
| fyp | Oct 24 23:00 | 40 s | 8.1 | 331 | 4 | 4 | The Stranger Who Picks Your TikTok Feed 😮 |
| qrcode | Oct 27 17:00 | 40 s | 8.0 | 182 | 2 | 3 | Why a Torn QR Code Still Scans 🤔 |
| nextword | Oct 23 | 81 s | – | 179 | 3 | 2 | How ChatGPT actually works #Shorts |
| hallucinate | Oct 23 | 82 s | 8.2 | 135 | 1 | 4 | Why does AI make things up? #Shorts |
| gps | Oct 24 | 79 s | 8.2 | 50 | 1 | 2 | How does GPS work? #Shorts |
| phonephoto | Oct 28 17:00 | 33 s | 7.4 | 22 | – | 2 | Why Phone Photos Look Better Than Real Life 🤔 |
| agent | Oct 28 23:00 | 30 s | 7.4 | 14 | – | 1 | What an AI Agent Actually Is 🤔 |
| strawberry | Oct 23 | 75 s | 7.7 | 14 | 1 | 2 | Why AI can't count the r's in strawberry #Shorts |
| voiceclone | Nov 3 00:00 | 32 s | 7.5 | 4 (17 min) | 1 | 5 | How AI Clones Your Voice From 3 Seconds 😱 |

Long-form "What If Every Undersea Internet Cable Was Cut?" (4:24, Oct 24): **21 views** in 10 days.

### Delta, YouTube Shorts (~161k subscribers)
| Video | Length | Views | Title |
|---|---|---|---|
| gta-13years | 44 s | **1,251** | GTA 6 took 13 years after GTA 5 (and 2 delays) |
| gta-records | 46 s | 312 | GTA 6 trailer views: 90 million in one day, then 475 million |
| gta-leonida | 38 s | 116 | GTA 6: All 6 Leonida Regions Rockstar Names, Mapped |

### TikTok @techexplained.daily (plays at 2026-11-03 00:20 UTC)
| Post | Posted (UTC) | How | Sound | Plays | Served (`indexEnabled`) |
|---|---|---|---|---|---|
| nextword (1st upload) | Oct 23 19:55 | at once | none | 212 | yes |
| strawberry (1st upload) | Oct 23 19:56 | at once | none | 237 | yes |
| hallucinate (1st upload) | Oct 23 19:58 | at once | none | 203 | not read (page fetch failed) |
| nextword repost | Oct 23 20:24 | at once | Floating Dreams | 20 | no |
| strawberry repost | Oct 23 20:30 | at once | The Curious Caper | 70 | yes |
| hallucinate repost | Oct 23 20:32 | at once | Mystery | 0 | no |
| gps | Oct 24 00:33 | at once | Espresso Soul | 204 | yes |
| noise | Oct 24 17:00 | scheduled 13:00 ET | Self Aware | **0** | **no** |
| fyp | Oct 24 23:00 | scheduled 19:00 ET | Sunset in Girona | 200 | yes |
| battery | Oct 25 17:00 | scheduled 13:00 ET | Espresso Soul | **0** | **no** |
| memory | Oct 25 23:00 | scheduled 19:00 ET | Mint Breeze | 395 | yes |
| qrcode | Oct 27 17:00 | scheduled 13:00 ET | Self Aware | **0** | **no** |
| phonephoto | Oct 28 17:00 | scheduled 13:00 ET | Sunset in Girona | **0** | **no** |
| agent | Oct 28 23:00 | scheduled 19:00 ET | Hidden Truth Revealed | **0** | **no** |

All 14 TikToks: AI label on (`aigcLabelType: 1`), created from Sweden (`locationCreated: SE`), 540p. Zero shares on every post on both platforms.

## 2. What the winners share

**noise, 1,319 views, best like rate (1.4 %).** The hook is a task, "Find the cat in this static." The viewer starts looking before they know what the video is about, so the swipe decision is postponed by the game itself. The payoff is a picture (a cat comes out of noise), and AI image generators are something everyone has seen. It's the one winner that isn't about the viewer's own stuff, and it had the strongest frame-0 interaction we've made.

**incognito, 843 in 6 h, the fastest start of any video.** Almost everyone has opened an incognito tab and believes something about it that is wrong. "Incognito doesn't make you invisible" contradicts that belief in five words. The fear is mild and personal (your school, your employer, your internet provider can see), and the proof is Chrome's own screen. The question is already typed into search ("can my school see incognito"). At 30 s it was the shortest film. It went up after a five-day gap, so part of the start may be YouTube testing a channel that had been quiet; the topic explains the rest.

**battery, 455, and memory, 441.** Same shape. "Your phone battery is already shrinking" is a threat about an object in the viewer's hand, with a check they can do ("Check yours in Settings"). "Why does ChatGPT forget your name?" names an annoyance most users have hit. Both are 39–40 s and both have Title Case titles that name the thing in the first three words.

**gta-13years, 1,251, Delta's best.** The emotion is waiting. Every gamer felt those 13 years, and the number is the whole story. Delta's other two Shorts are a record (312) and a map list of insider place names (116): the further a topic moves from what a casual viewer feels, the fewer views.

## 3. What the flops share

- **Definitions.** "What an AI Agent Actually Is" (14) answers a question few people ask, about a buzzword they don't use. The hook "Nobody touched the mouse" is a small mystery, but there is no stake for the viewer.
- **Flattering premises.** "Why Phone Photos Look Better Than Real Life" (22) tells the viewer something nice that they don't need to act on. No belief breaks and nothing is at risk.
- **Textbook titles.** "How does GPS work? #Shorts" (50) and "How ChatGPT actually works #Shorts" (179) read like a school worksheet. Every title with "#Shorts" and lower case did worse than the Title Case and emoji titles that replaced them on Oct 24.
- **Old news.** Strawberry (14) is a puzzle from 2024 that ChatGPT has since fixed, and the script says "used to". A myth that's already been busted has no tension.
- **Length.** The first four were 75–82 s and viewers left at 10–16 s on TikTok (first stats review, Oct 24). Every video since has been 29–45 s. Inside that range, length doesn't predict views (ρ = −0.06); being under 45 s is the requirement, not the edge.
- **Static frame 0.** gps opened on a dark text card and averaged 1.2 s watched on TikTok, the worst number we have.

## 4. What did not matter as much as we thought

- **The jury score.** ρ = 0.19. The two best-judged films (hallucinate and gps, 8.2) got 135 and 50 views; incognito, passed at 7.5, got 843 in six hours. The jury catches real mistakes, and Truth must stay, but going from 7.0 to 7.4 has not shown up in views. Meanwhile 5 factory films (temperature, password, gpus, wifi, math) and 10 Delta films sit parked for missing that gap.
- **Post slot on YouTube.** 13:00 ET (noise, battery, incognito) and 19:00 ET (fyp, memory) both produced winners. The slot matters on TikTok only because of the serving problem below.
- **Sound.** The same sound appears on both served and zero-play TikToks (Espresso Soul: gps 204, battery 0; Sunset in Girona: fyp 200, phonephoto 0).
- **Topic width on Delta.** The two "broad" Delta films (money, pulled) still scored 6.8–7.2 with the jury. Width is a packaging question; the jury doesn't measure it.

## 5. TikTok: why six posts sit at 0
- A post with exactly 0 plays, not even from followers or the profile, has not been shown anywhere. TikTok's public page tells them apart: served posts carry `indexEnabled: true`, and all six zero posts (plus the nextword repost) are missing it.
- **Ruled out as the single cause:** the sound, the length, the topic, the AI label (on all 14), the time slot (agent went out at 19:00 ET and still got 0).
- **Pattern that fits:** every post scheduled for 13:00 ET through the web scheduler (4 of 4) was never served, plus the duplicate reposts and agent. The last post that was served was memory, on Oct 25. The likely causes are a review hold on each new post or a flag on the account. Neither shows in TikTok Studio on the web.
- **What to do:** Isac opens one zero post in the TikTok app and checks it for "Only you can see" or "Not eligible for For You", then opens Settings › Account › Account status. The next TikTok is one brand-new video (never a repost), uploaded from the phone app at once rather than scheduled from the web. `python3 factory/stats.py --only <slug>` after an hour shows whether it's `served`. Change one thing per test and write the result in LESSONS.

## 6. Long-form and Delta
- **Long-form on Tech, explained (cables, 21 views):** a 4-minute video on a channel with almost no subscribers has no audience to show it to, and "What If Every Undersea Internet Cable Was Cut?" isn't a phrase people search. Hold long-form on Tech, explained until the Shorts have built an audience. The finished Nvidia episode can wait as a ready asset.
- **Delta:** 161k subscribers didn't carry the views (1,251 → 312 → 116). YouTube judges each Short on its own, and most of those subscribers came for Isac's earlier gaming content. Pick topics a casual gamer feels, like waiting, price, or "is it worth it", rather than Rockstar's place names. 13years is the template: one huge number that is the whole emotion, said in the first three words.

## 7. The rules (now in LESSONS.md and the pipeline)

### Packaging score: pick and write topics on it before any rendering
One point each; make a topic only at **4/6 or more**, and lead with the highest.
1. **Mine:** it's about something the viewer owns or used this week (phone, battery, ChatGPT, browser, feed, the game they're waiting for).
2. **Myth or threat:** the hook breaks a belief they hold, or says something is happening to them now. A definition or "how X works" gets 0.
3. **Frame-0 test:** they can try, check or see the claim in the first second (find the cat, Chrome's own screen, your battery %).
4. **Takeaway:** they leave with something to do or check (look at battery health, know who can see incognito, a safe word).
5. **Title:** names the thing within the first three words, at most 7 words, Title Case plus one emoji, with a consequence verb ("Really Hides", "Is Shrinking", "Forgets"). Never "#Shorts", never "Actually Is".
6. **Searched:** people already type the question ("can my school see incognito", "why is my battery health going down").

Retro scores: incognito 6, battery 6, memory 5, noise 4, fyp 4, hallucinate 4 (but 82 s), qrcode 3, phonephoto 2, gps 2, strawberry 2, nextword 2, agent 1.

### Backlog, re-ranked by packaging score
| Row | Topic | Score | Note |
|---|---|---|---|
| 23 detect | How to tell if a video is AI | 6 | "Is this video real? You have five seconds." is a frame-0 test; every tell drawn by hand, never AI footage |
| 22 energy | How much energy one AI answer uses | 5 | belief vs. number; use the makers' own dated figures and say "about" |
| 27 whatif-password | What if your password were 20 letters | 5 | threat + check; avoid the password film's parked mistakes (state labels, quote scope) |
| 24 embeddings | How Spotify knows your taste | 4 | mine + searched; needs a myth line ("it doesn't listen to the music") only if sourced |
| 21 vision | How AI sees a photo | 3 | needs a viewer stake before it's worth making |
| 26 whatif-battery | Battery that never wore out | 3 | too close to battery |
| 25 whatif-gps, 28 whatif-internet | | 2 | park |

New topic ideas in the winning shape (the researcher must source each one before scripting): force-closing apps doesn't save battery; why your phone dies faster in the cold (winter, timely); does your phone really interfere with the plane (airplane mode); deleting a photo doesn't delete it (Recently Deleted, backups); "Unlimited" data that isn't (deprioritization); why "Your connection is not private" appears.

### Making the film (unchanged rules that the numbers confirm)
- 29–45 s. Frame 0 shows the test or the broken belief, moving, at most 4 words on screen.
- The hook sentence is the belief turned over: "X doesn't Y", "Your X is already Z", "Find the X".
- End on the viewer's own answer ("Did you think incognito hid you? Yes or no."). Comments are still 0–3 per video on YouTube and 0 on TikTok, so no end question has worked yet. memory's "Has it ever forgotten yours?" got the most (3). Battery's "Drop your number" got 1. Keep testing one end-question shape per video and log the comment count.

### Measuring
- Run `python3 factory/stats.py` at the start of every factory run and paste the rows for the last posts into LESSONS' Performance table. Read views at 24 h and 72 h, not 25 minutes.
- Ask Isac once a week for the YouTube Studio "Viewed vs. swiped away" number and average percentage viewed for the best and worst Short of the week. That is the retention signal this analysis is missing.
