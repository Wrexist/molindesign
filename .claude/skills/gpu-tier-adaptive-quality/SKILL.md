---
name: gpu-tier-adaptive-quality
description: Quality-tier system for heavy WebGL/canvas motion sites — detect-gpu tier 0–3 at idle, mobile cap, blocklist/timeout fallback to a static tier 0, DPR cap by tier and resolution, per-tier asset resolution, effects switched off on low tiers, reduced-motion handling. Use whenever a site ships a WebGL hero, particle field or 3D scroll scene and must not jank on weak devices. From shopify.com/editions/spring2026 (verified in bundle code).
---

# GPU tier adaptive quality

## Tier resolution (as implemented on Shopify Editions)
```js
// run in requestIdleCallback({timeout:2000}) (fallback setTimeout 200)
const { getGPUTier } = await import('detect-gpu');       // loaded lazily
const g = await getGPUTier();
let tier = 3 /* default until known */;
if (g.type==='BLOCKLISTED' || g.type==='WEBGL_UNSUPPORTED') tier = 0;      // static fallback
else if (g.type==='BENCHMARK_FETCH_FAILED') tier = isCoarsePointer && deviceTier>1 ? 1 : deviceTier;
else { tier = clamp(g.tier ?? deviceTier, 0, 3); if (g.isMobile && tier>1) tier = 1; }  // phones max tier 1
// safety nets
addEventListener('s26:force-tier-0', ()=>setTier(0));     // fired when assets exceed a load timeout
document.documentElement.dataset.renderTier = tier;       // CSS can branch on [data-render-tier="0"]
```
Tier 0 means: no WebGL, show poster images/CSS only. Never block first paint on detection; start at a safe default and upgrade/downgrade.

## DPR cap
```js
function dpr(w,h,q /* 'low'|'medium'|'high' from tier 1|2|3 */) {
  if (q==='low') return 1;
  const cap = q==='medium' ? 1920 : 3840;                 // max rendered px per axis
  return Math.max(1, Math.min(devicePixelRatio, 2, cap/w, cap/h));
}
```
Recompute on a 100 ms debounced `ResizeObserver` and when `matchMedia('(resolution: Xdppx)')` fires (monitor moved).

## Per-tier budgets (observed)
- Source texture resolution: tiers 3 and 2 -> 512, tiers 1 and 0 -> 256 (pick the smallest available source >= target, else largest). Compensate sprite size by `1 + (max(1,1024/res) - 1) * .25`.
- Motion add-ons gated to tier 3 only (e.g. scroll camera drift `v*44`); fluid/blur/bloom passes off for 0–1.
- Sim/render sizes (`simSize`, `dyeSize`) come from the tier preset, not constants.
- Dispose GPU resources when a section is far offscreen; keep a "warm-up" role for the next scene.

## Load fade
Fade scene in with an eased factor `1-(1-t)^3` advanced by `dt/duration` with `dt <= 1/30`; with reduced motion jump to 1 instantly; when offscreen hold the value.

## a11y / reduced motion
- `prefers-reduced-motion: reduce` -> clamp to tier <= 1 behaviour: static or very slow scene, no scroll-velocity effects, no autoplay.
- Honour `navigator.connection.saveData` (inferred; Shopify only records it for telemetry) by starting at tier 1.
- Static tier-0 view must carry all content.

## Don'ts
- Don't cap DPR at 1 on high tiers (blurry text on retina) — cap by pixel budget instead.
- Don't detect tier synchronously on the critical path; no benchmark fetch before first paint.
- Don't ship one asset size to all tiers.
