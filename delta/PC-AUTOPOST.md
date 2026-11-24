# Delta autopost on the PC (Isac 2026-11-14: "Always go, don't ask me. Make it automatic and seamless")

The cloud run can't start the PC without a fresh message from Isac in its own thread. So the PC pulls the work itself: cloud runs push finished Shorts to a queue, and a scheduled task on the PC (Phantomen) schedules them.

## The queue
- File `delta/queue.json` on branch **`claude/delta-queue`** of github.com/Wrexist/molindesign.
- The cloud run writes it with `python3 delta/queue.py add <slug> --url <Higgsfield mp4 URL> --slot "<UTC>"` (title, description, tags, playlist and pinned comment come from `film/<slug>/seo.md`), then commits and pushes that branch.
- Statuses: `ready` → `scheduled` (PC uploaded it, `youtube_id` set) → `commented` (question comment posted and pinned after go-live). `failed` with a `note` if something went wrong.

## The PC task (Windows Task Scheduler, every 2 hours)
Runs in `D:\Projects\Website Factory - Molin Design` (a clone of the repo):

```
claude -p "Follow delta/PC-AUTOPOST.md section 'Each tick' exactly." --permission-mode acceptEdits
```

### Each tick
1. Work in a separate worktree so the main folder's branch and files are never touched: `git fetch origin claude/delta-queue`; if `D:\Projects\delta-queue` doesn't exist, `git worktree add D:\Projects\delta-queue origin/claude/delta-queue`; then in that folder `git checkout -B claude/delta-queue origin/claude/delta-queue`. Do steps 2-6 there. If the branch doesn't exist, stop.
2. Read `delta/queue.json`. Nothing `ready` and nothing `scheduled` → stop.
2b. **Re-slot first (Isac 2026-11-24: 6 Shorts a day).** Run `python3 delta/queue.py reslot`. It moves every `ready` Short whose slot is past or under 30 minutes away to the next free slot of 07:00, 10:00, 13:00, 16:00, 19:00 or 22:00 ET, at least 3 hours from any other Delta Short, at most 6 a day, oldest first. Use the slots it writes; don't pick slots by hand.
3. For each `ready` item whose `kind` is `short` (or missing):
   - Open YouTube Studio. **FIRST switch to the channel Delta (@deltaisac, about 161k subscribers) and confirm the name on screen.** Never Tech, explained. Never change the channel name, banner or about text, never touch existing videos.
   - Schedule it at its `slot_utc` (step 2b already fixed past-due slots).
   - Download `video_url`, upload it as a Short, schedule it at the slot. Use `title`, `description`, `tags`, `playlist` (create the playlist if missing) exactly as given. Altered or synthetic content **No**, made for kids **No**, English (US), Gaming.
   - Run `python3 delta/queue.py set <slug> --status scheduled --youtube-id <id> --note "<scheduled ET time>"`.
3a. **Long videos** (`kind` is `long`, Isac 2026-11-23): for each `ready` long item:
   - Same channel check as step 3 (Delta, @deltaisac, confirm the name on screen).
   - `video_url` may be a path on this PC (for example `D:\Projects\Website Factory - Molin Design\delta-uploads\<slug>\<slug>-vo.mp4`); use the file directly. Upload it as a **regular video** (16:9, not a Short) with `title`, `description` (it holds the chapter list; keep every line), `tags`, playlist `playlist` (create it if missing).
   - Custom thumbnail: upload `thumbnail_url` (also a PC path). If Studio says custom thumbnails need a verified account, go on without it and put "thumbnail blocked: phone verification" in the note.
   - Altered content No, made for kids No, English (US), Gaming. Schedule it at `slot_utc`; if that is past or under 30 minutes away, publish it as public now.
   - Never post a long video to TikTok (its `tiktok_status` is `skipped`).
   - `queue.py set <slug> --status scheduled --youtube-id <id> --note "<scheduled ET time, thumbnail set or not>"`.
3b. **TikTok (Isac 2026-11-21: "a couple videos a day on TikTok and yt … whatever you can use, what is logged in right now").** For each item whose `status` is `ready` or `scheduled`, whose `tiktok_status` is missing or `ready`, and whose `slot_utc` is in the future:
   - Open https://www.tiktok.com/tiktokstudio/upload in Chrome and read which account is signed in (the handle in the corner / profile menu).
   - **If it is @techexplained.daily (Tech, explained), post nothing**: `queue.py set <slug> --tiktok-status skipped --tiktok-note "signed-in TikTok is Tech, explained; Delta and Tech, explained never mix"` once per tick for every such item, and stop TikTok for this tick. Any other account: use it, and write its handle in the note.
   - Upload `video_url`. Caption: `title`, then a blank line, then the hashtags from the end of `description` (at most 5, never #ai). Schedule it at `slot_utc` (TikTok's scheduler; if the slot is under 20 minutes away, post now). AI-generated content label **off**, comments on, duet/stitch on. Don't add a sound in the web uploader (the film has voice and effects; Isac adds trending sounds in the app if he wants).
   - `queue.py set <slug> --tiktok-status scheduled --tiktok-note "@<handle> <scheduled ET time>"`. On an error: `--tiktok-status failed --tiktok-note "<what happened>"` and go on.
   - Skip items whose `kind` is `long`.
   - At most 6 TikTok posts per ET day, at least 3 hours apart (the same slots as YouTube).
4. For each `scheduled` item whose slot passed at least 20 minutes ago: open the Short on the Delta channel, post `pinned_comment` and pin it (standing approval, Isac 2026-11-04), then `queue.py set <slug> --status commented`.
5. On any error: `queue.py set <slug> --status failed --note "<what happened>"` and go on with the next item.
6. Commit `delta/queue.json` ("Delta queue: PC tick <UTC time>") and `git push origin claude/delta-queue`.

Rules: never call tiktok_publish (TikTok goes through the browser uploader in step 3b only); never post `film/gta-transition`; never post the same slug twice.

## Setup (once, on the PC)
Task Scheduler → Create Task "Delta autopost": trigger daily, repeat every 2 hours indefinitely; action `cmd /c cd /d "D:\Projects\Website Factory - Molin Design" && claude -p "Follow delta/PC-AUTOPOST.md section 'Each tick' exactly." --permission-mode acceptEdits >> delta-autopost.log 2>&1`; "Run only when user is logged on" (Chrome and YouTube Studio need the signed-in session).

## As installed on Phantomen (2026-11-14)
- `D:\Projects\delta-queue` is a sparse clone (only `delta/`) on `claude/delta-queue`, not a worktree.
- The task runs `D:\Projects\delta-autopost.cmd`: `git pull`, then `claude -p ... --chrome --permission-mode acceptEdits --allowedTools "Bash(git *)" "Bash(python3 *)" "Bash(curl *)" "Bash(mkdir *)" "Bash(rm *)" "mcp__claude-in-chrome"`. Without `--allowedTools`, a `-p` run silently denies git/python/curl and the Chrome tools. Log: `D:\Projects\delta-autopost.log`.
- Created by `D:\Projects\setup-delta-autopost-task.ps1` (Isac runs it once; Windows blocked creating it remotely). Every 2 h from the next full hour, only while logged on, no overlap, 1 h limit.
- Needs: the Claude CLI signed in (`claude` then `/login`), and Chrome open and signed in to YouTube Studio as Delta.
