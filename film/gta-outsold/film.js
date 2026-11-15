/* "Which game outsold GTA 5? Guess.": Delta, pillar 4 (gaming-wide hook that ends on GTA 6).
   A vertical film written in code, narrated first and cut to the voice: every visual beat is keyed to a word time from
   vo/vo.js (window.VO) with at(id, word). Pure function of t. Contract: window.FILM, DUR, render(t), READY, EV, TEXTS(t),
   SCORE(ctx). GTA V "nearly 235 million units sold to date" (Take-Two investor presentation, Nov 2026; Take-Two counts
   units sold-in); Minecraft "425M+ copies sold" (Xbox CEO on X, Sept 26 2026); The Tetris Company "over 520 million"
   adds up every Tetris release since 1984; Mario Kart 8 Deluxe 72M, Wii Sports 82.9M (Nintendo IR). Derived: over 190M more.
   GTA VI November 19, 2026. The set is a hand-cut paper sales floor; the hero is a tower of plain paper game cases per
   game (native move: towers build case by case while the chart rescales). Engine from film/gta-stars. No logos, box art,
   falling pieces, blocks, footage or music. */
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
     THE SET: a hand-cut paper sales floor. A plum wall with a low paper sun and slow rays bleeds the full frame,
     faint pencil lines mark every 100 million up the wall, a kraft floor runs under the towers. Every game is a
     tower of plain paper cases (no art: a blank label strip on each spine) with its name on a cream plate in our
     own type. No logos, no box art, no falling pieces, no blocks, no footage, no music.
     ===================================================================================================== */
  var FLOOR = 1400, KM = 1, PADC = '#f4ead6', INK2 = '#2a1850', RED = '#e0283c';
  var COLS = { g5: ['#19d3c5', '#0f8f86'], mc: ['#ff8a3d', '#c45f22'], tt: ['#ff4fa3', '#b83279'], mk: ['#c9b6ff', '#8f7bd1'], ws: ['#a9bdd6', '#7187a3'] };
  var TW = { g5: { M: 235, N: 12, seed: 3 }, mc: { M: 425, N: 21, seed: 11 }, tt: { M: 520, N: 13, seed: 23 }, mk: { M: 72, N: 4, seed: 31 }, ws: { M: 82.9, N: 4, seed: 41 } };
  var FANC = ['#ff4fa3', '#f4ead6', '#19d3c5', '#ff8a3d', '#c9b6ff', '#ffc83d', '#a9bdd6', '#ff4fa3', '#f4ead6', '#19d3c5', '#ff8a3d', '#c9b6ff', '#ffc83d'];

  function casePiece(c) {
    return piece([0, 0, 240, 40], function (g) { rr(g, 0, 0, 240, 40, 4); }, c[0], { ps: 1.3, sx: 0, sy: 3, blur: 4, edge: 1.6, extra: function (g) {
      g.fillStyle = c[1]; g.fillRect(0, 31, 240, 9);
      g.fillStyle = 'rgba(255,255,255,.22)'; g.fillRect(0, 0, 240, 4);
      g.fillStyle = 'rgba(251,240,234,.88)'; rr(g, 78, 10, 84, 15, 3); g.fill();
      g.fillStyle = 'rgba(29,18,51,.18)'; g.fillRect(88, 15, 50, 2.5); g.fillRect(88, 20, 34, 2.5);
      g.fillStyle = 'rgba(29,18,51,.25)'; g.fillRect(14, 6, 3, 24); g.fillRect(223, 6, 3, 24);
    } });
  }
  /* a plain case seen from the front: a name strip in our type, never box art */
  function fanPiece(col, i) {
    var w = 128, h = 176, rec = [], dark = col === '#f4ead6' || col === '#ffc83d' || col === '#a9bdd6' || col === '#c9b6ff';
    var pc = piece([-w / 2, -h / 2, w / 2, h / 2], function (g) { rr(g, -w / 2, -h / 2, w, h, 7); }, col, { ps: 1.4, sx: 4, sy: 8, blur: 9, extra: function (g) {
      g.fillStyle = 'rgba(29,18,51,.2)'; g.fillRect(-w / 2, -h / 2, 12, h);
      g.fillStyle = dark ? INK2 : PADC; rr(g, -w / 2 + 18, -18, w - 30, 46, 4); g.fill();
      cond(g, 'condensed'); font(g, 36, 900); ls(g, 1); g.fillStyle = dark ? CREAM : INK; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('TETRIS', 6, 6); var mm = g.measureText('TETRIS'); rec.push([6 - mm.width / 2, 6 - 20, 6 + mm.width / 2, 6 + 16, 'TETRIS']); unst(g);
      g.fillStyle = 'rgba(29,18,51,.12)'; for (var k = 0; k < 3; k++) g.fillRect(-w / 2 + 26, 46 + k * 12, 60 + (i * 13 + k * 17) % 30, 5);
      g.fillStyle = 'rgba(255,255,255,.2)'; g.fillRect(-w / 2 + 12, -h / 2, w - 12, 5);
    } });
    return wordsOf(pc, rec);
  }
  function plate(text, w, px, bg, fg, ring) { return cardPiece(w, 80, bg || CREAM, [[text, px || 48, fg || INK, 3]], { r: 8, ring: ring || 'rgba(29,18,51,.25)' }); }

  function buildTextures() { GRAIN = buildGrain(); buildSet(); }
  function buildSet() {
    P.case = {}; Object.keys(COLS).forEach(function (k) { P.case[k] = casePiece(COLS[k]); });
    P.fan = FANC.map(function (c, i) { return fanPiece(c, i); });
    P.pl = { g5: plate('GTA 5', 180, 52), mc: plate('MINECRAFT', 232, 46), tt: plate('TETRIS', 200, 48) };
    P.pl6 = plate('GTA 6', 210, 56, HOT, CREAM, 'rgba(255,240,234,.9)');
    P.cnt = cardPiece(420, 150, NEWS, [], { r: 8, ring: 'rgba(29,18,51,.25)' });
    P.cnt2 = cardPiece(430, 150, NEWS, [], { r: 8, ring: 'rgba(29,18,51,.25)' });
    P.ttTag = cardPiece(380, 176, CREAM, [['TAKE-TWO COUNT', 48, INK, -50], ['UNITS SOLD-IN', 42, INK2, 4], ['NOV 2026', 42, INK2, 54]], { r: 8, ring: TEAL });
    P.g5s = cardPiece(250, 204, CREAM, [['NEARLY 235M', 46, INK, -66], ['SOLD-IN', 38, HOT, -16], ['TAKE-TWO', 38, INK2, 28], ['NOV 2026', 38, INK2, 72]], { r: 8, ring: TEAL });
    P.mk = cardPiece(226, 240, CREAM, [['MARIO KART', 40, INK, -82], ['8 DELUXE', 40, INK, -38], ['72M', 50, INK, 10], ['NINTENDO', 50, INK2, 68]], { r: 8, ring: 'rgba(29,18,51,.3)' });
    P.ws = cardPiece(226, 196, CREAM, [['WII SPORTS', 40, INK, -58], ['82.9M', 50, INK, -6], ['NINTENDO', 50, INK2, 52]], { r: 8, ring: 'rgba(29,18,51,.3)' });
    P.no = buildStamp(['NO'], 66, 120, RED);
    P.ttg = cardPiece(470, 200, CREAM, [['TETRIS', 62, INK, -60], ['520M+ CLAIMED', 52, HOT, 4], ['THE TETRIS COMPANY', 50, INK2, 64]], { r: 8, ring: HOT });
    P.every = cardPiece(500, 140, ORG, [['EVERY TETRIS GAME,', 50, INK, -28], ['ADDED UP', 50, INK, 30]], { r: 8, ring: 'rgba(29,18,51,.3)' });
    P.y84 = cardPiece(220, 92, TEAL, [['1984 →', 60, INK, 3]], { r: 8, ring: 'rgba(29,18,51,.3)' });
    P.stMC = buildStamp(['#1 SINGLE', 'GAME'], 60, 260, HOT);
    P.gwr = cardPiece(380, 120, INK2, [['GUINNESS WORLD', 50, CREAM, -26], ['RECORDS', 50, CREAM, 30]], { r: 6, ring: 'rgba(251,240,234,.5)' });
    P.nin = cardPiece(264, 196, CREAM, [['MARIO KART', 44, INK, -58], ['+ WII SPORTS', 44, INK, -10]], { r: 8, ring: HOT });
    P.stS = buildStamp(['STILL SHORT'], 54, 300, HOT);
    P.xbox = cardPiece(310, 120, INK2, [['XBOX CEO · X POST', 42, CREAM, -24], ['SEPT 2026', 40, CREAM, 26]], { r: 8, ring: 'rgba(251,240,234,.5)' });
    P.own = cardPiece(300, 124, TEAL, [['EACH COMPANY’S', 42, INK, -24], ['OWN COUNT', 44, INK, 28]], { r: 8, ring: 'rgba(29,18,51,.3)' });
    P.cal = calPiece(HOT, [['NOV', 62, HOT, -112], ['19', 190, INK, 0], ['2026', 72, INK, 122]], 403);
    P.calB = calPiece(HOT, [['NOV', 62, HOT, -112]], 403);
    P.base6 = piece([-120, -20, 120, 20], function (g) { rr(g, -120, -20, 240, 40, 5); }, PADC, { ps: 1.3, sx: 0, sy: 5, blur: 6, extra: function (g) { g.fillStyle = 'rgba(29,18,51,.15)'; g.fillRect(-120, 10, 240, 10); } });
    P.yes = cardPiece(190, 120, CREAM, [['YES', 70, INK, 4]], { r: 12, ring: TEAL });
    P.no2 = cardPiece(190, 120, CREAM, [['NO', 70, INK, 4]], { r: 12, ring: TEAL });
    var tp3 = jag(311, 1100, 10), bt3 = jag(312, 1100, 10);
    P.sweepK = piece([0, -20, 1100, 1580], function (g) { g.beginPath(); g.moveTo(0, tp3[0][1]); tp3.forEach(function (p) { g.lineTo(p[0], p[1]); }); for (var i = bt3.length - 1; i >= 0; i--) g.lineTo(bt3[i][0], 1560 + bt3[i][1]); g.closePath(); }, KRAFT, { sx: 0, sy: 10, blur: 20, ps: .6, extra: function (g) { g.strokeStyle = 'rgba(60,30,10,.18)'; g.lineWidth = 3; for (var x = 30; x < 1100; x += 90) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x + 20, 1560); g.stroke(); } } });
    P.wall = buildWall();
  }
  /* the static wall: plum paper, a halftone glow, the kraft floor; drawn once */
  function buildWall() {
    var c = mk(W, H), g = c.getContext('2d'), r = mulberry(19);
    var gr = g.createLinearGradient(0, 0, 0, FLOOR); gr.addColorStop(0, '#140a2c'); gr.addColorStop(.55, '#2b1748'); gr.addColorStop(1, '#4a1f5e'); g.fillStyle = gr; g.fillRect(0, 0, W, FLOOR);
    for (var x = 0; x < W; x += 120) { g.fillStyle = 'rgba(255,255,255,.025)'; g.fillRect(x + 60, 0, 60, FLOOR); }
    /* halftone dots warming toward the sun (texture only) */
    for (var y = 640; y < FLOOR; y += 22) for (x = 11 + ((y / 22) % 2) * 11; x < W; x += 22) { var d = Math.hypot(x - 510, y - FLOOR - 40), k = clamp(1 - d / 760, 0, 1); if (k <= 0) continue; g.fillStyle = 'rgba(255,138,61,' + (.22 * k).toFixed(3) + ')'; g.beginPath(); g.arc(x, y, 1.5 + 4.5 * k, 0, TAU); g.fill(); }
    /* floor: kraft boards with a pale front edge */
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
  function zoomAt(t) { return stepv(t, lerp(2.3, 2.0, eio(seg(t, 0, 2.9))), T.ZK); }
  function txAt(id, t) { var x0 = T.X0[id]; if (id === 'g5') x0 = lerp(400, 300, eio(seg(t, 0, 1.3))); else if (id === 'mc') x0 = lerp(770, 730, eio(seg(t, .2, 2.4))); return stepv(t, x0, T.XK[id] || []); }
  function twAt(id, t) { return stepv(t, T.W0[id], T.WK[id] || []); }
  function topY(id, t) { return FLOOR - TW[id].M * KM * zoomAt(t); }
  function fmt(n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
  /* the frame-0 tower is mid-build: 45 % of its cases on frame 0, all of them by 0.9 s; negative t is the loop's run-up */
  function g5grow(t) { return clamp(.45 + .55 * Math.pow(clamp(t / .9, 0, 1), 1.4), 0, 1); }
  function ttgrow(t) { return Math.pow(seg(t, T.tt0, T.ttL), 1.3); }
  var NIN = .26, NINW = .26;

  /* ---------- the world: wall, sun, rays, palms, height lines; it bleeds the frame (no words outside the rail) ---------- */
  function world(g, t) {
    g.drawImage(P.wall, 0, 0);
    /* the low paper sun behind the floor, with slow rays (one turn per film, so the loop is seamless) */
    g.save(); g.beginPath(); g.rect(0, 0, W, FLOOR); g.clip();
    var rot = TAU * t / DUR / 3;
    g.translate(510, FLOOR + 60);
    for (var k = 0; k < 18; k++) { var a = rot + k * TAU / 18; g.fillStyle = k % 2 ? 'rgba(255,79,163,.07)' : 'rgba(255,138,61,.08)'; g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, 1500, a, a + TAU / 36); g.closePath(); g.fill(); }
    var sg = g.createRadialGradient(0, 0, 40, 0, 0, 340); sg.addColorStop(0, 'rgba(255,200,61,.55)'); sg.addColorStop(.7, 'rgba(255,79,163,.4)'); sg.addColorStop(1, 'rgba(255,79,163,0)');
    g.fillStyle = sg; g.beginPath(); g.arc(0, 0, 340, 0, TAU); g.fill();
    g.fillStyle = 'rgba(255,170,90,.55)'; g.beginPath(); g.arc(0, 0, 230, 0, TAU); g.fill();
    for (k = 0; k < 4; k++) { g.fillStyle = 'rgba(43,23,72,.55)'; g.fillRect(-240, -200 + k * 46, 480, 10 + k * 3); }
    g.restore();
    /* a soft spotlight sweeping the wall */
    var sx = 510 + 330 * osc(t, 7, .5);
    g.save(); g.globalAlpha = .07; g.fillStyle = '#fff3c4'; g.beginPath(); g.moveTo(sx - 60, 0); g.lineTo(sx + 60, 0); g.lineTo(sx + 260, FLOOR); g.lineTo(sx - 260, FLOOR); g.closePath(); g.fill(); g.restore();
    palm(g, -40, FLOOR + 10, 1.25, t, 0); palm(g, 1120, FLOOR + 10, -1.25, t, 2);
    /* pencil height lines every 100 million; they slide as the chart rescales */
    var ra = seg(t, T.ruler, T.ruler + .4);
    if (ra > 0) {
      var Z = zoomAt(t);
      for (var m = 100; m <= 600; m += 100) {
        var y = FLOOR - m * KM * Z; if (y < 540) break;
        g.save(); g.globalAlpha = .5 * ra; g.strokeStyle = 'rgba(251,240,234,.55)'; g.lineWidth = 2; g.setLineDash([14, 12]); g.beginPath(); g.moveTo(96, y); g.lineTo(924, y); g.stroke(); g.restore();
        var la = 1 - seg(t, T.br - .3, T.br) + seg(t, T.l6 + .2, T.l6 + .5);
        if (la > 0) txt(g, m + 'M', 100, y - 24, { px: 36, col: 'rgba(251,240,234,.55)', a: ra * .9 * clamp(la, 0, 1), wt: 800 });
      }
    }
  }

  /* ---------- a tower: cases stacked from the floor; the newest one drops in ---------- */
  function drawStack(g, id, x, w, gk, t, o) {
    o = o || {}; var D = TW[id], Z = zoomAt(t), Ht = D.M * KM * Z, ch = Ht / D.N, full = clamp(gk, 0, 1) * D.N, n = Math.floor(full + 1e-6), fr = full - n;
    if (!o.noShadow) { g.save(); g.globalAlpha *= .4; g.fillStyle = '#0b0418'; g.beginPath(); g.ellipse(x + 10, FLOOR + 6, w * .62, 14, 0, 0, TAU); g.fill(); g.restore(); }
    for (var i = 0; i < D.N; i++) {
      if (i > n || (i === n && fr <= .001)) break;
      var drop = 0, a = 1;
      if (i === n) { var k = eo(fr); drop = (1 - k) * 150; a = clamp(fr * 5, 0, 1); }
      var lvl = (i + 1) / D.N, jx = (hash(i * 7.3 + D.seed) - .5) * 12 + (o.sway || 0) * lvl * lvl, jr = (hash(i * 3.1 + D.seed) - .5) * .022;
      var yb = FLOOR - i * ch - drop;
      g.save(); g.globalAlpha *= a; put(g, P.case[id], x + jx - w / 2, yb - ch, jr, w / 240, ch / 40); g.restore();
    }
  }
  function towerSway(t, a) { return sw(t, a, 16, 9, 3.5); }

  /* the sheet over the second tower: cream paper, a big ?, it flutters; it rips in two on the reveal */
  function sheetPath(g, x, w, top, t, lift) {
    var L = x - w / 2 - 14, R = x + w / 2 + 14, fl = 6 * osc(t, 11, .3) + sw(t, T.flut, 14, 10, 3) + sw(t, T.tug, 18, 12, 4);
    g.beginPath(); g.moveTo(L + fl * .3, FLOOR + 2 - lift);
    g.lineTo(L + 6, top + 40); g.quadraticCurveTo(L + 10, top - 6, x - w * .2, top - 10); g.quadraticCurveTo(x, top - 22, x + w * .2, top - 10); g.quadraticCurveTo(R - 10, top - 6, R - 6, top + 40);
    var cl = T.guess != null ? 110 * (eo(seg(t, T.guess, T.guess + .25)) - eio(seg(t, T.guess + 1.2, T.guess + 1.6))) : 0;
    g.lineTo(R + fl * .3 + cl * .25, FLOOR + 2 - lift - cl);
    for (var k = 1; k <= 8; k++) { var xx = R - (R - L) * k / 8; g.lineTo(xx + fl * .2, FLOOR + 2 - lift - cl * Math.max(0, 1 - k / 4) - 8 * Math.sin(k * 1.9 + t * 4) * (.4 + .6 * Math.abs(fl) / 14)); }
    g.closePath();
  }
  function drawSheet(g, x, w, t, side, k) {
    var Z = zoomAt(t), top = Math.max(530, FLOOR - TW.mc.M * KM * Z - 12), lift = T.tease != null ? 44 * bump(t, T.tease, .8) : 0;
    g.save();
    if (side) {
      /* one half of the torn sheet, flying away */
      var dx = side * 330 * eo(k), dy = -520 * k + 300 * k * k, rt = side * .7 * k;
      g.globalAlpha *= 1 - seg(k, .45, 1); g.translate(x + dx, (top + FLOOR) / 2 + dy); g.rotate(rt); g.translate(-x, -(top + FLOOR) / 2);
      g.beginPath(); var r = mulberry(77); g.moveTo(x, top - 40); for (var yy = top; yy < FLOOR + 20; yy += 34) g.lineTo(x + (r() - .5) * 30, yy); g.lineTo(x + side * 900, FLOOR + 40); g.lineTo(x + side * 900, top - 40); g.closePath(); g.clip();
    }
    g.save(); g.shadowColor = 'rgba(6,3,18,.5)'; g.shadowBlur = 16; g.shadowOffsetX = 6; g.shadowOffsetY = 10; sheetPath(g, x, w, top - lift, t, lift); g.fillStyle = PADC; g.fill(); g.restore();
    g.save(); sheetPath(g, x, w, top - lift, t, lift); g.clip();
    g.globalAlpha = .7; g.fillStyle = g.createPattern(GRAIN, 'repeat'); g.fillRect(x - w, top - 60, w * 2, FLOOR - top + 120); g.globalAlpha = 1;
    /* drape folds */
    for (var f = -2; f <= 2; f++) { var fx = x + f * w * .22 + 6 * osc(t, 7, f); var fg = g.createLinearGradient(fx - 22, 0, fx + 22, 0); fg.addColorStop(0, 'rgba(29,18,51,0)'); fg.addColorStop(.5, 'rgba(29,18,51,.12)'); fg.addColorStop(1, 'rgba(29,18,51,0)'); g.fillStyle = fg; g.fillRect(fx - 22, top + 30, 44, FLOOR - top); }
    g.restore();
    g.save(); sheetPath(g, x, w, top - lift, t, lift); g.strokeStyle = 'rgba(255,253,245,.9)'; g.lineWidth = 2.4; g.stroke(); g.restore();
    /* the ?: pulses on "Guess." */
    var qy = top - lift + Math.min(250, (FLOOR - top) * .3), qs = kn(t, T.guess, .16) * kn(t, T.tease, .1);
    g.save(); g.translate(x, qy); g.rotate(-.06 + .04 * osc(t, 6, 1) + sw(t, T.guess, .1, 9, 3)); g.scale(qs, qs);
    var nr = NOREC; NOREC = nr || !!side; stk(g, '?', 0, 0, 230, { col: HOT, lw: 12 }); NOREC = nr; g.restore();
    g.restore();
  }

  /* ---------- hanging tags: paper on two strings from above, swaying a little ---------- */
  function hangTag(g, pc, x, y, tin, tout, t, o) {
    o = o || {}; var od = o.od || .4; if (t < tin - .02 || t > tout + od + .05) return;
    var k = cd(t, tin, o.w || 13), ko = eio(seg(t, tout, tout + od)), dy = -(1 - k) * 260 - ko * 900, sway = .025 * osc(t, 5, x * .01) + sw(t, tin + .12, .05, 8, 3) + (o.kick ? sw(t, o.kick, .06, 9, 3) : 0);
    var nr = NOREC; NOREC = nr || k < .97 || ko > 0;
    g.save(); g.globalAlpha *= fin(t, tin, .08); g.translate(x, y + dy); g.rotate(sway + (o.rot || 0));
    var hw = pc.w / 2 - 50, hh = pc.h / 2 - 36;
    putW(g, pc, 0, 0, 0, o.s || 1);
    tape(g, -hw * .6, -pc.h / 2 + 38, 60, 22, -.25); tape(g, hw * .6, -pc.h / 2 + 38, 60, 22, .25);
    g.restore(); NOREC = nr;
  }
  /* taped paper: settles onto a face, leaves by flying off */
  function taped(g, pc, x, y, rot, tin, tout, t, o) {
    o = o || {}; var od = o.od || .4; if (t < tin - .02 || t > tout + od + .05) return;
    var k = cd(t, tin, o.w || 14), ko = eio(seg(t, tout, tout + od)), s = (o.s || 1) * (o.slam ? lerp(1.4, 1, eo(seg(t, tin, tin + .14))) * kn(t, tin + .12, .05) : 1) * (o.kick ? kn(t, o.kick, .08) : 1);
    var nr = NOREC; NOREC = nr || k < .97 || ko > 0 || (o.slam && t < tin + .16);
    g.save(); g.globalAlpha *= fin(t, tin, .06); g.translate(x + (o.dir || 1) * 1100 * ko + (1 - k) * (o.fromX || 0), y - 200 * ko + (1 - k) * (o.fromY == null ? -120 : o.fromY)); g.rotate(rot + (o.dir || 1) * .5 * ko + .2 * (1 - k)); g.scale(s, s);
    putW(g, pc, 0, 0);
    if (o.draw) o.draw(g, k, ko);
    if (o.tape !== false) tape(g, 0, -pc.h / 2 + 34, 90, 26, .05);
    g.restore(); NOREC = nr;
  }
  function counter(g, pc, x, y, v, landed, t, line2, ta, o) {
    o = o || {};
    putW(g, pc, x, y, o.rot || 0);
    g.save(); g.translate(x, y); g.rotate(o.rot || 0);
    var nr = NOREC; NOREC = nr || !landed;
    if (landed && o.pre) txt(g, o.pre, 0, -44, { px: 40, col: INK2, align: 'center', ls: 3, a: fin(t, ta, .1) });
    var s = landed ? kn(t, ta, .1) : 1; g.save(); g.translate(0, o.pre || line2 ? 14 : 0); g.scale(s, s);
    txt(g, fmt(v) + (landed && o.plus ? '+' : ''), 0, line2 && !o.pre ? -16 : 0, { px: o.px || 76, col: landed ? INK : '#7a6a8f', align: 'center', ls: 1 });
    g.restore();
    if (landed && line2) txt(g, line2, 0, 48, { px: 40, col: INK2, align: 'center', ls: 3, a: fin(t, ta, .1) });
    NOREC = nr; g.restore();
  }

  /* ---------- the prop layer (screen space, clipped to the rail) ---------- */
  function props(g, t) {
    var Z = zoomAt(t);
    var g5x = txAt('g5', t), g5w = twAt('g5', t), g5t = topY('g5', t), mcx = txAt('mc', t), mcw = twAt('mc', t), mct = topY('mc', t);
    /* the two short Nintendo towers, knocked over to the left */
    ['mk', 'ws'].forEach(function (id) {
      var tin = id === 'mk' ? T.mkIn : T.wsIn; if (t < tin || t > T.knock + 1.2) return;
      var x = T.X0[id], w = T.W0[id], kk = eo(seg(t, T.knock + (id === 'ws' ? .06 : 0), T.knock + .4)), sl = eio(seg(t, T.knock + .3, T.knock + 1));
      g.save(); g.translate(x - w / 2 - 900 * sl, FLOOR); g.rotate(-Math.PI / 2 * kk); g.translate(-(x - w / 2), -FLOOR);
      drawStack(g, id, x, w, eo(seg(t, tin, tin + .3)), t);
      g.restore();
    });
    /* GTA 5: built on frame 0, always on the floor */
    drawStack(g, 'g5', g5x, g5w, g5grow(t), t, { sway: towerSway(t, T.cntL) + towerSway(t, T.lg + .5) * .6 });
    /* both Nintendo giants stacked on GTA 5 still don't reach Minecraft (72M + 82.9M = 154.9M < 190M) */
    if (t >= T.nin - .02 && t < T.l6 + .6) {
      var no6 = eio(seg(t, T.l6, T.l6 + .45)), nw = g5w * .82;
      [['mk', 0], ['ws', 1]].forEach(function (q) {
        var t0 = q[1] ? T.ninW : T.nin, gk = seg(t, t0, t0 + (q[1] ? NINW : NIN)), base = g5t - (q[1] ? TW.mk.M * KM * Z : 0);
        if (t < t0) return;
        g.save(); g.translate(-900 * no6, base - FLOOR); drawStack(g, q[0], g5x, nw, gk, t, { noShadow: true }); g.restore();
      });
    }
    putW(g, P.pl.g5, g5x, FLOOR - 52, 0, kn(t, T.p5, .12) * kn(t, T.pk5, .08) * kn(t, T.g5k, .1));
    /* the second tower: under the sheet until the reveal, then Minecraft */
    if (t >= T.rip - .02) {
      drawStack(g, 'mc', mcx, mcw, 1, t, { sway: towerSway(t, T.rip) + towerSway(t, T.c2L) * .7 });
      putW(g, P.pl.mc, mcx, FLOOR - 52, 0, kn(t, T.rip + .05, .1));
    }
    if (t < T.rip + .6) {
      if (t < T.rip) drawSheet(g, mcx, mcw, t);
      else { var rk = seg(t, T.rip, T.rip + .6); drawSheet(g, mcx, mcw, t, -1, rk); drawSheet(g, mcx, mcw, t, 1, rk); }
    }
    /* Tetris: rises fast on "claims", then splits into a fan of single cases */
    if (t >= T.tt0 && t < T.split + .9) {
      var ttx = T.X0.tt, ttw = T.W0.tt, D = TW.tt, ch = D.M * KM * Z / D.N;
      if (t < T.split) drawStack(g, 'tt', ttx, ttw, ttgrow(t), t, { sway: towerSway(t, T.ttL) + 10 * Math.sin((t - T.wob) * 30) * bump(t, T.wob, T.split - T.wob) });
      else for (var i = 0; i < D.N; i++) {
        var u = seg(t, T.split + i * .015, T.split + i * .015 + .4); if (u >= 1) continue;
        var fp = fanPos(i), y0 = FLOOR - (i + .5) * ch, x1 = lerp(ttx, fp.x, eio(u)), y1 = lerp(y0, fp.y, eio(u)) - 160 * Math.sin(Math.PI * u);
        g.save(); g.translate(x1, y1); g.rotate(fp.r * eio(u) + 2.4 * u * (i % 2 ? 1 : -1) * (1 - u));
        if (u < .5) g.scale(ttw / 240 * (1 - u * .9), ch / 40 * (1 - 2 * u * .95)); else g.scale(1, 1);
        if (u < .5) put(g, P.case.tt, -120, -20); else { g.scale(1, 2 * (u - .5) + .02); put(g, P.fan[i], 0, 0); }
        g.restore();
      }
    }
    /* the fan of Tetris cases (every version added up) */
    if (t >= T.split && t < T.peel + .3) {
      for (var j = 0; j < TW.tt.N; j++) {
        var uj = seg(t, T.split + j * .015, T.split + j * .015 + .4); if (uj < 1) continue;
        var fq = fanPos(j), uo = seg(t, T.peel + j * .004, T.peel + j * .004 + .2), riff = sw(t, T.riff + j * .02, .05, 10, 4);
        var nr0 = NOREC; NOREC = nr0 || uo > 0;
        g.save(); g.translate(fq.x + 700 * eio(uo), fq.y + 160 * Math.sin(Math.PI * uo) - 300 * uo * uo); g.rotate(fq.r + riff + 1.2 * uo); putW(g, P.fan[j], 0, 0); g.restore(); NOREC = nr0;
      }
    }
    /* GTA 5's own count: the counter rests on top of the tower, rolling up to 235,000,000; NEARLY prints only once it lands */
    if (t >= T.cnt0 - .02 && t < T.cntO + .5) {
      var ck = cd(t, T.cnt0, 13), co = eio(seg(t, T.cntO, T.cntO + .45)), landed = t >= T.cntL, v = 235e6 * eio(seg(t, T.roll0, T.cntL));
      var nr = NOREC; NOREC = nr || ck < .97 || co > 0;
      g.save(); g.globalAlpha *= fin(t, T.cnt0, .06) * (1 - co); g.translate(0, -(1 - ck) * 300 - co * 400);
      counter(g, P.cnt, g5x, g5t - 84, landed ? 235e6 : Math.floor(v / 1e6) * 1e6, landed, t, null, T.cntL, { pre: 'NEARLY', px: 80 });
      g.restore(); NOREC = nr;
      if (landed) KIT.impact(g, g5x, g5t - 84, t - T.cntL, 1.1, CREAM);
    }
    /* the source tag clips onto the tower: Take-Two's count, sold-in, November 2026 */
    taped(g, P.ttTag, g5x, FLOOR - 250, -.03, T.tag, T.tagO, t, { fromX: -60, dir: -1 });
    if (t >= T.sold && t < T.tagO) { g.save(); g.translate(g5x - 112, FLOOR - 250 + 26); g.rotate(-.03); KIT.marker(g, 0, 0, 224, 12, seg(t, T.sold, T.sold + .3), TEAL); g.restore(); }
    if (t >= T.mark && t < T.tagO) { var mkk = seg(t, T.mark, T.mark + .3); g.save(); g.translate(g5x - 90, FLOOR - 250 + 76); g.rotate(-.03); KIT.marker(g, 0, 0, 180, 12, mkk, HOT); g.restore(); }
    /* from here GTA 5 keeps its number and owner on a hanging tag */
    hangTag(g, P.g5s, g5x, g5t + tagOff(t), T.g5s, T.seamC, t, { kick: T.lg + .45 });
    /* the 235M line: both Nintendo games stop far under it */
    var da = seg(t, T.dash, T.dash + .3) * (1 - seg(t, T.knock + .2, T.knock + .5));
    if (da > 0) { g.save(); g.globalAlpha *= da; g.strokeStyle = HOT; g.lineWidth = 5; g.setLineDash([22, 14]); g.lineDashOffset = -t * 60; g.beginPath(); g.moveTo(100, g5t); g.lineTo(lerp(100, 920, eo(seg(t, T.dash, T.dash + .4))), g5t); g.stroke(); g.restore(); }
    hangTag(g, P.mk, 192, FLOOR - TW.mk.M * KM * Z - 135, T.mkIn + .12, T.knock + .05, t, { kick: T.mkS });
    hangTag(g, P.ws, 423, FLOOR - TW.ws.M * KM * Z - 113, T.wsIn + .12, T.knock + .1, t, { kick: T.wsS, rot: .02 });
    /* the NO stamps land on the short towers themselves */
    if (t < T.knock + .02) {
      taped(g, P.no, T.X0.mk, FLOOR - 60, -.16, T.mkNo, T.knock, t, { slam: true, tape: false, dir: -1 });
      taped(g, P.no, T.X0.ws, FLOOR - 64, .12, T.wsNo, T.knock, t, { slam: true, tape: false, dir: -1 });
    }
    /* Tetris: its own claim on its tag, CLAIMED circled */
    hangTag(g, P.ttg, T.X0.tt, 680, T.ttL - .05, T.peel, t, { kick: T.split, od: .25 });
    if (t >= T.scrib && t < T.peel) KIT.scribble(g, T.X0.tt, 684, 168, 40, eo(seg(t, T.scrib, T.scrib + .4)), HOT, 6, 5);
    hangTag(g, P.every, 470, 838, T.evc, T.peel, t, { kick: T.riff, od: .25 });
    taped(g, P.y84, 470, 1002, -.06, T.y84, T.peel, t, { slam: true, dir: -1, od: .25 });
    /* the arrow runs along the fan, oldest to newest */
    if (t >= T.split + .25 && t < T.peel) KIT.arrow(g, 585, 995, 720, 1140, eo(seg(t, T.split + .25, T.split + .6)), CREAM, 9, -.3);
    /* Minecraft: the stamp, then Xbox's count on top */
    taped(g, P.stMC, mcx, 1165, -.08, T.stMC, T.lg, t, { slam: true, tape: false, dir: 1 });
    taped(g, P.gwr, mcx, 1300, 0, T.stMC + .15, T.lg, t, { tape: false, fromY: 40, dir: 1 });
    if (t >= T.stMC && t < T.stMC + .5) KIT.impact(g, mcx, 1165, t - T.stMC, 1.2, HOT);
    taped(g, P.xbox, mcx, stepv(t, 962, [[T.lg, 840, .5]]), .03, T.xb, T.nin, t, { fromY: -160 });
    if (t >= T.c2 - .02 && t < T.c2O + .5) {
      var c2k = cd(t, T.c2, 13), c2o = eio(seg(t, T.c2O, T.c2O + .45)), l2 = t >= T.c2L, v2 = 425e6 * eio(seg(t, T.roll2, T.c2L));
      var nr2 = NOREC; NOREC = nr2 || c2k < .97 || c2o > 0;
      g.save(); g.globalAlpha *= fin(t, T.c2, .06) * (1 - c2o); g.translate(0, -(1 - c2k) * 300 - c2o * 400);
      counter(g, P.cnt2, Math.min(mcx, 700), mct - 84, l2 ? 425e6 : Math.floor(v2 / 1e6) * 1e6, l2, t, 'COPIES SOLD', T.c2L, { plus: true, px: 72 });
      g.restore(); NOREC = nr2;
      if (l2) KIT.impact(g, Math.min(mcx, 700), mct - 84, t - T.c2L, 1.1, CREAM);
    }
    /* the gap: a pink bracket from GTA 5's top to Minecraft's, 190M+ MORE */
    if (t >= T.br - .02 && t < T.brO + .45) {
      var bk = eo(seg(t, T.br, T.br + .35)), bo = eio(seg(t, T.brO, T.brO + .4)), bx = g5x - g5w / 2 - 34, ya = mct, yb = g5t, sn = kn(t, T.snap, .06);
      var nr3 = NOREC; NOREC = nr3 || bk < 1 || bo > 0;
      g.save(); g.globalAlpha *= 1 - bo; g.translate(-700 * bo, 0);
      g.strokeStyle = 'rgba(251,240,234,.8)'; g.lineWidth = 4; g.setLineDash([16, 10]); g.beginPath(); g.moveTo(mcx - mcw / 2, ya); g.lineTo(lerp(mcx - mcw / 2, bx, bk), ya); g.stroke(); g.setLineDash([]);
      var ym = lerp(ya, yb, bk);
      g.lineCap = 'round'; g.lineJoin = 'round';
      [[INK, 22], [HOT, 12]].forEach(function (s) { g.strokeStyle = s[0]; g.lineWidth = s[1]; g.beginPath(); g.moveTo(bx + 26, ya); g.lineTo(bx, ya); g.lineTo(bx, ym); if (bk >= 1) g.lineTo(bx + 26, yb); g.stroke(); g.beginPath(); g.moveTo(bx, (ya + yb) / 2); g.lineTo(bx - 22 * sn, (ya + yb) / 2); g.stroke(); });
      g.restore();
      var lx = Math.max(255, bx - 150);
      g.save(); g.globalAlpha *= 1 - bo; g.translate(-700 * bo, 0);
      slam(g, '190M+', lx, (ya + yb) / 2 - 40, 100, t - T.br - .05, { col: HOT, rot: -.05, lw: 12 });
      slam(g, 'MORE', lx, (ya + yb) / 2 + 66, 84, t - T.brM, { col: CREAM, rot: -.03 });
      g.restore(); NOREC = nr3;
      if (t >= T.snap && t < T.snap + .45) KIT.impact(g, bx, (ya + yb) / 2, t - T.snap, .9, HOT);
    }
    taped(g, P.own, 245, 1305, .03, T.own, T.ownO, t, { fromX: -200, fromY: 0, dir: -1 });
    var ninY = stepv(t, 1040, [[T.l6, 1225, .5]]);
    taped(g, P.nin, 250, ninY, -.03, T.nin, T.l6 + 1.1, t, { fromX: -200, fromY: 0, dir: -1, draw: function (gg) {
      var v = 72 * seg(t, T.nin, T.nin + NIN) + 82.9 * seg(t, T.ninW, T.ninW + NINW), done = t >= T.ninW + NINW;
      txt(gg, '= ' + (done ? '154.9' : Math.floor(v)) + 'M', 0, 48, { px: 52, col: INK, align: 'center' });
    } });
    taped(g, P.stS, 262, ninY + 150, -.07, T.stS, T.l6 + 1.1, t, { slam: true, tape: false, dir: -1 });
    /* GTA 6: an empty spot on the floor, its name and its date; no tower, no number */
    if (t >= T.pl6 - .02) {
      var pk = cd(t, T.pl6, 14), px6 = 760;
      g.save(); g.globalAlpha *= fin(t, T.pl6, .06); g.translate(0, (1 - pk) * -220);
      g.save(); g.globalAlpha *= .35; g.fillStyle = '#0b0418'; g.beginPath(); g.ellipse(px6 + 8, FLOOR + 6, 150, 14, 0, 0, TAU); g.fill(); g.restore();
      put(g, P.base6, px6, FLOOR - 20);
      g.save(); g.strokeStyle = 'rgba(251,240,234,.5)'; g.lineWidth = 4; g.setLineDash([14, 12]); g.lineDashOffset = t * 30; g.beginPath(); g.moveTo(px6 - 110, FLOOR - 42); g.lineTo(px6 + 110, FLOOR - 42); g.stroke(); g.restore();
      var nr4 = NOREC; NOREC = nr4 || pk < .97; putW(g, P.pl6, px6, FLOOR - 92, 0, kn(t, T.pl6k, .1)); NOREC = nr4;
      g.restore();
    }
    if (t >= T.cal - .02) {
      var ci = cd(t, T.cal, 13), nr5 = NOREC; NOREC = nr5 || ci < .97;
      g.save(); g.translate(760, 985 - 900 * (1 - ci)); g.rotate(.04 + .02 * osc(t, 4, 2) + .15 * (1 - ci)); putW(g, P.cal, 0, 0, 0, .84);
      var fu = seg(t, T.f19, T.f19 + .28);
      if (fu < 1) { g.save(); g.scale(.84, .84); g.translate(0, -205); g.scale(1, Math.max(.02, Math.cos(Math.PI / 2 * eio(fu)))); g.translate(0, 205); var nr6 = NOREC; NOREC = true; putW(g, P.calB, 0, 0); NOREC = nr6; g.restore(); }
      g.restore(); NOREC = nr5;
    }
    /* end: two identical answers, neither highlighted */
    taped(g, P.yes, 395, 650, .03 * osc(t, 9, 0), T.yes, T.seamC, t, { slam: true, tape: false, dir: -1 });
    taped(g, P.no2, 625, 650, .03 * osc(t, 9, 2), T.no, T.seamC, t, { slam: true, tape: false, dir: 1 });
  }
  function fanPos(i) { var n = TW.tt.N, a = -.62 + 1.24 * i / (n - 1), R = 290; return { x: 515 + R * Math.sin(a), y: 1490 - R * Math.cos(a), r: a }; }
  function tagOff(t) { return stepv(t, -110, [[T.lg, 175, .5], [T.l6, -110, .5]]); }
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
  /* the loop: from the seam on, the picture is the hook's run-up (t - DUR), so the last frame leads into frame 0 */
  function sceneT(t) { return t >= T.seamC ? t - DUR : t; }
  function frame(g, t) {
    g.setTransform(1, 0, 0, 1, 0, 0);
    stage(g);
    var st = sceneT(t);
    if (LIVE2.bg) { world(g, st); vignette(g); }
    g.save(); railClip(g); props(g, st); g.restore();
    if (!POSTERMODE && LIVE.text) captions(g, t);
    g.save(); sweep(g, t, T.seamC, P.sweepK, .17); g.restore();
    if (LIVE.grain && NOISE && LIVE2.bg) { g.globalAlpha = .05; g.globalCompositeOperation = 'overlay'; var o = Math.floor(t * 24) * 37 % 256; g.fillStyle = g.createPattern(NOISE, 'repeat'); g.translate(-o, -o); g.fillRect(o, o, W, H); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }
  }
  function TEXTS(t) {
    var o = [];
    function Tx(id, text, a, b) { if (t >= a && t < b) o.push({ id: id, text: text, x0: 0, y0: 0, x1: 0, y1: 0 }); }
    var st = sceneT(t);
    if (st < T.rip) Tx('q', '?', -9, T.rip);
    Tx('p5', 'GTA 5', -1, 1e9);
    Tx('cnt', 'NEARLY 235,000,000', T.cntL + .05, T.cntO);
    Tx('tt1', 'TAKE-TWO COUNT', T.tag + .2, T.tagO); Tx('tt2', 'UNITS SOLD-IN', T.tag + .2, T.tagO); Tx('tt3', 'NOV 2026', T.tag + .2, T.tagO);
    Tx('g5s', 'NEARLY 235M', T.g5s + .25, T.seamC); Tx('g5s4', 'SOLD-IN', T.g5s + .25, T.seamC); Tx('g5s2', 'TAKE-TWO', T.g5s + .25, T.seamC); Tx('g5s3', 'NOV 2026', T.g5s + .25, T.seamC);
    Tx('mk1', 'MARIO KART 8 DELUXE', T.mkIn + .35, T.knock); Tx('mk2', '72M · NINTENDO', T.mkIn + .35, T.knock);
    Tx('ws1', 'WII SPORTS', T.wsIn + .35, T.knock); Tx('ws2', '82.9M · NINTENDO', T.wsIn + .35, T.knock);
    /* one read: the second NO is the same word on the next tower */
    Tx('noNK', 'NO', T.mkNo + .16, T.knock);
    Tx('tg1', 'TETRIS', T.ttL + .2, T.peel); Tx('tg2', '520M+ CLAIMED', T.ttL + .2, T.peel); Tx('tg3', 'THE TETRIS COMPANY', T.ttL + .2, T.peel);
    /* the fan cases repeat the tag's TETRIS (read since 15.8 s); they are a picture of "every version", not a new read */
    Tx('ev', 'EVERY TETRIS GAME, ADDED UP', T.evc + .2, T.peel);
    Tx('y84', '1984 →', T.y84 + .16, T.peel);
    if (st >= T.rip + .1 && t < T.seamC) Tx('pmc', 'MINECRAFT', -1, 1e9);
    Tx('st', '#1 SINGLE GAME', T.stMC + .16, T.lg);
    Tx('xb1', 'XBOX CEO · X POST', T.xb + .2, T.nin); Tx('xb2', 'SEPT 2026', T.xb + .2, T.nin);
    Tx('c2', '425,000,000+', T.c2L + .05, T.c2O); Tx('c2b', 'COPIES SOLD', T.c2L + .05, T.c2O);
    Tx('gap', '190M+', T.br + .2, T.brO); Tx('gap2', 'MORE', T.brM + .15, T.brO);
    Tx('gwr', 'GUINNESS WORLD RECORDS', T.stMC + .35, T.lg);
    Tx('nin1', 'MARIO KART', T.nin + .2, T.l6 + 1.1); Tx('nin2', '+ WII SPORTS', T.nin + .2, T.l6 + 1.1); Tx('nin4', '= 154.9M', T.ninW + NINW, T.l6 + 1.1); Tx('nin3', 'STILL SHORT', T.stS + .16, T.l6 + 1.1);
    Tx('own', 'EACH COMPANY’S', T.own + .2, T.ownO); Tx('own2', 'OWN COUNT', T.own + .2, T.ownO);
    Tx('p6', 'GTA 6', T.pl6 + .2, T.seamC);
    Tx('cal', 'NOV 19 2026', T.f19 + .2, T.seamC);
    Tx('yes', 'YES', T.yes + .14, T.seamC); Tx('no', 'NO', T.no + .14, T.seamC);
    return o;
  }

  /* ---------- times and sound events, all from the voice ---------- */
  function initTimes() {
    T.seamC = DUR - .45; T.loopCap = DUR - .15;
    /* hook: the GTA 5 tower builds on frame 0 (a tick per case in the gaps); the plate lands on "GTA"; the ? pulses on "Guess." */
    T.p5 = at('hook', 'gta') - .05; T.guess = at('hook', 'guess') - .03;
    /* the native move has its own sound: a soft tick as each case lands, under or between words (quiet enough for the voice) */
    function F(id, t, type, gain) { GT[id] = t; EV.push({ t: t, type: type, g: gain == null ? 1 : gain, id: id }); return t; }
    function ticks(id, N, k0, tOf, gain) { for (var i = k0; i <= N; i++) F(id + i, tOf(i / N), 'tick', gain); }
    ticks('c5_', TW.g5.N, Math.ceil(TW.g5.N * .45), function (p) { return .9 * Math.pow((p - .45) / .55, 1 / 1.4); }, .6);
    T.flut = G('flut', after('hook'), 'swish', .4, 1.1);
    /* gta5: the height lines draw in; the counter drops on the tower and rolls; it lands with a thunk in the pause */
    T.pk5 = start('gta5'); T.ruler = start('gta5') + .1;
    T.cnt0 = at('gta5', 'nearly') - .25; T.roll0 = at('gta5', '235');
    T.cntL = G('cntL', after('gta5'), 'thock', .45, 2.2);
    /* count: Take-Two's tag clips on; the date is underlined on "November" */
    T.tag = at('count', 'taketwos') - .08; G('tagS', T.tag + .1, 'pin', .3, 1);
    T.mark = at('count', 'november'); T.sold = at('count', 'own') - .05;
    /* notmk: the chart rescales; two short towers with their own counts, NO on each, slapped again in the pause */
    T.nm = after('count') + .02; G('nmS', T.nm, 'swish', .3, 1.2);
    T.tagO = T.nm + .3; T.cntO = T.nm; T.g5s = T.nm + .4;
    T.mkIn = at('notmk', 'mario') - .12; T.dash = T.mkIn + .1;
    /* each NO lands with its own slap: Mario Kart in the breath after "Kart.", Wii Sports in the pause after "Sports." */
    T.mkS = F('no1', wend('notmk', 'kart') + .1, 'slap', 1.3); T.mkNo = T.mkS - .12;
    T.knock = at('tetris', 'claims') - .05;
    T.wsIn = Math.min(at('notmk', 'wii') - .15, T.knock - 2.85); 
    T.wsS = G('no2', after('notmk') - .125, 'slap', .15, 1.6, { m: .03 }); if (!EV.some(function (e) { return e.id === 'no2'; })) F('no2', T.wsS, 'slap', 1.6); T.wsNo = T.wsS - .12;
    /* tetris: the sheet hops on "Tetris?"; the short towers are knocked flat; Tetris rises on "claims" and lands */
    T.tease = at('tetris', 'tetris') + .02;
    G('knockS', T.knock, 'thock', .25, 1.2);
    T.tt0 = at('tetris', 'claims'); T.ttL = wend('tetris', 'million') - .05;
    G('ttL', T.ttL, 'thock', .5, 2); T.scrib = T.ttL + .3;
    ticks('tt', TW.tt.N, 1, function (p) { return T.tt0 + (T.ttL - T.tt0) * Math.pow(p, 1 / 1.3); }, .7);
    /* every: the tower wobbles on "But" and splits into a fan of single cases; 1984 and the arrow; a riffle in the pause */
    T.wob = start('every'); T.split = wend('every', '1984') + .06;
    T.evc = start('every') - .1; T.y84 = at('every', 'tetris') - .05;
    T.riff = G('riff', after('every'), 'riffle', .4, .6);
    /* the Tetris tag, the card and the fan are gone by 19.70, before "One single game" */
    T.peel = Math.min(T.riff + .08, at('mine', 'one') - .3);
    /* mine: the fan clears; the sheet tugs on "Minecraft" and rips in the pause; the stamp lands */
    T.fanO = at('mine', 'single'); T.le = at('mine', 'single') - .05; G('leS', T.fanO + .05, 'swish', .3, 1);
    T.tug = at('mine', 'minecraft');
    T.rip = G('rip', after('mine'), 'tear', .35, 2.2);
    T.stMC = G('stMC', T.rip + .42, 'stamp', .3, 2.2);
    [.08, .15, .21, .26].forEach(function (d, i) { F('mcT' + i, T.rip + d, 'tick', .6); });
    /* xbox: the owner chip, then the counter on top rolls to 425,000,000+ and lands in the pause */
    T.xb = start('xbox') - .05; G('xbS', T.xb + .1, 'pin', .3, 1);
    T.c2 = at('xbox', 'over') - .12; T.roll2 = at('xbox', '425');
    T.c2L = G('c2L', after('xbox'), 'thock', .45, 2.2);
    /* more: GTA 5 slides beside Minecraft; the bracket draws on "190"; MORE; the bracket snaps in the pause (poster) */
    T.lg = start('more') - .1; G('lgS', T.lg, 'swish', .3, 1.2);
    T.br = at('more', '190') - .05; T.brM = at('more', 'more') - .03; T.own = at('more', '190') + .25; T.g5k = at('more', 'gta');
    T.snap = G('snap', after('more'), 'snap', .4, 2.2);
    /* Mario Kart's cases drop into the gap, then Wii Sports' (a tick each), the total counts up, STILL SHORT slams on */
    T.nin = T.brM + .15; T.ninW = T.nin + NIN + .04; T.stS = T.ninW + NINW + .02;
    ticks('nk', TW.mk.N, 1, function (p) { return T.nin + NIN * p; }, .6); ticks('nw', TW.ws.N, 1, function (p) { return T.ninW + NINW * p; }, .6);
    F('stSS', T.stS + .12, 'thock', .9);
    /* gta6: everything trucks left; an empty spot with the GTA 6 plate; the calendar drops on "November" */
    T.l6 = start('gta6') - .08; G('l6S', T.l6, 'swish', .3, 1.2);
    T.brO = T.l6; T.ownO = T.l6 + .1; T.c2O = T.l6 + .05;
    T.pl6 = at('gta6', 'gta') + .05; T.pl6k = at('gta6', '6');
    T.f19 = at('gta6', '19') - .05;
    T.cal = at('gta6', 'november') - .12; G('calS', T.cal + .12, 'thock', .45, 1.2);
    /* end: YES / NO, identical, in the pause before the question */
    /* they enter once the caption reads the question (never across NOVEMBER 19.) */
    T.yes = start('end') + .03; T.no = T.yes + .14; F('tapY', T.yes + .12, 'slap', .5); F('tapN', T.no + .12, 'slap', .5);
    G('seam', T.seamC - .12, 'swish', .3, 1.8);
    /* layouts: zoom (px per million) and each tower's x / width */
    T.ZK = [[T.tag + .1, 2.12, 1.8], [T.nm, 1.5, .55], [T.knock, 1.15, .55], [T.le, 1.25, .5], [T.lg, 1.8, .5], [T.l6, 1.3, .5], [T.yes, 1.4, 2.4]];
    T.X0 = { g5: 300, mc: 730, tt: 495, mk: 205, ws: 410 };
    T.W0 = { g5: 280, mc: 280, tt: 220, mk: 150, ws: 150 };
    T.XK = { g5: [[T.nm, 620, .55], [T.knock, 225, .55], [T.le, 290, .5], [T.lg, 530, .5], [T.l6, 230, .5]],
             mc: [[T.nm, 820, .55], [T.knock, 815, .55], [T.le, 650, .5], [T.lg, 760, .5], [T.l6, 470, .5]] };
    T.WK = { g5: [[T.nm, 200, .55], [T.knock, 180, .55], [T.le, 230, .5], [T.lg, 220, .5], [T.l6, 200, .5]],
             mc: [[T.nm, 180, .55], [T.knock, 180, .55], [T.le, 260, .5], [T.lg, 220, .5], [T.l6, 240, .5]] };
    STRESS = [['hook', 'guess'], ['tetris', 'claims'], ['every', 'every'], ['mine', 'single'], ['mine', 'minecraft'], ['more', '190'], ['end', 'catch']].map(function (p) { return at(p[0], p[1]); });
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

  window.FILM = { bare: function () { ctx.setTransform(1, 0, 0, 1, 0, 0); stage(ctx); }, W: W, H: H, DUR: DUR, POSTER: 0, SLUG: 'gta-outsold', SHOTS: [], init: init, render: render, frame: frame, LIVE: LIVE, LIVE2: LIVE2, T: T, GT: GT };
  var _bt = buildTextures; buildTextures = function () { _bt(); EV.length = 0; initTimes(); window.FILM.POSTER = Math.round(Math.min(T.snap + .3, T.l6 - .05) * 30) / 30 + 1 / 60;
    window.FILM.SHOTS = [{ id: 'hook', name: 'Which game?', t0: 0, t1: start('notmk') }, { id: 'guesses', name: 'Not these', t0: start('notmk'), t1: start('tetris') }, { id: 'tetris', name: 'Tetris claims', t0: start('tetris'), t1: start('mine') }, { id: 'mine', name: 'Minecraft', t0: start('mine'), t1: start('more') }, { id: 'gap', name: '190M+ more', t0: start('more'), t1: start('gta6') }, { id: 'gta6', name: 'GTA 6', t0: start('gta6'), t1: DUR }]; };

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
