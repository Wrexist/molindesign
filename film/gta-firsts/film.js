/* "GTA 3 didn't invent open worlds.": Delta, pillar 3 (GTA history).
   A vertical film written in code, narrated first and cut to the voice: every visual beat is keyed to a word time from
   vo/vo.js (window.VO) with at(id, word). Pure function of t. Contract: window.FILM, DUR, render(t), READY, EV, TEXTS(t),
   SCORE(ctx). Rockstar (press release, Oct 2011): GTA III "originally released in October 2001 for the PlayStation 2",
   "the first three-dimensional, open-world Grand Theft Auto title". The Strong museum (World Video Game Hall of Fame,
   inducted 2016): "It wasn't the first 3-D 'sandbox' game", "the first of its kind to achieve massive mainstream
   popularity", "a model for many other open-world games that followed". Time Extension: the first GTA, PC, Nov 28 1997.
   GTA VI November 19, 2026 (Rockstar). The set is a hand-cut paper city on a drafting table; the hero move is the
   camera (straight down for 1997, a swoop to the street for 2001). Engine helpers from film/gta-outsold.
   No logos, box art, characters, footage or music. */
(function () {
  'use strict';
  var W = 1080, H = 1920, VO = window.VO, DUR = VO.dur, CX = 510;
  var BG = '#0c1226', CREAM = '#fbf0ea';
  var HOT = '#ffcf33', TEAL = '#5fa8d3', ORG = '#e8743b';
  var INK = '#1a2036', PAPER = '#f2e5cd', NEWS = '#efe5cf', KRAFT = '#b8834b', KRAFT2 = '#8a5a2e', BENCH = '#1c1042';
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
      lines.forEach(function (L, i) { var y = 32 + lh * (i + .5); g.fillStyle = INK; g.fillText(L, 36, y); var mm = g.measureText(L); rec.push([36, y - px * .62, 36 + mm.width, y + px * .3, L]);
        /* hot words: overprinted in red and underlined */
        (o.hot || []).forEach(function (hw) { var j = (' ' + L + ' ').indexOf(' ' + hw); if (j < 0) return; var x = 36 + g.measureText(L.slice(0, j)).width, ww = g.measureText(hw).width; g.fillStyle = RED; g.fillText(hw, x, y); g.fillRect(x - 4, y + px * .36, ww + 8, px * .12); });
      });
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
    var L = lines.map(function (q) { return typeof q === 'string' ? [q, px] : q; });
    var m = mk(4, 4).getContext('2d');
    function wOf(q, k) { cond(m); font(m, q[1] * k, 900); ls(m, 2); var ww = m.measureText(q[0]).width; unst(m); return ww; }
    var k = 1, w1 = Math.max.apply(null, L.map(function (q) { return wOf(q, 1); }));
    if (w1 > maxw) { k = maxw / w1; w1 = Math.max.apply(null, L.map(function (q) { return wOf(q, k); })); }
    L = L.map(function (q) { return [q[0], Math.floor(q[1] * k)]; });
    var hs = L.map(function (q) { return q[1] * 1.04; }), w = w1 + 56, h = hs.reduce(function (a1, b1) { return a1 + b1; }, 0) + 56, tp = jag(95, w, 4), bt = jag(96, w, 4), rec = [];
    var pc = piece([-w / 2, -h / 2 - 8, w / 2, h / 2 + 8], function (g) { g.beginPath(); g.moveTo(-w / 2, -h / 2 + tp[0][1]); tp.forEach(function (q) { g.lineTo(-w / 2 + q[0], -h / 2 + q[1]); }); for (var i = bt.length - 1; i >= 0; i--) g.lineTo(-w / 2 + bt[i][0], h / 2 + bt[i][1]); g.closePath(); }, NEWS, { sx: 6, sy: 12, blur: 16, extra: function (g) {
      var r = mulberry(91), yy = -h / 2 + 28;
      g.strokeStyle = col; g.lineWidth = 9; g.strokeRect(-w / 2 + 12, -h / 2 + 14, w - 24, h - 28);
      L.forEach(function (q, i) { var y = yy + hs[i] / 2; yy += hs[i]; inkText(g, q[0], 0, y + 2, q[1], col, 93 + i, { dense: 26, big: 2.2, ls: 2 }); var lw = wOf(q, 1); rec.push([-lw / 2, y - q[1] * .5, lw / 2, y + q[1] * .45, q[0]]); });
      g.globalCompositeOperation = 'destination-out';
      for (var i = 0; i < 260; i++) { g.globalAlpha = .2 + r() * .5; g.beginPath(); g.arc(-w / 2 + 16 + r() * (w - 32), -h / 2 + 14 + r() * (h - 28), .5 + r() * 1.8, 0, TAU); g.fill(); }
    } });
    wordsOf(pc, rec); pc.sw = w; pc.sh = h; return pc;
  }

  BODY.tear = .1; BODY.thock = .12; BODY.pop = .1; BODY.stamp = .18; BODY.swish = .26; BODY.slap = .1;

  /* =====================================================================================================
     THE SET: a hand-cut paper city on a drafting table at dusk. One board of streets and paper buildings,
     seen through a real camera (yaw, pitch, distance). The native move is the camera: straight down for
     1997 (the buildings fold flat into a map), then a swoop to street level for 2001 (they stand back up,
     one by one). No logos, no box art, no characters, no footage, no music.
     ===================================================================================================== */
  var PADC = '#f1e6cf', INK2 = '#24304f', RED = '#e23d3d';
  var MAPC = '#e9dcc0', ROAD = '#3b4152', WALK = '#d6c7a6', PARK = '#7fae6a';
  var BCOL = ['#c4553b', '#efe2c6', '#6f8fb3', '#e3b23c', '#4b5a78', '#d9825b', '#9aa9c4', '#c9b48a'];
  var BLD = [], PEOPLE = [], ROADS = [];
  function buildCity() {
    var r = mulberry(1997), cs = [-375, -125, 125, 375], k = 0;
    cs.forEach(function (bx, ix) { cs.forEach(function (by, iy) {
      if (ix === 2 && iy === 1) { BLD.park = [bx - 92, by - 92, bx + 92, by + 92]; return; }
      [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (q, qi) {
        if (r() < .12) return;
        var cx = bx + q[0] * 47, cy = by + q[1] * 47, hw = 36 + r() * 8, hd = 36 + r() * 8;
        var central = Math.abs(bx) < 200 && Math.abs(by) < 200, h = central ? 120 + r() * 190 : 50 + r() * 120;
        if (ix === 1 && iy === 2 && qi === 1) h = 360;
        BLD.push({ x0: cx - hw, y0: cy - hd, x1: cx + hw, y1: cy + hd, h: h, c: BCOL[Math.floor(r() * BCOL.length)], i: k++, d: Math.hypot(cx, cy) + r() * 60 });
      });
    }); });
    /* rise order: from the middle out */
    var ord = BLD.slice().sort(function (a, b) { return a.d - b.d; }); ord.forEach(function (b, i) { b.o = i / (ord.length - 1); });
    /* the crowd: paper people on the sidewalks */
    var rp = mulberry(2001);
    for (var i = 0; i < 230; i++) {
      var axis = rp() < .5, line = [-250, 0, 250][Math.floor(rp() * 3)] + (rp() < .5 ? -34 : 34), along = -470 + rp() * 940;
      PEOPLE.push({ x: axis ? line : along, y: axis ? along : line, c: ['#ffcf33', '#e23d3d', '#5fa8d3', '#f1e6cf', '#e8743b', '#9fd38a'][Math.floor(rp() * 6)], o: rp(), ph: rp() * TAU, w: 1 });
    }
    for (var n = 0; n < 340 && i < 6000; i++) {
      var px = -500 + rp() * 1000, py = -500 + rp() * 1000, hit = false;
      BLD.forEach(function (b) { if (px > b.x0 - 8 && px < b.x1 + 8 && py > b.y0 - 8 && py < b.y1 + 8) hit = true; });
      if (hit) continue; n++;
      PEOPLE.push({ x: px, y: py, c: ['#ffcf33', '#e23d3d', '#5fa8d3', '#f1e6cf', '#e8743b', '#9fd38a'][Math.floor(rp() * 6)], o: rp(), ph: rp() * TAU, w: 2 });
    }
  }

  /* ---------- the camera ---------- */
  var CAM = {};
  function camAt(t) {
    var c = {};
    c.yaw = stepv(t, 0, T.YAW) + .04 * osc(t, 2, .4) * seg(t, .2, 1.4);
    c.pitch = stepv(t, 89.5, T.PIT);
    c.D = 1.1 * stepv(t, 1720, T.DIS);
    c.cy = stepv(t, 1020, T.CY);
    c.F = 1150; c.cx = 510;
    return fitCam(c, t);
  }
  /* keep the board (and its traced copies, and the building tops) inside the rail x 90-930 and above y 1450:
     each frame the camera backs off and re-centres just enough. Still a pure function of t. */
  function fitCam(c, t) {
    var gk = T.cp0 == null ? 0 : seg(t, T.cp0, T.cp0 + 1.0) * (1 - seg(t, T.cpO, T.cpO + .4));
    for (var it = 0; it < 6; it++) {
      setCam(c); var x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
      var A = function (x, y, z, xOnly) { var q = proj(x, y, z); if (q[0] < x0) x0 = q[0]; if (q[0] > x1) x1 = q[0]; if (!xOnly) { if (q[1] < y0) y0 = q[1]; if (q[1] > y1) y1 = q[1]; } };
      [[-560, -560], [560, -560], [560, 560], [-560, 560]].forEach(function (k) { A(k[0], k[1], 0); });
      if (gk > 0) [[-830, 0], [830, 0], [0, 860], [0, -800]].forEach(function (o) { [[-560, -560], [560, -560], [560, 560], [-560, 560]].forEach(function (k) { A(o[0] + k[0] * .45, o[1] + k[1] * .45, 0); }); });
      BLD.forEach(function (b) { var h = b.h * hsAt(b, t); A(b.x0, b.y0, h, true); A(b.x1, b.y0, h, true); A(b.x1, b.y1, h, true); A(b.x0, b.y1, h, true); });
      var sc = Math.min(1, 405 / ((x1 - x0) / 2), 880 / (y1 - y0));
      if (sc < .998) { c.D /= sc; continue; }
      c.cx += 510 - (x0 + x1) / 2;
      c.cy += 1440 - y1;
    }
    return c;
  }
  function setCam(c) {
    var ph = c.pitch * Math.PI / 180; CAM = c; CAM.cs = Math.cos(c.yaw); CAM.sn = Math.sin(c.yaw); CAM.cp = Math.cos(ph); CAM.sp = Math.sin(ph);
    CAM.pos = [0, -c.D * CAM.cp, c.D * CAM.sp];
  }
  function rot(x, y) { return [x * CAM.cs - y * CAM.sn, x * CAM.sn + y * CAM.cs]; }
  function proj(x, y, z) {
    var q = rot(x, y), vx = q[0], vy = q[1] + CAM.D * CAM.cp, vz = z - CAM.D * CAM.sp;
    var yc = vy * CAM.sp + vz * CAM.cp, zc = vy * CAM.cp - vz * CAM.sp;
    if (zc < 20) zc = 20;
    return [CAM.cx + CAM.F * vx / zc, CAM.cy - CAM.F * yc / zc, zc];
  }
  function poly(g, pts) { g.beginPath(); pts.forEach(function (p, i) { var s = proj(p[0], p[1], p[2] || 0); if (i) g.lineTo(s[0], s[1]); else g.moveTo(s[0], s[1]); }); g.closePath(); }
  function paperFill(g, col, edge) {
    g.fillStyle = col; g.fill();
    g.save(); g.globalAlpha *= .9; g.fillStyle = g.createPattern(GRAIN, 'repeat'); g.fill(); g.globalCompositeOperation = 'multiply'; g.globalAlpha *= .35; g.fill(); g.restore();
    if (edge !== false) { g.strokeStyle = 'rgba(255,248,232,.92)'; g.lineWidth = 2.4; g.lineJoin = 'round'; g.stroke(); }
  }
  function shade(hex, k) {
    var n = parseInt(hex.slice(1), 16), rr0 = n >> 16, gg = n >> 8 & 255, bb = n & 255;
    return 'rgb(' + Math.round(rr0 * k) + ',' + Math.round(gg * k) + ',' + Math.round(bb * k) + ')';
  }
  /* each building's height: standing on frame 0 (GTA 3), folded flat for 1997, standing back up one by one in 2001 */
  function hsAt(b, t) {
    if (t < T.flat0) { if (t < T.up0) return .04; return lerp(.04, 1, clamp(cd(t, T.up0 + b.o * (T.up1 - T.up0 - .3), 13), 0, 1)); }
    var down = 1 - .96 * eio(seg(t, T.flat0, T.flat1));
    var trem = .08 * eio(seg(t, T.trem0, T.trem1)) * (1 + .25 * Math.sin(t * 22 + b.i));
    if (t < T.rise0) return down + trem;
    var t0 = T.rise0 + b.o * (T.rise1 - T.rise0 - .3);
    return lerp(.12, 1, clamp(cd(t, t0, 13), 0, 1));
  }
  function drawBuilding(g, b, t, dim) {
    var h = b.h * hsAt(b, t); if (h < 1) h = 1;
    var L = .55 + .45 * Math.max(0, Math.cos(CAM.yaw + 2.2));
    var faces = [
      { n: [0, -1], p: [[b.x0, b.y0], [b.x1, b.y0]], k: .78 },
      { n: [1, 0], p: [[b.x1, b.y0], [b.x1, b.y1]], k: .62 + .2 * L },
      { n: [0, 1], p: [[b.x1, b.y1], [b.x0, b.y1]], k: .7 },
      { n: [-1, 0], p: [[b.x0, b.y1], [b.x0, b.y0]], k: .55 + .15 * L }];
    faces.forEach(function (f) {
      var mx = (f.p[0][0] + f.p[1][0]) / 2, my = (f.p[0][1] + f.p[1][1]) / 2, rn = rot(f.n[0], f.n[1]), rc = rot(mx, my);
      var vx = CAM.pos[0] - rc[0], vy = CAM.pos[1] - rc[1]; if (vx * rn[0] + vy * rn[1] <= 0) return;
      poly(g, [[f.p[0][0], f.p[0][1], 0], [f.p[1][0], f.p[1][1], 0], [f.p[1][0], f.p[1][1], h], [f.p[0][0], f.p[0][1], h]]);
      paperFill(g, shade(b.c, f.k * dim));
      /* windows: small cut squares, rows of them, only once the wall is tall enough */
      if (h > 60 && CAM.pitch < 75) {
        var len = Math.hypot(f.p[1][0] - f.p[0][0], f.p[1][1] - f.p[0][1]), nc = Math.max(2, Math.floor(len / 24)), nr = Math.floor((h - 20) / 30);
        g.fillStyle = (b.i % 3 === 0) ? 'rgba(255,214,120,' + (.8 * dim).toFixed(2) + ')' : 'rgba(24,30,52,' + (.45 * dim).toFixed(2) + ')';
        for (var rI = 0; rI < nr; rI++) for (var cI = 0; cI < nc; cI++) {
          var u0 = (cI + .3) / nc, u1 = (cI + .7) / nc, z0 = 18 + rI * 30, z1 = z0 + 14;
          var ax = lerp(f.p[0][0], f.p[1][0], u0), ay = lerp(f.p[0][1], f.p[1][1], u0), bx = lerp(f.p[0][0], f.p[1][0], u1), by = lerp(f.p[0][1], f.p[1][1], u1);
          poly(g, [[ax, ay, z0], [bx, by, z0], [bx, by, z1], [ax, ay, z1]]); g.fill();
        }
      }
    });
    poly(g, [[b.x0, b.y0, h], [b.x1, b.y0, h], [b.x1, b.y1, h], [b.x0, b.y1, h]]);
    paperFill(g, shade(b.c, 1.0 * dim));
    /* a roof hatch, so the 1997 map reads as roofs seen from above */
    g.fillStyle = 'rgba(24,30,52,' + (.18 * dim).toFixed(2) + ')';
    var hx = (b.x0 + b.x1) / 2, hy = (b.y0 + b.y1) / 2; poly(g, [[hx - 10, hy - 8, h], [hx + 10, hy - 8, h], [hx + 10, hy + 8, h], [hx - 10, hy + 8, h]]); g.fill();
  }
  /* the car: a small paper taxi that laps the inner ring road (7 laps per film, so the loop is seamless) */
  function carPos(t) {
    var u = ((t / DUR * 7) % 1 + 1) % 1, s = u * 4, side = Math.floor(s), f = s - side, R = 250 - 17;
    var pts = [[-R, -R], [R, -R], [R, R], [-R, R], [-R, -R]], a = pts[side], b = pts[side + 1];
    return { x: lerp(a[0], b[0], f), y: lerp(a[1], b[1], f), ang: Math.atan2(b[1] - a[1], b[0] - a[0]) };
  }
  function drawCar(g, t, dim) {
    var c = carPos(t), ca = Math.cos(c.ang), sa = Math.sin(c.ang);
    function P(dx, dy, z) { return [c.x + dx * ca - dy * sa, c.y + dx * sa + dy * ca, z]; }
    var top = seg(CAM.pitch, 60, 85), sc = 1 + 1.3 * top, L = 22 * sc, Wd = 11 * sc, H = 12 * sc;
    poly(g, [P(-L, -Wd, 0), P(L, -Wd, 0), P(L, Wd, 0), P(-L, Wd, 0)]); g.fillStyle = 'rgba(10,12,24,.35)'; g.fill();
    [[P(-L, -Wd, 0), P(L, -Wd, 0), P(L, -Wd, H), P(-L, -Wd, H)], [P(L, -Wd, 0), P(L, Wd, 0), P(L, Wd, H), P(L, -Wd, H)], [P(L, Wd, 0), P(-L, Wd, 0), P(-L, Wd, H), P(L, Wd, H)], [P(-L, Wd, 0), P(-L, -Wd, 0), P(-L, -Wd, H), P(-L, Wd, H)]].forEach(function (q) { poly(g, q); paperFill(g, shade('#ffcf33', .72 * dim), false); });
    poly(g, [P(-L, -Wd, H), P(L, -Wd, H), P(L, Wd, H), P(-L, Wd, H)]); paperFill(g, shade('#ffcf33', dim));
    poly(g, [P(-6 * sc, -Wd + 2, H + 7), P(10 * sc, -Wd + 2, H + 7), P(10 * sc, Wd - 2, H + 7), P(-6 * sc, Wd - 2, H + 7)]); paperFill(g, shade('#ffe28a', dim), false);
    if (top > 0) {
      /* the top-down player marker: a red paper arrow bobbing over the car */
      var m0 = proj(c.x, c.y, H + 10), bob = 6 * Math.sin(t * 7);
      g.save(); g.globalAlpha *= top; g.translate(m0[0], m0[1] - 46 + bob);
      g.beginPath(); g.moveTo(-17, -22); g.lineTo(17, -22); g.lineTo(0, 6); g.closePath();
      g.fillStyle = RED; g.fill(); g.strokeStyle = 'rgba(255,248,232,.95)'; g.lineWidth = 3; g.lineJoin = 'round'; g.stroke();
      g.restore();
    }
  }
  function drawPerson(g, p, t, k, dim) {
    if (k <= 0) return;
    var z = (1 - eo(k)) * 160, base = proj(p.x, p.y, z), sh = proj(p.x, p.y, z + 72), head = proj(p.x, p.y, z + 93), s = 1.6 * CAM.F / base[2];
    var bw = 15 * s, sw = 12 * s;
    g.save(); g.globalAlpha *= clamp(k * 4, 0, 1);
    g.beginPath(); g.moveTo(base[0] - bw, base[1]); g.lineTo(sh[0] - sw, sh[1] + 5 * s); g.quadraticCurveTo(sh[0], sh[1] - 4 * s, sh[0] + sw, sh[1] + 5 * s); g.lineTo(base[0] + bw, base[1]); g.closePath();
    g.fillStyle = shade(p.c, .92 * dim); g.fill(); g.strokeStyle = 'rgba(255,248,232,.85)'; g.lineWidth = Math.max(1.2, 2 * s); g.stroke();
    g.beginPath(); g.arc(head[0], head[1], Math.max(4, 11 * s), 0, TAU); g.fillStyle = shade('#f1e6cf', dim); g.fill(); g.stroke();
    g.restore();
  }
  /* the board, its roads, the ghost copies for "a model", the buildings and people sorted far to near */
  function city(g, t) {
    setCam(camAt(t));
    var dim = 1 - .42 * bump2(t, T.dip0, T.dip1);
    /* traced copies for "a model": four smaller boards beside the real one, traced in dashed pencil, then filled with faint buildings */
    var gk = seg(t, T.cp0, T.cp0 + 1.0) * (1 - seg(t, T.cpO, T.cpO + .4));
    if (gk > 0) [[-830, 0, 0], [830, 0, .12], [0, 860, .24], [0, -800, .36]].forEach(function (cpy) {
      var ox = cpy[0], oy = cpy[1], sc = .45, k = clamp((gk - cpy[2] * .5) / .7, 0, 1); if (k <= 0) return;
      function Q(x, y, z) { return [ox + x * sc, oy + y * sc, (z || 0) * sc]; }
      var tr = eio(k), fillK = seg(k, .55, 1);
      g.save();
      poly(g, [Q(-560, -560), Q(560, -560), Q(560, 560), Q(-560, 560)]); g.fillStyle = 'rgba(233,220,192,' + (.22 * fillK * dim).toFixed(3) + ')'; g.fill();
      BLD.forEach(function (b) { if (b.o > fillK) return; poly(g, [Q(b.x0, b.y0), Q(b.x1, b.y0), Q(b.x1, b.y1), Q(b.x0, b.y1)]); g.fillStyle = 'rgba(255,207,51,' + (.32 * dim).toFixed(2) + ')'; g.fill(); });
      g.setLineDash([14, 10]); g.lineDashOffset = -t * 40; g.strokeStyle = 'rgba(255,207,51,.9)'; g.lineWidth = 4;
      /* the outline draws on as one pencil line */
      var per = [Q(-560, -560), Q(560, -560), Q(560, 560), Q(-560, 560), Q(-560, -560)], L = 4 * tr;
      g.beginPath(); for (var e = 0; e < 4 && e < L; e++) { var A = proj.apply(null, per[e]), B = proj.apply(null, per[e + 1]), f = Math.min(1, L - e); if (!e) g.moveTo(A[0], A[1]); g.lineTo(lerp(A[0], B[0], f), lerp(A[1], B[1], f)); } g.stroke();
      [-250, 0, 250].forEach(function (q) { var a1 = proj.apply(null, Q(q, -530)), b1 = proj.apply(null, Q(q, -530 + 1060 * tr)); g.beginPath(); g.moveTo(a1[0], a1[1]); g.lineTo(b1[0], b1[1]); g.stroke(); a1 = proj.apply(null, Q(-530, q)); b1 = proj.apply(null, Q(-530 + 1060 * tr, q)); g.beginPath(); g.moveTo(a1[0], a1[1]); g.lineTo(b1[0], b1[1]); g.stroke(); });
      g.restore();
    });
    /* the board: map paper with a thick edge */
    poly(g, [[-560, -560, 0], [560, -560, 0], [560, 560, 0], [-560, 560, 0]]);
    g.save(); g.shadowColor = 'rgba(4,6,16,.6)'; g.shadowBlur = 30; g.shadowOffsetY = 16; g.fillStyle = shade(MAPC, dim); g.fill(); g.restore();
    paperFill(g, shade(MAPC, dim));
    /* sidewalks (blocks), the park, then the roads on top */
    [-375, -125, 125, 375].forEach(function (bx) { [-375, -125, 125, 375].forEach(function (by) { poly(g, [[bx - 99, by - 99, 0], [bx + 99, by - 99, 0], [bx + 99, by + 99, 0], [bx - 99, by + 99, 0]]); g.fillStyle = shade(WALK, dim); g.fill(); }); });
    var pk = BLD.park; poly(g, [[pk[0], pk[1], 0], [pk[2], pk[1], 0], [pk[2], pk[3], 0], [pk[0], pk[3], 0]]); paperFill(g, shade(PARK, dim));
    [-500, -250, 0, 250, 500].forEach(function (q) {
      poly(g, [[q - 26, -530, 0], [q + 26, -530, 0], [q + 26, 530, 0], [q - 26, 530, 0]]); g.fillStyle = shade(ROAD, dim); g.fill();
      poly(g, [[-530, q - 26, 0], [530, q - 26, 0], [530, q + 26, 0], [-530, q + 26, 0]]); g.fillStyle = shade(ROAD, dim); g.fill();
    });
    /* lane dashes */
    g.fillStyle = 'rgba(255,214,120,' + (.55 * dim).toFixed(2) + ')';
    [-500, -250, 0, 250, 500].forEach(function (q) { for (var s = -520; s < 520; s += 60) { poly(g, [[q - 2.5, s, 0], [q + 2.5, s, 0], [q + 2.5, s + 26, 0], [q - 2.5, s + 26, 0]]); g.fill(); poly(g, [[s, q - 2.5, 0], [s + 26, q - 2.5, 0], [s + 26, q + 2.5, 0], [s, q + 2.5, 0]]); g.fill(); } });
    /* zebra crossings on every arm of every junction: a street map, not a board game */
    g.fillStyle = 'rgba(241,230,207,' + (.78 * dim).toFixed(2) + ')';
    [-500, -250, 0, 250, 500].forEach(function (X) { [-500, -250, 0, 250, 500].forEach(function (Y) {
      for (var zk = -18; zk <= 18; zk += 9) [[X + zk - 2.5, Y - 44, X + zk + 2.5, Y - 31], [X + zk - 2.5, Y + 31, X + zk + 2.5, Y + 44], [X - 44, Y + zk - 2.5, X - 31, Y + zk + 2.5], [X + 31, Y + zk - 2.5, X + 44, Y + zk + 2.5]].forEach(function (r) {
        if (Math.abs(r[0]) > 530 || Math.abs(r[2]) > 530 || Math.abs(r[1]) > 530 || Math.abs(r[3]) > 530) return;
        poly(g, [[r[0], r[1], 0], [r[2], r[1], 0], [r[2], r[3], 0], [r[0], r[3], 0]]); g.fill(); });
    }); });
    /* park trees: paper discs */
    var rT = mulberry(5);
    for (var i = 0; i < 9; i++) { var tx = pk[0] + 25 + rT() * 135, ty = pk[1] + 25 + rT() * 135; poly(g, [[tx - 14, ty - 14, 18], [tx + 14, ty - 14, 18], [tx + 14, ty + 14, 18], [tx - 14, ty + 14, 18]]); paperFill(g, shade('#4f8a4a', dim), false); }
    /* hard lamp shadows: each building throws its footprint, swept away from the lamp, onto the board */
    g.fillStyle = 'rgba(10,12,28,' + (.55 * dim).toFixed(2) + ')';
    BLD.forEach(function (b) {
      var hh = b.h * hsAt(b, t); if (hh < 3) return;
      var dx = hh * .6, dy = hh * .42, P0 = [[b.x0, b.y0], [b.x1, b.y0], [b.x1, b.y1], [b.x0, b.y1]];
      var pts = P0.concat(P0.map(function (q) { return [q[0] + dx, q[1] + dy]; }));
      pts.sort(function (a1, b1) { return a1[0] - b1[0] || a1[1] - b1[1]; });
      function cr(o, a1, b1) { return (a1[0] - o[0]) * (b1[1] - o[1]) - (a1[1] - o[1]) * (b1[0] - o[0]); }
      var lo = [], up = [];
      pts.forEach(function (q) { while (lo.length > 1 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); });
      pts.slice().reverse().forEach(function (q) { while (up.length > 1 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); });
      var hull = lo.slice(0, -1).concat(up.slice(0, -1));
      poly(g, hull.map(function (q) { return [Math.max(-556, Math.min(556, q[0])), Math.max(-556, Math.min(556, q[1])), 0]; })); g.fill();
    });
    /* depth-sorted items */
    var items = [];
    BLD.forEach(function (b) { var q = proj((b.x0 + b.x1) / 2, (b.y0 + b.y1) / 2, 0); items.push({ z: q[2] + 30, f: function () { drawBuilding(g, b, t, dim); } }); });
    var cp = carPos(t), cq = proj(cp.x, cp.y, 0); items.push({ z: cq[2], f: function () { drawCar(g, t, dim); } });
    if (t >= T.crowd1) PEOPLE.forEach(function (p) { var c0 = p.w === 1 ? T.crowd1 + p.o * .4 : T.crowd + p.o * .32, k = seg(t, c0, c0 + .26) * (1 - seg(t, T.crowdO, T.crowdO + .4)); if (k <= 0) return; var q = proj(p.x, p.y, 0); items.push({ z: q[2], f: function () { drawPerson(g, p, t, k, dim); } }); });
    items.sort(function (a, b) { return b.z - a.z; });
    items.forEach(function (it) { it.f(); });
  }
  function bump2(t, a, b) { return seg(t, a, a + .35) * (1 - seg(t, b, b + .4)); }

  /* ---------- the world: the drafting table at dusk, then the city on it; it bleeds the frame ---------- */
  function world(g, t) {
    var gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#0c1226'); gr.addColorStop(.45, '#1b2547'); gr.addColorStop(.75, '#3a2f55'); gr.addColorStop(1, '#151a30');
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
    /* a warm lamp pool on the table behind the board */
    var lx = 510 + 60 * osc(t, 3, 1), lg = g.createRadialGradient(lx, 1000, 60, lx, 1000, 760); lg.addColorStop(0, 'rgba(255,190,110,.28)'); lg.addColorStop(1, 'rgba(255,190,110,0)'); g.fillStyle = lg; g.fillRect(0, 0, W, H);
    /* pencil grid on the table (drafting paper) */
    g.save(); g.strokeStyle = 'rgba(160,180,230,.06)'; g.lineWidth = 2; for (var x = 30; x < W; x += 60) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); } for (var y = 30; y < H; y += 60) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); } g.restore();
    g.save(); g.globalAlpha = .5; g.fillStyle = g.createPattern(GRAIN, 'repeat'); g.fillRect(0, 0, W, H); g.restore();
    city(g, t);
  }

  /* ---------- printed pieces ---------- */
  function plate(text, w, px, bg, fg, ring) { return cardPiece(w, 80, bg || CREAM, [[text, px || 48, fg || INK, 3]], { r: 8, ring: ring || 'rgba(29,18,51,.25)' }); }
  function buildTextures() { GRAIN = buildGrain(); buildCity(); buildSet(); }
  function buildSet() {
    P.ros = (function () {
      var rec = [];
      var pc = piece([-120, -120, 120, 250], function (g) {
        g.beginPath(); for (var i = 0; i < 32; i++) { var a = i / 32 * TAU, rr1 = i % 2 ? 104 : 118; g.lineTo(Math.cos(a) * rr1, Math.sin(a) * rr1); } g.closePath();
        g.moveTo(-70, 70); g.lineTo(-100, 240); g.lineTo(-60, 210); g.lineTo(-20, 245); g.lineTo(0, 90); g.closePath();
        g.moveTo(70, 70); g.lineTo(100, 240); g.lineTo(60, 210); g.lineTo(20, 245); g.lineTo(0, 90); g.closePath();
      }, HOT, { extra: function (g) { g.fillStyle = CREAM; g.beginPath(); g.arc(0, 0, 80, 0, TAU); g.fill(); cond(g, 'condensed'); font(g, 56, 900); g.fillStyle = INK; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('FIRST?', 0, 4); var mm = g.measureText('FIRST?'); rec.push([-mm.width / 2, -26, mm.width / 2, 30, 'FIRST?']); unst(g); }, noclip: true });
      return wordsOf(pc, rec);
    })();
    P.y97 = cardPiece(330, 200, CREAM, [['1997', 96, INK, -30], ['FIRST GTA · PC', 40, RED, 52]], { r: 8, ring: TEAL });
    P.tx = cardPiece(330, 70, INK2, [['TIME EXTENSION', 38, CREAM, 2]], { r: 6, ring: 'rgba(251,240,234,.5)' });
    P.top = cardPiece(500, 86, HOT, [['VIEW: STRAIGHT DOWN', 46, INK, 3]], { r: 8, ring: 'rgba(29,18,51,.3)' });
    P.y01 = cardPiece(330, 200, CREAM, [['2001', 96, INK, -30], ['GTA 3 · PS2', 40, RED, 52]], { r: 8, ring: TEAL });
    P.rsg = cardPiece(330, 70, INK2, [['ROCKSTAR GAMES', 38, CREAM, 2]], { r: 6, ring: 'rgba(251,240,234,.5)' });
    P.qR = buildStrip('“first three-dimensional, open-world Grand Theft Auto title”', 760, 46, 21);
    P.cR = cardPiece(690, 66, INK2, [['ROCKSTAR GAMES · PRESS RELEASE, 2011', 36, CREAM, 2]], { r: 6, ring: 'rgba(251,240,234,.5)' });
    P.stG = buildStamp(['FIRST 3D GTA'], 84, 520, RED);
    P.qB = buildStrip('“It wasn’t the first 3-D ‘sandbox’ game…”', 820, 54, 33, { hot: ['wasn’t'] });
    P.cS = cardPiece(560, 66, INK2, [['THE STRONG MUSEUM · HALL OF FAME', 36, CREAM, 2]], { r: 6, ring: 'rgba(251,240,234,.5)' });
    P.qM = buildStrip('“first of its kind to achieve massive mainstream popularity”', 760, 46, 45);
    P.stM = buildStamp([['3D OPEN WORLD', 58], ['FIRST TO GO MASSIVE', 58]], 58, 640, RED);
    P.hof = cardPiece(410, 236, '#2d3a63', [['WORLD VIDEO GAME', 40, CREAM, -74], ['HALL OF FAME', 56, HOT, -20], ['INDUCTED 2016', 40, CREAM, 36], ['THE STRONG MUSEUM', 36, '#c9d4ef', 84]], { r: 10, ring: HOT });
    P.math = cardPiece(230, 62, INK2, [['OUR MATH', 36, HOT, 2]], { r: 6, ring: 'rgba(255,207,51,.6)' });
    P.cal = cardPiece(470, 200, CREAM, [['2001 → 2026', 76, INK, -36], ['25 YEARS', 54, RED, 46]], { r: 8, ring: TEAL });
    P.g6 = cardPiece(470, 150, RED, [['GTA 6', 70, CREAM, -26], ['NOV 19, 2026', 40, CREAM, 40]], { r: 10, ring: 'rgba(255,240,234,.9)' });
    P.a3 = cardPiece(300, 150, CREAM, [['GTA 3', 68, INK, -14], ['2001', 36, TEAL, 46]], { r: 12, ring: TEAL });
    P.a6 = cardPiece(300, 150, CREAM, [['GTA 6', 68, INK, -14], ['2026', 36, TEAL, 46]], { r: 12, ring: TEAL });
    var tp3 = jag(311, 1100, 10), bt3 = jag(312, 1100, 10);
    P.sweepK = piece([0, -20, 1100, 1580], function (g) { g.beginPath(); g.moveTo(0, tp3[0][1]); tp3.forEach(function (p) { g.lineTo(p[0], p[1]); }); for (var i = bt3.length - 1; i >= 0; i--) g.lineTo(bt3[i][0], 1560 + bt3[i][1]); g.closePath(); }, MAPC, { sx: 0, sy: 10, blur: 20, ps: .6, extra: function (g) { g.strokeStyle = 'rgba(59,65,82,.35)'; g.lineWidth = 26; for (var x = 120; x < 1100; x += 250) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 1560); g.stroke(); } for (var y = 120; y < 1560; y += 250) { g.beginPath(); g.moveTo(0, y); g.lineTo(1100, y); g.stroke(); } } });
  }

  /* =====================================================================================================
     TIME AND STATE
     ===================================================================================================== */
  var T = {}, LIVE2 = { bg: true, clip: true };
  function tq(t) { return (Math.floor(t * 30) + .5) / 30; }
  function stepv(t, v0, L) { var v = v0; for (var i = 0; i < (L || []).length; i++) { var s = L[i]; if (t < s[0]) break; v = lerp(v, s[1], eio(seg(t, s[0], s[0] + (s[2] || .5)))); } return v; }
  function taped(g, pc, x, y, rot0, tin, tout, t, o) {
    o = o || {}; var od = o.od || .4; if (t < tin - .02 || t > tout + od + .05) return;
    var k = cd(t, tin, o.w || 14), ko = eio(seg(t, tout, tout + od)), s = (o.s || 1) * (o.slam ? lerp(1.4, 1, eo(seg(t, tin, tin + .14))) * kn(t, tin + .12, .05) : 1) * (o.kick ? kn(t, o.kick, .08) : 1);
    var nr = NOREC; NOREC = nr || k < .97 || ko > 0 || (o.slam && t < tin + .16);
    g.save(); g.globalAlpha *= fin(t, tin, .06); g.translate(x + (o.dir || 1) * 1100 * ko + (1 - k) * (o.fromX || 0), y - 200 * ko + (1 - k) * (o.fromY == null ? -120 : o.fromY)); g.rotate(rot0 + (o.dir || 1) * .5 * ko + .2 * (1 - k)); g.scale(s, s);
    putW(g, pc, 0, 0);
    if (o.draw) o.draw(g, k, ko);
    if (o.tape !== false) tape(g, 0, -pc.h / 2 + 34, 90, 26, .05);
    g.restore(); NOREC = nr;
  }

  /* ---------- the prop layer (screen space, clipped to the rail) ---------- */
  function props(g, t) {
    /* why: a rosette asks the question, pinned over the skyline */
    taped(g, P.ros, 770, 690, .08 + .03 * osc(t, 5, 1), T.ros, T.rosO, t, { fromY: -260, tape: false, kick: T.rosK });
    /* "wasn't": the rosette comes back and tears in half in the pause after "world." */
    if (t >= T.ros2 - .02 && t < T.rip + .8) {
      var rk = cd(t, T.ros2, 13), tk = eio(seg(t, T.rip, T.rip + .7)), nr2 = NOREC; NOREC = nr2 || rk < .97 || t >= T.rip;
      [-1, 1].forEach(function (sd) {
        g.save(); g.globalAlpha *= fin(t, T.ros2, .06) * (1 - seg(t, T.rip + .45, T.rip + .75));
        g.translate(770 + sd * 150 * tk, 1010 - (1 - rk) * 260 + 260 * tk * tk); g.rotate(.06 + sd * .6 * tk);
        g.beginPath(); var rj = mulberry(77); g.moveTo(0, -140); for (var yy = -140; yy <= 270; yy += 18) g.lineTo((rj() - .5) * 14, yy); g.lineTo(sd * 200, 270); g.lineTo(sd * 200, -140); g.closePath(); g.clip();
        putW(g, P.ros, 0, 0); g.restore();
      });
      NOREC = nr2;
    }
    /* 1997: the year card and its owner, taped onto the map's corner */
    taped(g, P.y97, 290, 650, -.04, T.y97, T.y97O, t, { slam: true, tape: true, dir: -1 });
    taped(g, P.tx, 290, 790, -.04, T.y97 + .2, T.y97O, t, { fromY: 30, tape: false, dir: -1 });
    /* the camera looks straight down: a paper camera above the map, a dashed sightline */
    if (t >= T.camI - .02 && t < T.camO + .45) {
      var ck = cd(t, T.camI, 12), co = eio(seg(t, T.camO, T.camO + .4)), nr = NOREC; NOREC = nr || ck < .97 || co > 0;
      g.save(); g.globalAlpha *= fin(t, T.camI, .08) * (1 - co); g.translate(730, 600 - (1 - ck) * 200 - co * 300);
      rr(g, -70, -40, 140, 80, 10); g.fillStyle = INK2; g.fill(); g.strokeStyle = 'rgba(251,240,234,.8)'; g.lineWidth = 3; g.stroke();
      rr(g, -40, -60, 50, 22, 5); g.fillStyle = INK2; g.fill(); g.stroke();
      g.beginPath(); g.arc(0, 30, 30, 0, TAU); g.fillStyle = '#9aa9c4'; g.fill(); g.stroke(); g.beginPath(); g.arc(0, 30, 16, 0, TAU); g.fillStyle = INK2; g.fill();
      g.setLineDash([14, 12]); g.lineDashOffset = -t * 60; g.strokeStyle = HOT; g.lineWidth = 6; g.beginPath(); g.moveTo(0, 70); g.lineTo(0, 70 + 260 * eo(seg(t, T.camI + .15, T.camI + .6))); g.stroke(); g.setLineDash([]);
      var ay = 70 + 260 * eo(seg(t, T.camI + .15, T.camI + .6)); g.fillStyle = HOT; g.beginPath(); g.moveTo(-18, ay - 6); g.lineTo(18, ay - 6); g.lineTo(0, ay + 22); g.closePath(); g.fill();
      g.restore(); NOREC = nr;
    }
    taped(g, P.top, 510, 1300, .03, T.top, T.y01 - .1, t, { fromX: -200, fromY: 0, dir: -1 });
    /* 2001: the year card and its owner */
    taped(g, P.y01, 290, 1200, -.04, T.y01, T.y01O, t, { slam: true, tape: true, dir: -1 });
    taped(g, P.rsg, 290, 1340, -.04, T.y01 + .2, T.y01O, t, { fromY: 30, tape: false, dir: -1 });
    /* Rockstar's own sentence, then the hero stamp on the city */
    stripAt(g, P.qR, 510, 620, -.02, T.qR, T.qRO, t, { from: -100 });
    taped(g, P.cR, 510, 760, .01, T.qR + .25, T.qRO, t, { fromY: 30, tape: false, dir: -1 });
    taped(g, P.stG, 510, 1205, -.07, T.stG, T.stGO, t, { slam: true, tape: false, dir: 1 });
    if (t >= T.stG && t < T.stG + .5) KIT.impact(g, 510, 1205, t - T.stG, 1.3, RED);
    /* the dip: the museum's sentence, the stamp's claim scoped */
    stripAt(g, P.qB, 510, 640, .02, T.qB, T.qBO, t, { from: 100, dir: 1 });
    taped(g, P.cS, 510, 790, -.01, T.qB + .25, T.qBO, t, { fromY: 30, tape: false, dir: 1 });
    /* the real first: the museum's words, the crowd, the hero stamp */
    stripAt(g, P.qM, 510, 620, -.015, T.qM, T.qMO, t, { from: -100 });
    taped(g, P.cS, 510, 760, .01, T.qM + .25, T.qMO, t, { fromY: 30, tape: false, dir: -1 });
    taped(g, P.stM, 510, 985, -.05, T.stM, T.stMO, t, { slam: true, tape: false, dir: 1 });
    if (t >= T.stM && t < T.stM + .5) KIT.impact(g, 510, 985, t - T.stM, 1.4, RED);
    /* the Hall of Fame plaque, below the credit chip */
    taped(g, P.hof, 320, 650, -.03, T.hof, T.hofO, t, { fromY: -300, kick: T.hofK });
    /* a model: the museum chip (from the line before) stays over the traced copies until "worlds." */
    /* 25 years: the calendar card, then GTA 6's plate with its date and owner */
    taped(g, P.cal, 510, 960, -.03, T.cal, T.calO, t, { slam: true, dir: -1 });
    taped(g, P.math, 640, 1080, .04, T.cal + .05, T.calO, t, { fromY: 30, tape: false, dir: -1 });
    taped(g, P.g6, 510, 1200, .02, T.g6, T.g6O, t, { fromY: 200, kick: T.g6K });
    /* end: two identical answers, neither highlighted */
    taped(g, P.a3, 335, 690, -.03 + .02 * osc(t, 9, 0), T.a3, T.seamC, t, { slam: true, tape: false, dir: -1 });
    taped(g, P.a6, 685, 690, .03 + .02 * osc(t, 9, 2), T.a6, T.seamC, t, { slam: true, tape: false, dir: 1 });
  }

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
        if (cur) { g.fillStyle = RED; g.fillRect(x - 6, y + cpx * .06, ws[i] + 12, cpx * .12); }
        g.fillStyle = cur ? RED : INK; g.fillText(up[i], x, y); x += ws[i] + gap;
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
  /* the loop: from the seam on, the picture is the hook's run-up (t - DUR), so the last frame leads into frame 0 */
  function sceneT(t) { return t >= T.seamC ? t - DUR : t; }
  function frame(g, t) {
    g.setTransform(1, 0, 0, 1, 0, 0);
    stage(g);
    var st = sceneT(t);
    if (LIVE2.bg) { world(g, st); vignette(g); }
    g.save(); railClip(g); props(g, st); g.restore();
    if (POSTERMODE) captions(g, .05); else if (LIVE.text) captions(g, t);
    g.save(); sweep(g, t, T.seamC, P.sweepK, .17); g.restore();
    if (LIVE.grain && NOISE && LIVE2.bg) { g.globalAlpha = .05; g.globalCompositeOperation = 'overlay'; var o = Math.floor(t * 24) * 37 % 256; g.fillStyle = g.createPattern(NOISE, 'repeat'); g.translate(-o, -o); g.fillRect(o, o, W, H); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }
  }

  function TEXTS(t) {
    var o = [];
    function Tx(id, text, a, b) { if (t >= a && t < b) o.push({ id: id, text: text, x0: 0, y0: 0, x1: 0, y1: 0 }); }
    Tx('ros', 'FIRST?', T.ros + .2, T.rosO); Tx('ros2', 'FIRST?', T.ros2 + .2, T.rip);
    Tx('y97', '1997', T.y97 + .16, T.y97O); Tx('y97b', 'FIRST GTA · PC', T.y97 + .16, T.y97O); Tx('tx', 'TIME EXTENSION', T.y97 + .45, T.y97O);
    Tx('top', 'VIEW: STRAIGHT DOWN', T.top + .2, T.y01 - .1);
    Tx('y01', '2001', T.y01 + .16, T.y01O); Tx('y01b', 'GTA 3 · PS2', T.y01 + .16, T.y01O); Tx('rsg', 'ROCKSTAR GAMES', T.y01 + .45, T.y01O);
    Tx('qR', '“first three-dimensional, open-world Grand Theft Auto title”', T.qR + .2, T.qRO); Tx('cR', 'ROCKSTAR GAMES · PRESS RELEASE, 2011', T.qR + .45, T.qRO);
    Tx('stG', 'FIRST 3D GTA', T.stG + .16, T.stGO);
    Tx('qB', '“It wasn’t the first 3-D ‘sandbox’ game…”', T.qB + .2, T.qBO); Tx('cS1', 'THE STRONG MUSEUM · HALL OF FAME', T.qB + .45, T.qBO);
    Tx('qM', '“first of its kind to achieve massive mainstream popularity”', T.qM + .2, T.qMO); Tx('cS2', 'THE STRONG MUSEUM · HALL OF FAME', T.qM + .45, T.qMO);
    Tx('stM', '3D OPEN WORLD', T.stM + .16, T.stMO); Tx('stM2', 'FIRST TO GO MASSIVE', T.stM + .16, T.stMO);
    Tx('hof', 'WORLD VIDEO GAME HALL OF FAME', T.hof + .25, T.hofO); Tx('hof3', 'INDUCTED 2016', T.hof + .25, T.hofO); Tx('hof2', 'THE STRONG MUSEUM', T.hof + .25, T.hofO);
    Tx('cal', '2001 → 2026', T.cal + .16, T.calO); Tx('cal2', '25 YEARS', T.cal + .16, T.calO); Tx('math', 'OUR MATH', T.cal + .3, T.calO);
    Tx('g6', 'GTA 6', T.g6 + .25, T.g6O); Tx('g6b', 'NOV 19, 2026', T.g6 + .25, T.g6O);
    Tx('a3', 'GTA 3 2001', T.a3 + .14, T.seamC); Tx('a6', 'GTA 6 2026', T.a6 + .14, T.seamC);
    return o;
  }

  /* ---------- times and sound events, all from the voice ---------- */
  function initTimes() {
    T.seamC = DUR - .45; T.loopCap = DUR - .15;
    function F(id, t, type, gain) { GT[id] = t; EV.push({ t: t, type: type, g: gain == null ? 1 : gain, id: id }); return t; }
    /* hook: frame 0 is the flat 1997-style map from straight above; from .1 s the camera tips and the city stands up, middle out, a soft tick each */
    T.up0 = .1; T.up1 = 1.15;
    G('h0', .02, 'swish', .1, .8);
    BLD.slice().sort(function (a, b) { return a.o - b.o; }).forEach(function (b, i) { if (i % 3) return; F('u' + i, T.up0 + b.o * (T.up1 - T.up0 - .3) + .05, 'tick', .3); });
    /* why: the rosette asks on "why" and leaves before the city folds flat */
    T.ros = at('why', 'why') - .05; T.rosK = G('rosS', after('why'), 'pin', .35, 1.2);
    /* gta1: the camera rises straight up, the buildings fold flat into a map; 1997 slams on "1997" */
    T.flat0 = start('gta1') - .1; T.flat1 = T.flat0 + 1.2; G('upS', T.flat0, 'swish', .3, 1.4);
    T.rosO = T.flat0 - .15;
    T.y97 = at('gta1', '1997') - .05; G('y97S', after('gta1'), 'thock', .45, 1.6);
    /* above: the paper camera looks straight down; the view chip */
    T.camI = start('above') - .05; T.top = start('above') - .2; G('topS', after('above'), 'pin', .4, 1.2);
    /* gta3: in the silence after "went 3D." the camera swoops to the street and the buildings stand back up, middle out, a tick each, loud enough to hear */
    T.y97O = start('gta3') - .1; T.camO = start('gta3') - .1;
    T.trem0 = at('gta3', 'gta') - .05; T.trem1 = lastw('gta3');
    T.rise0 = after('gta3') - .1; T.rise1 = T.rise0 + .7; G('dnS', T.rise0, 'swish', .2, 1.4);
    BLD.slice().sort(function (a, b) { return a.o - b.o; }).forEach(function (b, i) { if (i % 3) return; F('b' + i, T.rise0 + b.o * (T.rise1 - T.rise0 - .3) + .05, 'tick', .15); });
    T.y01 = at('gta3', '2001') - .05;
    /* the FIRST 3D GTA stamp lands at the end of that pause, before "Rockstar"; Rockstar's sentence with it, both gone on "But" */
    T.stG = G('stG', T.rise1, 'stamp', .3, 2); T.y01O = T.stG - .1;
    /* Rockstar's strip lands as the buildings finish standing (not over the flat map), peels on "But" */
    T.qRO = start('but') + .08; T.stGO = start('but') - .05;
    T.qR = Math.min(T.rise1 - .1, T.qRO - .2 - 5.15); G('qRS', T.qR + .05, 'snap', .3, 1);
    /* but: the city dims; the museum's sentence alone, WASN'T in red; the FIRST? rosette comes back on "wasn't" and tears in the pause */
    T.qB = start('but') - .12; T.dip0 = start('but'); G('qBS', T.qB + .1, 'snap', .3, 1);
    T.ros2 = at('but', 'wasnt') - .05; T.rip = G('rip', after('but') - .05, 'tear', .3, 2.4);
    T.qBO = start('real') - .02;
    /* real: the museum's line replaces it on "real"; people fill the sidewalks on "massive", a denser second wave floods roads and park in the pause after "popularity", then the hero stamp */
    T.dip1 = start('real') + .9; T.qM = start('real') + .02; G('qMS', T.qM + .1, 'snap', .3, 1);
    T.crowd1 = at('real', 'massive') - .05; T.crowd = after('real') - .12;
    for (var i = 0; i < 8; i++) F('cr' + i, T.crowd + .04 + i * .065, 'tick', .55);
    T.stM = G('stM', T.crowd + .6, 'stamp', .2, 2.2);
    /* hof: the plaque drops */
    /* hof: crowd and stamp hold clean ≥ 1.2 s, then the plaque lands top left and the museum strip peels */
    T.stMO = at('model', 'model') + .35; T.hof = Math.max(T.stM + 1.25, at('hof', 'hall') - .15); T.hofK = G('hofS', T.hof + .2, 'thock', .4, 1.4);
    T.qMO = Math.max(T.hof + .25, T.qM + .2 + 5.02);
    /* model: the camera pulls back; four traced copies of the board draw on and fill in */
    T.hofO = lastw('model') + .2; T.crowdO = start('model') + .2;
    T.cp0 = at('model', 'model') - .1; G('cpS', T.cp0, 'swish', .3, 1.2);
    /* no "model" strip (round 2); the plaque (THE STRONG MUSEUM) stays through the line and leaves after "worlds." */
    /* gta6: 2001 → 2026 (our math) on "later"; GTA 6's plate rises on "GTA" */
    T.cpO = start('gta6') - .1;
    T.cal = start('gta6') + .1; G('calS', T.cal + .1, 'thock', .35, 1.4);
    T.g6 = start('gta6') + .2; T.g6K = G('g6S', after('gta6'), 'thock', .45, 1.6);
    /* end: two identical tags, on the first "GTA" */
    T.calO = start('end') - .2; T.g6O = start('end') + .02; G('g6x', T.g6O, 'swish', .25, 1);
    /* the GTA 6 plate peels before the vote, so neither answer is highlighted */
    T.a3 = at('end', 'gta') - .12; T.a6 = T.a3 + .14; F('tA', T.a3 + .12, 'slap', .5); F('tB', T.a6 + .12, 'slap', .5);
    G('seam', T.seamC - .12, 'swish', .3, 1.8);
    /* camera keys: [time, value, duration] */
    T.PIT = [[T.up0, 30, 1.05], [T.flat0, 89.5, 1.2], [T.rise0, 24, 1.1], [T.cp0, 50, 1.0], [start('gta6'), 32, .8], [T.seamC - .6, 30, .5]];
    T.DIS = [[T.up0, 1420, 1.4], [2.4, 1180, 2.6], [T.flat0, 1720, 1.2], [start('gta3'), 1540, 3.8], [T.rise0, 1350, 1.1], [T.dip0, 1230, 2.6], [T.crowd1 - .3, 1300, 1.0], [T.cp0, 3000, 1.0], [start('gta6'), 1500, .8], [T.seamC - .6, 1520, .5]];
    T.YAW = [[T.up0, -.25, 1.4], [2.4, -.1, 2.6], [T.flat0, 0, 1.2], [start('gta3'), .3, 3.8], [T.rise0, -.3, 1.1], [T.dip0, -.22, 2.6], [T.crowd1 - .3, -.12, 1.0], [T.cp0, 0, 1.0], [start('gta6'), -.25, .8], [T.seamC - .6, -.3, .5]];
    T.CY = [[T.up0, 1010, 1.2], [T.flat0, 1020, 1.2], [T.rise0, 1060, 1.1], [T.cp0, 1040, 1.0], [start('gta6'), 1000, .8], [T.seamC - .6, 1010, .5]];
    STRESS = [['hook', 'invent'], ['why', 'credit'], ['gta3', '3d'], ['but', 'wasnt'], ['real', 'massive'], ['model', 'model'], ['end', 'leap']].map(function (p) { return at(p[0], p[1]); });
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
    var TRIM = window.SFX_TRIM || { stM: -6.5, stG: -6.2, y97S: -7.8, topS: -8.3, rosS: -10, upS: -7.5, seam: -8.5, tA: -7, tB: -7, dnS: -17, qRS: -8, qBS: -7, rip: -14 };
    var TYPE_DB = window.SFX_TYPE_DB || { stamp: -20, slam: -6, crack: -14, click: -10.5, swish: -17.5, tear: -24, pop: -29.5, clank: -16, thock: -24.5, slap: -14, pin: -19.5, riffle: -16, snap: -24.5, tick: -20 };
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

  window.FILM = { bare: function () { ctx.setTransform(1, 0, 0, 1, 0, 0); stage(ctx); }, W: W, H: H, DUR: DUR, POSTER: 0, SLUG: 'gta-firsts', SHOTS: [], init: init, render: render, frame: frame, LIVE: LIVE, LIVE2: LIVE2, T: T, GT: GT };
  var _bt = buildTextures; buildTextures = function () { _bt(); EV.length = 0; initTimes(); window.FILM.POSTER = Math.round(Math.min(T.stM + .6, T.stMO - .1) * 30) / 30 + 1 / 60;
    window.FILM.SHOTS = [{ id: 'hook', name: 'Didn\'t invent', t0: 0, t1: start('gta1') }, { id: 'y97', name: '1997, from above', t0: start('gta1'), t1: start('gta3') }, { id: 'y01', name: '2001, 3D', t0: start('gta3'), t1: start('but') }, { id: 'dip', name: 'Not the first', t0: start('but'), t1: start('real') }, { id: 'real', name: 'Massive', t0: start('real'), t1: start('model') }, { id: 'model', name: 'A model', t0: start('model'), t1: start('gta6') }, { id: 'gta6', name: '25 years', t0: start('gta6'), t1: DUR }]; };

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
  window.BOARD_SCAN = function (step) {
    var out = [];
    for (var t = 0; t <= DUR + 1e-6; t += step || 1 / 30) {
      var st = sceneT(t); setCam(camAt(st)); var xs = [], ys = [];
      function add(x, y, z) { var q = proj(x, y, z); xs.push(q[0]); ys.push(q[1]); }
      [[-560, -560], [560, -560], [560, 560], [-560, 560]].forEach(function (c) { add(c[0], c[1], 0); });
      BLD.forEach(function (b) { var h = b.h * hsAt(b, st); [[b.x0, b.y0], [b.x1, b.y0], [b.x1, b.y1], [b.x0, b.y1]].forEach(function (c) { add(c[0], c[1], h); }); });
      var gk = seg(st, T.cp0, T.cp0 + 1.0) * (1 - seg(st, T.cpO, T.cpO + .4));
      if (gk > 0) [[-830, 0], [830, 0], [0, 860], [0, -800]].forEach(function (o) { [[-560, -560], [560, -560], [560, 560], [-560, 560]].forEach(function (c) { add(o[0] + c[0] * .45, o[1] + c[1] * .45, 0); }); });
      out.push([Math.round(t * 100) / 100, Math.round(Math.min.apply(null, xs)), Math.round(Math.max.apply(null, xs)), Math.round(Math.min.apply(null, ys)), Math.round(Math.max.apply(null, ys))]);
    }
    return out;
  };
  window.DUR = DUR; window.EV = EV; window.TEXTS = TEXTS; window.SCORE = SCORE; window.READY = false;
  window.render = function (t, s, sh, fps) { render(t, s, sh, fps); };
})();
