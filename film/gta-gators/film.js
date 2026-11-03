/* "Don't swim": GTA 6, Delta #14. A vertical film written in code, narrated first and cut to the voice:
   every visual beat is keyed to a word time from vo/vo.js (window.VO) with at(id, word). Pure function of t.
   Contract: window.FILM, DUR, render(t), READY, EV, TEXTS(t), SCORE(ctx).
   Hero prop: ONE hand-built cut-paper swamp diorama in a cardboard box (paper grain, cut edges, split pins, a glue tab,
   a vellum water line). A paper gator glides on the water; a dark soft shape twice its size drifts under it and never
   resolves. Rockstar's own Grassrivers sentence lands on a torn newsprint strip; the one hero stamp NOT THE DEADLIEST
   thumps on beside the gator. The camera pushes in, dips through the vellum ("beneath"), slides along the box's paper
   track to a second panel (the Leonida Keys), slides back, and pulls out of the box onto the workbench, where the one
   labeled guess (THEORY · OUR GUESS, real-world NPS card) sits outside the game box. Then it returns to frame 0.
   Own flat shapes in a Vice City palette. No Rockstar footage, logo, key art or character likeness, no music. */
(function () {
  'use strict';
  var W = 1080, H = 1920, VO = window.VO, DUR = VO.dur, CX = 510;
  var BG = '#0b0820', CREAM = '#fbf0ea';
  var HOT = '#ff4fa3', TEAL = '#19d3c5', ORG = '#ff8a3d';
  var INK = '#1d1233', PAPER = '#f2e5cd', NEWS = '#efe5cf', KRAFT = '#b8834b', KRAFT2 = '#8a5a2e', BENCH = '#1c1042';
  var GR1 = '#6c9e3c', GR2 = '#46712a', GRB = '#b4cf86';
  var DISP = 'Archivo';
  /* the box: everything in the picture lives inside it, so no push, dip or dolly can cross the x 90-930 / y 1450 rail */
  var BX0 = 90, BX1 = 930, BY0 = 300, BY1 = 1430, WL = 900, FX = 510, FY = 900, TAU = Math.PI * 2;

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
  var BODY = { drip: .07, stamp: .27, paper: .2, peel: .24, swell: .5, whoosh: .28, splash: .34, click: .08, swish: .26, rustle: .2 };
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

  function buildTextures() {
    GRAIN = buildGrain();
    /* ---- the swamp panel ---- */
    P.sky = piece([30, 240, 990, 1120], rect(30, 240, 990, 1120), function (g) { var gr = g.createLinearGradient(0, 300, 0, 930); gr.addColorStop(0, '#1d0e44'); gr.addColorStop(.42, '#7c2470'); gr.addColorStop(.7, '#e8508f'); gr.addColorStop(.9, '#ff8a3d'); gr.addColorStop(1, '#ffa45a'); return gr; }, { shadow: false, edge: false, grain: .8, ps: 1 });
    P.cloud1 = piece([0, -40, 520, 30], function (g) { g.beginPath(); g.moveTo(0, 20); g.quadraticCurveTo(60, -30, 140, 0); g.quadraticCurveTo(210, -46, 300, -6); g.quadraticCurveTo(380, -40, 440, 2); g.quadraticCurveTo(500, -18, 520, 20); g.closePath(); }, '#ff9cc9', { sy: 6, blur: 8 });
    P.cloud2 = piece([0, -30, 420, 24], function (g) { g.beginPath(); g.moveTo(0, 18); g.quadraticCurveTo(70, -36, 160, -2); g.quadraticCurveTo(250, -30, 330, 0); g.quadraticCurveTo(400, -12, 420, 18); g.closePath(); }, '#ffc08f', { sy: 6, blur: 8 });
    P.sun = piece([-130, -130, 130, 130], function (g) { g.beginPath(); g.arc(0, 0, 124, 0, TAU); }, function (g) { var gr = g.createLinearGradient(0, -124, 0, 124); gr.addColorStop(0, '#ffd27e'); gr.addColorStop(1, '#ff8a3d'); return gr; }, { sy: 5, blur: 10 });
    P.farB = piece([30, 640, 990, 1060], bumps(30, 990, 790, 14, 34, 3, 1060), '#22b8ae', { sy: 6, blur: 10 });
    P.farF = piece([30, 690, 990, 1060], bumps(30, 990, 846, 12, 30, 8, 1060), '#0d7f80', { sy: 7, blur: 12 });
    P.murk = piece([0, WL - 20, 1020, 2280], rect(0, WL - 20, 1020, 2280), function (g) { var gr = g.createLinearGradient(0, WL, 0, 2280); gr.addColorStop(0, '#1fb3b0'); gr.addColorStop(.22, '#118490'); gr.addColorStop(.55, '#0a5468'); gr.addColorStop(1, '#062a3c'); return gr; }, { shadow: false, edge: false, grain: .7, ps: 1 });
    P.mud = piece([0, 1960, 1020, 2300], bumps(0, 1020, 2010, 10, 40, 21, 2300), '#2b1f3a', { sy: -6, blur: 14 });
    var reedR = mulberry(55);
    P.reeds = piece([0, 1700, 1020, 2060], function (g) { g.beginPath(); for (var i = 0; i < 16; i++) { var x = 30 + i * 62 + reedR() * 30, h = 120 + reedR() * 200; g.moveTo(x - 6, 2040); g.quadraticCurveTo(x + 10, 2040 - h * .6, x + 4, 2040 - h); g.quadraticCurveTo(x + 14, 2040 - h * .5, x + 8, 2040); g.closePath(); } }, '#3f6f45', { sy: 4, blur: 6 });
    /* blurred shapes under the water: abstract on purpose, never a fin, a coil or a face */
    P.sh1 = piece([-560, -150, 560, 150], blobPath(470, 100, 5), 'rgba(2,22,34,.9)', { shadow: false, edge: false, grain: 0, filter: 'blur(12px)', pad: 50, ps: 1 });
    /* the one that crosses the lens at the bottom of the dip: never resolves, fills most of the frame */
    P.lens = piece([-640, -440, 640, 440], blobPath(560, 360, 29), 'rgba(0,34,44,.95)', { shadow: false, edge: false, grain: 0, filter: 'blur(30px)', pad: 90, ps: .5 });
    P.sh2 = piece([-150, -70, 150, 70], blobPath(130, 52, 9), 'rgba(4,8,26,.85)', { shadow: false, edge: false, grain: 0, filter: 'blur(8px)', pad: 40 });
    P.sh3 = piece([-560, -200, 560, 200], blobPath(520, 170, 13), 'rgba(3,6,22,.9)', { shadow: false, edge: false, grain: 0, filter: 'blur(20px)', pad: 60, ps: 1 });
    P.sh4 = piece([-330, -140, 330, 140], blobPath(300, 118, 17), 'rgba(3,6,22,.86)', { shadow: false, edge: false, grain: 0, filter: 'blur(16px)', pad: 60, ps: 1 });
    P.mid = buildMid();
    P.vel1 = piece([0, WL - 20, 1020, 2280], function (g) { g.beginPath(); g.moveTo(0, 2280); for (var x = 0; x <= 1020; x += 10) g.lineTo(x, WL - 4 + 5 * Math.sin(x * .021) + 3 * Math.sin(x * .057 + 1)); g.lineTo(1020, 2280); g.closePath(); }, 'rgba(150,240,228,.22)', { shadow: false, edgeCol: 'rgba(255,255,255,.85)', edge: 3, grain: .45, ps: 1 });
    P.vel2 = piece([0, WL - 10, 1020, 2280], function (g) { g.beginPath(); g.moveTo(0, 2280); for (var x = 0; x <= 1020; x += 10) g.lineTo(x, WL + 16 + 6 * Math.sin(x * .016 + 2) + 3 * Math.sin(x * .049)); g.lineTo(1020, 2280); g.closePath(); }, 'rgba(185,250,240,.14)', { shadow: false, edgeCol: 'rgba(255,255,255,.7)', edge: 2.4, grain: .35, ps: 1 });
    buildGator();
    /* the hand-lettered DON'T SWIM sign on a stick */
    P.stick = piece([-10, 80, 10, 560], rect(-9, 80, 9, 560), KRAFT2, { sx: 4, sy: 6, blur: 6 });
    P.sign = piece([-140, -118, 140, 118], function (g) { g.beginPath(); g.moveTo(-136, -110); g.lineTo(132, -116); g.lineTo(138, 112); g.lineTo(-140, 116); g.closePath(); }, PAPER, { sy: 10, blur: 14, extra: function (g) {
      inkText(g, 'DON’T', -4, -50, 104, INK, 31, { dense: 40, big: 1.8, rot: -.02 });
      inkText(g, 'SWIM', 2, 52, 116, INK, 32, { dense: 40, big: 1.8, rot: .015 });
      g.strokeStyle = HOT; g.lineWidth = 9; g.lineCap = 'round'; g.globalAlpha = .9; g.beginPath(); g.moveTo(-96, 104); g.quadraticCurveTo(0, 92, 98, 100); g.stroke(); g.globalAlpha = 1;
      g.fillStyle = '#6b5a4a'; [[-118, -92], [114, -98], [-120, 96], [118, 94]].forEach(function (p) { g.beginPath(); g.arc(p[0], p[1], 5, 0, TAU); g.fill(); });
    } });
    P.sign.words = [[P.sign.w / 2 - 116, P.sign.h / 2 - 108, P.sign.w / 2 + 116, P.sign.h / 2 + 108, 'DON’T SWIM']];
    /* the GTA 6 label on the box rim (and the date sticker for the end) */
    P.label = labelPiece('GTA 6 GATORS', 54, HOT, 3);
    P.date = labelPiece('NOV 19, 2026', 40, INK, 5);
    /* GRASSRIVERS tag on a string */
    P.tagGR = tagPiece('GRASSRIVERS', 58, TEAL, 11);
    P.tagKeys = tagPiece('LEONIDA KEYS', 54, HOT, 12);
    P.qtag = piece([-56, -70, 56, 70], function (g) { g.beginPath(); g.moveTo(-40, -70); g.lineTo(40, -70); g.lineTo(56, -54); g.lineTo(56, 66); g.lineTo(-56, 66); g.lineTo(-56, -54); g.closePath(); }, PAPER, { sy: 7, blur: 10, extra: function (g) {
      inkText(g, '?', 0, 8, 120, HOT, 41, { dense: 40, big: 1.6, st: 'normal' });
      g.globalCompositeOperation = 'destination-out'; g.beginPath(); g.arc(0, -50, 8, 0, TAU); g.fill();
    } });
    P.stamp = buildStamp();
    P.s1 = buildStrip('“The gators may be the most famous attraction, but there are far deadlier predators and weirder discoveries…”', 780, 46, 61);
    P.s2 = buildStrip('“You never know what lies beneath…”', 470, 46, 62);
    P.s3a = buildStrip('“…look out…”', 400, 50, 63);
    P.s3b = buildStrip('“…the most beautiful and dangerous waters in all of America.”', 760, 48, 64);
    buildKeys();
    buildBench();
    P.card = buildCard();
  }
  function labelPiece(text, px, col, seed) {
    var m = mk(4, 4).getContext('2d'); cond(m); font(m, px, 900); ls(m, 3); var tw = m.measureText(text).width + 40, h = px * 1.32;
    var pc = piece([0, 0, tw, h], function (g) { rr(g, 0, 0, tw, h, 8); }, CREAM, { sy: 6, blur: 8, extra: function (g) {
      g.strokeStyle = HOT; g.lineWidth = 5; rr(g, 7, 7, tw - 14, h - 14, 5); g.stroke();
      cond(g); font(g, px, 900); ls(g, 3); g.fillStyle = col; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, tw / 2, h / 2 + px * .05); unst(g); ls(g, 0);
    } });
    pc.words = [[pc.x0 * -1 + 18, -pc.y0 + 8, -pc.x0 + tw - 18, -pc.y0 + h - 8, text]];
    pc.tw = tw; pc.th = h; return pc;
  }
  function tagPiece(text, px, band, seed) {
    var m = mk(4, 4).getContext('2d'); cond(m); font(m, px, 900); ls(m, 2); var tw = m.measureText(text).width + 90, h = px * 1.7;
    var pc = piece([-tw / 2, 0, tw / 2, h], function (g) { g.beginPath(); g.moveTo(-tw / 2 + 26, 0); g.lineTo(tw / 2 - 26, 0); g.lineTo(tw / 2, 26); g.lineTo(tw / 2, h); g.lineTo(-tw / 2, h); g.lineTo(-tw / 2, 26); g.closePath(); }, PAPER, { sy: 8, blur: 12, extra: function (g) {
      g.fillStyle = band; g.fillRect(-tw / 2, h - 16, tw, 16);
      inkText(g, text, 0, h / 2 + 2, px, INK, seed * 7, { dense: 70, ls: 2 });
      g.globalCompositeOperation = 'destination-out'; g.beginPath(); g.arc(0, 18, 8, 0, TAU); g.fill();
    } });
    pc.words = [[-pc.x0 - tw / 2 + 30, -pc.y0 + 26, -pc.x0 + tw / 2 - 30, -pc.y0 + h - 18, text]];
    pc.tw = tw; pc.th = h; return pc;
  }
  function buildStamp() {
    var m = mk(4, 4).getContext('2d'); cond(m); font(m, 102, 900); ls(m, 2); var w1 = m.measureText('DEADLIEST').width; font(m, 66, 900); var w0 = m.measureText('NOT THE').width;
    var w = Math.max(w0, w1) + 80, h = 206, tp = jag(95, w, 4), bt = jag(96, w, 4);
    var pc = piece([-w / 2, -h / 2 - 8, w / 2, h / 2 + 8], function (g) { g.beginPath(); g.moveTo(-w / 2, -h / 2 + tp[0][1]); tp.forEach(function (q) { g.lineTo(-w / 2 + q[0], -h / 2 + q[1]); }); for (var i = bt.length - 1; i >= 0; i--) g.lineTo(-w / 2 + bt[i][0], h / 2 + bt[i][1]); g.closePath(); }, NEWS, { sx: 6, sy: 12, blur: 16, extra: function (g) {
      var r = mulberry(91);
      g.strokeStyle = HOT; g.lineWidth = 9; g.strokeRect(-w / 2 + 22, -h / 2 + 18, w - 44, h - 36); g.lineWidth = 3.5; g.strokeRect(-w / 2 + 36, -h / 2 + 32, w - 72, h - 64);
      inkText(g, 'NOT THE', 0, -44, 66, HOT, 92, { dense: 26, big: 2, ls: 2 });
      inkText(g, 'DEADLIEST', 0, 32, 102, HOT, 93, { dense: 26, big: 2.2, ls: 2 });
      g.globalCompositeOperation = 'destination-out';
      for (var i = 0; i < 500; i++) { g.globalAlpha = .2 + r() * .5; g.beginPath(); g.arc(-w / 2 + 20 + r() * (w - 40), -h / 2 + 16 + r() * (h - 32), .5 + r() * 1.8, 0, TAU); g.fill(); }
    } });
    pc.words = [[-pc.x0 - w / 2 + 30, -pc.y0 - h / 2 + 30, -pc.x0 + w / 2 - 30, -pc.y0 + h / 2 - 30, 'NOT THE DEADLIEST']];
    pc.sw = w; return pc;
  }
  /* mangrove trees: kraft trunks and arching prop roots that run down under the water, a dark canopy, one glue tab */
  function buildMid() {
    var roots = [
      [190, 640, 120, 600, 80, 760, 100, 1200], [192, 660, 250, 620, 300, 760, 300, 1220], [200, 700, 320, 690, 380, 820, 400, 1180],
      [848, 640, 900, 610, 950, 760, 925, 1210], [846, 660, 780, 620, 730, 760, 720, 1230], [840, 700, 700, 700, 640, 820, 640, 1170]];
    function draw(g) {
      g.lineCap = 'round'; g.lineJoin = 'round';
      g.shadowColor = 'rgba(6,3,18,.5)'; g.shadowBlur = 12 * PS; g.shadowOffsetX = 5 * PS; g.shadowOffsetY = 9 * PS;
      function stroke(fn, wdt, col) { g.strokeStyle = 'rgba(255,240,215,.85)'; g.lineWidth = wdt + 5; fn(); g.stroke(); g.shadowColor = 'transparent'; g.strokeStyle = col; g.lineWidth = wdt; fn(); g.stroke(); g.shadowColor = 'rgba(6,3,18,.5)'; }
      roots.forEach(function (r0, i) { stroke(function () { g.beginPath(); g.moveTo(r0[0], r0[1]); g.bezierCurveTo(r0[2], r0[3], r0[4], r0[5], r0[6], r0[7]); }, 15 - (i % 3) * 2, i % 2 ? KRAFT2 : KRAFT); });
      stroke(function () { g.beginPath(); g.moveTo(170, 240); g.bezierCurveTo(200, 420, 180, 560, 196, 720); }, 34, KRAFT);
      stroke(function () { g.beginPath(); g.moveTo(870, 240); g.bezierCurveTo(840, 420, 860, 560, 844, 720); }, 34, KRAFT);
      /* bark lines */
      g.shadowColor = 'transparent'; g.strokeStyle = 'rgba(70,40,15,.35)'; g.lineWidth = 2;
      [[174, 330, 190, 420], [186, 500, 182, 600], [864, 330, 852, 430], [856, 520, 850, 620]].forEach(function (b) { g.beginPath(); g.moveTo(b[0], b[1]); g.lineTo(b[2], b[3]); g.stroke(); });
      /* canopy */
      g.shadowColor = 'rgba(6,3,18,.5)';
      [[110, 300, 120], [240, 262, 96], [70, 440, 84], [910, 300, 128], [790, 258, 96], [960, 450, 92]].forEach(function (c) { g.beginPath(); g.arc(c[0], c[1], c[2], 0, TAU); g.fillStyle = '#0b5553'; g.fill(); });
      g.shadowColor = 'transparent';
      [[150, 330, 70], [880, 340, 74]].forEach(function (c) { g.beginPath(); g.arc(c[0], c[1], c[2], 0, TAU); g.fillStyle = '#127069'; g.fill(); });
      g.strokeStyle = 'rgba(255,240,215,.7)'; g.lineWidth = 2;
      [[110, 300, 120], [240, 262, 96], [70, 440, 84], [910, 300, 128], [790, 258, 96], [960, 450, 92]].forEach(function (c) { g.beginPath(); g.arc(c[0], c[1], c[2], .2, 2.9); g.stroke(); });
      /* the glue tab where one root meets the water: a folded flap with a dashed fold line */
      g.fillStyle = '#dcab6c'; g.beginPath(); g.moveTo(700, 905); g.lineTo(742, 905); g.lineTo(752, 934); g.lineTo(690, 934); g.closePath(); g.fill();
      g.strokeStyle = 'rgba(80,45,15,.6)'; g.setLineDash([5, 4]); g.lineWidth = 2; g.beginPath(); g.moveTo(700, 906); g.lineTo(742, 906); g.stroke(); g.setLineDash([]);
      g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(694, 926, 54, 3);
    }
    var pad = 40, b = [20, 140, 1000, 1260], w = b[2] - b[0] + 2 * pad, h = b[3] - b[1] + 2 * pad, c = mk(w * PS, h * PS), g = c.getContext('2d');
    g.scale(PS, PS); g.translate(pad - b[0], pad - b[1]); draw(g);
    g.globalCompositeOperation = 'source-atop'; g.globalAlpha = .9; g.fillStyle = g.createPattern(GRAIN, 'repeat'); g.fillRect(b[0] - pad, b[1] - pad, w, h);
    return { c: c, x0: b[0] - pad, y0: b[1] - pad, w: w, h: h };
  }
  /* the paper gator: body, tail, head and two legs, each its own cut piece on a brass split pin */
  var G0 = {};
  function buildGator() {
    function scutes(g, x0, x1, y, h, n) { for (var i = 0; i < n; i++) { var x = x0 + (x1 - x0) * i / n, wv = (x1 - x0) / n; g.moveTo(x, y); g.lineTo(x + wv * .5, y - h); g.lineTo(x + wv, y); } }
    function body(g) { g.beginPath(); g.moveTo(-178, -36); g.bezierCurveTo(-120, -66, 60, -72, 142, -44); g.lineTo(150, 20); g.bezierCurveTo(60, 42, -110, 40, -178, 22); g.closePath(); scutes(g, -150, 120, -56, 14, 9); }
    function tail(g) { g.beginPath(); g.moveTo(-10, -30); g.bezierCurveTo(-90, -28, -170, -14, -230, -4); g.lineTo(-232, 2); g.bezierCurveTo(-170, 10, -90, 22, -10, 24); g.closePath(); scutes(g, -200, -20, -24, 12, 6); }
    function head(g) { g.beginPath(); g.moveTo(-16, -30); g.bezierCurveTo(10, -44, 26, -50, 36, -52); g.bezierCurveTo(40, -70, 66, -72, 70, -48); g.bezierCurveTo(120, -40, 170, -34, 196, -28); g.quadraticCurveTo(214, -24, 214, -12); g.quadraticCurveTo(214, 2, 196, 4); g.bezierCurveTo(140, 8, 60, 16, -16, 22); g.closePath(); }
    function leg(g) { g.beginPath(); g.moveTo(-14, -8); g.lineTo(14, -8); g.lineTo(20, 52); g.lineTo(40, 60); g.lineTo(36, 70); g.lineTo(-6, 70); g.lineTo(-20, 64); g.closePath(); }
    var gs = function (g) { var gr = g.createLinearGradient(0, -70, 0, 40); gr.addColorStop(0, GR1); gr.addColorStop(1, GR2); return gr; };
    G0.body = piece([-182, -74, 156, 44], body, gs, { sx: 4, sy: 8, extra: function (g) { g.fillStyle = 'rgba(30,60,20,.35)'; for (var i = 0; i < 26; i++) { g.beginPath(); g.ellipse(-150 + (i % 13) * 22, -34 + Math.floor(i / 13) * 18, 8, 5, 0, 0, TAU); g.fill(); } g.fillStyle = 'rgba(220,235,170,.45)'; g.fillRect(-180, 12, 340, 40); } });
    G0.tail = piece([-236, -40, 0, 28], tail, gs, { sx: 4, sy: 8, extra: function (g) { g.fillStyle = 'rgba(30,60,20,.35)'; for (var i = 0; i < 7; i++) { g.beginPath(); g.ellipse(-200 + i * 26, -8, 7, 4, 0, 0, TAU); g.fill(); } } });
    G0.head = piece([-20, -74, 216, 24], head, gs, { sx: 4, sy: 8, extra: function (g) {
      g.strokeStyle = '#1d2a12'; g.lineWidth = 4; g.beginPath(); g.moveTo(30, -2); g.bezierCurveTo(90, -6, 150, -8, 206, -12); g.stroke();
      g.fillStyle = CREAM; for (var x = 50; x < 200; x += 18) { g.beginPath(); g.moveTo(x, -5); g.lineTo(x + 6, 6); g.lineTo(x + 12, -6); g.closePath(); g.fill(); }
      g.fillStyle = CREAM; g.beginPath(); g.ellipse(52, -55, 13, 11, 0, 0, TAU); g.fill(); g.fillStyle = INK; g.beginPath(); g.ellipse(54, -55, 4, 9, 0, 0, TAU); g.fill();
      g.fillStyle = '#fff'; g.beginPath(); g.arc(48, -59, 3, 0, TAU); g.fill();
      g.fillStyle = '#1d2a12'; g.beginPath(); g.arc(196, -24, 4, 0, TAU); g.fill();
    } });
    G0.leg = piece([-22, -10, 42, 72], leg, GR2, { sx: 3, sy: 6, blur: 8 });
    G0.tab = piece([-48, 0, 48, 28], function (g) { g.beginPath(); g.moveTo(-44, 0); g.lineTo(44, 0); g.lineTo(36, 26); g.lineTo(-36, 26); g.closePath(); }, '#c9dc9b', { sx: 2, sy: 4, blur: 6, extra: function (g) { g.strokeStyle = 'rgba(40,70,20,.6)'; g.setLineDash([5, 4]); g.lineWidth = 2; g.beginPath(); g.moveTo(-44, 2); g.lineTo(44, 2); g.stroke(); } });
    /* the plain back of the cardstock, seen for a moment when the gator turns round */
    G0.bodyB = piece([-182, -74, 156, 44], body, GRB, { sx: 4, sy: 8 });
    G0.tailB = piece([-236, -40, 0, 28], tail, GRB, { sx: 4, sy: 8 });
    G0.headB = piece([-20, -74, 216, 24], head, GRB, { sx: 4, sy: 8 });
  }
  /* the second panel: the Leonida Keys at sunset */
  function buildKeys() {
    P.ksky = piece([30, 240, 990, 1120], rect(30, 240, 990, 1120), function (g) { var gr = g.createLinearGradient(0, 300, 0, 900); gr.addColorStop(0, '#2a1258'); gr.addColorStop(.5, '#c43c86'); gr.addColorStop(.78, '#ff7aa8'); gr.addColorStop(1, '#ffb070'); return gr; }, { shadow: false, edge: false, grain: .8, ps: 1 });
    /* a striped paper sun, the bands cut apart */
    P.ksun = piece([-160, -160, 160, 160], function (g) { g.beginPath(); g.arc(0, 0, 156, 0, TAU); }, function (g) { var gr = g.createLinearGradient(0, -156, 0, 156); gr.addColorStop(0, '#ffd889'); gr.addColorStop(.6, ORG); gr.addColorStop(1, HOT); return gr; }, { sy: 5, blur: 10, after: function (g) { g.globalCompositeOperation = 'destination-out'; [[36, 10], [72, 13], [106, 16], [136, 18]].forEach(function (b) { g.fillRect(-170, b[0], 340, b[1]); }); } });
    P.kisl = piece([30, 800, 990, 1000], bumps(30, 990, 880, 4, 26, 31, 1000), '#0d7f80', { sy: 5, blur: 8 });
    P.kmurk = piece([0, WL - 20, 1020, 2280], rect(0, WL - 20, 1020, 2280), function (g) { var gr = g.createLinearGradient(0, WL, 0, 2280); gr.addColorStop(0, '#26c3bb'); gr.addColorStop(.25, '#128e97'); gr.addColorStop(.6, '#0a566b'); gr.addColorStop(1, '#062a3c'); return gr; }, { shadow: false, edge: false, grain: .7, ps: 1 });
    P.kposts = piece([60, 840, 560, 1700], function (g) { g.beginPath(); [110, 250, 390, 520].forEach(function (x) { g.rect(x - 13, 860, 26, 820); }); }, KRAFT2, { sx: 4, sy: 6, blur: 8 });
    P.kdeck = piece([40, 846, 580, 900], function (g) { g.beginPath(); g.rect(40, 852, 540, 34); }, KRAFT, { sy: 8, blur: 12, extra: function (g) { g.strokeStyle = 'rgba(70,40,15,.5)'; g.lineWidth = 2; for (var x = 40; x < 580; x += 54) { g.beginPath(); g.moveTo(x, 852); g.lineTo(x, 886); g.stroke(); } } });
    P.kwave = [0, 1, 2].map(function (i) { return piece([-60, -20, 1080, 90], scallop(-60, 1080, 30, 30 + i * 6, 76), ['#3fdad0', '#1aa9ab', '#0e7f8a'][i], { sy: 6, blur: 10, grain: .6 }); });
    P.kchair = piece([-80, -110, 90, 10], function (g) {
      g.beginPath(); g.moveTo(-70, 0); g.lineTo(40, -100); g.lineTo(52, -92); g.lineTo(-56, 6); g.closePath();
      g.moveTo(70, 0); g.lineTo(-30, -60); g.lineTo(-40, -50); g.lineTo(58, 6); g.closePath();
    }, KRAFT, { sx: 3, sy: 6, blur: 6, after: function (g) {
      g.save(); g.translate(0, 0); g.beginPath(); g.moveTo(-34, -56); g.quadraticCurveTo(-4, -20, 40, -96); g.lineTo(54, -88); g.quadraticCurveTo(4, -6, -46, -44); g.closePath(); g.clip();
      for (var i = -60; i < 70; i += 14) { g.fillStyle = (i / 14 | 0) % 2 ? CREAM : HOT; g.fillRect(i, -110, 14, 120); }
      g.restore();
    } });
    P.kshadow = piece([-380, -110, 380, 110], blobPath(330, 74, 23), 'rgba(0,34,44,.9)', { shadow: false, edge: false, grain: 0, filter: 'blur(12px)', pad: 50, ps: 1 });
    /* a near jetty in the foreground water, with legs, for the deck chair */
    P.kjetty = piece([80, 1280, 660, 1500], function (g) { g.beginPath(); g.rect(80, 1290, 580, 38); [130, 330, 530].forEach(function (x) { g.rect(x - 15, 1326, 30, 170); }); }, KRAFT, { sy: 9, blur: 14, extra: function (g) { g.strokeStyle = 'rgba(70,40,15,.5)'; g.lineWidth = 2; for (var x = 80; x < 660; x += 58) { g.beginPath(); g.moveTo(x, 1290); g.lineTo(x, 1328); g.stroke(); } g.fillStyle = 'rgba(70,40,15,.35)'; [130, 330, 530].forEach(function (x) { g.fillRect(x - 15, 1328, 30, 10); }); } });
    P.kpalm = piece([40, 520, 330, 880], function (g) {
      g.beginPath(); g.moveTo(120, 880); g.quadraticCurveTo(150, 720, 200, 600); g.lineTo(212, 604); g.quadraticCurveTo(166, 720, 140, 880); g.closePath();
      [[-2.6, 110], [-2.1, 120], [-1.2, 110], [-.5, 120], [.1, 100]].forEach(function (f) { var x0 = 206, y0 = 600, x1 = x0 + Math.cos(f[0]) * f[1], y1 = y0 + Math.sin(f[0]) * f[1] + 30; g.moveTo(x0, y0); g.quadraticCurveTo((x0 + x1) / 2 + 10, Math.min(y0, y1) - 30, x1, y1); g.quadraticCurveTo((x0 + x1) / 2, Math.min(y0, y1) - 6, x0, y0 + 6); g.closePath(); });
    }, '#0b4f55', { sy: 6, blur: 8 });
    P.kstake = piece([-8, 0, 8, 520], rect(-7, 0, 7, 520), KRAFT2, { sx: 3, sy: 5, blur: 6 });
    P.drop = piece([-12, -16, 12, 16], function (g) { g.beginPath(); g.moveTo(0, -16); g.quadraticCurveTo(12, 2, 0, 14); g.quadraticCurveTo(-12, 2, 0, -16); }, '#bff6ef', { sx: 2, sy: 3, blur: 4, grain: .5 });
  }
  /* the workbench round the box: a green self-healing cutting mat (grid), a steel rule and a pencil */
  function buildBench() {
    P.bench = piece([BX0, BY0, BX1, BY1], rect(BX0, BY0, BX1, BY1), '#2f6e58', { shadow: false, edge: false, grain: .9, ps: 1, extra: function (g) {
      for (var x = BX0 + 20; x < BX1; x += 40) { g.fillStyle = (x - BX0 - 20) % 200 ? 'rgba(220,255,235,.13)' : 'rgba(220,255,235,.3)'; g.fillRect(x, BY0, (x - BX0 - 20) % 200 ? 1.5 : 2.5, BY1 - BY0); }
      for (var y = BY0 + 20; y < BY1; y += 40) { g.fillStyle = (y - BY0 - 20) % 200 ? 'rgba(220,255,235,.13)' : 'rgba(220,255,235,.3)'; g.fillRect(BX0, y, BX1 - BX0, (y - BY0 - 20) % 200 ? 1.5 : 2.5); }
      g.strokeStyle = 'rgba(255,255,255,.22)'; g.lineWidth = 2; g.beginPath(); g.moveTo(BX0, BY1 - 60); g.lineTo(BX1, BY0 + 520); g.stroke();
    } });
    P.rule = piece([0, 0, 52, 470], function (g) { g.beginPath(); g.rect(0, 0, 52, 470); }, function (g) { var gr = g.createLinearGradient(0, 0, 52, 0); gr.addColorStop(0, '#c9cfd8'); gr.addColorStop(.5, '#eef1f5'); gr.addColorStop(1, '#a9b0bb'); return gr; }, { sx: 5, sy: 8, blur: 10, extra: function (g) { g.fillStyle = 'rgba(40,44,56,.7)'; for (var y = 10; y < 470; y += 10) g.fillRect(0, y, y % 50 ? 10 : 20, 1.6); } });
    P.pencil = piece([0, -9, 240, 9], function (g) { g.beginPath(); g.moveTo(0, -9); g.lineTo(200, -9); g.lineTo(240, 0); g.lineTo(200, 9); g.lineTo(0, 9); g.closePath(); }, '#ffcf4d', { sy: 5, blur: 6, extra: function (g) { g.fillStyle = '#f1c8a0'; g.beginPath(); g.moveTo(200, -9); g.lineTo(240, 0); g.lineTo(200, 9); g.closePath(); g.fill(); g.fillStyle = '#3a3a48'; g.beginPath(); g.moveTo(228, -3); g.lineTo(240, 0); g.lineTo(228, 3); g.closePath(); g.fill(); g.fillStyle = '#c98f7a'; g.fillRect(0, -9, 22, 18); } });
  }
  /* the real-world field card: a lined index card, THEORY · OUR GUESS, and a long pencil python sketched across it */
  function buildCard() {
    var w = 760, h = 400, rec = [];
    var pc = piece([-w / 2, -h / 2, w / 2, h / 2], function (g) { g.beginPath(); g.rect(-w / 2, -h / 2, w, h); }, '#fbf6ea', { sx: 6, sy: 12, blur: 16, extra: function (g) {
      g.fillStyle = 'rgba(25,150,200,.22)'; for (var y = -h / 2 + 92; y < h / 2; y += 38) g.fillRect(-w / 2, y, w, 2);
      g.fillStyle = 'rgba(255,79,163,.45)'; g.fillRect(-w / 2, -h / 2 + 78, w, 3);
      function T(s, x, y, px, col, al) { cond(g); font(g, px, 900); ls(g, 1); g.fillStyle = col; g.textAlign = al || 'left'; g.textBaseline = 'middle'; g.fillText(s, x, y); var mm = g.measureText(s), x0 = al === 'center' ? x - mm.width / 2 : x; rec.push([x0, y - px * .55, x0 + mm.width, y + px * .45, s]); unst(g); return mm.width; }
      g.fillStyle = ORG; rr(g, -w / 2 + 24, -h / 2 + 14, 470, 58, 8); g.fill();
      T('THEORY · OUR GUESS', -w / 2 + 40, -h / 2 + 44, 50, INK);
      g.fillStyle = TEAL; rr(g, w / 2 - 214, -h / 2 + 18, 190, 50, 8); g.fill();
      T('REAL WORLD', w / 2 - 119, -h / 2 + 44, 38, INK, 'center');
      T('REAL EVERGLADES:', -w / 2 + 34, -h / 2 + 128, 56, INK);
      T('BURMESE PYTHONS', -w / 2 + 34, -h / 2 + 188, 56, INK);
      cond(g); font(g, 56, 900); ls(g, 1); var bw = g.measureText('BURMESE ').width; pc_ul = [-w / 2 + 34 + bw - 8, -w / 2 + 34 + g.measureText('BURMESE PYTHONS').width + 4, -h / 2 + 222]; unst(g);
      /* a long python in graphite: an S-coil across the card's foot, head with an eye and a forked tongue */
      var r = mulberry(77), x0 = -w / 2 + 60, x1 = w / 2 - 230, yc = h / 2 - 78, pts = [];
      for (var i = 0; i <= 120; i++) { var u = i / 120, x = lerp(x0, x1, u), y = yc + 34 * Math.sin(u * TAU * 1.5 + .4) * (.55 + .45 * u); pts.push([x, y, 4 + 9 * Math.min(1, u * 3) * (1 - .25 * u)]); }
      g.strokeStyle = 'rgba(60,60,76,.8)'; g.lineWidth = 2.6; g.lineCap = 'round';
      [-1, 1].forEach(function (sd) { for (var p = 0; p < 2; p++) { g.beginPath(); pts.forEach(function (q, i) { var x = q[0] + (r() - .5) * 1.4, y = q[1] + sd * q[2] + (r() - .5) * 1.4; if (i) g.lineTo(x, y); else g.moveTo(x, y); }); g.stroke(); } });
      g.lineWidth = 1.6; for (i = 6; i < 118; i += 5) { var q = pts[i]; g.beginPath(); g.moveTo(q[0] - 3, q[1] - q[2] * .7); g.lineTo(q[0] + 3, q[1] + q[2] * .7); g.stroke(); }
      var hx = x1 + 22, hy = pts[120][1]; g.lineWidth = 2.6; g.beginPath(); g.ellipse(hx, hy, 26, 14, 0, 0, TAU); g.stroke();
      g.fillStyle = 'rgba(60,60,76,.9)'; g.beginPath(); g.arc(hx + 8, hy - 4, 3, 0, TAU); g.fill();
      g.beginPath(); g.moveTo(hx + 26, hy + 2); g.lineTo(hx + 44, hy + 2); g.lineTo(hx + 52, hy - 4); g.moveTo(hx + 44, hy + 2); g.lineTo(hx + 52, hy + 8); g.stroke();
    } });
    pc.words = rec.map(function (r0) { return [r0[0] - pc.x0, r0[1] - pc.y0, r0[2] - pc.x0, r0[3] - pc.y0, r0[4]]; });
    pc.ul = pc_ul; pc.hh = h;
    return pc;
  }
  var pc_ul = null;

  /* =====================================================================================================
     THE CAMERA. Inner camera: y (dip, tilt), z (push), the panel track k (0 swamp, 1 keys).
     Outer camera: P, the pull back out of the box onto the workbench (about the box's top centre).
     ===================================================================================================== */
  var T = {};
  function cam(t) {
    var dip = eio(seg(t, T.dip0, T.dip0 + .8)) - eio(seg(t, T.rise0, T.rise0 + .55));
    var push = eio(seg(t, T.push0, T.push0 + .9)) * (1 - eio(seg(t, T.rise0, T.rise0 + .55)));
    var tilt = eio(seg(t, T.tilt0, T.tilt0 + .6)) * (1 - eio(seg(t, T.tiltB, T.tiltB + .4)));
    var k = eio(seg(t, T.slide0, T.slide0 + .5)) - eio(seg(t, T.slideB, T.slideB + .5));
    var Pk = eio(seg(t, T.pull0, T.pull0 + .75)) * (1 - eio(seg(t, T.in0, T.in0 + 1.1)));
    return { y: 760 * dip + 150 * tilt, z: 1 + .05 * push + .2 * dip + .05 * tilt, k: k, P: 1 - .58 * Pk, Pk: Pk, dip: dip };
  }
  /* a layer's transform: parallax p (0 far .. 1 the water plane, >1 foreground) */
  function L(g, C, p) { var zz = 1 + (C.z - 1) * (.55 + .45 * Math.min(1, p)); g.translate(FX, FY); g.scale(zz, zz); g.translate(-FX, -FY - C.y * p); }
  function lay(g, C, p, fn) { g.save(); L(g, C, p); fn(); g.restore(); }

  /* ---------- the gator's pose: glides with the film's period, turns round with a paper flip ---------- */
  function gatorState(t) {
    var c = Math.cos(TAU * t / DUR);
    return {
      x: 486 + 90 * Math.sin(TAU * t / DUR - Math.PI / 4), y: WL - 4 + 4 * osc(t, 13), rot: .018 * osc(t, 9, 1),
      sx: clamp(Math.cos(TAU * t / DUR - Math.PI / 4) * 9, -1, 1),
      head: -.2 * bump(t, T.head, .8) - .22 * bump(t, T.head2, .9) + .14 * bump(t, T.headD, 1.1) - .1 * bump(t, T.snap, .5) + .03 * osc(t, 7),
      tail: .07 * osc(t, 11) + sw(t, T.flick, .22, 9, 3),
      legF: .3 * osc(t, 19), legB: .3 * osc(t, 19, 2)
    };
  }
  function pin(g, x, y) { g.fillStyle = '#e6b866'; g.beginPath(); g.arc(x, y, 6, 0, TAU); g.fill(); g.fillStyle = 'rgba(255,255,255,.6)'; g.beginPath(); g.arc(x - 2, y - 2, 2, 0, TAU); g.fill(); }
  function gator(g, t, below) {
    var S = gatorState(t), back = Math.abs(S.sx) < .45;
    g.save(); g.translate(S.x, S.y); g.rotate(S.rot); g.scale(S.sx, 1);
    if (below) {
      put(g, G0.leg, -112, 20, S.legB); put(g, G0.leg, 96, 22, S.legF); put(g, G0.tab, -10, 30);
    } else {
      put(g, back ? G0.tailB : G0.tail, -168, -6, S.tail);
      put(g, back ? G0.bodyB : G0.body, 0, 0);
      put(g, back ? G0.headB : G0.head, 130, -16, S.head);
      pin(g, -168, -6); pin(g, 130, -16); pin(g, -112, 20); pin(g, 96, 22);
    }
    g.restore();
  }
  /* the shape sits ~180 px behind the gator and drifts the other way (64 px/s at frame 0), so it never reads as its shadow;
     on "deadlier" it slides in under the gator, and it settles back by the loop */
  function shapeX(t) { return 240 - 110 * Math.sin(TAU * 3 * t / DUR) + 230 * eio(seg(t, T.lurch, T.lurch + .8)) * (1 - eio(seg(t, T.reset, T.reset + 1.2))); }
  function shapeS(t) { return 1 + .14 * eio(seg(t, T.swell, T.swell + .7)) * (1 - eio(seg(t, T.reset, T.reset + 1.2))); }

  /* bubbles and paper specks under the water (seeded, drifting) */
  var SPECK = (function () { var r = mulberry(88), a = []; for (var i = 0; i < 34; i++) a.push({ x: r() * 900 + 60, y: 980 + r() * 1100, s: 3 + r() * 6, ph: r() * 6, k: 1 + (i % 4) }); return a; })();
  function specks(g, t) {
    SPECK.forEach(function (s, i) {
      var x = s.x + 14 * osc(t, s.k, s.ph), y = s.y + 10 * osc(t, s.k + 1, s.ph * 2);
      g.save(); g.translate(x, y); g.rotate(osc(t, 2, s.ph)); g.fillStyle = i % 3 ? 'rgba(240,250,235,.5)' : 'rgba(255,190,140,.45)'; g.fillRect(-s.s / 2, -s.s / 2, s.s, s.s * .7); g.restore();
    });
  }
  function bubbles(g, t, t0, x0, y0, v) {
    if (t < t0 || t > t0 + 1.6) return;
    for (var i = 0; i < 9; i++) { var u = t - t0 - i * .07; if (u < 0) continue; var y = y0 - u * (v || 420) - i * 8, x = x0 + (i % 3 - 1) * 40 + Math.sin(u * 9 + i) * 10, r = 7 + (i % 4) * 4;
      g.globalAlpha = clamp(1.4 - u, 0, 1) * .9; g.strokeStyle = 'rgba(240,255,250,.95)'; g.lineWidth = 3; g.beginPath(); g.arc(x, y, r, 0, TAU); g.stroke(); g.fillStyle = 'rgba(220,255,250,.25)'; g.fill(); }
    g.globalAlpha = 1;
  }

  /* =====================================================================================================
     PANEL 1: the swamp (Grassrivers)
     ===================================================================================================== */
  function moss(g, t) {
    g.fillStyle = '#9ccf8a';
    [[90, 380, 120, 0], [150, 400, 90, 1], [260, 330, 110, 2], [800, 330, 100, 3], [890, 400, 130, 4], [950, 470, 90, 5]].forEach(function (m) {
      var s = .05 * osc(t, 5, m[3]);
      g.save(); g.translate(m[0], m[1]); g.rotate(s); g.beginPath(); g.moveTo(-8, 0); g.lineTo(8, 0);
      for (var y = 0; y <= m[2]; y += 12) g.lineTo(6 - y * .04 + Math.sin(y * .3 + m[3]) * 3, y);
      g.lineTo(0, m[2] + 10); for (y = m[2]; y >= 0; y -= 12) g.lineTo(-6 + y * .04 + Math.sin(y * .3 + m[3] + 1) * 3, y); g.closePath();
      g.globalAlpha = .9; g.fill(); g.globalAlpha = 1; g.restore();
    });
  }
  function ripple(g, t, t0, x, y) {
    if (t < t0 || t > t0 + 1.2) return; var u = (t - t0) / 1.2;
    g.save(); g.globalAlpha = (1 - u) * .8; g.strokeStyle = 'rgba(255,255,255,.9)'; g.lineWidth = 3;
    [0, .25].forEach(function (d) { var k = clamp(u - d, 0, 1); if (k <= 0) return; g.beginPath(); g.ellipse(x, y, 30 + k * 160, 6 + k * 20, 0, 0, TAU); g.stroke(); });
    g.restore();
  }
  function swamp(g, t, C) {
    lay(g, C, .3, function () { put(g, P.sky, 0, 0); });
    lay(g, C, .34, function () { put(g, P.cloud1, 160 + 24 * osc(t, 1), 560); put(g, P.cloud2, 520 - 20 * osc(t, 1, 1), 650); });
    lay(g, C, .4, function () { put(g, P.sun, 700, 800); });
    lay(g, C, .5, function () { put(g, P.farB, 0, 0); });
    lay(g, C, .6, function () { put(g, P.farF, 0, 0); });
    /* under the water: murk, deep shapes, the near shape, the mangrove roots, the gator's legs, the ? tag */
    lay(g, C, .9, function () {
      put(g, P.murk, 0, 0); put(g, P.reeds, 6 * osc(t, 3), 0); put(g, P.mud, 0, 0);
      var sk3 = eio(seg(t, T.bub, T.bub + .8)) * (1 - seg(t, T.rise0, T.rise0 + .6));
      put(g, P.sh3, 480 + 70 * osc(t, 2, 1) + 70 * sk3, 1600 + 20 * osc(t, 3) - 30 * sk3, .05 * sk3, 1 + .06 * sk3);
      put(g, P.sh4, 800 - 60 * osc(t, 2), 1880 + 14 * osc(t, 4, 2));
    });
    lay(g, C, .92, function () {
      var sx = shapeX(t), ss = shapeS(t);
      put(g, P.sh1, sx, WL + 180 + 8 * osc(t, 5) - 18 * eio(seg(t, T.swell, T.swell + .7)) * (1 - eio(seg(t, T.reset, T.reset + 1.2))), .02 * osc(t, 3), ss);
      put(g, P.sh2, 820 + 30 * osc(t, 3, 2), 1300 + 10 * osc(t, 6));
      specks(g, t);
    });
    lay(g, C, .95, function () { put(g, P.mid, 0, 0); moss(g, t); });
    lay(g, C, 1, function () {
      /* the ? tag on a reed, beside the shape (never on it) */
      if (t >= T.qIn - .05 && t < T.rise0 + .6) {
        var qk = cd(t, T.qIn, 11), qx = 818, qy = lerp(1500, 1060, qk) + 6 * osc(t, 8);
        g.strokeStyle = '#3f6f45'; g.lineWidth = 6; g.beginPath(); g.moveTo(qx, qy + 60); g.quadraticCurveTo(qx + 10, qy + 300, qx - 6, qy + 700); g.stroke();
        put(g, P.qtag, qx, qy, .06 * osc(t, 9) + sw(t, T.qIn + .2, .12, 8, 3));
      }
      gator(g, t, true);
      bubbles(g, t, T.bub, 470, 1960);
      bubbles(g, t, T.bub0, shapeX(T.bub0) + 120, WL + 150, 110);
    });
    lay(g, C, 1.08, function () { var sr = -.05 + .012 * osc(t, 7) + sw(t, at('hook', 'swim'), .03, 9, 3); g.save(); g.translate(245, 778); g.rotate(sr); put(g, P.stick, 0, 0); g.restore(); });
    lay(g, C, 1, function () {
      gator(g, t, false);
      var GS = gatorState(T.flick); ripple(g, t, T.flick, GS.x - GS.sx * 330, WL + 8);
      put(g, P.vel1, 10 * osc(t, 3), 3 * osc(t, 13, .5));
      put(g, P.vel2, -12 * osc(t, 3, 1), 3 * osc(t, 13, 2));
    });
    lay(g, C, 1.08, function () { var sr = -.05 + .012 * osc(t, 7) + sw(t, at('hook', 'swim'), .03, 9, 3); g.save(); g.translate(245, 778); g.rotate(sr); NOREC = C.k > 0 || C.dip > .01; putW(g, P.sign, 0, 0); NOREC = false; g.restore(); });
    /* GRASSRIVERS tag drops on a string from the box top, swings, lifts out when the quote takes over */
    if (t > T.tagIn - .05 && t < T.tagOut + .6) {
      var dk = cd(t, T.tagIn, 12) * (1 - eio(seg(t, T.tagOut, T.tagOut + .5))), ty = lerp(-260, 600, dk), rot = sw(t, T.tagIn + .25, .09, 6, 2) + .015 * osc(t, 8);
      g.save(); g.translate(690, BY0); g.rotate(rot); g.strokeStyle = '#e9d6bd'; g.lineWidth = 3; g.beginPath(); g.moveTo(0, 0); g.lineTo(0, ty - BY0 + 18); g.stroke();
      putW(g, P.tagGR, 0, ty - BY0); g.restore();
    }
  }

  /* =====================================================================================================
     PANEL 2: the Leonida Keys
     ===================================================================================================== */
  function keys(g, t, C) {
    lay(g, C, .3, function () { put(g, P.ksky, 0, 0); });
    lay(g, C, .4, function () { put(g, P.ksun, 610, 760 + 6 * osc(t, 2)); });
    lay(g, C, .55, function () { put(g, P.kisl, 0, 0); });
    lay(g, C, .9, function () {
      put(g, P.kmurk, 0, 0); put(g, P.reeds, 20 + 6 * osc(t, 3, 1), 0); put(g, P.mud, 0, 0);
      specks(g, t + 3);
      /* a dark shadow passes under the waves on "dangerous" (still unidentified) */
      if (t > T.shad && t < T.shad + 2.8) put(g, P.kshadow, lerp(-420, 1440, seg(t, T.shad, T.shad + 2.8)), 1190 + 10 * osc(t, 6));
    });
    lay(g, C, .97, function () { put(g, P.kposts, 0, 0); put(g, P.kpalm, 4 * osc(t, 4), 0); });
    lay(g, C, 1, function () {
      /* the LEONIDA KEYS sign on a stake in the water, lower right */
      if (t > T.kTag - .05) { var kk = cd(t, T.kTag, 12), yy = lerp(1500, 1120, kk); g.save(); g.translate(700, yy); g.rotate(-.03 + .012 * osc(t, 6) + sw(t, T.kTag + .2, .06, 7, 3)); put(g, P.kstake, 0, 40); NOREC = C.k < 1; putW(g, P.tagKeys, 0, -30); NOREC = false; g.restore(); }
      put(g, P.vel1, 10 * osc(t, 3), 30 + 3 * osc(t, 13, .5));
      [2, 1, 0].forEach(function (i) { put(g, P.kwave[i], 60 * osc(t, 4 + i, i) - 30, WL - 30 + i * 30 + 6 * osc(t, 12, i)); });
      put(g, P.kdeck, 0, 0);
      /* the near jetty with a striped deck chair that rocks on "look" */
      put(g, P.kjetty, 0, 0);
      var rock = .04 * osc(t, 8) + sw(t, T.look, .14, 8, 2.4);
      g.save(); g.translate(330, 1292); g.rotate(rock); g.scale(1.8, 1.8); put(g, P.kchair, 0, 0); g.restore();
      /* the splash: cut-paper droplets pop off the front wave in the pause after "America." */
      if (t > T.splash && t < T.splash + 1) for (var i = 0; i < 7; i++) { var u = t - T.splash, a = -1.9 + i * .3, v = 520 + (i % 3) * 90; var x = 640 + Math.cos(a) * v * u, y = WL + 40 + Math.sin(a) * v * u + 900 * u * u; put(g, P.drop, x, y, a + 1.6); }
    });
  }

  /* =====================================================================================================
     OVERLAYS on the glass: the strips, the hero stamp, chips
     ===================================================================================================== */
  function stripAt(g, t, Pc, x, y, tin, tout, o) {
    o = o || {};
    if (t < tin - .02 || t > tout + .5) return;
    var k = cd(t, tin, 15), peel = eio(seg(t, tout, tout + .45)), dir = o.dir || 1;
    var yy = lerp(y + (o.from || 420), y, k), rot = (o.rot || -.015) + (1 - k) * .08 * dir + peel * .35 * dir, xx = x + peel * 1050 * dir;
    var s = kn(t, tin + .12, .03) * (o.knock ? kn(t, o.knock, .03) : 1);
    NOREC = k < .98 || peel > 0;
    g.save(); g.translate(xx, yy); g.rotate(rot); g.scale(s, s);
    putW(g, Pc, -Pc.sw / 2, -Pc.sh / 2);
    tape(g, -Pc.sw / 2 + 40, -Pc.sh / 2 + 4, 90, 30, -.3); tape(g, Pc.sw / 2 - 40, -Pc.sh / 2 + 4, 90, 30, .28);
    /* a third strip of tape slapped across the middle, mid-sentence */
    if (o.slap && t >= o.slap) { var sk = cd(t, o.slap, 22); g.save(); g.globalAlpha *= fin(t, o.slap, .05); g.translate(30, -Pc.sh / 2 + 2); g.scale(lerp(1.7, 1, sk), lerp(1.7, 1, sk)); tape(g, 0, 0, 150, 40, .06); g.restore(); }
    if (o.src) { var ck = cd(t, o.srcT, 14); if (t >= o.srcT) chip(g, o.src, o.srcX || 0, Pc.sh / 2 + 26 + (1 - ck) * 20, { px: 36, bg: TEAL, fg: INK, s: kn(t, o.srcT + .1, .06), a: fin(t, o.srcT, .08), rot: .01 }); }
    g.restore(); NOREC = false;
  }
  function stamp(g, t) {
    if (t < T.stamp - .02 || t > T.stampOut + .3) return;
    var k = cd(t, T.stamp, 30), s = lerp(1.32, 1, k) * kn(t, at('ask', 'rockstar'), .025), a = clamp((t - T.stamp) * 14, 0, 1) * (1 - seg(t, T.stampOut, T.stampOut + .25));
    g.save(); g.globalAlpha *= a; g.translate(Math.min(655, 905 - P.stamp.sw / 2), T.stY); g.rotate(-.06); g.scale(s, s);
    NOREC = k < .98; putW(g, P.stamp, 0, 0); NOREC = false; g.restore();
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
  var CAPY = 470, CAPY_BENCH = 902;
  function strWords(Pc) { var o = {}; Pc.lines.join(' ').split(/\s+/).forEach(function (w) { o[norm(w)] = 1; }); return o; }
  var SW = null;
  function onStrip(card, t) {
    if (!SW) SW = [[P.s1, T.s1In, T.s1Out], [P.s2, T.s2In, T.s2Out], [P.s3a, T.s3aIn, T.s3aOut], [P.s3b, T.s3bIn, T.s3bOut]].map(function (q) { return { w: strWords(q[0]), a: q[1], b: q[2] }; });
    for (var i = 0; i < SW.length; i++) { var S = SW[i]; if (t < S.a || t > S.b) continue; if (card.words.every(function (w) { return S.w[norm(w.w)]; })) return true; }
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
    var CY = card0.words[0].t0 >= T.pull0 - .4 && card0.words[0].t0 < start('end') - .05 ? CAPY_BENCH : CAPY;
    var k = cd(t, card0.t0 - .04, 16);
    g.save(); g.font = '800 72px Archivo'; wide(g); g.textBaseline = 'alphabetic';
    var words = card0.words, ws = words.map(function (w) { return g.measureText(w.w).width; }), gap = 20;
    var lines, lw, maxw = 800, cpx = 72;
    function lay2() { lines = [[]]; lw = [0]; words.forEach(function (w, i) { var Ln = lines.length - 1; if (lw[Ln] + ws[i] > maxw && lines[Ln].length) { lines.push([]); lw.push(0); Ln++; } lines[Ln].push(i); lw[Ln] += ws[i] + gap; }); }
    function fixLines() {
      for (var Ln = 0; Ln < lines.length - 1; Ln++) { var last = lines[Ln][lines[Ln].length - 1]; while (lines[Ln].length > 1 && GLUE[norm(words[last].w)]) { lines[Ln].pop(); lines[Ln + 1].unshift(last); last = lines[Ln][lines[Ln].length - 1]; } }
      var n = lines.length; if (n > 1 && lines[n - 1].length === 1 && lines[n - 2].length > 2) lines[n - 1].unshift(lines[n - 2].pop());
      lw = lines.map(function (ln) { var w = 0; ln.forEach(function (i) { w += ws[i] + gap; }); return w; });
    }
    lay2(); fixLines();
    function widest() { return Math.max.apply(null, lw) - gap; }
    while ((lines.length > 2 || widest() > maxw || (lines.length > 1 && lines[lines.length - 1].length < 2)) && cpx > 52) { cpx -= 4; g.font = '800 ' + cpx + 'px Archivo'; wide(g); ws = words.map(function (w) { return g.measureText(w.w).width; }); gap = cpx * .28; lay2(); fixLines(); }
    var lh = cpx * 1.16, y0 = CY - (lines.length - 1) * lh / 2 + cpx * .35;
    g.globalAlpha = fi * outk;
    lines.forEach(function (ln, li) {
      var x = CX - (lw[li] - gap) / 2, y = y0 + li * lh + (1 - k) * 30;
      ln.forEach(function (i) {
        var w = words[i], nw = words[i + 1], cur = stressed(w) && t >= w.t0 - .03 && t < Math.min(w.t1 + .05, nw ? nw.t0 - .03 : 1e9) + .15;
        if (cur) { g.fillStyle = HOT; g.beginPath(); g.roundRect(x - 12, y - cpx * .87, ws[i] + 24, cpx * 1.15, 18); g.fill(); }
        g.fillStyle = 'rgba(5,2,15,.6)'; if (!cur) g.fillText(w.w, x + 3, y + 4);
        g.fillStyle = cur ? BG : CREAM; g.fillText(w.w, x, y); x += ws[i] + gap;
      });
    });
    g.restore();
  }

  /* ---------- the picture ---------- */
  var NOISE, HOME, POSTERMODE = false;
  function stage(g) { g.fillStyle = BG; g.fillRect(0, 0, W, H); }
  function boxRim(g) {
    /* the cardboard box: a kraft rim with a pale cut edge and an inner shadow, so it reads as a box you could pick up */
    g.save();
    var gr = g.createLinearGradient(0, BY0, 0, BY0 + 40); gr.addColorStop(0, 'rgba(0,0,0,.45)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(BX0, BY0, BX1 - BX0, 40);
    gr = g.createLinearGradient(BX0, 0, BX0 + 30, 0); gr.addColorStop(0, 'rgba(0,0,0,.4)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(BX0, BY0, 30, BY1 - BY0);
    gr = g.createLinearGradient(BX1, 0, BX1 - 30, 0); gr.addColorStop(0, 'rgba(0,0,0,.4)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(BX1 - 30, BY0, 30, BY1 - BY0);
    g.fillStyle = '#7a4d27'; g.fillRect(BX0, BY0, BX1 - BX0, 12); g.fillRect(BX0, BY0, 12, BY1 - BY0); g.fillRect(BX1 - 12, BY0, 12, BY1 - BY0); g.fillRect(BX0, BY1 - 12, BX1 - BX0, 12);
    g.strokeStyle = 'rgba(255,236,205,.55)'; g.lineWidth = 2; g.strokeRect(BX0 + 12, BY0 + 12, BX1 - BX0 - 24, BY1 - BY0 - 24);
    g.restore();
  }
  function frame(g, t) {
    g.setTransform(1, 0, 0, 1, 0, 0);
    stage(g);
    var C = cam(t);
    g.save(); g.beginPath(); g.rect(BX0, BY0, BX1 - BX0, BY1 - BY0); g.clip();
    /* the workbench, only while the camera is pulled back */
    if (C.Pk > 0) {
      put(g, P.bench, 0, 0);
      put(g, P.rule, 120, 340, .02);
    }
    /* the box (outer camera) */
    g.save(); g.translate(CX, BY0); g.scale(C.P, C.P); g.translate(-CX, -BY0);
    if (C.Pk > 0) { g.fillStyle = 'rgba(0,0,0,.45)'; g.fillRect(BX0 + 14, BY0 + 20, BX1 - BX0, BY1 - BY0); }
    g.save(); g.beginPath(); g.rect(BX0, BY0, BX1 - BX0, BY1 - BY0); g.clip();
    g.fillStyle = '#120a2c'; g.fillRect(BX0, BY0, BX1 - BX0, BY1 - BY0);
    var seam = 950 - 880 * C.k;
    if (C.k < 1) { g.save(); g.beginPath(); g.rect(BX0, BY0, seam - 18 - BX0, BY1 - BY0); g.clip(); g.translate(-880 * C.k, 0); swamp(g, t, C); g.restore(); }
    if (C.k > 0) { g.save(); g.beginPath(); g.rect(seam + 18, BY0, BX1 - seam - 18, BY1 - BY0); g.clip(); g.translate(880 * (1 - C.k), 0); keys(g, t, C); g.restore(); }
    if (C.k > 0 && C.k < 1) { g.save(); g.shadowColor = 'rgba(0,0,0,.5)'; g.shadowBlur = 18; g.shadowOffsetX = 8; g.fillStyle = '#7a4d27'; g.fillRect(seam - 20, BY0, 40, BY1 - BY0); g.restore(); g.fillStyle = 'rgba(255,236,205,.5)'; g.fillRect(seam - 20, BY0, 2, BY1 - BY0); g.fillRect(seam + 18, BY0, 2, BY1 - BY0); }
    g.restore();
    boxRim(g);
    /* the GTA 6 label on the rim; the date sticker beside it at the end */
    putW(g, P.label, 108, 312, -.015, kn(t, at('hook', 'gta'), .1));
    if (t > T.dateIn && t < HOME + .02) { var dk = cd(t, T.dateIn, 14), da = 1 - seg(t, HOME - .25, HOME); g.save(); g.globalAlpha *= da; NOREC = dk < .98; putW(g, P.date, 108 + P.label.tw + 18, 312 + (1 - dk) * -60, .02); NOREC = false; g.restore(); }
    g.restore();
    /* the dip's payoff: something huge and unresolved crosses the lens, then is gone */
    if (t > T.pass && t < T.pass + 1) { var pu = seg(t, T.pass, T.pass + 1), pe = eio(pu) * .7 + pu * .3; put(g, P.lens, lerp(1560, -540, pe), 930 + 70 * Math.sin(pu * Math.PI), -.12 + .2 * pu, 1.05); }
    /* the glass: quote strips, the hero stamp, chips */
    stripAt(g, t, P.s1, CX, 1236, T.s1In, T.s1Out, { src: 'ROCKSTARGAMES.COM/VI · GRASSRIVERS', srcT: T.s1Src, srcW: 520, knock: T.slap, slap: T.slap });
    stamp(g, t);
    if (t > T.chip - .02 && t < T.chipOut + .3) { var ck = cd(t, T.chip, 14); NOREC = ck < .98; chip(g, 'ROCKSTAR DOESN’T SAY', 380, 1035 + (1 - ck) * 120, { px: 46, bg: CREAM, fg: INK, a: fin(t, T.chip, .08) * (1 - seg(t, T.chipOut, T.chipOut + .25)), rot: -.02, s: kn(t, T.chip + .1, .05) }); NOREC = false; }
    stripAt(g, t, P.s2, 682, 600, T.s2In, T.s2Out, { from: 300, rot: .012, dir: -1, src: 'ROCKSTARGAMES.COM/VI', srcT: T.s2In + .5, srcX: 20 });
    stripAt(g, t, P.s3a, 700, 1345, T.s3aIn, T.s3aOut, { from: 260, rot: -.03, dir: -1 });
    stripAt(g, t, P.s3b, CX, 690, T.s3bIn, T.s3bOut, { from: 300, rot: .01, src: 'ROCKSTARGAMES.COM/VI · LEONIDA KEYS', srcT: T.s3bIn + .4, srcW: 540 });
    /* the real-world card, on the bench, clipped to the box's front edge */
    if (t > T.card - .02 && t < T.cardOut + .6) {
      var kk = cd(t, T.card, 12), ok = eio(seg(t, T.cardOut, T.cardOut + .5)), cy = lerp(1700, 1222, kk) + ok * 520 + 8 * kn(t, T.clip, .4) - 8;
      NOREC = kk < .98 || ok > 0;
      g.save(); g.translate(CX, cy); g.rotate(-.012 + ok * .08); var cks = kn(t, at('theory', 'everglades'), .035); g.scale(cks, cks); putW(g, P.card, 0, 0);
      /* the pencil underlines PYTHONS as it is said (graphite: our own card, not a quote) */
      var U = P.card.ul, ul = seg(t, T.ul0, T.ul1);
      if (ul > 0) { g.save(); g.strokeStyle = 'rgba(55,55,70,.9)'; g.lineWidth = 5; g.lineCap = 'round'; g.beginPath(); g.moveTo(U[0], U[2]); for (var ux = 0; ux <= (U[1] - U[0]) * ul; ux += 12) g.lineTo(U[0] + ux, U[2] + Math.sin(ux * .045) * 2.2); g.lineTo(U[0] + (U[1] - U[0]) * ul, U[2] + Math.sin((U[1] - U[0]) * ul * .045) * 2.2); g.stroke(); g.restore(); }
      /* the source chip pops onto the card's corner */
      if (t >= T.nps) { var nk = cd(t, T.nps, 16); NOREC = NOREC || nk < .98; chip(g, 'NPS.GOV', 262, 138 - (1 - nk) * 40, { px: 42, bg: TEAL, fg: INK, a: fin(t, T.nps, .06), rot: .04, s: lerp(1.3, 1, nk) * kn(t, T.nps + .08, .06) }); }
      /* the paperclip, snapping on in the pause */
      var cl = cd(t, T.clip, 20);
      g.save(); g.translate(140, -196 + (1 - cl) * -30); g.strokeStyle = '#c9ccd8'; g.lineWidth = 6; g.lineCap = 'round'; g.globalAlpha = fin(t, T.clip - .05, .06);
      g.beginPath(); g.moveTo(-14, 70); g.lineTo(-14, -10); g.arc(0, -10, 14, Math.PI, 0); g.lineTo(14, 56); g.arc(4, 56, 10, 0, Math.PI); g.lineTo(-6, 4); g.stroke(); g.restore();
      var cr = -.012 + ok * .08, tipX = CX + cks * (U[0] * Math.cos(cr) - U[2] * Math.sin(cr)), tipY = cy + cks * (U[0] * Math.sin(cr) + U[2] * Math.cos(cr));
      g.restore(); NOREC = false;
    }
    /* the pencil: rests on the mat, comes over to underline PYTHONS, goes back */
    if (C.Pk > 0) {
      var go = eio(seg(t, T.ul0 - .3, T.ul0)) * (1 - eio(seg(t, T.ul1 + .05, T.ul1 + .45))), wl = (P.card.ul[1] - P.card.ul[0]) * seg(t, T.ul0, T.ul1);
      var px1 = (tipX || 0) + wl, py1 = (tipY || 0) + Math.sin(wl * .045) * 2.2 - 3;
      var ptx = lerp(812, px1, go), pty = lerp(640, py1, go) - 30 * Math.sin(go * Math.PI), pa = lerp(Math.PI / 2, 2.4, go);
      g.save(); g.translate(ptx, pty); g.rotate(pa); put(g, P.pencil, -240, 0); g.restore();
    }
    g.restore();
    if (!POSTERMODE && LIVE.text) captions(g, t);
    if (LIVE.grain && NOISE) { g.globalAlpha = .05; g.globalCompositeOperation = 'overlay'; var o = Math.floor(t * 24) * 37 % 256; g.fillStyle = g.createPattern(NOISE, 'repeat'); g.translate(-o, -o); g.fillRect(o, o, W, H); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }
  }
  function TEXTS(t) {
    var o = [];
    function Tx(id, text, a, b) { if (t >= a && t < b) o.push({ id: id, text: text, x0: 0, y0: 0, x1: 0, y1: 0 }); }
    var C = cam(t);
    Tx('label', 'GTA 6 GATORS', 0, DUR + 1);
    Tx('sign', 'DON’T SWIM', 0, T.dip0 + .4); Tx('sign', 'DON’T SWIM', T.rise0 + .4, T.slide0 + .1);
    Tx('sign', 'DON’T SWIM', T.slideB + .5, DUR + 1);
    Tx('tagGR', 'GRASSRIVERS', T.tagIn + .25, T.tagOut + .1);
    Tx('s1', P.s1.lines.join(' '), T.s1In + .15, T.s1Out + .05);
    Tx('s1src', 'ROCKSTARGAMES.COM/VI · GRASSRIVERS', T.s1Src + .1, T.s1Out + .05);
    Tx('stamp', 'NOT THE DEADLIEST', T.stamp + .05, T.stampOut);
    Tx('chip', 'ROCKSTAR DOESN’T SAY', T.chip + .1, T.chipOut);
    Tx('s2', P.s2.lines.join(' '), T.s2In + .15, T.s2Out + .05);
    Tx('s2src', 'ROCKSTARGAMES.COM/VI', T.s2In + .6, T.s2Out + .05);
    Tx('ktag', 'LEONIDA KEYS', T.kTag + .2, T.slideB + .1);
    Tx('s3a', P.s3a.lines.join(' '), T.s3aIn + .15, T.s3aOut + .05);
    Tx('s3b', P.s3b.lines.join(' '), T.s3bIn + .15, T.s3bOut + .05);
    Tx('s3src', 'ROCKSTARGAMES.COM/VI · LEONIDA KEYS', T.s3bIn + .5, T.s3bOut + .05);
    Tx('c1', 'THEORY · OUR GUESS', T.card + .3, T.cardOut);
    Tx('c2', 'REAL WORLD', T.card + .3, T.cardOut);
    Tx('c3', 'REAL EVERGLADES: BURMESE PYTHONS', T.card + .3, T.cardOut);
    Tx('c4', 'NPS.GOV', T.nps + .1, T.cardOut + .1);
    Tx('date', 'NOV 19, 2026', T.dateIn + .1, HOME);
    return o;
  }

  /* ---------- events: hits placed in real pauses of the voice (vo/vad.js); beats with no free pause stay silent ---------- */
  function initTimes() {
    HOME = DUR - .45;
    /* frame 0: a water drip before the first word, quieter than it; the gator and the shape are already moving */
    G('on', .02, 'drip', .06, .6);
    /* stake: the tag drops in the gap before "Grassrivers"; the head lifts on "gators";
       the shape swells under the gator on "deadliest"; the tail flicks on "thing." */
    T.tagIn = G('rustle', at('stake', 'grassrivers') - .45, 'rustle', .25, .8);
    T.head = at('stake', 'gators') - .04;
    /* bubbles break off the shape in the pause after "thing.", with a low blub */
    T.bub0 = G('blub', lastw('stake') + .3, 'drip', .3, .9);
    T.swell = at('stake', 'deadliest') - .02;
    T.flick = at('stake', 'thing') + .05;
    /* quote: the tag lifts on "Rockstar's" */
    /* the strip lands on "words:", its source chip follows; the shape slides in under the gator on "deadlier",
       the head lifts on "predators", a third strip of tape slaps across on "weirder" */
    T.s1In = at('quote', 'words') - .02;
    T.s1Src = T.s1In + .5;
    T.head2 = at('quote', 'predators') - .04;
    T.slap = at('quote', 'weirder') + .08;
    T.tagOut = at('quote', 'rockstars') - .05;
    T.lurch = at('quote', 'deadlier'); T.snap = at('quote', 'discoveries') - .05;
    /* hero: the stamp in the written pause after "discoveries.", beside the gator, above the water */
    T.stamp = G('stamp', Math.max(after('quote'), lastw('quote') + .45), 'stamp', .2, 1.2, { heavy: true });
    T.stY = 664;
    /* ask: push in; the head dips on "what"; the ? tag rises beside the shape; the strip peels after "say."; the chip lands */
    T.push0 = start('ask') - .05; T.headD = at('ask', 'what') - .05; T.qIn = at('ask', 'what');
    T.shift2 = at('ask', 'they');
    /* the chip slaps on (paper sound) after "say."; the quote strip stays up long enough to read, then peels silently */
    T.chip = G('peel', after('ask'), 'peel', .25, .9) + .12;
    T.s1Out = T.s1In + 7.95; T.stampOut = start('beneath') - .05;
    /* beneath: the second strip on "says"; the dip on "beneath"; a swell and bubbles in the pause */
    T.s2In = at('beneath', 'says');
    T.dip0 = at('beneath', 'beneath') - .1;
    T.chipOut = T.dip0 + .5;
    T.bub = G('swell', after('beneath'), 'swell', .2, 1);
    T.pass = T.bub - .12;
    /* keys: slide along the track (still under water), rise on "Keys,"; the sign pops up; the chair rocks on "look" */
    T.slide0 = start('keys') - .32;
    G('whoosh', T.slide0 - .17, 'whoosh', .12, .7);
    T.rise0 = wend('keys', 'keys') - .02;
    T.kTag = T.rise0 + .3;
    T.s2Out = at('keys', 'rockstar') + .3;
    T.look = at('keys', 'look'); T.s3aIn = at('keys', 'look') - .05;
    /* waters: the long strip on "The"; tilt on "beautiful"; a shadow passes under the waves on "dangerous"; splash */
    T.s3bIn = start('waters') - .05; T.tilt0 = at('waters', 'beautiful');
    T.shad = at('waters', 'dangerous') - 1.2;
    T.s3aOut = Math.max(T.s3aIn + 2.5, at('waters', 'dangerous'));
    T.splash = G('splash', after('waters'), 'splash', .2, 1);
    T.tiltB = T.splash + .12; T.slideB = T.splash + .4;
    /* theory: pull back out of the box on "guess"; the card rises onto the bench; the paperclip snaps in the pause */
    T.pull0 = Math.max(at('theory', 'guess') - .12, T.slideB + .5); T.card = at('theory', 'guess') + .05;
    T.s3bOut = at('theory', 'everglades') + .05;
    T.ul0 = at('theory', 'burmese'); T.ul1 = at('theory', 'pythons') + .05;
    T.nps = at('theory', 'pythons') + .2;
    T.clip = G('click', after('theory'), 'click', .2, 1);
    /* end: the card drops away on "think"; back into the box; the shape settles back; the date sticker; home */
    T.dateIn = start('end') - .08;
    T.cardOut = at('end', 'think') + .15;
    T.in0 = at('end', 'what') - .1;
    T.reset = at('end', 'think');
    G('home', lastw('end') + .25, 'swish', .2, .6);
    /* two pink highlights in the whole film, no more: the claim and the guess */
    STRESS = [['stake', 'deadliest'], ['theory', 'guess']].map(function (p) { return at(p[0], p[1]); });
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

  /* ---------- sound: paper and water foley, written into the pauses; no music (Isac adds a TikTok sound) ---------- */
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
    function tick(t, g) { var n = noise(t, .03), bp = ac.createBiquadFilter(); bp.type = 'highpass'; bp.frequency.value = 3200; var o = bus(1, (rnd() - .5) * .3); n.connect(bp); bp.connect(o); env(o.gain, [[t, 0], [t + .003, .16 * (g || 1)], [t + .024, 0]]); }
    function thump(t, g, f) { var o = osc2('sine', f || 150, t, t + .2, [[t, 0], [t + .004, g || .4], [t + .14, 0]]); o.frequency.exponentialRampToValueAtTime(50, t + .12); }
    function drip(t, g) { var o = osc2('sine', 1400, t, t + .08, [[t, 0], [t + .003, .2 * g], [t + .06, 0]]); o.frequency.exponentialRampToValueAtTime(520, t + .05); band(t, t + .05, 900, 600, .03 * g, .0, 1.5, 0, 'lowpass'); }
    /* a long low thump: sine sweep with a slow tail (the hero stamp, the thing passing the lens) */
    function boom(t, g, f0, f1, dur) { var o = osc2('sine', f0, t, t + dur + .05, [[t, 0], [t + .006, g], [t + dur * .35, g * .55], [t + dur, 0]]); o.frequency.exponentialRampToValueAtTime(f1, t + dur * .8); }
    function stamp(t, g, heavy) { thump(t, .7 * g); if (heavy) boom(t + .01, .55 * g, 110, 42, .25); var sn = noise(t, .12), sl = ac.createBiquadFilter(); sl.type = 'lowpass'; sl.frequency.value = 1500; var so = bus(1); sn.connect(sl); sl.connect(so); env(so.gain, [[t, 0], [t + .004, .32 * g], [t + .1, 0]]); }
    function paper(t, g) { band(t, t + .18, 2500, 4500, .07 * g, .02 * g, 1.5); tick(t + .1, .25 * g); thump(t + .1, .18 * g); }
    function rustle(t, g) { for (var j = 0; j < 6; j++) tick(t + j * .03 + rnd() * .01, (.3 + rnd() * .3) * g); band(t, t + .18, 2000, 3800, .05 * g, .02 * g, 1.3); }
    function peel(t, g) { band(t, t + .22, 1400, 3600, .07 * g, .04 * g, 1.2); for (var j = 0; j < 7; j++) tick(t + .02 + j * .028 + rnd() * .008, (.2 + rnd() * .25) * g); }
    /* the dip: a muffled swell under the water, then bubbles rising */
    function swell(t, g) { band(t, t + .34, 160, 420, .22 * g, .05 * g, .8, 0, 'lowpass'); thump(t + .02, .35 * g, 70); boom(t + .1, .5 * g, 68, 34, .34);
      for (var j = 0; j < 5; j++) { var tb = t + .2 + j * .055 + rnd() * .02, o = osc2('sine', 360 + rnd() * 200, tb, tb + .05, [[tb, 0], [tb + .004, .07 * g], [tb + .04, 0]]); o.frequency.exponentialRampToValueAtTime(1100 + rnd() * 500, tb + .04); } }
    function whoosh(t, g) { band(t, t + .26, 500, 2200, .08 * g, .02 * g, 1.2, -.3); band(t + .02, t + .26, 300, 900, .05 * g, .01, .9, .3, 'lowpass'); }
    function splash(t, g) { band(t, t + .3, 2400, 700, .12 * g, .02 * g, .9); band(t, t + .12, 600, 300, .1 * g, .02 * g, .8, 0, 'lowpass'); for (var j = 0; j < 5; j++) tick(t + .05 + j * .04 + rnd() * .02, (.2 + rnd() * .3) * g); }
    function click(t, g) { tick(t, 1.1 * g); osc2('sine', 2900, t, t + .07, [[t, 0], [t + .002, .06 * g], [t + .05, 0]]); osc2('sine', 4300, t + .01, t + .06, [[t + .01, 0], [t + .012, .03 * g], [t + .05, 0]]); thump(t, .06 * g, 500); }
    var LEVEL = { drip: 1, stamp: .5, paper: 1.8, rustle: 1.6, peel: 2.4, swell: 1.4, whoosh: 3, splash: 2, click: 1.6, swish: 10 };
    /* per-hit trims from the final-mix measurement: each hit 3 dB or more under its neighbouring words */
    var TRIM = window.SFX_TRIM || { stamp: -.5, swell: -4, click: 4, blub: 2, peel: 5, rustle: 5, whoosh: 6, splash: 11, home: 2, on: 2 };
    EV.forEach(function (e) {
      var g = (e.g == null ? 1 : e.g) * (LEVEL[e.type] || 1) * Math.pow(10, (TRIM[e.id] || 0) / 20);
      if (e.type === 'drip') drip(e.t, g);
      else if (e.type === 'stamp') stamp(e.t, g, e.heavy);
      else if (e.type === 'paper') paper(e.t, g);
      else if (e.type === 'rustle') rustle(e.t, g);
      else if (e.type === 'peel') peel(e.t, g);
      else if (e.type === 'swell') swell(e.t, g);
      else if (e.type === 'whoosh') whoosh(e.t, g);
      else if (e.type === 'splash') splash(e.t, g);
      else if (e.type === 'click') click(e.t, g);
      else if (e.type === 'swish') band(e.t, e.t + .24, 900, 5200, .1 * g, .02, 1.6);
    });
    /* no music: Isac adds a trending sound on the platform; the film ships voice + sound effects */
    var MUSIC = false;
    if (MUSIC) { /* intentionally empty */ }
    /* room tone: a night swamp, low water and air, so the loop seam is never digital zero */
    (function () { var o = bus(1), lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 700; lp.Q.value = .5;
      var n = noise(0, DUR); n.connect(lp); lp.connect(o); o.gain.value = window.ROOM_GAIN || .048; })();
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

  initTimes();
  var POSTER_T = Math.min(T.stamp + .3, start('ask') - .08);
  window.FILM = { bare: function () { ctx.setTransform(1, 0, 0, 1, 0, 0); stage(ctx); }, W: W, H: H, DUR: DUR, POSTER: POSTER_T, SLUG: 'gta-gators', SHOTS: [{ id: 'swamp', name: 'Grassrivers', t0: 0, t1: T.slide0 }, { id: 'keys', name: 'The Keys', t0: T.slide0, t1: T.slideB }, { id: 'bench', name: 'Our guess', t0: T.slideB, t1: DUR }], init: init, render: render, frame: frame, LIVE: LIVE, T: T, GT: GT };
  window.BOUNDS_RUN = function (step) {
    BOUNDS = []; var o = {};
    for (var t = 0; t <= DUR + 1e-6; t += step || 1 / 15) { CURT = t; POSTERMODE = false; frame(ctx, t); }
    BOUNDS.forEach(function (b) { var r = o[b.text] || (o[b.text] = { text: b.text, from: b.t, to: b.t, x0: b.x0, x1: b.x1, y1: b.y1, n: 0 }); r.to = b.t; r.n++; r.x0 = Math.min(r.x0, b.x0); r.x1 = Math.max(r.x1, b.x1); r.y1 = Math.max(r.y1, b.y1); });
    BOUNDS = null; return Object.keys(o).map(function (k) { return o[k]; });
  };
  window.DUR = DUR; window.EV = EV; window.TEXTS = TEXTS; window.SCORE = SCORE; window.READY = false;
  window.render = function (t, s, sh, fps) { render(t, s, sh, fps); };
})();
