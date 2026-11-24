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
from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
QUEUE = ROOT / "delta" / "queue.json"
QUEUE_BRANCH = "claude/delta-queue"
STATUSES = ("ready", "scheduled", "live", "commented", "failed")
ET = ZoneInfo("America/New_York")
# Isac 2026-11-24 ("upload a ton of videos a day"): 6 Shorts a day, 3 h apart (was 3-4 a day, 4 h apart).
# Why 6, not more: see delta/RUN.md "Volume". Long videos don't take a Shorts slot.
SLOTS_ET = (7, 10, 13, 16, 19, 22)
MIN_GAP_H = 3
MAX_PER_DAY = len(SLOTS_ET)


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
    title = (section(seo, "YouTube Shorts title") or section(seo, "Title")).splitlines()[0].strip()
    desc = section(seo, "Description")
    desc = re.sub(r"^```[a-z]*\n|\n?```$", "", desc).strip()  # long-video seo.md keeps it in a code block
    pinned = section(seo, "Pinned comment").splitlines()[0].strip()
    playlist = (section(seo, "Playlist") or "\n").splitlines()[0].strip()
    playlist = re.sub(r"\s*\(.*\)$", "", playlist)
    kw = section(seo, "Keywords")
    tags = [t.strip() for t in kw.splitlines()[0].split("·")] if kw else []
    if not tags and section(seo, "Tags"):
        tags = [t.strip() for t in section(seo, "Tags").splitlines()[0].split(",") if t.strip()]
    if "<" in desc or ">" in desc:
        sys.exit("description contains < or >; YouTube rejects it")
    if re.search(r"\bAI\b|#ai\b", title + desc, re.I):
        sys.exit("title/description mentions AI; Delta never does (no AI tag rule)")
    return dict(title=title, description=desc, pinned_comment=pinned,
                playlist=playlist or "GTA 6 Facts", tags=tags)


def taken(q):
    """Slots (UTC datetimes) held by Shorts that are queued, scheduled or already out."""
    out = []
    for i in q["items"]:
        if i.get("kind", "short") != "short" or i["status"] == "failed":
            continue
        out.append(datetime.strptime(i["slot_utc"], "%Y-%m-%d %H:%M").replace(tzinfo=timezone.utc))
    return out


def next_slot(q, after=None, skip=None):
    """Earliest SLOTS_ET slot at least 30 min from now (or after `after`), MIN_GAP_H from every taken
    Shorts slot and under MAX_PER_DAY Shorts that ET day."""
    now = after or datetime.now(timezone.utc) + timedelta(minutes=30)
    busy = [t for t in taken(q) if t != skip]
    day = now.astimezone(ET).date()
    for d in range(60):
        date = day + timedelta(days=d)
        same_day = sum(1 for t in busy if t.astimezone(ET).date() == date)
        for h in SLOTS_ET:
            t = datetime(date.year, date.month, date.day, h, tzinfo=ET).astimezone(timezone.utc)
            if t < now or same_day >= MAX_PER_DAY:
                continue
            if all(abs((t - b).total_seconds()) >= MIN_GAP_H * 3600 - 60 for b in busy):
                return t
    sys.exit("no free slot in 60 days")


def cmd_next_slot(a):
    print(next_slot(load()).strftime("%Y-%m-%d %H:%M"))


def cmd_reslot(a):
    """Give every `ready` Short whose slot is past or under 30 min away the next free slot, oldest first.
    The PC tick runs this before uploading (PC-AUTOPOST step 2b)."""
    q = load()
    soon = datetime.now(timezone.utc) + timedelta(minutes=30)
    late = [i for i in q["items"] if i["status"] == "ready" and i.get("kind", "short") == "short"
            and datetime.strptime(i["slot_utc"], "%Y-%m-%d %H:%M").replace(tzinfo=timezone.utc) < soon]
    for i in sorted(late, key=lambda i: i["slot_utc"]):
        old = i["slot_utc"]
        i["slot_utc"] = "9999-01-01 00:00"  # take it out of the busy list while picking
        t = next_slot(q)
        i["slot_utc"] = t.strftime("%Y-%m-%d %H:%M")
        i["note"] = (f"Re-slotted {old} UTC -> {i['slot_utc']} UTC ({t.astimezone(ET):%a %b %d %H:%M} ET). " + i.get("note", "")).strip()
        print(f"{i['slug']:20} {old} -> {i['slot_utc']} UTC")
    save(q)


