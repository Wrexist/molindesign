#!/usr/bin/env python3
"""Public stats for every post in factory/posts.csv, no login and no PC needed.

YouTube: views, likes, comments via yt-dlp (pip install yt-dlp curl_cffi).
TikTok: plays, likes, shares and `indexEnabled` from the public video page.
`indexEnabled` missing = TikTok is not pushing the post to For You (every 0-view
post had it missing, every served post had it set; checked 2026-11-03).

  python3 factory/stats.py            # markdown table to stdout
  python3 factory/stats.py --csv      # csv to stdout
  python3 factory/stats.py --only incognito,voiceclone
"""
import csv, json, os, re, subprocess, sys, urllib.request
from datetime import datetime, timezone

ROOT = os.path.dirname(os.path.abspath(__file__))
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"


def youtube(vid):
    cmd = ["yt-dlp", "--impersonate", "chrome", "--skip-download", "--ignore-no-formats-error",
           "--extractor-args", "youtube:player_client=web_embedded",
           "--print", "%(view_count)s|%(like_count)s|%(comment_count)s",
           f"https://www.youtube.com/watch?v={vid}"]
    try:
        out = subprocess.run(cmd, capture_output=True, text=True, timeout=90).stdout.strip().splitlines()
        v, l, c = (out[-1].split("|") + ["", "", ""])[:3]
        return {"views": v, "likes": l, "comments": c, "served": ""}
    except Exception as e:  # network, not public yet, yt-dlp missing
        return {"views": "?", "likes": "", "comments": "", "served": f"error: {e.__class__.__name__}"}


def tiktok(vid):
    req = urllib.request.Request(f"https://www.tiktok.com/@techexplained.daily/video/{vid}", headers={"User-Agent": UA})
    try:
        html = urllib.request.urlopen(req, timeout=30).read().decode("utf8", "ignore")
        m = re.search(r'<script id="__UNIVERSAL_DATA_FOR_REHYDRATION__"[^>]*>(.*?)</script>', html, re.S)
        it = json.loads(m.group(1))["__DEFAULT_SCOPE__"]["webapp.video-detail"]["itemInfo"]["itemStruct"]
        s = it["stats"]
        return {"views": s["playCount"], "likes": s["diggCount"], "comments": s["commentCount"],
                "shares": s["shareCount"],
                "served": "yes" if it.get("indexEnabled") else "NO (not pushed to For You)",
                "ai_label": it.get("aigcLabelType", "")}
    except Exception as e:
        return {"views": "?", "likes": "", "comments": "", "served": f"error: {e.__class__.__name__}"}


def main():
    only = None
    if "--only" in sys.argv:
        only = set(sys.argv[sys.argv.index("--only") + 1].split(","))
    rows = list(csv.DictReader(open(os.path.join(ROOT, "posts.csv"), encoding="utf8")))
    out = []
    for r in rows:
        if only and r["slug"] not in only:
            continue
        s = youtube(r["id"]) if r["platform"] == "youtube" else tiktok(r["id"])
        out.append({**r, **s})
    now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    if "--csv" in sys.argv:
        w = csv.DictWriter(sys.stdout, fieldnames=list(out[0].keys()) + ["shares", "ai_label"], extrasaction="ignore")
        w.writeheader(); w.writerows(out); return
    print(f"Stats read {now}\n")
    print("| Video | Channel | Platform | Posted (UTC) | Length | Jury | Views | Likes | Comments | Served |")
    print("|---|---|---|---|---|---|---|---|---|---|")
    for r in out:
        print(f"| {r['slug']} | {r['channel']} | {r['platform']} | {r['posted_utc']} | {r['length_s']} s | {r['jury']} | {r['views']} | {r['likes']} | {r['comments']} | {r.get('served','')} |")


if __name__ == "__main__":
    main()
