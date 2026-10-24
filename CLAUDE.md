# Molin Design — working notes

## Design skills library (`.claude/skills/`)
Before building or redesigning any website, check these skills and apply the relevant ones. They were distilled from the real source of award-winning motion sites: amv.tarunvishwakarma.dev, oryzo.ai, hubtown.co.in, brand.ivress.co.jp, by-kin.com, uncommonstudio.com.au (uncommondesign.group), matvoyce.tv, minhpham.design, iventions.com, santionispirits.com, why.zero.university, ponpon-mania.com, paodao.fr, Shopify Editions Spring 2026 and sleep-well-creatives.com, plus the open-source UI libraries listed under Components. Cartier and Nothin' were unreachable and contributed nothing.

Every skill has a live demo in the Motion Library: https://wrexist.github.io/molindesign/skills-library/ (source in `skills-library/`; add a demo and a `skills-data.js` entry for each new skill, following `skills-library/demos/README.md`). `node tools/check-skills.mjs` lists anything missing.

**Showcase:** https://wrexist.github.io/molindesign/showcase/ (source in `showcase/`) puts every skill to work together on one launch page for a made-up camera, Halden LF‑1. Sections plug into the shell through `showcase/sections/README.md`; when a skill is added, use it somewhere there too and list it in that section's `data-skills`.

Skills label what was read from source versus inferred (and add reduced-motion fallbacks where the source had none). Trust the labels.

**Start here:** `site-kickoff` (one sentence → approved brief → `tools/new-site.sh`), `immersive-site-playbook` (architecture, tokens, checklists), then `premium-micro-details` as the final polish pass and `site-verification-loop` before every PR.

## New website workflow (plan → build → verify → review → remember)
Adapted from ECC (github.com/affaan-m/ECC): the plan comes before the code, checks run the same way every time, and a context that didn't write the change reviews it.
1. **Plan.** Write `<slug>/BRIEF.md` with `site-kickoff`: the one hard idea, a motion personality, sections in story order, and only the skills that have a job on this page (one line each saying what). Get it approved before building past the starter.
2. **Scaffold.** `tools/new-site.sh <slug> "Name" "one sentence"` copies `templates/site/` (tokens, reveals, reduced motion, 44 px targets, noindex, per-site `CLAUDE.md`).
3. **Build** only what the brief lists. Read a skill's SKILL.md when you reach its section, not all up front.
4. **Verify.** `node tools/check-site.mjs <slug>` (serves under `/molindesign/` like GitHub Pages; desktop, phone and reduced-motion runs). Look at the screenshots it saves.
5. **Review.** Run the `site-reviewer` agent (`.claude/agents/`) on the diff; give it the site dir, brief and check output, not your conclusions. Fix FAILs; fix WARNs or say why not in the PR, and paste the final check table there.
6. **Remember.** Site decisions go in the site's BRIEF.md log; lessons that apply to every site go into the skill they belong to; `node tools/check-skills.mjs` keeps CLAUDE.md, the Motion Library and the showcase in step.

A PostToolUse hook (`.claude/settings.json` → `tools/hooks/post-edit-check.mjs`) flags root-absolute paths, credentials and unpinned CDN scripts in any HTML/CSS/JS file as soon as it is written.

**Research (before distilling a new site)**
- `reverse-engineer-reference-site` — REA (Reverse Engineer Anything, MIT) teardown in one command: page capture, script export, motion-stack and shader fingerprint, functions that run on scroll/pointer minus idle, listeners, reduced-motion screenshot pairs; plus a rebuild-vs-reference parity check. Teardown output stays out of the repo.

**Intro / loading**
- `cinematic-loader` — silhouette-fill logo loader, rolling % counter, fly-through exit.
- `gpu-renderer-fallback-warmup` — WebGPU→WebGL2 selection, shader warm-up before the loader drops.
- `gpu-tier-adaptive-quality` — GPU tiers, DPR caps, per-tier asset budgets.

**Scroll & story structure**
- `scroll-driven-chapters` — scrubbed timeline, chapter picker, progress rail, telemetry, beats.
- `autoplay-scroll-film` — scroll-driven film that also autoplays; steerable autoscroll.
- `scroll-scrubbed-webgl-sections` — one fixed canvas, per-section ScrollTrigger timelines.
- `scroll-velocity-section-metrics` — smoothed velocity and per-section progress signals.
- `inertial-scroll-ranges` — native scroll driven by custom inertia; per-section range ratio.
- `gated-stage-scroll` — virtual-scroll "game level" stages with unlock gates.
- `gated-page-transitions` — cover → push → reveal route transitions.
- `clip-path-camera-wipes` — clip-path wipes that read as camera moves.

