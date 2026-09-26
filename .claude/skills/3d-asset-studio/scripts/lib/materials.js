// Materials tuned for soft studio product renders.
// Surface grain (rubber, powder coat, plastic, stone…) is solid 3D noise evaluated in the shader from the
// object-space position, so it needs no UVs: no seams on spheres, no streaks on lathe faces, the same
// density on every shape, and it stays put when the object turns. Everything is seeded and repeatable.
import * as THREE from 'three';

/** Small seeded PRNG (mulberry32). */
export function rng(seed = 1) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// 3D simplex noise: Ian McEwan & Stefan Gustavson (Ashima Arts), MIT licence. https://github.com/ashima/webgl-noise
const SIMPLEX = /* glsl */`
vec3 w3dMod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 w3dMod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 w3dPermute(vec4 x) { return w3dMod289(((x * 34.0) + 10.0) * x); }
vec4 w3dTaylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
float w3dSnoise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = w3dMod289(i);
  vec4 p = w3dPermute(w3dPermute(w3dPermute(i.z + vec4(0.0, i1.z, i2.z, 1.0)) + i.y + vec4(0.0, i1.y, i2.y, 1.0)) + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = w3dTaylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.5 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return 105.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}
`;

const CELLS = /* glsl */`
vec3 w3dHash3(vec3 p) { p = fract(p * vec3(0.1031, 0.1030, 0.0973)); p += dot(p, p.yxz + 33.33); return fract((p.xxy + p.yxx) * p.zyx); }
// cellular (Worley) noise: x = distance to the nearest cell centre, y = to the second, z = a random value per cell
vec3 w3dCells(vec3 p) {
  vec3 i = floor(p), f = fract(p); float d1 = 8.0, d2 = 8.0, id = 0.0;
  for (int z = -1; z <= 1; z++) for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
    vec3 o = vec3(float(x), float(y), float(z)), h = w3dHash3(i + o), r = o + h - f; float d = dot(r, r);
    if (d < d1) { d2 = d1; d1 = d; id = h.x; } else if (d < d2) d2 = d;
  }
  return vec3(sqrt(d1), sqrt(d2), id);
}
`;

const GRAIN_PARS = /* glsl */`
${SIMPLEX}
${CELLS}
varying vec3 vW3dPos;
uniform mat3 normalMatrix;
uniform float w3dScale, w3dBump, w3dRoughVar, w3dTintVar, w3dSpeckle, w3dSeed, w3dPits;
uniform float w3dCellsAmt, w3dCellsScale, w3dVeins, w3dVeinScale, w3dVeinSharp;
uniform vec3 w3dVeinColor;
// two octaves of simplex noise, roughly zero mean and unit spread; optional sparse pits (cast iron, stone)
float w3dHeight(vec3 p) {
  float h = w3dSnoise(p) * 0.78 + w3dSnoise(p * 2.07 + 19.1) * 0.39;
  if (w3dPits > 0.0) h -= w3dPits * smoothstep(0.62, 0.9, w3dSnoise(p * 0.55 + 7.7));
  if (w3dCellsAmt > 0.0) { vec3 c = w3dCells(p * w3dCellsScale); h += w3dCellsAmt * (smoothstep(0.0, 0.25, c.y - c.x) - 0.5) * 1.4; }
  return h;
}
`;

/**
 * Add solid grain to any MeshStandard/MeshPhysical material.
 * scale: grain features per scene unit (objects are ~1–2 units: 150 coarse · 260 rubber · 400 fine),
 * bump: relief strength, roughVar: roughness spread, tintVar: albedo variation (at `speckle`× the grain frequency),
 * pits: sparse dents (0–1), cells: granules (cork, terrazzo, sponge; cellScale = granules per grain unit),
 * veins: marble veining (veinScale per scene unit, veinSharp, veinColor). Detail finer than a pixel fades out.
 * It is a shader effect: GLB export keeps the base material without the grain.
 */
