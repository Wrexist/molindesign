/* "A mountain": GTA 6, Delta. A vertical film written in code, narrated first and cut to the voice:
   every visual beat is keyed to a word time from vo/vo.js (window.VO) with at(id, word). Pure function of t.
   Contract: window.FILM, DUR, render(t), READY, EV, TEXTS(t), SCORE(ctx).
   Hero prop: ONE hand-built cut-paper pop-up book on a bench (paper grain, pale cut edges, baked shadows, V-fold glue
   tabs, a pull tab). The lower page is a flat paper map; a three-layer paper mountain rises out of the fold on frame 0
   and snaps up on "mountain"; a toothpick flag names it MOUNT KALAGA. Rockstar's own words land on torn strips while
   pop-ups answer them (deer, fish, dirt bike, two cabins, binoculars, a curtain of pines). The hero: a blank tape with
   a ? (Rockstar's site gives no height). The end vote is styled identically; the mountain stands on "mountain", sinks
   on "hill", springs back on "One word.", then the book folds flat and re-opens into frame 0. The bench bleeds to the
   full frame; every paper shape stays inside the rail. (The REAL WORLD ruler beat was cut after jury round 2.) Own flat shapes in a Vice City palette. No Rockstar footage, logo, key art or likeness, no music. */
(function () {
  'use strict';
  var W = 1080, H = 1920, VO = window.VO, DUR = VO.dur, CX = 510;
  var BG = '#0b0820', CREAM = '#fbf0ea';
  var HOT = '#ff4fa3', TEAL = '#19d3c5', ORG = '#ff8a3d';
  var INK = '#1d1233', PAPER = '#f2e5cd', NEWS = '#efe5cf', KRAFT = '#b8834b', KRAFT2 = '#8a5a2e', BENCH = '#1c1042';
  var DISP = 'Archivo';
  /* the frame: everything in the picture is clipped to it, so no push, dip or dolly can cross the x 90-930 / y 300-1430 rail */
  var BX0 = 90, BX1 = 930, BY0 = 300, BY1 = 1430, TAU = Math.PI * 2;

  /* ---------- math ---------- */
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, k) { return a + (b - a) * k; }
  function seg(t, a, b) { return clamp((t - a) / (b - a), 0, 1); }
  function eo(k) { return k >= 1 ? 1 : 1 - Math.pow(2, -10 * k); }
  function eio(k) { return k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; }
  function mulberry(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  /* critically damped settle: 0 -> 1, never overshoots */
  function cd(t, a, w) { if (t <= a) return 0; var u = (t - a) * (w || 14); return 1 - (1 + u) * Math.exp(-u); }
  function fin(t, a, d) { return seg(t, a, a + (d || .14)); }
  function out(t, a, d) { return 1 - seg(t, a - (d || .25), a); }
  /* a monotonic knock: rises fast, decays, never goes under 1 */
  function kn(t, a, amt) { if (t < a) return 1; var u = t - a; return 1 + (amt || .08) * (1 - Math.exp(-u * 40)) * Math.exp(-u * 7); }
  /* a damped swing kick (pendulum), 0 before a */
  function sw(t, a, amp, f, d) { if (t < a) return 0; var u = t - a; return amp * Math.exp(-u * (d || 2.6)) * Math.sin(u * (f || 7)); }
  function bump(t, a, d) { return Math.sin(Math.PI * seg(t, a, a + d)); }
  /* every ambient motion is periodic in the film's length, so the last frame is frame 0 exactly */
  function osc(t, k, ph) { return Math.sin(TAU * k * t / DUR + (ph || 0)); }

  /* ---------- the voice is the timeline ---------- */
  var LINE = {}, ORDER = []; VO.lines.forEach(function (l) { LINE[l.id] = l; ORDER.push(l.id); });
  function norm(w) { return w.toLowerCase().replace(/[^a-z0-9%]/g, ''); }
  function find(id, word, nth) {
    var l = LINE[id], n = nth || 0; if (typeof word === 'number') return l.words[word];
    for (var i = 0; i < l.words.length; i++) if (norm(l.words[i].w) === norm(word) && n-- === 0) return l.words[i];
    throw new Error('no word "' + word + '" in line ' + id);
  }
  function at(id, word, nth) { return find(id, word, nth).t0; }
  function wend(id, word, nth) { return find(id, word, nth).t1; }
  function start(id) { return LINE[id].t0; }
  function lastw(id) { var w = LINE[id].words; return w[w.length - 1].t1; }

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
  var BODY = { creak: .24, pop: .12, stab: .1, stamp: .27, swish: .26, slap: .14, snap: .16, door: .12, chime: .5, click: .08, tick: .05, fold: .3 };
  function nearGap(t, type, m, body) {
    var bd = body || BODY[type] || .12, best = null;
    free(m || (window.VAD ? .15 : .2)).forEach(function (f) {
      var lo = f[0], hi = f[1] - bd; if (hi < lo) return;
      var c = clamp(t, lo, hi); if (best === null || Math.abs(c - t) < Math.abs(best - t)) best = c;
    });
    return best;
  }
  var GT = {}, EV = [];
  function G(id, t, type, tol, gain, extra) {
    var n = nearGap(t, type, extra && extra.m, extra && extra.dur);
    if (n !== null && Math.abs(n - t) <= (tol == null ? .35 : tol)) { GT[id] = n; var e = { t: n, type: type, g: gain == null ? 1 : gain, id: id }; if (extra) for (var k in extra) e[k] = extra[k]; EV.push(e); }
    else GT[id] = t;
    return GT[id];
  }
  function vadEndBefore(t, from) { var ve = from; (window.VAD || []).forEach(function (v) { if (v[0] < t - .2 && v[1] > ve) ve = v[1]; }); return ve; }
  function after(id) { var i = ORDER.indexOf(id), nx = ORDER[i + 1]; return vadEndBefore(nx ? start(nx) : DUR, lastw(id) - .6) + .155; }

  /* ---------- canvas + safe-area check ---------- */
  var cv, ctx, tmp, tctx, acc, actx, LIVE = { grain: true, text: true };
  function mk(w, h) { var c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; }
  var BOUNDS = null, NOREC = false, CURT = 0, SAFE = { x0: 90, x1: 930, y1: 1450 };
  function recBox(g, x0, y0, x1, y1, text) {
    if (!BOUNDS || NOREC || (g !== ctx && g !== tctx) || g.globalAlpha < .05) return;
    var m = g.getTransform(), xs = [], ys = [];
    [[x0, y0], [x1, y0], [x0, y1], [x1, y1]].forEach(function (p) { xs.push(m.a * p[0] + m.c * p[1] + m.e); ys.push(m.b * p[0] + m.d * p[1] + m.f); });
    var a = Math.min.apply(null, xs), b = Math.max.apply(null, xs), c = Math.max.apply(null, ys);
    if (a < SAFE.x0 - .5 || b > SAFE.x1 + .5 || c > SAFE.y1 + .5) BOUNDS.push({ t: CURT, text: text, x0: Math.round(a), x1: Math.round(b), y1: Math.round(c) });
  }
  function watch(g) {
    var orig = g.fillText, oimg = g.drawImage;
    g.fillText = function (str, x, y) {
      if (BOUNDS) { var mm = this.measureText(str); recBox(this, x - mm.actualBoundingBoxLeft, y - mm.actualBoundingBoxAscent, x + mm.actualBoundingBoxRight, y + mm.actualBoundingBoxDescent, str); }
      return orig.apply(this, arguments);
    };
    /* pre-printed paper (strips, tags, the stamp) carries its words in a canvas: record those boxes too */
    g.drawImage = function (img) {
      if (BOUNDS && img && img.words && arguments.length >= 5) { var x = arguments[1], y = arguments[2], w = arguments[3], h = arguments[4], sx = w / img.pw, sy = h / img.ph; img.words.forEach(function (b) { recBox(g, x + b[0] * sx, y + b[1] * sy, x + b[2] * sx, y + b[3] * sy, b[4]); }); }
      return oimg.apply(this, arguments);
    };
  }

  /* ---------- primitives (setting ctx.font resets fontStretch: font() re-applies it) ---------- */
  function font(g, px, wt, fam) { g.font = (wt || 800) + ' ' + px + 'px ' + (fam || DISP); if (g.__st) try { g.fontStretch = g.__st; } catch (e) {} }
  function rr(g, x, y, w, h, r) { g.beginPath(); g.roundRect(x, y, w, h, Math.max(0, Math.min(r, w / 2, h / 2))); }
  function ls(g, px) { try { g.letterSpacing = px + 'px'; } catch (e) {} }
  function wide(g) { try { g.fontStretch = 'expanded'; } catch (e) {} }
  function cond(g, st) { g.__st = st || 'extra-condensed'; try { g.fontStretch = g.__st; } catch (e) {} }
  function unst(g) { g.__st = null; try { g.fontStretch = 'normal'; } catch (e) {} }
  function txt(g, text, x, y, o) {
    o = o || {}; var a = o.a == null ? 1 : o.a; if (a <= 0) return;
    var px = Math.max(36, o.px || 40);
    g.save(); g.globalAlpha *= clamp(a, 0, 1); if (o.cond !== false) cond(g, o.st); font(g, px, o.wt || 900); ls(g, o.ls == null ? 1 : o.ls);
    g.textAlign = o.align || 'left'; g.textBaseline = 'middle'; g.fillStyle = o.col || CREAM;
    g.fillText(text, x, y); g.restore(); unst(g);
  }
  function chip(g, text, x, y, o) {
    o = o || {}; var px = o.px || 56, a = o.a == null ? 1 : o.a, s = o.s == null ? 1 : o.s;
    if (a <= 0 || s <= 0) return 0;
    g.save(); if (o.cond !== false) cond(g); font(g, px, o.wt || 900); ls(g, o.ls || 1);
    var tw = g.measureText(text).width, pad = o.pad == null ? px * .34 : o.pad, w = o.w || tw + pad * 2, h = o.h || px * 1.3;
    g.globalAlpha *= clamp(a, 0, 1); g.translate(x, y); if (o.rot) g.rotate(o.rot); g.scale(s, s);
    if (o.shadow !== false) { rr(g, -w / 2 + 5, -h / 2 + 8, w, h, 8); g.fillStyle = 'rgba(0,0,0,.35)'; g.fill(); }
    rr(g, -w / 2, -h / 2, w, h, 8); g.fillStyle = o.bg || CREAM; g.fill();
    if (o.line) { g.strokeStyle = o.line; g.lineWidth = 3; g.stroke(); }
    g.fillStyle = o.fg || INK; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(text, 0, px * .04); g.restore(); unst(g);
    return w;
  }

  /* =====================================================================================================
     PAPER. Every piece is cut once into its own canvas: flat color, seeded tooth and fibres, a pale cut edge
     (the white core of cardstock), and a soft cast shadow baked in. Pieces then only move as rigid bodies,
     the way paper does: nothing morphs.
     ===================================================================================================== */
  var PS = 1.5, GRAIN = null, P = {};
  function buildGrain() {
    var c = mk(300, 300), g = c.getContext('2d'), r = mulberry(41), i;
    for (i = 0; i < 4600; i++) { var d = r(); g.fillStyle = d < .55 ? 'rgba(60,35,10,' + (.05 + r() * .1).toFixed(3) + ')' : 'rgba(255,255,255,' + (.06 + r() * .15).toFixed(3) + ')'; g.fillRect(r() * 300, r() * 300, .6 + r() * 1.5, .6 + r() * 1.5); }
    g.lineWidth = .8;
    for (i = 0; i < 120; i++) { var x = r() * 300, y = r() * 300, a = r() * 6.28, L = 6 + r() * 16; g.strokeStyle = 'rgba(70,45,20,' + (.07 + r() * .09).toFixed(3) + ')'; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(a + .6) * L * .5, y + Math.sin(a + .6) * L * .5, x + Math.cos(a) * L, y + Math.sin(a) * L); g.stroke(); }
    return c;
  }
  /* b = [x0, y0, x1, y1] in the piece's own coordinates; path(g) traces the outline; fill is a color or fn(g) */
  function piece(b, path, fill, o) {
    o = o || {};
    var ps = o.ps || PS, pad = o.pad == null ? 36 : o.pad, w = b[2] - b[0] + 2 * pad, h = b[3] - b[1] + 2 * pad;
    var c = mk(w * ps, h * ps), g = c.getContext('2d');
    g.scale(ps, ps); g.translate(pad - b[0], pad - b[1]);
    var fs = function () { return typeof fill === 'function' ? fill(g) : fill; };
    g.save();
    if (o.filter) g.filter = o.filter;
    if (o.shadow !== false) { g.shadowColor = o.sc || 'rgba(6,3,18,.5)'; g.shadowBlur = (o.blur || 12) * ps; g.shadowOffsetX = (o.sx == null ? 5 : o.sx) * ps; g.shadowOffsetY = (o.sy == null ? 9 : o.sy) * ps; }
    path(g); g.fillStyle = fs(); g.fill(); g.restore();
    if (o.grain !== 0) { g.save(); path(g); g.clip(); g.globalAlpha = o.grain || 1; g.fillStyle = g.createPattern(GRAIN, 'repeat'); g.fillRect(b[0] - pad, b[1] - pad, w, h); g.restore(); }
    if (o.extra) { g.save(); if (!o.noclip) { path(g); g.clip(); } o.extra(g); g.restore(); }
    if (o.edge !== false) { g.save(); path(g); g.strokeStyle = o.edgeCol || 'rgba(255,247,228,.85)'; g.lineWidth = o.edge || 2.4; g.lineJoin = 'round'; g.stroke(); g.restore(); }
    if (o.after) { g.save(); o.after(g); g.restore(); }
    return { c: c, x0: b[0] - pad, y0: b[1] - pad, w: w, h: h };
  }
  function put(g, Pc, x, y, rot, sx, sy) {
    g.save(); g.translate(x || 0, y || 0); if (rot) g.rotate(rot); if (sx != null) g.scale(sx, sy == null ? sx : sy);
    g.drawImage(Pc.c, Pc.x0, Pc.y0, Pc.w, Pc.h); g.restore();
  }
  /* ink: text drawn, then speckled out, so it reads printed by a worn stamp or hand-lettered with a marker */
  function inkText(g, text, x, y, px, col, seed, o) {
    o = o || {};
    var m = mk(4, 4).getContext('2d'); cond(m, o.st); font(m, px, o.wt || 900); ls(m, o.ls || 0);
    var tw = m.measureText(text).width, cw = Math.ceil(tw + px), ch = Math.ceil(px * 1.5), c = mk(cw * 2, ch * 2), q = c.getContext('2d');
    q.scale(2, 2); cond(q, o.st); font(q, px, o.wt || 900); ls(q, o.ls || 0); q.textAlign = 'center'; q.textBaseline = 'middle'; q.fillStyle = col;
    q.fillText(text, cw / 2, ch / 2 + px * .04); unst(q);
    var r = mulberry(seed || 7); q.globalCompositeOperation = 'destination-out';
    for (var i = 0; i < cw * ch / (o.dense || 55); i++) { q.globalAlpha = .25 + r() * .7; q.beginPath(); q.arc(r() * cw, r() * ch, .35 + r() * (o.big || 1.4), 0, 6.283); q.fill(); }
    g.save(); g.translate(x, y); if (o.rot) g.rotate(o.rot); g.drawImage(c, -cw / 2, -ch / 2, cw, ch); g.restore();
    return tw;
  }
  /* a jagged torn edge along x from 0 to w */
  function jag(seed, w, amp) { var r = mulberry(seed), p = []; for (var x = 0; x <= w; x += 7 + r() * 6) p.push([x, (amp || 6) * Math.sin(x * .07 + seed) + (r() - .5) * (amp || 6) * 1.6]); p.push([w, (r() - .5) * 6]); return p; }
  /* a torn newsprint strip carrying an exact quote (words wrapped to width); records its word boxes for the rail check */
  function buildStrip(text, w, px, seed, o) {
    o = o || {};
    var m = mk(4, 4).getContext('2d'); cond(m, 'condensed'); font(m, px, 800); ls(m, 0);
    var words = text.split(' '), lines = [''], maxw = w - 70;
    words.forEach(function (wd) { var L = lines.length - 1, tryL = lines[L] ? lines[L] + ' ' + wd : wd; if (m.measureText(tryL).width > maxw && lines[L]) lines.push(wd); else lines[L] = tryL; });
    var lh = px * 1.2, h = lines.length * lh + 64, top = jag(seed, w, 5), bot = jag(seed + 9, w, 5);
    function path(g) { g.beginPath(); g.moveTo(0, top[0][1]); top.forEach(function (p) { g.lineTo(p[0], p[1]); }); for (var i = bot.length - 1; i >= 0; i--) g.lineTo(bot[i][0], h + bot[i][1]); g.closePath(); }
    var rec = [];
    var pc = piece([0, -10, w, h + 10], path, NEWS, { sx: 6, sy: 12, blur: 16, extra: function (g) {
      /* faint newsprint ruling and a column line printed through the back */
      g.fillStyle = 'rgba(29,18,51,.05)'; for (var y = 18; y < h; y += 9) g.fillRect(0, y, w, 1);
      cond(g, 'condensed'); font(g, px, 800); ls(g, 0); g.fillStyle = INK; g.textBaseline = 'middle'; g.textAlign = 'left';
      lines.forEach(function (L, i) { var y = 32 + lh * (i + .5); g.fillText(L, 36, y); var mm = g.measureText(L); rec.push([36, y - px * .62, 36 + mm.width, y + px * .3, L]); });
      unst(g);
    }, edgeCol: 'rgba(255,253,245,.95)', edge: 2 });
    /* store word boxes relative to the canvas draw rect */
    pc.words = rec.map(function (r0) { return [r0[0] - pc.x0, r0[1] - pc.y0, r0[2] - pc.x0, r0[3] - pc.y0, r0[4]]; });
    pc.lines = lines; pc.sw = w; pc.sh = h;
    return pc;
  }
  /* draw a piece that carries words (so recBox sees them) */
  function putW(g, Pc, x, y, rot, s) {
    g.save(); g.translate(x, y); if (rot) g.rotate(rot); if (s != null && s !== 1) g.scale(s, s);
    Pc.c.words = Pc.words || null; Pc.c.pw = Pc.w; Pc.c.ph = Pc.h;
    g.drawImage(Pc.c, Pc.x0, Pc.y0, Pc.w, Pc.h); Pc.c.words = null;
    g.restore();
  }
  function tape(g, x, y, w, h, rot) { g.save(); g.translate(x, y); g.rotate(rot || 0); g.fillStyle = 'rgba(255,250,232,.55)'; g.fillRect(-w / 2, -h / 2, w, h); g.fillStyle = 'rgba(255,255,255,.25)'; g.fillRect(-w / 2, -h / 2, w, 4); g.restore(); }

  /* ---------- shapes ---------- */
  function blobPath(rx, ry, seed) { var r = mulberry(seed), a1 = r() * 6, a2 = r() * 6, a3 = r() * 6; return function (g) { g.beginPath(); for (var i = 0; i <= 96; i++) { var th = i / 96 * TAU, k = 1 + .11 * Math.sin(3 * th + a1) + .07 * Math.sin(5 * th + a2) + .04 * Math.sin(7 * th + a3); var x = Math.cos(th) * rx * k, y = Math.sin(th) * ry * k * (1 + .18 * Math.cos(th)); if (i) g.lineTo(x, y); else g.moveTo(x, y); } g.closePath(); }; }
  function bumps(x0, x1, base, hmin, hmax, seed, bottom) {
    var r = mulberry(seed);
    return function (g) {
      g.beginPath(); g.moveTo(x0, bottom); g.lineTo(x0, base);
      var x = x0;
      while (x < x1) { var wv = 46 + r() * 50, hh = hmin + r() * (hmax - hmin); g.quadraticCurveTo(x + wv / 2, base - hh * 2, x + wv, base - r() * 8); x += wv; }
      g.lineTo(x1, bottom); g.closePath();
    };
  }
  function scallop(x0, x1, y, rr0, depth) { return function (g) { g.beginPath(); g.moveTo(x0, y + depth); for (var x = x0; x < x1; x += rr0 * 2) g.arc(x + rr0, y, rr0, Math.PI, 0, false); g.lineTo(x1, y + depth); g.closePath(); }; }
  function rect(x0, y0, x1, y1) { return function (g) { g.beginPath(); g.rect(x0, y0, x1 - x0, y1 - y0); }; }

  /* =====================================================================================================
     THE SET (world coordinates). An open pop-up book lies on a dark bench. The upper page stands (night sky,
     a paper sun, clouds on threads, the dashed northern border); the lower page lies flat: a paper map with a
     teal land, a vellum stream and a pink beach. Three cut layers of mountain rise from the fold on their
     V-folds: an orange back ridge, a teal mid ridge with cut pines, a pink front slope. To the right, on the
     bench and nowhere near the book: the REAL WORLD ruler, its own cardstock object.
     ===================================================================================================== */
  var BACK = [[110, 975], [190, 815], [300, 700], [395, 748], [520, 590], [640, 690], [745, 655], [845, 780], [910, 975]];
  var MIDR = [[120, 992], [205, 870], [290, 812], [380, 860], [470, 775], [565, 835], [650, 790], [765, 868], [900, 992]];
  var FRONT = [[100, 1012], [170, 935], [280, 905], [400, 928], [520, 898], [640, 922], [760, 902], [862, 942], [920, 1012]];
  var BORDER_Y = 668, BK = .92;
  var STREAM = [[592, 1006], [574, 1040], [600, 1066], [652, 1084], [676, 1120], [660, 1170], [640, 1220], [664, 1280], [706, 1330], [716, 1392]];
  var PINES = [[226, .9], [262, .75], [318, 1], [600, .95], [688, 1.05], [722, .8], [818, .9]];
  function polyPath(pts) { return function (g) { g.beginPath(); pts.forEach(function (p, i) { if (i) g.lineTo(p[0], p[1]); else g.moveTo(p[0], p[1]); }); g.closePath(); }; }
  function ridgeY(pts, x) { for (var i = 1; i < pts.length; i++) if (x <= pts[i][0]) { var a = pts[i - 1], b = pts[i]; return lerp(a[1], b[1], (x - a[0]) / (b[0] - a[0])); } return pts[pts.length - 1][1]; }
  function grad(y0, y1, stops) { return function (g) { var gr = g.createLinearGradient(0, y0, 0, y1); stops.forEach(function (s) { gr.addColorStop(s[0], s[1]); }); return gr; }; }
  /* lighter cut planes down the left face of every peak, a darker one down the right: layered paper, not a gradient */
  function facets(pts, base, lite, dark) {
    return function (g) {
      for (var i = 1; i < pts.length - 1; i++) {
        var p = pts[i], a = pts[i - 1], b = pts[i + 1]; if (!(p[1] < a[1] && p[1] < b[1])) continue;
        g.fillStyle = lite; g.beginPath(); g.moveTo(p[0], p[1]); g.lineTo(lerp(p[0], a[0], .55), base + 30); g.lineTo(p[0] - 6, base + 30); g.closePath(); g.fill();
        g.fillStyle = dark; g.beginPath(); g.moveTo(p[0], p[1]); g.lineTo(p[0] + 8, base + 30); g.lineTo(lerp(p[0], b[0], .5), base + 30); g.closePath(); g.fill();
      }
    };
  }
  function panelPiece(text, w, h, px, seed) {
    var pc = piece([-w / 2, -h, w / 2, 0], function (g) { g.beginPath(); g.moveTo(-w / 2 + 14, -h); g.lineTo(w / 2 - 14, -h); g.lineTo(w / 2, -h + 14); g.lineTo(w / 2, 0); g.lineTo(-w / 2, 0); g.lineTo(-w / 2, -h + 14); g.closePath(); }, PAPER, { sy: 8, blur: 12, extra: function (g) {
      g.fillStyle = TEAL; g.fillRect(-w / 2, -16, w, 16);
      inkText(g, text, 0, -h / 2 - 6, px, INK, seed, { dense: 70, ls: 2 });
    } });
    var m = mk(4, 4).getContext('2d'); cond(m); font(m, px, 900); ls(m, 2); var tw = m.measureText(text).width; unst(m);
    pc.words = [[-pc.x0 - tw / 2, -pc.y0 - h / 2 - 6 - px * .55, -pc.x0 + tw / 2, -pc.y0 - h / 2 - 6 + px * .45, text]];
    return pc;
  }
  /* a printed card that carries words: lines = [[text, px, color, dy]] centred; bg color; returns a piece with word boxes */
  function cardPiece(w, h, bg, lines, o) {
    o = o || {}; var rec = [];
    var pc = piece([-w / 2, -h / 2, w / 2, h / 2], function (g) { rr(g, -w / 2, -h / 2, w, h, o.r == null ? 10 : o.r); }, bg, { sy: o.sy == null ? 9 : o.sy, blur: 12, extra: function (g) {
      if (o.ring) { g.strokeStyle = o.ring; g.lineWidth = 4; rr(g, -w / 2 + 9, -h / 2 + 9, w - 18, h - 18, 6); g.stroke(); }
      lines.forEach(function (L) { cond(g); font(g, L[1], 900); ls(g, 1); g.fillStyle = L[2]; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(L[0], 0, L[3]); var mm = g.measureText(L[0]); rec.push([-mm.width / 2, L[3] - L[1] * .55, mm.width / 2, L[3] + L[1] * .45, L[0]]); unst(g); });
      if (o.after) o.after(g);
    } });
    pc.words = rec.map(function (r0) { return [r0[0] - pc.x0, r0[1] - pc.y0, r0[2] - pc.x0, r0[3] - pc.y0, r0[4]]; });
    return pc;
  }

  function buildTextures() {
    GRAIN = buildGrain();
    /* the bench: dark violet board with a faint wood grain */
    P.bench = piece([-700, -300, 2400, 2700], rect(-700, -300, 2400, 2700), '#1a1036', { shadow: false, edge: false, grain: .8, ps: .4, extra: function (g) {
      var r = mulberry(12); g.lineWidth = 3;
      for (var i = 0; i < 70; i++) { var y = -300 + i * 43 + r() * 10; g.strokeStyle = 'rgba(150,120,230,' + (.05 + r() * .07).toFixed(3) + ')'; g.beginPath(); g.moveTo(-700, y); for (var x = -700; x <= 2400; x += 100) g.lineTo(x, y + 8 * Math.sin(x * .004 + i) + r() * 3); g.stroke(); }
    } });
    /* the standing page: a night sky printed on cardstock */
    P.page = piece([100, 230, 920, 990], rect(100, 230, 920, 990), grad(230, 990, [[0, '#120a30'], [.45, '#33186a'], [.8, '#6a2a8a'], [1, '#93338e']]), { sx: 0, sy: -8, blur: 18, ps: 1, extra: function (g) {
      var r = mulberry(5); g.fillStyle = 'rgba(255,240,230,.5)';
      for (var i = 0; i < 26; i++) { var x = 120 + r() * 780, y = 250 + r() * 380, s = 1.5 + r() * 2.5; g.fillRect(x, y, s, s); }
    } });
    P.sun = piece([-92, -92, 92, 92], function (g) { g.beginPath(); g.arc(0, 0, 90, 0, TAU); }, grad(-90, 90, [[0, '#fff1c2'], [1, '#ffc46e']]), { sy: 6, blur: 10, after: function (g) { g.strokeStyle = ORG; g.lineWidth = 6; g.beginPath(); g.arc(0, 0, 70, 0, TAU); g.stroke(); } });
    P.cloud1 = piece([0, -40, 360, 26], function (g) { g.beginPath(); g.moveTo(0, 20); g.quadraticCurveTo(40, -26, 100, -2); g.quadraticCurveTo(160, -44, 230, -6); g.quadraticCurveTo(300, -34, 340, 4); g.quadraticCurveTo(366, 10, 360, 22); g.closePath(); }, '#ff9cc9', { sy: 7, blur: 8 });
    P.cloud2 = piece([0, -30, 280, 22], function (g) { g.beginPath(); g.moveTo(0, 18); g.quadraticCurveTo(50, -30, 120, -4); g.quadraticCurveTo(200, -30, 250, 0); g.quadraticCurveTo(286, 6, 280, 18); g.closePath(); }, '#a7efe6', { sy: 7, blur: 8 });
    /* the lying page: a paper map (no state outline, no game map: a teal land, a vellum stream, a pink beach) */
    P.map = piece([80, 985, 940, 1405], polyPath([[100, 985], [920, 985], [935, 1405], [85, 1405]]), PAPER, { sx: 0, sy: 14, blur: 18, ps: 1, extra: function (g) {
      g.fillStyle = '#5ccfbd'; polyPath([[122, 1002], [898, 1002], [924, 1640], [96, 1640]])(g); g.fill();
      var r = mulberry(31); g.fillStyle = '#3db9a8';
      for (var i = 0; i < 9; i++) { var x = 150 + r() * 700, y = 1060 + r() * 260; g.beginPath(); g.ellipse(x, y, 40 + r() * 50, 16 + r() * 16, r() * .4 - .2, 0, TAU); g.fill(); }
      /* the beach and the sea */
      g.fillStyle = HOT; g.beginPath(); g.moveTo(90, 1372); for (var x2 = 90; x2 <= 940; x2 += 20) g.lineTo(x2, 1372 + 6 * Math.sin(x2 * .03)); g.lineTo(940, 1650); g.lineTo(90, 1650); g.closePath(); g.fill();
      g.fillStyle = '#167f8f'; g.beginPath(); g.moveTo(90, 1398); for (x2 = 90; x2 <= 940; x2 += 20) g.lineTo(x2, 1398 + 7 * Math.sin(x2 * .025 + 1)); g.lineTo(940, 1650); g.lineTo(90, 1650); g.closePath(); g.fill();
      /* the vellum stream */
      g.lineCap = 'round'; g.lineJoin = 'round';
      [[30, 'rgba(255,253,240,.9)'], [24, 'rgba(160,226,246,.9)'], [8, 'rgba(255,255,255,.45)']].forEach(function (s) { g.strokeStyle = s[1]; g.lineWidth = s[0]; g.beginPath(); STREAM.forEach(function (p, i) { if (i) g.lineTo(p[0], p[1]); else g.moveTo(p[0], p[1]); }); g.stroke(); });
      /* a dashed dirt road and the hinge dashes of the fold */
      g.strokeStyle = 'rgba(255,248,230,.85)'; g.lineWidth = 6; g.setLineDash([18, 12]); g.beginPath(); g.moveTo(190, 1360); g.quadraticCurveTo(250, 1160, 430, 1100); g.quadraticCurveTo(520, 1070, 540, 1018); g.stroke();
      g.strokeStyle = 'rgba(29,18,51,.3)'; g.lineWidth = 2; g.setLineDash([8, 7]); g.beginPath(); g.moveTo(100, 994); g.lineTo(920, 994); g.stroke(); g.setLineDash([]);
      /* the pull-tab slot */
      g.fillStyle = 'rgba(29,18,51,.75)'; g.fillRect(216, 1150, 8, 64);
    } });
    P.pull = piece([-90, -26, 0, 26], function (g) { g.beginPath(); g.moveTo(0, -24); g.lineTo(-74, -24); g.quadraticCurveTo(-90, -24, -90, -8); g.lineTo(-90, 8); g.quadraticCurveTo(-90, 24, -74, 24); g.lineTo(0, 24); g.closePath(); }, '#dcab6c', { sx: 3, sy: 5, blur: 6, extra: function (g) {
      g.strokeStyle = INK; g.lineWidth = 5; g.lineCap = 'round'; g.beginPath(); g.moveTo(-24, 0); g.lineTo(-66, 0); g.moveTo(-54, -11); g.lineTo(-66, 0); g.lineTo(-54, 11); g.stroke();
    } });
    /* the three mountain layers */
    P.mBack = piece([100, 580, 920, 980], polyPath(BACK), grad(590, 975, [[0, '#ffb067'], [1, '#f2732e']]), { sx: 4, sy: -6, blur: 14, extra: facets(BACK, 975, 'rgba(255,236,200,.28)', 'rgba(140,40,10,.18)') });
    P.mMid = piece([110, 765, 910, 996], polyPath(MIDR), grad(775, 992, [[0, '#3fe3d4'], [1, '#12a59c']]), { sx: 4, sy: -6, blur: 12, extra: facets(MIDR, 992, 'rgba(230,255,250,.28)', 'rgba(0,60,70,.2)') });
    P.mFront = piece([95, 890, 925, 1016], polyPath(FRONT), grad(898, 1012, [[0, '#ff7cbd'], [1, '#ef3f94']]), { sx: 4, sy: -5, blur: 12, extra: function (g) {
      facets(FRONT, 1012, 'rgba(255,230,240,.3)', 'rgba(120,10,60,.16)')(g);
      /* the off-road trail printed on the front slope */
      g.strokeStyle = 'rgba(255,246,228,.9)'; g.lineWidth = 6; g.setLineDash([14, 10]); g.lineCap = 'round'; g.beginPath(); g.moveTo(730, 905); g.quadraticCurveTo(790, 925, 766, 960); g.quadraticCurveTo(750, 990, 832, 1004); g.stroke(); g.setLineDash([]);
    } });
    P.vtab = piece([-22, 0, 22, 22], function (g) { g.beginPath(); g.moveTo(-18, 0); g.lineTo(18, 0); g.lineTo(22, 20); g.lineTo(-22, 20); g.closePath(); }, '#dcab6c', { sx: 2, sy: 3, blur: 4, extra: function (g) { g.strokeStyle = 'rgba(80,45,15,.6)'; g.setLineDash([4, 3]); g.lineWidth = 2; g.beginPath(); g.moveTo(-18, 1); g.lineTo(18, 1); g.stroke(); } });
    P.pine = piece([-38, -118, 38, 6], function (g) { g.beginPath(); g.moveTo(0, -118); g.lineTo(22, -78); g.lineTo(12, -78); g.lineTo(32, -42); g.lineTo(18, -42); g.lineTo(38, -6); g.lineTo(5, -6); g.lineTo(5, 6); g.lineTo(-5, 6); g.lineTo(-5, -6); g.lineTo(-38, -6); g.lineTo(-18, -42); g.lineTo(-32, -42); g.lineTo(-12, -78); g.lineTo(-22, -78); g.closePath(); }, '#0b5f63', { sx: 3, sy: 5, blur: 6 });
    /* the deer, a kraft silhouette (no rifle drawn) */
    P.deer = piece([-62, -122, 64, 4], function (g) {
      g.beginPath(); g.moveTo(-50, -66); g.quadraticCurveTo(-10, -80, 30, -70); g.lineTo(40, -96); g.lineTo(52, -104); g.lineTo(64, -98); g.lineTo(56, -90); g.lineTo(46, -64); g.lineTo(40, -48); g.lineTo(38, 0); g.lineTo(30, 0); g.lineTo(28, -40); g.lineTo(-30, -42); g.lineTo(-36, 0); g.lineTo(-44, 0); g.lineTo(-46, -44); g.quadraticCurveTo(-60, -50, -56, -64); g.closePath();
      g.moveTo(44, -100); g.lineTo(38, -122); g.lineTo(42, -122); g.lineTo(48, -104); g.closePath(); g.moveTo(52, -104); g.lineTo(60, -120); g.lineTo(64, -118); g.lineTo(56, -102); g.closePath();
    }, '#c98a4b', { sx: 3, sy: 5, blur: 6 });
    P.fish = piece([-44, -18, 44, 18], function (g) { g.beginPath(); g.moveTo(30, 0); g.quadraticCurveTo(10, -18, -22, -6); g.lineTo(-42, -16); g.lineTo(-36, 0); g.lineTo(-42, 16); g.lineTo(-22, 6); g.quadraticCurveTo(10, 18, 30, 0); g.closePath(); }, ORG, { sx: 3, sy: 5, blur: 6, extra: function (g) { g.fillStyle = INK; g.beginPath(); g.arc(18, -3, 3.2, 0, TAU); g.fill(); g.strokeStyle = 'rgba(255,240,220,.7)'; g.lineWidth = 2; g.beginPath(); g.moveTo(-6, -8); g.lineTo(-6, 8); g.stroke(); } });
    P.bike = piece([-44, -50, 44, 22], function (g) {
      g.beginPath(); g.arc(-26, 0, 20, 0, TAU); g.moveTo(46, 0); g.arc(26, 0, 20, 0, TAU);
      g.moveTo(-26, -3); g.lineTo(-4, -30); g.lineTo(20, -30); g.lineTo(26, -3); g.lineTo(23, 0); g.lineTo(16, -24); g.lineTo(-2, -24); g.lineTo(-22, 2); g.closePath();
      g.moveTo(14, -30); g.lineTo(20, -46); g.lineTo(32, -46); g.lineTo(32, -40); g.lineTo(24, -40); g.lineTo(19, -28); g.closePath();
      g.moveTo(-14, -30); g.lineTo(6, -36); g.lineTo(8, -30); g.closePath();
    }, INK, { sx: 3, sy: 5, blur: 6, after: function (g) { g.fillStyle = TEAL; g.beginPath(); g.moveTo(-4, -30); g.lineTo(20, -30); g.lineTo(16, -24); g.lineTo(-2, -24); g.closePath(); g.fill(); g.fillStyle = '#5a5070'; [-26, 26].forEach(function (x) { g.beginPath(); g.arc(x, 0, 11, 0, TAU); g.fill(); }); } });
    /* the two backwoods cabins: the mystics' (pink roof, a crescent-moon charm, smoke) and the radicals' (tinfoil roof, KEEP OUT) */
    P.cab1 = piece([-74, -128, 74, 0], function (g) { g.beginPath(); g.moveTo(-60, 0); g.lineTo(-60, -70); g.lineTo(-74, -70); g.lineTo(0, -128); g.lineTo(74, -70); g.lineTo(60, -70); g.lineTo(60, 0); g.closePath(); }, KRAFT, { sx: 4, sy: 6, blur: 8, extra: function (g) {
      g.fillStyle = HOT; g.beginPath(); g.moveTo(-74, -70); g.lineTo(0, -128); g.lineTo(74, -70); g.lineTo(60, -62); g.lineTo(0, -112); g.lineTo(-60, -62); g.closePath(); g.fill();
      g.strokeStyle = 'rgba(70,40,15,.45)'; g.lineWidth = 2; for (var y = -54; y < 0; y += 12) { g.beginPath(); g.moveTo(-60, y); g.lineTo(60, y); g.stroke(); }
      g.fillStyle = '#3a2412'; g.fillRect(-14, -44, 28, 44);
      g.fillStyle = '#ffd27e'; g.fillRect(24, -46, 22, 18);
    } });
    P.door = piece([0, -44, 28, 0], rect(0, -44, 28, 0), '#7a4d27', { sx: 2, sy: 3, blur: 4, extra: function (g) { g.fillStyle = '#e6b866'; g.beginPath(); g.arc(22, -22, 3, 0, TAU); g.fill(); } });
    P.moon = piece([-20, -22, 20, 22], function (g) { g.beginPath(); g.arc(0, 0, 20, .9, TAU - .9, false); g.arc(9, 0, 15, TAU - 1.25, 1.25, true); g.closePath(); }, '#fff1c2', { sx: 2, sy: 3, blur: 4 });
    P.cab2 = piece([-70, -112, 70, 0], function (g) { g.beginPath(); g.moveTo(-58, 0); g.lineTo(-58, -64); g.lineTo(-70, -64); g.lineTo(-40, -112); g.lineTo(40, -112); g.lineTo(70, -64); g.lineTo(58, -64); g.lineTo(58, 0); g.closePath(); }, KRAFT2, { sx: 4, sy: 6, blur: 8, extra: function (g) {
      var gr = g.createLinearGradient(-70, -112, 70, -64); gr.addColorStop(0, '#eef1f6'); gr.addColorStop(.5, '#a9b2c4'); gr.addColorStop(1, '#dfe3ea');
      g.fillStyle = gr; g.beginPath(); g.moveTo(-70, -64); g.lineTo(-40, -112); g.lineTo(40, -112); g.lineTo(70, -64); g.closePath(); g.fill();
      var r = mulberry(17); g.strokeStyle = 'rgba(60,66,84,.45)'; g.lineWidth = 1.6; for (var i = 0; i < 16; i++) { var x = -60 + r() * 120, y = -108 + r() * 40; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (r() - .5) * 26, y + r() * 14); g.stroke(); }
      g.fillStyle = '#2a1a0c'; g.fillRect(-40, -46, 24, 20); g.fillRect(16, -46, 24, 20);
      g.strokeStyle = '#b9bfcc'; g.lineWidth = 3; g.beginPath(); g.moveTo(-40, -46); g.lineTo(-16, -26); g.moveTo(-16, -46); g.lineTo(-40, -26); g.stroke();
    } });
    P.keep = cardPiece(170, 62, PAPER, [['KEEP OUT', 40, INK, 2]], { r: 4, sy: 6, ring: HOT });
    P.post = piece([-5, 0, 5, 70], rect(-5, 0, 5, 70), KRAFT2, { sx: 2, sy: 4, blur: 4 });
    /* the backwoods curtain: a row of tall paper pines on a strip, slid across in front of the cabins */
    var cr = mulberry(44);
    P.curtain = piece([0, 600, 1000, 1030], function (g) { g.beginPath(); g.rect(0, 1000, 1000, 30); for (var x = 20; x < 1000; x += 78) { var h = 250 + cr() * 110, w = 70 + cr() * 20; g.moveTo(x - w / 2, 1004); g.lineTo(x, 1004 - h); g.lineTo(x + w / 2, 1004); g.closePath(); } }, '#0a4b52', { sx: 6, sy: 10, blur: 16 });
    /* paper binoculars on a stick (generic, no seal, no agency) */
    P.binoc = piece([-90, -44, 470, 44], function (g) { g.beginPath(); g.arc(-46, 0, 42, 0, TAU); g.moveTo(84, 0); g.arc(42, 0, 42, 0, TAU); g.rect(-10, -14, 20, 28); g.rect(80, -9, 390, 18); }, INK, { sx: 4, sy: 7, blur: 10, after: function (g) { g.fillStyle = '#9fe9ff'; [-46, 42].forEach(function (x) { g.beginPath(); g.arc(x, 0, 26, 0, TAU); g.fill(); }); g.fillStyle = 'rgba(255,255,255,.75)'; [-46, 42].forEach(function (x) { g.beginPath(); g.arc(x - 8, -8, 7, 0, TAU); g.fill(); }); g.fillStyle = KRAFT; g.fillRect(84, -9, 386, 18); } });
    /* the magnifier card */
    P.mag = piece([-110, -110, 260, 110], function (g) { g.beginPath(); g.arc(0, 0, 100, 0, TAU); g.arc(0, 0, 80, 0, TAU, true); g.moveTo(84, 30); g.lineTo(250, 92); g.lineTo(240, 108); g.lineTo(76, 50); g.closePath(); }, CREAM, { sx: 5, sy: 9, blur: 12, after: function (g) { g.fillStyle = 'rgba(200,245,255,.22)'; g.beginPath(); g.arc(0, 0, 80, 0, TAU); g.fill(); g.strokeStyle = 'rgba(255,255,255,.6)'; g.lineWidth = 5; g.beginPath(); g.arc(0, 0, 62, 3.6, 4.4); g.stroke(); } });
    /* the place-name flag on a toothpick */
    P.flag = cardPiece(184, 126, CREAM, [['MOUNT', 50, INK, -26], ['KALAGA', 56, HOT, 28]], { r: 4, sy: 7, ring: null, after: function (g) { g.fillStyle = TEAL; g.fillRect(-92, -63, 10, 126); } });
    P.pole = piece([-4, -140, 4, 0], rect(-4, -140, 4, 0), '#e8c48a', { sx: 3, sy: 4, blur: 4 });
    /* the N tab and the frame-0 question */
    P.ntab = cardPiece(84, 84, CREAM, [['N', 58, INK, 2]], { r: 42, sy: 6, ring: TEAL });
    P.tagQ = panelPiece('MOUNTAIN?', 480, 150, 104, 21);
    P.voteM = panelPiece('MOUNTAIN', 340, 132, 82, 22);
    P.voteH = panelPiece('HILL', 340, 132, 82, 23);
    P.stilt = piece([-6, -150, 6, 0], rect(-6, -150, 6, 0), '#dcab6c', { sx: 2, sy: 4, blur: 4 });
    /* the blank tape (no numbers: Rockstar gives no height) and its ? tag */
    P.spool = piece([-34, -34, 34, 34], function (g) { g.beginPath(); g.arc(0, 0, 32, 0, TAU); }, KRAFT, { sx: 3, sy: 5, blur: 6, after: function (g) { g.fillStyle = '#7a4d27'; g.beginPath(); g.arc(0, 0, 10, 0, TAU); g.fill(); } });
    P.qtag = cardPiece(140, 156, PAPER, [['?', 136, HOT, 8]], { r: 10, sy: 8, ring: HOT });
    /* the GTA 6 sticker */
    P.pill = cardPiece(212, 82, HOT, [['GTA 6', 64, INK, 3]], { r: 41, ring: 'rgba(255,240,234,.9)' });
    /* Rockstar's words, exactly as printed on rockstargames.com/VI/only-in-leonida/kalaga, cut with … */
    P.s1 = buildStrip('“A national landmark up against the state’s northern border… prime hunting, fishing, and off-road trails.”', 760, 48, 61);
    P.s3 = buildStrip('“…hillbilly mystics and paranoid radicals live far from the prying eyes of the government.”', 760, 48, 63);
  }
  /* =====================================================================================================
     THE CAMERA: one camera over the bench. r = the slide right to the ruler (and a pull back), d = the dip
     into the backwoods, pu = a slow creep in under the quotes. Layers take parallax p.
     ===================================================================================================== */
  var T = {}, LIVE2 = { bg: true, clip: true };
  function cam(t) {
    var r = 0;
    var d = eio(seg(t, T.dip0, T.dip0 + .9)) * (1 - eio(seg(t, T.up0, T.up0 + .8)));
    var pu = eio(seg(t, T.push0, T.push1)) * (1 - eio(seg(t, T.dip0, T.dip0 + .9)));
    var jolt = kn(t, T.pop + .12, .03) * (1 + .03 * Math.sin(Math.PI * .5 * seg(t, 0, T.pop)) * (1 - eio(seg(t, T.fold0, T.reopen + .4)))), ey = 1 + .06 * eio(seg(t, T.ey0, T.ey1)) * (1 - eio(seg(t, T.up0, T.up0 + .8)));
    return { cx: 510 + 10 * d, cy: 865 + 40 * d + 12 * pu, s: (1 + .12 * d + .04 * pu) * jolt * ey, r: r, d: d };
  }
  function L(g, C, p) { var zz = 1 + (C.s - 1) * p; g.translate(510, 865); g.scale(zz, zz); g.translate(-(510 + (C.cx - 510) * p), -(865 + (C.cy - 865) * p)); }
  function lay(g, C, p, fn) { g.save(); L(g, C, p); fn(); g.restore(); }
  function book(g, C, p, fn) { g.save(); L(g, C, p); g.translate(510, 985); g.scale(BK, BK); g.translate(-510, -985); fn(); g.restore(); }
  function moving(C) { return (C.r > .001 && C.r < .999) || (C.d > .001 && C.d < .999); }

  /* ---------- the pop-up: how far each layer stands (0 flat .. 1 up). Frame 0 is already rising; it snaps up on
     "mountain"; it folds flat after the vote and starts rising again so the last frame is frame 0. ---------- */
  function riseAt(t) {
    if (t < 0) t += DUR; if (t > DUR) t -= DUR;
    if (t >= T.reopen) { var ru = seg(t, T.reopen, DUR); return .5 * (1 - (1 - ru) * (1 - ru)); }
    var tt = Math.min(t, T.pop), u0 = .5 + .2 * tt, R = u0 + (1 - u0) * eio(seg(t, T.pop, T.pop + .2));
    /* the vote: it stands on "mountain", sinks to a 30% hill on "hill", springs back up on "One word." */
    R *= 1 - .7 * eio(seg(t, T.kH, T.kH + .3)) * (1 - eio(seg(t, T.kOne, T.kOne + .22)));
    if (t >= T.fold0) R *= 1 - eio(seg(t, T.fold0, T.fold0 + .4));
    return R;
  }
  /* every pop-up feature folds flat just before the layers do, so the last frame is frame 0 */
  function featFold(t) { return 1 - eio(seg(t, T.fold0 - .25, T.fold0 + .1)); }
  function upright(g, bx, by, sy, fn) { if (sy < .015) return; g.save(); g.translate(bx, by); g.scale(1, sy); g.translate(-bx, -by); fn(); g.restore(); }
  /* a small pop-up feature: rises on its word, folds with its layer */
  function pk(t, a, w) { return cd(t, a, w || 14); }

  function ribbon(g, t) {
    var tight = eio(seg(t, T.border0, T.border1)) * (1 - eio(seg(t, T.fold0, T.fold0 + .4))), sag = 30 * (1 - tight);
    var tw = kn(t, T.snapT, .5);
    g.save(); g.lineCap = 'round';
    function path() { g.beginPath(); for (var i = 0; i <= 40; i++) { var u = i / 40, x = lerp(112, 908, u), y = BORDER_Y + sag * Math.sin(Math.PI * u) + (tw - 1) * 30 * Math.sin(Math.PI * u * 3) + 2 * osc(t, 3, u * 4) * (1 - tight); if (i) g.lineTo(x, y); else g.moveTo(x, y); } }
    g.strokeStyle = 'rgba(6,3,18,.45)'; g.lineWidth = 12; g.translate(3, 6); path(); g.stroke(); g.translate(-3, -6);
    g.strokeStyle = CREAM; g.lineWidth = 10; path(); g.stroke();
    g.strokeStyle = HOT; g.lineWidth = 10; g.setLineDash([22, 18]); path(); g.stroke(); g.setLineDash([]);
    [112, 908].forEach(function (x) { g.fillStyle = '#e6b866'; g.beginPath(); g.arc(x, BORDER_Y, 9, 0, TAU); g.fill(); });
    g.restore();
  }
  function stream(g, t) {
    /* light glints run down the vellum */
    g.save(); g.fillStyle = 'rgba(255,255,255,.75)';
    for (var k = 0; k < 4; k++) { var u = ((t / DUR) * 6 + k / 4) % 1, f = u * (STREAM.length - 1), i = Math.floor(f), a = STREAM[i], b = STREAM[Math.min(i + 1, STREAM.length - 1)], x = lerp(a[0], b[0], f - i), y = lerp(a[1], b[1], f - i); g.beginPath(); g.ellipse(x, y, 9, 3, .6, 0, TAU); g.fill(); }
    g.restore();
  }
  function mountain(g, t, C) {
    var Rb = riseAt(t), Rm = riseAt(t - .07), Rf = riseAt(t - .14), fz = featFold(t);
    /* contact shadow on the map, longer as the layers stand */
    g.save(); g.globalAlpha = .35 * Rf; var gr = g.createLinearGradient(0, 1000, 0, 1050); gr.addColorStop(0, 'rgba(6,3,18,.8)'); gr.addColorStop(1, 'rgba(6,3,18,0)'); g.fillStyle = gr; g.fillRect(100, 1004, 820, 46); g.restore();
    upright(g, 0, 975, Rb, function () {
      put(g, P.mBack, 0, 0);
      /* the flag stabs into the right shoulder on "Kalaga" */
      if (t >= T.flag - .02 && fz > .015) {
        g.save(); g.translate(0, 718); g.scale(1, fz); g.translate(0, -718);
        var fk = cd(t, T.flag, 22), fy = lerp(-300, 0, fk) + 10 * bump(t, T.seat, .25), fr = sw(t, T.flag + .12, .05, 9, 3) + sw(t, T.seat, .06, 10, 3) + .012 * osc(t, 7) + sw(t, T.lmk, .035, 8, 3);
        g.save(); g.translate(690, 718 + fy); g.rotate(fr); put(g, P.pole, 0, 0);
        NOREC = fk < .98 || Rb < .98 || fz < .98 || C.r > .3 || moving(C); g.save(); g.translate(96, -134 + 63); g.rotate(.01 * osc(t, 11)); putW(g, P.flag, 0, 0); g.restore(); NOREC = false;
        g.restore(); g.restore();
      }
    });
    put(g, P.vtab, 140, 976); put(g, P.vtab, 880, 976);
    upright(g, 0, 992, Rm, function () {
      put(g, P.mMid, 0, 0);
      PINES.forEach(function (p, i) { var y = ridgeY(MIDR, p[0]) + 22, s = p[1]; g.save(); g.translate(p[0], y); g.rotate(.035 * osc(t, 5 + (i % 3), i) + sw(t, T.flag + .1, .05, 7, 2.4) * (i % 2 ? 1 : -1)); g.scale(s, s); put(g, P.pine, 0, 0); g.restore(); });
      /* the deer pops up on "hunting" */
      var dk = pk(t, T.deer, 15); if (dk > .01) upright(g, 0, 862, dk * fz, function () { put(g, P.deer, 300, 862, 0, 2.0 * kn(t, T.deer + .05, .25)); });
    });
    put(g, P.vtab, 150, 994); put(g, P.vtab, 870, 994);
    upright(g, 0, 1012, Rf, function () {
      put(g, P.mFront, 0, 0);
      /* the cabins, paired, on "mystics" and "radicals" */
      var c1 = pk(t, T.cab1, 15) * fz, c2 = pk(t, T.cab2, 15) * fz;
      if (c1 > .01) upright(g, 0, 976, c1, function () {
        var cs1 = 1.6 * kn(t, T.cab1 + .05, .25); g.save(); g.translate(352, 976); g.scale(cs1, cs1); g.translate(-352, -976);
        put(g, P.cab1, 352, 976);
        var dsw = Math.abs(Math.cos(Math.min(1.25, 1.25 * cd(t, T.door, 18)) * (1 - seg(t, T.door + .6, T.door + 1.1))));
        g.save(); g.translate(338, 976); g.scale(dsw, 1); put(g, P.door, 0, 0); g.restore();
        var ms = .08 * osc(t, 9) + sw(t, T.door + .05, .5, 9, 2.2) + sw(t, T.cab1 + .1, .3, 8, 2.6);
        g.save(); g.translate(410, 912); g.rotate(ms); g.strokeStyle = '#e9d6bd'; g.lineWidth = 2; g.beginPath(); g.moveTo(0, 0); g.lineTo(0, 22); g.stroke(); put(g, P.moon, 0, 40); g.restore();
        /* paper smoke curls from the chimney, always rising */
        for (var k = 0; k < 3; k++) { var u = ((t - T.cab1) * .55 + k / 3) % 1; if (t < T.cab1 + k * .6) continue; g.globalAlpha = c1 * (1 - u) * .85; g.fillStyle = CREAM; g.beginPath(); g.arc(330 + 14 * Math.sin(u * 6 + k), 860 - u * 120, 9 + u * 10, 0, TAU); g.fill(); }
        g.globalAlpha = 1; g.restore();
      });
      if (c2 > .01) upright(g, 0, 978, c2, function () {
        var cs2 = 1.6 * kn(t, T.cab2 + .05, .25); g.save(); g.translate(668, 978); g.scale(cs2, cs2); g.translate(-668, -978);
        put(g, P.cab2, 668, 978); g.restore();
        put(g, P.post, 512, 940);
        NOREC = c2 < .98 || Rf < .98 || C.s < 1 || moving(C); putW(g, P.keep, 512, 944, -.05 + .02 * osc(t, 8) + sw(t, T.cab2 + .1, .1, 9, 3)); NOREC = false;
      });
      /* the dirt bike rides the trail on "off-road ... trails" */
      var bk = pk(t, T.bike, 15) * fz;
      if (bk > .01) upright(g, 0, 1004, bk, function () {
        var u = eio(seg(t, T.ride0, T.ride1)), bx, by;
        var q = u < .5 ? u * 2 : (u - .5) * 2;
        if (u < .5) { bx = lerp(lerp(730, 790, q), lerp(790, 766, q), q); by = lerp(lerp(905, 925, q), lerp(925, 960, q), q); } else { bx = lerp(lerp(766, 750, q), lerp(750, 832, q), q); by = lerp(lerp(960, 990, q), lerp(990, 1004, q), q); }
        var bs = 2.4 * kn(t, T.bike + .05, .25); g.save(); g.translate(bx - 70, by - 36); g.rotate(.18 * Math.sin(u * 9)); g.scale(bs, bs); put(g, P.bike, 0, 0); g.restore();
      });
    });
    put(g, P.vtab, 160, 1013); put(g, P.vtab, 860, 1013);
  }
  function mapProps(g, t, C) {
    var R = riseAt(t);
    /* the pull tab slides out of its slot as the pop-up stands */
    put(g, P.pull, 220 - 40 * R, 1182);
    stream(g, t);
    /* the fishing line: a rod on the bank, the fish pops out of the stream on "fishing" and hangs on the line */
    var fk = pk(t, T.fish, 13) * (1 - eio(seg(t, T.fishOut, T.fishOut + .4))) * featFold(t);
    if (fk > .01) {
      var fx = 652 + 6 * osc(t, 7), fy = 1084 - 70 * fk + 5 * osc(t, 11);
      g.save(); g.strokeStyle = KRAFT2; g.lineWidth = 7; g.lineCap = 'round'; g.beginPath(); g.moveTo(520, 1060); g.lineTo(lerp(560, 610, fk), lerp(1040, 960, fk)); g.stroke();
      g.strokeStyle = 'rgba(255,250,235,.9)'; g.lineWidth = 2; g.beginPath(); g.moveTo(lerp(560, 610, fk), lerp(1040, 960, fk)); g.quadraticCurveTo(fx - 10, 980, fx + 14, fy - 4); g.stroke(); g.restore();
      upright(g, 0, 1090, fk, function () { put(g, P.fish, fx, fy, -.9 + .25 * osc(t, 13) + sw(t, T.fish + .15, .4, 10, 3), 2.7 * kn(t, T.fish + .05, .25)); });
    }
    /* the blank tape rises beside the mountain on "never gives"; the ? tag drops on its tip */
    var tk = eio(seg(t, T.tape0, T.tape0 + .9)) * featFold(t);
    if (tk > .005) {
      var top = lerp(1050, 640, tk);
      g.save(); g.fillStyle = 'rgba(6,3,18,.35)'; g.fillRect(156, top + 8, 40, 1050 - top); g.fillStyle = HOT; g.fillRect(150, top, 40, 1050 - top);
      g.fillStyle = 'rgba(255,240,234,.55)'; g.fillRect(150, top, 3, 1050 - top); g.fillRect(187, top, 3, 1050 - top);
      g.fillStyle = '#c9ccd8'; g.fillRect(146, top - 8, 48, 12); g.restore();
      put(g, P.spool, 170, 1050, t * 2);
      if (t >= T.qtag - .02) { var qk = cd(t, T.qtag, 18), qy = lerp(300, top - 82, qk) + (1 - tk) * 0; upright(g, 0, 1050, tk, function () { NOREC = qk < .98 || tk < .98 || moving(C); putW(g, P.qtag, 170, qy, sw(t, T.qtag + .1, .12, 8, 3) + .02 * osc(t, 9)); NOREC = false; }); }
    }
    /* the frame-0 question and the end vote, pop-up panels on stilts */
    var qa = 1 - pk(t, T.tagDown, 16) + pk(t, T.tagUp, 16);
    if (t < T.tagDown) qa = 1;
    panel(g, t, C, P.tagQ, 510, 1300, clamp(qa, 0, 1), 0);
    var vk = (1 - eio(seg(t, T.fold0, T.fold0 + .45)));
    panel(g, t, C, P.voteM, 300, 1300, pk(t, T.voteM, 15) * vk, 1);
    panel(g, t, C, P.voteH, 720, 1300, pk(t, T.voteH, 15) * vk, 2);
  }
  function panel(g, t, C, Pc, x, base, k, ph) {
    if (k < .015) return;
    upright(g, x, base, k, function () {
      put(g, P.stilt, x - 120 * (Pc === P.tagQ ? 1.4 : 1), base); put(g, P.stilt, x + 120 * (Pc === P.tagQ ? 1.4 : 1), base);
      NOREC = k < .98 || moving(C); var kt = ph === 1 ? T.kM : ph === 2 ? T.kH : -9; g.save(); g.translate(x, base - 80); var ks = kn(t, kt, .1); g.scale(ks, ks); g.rotate(sw(t, kt, .06, 9, 3)); g.translate(-x, -(base - 80)); putW(g, Pc, x, base - 10, .012 * osc(t, 6, ph)); g.restore(); NOREC = false;
    });
  }
  function world(g, t, C) {
    book(g, C, .9, function () {
      put(g, P.page, 0, 0);
      put(g, P.sun, 238 + 5 * osc(t, 1), 640 + 4 * osc(t, 2));
      [[P.cloud1, 150, 590, 1, 0], [P.cloud2, 560, 760, 1, 2]].forEach(function (c) { var x = c[1] + 40 * osc(t, c[3], c[4]), y = c[2] + 6 * osc(t, 3, c[4]); g.strokeStyle = 'rgba(233,214,189,.6)'; g.lineWidth = 2; g.beginPath(); g.moveTo(x + 120, 230); g.lineTo(x + 120, y - 20); g.stroke(); put(g, c[0], x, y, .02 * osc(t, 4, c[4])); });
      ribbon(g, t);
      /* the N tab flips up with the border's snap */
      var nk = cd(t, T.ntab, 16) * (1 - eio(seg(t, T.fold0, T.fold0 + .4)));
      upright(g, 0, 650, Math.max(.08, nk), function () { NOREC = nk < .98 || moving(C); putW(g, P.ntab, 866, 606); NOREC = false; });
    });
    book(g, C, 1, function () {
      put(g, P.map, 0, 0);
      mountain(g, t, C);
      mapProps(g, t, C);
      /* the backwoods curtain slides across on "government" and away on "But" */
      var ck = eio(seg(t, T.cur0, T.cur0 + .6)), co = eio(seg(t, T.up0, T.up0 + .7));
      if (ck > 0 && co < 1) put(g, P.curtain, lerp(-1060, 0, ck) + co * -1060, 0);
      /* the binoculars poke in from the right on "prying" and retreat behind the curtain */
      var bi = eio(seg(t, T.bin0, T.bin0 + .55)) * (1 - eio(seg(t, T.binOut, T.binOut + .5)));
      if (bi > 0) put(g, P.binoc, lerp(1120, 820, bi), 838 + 6 * osc(t, 9), -.05 + .03 * Math.sin(t * 3));
      /* the magnifier sweeps the slopes on "In Rockstar's words" */
      var mg = seg(t, T.mag0, T.mag0 + 1.5);
      if (mg > 0 && mg < 1) put(g, P.mag, lerp(-160, 1180, eio(mg)), 800 - 90 * Math.sin(mg * Math.PI), -.2 + .3 * mg);
    });
  }

  /* =====================================================================================================
     OVERLAYS on the glass: the strips, chips
     ===================================================================================================== */
  function stripAt(g, t, Pc, x, y, tin, tout, o) {
    o = o || {};
    if (t < tin - .02 || t > tout + .5) return;
    var k = cd(t, tin, 15), peel = eio(seg(t, tout, tout + .45)), dir = o.dir || 1;
    /* it peels up and off inside the rail (never sideways over the edge) */
    var yy = lerp(y + (o.from || 360), y, k) - peel * 140, rot = (o.rot || -.012) + (1 - k) * .08 * dir + peel * .06 * dir, xx = x;
    var s = kn(t, tin + .12, .03) * (1 - .12 * peel);
    NOREC = k < .98 || peel > 0;
    g.save(); g.globalAlpha *= 1 - peel; g.translate(xx, yy); g.rotate(rot); g.scale(s, s);
    putW(g, Pc, -Pc.sw / 2, -Pc.sh / 2);
    tape(g, -Pc.sw / 2 + 40, -Pc.sh / 2 + 4, 90, 30, -.3); tape(g, Pc.sw / 2 - 40, -Pc.sh / 2 + 4, 90, 30, .28);
    g.restore(); NOREC = false;
  }
  function chipAt(g, t, text, x, y, tin, tout, o) {
    o = o || {}; if (t < tin - .02 || t > tout + .3) return;
    var k = cd(t, tin, 14); NOREC = k < .98 || t > tout;
    chip(g, text, x, y + (1 - k) * (o.from || 40), { px: o.px || 36, bg: o.bg || TEAL, fg: INK, a: fin(t, tin, .08) * (1 - seg(t, tout, tout + .25)), rot: o.rot || 0, s: kn(t, tin + .1, .05) });
    NOREC = false;
  }

  /* ---------- captions (the voice, phrase by phrase; the hook line is carried by the picture) ---------- */
  var GLUE = { the: 1, a: 1, an: 1, your: 1, its: 1, of: 1, at: 1, to: 1, and: 1, in: 1, with: 1, on: 1, by: 1, so: 1, for: 1, own: 1, how: 1, that: 1, if: 1, you: 1 };
  var CAPS = (function () {
    var outc = [];
    VO.lines.forEach(function (l) {
      if (l.id === 'hook') return;
      var cur = [], ws = l.words.slice();
      ws.forEach(function (w, i) { cur.push(w); if (/[.?!:]$/.test(w.w) && i < ws.length - 1) { outc.push(cur); cur = []; } });
      if (cur.length) outc.push(cur);
    });
    /* long cards split in two: at a comma, else nearest the middle, never after a glue word */
    var o2 = [];
    outc.forEach(function (ws) {
      if (ws.length <= 6) { o2.push(ws); return; }
      var cut = -1;
      for (var i = 1; i < ws.length - 2; i++) if (/,$/.test(ws[i].w)) { cut = i; break; }
      if (cut < 0) { var best = 1e9; for (i = 2; i < ws.length - 2; i++) { if (GLUE[norm(ws[i].w)]) continue; var d = Math.abs(i + 1 - ws.length / 2); if (d < best) { best = d; cut = i; } } }
      if (cut < 0) { o2.push(ws); return; }
      o2.push(ws.slice(0, cut + 1)); o2.push(ws.slice(cut + 1));
    });
    return o2.map(function (ws) { return { t0: ws[0].t0, t1: ws[ws.length - 1].t1, words: ws }; });
  })();
  var STRESS;
  function stressed(w) { for (var i = 0; i < STRESS.length; i++) if (Math.abs(STRESS[i] - w.t0) < .02) return true; return false; }
  var CAPY = 470;
  function strWords(Pc) { var o = {}; Pc.lines.join(' ').split(/\s+/).forEach(function (w) { o[norm(w)] = 1; }); return o; }
  var SW = null;
  function onStrip(card, t) {
    if (!SW) SW = [[P.s1, T.s1In, T.s1Out], [P.s3, T.s3In, T.s3Out]].map(function (q) { return { w: strWords(q[0]), a: q[1], b: q[2] }; });
    for (var i = 0; i < SW.length; i++) { var S = SW[i]; if (t < S.a - .45 || t > S.b) continue; var miss = card.words.filter(function (w) { return !S.w[norm(w.w)]; }).length; if (miss === 0 || (miss === 1 && card.words.length >= 3 && !S.w[norm(card.words[0].w)])) return true; }
    return false;
  }
  function captions(g, t) {
    var card0 = null, ci = -1;
    CAPS.forEach(function (c, i) { if (t >= c.t0 - .04) { card0 = c; ci = i; } });
    if (!card0) return;
    var nx = CAPS[ci + 1], ns = nx ? nx.t0 - .04 : 1e9, o1 = Math.min(card0.t1 + .5, ns - .12), o0 = Math.min(card0.t1 + .35, o1 - .12);
    var fi = seg(t, card0.t0 - .04, card0.t0 + .06), outk = 1 - seg(t, o0, o1);
    if (fi * outk <= 0) return;
    /* the same words never show twice: a card whose words are all on a readable quote strip stays off */
    if (onStrip(card0, t)) return;
    var CY = CAPY;
    var k = cd(t, card0.t0 - .04, 16);
    /* paper-label captions: the film's condensed face in ink, on torn cream tape, one strip per line */
    g.save(); cond(g); var cpx = 74; font(g, cpx, 900); ls(g, 1); g.textBaseline = 'alphabetic';
    var words = card0.words, up = words.map(function (w) { return w.w.toUpperCase(); }), ws = up.map(function (u) { return g.measureText(u).width; }), gap = cpx * .26;
    var lines, lw, maxw = 720;
    function lay2() { lines = [[]]; lw = [0]; words.forEach(function (w, i) { var Ln = lines.length - 1; if (lw[Ln] + ws[i] > maxw && lines[Ln].length) { lines.push([]); lw.push(0); Ln++; } lines[Ln].push(i); lw[Ln] += ws[i] + gap; }); }
    function fixLines() {
      for (var Ln = 0; Ln < lines.length - 1; Ln++) { var last = lines[Ln][lines[Ln].length - 1]; while (lines[Ln].length > 1 && GLUE[norm(words[last].w)]) { lines[Ln].pop(); lines[Ln + 1].unshift(last); last = lines[Ln][lines[Ln].length - 1]; } }
      var n = lines.length; if (n > 1 && lines[n - 1].length === 1 && lines[n - 2].length > 2) lines[n - 1].unshift(lines[n - 2].pop());
      lw = lines.map(function (ln) { var w = 0; ln.forEach(function (i) { w += ws[i] + gap; }); return w; });
    }
    lay2(); fixLines();
    function widest() { return Math.max.apply(null, lw) - gap; }
    while ((lines.length > 2 || widest() > maxw || (lines.length > 1 && (lines[lines.length - 1].length < 2 || lines[0].length < 2))) && cpx > 56) { cpx -= 4; font(g, cpx, 900); ws = up.map(function (u) { return g.measureText(u).width; }); gap = cpx * .26; lay2(); fixLines(); }
    var lh = cpx * 1.32, y0 = CY - (lines.length - 1) * lh / 2 + cpx * .36;
    g.globalAlpha = fi * outk;
    lines.forEach(function (ln, li) {
      var tw = lw[li] - gap, x = CX - tw / 2, y = y0 + li * lh + (1 - k) * 30, seed = Math.round(card0.t0 * 100) + li * 7;
      var r = mulberry(seed), x0 = x - 22, x1 = x + tw + 22, yt = y - cpx * .86, yb = y + cpx * .24, rot = (r() - .5) * .025;
      g.save(); g.translate(CX, y); g.rotate(rot); g.translate(-CX, -y);
      g.beginPath(); g.moveTo(x0, yt); for (var xx = x0; xx < x1; xx += 9) g.lineTo(xx, yt + (r() - .5) * 4); g.lineTo(x1, yt); g.lineTo(x1 + (r() - .5) * 6, (yt + yb) / 2); g.lineTo(x1, yb); for (xx = x1; xx > x0; xx -= 9) g.lineTo(xx, yb + (r() - .5) * 4); g.lineTo(x0, yb); g.lineTo(x0 + (r() - .5) * 6, (yt + yb) / 2); g.closePath();
      g.save(); g.shadowColor = 'rgba(6,3,18,.55)'; g.shadowBlur = 12; g.shadowOffsetX = 4; g.shadowOffsetY = 8; g.fillStyle = NEWS; g.fill(); g.restore();
      g.save(); g.clip(); g.globalAlpha *= .6; g.fillStyle = g.createPattern(GRAIN, 'repeat'); g.fillRect(x0, yt - 4, x1 - x0, yb - yt + 8); g.restore();
      ln.forEach(function (i) {
        var w = words[i], nw = words[i + 1], cur = stressed(w) && t >= w.t0 - .03 && t < Math.min(w.t1 + .05, nw ? nw.t0 - .03 : 1e9) + .15;
        if (cur) { g.fillStyle = HOT; g.fillRect(x - 6, y + cpx * .06, ws[i] + 12, cpx * .12); }
        g.fillStyle = cur ? HOT : INK; g.fillText(up[i], x, y); x += ws[i] + gap;
      });
      g.restore();
    });
    g.restore(); unst(g); ls(g, 0);
  }


  var SRC = 'ROCKSTARGAMES.COM/VI · ONLY IN LEONIDA · KALAGA';
  /* ---------- the picture ---------- */
  var NOISE, HOME, POSTERMODE = false, VIG = null;
  function stage(g) { g.fillStyle = BG; g.fillRect(0, 0, W, H); }
  function vignette(g) {
    if (!VIG) { VIG = mk(W, H); var q = VIG.getContext('2d'), gr = q.createRadialGradient(510, 865, 420, 510, 865, 1150); gr.addColorStop(0, 'rgba(6,3,18,0)'); gr.addColorStop(1, 'rgba(6,3,18,.42)'); q.fillStyle = gr; q.fillRect(0, 0, VIG.width, VIG.height); }
    g.drawImage(VIG, 0, 0);
  }
  function frame(g, t) {
    g.setTransform(1, 0, 0, 1, 0, 0);
    stage(g);
    var C = cam(t);
    /* the bench grain bleeds to the full frame (texture only: no shape or text outside the rail) */
    if (LIVE2.bg) { lay(g, C, 1, function () { put(g, P.bench, 0, 0); }); vignette(g); }
    g.save(); if (LIVE2.clip) { g.beginPath(); g.rect(BX0, BY0, BX1 - BX0, BY1 - BY0); g.clip(); }
    world(g, t, C);
    /* the GTA 6 sticker on the glass, top centre; it knocks on "GTA" */
    putW(g, P.pill, CX, 345, -.02, kn(t, at('hook', 'gta'), .08));
    /* the glass: Rockstar's words on torn strips (one place: Mount Kalaga), their source, our chips */
    stripAt(g, t, P.s1, CX, 1398 - P.s1.sh / 2, T.s1In, T.s1Out, { rot: -.01 });
    stripAt(g, t, P.s3, CX, 1398 - P.s3.sh / 2, T.s3In, T.s3Out, { rot: .008, dir: -1 });
    chipAt(g, t, SRC, CX, 1398 - P.s1.sh - 34, T.srcIn, T.s1Out, { rot: -.01 });
    chipAt(g, t, SRC, CX, 1398 - P.s3.sh - 34, T.s3In + .35, T.s3Out, { rot: .01 });
    chipAt(g, t, 'IN ROCKSTAR’S WORDS', CX, 470, T.inw, T.inwOut, { px: 50, bg: CREAM, rot: -.015, from: -40 });
    chipAt(g, t, 'ROCKSTAR’S SITE: NO HEIGHT GIVEN', 560, 1062, T.hchip, T.hchipOut, { px: 44, bg: CREAM, rot: .015 });
    chipAt(g, t, 'GTA 6 · NOV 19, 2026 · PS5 · XBOX SERIES X|S', CX, 1396, T.dateIn, T.reopen - .3, { bg: CREAM });
    g.restore();
    if (!POSTERMODE && LIVE.text) captions(g, t);
    if (LIVE.grain && NOISE && LIVE2.bg) { g.globalAlpha = .05; g.globalCompositeOperation = 'overlay'; var o = Math.floor(t * 24) * 37 % 256; g.fillStyle = g.createPattern(NOISE, 'repeat'); g.translate(-o, -o); g.fillRect(o, o, W, H); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }
  }
  function TEXTS(t) {
    var o = [];
    function Tx(id, text, a, b) { if (t >= a && t < b) o.push({ id: id, text: text, x0: 0, y0: 0, x1: 0, y1: 0 }); }
    Tx('pill', 'GTA 6', 0, DUR + 1);
    Tx('tagQ', 'MOUNTAIN?', 0, T.tagDown + .05); Tx('tagQ', 'MOUNTAIN?', T.tagUp + .2, DUR + 1);
    Tx('flag', 'MOUNT KALAGA', T.flag + .2, T.fold0);
    Tx('s1', P.s1.lines.join(' '), T.s1In + .15, T.s1Out + .05);
    Tx('s3', P.s3.lines.join(' '), T.s3In + .15, T.s3Out + .05);
    Tx('src', SRC, T.srcIn + .15, T.s1Out + .05); Tx('src', SRC, T.s3In + .5, T.s3Out + .05);
    Tx('inw', 'IN ROCKSTAR’S WORDS', T.inw + .15, T.inwOut + .05);
    Tx('ntab', 'N', T.ntab + .15, T.fold0);
    Tx('keep', 'KEEP OUT', T.cab2 + .2, T.cur0 + .3);
    Tx('hchip', 'ROCKSTAR’S SITE: NO HEIGHT GIVEN', T.hchip + .15, T.hchipOut + .05);
    Tx('qtag', '?', T.qtag + .15, T.fold0);
    Tx('voteM', 'MOUNTAIN', T.voteM + .2, T.fold0);
    Tx('voteH', 'HILL', T.voteH + .2, T.fold0);
    Tx('date', 'GTA 6 · NOV 19, 2026 · PS5 · XBOX SERIES X|S', T.dateIn + .15, T.reopen - .25);
    return o;
  }
  /* how long a text must stay up (render.mjs readcheck: letters / 15 + 1.5 s, at least 1.8 s), plus the fade margins */
  function need(text) { return Math.max(1.8, text.replace(/\s/g, '').length / 15 + 1.5) + .25; }

  /* ---------- events: hits placed in real pauses of the voice (vo/vad.js); beats with no free pause stay silent ---------- */
  function initTimes() {
    HOME = DUR - .2;
    T.reopen = DUR - .5;
    /* hook: frame 0 is the page half up and rising, a soft fold creak at 0.0 under nothing; the pop-up snaps up on the
       onset of "mountain" with a quiet pop under the word (the only mid-phrase hit) */
    EV.push({ t: 0, type: 'creak', g: .55, id: 'creak0' });
    T.pop = at('hook', 'mountain');
    EV.push({ t: T.pop, type: 'pop', g: .7, id: 'pop' });
    /* name: the flag stabs in as "Kalaga" ends (thock in the gap) */
    T.flag = at('name', 'kalaga') - .05;
    T.seat = G('stab', after('name'), 'stab', .2, 1);
    /* ask: the question panel folds away on "So"; IN ROCKSTAR'S WORDS and the magnifier sweep while the line asks */
    T.tagDown = start('ask') - .25;
    T.slB0 = at('ask', 'out') - .1;
    T.creep0 = start('ask');
    T.mag0 = T.slB0 + .2;
    T.inw = T.slB0 + .3; T.inwOut = T.inw + need('IN ROCKSTAR’S WORDS');
    /* landmark: the first strip slaps on as "words:" ends; the border pulls tight on "northern", snaps and the N tab flips in the pause */
    T.s1In = T.slB0 + .3;
    T.srcIn = T.s1In + .45;
    T.lmk = at('landmark', 'landmark');
    T.border0 = at('landmark', 'up'); T.border1 = wend('landmark', 'border');
    T.snapT = G('snap', after('landmark'), 'snap', .35, 1);
    T.ntab = T.snapT - .04;
    T.push0 = start('landmark'); T.push1 = lastw('trails');
    T.s1Out = T.s1In + need(P.s1.lines.join(' '));
    /* trails: deer on "hunting", fish on "fishing", the bike rides on "off-road ... trails" */
    T.deer = at('trails', 'hunting'); T.fish = at('trails', 'fishing'); T.bike = at('trails', 'offroad') - .05;
    T.ride0 = T.bike + .2; T.ride1 = wend('trails', 'trails') + .3;
    G('pop2', after('trails'), 'pop', .35, .8);
    /* backwoods: the dip into the pines after "backwoods?"; the cabins pop up paired; door slap + chime in the pause */
    T.dip0 = wend('backwoods', 'backwoods') + .05;
    T.cab1 = at('backwoods', 'mystics'); T.cab2 = at('backwoods', 'radicals');
    T.s3In = Math.max(T.s1Out + .25, at('backwoods', 'hillbilly') - .15);
    T.fishOut = T.s3In - .3;
    T.door = G('door', after('backwoods'), 'door', .3, 1);
    G('chime', T.door + .2, 'chime', .3, .9);
    /* eyes: the binoculars poke in on "prying"; the curtain of pines slides across on "government"; swish + click in the pause */
    T.bin0 = at('eyes', 'prying') - .1;
    T.cur0 = at('eyes', 'government') - .05;
    T.binOut = T.cur0 + .25;
    T.ey0 = T.cab2 + .3; T.ey1 = lastw('eyes');
    var cs = G('curtain', after('eyes'), 'swish', .3, 1);
    G('bclick', cs + .3, 'click', .25, 1);
    T.s3Out = T.s3In + need(P.s3.lines.join(' '));
    /* height: back out of the pines just before "But"; the blank tape rises on "never"; the ? tag lands as the line ends */
    T.up0 = start('height') - .7;
    T.tape0 = at('height', 'never') - .05;
    T.hchip = at('height', 'gives');
    /* the hero hit: the ? stamps onto the blank tape in the written pause after "height." (poster frame) */
    T.qtag = G('qdrop', after('height'), 'stamp', .35, .8, { heavy: true });
    /* end: the two vote panels pop up together just before "So,", styled the same; the mountain stands on "mountain",
       sinks on "hill", springs back on "One"; everything folds flat after "word." and the book re-opens into frame 0 */
    T.voteM = T.voteH = G('vote', start('end') - .2, 'pop', .3, .9);
    T.kM = at('end', 'mountain'); T.kH = at('end', 'hill'); T.kOne = at('end', 'one');
    T.fold0 = Math.max(T.kOne + .3, T.reopen - .4);
    T.hchipOut = Math.max(T.hchip + need('ROCKSTAR’S SITE: NO HEIGHT GIVEN'), T.voteM - .1);
    T.dateIn = Math.max(T.s3Out + .45, T.hchip + .2);
    T.tagUp = T.reopen;
    G('reopen', T.reopen + .05, 'creak', .2, .45);
    /* two pink highlights in the whole film, no more: the name and the missing height */
    STRESS = [['name', 'kalaga'], ['height', 'height']].map(function (p) { return at(p[0], p[1]); });
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

  /* ---------- sound: paper foley, written into the pauses; no music (Isac adds a TikTok sound) ---------- */
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
    function osc2(type, f, t0, t1, pts, pan) { var o = ac.createOscillator(), og = ac.createGain(); o.type = type; o.frequency.setValueAtTime(f, Math.max(0, t0)); o.connect(og); og.connect(bus(1, pan)); env(og.gain, pts); o.start(Math.max(0, t0)); o.stop(Math.max(0, t1)); return o; }
    function band(t0, t1, f0, f1, g0, g1, q, pan, type) { var o = bus(1, pan), bp = ac.createBiquadFilter(); bp.type = type || 'bandpass'; bp.Q.value = q || .7; var n = noise(t0, t1 - t0 + .1); n.connect(bp); bp.connect(o); env(bp.frequency, [[t0, f0], [t1, f1]]); env(o.gain, [[t0, 0], [t0 + (t1 - t0) * .4, g0], [t1 - .02, g1], [t1, 0]]); }
    function tick(t, g, f) { var n = noise(t, .03), bp = ac.createBiquadFilter(); bp.type = 'highpass'; bp.frequency.value = f || 3200; var o = bus(1, (rnd() - .5) * .3); n.connect(bp); bp.connect(o); env(o.gain, [[t, 0], [t + .003, .16 * (g || 1)], [t + .024, 0]]); }
    function thump(t, g, f) { var o = osc2('sine', f || 150, t, t + .2, [[t, 0], [t + .004, g || .4], [t + .14, 0]]); o.frequency.exponentialRampToValueAtTime(50, t + .12); }
    function boom(t, g, f0, f1, dur) { var o = osc2('sine', f0, t, t + dur + .05, [[t, 0], [t + .006, g], [t + dur * .35, g * .55], [t + dur, 0]]); o.frequency.exponentialRampToValueAtTime(f1, t + dur * .8); }
    function stamp(t, g, heavy) { thump(t, .7 * g); if (heavy) boom(t + .01, .55 * g, 110, 42, .25); var sn = noise(t, .12), sl = ac.createBiquadFilter(); sl.type = 'lowpass'; sl.frequency.value = 1500; var so = bus(1); sn.connect(sl); sl.connect(so); env(so.gain, [[t, 0], [t + .004, .32 * g], [t + .1, 0]]); }
    /* a cardstock fold creaking open: a slowing train of fibre ticks over a soft band */
    function creak(t, g) { for (var j = 0; j < 14; j++) tick(t + .012 * j + .0009 * j * j, (.25 + rnd() * .3) * g, 1800 + rnd() * 1200); band(t, t + .22, 900, 1600, .035 * g, .01 * g, 2); }
    /* a pop-up page snapping up: a paper pop and a low card thud */
    function pop(t, g) { band(t, t + .07, 3000, 1800, .1 * g, .02 * g, 1.2); tick(t + .01, .8 * g, 2400); thump(t + .02, .3 * g, 190); }
    function stab(t, g) { tick(t, 1 * g, 1500); thump(t, .32 * g, 260); band(t, t + .05, 2200, 1200, .06 * g, 0, 1.4); }
    function slap(t, g) { band(t, t + .1, 1800, 900, .14 * g, .02 * g, .9); thump(t + .005, .26 * g, 140); for (var j = 0; j < 4; j++) tick(t + .03 + j * .025, (.2 + rnd() * .2) * g); }
    function snap(t, g) { tick(t, 1.2 * g, 2000); osc2('triangle', 330, t, t + .16, [[t, 0], [t + .004, .07 * g], [t + .14, 0]]).frequency.exponentialRampToValueAtTime(240, t + .12); thump(t, .12 * g, 300); }
    function door(t, g) { thump(t, .5 * g, 120); band(t, t + .09, 900, 400, .12 * g, .02 * g, .8, -.2, 'lowpass'); tick(t + .005, .6 * g, 1200); }
    function chime(t, g) { [1568, 2093, 2637].forEach(function (f, j) { var t0 = t + j * .06; osc2('sine', f, t0, t0 + .42, [[t0, 0], [t0 + .004, .05 * g], [t0 + .4, 0]], .3); }); }
    function swish(t, g) { band(t, t + .26, 600, 3600, .09 * g, .02 * g, 1.3, -.2); }
    function click(t, g) { tick(t, 1.1 * g); osc2('sine', 2900, t, t + .07, [[t, 0], [t + .002, .06 * g], [t + .05, 0]]); thump(t, .06 * g, 500); }
    function fold(t, g) { band(t, t + .3, 3200, 900, .08 * g, .02 * g, 1); thump(t + .22, .25 * g, 120); }
    var LEVEL = { creak: 1.4, pop: 1.2, stab: 1.3, stamp: .5, swish: 1.6, slap: 1.4, snap: 1.6, door: 1.2, chime: 1.4, click: 1.6, tick: 1.6, fold: 1.4 };
    /* per-hit trims from the final-mix measurement: each hit 3 dB or more under its neighbouring words */
    var TRIM = window.SFX_TRIM || { pop: 6, curtain: 16, reopen: 15, chime: 9, snap: 4, stab: 4, bclick: 4, qdrop: 3, pop2: 2 };
    EV.forEach(function (e) {
      var g = (e.g == null ? 1 : e.g) * (LEVEL[e.type] || 1) * Math.pow(10, (TRIM[e.id] || 0) / 20);
      if (e.type === 'creak') creak(e.t, g);
      else if (e.type === 'pop') pop(e.t, g);
      else if (e.type === 'stab') stab(e.t, g);
      else if (e.type === 'stamp') stamp(e.t, g, e.heavy);
      else if (e.type === 'swish') swish(e.t, g);
      else if (e.type === 'slap') slap(e.t, g);
      else if (e.type === 'snap') snap(e.t, g);
      else if (e.type === 'door') door(e.t, g);
      else if (e.type === 'chime') chime(e.t, g);
      else if (e.type === 'click') click(e.t, g);
      else if (e.type === 'tick') { tick(e.t, 1.2 * g, 2200); thump(e.t, .12 * g, 400); }
      else if (e.type === 'fold') fold(e.t, g);
    });
    /* no music: Isac adds a trending sound on the platform; the film ships voice + sound effects */
    var MUSIC = false;
    if (MUSIC) { /* intentionally empty */ }
    /* room tone: a quiet room, so the loop seam is never digital zero */
    (function () { var o = bus(1), lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 600; lp.Q.value = .5;
      var n = noise(0, DUR); n.connect(lp); lp.connect(o); o.gain.value = window.ROOM_GAIN || .03; })();
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
    var fonts = ['900 84px Archivo', '800 84px Archivo', '700 46px Archivo', '800 58px "Geist Mono"'];
    return Promise.all(fonts.map(function (f) { return document.fonts.load(f, 'Aa0%°×−≈≠µ“”’·→…#?‹|~$+—'); })).then(function () { return document.fonts.ready; }).then(function () {
      buildTextures();
      window.READY = true;
    });
  }

  var POSTER_T = 0;
  window.FILM = { bare: function () { ctx.setTransform(1, 0, 0, 1, 0, 0); stage(ctx); }, W: W, H: H, DUR: DUR, POSTER: 0, SLUG: 'gta-kalaga', SHOTS: [], init: init, render: render, frame: frame, LIVE: LIVE, LIVE2: LIVE2, T: T, GT: GT };
  /* strip lengths are known only once the fonts load; the times that depend on them are set then */
  var _bt = buildTextures; buildTextures = function () { _bt(); EV.length = 0; initTimes(); POSTER_T = Math.round(Math.min(T.qtag + .4, T.voteM - .05) * 30) / 30 + 1 / 60; window.FILM.POSTER = POSTER_T;
    window.FILM.SHOTS = [{ id: 'mountain', name: 'Mount Kalaga', t0: 0, t1: T.slB0 + .4 }, { id: 'words', name: 'In Rockstar’s words', t0: T.slB0 + .4, t1: T.up0 }, { id: 'vote', name: 'Mountain or hill?', t0: T.up0, t1: DUR }]; };
  window.BOUNDS_RUN = function (step) {
    BOUNDS = []; var o = {};
    for (var t = 0; t <= DUR + 1e-6; t += step || 1 / 15) { CURT = t; POSTERMODE = false; frame(ctx, t); }
    BOUNDS.forEach(function (b) { var r = o[b.text] || (o[b.text] = { text: b.text, from: b.t, to: b.t, x0: b.x0, x1: b.x1, y1: b.y1, n: 0 }); r.to = b.t; r.n++; r.x0 = Math.min(r.x0, b.x0); r.x1 = Math.max(r.x1, b.x1); r.y1 = Math.max(r.y1, b.y1); });
    BOUNDS = null; return Object.keys(o).map(function (k) { return o[k]; });
  };
  /* rail scan: every shape and glyph, with the bench bleed off and no safety clip, must stay inside x 90-930 and above
     y 1450. Scans each rendered frame's sub-samples; returns the bad ones. */
  window.RAIL_SCAN = function (fps, subs, from, to) {
    fps = fps || 30; subs = subs || 3; var bad = [], n = Math.round(DUR * fps), span = .5 / fps;
    LIVE2.bg = false; LIVE2.clip = false; var lg = LIVE.grain; LIVE.grain = false;
    function dirty(x, y, w, h) { var d = ctx.getImageData(x, y, w, h).data, o = { c: 0, x0: 1e9, x1: -1, y0: 1e9, y1: -1 }; for (var i = 0; i < d.length; i += 4) if (Math.abs(d[i] - 0x0b) + Math.abs(d[i + 1] - 0x08) + Math.abs(d[i + 2] - 0x20) > 24) { var px = (i / 4) % w, py = Math.floor(i / 4 / w); o.c++; o.x0 = Math.min(o.x0, px); o.x1 = Math.max(o.x1, px); o.y0 = Math.min(o.y0, y + py); o.y1 = Math.max(o.y1, y + py); } return o; }
    for (var i = (from || 0); i < Math.min(n, to || n); i++) for (var s = 0; s < subs; s++) {
      var t = (i + .5) / fps - span / 2 + span * (s + .5) / subs; frame(ctx, clamp(t, 0, DUR));
      var L0 = dirty(0, 0, 90, H), R0 = dirty(930, 0, 150, H), B0 = dirty(90, 1450, 840, H - 1450);
      if (L0.c + R0.c + B0.c > 0) { bad.push({ f: i, t: +t.toFixed(3), left: L0.c && [L0.c, L0.x1, L0.y0, L0.y1], right: R0.c && [R0.c, R0.x0 + 930, R0.y0, R0.y1], bottom: B0.c && [B0.c, B0.y0, B0.x0 + 90, B0.x1 + 90] }); break; }
    }
    LIVE2.bg = true; LIVE2.clip = true; LIVE.grain = lg; return bad;
  };
  window.DUR = DUR; window.EV = EV; window.TEXTS = TEXTS; window.SCORE = SCORE; window.READY = false;
  window.render = function (t, s, sh, fps) { render(t, s, sh, fps); };
})();
