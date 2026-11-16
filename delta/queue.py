#!/usr/bin/env python3
"""Delta autopost queue: the cloud run adds a finished Short, the PC schedules it.

Why: the cloud can only start Isac's PC from a message he writes in the run's
own thread, so every run had to ask him for a "go". Instead, runs push the
upload job to a queue file on a fixed branch, and a scheduled task on the PC
(delta/PC-AUTOPOST.md) picks it up, schedules it on YouTube and writes the
video ID back. No message from Isac is needed.

Queue: delta/queue.json on branch QUEUE_BRANCH (only that file lives there
in practice; it is a normal repo branch).

  python3 delta/queue.py add gta-stars --url https://...mp4 --slot "2026-11-15 18:00"
  python3 delta/queue.py list
  python3 delta/queue.py set gta-stars --status scheduled --youtube-id abc123
"""
import argparse
import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
QUEUE = ROOT / "delta" / "queue.json"
QUEUE_BRANCH = "claude/delta-queue"
STATUSES = ("ready", "scheduled", "live", "commented", "failed")


def load():
    if QUEUE.exists():
        return json.loads(QUEUE.read_text(encoding="utf-8"))
    return {"branch": QUEUE_BRANCH, "items": []}


def save(q):
    QUEUE.write_text(json.dumps(q, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def section(md, name):
    """Text under the first '## <name>...' heading, up to the next '## '."""
    m = re.search(r"^## " + re.escape(name) + r"[^\n]*\n(.*?)(?=^## |\Z)", md, re.S | re.M)
    return m.group(1).strip() if m else ""


def from_seo(slug):
    seo = (ROOT / "film" / slug / "seo.md").read_text(encoding="utf-8")
    title = section(seo, "YouTube Shorts title").splitlines()[0].strip()
    desc = section(seo, "Description")
    pinned = section(seo, "Pinned comment").splitlines()[0].strip()
    playlist = section(seo, "Playlist").splitlines()[0].strip()
    playlist = re.sub(r"\s*\(.*\)$", "", playlist)
    kw = section(seo, "Keywords")
    tags = [t.strip() for t in kw.splitlines()[0].split("·")] if kw else []
    if "<" in desc or ">" in desc:
        sys.exit("description contains < or >; YouTube rejects it")
    if re.search(r"\bAI\b|#ai\b", title + desc, re.I):
        sys.exit("title/description mentions AI; Delta never does (no AI tag rule)")
    return dict(title=title, description=desc, pinned_comment=pinned,
                playlist=playlist or "GTA 6 Facts", tags=tags)


def cmd_add(a):
    slot = datetime.strptime(a.slot, "%Y-%m-%d %H:%M").replace(tzinfo=timezone.utc)
    q = load()
    if any(i["slug"] == a.slug and i["status"] != "failed" for i in q["items"]):
        sys.exit(f"{a.slug} is already queued")
    item = dict(slug=a.slug, channel="Delta (@deltaisac)", video_url=a.url,
                slot_utc=slot.strftime("%Y-%m-%d %H:%M"), status="ready",
                youtube_id="", note="", added=datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M"),
                altered_content="No", made_for_kids="No", language="English (US)",
                category="Gaming", **from_seo(a.slug))
    q["items"].append(item)
    save(q)
    print(f"queued {a.slug} for {item['slot_utc']} UTC: {item['title']}")


def cmd_set(a):
    q = load()
    for i in q["items"]:
        if i["slug"] == a.slug:
            if a.status:
                i["status"] = a.status
            if a.youtube_id:
                i["youtube_id"] = a.youtube_id
            if a.note:
                i["note"] = a.note
            save(q)
            print(json.dumps(i, ensure_ascii=False)[:300])
            return
    sys.exit(f"{a.slug} not in queue")


def cmd_list(_):
    for i in load()["items"]:
        print(f"{i['slug']:20} {i['status']:10} {i['slot_utc']} UTC  {i['youtube_id'] or '-':12} {i['note'][:60]}")


p = argparse.ArgumentParser()
sp = p.add_subparsers(dest="cmd", required=True)
x = sp.add_parser("add"); x.add_argument("slug"); x.add_argument("--url", required=True); x.add_argument("--slot", required=True, help="UTC, 'YYYY-MM-DD HH:MM'"); x.set_defaults(f=cmd_add)
x = sp.add_parser("set"); x.add_argument("slug"); x.add_argument("--status", choices=STATUSES); x.add_argument("--youtube-id"); x.add_argument("--note"); x.set_defaults(f=cmd_set)
x = sp.add_parser("list"); x.set_defaults(f=cmd_list)
a = p.parse_args()
a.f(a)
