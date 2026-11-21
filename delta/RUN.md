# Delta run (what each scheduled Delta run does)

The scheduled task "Delta GTA daily run" fires 3 times a day (08:17, 14:17, 20:17 Stockholm) and follows this file. Change the procedure here, not in the task's prompt.

**Volume (Isac 2026-11-12: "pump more videos a day out on Delta with GTA content, use GTA media"):** up to **3 fresh Shorts a day** at 13:00, 19:00 and 23:00 ET, plus **1 filler** at 09:00 ET (a remix of an older Delta Short, `factory/REPOST.md`). Each run makes or schedules one fresh Short. The first run of the ET day also does the filler.

## Launch week, Nov 18–25 2026 (Isac 2026-11-18: "Do it")
This section wins over the rest of the file until the end of Tue Nov 25 ET. Why: the 2026-11-18 progress check (Claude Doc "Delta channel: progress and growth plan") found remix fillers get the fewest views (records-r1: 166) and seven Shorts in a row stopped at about 1,200 views, which points at the first 1–2 seconds.
- **No fillers.** Skip step 3. The 09:00 ET slot is free for a fresh Short. Still at most 4 posts a day, at least 4 h apart.
- **News first.** At the start of each run, check for a new **official** launch number or fact: Take-Two or Rockstar press releases and Newswire, Take-Two investor posts, review aggregates (Metacritic, OpenCritic), official player or sales counts, YouTube's own GTA VI posts. If one landed since the last Delta Short and no Delta Short covers it, make that the run's Short, ahead of the queue and backlog. Unconfirmed reports (leakers, "sources say") are not news: skip them or label them as a rumor.
  - Speed over polish: aim to queue it for the next free slot. 20–30 s, the number as the hero.
  - **Footage too (Isac 2026-11-21: use what you learned):** a news Short is not graphics-only. Put official Rockstar footage (trailer mode, cached in `/mnt/project-files/delta/sources/`) or clean rule-10 creator clips behind or between the number beats, cut with `clipkit.py` and linted by make.sh. Graphics carry the number; footage shows the game the number is about.
  - The gate doesn't change: fresh jury, 7.0+ and Truth 8.5+, with the number's primary source in BRIEF.md.
  - Title: the number and GTA 6 up front (for example "GTA 6 Sold X in 24 Hours"). Write the pinned question about the number.
- **Frame-0 hook (every Short).** Frame 0 shows the question or the number in 5 words or fewer, big and readable with the sound off. The answer or payoff is on screen by 2.0 s. Length is 20–30 s. The jury checks this (SAFE-EDIT jury checklist) and caps Hook at 6 if it fails.
- **After launch:** a queued or backlog film whose script says the game isn't out yet needs a hook remix or a fact re-check before it posts.

## Default format (Isac 2026-11-21)
Every Delta Short starts from `delta/VIDEO-PLAN.md` (§0 no-capture mode, §2–3 formats ranked by what gets views). **Footage is the format now:** pure-graphics Shorts stall near 1.2k views, while 9 of the top 10 GTA 6 Shorts show the game. So each new Short uses official Rockstar video (SAFE-EDIT rule 7, `gta-clip-short`) and/or clean creator clips Isac sent (rule 10), within the caps (creator clips ≤ 1/3, all outside footage ≤ 1/2, each clip < 5 s). Graphics-only is allowed only when no usable footage exists for the topic, and the run says why in BRIEF.md. Before picking, check `/mnt/project-files/delta/sources/` and the thread links Isac sent for unused footage.

## Read first
`delta/VIDEO-PLAN.md`, `delta/README.md`, `delta/SAFE-EDIT.md` (copyright rules, the jury checklist), `delta/BROAD-TOPICS.md`, `delta/backlog.csv`, `delta/analysis/` (post-mortem), `factory/LESSONS.md`, `factory/REPOST.md`, `.claude/skills/video-factory/SKILL.md`, and the agents in `.claude/agents/` (video-researcher, video-director, video-jury, video-seo). Run them as general-purpose agents told to follow their md file plus the SAFE-EDIT jury checklist. Run `bash factory/setup.sh` and let it finish (about 25 min) before `make.sh`.

## Branch
Run `git fetch origin`. Work on your session's branch, starting from main plus the newest unmerged Delta branch: merge any branch that holds `film/gta-*` work so nothing is lost. Open a normal PR (never a draft), or update the open Delta PR. When the run's commits are pushed, merge the PR yourself if it is conflict-free and no check failed (CLAUDE.md, "PRs merge themselves"); never leave it for Isac.

