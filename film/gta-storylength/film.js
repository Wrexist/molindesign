/* "How long is GTA 5's story? Guess.": Delta, pillar 2 (GTA 5 for everyone). Round 3: a new set.
   A vertical film written in code, narrated first and cut to the voice: every visual beat is keyed to a word time from
   vo/vo.js (window.VO) with at(id, word). Pure function of t. Contract: window.FILM, DUR, render(t), READY, EV, TEXTS(t),
   SCORE(ctx). HowLongToBeat players' averages for Grand Theft Auto V (howlongtobeat.com/game/4064, re-read 2026-11-17):
   Main Story 32 Hours, Completionist 89½ Hours. Derived: 89.54 / 32.06 = 2.79, "nearly three times" (3 x 32 = 96 > 89½).
   GTABase 100% guide (re-read 2026-11-17): Story Missions 55% (69 on the checklist), Strangers and Freaks 10%, Hobbies and
   Pastimes 10%, Random Events 5%, Miscellaneous 20%. Nothing about GTA 6's length. The set is a top-down desk at night;
   the heroes are a paper stopwatch with a 0-100 hour dial (native move: the hand paints the hours as rings), the 100%
   punch card (each square = 1% of the completion score) and the pick-one box. Engine from film/gta-outsold.
   No logos, key art, likenesses, footage or music. */
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
  var BODY = { snip: .16, pin: .1, creak: .24, pop: .12, stab: .1, stamp: .27, swish: .26, slap: .14, snap: .16, door: .12, chime: .5, click: .08, tick: .05, fold: .3 };
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
    var a = Math.min.apply(null, xs), b = Math.max.apply(null, xs), c = Math.max.apply(null, ys), d = Math.min.apply(null, ys);
    /* wholly outside the clipped rail (off camera, behind the clip): not drawn, nothing to check */
    if (d > BY1 || b < SAFE.x0 || a > SAFE.x1) return;
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
  function rect(x0, y0, x1, y1) { return function (g) { g.beginPath(); g.rect(x0, y0, x1 - x0, y1 - y0); }; }
  function grad(y0, y1, stops) { return function (g) { var gr = g.createLinearGradient(0, y0, 0, y1); stops.forEach(function (s) { gr.addColorStop(s[0], s[1]); }); return gr; }; }
  /* a printed card that carries words: lines = [[text, px, color, dy]] centred; bg color; returns a piece with word boxes */
  function cardPiece(w, h, bg, lines, o) {
    o = o || {}; var rec = [];
    var pc = piece([-w / 2, -h / 2, w / 2, h / 2], o.path || function (g) { rr(g, -w / 2, -h / 2, w, h, o.r == null ? 10 : o.r); }, bg, { sy: o.sy == null ? 9 : o.sy, blur: 12, extra: function (g) {
      if (o.before) o.before(g);
      if (o.ring) { g.strokeStyle = o.ring; g.lineWidth = 4; rr(g, -w / 2 + 9, -h / 2 + 9, w - 18, h - 18, 6); g.stroke(); }
      lines.forEach(function (L) { cond(g, L[4]); font(g, L[1], 900); ls(g, 1); g.fillStyle = L[2]; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(L[0], L[5] || 0, L[3]); var mm = g.measureText(L[0]); rec.push([(L[5] || 0) - mm.width / 2, L[3] - L[1] * .55, (L[5] || 0) + mm.width / 2, L[3] + L[1] * .45, L[0]]); unst(g); });
      if (o.after) o.after(g);
    } });
    pc.words = rec.map(function (r0) { return [r0[0] - pc.x0, r0[1] - pc.y0, r0[2] - pc.x0, r0[3] - pc.y0, r0[4]]; });
    return pc;
  }

  function wordsOf(pc, rec) { pc.words = rec.map(function (r0) { return [r0[0] - pc.x0, r0[1] - pc.y0, r0[2] - pc.x0, r0[3] - pc.y0, r0[4]]; }); return pc; }
  function hash(i) { var x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }

  /* condensed sticker type (thick ink outline + drop shadow) */
  function stk(g, s, x, y, px, o) {
    o = o || {}; px = Math.max(36, px);
    g.save(); cond(g, o.st || 'condensed'); font(g, px, 900); ls(g, o.ls == null ? 1 : o.ls);
    g.textAlign = o.align || 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round'; g.miterLimit = 2;
    var lw = o.lw == null ? Math.max(5, px * .13) : o.lw, ink = o.ink || INK;
    g.translate(x, y); if (o.rot) g.rotate(o.rot);
    if (o.shadow !== false) { g.lineWidth = lw; g.strokeStyle = ink; g.fillStyle = ink; g.strokeText(s, px * .05, px * .08); g.fillText(s, px * .05, px * .08); }
    if (lw) { g.lineWidth = lw; g.strokeStyle = ink; g.strokeText(s, 0, 0); }
    g.fillStyle = o.col || CREAM; g.fillText(s, 0, 0);
    var w = g.measureText(s).width; g.restore(); unst(g); return w;
  }
  function stkW(s, px, st) { var m = mk(4, 4).getContext('2d'); cond(m, st || 'condensed'); font(m, px, 900); ls(m, 1); var w = m.measureText(s).width; unst(m); return w; }
  /* slam: lands from big in 0.14 s with a small recoil; u = seconds since it started; o.out = seconds until it leaves */
  function slam(g, s, x, y, px, u, o) {
    if (u < 0) return; o = o || {};
    var k = eo(clamp(u / .14, 0, 1)), ok = o.out != null ? 1 - eio(seg(u, o.out, o.out + .2)) : 1; if (ok <= 0) return;
    var sc = (lerp(o.from || 1.45, 1, k) - .1 * Math.sin(Math.PI * seg(u, .12, .3))) * ok;
    g.save(); g.globalAlpha *= clamp(u / .05, 0, 1); g.translate(x, y); g.rotate((o.rot == null ? -.04 : o.rot) * (1 + (1 - k) * 3)); g.scale(sc, sc);
    var nr = NOREC; NOREC = nr || k < 1 || ok < 1; stk(g, s, 0, 0, px, o); NOREC = nr; g.restore();
  }
  function buildStamp(lines, px, maxw, col) {
    col = col || HOT;
    var m = mk(4, 4).getContext('2d'); cond(m); font(m, px, 900); ls(m, 2); var w1 = Math.max.apply(null, lines.map(function (L) { return m.measureText(L).width; })); unst(m);
    if (w1 > maxw) { px = Math.floor(px * maxw / w1); cond(m); font(m, px, 900); ls(m, 2); w1 = Math.max.apply(null, lines.map(function (L) { return m.measureText(L).width; })); unst(m); }
    var lh = px * 1.02, w = w1 + 56, h = lines.length * lh + 56, tp = jag(95, w, 4), bt = jag(96, w, 4), rec = [];
    var pc = piece([-w / 2, -h / 2 - 8, w / 2, h / 2 + 8], function (g) { g.beginPath(); g.moveTo(-w / 2, -h / 2 + tp[0][1]); tp.forEach(function (q) { g.lineTo(-w / 2 + q[0], -h / 2 + q[1]); }); for (var i = bt.length - 1; i >= 0; i--) g.lineTo(-w / 2 + bt[i][0], h / 2 + bt[i][1]); g.closePath(); }, NEWS, { sx: 6, sy: 12, blur: 16, extra: function (g) {
      var r = mulberry(91);
      g.strokeStyle = col; g.lineWidth = 9; g.strokeRect(-w / 2 + 12, -h / 2 + 14, w - 24, h - 28);
      lines.forEach(function (L, i) { var y = -h / 2 + 28 + lh * (i + .5); inkText(g, L, 0, y + 2, px, col, 93 + i, { dense: 26, big: 2.2, ls: 2 }); var lw = (function () { var q = mk(4, 4).getContext('2d'); cond(q); font(q, px, 900); ls(q, 2); var ww = q.measureText(L).width; unst(q); return ww; })(); rec.push([-lw / 2, y - px * .5, lw / 2, y + px * .45, L]); });
      g.globalCompositeOperation = 'destination-out';
      for (var i = 0; i < 520; i++) { g.globalAlpha = .2 + r() * .5; g.beginPath(); g.arc(-w / 2 + 16 + r() * (w - 32), -h / 2 + 14 + r() * (h - 28), .5 + r() * 1.8, 0, TAU); g.fill(); }
    } });
    wordsOf(pc, rec); pc.sw = w; pc.sh = h; return pc;
  }
  BODY.tear = .1; BODY.thock = .12; BODY.pop = .1; BODY.clank = .32; BODY.stamp = .18; BODY.swish = .26; BODY.skid = .18; BODY.buzz = .14; BODY.siren = .11; BODY.slap = .1; BODY.crawl = .15;

  /* =====================================================================================================
     THE SET (round 3): a top-down desk at night. A cobalt paper desk mat with a halftone light pool, a mug with
     paper steam, a pencil, a notebook's spiral and a cable along the edges; it bleeds the frame and carries no
     words. Heroes: a paper stopwatch whose dial is marked 0-100 HOURS (the hand paints the hours as rings), the
     100% punch card (each square = 1% of the completion score), and the pick-one box. No logos, key art,
     likenesses, footage or music.
     ===================================================================================================== */
  var COB = '#2546b4', COB2 = '#17307f', MINT = '#3fd3ad', MINT2 = '#1f9a7c', YEL = '#ffc83d', YEL2 = '#eea51c', YEL3 = '#ffdc70',
      CORAL = '#ff5a6e', LILAC = '#b9a3ff', BLUE = '#7cc4ff', PADC = '#f6ecd8', INK2 = '#2a1850', RED = '#e0283c', DOME = '#ff4f5e', BOXC = '#cf9452';
  var RD = 160, IN0 = 170, IN1 = 245, OU0 = 255, OU1 = 332, FACE = 360, BEZ = 400;
  var P0 = { x: 510, y: 1030, s: 1 }, P1 = { x: 418, y: 880, s: .74 }, P3 = { x: 510, y: 1080, s: .86 };
  var TAGL = [210, -345], TAGSRC = [418, 1258];
  var SECT = [['STORY MISSIONS · 69', 55, YEL], ['STRANGERS & FREAKS', 10, TEAL], ['HOBBIES & PASTIMES', 10, LILAC], ['RANDOM EVENTS', 5, BLUE], ['MISCELLANEOUS', 20, ORG]];
  var CAT0 = [0, 55, 65, 75, 80], CATN = [55, 10, 10, 5, 20];
  var T = {}, LIVE2 = { bg: true, clip: true }, SPIN = 220;

  function tq(t) { return (Math.floor(t * 30) + .5) / 30; }
  function pol(r, h) { var a = h / 100 * TAU; return [r * Math.sin(a), -r * Math.cos(a)]; }
  function e3o(k) { return 1 - Math.pow(1 - k, 3); }
  function e3i(k) { return k * k * k; }
  function flipK(t, a) { var d = Math.abs(t - a); return d >= .12 ? 1 : Math.max(.04, d / .12); }

  function buildTextures() { GRAIN = buildGrain(); buildSet(); }
  function buildSet() {
    P.desk = buildDesk(); P.note = buildNote();
    P.sw = buildWatch();
    P.disc = piece([-RD, -RD, RD, RD], function (g) { g.beginPath(); g.arc(0, 0, RD, 0, TAU); }, PADC, { sx: 3, sy: 6, blur: 10, edge: false, extra: function (g) {
      g.strokeStyle = INK; g.lineWidth = 7; g.beginPath(); g.arc(0, 0, RD - 4, 0, TAU); g.stroke();
      g.strokeStyle = 'rgba(29,18,51,.18)'; g.lineWidth = 2; g.beginPath(); g.arc(0, 0, RD - 18, 0, TAU); g.stroke();
    } });
    P.tag = cardPiece(380, 132, CREAM, [["PLAYERS' AVERAGE", 46, INK, -28], ['HOWLONGTOBEAT', 46, HOT, 30]], { r: 8, ring: YEL });
    P.sticky = cardPiece(250, 200, '#ffe66b', [['YOUR GUESS?', 44, INK, -44], ['____ H', 72, INK2, 34]], { r: 3, sy: 10, before: function (g) { g.fillStyle = 'rgba(0,0,0,.06)'; g.fillRect(-125, -100, 250, 26); } });
    var tj = jag(55, 190, 3);
    P.tape5 = wordsOf(piece([-95, -36, 95, 36], function (g) { g.beginPath(); g.moveTo(-95, -32); g.lineTo(95, -32); for (var y = -32; y <= 32; y += 8) g.lineTo(95 + ((y * 7) % 5), y); g.lineTo(-95, 32); for (y = 32; y >= -32; y -= 8) g.lineTo(-95 - ((y * 5) % 4), y); g.closePath(); }, 'rgba(244,230,196,.97)', { sx: 2, sy: 4, blur: 6, extra: function (g) {
      g.fillStyle = 'rgba(120,90,40,.08)'; for (var i = 0; i < 9; i++) g.fillRect(-95 + i * 22, -32, 2, 64);
      cond(g); font(g, 54, 900); ls(g, 2); g.fillStyle = INK; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('GTA 5', 0, 3); unst(g);
    } }), [[-62, -24, 62, 24, 'GTA 5']]);
    P.st3 = buildStamp(['NEARLY 3×'], 136, 520, RED);
    P.card = buildCard();
    P.jarLbl = cardPiece(150, 124, CREAM, [['3,398', 56, INK, -22], ['PLAYERS', 42, INK2, 30]], { r: 6, ring: 'rgba(29,18,51,.3)' });
    P.slip = ['#fbf0ea', '#ffe66b', '#bfe8ff', '#ffd0d8'].map(function (c, i) { return piece([-46, -29, 46, 29], function (g) { rr(g, -46, -29, 92, 58, 5); }, c, { ps: 1.2, sx: 2, sy: 4, blur: 5, edge: 1.4, extra: function (g) {
      g.strokeStyle = INK2; g.lineWidth = 3.5; g.beginPath(); g.arc(-18, 0, 15, 0, TAU); g.stroke(); g.beginPath(); g.moveTo(-18, 0); g.lineTo(-18, -10); g.moveTo(-18, 0); g.lineTo(-10 + i, 4); g.stroke();
      g.fillStyle = 'rgba(42,24,80,.55)'; rr(g, 4, -10, 26 + i * 4, 7, 3); g.fill(); rr(g, 4, 4, 16 + i * 3, 7, 3); g.fill();
    } }); });
    P.plate6 = cardPiece(300, 124, INK2, [['GTA 6', 84, CREAM, 4]], { r: 12, ring: 'rgba(251,240,234,.55)' });
    P.box = buildBox();
    P.plS = cardPiece(270, 110, CREAM, [['STORY', 72, INK, 4]], { r: 10, ring: INK2 });
    P.plC = cardPiece(270, 110, CREAM, [['100%', 72, INK, 4]], { r: 10, ring: INK2 });
  }

  /* the desk mat, drawn once: cobalt paper, a halftone pool, paper crumbs; props outside the rail carry no words */
  function buildDesk() {
    var c = mk(W, H), g = c.getContext('2d'), r = mulberry(19), x, y;
    var gr = g.createLinearGradient(0, 0, W, H); gr.addColorStop(0, '#2a4fc0'); gr.addColorStop(1, COB2); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    /* halftone dots, bigger toward the lamp at the upper middle */
    for (y = 10; y < H; y += 22) for (x = (y / 22 % 2) * 11; x < W; x += 22) {
      var d = Math.hypot(x - 560, (y - 820) * .7), s = clamp(4.2 - d / 210, .6, 4.2);
      g.fillStyle = 'rgba(160,190,255,.16)'; g.beginPath(); g.arc(x, y, s, 0, TAU); g.fill();
    }
    /* the pencil lying on the right edge */
    g.save(); g.translate(1010, 760); g.rotate(1.28);
    g.fillStyle = 'rgba(6,3,18,.35)'; g.fillRect(-190, -4, 380, 30);
    g.fillStyle = YEL; g.fillRect(-180, -14, 330, 28); g.fillStyle = YEL2; g.fillRect(-180, 4, 330, 10);
    g.fillStyle = '#f2c79a'; g.beginPath(); g.moveTo(150, -14); g.lineTo(200, 0); g.lineTo(150, 14); g.closePath(); g.fill();
    g.fillStyle = INK; g.beginPath(); g.moveTo(186, -4); g.lineTo(200, 0); g.lineTo(186, 4); g.closePath(); g.fill();
    g.fillStyle = '#c9ced6'; g.fillRect(-200, -14, 22, 28); g.fillStyle = '#ff8fa8'; rr(g, -232, -14, 34, 28, 8); g.fill();
    g.restore();
    /* the controller's cable coming in along the left edge (the controller is off the desk) */
    g.strokeStyle = '#111327'; g.lineWidth = 10; g.lineCap = 'round'; g.beginPath(); g.moveTo(-20, 980); g.bezierCurveTo(70, 1050, -10, 1160, 60, 1240); g.bezierCurveTo(110, 1300, 20, 1380, 40, 1480); g.stroke();
    g.strokeStyle = 'rgba(255,255,255,.12)'; g.lineWidth = 3; g.stroke();
    /* paper crumbs and a coffee ring, all outside the rail */
    g.strokeStyle = 'rgba(120,70,30,.35)'; g.lineWidth = 5; g.beginPath(); g.arc(1000, 320, 70, .3, 5.6); g.stroke();
    for (var i = 0; i < 40; i++) { x = r() < .5 ? r() * 80 : 940 + r() * 140; y = 300 + r() * 1150; g.fillStyle = r() < .5 ? 'rgba(251,240,234,.5)' : 'rgba(255,200,61,.45)'; g.save(); g.translate(x, y); g.rotate(r() * 6); g.fillRect(-3, -2, 5 + r() * 6, 3 + r() * 4); g.restore(); }
    g.globalAlpha = .7; g.fillStyle = g.createPattern(GRAIN, 'repeat'); g.fillRect(0, 0, W, H); g.globalAlpha = 1;
    return c;
  }
  /* the notebook along the bottom edge (its own piece: it slides down on the card beat) */
  function buildNote() {
    var c = mk(W, 620), g = c.getContext('2d'), x, y;
    g.translate(0, 40);
    /* the notebook along the bottom edge: a cream page with spiral rings */
    g.save(); g.translate(0, 0); g.rotate(-.04);
    g.fillStyle = 'rgba(6,3,18,.35)'; g.fillRect(-20, 14, 1140, 520);
    g.fillStyle = '#efe6d2'; g.fillRect(-20, 0, 1140, 520);
    g.fillStyle = 'rgba(70,110,200,.25)'; for (y = 60; y < 520; y += 44) g.fillRect(-20, y, 1140, 2);
    g.fillStyle = 'rgba(224,40,60,.35)'; g.fillRect(120, 0, 3, 520);
    for (x = 40; x < 1080; x += 58) { g.strokeStyle = '#9aa1ad'; g.lineWidth = 7; g.beginPath(); g.ellipse(x, 2, 12, 26, 0, Math.PI * .1, Math.PI * 1.1); g.stroke(); }
    g.restore();
    return c;
  }
  /* the stopwatch body: mint bezel, crown, side button, cream face with an hour tick every 5 h (0-100 h dial) */
  function buildWatch() {
    function path(g) {
      g.beginPath(); g.arc(0, 0, BEZ, 0, TAU);
      g.moveTo(-26, -440); g.lineTo(26, -440); g.lineTo(26, -396); g.lineTo(-26, -396); g.closePath();
      g.roundRect(-78, -486, 156, 52, 14);
      g.save(); var a = -.7; g.moveTo(Math.sin(a) * 392 - Math.cos(a) * 24, -Math.cos(a) * 392 - Math.sin(a) * 24);
      [[-24, 0], [24, 0], [24, 40], [-24, 40]].forEach(function (p) { var px = p[0], py = -392 - p[1]; g.lineTo(Math.cos(a) * px - Math.sin(a) * py, Math.sin(a) * px + Math.cos(a) * py); }); g.closePath(); g.restore();
    }
    return piece([-BEZ - 10, -490, BEZ + 10, BEZ + 10], path, MINT, { sx: 9, sy: 16, blur: 20, extra: function (g) {
      /* bezel shading: a lighter rim top-left, darker bottom-right */
      var sg = g.createLinearGradient(-BEZ, -BEZ, BEZ, BEZ); sg.addColorStop(0, 'rgba(255,255,255,.22)'); sg.addColorStop(.55, 'rgba(255,255,255,0)'); sg.addColorStop(1, 'rgba(0,40,30,.25)'); g.fillStyle = sg; g.fillRect(-BEZ - 10, -490, 2 * BEZ + 20, 2 * BEZ + 500);
      g.fillStyle = MINT2; for (var k = -3; k <= 3; k++) g.fillRect(k * 20 - 4, -484, 8, 48);
      g.save(); g.shadowColor = 'rgba(0,30,20,.45)'; g.shadowBlur = 14; g.shadowOffsetY = 5; g.fillStyle = PADC; g.beginPath(); g.arc(0, 0, FACE, 0, TAU); g.fill(); g.restore();
      g.strokeStyle = 'rgba(29,18,51,.14)'; g.lineWidth = 2; g.beginPath(); g.arc(0, 0, OU1 + 2, 0, TAU); g.stroke(); g.beginPath(); g.arc(0, 0, IN0 - 2, 0, TAU); g.stroke();
      for (var i = 0; i < 40; i++) {
        var maj = i % 10 === 0, mid = i % 2 === 0, a = i / 40 * TAU, r0 = maj ? 334 : mid ? 340 : 347, r1 = 356;
        g.strokeStyle = INK; g.lineWidth = maj ? 7 : mid ? 4 : 2.5; g.lineCap = 'round';
        g.beginPath(); g.moveTo(Math.sin(a) * r0, -Math.cos(a) * r0); g.lineTo(Math.sin(a) * r1, -Math.cos(a) * r1); g.stroke();
      }
      g.strokeStyle = 'rgba(0,40,30,.35)'; g.lineWidth = 4; g.beginPath(); g.arc(0, 0, FACE + 2, 0, TAU); g.stroke();
    } });
  }
  /* the punch card: cream card, notched corner, perforated edge (the header, cells and rows are drawn live) */
  function buildCard() {
    function path(g) { g.beginPath(); g.moveTo(-400 + 64, -450); g.lineTo(400, -450); g.lineTo(400, 450); g.lineTo(-400, 450); g.lineTo(-400, -450 + 64); g.closePath(); }
    return piece([-400, -450, 400, 450], path, PADC, { sx: 8, sy: 16, blur: 20, extra: function (g) {
      g.fillStyle = MINT; g.fillRect(-400, -450, 800, 16);
      g.fillStyle = 'rgba(29,18,51,.05)'; for (var y = -320; y < 440; y += 48) g.fillRect(-400, y, 800, 1);
      g.fillStyle = COB2; for (var y2 = -410; y2 < 440; y2 += 30) { g.beginPath(); g.arc(388, y2, 4, 0, TAU); g.fill(); }
      g.strokeStyle = 'rgba(29,18,51,.25)'; g.lineWidth = 2; g.beginPath(); g.moveTo(-380, 180); g.lineTo(380, 180); g.stroke();
    } });
  }
  /* the pick-one box: kraft box with a lighter top lip, screws and a little speaker grille */
  function buildBox() {
    return piece([-390, -24, 390, 335], function (g) { rr(g, -390, -24, 780, 359, 18); }, BOXC, { sx: 8, sy: 16, blur: 20, extra: function (g) {
      g.fillStyle = '#e6bb7f'; g.fillRect(-390, -24, 780, 56); g.fillStyle = 'rgba(60,30,10,.25)'; g.fillRect(-390, 30, 780, 6);
      g.strokeStyle = 'rgba(60,30,10,.14)'; g.lineWidth = 3; for (var x = -360; x < 390; x += 46) { g.beginPath(); g.moveTo(x, 40); g.lineTo(x + 14, 335); g.stroke(); }
      [[-360, 70], [360, 70], [-360, 305], [360, 305]].forEach(function (p) { g.fillStyle = '#9aa1ad'; g.beginPath(); g.arc(p[0], p[1], 11, 0, TAU); g.fill(); g.strokeStyle = '#5d6370'; g.lineWidth = 3; g.beginPath(); g.moveTo(p[0] - 6, p[1] - 6); g.lineTo(p[0] + 6, p[1] + 6); g.stroke(); });
      g.fillStyle = 'rgba(60,30,10,.4)'; for (var i = 0; i < 5; i++) for (var j = 0; j < 2; j++) { g.beginPath(); g.arc(-48 + i * 24, 290 + j * 22, 5, 0, TAU); g.fill(); }
    } });
  }

  /* ---------- the world: desk, the lamp's light pool, mug steam, drifting dust; periodic so the loop is seamless ---------- */
  function world(g, t) {
    g.drawImage(P.desk, 0, 0);
    var dn = 120 * eio(seg(t, T.roll, T.roll + .6)) * (1 - eio(seg(t, T.clO, T.clO + .6)));
    g.drawImage(P.note, 0, 1480 + dn);
    var lx = 540 + 60 * osc(t, 1, .4), ly = 860 + 40 * osc(t, 1, 1.9);
    var lg = g.createRadialGradient(lx, ly, 60, lx, ly, 760); lg.addColorStop(0, 'rgba(255,236,190,.16)'); lg.addColorStop(1, 'rgba(255,236,190,0)'); g.fillStyle = lg; g.fillRect(0, 0, W, H);
    /* the mug in the top-left corner, seen from above, with paper steam curls */
    g.save(); g.translate(40, 200);
    g.fillStyle = 'rgba(6,3,18,.35)'; g.beginPath(); g.arc(10, 14, 128, 0, TAU); g.fill();
    g.fillStyle = '#f4ead6'; g.beginPath(); g.arc(0, 0, 124, 0, TAU); g.fill(); g.fillStyle = '#5a3418'; g.beginPath(); g.arc(0, 0, 96, 0, TAU); g.fill();
    g.fillStyle = 'rgba(255,255,255,.18)'; g.beginPath(); g.ellipse(-30, -34, 40, 16, -.6, 0, TAU); g.fill();
    g.strokeStyle = '#f4ead6'; g.lineWidth = 26; g.beginPath(); g.arc(150, 30, 46, -1.2, 1.4); g.stroke();
    for (var k = 0; k < 3; k++) { var ph = (t / DUR * 9 + k / 3) % 1; g.save(); g.globalAlpha = .5 * Math.sin(Math.PI * ph); g.strokeStyle = '#fbf0ea'; g.lineWidth = 9; g.lineCap = 'round'; g.beginPath();
      for (var s2 = 0; s2 <= 12; s2++) { var yy = -10 - s2 * 9 - ph * 90, xx = 20 * Math.sin(s2 * .7 + ph * 6 + k * 2) + (k - 1) * 34; if (s2) g.lineTo(xx, yy); else g.moveTo(xx, yy); } g.stroke(); g.restore(); }
    g.restore();
    /* dust in the lamp light */
    for (var i = 0; i < 16; i++) { var dx = (hash(i * 3.1) * W + 40 * osc(t, 2 + i % 3, i)) % W, dy = 300 + hash(i * 7.7) * 1100 + 30 * osc(t, 3 + i % 2, i * 2); g.fillStyle = 'rgba(251,240,234,' + (.2 + .2 * hash(i)).toFixed(2) + ')'; g.beginPath(); g.arc(dx, dy, 2 + 2 * hash(i * 5), 0, TAU); g.fill(); }
  }

  /* =====================================================================================================
     THE STOPWATCH
     ===================================================================================================== */
  function stT(t) { return t >= T.seamC ? t - DUR : t; }
  function jit(st, a) { return st < a ? 0 : .35 * Math.sin((st - a) * 6.3) * (1 - Math.exp(-(st - a) * 3)); }
  function holdH(st) { var u = st - T.g0 - 1; return (SPIN * T.g0 + SPIN / 2) % 100 + 2.5 * Math.sin(u * 9) * Math.exp(-u * 2); }
  /* hand position in hours (0-100 around the dial): spins on the hook, slows on "Guess.", rewinds, paints 32, rewinds, paints 89½ */
  function handH(st) {
    if (st < T.g0) return SPIN * st;
    if (st < T.g0 + 1) { var u = st - T.g0; return SPIN * T.g0 + SPIN * (u - u * u / 2); }
    if (st < T.rw0) return holdH(st);
    if (st < T.sw0) return lerp(holdH(T.rw0), 0, eio(seg(st, T.rw0, T.rw0 + .32)));
    if (st < T.h100) return 32 * eio(seg(st, T.sw0, T.sw1)) + jit(st, T.sw1);
    if (st < T.s20) return lerp(32 + jit(T.h100, T.sw1), 0, eio(seg(st, T.h100, T.h100 + .3)));
    return 89.5 * eio(seg(st, T.s20, T.s21)) + jit(st, T.s21);
  }
  function swPose(t) {
    var st = stT(t);
    if (t >= T.seamC) { var k = e3o(seg(t, T.seamC, DUR)), xs = lerp(1580, P0.x, k); return { x: xs, y: P0.y, s: 1, rot: (xs - P0.x) / BEZ + .012 * osc(t, 9), ka: 0, moving: k < 1 }; }
    var ka = eio(seg(t, T.toSrc, T.toSrc + .55)) * (1 - eio(seg(t, T.fromSrc, T.fromSrc + .5)));
    var kb = eio(seg(t, T.toP3, T.toP3 + .45));
    var x = lerp(lerp(P0.x, P1.x, ka), P3.x, kb), y = lerp(lerp(P0.y, P1.y, ka), P3.y, kb), s = lerp(lerp(P0.s, P1.s, ka), P3.s, kb);
    var kr = seg(t, T.roll, T.roll + .85), dx = -1250 * kr * kr;
    var rot = dx / (BEZ * s) + .012 * osc(t, 9) + sw(st, T.gta, .05, 9, 3) + sw(st, T.cL1, .03, 9, 3) + sw(st, T.c2L, .03, 9, 3) + sw(st, T.p5, .025, 9, 3);
    return { x: x + dx, y: y + 10 * bump(t, T.lurch, .5) * -2, s: s, rot: rot, ka: ka, moving: (ka > .001 && ka < .999) || (kb > .001 && kb < .999) || kr > 0 };
  }
  function ring(g, r0, r1, h0, h1, col) {
    if (h1 - h0 < .05) return;
    var a0 = -Math.PI / 2 + h0 / 100 * TAU, a1 = -Math.PI / 2 + h1 / 100 * TAU;
    g.beginPath(); g.arc(0, 0, r1, a0, a1); g.arc(0, 0, r0, a1, a0, true); g.closePath();
    g.fillStyle = col; g.fill();
    g.save(); g.clip(); g.globalAlpha = .55; g.fillStyle = g.createPattern(GRAIN, 'repeat'); g.fillRect(-r1, -r1, 2 * r1, 2 * r1); g.restore();
    g.strokeStyle = 'rgba(29,18,51,.6)'; g.lineWidth = 3; g.stroke();
  }
  function lchip(g, text, x, y, px, a, s, o) {
    if (a <= 0) return; o = o || {};
    chip(g, text, x, y, { px: px, a: a, s: s, bg: o.bg || INK2, fg: o.fg || CREAM, line: 'rgba(251,240,234,.55)', rot: o.rot || 0 });
  }
  function drawWatch(g, t) {
    var st = stT(t), p = swPose(t); if (p.x < -500) return;
    var nr = NOREC; NOREC = nr || p.moving;
    g.save(); g.translate(p.x, p.y); g.rotate(p.rot); g.scale(p.s, p.s);
    put(g, P.sw, 0, 0);
    var s = p.s, chipPx = 38 / s, chipVis = clamp((s - .76) / .08, 0, 1);
    /* hour numerals on the bezel, inked in on "Just" */
    var na = st >= 0 ? fin(st, T.num, .3) : 0;
    if (na > 0) [['25 H', 25], ['50 H', 50], ['75 H', 75]].forEach(function (L) { var q = pol(380, L[1]); txt(g, L[0], q[0], q[1] + 2, { px: Math.min(60, 38 / s), col: INK, align: 'center', a: na, ls: 1 }); });
    /* the rings: yellow story on the inner ring (then two more 32 h arcs for "three times"), coral 100% on the outer ring */
    if (st >= T.sw0) {
      var hs = st < T.sw1 ? Math.min(32, handH(st)) : 32;
      ring(g, IN0, IN1, 0, hs, YEL);
      if (st >= T.b2) ring(g, IN0, IN1, 32, 32 + 32 * eio(seg(st, T.b2, T.b2 + .3)), YEL3);
      if (st >= T.b3) ring(g, IN0, IN1, 64, 64 + 32 * eio(seg(st, T.b3, T.b3 + .3)), YEL2);
    }
    if (st >= T.s20) ring(g, OU0, OU1, 0, st < T.s21 ? Math.min(89.5, handH(st)) : 89.5, CORAL);
    /* the 89½ line across both rings, on "times": the third story arc ends past it */
    if (st >= T.mk) {
      var mk = eio(seg(st, T.mk, T.mk + .3)), q0 = pol(150, 89.5), q1 = pol(150 + 215 * mk, 89.5);
      g.save(); g.strokeStyle = RED; g.lineWidth = 7; g.setLineDash([16, 10]); g.lineCap = 'round'; g.beginPath(); g.moveTo(q0[0], q0[1]); g.lineTo(q1[0], q1[1]); g.stroke(); g.restore();
    }
    /* the spinning hand leaves a blur fan, and each 5 h tick it passes flashes */
    var hv = st < T.g0 ? SPIN : st < T.g0 + 1 ? SPIN * (1 - (st - T.g0)) : 0;
    if (hv > 20) {
      var h0 = handH(st), span = hv * .06;
      for (var b = 1; b <= 7; b++) { g.save(); g.rotate((h0 - span * b / 7) / 100 * TAU); g.globalAlpha *= .22 * (1 - b / 8); g.fillStyle = INK; rr(g, -7, -354, 14, 200, 6); g.fill(); g.restore(); }
      for (var tk2 = 0; tk2 < 20; tk2++) { var dh = ((h0 - tk2 * 5) % 100 + 100) % 100; if (dh > span * 1.6) continue; var qq = pol(346, tk2 * 5); g.fillStyle = 'rgba(255,79,163,' + (.9 * (1 - dh / (span * 1.6))).toFixed(2) + ')'; g.beginPath(); g.arc(qq[0], qq[1], 11, 0, TAU); g.fill(); }
    }
    /* the hand: an outer pointer that paints as it goes */
    g.save(); g.rotate(handH(st) / 100 * TAU);
    g.save(); g.shadowColor = 'rgba(6,3,18,.4)'; g.shadowBlur = 8; g.shadowOffsetX = 4; g.shadowOffsetY = 6;
    g.fillStyle = INK; rr(g, -7, -354, 14, 200, 6); g.fill();
    g.fillStyle = RED; g.beginPath(); g.moveTo(-16, -312); g.lineTo(0, -364); g.lineTo(16, -312); g.closePath(); g.fill(); g.restore();
    g.restore();
    /* the window: ? on the hook, then STORY / 100% with a counter that rolls in whole hours and lands with its unit */
    put(g, P.disc, 0, 0);
    var fk = flipK(st, T.p5) * flipK(st, T.h100), labA = clamp((s - .7) / .05, 0, 1);
    g.save(); g.scale(1, fk);
    if (st < T.p5) {
      var qs = kn(st, T.gta, .1) * kn(st, T.g0, .18) * (1 + .03 * Math.sin(st * 9));
      g.save(); g.scale(qs, qs); g.rotate(-.05 + .05 * Math.sin(st * 4)); stk(g, '?', 0, 4, 230, { col: HOT, lw: 12 }); g.restore();
    } else {
      var hund = st >= T.h100, land = hund ? st >= T.c2L : st >= T.cL1, ta = hund ? T.c2L : T.cL1, roll = !land && (hund ? st >= T.s20 : st >= T.sw0), v = null;
      if (land) v = hund ? '89½' : '32'; else if (roll) v = String(Math.floor(clamp(handH(st), 0, hund ? 89 : 32) + 1e-6));
      if (labA > 0 && !roll) txt(g, hund ? '100%' : 'STORY', 0, land ? -86 : 2, { px: land ? 52 : 76, col: hund ? CORAL : YEL2, align: 'center', a: labA, ls: 2 });
      var ks = land ? kn(st, ta, .14) : 1, nrr = NOREC; NOREC = NOREC || !land;
      if (v !== null) { g.save(); g.translate(0, -4); g.scale(ks, ks); txt(g, v, 0, 0, { px: 116, col: land ? INK : '#8a7f9c', align: 'center' }); g.restore(); }
      NOREC = nrr;
      if (land) txt(g, 'HOURS', 0, 82, { px: 58, col: INK2, align: 'center', ls: 3, a: fin(st, ta, .1) });
    }
    g.restore();
    if (st >= T.cL1 && st < T.h100 + .5 && fk > .9) { var u0 = st - T.cL1; if (u0 < .4) KIT.impact(g, 0, 0, u0, 1.15, YEL); }
    if (st >= T.c2L && st - T.c2L < .4) KIT.impact(g, 0, 0, st - T.c2L, 1.15, CORAL);
    /* ring chips: what each arc is (hidden while the dial is small) */
    var q = pol(207, 16), aS = fin(st, T.cL1 + .15, .15) * chipVis * (1 - seg(st, T.b2 - .2, T.b2));
    lchip(g, 'STORY · 32 H', q[0], q[1], chipPx, aS, kn(st, T.cL1 + .15, .12));
    q = pol(207, 48); lchip(g, '2×', q[0], q[1], 52 / s, fin(st, T.b2 + .22, .12), kn(st, T.b2 + .22, .14));
    q = pol(207, 80); lchip(g, '3×', q[0], q[1], 52 / s, fin(st, T.b3 + .22, .12), kn(st, T.b3 + .22, .14), { bg: RED });
    /* the overshoot, circled in the pause: three story lengths end past the 100% line */
    if (st >= T.scr) { q = pol(250, 92.8); KIT.scribble(g, q[0], q[1], 64, 56, eio(seg(st, T.scr, T.scr + .45)), HOT, 9, 3); }
    /* the GTA 5 tape on the bezel, slapped on at "Just" */
    if (st >= T.tape) { var tk = eo(seg(st, T.tape, T.tape + .12)), nrt = NOREC; NOREC = NOREC || tk < 1; g.save(); g.globalAlpha *= chipVis; putW(g, P.tape5, -222, 322, -.22, lerp(1.5, 1, tk) * kn(st, T.tape + .12, .06)); g.restore(); NOREC = nrt; }
    /* the guess sticky with a pencil writing nothing in it */
    if (st >= T.gs && st < T.gsO + .45) {
      var gk = eo(seg(st, T.gs, T.gs + .14)), go = eio(seg(st, T.gsO, T.gsO + .4)), nrs = NOREC; NOREC = NOREC || gk < 1 || go > 0;
      g.save(); g.globalAlpha *= fin(st, T.gs, .05); g.translate(-200 - go * 700, -220 - go * 300); g.rotate(-.09 - go * .8); var ss = lerp(1.35, 1, gk) * kn(st, T.gsPop, .06); g.scale(ss, ss);
      putW(g, P.sticky, 0, 0);
      var pu = st - T.gs, px = 30 + 40 * Math.sin(pu * 7), py = 50 + 6 * Math.sin(pu * 19);
      g.save(); g.translate(px, py); g.rotate(-.9 + .08 * Math.sin(pu * 13));
      g.fillStyle = 'rgba(6,3,18,.3)'; g.fillRect(6, -6, 170, 26); g.fillStyle = YEL; g.fillRect(0, -12, 150, 24); g.fillStyle = YEL2; g.fillRect(0, 2, 150, 10);
      g.fillStyle = '#f2c79a'; g.beginPath(); g.moveTo(0, -12); g.lineTo(-36, 0); g.lineTo(0, 12); g.closePath(); g.fill(); g.fillStyle = INK; g.beginPath(); g.moveTo(-26, -4); g.lineTo(-36, 0); g.lineTo(-26, 4); g.closePath(); g.fill();
      g.fillStyle = '#ff8fa8'; rr(g, 150, -12, 28, 24, 7); g.fill(); g.restore();
      g.restore(); NOREC = nrs;
    }
    g.restore(); NOREC = nr;
    return p;
  }
  /* the source tag: taped on the bezel when 32 lands, drops to the middle for the source line, goes back to the bezel */
  function drawTag(g, t, p) {
    var st = stT(t); if (st < T.cL1 || t > T.roll + 1) return;
    var c = Math.cos(p.rot), sn = Math.sin(p.rot), ax = p.x + p.s * (c * TAGL[0] - sn * TAGL[1]), ay = p.y + p.s * (sn * TAGL[0] + c * TAGL[1]);
    var x = lerp(ax, TAGSRC[0], p.ka), y = lerp(ay, TAGSRC[1], p.ka), s = lerp(p.s, 1, p.ka), rot = lerp(p.rot + .05, -.02, p.ka);
    var ik = eo(seg(st, T.cL1 + .08, T.cL1 + .22)); s *= kn(st, T.mark, .04); y -= (1 - ik) * 140;
    var nr = NOREC; NOREC = nr || p.moving || ik < 1;
    g.save(); g.globalAlpha *= fin(st, T.cL1 + .08, .06); g.translate(x, y); g.rotate(rot); g.scale(s, s);
    putW(g, P.tag, 0, 0);
    tape(g, -120, -66, 70, 24, -.2); tape(g, 120, -66, 70, 24, .2);
    if (st >= T.mark && p.ka > .9) KIT.marker(g, -150, 58, 300, 9, seg(st, T.mark, T.mark + .35), HOT);
    g.restore(); NOREC = nr;
  }
  /* the jar: paper time slips from thousands of players fly in from both sides; the pile rises */
  function drawJar(g, t) {
    if (t < T.jar - .02 || t > T.jarO + .6) return;
    var jk = cd(t, T.jar, 12), jo = e3i(seg(t, T.jarO, T.jarO + .45)), dy = (1 - jk) * 520 + jo * 700, nr = NOREC; NOREC = nr || jk < .995 || jo > 0;
    /* slips in flight */
    T.slips.forEach(function (sl, i) {
      var u = seg(t, sl.t, sl.t + .8); if (u <= 0 || u >= 1 || sl.t > T.jarO) return;
      var x = lerp(sl.x0, sl.x1, u), y = lerp(sl.y0, sl.y1 + dy, u) - 160 * 4 * u * (1 - u), r0 = sl.r + sl.side * u * 4;
      g.save(); g.translate(x, y); g.rotate(r0); g.scale(1, Math.abs(Math.cos(u * 5 + i)) * .7 + .3); put(g, P.slip[i % 4], 0, 0); g.restore();
    });
    g.save(); g.translate(0, dy);
    /* the pile inside the glass, clipped to the jar (x 722-910, y 990-1420) */
    var lvl = 30 + 300 * seg(t, T.jar + .7, T.jarO);
    g.save(); g.beginPath(); rr(g, 752, 1000, 156, 418, 30); g.clip();
    for (var i = 0; i < 60; i++) { var row = Math.floor(i / 3), col = i % 3, py = 1404 - row * 22 - 6 * hash(i); if (1420 - py > lvl + 10) break; g.save(); g.translate(780 + col * 48 + 10 * hash(i * 2), py); g.rotate((hash(i * 3) - .5) * 1.2); g.scale(.75, .75); put(g, P.slip[i % 4], 0, 0); g.restore(); }
    g.restore();
    g.save(); rr(g, 750, 996, 160, 424, 32); g.fillStyle = 'rgba(200,230,255,.2)'; g.fill(); g.lineWidth = 7; g.strokeStyle = 'rgba(251,240,234,.85)'; g.stroke();
    g.fillStyle = 'rgba(255,255,255,.35)'; rr(g, 766, 1024, 12, 300, 6); g.fill();
    g.fillStyle = '#c9ced6'; rr(g, 756, 976, 148, 26, 8); g.fill(); g.strokeStyle = '#7d8492'; g.lineWidth = 3; g.stroke(); g.restore();
    var kl = kn(t, T.thou, .06);
    putW(g, P.jarLbl, 830, 1180, -.02, kl);
    if (t >= T.thou) KIT.marker(g, 760, 1212, 140, 8, seg(t, T.thou, T.thou + .3), YEL);
    g.restore(); NOREC = nr;
  }
  function stamp3(g, t) {
    if (t < T.st3 - .02 || t > T.off + .4) return;
    var k = eo(seg(t, T.st3, T.st3 + .2)), sl = eo(seg(t, T.slam, T.slam + .1)), ko = eio(seg(t, T.off, T.off + .3));
    var sc = lerp(1.07, 1, sl) * kn(t, T.slam + .09, .04), lift = 16 * (1 - sl);
    var nr = NOREC; NOREC = nr || k < 1 || ko > 0 || sl < 1;
    g.save(); g.globalAlpha *= fin(t, T.st3, .08);
    if (sl < 1) { g.save(); g.globalAlpha *= .3 * (1 - sl); g.fillStyle = '#06030f'; g.beginPath(); g.ellipse(520, 650, 270, 70, 0, 0, TAU); g.fill(); g.restore(); }
    g.translate(510 - ko * 900, 628 - lift - ko * 160); g.rotate(-.04 - .03 * (1 - sl) - ko * .6 + .1 * (1 - k)); g.scale(sc, sc); putW(g, P.st3, 0, 0); g.restore();
    NOREC = nr;
    if (t >= T.slam && t < T.slam + .45) KIT.impact(g, 510, 628, t - T.slam, .75, HOT);
  }

  /* =====================================================================================================
     THE 100% PUNCH CARD: 10 x 10 squares, each 1% of the completion score (GTABase weights)
     ===================================================================================================== */
  var CARD = [510, 970], PITCH = 48, CELL = 42, GX0 = -362, GY0 = -300;
  function catOf(c) { return c < 55 ? 0 : c < 65 ? 1 : c < 75 ? 2 : c < 80 ? 3 : 4; }
  function cellT(c) { var k = catOf(c); return k === 0 ? T.rk[0] + (T.fillL - .14 - T.rk[0]) * Math.sqrt(c / 54) : T.rk[k] + (c - CAT0[k]) * .3 / CATN[k]; }
  function drawCard(g, t) {
    if (t < T.cl - .02 || t > T.clO + .6) return;
    var ck = cd(t, T.cl, 10), co = e3i(seg(t, T.clO, T.clO + .45)), push = 1 + .028 * eio(seg(t, T.rest0, T.clO)) * (1 - co);
    var nr = NOREC; NOREC = nr || ck < .995 || co > 0;
    g.save(); g.translate(CARD[0] + (1 - ck) * 980 - co * 1100, CARD[1] - co * 300); g.rotate(.14 * (1 - ck) - .4 * co + .004 * osc(t, 5, 1)); var kk = push * kn(t, T.full, .012) * kn(t, T.p55, .015); g.scale(kk, kk);
    put(g, P.card, 0, 0);
    if (t >= T.chkU) KIT.marker(g, -190, -372, 380, 12, seg(t, T.chkU, T.chkU + .3), YEL);
    txt(g, '100% CHECKLIST', 0, -393, { px: 62, col: INK, align: 'center', ls: 2 });
    txt(g, 'SHARE OF THE 100% SCORE · GTABASE', 0, -340, { px: 36, col: INK2, align: 'center', ls: 1 });
    /* the squares: empty ones hatch while "the rest" is listed; each fills on its own word with a punched hole */
    var hatch = t >= T.rest0 ? .25 + .2 * Math.sin(t * 8) : 0;
    for (var c = 0; c < 100; c++) {
      var x = GX0 + (c % 10) * PITCH, y = GY0 + Math.floor(c / 10) * PITCH, k = eo(seg(t, cellT(c), cellT(c) + .14));
      if (k < 1) {
        rr(g, x, y, CELL, CELL, 6); g.fillStyle = 'rgba(29,18,51,.06)'; g.fill(); g.strokeStyle = 'rgba(29,18,51,.32)'; g.lineWidth = 2; g.stroke();
        g.strokeStyle = 'rgba(29,18,51,.22)'; g.beginPath(); g.arc(x + CELL / 2, y + CELL / 2, 6, 0, TAU); g.stroke();
        if (hatch > 0 && catOf(c) > 0) { g.save(); rr(g, x, y, CELL, CELL, 6); g.clip(); g.globalAlpha *= hatch; g.strokeStyle = INK2; g.lineWidth = 4; var hs = (t * 50 + c * 3) % 14; for (var hx = -CELL + hs; hx < CELL; hx += 14) { g.beginPath(); g.moveTo(x + hx, y + CELL); g.lineTo(x + hx + CELL, y); g.stroke(); } g.restore(); }
      }
      if (k > 0) {
        g.save(); g.translate(x + CELL / 2, y + CELL / 2); var sc = lerp(1.5, 1, k); g.scale(sc, sc); g.globalAlpha *= clamp(k * 2, 0, 1);
        rr(g, -CELL / 2, -CELL / 2, CELL, CELL, 6); g.fillStyle = SECT[catOf(c)][2]; g.fill(); g.strokeStyle = INK; g.lineWidth = 2.5; g.stroke();
        g.fillStyle = COB2; g.beginPath(); g.arc(0, 0, 7, 0, TAU); g.fill(); g.restore();
      }
    }
    /* the rows: the story row on "story"; the other four enter dim on "The rest" and light up on their own words */
    SECT.forEach(function (S, i) {
      var tin = i === 0 ? T.row0 : T.dim; if (t < tin) return;
      var y = 222 + i * 46, a = fin(t, tin, .15), lit = i === 0 ? 1 : seg(t, T.rk[i], T.rk[i] + .12), rk = cd(t, tin, 15), nrr = NOREC; NOREC = NOREC || rk < .99;
      g.save(); g.translate((1 - rk) * -50, y); var pk = i === 0 ? kn(t, T.row0, .08) : kn(t, T.rk[i], .1); g.scale(pk, pk);
      rr(g, -362, -17, 34, 34, 5); g.globalAlpha *= a; g.fillStyle = lit > 0 ? S[2] : 'rgba(29,18,51,.1)'; g.fill(); g.strokeStyle = INK; g.lineWidth = 2.5; g.stroke();
      txt(g, S[0], -312, 1, { px: 38, col: INK, a: .42 + .58 * lit });
      txt(g, S[1] + '%', 362, 1, { px: 38, col: i === 0 ? RED : INK2, align: 'right', a: .42 + .58 * lit });
      g.restore(); NOREC = nrr;
    });
    /* the right column: the story's share, big */
    if (t >= T.fillL) {
      var ra = fin(t, T.fillL, .1), land = t >= T.fillL, v = 55;
      txt(g, 'STORY', 255, -252, { px: 52, col: YEL2, align: 'center', a: ra, ls: 2 });
      var nrv = NOREC; NOREC = NOREC || !land;
      if (t >= T.fill) { g.save(); g.translate(255, -150); var vs = land ? kn(t, T.fillL, .12) : 1; g.scale(vs, vs); txt(g, v + '%', 0, 0, { px: 132, col: land ? RED : '#8a7f9c', align: 'center', a: ra }); g.restore(); }
      NOREC = nrv;
      txt(g, 'OF 100%', 255, -60, { px: 40, col: INK2, align: 'center', a: fin(t, T.fillL, .15), ls: 2 });
      if (t >= T.p55) KIT.scribble(g, 255, -150, 120, 84, eio(seg(t, T.p55, T.p55 + .45)), HOT, 9, 5);
    }
    /* the hole punch: the lever drops on each section's word and chads fall out */
    drawPunch(g, t, 255, 70);
    g.restore(); NOREC = nr;
  }
  function drawPunch(g, t, x, y) {
    var pr = 0, last = -1;
    T.rk.forEach(function (tk, i) { var b = bump(t, tk - .02, .3); if (b > pr) pr = b; if (t >= tk) last = i; });
    g.save(); g.translate(x, y);
    g.fillStyle = 'rgba(6,3,18,.25)'; rr(g, -100, 48, 210, 44, 10); g.fill();
    g.fillStyle = INK2; rr(g, -105, 40, 210, 44, 10); g.fill();
    g.fillStyle = '#c9ced6'; rr(g, 40, -34, 44, 80, 8); g.fill(); g.fillStyle = '#9aa1ad'; rr(g, 40, 20, 44, 26, 6); g.fill();
    g.save(); g.translate(62, -28); g.rotate(-.32 + .3 * pr);
    g.fillStyle = 'rgba(6,3,18,.25)'; rr(g, -186, -10, 200, 30, 12); g.fill();
    g.fillStyle = RED; rr(g, -190, -18, 206, 30, 12); g.fill(); g.fillStyle = 'rgba(255,255,255,.25)'; rr(g, -180, -16, 180, 8, 4); g.fill();
    g.fillStyle = '#5d6370'; g.beginPath(); g.arc(0, -3, 9, 0, TAU); g.fill();
    g.restore();
    /* chads */
    T.rk.forEach(function (tk, i) {
      var u = t - tk - .12; if (u < 0 || u > .9) return;
      for (var j = 0; j < 4; j++) { var cx = 62 + (hash(i * 9 + j) - .5) * 40 + u * 30 * (j - 1.5), cy = 70 + 520 * u * u + 40 * u; if (cy > 240) continue; g.fillStyle = SECT[i][2]; g.beginPath(); g.arc(cx, cy, 6, 0, TAU); g.fill(); g.strokeStyle = INK; g.lineWidth = 1.5; g.stroke(); }
    });
    g.restore();
  }

  /* =====================================================================================================
     THE PICK-ONE BOX: GTA 6 on a plate, a pencil fork to two identical buttons (no length, no outline)
     ===================================================================================================== */
  function dome(g, x, y, press, tilt) {
    g.save(); g.translate(x, y); g.rotate(tilt);
    g.fillStyle = 'rgba(6,3,18,.35)'; g.beginPath(); g.ellipse(8, 14, 132, 34, 0, 0, TAU); g.fill();
    g.fillStyle = INK2; g.beginPath(); g.ellipse(0, 6, 128, 32, 0, 0, TAU); g.fill();
    g.fillStyle = '#5d6370'; g.beginPath(); g.ellipse(0, 0, 114, 26, 0, 0, TAU); g.fill();
    var h = 92 * (1 - .4 * press);
    g.fillStyle = DOME; g.beginPath(); g.ellipse(0, 0, 104, 24, 0, 0, Math.PI); g.ellipse(0, 0, 104, h, 0, Math.PI, TAU); g.closePath(); g.fill();
    g.fillStyle = 'rgba(0,0,0,.18)'; g.beginPath(); g.ellipse(0, 0, 104, 24, 0, 0, Math.PI); g.closePath(); g.fill();
    g.fillStyle = 'rgba(255,255,255,.4)'; g.beginPath(); g.ellipse(-36, -h * .55, 30, h * .2, -.4, 0, TAU); g.fill();
    g.strokeStyle = INK; g.lineWidth = 4; g.beginPath(); g.ellipse(0, 0, 104, h, 0, Math.PI, TAU); g.stroke();
    g.restore();
  }
  function drawEnd(g, t) {
    if (t < T.box - .02 || t > T.seamC + .5) return;
    var bk = cd(t, T.box, 11), bo = e3i(seg(t, T.seamC, T.seamC + .4)), dy = (1 - bk) * 760 + bo * 900;
    var rum = t > T.pick ? 7 * Math.sin((t - T.pick) * 55) * Math.exp(-(t - T.pick) * 4.5) : 0;
    var nr = NOREC; NOREC = nr || bk < .995 || bo > 0;
    /* the plate on two strings, swinging in on "GTA" */
    var pk = cd(t, T.pl6, 11), py = 606 - (1 - pk) * 520 - bo * 800, prot = sw(t, T.pl6 + .1, .08, 6, 2.2) + .02 * osc(t, 7) + sw(t, T.pick, .04, 9, 3);
    g.save(); g.translate(510, py); g.rotate(prot);
    g.strokeStyle = 'rgba(251,240,234,.8)'; g.lineWidth = 3; g.beginPath(); g.moveTo(-110, -56); g.lineTo(-150, -420); g.moveTo(110, -56); g.lineTo(150, -420); g.stroke();
    putW(g, P.plate6, 0, 0, 0, kn(t, T.pl6k, .1));
    g.restore();
    /* the pencil fork: the trunk, then one branch per option, drawn on its words */
    g.save(); g.translate(0, bo * 900);
    var tk = eio(seg(t, T.pl6 + .3, T.pl6 + .65));
    if (tk > 0) { g.strokeStyle = CREAM; g.lineWidth = 11; g.lineCap = 'round'; g.setLineDash([22, 16]); g.lineDashOffset = -t * 40; g.beginPath(); g.moveTo(510, 680); g.lineTo(510, 680 + 120 * tk); g.stroke(); g.setLineDash([]); }
    KIT.arrow(g, 510, 805, 318, 958, eio(seg(t, T.ks, T.ks + .45)), CREAM, 11, -.22);
    KIT.arrow(g, 510, 805, 702, 958, eio(seg(t, T.kp, T.kp + .45)), CREAM, 11, .22);
    g.restore();
    /* the box and its two identical buttons */
    var bx = 510 + rum, by = 1090 + dy;
    put(g, P.box, bx, by);
    var dbl = Math.max(bump(t, T.dbl - .02, .14), bump(t, T.dbl2 - .02, .14)), pl = Math.max(bump(t, T.ksP, .32), .6 * bump(t, T.pick, .4), .6 * bump(t, T.pick2, .4), dbl), pr2 = Math.max(bump(t, T.kpP, .32), .6 * bump(t, T.pick, .4), .6 * bump(t, T.pick2, .4), dbl);
    dome(g, bx - 210, by + 2, pl, -.07 * bump(t, T.pick, .5) + .015 * osc(t, 8));
    dome(g, bx + 210, by + 2, pr2, .07 * bump(t, T.pick, .5) - .015 * osc(t, 8));
    putW(g, P.plS, bx - 210, by + 172, -.02, kn(t, T.ks, .1) * kn(t, T.pick, .05));
    putW(g, P.plC, bx + 210, by + 172, .02, kn(t, T.kp, .1) * kn(t, T.pick, .05));
    stk(g, 'OR', bx, by + 172, 58, { col: CREAM });
    NOREC = nr;
  }

  /* ---------- the prop layer (screen space, clipped to the rail) ---------- */
  function props(g, t) {
    drawCard(g, t);
    drawEnd(g, t);
    var p = drawWatch(g, t);
    if (p) drawTag(g, t, p);
    drawJar(g, t);
    stamp3(g, t);
  }

  var GLUE = { the: 1, a: 1, an: 1, your: 1, its: 1, of: 1, at: 1, to: 1, and: 1, in: 1, with: 1, on: 1, by: 1, so: 1, for: 1, own: 1, how: 1, that: 1, if: 1, you: 1, no: 1, or: 1, it: 1, was: 1, will: 1, most: 1 };
  var CAPS = (function () {
    var outc = [];
    VO.lines.forEach(function (l) {
      var cur = [], ws = l.words.slice();
      ws.forEach(function (w, i) { cur.push(w); if (/[.?!:]["”]?$/.test(w.w) && i < ws.length - 1) { cur.id = l.id; outc.push(cur); cur = []; } });
      if (cur.length) { cur.id = l.id; outc.push(cur); }
    });
    return outc.map(function (ws) { return { id: ws.id, t0: ws[0].t0, t1: ws[ws.length - 1].t1, s: ws[0].t0 - .04, words: ws }; });
  })();
  var STRESS;
  function stressed(w) { for (var i = 0; i < STRESS.length; i++) if (Math.abs(STRESS[i] - w.t0) < .02) return true; return false; }
  var CAPY = 400;
  function captions(g, t) {
    t = tq(t);
    var card0 = null, ci = -1;
    if (t >= T.loopCap) { card0 = CAPS[0]; ci = -1; }
    else CAPS.forEach(function (c, i) { if (t >= c.s) { card0 = c; ci = i; } });
    if (!card0 || card0.skip) return;
    var nx = ci >= 0 ? CAPS[ci + 1] : null, ns = nx ? nx.s : T.loopCap, end = ci === 0 ? ns : Math.min(card0.t1 + .55, ns);
    if (ci >= 0 && t >= end) return;
    var k = ci === -1 ? cd(t, T.loopCap, 16) : (ci === 0 ? 1 : cd(t, card0.s, 16));
    g.save(); cond(g); var cpx = 76; font(g, cpx, 900); ls(g, 1); g.textBaseline = 'alphabetic';
    var words = card0.words, up = words.map(function (w) { return w.w.toUpperCase(); }), ws = up.map(function (u) { return g.measureText(u).width; }), gap = cpx * .26;
    var lines, lw, maxw = 740, CXc = 510;
    function lay2() { lines = [[]]; lw = [0]; words.forEach(function (w, i) { var Ln = lines.length - 1; if (lw[Ln] + ws[i] > maxw && lines[Ln].length) { lines.push([]); lw.push(0); Ln++; } lines[Ln].push(i); lw[Ln] += ws[i] + gap; }); }
    function fixLines() {
      for (var Ln = 0; Ln < lines.length - 1; Ln++) { var last = lines[Ln][lines[Ln].length - 1]; while (lines[Ln].length > 1 && GLUE[norm(words[last].w)]) { lines[Ln].pop(); lines[Ln + 1].unshift(last); last = lines[Ln][lines[Ln].length - 1]; } }
      var n = lines.length; if (n > 1 && lines[n - 1].length === 1 && lines[n - 2].length > 2) lines[n - 1].unshift(lines[n - 2].pop());
      lw = lines.map(function (ln) { var w = 0; ln.forEach(function (i) { w += ws[i] + gap; }); return w; });
    }
    lay2(); fixLines();
    function widest() { return Math.max.apply(null, lw) - gap; }
    while ((lines.length > 2 || widest() > maxw) && cpx > 56) { cpx -= 4; font(g, cpx, 900); ws = up.map(function (u) { return g.measureText(u).width; }); gap = cpx * .26; lay2(); fixLines(); }
    var lh = cpx * 1.32, y0 = CAPY - (lines.length - 1) * lh / 2 + cpx * .36;
    lines.forEach(function (ln, li) {
      var tw = lw[li] - gap, x = CXc - tw / 2, y = y0 + li * lh + (1 - k) * 30, seed = Math.round(card0.t0 * 100) + li * 7;
      var r = mulberry(seed), x0 = x - 22, x1 = x + tw + 22, yt = y - cpx * .86, yb = y + cpx * .24, rot = (r() - .5) * .025;
      g.save(); g.translate(CXc, y); g.rotate(rot); g.translate(-CXc, -y);
      g.beginPath(); g.moveTo(x0, yt); for (var xx = x0; xx < x1; xx += 9) g.lineTo(xx, yt + (r() - .5) * 4); g.lineTo(x1, yt); g.lineTo(x1 + (r() - .5) * 6, (yt + yb) / 2); g.lineTo(x1, yb); for (xx = x1; xx > x0; xx -= 9) g.lineTo(xx, yb + (r() - .5) * 4); g.lineTo(x0, yb); g.lineTo(x0 + (r() - .5) * 6, (yt + yb) / 2); g.closePath();
      g.save(); g.shadowColor = 'rgba(6,3,18,.55)'; g.shadowBlur = 12; g.shadowOffsetX = 4; g.shadowOffsetY = 8; g.fillStyle = NEWS; g.fill(); g.restore();
      g.save(); g.clip(); g.globalAlpha *= .6; g.fillStyle = g.createPattern(GRAIN, 'repeat'); g.fillRect(x0, yt - 4, x1 - x0, yb - yt + 8); g.restore();
      ln.forEach(function (i) {
        var w = words[i], nw = words[i + 1], cur = ci >= 0 && stressed(w) && t >= w.t0 - .03 && t < Math.min(w.t1 + .05, nw ? nw.t0 - .03 : 1e9) + .2;
        if (cur) { g.fillStyle = HOT; g.fillRect(x - 6, y + cpx * .06, ws[i] + 12, cpx * .12); }
        g.fillStyle = cur ? HOT : INK; g.fillText(up[i], x, y); x += ws[i] + gap;
      });
      g.restore();
    });
    g.restore(); unst(g); ls(g, 0);
  }


  var NOISE, POSTERMODE = false, VIG = null;
  function stage(g) { g.fillStyle = BG; g.fillRect(0, 0, W, H); }
  function vignette(g) {
    if (!VIG) { VIG = mk(W, H); var q = VIG.getContext('2d'), gr = q.createRadialGradient(510, 960, 520, 510, 960, 1300); gr.addColorStop(0, 'rgba(6,3,18,0)'); gr.addColorStop(1, 'rgba(6,3,18,.55)'); q.fillStyle = gr; q.fillRect(0, 0, W, H); }
    g.drawImage(VIG, 0, 0);
  }
  function railClip(g) { g.beginPath(); if (LIVE2.clip) g.rect(BX0, 0, BX1 - BX0, BY1); else g.rect(-500, -500, 2080, BY1 + 500); g.clip(); }
  function frame(g, t) {
    g.setTransform(1, 0, 0, 1, 0, 0);
    stage(g);
    var st = stT(t);
    /* the desk settles from a 1.12 push over the hook, and pushes in again under the seam, so frame 0 already moves */
    var ws = st < 0 ? 1 + .12 * e3i(seg(t, T.seamC, DUR)) : 1 + .12 * (1 - e3o(seg(st, 0, 3)));
    if (LIVE2.bg) { g.save(); g.translate(540, 1000); g.rotate((ws - 1) * -.3); g.scale(ws, ws); g.translate(-540, -1000); world(g, t); g.restore(); vignette(g); }
    g.save(); railClip(g); props(g, t); g.restore();
    if (!POSTERMODE && LIVE.text) captions(g, t);
    if (LIVE.grain && NOISE && LIVE2.bg) { g.globalAlpha = .05; g.globalCompositeOperation = 'overlay'; var o = Math.floor(t * 24) * 37 % 256; g.fillStyle = g.createPattern(NOISE, 'repeat'); g.translate(-o, -o); g.fillRect(o, o, W, H); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }
  }
  function TEXTS(t) {
    var o = [], st = stT(t), p = swPose(t), big = p.s > .84 && !p.moving;
    function Tx(id, text, a, b, ok) { if (t >= a && t < b && ok !== false) o.push({ id: id, text: text, x0: 0, y0: 0, x1: 0, y1: 0 }); }
    if (st < T.p5) o.push({ id: 'q', text: '?', x0: 0, y0: 0, x1: 0, y1: 0 });
    Tx('gs', 'YOUR GUESS?', T.gs + .15, T.gsO);
    Tx('gta5', 'GTA 5', T.tape + .15, T.roll, p.s > .78);
    Tx('n25', '25 H', T.num + .3, T.roll); Tx('n50', '50 H', T.num + .3, T.roll); Tx('n75', '75 H', T.num + .3, T.roll);
    Tx('sto', 'STORY', T.p5 + .12, T.sw0); Tx('sto', 'STORY', T.cL1 + .1, T.h100 - .12, p.s > .72);
    Tx('c32', '32 HOURS', T.cL1 + .1, T.h100 - .12);
    Tx('chS', 'STORY · 32 H', T.cL1 + .3, T.b2 - .2, big);
    Tx('tag1', "PLAYERS' AVERAGE", T.cL1 + .3, T.roll); Tx('tag2', 'HOWLONGTOBEAT', T.cL1 + .3, T.roll);
    Tx('jar', '3,398 PLAYERS', T.jar + .3, T.jarO);
    Tx('l100', '100%', T.h100 + .12, T.s20); Tx('l100', '100%', T.c2L, T.roll);
    Tx('c89', '89½ HOURS', T.c2L + .1, T.roll);
    Tx('x2', '2×', T.b2 + .35, T.roll); Tx('x3', '3×', T.b3 + .3, T.roll);
    Tx('st3', 'NEARLY 3×', T.st3 + .2, T.off);
    Tx('hd', '100% CHECKLIST', T.cl + .45, T.clO); Tx('sub', 'SHARE OF THE 100% SCORE · GTABASE', T.cl + .45, T.clO);
    SECT.forEach(function (S, i) { var a = i === 0 ? T.row0 : T.dim; Tx('r' + i, S[0], a + .2, T.clO); Tx('p' + i, S[1] + '%', a + .2, T.clO); });
    Tx('c55', 'STORY 55%', T.fillL + .1, T.clO); Tx('of', 'OF 100%', T.fillL + .15, T.clO);
    Tx('g6', 'GTA 6', T.pl6 + .25, T.seamC); Tx('bS', 'STORY', T.box + .35, T.seamC); Tx('or', 'OR', T.box + .35, T.seamC); Tx('bC', '100%', T.box + .35, T.seamC);
    return o;
  }

  /* ---------- times and sound events, all from the voice ---------- */
  function initTimes() {
    T.seamC = DUR - .45; T.loopCap = DUR - .15;
    /* hook: the hand spins; the watch kicks on "GTA"; "Guess." slows the hand; the guess sticky lands in the pause */
    T.gta = at('hook', 'gta'); T.g0 = at('hook', 'guess');
    T.gs = T.g0; T.gsPop = G('gsP', after('hook'), 'pop', .35, 1.2);
    /* main: numerals and the GTA 5 tape on "Just"; STORY on "story?" and the hand rewinds; the sweep paints 32 on "average 32" */
    T.num = at('main', 'just'); T.tape = T.gta; T.p5 = at('main', 'story');
    T.rw0 = wend('main', 'story') - .05;
    T.sw0 = at('main', 'average'); T.sw1 = wend('main', '32');
    T.gsO = T.sw1 - .05;
    T.cL1 = G('cL1', after('main'), 'thock', .45, 2.2);
    /* src: the dial shrinks up, the tag drops to the middle, the jar fills with players' slips */
    T.toSrc = G('toSrcS', T.cL1 + .42, 'swish', .3, 1) - .05;
    T.jar = T.toSrc + .25; T.mark = at('src', 'howlongtobeat'); T.thou = at('src', 'thousands');
    T.lurch = after('src') - .05;
    G('jarR', after('src'), 'riffle', .35, 1);
    T.fromSrc = G('fromS', after('src') + .3, 'swish', .35, 1) - .05; T.jarO = T.fromSrc - .05;
    T.slips = []; (function () { var r = mulberry(5), tt = T.jar + .2, i = 0; while (tt < T.jarO - .2) { var side = i % 2 ? 1 : -1; T.slips.push({ t: tt, side: side, x0: side < 0 ? 760 + 140 * r() : 905, y0: side < 0 ? 560 : 600 + 300 * r(), x1: 770 + 90 * r(), y1: 985, r: (r() - .5) * 2 }); tt += tt > T.thou - .1 ? .07 : .14; i++; } })();
    /* hundred: STORY flips to 100% on "100" and the hand rewinds; the sweep paints 89½ by "ninety"; it lands in the pause */
    T.h100 = at('hundred', '100'); T.s20 = T.h100 + .4; T.s21 = wend('hundred', '90');
    T.c2L = G('c2L', after('hundred'), 'thock', .45, 2.2);
    /* times: the dial eases back; second and third 32 h arcs on "Nearly" and "three"; NEARLY 3x with the third; the 89½ line on "times" */
    T.b2 = at('times', 'nearly'); T.b3 = at('times', 'three'); T.toP3 = T.b2 - .32; T.st3 = T.b3 + .1; T.mk = at('times', 'times');
    T.slam = G('slam', after('times'), 'thock', .4, 2.2); T.scr = T.slam + .3;
    /* why: the stamp peels before "Why?"; the watch rolls off as the card slides in */
    T.roll = G('rollS', start('why') - .34, 'swish', .45, 1.2) - .05;
    T.off = start('why') - .24;
    T.cl = T.roll + .1; T.chkU = at('why', 'checklist');
    T.row0 = at('why', 'story') - .05; T.dim = T.row0 + .1; T.fill = at('why', 'story'); T.fillL = wend('why', '55');
    T.p55 = G('p55', after('why'), 'thock', .45, 2);
    T.rest0 = at('rest', 'rest') - .05;
    T.rk = [T.fill, at('rest', 'strangers') - .03, at('rest', 'hobbies') - .03, at('rest', 'random') - .03, at('rest', 'more') - .03];
    T.full = G('fullP', after('rest'), 'snap', .4, 1.3);
    /* end: the card flies off; the box rises; GTA 6 swings in; the fork draws and each button presses on its word; both pulse on "Pick one." */
    T.clO = G('clOS', T.full + .2, 'swish', .3, 1.2) - .05;
    T.box = T.clO + .1; T.pl6 = Math.max(at('end', 'gta') - .05, T.clO + .45); T.pl6k = at('end', '6');
    T.ks = at('end', 'story') - .05; T.ksP = at('end', 'first'); T.kp = at('end', '100') - .05; T.kpP = at('end', '100') + .35;
    T.pick = at('end', 'pick'); T.pick2 = at('end', 'one');
    T.dbl = G('dbl', after('end'), 'click', .3, 1.4); T.dbl2 = G('dbl2', T.dbl + .13, 'click', .3, 1.1);
    CAPS.forEach(function (c) { c.skip = c.id === 'end' && c.words.length <= 2; });
    G('seam', T.seamC + .05, 'swish', .3, 1.8);
    STRESS = [['hook', 'guess'], ['main', '32'], ['hundred', '100'], ['hundred', '90'], ['times', 'three'], ['why', '55'], ['end', 'first']].map(function (p) { return at(p[0], p[1]); });
    CAPS[0].s = -1;
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
  /* ---------- sound: paper foley written into the pauses; no music (Isac adds a platform sound) ---------- */
  BODY.slam = .3; BODY.crack = .1; BODY.click = .08; BODY.pin = .1; BODY.riffle = .32; BODY.snap = .14; BODY.tick = .04; BODY.tear = .12;
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
    function band(t0, t1, f0, f1, g0, g1, q, pan, type) { var o = bus(1, pan), bp = ac.createBiquadFilter(); bp.type = type || 'bandpass'; bp.Q.value = q || .7; var n = noise(t0, t1 - t0 + .1); n.connect(bp); bp.connect(o); env(bp.frequency, [[t0, f0], [t1, f1]]); env(o.gain, [[t0, 0], [t0 + (t1 - t0) * .4, g0], [t1 - .02, g1], [t1, 0]]); }
    function tick(t, g, f) { var n = noise(t, .03), bp = ac.createBiquadFilter(); bp.type = 'highpass'; bp.frequency.value = f || 3200; var o = bus(1, (rnd() - .5) * .3); n.connect(bp); bp.connect(o); env(o.gain, [[t, 0], [t + .003, .16 * (g || 1)], [t + .024, 0]]); }
    function thump(t, g, f) { var o = osc2('sine', f || 150, t, t + .2, [[t, 0], [t + .004, g || .4], [t + .14, 0]]); o.frequency.exponentialRampToValueAtTime(50, t + .12); }
    function boom(t, g, f0, f1, dur) { var o = osc2('sine', f0, t, t + dur + .05, [[t, 0], [t + .006, g], [t + dur * .35, g * .55], [t + dur, 0]]); o.frequency.exponentialRampToValueAtTime(f1, t + dur * .8); }
    function stamp(t, g) { tick(t, 1.6 * g, 2400); thump(t, .7 * g); var sn = noise(t, .12), sl = ac.createBiquadFilter(); sl.type = 'lowpass'; sl.frequency.value = 1500; var so = bus(1); sn.connect(sl); sl.connect(so); env(so.gain, [[t, 0], [t + .004, .32 * g], [t + .1, 0]]); }
    /* the door slam: a wooden boom, a latch click and a short rattle of the frame */
    function slamS(t, g) { boom(t, .9 * g, 120, 42, .55); thump(t, .8 * g, 200); band(t, t + .35, 1100, 180, .2 * g, .03 * g, .7, 0, 'lowpass'); tick(t + .01, 1.8 * g, 1800); for (var j = 1; j < 5; j++) { tick(t + .05 + j * .045, .5 * g / j, 2400); thump(t + .05 + j * .045, .15 * g / j, 300); } }
    function crack(t, g) { for (var j = 0; j < 6; j++) tick(t + j * .011 + rnd() * .004, (.9 - j * .1) * g, 2600 + rnd() * 2000); band(t, t + .08, 3000, 1500, .08 * g, .01 * g, 1.5, .2); }
    function click(t, g) { tick(t, 1.3 * g, 3000); thump(t, .15 * g, 600); }
    function swish(t, g) { band(t, t + .26, 600, 3600, .09 * g, .02 * g, 1.3, -.2); }
    function tear(t, g) { for (var j = 0; j < 8; j++) tick(t + .012 * j + rnd() * .006, (.35 + rnd() * .4) * g, 1800 + rnd() * 2400); band(t, t + .1, 1400, 4200, .07 * g, .02 * g, 1.4, .15); }
    function thock(t, g) { thump(t, .35 * g, 220); tick(t, .9 * g, 1800); }
    function pop(t, g) { thump(t, .3 * g, 320); tick(t, 1.1 * g, 2600); band(t, t + .06, 2400, 1200, .06 * g, .01 * g, 1.2); }
    function clank(t, g) { osc2('triangle', 1046, t, t + .2, [[t, 0], [t + .003, .14 * g], [t + .12, 0]]); osc2('triangle', 1568, t, t + .16, [[t, 0], [t + .003, .08 * g], [t + .1, 0]]); tick(t, 1.2 * g, 2600); tick(t + .07, .7 * g, 2600); osc2('triangle', 1175, t + .07, t + .2, [[t + .07, 0], [t + .073, .08 * g], [t + .16, 0]]); }
    function slap(t, g) { thump(t, .3 * g, 260); band(t, t + .06, 3000, 1500, .12 * g, .01 * g, .9); tick(t, 1.2 * g, 2000); }
    function pin(t, g) { tick(t, 1.4 * g, 2800); thump(t, .25 * g, 420); }
    function riffle(t, g) { for (var j = 0; j < 8; j++) { var tj = t + j * .018; tick(tj, (.5 + .5 * rnd()) * g, 2000 + rnd() * 1800); thump(tj, .06 * g, 500); } }
    function snapS(t, g) { tick(t, 2 * g, 2200); thump(t, .5 * g, 240); band(t, t + .07, 3600, 1800, .1 * g, .01 * g, 1.2); tick(t + .05, .6 * g, 3000); }
    function caseT(t, g) { tick(t, .9 * g, 1500); thump(t, .14 * g, 360); }
    var LEVEL = { stamp: 1, slam: 1, crack: 4, click: 4, swish: 22, tear: 18, thock: 5, pop: 11, clank: 6, slap: 3, pin: 4, riffle: 6, snap: 4, tick: 6 };
    var TRIM = window.SFX_TRIM || {};
    var TYPE_DB = window.SFX_TYPE_DB || { stamp: -14, slam: -6, crack: -14, click: -10.5, swish: -14, tear: -24, pop: -29.5, clank: -16, thock: -22, slap: -14, pin: -14, riffle: -16, snap: -24.5, tick: -20 };
    EV.forEach(function (e) {
      var g = (e.g == null ? 1 : e.g) * (LEVEL[e.type] || 1) * Math.pow(10, ((TRIM[e.id] || 0) + (TYPE_DB[e.type] || 0)) / 20);
      if (e.type === 'stamp') stamp(e.t, g);
      else if (e.type === 'slam') slamS(e.t, g);
      else if (e.type === 'crack') crack(e.t, g);
      else if (e.type === 'click') click(e.t, g);
      else if (e.type === 'swish') swish(e.t, g);
      else if (e.type === 'tear') tear(e.t, g);
      else if (e.type === 'thock') thock(e.t, g);
      else if (e.type === 'pop') pop(e.t, g);
      else if (e.type === 'clank') clank(e.t, g);
      else if (e.type === 'slap') slap(e.t, g);
      else if (e.type === 'pin') pin(e.t, g);
      else if (e.type === 'riffle') riffle(e.t, g);
      else if (e.type === 'snap') snapS(e.t, g);
      else if (e.type === 'tick') caseT(e.t, g);
    });
    /* no music: Isac adds a trending sound on the platform; the film ships voice + sound effects */
    var MUSIC = false;
    if (MUSIC) { /* intentionally empty */ }
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
    return Promise.all(fonts.map(function (f) { return document.fonts.load(f, 'Aa0%°×−≈≠µ“”’·→…#?‹|~$+—½@&!'); })).then(function () { return document.fonts.ready; }).then(function () {
      buildTextures();
      window.READY = true;
    });
  }

  window.FILM = { bare: function () { ctx.setTransform(1, 0, 0, 1, 0, 0); stage(ctx); }, W: W, H: H, DUR: DUR, POSTER: 0, SLUG: 'gta-storylength', SHOTS: [], init: init, render: render, frame: frame, LIVE: LIVE, LIVE2: LIVE2, T: T, GT: GT };
  var _bt = buildTextures; buildTextures = function () { _bt(); EV.length = 0; initTimes(); window.FILM.POSTER = Math.round((T.scr + .75) * 30) / 30 + 1 / 60;
    window.FILM.SHOTS = [{ id: 'hook', name: 'How long?', t0: 0, t1: start('src') }, { id: 'src', name: 'Whose number', t0: start('src'), t1: start('hundred') }, { id: 'hundred', name: '100 percent', t0: start('hundred'), t1: start('why') }, { id: 'why', name: 'The punch card', t0: start('why'), t1: start('end') }, { id: 'end', name: 'Pick one', t0: start('end'), t1: DUR }]; };

  window.BOUNDS_RUN = function (step) {
    BOUNDS = []; var o = {};
    for (var t = 0; t <= DUR + 1e-6; t += step || 1 / 15) { CURT = t; POSTERMODE = false; frame(ctx, t); }
    BOUNDS.forEach(function (b) { var r = o[b.text] || (o[b.text] = { text: b.text, from: b.t, to: b.t, x0: b.x0, x1: b.x1, y1: b.y1, n: 0 }); r.to = b.t; r.n++; r.x0 = Math.min(r.x0, b.x0); r.x1 = Math.max(r.x1, b.x1); r.y1 = Math.max(r.y1, b.y1); });
    BOUNDS = null; return Object.keys(o).map(function (k) { return o[k]; });
  };
  /* rail scan: with the bleed corridor and the world off and no clip, every prop shape and glyph must stay inside x 90-930 and above y 1450 */
  window.RAIL_SCAN = function (fps, subs) {
    fps = fps || 30; subs = subs || 3; var bad = [], n = Math.round(DUR * fps), span = .5 / fps;
    LIVE2.bg = false; LIVE2.clip = false; var lg = LIVE.grain; LIVE.grain = false; var lt = LIVE.text; LIVE.text = false;
    function dirty(x, y, w, h) { var d = ctx.getImageData(x, y, w, h).data, o = { c: 0, x0: 1e9, x1: -1, y0: 1e9, y1: -1 }; for (var i = 0; i < d.length; i += 4) if (Math.abs(d[i] - 0x0b) + Math.abs(d[i + 1] - 0x08) + Math.abs(d[i + 2] - 0x20) > 24) { var px = (i / 4) % w, py = Math.floor(i / 4 / w); o.c++; o.x0 = Math.min(o.x0, px); o.x1 = Math.max(o.x1, px); o.y0 = Math.min(o.y0, y + py); o.y1 = Math.max(o.y1, y + py); } return o; }
    for (var i = 0; i < n; i++) for (var s = 0; s < subs; s++) {
      var t = (i + .5) / fps - span / 2 + span * (s + .5) / subs; frame(ctx, clamp(t, 0, DUR));
      var L0 = dirty(0, 0, 90, H), R0 = dirty(930, 0, 150, H), B0 = dirty(90, 1450, 840, H - 1450);
      if (L0.c + R0.c + B0.c > 0) { bad.push({ f: i, t: +t.toFixed(3), left: L0.c && [L0.c, L0.x0, L0.y0, L0.y1], right: R0.c && [R0.c, R0.x1 + 930, R0.y0, R0.y1], bottom: B0.c && [B0.c, B0.y1, B0.x0 + 90, B0.x1 + 90] }); break; }
    }
    LIVE2.bg = true; LIVE2.clip = true; LIVE.grain = lg; LIVE.text = lt; return bad;
  };
  window.DUR = DUR; window.EV = EV; window.TEXTS = TEXTS; window.SCORE = SCORE; window.READY = false;
  window.render = function (t, s, sh, fps) { render(t, s, sh, fps); };
})();
