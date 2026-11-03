/* "Phone photos" — why your phone photos look better than real life. Factory #13 on Tech, explained, after ../gpus/.
   A vertical explainer written in code, narrated first and cut to the voice: every visual beat is keyed to a word time
   from vo/vo.js (window.VO, written by tools/voiceover.py) with at(id, word). Pure function of t.
   Contract: window.FILM, DUR, render(t), READY, EV, TEXTS(t), SCORE(ctx).
   The native move is tracing paper: one frame is one sheet. Every sheet carries the same cut-paper scene (a friend on a
   pier at sunset) and its own seeded grain. The stack really is their per-pixel mean, computed at init, then the same
   tone lift as the single frames, so the grain that thins on screen is the grain that averaging removes. One hero
   stamp only: 9 → 1. No phone screens, no app UI, no real photos, no logos. Facts and sources: BRIEF.md. */
(function () {
  'use strict';
  var W = 1080, H = 1920, VO = window.VO, DUR = VO.dur, CX = 510;
  var BG = '#15131b', CREAM = '#f4ede0';
  var HOT = '#ff5b3d';
  var PAPER = '#f1e9d8', INK = '#211d26';
  var BODY2 = '#3d3849', SKIN = '#e2b896', SKIN_D = '#b98a6c';
  var DISP = 'Archivo', MONO = '"Geist Mono"';

  /* ---------- math ---------- */
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, k) { return a + (b - a) * k; }
  function seg(t, a, b) { return clamp((t - a) / (b - a), 0, 1); }
  function eio(k) { return k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; }
  function eout(k) { return 1 - Math.pow(1 - k, 3); }
  function mulberry(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function gauss(r) { var u = Math.max(1e-9, r()), v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(6.2832 * v); }
  function spring(dt, f, z) {
    if (dt <= 0) return 0;
    var w = 2 * Math.PI * f, wd = w * Math.sqrt(1 - z * z);
    return 1 - Math.exp(-z * w * dt) * (Math.cos(wd * dt) + z * w / wd * Math.sin(wd * dt));
  }
  function sp(t, a, f, z) { return spring(t - a, f || 2.4, z || .85); }
  function pop(t, a, f, z) { return clamp(sp(t, a, f || 3, z || .85), 0, 1.04); }
  function fin(t, a, f) { return clamp(sp(t, a, f || 3) * 2, 0, 1); }
  function knock(t, a, f, d) { if (t < a) return 0; var u = t - a; return Math.exp(-u * (d || 7)) * Math.sin(u * (f || 22)); }
  function kn(t, a) { return 1 + Math.max(0, knock(t, a, 16, 6)) * .08; }
  function strHash(s) { var h = 7; for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return h; }
  /* the renderer samples each frame at (i + .5) / fps: anything that shows a changing count is held to its frame's
     centre, so motion blur never mixes two values */
  function qt(t) { return (Math.floor(t * 30) + .5) / 30; }

  /* ---------- the voice is the timeline ---------- */
  var LINE = {}; VO.lines.forEach(function (l) { LINE[l.id] = l; });
  function norm(w) { return w.toLowerCase().replace(/[^a-z0-9%]/g, ''); }
  function find(id, word, nth) {
    var l = LINE[id], n = nth || 0; if (typeof word === 'number') return l.words[word];
    for (var i = 0; i < l.words.length; i++) if (norm(l.words[i].w) === norm(word) && n-- === 0) return l.words[i];
    throw new Error('no word "' + word + '" in line ' + id);
  }
  function at(id, word, nth) { return find(id, word, nth).t0; }
  function wend(id, word, nth) { return find(id, word, nth).t1; }
  function start(id) { return LINE[id].t0; }

  /* scenes. swipe:true = the next scene comes in under the torn edge */
  var SWIPE = .44, PRE = .3;
  var SC = [
    { id: 'hook', fn: 'fan', name: '1 tap, 9 photos', t0: 0 },
    { id: 'before', fn: 'ring', name: 'Before you tap', t0: start('before') - .2, swipe: true },
    /* a straight cut on "Here's the trick" (the voice is audible from about +0.17 s): the ring's credit keeps its read time */
    { id: 'dark', fn: 'stk', name: 'Shot dark, stacked', t0: start('dark') + .06 },
    /* the hero holds full size until the tear; "why" is the same table, the pile small and low */
    { id: 'why', fn: 'stk', name: 'Grain moves, scene stays', t0: start('why') - .04, swipe: true },
    /* the tear rises once "The scene doesn't." has been said */
    { id: 'night', fn: 'night', name: 'Night: up to 15', t0: start('night'), swipe: true },
    /* a straight cut: the quote that pops on "brighter" keeps its read time */
    { id: 'blend', fn: 'blend', name: 'A blend', t0: start('blend') - .02 },
    { id: 'end', fn: 'empty', name: 'Real?', t0: start('end') - .02 }
  ];
  SC.forEach(function (s, i) { s.t1 = i + 1 < SC.length ? SC[i + 1].t0 : DUR; });
  function S(id) { for (var i = 0; i < SC.length; i++) if (SC[i].id === id) return SC[i]; }
  var SHOTS = SC.map(function (s) { return { id: s.id, name: s.name, t0: s.t0, t1: s.t1 }; });

  /* ---------- canvas ---------- */
  var cv, ctx, tmp, tctx, acc, actx, LIVE = { grain: true, text: true };
  function mk(w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; return c; }

  /* ---------- the safe-area check: every glyph box drawn on the film canvas is measured (window.BOUNDS_RUN) ---------- */
  var BOUNDS = null, INCOMING = false, CURT = 0, SAFE = { x0: 90, x1: 930, y1: 1450 };
  function recBox(g, x0, y0, x1, y1, text) {
    if (!BOUNDS || INCOMING || (g !== ctx && g !== tctx) || g.globalAlpha < .05) return;
    var m = g.getTransform(), xs = [], ys = [];
    [[x0, y0], [x1, y0], [x0, y1], [x1, y1]].forEach(function (p) { xs.push(m.a * p[0] + m.c * p[1] + m.e); ys.push(m.b * p[0] + m.d * p[1] + m.f); });
    var a = Math.min.apply(null, xs), b = Math.max.apply(null, xs), c = Math.max.apply(null, ys);
    if (a < SAFE.x0 - .5 || b > SAFE.x1 + .5 || c > SAFE.y1 + .5) BOUNDS.push({ t: CURT, text: text, x0: Math.round(a), x1: Math.round(b), y1: Math.round(c) });
  }
  function watch(g) {
    var orig = g.fillText;
    g.fillText = function (str, x, y) {
      if (BOUNDS) { var mm = this.measureText(str); recBox(this, x - mm.actualBoundingBoxLeft, y - mm.actualBoundingBoxAscent, x + mm.actualBoundingBoxRight, y + mm.actualBoundingBoxDescent, str); }
      return orig.apply(this, arguments);
    };
  }

  /* ---------- primitives ---------- */
  function font(g, px, wt, fam) { g.font = (wt || 800) + ' ' + px + 'px ' + (fam || DISP); }
  function rr(g, x, y, w, h, r) { g.beginPath(); g.roundRect(x, y, w, h, Math.max(0, Math.min(r, w / 2, h / 2))); }
  function ls(g, px) { try { g.letterSpacing = px + 'px'; } catch (e) {} }
  function wide(g) { try { g.fontStretch = 'expanded'; } catch (e) {} }
  function chip(g, text, x, y, o) {
    o = o || {}; var px = o.px || 64, a = o.a == null ? 1 : o.a, s = o.s == null ? 1 : o.s;
    if (a <= 0 || s <= 0) return 0;
    font(g, px, o.wt, o.fam); if (o.wd) wide(g); ls(g, o.ls || 0);
    var tw = g.measureText(text).width, pad = o.pad == null ? px * .32 : o.pad;
    while (o.maxw && tw + pad * 2 > o.maxw && px > 36) { px -= 2; font(g, px, o.wt, o.fam); if (o.wd) wide(g); tw = g.measureText(text).width; pad = o.pad == null ? px * .32 : o.pad; }
    var w = o.w || tw + pad * 2, h = o.h || px * 1.28;
    g.save(); g.globalAlpha *= clamp(a, 0, 1); g.translate(x, y); if (o.rot) g.rotate(o.rot); g.scale(s, s);
    if (o.bg || o.line) recBox(g, -w / 2, -h / 2, w / 2, h / 2, '[chip] ' + text);
    if (o.bg) { if (o.shadow !== false) { rr(g, -w / 2 + 6, -h / 2 + 9, w, h, o.r == null ? h * .26 : o.r); g.fillStyle = 'rgba(0,0,0,.35)'; g.fill(); } rr(g, -w / 2, -h / 2, w, h, o.r == null ? h * .26 : o.r); g.fillStyle = o.bg; g.fill(); }
    if (o.line) { rr(g, -w / 2, -h / 2, w, h, o.r == null ? h * .26 : o.r); g.strokeStyle = o.line; g.lineWidth = o.lw || 3; g.stroke(); }
    g.fillStyle = o.fg || (o.bg ? BG : CREAM); g.textAlign = 'center'; g.textBaseline = 'middle';
    font(g, px, o.wt, o.fam); if (o.wd) wide(g);
    g.fillText(text, 0, px * .04); g.restore(); ls(g, 0);
    return w;
  }
  /* one line of type, shrunk to fit maxw; never under 36 px */
  function txt(g, text, x, y, px, col, align, wt, fam, maxw, a) {
    a = a == null ? 1 : a; if (a <= 0) return;
    g.save(); g.globalAlpha *= clamp(a, 0, 1); font(g, px, wt || 900, fam); ls(g, 0);
    while (maxw && g.measureText(text).width > maxw && px > 36) { px -= 2; font(g, px, wt || 900, fam); }
    g.fillStyle = col || CREAM; g.textAlign = align || 'center'; g.textBaseline = 'middle';
    g.fillText(text, x, y); g.restore();
  }
  function el(g, x, y, rx, ry, rot) { g.beginPath(); g.ellipse(x, y, rx, ry, rot || 0, 0, 6.283); g.fill(); }
  /* quiet tags (OUR ILLUSTRATION): cream outline, never coral; coral is kept for the frame-0 numbers and the one stamp */
  function tag(g, text, x, y, a, rot) { chip(g, text, x, y, { px: 36, wt: 700, fam: MONO, line: CREAM, lw: 3, fg: CREAM, a: a, rot: rot == null ? .02 : rot, shadow: false, bg: 'rgba(21,19,27,.9)', maxw: 820 }); }
  /* credits and sources never show in the incoming scene under the tear: they appear once it has covered the old one */
  function cred(a) { return INCOMING ? 0 : a; }
  /* a quotation: exactly the source's words, cut with "…", in cream, 40 px, two lines */
  function quote(g, lines, y, a, px) {
    if (a <= 0) return; px = px || 42;
    lines.forEach(function (l, i) { txt(g, l, CX, y + i * px * 1.25, px, CREAM, 'center', 700, DISP, 820, a); });
  }

  /* ---------- the one rubber stamp: worn ink (seeded speckle), slammed ---------- */
  var STEX = {};
  function stampTex(text, col, px) {
    var key = text + col + px; if (STEX[key]) return STEX[key];
    var m = mk(4, 4).getContext('2d'); font(m, px, 900); ls(m, 2);
    var lw = m.measureText(text).width, pad = px * .45, h = px * 1.25, w = lw + pad * 2, c = mk(Math.ceil(w + 16), Math.ceil(h + 16)), g = c.getContext('2d');
    g.translate(8, 8); g.strokeStyle = col; g.fillStyle = col;
    g.lineWidth = Math.max(4, px * .085); rr(g, 2, 2, w - 4, h - 4, px * .14); g.stroke();
    g.lineWidth = Math.max(2, px * .03); rr(g, px * .14, px * .14, w - px * .28, h - px * .28, px * .08); g.stroke();
    g.textAlign = 'center'; g.textBaseline = 'middle'; font(g, px, 900); ls(g, 2); g.fillText(text, w / 2, h / 2 + px * .05);
    var r = mulberry(strHash(key)), n = Math.floor(w * h / 140);
    g.globalCompositeOperation = 'destination-out';
    for (var i = 0; i < n; i++) { g.globalAlpha = .35 + r() * .65; g.beginPath(); g.arc(r() * w, r() * h, .6 + r() * 1.9, 0, 6.283); g.fill(); }
    c.w = w + 16; c.h = h + 16; STEX[key] = c; return c;
  }
  function stamp(g, text, x, y, t, t0, t1, px, col, rot) {
    if (t < t0 || t > t1 + .25) return;
    var c = stampTex(text, col, px);
    var k = sp(t, t0, 3.2, .8), s = lerp(1.35, 1, clamp(k, 0, 1)), al = clamp(k * 3, 0, 1) * (1 - seg(t, t1, t1 + .25));
    g.save(); g.globalAlpha *= al; g.translate(x, y); g.rotate(rot == null ? -.08 : rot); g.scale(s, s);
    if (k >= 1) recBox(g, -c.w / 2 - 14, -c.h / 2 - 4, c.w / 2 - 6, c.h / 2 + 4, text);
    g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(-c.w / 2 - 4, -c.h / 2 + 10, c.w + 8, c.h);
    g.fillStyle = PAPER; g.fillRect(-c.w / 2 - 14, -c.h / 2 - 4, c.w + 8, c.h + 8);
    g.drawImage(c, -c.w / 2 - 10, -c.h / 2); g.restore();
  }

  /* =====================================================================================================
     THE SHEETS. Two cut-paper scenes drawn once at "real life" brightness (the sky near paper-white, the backlit face
     about half as bright). A frame is that scene × an exposure, plus its own seeded grain (5 px speckle, Gaussian),
     clipped to paper. Day: 9 frames at 0.45 exposure (deliberately dark). D = the dark frame as shot, S = that frame
     brightened, M[n] = the mean of frames 1..n+1, brightened the same way. F = one frame exposed for the face (×1.8):
     the sky clips to blank paper. Night: 15 frames; NM[n] = mean of 1..n+1, brightened more as the stack grows.
     ===================================================================================================== */
  var SW = 560, SHT = 700, NW = 360, NH = 450;
  var IM = { D: [], S: [], M: [], F: null, ND: null, NM: [], NMb: null };
  var FACE = { u: .36, v: .56 };               /* the face centre, in sheet units */
  function rgb(c) { return 'rgb(' + c[0] + ',' + c[1] + ',' + c[2] + ')'; }
  /* a cut-paper shape: a polygon whose straight edges wobble a little (seeded), like scissors */
  function cut(g, pts, r, amp) {
    g.beginPath();
    for (var i = 0; i < pts.length; i++) {
      var a = pts[i], b = pts[(i + 1) % pts.length], n = Math.max(1, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / 24));
      for (var k = 0; k < n; k++) { var f = k / n; g.lineTo(lerp(a[0], b[0], f) + (r() - .5) * amp, lerp(a[1], b[1], f) + (r() - .5) * amp); }
    }
    g.closePath(); g.fill();
  }
  function band(g, y0, y1, w, r, amp) { var p = [[-10, y0], [w + 10, y0], [w + 10, y1], [-10, y1]]; cut(g, p, r, amp); }
  function person(g, w, h, r, P) {
    /* jacket and shoulders */
    g.fillStyle = rgb(P.jacket);
    cut(g, [[w * .02, h * 1.02], [w * .05, h * .86], [w * .17, h * .765], [w * .55, h * .765], [w * .67, h * .86], [w * .71, h * 1.02]], r, 3);
    g.fillStyle = rgb(P.collar); cut(g, [[w * .27, h * .765], [w * .45, h * .765], [w * .36, h * .84]], r, 2);
    /* neck, head, ear */
    g.fillStyle = rgb(P.skin); g.fillRect(w * .315, h * .66, w * .09, h * .11);
    el(g, w * FACE.u, h * FACE.v, w * .115, h * .132);
    el(g, w * (FACE.u + .112), h * (FACE.v + .01), w * .022, h * .03);
    /* hair: a cut cap over the top and the back */
    g.fillStyle = rgb(P.hair);
    g.save(); g.beginPath(); g.ellipse(w * FACE.u, h * (FACE.v - .02), w * .128, h * .142, 0, 0, 6.283); g.clip();
    cut(g, [[w * .2, h * .38], [w * .52, h * .38], [w * .52, h * (FACE.v - .045)], [w * .43, h * (FACE.v - .06)], [w * .34, h * (FACE.v - .035)], [w * .26, h * (FACE.v - .02)], [w * .2, h * (FACE.v + .06)]], r, 2);
    g.restore();
    /* eyes, brows, a smile */
    g.fillStyle = rgb(P.feat);
    el(g, w * (FACE.u - .042), h * (FACE.v + .012), w * .012, h * .011); el(g, w * (FACE.u + .045), h * (FACE.v + .012), w * .012, h * .011);
    g.strokeStyle = rgb(P.feat); g.lineWidth = Math.max(2, w * .008); g.lineCap = 'round';
    g.beginPath(); g.moveTo(w * (FACE.u - .065), h * (FACE.v - .016)); g.lineTo(w * (FACE.u - .022), h * (FACE.v - .02)); g.moveTo(w * (FACE.u + .024), h * (FACE.v - .02)); g.lineTo(w * (FACE.u + .068), h * (FACE.v - .016)); g.stroke();
    g.beginPath(); g.arc(w * FACE.u, h * (FACE.v + .045), w * .04, .35, Math.PI - .35); g.stroke();
    g.fillStyle = rgb(P.cheek); el(g, w * (FACE.u - .07), h * (FACE.v + .04), w * .02, h * .012); el(g, w * (FACE.u + .072), h * (FACE.v + .04), w * .02, h * .012);
  }
  function rail(g, w, h, r, col) {
    g.fillStyle = rgb(col);
    cut(g, [[-10, h * .646], [w + 10, h * .652], [w + 10, h * .672], [-10, h * .666]], r, 2);
    for (var x = .07; x < 1; x += .13) cut(g, [[w * x, h * .64], [w * (x + .022), h * .64], [w * (x + .024), h * .79], [w * (x - .002), h * .79]], r, 2);
  }
  function drawDay(g, w, h) {
    var r = mulberry(11);
    var B = [[0, [255, 166, 118]], [.15, [255, 184, 132]], [.29, [255, 202, 150]], [.41, [255, 220, 172]], [.51, [255, 236, 200]]];
    B.forEach(function (b, i) { g.fillStyle = rgb(b[1]); band(g, h * b[0], h * .64, w, r, 6); });
    g.fillStyle = rgb([255, 250, 232]); el(g, w * .72, h * .45, w * .085, w * .085);
    g.fillStyle = rgb([255, 214, 186]);
    cut(g, [[w * .05, h * .19], [w * .42, h * .18], [w * .46, h * .21], [w * .08, h * .22]], r, 3);
    cut(g, [[w * .55, h * .29], [w * .98, h * .28], [w * 1.0, h * .31], [w * .6, h * .315]], r, 3);
    g.fillStyle = rgb([118, 124, 178]); band(g, h * .6, h * .76, w, r, 3);
    g.fillStyle = rgb([226, 206, 196]); for (var i = 0; i < 5; i++) cut(g, [[w * (.6 + i * .02), h * (.62 + i * .025)], [w * (.84 - i * .015), h * (.62 + i * .025)], [w * (.84 - i * .015), h * (.628 + i * .025)], [w * (.6 + i * .02), h * (.628 + i * .025)]], r, 1.5);
    g.fillStyle = rgb([98, 74, 60]); band(g, h * .76, h * 1.01, w, r, 3);
    g.fillStyle = rgb([76, 56, 46]); for (i = 0; i < 5; i++) g.fillRect(0, h * (.8 + i * .05), w, 3);
    rail(g, w, h, r, [46, 36, 40]);
    person(g, w, h, r, { jacket: [62, 84, 128], collar: [200, 190, 170], skin: [156, 108, 86], hair: [46, 32, 30], feat: [44, 28, 26], cheek: [176, 104, 92] });
  }
  function drawNight(g, w, h) {
    var r = mulberry(23);
    g.fillStyle = rgb([16, 20, 44]); band(g, 0, h * .35, w, r, 4);
    g.fillStyle = rgb([28, 28, 58]); band(g, h * .33, h * .64, w, r, 4);
    g.fillStyle = rgb([236, 232, 212]); el(g, w * .78, h * .17, w * .055, w * .055);
    /* the skyline: cut black card with lit windows */
    var x = -6;
    while (x < w) {
      var bw = w * (.07 + r() * .08), top = h * (.34 + r() * .16);
      g.fillStyle = rgb([9, 9, 16]); cut(g, [[x, top], [x + bw, top], [x + bw, h * .62], [x, h * .62]], r, 1.5);
      g.fillStyle = rgb([255, 214, 128]);
      for (var yy = top + 8; yy < h * .6; yy += 11) for (var xx = x + 5; xx < x + bw - 6; xx += 9) if (r() < .32) g.fillRect(xx, yy, 4, 5);
      x += bw + 2;
    }
    g.fillStyle = rgb([12, 14, 28]); band(g, h * .6, h * .76, w, r, 3);
    g.fillStyle = rgb([150, 120, 70]); for (var i = 0; i < 9; i++) { var sx = w * (.05 + r() * .9); g.fillRect(sx, h * (.63 + r() * .1), w * .05, 2); }
    g.fillStyle = rgb([30, 24, 22]); band(g, h * .76, h * 1.01, w, r, 3);
    rail(g, w, h, r, [8, 8, 12]);
    person(g, w, h, r, { jacket: [26, 32, 50], collar: [80, 76, 70], skin: [66, 48, 42], hair: [10, 8, 8], feat: [16, 10, 10], cheek: [74, 46, 42] });
  }
  function lift(v, k) { return k * v / (1 + (k - 1) * v); }
  function toCanvas(w, h, arr, fn) {
    var c = mk(w, h), g = c.getContext('2d'), id = g.createImageData(w, h), d = id.data;
    for (var i = 0, n = w * h; i < n; i++) { d[i * 4] = 255 * fn(arr[i * 3]); d[i * 4 + 1] = 255 * fn(arr[i * 3 + 1]); d[i * 4 + 2] = 255 * fn(arr[i * 3 + 2]); d[i * 4 + 3] = 255; }
    g.putImageData(id, 0, 0); return c;
  }
  function frameOf(base, w, h, gain, sig, B, seed) {
    var r = mulberry(seed), bw = Math.ceil(w / B), bh = Math.ceil(h / B), nz = new Float32Array(bw * bh * 3), out = new Float32Array(w * h * 3);
    for (var i = 0; i < bw * bh; i++) { var l = gauss(r) * sig; nz[i * 3] = l + gauss(r) * sig * .25; nz[i * 3 + 1] = l + gauss(r) * sig * .25; nz[i * 3 + 2] = l + gauss(r) * sig * .25; }
    for (var y = 0; y < h; y++) for (var x = 0; x < w; x++) {
      var p = (y * w + x) * 3, q = (Math.floor(y / B) * bw + Math.floor(x / B)) * 3;
      for (var c = 0; c < 3; c++) out[p + c] = clamp(base[(y * w + x) * 4 + c] / 255 * gain + nz[q + c], 0, 1);
    }
    return out;
  }
  function buildSheets() {
    var c = mk(SW, SHT), g = c.getContext('2d'); drawDay(g, SW, SHT);
    var base = g.getImageData(0, 0, SW, SHT).data, sum = new Float32Array(SW * SHT * 3), K = 3.2, k, i;
    var id = function (v) { return v; }, lk = function (v) { return lift(v, K); };
    for (k = 0; k < 9; k++) {
      var f = frameOf(base, SW, SHT, .45, .07, 5, 1000 + k * 77);
      for (i = 0; i < f.length; i++) sum[i] += f[i];
      IM.D.push(toCanvas(SW, SHT, f, id)); IM.S.push(toCanvas(SW, SHT, f, lk));
      var m = new Float32Array(f.length); for (i = 0; i < f.length; i++) m[i] = sum[i] / (k + 1);
      IM.M.push(toCanvas(SW, SHT, m, lk));
    }
    IM.F = toCanvas(SW, SHT, frameOf(base, SW, SHT, 1.9, .025, 5, 999), id);
    /* the same frame's sky before it clips (gain 1): only the sky, the head and everything below the horizon cut away */
    IM.Fsky = toCanvas(SW, SHT, frameOf(base, SW, SHT, 1.0, .025, 5, 999), id);
    var fg = IM.Fsky.getContext('2d'); fg.globalCompositeOperation = 'destination-out';
    fg.fillRect(0, SHT * .6, SW, SHT); fg.beginPath(); fg.ellipse(SW * FACE.u, SHT * (FACE.v - .01), SW * .14, SHT * .165, 0, 0, 6.283); fg.fill();
    var cn = mk(NW, NH), gn = cn.getContext('2d'); drawNight(gn, NW, NH);
    var nb = gn.getImageData(0, 0, NW, NH).data, ns = new Float32Array(NW * NH * 3);
    for (k = 0; k < 15; k++) {
      var fn = frameOf(nb, NW, NH, 1, .07, 4, 5000 + k * 31);
      for (i = 0; i < fn.length; i++) ns[i] += fn[i];
      if (k === 0) IM.ND = toCanvas(NW, NH, fn, id);
      var mn = new Float32Array(fn.length); for (i = 0; i < fn.length; i++) mn[i] = ns[i] / (k + 1);
      var kk = 1 + k / 14 * 6;
      IM.NM.push(toCanvas(NW, NH, mn, function (v) { return lift(v, kk); }));
      if (k === 14) IM.NMb = toCanvas(NW, NH, mn, function (v) { return lift(v, 10); });
    }
  }
  /* a sheet on the table: paper border, soft shadow, the frame; sx flips it edge-on */
  function sheet(g, img, cx, cy, sc, rot, o) {
    o = o || {}; var iw = img ? img.width : SW, ih = img ? img.height : SHT, w = iw * sc, h = ih * sc, b = o.b == null ? Math.max(6, 16 * sc) : o.b;
    var a = o.a == null ? 1 : o.a; if (a <= 0 || sc <= 0) return;
    g.save(); g.globalAlpha *= a; g.translate(cx, cy); if (rot) g.rotate(rot); if (o.sx != null) g.scale(Math.max(.001, o.sx), 1);
    if (o.shadow !== false) { g.fillStyle = 'rgba(0,0,0,.34)'; g.fillRect(-w / 2 - b + 10, -h / 2 - b + 14, w + 2 * b, h + 2 * b); }
    g.fillStyle = o.paper || PAPER; g.fillRect(-w / 2 - b, -h / 2 - b, w + 2 * b, h + 2 * b);
    if (img) g.drawImage(img, -w / 2, -h / 2, w, h); else { g.fillStyle = o.fill || '#0e0d13'; g.fillRect(-w / 2, -h / 2, w, h); }
    if (o.over && o.overA > 0) { g.globalAlpha *= clamp(o.overA, 0, 1); g.drawImage(o.over, -w / 2, -h / 2, w, h); }
    g.restore();
  }
  /* a fan of sheets around a pivot under them; list[0] is drawn last (on top) */
  function fan(g, list, cx, cy, sc, spread, o) {
    o = o || {}; var n = list.length, piv = cy + SHT * sc * .5 + 60;
    for (var i = n - 1; i >= 0; i--) {
      var j = n > 1 ? (i - (n - 1) / 2) / ((n - 1) / 2) : 0, ang = (o.order ? j : -j) * .2 * spread;
      g.save(); g.translate(cx, piv); g.rotate(ang); g.translate(-cx, -piv);
      sheet(g, list[i], cx + (o.dx ? o.dx(i) : 0), cy + (o.dy ? o.dy(i) : 0), sc, o.rot ? o.rot(i) : 0, o.opt ? o.opt(i) : null);
      g.restore();
    }
  }

  /* =====================================================================================================
     SCENE 1 · hook + ask: the clean print in front, eight dark frames fanning out behind it; 1 TAP · 9 PHOTOS with the
     numbers in coral, fully printed from frame 0 (4 words). The fan opens by 0.3 s. Sources under the fan at 1.6 s, never
     on it. On "So why" the hook type lifts off and the search phrase becomes the headline; the fan settles lower.
     ===================================================================================================== */
  var ASK = start('ask');
  function fanScene(g, t, idle) {
    var tt = idle ? 0 : t;
    /* frame 0 is already a wide hand of nine prints (about 50°): nine corners to count with the sound off */
    var spread = lerp(.88, 1, eout(seg(tt, .05, .7))) + (idle ? 0 : Math.sin(tt * 1.7) * .03 * seg(tt, .7, 1.4));
    var gk = idle ? 0 : eio(seg(tt, ASK - .25, ASK + .3)), sc = lerp(.595, .55, gk), cy = lerp(990, 1015, gk);
    var piv = cy + SHT * sc * .5 + 222, ord = [0, 8, 1, 7, 2, 6, 3, 5, 4];
    for (var q = 0; q < 9; q++) {
      var k = ord[q], ang = (k - 4) * .11 * spread, img = k === 4 ? IM.M[8] : IM.D[k < 4 ? k + 1 : k];
      g.save(); g.translate(CX, piv); g.rotate(ang); g.translate(-CX, -piv);
      sheet(g, img, CX, cy, sc, 0); g.restore();
    }
    /* the sources: under the fan */
    var sa = idle ? 0 : fin(t, .82) * (1 - seg(t, S('before').t0 - SWIPE - .1, S('before').t0 - SWIPE));
    chip(g, 'PIXEL, 2018: 9 OR 15 FRAMES', CX, 1345, { px: 42, wt: 900, bg: CREAM, fg: BG, a: cred(sa), maxw: 820 });
    txt(g, 'APPLE, 2019: 9 IMAGES', CX, 1414, 38, CREAM, 'center', 700, MONO, 820, cred(sa));
  }
  function hookText(g, t, idle) {
    /* on "So why" the hook steps down out of the caption's way and stays a beat, then goes */
    var a = idle ? 1 : 1 - seg(t, ASK + .26, ASK + .4);
    if (a <= 0) return;
    var dn = idle ? 0 : eio(seg(t, ASK - .38, ASK - .06)), up = -dn * 148, hs = lerp(1, .78, dn);
    var P = [['1', HOT], [' TAP · ', CREAM], ['9', HOT], [' PHOTOS', CREAM]], px = 124;
    g.save(); g.globalAlpha *= a; font(g, px, 900); wide(g);
    function tw() { var s = 0; P.forEach(function (p) { s += g.measureText(p[0]).width; }); return s; }
    while (tw() > 820 && px > 60) { px -= 2; font(g, px, 900); wide(g); }
    var x = CX - tw() / 2; g.textAlign = 'left'; g.textBaseline = 'middle';
    g.translate(CX, 405 - up); g.scale(hs, hs); g.translate(-CX, -405); x = CX - tw() / 2;
    P.forEach(function (p) { g.fillStyle = p[1]; g.fillText(p[0], x, 405); x += g.measureText(p[0]).width; });
    g.restore();
  }
  function headline(g, t) {
    var a = fin(t, ASK) * (1 - seg(t, S('before').t0 - SWIPE - .14, S('before').t0 - SWIPE));
    if (a <= 0) return;
    var k = clamp(spring(t - ASK, 3.2, .85), 0, 1.04);
    g.save(); g.globalAlpha *= a;
    var L = ['WHY DO PHONE PHOTOS LOOK', 'BETTER THAN REAL LIFE?'], px = 84; font(g, px, 900);
    while (g.measureText(L[0]).width > 800 && px > 52) { px -= 2; font(g, px, 900); }
    g.textAlign = 'center'; g.textBaseline = 'middle';
    L.forEach(function (l, i) { g.fillStyle = CREAM; g.fillText(l, CX, 362 + i * px * 1.08 + (1 - Math.min(1, k)) * 30); });
    g.restore();
  }

  /* =====================================================================================================
     SCENE 2 · before: the back of a card-stock phone (round lens, no screen, no logo) and the buffer: a ring of nine
     small frames. A write mark goes round; each slot it passes drops its oldest frame and takes a new one (OLDEST
     ERASED). On "tap" a paper finger presses the side button, the ring stops and the newest nine gather.
     ===================================================================================================== */
  var RG = { x: 690, y: 870, r: 160 }, PH = { x: 330, y: 870, w: 270, h: 560 };
  function ringTimes() { var s0 = S('before').t0; return { s0: s0, tap: at('before', 'tap') - .04 }; }
  function headAng(t) { var T = ringTimes(), tt = Math.min(t, T.tap); return -Math.PI / 2 + (tt - (T.s0 - .6)) * (2 * Math.PI / 1.6); }
  function slotAng(i) { return -Math.PI / 2 + .35 + i * 2 * Math.PI / 9; }
  function phone(g, t, press) {
    var x = PH.x, y = PH.y, w = PH.w, h = PH.h;
    g.fillStyle = 'rgba(0,0,0,.38)'; rr(g, x - w / 2 + 12, y - h / 2 + 16, w, h, 44); g.fill();
    g.fillStyle = BODY2; rr(g, x - w / 2, y - h / 2, w, h, 44); g.fill();
    g.strokeStyle = 'rgba(244,237,224,.14)'; g.lineWidth = 5; rr(g, x - w / 2 + 10, y - h / 2 + 10, w - 20, h - 20, 36); g.stroke();
    /* the side button the finger presses (left edge of the back = the phone's right side) */
    g.fillStyle = '#5a5366'; rr(g, x - w / 2 - 9 + press * 5, y - 150, 12, 84, 5); g.fill();
    /* the camera bump: a cut card square, one round lens, a flash dot */
    g.fillStyle = '#2a2633'; rr(g, x - w / 2 + 26, y - h / 2 + 26, 128, 128, 30); g.fill();
    g.fillStyle = '#5a5366'; el(g, x - w / 2 + 90, y - h / 2 + 90, 42, 42);
    g.fillStyle = '#0b0a0f'; el(g, x - w / 2 + 90, y - h / 2 + 90, 31, 31);
    g.fillStyle = 'rgba(244,237,224,.22)'; el(g, x - w / 2 + 80, y - h / 2 + 79, 8, 8);
    g.fillStyle = '#d8cfbd'; el(g, x - w / 2 + 135, y - h / 2 + 46, 8, 8);
  }
  function finger(g, t) {
    var T = ringTimes(), press = eio(seg(t, T.tap - .2, T.tap)), off = lerp(80, 0, press) + Math.sin(t * 5) * 6 * (1 - press);
    var tx = PH.x - PH.w / 2 - 12 - off, ty = PH.y - 108;
    g.save(); g.translate(tx, ty); g.rotate(.08);
    g.fillStyle = 'rgba(0,0,0,.3)'; rr(g, -330 + 8, -34 + 12, 340, 72, 36); g.fill();
    g.fillStyle = SKIN; rr(g, -330, -36, 340, 72, 36); g.fill();
    g.fillStyle = SKIN_D; rr(g, -110, -36, 8, 72, 4); g.fill(); rr(g, -220, -36, 8, 72, 4); g.fill();
    g.fillStyle = '#f3d9c4'; rr(g, -62, -26, 56, 46, 18); g.fill();
    g.restore();
    return press;
  }
  function ringScene(g, t) {
    var T = ringTimes(), tap = T.tap, th = headAng(t), gather = eio(seg(t, tap + .08, tap + .5));
    phone(g, t, eio(seg(t, tap - .06, tap)) * (1 - seg(t, tap + .15, tap + .3)));
    /* the feed: a pencil dashed line from the lens to the slot being written */
    var lx = PH.x - PH.w / 2 + 90, ly = PH.y - PH.h / 2 + 90, hx = RG.x + Math.cos(th) * RG.r, hy = RG.y + Math.sin(th) * RG.r;
    if (gather < 1) {
      g.save(); g.globalAlpha *= 1 - gather; g.strokeStyle = 'rgba(244,237,224,.55)'; g.lineWidth = 4; g.setLineDash([14, 12]); g.lineDashOffset = -t * 60;
      g.beginPath(); g.moveTo(lx + 40, ly); g.quadraticCurveTo((lx + hx) / 2, Math.min(ly, hy) - 140, hx, hy); g.stroke(); g.restore();
      /* the ring itself: a pencil circle */
      g.save(); g.globalAlpha *= 1 - gather; g.strokeStyle = 'rgba(244,237,224,.22)'; g.lineWidth = 3; g.beginPath(); g.arc(RG.x, RG.y, RG.r, 0, 6.283); g.stroke(); g.restore();
    }
    var msc = .158;
    for (var i = 0; i < 9; i++) {
      var a = slotAng(i), d = th - a, passes = d >= 0 ? Math.floor(d / (2 * Math.PI)) + 1 : 0;
      var lastPass = a + (passes - 1) * 2 * Math.PI, tp = passes > 0 ? (T.s0 - .6) + (lastPass + Math.PI / 2) / (2 * Math.PI / 1.6) : -9;
      var sx = RG.x + Math.cos(a) * RG.r, sy = RG.y + Math.sin(a) * RG.r;
      var gx = lerp(sx, RG.x + (i - 4) * 9, gather), gy = lerp(sy, RG.y + (i - 4) * 6, gather), gs = lerp(msc, .3, gather);
      var img = IM.D[(i * 4 + passes * 7) % 9], prev = IM.D[(i * 4 + (passes - 1) * 7 + 63) % 9];
      /* the old frame drops out of its slot and shrinks away */
      var dk = seg(t, tp, tp + .45);
      if (passes > 0 && dk < 1 && gather === 0) sheet(g, prev, sx + Math.cos(a) * 30 * eout(dk), sy + Math.sin(a) * 30 * eout(dk), msc * (1 - dk), dk * .9, { b: 5 });
      var pk = passes > 0 ? clamp(pop(t, tp + .05, 3.4), 0, 1) : 1;
      sheet(g, img, gx, gy, gs * pk, (1 - gather) * Math.sin(i * 2.1) * .06, { b: lerp(5, 9, gather) });
    }
    /* the write mark: a cream notch outside the ring */
    if (gather < 1) { g.save(); g.globalAlpha *= 1 - gather; g.translate(RG.x + Math.cos(th) * (RG.r + 62), RG.y + Math.sin(th) * (RG.r + 62)); g.rotate(th + Math.PI / 2); g.fillStyle = CREAM; g.beginPath(); g.moveTo(0, 22); g.lineTo(-16, -6); g.lineTo(16, -6); g.closePath(); g.fill(); g.restore(); }
    finger(g, t);
    /* leaves as the ring stops and folds into the nine */
    txt(g, 'OLDEST OUT', RG.x, 1176, 48, CREAM, 'center', 900, DISP, 400, fin(t, T.s0 - .1) * (1 - seg(t, tap + .38, tap + .52)));
    tag(g, 'GOOGLE, 2018', CX, 1330, cred(fin(t, T.s0 - .08)), .01);
  }

  /* =====================================================================================================
     SCENE 3 · dark → sky → grain → stack (the hero) → why. One pile of nine frames on the table the whole time.
     ===================================================================================================== */
  function stkTimes() {
    return {
      d0: S('dark').t0, dark: at('dark', 'dark'), pur: at('dark', 'purpose'),
      s0: start('sky'), keeps: at('sky', 'keeps'), sky: at('sky', 'sky'), white: at('sky', 'white'),
      g0: start('grain'), gdark: at('grain', 'dark'), grainy: at('grain', 'grainy'),
      k0: start('stack'), stacks: at('stack', 'stacks'), grain: at('stack', 'grain'), out: wend('stack', 'out'),
      cancels: at('stack', 'cancels'), w0: start('why'), changes: at('why', 'changes'), every: at('why', 'every'), scene: at('why', 'scene'), doesnt: at('why', 'doesnt')
    };
  }
  var JIT = (function () { var r = mulberry(5), o = []; for (var i = 0; i < 9; i++) o.push([(r() - .5) * 26, (r() - .5) * 22, (r() - .5) * .05]); return o; })();
  function avgN(t, T) { var q = qt(t); return 1 + Math.floor(8 * seg(q, T.grain, T.out - .1) + 1e-6); }
  function stkScene(g, t) {
    var T = stkTimes();
    /* the pile's place: centre → right tile (sky) → centre (grain) → the hero print (stack) → small, low (why) */
    var toR = eio(seg(t, T.s0 - .2, T.s0 + .3)), back = eio(seg(t, T.g0 + .5, T.g0 + .95)), low = t >= S('why').t0 - 1e-6 ? 1 : 0;
    var hero = eio(seg(t, T.stacks + .25, T.stacks + .6));
    var px = lerp(lerp(CX, 722, toR), CX, back), py = lerp(lerp(850, 830, toR), 850, back), ps = lerp(lerp(.86, .66, toR), .86, back);
    py = lerp(py, 950, hero); ps = lerp(ps, 1.26, hero);
    px = lerp(px, CX, low); py = lerp(py, 1215, low); ps = lerp(ps, .36, low);
    /* spread: the dark fan opens wider on "dark", folds for the tiles; on "So it" the frames fan out sideways, and on
       "stacks" they snap into register */
    var dfan = (.55 + .45 * eio(seg(t, T.dark - .08, T.dark + .3))) * (1 - toR);
    var side = eio(seg(t, T.k0 - .5, T.k0 - .05)) * (1 - eio(seg(t, T.stacks - .04, T.stacks + .3)));
    var bright = eio(seg(t, T.g0 + .1, T.grainy + .2)), useS = t >= T.k0 - .5;
    var list = [];
    for (var i = 0; i < 9; i++) list.push(useS ? IM.S[i] : IM.D[i]);
    /* the divider: on "cancels out" it sweeps across the print face; left of it, the same pixels averaged over all
       nine frames (IM.M[8]); right of it, one frame brightened (IM.S[0]). For "why" it finishes the sweep. */
    var dv = .5 * eio(seg(t, T.cancels - .05, T.out - .05)) + .5 * low;
    g.save(); var sw = Math.sin(t * 1.15) * .01 * (1 - hero * (1 - low)); g.translate(px, py); g.rotate(sw); g.translate(-px, -py);
    fan(g, list, px, py, ps, dfan, {
      dx: function (i) { return (i - 4) * 46 * side + JIT[i][0] * side; },
      dy: function (i) { return JIT[i][1] * side; },
      rot: function (i) { return (i - 4) * .03 * side + JIT[i][2] * side; },
      opt: function (i) { return i === 0 && !useS ? { over: IM.S[0], overA: bright } : null; }
    });
    if (dv > 0) {
      var hw = SW * ps, hh = SHT * ps, x0 = px - hw / 2, y0 = py - hh / 2, xd = x0 + hw * dv;
      g.save(); g.beginPath(); g.rect(x0, y0, xd - x0, hh); g.clip(); g.drawImage(IM.M[8], x0, y0, hw, hh); g.restore();
      var la = 1 - seg(dv, .85, 1);
      if (la > 0) { g.save(); g.globalAlpha *= la; g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(xd + 3, y0, 6, hh); g.fillStyle = CREAM; g.fillRect(xd - 4, y0 - 10, 8, hh + 20); g.restore(); }
    }
    g.restore();
    /* dark: Google's words on the dark frames */
    var qa = cred(fin(t, T.d0 + .12)) * (1 - seg(t, T.s0 + .3, T.s0 + .42));
    quote(g, ['“…deliberately underexposed…”'], 1262, qa, 52);
    tag(g, 'MOST FRAMES', CX, 1336, qa, -.02);
    txt(g, 'GOOGLE HDR+, 2021', CX, 1404, 40, CREAM, 'center', 600, MONO, 820, qa);
    /* sky: the same scene exposed for the face slides in on the left; the sky goes to blank paper */
    var lin = eio(seg(t, T.s0 - .15, T.s0 + .35)), lout = eio(seg(t, T.g0 + .45, T.g0 + .8));
    /* its sky is still sunset orange, and goes white on "turning white" */
    var bl = eio(seg(t, at('sky', 'turning'), wend('sky', 'white')));
    if (lin > 0 && lout < 1) sheet(g, IM.F, lerp(-320, 298, lin) - 700 * lout, 830, .66, -.01, { over: IM.Fsky, overA: 1 - bl });
    var ra = fin(t, T.s0 + .3) * (1 - seg(t, T.g0 + .42, T.g0 + .55));
    txt(g, 'SHOT DARK', 722, 1112, 40, CREAM, 'center', 700, DISP, 380, ra);
    txt(g, 'SKY KEPT', 722, 1172, 58, CREAM, 'center', 900, DISP, 380, ra);
    txt(g, 'FACE EXPOSED', 298, 1112, 40, CREAM, 'center', 700, DISP, 380, ra);
    txt(g, 'SKY GOES WHITE', 298, 1172, 58, CREAM, 'center', 900, DISP, 380, ra);
    tag(g, 'OUR ILLUSTRATION', CX, 560, fin(t, T.s0 - .05) * (1 - seg(t, T.g0 + .42, T.g0 + .55)), .01);
    /* a pencil tick on the kept sky */
    var tk = eio(seg(t, T.sky - .05, T.sky + .25)) * (1 - seg(t, T.g0 + .42, T.g0 + .55));
    if (tk > 0) { g.save(); g.globalAlpha *= tk; g.strokeStyle = CREAM; g.lineWidth = 9; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); g.moveTo(812, 680); g.lineTo(842, 715); g.lineTo(842 + 50 * seg(tk, .3, 1), 715 - 70 * seg(tk, .3, 1)); g.stroke(); g.restore(); }
    /* grain: the dark frame brightened; a paper loupe over the face. The same loupe comes back on the averaged face */
    var lp = fin(t, T.grainy - .05) * (1 - seg(t, T.k0 - .55, T.k0 - .35));
    if (lp > 0) loupe(g, IM.S[0], px, py, ps, lp);
    /* stack: the halves named on the print; 9 AVERAGED rides down beside the small pile for "why" */
    var ph = SHT * 1.26, cyb = 950 + ph / 2 - 56;
    var oa = fin(t, T.stacks + .35) * (1 - low), dvh = eio(seg(t, T.cancels - .2, T.cancels + .12));
    chip(g, 'BEFORE: 1 FRAME', lerp(CX, CX + SW * 1.26 / 4, dvh), cyb, { px: 40, wt: 900, bg: CREAM, fg: BG, a: oa, maxw: 336 });
    chip(g, '9 AVERAGED', lerp(CX - SW * 1.26 / 4, 250, low), lerp(cyb, 1225, low), { px: 40, wt: 900, bg: CREAM, fg: BG, a: fin(t, T.cancels + .14) });
    /* the stamp stays with the averaged pile: it rides down beside it for "why" */
    var sx0 = lerp(CX, 790, low), sy0 = lerp(1205, 1225, low), sk = kn(t, GT.slam + .02) * lerp(1, .84, low);
    g.save(); g.translate(sx0, sy0); g.scale(sk, sk); g.translate(-sx0, -sy0);
    stamp(g, '9 → 1', sx0, sy0, t, GT.slam, DUR, 76, HOT, -.05); g.restore();
    txt(g, '9 HERE · PIXEL USES 2–15 (2021)', CX, 1430, 40, CREAM, 'center', 900, DISP, 820, fin(t, T.stacks + .3));
    /* why: three frames, the same patch of face: the grain sits in different places, the face doesn't move */
    var cx3 = [228, 510, 792], cs = 248, cy3 = 668;
    for (var j = 0; j < 3; j++) {
      var ck = clamp(pop(t, T.w0 + .05 + j * .08, 3.2), 0, 1);
      if (ck > 0) crop(g, IM.S[j], cx3[j], cy3 + Math.sin(t * 1.3 + j * 2) * 4, cs * ck, j);
    }
    var ga = fin(t, T.changes - .05), ruler = eio(seg(t, T.scene - .05, T.scene + .3));
    if (ga > 0) {
      var spots = [[-50, 60], [62, -40], [8, 78]];
      g.save(); g.globalAlpha *= ga; g.strokeStyle = CREAM; g.lineWidth = 5;
      for (j = 0; j < 3; j++) { g.beginPath(); g.ellipse(cx3[j] + spots[j][0], cy3 + spots[j][1], 30, 26, .3, 0, 6.283 * eio(seg(t, T.changes - .05 + j * .07, T.changes + .25 + j * .07))); g.stroke(); }
      g.restore();
    }
    if (ruler > 0) { g.save(); g.strokeStyle = CREAM; g.lineWidth = 5; g.setLineDash([22, 10]); var ey = cy3 + EYE_DY * cs / 100; g.beginPath(); g.moveTo(102, ey); g.lineTo(102 + 816 * ruler, ey); g.stroke(); g.restore(); }
    var wa = fin(t, T.w0 - .02);
    txt(g, 'GRAIN: MOVES', CX, 878, 64, CREAM, 'center', 900, DISP, 820, wa);
    txt(g, 'SCENE: STAYS', CX, 962, 64, CREAM, 'center', 900, DISP, 820, wa);
    txt(g, 'AFTER ALIGNING', CX, 1030, 42, CREAM, 'center', 700, DISP, 820, wa);
  }
  /* the face patch: 100 × 100 sheet px around the face, magnified; EYE_DY = the eyes' height in the crop (of 100) */
  var CROP = 150, EYE_DY = 0;
  function crop(g, img, x, y, s, j) {
    var fx = SW * FACE.u, fy = SHT * (FACE.v + .005);
    EYE_DY = ((SHT * (FACE.v + .012)) - fy) / CROP * 100;
    g.save(); g.translate(x, y); g.rotate((j - 1) * .02);
    g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(-s / 2 - 8 + 10, -s / 2 - 8 + 14, s + 16, s + 16);
    g.fillStyle = PAPER; g.fillRect(-s / 2 - 8, -s / 2 - 8, s + 16, s + 16);
    g.drawImage(img, fx - CROP / 2, fy - CROP / 2, CROP, CROP, -s / 2, -s / 2, s, s);
    g.restore();
  }
  function loupe(g, img, px, py, ps, a) {
    var fx = px + (FACE.u - .5) * SW * ps, fy = py + (FACE.v - .5) * SHT * ps, R = 132 * a, src = 96;
    if (R < 4) return;
    g.save();
    g.strokeStyle = '#2a2633'; g.lineWidth = 30; g.lineCap = 'round'; g.beginPath(); g.moveTo(fx + R * .7, fy + R * .7); g.lineTo(fx + R * 1.45, fy + R * 1.45); g.stroke();
    g.fillStyle = 'rgba(0,0,0,.35)'; el(g, fx + 10, fy + 14, R + 14, R + 14);
    g.fillStyle = PAPER; el(g, fx, fy, R + 14, R + 14);
    g.beginPath(); g.ellipse(fx, fy, R, R, 0, 0, 6.283); g.clip();
    g.imageSmoothingEnabled = false;
    g.drawImage(img, SW * FACE.u - src / 2, SHT * FACE.v - src / 2, src, src, fx - R, fy - R, 2 * R, 2 * R);
    g.imageSmoothingEnabled = true;
    g.restore();
  }

  /* =====================================================================================================
     SCENE 4 · night + reality: the screenshot frame. Left: 1 FRAME, the night scene as one frame catches it. Right: the
     frames land one by one on a stack; it shows the mean of the frames so far, brightened; 15 on "fifteen". Google's
     own words under the pair.
     ===================================================================================================== */
  function nightTimes() { return { q: at('night', '15') + .2, q2: start('reality') - .1, n0: S('night').t0 + .35, n15: at('night', '15') - .02, real: start('reality'), br: at('reality', 'brighter') }; }
  function nightN(t, T) { var q = qt(t); return 1 + Math.floor(14 * seg(q, T.n0, T.n15) + 1e-6); }
  function nightScene(g, t) {
    /* two prints, 408 px wide each with their borders, across x 91–929 with a 20 px gap */
    var T = nightTimes(), n = nightN(t, T), ly = 869, ns = 1.04, L = 295, R = 725, bd = 16 * ns;
    var dr = Math.sin(t * 1.1) * .006, dy = Math.sin(t * .9) * 4;
    tag(g, 'OUR ILLUSTRATION · SAME SCENE', CX, 560, cred(fin(t, S('night').t0 + .5)), .01);
    /* a slow push-in on the pair while the quote is read: 1.00 → 1.06 (the prints only, not the type) */
    var pk = lerp(1, 1.06, eio(seg(t, T.n15, start('blend')))); g.save(); g.translate(CX, ly); g.scale(pk, pk); g.translate(-CX, -ly);
    sheet(g, IM.ND, L, ly + dy, ns, -.012 + dr);
    /* the right stack: edges of the frames already landed, the newest sliding in */
    for (var i = 0; i < Math.min(n, 15) - 1; i++) { var e = Math.min(i, 6); g.fillStyle = i % 2 ? '#d8cfbd' : PAPER; g.fillRect(R - NW * ns / 2 - bd - e, ly - NH * ns / 2 - bd - e * 3, NW * ns + 2 * bd, NH * ns + 2 * bd); }
    var lastT = T.n0 + (n - 1) / 14 * (T.n15 - T.n0), slide = n > 1 ? eout(seg(t, lastT - .12, lastT + .02)) : 1;
    var bk = seg(t, T.br - .05, T.br + .3);
    sheet(g, IM.NM[n - 1], lerp(1150, R, slide), ly + lerp(-30, 0, slide) - dy, ns, .01 - dr, { over: IM.NMb, overA: n === 15 ? bk : 0 });
    g.restore();
    txt(g, '1 FRAME', L, 1160, 56, CREAM, 'center', 900, DISP, 380, fin(t, S('night').t0 + .3));
    txt(g, n + ' STACKED', R, 1160, 56, CREAM, 'center', 900, DISP, 380, fin(t, S('night').t0 + .3));
    txt(g, 'NIGHT SIGHT · UP TO 15 (HANDHELD) · 2018', CX, 1230, 40, CREAM, 'center', 900, DISP, 820, fin(t, T.n15 - .1));
    /* the credit is up from "15"; the quote comes in on "In Google's own words" and pops on "brighter" */
    var qa = cred(fin(t, T.q)), qq = cred(fin(t, T.q2)), qk = 1 + Math.max(0, knock(t, T.br - .04, 14, 5)) * .12;
    g.save(); g.translate(CX, 1330); g.scale(qk, qk); g.translate(-CX, -1330);
    quote(g, ['“…brighter than reality.”'], 1330, qq, 60); g.restore();
    txt(g, 'GOOGLE, NIGHT SIGHT, NOV 2018', CX, 1418, 40, CREAM, 'center', 600, MONO, 820, qa);
  }

  /* =====================================================================================================
     SCENE 5 · blend: the frame-0 print alone. On "isn't" it flips edge-on and opens as the nine frames it was made of.
     SCENE 6 · end: an empty print frame (the picture doesn't answer), YES / NO.
     ===================================================================================================== */
  function blendScene(g, t) {
    var fl = seg(t, at('blend', 'photo') - .02, at('blend', 'photo') + .4), sx = Math.abs(Math.cos(Math.PI * fl));
    var open = eio(seg(t, at('blend', 'photo') + .2, at('blend', 'isnt') + .45));
    var drift = Math.sin(t * 1.2) * .01;
    if (fl < .5) sheet(g, IM.M[8], CX, 850, .86, drift, { sx: sx });
    else fan(g, IM.S, CX, 850, .86, open * (1.05 + Math.sin(t * 1.6) * .06), { opt: function () { return { sx: sx }; } });
    txt(g, 'NOT ONE MOMENT', CX, 1262, 64, CREAM, 'center', 900, DISP, 820, fin(t, at('blend', 'photo') - .05));
    chip(g, '9 FRAMES', CX, 1366, { px: 60, wt: 900, bg: CREAM, fg: BG, a: fin(t, at('blend', 'photo') + .3), s: kn(t, at('blend', 'blend') - .08), maxw: 740 });
  }
  function emptyScene(g, t) {
    var s0 = S('end').t0, ys = at('end', 'yes'), no = at('end', 'no');
    var k = clamp(sp(t, s0 - .1, 2.4, .8), 0, 1.03);
    /* the frame-0 print again, 640 px wide: the film asks "real?" and the picture doesn't answer */
    sheet(g, IM.M[8], CX, 892, 1.06 * lerp(.94, 1, Math.min(1, k)), Math.sin(t * 1.1) * .015);
    var ghost = fin(t, s0 + .35);
    /* each pill fills and nudges to 1.06× on its word */
    var ny = function (w) { return 1 + .06 * Math.sin(Math.PI * seg(t, w - .06, w + .3)); }, PY = 1352;
    chip(g, 'YES', 330, PY, { px: 72, wt: 900, line: CREAM, lw: 4, fg: CREAM, a: ghost * (1 - fin(t, ys - .08)) * .7, w: 260, r: 50 });
    chip(g, 'NO', 690, PY, { px: 72, wt: 900, line: CREAM, lw: 4, fg: CREAM, a: ghost * (1 - fin(t, no - .08)) * .7, w: 260, r: 50 });
    chip(g, 'YES', 330, PY, { px: 72, wt: 900, bg: CREAM, fg: BG, a: fin(t, ys - .08), s: ny(ys), w: 260, r: 50 });
    chip(g, 'NO', 690, PY, { px: 72, wt: 900, bg: CREAM, fg: BG, a: fin(t, no - .08), s: ny(no), w: 260, r: 50 });
  }

  /* ---------- captions: the narrator's words, one block at a time; only stressed words get the coral pill ---------- */
  var CAPBRK = {};
  var CAPS = (function () {
    var out = [];
    VO.lines.forEach(function (l) {
      if (l.id === 'hook') return;   /* frame 0 is the fan (4 words); the ask line's caption is the search phrase */
      var brk = (CAPBRK[l.id] || []).slice(), cur = [], ws = l.words;
      ws.forEach(function (w, i) {
        if (cur.length && brk.length && norm(w.w) === brk[0]) { out.push(cur); cur = []; brk.shift(); }
        cur.push(w);
        if (/[.?!:]$/.test(w.w) && i < ws.length - 1) { out.push(cur); cur = []; }
      });
      if (cur.length) out.push(cur);
    });
    return out.map(function (ws) { return { t0: ws[0].t0, t1: ws[ws.length - 1].t1, words: ws }; });
  })();
  var STRESS = [['ask', 'better'], ['ask', 'real'], ['before', 'before'], ['before', 'tap'], ['dark', 'dark'], ['dark', 'purpose'], ['sky', 'sky'], ['sky', 'white'], ['grain', 'grainy'],
    ['stack', 'stacks'], ['stack', 'cancels'], ['why', 'changes'], ['why', 'doesnt'], ['night', 'night'], ['night', '15'], ['reality', 'brighter'],
    ['reality', 'reality'], ['blend', 'moment'], ['blend', 'blend'], ['end', 'yes'], ['end', 'no']]
    .map(function (p) { return at(p[0], p[1], p[2]); });
  function stressed(w) { for (var i = 0; i < STRESS.length; i++) if (Math.abs(STRESS[i] - w.t0) < .02) return true; return false; }
  function wipeHide(t) {
    var a = 1; SC.forEach(function (sc) { if (sc.swipe) a = Math.min(a, 1 - seg(t, sc.t0 - SWIPE, sc.t0 - SWIPE + .1) * (1 - seg(t, sc.t0 + .02, sc.t0 + .14))); });
    return a;
  }
  var GLUE = { the: 1, a: 1, an: 1, your: 1, its: 1, of: 1, at: 1, to: 1, and: 1, in: 1, with: 1, on: 1, by: 1, so: 1, over: 1, that: 1, up: 1, own: 1 };
  function captions(g, t, alpha) {
    var card0 = null, ci = -1;
    CAPS.forEach(function (c, i) { if (t >= c.t0 - .04) { card0 = c; ci = i; } });
    if (!card0) return;
    var nx = CAPS[ci + 1], ns = nx ? nx.t0 - .04 : 1e9, o1 = Math.min(card0.t1 + .5, ns - .12), o0 = Math.min(card0.t1 + .35, o1 - .12);
    var fi = seg(t, card0.t0 - .04, card0.t0 + .06), out = 1 - seg(t, o0, o1);
    if (fi * out <= 0) return;
    var k = clamp(spring(t - card0.t0 + .04, 3.2, .8), 0, 1.04);
    g.save(); g.font = '800 74px Archivo'; wide(g);
    g.textBaseline = 'alphabetic';
    var words = card0.words, ws = words.map(function (w) { return g.measureText(w.w).width; }), gap = 22;
    var lines, lw, maxw = 780, cpx = 74;
    function lay() { lines = [[]]; lw = [0]; words.forEach(function (w, i) { var L = lines.length - 1; if (lw[L] + ws[i] > maxw && lines[L].length) { lines.push([]); lw.push(0); L++; } lines[L].push(i); lw[L] += ws[i] + gap; }); }
    function fixLines() {
      for (var L = 0; L < lines.length - 1; L++) {
        var last = lines[L][lines[L].length - 1];
        while (lines[L].length > 1 && GLUE[norm(words[last].w)]) { lines[L].pop(); lines[L + 1].unshift(last); last = lines[L][lines[L].length - 1]; }
      }
      var n = lines.length; if (n > 1 && lines[n - 1].length === 1 && lines[n - 2].length > 2) lines[n - 1].unshift(lines[n - 2].pop());
      lw = lines.map(function (ln) { var w = 0; ln.forEach(function (i) { w += ws[i] + gap; }); return w; });
    }
    lay(); fixLines();
    function widest() { return Math.max.apply(null, lw) - gap; }
    while ((lines.length > 2 || widest() > maxw) && cpx > 52) { cpx -= 4; g.font = '800 ' + cpx + 'px Archivo'; wide(g); ws = words.map(function (w) { return g.measureText(w.w).width; }); gap = cpx * .28; lay(); fixLines(); }
    var lh = cpx * 1.18, y0 = (lines.length > 1 ? 362 : 402) + 50 - (lines.length - 1) * lh / 2;   /* pill tops at y ≥ 304 */
    g.globalAlpha = fi * out * wipeHide(t) * (alpha == null ? 1 : alpha);
    lines.forEach(function (ln, li) {
      var x = CX - (lw[li] - gap) / 2, y = y0 + li * lh + (1 - Math.min(1, k)) * 30;
      ln.forEach(function (i) {
        var w = words[i], nw = words[i + 1], cur = stressed(w) && t >= w.t0 - .03 && t < Math.min(w.t1 + .05, nw ? nw.t0 - .03 : 1e9) + .15;
        if (cur) { g.fillStyle = HOT; g.beginPath(); g.roundRect(x - 12, y - cpx * .87, ws[i] + 24, cpx * 1.15, 18); g.fill(); }
        g.fillStyle = cur ? BG : CREAM;
        g.fillText(w.w, x, y); x += ws[i] + gap;
      });
    });
    g.restore();
  }

  /* ---------- the picture ---------- */
  var NOISE, SCENES = { fan: fanScene, ring: ringScene, stk: stkScene, night: nightScene, blend: blendScene, empty: emptyScene };
  function stage(g) {
    g.fillStyle = BG; g.fillRect(0, 0, W, H);
    var vg = g.createRadialGradient(540, 1000, 200, 540, 1000, 1300); vg.addColorStop(0, 'rgba(48,52,72,.30)'); vg.addColorStop(1, 'rgba(0,0,0,.35)');
    g.fillStyle = vg; g.fillRect(0, 0, W, H);
  }
  function sceneAt(t) { for (var i = SC.length - 1; i >= 0; i--) if (t >= SC[i].t0) return i; return 0; }
  function drawScene(g, Sc, t) {
    g.save();
    if (Sc.fn === 'empty') { var push = 1 + .012 * seg(t, Sc.t0, Sc.t1); g.translate(CX, 1000); g.scale(push, push); g.translate(-CX, -1000); }
    SCENES[Sc.fn](g, t);
    g.restore();
  }
  /* the cut: a torn-paper edge rising from the bottom along one axis, the next scene drawn under it */
  function edgeY(x, ly, t) { var i = Math.round(x / 30); return ly + (i % 2 ? -10 : 8) + Math.sin(x * .013 + t * 5) * 4; }
  function frame(g, t) {
    g.setTransform(1, 0, 0, 1, 0, 0);
    stage(g);
    var si = sceneAt(t), Sc = SC[si], Nx = SC[si + 1];
    var sk = Nx && Nx.swipe ? eio(seg(t, Nx.t0 - SWIPE, Nx.t0)) : 0;
    var pre = Sc.swipe && t < Sc.t0 + PRE;
    drawScene(g, Sc, pre ? Sc.t0 + PRE : t);
    if (sk > 0) {
      var ly = H * (1 - sk) - 20, x;
      g.save(); g.beginPath(); g.moveTo(0, H); for (x = 0; x <= W; x += 30) g.lineTo(x, edgeY(x, ly, t)); g.lineTo(W, H); g.closePath(); g.clip();
      stage(g); INCOMING = true; drawScene(g, Nx, Nx.t0 + PRE); INCOMING = false; g.restore();
      g.save(); g.strokeStyle = HOT; g.lineWidth = 8; g.lineJoin = 'round'; g.beginPath(); for (x = 0; x <= W; x += 30) { var yy = edgeY(x, ly, t); if (x === 0) g.moveTo(x, yy); else g.lineTo(x, yy); } g.stroke(); g.restore();
    }
    /* the loop: the torn edge rises on the swish and cuts back to the frame-0 picture (no dissolve) */
    var back = eio(seg(t, GT.home, GT.home + .26));
    if (back > 0) {
      var by = H * (1 - back) - 20, bx;
      g.save(); g.beginPath(); g.moveTo(0, H); for (bx = 0; bx <= W; bx += 30) g.lineTo(bx, edgeY(bx, by, t)); g.lineTo(W, H); g.closePath(); g.clip();
      stage(g); INCOMING = true; fanScene(g, 0, true); hookText(g, 0, true); INCOMING = false; g.restore();
      if (back < 1) { g.save(); g.strokeStyle = HOT; g.lineWidth = 8; g.lineJoin = 'round'; g.beginPath(); for (bx = 0; bx <= W; bx += 30) { var yb = edgeY(bx, by, t); if (bx === 0) g.moveTo(bx, yb); else g.lineTo(bx, yb); } g.stroke(); g.restore(); }
    }
    if (POSTERMODE) posterTitle(g);
    else if (LIVE.text) {
      if (t < S('before').t0) hookText(g, t, false);
      captions(g, t, back > 0 ? 1 - back : 1);
    }
    if (!POSTERMODE) {
      g.fillStyle = 'rgba(244,237,224,.12)'; g.fillRect(90, 222, 840, 6);
      g.fillStyle = HOT; g.fillRect(90, 222, 840 * (back > 0 ? 1 - back : t / DUR), 6);
    }
    if (LIVE.grain && NOISE) { g.globalAlpha = .05; g.globalCompositeOperation = 'overlay'; var o = Math.floor(t * 24) * 37 % 256; g.fillStyle = g.createPattern(NOISE, 'repeat'); g.translate(-o, -o); g.fillRect(o, o, W, H); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }
  }
  var POSTERMODE = false;
  function posterTitle(g) {
    /* both lines fit inside x 90–930: the pill (text + 2 × 14 px) is at most 840 wide */
    var a = 'Why phone photos look', b = 'better than real life', px = 76;
    g.save(); font(g, px, 800); g.textBaseline = 'alphabetic';
    while ((g.measureText(b).width + 28 > 840 || g.measureText(a).width > 840) && px > 52) { px -= 2; font(g, px, 800); }
    g.textAlign = 'center'; g.fillStyle = CREAM; g.fillText(a, CX, 330);
    var wb = g.measureText(b).width, x = CX - wb / 2;
    g.fillStyle = HOT; g.beginPath(); g.roundRect(x - 14, 420 - 72, wb + 28, 96, 16); g.fill();
    g.textAlign = 'left'; g.fillStyle = BG; g.fillText(b, x, 420); g.restore();
  }
  /* a text at height y stays readable until the torn edge rising from the bottom reaches it */
  function cutY(id, y) {
    var sc = S(id), need = 1 - (y + 60) / H, u = 0;
    while (u < 1 && eio(u) < need) u += .01;
    return sc.t0 - SWIPE + SWIPE * u;
  }
  function TEXTS(t) {
    var out = [];
    function T(id, text, a, b) { if (t >= a && t < b) out.push({ id: id, text: text, x0: 0, y0: 0, x1: 0, y1: 0 }); }
    T('hook', '1 TAP · 9 PHOTOS', 0, ASK + .26);
    T('g18', 'PIXEL, 2018: 9 OR 15 FRAMES', .9, S('before').t0 - SWIPE - .05);
    T('ap19', 'APPLE, 2019: 9 IMAGES', .9, S('before').t0 - SWIPE - .05);
        var R = ringTimes();
    T('old', 'OLDEST OUT', S('before').t0 - SWIPE + .22, R.tap + .4);
    T('c1', 'GOOGLE, 2018', S('before').t0 + .02, S('dark').t0 - .02);
    var K = stkTimes();
    T('q2', '“…deliberately underexposed…”', K.d0 + .22, K.s0 + .3);
    T('most', 'MOST FRAMES', K.d0 + .22, K.s0 + .3);
    T('c2', 'GOOGLE HDR+, 2021', K.d0 + .22, K.s0 + .3);
    T('kept1', 'SHOT DARK', K.s0 + .42, K.g0 + .42);
    T('kept2', 'SKY KEPT', K.s0 + .42, K.g0 + .42);
    T('wh1', 'FACE EXPOSED', K.s0 + .42, K.g0 + .42);
    T('wh2', 'SKY GOES WHITE', K.s0 + .42, K.g0 + .42);
    T('ill', 'OUR ILLUSTRATION', K.s0 + .05, K.g0 + .42);
    T('one1', 'BEFORE: 1 FRAME', K.stacks + .45, cutY('why', 1335));
    T('avg9', '9 AVERAGED', K.cancels + .24, cutY('night', 1225));
    T('cond', '9 HERE · PIXEL USES 2–15 (2021)', K.stacks + .4, cutY('night', 1430));
    T('stamp', '9 → 1', GT.slam + .15, cutY('night', 1225));
    T('moves', 'GRAIN: MOVES', K.w0, cutY('night', 878));
    T('stays', 'SCENE: STAYS', K.w0, cutY('night', 962));
    T('align', 'AFTER ALIGNING', K.w0, cutY('night', 1030));
    var N = nightTimes();
    T('one', '1 FRAME', S('night').t0 + .45, S('blend').t0 - .02);
    T('stk', 'N STACKED', S('night').t0 + .45, S('blend').t0 - .02);
    T('ns', 'NIGHT SIGHT · UP TO 15 (HANDHELD) · 2018', N.n15 + .02, S('blend').t0 - .02);
    T('q3', '“…brighter than reality.”', N.q2 + .07, S('blend').t0 - .02);
    T('c3', 'GOOGLE, NIGHT SIGHT, NOV 2018', N.q + .1, S('blend').t0 - .02);
    T('ill2', 'OUR ILLUSTRATION · SAME SCENE', S('night').t0 + .65, S('blend').t0 - .02);
    T('mom', 'NOT ONE MOMENT', at('blend', 'photo') + .05, S('end').t0 - .02);
    T('nine', '9 FRAMES', at('blend', 'photo') + .4, S('end').t0 - .02);
    T('yes', 'YES', S('end').t0 + .45, GT.home);
    T('no', 'NO', S('end').t0 + .45, GT.home + .1);
    return out;
  }

  /* ---------- events: the sound design reads the same word times; hits sit between words, never on them ---------- */
  var EV = [];
  /* the SFX gate (vo/heard.js, written from the finished mix): a hit's whole body keeps 0.19 s clear of every word start
     and end that unhinted faster-whisper base.en and small.en heard in the mix (the gate is 0.15), and clear of every
     stretch where the voice-only track is at or above −40 dBFS. Without heard.js the vo.js word times stand in. */
  var EDGES = window.HEARD_EDGES || [], VOICED = window.VOICED || [];
  if (!EDGES.length) VO.lines.forEach(function (l) { l.words.forEach(function (w) { VOICED.push({ t0: w.t0, t1: w.t1 }); EDGES.push(w.t0, w.t1); }); VOICED.push({ t0: l.t0, t1: l.t1 }); });
  function blocked(m) {
    var B = [], M = [];
    EDGES.forEach(function (e) { B.push([e - m, e + m]); });
    VOICED.forEach(function (v) { B.push([v.t0 - .03, v.t1 + .03]); });
    B.sort(function (x, y) { return x[0] - y[0]; });
    B.forEach(function (b) { var L = M[M.length - 1]; if (L && b[0] <= L[1]) L[1] = Math.max(L[1], b[1]); else M.push(b.slice()); });
    return M;
  }
  function free(m) {
    var M = blocked(m), F = [], p = 0;
    M.forEach(function (b) { if (b[0] > p) F.push([p, b[0]]); p = Math.max(p, b[1]); });
    F.push([p, DUR + 9]); return F;
  }
  var BODY = { paper: .17, swish: .28, pop: .12, thump: .16 };
  function nearGap(t, type, m) {
    var body = BODY[type] || .12, best = null;
    free(m || .19).forEach(function (f) {
      var lo = f[0], hi = f[1] - body; if (hi < lo) return;
      var c = clamp(t, lo, hi); if (best === null || Math.abs(c - t) < Math.abs(best - t)) best = c;
    });
    return best;
  }
  function gapSpan(a, b) {
    var best = null;
    free(.19).forEach(function (f) { var lo = Math.max(a, f[0]), hi = Math.min(b, f[1]) - .03; if (hi - lo >= .06 && (!best || hi - lo > best[1] - best[0])) best = [lo, hi]; });
    return best;
  }
  /* Two hits carry the film, nothing else: THE stamp after "cancels out" and a paper pop after "reality". The riffle
     before the first word was dropped (Whisper puts "One" at 0.00 s), and the −44 dB wipe sweeps and the loop swish
     were cut after jury round 1: better silence than a rustle nobody hears. */
  var GT = {}, GS = [];
  function G(id, t, type, tol, gain, m) {
    var n = nearGap(t, type, m);
    if (n !== null && Math.abs(n - t) <= (tol || .45)) { GT[id] = n; GS.push({ t: n, type: type, g: gain }); } else GT[id] = t;
  }
  function initGaps() {
        G('slam', wend('stack', 'out') + .3, 'thump', .5, .1, .19);
    if (GT.slam < wend('stack', 'out') + .05) GT.slam = wend('stack', 'out') + .2;
    /* the pop sits at least 0.2 s after the voice's own tail (voice-only ≥ −40 dBFS), not just after the word end */
    var tail = wend('reality', 'reality'); VOICED.forEach(function (v) { if (v.t0 < start('blend') - .1 && v.t1 > tail) tail = v.t1; });
    G('pop', Math.max(wend('reality', 'reality') + .3, tail + .22), 'pop', .45, .22, .19);
    if (GT.pop < tail + .2) GT.pop = tail + .2;
    GT.home = DUR - .3;
  }
  function initTimes() {
    GS.forEach(function (e) { EV.push({ t: e.t, type: e.type, g: e.g }); });
    EV.forEach(function (e) { if (e.type === 'thump') e.t1 = e.t + BODY.thump; });
    EV.sort(function (a, b) { return a.t - b.t; });
  }

  function render(t, samples, shutter, fps) {
    t = clamp(t, 0, DUR); samples = samples || 1;
    if (samples === 1) { POSTERMODE = t === window.FILM.POSTER; frame(ctx, t); POSTERMODE = false; return; }
    var span = (shutter || .5) / (fps || 30);
    for (var k = 0; k < samples; k++) {
      frame(tctx, clamp(t - span / 2 + span * (k + .5) / samples, 0, DUR));
      actx.globalAlpha = k === 0 ? 1 : 1 / (k + 1); actx.drawImage(tmp, 0, 0);
    }
    ctx.globalAlpha = 1; ctx.drawImage(acc, 0, 0);
  }

  /* ---------- sound: foley cut to the word times; no music (Isac adds a TikTok sound) ---------- */
  function SCORE(ac) {
    var sr = ac.sampleRate, rnd = mulberry(7);
    var master = ac.createGain(); master.gain.value = .9;
    var hp = ac.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 32;
    var comp = ac.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 3; comp.attack.value = .004; comp.release.value = .15;
    master.connect(hp); hp.connect(comp); comp.connect(ac.destination);
    var verb = ac.createConvolver(), irl = Math.floor(sr * 1.1), ir = ac.createBuffer(2, irl, sr);
    for (var ch = 0; ch < 2; ch++) { var d = ir.getChannelData(ch); for (var i = 0; i < irl; i++) d[i] = (rnd() * 2 - 1) * Math.pow(1 - i / irl, 4); }
    verb.buffer = ir; var vret = ac.createGain(); vret.gain.value = .16; verb.connect(vret); vret.connect(master);
    var nb = ac.createBuffer(1, sr * 3, sr), nd = nb.getChannelData(0); for (i = 0; i < nd.length; i++) nd[i] = rnd() * 2 - 1;
    function bus(g, send, pan) { var o = ac.createGain(); o.gain.value = g; var p = ac.createStereoPanner(); p.pan.value = pan || 0; o.connect(p); p.connect(master); if (send) { var s = ac.createGain(); s.gain.value = send; p.connect(s); s.connect(verb); } return o; }
    function env(pm, pts) { pm.setValueAtTime(pts[0][1], Math.max(0, pts[0][0])); for (var k = 1; k < pts.length; k++) pm.linearRampToValueAtTime(pts[k][1], Math.max(0, pts[k][0])); }
    function noise(t0, dur) { var s = ac.createBufferSource(); s.buffer = nb; s.loop = true; s.start(Math.max(0, t0), rnd() * 2, dur); return s; }
    function osc(type, f, t0, t1, g, pts, send, pan) { var o = ac.createOscillator(), og = ac.createGain(); o.type = type; o.frequency.setValueAtTime(f, Math.max(0, t0)); o.connect(og); og.connect(bus(1, send || 0, pan)); env(og.gain, pts); o.start(Math.max(0, t0)); o.stop(Math.max(0, t1)); return o; }
    function band(t0, t1, f0, f1, g0, g1, q, pan, send) { var o = bus(1, send == null ? .1 : send, pan), bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = q || .7; var n = noise(t0, t1 - t0 + .1); n.connect(bp); bp.connect(o); env(bp.frequency, [[t0, f0], [t1, f1]]); env(o.gain, [[t0, 0], [t0 + (t1 - t0) * .4, g0], [t1 - .02, g1], [t1, 0]]); }
    function swish(t) { band(t, t + .26, 900, 5200, .016, .004, 1.6); }
    /* a riffle: four paper flicks in 0.16 s, like a thumb running over the edge of a stack of prints */
    function riffle(t, g) { g = g || 1; for (var k = 0; k < 4; k++) band(t + k * .035, t + k * .035 + .045, 1800 + k * 300, 3200 + k * 300, .09 * g, .02, 1.4, (k % 2 ? .25 : -.25)); }
    /* THE hit: a stack of paper prints squared on a table. A 260 → 190 Hz body and a 330 Hz knock (where a phone
       speaker plays), and a short paper slap on top */
    function stackThump(t, g) {
      g = g || 1;
      var o = osc('sine', 260, t, t + .15, 1, [[t, 0], [t + .004, .62 * g], [t + .14, 0]], .06); o.frequency.exponentialRampToValueAtTime(190, t + .13);
      osc('triangle', 330, t, t + .07, 1, [[t, 0], [t + .002, .4 * g], [t + .06, 0]], .03);
      var n = noise(t, .08), bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1300; bp.Q.value = .9; var ob = bus(1, .08); n.connect(bp); bp.connect(ob); env(ob.gain, [[t, 0], [t + .003, .16 * g], [t + .06, 0]]);
    }
    /* a paper pop: a card snapped flat, short */
    function popS(t, g) {
      /* dry: no reverb send, so nothing of it rings into "Your" 0.2 s later */
      g = g || 1; var o = osc('sine', 420, t, t + .1, 1, [[t, 0], [t + .003, .22 * g], [t + .09, 0]], 0); o.frequency.exponentialRampToValueAtTime(260, t + .08);
      band(t, t + .06, 1600, 2600, .07 * g, .01, 1.2, 0, 0);
    }
    function sweepS(t, t1) { band(t, t1 + .03, 600, 3000, .014, .008, 1.6); }
    EV.forEach(function (e) {
      if (e.type === 'paper') riffle(e.t, e.g);
      else if (e.type === 'thump') stackThump(e.t, e.g);
      else if (e.type === 'pop') popS(e.t, e.g);
      else if (e.type === 'swish') swish(e.t);
      else if (e.type === 'sweep') sweepS(e.t, e.t1);
    });
    /* no music: Isac adds a trending TikTok sound on the platform; the film ships voice + sound effects */
    var MUSIC = false;
    if (MUSIC) { /* intentionally empty */ }
    env(master.gain, [[0, .9], [DUR - .3, .9], [DUR, .6]]);
    /* room tone, about −60 dB, so the loop seam is never digital zero */
    (function () { var o = bus(1, 0), lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900; lp.Q.value = .5;
      var n = noise(0, DUR); n.connect(lp); lp.connect(o); o.gain.value = .0015; })();
  }

  /* ---------- boot ---------- */
  function init(canvas, opts) {
    cv = canvas; ctx = cv.getContext('2d'); cv.width = W; cv.height = H;
    tmp = mk(W, H); tctx = tmp.getContext('2d'); acc = mk(W, H); actx = acc.getContext('2d');
    watch(ctx); watch(tctx);
    if (opts && opts.grain === false) LIVE.grain = false;
    NOISE = mk(256, 256); var ng = NOISE.getContext('2d'), id = ng.createImageData(256, 256), r = mulberry(3);
    for (var i = 0; i < id.data.length; i += 4) { var v = 120 + r() * 135; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255; }
    ng.putImageData(id, 0, 0);
    var fonts = ['900 expanded 84px Archivo', '800 expanded 84px Archivo', '900 84px Archivo', '800 84px Archivo', '700 46px Archivo', '600 46px Archivo', '500 30px "Geist Mono"', '600 30px "Geist Mono"', '700 30px "Geist Mono"'];
    return Promise.all(fonts.map(function (f) { return document.fonts.load(f, 'Aa0%°×−≈≠µ“”·→…#?‹✓✕–@!>$'); })).then(function () { return document.fonts.ready; }).then(function () {
      STEX = {}; buildSheets();
      window.READY = true;
    });
  }
  initGaps();
  initTimes();
  window.FILM = { bare: function () { ctx.setTransform(1, 0, 0, 1, 0, 0); stage(ctx); }, W: W, H: H, DUR: DUR, POSTER: Math.min(GT.slam + .22, start('why') - .26), SLUG: 'phonephoto', SHOTS: SHOTS, init: init, render: render, frame: frame, LIVE: LIVE };
  window.BOUNDS_RUN = function (step) {
    BOUNDS = []; var out = {};
    for (var t = 0; t <= DUR + 1e-6; t += step || 1 / 15) { CURT = t; POSTERMODE = false; frame(ctx, t); }
    BOUNDS.forEach(function (b) { var o = out[b.text] || (out[b.text] = { text: b.text, from: b.t, to: b.t, x0: b.x0, x1: b.x1, y1: b.y1, n: 0 }); o.to = b.t; o.n++; o.x0 = Math.min(o.x0, b.x0); o.x1 = Math.max(o.x1, b.x1); o.y1 = Math.max(o.y1, b.y1); });
    BOUNDS = null; return Object.keys(out).map(function (k) { return out[k]; });
  };
  window.DUR = DUR; window.EV = EV; window.TEXTS = TEXTS; window.SCORE = SCORE; window.READY = false;
  window.render = function (t, s, sh, fps) { render(t, s, sh, fps); };
})();
