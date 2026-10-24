#!/usr/bin/env python3
"""Motion-stack fingerprint for a captured reference site.

REA's own bundle fingerprints stop at frameworks (webpack, Vite, React, Vue,
Next, Angular, Svelte). This adds what a motion teardown needs: animation,
scroll, WebGL, physics and audio libraries with versions where the bundle
states them, every GLSL/WGSL shader string (written out as files), easing
constants, reduced-motion handling, and the asset inventory REA saw.

  fingerprint.py --scripts <export_dir>/files [--page page.json] [--out teardown/]

Writes <out>/stack.md and <out>/shaders/*.glsl|.wgsl. Every row cites file@offset
so a finding can be re-checked in the exported source.
"""
import argparse, collections, json, os, re, sys

# (label, category, regexes). A hit on any regex counts; first hit is cited.
SIGS = [
    ("GSAP", "animation", [r"GreenSock", r"\bgsap\.registerPlugin", r"_gsap\b"]),
    ("GSAP ScrollTrigger", "scroll", [r"ScrollTrigger"]),
    ("GSAP ScrollSmoother", "scroll", [r"ScrollSmoother"]),
    ("GSAP SplitText", "type", [r"SplitText"]),
    ("GSAP Flip", "animation", [r"\bFlip\.(?:getState|from)"]),
    ("GSAP Observer", "input", [r"\bObserver\.create"]),
    ("GSAP MorphSVG / DrawSVG", "svg", [r"MorphSVGPlugin|DrawSVGPlugin"]),
    ("Motion / Framer Motion", "animation", [r"framer-motion|motion-dom|useMotionValue|animateMini"]),
    ("anime.js", "animation", [r"animejs|anime\.timeline"]),
    ("Theatre.js", "animation", [r"@theatre/|theatre-studio"]),
    ("Lottie", "animation", [r"bodymovin|lottie-web|\blottie\.loadAnimation"]),
    ("Rive", "animation", [r"@rive-app|rive\.wasm"]),
    ("Lenis", "scroll", [r"lenis-smooth|lenis-scrolling|new Lenis\(|\bLenis\b"]),
    ("Locomotive Scroll", "scroll", [r"locomotive-scroll|data-scroll-container"]),
    ("Barba.js", "transitions", [r"data-barba|@barba/"]),
    ("Swup", "transitions", [r"\bswup\b"]),
    ("Taxi.js", "transitions", [r"data-taxi"]),
    ("SplitType / Splitting", "type", [r"split-type|SplitType|Splitting\("]),
    ("three.js", "webgl", [r"WebGLRenderer", r"THREE\."]),
    ("three.js EffectComposer", "webgl", [r"EffectComposer"]),
    ("three.js GLTF / Draco / KTX2", "assets", [r"GLTFLoader|DRACOLoader|KTX2Loader|MeshoptDecoder"]),
    ("OGL", "webgl", [r"\bogl\b|new Renderer\(\{[^}]*dpr"]),
    ("PixiJS", "webgl", [r"PIXI\.|pixi\.js"]),
    ("Babylon.js", "webgl", [r"BABYLON\."]),
    ("PlayCanvas", "webgl", [r"pc\.Application|playcanvas"]),
    ("Spline", "webgl", [r"@splinetool|splinecode"]),
    ("Unity WebGL", "webgl", [r"createUnityInstance|UnityLoader"]),
    ("WebGPU", "gpu", [r"navigator\.gpu|requestAdapter\("]),
    ("WebGL 2", "gpu", [r"[\"']webgl2[\"']"]),
    ("Matter.js", "physics", [r"Matter\.Engine|matter-js"]),
    ("cannon-es / Rapier / Ammo", "physics", [r"cannon-es|@dimforge/rapier|Ammo\("]),
    ("Howler", "audio", [r"\bHowler\b|new Howl\("]),
    ("Tone.js", "audio", [r"\bTone\.(?:Transport|Synth|Player)"]),
    ("Web Audio (raw)", "audio", [r"createBiquadFilter|createConvolver|new AudioContext|webkitAudioContext"]),
    ("Swiper", "ui", [r"swiper-wrapper|new Swiper\("]),
    ("Embla", "ui", [r"embla"]),
    ("Astro", "framework", [r"astro-island|_astro/"]),
    ("Nuxt", "framework", [r"__NUXT__"]),
    ("Webflow", "framework", [r"Webflow\.push|w-webflow"]),
    ("Framer (site builder)", "framework", [r"framerusercontent|__framer"]),
]
VERSIONS = [
    ("three.js", r"REVISION\s*=\s*[\"'](\d{2,3})"),
    ("GSAP", r"\* (?:GSAP|gsap) (3\.\d+\.\d+)|version\s*:\s*[\"'](3\.\d+\.\d+)[\"']"),
    ("GSAP SplitText", r"SplitText (\d+\.\d+\.\d+)"),
    ("GSAP ScrollTrigger", r"ScrollTrigger (\d+\.\d+\.\d+)"),
    ("Lenis", r"lenis[^\n]{0,40}?version[\"']?\s*[:=]\s*[\"'](\d+\.\d+\.\d+)"),
]
EASE_PATTERNS = [
    r"cubic-bezier\([^)]{5,40}\)",
    r"[\"'](?:power[0-4]|expo|circ|back|elastic|sine|quad|cubic|quart|quint)\.(?:in|out|inOut)[\"']",
    r"CustomEase\.create\([^)]{0,120}\)",
    r"linear\((?:[\d.,% ]{10,200})\)",
]
SHADER = re.compile(r"(?:`|\")((?:[^`\"\\]|\\.){0,40000}?(?:void\s+main\s*\(|@fragment|@vertex|@compute)(?:[^`\"\\]|\\.){0,40000}?)(?:`|\")", re.S)
RM = re.compile(r"prefers-reduced-motion[^\"'`]{0,40}")


