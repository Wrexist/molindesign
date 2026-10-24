#!/usr/bin/env python3
"""Pull per-step screenshots out of two REA browser scenarios (reduced motion off/on),
build a contact sheet, and measure how much each step differs with REA's own
pixel comparison. Prints a markdown table.

  frames.py capture-no-preference.json capture-reduce.json --out frames [--rea "npx -y rea-agents@6.7.0"]
"""
import argparse, base64, json, os, shlex, subprocess, sys


def steps(path):
    n = json.load(open(path)).get("normalized_result", {})
    for i, s in enumerate(n.get("steps", [])):
        shot = (s.get("artifacts") or {}).get("screenshot") or {}
        yield i, s["step_id"], s.get("status"), shot.get("value")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("a"); ap.add_argument("b")
    ap.add_argument("--out", default="frames")
    ap.add_argument("--rea", default="npx -y rea-agents@6.7.0")
    ap.add_argument("--threshold", type=int, default=8)
    a = ap.parse_args()
    os.makedirs(a.out, exist_ok=True)
    rows, pngs = [], {"a": [], "b": []}
    sa, sb = list(steps(a.a)), list(steps(a.b))
    for (i, sid, st_a, va), (_, _, st_b, vb) in zip(sa, sb):
        paths = []
        for tag, v in (("a", va), ("b", vb)):
            if not v:
                paths.append(None); continue
            png = os.path.join(a.out, f"{i:02d}-{sid}-{tag}.png")
            open(png, "wb").write(base64.b64decode(v["data_base64"]))
            art = png[:-4] + ".json"
            json.dump(v, open(art, "w"))
            pngs[tag].append(png); paths.append(art)
        ratio = "—"
        if all(paths):
            r = subprocess.run(shlex.split(a.rea) + ["compare-web-screenshots", os.path.abspath(paths[0]), os.path.abspath(paths[1]),
                               "--channel-threshold", str(a.threshold), "--json"], capture_output=True, text=True)
            try:
                d = json.loads(r.stdout); d = d.get("normalized_result", d)
                ratio = f"{100 * d['changed_ratio']:.2f}%"
            except Exception:
                ratio = "compare failed"
        rows.append(f"| {i} | {sid} | {st_a}/{st_b} | {ratio} |")
    sheet = os.path.join(a.out, "sheet.jpg")
    if pngs["a"]:
        cols = len(pngs["a"])
        subprocess.run(["montage", *pngs["a"], *pngs["b"], "-tile", f"{cols}x2", "-geometry", "480x300+4+4",
                        "-background", "#111", sheet], check=False)
    print("# Reduced motion: no-preference (top row of sheet) vs reduce (bottom row)\n")
    print(f"Pixels changed per step at channel threshold {a.threshold}. Near 0% on steps that animate means the site "
          "**ignores prefers-reduced-motion** for that motion; record that as verified, and add a fallback in our skill.\n")
    print("| step | id | status a/b | changed |\n|---:|---|---|---:|")
    print("\n".join(rows))
    print(f"\nSheet: {sheet}")


if __name__ == "__main__":
    sys.exit(main())
