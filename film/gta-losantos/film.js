/* "Is GTA 5's city real?": Delta, pillar 5 (real-world crossover). Los Santos and Los Angeles, only as the sources link them.
   A vertical film written in code, narrated first and cut to the voice: every visual beat is keyed to a word time from
   vo/vo.js (window.VO) with at(id, word). Pure function of t. Contract: window.FILM, DUR, render(t), READY, EV, TEXTS(t),
   SCORE(ctx). Set: a green cutting mat and a light table; hero per beat: a cobalt drawing of the real place with the
   game's version on orange vellum sliding over it and snapping onto register pins (the native move). Rockstar North:
   "a re-imagined, present day Southern California"; Aaron Garbut (BuzzFeed 2013): "a world that incorporates all of Los
   Angeles", "over 250,000 images"; Edge: Hollywood sign -> Vinewood, Del Perro pier = homage to Santa Monica's pier,
   Santos = saints vs the angels of Los Angeles; Garbut (Edge 2014): reality is "a starting point".
   All drawings are ours: no screenshots, no Rockstar art, no logos, no music. Engine from gta-outsold. */
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
     THE SET: a designer's green cutting mat (it bleeds the frame, no shapes or words outside the rail) under a
     light table. Every beat lays a new sheet on the glow: a cobalt-ink drawing of the REAL place, then a sheet of
     orange vellum with the GAME's version slides over it and snaps onto the register pins (the native move).
     All drawings are ours: no screenshots, no Rockstar art, no logos.
     ===================================================================================================== */
  var COB = '#2347c8', ORA = '#ff6a1f', LEM = '#ffd23f', RED = '#e0283c', PADC = '#fffaf0', INK2 = '#1b2a4a', MAT = '#1d5b4c', TAPE = '#efd99a';
  var LX = 130, LY = 590, SW = 760, SH = 800;           /* the light table's glass: x 130-890, y 590-1390 (table space) */
  var ZB = 1.44, SHY0 = 344, SHY1 = 1450;                /* the camera: a sheet fills the frame, x 0-1080, y 330-1450 */
  var D = {};                                            /* drawings, cut once */

  function stroke(g, col, w) { g.strokeStyle = col; g.lineWidth = w || 6; g.lineJoin = 'round'; g.lineCap = 'round'; g.stroke(); }
  function tint(g, col, a) { g.save(); g.globalAlpha *= a; g.fillStyle = col; g.fill(); g.restore(); }
  /* 1. a downtown skyline over hills and a freeway (now only in the photo prints); the game's sheet moves a few towers and adds a spire */
  var TOWR = [[250, 60, 200], [320, 70, 290], [400, 55, 240], [465, 80, 330], [555, 60, 210], [625, 50, 170]];
  var TOWG = [[242, 62, 232], [318, 74, 266], [398, 58, 304], [470, 76, 352], [562, 64, 186], [630, 50, 214]];
  function skyline(g, col, game) {
    var tw = game ? TOWG : TOWR, gy = 610;
    g.beginPath(); g.moveTo(0, 420); [[90, 352], [200, 398], [300, 322], [420, 392], [540, 318], [650, 380], [760, 344]].forEach(function (p, i, A) { var q = i ? A[i - 1] : [0, 420]; g.quadraticCurveTo((q[0] + p[0]) / 2, Math.min(q[1], p[1]) - 40, p[0], p[1]); });
    g.lineTo(760, gy); g.lineTo(0, gy); g.closePath(); tint(g, col, .08); stroke(g, col, 5);
    tw.forEach(function (b, i) {
      var x = b[0], w = b[1], h = b[2]; g.beginPath(); g.rect(x, gy - h, w, h); g.save(); g.fillStyle = PADC; g.fill(); g.restore(); tint(g, col, .16); stroke(g, col, 6);
      g.save(); g.globalAlpha *= .55; for (var y = gy - h + 22; y < gy - 14; y += 26) { g.beginPath(); g.moveTo(x + 12, y); g.lineTo(x + w - 12, y); stroke(g, col, 3); } g.restore();
      if (game && i === 3) { g.beginPath(); g.moveTo(x + w / 2, gy - h); g.lineTo(x + w / 2, gy - h - 70); stroke(g, col, 6); }
    });
    g.beginPath(); g.moveTo(0, gy); g.lineTo(760, gy); stroke(g, col, 7);
    [660, 720].forEach(function (y) { g.beginPath(); g.moveTo(0, y); g.lineTo(760, y - 24); stroke(g, col, 5); });
    g.save(); g.setLineDash([26, 22]); g.beginPath(); g.moveTo(0, 690); g.lineTo(760, 666); stroke(g, col, 4); g.restore();
  }
  /* 2. the Southern California coast: ocean hatching to the left, the city marked with a star */
  function coast(g, col, game) {
    var off = game ? 16 : 0, pts = [[330, 0], [300, 120], [250, 230], [190, 360], [210, 450], [300, 520], [330, 600], [430, 680], [540, 760], [600, 800]];
    g.beginPath(); g.moveTo(pts[0][0] + off, 0); for (var i = 1; i < pts.length; i++) { var q = pts[i - 1], p = pts[i]; g.quadraticCurveTo(q[0] + off + (game ? (i % 2 ? 14 : -10) : 0), q[1], (q[0] + p[0]) / 2 + off, (q[1] + p[1]) / 2); }
    g.lineTo(760, 800); g.lineTo(760, 0); g.closePath(); tint(g, col, .1); stroke(g, col, 7);
    if (!game) { g.save(); g.globalAlpha *= .45; for (var y = 40; y < 780; y += 44) for (var x = 24 + (y / 44 % 2) * 30; x < 200 + y * .25 - 60 && x < 330; x += 74) { g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 14, y - 10, x + 28, y); g.quadraticCurveTo(x + 42, y + 10, x + 56, y); stroke(g, col, 3); } g.restore(); }
    [[500, 140], [600, 230], [660, 120], [560, 520], [680, 600]].forEach(function (p) { g.beginPath(); g.moveTo(p[0] - 34, p[1] + 16); g.lineTo(p[0], p[1] - 16); g.lineTo(p[0] + 34, p[1] + 16); stroke(g, col, 4); });
    if (!game) { g.beginPath(); for (var k = 0; k < 10; k++) { var a = -Math.PI / 2 + k * Math.PI / 5, r = k % 2 ? 14 : 32; g.lineTo(400 + r * Math.cos(a), 400 + r * Math.sin(a)); } g.closePath(); g.save(); g.fillStyle = col; g.fill(); g.restore(); }
  }
  /* 3. the hillside sign: a ridge and big block letters on legs (our own type) */
  function signD(g, col, word, yo, game) {
    yo = yo || 0;
    if (game) { g.beginPath(); g.moveTo(0, 520); g.quadraticCurveTo(220, 330, 420, 400); g.quadraticCurveTo(600, 460, 760, 380); g.lineTo(760, 800); g.lineTo(0, 800); g.closePath(); tint(g, col, .1); stroke(g, col, 6);
      g.beginPath(); g.moveTo(0, 660); g.quadraticCurveTo(380, 720, 760, 600); stroke(g, col, 4); }
    else { g.beginPath(); g.moveTo(0, 600); g.quadraticCurveTo(160, 430, 330, 360); g.quadraticCurveTo(520, 290, 760, 330); g.lineTo(760, 800); g.lineTo(0, 800); g.closePath(); tint(g, col, .1); stroke(g, col, 6);
      g.beginPath(); g.moveTo(0, 700); g.quadraticCurveTo(300, 600, 760, 640); stroke(g, col, 4); }
    var n = word.length, x0 = game ? 90 : 70, x1 = game ? 680 : 700;
    /* each letter gets at least .5 em of room and every gap is >= 20 px (the narrow I used to jam under the V) */
    var px = game ? 142 : 118, wsz, tot, gp;
    cond(g, 'condensed'); ls(g, 0); g.textAlign = 'center'; g.textBaseline = 'alphabetic';
    for (;;) { font(g, px, 900); wsz = []; tot = 0; for (var q = 0; q < n; q++) { wsz.push(Math.max(g.measureText(word[q]).width, px * .5)); tot += wsz[q]; } gp = (x1 - x0 - tot) / (n - 1); if (gp >= 20 || px < 70) break; px -= 4; }
    var xc = x0;
    for (var i = 0; i < n; i++) {
      var cx = xc + wsz[i] / 2; xc += wsz[i] + gp; var base = game ? 330 - (cx - 90) * .1 + 10 * Math.sin(i * 2.1) : 470 - (cx - 70) * .16 + 8 * Math.sin(i * 1.7);
      g.save(); g.translate(cx, base + yo); g.rotate(.02 * Math.sin(i * 2.3));
      g.beginPath(); g.moveTo(-14, 0); g.lineTo(-14, 40); g.moveTo(14, 0); g.lineTo(14, 44); stroke(g, col, 4);
      g.fillStyle = col; g.fillText(word[i], 0, 0); g.restore();
    }
    unst(g);
  }
  /* 5. the city in one sheet: the sign hill on top, the pier below */
  function cityD(g, col, game) {
    g.save(); g.beginPath(); g.rect(0, 0, SW, 420); g.clip(); g.translate(20, -120); g.scale(.95, .95); signD(g, col, game ? 'VINEWOOD' : 'HOLLYWOOD', 0, game); g.restore();
    g.save(); g.beginPath(); g.rect(0, 420, SW, 380); g.clip(); g.translate(70, 330); g.scale(.82, .82); pierD(g, col, game); g.restore();
  }
  /* 4. a pleasure pier: deck on pilings, a big wheel, a little coaster, sea lines */
  function pierD(g, col, game) {
    var wx = game ? 290 : 520, wy = game ? 300 : 330, wr = game ? 150 : 170, cs = game ? 410 : 0;
    g.save(); g.globalAlpha *= .5; for (var y = 600; y < 800; y += 36) { g.beginPath(); for (var x = 0; x <= 760; x += 40) g.lineTo(x, y + 6 * Math.sin(x * .05 + y)); stroke(g, col, 3); } g.restore();
    g.beginPath(); g.arc(wx, wy, wr, 0, TAU); tint(g, col, .08); stroke(g, col, 6);
    g.beginPath(); g.arc(wx, wy, wr * .2, 0, TAU); stroke(g, col, 5);
    for (var k = 0; k < 14; k++) { var a = k * TAU / 14; g.beginPath(); g.moveTo(wx, wy); g.lineTo(wx + wr * Math.cos(a), wy + wr * Math.sin(a)); stroke(g, col, 3); g.beginPath(); g.rect(wx + (wr + 12) * Math.cos(a) - 10, wy + (wr + 12) * Math.sin(a) - 8, 20, 18); stroke(g, col, 3); }
    g.beginPath(); g.moveTo(wx - 70, 540); g.lineTo(wx, wy); g.lineTo(wx + 70, 540); stroke(g, col, 6);
    g.save(); g.translate(cs, 0);
    g.beginPath(); g.moveTo(60, 530); g.quadraticCurveTo(130, 300, 200, 420); g.quadraticCurveTo(260, 500, 300, 380); g.quadraticCurveTo(330, 300, 360, 530); stroke(g, col, 6);
    for (var x2 = 80; x2 < 360; x2 += 46) { g.beginPath(); g.moveTo(x2, 530); g.lineTo(x2, 430 + 40 * Math.sin(x2 * .03)); stroke(g, col, 3); }
    g.restore();
    g.beginPath(); g.rect(0, 530, 760, 26); g.save(); g.fillStyle = PADC; g.fill(); g.restore(); tint(g, col, .25); stroke(g, col, 6);
    for (var p = 20; p < 760; p += 48) { g.beginPath(); g.moveTo(p, 556); g.lineTo(p, 640); stroke(g, col, 5); }
    g.beginPath(); g.moveTo(game ? 30 : 20, 530); g.lineTo(game ? 30 : 20, 430); g.arc(game ? 80 : 70, 430, 50, Math.PI, 0); g.lineTo(game ? 130 : 120, 530); stroke(g, col, 6);
  }
  /* a sheet of paper (draw = fn(g)) or a sheet of vellum (translucent, the drawing in orange), both SW x SH */
  function sheet(draw, vellum, words, va) {
    var rec = [];
    var pc = piece([0, 0, SW, SH], function (g) { g.beginPath(); g.rect(0, 0, SW, SH); }, vellum ? 'rgba(255,244,232,' + (va || .55) + ')' : PADC, { ps: 1.2, grain: vellum ? .35 : .8, sx: 4, sy: 8, blur: 14, sc: vellum ? 'rgba(80,30,0,.16)' : 'rgba(6,20,16,.35)', edge: vellum ? 2 : 2.4, edgeCol: vellum ? 'rgba(255,106,31,.6)' : 'rgba(255,255,255,.9)', extra: function (g) {
      if (!vellum) { g.save(); g.strokeStyle = 'rgba(35,71,200,.08)'; g.lineWidth = 1.5; for (var x = 40; x < SW; x += 40) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, SH); g.stroke(); } for (var y = 40; y < SH; y += 40) { g.beginPath(); g.moveTo(0, y); g.lineTo(SW, y); g.stroke(); } g.restore(); }
      /* register holes along the top edge */
      [120, SW - 120].forEach(function (x) { g.beginPath(); g.arc(x, 22, 9, 0, TAU); g.fillStyle = 'rgba(14,42,36,.55)'; g.fill(); });
      if (draw) draw(g, rec);
    } });
    if (words) wordsOf(pc, rec);
    return pc;
  }
  function wordLine(g, rec, text, x, y, px, col) { cond(g, 'condensed'); font(g, px, 900); ls(g, 1); g.fillStyle = col; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, x, y); var mm = g.measureText(text); rec.push([x - mm.width / 2, y - px * .55, x + mm.width / 2, y + px * .45, text]); unst(g); }
  /* a photo print: white border, a small cobalt sketch inside */
  function printPiece(draw, i) {
    var w = 250, h = 214;
    return piece([-w / 2, -h / 2, w / 2, h / 2], function (g) { g.beginPath(); g.rect(-w / 2, -h / 2, w, h); }, '#ffffff', { ps: 1.3, sx: 4, sy: 7, blur: 9, extra: function (g) {
      g.fillStyle = '#e9eef9'; g.fillRect(-w / 2 + 14, -h / 2 + 14, w - 28, h - 50);
      g.save(); g.beginPath(); g.rect(-w / 2 + 14, -h / 2 + 14, w - 28, h - 50); g.clip(); g.translate(-w / 2 + 14, -h / 2 + 14); g.scale((w - 28) / SW, (h - 50) / SH * 1.0); g.translate(0, i % 2 ? -60 : 0); draw(g, COB); g.restore();
      g.fillStyle = 'rgba(27,42,74,.25)'; g.fillRect(-w / 2 + 18, h / 2 - 26, 60 + (i * 23) % 70, 6);
    } });
  }
  function tagPiece(top, main, col, w) { return cardPiece(w || 380, 132, col === ORA ? '#fff1e6' : '#eef2ff', [[top, 38, col, -30], [main, 46, INK, 24]], { r: 8, ring: col }); }
  function credPiece(lines, w) { var h = 30 + lines.length * 50; return cardPiece(w, h, INK2, lines.map(function (L, i) { return [L, 38, CREAM, -h / 2 + 40 + i * 50]; }), { r: 6, ring: 'rgba(251,246,234,.5)' }); }

  function buildTextures() { GRAIN = buildGrain(); buildSet(); }
  function buildSet() {
    D.coastR = sheet(function (g) { coast(g, COB, false); });
    D.coastG = sheet(function (g) { coast(g, ORA, true); }, true);
    D.signR = sheet(function (g) { signD(g, COB, 'HOLLYWOOD'); });
    D.signG = sheet(function (g) { signD(g, ORA, 'VINEWOOD', -165); }, true, false, .4);
    /* the overlay: the game's sign at the same scale on its own hill, straight over the real one (hook, loop, "not a copy") */
    D.signO = sheet(function (g) { signD(g, ORA, 'VINEWOOD', 0, true); }, true, false, .5);
    D.pierR = sheet(function (g) { pierD(g, COB, false); });
    D.pierG = sheet(function (g) { pierD(g, ORA, true); }, true);
    D.blank = sheet(null);
    D.photo = sheet(null);
    /* the name sheet: both slots ruled in pencil before anything lands; LOS ANGELES waits as a ghost outline */
    D.names = sheet(null);
    /* the end card: two stacked panels, the game's sign on top, the game's pier below */
    D.end = sheet(function (g) {
      g.save(); g.beginPath(); g.rect(24, 50, SW - 48, 330); g.clip(); g.translate(30, -40); g.scale(.92, .92); signD(g, ORA, 'VINEWOOD', 0, true); g.restore();
      g.save(); g.beginPath(); g.rect(24, 420, SW - 48, 360); g.clip(); g.translate(60, 300); g.scale(.86, .86); pierD(g, ORA, true); g.restore();
      g.beginPath(); g.moveTo(40, 400); g.lineTo(SW - 40, 400); stroke(g, 'rgba(35,71,200,.35)', 4);
    });
    /* not a copy: one sheet holds the real city (sign hill over the pier); the vellum holds the game's */
    D.cityR = sheet(function (g) { cityD(g, COB, false); });
    D.cityG = sheet(function (g) { cityD(g, ORA, true); }, true, false, .5);
    var draws = [function (g, c) { skyline(g, c, false); }, function (g, c) { pierD(g, c, false); }, function (g, c) { signD(g, c, 'HOLLYWOOD'); }, function (g, c) { coast(g, c, false); }];
    D.prints = []; for (var i = 0; i < 8; i++) D.prints.push(printPiece(draws[i % 4], i));
    D.santos = cardPiece(560, 150, '#fff1e6', [['LOS SANTOS', 96, ORA, 4]], { r: 10, ring: ORA });
    D.saints = cardPiece(360, 96, ORA, [['= THE SAINTS', 60, CREAM, 3]], { r: 8, ring: 'rgba(255,250,240,.9)' });
    D.angels = cardPiece(360, 96, COB, [['= THE ANGELS', 60, CREAM, 3]], { r: 8, ring: 'rgba(255,250,240,.9)' });
    D.angeles = cardPiece(560, 150, '#eef2ff', [['LOS ANGELES', 96, COB, 4]], { r: 10, ring: COB });
    D.spanish = credPiece(['SPANISH · VIA EDGE MAGAZINE'], 560);
    D.tSC = tagPiece('REAL', 'SOUTHERN CALIFORNIA', COB, 460);
    D.tLA = tagPiece('REAL', 'LOS ANGELES', COB, 320);
    D.q1 = buildStrip('“A RE-IMAGINED … SOUTHERN CALIFORNIA”', 700, 54, 31);
    D.c1 = credPiece(['ROCKSTAR NORTH, ON GTA V'], 470);
    D.q2 = buildStrip('“A WORLD THAT INCORPORATES ALL OF LOS ANGELES”', 700, 54, 37);
    D.c2 = credPiece(['AARON GARBUT, GTA V ART DIRECTOR', 'BUZZFEED NEWS · 2013'], 600);
    D.cnt = cardPiece(460, 240, PADC, [], { r: 10, ring: COB });
    D.tHW = tagPiece('REAL', 'HOLLYWOOD SIGN', COB, 400);
    D.tVW = tagPiece('GAME', 'VINEWOOD', ORA, 320);
    D.tSM = tagPiece('REAL', 'SANTA MONICA PIER', COB, 440);
    D.tDP = tagPiece('GAME', 'DEL PERRO', ORA, 320);
    D.edge = credPiece(['EDGE MAGAZINE'], 320);
    D.edgeP = credPiece(['EDGE: “AN HOMAGE”'], 380);
    D.nac = buildStamp(['NOT A COPY'], 92, 560, RED);
    D.rb = buildStrip('“I’D NEVER WANT TO REBUILD A CITY”', 700, 54, 47);
    D.our = credPiece(['OUR DRAWINGS'], 300);
    D.g5 = cardPiece(330, 92, ORA, [['GTA 5’S CITY:', 56, CREAM, 3]], { r: 8, ring: 'rgba(255,250,240,.9)' });
    D.q3 = buildStrip('“WE USE [REALITY] AS A STARTING POINT”', 700, 58, 43);
    D.c3 = credPiece(['AARON GARBUT, ROCKSTAR NORTH', 'EDGE MAGAZINE · 2014'], 560);
    D.sign = cardPiece(240, 120, PADC, [['SIGN', 72, INK, 4]], { r: 12, ring: COB });
    D.pier = cardPiece(240, 120, PADC, [['PIER', 72, INK, 4]], { r: 12, ring: COB });
    var tp3 = jag(311, 1100, 10), bt3 = jag(312, 1100, 10);
    D.sweep = piece([0, -20, 1100, 1580], function (g) { g.beginPath(); g.moveTo(0, tp3[0][1]); tp3.forEach(function (p) { g.lineTo(p[0], p[1]); }); for (var i = bt3.length - 1; i >= 0; i--) g.lineTo(bt3[i][0], 1560 + bt3[i][1]); g.closePath(); }, 'rgba(255,200,160,.92)', { sx: 0, sy: 10, blur: 20, ps: .6, edgeCol: 'rgba(255,106,31,.8)' });
    D.mat = buildMat();
  }
  /* the cutting mat: green, a fine grid, heavier every fifth line, a 45-degree guide; plus the light table's bezel */
  function buildMat() {
    var c = mk(W, H), g = c.getContext('2d');
    g.fillStyle = MAT; g.fillRect(0, 0, W, H);
    var gr = g.createRadialGradient(510, 980, 200, 510, 980, 1200); gr.addColorStop(0, 'rgba(40,120,98,.5)'); gr.addColorStop(1, 'rgba(6,24,20,.6)'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    for (var x = 10, i = 0; x < W; x += 36, i++) { g.fillStyle = i % 5 ? 'rgba(220,255,240,.10)' : 'rgba(220,255,240,.22)'; g.fillRect(x, 0, i % 5 ? 1.5 : 2.5, H); }
    for (var y = 12, j = 0; y < H; y += 36, j++) { g.fillStyle = j % 5 ? 'rgba(220,255,240,.10)' : 'rgba(220,255,240,.22)'; g.fillRect(0, y, W, j % 5 ? 1.5 : 2.5); }
    g.strokeStyle = 'rgba(220,255,240,.12)'; g.lineWidth = 2; for (var d = -H; d < W; d += 360) { g.beginPath(); g.moveTo(d, 0); g.lineTo(d + H, H); g.stroke(); }
    g.globalAlpha = .5; g.fillStyle = g.createPattern(GRAIN, 'repeat'); g.fillRect(0, 0, W, H); g.globalAlpha = 1;
    return c;
  }
  function lightTable(g, t) {
    g.save(); g.shadowColor = 'rgba(0,10,8,.6)'; g.shadowBlur = 40; g.shadowOffsetY = 20; rr(g, 100, 560, 820, 860, 22); g.fillStyle = '#2b3036'; g.fill(); g.restore();
    rr(g, 100, 560, 820, 860, 22); g.strokeStyle = 'rgba(255,255,255,.18)'; g.lineWidth = 3; g.stroke();
    var k = .92 + .08 * osc(t, 5, .4);
    var gl = g.createRadialGradient(510, 990, 60, 510, 990, 560); gl.addColorStop(0, 'rgba(255,255,250,' + (1 * k).toFixed(3) + ')'); gl.addColorStop(1, 'rgba(232,240,236,' + (.95 * k).toFixed(3) + ')');
    g.fillStyle = gl; g.fillRect(LX, LY, SW, SH);
    /* the register pin bar */
    g.fillStyle = '#3a4048'; g.fillRect(LX + 60, LY - 18, SW - 120, 14);
    [LX + 120, LX + SW - 120].forEach(function (x) { g.beginPath(); g.arc(x, LY + 22, 8, 0, TAU); g.fillStyle = '#c9ced6'; g.fill(); });
  }

  /* =====================================================================================================
     TIME AND STATE
     ===================================================================================================== */
  var T = {}, LIVE2 = { bg: true, clip: true };
  function tq(t) { return (Math.floor(t * 30) + .5) / 30; }
  function fmt(n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }

  /* a sheet laid on the glass: slides in from the right with a little twist, lands, then is simply covered */
  function laySheet(g, pc, tin, t, o) {
    o = o || {}; if (t < tin) return;
    var k = eio(seg(t, tin, tin + (o.d || .42))), dx = (1 - k) * (o.from || 900), rot = (1 - k) * (o.rot == null ? .06 : o.rot);
    var nr = NOREC; NOREC = nr || k < 1;
    g.save(); g.translate(LX + SW / 2 + dx + (o.x || 0), LY + SH / 2 + (o.y || 0)); g.rotate(rot + (o.r || 0)); putW(g, pc, -SW / 2, -SH / 2, 0, 1); g.restore(); NOREC = nr;
  }
  /* the vellum: slides on from the right and snaps onto the pins (dx = 0); o.miss leaves it off-register */
  function vellum(g, pc, tin, treg, t, o) {
    o = o || {}; if (t < tin) return;
    var p = seg(t, tin, treg), dx = Math.pow(1 - p, o.ease || 3) * 820, nk = kn(t, treg, .012);
    if (o.miss) { dx = lerp(820, o.miss[0], 1 - Math.pow(1 - p, 3)); }
    var dr = o.miss ? o.miss[1] * (1 - Math.pow(1 - p, 3)) : 0, drift = o.drift ? o.drift(t) : 0;
    var nr = NOREC; NOREC = nr || p < 1;
    g.save(); g.translate(LX + SW / 2 + dx + drift, LY + SH / 2); g.rotate(dr); g.scale(nk, nk); putW(g, pc, -SW / 2, -SH / 2, 0, 1); g.restore(); NOREC = nr;
  }
  function glassClip(g) { g.beginPath(); g.rect(LX, LY - 30, SW, SH + 30); g.clip(); }
  /* taped paper: settles onto a face, leaves by flying off */
  function taped(g, pc, x, y, rot, tin, tout, t, o) {
    o = o || {}; var od = o.od || .35; if (t < tin - .02 || t > tout + od + .05) return;
    var k = cd(t, tin, o.w || 14), ko = eio(seg(t, tout, tout + od)), s = (o.s || 1) * (o.slam ? lerp(1.4, 1, eo(seg(t, tin, tin + .14))) * kn(t, tin + .12, .05) : 1);
    var nr = NOREC; NOREC = nr || k < .97 || ko > 0 || (o.slam && t < tin + .16);
    g.save(); g.globalAlpha *= fin(t, tin, .06); g.translate(x + (o.dir || 1) * 1100 * ko + (1 - k) * (o.fromX || 0), y - 200 * ko + (1 - k) * (o.fromY == null ? -120 : o.fromY)); g.rotate(rot + (o.dir || 1) * .5 * ko + .2 * (1 - k)); g.scale(s, s);
    putW(g, pc, 0, 0);
    if (o.draw) o.draw(g, k, ko);
    if (o.tape !== false) { g.save(); g.translate(0, -pc.h / 2 + 34); g.rotate(.05); g.fillStyle = 'rgba(239,217,154,.8)'; g.fillRect(-45, -13, 90, 26); g.restore(); }
    g.restore(); NOREC = nr;
  }
  function stripAt(g, pc, x, y, rot, tin, tout, t, o) {
    o = o || {}; if (t < tin - .02 || t > tout + .4) return;
    var k = cd(t, tin, 15), ko = eio(seg(t, tout, tout + (o.dur || .38)));
    var dx = (o.dir || -1) * 1200 * ko, dy = -120 * ko, rr0 = rot + (o.dir || -1) * .5 * ko;
    var nr = NOREC; NOREC = nr || k < .97 || ko > 0;
    g.save(); g.globalAlpha *= fin(t, tin, .06); g.translate(x + dx + (1 - k) * (o.from || 0), y + dy + (1 - k) * 40); g.rotate(rr0);
    putW(g, pc, -pc.sw / 2, -pc.sh / 2, 0, 1);
    g.save(); g.translate(-pc.sw / 2 + 60, -pc.sh / 2 + 2); g.rotate(-.2); g.fillStyle = 'rgba(239,217,154,.85)'; g.fillRect(-40, -12, 80, 24); g.restore();
    NOREC = nr; g.restore();
  }

  /* ---------- the prop layer (screen space, clipped to the rail) ---------- */
  /* the sheets: drawn full-bleed (the camera sits so close to the table that a sheet fills x 0-1080, y 330-1450) */
  function sheets(g, t) {
    var S = T.S;
    /* hook: the game's sign on vellum is already sliding over the real one on frame 0; it snaps onto the pins */
    if (t < S.B + .5) { laySheet(g, D.signR, -.45, t); vellum(g, D.signO, T.vA0, T.regA, t, { ease: 1.3 }); }
    if (t >= S.B && t < S.D + .5) {
      laySheet(g, D.coastR, S.B, t);
      vellum(g, D.coastG, T.vB0, T.regB, t);
      /* "all of L.A.": orange hatching spreads over the city on the vellum */
      if (t >= T.all) { var hk = eo(seg(t, T.all, T.all + .5)); g.save(); g.beginPath(); g.arc(LX + 400, LY + 400, 170 * hk, 0, TAU); g.clip(); g.strokeStyle = 'rgba(255,106,31,.75)'; g.lineWidth = 5; for (var d = -400; d < 400; d += 22) { g.beginPath(); g.moveTo(LX + 400 + d - 200, LY + 600); g.lineTo(LX + 400 + d + 200, LY + 200); g.stroke(); } g.restore(); g.beginPath(); g.arc(LX + 400, LY + 400, 170 * hk, 0, TAU); stroke(g, ORA, 6); }
    }
    if (t >= S.D && t < S.E + .5) {
      laySheet(g, D.photo, S.D, t);
      for (var i = 0; i < D.prints.length; i++) {
        var ti = T.pr[i]; if (t < ti) continue;
        var pk = cd(t, ti, 16), r0 = hash(i * 3.7) - .5, px = LX + 200 + (i % 3) * 180 + r0 * 40, py = LY + 300 + Math.floor(i / 3) * 150 + hash(i * 5.1) * 40;
        var nr = NOREC; NOREC = true;
        g.save(); g.translate(px + (1 - pk) * (i % 2 ? 700 : -700), py - (1 - pk) * 300); g.rotate(r0 * .5 + (1 - pk) * (i % 2 ? .8 : -.8)); put(g, D.prints[i], 0, 0); g.restore(); NOREC = nr;
      }
    }
    if (t >= S.E && t < S.F + .5) { laySheet(g, D.signR, S.E, t); vellum(g, D.signG, T.vE0, T.regE, t); }
    if (t >= S.F && t < S.G + .5) { laySheet(g, D.pierR, S.F, t); vellum(g, D.pierG, T.vF0, T.regF, t); }
    if (t >= S.G && t < S.H + .5) { laySheet(g, D.names, S.G, t); }
    /* not a copy: the game's sign laid straight over the real one at the same scale, then the pier; the differences show */
    /* not a copy: the whole game city on one vellum slides over the real one and misses the pins by 60 px */
    if (t >= S.H && t < S.K + .5) { laySheet(g, D.cityR, S.H, t); vellum(g, D.cityG, T.vH0, T.regH, t, { miss: [60, .03] }); }
    if (t >= S.K) laySheet(g, D.end, S.K, t);
    /* the loop: the real sign slides back in and the vellum runs its frame-0 approach, so the last frame is frame 0 */
    if (t >= T.seamS) { laySheet(g, D.signR, T.seamS, t); vellum(g, D.signO, T.vA0, T.regA, t - DUR, { ease: 1.3 }); }
  }
  /* ---------- labels, quotes, counters (above the sheets, inside the x 90-930 rail) ---------- */
  function props(g, t) {
    var S = T.S;
    /* socal: Rockstar's own words, and only Southern California on this sheet (Rockstar never names L.A.) */
    taped(g, D.tSC, 330, 1330, -.03, T.tSC, T.q1O, t, { fromY: 60, dir: -1 });
    stripAt(g, D.q1, 510, 640, -.02, T.q1, T.q1O, t);
    taped(g, D.c1, 620, 800, .02, T.q1 + .25, T.q1O, t, { tape: false, fromY: 40 });
    /* la: Los Angeles arrives only with the art director's words and his credit, after Rockstar's chip has gone */
    stripAt(g, D.q2, 510, 640, .015, T.q2, T.q2O, t, { dir: 1 });
    taped(g, D.c2, 530, 1330, -.02, T.q2 + .05, T.c2O, t, { tape: false, fromY: 40 });
    taped(g, D.tLA, 300, 1170, -.03, T.tLA, T.cn0 - .05, t, { fromY: 60, dir: -1 });
    /* photos: the count, its owner printed on the same card; rolls in round steps, lands in the pause */
    if (t >= T.cn0 - .02 && t < T.cnO + .3) {
      var ck = cd(t, T.cn0, 13), co = eio(seg(t, T.cnO, T.cnO + .3)), landed = t >= T.cnL, v = 250000 * eio(seg(t, T.roll, T.cnL));
      var nr2 = NOREC; NOREC = nr2 || ck < .97 || co > 0;
      g.save(); g.globalAlpha *= fin(t, T.cn0, .06) * (1 - co); g.translate(510 - 900 * co, 1060 - (1 - ck) * 300);
      putW(g, D.cnt, 0, 0);
      var s = landed ? kn(t, T.cnL, .1) : 1; g.save(); g.translate(0, -50); g.scale(s, s);
      txt(g, landed ? '250,000+' : fmt(Math.floor(v / 10000) * 10000), 0, 0, { px: 96, col: landed ? COB : '#7d8aa8', align: 'center' }); g.restore();
      if (landed) { txt(g, 'IMAGES SHOT', 0, 40, { px: 44, col: INK, align: 'center', a: fin(t, T.cnL, .1) }); txt(g, 'GARBUT · BUZZFEED 2013', 0, 88, { px: 38, col: INK2, align: 'center', a: fin(t, T.cnL, .1) }); }
      g.restore(); NOREC = nr2;
      if (landed && t < T.cnL + .5) { g.save(); g.beginPath(); g.rect(285, 945, 450, 72); g.clip(); KIT.impact(g, 510, 1010, t - T.cnL, 1.1, COB); g.restore(); }
    }
    /* sign and pier: REAL tag on the real drawing, GAME tag on the vellum's drawing once it is on */
    taped(g, D.tHW, 330, 1150, -.03, T.tHW, S.F + .05, t, { fromY: 60, dir: -1 });
    taped(g, D.tVW, 260, 590, .04, T.regE - .15, S.F + .05, t, { fromX: 80 });
    taped(g, D.edge, 720, 1160, .02, T.cnO + .1, S.F + .05, t, { tape: false, fromY: 40 });
    taped(g, D.tSM, 330, 1320, -.03, T.tSM, S.G + .05, t, { fromY: 60, dir: -1 });
    taped(g, D.tDP, 300, 570, .04, T.regF - .15, S.G + .05, t, { fromX: 80 });
    taped(g, D.edgeP, 720, 1210, .02, T.tSM + .1, S.G + .05, t, { tape: false, fromY: 40 });
    /* the name: Santos = the saints, Angeles = the angels; LOS ANGELES waits as a pencil ghost in its own spot */
    if (t >= S.G + .4 && t < T.ang + .2) { var ga = .5 * fin(t, S.G + .4, .2) * (1 - seg(t, T.ang, T.ang + .2)); g.save(); g.globalAlpha *= ga; cond(g, 'condensed'); font(g, 96, 900); ls(g, 1); g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineWidth = 3; g.strokeStyle = COB; g.strokeText('LOS ANGELES', 510, 1044); g.restore(); unst(g); ls(g, 0); }
    taped(g, D.g5, 300, 565, -.04, T.g5, T.nO, t, { tape: false, fromY: 40 });
    taped(g, D.santos, 510, 730, -.03, T.san, T.nO, t, { slam: true, fromX: 60 });
    taped(g, D.saints, 600, 860, .03, T.saints - .03, T.nO, t, { slam: true, tape: false });
    taped(g, D.angeles, 510, 1040, .025, T.ang, T.nO, t, { slam: true, fromX: -60, dir: -1 });
    taped(g, D.angels, 600, 1170, -.03, T.angels - .03, T.nO, t, { slam: true, tape: false, dir: -1 });
    if (t >= T.haloS && t < T.nO) halo(g, 380, 655, ORA, t - T.haloS);
    if (t >= T.angels && t < T.nO) halo(g, 380, 965, COB, t - T.angels);
    taped(g, D.spanish, 510, 1330, 0, T.san + .35, T.nO, t, { tape: false, fromY: 40 });
    /* not a copy: the game city's vellum lands off the pins; the stamp; Garbut's own words, same interview */
    taped(g, D.our, 760, 1405, .02, T.our, S.K, t, { tape: false, fromY: 40 });
    taped(g, D.nac, 510, 930, -.07, T.nac, S.K, t, { slam: true, tape: false, dir: -1 });
    if (t >= T.nac && t < T.nac + .5) KIT.impact(g, 510, 930, t - T.nac, 1.3, RED);
    stripAt(g, D.rb, 510, 1110, .015, T.rb, S.K + .25, t, { dir: 1 });
    taped(g, D.c3, 560, 1270, .02, T.rb + .2, S.K + .25, t, { tape: false, fromY: 40 });
    stripAt(g, D.q3, 510, 640, -.02, T.q3, S.K + .25, t);
    /* end: two identical answers, neither highlighted, one per panel */
    taped(g, D.sign, 790, 850, .03 * osc(t, 9, 0), T.ySign, T.seamS, t, { slam: true, tape: false, dir: 1 });
    taped(g, D.pier, 790, 1385, .03 * osc(t, 9, 2), T.yPier, T.seamS, t, { slam: true, tape: false, dir: 1 });
  }
  function halo(g, x, y, col, u) { var k = eo(seg(u, 0, .3)); g.save(); g.translate(x, y - 10 * k); g.globalAlpha *= k; g.beginPath(); g.ellipse(0, 0, 70, 16, -.08, 0, TAU); stroke(g, col, 8); g.restore(); }

  /* ---------- captions: masking tape in the upper third, phrase by phrase; the hook card is frame 0 and the last frame ---------- */
  var GLUE = { the: 1, a: 1, an: 1, your: 1, its: 1, of: 1, at: 1, to: 1, and: 1, in: 1, with: 1, on: 1, by: 1, so: 1, for: 1, own: 1, how: 1, that: 1, if: 1, you: 1, no: 1, or: 1, it: 1, was: 1, will: 1, most: 1, his: 1, is: 1, del: 1 };
  var CAPS = (function () {
    var outc = [];
    VO.lines.forEach(function (l) {
      var cur = [], ws = [];
      l.words.forEach(function (w) { var L = ws[ws.length - 1]; if (L && L.w === 'L.' && w.w.indexOf('A.') === 0) ws[ws.length - 1] = { w: 'L.' + w.w, t0: L.t0, t1: w.t1 }; else ws.push(w); });
      /* the hook card reads "IS GTA 5'S CITY REAL?" (5 words); the voice keeps "Is the GTA 5 city real?" */
      if (l.id === 'hook') ws = ws.filter(function (w) { return norm(w.w) !== 'the'; }).map(function (w) { return norm(w.w) === '5' ? { w: "5'S", t0: w.t0, t1: w.t1 } : w; });
      ws.forEach(function (w, i) { cur.push(w); if (/[.?!:]["”]?$/.test(w.w) && !/^L\.$/.test(w.w) && i < ws.length - 1) { cur.id = l.id; outc.push(cur); cur = []; } });
      if (cur.length) { cur.id = l.id; outc.push(cur); }
    });
    return outc.map(function (ws) { return { id: ws.id, t0: ws[0].t0, t1: ws[ws.length - 1].t1, s: ws[0].t0 - .04, words: ws }; });
  })();
  var STRESS;
  function stressed(w) { for (var i = 0; i < STRESS.length; i++) if (Math.abs(STRESS[i] - w.t0) < .02) return true; return false; }
  var CAPY = 410;
  function captions(g, t) {
    t = tq(t);
    var card0 = null, ci = -1;
    if (t >= T.loopCap) { card0 = CAPS[0]; ci = -1; }
    else CAPS.forEach(function (c, i) { if (t >= c.s) { card0 = c; ci = i; } });
    if (!card0) return;
    var nx = ci >= 0 ? CAPS[ci + 1] : null, ns = nx ? nx.s : T.loopCap, end = ci === 0 || card0.id === 'copy' ? ns : Math.min(card0.t1 + .55, ns);
    if (ci >= 0 && t >= end) return;
    var k = ci === -1 ? cd(t, T.loopCap, 16) : (ci === 0 ? 1 : cd(t, card0.s, 16));
    g.save(); cond(g); var cpx = 76; font(g, cpx, 900); ls(g, 1); g.textBaseline = 'alphabetic';
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
    var lh = cpx * 1.32, y0 = CAPY - (lines.length - 1) * lh / 2 + cpx * .36;
    lines.forEach(function (ln, li) {
      var tw = lw[li] - gap, x = CXc - tw / 2, y = y0 + li * lh + (1 - k) * 30, seed = Math.round(card0.t0 * 100) + li * 7;
      var r = mulberry(seed), x0 = x - 22, x1 = x + tw + 22, yt = y - cpx * .86, yb = y + cpx * .24, rot = (r() - .5) * .025;
      g.save(); g.translate(CXc, y); g.rotate(rot); g.translate(-CXc, -y);
      g.beginPath(); g.moveTo(x0, yt); for (var xx = x0; xx < x1; xx += 9) g.lineTo(xx, yt + (r() - .5) * 3); g.lineTo(x1, yt); for (var zz = 0; zz < 6; zz++) g.lineTo(x1 + (zz % 2 ? 7 : 0), yt + (yb - yt) * (zz + 1) / 6); for (xx = x1; xx > x0; xx -= 9) g.lineTo(xx, yb + (r() - .5) * 3); g.lineTo(x0, yb); for (zz = 0; zz < 6; zz++) g.lineTo(x0 - (zz % 2 ? 0 : 7), yb - (yb - yt) * (zz + 1) / 6); g.closePath();
      g.save(); g.shadowColor = 'rgba(0,16,12,.5)'; g.shadowBlur = 10; g.shadowOffsetX = 3; g.shadowOffsetY = 6; g.fillStyle = TAPE; g.fill(); g.restore();
      g.save(); g.clip(); g.globalAlpha *= .5; g.fillStyle = g.createPattern(GRAIN, 'repeat'); g.fillRect(x0 - 8, yt - 4, x1 - x0 + 16, yb - yt + 8); g.restore();
      ln.forEach(function (i) {
        var w = words[i], nw = words[i + 1], cur = ci >= 0 && stressed(w) && t >= w.t0 - .03 && t < Math.min(w.t1 + .05, nw ? nw.t0 - .03 : 1e9) + .2;
        if (cur) { g.fillStyle = ORA; g.fillRect(x - 6, y + cpx * .06, ws[i] + 12, cpx * .12); }
        g.fillStyle = cur ? '#d9480f' : INK; g.fillText(up[i], x, y); x += ws[i] + gap;
      });
      g.restore();
    });
    g.restore(); unst(g); ls(g, 0);
  }

  var NOISE, POSTERMODE = false, VIG = null;
  function stage(g) { g.fillStyle = BG; g.fillRect(0, 0, W, H); }
  function vignette(g) {
    if (!VIG) { VIG = mk(W, H); var q = VIG.getContext('2d'), gr = q.createRadialGradient(510, 960, 560, 510, 980, 1300); gr.addColorStop(0, 'rgba(0,14,10,0)'); gr.addColorStop(1, 'rgba(0,14,10,.55)'); q.fillStyle = gr; q.fillRect(0, 0, W, H); }
    g.drawImage(VIG, 0, 0);
  }
  function railClip(g) { g.beginPath(); if (LIVE2.clip) g.rect(BX0, 0, BX1 - BX0, BY1); else g.rect(-500, -500, 2080, BY1 + 500); g.clip(); }
  function sceneT(t) { return t >= T.seamC ? t - DUR : t; }
  function frame(g, t) {
    g.setTransform(1, 0, 0, 1, 0, 0);
    stage(g);
    var st = t;
    if (LIVE2.bg) { g.drawImage(D.mat, 0, 0); vignette(g); }
    /* a slow hand-held drift of the whole table (periodic in DUR, so the loop is seamless): nothing ever sits frozen */
    var ddx = 7 * osc(t, 17, .3) + 3 * osc(t, 29, 1.1), ddy = 5 * osc(t, 13, 2.1) + 2 * osc(t, 31, .7), drr = .0035 * osc(t, 11, .9);
    g.save(); g.beginPath(); g.rect(0, SHY0, W, SHY1 - SHY0); g.clip(); g.translate(540 + ddx, 920 + ddy); g.rotate(drr); g.scale(ZB, ZB); g.translate(-510, -990); if (LIVE2.bg) lightTable(g, t); sheets(g, st); g.restore();
    g.save(); railClip(g); g.translate(510 + ddx, 990 + ddy); g.rotate(drr); g.translate(-510, -990); props(g, st); g.restore();
    if (!POSTERMODE && LIVE.text) captions(g, t);
    if (LIVE.grain && NOISE && LIVE2.bg) { g.globalAlpha = .05; g.globalCompositeOperation = 'overlay'; var o = Math.floor(t * 24) * 37 % 256; g.fillStyle = g.createPattern(NOISE, 'repeat'); g.translate(-o, -o); g.fillRect(o, o, W, H); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }
  }
  function TEXTS(t) {
    var o = [], S = T.S;
    function Tx(id, text, a, b) { if (t >= a && t < b) o.push({ id: id, text: text, x0: 0, y0: 0, x1: 0, y1: 0 }); }
    Tx('tSC', 'REAL SOUTHERN CALIFORNIA', T.tSC + .25, T.q1O); Tx('tLA', 'REAL LOS ANGELES', T.tLA + .25, T.cn0 - .05);
    Tx('q1', 'A RE-IMAGINED … SOUTHERN CALIFORNIA', T.q1 + .2, T.q1O); Tx('c1', 'ROCKSTAR NORTH, ON GTA V', T.q1 + .45, T.q1O);
    Tx('q2', 'A WORLD THAT INCORPORATES ALL OF LOS ANGELES', T.q2 + .2, T.q2O); Tx('c2', 'AARON GARBUT, GTA V ART DIRECTOR', T.q2 + .25, T.c2O);
    Tx('cn', '250,000+ IMAGES SHOT', T.cnL + .05, T.cnO); Tx('cn2', 'GARBUT · BUZZFEED 2013', T.cnL + .05, T.cnO);
    Tx('tHW', 'REAL HOLLYWOOD SIGN', T.tHW + .25, S.F + .05); Tx('tVW', 'GAME VINEWOOD', T.regE + .1, S.F + .05); Tx('edge', 'EDGE MAGAZINE', T.cnO + .35, S.F + .05);
    Tx('tSM', 'REAL SANTA MONICA PIER', T.tSM + .25, S.G + .05); Tx('tDP', 'GAME DEL PERRO', T.regF + .1, S.G + .05); Tx('edgeP', 'EDGE: AN HOMAGE', T.tSM + .35, S.G + .05);
    Tx('g5', 'GTA 5’S CITY:', T.g5 + .2, T.nO); Tx('san', 'LOS SANTOS', T.san + .2, T.nO); Tx('sts', '= THE SAINTS', T.saints + .15, T.nO); Tx('ang', 'LOS ANGELES', T.ang + .2, T.nO); Tx('sta', '= THE ANGELS', T.angels + .15, T.nO); Tx('spa', 'SPANISH · VIA EDGE', T.san + .55, T.nO);
    Tx('nac', 'NOT A COPY', T.nac + .16, S.K);
    Tx('our', 'OUR DRAWINGS', T.our + .2, S.K); Tx('rb', 'I’D NEVER WANT TO REBUILD A CITY', T.rb + .2, S.K + .25); Tx('c3', 'AARON GARBUT EDGE 2014', T.rb + .4, S.K + .25);
    Tx('q3', 'WE USE [REALITY] AS A STARTING POINT', T.q3 + .2, S.K + .25);
    Tx('sg', 'SIGN', T.ySign + .14, T.seamS); Tx('pr', 'PIER', T.yPier + .14, T.seamS);
    return o;
  }

  /* ---------- times and sound events, all from the voice ---------- */
  function initTimes() {
    T.seamS = DUR - .45; T.seamC = DUR; T.loopCap = DUR - .15;
    function F(id, t, type, gain) { GT[id] = t; EV.push({ t: t, type: type, g: gain == null ? 1 : gain, id: id }); return t; }
    /* a hit that can't find a pause still sounds, as a soft tick under the voice (the picture always has its sound) */
    function GF(id, t, type, tol, gain) { var r = G(id, t, type, tol, gain); if (!EV.some(function (e) { return e.id === id; })) F(id, t, 'tick', 1.1); return r; }
    var S = T.S = {};
    S.B = start('socal') - .3; S.D = start('photos') - .35; S.E = start('sign') - .3; S.F = start('pier') - .3;
    S.G = start('name') - .3; S.H = start('copy') - .3; S.K = start('end') - .3;
    /* every vellum register is a click, written into a pause of the voice */
    function REG(id, t) { return GF(id, t, 'click', .3, 1); }
    /* hook: on frame 0 the game's sign is already gliding over the real one; it registers just after "real?" */
    T.vA0 = -.45; T.regA = F('regA', wend('hook', 'real') + .15, 'click', 1);
    /* socal: the coast, and only Southern California; the vellum registers after the line */
    T.tSC = S.B + .5; GF('tSCs', T.tSC + .05, 'slap', .3, .8);
    T.regB = REG('regB', after('socal')); T.vB0 = T.regB - .6;
    T.q1 = S.B + .3; G('q1s', T.q1, 'pin', .3, .8);
    /* la: Rockstar's chip and strip peel off before "Its"; Garbut's strip and chip land together */
    T.q1O = start('la') - .25; T.q2 = at('la', 'says') + .1; T.all = at('la', 'all') - .05; GF('q2s', T.q2, 'pin', .3, .8);
    T.tLA = T.q2 + .45; GF('tLAs', T.tLA + .05, 'slap', .3, .8);
    /* photos: a print per beat, the counter rolls on the number and lands in the pause */
    T.pr = []; var p0 = start('photos') - .1, p1 = wend('photos', 'images');
    for (var i = 0; i < 8; i++) { T.pr.push(p0 + (p1 - p0) * i / 7); F('pr' + i, T.pr[i] + .12, 'tick', .7); }
    T.cn0 = at('photos', 'over') - .2; T.roll = at('photos', 'over'); T.cnL = at('photos', '250000') + .6; G('cnS', after('photos'), 'thock', .45, 2.2);
    T.q2O = T.cnL + .05; T.c2O = S.E; T.cnO = start('sign') + .35;
    /* sign: REAL tag on "Hollywood", the vellum registers in the pause after the question */
    T.tHW = Math.min(S.E + .45, at('sign', 'hollywood') - .05); GF('tHWs', T.tHW + .1, 'slap', .3, .8);
    T.regE = REG('regE', after('sign')); T.vE0 = T.regE - .55;
    /* pier */
    T.tSM = Math.min(S.F + .45, at('pier', 'santa') - .05); GF('tSMs', T.tSM + .1, 'slap', .3, .8);
    T.regF = REG('regF', after('pier')); T.vF0 = T.regF - .55;
    /* name: "Santos means saints." [halo pop in the written gap] "Angeles means angels." */
    T.g5 = S.G + .45; T.san = at('name', 'name') - .05; T.saints = at('name', 'saints'); T.ang = start('name2') - .1; T.angels = T.ang + .12;
    GF('sanS', T.san, 'pop', .3, 1); T.haloS = G('halo', after('name'), 'snap', .3, 1.4); GF('angS', T.ang, 'pop', .3, 1);
    T.nO = S.H + .62;
    /* copy: the whole game city on vellum lands 60 px off the pins (thud), NOT A COPY, Garbut's line under it */
    T.vH0 = S.H + .45; T.regH = GF('regH', after('copy'), 'thock', .3, 2.2); T.our = T.regH + .1;
    T.nac = G('nac', T.regH + .5, 'stamp', .3, 2.2); T.rb = T.nac + .3;
    T.q3 = start('start') - .25; G('q3s', T.q3, 'pin', .3, .8);
    /* end: the two answers are tapped onto their panels in the written pause */
    T.ySign = F('tapY', after('end') - .1, 'slap', 1); T.yPier = F('tapN', T.ySign + .13, 'slap', 1);
    G('seam', T.seamS + .1, 'swish', .3, 1.6);
    /* sheet landings */
    ['B', 'D', 'E', 'F', 'G', 'H', 'K'].forEach(function (k) { GF('sh' + k, S[k] + .42, 'thock', .3, .9); });
    STRESS = [['hook', 'real'], ['la', 'all'], ['sign2', 'vinewood'], ['pier2', 'del'], ['name', 'saints'], ['name2', 'angels'], ['copy', 'not'], ['end2', 'first']].map(function (p) { return at(p[0], p[1]); });
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
    /* per-hit trims (dB) so that with duck.smr_db 24 every hit peaks near −10 dBFS and ≥ 3 dB under the nearest voice peak */
    var TRIM = window.SFX_TRIM || { nac: -5, cnS: -5.5, q1s: -2.5, q2s: -2.5, q3s: -2.5, halo: -1, seam: -3.5, regA: -4, regB: -4.5, regE: -5.5, regF: -5, regH: -4.5, tapY: -5, tapN: -5, tSMs: -1 };
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

  window.FILM = { bare: function () { ctx.setTransform(1, 0, 0, 1, 0, 0); stage(ctx); }, W: W, H: H, DUR: DUR, POSTER: 0, SLUG: 'gta-losantos', SHOTS: [], init: init, render: render, frame: frame, LIVE: LIVE, LIVE2: LIVE2, T: T, GT: GT };
  var _bt = buildTextures; buildTextures = function () { _bt(); EV.length = 0; initTimes(); window.FILM.POSTER = Math.round(Math.min(T.angels + .9, T.S.H - .1) * 30) / 30 + 1 / 60;
    window.FILM.SHOTS = [{ id: 'hook', name: 'Real?', t0: 0, t1: start('socal') }, { id: 'socal', name: 'Rockstar', t0: start('socal'), t1: start('sign') }, { id: 'sign', name: 'Sign', t0: start('sign'), t1: start('pier') }, { id: 'pier', name: 'Pier', t0: start('pier'), t1: start('name') }, { id: 'name', name: 'Name', t0: start('name'), t1: start('copy') }, { id: 'copy', name: 'Not a copy', t0: start('copy'), t1: start('end') }, { id: 'end', name: 'Which first?', t0: start('end'), t1: DUR }]; };

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
    function dirty(x, y, w, h) { var d = ctx.getImageData(x, y, w, h).data, o = { c: 0, x0: 1e9, x1: -1, y0: 1e9, y1: -1 }; for (var i = 0; i < d.length; i += 4) if (Math.abs(d[i] - 0x0e) + Math.abs(d[i + 1] - 0x2a) + Math.abs(d[i + 2] - 0x24) > 24) { var px = (i / 4) % w, py = Math.floor(i / 4 / w); o.c++; o.x0 = Math.min(o.x0, px); o.x1 = Math.max(o.x1, px); o.y0 = Math.min(o.y0, y + py); o.y1 = Math.max(o.y1, y + py); } return o; }
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
