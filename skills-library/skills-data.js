// Generated from the frontmatter of .claude/skills/<id>/SKILL.md.
window.SKILLS = [
 {
  "id": "cinematic-loader",
  "cat": "Intro & loading",
  "desc": "Build a branded cinematic loading screen — logo/silhouette that fills bottom-to-top as it loads, rolling-digit 000–100% counter, then a camera \"fly-through\" into the logo with warp streaks that cuts to the site. Use whenever a site needs a preloader/intro (product reveals, car/hardware/fashion/portfolio sites). Derived from amv.tarunvishwakarma.dev.",
  "title": "Cinematic loader",
  "source": "amv.tarunvishwakarma.dev",
  "short": "Build a branded cinematic loading screen"
 },
 {
  "id": "gpu-renderer-fallback-warmup",
  "cat": "Intro & loading",
  "desc": "Robust boot sequence for a heavy WebGPU/WebGL scene — pick WebGPU else WebGL2 with a device-based downgrade, optionally move rendering to an OffscreenCanvas worker, cap DPR, shrink textures, cheapen CSS effects on the WebGL path, then \"warm up\" every scene state for a few hidden frames before dropping the loader so the first scroll never janks. Use for any Three.js/TSL cinematic site with several scenes and expensive shaders. From brand.ivress.co.jp (IVRESS \"Spin a Tale\"); verified in its shipped bundles.",
  "title": "Renderer fallback & warm-up",
  "source": "brand.ivress.co.jp",
  "short": "Robust boot sequence for a heavy WebGPU/WebGL scene"
 },
 {
  "id": "gpu-tier-adaptive-quality",
  "cat": "Intro & loading",
  "desc": "Quality-tier system for heavy WebGL/canvas motion sites — detect-gpu tier 0–3 at idle, mobile cap, blocklist/timeout fallback to a static tier 0, DPR cap by tier and resolution, per-tier asset resolution, effects switched off on low tiers, reduced-motion handling. Use whenever a site ships a WebGL hero, particle field or 3D scroll scene and must not jank on weak devices. From shopify.com/editions/spring2026 (verified in bundle code).",
  "title": "GPU-tier quality",
  "source": "shopify.com/editions",
  "short": "Quality-tier system for heavy WebGL/canvas motion sites"
 },
 {
  "id": "scroll-driven-chapters",
  "cat": "Scroll & story",
  "desc": "Pattern for a scroll/wheel-scrubbed, chaptered 3D or video \"film\" — scene table, progress rail with chapter ticks, animated chapter picker, live camera telemetry (mm, f-stop, focus), per-scene instrument readouts, timed text beats, and an \"explore\" free-orbit mode with Esc. Use for product stories, case studies, and any non-scrolling fixed-stage site. From amv.tarunvishwakarma.dev.",
  "title": "Scroll-driven chapters",
  "source": "amv.tarunvishwakarma.dev",
  "short": "Pattern for a scroll/wheel-scrubbed, chaptered 3D or video \"film\""
 },
 {
  "id": "autoplay-scroll-film",
  "cat": "Scroll & story",
  "desc": "A scroll-driven WebGL \"film\" that also plays by itself — a tall dummy scroll height split into scenes, Lenis + GSAP on one rAF, per-scene progress uniforms (0..1) that shaders window with smoothstep, an autoscroll driver the viewer can steer (scroll/arrow = direction, press-and-hold = slow to 0.2x), a click-to-start gate with a letter-by-letter blur prologue. Use for brand stories / case-study films with 5-8 scenes. From brand.ivress.co.jp (IVRESS \"Spin a Tale\"); numbers verified in source.",
  "title": "Autoplay scroll film",
  "source": "brand.ivress.co.jp",
  "short": "A scroll-driven WebGL \"film\" that also plays by itself"
 },
 {
  "id": "scroll-scrubbed-webgl-sections",
  "cat": "Scroll & story",
  "desc": "One fixed WebGL canvas behind a Webflow/HTML page where each section owns a paused GSAP timeline scrubbed by ScrollTrigger (scrub:true) — Lenis synced to the GSAP ticker, overlapping pre-roll windows, group.visible gating, class toggles for CSS, SplitText char fades. Use for scroll-driven 3D/illustrated narratives layered on normal DOM sections. From sleep-well-creatives.com (verified in its bundle).",
  "title": "Scrubbed canvas sections",
  "source": "sleep-well-creatives.com",
  "short": "One fixed WebGL canvas behind a Webflow/HTML page where each section owns a paused GSAP timeline scrubbed by ScrollTrigger (scrub:true)"
 },
 {
  "id": "scroll-velocity-section-metrics",
  "cat": "Scroll & story",
  "desc": "Reusable scroll signals for choreographed section transitions — a smoothed, clamped scroll velocity (-1..1) and per-section metrics (progress 0..1, transition -1..0..+1, screenOffset) computed from cached rects, feeding CSS variables or a WebGL/canvas effect (scroll-kicked fluid/particle disturbance). Use when sections should react to scroll speed and enter/exit progress rather than only scroll position. From shopify.com/editions/spring2026 (verified in bundle code).",
  "title": "Scroll velocity metrics",
  "source": "shopify.com/editions",
  "short": "Reusable scroll signals for choreographed section transitions"
 },
 {
  "id": "inertial-scroll-ranges",
  "cat": "Scroll & story",
  "desc": "Scroll architecture for award-style sites — keep NATIVE scroll (sticky, anchors, a11y intact) but drive it with custom exponential-ease wheel inertia + drag-flick friction, then derive a per-section \"range\" ratio (-1…0…1) every frame and write transforms/opacity/blur directly to DOM from it (staggered per-line/char with a fit()+ease helper). Includes the Lenis variant (lerp .04, scripted scrollTo 2 s, auto-drift). Use for single-hero-object / z-depth scroll stories where text, card and 3D layers must leave in sync. From oryzo.ai (Lusion) bundle; Lenis notes from hubtown.co.in (Unseen).",
  "title": "Inertial scroll ranges",
  "source": "oryzo.ai · hubtown.co.in",
  "short": "Scroll architecture for award-style sites"
 },
 {
  "id": "gated-stage-scroll",
  "cat": "Scroll & story",
  "desc": "Virtual-scroll \"game level\" structure — a fixed WebGL/DOM stage driven by a custom scroll manager with per-stage scroll lengths, input clamps, hold-locks, auto-scrolling gates, a hold-to-unlock transition between stages, a countdown ruler HUD (-100 BZ to 0 BZ), a gamified XP counter (+100 per stage, once), mouse/gyro parallax rig, and a finale reward reveal (certificate folds into an origami animal). Use for story/onboarding/recruitment sites where progress should feel earned and trackable. From why.zero.university (all numbers verified in its bundle).",
  "title": "Gated stage scroll",
  "source": "why.zero.university",
  "short": "Virtual-scroll \"game level\" structure"
 },
 {
  "id": "gated-page-transitions",
  "cat": "Scroll & story",
  "desc": "Route transitions and entrance choreography that never call attention to themselves — a state machine (cover → push → reveal) with Lenis stop/reset, a shared-image iris transition, and a \"play\" gate so every section's entrance (masked word lines, image scale-settle, hairline draw) fires only after the cover lifts, with a delay rule for above vs below the fold. Next.js App Router + GSAP + ScrollTrigger + Lenis. Use for any multi-page motion site. From by-kin.com and uncommonstudio.com.au.",
  "title": "Gated page transitions",
  "source": "by-kin.com · uncommondesign.group",
  "short": "Route transitions and entrance choreography that never call attention to themselves"
 },
 {
  "id": "clip-path-camera-wipes",
  "cat": "Scroll & story",
  "desc": "Section changes that read as camera moves instead of fades — a pinned hero that opens like a horizontal slit (clip-path polygon scrubbed by scroll), a drag/wheel slide wipe where two clipped layers pass each other with counter-parallax and a scale 1.2→1 settle, and a clipped image-sequence intro. GSAP + ScrollTrigger + clip-path, Lenis-friendly. Use for hero→content handoffs, case-study carousels, intros. From uncommonstudio.com.au (bundle read at uncommondesign.group) and by-kin.com.",
  "title": "Clip-path camera wipes",
  "source": "uncommondesign.group · by-kin.com",
  "short": "Section changes that read as camera moves instead of fades"
 },
 {
  "id": "masked-text-reveal",
  "cat": "Type & layout",
  "desc": "Premium text/UI entrance animations — headline lines sliding up from an overflow mask with stagger, and blur-fade-rise for small labels and panels, with reduced-motion fallback. Use for any hero headline, chapter title, caption or spec block that should appear/disappear in sync with a scene. From amv.tarunvishwakarma.dev.",
  "title": "Masked text reveal",
  "source": "amv.tarunvishwakarma.dev",
  "short": "Premium text/UI entrance animations"
 },
 {
  "id": "char-split-scroll-reveal",
  "cat": "Type & layout",
  "desc": "A reusable GSAP \"split text\" reveal engine - chars/lines split, masked entrance presets (2d rise, x slide, 3d rise with rotationX, plain fade), exact durations/staggers, once-only ScrollTrigger start with a size-aware threshold, hover re-roll, and revert/resplit on resize + fonts.ready. Use for headlines, nav links and labels on portfolio/agency sites. Sources - minhpham.design (app.bundle.js, GSAP 3.11 + split-type + Lenis), matvoyce.tv and iventions.com (same patterns, verified in bundles).",
  "title": "Char-split reveal",
  "source": "minhpham.design · matvoyce.tv · iventions.com",
  "short": "A reusable GSAP \"split text\" reveal engine"
 },
 {
  "id": "kinetic-variable-type",
  "cat": "Type & layout",
  "desc": "Kinetic typography with a variable font — every other letter morphs in the OPPOSITE direction along weight/width axes (wght 1000/wdth 60 narrow-heavy vs wght 700/wdth 150 wide), driven by pointer X with a GSAP quickTo smoother, plus a \"slot-machine roll\" intro where each letter spins through clones. Text stays real text (readable, selectable). Use for hero headlines, big CTA buttons and menu words that should feel alive without becoming illegible. Source - matvoyce.tv (F37 Judge variable font, GSAP + split-type, verified in its JS/CSS bundles).",
  "title": "Kinetic variable type",
  "source": "matvoyce.tv",
  "short": "Kinetic typography with a variable font"
 },
 {
  "id": "viewport-rem-grid-tokens",
  "cat": "Type & layout",
  "desc": "Design-token foundation used by two award-winning studio sites — viewport-scaled rem (design in px at 375/1440/1920, ship in rem so the layout scales like a poster), a 6/8/12-column CSS grid with a Shift+G debug overlay, four named easing tokens, restrained editorial type (grotesk + mono labels, tight negative tracking), and font-loading/perf basics. Use at project start for any editorial/motion site. From by-kin.com and uncommonstudio.com.au.",
  "title": "Viewport rem & grid",
  "source": "by-kin.com · uncommondesign.group",
  "short": "Design-token foundation used by two award-winning studio sites"
 },
 {
  "id": "comic-panel-spot-color",
  "cat": "Type & layout",
  "desc": "Art-direction recipe for a graphic-novel feel on a dark site — charcoal ground, black-and-white hatched illustration with one saturated spot colour (blood red) plus a muted gold, uppercase display type, hard-edged \"floating frames\" (comic panels) that open onto scenes, white disc cursor, red hover accents. Use for spirits/fashion/film/editorial brands wanting illustrated storytelling. From santionispirits.com (palette, type, UI numbers verified in CSS/bundle; panel implementation partly inferred).",
  "title": "Comic panel, spot colour",
  "source": "santionispirits.com",
  "short": "Art-direction recipe for a graphic-novel feel on a dark site"
 },
 {
  "id": "hud-cinematic-ui",
  "cat": "Type & layout",
  "desc": "Camera-viewfinder / HUD interface language for dark premium sites — corner-bracket frame, wide-stretch uppercase labels, mono/tabular numerics, hairline spec tables, vignette overlay, single orange accent, numbered \"[ Nº 01 / 24 ]\" framing. Use when designing UI chrome that must float over 3D or full-bleed imagery. From amv.tarunvishwakarma.dev.",
  "title": "Cinematic HUD",
  "source": "amv.tarunvishwakarma.dev",
  "short": "Camera-viewfinder / HUD interface language for dark premium sites"
 },
 {
  "id": "reticle-cursor",
  "cat": "Interaction",
  "desc": "Custom camera-reticle cursor — a 3px dot plus four corner brackets that spring-snap around hovered buttons/links/sliders, shrink on press, and show a small pill label from a data-cursor attribute. Fine-pointer only, disabled for reduced motion. Use for premium/immersive sites needing a branded cursor. From amv.tarunvishwakarma.dev.",
  "title": "Reticle cursor",
  "source": "amv.tarunvishwakarma.dev",
  "short": "Custom camera-reticle cursor"
 },
 {
  "id": "cursor-mask-reveal",
  "cat": "Interaction",
  "desc": "Cursor-as-flashlight reveal — a soft, noise-distorted radius around the pointer that unveils a hidden layer (dim map → fully lit detail), with click-expand, plus companion tricks from hubtown.co.in: a time-driven sweeping scan reveal across a geometric hero monolith, GPGPU particles that repel from the cursor, a pixel-grid dot-matrix loader, and scene-to-scene displacement transitions. Includes a no-WebGL CSS version. Use for architecture/real-estate/product sites with a dark 3D or map stage. From hubtown.co.in (Unseen Studio).",
  "title": "Cursor mask reveal",
  "source": "hubtown.co.in",
  "short": "Cursor-as-flashlight reveal"
 },
 {
  "id": "orbit-drag-reveal",
  "cat": "Interaction",
  "desc": "Arc-shaped \"drag to reveal\" slider that scrubs a hero animation (e.g., pulling a cover off a product) — pointer capture, rubber-band overshoot, spring-back on release, flick-to-commit by velocity, haptics, keyboard + ARIA slider, pulsing onboarding hint. Use as the first, delightful interaction of an immersive hero. From amv.tarunvishwakarma.dev.",
  "title": "Orbit drag reveal",
  "source": "amv.tarunvishwakarma.dev",
  "short": "Arc-shaped \"drag to reveal\" slider that scrubs a hero animation (e.g., pulling a cover off a product)"
 },
 {
  "id": "hold-to-advance",
  "cat": "Interaction",
  "desc": "Press-and-hold interaction with a progress ring that commits a big moment (unlock next section) or a sustained hold that drives a scene (pour, draw, zoom) with audio/visuals tied to hold progress. Includes resume grace on early release, pointer capture, and mandatory keyboard / tap alternatives. Use for gated section transitions, \"hold to enter\" CTAs, and story beats that should feel earned. From why.zero.university (commit-hold, verified in bundle) and santionispirits.com (sustain-hold, verified in bundle).",
  "title": "Hold to advance",
  "source": "why.zero.university · santionispirits.com",
  "short": "Press-and-hold interaction with a progress ring that commits a big moment (unlock next section) or a sustained hold that drives a scene (pour, draw, zoom) with audio/visuals tied to hold progress. Includes resume grace on early release, pointer capture, and mandatory keyboard / tap alternatives. Use for gated section transitions, \"hold to enter\" CTAs, and story beats that should feel earned. From why.zero.university (commit-hold, verified in bundle) and santionispirits.com (sustain-hold, verified in bundle)."
 },
 {
  "id": "device-agnostic-input-actions",
  "cat": "Interaction",
  "desc": "Input layer for playable/explorable sites — gameplay reads named actions (MOVE, JUMP, SHOOT) bound to keyboard codes, gamepad axes/buttons and a touch \"virtual gamepad\" at once; per-frame gamepad polling with 0.1 dead-zone, auto-detected active device that swaps on-screen key/button glyphs, action maps that enable/disable per scene, and gated haptics. Use for game-like portfolios, interactive worlds, kiosks — anywhere mouse, keyboard, touch and controller must all work. From paodao.fr (read from its bundle).",
  "title": "Device-agnostic input",
  "source": "paodao.fr",
  "short": "Input layer for playable/explorable sites"
 },
 {
  "id": "spring-input-physics",
  "cat": "Interaction",
  "desc": "Weighty, inertial feel without a physics engine — a second-order dynamics (f, zeta, r) filter for eased pointer/scroll input, hand-rolled velocity-push physics for hero props (mouse swipes nudge and tilt objects that damp back home), frame-rate-independent exp damping, scroll-boosted camera look-at parallax, and a spring-bone wiggle. Use for single-hero-object or desk-of-objects sites where the object should feel like it has mass. From oryzo.ai (Lusion) bundle.",
  "title": "Spring input physics",
  "source": "oryzo.ai",
  "short": "Weighty, inertial feel without a physics engine"
 },
 {
  "id": "physics-on-flat-art",
  "cat": "Interaction",
  "desc": "Give 2D illustration panels/objects mass — a 2D rigid-body engine (Matter.js) runs invisibly beside a WebGL/DOM scene, each body drives a mesh/element transform, gravity is fed by scroll velocity and pointer velocity, pieces can be grabbed and thrown with a soft mouse constraint, walls track the viewport. Also covers the album-track chapter framing (cover, \"NN:MM\" timecode, \"next track\"). Use for playful brand/music/comic sites where flat art should feel like physical cut-outs. From ponpon-mania.com (values read from its bundle).",
  "title": "Physics on flat art",
  "source": "ponpon-mania.com",
  "short": "Give 2D illustration panels/objects mass"
 },
 {
  "id": "hotspot-callout-pins",
  "cat": "Interaction",
  "desc": "Annotation callouts pinned to points on a 3D model/video — glowing orange dot, hairline leader that draws out, blurred-rise text with numbered title, auto-flip to left/right side, plus a big pulsing \"call to action\" hotspot (e.g. \"Open the door\"). Use for product breakdowns/anatomy views. From amv.tarunvishwakarma.dev.",
  "title": "Hotspot callout pins",
  "source": "amv.tarunvishwakarma.dev",
  "short": "Annotation callouts pinned to points on a 3D model/video"
 },
 {
  "id": "slide-over-drawer",
  "cat": "Interaction",
  "desc": "Accessible right-side slide-over drawer with tabs (Specification / About), frosted-glass panel, dimmed backdrop, staggered hairline rows, Esc to close, arrow-key tabs, focus management, and optional hand-off to the 3D engine (lock input). Use for secondary info on immersive/full-screen sites instead of navigating to another page. From amv.tarunvishwakarma.dev.",
  "title": "Slide-over drawer",
  "source": "amv.tarunvishwakarma.dev",
  "short": "Accessible right-side slide-over drawer with tabs (Specification / About), frosted-glass panel, dimmed backdrop, staggered hairline rows, Esc to close, arrow-key tabs, focus management, and optional hand-off to the 3D engine (lock input). Use for secondary info on immersive/full-screen sites instead of navigating to another page. From amv.tarunvishwakarma.dev."
 },
 {
  "id": "scissor-view-webgl-slots",
  "cat": "WebGL & 3D",
  "desc": "Put several small 3D models/scenes into a normal DOM page with ONE fixed WebGL canvas - each DOM element is a \"slot\", the renderer sets scissor+viewport to that element's rect every frame, ScrollTrigger progress drives model rotation, and a pixel-matched perspective camera keeps CSS and 3D aligned. Includes a no-WebGL alternative (iventions.com) - a GSAP-scrubbed clip-path \"spotlight beam\" with a goo SVG filter. Use for portfolios/agency sites that want 3D objects inside a scrolling GSAP layout. Sources - minhpham.design (Three.js + GLTF, app.bundle.js) and iventions.com (clip-path, verified NOT WebGL).",
  "title": "Scissor WebGL slots",
  "source": "minhpham.design · iventions.com",
  "short": "Put several small 3D models/scenes into a normal DOM page with ONE fixed WebGL canvas"
 },
 {
  "id": "instanced-grass-and-snow-parallax",
  "cat": "WebGL & 3D",
  "desc": "Procedural WebGL ground for playable worlds (three.js) — GPU-animated instanced grass in 3 LOD rings that follow the player (grid-snapped + jittered, clumped, wind from a scrolling noise texture, pushed by the player), plus parallax-occlusion-mapped snow whose height map is a 2D canvas painted with footprints and slowly healed. Includes quality-tier numbers and distance cutoff. Use when a site needs a lush explorable terrain without baked meshes. From paodao.fr (shader/JS read from its bundle).",
  "title": "Instanced grass & snow",
  "source": "paodao.fr",
  "short": "Procedural WebGL ground for playable worlds (three.js)"
 },
 {
  "id": "web-audio-soundscape",
  "cat": "Audio",
  "desc": "Opt-in, live-mixed Web Audio soundscape for interactive sites — Sound on/off toggle with animated level bars, lazy buffer decoding, looping music bed with lowpass \"muffle\" by location, scene cues, procedural noise for hover/drag sounds, interaction-driven gain/pitch, and a clean teardown. Use whenever a site benefits from sound design (product films, games, immersive portfolios). From amv.tarunvishwakarma.dev.",
  "title": "Web Audio soundscape",
  "source": "amv.tarunvishwakarma.dev",
  "short": "Opt-in, live-mixed Web Audio soundscape for interactive sites"
 },
 {
  "id": "scroll-velocity-whoosh-audio",
  "cat": "Audio",
  "desc": "Scene-transition sound design for scroll films — a looping whoosh whose low-pass cutoff opens as the playhead approaches a scene boundary (and closes if you scroll fast), run through a convolution reverb; plus per-scene ambient beds that crossfade over 2s, three music parts mapped to scenes, and a one-hairline-bar Sound toggle persisted in localStorage. Use with autoplay-scroll-film or any section-based scroll site where transitions should be felt. From brand.ivress.co.jp (IVRESS); values verified in source. Complements web-audio-soundscape.",
  "title": "Scroll whoosh audio",
  "source": "brand.ivress.co.jp",
  "short": "Scene-transition sound design for scroll films"
 },
 {
  "id": "immersive-site-playbook",
  "cat": "Foundations",
  "desc": "Master playbook for building a cinematic, \"one-take\" interactive website (hero 3D / scroll-driven story / premium UI chrome), distilled from amv.tarunvishwakarma.dev (Aston Martin Vulcan 3D). Use at the START of any website where the brief says premium, immersive, cinematic, 3D, product reveal, portfolio showpiece, or \"wow\" — it decides structure, stack, and which sibling skills to apply.",
  "title": "Immersive site playbook",
  "source": "amv.tarunvishwakarma.dev",
  "short": "Master playbook for building a cinematic, \"one-take\" interactive website (hero 3D / scroll-driven story / premium UI chrome), distilled from amv.tarunvishwakarma.dev (Aston Martin Vulcan 3D). Use at the START of any website where the brief says premium, immersive, cinematic, 3D, product reveal, portfolio showpiece, or \"wow\""
 },
 {
  "id": "premium-micro-details",
  "cat": "Foundations",
  "desc": "Checklist of small craft details that make a site feel premium and accessible — easing tokens, hover/focus micro-interactions, tap-target rules, reduced-motion handling, inert/aria patterns, ping dots, scroll-hint line, text legibility over imagery, font fallback metrics, error copy, PWA/OG metadata. Use as a final polish pass on ANY website, not only 3D. Collected from amv.tarunvishwakarma.dev.",
  "title": "Premium micro-details",
  "source": "amv.tarunvishwakarma.dev",
  "short": "Checklist of small craft details that make a site feel premium and accessible"
 }
];
