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
3. For each `ready` item:
   - Open YouTube Studio. **FIRST switch to the channel Delta (@deltaisac, about 161k subscribers) and confirm the name on screen.** Never Tech, explained. Never change the channel name, banner or about text, never touch existing videos.
   - If its `slot_utc` is less than 30 minutes away or past, use the next free 13:00, 19:00 or 23:00 ET slot at least 4 hours from any other Delta post, and note the change.
   - Download `video_url`, upload it as a Short, schedule it at the slot. Use `title`, `description`, `tags`, `playlist` (create the playlist if missing) exactly as given. Altered or synthetic content **No**, made for kids **No**, English (US), Gaming.
   - Run `python3 delta/queue.py set <slug> --status scheduled --youtube-id <id> --note "<scheduled ET time>"`.
4. For each `scheduled` item whose slot passed at least 20 minutes ago: open the Short on the Delta channel, post `pinned_comment` and pin it (standing approval, Isac 2026-11-04), then `queue.py set <slug> --status commented`.
5. On any error: `queue.py set <slug> --status failed --note "<what happened>"` and go on with the next item.
6. Commit `delta/queue.json` ("Delta queue: PC tick <UTC time>") and `git push origin claude/delta-queue`.

Rules: never call tiktok_publish or post to TikTok; never post `film/gta-transition`; never post the same slug twice.

## Setup (once, on the PC)
Task Scheduler → Create Task "Delta autopost": trigger daily, repeat every 2 hours indefinitely; action `cmd /c cd /d "D:\Projects\Website Factory - Molin Design" && claude -p "Follow delta/PC-AUTOPOST.md section 'Each tick' exactly." --permission-mode acceptEdits >> delta-autopost.log 2>&1`; "Run only when user is logged on" (Chrome and YouTube Studio need the signed-in session).
