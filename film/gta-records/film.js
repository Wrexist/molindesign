/* "The record trailers": GTA 6, Delta #2. A vertical counter film written in code, narrated first and cut to the voice:
   every visual beat is keyed to a word time from vo/vo.js (window.VO) with at(id, word). Pure function of t.
   Contract: window.FILM, DUR, render(t), READY, EV, TEXTS(t), SCORE(ctx). The native move is the odometer: its digits roll to
   90,421,491, then the same wheels roll to 475M, and the closing balance weighs the two numbers. Everything is hand-built flat
   shapes in a Vice City palette: a striped sun, a 24-hour ring, day tiles, a leaked-video card, bars, a balance.
   No Rockstar footage, logo or key art, no music. Facts and sources: BRIEF.md. */
(function () {
  'use strict';
  var W = 1080, H = 1920, VO = window.VO, DUR = VO.dur, CX = 510;
  var BG = '#0b0820', CREAM = '#fbf0ea', DIM = 'rgba(251,240,234,.55)';
  var HOT = '#ff4fa3', TEAL = '#19d3c5', ORG = '#ff8a3d';
  var PURP = '#241250', PURP2 = '#160b36', PAPER = '#fbf0ea', INK = '#0b0820';
  var DISP = 'Archivo', MONO = '"Geist Mono"';

  /* ---------- math ---------- */
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, k) { return a + (b - a) * k; }
  function seg(t, a, b) { return clamp((t - a) / (b - a), 0, 1); }
  function eo(k) { return k >= 1 ? 1 : 1 - Math.pow(2, -10 * k); }
  function eio(k) { return k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; }
  function mulberry(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
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
  function end(id) { return LINE[id].t1; }
  function start(id) { return LINE[id].t0; }


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
    font(g, px, o.wt, o.fam); ls(g, o.ls || 0);
    var tw = g.measureText(text).width, pad = o.pad == null ? px * .32 : o.pad;
    while (o.maxw && tw + pad * 2 > o.maxw && px > 30) { px -= 2; font(g, px, o.wt, o.fam); tw = g.measureText(text).width; pad = o.pad == null ? px * .32 : o.pad; }
    var w = o.w || tw + pad * 2, h = o.h || px * 1.28;
    g.save(); g.globalAlpha *= clamp(a, 0, 1); g.translate(x, y); if (o.rot) g.rotate(o.rot); g.scale(s, s);
    if (o.bg || o.line) recBox(g, -w / 2, -h / 2, w / 2, h / 2, '[chip] ' + text);
    if (o.bg) { if (o.shadow !== false) { rr(g, -w / 2 + 6, -h / 2 + 9, w, h, o.r == null ? h * .26 : o.r); g.fillStyle = 'rgba(0,0,0,.35)'; g.fill(); } rr(g, -w / 2, -h / 2, w, h, o.r == null ? h * .26 : o.r); g.fillStyle = o.bg; g.fill(); }
    if (o.line) { rr(g, -w / 2, -h / 2, w, h, o.r == null ? h * .26 : o.r); g.strokeStyle = o.line; g.lineWidth = o.lw || 3; g.stroke(); }
    g.fillStyle = o.fg || (o.bg ? BG : CREAM); g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(text, 0, px * .04); g.restore(); ls(g, 0);
    return w;
  }
  function label(g, text, x, y, a, col, px, align, plate) {
    px = Math.max(30, px || 36);
    if (a <= 0) return;
    g.save(); g.globalAlpha *= clamp(a, 0, 1); font(g, px, 500, MONO); ls(g, 3); g.textAlign = align || 'center'; g.textBaseline = 'middle';
    while (g.measureText(text).width > 800 && px > 30) { px--; font(g, px, 500, MONO); }
    var dy = (1 - Math.min(1, a)) * 14;
    if (plate) {
      var w = g.measureText(text).width, x0 = align === 'left' ? x : align === 'right' ? x - w : x - w / 2;
      rr(g, x0 - 18, y - px * .78 + dy, w + 36, px * 1.56, 12); g.fillStyle = 'rgba(21,19,27,.92)'; g.fill();
    }
    g.fillStyle = col || CREAM;
    g.fillText(text, x, y + dy); g.restore(); ls(g, 0);
  }
  function block(g, lines, x, y, px, a, plate, col, wt, fam) {
    if (a <= 0) return;
    g.save(); g.globalAlpha *= clamp(a, 0, 1); font(g, px, wt || 500, fam || MONO); ls(g, 0); g.textAlign = 'center'; g.textBaseline = 'middle';
    var lh = px * 1.3, w = 0; lines.forEach(function (l) { w = Math.max(w, g.measureText(l).width); });
    var y0 = y - (lines.length - 1) * lh / 2;
    if (plate) { rr(g, x - w / 2 - 22, y0 - lh / 2 - 10, w + 44, lh * lines.length + 20, 14); g.fillStyle = 'rgba(21,19,27,.94)'; g.fill(); if (plate === 'line') { g.strokeStyle = CREAM; g.lineWidth = 3; g.stroke(); } }
    g.fillStyle = col || CREAM; lines.forEach(function (l, i) { g.fillText(l, x, y0 + i * lh); });
    g.restore();
  }
  function tri(g, a, b, c, d, e, f) { g.beginPath(); g.moveTo(a, b); g.lineTo(c, d); g.lineTo(e, f); g.closePath(); g.fill(); }
  function el(g, x, y, rx, ry, rot) { g.beginPath(); g.ellipse(x, y, rx, ry, rot || 0, 0, 6.283); g.fill(); }
  function sheet(g, x, y, w, h, rot, a, fn, col) {
    if (a <= 0) return;
    g.save(); g.globalAlpha *= clamp(a, 0, 1); g.translate(x, y); g.rotate(rot || 0);
    g.fillStyle = 'rgba(0,0,0,.34)'; g.fillRect(-w / 2 + 12, -h / 2 + 18, w, h);
    g.fillStyle = col || PAPER; g.fillRect(-w / 2, -h / 2, w, h);
    g.fillStyle = 'rgba(0,0,0,.05)'; g.fillRect(-w / 2, h / 2 - 6, w, 6);
    if (fn) fn(g, w, h);
    g.restore();
  }
  function tag(g, text, x, y, a, rot) { chip(g, text, x, y, { px: 32, wt: 700, fam: MONO, line: HOT, lw: 4, fg: HOT, a: a, rot: rot == null ? .03 : rot, shadow: false, bg: 'rgba(21,19,27,.85)' }); }

  /* ---------- rubber stamps: worn ink (seeded speckle), slammed ---------- */
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
  function stamp(g, text, x, y, t, t0, t1, px, col, rot, bare) {
    if (t < t0 || t > t1 + .3) return;
    var c = stampTex(text, col, px);
    var k = sp(t, t0, 3.2, .8), s = lerp(1.35, 1, clamp(k, 0, 1)), al = clamp(k * 3, 0, 1) * (1 - seg(t, t1, t1 + .3));
    g.save(); g.globalAlpha *= al; g.translate(x, y); g.rotate(rot == null ? -.1 : rot); g.scale(s, s);
    if (k >= 1) recBox(g, -c.w / 2 - 14, -c.h / 2 - 4, c.w / 2 - 6, c.h / 2 + 4, text);
    if (!bare) { g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(-c.w / 2 - 4, -c.h / 2 + 10, c.w + 8, c.h);
      g.fillStyle = PAPER; g.fillRect(-c.w / 2 - 14, -c.h / 2 - 4, c.w + 8, c.h + 8); }
    g.drawImage(c, -c.w / 2 - 10, -c.h / 2); g.restore();
  }

  /* scenes. swipe:true = the next scene rises in under a slanted edge */
  var SWIPE = .42, PRE = .3;
  var SC = [
    { id: 'count', fn: 'count', name: 'Counter', t0: 0 },
    { id: 'leakday', fn: 'leakday', name: 'Early', t0: start('first') - .05, swipe: true },
    { id: 'num', fn: 'num', name: 'Record', t0: start('num') - .05, swipe: true },
    { id: 'bars', fn: 'bars', name: 'MrBeast', t0: start('mrb') - .05, swipe: true },
    { id: 'two', fn: 'two', name: 'Trailer 2', t0: start('two') - .05, swipe: true },
    { id: 'split', fn: 'split', name: 'YouTube only', t0: start('but') - .05, swipe: true },
    { id: 'end', fn: 'end', name: 'Which', t0: start('end') - .05, swipe: true }
  ];
  SC.forEach(function (s, i) { s.t1 = i + 1 < SC.length ? SC[i + 1].t0 : DUR; });
  function S(id) { for (var i = 0; i < SC.length; i++) if (SC[i].id === id) return SC[i]; }
  var SHOTS = SC.map(function (s) { return { id: s.id, name: s.name, t0: s.t0, t1: s.t1 }; });
  var HOME = DUR - .5;

  /* ---------- odometer: the film's one object ---------- */
  function odo(g, cx, cy, v, o) {
    var cw = o.cw, ch = o.ch, gp = o.gap == null ? 8 : o.gap, cg = o.cg || 30, px = o.px || ch * .85;
    var s = String(Math.max(0, Math.floor(v))), n = s.length, items = [], w = 0, i;
    for (i = 0; i < n; i++) {
      var place = n - 1 - i;
      if (o.commas && i > 0 && place % 3 === 2) { items.push({ c: 1, w: cg }); }
      items.push({ p: place, w: cw });
    }
    items.forEach(function (it, k) { w += it.w + (k < items.length - 1 ? gp : 0); });
    var sw = 0;
    if (o.suffix) { font(g, px * .8, 900); wide(g); sw = g.measureText(o.suffix).width + 18; }
    var x = cx - (w + sw) / 2;
    items.forEach(function (it) {
      if (it.c) { font(g, px * .8, 900); g.fillStyle = o.fg || CREAM; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(',', x + it.w / 2, cy + ch * .3); x += it.w + gp; return; }
      var f = (v / Math.pow(10, it.p)) % 10, d = Math.floor(f), fr = f - d, r = it.p === 0 ? fr : clamp((fr - .9) / .1, 0, 1);
      g.save(); rr(g, x + 5, cy - ch / 2 + 9, cw, ch, 14); g.fillStyle = 'rgba(0,0,0,.35)'; g.fill();
      rr(g, x, cy - ch / 2, cw, ch, 14); g.fillStyle = o.bg || INK; g.fill(); g.clip();
      font(g, px, 900); g.fillStyle = o.fg || CREAM; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(String(d), x + cw / 2, cy + 4 - r * ch); g.fillText(String((d + 1) % 10), x + cw / 2, cy + 4 + (1 - r) * ch);
      g.fillStyle = 'rgba(255,255,255,.07)'; g.fillRect(x, cy - ch / 2, cw, ch * .18);
      g.fillStyle = 'rgba(0,0,0,.22)'; g.fillRect(x, cy + ch / 2 - ch * .16, cw, ch * .16);
      g.fillStyle = 'rgba(0,0,0,.4)'; g.fillRect(x, cy - 1.5, cw, 3);
      g.restore();
      x += cw + gp;
    });
    if (o.suffix) { font(g, px * .8, 900); wide(g); g.fillStyle = o.sfg || TEAL; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText(o.suffix, x + 8, cy + 4); }
  }
  /* views, one number across scenes: 90,000,000 by "million", a creep, then the exact record on "90,421,491" */
  /* stepped, so every wheel is readable between steps: 7,500 views per tick, a quick roll at the start of each tick */
  function baseV(t) { var k = Math.floor(t / .6), f = seg((t / .6) % 1, 0, .4); return 90000000 + 7500 * (k + eio(f)); }
  function Vviews(t) {
    var a0 = at('num', 'over'), a1 = wend('num', 'million') + .15;
    if (t >= a0) return lerp(baseV(a0), 90421491, eio(seg(t, a0, a1)));
    return baseV(t);
  }

  /* the sun: a flat gradient disc cut by scrolling stripes */
  function sun(g, cx, cy, r, t, a) {
    g.save(); g.globalAlpha *= a == null ? 1 : a; g.beginPath(); g.arc(cx, cy, r, 0, 6.283); g.clip();
    var gr = g.createLinearGradient(0, cy - r, 0, cy + r); gr.addColorStop(0, ORG); gr.addColorStop(1, HOT);
    g.fillStyle = gr; g.fillRect(cx - r, cy - r, r * 2, r * 2);
    g.fillStyle = BG;
    for (var k = 0; k < 9; k++) { var u = ((k + (t * .32) % 1) / 9), y = cy - r * .1 + u * r * 1.15, h = 4 + u * u * 54; g.fillRect(cx - r, y, r * 2, h); }
    g.restore();
  }
  /* the 24-hour ring: sweeps one full turn while the hook says "One day." */
  function ring(g, cx, cy, r, t) {
    var k = eio(seg(t, .05, wend('hook', 'day') + .1)), a0 = -Math.PI / 2;
    g.save(); g.lineCap = 'round';
    g.strokeStyle = 'rgba(251,240,234,.14)'; g.lineWidth = 14; g.beginPath(); g.arc(cx, cy, r, 0, 6.283); g.stroke();
    g.strokeStyle = TEAL; g.lineWidth = 18; g.beginPath(); g.arc(cx, cy, r, a0, a0 + 6.283 * k); g.stroke();
    g.strokeStyle = 'rgba(251,240,234,.55)'; g.lineWidth = 4;
    for (var i = 0; i < 24; i++) { var an = a0 + i * 6.283 / 24; g.beginPath(); g.moveTo(cx + Math.cos(an) * (r + 24), cy + Math.sin(an) * (r + 24)); g.lineTo(cx + Math.cos(an) * (r + (i % 6 === 0 ? 50 : 38)), cy + Math.sin(an) * (r + (i % 6 === 0 ? 50 : 38))); g.stroke(); }
    var ta = a0 + 6.283 * k; g.fillStyle = CREAM; el(g, cx + Math.cos(ta) * r, cy + Math.sin(ta) * r, 17, 17);
    g.restore();
  }

  /* =====================================================================================================
     SCENE 1 · hook: a huge sun, a 24-hour ring, an odometer already rolling
     ===================================================================================================== */
  function countScene(g, t) {
    var cy = 1000, one = at('hook', 'one'), kk = Math.max(0, knock(t, wend('hook', 'million'), 16, 6));
    sun(g, CX, cy, 400, t);
    ring(g, CX, cy, 458, t);
    chip(g, 'GTA 6', CX, 440, { px: 170, wt: 900, bg: HOT, fg: BG, pad: 56, maxw: 800, rot: -.02, s: 1 + .03 * Math.max(0, knock(t, at('hook', '6'), 16, 7)) });
    var sq = 1 + .035 * kk; g.save(); g.translate(CX, cy); g.scale(sq, sq); g.translate(-CX, -cy);
    odo(g, CX, cy, Vviews(t), { cw: 80, ch: 156, px: 136, gap: 8, cg: 30, commas: true }); g.restore();
    chip(g, 'VIEWS', CX, 1130, { px: 60, wt: 900, bg: TEAL, fg: BG, a: 1, rot: .015 });
    chip(g, 'IN 24 HOURS', CX, 1300, { px: 78, wt: 900, bg: ORG, fg: BG, a: fin(t, .85), s: lerp(1.2, 1, clamp(pop(t, .85, 3.2), 0, 1)), rot: -.025, maxw: 800 });
  }

  /* =====================================================================================================
     SCENE 2 · first + leak: planned Dec 5, out Dec 4; a leaked video card; EARLY
     ===================================================================================================== */
  function tile(g, x, y, w, h, dow, num, col, a) {
    if (a <= 0) return;
    g.save(); g.globalAlpha *= clamp(a, 0, 1); g.translate(x, y);
    rr(g, -w / 2 + 8, -h / 2 + 14, w, h, 28); g.fillStyle = 'rgba(0,0,0,.4)'; g.fill();
    rr(g, -w / 2, -h / 2, w, h, 28); g.fillStyle = PURP; g.fill();
    g.save(); rr(g, -w / 2, -h / 2, w, h, 28); g.clip(); g.fillStyle = col; g.fillRect(-w / 2, -h / 2, w, 88); g.restore();
    rr(g, -w / 2, -h / 2, w, h, 28); g.strokeStyle = col; g.lineWidth = 6; g.stroke();
    font(g, 42, 700, MONO); ls(g, 3); g.fillStyle = BG; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(dow, 0, -h / 2 + 46); ls(g, 0);
    font(g, 210, 900); g.fillStyle = CREAM; g.fillText(num, 0, 52);
    g.restore();
  }
  function pinChip(g, text, x, y, bg, a) {
    if (a <= 0) return;
    chip(g, text, x, y, { px: 36, wt: 700, fam: MONO, bg: bg, fg: BG, a: a, shadow: true });
    g.save(); g.globalAlpha *= clamp(a, 0, 1); g.fillStyle = bg; tri(g, x - 14, y + 28, x + 14, y + 28, x, y + 50); g.restore();
  }
  function leakCard(g, x, y, t, a, s) {
    if (a <= 0) return;
    var w = 540, h = 300, r = mulberry(5 + Math.floor(t * 12));
    g.save(); g.globalAlpha *= clamp(a, 0, 1); g.translate(x, y); g.scale(s, s);
    rr(g, -w / 2 + 10, -h / 2 + 16, w, h, 26); g.fillStyle = 'rgba(0,0,0,.4)'; g.fill();
    rr(g, -w / 2, -h / 2, w, h, 26); g.fillStyle = PURP2; g.fill(); g.strokeStyle = CREAM; g.lineWidth = 4; g.stroke();
    g.save(); rr(g, -w / 2, -h / 2, w, h, 26); g.clip();
    for (var i = 0; i < 9; i++) { g.fillStyle = r() > .5 ? 'rgba(25,211,197,.28)' : 'rgba(255,79,163,.25)'; g.fillRect(-w / 2 + r() * 120 - 60, -h / 2 + 14 + i * 32, 120 + r() * 380, 10 + r() * 12); }
    g.restore();
    g.fillStyle = ORG; tri(g, -34, -48, -34, 48, 48, 0);
    g.strokeStyle = HOT; g.lineWidth = 8; g.lineJoin = 'round'; g.beginPath(); g.moveTo(w / 2 - 150, -h / 2); g.lineTo(w / 2 - 190, -h / 2 + 90); g.lineTo(w / 2 - 130, -h / 2 + 160); g.lineTo(w / 2 - 176, h / 2); g.stroke();
    for (var d = 0; d < 3; d++) { var u = ((t * 1.1 + d / 3) % 1), dx = -130 + d * 120 + (d % 2 ? 30 : 0), dy = h / 2 + 8 + u * 120; g.save(); g.globalAlpha *= 1 - u * u; g.fillStyle = TEAL; el(g, dx, dy, 13, 17); tri(g, dx - 11, dy - 8, dx + 11, dy - 8, dx, dy - 36); g.restore(); }
    g.restore();
  }
  function leakdayScene(g, t) {
    var s0 = S('leakday').t0, tr = at('first', 'trailer'), ea = at('first', 'early'), lk = at('leak', 'leak'), ah = at('leak', 'ahead');
    chip(g, 'TRAILER 1', CX, 500, { px: 70, wt: 900, bg: CREAM, fg: BG, a: fin(t, tr - .1), s: lerp(1.15, 1, clamp(pop(t, tr - .1, 3.2), 0, 1)), rot: -.02 });
    tile(g, 310, 830, 380, 330, 'MON · DEC', '4', TEAL, fin(t, s0 + .05));
    var sch = at('leak', 'schedule'), po = at('leak', 'post');
    tile(g, 770, 830, 380, 330, 'TUE · DEC', '5', HOT, fin(t, s0 + .1) * (1 - .55 * seg(t, sch, sch + .3)));
    var sl = eio(seg(t, ea + .35, ea + .75));
    if (sl > 0) { g.save(); g.strokeStyle = HOT; g.lineWidth = 18; g.lineCap = 'round'; g.beginPath(); g.moveTo(620, 700); g.lineTo(lerp(620, 920, sl), lerp(700, 960, sl)); g.stroke(); g.restore(); }
    var rk = seg(t, ah - .05, ah + .6);
    if (rk > 0 && rk < 1) { g.save(); g.globalAlpha *= 1 - rk; g.strokeStyle = TEAL; g.lineWidth = 12; rr(g, 120 - rk * 60, 665 - rk * 60, 380 + rk * 120, 330 + rk * 120, 28 + rk * 30); g.stroke(); g.restore(); }
    var hop = eio(seg(t, ea + .25, ea + .8)), px = lerp(745, 310, hop), py = 625 - Math.sin(Math.PI * hop) * 62;
    var pa = fin(t, s0 + .1);
    pinChip(g, 'PLANNED 9 AM ET', px, py, HOT, pa * (hop < .5 ? 1 : 0));
    pinChip(g, 'OUT DEC 4', px, py, TEAL, pa * (hop < .5 ? 0 : 1));
    leakCard(g, CX, 1180, t, fin(t, lk - .1), lerp(.8, 1, clamp(pop(t, lk - .1, 3), 0, 1)) * kn(t, po));
    stamp(g, 'LEAKED', 560, 1180, t, lk + .05, S('num').t0 - SWIPE - .1, 100, HOT, -.1);
    label(g, 'SOURCE: GUINNESS, CNN', CX, 1400, fin(t, tr + .3), CREAM, 36, 'center', true);
  }

  /* =====================================================================================================
     SCENE 3 · num + guin: the odometer lands on 90,421,491; a Guinness stamp
     ===================================================================================================== */
  function rays(g, cx, cy, t, a) {
    g.save(); g.globalAlpha *= a; g.translate(cx, cy); g.rotate(t * .07);
    for (var i = 0; i < 24; i += 2) { var a0 = i * Math.PI / 12, a1 = a0 + Math.PI / 12; g.fillStyle = i % 4 ? 'rgba(25,211,197,.09)' : 'rgba(255,79,163,.11)'; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(a0) * 1300, Math.sin(a0) * 1300); g.lineTo(Math.cos(a1) * 1300, Math.sin(a1) * 1300); g.closePath(); g.fill(); }
    g.restore();
  }
  function rosette(g, x, y, t, a, s) {
    if (a <= 0) return;
    g.save(); g.globalAlpha *= clamp(a, 0, 1); g.translate(x, y); g.scale(s, s);
    g.fillStyle = TEAL; tri(g, -60, 40, -20, 40, -90, 190); tri(g, 60, 40, 20, 40, 90, 190);
    g.fillStyle = 'rgba(0,0,0,.35)'; el(g, 8, 14, 142, 142);
    g.save(); g.rotate(t * .6); g.fillStyle = HOT; for (var i = 0; i < 18; i++) { var an = i * 6.283 / 18; el(g, Math.cos(an) * 118, Math.sin(an) * 118, 34, 34); } g.restore();
    g.fillStyle = HOT; el(g, 0, 0, 120, 120); g.fillStyle = BG; el(g, 0, 0, 92, 92); g.fillStyle = ORG; el(g, 0, 0, 80, 80);
    g.fillStyle = CREAM; g.beginPath(); for (var k = 0; k < 10; k++) { var r2 = k % 2 ? 26 : 62, aa = -Math.PI / 2 + k * Math.PI / 5; g.lineTo(Math.cos(aa) * r2, Math.sin(aa) * r2); } g.closePath(); g.fill();
    g.restore();
  }
  function numScene(g, t) {
    var s0 = S('num').t0, nm = at('num', 'over'), yt = at('num', 'youtube'), hr = at('num', 'hours'), gn = at('guin', 'guinness'), vw = at('guin', 'viewed');
    var land = wend('num', 'million') + .15, kk = Math.max(0, knock(t, land, 16, 6));
    rays(g, CX, 780, t, 1);
    rosette(g, CX, 1090, t, fin(t, at('num', 'views') - .1), lerp(.8, 1, clamp(pop(t, at('num', 'views') - .1, 3), 0, 1)));
    var sq = 1 + .035 * kk; g.save(); g.translate(CX, 780); g.scale(sq, sq); g.translate(-CX, -780);
    odo(g, CX, 780, Vviews(t), { cw: 80, ch: 156, px: 136, gap: 8, cg: 30, commas: true }); g.restore();
    chip(g, 'VIEWS', CX, 640, { px: 52, wt: 900, bg: TEAL, fg: BG, a: fin(t, s0 + .1), rot: .015 });
    chip(g, 'YOUTUBE', 330, 950, { px: 56, wt: 900, bg: HOT, fg: BG, a: fin(t, yt - .1), s: lerp(1.15, 1, clamp(pop(t, yt - .1, 3.2), 0, 1)), rot: -.02 });
    chip(g, '24 HOURS', 690, 950, { px: 56, wt: 900, bg: ORG, fg: BG, a: fin(t, hr - .1), s: lerp(1.15, 1, clamp(pop(t, hr - .1, 3.2), 0, 1)), rot: .02 });
    stamp(g, 'WORLD RECORD', CX, 1120, t, wend('guin', 'guinness') + .02, S('bars').t0 - SWIPE - .1, 70, TEAL, -.05);
    block(g, ['MOST VIEWED GAME REVEAL', 'ON YOUTUBE IN 24 HOURS'], CX, 1300, 38, fin(t, at('guin', 'official') + .1), 'line');
    label(g, 'GUINNESS, DEC 2023', CX, 1412, fin(t, gn + .3), CREAM, 36, 'center', true);
  }

  /* =====================================================================================================
     SCENE 4 · mrb: bars, 90.4M against MrBeast's 59.4M
     ===================================================================================================== */
  var BASE = 1330, PXM = 8.2;
  function bar(g, cx, w, h, col, a) {
    if (h <= 1) return;
    g.save(); g.globalAlpha *= a;
    g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(cx - w / 2 + 10, BASE - h + 14, w, h);
    g.fillStyle = col; g.fillRect(cx - w / 2, BASE - h, w, h);
    g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(cx - w / 2, BASE - h, w * .16, h);
    g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(cx - w / 2, BASE - h, w, 14);
    g.restore();
  }
  function barsScene(g, t) {
    var s0 = S('bars').t0 - .25, mb = at('mrb', 'even'), n59 = at('mrb', '59'), bt = at('mrb', 'beat');
    var h1 = 90.4 * PXM * eo(seg(t, s0, s0 + .55)), h2 = 59.4 * PXM * eo(seg(t, mb - .05, mb + .5));
    rays(g, CX, 900, t, .8);
    g.fillStyle = 'rgba(251,240,234,.5)'; g.fillRect(120, BASE - 2, 780, 4);
    bar(g, 300, 260, h1, HOT, 1);
    bar(g, 720, 260, h2, TEAL, 1);
    /* the record line from the top of the pink bar */
    var ly = BASE - 90.4 * PXM, la = fin(t, mb);
    if (la > 0) { g.save(); g.globalAlpha *= la; g.strokeStyle = CREAM; g.lineWidth = 4; g.setLineDash([16, 12]); g.lineDashOffset = -t * 30; g.beginPath(); g.moveTo(430, ly); g.lineTo(860, ly); g.stroke(); g.restore(); }
    chip(g, '90.4M', 300, BASE - h1 - 52, { px: 70, wt: 900, bg: CREAM, fg: BG, a: fin(t, s0 + .35), s: kn(t, s0 + .5) });
    chip(g, '59.4M', 720, Math.max(BASE - h2 + 62, BASE - 70), { px: 70, wt: 900, bg: CREAM, fg: BG, a: fin(t, mb + .3) * (h2 > 120 ? 1 : 0), s: lerp(1.15, 1, clamp(pop(t, mb + .3, 3.2), 0, 1)) });
    chip(g, '+31M', 720, (ly + BASE - h2) / 2, { px: 64, wt: 900, bg: ORG, fg: BG, a: fin(t, bt + .25), s: lerp(1.15, 1, clamp(pop(t, bt + .25, 3.2), 0, 1)), rot: -.03 });
    label(g, 'TRAILER 1', 300, 1380, fin(t, s0 + .3), CREAM, 36, 'center');
    label(g, 'MRBEAST', 720, 1380, fin(t, s0 + .15), CREAM, 36, 'center');
    label(g, 'MRBEAST: PREVIOUS RECORD', CX, 1425, fin(t, s0 + .3), CREAM, 36, 'center');
  }

  /* =====================================================================================================
     SCENE 5 · two + claim + big: Trailer 2, May 6 2025; 475M across all platforms, Rockstar's claim
     ===================================================================================================== */
  function twoScene(g, t) {
    var s0 = S('two').t0, tr = at('two', 'trailer'), my = at('two', 'may'), cl = at('claim', 'reports'), sy = at('claim', 'claimed'), n475 = at('claim', '475'),
      qS = at('claim', 'platforms') + .1, hr = at('claim', 'hours'), al = at('claim', 'all'), bg = at('big', 'biggest');
    var goK = eio(seg(t, cl - .15, cl + .2));
    /* the big 2 */
    if (goK < 1) {
      var ps = pop(t, s0 - .0, 2.8), sc = lerp(1, .5, goK);
      g.save(); g.globalAlpha *= 1 - goK; g.translate(CX, lerp(850, 760, goK)); g.scale(sc * lerp(.85, 1, clamp(ps, 0, 1)), sc * lerp(.85, 1, clamp(ps, 0, 1)));
      rr(g, -270 + 10, -270 + 16, 540, 540, 56); g.fillStyle = 'rgba(0,0,0,.4)'; g.fill();
      rr(g, -270, -270, 540, 540, 56); g.fillStyle = TEAL; g.fill();
      font(g, 480, 900); g.fillStyle = BG; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('2', 0, 30);
      g.restore();
      chip(g, 'TRAILER 2', CX, 1230, { px: 84, wt: 900, bg: CREAM, fg: BG, a: fin(t, tr - .1) * (1 - goK), s: kn(t, tr), rot: -.02 });
      chip(g, 'MAY 6, 2025', CX, 1345, { px: 66, wt: 900, bg: ORG, fg: BG, a: fin(t, tr + .15) * (1 - goK), s: lerp(1.15, 1, clamp(pop(t, my - .1, 3.2), 0, 1)), rot: .02 });
    }
    /* the 475 odometer */
    var v = lerp(60, 475, eio(seg(t, n475 - .25, n475 + .5))), oa = fin(t, cl - .1);
    rays(g, CX, 800, t, oa);
    if (oa > 0) {
      g.save(); g.globalAlpha *= oa; var sq = 1 + .03 * Math.max(0, knock(t, n475 + .5, 16, 6)); g.translate(CX, 800); g.scale(sq, sq); g.translate(-CX, -800);
      odo(g, CX, 800, v, { cw: 168, ch: 290, px: 250, gap: 10, suffix: 'M+' }); g.restore();
    }
    tag(g, 'REPORTED CLAIM', CX, 600, fin(t, sy - .1), -.02);
    chip(g, 'IN 24 HOURS', CX, 1010, { px: 58, wt: 900, bg: ORG, fg: BG, a: fin(t, hr - .1), s: lerp(1.15, 1, clamp(pop(t, hr - .1, 3.2), 0, 1)), rot: -.015 });
    chip(g, 'ALL PLATFORMS', CX, 1130, { px: 84, wt: 900, bg: HOT, fg: BG, a: fin(t, al - .1), s: lerp(1.08, 1, clamp(pop(t, al - .1, 3.2), 0, 1)), rot: .02, maxw: 740 });
    /* the claim */
    var qa = fin(t, qS), qs = lerp(1.08, 1, clamp(pop(t, qS, 3), 0, 1));
    g.save(); g.translate(CX, 1290); g.scale(qs, qs); g.translate(-CX, -1290);
    block(g, ['“THE BIGGEST VIDEO LAUNCH', 'OF ALL TIME”'], CX, 1290, 44, qa, 'line', CREAM, 700);
    g.restore();
    tag(g, 'ROCKSTAR’S CLAIM', 330, 1210, fin(t, qS + .05), -.04);
    label(g, 'REPORTED BY THE HOLLYWOOD REPORTER', CX, 1405, fin(t, qS + .2), CREAM, 36, 'center', true);
    label(g, 'RELEASED MAY 6, 2025 (GTABOSS)', CX, 1420, fin(t, my) * (1 - goK), CREAM, 36, 'center', true);
  }

  /* =====================================================================================================
     SCENE 6 · but + less: all-platform bar split; YouTube alone ~84M against trailer 1's 90.4M
     ===================================================================================================== */
  function splitScene(g, t) {
    var s0 = S('split').t0 - .25, yt = at('but', 'youtube'), n84 = at('but', '84'), al = at('but', 'alone'), tr2 = at('but', 'trailer');
    var PX = 8.6, x0 = 100, y1 = 720, y2 = 1010, bh = 160;
    var k90 = eo(seg(t, s0, s0 + .6)), k84 = eo(seg(t, n84 - .1, n84 + .55));
    rays(g, CX, 860, t, .7);
    label(g, 'TRAILER 1 · YOUTUBE', x0, y1 - 110, fin(t, s0), CREAM, 44, 'left');
    g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(x0 + 10, y1 - bh / 2 + 14, 90.4 * PX * k90, bh);
    g.fillStyle = HOT; g.fillRect(x0, y1 - bh / 2, 90.4 * PX * k90, bh);
    chip(g, '90.4M', x0 + 170, y1, { px: 84, wt: 900, bg: CREAM, fg: BG, a: fin(t, s0 + .35), s: kn(t, s0 + .6) });
    label(g, 'TRAILER 2 · YOUTUBE ONLY', x0, y2 - 110, fin(t, tr2 - .1), CREAM, 44, 'left');
    g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(x0 + 10, y2 - bh / 2 + 14, 84 * PX * k84, bh);
    g.fillStyle = TEAL; g.fillRect(x0, y2 - bh / 2, 84 * PX * k84, bh);
    chip(g, 'ABOUT 84M', x0 + 250, y2, { px: 76, wt: 900, bg: CREAM, fg: BG, a: fin(t, n84), s: kn(t, n84 + .4) });
    /* the gap: a dashed line down from the end of the pink bar */
    var ga = fin(t, n84 + .3);
    if (ga > 0) { g.save(); g.globalAlpha *= ga; g.strokeStyle = CREAM; g.lineWidth = 5; g.setLineDash([16, 12]); g.lineDashOffset = -t * 30; g.beginPath(); g.moveTo(x0 + 90.4 * PX, y1 + bh / 2 + 10); g.lineTo(x0 + 90.4 * PX, y2 + bh / 2 + 10); g.stroke(); g.restore(); }
    stamp(g, 'FEWER', 510, 1190, t, at('but', 'million') - .2, S('end').t0 - SWIPE - .1, 76, ORG, -.06);
    block(g, ['ABOUT 84M · SOURCE: GTABOSS', 'COUNTS VARY: 74M TO 86M'], CX, 1350, 40, fin(t, tr2), true);
  }

  /* =====================================================================================================
     SCENE 7 · end: a balance weighs the two records; it swings, then loops back to the counter
     ===================================================================================================== */
  function card(g, x, y, col, title, big, sub, a) {
    if (a <= 0) return;
    g.save(); g.globalAlpha *= clamp(a, 0, 1); g.translate(x, y);
    rr(g, -165 + 8, -150 + 14, 330, 300, 24); g.fillStyle = 'rgba(0,0,0,.4)'; g.fill();
    rr(g, -165, -150, 330, 300, 24); g.fillStyle = PURP; g.fill(); g.strokeStyle = col; g.lineWidth = 7; g.stroke();
    g.fillStyle = col; g.textAlign = 'center'; g.textBaseline = 'middle'; font(g, 40, 700, MONO); ls(g, 2); g.fillText(title, 0, -96); ls(g, 0);
    font(g, 86, 900); g.fillStyle = CREAM; g.fillText(big, 0, -6);
    font(g, 38, 600, MONO); g.fillStyle = col; g.fillText(sub, 0, 90);
    g.restore();
  }
  function endScene(g, t) {
    var s0 = S('end').t0 - .25, o1 = at('end', 'one'), o2 = at('end', 'two'), cq = end('end') + .5;
    var th = -.17 * eo(seg(t, o1 - .1, o1 + .35)) + .34 * eo(seg(t, o2 - .1, o2 + .35));
    if (t > o2 + .5) th = .17 * Math.cos((t - o2 - .5) * 2.0) * Math.exp(-(t - o2 - .5) * .06);
    th += .05 * Math.sin(t * 7) * (1 - seg(t, s0, s0 + .6)) * seg(t, s0 - .2, s0);
    var px = CX, py = 690, L = 255, ex = Math.cos(th) * L, ey = Math.sin(th) * L, ia = fin(t, s0), cy0 = 1050;
    g.save(); g.globalAlpha *= ia;
    g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(px - 18 + 8, py + 14, 36, 590);
    g.fillStyle = TEAL; g.fillRect(px - 18, py, 36, 590);
    g.beginPath(); g.moveTo(px - 150, 1290); g.lineTo(px + 150, 1290); g.lineTo(px + 80, 1230); g.lineTo(px - 80, 1230); g.closePath(); g.fill();
    g.save(); g.translate(px, py); g.rotate(th); g.fillStyle = CREAM; g.fillRect(-L - 24, -14, 2 * L + 48, 28); g.restore();
    g.fillStyle = HOT; el(g, px, py, 36, 36);
    var lx = px - ex, ly = py - ey, rx = px + ex, ry = py + ey;
    g.strokeStyle = 'rgba(251,240,234,.7)'; g.lineWidth = 5;
    [[lx, ly, 255], [rx, ry, 765]].forEach(function (p) { var top = cy0 + (p[1] - py) - 150; g.beginPath(); g.moveTo(p[0], p[1]); g.lineTo(p[2] - 130, top); g.moveTo(p[0], p[1]); g.lineTo(p[2] + 130, top); g.stroke(); });
    g.restore();
    card(g, 255, cy0 + (ly - py), HOT, 'TRAILER 1', '90.4M', 'YOUTUBE', ia);
    card(g, 765, cy0 + (ry - py), TEAL, 'TRAILER 2', '475M', 'ALL PLATFORMS', ia);
    block(g, ['90.4M YOUTUBE', 'VS 475M ALL PLATFORMS'], CX, 1385, 44, fin(t, end('end') + .05), 'line', CREAM, 700);
    /* the question, held as a caption over the balance */
    var qa = fin(t, cq) * (1 - seg(t, HOME - .05, HOME + .2));
    if (qa > 0) {
      g.save(); g.globalAlpha *= qa; font(g, 74, 800); wide(g); g.textAlign = 'center'; g.textBaseline = 'alphabetic'; g.fillStyle = CREAM;
      g.fillText('WHICH RECORD', CX, 360);
      var w2 = g.measureText('IS BIGGER?').width; rr(g, CX - w2 / 2 - 14, 372, w2 + 28, 96, 16); g.fillStyle = HOT; g.fill(); g.fillStyle = BG; g.fillText('IS BIGGER?', CX, 448);
      g.restore();
    }
  }

  /* ---------- captions (the voice, word by word; the hook line is carried by the picture) ---------- */
  var CAPBRK = {};
  var CAPS = (function () {
    var out = [];
    VO.lines.forEach(function (l) {
      if (l.id === 'hook') return;
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
  var STRESS = [['first', 'early'], ['leak', 'leak'], ['leak', 'ahead'], ['num', 'million'], ['num', 'youtube'], ['guin', 'guinness'], ['guin', 'viewed'],
    ['mrb', 'beat'], ['mrb', '59'], ['two', 'two'], ['two', '2025'], ['claim', '475'], ['claim', 'platforms'], ['big', 'biggest'], ['big', 'time'],
    ['but', 'youtube'], ['but', '84'], ['less', 'fewer'], ['end', 'bigger'], ['end', 'one'], ['end', 'two']]
    .map(function (p) { return at(p[0], p[1], p[2]); });

  function stressed(w) { for (var i = 0; i < STRESS.length; i++) if (Math.abs(STRESS[i] - w.t0) < .02) return true; return false; }
  /* captions never draw over a cut */
  function wipeHide(t) {
    var a = 1; SC.forEach(function (sc) { if (sc.swipe) a = Math.min(a, 1 - seg(t, sc.t0 - SWIPE - .14, sc.t0 - SWIPE) * (1 - seg(t, sc.t0 + .02, sc.t0 + .14))); });
    return a;
  }
  var GLUE = { the: 1, a: 1, an: 1, your: 1, its: 1, of: 1, at: 1, to: 1, and: 1, in: 1, with: 1, on: 1, by: 1, so: 1 };
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
    var lh = cpx * 1.18, y0 = 380 - (lines.length - 1) * lh / 2;
    g.globalAlpha = fi * out * wipeHide(t) * (alpha == null ? 1 : alpha);
    lines.forEach(function (ln, li) {
      var x = CX - (lw[li] - gap) / 2, y = y0 + li * lh + (1 - Math.min(1, k)) * 40;
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
  var NOISE;
  var SKY = (function () { var r = mulberry(11), out = [], x = -10; while (x < W) { var w = 56 + r() * 60, h = 150 + r() * 190, win = []; for (var wy = 20; wy < h - 20; wy += 38) for (var wx = 12; wx < w - 22; wx += 26) if (r() > .55) win.push([wx, wy, r() > .8 ? 1 : 0]); out.push([x, w, h, win]); x += w + 4 + r() * 10; } return out; })();
  var SCENES = { count: countScene, leakday: leakdayScene, num: numScene, bars: barsScene, two: twoScene, split: splitScene, end: endScene };
  function stage(g) {
    g.fillStyle = BG; g.fillRect(0, 0, W, H);
    SKY.forEach(function (b) { g.fillStyle = '#140a33'; g.fillRect(b[0], 1830 - b[2], b[1], b[2] + 100); b[3].forEach(function (w) { g.fillStyle = w[2] ? 'rgba(255,138,61,.55)' : 'rgba(25,211,197,.28)'; g.fillRect(b[0] + w[0], 1830 - b[2] + w[1], 12, 18); }); });
    g.fillStyle = 'rgba(25,211,197,.35)'; g.fillRect(0, 1830, W, 4);
  }
  function sceneAt(t) { for (var i = SC.length - 1; i >= 0; i--) if (t >= SC[i].t0) return i; return 0; }
  function drawScene(g, Sc, t) {
    g.save();
    if (Sc.fn !== 'count' && Sc.fn !== 'end') { var push = 1 + .012 * seg(t, Sc.t0, Sc.t1); g.translate(CX, 1000); g.scale(push, push); g.translate(-CX, -1000); }
    SCENES[Sc.fn](g, t);
    g.restore();
  }
  /* the cut's edge: a slanted line with a slow wobble */
  function edgeY(x, ly, t) { return ly + (x - 540) * .10 + Math.sin(x * .02 + t * 6) * 3; }
  var POSTERMODE = false;
  function frame(g, t) {
    g.setTransform(1, 0, 0, 1, 0, 0);
    stage(g);
    var si = sceneAt(t), Sc = SC[si], Nx = SC[si + 1];
    var sk = Nx && Nx.swipe ? eio(seg(t, Nx.t0 - SWIPE, Nx.t0)) : 0;
    var pre = Sc.swipe && t < Sc.t0 + PRE;
    drawScene(g, Sc, pre ? Sc.t0 + PRE : t);
    if (sk > 0) {
      var ly = H * (1 - sk) - 70, x;
      g.save(); g.beginPath(); g.moveTo(0, H); for (x = 0; x <= W; x += 30) g.lineTo(x, edgeY(x, ly, t)); g.lineTo(W, H); g.closePath(); g.clip();
      stage(g); INCOMING = true; drawScene(g, Nx, Nx.t0 + PRE); INCOMING = false; g.restore();
      g.save(); g.lineJoin = 'round';
      [[HOT, 10, 0], [TEAL, 6, 16]].forEach(function (c) { g.strokeStyle = c[0]; g.lineWidth = c[1]; g.beginPath(); for (x = 0; x <= W; x += 30) { var yy = edgeY(x, ly, t) + c[2]; if (x === 0) g.moveTo(x, yy); else g.lineTo(x, yy); } g.stroke(); });
      g.restore();
    }
    var back = eio(seg(t, HOME, HOME + .35));
    if (back > 0) { g.save(); g.globalAlpha = back; stage(g); g.translate(CX, 1000); g.scale(lerp(.9, 1, back), lerp(.9, 1, back)); g.translate(-CX, -1000); countScene(g, 0); g.restore(); }
    if (POSTERMODE) posterTitle(g);
    else if (LIVE.text) { if (back > 0) captions(g, t, 1 - back); else captions(g, t); }
    if (!POSTERMODE) {
      g.fillStyle = 'rgba(251,240,234,.12)'; g.fillRect(90, 222, 840, 6);
      g.fillStyle = HOT; g.fillRect(90, 222, 840 * (back > 0 ? 1 - back : t / DUR), 6);
    }
    if (LIVE.grain && NOISE) { g.globalAlpha = .05; g.globalCompositeOperation = 'overlay'; var o = Math.floor(t * 24) * 37 % 256; g.fillStyle = g.createPattern(NOISE, 'repeat'); g.translate(-o, -o); g.fillRect(o, o, W, H); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }
  }
  function posterTitle(g) {
    g.save(); g.fillStyle = 'rgba(11,8,32,.9)'; g.fillRect(0, 250, W, 300); font(g, 96, 900); wide(g); g.textBaseline = 'alphabetic'; g.textAlign = 'center';
    g.fillStyle = CREAM; g.fillText('GTA 6 TRAILER', CX, 370);
    var b = 'VIEWS RECORDS', wb = g.measureText(b).width;
    g.fillStyle = HOT; g.beginPath(); g.roundRect(CX - wb / 2 - 16, 400 - 80, wb + 32, 118, 18); g.fill();
    g.fillStyle = BG; g.fillText(b, CX, 400 + 12); g.restore();
  }
  function TEXTS(t) {
    var out = [];
    function T(id, text, a, b) { if (t >= a && t < b) out.push({ id: id, text: text, x0: 0, y0: 0, x1: 0, y1: 0 }); }
    function cut(id) { return S(id).t0 - .2; }
    T('gta', 'GTA 6', 0, cut('leakday')); T('gta', 'GTA 6', HOME + .3, DUR + 1);
    T('views', 'VIEWS', 0, cut('leakday')); T('views', 'VIEWS', HOME + .3, DUR + 1);
    T('h24', 'IN 24 HOURS', 1.0, cut('leakday'));
    T('t1', 'TRAILER 1', at('first', 'trailer') + .1, cut('num'));
    T('plan', 'PLANNED 9 AM ET', S('leakday').t0 + .3, at('first', 'early') + .5);
    T('out', 'OUT DEC 4', at('first', 'early') + .6, cut('num'));
    T('leaked', 'LEAKED', at('leak', 'leak') + .15, cut('num'));
    T('src1', 'SOURCE: GUINNESS, CNN', at('first', 'trailer') + .4, cut('num'));
    T('views2', 'VIEWS', S('num').t0 + .15, cut('bars'));
    T('yt', 'YOUTUBE', at('num', 'youtube') + .1, cut('bars'));
    T('hrs', '24 HOURS', at('num', 'hours') + .1, cut('bars'));
    T('wr', 'WORLD RECORD', at('guin', 'guinness') + .2, cut('bars'));
    T('mv', 'MOST VIEWED GAME REVEAL', at('guin', 'official') + .25, cut('bars'));
    T('gw', 'GUINNESS, DEC 2023', at('guin', 'guinness') + .35, cut('bars'));
    T('b1', '90.4M', S('bars').t0 + PRE + .4, cut('two'));
    T('b2', '59.4M', at('mrb', 'even') + .45, cut('two'));
    T('b3', '+31M', at('mrb', 'beat') + .3, cut('two'));
    T('l1', 'TRAILER 1', S('bars').t0 + PRE + .25, cut('two'));
    T('l2', 'MRBEAST', S('bars').t0 + PRE + .25, cut('two'));
    T('t2', 'TRAILER 2', at('two', 'trailer') + .2, at('claim', 'reports') - .1);
    T('may', 'MAY 6, 2025', at('two', 'trailer') + .3, at('claim', 'reports') - .05);
    T('says', 'REPORTED CLAIM', at('claim', 'claimed') + .1, cut('split'));
    T('h24b', 'IN 24 HOURS', at('claim', 'hours') + .1, cut('split'));
    T('allp', 'ALL PLATFORMS', at('claim', 'all') + .1, cut('split'));
    T('quote', '“THE BIGGEST VIDEO LAUNCH', at('claim', 'platforms') + .2, cut('split'));
    T('cl', 'ROCKSTAR’S CLAIM', at('claim', 'platforms') + .25, cut('split'));
    T('hr', 'REPORTED BY THE HOLLYWOOD REPORTER', at('claim', 'platforms') + .3, cut('split'));
    T('ytb', 'TRAILER 2 · YOUTUBE ONLY', at('but', 'trailer') - .05, cut('end'));
    T('t1y', 'TRAILER 1 · YOUTUBE', S('split').t0 + PRE - .2, cut('end'));
    T('few', 'FEWER', at('but', 'million') - .05, cut('end'));
    T('vary', 'ABOUT 84M · SOURCE: GTABOSS', at('but', 'trailer') + .1, cut('end'));
    T('vary2', 'COUNTS VARY: 74M TO 86M', at('but', 'trailer') + .1, cut('end'));
    T('which', 'WHICH RECORD IS BIGGER?', end('end') + .5, HOME - .2);
    T('held1', '90.4M YOUTUBE', end('end') + .1, HOME - .2);
    T('held2', 'VS 475M ALL PLATFORMS', end('end') + .1, HOME - .2);
    T('c1', 'TRAILER 1', S('end').t0 + PRE + .1, HOME - .2);
    T('c2', 'TRAILER 2', S('end').t0 + PRE + .1, HOME - .2);
    return out;
  }

  /* ---------- events: the sound design reads the same word times; hits sit between words, never on them ---------- */
  var EV = [], ALLW = [];
  VO.lines.forEach(function (l) { l.words.forEach(function (w) { ALLW.push(w); }); });
  /* a hit that would land inside a spoken word moves to just before that word starts */
  /* a hit's whole body (t … t + body) must sit in a real gap between words: loop until it does. Before the word if the
     gap there holds it, else just after the word ends. */
  var BODY = { ding: .05, stamp: .2, stampS: .14, slap: .16, clack: .16, thump: .2, rip: .2, scratch: .2, paper: .14, peel: .2, swish: .14 };
  function gapT(t, body) {
    for (var guard = 0; guard < 40; guard++) {
      var hit = -1;
      for (var i = 0; i < ALLW.length; i++) { var w = ALLW[i]; if (t < w.t1 + .01 && t + body > w.t0 - .03) { hit = i; break; } }
      if (hit < 0) return t;
      var wd = ALLW[hit], prevEnd = hit > 0 ? ALLW[hit - 1].t1 : -1, before = wd.t0 - .03 - body;
      t = (before >= prevEnd + .01 && before >= 0) ? before : wd.t1 + .02;
    }
    return t;
  }
  function E(o) { var d = o.t1 ? o.t1 - o.t : 0; o.t = gapT(o.t, BODY[o.type] || (o.t1 ? .08 : .12)); if (o.t1) o.t1 = Math.max(o.t1, o.t + Math.max(.15, d)); EV.push(o); }
  function initTimes() {
    var i;
    /* hook: the wheels tick down as the number climbs; the ring closes on "day" */
    var tm = wend('hook', 'million');
    for (i = 0; i < 14; i++) E({ t: .06 + i * (tm - .1) / 14, type: 'tick', g: .1 + .1 * (1 - i / 14) });
    E({ t: tm + .02, type: 'thump', g: .4 }); E({ t: at('hook', 'one') - .05, type: 'pop', g: .7 });
    E({ t: wend('hook', 'day') - .1, type: 'stamp' });
    SC.forEach(function (sc) { if (sc.swipe) E({ t: sc.t0 - SWIPE, type: 'tear', t1: sc.t0 }); });
    /* first + leak */
    E({ t: at('first', 'trailer') - .1, type: 'slap' }); E({ t: at('first', 'early') - .1, type: 'swish' }); E({ t: at('first', 'early') + .4, type: 'pop', g: .6 });
    E({ t: S('leakday').t0 + .1, type: 'slap' }); E({ t: at('first', 'early') + .35, type: 'rip' }); E({ t: at('leak', 'post') - .05, type: 'pop', g: .7 }); E({ t: at('leak', 'ahead') - .05, type: 'slap' }); E({ t: at('leak', 'schedule') - .02, type: 'tick', g: .4 });
    E({ t: at('leak', 'leak') - .1, type: 'pop', g: .7 }); E({ t: at('leak', 'leak') + .05, type: 'stamp' }); 
    /* num + guin */
    var a0 = at('num', 'over'), a1 = wend('num', 'million') + .15;
    for (i = 0; i < 14; i++) E({ t: a0 + i * (a1 - a0) / 14, type: 'tick', g: .1 + .08 * (i / 14) });
    E({ t: a1, type: 'thump', g: .35 }); E({ t: at('num', 'youtube') - .12, type: 'pop', g: .7 }); E({ t: at('num', 'hours') - .12, type: 'pop', g: .8 });
    E({ t: wend('guin', 'guinness') + .02, type: 'ding' }); E({ t: wend('guin', 'guinness') + .02, type: 'stamp' }); E({ t: at('guin', 'viewed') - .1, type: 'paper' });
    /* bars */
    E({ t: S('bars').t0 + PRE, type: 'rise', t1: S('bars').t0 + PRE + .5 }); E({ t: at('mrb', 'even') - .06, type: 'rise', t1: at('mrb', 'even') + .45 });
    E({ t: at('mrb', '59') - .08, type: 'pop', g: .7 }); E({ t: at('mrb', 'beat') + .28, type: 'slap' });
    /* two: 475 */
    E({ t: at('two', 'trailer') - .15, type: 'slap' }); E({ t: at('two', 'may') - .1, type: 'pop', g: .7 });
    var n0 = at('claim', '475') - .25;
    for (i = 0; i < 12; i++) E({ t: n0 + i * .06, type: 'tick', g: .1 + .08 * (i / 12) });
    E({ t: at('claim', 'claimed') - .1, type: 'paper' }); E({ t: at('claim', 'hours') - .1, type: 'pop', g: .6 }); E({ t: at('claim', 'all') - .1, type: 'slap' });
    E({ t: at('big', 'biggest') - .15, type: 'stamp' });
    /* split */
    E({ t: S('split').t0 + PRE, type: 'rise', t1: S('split').t0 + PRE + .45 }); E({ t: at('but', 'youtube') - .08, type: 'clack' });
    E({ t: at('but', '84') - .1, type: 'slap' }); E({ t: at('but', 'alone') - .05, type: 'rise', t1: at('but', 'alone') + .4 }); E({ t: at('but', 'million') - .2, type: 'stamp' });
    /* end */
    E({ t: S('end').t0 + PRE, type: 'paper' }); E({ t: at('end', 'one') - .06, type: 'clack' }); E({ t: at('end', 'two') - .06, type: 'clack' });
    E({ t: HOME - .55, type: 'rise', t1: HOME + .05 }); E({ t: HOME + .05, type: 'peel', g: .6 });
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
    var hp = ac.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 38;
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

    function tickS(t, g) { var o = bus(1, .05), bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 4200; bp.Q.value = 6; var n = noise(t, .03); n.connect(bp); bp.connect(o); env(o.gain, [[t, 0], [t + .001, g || .22], [t + .025, 0]]); }
    function thump(t, g) { var o = osc('sine', 150, t, t + .3, 1, [[t, 0], [t + .004, g || .4], [t + .26, 0]], .1); o.frequency.exponentialRampToValueAtTime(50, t + .18); }
    function band(t0, t1, f0, f1, g0, g1, q, pan) { var o = bus(1, .1, pan), bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = q || .7; var n = noise(t0, t1 - t0 + .1); n.connect(bp); bp.connect(o); env(bp.frequency, [[t0, f0], [t1, f1]]); env(o.gain, [[t0, 0], [t0 + (t1 - t0) * .4, g0], [t1 - .02, g1], [t1, 0]]); }
    function swish(t) { band(t - .12, t + .14, 900, 5200, .12, .02, 1.6); }
    function stampShort(t, g) { var o = osc('sine', 150, t, t + .16, 1, [[t, 0], [t + .004, g || .4], [t + .14, 0]], .05); o.frequency.exponentialRampToValueAtTime(60, t + .12); tickS(t + .005, .14); }
    function stampS(t, big) { thump(t, big ? .6 : .45); var n = noise(t, .16), bp = ac.createBiquadFilter(); bp.type = 'lowpass'; bp.frequency.value = 1500; var o = bus(1, .2); n.connect(bp); bp.connect(o); env(o.gain, [[t, 0], [t + .004, big ? .42 : .32], [t + .12, 0]]); tickS(t + .005, .18); }
    function paper(t, g) { g = g || 1; band(t - .03, t + .12, 1800, 3800, .07 * g, .02, 1.2, (rnd() - .5) * .8); tickS(t + .1, .08 * g); }
    function popS(t, g) { var o = osc('sine', 300, t, t + .12, 1, [[t, 0], [t + .004, .14 * (g || 1)], [t + .1, 0]], .15); o.frequency.exponentialRampToValueAtTime(900, t + .08); }
    function rise(t, t1) { band(t, t1, 400, 1800, .03, .06, 3); }
    function clack(t) { thump(t, .5); tickS(t, .4); tickS(t + .045, .25); }
    function slap(t) { thump(t, .45); var n = noise(t, .1), bp = ac.createBiquadFilter(); bp.type = 'highpass'; bp.frequency.value = 900; var o = bus(1, .15); n.connect(bp); bp.connect(o); env(o.gain, [[t, 0], [t + .003, .3], [t + .08, 0]]); }
    function key(t) { tickS(t, .25); osc('sine', 1900, t, t + .03, 1, [[t, 0], [t + .002, .03], [t + .025, 0]]); }
    /* a paper peel: a short rising rasp */
    function peel(t, g) { g = g || 1; band(t, t + .28, 1200, 3400, .05 * g, .02 * g, 2.2, .2); }
    /* a tear: a gritty band rising with the edge */
    function tearS(t, t1) { band(t, t1 + .03, 700, 2600, .06, .05, 1.8); for (var j = 0; j < 5; j++) tickS(t + (t1 - t) * (j + .5) / 5, .07); }
    function rip(t) { band(t - .02, t + .2, 2500, 900, .14, .04, 1.4); tickS(t, .2); tickS(t + .06, .14); }
    /* the reader bar: a soft scanning tone, a slow sweep down */
    function scan(t, t1) { osc('sine', 880, t, t1 + .05, 1, [[t, 0], [t + .04, .025], [t1 - .03, .02], [t1 + .05, 0]], .2).frequency.exponentialRampToValueAtTime(440, t1); }
    function ding(t) { [[1319, .16], [1976, .1], [2637, .05]].forEach(function (p) { osc('sine', p[0], t, t + .9, 1, [[t, 0], [t + .004, p[1]], [t + .9, 0]], .3); }); thump(t, .5); }
    function scratch(t) { band(t, t + .22, 2600, 1800, .08, .03, 2.5, -.2); }
    EV.forEach(function (e) {
      if (e.type === 'tick') tickS(e.t, e.g);
      else if (e.type === 'thump') thump(e.t, e.g);
      else if (e.type === 'swish') swish(e.t);
      else if (e.type === 'stamp') stampS(e.t, e.big);
      else if (e.type === 'stampS') stampShort(e.t, e.g);
      else if (e.type === 'paper') paper(e.t, e.g);
      else if (e.type === 'pop') popS(e.t, e.g);
      else if (e.type === 'rise') rise(e.t, e.t1);
      else if (e.type === 'clack') clack(e.t);
      else if (e.type === 'slap') slap(e.t);
      else if (e.type === 'key') key(e.t);
      else if (e.type === 'peel') peel(e.t, e.g);
      else if (e.type === 'tear') tearS(e.t, e.t1);
      else if (e.type === 'rip') rip(e.t);
      else if (e.type === 'scan') scan(e.t, e.t1);
      else if (e.type === 'scratch') scratch(e.t);
      else if (e.type === 'ding') ding(e.t);
    });
    /* no music: Isac adds a trending TikTok sound on the platform; the film ships voice + sound effects */
    var MUSIC = false;
    if (MUSIC) { /* intentionally empty */ }
    env(master.gain, [[0, .9], [DUR - .3, .9], [DUR, .6]]);
    /* room tone, about −50 dB, so the loop seam is never digital zero */
    (function () { var o = bus(1, 0), lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900; lp.Q.value = .5;
      var n = noise(0, DUR); n.connect(lp); lp.connect(o); o.gain.value = .021; })();
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
    var fonts = ['900 84px Archivo', '800 84px Archivo', '700 46px Archivo', '600 46px Archivo', '500 30px "Geist Mono"', '600 30px "Geist Mono"', '700 30px "Geist Mono"'];
    return Promise.all(fonts.map(function (f) { return document.fonts.load(f, 'Aa0%°×−≈≠µ“”·→…#?‹'); })).then(function () { return document.fonts.ready; }).then(function () {
      STEX = {};
      window.READY = true;
    });
  }

  initTimes();
  window.FILM = { bare: function () { ctx.setTransform(1, 0, 0, 1, 0, 0); stage(ctx); }, W: W, H: H, DUR: DUR, POSTER: at('guin', 'viewed') + .6, SLUG: 'gta-records', SHOTS: SHOTS, init: init, render: render, frame: frame, LIVE: LIVE };
  window.BOUNDS_RUN = function (step) {
    BOUNDS = []; var out = {};
    for (var t = 0; t <= DUR + 1e-6; t += step || 1 / 15) { CURT = t; POSTERMODE = false; frame(ctx, t); }
    BOUNDS.forEach(function (b) { var o = out[b.text] || (out[b.text] = { text: b.text, from: b.t, to: b.t, x0: b.x0, x1: b.x1, y1: b.y1, n: 0 }); o.to = b.t; o.n++; o.x0 = Math.min(o.x0, b.x0); o.x1 = Math.max(o.x1, b.x1); o.y1 = Math.max(o.y1, b.y1); });
    BOUNDS = null; return Object.keys(out).map(function (k) { return out[k]; });
  };
  window.DUR = DUR; window.EV = EV; window.TEXTS = TEXTS; window.SCORE = SCORE; window.READY = false;
  window.render = function (t, s, sh, fps) { render(t, s, sh, fps); };
})();
