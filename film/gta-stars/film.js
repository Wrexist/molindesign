/* "GTA's crooked cop? Samuel L. Jackson.": Delta, pillar 7 (pop culture).
   A vertical film written in code, narrated first and cut to the voice: every visual beat is keyed to a word time from
   vo/vo.js (window.VO) with at(id, word). Pure function of t. Contract: window.FILM, DUR, render(t), READY, EV, TEXTS(t),
   SCORE(ctx). Samuel L. Jackson voiced Officer Tenpenny in GTA: San Andreas (2004; Game Developer cast round-up); Ray Liotta was "the iconic
   voice of Tommy Vercetti" (Rockstar, 2022) in Vice City (2002); Burt Reynolds argued with Dan Houser over a Vice City
   scene and yelled "Get the limey out of here." (Houser to Vulture, 2018-10-14), where Houser also said Rockstar doesn't
   bring in name actors anymore, partly egos and most of all immersion with voices you don't recognize. GTA VI Nov 19 2026.
   The set is a hand-cut paper backstage corridor (the native move: the camera trucks along it); the hero is a dressing-
   room door with our own plain gold star. Engine from film/gta-origin. No likeness of anyone, no footage, logos or music. */
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
     THE SET: a hand-cut paper backstage corridor seen straight on. Plum wallpaper, a chair rail, a kraft floor;
     it bleeds to the full frame (background only). Dressing-room doors stand along it, each with our own gold
     paper star (a plain five-point star: no sidewalk, no brass ring, no emblem) and a cream name card that
     carries type only. Characters are objects, never people: a cop cap and a generic badge, a pastel jacket on
     a hanger, a script. No likeness, no logos, no key art, no footage, no music.
     ===================================================================================================== */
  var WALL = '#2b1748', WALL2 = '#341d57', CASE = '#1a0f30', FLOOR = '#9a6638', GOLD = '#ffc83d', PADC = '#f4ead6', INK2 = '#2a1850';
  var DW = 520, DH = 880, DY = 1000, VX = 100, VS = .1, X0 = -60, S0 = 1.23;
  /* the doors along the corridor (world x); JASON and LUCIA stand to the left of the frame-0 door */
  var DOORS = [
    { id: 'jason', x: -5000, col: '#c9a26b', name: 'JASON', plain: 1 },
    { id: 'lucia', x: -4380, col: '#efe6d2', name: 'LUCIA', plain: 1 },
    { id: 'p0', x: -1240, col: '#6f8f8a', card: 1, plain: 1 },
    { id: 'empty', x: -620, col: '#8fa3b8', q: 1 },
    { id: 'sam', x: 0, col: '#19b8ab', star: 1, name: 'SAMUEL L. JACKSON', cap: 1 },
    { id: 'ray', x: 620, col: '#ff4fa3', star: 1, name: 'RAY LIOTTA', jacket: 1 },
    { id: 'burt', x: 1240, col: '#ff8a3d', star: 1, name: 'BURT REYNOLDS', booth: 1 },
    { id: 'p1', x: 1860, col: '#7f9c96', card: 1, plain: 1 },
    { id: 'p2', x: 2480, col: '#a88f6f', card: 1, plain: 1 }
  ];
  var SCONCE = [-6300, -5700, -3800, -1900, 3000, 3600];

  function buildWall() {
    var w = 600, y0 = -1000, y1 = 2700, c = mk(w, y1 - y0), g = c.getContext('2d'), r = mulberry(23);
    g.translate(0, -y0);
    /* wallpaper: plum with wide stripes and a gold pinstripe, paper grain over it */
    g.fillStyle = WALL; g.fillRect(0, y0, w, 1460 - y0);
    for (var x = 0; x < w; x += 100) { g.fillStyle = WALL2; g.fillRect(x + 50, y0, 50, 1460 - y0); g.fillStyle = 'rgba(255,200,61,.16)'; g.fillRect(x + 48, y0, 2, 1460 - y0); }
    /* a small repeat motif: paper diamonds in the stripes */
    for (var yy = y0 + 40; yy < 1100; yy += 120) for (x = 0; x < w; x += 100) { g.fillStyle = 'rgba(255,79,163,.10)'; g.save(); g.translate(x + 75, yy + (x / 100 % 2) * 60); g.rotate(Math.PI / 4); g.fillRect(-9, -9, 18, 18); g.restore(); }
    /* crown molding, chair rail, wainscot below, baseboard */
    g.fillStyle = '#1f1036'; g.fillRect(0, 380, w, 34); g.fillStyle = 'rgba(255,247,228,.18)'; g.fillRect(0, 380, w, 4);
    g.fillStyle = '#24123f'; g.fillRect(0, 1140, w, 320);
    for (x = 20; x < w; x += 150) { g.strokeStyle = 'rgba(255,247,228,.12)'; g.lineWidth = 4; g.strokeRect(x, 1190, 110, 220); }
    g.fillStyle = '#3d2463'; g.fillRect(0, 1118, w, 26); g.fillStyle = 'rgba(255,247,228,.3)'; g.fillRect(0, 1118, w, 4);
    g.fillStyle = '#120a22'; g.fillRect(0, 1440, w, 36); g.fillStyle = 'rgba(255,247,228,.2)'; g.fillRect(0, 1440, w, 3);
    /* floor: kraft planks running away from us, seams staggered (period 600) */
    g.fillStyle = FLOOR; g.fillRect(0, 1476, w, y1 - 1476);
    for (yy = 1476; yy < y1; yy += 64) { g.fillStyle = 'rgba(60,30,10,.35)'; g.fillRect(0, yy, w, 3); var off = (yy / 64 % 3) * 200; for (x = off % 300; x < w; x += 300) g.fillRect(x, yy, 3, 64); }
    g.globalAlpha = .75; g.fillStyle = g.createPattern(GRAIN, 'repeat'); g.fillRect(0, y0, w, y1 - y0); g.globalAlpha = 1;
    return { c: c, y0: y0, w: w, h: y1 - y0 };
  }
  function doorPiece(col) {
    return piece([-DW / 2, -DH / 2, DW / 2, DH / 2], function (g) { g.beginPath(); g.rect(-DW / 2, -DH / 2, DW, DH); }, col, { ps: 1.2, sx: 8, sy: 0, blur: 14, extra: function (g) {
      g.strokeStyle = 'rgba(29,18,51,.28)'; g.lineWidth = 6; rr(g, -DW / 2 + 40, -DH / 2 + 380, DW - 80, 200, 6); g.stroke(); rr(g, -DW / 2 + 40, -DH / 2 + 620, DW - 80, 220, 6); g.stroke();
      g.strokeStyle = 'rgba(255,255,255,.28)'; g.lineWidth = 3; rr(g, -DW / 2 + 44, -DH / 2 + 384, DW - 88, 192, 5); g.stroke(); rr(g, -DW / 2 + 44, -DH / 2 + 624, DW - 88, 212, 5); g.stroke();
      g.fillStyle = 'rgba(255,255,255,.14)'; g.beginPath(); g.moveTo(DW / 2 - 150, -DH / 2); g.lineTo(DW / 2 - 90, -DH / 2); g.lineTo(DW / 2 - 290, DH / 2); g.lineTo(DW / 2 - 350, DH / 2); g.closePath(); g.fill();
      g.fillStyle = 'rgba(0,0,0,.12)'; g.fillRect(-DW / 2, DH / 2 - 60, DW, 60);
    } });
  }
  function casingPiece() {
    var w = DW + 64, h = DH + 40;
    return piece([-w / 2, -h / 2 - 20, w / 2, h / 2], function (g) { g.beginPath(); g.rect(-w / 2, -h / 2 - 20, w, h + 20); }, '#4b2a6b', { ps: 1, sx: 6, sy: 6, blur: 12, extra: function (g) { g.fillStyle = '#5c3683'; g.fillRect(-w / 2, -h / 2 - 20, w, 26); g.fillStyle = CASE; g.fillRect(-DW / 2 - 4, -DH / 2 + 4, DW + 8, DH + 30); } });
  }
  function starPath(g, R, r0, rot) { g.beginPath(); for (var k = 0; k < 10; k++) { var a = -Math.PI / 2 + k * Math.PI / 5 + (rot || 0), R2 = k % 2 ? r0 : R; g.lineTo(Math.cos(a) * R2, Math.sin(a) * R2); } g.closePath(); }
  var SR = 112;
  function starPiece(clip) {
    return piece([-SR, -SR, SR, SR], function (g) { if (clip) { clip(g); g.clip(); } starPath(g, SR, SR * .42); }, GOLD, { ps: 2, sx: 4, sy: 8, blur: 8, extra: function (g) {
      g.fillStyle = '#ffdb72'; starPath(g, SR * .62, SR * .26); g.fill();
      g.strokeStyle = 'rgba(160,90,0,.35)'; g.lineWidth = 2.5; for (var k = 0; k < 5; k++) { var a = -Math.PI / 2 + k * TAU / 5; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(a) * SR * .9, Math.sin(a) * SR * .9); g.stroke(); }
    } });
  }
  /* the crack runs top to bottom in a zigzag; each half is its own cut piece */
  var CRK = [[8, -SR - 4], [-14, -50], [16, -12], [-10, 28], [12, 66], [-4, SR + 4]];
  function halfClip(side) { return function (g) { g.beginPath(); g.moveTo(side * 200, -SR - 10); CRK.forEach(function (p) { g.lineTo(p[0], p[1]); }); g.lineTo(side * 200, SR + 10); g.closePath(); }; }
  function cardBlank(w) { return piece([-w / 2, -54, w / 2, 54], function (g) { rr(g, -w / 2, -54, w, 108, 8); }, PADC, { ps: 1.4, sx: 4, sy: 7, blur: 8, extra: function (g) { g.strokeStyle = 'rgba(29,18,51,.18)'; g.lineWidth = 3; rr(g, -w / 2 + 10, -44, w - 20, 88, 5); g.stroke(); } }); }
  function capPiece() {
    return piece([-160, -110, 160, 90], function (g) {
      g.beginPath(); g.moveTo(-150, -40); g.quadraticCurveTo(-140, -110, 0, -108); g.quadraticCurveTo(140, -110, 150, -40); g.lineTo(118, 20); g.lineTo(-118, 20); g.closePath();
      g.moveTo(-122, 18); g.lineTo(122, 18); g.lineTo(122, 50); g.lineTo(-122, 50); g.closePath();
      g.moveTo(140, 50); g.ellipse(0, 52, 140, 34, 0, 0, Math.PI);
    }, '#22305e', { ps: 2, sx: 6, sy: 10, blur: 10, extra: function (g) {
      g.fillStyle = '#16203f'; g.fillRect(-122, 18, 244, 32);
      g.fillStyle = '#0d0a18'; g.beginPath(); g.ellipse(0, 52, 140, 34, 0, 0, Math.PI); g.fill();
      g.fillStyle = 'rgba(255,255,255,.18)'; g.beginPath(); g.ellipse(-40, 60, 70, 8, 0, 0, Math.PI); g.fill();
      g.strokeStyle = GOLD; g.lineWidth = 5; g.beginPath(); g.moveTo(-118, 26); g.lineTo(118, 26); g.stroke();
      g.fillStyle = GOLD; starPath(g, 30, 13); g.save(); g.translate(0, -36); starPath(g, 30, 13); g.fill(); g.restore();
      g.fillStyle = 'rgba(255,255,255,.12)'; g.beginPath(); g.moveTo(-120, -50); g.quadraticCurveTo(-100, -100, -20, -100); g.lineTo(-30, -80); g.quadraticCurveTo(-90, -78, -100, -40); g.closePath(); g.fill();
    } });
  }
  function badgePiece() {
    return piece([-70, -84, 70, 84], function (g) { g.beginPath(); g.moveTo(0, -84); g.quadraticCurveTo(46, -64, 70, -70); g.quadraticCurveTo(70, 30, 0, 84); g.quadraticCurveTo(-70, 30, -70, -70); g.quadraticCurveTo(-46, -64, 0, -84); g.closePath(); }, '#e9c25a', { ps: 2, sx: 4, sy: 8, blur: 8, extra: function (g) {
      g.strokeStyle = 'rgba(120,70,0,.5)'; g.lineWidth = 5; g.beginPath(); g.moveTo(0, -70); g.quadraticCurveTo(38, -54, 58, -58); g.quadraticCurveTo(58, 24, 0, 70); g.quadraticCurveTo(-58, 24, -58, -58); g.quadraticCurveTo(-38, -54, 0, -70); g.stroke();
      g.fillStyle = '#ffe28a'; g.save(); g.translate(0, -2); starPath(g, 34, 15); g.fill(); g.restore();
      g.fillStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.ellipse(-26, -36, 9, 20, -.4, 0, TAU); g.fill();
    } });
  }
  function jacketPiece() {
    var C = '#c9b6ff';
    return piece([-180, -40, 180, 400], function (g) {
      g.beginPath(); g.moveTo(-60, -10); g.lineTo(-170, 30); g.lineTo(-180, 380); g.lineTo(-20, 392); g.lineTo(0, 150); g.lineTo(20, 392); g.lineTo(180, 380); g.lineTo(170, 30); g.lineTo(60, -10); g.lineTo(0, 40); g.closePath();
    }, C, { ps: 1.6, sx: 6, sy: 10, blur: 12, extra: function (g) {
      g.fillStyle = '#b3a0f0'; g.beginPath(); g.moveTo(-60, -10); g.lineTo(-20, 150); g.lineTo(-84, 120); g.lineTo(-96, 20); g.closePath(); g.fill(); g.beginPath(); g.moveTo(60, -10); g.lineTo(20, 150); g.lineTo(84, 120); g.lineTo(96, 20); g.closePath(); g.fill();
      g.fillStyle = '#f4ead6'; g.beginPath(); g.moveTo(-60, -10); g.lineTo(0, 40); g.lineTo(60, -10); g.lineTo(26, 120); g.lineTo(0, 150); g.lineTo(-26, 120); g.closePath(); g.fill();
      g.fillStyle = INK2; [[0, 210], [0, 280]].forEach(function (b) { g.beginPath(); g.arc(b[0] + 12, b[1], 9, 0, TAU); g.fill(); });
      g.fillStyle = 'rgba(29,18,51,.18)'; g.fillRect(-150, 250, 70, 8); g.fillRect(80, 250, 70, 8); g.fillRect(-140, 90, 50, 6);
      g.fillStyle = '#19d3c5'; g.beginPath(); g.moveTo(-136, 84); g.lineTo(-104, 84); g.lineTo(-110, 112); g.lineTo(-130, 112); g.closePath(); g.fill();
    } });
  }
  function scriptPiece() {
    var w = 420, h = 560, rec = [];
    var pc = piece([-w / 2, -h / 2, w / 2, h / 2], function (g) { rr(g, -w / 2, -h / 2, w, h, 6); }, PADC, { ps: 1.4, sx: 10, sy: 16, blur: 18, extra: function (g) {
      g.fillStyle = '#e8dcc0'; g.fillRect(-w / 2, h / 2 - 14, w, 14);
      g.fillStyle = HOT; g.fillRect(-w / 2, -h / 2, w, 22);
      [-1, 0, 1].forEach(function (k) { g.fillStyle = '#8a8fa6'; g.beginPath(); g.arc(-w / 2 + 26, k * 170, 10, 0, TAU); g.fill(); });
      cond(g, 'condensed'); font(g, 54, 900); ls(g, 4); g.fillStyle = INK; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('SCRIPT', 10, -170); var mm = g.measureText('SCRIPT'); rec.push([10 - mm.width / 2, -170 - 30, 10 + mm.width / 2, -170 + 24, 'SCRIPT']); unst(g);
      g.fillStyle = 'rgba(29,18,51,.25)'; for (var y = -90; y < h / 2 - 50; y += 30) { var L = 120 + ((y * 37) % 150 + 150) % 150; g.fillRect(-w / 2 + 70 + (y % 60 === 0 ? 60 : 0), y, L, 8); }
    } });
    return wordsOf(pc, rec);
  }
  function flagPiece() {
    var w = 150, h = 96;
    return piece([0, -h / 2, w, h / 2], function (g) { g.beginPath(); g.rect(0, -h / 2, w, h); }, '#1f3a8a', { ps: 2, sx: 4, sy: 6, blur: 6, extra: function (g) {
      g.strokeStyle = '#f4ead6'; g.lineWidth = 18; g.beginPath(); g.moveTo(0, -h / 2); g.lineTo(w, h / 2); g.moveTo(w, -h / 2); g.lineTo(0, h / 2); g.stroke();
      g.strokeStyle = '#e0283c'; g.lineWidth = 6; g.beginPath(); g.moveTo(0, -h / 2); g.lineTo(w, h / 2); g.moveTo(w, -h / 2); g.lineTo(0, h / 2); g.stroke();
      g.fillStyle = '#f4ead6'; g.fillRect(w / 2 - 16, -h / 2, 32, h); g.fillRect(0, -16, w, 32);
      g.fillStyle = '#e0283c'; g.fillRect(w / 2 - 9, -h / 2, 18, h); g.fillRect(0, -9, w, 18);
    } });
  }
  function bubblePiece(col, word, flip) {
    var w = 300, h = 190, rec = [];
    var pc = piece([-w / 2, -h / 2, w / 2, h / 2 + 60], function (g) {
      g.beginPath(); for (var k = 0; k < 22; k++) { var a = k * TAU / 22, R = k % 2 ? .82 : 1; g.lineTo(Math.cos(a) * w / 2 * R, Math.sin(a) * h / 2 * R); } g.closePath();
      g.moveTo(flip * -30, h / 2 - 20); g.lineTo(flip * -80, h / 2 + 58); g.lineTo(flip * 20, h / 2 - 10); g.closePath();
    }, col, { ps: 1.6, sx: 5, sy: 9, blur: 10, extra: function (g) {
      cond(g, 'condensed'); font(g, 78, 900); ls(g, 2); g.fillStyle = INK; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(word, 0, 4); var mm = g.measureText(word); rec.push([-mm.width / 2, 4 - 40, mm.width / 2, 4 + 34, word]); unst(g);
    }, noclip: true });
    return wordsOf(pc, rec);
  }
  function balloonPiece() {
    return piece([-120, -150, 120, 150], function (g) { g.beginPath(); g.ellipse(0, -10, 110, 132, 0, 0, TAU); g.moveTo(-14, 118); g.lineTo(14, 118); g.lineTo(0, 142); g.closePath(); }, HOT, { ps: 1.6, sx: 6, sy: 10, blur: 10, extra: function (g) {
      g.fillStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.ellipse(-48, -70, 20, 42, -.5, 0, TAU); g.fill();
      g.fillStyle = 'rgba(120,0,50,.2)'; g.beginPath(); g.ellipse(36, 30, 50, 80, .3, 0, TAU); g.fill();
    } });
  }
  function lampPiece(on) {
    return piece([-56, -40, 56, 34], function (g) { g.beginPath(); g.moveTo(-50, 20); g.quadraticCurveTo(-50, -40, 0, -40); g.quadraticCurveTo(50, -40, 50, 20); g.closePath(); g.rect(-56, 18, 112, 16); }, on ? '#ff3b4e' : '#6a2433', { ps: 2, sx: 3, sy: 5, blur: 6, extra: function (g) { g.fillStyle = '#1a0f30'; g.fillRect(-56, 18, 112, 16); g.fillStyle = on ? 'rgba(255,230,230,.7)' : 'rgba(255,255,255,.15)'; g.beginPath(); g.ellipse(-16, -14, 9, 15, -.4, 0, TAU); g.fill(); } });
  }
  function sconcePiece() {
    return piece([-60, -70, 60, 60], function (g) { g.beginPath(); g.moveTo(-50, -60); g.lineTo(50, -60); g.lineTo(30, 20); g.lineTo(-30, 20); g.closePath(); g.rect(-8, 20, 16, 40); }, '#ffd59a', { ps: 1.4, sx: 4, sy: 6, blur: 6, extra: function (g) { g.fillStyle = 'rgba(255,138,61,.35)'; g.fillRect(-50, -20, 100, 8); g.fillStyle = '#5c3683'; g.fillRect(-8, 20, 16, 40); } });
  }
  function shredPiece(seed) { var r = mulberry(seed), pts = []; for (var k = 0; k < 5; k++) pts.push([(r() - .5) * 60, (r() - .5) * 34]); return piece([-34, -20, 34, 20], function (g) { g.beginPath(); pts.forEach(function (p) { g.lineTo(p[0], p[1]); }); g.closePath(); }, HOT, { ps: 1.5, sx: 3, sy: 5, blur: 4, edge: 1.5 }); }

  function buildTextures() {
    GRAIN = buildGrain();
    P.wall = buildWall();
    P.casing = casingPiece();
    P.door = {}; DOORS.forEach(function (d) { P.door[d.id] = doorPiece(d.col); });
    P.star = starPiece(); P.starA = starPiece(halfClip(-1)); P.starB = starPiece(halfClip(1));
    P.card = cardBlank(440);
    P.cap = capPiece(); P.badge = badgePiece(); P.jacket = jacketPiece();
    P.lampOn = lampPiece(true); P.lampOff = lampPiece(false); P.sconce = sconcePiece();
    P.script = scriptPiece(); P.flag = flagPiece();
    P.bub1 = bubblePiece('#19d3c5', '#@!', 1); P.bub2 = bubblePiece('#ffc83d', '%&!', -1);
    P.balloon = balloonPiece(); P.shred = [shredPiece(71), shredPiece(72), shredPiece(73), shredPiece(74), shredPiece(75)];
    P.role = cardPiece(470, 196, '#19d3c5', [['OFFICER TENPENNY', 62, INK, -32], ['SAN ANDREAS · 2004', 46, INK2, 42]], { r: 10, ring: 'rgba(29,18,51,.3)' });
    P.vc = cardPiece(380, 176, ORG, [['GTA: VICE CITY', 54, INK, -32], ['2002', 62, INK, 40]], { r: 10, ring: 'rgba(29,18,51,.3)' });
    P.y18 = cardPiece(300, 170, ORG, [['2018', 120, INK, 8]], { r: 10, ring: 'rgba(29,18,51,.3)' });
    P.limey = cardPiece(360, 92, TEAL, [['LIMEY = BRIT', 58, INK, 3]], { r: 10, ring: 'rgba(29,18,51,.3)' });
    P.scope = cardPiece(600, 92, CREAM, [['ROCKSTAR’S WRITER, 2018:', 52, INK, 3]], { r: 10, ring: ORG });
    P.tagEgo = cardPiece(200, 86, CREAM, [['EGOS', 62, HOT, 3]], { r: 8 });
    P.quote = cardPiece(840, 380, NEWS, [['“GET THE LIMEY', 92, INK, -120], ['OUT OF HERE.”', 92, INK, -18], ['REYNOLDS, AS TOLD BY DAN HOUSER ·', 40, INK2, 84], ['VULTURE 2018', 40, INK2, 134]], { r: 4, sy: 14, before: function (g) { g.fillStyle = 'rgba(29,18,51,.05)'; for (var y = -185; y < 185; y += 9) g.fillRect(-420, y, 840, 1); g.fillStyle = 'rgba(29,18,51,.2)'; g.fillRect(-330, 44, 660, 3); } });
    P.stamp = buildStamp(['NO MORE', 'NAME ACTORS'], 92, 440, HOT);
    P.sq = buildStrip('“…VOICES YOU DON’T RECOGNIZE.”', 760, 64, 503);
    P.cal26 = calPiece(HOT, [['NOV', 62, HOT, -112], ['19', 190, INK, 0], ['2026', 72, INK, 122]], 403);
    P.pill6 = cardPiece(270, 96, HOT, [['GTA 6', 72, CREAM, 3]], { r: 48, ring: 'rgba(255,240,234,.9)' });
    var tp2 = jag(301, 1100, 10), bt2 = jag(302, 1100, 10);
    P.sweep = piece([0, -20, 1100, 1580], function (g) { g.beginPath(); g.moveTo(0, tp2[0][1]); tp2.forEach(function (p) { g.lineTo(p[0], p[1]); }); for (var i = bt2.length - 1; i >= 0; i--) g.lineTo(bt2[i][0], 1560 + bt2[i][1]); g.closePath(); }, PADC, { sx: 0, sy: 10, blur: 20, ps: .6, extra: function (g) {
      g.fillStyle = HOT; g.fillRect(0, -20, 1100, 110);
      g.strokeStyle = 'rgba(29,18,51,.12)'; g.lineWidth = 4; for (var y = 200; y < 1500; y += 70) { g.beginPath(); g.moveTo(40, y); g.lineTo(1060, y); g.stroke(); }
    } });
    var tp3 = jag(311, 1100, 10), bt3 = jag(312, 1100, 10);
    P.sweepK = piece([0, -20, 1100, 1580], function (g) { g.beginPath(); g.moveTo(0, tp3[0][1]); tp3.forEach(function (p) { g.lineTo(p[0], p[1]); }); for (var i = bt3.length - 1; i >= 0; i--) g.lineTo(bt3[i][0], 1560 + bt3[i][1]); g.closePath(); }, KRAFT, { sx: 0, sy: 10, blur: 20, ps: .6, extra: function (g) { g.strokeStyle = 'rgba(60,30,10,.18)'; g.lineWidth = 3; for (var x = 30; x < 1100; x += 90) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x + 20, 1560); g.stroke(); } } });
    P.yes = cardPiece(180, 116, CREAM, [['YES', 68, INK, 4]], { r: 12, ring: TEAL });
    P.no = cardPiece(180, 116, CREAM, [['NO', 68, INK, 4]], { r: 12, ring: TEAL });
  }
  function calPiece(bind, lines, seed) {
    var w = 330, h = 410, tp = jag(seed, w, 4);
    return cardPiece(w, h, PADC, lines, { r: 6, sy: 14, path: function (g) { g.beginPath(); g.moveTo(-w / 2, -h / 2 + 8 + tp[0][1]); tp.forEach(function (q) { g.lineTo(-w / 2 + q[0], -h / 2 + 8 + q[1]); }); g.lineTo(w / 2, h / 2); g.lineTo(-w / 2, h / 2); g.closePath(); }, before: function (g) {
      g.fillStyle = bind; g.fillRect(-w / 2, -h / 2, w, 34);
      [-90, 0, 90].forEach(function (x) { g.fillStyle = INK2; g.beginPath(); g.arc(x, -h / 2 + 17, 7, 0, TAU); g.fill(); });
      for (var i = 0; i < 7; i++) { g.fillStyle = 'rgba(29,18,51,.07)'; g.fillRect(-w / 2 + 24 + i * 42, h / 2 - 40, 32, 18); }
    } });
  }

  /* =====================================================================================================
     TIME AND STATE
     ===================================================================================================== */
  var T = {}, LIVE2 = { bg: true, clip: true };
  function sm(t, a, d) { return eio(seg(t, a, a + (d || .5))); }
  function tq(t) { return (Math.floor(t * 30) + .5) / 30; }
  function herm(p0, p1, m0, m1, u) { var u2 = u * u, u3 = u2 * u; return (2 * u3 - 3 * u2 + 1) * p0 + (u3 - 2 * u2 + u) * m0 + (-2 * u3 + 3 * u2) * p1 + (u3 - u2) * m1; }
  /* the camera trucks along the corridor: [t, x, y, s] keys, eased; the first and last segments are Hermite so the loop seam keeps its speed */
  function camRaw(t) {
    var x, y, s;
    if (t < T.h1) { var u = t / T.h1; x = herm(X0, 0, VX * T.h1, 0, u); y = DY; s = herm(S0, 1.35, VS * T.h1, 0, u); }
    else if (t >= T.seamC) { x = X0 - VX * (DUR - t); y = DY; s = S0 - VS * (DUR - t); }
    else {
      var K = T.CAM, q = null;
      for (var i = 0; i < K.length - 1; i++) if (t < K[i + 1][0]) { var a = K[i], b = K[i + 1], k = eio(seg(t, a[0], b[0])); q = { x: lerp(a[1], b[1], k), y: lerp(a[2], b[2], k), s: lerp(a[3], b[3], k) }; break; }
      if (!q) { var L = K[K.length - 1]; q = { x: L[1], y: L[2], s: L[3] }; }
      x = q.x; y = q.y; s = q.s;
    }
    return { x: x, y: y, s: s };
  }
  function camAt(t) { var c = camRaw(t); return { x: c.x + 10 * osc(t, 5, .4), y: c.y + 6 * osc(t, 4, 1.3), s: c.s * (1 + .006 * osc(t, 9, .2)) }; }
  function applyCam(g, c) { g.translate(510, 1050); g.scale(c.s, c.s); g.translate(-c.x, -c.y); }
  function toScreen(c, wx, wy) { return { x: (wx - c.x) * c.s + 510, y: (wy - c.y) * c.s + 1050 }; }

  /* a door's name card: which name it shows, and its flip (face-down = blank cream) */
  function cardState(d, t) {
    var F = T.FLIP[d.id] || [], face = '', k = 1;
    for (var i = 0; i < F.length; i++) {
      var f = F[i]; if (t < f[0] - .13) break;
      if (t < f[0] + .13) { var u = seg(t, f[0] - .13, f[0] + .13); k = Math.abs(Math.cos(Math.PI * u)); face = u < .5 ? (i > 0 ? F[i - 1][1] : '') : f[1]; return { face: face, k: Math.max(.04, k) }; }
      face = f[1];
    }
    return { face: face, k: 1 };
  }
  function nameAlpha(c, d, t) { var op = d.booth && t != null ? boothOpen(t) : 1, sx = (d.x - DW / 2 * (1 - op) - c.x) * c.s + 510, hw = (d.name ? (d.name.length > 12 ? 11 : 15) * d.name.length + 20 : 100) * op, L = sx - hw * c.s, Rr = sx + hw * c.s; return clamp(Math.min(seg(L, 92, 130), 1 - seg(Rr, 890, 928)), 0, 1); }
  function capSwing(t) { return .2 * osc(t, Math.round(DUR * .55), .9) + sw(t, T.flip0, .16, 8, 3) + sw(t, T.badge, .12, 9, 3); }
  function spotA(t) { return t >= T.seamC ? 1 : 1 - seg(t, .85, 1.15); }
  function spotX(t) { return 150 * Math.sin(3.2 * (t > DUR / 2 ? t - DUR : t) + .4); }
  function knocked(d, t) { return T.KN && T.KN[d.id] != null && t >= T.KN[d.id] && t < T.seamC; }
  function jackSwing(t) { return .045 * osc(t, 5, 2.1) + sw(t, T.flipR, .18, 7, 2.6) + sw(t, T.clack, .1, 10, 3.5); }
  function boothOpen(t) { if (t < T.slam) return .6 + .03 * Math.sin(t * 5.3) * seg(t, T.bub0, T.bub0 + .3); return lerp(.63, 1, eo(seg(t, T.slam, T.slam + .09))); }

  /* ---------- the world layer: the corridor, the doors and what hangs on them (camera moves it; it bleeds, no words outside the rail) ---------- */
  function world(g, t) {
    var c = camAt(t);
    g.save(); applyCam(g, c);
    var xlo = c.x - 520 / c.s, xhi = c.x + 580 / c.s;
    var W0 = P.wall, x0 = Math.floor(xlo / W0.w) * W0.w;
    for (var x = x0; x < xhi; x += W0.w) g.drawImage(W0.c, x, W0.y0, W0.w + 1, W0.h);
    /* sconces: flat paper light wedges, a slow breathing glow */
    SCONCE.forEach(function (sx) {
      if (sx < xlo - 300 || sx > xhi + 300) return;
      g.save(); g.globalAlpha = .1 + .03 * osc(t, 6, sx); g.fillStyle = '#ffd59a'; g.beginPath(); g.moveTo(sx - 40, 650); g.lineTo(sx + 40, 650); g.lineTo(sx + 200, 1130); g.lineTo(sx - 200, 1130); g.closePath(); g.fill(); g.restore();
      put(g, P.sconce, sx, 640);
    });
    DOORS.forEach(function (d) { if (d.x + 360 < xlo || d.x - 360 > xhi) return; door(g, d, t, c); });
    g.restore();
  }
  function door(g, d, t, c) {
    g.save(); g.translate(d.x, DY);
    put(g, P.casing, 0, 0);
    /* marquee bulbs on the casing: a slow chase, periodic in the film's length */
    if (d.star) for (var b = 0; b < 9; b++) {
      var bx = -256 + b * 64, br = knocked(d, t) ? 0 : .5 + .5 * Math.sin(TAU * Math.round(DUR * .9) * t / DUR - b * .9 + d.x * .01);
      g.fillStyle = 'rgba(10,6,20,.5)'; g.beginPath(); g.arc(bx + 3, -DH / 2 - 40, 15, 0, TAU); g.fill();
      g.fillStyle = br > .55 ? '#fff1b8' : '#c9a24a'; g.beginPath(); g.arc(bx, -DH / 2 - 43, 14, 0, TAU); g.fill();
      if (br > .55) { g.fillStyle = 'rgba(255,241,184,' + (.18 * (br - .55) / .45).toFixed(3) + ')'; g.beginPath(); g.arc(bx, -DH / 2 - 43, 28, 0, TAU); g.fill(); }
    }
    var open = d.booth ? boothOpen(t) : 1;
    if (d.booth) {
      /* the booth through the gap: dark room, a mic on a stand, a music stand with the script */
      g.fillStyle = '#120a22'; g.fillRect(-DW / 2, -DH / 2, DW, DH);
      g.fillStyle = '#2a1850'; g.fillRect(-DW / 2, DH / 2 - 120, DW, 120);
      g.strokeStyle = '#8a8fa6'; g.lineWidth = 8; g.beginPath(); g.moveTo(190, 420); g.lineTo(190, -80); g.lineTo(150, -120); g.stroke();
      g.fillStyle = '#c7cbe0'; rr(g, 120, -190, 60, 100, 28); g.fill();
      g.fillStyle = PADC; g.beginPath(); g.moveTo(80, -20); g.lineTo(250, -40); g.lineTo(250, 70); g.lineTo(80, 90); g.closePath(); g.fill();
      /* the red lamp over the door: on through the session, off at the slam */
      var on = t >= T.lampOn && t < T.slam;
      put(g, on ? P.lampOn : P.lampOff, 0, -DH / 2 - 100, 0, 1.2);
      if (on) { g.save(); g.globalAlpha = .18 + .06 * Math.sin(t * 9); g.fillStyle = '#ff3b4e'; g.beginPath(); g.arc(0, -DH / 2 - 110, 90, 0, TAU); g.fill(); g.restore(); }
    }
    g.save();
    if (d.booth) { g.translate(-DW / 2, 0); var kk = kn(t, T.slam + .07, .03); g.scale(open, kk); g.translate(DW / 2, 0); }
    put(g, P.door[d.id], 0, 0);
    /* knob */
    g.fillStyle = '#ffd36e'; g.beginPath(); g.arc(DW / 2 - 52, 60, 17, 0, TAU); g.fill(); g.fillStyle = 'rgba(120,70,0,.4)'; g.beginPath(); g.arc(DW / 2 - 48, 64, 8, 0, TAU); g.fill();
    /* the star */
    var sy = -262;
    if (d.star && knocked(d, t)) { /* knocked off: drawn falling after the door */ }
    else if (d.star) {
      if (d.booth && t >= T.crack) {
        var ck = eo(seg(t, T.crack, T.crack + .2));
        put(g, P.starA, -14 * ck, sy + 6 * ck, -.12 * ck); put(g, P.starB, 12 * ck, sy + 16 * ck, .1 * ck);
      } else put(g, P.star, 0, sy, 0, kn(t, T.FLIP[d.id] && T.FLIP[d.id][0] ? T.FLIP[d.id][0][0] : 1e9, .05));
    } else if (d.q) {
      g.save(); g.setLineDash([16, 12]); g.lineWidth = 6; g.strokeStyle = 'rgba(244,234,214,.55)'; g.translate(0, sy); starPath(g, SR, SR * .42); g.stroke(); g.restore();
    }
    /* the name card */
    if (d.name || d.card) {
      var cs = cardState(d, t), na = d.name ? nameAlpha(c, d, t) : 0;
      g.save(); g.translate(0, -104); g.scale(1, cs.k); put(g, P.card, 0, 0);
      if (d.cap && spotA(t) > 0) { g.save(); g.globalAlpha *= .5 * spotA(t); g.fillStyle = '#fff3c4'; g.beginPath(); g.ellipse(spotX(t), 0, 120, 70, 0, 0, TAU); g.fill(); g.restore(); }
      if (d.cap && !cs.face && (t < T.flip0 || t >= T.seamC)) { var qu = t >= T.seamC ? seg(t, T.seamC + .05, T.seamC + .17) : 1, qs = lerp(1.7, 1, eo(qu)) * kn(t, T.seamC + .17, .1); if (qu > 0) { g.save(); g.globalAlpha *= qu; g.rotate(-.06); g.scale(qs, qs); txt(g, '?', 0, 14, { px: 124, col: ORG, align: 'center' }); g.restore(); } }
      if (cs.face && na > 0) { var px = d.name.length > 12 ? 50 : 66; txt(g, cs.face, 0, 4, { px: px, col: INK, a: na, align: 'center', ls: 2 }); }
      g.restore();
    }
    g.restore();
    if (d.star && knocked(d, t)) {
      var fu = seg(t, T.KN[d.id], T.KN[d.id] + .45), fy = sy + 1150 * fu * fu, fr = (d.x % 3 - 1 || 1) * 2.4 * fu;
      if (fu < 1) { if (d.booth) { put(g, P.starA, -14 - 60 * fu, fy + 6, -.12 - fr); put(g, P.starB, 12 + 60 * fu, fy + 16, .1 + fr); } else put(g, P.star, 20 * fu, fy, fr); }
    }
    /* what hangs on the doors */
    if (d.cap) {
      g.fillStyle = '#c9a24a'; g.beginPath(); g.arc(0, 24, 10, 0, TAU); g.fill();
      g.save(); g.translate(0, 24); g.rotate(capSwing(t)); put(g, P.cap, 0, 104, 0, 1.12); g.restore();
      var ba = badgeAt(t);
      if (ba) { g.save(); g.translate(ba.x, ba.y); g.rotate(ba.r); g.scale(ba.s, ba.s); put(g, P.badge, 0, 0); g.restore(); }
    }
    if (d.jacket) {
      g.fillStyle = '#c9a24a'; g.beginPath(); g.arc(0, 0, 10, 0, TAU); g.fill();
      g.save(); g.rotate(jackSwing(t));
      g.strokeStyle = '#8a8fa6'; g.lineWidth = 7; g.lineJoin = 'round'; g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(14, 10, 0, 30); g.lineTo(-170, 84); g.lineTo(170, 84); g.lineTo(0, 30); g.stroke();
      put(g, P.jacket, 0, 76, 0, .92); g.restore();
    }
    if (d.id === 'empty' && t >= T.q && t < T.qOut + .3) {
      var qa = nameAlpha(c, d), nq = NOREC, qo = seg(t, T.qOut, T.qOut + .25); NOREC = nq || qa < .97 || qo > 0;
      if (qa > 0 && qo < 1) { g.save(); g.globalAlpha *= qa; slam(g, '?', 0, sy + 10 + 8 * Math.sin(t * 3.1), 260 * (1 - qo) * kn(t, T.qK, .12), t - T.q, { col: ORG, rot: .21 * Math.sin((t - T.q) * 2.6), from: 1.6 }); g.restore(); }
      NOREC = nq;
    }
    g.restore();
  }
  function badgeAt(t) {
    if (t < T.badge - .3 || t > T.badgeOff + .7) return null;
    if (t < T.badge) { var u = seg(t, T.badge - .3, T.badge); return { x: lerp(330, 150, eo(u)), y: lerp(-120, 290, u * u), r: lerp(.9, -.12, u), s: 1.5 - .5 * u }; }
    if (t < T.badgeOff) return { x: 150, y: 290, r: -.12, s: kn(t, T.badge, .08) };
    var v = seg(t, T.badgeOff, T.badgeOff + .7); return { x: 150 + 40 * v, y: 290 + 900 * v * v, r: -.12 + 1.6 * v, s: 1 };
  }

  /* ---------- the prop layer (screen space, clipped to the rail) ---------- */
  function pieceIn(g, pc, x, y, rot, s, tin, tout, t, o) {
    o = o || {}; if (t < tin - .02 || t > tout + (o.od || .4)) return;
    var k = o.slam ? eo(seg(t, tin, tin + .14)) : cd(t, tin, o.w || 13), ko = eio(seg(t, tout, tout + (o.od || .4)));
    var dx = (o.dir || -1) * 1100 * ko, dy = (o.dy == null ? -140 : o.dy) * ko;
    var fx = o.fromX == null ? 0 : o.fromX, fy = o.fromY == null ? -60 : o.fromY;
    var sc = s * (o.slam ? lerp(1.5, 1, k) * kn(t, tin + .12, .05) : 1);
    var nr = NOREC; NOREC = nr || k < .995 || ko > 0;
    g.save(); g.globalAlpha *= fin(t, tin, .06); g.translate(x + dx + (1 - k) * fx, y + dy + (1 - k) * fy); g.rotate(rot + (o.dir || -1) * .5 * ko + (o.slam ? .08 * (1 - k) : 0)); g.scale(sc, sc);
    putW(g, pc, 0, 0);
    g.restore(); NOREC = nr;
  }
  function stripAt(g, pc, x, y, rot, tin, tout, t, o) {
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
    /* who: the role card and the source */
    pieceIn(g, P.role, 330, 1262, -.04, 1, T.role, T.roleO, t, { fromX: -300, fromY: 0 });
    credit(g, 'GAME DEVELOPER, 2004', 700, 1388, T.role + .3, T.roleO, t, { rot: .02 });
    /* why: the question is scoped to its source */
    pieceIn(g, P.scope, 510, 1300, -.02, 1, T.scope, T.scopeO, t, { fromY: 60 });
    /* liotta, burt, the fight: the game card */
    pieceIn(g, P.vc, 770, 545, .05, .74, T.vc, T.vcO, t, { slam: true });
    credit(g, 'TOMMY VERCETTI', 510, 1392, T.tv, T.tvO, t, { px: 44, bg: CREAM, fg: INK, rot: -.01 });
    /* argue: two speech bubbles bump out of the booth */
    [[P.bub1, 650, 790, .1, T.bub0, 1], [P.bub2, 835, 905, -.08, T.bub1, -1]].forEach(function (B, i) {
      var tin = B[4]; if (t < tin - .02 || t > T.bubO + .3) return;
      var k = eo(seg(t, tin, tin + .16)), ko = seg(t, T.bubO, T.bubO + .25), bump = .07 * Math.sin((t - tin) * 11 + i * 2) * (1 - seg(t, tin + .6, tin + 1.6)) + .025 * Math.sin(t * 6 + i);
      var nr = NOREC; NOREC = nr || k < 1 || ko > 0;
      g.save(); g.translate(B[1] - 80 * ko * (B[5]), B[2] - 200 * ko); g.rotate(B[3] + bump); var s = lerp(.3, .82, k) * (1 - ko) * (1 + .05 * Math.sin((t - tin) * 9)); g.scale(s, s); putW(g, B[0], 0, 0); g.restore(); NOREC = nr;
    });
    /* limey: the quote card, exact, with its teller on the same card */
    pieceIn(g, P.quote, 510, 1215, -.02, 1, T.quote, T.quoteO, t, { fromY: -380, w: 16, dir: -1 });
    /* london: the writer's script with a flag tab; his name on a chip */
    if (t >= T.script - .02 && t < T.realO + .5) {
      var sk = cd(t, T.script, 14), so = eio(seg(t, T.realO, T.realO + .45)), nr2 = NOREC; NOREC = nr2 || sk < .97 || so > 0;
      g.save(); g.translate(500 - 1100 * so + 10 * Math.sin(t * 1.7) * (1 - so), 965 - 520 * (1 - sk) - 100 * so); g.rotate(.14 + .15 * (1 - sk) - .5 * so);
      var fl = cd(t, T.flag, 16), fo = seg(t, T.y18 - .05, T.y18 + .35); if (fl > 0 && fo < 1) put(g, P.flag, 170 + 600 * fo * fo, -500 - 60 * (1 - fl) - 300 * fo, .06 + fo);
      g.scale(1.6, 1.6); putW(g, P.script, 0, 0); g.scale(.72, .72);
      /* the stamp lands on the script in the pause after "actors" */
      if (t >= T.stamp - .25) {
        var su = seg(t, T.stamp - .25, T.stamp), land = t >= T.stamp, ss = land ? kn(t, T.stamp, .06) * kn(t, T.stampK, .1) : lerp(1.9, 1, su * su);
        g.save(); g.translate(0, 90 - (1 - su) * 160); g.rotate(-.14 + (1 - su) * .4); g.scale(ss * .92, ss * .92); g.globalAlpha *= clamp(su * 3, 0, 1); var nr3 = NOREC; NOREC = nr3 || !land || so > 0; putW(g, P.stamp, 0, 0); NOREC = nr3; g.restore();
      }
      g.restore(); NOREC = nr2;
    }
    pieceIn(g, P.limey, 300, 600, -.06, 1, T.limeyT, T.y18 - .05, t, { slam: true, dir: -1, od: .35 });
    credit(g, 'DAN HOUSER · WRITER', 510, 1392, T.dan, T.danO, t, { px: 42, bg: CREAM, fg: INK });
    /* rule: the year card and the source */
    pieceIn(g, P.y18, 260, 610, -.05, .8, T.y18, T.realO, t, { slam: true, dir: 1 });
    credit(g, 'DAN HOUSER TO VULTURE · OCT 2018', 510, 1392, T.vult, T.realO + .1, t, { px: 40, bg: CREAM, fg: INK });
    /* egos: a balloon inflates on a paper tag and pops in the pause */
    if (t >= T.ego0 && t < T.realO + .6) {
      var bo = eio(seg(t, T.realO, T.realO + .5)), bx = 770 + 600 * bo * bo, by = 940 + 16 * Math.sin(t * 2.3);
      var nr4 = NOREC; NOREC = nr4 || bo > 0 || t < T.ego0 + .15;
      g.save(); g.translate(bx, by + (t > T.pop ? 120 * seg(t, T.pop, T.pop + .4) * seg(t, T.pop, T.pop + .4) : 0)); g.rotate(.08 * Math.sin(t * 3) + (t > T.pop ? .3 * seg(t, T.pop, T.pop + .4) : 0));
      if (t < T.pop) {
        var inf = eo(seg(t, T.ego0, T.pop - .05)) * (1 + .03 * Math.sin(t * 14) * seg(t, T.pop - .6, T.pop));
        g.strokeStyle = 'rgba(244,234,214,.8)'; g.lineWidth = 3; g.beginPath(); g.moveTo(0, -50); g.quadraticCurveTo(14, -100, 0, -150 * inf - 40); g.stroke();
        put(g, P.balloon, 0, -150 * inf - 170 * inf, Math.sin(t * 2) * .05, .25 + .9 * inf);
      } else {
        var pu = seg(t, T.pop, T.pop + .5);
        P.shred.forEach(function (sp, i) { var a = i * TAU / 5 + .4, d = 60 + 180 * eo(pu); g.save(); g.globalAlpha *= 1 - pu; put(g, sp, Math.cos(a) * d, -330 + Math.sin(a) * d + 160 * pu * pu, a + pu * 5); g.restore(); });
      }
      putW(g, P.tagEgo, 0, 0, .04);
      g.restore(); NOREC = nr4;
    }
    /* real: Houser's words, exact, while the names go blank */
    stripAt(g, P.sq, 510, 1240, -.015, T.sq, T.sqO, t, { dur: .3 });
    credit(g, 'DAN HOUSER · VULTURE · 2018', 510, 1372, T.sq + .25, T.sqO, t, { px: 40 });
    /* gta6: the calendar page drops in on a bare wall; the GTA 6 pill is pinned to the page, never to a door */
    if (t >= T.cal - .02 && t < T.calO + .6) {
      var ci = cd(t, T.cal, 13), co = eio(seg(t, T.calO, T.calO + .5));
      var cx = 510 - 1000 * co, cy = 930 - 900 * (1 - ci) - 200 * co, cr = -.04 - .5 * co + .02 * Math.sin(t * 2.2);
      var nr5 = NOREC; NOREC = nr5 || ci < .97 || co > 0;
      g.save(); g.translate(cx, cy); g.rotate(cr); putW(g, P.cal26, 0, 0, 0, 1.25);
      if (t >= T.pill) { var pk = eo(seg(t, T.pill, T.pill + .14)), psc = lerp(1.5, 1, pk) * kn(t, T.pill + .12, .05); NOREC = nr5 || ci < .97 || co > 0 || pk < 1; g.save(); g.translate(40, -268); g.rotate(.06 + .08 * (1 - pk)); g.scale(psc, psc); g.globalAlpha *= fin(t, T.pill, .05); putW(g, P.pill6, 0, 0); g.restore(); }
      g.restore(); NOREC = nr5;
    }
    /* end: two identical answers, neither highlighted */
    pieceIn(g, P.yes, 445, 1352, 0, 1, T.yes, T.ynO, t, { slam: true, dir: -1, od: .3 });
    pieceIn(g, P.no, 635, 1352, 0, 1, T.no, T.ynO, t, { slam: true, dir: 1, od: .3 });
  }

  /* ---------- captions: paper tape in the upper third, phrase by phrase; the hook card is frame 0 and the last frame ---------- */
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
    if (!card0) return;
    var nx = ci >= 0 ? CAPS[ci + 1] : null, ns = nx ? nx.s : T.loopCap, end = ci === 0 ? ns : Math.min(card0.t1 + .55, ns);
    if (ci >= 0 && t >= end) return;
    if (card0.id === 'limey' && ci >= 0) return;
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
    if (!VIG) { VIG = mk(W, H); var q = VIG.getContext('2d'), gr = q.createRadialGradient(510, 900, 520, 510, 920, 1300); gr.addColorStop(0, 'rgba(6,3,18,0)'); gr.addColorStop(1, 'rgba(6,3,18,.6)'); q.fillStyle = gr; q.fillRect(0, 0, W, H); }
    g.drawImage(VIG, 0, 0);
  }
  function sweep(g, t, tm, pc, sp) {
    sp = sp || .27; var k = seg(t, tm - sp, tm + sp); if (k <= 0 || k >= 1) return;
    var y = lerp(1980, -2150, eio(k));
    g.save(); g.translate(-10, y); g.rotate(-.03); g.scale(1, 1.32); put(g, pc || P.sweep, 0, 0); g.restore();
  }
  function railClip(g) { g.beginPath(); if (LIVE2.clip) g.rect(BX0, 0, BX1 - BX0, BY1); else g.rect(-500, -500, 2080, BY1 + 500); g.clip(); }
  function frame(g, t) {
    g.setTransform(1, 0, 0, 1, 0, 0);
    stage(g);
    if (LIVE2.bg) { world(g, t); vignette(g); }
    g.save(); railClip(g); props(g, t); g.restore();
    g.save(); sweep(g, t, T.swp); g.restore();
    if (!POSTERMODE && LIVE.text) captions(g, t);
    g.save(); sweep(g, t, T.seamC, P.sweepK, .17); g.restore();
    if (LIVE.grain && NOISE && LIVE2.bg) { g.globalAlpha = .05; g.globalCompositeOperation = 'overlay'; var o = Math.floor(t * 24) * 37 % 256; g.fillStyle = g.createPattern(NOISE, 'repeat'); g.translate(-o, -o); g.fillRect(o, o, W, H); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }
  }
  function TEXTS(t) {
    var o = [];
    function Tx(id, text, a, b) { if (t >= a && t < b) o.push({ id: id, text: text, x0: 0, y0: 0, x1: 0, y1: 0 }); }
    var c = camAt(t);
    DOORS.forEach(function (d) { if (!d.name) return; var cs = cardState(d, t); if (cs.face && cs.k > .6 && nameAlpha(c, d, t) > .6) Tx('n_' + d.id, cs.face, -1, 1e9); });
    Tx('q', '?', T.q + .14, T.qOut);
    Tx('role', 'OFFICER TENPENNY', T.role + .2, T.roleO); Tx('sa', 'SAN ANDREAS · 2004', T.role + .2, T.roleO);
    Tx('gs', 'GAME DEVELOPER, 2004', T.role + .45, T.roleO);
    Tx('vc', 'GTA: VICE CITY 2002', T.vc + .14, T.vcO);
    Tx('tv', 'TOMMY VERCETTI', T.tv + .2, T.tvO);
    Tx('b1', '#@!', T.bub0 + .16, T.bubO); Tx('b2', '%&!', T.bub1 + .16, T.bubO);
    Tx('quote', '“GET THE LIMEY OUT OF HERE.”', T.quote + .15, T.quoteO); Tx('qcr', 'REYNOLDS, AS TOLD BY DAN HOUSER ·', T.quote + .15, T.quoteO); Tx('qcr2', 'VULTURE 2018', T.quote + .15, T.quoteO);
    Tx('script', 'SCRIPT', T.script + .3, T.realO);
    Tx('limey', 'LIMEY = BRIT', T.limeyT + .14, T.y18 - .05);
    Tx('scope', 'ROCKSTAR’S WRITER, 2018:', T.scope + .2, T.scopeO);
    Tx('dan', 'DAN HOUSER · WRITER', T.dan + .2, T.danO);
    Tx('y18', '2018', T.y18 + .14, T.realO);
    Tx('vult', 'DAN HOUSER TO VULTURE · OCT 2018', T.vult + .2, T.realO + .1);
    Tx('stamp', 'NO MORE NAME ACTORS', T.stamp, T.realO);
    Tx('ego', 'EGOS', T.ego0 + .15, T.realO);
    Tx('sq', P.sq.lines.join(' '), T.sq + .1, T.sqO);
    Tx('vul2', 'DAN HOUSER · VULTURE · 2018', T.sq + .35, T.sqO);
    Tx('cal', 'NOV 19 2026', T.cal + .05, T.calO);
    Tx('pill', 'GTA 6', T.pill + .14, T.calO);
    Tx('yes', 'YES', T.yes + .14, T.ynO); Tx('no', 'NO', T.no + .14, T.ynO);
    return o;
  }

  /* ---------- times and sound events, all from the voice ---------- */
  function crossTime(X, a, b) { var prev = camRaw(a).x - X; for (var t = a; t <= b; t += 1 / 120) { var d = camRaw(t).x - X; if ((d <= 0) !== (prev <= 0)) return t; prev = d; } return null; }
  function initTimes() {
    /* hook: the camera glides onto the frame-0 door; a spotlight crosses the blank card; the card flips at 1.05 s; the badge stamps on in the pause */
    T.h1 = 1.1; T.seamC = DUR - .45;
    T.flip0 = 1.0;
    T.badge = G('badge', after('hook'), 'stamp', .4, 1.9);
    /* who: the role card slides in with the line */
    T.role = start('who') - .12; T.roleO = start('why') - .1;
    /* why: walk left to the plain door; the ? slams on its star outline and swings; the question is scoped to 2018 */
    T.w0 = start('why') - .05; T.w1 = at('why', 'rockstar') + .15; G('whyS', T.w0 - .1, 'swish', .4, 1.3);
    T.q = T.w1 - .2; T.qK = G('q', after('why'), 'pop', .4, 1.5); T.qOut = start('liotta') + .1;
    T.scope = start('why') - .05; T.scopeO = start('liotta') + .35;
    /* liotta: walk right to the pink door; the card turns; the jacket swings; the hanger clacks in the pause */
    T.l0 = start('liotta') - .35; T.l1 = start('liotta') + .45; T.vc = at('liotta', 'vice') - .05;
    T.flipR = T.l1 - .15; T.vcO = start('london') - .1; T.tv = T.flipR;
    T.clack = G('clack', after('liotta'), 'clank', .4, 1);
    /* burt: the booth door, framed left with the booth to the right; the red lamp clicks on in the pause */
    T.b0 = at('burt', 'reynolds') - .1; T.b1 = T.b0 + .6; T.flipB = T.b1 - .1; T.tvO = T.b1 - .1;
    T.lampOn = G('lamp', after('burt'), 'click', .4, 1.4);
    /* argue: push in; the bubbles bump out of the booth */
    T.a0 = start('argue') - .1; T.a1 = start('argue') + 1.2;
    T.bub0 = at('argue', 'argued') - .05; T.bub1 = at('argue', 'with') - .05; G('bub', after('argue'), 'pop', .4, 1.3); T.bubO = at('limey', 'limey');
    /* limey: the quote card; the door slams in the written pause, the star cracks, the camera pushes 1.5 -> 1.8 */
    T.quote = start('limey') - .2;
    T.slam = G('slam', after('limey'), 'slam', .45, 1); T.crack = T.slam + .04; G('crack', T.slam + .06, 'crack', .2, 1);
    /* london: walk on; the script lands; LIMEY = BRIT and the flag tab */
    T.n0 = Math.max(start('london') - .05, T.slam + .32); T.n1 = T.n0 + .95;
    T.quoteO = at('london', 'dan') - .02; T.limeyT = start('london') + .1;
    T.script = at('london', 'dan') - .05; T.dan = T.script - .05; T.danO = start('rule') + .9;
    T.flag = T.script + .35;
    G('slapS', after('london'), 'slap', .4, 1.4);
    /* rule: 2018 slams on the year (flag and LIMEY peel); the stamp lands on "no" and is pressed again in the pause */
    T.y18 = at('rule', '2018,') - .05; T.vult = T.danO + .25;
    T.stamp = at('rule', 'no') - .05; T.stampK = G('stamp', after('rule'), 'stamp', .4, 2.2);
    /* egos: the balloon pops in the pause after "egos" */
    T.ego0 = T.stamp + .6; T.pop = G('popE', after('egos'), 'pop', .4, 2);
    /* real: Houser's props leave; the camera runs back past plain doors to the three star doors; in the pause the stars are knocked off and the names go blank */
    T.realO = start('real') - .12; G('realS', T.realO - .15, 'swish', .45, 1.6);
    T.r0 = start('real') - .1; T.r1 = lastw('real') - .3;
    T.sq = T.realO - .2; T.swp = start('gta6') - .12; T.sqO = T.swp - .12; G('swpS', T.swp - .22, 'swish', .3, 1.8);
    var k0 = G('knock0', after('real') + .02, 'thock', .4, 1.7), k1 = G('knock1', k0 + .12, 'thock', .2, 1.7), k2 = G('knock2', k0 + .24, 'thock', .2, 1.7);
    T.KN = { sam: k0, ray: k1, burt: k2 }; T.badgeOff = k0 - .02;
    /* gta6: a calendar page on a bare wall with the GTA 6 pill pinned to it; then the two plain doors JASON and LUCIA */
    T.cal = T.swp + .1; G('calT', T.cal + .1, 'thock', .3, 1.4);
    T.pill = T.cal + .3; T.calO = at('gta6', 'jason') - .1; T.jw1 = at('gta6', 'jason') + .3;
    T.flipJ = at('gta6', 'jason') + .2; T.flipL = at('gta6', 'lucia.') + .05;
    /* end: YES / NO on the wallpaper; a kraft sweep covers everything and the camera is back at frame 0 */
    T.yes = lastw('gta6') + .08; T.no = T.yes; G('tap0', lastw('gta6') + .2, 'slap', .35, .9);
    G('tapY', after('end'), 'slap', .3, .9);
    T.ynO = T.seamC; G('seam', T.seamC - .12, 'swish', .3, 1.8);
    T.loopCap = DUR - .15;
    var K = [[T.h1, 0, DY, 1.35], [T.w0, 0, DY, 1.42], [T.w1, -620, DY, 1.32], [T.l0, -620, DY, 1.35], [T.l1, 620, DY, 1.3], [T.b0, 620, DY, 1.34], [T.b1, 1280, DY, 1.3],
      [T.a0, 1280, DY, 1.3], [T.a1, 1280, 950, 1.5], [T.slam, 1282, 945, 1.52], [T.slam + .3, 1285, 930, 1.8], [T.n0, 1285, 930, 1.8], [T.n1, 3300, DY, 1.3], [T.r0, 3340, DY, 1.34], [T.r0 + .5, 2900, 1150, .72], [T.r1, 620, 1200, .68],
      [T.swp, 612, 1200, .68], [T.swp + .001, -6000, DY, .9], [T.calO, -6000, DY, .93], [T.jw1, -4690, 1170, .72], [T.seamC - .001, -4690, 1170, .74]];
    K.sort(function (a, b) { return a[0] - b[0]; }); T.CAM = K;
    /* the cards: each turns face up on its word, and blank when its star is knocked off */
    T.FLIP = { sam: [[T.flip0, 'SAMUEL L. JACKSON'], [k0, '']], ray: [[T.flipR, 'RAY LIOTTA'], [k1, '']], burt: [[T.flipB, 'BURT REYNOLDS'], [k2, '']], jason: [[T.flipJ, 'JASON']], lucia: [[T.flipL, 'LUCIA']] };
    STRESS = [['egos', 'egos.']].map(function (p) { return at(p[0], p[1]); });
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
  BODY.slam = .3; BODY.crack = .1; BODY.click = .08;
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
    var LEVEL = { stamp: 1, slam: 1, crack: 4, click: 4, swish: 22, tear: 18, thock: 5, pop: 11, clank: 6, slap: 3 };
    var TRIM = window.SFX_TRIM || {};
    var TYPE_DB = window.SFX_TYPE_DB || { stamp: -17, slam: -6, crack: -14, click: -10.5, swish: -14, tear: -20, pop: -29.5, clank: -16, thock: -19, slap: -17 };
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

  window.FILM = { bare: function () { ctx.setTransform(1, 0, 0, 1, 0, 0); stage(ctx); }, W: W, H: H, DUR: DUR, POSTER: 0, SLUG: 'gta-stars', SHOTS: [], init: init, render: render, frame: frame, LIVE: LIVE, LIVE2: LIVE2, T: T, GT: GT };
  var _bt = buildTextures; buildTextures = function () { _bt(); EV.length = 0; initTimes(); window.FILM.POSTER = Math.round((T.slam + .4) * 30) / 30 + 1 / 60;
    window.FILM.SHOTS = [{ id: 'hook', name: 'The crooked cop', t0: 0, t1: T.w0 }, { id: 'stars', name: 'Liotta and Reynolds', t0: T.w0, t1: T.a0 }, { id: 'fight', name: 'The fight', t0: T.a0, t1: T.n0 }, { id: 'rule', name: 'No more name actors', t0: T.n0, t1: start('gta6') }, { id: 'gta6', name: 'GTA 6', t0: start('gta6'), t1: DUR }]; };

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
