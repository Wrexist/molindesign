# Video factory

A daily line that turns a topic into a finished TikTok explainer. It runs on the same code-rendered film pipeline as `film/` (voice first, every frame a pure function of t) and uses the pilot, `film/nextword/` ("Next word"), as its template and its quality bar.

```
Drive sheet "Video factory topics"   (Isac adds and orders topics)
        │  orchestrator: .claude/skills/video-factory   (picks the next free row, claims it with a Drive doc)
        ▼
video-researcher  → film/<slug>/BRIEF.md (facts + sources), vo/script.json (English, 60–85 s)
        ▼
video-director    → film/<slug>/ film.js, TREATMENT.md; voice, picture, mix via factory/make.sh
        ▼
video-jury        → fresh eyes, 8 scores, verdict post / fix then post / don't post (max 2 rounds)
        ▼
video-seo         → film/<slug>/seo.json, seo.md (caption, hashtags, keywords, cover, post time, sounds)
        ▼
upload            → Higgsfield media → TikTok publish form (draft) → Isac taps
        ▼
record            → Drive doc "Factory #n · topic", factory/backlog.csv, PR "Factory #n: topic"
```

## Where things live

| What | Where |
|---|---|
| Topic queue (Isac edits) | Drive › Video factory › **Video factory topics** (sheet). Status: `ready`, `next` (do this one first), `skip`, `wip`, `done`. |
| One doc per video | Drive › Video factory › `Factory #n · topic`: script, sources, jury score, caption, hashtags, links. |
| Repo mirror of the queue | `factory/backlog.csv` |
| Film source | `film/<slug>/` (one folder per video, same contract as `film/nextword/`) |
| Video files | Higgsfield (uploaded for TikTok), `/mnt/project-files/factory/<slug>/` when run inside the project; not in git |
| Agents | `.claude/agents/video-researcher.md`, `video-director.md`, `video-jury.md`, `video-seo.md` |
| Run steps | `.claude/skills/video-factory/SKILL.md` |

## Running it

- **On a schedule:** a scheduled task starts a fresh session every morning (Stockholm time) that runs the `video-factory` skill once.
- **By hand:** ask Claude to "make the next factory video", or name a topic or slug.
- **Just the render:** `bash factory/setup.sh` once, then `bash factory/make.sh <slug>` (or `voice`, `picture`, `mix`).

## Why it's built this way

- **TikTok needs a human tap.** TikTok's API requires the account owner to confirm each post, so the factory stops at a ready-to-post form (saved as a draft so Isac can add a trending sound in the app). Everything before that is automatic.
- **Drive holds the state between runs.** Each scheduled run is a fresh machine. Its branch starts from `main`, which lags behind unmerged PRs, so "is this topic taken?" is answered by the Drive docs and open PRs, not by `backlog.csv`.
- **Drive can't edit a doc's content through our connector,** only create, copy and trash. So the claim doc is replaced by the finished doc at the end of a run.
- **A fresh jury agent** catches what the maker can't: the pilot's first jury round (6.5/10) found most of what lifted it.
- **Aimed at the US.** TikTok first tests a video near the account's location (SIM, IP, sign-up region), and Isac posts from Sweden. We don't spoof location (VPNs and bought SIMs get accounts shadow-banned and break TikTok's terms); instead every signal we control says US: American English, US examples and keywords, US-trending sounds, post times in ET, and engagement with US viewers.
- **No music, English voice, constant motion, honest facts**: Isac's standing preferences, recorded in team memory.