export function withGrain(material, {scale = 260, bump = 1, roughVar = 0.05, tintVar = 0.04, speckle = 1.6, pits = 0, seed = 7, cells = 0, cellScale = 0.25, veins = 0, veinScale = 1.5, veinSharp = 12, veinColor = 0x8a8f96} = {}) {
  const u = {w3dScale: {value: scale}, w3dBump: {value: bump}, w3dRoughVar: {value: roughVar}, w3dTintVar: {value: tintVar}, w3dSpeckle: {value: speckle}, w3dSeed: {value: seed}, w3dPits: {value: pits},
    w3dCellsAmt: {value: cells}, w3dCellsScale: {value: cellScale}, w3dVeins: {value: veins}, w3dVeinScale: {value: veinScale}, w3dVeinSharp: {value: veinSharp}, w3dVeinColor: {value: new THREE.Color(veinColor)}};
  material.userData.grain = {scale, bump, roughVar, tintVar, speckle, pits, seed, cells, veins};
  material.onBeforeCompile = shader => {
    Object.assign(shader.uniforms, u);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vW3dPos;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\n\tvW3dPos = position;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\n' + GRAIN_PARS)
      .replace('#include <map_fragment>', `#include <map_fragment>
	vec3 w3dP = vW3dPos * w3dScale + w3dSeed * 13.37;
	float w3dFoot = sqrt(length(dFdx(w3dP)) * length(dFdy(w3dP))); // grain features per pixel (geometric mean keeps grazing faces textured)
	float w3dAA = 1.0 - smoothstep(0.5, 1.3, w3dFoot);           // fade detail finer than a pixel
	float w3dAA3 = 1.0 - smoothstep(0.5, 1.3, w3dFoot * w3dSpeckle);
	float w3dH = w3dHeight(w3dP);
	diffuseColor.rgb *= 1.0 + w3dSnoise(w3dP * w3dSpeckle + 41.0) * w3dTintVar * w3dAA3;
	if (w3dCellsAmt > 0.0) { vec3 c = w3dCells(w3dP * w3dCellsScale); diffuseColor.rgb *= mix(1.0, 0.72 + 0.5 * c.z, w3dCellsAmt * 0.6) * mix(1.0, 0.8, w3dCellsAmt * (1.0 - smoothstep(0.0, 0.12, c.y - c.x))); }
	if (w3dVeins > 0.0) {
		vec3 vp = vW3dPos * w3dVeinScale;
		float warp = w3dSnoise(vp * 0.8 + w3dSeed) * 1.6 + w3dSnoise(vp * 2.3 + 3.1) * 0.5;
		float vein = pow(1.0 - abs(sin((vp.x + vp.y * 0.6 + warp) * 3.1)), w3dVeinSharp);
		diffuseColor.rgb = mix(diffuseColor.rgb, w3dVeinColor, clamp(vein * w3dVeins, 0.0, 1.0));
	}`)
      .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
	roughnessFactor = clamp(roughnessFactor + w3dH * w3dRoughVar * w3dAA, 0.03, 1.0);`)
      .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
	{
		const float e = 0.3;
		vec3 w3dG = vec3(w3dHeight(w3dP + vec3(e, 0.0, 0.0)), w3dHeight(w3dP + vec3(0.0, e, 0.0)), w3dHeight(w3dP + vec3(0.0, 0.0, e))) - w3dH;
		vec3 w3dGv = normalMatrix * (w3dG / e);                      // object-space slope to view space
		normal = normalize(normal - (w3dGv - dot(w3dGv, normal) * normal) * (0.24 * w3dBump * w3dAA));
	}`);
  };
  material.customProgramCacheKey = () => 'w3d-grain';
  return material;
}

/* ---------------------------------------------------------------- UV textures
 * For surfaces with good UVs (ribbons, boxes, labels). Canvas textures, seeded, tileable. */

function texture(size, fill, repeat) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  const img = ctx.createImageData(size, size);
  fill(img.data, size);
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeat, repeat);
  tex.anisotropy = 8;
  return tex;
}

function normalFromHeight(h, size, depth) {
  const at = (x, y) => h[((y + size) % size) * size + ((x + size) % size)];
  return d => {
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      const dx = (at(x + 1, y) - at(x - 1, y)) * depth, dy = (at(x, y + 1) - at(x, y - 1)) * depth;
      const l = Math.hypot(dx, dy, 1), i = (y * size + x) * 4;
      d[i] = 128 + 127 * (-dx / l); d[i + 1] = 128 + 127 * (-dy / l); d[i + 2] = 255 / l; d[i + 3] = 255;
    }
  };
}

/** Knit / woven fabric normal map: rows of small ribs, for bands, straps and textiles (needs UVs along the band). */
export function knit({repeat = 3, depth = 5, size = 256, seed = 31} = {}) {
  const h = new Float32Array(size * size), rand = rng(seed);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const u = (x / size) * 32 * Math.PI, v = (y / size) * 16 * Math.PI;
    h[y * size + x] = 0.5 + 0.35 * Math.sin(u + Math.sin(v) * 1.2) * Math.abs(Math.sin(v)) + (rand() - 0.5) * 0.15;
  }
  return {normalMap: texture(size, normalFromHeight(h, size, depth), repeat)};
}

