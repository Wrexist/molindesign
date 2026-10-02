# Molin Design — working notes

## Design skills library (`.claude/skills/`)
Before building or redesigning any website, check these skills and apply the relevant ones. They were distilled from the real source of award-winning motion sites: amv.tarunvishwakarma.dev, oryzo.ai, hubtown.co.in, brand.ivress.co.jp, by-kin.com, uncommonstudio.com.au (uncommondesign.group), matvoyce.tv, minhpham.design, iventions.com, santionispirits.com, why.zero.university, ponpon-mania.com, paodao.fr, Shopify Editions Spring 2026 and sleep-well-creatives.com. Cartier and Nothin' were unreachable and contributed nothing.

Skills label what was read from source versus inferred (and add reduced-motion fallbacks where the source had none). Trust the labels.

**Start here:** `immersive-site-playbook` (architecture, tokens, checklists), then `premium-micro-details` as the final polish pass on every site.

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

**WebGL / 3D**
- `scissor-view-webgl-slots` — many 3D slots in a DOM page with one canvas.
- `instanced-grass-and-snow-parallax` — instanced grass and parallax-occlusion snow.

**Audio**
- `web-audio-soundscape` — opt-in live-mixed audio, muffle filter, procedural sounds.
- `scroll-velocity-whoosh-audio` — whoosh and low-pass driven by scroll velocity.

Guidance from the sources worth remembering: commit to one hard idea per site and budget everything around it; keep native scroll and accessibility intact where possible; most reference sites ship no `prefers-reduced-motion` handling, so always add it.

Existing demos (`singha-thai/`, `maya-haglund/`) are static GitHub Pages sites; keep relative asset paths and no required build step unless a project already uses one. Always honour `prefers-reduced-motion`.