def cite(path, text, m):
    a = m.start()
    snip = re.sub(r"\s+", " ", text[max(0, a - 40): a + 80]).replace("|", "\\|")
    return f"{os.path.basename(path)}@{a}", snip


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--scripts", required=True, help="the files/ dir written by rea export-web-scripts")
    ap.add_argument("--page", help="rea inspect-web-page JSON (adds assets and source-map declarations)")
    ap.add_argument("--extra", nargs="*", default=[], help="more text files to scan, e.g. fetched CSS")
    ap.add_argument("--out", default="teardown")
    a = ap.parse_args()
    os.makedirs(os.path.join(a.out, "shaders"), exist_ok=True)

    files = []
    for root, _, names in os.walk(a.scripts):
        files += [os.path.join(root, n) for n in names if not n.endswith(".map")]
    files += a.extra
    texts = {}
    for f in files:
        try:
            texts[f] = open(f, encoding="utf-8", errors="replace").read()
        except OSError:
            pass

    stack, versions, eases, rm_hits, shaders = [], {}, collections.Counter(), [], []
    for label, cat, pats in SIGS:
        for f, t in texts.items():
            m = next((m for p in pats for m in [re.search(p, t)] if m), None)
            if m:
                where, snip = cite(f, t, m)
                stack.append((cat, label, where, snip))
                break
    for label, pat in VERSIONS:
        for t in texts.values():
            m = re.search(pat, t)
            if m:
                versions[label] = next(g for g in m.groups() if g)
                break
    for f, t in texts.items():
        for p in EASE_PATTERNS:
            for m in re.finditer(p, t):
                eases[m.group(0)] += 1
        for m in RM.finditer(t):
            rm_hits.append(cite(f, t, m))
        for i, m in enumerate(SHADER.finditer(t)):
            body = m.group(1).encode().decode("unicode_escape", errors="replace") if "\\n" in m.group(1) else m.group(1)
            kind = "wgsl" if ("@fragment" in body or "@vertex" in body or "@compute" in body) else "glsl"
            name = f"{len(shaders):03d}-{os.path.basename(f)[:24]}-{m.start()}.{kind}"
            open(os.path.join(a.out, "shaders", name), "w").write(body)
            uniforms = sorted(set(re.findall(r"uniform\s+(?:(?:lowp|mediump|highp)\s+)?\w+\s+(\w+)", body)))
            shaders.append((name, len(body), uniforms[:12]))

    assets, maps = [], []
    if a.page:
        n = json.load(open(a.page)).get("normalized_result", {})
        for r in n.get("resources") or []:
            u = r.get("url"); u = u.get("url") if isinstance(u, dict) else u
            if u and not u.startswith("blob:"):
                assets.append((r.get("type"), r.get("mime_type"), r.get("content_size"), u))
        sc = n.get("scripts") or {}
        for s in (sc.get("items") if isinstance(sc, dict) else sc) or []:
            if s.get("source_map_url"):
                maps.append((s["url"], s["source_map_url"]))

    L = ["# Motion stack fingerprint", "",
         "Signature hits are **inferred** from strings in the shipped bundle (a library can be bundled and unused). "
         "Confirm anything load-bearing with the execution hot path (hotpath.py) before writing it into a skill.", "",
         "## Libraries", "", "| category | library | version | first hit | context |", "|---|---|---|---|---|"]
    for cat, label, where, snip in sorted(stack):
        L.append(f"| {cat} | {label} | {versions.get(label, '')} | {where} | `{snip}` |")
    if not stack:
        L.append("| | none matched | | | |")
    L += ["", "## Reduced motion", ""]
    L += [f"- {w}: `{s}`" for w, s in rm_hits[:20]] or ["- **No `prefers-reduced-motion` in any captured script.** Check the CSS too (pass it with --extra) and compare the reduce/no-preference screenshot pairs before concluding the site ignores it."]
    L += ["", "## Easing constants (most used first)", ""]
    L += [f"- `{e}` ×{c}" for e, c in eases.most_common(25)] or ["- none found as literals"]
    L += ["", f"## Shaders ({len(shaders)} written to shaders/)", ""]
    L += [f"- {n} ({b} chars) uniforms: {', '.join(u) or '—'}" for n, b, u in shaders[:60]]
    L += ["", "## Source maps declared", ""]
    L += [f"- {s} → {m}" for s, m in maps] or ["- none (minified only; rely on hot path + shaders)"]
    by = collections.Counter(t for t, *_ in assets)
    L += ["", f"## Assets REA saw ({', '.join(f'{k} {v}' for k, v in by.most_common())})", ""]
    heavy = [x for x in assets if (x[1] or "").split("/")[0] in ("video", "model", "font") or re.search(r"\.(glb|gltf|ktx2|basis|drc|hdr|exr|bin|wasm|riv|json)(\?|$)", x[3])]
    L += [f"- {t} {m} {s or '?'} B {u}" for t, m, s, u in heavy[:80]]
    out = "\n".join(L) + "\n"
    open(os.path.join(a.out, "stack.md"), "w").write(out)
    print(out)


if __name__ == "__main__":
    sys.exit(main())
