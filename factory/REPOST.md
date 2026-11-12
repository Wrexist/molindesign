# Archive and filler reposts

Isac (2026-11-12): keep every video so it can be changed a little and re-uploaded in bulk as **fillers**, for more videos a day, under clear rules, starting with "the same video can't be uploaded within the same week".

This covers both lines: **Tech, explained** (`factory/`) and **Delta** (`delta/`, `film/gta-*`). The tool is `factory/repost.py` and it enforces the rules below. A FAIL blocks the slot.

## What is archived, and where

| Part | Where | Why it's enough to remake the video |
|---|---|---|
| Film source: `film.js`, `index.html`, `BRIEF.md`, `seo.md` | git, `film/<slug>/` (main, or the open PR's branch) | Every frame is `render(t)`; change a line and re-render |
| Script, voice, word timings | git, `film/<slug>/vo/script.json`, `vo/<slug>-vo.mp3`, `vo/vo.js` | `vo.js` gives each line's start and end, so cuts land on sentence boundaries |
| Source snapshot | `/mnt/project-files/archive/<slug>/source-<commit>.tar.gz` + `MANIFEST.json` | Survives a deleted or never-merged branch. Restore with `tar -xzf` in the repo; it needs `film/kit`, `film/tools`, `film/fonts` from main |
| Rendered videos | `/mnt/project-files/factory/<slug>/<slug>-vo.mp4`, `-voice-only.mp4`, `poster.jpg` (long videos in `longform/<slug>/`, the pilot in `next-word/`) | Cuts are made from these without rendering again |
| What went up, when | `factory/posts.csv` on every branch + `factory/posts-backfill.csv` | The tool reads all of them, because main lags the open PRs |
| Inventory | `factory/ARCHIVE.csv` (`repost.py inventory --write`) | One row per film: status, source branch, what's present, posts, expiry |

State on 2026-11-12: 59 films, 36 posted. Every posted film has its source, voice, timings and render. Three renders (incognito, voiceclone, stepbystep) were missing from the project folder and were pulled back from Higgsfield's CDN. Ten posted films have their source only on an unmerged branch (PR #39 and the Delta branches). They are snapshotted, and they reach main when those PRs merge.

**Keep it current:** `make.sh mix` already copies each new render to the project folder. After each new post, add its row to `posts.csv` and run `python3 factory/repost.py snapshot <slug>`.

## The rules

| # | Rule | Why |
|---|---|---|
| R1 | **The same video (original or any remix of it) is never posted twice on the same channel and platform within 7 days.** *(Isac)* | Viewers notice, and the platform sees a duplicate |
| R2 | A remix waits until the original is at least 7 days old. | A Short gets most of its views in its first days; a filler must not compete with it |
| R3 | **No exact re-uploads.** A filler is always a remix (`film/<slug>-r<N>/` with `remix.json`), with a **new opening line** (the first 2 s), a **new title** and a **new cover text**. | Both platforms push down duplicates. The opening is what the feed tests |
| R4 | A remix has its own render. A **cut** must be at least 20 % shorter than the original. A speed change, mirror, filter or crop alone does not count. | Small edits like these are exactly what "unoriginal content" detection looks for |
| R5 | At most 3 remixes of one source per channel and platform, ever. | After that it's spam, and the audience has seen it |
| R6 | Per channel and platform: at most 3 posts per ET day on Tech, explained and 4 on Delta (3 fresh at 13:00, 19:00, 23:00 ET + the filler; Isac 2026-11-12), **at most 1 of them a filler**, at least 4 h apart. Fresh videos keep 13:00 and 19:00 ET; a filler takes **09:00 ET** (4 h before 13:00), or 23:00 ET if 09:00 is taken. | Keeps the existing slot rules and puts fresh work first |
| R7 | Fillers are at most half of a channel's posts in any 7 days. | Fillers fill gaps; they don't replace new videos |
| R8 | No fillers on TikTok for now. Fillers run on YouTube for **both** channels (Isac 2026-11-12: Tech, explained, then Delta too). | The Tech, explained TikTok has been held since Oct 27 (three duplicate re-posts went up on Oct 23), Delta's TikTok is paused, and TikTok keeps unoriginal reposts out of For You |
| R9 | Time-bound facts (prices, counts, "today", "last month", dates) are checked again at the source within 2 days of the slot, written into `remix.json` as `facts_checked`. Expired videos (`repost-meta.csv`) are never reposted. | gta-preload is pre-launch news; airplanemode says "last month"; gta-price depends on the store price |
| R10 | The channels never mix (gta-* only on Delta, the rest only on Tech, explained). gta-transition is never posted. | Standing rules |
| R11 | Only videos that passed the jury and went live can become fillers. Held or parked films go through the normal jury. | Fillers re-use proven work; they are not a way around the gate |
| R12 | Each filler is logged in `posts.csv` under its own slug (`incognito-r1`), so R1, R5 and R7 can see it. | The gate only knows what is logged |

### Platform risk, said plainly
- **YouTube**: re-posting your own Short is allowed. But YouTube's monetization policy (renamed from "repetitious" to **"inauthentic content"** on 2025-07-15) demonetizes channels whose videos look template-made with little variation, or that repeat the same narration across videos. Delta is a 161k channel, so a pattern of near-identical re-uploads puts the **whole channel's** monetization at risk, not only the filler. R3–R7 are there to keep each filler a real, different edit. Watch YouTube Studio for a "reused/inauthentic content" notice; if one appears, stop fillers on that channel.
- **TikTok**: reposts with only small edits are flagged as unoriginal and kept off For You. Repeated flags can hold back the whole account. That is why R8 keeps TikTok off.
- Fillers will usually get fewer views than the original. Their value is keeping the channel active every day. Run `factory/stats.py` after two weeks and drop fillers if they pull the channel average down.

## Two kinds of remix

**Cut** (cheap, about 1 minute, no render): start on a later line that works as a question or hook, end earlier or later. It is cut from the existing render at `vo.js` line boundaries, with short audio fades.
```
python3 factory/repost.py candidates                      # which sources may get a filler now
python3 factory/repost.py remix incognito --kind cut --from ask --to hero
#   → /mnt/project-files/factory/incognito-r1/incognito-r1-vo.mp4 (+ voice-only, poster)
#   → film/incognito-r1/remix.json: fill title, cover, facts_checked
```
Watch the cut. It must make sense without the lines it dropped.

**Hook** (about 20 minutes, render): a new first line and a new opening picture, with everything after reused.
```
python3 factory/repost.py remix gps --kind hook           # copies the source to film/gps-r1/
# edit film/gps-r1/vo/script.json line 1 + film.js opening beat, then:
bash factory/make.sh gps-r1
```
Use a hook remix for a **flop with a good jury score**: PERFORMANCE.md shows views follow the packaging, so a new hook and title is that video's second chance. Use a cut for a **winner**, a shorter version of something that already works.

## The gate (every scheduled post, fresh or filler)
```
python3 factory/repost.py check <slug> --channel tech|delta --platform youtube --at "YYYY-MM-DD HH:MM"   # UTC
```
Exit 0 means it's OK to schedule. Exit 1 means it's blocked, and the FAIL lines say why. Fresh posts are checked too (R1, R3 exact re-upload, R6 spacing, R10 channel).
