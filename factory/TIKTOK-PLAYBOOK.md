# TikTok playbook for the factory

What the factory does on every video to reach a **US audience** and get pushed by the For You feed, and what Isac sets up once. Researched 2026-10-23.

**Labels:**
- **official** comes from TikTok's own newsroom.
- **consensus** is repeated across many creator and marketing guides, but TikTok hasn't confirmed it.
- **unverified** is a single vendor's number. Use it for direction only.

## What TikTok ranks on

- **official:** TikTok ranks on three groups of signals:
  - user interactions (watch, shares, comments, follows);
  - video information (captions, sounds, hashtags);
  - device and account settings (language, country, device).
- **official:** The last group, settings, weighs least. Finishing a video is a strong interest signal ([TikTok newsroom](https://newsroom.tiktok.com/en-us/how-tiktok-recommends-videos-for-you/)).
- **consensus:** Watch time and completion come first, then rewatches, shares (DM shares especially), saves and comment depth. Likes count for the least ([Hootsuite](https://blog.hootsuite.com/tiktok-algorithm/), [PostEverywhere](https://posteverywhere.ai/blog/how-the-tiktok-algorithm-works)).
- **consensus:** TikTok reads the spoken words (transcription), the on-screen text (OCR) and the caption as search keywords ([SocialPilot](https://www.socialpilot.co/blog/tiktok-seo), [Virlo](https://virlo.ai/blog/tiktok-seo-how-do-i-rank-videos-in-tiktok-search-2026), [CapCut](https://www.capcut.com/create/tiktok-caption-keywords-discoverability)).
- **unverified:** The first distribution call comes around 1.5 s. About 90 % of underperforming videos lose people in the first 3 s ([OpusClip](https://www.opus.pro/blog/tiktok-hook-formulas)).
- **consensus:** Most people scroll with the sound off the first time, so the opening must work silently ([Nemo](https://www.nemovideo.com/blog/how-to-edit-tiktok-videos)).

## Every video (built into the agents)

| # | Technique | Who | How we do it |
|---|---|---|---|
| 1 | **Keyword said, shown and written** | researcher, director, seo | The main search phrase is spoken in the first 5 s, shown as on-screen text in the first 2 s, and repeated in the caption's first line. |
| 2 | **Silent hook on frame 0** | director | Frame 0 already shows a big, readable hook headline (≥ 64 px, upper third), so a muted scroller gets the hook. The voice hook starts at 0.35 s. |
| 3 | **Payoff promised in 3 s** | researcher | The first two lines open a question the viewer needs answered. No intros, no greetings, no "in this video". |
| 4 | **Change every ≤ 1.5 s, re-hook every 6–8 s** | director, jury | Already house rules; the jury scores it. |
| 5 | **Loop ending** | researcher, director | The last line leads into the first, and the last frame cuts cleanly to frame 0, so rewatches count. |
| 6 | **One DM-able moment** | researcher, jury | One fact or image a viewer would send to a friend ("you won't believe this"). The jury scores shareability. |
| 7 | **30–45 s until retention is proven** | researcher | Our first numbers (2026-10-24): 10–16 s average watch on 80 s videos. Short first; Creator Rewards (over 1 minute) only once a video holds viewers past 30 s. Under 60 s also enables duet and stitch. |
| 8 | **American everything** | all | American English, US spelling, examples, units and dollars. The caption keywords are the phrases Americans type ([TimedPost](https://timedpost.com/blog/how-to-get-us-audience-on-tiktok-2026), [MyDrop](https://mydropai.com/post/reach-usa-audience-tiktok-instagram-localization-guide/)). |
| 9 | **US post windows** | seo | 12:00–15:00 ET (18:00–21:00 Stockholm) to post by hand, or 19:00–21:00 ET scheduled in TikTok Studio. |
| 10 | **US-trending sound under the voice-only cut** | seo, Isac | The SEO agent picks two US-trending sounds; Isac adds one in the app at about 5–10 % volume under the voice. |
| 11 | **Few, precise hashtags** | seo | 3–5 topic tags plus 1 broad tag. No #fyp or #viral. The caption reads like a search result, not a tag dump. |
| 12 | **Pinned comment that starts a thread** | seo, Isac | A follow-up question or a bonus fact. Isac pins it right after posting. |
| 13 | **First-hour replies** | Isac | Reply to the first US commenters within the hour. Answer the best question with a **video reply**: it's a free next video with a built-in hook. |
| 14 | **AI label on** | orchestrator | `is_aigc: true`. TikTok requires a label on realistic AI content, and an honest label protects the account. |

## One-time setup for Isac

- **Keep a personal or Creator account, not Business.** Business accounts only get the commercial sound library, so trending sounds disappear.
- **App and phone language: English (US).** The profile name, bio and pinned videos should be in English and US-facing. The channel identity (name, username, bio, picture) is in `factory/brand/README.md`: a general tech channel, "Tech, explained", with no "AI" in the name or picture.
- **Don't spoof location.** VPNs and bought US SIMs are reported to get accounts shadow-banned ([viral.app](https://viral.app/blog/insights/targeting-tiktok-us-audience)), and faking details breaks TikTok's terms. Let the content say US instead.
- **Collaborate with US creators.** A stitch, duet or collab with a US creator in the AI and tech niche puts the video into that creator's US audience ([Snaplama](https://www.snaplama.com/blog/how-to-target-us-audience-on-tiktok-in-2026-complete-strategic-guide)).
- **Promote for a guaranteed US test.** When a video does well organically, a small Promote budget targeted at the US gives it a guaranteed US test audience. It's the only lever that sets geography directly.
- **Post daily, at the same US time.** The factory's schedule makes a video every morning; Isac posts it in the US window.
- **Organize into playlists** ("AI explained") once the account qualifies. Playlists autoplay the next video ([SocialBee](https://socialbee.com/blog/tiktok-playlist/)).

## What we don't do

- **Engagement bait:** no "comment X to get…" and no follow-for-follow.
- **Recycled clips:** no reposting other creators' clips.
- **Fake stats:** no fake numbers on screen.
- **Overclaiming hooks:** the hook must be paid off by the video.
- **Over-polish:** some creators report that it reads as an ad and erodes trust. Keep the look clean and graphic, not glossy.

## Learning loop

The connector can't read TikTok analytics yet. Once a week, Isac adds four columns to the topic sheet for each posted video: views, average watch time, % watched to the end, shares. The researcher reads them and leans into what retained best.
