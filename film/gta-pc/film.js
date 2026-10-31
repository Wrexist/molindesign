/* "PC waits": GTA 6, Delta #8. A vertical film written in code, narrated first and cut to the voice:
   every visual beat is keyed to a word time from vo/vo.js (window.VO) with at(id, word). Pure function of t.
   Contract: window.FILM, DUR, render(t), READY, EV, TEXTS(t), SCORE(ctx).
   Native move: a wait chart. Every PC wait is a pink bar drawn to scale (40 px per 30.44 days, BRIEF.md's day counts):
   four short bars stop before a dashed 8 MO line, GTA 5's runs nearly the full width to ALMOST 19 MONTHS (the one hero
   number), and the GTA 6 row waits at the bottom with an open bar and a "?". Frame 0 is a flat PC monitor that can't
   get GTA 6 next to two generic console boxes; the end vote sits on the same monitor and dissolves into frame 0.
   Own flat shapes in a Vice City palette. No Rockstar footage, logo or key art, no console logos, no music. */
(function () {
  'use strict';
  var W = 1080, H = 1920, VO = window.VO, DUR = VO.dur, CX = 510;
  var BG = '#0b0820', CREAM = '#fbf0ea';
  var HOT = '#ff4fa3', TEAL = '#19d3c5', ORG = '#ff8a3d';
  var PURP = '#241250', PURP2 = '#160b36', PAPER = '#fbf0ea', INK = '#0b0820', GREY = '#77718a';
  var DISP = 'Archivo';

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
  function pin(t, a) { return lerp(1.15, 1, clamp(pop(t, a, 3.2), 0, 1)); }
  function pinS(t, a) { return lerp(1.05, 1, clamp(pop(t, a, 3.2), 0, 1)); }   /* a gentler pop for the plate, so it never crosses x 930 */
  function out(t, a, d) { return 1 - seg(t, a - (d || .25), a); }
  function qt(t) { return (Math.floor(t * 30) + .5) / 30; }      // the frame the renderer samples, for displayed numbers
  function strHash(s) { var h = 7; for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return h; }

  /* ---------- the voice is the timeline ---------- */
  var LINE = {}, ORDER = []; VO.lines.forEach(function (l) { LINE[l.id] = l; ORDER.push(l.id); });
  function norm(w) { return w.toLowerCase().replace(/[^a-z0-9%]/g, ''); }
  function find(id, word, nth) {
    var l = LINE[id], n = nth || 0; if (typeof word === 'number') return l.words[word];
    for (var i = 0; i < l.words.length; i++) if (norm(l.words[i].w) === norm(word) && n-- === 0) return l.words[i];
    throw new Error('no word "' + word + '" in line ' + id);
  }
  function at(id, word, nth) { return find(id, word, nth).t0; }
  function end(id) { return LINE[id].t1; }
  function start(id) { return LINE[id].t0; }

  /* ---------- the SFX gate: hits sit in pauses, clear of where the voice really sounds (vo/vad.js) ---------- */
  var EDGES = [], VOICED = [];
  if (window.VAD) window.VAD.forEach(function (v) { VOICED.push({ t0: v[0], t1: v[1] }); EDGES.push(v[0], v[1]); });
  else VO.lines.forEach(function (l) { l.words.forEach(function (w) { VOICED.push({ t0: w.t0, t1: w.t1 }); EDGES.push(w.t0, w.t1); }); });
  if (!window.VAD) (window.HEARD || []).forEach(function (w) { if (w[1] < .15) return; VOICED.push({ t0: w[0], t1: w[1] }); EDGES.push(w[0], w[1]); });
  function free(m) {
    var B = [], M = [], F = [], p = 0;
    EDGES.forEach(function (e) { B.push([e - m, e + m]); });
    VOICED.forEach(function (v) { B.push([v.t0 - .03, v.t1 + .03]); });
    B.sort(function (x, y) { return x[0] - y[0]; });
    B.forEach(function (b) { var L = M[M.length - 1]; if (L && b[0] <= L[1]) L[1] = Math.max(L[1], b[1]); else M.push(b.slice()); });
    M.forEach(function (b) { if (b[0] > p) F.push([p, b[0]]); p = Math.max(p, b[1]); });
    F.push([p, DUR + 9]); return F;
  }
  var BODY = { crt: .2, clack: .1, tick: .03, stamp: .16, tear: .22, blip: .16, pop: .12, swish: .26, whoosh: .2, paper: .2, ratchet: .34 };
  function nearGap(t, type, m) {
    var body = BODY[type] || .12, best = null;
    free(m || (window.VAD ? .15 : .2)).forEach(function (f) {
      var lo = f[0], hi = f[1] - body; if (hi < lo) return;
      var c = clamp(t, lo, hi); if (best === null || Math.abs(c - t) < Math.abs(best - t)) best = c;
    });
    return best;
  }
  var GT = {}, EV = [];
  function G(id, t, type, tol, gain, extra) {
    var n = nearGap(t, type, extra && extra.m);
    if (n !== null && Math.abs(n - t) <= (tol == null ? .35 : tol)) { GT[id] = n; var e = { t: n, type: type, g: gain == null ? 1 : gain, id: id }; if (extra) for (var k in extra) e[k] = extra[k]; EV.push(e); }
    else GT[id] = t;
    return GT[id];
  }
  /* the end of the voice before t (from vad.js), and the first free moment after a line */
  function vadEndBefore(t, from) { var ve = from; (window.VAD || []).forEach(function (v) { if (v[0] < t - .2 && v[1] > ve) ve = v[1]; }); return ve; }
  function after(id) { var i = ORDER.indexOf(id), nx = ORDER[i + 1]; return vadEndBefore(nx ? start(nx) : DUR, end(id) - .6) + .155; }

  /* ---------- canvas + safe-area check ---------- */
  var cv, ctx, tmp, tctx, acc, actx, LIVE = { grain: true, text: true };
  function mk(w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  var BOUNDS = null, NOREC = false, INCOMING = false, CURT = 0, SAFE = { x0: 90, x1: 930, y1: 1450 };
  function recBox(g, x0, y0, x1, y1, text) {
    if (!BOUNDS || INCOMING || NOREC || (g !== ctx && g !== tctx) || g.globalAlpha < .05) return;
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

  /* ---------- primitives (setting ctx.font resets fontStretch: font() re-applies it) ---------- */
  function font(g, px, wt, fam) { g.font = (wt || 800) + ' ' + px + 'px ' + (fam || DISP); if (g.__st) try { g.fontStretch = g.__st; } catch (e) {} }
  function rr(g, x, y, w, h, r) { g.beginPath(); g.roundRect(x, y, w, h, Math.max(0, Math.min(r, w / 2, h / 2))); }
  function ls(g, px) { try { g.letterSpacing = px + 'px'; } catch (e) {} }
  function wide(g) { try { g.fontStretch = 'expanded'; } catch (e) {} }
  function cond(g) { g.__st = 'extra-condensed'; try { g.fontStretch = 'extra-condensed'; } catch (e) {} }
  function chip(g, text, x, y, o) {
    o = o || {}; var px = o.px || 64, a = o.a == null ? 1 : o.a, s = o.s == null ? 1 : o.s;
    if (a <= 0 || s <= 0) return 0;
    g.save(); if (o.cond) cond(g);
    font(g, px, o.wt, o.fam); ls(g, o.ls || 0);
    var tw = g.measureText(text).width, pad = o.pad == null ? px * .32 : o.pad;
    while (o.maxw && tw + pad * 2 > o.maxw && px > 36) { px -= 2; font(g, px, o.wt, o.fam); tw = g.measureText(text).width; pad = o.pad == null ? px * .32 : o.pad; }
    var w = o.w || tw + pad * 2, h = o.h || px * 1.28;
    g.globalAlpha *= clamp(a, 0, 1); g.translate(x, y); if (o.rot) g.rotate(o.rot); g.scale(s, s);
    if (o.bg || o.line) recBox(g, -w / 2, -h / 2, w / 2, h / 2, '[chip] ' + text);
    if (o.bg) { if (o.shadow !== false) { rr(g, -w / 2 + 6, -h / 2 + 9, w, h, o.r == null ? h * .26 : o.r); g.fillStyle = 'rgba(0,0,0,.35)'; g.fill(); } rr(g, -w / 2, -h / 2, w, h, o.r == null ? h * .26 : o.r); g.fillStyle = o.bg; g.fill(); }
    if (o.line) { if (o.fill) { rr(g, -w / 2, -h / 2, w, h, o.r == null ? h * .26 : o.r); g.fillStyle = o.fill; g.fill(); } rr(g, -w / 2, -h / 2, w, h, o.r == null ? h * .26 : o.r); g.strokeStyle = o.line; g.lineWidth = o.lw || 3; if (o.dash) g.setLineDash(o.dash); g.stroke(); g.setLineDash([]); }
    g.fillStyle = o.fg || (o.bg ? BG : CREAM); g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(text, 0, px * .04); g.restore(); g.__st = null;
    return w;
  }
  /* a source credit on a dark plate: Archivo condensed, 38 px */
  function credit(g, text, x, y, a, col) {
    if (a <= 0) return;
    g.save(); g.globalAlpha *= clamp(a, 0, 1); cond(g); font(g, 38, 700); ls(g, 2); g.textAlign = 'center'; g.textBaseline = 'middle';
    var w = g.measureText(text).width, dy = (1 - Math.min(1, a)) * 10;
    rr(g, x - w / 2 - 18, y - 27 + dy, w + 36, 54, 12); g.fillStyle = 'rgba(11,8,32,.94)'; g.fill();
    g.strokeStyle = 'rgba(251,240,234,.28)'; g.lineWidth = 2; g.stroke();
    g.fillStyle = col || CREAM; g.fillText(text, x, y + 2 + dy); g.restore(); g.__st = null;
  }
  /* a text label; condensed when c is true, never under 36 px */
  function txt(g, text, x, y, o) {
    o = o || {}; var a = o.a == null ? 1 : o.a; if (a <= 0) return;
    var px = Math.max(36, o.px || 40);
    g.save(); g.globalAlpha *= clamp(a, 0, 1); if (o.cond !== false) cond(g); font(g, px, o.wt || 900); ls(g, o.ls == null ? 1 : o.ls);
    g.textAlign = o.align || 'left'; g.textBaseline = 'middle'; g.fillStyle = o.col || CREAM;
    if (o.s && o.s !== 1) { g.translate(x, y); g.scale(o.s, o.s); g.translate(-x, -y); }
    g.fillText(text, x, y + (1 - Math.min(1, a)) * (o.rise == null ? 10 : o.rise)); g.restore(); g.__st = null;
  }
  function el(g, x, y, rx, ry, rot) { g.beginPath(); g.ellipse(x, y, rx, ry, rot || 0, 0, 6.283); g.fill(); }
  /* rubber stamp: worn ink (seeded speckle), slammed. 574 DAYS is the film's one hero stamp */
  var STEX = {};
  function stampTex(text, col, px) {
    var key = text + col + px; if (STEX[key]) return STEX[key];
    var m = mk(4, 4).getContext('2d'); font(m, px, 900); ls(m, 4);
    var lw = m.measureText(text).width, pad = px * .4, h = px * 1.25, w = lw + pad * 2, c = mk(Math.ceil(w + 16), Math.ceil(h + 16)), g = c.getContext('2d');
    g.translate(8, 8); g.strokeStyle = col; g.fillStyle = col;
    g.lineWidth = Math.max(4, px * .085); rr(g, 2, 2, w - 4, h - 4, px * .14); g.stroke();
    g.textAlign = 'center'; g.textBaseline = 'middle'; font(g, px, 900); ls(g, 4); g.fillText(text, w / 2, h / 2 + px * .05);
    var r = mulberry(strHash(key)), n = Math.floor(w * h / 120);
    g.globalCompositeOperation = 'destination-out';
    for (var i = 0; i < n; i++) { g.globalAlpha = .35 + r() * .65; g.beginPath(); g.arc(r() * w, r() * h, .6 + r() * 2.2, 0, 6.283); g.fill(); }
    g.globalCompositeOperation = 'destination-over'; g.globalAlpha = .92; g.fillStyle = BG; rr(g, 2, 2, w - 4, h - 4, px * .14); g.fill();
    c.w = w + 16; c.h = h + 16; STEX[key] = c; return c;
  }
  function stampText(g, text, x, y, t, t0, t1, px, col, rot) {
    if (t < t0 || t > t1 + .3) return;
    var c = stampTex(text, col, px), k = sp(t, t0, 3.2, .8), s = lerp(1.08, 1, clamp(k, 0, 1)), al = clamp(k * 3, 0, 1) * (1 - seg(t, t1, t1 + .3));
    g.save(); g.globalAlpha *= al; g.translate(x, y); g.rotate(rot); g.scale(s, s);
    g.save(); g.globalAlpha *= .35; g.drawImage(c, -c.w / 2 + 8, -c.h / 2 + 10); g.restore();
    g.drawImage(c, -c.w / 2, -c.h / 2);
    if (k >= .5) recBox(g, -c.w / 2 + 8, -c.h / 2 + 8, c.w / 2 - 8, c.h / 2 - 8, text);
    g.restore();
  }
  function bigQ(g, x, y, px, a, t, col) {
    if (a <= 0) return;
    var s = 1 + .06 * Math.sin(t * 5.2);
    g.save(); g.globalAlpha *= clamp(a, 0, 1); g.translate(x, y); g.scale(s, s); font(g, px, 900); g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillStyle = 'rgba(0,0,0,.35)'; g.fillText('?', px * .04, px * .06); g.fillStyle = col || HOT; g.fillText('?', 0, 0); g.restore();
  }

  /* =====================================================================================================
     THE PC: a flat monitor (bezel x 100–920, top..1120, stand to 1202) showing our own hand-drawn download window
     stuck at 99 %, and two generic console boxes on the desk (text only, no logos). Frame 0 uses top 300;
     the page scene and the end use top 470 so the captions stay clear.
     ===================================================================================================== */
  var SX0 = 128, SX1 = 892, SY1 = 1034;
  /* the download window on the screen. pct: the shown percentage; q: the "?" alpha; dim: wash for the end vote */
  function dlWindow(g, t, top, o) {
    var wy0 = top + 30, wy1 = SY1 - 26, wx0 = 160, wx1 = 860, th = 84, tall = wy1 - wy0;
    g.fillStyle = PURP2; g.fillRect(SX0, top, SX1 - SX0, SY1 - top);
    /* a hand-drawn wobble on the window's edge, seeded and slow */
    g.save(); g.translate(0, Math.sin(t * 1.3) * 2);
    rr(g, wx0 + 8, wy0 + 12, wx1 - wx0, wy1 - wy0, 18); g.fillStyle = 'rgba(0,0,0,.45)'; g.fill();
    rr(g, wx0, wy0, wx1 - wx0, wy1 - wy0, 18); g.fillStyle = PAPER; g.fill();
    g.save(); rr(g, wx0, wy0, wx1 - wx0, wy1 - wy0, 18); g.clip(); g.fillStyle = INK; g.fillRect(wx0, wy0, wx1 - wx0, th); g.restore();
    [HOT, ORG, TEAL].forEach(function (c, i) { g.fillStyle = c; g.beginPath(); g.arc(wx1 - 36 - i * 36, wy0 + th / 2, 11, 0, 6.283); g.fill(); });
    txt(g, 'GTA 6 · PC', wx0 + 30, wy0 + th / 2 + 2, { px: 60, rise: 0, ls: 3 });
    /* body: the "?" left, the stuck percentage right */
    var by = wy0 + th + (tall - th - 150) * .48, q = o.q == null ? 1 : o.q;
    bigQ(g, wx0 + 92, by, Math.min(250, (tall - th) * .56), q, t);
    g.save(); font(g, Math.min(176, (tall - th) * .42), 900); g.textAlign = 'right'; g.textBaseline = 'middle';
    var ps = o.pct + '%'; g.fillStyle = 'rgba(0,0,0,.18)'; g.fillText(ps, wx1 - 34, by + 8); g.fillStyle = HOT; g.fillText(ps, wx1 - 40, by); g.restore();
    /* a segmented installer bar: 25 hand-sized blocks, the last one blinking empty */
    var n = 25, bx0 = wx0 + 34, bw = (wx1 - wx0 - 68) / n, byb = wy1 - 92, fill = Math.round(n * o.pct / 100), blink = Math.floor(t * 2.5) % 2;
    rr(g, bx0 - 8, byb - 8, n * bw + 16, 64, 12); g.strokeStyle = INK; g.lineWidth = 5; g.stroke();
    for (var i = 0; i < n; i++) {
      var on = i < fill - 1 || (i === fill - 1 && o.pct >= 99 ? true : i < fill);
      if (i === n - 1) on = blink && o.pct >= 99;
      if (!on) continue; g.fillStyle = HOT; g.fillRect(bx0 + i * bw + 3, byb, bw - 6, 48);
    }
    g.restore();
    if (o.dim) { g.fillStyle = 'rgba(11,8,32,' + (.9 * o.dim).toFixed(3) + ')'; g.fillRect(SX0, top, SX1 - SX0, SY1 - top); }
  }
  function consoleBox(g, cx, name, t, ph, a, la) {
    if (a <= 0) return;
    g.save(); g.globalAlpha *= a;
    var led = .55 + .45 * Math.sin(t * 3 + ph);
    rr(g, cx - 140 + 6, 1226 + 9, 280, 196, 20); g.fillStyle = 'rgba(0,0,0,.4)'; g.fill();
    rr(g, cx - 140, 1226, 280, 196, 20); g.fillStyle = PURP2; g.fill();
    g.save(); g.globalAlpha *= .22 + .1 * led; rr(g, cx - 140, 1226, 280, 196, 20); g.fillStyle = TEAL; g.fill(); g.restore();
    rr(g, cx - 140, 1226, 280, 196, 20); g.strokeStyle = TEAL; g.lineWidth = 6; g.stroke();
    g.fillStyle = 'rgba(25,211,197,.45)'; g.fillRect(cx - 110, 1388, 220, 7);
    g.fillStyle = 'rgba(25,211,197,' + led.toFixed(3) + ')'; g.beginPath(); g.arc(cx + 106, 1258, 11, 0, 6.283); g.fill();
    g.restore();
    txt(g, name, cx, 1316, { px: 66, align: 'center', a: a * (la == null ? 1 : la), rise: 0, ls: 2 });
  }
  /* o: { top, off (0..1 CRT collapse), pct, q, scr: 'dl' | 'wait', dim, over: fn(g) drawn on the screen, shade } */
  function monitor(g, t, o) {
    o = o || {}; var top = o.top || 470, SY0 = top + 28, SCY = (SY0 + SY1) / 2;
    g.save();
    rr(g, 100 + 8, top + 12, 820, 1120 - top, 30); g.fillStyle = 'rgba(0,0,0,.42)'; g.fill();
    rr(g, 100, top, 820, 1120 - top, 30); g.fillStyle = PURP; g.fill(); g.strokeStyle = 'rgba(251,240,234,.32)'; g.lineWidth = 4; g.stroke();
    g.fillStyle = PURP2; g.fillRect(474, 1120, 72, 60); rr(g, 360, 1176, 300, 26, 13); g.fillStyle = PURP; g.fill();
    g.fillStyle = TEAL; g.beginPath(); g.arc(510, 1078, 9, 0, 6.283); g.fill();
    g.save(); rr(g, SX0, SY0, SX1 - SX0, SY1 - SY0, 14); g.clip();
    g.fillStyle = '#05030f'; g.fillRect(SX0, SY0, SX1 - SX0, SY1 - SY0);
    var off = o.off || 0, sy = Math.max(.012, 1 - eio(seg(off, 0, .6))), sx = 1 - eio(seg(off, .6, 1));
    if (sx > .001) {
      g.save(); g.translate(CX, SCY); g.scale(sx, sy); g.translate(-CX, -SCY);
      if (o.scr === 'wait') {
        g.fillStyle = PURP2; g.fillRect(SX0, SY0, SX1 - SX0, SY1 - SY0);
        for (var d = 0; d < 3; d++) { var dk = .35 + .65 * Math.max(0, Math.sin(t * 4 - d * .9)); g.fillStyle = 'rgba(251,240,234,' + dk.toFixed(3) + ')'; g.beginPath(); g.arc(CX - 110 + d * 110, SCY + 30, 34, 0, 6.283); g.fill(); }
      } else dlWindow(g, t, SY0, { pct: o.pct == null ? 99 : o.pct, q: o.q, dim: o.dim });
      if (o.over) o.over(g);
      if (off > 0) { g.fillStyle = 'rgba(255,255,255,' + (.85 * seg(off, .25, .6) * (1 - seg(off, .85, 1))).toFixed(3) + ')'; g.fillRect(SX0, SY0, SX1 - SX0, SY1 - SY0); }
      g.restore();
    }
    g.restore();
    if (o.shade) { rr(g, 100, top, 820, 1202 - top, 30); g.fillStyle = 'rgba(11,8,32,' + (.6 * o.shade).toFixed(3) + ')'; g.fill(); }
    g.restore();
  }
  function desk(g, t, a, la) {
    g.save(); g.globalAlpha *= a; g.fillStyle = 'rgba(251,240,234,.22)'; g.fillRect(100, 1208, 820, 6); g.restore();
    consoleBox(g, 250, 'PS5', t, 0, a, la); consoleBox(g, 770, 'XBOX', t, 1.7, a, la);
  }

  /* =====================================================================================================
     SCENE 1 · hook: the PC's GTA 6 download, stuck at 99 %; it jitters back, BAD NEWS on "bad", the screen clicks off
     ===================================================================================================== */
  var T = {};
  function rigScene(g, t, home) {
    var bad = home ? 1e9 : at('hook', 'bad');
    var jit = !home && t >= GT.stall && t < GT.stall + .32;
    var badA = home ? 0 : fin(t, bad), offK = home ? 0 : seg(t, GT.crt - .14, GT.crt + .12);
    /* the console names come in with the spoken "players" (frame 0 carries 4 words: GTA 6 · PC, 99%) */
    var la = home ? 0 : fin(t, at('hook', 'players') - .1);
    monitor(g, t, { top: 300, pct: jit ? 97 : 99, off: offK, over: function (gg) {
      chip(gg, 'BAD NEWS', CX, 640, { px: 108, wt: 900, bg: HOT, fg: BG, a: badA, s: pinS(t, bad), rot: -.03 });
    } });
    desk(g, t, 1, la);
  }

  /* =====================================================================================================
     SCENE 2 · page, pair, ask, boss … none: Rockstar's page, then the wait chart under its docked strip
     ===================================================================================================== */
  var PXM = 40, BX = 140;                                   /* 40 px per month of 30.44 days; every bar starts at x 140 */
  function mx(days) { return BX + days / 30.44 * PXM; }
  var SHORT = [
    { name: 'GTA 3 · 2001', n: 7, days: 210, mo: '~7 MO', ly: 615 },
    { name: 'VICE CITY · 2002', n: 6, days: 196, mo: '~6 MO', ly: 715 },
    { name: 'SAN ANDREAS · 2004', n: 7, days: 224, mo: '~7 MO', ly: 815 },
    { name: 'GTA 4 · 2008', n: 7, days: 217, mo: '~7 MO', ly: 915 }
  ];
  var V_DAYS = 574, V_LY = 1010, V_BY = 1034, V_BH = 56, R_DAYS = 375, R_LY = 1152, R_BY = 1172, G_LY = 1262, G_BY = 1286;
  /* GTA 5's bar at time t: to scale, eased from "PC" to "19", overshooting ~20 px past 574 days and settling */
  function vBar(t) {
    var L = mx(V_DAYS) - BX, k = eio(seg(qt(t), T.vpc, T.vland)), u = qt(t) - T.vland;
    var len = L * k + (u > 0 ? 30 * Math.exp(-u * 7) * Math.sin(u * 12) : 0);
    return { len: Math.max(0, len), mo: Math.min(18, Math.floor(L * k / PXM)) };
  }
  var PL = 705;                                             /* the plate: x 500–910, y 600–1000, right of the short bars */

  /* our re-creation of the page, never a screenshot: a cream RE-CREATED tag, top right, inside x 930 */
  function recreated(g, x, y, a) { chip(g, 'RE-CREATED', x, y, { px: 38, wt: 900, cond: true, bg: CREAM, fg: BG, a: a == null ? 1 : a, shadow: false, ls: 2, pad: 14 }); }
  function browser(g, t) {
    var two = at('page', 'two'), no = at('pair', 'no');
    rr(g, 110 + 8, 470 + 12, 800, 650, 26); g.fillStyle = 'rgba(0,0,0,.42)'; g.fill();
    rr(g, 110, 470, 800, 650, 26); g.fillStyle = PURP; g.fill(); g.strokeStyle = 'rgba(251,240,234,.32)'; g.lineWidth = 4; g.stroke();
    g.save(); rr(g, 110, 470, 800, 650, 26); g.clip(); g.fillStyle = PURP2; g.fillRect(110, 470, 800, 74); g.restore();
    [HOT, ORG, TEAL].forEach(function (c, i) { g.fillStyle = c; g.beginPath(); g.arc(152 + i * 32, 507, 10, 0, 6.283); g.fill(); });
    chip(g, 'ROCKSTARGAMES.COM/VI', 442, 507, { px: 38, wt: 800, cond: true, line: 'rgba(251,240,234,.45)', lw: 2, fill: 'rgba(11,8,32,.85)', fg: CREAM, shadow: false, ls: 2 });
    recreated(g, 806, 507);
    g.save(); font(g, 112, 900); wide(g); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = CREAM; g.fillText('GTA VI', CX, 622); g.restore();
    txt(g, 'COMING NOVEMBER 19, 2026', CX, 702, { px: 42, align: 'center', col: TEAL, ls: 2, rise: 0 });
    txt(g, 'PLATFORMS', 150, 776, { px: 40, ls: 3, rise: 0 });
    chip(g, '2', 402, 776, { px: 46, wt: 900, bg: HOT, fg: BG, a: fin(t, two - .05), s: pin(t, two - .05), shadow: false, pad: 18 });
    var SL = [{ y: 848, name: 'PLAYSTATION 5', t0: GT.slot1, f: at('pair', 'playstation') }, { y: 948, name: 'XBOX SERIES X|S', t0: GT.slot2, f: at('pair', 'xbox') }];
    SL.forEach(function (s, j) {
      /* the two empty slots pop in on "two"; they lock with a clack in the pause after "platforms." */
      var p0 = two - .05 + j * .12, k = eo(seg(t, p0, p0 + .16)), y = s.y - (1 - k) * 60;
      if (k <= 0) return;
      g.save(); g.globalAlpha *= clamp(k * 2, 0, 1);
      var fk = fin(t, s.f - .05);
      rr(g, 150, y - 40, 720, 80, 14); g.fillStyle = fk > 0 ? 'rgba(25,211,197,' + (fk).toFixed(3) + ')' : 'rgba(11,8,32,.6)'; g.fill();
      if (fk < 1) { g.globalAlpha *= 1; rr(g, 150, y - 40, 720, 80, 14); g.fillStyle = 'rgba(11,8,32,' + (.6 * (1 - fk)).toFixed(3) + ')'; g.fill(); }
      g.strokeStyle = fk > 0 ? TEAL : CREAM; g.lineWidth = 4; rr(g, 150, y - 40, 720, 80, 14); g.stroke();
      var lk = t >= s.t0 ? 1 - seg(t, s.t0, s.t0 + .35) : 0; if (lk > 0) { g.strokeStyle = 'rgba(25,211,197,' + lk.toFixed(3) + ')'; g.lineWidth = 10; rr(g, 150, y - 40, 720, 80, 14); g.stroke(); }
      var fl = t >= s.f ? 1 - seg(t, s.f, s.f + .3) : 0; if (fl > 0) { g.fillStyle = 'rgba(255,255,255,' + (.6 * fl).toFixed(3) + ')'; rr(g, 150, y - 40, 720, 80, 14); g.fill(); }
      g.restore();
      txt(g, s.name, CX, y + 2, { px: 52, align: 'center', col: BG, a: fk * k, s: pin(t, s.f - .05), ls: 2 });
    });
    /* the third, dashed slot appears on "No" */
    var pk = fin(t, no - .05);
    if (pk > 0) {
      g.save(); g.globalAlpha *= pk; rr(g, 150, 1008, 720, 80, 14); g.fillStyle = 'rgba(255,79,163,.12)'; g.fill();
      g.setLineDash([20, 12]); g.lineDashOffset = -t * 30; g.strokeStyle = HOT; g.lineWidth = 5; g.stroke(); g.setLineDash([]); g.restore();
      txt(g, 'PC', 190, 1050, { px: 52, col: CREAM, a: pk, ls: 2 });
    }
    stampText(g, 'NOT LISTED', 640, 1048, t, GT.notlisted, T.dock - .1, 58, HOT, -.05);
  }
  /* the docked strip: the page, in one line */
  function strip(g, t, a) {
    if (a <= 0) return;
    g.save(); g.globalAlpha *= a;
    rr(g, 110, 473, 800, 66, 14); g.fillStyle = 'rgba(36,18,80,.96)'; g.fill(); g.strokeStyle = 'rgba(251,240,234,.3)'; g.lineWidth = 2; g.stroke();
    g.restore();
    txt(g, 'GTA 6 PAGE: PS5 · XBOX SERIES X|S', 134, 507, { px: 40, a: a, rise: 0, ls: 1 });
    chip(g, 'NO PC', 846, 506, { px: 40, wt: 900, cond: true, bg: HOT, fg: BG, a: a, shadow: false, s: kn(t, at('none', 'pc')) });
  }
  function grid(g, t, a, dimK) {
    if (a <= 0) return;
    g.save(); g.globalAlpha *= a;
    g.fillStyle = 'rgba(251,240,234,.4)'; g.fillRect(BX - 2, 600, 4, 744);
    [[6, '6 MO'], [12, '1 YR'], [18, '18 MO']].forEach(function (m, i) {
      var x = BX + m[0] * PXM, fl = i === 1 && t >= GT.yr1 ? 1 - seg(t, GT.yr1, GT.yr1 + .5) : 0;
      g.fillStyle = 'rgba(251,240,234,' + (.13 + .5 * fl).toFixed(3) + ')'; g.fillRect(x - 1, 600, 2 + fl * 3, 744);
    });
    g.restore();
    [[6, '6 MO'], [12, '1 YR'], [18, '18 MO']].forEach(function (m, i) {
      var x = BX + m[0] * PXM, fl = i === 1 && t >= GT.yr1 ? kn(t, GT.yr1) : 1;
      txt(g, m[1], x, 1384, { px: 38, align: 'center', a: a * (1 - .3 * (dimK || 0)), rise: 0, s: fl, col: i === 1 && t >= GT.yr1 && t < GT.yr1 + .6 ? ORG : CREAM });
    });
  }
  function bar(g, x0, y, len, h, col, a) { if (a <= 0 || len <= 0) return; g.save(); g.globalAlpha *= a; rr(g, x0 + 4, y + 6, len, h, h * .22); g.fillStyle = 'rgba(0,0,0,.35)'; g.fill(); rr(g, x0, y, len, h, h * .22); g.fillStyle = col; g.fill(); g.restore(); }
  function gtaRow(g, t, a) {
    if (a <= 0) return;
    var w = 34 + 14 * Math.sin(t * 3.1), q = (GT.qblip != null && t >= GT.qblip ? kn(t, GT.qblip) : 1) * kn(t, at('boss', 'says')) * kn(t, at('boss', 'starts')) * kn(t, at('boss', 'console')) * kn(t, at('ask', 'wait'));
    txt(g, 'GTA 6 · NOV 19, 2026', BX, G_LY, { px: 40, a: a, rise: 0, ls: 1, s: kn(t, at('none', 'gta')) });
    g.save(); g.globalAlpha *= a;
    /* the open bar: a pink stub that never closes, and a fading dashed trail */
    rr(g, BX, G_BY, w, 40, 9); g.fillStyle = HOT; g.fill();
    g.setLineDash([16, 12]); g.lineDashOffset = -t * 40; g.lineWidth = 4;
    var gr = g.createLinearGradient(BX + w, 0, 500, 0); gr.addColorStop(0, 'rgba(255,79,163,.7)'); gr.addColorStop(1, 'rgba(255,79,163,0)'); g.strokeStyle = gr;
    g.beginPath(); g.moveTo(BX + w + 8, G_BY + 20); g.lineTo(500, G_BY + 20); g.stroke(); g.setLineDash([]);
    g.fillStyle = TEAL; g.beginPath(); g.arc(BX, G_BY + 20, 12, 0, 6.283); g.fill();
    g.restore();
    var blink = (Math.floor(t * 3) % 2) ? 1 : .55;
    bigQ(g, BX + w + 46, G_BY + 20, 72 * q, a * blink, t);
  }
  function plateQuote(g, t) {
    var a0 = T.cardIn, a1 = GT.cardout;
    var kin = eo(seg(t, a0 - .25, a0)), kout = eio(seg(t, a1, a1 + .3));
    if (kin <= 0 || kout >= 1) return;
    var y = lerp(1500, 0, kin) - kout * 900, rot = lerp(.06, -.015, kin);
    g.save(); g.globalAlpha *= 1 - kout; g.translate(CX, 860 + y); g.rotate(rot);
    rr(g, -386 + 8, -230 + 12, 772, 460, 22); g.fillStyle = 'rgba(0,0,0,.45)'; g.fill();
    rr(g, -386, -230, 772, 460, 22); g.fillStyle = PAPER; g.fill();
    g.fillStyle = HOT; g.fillRect(-386, -230, 16, 460);
    g.restore();
    var s = kn(t, at('boss', 'always'));
    g.save(); g.globalAlpha *= 1 - kout; g.translate(CX, 860 + y); g.rotate(rot); g.scale(s, s);
    cond(g); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = INK;
    font(g, 88, 900); ls(g, 1);
    /* ALWAYS gets a pink highlight on its spoken word, CONSOLE on its own */
    var w1 = g.measureText('“ROCKSTAR ').width, w2 = g.measureText('ALWAYS').width, x0 = 6 - (w1 + w2) / 2, hA = seg(t, at('boss', 'always') - .05, at('boss', 'always') + .1);
    if (hA > 0) { g.save(); g.globalAlpha *= hA; g.fillStyle = HOT; rr(g, x0 + w1 - 10, -138 - 50, w2 + 20, 98, 14); g.fill(); g.restore(); }
    g.textAlign = 'left'; g.fillText('“ROCKSTAR ', x0, -138); g.fillText('ALWAYS', x0 + w1, -138); g.textAlign = 'center';
    g.fillText('STARTS ON', 6, -50);
    var cs = kn(t, at('boss', 'console')); g.save(); g.translate(6, 38); g.scale(cs, cs); g.fillStyle = '#c2186b'; g.fillText('CONSOLE…”', 0, 0); g.restore();
    g.fillStyle = INK; font(g, 40, 900); ls(g, 2); g.fillText('STRAUSS ZELNICK · TAKE-TWO CEO', 6, 126);
    g.fillStyle = '#5d586e'; font(g, 38, 700); g.fillText('TO BLOOMBERG · VIA VGC, MAY 2026', 6, 178);
    g.restore(); g.__st = null;
  }
  function wheelsNum(g, cx, cy, v, landed, a) {
    if (a <= 0) return;
    g.save(); g.globalAlpha *= a; font(g, 236, 900); g.textAlign = 'center'; g.textBaseline = 'middle';
    var s = landed ? kn(t0Land, 0) : 1;
    g.fillStyle = 'rgba(0,0,0,.35)'; g.fillText(String(v), cx + 8, cy + 12);
    g.fillStyle = landed ? ORG : CREAM; g.fillText(String(v), cx, cy); g.restore();
  }
  var t0Land = 0;
  function chartScene(g, t) {
    var dock = T.dock, i;
    var none0 = at('none', 'gta'), dimK = eio(seg(t, none0 - .1, none0 + .4));
    var cardK = eio(seg(t, dock - .3, dock + .2));
    /* --- page phase: the browser card, then it folds into the strip --- */
    if (cardK < 1) {
      g.save(); g.globalAlpha *= 1 - cardK; g.translate(CX, lerp(795, 505, cardK)); g.scale(lerp(1, .4, cardK), lerp(1, .12, cardK)); g.translate(-CX, -795);
      browser(g, t); g.restore();
      credit(g, 'READ 31 OCT 2026', CX, 1160, fin(t, S('board').t0 + .4) * (1 - cardK));
      /* the PC, small, waiting under the page */
      var mA = 1 - cardK, ask = at('ask', 'wait');
      if (mA > 0) {
        g.save(); g.globalAlpha *= mA; g.translate(CX, 1206); g.scale(.3, .3); g.translate(-CX, -470);
        monitor(g, t, { scr: 'wait', top: 470, shade: .15, over: function (gg) { bigQ(gg, CX, 790, 300 * kn(t, ask), fin(t, start('ask')), t, CREAM); } });
        g.restore();
        chip(g, 'PC', 742, 1310, { px: 48, wt: 900, bg: CREAM, fg: BG, a: mA, shadow: false, pad: 20, s: kn(t, at('ask', 'pc')) });
      }
    }
    /* --- chart phase --- */
    var cA = fin(t, dock - .1);
    if (cA <= 0) return;
    var stripA = cA * (1 - eio(seg(t, T.plate - .2, T.plate + .15)));
    strip(g, t, stripA);
    grid(g, t, cA, dimK);
    var rowDim = 1 - .62 * dimK;
    /* fast: four short bars, to scale, each growing on its beat of "GTA 3 to GTA 4"; month tags cream on ink */
    var lastMo = null, lastT = -1;
    SHORT.forEach(function (r, j) {
      var tg = T.fast[j], k = eo(seg(t, tg - .05, tg + .45)), la = fin(t, tg - .1) * rowDim;
      if (la <= 0) return;
      if (t >= tg + .4) { lastMo = r.n; lastT = tg + .4; }
      txt(g, r.name, BX, r.ly, { px: 40, a: la, rise: 0, ls: 1 });
      bar(g, BX, r.ly + 22, (mx(r.days) - BX) * k, 44, HOT, rowDim);
      var fl = GT['f' + j] != null && t >= GT['f' + j] ? kn(t, GT['f' + j]) : 1;
      chip(g, r.mo, mx(r.days) - 52, r.ly + 44, { px: 36, wt: 900, cond: true, bg: 'rgba(11,8,32,.92)', fg: CREAM, shadow: false, pad: 10, a: fin(t, tg + .4) * rowDim, s: fl, ls: 1 });
    });
    /* the 8-month line, from the top row down through the GTA 5 row; GTA 5's bar cracks through it */
    var eA = fin(t, at('fast', 'eight') - .05) * rowDim, x8 = BX + 8 * PXM;
    if (eA > 0) {
      var ek = eo(seg(t, at('fast', 'eight') - .05, at('fast', 'eight') + .4)), jx = Math.max(0, knock(t, T.crack, 30, 9)) * 7;
      var broke = t >= T.crack, gapK = eo(seg(t, T.crack, T.crack + .25));
      g.save(); g.globalAlpha *= eA; g.setLineDash([14, 10]); g.strokeStyle = ORG; g.lineWidth = 4;
      var yEnd = 606 + 630 * ek;
      g.beginPath();
      if (!broke) { g.moveTo(x8, 606); g.lineTo(x8, yEnd); }
      else {
        /* the line, jolted locally, with a hole where the bar went through */
        g.moveTo(x8, 606); g.lineTo(x8, 950); g.lineTo(x8 + jx, V_BY - 14 - 40 * gapK);
        g.moveTo(x8 + jx, V_BY + V_BH + 14 + 40 * gapK); g.lineTo(x8, 1110); g.lineTo(x8, yEnd);
      }
      g.stroke(); g.setLineDash([]); g.restore();
      txt(g, '8 MO', x8, 584, { px: 38, align: 'center', col: ORG, a: eA, rise: 0, s: kn(t, GT.under8) * kn(t, T.crack) });
      /* splinters: seeded shards of the line flying off the impact, gone in 0.7 s */
      if (broke && t < T.crack + .7) {
        var u = t - T.crack, rs = mulberry(41);
        g.save(); g.beginPath(); g.rect(100, 560, 810, 860); g.clip(); g.fillStyle = ORG;
        for (var sh = 0; sh < 9; sh++) {
          var ang = -1.3 + rs() * 2.6, v = 260 + rs() * 320, sx = x8 + Math.cos(ang) * v * u, sy = V_BY + 28 + Math.sin(ang) * v * u * .7 + 700 * u * u;
          g.globalAlpha = eA * (1 - u / .7); g.save(); g.translate(sx, sy); g.rotate(u * (6 + rs() * 8)); g.fillRect(-9, -3, 18, 6); g.restore();
        }
        g.restore();
      }
    }
    /* ALL UNDER 8 MONTHS: in the empty band under the short rows while they land */
    var uA = fin(t, at('fast', 'under') - .05) * out(t, T.vpc + .1, .3);
    chip(g, 'ALL UNDER', PL, 1104, { px: 58, wt: 900, bg: CREAM, fg: BG, a: uA, s: pinS(t, at('fast', 'under') - .05) * kn(t, GT.under8), rot: -.02 });
    chip(g, '8 MONTHS', PL, 1190, { px: 58, wt: 900, bg: ORG, fg: BG, a: uA, s: pinS(t, at('fast', 'eight') - .05) * kn(t, GT.under8), rot: .015 });
    /* the counter: one number in the plate. ~7 → ~6 → ~7 → ~7 as the short bars land, then it climbs with GTA 5's bar to 19 */
    var tw = at('twice', 'two'), V = vBar(t), climbing = t >= T.vpc && V.mo >= 7, landed = t >= T.vland;
    var cntA = (lastMo != null ? fin(t, T.fast[0] + .35) : 0) * out(t, tw + .1, .3) * (1 - .55 * dimK);
    if (cntA > 0) {
      var val = landed ? 19 : climbing ? Math.max(7, V.mo) : lastMo, str = (landed || climbing) ? String(val) : '~' + val;
      var px = landed ? 236 : climbing ? lerp(150, 230, clamp((val - 7) / 12, 0, 1)) : 150;
      var ks = landed ? kn(t, T.vland) : (!climbing ? kn(t, lastT) : 1);
      g.save(); g.globalAlpha *= cntA; g.translate(PL, 770); g.scale(ks, ks); font(g, Math.round(px), 900); g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillStyle = 'rgba(0,0,0,.35)'; g.fillText(str, 8, 12); g.fillStyle = landed ? ORG : CREAM; g.fillText(str, 0, 0); g.restore();
      txt(g, 'ALMOST', PL, 640, { px: 60, align: 'center', a: cntA * fin(t, T.vland + .02), ls: 4 });
      txt(g, 'MONTHS', PL, 906, { px: 60, align: 'center', a: cntA, ls: 4, rise: 0 });
    }
    /* hero: GTA 5's bar, from "PC" to "19", through the 8 MO line, overshooting ~20 px and settling at 574 days */
    var vA = fin(t, at('hero', 'gta') - .1) * (1 - .55 * dimK);
    if (vA > 0) {
      txt(g, 'GTA 5 · 2013', BX, V_LY, { px: 46, a: vA, rise: 0, ls: 1, s: kn(t, at('hero', 'gta')) });
      bar(g, BX, V_BY, V.len, V_BH, HOT, vA);
      var cf = t >= T.crack ? 1 - seg(t, T.crack, T.crack + .3) : 0, hf = t >= T.vland ? 1 - seg(t, T.vland, T.vland + .35) : 0, ff = Math.max(cf, hf);
      if (ff > 0) { g.save(); g.fillStyle = 'rgba(255,255,255,' + (.6 * ff).toFixed(3) + ')'; rr(g, BX, V_BY, V.len, V_BH, 12); g.fill(); g.restore(); }
      /* in the pause after "months.": the days roll with the ratchet, then the 574 DAYS stamp (secondary, under the bar) */
      var dk = seg(qt(t), GT.ratchet, GT.ratchet + .34), dA = (t >= GT.ratchet && t < GT.hero + .05 ? 1 : 0) * vA;
      if (dA > 0) txt(g, Math.round(574 * eio(dk)) + ' DAYS', PL, 1138, { px: 48, align: 'center', a: dA, rise: 0, ls: 3 });
      stampText(g, '574 DAYS', PL, 1138, t, GT.hero, at('rdr', 'red') - .2, 46, CREAM, -.03);
      /* twice: pins on the bar, the years above it; three cards in the plate */
      var p1 = at('twice', 'two'), p2 = at('twice', 'generations'), p3 = at('twice', 'first'), pc = GT.pcpin, cOut = at('rdr', 'just') - .2;
      var cA1 = fin(t, p1 - .05) * out(t, cOut, .3);
      if (cA1 > 0 || t >= p1) {
        var pinA = (1 - .55 * dimK);
        /* 2013 is in the row's own label, left of the first pin */
        [[BX, p1, null, TEAL, 'left'], [mx(427), p2, '2014', TEAL, 'center'], [mx(V_DAYS), pc, '2015', HOT, 'right']].forEach(function (P) {
          var a = fin(t, P[1] - .05) * pinA; if (a <= 0) return;
          g.save(); g.globalAlpha *= a; g.fillStyle = P[3]; g.fillRect(P[0] - 3, V_BY - 6, 6, V_BH + 12); g.restore();
          if (P[2]) txt(g, P[2], P[4] === 'right' ? P[0] + 10 : P[0], 1004, { px: 40, align: P[4], col: CREAM, a: a, rise: 0, s: kn(t, P[1]) });
        });
        chip(g, '2013 · PS3 · XBOX 360', PL, 652, { px: 46, wt: 900, cond: true, bg: TEAL, fg: BG, a: cA1, s: pinS(t, p1 - .05), maxw: 390, w: 390 });
        chip(g, '2014 · PS4 · XBOX ONE', PL, 754, { px: 46, wt: 900, cond: true, bg: TEAL, fg: BG, a: fin(t, p2 - .05) * out(t, cOut, .3), s: pinS(t, p2 - .05), maxw: 390, w: 390 });
        chip(g, '2015 · PC', PL, 856, { px: 50, wt: 900, cond: true, bg: HOT, fg: BG, a: fin(t, p3 - .05) * out(t, cOut, .3), s: pinS(t, p3 - .05) * kn(t, pc), maxw: 390, w: 390 });
      }
      /* the hero number stays on its bar once the plate moves on */
      chip(g, 'ALMOST 19 MO', CX + 20, V_BY + V_BH / 2, { px: 40, wt: 900, cond: true, bg: 'rgba(11,8,32,.92)', fg: CREAM, shadow: false, pad: 12, a: fin(t, tw - .1) * vA, ls: 2 });
    }
    /* rdr: Red Dead 2's bar, to just past one year */
    var rA = fin(t, at('rdr', 'red') - .1) * (1 - .55 * dimK);
    if (rA > 0) {
      txt(g, 'RED DEAD 2 · 2018', BX, R_LY, { px: 40, a: rA, rise: 0, ls: 1, s: kn(t, at('rdr', 'red')) });
      var rk = eio(seg(qt(t), at('rdr', 'just') - .05, T.rland)), over = t > T.rland ? Math.max(0, knock(t, GT.rdrland - .02, 18, 7)) * 6 : 0;
      bar(g, BX, R_BY, (mx(R_DAYS) - BX) * rk + over, 44, HOT, rA);
      chip(g, '12 MO', mx(R_DAYS) - 56, R_BY + 22, { px: 36, wt: 900, cond: true, bg: 'rgba(11,8,32,.92)', fg: CREAM, shadow: false, pad: 10, a: fin(t, GT.rdrland) * rA, s: kn(t, GT.rdrland), ls: 1 });
    }
    /* JUST OVER A YEAR: on "just", cleared before "And" */
    var jA = fin(t, at('rdr', 'just') - .05) * out(t, start('none') - .05, .3);
    chip(g, 'JUST OVER', PL, 700, { px: 58, wt: 900, bg: CREAM, fg: BG, a: jA, s: pinS(t, at('rdr', 'just') - .05), rot: -.02 });
    chip(g, 'A YEAR', PL, 794, { px: 58, wt: 900, bg: ORG, fg: BG, a: jA, s: pinS(t, at('rdr', 'year') - .05) * kn(t, GT.rdrland), rot: .015 });
    /* none: the strip opens back into the page card; NO PC DATE on its PC slot */
    var pA = fin(t, T.plate - .05);
    if (pA > 0) {
      var ps = lerp(.6, 1, eo(seg(t, T.plate - .2, T.plate + .25)));
      g.save(); g.globalAlpha *= pA; g.translate(PL, 600); g.scale(ps, ps); g.translate(-PL, -600);
      rr(g, 500 + 6, 600 + 9, 410, 372, 20); g.fillStyle = 'rgba(0,0,0,.4)'; g.fill();
      rr(g, 500, 600, 410, 372, 20); g.fillStyle = PURP; g.fill(); g.strokeStyle = 'rgba(251,240,234,.32)'; g.lineWidth = 3; g.stroke();
      g.restore();
      g.save(); g.globalAlpha *= pA; g.translate(PL, 600); g.scale(ps, ps); g.translate(-PL, -600);
      txt(g, 'GTA 6 PAGE', 522, 646, { px: 38, col: TEAL, rise: 0, ls: 2 });
      recreated(g, 806, 646);
      [['PLAYSTATION 5', 722], ['XBOX SERIES X|S', 806]].forEach(function (R) {
        rr(g, 524, R[1] - 34, 362, 68, 12); g.fillStyle = TEAL; g.fill();
        txt(g, R[0], PL, R[1] + 1, { px: 42, align: 'center', col: BG, rise: 0, ls: 1 });
      });
      rr(g, 524, 856, 362, 68, 12); g.fillStyle = 'rgba(255,79,163,.12)'; g.fill(); g.setLineDash([16, 10]); g.lineDashOffset = -t * 30; g.strokeStyle = HOT; g.lineWidth = 4; g.stroke(); g.setLineDash([]);
      txt(g, 'PC', 536, 891, { px: 40, rise: 0, ls: 2, a: 1 - fin(t, T.nopc - .1) });   /* the stamp names the slot once it lands */
      g.restore();
      stampText(g, 'NO PC DATE', 732, 890, t, T.nopc, DUR, 40, HOT, -.05);
    }
    /* the GTA 6 row: from the dock to the end, with its open bar */
    gtaRow(g, t, cA);
    /* our math, small, at the GTA 6 row's end */
    var oA = fin(t, T.math) * cA;
    if (oA > 0) {
      g.save(); g.globalAlpha *= oA; rr(g, 536, 1236, 374, 132, 14); g.fillStyle = 'rgba(11,8,32,.92)'; g.fill(); g.setLineDash([10, 8]); g.strokeStyle = 'rgba(251,240,234,.55)'; g.lineWidth = 2; g.stroke(); g.setLineDash([]); g.restore();
      txt(g, 'IF PAST GAPS REPEAT:', 723, 1262, { px: 38, align: 'center', a: oA, rise: 0, ls: 1, wt: 800, col: 'rgba(251,240,234,.85)' });
      txt(g, 'MID-2027 TO MID-2028', 723, 1302, { px: 38, align: 'center', a: oA, rise: 0, ls: 1, col: ORG });
      txt(g, 'OUR MATH, NOT ROCKSTAR', 723, 1342, { px: 38, align: 'center', a: oA, rise: 0, ls: 1, wt: 800, col: 'rgba(251,240,234,.85)' });
    }
    /* boss: the quote card over the chart */
    plateQuote(g, t);
  }

  /* =====================================================================================================
     SCENE 3 · end: the frame-0 PC again, WAIT / BUY A CONSOLE on its screen, neither picked; dissolves into frame 0
     ===================================================================================================== */
  function endScene(g, t) {
    var s0 = S('end').t0, wt = at('end', 'wait'), by = at('end', 'buy'), v0 = s0 + .2;
    monitor(g, t, { top: 470, pct: 99, dim: .8, over: function (gg) {
      chip(gg, 'GTA 6 · NOV 19, 2026', CX, 586, { px: 46, wt: 900, cond: true, line: CREAM, lw: 3, fill: 'rgba(11,8,32,.9)', fg: CREAM, a: fin(t, s0 + .1), shadow: false, ls: 2 });
      /* the vote: both options land together, same style, neither picked */
      chip(gg, 'WAIT', CX, 730, { px: 92, wt: 900, bg: CREAM, fg: BG, a: fin(t, v0), s: pin(t, v0) * kn(t, wt), rot: -.02 });
      txt(gg, 'OR', CX, 826, { px: 44, align: 'center', a: fin(t, v0), rise: 0, ls: 4 });
      chip(gg, 'BUY A CONSOLE', CX, 920, { px: 92, wt: 900, bg: CREAM, fg: BG, a: fin(t, v0), s: pin(t, v0) * kn(t, by), rot: .02, maxw: 720 });
    } });
    desk(g, t, 1, 1);
  }

  /* ---------- captions (the voice, phrase by phrase; the hook line is carried by the picture) ---------- */
  var CAPS = (function () {
    var outc = [];
    VO.lines.forEach(function (l) {
      if (l.id === 'hook') return;
      var cur = [], ws = l.words.slice();
      /* the voice says "X and S"; the caption prints X|S */
      for (var i = 0; i < ws.length - 2; i++) if (ws[i].w === 'X' && norm(ws[i + 1].w) === 'and' && /^S/.test(ws[i + 2].w)) { ws.splice(i, 3, { w: 'X|' + ws[i + 2].w, t0: ws[i].t0, t1: ws[i + 2].t1 }); }
      ws.forEach(function (w, i) {
        cur.push(w);
        if (/[.?!:]$/.test(w.w) && i < ws.length - 1) { outc.push(cur); cur = []; }
      });
      if (cur.length) outc.push(cur);
    });
    return outc.map(function (ws) { return { t0: ws[0].t0, t1: ws[ws.length - 1].t1, words: ws }; });
  })();
  var STRESS;
  function stressed(w) { for (var i = 0; i < STRESS.length; i++) if (Math.abs(STRESS[i] - w.t0) < .02) return true; return false; }
  function wipeHide(t) {
    var a = 1; SC.forEach(function (sc) { if (sc.swipe) a = Math.min(a, 1 - seg(t, sc.t0 - SWIPE - .14, sc.t0 - SWIPE) * (1 - seg(t, sc.t0 + .02, sc.t0 + .14))); });
    return a;
  }
  var GLUE = { the: 1, a: 1, an: 1, your: 1, its: 1, of: 1, at: 1, to: 1, and: 1, in: 1, with: 1, on: 1, by: 1, so: 1, for: 1, own: 1, how: 1 };
  function captions(g, t, alpha) {
    var card0 = null, ci = -1;
    CAPS.forEach(function (c, i) { if (t >= c.t0 - .04) { card0 = c; ci = i; } });
    if (!card0) return;
    var nx = CAPS[ci + 1], ns = nx ? nx.t0 - .04 : 1e9, o1 = Math.min(card0.t1 + .5, ns - .12), o0 = Math.min(card0.t1 + .35, o1 - .12);
    var fi = seg(t, card0.t0 - .04, card0.t0 + .06), outk = 1 - seg(t, o0, o1);
    if (fi * outk <= 0) return;
    var k = clamp(spring(t - card0.t0 + .04, 3.2, .8), 0, 1.04);
    g.save(); g.font = '800 72px Archivo'; wide(g);
    g.textBaseline = 'alphabetic';
    var words = card0.words, ws = words.map(function (w) { return g.measureText(w.w).width; }), gap = 20;
    var lines, lw, maxw = 740, cpx = 72;
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
    var lh = cpx * 1.16, y0 = 392 - (lines.length - 1) * lh / 2;
    g.globalAlpha = fi * outk * wipeHide(t) * (alpha == null ? 1 : alpha);
    lines.forEach(function (ln, li) {
      var x = CX - (lw[li] - gap) / 2, y = y0 + li * lh + (1 - Math.min(1, k)) * 36;
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
  var NOISE, SWIPE = .42, PRE = .3, SC, HOME;
  function S(id) { for (var i = 0; i < SC.length; i++) if (SC[i].id === id) return SC[i]; }
  var SCENES = { rig: function (g, t) { rigScene(g, t, false); }, board: chartScene, end: endScene };
  function stage(g) { g.fillStyle = BG; g.fillRect(0, 0, W, H); }
  function sceneAt(t) { for (var i = SC.length - 1; i >= 0; i--) if (t >= SC[i].t0) return i; return 0; }
  function drawScene(g, Sc, t) {
    g.save();
    if (Sc.id === 'board') { var push = 1 + .012 * seg(t, Sc.t0, Sc.t1); g.translate(CX, 950); g.scale(push, push); g.translate(-CX, -950); }
    SCENES[Sc.id](g, t);
    g.restore();
  }
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
      g.save(); g.lineJoin = 'round'; g.beginPath(); g.rect(90, 0, 840, 1448); g.clip();
      [[HOT, 10, 0], [TEAL, 6, 16]].forEach(function (c) { g.strokeStyle = c[0]; g.lineWidth = c[1]; g.beginPath(); for (x = 0; x <= W; x += 30) { var yy = edgeY(x, ly, t) + c[2]; if (x === 0) g.moveTo(x, yy); else g.lineTo(x, yy); } g.stroke(); });
      g.restore();
    }
    var back = eio(seg(t, HOME, HOME + .35));
    if (back > 0) { g.save(); g.globalAlpha = back; stage(g); g.translate(CX, 950); g.scale(lerp(.96, 1, back), lerp(.96, 1, back)); g.translate(-CX, -950); rigScene(g, 0, true); g.restore(); }
    if (POSTERMODE) posterTitle(g);
    else if (LIVE.text) { if (back > 0) captions(g, t, 1 - back); else captions(g, t); }
    if (!POSTERMODE) {
      g.fillStyle = 'rgba(251,240,234,.12)'; g.fillRect(90, 222, 840, 6);
      g.fillStyle = HOT; g.fillRect(90, 222, 840 * (back > 0 ? 1 - back : t / DUR), 6);
    }
    if (LIVE.grain && NOISE) { g.globalAlpha = .05; g.globalCompositeOperation = 'overlay'; var o = Math.floor(t * 24) * 37 % 256; g.fillStyle = g.createPattern(NOISE, 'repeat'); g.translate(-o, -o); g.fillRect(o, o, W, H); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }
  }
  function posterTitle(g) {
    /* the headline starts at y 320, under TikTok's top bar */
    g.save(); g.fillStyle = 'rgba(11,8,32,.96)'; g.fillRect(90, 320, 840, 146); font(g, 62, 900); wide(g); g.textBaseline = 'alphabetic'; g.textAlign = 'center';
    g.fillStyle = CREAM; g.fillText('GTA 6 ON PC?', CX, 380);
    font(g, 46, 900); wide(g);
    var b = 'GTA 5 MADE PC WAIT', wb = g.measureText(b).width;
    g.fillStyle = HOT; g.beginPath(); g.roundRect(CX - wb / 2 - 16, 398, wb + 32, 62, 14); g.fill();
    g.fillStyle = BG; g.fillText(b, CX, 444); g.restore();
  }
  function TEXTS(t) {
    var o = [];
    function Tx(id, text, a, b) { if (t >= a && t < b) o.push({ id: id, text: text, x0: 0, y0: 0, x1: 0, y1: 0 }); }
    var b0 = S('board').t0, e0 = S('end').t0;
    Tx('win', 'GTA 6 · PC 99%', 0, b0 - .3); Tx('win', 'GTA 6 · PC 99%', HOME + .3, DUR + 1);
    Tx('cons', 'PS5 XBOX', at('hook', 'players') + .1, b0 - .3); Tx('cons', 'PS5 XBOX', e0, DUR + 1);
    Tx('url', 'ROCKSTARGAMES.COM/VI', b0, T.dock - .1);
    Tx('com', 'COMING NOVEMBER 19, 2026', b0, T.dock - .1);
    Tx('read', 'READ 31 OCT 2026', b0 + .5, T.dock - .1);
    Tx('ps5', 'PLAYSTATION 5', at('pair', 'playstation') + .1, T.dock - .1);
    Tx('xbx', 'XBOX SERIES X|S', at('pair', 'xbox') + .1, T.dock - .1);
    Tx('nl', 'NOT LISTED', GT.notlisted + .05, T.dock - .1);
    Tx('strip', 'GTA 6 PAGE: PS5 · XBOX SERIES X|S NO PC', T.dock + .1, T.plate - .1);
    Tx('quote', '“ROCKSTAR ALWAYS STARTS ON CONSOLE…”', T.cardIn - .1, GT.cardout + .1);
    Tx('who', 'STRAUSS ZELNICK · TAKE-TWO CEO', T.cardIn - .1, GT.cardout + .1);
    Tx('src', 'TO BLOOMBERG · VIA VGC, MAY 2026', T.cardIn - .1, GT.cardout + .1);
    Tx('g6', 'GTA 6 · NOV 19, 2026', T.dock + .1, e0 - .2);
    SHORT.forEach(function (r, j) { Tx('r' + j, r.name, T.fast[j] + .05, e0 - .2); Tx('m' + j, r.mo, T.fast[j] + .5, e0 - .2); });
    Tx('cnt', '~7 MONTHS', T.fast[0] + .5, T.vpc);
    Tx('u8', 'ALL UNDER 8 MONTHS', at('fast', 'under') + .1, T.vpc + .05);
    Tx('v', 'GTA 5 · 2013', at('hero', 'gta') + .05, e0 - .2);
    Tx('hero', 'ALMOST 19 MONTHS', T.vland + .1, at('twice', 'two') + .02);
    Tx('days', '574 DAYS', GT.hero + .1, at('rdr', 'red') - .2);
    Tx('c1', '2013 · PS3 · XBOX 360', at('twice', 'two') + .1, at('rdr', 'just') - .35);
    Tx('y45', '2014 2015', GT.pcpin + .1, e0 - .2);
    Tx('c2', '2014 · PS4 · XBOX ONE', at('twice', 'generations') + .1, at('rdr', 'just') - .35);
    Tx('c3', '2015 · PC', at('twice', 'first') + .1, at('rdr', 'just') - .35);
    Tx('a19', 'ALMOST 19 MO', at('twice', 'two') + .1, e0 - .2);
    Tx('rdr', 'RED DEAD 2 · 2018', at('rdr', 'red') + .05, e0 - .2);
    Tx('r12', '12 MO', GT.rdrland + .1, e0 - .2);
    /* JUST OVER A YEAR shows with the caption that says the same words, and clears before "And" (jury r1): not timed here */
    Tx('math', 'IF PAST GAPS REPEAT: MID-2027 TO MID-2028 OUR MATH, NOT ROCKSTAR', T.math + .15, e0 - .2);
    /* the page card's slots were read at 7.5–13.8 s; only its heading and the PC slot are new here */
    Tx('pg', 'GTA 6 PAGE · PC', T.plate + .1, e0 - .2);
    Tx('nopc', 'NO PC DATE', T.nopc + .05, e0 - .2);
    Tx('vote', 'WAIT OR BUY A CONSOLE', e0 + .4, HOME);
    Tx('nov', 'GTA 6 · NOV 19, 2026', e0 + .25, HOME);
    return o;
  }

  /* ---------- events: hits placed in real pauses of the voice (vo/vad.js); beats with no free pause stay silent ---------- */
  function initTimes() {
    SC = [
      { id: 'rig', name: 'Bad news', t0: 0 },
      { id: 'board', name: 'The wait chart', t0: start('page') - .05, swipe: true },
      { id: 'end', name: 'Wait or buy', t0: start('end') - .05, swipe: true }
    ];
    SC.forEach(function (s, i) { s.t1 = i + 1 < SC.length ? SC[i + 1].t0 : DUR; });
    HOME = DUR - .45;
    /* frame 0: the PC's power blip, before the first word and under it in level */
    G('on', .04, 'pop', .06, .45);
    /* hook: the download stutters in the comma after "6,"; the screen clicks off after "news." */
    G('stall', vadEndBefore(at('hook', 'pc'), .5) + .155, 'tick', .06, .9);
    G('crt', after('hook'), 'crt', .12, .9);
    /* page: the two platform slots drop in after "platforms." */
    G('slot1', after('page'), 'clack', .1, .9); G('slot2', GT.slot1 + .13, 'clack', .05, .8);
    /* pair: NOT LISTED stamps the PC slot after "No PC." */
    G('notlisted', after('pair'), 'stamp', .1, 1);
    /* ask: the page docks and the quote card lands after "wait?" */
    T.cardIn = G('card', after('ask'), 'paper', .12, 1); T.dock = T.cardIn;
    /* boss: the card leaves after "console." */
    G('cardout', after('boss') + .02, 'whoosh', .1, .9);
    /* fast: the four bars on "GTA 3 to GTA 4"; their labels flash with four ticks after "each.", the 8 MO line knocks */
    T.fast = [at('fast', '3'), (at('fast', '3') + at('fast', 'gta', 1)) / 2, at('fast', 'gta', 1), at('fast', '4')];
    var f0 = after('fast');
    [0, 1, 2, 3].forEach(function (j) { G('f' + j, f0 + j * .075, 'tick', .03, .9 + j * .08); });
    G('under8', f0 + .3, 'clack', .08, .9);
    /* hero: GTA 5's bar runs from "PC" and lands on "19"; ratchet as the bracket measures it, then the 574 DAYS stamp */
    T.vpc = at('hero', 'pc'); T.vland = at('hero', '19') + .08;
    /* the moment GTA 5's bar reaches the 8 MO line (eio inverse) */
    (function () { var f = 8 * PXM / (mx(V_DAYS) - BX), u = f < .5 ? Math.cbrt(f / 4) : 1 - Math.cbrt((1 - f) / 4); T.crack = T.vpc + u * (T.vland - T.vpc); })();
    G('ratchet', after('hero'), 'ratchet', .1, 1);
    G('hero', GT.ratchet + .37, 'stamp', .12, 1.6, { heavy: true });
    /* twice: the PC pin pops after "first." */
    G('pcpin', after('twice'), 'pop', .12, 1);
    /* rdr: the 1 YR line ticks after "2018?"; the bar settles with a clack after "year." */
    G('yr1', vadEndBefore(at('rdr', 'just'), at('rdr', '2018')) + .155, 'tick', .05, .9);
    T.rland = at('rdr', 'year') + .3; G('rdrland', after('rdr'), 'clack', .12, 1);
    T.math = at('rdr', 'just') + .1;
    /* none: the page card comes back on "Rockstar"; NO PC DATE stamps it on "announced" (no pause there, so it is
       silent); the "?" blips after "all." */
    T.plate = at('none', 'rockstar') - .1; T.nopc = at('none', 'announced');
    G('qblip', after('none'), 'blip', .12, .8);
    /* the cut to the end and the swish home */
    G('w_end', S('end').t0 - SWIPE + .02, 'tear', .2, .85);
    G('home', HOME - .05, 'swish', .2, .8);
    STRESS = [['page', 'two'], ['pair', 'no'], ['ask', 'wait'], ['boss', 'always'], ['fast', 'eight'], ['hero', '19'],
      ['twice', 'two'], ['rdr', 'year'], ['none', 'all']].map(function (p) { return at(p[0], p[1], p[2]); });
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

  /* ---------- sound: desk and paper foley, cut to the pauses; no music (Isac adds a TikTok sound) ---------- */
  function SCORE(ac) {
    var sr = ac.sampleRate, rnd = mulberry(7);
    var master = ac.createGain(); master.gain.value = .8;
    var hp = ac.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 38;
    var comp = ac.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 3; comp.attack.value = .004; comp.release.value = .15;
    master.connect(hp); hp.connect(comp); comp.connect(ac.destination);
    var nb = ac.createBuffer(1, sr * 3, sr), nd = nb.getChannelData(0); for (var i = 0; i < nd.length; i++) nd[i] = rnd() * 2 - 1;
    function bus(g, pan) { var o = ac.createGain(); o.gain.value = g; var p = ac.createStereoPanner(); p.pan.value = pan || 0; o.connect(p); p.connect(master); return o; }
    function env(pm, pts) { pm.setValueAtTime(pts[0][1], Math.max(0, pts[0][0])); for (var k = 1; k < pts.length; k++) pm.linearRampToValueAtTime(pts[k][1], Math.max(0, pts[k][0])); }
    function noise(t0, dur) { var s = ac.createBufferSource(); s.buffer = nb; s.loop = true; s.start(Math.max(0, t0), rnd() * 2, dur); return s; }
    function osc(type, f, t0, t1, pts, pan) { var o = ac.createOscillator(), og = ac.createGain(); o.type = type; o.frequency.setValueAtTime(f, Math.max(0, t0)); o.connect(og); og.connect(bus(1, pan)); env(og.gain, pts); o.start(Math.max(0, t0)); o.stop(Math.max(0, t1)); return o; }
    function band(t0, t1, f0, f1, g0, g1, q, pan) { var o = bus(1, pan), bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = q || .7; var n = noise(t0, t1 - t0 + .1); n.connect(bp); bp.connect(o); env(bp.frequency, [[t0, f0], [t1, f1]]); env(o.gain, [[t0, 0], [t0 + (t1 - t0) * .4, g0], [t1 - .02, g1], [t1, 0]]); }
    function tick(t, g) { var n = noise(t, .03), bp = ac.createBiquadFilter(); bp.type = 'highpass'; bp.frequency.value = 3200; var o = bus(1, (rnd() - .5) * .3); n.connect(bp); bp.connect(o); env(o.gain, [[t, 0], [t + .003, .16 * (g || 1)], [t + .024, 0]]); }
    function thump(t, g, f) { var o = osc('sine', f || 150, t, t + .2, [[t, 0], [t + .004, g || .4], [t + .14, 0]]); o.frequency.exponentialRampToValueAtTime(50, t + .12); }
    function clack(t, g) { var n = noise(t, .05), bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1300; bp.Q.value = 4; var o = bus(1, (rnd() - .5) * .4); n.connect(bp); bp.connect(o); env(o.gain, [[t, 0], [t + .002, .55 * g], [t + .045, 0]]); thump(t + .005, .22 * g); tick(t + .06, .3 * g); }
    /* an old screen switching off: a click, a falling hiss and a low pop */
    function crt(t, g) { tick(t, .8 * g); band(t, t + .18, 7000, 900, .08 * g, .02 * g, 1.6); thump(t + .02, .25 * g, 120); }
    function stamp(t, g, heavy) { thump(t, .7 * g); if (heavy) thump(t + .01, .45 * g, 90); var sn = noise(t, .12), sl = ac.createBiquadFilter(); sl.type = 'lowpass'; sl.frequency.value = 1500; var so = bus(1); sn.connect(sl); sl.connect(so); env(so.gain, [[t, 0], [t + .004, .32 * g], [t + .1, 0]]); }
    function popS(t, g) { var o = osc('sine', 300, t, t + .12, [[t, 0], [t + .004, .14 * (g || 1)], [t + .1, 0]]); o.frequency.exponentialRampToValueAtTime(900, t + .08); }
    function tear(t, t1, g) { band(t, t1, 700, 2600, .05 * g, .04 * g, 1.8); for (var j = 0; j < 4; j++) tick(t + (t1 - t) * (j + .5) / 4, .12 * g); }
    /* a measuring tape running out: ten ratchet clicks that speed up and rise */
    function ratchet(t, g) { var tt = t; for (var j = 0; j < 10; j++) { tick(tt, (.3 + j * .04) * g); tt += .045 - j * .002; } band(t, t + .32, 900, 3200, .025 * g, .03 * g, 3); }
    function blip(t, g) { osc('square', 660, t, t + .07, [[t, 0], [t + .003, .05 * g], [t + .06, 0]]); osc('square', 990, t + .07, t + .16, [[t + .07, 0], [t + .073, .05 * g], [t + .15, 0]]); }
    function paper(t, g) { band(t, t + .18, 2500, 4500, .07 * g, .02 * g, 1.5); tick(t + .1, .25 * g); thump(t + .1, .18 * g); }
    /* balanced on the final mix (hit peak vs the neighbouring voice): the hero stamp loudest, every hit >= 3 dB under the voice */
    var LEVEL = { crt: 1.5, tick: 1.5, stamp: .5, tear: 20, blip: 8.5, pop: 3.5, swish: 10, whoosh: 10, paper: 1.8, ratchet: 4, clack: 1.7 };
    EV.forEach(function (e) {
      var g = (e.g == null ? 1 : e.g) * (LEVEL[e.type] || 1);
      if (e.type === 'clack') clack(e.t, g);
      else if (e.type === 'tick') { tick(e.t, .9 * g); thump(e.t, .08 * g); }
      else if (e.type === 'crt') crt(e.t, g);
      else if (e.type === 'stamp') stamp(e.t, g, e.heavy);
      else if (e.type === 'tear') tear(e.t, e.t + .2, g);
      else if (e.type === 'pop') popS(e.t, g);
      else if (e.type === 'blip') blip(e.t, g);
      else if (e.type === 'ratchet') ratchet(e.t, g);
      else if (e.type === 'paper') paper(e.t, g);
      else if (e.type === 'whoosh') band(e.t, e.t + .18, 600, 3200, .09 * g, .02, 1.2);
      else if (e.type === 'swish') band(e.t, e.t + .24, 900, 5200, .1 * g, .02, 1.6);
    });
    /* no music: Isac adds a trending sound on the platform; the film ships voice + sound effects */
    var MUSIC = false;
    if (MUSIC) { /* intentionally empty */ }
    env(master.gain, [[0, .8], [DUR - .3, .8], [DUR, .55]]);
    /* room tone, so the loop seam is never digital zero */
    (function () { var o = bus(1), lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900; lp.Q.value = .5;
      var n = noise(0, DUR); n.connect(lp); lp.connect(o); o.gain.value = .003; })();
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
    var fonts = ['900 84px Archivo', '800 84px Archivo', '700 46px Archivo', '600 46px Archivo', '500 30px "Geist Mono"', '400 60px "Instrument Serif"'];
    return Promise.all(fonts.map(function (f) { return document.fonts.load(f, 'Aa0%°×−≈≠µ“”’·→…#?‹|~'); })).then(function () { return document.fonts.ready; }).then(function () {
      STEX = {};
      window.READY = true;
    });
  }

  initTimes();
  var POSTER_T = Math.min(GT.hero + .3, start('twice') - .1);
  window.FILM = { bare: function () { ctx.setTransform(1, 0, 0, 1, 0, 0); stage(ctx); }, W: W, H: H, DUR: DUR, POSTER: POSTER_T, SLUG: 'gta-pc', SHOTS: SC.map(function (s) { return { id: s.id, name: s.name, t0: s.t0, t1: s.t1 }; }), init: init, render: render, frame: frame, LIVE: LIVE };
  window.BOUNDS_RUN = function (step) {
    BOUNDS = []; var o = {};
    for (var t = 0; t <= DUR + 1e-6; t += step || 1 / 15) { CURT = t; POSTERMODE = false; frame(ctx, t); }
    BOUNDS.forEach(function (b) { var r = o[b.text] || (o[b.text] = { text: b.text, from: b.t, to: b.t, x0: b.x0, x1: b.x1, y1: b.y1, n: 0 }); r.to = b.t; r.n++; r.x0 = Math.min(r.x0, b.x0); r.x1 = Math.max(r.x1, b.x1); r.y1 = Math.max(r.y1, b.y1); });
    BOUNDS = null; return Object.keys(o).map(function (k) { return o[k]; });
  };
  window.DUR = DUR; window.EV = EV; window.TEXTS = TEXTS; window.SCORE = SCORE; window.READY = false;
  window.render = function (t, s, sh, fps) { render(t, s, sh, fps); };
})();
