#!/usr/bin/env python3
"""Flag narration and captions that sound written by an AI.

    python3 film/tools/scriptlint.py film/<slug>/vo/script.json [more.json | seo.md ...]

Why: ernestosoftware's post (Nov 2026, 125k views on a Claude-made reel) sells a skill whose promise
is that Claude "stops sounding like AI". The skill itself is behind a follow gate, so this list is
ours, not his: the phrases people now read as AI copy, plus the factory's own script rules.

Reads every line's `text` (and `say`) in a script.json, or every line of a text/markdown file.
- FAIL  a stock AI phrase (list below) or an em dash in narration
- WARN  a sentence over 12 words, a "not X, it's Y" frame, an opener that delays the hook,
        or a hedge word that softens a claim
Exit code 1 on any FAIL.
"""
import json
import re
import sys

# Phrases that read as machine-written copy. Lower-case, matched on word boundaries.
FAIL_PHRASES = [
    "delve", "dive into", "dive in", "deep dive", "let's dive", "let's explore", "let's break it down",
    "let's unpack", "unpack this", "in today's world", "in today's digital", "in the world of",
    "in the realm of", "ever-evolving", "ever-changing", "fast-paced world", "landscape of",
    "game-changer", "game changer", "revolutionize", "revolutionizing", "unlock the", "unleash",
    "harness the power", "the power of", "elevate your", "seamless", "seamlessly", "cutting-edge",
    "testament to", "tapestry", "navigate the", "it's important to note", "it's worth noting",
    "rest assured", "buckle up", "here's the kicker", "and the best part", "stay tuned",
    "without further ado", "in this video", "in conclusion", "at the end of the day", "mind-blowing",
    "you won't believe", "nobody is talking about", "smash that", "like and subscribe",
]
# Tired but not always wrong: say why the line needs it, or find the plain version.
WARN_PHRASES = ["here's the secret", "here's the thing", "here's the trick", "the truth is", "plot twist",
                "but here's", "the best part", "let that sink in", "think about that"]
OPENERS = ["did you know", "have you ever", "ever wondered", "ever wonder", "imagine a world",
           "so, ", "hey ", "hi ", "welcome", "today we", "today i"]
HEDGES = ["basically", "essentially", "literally", "actually", "truly", "incredibly", "arguably",
          "in many ways", "a variety of", "various"]
NOT_X_ITS_Y = re.compile(r"\b(it's|it is|this is|that's)\s+not\s+(just\s+)?[^.,;]+[,;.]\s*(it's|it is|this is|that's)\b", re.I)
NOT_JUST_BUT = re.compile(r"\bnot (just|only) [^.]+? but (also )?\b", re.I)


def lines_of(path):
    if path.endswith(".json"):
        data = json.load(open(path))
        for ln in data.get("lines", []):
            for key in ("text", "say"):
                if ln.get(key) and not (key == "say" and ln[key] == ln.get("text")):
                    yield f"{ln.get('id', '?')}.{key}", ln[key]
    else:
        for i, text in enumerate(open(path, encoding="utf-8"), 1):
            if text.strip():
                yield f"line {i}", text.strip()


def has(phrase, low):
    return re.search(r"(?<![a-z])" + re.escape(phrase) + r"(?![a-z])", low) is not None


def check(path):
    out, narration = [], path.endswith(".json")
    first = True
    for where, text in lines_of(path):
        low = text.lower().replace("’", "'")
        for p in FAIL_PHRASES:
            if has(p, low):
                out.append(f"FAIL  {where}: \"{p}\" reads as AI copy: \"{text}\"")
        for p in WARN_PHRASES:
            if has(p, low):
                out.append(f"WARN  {where}: \"{p}\" is a stock turn; keep it only if nothing plainer works: \"{text}\"")
        if narration and "—" in text:
            out.append(f"FAIL  {where}: em dash in narration; use a full stop or a comma: \"{text}\"")
        if narration and where.endswith(".text"):
            for sent in re.split(r"(?<=[.?!])\s+", text):
                if len(sent.split()) > 12:
                    out.append(f"WARN  {where}: a {len(sent.split())}-word sentence; split anything over 12: \"{sent}\"")
        if NOT_X_ITS_Y.search(text) or NOT_JUST_BUT.search(text):
            out.append(f"WARN  {where}: \"not X, it's Y\" frame is the most common AI tell; say Y straight: \"{text}\"")
        if first and narration and any(low.startswith(o) for o in OPENERS):
            out.append(f"WARN  {where}: the hook opens with a warm-up; start on the stake: \"{text}\"")
        for h in HEDGES:
            if has(h, low):
                out.append(f"WARN  {where}: hedge \"{h}\" softens the line; cut it or give the number: \"{text}\"")
        if where.endswith(".text"):
            first = False
    return out


def main():
    paths = sys.argv[1:]
    if not paths:
        sys.exit(__doc__)
    results = []
    for p in paths:
        r = check(p)
        results += r
        print(f"{p}: " + ("OK" if not r else f"{sum(x.startswith('FAIL') for x in r)} fail, {sum(x.startswith('WARN') for x in r)} warn"))
    print("\n".join(results))
    sys.exit(1 if any(x.startswith("FAIL") for x in results) else 0)


if __name__ == "__main__":
    main()
