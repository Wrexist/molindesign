// Seeded 3D simplex noise and fractal sums for shaping geometry on the CPU (displacement, rocks, blobs,
// organic wobble). After Stefan Gustavson's public-domain simplex noise.
import {rng} from './materials.js';

const G3 = 1 / 6, F3 = 1 / 3;
const GRAD = [[1, 1, 0], [-1, 1, 0], [1, -1, 0], [-1, -1, 0], [1, 0, 1], [-1, 0, 1], [1, 0, -1], [-1, 0, -1], [0, 1, 1], [0, -1, 1], [0, 1, -1], [0, -1, -1]];

/** noise3(seed) → (x, y, z) => value in about [-1, 1] */
export function noise3(seed = 1) {
  const rand = rng(seed), p = new Uint8Array(256);
  for (let i = 0; i < 256; i++) p[i] = i;
  for (let i = 255; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [p[i], p[j]] = [p[j], p[i]]; }
  const perm = new Uint8Array(512), mod = new Uint8Array(512);
  for (let i = 0; i < 512; i++) { perm[i] = p[i & 255]; mod[i] = perm[i] % 12; }
  return (x, y, z) => {
    const s = (x + y + z) * F3, i = Math.floor(x + s), j = Math.floor(y + s), k = Math.floor(z + s);
    const t = (i + j + k) * G3, x0 = x - i + t, y0 = y - j + t, z0 = z - k + t;
    let i1, j1, k1, i2, j2, k2;
    if (x0 >= y0) { if (y0 >= z0) { i1 = 1; j1 = 0; k1 = 0; i2 = 1; j2 = 1; k2 = 0; } else if (x0 >= z0) { i1 = 1; j1 = 0; k1 = 0; i2 = 1; j2 = 0; k2 = 1; } else { i1 = 0; j1 = 0; k1 = 1; i2 = 1; j2 = 0; k2 = 1; } }
    else { if (y0 < z0) { i1 = 0; j1 = 0; k1 = 1; i2 = 0; j2 = 1; k2 = 1; } else if (x0 < z0) { i1 = 0; j1 = 1; k1 = 0; i2 = 0; j2 = 1; k2 = 1; } else { i1 = 0; j1 = 1; k1 = 0; i2 = 1; j2 = 1; k2 = 0; } }
    const x1 = x0 - i1 + G3, y1 = y0 - j1 + G3, z1 = z0 - k1 + G3;
    const x2 = x0 - i2 + 2 * G3, y2 = y0 - j2 + 2 * G3, z2 = z0 - k2 + 2 * G3;
    const x3 = x0 - 1 + 3 * G3, y3 = y0 - 1 + 3 * G3, z3 = z0 - 1 + 3 * G3;
    const ii = i & 255, jj = j & 255, kk = k & 255;
    const corner = (tx, ty, tz, g) => { let tt = 0.6 - tx * tx - ty * ty - tz * tz; if (tt < 0) return 0; tt *= tt; const G = GRAD[g]; return tt * tt * (G[0] * tx + G[1] * ty + G[2] * tz); };
    return 32 * (corner(x0, y0, z0, mod[ii + perm[jj + perm[kk]]]) + corner(x1, y1, z1, mod[ii + i1 + perm[jj + j1 + perm[kk + k1]]]) +
      corner(x2, y2, z2, mod[ii + i2 + perm[jj + j2 + perm[kk + k2]]]) + corner(x3, y3, z3, mod[ii + 1 + perm[jj + 1 + perm[kk + 1]]]));
  };
}

/** Fractal (fBm) noise: octaves of noise3, each at double frequency and `gain` amplitude. */
export function fbm3(seed = 1, {octaves = 4, lacunarity = 2, gain = 0.5} = {}) {
  const n = noise3(seed);
  return (x, y, z) => {
    let sum = 0, amp = 1, f = 1, norm = 0;
    for (let o = 0; o < octaves; o++) { sum += amp * n(x * f + o * 17.1, y * f - o * 9.3, z * f + o * 5.7); norm += amp; amp *= gain; f *= lacunarity; }
    return sum / norm;
  };
}

/** Ridged noise (1 - |n|), sharp crests: rocks, mountains, crumpled paper. */
export function ridged3(seed = 1, opts) {
  const f = fbm3(seed, opts);
  return (x, y, z) => 1 - Math.abs(f(x, y, z)) * 2;
}
