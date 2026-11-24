/* "Every main GTA hero": Delta, pillar 3 (GTA history), an "Every X" catalog run as a quiz. Scope: the leads of the six
   main console GTA games since GTA III (2001): III, Vice City, San Andreas, IV, V, VI. Claude is unnamed and silent in GTA III
   (name given later, San Andreas 2004, per Wikipedia), so his card carries that fine print. GTA VI: rockstargames.com/VI
   ("Vice City, USA", "the state of Leonida", Jason and Lucia). 24 years = Vice City (Oct 2002) to GTA VI (Nov 19 2026), our
   math. Heroes are never drawn: each is a typed manila case card. Sources in BRIEF.md.
   A vertical film written in code, narrated first and cut to the voice: every beat is keyed to a word time from vo/vo.js
   (window.VO) with at(id, word); every hit sits in a pause the voice track really leaves (vo/vad.js). Pure function of t.
   Contract: window.FILM, DUR, render(t), READY, EV, TEXTS(t), SCORE(ctx). Engine from gta-streampeak; set and moves new. */
(function () {
  'use strict';
  var W = 1080, H = 1920, VO = window.VO, DUR = VO.dur, CX = 510;
  var BG = '#0e2a24', CREAM = '#fbf6ea';
  var HOT = '#e0283c', TEAL = '#2347c8', ORG = '#ff6a1f';
  var INK = '#14213d', PAPER = '#f2e5cd', NEWS = '#efe5cf', KRAFT = '#b8834b', KRAFT2 = '#8a5a2e', BENCH = '#1c1042';
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
    var lh = px * 1.2, h = lines.length * lh + 64 + (o.credit ? 52 : 0), top = jag(seed, w, 5), bot = jag(seed + 9, w, 5);
    function path(g) { g.beginPath(); g.moveTo(0, top[0][1]); top.forEach(function (p) { g.lineTo(p[0], p[1]); }); for (var i = bot.length - 1; i >= 0; i--) g.lineTo(bot[i][0], h + bot[i][1]); g.closePath(); }
    var rec = [];
    var pc = piece([0, -10, w, h + 10], path, NEWS, { sx: 6, sy: 12, blur: 16, extra: function (g) {
      /* faint newsprint ruling and a column line printed through the back */
      g.fillStyle = 'rgba(29,18,51,.05)'; for (var y = 18; y < h; y += 9) g.fillRect(0, y, w, 1);
      cond(g, 'condensed'); font(g, px, 800); ls(g, 0); g.fillStyle = INK; g.textBaseline = 'middle'; g.textAlign = 'left';
      lines.forEach(function (L, i) { var y = 32 + lh * (i + .5); g.fillText(L, 36, y); var mm = g.measureText(L); rec.push([36, y - px * .62, 36 + mm.width, y + px * .3, L]); });
      unst(g);
      if (o.credit) { g.fillStyle = 'rgba(22,32,58,.35)'; g.fillRect(36, 32 + lh * lines.length + 6, w - 72, 2); ptxt(g, rec, o.credit, 36, 32 + lh * lines.length + 34, 38, '#4a5674', { align: 'left', ls: 2, max: w - 72 }); }
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


  function stroke(g, col, w) { g.strokeStyle = col; g.lineWidth = w || 6; g.lineJoin = 'round'; g.lineCap = 'round'; g.stroke(); }
  /* text inside a piece: draws and records its box (piece coordinates) for the rail check */
  function ptxt(g, rec, s, x, y, px, col, o) {
    o = o || {}; cond(g, o.st || 'condensed'); font(g, px, o.wt || 900); ls(g, o.ls == null ? 1 : o.ls);
    if (o.max) while (g.measureText(s).width > o.max && px > 36) { px -= 2; font(g, px, o.wt || 900); }
    g.fillStyle = col; g.textAlign = o.align || 'center'; g.textBaseline = 'middle'; g.fillText(s, x, y);
    var w = g.measureText(s).width, x0 = o.align === 'left' ? x : o.align === 'right' ? x - w : x - w / 2;
    if (rec) rec.push([x0, y - px * .55, x0 + w, y + px * .45, s]); unst(g); return w;
  }
  function tw(s, px, st) { var m = mk(4, 4).getContext('2d'); cond(m, st || 'condensed'); font(m, px, 900); ls(m, 1); var w = m.measureText(s).width; unst(m); return w; }
  /* "GTA 5" in Delta pink followed by ink type, centred on x */
  function ptxt2(g, rec, a, b, x, y, px, ca, cb, max) {
    if (max) while (tw(a + b, px) > max && px > 36) px -= 2;
    var wa = tw(a, px), wb = tw(b, px), x0 = x - (wa + wb) / 2;
    ptxt(g, null, a, x0, y, px, ca, { align: 'left' }); ptxt(g, null, b, x0 + wa, y, px, cb, { align: 'left' });
    if (rec) rec.push([x0, y - px * .55, x0 + wa + wb, y + px * .45, a + b]);
  }
  function rectP(w, h, r) { return function (g) { rr(g, -w / 2, -h / 2, w, h, r || 6); }; }
  function grainLines(g, x0, y0, x1, y1, col, step, seed) { var r = mulberry(seed || 5); g.strokeStyle = col; g.lineWidth = 1.4; for (var y = y0 + 6; y < y1; y += step) { g.beginPath(); g.moveTo(x0, y + r() * 3); for (var x = x0; x < x1; x += 40) g.lineTo(x, y + (r() - .5) * 3); g.stroke(); } }

  function datePiece(top, main, w, band) {
    w = w || 330; var h = 200, rec = [];
    var pc = piece([-w / 2, -h / 2, w / 2, h / 2], rectP(w, h, 8), CRM, { sy: 10, blur: 14, extra: function (g) {
      g.fillStyle = band || RED2; g.fillRect(-w / 2, -h / 2, w, 46);
      [-w / 4, w / 4].forEach(function (x) { g.beginPath(); g.arc(x, -h / 2 + 23, 8, 0, TAU); g.fillStyle = '#2a1416'; g.fill(); });
      ptxt(g, rec, top, 0, -h / 2 + 76, 40, '#3b4566', { ls: 4 });
      ptxt(g, rec, main, 0, 46, 96, INK, { ls: 2 });
    } });
    return wordsOf(pc, rec);
  }
  function chipPiece(lines, w, bg, fg, o) {
    o = o || {}; var lh = o.lh || 64, h = (o.pad || 34) + lines.length * lh, rec = [];
    var pc = piece([-w / 2, -h / 2, w / 2, h / 2], rectP(w, h, 8), bg, { sy: 8, blur: 10, extra: function (g) {
      if (o.ring) { rr(g, -w / 2 + 8, -h / 2 + 8, w - 16, h - 16, 5); stroke(g, o.ring, 3); }
      lines.forEach(function (L, i) { ptxt(g, rec, L[0], 0, -h / 2 + (o.pad || 34) / 2 + lh * (i + .5) + 2, L[1], L[2] || fg, { ls: L[3] == null ? 1.5 : L[3], max: w - 36 }); });
    } });
    return wordsOf(pc, rec);
  }
  /* a rubber-stamp imprint: bled ink in a double border */
  function stampPiece(lines, col, w) {
    var lh = lines.map(function (L) { return L[1] * 1.08; }), h = lh.reduce(function (a, b) { return a + b; }, 0) + 70, rec = [];
    var pc = piece([-w / 2, -h / 2, w / 2, h / 2], function (g) { g.beginPath(); g.rect(-w / 2, -h / 2, w, h); }, 'rgba(0,0,0,0)', { shadow: false, grain: 0, edge: false, noclip: true, extra: function (g) {
      g.strokeStyle = col; g.lineWidth = 11; g.strokeRect(-w / 2 + 8, -h / 2 + 8, w - 16, h - 16); g.lineWidth = 4; g.strokeRect(-w / 2 + 24, -h / 2 + 24, w - 48, h - 48);
      var y = -h / 2 + 35;
      lines.forEach(function (L, i) { y += lh[i] / 2; var ww = inkText(g, L[0], 0, y + 2, L[1], col, 93 + i * 7, { dense: 24, big: 2.2, ls: 3 }); rec.push([-ww / 2, y - L[1] * .5, ww / 2, y + L[1] * .45, L[0]]); y += lh[i] / 2; });
      var r = mulberry(91); g.globalCompositeOperation = 'destination-out';
      for (var i = 0; i < 700; i++) { g.globalAlpha = .2 + r() * .55; g.beginPath(); g.arc(-w / 2 + r() * w, -h / 2 + r() * h, .5 + r() * 2.2, 0, TAU); g.fill(); }
    } });
    pc.sw = w; pc.sh = h; return wordsOf(pc, rec);
  }

  var T = {}, LIVE2 = { bg: true, clip: true };
  function tq(t) { return (Math.floor(t * 30) + .5) / 30; }
  /* a piece of paper dropped onto the pile: falls from above the frame (ease-in) and lands at tl; at tout it is
     pulled out upward from under whatever covers it. body(g) draws in the piece's own coordinates. */
  function drop(g, x, y, rot, tl, tout, t, body, o) {
    o = o || {}; var fd = o.fd || .32; if (t < tl - fd) return false;
    var od = o.od || .42; if (tout != null && t > tout + od) return false;
    var k = seg(t, tl - fd, tl), fall = (1 - k * k) * (o.fall || 1350), ko = tout != null ? eio(seg(t, tout, tout + od)) : 0;
    var s = (o.s || 1) * (o.knock === false ? 1 : kn(t, tl, .018));
    var nr = NOREC; NOREC = nr || k < 1 || ko > 0;
    g.save(); g.translate(x + (o.dx || 0) * (1 - k) + (o.ox || 0) * ko, y - fall - 1700 * ko); g.rotate(rot + (1 - k) * (o.spin == null ? .03 : o.spin) + (o.ospin == null ? .04 : o.ospin) * ko); g.scale(s, s);
    body(g, k, ko); g.restore(); NOREC = nr; return true;
  }
  /* a cover lifted off upward (grows a little as it comes toward the camera) */
  function lift(g, x, y, rot, tl, t, body, o) {
    o = o || {}; var d = o.d || .45; if (t > tl + d) return;
    var k = eio(seg(t, tl, tl + d)), s = 1 + .015 * Math.sin(Math.PI * Math.min(1, k * 1.6));
    var nr = NOREC; NOREC = nr || k > 0;
    g.save(); g.translate(x + (o.dx || 0) * k, y - 1700 * k); g.rotate(rot + (o.r || -.14) * k); g.scale(s, s); body(g); g.restore(); NOREC = nr;
  }
  /* a label slammed on: lands from big in 0.14 s with a small recoil (no bounce); leaves upward at tout */
  function slapOn(g, pc, x, y, rot, tl, tout, t, o) {
    o = o || {}; if (t < tl - .02) return; var od = o.od || .35; if (tout != null && t > tout + od) return;
    var fmax = Math.max(1, Math.min(o.from || 1.5, 2 * Math.min(x - 100, 920 - x) / (pc.w - 72 + 30))), k = eo(seg(t, tl, tl + .14)), ko = tout != null ? eio(seg(t, tout, tout + od)) : 0, s = lerp(fmax, 1, k) * Math.min(kn(t, tl + .12, .04), fmax > 1.04 ? 1.04 : 1);
    var nr = NOREC; NOREC = nr || k < 1 || ko > 0;
    g.save(); g.globalAlpha *= fin(t, tl, .05); g.translate(x, y - 1600 * ko); g.rotate(rot * (1 + (1 - k) * 2) + .3 * ko); g.scale(s, s); putW(g, pc, 0, 0);
    if (o.tape) { g.save(); g.translate(0, -pc.h / 2 + 34); g.rotate(.05); g.fillStyle = 'rgba(239,217,154,.85)'; g.fillRect(-45, -13, 90, 26); g.restore(); }
    g.restore(); NOREC = nr;
  }
  function stripOn(g, pc, x, y, rot, tl, tout, t) {
    if (t < tl - .02) return; if (tout != null && t > tout + .4) return;
    var k = cd(t, tl, 15), ko = tout != null ? eio(seg(t, tout, tout + .38)) : 0;
    var nr = NOREC; NOREC = nr || k < .97 || ko > 0;
    g.save(); g.globalAlpha *= fin(t, tl, .06); g.translate(x, y + (1 - k) * 40 - 1600 * ko); g.rotate(rot + .3 * ko);
    putW(g, pc, -pc.sw / 2, -pc.sh / 2, 0, 1);
    g.save(); g.translate(-pc.sw / 2 + 60, -pc.sh / 2 + 2); g.rotate(-.2); g.fillStyle = 'rgba(239,217,154,.85)'; g.fillRect(-40, -12, 80, 24); g.restore();
    NOREC = nr; g.restore();
  }
  /* yellow highlighter swiped across a box in local coordinates */
  function hilite(g, x0, y0, x1, y1, k) { if (k <= 0) return; g.save(); g.globalCompositeOperation = 'multiply'; g.fillStyle = '#ffe14d'; g.beginPath(); var xe = lerp(x0, x1, k); g.moveTo(x0, y0 + 4); g.lineTo(xe, y0); g.lineTo(xe + 6, y1); g.lineTo(x0 - 4, y1 - 3); g.closePath(); g.fill(); g.restore(); }


  /* =====================================================================================================
     THE SET: the case-file desk. A walnut desk at night seen from above, a green leather blotter bleeding the
     frame, a warm lamp pool drifting. One manila case-file card per hero (typed GAME / YEAR / CITY / NAME), dealt
     onto a stack. Native move: the redaction tear (the black bar over NAME peels off on the spoken name).
     A brass stopwatch whose red hand makes exactly one turn per film (the loop is exact), a pencil that hops
     when a card slaps down. The case-file cover is frame 0 and drops back on at the seam.
     ===================================================================================================== */
  var MAN = '#ecd29e', MAN2 = '#d9b77c', LAB = '#6b4f27', CORAL = '#e0533d', CORALD = '#a3321f', BAR = '#0d0c0f';
  var CRM = '#fbf5e6', RED2 = '#cf2a33', PINKG = '#d81b6a', STR = '#c8202c';
  var BRASS = '#d6a842', BRASS2 = '#f6dc8a', BRASS3 = '#a0731f', BRASSD = '#4f370c';
  INK = '#1b1712';
  var D = {};
  var CW = 800, CH = 720, CXC = 510, CYC = 893, FY = CH / 660;
  var MONO = '"Geist Mono"';

  /* typed label (mono) inside a piece; records its box */
  function mono(g, rec, s, x, y, px, col, o) {
    o = o || {}; g.save(); font(g, px, o.wt || 700, MONO); ls(g, o.ls == null ? 2 : o.ls);
    g.fillStyle = col; g.textAlign = o.align || 'left'; g.textBaseline = 'middle'; g.fillText(s, x, y);
    var w = g.measureText(s).width, x0 = o.align === 'center' ? x - w / 2 : o.align === 'right' ? x - w : x;
    if (rec) rec.push([x0, y - px * .55, x0 + w, y + px * .45, s]); g.restore(); return w;
  }
  /* parts [[text, color]] in a row, shrunk to max; align left or center; returns the box */
  function prow(g, rec, parts, x, y, px, max, align) {
    var all = parts.map(function (p) { return p[0]; }).join('');
    while (tw(all, px) > max && px > 36) px -= 2;
    var wt = tw(all, px), x0 = align === 'center' ? x - wt / 2 : x, xx = x0;
    parts.forEach(function (p) { ptxt(g, null, p[0], xx, y, px, p[1], { align: 'left' }); xx += tw(p[0], px); });
    var b = [x0, y - px * .55, x0 + wt, y + px * .45, all]; if (rec) rec.push(b); return b;
  }
  function gparts(a) { return [['GTA', PINKG], [a, INK]]; }

  /* a manila card outline with a case tab sticking up at tw0..tw1 */
  function cardPath(w, h, tw0, tw1, th) {
    return function (g) {
      var x0 = -w / 2, y0 = -h / 2, x1 = w / 2, y1 = h / 2, r = 12;
      g.beginPath(); g.moveTo(x0 + r, y0); g.lineTo(tw0, y0); g.lineTo(tw0 + 12, y0 - th); g.lineTo(tw1 - 12, y0 - th); g.lineTo(tw1, y0); g.lineTo(x1 - r, y0);
      g.arcTo(x1, y0, x1, y0 + r, r); g.lineTo(x1, y1 - r); g.arcTo(x1, y1, x1 - r, y1, r); g.lineTo(x0 + r, y1); g.arcTo(x0, y1, x0, y1 - r, r); g.lineTo(x0, y0 + r); g.arcTo(x0, y0, x0 + r, y0, r); g.closePath();
    };
  }
  function clip(g, x, y) {
    /* a paper clip over the top edge */
    g.save(); g.translate(x, y); g.rotate(.08); g.strokeStyle = '#c9ccd2'; g.lineWidth = 7; g.lineCap = 'round';
    g.beginPath(); g.moveTo(-14, 70); g.lineTo(-14, -30); g.arc(0, -30, 14, Math.PI, 0); g.lineTo(14, 50); g.arc(4, 50, 10, 0, Math.PI); g.lineTo(-6, -14); g.stroke();
    g.strokeStyle = 'rgba(255,255,255,.6)'; g.lineWidth = 2; g.beginPath(); g.moveTo(-16, 60); g.lineTo(-16, -28); g.stroke(); g.restore();
  }
  function paperLife(g, w, h, seed) {
    var r = mulberry(seed);
    g.fillStyle = 'rgba(120,85,30,.08)'; for (var y = -h / 2 + 30; y < h / 2; y += 46) g.fillRect(-w / 2, y, w, 2);
    /* a faint coffee ring on some cards */
    if (r() < .5) { g.strokeStyle = 'rgba(120,70,20,.12)'; g.lineWidth = 6; g.beginPath(); g.arc(w / 2 - 90 - r() * 60, h / 2 - 90 - r() * 40, 58, 0, TAU); g.stroke(); }
  }
  /* the full case card. o: num, game (text after GTA), year, city, name, fine, tab color, cityPx */
  function caseCard(o) {
    var w = CW, h = CH, rec = [], box = {}, tw0 = -w / 2 + 26, tw1 = -w / 2 + 290, L = -w / 2 + 40, R = w / 2 - 40;
    var pc = piece([-w / 2, -h / 2 - 56, w / 2, h / 2], cardPath(w, h, tw0, tw1, 56), MAN, { sy: 12, sx: 6, blur: 18, sc: 'rgba(0,0,0,.55)', edgeCol: 'rgba(255,248,228,.9)', extra: function (g) {
      g.fillStyle = o.tab || CORAL; g.fillRect(-w / 2, -h / 2 - 60, w, 60);
      mono(g, rec, o.num, (tw0 + tw1) / 2, -h / 2 - 27, 36, CRM, { align: 'center', ls: 3 });
      paperLife(g, w, h, o.seed || 3);
      if (o.ring) { rr(g, -w / 2 + 10, -h / 2 + 10 * FY, w - 20, h - 20, 8); stroke(g, o.ring, 6); }
      if (o.blank) { [186, 362].forEach(function (y) { g.fillStyle = 'rgba(107,79,39,.45)'; g.fillRect(L, -h / 2 + y * FY, R - L, 3); }); return; }
      mono(g, rec, 'GAME', L, -h / 2 + 46 * FY, 36, LAB);
      box.game = prow(g, rec, gparts(o.game), L, -h / 2 + 124 * FY, 104, R - L);
      g.fillStyle = 'rgba(107,79,39,.45)'; g.fillRect(L, -h / 2 + 186 * FY, R - L, 3);
      var CXL = L + 250;
      mono(g, rec, 'YEAR', L, -h / 2 + 228 * FY, 36, LAB); mono(g, rec, 'CITY', CXL, -h / 2 + 228 * FY, 36, LAB);
      box.year = prow(g, rec, [[o.year, INK]], L, -h / 2 + 300 * FY, 96, 220);
      if (o.city === '?') { ptxt(g, rec, '?', CXL + 30, -h / 2 + 300 * FY, 104, CORAL, { align: 'left' }); box.city = [CXL, -h / 2 + 245 * FY, R, -h / 2 + 345 * FY]; }
      else box.city = prow(g, rec, [[o.city, INK]], CXL, -h / 2 + 300 * FY, o.cityPx || 84, R - CXL);
      g.fillStyle = 'rgba(107,79,39,.45)'; g.fillRect(L, -h / 2 + 362 * FY, R - L, 3);
      mono(g, rec, 'NAME', L, -h / 2 + 402 * FY, 36, LAB);
      if (o.name) box.name = prow(g, rec, [[o.name, INK]], L, -h / 2 + 488 * FY, 104, R - L - 30);
      if (o.fine) ptxt(g, rec, o.fine, L, h / 2 - 44, 38, LAB, { align: 'left', ls: 1.5 });
    }, after: function (g) { clip(g, w / 2 - 90, -h / 2 + 4); } });
    wordsOf(pc, rec); pc.box = box; pc.bar = [L - 10, -h / 2 + 430 * FY, R + 10, -h / 2 + 548 * FY]; pc.cw = w; pc.ch = h;
    return pc;
  }
  /* a narrow card (one lead of a split case) */
  function narrowCard(o) {
    var w = o.w, h = CH, rec = [], box = {}, tw0 = -w / 2 + 16, tw1 = -w / 2 + Math.min(w - 40, 210), M = w - 36;
    var pc = piece([-w / 2, -h / 2 - 56, w / 2, h / 2], cardPath(w, h, tw0, tw1, 56), MAN, { sy: 12, sx: 6, blur: 18, sc: 'rgba(0,0,0,.55)', edgeCol: 'rgba(255,248,228,.9)', extra: function (g) {
      g.fillStyle = o.tab || CORAL; g.fillRect(-w / 2, -h / 2 - 60, w, 60);
      mono(g, rec, o.num, (tw0 + tw1) / 2, -h / 2 - 27, 36, CRM, { align: 'center', ls: 1 });
      paperLife(g, w, h, o.seed || 5);
      mono(g, rec, 'GAME', 0, -h / 2 + 46 * FY, 36, LAB, { align: 'center' });
      box.game = prow(g, rec, gparts(o.game), 0, -h / 2 + 116 * FY, 84, M, 'center');
      box.year = prow(g, rec, [[o.year, INK]], 0, -h / 2 + 206 * FY, 68, M, 'center');
      box.city = prow(g, rec, [[o.city, INK]], 0, -h / 2 + 276 * FY, 46, M, 'center');
      g.fillStyle = 'rgba(107,79,39,.45)'; g.fillRect(-w / 2 + 18, -h / 2 + 330 * FY, w - 36, 3);
      mono(g, rec, 'NAME', 0, -h / 2 + 376 * FY, 36, LAB, { align: 'center' });
      var nm = o.name.split(' ');
      if (nm.length > 1) { box.name = prow(g, rec, [[nm[0], INK]], 0, -h / 2 + 452 * FY, 72, M, 'center'); prow(g, rec, [[nm.slice(1).join(' '), INK]], 0, -h / 2 + 530 * FY, 56, M, 'center'); }
      else box.name = prow(g, rec, [[o.name, INK]], 0, -h / 2 + 470 * FY, 72, M, 'center');
      if (o.fine) ptxt(g, rec, o.fine, 0, h / 2 - 40, 36, LAB, { align: 'center', ls: 1, max: M });
    } });
    wordsOf(pc, rec); pc.box = box; pc.bar = nmBar(w, h, o.name); pc.cw = w; pc.ch = h;
    return pc;
  }
  function nmBar(w, h, name) { return name.indexOf(' ') > 0 ? [-w / 2 + 14, -h / 2 + 408 * FY, w / 2 - 14, -h / 2 + 566 * FY] : [-w / 2 + 14, -h / 2 + 418 * FY, w / 2 - 14, -h / 2 + 522 * FY]; }

  /* the redaction bar, torn left to right as k goes 0 -> 1; the torn strip curls up and flies off */
  function redact(g, b, k, seed) {
    var x0 = b[0], y0 = b[1], x1 = b[2], y1 = b[3], r = mulberry(seed || 9);
    var e = eio(clamp(k, 0, 1)), xf = lerp(x0, x1 + 12, e);
    if (xf < x1) {
      g.save(); g.shadowColor = 'rgba(0,0,0,.35)'; g.shadowBlur = 6; g.shadowOffsetY = 3;
      g.beginPath(); g.moveTo(xf, y0);
      for (var x = xf; x < x1; x += 22) g.lineTo(x, y0 + (r() - .5) * 3);
      g.lineTo(x1, y0 + 2); g.lineTo(x1 + 2, y1); for (x = x1; x > xf; x -= 22) g.lineTo(x, y1 + (r() - .5) * 3);
      /* the torn front: a jagged vertical edge */
      var r2 = mulberry(Math.round(xf) + 3); for (var yy = y1; yy > y0; yy -= 10) g.lineTo(xf + (r2() - .5) * 10, yy);
      g.closePath(); g.fillStyle = BAR; g.fill(); g.restore();
      /* a little sheen so it reads as tape, not a hole */
      g.fillStyle = 'rgba(255,255,255,.06)'; g.fillRect(Math.max(xf, x0) + 6, y0 + 8, Math.max(0, x1 - Math.max(xf, x0) - 12), 8);
    }
    if (k > 0 && k < 1.9) {
      /* the peeled part: a flap folded back over the front, lifting; after k = 1 it flies off up and right */
      var len = Math.min(xf - x0, 260), fly = clamp((k - 1) / .9, 0, 1), fe = fly * fly;
      if (len > 4) {
        g.save(); g.globalAlpha *= 1 - fe; g.translate(Math.min(xf, x1) + 120 * fe, y0 - 520 * fe); g.rotate(.35 + .6 * Math.min(1, e) + 1.2 * fe);
        var hh = (y1 - y0);
        g.beginPath(); g.moveTo(0, 0); g.lineTo(-len, -10); g.lineTo(-len - 8, hh * .62 - 10); g.lineTo(0, hh * .62); g.closePath();
        g.shadowColor = 'rgba(0,0,0,.45)'; g.shadowBlur = 14; g.shadowOffsetY = 10; g.fillStyle = '#2e2b31'; g.fill();
        g.shadowColor = 'transparent'; g.fillStyle = 'rgba(255,255,255,.08)'; g.fillRect(-len, 4, len, 6);
        g.restore();
      }
    }
  }
  /* bar state for a card: 0 before its tear, rising after */
  function tearK(t, tt) { return tt == null ? 0 : clamp((t - tt) / .3, 0, 2); }

  /* draw one card (piece + live highlights + bar) in card-local coordinates already translated */
  function cardBody(g, C, t, o) {
    o = o || {};
    putW(g, C.pc, 0, 0);
    var b = C.pc.box;
    [['year', C.hy], ['city', C.hc], ['game', C.hg], ['name', C.hn]].forEach(function (h) {
      if (h[1] == null || !b[h[0]]) return; var bb = b[h[0]];
      hilite(g, bb[0] - 8, bb[1] + 6, bb[2] + 8, bb[3] + 4, eio(seg(t, h[1], h[1] + .22)));
    });
    var tk = C.tear0 != null ? (t < C.tear ? .42 * eio(seg(t, C.tear0, C.tear0 + .22)) : Math.min(2, .42 + (t - C.tear) / .3)) : tearK(t, C.tear);
    if (C.bar !== false) redact(g, C.pc.bar, tk, C.seed);
    if (C.extra) C.extra(g, t);
  }
  /* deal: a card slides in from the right and lands at tl (settles, no bounce) */
  function deal(g, C, x, y, rot, tl, t, o) {
    o = o || {}; var d = o.d || .34; if (t < tl - d) return;
    var k = eo(seg(t, tl - d, tl)), fromX = o.fromX == null ? 860 : o.fromX, s = (o.s || 1) * kn(t, tl, .012);
    var nr = NOREC; NOREC = nr || k < .999;
    g.save(); g.translate(x + fromX * (1 - k), y - 200 * (1 - k)); g.rotate(rot + .22 * (1 - k) * Math.sign(fromX || 1)); g.scale(s, s);
    cardBody(g, C, t, o); g.restore(); NOREC = nr;
  }

  /* split: the big card tears into n vertical strips that open and flip into n narrow cards */
  function splitCard(g, big, nar, xs, ts, t) {
    var n = nar.length, w = CW, h = CH, u = eo(seg(t, ts, ts + .28)), v = seg(t, ts + .2, ts + .62);
    var nr = NOREC; NOREC = true;
    for (var i = 0; i < n; i++) {
      var sx0 = -w / 2 + i * w / n, sx1 = -w / 2 + (i + 1) * w / n, scx = (sx0 + sx1) / 2;
      var dx = (i - (n - 1) / 2) * 30 * u, fx = lerp(CXC + scx + dx, xs[i], eio(v)), sc = Math.abs(Math.cos(Math.PI * v));
      g.save(); g.translate(fx, CYC - 10 * Math.sin(Math.PI * v)); g.rotate((i - (n - 1) / 2) * .03 * u * (1 - v)); g.scale(Math.max(.02, sc), 1);
      if (v < .5) {
        g.save(); g.translate(-scx, 0);
        g.beginPath(); var rA = mulberry(40 + i), rB = mulberry(41 + i), yy;
        var lx = i === 0 ? sx0 - 30 : sx0, rx = i === n - 1 ? sx1 + 30 : sx1;
        g.moveTo(lx, -h / 2 - 70);
        g.lineTo(rx, -h / 2 - 70);
        for (yy = -h / 2 - 70; yy <= h / 2 + 20; yy += 14) g.lineTo(rx + (i === n - 1 ? 0 : (rB() - .5) * 12), yy);
        g.lineTo(lx, h / 2 + 20);
        for (yy = h / 2 + 20; yy >= -h / 2 - 70; yy -= 14) g.lineTo(lx + (i === 0 ? 0 : (rA() - .5) * 12), yy);
        g.closePath(); g.clip();
        cardBody(g, big.blank || big, t); g.restore();
      } else cardBody(g, nar[i], t);
      g.restore();
    }
    if (t < ts + .14) { g.save(); g.globalAlpha *= 1 - seg(t, ts, ts + .12); g.translate(CXC, CYC); cardBody(g, big, t); g.restore(); }
    NOREC = nr;
  }

  /* the cover: frame 0 and the seam. "NAME EVERY / MAIN GTA HERO", scope chip, a redaction bar */
  var COVW = 800, COVH = 760, COVX = 510, COVY = 800;
  function buildCover() {
    var w = COVW, h = COVH, rec = [], tw0 = -w / 2 + 26, tw1 = -w / 2 + 290;
    D.cover = piece([-w / 2, -h / 2 - 56, w / 2, h / 2], cardPath(w, h, tw0, tw1, 56), '#e2bf82', { sy: 16, sx: 8, blur: 24, sc: 'rgba(0,0,0,.6)', edgeCol: 'rgba(255,248,228,.9)', extra: function (g) {
      g.fillStyle = CORAL; g.fillRect(-w / 2, -h / 2 - 60, w, 60);
      paperLife(g, w, h, 11);
      /* a folder crease and a darker back flap edge */
      g.fillStyle = 'rgba(120,80,30,.16)'; g.fillRect(-w / 2, -h / 2 + 14, w, 5);
      ptxt(g, rec, 'NAME EVERY', 0, -h / 2 + 170, 176, INK, { ls: 2, max: w - 70 });
      prow(g, rec, [['GTA', PINKG], [' HERO', INK]], 0, -h / 2 + 350, 196, w - 70, 'center');
      g.fillStyle = 'rgba(107,79,39,.45)'; g.fillRect(-w / 2 + 40, -h / 2 + 470, w - 80, 3);
    }, after: function (g) { clip(g, w / 2 - 90, -h / 2 + 4); } });
    wordsOf(D.cover, rec); D.cover.bar = [-w / 2 + 50, -h / 2 + 515, w / 2 - 50, -h / 2 + 670];
  }
  /* the cover's bar with its corner curling up (a tease at 0.1-0.5 s, frame 0 is flat) */
  function coverBar(g, t) {
    var b = D.cover.bar, c = 62 * bump(t, .05, 1.3);
    redact(g, b, 0, 21);
    if (c > .5) { g.save(); g.beginPath(); g.moveTo(b[2] - c * 1.6, b[1]); g.lineTo(b[2], b[1]); g.lineTo(b[2], b[1] + c * 1.3); g.closePath(); g.fillStyle = '#e2bf82'; g.fill();
      g.beginPath(); g.moveTo(b[2] - c * 1.6, b[1]); g.lineTo(b[2], b[1] + c * 1.3); g.lineTo(b[2] - c * 1.9, b[1] + c * 1.9); g.closePath(); g.shadowColor = 'rgba(0,0,0,.4)'; g.shadowBlur = 8; g.shadowOffsetY = 5; g.fillStyle = '#2e2b31'; g.fill(); g.restore(); }
  }
  function coverOff(t) { var u = t < 1 ? t + .7 : t - (DUR - .7); if (u < 0 || u > 1.6) return 0; return 1100 * Math.pow(1 - u / 1.6, 3.2); }
  function coverAt(g, x, y, rot, s, t) { g.save(); g.translate(x, y); if (rot) g.rotate(rot); if (s !== 1) g.scale(s, s); putW(g, D.cover, 0, 0); coverBar(g, t); g.restore(); }

  /* the ballot: nine numbered cells, none highlighted */
  var BALW = 780, BALH = 720;
  var VOTE = ['CLAUDE', 'TOMMY', 'CJ', 'NIKO', 'MICHAEL', 'FRANKLIN', 'TREVOR', 'JASON', 'LUCIA'];
  function buildBallot() {
    var w = BALW, h = BALH, rec = [], tw0 = -w / 2 + 26, tw1 = -w / 2 + 290;
    D.ballot = piece([-w / 2, -h / 2 - 56, w / 2, h / 2], cardPath(w, h, tw0, tw1, 56), MAN, { sy: 12, sx: 6, blur: 18, sc: 'rgba(0,0,0,.55)', extra: function (g) {
      g.fillStyle = CORAL; g.fillRect(-w / 2, -h / 2 - 60, w, 60);
      mono(g, rec, 'BALLOT', (tw0 + tw1) / 2, -h / 2 - 27, 36, CRM, { align: 'center', ls: 3 });
      paperLife(g, w, h, 17);
      mono(g, rec, 'PICK A NUMBER', 0, -h / 2 + 50, 38, LAB, { align: 'center' });
      VOTE.forEach(function (nm, i) {
        var cx = (i % 3 - 1) * 250, cy = -h / 2 + 175 + Math.floor(i / 3) * 190;
        ptxt(g, rec, nm, cx, cy + 66, 50, INK, { ls: 1, max: 230 });
      });
    } });
    wordsOf(D.ballot, rec);
  }

  /* the stopwatch: brass case and cream face prebuilt; the red hand turns once per film */
  var WX = 190, WY = 1356, WR = 70;
  function buildWatch() {
    D.watch = piece([-WR - 4, -WR - 48, WR + 4, WR + 4], function (g) { g.beginPath(); g.arc(0, 0, WR, 0, TAU); g.moveTo(-14, -WR + 6); g.rect(-14, -WR - 34, 28, 40); g.moveTo(-26, -WR - 48); g.rect(-26, -WR - 48, 52, 18); }, function (g) { var gr = g.createLinearGradient(-WR, -WR, WR, WR); gr.addColorStop(0, BRASS2); gr.addColorStop(.5, BRASS); gr.addColorStop(1, BRASS3); return gr; }, { sy: 8, sx: 5, blur: 12, sc: 'rgba(0,0,0,.55)', edgeCol: 'rgba(255,240,190,.8)', grain: .4, extra: function (g) {
      g.beginPath(); g.arc(0, 0, WR - 12, 0, TAU); g.fillStyle = '#f4ecd8'; g.fill();
      for (var i = 0; i < 60; i++) { var a = i / 60 * TAU, r0 = i % 5 ? WR - 22 : WR - 32; g.strokeStyle = i % 5 ? 'rgba(27,23,18,.5)' : INK; g.lineWidth = i % 5 ? 2 : 4; g.beginPath(); g.moveTo(Math.sin(a) * r0, -Math.cos(a) * r0); g.lineTo(Math.sin(a) * (WR - 15), -Math.cos(a) * (WR - 15)); g.stroke(); }
      g.beginPath(); g.arc(0, 26, 18, 0, TAU); g.strokeStyle = 'rgba(27,23,18,.4)'; g.lineWidth = 2; g.stroke();
    } });
  }
  function watch2(g, t) {
    put(g, D.watch, WX, WY);
    var a = TAU * t / DUR, a2 = TAU * 6 * t / DUR;
    g.save(); g.translate(WX, WY + 26); g.rotate(a2); g.strokeStyle = INK; g.lineWidth = 3; g.beginPath(); g.moveTo(0, 4); g.lineTo(0, -15); g.stroke(); g.restore();
    g.save(); g.translate(WX, WY); g.rotate(a); g.shadowColor = 'rgba(0,0,0,.3)'; g.shadowBlur = 4; g.shadowOffsetY = 3;
    g.strokeStyle = STR; g.lineWidth = 5; g.lineCap = 'round'; g.beginPath(); g.moveTo(0, 18); g.lineTo(0, -WR + 22); g.stroke();
    g.beginPath(); g.arc(0, 0, 8, 0, TAU); g.fillStyle = BRASS3; g.fill(); g.restore();
  }
  /* the pencil, hopping when a card lands */
  function buildPencil() {
    var L = 330, Wd = 24;
    D.pencil = piece([-L / 2, -Wd / 2, L / 2, Wd / 2], function (g) { g.beginPath(); g.moveTo(-L / 2 + 8, -Wd / 2); g.lineTo(L / 2 - 60, -Wd / 2); g.lineTo(L / 2, 0); g.lineTo(L / 2 - 60, Wd / 2); g.lineTo(-L / 2 + 8, Wd / 2); g.arcTo(-L / 2, Wd / 2, -L / 2, 0, 8); g.arcTo(-L / 2, -Wd / 2, -L / 2 + 8, -Wd / 2, 8); g.closePath(); }, '#f2b632', { sy: 7, sx: 4, blur: 8, sc: 'rgba(0,0,0,.5)', edge: 1.5, extra: function (g) {
      g.fillStyle = 'rgba(160,100,10,.35)'; g.fillRect(-L / 2, 2, L, 4);
      g.fillStyle = '#e8b98a'; g.beginPath(); g.moveTo(L / 2 - 60, -Wd / 2); g.lineTo(L / 2, 0); g.lineTo(L / 2 - 60, Wd / 2); g.closePath(); g.fill();
      g.fillStyle = '#2b2b2e'; g.beginPath(); g.moveTo(L / 2 - 18, -4); g.lineTo(L / 2, 0); g.lineTo(L / 2 - 18, 4); g.closePath(); g.fill();
      g.fillStyle = '#b8bcc4'; g.fillRect(-L / 2 + 34, -Wd / 2, 26, Wd); g.fillStyle = '#e88a9a'; g.fillRect(-L / 2, -Wd / 2, 34, Wd);
    } });
  }
  function pencil(g, t) {
    var hop = 0; (T.lands || []).forEach(function (tl) { hop = Math.max(hop, bump(t, tl, .22)); });
    put(g, D.pencil, 720, 1352 - 12 * hop, -.2 + .05 * hop);
  }
  function buildBackdrop() {
    var c = mk(W, H), g = c.getContext('2d'), r = mulberry(23);
    /* walnut */
    var gr = g.createLinearGradient(0, 0, W, H); gr.addColorStop(0, '#3a2416'); gr.addColorStop(.5, '#2b1a10'); gr.addColorStop(1, '#1d110a'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    grainLines(g, 0, 0, W, H, 'rgba(15,6,2,.25)', 9, 7);
    /* the green leather blotter, stitched */
    var bx = -20, by = -20, bw = W + 40, bh = H + 40;
    rr(g, bx + 6, by + 10, bw, bh, 14); g.fillStyle = 'rgba(0,0,0,.4)'; g.fill();
    var fg = g.createLinearGradient(0, by, 0, by + bh); fg.addColorStop(0, '#174235'); fg.addColorStop(.5, '#123a2e'); fg.addColorStop(1, '#0c2c22');
    rr(g, bx, by, bw, bh, 14); g.fillStyle = fg; g.fill();
    for (var i = 0; i < 9000; i++) { g.fillStyle = r() < .5 ? 'rgba(200,255,220,' + (.01 + r() * .03).toFixed(3) + ')' : 'rgba(0,10,5,' + (.05 + r() * .08).toFixed(3) + ')'; g.fillRect(bx + r() * bw, by + r() * bh, 1 + r() * 2, 1 + r() * 2); }
    g.setLineDash([10, 8]); g.strokeStyle = 'rgba(220,200,140,.35)'; g.lineWidth = 2; rr(g, 52, 120, W - 104, H - 240, 8); g.stroke(); g.setLineDash([]);
    g.globalAlpha = .25; g.fillStyle = g.createPattern(GRAIN, 'repeat'); g.fillRect(0, 0, W, H); g.globalAlpha = 1;
    var vg = g.createRadialGradient(510, 860, 300, 510, 860, 1250); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.6)'); g.fillStyle = vg; g.fillRect(0, 0, W, H);
    return c;
  }

  var C = {};
  var CARDS = [
    { id: 'c1', num: 'CASE 1/6', game: ' III', year: '2001', city: 'LIBERTY CITY', name: 'CLAUDE', fine: 'NAME GIVEN LATER · SAN ANDREAS, 2004', seed: 3 },
    { id: 'c2', num: 'CASE 2/6', game: ': VICE CITY', year: '2002', city: 'VICE CITY', name: 'TOMMY VERCETTI', seed: 4 },
    { id: 'c3', num: 'CASE 3/6', game: ': SAN ANDREAS', year: '2004', city: 'LOS SANTOS', name: 'CARL "CJ" JOHNSON', seed: 5 },
    { id: 'c4', num: 'CASE 4/6', game: ' IV', year: '2008', city: 'LIBERTY CITY', name: 'NIKO BELLIC', seed: 6 },
    { id: 'c5', num: 'CASE 5/6', game: ' V', year: '2013', city: 'LOS SANTOS', name: '', seed: 7 }
  ];
  var POS = [[510, CYC, -.008], [514, CYC - 4, .009], [508, CYC + 6, .028], [512, CYC - 2, .01], [510, CYC, -.005]];
  function buildPieces() {
    CARDS.forEach(function (o) { C[o.id] = { pc: caseCard(o), seed: o.seed * 7 }; });
    C.v = ['MICHAEL', 'FRANKLIN', 'TREVOR'].map(function (n, i) { return { pc: narrowCard({ w: 250, num: '5/6 · ' + 'ABC'[i], game: ' V', year: '2013', city: 'LOS SANTOS', name: n, seed: 20 + i }), seed: 30 + i }; });
    C.q = { pc: caseCard({ num: 'CASE 6/6', game: ' VI', year: '2026', city: '?', fine: 'SOURCE: ROCKSTARGAMES.COM/VI', name: '', seed: 8, tab: PINKG, ring: 'rgba(224,83,61,.7)' }), seed: 50 };
    C.c5b = { pc: caseCard({ num: 'CASE 5/6', game: ' V', year: '', city: '', name: '', seed: 7, blank: true }), seed: 35 };
    C.vib = { pc: caseCard({ num: 'CASE 6/6', game: ' VI', year: '', city: '', name: '', seed: 8, tab: PINKG, ring: 'rgba(224,83,61,.7)', blank: true }), seed: 50 };
    C.vi = { pc: caseCard({ num: 'CASE 6/6', game: ' VI', year: '2026', city: 'VICE CITY · LEONIDA', fine: 'SOURCE: ROCKSTARGAMES.COM/VI', cityPx: 60, name: '', seed: 8, tab: PINKG, ring: 'rgba(224,83,61,.7)' }), seed: 50 };
    C.two = ['JASON DUVAL', 'LUCIA CAMINOS'].map(function (n, i) { return { pc: narrowCard({ w: 380, num: '6/6 · ' + 'AB'[i], game: ' VI', year: '2026', city: 'VICE CITY · LEONIDA', name: n, tab: PINKG, seed: 40 + i }), seed: 60 + i }; });
    C.tommy = { pc: C.c2.pc, seed: C.c2.seed };
    D.nolines = stampPiece([['NO LINES', 60]], CORALD, 300);
    D.again = chipPiece([['CASE 1/6', 56, INK, 2], ['LIBERTY CITY', 36, LAB, 1]], 290, MAN, INK, { lh: 60, pad: 18, ring: 'rgba(224,83,61,.8)' });
    D.yrs = chipPiece([['24 YEARS', 96, CRM, 2], ['OUR MATH', 40, '#f3c9c0', 2]], 330, STR, CRM, { lh: 84, pad: 18 });
    D.src = chipPiece([['ROCKSTARGAMES.COM/VI', 38, INK, 1]], 520, CRM, INK, { lh: 44, pad: 18 });
    buildCover(); buildBallot(); buildWatch(); buildPencil();
  }
  function buildTextures() { GRAIN = buildGrain(); buildPieces(); D.bg = buildBackdrop(); }

  /* card-local point -> screen (for the red string) */
  function lp(x, y, rot, s, px, py) { var c = Math.cos(rot), sn = Math.sin(rot); return [x + s * (px * c - py * sn), y + s * (px * sn + py * c)]; }

  /* =====================================================================================================
     THE PROP LAYER (screen space, clipped to the rail). Beats in story order; later pieces land on top.
     ===================================================================================================== */
  function props(g, t) {
    var k, i;
    watch2(g, t);
    /* ---- the stack: cards 1-5, dealt one per line, swept off left on "And GTA 6?" ---- */
    var sw0 = eio(seg(t, T.sweep, T.sweep + .42));
    if (t < T.sweep + .45) {
      g.save(); g.translate(-1150 * sw0, 0); var nrs = NOREC; NOREC = nrs || sw0 > 0;
      CARDS.forEach(function (o, i) {
        if (t >= T.split + .05 && i < 4) return;
        if (i === 4 && t >= T.split) return;
        var P = POS[i]; deal(g, C[o.id], P[0], P[1], P[2], T.lands[i], t);
      });
      if (t >= T.split) splitCard(g, C.c5, C.v, [232, 510, 788], T.split, t);
      NOREC = nrs; g.restore();
    }
    /* ---- GTA VI: the card drops alone; on "Vice" its city prints; on "back" it moves down, Tommy's card returns ---- */
    if (t >= T.qLand - .4 && t < T.endSweep + .45) {
      var mv = eio(seg(t, T.backMove, T.backMove + .42)), mb = eio(seg(t, T.twoBack, T.twoBack + .36));
      var m = mv * (1 - mb), x = lerp(CXC, 585, m), y = lerp(CYC, 1185, m), s = lerp(1, .66, m), rot = lerp(.004, .012, m);
      var es = eio(seg(t, T.endSweep, T.endSweep + .42));
      g.save(); g.translate(-1150 * es, 0); var nrv = NOREC; NOREC = nrv || (m > 0 && m < 1) || es > 0;
      if (t < T.twoSplit) {
        var CV = t < T.vice ? C.q : C.vi;
        if (t < T.qLand + .01) { var kq = seg(t, T.qLand - .3, T.qLand), fall = (1 - kq * kq) * 1300; g.save(); g.translate(CXC, CYC - fall); g.rotate(.004 + (1 - kq) * .05); cardBody(g, CV, t); g.restore(); }
        else { var kk = kn(t, T.qLand, .015) * kn(t, T.vice, .02); g.save(); g.translate(x, y); g.rotate(rot); g.scale(s * kk, s * kk); cardBody(g, CV, t); g.restore(); }
      } else splitCard(g, C.vi, C.two, [303, 717], T.twoSplit, t);
      NOREC = nrv; g.restore();
      /* Tommy's card returns above it, then files away */
      if (t >= T.backMove && t < T.twoBack + .45) {
        var ki = eo(seg(t, T.backMove, T.backMove + .4)), ko = eio(seg(t, T.twoBack, T.twoBack + .4)), tx = lerp(-700, 0, ki) - 1100 * ko;
        var nrt = NOREC; NOREC = nrt || ki < .999 || ko > 0;
        g.save(); g.translate(435 + tx, 745); g.rotate(-.014 - .1 * (1 - ki)); g.scale(.66, .66); cardBody(g, C.tommy, t); g.restore();
        /* the red string between the two CITY fields, and the 24 YEARS tag on it */
        var ks = eo(seg(t, T.str, T.str + .3));
        if (ks > 0) {
          var bA = C.tommy.pc.box.city, bB = C.vi.pc.box.city;
          var pA = lp(435 + tx, 745, -.014, .66, (bA[0] + bA[2]) / 2, bA[3] + 8), pB = lp(585 + tx, 1185, .012, .66, (bB[0] + bB[2]) / 2, bB[1] - 6);
          var pe = [lerp(pA[0], pB[0], ks), lerp(pA[1], pB[1], ks)], sag = 30 * ks + sw(t, T.str + .3, 8, 22, 5);
          g.save(); g.strokeStyle = STR; g.lineWidth = 6; g.lineCap = 'round'; g.shadowColor = 'rgba(0,0,0,.4)'; g.shadowBlur = 6; g.shadowOffsetY = 4;
          g.beginPath(); g.moveTo(pA[0], pA[1]); g.quadraticCurveTo((pA[0] + pe[0]) / 2 + sag, (pA[1] + pe[1]) / 2, pe[0], pe[1]); g.stroke();
          [pA, pe].forEach(function (p) { g.beginPath(); g.arc(p[0], p[1], 11, 0, TAU); g.fillStyle = '#e8e2d4'; g.fill(); g.beginPath(); g.arc(p[0], p[1], 5, 0, TAU); g.fillStyle = STR; g.fill(); });
          g.restore();
          g.save(); g.translate(tx, 0); slapOn(g, D.yrs, 742, 1010, .03, T.yrs, null, t, { tape: true }); g.restore();
        }
        NOREC = nrt;
      }
    }
    /* the source chip under Jason and Lucia */
    /* ---- the ballot ---- */
    if (t >= T.ballot - .35 && t < T.balOut + .5) {
      g.save(); g.translate(-1150 * eio(seg(t, T.balOut, T.balOut + .42)), 0);
      var kb = seg(t, T.ballot - .3, T.ballot), fb = (1 - kb * kb) * 1400, nrb = NOREC; NOREC = nrb || kb < 1 || t > T.balOut;
      g.save(); g.translate(CXC, CYC - fb); g.rotate(.003 + (1 - kb) * .04); var sb = kn(t, T.ballot, .012); g.scale(sb, sb); putW(g, D.ballot, 0, 0);
      VOTE.forEach(function (nm, i) {
        var tn = T.nums + i * .06; if (t < tn - .01) return; var kk = eo(seg(t, tn, tn + .12)), cx = (i % 3 - 1) * 250, cy = -BALH / 2 + 175 + Math.floor(i / 3) * 190;
        var nr2 = NOREC; NOREC = nr2 || kk < 1; g.save(); g.translate(cx, cy - 22 - 30 * (1 - kk)); g.globalAlpha *= fin(t, tn, .04); g.scale(lerp(1.3, 1, kk), lerp(1.3, 1, kk));
        g.beginPath(); g.arc(0, 0, 46, 0, TAU); g.fillStyle = 'rgba(251,245,230,.6)'; g.fill(); g.strokeStyle = CORALD; g.lineWidth = 5; g.stroke();
        ptxt(g, null, String(i + 1), 0, 2, 68, CORALD, { ls: 0 }); g.restore(); NOREC = nr2;
      });
      g.restore(); g.restore(); NOREC = nrb;
    }
    /* ---- the cover: frame 0, lifted off on "Name", dropped back on at the seam ---- */
    if (t < T.coverOff + .5) { var nrc = NOREC; NOREC = nrc || t > .9; lift(g, COVX, COVY + coverOff(t), 0, T.coverOff, t, function (q) { putW(q, D.cover, 0, 0); coverBar(q, t); }, { d: .42, r: -.1 }); NOREC = nrc; }
    if (t >= DUR - .7) { var nrd = NOREC; NOREC = true; g.save(); g.translate(COVX, COVY + coverOff(t)); putW(g, D.cover, 0, 0); coverBar(g, t - DUR); g.restore(); NOREC = nrd; }
  }

  /* ---------- captions: cream label tape in the upper third, phrase by phrase (the hook's words are the frame-0 props) ---------- */
  var GLUE = { the: 1, a: 1, an: 1, your: 1, its: 1, of: 1, at: 1, to: 1, and: 1, in: 1, with: 1, on: 1, by: 1, so: 1, for: 1, own: 1, how: 1, that: 1, if: 1, you: 1, no: 1, or: 1, it: 1, was: 1, will: 1, most: 1, his: 1, is: 1, her: 1, new: 1, from: 1, as: 1, can: 1 };
  var CAPS = (function () {
    var outc = [];
    VO.lines.forEach(function (l) {
      if (l.id === 'hook') return;
      var cur = [], ws = l.words;
      ws.forEach(function (w, i) { cur.push(w); if ((w.split || /[.?!]["”]?$/.test(w.w)) && !/^N\.Y\.$/.test(w.w) && i < ws.length - 1) { cur.id = l.id; outc.push(cur); cur = []; } });
      if (cur.length) { cur.id = l.id; outc.push(cur); }
    });
    outc = outc.filter(function (ws) { return !(/^(claude|tommy|cj|niko|five)$/.test(ws.id) && /^\d/.test(ws[0].w)); });
    return outc.map(function (ws) { return { id: ws.id, t0: ws[0].t0, t1: ws[ws.length - 1].t1, s: ws[0].t0 - .04, words: ws }; });
  })();
  var STRESS;
  function stressed(w) { for (var i = 0; i < STRESS.length; i++) if (Math.abs(STRESS[i] - w.t0) < .02) return true; return false; }
  var CAPY = 372, TAPE = '#f6ecd0';
  function capHidden(t) { return false; }
  function captions(g, t) {
    t = tq(t); if (capHidden(t)) return;
    var card0 = null, ci = -1;
    CAPS.forEach(function (c, i) { if (t >= c.s) { card0 = c; ci = i; } });
    if (!card0) return;
    var nx = CAPS[ci + 1], ns = nx ? nx.s : T.capEnd, end = Math.min(card0.t1 + .55, ns);
    if (t >= end) return;
    var k = cd(t, card0.s, 16), ko = 1 - seg(t, end - .06, end);
    g.save(); g.globalAlpha *= ko; cond(g); var cpx = 76; font(g, cpx, 900); ls(g, 1); g.textBaseline = 'alphabetic';
    var words = card0.words, up = words.map(function (w) { return w.w.toUpperCase(); }), ws = up.map(function (u) { return g.measureText(u).width; }), gap = cpx * .26;
    var lines, lw, maxw = 740, CXc = 510;
    function lay2() { lines = [[]]; lw = [0]; words.forEach(function (w, i) { var Ln = lines.length - 1; if (lw[Ln] + ws[i] > maxw && lines[Ln].length) { lines.push([]); lw.push(0); Ln++; } lines[Ln].push(i); lw[Ln] += ws[i] + gap; }); }
    function fixLines() {
      for (var Ln = 0; Ln < lines.length - 1; Ln++) { var last = lines[Ln][lines[Ln].length - 1]; while (lines[Ln].length > 1 && GLUE[norm(words[last].w)]) { lines[Ln].pop(); lines[Ln + 1].unshift(last); last = lines[Ln][lines[Ln].length - 1]; } }
      var n = lines.length; if (n > 1 && lines[n - 1].length === 1 && lines[n - 2].length > 2 && !stressed(words[lines[n - 1][0]])) lines[n - 1].unshift(lines[n - 2].pop());
      lw = lines.map(function (ln) { var w = 0; ln.forEach(function (i) { w += ws[i] + gap; }); return w; });
    }
    lay2(); fixLines();
    function widest() { return Math.max.apply(null, lw) - gap; }
    while ((lines.length > 2 || widest() > maxw) && cpx > 56) { cpx -= 4; font(g, cpx, 900); ws = up.map(function (u) { return g.measureText(u).width; }); gap = cpx * .26; lay2(); fixLines(); }
    var lh = cpx * 1.32, y0 = (card0.id === 'back' ? CAPY - 60 : CAPY) - (lines.length - 1) * lh / 2 + cpx * .36;
    lines.forEach(function (ln, li) {
      var tw0 = lw[li] - gap, x = CXc - tw0 / 2, y = y0 + li * lh + (1 - k) * 30, seed = Math.round(card0.t0 * 100) + li * 7;
      var r = mulberry(seed), x0 = x - 22, x1 = x + tw0 + 22, yt = y - cpx * .86, yb = y + cpx * .24, rot = (r() - .5) * .025;
      g.save(); g.translate(CXc, y); g.rotate(rot); g.translate(-CXc, -y);
      g.beginPath(); g.moveTo(x0, yt); for (var xx = x0; xx < x1; xx += 9) g.lineTo(xx, yt + (r() - .5) * 3); g.lineTo(x1, yt); for (var zz = 0; zz < 6; zz++) g.lineTo(x1 + (zz % 2 ? 7 : 0), yt + (yb - yt) * (zz + 1) / 6); for (xx = x1; xx > x0; xx -= 9) g.lineTo(xx, yb + (r() - .5) * 3); g.lineTo(x0, yb); for (zz = 0; zz < 6; zz++) g.lineTo(x0 - (zz % 2 ? 0 : 7), yb - (yb - yt) * (zz + 1) / 6); g.closePath();
      g.save(); g.shadowColor = 'rgba(0,4,20,.55)'; g.shadowBlur = 10; g.shadowOffsetX = 3; g.shadowOffsetY = 6; g.fillStyle = TAPE; g.fill(); g.restore();
      g.save(); g.clip(); g.globalAlpha *= .45; g.fillStyle = g.createPattern(GRAIN, 'repeat'); g.fillRect(x0 - 8, yt - 4, x1 - x0 + 16, yb - yt + 8); g.restore();
      ln.forEach(function (i) {
        var w = words[i], nw = words[i + 1], cur = stressed(w) && t >= w.t0 - .03 && t < Math.min(w.t1 + .05, nw ? nw.t0 - .03 : 1e9) + .25;
        if (cur) { g.save(); g.globalCompositeOperation = 'multiply'; g.fillStyle = '#ffd84a'; g.fillRect(x - 6, y - cpx * .78, ws[i] + 12, cpx * .98); g.restore(); }
        var isG = /^GTA$/.test(up[i]) || (/^[456]\.?,?$/.test(up[i]) && i > 0 && up[i - 1] === 'GTA');
        g.fillStyle = isG ? '#d81b6a' : INK; g.fillText(up[i], x, y); x += ws[i] + gap;
      });
      g.restore();
    });
    g.restore(); unst(g); ls(g, 0);
  }

  var NOISE, POSTERMODE = false;
  var STAGEC = '#0a1430';
  function stage(g) { g.fillStyle = STAGEC; g.fillRect(0, 0, W, H); }
  function railClip(g) { g.beginPath(); if (LIVE2.clip) g.rect(BX0, 0, BX1 - BX0, BY1); else g.rect(-500, -500, 2080, BY1 + 500); g.clip(); }
  /* the hook and the end sit slightly pushed in (1.035); the push relaxes over the hook and returns for the loop */
  function push(t) { if (t < 3.4) return 1 + .035 * (1 - eio(seg(t, 0, 3.4))); if (t >= T.ballot) return 1 + .035 * eio(seg(t, T.ballot + .3, DUR)); return 1; }
  function frame(g, t) {
    g.setTransform(1, 0, 0, 1, 0, 0);
    stage(g);
    if (LIVE2.bg) {
      g.drawImage(D.bg, 0, 0);
      /* the desk lamp's warm pool drifts (periodic in DUR, so the loop is exact) */
      var lx = 470 + 110 * osc(t, 2, .4), ly = 820 + 90 * osc(t, 3, 1.3), gl = g.createRadialGradient(lx, ly, 80, lx, ly, 900);
      gl.addColorStop(0, 'rgba(255,214,150,.17)'); gl.addColorStop(.55, 'rgba(255,190,120,.06)'); gl.addColorStop(1, 'rgba(255,190,120,0)'); g.fillStyle = gl; g.fillRect(0, 0, W, H);
      plateLayer(g, t); printLayer(g, t);
    }
    var ddx = 3 * osc(t, 17, .3) + 2 * osc(t, 29, 1.1), ddy = 3 * osc(t, 13, 2.1) + 2 * osc(t, 31, .7), ps = push(t);
    g.save(); railClip(g); g.translate(510 + ddx, 900 + ddy); g.scale(ps, ps); g.translate(-510, -900);
    props(g, t); g.restore();
    if (!POSTERMODE && LIVE.text) captions(g, t);
    if (LIVE.grain && NOISE && LIVE2.bg) { g.globalAlpha = .05; g.globalCompositeOperation = 'overlay'; var o = Math.floor(t * 24) * 37 % 256; g.fillStyle = g.createPattern(NOISE, 'repeat'); g.translate(-o, -o); g.fillRect(o, o, W, H); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }
  }
  function TEXTS(t) {
    var o = [];
    function Tx(id, text, a, b) { if (t >= a && t < b) o.push({ id: id, text: text, x0: 0, y0: 0, x1: 0, y1: 0 }); }
    var CE = T.coverOff + .15, CD = T.coverDrop;
    Tx('cov1', 'NAME EVERY', 0, CE); Tx('cov1', 'NAME EVERY', CD, DUR + 1);
    Tx('cov2', 'GTA HERO', 0, CE); Tx('cov2', 'GTA HERO', CD, DUR + 1);
    var ends = [T.lands[1], T.lands[2], T.lands[3], T.lands[4], T.split + .2];
    CARDS.forEach(function (c, i) {
      var a = T.lands[i] + .05, b = ends[i];
      Tx('g' + i, 'GTA' + c.game, a, b); Tx('y' + i, c.year, a, b); Tx('ci' + i, c.city, a, b);
      if (c.name) Tx('nm' + i, c.name, C[c.id].tear + .25, b);
    });
    Tx('f0', CARDS[0].fine, T.lands[0] + .05, ends[0]);
    Tx('ag', 'CASE 1/6', T.again + .3, T.lands[4]);
    var sv = T.split + .5;
    Tx('g4', 'GTA V', sv, T.sweep); Tx('y4', '2013', sv, T.sweep); Tx('ci4', 'LOS SANTOS', sv, T.sweep);
    C.v.forEach(function (n, i) { Tx('nv' + i, ['MICHAEL', 'FRANKLIN', 'TREVOR'][i], n.tear + .25, T.sweep); });
    Tx('g6', 'GTA VI', T.qLand + .05, T.endSweep); Tx('y6', '2026', T.qLand + .05, T.endSweep);
    Tx('ci6', 'VICE CITY · LEONIDA', T.vice + .1, T.endSweep);
    Tx('nm1', 'TOMMY VERCETTI', T.backMove + .3, T.twoBack + .1);
    Tx('yrs', '24 YEARS', T.yrs + .1, T.twoBack + .2);
    C.two.forEach(function (n, i) { Tx('nt' + i, ['JASON DUVAL', 'LUCIA CAMINOS'][i], n.tear + .25, T.endSweep); });
    Tx('src', 'ROCKSTARGAMES.COM/VI', T.qLand + .05, T.twoSplit);
    var bA = T.ballot + .05, bB = T.balOut + .1;
    Tx('bal', 'PICK A NUMBER', bA, bB);
    /* the ballot repeats every lead's name: same ids, so each name's total time on screen is counted */
    ['nm0', 'nm1', 'nm2', 'nm3', 'nv0', 'nv1', 'nv2', 'nt0', 'nt1'].forEach(function (id, i) { Tx(id, VOTE[i], bA, bB); });
    return o;
  }

  /* ---------- times and sound events, all from the voice ---------- */
  function stampLocal(g, pc, x, y, rot, tl, t) {
    if (t < tl - .01) return; var k = eo(seg(t, tl, tl + .14)), s = lerp(1.35, 1, k), nr = NOREC; NOREC = nr || k < 1;
    g.save(); g.globalAlpha *= fin(t, tl, .05); g.translate(x, y); g.rotate(rot * (1 + (1 - k) * 2)); g.scale(s, s); putW(g, pc, 0, 0); g.restore(); NOREC = nr;
  }
  function initTimes() {
    /* hook: the cover is frame 0; it lifts on "hero" and card 1 is dealt under it by 1.8 s */
    T.coverOff = 1.62;
    G('cov', T.coverOff - .05, 'swish', .25, .8);
    T.lands = [];
    T.lands[0] = G('land0', 1.78, 'slap', .06, 1.1);
    T.lands[1] = start('tommy') - .03; G('land1', T.lands[1], 'slap', .3, 1.1);
    T.lands[2] = start('cj') - .03; G('land2', T.lands[2], 'slap', .3, 1.1);
    T.lands[3] = start('niko') - .03; G('land3', T.lands[3], 'slap', .3, 1.1);
    T.lands[4] = start('five') - .03; G('land4', T.lands[4], 'slap', .3, 1.1);
    /* one highlighter swipe per spoken field, one tear per spoken name (the tear sound sits in the breath before it) */
    function tearAt(id, line, word) { return G(id, at(line, word) - .16, 'tear', .25, 1.2); }
    C.c1.hy = at('claude', '2001'); C.c1.hc = at('claude', 'liberty'); C.c1.tear = tearAt('t1', 'claude', 'claude');
    T.noLines = G('nol', at('claude', 'silent') - .04, 'stamp', .12, 1.1);
    C.c2.hy = at('tommy', '2002'); C.c2.hc = at('tommy', 'vice'); C.c2.tear = tearAt('t2', 'tommy', 'tommy');
    C.c3.hy = at('cj', '2004'); C.c3.hg = at('cj', 'san'); C.c3.tear0 = G('t3a', at('cj', 'andreas') - .05, 'tear', .25, .8); C.c3.tear = tearAt('t3', 'cj', 'cj');
    C.c4.hy = at('niko', '2008'); C.c4.hc = at('niko', 'liberty'); T.again = at('niko', 'liberty') - .02; G('twg4', wend('niko', 'again') + .05, 'twang', .3, .9); C.c4.tear = tearAt('t4', 'niko', 'niko');
    C.c5.hy = at('five', '2013'); C.c5.hc = at('five', 'los');
    T.split = G('split', at('five', 'enough') + .05, 'tear', .3, 1.4);
    ['michael', 'franklin', 'trevor'].forEach(function (w, i) { C.v[i].tear = tearAt('tv' + i, 'three', w); });
    /* "And GTA 6?": the stack is swept off, the VI card drops on "6" */
    T.sweep = G('sweep', start('q') - .3, 'swish', .2, 1);
    T.qLand = at('q', '6') + .02; G('qland', T.qLand, 'slap', .25, 1);
    /* back: the city prints on "Vice"; Tommy's 2002 card returns; the red string, 24 YEARS on "24" */
    T.vice = at('back', 'vice') - .02; C.vi.hc = T.vice + .08; C.q.hc = null;
    T.backMove = at('back', 'vice') + .02;
    T.str = G('str', wend('back', 'city') + .05, 'twang', .3, 1.1);
    T.yrs = at('back', '24') - .1;
    C.tommy.tear = -10; C.tommy.hn = at('back', 'tommy');
    /* two: Tommy files away, the VI card returns and tears in two */
    T.twoBack = G('twoBack', at('two', 'two') - .38, 'swish', .2, .8);
    T.twoSplit = G('twoSplit', at('two', 'two') + .08, 'tear', .25, 1.3);
    ['jason', 'lucia'].forEach(function (w, i) { C.two[i].tear = tearAt('tt' + i, 'two', w); });
    T.src = T.twoSplit + .4;
    /* end: the ballot; the cover drops back on for the loop */
    T.endSweep = G('endSweep', start('end') - .48, 'swish', .2, .8);
    T.ballot = G('ballot', start('end') - .06, 'slap', .25, 1.1);
    T.balOut = DUR - .72; G('balOut', T.balOut, 'swish', .15, .8);
    T.coverDrop = DUR - .35; T.seamL = T.balOut; T.capEnd = T.balOut - .05;
    T.nums = at('end', 'drop');
    for (var ni = 0; ni < 9; ni++) EV.push({ t: T.nums + ni * .06, type: 'tock', g: .5, id: 'num' + ni });
    C.c5.blank = C.c5b; C.vi.blank = C.vib;
    STRESS = [['claude', 'claude'], ['claude', 'silent'], ['tommy', 'tommy'], ['cj', 'cj'], ['niko', 'again'], ['niko', 'niko'], ['five', 'enough'], ['q', '6'], ['back', 'vice'], ['back', '24'], ['two', 'two'], ['end', 'number']].map(function (p) { return at(p[0], p[1]); });
    cardExtras();
    clipUses();
    EV.sort(function (a, b) { return a.t - b.t; });
  }
  /* the extras that ride on single cards */
  function cardExtras() {
    C.c1.extra = function (g, t) {
      /* a muted speech bubble stamped in coral ink: the hero who never talks (no words to read) */
      if (t < T.noLines - .01) return; var k = eo(seg(t, T.noLines, T.noLines + .14)), sc = lerp(1.4, 1, k);
      g.save(); g.globalAlpha *= fin(t, T.noLines, .05) * .9; g.translate(250, 168); g.rotate(-.1); g.scale(sc, sc);
      g.strokeStyle = CORALD; g.lineWidth = 12; g.lineJoin = 'round'; g.lineCap = 'round';
      g.beginPath(); g.ellipse(0, -6, 92, 60, 0, 0, TAU); g.stroke();
      g.beginPath(); g.moveTo(-40, 46); g.lineTo(-70, 82); g.lineTo(-10, 52); g.stroke();
      g.beginPath(); g.moveTo(-100, 70); g.lineTo(100, -80); g.stroke();
      g.restore();
    };
    C.c4.extra = function (g, t) {
      if (t < T.again - .01 || t > T.lands[4] + .02) return;
      /* card-local: the tag sits below the card on the desk (card centre CYC, so +460 local is y ~1350) */
      var bb = C.c4.pc.box.city, k = eo(seg(t, T.again, T.again + .3)), ax = (bb[0] + bb[2]) / 2, ay = bb[3] + 6, ex = 230, ey = 450;
      var pe = [lerp(ax, ex, k), lerp(ay, ey, k)], nr = NOREC; NOREC = nr || k < 1;
      g.save(); g.strokeStyle = STR; g.lineWidth = 6; g.lineCap = 'round'; g.shadowColor = 'rgba(0,0,0,.4)'; g.shadowBlur = 6; g.shadowOffsetY = 4;
      g.beginPath(); g.moveTo(ax, ay); g.quadraticCurveTo((ax + pe[0]) / 2 + 40 * k, (ay + pe[1]) / 2, pe[0], pe[1]); g.stroke(); g.restore();
      g.beginPath(); g.arc(ax, ay, 10, 0, TAU); g.fillStyle = STR; g.fill(); NOREC = nr;
      stampLocal(g, D.again, ex, ey + 4, .03, T.again + .22, t);
    };
  }

  /* =====================================================================================================
     FOOTAGE (footage upgrade 2026-11-24): official Rockstar video as evidence photos on the desk.
     GTA V: a Los Santos print on "Los Santos", then Michael, Franklin and Trevor, each on his own spoken name.
     GTA VI: Vice City at night behind the desk on "Back to Vice City" (rule 11 plate), then Jason and Lucia on their names.
     Every use is muted, under 5 s, and lands on the word it proves (SAFE-EDIT rules 7 and 11).
     ===================================================================================================== */
  var PR = [];   // print uses, in order
  function fit(name, t0, t1, o) {
    o = o || {}; var c = CLIP.manifest().clips[name], len = c.frames / 30 - .05, from = o.from || 0;
    var u = CLIP.use(name, t0, t1, { plate: !!o.plate, from: from, speed: Math.min(1, (len - from) / (t1 - t0)), zoom: o.zoom || [1.04, 1.12], focus: o.focus || [.5, .45], note: o.note });
    if (!o.plate) PR.push(u); return u;
  }
  function clipUses() {
    CLIP.reset(); PR.length = 0;
    var aM = at('three', 'michael') - .06, aF = at('three', 'franklin') - .06, aT = at('three', 'trevor') - .06;
    T.p1in = at('five', 'los') - .12; T.p1out = T.sweep;
    CLIP.use('vcity', T.p1in, aM, { from: 0, speed: 1, freeze: .82, zoom: [1.04, 1.16], focus: [.5, .5], note: 'GTA V Los Santos on the voice: 2013, Los Santos (bike + skyline only, 1x, held on the skyline)' }); PR.push(CLIP.active(T.p1in + .01));
    fit('michael', aM, aF, { note: 'Michael on the spoken name', focus: [.62, .4] });
    fit('franklin', aF, aT, { note: 'Franklin on the spoken name', focus: [.62, .35], from: .2 });
    fit('trevor', aT, T.p1out + .3, { note: 'Trevor on the spoken name', focus: [.5, .38] });
    fit('roof', T.backMove - .12, T.twoBack + .25, { plate: true, note: 'Vice City at night behind the desk on: back to Vice City', zoom: [1.1, 1.0], focus: [.5, .5], from: .6 });
    var aJ = at('two', 'jason') - .08, aL = at('two', 'lucia') - .08;
    T.p2in = C.two[0].tear + .06; T.p2out = T.endSweep;
    fit('jason', T.p2in, aL, { note: 'Jason on the spoken name (rockstargames.com/VI character clip)', focus: [.55, .3], zoom: [1.12, 1.2] });
    fit('lucia', aL, T.p2out + .3, { note: 'Lucia on the spoken name (rockstargames.com/VI character clip)', focus: [.6, .38], zoom: [1.15, 1.22], from: .55 });
    EV.push({ t: T.p1in, type: 'swish', g: .7, id: 'p1in' }); EV.push({ t: T.p2in, type: 'swish', g: .7, id: 'p2in' });
    [aM, aF, aT, aL].forEach(function (a, i) { EV.push({ t: a, type: 'tock', g: .6, id: 'pcut' + i }); });
  }
  /* the evidence print: a white-bordered photo lying on the felt under the case cards */
  var PW = 880, PH = 495, PX = 540, PY = 1530;
  function printLayer(g, t) {
    var u = CLIP.active(t); if (!u) return;
    var inA = t < T.p2in - .01 ? T.p1in : T.p2in, outA = t < T.p2in - .01 ? T.p1out : T.p2out;
    var ki = eo(seg(t, inA, inA + .32)), ko = eio(seg(t, outA, outA + .3)), dy = 700 * (1 - ki) + 760 * ko;
    var rot = (t < T.p2in ? -.018 : .016) + .06 * (1 - ki), B = 18;
    g.save(); g.translate(PX, PY + dy); g.rotate(rot);
    g.shadowColor = 'rgba(0,0,0,.55)'; g.shadowBlur = 26; g.shadowOffsetY = 14;
    g.fillStyle = '#f4efe4'; g.fillRect(-PW / 2 - B, -PH / 2 - B, PW + 2 * B, PH + 2 * B + 26);
    g.shadowColor = 'transparent';
    /* a hard cut on each name: a 2-frame flash so the swap reads as a new photo */
    CLIP.draw(g, t, -PW / 2, -PH / 2, PW, PH, u);
    var fl = 1 - seg(t, u.t0, u.t0 + .08); if (fl > 0 && u.t0 > inA + .05) { g.fillStyle = 'rgba(255,250,240,' + (.5 * fl) + ')'; g.fillRect(-PW / 2, -PH / 2, PW, PH); }
    g.fillStyle = 'rgba(255,240,210,.06)'; g.fillRect(-PW / 2, -PH / 2, PW, PH);
    tape(g, -PW / 2 + 60, -PH / 2 - 6, 130, 34, -.3); tape(g, PW / 2 - 60, -PH / 2 - 6, 130, 34, .28);
    g.font = '700 28px "Geist Mono", monospace'; var cw = g.measureText('CLIP · ' + String(CLIP.manifest().sources[CLIP.manifest().clips[u.clip].src].credit).toUpperCase()).width;
    CLIP.credit(g, u, PW / 2 - 22 - cw, -PH / 2 + 48, '700 28px "Geist Mono", monospace');
    g.restore();
  }
  function plateLayer(g, t) {
    var u = CLIP.activePlate(t); if (!u) return;
    var k = seg(t, u.t0, u.t0 + .25) * (1 - seg(t, u.t1 - .25, u.t1));
    g.save(); g.globalAlpha = k; CLIP.plate(g, t, 0, 0, W, H, { dim: .35 });
    /* keep a green felt edge so the desk still reads as a desk */
    var gr = g.createRadialGradient(540, 900, 300, 540, 900, 1250); gr.addColorStop(0, 'rgba(10,40,28,0)'); gr.addColorStop(1, 'rgba(10,40,28,.3)'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    g.restore();
    if (k > .5) CLIP.credit(g, u, 110, 1482, '700 28px "Geist Mono", monospace');
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

  BODY.tear = .2; BODY.twang = .3; BODY.slap = .1; BODY.stamp = .2; BODY.swish = .22; BODY.thock = .12;
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
    function nband(t0, t1, f0, f1, g0, g1, q, pan, type) { var o = bus(1, pan), bp = ac.createBiquadFilter(); bp.type = type || 'bandpass'; bp.Q.value = q || .7; var n = noise(t0, t1 - t0 + .1); n.connect(bp); bp.connect(o); env(bp.frequency, [[t0, f0], [t1, f1]]); env(o.gain, [[t0, 0], [t0 + (t1 - t0) * .4, g0], [t1 - .02, g1], [t1, 0]]); }
    function tick(t, g, f) { var n = noise(t, .03), bp = ac.createBiquadFilter(); bp.type = 'highpass'; bp.frequency.value = f || 3200; var o = bus(1, (rnd() - .5) * .3); n.connect(bp); bp.connect(o); env(o.gain, [[t, 0], [t + .003, .16 * (g || 1)], [t + .024, 0]]); }
    function thump(t, g, f) { var o = osc2('sine', f || 150, t, t + .2, [[t, 0], [t + .004, g || .4], [t + .14, 0]]); o.frequency.exponentialRampToValueAtTime(50, t + .12); }
    function boom(t, g, f0, f1, dur) { var o = osc2('sine', f0, t, t + dur + .05, [[t, 0], [t + .006, g], [t + dur * .35, g * .55], [t + dur, 0]]); o.frequency.exponentialRampToValueAtTime(f1, t + dur * .8); }
    function stamp(t, g) { tick(t, 1.6 * g, 2400); thump(t, .8 * g, 170); boom(t, .35 * g, 130, 60, .18); var sn = noise(t, .12), sl = ac.createBiquadFilter(); sl.type = 'lowpass'; sl.frequency.value = 1500; var so = bus(1); sn.connect(sl); sl.connect(so); env(so.gain, [[t, 0], [t + .004, .32 * g], [t + .1, 0]]); }
    function thock(t, g) { thump(t, .35 * g, 220); tick(t, .9 * g, 1800); nband(t, t + .07, 2600, 1300, .08 * g, .01 * g, 1); }
    /* a card slapping onto paper: a soft low thump and a papery crack */
    function slap(t, g) { thump(t, .3 * g, 240); nband(t, t + .07, 2600, 1200, .14 * g, .01 * g, .9); tick(t, 1.1 * g, 2000); nband(t, t + .04, 2000, 1300, .16 * g, .02 * g, 1.4); }
    /* the redaction tear: tape ripping off paper, a fast run of crackles over a rising band of noise */
    function tear(t, g) { for (var j = 0; j < 11; j++) tick(t + j * .015 + rnd() * .006, (.5 + rnd() * .7) * g, 1800 + rnd() * 3200); nband(t, t + .18, 1300, 4600, .22 * g, .06 * g, 1.1); nband(t + .02, t + .14, 600, 1100, .1 * g, .02 * g, .8); }
    function tock(t, g) { tick(t, .7 * g, 2600); thump(t, .12 * g, 520); }
    function swish(t, g) { nband(t, t + .2, 900, 3600, .2 * g, .03 * g, .8); }
    /* the red string plucked: a low triangle twang that sags in pitch */
    function twang(t, g) { var o = osc2('triangle', 196, t, t + .55, [[t, 0], [t + .004, .22 * g], [t + .5, 0]]); o.frequency.exponentialRampToValueAtTime(176, t + .45); var o2 = osc2('sine', 392, t, t + .3, [[t, 0], [t + .004, .08 * g], [t + .25, 0]]); o2.frequency.exponentialRampToValueAtTime(352, t + .25); tick(t, .8 * g, 2600); }
    var LEVEL = { tock: 2, stamp: 1, thock: 5, slap: 3, tear: 3, swish: 3, twang: 3 };
    var TRIM = window.SFX_TRIM || {};
    var TYPE_DB = window.SFX_TYPE_DB || { tock: -22, stamp: -12, thock: -16, slap: -14, tear: -14, swish: -16, twang: -12 };
    EV.forEach(function (e) {
      var g = (e.g == null ? 1 : e.g) * (LEVEL[e.type] || 1) * Math.pow(10, ((TRIM[e.id] || 0) + (TYPE_DB[e.type] || 0)) / 20);
      if (e.type === 'stamp') stamp(e.t, g);
      else if (e.type === 'thock') thock(e.t, g);
      else if (e.type === 'slap') slap(e.t, g);
      else if (e.type === 'tear') tear(e.t, g);
      else if (e.type === 'swish') swish(e.t, g);
      else if (e.type === 'tock') tock(e.t, g);
      else if (e.type === 'twang') twang(e.t, g);
    });
    /* no music: Isac adds a platform sound; the film ships voice + sound effects */
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
    var fonts = ['900 84px Archivo', '800 84px Archivo', '700 46px Archivo', '700 40px "Geist Mono"', '800 58px "Geist Mono"'];
    return Promise.all([CLIP.load('clips.json')].concat(fonts.map(function (f) { return document.fonts.load(f, 'Aa0%°×−≈≠µ“”‘’·→…#?‹|~$+—½@&!§'); }))).then(function () { return document.fonts.ready; }).then(function () {
      buildTextures(); EV.length = 0; initTimes();
      window.FILM.POSTER = Math.round((T.yrs + .7) * 30) / 30 + 1 / 60;
      window.FILM.SHOTS = [{ id: 'hook', name: 'Name them', t0: 0, t1: start('claude') }, { id: 'claude', name: 'Claude', t0: start('claude'), t1: start('tommy') }, { id: 'tommy', name: 'Tommy', t0: start('tommy'), t1: start('cj') }, { id: 'cj', name: 'CJ', t0: start('cj'), t1: start('niko') }, { id: 'niko', name: 'Niko', t0: start('niko'), t1: start('five') }, { id: 'five', name: 'Three leads', t0: start('five'), t1: start('q') }, { id: 'q', name: 'GTA 6', t0: start('q'), t1: start('two') }, { id: 'two', name: 'Jason and Lucia', t0: start('two'), t1: start('end') }, { id: 'end', name: 'Vote', t0: start('end'), t1: DUR }];
      window.READY = true;
    });
  }
  window.FILM = { bare: function () { ctx.setTransform(1, 0, 0, 1, 0, 0); stage(ctx); }, W: W, H: H, DUR: DUR, POSTER: 0, SLUG: 'gta-heroes', SHOTS: [], init: init, render: render, frame: frame, LIVE: LIVE, LIVE2: LIVE2, T: T, GT: GT };
  window.BOUNDS_RUN = function (step) {
    BOUNDS = []; var o = {};
    for (var t = 0; t <= DUR + 1e-6; t += step || 1 / 15) { CURT = t; POSTERMODE = false; frame(ctx, t); }
    BOUNDS.forEach(function (b) { var r = o[b.text] || (o[b.text] = { text: b.text, from: b.t, to: b.t, x0: b.x0, x1: b.x1, y1: b.y1, n: 0 }); r.to = b.t; r.n++; r.x0 = Math.min(r.x0, b.x0); r.x1 = Math.max(r.x1, b.x1); r.y1 = Math.max(r.y1, b.y1); });
    BOUNDS = null; return Object.keys(o).map(function (k) { return o[k]; });
  };
  /* rail scan: with the backdrop and the clip off, every prop shape and glyph must stay inside x 90-930 and above y 1450 */
  window.RAIL_SCAN = function (fps, subs) {
    fps = fps || 30; subs = subs || 3; var bad = [], n = Math.round(DUR * fps), span = .5 / fps;
    LIVE2.bg = false; LIVE2.clip = false; var lg = LIVE.grain; LIVE.grain = false; var lt = LIVE.text; LIVE.text = false;
    function dirty(x, y, w, h) { var d = ctx.getImageData(x, y, w, h).data, o = { c: 0, x0: 1e9, x1: -1, y0: 1e9, y1: -1 }; for (var i = 0; i < d.length; i += 4) if (Math.abs(d[i] - 0x0a) + Math.abs(d[i + 1] - 0x14) + Math.abs(d[i + 2] - 0x30) > 24) { var px = (i / 4) % w, py = Math.floor(i / 4 / w); o.c++; o.x0 = Math.min(o.x0, px); o.x1 = Math.max(o.x1, px); o.y0 = Math.min(o.y0, y + py); o.y1 = Math.max(o.y1, y + py); } return o; }
    for (var i = 0; i < n; i++) for (var s = 0; s < subs; s++) {
      var t = (i + .5) / fps - span / 2 + span * (s + .5) / subs; frame(ctx, clamp(t, 0, DUR));
      var L0 = dirty(0, 300, 90, H - 300), R0 = dirty(930, 300, 150, H - 300), B0 = dirty(90, 1450, 840, H - 1450);
      if (L0.c + R0.c + B0.c > 0) { bad.push({ f: i, t: +t.toFixed(3), left: L0.c && [L0.c, L0.x0, L0.y0, L0.y1], right: R0.c && [R0.c, R0.x1 + 930, R0.y0, R0.y1], bottom: B0.c && [B0.c, B0.y1, B0.x0 + 90, B0.x1 + 90] }); break; }
    }
    LIVE2.bg = true; LIVE2.clip = true; LIVE.grain = lg; LIVE.text = lt; return bad;
  };
  window.DUR = DUR; window.EV = EV; window.TEXTS = TEXTS; window.SCORE = SCORE; window.READY = false;
  window.render = function (t, s, sh, fps) { render(t, s, sh, fps); };
})();
