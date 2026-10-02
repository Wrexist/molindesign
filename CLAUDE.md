# Molin Design — working notes

## Design skills library (`.claude/skills/`)
Before building or redesigning any website, check these skills and apply the relevant ones. They were distilled from https://amv.tarunvishwakarma.dev/ (a cinematic, interactive 3D showpiece).

- `immersive-site-playbook` — start here for premium/cinematic/3D/"wow" briefs; architecture, tokens, checklists, and which skill to load next.
- `cinematic-loader` — silhouette-fill logo loader, rolling % counter, fly-through exit.
- `masked-text-reveal` — line-mask headline reveals and blur-rise entrances.
- `hud-cinematic-ui` — viewfinder/HUD chrome: brackets, labels, spec rows, vignette, single accent.
- `reticle-cursor` — snapping bracket cursor with labels (fine pointers only).
- `orbit-drag-reveal` — arc drag slider with spring-back, flick commit and ARIA.
- `scroll-driven-chapters` — scrubbed timeline, chapter picker, progress rail, telemetry, beats.
- `hotspot-callout-pins` — leader-line annotations tied to 3D/image points.
- `slide-over-drawer` — accessible tabbed side drawer.
- `web-audio-soundscape` — opt-in live-mixed audio with muffle filter and procedural sounds.
- `premium-micro-details` — final polish/accessibility/metadata checklist (use on every site).

Existing demos (`singha-thai/`, `maya-haglund/`) are static GitHub Pages sites; keep relative asset paths and no required build step unless a project already uses one. Always honour `prefers-reduced-motion`.
