// Pixel work for the stage. Frames are ImageData in output pixels with straight (non-premultiplied) alpha.

export const canvas = (w, h) => new OffscreenCanvas(Math.max(1, w), Math.max(1, h));
export const ctx2d = c => c.getContext('2d', {willReadFrequently: true});

/** Alpha bounding box {x, y, w, h}, or null when nothing reaches `min`. */
export function alphaBox(img, min = 1) {
  const {width: w, height: h, data} = img;
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let y = 0; y < h; y++) {
    let row = y * w * 4 + 3, any = false;
    for (let x = 0; x < w; x++, row += 4) if (data[row] >= min) { any = true; if (x < x0) x0 = x; if (x > x1) x1 = x; }
    if (any) { if (y < y0) y0 = y; y1 = y; }
  }
  return x1 < 0 ? null : {x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1};
}

/** Which canvas borders carry visible alpha (content cut off by the frame). */
export function touchesEdge(img, min = 4, band = 2) {
  const {width: w, height: h, data} = img, at = (x, y) => data[(y * w + x) * 4 + 3] >= min;
  const hit = {left: false, right: false, top: false, bottom: false};
  for (let b = 0; b < band; b++) {
    for (let y = 0; y < h; y++) { if (at(b, y)) hit.left = true; if (at(w - 1 - b, y)) hit.right = true; }
    for (let x = 0; x < w; x++) { if (at(x, b)) hit.top = true; if (at(x, h - 1 - b)) hit.bottom = true; }
  }
  return hit;
}

export function crop(img, box) {
  const c = canvas(box.w, box.h);
  ctx2d(c).putImageData(img, -box.x, -box.y, box.x, box.y, box.w, box.h);
  return c;
}

export function toImageData(source, w, h) {
  const c = canvas(w, h), g = ctx2d(c);
  g.drawImage(source, 0, 0, w, h);
  return g.getImageData(0, 0, w, h);
}

// Weighted brightness of sRGB-encoded values, as the page will composite them, seen over white.
const lumW = (d, i) => { const a = d[i + 3] / 255; return (0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]) * a + 255 * (1 - a); };

/**
 * Shadow layer by ratio: the black-with-alpha image that turns `before` into `after` when painted on top.
 * Painting black at alpha a multiplies whatever is underneath by (1 - a) on any page background, so
 * a = 1 - L(after) / L(before) is exact for shadows on the floor and on objects alike, and overlapping
 * shadows never double-darken.
 */
export function ratioShadow(before, after, rgb = [0, 0, 0]) {
  const w = after.width, h = after.height, n = after.data, p = before?.data;
  const alpha = new Float32Array(w * h);
  // a shadow of colour T at alpha a turns L into L(1 - a) + L(T)·a, so a = (L_before - L_after) / (L_before - L(T))
  const lt = 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
  for (let i = 0, k = 0; i < n.length; i += 4, k++) {
    const lb = p ? lumW(p, i) : 255, la = lumW(n, i);
    const a = lb - lt > 3 ? (lb - la) / (lb - lt) : 0;
    alpha[k] = a < 0 ? 0 : a > 1 ? 1 : a;
  }
  // Over textured surfaces the ratio carries 8-bit quantisation noise; a 3×3 [1 2 1] blur removes it
  // (shadows are soft anyway) and roughly halves the size of the lossless alpha channel.
  const tmp = new Float32Array(w * h), sm = new Float32Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const k = y * w + x; tmp[k] = (alpha[k - (x > 0 ? 1 : 0)] + 2 * alpha[k] + alpha[k + (x < w - 1 ? 1 : 0)]) / 4; }
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const k = y * w + x; sm[k] = (tmp[k - (y > 0 ? w : 0)] + 2 * tmp[k] + tmp[k + (y < h - 1 ? w : 0)]) / 4; }
  const out = new ImageData(w, h), o = out.data;
  let sum = 0;
  for (let k = 0, i = 0; k < w * h; k++, i += 4) {
    const a = sm[k] < 0.006 ? 0 : sm[k];
    o[i] = rgb[0]; o[i + 1] = rgb[1]; o[i + 2] = rgb[2]; o[i + 3] = Math.round(a * 255);
    sum += a;
  }
  return {image: out, weight: sum};
}

