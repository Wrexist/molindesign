---
name: video-factory
description: Run one turn of the video factory - pick the next topic from the Drive backlog, research and script it, make the code-rendered film, pass the jury, write the TikTok SEO pack, upload it for Isac's one-tap Post, record it in Drive and open a PR. Use when a scheduled factory run fires or when asked to make the next factory video.
---

# Video factory

One run makes one finished TikTok explainer, end to end. Four agents in `.claude/agents/` do the work; this skill is the orchestrator that runs them in order and owns every outside call (Drive, Higgsfield, TikTok, GitHub). Read `factory/README.md` once for the why and `factory/TIKTOK-PLAYBOOK.md` for the reach techniques every video applies.

**Standing rules (Isac):** American English narration and captions, aimed at a **US audience** (Isac posts from Sweden, so the content, keywords, sounds and post time must all say US); no music (ship voice + SFX and a voice-only cut, Isac adds a TikTok sound); constant motion; honest facts with sources; no AI tag (no #ai, no "AI voice" line, YouTube Altered content No; Isac 2026-11-03). Never press Post: TikTok requires Isac to confirm every post himself.

## 0. Setup (≈ 1 min, ≈ 5 min in a fresh container)
- `bash factory/setup.sh`.
- If `factory/` or `film/nextword/` is missing on your branch, the factory hasn't been merged yet: `git fetch origin claude/project-thread-0hox72` and `git merge --no-edit origin/claude/project-thread-0hox72` into your working branch, then continue.

- Read `factory/LESSONS.md` and pass it to every agent: each video must be better than the last (Isac, 2026-10-23).
- Run `python3 factory/stats.py` (needs `pip install yt-dlp curl_cffi`) and refresh LESSONS' Performance table with the latest posts, so this run starts from real numbers. A TikTok marked `served: NO` was never pushed to For You; say so in the report.

## 1. Pick the next topic
- Drive folder **Video factory** (`1mMSFv1m8sFh337SRdWxJUBNK3m6cJx1k`), sheet **Video factory topics** (`1GZmiQSHpOqv9SI7WkqslBeQMxbRFpnFV_VLzaD9PxVg`): read it with `read_file_content`. Isac edits this sheet; it wins over `factory/backlog.csv`.
- A topic is taken if any of these is true: Status is `done`, `skip` or `wip`; a Drive doc titled `Factory #<n> ·` exists in the folder (`search_files` with `parentId = '1mMSFv1m8sFh337SRdWxJUBNK3m6cJx1k' and title contains 'Factory #'`); `film/<slug>/` exists on `main` or on an open PR branch (`list_pull_requests`, look for "Factory #").
- Take the row marked `next` if there is one. Otherwise score every free row on the packaging score in `factory/PERFORMANCE.md` §7 (mine, myth/threat, frame-0 test, takeaway, title, searched; one point each) and take the highest scorer at 4/6 or more, the lowest number breaking ties. Views follow this score, not the jury score (2026-11-03 analysis). Put the score and its six marks in the claim doc. If no free row reaches 4, have the researcher propose topics that do. If none is left, have the researcher propose five new topics in the same columns, report them, and stop.
- Create the per-video doc **now** as the claim marker: `create_file` in the folder, title `Factory #<n> · <topic>`, `text/markdown` content with the topic row and "Status: in production (run started <date>)". Its link goes in the final report.

## 2. Research and script → `video-researcher`
Spawn the `video-researcher` agent with the topic row, the slug and today's date. It writes `film/<slug>/BRIEF.md` and `film/<slug>/vo/script.json`. Read both. Reject and send back once if the hook isn't a stake/number/contradiction in the first sentence, or if a fact has no source.

## 3. Film → `video-director`
Spawn the `video-director` agent with the slug. It records the voice, builds `film/<slug>/`, renders and runs the checks with `factory/make.sh`. Expect 30–60 minutes. It must return with `out/<SLUG>-vo.mp4`, `out/<SLUG>-voice-only.mp4`, `out/poster.jpg`, LUFS and readcheck results.

## 4. Quality gate → `video-jury`
Spawn a **fresh** `video-jury` agent with the slug (never the director; it must not have seen the making). Then:
- **post**: go on.
- **fix then post**: send the report to the director (continue the same director agent with SendMessage if you can, otherwise a new one with the report), re-render, run the jury once more with a new agent. Post after round 2 if it reaches 7.0 with Truth ≥ 8.5 and the topic scored 4/6 or more on the packaging score (Isac, 2026-11-03, the same bar as Delta: views follow the topic, not the last few jury points; factory/PERFORMANCE.md). Even on "post", apply the jury's fixes before upload.
- **don't post**, or still under 7.0 (or Truth under 8.5) after round 2: stop. Update the Drive doc with the jury report, mark the row `wip` in the report, open the PR as a draft, and tell Isac what blocked it.

## 5. Packaging → `video-seo`
Spawn the `video-seo` agent with the slug and the final jury report. It writes `film/<slug>/seo.json` and `seo.md`. Check the caption ≤ 150 chars for the TikTok title field (the full caption goes in `description`), 4–6 hashtags, and no AI tag anywhere (no #ai, no "AI voice" line, YouTube Altered content No; see `video-seo` rules).

## 6. Upload for Isac's tap
0. **Repost gate:** before handing any slot to the PC, run `python3 factory/repost.py check <slug> --channel tech --platform youtube --at "<slot UTC>"`. A FAIL blocks that slot; pick the next one or hold. Fillers (remixes of old videos) follow `factory/REPOST.md`: at most 1 a day, never on TikTok, never the same video within 7 days.
1. `tiktok_accounts`. If there is no `active` account, skip to step 7 and put a fresh `tiktok_connect` link in the report.
2. `media_upload` with `filename: <SLUG>-vo.mp4`, `content_type: video/mp4`; PUT the file with curl to `upload_url`; `media_confirm` with `type: video`. Do the same for `<SLUG>-voice-only.mp4` (Isac's cut for a trending sound).
3. (`tiktok_music_trending` returned no tracks for Isac's account on 2026-10-23, and music attached in the form only survives `DIRECT_POST`, so sounds are added by Isac in the TikTok app. Isac wants a popular sound on every post (quiet, about 10% under the voice): never post without one, and TikTok can't change a post's sound afterwards. The first three posts went up without one.) `tiktok_prepare_publish` with `mode: UPLOAD_TO_DRAFT` (Isac picks the sound in the TikTok app; switch to `DIRECT_POST` only if Isac asks), `media_type: VIDEO`, the voice-only video URL, `title` = the caption's first line, `description` = caption + hashtags, `is_aigc: true` (the voice is AI-generated). Don't prefill privacy unless Isac has said. This shows Isac the publish form; he submits it. Never call `tiktok_publish` yourself.

## 6b. Daily filler (Isac 2026-11-12: YouTube fillers, Tech, explained only)
Once per ET day, in the first run of the day, also schedule one filler on YouTube "Tech, explained" (never TikTok, never Delta). Rules: `factory/REPOST.md`.
1. `python3 factory/repost.py candidates --channel tech`: take the first `ready` source. Read its `vo/vo.js` lines and pick a later line that works as an opener on its own (a question or a surprising claim).
2. `python3 factory/repost.py remix <source> --kind cut --from <line> [--to <line>]` (must end ≥ 20 % shorter). Watch a contact sheet of the cut (`ffmpeg -i … -vf fps=1/3,scale=270:-1,tile=4x2`): it has to make sense without the dropped lines.
3. Re-check every fact the cut keeps at its primary source today. Fill `film/<source>-rN/remix.json` (new `title`, new `cover`, `facts_checked`) and write `film/<source>-rN/seo.md` (title, description with sources, pinned question) from the source's seo.md, trimmed to what the cut says.
4. `python3 factory/repost.py check <source>-rN --channel tech --platform youtube --at "<next 09:00 ET in UTC>"` must print OK. If it's blocked, try 23:00 ET, then the next day; never force it.
5. Upload `<source>-rN-vo.mp4` from `/mnt/project-files/factory/<source>-rN/` to Higgsfield and hand it to the PC in the same session as the fresh video, with the same channel check and "Altered content No", playlist "How tech works" or "How AI works", title "…" and the full description.
6. Add the post to `factory/posts.csv` with slug `<source>-rN` and its YouTube id, and commit the remix folder with the run. Pin its question comment after it goes live, like any post.
Skip the filler if no source is ready or the PC is unreachable; a fresh video always comes first.

## 7. Record and hand over
- Re-create the Drive doc's content as a new doc version: Drive can't edit content in place, so `create_file` a new `Factory #<n> · <topic>` doc with the full pack (hook, script, sources from BRIEF.md, jury score and verdict, caption, hashtags, keywords, post time, sound ideas, Higgsfield video URLs, PR link) and `trash_file` the claim doc from step 1.
- Repo: set the row's Status in `factory/backlog.csv` to `done` (or `wip`), add `film/<slug>/` (mp4s stay git-ignored: they live on Higgsfield, in Drive's doc links and in `/mnt/project-files/factory/<slug>/` when that exists), commit "Factory #<n>: <topic>" and push your branch, open a PR titled `Factory #<n>: <topic>` with the jury score, the caption and the poster path.
- Report to Isac in ≤ 8 lines: the topic and hook, the jury score, the Drive doc link, the PR link, the best post time (ET and Stockholm), the sound ideas, and that the TikTok form is waiting for his tap (or the connect link).

## 8. Learn
- Write down what this run taught: add each jury finding that was a real mistake, and anything you'd do differently, to `factory/LESSONS.md` as one-line rules with the video's slug. Remove lessons a later video proved wrong.
- Add this post to `factory/posts.csv` (slug, channel, platform, id, posted UTC, length, jury, hook, title) once it has an ID, so `factory/stats.py` tracks it. Fill the Performance table from `stats.py` at 24 h and 72 h, and say which hook or structure did best, so the next researcher leans into it. When 10 new posts have numbers, re-check whether the packaging score still lines up with views and update PERFORMANCE.md §7.
- Commit LESSONS.md with the run.
- `python3 factory/repost.py snapshot <slug>` so the source survives in `/mnt/project-files/archive/` even if the branch never merges.

## Timing and cost
A run is ≈ 60–90 min of machine time: voice ≈ 7 min, renders ≈ 10 min, two jury rounds, agents' thinking. One run per scheduled firing; never start a second video in the same run.

## Pitfalls
- The voice (Ming US_James since 2026-10-23; Chatterbox before) rushes lines over ~12 words and mishears in Whisper when rushed: split lines, put numbers in `say`, re-roll with `take`.
- `readcheck` fails on stamps that die with their scene: draw them in the global overlay (see the pilot's `STAMPS`).
- TikTok rejects files outside 23–60 fps or < 3 s; ours are 30 fps, 30–45 s (never over 59 s).
- Drive's `update_file` changes only metadata, never content; that's why step 7 re-creates the doc.
