/* "The trailer songs": GTA 6, Delta #5. A vertical film written in code, narrated first and cut to the voice:
   every visual beat is keyed to a word time from vo/vo.js (window.VO) with at(id, word). Pure function of t.
   Contract: window.FILM, DUR, render(t), READY, EV, TEXTS(t), SCORE(ctx).
   Native move: a dusty 1989 cassette and its deck counter. The tape comes back to life on "revived"; the counter overflows
   its three wheels and lands on 36,979% (Spotify to BBC Newsbeat), the one hero number. A second tape for trailer 2, a rack
   whose third slot breaks for the launch trailer's new song, and an old-or-new vote that dissolves back into frame 0.
   Own flat shapes in a Vice City palette. No Rockstar footage, logo or key art, no app UI, no music, no lyrics.
   Facts and sources: BRIEF.md. */
(function () {
  'use strict';
  var W = 1080, H = 1920, VO = window.VO, DUR = VO.dur, CX = 510;
  var BG = '#0b0820', CREAM = '#fbf0ea', DIM = 'rgba(251,240,234,.55)';
  var HOT = '#ff4fa3', TEAL = '#19d3c5', ORG = '#ff8a3d';
  var PURP = '#241250', PURP2 = '#160b36', PAPER = '#fbf0ea', INK = '#0b0820', GREY = '#8a8492';
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
  function pin(t, a) { return lerp(1.15, 1, clamp(pop(t, a, 3.2), 0, 1)); }
  function qt(t) { return (Math.floor(t * 30) + .5) / 30; }      // the frame the renderer samples, for displayed numbers
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

  /* ---------- the SFX gate: hits sit in pauses, 0.2 s clear of every word vo.js has and Whisper heard in the mix (vo/heard.js) ---------- */
  var EDGES = [], VOICED = [];
  VO.lines.forEach(function (l) { l.words.forEach(function (w) { VOICED.push({ t0: w.t0, t1: w.t1 }); EDGES.push(w.t0, w.t1); }); });
  (window.HEARD || []).forEach(function (w) { if (w[1] < .15) return; VOICED.push({ t0: w[0], t1: w[1] }); EDGES.push(w[0], w[1]); });   // Whisper pins the first word to 0.00
  function free(m) {
    var B = [], M = [], F = [], p = 0;
    EDGES.forEach(function (e) { B.push([e - m, e + m]); });
    VOICED.forEach(function (v) { B.push([v.t0 - .03, v.t1 + .03]); });
    B.sort(function (x, y) { return x[0] - y[0]; });
    B.forEach(function (b) { var L = M[M.length - 1]; if (L && b[0] <= L[1]) L[1] = Math.max(L[1], b[1]); else M.push(b.slice()); });
    M.forEach(function (b) { if (b[0] > p) F.push([p, b[0]]); p = Math.max(p, b[1]); });
    F.push([p, DUR + 9]); return F;
  }
  var BODY = { stampS: .14, wind: .03, tick: .03, thump: .16, clunk: .16, ding: .45, whirr: .3, ticks: .14, tear: .3, pop: .12, flap: .08, crack: .22, swish: .26, ratchet: .34 };
  function nearGap(t, type, m) {
    var body = BODY[type] || .12, best = null;
    free(m || .2).forEach(function (f) {
      var lo = f[0], hi = f[1] - body; if (hi < lo) return;
      var c = clamp(t, lo, hi); if (best === null || Math.abs(c - t) < Math.abs(best - t)) best = c;
    });
    return best;
  }
  /* a beat that carries a sound moves into the nearest free stretch (within tol); otherwise it stays on its word, silent */
  var GT = {}, EV = [];
  function G(id, t, type, tol, gain, extra) {
    var n = nearGap(t, type, extra && extra.m);
    if (n !== null && Math.abs(n - t) <= (tol == null ? .35 : tol)) { GT[id] = n; var e = { t: n, type: type, g: gain == null ? 1 : gain, id: id }; if (extra) for (var k in extra) e[k] = extra[k]; EV.push(e); }
    else GT[id] = t;
    return GT[id];
  }

  /* ---------- canvas + safe-area check ---------- */
  var cv, ctx, tmp, tctx, acc, actx, LIVE = { grain: true, text: true };
  function mk(w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
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
    while (o.maxw && tw + pad * 2 > o.maxw && px > 36) { px -= 2; font(g, px, o.wt, o.fam); tw = g.measureText(text).width; pad = o.pad == null ? px * .32 : o.pad; }
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
    px = Math.max(36, px || 36);
    if (a <= 0) return;
    g.save(); g.globalAlpha *= clamp(a, 0, 1); font(g, px, 500, MONO); ls(g, 3); g.textAlign = align || 'center'; g.textBaseline = 'middle';
    while (g.measureText(text).width > 800 && px > 36) { px--; font(g, px, 500, MONO); }
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
  /* rubber stamp: worn ink (seeded speckle), slammed; the hook's one stamp */
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
    var c = stampTex(text, col, px), k = sp(t, t0, 3.2, .8), s = lerp(1.06, 1, clamp(k, 0, 1)), al = clamp(k * 3, 0, 1) * (1 - seg(t, t1, t1 + .3));
    g.save(); g.globalAlpha *= al; g.translate(x, y); g.rotate(rot); g.scale(s, s);
    g.save(); g.globalAlpha *= .35; g.drawImage(c, -c.w / 2 + 8, -c.h / 2 + 10); g.restore();
    g.drawImage(c, -c.w / 2, -c.h / 2);
    if (k >= 1) { font(g, px, 900); ls(g, 4); var mm = g.measureText(text); recBox(g, -mm.width / 2, -px * .5, mm.width / 2, px * .5, text); ls(g, 0); }
    g.restore();
  }
  function fitPx(g, text, px, wt, maxw, minpx) { font(g, px, wt); while (g.measureText(text).width > maxw && px > (minpx || 20)) { px -= 2; font(g, px, wt); } return px; }

  /* =====================================================================================================
     THE CASSETTE: designed in 1000 × 630 units, scaled to w. Dust is a grey copy clipped right of o.clean (a cloth wipe).
     ===================================================================================================== */
  var DUSTY = { shell: '#5d5866', label: '#a59d92', stripe: '#77707c', win: '#2a2630', reel: '#8d8790', ink: '#4a4550', sticker: '#8f8478' };
  function reel(g, x, y, r, ang, col, hub) {
    g.save(); g.translate(x, y); g.rotate(ang);
    g.fillStyle = col; el(g, 0, 0, r, r);
    g.fillStyle = hub; el(g, 0, 0, r * .52, r * .52);
    g.fillStyle = col; for (var i = 0; i < 6; i++) { g.save(); g.rotate(i * Math.PI / 3); g.fillRect(-r * .09, -r * .52, r * .18, r * .22); g.restore(); }
    g.fillStyle = 'rgba(0,0,0,.25)'; for (i = 0; i < 3; i++) { g.save(); g.rotate(i * 2.094 + .5); el(g, r * .76, 0, r * .1, r * .1); g.restore(); }
    g.restore();
  }
  function tapeBody(g, o, P) {
    /* P: palette {shell, label, stripe, win, reel, ink, sticker} */
    rr(g, -500, -315, 1000, 630, 46); g.fillStyle = P.shell; g.fill();
    g.strokeStyle = 'rgba(0,0,0,.18)'; g.lineWidth = 10; rr(g, -480, -295, 960, 590, 36); g.stroke();
    g.fillStyle = 'rgba(0,0,0,.28)'; [[-455, -270], [455, -270], [-455, 270], [455, 270], [0, 268]].forEach(function (p) { el(g, p[0], p[1], 17, 17); });
    /* bottom trapezoid with holes */
    g.fillStyle = 'rgba(0,0,0,.2)'; g.beginPath(); g.moveTo(-340, 315); g.lineTo(-295, 185); g.lineTo(295, 185); g.lineTo(340, 315); g.closePath(); g.fill();
    g.fillStyle = 'rgba(0,0,0,.45)'; el(g, -210, 255, 20, 20); el(g, 210, 255, 20, 20); g.fillRect(-90, 238, 40, 34); g.fillRect(50, 238, 40, 34);
    /* label */
    rr(g, -430, -275, 860, 430, 24); g.fillStyle = P.label; g.fill();
    g.save(); rr(g, -430, -275, 860, 430, 24); g.clip(); g.fillStyle = P.stripe; g.fillRect(-430, 95, 860, 60); g.restore();
    /* window and reels */
    rr(g, -260, -40, 520, 130, 26); g.fillStyle = P.win; g.fill();
    g.save(); rr(g, -260, -40, 520, 130, 26); g.clip();
    var a = o.ang || 0, L = o.packL == null ? 118 : o.packL, R = o.packR == null ? 88 : o.packR;
    g.fillStyle = 'rgba(70,40,30,.95)'; el(g, -165, 25, L, L); el(g, 165, 25, R, R);
    reel(g, -165, 25, 52, a, P.reel, P.win); reel(g, 165, 25, 52, a * 1.3, P.reel, P.win);
    g.restore();
    g.strokeStyle = 'rgba(0,0,0,.3)'; g.lineWidth = 6; rr(g, -260, -40, 520, 130, 26); g.stroke();
    /* side letter */
    if (o.side !== '') { font(g, 74, 900); g.fillStyle = P.ink; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(o.side || 'A', -365, 25); }
  }
  function tapeText(g, o, P, yb) {
    g.textAlign = 'center'; g.textBaseline = 'middle';
    var y = o.year || '1989';
    if (yb > 0) { g.save(); g.globalAlpha *= yb; var ypx = fitPx(g, y, 210, 900, 700); g.fillStyle = P.ink; g.fillText(y, 0, -160); g.restore(); }
    if (o.title && o.titleK > 0) {
      var rows = o.title.split('|'), total = rows.join('').length, n = Math.ceil(total * clamp(o.titleK, 0, 1)), used = 0;
      var px = 200; rows.forEach(function (rw) { px = Math.min(px, fitPx(g, rw, 96, 900, 600)); }); font(g, px, 900);
      g.fillStyle = P.ink; g.textAlign = 'left';
      rows.forEach(function (rw, i) {
        var shown = rw.slice(0, clamp(n - used, 0, rw.length)), fw = g.measureText(rw).width, y = rows.length > 1 ? -205 + i * 96 : -165;
        if (shown) g.fillText(shown, -fw / 2 - 50, y);
        if (shown.length && shown.length < rw.length) g.fillRect(-fw / 2 - 50 + g.measureText(shown).width + 6, y - 36, 8, 72);
        used += rw.length;
      });
      g.textAlign = 'center';
    }
    if (o.artist && o.artistK > 0) { g.save(); g.globalAlpha *= clamp(o.artistK, 0, 1); fitPx(g, o.artist, 58, 900, 700); ls(g, 6); g.fillStyle = CREAM; g.fillText(o.artist, 0, 127); ls(g, 0); g.restore(); }
    if (o.stickK > 0) {
      g.save(); var ss = clamp(o.stickK, 0, 1.1); g.translate(345, -175); g.rotate(.12); g.scale(ss, ss);
      g.fillStyle = 'rgba(0,0,0,.3)'; el(g, 6, 8, 88, 88); g.fillStyle = P.sticker; el(g, 0, 0, 88, 88);
      font(g, 60, 900); g.fillStyle = INK; g.fillText(y, 0, 3); g.restore();
    }
    if (o.bigB > 0) { g.save(); g.globalAlpha *= clamp(o.bigB, 0, 1); font(g, 300, 900); g.fillStyle = P.ink; g.fillText('B', 0, -150); g.restore(); }
  }
  function cassette(g, cx, cy, w, o) {
    var a = o.a == null ? 1 : o.a; if (a <= 0 || w <= 0) return;
    var s = w / 1000, fx = o.flip == null ? 1 : o.flip;
    var P = { shell: o.shell || HOT, label: o.label || CREAM, stripe: o.stripe || TEAL, win: '#160b36', reel: o.reel || TEAL, ink: INK, sticker: o.sticker || ORG };
    g.save(); g.globalAlpha *= clamp(a, 0, 1); g.translate(cx, cy); g.rotate(o.rot || 0); g.scale(s * fx, s);
    g.fillStyle = 'rgba(0,0,0,.42)'; rr(g, -500 + 18, -315 + 26, 1000, 630, 46); g.fill();
    var yb = o.yearBig == null ? 0 : o.yearBig;
    var clean = o.clean == null ? 520 : o.clean;      // local x left of which the tape is wiped clean
    if (clean > -520) { g.save(); g.beginPath(); g.rect(-520, -340, clean + 520, 700); g.clip(); tapeBody(g, o, P); if (fx > 0) tapeText(g, o, P, yb); g.restore(); }
    if (clean < 520) {
      g.save(); g.beginPath(); g.rect(clean, -340, 520 - clean, 700); g.clip();
      tapeBody(g, o, DUSTY); if (fx > 0) tapeText(g, o, DUSTY, yb);
      /* dust: seeded speckle and a cobweb in the top-left corner */
      var r = mulberry(91); g.fillStyle = 'rgba(210,200,190,.32)';
      for (var i = 0; i < 160; i++) { var dx = r() * 1000 - 500, dy = r() * 630 - 315, dr = 2 + r() * 6; el(g, dx, dy, dr, dr * (.6 + r() * .6)); }
      g.fillStyle = 'rgba(200,190,180,.16)'; rr(g, -500, -315, 1000, 630, 46); g.fill();
      g.strokeStyle = 'rgba(235,228,220,.55)'; g.lineWidth = 3; var sw = Math.sin((o.tt || 0) * 1.7) * 6;
      for (i = 0; i < 4; i++) { g.beginPath(); g.moveTo(-500, -315 + i * 46 + 30); g.quadraticCurveTo(-470 + i * 20, -260 + sw + i * 10, -460 + i * 52, -315); g.stroke(); }
      g.beginPath(); g.moveTo(-500, -315); g.lineTo(-330, -170 + sw); g.stroke();
      g.restore();
      if (clean > -520 && clean < 520) { /* the cloth: a soft cream band at the wipe edge */
        var gr = g.createLinearGradient(clean - 60, 0, clean + 20, 0); gr.addColorStop(0, 'rgba(251,240,234,0)'); gr.addColorStop(.8, 'rgba(251,240,234,.55)'); gr.addColorStop(1, 'rgba(251,240,234,0)');
        g.save(); rr(g, -500, -315, 1000, 630, 46); g.clip(); g.fillStyle = gr; g.fillRect(clean - 60, -330, 80, 660); g.restore();
      }
    }
    if (fx <= 0) { /* the back of the tape: side B */
      g.save(); g.scale(-1, 1); tapeText(g, { year: o.year, bigB: 1 }, P, 0); g.restore();
    }
    g.restore();
  }
  /* reel angle: creaks while dusty, spins up after t0 */
  function spin(t, t0, rate) { if (t < t0) return .05 * Math.sin(t * 2.3); var u = t - t0; return (u - .35 * (1 - Math.exp(-u / .35))) * (rate || 6); }

  /* ---------- the deck counter: odometer wheels in a flat deck ---------- */
  function wheels(g, cx, cy, v, n, o) {
    var cw = o.cw, ch = o.ch, gp = o.gap == null ? 8 : o.gap, px = o.px || ch * .8, cg = o.cg || 0;
    var items = [], w = 0, i;
    for (i = 0; i < n; i++) { var place = n - 1 - i; if (o.commas && i > 0 && place % 3 === 2) items.push({ c: 1, w: cg }); items.push({ p: place, w: cw }); }
    items.forEach(function (it, k) { w += it.w + (k < items.length - 1 ? gp : 0); });
    var sw = 0; if (o.suffix) { font(g, px * .9, 900); sw = (g.measureText(o.suffix).width + 16) * (o.sufK == null ? 1 : o.sufK); }
    var x = cx - (w + sw) / 2, x0 = x;
    items.forEach(function (it) {
      if (it.c) { font(g, px * .8, 900); g.fillStyle = o.fg || CREAM; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(',', x + it.w / 2, cy + ch * .28); x += it.w + gp; return; }
      var P10 = Math.pow(10, it.p), f = (v / P10) % 10, d = Math.floor(f), fr = f - d, r = it.p === 0 ? fr : clamp((v % P10) - (P10 - 1), 0, 1);
      g.save(); rr(g, x + 4, cy - ch / 2 + 8, cw, ch, 12); g.fillStyle = 'rgba(0,0,0,.35)'; g.fill();
      rr(g, x, cy - ch / 2, cw, ch, 12); g.fillStyle = o.bg || '#05030f'; g.fill(); g.clip();
      font(g, px, 900); g.fillStyle = o.fg || CREAM; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(String(d), x + cw / 2, cy + 4 - r * ch); g.fillText(String((d + 1) % 10), x + cw / 2, cy + 4 + (1 - r) * ch);
      g.fillStyle = 'rgba(255,255,255,.08)'; g.fillRect(x, cy - ch / 2, cw, ch * .2);
      g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(x, cy + ch / 2 - ch * .18, cw, ch * .18);
      g.restore();
      x += cw + gp;
    });
    if (o.suffix && (o.sufK == null || o.sufK > 0)) { g.save(); var k = o.sufK == null ? 1 : o.sufK; g.translate(x + 8, cy + 4); g.scale(k, k); font(g, px * .9, 900); g.fillStyle = o.sfg || ORG; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText(o.suffix, 0, 0); g.restore(); }
    return { x0: x0, x1: x + sw, w: w + sw };
  }
  function deckPanel(g, cx, cy, w, h, a) {
    if (a <= 0) return;
    g.save(); g.globalAlpha *= clamp(a, 0, 1);
    rr(g, cx - w / 2 + 10, cy - h / 2 + 16, w, h, 30); g.fillStyle = 'rgba(0,0,0,.42)'; g.fill();
    rr(g, cx - w / 2, cy - h / 2, w, h, 30); g.fillStyle = PURP; g.fill(); g.strokeStyle = 'rgba(251,240,234,.25)'; g.lineWidth = 4; g.stroke();
    g.fillStyle = 'rgba(255,255,255,.06)'; g.fillRect(cx - w / 2 + 20, cy - h / 2 + 10, w - 40, 8);
    g.restore();
  }
  /* the little deck under the hook tape: a three-wheel counter and two buttons */
  function smallDeck(g, cx, cy, v, a) {
    if (a <= 0) return;
    g.save(); g.globalAlpha *= clamp(a, 0, 1);
    deckPanel(g, cx, cy, 620, 170, 1);
    rr(g, cx - 160, cy - 62, 320, 124, 16); g.fillStyle = '#05030f'; g.fill();
    wheels(g, cx, cy, v, 3, { cw: 84, ch: 104, px: 84, gap: 8 });
    g.fillStyle = TEAL; rr(g, cx - 270, cy - 26, 70, 52, 10); g.fill(); g.fillStyle = HOT; rr(g, cx + 200, cy - 26, 70, 52, 10); g.fill();
    g.fillStyle = INK; tri(g, cx - 248, cy - 14, cx - 248, cy + 14, cx - 222, cy);
    g.fillRect(cx + 222, cy - 13, 26, 26);
    g.restore();
  }

  /* scenes. swipe:true = the next scene rises in under a slanted edge */
  var SWIPE = .42, PRE = .3;
  var SC = [
    { id: 'tape', name: 'The 1989 tape', t0: 0 },
    { id: 'ask', name: 'One trailer', t0: start('ask') - .05, swipe: true },
    { id: 'hero', name: '36,979%', t0: start('bbc') - .05, swipe: true },
    { id: 'meter', name: 'Never like this', t0: start('never') - .05, swipe: true },
    { id: 'two', name: 'Trailer 2', t0: start('two') - .05, swipe: true },
    { id: 'rack', name: 'The pattern', t0: start('but') - .05 },
    { id: 'new', name: 'A new song', t0: start('new') - .05, swipe: true },
    { id: 'end', name: 'Old or new', t0: start('end') - .05, swipe: true }
  ];
  SC.forEach(function (s, i) { s.t1 = i + 1 < SC.length ? SC[i + 1].t0 : DUR; });
  function S(id) { for (var i = 0; i < SC.length; i++) if (SC[i].id === id) return SC[i]; }
  var SHOTS = SC.map(function (s) { return { id: s.id, name: s.name, t0: s.t0, t1: s.t1 }; });
  var HOME = DUR - .45;

  /* =====================================================================================================
     SCENE 1 · hook + song + bside: the dusty tape wakes up, its label writes itself, then it flips to the B side
     ===================================================================================================== */
  function tapeScene(g, t) {
    var rv = at('hook', 'revived'), sg = start('song') - .25, lv = at('song', 'love'), tm = at('song', 'tom'), sgw = at('song', 'song');
    var bs = start('bside'), sgl = wend('bside', 'single'), bsd = at('bside', 'bside');
    var seat = eo(seg(t, 0, .2)), kk = Math.max(0, knock(t, .2, 18, 8)), ks = Math.max(0, knock(t, GT.rev || 1.9, 18, 8));
    var mv = eio(seg(t, sg, sg + .55));
    var w = lerp(780, 760, mv), cy = lerp(800, 780, mv) - 60 * (1 - seat) + 10 * kk + 8 * ks, rot = lerp(-.045 + .012 * Math.sin(t * 1.3), -.02, seg(t, rv, rv + .5));
    var clean = lerp(-520, 520, eio(seg(t, rv - .05, rv + .5)));
    var fk = seg(t, sgl, sgl + .4), flip = Math.cos(Math.PI * eio(fk));
    /* the single: a 7-inch disc that slides in and is struck out */
    var dIn = eo(seg(t, bs - .5, bs - .05));
    if (dIn > 0) {
      var dx = lerp(800, 715, dIn), dy = 1190, dr = 170 * lerp(.6, 1, dIn);
      g.save(); g.globalAlpha *= clamp(dIn * 2, 0, 1); g.translate(dx, dy); g.rotate(t * 2.2);
      g.fillStyle = 'rgba(0,0,0,.4)'; el(g, 10, 14, dr, dr); g.fillStyle = '#111'; el(g, 0, 0, dr, dr);
      g.strokeStyle = 'rgba(255,255,255,.08)'; g.lineWidth = 3; for (var k = 0; k < 6; k++) { g.beginPath(); g.arc(0, 0, dr - 14 - k * 13, 0, 6.283); g.stroke(); }
      g.fillStyle = TEAL; el(g, 0, 0, 92, 92); g.restore();
      label(g, 'SINGLE', dx, dy, seg(dIn, .9, 1), INK, 36);
      var st = eio(seg(t, sgl - .05, sgl + .25));
      if (st > 0) { g.save(); g.strokeStyle = HOT; g.lineWidth = 20; g.lineCap = 'round'; g.beginPath(); g.moveTo(dx - 180, dy + 115); g.lineTo(dx - 180 + 360 * st, dy + 115 - 230 * st); g.stroke(); g.restore(); }
    }
    /* the B-side tag, once the flip has landed (a quiet outline, not another stamp) */
    chip(g, 'B-SIDE', 320, 1190, { px: 88, wt: 900, line: HOT, lw: 6, fg: HOT, a: fin(t, sgl + .25), s: pin(t, sgl + .25) * kn(t, bsd), rot: -.04, shadow: false });
    cassette(g, CX, cy, w, {
      clean: clean, ang: spin(t, rv + .1, 6.5), rot: rot, tt: t, year: '1989',
      yearBig: 1 - seg(t, lv - .45, lv - .1), stickK: pop(t, lv - .25, 3.2),
      title: 'LOVE IS A|LONG ROAD', titleK: seg(t, lv - .25, lv + .1), artist: 'TOM PETTY', artistK: fin(t, tm - .1),
      flip: flip, side: flip > 0 ? 'A' : ''
    });
    /* REVIVED: the hook's hero stamp, slammed across the reels in the pause after the word */
    stampText(g, 'REVIVED', CX, cy + 70, t, GT.rev || 1.9, tm - .25, 120, CREAM, -.08);
    /* GTA 6 pill: frame 0, leaves before the first caption */
    var pg = 1 - seg(t, sg - .15, sg + .15);
    chip(g, 'GTA 6', CX, 420 - 30 * (1 - pg), { px: 150, wt: 900, bg: HOT, fg: BG, pad: 52, rot: -.025, a: pg, s: 1 + .04 * Math.max(0, knock(t, .45, 16, 7)) });
    /* the search phrase under the tape from 2 s, then the trailer and date */
    var swp = seg(t, sgw + .1, sgw + .3);
    chip(g, 'GTA 6 TRAILER SONG', CX, 1110, { px: 54, wt: 900, bg: CREAM, fg: BG, a: fin(t, GT.rev ? GT.rev + .08 : 1.95) * (1 - swp), s: pin(t, GT.rev ? GT.rev + .08 : 1.95), rot: .015, maxw: 800 });
    chip(g, 'TRAILER 1 · DEC 2023', CX, 1110, { px: 54, wt: 900, bg: CREAM, fg: BG, a: swp * (1 - seg(t, bs - .35, bs - .1)), rot: .015, maxw: 800 });
    /* deck: holds 000 until the hero roll; leaves when the single arrives */
    var dk = 1 - eio(seg(t, bs - .7, bs - .4));
    if (dk > 0) { g.save(); g.translate(0, 70 * (1 - dk)); smallDeck(g, CX, 1270, 0, dk * dk * dk * dk); g.restore(); }
    label(g, 'SOURCE: TOMPETTY.COM', CX, 1418, fin(t, at('song', 'trailer') + .2) * (1 - seg(t, bs - .35, bs - .1)), CREAM, 36, 'center', true);
  }

  /* =====================================================================================================
     SCENE 2 · ask: a trailer card, an old dusty tape, a "?" between them
     ===================================================================================================== */
  function trailerCard(g, x, y, w, h, t, a, s, txt) {
    if (a <= 0) return;
    var r = mulberry(17 + Math.floor(t * 10));
    g.save(); g.globalAlpha *= clamp(a, 0, 1); g.translate(x, y); g.scale(s || 1, s || 1); g.rotate(-.03);
    rr(g, -w / 2 + 12, -h / 2 + 18, w, h, 26); g.fillStyle = 'rgba(0,0,0,.42)'; g.fill();
    rr(g, -w / 2, -h / 2, w, h, 26); g.fillStyle = PURP2; g.fill();
    g.save(); rr(g, -w / 2, -h / 2, w, h, 26); g.clip();
    var gr = g.createLinearGradient(0, -h / 2, 0, h / 2); gr.addColorStop(0, 'rgba(255,138,61,.55)'); gr.addColorStop(.6, 'rgba(255,79,163,.35)'); gr.addColorStop(1, 'rgba(22,11,54,0)'); g.fillStyle = gr; g.fillRect(-w / 2, -h / 2, w, h);
    g.fillStyle = '#140a33'; for (var i = 0; i < 9; i++) { var bw = 30 + r() * 10, bh = 40 + ((i * 37) % 70); g.fillRect(-w / 2 + i * w / 9, h / 2 - 40 - bh, w / 9 - 6, bh + 40); }
    g.restore();
    rr(g, -w / 2, -h / 2, w, h, 26); g.strokeStyle = CREAM; g.lineWidth = 5; g.stroke();
    var pp = 1 + .06 * Math.sin(t * 5); g.save(); g.scale(pp, pp); g.fillStyle = CREAM; el(g, 0, -10, 62, 62); g.fillStyle = HOT; tri(g, -18, -42, -18, 22, 32, -10); g.restore();
    g.fillStyle = 'rgba(251,240,234,.35)'; g.fillRect(-w / 2 + 30, h / 2 - 26, w - 60, 8); g.fillStyle = HOT; g.fillRect(-w / 2 + 30, h / 2 - 26, (w - 60) * ((t * .18) % 1), 8);
    g.restore();
  }
  function askScene(g, t) {
    var s0 = S('ask').t0, on = at('ask', 'one'), tr = at('ask', 'trailer'), dd = at('ask', 'do'), od = at('ask', 'old');
    trailerCard(g, 340, 720, 430, 266, t, fin(t, s0 + .02), lerp(.85, 1, clamp(pop(t, s0, 3), 0, 1)) * kn(t, on));
    chip(g, 'TRAILER 1', 340, 905, { px: 50, wt: 900, bg: CREAM, fg: BG, a: fin(t, s0 + .1), rot: -.03 });
    var wob = Math.max(0, knock(t, od, 14, 5)) * .06;
    cassette(g, 680, 1170, 420, { clean: -520, ang: spin(t, 1e9), rot: .05 + wob, tt: t, year: '1989', yearBig: 1, a: fin(t, s0 + .05) });
    label(g, 'AN OLD SONG', 680, 1340, fin(t, s0 + .3), CREAM, 40);
    /* the arrow from trailer to tape, drawn on "trailer" */
    var ak = eio(seg(t, tr - .05, tr + .45));
    if (ak > 0) {
      g.save(); g.strokeStyle = TEAL; g.lineWidth = 12; g.lineCap = 'round'; g.setLineDash([26, 18]); g.lineDashOffset = -t * 60;
      g.beginPath(); var x0 = 560, y0 = 760, x1 = 690, y1 = 1010, cxp = 740, cyp = 790;
      for (var i = 0; i <= 30 * ak; i++) { var u = i / 30, xx = (1 - u) * (1 - u) * x0 + 2 * u * (1 - u) * cxp + u * u * x1, yy = (1 - u) * (1 - u) * y0 + 2 * u * (1 - u) * cyp + u * u * y1; if (!i) g.moveTo(xx, yy); else g.lineTo(xx, yy); }
      g.stroke(); g.setLineDash([]);
      if (ak >= 1) { g.fillStyle = TEAL; tri(g, x1 - 26, y1 - 30, x1 + 22, y1 - 34, x1 + 2, y1 + 12); }
      g.restore();
    }
    /* the question mark */
    var qa = fin(t, dd - .1), qs = pin(t, dd - .1) * (1 + .04 * Math.sin(t * 4));
    if (qa > 0) { g.save(); g.globalAlpha *= qa; g.translate(250, 1170 + 14 * Math.sin(t * 3.2)); g.scale(qs, qs); g.rotate(-.08); font(g, 300, 900); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = 'rgba(0,0,0,.35)'; g.fillText('?', 10, 14); g.fillStyle = ORG; g.fillText('?', 0, 0); g.restore(); }
  }

  /* =====================================================================================================
     SCENE 3 · bbc + num + week: the source card, then the deck counter overflows to 36,979%, the hero
     ===================================================================================================== */
  var R0, R1, LAND;          // roll start ("Streams"), roll end (lands on "percent")
  function Vhero(t) { var k = eio(seg(qt(t), R0, R1)); return k >= 1 ? 36979 : Math.pow(36980, k) - 1; }
  function heroScene(g, t) {
    var s0 = S('hero').t0, sp0 = at('bbc', 'spotify'), td = at('bbc', 'told'), bb = at('bbc', 'bbc'), st = at('num', 'streams');
    var ex = eio(seg(t, R0 - .45, R0 + .1));      // the source card shrinks into the credit line as the roll starts
    var v = Vhero(t), landed = t >= R1, n = v >= 10000 ? 5 : v >= 1000 ? 4 : 3;
    var BASE = 1310, TOP = 470, da = eo(seg(t, R0 - .3, R0 + .1));
    /* the two bars: same days a week before (a stub) and since the trailer (grows with the counter, to the top of the frame) */
    if (da > 0) {
      g.save(); g.globalAlpha *= da;
      g.fillStyle = 'rgba(251,240,234,.5)'; g.fillRect(140, BASE, 780, 5);
      g.fillStyle = TEAL; g.fillRect(220, BASE - 4, 160, 4);
      var bh = (BASE - TOP) * clamp(v / 36979, 0, 1);
      if (bh > 1) {
        var gr = g.createLinearGradient(0, TOP - 40, 0, TOP + 140); gr.addColorStop(0, 'rgba(255,79,163,0)'); gr.addColorStop(1, HOT);
        g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(803, BASE - bh + 12, 100, bh - 12);
        g.fillStyle = bh > BASE - TOP - 150 ? gr : HOT; g.fillRect(795, BASE - bh, 100, bh); g.fillStyle = 'rgba(255,255,255,.2)'; g.fillRect(795, BASE - bh, 16, bh);
      }
      g.restore();
      label(g, 'SAME DAYS,', 300, 1352, da * kn(t, at('week', 'week')), CREAM, 36);
      label(g, 'WEEK BEFORE', 300, 1396, da * kn(t, at('week', 'week')), CREAM, 36);
      label(g, 'SINCE THE', 800, 1352, da, CREAM, 36);
      label(g, 'TRAILER', 800, 1396, da, CREAM, 36);
    }
    /* the source card */
    if (ex < 1) {
      var cyC = lerp(780, 1060, ex), sc = lerp(1, .3, ex);
      g.save(); g.globalAlpha *= 1 - ex; g.translate(CX, cyC); g.scale(sc, sc); g.rotate(-.02);
      rr(g, -390 + 12, -230 + 18, 780, 460, 18); g.fillStyle = 'rgba(0,0,0,.4)'; g.fill();
      rr(g, -390, -230, 780, 460, 18); g.fillStyle = PAPER; g.fill();
      g.fillStyle = 'rgba(11,8,32,.08)'; for (var i = 0; i < 6; i++) g.fillRect(-350, -180 + i * 74, 700, 3);
      g.restore();
      g.save(); g.globalAlpha *= 1 - ex; g.translate(CX, cyC); g.scale(sc, sc); g.translate(-CX, -780);
      chip(g, 'SPOTIFY', CX, 650, { px: 76, wt: 900, bg: INK, fg: CREAM, a: fin(t, s0 + .02), s: kn(t, sp0), shadow: false });
      var ak = eio(seg(t, td - .05, td + .3));
      if (ak > 0) { g.strokeStyle = HOT; g.lineWidth = 14; g.lineCap = 'round'; g.beginPath(); g.moveTo(CX, 712); g.lineTo(CX, 712 + 60 * ak); g.stroke(); if (ak > .9) { g.fillStyle = HOT; tri(g, CX - 26, 768, CX + 26, 768, CX, 796); } }
      chip(g, 'BBC NEWSBEAT', CX, 850, { px: 70, wt: 900, bg: HOT, fg: BG, a: fin(t, s0 + .1), s: kn(t, bb - .05), shadow: false, maxw: 720 });
      label(g, 'DEC 6, 2023', CX, 945, fin(t, s0 + .15), INK, 42);
      g.restore();
    }
    label(g, 'VIA BBC NEWSBEAT · DEC 2023', CX, 1060, seg(ex, .6, 1), CREAM, 36, 'center', true);
    /* the counter: pops in big as the card leaves, rolls through the line, lands on "percent" */
    var cw = 104, ch = 250, px = 158, gp = 10, cg = 30, cy = 760;
    var sq = (1 + .025 * Math.max(0, knock(t, R1, 16, 6))) * lerp(.8, 1, clamp(pop(t, R0 - .3, 3), 0, 1));
    function wfor(nn) { return nn * cw + (nn - 1) * gp + (nn > 3 ? cg + gp : 0); }
    var c4 = cross(1000), c5 = cross(10000), wNow = wfor(3) + (wfor(4) - wfor(3)) * eio(seg(t, c4, c4 + .18)) + (wfor(5) - wfor(4)) * eio(seg(t, c5, c5 + .18));
    var sufK = landed ? clamp(pop(t, R1, 3.4), 0, 1.04) : 0, sufW = 0;
    if (sufK > 0) { font(g, px * .9, 900); sufW = (g.measureText('%').width + 16) * sufK; }
    var panelW = Math.min(800, wNow + sufW + 50);
    if (da > 0) {
      g.save(); g.globalAlpha *= da; g.translate(CX, cy); g.scale(sq, sq); g.translate(-CX, -cy);
      deckPanel(g, CX, cy, panelW, ch + 50, 1);
      wheels(g, CX, cy, v, n, { cw: cw, ch: ch, px: px, gap: gp, cg: cg, commas: true, fg: landed ? ORG : CREAM, suffix: '%', sufK: sufK, sfg: ORG });
      g.restore();
    }
    /* tags only once the number has landed */
    chip(g, 'SPOTIFY STREAMS', CX, 545, { px: 54, wt: 900, bg: TEAL, fg: BG, a: fin(t, R1 + .05), s: pin(t, R1 + .05), rot: -.015 });
    chip(g, 'VS. THIS TIME LAST WEEK', CX, 975, { px: 48, wt: 900, bg: CREAM, fg: BG, a: fin(t, R1 + .2), s: Math.min(1.05, pin(t, R1 + .2)), rot: .015, maxw: 720 });
    label(g, 'NOT TO SCALE · ~370×', 430, 1200, fin(t, R1 + .45), CREAM, 36, 'center', true);
  }
  var CROSS = {};
  function cross(v) {
    if (CROSS[v] != null) return CROSS[v];
    for (var t = R0; t <= R1 + .01; t += 1 / 240) { var k = eio(seg(t, R0, R1)); if (Math.pow(36980, k) - 1 >= v) return (CROSS[v] = t); }
    return (CROSS[v] = R1);
  }

  /* =====================================================================================================
     SCENE 4 · never: the deck's VU meter; the needle bobs in the past-spikes zone, then pins past the scale
     ===================================================================================================== */
  function meterScene(g, t) {
    var s0 = S('meter').t0, sd = at('never', 'spiked'), nv = at('never', 'never'), en = end('never');
    var px = CX, py = 1110, R = 340;
    /* housing + face */
    rr(g, CX - 400 + 10, 560 + 16, 790, 640, 40); g.fillStyle = 'rgba(0,0,0,.42)'; g.fill();
    rr(g, CX - 400, 560, 800, 640, 40); g.fillStyle = PURP; g.fill(); g.strokeStyle = 'rgba(251,240,234,.25)'; g.lineWidth = 4; g.stroke();
    rr(g, CX - 360, 610, 720, 540, 26); g.fillStyle = PAPER; g.fill();
    g.save(); rr(g, CX - 360, 610, 720, 540, 26); g.clip();
    var A0 = -Math.PI * .86, A1 = -Math.PI * .14, AB = -Math.PI * .58;
    g.lineCap = 'butt';
    g.strokeStyle = 'rgba(138,132,146,.55)'; g.lineWidth = 46; g.beginPath(); g.arc(px, py, R, A0, AB); g.stroke();
    g.strokeStyle = HOT; g.lineWidth = 46; g.beginPath(); g.arc(px, py, R, -Math.PI * .27, A1); g.stroke();
    g.strokeStyle = INK; g.lineWidth = 5;
    for (var i = 0; i <= 14; i++) { var an = lerp(A0, A1, i / 14), r1 = R - 30, r2 = R + (i % 2 ? 30 : 44); g.beginPath(); g.moveTo(px + Math.cos(an) * r1, py + Math.sin(an) * r1); g.lineTo(px + Math.cos(an) * r2, py + Math.sin(an) * r2); g.stroke(); }
    g.restore();
    label(g, 'PAST SPIKES', 315, 1100, fin(t, sd - .1), INK, 38);
    label(g, 'TRAILER 1', 715, 1100, fin(t, sd), HOT, 38);
    /* the needle */
    var bob = -Math.PI * .74 + .09 * Math.sin(t * 7.3) + .05 * Math.sin(t * 13.1 + 1);
    var rise = -Math.PI * .74 + .5 * Math.sin(t * 2) * 0;
    var go = eio(seg(t, nv - .05, nv + .45)), pinA = -Math.PI * .1 + .02 * Math.sin(t * 31) * seg(t, nv + .4, nv + .5);
    var slam = Math.max(0, knock(t, GT.slam || en + .05, 26, 9)) * .05;
    var an2 = t < sd - .2 ? lerp(-Math.PI * .86, bob, seg(t, s0, s0 + .4)) : lerp(bob, pinA, go) - slam;
    g.save(); rr(g, CX - 360, 610, 720, 540, 26); g.clip();
    g.strokeStyle = 'rgba(0,0,0,.25)'; g.lineWidth = 12; g.lineCap = 'round'; g.beginPath(); g.moveTo(px + 6, py + 8); g.lineTo(px + 6 + Math.cos(an2) * (R + 30), py + 8 + Math.sin(an2) * (R + 30)); g.stroke();
    g.strokeStyle = INK; g.lineWidth = 10; g.beginPath(); g.moveTo(px, py); g.lineTo(px + Math.cos(an2) * (R + 30), py + Math.sin(an2) * (R + 30)); g.stroke();
    g.fillStyle = INK; el(g, px, py, 44, 44); g.fillStyle = HOT; el(g, px, py, 18, 18);
    g.restore();
    var nb = at('never', 'had') - .05; chip(g, 'NEVER LIKE THIS', CX, 1300, { px: 64, wt: 900, line: HOT, lw: 5, fg: HOT, a: fin(t, nb), s: pin(t, nb) * kn(t, GT.slam || en), rot: -.02, maxw: 700, shadow: false });
    label(g, 'SPOTIFY, VIA BBC NEWSBEAT', CX, 1410, fin(t, s0 + .35), CREAM, 36, 'center', true);
  }

  /* =====================================================================================================
     SCENE 5 · two: a second tape, teal, 1986
     ===================================================================================================== */
  var RX = 270, RY = [610, 890, 1170], RW = 330;
  function rackFrame(g, a) {
    if (a <= 0) return;
    g.save(); g.globalAlpha *= a;
    g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(108, 470, 18, 860); g.fillStyle = CREAM; g.fillRect(100, 462, 18, 860);
    RY.forEach(function (y) { g.fillStyle = 'rgba(251,240,234,.35)'; g.fillRect(100, y + 112, 820, 8); });
    g.restore();
  }
  function rackLabels(g, a) {
    if (a <= 0) return;
    g.save(); g.globalAlpha *= a; g.strokeStyle = CREAM; g.lineWidth = 6; g.lineCap = 'round';
    g.beginPath(); g.moveTo(470, RY[0] - 60); g.lineTo(500, RY[0] - 60); g.lineTo(500, RY[1] + 60); g.lineTo(470, RY[1] + 60); g.moveTo(500, (RY[0] + RY[1]) / 2); g.lineTo(530, (RY[0] + RY[1]) / 2); g.stroke(); g.restore();
    label(g, 'OLD SONGS', 550, (RY[0] + RY[1]) / 2, a, CREAM, 52, 'left');
  }
  function twoScene(g, t) {
    var s0 = S('two').t0, tw = at('two', 'two'), ag = at('two', 'again'), e2 = end('two') + .05;
    var rk = eio(seg(t, e2, e2 + .5));       // the pair settles into the rack before "But"
    var big = 1 - rk;
    rackFrame(g, rk);
    var cy = 760 + 20 * (1 - clamp(pop(t, s0, 2.6), 0, 1));
    cassette(g, lerp(CX, RX, rk), lerp(cy, RY[1], rk), lerp(800, RW, rk), { shell: TEAL, stripe: HOT, reel: HOT, sticker: ORG, ang: spin(t, ag - .1, 7), rot: lerp(.02, .02, rk), year: '1986',
      stickK: pop(t, s0 + .05, 3.2) * big, yearBig: seg(rk, .5, 1), title: rk < .5 ? 'HOT TOGETHER' : '', titleK: 1, artist: 'POINTER SISTERS', artistK: fin(t, s0 + .1) * clamp(big * 2 - 1, 0, 1), a: fin(t, s0) });
    chip(g, 'TRAILER 2 · MAY 2025', CX, 1090, { px: 54, wt: 900, bg: CREAM, fg: BG, a: fin(t, tw - .15) * big, s: pin(t, tw - .15), rot: -.015, maxw: 800 });
    /* the first tape slides in beside it on "again": the old-song pattern */
    var sk = eio(seg(t, ag - .45, ag + .05));
    if (sk > 0) {
      cassette(g, lerp(lerp(330, 250, sk), RX, rk), lerp(1255, RY[0], rk), lerp(300, RW, rk), { ang: spin(t, ag, 6), rot: lerp(-.05, -.02, rk), year: '1989', yearBig: 1, a: clamp(sk * 2.5, 0, 1) });
      chip(g, 'OLD SONG AGAIN', 660, 1255, { px: 46, wt: 900, line: HOT, lw: 5, fg: HOT, a: fin(t, ag - .35) * (1 - seg(rk, .6, 1)), shadow: false, maxw: 470 });
    }
    rackLabels(g, seg(rk, .7, 1));
    label(g, 'SONG: VIA VGC · MAY 2025', CX, 1410, fin(t, s0 + .2) * big, CREAM, 36, 'center', true);
  }

  /* =====================================================================================================
     SCENE 6 · but: the rack grows a third shelf; the launch trailer breaks the old-song pattern
     ===================================================================================================== */
  function rackScene(g, t) {
    var s0 = S('rack').t0, lt = at('but', 'launch'), bk = at('but', 'broke'), en = GT.crack || end('but') + .05;
    var X = RX, Y = RY, TW = RW;
    rackFrame(g, 1);
    cassette(g, X, Y[0], TW, { ang: spin(t, s0, 5), year: '1989', yearBig: 1, rot: -.02 });
    cassette(g, X, Y[1], TW, { shell: TEAL, stripe: HOT, reel: HOT, ang: spin(t, s0, 5), year: '1986', yearBig: 1, rot: .02 });
    rackLabels(g, 1);
    label(g, 'LAUNCH TRAILER', 490, Y[2] - 40, fin(t, s0 + .02), ORG, 40, 'left');
    label(g, 'OCT 2026', 490, Y[2] + 40, fin(t, s0 + .1), ORG, 40, 'left');
    /* the third slot: a dashed tape outline with a "?", cracks on "broke", shatters in the pause after the line */
    var shat = seg(t, en, en + .9), r = mulberry(33), hw = TW / 2, hh = TW * .315;
    g.save(); g.translate(X, Y[2]);
    if (shat <= 0) {
      g.save(); g.globalAlpha *= fin(t, s0 + .02); g.strokeStyle = ORG; g.lineWidth = 7; g.setLineDash([18, 12]); rr(g, -hw, -hh, TW, hh * 2, 14); g.stroke(); g.setLineDash([]);
      font(g, 140, 900); g.fillStyle = ORG; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('?', 0, 8);
      var ck = eio(seg(t, bk - .05, bk + .3));
      if (ck > 0) { g.strokeStyle = HOT; g.lineWidth = 9; g.lineJoin = 'round'; g.beginPath(); var pts = [[-70, -hh], [-24, -40], [-56, 6], [8, 50], [-14, hh]]; for (var i = 0; i < pts.length * ck; i++) { if (!i) g.moveTo(pts[i][0], pts[i][1]); else g.lineTo(pts[i][0], pts[i][1]); } g.stroke(); }
      g.restore();
    } else {
      for (var j = 0; j < 7; j++) {
        var ox = (r() - .5) * 220, oy = (r() - .5) * 120, vx = (r() - .5) * 200, rot = (r() - .5) * 5, u = shat;
        g.save(); g.globalAlpha *= 1 - u; g.translate(ox + vx * u, oy + 700 * u * u - 80 * u); g.rotate(rot * u);
        g.strokeStyle = ORG; g.lineWidth = 7; g.beginPath(); g.moveTo(-34, -22); g.lineTo(34 + r() * 20, -28); g.lineTo(12, 34); g.closePath(); g.stroke(); g.restore();
      }
    }
    g.restore();
    label(g, 'ROCKSTARGAMES.COM/VI', CX, 1410, fin(t, s0 + .3), CREAM, 36, 'center', true);
  }

  /* =====================================================================================================
     SCENE 7 · new: a glossy new disc for the launch trailer's brand-new song
     ===================================================================================================== */
  function disc(g, x, y, r, t, a, s, rate) {
    if (a <= 0) return;
    g.save(); g.globalAlpha *= clamp(a, 0, 1); g.translate(x, y); g.scale(s || 1, s || 1);
    g.fillStyle = 'rgba(0,0,0,.42)'; el(g, 14, 20, r, r);
    var gr = g.createRadialGradient(0, 0, r * .2, 0, 0, r); gr.addColorStop(0, '#ffb070'); gr.addColorStop(1, ORG); g.fillStyle = gr; el(g, 0, 0, r, r);
    g.rotate(t * (rate || 2.2));
    g.strokeStyle = 'rgba(11,8,32,.12)'; g.lineWidth = 3; for (var i = 0; i < 7; i++) { g.beginPath(); g.arc(0, 0, r * (.45 + i * .075), 0, 6.283); g.stroke(); }
    g.fillStyle = 'rgba(255,255,255,.3)'; g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, r * .98, -.35, .05); g.closePath(); g.fill();
    g.fillStyle = 'rgba(255,79,163,.35)'; g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, r * .98, 2.8, 3.1); g.closePath(); g.fill();
    g.fillStyle = CREAM; el(g, 0, 0, r * .36, r * .36);
    g.restore();
  }
  function newScene(g, t) {
    var s0 = S('new').t0, bn = at('new', 'brandnew'), ju = at('new', 'justice'), cm = at('new', 'composers');
    disc(g, CX, 800, 290, t, fin(t, s0), lerp(.85, 1, clamp(pop(t, s0, 2.8), 0, 1)) * kn(t, bn), 1.2 + 2.5 * seg(t, bn - .1, bn + .5));
    chip(g, 'NEW', CX, 800, { px: 64, wt: 900, fg: BG, a: fin(t, s0 + .05), shadow: false });
    block(g, ['FLOWER IN A HURRICANE'], CX, 1150, 54, fin(t, s0 + .1), 'line', CREAM, 800, DISP);
    chip(g, 'JUSTICE', CX, 1255, { px: 72, wt: 900, bg: HOT, fg: BG, a: fin(t, ju - .1), s: pin(t, ju - .1), rot: -.02 });
    label(g, 'THE GAME’S COMPOSERS', CX, 1340, fin(t, s0 + .15), TEAL, 40);
    label(g, 'ROCKSTARGAMES.COM/VI', CX, 1418, fin(t, s0 + .4), CREAM, 36, 'center', true);
  }

  /* =====================================================================================================
     SCENE 8 · end: the old tape and the new disc, OLD and NEW, neither picked; dissolves into frame 0
     ===================================================================================================== */
  function endScene(g, t) {
    var s0 = S('end').t0, od = at('end', 'old'), nw = at('end', 'new');
    var b1 = 10 * Math.sin(t * 2.4), b2 = 10 * Math.sin(t * 2.4 + Math.PI);
    cassette(g, 300, 790 + b1, 390, { ang: spin(t, s0, 5), rot: -.04, year: '1989', yearBig: 1, a: fin(t, s0) });
    disc(g, 720, 790 + b2, 192, t, fin(t, s0 + .05), 1, 2);
    chip(g, 'NEW', 720, 790 + b2, { px: 46, wt: 900, fg: BG, a: fin(t, s0 + .05), shadow: false });
    chip(g, 'OLD', 300, 1060, { px: 88, wt: 900, bg: HOT, fg: BG, a: fin(t, s0 + .3), s: pin(t, s0 + .3) * kn(t, od), rot: -.03 });
    chip(g, 'NEW', 720, 1060, { px: 88, wt: 900, bg: ORG, fg: BG, a: fin(t, s0 + .4), s: pin(t, s0 + .4) * kn(t, nw), rot: .03 });
    chip(g, 'GTA 6 · NOV 19, 2026', CX, 1260, { px: 54, wt: 900, bg: CREAM, fg: BG, a: fin(t, s0 + .3), rot: .01, maxw: 800 });
    label(g, 'ROCKSTARGAMES.COM/VI', CX, 1400, fin(t, s0 + .45), CREAM, 36, 'center', true);
  }

  /* ---------- captions (the voice, word by word; the hook line is carried by the picture) ---------- */
  var CAPBRK = { song: ['tom'], never: ['but'], new: ['from', 'the'] };
  var CAPS = (function () {
    var out = [];
    VO.lines.forEach(function (l) {
      if (l.id === 'hook' || l.id === 'hook2') return;
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
  var STRESS = [['song', 'song'], ['song', 'road'], ['bside', 'single'], ['bside', 'bside'], ['ask', 'one'], ['bbc', 'bbc'], ['num', '37000'], ['num', 'percent'],
    ['week', 'before'], ['never', 'never'], ['two', 'again'], ['but', 'broke'], ['new', 'brandnew'], ['new', 'justice'], ['end', 'old'], ['end', 'new']]
    .map(function (p) { return at(p[0], p[1], p[2]); });
  function stressed(w) { for (var i = 0; i < STRESS.length; i++) if (Math.abs(STRESS[i] - w.t0) < .02) return true; return false; }
  /* captions never draw over a cut */
  function wipeHide(t) {
    var a = 1; SC.forEach(function (sc) { if (sc.swipe) a = Math.min(a, 1 - seg(t, sc.t0 - SWIPE - .14, sc.t0 - SWIPE) * (1 - seg(t, sc.t0 + .02, sc.t0 + .14))); });
    return a;
  }
  var GLUE = { the: 1, a: 1, an: 1, your: 1, its: 1, of: 1, at: 1, to: 1, and: 1, in: 1, with: 1, on: 1, by: 1, so: 1, one: 1 };
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
  var SCENES = { tape: tapeScene, ask: askScene, hero: heroScene, meter: meterScene, two: twoScene, rack: rackScene, new: newScene, end: endScene };
  function stage(g, t) {
    g.fillStyle = BG; g.fillRect(0, 0, W, H);
    var sa = t == null ? 1 : clamp(1 - seg(t, 4.5, 5.5) + seg(t, HOME - .5, HOME), 0, 1); if (sa <= 0) return;
    g.save(); g.globalAlpha *= sa;
    SKY.forEach(function (b) { g.fillStyle = '#140a33'; g.fillRect(b[0], 1830 - b[2], b[1], b[2] + 100); b[3].forEach(function (w) { g.fillStyle = w[2] ? 'rgba(255,138,61,.55)' : 'rgba(25,211,197,.28)'; g.fillRect(b[0] + w[0], 1830 - b[2] + w[1], 12, 18); }); });
    g.fillStyle = 'rgba(25,211,197,.35)'; g.fillRect(0, 1830, W, 4);
    g.restore();
  }
  function sceneAt(t) { for (var i = SC.length - 1; i >= 0; i--) if (t >= SC[i].t0) return i; return 0; }
  function drawScene(g, Sc, t) {
    g.save();
    if (Sc.id !== 'tape' && Sc.id !== 'end') { var push = 1 + .012 * seg(t, Sc.t0, Sc.t1); g.translate(CX, 1000); g.scale(push, push); g.translate(-CX, -1000); }
    SCENES[Sc.id](g, t);
    g.restore();
  }
  function edgeY(x, ly, t) { return ly + (x - 540) * .10 + Math.sin(x * .02 + t * 6) * 3; }
  var POSTERMODE = false;
  function frame(g, t) {
    g.setTransform(1, 0, 0, 1, 0, 0);
    stage(g, t);
    var si = sceneAt(t), Sc = SC[si], Nx = SC[si + 1];
    var sk = Nx && Nx.swipe ? eio(seg(t, Nx.t0 - SWIPE, Nx.t0)) : 0;
    var pre = Sc.swipe && t < Sc.t0 + PRE;
    drawScene(g, Sc, pre ? Sc.t0 + PRE : t);
    if (sk > 0) {
      var ly = H * (1 - sk) - 70, x;
      g.save(); g.beginPath(); g.moveTo(0, H); for (x = 0; x <= W; x += 30) g.lineTo(x, edgeY(x, ly, t)); g.lineTo(W, H); g.closePath(); g.clip();
      stage(g, t); INCOMING = true; drawScene(g, Nx, Nx.t0 + PRE); INCOMING = false; g.restore();
      g.save(); g.lineJoin = 'round';
      [[HOT, 10, 0], [TEAL, 6, 16]].forEach(function (c) { g.strokeStyle = c[0]; g.lineWidth = c[1]; g.beginPath(); for (x = 0; x <= W; x += 30) { var yy = edgeY(x, ly, t) + c[2]; if (x === 0) g.moveTo(x, yy); else g.lineTo(x, yy); } g.stroke(); });
      g.restore();
    }
    var back = eio(seg(t, HOME, HOME + .35));
    if (back > 0) { g.save(); g.globalAlpha = back; stage(g, 0); g.translate(CX, 1000); g.scale(lerp(.9, 1, back), lerp(.9, 1, back)); g.translate(-CX, -1000); tapeScene(g, 1 / 60); g.restore(); }
    if (POSTERMODE) posterTitle(g);
    else if (LIVE.text) { if (back > 0) captions(g, t, 1 - back); else captions(g, t); }
    if (!POSTERMODE) {
      g.fillStyle = 'rgba(251,240,234,.12)'; g.fillRect(90, 222, 840, 6);
      g.fillStyle = HOT; g.fillRect(90, 222, 840 * (back > 0 ? 1 - back : t / DUR), 6);
    }
    if (LIVE.grain && NOISE) { g.globalAlpha = .05; g.globalCompositeOperation = 'overlay'; var o = Math.floor(t * 24) * 37 % 256; g.fillStyle = g.createPattern(NOISE, 'repeat'); g.translate(-o, -o); g.fillRect(o, o, W, H); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }
  }
  function posterTitle(g) {
    g.save(); g.fillStyle = 'rgba(11,8,32,.92)'; g.fillRect(0, 250, W, 240); font(g, 80, 900); wide(g); g.textBaseline = 'alphabetic'; g.textAlign = 'center';
    g.fillStyle = CREAM; g.fillText('GTA 6 REVIVED', CX, 350);
    var b = 'A 1989 SONG', wb = g.measureText(b).width;
    g.fillStyle = HOT; g.beginPath(); g.roundRect(CX - wb / 2 - 16, 372, wb + 32, 104, 18); g.fill();
    g.fillStyle = BG; g.fillText(b, CX, 452); g.restore();
  }
  function TEXTS(t) {
    var out = [];
    function T(id, text, a, b) { if (t >= a && t < b) out.push({ id: id, text: text, x0: 0, y0: 0, x1: 0, y1: 0 }); }
    function cut(id) { return S(id).t0 - .2; }
    var bs = start('bside'), sg = start('song') - .25, rv = GT.rev || 1.9;
    T('gta', 'GTA 6', 0, sg); T('gta', 'GTA 6', HOME + .3, DUR + 1);
    T('y89', '1989', 0, at('song', 'love') - .2); T('y89', '1989', HOME + .3, DUR + 1);
    T('rev', 'REVIVED', rv + .1, at('song', 'tom') - .25);
    T('srch', 'GTA 6 TRAILER SONG', rv + .2, at('song', 'song') + .15);
    T('title', 'LOVE IS A LONG ROAD', at('song', 'love') + .1, wend('bside', 'single') + .2);
    T('artist', 'TOM PETTY', at('song', 'tom'), wend('bside', 'single') + .2);
    T('t1', 'TRAILER 1 · DEC 2023', at('song', 'song') + .25, bs - .3);
    T('src1', 'SOURCE: TOMPETTY.COM', at('song', 'trailer') + .4, bs - .3);
    T('single', 'SINGLE', bs - .1, cut('ask'));
    T('bside', 'B-SIDE', wend('bside', 'single') + .4, cut('ask'));
    T('trl', 'TRAILER 1', S('ask').t0 + .2, cut('hero'));
    T('old', 'AN OLD SONG', S('ask').t0 + .45, cut('hero'));
    T('spot', 'SPOTIFY', S('hero').t0 + .1, R0 - .4);
    T('bbc', 'BBC NEWSBEAT', S('hero').t0 + .3, R0 - .4);
    T('dec6', 'DEC 6, 2023', S('hero').t0 + .35, R0 - .4);
    T('via', 'VIA BBC NEWSBEAT · DEC 2023', R0 - .05, cut('meter'));
    T('wkb', 'SAME DAYS, WEEK BEFORE', R0, cut('meter'));
    T('wka', 'SINCE THE TRAILER', R0, cut('meter'));
    T('hero', '36,979%', R1 + .1, cut('meter'));
    T('strm', 'SPOTIFY STREAMS', R1 + .2, cut('meter'));
    T('vs', 'VS. THIS TIME LAST WEEK', R1 + .35, cut('meter'));
    T('nts', 'NOT TO SCALE ~370×', R1 + .6, cut('meter'));
    T('past', 'PAST SPIKES', at('never', 'spiked'), cut('two'));
    T('nlt', 'NEVER LIKE THIS', at('never', 'had') + .04, cut('two'));
    T('t1m', 'TRAILER 1', at('never', 'spiked') + .15, cut('two'));
    T('src3', 'SPOTIFY, VIA BBC NEWSBEAT', S('meter').t0 + .5, cut('two'));
    T('hot', 'HOT TOGETHER', S('two').t0 + .2, end('two') + .2);
    T('ptr', 'POINTER SISTERS', S('two').t0 + .25, end('two') + .2);
    T('t2', 'TRAILER 2 · MAY 2025', at('two', 'two') + .05, end('two') + .2);
    T('again', 'OLD SONG AGAIN', at('two', 'again') - .2, end('two') + .3);
    T('src4', 'SONG: VIA VGC · MAY 2025', S('two').t0 + .35, end('two') + .2);
    T('rack', 'OLD SONGS', end('two') + .5, cut('new'));
    T('lt', 'LAUNCH TRAILER', S('rack').t0 + .05, cut('new'));
    T('oct', 'OCT 2026', S('rack').t0 + .15, cut('new'));
    T('flw', 'FLOWER IN A HURRICANE', S('new').t0 + .25, cut('end'));
    T('jus', 'JUSTICE', at('new', 'justice') + .05, cut('end'));
    T('cmp', 'THE GAME’S COMPOSERS', S('new').t0 + .3, cut('end'));
    T('vote', 'OLD NEW', S('end').t0 + .55, HOME);
    T('nov', 'GTA 6 · NOV 19, 2026', S('end').t0 + .45, HOME);
    return out;
  }

  /* ---------- events: hits placed in pauses by the gate; beats with no free pause stay silent ---------- */
  function initTimes() {
    var i;
    R0 = at('num', 'streams') - .05; R1 = wend('num', 'percent') - .02; LAND = R1;
    /* frame 0: the tape seats in the deck (fires before the first word, under it in level) */
    EV.push({ t: .0, type: 'clunk', g: .55, id: 'seat' });
    /* REVIVED slams in the pause after "GTA 6 revived" (0.15 s margins, a short stamp) */
    GT.rev = end('hook') + .12; EV.push({ t: GT.rev, type: 'stampS', g: 1, id: 'rev' });   // pinned: the voice is silent 1.75–2.2 s (checked on the voice-only file); Whisper stretches "revived" to 2.08 s over the pause
    /* the wipes */
    SC.forEach(function (sc) { if (sc.swipe) G('w_' + sc.id, sc.t0 - SWIPE + .02, 'tear', .3, .9); });
    /* bside: the tape flips */
    G('flip', at('bside', 'just') - .2, 'flap', .25, .9);
    /* ask: the "?" lands */
    G('q', end('ask') + .05, 'pop', .3, .8);
    /* hero: the counter winds up in the pause before "Streams" (speeding ticks), ticks where the line leaves room, then the ratchet */
    for (i = 0; i < 6; i++) G('wind' + i, R0 - .62 + i * .1 - i * i * .006, 'wind', .03, .5 + i * .08);
    var s0 = R0, ss = R1 - R0;
    for (i = 0; i < 18; i++) { var u = i / 17; G('roll' + i, s0 + ss * eio(u), 'tick', .02, .45 + .3 * u); }
    GT.land = end('num') + .5; EV.push({ t: GT.land, type: 'ratchet', g: 1, id: 'land' });   // pinned: the voice is silent ~0.3–1.3 s after vo.js's "percent"; Whisper pins the next word early (checked on the final mix)
    /* never: the needle hits the peg after "this" */
    G('slam', end('never') + .04, 'thump', .3, .55);
    /* two: the reels spin up on "again" */
    G('reel2', wend('two', 'again') + .03, 'whirr', .25, .3);
    /* rack: the dashed third slot shatters after "pattern" */
    G('crack', end('but') + .04, 'crack', .3, .6);
    /* new: the disc spins up */
    G('spin3', wend('new', 'justice') + .03, 'pop', .25, .7);
    /* end: OLD and NEW land; a swish home into frame 0 */
    G('vote', end('end') + .05, 'pop', .3, .9);
    G('home', HOME - .05, 'swish', .3, .8);
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

  /* ---------- sound: foley from the tape deck, cut to the pauses; no music (Isac adds a TikTok sound) ---------- */
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
    function thump(t, g) { var o = osc('sine', 150, t, t + .2, [[t, 0], [t + .004, g || .4], [t + .14, 0]]); o.frequency.exponentialRampToValueAtTime(50, t + .12); }
    /* the tape seating: a plastic clunk, two clicks and a low knock */
    function clunk(t, g) { thump(t + .01, .45 * g); tick(t, .55 * g); tick(t + .05, .35 * g); var n = noise(t, .08), bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 900; bp.Q.value = 2; var o = bus(1); n.connect(bp); bp.connect(o); env(o.gain, [[t, 0], [t + .003, .35 * g], [t + .07, 0]]); }
    /* reels spinning up: a motor whine rising under a soft hiss, 0.3 s */
    function whirr(t, g) { var o = osc('sawtooth', 70, t, t + .32, [[t, 0], [t + .08, .025 * g], [t + .26, .02 * g], [t + .3, 0]]); o.frequency.exponentialRampToValueAtTime(180, t + .3); band(t, t + .3, 1500, 3000, .03 * g, .015 * g, 2); for (var j = 0; j < 4; j++) tick(t + .05 + j * .06, .25 * g); }
    /* the counter's ratchet: fast ticks that slow down, then the bell */
    function ratchet(t, g) { var u = 0; for (var j = 0; j < 7; j++) { tick(t + u, (.5 - j * .04) * g); u += .016 + j * .005; } thump(t + u, .3 * g); [[1319, .1], [1976, .06]].forEach(function (p, j) { var a = t + u + .02 + j * .02; osc('sine', p[0], a, a + .24, [[a, 0], [a + .005, p[1] * .8 * g], [a + .2, 0]], (j - .5) * .4); }); }
    function ding(t, g) { [[1319, .1], [1976, .06], [2637, .03]].forEach(function (p, j) { osc('sine', p[0], t + j * .02, t + .5, [[t + j * .02, 0], [t + j * .02 + .005, p[1] * g], [t + .45, 0]], (j - 1) * .3); }); }
    function popS(t, g) { var o = osc('sine', 300, t, t + .12, [[t, 0], [t + .004, .14 * (g || 1)], [t + .1, 0]]); o.frequency.exponentialRampToValueAtTime(900, t + .08); }
    function flap(t, g) { var n = noise(t, .07), bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 2200; bp.Q.value = 1.2; var o = bus(1, .2); n.connect(bp); bp.connect(o); env(o.gain, [[t, 0], [t + .003, .3 * g], [t + .06, 0]]); thump(t + .02, .15 * g); }
    function tear(t, t1, g) { band(t, t1, 700, 2600, .05 * g, .04 * g, 1.8); for (var j = 0; j < 4; j++) tick(t + (t1 - t) * (j + .5) / 4, .12 * g); }
    function crack(t, g) { tick(t, .6 * g); tick(t + .03, .45 * g); band(t, t + .2, 3200, 1400, .12 * g, .03 * g, 1.4); for (var j = 0; j < 5; j++) tick(t + .08 + j * .028 + rnd() * .01, .2 * g); }
    EV.forEach(function (e) {
      var g = e.g == null ? 1 : e.g;
      if (e.type === 'clunk') clunk(e.t, g);
      else if (e.type === 'wind') { var wn = noise(e.t, .03), wb = ac.createBiquadFilter(); wb.type = 'bandpass'; wb.frequency.value = 1700; wb.Q.value = 3; var wo = bus(1, (rnd() - .5) * .3); wn.connect(wb); wb.connect(wo); env(wo.gain, [[e.t, 0], [e.t + .002, .9 * g], [e.t + .025, 0]]); }
      else if (e.type === 'stampS') { thump(e.t, .55 * g); var sn = noise(e.t, .12), sl = ac.createBiquadFilter(); sl.type = 'lowpass'; sl.frequency.value = 1600; var so = bus(1); sn.connect(sl); sl.connect(so); env(so.gain, [[e.t, 0], [e.t + .004, .3 * g], [e.t + .1, 0]]); }
      else if (e.type === 'whirr') whirr(e.t, g);
      else if (e.type === 'ticks') { tick(e.t, .45 * g); tick(e.t + .05, .35 * g); tick(e.t + .1, .3 * g); }
      else if (e.type === 'tear') tear(e.t, e.t + .28, g);
      else if (e.type === 'flap') flap(e.t, g);
      else if (e.type === 'pop') popS(e.t, g);
      else if (e.type === 'ratchet') ratchet(e.t, g);
      else if (e.type === 'ding') ding(e.t, g);
      else if (e.type === 'thump') { thump(e.t, .5 * g); tick(e.t, .3 * g); }
      else if (e.type === 'crack') crack(e.t, g);
      else if (e.type === 'swish') band(e.t, e.t + .24, 900, 5200, .1 * g, .02, 1.6);
    });
    /* no music: Isac adds a trending sound on the platform; the film ships voice + sound effects */
    var MUSIC = false;
    if (MUSIC) { /* intentionally empty */ }
    env(master.gain, [[0, .8], [DUR - .3, .8], [DUR, .55]]);
    /* room tone, so the loop seam is never digital zero */
    (function () { var o = bus(1), lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900; lp.Q.value = .5;
      var n = noise(0, DUR); n.connect(lp); lp.connect(o); o.gain.value = .006; })();
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
    return Promise.all(fonts.map(function (f) { return document.fonts.load(f, 'Aa0%°×−≈≠µ“”’·→…#?‹'); })).then(function () { return document.fonts.ready; }).then(function () {
      STEX = {};
      window.READY = true;
    });
  }

  initTimes();
  var POSTER_T = Math.min(end('week') + .25, S('meter').t0 - SWIPE - .1);
  window.FILM = { bare: function () { ctx.setTransform(1, 0, 0, 1, 0, 0); stage(ctx); }, W: W, H: H, DUR: DUR, POSTER: POSTER_T, SLUG: 'gta-songs', SHOTS: SHOTS, init: init, render: render, frame: frame, LIVE: LIVE };
  window.BOUNDS_RUN = function (step) {
    BOUNDS = []; var out = {};
    for (var t = 0; t <= DUR + 1e-6; t += step || 1 / 15) { CURT = t; POSTERMODE = false; frame(ctx, t); }
    BOUNDS.forEach(function (b) { var o = out[b.text] || (out[b.text] = { text: b.text, from: b.t, to: b.t, x0: b.x0, x1: b.x1, y1: b.y1, n: 0 }); o.to = b.t; o.n++; o.x0 = Math.min(o.x0, b.x0); o.x1 = Math.max(o.x1, b.x1); o.y1 = Math.max(o.y1, b.y1); });
    BOUNDS = null; return Object.keys(out).map(function (k) { return out[k]; });
  };
  window.DUR = DUR; window.EV = EV; window.TEXTS = TEXTS; window.SCORE = SCORE; window.READY = false;
  window.render = function (t, s, sh, fps) { render(t, s, sh, fps); };
})();
