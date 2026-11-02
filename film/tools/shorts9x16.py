#!/usr/bin/env python3
"""Cut a full-screen vertical Short (1080×1920) out of a 16:9 long-form episode.

    python3 shorts9x16.py <episode.mp4> <episode.srt> <clean-dir> <out.mp4> "<HOOK LINE 1>|<HOOK LINE 2>" <from>-<to> [<from>-<to> ...]

<clean-dir> holds caption-free renders of the same ranges, made with
`node render.mjs clean --film <dir> --ranges <from>-<to>,...` (files named <from>-<to>.mp4). The frame is
cropped from 1920 to about 1536 wide, so keep labels inside x 192–1728. It fills the middle of the phone
screen, over a blurred, darkened copy of itself that bleeds to the edges. The hook sits on top and big
captions from the SRT sit below. Audio is the episode's own mix for the same ranges.
tools/shorts.sh is the older, simpler cut that keeps the film's small burned-in captions."""
import re
import subprocess
import sys
import tempfile
from pathlib import Path

FONT = 'Inter'


def srt_cues(path):
    t = lambda s: sum(float(x) * m for x, m in zip(s.replace(',', '.').split(':'), (3600, 60, 1)))
    for block in Path(path).read_text().strip().split('\n\n'):
        lines = block.strip().split('\n')
        if len(lines) >= 3:
            a, b = lines[1].split(' --> ')
            yield t(a), t(b), ' '.join(lines[2:])


def ass_time(s):
    s = max(0, s)
    return f'{int(s // 3600)}:{int(s % 3600 // 60):02d}:{s % 60:05.2f}'


def main():
    ep, srt, clean, out, hook, *segs = sys.argv[1:]
    segs = [tuple(map(float, s.split('-'))) for s in segs]
    h1, _, h2 = hook.partition('|')
    tmp = Path(tempfile.mkdtemp())
    # captions: the SRT cues inside each range, shifted onto the Short's own clock
    ev, off = [], 0.0
    for a, b in segs:
        for c0, c1, text in srt_cues(srt):
            if c1 > a and c0 < b:
                ev.append(f'Dialogue: 0,{ass_time(max(c0, a) - a + off)},{ass_time(min(c1, b) - a + off)},Cap,,0,0,0,,{text}')
        off += b - a
    hook_end = ass_time(off)
    ass = tmp / 'caps.ass'
    ass.write_text(f"""[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Cap,{FONT},74,&H00FFFFFF,&H00FFFFFF,&H00301C1C,&H80000000,-1,0,0,0,100,100,0,0,1,7,0,8,70,70,1360,1
Style: Hook,{FONT},96,&H003DC8FF,&H003DC8FF,&H00301C1C,&H00000000,-1,0,0,0,100,100,0,0,1,9,0,8,50,50,190,1
Style: Foot,{FONT},44,&H00E0EDF4,&H00E0EDF4,&H00301C1C,&H00000000,-1,0,0,0,100,100,0,0,1,4,0,8,50,50,1560,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
Dialogue: 1,0:00:00.00,{hook_end},Hook,,0,0,0,,{h1}\\N{h2}
Dialogue: 1,0:00:00.00,{hook_end},Foot,,0,0,0,,Full story on the channel
""" + '\n'.join(ev) + '\n')
    ins, parts, cat = [], '', ''
    for i, (a, b) in enumerate(segs):
        name = f'{a:g}-{b:g}.mp4'
        clip = Path(clean) / name
        if not clip.exists():
            sys.exit(f'missing {clip}: run node render.mjs clean --ranges {a:g}-{b:g} first')
        ins += ['-i', str(clip)]
        d = b - a
        parts += (f'[{i}:v]trim=0:{d},setpts=PTS-STARTPTS[v{i}];'
                  f'[{len(segs)}:a]atrim={a}:{b},asetpts=PTS-STARTPTS,afade=t=in:d=0.04,afade=t=out:st={d - 0.08:.3f}:d=0.08[a{i}];')
        cat += f'[v{i}][a{i}]'
    ins += ['-i', ep]
    n = len(segs)
    fc = (parts + f'{cat}concat=n={n}:v=1:a=1[cv][ca];[cv]split[p][q];'
          '[p]scale=-2:1920,crop=1080:1920,gblur=sigma=28,eq=brightness=-0.22:saturation=0.8[bg];'
          '[q]scale=1350:760,crop=1080:760[fg];'
          f'[bg][fg]overlay=0:500,ass={ass}[v]')
    subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', *ins, '-filter_complex', fc,
                    '-map', '[v]', '-map', '[ca]', '-c:v', 'libx264', '-preset', 'medium', '-crf', '19', '-pix_fmt', 'yuv420p',
                    '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', out], check=True)
    dur = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', out], capture_output=True, text=True).stdout.strip()
    print(f'wrote {out} ({float(dur):.1f} s)')


if __name__ == '__main__':
    main()
