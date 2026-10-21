---
name: reverse-engineer-reference-site
description: Tear down a reference motion website (or Electron app, web game, Lottie/Rive/WASM effect) with REA, "Reverse Engineer Anything" (github.com/morluto/rea, MIT), and distill what you find into one of our skills. One command captures the page, exports its scripts, fingerprints the motion stack (GSAP, Lenis, three.js, shaders, easings), records which functions actually run while you scroll or move the pointer minus an idle baseline, lists event handlers, and shoots step screenshots with reduced motion off and on. Use whenever a brief says "like <site>", when adding a skill distilled from a site, when checking a rebuild against its reference, or when a value in a skill is labelled inferred and could be verified.
---

# Reverse-engineer a reference site (with REA)

**Verified** = read in REA's source/docs (morluto/rea @ 82e4e03, npm `rea-agents` 6.7.0) or measured in this container on oryzo.ai and by-kin.com (Oct 2026). **Inferred** = our reasoning, not measured.

Every skill in `.claude/skills/` was distilled from a site's real source. Until now that meant reading a 1 MB minified bundle by hand and guessing which part ran. REA turns that into evidence: it attaches to Chrome over CDP, keeps every observation with an Evidence ID, and (the part that matters most) can record **precise V8 execution counts during an interaction**. Subtract an idle window and what is left is the code that reacts to scroll or pointer. On oryzo.ai that took the 484 bundle functions that ran while scrolling down to 123, led by the scroll-driven prop physics (`integrate` with `Math.exp(-dt*damping)`, `updateOscillation`, `getInteraction`) and the wheel/scroll manager (`_onWheel` clamps each wheel delta to ±200 px). Without the subtraction those were buried under three.js math.

## 0. What REA is, and what we use (verified)
REA is an MCP server plus CLI (`rea`, 140+ commands) that bridges an agent to analysis tools: Hopper/Ghidra/IDA for native binaries, plus built-in analysers for JavaScript/Electron, .NET, Android, WASM, Unity IL2CPP metadata, Godot PCK, HAR/SAZ captures, SQLite and more. **About 10 of its tools matter to a motion studio**; the rest (native decompilation, firmware, packets, EVM, crash dumps) do not, unless a reference is a desktop app or a game.

| Our question | REA tool (CLI = MCP name with dashes) |
|---|---|
| What does the page load? DOM shape, scripts with source, resources, console | `inspect_web_page` (+ `--include-script-sources --include-console-text`) |
| Give me the scripts as files | `export_web_scripts` (→ `files/` + `manifest.json`) |
| Which code runs while I scroll / move the pointer? | `observe_web_execution` (precise coverage, call counts, UTF‑16 offsets) |
| Who listens on this element? | `inspect_web_event_listeners <css>` (direct listeners only; not window, not delegated) |
| Frameworks, chunk graph, routes, source maps | `analyze_web_bundle` (frameworks only: webpack, Vite, React, Vue, Next, Angular, Svelte) |
| Screenshots after scripted steps, motion prefs, viewport | `capture_browser_scenario` (Playwright; launch or connect mode) |
| How different are two frames? | `compare_web_screenshots` (pixel ratio, max/mean channel delta) |
| Our rebuild vs the reference, step by step | `compare_web_captures` on two scenarios with the same step IDs |
| A site that blocks headless | `inspect_web_network_capture` on a HAR saved from Isac's own browser |
| Desktop app UI motion (an Electron app Isac owns) | `analyze_javascript_application` on its `app.asar`, `trace_application_feature` |
| Web game / effect binaries | `inspect_wasm_artifact` (needs WABT), `inspect_il2cpp_metadata` (Unity `global-metadata.dat`), Godot PCK inventory |

What REA **doesn't** do, so our scripts fill the gap (verified in source): no scroll, wheel or hover action in scenarios (only goto, click, fill, press, select_option, check, uncheck, wait_for, wait_for_timeout); no animation/WebGL library fingerprints; never fetches source maps, CSS bodies or assets; never evaluates page JS.

