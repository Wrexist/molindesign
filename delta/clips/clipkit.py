#!/usr/bin/env python3
"""Delta clip kit: turn a GTA video URL into short, muted, credited clips a code-rendered Short can draw.

  clipkit.py fetch <url | local file> [--own]          download + provenance verdict + contact sheet + shot list
  clipkit.py cut <source-key> --film gta-<slug> --clip name=IN-OUT [--clip ...] [--as t2] [--credit "..."] [--w 1280]
  clipkit.py restore gta-<slug>                         re-fetch sources and re-cut every clip listed in clips.json
  clipkit.py lint gta-<slug> [--used out/clips-used.json]   SAFE-EDIT rules 3 and 7 on what the film really shows

Sources are cached outside the repo (Rockstar footage is never committed):
  /mnt/project-files/delta/sources/<key>/   (shared by every thread)   else   ~/.cache/delta-sources/<key>/
Frames land in film/gta-<slug>/clips/<name>/0001.jpg (gitignored); film/gta-<slug>/clips.json is committed so any
container can rebuild them with `restore`.

Provenance: footage is usable only when the uploader is on delta/clips/OFFICIAL.json (Rockstar's own accounts and
site) or the file is Isac's own capture (--own). Anything else is THIRD_PARTY: topic and inspiration only, never
footage (SAFE-EDIT "Never: other creators' clips, even credited").
"""
import argparse
import json
import os
import re
import shutil
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent.parent
FILM = ROOT / 'film'
MAX_USE = 4.9          # SAFE-EDIT rule 3: each excerpt under 5 s
MAX_SHARE = 0.5        # SAFE-EDIT rule 7: footage at most about half of the runtime
MAX_RUN = 5.0          # back-to-back clips count as one unbroken stretch
OVERLAP = 0.25         # the same source range in two films counts as reuse above this many seconds


def cache_root():
    pf = Path('/mnt/project-files/')
    if pf.is_dir() and os.access(pf, os.W_OK):
        return pf / 'delta' / 'sources'
    return Path.home() / '.cache' / 'delta-sources'


def sh(cmd, **kw):
    return subprocess.run(cmd, check=True, text=True, capture_output=True, **kw)


def official_list():
    return json.loads((HERE / 'OFFICIAL.json').read_text())


def judge(info, own):
    """OFFICIAL, OWN or THIRD_PARTY, with the reason."""
    if own:
        return 'OWN', 'marked --own: Isac\'s own capture (SAFE-EDIT rule 8)'
    o = official_list()
    ext = (info.get('extractor_key') or info.get('extractor') or '').lower()
    ids = {str(info.get(k) or '').lower().lstrip('@') for k in ('uploader_id', 'channel_id')}  # ids, never display names ("GTA 6" is a fan account's name)
    for acc in o['accounts']:
        if acc['site'] in ext and {a.lower().lstrip('@') for a in acc['ids']} & ids:
            return 'OFFICIAL', f"uploader is {acc['name']} on {acc['site']}"
    url = (info.get('webpage_url') or info.get('url') or '').lower()
    for d in o['domains']:
        if re.match(rf'https?://([a-z0-9-]+\.)*{re.escape(d)}/', url):
            return 'OFFICIAL', f'hosted on {d}'
    who = info.get('uploader_id') or info.get('uploader') or 'unknown'
    return 'THIRD_PARTY', f'uploader "{who}" is not on delta/clips/OFFICIAL.json'


def key_for(info, path=None):
    if path:
        return 'own-' + re.sub(r'[^a-z0-9]+', '-', Path(path).stem.lower()).strip('-')[:40]
    ext = re.sub(r'[^a-z0-9]+', '', (info.get('extractor_key') or 'web').lower())
    return f"{ext}-{re.sub(r'[^A-Za-z0-9_-]+', '', str(info.get('id')))}"


def shots(video):
    """Hard cuts from ffmpeg's scene score, so clips can start and end on a cut."""
    r = subprocess.run(['ffmpeg', '-hide_banner', '-i', str(video), '-an', '-vf', "select='gt(scene,0.3)',showinfo",
                        '-f', 'null', '-'], text=True, capture_output=True)
    return [float(m) for m in re.findall(r'pts_time:([0-9.]+)', r.stderr)]


