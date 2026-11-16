/* "Which GTA sold the most?": the top three GTA games by their last official count, Delta (pillar 3, GTA history).
   A vertical film written in code, narrated first and cut to the voice: every visual beat is keyed to a word time from
   vo/vo.js (window.VO) with at(id, word). Pure function of t. Contract: window.FILM, DUR, render(t), READY, EV, TEXTS(t),
   SCORE(ctx). One shelf under one camera: three blank paper keep-cases on a podium (frame 0) stand on one floor and rise
   on stacks of case spines, one spine per 2.5 million copies for all three (one honest scale): GTA 4 25M (Take-Two,
   July 2013), San Andreas 27.5M (Rockstar, Sept 2011), GTA 5 230M+ sold-in (Take-Two, Aug 2026), whose stack erupts out
   of the frame. Then a paper pie (230 of ~475M), a tear-off NOV 19 2026 calendar, and the vote. Engine from
   film/gta-money (paper pieces, VAD gate, fontStretch re-apply, rail scan). Our own generic cases with plain text titles:
   no Rockstar footage, logo, key art, box art or cover art; no music. */
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


  BODY.tear = .1; BODY.land = .1; BODY.thock = .12; BODY.pop = .1;

  /* =====================================================================================================
     THE SET. A deep-ink paper wall with a cut-paper striped sun and palms (screen space, bleeds to the full frame),
     two pale paper spotlight beams and drifting paper flecks. In front, in world space under the camera, a teal paper
     shelf (also background, bleeds) whose top edge is the one baseline every stack stands on.
     ===================================================================================================== */
  var BASE = 1400, PXM = 5, SLAB = 2.5 * PXM, CW = 200, CH = 250, COLX = [270, 490, 710], VAL = [25, 27.5, 230], PODH = [90, 150, 215];
  var MINT2 = '#2fb3a3', DEEP = '#0f5d63', SHELF = '#137f7a', GOLD = '#ffc83d';
  var AY = 865;
  function palmSil(g, x, y, s, col, lean) {
    g.save(); g.translate(x, y); g.scale(s, s); g.fillStyle = col; g.strokeStyle = col; g.lineCap = 'round';
    var lx = lean || 14;
    g.lineWidth = 9; g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(lx * .2, -50, lx, -96); g.stroke();
    g.translate(lx, -96);
    [[-2.75, 58], [-2.2, 62], [-1.55, 50], [-.95, 62], [-.4, 58], [-1.25, 34]].forEach(function (f) {
      g.save(); g.rotate(f[0]); g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(f[1] * .5, -15, f[1], 7); g.quadraticCurveTo(f[1] * .45, 5, 0, 0); g.fill(); g.restore();
    });
    g.restore();
  }
  /* a printed card: lines = [[text, px, color, dy, stretch, dx]] */
  function caseCard(bg, lines, o) {
    o = o || {};
    return cardPiece(CW, CH, '#1b1440', lines, { r: 14, before: function (g) {
      /* the clear sleeve over a printed insert, a darker spine bar on the left, two plastic hinge nubs */
      rr(g, -CW / 2 + 12, -CH / 2 + 12, CW - 24, CH - 24, 6); g.fillStyle = bg; g.fill();
      g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(-CW / 2 + 12, -CH / 2 + 12, 16, CH - 24);
      g.fillStyle = 'rgba(255,255,255,.1)'; g.beginPath(); g.moveTo(-CW / 2 + 40, -CH / 2 + 12); g.lineTo(-CW / 2 + 90, -CH / 2 + 12); g.lineTo(-CW / 2 + 30, CH / 2 - 12); g.lineTo(-CW / 2 + 28, CH / 2 - 12); g.lineTo(-CW / 2 + 28, -CH / 2 + 40); g.closePath(); g.fill();
      if (o.stripe) { g.fillStyle = o.stripe; g.fillRect(-CW / 2 + 40, CH / 2 - 52, CW - 64, 12); g.fillRect(-CW / 2 + 40, -CH / 2 + 34, CW - 64, 8); }
      if (o.before) o.before(g);
    } });
  }
  var FLECK = [];
  function buildTextures() {
    GRAIN = buildGrain();
    P.wall = piece([-60, -60, 1140, 1980], rect(-60, -60, 1140, 1980), '#1c0f3d', { shadow: false, edge: false, grain: .9, ps: .5, extra: function (g) {
      var gr = g.createLinearGradient(0, 0, 0, 1980); gr.addColorStop(0, '#120a2c'); gr.addColorStop(1, '#2d1655'); g.fillStyle = gr; g.fillRect(-60, -60, 1200, 2100);
      g.save(); g.beginPath(); g.arc(510, 760, 470, 0, TAU); g.clip();
      var sg = g.createLinearGradient(0, 290, 0, 1230); sg.addColorStop(0, 'rgba(255,176,103,.22)'); sg.addColorStop(.55, 'rgba(255,79,163,.17)'); sg.addColorStop(1, 'rgba(255,79,163,.08)'); g.fillStyle = sg; g.fillRect(0, 280, 1080, 960);
      g.fillStyle = '#1f1043'; for (var i = 0; i < 9; i++) { var y = 780 + i * 50 + i * i * 2; g.fillRect(0, y, 1080, 8 + i * 3); }
      g.restore();
    } });
    var r = mulberry(77), cols = [HOT, TEAL, ORG, CREAM, GOLD];
    for (var i = 0; i < 26; i++) FLECK.push({ x: r() * 1080, y: r() * 1500, w: 10 + r() * 14, sp: 1 + Math.floor(r() * 2), ph: r() * TAU, rs: 1 + Math.floor(r() * 3), col: cols[i % cols.length], dx: r() * 60 });

    /* the cases: blank keep-cases with our own plain inserts; no box art, no logos, no panels */
    var qmark = [['?', 190, HOT, 8]];
    P.caseQ = caseCard(PAPER, qmark, { stripe: 'rgba(29,18,51,.12)' });
    P.case4 = caseCard(TEAL, [['GTA', 64, INK, -46], ['4', 132, INK, 50]], { stripe: 'rgba(29,18,51,.25)' });
    P.caseSA = caseCard(ORG, [['SAN', 64, INK, -40], ['ANDREAS', 47, INK, 22]], { stripe: 'rgba(29,18,51,.25)' });
    P.case5 = caseCard(HOT, [['GTA', 64, INK, -46], ['5', 132, INK, 50]], { stripe: 'rgba(29,18,51,.25)' });
    P.case6 = caseCard(PAPER, [['GTA 6', 62, INK, -54], ['?', 120, HOT, 40]], { stripe: 'rgba(29,18,51,.12)' });

    /* the podium (frame 0 only): three cut-paper steps, no numbers */
    P.pod = [TEAL, ORG, HOT].map(function (c, i) { var h = PODH[i] + 20; return piece([-112, 0, 112, h], rect(-112, 0, 112, h), c, { sx: 4, sy: 8, blur: 12, extra: function (g) { g.fillStyle = 'rgba(255,255,255,.2)'; g.fillRect(-112, 0, 224, 10); g.fillStyle = 'rgba(29,18,51,.18)'; g.fillRect(-112, 22, 224, 4); g.fillStyle = 'rgba(29,18,51,.1)'; for (var x = -100; x < 112; x += 36) g.fillRect(x, 30, 2, h - 30); } }); });

    /* the crown: cut gold paper, three points, pink gems */
    P.crown = piece([-86, -74, 86, 18], function (g) { g.beginPath(); g.moveTo(-80, 14); g.lineTo(-86, -52); g.lineTo(-44, -16); g.lineTo(0, -72); g.lineTo(44, -16); g.lineTo(86, -52); g.lineTo(80, 14); g.closePath(); }, GOLD, { sx: 4, sy: 8, blur: 10, extra: function (g) {
      g.fillStyle = 'rgba(160,90,0,.35)'; g.fillRect(-90, -6, 180, 20);
      [[-58, 2], [0, 2], [58, 2]].forEach(function (p, i) { g.fillStyle = i === 1 ? HOT : TEAL; g.beginPath(); g.arc(p[0], p[1], 9, 0, TAU); g.fill(); });
      [[-86, -52], [0, -72], [86, -52]].forEach(function (p) { g.fillStyle = CREAM; g.beginPath(); g.arc(p[0], p[1] + 6, 7, 0, TAU); g.fill(); });
    } });

    /* the ledger card for the count line */
    P.ledger = cardPiece(700, 420, NEWS, [['BEST-SELLING GTA', 78, HOT, -140], ['#1', 60, INK, -36, null, -230], ['#2', 60, INK, 46, null, -230], ['#3', 60, INK, 128, null, -230], ['?', 64, HOT, -36, null, 250], ['?', 64, HOT, 46, null, 250], ['?', 64, HOT, 128, null, 250]], { r: 8, ring: 'rgba(29,18,51,.18)', before: function (g) {
      g.fillStyle = 'rgba(29,18,51,.05)'; for (var y = -200; y < 210; y += 10) g.fillRect(-340, y, 680, 1);
      g.fillStyle = HOT; g.fillRect(-350, -210, 700, 12);
      g.strokeStyle = 'rgba(29,18,51,.45)'; g.lineWidth = 4; g.setLineDash([3, 12]); g.lineCap = 'round';
      [-36, 46, 128].forEach(function (y) { g.beginPath(); g.moveTo(-170, y + 18); g.lineTo(200, y + 18); g.stroke(); });
      g.setLineDash([]);
    } });
    P.stampC = buildStamp(['LAST OFFICIAL COUNT'], 80, 600);

    /* year tiles: little tear-off calendar tiles */
    function tile(y) { return cardPiece(200, 130, CREAM, [[y, 76, INK, 18]], { r: 8, before: function (g) { g.fillStyle = ORG; g.fillRect(-100, -65, 200, 30); [-50, 50].forEach(function (x) { g.fillStyle = '#2a1850'; g.beginPath(); g.arc(x, -50, 7, 0, TAU); g.fill(); }); } }); }
    P.y2013 = tile('2013'); P.y2011 = tile('2011');
    /* compact tags for the comparison: number + year */
    function ctag(n, y) { return cardPiece(196, 150, CREAM, [[n, 72, INK, -22], [y, 52, HOT, 44]], { r: 10, ring: 'rgba(29,18,51,.2)' }); }
    P.t4 = ctag('25M', '2013'); P.tSA = ctag('27.5M', '2011');

    /* the pie: all GTA ≈ 475M; GTA 5's slice is 230 / 475 = 48.4% (174.3°) */
    var A0 = -Math.PI / 2, A1 = A0 + TAU * 230 / 475, R = 290;
    P.pieRest = piece([-R, -R, R, R], function (g) { g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, R, A1, A0 + TAU); g.closePath(); }, TEAL, { sx: 6, sy: 12, blur: 18, extra: function (g) { g.fillStyle = 'rgba(29,18,51,.08)'; for (var k = 0; k < 7; k++) { g.beginPath(); g.arc(0, 0, R - 26 - k * 34, 0, TAU); g.lineWidth = 2; g.strokeStyle = 'rgba(29,18,51,.1)'; g.stroke(); } } });
    P.pieSlice = piece([-R, -R, R, R], function (g) { g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, R, A0, A1); g.closePath(); }, HOT, { sx: 8, sy: 14, blur: 20, extra: function (g) { for (var k = 0; k < 7; k++) { g.beginPath(); g.arc(0, 0, R - 26 - k * 34, 0, TAU); g.lineWidth = 2; g.strokeStyle = 'rgba(29,18,51,.12)'; g.stroke(); } } });
    P.pieA0 = A0; P.pieA1 = A1; P.pieR = R;

    /* the calendar page: a tear-off day calendar, orange binding */
    var PAD_W = 340, PAD_H = 330; P.PAD_W = PAD_W; P.PAD_H = PAD_H;
    P.padBack = piece([-PAD_W / 2, -PAD_H / 2, PAD_W / 2, PAD_H / 2], function (g) { rr(g, -PAD_W / 2, -PAD_H / 2, PAD_W, PAD_H, 12); }, '#e7d6bd', { sx: 6, sy: 12, blur: 18, extra: function (g) {
      g.fillStyle = 'rgba(29,18,51,.12)'; for (var i = 0; i < 6; i++) g.fillRect(-PAD_W / 2 + 6, PAD_H / 2 - 8 - i * 4, PAD_W - 12, 1.5);
    } });
    P.binding = piece([-PAD_W / 2 - 6, -PAD_H / 2 - 10, PAD_W / 2 + 6, -PAD_H / 2 + 52], function (g) { rr(g, -PAD_W / 2 - 6, -PAD_H / 2 - 10, PAD_W + 12, 62, 10); }, ORG, { sx: 3, sy: 6, blur: 8, extra: function (g) {
      g.fillStyle = 'rgba(255,255,255,.2)'; g.fillRect(-PAD_W / 2 - 6, -PAD_H / 2 - 10, PAD_W + 12, 8);
      [-90, 90].forEach(function (x) { g.fillStyle = '#2a1850'; g.beginPath(); g.arc(x, -PAD_H / 2 + 22, 12, 0, TAU); g.fill(); g.strokeStyle = '#d9dce6'; g.lineWidth = 6; g.beginPath(); g.arc(x, -PAD_H / 2 + 8, 16, Math.PI * .1, Math.PI * .9, true); g.stroke(); });
    } });
    P.nov19 = cardPiece(PAD_W - 24, PAD_H - 70, CREAM, [['NOV', 54, HOT, -96], ['19', 150, INK, 4], ['2026', 46, INK, 100]], { r: 6, sy: 3 });
    P.blankPg = cardPiece(PAD_W - 24, PAD_H - 70, CREAM, [], { r: 6, sy: 3 });

    P.pill6 = cardPiece(300, 96, HOT, [['GTA 6', 74, INK, 3]], { r: 48, ring: 'rgba(255,240,234,.9)' });
    function tagPiece(word, w, px) { return cardPiece(w, 130, CREAM, [[word, px, INK, 6, null, 14]], { r: 8, ring: 'rgba(29,18,51,.25)', path: function (g) { g.beginPath(); g.moveTo(-w / 2 + 34, -65); g.lineTo(w / 2, -65); g.lineTo(w / 2, 65); g.lineTo(-w / 2 + 34, 65); g.lineTo(-w / 2, 34); g.lineTo(-w / 2, -34); g.closePath(); }, after: function (g) { g.fillStyle = '#5a3a1a'; g.beginPath(); g.arc(-w / 2 + 22, 0, 8, 0, TAU); g.fill(); } }); }
    P.yes = tagPiece('YES', 200, 84); P.no = tagPiece('NO', 200, 84);
    P.pin = piece([-16, -16, 16, 16], function (g) { g.beginPath(); g.arc(0, 0, 14, 0, TAU); }, TEAL, { sx: 3, sy: 5, blur: 5, edge: 1.5, after: function (g) { g.fillStyle = 'rgba(255,255,255,.6)'; g.beginPath(); g.arc(-4, -4, 4, 0, TAU); g.fill(); } });
    /* the wipe band: one long torn strip of pink paper */
    var tp = jag(301, 1100, 10), bt = jag(302, 1100, 10);
    P.band = piece([0, -20, 1100, 1580], function (g) { g.beginPath(); g.moveTo(0, tp[0][1]); tp.forEach(function (p) { g.lineTo(p[0], p[1]); }); for (var i = bt.length - 1; i >= 0; i--) g.lineTo(bt[i][0], 1560 + bt[i][1]); g.closePath(); }, HOT, { sx: 0, sy: 10, blur: 20, ps: .75, extra: function (g) { g.fillStyle = 'rgba(80,0,40,.12)'; for (var y = 30; y < 1560; y += 46) g.fillRect(0, y, 1100, 3); } });
  }
  function buildStamp(lines, px, maxw) {
    var m = mk(4, 4).getContext('2d'); cond(m); font(m, px, 900); ls(m, 2); var w1 = Math.max.apply(null, lines.map(function (L) { return m.measureText(L).width; })); unst(m);
    if (w1 > maxw) { px = Math.floor(px * maxw / w1); cond(m); font(m, px, 900); ls(m, 2); w1 = Math.max.apply(null, lines.map(function (L) { return m.measureText(L).width; })); unst(m); }
    var lh = px * 1.02, w = w1 + 56, h = lines.length * lh + 56, tp = jag(95, w, 4), bt = jag(96, w, 4), rec = [];
    var pc = piece([-w / 2, -h / 2 - 8, w / 2, h / 2 + 8], function (g) { g.beginPath(); g.moveTo(-w / 2, -h / 2 + tp[0][1]); tp.forEach(function (q) { g.lineTo(-w / 2 + q[0], -h / 2 + q[1]); }); for (var i = bt.length - 1; i >= 0; i--) g.lineTo(-w / 2 + bt[i][0], h / 2 + bt[i][1]); g.closePath(); }, NEWS, { sx: 6, sy: 12, blur: 16, extra: function (g) {
      var r = mulberry(91);
      g.strokeStyle = HOT; g.lineWidth = 9; g.strokeRect(-w / 2 + 12, -h / 2 + 14, w - 24, h - 28);
      lines.forEach(function (L, i) { var y = -h / 2 + 28 + lh * (i + .5); inkText(g, L, 0, y + 2, px, HOT, 93 + i, { dense: 26, big: 2.2, ls: 2 }); rec.push([-w1 / 2, y - px * .5, w1 / 2, y + px * .45, L]); });
      g.globalCompositeOperation = 'destination-out';
      for (var i = 0; i < 520; i++) { g.globalAlpha = .2 + r() * .5; g.beginPath(); g.arc(-w / 2 + 16 + r() * (w - 32), -h / 2 + 14 + r() * (h - 28), .5 + r() * 1.8, 0, TAU); g.fill(); }
    } });
    pc.words = rec.map(function (r0) { return [r0[0] - pc.x0, r0[1] - pc.y0, r0[2] - pc.x0, r0[3] - pc.y0, r0[4]]; });
    pc.sw = w; pc.sh = h; return pc;
  }

  /* =====================================================================================================
     TIME, CAMERA AND STATE. T holds every beat time (set in initTimes from the voice). The film runs in phases cut
     by paper wipes: 0 the shelf (hook → asof), 1 the pie (half), 2 the calendar (six), 3 the shelf again (end),
     then the loop wipe brings back frame 0 (the shelf drawn at t − DUR, which is frame 0's state exactly).
     ===================================================================================================== */
  var T = {}, LIVE2 = { bg: true, clip: true };
  function sm(t, a, d) { return eio(seg(t, a, a + (d || .5))); }
  function phase(t) { return t < T.W1 ? 0 : t < T.W2 ? 1 : t < T.W3 ? 2 : t < T.W4 ? 3 : 4; }
  var CAMS = [];
  function camAt(t) {
    var c = { x: CAMS[0].x, y: CAMS[0].y, s: CAMS[0].s };
    for (var i = 1; i < CAMS.length; i++) {
      var m = CAMS[i]; if (t <= m.t0) break;
      var k = eio(seg(t, m.t0, m.t1)), ty = typeof m.y === 'function' ? m.y(Math.min(t, m.t1 + 9)) : m.y;
      c.x = lerp(c.x, m.x, k); c.y = lerp(c.y, ty, k); c.s = lerp(c.s, m.s, k);
    }
    /* a slow breathing push, periodic in the film's length, so no beat ever holds dead still */
    c.s *= 1 + .018 * osc(t, 9, .7); c.x += 6 * osc(t, 5, 1.3);
    return c;
  }
  function W2S(c, x, y) { return [510 + (x - c.x) * c.s, AY + (y - c.y) * c.s]; }
  /* stack heights in millions */
  function val(i, t) {
    if (i === 0) return 25 * eio(seg(t, T.g0a, T.g0b));
    if (i === 1) return 27.5 * eio(seg(t, T.g1a, T.g1b));
    return 230 * eio(seg(t, T.g2a, T.g2b)) * (1 - (T.endSink ? eio(seg(t, T.endSink, T.endSink + .35)) : 0));
  }
  function tq(t) { return (Math.floor(t * 30) + .5) / 30; }
  function fmtM(m, half) {
    var n = half ? Math.round(m * 2) / 2 : Math.round(m), s = String(Math.round(n * 1e6));
    return s.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  /* ---------- the world (camera space) ---------- */
  var SPINE = [[DEEP, '#1d8a83', '#24497a', '#2fb3a3'], ['#a8542a', '#d0742f', '#7a2d6b', '#e39a4f'], ['#7a2d6b', '#c43a85', '#5b2a7e', '#e0559b']];
  function stack(g, i, x, v) {
    if (v <= .001) return;
    var h = v * PXM, n = Math.ceil(v / 2.5 - 1e-6), top = BASE - h;
    g.save();
    for (var k = 0; k < n; k++) {
      var y1 = BASE - k * SLAB, y0 = Math.max(top, y1 - SLAB); if (y1 <= y0) continue;
      var off = ((k * 7 + i * 3) % 5 - 2) * 2.2;
      g.fillStyle = SPINE[i][k % 4]; g.fillRect(x - 96 + off, y0 + .6, 192, y1 - y0 - 1.2);
      g.fillStyle = 'rgba(255,255,255,.16)'; g.fillRect(x - 96 + off, y0 + .6, 192, Math.min(2.5, y1 - y0));
      if (y1 - y0 > 6) { g.fillStyle = k % 2 ? CREAM : 'rgba(251,240,234,.7)'; g.fillRect(x - 84 + off, y0 + (y1 - y0) / 2 - 2.5, 30, 5); g.fillStyle = 'rgba(29,18,51,.35)'; g.fillRect(x + 50 + off, y0 + (y1 - y0) / 2 - 2, 34, 4); }
    }
    g.globalAlpha *= .5; g.beginPath(); g.rect(x - 100, top, 200, h); g.clip(); g.fillStyle = g.createPattern(GRAIN, 'repeat'); g.fillRect(x - 100, top, 200, h);
    g.restore();
    /* a soft shadow line where the stack meets the shelf */
    g.save(); g.fillStyle = 'rgba(6,3,18,.35)'; g.fillRect(x - 104, BASE - 2, 208, 6); g.restore();
  }
  function flipScale(t, at) { var k = seg(t, at, at + .3); return { sx: Math.max(.04, Math.abs(Math.cos(k * Math.PI))), after: k >= .5, moving: k > 0 && k < 1 }; }
  var CASES = ['case4', 'caseSA', 'case5'];
  function caseAt(g, i, t, x, yBottom, extraRot) {
    var f = flipScale(t, T['flip' + i]), pc = f.after && t < T.W4 ? P[CASES[i]] : P.caseQ;
    var wob = sw(t, T['land' + i] || -9, .05, 9, 3) + .012 * osc(t, 6 + i, i) + (extraRot || 0);
    var kk = kn(t, T['knock' + i] || -9, .07) * kn(t, T['flip' + i] + .3, .05);
    g.save(); g.translate(x, yBottom); g.rotate(wob); g.scale(f.sx * kk, kk);
    NOREC = NOREC || f.moving; putW(g, pc, 0, -CH / 2); g.restore();
  }
  function podK(t) { return 1 - sm(t, T.podIn - .02, .5); }
  function world(g, t, mode) {
    var c = camAt(t), ph = mode || 0;
    g.save(); g.translate(510, AY); g.scale(c.s, c.s); g.translate(-c.x, -c.y);
    var nr = NOREC; NOREC = nr || camMoving(t);
    if (ph === 0) {
      /* podium (frame 0), sinking into the shelf on "The" */
      var pk = podK(t);
      if (pk > 0) { g.save(); g.beginPath(); g.rect(-500, -2000, 2500, BASE + 2000); g.clip(); for (var i = 0; i < 3; i++) put(g, P.pod[i], COLX[i], BASE - PODH[i] * pk + (1 - pk) * 30); g.restore(); }
      for (i = 0; i < 3; i++) {
        var v = val(i, t);
        stack(g, i, COLX[i], v);
        var hop0 = t >= 0 ? 28 * Math.sin(Math.PI * seg(t, i * .33 + .1, i * .33 + .4)) : 0, hop1 = 26 * Math.sin(Math.PI * seg(t, T.hopC + i * .25, T.hopC + i * .25 + .28));
        var yb = BASE - v * PXM - PODH[i] * pk - hop0 - hop1;
        caseAt(g, i, t, COLX[i], yb);
      }
      crown(g, t);
    } else if (ph === 3) {
      stack(g, 2, COLX[2], val(2, t));
      caseAt(g, 2, t, COLX[2], BASE - val(2, t) * PXM);
      /* the GTA 6 case lands on the shelf where the short stacks were */
      var k6 = cd(t, T.c6In, 15), y6 = lerp(BASE - 900, BASE, k6) + (t > T.endSink ? sm(t, T.endSink, .35) * 400 : 0);
      g.save(); g.translate(395, y6); g.rotate(sw(t, T.c6In + .2, .06, 9, 3) + .01 * osc(t, 6, 2)); NOREC = NOREC || k6 < .98 || t > T.endSink; g.scale(1.45, 1.45); putW(g, P.case6, 0, -CH / 2); g.restore();
      NOREC = nr || camMoving(t);
      if (t > T.c6In + .25 && t < T.c6In + .7) KIT.dust(g, 395, BASE, t - T.c6In - .25, .7);
    }
    NOREC = nr;
    g.restore();
    return c;
  }
  function camMoving(t) {
    var a = camAt(t - .02), b = camAt(t + .02);
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y) > .5 || Math.abs(a.s - b.s) > .001;
  }
  /* the crown: drops onto San Andreas on "Rockstar", knocked off on "But" */
  function crown(g, t) {
    if (t < T.crownIn - .3 || t > T.crownOff + .7) return;
    var top = BASE - val(1, t) * PXM - CH, k = cd(t, T.crownIn, 13), off = seg(t, T.crownOff, T.crownOff + .6);
    var x = COLX[1] + off * 420, y = lerp(top - 520, top - 6, k) - off * 260 + off * off * 700, rot = (1 - k) * -.4 + off * 2.4 + sw(t, T.crownIn + .15, .1, 8, 3);
    g.save(); g.translate(x, y); g.rotate(rot); g.scale(1.1, 1.1); put(g, P.crown, 0, 0); g.restore();
    if (t > T.crownIn + .1 && t < T.crownOff) { g.save(); g.globalAlpha *= 1 - seg(t, T.crownIn + 1.6, T.crownIn + 2); KIT.emote(g, 'sparkle', COLX[1] + 100, top - 90, 1, t - T.crownIn - .1, t); g.restore(); }
  }

  /* ---------- the glass (screen space, over the world) ---------- */
  function sk(g, s, x, y, px, o) { return KIT.sticker(g, s, x, y, px, Object.assign({ wide: false, ink: INK, lw: Math.max(5, px * .14) }, o)); }
  function chipAt(g, t, text, x, y, tin, tout, o) {
    o = o || {}; if (t < tin - .02 || t > tout + .3) return;
    var k = cd(t, tin, 14); NOREC = k < .98 || t > tout;
    chip(g, text, x, y + (1 - k) * (o.from || -40), { px: o.px || 44, bg: o.bg || ORG, fg: o.fg || INK, a: fin(t, tin, .08) * (1 - seg(t, tout, tout + .25)), rot: o.rot || 0, s: kn(t, tin + .1, .05) });
    NOREC = false;
  }
  /* a rank badge sticker: a pink disc with #N, slammed onto the case corner */
  function badge(g, t, n, x, y, tin, tout, s0) {
    if (t < tin - .02 || t > tout + .3) return;
    var u = t - tin, k = eo(clamp(u / .14, 0, 1)), sc = lerp(2.2, 1, k) * (s0 || 1), a = clamp(u / .05, 0, 1) * (1 - seg(t, tout, tout + .25));
    g.save(); g.globalAlpha *= a; g.translate(x, y); g.rotate(-.12 + .04 * Math.sin(t * 3)); g.scale(sc, sc);
    g.beginPath(); g.arc(4, 7, 62, 0, TAU); g.fillStyle = 'rgba(6,3,18,.4)'; g.fill();
    g.beginPath(); for (var i = 0; i < 24; i++) { var an = i / 24 * TAU, r = i % 2 ? 56 : 64; g.lineTo(Math.cos(an) * r, Math.sin(an) * r); } g.closePath(); g.fillStyle = HOT; g.fill(); g.lineWidth = 5; g.strokeStyle = CREAM; g.stroke();
    NOREC = NOREC || k < 1 || t > tout; sk(g, '#' + n, 0, 4, 60, { col: CREAM }); NOREC = false;
    g.restore();
  }
  /* the counter card: a big rolling number on cream paper; its sub-lines show only once the number has landed */
  function counterCard(g, t, str, sub, x, y, s, a, landed, tland, hot) {
    if (a <= 0) return;
    g.save(); g.globalAlpha *= a; g.translate(x, y); g.rotate(-.012); var kk = kn(t, tland, .06); g.scale(s * kk, s * kk);
    var w = 620, h = sub.length ? 150 + sub.length * 58 : 160;
    g.save(); rr(g, -w / 2 + 6, -h / 2 + 10, w, h, 12); g.fillStyle = 'rgba(6,3,18,.45)'; g.fill(); rr(g, -w / 2, -h / 2, w, h, 12); g.fillStyle = CREAM; g.fill();
    g.clip(); g.globalAlpha *= .6; g.fillStyle = g.createPattern(GRAIN, 'repeat'); g.fillRect(-w / 2, -h / 2, w, h); g.restore();
    g.fillStyle = hot || HOT; g.fillRect(-w / 2, -h / 2, w, 12);
    var nr = NOREC; NOREC = nr || !landed;
    txt(g, str, 0, -h / 2 + 88, { px: 112, align: 'center', col: INK, ls: 2 });
    NOREC = nr;
    if (landed) sub.forEach(function (L, i) { var sa = fin(t, tland + .12 + i * .1, .12); if (sa <= 0) return; NOREC = nr || sa < 1; txt(g, L, 0, -h / 2 + 172 + i * 58, { px: 52, align: 'center', col: i ? HOT : INK, a: sa, ls: 2 }); NOREC = nr; });
    g.restore();
  }
  function tileAt(g, t, pc, x, y, tin, tout, rot) {
    if (t < tin - .02 || t > tout + .4) return;
    var k = cd(t, tin, 16), o = seg(t, tout, tout + .3);
    g.save(); g.globalAlpha *= fin(t, tin, .08) * (1 - o); g.translate(x, lerp(y - 180, y, k)); g.rotate(rot + sw(t, tin + .08, .08, 8, 3)); var s = .9 * kn(t, tin + .12, .06); g.scale(s, s);
    NOREC = k < .98 || o > 0; putW(g, pc, 0, 0); NOREC = false; put(g, P.pin, 0, -42); g.restore();
  }
  function worldTag(g, c, t, pc, wx, wy, tin, tout, rot) {
    if (t < tin - .02 || t > tout + .4) return;
    var k = cd(t, tin, 15), o = seg(t, tout, tout + .3), p = W2S(c, wx, wy - (1 - k) * 160);
    g.save(); g.globalAlpha *= fin(t, tin, .08) * (1 - o); g.translate(p[0], p[1]); g.rotate((rot || 0) + sw(t, tin + .08, .07, 8, 3)); g.scale(c.s, c.s);
    NOREC = k < .98 || o > 0 || camMoving(t); putW(g, pc, 0, 0); NOREC = false; put(g, P.pin, 0, -pc.h / 2 + 52);
    g.restore();
  }
  function shelfGlass(g, t, c, ph) {
    if (ph === 0) {
      /* hook: the title, GUESS, the hopping arrow (all part of frame 0's layout) */
      var to = sm(t, T.titleOut, .25);
      if (to < 1) {
        g.save(); g.globalAlpha *= 1 - to; g.translate(0, -to * 120);
        var tk = t < 0 ? 1 : 1;
        NOREC = to > 0;
        var wa = KIT.measure(g, 'WHICH ', 112, { wide: false }), wb = KIT.measure(g, 'GTA', 112, { wide: false }), x0 = 510 - (wa + wb) / 2;
        g.save(); g.translate(510, 470 + 3 * osc(t, 9)); g.rotate(-.03); g.translate(-510, 0);
        sk(g, 'WHICH', x0 + KIT.measure(g, 'WHICH', 112, { wide: false }) / 2, 0, 112, { col: CREAM }); sk(g, 'GTA', x0 + wa + wb / 2, 0, 112, { col: HOT });
        g.restore();
        sk(g, 'SOLD THE MOST?', 510, 590 + 3 * osc(t, 9, 1), 84, { col: CREAM, rot: -.03 });
        NOREC = false; g.restore();
        /* the hand-drawn arrow hops case to case: 1 → 2 → 3 */
        var hop = t < 0 ? 0 : clamp(t / .33, 0, 2.6), hi = Math.min(2, Math.floor(hop)), hf = eio(clamp((hop - hi) / .45, 0, 1)), ai = hi + (hi < 2 ? hf : 0);
        var ax = lerp(COLX[0], COLX[2], ai / 2), ab = BASE - PODH[0] * podK(t) - CH;
        var topW = lerp(lerp(BASE - PODH[0] - CH, BASE - PODH[1] - CH, clamp(ai, 0, 1)), BASE - PODH[2] - CH, clamp(ai - 1, 0, 1));
        var p = W2S(c, ax, topW - 30), lift = Math.sin(Math.PI * (ai % 1)) * 60;
        g.save(); g.globalAlpha *= 1 - to; KIT.arrow(g, p[0] - 70, p[1] - 150 - lift, p[0], p[1] - 14 - lift * .3, 1, CREAM, 10, -.35); g.restore();
        /* GUESS on "Guess." */
        if (t >= T.guess - .02 && t < T.guessOut + .3) { g.save(); KIT.slam(g, 'GUESS', 680, 735, 84, t - T.guess, { wide: false, col: HOT, ink: INK, rot: .06, out: T.guessOut - T.guess }); g.restore(); }
      }
      /* count: the ledger card and the LAST OFFICIAL COUNT stamp */
      if (t >= T.ledIn - .02 && t < T.ledOut + .6) {
        var lk = cd(t, T.ledIn, 12), lo = sm(t, T.ledOut, .3), ly = lerp(1800, 1010, lk) - lo * 1500;
        NOREC = lk < .98 || lo > 0; putW(g, P.ledger, 510, ly, -.015 + .006 * osc(t, 6)); NOREC = false;
        if (t >= T.stampC - .02) { var sk2 = cd(t, T.stampC, 30); g.save(); g.globalAlpha *= clamp((t - T.stampC) * 14, 0, 1); g.translate(540, ly + 60); g.rotate(-.07); g.scale(lerp(1.1, 1, sk2), lerp(1.1, 1, sk2)); NOREC = sk2 < .98 || lo > 0; putW(g, P.stampC, 0, 0); NOREC = false; g.restore(); }
      }
      /* three and two: rank badges, counters, year tiles, the scale chip */
      [0, 1, 2].forEach(function (i) {
        var top = BASE - val(i, t) * PXM - CH, p = W2S(c, COLX[i] - 62, top + 14);
        var nr0 = NOREC; NOREC = camMoving(t); badge(g, t, 3 - i, p[0], p[1], T['badge' + i], T['badgeOut' + i], Math.max(c.s / 1.5, .62)); NOREC = nr0;
      });
      /* the big rank number fills the sky between the case flip and the stack (it hands over to the counter) */
      [0, 1, 2].forEach(function (i) {
        var tin = T['badge' + i], tout = i < 2 ? T['g' + i + 'a'] + .3 : T.g2a + .1;
        if (t < tin - .02 || t > tout + .25) return;
        g.save(); g.globalAlpha *= 1 - seg(t, tout, tout + .2); KIT.slam(g, '#' + (3 - i), i === 2 ? 720 : 510, (i === 2 ? 660 : 720) + 6 * osc(t, 11), i === 2 ? 200 : 230, t - tin, { wide: false, col: HOT, ink: INK, rot: -.05, from: i === 2 ? 1.6 : 2.6 }); g.restore();
      });
      [0, 1].forEach(function (i) {
        var v = val(i, tq(t)), landed = tq(t) >= T['g' + i + 'b'], cin = T['g' + i + 'a'] + .4, a = fin(t, cin, .1) * (1 - seg(t, T['cOut' + i], T['cOut' + i] + .25));
        if (a > 0) counterCard(g, t, fmtM(v, i === 1), ['COPIES SOLD', i ? 'SEPT 2011 · ROCKSTAR' : 'JULY 2013 · TAKE-TWO'], 510, 680 - (1 - cd(t, cin, 14)) * 40, 1, a, landed, T['g' + i + 'b']);
        if (t >= T['g' + i + 'b'] && t < T['g' + i + 'b'] + .4) KIT.impact(g, 510, 680, t - T['g' + i + 'b'], .9, CREAM);
        /* year tile pinned to the counter card's right corner */
        tileAt(g, t, i ? P.y2011 : P.y2013, 772, 790, T['yr' + i], T['cOut' + i], .07);
      });
      chipAt(g, t, '1 SPINE = 2.5 MILLION', 400, 900, T.scaleIn, T.scaleOut, { px: 40, bg: TEAL });
      chipAt(g, t, '1 SPINE = 2.5 MILLION', 307, 870, T.full1, T.W1, { px: 40, bg: TEAL });
      chipAt(g, t, 'LAST OFFICIAL COUNT', 510, 1402, T.ledOut + .15, T.g2a - .1, { px: 36, bg: NEWS, fg: HOT });
      chipAt(g, t, 'LAST OFFICIAL COUNT', 307, 1402, T.full1 + .1, T.W1, { px: 36, bg: NEWS, fg: HOT });
      /* the gap: eight San Andreas stacks fit in the GTA 5 tower; then 8× THE 2011 #2 */
      for (var r8 = 1; r8 <= 8; r8++) {
        var ta = T.r8 + (r8 - 1) * .1; if (t < ta) break;
        var ra = fin(t, ta, .08) * (1 - seg(t, T.W1 - .05, T.W1)), pl = W2S(c, COLX[2] - 112, BASE - r8 * 27.5 * PXM), pr = W2S(c, COLX[2] + 112, BASE - r8 * 27.5 * PXM);
        g.save(); g.globalAlpha *= ra; g.strokeStyle = CREAM; g.lineWidth = 5; g.setLineDash([14, 10]); g.beginPath(); g.moveTo(pl[0], pl[1]); g.lineTo(pr[0] + 14, pr[1]); g.stroke(); g.setLineDash([]);
        NOREC = camMoving(t) || ra < 1; var lk8 = kn(t, ta, .12); g.translate(pr[0] + 62, pr[1]); g.scale(lk8, lk8); sk(g, r8 + '×', 0, 0, 40, { col: r8 === 8 ? HOT : CREAM }); NOREC = false; g.restore();
      }
      if (t >= T.x8 - .02) { g.save(); g.globalAlpha *= 1 - seg(t, T.W1 - .05, T.W1); KIT.slam(g, '8×', 307, 420, 150, t - T.x8, { wide: false, col: HOT, ink: INK, rot: -.05 }); KIT.slam(g, 'THE 2011 #2', 307, 520, 56, t - T.x8 - .12, { wide: false, col: CREAM, ink: INK, rot: -.03 }); g.restore(); }
      /* champ and on: compact tags above the short stacks */
      worldTag(g, c, t, P.t4, COLX[0], BASE - val(0, t) * PXM - CH - 120, T.ct0, T.W1, -.03);
      worldTag(g, c, t, P.tSA, COLX[1], BASE - val(1, t) * PXM - CH - 170 + 50 * sm(t, T.crownOff, .4), T.ct1, T.W1, .03);
      /* one: the hero counter */
      if (t >= T.g2a + .13) {
        var v2 = val(2, tq(t)), landed = tq(t) >= T.g2b, mv = sm(t, T.full0, T.full1 - T.full0);
        var cx = 307, cy = lerp(1210, 690, mv), cs = .7;
        counterCard(g, t, fmtM(v2) + (landed ? '+' : ''), ['SOLD-IN · TAKE-TWO', 'AUG 2026'], cx, cy, cs, fin(t, T.g2a + .15, .1), landed, T.g2b);
        if (t >= T.g2b && t < T.g2b + .5) { var bu = t - T.g2b; g.save(); g.globalAlpha *= 1 - seg(bu, .3, .5); KIT.impact(g, 307, 1210, bu, 1.1, CREAM); g.restore(); }
      }
    } else if (ph === 3) {
      chipAt(g, t, 'GTA 5', 818, 640, T.W3 + .05, T.endSink, { px: 56, bg: HOT });
      chipAt(g, t, '230M+', 818, 722, T.W3 + .12, T.endSink, { px: 56, bg: CREAM });
      chipAt(g, t, 'AUG 2026', 818, 796, T.W3 + .2, T.endSink, { px: 40, bg: ORG });
      chipAt(g, t, 'GTA 6 · NOV 19 2026', 305, 740, T.W3 + .05, T.endSink, { px: 44, bg: HOT });
      /* end: identical YES and NO tags above the GTA 6 case */
      [[P.yes, 200, T.kYes], [P.no, 410, T.kNo]].forEach(function (q, i) {
        var tin = T.vote, x = q[1], y = 900;
        if (t < tin - .02) return;
        var k = cd(t, tin, 15), out = sm(t, T.endSink, .3), w2 = (q[0].w - 72) / 2;
        var yy = lerp(y - 220, y, k) - out * 200, rot = (i ? .02 : -.02) + sw(t, tin + .08, .08, 8, 2.8) + sw(t, q[2], .05, 10, 3), s = kn(t, q[2], .08);
        g.save(); g.globalAlpha *= fin(t, tin, .08) * (1 - out); g.translate(x - w2 + 22, yy); g.rotate(rot); g.scale(s, s); g.translate(w2 - 22, 0);
        NOREC = k < .98 || out > 0; putW(g, q[0], 0, 0); NOREC = false; put(g, P.pin, -w2 + 22, 0); g.restore();
      });
    }
  }
  /* the pie (phase 1): ALL GTA ≈ 475M; the GTA 5 slice slides out on "half"; a dashed line marks exactly half */
  function pie(g, t) {
    var k = cd(t, T.W1 - .05, 11), cx = 510, cy = 1005 + (1 - k) * 700, sl = sm(t, T.slice, .35);
    var A0 = P.pieA0, A1 = P.pieA1, bis = (A0 + A1) / 2, R = P.pieR, spin = (1 - k) * .5 + .02 * osc(t, 3);
    g.save(); g.translate(cx, cy); g.rotate(spin);
    put(g, P.pieRest, 0, 0);
    g.save(); g.translate(Math.cos(bis) * 46 * sl, Math.sin(bis) * 46 * sl); put(g, P.pieSlice, 0, 0);
    var lx = Math.cos(bis) * R * .52, ly = Math.sin(bis) * R * .52;
    g.save(); g.translate(lx, ly); g.rotate(-spin); NOREC = k < .98 || sl > 0 && sl < 1; sk(g, 'GTA 5', 0, -34, 70, { col: CREAM }); sk(g, '230M+', 0, 36, 60, { col: CREAM }); NOREC = false; g.restore();
    g.restore();
    /* the exact half: a dashed cream line straight down the middle */
    var dk = sm(t, T.slice + .25, .35);
    if (dk > 0) { g.save(); g.rotate(-spin); var bk = kn(t, T.ever, .12); g.scale(bk, bk); g.strokeStyle = CREAM; g.lineWidth = 7; g.setLineDash([16, 14]); g.lineCap = 'round'; g.beginPath(); g.moveTo(0, -R - 14); g.lineTo(0, -R - 14 + (2 * R + 40) * dk); g.stroke(); g.setLineDash([]);
      if (dk > .9) { NOREC = false; sk(g, '1/2', -58, -R + 30, 44, { col: CREAM }); } g.restore(); }
    var olx = Math.cos(bis + Math.PI) * R * .46, oly = Math.sin(bis + Math.PI) * R * .5;
    g.save(); g.translate(olx, oly); g.rotate(-spin); NOREC = k < .98; sk(g, 'EVERY', 0, -26, 42, { col: INK, lw: 0, shadow: false }); sk(g, 'OTHER GTA', 0, 22, 42, { col: INK, lw: 0, shadow: false });
    if (t >= T.u245) { var un = Math.round(245 * eio(seg(tq(t), T.u245, T.u245 + .35))); NOREC = tq(t) < T.u245 + .35; g.save(); g.translate(0, 80); var uk = kn(t, T.u245 + .35, .1); g.scale(uk, uk); sk(g, 'UNDER ' + un + 'M', 0, 0, 44, { col: CREAM }); g.restore(); }
    NOREC = false; g.restore();
    g.restore();
    chipAt(g, t, 'ALL GTA ≈ 475M', 510, 600, T.W1 + .1, T.W2 + .2, { px: 60, bg: CREAM });
    chipAt(g, t, 'SOLD-IN · AUG 2026', 510, 672, T.W1 + .45, T.W2 + .2, { px: 40, bg: ORG });
    if (t >= T.slice + .1) { g.save(); KIT.slam(g, 'ALMOST HALF', 510, 1350, 80, t - T.slice - .1, { wide: false, col: HOT, ink: INK, rot: -.03, from: 1.2 }); g.restore(); }
  }
  /* the calendar (phase 2): NOV 19 2026 tears on, GTA 6 pill, platforms */
  function calendar(g, t) {
    var k = cd(t, T.W2 - .05, 12), x = 510, y = 940 + (1 - k) * 800, s = 1.55 * kn(t, T.kNov, .04), rot = -.02 + .012 * osc(t, 5) + (1 - k) * .2;
    g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s);
    put(g, P.padBack, 0, 0);
    var tk = seg(t, T.tearCal, T.tearCal + .45), PH2 = (P.PAD_H - 70) / 2;
    NOREC = k < .98; putW(g, P.nov19, 0, 26); NOREC = false;
    if (tk < 1) { g.save(); g.translate(0, 26 - PH2); g.translate(-40 * tk, -1300 * tk * tk); g.rotate(-.35 * tk); g.globalAlpha *= 1 - seg(tk, .7, 1); NOREC = true; putW(g, P.blankPg, 0, PH2); NOREC = false; g.restore(); }
    put(g, P.binding, 0, 0);
    g.restore();
    var pk = cd(t, T.pill6, 15);
    if (t >= T.pill6 - .02) { g.save(); g.translate(510, 615 - (1 - pk) * 60); var ps = 1.2 * kn(t, T.pill6 + .05, .06); g.scale(ps, ps); g.globalAlpha *= fin(t, T.pill6, .08); NOREC = pk < .98; putW(g, P.pill6, 0, 0); NOREC = false; g.restore(); }
    chipAt(g, t, 'PS5', 290, 1375, T.plat, T.W3 + .3, { px: 52, bg: TEAL, rot: -.03 });
    chipAt(g, t, 'XBOX SERIES X|S', 630, 1375, T.platX, T.W3 + .3, { px: 52, bg: TEAL, rot: .02 });
    if (t >= T.k19) { g.save(); g.globalAlpha *= 1 - seg(t, T.W3 - .1, T.W3); KIT.scribble(g, 510, 990, 165, 120, eio(seg(t, T.k19, T.k19 + .35)), HOT, 11, 3); g.restore(); }
    if (t >= T.kNov && t < T.kNov + .5) KIT.impact(g, 700, 760, t - T.kNov, .6, CREAM);
  }
  /* a paper wipe: a torn pink band crossing the rail bottom to top, centred on tm */
  function wipe(g, t, tm) {
    var k = seg(t, tm - .28, tm + .28); if (k <= 0 || k >= 1) return;
    var y = lerp(1500, -1650, eio(k));
    g.save(); g.translate(-10, y); g.rotate(-.04); put(g, P.band, 0, 0); g.restore();
  }

  /* ---------- background life: spotlights and paper flecks, periodic in the film's length ---------- */
  function bgLife(g, t) {
    if (!LIVE2.bg) return;
    [[230, .9, 0], [850, -.9, 2.1]].forEach(function (L) {
      var s0 = t < DUR / 2 ? t : t - DUR, e = s0 > 0 ? Math.sin(Math.PI * clamp(s0 / 1.2, 0, 1)) : 0;
      var a = L[1] * (.28 + .2 * osc(t, 7, L[2])) + .05 * osc(t, 13, L[2]) - L[1] * .26 * e;
      g.save(); g.translate(L[0], -40); g.rotate(a); g.globalAlpha = .1; g.fillStyle = '#fff3d6';
      g.beginPath(); g.moveTo(-30, 0); g.lineTo(30, 0); g.lineTo(260, 1500); g.lineTo(-260, 1500); g.closePath(); g.fill(); g.restore();
    });
    FLECK.forEach(function (f) {
      var y = ((f.y + 1500 * f.sp * t / DUR) % 1500) - 40, x = f.x + f.dx * osc(t, 3 * f.sp, f.ph);
      g.save(); g.translate(x, y); g.rotate(TAU * f.rs * t / DUR + f.ph); g.scale(1, Math.cos(TAU * 5 * f.sp * t / DUR + f.ph)); g.globalAlpha = .55; g.fillStyle = f.col; g.fillRect(-f.w / 2, -f.w * .3, f.w, f.w * .6); g.restore();
    });
  }

  /* ---------- captions (the voice, phrase by phrase; the hook line is carried by the picture) ---------- */
  var GLUE = { the: 1, a: 1, an: 1, your: 1, its: 1, of: 1, at: 1, to: 1, and: 1, in: 1, with: 1, on: 1, by: 1, so: 1, for: 1, own: 1, how: 1, that: 1, if: 1, you: 1, no: 1, or: 1, it: 1 };
  var CAPS = (function () {
    var outc = [];
    VO.lines.forEach(function (l) {
      if (l.id === 'hook' || l.id === 'asof') return;
      var cur = [], ws = l.words.slice();
      ws.forEach(function (w, i) { cur.push(w); if (/[.?!:]$/.test(w.w) && i < ws.length - 1) { outc.push(cur); cur = []; } });
      if (cur.length) outc.push(cur);
    });
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
  var CAPY = 440;
  function captions(g, t) {
    var card0 = null, ci = -1;
    CAPS.forEach(function (c, i) { if (t >= c.t0 - .04) { card0 = c; ci = i; } });
    if (!card0) return;
    var nx = CAPS[ci + 1], ns = nx ? nx.t0 - .04 : 1e9, o1 = Math.min(card0.t1 + .5, ns - .12), o0 = Math.min(card0.t1 + .35, o1 - .12);
    var fi = seg(t, card0.t0 - .04, card0.t0 + .06), outk = 1 - seg(t, o0, o1);
    if (fi * outk <= 0) return;
    var CY = CAPY, k = cd(t, card0.t0 - .04, 16);
    g.save(); cond(g); var cpx = 74; font(g, cpx, 900); ls(g, 1); g.textBaseline = 'alphabetic';
    var words = card0.words, up = words.map(function (w) { return w.w.toUpperCase(); }), ws = up.map(function (u) { return g.measureText(u).width; }), gap = cpx * .26;
    var lines, lw, maxw = t >= T.W3 ? 410 : 720, CXc = t >= T.W3 ? 305 : CX;
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
      var tw = lw[li] - gap, x = CXc - tw / 2, y = y0 + li * lh + (1 - k) * 30, seed = Math.round(card0.t0 * 100) + li * 7;
      var r = mulberry(seed), x0 = x - 22, x1 = x + tw + 22, yt = y - cpx * .86, yb = y + cpx * .24, rot = (r() - .5) * .025;
      g.save(); g.translate(CXc, y); g.rotate(rot); g.translate(-CXc, -y);
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

  var NOISE, POSTERMODE = false, VIG = null;
  function stage(g) { g.fillStyle = BG; g.fillRect(0, 0, W, H); }
  function vignette(g) {
    if (!VIG) { VIG = mk(W, H); var q = VIG.getContext('2d'), gr = q.createRadialGradient(510, 880, 460, 510, 900, 1250); gr.addColorStop(0, 'rgba(6,3,18,0)'); gr.addColorStop(1, 'rgba(6,3,18,.45)'); q.fillStyle = gr; q.fillRect(0, 0, W, H); }
    g.drawImage(VIG, 0, 0);
  }
  function railClip(g) { g.beginPath(); if (LIVE2.clip) g.rect(BX0, 0, BX1 - BX0, BY1); else g.rect(-500, -500, 2080, BY1 + 500); g.clip(); }
  function frame(g, t) {
    g.setTransform(1, 0, 0, 1, 0, 0);
    stage(g);
    if (LIVE2.bg) put(g, P.wall, 0, 0);
    bgLife(g, t);
    var ph = phase(t), tt = ph === 4 ? t - DUR : t, wph = ph === 4 ? 0 : ph;
    if (wph === 0 || wph === 3) {
      /* the shelf bleeds (background); everything standing on it is clipped to the rail */
      if (LIVE2.bg) { g.save(); var c = camAt(tt); g.translate(510, AY); g.scale(c.s, c.s); g.translate(-c.x, -c.y);
      /* the shelf: teal paper with a cream lip */
      g.fillStyle = SHELF; g.fillRect(c.x - 3000, BASE, 6000, 3000);
      var dg = g.createLinearGradient(0, BASE, 0, BASE + 500); dg.addColorStop(0, 'rgba(0,0,0,0)'); dg.addColorStop(1, 'rgba(0,0,0,.4)'); g.fillStyle = dg; g.fillRect(c.x - 3000, BASE, 6000, 500); g.fillStyle = 'rgba(0,0,0,.4)'; g.fillRect(c.x - 3000, BASE + 500, 6000, 3000);
      g.fillStyle = CREAM; g.fillRect(c.x - 3000, BASE - 4, 6000, 10); g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(c.x - 3000, BASE + 6, 6000, 8);
      g.save(); g.globalAlpha = .55; g.fillStyle = g.createPattern(GRAIN, 'repeat'); g.fillRect(c.x - 3000, BASE, 6000, 800); g.restore();
      g.restore(); }
      g.save(); railClip(g); var c = world(g, tt, wph); g.restore();
      /* while the camera follows the eruption up, the shelf drops below the rail: a shelf front at the rail edge, so the tower
         stands behind a ledge instead of being cut by an invisible line (it meets the real shelf edge as that comes back up) */
      var shY = AY + (BASE - c.y) * c.s;
      if (LIVE2.bg && shY > BY1) {
        g.fillStyle = SHELF; g.fillRect(0, BY1, W, H - BY1);
        var fg = g.createLinearGradient(0, BY1, 0, H); fg.addColorStop(0, 'rgba(0,0,0,0)'); fg.addColorStop(1, 'rgba(0,0,0,.45)'); g.fillStyle = fg; g.fillRect(0, BY1, W, H - BY1);
        g.fillStyle = CREAM; g.fillRect(0, BY1 - 4, W, 10); g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(0, BY1 + 6, W, 8);
        g.save(); g.globalAlpha = .55; g.fillStyle = g.createPattern(GRAIN, 'repeat'); g.fillRect(0, BY1, W, H - BY1); g.restore();
      }
      if (LIVE2.bg) vignette(g);
      g.save(); railClip(g); shelfGlass(g, tt, c, wph); g.restore();
    } else {
      if (LIVE2.bg) vignette(g);
      g.save(); railClip(g); if (wph === 1) pie(g, t); else calendar(g, t); g.restore();
    }
    g.save(); railClip(g); wipe(g, t, T.W1); wipe(g, t, T.W2); wipe(g, t, T.W3); wipe(g, t, T.W4); g.restore();
    if (!POSTERMODE && LIVE.text) captions(g, t);
    if (LIVE.grain && NOISE && LIVE2.bg) { g.globalAlpha = .05; g.globalCompositeOperation = 'overlay'; var o = Math.floor(t * 24) * 37 % 256; g.fillStyle = g.createPattern(NOISE, 'repeat'); g.translate(-o, -o); g.fillRect(o, o, W, H); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }
  }
  function TEXTS(t) {
    var o = [];
    function Tx(id, text, a, b) { if (t >= a && t < b) o.push({ id: id, text: text, x0: 0, y0: 0, x1: 0, y1: 0 }); }
    Tx('title', 'WHICH GTA SOLD THE MOST?', 0, T.titleOut + .05); Tx('title', 'WHICH GTA SOLD THE MOST?', T.W4, DUR + 1);
    Tx('guess', 'GUESS', T.guess + .05, T.guessOut + .05);
    Tx('ledger', 'BEST-SELLING GTA', T.ledIn + .2, T.ledOut + .05);
    Tx('stampC', 'LAST OFFICIAL COUNT', T.stampC + .05, T.ledOut + .05); Tx('stampC', 'LAST OFFICIAL COUNT', T.ledOut + .25, T.g2a - .1);
    Tx('c4', 'GTA 4', T.flip0 + .2, T.W1); Tx('cSA', 'SAN ANDREAS', T.flip1 + .2, T.W1); Tx('c5', 'GTA 5', T.flip2 + .2, T.W1); Tx('c5', 'GTA 5', T.W3, T.endSink);
    Tx('n25', '25,000,000', T.g0b, T.cOut0 + .05); Tx('cs25', 'COPIES SOLD', T.g0b + .15, T.cOut0 + .05); Tx('d25', 'JULY 2013 · TAKE-TWO', T.g0b + .25, T.cOut0 + .05);
    Tx('n275', '27,500,000', T.g1b, T.cOut1 + .05); Tx('cs275', 'COPIES SOLD', T.g1b + .15, T.cOut1 + .05); Tx('d275', 'SEPT 2011 · ROCKSTAR', T.g1b + .25, T.cOut1 + .05);
    Tx('y13', '2013', T.yr0 + .1, T.cOut0 + .05); Tx('y11', '2011', T.yr1 + .1, T.cOut1 + .05);
Tx('r3', '#3', T.badge0 + .1, T.g0a + .35); Tx('r2', '#2', T.badge1 + .1, T.g1a + .35); Tx('r1', '#1', T.badge2 + .1, T.g2a + .15);
    Tx('scale', '1 SPINE = 2.5 MILLION', T.scaleIn + .1, T.scaleOut + .05); Tx('scale', '1 SPINE = 2.5 MILLION', T.full1 + .1, T.W1);
    Tx('x8', '8× THE 2011 #2', T.x8 + .15, T.W1);
    Tx('t4', '25M 2013', T.ct0 + .15, T.W1); Tx('tSA', '27.5M 2011', T.ct1 + .15, T.W1);
    Tx('n230', '230,000,000+', T.g2b, T.W1); Tx('d230', 'SOLD-IN · TAKE-TWO AUG 2026', T.g2b + .2, T.W1);
    Tx('pieH', 'ALL GTA ≈ 475M', T.W1 + .2, T.W2); Tx('pieS', 'SOLD-IN · AUG 2026', T.W1 + .55, T.W2); Tx('u245', 'UNDER 245M', T.u245 + .35, T.W2); Tx('slice', 'GTA 5 230M+', T.W1 + .2, T.W2); Tx('half', 'ALMOST HALF', T.slice + .2, T.W2);
    Tx('nov', 'NOV 19 2026', T.W2 + .2, T.W3); Tx('pill6', 'GTA 6', T.pill6 + .1, T.W3); Tx('ps5', 'PS5', T.plat + .15, T.W3); Tx('xbox', 'XBOX SERIES X|S', T.platX + .15, T.W3);
    Tx('c6', 'GTA 6 ?', T.c6In + .2, T.endSink); Tx('yes', 'YES', T.vote + .2, T.endSink + .05); Tx('no', 'NO', T.vote + .2, T.endSink + .05);
    Tx('e230', '230M+', T.W3 + .2, T.endSink); Tx('e5', 'GTA 5', T.W3 + .15, T.endSink); Tx('eaug', 'AUG 2026', T.W3 + .3, T.endSink); Tx('e6', 'GTA 6 · NOV 19 2026', T.W3 + .1, T.endSink);
    return o;
  }

  /* ---------- times, camera keys and sound events, all from the voice ---------- */
  function initTimes() {
    var c0 = { x: 490, y: 954, s: 1.2 };
    T.guess = at('hook', 'guess'); T.guessOut = T.guess + 1.9;
    T.titleOut = 2.55;
    T.podIn = start('count') - .35;
    G('podS', T.podIn, 'swish', .35, .8);
    G('pop0', .02, 'pop', .05, .7);
    T.ledIn = at('count', 'best-selling') - .1;
    T.hopC = at('count', 'games'); T.stampC = at('count', 'last');
    T.ledOut = start('three') - .65;
    /* three: #3 badge as the ledger leaves, the case flips on "GTA 4", ten spines on "25", the 2013 tile on "2013" */
    T.badge0 = T.ledOut + .2; T.flip0 = at('three', 'gta') - .05; T.land0 = -9;
    G('badgeS', at('three', 'three') - .25, 'tick', .25, .8);
    T.g0a = wend('three', '4') + .04; T.g0b = Math.round((T.g0a + .55) * 30) / 30;
    T.yr0 = at('three', 'copies');
    T.knock0 = G('scaleS', after('three'), 'thock', .3, 1); T.scaleIn = T.g0b + .2; T.scaleOut = start('two') + 1.6;
    T.cOut0 = start('two') - .22;
    /* two */
    T.badge1 = Math.max(at('two', 'number') + .05, T.cOut0 + .3); T.flip1 = at('two', 'san') - .05;
    T.g1a = wend('two', 'andreas') + .3; T.g1b = Math.round((T.g1a + .55) * 30) / 30;
    T.yr1 = at('two', '2011');
    var aTwo = G('yr1S', after('two'), 'thock', .3, 1);
    T.cOut1 = start('champ') + .9;
    /* champ: pull back, compact tags, the crown */
    T.ct0 = T.cOut1 + .05; T.ct1 = T.cOut1 + .2;
    T.crownIn = at('champ', 'rockstar') - .05;
    /* one */
    T.crownOff = start('one') - .12;
    G('crownS', T.crownOff - .05, 'pop', .3, .9);
    T.badge2 = at('one', 'one') - .05;
    T.flip2 = at('one', 'gta') - .05;
    T.g2a = at('one', 'over') - .05; T.g2b = Math.round(Math.max(wend('one', 'million') + .02, T.g2a + 1.1) * 30) / 30;
    G('rise', T.g2a - .1, 'rise', .25, 1, { m: .05, dur: .16 });
    G('hero', T.g2b + .2, 'stamp', .4, 1.2, { heavy: true });
    T.knock2 = T.g2b;
    T.full0 = Math.max(T.g2b + 1.0, start('asof') - .1); T.full1 = T.full0 + .9;
    T.r8 = T.full0 + .4; T.x8 = T.r8 + .9;
    /* wipes */
    T.W1 = start('half') - .2;
    T.badgeOut0 = T.badgeOut1 = T.badgeOut2 = T.W1;
    G('w1', T.W1 - .3, 'swish', .3, .9);
    T.slice = at('half', 'half') - .05; T.u245 = at('half', 'almost'); T.ever = at('half', 'ever');
    T.W2 = (lastw('half') + start('six')) / 2 + .02;
    G('w2', T.W2 - .1, 'tear', .3, .9);
    T.tearCal = T.W2 + .25; T.kNov = at('six', 'november'); T.pill6 = at('six', 'gta'); T.plat = T.W2 + .2; T.platX = at('six', '6') + .15; T.k19 = at('six', '19th');
    T.W3 = start('end') - .12;
    G('w3', T.W3 - .1, 'tick', .3, .9);
    T.c6In = T.W3 + .05; T.vote = T.c6In + .4; T.kYes = at('end', 'yes'); T.kNo = at('end', 'no');
    T.W4 = DUR - .3; T.endSink = T.W4 - .4;
    G('w4', T.W4 - .25, 'swish', .3, .8);
    /* camera keys: frame 0 → count overview → GTA 4 → San Andreas → both + crown → GTA 5 → follow the eruption → full view */
    function follow(t) { var top = BASE - val(2, t) * PXM - CH; return top + CH / 2 + (865 - 780) / .95; }
    CAMS = [c0,
      { t0: T.podIn, t1: T.podIn + .7, x: 490, y: 880, s: 1.0 },
      { t0: start('three') - .35, t1: start('three') + .35, x: 470, y: 919, s: 1.08 },
      { t0: start('two') - .3, t1: start('two') + .4, x: 500, y: 919, s: 1.08 },
      { t0: aTwo - .1, t1: aTwo + .6, x: 490, y: 885, s: 1.0 },
      { t0: start('one') - .1, t1: start('one') + .6, x: 590, y: 1085, s: .95 },
      { t0: T.g2a - .1, t1: T.g2a + .35, x: 590, y: follow, s: .95 },
      { t0: T.full0, t1: T.full1, x: 560, y: 717, s: .76 },
      { t0: T.W3 - .3, t1: T.W3, x: 560, y: 717, s: .76 },
      { t0: T.W4 - .02, t1: T.W4, x: c0.x, y: c0.y, s: c0.s }];
    STRESS = [['three', 'three'], ['three', '25'], ['two', 'two'], ['two', '27.5'], ['one', 'one'], ['one', '230'], ['half', 'half'], ['six', 'november']].map(function (p) { return at(p[0], p[1]); });
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
    function stamp(t, g, heavy) { tick(t, 1.6 * g, 2400); thump(t, .7 * g); if (heavy) { boom(t + .01, .6 * g, 110, 38, .62); band(t, t + .5, 900, 200, .12 * g, .02 * g, .7, 0, 'lowpass'); } var sn = noise(t, .12), sl = ac.createBiquadFilter(); sl.type = 'lowpass'; sl.frequency.value = 1500; var so = bus(1); sn.connect(sl); sl.connect(so); env(so.gain, [[t, 0], [t + .004, .32 * g], [t + .1, 0]]); }
    function swish(t, g) { band(t, t + .26, 600, 3600, .09 * g, .02 * g, 1.3, -.2); }
    function tear(t, g) { for (var j = 0; j < 8; j++) tick(t + .012 * j + rnd() * .006, (.35 + rnd() * .4) * g, 1800 + rnd() * 2400); band(t, t + .1, 1400, 4200, .07 * g, .02 * g, 1.4, .15); }
    function thock(t, g) { thump(t, .35 * g, 220); tick(t, .9 * g, 1800); }
    function pop(t, g) { thump(t, .3 * g, 320); tick(t, 1.1 * g, 2600); band(t, t + .06, 2400, 1200, .06 * g, .01 * g, 1.2); }
    var LEVEL = { stamp: 1, swish: 14, tick: 2.4, tear: 9, thock: 2, pop: 4.6, rise: 7 };
    var TRIM = window.SFX_TRIM || {};
    EV.forEach(function (e) {
      var g = (e.g == null ? 1 : e.g) * (LEVEL[e.type] || 1) * Math.pow(10, (TRIM[e.id] || 0) / 20);
      if (e.type === 'stamp') stamp(e.t, g, e.heavy);
      else if (e.type === 'swish') swish(e.t, g);
      else if (e.type === 'tear') tear(e.t, g);
      else if (e.type === 'thock') thock(e.t, g);
      else if (e.type === 'pop') pop(e.t, g);
      else if (e.type === 'rise') { band(e.t, e.t + e.dur, 500, 4200, .12 * g, .06 * g, 1.1, .1); for (var j = 0; j < 8; j++) tick(e.t + j * .018, .5 * g, 2600); }
      else if (e.type === 'tick') { tick(e.t, 1.2 * g, 2200); thump(e.t, .12 * g, 400); }
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

  window.FILM = { bare: function () { ctx.setTransform(1, 0, 0, 1, 0, 0); stage(ctx); }, W: W, H: H, DUR: DUR, POSTER: 0, SLUG: 'gta-ranked', SHOTS: [], init: init, render: render, frame: frame, LIVE: LIVE, LIVE2: LIVE2, T: T, GT: GT };
  var _bt = buildTextures; buildTextures = function () { _bt(); EV.length = 0; initTimes(); window.FILM.POSTER = Math.round((T.W1 - .4) * 30) / 30 + 1 / 60;
    window.FILM.SHOTS = [{ id: 'hook', name: 'Which GTA?', t0: 0, t1: start('three') }, { id: 'rank', name: '3, 2, 1', t0: start('three'), t1: T.W1 }, { id: 'half', name: 'Almost half', t0: T.W1, t1: T.W2 }, { id: 'six', name: 'GTA 6', t0: T.W2, t1: T.W3 }, { id: 'vote', name: 'Yes or no?', t0: T.W3, t1: DUR }]; };
  window.BOUNDS_RUN = function (step) {
    BOUNDS = []; var o = {};
    for (var t = 0; t <= DUR + 1e-6; t += step || 1 / 15) { CURT = t; POSTERMODE = false; frame(ctx, t); }
    BOUNDS.forEach(function (b) { var r = o[b.text] || (o[b.text] = { text: b.text, from: b.t, to: b.t, x0: b.x0, x1: b.x1, y1: b.y1, n: 0 }); r.to = b.t; r.n++; r.x0 = Math.min(r.x0, b.x0); r.x1 = Math.max(r.x1, b.x1); r.y1 = Math.max(r.y1, b.y1); });
    BOUNDS = null; return Object.keys(o).map(function (k) { return o[k]; });
  };
  /* rail scan: with the bleed wall/shelf off and no clip, every shape and glyph must stay inside x 90-930 and above y 1450 */
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
