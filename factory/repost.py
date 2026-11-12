#!/usr/bin/env python3
"""Archive every factory/Delta video and gate remixed "filler" reposts.

Rules: factory/REPOST.md. Stdlib only (plus git and ffmpeg on PATH).

  python3 factory/repost.py inventory [--write]      # what exists, what's missing (writes factory/ARCHIVE.csv)
  python3 factory/repost.py snapshot [slug ...]      # film/<slug> source tarball → /mnt/project-files/archive/<slug>/
  python3 factory/repost.py candidates [--channel delta|tech]   # sources that may get a filler now, oldest post first
  python3 factory/repost.py remix <slug> --kind cut --from <line> [--to <line>]   # re-cut existing mp4s, no render
  python3 factory/repost.py remix <slug> --kind hook   # copy the film source to film/<slug>-rN/ for a new hook + re-render
  python3 factory/repost.py check <slug> --platform youtube --at "2026-11-14 18:00"   # the gate; exit 1 on any FAIL

Every post is read from factory/posts.csv on EVERY origin branch plus factory/posts-backfill.csv,
because main lags the open PRs. A remix is a folder film/<source>-r<N>/ with a remix.json.
"""
import argparse, csv, io, json, os, re, shutil, subprocess, sys, tarfile
from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PF = "/mnt/project-files"
ET = ZoneInfo("America/New_York")
UTC = timezone.utc

# ---- rules (keep in step with factory/REPOST.md) -------------------------------------------
COOLDOWN_DAYS = 7          # R1 (Isac 2026-11-12): same video, same channel + platform, not within 7 days
FIRST_RUN_DAYS = 7         # R2: the original gets a full week before any remix of it goes up
MAX_REMIXES = 3            # R5: per source per channel + platform, lifetime
MAX_POSTS_PER_ET_DAY = {"tech": 3, "delta": 4}   # R6: per channel + platform, fresh + fillers (Delta: 3 fresh + 1 filler, Isac 2026-11-12)
MAX_FILLERS_PER_ET_DAY = 1 # R6
MIN_GAP_HOURS = 4          # R6: between any two posts on one channel + platform
FILLER_SHARE_7D = 0.5      # R7: fillers at most half of a channel's posts in any trailing 7 days (fresh first)
CUT_MIN_CHANGE = 0.20      # R4: a cut must change the length by at least 20 %
FACTS_FRESH_DAYS = 2       # R9: time-bound scripts need facts re-checked within 2 days of the slot
TIKTOK_FILLERS = False     # R8: no fillers on TikTok (account held since Oct 27; TikTok demotes reposts)

NOT_VIDEOS = {"fonts", "kit", "out", "tools", "vo", "math"}
NEVER_POST = {"gta-transition"}
TIME_WORDS = re.compile(r"\b(today|tonight|tomorrow|yesterday|this (week|month|year)|last (week|month|year)|next (week|month)|"
                        r"right now|currently|days? (left|away|until)|pre-?load|(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]* \d{1,2}\b|"
                        r"\$\d|price|costs?\b|\d+ (million|billion)|record)", re.I)


def git(*a, check=True):
    r = subprocess.run(["git", "-C", ROOT, *a], capture_output=True, text=True)
    if check and r.returncode:
        raise RuntimeError(f"git {' '.join(a)}: {r.stderr.strip()}")
    return r.stdout


def git_bytes(*a):
    return subprocess.run(["git", "-C", ROOT, *a], capture_output=True).stdout


def refs():
    out = git("for-each-ref", "--format=%(refname:short)", "refs/remotes/origin").split()
    return [r for r in out if not r.endswith("/HEAD")] or ["HEAD"]


def channel_of(slug):
    return "delta" if source_of(slug).startswith("gta-") else "tech"


def source_of(slug):
    m = re.match(r"^(.*)-r(\d+)$", slug)
    return m.group(1) if m else slug


def parse_time(s):
    s = (s or "").strip()
    for fmt in ("%Y-%m-%d %H:%M", "%Y-%m-%d"):
        try:
            return datetime.strptime(s, fmt).replace(tzinfo=UTC)
        except ValueError:
            pass
    return None