def cmd_add(a):
    q = load()
    if any(i["slug"] == a.slug and i["status"] != "failed" for i in q["items"]):
        sys.exit(f"{a.slug} is already queued")
    if a.slot == "next":
        slot = next_slot(q) if not a.long else datetime.now(timezone.utc) + timedelta(hours=1)
    else:
        slot = datetime.strptime(a.slot, "%Y-%m-%d %H:%M").replace(tzinfo=timezone.utc)
    if not a.long:
        same = [t for t in taken(q) if abs((t - slot).total_seconds()) < MIN_GAP_H * 3600 - 60]
        if same:
            sys.exit(f"slot {slot:%Y-%m-%d %H:%M} UTC is under {MIN_GAP_H} h from another Delta Short; try --slot next")
    seo = from_seo(a.slug)
    if a.playlist:
        seo["playlist"] = a.playlist
    item = dict(slug=a.slug, kind="long" if a.long else "short", channel="Delta (@deltaisac)", video_url=a.url,
                slot_utc=slot.strftime("%Y-%m-%d %H:%M"), status="ready",
                youtube_id="", note="", added=datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M"),
                altered_content="No", made_for_kids="No", language="English (US)",
                category="Gaming", **seo)
    if a.thumbnail:
        item["thumbnail_url"] = a.thumbnail
    if a.long or a.no_tiktok:  # long videos never go to TikTok (Isac 2026-11-23)
        item.update(tiktok_status="skipped", tiktok_note="long video: YouTube only" if a.long else "YouTube only")
    else:
        item.update(tiktok_status="ready", tiktok_note="")
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
            if a.tiktok_status:
                i["tiktok_status"] = a.tiktok_status
            if a.tiktok_note:
                i["tiktok_note"] = a.tiktok_note
            save(q)
            print(json.dumps(i, ensure_ascii=False)[:300])
            return
    sys.exit(f"{a.slug} not in queue")


def cmd_list(_):
    for i in load()["items"]:
        print(f"{i['slug']:20} {i.get('kind', 'short'):5} {i['status']:10} {i['slot_utc']} UTC  {i['youtube_id'] or '-':12} TT:{i.get('tiktok_status', '-'):9} {i['note'][:50]}")


p = argparse.ArgumentParser()
sp = p.add_subparsers(dest="cmd", required=True)
x = sp.add_parser("add"); x.add_argument("slug"); x.add_argument("--url", required=True, help="public mp4 URL, or a path on the PC"); x.add_argument("--slot", required=True, help="UTC 'YYYY-MM-DD HH:MM', or 'next' for the next free Shorts slot")
x.add_argument("--long", action="store_true", help="regular 16:9 video, not a Short: no TikTok, no Shorts slot"); x.add_argument("--thumbnail", help="custom thumbnail URL or PC path"); x.add_argument("--playlist", help="override seo.md's playlist"); x.add_argument("--no-tiktok", action="store_true"); x.set_defaults(f=cmd_add)
x = sp.add_parser("next-slot", help="print the next free Shorts slot (UTC)"); x.set_defaults(f=cmd_next_slot)
x = sp.add_parser("reslot", help="move past-due ready Shorts to the next free slots"); x.set_defaults(f=cmd_reslot)
x = sp.add_parser("set"); x.add_argument("slug"); x.add_argument("--status", choices=STATUSES); x.add_argument("--youtube-id"); x.add_argument("--note"); x.add_argument("--tiktok-status", choices=["ready", "scheduled", "posted", "skipped", "failed"], help="TikTok copy (Isac 2026-11-21: post on the TikTok logged in on the PC)"); x.add_argument("--tiktok-note"); x.set_defaults(f=cmd_set)
x = sp.add_parser("list"); x.set_defaults(f=cmd_list)
a = p.parse_args()
a.f(a)
