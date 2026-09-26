// 3D lettering from any font: a bundled typeface (helvetiker, optimer, gentilis, droid — regular/bold)
// or a .ttf/.otf file next to the scene. Returns geometry centred on x, standing on y = 0, facing +z.
import * as THREE from 'three';
import {FontLoader} from 'three/addons/loaders/FontLoader.js';
import {TTFLoader} from 'three/addons/loaders/TTFLoader.js';
import {TextGeometry} from 'three/addons/geometries/TextGeometry.js';
import {creased} from './geometry.js';

const cache = new Map();
const BUNDLED = ['helvetiker_regular', 'helvetiker_bold', 'optimer_regular', 'optimer_bold', 'gentilis_regular', 'gentilis_bold', 'droid/droid_sans_regular', 'droid/droid_sans_bold', 'droid/droid_serif_regular', 'droid/droid_serif_bold'];

/** Load a font: a bundled name (see BUNDLED) or a URL to .ttf/.otf/.typeface.json (new URL('./Brand.ttf', import.meta.url)). */
export async function loadFont(font = 'helvetiker_bold') {
  const key = String(font);
  if (cache.has(key)) return cache.get(key);
  let url = key, f;
  if (BUNDLED.includes(key) || /^[a-z_/]+$/.test(key)) url = new URL(`../fonts/${key}.typeface.json`, import.meta.resolve('three/addons/')).href;
  if (/\.(ttf|otf)(\?|$)/i.test(url)) f = new FontLoader().parse(await new TTFLoader().loadAsync(url));
  else f = await new FontLoader().loadAsync(url);
  cache.set(key, f);
  return f;
}

/**
 * text3d('Hello', {font, size, depth, bevel, letterSpacing, lineHeight, align})
 * size: cap height-ish in scene units; depth: extrusion; bevel: rounded edge size (0 for sharp).
 * Multi-line text with '\n'. Letter spacing in em.
 */
export async function text3d(text, {font = 'helvetiker_bold', size = 0.5, depth = 0.12, bevel = 0.012, bevelSegments = 5, curveSegments = 10, letterSpacing = 0, lineHeight = 1.2, align = 'center'} = {}) {
  const f = await loadFont(font);
  const lines = String(text).split('\n');
  const parts = [];
  lines.forEach((line, li) => {
    let x = 0; const glyphs = [];
    if (letterSpacing) {
      for (const ch of line) {
        if (ch === ' ') { x += size * 0.3 + letterSpacing * size; continue; }
        const g = new TextGeometry(ch, {font: f, size, depth, bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel * 0.8, bevelSegments, curveSegments});
        g.computeBoundingBox(); const w = g.boundingBox.max.x - g.boundingBox.min.x;
        g.translate(x - g.boundingBox.min.x, 0, 0); glyphs.push(g); x += w + letterSpacing * size;
      }
    } else {
      const g = new TextGeometry(line, {font: f, size, depth, bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel * 0.8, bevelSegments, curveSegments});
      glyphs.push(g);
    }
    const merged = mergeAll(glyphs);
    if (!merged) return;
    merged.computeBoundingBox();
    const bb = merged.boundingBox, w = bb.max.x - bb.min.x;
    const dx = align === 'left' ? -bb.min.x : align === 'right' ? -bb.max.x : -(bb.min.x + w / 2);
    merged.translate(dx, -(li * size * lineHeight), 0);
    parts.push(merged);
  });
  const g = mergeAll(parts);
  g.computeBoundingBox();
  g.translate(0, -g.boundingBox.min.y, -(g.boundingBox.min.z + g.boundingBox.max.z) / 2);
  return creased(g, 35);
}

function mergeAll(list) {
  if (!list.length) return null;
  if (list.length === 1) return list[0];
  const arrays = {position: [], normal: [], uv: []};
  for (const g of list) {
    const n = g.index ? g.toNonIndexed() : g;
    for (const k of Object.keys(arrays)) if (n.attributes[k]) arrays[k].push(...n.attributes[k].array);
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.Float32BufferAttribute(arrays.position, 3));
  if (arrays.normal.length === arrays.position.length) out.setAttribute('normal', new THREE.Float32BufferAttribute(arrays.normal, 3));
  if (arrays.uv.length) out.setAttribute('uv', new THREE.Float32BufferAttribute(arrays.uv, 2));
  return out;
}

export {BUNDLED as FONTS};
