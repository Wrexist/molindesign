---
name: instanced-grass-and-snow-parallax
description: Procedural WebGL ground for playable worlds (three.js) — GPU-animated instanced grass in 3 LOD rings that follow the player (grid-snapped + jittered, clumped, wind from a scrolling noise texture, pushed by the player), plus parallax-occlusion-mapped snow whose height map is a 2D canvas painted with footprints and slowly healed. Includes quality-tier numbers and distance cutoff. Use when a site needs a lush explorable terrain without baked meshes. From paodao.fr (shader/JS read from its bundle).
---

# Instanced grass + snow with parallax occlusion

Source: paodao.fr main bundle (three.js r17x, `MeshStandardMaterial` patched with `onBeforeCompile`, `InstancedMesh`, Rapier for physics). Everything below was read from the shader strings and JS around them. Not reached/not read: the terrain height-sampling function bodies (`getHeight`, `getNormal`) and the asset files themselves (glb/ktx2 are fetched at runtime).

## A. Grass
**Layout.** Four `InstancedMesh` rings under one group; the group position is copied from the player every frame, so the field is a moving window.

| Ring | radius min–max (m) | tile size (high) | tile size (low/medium) | blade scaleX (high / low) |
|---|---|---|---|---|
| near | 0–11 | .05 | .15 | .5 / 2 |
| mid | 10–31 | .10 | .40 | 2 / 5 |
| far | 30–60 | .20 | .80 | 8 / 10 |
| flowers | 0–30 | 1 (all tiers) | | .4–.6 height |

Instance matrices are pure translations on a `tileSize` lattice inside the annulus (`minRadius ≤ |p| ≤ maxRadius`), built once. High tier uses three different blade meshes; low/medium reuse the simplest one for all rings.

