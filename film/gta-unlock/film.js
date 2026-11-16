/* "GTA 6 Starts in New Zealand": Delta, pillar 6 (practical and launch week).
   A vertical film written in code, narrated first and cut to the voice: every beat is keyed to a word time from
   vo/vo.js with at(id, word). Pure function of t. Contract: window.FILM, DUR, render(t), READY, EV, TEXTS(t), SCORE(ctx).
   The native move is the midnight line: a torn sheet of night paper sliding west along a cut-paper world ribbon, the
   camera riding its edge, each city's flip clock clacking to 12:00 as it crosses. Facts: PlayStation Store listings per
   region and PlayStation's GTA VI support page, read 2026-11-16 (BRIEF.md). Engine from film/gta-preload.
   Our own drawings only: no footage, logos, key art, map outlines or landmarks; no music. */
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
    free(m || (window.VAD ? .08 : .2)).forEach(function (f) {
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
  var BOUNDS = null, NOREC = false, CLIPW = false, CURT = 0, SAFE = { x0: 90, x1: 930, y1: 1450 };
  function recBox(g, x0, y0, x1, y1, text) {
    if (!BOUNDS || NOREC || (g !== ctx && g !== tctx) || g.globalAlpha < .05) return;
    /* the world layer is clipped to the rail: a glyph sliding past the edge during a camera glide is cut, never shown outside */
    if (CLIPW && T.camMoving) return;
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

  BODY.scrape = .4; BODY.ting = .22; BODY.crack = .25; BODY.whoosh = .45; BODY.brush = .34; BODY.flap = .14; BODY.pop = .1; BODY.thock = .12; BODY.swish = .26; BODY.clank = .3;
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


  /* =====================================================================================================
     THE WORLD. One long cut-paper ribbon of land and sea, laid out by time: 400 px per hour west of New Zealand
     (Sydney +2 h, Tokyo +4 h, London +13 h, New York +18 h, LA +21 h to its own midnight). A torn sheet of night
     paper covers everything east of the midnight line; the camera rides its edge. Each city has a paper flip clock;
     it clacks to 12:00 when the edge crosses it. An orange tape measures the hours since New Zealand.
     Our own drawings only: no map outlines, landmarks, logos or key art.
     ===================================================================================================== */
  var GREY = '#8d8aa0', DEEP = '#2a1850', CARD = '#2e1f55', NIGHT = '#0b0d28';
  function hash(i) { var x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
  function tq(t) { return (Math.floor(t * 30) + .5) / 30; }
  function sm(t, a, d) { return eio(seg(t, a, a + (d || .5))); }
  var T = {}, LIVE2 = { bg: true, clip: true };
  function circle(g, x, y, r) { g.beginPath(); g.arc(x, y, r, 0, TAU); }
  function wordsOf(pc, rec) { pc.words = rec.map(function (r0) { return [r0[0] - pc.x0, r0[1] - pc.y0, r0[2] - pc.x0, r0[3] - pc.y0, r0[4]]; }); return pc; }
  function mixc(a, b, k) { var pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16), r = Math.round(lerp(pa >> 16, pb >> 16, k)), gg = Math.round(lerp(pa >> 8 & 255, pb >> 8 & 255, k)), bb = Math.round(lerp(pa & 255, pb & 255, k)); return 'rgb(' + r + ',' + gg + ',' + bb + ')'; }
  BODY.clack = .12; BODY.whoosh = .45; BODY.slap = .14; BODY.stamp = .27; BODY.ratchet = .4; BODY.thock = .12; BODY.pop = .1; BODY.swish = .26;

  var HPX = 400, AY = 780;
  var CITIES = [
    { id: 'akl', name: 'NEW ZEALAND', code: 'NZ', h: 0, tape: '' },
    { id: 'syd', name: 'SYDNEY', code: 'SYD', h: 2, tape: '+2 H AFTER NZ' },
    { id: 'tyo', name: 'TOKYO', code: 'TYO', h: 4, tape: '+4 H AFTER NZ' },
    { id: 'in', name: 'INDIA', code: 'IN', h: 7.5, tape: '', minor: 1 },
    { id: 'ae', name: 'UAE', code: 'AE', h: 9, tape: '', minor: 1 },
    { id: 'za', name: 'SOUTH AFRICA', code: 'ZA', h: 11, tape: '', minor: 1 },
    { id: 'lon', name: 'LONDON', code: 'LON', h: 13, tape: '+13 H AFTER NZ' },
    { id: 'br', name: 'BRAZIL', code: 'BR', h: 16, tape: '', minor: 1 },
    { id: 'nyc', name: 'NEW YORK', code: 'NY', h: 18, tape: '+18 H AFTER NZ' },
    { id: 'la', name: 'LOS ANGELES', code: 'LA', h: 21, tape: '' }];
  var CI = {}; CITIES.forEach(function (c) { c.x = -c.h * HPX; CI[c.id] = c; });

  /* ---------- camera and the midnight line: eased moves keyed to the voice ---------- */
  var MV = [], EM = [];
  function track(list, t, base) {
    var c = { x: base.x, z: base.z };
    for (var i = 0; i < list.length; i++) {
      var m = list[i]; if (t <= m.t) break;
      var k = (m.ease || eio)(seg(t, m.t, m.t + m.d)), px = c.x, pz = c.z;
      c.x = lerp(px, m.x, k); if (m.z != null) c.z = lerp(pz, m.z, k) * (1 - (m.dip || 0) * Math.sin(Math.PI * k));
      if (k < 1) { if (m.dip) c.z = Math.max(.06, c.z); break; }
    }
    return c;
  }
  function cam(t) {
    var c = track(MV, t, { x: 0, z: 1 });
    /* a slow push on frame 0's hold and a breath, both periodic, so nothing is ever parked */
    c.z *= (1 + .035 * sm(t, 0, 2.3) * (1 - sm(t, T.zoom1 || 9, .3))) * (1 + .008 * osc(t, 7, .3));
    c.x += 10 * osc(t, 5, 1.1);
    return c;
  }
  function edgeAt(t) {
    if (t < 1) { if (t < 0) return 250 + 3800 * -t; return 250 - 550 * eo(t / 1.0); }
    return track(EM, t, { x: -300 + 550 * Math.pow(2, -10) }).x;
  }
  var C = { x: 0, z: 1 };
  function sx(wx) { return 510 + (wx - C.x) * C.z; }

  /* ---------- clocks: state from where the line is (east of it = midnight has come) ---------- */
  var CROSS = {};
  function buildCross() {
    CITIES.forEach(function (c) {
      var L = [], prev = edgeAt(-.4) < c.x;
      for (var t = -.4; t <= DUR + .01; t += 1 / 240) { var now = edgeAt(t) < c.x; if (now !== prev) L.push({ t: t, on: now }); prev = now; }
      CROSS[c.id] = L;
    });
  }
  function clockState(c, t) {
    var s = { hh: ['11', '11'], mm: ['59', '59'], ap: 'PM', day: 'WED', ph: 1, pm: 1, on: false, ut: -9 };
    if (c.id === 'la') {
      var on = t >= T.fLA && t < T.laReset, tf = t < T.laReset ? T.fLA : T.laReset;
      s.hh = on ? ['8', '9'] : ['9', '8']; s.mm = on ? ['59', '00'] : ['00', '59']; s.ap = 'PM'; s.day = 'WED';
      s.pm = seg(t, tf, tf + .22); s.ph = seg(t, tf + .05, tf + .27); if (t < T.fLA) { s.hh = ['8', '8']; s.mm = ['59', '59']; }
      s.on = t >= T.laUnl && t < T.laReset; s.ut = T.laUnl;
      return s;
    }
    var L = CROSS[c.id], last = null; for (var i = 0; i < L.length; i++) if (L[i].t <= t) last = L[i];
    var flipped = last ? last.on : edgeAt(-.4) < c.x, tf = last ? last.t : -9;
    var A = ['11', '59', 'PM', 'WED'], B = ['12', '00', 'AM', 'THU'], from = flipped ? A : B, to = flipped ? B : A;
    s.hh = [from[0], to[0]]; s.mm = [from[1], to[1]]; s.pm = seg(t, tf, tf + .22); s.ph = seg(t, tf + .06, tf + .28);
    s.ap = s.pm > .5 ? to[2] : from[2]; s.day = s.ph > .5 ? to[3] : from[3];
    s.on = flipped; s.ut = tf;
    return s;
  }
  /* one flip card: top half shows the new value, bottom the old, and the flap falls over the hinge */
  function face(g, x, y, w, h, s, px, half) {
    g.save(); g.beginPath();
    if (half === 1) g.rect(x - 4, y - 4, w + 8, h / 2 + 4); else if (half === 2) g.rect(x - 4, y + h / 2, w + 8, h / 2 + 8); else g.rect(x - 4, y - 4, w + 8, h + 12);
    g.clip();
    g.drawImage(P.card.c, x + w / 2 + P.card.x0, y + h / 2 + P.card.y0, P.card.w, P.card.h);
    cond(g); font(g, px, 900); ls(g, 0); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = CREAM;
    g.fillText(s, x + w / 2, y + h / 2 + px * .05); unst(g);
    g.restore();
  }
  function flipCard(g, x, y, w, h, o, n, p, px) {
    var nr = NOREC;
    if (p >= 1 || o === n || p <= 0) { face(g, x, y, w, h, p <= 0 ? o : n, px, 0); }
    else {
      NOREC = true;
      face(g, x, y, w, h, n, px, 1); face(g, x, y, w, h, o, px, 2);
      var hy = y + h / 2, k = Math.cos(p * Math.PI);
      g.save(); g.translate(0, hy); g.scale(1, Math.max(.02, Math.abs(k))); g.translate(0, -hy);
      if (k > 0) face(g, x, y, w, h, o, px, 1); else face(g, x, y, w, h, n, px, 2);
      g.fillStyle = 'rgba(6,3,18,' + (.45 * (1 - Math.abs(k))).toFixed(3) + ')'; g.fillRect(x, k > 0 ? y : hy, w, h / 2);
      g.restore();
      NOREC = nr;
    }
    g.fillStyle = 'rgba(6,3,18,.55)'; g.fillRect(x, y + h / 2 - 3, w, 6);
    g.fillStyle = '#4a3a78'; g.fillRect(x - 10, y + h / 2 - 9, 10, 18); g.fillRect(x + w, y + h / 2 - 9, 10, 18);
  }
  function tab(g, x, y, w, s, a) { g.save(); g.globalAlpha *= a == null ? 1 : a; put(g, P.tab, x, y); cond(g); font(g, 50, 900); ls(g, 2); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = INK; g.fillText(s, x, y + 4); unst(g); g.restore(); }
  function drawClock(g, c, t) {
    if (C.z < .3) return;
    var cs = c.minor ? .6 : 1, X = sx(c.x), z = C.z * cs; if (X + 380 * z < 60 || X - 380 * z > 1020) return;
    var s = clockState(c, t);
    clockAt(g, c, t, X, AY, z, s);
  }
  function clockAt(g, c, t, X, Y, z, s) {
    var kk = kn(t, s.ut + .2, .05);
    g.save(); g.translate(X, Y); g.scale(z * kk, z * kk); g.rotate(.006 * osc(t, 5, c.h));
    put(g, P.clock, 0, 0);
    flipCard(g, -340, -150, 300, 300, s.hh[0], s.hh[1], s.ph, 250);
    flipCard(g, 40, -150, 300, 300, s.mm[0], s.mm[1], s.pm, 250);
    g.fillStyle = CREAM; circle(g, 0, -48, 15); g.fill(); circle(g, 0, 48, 15); g.fill();
    var tA = c.id === 'akl' ? fin(t, T.zoom1, .15) * (1 - seg(t, T.E0 + .3, T.E0 + .5)) : 1; if (tA > 0) { var nr0 = NOREC; NOREC = nr0 || tA < 1; tab(g, -205, 205, 0, s.day, tA); tab(g, 205, 205, 0, s.ap, tA); NOREC = nr0; }
    g.restore();
  }
  /* the city tag above, the scope chip below, UNLOCKED on the corner: screen-size floors keep them ≥ 36 px */
  function cityLabels(g, t, c) {
    var X = sx(c.x), z = C.z * (c.minor ? .6 : 1), la = seg(C.z, .3, .38); if (la <= 0 || X < -200 || X > 1280) return;
    var ts = Math.max(z, c.minor ? .7 : .62), nr = NOREC, moving = Math.abs(sx(c.x) - X) > 0;
    NOREC = nr || T.camMoving;
    chip(g, c.name, X, AY - 160 * z - 30 * ts - 12, { px: 60 * ts, bg: CREAM, fg: INK, a: la * tagA(c, t), rot: -.02 + .008 * osc(t, 6, c.h) });
    var ps = psText(c, t);
    if (ps) { var k = cd(t, ps.t, 14), a = la * fin(t, ps.t, .1) * (1 - seg(t, ps.out, ps.out + .25)); if (a > 0) chip(g, ps.s, X, AY + 240 * z + 32 * Math.max(z, .82) + 6 + 30 * (1 - k), { px: 44 * Math.max(z, .82), bg: ps.bg || TEAL, fg: INK, a: a, rot: .015 + .006 * osc(t, 7, c.h) }); }
    var s = clockState(c, t);
    if (s.on && z > .85 && !c.minor) { var ut = c.id === 'la' ? s.ut : c.id === 'akl' && s.ut < 1 ? T.unl : s.ut + .25, uk = cd(t, ut, 18); if (t >= ut - .02) chip(g, 'UNLOCKED', X + 250 * z, AY - 165 * z + 44, { px: 46, bg: HOT, fg: CREAM, a: fin(t, ut, .06) * seg(z, .85, .95), rot: .09, s: lerp(1.5, 1, uk) }); }
    NOREC = nr;
  }
  function tagA(c, t) { if (c.id === 'la') return fin(t, T.la0 - .3, .2); return 1; }
  /* scope chips: every time on screen is a PlayStation Store time */
  function psText(c, t) {
    var i = CITIES.indexOf(c), t0 = T.ps0 + .07 * i;
    if (t < t0 - .02 || t >= T.E0 + .3 || c.id === 'la') return null;
    if (c.id === 'akl') {
      if (t >= T.nzps - .02 && t < T.sw0 + .3) return { s: 'NZ PS STORE · 11:00 UTC', t: T.nzps, out: T.sw0, bg: ORG };
      if (t >= T.sw0 + .3) return { s: 'PS STORE', t: T.sw0 + .3, out: T.E0 };
      return { s: 'PS STORE', t: t0, out: T.nzps - .25 };
    }
    if (c.id === 'nyc') { if (t >= T.st18 - .1) return null; return { s: 'PS STORE', t: t0, out: T.st18 - .35 }; }
    return { s: 'PS STORE', t: t0, out: T.E0 };
  }

  /* ---------- the sky: evening paper west of the line, night paper east of it ---------- */
  var STARS = []; (function () { var r = mulberry(17); for (var i = 0; i < 70; i++) STARS.push([r() * 1400 - 160, 60 + r() * 1060, 1.6 + r() * 3.2, r() * 6, r()]); })();
  function nightPath(g, ex) { var r = mulberry(5), off = Math.floor(ex / 9); g.beginPath(); g.moveTo(1180, -40); g.lineTo(ex, -40); for (var y = -40; y <= 1200; y += 22) { var j = hash(Math.floor(y / 22) + 31) * 14 - 7; g.lineTo(ex + j + 4 * Math.sin(y * .05), y); } g.lineTo(ex, 1200); g.lineTo(1180, 1200); g.closePath(); }
  function skyDraw(g, t) {
    var gr = g.createLinearGradient(0, 0, 0, 1190); gr.addColorStop(0, '#170c35'); gr.addColorStop(.5, '#2d1656'); gr.addColorStop(.8, '#5b2468'); gr.addColorStop(.93, '#b0406e'); gr.addColorStop(1, '#ff8a3d');
    g.fillStyle = gr; g.fillRect(0, 0, W, 1200);
    /* evening clouds: torn paper strips drifting (periodic) */
    [[0, 330, 420, .12], [1, 1095, 520, .2], [2, 980, 300, .1]].forEach(function (cl) { var x = ((cl[0] * 470 - C.x * C.z * cl[3] + 60 * osc(t, 1, cl[0])) % 1500 + 1500) % 1500 - 260; put(g, P.cloud[cl[0]], x, cl[1]); });
    var ex = clamp(sx(edgeAt(t)), -60, 1200);
    if (ex < 1180) {
      g.save(); g.shadowColor = 'rgba(6,3,18,.55)'; g.shadowBlur = 24; g.shadowOffsetX = -12; nightPath(g, ex); g.fillStyle = NIGHT; g.fill(); g.restore();
      g.save(); nightPath(g, ex); g.clip();
      var ng = g.createLinearGradient(0, 0, 0, 1190); ng.addColorStop(0, 'rgba(10,12,40,0)'); ng.addColorStop(1, 'rgba(40,30,90,.55)'); g.fillStyle = ng; g.fillRect(0, 0, W, 1200);
      STARS.forEach(function (s, i) { var x = ((s[0] - C.x * C.z * .25) % 1400 + 1400) % 1400 - 160, tw = .5 + .5 * Math.sin(TAU * (3 + i % 4) * t / DUR + s[3]); g.fillStyle = 'rgba(255,240,220,' + (.35 + .55 * tw).toFixed(3) + ')'; circle(g, x, s[1], s[2] * (.7 + .3 * tw)); g.fill(); });
      g.restore();
      g.save(); nightPath(g, ex); g.strokeStyle = 'rgba(255,247,228,.85)'; g.lineWidth = 3; g.stroke(); g.restore();
      /* the moon rides the line, above the action */
      var mx = clamp(ex + 110, ex + 60, 1100); put(g, P.moon, mx, 215 + 8 * osc(t, 4, .5), .1 * osc(t, 2, 1));
    }
  }
  /* ---------- the ribbon: sea and paper land, skyline blocks, pins, the hours tape, the US store awning ---------- */
  var LANDS = [[-190, 270, '#2b8a6e'], [-1180, -560, '#c97a35'], [-1880, -1380, '#c4648a'], [-5700, -2150, '#b38a52'], [-9300, -6900, '#2b8a6e']];
  var BLD = []; (function () { var r = mulberry(23); CITIES.forEach(function (c) { for (var i = 0; i < 9; i++) BLD.push({ x: c.x - 330 + i * 80 + r() * 20, w: 52 + r() * 30, h: 40 + r() * (c.id === 'nyc' ? 110 : c.id === 'la' ? 40 : 75), c: i % 3 }); }); })();
  function tapeEnd(t) {
    if (t < T.tape0) return 0;
    if (t < T.E0) return (CI.nyc.x - 6) * eio(seg(t, T.tape0, T.tape0 + 1.8));
    return (CI.nyc.x - 6) * (1 - sm(t, T.E0 + .1, .6));
  }
  function ribbonDraw(g, t) {
    var z = C.z, top = 1186, ex = sx(edgeAt(t));
    g.fillStyle = '#1d6a86'; g.fillRect(0, 1170, W, 760);
    g.fillStyle = 'rgba(255,255,255,.13)'; for (var y = 1200; y < 1920; y += 30) for (var wx0 = -80; wx0 < 1160; wx0 += 120) { var o = ((wx0 - C.x * C.z * .5 + 18 * osc(t, 3, y)) % 1240 + 1240) % 1240 - 80; g.fillRect(o, y + 6 * Math.sin(o * .02), 54, 4); }
    /* skyline blocks, flat paper, generic */
    BLD.forEach(function (b, i) {
      var x = sx(b.x), w = b.w * Math.max(z, .25), h = b.h * Math.max(z, .3); if (x + w < -20 || x > 1100) return;
      g.fillStyle = ['#3a2160', '#24304f', '#4b2a5e'][b.c]; g.fillRect(x, top - h, w, h + 4);
      g.fillStyle = 'rgba(255,214,140,' + (.5 + .4 * Math.sin(TAU * (2 + i % 3) * t / DUR + i)).toFixed(3) + ')';
      if (z > .3) for (var wy = top - h + 10; wy < top - 12; wy += 22) for (var wx = x + 8; wx < x + w - 10; wx += 18) if (hash(i * 31 + wy + wx) > .45) g.fillRect(wx, wy, 7, 9);
    });
    LANDS.forEach(function (L, li) {
      var x0 = sx(L[0]), x1 = sx(L[1]); if (x1 < -40 || x0 > 1120) return;
      g.save(); g.shadowColor = 'rgba(6,3,18,.45)'; g.shadowBlur = 12; g.shadowOffsetY = -4;
      g.beginPath(); g.moveTo(x0, 1250); for (var wx = L[0]; wx <= L[1]; wx += 50) g.lineTo(sx(wx), top + 6 * Math.sin(wx * .013 + li) + 5 * (hash(li * 97 + Math.round(wx / 50)) - .5)); g.lineTo(x1, 1250); for (wx = L[1]; wx >= L[0]; wx -= 50) g.lineTo(sx(wx), 1284 + 8 * Math.sin(wx * .021 + li * 2) + 6 * (hash(li * 53 + Math.round(wx / 50)) - .5)); g.closePath();
      g.fillStyle = L[2]; g.fill(); g.restore();
      g.save(); g.clip(); g.globalAlpha = .7; g.fillStyle = g.createPattern(GRAIN, 'repeat'); g.fillRect(x0, top - 20, x1 - x0, 140); g.restore();
      g.strokeStyle = 'rgba(255,247,228,.7)'; g.lineWidth = 2.4; g.beginPath(); for (wx = L[0]; wx <= L[1]; wx += 50) { var yy = top + 6 * Math.sin(wx * .013 + li) + 5 * (hash(li * 97 + Math.round(wx / 50)) - .5); if (wx === L[0]) g.moveTo(sx(wx), yy); else g.lineTo(sx(wx), yy); } g.stroke();
    });
    /* the US store: one striped awning over the land from New York west to LA */
    var ak = T.awn0 ? (t >= T.E0 + .5 ? 0 : sm(t, T.awn0, .9)) : 0;
    if (ak > 0) {
      var aR = sx(CI.nyc.x + 330), aL = lerp(aR, sx(CI.la.x - 420), ak), st = 44 * z;
      g.save(); g.beginPath(); g.rect(aL, 1190, aR - aL, 64); g.clip();
      for (var sxp = aR; sxp > aL - st; sxp -= st * 2) { g.fillStyle = HOT; g.fillRect(sxp - st, 1190, st, 64); g.fillStyle = CREAM; g.fillRect(sxp - 2 * st, 1190, st, 64); }
      g.restore();
      g.fillStyle = 'rgba(6,3,18,.3)'; g.fillRect(aL, 1254, aR - aL, 8);
      for (var sc = aR; sc > aL + 10; sc -= 34 * Math.max(z, .4)) { g.fillStyle = ((aR - sc) / (34 * Math.max(z, .4))) % 2 < 1 ? HOT : CREAM; circle(g, sc, 1256, 15 * Math.max(z, .4)); g.fill(); }
    }
    /* night falls on the land east of the line too */
    if (ex < 1100) { g.fillStyle = 'rgba(6,5,26,.38)'; g.fillRect(Math.max(0, ex), 1170, W, 760); }
    /* the hours tape: AKL westward; a tick per hour, a long one every 6 */
    var te = tapeEnd(t);
    if (te < -1) {
      var xa = sx(0), xb = sx(te), ty = 1300, th = 46;
      g.save(); g.shadowColor = 'rgba(6,3,18,.5)'; g.shadowBlur = 8; g.shadowOffsetY = 6; g.fillStyle = ORG; g.fillRect(Math.max(-20, xb), ty, Math.min(1100, xa) - Math.max(-20, xb), th); g.restore();
      g.fillStyle = 'rgba(255,255,255,.25)'; g.fillRect(Math.max(-20, xb), ty + 4, Math.min(1100, xa) - Math.max(-20, xb), 4);
      g.fillStyle = INK; for (var hh = 0; hh <= 24; hh++) { var hx = sx(-hh * HPX); if (hx < xb || hx > xa + 1 || hx < -10 || hx > 1090) continue; var L2 = hh % 6 === 0 ? 30 : 16; g.fillRect(hx - 2, ty + th - L2, 4, L2); }
      if (z > .25 && z * HPX > 40) for (hh = 0; hh < 24; hh++) for (var q = 1; q < 4; q++) { var qx = sx(-(hh + q / 4) * HPX); if (qx > xb && qx < xa && qx > -10 && qx < 1090) g.fillRect(qx - 1, ty + th - 8, 2, 8); }
      /* the tape case at New Zealand */
      var cr = 54 * Math.max(z, .55), cx = sx(0) + cr * .6; if (cx < 1000)
      { g.save(); g.translate(cx, ty + th / 2); g.rotate(-tapeEnd(t) / 300); put(g, P.tcase, 0, 0, 0, cr / 54); g.restore(); }
    }
    /* pins */
    CITIES.forEach(function (c) { var x = sx(c.x); if (x < -30 || x > 1110) return; put(g, P.pin, x, 1218); });
  }

  /* ---------- labels on the ribbon (fg): tape marks while close, city codes when the camera pulls all the way back ---------- */
  function ribbonLabels(g, t) {
    var z = C.z, te = tapeEnd(t), nr = NOREC; NOREC = nr || T.camMoving;
    CITIES.forEach(function (c) {
      var x = sx(c.x); if (x < 60 || x > 960) return;
      var s = clockState(c, t);
      if (c.tape && te <= c.x + 1 && s.on && t < T.E0 && x > 250 && x < 770) { var a = fin(t, s.ut + .1, .1) * seg(z, .5, .6); if (a > 0) chip(g, c.tape, x, 1386, { px: 40, bg: CREAM, fg: INK, a: a, rot: -.03, s: kn(t, s.ut + .2, .08) }); }
      var ca = 0; if (ca > 0 && x > 110 && x < 910) chip(g, c.code, x, 1386, { px: 40, bg: c.id === 'akl' || c.id === 'nyc' ? ORG : CREAM, fg: INK, a: ca * fin(t, T.zoom2 + .5, .15), rot: .02 });
    });
    NOREC = nr;
  }

  /* ---------- overlays ---------- */
  function pill(g, t) {
    /* big GTA 6 pill on the hook (and on the loop's replay), small GTA 6 RELEASE TIME pill at the top after it */
    var o = t < 0 ? 1 - sm(t, -.32, .25) : sm(t, T.pillOut, .3), nr = NOREC; NOREC = nr || (o > 0 && o < 1);
    var big = 1 - o, kb = kn(t, T.pill, .1);
    if (big > 0) chip(g, 'GTA 6', 510, lerp(318, 440, big), { px: 110, bg: HOT, fg: CREAM, a: big, rot: -.03 + .008 * osc(t, 7, 1), s: lerp(.5, 1, big) * kb });
    if (o > 0) chip(g, 'GTA 6 RELEASE TIME', 510, 318, { px: 40, bg: HOT, fg: CREAM, a: seg(o, .4, 1), rot: -.012 + .004 * osc(t, 5, 2) });
    NOREC = nr;
  }
  function ruleBeat(g, t) {
    chipIn(g, t, 'EACH PS STORE · ITS OWN MIDNIGHT', 510, 1030, T.rc0, T.rc1, { bg: ORG, px: 46, rot: -.015, from: 30 });
    chipIn(g, t, 'PLAYSTATION.COM', 510, 1105, T.rc0 + .15, T.rc1, { bg: CREAM, px: 40, rot: .02, from: 30, ph: 2 });
  }
  /* the tape's tip carries a ? HOURS flag off to the west */
  function askFlag(g, t) {
    if (t < T.tape0 || t > T.tape0 + 1.6) return;
    var x = sx(tapeEnd(t)), nr = NOREC; NOREC = true; if (x < -200) { NOREC = nr; return; }
    chip(g, '? HOURS', x - 70, 1250 + 6 * Math.sin((t - T.tape0) * 14), { px: 52, bg: CREAM, fg: INK, rot: -.06 });
    NOREC = nr;
  }
  /* a paper card dropping in at the bottom, the scribble on its day */
  function dropCard(g, t, pc, tin, tout, y, scrT) {
    if (t < tin - .02 || t > tout + .4) return;
    var k = cd(t, tin, 12), o = sm(t, tout, .35), nr = NOREC; NOREC = nr || k < .98 || o > 0;
    g.save(); g.translate(510 + 40 * o, lerp(-260, y, k) + 700 * o * o); g.rotate(-.025 + (1 - k) * .25 + .3 * o + .006 * osc(t, 7, 2)); putW(g, pc, 0, 0);
    if (scrT && t >= scrT) KIT.scribble(g, 0, 86, 180, 38, sm(t, scrT, .35), HOT, 8, 3);
    g.restore(); NOREC = nr;
  }
  function stampAt(g, t, pc, x, y, tin, tout, rot, sc) {
    if (t < tin - .02 || t > tout + .3) return;
    var k = cd(t, tin, 30), o = sm(t, tout, .25), nr = NOREC;
    g.save(); g.globalAlpha *= clamp((t - tin) * 14, 0, 1) * (1 - o); g.translate(x + 120 * o, y - 160 * o); g.rotate((rot || -.05) + .4 * o); var s = lerp(1.15, 1, k) * (sc || 1); g.scale(s, s);
    NOREC = nr || k < .98 || o > 0; putW(g, pc, 0, 0); NOREC = nr; g.restore();
    if (t >= tin && t < tin + .45) KIT.impact(g, x, y, t - tin, .7, CREAM);
  }
  function chipIn(g, t, text, x, y, tin, tout, o) {
    o = o || {}; if (t < tin - .02 || t > tout + .3) return;
    var k = cd(t, tin, 14), nr = NOREC; NOREC = nr || k < .98 || t > tout;
    chip(g, text, x + (o.dx || 0) * (1 - k), y + (1 - k) * (o.from == null ? -40 : o.from), { px: o.px || 44, bg: o.bg || ORG, fg: o.fg || INK, a: fin(t, tin, .08) * (1 - seg(t, tout, tout + .25)), rot: (o.rot || 0) + .01 * osc(t, 7, o.ph || 0), s: kn(t, tin + .1, .05) });
    NOREC = nr;
  }
  /* the awning's sign rides with the camera while the store is on screen */
  function storeSign(g, t) {
    if (!T.awn0 || t < T.awn0 + .5 || t > T.E0 + .2) return;
    var aR = sx(CI.nyc.x + 330), aL = sx(CI.la.x - 420), x = clamp(510, aL + 200, aR - 200), a = fin(t, T.awn0 + .5, .2) * (1 - seg(t, T.E0, T.E0 + .2));
    if (aR - aL < 420) return;
    var nr = NOREC; NOREC = nr || T.camMoving;
    chip(g, 'US PS STORE · 05:00 UTC', x, 1222, { px: 44, bg: INK, fg: CREAM, a: a, rot: .01 * osc(t, 5, 2), line: CREAM });
    NOREC = nr;
  }
  function waitBeat(g, t) {
    if (t >= T.zoom2 && t < T.st18Out + .5) {
      var pa = 1 - seg(C.z, .2, .45);
      if (pa > 0) {
        var nr = NOREC; NOREC = nr || pa < 1;
        [[CI.nyc, 285, '05:00 UTC · NOV 19'], [CI.akl, 735, '11:00 UTC · NOV 18']].forEach(function (q, i) {
          var s = { hh: ['12', '12'], mm: ['00', '00'], ap: 'AM', day: 'THU', ph: 1, pm: 1, on: true, ut: -9 }, k = cd(t, T.zoom2 + .1 * i, 10);
          g.save(); g.globalAlpha *= pa; clockAt(g, q[0], t, q[1], 770 + 40 * (1 - k), .52 * lerp(.6, 1, k), s);
          chip(g, q[0].name, q[1], 630, { px: 46, bg: CREAM, fg: INK, rot: -.02 + .006 * osc(t, 6, i) });
          chip(g, q[2], q[1], 950, { px: 38, bg: i ? ORG : TEAL, fg: INK, rot: .015 });
          g.restore();
        });
        NOREC = nr;
      }
    }
    stampAt(g, t, P.st18, 510, 1098, T.st18, T.st18Out, -.04, kn(t, T.st18k, .07));
  }
  function laBeat(g, t) {
    chipIn(g, t, 'WED NOV 18 · 9 PM PT · LISTED', 510, 1300, T.laDate, T.E0, { bg: ORG, px: 48, rot: -.02, from: 30 });
    chipIn(g, t, 'US PS STORE LISTING · NOV 16', 510, 1386, T.laCred, T.E0, { bg: CREAM, px: 38, rot: .015, from: 30, ph: 2 });
    stampAt(g, t, P.stNight, 510, 1102, T.stN, T.E0 - .05, -.05, 1);
  }
  /* end: a blank paper tag for the viewer's city, a pen line written under it */
  function endBeat(g, t) {
    if (t < T.yc - .02 || t > T.W5) return;
    var k = cd(t, T.yc, 12), o = sm(t, T.W5 - .42, .2), nr = NOREC; NOREC = nr || k < .98 || o > 0;
    g.save(); g.globalAlpha *= 1 - o; g.translate(510, lerp(1600, 1265, k) + 160 * o); g.rotate(-.04 + .02 * osc(t, 5, 1) + (1 - k) * .2);
    putW(g, P.yours, 0, 0);
    var pk = sm(t, T.pen, .7); if (pk > 0) { g.strokeStyle = INK; g.lineWidth = 6; g.lineCap = 'round'; g.beginPath(); for (var i = 0; i <= 60 * pk; i++) { var px = -200 + i * 6.6, py = 60 + 10 * Math.sin(i * .9) + 4 * Math.sin(i * 2.3); if (i) g.lineTo(px, py); else g.moveTo(px, py); } g.stroke(); }
    g.restore(); NOREC = nr;
  }

  /* ---------- textures ---------- */
  function buildTextures() {
    GRAIN = buildGrain();
    P.card = piece([-150, -150, 150, 150], function (g) { rr(g, -150, -150, 300, 300, 18); }, CARD, { sx: 3, sy: 5, blur: 6, extra: function (g) { g.fillStyle = 'rgba(255,255,255,.06)'; g.fillRect(-150, -150, 300, 150); } , edge: 1.6 });
    P.clock = piece([-370, -175, 370, 175], function (g) { rr(g, -370, -175, 740, 350, 30); }, '#1a1036', { sx: 10, sy: 16, blur: 22, extra: function (g) {
      g.fillStyle = 'rgba(255,255,255,.08)'; g.fillRect(-350, -170, 700, 10);
      g.fillStyle = '#ff4fa3'; g.fillRect(-370, 150, 740, 10); g.fillStyle = '#19d3c5'; g.fillRect(-370, 160, 740, 6);
    } });
    P.tab = piece([-110, -36, 110, 36], function (g) { rr(g, -110, -36, 220, 72, 10); }, PAPER, { sx: 4, sy: 6, blur: 8, edge: 2 });
    P.moon = piece([-56, -56, 56, 56], function (g) { g.beginPath(); g.arc(0, 0, 54, 0, TAU); }, '#f6ecd2', { sx: 4, sy: 6, blur: 14, sc: 'rgba(255,240,200,.35)', extra: function (g) { g.fillStyle = 'rgba(160,140,110,.35)'; circle(g, -16, -10, 12); g.fill(); circle(g, 18, 14, 9); g.fill(); circle(g, 4, -26, 6); g.fill(); g.fillStyle = 'rgba(11,13,40,.9)'; circle(g, 30, -6, 44); g.fill(); } });
    P.cloud = [0, 1, 2].map(function (i) { var r = mulberry(60 + i), w = 260 + i * 60, pts = jag(70 + i, w, 6); return piece([0, -40, w, 30], function (g) { g.beginPath(); g.moveTo(0, 20); pts.forEach(function (p) { g.lineTo(p[0], -18 - 14 * Math.sin(Math.PI * p[0] / w) + p[1]); }); g.lineTo(w, 20); g.closePath(); }, i === 1 ? '#c2507a' : '#7a3a82', { sx: 3, sy: 6, blur: 8, edgeCol: 'rgba(255,220,220,.5)', edge: 1.6 }); });
    P.pin = piece([-16, -40, 16, 16], function (g) { g.beginPath(); g.arc(0, -24, 15, 0, TAU); g.rect(-2.5, -12, 5, 26); }, HOT, { sx: 3, sy: 5, blur: 5, edge: 1.5, after: function (g) { g.fillStyle = 'rgba(255,255,255,.65)'; circle(g, -5, -29, 4.5); g.fill(); } });
    P.tcase = piece([-56, -56, 56, 56], function (g) { g.beginPath(); g.arc(0, 0, 54, 0, TAU); }, CREAM, { sx: 4, sy: 7, blur: 9, extra: function (g) { g.fillStyle = ORG; circle(g, 0, 0, 38); g.fill(); g.fillStyle = INK; circle(g, 0, 0, 12); g.fill(); g.fillStyle = 'rgba(29,18,51,.5)'; for (var i = 0; i < 6; i++) { g.save(); g.rotate(i / 6 * TAU); g.fillRect(-3, -36, 6, 14); g.restore(); } } });
    function bigCard(title, big, foot) {
      return cardPiece(640, 236, NEWS, [[title, 46, CREAM, -80], [big, 112, INK, 14], [foot, 42, '#7a2b5c', 86]], { r: 10, ring: 'rgba(29,18,51,.2)', before: function (g) { g.fillStyle = DEEP; rr(g, -320, -118, 640, 76, 10); g.fill(); g.fillRect(-320, -70, 640, 28); } });
    }
    P.nyCard = bigCard('NEW YORK', '6:00 AM', 'WED NOV 18 · ET');
    P.lonCard = bigCard('NEW YORK TIME', '7:00 PM', 'WED NOV 18 · ET');
    P.st18 = buildStamp(['18 HOURS AFTER NZ'], 90, 760, HOT);
    P.stNight = buildStamp(['THE NIGHT BEFORE'], 94, 760, HOT);
    P.yours = cardPiece(560, 200, PAPER, [['YOUR CITY?', 84, INK, -14]], { r: 14, ring: 'rgba(29,18,51,.25)', after: function (g) { g.fillStyle = BG; circle(g, -248, 0, 13); g.fill(); g.strokeStyle = 'rgba(29,18,51,.5)'; g.lineWidth = 3; circle(g, -248, 0, 16); g.stroke(); } });
  }

  /* ---------- the frame ---------- */
  var NOISE, POSTERMODE = false, VIG = null;
  function stage(g) { g.fillStyle = BG; g.fillRect(0, 0, W, H); }
  function vignette(g) {
    if (!VIG) { VIG = mk(W, H); var q = VIG.getContext('2d'), gr = q.createRadialGradient(510, 860, 520, 510, 900, 1300); gr.addColorStop(0, 'rgba(6,3,18,0)'); gr.addColorStop(1, 'rgba(6,3,18,.42)'); q.fillStyle = gr; q.fillRect(0, 0, W, H); }
    g.drawImage(VIG, 0, 0);
  }
  function railClip(g) { g.beginPath(); if (LIVE2.clip) g.rect(BX0, 0, BX1 - BX0, BY1); else g.rect(-500, -500, 2080, BY1 + 500); g.clip(); }
  function frame(g, t) {
    g.setTransform(1, 0, 0, 1, 0, 0);
    stage(g);
    /* the last .35 s replay frame 0's approach: the night slides in from the east again */
    var tt = t >= T.W5 ? t - DUR : t;
    C = cam(tt); var c2 = cam(tt + .04); T.camMoving = Math.abs(c2.x - C.x) * C.z > 3 || Math.abs(c2.z - C.z) > .004;
    if (LIVE2.bg) { skyDraw(g, tt); ribbonDraw(g, tt); vignette(g); }
    g.save(); railClip(g); CLIPW = true;
    CITIES.forEach(function (c) { drawClock(g, c, tt); });
    CITIES.forEach(function (c) { cityLabels(g, tt, c); });
    ribbonLabels(g, tt); storeSign(g, tt); askFlag(g, tt);
    ruleBeat(g, tt);
    dropCard(g, tt, P.nyCard, T.nyc0, T.nycOut, 1236, T.scr1);
    dropCard(g, tt, P.lonCard, T.lon0, T.lonOut, 1236, T.scr2);
    waitBeat(g, tt); laBeat(g, tt); endBeat(g, tt); pill(g, tt);
    CLIPW = false; g.restore();
    if (!POSTERMODE && LIVE.text && t < T.W5 - .1) captions(g, t);
    if (LIVE.grain && NOISE && LIVE2.bg) { g.globalAlpha = .05; g.globalCompositeOperation = 'overlay'; var o = Math.floor(t * 24) * 37 % 256; g.fillStyle = g.createPattern(NOISE, 'repeat'); g.translate(-o, -o); g.fillRect(o, o, W, H); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }
  }

  /* ---------- captions (the voice, phrase by phrase; the hook is carried by the picture) ---------- */
  var GLUE = { the: 1, a: 1, an: 1, your: 1, its: 1, of: 1, at: 1, to: 1, and: 1, in: 1, with: 1, on: 1, by: 1, so: 1, for: 1, own: 1, how: 1, that: 1, if: 1, you: 1, no: 1, or: 1, it: 1, is: 1, new: 1, each: 1, two: 1 };
  var NOCAP = { hook: 1 };
  var CAPS = (function () {
    var outc = [];
    VO.lines.forEach(function (l) {
      if (NOCAP[l.id]) return;
      var cur = [], ws = l.words.slice();
      ws.forEach(function (w, i) { cur.push(w); if (/[.?!:]$/.test(w.w) && i < ws.length - 1) { cur.id = l.id; outc.push(cur); cur = []; } });
      if (cur.length) { cur.id = l.id; outc.push(cur); }
    });
    return outc.map(function (ws) { return { id: ws.id, t0: ws[0].t0, t1: ws[ws.length - 1].t1, s: ws[0].t0 - .04, words: ws }; });
  })();
  function capS(c) { return c.s; }
  var STRESS = [];
  function stressed(w) { for (var i = 0; i < STRESS.length; i++) if (Math.abs(STRESS[i] - w.t0) < .02) return true; return false; }
  var CAPY = 432;
  function captions(g, t) {
    t = tq(t);
    var card0 = null, ci = -1;
    CAPS.forEach(function (c, i) { if (t >= capS(c)) { card0 = c; ci = i; } });
    if (!card0) return;
    var nx = CAPS[ci + 1], ns = nx ? capS(nx) : 1e9, end = Math.min(card0.t1 + .5, ns);
    if (t >= end) return;
    var CY = CAPY, k = cd(t, capS(card0), 16);
    g.save(); cond(g); var cpx = 74; font(g, cpx, 900); ls(g, 1); g.textBaseline = 'alphabetic';
    var words = card0.words, up = words.map(function (w) { return w.w.toUpperCase(); }), ws = up.map(function (u) { return g.measureText(u).width; }), gap = cpx * .26;
    var lines, lw, maxw = 720, CXc = CX;
    function lay2() { lines = [[]]; lw = [0]; words.forEach(function (w, i) { var Ln = lines.length - 1; if (lw[Ln] + ws[i] > maxw && lines[Ln].length) { lines.push([]); lw.push(0); Ln++; } lines[Ln].push(i); lw[Ln] += ws[i] + gap; }); }
    function fixLines() {
      for (var Ln = 0; Ln < lines.length - 1; Ln++) { var last = lines[Ln][lines[Ln].length - 1]; while (lines[Ln].length > 1 && GLUE[norm(words[last].w)]) { lines[Ln].pop(); lines[Ln + 1].unshift(last); last = lines[Ln][lines[Ln].length - 1]; } }
      var n = lines.length; if (n > 1 && lines[n - 1].length === 1 && lines[n - 2].length > 2) lines[n - 1].unshift(lines[n - 2].pop());
      lw = lines.map(function (ln) { var w = 0; ln.forEach(function (i) { w += ws[i] + gap; }); return w; });
    }
    function commaLay() {
      var ci = -1; words.forEach(function (w, i) { if (/,$/.test(w.w) && i < words.length - 1) ci = i; });
      if (ci < 0) return false;
      var a = 0, b = 0; words.forEach(function (w, i) { if (i <= ci) a += ws[i] + gap; else b += ws[i] + gap; });
      if (a - gap > maxw || b - gap > maxw) return false;
      lines = [[], []]; words.forEach(function (w, i) { lines[i <= ci ? 0 : 1].push(i); }); lw = [a, b]; return true;
    }
    lay2(); fixLines();
    if (lines.length > 1) { var sv = cpx; for (var cc = cpx; cc >= 60; cc -= 4) { font(g, cc, 900); ws = up.map(function (u) { return g.measureText(u).width; }); gap = cc * .26; if (commaLay()) { cpx = cc; break; } } if (cpx !== sv || lines.length !== 2 || !commaLay()) { if (!commaLay()) { cpx = sv; font(g, cpx, 900); ws = up.map(function (u) { return g.measureText(u).width; }); gap = cpx * .26; lay2(); fixLines(); } } }
    var COMMA = lines.length === 2 && commaLay();
    function widest() { return Math.max.apply(null, lw) - gap; }
    while (!COMMA && (lines.length > 2 || widest() > maxw || (lines.length > 1 && (lines[lines.length - 1].length < 2 || lines[0].length < 2))) && cpx > 56) { cpx -= 4; font(g, cpx, 900); ws = up.map(function (u) { return g.measureText(u).width; }); gap = cpx * .26; lay2(); fixLines(); }
    var lh = cpx * 1.32, y0 = CY - (lines.length - 1) * lh / 2 + cpx * .36;
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

  function TEXTS(t) {
    var o = [];
    function Tx(id, text, a, b) { if (t >= a && t < b) o.push({ id: id, text: text, x0: 0, y0: 0, x1: 0, y1: 0 }); }
    Tx('nz', 'NEW ZEALAND', 0, T.zoom2 + .3); Tx('gta6', 'GTA 6', 0, T.pillOut); Tx('gtart', 'GTA 6 RELEASE TIME', T.pillOut + .3, T.W5);
    Tx('rule', 'EACH PS STORE · ITS OWN MIDNIGHT', T.rc0 + .08, T.rc1); Tx('psc', 'PLAYSTATION.COM', T.rc0 + .23, T.rc1);
    Tx('nzps', 'NZ PS STORE · 11:00 UTC', T.nzps + .08, T.sw0);
    Tx('nyc', 'NEW YORK', T.nyc0 + .15, T.nycOut); Tx('nyc6', '6:00 AM', T.nyc0 + .15, T.nycOut); Tx('nycd', 'WED NOV 18 · ET', T.nyc0 + .15, T.nycOut);
    Tx('lon', 'NEW YORK TIME', T.lon0 + .15, T.lonOut); Tx('lon7', '7:00 PM', T.lon0 + .15, T.lonOut); Tx('lond', 'WED NOV 18 · ET', T.lon0 + .15, T.lonOut);
    Tx('st18', '18 HOURS AFTER NZ', T.st18 + .05, T.st18Out); Tx('pairny', '05:00 UTC · NOV 19', T.zoom2 + .3, T.zoomIn); Tx('pairnz', '11:00 UTC · NOV 18', T.zoom2 + .3, T.zoomIn);
    Tx('usps', 'US PS STORE · 05:00 UTC', T.usps + .1, T.E0);
    Tx('ladate', 'WED NOV 18 · 9 PM PT · LISTED', T.laDate + .08, T.E0); Tx('lacred', 'US PS STORE LISTING · NOV 16', T.laCred + .08, T.E0);
    Tx('night', 'THE NIGHT BEFORE', T.stN + .05, T.E0 - .05);
    Tx('yours', 'YOUR CITY?', T.yc + .02, T.W5 - .22);
    return o;
  }

  /* ---------- times and sound events, all from the voice ---------- */
  function initTimes() {
    var end = start('end');
    /* hook: frame 0 is New Zealand at 11:59 with the night sliding in; the clock clacks to 12:00 at 0.08 s, before the voice */
    T.pill = .25; T.zoom1 = start('rule') - .2; T.pillOut = start('rule') - .4;
    EV.push({ t: .05, type: 'clack', g: 1, id: 'clack0', trim: -3 });
    T.unl = G('unl', after('hook') - .1, 'pop', .3, .9);
    /* rule: pull back to the row of clocks; scope chips on "PlayStation" */
    MV.push({ t: T.zoom1, d: .6, x: -800, z: .355 }); G('sw1', T.zoom1 - .05, 'swish', .3, .9);
    T.ps0 = at('rule', 'playstation') + .05; T.rc0 = T.zoom1 + .62; T.rc1 = start('ask') + .45;
    /* ask: back in on New Zealand; the tape unrolls west with its ? flag */
    T.zoom2b = start('ask') - .25; MV.push({ t: T.zoom2b, d: .55, x: 0, z: 1 }); G('sw2', T.zoom2b - .05, 'swish', .3, .8);
    T.tape0 = at('ask', 'far') - .1; G('rat', after('ask'), 'ratchet', .35, .9, { dur: .3 });
    /* nz: the NZ scope chip names the store time; the New York card drops on "6"; the scribble on WED in the pause */
    T.nzps = at('nz', 'auckland'); T.nyc0 = at('nz', '6') - .12; T.scr1 = G('scr1', after('nz'), 'pop', .3, .9);
    /* sweep: ride the line west: Sydney flips right after its name, Tokyo after its name */
    T.sw0 = start('sweep') + .05; T.nycOut = T.sw0 + .2;
    var vSyd = vadEndBefore(at('sweep', 'then') + .1, at('sweep', 'sydney')), vTyo = vadEndBefore(start('london') + .1, at('sweep', 'tokyo'));
    MV.push({ t: T.sw0, d: 1.25, x: -800 }); EM.push({ t: vSyd - .32, d: .6, x: -950 });
    MV.push({ t: at('sweep', 'then') - .1, d: .7, x: -1600 }); EM.push({ t: vTyo - .37, d: .7, x: -1750 });
    G('wh1', T.sw0 - .2, 'swish', .35, .7);
    /* london: the long glide west; London flips on "unlocks"; the New York time card drops; +13 H pops in the pause */
    T.lonPan = vTyo + .2; MV.push({ t: T.lonPan, d: .85, x: -5200, dip: .45 }); EM.push({ t: T.lonPan + .05, d: .85, x: -5350 });
    G('wh2', T.lonPan, 'whoosh', .3, .8, { dur: .3 });
    T.lon0 = at('london', 'unlocks'); T.scr2 = G('scr2', after('london'), 'pop', .3, .9);
    /* wait: to New York (11:59, still Wednesday), then all the way out: the tape spans NZ to NY; 18 HOURS lands in the pause */
    T.nyPan = T.scr2 + .35; T.lonOut = T.nyPan - .05; MV.push({ t: T.nyPan, d: .7, x: -7200, dip: .2 }); EM.push({ t: T.nyPan + .05, d: .75, x: -7000 });
    G('wh3', T.nyPan + .02, 'swish', .3, .8);
    T.zoom2 = at('wait', 'it') - .1; MV.push({ t: T.zoom2, d: .5, x: -3600, z: .098 });
    T.st18 = at('wait', 'eighteen') - .06; T.st18k = G('st18', after('wait'), 'stamp', .3, 1); T.zoomIn = at('but', 'new') - .05; T.st18Out = T.zoomIn;
    /* but: back in on New York; its clock flips right after "midnight"; the store awning unrolls west to LA */
    MV.push({ t: T.zoomIn, d: .6, x: -7200, z: 1 });
    var vMid = vadEndBefore(start('la') + .1, at('but', 'midnight'));
    EM.push({ t: vMid - .21, d: .55, x: -7350 });
    T.awn0 = T.zoomIn + .55; T.usps = T.awn0 + .5;
    /* la: glide along the awning to LA (still evening, west of the line): 9:00 PM on "9"; THE NIGHT BEFORE as "PM" ends; UNLOCKED in the pause */
    T.la0 = start('la') - .25; MV.push({ t: T.la0, d: .75, x: -8400 }); G('sw4', T.la0 - .05, 'swish', .3, .8);
    T.fLA = at('la', '9') - .18; T.laDate = T.fLA + .02; T.laCred = T.fLA + .2;
    T.stN = vadEndBefore(at('la', 'the') + .05, at('la', '9')) - .09;
    T.laUnl = G('laUnl', after('la'), 'stamp', .3, 1);
    /* end: fly back east; the night rewinds and the clocks reset; the blank tag for the viewer's city */
    T.E0 = end - .05; MV.push({ t: T.E0, d: .72, x: 0, z: 1, dip: .9 }); EM.push({ t: T.E0, d: .72, x: 250 + 3800 * .35 });
    G('wh4', T.E0 - .02, 'whoosh', .25, .8, { dur: .3 });
    T.laReset = T.E0 + .3; T.yc = T.E0 + .4; T.pen = at('end', 'drop');
    T.W5 = DUR - .35;
    buildCross();
    /* clacks: every flip that lands in a pause gets one */
    CITIES.forEach(function (c) { if (c.id === 'akl' || c.id === 'la') return; CROSS[c.id].forEach(function (x, i) { if (x.on) G('cl_' + c.id + i, x.t, 'clack', .15, .9); }); });
    STRESS = [['nz', 'midnight'], ['sweep', 'sydney.'], ['sweep', 'tokyo.'], ['wait', 'eighteen'], ['la', '9'], ['la', 'before.']].map(function (p) { return at(p[0], p[1]); });
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

  /* ---------- sound: paper foley and flip-clock clacks written into the pauses; no music (Isac adds a TikTok sound) ---------- */
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
    function swish(t, g) { band(t, t + .26, 600, 3600, .09 * g, .02 * g, 1.3, -.2); }
    function whoosh(t, g) { band(t, t + .3, 400, 2800, .1 * g, .03 * g, 1.1, .25); band(t + .05, t + .3, 1800, 5200, .04 * g, .01 * g, 1.5, -.25); }
    function thock(t, g) { thump(t, .35 * g, 220); tick(t, .9 * g, 1800); }
    function pop(t, g) { thump(t, .3 * g, 320); tick(t, 1.1 * g, 2600); band(t, t + .06, 2400, 1200, .06 * g, .01 * g, 1.2); }
    /* a split-flap clock: the flap slaps the card, a bright tick on top so phones hear it */
    function clack(t, g) { tick(t, 1.3 * g, 2200); thump(t, .3 * g, 280); band(t, t + .05, 3000, 1600, .07 * g, .01 * g, 1.6); tick(t + .045, .8 * g, 1700); thump(t + .045, .18 * g, 240); }
    function ratchet(t, g) { for (var j = 0; j < 9; j++) { var tj = t + .3 * (1 - Math.pow(1 - j / 9, 1.6)); tick(tj, (.7 + .05 * j) * g, 2200); thump(tj, .06 * g, 400); } }
    function stamp(t, g) { thump(t, .55 * g, 110); band(t, t + .1, 800, 300, .12 * g, .01 * g, 1); tick(t, .9 * g, 1500); band(t, t + .04, 2600, 1800, .06 * g, .01 * g, 1.4); }
    var LEVEL = { swish: 14, whoosh: 10, thock: 2, pop: 4.6, clack: 3, ratchet: 3, stamp: 2.2 };
    var TRIM = window.SFX_TRIM || {};
    var TYPE_DB = window.SFX_TYPE_DB || { swish: -8, whoosh: -8, thock: -6, pop: -14, clack: -12, ratchet: -6, stamp: -13 };
    var FN = { swish: swish, whoosh: whoosh, thock: thock, pop: pop, clack: clack, ratchet: ratchet, stamp: stamp };
    EV.forEach(function (e) {
      var g = (e.g == null ? 1 : e.g) * (LEVEL[e.type] || 1) * Math.pow(10, ((TRIM[e.id] || 0) + (e.trim || 0) + (TYPE_DB[e.type] || 0)) / 20);
      if (FN[e.type]) FN[e.type](e.t, g);
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

  window.FILM = { bare: function () { ctx.setTransform(1, 0, 0, 1, 0, 0); stage(ctx); }, W: W, H: H, DUR: DUR, POSTER: 0, SLUG: 'gta-unlock', SHOTS: [], init: init, render: render, frame: frame, LIVE: LIVE, LIVE2: LIVE2, T: T, GT: GT };
  var _bt = buildTextures; buildTextures = function () { _bt(); EV.length = 0; MV.length = 0; EM.length = 0; initTimes(); window.FILM.POSTER = Math.round((T.laUnl + .55) * 30) / 30 + 1 / 60;
    window.FILM.SHOTS = [{ id: 'hook', name: 'New Zealand', t0: 0, t1: T.zoom1 }, { id: 'rule', name: 'Own midnight', t0: T.zoom1, t1: T.sw0 }, { id: 'sweep', name: 'The sweep', t0: T.sw0, t1: T.nyPan }, { id: 'wait', name: '18 hours', t0: T.nyPan, t1: T.la0 }, { id: 'la', name: 'LA', t0: T.la0, t1: T.E0 }, { id: 'end', name: 'Your city?', t0: T.E0, t1: DUR }]; };

  window.BOUNDS_RUN = function (step) {
    BOUNDS = []; var o = {};
    for (var t = 0; t <= DUR + 1e-6; t += step || 1 / 15) { CURT = t; POSTERMODE = false; frame(ctx, t); }
    BOUNDS.forEach(function (b) { var r = o[b.text] || (o[b.text] = { text: b.text, from: b.t, to: b.t, x0: b.x0, x1: b.x1, y1: b.y1, n: 0 }); r.to = b.t; r.n++; r.x0 = Math.min(r.x0, b.x0); r.x1 = Math.max(r.x1, b.x1); r.y1 = Math.max(r.y1, b.y1); });
    BOUNDS = null; return Object.keys(o).map(function (k) { return o[k]; });
  };
  /* rail scan: with the bleed backgrounds off and no clip, every prop and glyph must stay inside x 90-930 and above y 1450
     (world props that slide past the edge during a camera glide are reported with moving: true) */
  window.RAIL_SCAN = function (fps) {
    fps = fps || 30; var bad = [], n = Math.round(DUR * fps);
    LIVE2.bg = false; LIVE2.clip = false; var lg = LIVE.grain; LIVE.grain = false; var lt = LIVE.text; LIVE.text = false;
    function dirty(x, y, w, h) { var d = ctx.getImageData(x, y, w, h).data, o = { c: 0 }; for (var i = 0; i < d.length; i += 4) if (Math.abs(d[i] - 0x0b) + Math.abs(d[i + 1] - 0x08) + Math.abs(d[i + 2] - 0x20) > 24) o.c++; return o; }
    for (var i = 0; i < n; i++) {
      var t = (i + .5) / fps; frame(ctx, clamp(t, 0, DUR));
      var L0 = dirty(0, 0, 90, H), R0 = dirty(930, 0, 150, H), B0 = dirty(90, 1450, 840, H - 1450);
      if (L0.c + R0.c + B0.c > 0) bad.push({ t: +t.toFixed(2), moving: !!T.camMoving, left: L0.c, right: R0.c, bottom: B0.c });
    }
    LIVE2.bg = true; LIVE2.clip = true; LIVE.grain = lg; LIVE.text = lt; return bad;
  };
  window.DUR = DUR; window.EV = EV; window.TEXTS = TEXTS; window.SCORE = SCORE; window.READY = false;
  window.render = function (t, s, sh, fps) { render(t, s, sh, fps); };
})();
