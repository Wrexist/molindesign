/* "GTA 6 has a fridge menu": Delta, "It has X, shown" Short (slug gta-fridge). Sources in BRIEF.md.
   Rockstar's An Extended Look (Aug 27 2026, "captured entirely from in-game footage on the PlayStation 5"), 7:15-7:23:
   a FRIDGE button prompt, then a selection list over the shelves (LOGGER BEER, LAVAZAS BEER, BLITZ BERRY SMOOTHIE,
   BLITZ GREEN SMOOTHIE, PROTEIN SHAKE; two icons on the smoothie and shake rows only), a FLEECA BANK magnet on the
   door, and with a bottle in hand DRINK (R1) / DROP. Footage (all An Extended Look, muted, each use under 5 s):
   435.5-436.85, 438.45-438.9, 438.95-439.38, 439.45-440.07, 442.85-443.11; plates 430-434, 437.35-438.45, 440.8-442.8.
   Nothing from 443.5 s on (an in-game TV is on screen from about 443.6 s: SAFE-EDIT Never). Pure function of t.
   Contract: window.FILM, DUR, render(t), READY, EV, TEXTS(t), SCORE(ctx). Engine from gta-trunkstream. */
(function () {
  'use strict';
  var W = 1080, H = 1920, VO = window.VO, DUR = VO.dur, CX = 510;
  var INK = '#1d0e1f', CREAM = '#fbf3e4', RED = '#e0303a', PINK = '#e6337a', SUN = '#ffc94a';
  var DISP = 'Archivo', MONO = '"Geist Mono"';
  var BX0 = 90, BX1 = 930, BY1 = 1430, TAU = Math.PI * 2;

  /* ---------- math ---------- */
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, k) { return a + (b - a) * k; }
  function seg(t, a, b) { return clamp((t - a) / (b - a), 0, 1); }
  function eo(k) { return k >= 1 ? 1 : 1 - Math.pow(2, -10 * k); }
  function eio(k) { return k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; }
  function mulberry(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function cd(t, a, w) { if (t <= a) return 0; var u = (t - a) * (w || 14); return 1 - (1 + u) * Math.exp(-u); }
  function kn(t, a, amt) { if (t < a) return 1; var u = t - a; return 1 + (amt || .08) * (1 - Math.exp(-u * 40)) * Math.exp(-u * 7); }
  function bump(t, a, d) { return Math.sin(Math.PI * seg(t, a, a + d)); }
  function osc(t, k, ph) { return Math.sin(TAU * k * t / DUR + (ph || 0)); }

  /* ---------- the voice is the timeline ---------- */
  var LINE = {}, ORDER = []; VO.lines.forEach(function (l) { LINE[l.id] = l; ORDER.push(l.id); });
  function norm(w) { return w.toLowerCase().replace(/[^a-z0-9%]/g, ''); }
  function find(id, word, nth) {
    var l = LINE[id], n = nth || 0; if (typeof word === 'number') return l.words[word];
    for (var i = 0; i < l.words.length; i++) if (norm(l.words[i].w).indexOf(norm(word)) === 0 && n-- === 0) return l.words[i];
    throw new Error('no word "' + word + '" in line ' + id);
  }
  function at(id, word, nth) { return find(id, word, nth).t0; }
  function start(id) { return LINE[id].t0; }
  function lastw(id) { var w = LINE[id].words; return w[w.length - 1].t1; }

  /* ---------- the SFX gate: hits sit in pauses (vo/vad.js) ---------- */
  var EDGES = [], VOICED = [];
  if (window.VAD) window.VAD.forEach(function (v) { VOICED.push({ t0: v[0], t1: v[1] }); EDGES.push(v[0], v[1]); });
  else VO.lines.forEach(function (l) { l.words.forEach(function (w) { VOICED.push({ t0: w.t0, t1: w.t1 }); EDGES.push(w.t0, w.t1); }); });
  function free(m) {
    var B = [], M = [], F = [], p = 0;
    EDGES.forEach(function (e) { B.push([e - m, e + m]); });
    VOICED.forEach(function (v) { B.push([v.t0 - .03, v.t1 + .03]); });
    B.sort(function (x, y) { return x[0] - y[0]; });
    B.forEach(function (b) { var L = M[M.length - 1]; if (L && b[0] <= L[1]) L[1] = Math.max(L[1], b[1]); else M.push(b.slice()); });
    M.forEach(function (b) { if (b[0] > p) F.push([p, b[0]]); p = Math.max(p, b[1]); });
    F.push([p, DUR + 9]); return F;
  }
  var BODY = { slap: .1, tock: .06, pop: .1, door: .2, seal: .3, ctick: .05, clink: .3 };
  function nearGap(t, type, m) {
    var bd = BODY[type] || .12, best = null;
    free(m || .12).forEach(function (f) { var lo = f[0], hi = f[1] - bd; if (hi < lo) return; var c = clamp(t, lo, hi); if (best === null || Math.abs(c - t) < Math.abs(best - t)) best = c; });
    return best;
  }
  var GT = {}, EV = [];
  /* a hit: snapped into the nearest pause within tol; the picture keeps its own time (the hit is sound only) */
  function G(id, t, type, tol, gain) {
    var n = nearGap(t, type);
    if (n !== null && Math.abs(n - t) <= (tol == null ? .3 : tol)) { GT[id] = n; EV.push({ t: n, type: type, g: gain == null ? 1 : gain, id: id }); }
    else GT[id] = t;
    return t;
  }

  /* ---------- canvas + safe-area check ---------- */
  var cv, ctx, tmp, tctx, acc, actx, LIVE = { grain: true, text: true }, LIVE2 = { bg: true, clip: true };
  function mk(w, h) { var c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; }
  var BOUNDS = null, NOREC = false, CURT = 0, SAFE = { x0: 90, x1: 930, y1: 1450 };
  function recBox(g, x0, y0, x1, y1, text) {
    if (!BOUNDS || NOREC || (g !== ctx && g !== tctx) || g.globalAlpha < .05) return;
    var m = g.getTransform(), xs = [], ys = [];
    [[x0, y0], [x1, y0], [x0, y1], [x1, y1]].forEach(function (p) { xs.push(m.a * p[0] + m.c * p[1] + m.e); ys.push(m.b * p[0] + m.d * p[1] + m.f); });
    var a = Math.min.apply(null, xs), b = Math.max.apply(null, xs), c = Math.max.apply(null, ys), d = Math.min.apply(null, ys);
    if (d > BY1 || b < SAFE.x0 || a > SAFE.x1) return;
    if (a < SAFE.x0 - .5 || b > SAFE.x1 + .5 || c > SAFE.y1 + .5) BOUNDS.push({ t: CURT, text: text, x0: Math.round(a), x1: Math.round(b), y1: Math.round(c) });
  }
  function watch(g) {
    var orig = g.fillText;
    g.fillText = function (str, x, y) {
      if (BOUNDS) { var mm = this.measureText(str); recBox(this, x - mm.actualBoundingBoxLeft, y - mm.actualBoundingBoxAscent, x + mm.actualBoundingBoxRight, y + mm.actualBoundingBoxDescent, str); }
      return orig.apply(this, arguments);
    };
  }

  /* ---------- type ---------- */
  function cond(g, st) { g.__st = st || 'extra-condensed'; try { g.fontStretch = g.__st; } catch (e) {} }
  function unst(g) { g.__st = null; try { g.fontStretch = 'normal'; } catch (e) {} }
  function font(g, px, wt, fam) { g.font = (wt || 900) + ' ' + px + 'px ' + (fam || DISP); if (g.__st) try { g.fontStretch = g.__st; } catch (e) {} }
  function ls(g, px) { try { g.letterSpacing = px + 'px'; } catch (e) {} }
  function rr(g, x, y, w, h, r) { g.beginPath(); g.roundRect(x, y, w, h, Math.max(0, Math.min(r, w / 2, h / 2))); }
  /* condensed display text; returns its width. o: align, col, st, wt, ls, max (shrinks to fit, never under 36 px) */
  function T2(g, s, x, y, px, o) {
    o = o || {}; px = Math.max(36, px);
    g.save(); cond(g, o.st || 'condensed'); font(g, px, o.wt || 900); ls(g, o.ls == null ? 1 : o.ls);
    if (o.max) while (g.measureText(s).width > o.max && px > 36) { px -= 2; font(g, px, o.wt || 900); }
    g.textAlign = o.align || 'center'; g.textBaseline = 'middle'; g.fillStyle = o.col || CREAM;
    if (o.a != null) g.globalAlpha *= clamp(o.a, 0, 1);
    g.fillText(s, x, y + px * .04); var w = g.measureText(s).width; g.restore(); unst(g); return w;
  }
  function M2(g, s, x, y, px, o) {
    o = o || {}; g.save(); font(g, Math.max(30, px), o.wt || 700, MONO); ls(g, o.ls == null ? 2 : o.ls);
    g.textAlign = o.align || 'left'; g.textBaseline = 'middle'; g.fillStyle = o.col || CREAM; g.fillText(s, x, y); var w = g.measureText(s).width; g.restore(); return w;
  }
  function tw(s, px, st, wt) { var m = mk(4, 4).getContext('2d'); cond(m, st || 'condensed'); font(m, px, wt || 900); ls(m, 1); var w = m.measureText(s).width; unst(m); return w; }
  function chip(g, s, x, y, px, bg, fg, o) {
    o = o || {}; var w = tw(s, px) + px * .8, h = px * 1.3;
    g.save(); if (o.rot) { g.translate(x, y); g.rotate(o.rot); g.translate(-x, -y); }
    rr(g, x - w / 2 + 5, y - h / 2 + 7, w, h, 10); g.fillStyle = 'rgba(0,0,0,.35)'; g.fill();
    rr(g, x - w / 2, y - h / 2, w, h, 10); g.fillStyle = bg; g.fill();
    T2(g, s, x, y, px, { col: fg }); g.restore(); return w;
  }

  /* =====================================================================================================
     THE SET: deep berry ink, the apartment's pink as the accent. The footage is the hero: one big framed card per
     beat (Rockstar's own frames, muted, credited), our marks on top (sun rings, cream stickers), our RE-TYPED list
     beside it in big type. Native move: the FRIDGE DOOR, a cream door hinged on the right that swings shut across
     the frame and open again on the next beat. The only drawn object is a fridge (open beat).
     ===================================================================================================== */
  var CARD0 = { x: 100, y: 540, w: 820, h: 860 }, CARDW = { x: 100, y: 520, w: 820, h: 820 }, CARDB = { x: 100, y: 470, w: 820, h: 470 }, CARDD = { x: 100, y: 540, w: 820, h: 600 };
  var T = {}, U = {}, BG, NOISE, WIPES = [];
  var DOORC = '#efe8dc', BERRY = '#2a1430', TEAL = '#5fe3cf', VIOLET = '#9a86f2', ROSE = '#e99aaa', AMBER = '#f0a83a';

  function buildBG() {
    var c = mk(W, H), g = c.getContext('2d'), r = mulberry(23);
    var gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#2a1230'); gr.addColorStop(.55, '#1c0c22'); gr.addColorStop(1, '#100714'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    var a = g.createRadialGradient(200, 380, 10, 200, 380, 720); a.addColorStop(0, 'rgba(230,51,122,.22)'); a.addColorStop(1, 'rgba(230,51,122,0)'); g.fillStyle = a; g.fillRect(0, 0, W, H);
    var b = g.createRadialGradient(900, 1320, 10, 900, 1320, 760); b.addColorStop(0, 'rgba(120,220,255,.12)'); b.addColorStop(1, 'rgba(120,220,255,0)'); g.fillStyle = b; g.fillRect(0, 0, W, H);
    /* kitchen tile, very faint */
    g.strokeStyle = 'rgba(255,255,255,.025)'; g.lineWidth = 2; for (var x = 0; x <= W; x += 90) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); } for (var y = 0; y <= H; y += 90) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
    for (var k = 0; k < 5000; k++) { g.fillStyle = r() < .5 ? 'rgba(255,255,255,.02)' : 'rgba(0,0,0,.07)'; g.fillRect(r() * W, r() * H, 1 + r() * 2, 1 + r() * 2); }
    var vg = g.createRadialGradient(510, 900, 300, 510, 900, 1250); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.55)'); g.fillStyle = vg; g.fillRect(0, 0, W, H);
    return c;
  }
  function disc(g, x, y, r, c) { g.beginPath(); g.arc(x, y, r, 0, TAU); g.fillStyle = c; g.fill(); }

  /* ---------- the footage card: a framed picture, our credit chip inside it ---------- */
  function card(g, box, t, u, o) {
    o = o || {};
    var X = box.x, Y = box.y, w = box.w, h = box.h;
    g.save(); if (o.rot) { g.translate(X + w / 2, Y + h / 2); g.rotate(o.rot); g.translate(-X - w / 2, -Y - h / 2); }
    rr(g, X + 10, Y + 16, w, h, 22); g.fillStyle = 'rgba(0,0,0,.5)'; g.fill();
    rr(g, X - 8, Y - 8, w + 16, h + 16, 26); g.fillStyle = DOORC; g.fill();
    g.save(); rr(g, X, Y, w, h, 18); g.clip(); g.fillStyle = '#050309'; g.fillRect(X, Y, w, h);
    var tt = Math.min(t, u.t1 - 1e-3);
    g.filter = 'brightness(1.06) contrast(1.05) saturate(1.06)'; CLIP.draw(g, tt, X, Y, w, h, u); g.filter = 'none';
    if (o.after) o.after(g, X, Y, w, h, tt);
    CLIP.credit(g, u, X + 22, Y + h - 22, '700 30px "Geist Mono", monospace');
    g.restore(); g.restore();
  }
  function ring(g, x, y, r, k, col) {
    if (k <= 0) return; g.save(); g.strokeStyle = col || SUN; g.lineWidth = 9; g.lineCap = 'round';
    g.beginPath(); g.arc(x, y, r * (1 + .25 * (1 - eo(k))), -Math.PI / 2, -Math.PI / 2 + TAU * eo(k)); g.stroke(); g.restore();
  }
  /* a rounded-rect ring drawn on like a pen stroke (for the list) */
  function boxRing(g, x, y, w, h, k, col) {
    if (k <= 0) return; var e = eo(k), r = 30, P = 2 * (w + h);
    g.save(); g.strokeStyle = col || SUN; g.lineWidth = 9; g.lineCap = 'round'; g.setLineDash([P * e, P]); rr(g, x - w / 2, y - h / 2, w, h, r); g.stroke(); g.restore();
  }
  function srcAt(u, t) { var l = t - u.t0; if (u.freeze != null) l = Math.min(l, u.freeze); return u.from + l * u.speed; }
  function track(u, t, pts) {
    var s = srcAt(u, t), i = 0; while (i < pts.length - 2 && s > pts[i + 1][0]) i++;
    var a = pts[i], b = pts[Math.min(i + 1, pts.length - 1)], k = b[0] === a[0] ? 0 : clamp((s - a[0]) / (b[0] - a[0]), 0, 1);
    return [lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
  }
  /* cream sticker with an optional leader line to what it reads */
  function sticker(g, s, x, y, px, k, lx, ly, o) {
    if (k <= 0) return; o = o || {}; var nr = NOREC; NOREC = nr || k < .999;
    g.save(); g.globalAlpha *= clamp(k * 3, 0, 1);
    if (lx != null) { g.strokeStyle = CREAM; g.lineWidth = 6; g.beginPath(); g.moveTo(x, y); g.lineTo(lerp(x, lx, eo(k)), lerp(y, ly, eo(k))); g.stroke(); disc(g, lx, ly, 9 * eo(k), CREAM); }
    g.translate(x, y); var s2 = lerp(1.3, 1, eo(k)) * (o.knock ? kn(o.t, o.knock, .1) : 1); g.scale(s2, s2); chip(g, s, 0, 0, px, o.bg || CREAM, o.fg || INK, { rot: o.rot == null ? -.03 : o.rot }); g.restore(); NOREC = nr;
  }
  /* the list rail's ✕ glyph, as on Rockstar's list (white ring, cross) */
  function xGlyph(g, x, y, r, col) { g.save(); g.strokeStyle = col || '#fff'; g.lineWidth = r * .22; g.beginPath(); g.arc(x, y, r, 0, TAU); g.stroke(); g.lineCap = 'round'; var d = r * .42; g.beginPath(); g.moveTo(x - d, y - d); g.lineTo(x + d, y + d); g.moveTo(x + d, y - d); g.lineTo(x - d, y + d); g.stroke(); g.restore(); }
  function triGlyph(g, x, y, r, col) { g.save(); g.strokeStyle = col || INK; g.lineWidth = r * .2; g.beginPath(); g.arc(x, y, r, 0, TAU); g.stroke(); g.lineJoin = 'round'; var d = r * .5; g.beginPath(); g.moveTo(x, y - d); g.lineTo(x + d * .95, y + d * .65); g.lineTo(x - d * .95, y + d * .65); g.closePath(); g.stroke(); g.restore(); }
  function circGlyph(g, x, y, r, col) { g.save(); g.strokeStyle = col || INK; g.lineWidth = r * .2; g.beginPath(); g.arc(x, y, r, 0, TAU); g.stroke(); g.beginPath(); g.arc(x, y, r * .45, 0, TAU); g.stroke(); g.restore(); }
  /* our redraws of the two list icons (green-ringed bolt, purple-ringed eye), as seen at 7:18 */
  /* the list's icons, drawn in the source's colours (sampled at 439.25 s): teal-ringed bolt, violet-ringed eye;
     the shake row's first icon is a rose-ringed one with two round lobes (cut off by the list's fade at 439.27-439.30 s) */
  function boltIcon(g, x, y, r) {
    g.save(); disc(g, x, y, r, '#13262a'); g.strokeStyle = TEAL; g.lineWidth = r * .14; g.beginPath(); g.arc(x, y, r * .9, 0, TAU); g.stroke();
    g.fillStyle = TEAL; g.beginPath(); g.moveTo(x + r * .12, y - r * .62); g.lineTo(x - r * .34, y + r * .08); g.lineTo(x - r * .02, y + r * .08); g.lineTo(x - r * .14, y + r * .62); g.lineTo(x + r * .34, y - r * .1); g.lineTo(x + r * .02, y - r * .1); g.closePath(); g.fill(); g.restore();
  }
  function eyeIcon(g, x, y, r) {
    g.save(); disc(g, x, y, r, '#1d1630'); g.strokeStyle = VIOLET; g.lineWidth = r * .14; g.beginPath(); g.arc(x, y, r * .9, 0, TAU); g.stroke();
    g.lineWidth = r * .12; g.beginPath(); g.moveTo(x - r * .6, y); g.quadraticCurveTo(x, y - r * .62, x + r * .6, y); g.quadraticCurveTo(x, y + r * .62, x - r * .6, y); g.closePath(); g.stroke();
    disc(g, x, y, r * .2, VIOLET); g.restore();
  }
  function roseIcon(g, x, y, r) {
    g.save(); disc(g, x, y, r, '#2a1a20'); g.strokeStyle = ROSE; g.lineWidth = r * .14; g.beginPath(); g.arc(x, y, r * .9, 0, TAU); g.stroke();
    disc(g, x - r * .26, y + r * .02, r * .3, '#b98c94'); disc(g, x + r * .26, y + r * .02, r * .3, '#b98c94'); g.restore();
  }
  var ICONSET = { be: [boltIcon, eyeIcon], rb: [roseIcon, boltIcon] };

  /* ---------- the fridge door wipe (native move): a cream door hinged on the right swings shut, then open ---------- */
  function doorWipe(g, t) {
    for (var i = 0; i < WIPES.length; i++) {
      var c = WIPES[i], cover = 0;
      if (t >= c - .26 && t < c) cover = eio(seg(t, c - .26, c));
      else if (t >= c && t < c + .3) cover = 1 - eio(seg(t, c, c + .3));
      if (cover <= 0) continue;
      var x0 = W - W * cover;
      g.save();
      var sh = g.createLinearGradient(x0 - 90, 0, x0, 0); sh.addColorStop(0, 'rgba(0,0,0,0)'); sh.addColorStop(1, 'rgba(0,0,0,.45)'); g.fillStyle = sh; g.fillRect(x0 - 90, 0, 90, H);
      g.fillStyle = 'rgba(255,246,220,.9)'; g.fillRect(x0 - 8, 0, 6, H); /* light through the gap */
      g.fillStyle = DOORC; g.fillRect(x0, 0, W - x0 + 2, H);
      g.fillStyle = '#d8cfc0'; g.fillRect(x0, 0, 22, H);
      g.fillStyle = '#9a9184'; g.fillRect(x0 + 22, 0, 10, H); g.fillStyle = '#bfb6a7'; g.fillRect(x0 + 32, 0, 6, H); /* gasket */
      var hs = g.createLinearGradient(W - 40, 0, W, 0); hs.addColorStop(0, 'rgba(0,0,0,0)'); hs.addColorStop(1, 'rgba(40,25,20,.55)'); g.fillStyle = hs; g.fillRect(W - 40, 0, 40, H); /* hinge-edge shadow */
      g.fillStyle = '#e3dacb'; g.fillRect(x0, 760, W - x0 + 2, 10);
      rr(g, x0 + 70, 860, 26, 520, 13); g.fillStyle = '#a49c90'; g.fill();
      rr(g, x0 + 70, 420, 26, 260, 13); g.fill();
      /* a few magnets ride on the door */
      g.save(); g.translate(x0 + 300, 1000); g.rotate(-.06); g.fillStyle = '#f4a6c8'; g.fillRect(-80, -80, 160, 160); g.restore();
      g.save(); g.translate(x0 + 560, 1180); g.rotate(.05); g.fillStyle = '#f7e36a'; g.fillRect(-70, -70, 140, 140); g.restore();
      disc(g, x0 + 640, 560, 70, '#fff'); g.strokeStyle = '#2e9b4e'; g.lineWidth = 12; g.beginPath(); g.arc(x0 + 640, 560, 60, 0, TAU); g.stroke();
      g.restore();
    }
  }
  function wiping(t) { for (var i = 0; i < WIPES.length; i++) if (t > WIPES[i] - .3 && t < WIPES[i] + .34) return true; return false; }

  /* ---------- frame 0 / seam: the hook title ---------- */
  function hookTitle(g, t, k) {
    if (k <= 0) return;
    var nr = NOREC; NOREC = nr || k < .999; var dy = -620 * (1 - k);
    g.save(); g.translate(0, dy);
    chip(g, 'GTA 6', 300, 296, 64, PINK, CREAM, { rot: -.05 });
    var w1 = tw('FRIDGE MENU', 140, 'condensed', 900) + 64;
    g.save(); g.translate(CX, 420); g.rotate(-.02); rr(g, -w1 / 2 + 6, -76 + 9, w1, 152, 12); g.fillStyle = 'rgba(0,0,0,.45)'; g.fill(); rr(g, -w1 / 2, -76, w1, 152, 12); g.fillStyle = CREAM; g.fill(); g.restore();
    T2(g, 'FRIDGE MENU', CX, 420, 140, { col: INK, max: 760 });
    g.restore(); NOREC = nr;
  }
  /* the list on menuA / menuB, 0..1 of the source frame (centre), read off the frames */
  var LIST_A = [[0, .67, .70], [.35, .63, .645], [.55, .61, .61]];
  var LIST_B = [[0, .61, .615], [.05, .60, .61], [.25, .577, .59], [.3, .575, .574], [.43, .57, .57]];
  function hookCard(g, t0, u, seam) {
    /* frame 0 holds the sharpest source frame (438.80 s) still for 0.3 s, the same picture the loop seam ends on */
    var t = seam ? t0 : Math.max(0, t0 - .3), tr = t0;
    var tt0 = Math.min(t, u.t1 - 1e-3), pf = track(u, tt0, LIST_A); u.focus = [pf[0] + lerp(.03, -.01, seg(srcAt(u, tt0), .12, .55)), pf[1] + .02];
    card(g, CARD0, t, u, { rot: -.012, after: function (gg, x, y, w, h, tt) {
      if (seam) return;
      var p = track(u, tt, LIST_A), q = CLIP.toScreen(u, tt, p[0] - .005, p[1], x, y, w, h), s = CLIP.toScreen(u, tt, p[0] + .085, p[1] + .06, x, y, w, h);
      var bw = (s[0] - q[0]) * 2 + 50, bh = (s[1] - q[1]) * 2 + 40;
      boxRing(gg, q[0], q[1], bw, bh, seg(tr, T.ringA, T.ringA + .45));
    } });
  }
  function hookBeat(g, t) {
    if (t < T.walkIn + .02) hookCard(g, t, U.hook, false);
    if (t >= T.seamIn - .02) hookCard(g, t, U.seam, true);
  }

  /* ---------- walk up: the FRIDGE prompt ---------- */
  var PROMPT = [.513, .636]; /* the walk card is framed right of x .33 so Rockstar's TURN ON prompt (x ~.23) stays out */
  /* the fridge in the walk shot (clip-local source time, 0..1 of the frame), read off frames 7, 18, 29, 40 */
  var FRIDGE_PTS = [[.2, .73, .6], [.567, .69, .6], [.933, .63, .64], [1.3, .625, .63]];
  function walkBeat(g, t) {
    var u = U.walk; if (t < T.walkIn - .02 || t >= u.t1) return;
    var kw = 1 - eio(seg(t, u.t1 - .25, u.t1)), nr = NOREC; NOREC = nr || kw < .999;
    g.save(); g.globalAlpha *= kw; g.translate(CX, 930); g.scale(lerp(.94, 1, kw), lerp(.94, 1, kw)); g.translate(-CX, -930);
    card(g, CARDW, t, u, { after: function (gg, x, y, w, h, tt) {
      var f = track(u, tt, FRIDGE_PTS), fq = CLIP.toScreen(u, tt, f[0], f[1], x, y, w, h);
      var kf = seg(t, T.walkIn + .1, T.walkIn + .45) * (1 - seg(t, T.fridgeW - .3, T.fridgeW - .1));
      if (kf > 0) { gg.save(); gg.globalAlpha *= clamp(kf * 1.5, 0, 1); ring(gg, fq[0], fq[1], 150, kf); gg.restore(); }
      var q = CLIP.toScreen(u, tt, PROMPT[0], PROMPT[1], x, y, w, h);
      ring(gg, q[0] + 40, q[1], 92, seg(t, T.fridgeW - .15, T.fridgeW + .15));
    } });
    g.restore(); NOREC = nr;
  }
  /* the FRIDGE tag: on "fridge", held through the door wipe into the open beat (drawn above the door) */
  function fridgeTag(g, t) {
    var k = seg(t, T.fridgeW - .1, T.fridgeW + .1), ko = eio(seg(t, T.tagOut, T.tagOut + .3));
    if (k <= 0 || ko >= 1) return;
        var nr = NOREC; NOREC = nr || k < .999 || ko > 0;
    g.save(); g.globalAlpha *= clamp(k * 3, 0, 1) * (1 - ko);
    /* no leader: it would cross the credit band; the ring on the prompt and the tag share the word */
    g.translate(CX, 1380 + 120 * ko); var sc = lerp(1.35, 1, eo(k)) * kn(t, T.fridgeW + .1, .08); g.scale(sc, sc); g.rotate(-.025);
    var tw0 = tw('FRIDGE', 80), bw = tw0 + 150; rr(g, -bw / 2 + 6, -52 + 8, bw, 104, 12); g.fillStyle = 'rgba(0,0,0,.4)'; g.fill(); rr(g, -bw / 2, -52, bw, 104, 12); g.fillStyle = CREAM; g.fill();
    triGlyph(g, -bw / 2 + 62, 0, 30, INK); T2(g, 'FRIDGE', -bw / 2 + 110 + tw0 / 2, 0, 80, { col: INK }); g.restore(); NOREC = nr;
  }

  /* ---------- open it: our fridge, the door swings open, the list's rail draws down inside ---------- */
  var FR = { x: 290, y: 540, w: 460, h: 860 };
  function cans(g, x0, y0, w, seed) {
    var r = mulberry(seed), x = x0 + 14;
    while (x < x0 + w - 40) {
      var kind = r(), cw = kind < .55 ? 40 : 30, ch = kind < .55 ? 70 : 104;
      var col = kind < .3 ? '#c8202b' : kind < .55 ? '#2e9b4e' : kind < .8 ? '#5a3a22' : '#7fb8d8';
      if (kind < .55) { rr(g, x, y0 - ch, cw, ch, 8); g.fillStyle = col; g.fill(); g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(x + 5, y0 - ch + 8, 5, ch - 16); }
      else { rr(g, x + 4, y0 - ch + 30, cw - 8, ch - 30, 8); g.fillStyle = col; g.fill(); g.fillRect(x + cw / 2 - 5, y0 - ch, 10, 34); g.fillStyle = 'rgba(255,255,255,.75)'; g.fillRect(x + 4, y0 - ch + 52, cw - 8, 26); }
      x += cw + 8 + r() * 8;
    }
  }
  function fridgeBeat(g, t) {
    if (t < T.openIn - .02 || t >= T.itemsIn + .5) return;
    var ko = eio(seg(t, T.itemsIn - .1, T.itemsIn + .4)), nr = NOREC; NOREC = nr || ko > 0;
    g.save(); g.translate(0, -1500 * ko);
    var fp = 1 + .08 * eio(seg(t, T.openIn, T.itemsIn)); g.translate(520, 970); g.scale(fp, fp); g.translate(-520, -970);
    var X = FR.x, Y = FR.y, w = FR.w, h = FR.h, mid = Y + 250, bob = 4 * Math.sin(t * 3.1);
    g.translate(0, bob);
    /* shadow + body */
    g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.ellipse(X + w / 2, Y + h + 18, w * .62, 26, 0, 0, TAU); g.fill();
    rr(g, X, Y, w, h, 28); g.fillStyle = '#e9e3d8'; g.fill();
    /* inside (seen when the door opens) */
    var a = eio(seg(t, T.swingW - .05, T.swingW + .4)) * 1.95; /* door angle 0..~112 degrees */
    if (a > .02) {
      var ix = X + 16, iy = mid + 14, iw = w - 32, ih = Y + h - 16 - iy;
      var gl = g.createLinearGradient(0, iy, 0, iy + ih); gl.addColorStop(0, '#dff1ff'); gl.addColorStop(.35, '#8fa8b8'); gl.addColorStop(1, '#3a434c'); rr(g, ix, iy, iw, ih, 14); g.fillStyle = gl; g.fill();
      g.fillStyle = 'rgba(255,255,255,.55)'; [iy + 190, iy + 360].forEach(function (yy) { g.fillRect(ix + 6, yy, iw - 12, 8); });
      cans(g, ix, iy + 188, iw, 3); cans(g, ix, iy + 358, iw, 9); cans(g, ix, iy + ih - 8, iw, 17);
      var glow = g.createRadialGradient(X + w / 2, iy + 40, 10, X + w / 2, iy + 40, 520); glow.addColorStop(0, 'rgba(220,245,255,' + (.35 * clamp(a, 0, 1)) + ')'); glow.addColorStop(1, 'rgba(220,245,255,0)'); g.fillStyle = glow; g.fillRect(X - 300, iy - 200, w + 600, ih + 500);
      /* the list's rail drawing down inside, on "list" (our redraw of the ✕ and dots, no names yet) */
      var kl = seg(t, T.listW - .05, T.listW + .45);
      if (kl > 0) {
        var rx = ix + 60, ry0 = iy + 40, step = 92;
        g.save(); g.strokeStyle = '#fff'; g.lineWidth = 6; g.beginPath(); g.moveTo(rx, ry0); g.lineTo(rx, ry0 + step * 4 * eo(kl)); g.stroke();
        for (var d = 0; d < 5; d++) { var kd = seg(t, T.listW + d * .07, T.listW + d * .07 + .15); if (kd > 0) { if (d === 0) xGlyph(g, rx, ry0, 26 * eo(kd)); else disc(g, rx, ry0 + d * step, 12 * eo(kd), '#fff'); } }
        g.restore();
      }
    }
    /* freezer door (stays shut) */
    rr(g, X + 6, Y + 6, w - 12, mid - Y - 10, 22); g.fillStyle = '#f3eee5'; g.fill();
    rr(g, X + w - 52, Y + 70, 20, 150, 10); g.fillStyle = '#a49c90'; g.fill();
    g.save(); g.translate(X + 110, Y + 120); g.rotate(-.08); g.fillStyle = '#f4a6c8'; g.fillRect(-46, -46, 92, 92); g.restore();
    g.save(); g.translate(X + 230, Y + 150); g.rotate(.06); g.fillStyle = '#fff'; g.fillRect(-58, -40, 116, 80); g.fillStyle = '#7fc4e8'; g.fillRect(-50, -32, 100, 40); g.fillStyle = '#e8cf9a'; g.fillRect(-50, 8, 100, 24); g.restore();
    /* main door: hinged on the left edge, swinging toward us */
    var cosA = Math.cos(a), sinA = Math.sin(a), dx0 = X + 6, dw = w - 12, dy0 = mid + 4, dh = Y + h - 6 - dy0;
    var fx = dx0 + dw * cosA, skew = 46 * sinA;
    g.save();
    g.beginPath(); g.moveTo(dx0, dy0); g.lineTo(fx, dy0 - skew); g.lineTo(fx, dy0 + dh + skew); g.lineTo(dx0, dy0 + dh); g.closePath();
    g.fillStyle = cosA >= 0 ? '#f3eee5' : '#d8d1c4'; g.fill(); g.strokeStyle = 'rgba(0,0,0,.12)'; g.lineWidth = 3; g.stroke();
    if (cosA >= 0) {
      /* the front: handle, notes and a round green magnet, squashed with the door */
      g.save(); g.transform(cosA, -skew / dw * 1, 0, 1, dx0, dy0);
      rr(g, dw - 46, 60, 20, 300, 10); g.fillStyle = '#a49c90'; g.fill();
      g.save(); g.translate(110, 150); g.rotate(-.05); g.fillStyle = '#f4a6c8'; g.fillRect(-56, -56, 112, 112); g.restore();
      g.save(); g.translate(262, 330); g.rotate(.07); g.fillStyle = '#fbfbf7'; g.fillRect(-62, -66, 124, 140); g.fillStyle = '#6f9a4a'; g.fillRect(-52, -56, 104, 100); g.fillStyle = '#2a1d16'; g.beginPath(); g.ellipse(-4, 12, 22, 26, 0, 0, TAU); g.fill(); disc(g, 2, -22, 15, '#2a1d16'); g.beginPath(); g.moveTo(-8, -32); g.lineTo(-4, -50); g.lineTo(2, -32); g.fill(); g.beginPath(); g.moveTo(6, -32); g.lineTo(14, -48); g.lineTo(14, -28); g.fill(); g.fillStyle = '#e57aa8'; g.fillRect(-8, -12, 18, 5); g.restore();
      disc(g, 240, 120, 44, '#fff'); g.strokeStyle = '#2e9b4e'; g.lineWidth = 9; g.beginPath(); g.arc(240, 120, 37, 0, TAU); g.stroke();
      g.save(); g.translate(130, 420); g.rotate(.04); g.fillStyle = '#fff'; g.fillRect(-70, -50, 140, 100); g.fillStyle = '#e57aa8'; g.fillRect(-62, -42, 124, 60); g.restore();
      g.restore();
    } else {
      /* the inside of the door: two bins */
      var ex = fx, ww = dx0 - ex; g.fillStyle = 'rgba(0,0,0,.08)'; g.fillRect(ex + ww * .12, dy0 + 120, ww * .76, 16); g.fillRect(ex + ww * .12, dy0 + 330, ww * .76, 16);
    }
    g.restore();
    g.restore(); NOREC = nr;
  }

  /* ---------- the list: our RE-DRAWN rows fill the frame (all five dim from the start, each lit on its word),
     then they tighten up for the loupe: Rockstar's own icons at source pixels, x3 ---------- */
  var ROWS = ['LOGGER BEER', 'LAVAZAS BEER', 'BLITZ BERRY SMOOTHIE', 'BLITZ GREEN SMOOTHIE', 'PROTEIN SHAKE'], ICONS = [null, null, 'be', 'be', 'rb'];
  var LOUPE = { x: 100, y: 1075, w: 820, h: 345 }, SHAKE_IC = [.545, .637];
  function rowK(i, t) { return eo(seg(t, T.row[i] - .04, T.row[i] + .16)); }
  function listBeat(g, t) {
    if (t < T.itemsIn - .3 || t >= T.magIn + .02) return;
    var kp = eo(seg(t, T.itemsIn - .3, T.itemsIn + .15)); if (kp <= 0) return;
    var km = eio(seg(t, T.loupeIn - .45, T.loupeIn + .1));
    var y0 = lerp(650, 600, km), step = lerp(150, 98, km), px = lerp(72, 56, km), ri = step * .22;
    var ps = 1 + .05 * eio(seg(t, T.itemsIn, T.loupeIn - .45)) * (1 - km);
    var nrp = NOREC; NOREC = nrp || kp < .999 || (km > 0 && km < 1) || ps > 1.0005;
    g.save(); g.translate(0, 700 * (1 - kp)); g.translate(CX, y0 + 2 * step); g.scale(ps, ps); g.translate(-CX, -(y0 + 2 * step));
    var top = y0 - step * .5 - 14, ph = step * 5 + 28;
    rr(g, 128, top + 10, 780, ph, 22); g.fillStyle = 'rgba(0,0,0,.45)'; g.fill();
    rr(g, 120, top, 780, ph, 22); g.fillStyle = 'rgba(20,8,26,.93)'; g.fill(); g.strokeStyle = 'rgba(251,243,228,.35)'; g.lineWidth = 3; g.stroke();
    var cur = -1, i; for (i = 0; i < 5; i++) if (t >= T.row[i] - .04 && t < T.iconsIn) cur = i;
    g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 5; g.beginPath(); g.moveTo(166, y0); g.lineTo(166, y0 + step * 4); g.stroke();
    var kTwo = t >= T.twoW - .05 ? kn(t, T.twoW, .25) : 1;
    for (i = 0; i < 5; i++) {
      var k = rowK(i, t), yy = y0 + i * step, lit = clamp(.35 + .65 * k, 0, 1);
      g.save(); g.globalAlpha *= lit;
      if (i === cur) { rr(g, 136, yy - step * .44, 748, step * .88, 14); g.fillStyle = 'rgba(255,201,74,.16)'; g.fill(); }
      /* the ✕ cursor only on the two beer rows: the source only ever highlights LOGGER and LAVAZAS */
      if (i === cur && i < 2) xGlyph(g, 166, yy, ri * 1.05, SUN); else disc(g, 166, yy, ri * .45, i === cur ? SUN : '#fff');
      var tx = 214;
      if (ICONS[i]) { var set = ICONSET[ICONS[i]], ks = i >= 2 ? kTwo : 1; [0, 1].forEach(function (j) { g.save(); g.translate(tx + ri + j * (ri * 2.35), yy); g.scale(ks, ks); set[j](g, 0, 0, ri); g.restore(); }); tx += ri * 4.6 + 18; }
      var nri = NOREC; NOREC = nri || k < .999;
      g.save(); g.translate(tx, yy); var sk = k > 0 ? lerp(1.12, 1, k) : 1; g.scale(sk, sk);
      T2(g, ROWS[i], 0, 0, px, { col: i === cur ? SUN : '#fff', align: 'left', max: 880 - tx });
      g.restore(); NOREC = nri; g.restore();
    }
    /* our mark on the shake row's two icons, on "shake" */
    ring(g, 214 + ri * 2.2, y0 + 4 * step, ri * 2.7, seg(t, T.shakeW - .05, T.shakeW + .25), SUN);
    var kt = seg(t, T.row[0] + .15, T.row[0] + .35); if (kt > 0) { g.save(); g.globalAlpha *= kt; chip(g, 'RE-DRAWN · 7:18', 290, top - 4, 36, SUN, INK, { rot: -.02 }); g.restore(); }
    g.restore(); NOREC = nrp;
    if (t >= T.iconsIn - .1) sticker(g, 'NO ICONS', 790, y0 + step * .5, 52, seg(t, T.noW - .05, T.noW + .15), null, null, { bg: CREAM, fg: RED, rot: .03 });
    /* the loupe: Rockstar's own list at 439.25 s, x3, icons at source pixels */
    var kl = eo(seg(t, T.loupeIn - .2, T.loupeIn + .15));
    if (kl > 0 && t < U.loupe.t1) {
      var nrl = NOREC; NOREC = nrl || kl < .999;
      g.save(); g.translate(0, 520 * (1 - kl));
      var u = U.loupe;
      card(g, LOUPE, t, u, { rot: .006, after: function (gg, x, y, w, h, tt) {
        var q = CLIP.toScreen(u, tt, SHAKE_IC[0], SHAKE_IC[1], x, y, w, h);
        gg.save(); gg.strokeStyle = SUN; gg.lineWidth = 8; var kr = eo(seg(t, T.loupeIn + .2, T.loupeIn + .5)); gg.globalAlpha *= clamp(kr * 2, 0, 1); rr(gg, q[0] - 105 - 10 * (1 - kr), q[1] - 54, 210 + 20 * (1 - kr), 108, 54); gg.stroke(); gg.restore();
      } });
      g.restore(); NOREC = nrl;
      sticker(g, 'ZOOM ×3', 215, LOUPE.y + 2, 40, seg(t, T.loupeIn + .1, T.loupeIn + .3), null, null, { rot: -.03 });
    }
    sticker(g, 'NOT EXPLAINED', 690, LOUPE.y + 2, 52, seg(t, T.saidW - .05, T.saidW + .15), null, null, { bg: CREAM, fg: RED, rot: .025, knock: T.saidW + .15, t: t });
  }

  /* ---------- the magnet: FLEECA BANK on the door ---------- */
  var FLEECA = [[0, .74, .19], [.4, .74, .2], [.6, .74, .235]];
  function magnetBeat(g, t) {
    if (t < T.magIn - .02 || t >= U.mag.t1) return;
    var u = U.mag, fq = null;
    card(g, CARDW, t, u, { rot: -.008, after: function (gg, x, y, w, h, tt) {
      var p = track(u, tt, FLEECA), q = CLIP.toScreen(u, tt, p[0], p[1], x, y, w, h); fq = q;
      ring(gg, q[0], q[1], 92, seg(t, T.fleeW - .25, T.fleeW + .05));
    } });
    if (fq) sticker(g, 'FLEECA BANK', 650, 1170, 76, seg(t, T.fleeW, T.fleeW + .2), fq[0] + 40, fq[1] + 84, { knock: T.fleeW + .2, t: t, bg: '#2e9b4e', fg: CREAM });
  }

  /* ---------- the drink: DRINK / DROP ---------- */
  var PR_DRINK = [.935, .905], PR_DROP = [.935, .955], BOTTLE = [[0, .29, .80], [.25, .28, .80]];
  function drinkBeat(g, t) {
    if (t < U.drink.t0 || t >= T.endIn + .02) return;
    var u = U.drink, qd = null, qp = null;
    card(g, CARDD, t, u, { rot: .008, after: function (gg, x, y, w, h, tt) {
      var b = track(u, tt, BOTTLE), qb = CLIP.toScreen(u, tt, b[0], b[1], x, y, w, h);
      ring(gg, qb[0], qb[1], 84, seg(t, T.grabW - .05, T.grabW + .25));
      qd = CLIP.toScreen(u, tt, PR_DRINK[0] - .025, PR_DRINK[1], x, y, w, h); qp = CLIP.toScreen(u, tt, PR_DROP[0] - .025, PR_DROP[1], x, y, w, h);
      var k1 = seg(t, T.drinkW - .05, T.drinkW + .15); if (k1 > 0) { gg.save(); gg.globalAlpha *= clamp(k1 * 3, 0, 1); gg.strokeStyle = SUN; gg.lineWidth = 7; rr(gg, qd[0] - 70, qd[1] - 22, 120, 40, 20); gg.stroke(); gg.restore(); }
      var k2 = seg(t, T.dropW - .05, T.dropW + .15); if (k2 > 0) { gg.save(); gg.globalAlpha *= clamp(k2 * 3, 0, 1); gg.strokeStyle = SUN; gg.lineWidth = 7; rr(gg, qp[0] - 70, qp[1] - 20, 120, 40, 20); gg.stroke(); gg.restore(); }
    } });
    function promptTag(s, x, y, k, glyph) {
      if (k <= 0) return; var nr = NOREC; NOREC = nr || k < .999;
      g.save(); g.globalAlpha *= clamp(k * 3, 0, 1); g.translate(x, y); var sc = lerp(1.35, 1, eo(k)); g.scale(sc, sc); g.rotate(-.02);
      var w0 = tw(s, 92), bw = w0 + 150; rr(g, -bw / 2 + 6, -58 + 8, bw, 116, 14); g.fillStyle = 'rgba(0,0,0,.4)'; g.fill(); rr(g, -bw / 2, -58, bw, 116, 14); g.fillStyle = CREAM; g.fill();
      T2(g, s, -bw / 2 + 30 + w0 / 2, 0, 92, { col: INK }); glyph(g, bw / 2 - 58, 0); g.restore(); NOREC = nr;
    }
    promptTag('DRINK', 300, 1290, eo(seg(t, T.drinkW, T.drinkW + .18)), function (gg, x, y) { rr(gg, x - 34, y - 26, 68, 52, 14); gg.strokeStyle = INK; gg.lineWidth = 6; gg.stroke(); M2(gg, 'R1', x, y + 2, 30, { col: INK, align: 'center', ls: 0 }); });
    promptTag('DROP', 715, 1290, eo(seg(t, T.dropW - .05, T.dropW + .13)), function (gg, x, y) { circGlyph(gg, x, y, 30, INK); });
  }

  /* ---------- the vote ---------- */
  function vote(g, t) {
    var k = eo(seg(t, T.endIn - .05, T.endIn + .25)), ko = seg(t, T.seamIn - .02, T.seamIn); if (k <= 0 || ko >= 1 || t >= T.seamIn) return;
    var nr = NOREC; NOREC = nr || k < .999;
    g.save(); g.translate(0, 1400 * (1 - k));
    var kq = eo(seg(t, T.endIn - .05, T.endIn + .15));
    if (kq > 0) {
      var w1 = tw('BEER OR', 140) + 70; g.save(); g.translate(CX, 560); g.rotate(-.02); rr(g, -w1 / 2, -80, w1, 160, 14); g.fillStyle = CREAM; g.fill(); g.restore(); T2(g, 'BEER OR', CX, 560, 140, { col: INK });
      var w2 = tw('SMOOTHIE?', 140) + 70; g.save(); g.translate(CX, 730); g.rotate(.015); rr(g, -w2 / 2, -80, w2, 160, 14); g.fillStyle = PINK; g.fill(); g.restore(); T2(g, 'SMOOTHIE?', CX, 730, 140, { col: CREAM, max: 760 });
    }
    function btn(x, w, s, kk, col, ic) {
      if (kk <= 0) return; g.save(); g.translate(x, 1110); var sc = lerp(.6, 1, kk) * kn(t, T.pickW, .08); g.scale(sc, sc); g.globalAlpha *= clamp(kk * 2, 0, 1);
      rr(g, -w / 2 + 8, -150 + 10, w, 300, 30); g.fillStyle = 'rgba(0,0,0,.45)'; g.fill(); rr(g, -w / 2, -150, w, 300, 30); g.fillStyle = col; g.fill();
      ic(g); T2(g, s, 0, 80, 84, { col: '#fff', max: w - 40 }); g.restore();
    }
    btn(300, 360, 'BEER', eo(seg(t, T.endIn + .3, T.endIn + .5)), '#c77a12', function (gg) { rr(gg, -22, -120, 44, 50, 8); gg.fillStyle = '#5a3a22'; gg.fill(); rr(gg, -36, -84, 72, 110, 16); gg.fill(); gg.fillStyle = 'rgba(255,255,255,.8)'; gg.fillRect(-36, -50, 72, 36); });
    btn(720, 380, 'SMOOTHIE', eo(seg(t, T.endIn + .35, T.endIn + .55)), '#2e8f62', function (gg) { gg.save(); gg.translate(0, -40); boltIcon(gg, -46, 0, 40); eyeIcon(gg, 46, 0, 40); gg.restore(); });
    g.restore(); NOREC = nr;
  }

  function props(g, t) {
    hookBeat(g, t);
    walkBeat(g, t);
    fridgeBeat(g, t);
    listBeat(g, t);
    magnetBeat(g, t);
    drinkBeat(g, t);
    vote(g, t);
    if (t < T.seamIn) hookTitle(g, t, 1 - eio(seg(t, T.titleOut, T.titleOut + .3)));
    else hookTitle(g, t, 1);
  }
  function posterTitle(g) { /* the poster frame keeps the hook title (frame-0 layout) */ }

  /* =====================================================================================================
     CAPTIONS: cream tape near the top of the safe box, phrase by phrase (hook, items and end have their own boards)
     ===================================================================================================== */
  var BREAK = { walk: ['prompt'], open: ['and'], icons: ['beers', 'and', 'said'], magnet: ['bank'], drink: ['prompt'] };
  var CAPS = (function () {
    var outc = [];
    VO.lines.forEach(function (l) {
      if (l.id === 'hook' || l.id === 'end' || l.id === 'loop' || l.id === 'items') return;
      var cur = [], ws = l.words;
      ws.forEach(function (w, i) { cur.push(w); if (/[.?!]["”]?$/.test(w.w) && i < ws.length - 1) { cur.id = l.id; outc.push(cur); cur = []; } });
      if (cur.length) { cur.id = l.id; outc.push(cur); }
    });
    return outc.map(function (ws) { return { id: ws.id, t0: ws[0].t0, t1: ws[ws.length - 1].t1, s: ws[0].t0 - .04, words: ws }; });
  })();
  var STRESS = [], CAPY = 340, CUTS = [];
  function stressed(w) { for (var i = 0; i < STRESS.length; i++) if (Math.abs(STRESS[i] - w.t0) < .02) return true; return false; }
  function tq(t) { return (Math.floor(t * 30) + .5) / 30; }
  function captions(g, t) {
    t = tq(t);
    var c0 = null, ci = -1;
    CAPS.forEach(function (c, i) { if (t >= c.s) { c0 = c; ci = i; } });
    if (!c0) return;
    var nx = CAPS[ci + 1], ns = nx ? nx.s : T.endIn;
    var end = Math.min(c0.t1 + .55, ns, T.endIn - .2);
    if (c0.id === 'walk' || c0.id === 'open') end = Math.min(end, T.itemsIn - .35);
    /* a caption that starts just before a door wipe comes in after it (the walk line starts 0.3 s before the 2.5 s wipe) */
    var s0 = c0.s; for (var bj = 0; bj < CUTS.length; bj++) if (CUTS[bj] > c0.s && CUTS[bj] < c0.s + .6) s0 = CUTS[bj] + .3;
    if (t < s0) return;
    for (var bi = 0; bi < CUTS.length; bi++) if (CUTS[bi] > s0 + .2) { end = Math.min(end, CUTS[bi] - .3); break; }
    if (t >= end) return;
    var k = cd(t, s0, 16), ko = 1 - seg(t, end - .06, end);
    g.save(); g.globalAlpha *= ko; cond(g, 'condensed'); var cpx = 72; font(g, cpx, 900); ls(g, 1); g.textBaseline = 'alphabetic';
    var words = c0.words, up = words.map(function (w) { return w.w.toUpperCase(); }), ws, gap, lines, lw, maxw = 780, br = BREAK[c0.id] || [];
    function meas() { ws = up.map(function (u) { return g.measureText(u).width; }); gap = cpx * .26; }
    function lay() {
      lines = [[]];
      words.forEach(function (w, i) { lines[lines.length - 1].push(i); if (br.indexOf(w.w.toLowerCase()) >= 0 && i < words.length - 1) lines.push([]); });
      lw = lines.map(function (ln) { var w = 0; ln.forEach(function (i) { w += ws[i] + gap; }); return w; });
    }
    meas(); lay();
    while (Math.max.apply(null, lw) - gap > maxw && cpx > 52) { cpx -= 4; font(g, cpx, 900); meas(); lay(); }
    var lh = cpx * 1.3, y0 = CAPY - (lines.length - 1) * lh / 2 + cpx * .36;
    lines.forEach(function (ln, li) {
      var tw0 = lw[li] - gap, x = CX - tw0 / 2, y = y0 + li * lh + (1 - k) * 26, r = mulberry(Math.round(c0.t0 * 100) + li * 7);
      var x0 = x - 22, x1 = x + tw0 + 22, yt = y - cpx * .86, yb = y + cpx * .24, rot = (r() - .5) * .025;
      g.save(); g.translate(CX, y); g.rotate(rot); g.translate(-CX, -y);
      g.save(); g.shadowColor = 'rgba(0,4,20,.55)'; g.shadowBlur = 10; g.shadowOffsetX = 3; g.shadowOffsetY = 6; g.fillStyle = CREAM; rr(g, x0, yt, x1 - x0, yb - yt, 6); g.fill(); g.restore();
      ln.forEach(function (i) {
        var w = words[i], nw = words[i + 1], cur = stressed(w) && t >= w.t0 - .03 && t < Math.min(w.t1 + .05, nw ? nw.t0 - .03 : 1e9) + .25;
        if (cur) { g.save(); g.fillStyle = SUN; g.fillRect(x - 6, y - cpx * .78, ws[i] + 12, cpx * .98); g.restore(); }
        var isG = /^GTA$/.test(up[i]); g.fillStyle = isG ? PINK : INK; g.fillText(up[i], x, y); x += ws[i] + gap;
      });
      g.restore();
    });
    g.restore(); unst(g); ls(g, 0);
  }

  /* =====================================================================================================
     FRAME
     ===================================================================================================== */
  var POSTERMODE = false, STAGEC = '#100714';
  function stage(g) { g.fillStyle = STAGEC; g.fillRect(0, 0, W, H); }
  function railClip(g) { g.beginPath(); if (LIVE2.clip) g.rect(BX0, 0, BX1 - BX0, BY1 + 20); else g.rect(-500, -500, 2080, BY1 + 520); g.clip(); }
  function plateLayer(g, t) {
    var u = CLIP.activePlate(t); if (!u) return;
    var k = seg(t, u.t0, u.t0 + .25) * (1 - seg(t, u.t1 - .25, u.t1));
    g.save(); g.globalAlpha = k; CLIP.plate(g, t, 0, 0, W, H, { dim: .55, blur: 3 }); g.restore();
  }
  function push(t) { if (t < 1.4) return 1 + .035 * (1 - eio(seg(t, .3, 1.4))); if (t >= T.seamIn) return 1 + .035 * eio(seg(t, T.seamIn + .3, DUR)); return 1 + .012 * Math.sin(TAU * t / 3.1); }
  function frame(g, t) {
    g.setTransform(1, 0, 0, 1, 0, 0);
    stage(g);
    if (LIVE2.bg) { g.drawImage(BG, 0, 0); plateLayer(g, t); }
    var dw = seg(t, 0, .6) * (1 - seg(t, DUR - .6, DUR - .05)); /* no drift on frame 0 and the last frame: the loop seam matches */
    var ddx = 3 * osc(t, 13, .3) * dw, ddy = 3 * osc(t, 11, 2.1) * dw, ps = push(t);
    g.save(); railClip(g); g.translate(510 + ddx, 900 + ddy); g.scale(ps, ps); g.translate(-510, -900);
    props(g, t); g.restore();
    if (!POSTERMODE && LIVE.text) { captions(g, t); }
    if (LIVE2.bg) doorWipe(g, t);
    fridgeTag(g, t);
    if (LIVE.grain && NOISE && LIVE2.bg) { g.globalAlpha = .05; g.globalCompositeOperation = 'overlay'; var o = Math.floor(t * 24) * 37 % 256; g.fillStyle = g.createPattern(NOISE, 'repeat'); g.translate(-o, -o); g.fillRect(o, o, W, H); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }
  }
  function TEXTS(t) {
    var o = [];
    function Tx(id, text, a, b) { if (t >= a && t < b) o.push({ id: id, text: text, x0: 0, y0: 0, x1: 0, y1: 0 }); }
    Tx('title', 'FRIDGE MENU', 0, T.titleOut + .15); Tx('title', 'FRIDGE MENU', T.seamIn + .3, DUR + 1);
    Tx('gta6', 'GTA 6', 0, T.titleOut + .15); Tx('gta6', 'GTA 6', T.seamIn + .3, DUR + 1);
    Tx('fridge', 'FRIDGE', T.fridgeW - .05, T.tagOut + .05);
    for (var i = 0; i < 5; i++) Tx('row' + i, ROWS[i], T.row[i] + .1, T.magIn - .25);
    Tx('redrawn', 'RE-DRAWN · 7:18', T.row[0] + .3, T.magIn - .25);
    Tx('noicons', 'NO ICONS', T.noW + .1, T.magIn - .25);
    Tx('zoom', 'ZOOM ×3', T.loupeIn + .25, T.magIn - .75);
    Tx('notexp', 'NOT EXPLAINED', T.saidW + .03, T.magIn - .1);
    Tx('fleeca', 'FLEECA BANK', T.fleeW + .1, T.drinkIn - .21);
    Tx('drink', 'DRINK', T.drinkW + .1, T.endIn - .25);
    Tx('drop', 'DROP', T.dropW + .05, T.endIn - .12);
    Tx('q', 'BEER OR SMOOTHIE?', T.endIn + .15, T.seamIn - .1);
    Tx('beer', 'BEER', T.endIn + .5, T.seamIn - .1); Tx('smoothie', 'SMOOTHIE', T.endIn + .6, T.seamIn - .1);
    return o;
  }

  /* ---------- times, clips and sound events, all from the voice ---------- */
  function initTimes() {
    T.ringA = .2; T.payW = .9;
    T.walkIn = 2.5; T.titleOut = T.walkIn - .32; /* the payoff holds 0-2.2 s; the first door closes 2.24-2.5 s */ T.fridgeW = at('walk', 'fridge');
    T.openIn = start('open') + .15; T.openW = at('open', 'open'); T.swingW = Math.max(T.openW, T.openIn + .15); T.listW = at('open', 'list');
    T.tagOut = 5.95; /* FRIDGE holds 3.92-5.95 s */
    T.itemsIn = start('items') - .2;
    T.row = [at('items', 'logger'), at('items', 'lavazas'), at('items', 'berry'), at('items', 'green'), at('items', 'protein')];
    T.iconsIn = start('icons'); T.noW = at('icons', 'no'); T.twoW = at('icons', 'two'); T.shakeW = at('icons', 'shake'); T.saidW = at('icons', 'rockstar');
    T.loupeIn = T.twoW + .2;
    T.magIn = start('magnet') - .2; T.fleeW = at('magnet', 'fleeca');
    T.drinkIn = start('drink') - .2; T.grabW = at('drink', 'grab'); T.drinkW = at('drink', 'drink'); T.dropW = at('drink', 'drop');
    T.endIn = lastw('drink') + .12; T.beerW = at('end', 'beer'); T.smW = at('end', 'smoothie'); T.pickW = at('end', 'pick');
    T.seamIn = at('loop', 'because');
    CLIP.reset();
    U.hook = CLIP.use('menuA', 0, T.walkIn, { from: .35, speed: .3, freeze: .66, zoom: [3.0, 3.12], focus: [.66, .72], note: 'hook: the fridge list on screen (438.80 s, its sharpest frame, then 438.8-439.0 s and held), pushed in so its rows read, ring round it, GTA 6 FRIDGE MENU' });
    var wsp = (1.3 - .2) / (T.fridgeW - .12 - T.walkIn);
    U.walk = CLIP.use('walk', T.walkIn, 4.95, { /* ends 4.95 s: the hook + walk run stays at 5.0 s */ from: .2, speed: wsp, freeze: (1.3 - .2) / wsp, zoom: [1.3, 1.42], focus: [.6, .6], note: 'walk up: the FRIDGE button prompt, held on 436.6 s from 3.9 s; ring follows the fridge, then rings the prompt + our FRIDGE tag' });
    U.loupe = CLIP.use('menuB', T.loupeIn - .2, T.magIn - .7, { from: .3, speed: .001, zoom: [6.9, 7.1], focus: [.585, .63], note: 'loupe: the list held at 439.25 s, x3 (source pixels), ring on the shake row icons beside our redraw' });
    U.mag = CLIP.use('magnet', T.magIn, T.drinkIn - .2, { from: 0, speed: .62 / (T.drinkIn - .2 - T.magIn), zoom: [1.25, 1.36], focus: [.66, .3], note: 'the FLEECA BANK magnet on the fridge door (439.45-440.07 s), ring + tag' });
    U.drink = CLIP.use('drink', T.drinkIn + .15, T.endIn, { from: 0, speed: .26 / (T.endIn - T.drinkIn - .15), zoom: [1.0, 1.1], focus: [.7, .85], note: 'bottle in hand, prompts DRINK (R1) / DROP (442.85-443.11 s), rings + our DRINK / DROP tags' });
    U.seam = CLIP.use('menuA', T.seamIn, DUR + .02, { from: .35, speed: .001, zoom: [3.0, 3.0], focus: [.66, .72], note: 'loop seam: the frame-0 layout returns (GTA 6 FRIDGE MENU over the list)' });
    function plate(name, t0, t1, from) { var c = CLIP.manifest().clips[name], span = c.frames / 30 - .04 - (from || 0); return CLIP.use(name, t0, t1, { plate: true, from: from || 0, speed: Math.min(1, span / (t1 - t0)), zoom: [1.1, 1.0], focus: [.5, .5], note: 'background plate' }); }
    plate('pwalk', T.itemsIn, Math.min(T.itemsIn + 4.85, T.loupeIn - .3));
    plate('pkitchen', T.endIn, T.seamIn);
    /* sound: hits sit in the voice's pauses */
    G('f0', 0, 'slap', .05, .78);
    G('ring', T.ringA, 'tock', .3, .9);
    WIPES = [T.walkIn, T.openIn, T.magIn, T.drinkIn, T.endIn, T.seamIn];
    /* the door before "Drink" sits early and soft: at full level Whisper heard it as "Just" (r1, r2 mix) */
    WIPES.forEach(function (c, i) { var dk = c === T.drinkIn; G('door' + i, c - (dk ? .22 : .05), 'door', .25, dk ? .4 : 1); });
    G('fr', T.fridgeW, 'tock', .35, 1);
    G('open', T.swingW + .05, 'seal', .35, 1);
    G('list', T.listW + .1, 'ctick', .35, 1);
    T.row.forEach(function (r, i) { G('row' + i, r, 'ctick', .35, .9); });
    G('no', T.noW, 'tock', .35, .9);
    G('two', T.twoW, 'pop', .35, 1); G('loupe', T.loupeIn, 'tock', .35, .8);
    G('nx', T.saidW, 'slap', .35, 1);
    G('fl', T.fleeW, 'tock', .35, 1);
    G('grab', T.grabW, 'clink', .35, 1);
    G('drink', T.drinkW, 'ctick', .35, .9); G('drop', T.dropW, 'ctick', .35, .9);
    G('beer', T.endIn + .3, 'pop', .35, .9); G('sm', T.endIn + .4, 'pop', .35, .9); G('pick', T.pickW, 'tock', .35, .8);
    CUTS = WIPES.slice().concat([T.itemsIn]).sort(function (a, b) { return a - b; });
    STRESS = [at('walk', 'fridge'), at('open', 'open'), at('open', 'list'), at('icons', 'no'), at('icons', 'two'), at('icons', 'said'), at('magnet', 'fleeca'), at('magnet', 'fridge'), at('drink', 'drink'), at('drink', 'drop'), at('drink', 'grab')];
    EV.sort(function (a, b) { return a.t - b.t; });
  }
  function render(t, samples, shutter, fps) {
    t = clamp(t, 0, DUR); samples = samples || 1;
    if (wiping(t)) samples = 1;
    if (samples === 1) { POSTERMODE = t === window.FILM.POSTER; frame(ctx, t); POSTERMODE = false; return; }
    var span = (shutter || .5) / (fps || 30);
    for (var k = 0; k < samples; k++) { frame(tctx, clamp(t - span / 2 + span * (k + .5) / samples, 0, DUR)); actx.globalAlpha = k === 0 ? 1 : 1 / (k + 1); actx.drawImage(tmp, 0, 0); }
    ctx.globalAlpha = 1; ctx.drawImage(acc, 0, 0);
  }

  function SCORE(ac) {
    var sr = ac.sampleRate, rnd = mulberry(7);
    var master = ac.createGain(); master.gain.value = .8;
    var hp = ac.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 38;
    var comp = ac.createDynamicsCompressor(); comp.threshold.value = -8; comp.ratio.value = 2; comp.attack.value = .004; comp.release.value = .15;
    master.connect(hp); hp.connect(comp); comp.connect(ac.destination);
    var nb = ac.createBuffer(1, sr * 3, sr), nd = nb.getChannelData(0); for (var i = 0; i < nd.length; i++) nd[i] = rnd() * 2 - 1;
    function bus(g, pan) { var o = ac.createGain(); o.gain.value = g; var p = ac.createStereoPanner(); p.pan.value = pan || 0; o.connect(p); p.connect(master); return o; }
    function env(pm, pts) { pm.value = pts[0][1]; pm.setValueAtTime(pts[0][1], 0); pm.setValueAtTime(pts[0][1], Math.max(0, pts[0][0])); for (var k = 1; k < pts.length; k++) pm.linearRampToValueAtTime(pts[k][1], Math.max(0, pts[k][0])); }
    function noise(t0, dur) { var s = ac.createBufferSource(); s.buffer = nb; s.loop = true; s.start(Math.max(0, t0), rnd() * 2, dur); return s; }
    function osc2(type, f, t0, t1, pts, pan) { var o = ac.createOscillator(), og = ac.createGain(); o.type = type; o.frequency.setValueAtTime(f, Math.max(0, t0)); o.connect(og); og.connect(bus(1, pan)); env(og.gain, pts); o.start(Math.max(0, t0)); o.stop(Math.max(0, t1)); return o; }
    function nband(t0, t1, f0, f1, g0, g1, q, pan) { var o = bus(1, pan), bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = q || .7; var n = noise(t0, t1 - t0 + .1); n.connect(bp); bp.connect(o); env(bp.frequency, [[t0, f0], [t1, f1]]); env(o.gain, [[t0, 0], [t0 + (t1 - t0) * .4, g0], [t1 - .02, g1], [t1, 0]]); }
    function tick(t, g, f) { var n = noise(t, .03), bp = ac.createBiquadFilter(); bp.type = 'highpass'; bp.frequency.value = f || 3200; var o = bus(1, (rnd() - .5) * .3); n.connect(bp); bp.connect(o); env(o.gain, [[t, 0], [t + .003, .16 * (g || 1)], [t + .024, 0]]); }
    function thump(t, g, f) { var o = osc2('sine', f || 150, t, t + .2, [[t, 0], [t + .004, g || .4], [t + .14, 0]]); o.frequency.exponentialRampToValueAtTime(50, t + .12); }
    function slap(t, g) { thump(t, .3 * g, 240); nband(t, t + .07, 2600, 1200, .14 * g, .01 * g, .9); tick(t, 1.1 * g, 2000); }
    function tock(t, g) { tick(t, .7 * g, 2600); thump(t, .12 * g, 520); }
    function pop(t, g) { var o = osc2('sine', 520, t, t + .12, [[t, 0], [t + .004, .18 * g], [t + .1, 0]]); o.frequency.exponentialRampToValueAtTime(880, t + .08); tick(t, .5 * g, 3000); }
    /* a fridge door: a soft rubber-seal thud */
    function door(t, g) { thump(t, .34 * g, 120); nband(t, t + .12, 500, 160, .12 * g, .01 * g, .8); }
    /* the seal letting go and the fridge hum starting */
    function seal(t, g) { nband(t, t + .16, 1800, 600, .1 * g, .02 * g, 1.2); osc2('sine', 118, t + .05, t + .5, [[t + .05, 0], [t + .15, .03 * g], [t + .45, 0]]); }
    function ctick(t, g) { tick(t, .5 * g, 4200); osc2('sine', 1250, t, t + .05, [[t, 0], [t + .003, .06 * g], [t + .04, 0]]); }
    /* a glass bottle tink */
    function clink(t, g) { [2650, 3970].forEach(function (f, i) { osc2('sine', f, t + i * .01, t + .3, [[t + i * .01, 0], [t + i * .01 + .003, .08 * g], [t + .28, 0]]); }); }
    var LEVEL = { tock: 2, slap: 3, pop: 2, door: 3, seal: 2.5, ctick: 2, clink: 2 };
    var TRIM = window.SFX_TRIM || {};
    var TYPE_DB = { tock: -18, slap: -14, pop: -16, door: -15, seal: -16, ctick: -21, clink: -18 };
    EV.forEach(function (e) {
      var g = (e.g == null ? 1 : e.g) * (LEVEL[e.type] || 1) * Math.pow(10, ((TRIM[e.id] || 0) + (TYPE_DB[e.type] || 0)) / 20);
      ({ slap: slap, tock: tock, pop: pop, door: door, seal: seal, ctick: ctick, clink: clink })[e.type](e.t, g);
    });
    /* no music: Isac adds a platform sound; the film ships voice + sound effects */
    var MUSIC = false; if (MUSIC) { /* intentionally empty */ }
    (function () { var o = bus(1), lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 600; lp.Q.value = .5; var n = noise(0, DUR); n.connect(lp); lp.connect(o); o.gain.value = window.ROOM_GAIN || .03; })();
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
    var fonts = ['900 84px Archivo', '800 84px Archivo', '700 40px "Geist Mono"'];
    return Promise.all([CLIP.load('clips.json')].concat(fonts.map(function (f) { return document.fonts.load(f, 'Aa0?“…↑&\''); }))).then(function () { return document.fonts.ready; }).then(function () {
      BG = buildBG(); EV.length = 0; initTimes();
      window.FILM.POSTER = 1.2 + 1 / 60; /* the hook card with Rockstar's list sharp and ringed */
      window.FILM.SHOTS = [
        { id: 'hook', name: 'Fridge menu', t0: 0, t1: start('walk') },
        { id: 'walk', name: 'The FRIDGE prompt', t0: start('walk'), t1: start('open') },
        { id: 'open', name: 'Open it', t0: start('open'), t1: start('items') },
        { id: 'items', name: 'The list', t0: start('items'), t1: start('icons') },
        { id: 'icons', name: 'Two icons', t0: start('icons'), t1: start('magnet') },
        { id: 'magnet', name: 'Fleeca magnet', t0: start('magnet'), t1: start('drink') },
        { id: 'drink', name: 'Drink or drop', t0: start('drink'), t1: start('end') },
        { id: 'end', name: 'Beer or smoothie?', t0: start('end'), t1: DUR }];
      window.READY = true;
    });
  }
  window.FILM = { bare: function () { ctx.setTransform(1, 0, 0, 1, 0, 0); stage(ctx); }, W: W, H: H, DUR: DUR, POSTER: 0, SLUG: 'gta-fridge', SHOTS: [], init: init, render: render, frame: frame, LIVE: LIVE, LIVE2: LIVE2, T: T, GT: GT };
  window.BOUNDS_RUN = function (step) {
    BOUNDS = []; var o = {};
    for (var t = 0; t <= DUR + 1e-6; t += step || 1 / 15) { CURT = t; POSTERMODE = false; frame(ctx, t); }
    BOUNDS.forEach(function (b) { var r = o[b.text] || (o[b.text] = { text: b.text, from: b.t, to: b.t, x0: b.x0, x1: b.x1, y1: b.y1, n: 0 }); r.to = b.t; r.n++; r.x0 = Math.min(r.x0, b.x0); r.x1 = Math.max(r.x1, b.x1); r.y1 = Math.max(r.y1, b.y1); });
    BOUNDS = null; return Object.keys(o).map(function (k) { return o[k]; });
  };
  window.DUR = DUR; window.EV = EV; window.TEXTS = TEXTS; window.SCORE = SCORE; window.READY = false;
  window.render = function (t, s, sh, fps) { render(t, s, sh, fps); };
})();