# ---- sources -------------------------------------------------------------------------------
_best = None


def best_sources():
    """slug → (ref, commit, date): the branch whose last commit touching film/<slug> is newest."""
    global _best
    if _best is not None:
        return _best
    best = {}
    for ref in refs() + ["HEAD"]:
        for slug in git("ls-tree", "-d", "--name-only", ref, "film/", check=False).split():
            slug = slug.split("/", 1)[1]
            if slug in NOT_VIDEOS:
                continue
            line = git("log", "-1", "--format=%ct %h", ref, "--", f"film/{slug}", check=False).strip()
            if not line:
                continue
            t, h = line.split()
            if slug not in best or int(t) > best[slug][2]:
                best[slug] = (ref, h, int(t))
    _best = {k: (r, h, datetime.fromtimestamp(t, UTC).strftime("%Y-%m-%d")) for k, (r, h, t) in best.items()}
    return _best


def source_files(slug):
    ref, commit, _ = best_sources()[slug]
    return set(git("ls-tree", "-r", "--name-only", commit, f"film/{slug}", check=False).split())


def read_at(commit, path):
    return git("show", f"{commit}:{path}", check=False)


# ---- media ---------------------------------------------------------------------------------
def media(slug):
    """Rendered files in the project folder: {'vo': path, 'voice': path}."""
    dirs = [f"{PF}/factory/{slug}", f"{PF}/longform/{slug}"]
    if slug == "nextword":
        dirs.append(f"{PF}/next-word")
    found = {}
    for d in dirs:
        if not os.path.isdir(d):
            continue
        for f in sorted(os.listdir(d)):
            p = os.path.join(d, f)
            if f.endswith("-voice-only.mp4"):
                found.setdefault("voice", p)
            elif f.endswith("-vo.mp4"):
                found.setdefault("vo", p)
    return found


# ---- posts ---------------------------------------------------------------------------------
def posts():
    """Union of posts.csv on every branch + the working tree + posts-backfill.csv, deduped by platform+id."""
    texts = [read_at(r, "factory/posts.csv") for r in refs()]
    for local in ("factory/posts.csv", "factory/posts-backfill.csv"):
        p = os.path.join(ROOT, local)
        if os.path.exists(p):
            texts.append(open(p, encoding="utf8").read())
    seen, rows = set(), []
    for t in texts:
        for r in csv.DictReader(io.StringIO(t)):
            if not r.get("id") or (r["platform"], r["id"]) in seen:
                continue
            seen.add((r["platform"], r["id"]))
            r["when"] = parse_time(r.get("posted_utc"))
            r["channel_key"] = "delta" if r.get("channel", "").lower().startswith("delta") else "tech"
            r["source"] = source_of(r["slug"])
            r["filler"] = r["slug"] != r["source"]
            rows.append(r)
    return sorted(rows, key=lambda r: r["when"] or datetime.min.replace(tzinfo=UTC))


def remix_meta(slug):
    p = os.path.join(ROOT, "film", slug, "remix.json")
    if os.path.exists(p):
        return json.load(open(p, encoding="utf8"))
    for ref in refs():
        t = read_at(ref, f"film/{slug}/remix.json")
        if t:
            return json.loads(t)
    return None


def remixes_of(source):
    names = set()
    for d in os.listdir(os.path.join(ROOT, "film")):
        if source_of(d) == source and d != source:
            names.add(d)
    for ref in refs():
        for d in git("ls-tree", "-d", "--name-only", ref, "film/", check=False).split():
            d = d.split("/", 1)[1]
            if source_of(d) == source and d != source:
                names.add(d)
    return sorted(names, key=lambda s: int(s.rsplit("-r", 1)[1]))


def meta():
    p = os.path.join(ROOT, "factory", "repost-meta.csv")
    return {r["slug"]: r for r in csv.DictReader(open(p, encoding="utf8"))} if os.path.exists(p) else {}


