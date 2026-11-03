# Delta: GTA 6 channel line

Delta (YouTube and TikTok @deltaisac, about 161k subscribers) is becoming a GTA 6 channel until and after launch on **2026-11-19** (PS5, Xbox Series X|S). This is a second line next to `factory/` ("Tech, explained"). It reuses the same code-rendered film pipeline (`film/`, `factory/make.sh`, the video agents in `.claude/agents/`) and keeps its own backlog, rules and channel.

**The two channels never mix.** Tech, explained videos never go to Delta; Delta videos never go to Tech, explained. Every posting instruction names the target channel and tells the PC session to switch to it and verify the channel name in YouTube Studio / TikTok before uploading.

## Why films are made from our own graphics
Re-uploading or lightly editing other people's footage risks Content ID claims, copyright strikes and YouTube's reused-content demonetization (which applies to the whole channel). Pre-launch there is no footage we own, so pre-launch Shorts are built from **our own flat motion graphics** (maps, counters, timelines, comparisons) with our own voiceover. After launch the source is **our own console capture**. Rockstar trailer excerpts are allowed only under `SAFE-EDIT.md`.

## Files
| File | What |
|---|---|
| `SAFE-EDIT.md` | The rules every video must pass, and the jury checklist addition |
| `backlog.csv` | Topic queue, calendar order, status |
| `REBRAND.md` | Channel switch steps and copy (name, about, banner brief, transition video) |
| `../film/gta-<slug>/` | One film per video, same contract as `film/nextword/` |

## Run one video
1. Take the next `ready` row of `backlog.csv`.
2. `video-researcher` writes `film/gta-<slug>/BRIEF.md` (every fact sourced, rumors labeled) and `vo/script.json`.
3. `video-director` builds the film with `factory/make.sh gta-<slug>`; art style: flat, hand-built shapes in a Vice City palette (pink #ff4fa3, teal #19d3c5, sunset orange #ff8a3d on deep ink), our own art, no Rockstar logo or key art.
4. Fresh `video-jury` with the checklist in `SAFE-EDIT.md` added.
5. `video-seo` writes the YouTube Short and TikTok text (`GTA 6` in the title and first line).
6. Upload from the PC to **Delta** only, scheduled in the slot given by `backlog.csv`.

## Status notes
Videos 1-9 are the first batch: Shorts built from our own graphics. Rows marked `wait` need facts checked closer to the date or footage that does not exist yet.
