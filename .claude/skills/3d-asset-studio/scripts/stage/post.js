// 2D finishing on canvases: bloom from an emissive pass (alpha-aware, so glows work on transparent sprites),
// backgrounds (solid, gradients) for stills, vignette and film grain.
import {canvas, ctx2d} from './pixels.js';
import {rng} from 'w3d/materials.js';

/** Add glow: `glow` is an emissive-only render (black elsewhere). strength ~0.6–2, radius in % of the image width. */
export function bloom(base, glow, {strength = 1, radius = 1.2} = {}) {
  const w = base.width, h = base.height, out = canvas(w, h), g = ctx2d(out);
  g.drawImage(base, 0, 0);
  g.globalCompositeOperation = 'lighter';
  const px = w * radius / 100;
  for (const [k, weight] of [[0.35, 0.55], [1, 0.4], [2.6, 0.3], [6, 0.2]]) {
    g.filter = `blur(${Math.max(0.5, px * k)}px)`;
    g.globalAlpha = Math.min(1, weight * strength);
    g.drawImage(glow, 0, 0);
  }
  g.filter = 'none'; g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  return out;
}

/** Paint a background under a (transparent) render. spec: '#hex' | {linear: [top, bottom], angle} | {radial: [centre, edge], at: [x, y]} */
export function paintBackground(img, spec) {
  if (!spec || spec === 'transparent') return img;
  const w = img.width, h = img.height, out = canvas(w, h), g = ctx2d(out);
  if (typeof spec === 'string') g.fillStyle = spec;
  else if (spec.linear) {
    const a = ((spec.angle ?? 180) - 90) * Math.PI / 180, r = Math.hypot(w, h) / 2, cx = w / 2, cy = h / 2;
    const grad = g.createLinearGradient(cx - Math.cos(a) * r, cy - Math.sin(a) * r, cx + Math.cos(a) * r, cy + Math.sin(a) * r);
    spec.linear.forEach((c, i) => grad.addColorStop(i / (spec.linear.length - 1), c));
    g.fillStyle = grad;
  } else if (spec.radial) {
    const [x, y] = spec.at ?? [0.5, 0.45];
    const grad = g.createRadialGradient(w * x, h * y, 0, w * x, h * y, Math.hypot(w, h) * (spec.size ?? 0.62));
    spec.radial.forEach((c, i) => grad.addColorStop(i / (spec.radial.length - 1), c));
    g.fillStyle = grad;
  }
  g.fillRect(0, 0, w, h);
  g.drawImage(img, 0, 0);
  return out;
}

export function vignette(img, amount = 0.25) {
  const w = img.width, h = img.height, g = ctx2d(img);
  const grad = g.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.hypot(w, h) * 0.6);
  grad.addColorStop(0, 'rgba(0,0,0,0)'); grad.addColorStop(1, `rgba(0,0,0,${amount})`);
  g.globalCompositeOperation = 'source-atop'; g.fillStyle = grad; g.fillRect(0, 0, w, h); g.globalCompositeOperation = 'source-over';
  return img;
}

/** Film grain on the visible pixels only (keeps transparency). */
export function filmGrain(img, amount = 0.035, seed = 9) {
  const g = ctx2d(img), d = g.getImageData(0, 0, img.width, img.height), p = d.data, rand = rng(seed);
  for (let i = 0; i < p.length; i += 4) { if (!p[i + 3]) continue; const n = (rand() - 0.5) * 255 * amount; p[i] += n; p[i + 1] += n; p[i + 2] += n; }
  g.putImageData(d, 0, 0);
  return img;
}