def contact_sheets(video, out, dur):
    """One frame a second, 8x5 per page, each stamped with its time, so shots can be picked by eye."""
    for f in out.glob('sheet-*.jpg'):
        f.unlink()
    page = 40
    for i in range(int(dur // page) + 1):
        t0 = i * page
        if t0 >= dur:
            break
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', str(t0), '-t', str(page), '-i', str(video), '-vf',
                        f"fps=1,scale=256:-2,drawtext=text='%{{eif\\:t+{t0}\\:d}}s':x=6:y=6:fontsize=22:fontcolor=yellow:box=1:boxcolor=black@.7,tile=8x5",
                        '-frames:v', '1', str(out / f'sheet-{i:02d}.jpg')], check=True)


def cmd_fetch(a):
    src = a.src
    local = Path(src).expanduser()
    if local.exists():
        info = {'title': local.name, 'webpage_url': str(local), 'extractor_key': 'local'}
        try:
            info['duration'] = float(sh(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', str(local)]).stdout)
        except Exception:
            pass
        key = key_for(info, local)
    else:
        if not shutil.which('yt-dlp'):
            sys.exit('yt-dlp is missing: pip install yt-dlp')
        info = json.loads(sh(['yt-dlp', '-J', '--no-playlist', src]).stdout)
        key = key_for(info)
    out = cache_root() / key
    out.mkdir(parents=True, exist_ok=True)
    video = out / 'src.mp4'
    if not video.exists():
        if local.exists():
            shutil.copyfile(local, video)
        else:
            subprocess.run(['yt-dlp', '-q', '--no-playlist', '-f', 'bv*[height<=1080]+ba/b[height<=1080]/b',
                            '--merge-output-format', 'mp4', '-o', str(video), src], check=True)
    verdict, why = judge(info, a.own)
    dur = info.get('duration') or float(sh(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', str(video)]).stdout)
    cuts = shots(video)
    prov = {
        'key': key, 'url': info.get('webpage_url') or src, 'title': info.get('title'), 'description': (info.get('description') or '')[:500],
        'uploader': info.get('uploader'), 'uploader_id': info.get('uploader_id'), 'channel_id': info.get('channel_id'),
        'upload_date': info.get('upload_date') or (str(info.get('timestamp')) if info.get('timestamp') else None),
        'duration': round(float(dur), 3), 'width': info.get('width'), 'height': info.get('height'),
        'verdict': verdict, 'why': why, 'shots': [round(c, 3) for c in cuts],
    }
    (out / 'provenance.json').write_text(json.dumps(prov, indent=1, ensure_ascii=False))
    contact_sheets(video, out, float(dur))
    print(f'source   {key}\nfolder   {out}\ntitle    {prov["title"]}\nby       {prov["uploader"]} ({prov["uploader_id"]})')
    print(f'length   {prov["duration"]} s, {len(cuts)} hard cuts; contact sheets: {out}/sheet-*.jpg')
    print(f'VERDICT  {verdict}: {why}')
    if verdict == 'THIRD_PARTY':
        print('         Footage blocked. Use this post for its topic only: look at the sheets, then find the same moment in an\n'
              '         official Rockstar video (fetch that URL instead) or build the beat from our own graphics.\n'
              '         Also check the sheets for real-world footage passed off as the game: say so if you find it.')
        sys.exit(3)


def parse_range(s):
    m = re.fullmatch(r'([A-Za-z0-9_-]+)=([0-9.:]+)-([0-9.:]+)', s)
    if not m:
        sys.exit(f'bad --clip {s!r}: use name=IN-OUT in seconds, e.g. roof=10.9-13.8')

    def sec(v):
        p = [float(x) for x in v.split(':')]
        return sum(x * 60 ** i for i, x in enumerate(reversed(p)))
    return m.group(1), sec(m.group(2)), sec(m.group(3))


def manifest_path(film):
    return FILM / film / 'clips.json'


def load_manifest(film):
    p = manifest_path(film)
    return json.loads(p.read_text()) if p.exists() else {'film': film, 'sources': {}, 'clips': {}}


def letterbox(video, t_in, t_out):
    """Trailers are often 2.39:1 inside 16:9: find the black bars so a vertical crop never shows them."""
    r = subprocess.run(['ffmpeg', '-hide_banner', '-ss', f'{t_in:.3f}', '-i', str(video), '-t', f'{t_out - t_in:.3f}', '-an',
                        '-vf', 'cropdetect=limit=24:round=2:reset=0', '-f', 'null', '-'], text=True, capture_output=True)
    m = re.findall(r'crop=(\d+):(\d+):(\d+):(\d+)', r.stderr)
    return m[-1] if m else None


def extract(video, film, name, t_in, t_out, w, fps=30, crop=None):
    d = FILM / film / 'clips' / name
    shutil.rmtree(d, ignore_errors=True)
    d.mkdir(parents=True)
    vf = (f'crop={crop},' if crop else '') + f'fps={fps},scale={w}:-2'
    # -an: the clip never carries trailer audio or music (SAFE-EDIT rule 4)
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', f'{t_in:.3f}', '-i', str(video), '-t', f'{t_out - t_in:.3f}', '-an',
                    '-vf', vf, '-q:v', '3', str(d / '%04d.jpg')], check=True)
    return len(list(d.glob('*.jpg')))


def cmd_cut(a):
    src_dir = cache_root() / a.source
    prov_p = src_dir / 'provenance.json'
    if not prov_p.exists():
        sys.exit(f'no source {a.source} in {cache_root()}: run clipkit.py fetch first')
    prov = json.loads(prov_p.read_text())
    if prov['verdict'] not in ('OFFICIAL', 'OWN'):
        sys.exit(f"refused: {a.source} is {prov['verdict']} ({prov['why']}). Only official Rockstar video or Isac's own capture can be cut.")
    if not (FILM / a.film).is_dir():
        sys.exit(f'no film/{a.film}: scaffold the film first')
    man = load_manifest(a.film)
    alias = a.alias or a.source
    man['sources'][alias] = {'key': prov['key'], 'url': prov['url'], 'title': prov['title'], 'uploader': prov['uploader'],
                             'verdict': prov['verdict'], 'credit': a.credit or man['sources'].get(alias, {}).get('credit') or
                             ('Own capture' if prov['verdict'] == 'OWN' else 'Rockstar Games')}
    for spec in a.clip:
        name, t_in, t_out = parse_range(spec)
        if t_out <= t_in:
            sys.exit(f'{name}: OUT must be after IN')
        if t_out - t_in > 6:
            sys.exit(f'{name}: {t_out - t_in:.2f} s cut; keep cuts under 6 s (a use on screen must stay under {MAX_USE} s)')
        lb = letterbox(src_dir / 'src.mp4', t_in, t_out)
        crop = ':'.join(lb) if lb and (int(lb[1]) < (prov.get('height') or 10**6) - 8 or int(lb[0]) < (prov.get('width') or 10**6) - 8) else None
        n = extract(src_dir / 'src.mp4', a.film, name, t_in, t_out, a.w, 30, crop)
        man['clips'][name] = {'src': alias, 'in': round(t_in, 3), 'out': round(t_out, 3), 'fps': 30, 'frames': n, 'w': a.w, 'crop': crop}
        print(f'cut {name}: {alias} {t_in:.2f}-{t_out:.2f} s -> film/{a.film}/clips/{name}/ ({n} frames, muted{", letterbox cropped " + crop if crop else ""})')
    manifest_path(a.film).write_text(json.dumps(man, indent=1, ensure_ascii=False) + '\n')
    ensure_gitignore()


def ensure_gitignore():
    gi = ROOT / '.gitignore'
    line = 'film/*/clips/'
    txt = gi.read_text() if gi.exists() else ''
    if line not in txt.split('\n'):
        gi.write_text(txt + ('' if txt.endswith('\n') or not txt else '\n') + '# Delta trailer frames: rebuilt by delta/clips/clipkit.py restore, never committed\n' + line + '\n')


def cmd_restore(a):
    man = load_manifest(a.film)
    if not man['clips']:
        sys.exit(f'film/{a.film}/clips.json lists no clips')
    for alias, s in man['sources'].items():
        d = cache_root() / s['key']
        if not (d / 'src.mp4').exists():
            print(f'fetching {alias}: {s["url"]}')
            r = subprocess.run([sys.executable, __file__, 'fetch', s['url']] + (['--own'] if s['verdict'] == 'OWN' else []))
            if r.returncode:
                sys.exit(f'could not fetch {s["url"]}')
    for name, c in man['clips'].items():
        s = man['sources'][c['src']]
        if len(list((FILM / a.film / 'clips' / name).glob('*.jpg'))) == c['frames']:
            continue
        n = extract(cache_root() / s['key'] / 'src.mp4', a.film, name, c['in'], c['out'], c.get('w', 1280), c.get('fps', 30), c.get('crop'))
        print(f'restored {name}: {n} frames')


def merged(spans, gap=0.3):
    out = []
    for t0, t1 in sorted(spans):
        if out and t0 - out[-1][1] <= gap:
            out[-1][1] = max(out[-1][1], t1)
        else:
            out.append([t0, t1])
    return out


def related(a, b):
    """A filler remix (gta-x-r1) may reuse its own film's clips."""
    return a == b or a.startswith(b + '-r') or b.startswith(a + '-r')


def cmd_lint(a):
    man = load_manifest(a.film)
    used_p = Path(a.used) if a.used else FILM / a.film / 'out' / 'clips-used.json'
    fails, warns = [], []
    if not used_p.exists():
        sys.exit(f'no {used_p}: run `node render.mjs clips --film {a.film}` (make.sh does it) first')
    used = json.loads(used_p.read_text())
    dur, uses = used['DUR'], used['uses']
    for alias, s in man['sources'].items():
        if s.get('verdict') not in ('OFFICIAL', 'OWN'):
            fails.append(f'source {alias} is {s.get("verdict")}: only official Rockstar video or own capture')
    official_spans = []
    for u in uses:
        c = man['clips'].get(u['clip'])
        if not c:
            fails.append(f'use of unknown clip {u["clip"]}')
            continue
        d = u['t1'] - u['t0']
        if d > MAX_USE:
            fails.append(f'{u["clip"]} at {u["t0"]:.2f} s is on screen {d:.2f} s (max {MAX_USE})')
        if not (u.get('note') or '').strip():
            fails.append(f'{u["clip"]} at {u["t0"]:.2f} s has no note: every excerpt is annotated evidence for a point (rule 3)')
        span = c['out'] - c['in']
        if u.get('srcTo', 0) > span + 1 / 30 + 1e-6:
            fails.append(f'{u["clip"]} at {u["t0"]:.2f} s plays to {u["srcTo"]:.2f} s but the cut is {span:.2f} s long')
        if man['sources'][c['src']].get('verdict') == 'OFFICIAL':
            official_spans.append((u['t0'], u['t1']))
    for t0, t1 in merged([(u['t0'], u['t1']) for u in uses]):
        if t1 - t0 > MAX_RUN:
            fails.append(f'footage runs unbroken {t0:.2f}-{t1:.2f} s ({t1 - t0:.2f} s): put our own graphics between clips')
    share = sum(t1 - t0 for t0, t1 in merged(official_spans, 0)) / dur if dur else 0
    if share > MAX_SHARE:
        fails.append(f'Rockstar footage is {share:.0%} of the runtime (max {MAX_SHARE:.0%})')
    elif share > 0.4:
        warns.append(f'Rockstar footage is {share:.0%} of the runtime: close to the {MAX_SHARE:.0%} cap')
    for name in man['clips']:
        if not any(u['clip'] == name for u in uses):
            warns.append(f'clip {name} is cut but never shown')
    # never the same clip in two different films (rule 7)
    mine = [(man['sources'][c['src']]['key'], c['in'], c['out'], n) for n, c in man['clips'].items()]
    for other in sorted(FILM.glob('*/clips.json')):
        of = other.parent.name
        if related(of, a.film):
            continue
        om = json.loads(other.read_text())
        for on, oc in om.get('clips', {}).items():
            okey = om['sources'][oc['src']]['key']
            for key, i0, i1, n in mine:
                ov = min(i1, oc['out']) - max(i0, oc['in'])
                if key == okey and ov > OVERLAP:
                    fails.append(f'clip {n} reuses {ov:.2f} s of {okey} already used by film/{of} ({on} {oc["in"]}-{oc["out"]})')
    print(f'clips: {len(uses)} uses, footage {share:.0%} of {dur:.1f} s')
    for w in warns:
        print('WARN ', w)
    for f in fails:
        print('FAIL ', f)
    if fails:
        sys.exit(2)
    print('clip lint ok')


def main():
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = p.add_subparsers(dest='cmd', required=True)
    f = sub.add_parser('fetch'); f.add_argument('src'); f.add_argument('--own', action='store_true')
    c = sub.add_parser('cut'); c.add_argument('source'); c.add_argument('--film', required=True)
    c.add_argument('--clip', action='append', required=True); c.add_argument('--as', dest='alias')
    c.add_argument('--credit'); c.add_argument('--w', type=int, default=1280)
    r = sub.add_parser('restore'); r.add_argument('film')
    l = sub.add_parser('lint'); l.add_argument('film'); l.add_argument('--used')
    a = p.parse_args()
    {'fetch': cmd_fetch, 'cut': cmd_cut, 'restore': cmd_restore, 'lint': cmd_lint}[a.cmd](a)


if __name__ == '__main__':
    main()