def script_lines(slug):
    """[(id, text)] from vo/script.json at the best source (or the working tree for a remix)."""
    local = os.path.join(ROOT, "film", slug, "vo", "script.json")
    if os.path.exists(local):
        data = json.load(open(local, encoding="utf8"))
    else:
        if slug not in best_sources():
            return []
        t = read_at(best_sources()[slug][1], f"film/{slug}/vo/script.json")
        data = json.loads(t) if t else {"lines": []}
    return [(l.get("id", str(i)), l.get("text", "")) for i, l in enumerate(data.get("lines", []))]


def vo_timings(slug):
    """Line timings from vo/vo.js (written by voiceover.py): [{id, t0, t1, text}]."""
    t = read_at(best_sources()[slug][1], f"film/{slug}/vo/vo.js")
    m = re.search(r"window\.VO\s*=\s*(\{.*\})\s*;?\s*$", t, re.S)
    if not m:
        raise SystemExit(f"no vo/vo.js timings for {slug}")
    return json.loads(m.group(1))


def duration(path):
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path],
                         capture_output=True, text=True).stdout.strip()
    return float(out or 0)


# ---- commands ------------------------------------------------------------------------------
def cmd_inventory(a):
    ps, mt, rows = posts(), meta(), []
    for slug, (ref, commit, date) in sorted(best_sources().items()):
        if re.search(r"-r\d+$", slug):
            continue
        files = source_files(slug)
        has = lambda suffix: any(f.endswith(suffix) for f in files)
        mine = [p for p in ps if p["source"] == slug]
        orig = [p for p in mine if not p["filler"]]
        m = media(slug)
        on_main = not git("diff", "--name-only", "origin/main", commit, "--", f"film/{slug}", check=False).strip()
        status = "never-post" if slug in NEVER_POST else ("posted" if orig else "unposted")
        rows.append({
            "slug": slug, "channel": channel_of(slug), "status": status,
            "posts": ";".join(sorted({f"{p['platform']}:{p['id']}" for p in orig})),
            "first_posted": orig[0]["posted_utc"] if orig else "",
            "fillers": len([p for p in mine if p["filler"]]),
            "last_posted": mine[-1]["posted_utc"] if mine else "",
            "source_branch": ref.replace("origin/", ""), "commit": commit, "source_date": date,
            "on_main": "yes" if on_main else "no",
            "film_js": "yes" if has("/film.js") else "MISSING",
            "script": "yes" if has("/vo/script.json") else "MISSING",
            "vo_audio": "yes" if any(f.endswith(".mp3") and "/vo/" in f for f in files) else "MISSING",
            "timings": "yes" if has("/vo/vo.js") else "MISSING",
            "seo": "yes" if has("/seo.md") or has("/seo.json") else "-",
            "mp4_vo": os.path.relpath(m["vo"], PF) if "vo" in m else "MISSING",
            "mp4_voice_only": os.path.relpath(m["voice"], PF) if "voice" in m else "-",
            "snapshot": "yes" if os.path.isdir(f"{PF}/archive/{slug}") and os.listdir(f"{PF}/archive/{slug}") else "no",
            "expires": mt.get(slug, {}).get("expires", ""),
            "note": mt.get(slug, {}).get("note", ""),
        })
    if a.write:
        with open(os.path.join(ROOT, "factory", "ARCHIVE.csv"), "w", newline="", encoding="utf8") as f:
            w = csv.DictWriter(f, fieldnames=list(rows[0]))
            w.writeheader()
            w.writerows(rows)
    posted = [r for r in rows if r["status"] == "posted"]
    print(f"{len(rows)} films, {len(posted)} posted, {sum(r['status'] == 'unposted' for r in rows)} never posted")
    gaps = 0
    for r in rows:
        miss = [k for k in ("film_js", "script", "vo_audio", "timings", "mp4_vo") if r[k] == "MISSING"]
        if r["on_main"] == "no":
            miss.append(f"source only on {r['source_branch']} (not on main yet)")
        if r["status"] == "posted" and miss:
            gaps += 1
            print(f"  {r['slug']:<18} {', '.join(miss)}")
    print(f"{gaps} posted films with a gap" if gaps else "every posted film has source and render")
    return 0


