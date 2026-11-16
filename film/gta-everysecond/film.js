/* "GTA 5 sold every 1.8 seconds.": Delta, pillar 1 (numbers and money).
   A vertical film written in code, narrated first and cut to the voice: every visual beat is keyed to a word time from
   vo/vo.js (window.VO) with at(id, word). Pure function of t. Contract: window.FILM, DUR, render(t), READY, EV, TEXTS(t),
   SCORE(ctx). GTA V "Nearly 235 million units sold to date" (Take-Two investor presentation, Nov 2026; Take-Two counts
   units sold-in: 10-Q, Nov 9 2026). Launch Sept 17 2013. Our math: 4,801 days = 414,806,400 s; / 230-235M = 1.77-1.80 s
   (1.8 s) on average; 47,907-48,948 a day (about 48,000). Yankee Stadium 46,537 seats. GTA VI November 19, 2026,
   PS5 and Xbox Series X|S. Engine and paper set from film/gta-outsold; hero: a paper stopwatch that pops one plain
   GTA 5 case every 1.8 s. No logos, key art, footage or music. */
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
  function calPiece(bind, lines, seed) {
    var w = 330, h = 410, tp = jag(seed, w, 4);
    return cardPiece(w, h, PADC, lines, { r: 6, sy: 14, path: function (g) { g.beginPath(); g.moveTo(-w / 2, -h / 2 + 8 + tp[0][1]); tp.forEach(function (q) { g.lineTo(-w / 2 + q[0], -h / 2 + 8 + q[1]); }); g.lineTo(w / 2, h / 2); g.lineTo(-w / 2, h / 2); g.closePath(); }, before: function (g) {
      g.fillStyle = bind; g.fillRect(-w / 2, -h / 2, w, 34);
      [-90, 0, 90].forEach(function (x) { g.fillStyle = INK2; g.beginPath(); g.arc(x, -h / 2 + 17, 7, 0, TAU); g.fill(); });
      for (var i = 0; i < 7; i++) { g.fillStyle = 'rgba(29,18,51,.07)'; g.fillRect(-w / 2 + 24 + i * 42, h / 2 - 40, 32, 18); }
    } });
  }

  /* =====================================================================================================
     THE SET: the paper sales floor from gta-outsold (plum wall, low paper sun, slow rays, palms, kraft floor).
     The hero is a paper stopwatch: its hand sweeps once every 1.8 s, and at 12 it pops one plain GTA 5 case
     (no art: a blank cream strip) onto the floor pile. That tick never stops: it is the film's rhythm, never a
     counter (no number of "copies since you started watching" is ever shown). No logos, key art, footage, music.
     ===================================================================================================== */
  var FLOOR = 1400, PADC = '#f4ead6', INK2 = '#2a1850', RED = '#e0283c', GOLD = '#ffc83d', FIELD = '#0f8f86';
  var PER = 1.8, DROP = .55, R0 = -.3;

  function caseFront(col, dark) {
    var w = 110, h = 150;
    return piece([-w / 2, -h / 2, w / 2, h / 2], function (g) { rr(g, -w / 2, -h / 2, w, h, 6); }, col, { ps: 1.4, sx: 3, sy: 6, blur: 7, edge: 1.8, extra: function (g) {
      g.fillStyle = dark; g.fillRect(-w / 2, -h / 2, 11, h);
      g.fillStyle = 'rgba(255,255,255,.22)'; g.fillRect(-w / 2 + 11, -h / 2, w - 11, 4);
      g.fillStyle = PADC; rr(g, -w / 2 + 15, -26, w - 21, 48, 4); g.fill();
      cond(g, 'condensed'); font(g, 36, 900); ls(g, 0); g.fillStyle = INK; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('GTA 5', 5, 0); unst(g);
      g.fillStyle = 'rgba(29,18,51,.12)'; for (var k = 0; k < 2; k++) g.fillRect(-w / 2 + 20, 38 + k * 12, 44 + (k * 13) % 20, 5);
    } });
  }
  function buildSet() {
    P.case = caseFront('#19d3c5', '#0f8f86');
    P.wall = buildWall();
    var tp3 = jag(311, 1100, 10), bt3 = jag(312, 1100, 10);
    P.sweepK = piece([0, -20, 1100, 1580], function (g) { g.beginPath(); g.moveTo(0, tp3[0][1]); tp3.forEach(function (p) { g.lineTo(p[0], p[1]); }); for (var i = bt3.length - 1; i >= 0; i--) g.lineTo(bt3[i][0], 1560 + bt3[i][1]); g.closePath(); }, KRAFT, { sx: 0, sy: 10, blur: 20, ps: .6, extra: function (g) { g.strokeStyle = 'rgba(60,30,10,.18)'; g.lineWidth = 3; for (var x = 30; x < 1100; x += 90) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x + 20, 1560); g.stroke(); } } });
    /* labels: every derived number travels with AVERAGE · OUR MATH; Take-Two's number with its owner and SOLD-IN */
    P.sold = cardPiece(200, 70, HOT, [['SOLD-IN', 46, CREAM, 3]], { r: 8, ring: 'rgba(255,240,234,.85)' });
    P.avg = cardPiece(430, 70, TEAL, [['AVERAGE · OUR MATH', 46, INK, 3]], { r: 8, ring: 'rgba(29,18,51,.3)' });
    P.dS = cardPiece(270, 84, CREAM, [['SEPT 17, 2013', 48, INK, 3]], { r: 8, ring: TEAL });
    P.dE = cardPiece(230, 84, CREAM, [['NOV 2026', 48, INK, 3]], { r: 8, ring: HOT });
    var rw = 780, rt = jag(51, rw, 3), rb = jag(52, rw, 3);
    P.rib = piece([0, -6, rw, 90], function (g) { g.beginPath(); g.moveTo(0, rt[0][1]); rt.forEach(function (p) { g.lineTo(p[0], p[1]); }); for (var i = rb.length - 1; i >= 0; i--) g.lineTo(rb[i][0], 84 + rb[i][1]); g.closePath(); }, NEWS, { sx: 4, sy: 8, blur: 10, extra: function (g) {
      g.fillStyle = 'rgba(29,18,51,.06)'; for (var y = 10; y < 84; y += 9) g.fillRect(0, y, rw, 1);
    } });
    /* the receipt slip: a long paper ticket with a zigzag foot; the math is printed on it as the voice says it */
    var sw0 = 560, sh0 = 660, zz = [];
    for (var x = 0; x <= sw0; x += 20) zz.push([x, (x / 20) % 2 ? 14 : 0]);
    P.slip = wordsOf(piece([-sw0 / 2, -sh0 / 2, sw0 / 2, sh0 / 2 + 14], function (g) { g.beginPath(); g.moveTo(-sw0 / 2, -sh0 / 2); g.lineTo(sw0 / 2, -sh0 / 2); zz.slice().reverse().forEach(function (p) { g.lineTo(-sw0 / 2 + p[0], sh0 / 2 + p[1]); }); g.closePath(); }, NEWS, { sx: 7, sy: 14, blur: 18, extra: function (g) {
      g.fillStyle = 'rgba(29,18,51,.045)'; for (var y = -sh0 / 2 + 12; y < sh0 / 2; y += 10) g.fillRect(-sw0 / 2, y, sw0, 1);
      g.fillStyle = INK2; g.fillRect(-sw0 / 2, -sh0 / 2, sw0, 86);
      cond(g); font(g, 50, 900); ls(g, 4); g.fillStyle = CREAM; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('DO THE MATH', 0, -sh0 / 2 + 45); unst(g);
      g.strokeStyle = INK; g.lineWidth = 5; g.beginPath(); g.moveTo(-230, 96); g.lineTo(230, 96); g.stroke();
      g.setLineDash([3, 9]); g.strokeStyle = 'rgba(29,18,51,.3)'; g.lineWidth = 3; g.beginPath(); g.moveTo(-250, 250); g.lineTo(250, 250); g.stroke();
    } }), [[-140, -sh0 / 2 + 20, 140, -sh0 / 2 + 70, 'DO THE MATH']]);
    P.ttTag = cardPiece(250, 168, CREAM, [['TAKE-TWO', 46, INK, -50], ['NOV 2026', 40, INK2, 0], ['UNITS SOLD-IN', 38, HOT, 48]], { r: 8, ring: TEAL });
    P.om = cardPiece(230, 76, TEAL, [['OUR MATH', 46, INK, 3]], { r: 8, ring: 'rgba(29,18,51,.3)' });
    P.st18 = buildStamp(['≈ 1.8 S EACH'], 84, 520, HOT);
    /* shipped: a plain box truck, a store shelf, a download cloud */
    P.stores = cardPiece(250, 78, CREAM, [['STORES', 50, INK, 3]], { r: 8, ring: ORG });
    P.dl = cardPiece(260, 74, CREAM, [['DOWNLOADS', 44, INK, 3]], { r: 8, ring: TEAL });
    P.stSold = buildStamp(['SOLD-IN'], 70, 300, HOT);
    P.box = piece([0, 0, 330, 200], function (g) { rr(g, 0, 0, 330, 200, 8); }, ORG, { sx: 5, sy: 9, blur: 10, extra: function (g) {
      g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(0, 0, 330, 12); g.fillStyle = '#c45f22'; g.fillRect(0, 170, 330, 30);
      g.strokeStyle = 'rgba(60,30,10,.25)'; g.lineWidth = 3; for (var x = 40; x < 330; x += 58) { g.beginPath(); g.moveTo(x, 18); g.lineTo(x, 166); g.stroke(); }
    } });
    P.cab = piece([0, 0, 150, 160], function (g) { g.beginPath(); g.moveTo(150, 0); g.lineTo(60, 0); g.quadraticCurveTo(20, 4, 8, 60); g.lineTo(0, 80); g.lineTo(0, 160); g.lineTo(150, 160); g.closePath(); }, TEAL, { sx: 5, sy: 9, blur: 10, extra: function (g) {
      g.fillStyle = '#bfe9f5'; g.beginPath(); g.moveTo(140, 14); g.lineTo(66, 14); g.quadraticCurveTo(34, 18, 24, 70); g.lineTo(140, 70); g.closePath(); g.fill();
      g.fillStyle = 'rgba(255,255,255,.45)'; g.fillRect(90, 20, 14, 44);
      g.fillStyle = '#0f8f86'; g.fillRect(0, 130, 150, 30); g.fillStyle = GOLD; g.fillRect(2, 104, 18, 14);
    } });
    P.door = piece([0, 0, 22, 190], function (g) { rr(g, 0, 0, 22, 190, 3); }, '#d9762e', { sx: 2, sy: 4, blur: 4, edge: 1.6 });
    P.shelf = piece([0, 0, 290, 470], function (g) { g.beginPath(); g.rect(0, 0, 290, 470); }, KRAFT, { sx: 6, sy: 10, blur: 12, extra: function (g) {
      g.fillStyle = '#8a5a2e'; g.fillRect(14, 14, 262, 442);
      g.fillStyle = 'rgba(0,0,0,.12)'; for (var i = 0; i < 3; i++) g.fillRect(14, 14 + i * 150, 262, 26);
      g.fillStyle = '#d9a66a'; for (i = 1; i <= 3; i++) g.fillRect(6, i * 150 - 4, 278, 16);
    } });
    P.cloud = piece([-150, -80, 150, 80], function (g) { g.beginPath(); g.arc(-70, 20, 58, Math.PI * .5, Math.PI * 1.5); g.arc(-10, -24, 70, Math.PI * 1.05, Math.PI * 1.95); g.arc(70, 8, 64, Math.PI * 1.4, Math.PI * .5); g.closePath(); }, CREAM, { sx: 5, sy: 9, blur: 12 });
    /* the day: a disc that turns once, sun half and night half */
    P.dayIn = buildStamp(['FULL.'], 110, 300, HOT);
    P.st48 = cardPiece(620, 150, CREAM, [['GTA 5 · ≈ 48,000 A DAY', 58, INK, -30], ['SOLD-IN · AVERAGE · OUR MATH', 40, HOT, 36]], { r: 10, ring: TEAL });
    P.yank = cardPiece(640, 86, INK2, [['YANKEE STADIUM · 46,537 SEATS', 46, CREAM, 3]], { r: 8, ring: 'rgba(251,240,234,.55)' });
    /* GTA 6 and the end */
    P.cal = calPiece(HOT, [['NOV', 62, HOT, -112], ['19', 190, INK, 0], ['2026', 72, INK, 122]], 403);
    P.calB = calPiece(HOT, [['NOV', 62, HOT, -112]], 403);
    P.e5 = cardPiece(380, 136, CREAM, [['GTA 5 · 1.8 S', 58, INK, -26], ['AVERAGE · OUR MATH', 38, HOT, 32]], { r: 10, ring: TEAL });
    P.e6 = cardPiece(380, 136, CREAM, [['GTA 6 · NOV 19', 58, INK, -26], ['PS5 · XBOX SERIES X|S', 38, INK2, 32]], { r: 10, ring: HOT });
    P.yes = cardPiece(280, 172, CREAM, [['YES', 120, INK, 6]], { r: 14, ring: TEAL });
    P.no2 = cardPiece(280, 172, CREAM, [['NO', 120, INK, 6]], { r: 14, ring: TEAL });
    /* the pile: slots filled outside-in, bottom row first; a pyramid of cases lying at small tilts */
    var r = mulberry(77); SLOTS = [];
    for (var row = 0; row < 8; row++) {
      var n = 8 - row, ord = [], a = 0, b = n - 1;
      if (row === 0) ord = [0, 1, 2, 4, 5, 6, 7, 3];
      else while (a <= b) { ord.push(b); if (a !== b) ord.push(a); a++; b--; }
      ord.forEach(function (j) { SLOTS.push({ x: 510 + (j - (n - 1) / 2) * 98 + (r() - .5) * 14, y: 1350 - row * 80 + (r() - .5) * 10, r: (r() - .5) * (row ? .6 : .18) }); });
    }
  }
  var SLOTS = [], BASE = 6, LAND = [];
  function buildTextures() { GRAIN = buildGrain(); buildSet(); }

  /* the static wall: plum paper, a halftone glow, the kraft floor; drawn once */
  function buildWall() {
    var c = mk(W, H), g = c.getContext('2d');
    var gr = g.createLinearGradient(0, 0, 0, FLOOR); gr.addColorStop(0, '#140a2c'); gr.addColorStop(.55, '#2b1748'); gr.addColorStop(1, '#4a1f5e'); g.fillStyle = gr; g.fillRect(0, 0, W, FLOOR);
    for (var x = 0; x < W; x += 120) { g.fillStyle = 'rgba(255,255,255,.025)'; g.fillRect(x + 60, 0, 60, FLOOR); }
    for (var y = 640; y < FLOOR; y += 22) for (x = 11 + ((y / 22) % 2) * 11; x < W; x += 22) { var d = Math.hypot(x - 510, y - FLOOR - 40), k = clamp(1 - d / 760, 0, 1); if (k <= 0) continue; g.fillStyle = 'rgba(255,138,61,' + (.22 * k).toFixed(3) + ')'; g.beginPath(); g.arc(x, y, 1.5 + 4.5 * k, 0, TAU); g.fill(); }
    g.fillStyle = KRAFT; g.fillRect(0, FLOOR, W, H - FLOOR);
    for (y = FLOOR + 30; y < H; y += 46) { g.fillStyle = 'rgba(60,30,10,.28)'; g.fillRect(0, y, W, 3); var off = ((y / 46) | 0) % 3 * 140; for (x = off; x < W; x += 420) g.fillRect(x, y, 3, 46); }
    g.fillStyle = '#d9a66a'; g.fillRect(0, FLOOR, W, 8); g.fillStyle = 'rgba(60,30,10,.35)'; g.fillRect(0, FLOOR + 8, W, 5);
    g.globalAlpha = .8; g.fillStyle = g.createPattern(GRAIN, 'repeat'); g.fillRect(0, 0, W, H); g.globalAlpha = 1;
    return c;
  }
  function palm(g, x, y, s, t, ph) {
    g.save(); g.translate(x, y); g.scale(s, s); g.fillStyle = '#1a0d30';
    g.beginPath(); g.moveTo(-14, 0); g.quadraticCurveTo(10, -260, 40, -520); g.lineTo(58, -516); g.quadraticCurveTo(30, -250, 14, 0); g.closePath(); g.fill();
    g.translate(48, -520); g.rotate(.05 * osc(t, 4, ph));
    for (var k = 0; k < 7; k++) { var a = -2.9 + k * .62; g.save(); g.rotate(a); g.beginPath(); g.moveTo(0, -8); g.quadraticCurveTo(110, -40, 220, 10); g.quadraticCurveTo(110, 0, 0, 8); g.closePath(); g.fill(); g.restore(); }
    g.restore();
  }

  /* =====================================================================================================
     TIME AND STATE
     ===================================================================================================== */
  var T = {}, LIVE2 = { bg: true, clip: true };
  function tq(t) { return (Math.floor(t * 30) + .5) / 30; }
  function stepv(t, v0, L) { var v = v0; for (var i = 0; i < L.length; i++) { var s = L[i]; if (t < s[0]) break; v = lerp(v, s[1], eio(seg(t, s[0], s[0] + (s[2] || .5)))); } return v; }
  function fmt(n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
  /* the stopwatch's place: hero on the hook, a corner ticker under the math, hero again (left) for GTA 6 */
  function tk(t) { return { x: stepv(t, 510, T.TKX), y: stepv(t, 935, T.TKY), R: stepv(t, 240, T.TKR) }; }
  /* hand: 0 at 12 o'clock on every release; one turn per 1.8 s */
  function handAt(t) { var u = (t - R0) / PER; return u - Math.floor(u); }
  function camAt(t) { return lerp(1, 1.04, eio(seg(t, 0, 3.4))) * (1 - .04 * eio(seg(t, T.shrink, T.shrink + .6))); }

  /* ---------- the world ---------- */
  function world(g, t) {
    g.drawImage(P.wall, 0, 0);
    g.save(); g.beginPath(); g.rect(0, 0, W, FLOOR); g.clip();
    var rot = TAU * t / DUR / 3;
    g.translate(510, FLOOR + 60);
    for (var k = 0; k < 18; k++) { var a = rot + k * TAU / 18; g.fillStyle = k % 2 ? 'rgba(255,79,163,.07)' : 'rgba(255,138,61,.08)'; g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, 1500, a, a + TAU / 36); g.closePath(); g.fill(); }
    var sg = g.createRadialGradient(0, 0, 40, 0, 0, 340); sg.addColorStop(0, 'rgba(255,200,61,.55)'); sg.addColorStop(.7, 'rgba(255,79,163,.4)'); sg.addColorStop(1, 'rgba(255,79,163,0)');
    g.fillStyle = sg; g.beginPath(); g.arc(0, 0, 340, 0, TAU); g.fill();
    g.fillStyle = 'rgba(255,170,90,.55)'; g.beginPath(); g.arc(0, 0, 230, 0, TAU); g.fill();
    for (k = 0; k < 4; k++) { g.fillStyle = 'rgba(43,23,72,.55)'; g.fillRect(-240, -200 + k * 46, 480, 10 + k * 3); }
    g.restore();
    var sx = 510 + 330 * osc(t, 7, .5);
    g.save(); g.globalAlpha = .07; g.fillStyle = '#fff3c4'; g.beginPath(); g.moveTo(sx - 60, 0); g.lineTo(sx + 60, 0); g.lineTo(sx + 260, FLOOR); g.lineTo(sx - 260, FLOOR); g.closePath(); g.fill(); g.restore();
    /* paper clouds drifting across the wall (one lap per film, so the loop is seamless) */
    [[0, 700, .8], [.37, 560, .6], [.71, 820, .7]].forEach(function (c) { var u = (t / DUR + c[0]) % 1, x = -200 + 1480 * u; g.save(); g.globalAlpha = .16; put(g, P.cloud, x, c[1] + 10 * osc(t, 5, c[0] * 9), 0, c[2]); g.restore(); });
    palm(g, -40, FLOOR + 10, 1.25, t, 0); palm(g, 1120, FLOOR + 10, -1.25, t, 2);
  }

  /* ---------- the stopwatch ---------- */
  function stopwatch(g, x, y, R, t, o) {
    o = o || {};
    var hand = o.hand == null ? handAt(t) : o.hand, press = o.press || 0, body = o.body || HOT;
    g.save(); g.translate(x, y); if (o.rot) g.rotate(o.rot); if (o.s) g.scale(o.s, o.s);
    /* cast shadow */
    g.save(); g.fillStyle = 'rgba(6,3,18,.45)'; g.beginPath(); g.arc(R * .05, R * .09, R * 1.02, 0, TAU); g.fill(); g.restore();
    /* crown and side button */
    g.fillStyle = INK2; g.fillRect(-R * .09, -R * 1.2 + press * R * .05, R * .18, R * .26);
    rr(g, -R * .2, -R * 1.34 + press * R * .07, R * .4, R * .17, R * .05); g.fillStyle = body; g.fill(); g.strokeStyle = 'rgba(255,247,228,.85)'; g.lineWidth = 2; g.stroke();
    g.save(); g.rotate(.8); g.fillStyle = INK2; g.fillRect(-R * .07, -R * 1.14, R * .14, R * .2); rr(g, -R * .12, -R * 1.2, R * .24, R * .1, 4); g.fillStyle = body; g.fill(); g.restore();
    /* body ring and face */
    g.beginPath(); g.arc(0, 0, R, 0, TAU); g.fillStyle = body; g.fill(); g.strokeStyle = 'rgba(255,247,228,.9)'; g.lineWidth = 3; g.stroke();
    g.beginPath(); g.arc(0, 0, R * .86, 0, TAU); g.fillStyle = PADC; g.fill(); g.strokeStyle = INK; g.lineWidth = Math.max(2, R * .025); g.stroke();
    /* the sweep wedge: fills from 12 to the hand, then resets */
    if (o.wedge !== false && hand > 0) { g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, R * .84, -Math.PI / 2, -Math.PI / 2 + TAU * hand); g.closePath(); g.fillStyle = o.wcol || 'rgba(25,211,197,.42)'; g.fill(); }
    /* grain on the face */
    g.save(); g.beginPath(); g.arc(0, 0, R, 0, TAU); g.clip(); g.globalAlpha = .6; g.fillStyle = g.createPattern(GRAIN, 'repeat'); g.fillRect(-R, -R, 2 * R, 2 * R); g.restore();
    for (var i = 0; i < 60; i++) {
      var a = i / 60 * TAU, big = i % 5 === 0, r0 = R * (big ? .68 : .75), r1 = R * .82;
      g.strokeStyle = INK; g.lineWidth = big ? Math.max(2, R * .03) : Math.max(1, R * .012); g.beginPath(); g.moveTo(Math.sin(a) * r0, -Math.cos(a) * r0); g.lineTo(Math.sin(a) * r1, -Math.cos(a) * r1); g.stroke();
    }
    if (o.readout && R >= 100) {
      var hv = handAt(tq(t)), sv = hv > .985 ? 1.8 : Math.floor(hv * 18 + 1e-6) / 10;
      g.fillStyle = INK2; rr(g, -R * .42, R * .2, R * .84, R * .44, R * .06); g.fill(); g.strokeStyle = 'rgba(25,211,197,.6)'; g.lineWidth = 3; g.stroke();
      txt(g, sv.toFixed(1) + ' S', 0, R * .43, { px: Math.round(R * .36), col: hv > .9 ? HOT : TEAL, align: 'center', ls: 2 });
    }
    if (o.face) { var nr = NOREC; NOREC = nr || !!o.faceNorec; stk(g, o.face, 0, R * .08, Math.max(36, R * .8), { col: o.faceCol || HOT, lw: Math.max(5, R * .05) }); NOREC = nr; }
    /* the hand */
    var ha = TAU * hand;
    g.save(); g.rotate(ha); g.lineCap = 'round';
    g.strokeStyle = INK; g.lineWidth = Math.max(3, R * .045); g.beginPath(); g.moveTo(0, R * .18); g.lineTo(0, -R * .72); g.stroke();
    g.fillStyle = HOT; g.beginPath(); g.arc(0, -R * .72, Math.max(3, R * .04), 0, TAU); g.fill();
    g.restore();
    g.fillStyle = INK; g.beginPath(); g.arc(0, 0, R * .07, 0, TAU); g.fill(); g.fillStyle = HOT; g.beginPath(); g.arc(0, 0, R * .03, 0, TAU); g.fill();
    g.restore();
  }

  /* ---------- the pile and the flying cases ---------- */
  function landedBy(t) { var n = 0; for (var i = 0; i < LAND.length; i++) if (LAND[i].t <= t) n++; return n; }
  function drawPile(g, t) {
    var po = eio(seg(t, T.pileO, T.pileO + .45)); if (po >= 1) return; g.save(); g.translate(0, 700 * po);
    var n = Math.min(SLOTS.length, BASE + landedBy(t));
    for (var i = 0; i < n; i++) {
      var s = SLOTS[i], L = i >= BASE ? LAND[i - BASE] : null, sq = L ? kn(t, L.t, .12) : 1;
      g.save(); g.translate(s.x, s.y + 30); g.scale(1 / sq, sq); g.translate(0, -30); g.rotate(s.r); put(g, P.case, 0, 0); g.restore();
    }
    g.restore();
  }
  function drawFlying(g, t, front) {
    for (var i = 0; i < LAND.length; i++) {
      var L = LAND[i]; if (t < L.r || t >= L.t || L.r > T.pileO - .3) continue;
      var s = SLOTS[BASE + i]; if (!s) continue;
      if (!!front !== !!L.front) continue;
      var u = seg(t, L.r, L.t), x = lerp(L.x0, s.x, u), y = lerp(L.y0, s.y, u * u) - L.hop * 4 * u * (1 - u);
      g.save(); g.translate(x, y); g.rotate(lerp(L.rot0, s.r, u) + L.spin * (1 - u)); var fs = L.front ? lerp(1.7, 1, u * u) : lerp(.55, 1, eo(u * 2)); g.scale(fs, fs); put(g, P.case, 0, 0); g.restore();
    }
  }

  /* ---------- paper helpers (enter by settling, leave by flying off) ---------- */
  function taped(g, pc, x, y, rot, tin, tout, t, o) {
    o = o || {}; var od = o.od || .4; if (t < tin - .02 || t > tout + od + .05) return;
    var k = cd(t, tin, o.w || 14), ko = eio(seg(t, tout, tout + od)), s = (o.s || 1) * (o.slam ? lerp(1.4, 1, eo(seg(t, tin, tin + .14))) * kn(t, tin + .12, .05) : 1) * (o.kick ? kn(t, o.kick, .08) : 1);
    var nr = NOREC; NOREC = nr || k < .97 || ko > 0 || (o.slam && t < tin + .16);
    g.save(); g.globalAlpha *= fin(t, tin, .06); g.translate(x + (o.dir || 1) * 1100 * ko + (1 - k) * (o.fromX || 0), y - (o.upOut ? 900 : 200) * ko + (1 - k) * (o.fromY == null ? -120 : o.fromY)); g.rotate(rot + (o.dir || 1) * .5 * ko + .2 * (1 - k)); g.scale(s, s);
    putW(g, pc, 0, 0);
    if (o.draw) o.draw(g, k, ko);
    if (o.tape !== false) tape(g, 0, -pc.h / 2 + 34, 90, 26, .05);
    g.restore(); NOREC = nr;
  }
  function slamT(g, s, x, y, px, t, tin, tout, o) {
    o = o || {}; if (t < tin || t > tout + .3) return;
    var ko = eio(seg(t, tout, tout + .3));
    var nr = NOREC; NOREC = nr || ko > 0; g.save(); g.translate((o.dir || -1) * 1100 * ko, -100 * ko); g.globalAlpha *= 1 - ko; slam(g, s, x, y, px, t - tin, o); g.restore(); NOREC = nr;
  }

  /* ---------- the prop layer (screen space, clipped to the rail) ---------- */
  function props(g, t) {
    var K = tk(t), hook = t < T.shrink + .3;
    drawPile(g, t);
    drawFlying(g, t, false);

    /* ===== avg: the calendar ribbon, 13 notches, 13 YEARS ===== */
    if (t >= T.rib - .05 && t < T.avgO + .5) {
      var ro = eio(seg(t, T.avgO, T.avgO + .45)), ru = eo(seg(t, T.rib, T.rib + .5));
      g.save(); g.translate(-1100 * ro, 0);
      g.save(); g.beginPath(); g.rect(120, 820, 790 * ru, 120); g.clip(); put(g, P.rib, 120, 850); g.restore();
      for (var n = 0; n < 13; n++) {
        var nx = 150 + n * 56.5, nk = seg(t, T.notch0 + n * T.notchD, T.notch0 + n * T.notchD + .1);
        if (150 + n * 56.5 > 120 + 790 * ru) break;
        g.fillStyle = nk > 0 ? TEAL : 'rgba(29,18,51,.25)'; rr(g, nx + 4, 866, 46, 52 * (nk > 0 ? kn(t, T.notch0 + n * T.notchD, .2) : 1), 5); g.fill();
        g.fillStyle = 'rgba(29,18,51,.5)'; g.fillRect(nx + 54, 860, 3, 64);
      }
      g.restore();
      taped(g, P.dS, 265, 765, -.03, T.rib + .05, T.avgO, t, { fromY: -80, dir: -1 });
      taped(g, P.dE, 735, 765, .03, T.rib + .4, T.avgO, t, { fromY: -80, dir: -1 });
      g.save(); var yk = kn(t, T.y13k, .12); g.translate(510, 1075); g.scale(yk, yk); g.translate(-510, -1075); slamT(g, '13 YEARS', 510, 1075, 128, t, T.y13, T.avgO, { col: GOLD, rot: -.04, lw: 13 }); g.restore();
    }

    /* ===== math / count / days: the receipt slip ===== */
    if (t >= T.slip - .05 && t < T.slipO + .5) {
      var sk = cd(t, T.slip, 11), so = eio(seg(t, T.slipO, T.slipO + .45)), SX = 400 + 1100 * so, SY = 965 + (1 - sk) * 900 - 120 * so;
      var nr = NOREC; NOREC = nr || sk < .97 || so > 0;
      g.save(); g.translate(SX, SY); g.rotate(-.015 + .01 * osc(t, 3, 1) + .4 * so);
      putW(g, P.slip, 0, 0);
      /* row A: the days, then the seconds (our math) */
      var aIn = t >= T.dIn, bIn = t >= T.cnt0;
      if (!aIn) { g.fillStyle = 'rgba(29,18,51,.35)'; g.fillRect(-150, -125, 340, 6); txt(g, '?', 200, -150, { px: 60, col: 'rgba(29,18,51,.4)', align: 'center' }); }
      else { var ak = eo(seg(t, T.dIn, T.dIn + .18)); g.save(); g.translate(20, -150 - 40 * (1 - ak)); g.globalAlpha *= ak; var nr1 = NOREC; NOREC = nr1 || ak < 1; txt(g, '4,801 DAYS', 0, 0, { px: 80, col: INK, align: 'center' }); NOREC = nr1; g.restore(); }
      if (t >= T.secs) { var ek = eo(seg(t, T.secs, T.secs + .2)); var nr2 = NOREC; NOREC = nr2 || ek < 1; txt(g, '= 414,806,400 SECONDS', 20, -78, { px: 48, col: INK2, align: 'center', a: ek }); NOREC = nr2; }
      /* row B: ÷ Take-Two's count, rolling in whole millions; NEARLY prints when it lands */
      txt(g, '÷', -222, 30, { px: 84, col: HOT, align: 'center' });
      if (!bIn) { g.fillStyle = 'rgba(29,18,51,.35)'; g.fillRect(-160, 58, 360, 6); txt(g, '?', 200, 30, { px: 60, col: 'rgba(29,18,51,.4)', align: 'center' }); }
      else {
        var landed = t >= T.cntL, v = 235e6 * eio(seg(t, T.roll0, T.cntL)), ck = cd(t, T.cnt0, 14);
        g.save(); g.translate(30, 30 - (1 - ck) * 60); g.scale(landed ? kn(t, T.cntL, .1) : 1, landed ? kn(t, T.cntL, .1) : 1);
        var nr3 = NOREC; NOREC = nr3 || !landed;
        txt(g, fmt(landed ? 235e6 : Math.floor(v / 1e6) * 1e6), 0, 6, { px: 80, col: landed ? INK : '#7a6a8f', align: 'center' });
        if (landed) txt(g, 'NEARLY', 0, -54, { px: 40, col: INK2, align: 'center', ls: 4, a: fin(t, T.cntL, .1) });
        NOREC = nr3; g.restore();
        if (landed && t < T.cntL + .45) KIT.impact(g, 30, 30, t - T.cntL, 1.1, HOT);
      }
      /* the answer */
      if (t < T.st18) { var qk = kn(t, T.qm, .2); g.save(); g.translate(0, 185); g.scale(qk, qk); txt(g, '= ?', 0, 0, { px: 96, col: HOT, align: 'center' }); g.restore(); }
      g.restore(); NOREC = nr;
      if (t >= T.scrib && t < T.dIn) { g.save(); g.translate(SX, SY); KIT.scribble(g, 230, 30, 60, 52, eo(seg(t, T.scrib, T.scrib + .35)), HOT, 6, 3); g.restore(); }
    }
    /* Take-Two's tag under the slip, after the counter lands */
    taped(g, P.ttTag, 800, 1000, .03, T.tag, T.slipO, t, { fromY: 60, dir: 1 });
    taped(g, P.om, 805, 812, -.03, T.secs, T.slipO, t, { fromY: -60, dir: 1 });
    /* the stamp lands on the slip, then lifts off and rides up over the shipped beat */
    if (t >= T.st18 - .02 && t < T.stkO + .5) {
      var sx0 = 400, sy0 = 1150, sx1 = 590, sy1 = 650, lift = eio(seg(t, T.slipO, T.slipO + .5)), sto = eio(seg(t, T.stkO, T.stkO + .45));
      var px = lerp(sx0, sx1, lift) - 1100 * sto, py = lerp(sy0, sy1, lift) - 100 * sto, s0 = lerp(1.5, 1, eo(seg(t, T.st18, T.st18 + .14))) * kn(t, T.st18 + .12, .05) * lerp(1, .85, lift);
      var nr4 = NOREC; NOREC = nr4 || t < T.st18 + .16 || (lift > 0 && lift < 1) || sto > 0;
      g.save(); g.translate(px, py); g.rotate(-.06 + .03 * lift - .5 * sto); g.scale(s0, s0); putW(g, P.st18, 0, 0); g.restore();
      var ay = py + 118 * lerp(1, .85, lift);
      g.save(); g.globalAlpha *= fin(t, T.st18 + .2, .15) * (1 - sto); g.translate(px, ay); putW(g, P.avg, 0, 0); g.restore();
      NOREC = nr4;
      if (t < T.st18 + .5) KIT.impact(g, sx0, sy0, t - T.st18, 1.3, HOT);
    }

    /* ===== shipped: the truck backs up to the store shelf; downloads from a cloud ===== */
    if (t >= T.shIn - .05 && t < T.shO + .5) {
      var sho = eio(seg(t, T.shO, T.shO + .45)), shelfK = cd(t, T.shIn + .1, 12);
      var nr7 = NOREC; if (sho > 0) NOREC = true;
      g.save(); g.translate(1100 * sho, 0);
      /* shelf with the cases that arrive on it */
      put(g, P.shelf, 600, 860 + (1 - shelfK) * 700);
      taped(g, P.stores, 745, 840 + (1 - shelfK) * 700, .02, T.shIn + .2, 1e9, t, { fromY: -60 });
      for (var c = 0; c < 9; c++) {
        var ct = T.unload + c * .11, cu = seg(t, ct, ct + .3); if (cu <= 0) continue;
        var row2 = Math.floor(c / 3), col2 = c % 3, tx2 = 652 + col2 * 82, ty2 = 860 + 150 * (row2 + 1) - 70;
        var fx = 560, fy = 1150;
        g.save(); g.translate(lerp(fx, tx2, eio(cu)), lerp(fy, ty2, eio(cu)) - 120 * Math.sin(Math.PI * cu)); g.rotate((1 - cu) * .8); g.scale(.68, .68); put(g, P.case, 0, 0); g.restore();
      }
      g.restore();
      NOREC = nr7;
      /* the truck reverses in from the left, wheels turning, then the rear door swings open */
      var tkk = eio(seg(t, T.truck, T.truck + .7)), tx = lerp(-520, 150, tkk) + 1100 * sho * 0 - 1100 * sho, ty = 1060 + 3 * Math.sin(t * 40) * (tkk > 0 && tkk < 1 ? 1 : 0);
      g.save(); g.translate(tx, ty);
      put(g, P.cab, 0, 40); put(g, P.box, 140, 0);
      var dk = eio(seg(t, T.door, T.door + .3)) - eio(seg(t, T.doorS, T.doorS + .14));
      g.save(); g.translate(470, 5); g.scale(Math.max(.08, 1 - dk), 1); put(g, P.door, 0, 0); g.restore();
      [70, 230, 400].forEach(function (wx) { g.save(); g.translate(wx, 205); g.rotate(-tkk * 9); g.fillStyle = INK; g.beginPath(); g.arc(0, 0, 40, 0, TAU); g.fill(); g.fillStyle = CREAM; g.beginPath(); g.arc(0, 0, 16, 0, TAU); g.fill(); g.fillStyle = INK; g.fillRect(-3, -16, 6, 12); g.restore(); });
      g.restore();
      /* SOLD-IN stamped on the box side */
      taped(g, P.stSold, tx + 300, ty + 92, -.06, T.sold, T.shO, t, { slam: true, tape: false, dir: 1 });
      /* the download cloud: an arrow bobs down and a copy pops out under it */
      var ck2 = cd(t, T.cloud, 12);
      if (t >= T.cloud - .02) {
        g.save(); g.globalAlpha *= fin(t, T.cloud, .08); g.translate(-1100 * sho, (1 - ck2) * -300);
        put(g, P.cloud, 230, 430, 0, .85);
        var ab = (t - T.cloud) * 2.2; ab = ab - Math.floor(ab);
        g.save(); g.translate(230, 430 + 24 + 50 * eio(ab)); g.globalAlpha *= 1 - seg(ab, .75, 1);
        g.fillStyle = HOT; g.strokeStyle = INK; g.lineWidth = 6; g.beginPath(); g.moveTo(-22, -40); g.lineTo(22, -40); g.lineTo(22, 0); g.lineTo(46, 0); g.lineTo(0, 46); g.lineTo(-46, 0); g.lineTo(-22, 0); g.closePath(); g.fill(); g.stroke(); g.restore();
        g.restore();
        taped(g, P.dl, 230, 600, -.03, T.cloud + .15, T.shO, t, { fromY: -60 });
      }
    }

    /* ===== day: one turn of the day disc; the pile swells; 48,000 a day ===== */
    if (t >= T.dayIn - .05 && t < T.dayO + .5) {
      var dko = eio(seg(t, T.dayO, T.dayO + .4)), dki = cd(t, T.dayIn, 12), DXc = 770, DYc = 470 + (1 - dki) * -700 - 900 * dko, DR = 140;
      var spin = TAU * eio(seg(t, T.dayIn + .1, T.dayEnd));
      g.save(); g.translate(DXc, DYc);
      g.fillStyle = 'rgba(6,3,18,.45)'; g.beginPath(); g.arc(8, 14, DR + 16, 0, TAU); g.fill();
      g.beginPath(); g.arc(0, 0, DR + 14, 0, TAU); g.fillStyle = CREAM; g.fill();
      g.save(); g.beginPath(); g.arc(0, 0, DR, 0, TAU); g.clip(); g.rotate(spin);
      g.fillStyle = '#ffb45c'; g.fillRect(-DR, -DR, 2 * DR, DR); g.fillStyle = '#21164a'; g.fillRect(-DR, 0, 2 * DR, DR);
      g.fillStyle = GOLD; g.beginPath(); g.arc(0, -DR * .55, DR * .26, 0, TAU); g.fill();
      for (var q = 0; q < 10; q++) { var qa = q / 10 * TAU; g.strokeStyle = GOLD; g.lineWidth = 6; g.beginPath(); g.moveTo(Math.cos(qa) * DR * .34, -DR * .55 + Math.sin(qa) * DR * .34); g.lineTo(Math.cos(qa) * DR * .44, -DR * .55 + Math.sin(qa) * DR * .44); g.stroke(); }
      g.fillStyle = CREAM; g.beginPath(); g.arc(0, DR * .55, DR * .22, 0, TAU); g.fill(); g.fillStyle = '#21164a'; g.beginPath(); g.arc(DR * .1, DR * .5, DR * .2, 0, TAU); g.fill();
      for (q = 0; q < 7; q++) { g.fillStyle = CREAM; g.beginPath(); g.arc(Math.cos(q * 2.1) * DR * .7, DR * .3 + Math.abs(Math.sin(q * 1.7)) * DR * .5, 4, 0, TAU); g.fill(); }
      g.restore();
      g.save(); g.globalAlpha = .5; g.beginPath(); g.arc(0, 0, DR, 0, TAU); g.clip(); g.fillStyle = g.createPattern(GRAIN, 'repeat'); g.fillRect(-DR, -DR, 2 * DR, 2 * DR); g.restore();
      g.fillStyle = HOT; g.beginPath(); g.moveTo(-18, -DR - 30); g.lineTo(18, -DR - 30); g.lineTo(0, -DR + 6); g.closePath(); g.fill(); g.strokeStyle = INK; g.lineWidth = 4; g.stroke();
      g.restore();
      slamT(g, '≈ 48,000', 470, 800, 150, t, T.d48, T.dayO, { col: CREAM, rot: -.04, lw: 14, dir: -1 });
      slamT(g, 'A DAY', 470, 925, 92, t, T.aday, T.dayO, { col: GOLD, rot: -.03, lw: 10, dir: -1 });
      taped(g, P.sold, 245, 1035, -.03, T.dayTag, T.dayO, t, { fromY: 40, tape: false, dir: -1 });
      taped(g, P.avg, 600, 1035, .02, T.dayTag + .08, T.dayO, t, { fromY: 40, tape: false, dir: -1 });
    }

    /* ===== stadium: a plain paper ballpark (no logos, no marks) fills with cases ===== */
    if (t >= T.stIn - .05 && t < T.stO + .5) {
      var bk = cd(t, T.stIn, 11), bo = eio(seg(t, T.stO, T.stO + .45)), BXc = 510, BYc = 1060 + (1 - bk) * 800 + 900 * bo;
      g.save(); g.translate(BXc, BYc);
      /* light poles */
      [-365, 365].forEach(function (lx) { g.fillStyle = INK2; g.fillRect(lx - 6, -330, 12, 120); g.fillStyle = CREAM; rr(g, lx - 46, -372, 92, 46, 6); g.fill(); g.fillStyle = 'rgba(255,200,61,.8)'; for (var q2 = 0; q2 < 4; q2++) { g.beginPath(); g.arc(lx - 30 + q2 * 20, -349, 7, 0, TAU); g.fill(); } });
      /* bowl */
      g.save(); g.scale(1.02, .95);
      g.fillStyle = 'rgba(6,3,18,.5)'; g.beginPath(); g.ellipse(10, 20, 412, 268, 0, 0, TAU); g.fill();
      g.fillStyle = '#d9c7a6'; g.beginPath(); g.ellipse(0, 0, 410, 262, 0, 0, TAU); g.fill(); g.strokeStyle = 'rgba(255,247,228,.9)'; g.lineWidth = 3; g.stroke();
      g.fillStyle = '#c2a983'; g.beginPath(); g.ellipse(0, 6, 380, 238, 0, 0, TAU); g.fill();
      /* seats: four tiers, filled outer tier first, sweeping round */
      var fill = eio(seg(t, T.fill0, T.fill1)), tiers = [[372, 232], [346, 214], [320, 196], [294, 178]], all = 0, cols = [TEAL, HOT, ORG, TEAL, CREAM];
      tiers.forEach(function (tr) { all += Math.round(tr[0] * 1.95 * Math.PI * (300 / 360) / 19); });
      var lit = Math.floor(fill * all), cnt = 0;
      tiers.forEach(function (tr, ti) {
        var ns = Math.round(tr[0] * 1.95 * Math.PI * (300 / 360) / 19);
        for (var s2 = 0; s2 < ns; s2++) {
          var a2 = Math.PI * (120 / 180) + (s2 + .5) / ns * Math.PI * (300 / 180), sx2 = Math.cos(a2) * tr[0], sy2 = Math.sin(a2) * tr[1] + 6;
          var on = cnt < lit; cnt++;
          g.save(); g.translate(sx2, sy2); g.rotate(a2 + Math.PI / 2);
          g.fillStyle = on ? cols[(s2 + ti * 2) % 5] : 'rgba(42,24,80,.35)'; g.fillRect(-7, -6, 14, 12);
          g.restore();
        }
      });
      /* field */
      g.fillStyle = FIELD; g.beginPath(); g.ellipse(0, 30, 268, 158, 0, 0, TAU); g.fill();
      g.save(); g.beginPath(); g.ellipse(0, 30, 268, 158, 0, 0, TAU); g.clip();
      for (var st2 = -6; st2 < 7; st2++) { g.fillStyle = st2 % 2 ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.05)'; g.fillRect(st2 * 44, -140, 44, 340); }
      g.globalAlpha = .5; g.fillStyle = g.createPattern(GRAIN, 'repeat'); g.fillRect(-270, -140, 540, 340); g.globalAlpha = 1;
      g.restore();
      g.save(); g.translate(0, 100); g.scale(1, .6); g.rotate(Math.PI / 4);
      g.fillStyle = '#c98a55'; g.fillRect(-120, -120, 240, 240); g.fillStyle = FIELD; g.fillRect(-92, -92, 184, 184);
      g.fillStyle = CREAM; [[-120, -120], [120, -120], [120, 120], [-120, 120]].forEach(function (b) { g.fillRect(b[0] - 11, b[1] - 11, 22, 22); });
      g.restore();
      g.fillStyle = '#c98a55'; g.beginPath(); g.ellipse(0, 100, 22, 13, 0, 0, TAU); g.fill();
      g.restore(); g.restore();
      /* cases spill over the rim on "Every day" */
      for (var sp = 0; sp < 8; sp++) {
        var su = seg(t, T.spill + sp * .05, T.spill + sp * .05 + .55); if (su <= 0 || su >= 1 || bo > 0) continue;
        var sa = Math.PI * (.2 + sp * .085), sx3 = BXc + Math.cos(sa) * 330, sy3 = BYc + Math.sin(sa) * 200, dir = Math.cos(sa) < 0 ? -1 : 1, cs = lerp(.6, 1.5, su);
        g.save(); g.translate(sx3 + dir * 120 * su, sy3 - 120 * su + 360 * su * su); g.rotate(dir * su * 2.4); g.scale(cs, cs); put(g, P.case, 0, 0); g.restore();
      }
      taped(g, P.dayIn, BXc, BYc + 20, -.07, T.full, T.stO, t, { slam: true, tape: false, dir: 1 });
      if (t >= T.full && t < T.full + .5) KIT.impact(g, BXc, BYc + 20, t - T.full, 1.4, HOT);
      taped(g, P.yank, 510, 1362 + 900 * bo, .01, T.stIn + .1, T.stO, t, { fromY: 60, dir: 1 });
      taped(g, P.st48, 465, 588, -.02, T.stIn + .1, T.stO, t, { fromY: -60, dir: -1, kick: T.full + .1 });
    }

    /* ===== the stopwatch(es) ===== */
    var press = bump(t, LAND.length ? nextRelease(t) - .02 : -9, .16);
    if (t >= T.g6In - .02) {
      var gk = cd(t, T.g6In, 12);
      stopwatch(g, 730, 960 + (1 - gk) * 760, 150, t, { hand: 0, wedge: false, face: '?', body: TEAL, faceCol: HOT, faceNorec: gk < .97 });
    }
    stopwatch(g, K.x, K.y, K.R, t, { readout: t >= .3, press: press, rot: .03 * osc(t, 4, 1) + sw(t, T.qq, .12, 9, 3), s: kn(t, T.qq, .1) });
    if (t >= T.qq && t < T.qq + .9) KIT.emote(g, '?', K.x - K.R * .9, K.y - K.R * 1.2, .9, t - T.qq, t);
    /* labels under the two watches */
    taped(g, P.e5, 290, 1215, -.02, T.e5, T.seamC, t, { fromY: 80, dir: -1 });
    taped(g, P.e6, 730, 1215, .02, T.e6, T.seamC, t, { fromY: 80, dir: 1 });
    /* the calendar page slides in from the left under the caption (never across it), 19 flips in */
    if (t >= T.cal - .02 && t < T.calO + .5) {
      var ci = cd(t, T.cal, 13), co = eio(seg(t, T.calO, T.calO + .4)), nr5 = NOREC; NOREC = nr5 || ci < .97 || co > 0;
      g.save(); g.translate(510 - 900 * (1 - ci) + 1100 * co, 655); g.rotate(.04 + .02 * osc(t, 4, 2) + .15 * (1 - ci) + .4 * co); putW(g, P.cal, 0, 0, 0, .62 * kn(t, T.calK, .08));
      var fu = seg(t, T.f19, T.f19 + .28);
      if (fu < 1) { g.save(); g.scale(.62, .62); g.translate(0, -205); g.scale(1, Math.max(.02, Math.cos(Math.PI / 2 * eio(fu)))); g.translate(0, 205); NOREC = true; putW(g, P.calB, 0, 0); g.restore(); }
      g.restore(); NOREC = nr5;
      if (t >= T.calK && t < T.calO) { g.save(); KIT.scribble(g, 510, 662, 62, 52, eo(seg(t, T.calK, T.calK + .3)), TEAL, 6, 8); g.restore(); }
    }
    /* end: two identical answers, neither highlighted */
    taped(g, P.yes, 300, 655, .03 * osc(t, 9, 0), T.yes, T.seamC, t, { slam: true, tape: false, dir: -1 });
    taped(g, P.no2, 720, 655, .03 * osc(t, 9, 2), T.no, T.seamC, t, { slam: true, tape: false, dir: 1 });

    /* ===== hook labels: SOLD-IN on frame 0, AVERAGE · OUR MATH pops in on "seconds" ===== */
    if (t < T.hookO + .5) {
      var ho = eio(seg(t, T.hookO, T.hookO + .4)), sl = eio(seg(t, T.shrink, T.shrink + .5)), sxk = lerp(510, 300, eio(seg(t, T.avgPop - .1, T.avgPop + .25))) - 75 * sl;
      var nr6 = NOREC; NOREC = nr6 || ho > 0;
      if (t >= T.soldIn - .02) { var sik = cd(t, T.soldIn, 14), nr7 = NOREC; NOREC = nr7 || sik < .97; g.save(); g.globalAlpha *= fin(t, T.soldIn, .06); g.translate(-1100 * ho, (1 - sik) * -60); putW(g, P.sold, sxk, 568, -.02, lerp(1.3, 1, eo(seg(t, T.soldIn, T.soldIn + .14)))); g.restore(); NOREC = nr7; }
      NOREC = nr6;
      taped(g, P.avg, 635 - 115 * sl, 568, .02, T.avgPop, T.hookO, t, { slam: true, tape: false, dir: -1 });
    }
    drawFlying(g, t, true);
  }
  function nextRelease(t) { var best = -9; for (var i = 0; i < LAND.length; i++) if (LAND[i].tick && LAND[i].r <= t + .02) best = LAND[i].r; return best; }

  /* ---------- captions: paper tape in the upper third, phrase by phrase; the hook card is frame 0 and the last frame ---------- */
  var GLUE = { the: 1, a: 1, an: 1, your: 1, its: 1, of: 1, at: 1, to: 1, and: 1, in: 1, with: 1, on: 1, by: 1, so: 1, for: 1, own: 1, how: 1, that: 1, if: 1, you: 1, no: 1, or: 1, it: 1, was: 1, will: 1, most: 1, more: 1, than: 1, plus: 1, about: 1 };
  var CAPS = (function () {
    var outc = [];
    VO.lines.forEach(function (l) {
      var cur = [], ws = l.words.slice();
      ws.forEach(function (w, i) { cur.push(w); if (/[.?!:]["”]?$/.test(w.w) && i < ws.length - 1) { cur.id = l.id; outc.push(cur); cur = []; } });
      if (cur.length) { cur.id = l.id; outc.push(cur); }
    });
    return outc.map(function (ws) { return { id: ws.id, t0: ws[0].t0, t1: ws[ws.length - 1].t1, s: ws[0].t0 - .04, words: ws }; });
  })();
  /* the hook card reads GTA 5 · EVERY 1.8 SECONDS (5 words on frame 0); each word lights on its spoken time */

  var STRESS;
  function stressed(w) { for (var i = 0; i < STRESS.length; i++) if (Math.abs(STRESS[i] - w.t0) < .02) return true; return false; }
  var CAPY = 400, CAPX = { math: [390, 540], count: [390, 540], days: [390, 540], shipped: [620, 540], day: [360, 500] };
  function captions(g, t) {
    t = tq(t);
    var card0 = null, ci = -1;
    if (t >= T.loopCap) { card0 = CAPS[0]; ci = -1; }
    else CAPS.forEach(function (c, i) { if (t >= c.s) { card0 = c; ci = i; } });
    if (!card0) return;
    var nx = ci >= 0 ? CAPS[ci + 1] : null, ns = nx ? nx.s : T.loopCap, end = ci === 0 || !nx ? ns : Math.min(card0.t1 + .55, ns);
    if (ci >= 0 && t >= end) return;
    var k = ci === -1 ? cd(t, T.loopCap, 16) : (ci === 0 ? 1 : cd(t, card0.s, 16));
    g.save(); cond(g); var cpx = 76; font(g, cpx, 900); ls(g, 1); g.textBaseline = 'alphabetic';
    var words = card0.words, up = words.map(function (w) { return w.w.toUpperCase(); }), ws = up.map(function (u) { return g.measureText(u).width; }), gap = cpx * .26;
    var cp = CAPX[card0.id] || [510, 740], lines, lw, maxw = cp[1], CXc = cp[0];
    function lay2() { lines = [[]]; lw = [0]; words.forEach(function (w, i) { var Ln = lines.length - 1; if (lw[Ln] + ws[i] > maxw && lines[Ln].length) { lines.push([]); lw.push(0); Ln++; } lines[Ln].push(i); lw[Ln] += ws[i] + gap; }); }
    function fixLines() {
      for (var Ln = 0; Ln < lines.length - 1; Ln++) { var last = lines[Ln][lines[Ln].length - 1]; while (lines[Ln].length > 1 && (GLUE[norm(words[last].w)] || words[last].w === '·')) { lines[Ln].pop(); lines[Ln + 1].unshift(last); last = lines[Ln][lines[Ln].length - 1]; } }
      var n = lines.length; if (n > 1 && lines[n - 1].length === 1 && lines[n - 2].length > 2) lines[n - 1].unshift(lines[n - 2].pop());
      lines.forEach(function (ln) { if (ln.length > 1 && words[ln[0]].w === '·') ln.shift(); });
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
        var w = words[i], nw = words[i + 1], cur = ci >= 0 && stressed(w) && t >= w.t0 - .03 && t < Math.min(w.t1 + .05, nw && nw.t0 < 90 ? nw.t0 - .03 : 1e9) + .2;
        if (ci === 0 && w.w === '1.8' && t >= w.t0 - .03) cur = true;
        if (cur) { g.fillStyle = HOT; g.fillRect(x - 6, y + cpx * .06, ws[i] + 12, cpx * .12); }
        g.fillStyle = cur ? HOT : (w.w === '·' ? HOT : INK); g.fillText(up[i], x, y); x += ws[i] + gap;
      });
      g.restore();
    });
    g.restore(); unst(g); ls(g, 0);
  }

  var NOISE, POSTERMODE = false, VIG = null;
  function stage(g) { g.fillStyle = BG; g.fillRect(0, 0, W, H); }
  function vignette(g) {
    if (!VIG) { VIG = mk(W, H); var q = VIG.getContext('2d'), gr = q.createRadialGradient(510, 900, 520, 510, 920, 1300); gr.addColorStop(0, 'rgba(6,3,18,0)'); gr.addColorStop(1, 'rgba(6,3,18,.6)'); q.fillStyle = gr; q.fillRect(0, 0, W, H); }
    g.drawImage(VIG, 0, 0);
  }
  function sweep(g, t, tm, pc, sp) {
    sp = sp || .27; var k = seg(t, tm - sp, tm + sp); if (k <= 0 || k >= 1) return;
    var y = lerp(1980, -2150, eio(k));
    g.save(); g.translate(-10, y); g.rotate(-.03); g.scale(1, 1.32); put(g, pc, 0, 0); g.restore();
  }
  function railClip(g) { g.beginPath(); if (LIVE2.clip) g.rect(BX0, 0, BX1 - BX0, BY1); else g.rect(-500, -500, 2080, BY1 + 500); g.clip(); }
  /* the loop: from the seam on, the picture is the hook's run-up (t - DUR), so the last frame leads into frame 0 */
  function sceneT(t) { return t >= T.seamC ? t - DUR : t; }
  function frame(g, t) {
    g.setTransform(1, 0, 0, 1, 0, 0);
    stage(g);
    var st = sceneT(t), cam = camAt(st);
    g.save(); g.translate(510, 900); g.scale(cam, cam); g.translate(-510, -900);
    if (LIVE2.bg) { world(g, st); }
    g.restore();
    if (LIVE2.bg) vignette(g);
    g.save(); railClip(g); g.translate(510, 900); g.scale(cam, cam); g.translate(-510, -900); props(g, st); g.restore();
    if (!POSTERMODE && LIVE.text) captions(g, t);
    g.save(); sweep(g, t, T.seamC, P.sweepK, .17); g.restore();
    if (LIVE.grain && NOISE && LIVE2.bg) { g.globalAlpha = .05; g.globalCompositeOperation = 'overlay'; var o = Math.floor(t * 24) * 37 % 256; g.fillStyle = g.createPattern(NOISE, 'repeat'); g.translate(-o, -o); g.fillRect(o, o, W, H); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }
  }
  function TEXTS(t) {
    var o = [];
    function Tx(id, text, a, b) { if (t >= a && t < b) o.push({ id: id, text: text, x0: 0, y0: 0, x1: 0, y1: 0 }); }
    var st = sceneT(t);
    Tx('sold0', 'SOLD-IN', T.soldIn + .16, T.hookO);
    Tx('avg0', 'AVERAGE · OUR MATH', T.avgPop + .16, T.hookO);
    Tx('dS', 'SEPT 17, 2013', T.rib + .3, T.avgO); Tx('dE', 'NOV 2026', T.rib + .6, T.avgO);
    Tx('y13', '13 YEARS', T.y13 + .14, T.avgO);
    Tx('math', 'DO THE MATH', T.slip + .3, T.slipO);
    Tx('cnt', 'NEARLY 235,000,000', T.cntL + .05, T.slipO);
    Tx('tt1', 'TAKE-TWO', T.tag + .25, T.slipO); Tx('tt3', 'NOV 2026', T.tag + .25, T.slipO); Tx('tt2', 'UNITS SOLD-IN', T.tag + .25, T.slipO);
    Tx('om', 'OUR MATH', T.secs + .2, T.slipO);
    Tx('days', '4,801 DAYS', T.dIn + .18, T.slipO);
    Tx('secs', '= 414,806,400 SECONDS', T.secs + .2, T.slipO);
    Tx('st18', '≈ 1.8 S EACH', T.st18 + .16, T.stkO); Tx('avg1', 'AVERAGE · OUR MATH', T.st18 + .3, T.stkO);
    Tx('stores', 'STORES', T.shIn + .4, T.shO); Tx('dl', 'DOWNLOADS', T.cloud + .32, T.shO); Tx('soldT', 'SOLD-IN', T.sold + .16, T.shO);
    Tx('d48', '≈ 48,000 A DAY', T.aday + .14, T.stO);
    Tx('avg2', 'AVERAGE · OUR MATH', T.dayTag + .3, T.stO); Tx('sold2', 'SOLD-IN', T.dayTag + .3, T.stO);
    Tx('yank', 'YANKEE STADIUM · 46,537 SEATS', T.stIn + .35, T.stO);
    Tx('full', 'FULL.', T.full + .16, T.stO);
    Tx('e5', 'GTA 5 · 1.8 S', T.e5 + .3, T.seamC); Tx('e5b', 'AVERAGE · OUR MATH', T.e5 + .3, T.seamC); Tx('e6', 'GTA 6 · NOV 19', T.e6 + .3, T.seamC);
    Tx('e6b', 'PS5 · XBOX SERIES X|S', T.e6 + .3, T.seamC);
    Tx('cal', 'NOV 19 2026', T.f19 + .25, T.calO);
    Tx('yes', 'YES', T.yes + .14, T.seamC); Tx('no', 'NO', T.no + .14, T.seamC);
    return o;
  }

  /* ---------- times and sound events, all from the voice ---------- */
  function initTimes() {
    T.seamC = DUR - .3; T.loopCap = DUR - .12;
    function F(id, t, type, gain) { GT[id] = t; EV.push({ t: t, type: type, g: gain == null ? 1 : gain, id: id }); return t; }
    /* hook: SOLD-IN on frame 0; AVERAGE · OUR MATH on "seconds" */
    T.avgPop = at('hook', 'seconds') - .02; T.soldIn = .8;
    T.shrink = start('avg') - .2;
    /* avg: ribbon on "average", 13 notches from "thirteen", 13 YEARS slams in the pause */
    T.rib = at('avg', 'average') - .1; T.notch0 = at('avg', 'thirteen'); T.notchD = (lastw('avg') - T.notch0) / 13;
    T.y13 = at('avg', 'years') - .03; T.y13k = G('y13k', after('avg'), 'slap', .4, 3.2);
    /* math: the stopwatch wobbles after "fake?"; the slip slides up on "Do"; "= ?" knocks on "math" */
    T.qq = G('qq', wend('math', 'fake') + .05, 'pop', .3, 1.4);
    T.avgO = at('math', 'do') - .15; T.hookO = T.avgO;
    T.slip = at('math', 'do') - .05; T.qm = at('math', 'math');
    G('slipS', after('math'), 'pin', .3, 1.8);
    /* count: the counter drops into row B on "Take-Two", rolls on "nearly", lands in the pause; the owner tag follows */
    T.cnt0 = at('count', 'taketwo') - .05; T.roll0 = at('count', 'nearly'); T.scrib = at('count', 'sold') - .1;
    T.cntL = G('cntL', after('count'), 'thock', .45, 2.2);
    T.tag = G('tag', T.cntL + .22, 'pin', .3, 1.2);
    /* days: 4,801 DAYS lands on the number, the seconds row on "days", the stamp in the pause */
    T.dIn = at('days', '4801') + .05; T.secs = T.dIn + .42;
    T.st18 = G('st18', after('days'), 'stamp', .45, 2.2);
    /* shipped: the slip leaves, the stamp rides up; the truck reverses in, the door opens on "shipped", cases unload */
    T.slipO = at('shipped', 'copies'); T.shIn = at('shipped', 'copies') - .1; T.truck = at('shipped', 'copies') - .2;
    T.door = at('shipped', 'shipped') - .1; T.unload = at('shipped', 'shipped') + .15; T.sold = at('shipped', 'stores') - .05;
    T.cloud = at('shipped', 'stores') - .22;
    T.doorS = G('doorS', after('shipped'), 'slam', .45, 1);
    /* day: the disc turns once; ≈ 48,000 on the number; A DAY; the pile swells */
    T.stkO = start('day') - .05; T.shO = start('day') - .1;
    T.dayIn = start('day') - .15; T.dayEnd = lastw('day') + .2;
    T.d48 = at('day', '48000') - .03; T.aday = at('day', 'a') - .02; T.dayTag = at('day', 'about') - .05;
    var dk = G('dayK', after('day'), 'thock', .45, 1.6);
    /* stadium: the ballpark rises in the pause; seats fill to "full"; FULL. on "full"; spill in the pause after "Every day." */
    T.dayO = dk - .02; T.stIn = dk + .02; T.fill0 = T.stIn + .1; T.fill1 = at('stadium', 'full') - .02; T.full = at('stadium', 'full');
    T.spill = G('spill', after('stadium'), 'riffle', .45, 1.2);
    T.stO = at('gta6', 'lands') - .3;
    /* gta6: the ticker grows into the left watch; the GTA 6 watch drops in on "6"; the calendar on "November" */
    T.g6In = at('gta6', 'lands') - .05; T.e5 = T.stO + .3; T.e6 = at('gta6', 'lands') + .1;
    T.cal = at('gta6', 'lands') - .05; T.f19 = at('gta6', 'november') - .1;
    T.calK = G('calK', after('gta6'), 'thock', .3, 2.6, { m: .1 });
    /* end: YES / NO, identical, once the caption reads the question */
    T.calO = at('end', 'keep') - .3; T.pileO = start('end') - .1;
    T.yes = at('end', 'keep') - .05; T.no = T.yes + .1;
    G('seam', T.seamC - .12, 'swish', .3, 1.8);
    /* the stopwatch's place */
    var g6 = T.stO - .1, mk = at('math', 'do') - .3, shk = T.slipO - .1, dyk = T.dayIn - .1, stk2 = T.stIn - .1;
    T.TKX = [[T.shrink, 848, .55], [mk, 790, .5], [shk, 150, .5], [dyk, 870, .45], [stk2, 848, .45], [g6, 290, .6]];
    T.TKY = [[T.shrink, 600, .55], [mk, 470, .5], [shk, 770, .5], [dyk, 770, .45], [stk2, 600, .45], [g6, 960, .6]];
    T.TKR = [[T.shrink, 70, .55], [mk, 130, .5], [shk, 55, .5], [dyk, 50, .45], [stk2, 70, .45], [g6, 150, .6]];
    /* the native move: a release every 1.8 s (a quiet click), the case lands DROP later (a soft knock in a gap) */
    LAND.length = 0;
    /* each landing moves (0.3-0.95 s after its release) into the nearest voice gap so its knock is heard, never under a word */
    function hasEv(t2) { return EV.some(function (e) { return Math.abs(e.t - t2) < .2; }); }
    /* the earliest voice gap point 0.25-1.8 s after the release (before the next case lands) with no other hit within 0.2 s */
    function landGap(r) {
      var best = null;
      free(.15).forEach(function (f) {
        for (var c = Math.max(f[0], r + .25); c <= Math.min(f[1] - .12, r + 1.8) + 1e-6; c += .01) if (!hasEv(c)) { if (best === null || c < best) best = c; break; }
      });
      return best;
    }
    for (var k = 0; R0 + k * PER < DUR + 1; k++) {
      var r = R0 + k * PER, K = tk(r), lt = r + DROP, ng = landGap(r);
      if (r > T.pileO - .3) break;
      var heard = ng !== null;
      if (heard) lt = ng;
      LAND.push({ r: r, t: lt, x0: K.x + K.R * .8, y0: K.y - K.R * .75, hop: K.R > 120 ? 300 : 110, rot0: 0, spin: (k % 2 ? 1 : -1) * (K.R > 120 ? .6 : 2.5), tick: true, front: r < T.shrink });
      /* frame 0: the first case hangs at the top of its arc, big and nearly still, beside the dial's shoulder */
      if (k === 0) { var L0 = LAND[LAND.length - 1]; L0.r = -.45; L0.t = .45; L0.hop = 260; L0.x0 = K.x + K.R * 1.35; L0.y0 = K.y - K.R * .2; L0.spin = .25; heard = false; }
      if (heard) F('land' + k, lt, 'thock', lt > 2.9 && lt < 3.6 ? 1.9 : 1.6);
      if (r > 0) { var nr0 = nearGap(r, 'tick'); if (nr0 !== null && Math.abs(nr0 - r) < .03 && !hasEv(r)) F('rel' + k, r, 'tick', .7); }
    }
    /* the hook pause carries the drop: a real thunk in 2.95-3.55 s */
    /* (the second case is the one that lands in it: land1 at about 3.3 s, louder than the rest) */
    /* the day's rain: twelve more cases, fast, from the ticker (silent: they fall under the words) */
    for (var j = 0; j < 12; j++) { var rr2 = T.d48 + .05 + j * .06, K2 = tk(rr2); LAND.push({ r: rr2, t: rr2 + .4, x0: K2.x + (j % 3 - 1) * 20, y0: K2.y - 40, hop: 140, rot0: 0, spin: (j % 2 ? 1 : -1) * 3, tick: false, front: false }); }
    LAND.sort(function (a, b) { return a.t - b.t; });
    STRESS = [['hook', '18'], ['avg', 'thirteen'], ['math', 'math'], ['count', '235'], ['days', '4801'], ['shipped', 'shipped'], ['day', '48000'], ['stadium', 'full'], ['stadium', 'average'], ['gta6', 'november'], ['end', 'thirteen']].map(function (p) { return at(p[0], p[1]); });
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
    var TYPE_DB = window.SFX_TYPE_DB || { stamp: -8, slam: -12, crack: -14, click: -10.5, swish: -14, tear: -24, pop: -29.5, clank: -16, thock: -19, slap: -14, pin: -14, riffle: -13, snap: -24.5, tick: -20 };
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
    return Promise.all(fonts.map(function (f) { return document.fonts.load(f, 'Aa0%°×÷−≈≠µ“”’·→…#?‹|~$+—½@&!'); })).then(function () { return document.fonts.ready; }).then(function () {
      buildTextures();
      window.READY = true;
    });
  }

  window.FILM = { bare: function () { ctx.setTransform(1, 0, 0, 1, 0, 0); stage(ctx); }, W: W, H: H, DUR: DUR, POSTER: 0, SLUG: 'gta-everysecond', SHOTS: [], init: init, render: render, frame: frame, LIVE: LIVE, LIVE2: LIVE2, T: T, GT: GT };
  var _bt = buildTextures; buildTextures = function () { _bt(); EV.length = 0; initTimes(); window.FILM.POSTER = Math.round((T.spill + .35) * 30) / 30 + 1 / 60;
    window.FILM.SHOTS = [{ id: 'hook', name: 'Every 1.8 s', t0: 0, t1: start('math') }, { id: 'math', name: 'Do the math', t0: start('math'), t1: start('shipped') }, { id: 'shipped', name: 'Sold-in', t0: start('shipped'), t1: start('day') }, { id: 'day', name: '48,000 a day', t0: start('day'), t1: start('stadium') }, { id: 'stadium', name: 'A full stadium', t0: start('stadium'), t1: start('gta6') }, { id: 'gta6', name: 'GTA 6', t0: start('gta6'), t1: DUR }]; };

  window.BOUNDS_RUN = function (step) {
    BOUNDS = []; var o = {};
    for (var t = 0; t <= DUR + 1e-6; t += step || 1 / 15) { CURT = t; POSTERMODE = false; frame(ctx, t); }
    BOUNDS.forEach(function (b) { var r = o[b.text] || (o[b.text] = { text: b.text, from: b.t, to: b.t, x0: b.x0, x1: b.x1, y1: b.y1, n: 0 }); r.to = b.t; r.n++; r.x0 = Math.min(r.x0, b.x0); r.x1 = Math.max(r.x1, b.x1); r.y1 = Math.max(r.y1, b.y1); });
    BOUNDS = null; return Object.keys(o).map(function (k) { return o[k]; });
  };
  /* rail scan: with the world off and no clip, every prop shape and glyph must stay inside x 90-930 and above y 1450 */
  window.RAIL_SCAN = function (fps, subs) {
    fps = fps || 30; subs = subs || 3; var bad = [], n = Math.round(DUR * fps), span = .5 / fps;
    LIVE2.bg = false; LIVE2.clip = false; var lg = LIVE.grain; LIVE.grain = false; var lt = LIVE.text; LIVE.text = false;
    function dirty(x, y, w, h) { var d = ctx.getImageData(x, y, w, h).data, o = { c: 0, x0: 1e9, x1: -1, y0: 1e9, y1: -1 }; for (var i = 0; i < d.length; i += 4) if (Math.abs(d[i] - 0x0b) + Math.abs(d[i + 1] - 0x08) + Math.abs(d[i + 2] - 0x20) > 24) { var px = (i / 4) % w, py = Math.floor(i / 4 / w); o.c++; o.x0 = Math.min(o.x0, px); o.x1 = Math.max(o.x1, px); o.y0 = Math.min(o.y0, y + py); o.y1 = Math.max(o.y1, y + py); } return o; }
    for (var i = 0; i < n; i++) for (var s = 0; s < subs; s++) {
      var t = (i + .5) / fps - span / 2 + span * (s + .5) / subs; frame(ctx, clamp(t, 0, DUR));
      var L0 = dirty(0, 0, 90, H), R0b = dirty(930, 0, 150, H), B0 = dirty(90, 1450, 840, H - 1450);
      if (L0.c + R0b.c + B0.c > 0) { bad.push({ f: i, t: +t.toFixed(3), left: L0.c && [L0.c, L0.x0, L0.y0, L0.y1], right: R0b.c && [R0b.c, R0b.x1 + 930, R0b.y0, R0b.y1], bottom: B0.c && [B0.c, B0.y1, B0.x0 + 90, B0.x1 + 90] }); break; }
    }
    LIVE2.bg = true; LIVE2.clip = true; LIVE.grain = lg; LIVE.text = lt; return bad;
  };
  window.DUR = DUR; window.EV = EV; window.TEXTS = TEXTS; window.SCORE = SCORE; window.READY = false;
  window.render = function (t, s, sh, fps) { render(t, s, sh, fps); };
})();
