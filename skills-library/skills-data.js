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
  "id": "stacked-toasts",
  "cat": "Components",
  "desc": "Sonner-style toast stack — newest toast in front, older ones tucked 14 px behind and scaled down 5 % each, the stack fans out on hover using measured heights, swipe-to-dismiss with a 45 px / 0.11 px·ms velocity rule and damped wrong-way drag, timers that pause on hover, while pressing and while the tab is hidden, promise toasts (loading → success/error), and an aria-live region with an Alt+T hotkey. Use for any app or site notification system that should feel calm and physical. From the sonner 2.0.8 source (npm dist/index.mjs + styles.css) and emilkowal.ski \"Building a toast component\".",
  "title": "Stacked toasts",
  "source": "sonner · emilkowal.ski",
  "short": "Toasts that tuck behind each other, fan out on hover and swipe away with a flick"
 },
 {
  "id": "drag-sheet-drawer",
  "cat": "Components",
  "desc": "iOS-style draggable bottom sheet (Vaul pattern) — direct-manipulation drag with no transition while the finger is down, momentum close (0.4 px/ms) or 25 % distance, logarithmic damping past the open edge, snap points (fractions or px) with flick-to-skip at velocity > 2, overlay fade toward the top snap, the page behind scaling into a card ((W−26)/W, 8 px radius, 14 px down), scroll-vs-drag arbitration, handle tap to cycle snaps. 0.5 s cubic-bezier(0.32, 0.72, 0, 1). Use for mobile-first menus, filters, detail sheets and map panels. Not the right-side tabbed panel; that is slide-over-drawer. From the vaul 1.1.2 source (npm dist/index.mjs + style.css) and emilkowal.ski \"Building a drawer component\".",
  "title": "Drag sheet drawer",
  "source": "vaul · emilkowal.ski",
  "short": "An iOS-style bottom sheet with snap points, momentum and a page that becomes a card"
 },
 {
  "id": "interruptible-css-transitions",
  "cat": "Components",
  "desc": "Rules for UI motion that can be changed mid-flight — use CSS transitions (retargetable) instead of @keyframes for any state that can change again before the animation ends (stack positions, open/close, hover expand), drive state with data-attributes plus a \"mounted\" flag (or @starting-style) for enter, hand off cleanly between finger-driven drag (transition:none) and released settle, keep keyframes only for one-shot exits/loops, and pick easing/duration by purpose (ease-out < 300 ms, Sonner 400 ms ease, Vaul 0.5 s iOS curve). Use whenever building toasts, drawers, menus, tabs or anything users can trigger repeatedly. From emilkowal.ski (\"Great animations\", \"Building a toast component\", \"Building a drawer component\") and the sonner / vaul sources.",
  "title": "Interruptible transitions",
  "source": "emilkowal.ski · sonner · vaul",
  "short": "Why stacks and toggles use transitions, not keyframes, so motion can change mid-flight"
 },
 {
  "id": "origin-aware-popovers",
  "cat": "Components",
  "desc": "Dropdown menus, popovers and tooltips that grow out of their trigger — content placed on a side with flip + shift collision handling, transform-origin computed toward the trigger, data-state/data-side keyframe enter/exit (fade + zoom 95% + 8px slide from the trigger side, ~150 ms), exit animation finished before unmount, tooltip delay groups (700 ms first, instant within 300 ms of the last one closing), menus with roving focus, typeahead, Esc and focus return. Use for any app toolbar, select-like menu, share/filter popover or icon-button tooltips that should feel Linear/Raycast-grade. From Radix UI primitives (react-tooltip 1.3.0, react-popover 1.2.0, react-dropdown-menu/react-menu 2.1.25, react-popper 1.3.8, react-presence 1.1.11, read from the npm dist) and shadcn/ui new-york-v4 classes + tw-animate-css 1.4.0.",
  "title": "Origin-aware popovers",
  "source": "radix-ui.com · shadcn/ui",
  "short": "Menus, popovers and tooltips that scale out of their trigger, flip and shift to fit"
 },
 {
  "id": "command-palette-motion",
  "cat": "Components",
  "desc": "A cmdk-style ⌘K command palette — dialog that scales in from .96, combobox input with aria-activedescendant, fuzzy command-score ranking (word-jump and transposition weights), groups re-sorted by best match, first result auto-selected, ↑↓/Home/End/⌘↑↓/Alt-group/Ctrl-N-P keys, pointer-move selection, list height animated through a ResizeObserver-fed --cmdk-list-height variable, nested pages with Backspace/Esc back and a 100 ms \"bounce\" on Enter. Use for app shells, docs sites and dashboards that want Linear/Raycast-grade keyboard navigation. From cmdk 1.1.1 by Paco Coursey (src/index.tsx + command-score.ts read on GitHub/npm) and its website's Linear/Raycast/Vercel recreations; Raycast manual for behaviour.",
  "title": "Command palette motion",
  "source": "cmdk.paco.me · raycast.com",
  "short": "A ⌘K palette with cmdk fuzzy ranking, arrow-key selection and a list that glides to fit"
 },
 {
  "id": "submenu-safe-triangle",
  "cat": "Components",
  "desc": "Nested menus that don't snap shut when the pointer cuts diagonally toward a submenu — Radix's pointer grace area (a polygon from the exit point, with a 5 px bleed, to the submenu's near and far edges, valid for 300 ms, only while the pointer is moving toward the submenu side), 100 ms hover-open delay for sub-triggers, sibling items blocked from stealing the highlight while inside the area, keyboard ArrowRight/Enter/Space to open and ArrowLeft to close, and the Amazon \"menu aim\" slope variant (300 ms delay, 75 px tolerance, last 3 mouse positions). Use for context menus, nested dropdowns, mega-menus and nav flyouts. From @radix-ui/react-menu 2.1.25 (npm dist, MenuSubTrigger/MenuContentImpl) and kamens/jQuery-menu-aim (GitHub source).",
  "title": "Submenu safe triangle",
  "source": "radix-ui.com · jQuery-menu-aim",
  "short": "Submenus that stay open while the pointer cuts diagonally toward them"
 },
 {
  "id": "animated-number-flow",
  "cat": "Components",
  "desc": "NumberFlow-style animated numbers — Intl.NumberFormat parts split into keyed digit wheels and symbols, each digit spins by the shortest (or trend-forced) path, new digits roll in from 0 and fade, leaving digits roll to 0 and fade, the whole number FLIPs when its width changes, rapid updates add up instead of jumping, and the element carries a role=\"img\" label with the formatted string. Use for prices, counters, stats, timers, plan pickers and dashboards where a changing number should feel alive but stay readable. From number-flow 0.6.2 (dist/lite.mjs, ssr chunk, plugins.mjs read on unpkg) and the docs at number-flow.barvian.me by Maxwell Barvian.",
  "title": "Animated number flow",
  "source": "number-flow.barvian.me",
  "short": "Per-digit rolling numbers with Intl formats, trend and a screen-reader-safe label"
 },
 {
  "id": "button-state-morphs",
  "cat": "Components",
  "desc": "Buttons that answer every press — scale(.97) press feedback (no scale when disabled), an async save that morphs idle → \"Saving…\" → saved / error inside a width-stable label stack, copy-to-clipboard that swaps to an inline check for ~2 s, hold-to-confirm for destructive actions with a clip-path fill that snaps back on release, toggle buttons with aria-pressed, and proper disabled/aria-busy/aria-live semantics. Use for forms, settings, dashboards, code blocks, pricing CTAs, any app UI. Sources - emilkowal.ski (7 practical animation tips), linear.app CSS (button tokens, observed), rauno.me + interfaces.rauno.me, vercel.com/design/guidelines (Web Interface Guidelines).",
  "title": "Button state morphs",
  "source": "emilkowal.ski · linear.app · vercel.com/design",
  "short": "Press scale, width-stable async save, copy check and hold-to-delete"
 },
 {
  "id": "ui-motion-principles",
  "cat": "Components",
  "desc": "A concise rulebook for product-UI motion (apps, dashboards, menus, buttons, not cinematic hero scenes) — purpose and frequency first (never animate keyboard-initiated or hundred-times-a-day actions), durations (≤ 200–300 ms), ease-out for enter/exit with real custom curves, transform-origin at the trigger, never scale from 0, transitions over keyframes for anything interruptible, transform/opacity only, tooltip delay rules, blur-bridged crossfades, theme-switch and hover hygiene, reduced motion. With observed timing tokens from Linear, Vercel Geist and rauno.me. Use as the checklist before and after adding any UI animation. Sources - emilkowal.ski (7 practical animation tips, Great animations, You don't need animations), rauno.me \"Invisible details of interaction design\", interfaces.rauno.me, vercel.com/design/guidelines, linear.app + vercel.com/geist CSS.",
  "title": "UI motion principles",
  "source": "emilkowal.ski · rauno.me · linear.app · vercel.com/geist",
  "short": "Duration, easing, origin, interruptibility and when not to animate, side by side"
 },
 {
  "id": "shared-element-flip",
  "cat": "Components",
  "desc": "Shared-element layout transitions without a framework — a card that grows into its detail view and back (same element, never a duplicate), list reorder/shuffle where every item glides to its new slot, and exit \"pop\" so siblings close the gap while the leaver fades. Vanilla FLIP (measure, invert, play) with Motion-style scale correction for border-radius and children, plus the View Transitions API path (startViewTransition, view-transition-name, crop + radius, cross-document @view-transition) with feature detection and fallback. Use for galleries, product grids, card→detail, sortable lists, filters. Sources - Motion (motion.dev / framer-motion 14.1.0, motion-dom projection source read on unpkg), Paul Lewis \"FLIP your animations\" (aerotwist.com), CSS View Transitions 1/2 drafts + developer.chrome.com docs, MDN browser-compat-data.",
  "title": "Shared-element FLIP",
  "source": "motion.dev · aerotwist.com · developer.chrome.com",
  "short": "Cards grow into their detail view and lists reshuffle, with radius and child correction"
 },
 {
  "id": "sliding-indicator-tabs",
  "cat": "Components",
  "desc": "Tabs and segmented controls whose active indicator glides between items instead of jumping — a measured underline (translateX + scaleX), a pill made by clipping a duplicated \"active\" copy of the list so the text colour flips exactly at the pill edge, a hover highlight that follows the pointer, and a tab-panel container that animates its height while content slides in from the side of the tapped tab. Full WAI-ARIA tabs / radiogroup keyboard model, reduced motion, resize + font-load re-measure. Use for product pages, dashboards, pricing toggles, settings, filters. Sources - Motion `layoutId` shared indicator (motion.dev, motion-dom 14.1.0 defaults), Emil Kowalski \"The magic of clip-path\" (emilkowal.ski; technique credited there to Paco Coursey), Benji Taylor \"Family Values\" (directional tab motion), WAI-ARIA APG Tabs, MDN browser-compat-data.",
  "title": "Sliding indicator tabs",
  "source": "motion.dev · emilkowal.ski · benji.org",
  "short": "Tabs and segmented controls whose indicator glides, with height-animated panels"
 },
 {
  "id": "morphing-tray",
  "cat": "Components",
  "desc": "Family-style dynamic tray — one container that morphs between content states (button → review sheet → confirm → \"Sending…\" pill → done) by animating its real width/height, crossfading the content inside, morphing button labels letter-by-letter where letters are shared (\"Continue\" → \"Confirm\"), and a back/close icon that morphs (✕ → ←). Covers the auto-height toolbox (measure-and-lock, grid-template-rows 0fr→1fr, interpolate-size / calc-size, ::details-content) and spring easing via CSS linear(). Use for checkout/confirm flows, multi-step actions, onboarding, compact settings — anywhere a full screen would lose context. Sources - Benji Taylor \"Family Values\" (benji.org/family-values, the design rules), Motion layout/AnimatePresence (motion-dom 14.1.0), vaul 1.1.2 (sheet curve), CSS spec drafts + MDN browser-compat-data (support).",
  "title": "Morphing tray",
  "source": "benji.org/family-values · motion.dev",
  "short": "One container morphs button → sheet → status pill, with shared-letter text morph"
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
