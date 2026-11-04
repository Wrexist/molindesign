#!/usr/bin/env python3
"""Measure a rendered film's pace: hard cuts, motion in the first 3 s, and frozen stretches.

    python3 film/tools/pacecheck.py film/<slug>/out/<SLUG>-vo.mp4 [--json]

Why: the jury judged "a change every 1.5 s" by eye, and it missed frozen stretches more than once
(agent r1, wifi r2, memory r2 in factory/LESSONS.md). This puts numbers on it with ffmpeg's scdet
filter, which gives every frame a mean absolute difference from the previous one (mafd, 0-100).

Calibrated 2026-11-04 on 13 posted Shorts (540 px wide, 30 fps):
- Motion in the first 3 s lined up with YouTube views (Spearman 0.74). Every Short over 300 views
  had 0.24 or more; four of the five flops had 0.22 or less. Overall motion did not (0.12).
- Our films have 0-1 hard cuts each; the reel in ernestosoftware's post (Nov 2026) labels 55.
  Cuts are reported for comparison, not judged.

Verdicts (exit code 1 on any FAIL):
- FAIL  a frozen stretch (mafd < 0.05) of 1.0 s or longer anywhere  (house rule: no static stretch over 1 s)
- WARN  a frozen stretch of 0.5 s or longer between 3.5 and 6.5 s     (the 5 s drop-off, memory r2)
- WARN  mean motion over 0-3 s under 0.30                             (flops sat at 0.13-0.22)
- WARN  frame 0-1 s under 0.15                                        (agent r1 read as a still card at 0.07)
"""
import json
import statistics
import subprocess
import sys

STILL = 0.05        # mafd below this reads as a still frame at phone size
FROZEN_FAIL = 1.0   # seconds
DROP_WIN = (3.5, 6.5)
DROP_WARN = 0.5
OPEN_WARN = 0.30
FIRST_SEC_WARN = 0.15
CUT_SCORE = 10.0    # scdet score at or above this is a hard cut


def measure(path):
    cmd = ["ffmpeg", "-hide_banner", "-nostats", "-i", path, "-an",
           "-vf", f"scale=540:-2,scdet=threshold={CUT_SCORE},metadata=print:file=-", "-f", "null", "-"]
    out = subprocess.run(cmd, capture_output=True, text=True, check=True).stdout
    times, mafd, score = [], [], []
    for line in out.splitlines():
        if line.startswith("frame:"):
            times.append(float(line.split("pts_time:")[1]))
        elif line.startswith("lavfi.scd.mafd="):
            mafd.append(float(line.split("=", 1)[1]))
        elif line.startswith("lavfi.scd.score="):
            score.append(float(line.split("=", 1)[1]))
    n = min(len(times), len(mafd), len(score))
    return times[:n], mafd[:n], score[:n]


def frozen_runs(times, mafd, min_len):
    runs, start = [], None
    for t, v in zip(times + [times[-1] + 1], mafd + [1e9]):
        if v < STILL:
            start = t if start is None else start
        elif start is not None:
            if t - start >= min_len:
                runs.append((round(start, 2), round(t - start, 2)))
            start = None
    return runs


def window_mean(times, mafd, a, b):
    vals = [v for t, v in zip(times, mafd) if a < t <= b]  # skip frame 0, which has no previous frame
    return statistics.mean(vals) if vals else 0.0


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    if not args:
        sys.exit(__doc__)
    times, mafd, score = measure(args[0])
    dur = times[-1] + (times[1] - times[0] if len(times) > 1 else 0)
    cuts = [round(t, 2) for t, s in zip(times, score) if s >= CUT_SCORE]
    rep = {
        "file": args[0],
        "duration_s": round(dur, 1),
        "hard_cuts": len(cuts),
        "cuts_per_10s": round(len(cuts) / dur * 10, 1),
        "cut_times": cuts,
        "motion_first_1s": round(window_mean(times, mafd, 0, 1), 3),
        "motion_first_3s": round(window_mean(times, mafd, 0, 3), 3),
        "motion_median": round(statistics.median(mafd), 3),
        "still_frames_pct": round(sum(v < STILL for v in mafd) / len(mafd) * 100, 1),
        "frozen": frozen_runs(times, mafd, FROZEN_FAIL),
        "frozen_at_dropoff": [r for r in frozen_runs(times, mafd, DROP_WARN)
                              if r[0] < DROP_WIN[1] and r[0] + r[1] > DROP_WIN[0]],
    }
    verdicts = []
    for s, d in rep["frozen"]:
        verdicts.append(f"FAIL  frozen {d:.2f} s from {s:.2f} s (no static stretch over 1 s)")
    for s, d in rep["frozen_at_dropoff"]:
        if d < FROZEN_FAIL:
            verdicts.append(f"WARN  frozen {d:.2f} s from {s:.2f} s, inside the 3.5-6.5 s drop-off window")
    if rep["motion_first_3s"] < OPEN_WARN:
        verdicts.append(f"WARN  motion over 0-3 s is {rep['motion_first_3s']:.2f} (< {OPEN_WARN}); every Short over 300 views had 0.24+, most 0.30+")
    if rep["motion_first_1s"] < FIRST_SEC_WARN:
        verdicts.append(f"WARN  motion over 0-1 s is {rep['motion_first_1s']:.2f} (< {FIRST_SEC_WARN}); frame 0 reads as a still card")
    rep["verdicts"] = verdicts
    if "--json" in sys.argv:
        print(json.dumps(rep, indent=1))
    else:
        print(f"{rep['file']}: {rep['duration_s']} s, {rep['hard_cuts']} hard cuts ({rep['cuts_per_10s']}/10 s), "
              f"motion 0-1 s {rep['motion_first_1s']}, 0-3 s {rep['motion_first_3s']}, median {rep['motion_median']}, "
              f"still frames {rep['still_frames_pct']} %")
        print("\n".join(verdicts) if verdicts else "OK    no frozen stretches, opening moves")
    sys.exit(1 if any(v.startswith("FAIL") for v in verdicts) else 0)


if __name__ == "__main__":
    main()
