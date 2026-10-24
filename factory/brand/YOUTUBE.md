# YouTube channel: Tech, explained

Isac's channel for the factory videos, made 2026-10-23: **Tech, explained**, handle **@techexplained.daily1** (@techexplained.daily was taken). Same identity as TikTok (see README.md); never post these to his game channel.

## Branding (YouTube Studio → Customization)
- **Picture:** `avatar.png` (the mouse pointer, round crop).
- **Banner:** `banner.png` (2560×1440; all text sits in the 1546×423 middle band every device shows). Re-render with `node factory/brand/render-banner.mjs`.
- **Watermark** (Branding → Video watermark): `avatar.png`, display "Entire video". It's a subscribe button on desktop.
- **Description:**
  > How the tech you use every day actually works, in about a minute. GPS, Wi-Fi, your phone's battery and camera, QR codes, passwords, and how ChatGPT and other AI really work. Every fact is checked against a source (in each video's description). New Shorts every day.
  >
  > Narration is an AI voice; the research, script and animation are made for this channel.
- **Links:** TikTok https://www.tiktok.com/@techexplained.daily
- **Layout:** Home tab → Shorts shelf first. Add a "How tech works" and a "How AI works" playlist and put each Short in its series.

## Channel settings (Settings → Channel)
- Country: **United States** (the audience is American).
- Keywords: `tech explained` `how tech works` `how does it work` `technology` `science` `gps` `wifi` `chatgpt` `how ai works` `explained` `shorts` `learn`
- Advanced: Not made for kids.

## Upload defaults (Settings → Upload defaults)
- Visibility Public, category **Science & Technology**, language English (US), caption certification "None of the above" (our captions are burned in).
- Altered content: **Yes** (synthetic narration voice). Comments on, sort by Top. License Standard YouTube.
- Description template: `<hook line>\n\n<one-paragraph answer>\n\nSources: <from seo.json/BRIEF>\n\nNarration is an AI voice. #shorts #tech`
- Tags template: `tech explained, how it works, technology, science, shorts`

## Each upload
- Title ≤ 70 characters, question or search phrase first ("How does GPS work?"), plus `#Shorts`.
- Description: first line repeats the search phrase; the sources from BRIEF.md.
- Add to the series playlist. Pin a comment asking what to explain next.
- Same video file as TikTok (voice + effects, no music). YouTube Shorts can add licensed sounds only from the mobile app.