def cmd_snapshot(a):
    slugs = a.slugs or [s for s in best_sources() if s not in NOT_VIDEOS]
    for slug in slugs:
        if slug not in best_sources():
            print(f"skip {slug}: no film/{slug} on any branch")
            continue
        ref, commit, _ = best_sources()[slug]
        d = f"{PF}/archive/{slug}"
        out = f"{d}/source-{commit}.tar.gz"
        if os.path.exists(out):
            continue
        os.makedirs(d, exist_ok=True)
        data = git_bytes("archive", "--format=tar.gz", commit, f"film/{slug}")
        open(out, "wb").write(data)
        json.dump({"slug": slug, "branch": ref, "commit": commit, "saved": datetime.now(UTC).isoformat(timespec="seconds"),
                   "renders": media(slug), "restore": f"tar -xzf {os.path.basename(out)} -C <repo>  (needs film/kit, film/tools, film/fonts from main)"},
                  open(f"{d}/MANIFEST.json", "w"), indent=1)
        print(f"saved {out} ({len(data) // 1024} KB)")
    return 0


def next_remix_name(source):
    taken = remixes_of(source)
    n = max([int(s.rsplit("-r", 1)[1]) for s in taken] + [0]) + 1
    return f"{source}-r{n}"


def cmd_remix(a):
    src = a.slug
    if src not in best_sources():
        raise SystemExit(f"no film/{src} on any branch")
    if src in NEVER_POST:
        raise SystemExit(f"{src} is never posted (rule R10)")
    name = next_remix_name(src)
    ref, commit, _ = best_sources()[src]
    dest = os.path.join(ROOT, "film", name)
    info = {"source": src, "source_commit": commit, "kind": a.kind, "created": datetime.now(UTC).strftime("%Y-%m-%d"),
            "hook": "", "title": "", "cover": "", "facts_checked": "", "notes": ""}
    if a.kind == "hook":
        # Full source copy for a new opening: re-voice the first line, rebuild the first 2 s, re-render with make.sh.
        tar = git_bytes("archive", "--format=tar", commit, f"film/{src}")
        with tarfile.open(fileobj=io.BytesIO(tar)) as t:
            for m in t.getmembers():
                m.name = m.name.replace(f"film/{src}", f"film/{name}", 1)
                t.extract(m, ROOT, filter="data") if sys.version_info >= (3, 12) else t.extract(m, ROOT)
        fj = os.path.join(dest, "film.js")
        s = open(fj, encoding="utf8").read()
        s = re.sub(r"SLUG: *'[^']*'", f"SLUG: '{name}'", s)
        open(fj, "w", encoding="utf8").write(s)
        for f in os.listdir(os.path.join(dest, "vo")):
            if f.endswith("-vo.mp3"):
                os.remove(os.path.join(dest, "vo", f))  # make.sh voice writes the new one
        steps = [f"Edit film/{name}/vo/script.json: rewrite the first line (the hook) and its `about` note.",
                 f"Edit film/{name}/film.js: rebuild the opening beat (first 2 s) so frame 0 shows something new.",
                 f"bash factory/make.sh {name}   (voice → picture → mix; pacecheck must pass)",
                 f"Fill film/{name}/remix.json: hook, title, cover, facts_checked (YYYY-MM-DD)."]
    else:
        vo = vo_timings(src)
        lines = vo["lines"]
        ids = [l["id"] for l in lines]
        if a.frm not in ids or (a.to and a.to not in ids):
            raise SystemExit(f"line ids for {src}: {', '.join(ids)}")
        i0, i1 = ids.index(a.frm), ids.index(a.to) if a.to else len(lines) - 1
        if i0 == 0:
            raise SystemExit("a cut must open on a later line than the original hook (rule R3); pick --from")
        t0 = max(0.0, lines[i0]["t0"] - 0.25)
        t1 = min(vo["dur"], lines[i1]["t1"] + (0.9 if i1 < len(lines) - 1 else 99))
        m = media(src)
        if "vo" not in m:
            raise SystemExit(f"no rendered {src}-vo.mp4 in {PF}; render the source first")
        t1 = min(t1, duration(m["vo"]))
        out_dir = f"{PF}/factory/{name}"
        os.makedirs(out_dir, exist_ok=True)
        d = t1 - t0
        for key, suffix in (("vo", "vo"), ("voice", "voice-only")):
            if key not in m:
                continue
            out = f"{out_dir}/{name}-{suffix}.mp4"
            af = f"afade=t=in:d=0.12,afade=t=out:st={max(0, d - 0.3):.2f}:d=0.3"
            subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", f"{t0:.3f}", "-to", f"{t1:.3f}", "-i", m[key],
                            "-af", af, "-c:v", "libx264", "-crf", "18", "-preset", "medium", "-pix_fmt", "yuv420p",
                            "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", out], check=True)
            print(f"wrote {out} ({d:.1f} s, source {duration(m[key]):.1f} s)")
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", "0.6", "-i", f"{out_dir}/{name}-vo.mp4", "-frames:v", "1",
                        "-q:v", "3", f"{out_dir}/poster.jpg"], check=False)
        os.makedirs(dest, exist_ok=True)
        info.update({"from": a.frm, "to": ids[i1], "t0": round(t0, 2), "t1": round(t1, 2), "length_s": round(d, 1),
                     "source_length_s": round(vo["dur"], 1), "hook": lines[i0]["text"]})
        steps = [f"Watch {out_dir}/{name}-vo.mp4: does it make sense without the lines before `{a.frm}`?",
                 f"Fill film/{name}/remix.json: title, cover (both new), facts_checked (YYYY-MM-DD).",
                 f"python3 factory/repost.py check {name} --platform youtube --at '<slot UTC>'"]
    os.makedirs(dest, exist_ok=True)
    json.dump(info, open(os.path.join(dest, "remix.json"), "w", encoding="utf8"), indent=1, ensure_ascii=False)
    print(f"\n{name} ({a.kind} remix of {src} @ {commit})")
    for i, s in enumerate(steps, 1):
        print(f"  {i}. {s}")
    return 0