export async function encode(c, type = 'image/webp', quality = 0.9) {
  return c.convertToBlob({type, quality});
}

export async function toBase64(blob) {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return btoa(s);
}

export function hexToRgb(hex) {
  const v = typeof hex === 'number' ? hex : parseInt(String(hex).replace('#', ''), 16);
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
}

/** Paint a background colour, then the given images (bitmaps/canvases with x, y) in order. */
export function composite(w, h, bg, items) {
  const c = canvas(w, h), g = ctx2d(c);
  if (bg) { g.fillStyle = bg; g.fillRect(0, 0, w, h); }
  for (const it of items) g.drawImage(it.image, it.x ?? 0, it.y ?? 0);
  return c;
}

/** Difference statistics between two same-sized canvases plus a heat map (red = mismatch). */
export function diff(a, b) {
  const w = a.width, h = a.height;
  const da = ctx2d(a).getImageData(0, 0, w, h).data, db = ctx2d(b).getImageData(0, 0, w, h).data;
  const heat = new ImageData(w, h), hd = heat.data, hist = new Uint32Array(256), lumaHist = new Uint32Array(256);
  let sum = 0, max = 0, maxAt = 0;
  for (let i = 0, px = 0; i < da.length; i += 4, px++) {
    const d = Math.max(Math.abs(da[i] - db[i]), Math.abs(da[i + 1] - db[i + 1]), Math.abs(da[i + 2] - db[i + 2]));
    hist[d]++; sum += d; if (d > max) { max = d; maxAt = px; }
    lumaHist[Math.min(255, Math.round(Math.abs((da[i] - db[i]) * 0.299 + (da[i + 1] - db[i + 1]) * 0.587 + (da[i + 2] - db[i + 2]) * 0.114)))]++;
    const grey = (da[i] * 0.3 + da[i + 1] * 0.59 + da[i + 2] * 0.11) * 0.45 + 120;
    const r = Math.min(255, d * 10);
    hd[i] = Math.max(grey, r); hd[i + 1] = grey * (1 - r / 255); hd[i + 2] = grey * (1 - r / 255); hd[i + 3] = 255;
  }
  const n = w * h, pct = (q, H = hist) => { let acc = 0; for (let v = 0; v < 256; v++) { acc += H[v]; if (acc >= n * q) return v; } return 255; };
  let over = 0; for (let v = 9; v < 256; v++) over += hist[v];
  const c = canvas(w, h); ctx2d(c).putImageData(heat, 0, 0);
  return {mean: +(sum / n).toFixed(3), p99: pct(0.99), p999: pct(0.999), lumaP99: pct(0.99, lumaHist), max, maxAt: [maxAt % w, Math.floor(maxAt / w)], over8: +(over / n * 100).toFixed(3), heat: c};
}

/** Blur the RGB of an RGBA byte array (box filter, twice ≈ gaussian); returns floats in the same layout. */
export function boxBlur(data, w, h, r) {
  let src = Float32Array.from(data), dst = new Float32Array(src.length);
  const pass = (horizontal) => {
    const [len, lines] = horizontal ? [w, h] : [h, w];
    for (let line = 0; line < lines; line++) for (let k = 0; k < 3; k++) {
      const at = i => (horizontal ? line * w + i : i * w + line) * 4 + k;
      let acc = 0, cnt = 0;
      for (let i = -r; i <= r; i++) if (i >= 0 && i < len) { acc += src[at(i)]; cnt++; }
      for (let i = 0; i < len; i++) {
        dst[at(i)] = acc / cnt;
        const out = i - r, inn = i + r + 1;
        if (out >= 0) { acc -= src[at(out)]; cnt--; }
        if (inn < len) { acc += src[at(inn)]; cnt++; }
      }
    }
    for (let i = 3; i < src.length; i += 4) dst[i] = src[i];
    [src, dst] = [dst, src];
  };
  pass(true); pass(false); pass(true); pass(false);
  return src;
}

export function checker(g, x, y, w, h, s = 10) {
  g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip();
  g.fillStyle = '#ffffff'; g.fillRect(x, y, w, h); g.fillStyle = '#e6e6e6';
  for (let j = 0; j * s < h; j++) for (let i = 0; i * s < w; i++) if ((i + j) % 2) g.fillRect(x + i * s, y + j * s, s, s);
  g.restore();
}
