# Delta run (what each scheduled Delta run does)

The scheduled task "Delta GTA daily run" fires 3 times a day (08:17, 14:17, 20:17 Stockholm) and follows this file. Change the procedure here, not in the task's prompt.

**Volume (Isac 2026-11-12: "pump more videos a day out on Delta with GTA content, use GTA media"):** up to **3 fresh Shorts a day** at 13:00, 19:00 and 23:00 ET, plus **1 filler** at 09:00 ET (a remix of an older Delta Short, `factory/REPOST.md`). Each run makes or schedules one fresh Short. The first run of the ET day also does the filler.

## Read first
`delta/README.md`, `delta/SAFE-EDIT.md` (copyright rules, the jury checklist), `delta/BROAD-TOPICS.md`, `delta/backlog.csv`, `delta/analysis/` (post-mortem), `factory/LESSONS.md`, `factory/REPOST.md`, `.claude/skills/video-factory/SKILL.md`, and the agents in `.claude/agents/` (video-researcher, video-director, video-jury, video-seo). Run them as general-purpose agents told to follow their md file plus the SAFE-EDIT jury checklist. Run `bash factory/setup.sh` and let it finish (about 25 min) before `make.sh`.

## Branch
Run `git fetch origin`. Work on your session's branch, starting from main plus the newest unmerged Delta branch: merge any branch that holds `film/gta-*` work so nothing is lost. Open a draft PR, or update the open Delta PR.

## Each run
1. **Queue first.** Check `delta/backlog.csv` for films already rendered that pass the gate (7.0+ overall, Truth 8.5+) and only need a fact re-check at the primary source today. Example on 2026-11-12: gta-origin is queued. gta-secrets needs a fresh jury first. Schedule the oldest one.
2. **Otherwise make one new Short.** Use trailer mode (SAFE-EDIT rule 7), own gameplay capture after Nov 19 (rule 8), or broad backlog rows with the pillars in BROAD-TOPICS.md, never two of the same pillar in a row.
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
   - Start the PC: `start_remote_control`, folder `D:\Projects\Website Factory - Molin Design`, with the newest message Isac wrote in the run's own thread (his standing go is in team memory `delta-gta6-channel`).
   - If the PC refuses: say so once and leave the video queued with its Higgsfield URL in backlog.csv.
6. **PC instructions.**
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
8. **Weekly** (first run on a Sunday): one wide long video (3–6 min, chapter cards).

## Rules
- English (US), with sourced facts.
- No AI tag.
- No leaks, endings or cutscene compilations.
- No Rockstar logo or key art as branding.
- No radio or trailer music.
- Claim nothing Rockstar hasn't said.
- Never post `film/gta-transition`.
- TikTok is paused for Delta, and the channels never mix.
- Never call tiktok_publish.
- If a previous run is still in progress, don't start a second video.

Summary to Isac in at most 6 lines: what was scheduled (title, slot, link) or held, the jury score, and the filler.