def et_day(t):
    return t.astimezone(ET).date()


def cmd_check(a):
    slug, platform = a.slug, a.platform
    at = parse_time(a.at)
    if not at:
        raise SystemExit("--at must be 'YYYY-MM-DD HH:MM' in UTC")
    src, ch = source_of(slug), channel_of(slug)
    is_filler = slug != src
    ps = posts()
    same_lane = [p for p in ps if p["channel_key"] == ch and p["platform"] == platform and p["when"]]
    res = []
    ok = lambda r, m: res.append(("PASS", r, m))
    warn = lambda r, m: res.append(("WARN", r, m))
    fail = lambda r, m: res.append(("FAIL", r, m))

    # R10: channel lock and never-post list
    if src in NEVER_POST:
        fail("R10", f"{src} is never posted")
    if a.channel and a.channel != ch:
        fail("R10", f"{slug} belongs to {ch}, not {a.channel}: the channels never mix")
    # R1: same video, same lane, 7 days
    same = [p for p in same_lane if p["source"] == src]
    near = [p for p in same if abs((at - p["when"]).total_seconds()) < COOLDOWN_DAYS * 86400]
    if near:
        fail("R1", f"{src} (or a remix) is on {ch}/{platform} on {near[-1]['posted_utc']} UTC: same video not within {COOLDOWN_DAYS} days")
    else:
        ok("R1", f"no {src} post within {COOLDOWN_DAYS} days on {ch}/{platform}")
    # R3: never the same file twice; a repost is always a remix with its own folder
    if not is_filler and same:
        fail("R3", f"{src} is already up on {ch}/{platform} ({same[0]['id']}): exact re-uploads are blocked, make a remix with `repost.py remix {src}`")
    if is_filler:
        info = remix_meta(slug)
        orig = [p for p in same if not p["filler"]]
        # R11: only sources that passed the gate and went live
        if not orig:
            fail("R11", f"{src} was never posted on {ch}/{platform}; an unposted film goes through the normal jury, not the filler lane")
        elif (at - orig[0]["when"]).days < FIRST_RUN_DAYS:
            fail("R2", f"original went up {orig[0]['posted_utc']}; let it run {FIRST_RUN_DAYS} days first")
        else:
            ok("R2", f"original is {(at - orig[0]['when']).days} days old")
        if not info:
            fail("R3", f"film/{slug}/remix.json missing: make fillers with `repost.py remix`")
            info = {}
        # R3/R4: a real change: new opening, new title, new cover; cuts change the length
        prior = [p for p in same]
        old_hooks = {(p.get("hook") or "").strip().lower() for p in prior} | {l[1].strip().lower() for l in script_lines(src)[:1]}
        old_titles = {(p.get("title") or "").strip().lower() for p in prior}
        for other in remixes_of(src):
            if other != slug and (o := remix_meta(other)):
                old_hooks.add(o.get("hook", "").strip().lower())
                old_titles.add(o.get("title", "").strip().lower())
        hook = (info.get("hook") or "").strip()
        if info.get("kind") == "hook" and script_lines(slug)[:1]:
            hook = script_lines(slug)[0][1].strip()
        if not hook or hook.lower() in old_hooks:
            fail("R3", f"opening line must be new (got {hook!r})")
        else:
            ok("R3", f"new opening: {hook!r}")
        for field, olds in (("title", old_titles), ("cover", set())):
            v = (info.get(field) or "").strip()
            if not v or v.lower() in olds:
                fail("R3", f"remix.json `{field}` must be filled in and new")
        if info.get("kind") == "cut":
            ch_ = 1 - info.get("length_s", 0) / max(info.get("source_length_s", 1), 1)
            (ok if ch_ >= CUT_MIN_CHANGE else fail)("R4", f"cut is {info.get('length_s')} s vs {info.get('source_length_s')} s ({ch_:.0%} shorter, need {CUT_MIN_CHANGE:.0%})")
        m = media(slug)
        (ok if "vo" in m else fail)("R4", f"render {'found' if 'vo' in m else 'missing'} in {PF}/factory/{slug}/")
        # R5: lifetime cap
        n = len([p for p in same if p["filler"]])
        (ok if n < MAX_REMIXES else fail)("R5", f"{n} earlier fillers of {src} on {ch}/{platform} (max {MAX_REMIXES})")
        # R8: TikTok
        if platform == "tiktok" and not TIKTOK_FILLERS:
            fail("R8", "no fillers on TikTok (account held; TikTok keeps reposts off For You)")
        # R9: time-bound facts
        mt = meta().get(src, {})
        if mt.get("expires") and at.date() >= datetime.strptime(mt["expires"], "%Y-%m-%d").date():
            fail("R9", f"{src} expired on {mt['expires']} ({mt.get('note', '')})")
        bound = [t for _, t in script_lines(slug if os.path.isdir(os.path.join(ROOT, 'film', slug, 'vo')) else src) if TIME_WORDS.search(t)]
        if bound or mt.get("note"):
            checked = parse_time(info.get("facts_checked", ""))
            if not checked or (at - checked).days > FACTS_FRESH_DAYS:
                fail("R9", f"time-bound lines need `facts_checked` within {FACTS_FRESH_DAYS} days of the slot: " + " | ".join(bound[:3]))
            else:
                ok("R9", f"facts checked {info['facts_checked']}")
    # R6: daily caps and spacing (fresh and fillers)
    day = [p for p in same_lane if et_day(p["when"]) == et_day(at)]
    cap = MAX_POSTS_PER_ET_DAY[ch]
    (ok if len(day) < cap else fail)("R6", f"{len(day)} posts already on {et_day(at)} ET on {ch}/{platform} (max {cap})")
    if is_filler:
        fd = [p for p in day if p["filler"]]
        (ok if len(fd) < MAX_FILLERS_PER_ET_DAY else fail)("R6", f"{len(fd)} fillers already that day (max {MAX_FILLERS_PER_ET_DAY})")
    close = [p for p in same_lane if abs((at - p["when"]).total_seconds()) < MIN_GAP_HOURS * 3600]
    if close:
        fail("R6", f"{close[0]['slug']} is at {close[0]['posted_utc']} UTC: keep {MIN_GAP_HOURS} h apart")
    # R7: fillers never outnumber fresh posts
    if is_filler:
        wk = [p for p in same_lane if timedelta(0) <= at - p["when"] < timedelta(days=7)]
        fillers = len([p for p in wk if p["filler"]]) + 1
        share = fillers / (len(wk) + 1)
        (ok if share <= FILLER_SHARE_7D else fail)("R7", f"fillers would be {fillers}/{len(wk) + 1} of the last 7 days (max {FILLER_SHARE_7D:.0%})")
    for lvl, rule, msg in res:
        print(f"{lvl}  {rule:<4} {msg}")
    bad = any(l == "FAIL" for l, _, _ in res)
    print(f"\n{'BLOCKED' if bad else 'OK to schedule'}: {slug} on {ch}/{platform} at {a.at} UTC ({at.astimezone(ET):%a %H:%M} ET)")
    return 1 if bad else 0


