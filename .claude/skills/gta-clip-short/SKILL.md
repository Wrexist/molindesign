---
name: gta-clip-short
description: Turn a GTA video link (an X post, YouTube video, Rockstar page or Isac's own capture) into a Delta YouTube Short draft - check where the footage really comes from, cut short muted clips from official Rockstar video only, build a narrated code-rendered Short around them with our own graphics, lint the clip budget, jury it, and leave the MP4, cover and title in the factory folder. Use when Isac sends GTA footage or a GTA post and asks for a Short from it, or when a Delta run picks a trailer-mode topic.
---

# GTA clip → Delta Short

One URL in, one Short draft out: `film/gta-<slug>/` (film, voice, `clips.json`), the MP4 + cover in `/mnt/project-files/factory/gta-<slug>/`, and the title, description and pinned question in `film/gta-<slug>/seo.md`. Worked example: `film/gta-leaks/` ("Fixing some leaks", built from Rockstar's own Trailer 2 post).

**Read first:** `delta/SAFE-EDIT.md` (the rules this skill enforces), `delta/RUN.md` (slots, gate, upload), `factory/LESSONS.md`. The video agents in `.claude/agents/` do research, film, jury and SEO exactly as in a normal Delta run; this skill adds the footage half.

## Why it is built like this (tell Isac if he asks for "just reupload it")
- **Fan posts are not a source.** Most viral GTA 6 clips on X/TikTok are other people's edits, captures, AI fakes or plain real-world footage with "Vice City" text on it. SAFE-EDIT forbids other creators' clips even when credited, and YouTube's reused/inauthentic content rule demonetizes the **whole channel** (Delta, 161k), not just the video. Content ID claims also land on the channel.
- **What is allowed:** official Rockstar video (trailers, Rockstar's own X/YouTube posts, rockstargames.com) cut into excerpts under 5 s, muted, annotated, at most about half of the runtime, never the same clip in two films; after launch (Nov 19), Isac's own capture (rule 8). Everything else on screen is our own graphics and our own voice.
- A clip that only *shows* something is not enough: every excerpt is evidence for a point the voice makes (freeze, circle, label, quote).

## Steps

### 1. Fetch and judge the source (2 min)
```bash
pip install -q yt-dlp            # once per container
python3 delta/clips/clipkit.py fetch "<url>"
```
It downloads to `/mnt/project-files/delta/sources/<key>/` (never the repo), writes `provenance.json`, a shot list and contact sheets (`sheet-*.jpg`, one frame a second with timestamps) and prints a verdict:
- **OFFICIAL**: the uploader id is on `delta/clips/OFFICIAL.json` (Rockstar's own accounts) or the file is on rockstargames.com. Footage may be used.
- **THIRD_PARTY**: footage blocked (exit 3). **Look at the contact sheets anyway** and report what the post really is: a re-upload of an official trailer (then find Rockstar's own post of it and fetch that), someone's capture/edit, an AI fake, or real-world footage passed off as the game. Use the post for its **topic only**.
- **OWN** (`fetch <file> --own`): Isac's own capture, after launch.

Matching is on account ids, never display names: a fan account can be called "GTA 6". YouTube from the cloud container is often blocked (HTTP 429/403); Rockstar's X posts download fine. Known official posts: Trailer 1 `x.com/RockstarGames/status/1732149328779571313`, Trailer 2 `x.com/RockstarGames/status/1919746311382851812`, Launch trailer `x.com/RockstarGames/status/2110717537964953810`.

### 2. Pick the story, then the shots
- Write the idea before the shots: one hook a stranger gets in 3 s, a point the clip proves, our own graphics for the context. A topic from `delta/backlog.csv` with "trailer" in its notes is a good start.
- `video-researcher` writes `film/gta-<slug>/BRIEF.md` and `vo/script.json` as usual (25–40 s, "GTA 6" in the first second, every fact sourced, guesses labeled THEORY). Transcribe the trailer line you quote with faster-whisper (`~/.venv-ming/bin/python`) rather than trusting articles.
- Pick 1–3 shots from the contact sheets and `provenance.json` `shots` (hard cuts). Each cut 1.5–3 s; plan where it sits in the voice.

### 3. Cut the clips (1 min)
```bash
python3 delta/clips/clipkit.py cut <source-key> --film gta-<slug> --as t2 --credit "Rockstar Games · Trailer 2" \
  --clip roof=11.47-13.6 --clip jason=18.85-20.9
```
Frames go to `film/gta-<slug>/clips/<name>/0001.jpg` (gitignored, no audio, letterbox bars cropped automatically); `film/gta-<slug>/clips.json` records source, in and out points and is committed. A fresh container rebuilds the frames with `clipkit.py restore gta-<slug>` (make.sh does it). Non-official sources are refused.

### 4. Build the film
Start from `film/gta-leaks/` (copy `index.html` and the structure of `film.js`). The clip layer is `film/kit/clip.js`:
```js
CLIP.load('clips.json')                                  // in init(), before READY
CLIP.use('roof', 0, T.roofEnd, { speed, freeze, zoom: [1.06, 1.22], focus: [.36, .42], note: 'circle on Jason' })
CLIP.draw(g, t, x, y, w, h, use)                         // cover-fits the frame into a card
CLIP.toScreen(use, t, nx, ny, x, y, w, h)                // where a point of the picture is now: circles, arrows
CLIP.credit(g, use, x, y)                                // "CLIP · ROCKSTAR GAMES · TRAILER 2" chip while it shows
```
Rules the lint checks: each use under 5 s, a `note` on every use, footage at most 50% of the runtime, never more than 5 s of footage without our own graphics in between, no clip range already used by another film (a `-rN` filler remix may reuse its own). Rules the jury checks: a hook moving on frame 0, an annotation on every clip, our own graphics carrying the context, captions on, "GTA 6" pill on screen.

### 5. Render and check
```bash
bash factory/setup.sh                       # once per container, ~25 min
WORKERS=2 factory/make.sh gta-<slug>        # voice, clip lint, picture, mix, pace; copies MP4 + poster to /mnt/project-files/factory/gta-<slug>/
```
make.sh runs `render.mjs clips` + `clipkit.py lint` before rendering and stops on a FAIL. Look at `out/check/sheet.jpg`.

### 6. Jury, packaging, gate
- Fresh `video-jury` with the SAFE-EDIT checklist: 7.0+ and Truth 8.5+ within 2 rounds; apply its fixes.
- `video-seo` writes `seo.md`: curiosity title with GTA 6, full description with sources, 4–6 hashtags (never #ai), pinned question, and the closing line **"Trailer clips: Rockstar Games (Trailer N), used for commentary. Not affiliated with Rockstar Games or Take-Two."** Copy `seo.md` next to the MP4: `cp film/gta-<slug>/seo.md /mnt/project-files/factory/gta-<slug>/`.
- `python3 factory/repost.py check gta-<slug> --channel delta --at "<slot UTC>"`.

### 7. Hand over
- A Short made inside a scheduled Delta run follows `delta/RUN.md` step 5–7 (standing go for jury-passed Delta Shorts).
- A Short made because Isac sent a link in a thread: deliver the draft (MP4, cover, title) in the thread and **wait for his go there** before uploading; the PC accepts only approvals written in that thread.
- Add the topic row to `delta/backlog.csv`, then commit (frames stay out of git) and open or update the PR.
- **First two trailer-mode Shorts:** after they go live, check YouTube Studio for Content ID claims before making more (SAFE-EDIT rule 7).

## When to say no
Tell Isac plainly, once, and offer the own-graphics version instead, when the ask needs: a fan or creator clip as footage, a whole trailer or an unbroken stretch over 5 s, trailer music or dialogue audio, leaked footage, or real-world footage presented as GTA 6.
