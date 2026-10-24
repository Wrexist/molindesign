#!/usr/bin/env python3
"""Rank the functions a reference site ran during an interaction.

Reads `rea observe-web-execution --json` output. With a baseline (an idle window
on the same page load), keeps only functions whose call rate rose during the
interaction, which strips the always-on render loop and leaves the code that
reacts to scroll, wheel or pointer.

  hotpath.py action.json [--baseline idle.json] [--top 40] [--grep scroll,wheel]
             [--only oryzo.ai/_astro] [--context 220] [--md out.md]
"""
import argparse, json, re, sys


def load(path, only=""):
    d = json.load(open(path))
    n = d.get("normalized_result", d)
    w = n["window"]
    secs = max(0.001, n["requested_ms"] / 1000) if "requested_ms" in n else max(0.001, w["requested_ms"] / 1000)
    texts = {s["script_id"]: ((s.get("source") or {}).get("text") or "") for s in n.get("sources", [])}
    fns = {}
    for sc in (n.get("coverage") or {}).get("scripts", []):
        if not sc.get("reported_url") or (only and only not in sc["reported_url"]):
            continue  # URL-less scripts are injected by the driver (Playwright's utility script), not the site
        text = texts.get(sc["script_id"], "")
        for f in sc["functions"]:
            r = f["ranges"][0]  # first range is the whole function; nested block ranges must not be summed
            key = (sc["reported_url"], r["start_offset"])
            prev = fns.get(key)
            if prev is None or r["count"] > prev["count"]:
                fns[key] = {"name": f["name"] or "(anonymous)", "url": sc["reported_url"],
                            "start": r["start_offset"], "end": r["end_offset"], "count": r["count"],
                            "text": text}
    return fns, secs, d.get("evidence_id")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("action")
    ap.add_argument("--baseline")
    ap.add_argument("--top", type=int, default=40)
    ap.add_argument("--grep", default="", help="comma list; keep names or bodies matching any")
    ap.add_argument("--context", type=int, default=220, help="chars of source to show per function")
    ap.add_argument("--min-ratio", type=float, default=3.0, help="action rate / baseline rate to count as 'rose'")
    ap.add_argument("--only", default="", help="keep scripts whose URL contains this (drop analytics, chat widgets)")
    ap.add_argument("--md")
    a = ap.parse_args()

    act, asec, aid = load(a.action, a.only)
    base, bsec, bid = (load(a.baseline, a.only) if a.baseline else ({}, 1, None))
    pats = [p.strip().lower() for p in a.grep.split(",") if p.strip()]

    rows = []
    for k, f in act.items():
        if f["count"] <= 0:
            continue
        rate = f["count"] / asec
        b = base.get(k)
        brate = (b["count"] / bsec) if b else 0.0
        if a.baseline and brate > 0 and rate / brate < a.min_ratio:
            continue
        body = f["text"][f["start"]:f["end"]] if f["text"] else ""
        if pats and not any(p in f["name"].lower() or p in body.lower() for p in pats):
            continue
        rows.append((rate - brate, rate, brate, f, body))
    rows.sort(key=lambda r: -r[0])

    out = [f"# Hot path: {a.action}" + (f" minus {a.baseline}" if a.baseline else ""),
           f"Evidence {aid}" + (f", baseline {bid}" if bid else ""),
           f"{len(rows)} functions kept (of {sum(1 for f in act.values() if f['count'] > 0)} that ran).", "",
           "| calls/s | base/s | function | where | source |", "|---:|---:|---|---|---|"]
    for gain, rate, brate, f, body in rows[: a.top]:
        snippet = re.sub(r"\s+", " ", body[: a.context]).replace("|", "\\|")
        where = f"{f['url'].rsplit('/', 1)[-1]}@{f['start']}"
        out.append(f"| {rate:.0f} | {brate:.0f} | `{f['name']}` | {where} | `{snippet}` |")
    text = "\n".join(out)
    if a.md:
        open(a.md, "w").write(text + "\n")
    print(text)


if __name__ == "__main__":
    sys.exit(main())
