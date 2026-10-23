---
name: video-factory
description: Run one turn of the video factory - pick the next topic from the Drive backlog, research and script it, make the code-rendered film, pass the jury, write the TikTok SEO pack, upload it for Isac's one-tap Post, record it in Drive and open a PR. Use when a scheduled factory run fires or when asked to make the next factory video.
---

# Video factory

One run makes one finished TikTok explainer, end to end. Four agents in `.claude/agents/` do the work; this skill is the orchestrator that runs them in order and owns every outside call (Drive, Higgsfield, TikTok, GitHub). Read `factory/README.md` once for the why.

**Standing rules (Isac):** American English narration and captions, aimed at a **US audience** (Isac posts from Sweden, so the content, keywords, sounds and post time must all say US); no music (ship voice + SFX and a voice-only cut, Isac adds a TikTok sound); constant motion; honest facts with sources; disclose the AI voice. Never press Post: TikTok requires Isac to confirm every post himself.

## 0. Setup (≈ 1 min, ≈ 5 min in a fresh container)
- `bash factory/setup.sh`.
- If `factory/` or `film/nextword/` is missing on your branch, the factory hasn't been merged yet: `git fetch origin claude/project-thread-0hox72` and `git merge --no-edit origin/claude/project-thread-0hox72` into your working branch, then continue.

## 1. Pick the next topic
- Drive folder **Video factory** (`1mMSFv1m8sFh337SRdWxJUBNK3m6cJx1k`), sheet **Video factory topics** (`1h-oV1HUVS9grGFYIRKwF5Hi_OIpOdopRdzF6sbfc2Dw`): read it with `read_file_content`. Isac edits this sheet; it wins over `factory/backlog.csv`.
- A topic is taken if any of these is true: Status is `done`, `skip` or `wip`; a Drive doc titled `Factory #<n> ·` exists in the folder (`search_files` with `parentId = '1mMSFv1m8sFh337SRdWxJUBNK3m6cJx1k' and title contains 'Factory #'`); `film/<slug>/` exists on `main` or on an open PR branch (`list_pull_requests`, look for "Factory #").
- Take the row marked `next` if there is one, otherwise the lowest-numbered free row. If none is left, have the researcher propose five new topics in the same columns, report them, and stop.
- Create the per-video doc **now** as the claim marker: `create_file` in the folder, title `Factory #<n> · <topic>`, `text/markdown` content with the topic row and "Status: in production (run started <date>)". Its link goes in the final report.

## 2. Research and script → `video-researcher`
Spawn the `video-researcher` agent with the topic row, the slug and today's date. It writes `film/<slug>/BRIEF.md` and `film/<slug>/vo/script.json`. Read both. Reject and send back once if the hook isn't a stake/number/contradiction in the first sentence, or if a fact has no source.

## 3. Film → `video-director`
Spawn the `video-director` agent with the slug. It records the voice, builds `film/<slug>/`, renders and runs the checks with `factory/make.sh`. Expect 30–60 minutes. It must return with `out/<SLUG>-vo.mp4`, `out/<SLUG>-voice-only.mp4`, `out/poster.jpg`, LUFS and readcheck results.

## 4. Quality gate → `video-jury`
Spawn a **fresh** `video-jury` agent with the slug (never the director; it must not have seen the making). Then:
- **post**: go on.
- **fix then post**: send the report to the director (continue the same director agent with SendMessage if you can, otherwise a new one with the report), re-render, run the jury once more with a new agent. Post after round 2 if it reaches 7.0 with Truth ≥ 8.
- **don't post**, or still under 7.0 after round 2: stop. Update the Drive doc with the jury report, mark the row `wip` in the report, open the PR as a draft, and tell Isac what blocked it.

## 5. Packaging → `video-seo`
Spawn the `video-seo` agent with the slug and the final jury report. It writes `film/<slug>/seo.json` and `seo.md`. Check the caption ≤ 150 chars for the TikTok title field (the full caption goes in `description`), 5–7 hashtags, and the AI disclosure.

## 6. Upload for Isac's tap
1. `tiktok_accounts`. If there is no `active` account, skip to step 7 and put a fresh `tiktok_connect` link in the report.
2. `media_upload` with `filename: <SLUG>-vo.mp4`, `content_type: video/mp4`; PUT the file with curl to `upload_url`; `media_confirm` with `type: video`. Do the same for `<SLUG>-voice-only.mp4` (Isac's cut for a trending sound).
3. `tiktok_prepare_publish` with `mode: UPLOAD_TO_DRAFT` (Isac picks the sound in the TikTok app; switch to `DIRECT_POST` only if Isac asks), `media_type: VIDEO`, the voice-only video URL, `title` = the caption's first line, `description` = caption + hashtags, `is_aigc: true` (the voice is AI-generated). Don't prefill privacy unless Isac has said. This shows Isac the publish form; he submits it. Never call `tiktok_publish` yourself.

## 7. Record and hand over
- Re-create the Drive doc's content as a new doc version: Drive can't edit content in place, so `create_file` a new `Factory #<n> · <topic>` doc with the full pack (hook, script, sources from BRIEF.md, jury score and verdict, caption, hashtags, keywords, post time, sound ideas, Higgsfield video URLs, PR link) and `trash_file` the claim doc from step 1.
- Repo: set the row's Status in `factory/backlog.csv` to `done` (or `wip`), add `film/<slug>/` (mp4s stay git-ignored: they live on Higgsfield, in Drive's doc links and in `/mnt/project-files/factory/<slug>/` when that exists), commit "Factory #<n>: <topic>" and push your branch, open a PR titled `Factory #<n>: <topic>` with the jury score, the caption and the poster path.
- Report to Isac in ≤ 8 lines: the topic and hook, the jury score, the Drive doc link, the PR link, the best post time (ET and Stockholm), the sound ideas, and that the TikTok form is waiting for his tap (or the connect link).

## Timing and cost
A run is ≈ 60–90 min of machine time: voice ≈ 7 min, renders ≈ 10 min, two jury rounds, agents' thinking. One run per scheduled firing; never start a second video in the same run.

## Pitfalls
- Chatterbox rushes lines over ~12 words and mishears in Whisper when rushed: split lines, put numbers in `say`, re-roll with `take`.
- `readcheck` fails on stamps that die with their scene: draw them in the global overlay (see the pilot's `STAMPS`).
- TikTok rejects files outside 23–60 fps or < 3 s; ours are 30 fps, 60–85 s.
- Drive's `update_file` changes only metadata, never content; that's why step 7 re-creates the doc.