## 1. Install (no repo dependency)
- **Get it only from** `github.com/morluto/rea`, `rea.tools` or npm `rea-agents`. A trojanised look-alike repo circulated in Oct 2026; never clone a fork or "Reverse-Engineer-anything" mirror.
- CLI, pinned, no global install: `REA="npx -y rea-agents@6.7.0"`. Faster for repeated runs: `npm i rea-agents@6.7.0` in a scratch dir and use `node_modules/.bin/rea`; that dir also gives `playwright-core` for `drive.mjs` (`REA_NODE_MODULES=<dir>/node_modules`).
- Needs Node ≥ 22.19 (container has 22.22) and a Chrome-family browser: here `/opt/pw-browsers/chromium-*/chrome-linux/chrome`. On Linux, Electron/JS application analysis also needs a procps `ps`.
- **MCP** (optional, nicer inside Claude Code): `npx -y rea-agents@latest setup --client claude_code --dry-run --json`, show Isac the plan (it edits agent config and installs REA's own skill), apply with `--yes` only after he approves, then restart the agent. Tool names in the table above become callable. The CLI and MCP produce the same Evidence.

## 2. One command
```sh
S=.claude/skills/reverse-engineer-reference-site/scripts
REA=<scratch>/node_modules/.bin/rea REA_NODE_MODULES=<scratch>/node_modules \
  bash $S/teardown.sh https://oryzo.ai/ <scratch>/teardown/oryzo --pointer --steps 6
```
It launches its own headless Chrome (port 9333, temp profile, killed on exit), then runs seven stages and writes `README.md` with every Evidence ID. **Write teardowns to the scratchpad, never into the repo**: they hold third-party code. Only our distilled skill goes in the repo. Typical run: 4–6 min; the scenario stage dominates because WebGL renders in software here (~13–20 s per screenshot step on oryzo, measured).

| Stage | Output | What to look for |
|---|---|---|
| 1 page capture | `page.json` | resources (fonts, videos, textures), console warnings, script URLs |
| 2 export + fingerprint | `scripts/`, `stack.md`, `shaders/` | libraries + versions, easing literals, every shader, `prefers-reduced-motion` mentions, assets |
| 3 coverage | `idle.json`, `scroll.json`, `hot-scroll.md` (+ `pointer.json`, `hot-pointer.md`) | functions whose call rate rose ≥ 3× over idle, with source excerpts and `file@offset` |
| 4 listeners | `listeners-{html,body,canvas}.json` | wheel/touch/pointer handlers, passive flags, source location |
| 5 scenarios | `capture-{no-preference,reduce}.json` | step screenshots at 1440×900 |
| 6 frames | `frames/sheet.jpg`, `motion-pref.md` | per-step pixel change reduce vs no-preference |

The pieces also run alone: `drive.mjs <cdp> <url-part> "top+wheel:30x400@140+sweep+hover:.btn+drag:200,400,900,400"`, `hotpath.py action.json --baseline idle.json --grep scroll,wheel,lerp`, `fingerprint.py --scripts files --page page.json --extra site.css`, `frames.py a.json b.json`.

## 3. Reading the results (the method)
1. **`stack.md` first.** It decides which of our skills the site maps to: GSAP + ScrollTrigger/ScrollSmoother + Lenis → `scroll-driven-chapters` / `inertial-scroll-ranges`; three.js + many post shaders → `scroll-scrubbed-webgl-sections`, `gpu-tier-adaptive-quality`; SplitText → `char-split-scroll-reveal`. Hits are **string matches** (inferred): a library can be bundled and never run. by-kin.com showed GSAP 3.12.5, ScrollTrigger, ScrollSmoother, Lenis, Swiper and 65× `power3.out` (measured).
2. **`hot-scroll.md` is the map into the bundle.** Read the top 20 app-level names (skip vector/matrix math; drop analytics and widgets with `--only <bundle path>`: on oryzo the Cloudflare beacon added 29 functions), open `scripts/files/...` at the cited offset and read outward. Counts are per second over the window; nested ranges are never summed (REA's rule). If almost nothing rose, the page didn't scroll: `drive.mjs` warns when `docH ≤ viewport` (by-kin's home is one screen; pick a deeper URL), and a virtual-scroll site shows its wheel handler but no native scroll.
3. **Shaders are the most transferable thing.** `shaders/*.glsl` with their uniform names reads like a feature list: oryzo ships 117, including a curl-noise paint/fluid pass (`u_curlStrength`, `u_dissipations`), bokeh DoF (`u_maxCoC`, `u_lensCoeff`), gobo light projection, SMAA and a temporal history blend (measured). Understand the technique, then **write our own**; don't paste.
4. **Listeners**: `inspect_web_event_listeners` gives callback source and flags for direct listeners on one node. Window/document listeners and framework-delegated handlers are invisible to it; find those through the hot path instead.
5. **Reduced motion is a verified fact now, not a guess.** Read `motion-pref.md` together with the sheet: by-kin's load step differs 95.7% (its intro is skipped under `reduce`), oryzo's scroll steps differ ≤ 0.3% (it ignores the setting). Differences can also be timing noise in a live animation, so look at the frames before concluding. Whatever the reference does, our skill ships a fallback.
6. **Numbers to steal**: easing literals in `stack.md`; damping, clamps and ranges from the hot functions (e.g. `math.clamp(t,-200,200)` on wheel deltas, `Math.exp(-e*t)` damping); durations from GSAP calls near the hot path. Label each one verified with `file@offset` from the teardown.
7. Write the finding ledger into the new skill's header the way every skill here does: what was read in source (verified + where), what was inferred, what is missing (e.g. CSS not captured).

## 4. Rebuild parity check
Run the same `capture_browser_scenario` (same `step_id`s, viewport, `reduced_motion`) against the reference and against our local build (`python3 -m http.server` + `start_url` on 127.0.0.1), then `compare_web_screenshots` step by step or `compare_web_captures` for the whole run. Use it as a regression check on layout and timing, not a target of 0%: we rebuild the technique, not the site.

## 5. Gotchas (all measured here)
- Scenario defaults are **1280×720 and `reduced_motion: "reduce"`**. A motion teardown with defaults captures the reduced site. Always set `environment.viewport` and `reduced_motion` explicitly.
- `press` on `body` timed out on oryzo (fixed-canvas layout); `html` works.
- A step's `timeout_ms` also has to cover the screenshot; 5000 ms failed on WebGL pages. Omit it.
- `analyze_javascript_application` on one minified 1.1 MB bundle produced a 51 MB Evidence file; useful for Electron apps and source-mapped chunks, not for a single web bundle.
- `inspect_web_page` lists ~100 resources and never CSS bodies. Fetch the stylesheet URLs yourself (`curl`) and pass them to `fingerprint.py --extra` for CSS easings, keyframes and reduced-motion queries.
- Execution coverage disables optimisation and resets counters during the window: timing-sensitive code can behave differently while observed. Use counts as "this ran, this often", not as performance data.
- `drive.mjs` injects Playwright's utility script; `hotpath.py` drops URL-less scripts for that reason.
- `pkill -f remote-debugging-port` also matches your own shell command; kill by PID (teardown.sh does).

## 6. Rules (REA's DISCLAIMER + ours)
- Public pages, the way a visitor sees them. Don't bypass logins, paywalls, bot protection or rate limits; if a site blocks headless Chrome, ask Isac for a HAR from his browser and use `inspect_web_network_capture`.
- Learn techniques, numbers and structure; **never copy code, shaders or assets** into our sites or skills. Rewrite from the understanding, the same way the existing skills were made.
- Desktop apps, games and binaries only if Isac owns or is licensed to use them, and REA's DISCLAIMER covers the purpose (interoperability, education). No DRM, licence or anti-cheat work, ever.
- Teardown folders stay in the scratchpad; the skill records the source URL, date and Evidence IDs instead.

Related: `immersive-site-playbook` (decide the one hard idea after the teardown), `premium-micro-details` (reduced-motion fallback), every skill whose header says "values verified in source".