**Typography & layout**
- `masked-text-reveal` — line-mask headline reveals, blur-rise entrances.
- `char-split-scroll-reveal` — GSAP split-text engine with presets.
- `kinetic-variable-type` — variable-font weight/width morphing driven by pointer.
- `viewport-rem-grid-tokens` — viewport-scaled rem, column grid, easing/type tokens.
- `comic-panel-spot-color` — graphic-novel look with one spot color.
- `hud-cinematic-ui` — viewfinder/HUD chrome over 3D.

**Interaction**
- `reticle-cursor` — snapping bracket cursor with labels (fine pointers only).
- `cursor-mask-reveal` — noise-edged cursor flashlight reveal.
- `orbit-drag-reveal` — arc drag slider with spring-back and flick commit.
- `hold-to-advance` — press-and-hold with progress ring (needs keyboard alternative).
- `device-agnostic-input-actions` — action map over keyboard, gamepad, touch.
- `spring-input-physics` — second-order dynamics and velocity-push physics for hero props.
- `physics-on-flat-art` — Matter.js bodies driving 2D panels.
- `hotspot-callout-pins` — leader-line annotations tied to 3D/image points.
- `slide-over-drawer` — accessible tabbed side drawer.

**Components (product UI motion)** — from the sources of sonner, vaul, Radix UI, cmdk, number-flow and Motion, plus Emil Kowalski, Rauno Freiberg, Benji Taylor (Family), Linear and Vercel Geist
- `ui-motion-principles` — the rulebook: durations, easing, origin, frequency, when not to animate. Read before any UI animation.
- `interruptible-css-transitions` — transitions over keyframes for anything that can change mid-flight.
- `stacked-toasts` — Sonner-style stacked, swipeable toasts.
- `drag-sheet-drawer` — Vaul-style bottom sheet with snap points and background scale.
- `origin-aware-popovers` — menus, popovers, tooltips that grow from their trigger; delay groups.
- `command-palette-motion` — cmdk-style ⌘K palette with ranking and animated list height.
- `submenu-safe-triangle` — nested menus that survive diagonal pointer paths.
- `animated-number-flow` — per-digit rolling numbers, accessible.
- `button-state-morphs` — press feedback, async save, copy check, hold-to-delete.
- `shared-element-flip` — card → detail and list reorder with FLIP / View Transitions.
- `sliding-indicator-tabs` — tabs and segmented controls with a gliding indicator.
- `morphing-tray` — Family-style container that morphs between states.

**WebGL / 3D**
- `scissor-view-webgl-slots` — many 3D slots in a DOM page with one canvas.
- `instanced-grass-and-snow-parallax` — instanced grass and parallax-occlusion snow.

**Film & video**
- `code-rendered-film` — a film written in code: render(t) contract, motion blur, procedural score, headless render to MP4, loudnorm, readcheck, AI-jury loop. Working example: `film/` (Halden LF‑1 “Held”, live at https://wrexist.github.io/molindesign/film/).
- `film-voiceover` — narration for those films: retention script rules, voice choice, slot fitting, word-timed captions, Whisper listen checks, ducking from word times. Local Kokoro-82M TTS (Apache-2.0) via `film/tools/voiceover.py`; example `film/vo/script.json` → `film/out/halden-lf1-held-vo.mp4`.

**Workflow**
- `site-kickoff` — plan before code: one sentence → BRIEF.md (hard idea, motion personality, skills with a job, budgets) → approval → `tools/new-site.sh`.
- `site-verification-loop` — `tools/check-site.mjs`, then the `site-reviewer` agent, evidence in the PR, lessons back into skills.

**Audio**
- `web-audio-soundscape` — opt-in live-mixed audio, muffle filter, procedural sounds.
- `scroll-velocity-whoosh-audio` — whoosh and low-pass driven by scroll velocity.

Guidance from the sources worth remembering: commit to one hard idea per site and budget everything around it; keep native scroll and accessibility intact where possible; most reference sites ship no `prefers-reduced-motion` handling, so always add it.

Existing demos (`singha-thai/`, `maya-haglund/`) are static GitHub Pages sites; keep relative asset paths and no required build step unless a project already uses one. Always honour `prefers-reduced-motion`.
