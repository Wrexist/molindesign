/* "Lucia breaks the lineup": GTA 6, Delta #6. A vertical film written in code, narrated first and cut to the voice:
   every visual beat is keyed to a word time from vo/vo.js (window.VO) with at(id, word). Pure function of t.
   Contract: window.FILM, DUR, render(t), READY, EV, TEXTS(t), SCORE(ctx).
   Native move: a police lineup wall. 13 grey slots (every GTA story lead since GTA III, our count) and one double-width
   pink slot. The wall empties, refills one lead per spoken name with a clack, the counter in the pink slot lands on 13
   (the one hero number), then Lucia and Jason share the fourteenth slot. The turn (1997, PC) is a pixel character-select
   strip of our own figures; the end vote dissolves back into frame 0.
   Own flat shapes in a Vice City palette. Silhouettes are generic (ellipse head, trapezoid shoulders), never traced.
   No Rockstar footage, logo or key art, no music. Facts and sources: BRIEF.md. */
(function () {
  'use strict';
  var W = 1080, H = 1920, VO = window.VO, DUR = VO.dur, CX = 510;
  var BG = '#0b0820', CREAM = '#fbf0ea';
  var HOT = '#ff4fa3', TEAL = '#19d3c5', ORG = '#ff8a3d';
  var PURP = '#241250', PURP2 = '#160b36', PAPER = '#fbf0ea', INK = '#0b0820', GREY = '#77718a', GREY2 = '#5d586e';
  var DISP = 'Archivo', MONO = '"Geist Mono"', SERIF = '"Instrument Serif"';

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

  /* ---------- the SFX gate: hits sit in pauses, clear of every word vo.js has and Whisper heard in the mix (vo/heard.js) ---------- */
  var EDGES = [], VOICED = [];
  /* the gate uses where the voice really sounds (vo/vad.js, from the track's energy); without it, vo.js words + Whisper's heard words */
  if (window.VAD) window.VAD.forEach(function (v) { VOICED.push({ t0: v[0], t1: v[1] }); EDGES.push(v[0], v[1]); });
  else VO.lines.forEach(function (l) { l.words.forEach(function (w) { VOICED.push({ t0: w.t0, t1: w.t1 }); EDGES.push(w.t0, w.t1); }); });
  if (!window.VAD) (window.HEARD || []).forEach(function (w) { if (w[1] < .15) return; VOICED.push({ t0: w[0], t1: w[1] }); EDGES.push(w[0], w[1]); });   // Whisper pins the first word to 0.00
  function free(m) {
    var B = [], M = [], F = [], p = 0;
    EDGES.forEach(function (e) { B.push([e - m, e + m]); });
    VOICED.forEach(function (v) { B.push([v.t0 - .03, v.t1 + .03]); });
    B.sort(function (x, y) { return x[0] - y[0]; });
    B.forEach(function (b) { var L = M[M.length - 1]; if (L && b[0] <= L[1]) L[1] = Math.max(L[1], b[1]); else M.push(b.slice()); });
    M.forEach(function (b) { if (b[0] > p) F.push([p, b[0]]); p = Math.max(p, b[1]); });
    F.push([p, DUR + 9]); return F;
  }
  var BODY = { chord: .62, flash: .12, crack: .14, clack: .1, tick: .03, stamp: .16, bulb: .4, tear: .22, rewind: .34, blip: .16, pop: .12, swish: .26, clang: .2, land: .18, paper: .2 };
  function nearGap(t, type, m) {
    var body = BODY[type] || .12, best = null;
    free(m || (window.VAD ? .15 : .2)).forEach(function (f) {
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

  /* ---------- primitives ---------- */
  function font(g, px, wt, fam) { g.font = (wt || 800) + ' ' + px + 'px ' + (fam || DISP); if (g.__st) try { g.fontStretch = g.__st; } catch (e) {} }
  function rr(g, x, y, w, h, r) { g.beginPath(); g.roundRect(x, y, w, h, Math.max(0, Math.min(r, w / 2, h / 2))); }
  function ls(g, px) { try { g.letterSpacing = px + 'px'; } catch (e) {} }
  function wide(g) { try { g.fontStretch = 'expanded'; } catch (e) {} }
  function cond(g) { g.__st = 'extra-condensed'; try { g.fontStretch = 'extra-condensed'; } catch (e) {} }
  function normal(g) { g.__st = null; try { g.fontStretch = 'normal'; } catch (e) {} }
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
    if (o.line) { if (o.fill) { rr(g, -w / 2, -h / 2, w, h, o.r == null ? h * .26 : o.r); g.fillStyle = o.fill; g.fill(); } rr(g, -w / 2, -h / 2, w, h, o.r == null ? h * .26 : o.r); g.strokeStyle = o.line; g.lineWidth = o.lw || 3; g.stroke(); }
    g.fillStyle = o.fg || (o.bg ? BG : CREAM); g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(text, 0, px * .04); g.restore(); g.__st = null;
    return w;
  }
  /* a source credit on a dark plate: Archivo condensed, 38 px, never under 36 */
  function credit(g, text, x, y, a, col) {
    if (a <= 0) return;
    g.save(); g.globalAlpha *= clamp(a, 0, 1); cond(g); font(g, 38, 700); ls(g, 2); g.textAlign = 'center'; g.textBaseline = 'middle';
    var w = g.measureText(text).width, dy = (1 - Math.min(1, a)) * 10;
    rr(g, x - w / 2 - 18, y - 27 + dy, w + 36, 54, 12); g.fillStyle = 'rgba(11,8,32,.94)'; g.fill();
    g.strokeStyle = 'rgba(251,240,234,.28)'; g.lineWidth = 2; g.stroke();
    g.fillStyle = col || CREAM; g.fillText(text, x, y + 2 + dy); g.restore(); g.__st = null;
  }
  function label(g, text, x, y, a, col, px, align, wt) {
    px = Math.max(36, px || 40);
    if (a <= 0) return;
    g.save(); g.globalAlpha *= clamp(a, 0, 1); font(g, px, wt || 800); ls(g, 1); g.textAlign = align || 'center'; g.textBaseline = 'middle';
    g.fillStyle = col || CREAM; g.fillText(text, x, y + (1 - Math.min(1, a)) * 12); g.restore();
  }
  function tri(g, a, b, c, d, e, f) { g.beginPath(); g.moveTo(a, b); g.lineTo(c, d); g.lineTo(e, f); g.closePath(); g.fill(); }
  function el(g, x, y, rx, ry, rot) { g.beginPath(); g.ellipse(x, y, rx, ry, rot || 0, 0, 6.283); g.fill(); }
  /* rubber stamp: worn ink (seeded speckle), slammed; ALL MEN is the film's one hero stamp */
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
    if (k >= .5) { font(g, px, 900); ls(g, 4); var mm = g.measureText(text); recBox(g, -c.w / 2 + 8, -c.h / 2 + 8, c.w / 2 - 8, c.h / 2 - 8, text); ls(g, 0); }
    g.restore();
  }

  /* =====================================================================================================
     THE LINEUP WALL: x 100–920, y 462–1442. Three rows of five 164 px slots; slot 14 is the double-width pink one.
     ===================================================================================================== */
  var WX0 = 100, WX1 = 920, WY0 = 462, WY1 = 1412, RT = 470, RH = 290, SW = 154, SX0 = 150;
  var LEADS = [
    ['CLAUDE', 'III'], ['TOMMY', 'VICE CITY'], ['CJ', 'S. ANDREAS'], ['MIKE', 'ADVANCE'], ['TONI', 'LCS'],
    ['VIC', 'VCS'], ['NIKO', 'IV'], ['JOHNNY', 'TLAD'], ['HUANG', 'CHINATOWN'], ['LUIS', 'TBOGT'],
    ['MICHAEL', 'V'], ['FRANKLIN', 'V'], ['TREVOR', 'V']
  ];
  var SPOKEN = { 0: 'claude', 1: 'tommy', 2: 'cj', 6: 'niko', 10: 'michael', 11: 'franklin', 12: 'trevor' };
  var QUIET = [3, 4, 5, 7, 8, 9];
  function slot(i) { var r = Math.floor(i / 5), c = i % 5; return { x0: SX0 + c * SW, y0: RT + r * RH, cx: SX0 + c * SW + SW / 2, base: RT + r * RH + 194 }; }
  var S14 = { x0: SX0 + 3 * SW, y0: RT + 2 * RH, w: 2 * SW, h: RH, cx: SX0 + 4 * SW, cy: RT + 2 * RH + RH / 2 };
  var BUILD = (function () { var r = mulberry(5), out = []; for (var i = 0; i < 13; i++) out.push({ sh: .9 + r() * .2, hd: .92 + r() * .14, tilt: (r() - .5) * .05, ph: r() * 6 }); return out; })();

  /* a generic person: ellipse head, rounded trapezoid shoulders. kind 'f' adds a long-hair shape behind the head */
  function person(g, x, base, s, col, kind, b, chest) {
    b = b || { sh: 1, hd: 1, tilt: 0 };
    g.save(); g.translate(x, base); g.scale(s, s); g.rotate(b.tilt || 0);
    var hr = 40 * b.hd, hy = -150, sw = 70 * b.sh;
    if (kind === 'f') {
      g.fillStyle = col === HOT ? '#c23a82' : 'rgba(0,0,0,.35)';
      el(g, 0, hy - 2, hr + 10, hr + 12);
      rr(g, -hr - 10, hy - 4, (hr + 10) * 2, 92, 26); g.fill();
    }
    g.fillStyle = col;
    g.beginPath(); g.moveTo(-sw, 0); g.bezierCurveTo(-sw, -60, -sw + 8, -92, -26, -100); g.lineTo(26, -100); g.bezierCurveTo(sw - 8, -92, sw, -60, sw, 0); g.closePath(); g.fill();
    g.fillRect(-15, hy + hr - 10, 30, 30);
    el(g, 0, hy, hr * .9, hr);
    if (chest) { /* a small booking board held at the chest: no text, just the board and its two lines */
      g.fillStyle = 'rgba(0,0,0,.35)'; rr(g, -33, -66, 70, 40, 5); g.fill();
      g.fillStyle = '#e9e1d4'; rr(g, -36, -70, 72, 40, 5); g.fill();
      g.fillStyle = '#3a3448'; g.fillRect(-26, -60, 52, 6); g.fillRect(-26, -46, 34, 6);
    }
    g.restore();
  }
  function board(g, x, y, name, game, a, s, col) {
    if (a <= 0) return;
    g.save(); g.globalAlpha *= clamp(a, 0, 1); g.translate(x, y); g.scale(s || 1, s || 1);
    var w = 146, h = 88;
    rr(g, -w / 2 + 4, -h / 2 + 6, w, h, 8); g.fillStyle = 'rgba(0,0,0,.4)'; g.fill();
    rr(g, -w / 2, -h / 2, w, h, 8); g.fillStyle = col || PAPER; g.fill();
    cond(g); g.textAlign = 'center'; g.textBaseline = 'middle';
    var px = 42; font(g, px, 900); while (g.measureText(name).width > w - 14 && px > 36) { px--; font(g, px, 900); }
    g.fillStyle = INK; g.fillText(name, 0, -19);
    ls(g, game.length > 9 ? -1.5 : 0); px = 36; font(g, px, 700); while (g.measureText(game).width > w - 10 && px > 36) { px--; font(g, px, 700); } g.fillStyle = '#a3125e'; g.fillText(game, 0, 22);
    g.restore(); g.__st = null;
  }
  function stripes(g, a, off) {
    if (a <= 0) return;
    g.save(); g.globalAlpha *= a; g.beginPath(); g.rect(WX0, WY0, WX1 - WX0, WY1 - WY0); g.clip();
    for (var k = -1; k < 18; k++) { var y = WY0 + 20 + ((k * 58 + (off || 0)) % (58 * 18) + 58 * 18) % (58 * 18); g.fillStyle = k % 5 === 0 ? 'rgba(251,240,234,.22)' : 'rgba(251,240,234,.1)'; g.fillRect(WX0, y, WX1 - WX0, k % 5 === 0 ? 5 : 3); }
    g.restore();
  }
  function wallBack(g, o) {
    o = o || {};
    var fm = o.fm == null ? 1 : o.fm;
    rr(g, WX0, WY0 + 12, WX1 - WX0, WY1 - WY0, 22); g.fillStyle = 'rgba(0,0,0,.4)'; g.fill();
    rr(g, WX0, WY0, WX1 - WX0, WY1 - WY0, 22); g.fillStyle = PURP; g.fill();
    stripes(g, .7, o.off);
    /* the height chart: 7', 6', 5' on every row, bright lines across the wall */
    for (var rr0 = 0; rr0 < 3; rr0++) {
      var y0 = RT + rr0 * RH;
      [[22, "7'"], [102, "6'"], [182, "5'"]].forEach(function (m) {
        g.fillStyle = 'rgba(251,240,234,.6)'; g.fillRect(WX0 + 8, y0 + m[0] - 2, WX1 - WX0 - 16, 4);
        if (fm > 0) { g.save(); g.globalAlpha *= fm; cond(g); font(g, 36, 900); g.fillStyle = CREAM; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(m[1], 125, y0 + m[0] + 22); g.restore(); g.__st = null; }
      });
    }
    /* the three shelves: a teal rule under each row */
    for (var r = 0; r < 3; r++) { g.fillStyle = 'rgba(25,211,197,.55)'; g.fillRect(WX0 + 8, RT + r * RH + RH - 6, WX1 - WX0 - 16, 4); }
    
  }
  function slotPanel(g, i, a) {
    var s = slot(i); if (a <= 0) return;
    g.save(); g.globalAlpha *= a; rr(g, s.x0 + 5, s.y0 + 4, SW - 10, RH - 14, 12); g.fillStyle = 'rgba(22,11,54,.55)'; g.fill(); g.restore();
  }
  /* one lead in its slot. k: 0 = gone below the slot, 1 = standing. bd: board alpha. fl: flash */
  function lead(g, i, t, k, bd, fl, dim, col) {
    var s = slot(i), b = BUILD[i];
    g.save(); g.beginPath(); g.rect(s.x0 + 2, s.y0 - 4, SW - 4, RH - 8); g.clip();
    if (k > 0) {
      g.save(); g.globalAlpha *= 1 - (dim || 0) * .65;
      var bob = Math.sin(t * 1.4 + b.ph) * 2;
      person(g, s.cx, s.base + (1 - k) * 230 + bob, .95, col || GREY, 'm', b, true);
      g.restore();
    }
    if (fl > 0) { g.fillStyle = 'rgba(255,255,255,' + (.55 * fl).toFixed(3) + ')'; g.fillRect(s.x0 + 5, s.y0 + 4, SW - 10, RH - 14); }
    g.restore();
    if (bd > 0) {
      var dk = eo(clamp(bd, 0, 1)), y = s.y0 + 236 - (1 - dk) * 60;
      g.save(); g.globalAlpha *= 1 - (dim || 0) * .6; board(g, s.cx, y, LEADS[i][0], LEADS[i][1], clamp(bd * 3, 0, 1), 1); g.restore();
    }
  }
  /* the pink slot's outline (dashed while empty) */
  function slot14Frame(g, t, a, dashed, sc) {
    if (a <= 0) return;
    g.save(); g.globalAlpha *= a; g.translate(S14.cx - 400 * ((sc || 1) - 1), S14.cy); g.scale(sc || 1, sc || 1);
    rr(g, -S14.w / 2 + 6, -S14.h / 2 + 4, S14.w - 12, S14.h - 14, 14); g.fillStyle = 'rgba(255,79,163,.16)'; g.fill();
    g.strokeStyle = HOT; g.lineWidth = 7; if (dashed) { g.setLineDash([22, 14]); g.lineDashOffset = -t * 30; }
    g.stroke(); g.setLineDash([]); g.restore();
  }
  function bigQ(g, x, y, px, a, t) {
    if (a <= 0) return;
    var s = 1 + .06 * Math.sin(t * 5.2);
    g.save(); g.globalAlpha *= clamp(a, 0, 1); g.translate(x, y); g.scale(s, s); font(g, px, 900); g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillStyle = 'rgba(0,0,0,.35)'; g.fillText('?', 8, 12); g.fillStyle = HOT; g.fillText('?', 0, 0); g.restore();
  }
  /* the counter: two odometer wheels */
  function wheels(g, cx, cy, v, n, o) {
    var cw = o.cw, ch = o.ch, gp = o.gap == null ? 8 : o.gap, px = o.px || ch * .8;
    var w = n * cw + (n - 1) * gp, x = cx - w / 2;
    for (var i = 0; i < n; i++) {
      var p = n - 1 - i, P10 = Math.pow(10, p), f = (v / P10) % 10, d = Math.floor(f), r = p === 0 ? f - d : clamp((v % P10) - (P10 - 1), 0, 1);
      g.save(); rr(g, x + 4, cy - ch / 2 + 8, cw, ch, 14); g.fillStyle = 'rgba(0,0,0,.35)'; g.fill();
      rr(g, x, cy - ch / 2, cw, ch, 14); g.fillStyle = '#05030f'; g.fill(); g.clip();
      font(g, px, 900); g.fillStyle = o.fg || CREAM; g.textAlign = 'center'; g.textBaseline = 'middle';
      NOREC = r > .02; g.fillText(String(d), x + cw / 2, cy + 6 - r * ch); NOREC = true; if (r > .001) g.fillText(String((d + 1) % 10), x + cw / 2, cy + 6 + (1 - r) * ch); NOREC = false;
      g.fillStyle = 'rgba(255,255,255,.07)'; g.fillRect(x, cy - ch / 2, cw, ch * .2);
      g.restore(); x += cw + gp;
    }
  }

  /* fill times: spoken leads on their names, the six quiet ones in the pause after "Trevor", landing 13 on "Thirteen" */
  var FILL = [], BDT = [], FALL0, R13;
  function countAt(t) {
    /* the counter rolls a step at each fill (0.14 s per step), sampled on the rendered frame */
    var tq = qt(t), v = 0;
    var ts = FILL.slice().sort(function (a, b) { return a - b; });
    ts.forEach(function (f) { v += eio(seg(tq, f - .02, f + .12)); });
    return v;
  }

  /* scenes. swipe:true = the next scene rises in under a slanted edge */
  var SWIPE = .42, PRE = .3, SC;
  function S(id) { for (var i = 0; i < SC.length; i++) if (SC[i].id === id) return SC[i]; }
  var HOME;

  /* =====================================================================================================
     SCENE 1 · hook, since, names, hero, ask: the wall, emptied and refilled, the 13 lands, the "?" returns
     ===================================================================================================== */
  function wallScene(g, t, home) {
    var i, br = home ? 0 : at('hook', 'breaks'), shk = home ? 0 : seg(t, GT.crack, GT.crack + .35), sn = home ? 1e9 : start('since');
    var hero = home ? 1e9 : at('hero', 'thirteen'), ask = home ? 1e9 : start('ask'), fin13 = home ? 1e9 : R13;
    var cnt0 = home ? 1e9 : at('since', 'count');
    var dolly = home ? 0 : 1;
    /* a slow dolly-in over the whole scene: the wall is never still */
    var z = 1 + .012 * seg(t, 0, 6) * dolly + .008 * eio(seg(t, ask, ask + 1.4)) * dolly;
    g.save(); g.translate(CX, 950); g.scale(z, z); g.translate(-CX, -950);
    wallBack(g, { off: t * 6, fm: home ? 0 : seg(t, .15, .45) });
    for (i = 0; i < 13; i++) slotPanel(g, i, 1);
    /* the leads: standing on frame 0, dropping out on "Count", refilling on their names */
    var dimK = eio(seg(t, ask + .1, ask + .6));
    for (i = 0; i < 13; i++) {
      var out = eio(seg(t, FALL0 + i * .02, FALL0 + .34 + i * .02));
      var f = FILL[i], inK = home ? 0 : eo(seg(t, f - .1, f + .12));
      var k = t < FILL[i] - .1 ? 1 - out : inK;
      var bt0 = BDT[i] == null ? f : BDT[i], bd = home ? 0 : seg(t, bt0 - .02, bt0 + .16);
      var fl = home ? 0 : (t >= bt0 ? 1 - seg(t, bt0, bt0 + .3) : 0);
      if (!home && i === 0) { var cl = at('names1', 'claude'); if (t >= cl) fl = Math.max(fl, .7 * (1 - seg(t, cl, cl + .35))); }
      lead(g, i, t, k, bd, fl, dimK);
      if (!home && t > FALL0 + .3 && k < .05) { var ss = slot(i); g.save(); g.globalAlpha *= fin(t, FALL0 + .3); g.strokeStyle = 'rgba(251,240,234,.45)'; g.lineWidth = 4; g.setLineDash([14, 10]); g.lineDashOffset = -t * 20; rr(g, ss.x0 + 12, ss.y0 + 12, SW - 24, RH - 30, 10); g.stroke(); g.restore(); }
    }
    /* slot 14 */
    var sc14 = 1 + .03 * eio(seg(t, ask, ask + .7)) + .015 * Math.max(0, knock(t, hero, 14, 6));
    slot14Frame(g, t, 1, t < cnt0 || t > ask + .2, sc14);
    /* hook: the "?" pulses; a crack runs across the slot on "breaks" */
    var qA = 1 - seg(t, cnt0 - .2, cnt0 + .1);
    bigQ(g, S14.cx, S14.cy - 10, 230, qA, t);
    var ck = eio(seg(t, br - .03, br + .3)) * (1 - shk);
    if (ck > 0) {
      g.save(); g.globalAlpha *= clamp(ck * 3, 0, 1); g.translate(0, 160 * shk * shk); g.strokeStyle = CREAM; g.lineWidth = 7; g.lineJoin = 'round'; g.lineCap = 'round';
      var pts = [[S14.x0 + 4, S14.y0 + 70], [S14.x0 + 90, S14.y0 + 120], [S14.x0 + 150, S14.y0 + 96], [S14.x0 + 220, S14.y0 + 170], [S14.x0 + 290, S14.y0 + 150], [S14.x0 + S14.w - 6, S14.y0 + 220]];
      g.beginPath(); for (i = 0; i < pts.length; i++) { var u = clamp(ck * (pts.length - 1) - i + 1, 0, 1); if (!i) g.moveTo(pts[0][0], pts[0][1]); else if (u > 0) g.lineTo(lerp(pts[i - 1][0], pts[i][0], u), lerp(pts[i - 1][1], pts[i][1], u)); } g.stroke();
      g.beginPath(); g.moveTo(S14.x0 + 150, S14.y0 + 96); g.lineTo(S14.x0 + 170, S14.y0 + 30 + 66 * (1 - ck)); g.moveTo(S14.x0 + 220, S14.y0 + 170); g.lineTo(S14.x0 + 200, S14.y0 + 170 + 70 * ck); g.stroke();
      g.restore();
    }
    /* the counter: from "Count" to "So", in the pink slot; lands on 13 in orange on "Thirteen" */
    var cA = fin(t, cnt0 - .05) * (1 - seg(t, ask + .05, ask + .35));
    if (cA > 0) {
      var v = countAt(t), landed = t >= fin13 + .1, csq = 1 + .05 * Math.max(0, knock(t, fin13 + .1, 16, 6));
      g.save(); g.globalAlpha *= cA; g.translate(S14.cx, S14.cy - 22); g.scale(csq * lerp(1, .5, eio(seg(t, ask - .05, ask + .3))), csq * lerp(1, .5, eio(seg(t, ask - .05, ask + .3)))); g.translate(-S14.cx, -(S14.cy - 22));
      wheels(g, S14.cx, S14.cy - 22, Math.min(13, v), 2, { cw: 126, ch: 206, px: 190, gap: 10, fg: landed ? ORG : CREAM });
      g.restore();
      label(g, landed ? 'OUR COUNT' : 'STORY LEADS', S14.cx, S14.y0 + RH - 38, cA * fin(t, cnt0 + .2), CREAM, 38, 'center', 900);
    }
    /* ask: the 13 settles as a small tag in the slot's corner while the "?" comes back */
    var tagA = home ? 0 : fin(t, ask + .25);
    if (tagA > 0) chip(g, '13 · ALL MEN', S14.cx, S14.y0 + 44, { px: 38, wt: 900, bg: ORG, fg: BG, a: tagA, cond: true, shadow: false });
    bigQ(g, S14.cx, S14.cy + 26, 210 * kn(t, at('ask', 'breaks')), home ? 0 : fin(t, ask + .2), t);
    g.restore();
    /* the scope, big in the empty wall while the line defines it, then as the credit at the wall's foot */
    if (!home) {
      var sc0 = at('since', 'since') - .1, scOut = start('names1') - .1, scA = fin(t, sc0) * (1 - seg(t, scOut - .25, scOut));
      chip(g, 'SINCE GTA III', CX, 700, { px: 92, wt: 900, bg: CREAM, fg: BG, a: scA, s: pin(t, sc0), rot: -.02 });
      chip(g, '2001', CX, 860, { px: 120, wt: 900, bg: TEAL, fg: BG, a: fin(t, at('since', '2001') - .1) * (1 - seg(t, scOut - .25, scOut)), s: pin(t, at('since', '2001') - .1), rot: .02 });
      credit(g, 'OUR COUNT · STORY MODES · SINCE GTA III', CX, 1376, fin(t, FALL0 + .3));
      /* the hook, captioned on the wall on "breaks"; SINCE 2001 scopes the 13 from the moment it is on screen */
      var hb = at('hook', 'breaks') - .15, hA = fin(t, hb) * (1 - seg(t, FALL0 - .1, FALL0 + .15));
      if (hA > 0) {
        var hs = pin(t, hb);
        g.save(); g.globalAlpha *= hA; g.translate(CX, 770); g.scale(hs, hs);
        rr(g, -350 + 8, -150 + 12, 700, 236, 22); g.fillStyle = 'rgba(0,0,0,.4)'; g.fill();
        rr(g, -350, -150, 700, 236, 22); g.fillStyle = 'rgba(11,8,32,.95)'; g.fill(); g.strokeStyle = CREAM; g.lineWidth = 4; g.stroke();
        font(g, 80, 900); g.textAlign = 'center'; g.textBaseline = 'alphabetic'; g.fillStyle = CREAM; g.fillText('BREAKS A', 0, -60);
        var w1 = g.measureText('13-MAN ').width, w2 = g.measureText('LINEUP').width, x0 = -(w1 + w2) / 2;
        g.textAlign = 'left'; g.fillStyle = ORG; g.fillText('13-MAN ', x0, 50); g.fillStyle = CREAM; g.fillText('LINEUP', x0 + w1, 50);
        g.restore();
        chip(g, 'SINCE 2001', CX, 935, { px: 48, wt: 900, bg: TEAL, fg: BG, a: hA * fin(t, hb + .2), s: pin(t, hb + .2), rot: .02 });
      }
    }
    /* frame 0: the wall's foot names it */
    chip(g, 'LINEUP', CX, 1376, { px: 44, wt: 900, line: CREAM, lw: 3, fill: 'rgba(11,8,32,.94)', fg: CREAM, a: home ? 1 : 1 - seg(t, FALL0, FALL0 + .3), shadow: false });
    /* the hero stamp: ALL MEN slams across the wall in the written pause after "man." */
    if (!home) stampText(g, 'ALL MEN', CX, 556, t, GT.stamp, S('lucia').t0 - .35, 128, CREAM, -.04);
  }
  /* the frame-0 wall without the voice's beats (the loop home) */
  function homeWall(g, t) { wallScene(g, t, true); }

  /* =====================================================================================================
     SCENE 2 · lucia: slot 14 up close; Lucia steps in, Jason beside her
     ===================================================================================================== */
  function bigBoard(g, x, y, l1, l2, a, s, col) {
    if (a <= 0) return;
    g.save(); g.globalAlpha *= clamp(a, 0, 1); g.translate(x, y); g.scale(s || 1, s || 1);
    var w = 330, h = 140;
    rr(g, -w / 2 + 6, -h / 2 + 9, w, h, 14); g.fillStyle = 'rgba(0,0,0,.4)'; g.fill();
    rr(g, -w / 2, -h / 2, w, h, 14); g.fillStyle = col || PAPER; g.fill();
    cond(g); g.textAlign = 'center'; g.textBaseline = 'middle';
    font(g, 64, 900); g.fillStyle = INK; g.fillText(l1, 0, -28);
    font(g, 52, 800); g.fillStyle = '#a3125e'; g.fillText(l2, 0, 32);
    g.restore(); g.__st = null;
  }
  function closeFrame(g, t, a) {
    if (a <= 0) return;
    g.save(); g.globalAlpha *= a;
    rr(g, 100, 472, 820, 960, 30); g.fillStyle = 'rgba(0,0,0,.4)'; g.fill();
    rr(g, 100, 462, 820, 960, 30); g.fillStyle = PURP; g.fill();
    g.save(); rr(g, 100, 462, 820, 960, 30); g.clip();
    for (var k = 0; k < 17; k++) { g.fillStyle = k % 5 === 0 ? 'rgba(251,240,234,.22)' : 'rgba(251,240,234,.1)'; g.fillRect(100, 500 + k * 58 + (t * 6) % 58, 820, k % 5 === 0 ? 5 : 3); }
    g.restore();
    rr(g, 112, 474, 796, 936, 24); g.strokeStyle = HOT; g.lineWidth = 9; g.stroke();
    g.restore();
  }
  function luciaScene(g, t) {
    var s0 = S('lucia').t0, lu = at('lucia', 'lucia'), ja = at('lucia', 'shares'), sh = at('lucia', 'shares'), gt = at('lucia', 'gta'), jn = at('lucia', 'jason');
    closeFrame(g, t, 1);
    var jk = eio(seg(t, ja - .35, ja + .15));
    var lx = lerp(CX, 315, jk), lk = eo(seg(t, lu - .12, lu + .25));
    g.save(); rr(g, 112, 474, 796, 936, 24); g.clip();
    /* Lucia rises into the slot; Jason slides in from the right */
    person(g, lx, 1150 + (1 - lk) * 600 + Math.sin(t * 1.3) * 3, 2.6, HOT, 'f', { sh: 1, hd: 1, tilt: 0 });
    if (jk > 0) person(g, lerp(1100, 705, jk), 1150 + Math.sin(t * 1.3 + 2) * 3, 2.6, TEAL, 'm', { sh: 1.08, hd: 1.02, tilt: 0 });
    var fl = t >= lu ? 1 - seg(t, lu, lu + .35) : 0; if (fl > 0) { g.fillStyle = 'rgba(255,255,255,' + (.5 * fl).toFixed(3) + ')'; g.fillRect(100, 462, 820, 960); }
    g.restore();
    bigBoard(g, lx, 1230, 'LUCIA', 'CAMINOS', fin(t, lu + .1), pin(t, lu + .1), PAPER);
    bigBoard(g, lerp(1100, 705, jk), 1230, 'JASON', 'DUVAL', fin(t, ja + .05) * (jk > .6 ? 1 : 0), pin(t, ja + .05) * kn(t, jn), PAPER);
    /* the search phrase, then CO-LEADS once Jason is in */
    chip(g, 'GTA 6 LUCIA', CX, 548, { px: 60, wt: 900, bg: HOT, fg: BG, a: fin(t, lu + .25), s: pin(t, lu + .25), rot: -.02 });
    chip(g, '“JASON AND LUCIA’S STORY”', CX, 640, { px: 46, wt: 900, bg: CREAM, fg: BG, a: fin(t, at('lucia', 'she') - .1), s: pin(t, at('lucia', 'she') - .1) * kn(t, ja), rot: .015, cond: true });
    credit(g, 'ROCKSTARGAMES.COM/VI', CX, 1392, fin(t, s0 + .35));
  }

  /* =====================================================================================================
     SCENE 3 / 5 · the full wall. book: Lucia booked into slot 14, LEONIDA PENITENTIARY, the flash, then the turn.
     since3d: Lucia and Jason in slot 14, FIRST WOMAN LEAD OF A STORY MODE SINCE 2001 (our count).
     ===================================================================================================== */
  function fullWall(g, t, o) {
    var i;
    wallBack(g, { off: o.off == null ? t * 6 : o.off });
    for (i = 0; i < 13; i++) { slotPanel(g, i, 1); lead(g, i, t, 1, o.boards == null ? 1 : o.boards, 0, o.dim || 0); }
    slot14Frame(g, t, 1, false, 1);
    if (o.pair !== false) {
      g.save(); rr(g, S14.x0 + 6, S14.y0 + 4, S14.w - 12, S14.h - 14, 14); g.clip();
      person(g, S14.x0 + 77, S14.y0 + 194 + Math.sin(t * 1.3) * 2, .95, HOT, 'f');
      person(g, S14.x0 + 231, S14.y0 + 194 + Math.sin(t * 1.3 + 2) * 2, .95, TEAL, 'm', { sh: 1.08, hd: 1.02, tilt: 0 });
      g.restore();
      board(g, S14.x0 + 77, S14.y0 + 236, 'LUCIA', 'GTA 6', o.lb == null ? 1 : o.lb, 1);
      board(g, S14.x0 + 231, S14.y0 + 236, 'JASON', 'GTA 6', o.lb == null ? 1 : o.lb, 1);
    }
  }
  function bookScene(g, t) {
    var s0 = S('book').t0, nw = at('prison', 'now'), fr = at('prison', 'fresh'), pr = at('prison', 'prison');
    var bt = start('but'), ea = at('but', 'earlier'), fl = GT.flashP || end('prison') + .15;
    /* the rewind before "But": the chart's thin lines run backward */
    var off = t * 6 - 700 * eio(seg(t, GT.rewind || bt - .4, (GT.rewind || bt - .4) + .34));
    fullWall(g, t, { pair: false, off: off, dim: .35 * fin(t, bt) });
    /* Lucia steps up into slot 14 against the height chart, holding Rockstar's prison name */
    var up = eo(seg(t, nw - .15, fr + .1));
    g.save(); rr(g, S14.x0 + 6, S14.y0 + 4, S14.w - 12, S14.h - 14, 14); g.clip();
    person(g, S14.cx, S14.y0 + 200 + (1 - up) * 260 + Math.sin(t * 1.3) * 2, 1.02, HOT, 'f');
    g.restore();
    var bA = fin(t, fr), by = S14.y0 + 196 + (1 - eo(seg(t, fr - .05, fr + .25))) * 40;
    if (bA > 0) {
      g.save(); g.globalAlpha *= bA; g.translate(S14.cx, by);
      rr(g, -132 + 4, -50 + 6, 264, 100, 8); g.fillStyle = 'rgba(0,0,0,.45)'; g.fill();
      rr(g, -132, -50, 264, 100, 8); g.fillStyle = '#e9e1d4'; g.fill();
      cond(g); font(g, 40, 900); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = INK; g.fillText('LEONIDA', 0, -21);
      font(g, 40, 900); g.fillText('PENITENTIARY', 0, 22); g.restore(); g.__st = null;
    }
    /* the booking flash in the gap after the line */
    var f = t >= fl ? 1 - seg(t, fl, fl + .4) : 0;
    if (f > 0) { g.save(); g.fillStyle = 'rgba(255,255,255,' + (.75 * f).toFixed(3) + ')'; rr(g, S14.x0 + 6, S14.y0 + 4, S14.w - 12, S14.h - 14, 14); g.fill(); g.globalAlpha = .18 * f; g.fillRect(WX0, WY0, WX1 - WX0, WY1 - WY0); g.restore(); }
    /* the turn: a quiet, untilted outline on Lucia */
    chip(g, 'NOT THE FIRST', S14.cx, S14.y0 + 52, { px: 44, cond: true, wt: 900, line: CREAM, lw: 4, fill: 'rgba(11,8,32,.9)', fg: CREAM, a: fin(t, bt + .1), shadow: false, maxw: 296 });
    credit(g, 'ROCKSTARGAMES.COM/VI', CX, 1376, fin(t, s0 + .35));
  }

  /* =====================================================================================================
     SCENE 5 · first: the 1997 character select, eight of our own pixel figures, four women
     ===================================================================================================== */
  var SPR_M = [
    '...hhhh...', '..hhhhhh..', '..ssssss..', '..s.ss.s..', '..ssssss..', '...ssss...',
    '.cccccccc.', 'cccccccccc', 'cc.cccc.cc', 'ss.cccc.ss', '...pppp...', '...pp.pp..', '...pp.pp..', '..bbb.bbb.'];
  var SPR_F = [
    '..hhhhhh..', '.hhhhhhhh.', '.hssssssh.', '.hs.ss.sh.', '.hssssssh.', '.hhssssh..',
    '.hcccccch.', 'cccccccccc', 'cc.cccc.cc', 'ss.cccc.ss', '..dddddd..', '.dddddddd.', '...s..s...', '..bb..bb..'];
  var PIX = [
    { f: 0, c: '#5a8bd6', h: '#3b2a1e' }, { f: 1, c: HOT, h: '#f2c14e', n: 'DIVINE' }, { f: 0, c: '#7fbf6a', h: '#1b1b1b' }, { f: 1, c: HOT, h: '#c0392b', n: 'KATIE' },
    { f: 1, c: HOT, h: '#1b1b1b', n: 'MIKKI' }, { f: 0, c: ORG, h: '#6b4a2e' }, { f: 1, c: HOT, h: '#e8d27a', n: 'ULRIKA' }, { f: 0, c: '#9a93a8', h: '#2a2a2a' }];
  function sprite(g, x, y, P, px, t, j) {
    var rows = P.f ? SPR_F : SPR_M, col = { h: P.h, s: '#f1c9a5', c: P.c, p: '#2b2d5a', b: '#111', d: P.c };
    var hop = Math.max(0, Math.sin(t * 6 + j * .9)) * 6;
    var w = rows[0].length * px, h = rows.length * px;
    g.save(); g.translate(Math.round(x - w / 2), Math.round(y - h / 2 - hop));
    g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(px * .5, h + hop - px * .3, w - px, px * .6);
    rows.forEach(function (r, ry) { for (var rx = 0; rx < r.length; rx++) { var ch = r[rx]; if (ch === '.') continue; g.fillStyle = col[ch]; g.fillRect(rx * px, ry * px, px + .5, px + .5); } });
    g.restore();
  }
  var PCOL = [207, 407, 613, 813], PROW = [790, 1130];
  function pixelScene(g, t) {
    var s0 = S('pixel').t0, vf = at('first', 'first'), yr = at('first', '1997'), pk = at('first', 'pick'), on = at('first', 'one');
    /* the screen: a dark CRT-ish panel with a pixel border */
    rr(g, 100, 472, 820, 960, 18); g.fillStyle = 'rgba(0,0,0,.4)'; g.fill();
    rr(g, 100, 462, 820, 960, 18); g.fillStyle = '#05030f'; g.fill();
    g.fillStyle = TEAL; for (var k = 0; k < 41; k++) { g.fillRect(100 + k * 20, 462, 12, 8); g.fillRect(100 + k * 20, 1414, 12, 8); }
    g.fillStyle = 'rgba(255,255,255,.04)'; for (k = 0; k < 120; k++) g.fillRect(100, 466 + k * 8, 820, 3);
    chip(g, '1997 · PC', CX, 560, { px: 84, wt: 900, bg: ORG, fg: BG, a: fin(t, s0 + .05), s: pin(t, s0 + .05) * kn(t, yr), rot: -.015 });
    /* the eight figures; the four women get their names */
    var cur = 0;
    PIX.forEach(function (P, j) {
      var x = PCOL[j % 4], y = PROW[Math.floor(j / 4)], a = fin(t, s0 + .1 + j * .06);
      if (a <= 0) return;
      g.save(); g.globalAlpha *= a; sprite(g, x, y, P, 11, t, j); g.restore();
      if (P.n) { var hit = ch0 != null && t >= ch0 + [1, 3, 4, 6].indexOf(j) * .14 ? kn(t, ch0 + [1, 3, 4, 6].indexOf(j) * .14) : 1; g.save(); g.translate(x, y + 128); g.scale(hit, hit); label(g, P.n, 0, 0, fin(t, s0 + .5 + j * .05), HOT, 38, 'center', 900); g.restore(); }
    });
    /* the cursor blinks on the first figure, lands on a woman on "pick", then visits all four on the chord */
    var ch0 = GT.chord, W4 = [1, 3, 4, 6], tg = t >= pk ? 1 : 0, vis = -1;
    if (t >= ch0) { vis = clamp(Math.floor((t - ch0) / .14), 0, 3); tg = W4[vis]; }
    var cx = PCOL[tg % 4], cyc = PROW[Math.floor(tg / 4)], blink = (Math.floor(t * 6) % 2) ? 1 : .55;
    g.save(); g.globalAlpha *= fin(t, s0 + .4) * (t >= pk ? 1 : blink); g.strokeStyle = t >= pk ? HOT : CREAM; g.lineWidth = 8;
    g.strokeRect(cx - 82, cyc - 98, 164, 196); g.restore();
    chip(g, '4 OF 8 · WOMEN · 1997 PC', CX, 1322, { px: 56, wt: 900, bg: CREAM, fg: BG, a: fin(t, s0 + .55), s: pin(t, s0 + .55) * kn(t, ch0 + .42), rot: .01, cond: true });
    credit(g, 'NAMES: LEVELUP · OUR PIXEL ART', CX, 1392, fin(t, s0 + .45));
  }

  /* =====================================================================================================
     SCENE 6 · since3d: the wall, all 13 back, Lucia first since 2001
     ===================================================================================================== */
  function since3dScene(g, t) {
    var s0 = S('since3d').t0, fs = at('since3d', 'since') + .2, ld = at('since3d', 'first');
    fullWall(g, t, { dim: .3 * fin(t, fs - .2) });
    var a = fin(t, fs - .1), sc = pin(t, fs - .1) * kn(t, ld);
    if (a > 0) {
      g.save(); g.globalAlpha *= a; g.translate(S14.x0 + 120, S14.y0 + 78); g.scale(sc, sc);
      rr(g, -168, -70, 336, 140, 14); g.fillStyle = 'rgba(11,8,32,.94)'; g.fill(); g.strokeStyle = HOT; g.lineWidth = 5; g.stroke();
      cond(g); g.textAlign = 'center'; g.textBaseline = 'middle';
      font(g, 44, 900); g.fillStyle = HOT; g.fillText('FIRST WOMAN LEAD', 0, -38, 312);
      font(g, 38, 900); g.fillStyle = CREAM; g.fillText('OF A STORY MODE', 0, 1, 312);
      font(g, 44, 900); g.fillStyle = HOT; g.fillText('SINCE 2001', 0, 40, 312);
      g.restore(); g.__st = null;
    }
    chip(g, 'OUR COUNT', S14.x0 + 120, S14.y0 + 168, { px: 38, wt: 900, bg: CREAM, fg: BG, a: fin(t, fs + .1), shadow: false });
    credit(g, 'ONLINE AVATARS NOT COUNTED', CX, 1376, fin(t, s0 + .02));
  }

  /* =====================================================================================================
     SCENE 7 · end: Lucia and Jason up close, LUCIA / JASON votes, neither picked; dissolves into frame 0
     ===================================================================================================== */
  function endScene(g, t) {
    var s0 = S('end').t0, lu = at('end', 'lucia'), ja = at('end', 'jason');
    closeFrame(g, t, 1);
    g.save(); rr(g, 112, 474, 796, 936, 24); g.clip();
    person(g, 315, 1150 + Math.sin(t * 2.4) * 8, 2.6, HOT, 'f');
    person(g, 705, 1150 + Math.sin(t * 2.4 + Math.PI) * 8, 2.6, TEAL, 'm', { sh: 1.08, hd: 1.02, tilt: 0 });
    g.restore();
    chip(g, 'LUCIA', 315, 1230, { px: 84, wt: 900, bg: CREAM, fg: BG, a: fin(t, s0 + .2), s: pin(t, s0 + .2) * kn(t, lu), rot: -.03 });
    chip(g, 'JASON', 705, 1230, { px: 84, wt: 900, bg: CREAM, fg: BG, a: fin(t, s0 + .3), s: pin(t, s0 + .3) * kn(t, ja), rot: .03 });
    chip(g, 'GTA 6 · NOV 19, 2026', CX, 560, { px: 56, wt: 900, bg: ORG, fg: BG, a: fin(t, s0 + .05), rot: -.01 });
    credit(g, 'ROCKSTARGAMES.COM/VI', CX, 1392, fin(t, s0 + .4));
  }

  /* ---------- captions (the voice, phrase by phrase; the hook line is carried by the picture) ---------- */
  var CAPBRK = { since: ['since'] };
  var CAPS = (function () {
    var out = [];
    VO.lines.forEach(function (l) {
      if (l.id === 'hook') return;
      var brk = (CAPBRK[l.id] || []).slice(), cur = [], ws = l.words;
      ws.forEach(function (w, i) {
        if (cur.length && brk.length && norm(w.w) === brk[0]) { out.push(cur); cur = []; brk.shift(); }
        cur.push(w);
        if (/[.?!:]$/.test(w.w) && i < ws.length - 1 && l.id !== 'names') { out.push(cur); cur = []; }
      });
      if (cur.length) out.push(cur);
    });
    return out.map(function (ws) { return { t0: ws[0].t0, t1: ws[ws.length - 1].t1, words: ws }; });
  })();
  var STRESS;
  function stressed(w) { for (var i = 0; i < STRESS.length; i++) if (Math.abs(STRESS[i] - w.t0) < .02) return true; return false; }
  function wipeHide(t) {
    var a = 1; SC.forEach(function (sc) { if (sc.swipe) a = Math.min(a, 1 - seg(t, sc.t0 - SWIPE - .14, sc.t0 - SWIPE) * (1 - seg(t, sc.t0 + .02, sc.t0 + .14))); });
    return a;
  }
  var GLUE = { the: 1, a: 1, an: 1, your: 1, its: 1, of: 1, at: 1, to: 1, and: 1, in: 1, with: 1, on: 1, by: 1, so: 1, one: 1, her: 1, every: 1 };
  function captions(g, t, alpha) {
    var card0 = null, ci = -1;
    CAPS.forEach(function (c, i) { if (t >= c.t0 - .04) { card0 = c; ci = i; } });
    if (!card0) return;
    var nx = CAPS[ci + 1], ns = nx ? nx.t0 - .04 : 1e9, o1 = Math.min(card0.t1 + .5, ns - .12), o0 = Math.min(card0.t1 + .35, o1 - .12);
    var fi = seg(t, card0.t0 - .04, card0.t0 + .06), out = 1 - seg(t, o0, o1);
    if (fi * out <= 0) return;
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
    var lh = cpx * 1.16, y0 = 392 - (lines.length - 1) * lh / 2 + (lines.length > 1 ? 0 : 0);
    g.globalAlpha = fi * out * wipeHide(t) * (alpha == null ? 1 : alpha);
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
  var NOISE;
  var SCENES = { wall: wallScene, lucia: luciaScene, book: bookScene, pixel: pixelScene, since3d: since3dScene, end: endScene };
  function stage(g) { g.fillStyle = BG; g.fillRect(0, 0, W, H); }
  function sceneAt(t) { for (var i = SC.length - 1; i >= 0; i--) if (t >= SC[i].t0) return i; return 0; }
  function drawScene(g, Sc, t) {
    g.save();
    if (Sc.id !== 'wall' && Sc.id !== 'end') { var push = 1 + .014 * seg(t, Sc.t0, Sc.t1); g.translate(CX, 950); g.scale(push, push); g.translate(-CX, -950); }
    SCENES[Sc.id](g, t);
    g.restore();
  }
  function edgeY(x, ly, t) { return ly + (x - 540) * .10 + Math.sin(x * .02 + t * 6) * 3; }
  var POSTERMODE = false;
  /* frame 0: a flash pops at 0.12 s; the "?" is already pulsing */
  function flash0(g, t) {
    var f = t < .1 ? 0 : 1 - seg(t, .1, .45);
    if (f <= 0) return;
    g.save(); g.globalAlpha = .28 * f; g.fillStyle = '#fff'; rr(g, WX0, WY0, WX1 - WX0, WY1 - WY0, 22); g.fill(); g.restore();
  }
  function gtaPill(g, t, a, s) {
    chip(g, 'GTA 6', CX, 372, { px: 120, wt: 900, bg: HOT, fg: BG, pad: 46, rot: -.025, a: a, s: s });
  }
  function frame(g, t) {
    g.setTransform(1, 0, 0, 1, 0, 0);
    stage(g);
    var si = sceneAt(t), Sc = SC[si], Nx = SC[si + 1];
    var sk = Nx && Nx.swipe ? eio(seg(t, Nx.t0 - SWIPE, Nx.t0)) : 0;
    var pre = Sc.swipe && t < Sc.t0 + PRE;
    drawScene(g, Sc, pre ? Sc.t0 + PRE : t);
    if (Sc.id === 'wall') {
      flash0(g, t);
      /* GTA 6 pill: frame 0, leaves before the first caption */
      var pg = 1 - seg(t, start('since') - .3, start('since') - .05);
      gtaPill(g, t, pg, 1 + .05 * Math.max(0, knock(t, .3, 16, 7)));
    }
    if (sk > 0) {
      var ly = H * (1 - sk) - 70, x;
      g.save(); g.beginPath(); g.moveTo(0, H); for (x = 0; x <= W; x += 30) g.lineTo(x, edgeY(x, ly, t)); g.lineTo(W, H); g.closePath(); g.clip();
      stage(g); INCOMING = true; drawScene(g, Nx, Nx.t0 + PRE); INCOMING = false; g.restore();
      g.save(); g.lineJoin = 'round'; g.beginPath(); g.rect(90, 0, 840, 1448); g.clip();
      [[HOT, 10, 0], [TEAL, 6, 16]].forEach(function (c) { g.strokeStyle = c[0]; g.lineWidth = c[1]; g.beginPath(); for (x = 0; x <= W; x += 30) { var yy = edgeY(x, ly, t) + c[2]; if (x === 0) g.moveTo(x, yy); else g.lineTo(x, yy); } g.stroke(); });
      g.restore();
    }
    var back = eio(seg(t, HOME, HOME + .35));
    if (back > 0) { g.save(); g.globalAlpha = back; stage(g); g.translate(CX, 950); g.scale(lerp(.92, 1, back), lerp(.92, 1, back)); g.translate(-CX, -950); homeWall(g, 0); g.restore(); g.save(); gtaPill(g, 0, back, 1); g.restore(); }
    if (POSTERMODE) posterTitle(g);
    else if (LIVE.text) { if (back > 0) captions(g, t, 1 - back); else captions(g, t); }
    if (!POSTERMODE) {
      g.fillStyle = 'rgba(251,240,234,.12)'; g.fillRect(90, 222, 840, 6);
      g.fillStyle = HOT; g.fillRect(90, 222, 840 * (back > 0 ? 1 - back : t / DUR), 6);
    }
    if (LIVE.grain && NOISE) { g.globalAlpha = .05; g.globalCompositeOperation = 'overlay'; var o = Math.floor(t * 24) * 37 % 256; g.fillStyle = g.createPattern(NOISE, 'repeat'); g.translate(-o, -o); g.fillRect(o, o, W, H); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }
  }
  function posterTitle(g) {
    g.save(); g.fillStyle = 'rgba(11,8,32,.94)'; g.fillRect(90, 250, 840, 200); font(g, 76, 900); wide(g); g.textBaseline = 'alphabetic'; g.textAlign = 'center';
    g.fillStyle = CREAM; g.fillText('GTA 6 BREAKS', CX, 335);
    var b = 'A 13-MAN LINEUP', wb = g.measureText(b).width;
    g.fillStyle = HOT; g.beginPath(); g.roundRect(CX - wb / 2 - 16, 352, wb + 32, 92, 18); g.fill();
    g.fillStyle = BG; g.fillText(b, CX, 424); g.restore();
  }
  function TEXTS(t) {
    var out = [];
    function T(id, text, a, b) { if (t >= a && t < b) out.push({ id: id, text: text, x0: 0, y0: 0, x1: 0, y1: 0 }); }
    function cut(id) { return S(id).t0 - .2; }
    var hb = at('hook', 'breaks') - .15;
    T('gta', 'GTA 6', 0, start('since') - .1); T('gta', 'GTA 6', HOME + .3, DUR + 1);
    T('lineup', 'LINEUP', 0, FALL0); T('lineup', 'LINEUP', HOME + .3, DUR + 1);
    T('hookc', 'BREAKS A 13-MAN LINEUP', hb + .05, FALL0);
    T('s2001', 'SINCE 2001', hb + .25, FALL0);
    T('leads', 'STORY LEADS', at('since', 'count') + .3, R13 + .1);
    T('13', '13 · OUR COUNT', R13 + .15, start('ask') + .1);
    T('scope', 'OUR COUNT · STORY MODES · SINCE GTA III', FALL0 + .3, cut('lucia'));
    T('allmen', 'ALL MEN', GT.stamp + .05, cut('lucia'));
    LEADS.forEach(function (L, i) { T('b' + i, L[0] + ' ' + L[1], (BDT[i] == null ? FILL[i] : BDT[i]) + .1, cut('lucia')); });
    T('srch', 'GTA 6 LUCIA', at('lucia', 'lucia') + .3, cut('book'));
    T('luc', 'LUCIA CAMINOS', at('lucia', 'lucia') + .2, cut('book'));
    T('jas', 'JASON DUVAL', at('lucia', 'shares') + .15, cut('book'));
    T('co', 'JASON AND LUCIA’S STORY', at('lucia', 'she'), cut('book'));
    T('src1', 'ROCKSTARGAMES.COM/VI', S('lucia').t0 + .45, cut('book'));
    T('pen', 'LEONIDA PENITENTIARY', at('prison', 'fresh') + .1, cut('pixel'));
    T('src2', 'ROCKSTARGAMES.COM/VI', S('book').t0 + .45, cut('pixel'));
    T('ntf', 'NOT THE FIRST', start('but') + .2, cut('pixel'));
    T('y97', '1997 · PC', S('pixel').t0 + .15, cut('since3d'));
    T('w4', 'DIVINE KATIE MIKKI ULRIKA', S('pixel').t0 + .6, cut('since3d'));
    T('n8', '4 OF 8 · WOMEN · 1997 PC', S('pixel').t0 + .65, cut('since3d'));
    T('fs', 'FIRST WOMAN LEAD OF A STORY MODE SINCE 2001', at('since3d', 'since') + .15, cut('end'));
    T('oc', 'OUR COUNT', at('since3d', 'since') + .35, cut('end'));
    T('avt', 'ONLINE AVATARS NOT COUNTED', S('since3d').t0 + .1, cut('end'));
    T('vote', 'LUCIA JASON', S('end').t0 + .35, HOME);
    T('nov', 'GTA 6 · NOV 19, 2026', S('end').t0 + .15, HOME);
    return out;
  }

  /* ---------- events: hits placed in real pauses of the voice (vo/vad.js); beats with no free pause stay silent ---------- */
  function vadEndBefore(t, from) { var ve = from; (window.VAD || []).forEach(function (v) { if (v[0] < t - .2 && v[1] > ve) ve = v[1]; }); return ve; }
  function initTimes() {
    var i;
    SC = [
      { id: 'wall', name: 'The lineup', t0: 0 },
      { id: 'lucia', name: 'Lucia', t0: start('lucia') - .05, swipe: true },
      { id: 'book', name: 'Fresh out of prison', t0: start('prison') - .05, swipe: true },
      { id: 'pixel', name: '1997', t0: start('first') - .05, swipe: true },
      { id: 'since3d', name: 'First since 2001', t0: start('since3d') - .05, swipe: true },
      { id: 'end', name: 'Lucia or Jason', t0: start('end') - .05, swipe: true }
    ];
    SC.forEach(function (s, i) { s.t1 = i + 1 < SC.length ? SC[i + 1].t0 : DUR; });
    HOME = DUR - .45;
    FALL0 = at('since', 'count') - .05;
    /* frame 0: the flash bulb, before the first word and under it in level */
    EV.push({ t: .06, type: 'flash', g: .5, id: 'flash0' });
    /* hook: the slot shatters in the pause after "lineup"; the leads drop out with a low slide */
    G('crack', end('hook') + .1, 'crack', .4, .7);
    G('drop', FALL0 - .3, 'swish', .3, .45);
    /* Claude, the first lead, drops in on "GTA 3" with a clack in the comma after it */
    /* Claude rises on "GTA 3"; his board drops with a clack in the pause after "2001." */
    FILL[0] = at('since', '3') - .02; BDT[0] = G('clack0', vadEndBefore(start('names1'), end('since') - .5) + .16, 'clack', .15, .8);
    /* names1: Tommy, CJ, Niko on their names; then Mike, Toni, Vic in a three-clack burst in the gap before "Michael" */
    FILL[1] = at('names1', 'tommy') - .02; FILL[2] = at('names1', 'cj') - .02; FILL[6] = at('names1', 'niko') - .02;
    var g1 = vadEndBefore(start('names2'), end('names1') - .5) + .16;
    [3, 4, 5].forEach(function (ix, j) { var tt = G('clack' + ix, g1 + j * .11, 'clack', .08, .75); FILL[ix] = tt; });
    /* names2: Michael, Franklin, Trevor; then Johnny, Huang, Luis in a speeding tick roll after "Trevor" */
    FILL[10] = at('names2', 'michael') - .02; FILL[11] = at('names2', 'franklin') - .02; FILL[12] = at('names2', 'trevor') - .02;
    var g2 = vadEndBefore(at('hero', 'thirteen'), end('names2') - .5) + .16;
    [7, 8, 9].forEach(function (ix, j) { var tt = g2 + [0, .12, .21][j]; FILL[ix] = tt; G('tick' + ix, tt, 'tick', .04, .8 + j * .1); G('tickb' + ix, tt + .045, 'tick', .03, .5); });
    R13 = Math.max.apply(null, FILL);
    /* one stressed word per caption at most; the end vote highlights neither name */
    STRESS = [['since', '2001'], ['hero', 'thirteen'], ['hero', 'man'], ['ask', 'breaks'], ['lucia', 'lucia'], ['lucia', 'jason'],
      ['prison', 'prison'], ['but', 'earlier'], ['first', '1997'], ['since3d', 'first']]
      .map(function (p) { return at(p[0], p[1], p[2]); });
    /* hero: the ALL MEN stamp and the bulb in the written pause after "man." */
    G('stamp', end('hero') + .1, 'stamp', .35, 1);
    G('bulb', (GT.stamp || end('hero') + .1) + .22, 'bulb', .3, .7);
    /* the cuts: a tear wherever the pause allows */
    SC.forEach(function (sc) { if (sc.swipe) G('w_' + sc.id, sc.t0 - SWIPE + .02, 'tear', .35, .85); });
    /* book: the booking flash in the gap after "prison.", the rewind just before "But" */
    G('flashP', vadEndBefore(start('but'), end('prison') - .5) + .16, 'flash', .2, 1);
    G('rewind', (GT.flashP || end('prison')) + .2, 'rewind', .25, .8);
    /* first: the cursor visits the four women with a rising four-note chord in the pause after "one." */
    G('chord', vadEndBefore(start('since3d'), end('first') - .5) + .16, 'chord', .3, .9);
    /* end: a swish home into frame 0 */
    G('home', HOME - .05, 'swish', .3, .8);
    EV.sort(function (a, b) { return a.t - b.t; });
    if (GT.stamp == null) GT.stamp = end('hero') + .1;
    if (GT.flashP == null) GT.flashP = end('prison') + .15;
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

  /* ---------- sound: lineup foley, cut to the pauses; no music (Isac adds a TikTok sound) ---------- */
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
    /* camera flash: a click and a bright little pop of noise */
    function flash(t, g) { tick(t, .7 * g); band(t, t + .1, 5000, 2500, .1 * g, .02 * g, 1.2); }
    /* the board drops onto its hooks: a wooden clack */
    function clack(t, g) { var n = noise(t, .05), bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1300; bp.Q.value = 4; var o = bus(1, (rnd() - .5) * .4); n.connect(bp); bp.connect(o); env(o.gain, [[t, 0], [t + .002, .55 * g], [t + .045, 0]]); thump(t + .005, .22 * g); tick(t + .06, .3 * g); }
    function crack(t, g) { tick(t, .6 * g); tick(t + .03, .45 * g); band(t, t + .12, 3200, 1400, .12 * g, .03 * g, 1.4); for (var j = 0; j < 3; j++) tick(t + .06 + j * .025 + rnd() * .01, .2 * g); }
    function stamp(t, g) { thump(t, .7 * g); var sn = noise(t, .12), sl = ac.createBiquadFilter(); sl.type = 'lowpass'; sl.frequency.value = 1500; var so = bus(1); sn.connect(sl); sl.connect(so); env(so.gain, [[t, 0], [t + .004, .32 * g], [t + .1, 0]]); }
    /* an old flash bulb recharging: a thin rising whine */
    function bulb(t, g) { var o = osc('sine', 1800, t, t + .42, [[t, 0], [t + .05, .03 * g], [t + .34, .022 * g], [t + .4, 0]]); o.frequency.exponentialRampToValueAtTime(5200, t + .4); tick(t, .4 * g); }
    function popS(t, g) { var o = osc('sine', 300, t, t + .12, [[t, 0], [t + .004, .14 * (g || 1)], [t + .1, 0]]); o.frequency.exponentialRampToValueAtTime(900, t + .08); }
    function tear(t, t1, g) { band(t, t1, 700, 2600, .05 * g, .04 * g, 1.8); for (var j = 0; j < 4; j++) tick(t + (t1 - t) * (j + .5) / 4, .12 * g); }
    function rewind(t, g) { band(t, t + .32, 4200, 600, .09 * g, .03 * g, 2.2); for (var j = 0; j < 8; j++) tick(t + j * .036, (.3 - j * .02) * g); }
    function blip(t, g) { var a = osc('square', 660, t, t + .07, [[t, 0], [t + .003, .05 * g], [t + .06, 0]]); var b = osc('square', 990, t + .07, t + .16, [[t + .07, 0], [t + .073, .05 * g], [t + .15, 0]]); }
    function clang(t, g) { thump(t, .5 * g); [[220, .05], [331, .035], [497, .02]].forEach(function (p) { osc('triangle', p[0], t, t + .22, [[t, 0], [t + .004, p[1] * g], [t + .2, 0]]); }); tick(t, .5 * g); }
    function paper(t, g) { band(t, t + .18, 2500, 4500, .07 * g, .02 * g, 1.5); tick(t + .1, .25 * g); }
    /* levels balanced on the final mix (measured against the neighbouring voice): every hit audible, every hit ≥ 3 dB under the voice */
    var LEVEL = { chord: 2, flash: 6, crack: 6, tick: 1.5, stamp: .5, bulb: 6, tear: 20, rewind: 6, blip: 3, pop: 3, swish: 6, clang: .9 };
    EV.forEach(function (e) {
      var g = (e.g == null ? 1 : e.g) * (LEVEL[e.type] || 1);
      if (e.type === 'flash') flash(e.t, g);
      else if (e.type === 'clack') clack(e.t, g);
      else if (e.type === 'tick') { tick(e.t, .9 * g); thump(e.t, .08 * g); }
      else if (e.type === 'crack') crack(e.t, g);
      else if (e.type === 'stamp') stamp(e.t, g);
      else if (e.type === 'bulb') bulb(e.t, g);
      else if (e.type === 'tear') tear(e.t, e.t + .2, g);
      else if (e.type === 'pop') popS(e.t, g);
      else if (e.type === 'rewind') rewind(e.t, g);
      else if (e.type === 'blip') blip(e.t, g);
      else if (e.type === 'chord') [523.25, 659.25, 783.99, 1046.5].forEach(function (f, j) { var a = e.t + j * .14; osc('square', f, a, a + .2, [[a, 0], [a + .003, .045 * g], [a + .12, .02 * g], [a + .19, 0]]); });
      else if (e.type === 'clang') clang(e.t, g);
      else if (e.type === 'paper') paper(e.t, g);
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
    return Promise.all(fonts.map(function (f) { return document.fonts.load(f, 'Aa0%°×−≈≠µ“”’·→…#?‹'); })).then(function () { return document.fonts.ready; }).then(function () {
      STEX = {};
      window.READY = true;
    });
  }

  initTimes();
  var POSTER_T = Math.min((GT.stamp || end('hero')) + .55, start('ask') - .1);
  window.FILM = { bare: function () { ctx.setTransform(1, 0, 0, 1, 0, 0); stage(ctx); }, W: W, H: H, DUR: DUR, POSTER: POSTER_T, SLUG: 'gta-lucia', SHOTS: SC.map(function (s) { return { id: s.id, name: s.name, t0: s.t0, t1: s.t1 }; }), init: init, render: render, frame: frame, LIVE: LIVE };
  window.BOUNDS_RUN = function (step) {
    BOUNDS = []; var out = {};
    for (var t = 0; t <= DUR + 1e-6; t += step || 1 / 15) { CURT = t; POSTERMODE = false; frame(ctx, t); }
    BOUNDS.forEach(function (b) { var o = out[b.text] || (out[b.text] = { text: b.text, from: b.t, to: b.t, x0: b.x0, x1: b.x1, y1: b.y1, n: 0 }); o.to = b.t; o.n++; o.x0 = Math.min(o.x0, b.x0); o.x1 = Math.max(o.x1, b.x1); o.y1 = Math.max(o.y1, b.y1); });
    BOUNDS = null; return Object.keys(out).map(function (k) { return out[k]; });
  };
  window.DUR = DUR; window.EV = EV; window.TEXTS = TEXTS; window.SCORE = SCORE; window.READY = false;
  window.render = function (t, s, sh, fps) { render(t, s, sh, fps); };
})();