**Vertex shader recipe** (injected at `#include <begin_vertex>`, `common`):
1. `wpos = modelMatrix * instanceMatrix * vec4(0,0,0,1)` — blade root in world space.
2. **Snap + jitter** so blades stay planted while the window moves with the player: `cell = floor(wpos.xz / tile)`; `wpos.xz += -mod(wpos.xz, tile) + (hash(cell) - .5) * tile` (second hash for z). `vSeed = hash(cell + …)` is the stable per-blade random.
3. **Slope mask**: `p = 1 - acos(dot(normal, up)) / PI`; `pente = smoothstep(.76-.14, .76+.14, p)`; multiply blade vertices by it (no grass on cliffs).
4. **Clumps** from a noise texture: `cl = .65*tex(p*.10).r + .35*tex(p*.20).g; clump = pow(smoothstep(.55,.82,cl), 1.8)`. Height `mix(.55, 1.25, clump)`, width `mix(.85, 1.12, clump)`, stiffness `mix(1, .55, clump)`.
5. **Random orientation** from noise at `p*.13`: yaw `nRot.r*(.5+.5*nRot.g)*2π`, small pitch `(nRot.b-.5)*1.0`, both weighted by blade height `vy = 1 - uv.y`.
6. **Wind**: sample noise at `p*.02 + time*.1`; `bend = clamp((n.g*2-1 + (n.r*2-1)*.15) * .30 * stiffness, -1, 1)`; rotate about X by `bend * pow(vy, 3)` (tips move, roots don't).
7. **Distance fade by scaling**: `d = 1 - pow(clamp(len(rootXZ - player.xz) / fadeRadius, 0, 1), 5)`; `v.y *= d` (blades shrink to nothing at the ring edge, no popping; `fadeRadius = 60`).
8. **Align to ground**: `v = alignUpTo(groundNormal) * v`; `transformed.y += getHeight(wpos) - wpos.y`.
9. **Player push**: within `r = 1 m`, `transformed.xz += .3 * dir * vy * (1 - dist/r) * isGround` (`isGround` uniform: only when the player is grounded).

```glsl
// skeleton to start from (MeshStandardMaterial + onBeforeCompile)
vec2 cell = floor(wpos.xz * invTile);
vec2 j = vec2(hash(cell), hash(cell + vec2(17.23, 91.7))) - .5;
vec2 root = wpos.xz - mod(wpos.xz, tile) + j * tile;
float clump = pow(smoothstep(.55,.82, .65*texture(noiseTex, root*.10).r + .35*texture(noiseTex, root*.20).g), 1.8);
float fade = 1. - pow(clamp(length(root - playerXZ) * invFade, 0., 1.), 5.);
```

**Low-tier**: 1 mesh type, bigger tiles (instance count drops roughly with the square of tile size — inference), shadows off. **High**: smaller tiles, shadows on, snow-print drawing on, more particles (below).

## B. Parallax-occlusion-mapped snow
Patch `MeshStandardMaterial` (`USE_TANGENT`, `USE_UV` defined). Vertex: build `vTangent`, `vBinormal` from `tangent.w`. Fragment, before `map_fragment` and `normal_fragment_maps`, run **the same** UV offset so colour and normals agree.

Parameters read from source: `parallaxScalePx = 4` (ground tile) / `10` (terrain), `uTexelSize = 1/heightMap.width`, **cutoff `uParallaxCutoff = 20` m** (POM only where `dot(vViewPosition) < cutoff²`; farther fragments use the plain UV).

```glsl
vec2 parallaxUV(vec2 uv) {
  vec3 V = normalize(vViewPosition);
  vec3 Vts = vec3(dot(V,T), dot(V,B), dot(V,N));
  vec2 rayUV = (Vts.xy / max(abs(Vts.z), 1e-4)) * (parallaxScalePx * uTexelSize); rayUV.x *= -1.;
  float nSamples = mix(22., 10., clamp(dot(N,V), 0., 1.));     // fewer samples when looking straight down
  float stepH = 1. / nSamples, hRay = 1.; vec2 off = vec2(0.); bool hit = false;
  vec2 dx = dFdx(uv), dy = dFdy(uv);                            // derivatives OUTSIDE the loop
  for (int i = 0; i < 50; i++) { if (float(i) > nSamples) break;
    if (textureGrad(tHeightMap, uv + off, dx, dy).r > hRay) { hit = true; break; }
    hRay -= stepH; off += stepH * rayUV; }
  if (hit) { vec2 hi = off, lo = off - stepH * rayUV;          // 4 binary-search refinements
    for (int k = 0; k < 4; k++) { vec2 m = .5*(lo+hi);
      if (textureGrad(tHeightMap, uv+m, dx, dy).r > hRay + .5*stepH) hi = m; else lo = m; }
    off = .5*(lo+hi); }
  off = clamp(off, vec2(-5.*uTexelSize), vec2(5.*uTexelSize)); // cap displacement to 5 texels
  return clamp(uv + off, 0., 1.);
}
// colour: mix(snowBottom 0xC2D0E3, snowTop white, heightSample(uvP)) — depressed snow is greyer
```
Key details: `textureGrad` (not `texture`) so the dynamic loop has defined derivatives; WebGL1 fallback macro `texture2DGradEXT` or plain `texture2D`; offset capped; normal map sampled at the **parallaxed** UV.

**Height map = a canvas** (`2048×2048`, `LinearFilter`, no mipmaps), filled white:
- each frame, if the player is above `SnowLevel` and grounded, draw a brush image at the player's mapped position with `globalCompositeOperation = 'multiply'` (footprint darkens = deeper). Size in world metres: player `.7`, yeti `1.5`, times `canvasWidth / worldWidth`; aspect fixed by `worldWidth/worldDepth`.
- **Healing**: every frame `fillRect(0,0,w,h)` with `rgba(255,255,255, .35 * dtMs * .001)` — footprints fade back to white over a few seconds. (Source calls it twice per frame; one call is enough with a larger alpha.)
- Upload throttle: `texture.needsUpdate = true` at most every **100 ms**.
- Below the snow line the canvas is cleared once and left alone.
- Gate by tier: footprints only on `high` (`_DrawInSnow`).

## Quality tiers (from source)
`low` & `medium`: 30 fps main loop (`1000/30`), no shadows, grass `[.15,.4,.8]`, snow storm particles 1000, no snow prints. `medium` keeps AO+DOF+bloom, `low` drops them. `high`: 60 fps, shadows, SMAA, AO radius .3, grass `[.05,.1,.2]`, snow storm 5000. Default `high`, `medium` on mobile, user-selectable and persisted. Rebuild instance meshes (dispose geometries/materials) when the level changes. For automatic tier detection, pair with the `gpu-tier-adaptive-quality` skill.

## Accessibility and reduced motion
Source has neither (no `prefers-reduced-motion`). Add: (1) `prefers-reduced-motion` → `time` uniform frozen (no wind), snow storm off, camera damping up; (2) all copy/links also in DOM, canvas gets `role="img"` + label or is `aria-hidden` with an HTML alternative; (3) pause rendering when the tab is hidden; (4) a visible quality switch.

## Rules
- Never create/destroy instances at runtime — move the window, keep the lattice.
- Do the work in the vertex shader; CPU only updates `playerPos`, `isGround`, `time`.
- Fade by scaling to 0 near the outer radius, not by alpha (no sorting, no overdraw).
- POM only near the camera (≤20 m), capped samples (10–22), capped offset (5 texels). Otherwise it is a cost and an artifact source.
- Use the same warped UV for albedo and normal maps.
- Keep distant LOD rings cheaper (bigger tiles, fewer blade vertices), not just farther.