/** Draw into a canvas and get a texture back: labels, prints, screens. `draw(ctx, w, h)`; sRGB colour. */
export function canvasTexture(width, height, draw) {
  const canvas = document.createElement('canvas');
  canvas.width = width; canvas.height = height;
  draw(canvas.getContext('2d'), width, height);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

/** Load an image file (relative to the scene module: new URL('./label.png', import.meta.url)) as an sRGB texture. */
export async function imageTexture(url) {
  const tex = await new THREE.TextureLoader().loadAsync(String(url));
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

/* ---------------------------------------------------------------- presets
 * Each returns a MeshPhysicalMaterial: preset({options}, {any material property to override}).
 * Colours are sRGB hex. Very dark colours read as flat holes on screen: keep blacks around 0x252625. */

const phys = (base, extra) => new THREE.MeshPhysicalMaterial({...base, ...extra});

/**
 * The albedo to start from so a brand colour comes out near its swatch on the lit side of an object. The key light
 * (plus fill and environment) makes lit faces 1.3–1.8× brighter than the albedo in linear light, so a swatch used
 * as is renders pale. k is that factor's inverse (0.62 suits the 'soft' studio); judge the result against the swatch.
 */
export function swatch(hex, k = 0.62) {
  const c = new THREE.Color(hex);
  return c.setRGB(c.r * k, c.g * k, c.b * k); // THREE.Color holds linear values, so this scales light, not the sRGB code
}

/** Matte rubber: weight plates, bumpers, grips, yoga blocks. */
export const rubber = ({color = 0x252625, seed = 7, scale = 260} = {}, extra = {}) =>
  withGrain(phys({color, roughness: 0.48, clearcoat: 0.18, clearcoatRoughness: 0.45, sheen: 0.35, sheenRoughness: 0.6, sheenColor: new THREE.Color(0x7a807a)}, extra), {scale, bump: 1, roughVar: 0.06, tintVar: 0.035, seed});

/** Textured powder coat / cast iron: kettlebells, dumbbell heads, tools, outdoor furniture. */
export const powderCoat = ({color = 0x2a2b2b, seed = 11, scale = 300} = {}, extra = {}) =>
  withGrain(phys({color, roughness: 0.56, metalness: 0.08, clearcoat: 0.12, clearcoatRoughness: 0.5}, extra), {scale, bump: 1.5, roughVar: 0.07, tintVar: 0.05, pits: 0.5, seed});

/** Plastic: matte by default, `glossy: true` for injection-moulded shine. */
export const plastic = ({color = 0x9aa04a, glossy = false, seed = 3, scale = 380} = {}, extra = {}) =>
  withGrain(phys({color, roughness: glossy ? 0.22 : 0.5, clearcoat: glossy ? 0.6 : 0.1, clearcoatRoughness: glossy ? 0.1 : 0.5}, extra), {scale, bump: 0.35, roughVar: 0.025, tintVar: 0.01, seed});

/** Stone, concrete, terrazzo-ish matte mineral. */
export const stone = ({color = 0xc9c5bd, seed = 5, scale = 90} = {}, extra = {}) =>
  withGrain(phys({color, roughness: 0.82}, extra), {scale, bump: 1.2, roughVar: 0.06, tintVar: 0.08, speckle: 2.5, pits: 0.6, seed});

/** Cork: granular, warm, matte (yoga blocks, coasters, boards, bottle stoppers). */
export const cork = ({color = 0xb88a5c, seed = 13, scale = 90} = {}, extra = {}) =>
  withGrain(phys({color, roughness: 0.86, sheen: 0.2, sheenRoughness: 0.9, sheenColor: new THREE.Color(0xe0c8a8)}, extra), {scale, bump: 1.3, roughVar: 0.05, tintVar: 0.1, speckle: 2.2, cells: 1, cellScale: 0.42, seed});

/** EVA / yoga foam: fine, soft, very matte (mats, blocks, rollers, grips). */
export const foam = ({color = 0x8f9b86, seed = 17, scale = 420} = {}, extra = {}) =>
  withGrain(phys({color, roughness: 0.9, sheen: 0.5, sheenRoughness: 0.7, sheenColor: new THREE.Color(0xffffff).lerp(new THREE.Color(color), 0.5)}, extra), {scale, bump: 0.5, roughVar: 0.03, tintVar: 0.015, cells: 0.35, cellScale: 0.5, seed});

/** Felt (tennis balls, pool tables, hats): fuzzy sheen, no gloss. */
export const felt = ({color = 0xd6e04a, seed = 19, scale = 520} = {}, extra = {}) =>
  withGrain(phys({color, roughness: 1, sheen: 1, sheenRoughness: 0.35, sheenColor: new THREE.Color(0xffffff).lerp(new THREE.Color(color), 0.25)}, extra), {scale, bump: 0.8, roughVar: 0, tintVar: 0.06, seed});

/** Terracotta / unglazed clay: plant pots, tiles, bricks. */
export const terracotta = ({color = 0xc0694a, seed = 23, scale = 160} = {}, extra = {}) =>
  withGrain(phys({color, roughness: 0.92}, extra), {scale, bump: 0.9, roughVar: 0.04, tintVar: 0.07, speckle: 2.5, pits: 0.25, seed});

/** Candle wax: soft translucent-looking satin (sheen and a little clear coat fake the subsurface glow). */
export const wax = ({color = 0xf2ead9} = {}, extra = {}) =>
  withGrain(phys({color, roughness: 0.45, sheen: 0.6, sheenRoughness: 0.4, sheenColor: new THREE.Color(0xfff4de), clearcoat: 0.25, clearcoatRoughness: 0.35}, extra), {scale: 120, bump: 0.15, roughVar: 0.03, tintVar: 0.01});

/** Paper / card / page edges: matte, very fine tooth. */
export const paper = ({color = 0xf4efe4, seed = 29} = {}, extra = {}) =>
  withGrain(phys({color, roughness: 0.95}, extra), {scale: 700, bump: 0.25, roughVar: 0.02, tintVar: 0.02, seed});

/** Leather: pebbled grain with a soft sheen (bags, straps, sofas, book covers). */
export const leather = ({color = 0x6b3b24, seed = 31, scale = 150} = {}, extra = {}) =>
  withGrain(phys({color, roughness: 0.55, sheen: 0.4, sheenRoughness: 0.5, clearcoat: 0.25, clearcoatRoughness: 0.45}, extra), {scale, bump: 1.1, roughVar: 0.08, tintVar: 0.05, cells: 0.7, cellScale: 0.6, seed});

/** Book cloth / linen: woven, matte (hardcover books, lampshades, upholstery). */
export const linen = ({color = 0x2f4a3a, seed = 37, scale = 380} = {}, extra = {}) =>
  withGrain(phys({color, roughness: 0.88, sheen: 0.55, sheenRoughness: 0.6, sheenColor: new THREE.Color(0xffffff).lerp(new THREE.Color(color), 0.55)}, extra), {scale, bump: 0.7, roughVar: 0.03, tintVar: 0.05, seed});

/** Polished marble with soft veins. */
export const marble = ({color = 0xefece6, veinColor = 0x9a9ea5, seed = 41, veins = 0.75} = {}, extra = {}) =>
  withGrain(phys({color, roughness: 0.18, clearcoat: 0.6, clearcoatRoughness: 0.12}, extra), {scale: 60, bump: 0.05, roughVar: 0.02, tintVar: 0.03, veins, veinScale: 1.4, veinSharp: 14, veinColor, seed});

/** Baked dough / bread crust: warm, porous (donuts, bread, cookies, pastry). */
export const dough = ({color = 0xc98a4b, seed = 43, scale = 140} = {}, extra = {}) =>
  withGrain(phys({color, roughness: 0.78, sheen: 0.3, sheenRoughness: 0.6, sheenColor: new THREE.Color(0xf2c890)}, extra), {scale, bump: 1, roughVar: 0.05, tintVar: 0.08, pits: 0.4, cells: 0.25, cellScale: 0.35, seed});

/** Sugar icing / glaze: glossy, smooth (donut icing, cake, candy). */
export const icing = ({color = 0xf3a6b8} = {}, extra = {}) =>
  withGrain(phys({color, roughness: 0.2, clearcoat: 0.8, clearcoatRoughness: 0.08, sheen: 0.2}, extra), {scale: 90, bump: 0.08, roughVar: 0.02, tintVar: 0.01});

/** Emissive light source (bulbs, neon tubes, screens, flames): pair with post: {bloom: true}. */
export const glow = ({color = 0xffc46b, intensity = 3} = {}, extra = {}) =>
  phys({color: 0x000000, emissive: color, emissiveIntensity: intensity, roughness: 0.4}, extra);

/** Brushed stainless steel: hubs, handles, bars. */
export const brushedSteel = ({color = 0xd8d6d2} = {}, extra = {}) => phys({color, metalness: 1, roughness: 0.26, anisotropy: 0.7}, extra);

/** Polished chrome. */
export const chrome = ({color = 0xf1f1f1} = {}, extra = {}) => phys({color, metalness: 1, roughness: 0.06}, extra);

/** Warm metals. */
export const gold = ({color = 0xe2b55c} = {}, extra = {}) => phys({color, metalness: 1, roughness: 0.22, clearcoat: 0.3, clearcoatRoughness: 0.2}, extra);
export const brass = ({color = 0xc9a15a} = {}, extra = {}) => phys({color, metalness: 1, roughness: 0.32}, extra);
export const copper = ({color = 0xc98a5e} = {}, extra = {}) => phys({color, metalness: 1, roughness: 0.28}, extra);

/** Glazed ceramic: cups, plates, vases. Low roughness plus a clear coat gives the glaze. */
export const ceramic = ({color = 0xf1eee8} = {}, extra = {}) => phys({color, roughness: 0.34, clearcoat: 1, clearcoatRoughness: 0.06, sheen: 0.1}, extra);

/** Matte paint or lacquered metal in a brand colour. */
export const paint = ({color = 0xdeeb9c, satin = true} = {}, extra = {}) => phys({color, roughness: satin ? 0.42 : 0.7, clearcoat: satin ? 0.35 : 0, clearcoatRoughness: 0.3}, extra);

/** Fabric / elastic bands (knit normal map along UVs; ribbon() provides them). */
export const fabric = ({color = 0xc9c1b8, repeat = 3} = {}, extra = {}) => {
  const k = knit({repeat});
  return phys({color, roughness: 0.92, normalMap: k.normalMap, normalScale: new THREE.Vector2(0.9, 0.9), sheen: 1, sheenRoughness: 0.5, sheenColor: new THREE.Color(0xffffff).lerp(new THREE.Color(color), 0.4)}, extra);
};

/** Oiled wood with solid (UV-free) growth rings around the object's y axis. */
export const wood = ({color = 0xb88a5a, rings = 38, seed = 5} = {}, extra = {}) => {
  const m = phys({color, roughness: 0.6, clearcoat: 0.15, clearcoatRoughness: 0.5}, extra);
  withGrain(m, {scale: 120, bump: 0.25, roughVar: 0.04, tintVar: 0.04, seed});
  const grain = m.onBeforeCompile;
  m.onBeforeCompile = shader => {
    grain(shader);
    shader.uniforms.w3dRings = {value: rings};
    shader.fragmentShader = shader.fragmentShader.replace('uniform float w3dScale', 'uniform float w3dRings, w3dScale').replace('diffuseColor.rgb *= 1.0 + w3dSnoise', `{
		float r = length(vW3dPos.xz) * w3dRings + w3dSnoise(vW3dPos * 3.0 + w3dSeed) * 0.9;
		diffuseColor.rgb *= 0.86 + 0.14 * smoothstep(0.2, 0.8, abs(fract(r) * 2.0 - 1.0));
	}
	diffuseColor.rgb *= 1.0 + w3dSnoise`);
  };
  m.customProgramCacheKey = () => 'w3d-wood';
  return m;
};

/**
 * Glass. `color` is the tint light takes on after one pass through `thickness` of glass (the base colour stays
 * white so the tint is not applied twice); `frost` is the surface roughness (0 clear, 0.15 frosted, 0.4 sandblasted).
 * Transmission refracts only what is in the scene — the backdrop, the floor shadows, opaque objects — never the web page
 * behind a transparent sprite, and never other glass. So glass reads best rendered on its final background (backdrop)
 * with the 'glass' studio (dark edges, strip highlights); on a transparent layer, tint it and frost it a little.
 * Hollow ware (bottles, jars, glasses) wants a thin `thickness` (0.05–0.3); solid glass (gems, paperweights) the full depth.
 */
export const glass = ({color = 0xe8f0ec, frost = 0.03} = {}, extra = {}) =>
  phys({color: 0xffffff, metalness: 0, roughness: frost, transmission: 1, thickness: 0.3, ior: 1.5, specularIntensity: 1, attenuationColor: new THREE.Color(color), attenuationDistance: extra.thickness ?? 0.3}, extra);
