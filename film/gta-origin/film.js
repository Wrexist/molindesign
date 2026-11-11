/* "GTA Was Almost Canceled": Delta, pillar 3 (GTA history).
   A vertical film written in code, narrated first and cut to the voice: every visual beat is keyed to a word time from
   vo/vo.js (window.VO) with at(id, word). Pure function of t. Contract: window.FILM, DUR, render(t), READY, EV, TEXTS(t),
   SCORE(ctx). Gary Penn (DMA Design, worked on the original GTA) to Tristan Donovan, Gamasutra 2011-01-31: the game was
   almost canned, it crashed all the time, the car handling was appalling; "One day, I think it was a bug, the police
   suddenly became mental and aggressive ... trying to ram me off the road ... That was awesome, so that stayed in."
   Race'n'Chase design document, March 1995 (posted by Mike Dailly). First release 1997 (Europe, PC). GTA VI Nov 19 2026.
   The set is a hand-cut paper city seen from above with one road scrolling down the frame (the native move); the hero is
   our own paper police car. Engine from film/gta-longestwait (paper pieces, VAD gate, fontStretch re-apply, rail scan).
   Our own flat props only: no footage, logos, key art, sprites or box art; no music. */
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
     THE SET: a hand-cut paper city seen from straight above (the 1997 game's camera, drawn our own way), one road
     running up the frame and scrolling down under it. It bleeds to the full frame (background only, no words).
     THE WORLD on it: our own paper cars (an orange getaway car, a cream-and-teal police car with a pink/teal light
     bar, no real livery), pencil skid marks and a paper beetle. THE PROPS over it (clipped to the rail): a blank
     game case with our own hand-lettered GTA, a CANCELED rubber stamp, a trash can, crash windows, calendar pages,
     torn newsprint strips with Gary Penn's exact words. No logos, key art, footage, sprites or box art.
     ===================================================================================================== */
  var TILEH = 1800, RX0 = 344, RX1 = 676, LANE_L = 425, LANE_R = 595;
  var ASPH = '#2e2348', ALLEY = '#1b1233', CURB = '#c9a46a', PADC = '#f4ead6', GOLD = '#ffc83d', INK2 = '#2a1850', PALM = '#16b48f';
  var CW = 128, CH = 228;

  function buildCity() {
    var c = mk(1080, TILEH), g = c.getContext('2d'), r = mulberry(19);
    g.fillStyle = ALLEY; g.fillRect(0, 0, 1080, TILEH);
    g.globalAlpha = .7; g.fillStyle = g.createPattern(GRAIN, 'repeat'); g.fillRect(0, 0, 1080, TILEH); g.globalAlpha = 1;
    var CS = [420, 1320], CSH = 150;
    /* every shape is drawn three times (y, y - TILEH, y + TILEH) so the tile repeats without a seam */
    function wrap(fn) { [-TILEH, 0, TILEH].forEach(function (dy) { g.save(); g.translate(0, dy); fn(); g.restore(); }); }
    function slab(x0, y0, x1, y1, col, o) {
      var pc = piece([x0, y0, x1, y1], rect(x0, y0, x1, y1), col, o || { shadow: false, edge: false, grain: .8 });
      wrap(function () { g.drawImage(pc.c, pc.x0, pc.y0, pc.w, pc.h); });
    }
    /* cross streets */
    CS.forEach(function (y) { slab(-20, y, 1100, y + CSH, ASPH); });
    /* sidewalks and the main road */
    slab(RX0 - 48, -10, RX0, TILEH + 10, CURB);
    slab(RX1, -10, RX1 + 48, TILEH + 10, CURB);
    CS.forEach(function (y) { slab(-20, y - 26, RX0 - 48, y, CURB); slab(-20, y + CSH, RX0 - 48, y + CSH + 26, CURB); slab(RX1 + 48, y - 26, 1100, y, CURB); slab(RX1 + 48, y + CSH, 1100, y + CSH + 26, CURB); });
    slab(RX0, -10, RX1, TILEH + 10, ASPH);
    wrap(function () {
      /* sidewalk seams */
      g.fillStyle = 'rgba(90,60,25,.35)'; for (var y = 0; y < TILEH; y += 56) { g.fillRect(RX0 - 48, y, 48, 3); g.fillRect(RX1, y, 48, 3); }
      /* lane paint: a cream centre dash and thin edge lines */
      g.fillStyle = 'rgba(251,240,234,.8)'; for (y = 0; y < TILEH; y += 120) g.fillRect(505, y, 10, 66);
      g.fillStyle = 'rgba(251,240,234,.35)'; g.fillRect(RX0 + 12, 0, 5, TILEH); g.fillRect(RX1 - 17, 0, 5, TILEH);
      /* crosswalks at the junctions */
      CS.forEach(function (cy) { g.fillStyle = 'rgba(251,240,234,.82)'; for (var x = RX0 + 14; x < RX1 - 20; x += 40) { g.fillRect(x, cy - 52, 24, 44); g.fillRect(x, cy + CSH + 8, 24, 44); } });
      /* manhole covers and oil stains */
      [[460, 260], [590, 980], [440, 1560]].forEach(function (p) { g.fillStyle = 'rgba(10,6,20,.45)'; g.beginPath(); g.arc(p[0], p[1], 19, 0, TAU); g.fill(); g.strokeStyle = 'rgba(251,240,234,.18)'; g.lineWidth = 3; g.stroke(); });
    });
    /* buildings: flat roofs in the palette, an inset parapet, AC boxes, pools, skylights */
    var ROOFS = [HOT, TEAL, ORG, PADC, '#8e5bd0', '#e8467f', '#12a99d', '#f7b26a', '#ffd9e8'];
    var blocks = [[CS[0] + CSH + 26, CS[1] - 26], [CS[1] + CSH + 26, CS[0] + TILEH - 26]];
    var ci = 0;
    blocks.forEach(function (bk) {
      [[-30, RX0 - 64], [RX1 + 64, 1110]].forEach(function (col) {
        var y = bk[0] + 8, n = 2 + Math.floor(r() * 2), H = bk[1] - bk[0] - 16;
        for (var i = 0; i < n; i++) {
          var h = i === n - 1 ? bk[1] - 8 - y : Math.round(H / n * (.75 + r() * .5)), x0 = col[0] + (r() * 20), x1 = col[1] - (r() * 20);
          var cr = ROOFS[(ci++ * 4 + Math.floor(r() * 3)) % ROOFS.length], lite = cr === PADC || cr === '#ffd9e8' || cr === '#f7b26a';
          (function (x0, y, x1, h, cr, lite, seed) {
            var rr0 = mulberry(seed);
            var pc = piece([x0, y, x1, y + h], function (q) { rr(q, x0, y, x1 - x0, h, 6); }, cr, { ps: 1, sx: 8, sy: 12, blur: 10, extra: function (q) {
              q.strokeStyle = lite ? 'rgba(29,18,51,.22)' : 'rgba(255,255,255,.35)'; q.lineWidth = 6; rr(q, x0 + 12, y + 12, x1 - x0 - 24, h - 24, 4); q.stroke();
              var k = Math.floor(rr0() * 3);
              if (k === 0 && h > 220) { var pw = Math.min(150, (x1 - x0) * .45), ph = Math.min(120, h * .35), px = x0 + 30 + rr0() * (x1 - x0 - pw - 60), py = y + 30 + rr0() * (h - ph - 60); q.fillStyle = '#7fe8df'; rr(q, px, py, pw, ph, 16); q.fill(); q.strokeStyle = 'rgba(255,255,255,.75)'; q.lineWidth = 3; for (var w = 0; w < 3; w++) { q.beginPath(); for (var xx = px + 12; xx < px + pw - 12; xx += 6) q.lineTo(xx, py + 24 + w * 28 + Math.sin(xx * .15 + w) * 4); q.stroke(); } q.strokeStyle = PADC; q.lineWidth = 6; rr(q, px, py, pw, ph, 16); q.stroke(); }
              var na = 1 + Math.floor(rr0() * 3);
              for (var a = 0; a < na; a++) { var ax = x0 + 30 + rr0() * (x1 - x0 - 90), ay = y + 30 + rr0() * (h - 90); q.fillStyle = 'rgba(29,18,51,.25)'; q.fillRect(ax + 5, ay + 7, 52, 52); q.fillStyle = '#e9e1d4'; q.fillRect(ax, ay, 52, 52); q.strokeStyle = 'rgba(29,18,51,.45)'; q.lineWidth = 2.5; q.beginPath(); q.arc(ax + 26, ay + 26, 17, 0, TAU); q.stroke(); q.beginPath(); q.moveTo(ax + 12, ay + 26); q.lineTo(ax + 40, ay + 26); q.moveTo(ax + 26, ay + 12); q.lineTo(ax + 26, ay + 40); q.stroke(); }
              if (k === 1) { q.fillStyle = 'rgba(255,255,255,.28)'; for (var s2 = 0; s2 < 4; s2++) q.fillRect(x0 + 26 + s2 * 34, y + h - 70, 22, 44); }
            } });
            wrap(function () { g.drawImage(pc.c, pc.x0, pc.y0, pc.w, pc.h); });
          })(x0, y, x1, h, cr, lite, 300 + ci);
          y += h + 14;
          if (y > bk[1] - 60) break;
        }
      });
    });
    /* palms on the corners and along the sidewalks (seen from above: a star of fronds) */
    var palms = [[RX0 - 70, 70], [RX1 + 70, 250], [RX0 - 66, 760], [RX1 + 72, 980], [RX0 - 72, 1160], [RX1 + 66, 1640], [150, 380], [930, 1290]];
    palms.forEach(function (p, i) {
      var pr = 40 + (i % 3) * 8, pc = piece([-pr - 6, -pr - 6, pr + 6, pr + 6], function (q) { q.beginPath(); for (var k = 0; k < 7; k++) { var a = k * TAU / 7 + i, a2 = a + TAU / 14; q.lineTo(Math.cos(a) * pr, Math.sin(a) * pr); q.lineTo(Math.cos(a2) * pr * .38, Math.sin(a2) * pr * .38); } q.closePath(); }, PALM, { ps: 1, sx: 10, sy: 14, blur: 6, edge: 1.5, extra: function (q) { q.strokeStyle = 'rgba(10,60,40,.5)'; q.lineWidth = 2; for (var k = 0; k < 7; k++) { var a = k * TAU / 7 + i; q.beginPath(); q.moveTo(0, 0); q.lineTo(Math.cos(a) * pr * .9, Math.sin(a) * pr * .9); q.stroke(); } q.fillStyle = '#7a4a22'; q.beginPath(); q.arc(0, 0, 7, 0, TAU); q.fill(); } });
      wrap(function () { g.drawImage(pc.c, p[0] + pc.x0, p[1] + pc.y0, pc.w, pc.h); });
    });
    return c;
  }

  /* ---------- the cars (top-down, nose up) ---------- */
  function carPiece(kind) {
    var cop = kind === 'cop';
    return piece([-CW / 2, -CH / 2, CW / 2, CH / 2], function (g) { rr(g, -CW / 2, -CH / 2, CW, CH, 34); }, cop ? '#f6efe2' : ORG, { ps: 2.2, sx: 7, sy: 12, blur: 12, extra: function (g) {
      if (cop) { g.fillStyle = TEAL; g.fillRect(-CW / 2, -CH / 2, CW, 60); g.fillRect(-CW / 2, CH / 2 - 50, CW, 50); g.fillStyle = '#0f8f86'; g.fillRect(-CW / 2, -6, CW, 12); }
      else { g.fillStyle = CREAM; g.fillRect(-15, -CH / 2, 10, CH); g.fillRect(5, -CH / 2, 10, CH); g.fillStyle = 'rgba(120,40,0,.18)'; g.fillRect(-CW / 2, -CH / 2, 10, CH); }
      g.fillStyle = '#21183a';
      g.beginPath(); g.moveTo(-CW / 2 + 12, -CH / 2 + 62); g.lineTo(CW / 2 - 12, -CH / 2 + 62); g.lineTo(CW / 2 - 22, -CH / 2 + 100); g.lineTo(-CW / 2 + 22, -CH / 2 + 100); g.closePath(); g.fill();
      g.beginPath(); g.moveTo(-CW / 2 + 22, CH / 2 - 80); g.lineTo(CW / 2 - 22, CH / 2 - 80); g.lineTo(CW / 2 - 13, CH / 2 - 54); g.lineTo(-CW / 2 + 13, CH / 2 - 54); g.closePath(); g.fill();
      g.fillStyle = 'rgba(255,255,255,.22)'; g.beginPath(); g.moveTo(-CW / 2 + 20, -CH / 2 + 66); g.lineTo(-CW / 2 + 44, -CH / 2 + 66); g.lineTo(-CW / 2 + 34, -CH / 2 + 96); g.lineTo(-CW / 2 + 26, -CH / 2 + 96); g.closePath(); g.fill();
      g.fillStyle = cop ? '#fffaf0' : '#ff9f5e'; rr(g, -CW / 2 + 20, -CH / 2 + 102, CW - 40, CH - 184, 10); g.fill();
      g.fillStyle = '#fff6d8'; [-1, 1].forEach(function (sx) { rr(g, sx * (CW / 2 - 25) - 11, -CH / 2 + 4, 22, 11, 4); g.fill(); });
      g.fillStyle = HOT; [-1, 1].forEach(function (sx) { rr(g, sx * (CW / 2 - 24) - 10, CH / 2 - 11, 20, 8, 3); g.fill(); });
      g.fillStyle = 'rgba(29,18,51,.35)'; [-1, 1].forEach(function (sx) { g.fillRect(sx * (CW / 2 - 1) - 4, -CH / 2 + 104, 8, 18); });
    } });
  }
  /* the light bar: pink and teal halves that trade places; flat beams (paper wedges), never a flare */
  function lightbar(g, t, on) {
    var ph = on ? Math.floor(t * 8) % 2 : -1, y = -CH / 2 + 112;
    if (on) {
      g.save(); g.globalAlpha = .32; g.fillStyle = ph ? HOT : TEAL;
      g.beginPath(); g.moveTo(ph ? -20 : 20, y + 8); g.lineTo(ph ? -260 : 260, y - 190); g.lineTo(ph ? -240 : 240, y + 230); g.closePath(); g.fill(); g.restore();
    }
    g.save(); g.translate(0, y + 11); g.scale(1.7, 1.7); g.translate(0, -y - 11);
    g.fillStyle = '#21183a'; rr(g, -48, y, 96, 22, 6); g.fill();
    g.fillStyle = ph === 1 ? '#ffd0e6' : HOT; rr(g, -45, y + 3, 42, 16, 4); g.fill();
    g.fillStyle = ph === 0 ? '#c8fff9' : TEAL; rr(g, 3, y + 3, 42, 16, 4); g.fill();
    g.restore();
  }
  function car(g, kind, q, t) {
    if (!q || q.a <= 0) return;
    g.save(); g.globalAlpha *= q.a == null ? 1 : q.a; g.translate(q.x, q.y); g.rotate(q.r || 0); var s = (q.s || 1) * 1.25; g.scale(s, s);
    g.fillStyle = '#140b24'; [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (p) { rr(g, p[0] * (CW / 2 + 1) - 11, p[1] * (CH / 2 - 54) - 23, 22, 46, 7); g.fill(); });
    put(g, kind === 'player' ? P.player : P.cop, 0, 0);
    if (kind !== 'player') lightbar(g, t, q.lit);
    g.restore();
  }
  /* ---------- the beetle: a paper shell, legs and feelers drawn live so it walks ---------- */
  function beetle(g, b) {
    if (!b || b.a <= 0) return;
    g.save(); g.globalAlpha *= b.a; g.translate(b.x, b.y); g.rotate(b.r || 0); g.scale(b.s, b.s);
    var ph = b.ph || 0;
    g.strokeStyle = INK; g.lineCap = 'round'; g.lineJoin = 'round';
    for (var i = 0; i < 3; i++) for (var sd = -1; sd <= 1; sd += 2) {
      var a = Math.sin(ph * TAU + i * 2.1 + (sd > 0 ? Math.PI : 0)), y0 = -14 + i * 22, x1 = sd * 54, y1 = y0 + (i - 1) * 18 + a * 12;
      g.lineWidth = 8; g.beginPath(); g.moveTo(sd * 22, y0); g.lineTo(x1, y1); g.lineTo(x1 + sd * 14, y1 + 18 + a * 6); g.stroke();
    }
    g.lineWidth = 5; [-1, 1].forEach(function (sd) { g.beginPath(); g.moveTo(sd * 8, -56); g.quadraticCurveTo(sd * 22, -88, sd * 36 + Math.sin(ph * TAU * 1.3 + sd) * 5, -100); g.stroke(); });
    put(g, P.bug, 0, 0);
    g.restore();
  }
  function bugPiece() {
    return piece([-42, -72, 42, 62], function (g) { g.beginPath(); g.arc(0, -50, 21, 0, TAU); g.moveTo(40, 6); g.ellipse(0, 6, 40, 54, 0, 0, TAU); }, HOT, { ps: 2.4, sx: 4, sy: 7, blur: 6, extra: function (g) {
      g.fillStyle = INK; g.beginPath(); g.arc(0, -50, 21, 0, TAU); g.fill();
      g.fillStyle = '#21183a'; g.beginPath(); g.ellipse(0, -36, 30, 11, 0, 0, TAU); g.fill();
      g.strokeStyle = INK; g.lineWidth = 4; g.beginPath(); g.moveTo(0, -26); g.lineTo(0, 60); g.stroke();
      g.fillStyle = PADC; [[-18, -6, 7], [17, 2, 8], [-15, 30, 6], [19, 34, 6]].forEach(function (d) { g.beginPath(); g.arc(d[0], d[1], d[2], 0, TAU); g.fill(); });
      g.fillStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.ellipse(-16, -14, 8, 16, -.4, 0, TAU); g.fill();
      g.fillStyle = PADC; [-1, 1].forEach(function (sd) { g.beginPath(); g.arc(sd * 9, -56, 4, 0, TAU); g.fill(); });
    } });
  }

  /* ---------- props ---------- */
  var CASEW = 520, CASEH = 700;
  function casePiece() {
    var w = CASEW, h = CASEH, rec = [];
    var pc = piece([-w / 2, -h / 2, w / 2, h / 2], function (g) { rr(g, -w / 2, -h / 2, w, h, 16); }, PADC, { ps: 1.4, sx: 10, sy: 18, blur: 22, extra: function (g) {
      g.fillStyle = TEAL; g.fillRect(-w / 2, -h / 2, 46, h);
      g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(-w / 2 + 46, -h / 2, 5, h);
      g.fillStyle = HOT; g.fillRect(-w / 2 + 51, -h / 2 + 44, w - 51, 26); g.fillStyle = ORG; g.fillRect(-w / 2 + 51, -h / 2 + 76, w - 51, 12);
      g.fillStyle = 'rgba(29,18,51,.05)'; for (var y = -h / 2; y < h / 2; y += 12) g.fillRect(-w / 2 + 51, y, w, 1.5);
      var tw = inkText(g, 'GTA', 24, -70, 236, INK, 211, { dense: 70, big: 1.2, ls: 4 });
      rec.push([24 - tw / 2, -70 - 236 * .5, 24 + tw / 2, -70 + 236 * .42, 'GTA']);
      /* a little top-down car doodle in pencil, our own */
      g.save(); g.translate(24, 160); g.rotate(-.5); g.strokeStyle = 'rgba(29,18,51,.75)'; g.lineWidth = 5; g.lineJoin = 'round';
      rr(g, -34, -62, 68, 124, 18); g.stroke(); g.beginPath(); g.moveTo(-26, -30); g.lineTo(26, -30); g.moveTo(-26, 34); g.lineTo(26, 34); g.stroke();
      g.strokeStyle = HOT; g.lineWidth = 5; for (var k = 0; k < 3; k++) { g.beginPath(); g.moveTo(-60 - k * 18, 30 + k * 26); g.lineTo(-100 - k * 22, 46 + k * 30); g.stroke(); }
      g.restore();
      g.fillStyle = 'rgba(255,255,255,.18)'; g.beginPath(); g.moveTo(w / 2 - 140, -h / 2); g.lineTo(w / 2 - 60, -h / 2); g.lineTo(w / 2 - 260, h / 2); g.lineTo(w / 2 - 340, h / 2); g.closePath(); g.fill();
    } });
    return wordsOf(pc, rec);
  }
  function binParts() {
    var body = piece([-150, -170, 150, 190], function (g) { g.beginPath(); g.moveTo(-150, -170); g.lineTo(150, -170); g.lineTo(122, 190); g.lineTo(-122, 190); g.closePath(); }, '#5d6f8f', { sx: 8, sy: 14, blur: 16, extra: function (g) {
      g.fillStyle = 'rgba(255,255,255,.14)'; for (var x = -110; x <= 110; x += 44) { g.beginPath(); g.moveTo(x - 8, -150); g.lineTo(x + 8, -150); g.lineTo(x * .84 + 7, 172); g.lineTo(x * .84 - 7, 172); g.closePath(); g.fill(); }
      g.fillStyle = 'rgba(10,6,20,.3)'; g.fillRect(-150, -170, 300, 22);
      g.fillStyle = TEAL; g.fillRect(-150, 120, 300, 26);
    } });
    var lid = piece([-170, -34, 170, 10], function (g) { rr(g, -170, -24, 340, 34, 10); rr(g, -40, -34, 80, 16, 6); }, TEAL, { sx: 5, sy: 8, blur: 10, extra: function (g) { g.fillStyle = 'rgba(255,255,255,.3)'; g.fillRect(-170, -24, 340, 8); } });
    return { body: body, lid: lid };
  }
  function calPiece(bind, lines, seed) {
    var w = 330, h = 410, tp = jag(seed, w, 4);
    return cardPiece(w, h, PADC, lines, { r: 6, sy: 14, path: function (g) { g.beginPath(); g.moveTo(-w / 2, -h / 2 + 8 + tp[0][1]); tp.forEach(function (q) { g.lineTo(-w / 2 + q[0], -h / 2 + 8 + q[1]); }); g.lineTo(w / 2, h / 2); g.lineTo(-w / 2, h / 2); g.closePath(); }, before: function (g) {
      g.fillStyle = bind; g.fillRect(-w / 2, -h / 2, w, 34);
      [-90, 0, 90].forEach(function (x) { g.fillStyle = INK2; g.beginPath(); g.arc(x, -h / 2 + 17, 7, 0, TAU); g.fill(); });
      for (var i = 0; i < 7; i++) { g.fillStyle = 'rgba(29,18,51,.07)'; g.fillRect(-w / 2 + 24 + i * 42, h / 2 - 40, 32, 18); }
    } });
  }
  /* a 1990s DOS error box, cut from paper: square corners, a double cream border, mono type */
  function windowPiece(seed) {
    var w = 560, h = 300, rec = [];
    var pc = piece([-w / 2, -h / 2, w / 2, h / 2], function (g) { g.beginPath(); g.rect(-w / 2, -h / 2, w, h); }, '#241a7a', { sx: 8, sy: 12, blur: 12, extra: function (g) {
      g.strokeStyle = PADC; g.lineWidth = 5; g.strokeRect(-w / 2 + 16, -h / 2 + 16, w - 32, h - 32); g.lineWidth = 3; g.strokeRect(-w / 2 + 28, -h / 2 + 28, w - 56, h - 56);
      g.fillStyle = PADC; g.fillRect(-w / 2 + 28, -h / 2 + 28, w - 56, 34);
      g.font = '800 132px "Geist Mono"'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = PADC; g.fillText('CRASH', 0, 34);
      var mm = g.measureText('CRASH'); rec.push([-mm.width / 2, 34 - 60, mm.width / 2, 34 + 52, 'CRASH']);
      g.fillStyle = HOT; g.fillRect(mm.width / 2 + 10, 0, 34, 70);
    } });
    return wordsOf(pc, rec);
  }
  function starPiece() {
    return piece([-150, -150, 150, 150], function (g) { g.beginPath(); for (var k = 0; k < 12; k++) { var a = k * TAU / 12, R = k % 2 ? 62 : 148 - (k % 4) * 14; g.lineTo(Math.cos(a) * R, Math.sin(a) * R); } g.closePath(); }, ORG, { sx: 6, sy: 10, blur: 12, extra: function (g) { g.fillStyle = GOLD; g.beginPath(); for (var k = 0; k < 12; k++) { var a = k * TAU / 12 + .1, R = k % 2 ? 30 : 84; g.lineTo(Math.cos(a) * R, Math.sin(a) * R); } g.closePath(); g.fill(); } });
  }

  function buildTextures() {
    GRAIN = buildGrain();
    P.city = buildCity();
    P.player = carPiece('player'); P.cop = carPiece('cop'); P.bug = bugPiece();
    P.gcase = casePiece();
    P.stamp = buildStamp(['CANCELED'], 118, 470, HOT);
    var bn = binParts(); P.bin = bn.body; P.lid = bn.lid;
    P.cal95 = calPiece(HOT, [['1995', 120, INK, 10]], 401);
    P.cal97 = calPiece(TEAL, [['1997', 120, INK, -16], ['PC · EUROPE', 50, INK2, 96]], 402);
    P.cal26 = calPiece(HOT, [['NOV', 62, HOT, -112], ['19', 190, INK, 0], ['2026', 72, INK, 122]], 403);
    P.sign = cardPiece(700, 168, CREAM, [["RACE'N'CHASE", 110, HOT, 6]], { r: 12, ring: TEAL, before: function (g) { g.fillStyle = 'rgba(25,211,197,.12)'; g.fillRect(-350, -84, 700, 168); } });
    P.win = [windowPiece(61), windowPiece(62), windowPiece(63)];
    P.oneday = cardPiece(430, 150, ORG, [['ONE DAY', 104, INK, 6]], { r: 10, ring: 'rgba(29,18,51,.3)' });
    P.keep = cardPiece(240, 240, GOLD, [['KEEP', 104, INK, 14]], { r: 3, sy: 12, after: function (g) { g.fillStyle = 'rgba(0,0,0,.08)'; g.beginPath(); g.moveTo(120, 80); g.lineTo(120, 120); g.lineTo(80, 120); g.closePath(); g.fill(); } });
    P.pill6 = cardPiece(270, 96, HOT, [['GTA 6', 72, CREAM, 3]], { r: 48, ring: 'rgba(255,240,234,.9)' });
    P.star = starPiece();
    P.sq1 = buildStrip('“CAN IT”', 420, 80, 501);
    P.sq2 = buildStrip('“…APPALLING”', 520, 72, 502);
    P.sq3 = buildStrip('“I THINK IT WAS A BUG”', 600, 56, 503);
    P.sq4 = buildStrip('“THAT WAS AWESOME …”', 760, 56, 504);
    var tp2 = jag(301, 1100, 10), bt2 = jag(302, 1100, 10);
    P.sweep = piece([0, -20, 1100, 1580], function (g) { g.beginPath(); g.moveTo(0, tp2[0][1]); tp2.forEach(function (p) { g.lineTo(p[0], p[1]); }); for (var i = bt2.length - 1; i >= 0; i--) g.lineTo(bt2[i][0], 1560 + bt2[i][1]); g.closePath(); }, PADC, { sx: 0, sy: 10, blur: 20, ps: .6, extra: function (g) {
      g.fillStyle = TEAL; g.fillRect(0, -20, 1100, 110);
      g.strokeStyle = 'rgba(29,18,51,.12)'; g.lineWidth = 4; for (var y = 200; y < 1500; y += 70) { g.beginPath(); g.moveTo(40, y); g.lineTo(1060, y); g.stroke(); }
    } });
  }

  /* =====================================================================================================
     TIME AND STATE
     ===================================================================================================== */
  var T = {}, LIVE2 = { bg: true, clip: true };
  function sm(t, a, d) { return eio(seg(t, a, a + (d || .5))); }
  function tq(t) { return (Math.floor(t * 30) + .5) / 30; }
  /* keyframes: [[t, x, y, r, s], ...] eased in-out between keys */
  function kf(t, K) {
    if (t <= K[0][0]) return { x: K[0][1], y: K[0][2], r: K[0][3] || 0, s: K[0][4] == null ? 1 : K[0][4] };
    for (var i = 0; i < K.length - 1; i++) {
      var a = K[i], b = K[i + 1];
      if (t < b[0]) { var k = (b[5] || eio)(seg(t, a[0], b[0])); return { x: lerp(a[1], b[1], k), y: lerp(a[2], b[2], k), r: lerp(a[3] || 0, b[3] || 0, k), s: lerp(a[4] == null ? 1 : a[4], b[4] == null ? 1 : b[4], k) }; }
    }
    var L = K[K.length - 1]; return { x: L[1], y: L[2], r: L[3] || 0, s: L[4] == null ? 1 : L[4] };
  }
  /* road scroll: integrated from a speed curve, then scaled so it travels a whole number of tiles over the film */
  var SCR = null, SCR_DT = 1 / 240;
  function speedAt(t) {
    var K = T.SPEED; if (t <= K[0][0]) return K[0][1];
    for (var i = 0; i < K.length - 1; i++) if (t < K[i + 1][0]) return lerp(K[i][1], K[i + 1][1], eio(seg(t, K[i][0], K[i + 1][0])));
    return K[K.length - 1][1];
  }
  function buildScroll() {
    var n = Math.ceil(DUR / SCR_DT) + 2, a = new Float64Array(n), s = 0;
    for (var i = 0; i < n; i++) { a[i] = s; s += speedAt(i * SCR_DT) * SCR_DT; }
    var tot = a[Math.round(DUR / SCR_DT)], f = Math.max(1, Math.round(tot / TILEH)) * TILEH / tot;
    for (i = 0; i < n; i++) a[i] *= f;
    SCR = a;
  }
  function scrollAt(t) {
    /* crash: the road plays in stop-motion (holds of 0.2 s) */
    if (t >= T.cr0 && t < T.cr1) t = T.cr0 + Math.floor((t - T.cr0) / .2) * .2;
    var x = clamp(t, 0, DUR) / SCR_DT, i = Math.floor(x), f = x - i;
    return lerp(SCR[i], SCR[Math.min(SCR.length - 1, i + 1)], f);
  }
  function camAt(t) {
    var br = 1 + .008 * osc(t, 11, .7);
    var q = kf(t, [[T.rp0, 510, 900, 0, 1], [T.rp0 + 1.15, 640, 940, 0, 1.55], [T.push0, 640, 940, 0, 1.55], [T.push0 + .9, 560, 1010, 0, 1.38], [T.pull0, 560, 1010, 0, 1.38], [T.pull0 + .85, 510, 900, 0, 1]]);
    return { s: q.s * br, fx: q.x, fy: q.y };
  }
  function applyCam(g, c) { g.translate(510, 900); g.scale(c.s, c.s); g.translate(-c.fx, -c.fy); }
  function stut(t) { return (t >= T.cr0 && t < T.cr1) ? T.cr0 + Math.floor((t - T.cr0) / .2) * .2 : t; }

  /* the cars' paths, beat by beat */
  function playerAt(t) {
    if (t < T.dive - .05 || t > T.rel + .02) return null;
    var tt = stut(t);
    var q = kf(tt, [[T.dive, LANE_R, 2150, 0], [T.dive + .75, LANE_R, 1000, 0, 1, eo], [T.sp0, LANE_R, 1000, 0], [T.sp0 + 1.3, 470, 950, TAU + .62, 1, eo], [T.cz0, 470, 950, TAU + .62], [T.cz0 + .7, LANE_R, 960, TAU], [T.ram - .02, LANE_R + 6, 960, TAU], [T.ram + .45, 905, 880, TAU + 1.0, 1, eo], [T.rel, 905, 880, TAU + 1.0]]);
    var sway = (tt < T.sp0 || (tt > T.cz0 + .7 && tt < T.ram)) ? 7 * Math.sin(tt * 2.3) : 0;
    q.x += sway; q.r += sway * .004;
    if (t >= T.nudge && t < T.nudge + .3) q.x += 22 * bump(t, T.nudge, .3);
    q.a = 1; return q;
  }
  function copAt(t) {
    if (t < T.dive - .05 || t > T.rel + .02) return null;
    var tt = stut(t);
    var q = kf(tt, [[T.dive + .15, LANE_R, 2300, 0], [T.dive + 1.05, LANE_R, 1300, 0, 1, eo], [T.cz1, LANE_R, 1300, 0], [T.cz1 + .9, 445, 1110, -.12], [T.cz1 + 1.3, 445, 1060, 0], [T.ram - .25, 440, 990, -.06], [T.ram - .02, 470, 975, .12], [T.ram + .14, 572, 965, .38, 1, eo], [T.ram + .6, 560, 990, .26], [T.rel, 560, 990, .26]]);
    if (tt > T.cz1 && tt < T.ram - .25) { var w = Math.sin((tt - T.cz1) * 9) * 26 * sm(tt, T.cz1, .3); q.x += w; q.r += w * .006; }
    else if (tt < T.cz1) { q.x += 6 * Math.sin(tt * 2.1 + 1); }
    if (t >= T.nudge - .1 && t < T.nudge + .25) q.x += 34 * bump(t, T.nudge - .1, .35);
    q.lit = t >= T.lit; q.a = 1; return q;
  }
  function cop2At(t) {
    if (t < T.ram + .15 || t > T.rel + .02) return null;
    var q = kf(t, [[T.ram + .15, LANE_L, 2200, 0], [T.ram + 1.0, LANE_L, 1330, -.05, 1, eo], [T.rel, LANE_L, 1310, -.05]]);
    q.x += 5 * Math.sin(t * 2.7); q.lit = true; q.a = 1; return q;
  }
  var PARK = [640, 1385, -.3];
  function copEndAt(t) {
    if (t < T.tip0) { var h = kf(t, [[0, PARK[0], PARK[1], PARK[2]], [T.tip0, PARK[0], PARK[1], PARK[2]]]); h.lit = true; h.a = 1; return h; }
    if (t < T.kick + .9) { var d = kf(t, [[T.tip0, PARK[0], PARK[1], PARK[2]], [T.tip0 + .4, LANE_R, 1250, 0], [T.kick + .9, LANE_R, -320, 0, 1, function (k) { return k * k; }]]); d.lit = true; d.a = 1; return d; }
    if (t < T.rel + .3) return null;
    var q = kf(t, [[T.rel + .3, LANE_L, 2200, 0], [T.rel + 1.4, LANE_L, 1340, 0, 1, eo], [T.calOut, LANE_L, 1340, 0], [DUR, PARK[0], PARK[1], PARK[2]]]);
    q.lit = t > T.flip; q.a = 1; return q;
  }
  /* the beetle: out from under the cop car's hood (in the car's own frame), later across the case */
  function bugAt(t, cp) {
    if (t >= T.bg0 && t < T.rel + .02 && cp) {
      var u = seg(t, T.bg0, T.bg0 + 1.0), u2 = seg(t, T.keep - .9, T.keep - .1);
      var lx = lerp(0, -10, u) + lerp(0, -18, u2), ly = lerp(-CH / 2 + 30, -CH / 2 - 52, eo(u)) + lerp(0, 22, eio(u2));
      var c = Math.cos(cp.r), s = Math.sin(cp.r);
      var moving = (u > 0 && u < 1) || (u2 > 0 && u2 < 1);
      return { x: cp.x + lx * c - ly * s, y: cp.y + lx * s + ly * c, r: cp.r - .1 * u2, s: .95 * eo(seg(t, T.bg0, T.bg0 + .25)), a: 1, ph: moving ? t * 3.2 : T.bg0 * 3.2, under: u < .45 };
    }
    if (t >= T.bE0 && t < DUR) {
      var q = kf(t, [[T.bE0, 1180, 1040, -1.9, 1.1], [T.bE1, 420, 800, -1.05, 1.1], [T.bE1 + .35, 420, 800, -1.05, 1.1], [DUR - .12, -200, 860, -1.9, 1.1]]);
      var mv = !(t >= T.bE1 && t < T.bE1 + .35);
      q.a = 1; q.ph = mv ? t * 4 : T.bE1 * 4; return q;
    }
    return null;
  }

  /* ---------- the world layer (camera moves it; not clipped: it is the background) ---------- */
  function world(g, t) {
    var cam = camAt(t);
    g.save(); applyCam(g, cam);
    var off = scrollAt(t), base = ((off % TILEH) + TILEH) % TILEH;
    var ylo = cam.fy + (0 - 900) / cam.s - 20, yhi = cam.fy + (1920 - 900) / cam.s + 20;
    var xlo = cam.fx + (0 - 510) / cam.s, xhi = cam.fx + (1080 - 510) / cam.s;
    for (var k = -2; k <= 2; k++) { var y0 = base + k * TILEH; if (y0 > yhi || y0 + TILEH < ylo) continue; g.drawImage(P.city, Math.max(0, xlo) | 0, 0, Math.min(1080, xhi - xlo + 2) | 0, TILEH, Math.max(0, xlo) | 0, y0, Math.min(1080, xhi - xlo + 2) | 0, TILEH); }
    g.fillStyle = 'rgba(11,8,32,.42)'; g.fillRect(xlo - 10, ylo, xhi - xlo + 20, yhi - ylo);
    /* pencil skid marks from the spin-out, scrolled with the road */
    if (t > T.sp0 && t < T.rel) {
      var a = 1 - seg(t, T.cz0 + 1.6, T.cz0 + 2.4);
      if (a > 0) {
        g.save(); g.globalAlpha = .7 * a; g.strokeStyle = '#140b24'; g.lineCap = 'round'; g.lineWidth = 9;
        var end = Math.min(t, T.sp0 + 1.3), offNow = scrollAt(t);
        [-1, 1].forEach(function (sd) {
          g.beginPath(); var first = true;
          for (var u = T.sp0; u <= end; u += 1 / 60) {
            var q = playerAt(u); if (!q) continue;
            var dyo = offNow - scrollAt(u), c = Math.cos(q.r), s = Math.sin(q.r), lx = sd * 50, ly = 60;
            var X = q.x + lx * c - ly * s, Y = q.y + lx * s + ly * c + dyo;
            if (first) { g.moveTo(X, Y); first = false; } else g.lineTo(X, Y);
          }
          g.stroke();
        });
        g.restore();
      }
    }
    var pl = playerAt(t), cp = copAt(t), c2 = cop2At(t), ce = copEndAt(t), bg = bugAt(t, cp);
    if (t >= T.ram - .02 && t < T.ram + .7 && cp) {
      var ik = eo(seg(t, T.ram - .02, T.ram + .12)), io = 1 - seg(t, T.ram + .45, T.ram + .7);
      g.save(); g.globalAlpha *= io; put(g, P.star, 700, 930, .3 * ik, .4 + .85 * ik); g.restore();
      var fr = mulberry(77), fu2 = seg(t, T.ram, T.ram + .65);
      for (var fi = 0; fi < 7; fi++) { var fa = fr() * TAU, fd = 120 + fr() * 160, fx = 700 + Math.cos(fa) * fd * eo(fu2), fy = 930 + Math.sin(fa) * fd * eo(fu2) + 60 * fu2 * fu2;
        g.save(); g.globalAlpha *= 1 - fu2; g.translate(fx, fy); g.rotate(fa + fu2 * 6); g.fillStyle = [HOT, CREAM, ORG, TEAL][fi % 4]; g.fillRect(-14, -9, 28, 18); g.restore(); }
    }
    car(g, 'cop', c2, t); car(g, 'cop', ce, t);
    car(g, 'player', pl, t);
    if (bg && bg.under && t < T.rel) beetle(g, bg);
    car(g, 'cop', cp, t);
    if (bg && !bg.under && t < T.rel) beetle(g, bg);
    /* the KEEP note on the hood */
    if (t >= T.keep && t < T.rel + .02 && cp) {
      var kk = t < T.keepS ? 0 : cd(t, T.keepS, 18), c0 = Math.cos(cp.r), s0 = Math.sin(cp.r), lx = 52, ly = -CH / 2 + 34;
      var hov = (1 - kk) * eo(seg(t, T.keep, T.keep + .25));
      g.save(); g.translate(cp.x + lx * c0 - ly * s0 + 18 * Math.sin(t * 5) * (1 - kk), cp.y + lx * s0 + ly * c0 - 120 * (1 - kk) + 8 * Math.sin(t * 7) * (1 - kk)); g.rotate(cp.r + .22 - .3 * (1 - kk) + .12 * Math.sin(t * 6) * (1 - kk)); var ks = .55 * (1.6 - .6 * kk) * (t < T.keepS ? .3 + .7 * hov : 1);
      var nr = NOREC; NOREC = nr || kk < .97; putW(g, P.keep, 0, 0, 0, ks); NOREC = nr; g.restore();
    }
    g.restore();
  }

  /* ---------- the prop layer (clipped to the rail) ---------- */
  function caseAt(t) {
    /* frame 0 pose, also the last frame's: centred, big, a slow periodic bob */
    var home = { x: 500, y: 905 + 10 * osc(t, 6, .3), r: -.035 + .012 * osc(t, 5, 1.1), s: 1.12 };
    if (t < T.dive + .5) {
      var q = kf(t, [[0, home.x, home.y, home.r, home.s], [T.tip0, home.x, home.y, home.r, home.s], [T.tip0 + .5, 395, 935, .2, .9], [T.kick, 395, 935, .2, .9], [T.kick + .45, 450, 905, -.05, 1.0, eo], [T.dive, 450, 905, -.05, 1.0], [T.dive + .5, 520, 1500, .7, .45, function (k) { return k * k; }]]);
      if (t < T.tip0) { q.y = home.y; q.r = home.r; }
      if (t > T.kick + .45) { q.r += .025 * Math.sin((t - T.kick) * 3.4); q.y += 8 * Math.sin((t - T.kick) * 2.6); }
      q.a = 1 - seg(t, T.dive + .3, T.dive + .5); return q;
    }
    if (t >= T.rel - .05) {
      var e = kf(t, [[T.rel - .05, 345, 905, -.04, .8], [T.home0, 345, 905, -.04, .8], [DUR, home.x, home.y, home.r, home.s, eio]]);
      e.y += 6 * Math.sin(t * 1.7) * (1 - seg(t, T.home0, DUR)); e.a = 1; return e;
    }
    return null;
  }
  function stampAt(t) {
    /* drops in from above at 0.3 s, hovers, slams on the case in the pause after "canceled"; rides the case; peels at release */
    if (t < T.rel - .05) {
      if (t < T.stampK) {
        var hv = T.stampK - .42;
        if (t < hv) { var k = eo(seg(t, 0, hv)); return { x: lerp(1240, 600, k), y: lerp(330, 610, k) + 10 * Math.sin(t * 4), r: lerp(.6, -.02, k) + .03 * Math.sin(t * 3.3), s: 1.08, land: false }; }
        var d = seg(t, hv, T.stampK); d = d * d; return { x: lerp(600, 520, d), y: lerp(610 + 10 * Math.sin(hv * 4), 920, d), r: lerp(-.02 + .03 * Math.sin(hv * 3.3), -.12, d), s: 1.08, land: false };
      }
      return { rel: true, x: 20, y: 150, r: -.16, s: .98, k: seg(t, T.stampK, T.stampK + .12) };
    }
    if (t < T.peel) return { rel: true, x: 20, y: 150, r: -.16, s: .98, k: 1 };
    var u = seg(t, T.peel, T.peel + .55);
    if (u >= 1) return null;
    return { rel: true, x: 20 + 520 * eio(u), y: 150 - 1000 * u * u, r: -.16 + 1.4 * u, s: .98 + .2 * u, k: 1, peel: u };
  }
  function strip(g, pc, x, y, rot, tin, tout, t, o) {
    o = o || {}; if (t < tin - .02 || t > tout + .4) return;
    var k = cd(t, tin, 15), ko = eio(seg(t, tout, tout + (o.dur || .38)));
    var dx = (o.dir || -1) * 1200 * ko, dy = -120 * ko, rr0 = rot + (o.dir || -1) * .5 * ko;
    var nr = NOREC; NOREC = nr || k < .97 || ko > 0;
    g.save(); g.globalAlpha *= fin(t, tin, .06); g.translate(x + dx + (1 - k) * (o.from || 0), y + dy + (1 - k) * 40); g.rotate(rr0);
    putW(g, pc, -pc.sw / 2, -pc.sh / 2, 0, 1);
    NOREC = nr; g.restore();
  }
  function credit(g, text, x, y, tin, tout, t, o) {
    o = o || {}; if (t < tin - .02 || t > tout + .3) return;
    var k = cd(t, tin, 15), nr = NOREC; NOREC = nr || k < .97 || t > tout;
    chip(g, text, x, y + (1 - k) * 30, { px: o.px || 38, bg: o.bg || INK2, fg: o.fg || CREAM, a: fin(t, tin, .08) * (1 - seg(t, tout, tout + .25)), rot: o.rot || 0, line: 'rgba(251,240,234,.5)' });
    NOREC = nr;
  }
  function props(g, t) {
    var cs = caseAt(t), st = stampAt(t);
    /* the trash can */
    if (t >= T.bin0 && t < T.kick + .6) {
      var bk = cd(t, T.bin0, 12), kick = seg(t, T.kick, T.kick + .45);
      var bx = lerp(1180, 765, bk) + 560 * kick * kick, by = 1015 + 20 * Math.sin(t * 2), brt = .1 * (1 - bk) + 1.1 * kick * kick;
      g.save(); g.translate(bx, by); g.rotate(brt); put(g, P.bin, 0, 0);
      var lo = seg(t, T.tip0 + .3, T.tip0 + .55) * (1 - seg(t, T.kick - .1, T.kick + .1));
      g.save(); g.translate(-150, -170); g.rotate(-1.1 * eo(lo)); g.translate(150, 0); put(g, P.lid, 0, -8); g.restore();
      g.restore();
    }
    if (t >= T.bin2 && t < T.oneday + .6) {
      var b2 = cd(t, T.bin2, 12), b2o = seg(t, T.oneday, T.oneday + .45);
      g.save(); g.translate(lerp(1180, 790, b2) + 600 * b2o * b2o, 930 + 14 * Math.sin(t * 3) - 300 * b2o); g.rotate(-.08 * (1 - b2) + .12 * Math.sin((t - T.bin2) * 7) * (1 - seg(t, T.bin2 + .3, T.bin2 + .9)) + 1.2 * b2o * b2o); g.scale(.85, .85); put(g, P.bin, 0, 0);
      var l2 = seg(t, T.binC - .05, T.binC + .2); g.save(); g.translate(-150, -170); g.rotate(-1.1 * eo(l2)); g.translate(150, 0); put(g, P.lid, 0, -8); g.restore();
      g.restore();
    }
    /* the case (and the stamp riding on it) */
    if (cs && cs.a > 0) {
      g.save(); g.globalAlpha *= cs.a; g.translate(cs.x, cs.y); g.rotate(cs.r); g.scale(cs.s, cs.s);
      var nr = NOREC; NOREC = nr || cs.a < .97 || (t > T.dive && t < T.rel); putW(g, P.gcase, 0, 0); NOREC = nr || (t > T.dive && t < T.rel);
      if (st && st.rel) {
        var sk = st.k, sc = st.s * lerp(1.5, 1, eo(sk)) * kn(t, T.stampK + .1, .05);
        g.save(); g.translate(st.x, st.y); g.rotate(st.r + .1 * (1 - sk)); g.scale(sc, sc); NOREC = nr || sk < 1 || st.peel > 0 || (t > T.dive && t < T.rel); putW(g, P.stamp, 0, 0); NOREC = nr; g.restore();
      }
      g.restore();
    }
    if (st && !st.rel) { g.save(); g.translate(st.x, st.y); g.rotate(st.r); g.scale(st.s, st.s); var nr2 = NOREC; NOREC = true; putW(g, P.stamp, 0, 0); NOREC = nr2; g.restore(); }
    T.stampVis = st;
    /* the question mark */
    if (t >= T.q && t < T.dive + .5) {
      var qo = seg(t, T.dive, T.dive + .4);
      var nq = NOREC; NOREC = nq || qo > 0; slam(g, '?', 770 + 300 * qo * qo + 10 * Math.sin(t * 4.3), 760 - 500 * qo * qo + 14 * Math.sin(t * 3.1), 300, t - T.q, { col: ORG, rot: .08 + .06 * Math.sin(t * 2.7), from: 1.6 }); NOREC = nq;
    }
    /* the Penn strip for the publisher */
    strip(g, P.sq1, 510, 1250, -.015, T.sq1, T.sq1o, t, { dur: .18 });
    credit(g, 'GARY PENN · DMA DESIGN', 560, 1373, T.sq1 + .15, T.sq1o, t, { rot: .02 });
    /* began: the 1995 page, the sign, the design-doc chip */
    if (t >= T.c95 && t < T.sOut + .5) {
      var ck = cd(t, T.c95, 13), co = seg(t, T.sOut, T.sOut + .35);
      var nr3 = NOREC; NOREC = nr3 || ck < .97 || co > 0;
      putW(g, P.cal95, 250 - 400 * co * co, 900 + (1 - ck) * -500, -.08 - .6 * co, .78);
      NOREC = nr3;
    }
    if (t >= T.sign && t < T.sOut + .5) {
      var sk2 = eo(seg(t, T.sign, T.sign + .16)), so = seg(t, T.sOut, T.sOut + .35), nr4 = NOREC; NOREC = nr4 || sk2 < 1 || so > 0;
      g.save(); g.translate(510 + 900 * so * so, 640 - 200 * so); g.rotate(-.025 + .1 * (1 - sk2) + .4 * so); var ss = lerp(1.4, 1, sk2) * kn(t, T.sign + .14, .04); g.scale(ss, ss); g.globalAlpha *= fin(t, T.sign, .06); putW(g, P.sign, 0, 0); g.restore(); NOREC = nr4;
    }
    credit(g, 'DMA DESIGN DOC · 1995', 510, 1395, T.doc, T.docO, t, { px: 40, bg: CREAM, fg: INK });
    credit(g, 'GARY PENN · DMA DESIGN', 510, 1395, T.WIN[0] + .1, T.woff, t, { rot: .01 });
    /* crash: three windows stack up */
    T.WIN.forEach(function (tw, i) {
      if (t < tw || t > T.woff + .6) return;
      var k = eo(seg(t, tw, tw + .12)), o2 = seg(t, T.woff + i * .05, T.woff + .4 + i * .05), nr5 = NOREC; NOREC = nr5 || k < 1 || o2 > 0;
      var jx = (t < T.cr1 ? (Math.floor(t * 12) % 2 ? 6 : -6) * (i === T.WIN.length - 1 ? 1 : 0) : 0);
      g.save(); g.translate(440 + i * 70 + jx - 900 * o2 * o2, 700 + i * 120 - 300 * o2); g.rotate((i - 1) * .05 - .8 * o2); g.scale(lerp(.6, 1, k), lerp(.6, 1, k)); putW(g, P.win[i], 0, 0); g.restore(); NOREC = nr5;
    });
    /* handling: Penn's words on the car handling */
    strip(g, P.sq2, 510, 1250, .02, T.sq2, T.sq2o, t, { dir: 1, dur: .25 });
    credit(g, 'GARY PENN · DMA DESIGN', 560, 1372, T.sq2 + .25, T.sq2o, t, { rot: -.015 });
    /* ONE DAY */
    if (t >= T.oneday && t < T.odo + .5) {
      var ok = eo(seg(t, T.oneday, T.oneday + .14)), oo = seg(t, T.odo, T.odo + .4), nr6 = NOREC; NOREC = nr6 || ok < 1 || oo > 0;
      g.save(); g.translate(278 - 600 * oo * oo, 1300 + 14 * Math.sin(t * 2.2)); g.rotate(-.07 + .1 * (1 - ok) - .5 * oo); var os = .8 * lerp(1.5, 1, ok) * kn(t, T.oneday + .12, .05); g.scale(os, os); g.globalAlpha *= fin(t, T.oneday, .05); putW(g, P.oneday, 0, 0); g.restore(); NOREC = nr6;
    }
    if (t >= T.ramT && t < T.ramO + .3) {
      var nrr = NOREC, ro = seg(t, T.ramO, T.ramO + .25); NOREC = nrr || ro > 0;
      slam(g, 'RAM!', 330 - 500 * ro * ro, 660, 190, t - T.ramT, { col: HOT, rot: -.1, from: 1.8 }); NOREC = nrr;
    }
    /* bug + stayed: Penn's words, credit on the same card */
    strip(g, P.sq3, 510, 1250, -.02, T.sq3, T.sq4 - .1, t, { dur: .22 });
    strip(g, P.sq4, 510, 1250, .012, T.sq4, T.sqo, t, { dur: .22 });
    credit(g, 'GARY PENN · DMA DESIGN · GAMASUTRA 2011', 510, 1372, T.sq3 + .25, T.sqo, t, { px: 36, rot: -.01 });
    /* release: the 1997 page, FIRST RELEASE; gta6: the page tears to NOV 19 2026 and the GTA 6 pill */
    if (t >= T.rel && t < T.calOut + .6) {
      var o3 = seg(t, T.calOut, T.calOut + .5), cx = 745 + 700 * o3 * o3, cr = .05 + .5 * o3, nr7 = NOREC;
      if (t >= T.flip - .05) { NOREC = nr7 || o3 > 0 || t < T.flip + .2; putW(g, P.cal26, cx, 905, cr, .92); NOREC = nr7; }
      if (t < T.flip + .5) {
        var fu = seg(t, T.flip, T.flip + .45), dk = cd(t, T.rel + .1, 12);
        NOREC = nr7 || fu > 0 || dk < .97;
        g.save(); g.translate(cx + 260 * fu, 905 - 1100 * fu * fu + (1 - dk) * -400); g.rotate(cr - .8 * fu); putW(g, P.cal97, 0, 0, 0, .92); g.restore(); NOREC = nr7;
      }
    }
    if (T.FLAPS) T.FLAPS.forEach(function (ft, i) {
      var u = seg(t, ft, ft + .5); if (u <= 0 || u >= 1) return;
      g.save(); g.translate(745 + 260 * u, 905 - 1100 * u * u); g.rotate(.05 - (.6 + .2 * i) * u); g.scale(.92, .92 * (1 - .5 * Math.sin(u * Math.PI)));
      g.fillStyle = 'rgba(6,3,18,.35)'; g.fillRect(-196, -236, 400, 480); g.fillStyle = i % 2 ? CREAM : PADC; g.fillRect(-200, -240, 400, 480); g.fillStyle = i % 2 ? HOT : TEAL; g.fillRect(-200, -240, 400, 60); g.restore();
    });
    credit(g, 'FIRST RELEASE', 745, 1165, T.rel + .3, T.flip, t, { px: 44, bg: TEAL, fg: INK });
    if (t >= T.pill && t < T.calOut + .5) {
      var pk = eo(seg(t, T.pill, T.pill + .14)), po = seg(t, T.calOut, T.calOut + .45), nr8 = NOREC; NOREC = nr8 || pk < 1 || po > 0;
      g.save(); g.translate(745 + 700 * po * po, 600 + 4 * Math.sin(t * 3)); g.rotate(-.04 + .5 * po); var ps2 = lerp(1.5, 1, pk) * kn(t, T.pill + .12, .05); g.scale(ps2, ps2); g.globalAlpha *= fin(t, T.pill, .05); putW(g, P.pill6, 0, 0); g.restore(); NOREC = nr8;
    }
  }
  /* the end beetle walks on top of everything (world creature, not clipped) */
  function topFx(g, t) {
    if (t >= T.bE0) { var b = bugAt(t, null); if (b) beetle(g, b); }
  }

  function sweep(g, t, tm) {
    var k = seg(t, tm - .27, tm + .27); if (k <= 0 || k >= 1) return;
    var y = lerp(1980, -2150, eio(k));
    g.save(); g.translate(-10, y); g.rotate(-.03); g.scale(1, 1.32); put(g, P.sweep, 0, 0); g.restore();
  }

  /* ---------- captions: paper tape in the upper third, phrase by phrase; the hook card is frame 0 and the last frame ---------- */
  var GLUE = { the: 1, a: 1, an: 1, your: 1, its: 1, of: 1, at: 1, to: 1, and: 1, in: 1, with: 1, on: 1, by: 1, so: 1, for: 1, own: 1, how: 1, that: 1, if: 1, you: 1, no: 1, or: 1, it: 1, was: 1 };
  var CAPS = (function () {
    var outc = [];
    VO.lines.forEach(function (l) {
      var cur = [], ws = l.words.slice();
      ws.forEach(function (w, i) { cur.push(w); if (/[.?!:]$/.test(w.w) && i < ws.length - 1) { cur.id = l.id; outc.push(cur); cur = []; } });
      if (cur.length) { cur.id = l.id; outc.push(cur); }
    });
    var C = outc.map(function (ws) { return { id: ws.id, t0: ws[0].t0, t1: ws[ws.length - 1].t1, s: ws[0].t0 - .04, words: ws }; });
    /* the "why" card reads Gamasutra's own words (the voice still says "saved"), with no pink */
    C.forEach(function (c) { if (c.id === 'why') { c.noHi = true; var D = ['So', 'what', 'turned', 'it around?']; c.words = c.words.map(function (w, i) { var o = {}; for (var k in w) o[k] = w[k]; o.w = D[i] || w.w; return o; }); } });
    return C;
  })();
  var STRESS;
  function stressed(w) { for (var i = 0; i < STRESS.length; i++) if (Math.abs(STRESS[i] - w.t0) < .02) return true; return false; }
  var CAPY = 400;
  function captions(g, t) {
    t = tq(t);
    var card0 = null, ci = -1;
    if (t >= T.loopCap) { card0 = CAPS[0]; ci = -1; }
    else CAPS.forEach(function (c, i) { if (t >= c.s) { card0 = c; ci = i; } });
    if (!card0) return;
    var nx = ci >= 0 ? CAPS[ci + 1] : null, ns = nx ? nx.s : T.loopCap, end = ci === 0 ? ns : Math.min(card0.t1 + .55, ns);
    if (ci >= 0 && t >= end) return;
    if (card0.id === 'ram' && ci >= 0) return;
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
        var w = words[i], nw = words[i + 1], cur = ci >= 0 && !card0.noHi && stressed(w) && t >= w.t0 - .03 && t < Math.min(w.t1 + .05, nw ? nw.t0 - .03 : 1e9) + .2;
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
    if (!VIG) { VIG = mk(W, H); var q = VIG.getContext('2d'), gr = q.createRadialGradient(510, 880, 520, 510, 900, 1300); gr.addColorStop(0, 'rgba(6,3,18,0)'); gr.addColorStop(1, 'rgba(6,3,18,.55)'); q.fillStyle = gr; q.fillRect(0, 0, W, H); }
    g.drawImage(VIG, 0, 0);
  }
  function railClip(g) { g.beginPath(); if (LIVE2.clip) g.rect(BX0, 0, BX1 - BX0, BY1); else g.rect(-500, -500, 2080, BY1 + 500); g.clip(); }
  function frame(g, t) {
    g.setTransform(1, 0, 0, 1, 0, 0);
    stage(g);
    if (LIVE2.bg) { world(g, t); vignette(g); }
    g.save(); railClip(g); props(g, t); g.restore();
    if (LIVE2.bg) { g.save(); topFx(g, t); g.restore(); }
    g.save(); sweep(g, t, T.rel); g.restore();
    if (!POSTERMODE && LIVE.text) captions(g, t);
    if (LIVE.grain && NOISE && LIVE2.bg) { g.globalAlpha = .05; g.globalCompositeOperation = 'overlay'; var o = Math.floor(t * 24) * 37 % 256; g.fillStyle = g.createPattern(NOISE, 'repeat'); g.translate(-o, -o); g.fillRect(o, o, W, H); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }
  }
  function TEXTS(t) {
    var o = [];
    function Tx(id, text, a, b) { if (t >= a && t < b) o.push({ id: id, text: text, x0: 0, y0: 0, x1: 0, y1: 0 }); }
    Tx('gta', 'GTA', 0, T.dive + .3); Tx('gta', 'GTA', T.rel + .1, DUR + 1);
    Tx('stamp', 'CANCELED', .5, T.dive + .3); Tx('stamp', 'CANCELED', T.rel + .1, T.peel);
    Tx('q', '?', T.q + .14, T.dive + .25);
    Tx('sq1', P.sq1.lines.join(' '), T.sq1 + .05, T.sq1o);
    Tx('penn', 'GARY PENN · DMA DESIGN', T.sq1 + .25, T.sq1o); Tx('penn', 'GARY PENN · DMA DESIGN', T.sq2 + .35, T.sq2o);
    Tx('c95', '1995', T.c95 + .25, T.sOut);
    Tx('sign', "RACE'N'CHASE", T.sign + .16, T.sOut); Tx('ram', 'RAM!', T.ramT + .06, T.ramO);
    Tx('doc', 'DMA DESIGN DOC · 1995', T.doc + .2, T.docO); Tx('penn', 'GARY PENN · DMA DESIGN', T.WIN[0] + .3, T.woff);
    T.WIN.forEach(function (tw) { Tx('crash', 'CRASH', tw + .12, T.woff); });
    Tx('sq2', P.sq2.lines.join(' '), T.sq2 + .08, T.sq2o);
    Tx('oneday', 'ONE DAY', T.oneday + .14, T.odo);
    Tx('sq3', P.sq3.lines.join(' '), T.sq3 + .1, T.sq4 - .1);
    Tx('penng', 'GARY PENN · DMA DESIGN · GAMASUTRA 2011', T.sq3 + .35, T.sqo);
    Tx('sq4', P.sq4.lines.join(' '), T.sq4 + .1, T.sqo);
    Tx('keep', 'KEEP', T.keep + .12, T.rel);
    Tx('c97', '1997', T.rel + .3, T.flip); Tx('pceu', 'PC · EUROPE', T.rel + .3, T.flip);
    Tx('first', 'FIRST RELEASE', T.rel + .45, T.flip);
    Tx('c26', 'NOV 19 2026', T.flip + .3, T.calOut);
    Tx('pill', 'GTA 6', T.pill + .14, T.calOut);
    return o;
  }

  /* ---------- times and sound events, all from the voice ---------- */
  function initTimes() {
    /* hook: the stamp drops in at 0.3 s and slams in the pause after "canceled" */
    T.stampK = vadEndBefore(start('canned'), lastw('hook') - .6) + .15; EV.push({ t: T.stampK, type: 'stamp', g: 2.1, id: 'stamp' }); GT.stamp = T.stampK;
    /* canned: the trash can slides in, the case tips toward it on "scrap" */
    T.bin0 = start('canned') + .05; T.tip0 = at('canned', 'scrap') - .1; T.sq1 = T.stampK + .02; T.sq1o = start('why') - .2;
    G('tipT', after('canned'), 'thock', .35, 1);
    /* why: the can gets kicked off, the case springs up, the ? slams in the pause */
    T.kick = at('why', 'what') - .1; G('qP', after('why'), 'pop', .35, 1); T.q = start('why') - .15;
    /* began: the case drops into the city, the cars drive up the road */
    T.dive = start('began') + .05; G('diveS', T.dive - .25, 'swish', .45, 2.2);
    T.c95 = at('began', '1995'); T.doc = T.dive + .15; T.docO = start('crash') - .15; T.sign = at('began', '1995') + .3;
    G('signT', after('began'), 'thock', .4, 1);
    /* crash: the road plays in stop-motion; three windows stack up, the last one in the pause */
    T.cr0 = at('crash', 'crashed'); T.cr1 = start('handling') - .1;
    T.WIN = [at('crash', 'crashed'), at('crash', 'time.') - .05, G('w3', after('crash'), 'pop', .4, 1.1)]; T.sOut = T.WIN[0] - .05;
    G('buzz', T.WIN[2] + .12, 'buzz', .3, 1);
    T.woff = start('handling') - .1; G('woffS', T.woff - .05, 'swish', .3, .8);
    /* handling: Penn's words; the getaway car spins out, the screech lands in the pause */
    T.sq2 = start('handling') - .35; T.sp0 = at('handling', 'handling');
    G('skid', after('handling'), 'skid', .4, 1);
    T.bin2 = vadEndBefore(start('crazy'), lastw('handling') - .6) + .05; T.binC = G('binC', T.bin2 + .45, 'clank', .3, 1.4);
    /* crazy: ONE DAY just before "Then"; the light bar comes on with "cops" and the cop car surges */
    T.oneday = G('oneday', start('crazy') - .12, 'thock', .3, .85);
    T.cz0 = start('crazy') + .25; T.cz1 = at('crazy', 'cops') - .1; T.lit = at('crazy', 'cops') - .05;
    G('siren', after('crazy'), 'siren', .4, 21);
    T.odo = start('ram'); T.rp0 = start('ram') - .1; T.ramT = at('ram', 'ram') - .22;
    /* ram: a nudge on "ram", the hit in the pause after "road" (the film's loudest sound) */
    T.nudge = at('ram', 'ram'); T.sq2o = start('crazy') - .44;
    T.ram = G('ram', after('ram'), 'stamp', .45, 1, { heavy: true }); G('crunch', T.ram + .03, 'clank', .3, .5);
    /* bug: the camera pushes in on the cop car's hood; a paper beetle crawls out */
    T.push0 = start('bug') - .25; T.ramO = start('bug') - .34;
    T.bg0 = at('bug', 'bug.') - .7; T.sq3 = start('bug') - .2;
    G('crawl', after('bug'), 'crawl', .4, 3);
    /* stayed: Penn's words; KEEP slaps on the hood in the pause; the camera pulls back */
    T.sq4 = T.sq3 + 2.86; T.keep = vadEndBefore(at('stayed', 'stayed'), at('stayed', 'awesome')) + .02; T.keepS = G('keep', after('stayed'), 'slap', .5, 1.6); T.pull0 = T.keepS + .2;
    /* release: a page sweep on "in", the case is back, the stamp peels off */
    T.rel = start('release') - .12; T.sqo = start('release') - .3; G('relS', T.rel - .2, 'swish', .4, 1);
    T.peel = at('release', 'came') + .1;
    /* gta6: the 1997 page tears off in the breath before "GTA 6" */
    T.flip = vadEndBefore(start('gta6'), lastw('release') - .6) + .95; T.pill = T.flip + .1; T.FLAPS = [];
    for (var fq = 0; fq < 3; fq++) { var ft = vadEndBefore(start('gta6'), lastw('release') - .6) + .2 + fq * .25; T.FLAPS.push(ft); EV.push({ t: ft, type: 'tear', g: 1.8 - fq * .1, id: 'flap' + fq }); }
    EV.push({ t: T.flip, type: 'tear', g: 2.6, id: 'flipT' });
    G('seam', DUR - .5, 'swish', .4, 2.2);
    /* end: the beetle walks across the case; the calendar leaves after the last word; the case glides into the frame-0 pose */
    T.bE0 = start('end') - .25; T.bE1 = at('end', 'fixed'); T.cE = at('end', 'nobody');
    T.calOut = G('outS', at('end', 'it.') - .1, 'swish', .45, .7); T.home0 = T.calOut + .1;
    T.loopCap = DUR - .34;
    T.SPEED = [[0, 560], [T.stampK, 520], [T.bin0 + .5, 340], [T.dive, 380], [T.dive + .8, 440], [T.cr0, 420], [T.sp0, 330], [T.sp0 + 1.3, 190], [T.cz1, 250], [T.cz1 + .6, 950], [T.ram - .2, 1100], [T.ram + .4, 600], [T.push0 + .9, 250], [T.pull0, 300], [T.rel, 420], [DUR - .8, 520], [DUR, 560]];
    buildScroll();
    CAPS[0].s = -1;
    STRESS = [['canned', 'scrap'], ['why', 'saved'], ['began', '1995'], ['crash', 'crashed'], ['handling', 'terrible.'], ['crazy', 'crazy.'], ['ram', 'ram'], ['bug', 'bug.'], ['stayed', 'awesome.'], ['release', '1997.'], ['gta6', 'november'], ['end', 'fixed']].map(function (p) { return at(p[0], p[1]); });
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

  /* ---------- sound: paper foley written into the pauses; no music (Isac adds a TikTok sound) ---------- */
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
    function stamp(t, g, heavy) { tick(t, 1.6 * g, 2400); thump(t, .7 * g); if (heavy) { boom(t + .01, .6 * g, 110, 38, .5); band(t, t + .4, 900, 200, .12 * g, .02 * g, .7, 0, 'lowpass'); } var sn = noise(t, .12), sl = ac.createBiquadFilter(); sl.type = 'lowpass'; sl.frequency.value = 1500; var so = bus(1); sn.connect(sl); sl.connect(so); env(so.gain, [[t, 0], [t + .004, .32 * g], [t + .1, 0]]); }
    function swish(t, g) { band(t, t + .26, 600, 3600, .09 * g, .02 * g, 1.3, -.2); }
    function tear(t, g) { for (var j = 0; j < 8; j++) tick(t + .012 * j + rnd() * .006, (.35 + rnd() * .4) * g, 1800 + rnd() * 2400); band(t, t + .1, 1400, 4200, .07 * g, .02 * g, 1.4, .15); }
    function thock(t, g) { thump(t, .35 * g, 220); tick(t, .9 * g, 1800); }
    function pop(t, g) { thump(t, .3 * g, 320); tick(t, 1.1 * g, 2600); band(t, t + .06, 2400, 1200, .06 * g, .01 * g, 1.2); }
    function clank(t, g) { osc2('triangle', 523, t, t + .3, [[t, 0], [t + .003, .2 * g], [t + .2, 0]]); osc2('triangle', 811, t, t + .25, [[t, 0], [t + .003, .12 * g], [t + .16, 0]]); thump(t, .45 * g, 170); tick(t, 1.4 * g, 2200); for (var j = 1; j < 6; j++) { tick(t + j * .05, .6 * g, 1800); thump(t + j * .05, .12 * g, 260); } }
    /* a rubber screech: two detuned saws through a narrow band, pitch sliding down */
    function skid(t, g) { [0, 7].forEach(function (d) { var o = osc2('sawtooth', 1250 + d * 9, t, t + .26, [[t, 0], [t + .02, .05 * g], [t + .18, .035 * g], [t + .24, 0]], .2); o.frequency.linearRampToValueAtTime(820 + d * 6, t + .24); }); band(t, t + .24, 2600, 1800, .06 * g, .02 * g, 3, .2); }
    /* a digital crash buzz */
    function buzz(t, g) { var o = osc2('square', 118, t, t + .14, [[t, 0], [t + .004, .07 * g], [t + .11, .05 * g], [t + .13, 0]]); o.frequency.setValueAtTime(96, t + .05); o.frequency.setValueAtTime(140, t + .09); }
    /* a two-tone siren chirp, 0.1 s */
    function siren(t, g) { var o = osc2('triangle', 960, t, t + .11, [[t, 0], [t + .006, .14 * g], [t + .09, .1 * g], [t + .1, 0]]); o.frequency.setValueAtTime(720, t + .05); }
    function slap(t, g) { thump(t, .3 * g, 260); band(t, t + .06, 3000, 1500, .12 * g, .01 * g, .9); tick(t, 1.2 * g, 2000); }
    function crawl(t, g) { for (var j = 0; j < 5; j++) tick(t + j * .028, (.5 + .1 * (j % 2)) * g, 4200); }
    var LEVEL = { stamp: 1, swish: 22, tear: 18, thock: 5, pop: 11, clank: 6, skid: 6, buzz: 5, siren: 3, slap: 3, crawl: 4 };
    var TRIM = window.SFX_TRIM || {};
    var TYPE_DB = window.SFX_TYPE_DB || { stamp: 0, swish: -5, tear: -9, pop: -10, clank: -14, thock: -2, skid: -10, buzz: -9, siren: -7, slap: -6, crawl: -5 };
    EV.forEach(function (e) {
      var g = (e.g == null ? 1 : e.g) * (LEVEL[e.type] || 1) * Math.pow(10, ((TRIM[e.id] || 0) + (TYPE_DB[e.type] || 0)) / 20);
      if (e.type === 'stamp') stamp(e.t, g, e.heavy);
      else if (e.type === 'swish') swish(e.t, g);
      else if (e.type === 'tear') tear(e.t, g);
      else if (e.type === 'thock') thock(e.t, g);
      else if (e.type === 'pop') pop(e.t, g);
      else if (e.type === 'clank') clank(e.t, g);
      else if (e.type === 'skid') skid(e.t, g);
      else if (e.type === 'buzz') buzz(e.t, g);
      else if (e.type === 'siren') siren(e.t, g);
      else if (e.type === 'slap') slap(e.t, g);
      else if (e.type === 'crawl') crawl(e.t, g);
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
    return Promise.all(fonts.map(function (f) { return document.fonts.load(f, 'Aa0%°×−≈≠µ“”’·→…#?‹|~$+—½'); })).then(function () { return document.fonts.ready; }).then(function () {
      buildTextures();
      window.READY = true;
    });
  }

  window.FILM = { bare: function () { ctx.setTransform(1, 0, 0, 1, 0, 0); stage(ctx); }, W: W, H: H, DUR: DUR, POSTER: 0, SLUG: 'gta-origin', SHOTS: [], init: init, render: render, frame: frame, LIVE: LIVE, LIVE2: LIVE2, T: T, GT: GT };
  var _bt = buildTextures; buildTextures = function () { _bt(); EV.length = 0; initTimes(); window.FILM.POSTER = Math.round((T.stampK + .5) * 30) / 30 + 1 / 60;
    window.FILM.SHOTS = [{ id: 'hook', name: 'Almost canceled', t0: 0, t1: T.dive }, { id: 'began', name: "Race'n'Chase", t0: T.dive, t1: start('crazy') }, { id: 'crazy', name: 'The cops go crazy', t0: start('crazy'), t1: start('bug') }, { id: 'bug', name: 'A bug', t0: start('bug'), t1: T.rel }, { id: 'release', name: '1997 to GTA 6', t0: T.rel, t1: DUR }]; };

  window.BOUNDS_RUN = function (step) {
    BOUNDS = []; var o = {};
    for (var t = 0; t <= DUR + 1e-6; t += step || 1 / 15) { CURT = t; POSTERMODE = false; frame(ctx, t); }
    BOUNDS.forEach(function (b) { var r = o[b.text] || (o[b.text] = { text: b.text, from: b.t, to: b.t, x0: b.x0, x1: b.x1, y1: b.y1, n: 0 }); r.to = b.t; r.n++; r.x0 = Math.min(r.x0, b.x0); r.x1 = Math.max(r.x1, b.x1); r.y1 = Math.max(r.y1, b.y1); });
    BOUNDS = null; return Object.keys(o).map(function (k) { return o[k]; });
  };
  /* rail scan: with the bleed city and the world off and no clip, every prop shape and glyph must stay inside x 90-930 and above y 1450 */
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
