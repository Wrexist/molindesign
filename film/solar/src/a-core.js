/* "Sneeze": what if the biggest solar storm in history hit Earth tomorrow? Long-form episode 2 of Tech, explained.
   A stickman explainer written in code and cut to the voice: every beat keys to a word time from vo/vo.js
   (window.VO, written by tools/voiceover.py) through at(id, word). Every frame is a pure function of t.
   Contract: window.FILM, DUR, render(t), READY, EV, TEXTS(t), SCORE(ctx).
   New since episode 1:
   - six "parts", each one question with a payoff, under a slam-shut chapter card
   - a Sun with a face
   - lit characters (rim light and contact shadows)
   - an orthographic globe
   - auroras
   - depth-of-field foregrounds
   - one quotable line per part, built from paper words
   Every number is sourced in BRIEF.md. */
(function () {
  'use strict';
  var W = 1920, H = 1080, VO = window.VO, DUR = VO.dur;
  var INK = '#1c1830', NIGHT = '#221d3a', DUSK = '#352b55', PLUM = '#56406f', MAUVE = '#7a5584';
  var HEAD = '#fbf7ef', HEADS = '#e2dbcc', HOOD = '#ff5b3d', HOODS = '#d6412a';
  var CREAM = '#f4ede0', PAPER = '#f1e9d8', PAPERS = '#e2d6bf', YEL = '#ffc83d', MINT = '#3fd6a2', LIGHT = '#8fe9ff', RED = '#ff4a3d', BLUE = '#3d7bff', GREEN = '#5fb86b', TEAL = '#2a9d8f';
  var SUN = '#ffb52e', SUN2 = '#ff7a1f', SUNHI = '#fff1a8', PLASMA = '#ff8a3d', AUR1 = '#5dffb0', AUR2 = '#b06bff';
  var DISP = 'Archivo', MONO = '"Geist Mono"', SERIF = '"Instrument Serif"';

  /* ---------- math ---------- */
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, k) { return a + (b - a) * k; }
  function seg(t, a, b) { return clamp((t - a) / (b - a), 0, 1); }
  function eo(k) { return k >= 1 ? 1 : 1 - Math.pow(2, -10 * k); }
  function eio(k) { return k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; }
  function ss(k) { return k * k * (3 - 2 * k); }
  function hash(i) { var x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
  function mulberry(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function spring(dt, f, z) {
    if (dt <= 0) return 0;
    var w = 2 * Math.PI * f, wd = w * Math.sqrt(1 - z * z);
    return 1 - Math.exp(-z * w * dt) * (Math.cos(wd * dt) + z * w / wd * Math.sin(wd * dt));
  }
  function sp(t, a, f, z) { return spring(t - a, f || 2.4, z || .85); }
  function pop(t, a, f, z) { return clamp(sp(t, a, f || 3, z || .7), 0, 1.08); }
  function win(t, a, b, o) { return t < a || t > b + (o || .3) ? 0 : clamp(sp(t, a, 3, .8), 0, 1.06) * (1 - eio(seg(t, b, b + (o || .3)))); }
  function knock(t, a, f, d) { if (t < a) return 0; var u = t - a; return Math.exp(-u * (d || 7)) * Math.sin(u * (f || 22)); }
  /* smooth value noise for handheld drift, never a jitter */
  function vnoise(x, s) { var i = Math.floor(x), f = x - i, a = hash(i + s * 91.7), b = hash(i + 1 + s * 91.7); return lerp(a, b, ss(f)) * 2 - 1; }
  function mix(a, b, k) {
    if (typeof a === 'number') return lerp(a, b, k);
    if (Array.isArray(a)) return a.map(function (v, i) { return mix(v, b[i], k); });
    return k < .4 ? a : b;
  }
  function kf(t, keys, ez) {
    ez = ez || eio;
    if (t <= keys[0][0]) return keys[0][1];
    for (var i = 1; i < keys.length; i++) if (t < keys[i][0]) return mix(keys[i - 1][1], keys[i][1], ez(seg(t, keys[i - 1][0], keys[i][0])));
    return keys[keys.length - 1][1];
  }

  /* ---------- the voice is the timeline ---------- */
  var LINE = {}; VO.lines.forEach(function (l) { LINE[l.id] = l; });
  function norm(w) { return w.toLowerCase().replace(/[^a-z0-9%.]/g, '').replace(/\.$/, ''); }
  function at(id, word, nth) {
    var l = LINE[id], n = nth || 0; if (!l) throw new Error('no line ' + id);
    if (typeof word === 'number') return l.words[Math.min(word, l.words.length - 1)].t0;
    for (var i = 0; i < l.words.length; i++) if (norm(l.words[i].w) === norm(word) && n-- === 0) return l.words[i].t0;
    throw new Error('no word "' + word + '" in line ' + id);
  }
  function wend(id, word, nth) {
    var l = LINE[id], n = nth || 0;
    if (typeof word === 'number') return l.words[Math.min(word, l.words.length - 1)].t1;
    for (var i = 0; i < l.words.length; i++) if (norm(l.words[i].w) === norm(word) && n-- === 0) return l.words[i].t1;
    throw new Error('no word "' + word + '" in line ' + id);
  }
  function end(id) { return LINE[id].t1; }
  function start(id) { return LINE[id].t0; }

  /* ---------- canvas ---------- */
  var cv, ctx, tmp, tctx, acc, actx, NOISE, LIVE = { grain: true, text: true };
  function mk(w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; return c; }

  /* ---------- primitives ---------- */
  function font(g, px, wt, fam, wide) { g.font = (wt || 800) + ' ' + px + 'px ' + (fam || DISP); try { g.fontStretch = wide ? 'expanded' : 'normal'; } catch (e) {} }
  function ls(g, px) { try { g.letterSpacing = px + 'px'; } catch (e) {} }
  function rr(g, x, y, w, h, r) { g.beginPath(); g.roundRect(x, y, w, h, r); }
  function circ(g, x, y, r) { g.beginPath(); g.arc(x, y, Math.max(0, r), 0, 6.2832); }
  function fillStroke(g, fill, lw, stroke) { if (fill) { g.fillStyle = fill; g.fill(); } if (lw) { g.lineWidth = lw; g.strokeStyle = stroke || INK; g.lineJoin = 'round'; g.lineCap = 'round'; g.stroke(); } }
  function txt(g, s, x, y, px, col, o) {
    o = o || {}; font(g, px, o.wt || 800, o.fam, o.wide); ls(g, o.ls || 0);
    g.textAlign = o.align || 'center'; g.textBaseline = 'middle';
    if (o.outline) { g.lineWidth = o.outline; g.strokeStyle = o.ocol || INK; g.lineJoin = 'round'; g.strokeText(s, x, y); }
    g.fillStyle = col || CREAM; g.fillText(s, x, y); var w = g.measureText(s).width; ls(g, 0); return w;
  }
  function chip(g, s, x, y, o) {
    o = o || {}; var px = o.px || 44, a = o.a == null ? 1 : o.a, sc = o.s == null ? 1 : o.s;
    if (a <= 0 || sc <= 0) return;
    font(g, px, o.wt || 800, o.fam, o.wide); ls(g, o.ls || 0);
    var tw = g.measureText(s).width, pad = o.pad == null ? px * .42 : o.pad, w = o.w || tw + pad * 2, h = o.h || px * 1.45;
    g.save(); g.globalAlpha *= clamp(a, 0, 1); g.translate(x, y); g.rotate(o.rot || 0); g.scale(sc, sc);
    if (!o.flat) { rr(g, -w / 2 + 7, -h / 2 + 9, w, h, o.r == null ? h * .3 : o.r); g.fillStyle = 'rgba(10,8,20,.45)'; g.fill(); }
    rr(g, -w / 2, -h / 2, w, h, o.r == null ? h * .3 : o.r); fillStroke(g, o.bg || CREAM, o.lw == null ? 5 : o.lw, o.line || INK);
    g.fillStyle = o.fg || INK; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(s, 0, px * .05);
    ls(g, 0); g.restore(); return w;
  }
  function arrow(g, x0, y0, x1, y1, k, col, lw, head) {
    if (k <= 0) return;
    var x = lerp(x0, x1, k), y = lerp(y0, y1, k), a = Math.atan2(y1 - y0, x1 - x0), hd = head || 30;
    g.save(); g.lineCap = 'round';
    g.strokeStyle = INK; g.lineWidth = (lw || 7) + 8; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x - Math.cos(a) * hd * .5, y - Math.sin(a) * hd * .5); g.stroke();
    g.strokeStyle = g.fillStyle = col || CREAM; g.lineWidth = lw || 7; g.stroke();
    g.beginPath(); g.moveTo(x, y); g.lineTo(x - Math.cos(a - .45) * hd, y - Math.sin(a - .45) * hd); g.lineTo(x - Math.cos(a + .45) * hd, y - Math.sin(a + .45) * hd); g.closePath(); fillStroke(g, col || CREAM, 5);
    g.restore();
  }
  function cross(g, x, y, s, a, col) {
    if (a <= 0 || s <= 0) return;
    g.save(); g.globalAlpha *= clamp(a, 0, 1); g.translate(x, y); g.scale(s, s); g.lineCap = 'round';
    g.strokeStyle = INK; g.lineWidth = 22; g.beginPath(); g.moveTo(-26, -26); g.lineTo(26, 26); g.moveTo(26, -26); g.lineTo(-26, 26); g.stroke();
    g.strokeStyle = col || RED; g.lineWidth = 12; g.stroke(); g.restore();
  }
  function tick(g, x, y, s, a, col) {
    if (a <= 0 || s <= 0) return;
    g.save(); g.globalAlpha *= clamp(a, 0, 1); g.translate(x, y); g.scale(s, s); g.lineCap = g.lineJoin = 'round';
    g.beginPath(); g.moveTo(-24, 0); g.lineTo(-7, 18); g.lineTo(26, -20);
    g.strokeStyle = INK; g.lineWidth = 22; g.stroke(); g.strokeStyle = col || MINT; g.lineWidth = 12; g.stroke(); g.restore();
  }
  function spark(g, x, y, t, t0, s, col) {
    if (t < t0 || t > t0 + .7) return;
    var k = seg(t, t0, t0 + .7), r = 20 + eo(k) * 90 * (s || 1), a = 1 - k;
    g.save(); g.globalAlpha *= a; g.translate(x, y); g.lineCap = 'round';
    for (var i = 0; i < 9; i++) {
      var an = i / 9 * 6.283 + hash(t0 * 10 + i) * .5, r0 = r * .35, r1 = r * (.8 + hash(i + t0) * .4);
      g.strokeStyle = INK; g.lineWidth = 12; g.beginPath(); g.moveTo(Math.cos(an) * r0, Math.sin(an) * r0); g.lineTo(Math.cos(an) * r1, Math.sin(an) * r1); g.stroke();
      g.strokeStyle = i % 2 ? YEL : (col || CREAM); g.lineWidth = 6; g.stroke();
    }
    circ(g, 0, 0, 26 * (1 - k)); g.fillStyle = '#fff6d8'; g.fill(); g.restore();
  }
  /* a jagged electric arc from a to b, re-drawn 12 times a second */
  function bolt(g, x0, y0, x1, y1, t, a, col, seed) {
    if (a <= 0) return;
    var n = 9, f = Math.floor(t * 12) + (seed || 0) * 31, pts = [[x0, y0]], dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy), nx = -dy / L, ny = dx / L;
    for (var i = 1; i < n; i++) { var u = i / n, off = (hash(f * 7.3 + i * 1.9) - .5) * L * .22; pts.push([x0 + dx * u + nx * off, y0 + dy * u + ny * off]); }
    pts.push([x1, y1]);
    g.save(); g.globalAlpha *= clamp(a, 0, 1); g.lineJoin = g.lineCap = 'round';
    function path() { g.beginPath(); pts.forEach(function (p, i) { if (i) g.lineTo(p[0], p[1]); else g.moveTo(p[0], p[1]); }); }
    path(); g.strokeStyle = INK; g.lineWidth = 13; g.stroke();
    path(); g.strokeStyle = col || YEL; g.lineWidth = 6; g.shadowColor = col || YEL; g.shadowBlur = 18; g.stroke();
    path(); g.strokeStyle = '#fffbe8'; g.lineWidth = 2; g.shadowBlur = 0; g.stroke();
    g.restore();
  }
  function spinner(g, x, y, r, t, col, a) {
    if (a <= 0) return;
    g.save(); g.globalAlpha *= a; g.translate(x, y); g.rotate(t * 6); g.lineCap = 'round';
    for (var i = 0; i < 8; i++) { g.rotate(Math.PI / 4); g.globalAlpha = a * (.2 + .8 * i / 7); g.strokeStyle = col || INK; g.lineWidth = r * .22; g.beginPath(); g.moveTo(r * .5, 0); g.lineTo(r, 0); g.stroke(); }
    g.restore();
  }
  function vignette(g, a) {
    var r = g.createRadialGradient(W / 2, H * .45, H * .35, W / 2, H * .5, H * 1.05);
    r.addColorStop(0, 'rgba(10,6,24,0)'); r.addColorStop(1, 'rgba(10,6,24,' + (a == null ? .5 : a) + ')');
    g.fillStyle = r; g.fillRect(0, 0, W, H);
  }
  /* a soft additive glow */
  function glow(g, x, y, r, col, a) {
    if (a <= 0) return;
    g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha *= clamp(a, 0, 1);
    var gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, col); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); g.restore();
  }
  /* a directional key light over the whole frame: warm or cool from one side, so flat art reads as lit */
  function keyLight(g, x, y, col, a) {
    g.save(); g.globalCompositeOperation = 'soft-light'; g.globalAlpha = a == null ? .5 : a;
    var gr = g.createRadialGradient(x, y, 0, x, y, 1700); gr.addColorStop(0, col); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.fillRect(0, 0, W, H); g.restore();
  }
  /* depth of field: draw fn blurred (foreground objects, out of focus) */
  function soft(g, px, fn) { g.save(); try { g.filter = 'blur(' + px + 'px)'; } catch (e) {} fn(g); g.restore(); }
  /* the camera: a slow push plus a gentle handheld drift, on every scene */
  function cam(g, t, s, z, cx, cy, drift) {
    var u = seg(t, s.t0, s.t1), zz = 1 + (z == null ? .05 : z) * ss(u), d = drift == null ? 1 : drift;
    var dx = vnoise(t * .35, s.t0) * 9 * d, dy = vnoise(t * .3, s.t0 + 7) * 6 * d, r = vnoise(t * .25, s.t0 + 3) * .004 * d;
    cx = cx == null ? W / 2 : cx; cy = cy == null ? H / 2 : cy;
    g.translate(cx + dx, cy + dy); g.rotate(r); g.scale(zz, zz); g.translate(-cx, -cy);
  }