def cmd_candidates(a):
    ps, now = posts(), datetime.now(UTC)
    rows = []
    for src in sorted({p["source"] for p in ps}):
        ch = channel_of(src)
        if (a.channel and a.channel != ch) or src in NEVER_POST:
            continue
        lane = [p for p in ps if p["source"] == src and p["platform"] == "youtube"]
        orig = [p for p in lane if not p["filler"]]
        if not orig:
            continue
        last = lane[-1]["when"]
        age = (now - orig[0]["when"]).days
        fillers = len([p for p in lane if p["filler"]])
        why = []
        if (now - last).days < COOLDOWN_DAYS or age < FIRST_RUN_DAYS:
            why.append("cooling down")
        if fillers >= MAX_REMIXES:
            why.append("used up")
        mt = meta().get(src, {})
        if mt.get("expires") and now.date() >= datetime.strptime(mt["expires"], "%Y-%m-%d").date():
            why.append("expired")
        if "not a short" in mt.get("note", "").lower():
            why.append("long video, not a filler")
        has_timing = "vo/vo.js" in " ".join(source_files(src)) if src in best_sources() else False
        rows.append((ch, src, orig[0]["posted_utc"], fillers, "cut+hook" if has_timing and media(src).get("vo") else "hook only",
                     ", ".join(why) or "ready", mt.get("note", "")))
    rows.sort(key=lambda r: (r[0], r[5] != "ready", r[2]))
    print(f"{'channel':<6} {'source':<18} {'first post':<17} fill  remix      state / note")
    for r in rows:
        print(f"{r[0]:<6} {r[1]:<18} {r[2]:<17} {r[3]:<5} {r[4]:<10} {r[5]}{'  · ' + r[6] if r[6] else ''}")
    return 0


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="cmd", required=True)
    p = sub.add_parser("inventory"); p.add_argument("--write", action="store_true"); p.set_defaults(fn=cmd_inventory)
    p = sub.add_parser("snapshot"); p.add_argument("slugs", nargs="*"); p.set_defaults(fn=cmd_snapshot)
    p = sub.add_parser("candidates"); p.add_argument("--channel", choices=["delta", "tech"]); p.set_defaults(fn=cmd_candidates)
    p = sub.add_parser("remix"); p.add_argument("slug"); p.add_argument("--kind", choices=["cut", "hook"], required=True)
    p.add_argument("--from", dest="frm"); p.add_argument("--to"); p.set_defaults(fn=cmd_remix)
    p = sub.add_parser("check"); p.add_argument("slug"); p.add_argument("--platform", choices=["youtube", "tiktok"], default="youtube")
    p.add_argument("--channel", choices=["delta", "tech"]); p.add_argument("--at", required=True); p.set_defaults(fn=cmd_check)
    a = ap.parse_args()
    if a.cmd == "remix" and a.kind == "cut" and not a.frm:
        ap.error("--kind cut needs --from <line id>")
    sys.exit(a.fn(a))


if __name__ == "__main__":
    main()
