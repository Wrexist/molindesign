# Delta launch growth plan (GTA 6, from 2026-11-19)

Written 2026-11-19 for Isac. `RUN.md` stays the procedure for scheduled runs; this file is the strategy it serves. Where they differ during launch week, RUN.md's launch-week section wins.

## Where we start
- 21 Shorts posted Oct 28 – Nov 18. Most stall at 1,050–1,265 views (`analysis/STATS.md`): the test-audience ceiling. Nothing has broken out yet, so the first 1–2 seconds are the lever.
- From launch day the footage problem is gone: **Isac's own gameplay capture** is the main source (SAFE-EDIT rule 8), plus official Rockstar trailers under rule 7. Everything lives in the PC library **`D:\GTA6-Library`** (README there; copyright rule: official Rockstar + own capture only, fan posts are topic ideas only).

## Content categories and formats
| Category | Short (9:16, 20–30 s) | Long-form (16:9) | Square (1:1) |
|---|---|---|---|
| **Launch news** (sales, players, reviews, official numbers) | Number as the hero on frame 0, primary source in BRIEF.md | Weekly "launch week in numbers" recap, 6–10 min | Number card for community/X |
| **Hidden details / easter eggs** (own capture) | One detail per Short, circle + freeze, "Did you notice…" | "25 hidden details in Vice City", 10–15 min | Before/after still |
| **Comparisons** (GTA 5 vs 6, real Miami vs Leonida, trailer vs final game) | Split screen, one comparison | "Trailer vs final game: what changed", 8–12 min | Side-by-side still |
| **Locations / map** | "This place is real", map graphic + capture | Full map tour by region, 15–20 min | Map crop |
| **Characters, vehicles, weapons** | "Fastest car in GTA 6?" tests with own capture | Tier lists / tested rankings, 10–15 min | Tier card |
| **Tips / how to** (money, best early cars, settings) | One tip, payoff by 2 s | "Beginner guide: first 10 hours", 12–20 min | Checklist card |
| **Funny / physics moments** (own capture) | Raw moment + our caption and voice, never uncommented | Monthly compilation with commentary | — |
| **Spoilers** (story) | Only with "SPOILERS" in title and first second, no cutscene compilations, no ending | Theory/analysis with own capture | — |

## Launch week cadence (Nov 19–25)
- **4 Shorts a day**, all fresh, no fillers: 09:00, 13:00, 19:00, 23:00 ET (15:00, 19:00, 01:00, 05:00 Stockholm). At least 4 h apart.
- Daily mix: 1 news (whenever an official number lands), 2 own-capture (hidden detail, comparison, tip), 1 trailer-vs-game or map.
- **Isac's part, about 60–90 min a day:** play and capture, drop files in `04-my-captures/_inbox`, run `tools/ingest-captures.ps1`, jot ideas in `02-reference/topic-ideas/IDEAS.md`. The cloud runs build the Shorts from what's there.
- **Long-form:** first one by **Sun Nov 23**: "GTA 6 launch week: every number so far + 10 things I found". Then **2 a week** (Wed + Sun).
- TikTok stays paused until Isac logs in to @deltaisac (2026-10-28 "upload on YouTube for now").

## After launch week (from Nov 26)
- 3 Shorts a day (13:00, 19:00, 23:00 ET) + filler only when a remix has a genuinely new hook.
- 2 long-form a week. Every long-form gets 3–5 Shorts cut from it that link back (related video).
- Weekly stats read (RUN.md step 8): drop the weakest category, double the strongest.

## Series (recurring names viewers recognise)
1. **"GTA 6 Detail of the Day"** – one hidden detail daily, numbered (#1, #2…). Playlist.
2. **"Trailer vs Reality"** – trailer shot next to the same place in the final game.
3. **"Is This Real?"** – Leonida spot vs its real Florida location.
4. **"GTA 6 by the Numbers"** – official sales/player/review numbers, news format.
5. **"Tested"** – we test a claim in-game (top speed, fall damage, police response time).

## Hooks (frame 0, ≤5 words, readable muted, payoff by 2.0 s)
- "GTA 6 sold ___ in 24h"
- "You missed this in GTA 6"
- "This GTA 6 place is real"
- "Trailer lied? Look closer"
- "Fastest car in GTA 6?"
- "Don't do this in GTA 6"
- "GTA 5 couldn't do this"
Rules: number or question first, no logo intro, motion on frame 0, captions on, "GTA 6" in title and first spoken second.

## Shorts vs long-form split
- Shorts: ~85% of output, discovery engine, 20–30 s.
- Long-form: ~15% of output but most of the watch time and subscribers that stay; built from the week's best captures and the Shorts that beat 2× the channel median.
- Pin a question under every video; reply to early comments in the first hour.

## Factory tooling
| Step | Tool |
|---|---|
| Official trailer clips | skill `gta-clip-short`, `delta/clips/clipkit.py fetch/cut/lint` (refuses non-official) |
| Own capture | `clipkit.py fetch <file> --own`, then the same skill steps 2–7 |
| Build | `factory/make.sh gta-<slug>` (WORKERS=2) |
| Quality gate | fresh `video-jury` with the SAFE-EDIT checklist: 7.0+, Truth 8.5+, hook rule |
| Packaging | `video-seo` → `seo.md` |
| Slot gate | `factory/repost.py check gta-<slug> --channel delta --at "<slot UTC>"` |
| Posting | queue on `claude/delta-queue` → PC task "Delta autopost" (`PC-AUTOPOST.md`) uploads, schedules, pins the question |

**Dependency:** the PC autopost must be running. On 2026-11-19 it was disabled and its Claude login had expired (every tick since Nov 14 failed with "OAuth session expired"). Fix: run `claude` on the PC, `/login`, then re-enable the task "Delta autopost".