## Each run
1. **Queue first.** Check `delta/backlog.csv` for films already rendered that pass the gate (7.0+ overall, Truth 8.5+) and only need a fact re-check at the primary source today. Example on 2026-11-12: gta-origin is queued. gta-secrets needs a fresh jury first. Schedule the oldest one.
2. **Otherwise make one new Short.** Use trailer mode (SAFE-EDIT rule 7, built with the skill `gta-clip-short`: `delta/clips/clipkit.py` fetches and cuts official clips, make.sh lints them), own gameplay capture after Nov 19 (rule 8), or broad backlog rows with the pillars in BROAD-TOPICS.md, never two of the same pillar in a row.
   - Format: 25–40 s, 1080x1920, a hook anyone gets in 3 s.
   - Title and screen: GTA or GTA 6 in the title and on screen early.
   - Visuals: dense, more-graphical frames with one hero object per beat and type at least 36 px.
   - Voice: Ming US_James, no music.
   - Facts: every fact sourced in BRIEF.md, and rumors labeled.
   - Build: `factory/make.sh gta-<slug>` with WORKERS=2.
   - Jury: a fresh jury must give 7.0+ and Truth 8.5+ within 2 rounds. Apply its fixes even on a pass. If it fails, hold the film and try one simpler idea.
3. **Filler (first run of the ET day only).** Follow SKILL.md step 6b with `--channel delta`:
   - Pick: `repost.py candidates --channel delta`.
   - Make: a cut remix with a new opening line, title and cover. Check that the cut makes sense on its own.
   - Re-check facts: re-check each kept fact today. Prices, counts and pre-launch claims are listed in `factory/repost-meta.csv`. gta-preload expires on Nov 19.
   - Gate: `repost.py check <slug>-rN --channel delta --at "<09:00 ET in UTC>"` must pass.
   - After Nov 19: a filler whose script says the game isn't out yet needs a hook remix, not a cut.
4. **Packaging.** Write seo.md with:
   - A curiosity title that contains GTA or GTA 6.
   - A full description with sources, without angle-bracket characters.
   - 4–6 hashtags, never #ai.
   - A pinned-comment question.
   - The closing line "Made with our own graphics. Not affiliated with Rockstar Games or Take-Two.", or the trailer-clips line when clips are used.
5. **Gate and upload.**
   - Gate: `python3 factory/repost.py check gta-<slug> --channel delta --at "<slot UTC>"` must pass for every post, fresh or filler.
   - Upload: send `<slug>-vo.mp4` to Higgsfield (media_upload, curl PUT, media_confirm).
   - **Queue it for the PC (Isac 2026-11-14: "Always go, don't ask me. Make it automatic and seamless").** Never ask Isac for a go and never call start_remote_control for a post. Instead: `git fetch origin claude/delta-queue`, check out `delta/queue.json` from it (`git show origin/claude/delta-queue:delta/queue.json > delta/queue.json`, or start empty if the branch is missing), run `python3 delta/queue.py add gta-<slug> --url <Higgsfield URL> --slot "<slot UTC>"`, then commit only that file to `claude/delta-queue` (a worktree or `git commit` on that branch) and push it. The PC's scheduled task (`delta/PC-AUTOPOST.md`, every 2 h) uploads it, schedules it, writes back the video ID and posts the pinned question after go-live.
   - At the start of every run, read `origin/claude/delta-queue:delta/queue.json`: copy each new `youtube_id` into backlog.csv and posts.csv, and report any `failed` item to Isac in one line.
   - Before picking a slot, count `ready` and `scheduled` queue items as taken slots.
6. **PC instructions** (the PC task follows `delta/PC-AUTOPOST.md`; these are its rules).
   - FIRST switch to the channel **Delta (@deltaisac)** in YouTube Studio and confirm it.
   - Never change the name, banner or about text, and never touch existing videos.
   - Schedule in the slot that passed the gate (09:00 filler; 13:00, 19:00 or 23:00 ET fresh).
   - Settings: Altered content NO, not made for kids, English (US), Gaming.
   - Playlist: "GTA 6 Facts", "GTA History" or "Mysteries and Easter Eggs".
   - Paste the full title and description into the instructions.
   - The PC may post and pin question comments about 20 min after go-live without asking.
7. **Record.**
   - backlog.csv status and `factory/posts.csv` (slug, Delta, youtube, id, UTC time; a filler uses its `-rN` slug).
   - `python3 factory/repost.py snapshot gta-<slug>`.
   - The memory note `delta-gta6-channel.md`, kept under 2.8 KB.
   - Commit with the attribution lines, push, update the PR.
8. **Weekly** (first run on a Sunday): one wide long video (3–6 min, chapter cards), and a stats read: `python3 factory/stats.py --channel UCZXuxrznrR3EfHH5q17xSSA` gives views, likes and comments for every Delta Short. Add a dated table to `delta/analysis/STATS.md`, and add one line to the memory note on what rose or fell and why you think so.

## Rules
- English (US), with sourced facts.
- No AI tag.
- No leaks, endings or cutscene compilations.
- No Rockstar logo or key art as branding.
- No radio or trailer music.
- Claim nothing Rockstar hasn't said.
- Never post `film/gta-transition`.
- TikTok (Isac 2026-11-21): the PC also posts every queued Delta Short to the TikTok signed in on the PC (PC-AUTOPOST step 3b), never to @techexplained.daily; Delta and Tech, explained never mix.
- Never call tiktok_publish.
- If a previous run is still in progress, don't start a second video.

Summary to Isac in at most 6 lines: what was scheduled (title, slot, link) or held, the jury score, and the filler.
