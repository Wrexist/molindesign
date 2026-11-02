/* "A billion in 3 days": GTA 5's launch, Delta (pillar 1, numbers and money). A vertical film written in code,
   narrated first and cut to the voice: every visual beat is keyed to a word time from vo/vo.js (window.VO) with
   at(id, word). Pure function of t. Contract: window.FILM, DUR, render(t), READY, EV, TEXTS(t), SCORE(ctx).
   One hand-built paper prop per beat, each rising from behind a paper desk lip at y 1440: a fat stack of our own
   paper bills banded $1 BILLION (frame 0), a tear-off day calendar (3 DAYS cover, SEP 17-18-19 2013 pages), Take-Two's
   own words on a quote card, a race of day blocks (GTA 5 case on 3, a plain THE AVENGERS (2012) ticket on 19) with the
   one hero stamp, a tower of plain cases under a counter that rolls in round millions, the calendar again on
   NOV 19 2026, and the vote. Engine from film/gta-vercetti (paper pieces, VAD gate, fontStretch re-apply, rail scan).
   No Rockstar footage, logo, key art or cover art; no Marvel logo; no music. */
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

  BODY.tear = .1; BODY.land = .1; BODY.thock = .12;

  /* =====================================================================================================
     THE SET. A deep-ink paper wall with a cut-paper striped sunset behind the props, and a teal paper desk whose
     cream lip sits at y 1440: every prop rises from behind that lip and sinks back behind it, so nothing ever
     crosses y 1450 (the desk is the background and bleeds to the full frame, like the wall).
     ===================================================================================================== */
  var LIP = 1440, PAD_W = 340, PAD_H = 330;
  var MINT = '#5fd3c0', MINT2 = '#2fb3a3', DEEP = '#0f5d63', SUN = '#ffb067';
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
  function buildTextures() {
    GRAIN = buildGrain();
    /* wall + sunset + desk, one bleed sheet */
    P.wall = piece([-60, -60, 1140, 1980], rect(-60, -60, 1140, 1980), '#1c0f3d', { shadow: false, edge: false, grain: .9, ps: .5, extra: function (g) {
      var gr = g.createLinearGradient(0, 0, 0, 1440); gr.addColorStop(0, '#120a2c'); gr.addColorStop(1, '#2a1550'); g.fillStyle = gr; g.fillRect(-60, -60, 1200, 1500);
      /* the sun: a cut-paper disc with cut stripes in its lower half */
      g.save(); g.beginPath(); g.arc(510, 940, 470, 0, TAU); g.clip();
      var sg = g.createLinearGradient(0, 470, 0, 1410); sg.addColorStop(0, 'rgba(255,176,103,.42)'); sg.addColorStop(.55, 'rgba(255,79,163,.36)'); sg.addColorStop(1, 'rgba(255,79,163,.18)'); g.fillStyle = sg; g.fillRect(0, 460, 1080, 960);
      g.fillStyle = '#1f1043'; for (var i = 0; i < 9; i++) { var y = 960 + i * 50 + i * i * 2; g.fillRect(0, y, 1080, 8 + i * 3); }
      g.restore();
      /* paper palms at the far edges (background only) */
      palmSil(g, 30, 1450, 2.6, '#160b33', 30); palmSil(g, 1060, 1450, 2.3, '#160b33', -30); palmSil(g, 1000, 1460, 1.6, '#1a0d3a', -10);
      /* the desk: teal paper top, cream lip */
      g.fillStyle = '#137f7a'; g.fillRect(-60, 1440, 1200, 600);
      var dg = g.createLinearGradient(0, 1440, 0, 1700); dg.addColorStop(0, 'rgba(0,0,0,0)'); dg.addColorStop(1, 'rgba(0,0,0,.35)'); g.fillStyle = dg; g.fillRect(-60, 1440, 1200, 600);
      g.fillStyle = CREAM; g.fillRect(-60, 1436, 1200, 9); g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(-60, 1445, 1200, 6);
    } });

    /* THE BRICK: one fat stack of paper bills (our own design: palm in the oval, no numbers, no portrait) with a pink
       band printed $1 BILLION. Local coordinates: (0, 0) is the middle of the front face's top edge. */
    P.brickTop = piece([-400, -210, 400, 0], function (g) { g.beginPath(); g.moveTo(-330, -210); g.lineTo(330, -210); g.lineTo(400, 0); g.lineTo(-400, 0); g.closePath(); }, MINT, { sx: 0, sy: 4, blur: 6, extra: function (g) {
      g.strokeStyle = 'rgba(15,93,99,.55)'; g.lineWidth = 6; g.beginPath(); g.moveTo(-312, -192); g.lineTo(312, -192); g.lineTo(370, -18); g.lineTo(-370, -18); g.closePath(); g.stroke();
      g.fillStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.ellipse(0, -105, 120, 70, 0, 0, TAU); g.fill();
      g.strokeStyle = DEEP; g.lineWidth = 4; g.beginPath(); g.ellipse(0, -105, 120, 70, 0, 0, TAU); g.stroke();
      palmSil(g, -8, -50, .62, DEEP, 10);
      [[-250, -105], [250, -105]].forEach(function (p) { g.fillStyle = 'rgba(15,93,99,.35)'; g.beginPath(); g.arc(p[0], p[1], 44, 0, TAU); g.fill(); g.strokeStyle = DEEP; g.lineWidth = 3; g.beginPath(); g.arc(p[0], p[1], 30, 0, TAU); g.stroke(); });
    } });
    P.brickFront = piece([-400, 0, 400, 520], rect(-400, 0, 400, 520), MINT2, { sx: 8, sy: 16, blur: 26, sc: 'rgba(6,3,18,.6)', extra: function (g) {
      var r = mulberry(12);
      for (var y = 4; y < 520; y += 8) { g.fillStyle = r() < .5 ? 'rgba(220,255,245,.42)' : 'rgba(10,70,75,.28)'; g.fillRect(-400 + r() * 6, y, 800 - r() * 10, 2.5); }
      var sd = g.createLinearGradient(-400, 0, 400, 0); sd.addColorStop(0, 'rgba(0,30,40,.28)'); sd.addColorStop(.12, 'rgba(0,30,40,0)'); sd.addColorStop(.88, 'rgba(0,30,40,0)'); sd.addColorStop(1, 'rgba(0,30,40,.3)'); g.fillStyle = sd; g.fillRect(-400, 0, 800, 520);
    } });
    P.band = (function () {
      var rec = [], w = 820, h = 190, txt0 = '$1 BILLION';
      var pc = piece([-w / 2, -h / 2, w / 2, h / 2], rect(-w / 2, -h / 2, w / 2, h / 2), HOT, { sx: 0, sy: 8, blur: 10, extra: function (g) {
        g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(-w / 2, -h / 2, w, 8); g.fillStyle = 'rgba(80,0,40,.25)'; g.fillRect(-w / 2, h / 2 - 10, w, 10);
        var px = 168; cond(g); font(g, px, 900); ls(g, 2); var tw = g.measureText(txt0).width; if (tw > 720) { px = Math.floor(px * 720 / tw); font(g, px, 900); tw = g.measureText(txt0).width; }
        g.fillStyle = INK; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(txt0, 0, 8); rec.push([-tw / 2, 8 - px * .5, tw / 2, 8 + px * .42, txt0]); unst(g);
      } });
      pc.words = rec.map(function (r0) { return [r0[0] - pc.x0, r0[1] - pc.y0, r0[2] - pc.x0, r0[3] - pc.y0, r0[4]]; });
      return pc;
    })();
    P.bill = piece([-150, -62, 150, 62], function (g) { rr(g, -150, -62, 300, 124, 6); }, MINT, { sx: 4, sy: 8, blur: 10, extra: function (g) {
      g.strokeStyle = DEEP; g.lineWidth = 4; rr(g, -136, -48, 272, 96, 4); g.stroke();
      g.fillStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.ellipse(0, 0, 48, 34, 0, 0, TAU); g.fill(); g.strokeStyle = DEEP; g.lineWidth = 3; g.stroke();
      palmSil(g, -4, 26, .3, DEEP, 6);
      [-100, 100].forEach(function (x) { g.fillStyle = 'rgba(15,93,99,.35)'; g.beginPath(); g.arc(x, 0, 22, 0, TAU); g.fill(); });
    } });

    /* THE PAD: a tear-off day calendar. Orange binding with two rings; pages are cream cards. */
    P.padBack = piece([-PAD_W / 2, -PAD_H / 2, PAD_W / 2, PAD_H / 2], function (g) { rr(g, -PAD_W / 2, -PAD_H / 2, PAD_W, PAD_H, 12); }, '#e7d6bd', { sx: 6, sy: 12, blur: 18, extra: function (g) {
      g.fillStyle = 'rgba(29,18,51,.12)'; for (var i = 0; i < 6; i++) g.fillRect(-PAD_W / 2 + 6, PAD_H / 2 - 8 - i * 4, PAD_W - 12, 1.5);
    } });
    P.binding = piece([-PAD_W / 2 - 6, -PAD_H / 2 - 10, PAD_W / 2 + 6, -PAD_H / 2 + 52], function (g) { rr(g, -PAD_W / 2 - 6, -PAD_H / 2 - 10, PAD_W + 12, 62, 10); }, ORG, { sx: 3, sy: 6, blur: 8, extra: function (g) {
      g.fillStyle = 'rgba(255,255,255,.2)'; g.fillRect(-PAD_W / 2 - 6, -PAD_H / 2 - 10, PAD_W + 12, 8);
      [-90, 90].forEach(function (x) { g.fillStyle = '#2a1850'; g.beginPath(); g.arc(x, -PAD_H / 2 + 22, 12, 0, TAU); g.fill(); g.strokeStyle = '#d9dce6'; g.lineWidth = 6; g.beginPath(); g.arc(x, -PAD_H / 2 + 8, 16, Math.PI * .1, Math.PI * .9, true); g.stroke(); });
    } });
    function page(lines) { return cardPiece(PAD_W - 24, PAD_H - 70, CREAM, lines, { r: 6, sy: 3, path: function (g) { var w = PAD_W - 24, h = PAD_H - 70; g.beginPath(); g.moveTo(-w / 2, -h / 2); var r = mulberry(lines.length * 7 + lines[0][0].length); for (var x = -w / 2; x < w / 2; x += 10) g.lineTo(x, -h / 2 + (r() - .5) * 3); g.lineTo(w / 2, -h / 2); g.lineTo(w / 2, h / 2 - 6); g.quadraticCurveTo(w / 2, h / 2, w / 2 - 6, h / 2); g.lineTo(-w / 2 + 6, h / 2); g.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - 6); g.closePath(); } }); }
    P.cover = page([['3', 168, HOT, -12], ['DAYS', 64, INK, 98]]);
    P.sep17 = page([['SEP', 54, HOT, -96], ['17', 150, INK, 4], ['2013', 46, INK, 100]]);
    P.sep18 = page([['SEP', 54, HOT, -96], ['18', 150, INK, 4], ['2013', 46, INK, 100]]);
    P.sep19 = page([['SEP', 54, HOT, -96], ['19', 150, INK, 4], ['2013', 46, INK, 100]]);
    P.nov19 = page([['NOV', 54, HOT, -96], ['19', 150, INK, 4], ['2026', 46, INK, 100]]);

    /* THE QUOTE CARD: Take-Two's own words, exactly, cut with … at both ends; never highlighted */
    P.quote = cardPiece(800, 470, CREAM, [['“…the fastest that any', 68, INK, -132, 'condensed'], ['entertainment property', 68, INK, -46, 'condensed'], ['… has reached this', 68, INK, 40, 'condensed'], ['significant milestone.”', 68, INK, 126, 'condensed']], { r: 10, ring: 'rgba(29,18,51,.18)', before: function (g) {
      g.fillStyle = 'rgba(29,18,51,.05)'; for (var y = -220; y < 230; y += 10) g.fillRect(-390, y, 780, 1);
      g.fillStyle = HOT; g.fillRect(-400, -235, 14, 470);
    } });

    /* THE RACE: day blocks (calendar pages seen edge-on), a plain game case with our own GTA 5 type, a ticket */
    P.block = piece([-110, -15, 110, 15], function (g) { rr(g, -110, -15, 220, 30, 4); }, CREAM, { sx: 2, sy: 4, blur: 5, edge: 1.4, extra: function (g) { g.fillStyle = ORG; g.fillRect(-110, -15, 220, 7); g.fillStyle = 'rgba(29,18,51,.15)'; g.fillRect(-100, 4, 200, 2); } });
    P.caseP = cardPiece(200, 250, DEEP, [['GTA 5', 70, CREAM, 18]], { r: 10, before: function (g) {
      g.fillStyle = 'rgba(255,255,255,.08)'; g.fillRect(-100, -125, 22, 250);
      g.fillStyle = HOT; g.fillRect(-70, -92, 150, 14); g.fillStyle = ORG; g.fillRect(-70, 76, 150, 10);
    } });
    P.ticket = cardPiece(340, 172, ORG, [['THE AVENGERS', 50, INK, -22], ['(2012)', 42, INK, 34]], { r: 6, path: function (g) {
      g.beginPath(); g.moveTo(-170, -86); g.lineTo(170, -86); g.lineTo(170, -22); g.arc(170, 0, 22, -Math.PI / 2, Math.PI / 2, true); g.lineTo(170, 86); g.lineTo(-170, 86); g.lineTo(-170, 22); g.arc(-170, 0, 22, Math.PI / 2, -Math.PI / 2, true); g.closePath();
    }, after: function (g) { g.strokeStyle = 'rgba(29,18,51,.35)'; g.lineWidth = 3; g.setLineDash([8, 7]); g.beginPath(); g.moveTo(-118, -76); g.lineTo(-118, 76); g.stroke(); g.setLineDash([]); } });
    P.stamp = solidStamp('3 VS 19 DAYS', 150, 740);

    /* THE TOWER: plain game cases, spines out, no text but the first one's */
    var SPC = [DEEP, '#7a2d6b', '#a8542a', '#24497a', DEEP, '#5b2a7e'];
    P.slabs = SPC.map(function (c, i) { return piece([-160, -24, 160, 24], function (g) { rr(g, -160, -24, 320, 48, 5); }, c, { sx: 3, sy: 6, blur: 6, edge: 1.6, extra: function (g) { g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(-160, -24, 320, 6); g.fillStyle = i % 2 ? TEAL : HOT; g.fillRect(-150, -8, 34, 16); g.fillStyle = 'rgba(251,240,234,.55)'; g.fillRect(96, -6, 46, 12); } }); });
    P.counter = piece([-410, -82, 410, 82], function (g) { rr(g, -410, -82, 820, 164, 12); }, CREAM, { sx: 6, sy: 12, blur: 16, extra: function (g) { g.fillStyle = 'rgba(29,18,51,.06)'; for (var x = -400; x < 400; x += 64) g.fillRect(x, -82, 2, 164); g.fillStyle = HOT; g.fillRect(-410, -82, 820, 10); } });

    /* pills, labels, the vote */
    P.pill5 = cardPiece(300, 96, HOT, [['GTA 5', 74, INK, 3]], { r: 48, ring: 'rgba(255,240,234,.9)' });
    P.pill6 = cardPiece(300, 96, HOT, [['GTA 6', 74, INK, 3]], { r: 48, ring: 'rgba(255,240,234,.9)' });
    function tagPiece(word, w, px) { return cardPiece(w, 140, CREAM, [[word, px, INK, 6, null, 14]], { r: 8, ring: 'rgba(29,18,51,.25)', path: function (g) { g.beginPath(); g.moveTo(-w / 2 + 34, -70); g.lineTo(w / 2, -70); g.lineTo(w / 2, 70); g.lineTo(-w / 2 + 34, 70); g.lineTo(-w / 2, 36); g.lineTo(-w / 2, -36); g.closePath(); }, after: function (g) { g.fillStyle = '#5a3a1a'; g.beginPath(); g.arc(-w / 2 + 24, 0, 8, 0, TAU); g.fill(); } }); }
    P.yes = tagPiece('YES', 290, 96); P.no = tagPiece('NO', 290, 96);
    P.pin = piece([-16, -16, 16, 16], function (g) { g.beginPath(); g.arc(0, 0, 14, 0, TAU); }, TEAL, { sx: 3, sy: 5, blur: 5, edge: 1.5, after: function (g) { g.fillStyle = 'rgba(255,255,255,.6)'; g.beginPath(); g.arc(-4, -4, 4, 0, TAU); g.fill(); } });
  }
  /* the one hero stamp: solid ink on cream, one line, ~800 px wide */
  function solidStamp(text, px, maxw) {
    var m = mk(4, 4).getContext('2d'); cond(m); font(m, px, 900); ls(m, 2); var w1 = m.measureText(text).width; if (w1 > maxw) { px = Math.floor(px * maxw / w1); font(m, px, 900); w1 = m.measureText(text).width; } unst(m);
    var w = w1 + 60, h = px * 1.05 + 60, tp = jag(95, w, 4), bt = jag(96, w, 4), rec = [];
    var pc = piece([-w / 2, -h / 2 - 8, w / 2, h / 2 + 8], function (g) { g.beginPath(); g.moveTo(-w / 2, -h / 2 + tp[0][1]); tp.forEach(function (q) { g.lineTo(-w / 2 + q[0], -h / 2 + q[1]); }); for (var i = bt.length - 1; i >= 0; i--) g.lineTo(-w / 2 + bt[i][0], h / 2 + bt[i][1]); g.closePath(); }, CREAM, { sx: 8, sy: 14, blur: 20, extra: function (g) {
      g.strokeStyle = HOT; g.lineWidth = 12; g.strokeRect(-w / 2 + 14, -h / 2 + 14, w - 28, h - 28);
      cond(g); font(g, px, 900); ls(g, 2); g.fillStyle = INK; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, 0, px * .05); unst(g);
      rec.push([-w1 / 2, -px * .45, w1 / 2, px * .45, text]);
    } });
    pc.words = rec.map(function (r0) { return [r0[0] - pc.x0, r0[1] - pc.y0, r0[2] - pc.x0, r0[3] - pc.y0, r0[4]]; });
    pc.sw = w; pc.sh = h; return pc;
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
     THE PROPS, all in screen space. Times live in T (set in initTimes from the voice).
     ===================================================================================================== */
  var T = {}, LIVE2 = { bg: true, clip: true };
  function seamS(t) { return t < DUR / 2 ? t : t - DUR; }
  /* rise from behind the desk lip (k 0..1) and sink back (o 0..1): returns the y offset */
  function riseY(t, tin, tout, depth, w) { var k = cd(t, tin, w || 13), o = eio(seg(t, tout, tout + .42)); return (1 - k) * depth + o * depth; }

  /* the brick: falls through the loop point and lands at s = .03; sinks behind the desk on "That's" */
  var BR = { x: 510, y: 760 };
  function brick(g, t) {
    var s = seamS(t);
    if (t > T.brickOut + .5 && t < DUR - .7) return;
    var fk = seg(s, -.6, -.15), dy = -230 * (1 - fk * fk);
    var sq = s >= -.15 ? kn(s, -.15, .02) : 1;
    var outY = t < DUR / 2 ? eio(seg(t, T.brickOut, T.brickOut + .5)) * 820 : 0;
    if (t > DUR - .7 && s < -.6) return;
    var y = BR.y + dy + outY + 4 * osc(t, 4);
    g.save(); g.translate(BR.x, y + 520); g.scale(1 + (sq - 1) * .5, 2 - sq); g.translate(0, -520);
    put(g, P.brickFront, 0, 0); put(g, P.brickTop, 0, 0);
    NOREC = Math.abs(dy) > 1 || outY > 1; putW(g, P.band, 0, 255); NOREC = false;
    /* loose bills flutter down onto the top in the first second */
    [[.4, -170, -120, .2], [.65, 140, -150, -.25], [.9, -10, -95, .08]].forEach(function (b, i) {
      if (s < b[0] - .38) return;
      var k = eio(seg(s, b[0] - .38, b[0])), bx = b[1] + (1 - k) * (i % 2 ? -120 : 120) * Math.sin(k * 3), by = lerp(-560, b[2], k);
      g.save(); g.translate(bx, by); g.rotate(b[3] + (1 - k) * (i % 2 ? .9 : -.9)); g.scale(1, lerp(.55, .42, k)); put(g, P.bill, 0, 0); g.restore();
    });
    g.restore();
  }
  /* the pad: small on the brick's corner on "billion"; grows to the hero spot on "That's"; pages tear off */
  function padAt(g, x, y, s, rot, pages, tearK, tearSeed) {
    g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s);
    put(g, P.padBack, 0, 0);
    /* the page under, then the top page; a tearing page lifts from its top edge and flies up-left */
    var under = pages[1], top = pages[0], nr = NOREC, PH2 = (PAD_H - 70) / 2;
    if (under && tearK > 0) { NOREC = nr || tearK < .5; putW(g, under, 0, 26); }
    if (top) {
      if (tearK > 0) {
        var k = tearK; g.save(); g.translate(0, 26 - PH2); g.translate((tearSeed % 2 ? 40 : -40) * k, -1300 * k * k); g.rotate(-.35 * k * (tearSeed % 2 ? -1 : 1)); g.globalAlpha *= 1 - seg(k, .7, 1);
        NOREC = true; putW(g, top, 0, PH2); g.restore();
      } else { NOREC = nr; putW(g, top, 0, 26); }
    }
    NOREC = nr;
    put(g, P.binding, 0, 0);
    g.restore();
  }
  function calendar(g, t) {
    /* scene 1-2 */
    if (t >= T.pad0 - .02 && t < T.padOut + .6) {
      var k0 = cd(t, T.pad0, 20), gk = eio(seg(t, T.padGrow, T.padGrow + .6)), ok = eio(seg(t, T.padOut, T.padOut + .5));
      var x = lerp(715, 510, gk), y = lerp(lerp(1262, 1284, k0), 905, gk) - ok * 1100, s = lerp(.95 * lerp(1.12, 1, k0), 1.72, gk) * kn(t, T.pad0, .07), rot = lerp(.05, -.015, gk) - (1 - k0) * .08 + .01 * osc(t, 5);
      var pages, tk = 0, seed = 0;
      var tears = [T.tear0, T.tear1, T.tear2], seq = [P.cover, P.sep17, P.sep18, P.sep19], i = 0;
      while (i < 3 && t >= tears[i] + .45) i++;
      pages = [seq[i], seq[i + 1]];
      if (i < 3 && t >= tears[i]) { tk = seg(t, tears[i], tears[i] + .45); seed = i; }
      g.save(); g.globalAlpha *= fin(t, T.pad0, .06);
      NOREC = k0 < .98 || (gk > .001 && gk < .999) || ok > 0;
      padAt(g, x, y, s, rot, pages, tk, seed); NOREC = false;
      g.restore();
    }
  }
  function calendar2(g, t) {
    /* scene 6-7: NOV 19 rises big on "GTA 6"; for the vote it moves right; the 3 DAYS pad rises on the left */
    if (t >= T.padIn2 - .02 && t < T.clear + .6) {
      var dy = riseY(t, T.padIn2, T.clear, 1000, 11), mk2 = eio(seg(t, T.endIn, T.endIn + .55));
      var x = lerp(510, 712, mk2), y = lerp(890, 905, mk2) + dy, s = lerp(1.72, 1.06, mk2) * kn(t, T.kNov, .03), rot = lerp(.012, .03, mk2) + .01 * osc(t, 5, 1);
      NOREC = dy > 1 || (mk2 > .001 && mk2 < .999);
      padAt(g, x, y, s, rot, [P.nov19], 0, 0); NOREC = false;
    }
    if (t >= T.endIn - .02 && t < T.clear + .6) {
      var dy2 = riseY(t, T.endIn + .1, T.clear, 900, 13);
      NOREC = dy2 > 1;
      padAt(g, 302, 905 + dy2, 1.06 * kn(t, T.kThree, .04), -.03 + .01 * osc(t, 5, 2), [P.cover], 0, 0); NOREC = false;
    }
  }
  /* the quote card */
  function qXf(t) {
    var k = cd(t, T.quoteIn, 12), up = eio(seg(t, T.qUp, T.qUp + .5)), o = eio(seg(t, T.quoteOut, T.quoteOut + .4));
    return { y: lerp(860 + (1 - k) * 900, 596, up) - o * 1300, s: lerp(1, .66, up), moving: k < .98 || (up > .001 && up < .999) || o > 0 };
  }
  function quoteCard(g, t) {
    if (t < T.quoteIn - .02 || t > T.quoteOut + .6) return;
    var q = qXf(t);
    NOREC = q.moving;
    putW(g, P.quote, 510, q.y, -.012 + .006 * osc(t, 6), q.s); NOREC = false;
  }
  /* the race: day blocks stack up, one per day; the case rides its 3, the ticket rides its 19 */
  var COLX = [330, 692], COLB = 1432;
  function growK(t) { return eio(seg(t, T.grow, T.grow + .45)); }
  function raceDays(t) {
    var g5 = 3 * eio(seg(t, T.case0, T.case1));
    var mv = 19 * seg(t, T.tix0, T.tix1);
    return [g5, mv];
  }
  function column(g, t, x, n, dy) {
    var DAYH = lerp(20, 44, growK(t)), full = Math.floor(n), frac = n - full;
    for (var i = 0; i < full + 1 && i < 20; i++) {
      var a = i < full ? 1 : frac; if (a <= 0) continue;
      var yy = COLB - DAYH * (i + .5) + dy - (i < full ? 0 : (1 - a) * 18);
      g.save(); g.globalAlpha *= i < full ? 1 : a; put(g, P.block, x + (i % 2 ? 2 : -2), yy, (i % 3 - 1) * .006, 1, DAYH / 32); g.restore();
    }
    return COLB - DAYH * n + dy;
  }
  function race(g, t) {
    if (t < T.raceIn - .02 || t > T.raceOut + .6) return;
    var o = eio(seg(t, T.raceOut, T.raceOut + .4)), dy = (1 - cd(t, T.raceIn, 12)) * 700 - o * 1500, d = raceDays(t), gk = growK(t), ts = lerp(.8, 1, gk);
    var topL = column(g, t, COLX[0], d[0], dy), topR = column(g, t, COLX[1], d[1], dy);
    NOREC = dy > 1 || dy < -1 || (gk > .001 && gk < .999);
    putW(g, P.caseP, COLX[0], topL - 125 * ts - 2, -.02 + .01 * osc(t, 6), ts * kn(t, T.case1, .05));
    putW(g, P.ticket, COLX[1], topR - 86 * ts - 2, .015 * Math.sin(t * 9) * (t < T.tix1 ? 1 : 0) + .01 * osc(t, 6, 1), ts * kn(t, T.tix1, .05));
    NOREC = false;
    /* labels only once the blocks have stopped: 3 DAYS on the case; 19 DAYS on the ticket in the hero frame */
    if (t >= T.lab5 - .02) chipAt(g, t, '3 DAYS', COLX[0], topL - 250 * ts - 40, T.lab5, T.raceOut, { px: 52, bg: CREAM, from: -30 });
    if (t >= T.lab19 - .02) chipAt(g, t, '19 DAYS', COLX[1], topR - 172 - 44, T.lab19, T.raceOut, { px: 52, bg: CREAM, from: -20 });
  }
  /* the tower of cases rises out of the desk while the counter rolls in round millions */
  function towerCount(t) { var tq = (Math.floor(t * 30) + .5) / 30; return Math.round(230 * eio(seg(tq, T.c0, T.c1))); }
  function tower(g, t) {
    if (t < T.towerIn - .02 || t > T.towerOut + .6) return;
    var k = eio(seg(t, T.towerIn, T.c1 + .05)), o = eio(seg(t, T.towerOut, T.towerOut + .45));
    var rise = (1 - k) * 660 + o * 760;
    for (var c = 0; c < 2; c++) for (var i = 0; i < 12; i++) {
      var x = 345 + c * 330 + ((i * 7 + c * 3) % 5 - 2) * 4, y = COLB - 26 - i * 50 + rise + (c ? 25 : 0);
      if (y > LIP + 30) continue;
      put(g, P.slabs[(i + c * 3) % P.slabs.length], x, y, ((i + c) % 3 - 1) * .012);
    }
    if (t >= T.lastCase - .4) { var lk = seg(t, T.lastCase - .35, T.lastCase); lk = lk * lk; put(g, P.slabs[2], 348, lerp(-200, COLB - 26 - 12 * 50, lk) + o * 760, .02); }
    /* the counter strip */
    var n = towerCount(t), landed = t >= T.c1, ck = cd(t, T.towerIn, 14);
    var cy = lerp(700, 640, cd(t, T.raceOut + .2, 14)) - o * 40;
    g.save(); g.globalAlpha *= fin(t, T.raceOut + .2, .1) * (1 - o);
    put(g, P.counter, 510, cy, -.01);
    var str = n + ',000,000' + (landed ? '+' : '');
    if (n === 0) str = '0';
    NOREC = !landed || o > 0;
    g.save(); g.translate(510, cy + 6); g.rotate(-.01); g.scale(kn(t, T.c1, .05) * kn(t, T.lastCase, .03), kn(t, T.c1, .05) * kn(t, T.lastCase, .03)); txt(g, str, 0, 0, { px: 128, align: 'center', col: INK, ls: 2 }); g.restore();
    NOREC = false; g.restore();
  }
  /* chips and tags (glass) */
  function chipAt(g, t, text, x, y, tin, tout, o) {
    o = o || {}; if (t < tin - .02 || t > tout + .3) return;
    var k = cd(t, tin, 14); NOREC = k < .98 || t > tout;
    chip(g, text, x, y + (1 - k) * (o.from || -40), { px: o.px || 36, bg: o.bg || ORG, fg: INK, a: fin(t, tin, .08) * (1 - seg(t, tout, tout + .25)), rot: o.rot || 0, s: kn(t, tin + .1, .05) });
    NOREC = false;
  }
  function dropTag(g, t, Pc, x, y, tin, tout, knock, o) {
    o = o || {}; if (t < tin - .02 || t > tout + .5) return;
    var k = cd(t, tin, 16), out = eio(seg(t, tout, tout + .4)), w2 = (Pc.w - 72) / 2;
    var yy = lerp(y - (o.from || 220), y, k) - out * 160, rot = (o.rot || 0) + sw(t, tin + .08, .08, 8, 2.8) + .015 * osc(t, 7, x) + (knock ? sw(t, knock, .05, 10, 3) : 0), s = knock ? kn(t, knock, .08) : 1;
    g.save(); g.globalAlpha *= fin(t, tin, .08) * (1 - out); g.translate(x - w2 + 24, yy); g.rotate(rot); g.scale(s, s); g.translate(w2 - 24, 0);
    NOREC = k < .98 || out > 0; putW(g, Pc, 0, 0); NOREC = false;
    put(g, P.pin, -w2 + 24, 0);
    g.restore();
  }
  /* the movie line's caption: one card, so GTA 5 never sits over "took nineteen days"; 19 DAYS lands on "nineteen" */
  function movieCard(g, t) {
    if (t < T.mcIn - .02 || t > T.grow + .4) return;
    var a = fin(t, T.mcIn, .1) * (1 - seg(t, T.grow, T.grow + .25)); if (a <= 0) return;
    var p1 = 'FASTEST MOVIES (2012):', p2 = '19 DAYS', y = 878, k = cd(t, T.mcIn, 16);
    g.save(); g.globalAlpha *= a; cond(g); font(g, 56, 900); ls(g, 1);
    var w1 = g.measureText(p1 + ' ').width, w = w1 + g.measureText(p2).width, x0 = 510 - w / 2;
    g.translate(0, (1 - k) * 24);
    g.save(); g.shadowColor = 'rgba(6,3,18,.55)'; g.shadowBlur = 12; g.shadowOffsetY = 8; rr(g, x0 - 22, y - 40, w + 44, 80, 6); g.fillStyle = NEWS; g.fill(); g.restore();
    g.textBaseline = 'middle'; g.textAlign = 'left'; g.fillStyle = INK; NOREC = k < .98 || t > T.grow; g.fillText(p1, x0, y + 3);
    if (t >= T.tix1) { var kk = kn(t, T.tix1, .1); g.save(); g.translate(x0 + w1, y + 3); g.scale(kk, kk); g.fillStyle = HOT; g.fillText(p2, 0, 0); g.restore(); }
    NOREC = false; g.restore(); unst(g); ls(g, 0);
  }
  function glass(g, t) {
    chipAt(g, t, 'TAKE-TWO ESTIMATE', 510, 1330, T.estIn, T.estOut, { px: 56, bg: ORG });
    if (t >= T.qsrc - .02 && t < T.quoteOut + .5) { var q = qXf(t); chipAt(g, t, 'TAKE-TWO, SEPT 20 2013', 510, q.y + 230 * q.s + 36, T.qsrc, T.quoteOut, { px: 46, bg: ORG, rot: -.01 }); if (q.moving) NOREC = false; }
    movieCard(g, t);
    if (t >= T.stamp - .02 && t < T.stampOut + .5) {
      var sk = cd(t, T.stamp, 30), ss = lerp(1.08, 1, sk), so = eio(seg(t, T.stampOut, T.stampOut + .3));
      g.save(); g.globalAlpha *= clamp((t - T.stamp) * 14, 0, 1) * (1 - so); g.translate(510, 820 - so * 40); g.rotate(-.03); g.scale(ss * (1 - so * .2), ss * (1 - so * .2));
      NOREC = sk < .98 || so > 0; putW(g, P.stamp, 0, 0); NOREC = false; g.restore();
    }
    if (t < T.towerOut + .5) chipAt(g, t, 'SOLD-IN · TAKE-TWO, AUG 2026', 510, 755, T.srcIn, Math.min(T.srcOut, T.towerOut + .2), { px: 48, bg: ORG, rot: .008, from: -20 });
    chipAt(g, t, 'GTA 5', 302, 1155, T.endIn + .35, T.clear, { px: 60, bg: HOT });
    chipAt(g, t, 'GTA 6', 712, 1155, T.endIn + .35, T.clear, { px: 60, bg: HOT });
    dropTag(g, t, P.yes, 300, 1330, T.vote, T.clear, T.kYes, { rot: -.02 });
    dropTag(g, t, P.no, 720, 1330, T.vote, T.clear, T.kNo, { rot: .02 });
  }
  /* the GTA pill: big on frame 0, steps up to the top when the captions start, flips to GTA 6, steps out for the vote,
     comes back big for the loop */
  function pill(g, t) {
    var mv = eio(seg(t, T.pillUp, T.pillUp + .5)), back = seg(t, DUR - .55, DUR - .2);
    var a = (1 - seg(t, T.pillOut, T.pillOut + .25)) + back;
    if (t < DUR - .55) a = (1 - seg(t, T.pillOut, T.pillOut + .25)) * (1 - seg(t, T.pHide, T.pHide + .2) * (1 - seg(t, T.pBack, T.pBack + .25)));
    a = clamp(a, 0, 1); if (a <= 0) return;
    var big = t >= DUR - .55 ? 1 : 1 - mv;
    var x = 510, y = lerp(340, 400, big), s = lerp(1, 1.62, big);
    var fl = seg(t, T.flip, T.flip + .3), six = fl >= .5 && t < DUR - .6, sy = Math.abs(Math.cos(fl * Math.PI));
    var s0 = seamS(t), knock = kn(s0, .03, .07) * kn(t, T.flip + .3, .06);
    g.save(); g.globalAlpha *= a; NOREC = a < .98 || (t > T.pHide && t < T.pBack + .3) || (mv > .001 && mv < .999) || (fl > 0 && fl < 1) || (t > DUR - .55 && t < DUR - .2);
    g.translate(x, y); g.scale(s * knock, s * knock * Math.max(.04, sy)); putW(g, six ? P.pill6 : P.pill5, 0, 0); NOREC = false; g.restore();
  }
  function world(g, t) {
    g.save(); if (LIVE2.bg) put(g, P.wall, 0, 0); else { g.fillStyle = BG; g.fillRect(0, 0, W, H); } g.restore();
    g.save(); g.beginPath(); if (LIVE2.clip) g.rect(BX0, 0, BX1 - BX0, LIP); else g.rect(-500, -500, 2080, LIP + 500); g.clip();
    brick(g, t); calendar(g, t); quoteCard(g, t); race(g, t); tower(g, t); calendar2(g, t);
    g.restore();
  }

  /* ---------- captions (the voice, phrase by phrase; the hook line is carried by the picture) ---------- */
  var GLUE = { the: 1, a: 1, an: 1, your: 1, its: 1, of: 1, at: 1, to: 1, and: 1, in: 1, with: 1, on: 1, by: 1, so: 1, for: 1, own: 1, how: 1, that: 1, if: 1, you: 1, no: 1, or: 1, it: 1 };
  var CAPS = (function () {
    var outc = [];
    VO.lines.forEach(function (l) {
      if (l.id === 'hook') return;
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
  var CAPY = 476;
  function captions(g, t) {
    var card0 = null, ci = -1;
    CAPS.forEach(function (c, i) { if (t >= c.t0 - .04) { card0 = c; ci = i; } });
    if (!card0) return;
    var nx = CAPS[ci + 1], ns = nx ? nx.t0 - .04 : 1e9, o1 = Math.min(card0.t1 + .5, ns - .12), o0 = Math.min(card0.t1 + .35, o1 - .12);
    var fi = seg(t, card0.t0 - .04, card0.t0 + .06), outk = 1 - seg(t, o0, o1);
    if (fi * outk <= 0) return;
    if (t > T.qUp - .1 && t < T.raceOut + .15) return;
    var CY = CAPY, k = cd(t, card0.t0 - .04, 16);
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

  var NOISE, POSTERMODE = false, VIG = null;
  function stage(g) { g.fillStyle = BG; g.fillRect(0, 0, W, H); }
  function vignette(g) {
    if (!VIG) { VIG = mk(W, H); var q = VIG.getContext('2d'), gr = q.createRadialGradient(510, 880, 460, 510, 900, 1250); gr.addColorStop(0, 'rgba(6,3,18,0)'); gr.addColorStop(1, 'rgba(6,3,18,.45)'); q.fillStyle = gr; q.fillRect(0, 0, W, H); }
    g.drawImage(VIG, 0, 0);
  }
  function frame(g, t) {
    g.setTransform(1, 0, 0, 1, 0, 0);
    stage(g);
    world(g, t);
    if (LIVE2.bg) vignette(g);
    g.save(); g.beginPath(); if (LIVE2.clip) g.rect(BX0, 0, BX1 - BX0, LIP); else g.rect(-500, -500, 2080, LIP + 500); g.clip();
    glass(g, t); pill(g, t);
    g.restore();
    if (!POSTERMODE && LIVE.text) captions(g, t);
    if (LIVE.grain && NOISE && LIVE2.bg) { g.globalAlpha = .05; g.globalCompositeOperation = 'overlay'; var o = Math.floor(t * 24) * 37 % 256; g.fillStyle = g.createPattern(NOISE, 'repeat'); g.translate(-o, -o); g.fillRect(o, o, W, H); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }
  }
  var QTXT = '“…the fastest that any entertainment property … has reached this significant milestone.”';
  function TEXTS(t) {
    var o = [];
    function Tx(id, text, a, b) { if (t >= a && t < b) o.push({ id: id, text: text, x0: 0, y0: 0, x1: 0, y1: 0 }); }
    Tx('pill', 'GTA 5', 0, T.pHide); Tx('pill', 'GTA 5', T.pBack + .25, T.flip + .1); Tx('pill6', 'GTA 6', T.flip + .2, T.pillOut + .05); Tx('pill', 'GTA 5', DUR - .3, DUR + 1);
    Tx('band', '$1 BILLION', 0, T.brickOut + .1);
    Tx('cover', '3 DAYS', T.pad0 + .1, T.tear0 + .2); Tx('cover', '3 DAYS', T.endIn + .4, T.clear + .05);
    Tx('cal', 'SEP 17-19 2013', T.tear0 + .3, T.padOut + .1);
    Tx('est', 'TAKE-TWO ESTIMATE', T.estIn + .15, T.estOut + .05);
    Tx('quote', QTXT, T.quoteIn + .3, T.quoteOut + .05);
    Tx('qsrc', 'TAKE-TWO, SEPT 20 2013', T.qsrc + .15, T.quoteOut + .05);
    Tx('mcap', 'FASTEST MOVIES (2012):', T.mcIn + .1, T.grow + .1);
    Tx('case', 'GTA 5', T.raceIn + .3, T.raceOut + .05);
    Tx('ticket', 'THE AVENGERS (2012)', T.raceIn + .3, T.raceOut + .05);
    Tx('d3', '3 DAYS', T.lab5 + .15, T.raceOut + .05); Tx('d19', '19 DAYS', T.tix1 + .1, T.grow + .05); Tx('d19', '19 DAYS', T.lab19 + .15, T.raceOut + .05);
    Tx('stamp', '3 VS 19 DAYS', T.stamp + .05, T.stampOut + .05);
    Tx('count', '230,000,000+', T.c1, T.towerOut + .05);
    Tx('src', 'SOLD-IN · TAKE-TWO, AUG 2026', T.srcIn + .15, Math.min(T.srcOut, T.towerOut + .2) + .05);
    Tx('nov', 'NOV 19 2026', T.padIn2 + .3, T.clear + .1);
    Tx('l5', 'GTA 5', T.endIn + .5, T.clear + .05); Tx('l6', 'GTA 6', T.endIn + .5, T.clear + .05);
    Tx('yes', 'YES', T.vote + .2, T.clear + .05); Tx('no', 'NO', T.vote + .2, T.clear + .05);
    return o;
  }
  function need(text) { return Math.max(1.8, text.replace(/\s/g, '').length / 15 + 1.5) + .25; }

  /* ---------- events: hits placed in real pauses of the voice (vo/vad.js); beats with no free pause stay silent ---------- */
  function initTimes() {
    /* hook: frame 0 is the landed brick (it fell at the end of the last loop); the 3 DAYS pad slaps on beside the band on "Three" */
    T.pad0 = at('hook', 'three') - .04;
    G('padSlap', T.pad0, 'slap', .2, .8);
    /* three: the brick sinks and the 3 DAYS cover tears off as the pad steps up to the hero spot */
    T.tear0 = G('tear0', after('hook') - .02, 'tear', .3, 1);
    T.brickOut = T.tear0 - .05; T.padGrow = T.tear0 - .05; T.pillUp = T.tear0 - .1;
    T.tear1 = at('three', 'estimate'); T.tear2 = at('three', 'september');
    G('tear1', T.tear1, 'tear', .15, .8); G('tear2', T.tear2, 'tear', .15, .8);
    T.estIn = T.tear0 + .05;
    /* said: the pad flies off as the quote card rises on the last word of "three" */
    T.padOut = lastw('three') - .45; T.quoteIn = T.padOut + .05;
    G('quoteS', T.quoteIn, 'swish', .3, .7);
    T.estOut = T.padOut + .1;
    T.qsrc = at('said', 'said');
    T.quoteOut = Math.max(T.quoteIn + .3 + need(QTXT) - .2, T.qsrc + need('TAKE-TWO, SEPT 20 2013'));
    /* movie: the quote steps up to a header and the race board rises under it; GTA 5's three days stack at once,
       the ticket's blocks count up with no label from "movies" to "nineteen"; the caption is one card */
    T.qUp = start('movie') - .45; T.raceIn = T.qUp - .05; T.pHide = start('movie') - .45; T.mcIn = T.qUp + .1;
    G('raceS', T.raceIn, 'thock', .3, .8);
    T.case0 = T.raceIn + .35; T.case1 = T.case0 + .35; T.lab5 = T.case1 + .05;
    T.tix0 = at('movie', 'movies'); T.tix1 = at('movie', 'nineteen') + .04;
    /* the hero frame: the quote leaves, the race grows to fill the frame, the one stamp lands in the written pause */
    T.grow = Math.max(T.quoteOut - .1, lastw('movie') + .05, T.mcIn + 3.05); T.lab19 = T.grow + .35;
    G('growS', T.grow, 'swish', .2, .7);
    T.stamp = G('stamp', T.grow + .45, 'stamp', .3, 1.2, { heavy: true });
    T.stampOut = T.stamp + 2.6;
    T.raceOut = T.stampOut;
    /* still: cases rise under the race as it lifts away; the counter rolls in round millions and lands on "230";
       only then the SOLD-IN tag; a last case drops onto the tower in the pause */
    T.towerIn = T.raceOut - .15; T.c0 = T.raceOut + .2; T.c1 = at('still', '230') + .05; T.pBack = T.raceOut + .3;
    T.srcIn = T.c1 + .05;
    T.srcOut = T.srcIn + need('SOLD-IN · TAKE-TWO, AUG 2026');
    T.lastCase = G('lastCase', after('still') + .25, 'thock', .3, 1);
    T.towerOut = Math.max(after('still') + .6, T.srcOut - .3, T.c1 + need('230,000,000+') - .2);
    G('towerS', T.towerOut, 'swish', .15, .7);
    /* six: NOV 19 rises; the pill flips to GTA 6 */
    T.padIn2 = T.towerOut + .02; T.flip = T.towerOut + .05;
    G('flip', T.flip, 'tick', .1, .8);
    T.kNov = at('six', 'november');
    /* end: the 3 DAYS pad comes back beside NOV 19; YES and NO pinned together; everything sinks; the brick falls back */
    T.endIn = start('end') - .35; T.pillOut = T.endIn;
    G('endS', T.endIn, 'tick', .2, .6);
    T.kThree = at('end', 'three');
    T.vote = T.endIn + .45; T.kYes = at('end', 'yes'); T.kNo = at('end', 'no');
    T.clear = Math.max(lastw('end') + .12, DUR - .95);
    G('clearS', T.clear, 'swish', .3, .5);
    G('land0', DUR - .15, 'land', .1, .7);
    STRESS = [['end', 'three']].map(function (p) { return at(p[0], p[1]); });
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

  /* ---------- sound: paper and desk foley, written into the pauses; no music (Isac adds a TikTok sound) ---------- */
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
    function stamp(t, g, heavy) { tick(t, 1.6 * g, 2400); thump(t, .7 * g); if (heavy) boom(t + .01, .55 * g, 110, 42, .25); var sn = noise(t, .12), sl = ac.createBiquadFilter(); sl.type = 'lowpass'; sl.frequency.value = 1500; var so = bus(1); sn.connect(sl); sl.connect(so); env(so.gain, [[t, 0], [t + .004, .32 * g], [t + .1, 0]]); }
    function slap(t, g) { band(t, t + .1, 1800, 900, .14 * g, .02 * g, .9); thump(t + .005, .26 * g, 140); for (var j = 0; j < 4; j++) tick(t + .03 + j * .025, (.2 + rnd() * .2) * g); }
    function swish(t, g) { band(t, t + .26, 600, 3600, .09 * g, .02 * g, 1.3, -.2); }
    /* paper tearing along a perforation: a train of fibre ticks over a rising band */
    function tear(t, g) { for (var j = 0; j < 8; j++) tick(t + .012 * j + rnd() * .006, (.35 + rnd() * .4) * g, 1800 + rnd() * 2400); band(t, t + .1, 1400, 4200, .07 * g, .02 * g, 1.4, .15); }
    /* a heavy paper stack landing on a desk */
    function land(t, g) { thump(t, .55 * g, 120); band(t, t + .08, 900, 400, .1 * g, .01 * g, .8); }
    function thock(t, g) { thump(t, .35 * g, 220); tick(t, .9 * g, 1800); }
    var LEVEL = { stamp: .5, swish: 1.6, slap: 1.4, tick: 1.6, tear: 1.3, land: 1.2, thock: 1.4 };
    var TRIM = window.SFX_TRIM || { raceS: -4, growS: 12, clearS: 12, endS: 3 };
    EV.forEach(function (e) {
      var g = (e.g == null ? 1 : e.g) * (LEVEL[e.type] || 1) * Math.pow(10, (TRIM[e.id] || 0) / 20);
      if (e.type === 'stamp') stamp(e.t, g, e.heavy);
      else if (e.type === 'swish') swish(e.t, g);
      else if (e.type === 'slap') slap(e.t, g);
      else if (e.type === 'tear') tear(e.t, g);
      else if (e.type === 'land') land(e.t, g);
      else if (e.type === 'thock') thock(e.t, g);
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
    return Promise.all(fonts.map(function (f) { return document.fonts.load(f, 'Aa0%°×−≈≠µ“”’·→…#?‹|~$+—'); })).then(function () { return document.fonts.ready; }).then(function () {
      buildTextures();
      window.READY = true;
    });
  }

  window.FILM = { bare: function () { ctx.setTransform(1, 0, 0, 1, 0, 0); stage(ctx); }, W: W, H: H, DUR: DUR, POSTER: 0, SLUG: 'gta-money', SHOTS: [], init: init, render: render, frame: frame, LIVE: LIVE, LIVE2: LIVE2, T: T, GT: GT };
  var _bt = buildTextures; buildTextures = function () { _bt(); EV.length = 0; initTimes(); window.FILM.POSTER = Math.round((T.stamp + .6) * 30) / 30 + 1 / 60;
    window.FILM.SHOTS = [{ id: 'hook', name: 'A billion in 3 days', t0: 0, t1: start('said') }, { id: 'race', name: '3 vs 19', t0: start('said'), t1: T.raceOut }, { id: 'still', name: 'Still selling', t0: T.raceOut, t1: start('end') }, { id: 'vote', name: 'Yes or no?', t0: start('end'), t1: DUR }]; };
  window.BOUNDS_RUN = function (step) {
    BOUNDS = []; var o = {};
    for (var t = 0; t <= DUR + 1e-6; t += step || 1 / 15) { CURT = t; POSTERMODE = false; frame(ctx, t); }
    BOUNDS.forEach(function (b) { var r = o[b.text] || (o[b.text] = { text: b.text, from: b.t, to: b.t, x0: b.x0, x1: b.x1, y1: b.y1, n: 0 }); r.to = b.t; r.n++; r.x0 = Math.min(r.x0, b.x0); r.x1 = Math.max(r.x1, b.x1); r.y1 = Math.max(r.y1, b.y1); });
    BOUNDS = null; return Object.keys(o).map(function (k) { return o[k]; });
  };
  /* rail scan: with the bleed wall/desk off and no x clip, every shape and glyph must stay inside x 90-930 and above
     y 1450 (props below the desk lip at 1440 are behind the desk, which is drawn as the clip). Returns breaking frames. */
  window.RAIL_SCAN = function (fps, subs) {
    fps = fps || 30; subs = subs || 3; var bad = [], n = Math.round(DUR * fps), span = .5 / fps;
    LIVE2.bg = false; LIVE2.clip = false; var lg = LIVE.grain; LIVE.grain = false;
    function dirty(x, y, w, h) { var d = ctx.getImageData(x, y, w, h).data, o = { c: 0, x0: 1e9, x1: -1, y0: 1e9, y1: -1 }; for (var i = 0; i < d.length; i += 4) if (Math.abs(d[i] - 0x0b) + Math.abs(d[i + 1] - 0x08) + Math.abs(d[i + 2] - 0x20) > 24) { var px = (i / 4) % w, py = Math.floor(i / 4 / w); o.c++; o.x0 = Math.min(o.x0, px); o.x1 = Math.max(o.x1, px); o.y0 = Math.min(o.y0, y + py); o.y1 = Math.max(o.y1, y + py); } return o; }
    for (var i = 0; i < n; i++) for (var s = 0; s < subs; s++) {
      var t = (i + .5) / fps - span / 2 + span * (s + .5) / subs; frame(ctx, clamp(t, 0, DUR));
      var L0 = dirty(0, 0, 90, H), R0 = dirty(930, 0, 150, H), B0 = dirty(90, 1450, 840, H - 1450);
      if (L0.c + R0.c + B0.c > 0) { bad.push({ f: i, t: +t.toFixed(3), left: L0.c && [L0.c, L0.x0, L0.y0, L0.y1], right: R0.c && [R0.c, R0.x1 + 930, R0.y0, R0.y1], bottom: B0.c && [B0.c, B0.y1, B0.x0 + 90, B0.x1 + 90] }); break; }
    }
    LIVE2.bg = true; LIVE2.clip = true; LIVE.grain = lg; return bad;
  };
  window.DUR = DUR; window.EV = EV; window.TEXTS = TEXTS; window.SCORE = SCORE; window.READY = false;
  window.render = function (t, s, sh, fps) { render(t, s, sh, fps); };
})();
