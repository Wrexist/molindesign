/* "What did GTA 5 cost?": Delta, pillar 1 (numbers and money).
   A vertical film written in code, narrated first and cut to the voice: every visual beat is keyed to a word time from
   vo/vo.js (window.VO) with at(id, word). Pure function of t. Contract: window.FILM, DUR, render(t), READY, EV, TEXTS(t),
   SCORE(ctx). GTA V's budget: about GBP 170M / about $265M for making and marketing, REPORTED by The Scotsman (Sept 2013),
   not a Rockstar figure; Guinness listed it as the largest videogame budget (2013). Take-Two (Sept 20 2013): over $1 billion
   in retail sales in its first three days; Take-Two (Nov 2026 deck): faster than any entertainment release, nearly 235
   million units sold. Derived: nearly 4x the reported cost. GTA 6's budget: no number given by Take-Two. GTA VI Nov 19 2026.
   The set is a hand-cut paper money room; the hero is a brass-and-paper balance scale (native move: the scale tips as
   paper bundles land). Engine from film/gta-outsold. No logos, key art, footage or music. */
(function () {
  'use strict';
  var W = 1080, H = 1920, VO = window.VO, DUR = VO.dur, CX = 510;
  var BG = '#071a14', CREAM = '#fbf3e4';
  var HOT = '#ff5a4a', TEAL = '#43cfa0', ORG = '#ffb23d';
  var INK = '#14201b', PAPER = '#f2e5cd', NEWS = '#efe5cf', KRAFT = '#b8834b', KRAFT2 = '#8a5a2e', BENCH = '#1c1042';
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
     THE SET: a hand-cut paper counting house. Green ledger wall with a red margin, a round vault door whose handle turns
     once per loop, a banker's lamp, an oxblood desk with a felt blotter, and the hero: a paper balance scale. Left pan = the reported cost, right pan = three days of sales. Cash is plain
     mint paper bundles with a paper band (no real currency art). Price tags, stamps and chips are our own type.
     No Rockstar logo, key art, footage or music.
     ===================================================================================================== */
  var FLOOR = 1400, PADC = '#f4ead6', INK2 = '#173a2d', RED = '#e0283c', MINT = '#8fd8a8', MINT2 = '#4f9e74', BRASS = '#ffc83d', BRASS2 = '#b8862a';
  var PIV = { x: 510, y: 1010 }, HALF = 270, HANG = 225, BW = 84, BH = 40;

  function bundlePiece() {
    return piece([0, 0, BW, BH], function (g) { rr(g, 0, 0, BW, BH, 3); }, MINT, { ps: 1.6, sx: 0, sy: 3, blur: 4, edge: 1.4, extra: function (g) {
      g.fillStyle = MINT2; g.fillRect(0, BH - 7, BW, 7);
      g.strokeStyle = 'rgba(29,60,40,.35)'; g.lineWidth = 1.4; rr(g, 5, 5, BW - 10, BH - 12, 3); g.stroke();
      g.fillStyle = 'rgba(29,60,40,.25)'; g.beginPath(); g.ellipse(BW / 2, BH / 2 - 3, 8, 7, 0, 0, TAU); g.fill();
      g.fillStyle = HOT; g.fillRect(BW / 2 - 7, 0, 14, BH);
      g.fillStyle = 'rgba(255,255,255,.3)'; g.fillRect(BW / 2 - 7, 0, 14, 3);
    } });
  }
  /* the price tag: a cream card with a clipped point on the left, a hole and a string; its words are drawn live */
  var TGW = 600, TGH = 340;
  function tagPiece() {
    var w = TGW, h = TGH;
    function path(g) { g.beginPath(); g.moveTo(-w / 2 + 70, -h / 2); g.lineTo(w / 2 - 12, -h / 2); g.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + 12); g.lineTo(w / 2, h / 2 - 12); g.quadraticCurveTo(w / 2, h / 2, w / 2 - 12, h / 2); g.lineTo(-w / 2 + 70, h / 2); g.lineTo(-w / 2, 0); g.closePath(); }
    return piece([-w / 2, -h / 2, w / 2, h / 2], path, PADC, { sx: 7, sy: 14, blur: 18, extra: function (g) {
      g.strokeStyle = 'rgba(29,18,51,.22)'; g.lineWidth = 3; g.setLineDash([10, 8]);
      g.beginPath(); g.moveTo(-w / 2 + 84, -h / 2 + 18); g.lineTo(w / 2 - 18, -h / 2 + 18); g.lineTo(w / 2 - 18, h / 2 - 18); g.lineTo(-w / 2 + 84, h / 2 - 18); g.lineTo(-w / 2 + 22, 0); g.closePath(); g.stroke(); g.setLineDash([]);
      /* the punched hole with a brass ring */
      g.fillStyle = BRASS; g.beginPath(); g.arc(-w / 2 + 64, 0, 22, 0, TAU); g.fill();
      g.fillStyle = BG; g.beginPath(); g.arc(-w / 2 + 64, 0, 12, 0, TAU); g.fill();
    } });
  }
  function plate(text, w, px, bg, fg, ring) { return cardPiece(w, 80, bg || CREAM, [[text, px || 48, fg || INK, 3]], { r: 8, ring: ring || 'rgba(29,18,51,.25)' }); }

  function buildTextures() { GRAIN = buildGrain(); buildSet(); }
  function buildSet() {
    P.bundle = bundlePiece();
    P.tag = tagPiece();
    P.both = cardPiece(330, 140, TEAL, [['MAKING', 50, INK, -30], ['+ MARKETING', 50, INK, 28]], { r: 8, ring: 'rgba(29,18,51,.3)' });
    P.stG = buildStamp(['LARGEST BUDGET', 'FOR A VIDEOGAME'], 50, 400, HOT);
    P.gwr = cardPiece(400, 110, INK2, [['GUINNESS WORLD', 44, CREAM, -24], ['RECORDS · 2013', 44, CREAM, 26]], { r: 6, ring: 'rgba(251,240,234,.5)' });
    P.dip = cardPiece(380, 150, ORG, [['NOT FROM', 56, INK, -32], ['ROCKSTAR', 56, INK, 30]], { r: 8, ring: 'rgba(29,18,51,.3)' });
    P.day = calPiece(TEAL, [['DAY', 64, INK2, -112]], 404);
    P.cnt = cardPiece(440, 170, NEWS, [], { r: 8, ring: 'rgba(29,18,51,.25)' });
    P.tt13 = cardPiece(420, 104, INK2, [['TAKE-TWO · RETAIL SALES', 38, CREAM, -22], ['SEPT 20, 2013', 38, CREAM, 24]], { r: 6, ring: 'rgba(251,240,234,.5)' });
    P.hdr = cardPiece(560, 124, CREAM, [['GTA 5 · 2013', 86, INK, 4]], { r: 10, ring: HOT });
    P.plate = cardPiece(250, 104, CREAM, [['≈ $265M', 50, HOT, -18], ['REPORTED', 38, INK2, 30]], { r: 8, ring: 'rgba(20,32,27,.35)' });
    P.tok = cardPiece(150, 62, CREAM, [['GTA 5', 42, INK, 3]], { r: 10, ring: HOT });
    P.raceC = cardPiece(440, 76, INK2, [['TAKE-TWO · NOV 2026', 38, CREAM, 3]], { r: 6, ring: 'rgba(251,240,234,.5)' });
    P.stN = buildStamp(['NO NUMBER GIVEN'], 60, 520, RED);
    P.cal = calPiece(HOT, [['NOV', 62, HOT, -112], ['19', 190, INK, 0], ['2026', 72, INK, 122]], 403);
    P.yes = cardPiece(170, 110, CREAM, [['YES', 66, INK, 4]], { r: 12, ring: TEAL });
    P.no2 = cardPiece(170, 110, CREAM, [['NO', 66, INK, 4]], { r: 12, ring: TEAL });
    var tp3 = jag(311, 1100, 10), bt3 = jag(312, 1100, 10);
    P.sweepK = piece([0, -20, 1100, 1580], function (g) { g.beginPath(); g.moveTo(0, tp3[0][1]); tp3.forEach(function (p) { g.lineTo(p[0], p[1]); }); for (var i = bt3.length - 1; i >= 0; i--) g.lineTo(bt3[i][0], 1560 + bt3[i][1]); g.closePath(); }, KRAFT, { sx: 0, sy: 10, blur: 20, ps: .6, extra: function (g) { g.strokeStyle = 'rgba(60,30,10,.18)'; g.lineWidth = 3; for (var x = 30; x < 1100; x += 90) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x + 20, 1560); g.stroke(); } } });
    P.wall = buildWall();
  }
  var KRAFT = '#1f5a3f';
  function buildWall() {
    var c = mk(W, H), g = c.getContext('2d'), r = mulberry(19);
    /* a counting-house wall: deep green ledger paper with a ruled grid and a red double margin */
    var gr = g.createLinearGradient(0, 0, 0, FLOOR); gr.addColorStop(0, '#08201a'); gr.addColorStop(.6, '#0f3326'); gr.addColorStop(1, '#174531'); g.fillStyle = gr; g.fillRect(0, 0, W, FLOOR);
    g.strokeStyle = 'rgba(150,230,190,.07)'; g.lineWidth = 2;
    for (var y = 20; y < FLOOR; y += 46) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
    for (var x = 30; x < W; x += 138) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, FLOOR); g.stroke(); }
    g.strokeStyle = 'rgba(255,90,74,.22)'; g.lineWidth = 3; [64, 74].forEach(function (mx) { g.beginPath(); g.moveTo(mx, 0); g.lineTo(mx, FLOOR); g.stroke(); });
    /* the round vault door, top right, bleeding off the frame */
    g.save(); g.translate(905, 330);
    g.shadowColor = 'rgba(0,0,0,.5)'; g.shadowBlur = 30; g.fillStyle = '#2c5446'; g.beginPath(); g.arc(0, 0, 330, 0, TAU); g.fill(); g.shadowBlur = 0;
    [300, 250, 170].forEach(function (rr0, i) { g.strokeStyle = i ? 'rgba(10,30,22,.55)' : 'rgba(200,240,215,.18)'; g.lineWidth = i ? 10 : 6; g.beginPath(); g.arc(0, 0, rr0, 0, TAU); g.stroke(); });
    for (var k = 0; k < 16; k++) { var a = k * TAU / 16; g.fillStyle = '#c9a24a'; g.beginPath(); g.arc(Math.cos(a) * 275, Math.sin(a) * 275, 11, 0, TAU); g.fill(); g.fillStyle = 'rgba(0,0,0,.3)'; g.beginPath(); g.arc(Math.cos(a) * 275 + 2, Math.sin(a) * 275 + 3, 5, 0, TAU); g.fill(); }
    g.restore();
    /* the desk: oxblood wood with a brass edge and a green felt blotter */
    g.fillStyle = '#3d1c15'; g.fillRect(0, FLOOR, W, H - FLOOR);
    for (y = FLOOR + 22; y < H; y += 26) { g.fillStyle = 'rgba(0,0,0,' + (.12 + r() * .12).toFixed(3) + ')'; g.fillRect(0, y, W, 2 + r() * 3); }
    g.fillStyle = '#1f5a3f'; g.fillRect(150, FLOOR + 24, 720, 300); g.strokeStyle = '#c9a24a'; g.lineWidth = 4; g.strokeRect(150, FLOOR + 24, 720, 300);
    g.fillStyle = '#c9a24a'; g.fillRect(0, FLOOR, W, 10); g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(0, FLOOR + 10, W, 6);
    g.globalAlpha = .7; g.fillStyle = g.createPattern(GRAIN, 'repeat'); g.fillRect(0, 0, W, H); g.globalAlpha = 1;
    return c;
  }
  /* =====================================================================================================
     TIME AND STATE
     ===================================================================================================== */
  var T = {}, LIVE2 = { bg: true, clip: true };
  function tq(t) { return (Math.floor(t * 30) + .5) / 30; }
  function stepv(t, v0, L) { var v = v0; for (var i = 0; i < L.length; i++) { var s = L[i]; if (t < s[0]) break; v = lerp(v, s[1], eio(seg(t, s[0], s[0] + (s[2] || .5)))); } return v; }
  function fmt(n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }

  function world(g, t) {
    g.drawImage(P.wall, 0, 0);
    /* the vault door's spoked handle turns once per film (periodic, so the loop is seamless) */
    g.save(); g.translate(905, 330); g.rotate(TAU * t / DUR);
    g.strokeStyle = '#c9a24a'; g.lineWidth = 16; g.lineCap = 'round';
    for (var k = 0; k < 3; k++) { var a = k * TAU / 3; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(a) * 120, Math.sin(a) * 120); g.stroke(); g.fillStyle = '#e8c766'; g.beginPath(); g.arc(Math.cos(a) * 120, Math.sin(a) * 120, 16, 0, TAU); g.fill(); }
    g.fillStyle = '#e8c766'; g.beginPath(); g.arc(0, 0, 34, 0, TAU); g.fill();
    g.restore();
    /* a banker's-lamp glow from the top left, breathing slowly */
    var lg = g.createRadialGradient(140, 120, 20, 140, 120, 760); lg.addColorStop(0, 'rgba(255,214,120,' + (.2 + .03 * osc(t, 5, 1)).toFixed(3) + ')'); lg.addColorStop(1, 'rgba(255,214,120,0)');
    g.fillStyle = lg; g.fillRect(0, 0, W, FLOOR);
    /* the lamp itself: a brass stem and a green glass shade at the top left */
    g.save(); g.translate(140, 60); g.fillStyle = '#c9a24a'; g.fillRect(-6, -80, 12, 90); g.fillStyle = '#1d6b49'; g.beginPath(); g.moveTo(-120, 70); g.quadraticCurveTo(0, -20, 120, 70); g.closePath(); g.fill(); g.fillStyle = 'rgba(255,230,150,.75)'; g.fillRect(-110, 66, 220, 8); g.restore();
    /* paper receipts drifting down the wall */
    for (var i = 0; i < 6; i++) {
      var ph = hash(i * 3.7), yy = ((t / DUR * (2 + (i % 2)) + ph) % 1) * 1500 - 100, xx = 120 + i * 150 + 40 * osc(t, 5 + i, i);
      g.save(); g.globalAlpha = .2; g.translate(xx, yy); g.rotate(.6 * osc(t, 6 + i, i * 2)); g.fillStyle = '#f4ead6'; g.fillRect(-16, -26, 32, 52); g.fillStyle = 'rgba(20,32,27,.6)'; for (var q = 0; q < 4; q++) g.fillRect(-10, -18 + q * 10, 14 + (q % 2) * 6, 3); g.restore();
    }
  }

  /* ---------- the balance scale ---------- */
  function nLeft(t) { if (t >= T.clr + .5) return 0; return Math.floor(4 * clamp(seg(t, T.lb0, T.lb1) + 1e-6, 0, 1)); }
  function nRight(t) { if (t >= T.clr + .5) return 0; return Math.floor(15 * clamp(seg(t, T.rb0, T.rb1) + 1e-6, 0, 1)); }
  function tilt(t) {
    /* positive = right pan down. A critically damped follow of the weight difference, with a little rock on frame 0 */
    var th = 0, L = [[T.lb0 + .1, -1], [T.rb0 + .3, -.3], [T.rb0 + .7, .4], [T.rbL, 1], [T.clr, 0]];
    var v = 0; for (var i = 0; i < L.length; i++) { if (t < L[i][0]) break; v = lerp(v, L[i][1], cd(t, L[i][0], 6)); }
    th = .15 * v + sw(t, T.rbL, .12, 9, 3.2) + sw(t, T.lb1, .04, 8, 3) + .05 * Math.sin(t * 5.2) * (1 - seg(t, -.2, 1.4)) * (t < T.lb0 ? 1 : 0);
    return th;
  }
  function scaleX(t) { return 0; }
  function pans(t) { var th = tilt(t), c = Math.cos(th), s = Math.sin(th); return { th: th, L: { x: PIV.x - HALF * c, y: PIV.y - HALF * s }, R: { x: PIV.x + HALF * c, y: PIV.y + HALF * s } }; }
  function pile(g, x, yb, n, cols, t, tStart, tEnd, N, hop) {
    var rows = Math.ceil(N / cols);
    for (var i = 0; i < n; i++) {
      var r = Math.floor(i / cols), cI = i % cols, k = 1;
      var ti = tStart + (tEnd - tStart) * (i + 1) / N; k = eo(seg(t, ti - .12, ti));
      var bx = x + (cI - (cols - 1) / 2) * (BW + 4) + (hash(i + N) - .5) * 6, by = yb - (r + 1) * BH - (1 - k) * 160 - (hop ? 75 * Math.sin(Math.PI * seg(t, T.c1L + i * .025, T.c1L + .34 + i * .025)) : 0);
      g.save(); g.globalAlpha *= clamp(k * 4, 0, 1); put(g, P.bundle, bx - BW / 2, by, (hash(i * 3 + N) - .5) * .06); g.restore();
    }
  }
  function drawScale(g, t) {
    var ox = scaleX(t); if (ox < -1000) return;
    var p = pans(t);
    g.save(); g.translate(ox, 0);
    /* shadow + base + post */
    g.save(); g.globalAlpha *= .4; g.fillStyle = '#020a07'; g.beginPath(); g.ellipse(PIV.x + 10, FLOOR + 6, 170, 14, 0, 0, TAU); g.fill(); g.restore();
    g.fillStyle = BRASS2; rr(g, PIV.x - 150, FLOOR - 34, 300, 36, 8); g.fill(); g.fillStyle = BRASS; rr(g, PIV.x - 140, FLOOR - 38, 280, 26, 8); g.fill();
    g.fillStyle = BRASS2; g.fillRect(PIV.x - 15, PIV.y, 30, FLOOR - PIV.y - 30); g.fillStyle = BRASS; g.fillRect(PIV.x - 11, PIV.y, 14, FLOOR - PIV.y - 30);
    [['L', -1], ['R', 1]].forEach(function (q) {
      var e = p[q[0]], py = e.y + HANG, pw = 262;
      /* strings */
      g.strokeStyle = 'rgba(251,240,234,.8)'; g.lineWidth = 3; g.beginPath(); g.moveTo(e.x, e.y); g.lineTo(e.x - pw / 2 + 10, py); g.moveTo(e.x, e.y); g.lineTo(e.x + pw / 2 - 10, py); g.stroke();
      /* what sits on the pan; at T.clr it all lifts off so GTA 6 gets an empty scale */
      var ko = eio(seg(t, T.clr, T.clr + .45)), nrk = NOREC; NOREC = nrk || ko > 0;
      g.save(); g.globalAlpha *= 1 - ko; g.translate(0, -700 * ko);
      if (q[0] === 'L') pile(g, e.x, py, nLeft(t), 2, t, T.lb0, T.lb1, 4, true);
      else pile(g, e.x, py, nRight(t), 3, t, T.rb0, T.rb1, 15);
      /* the reported cost, taped to the cost pan's strings, so the payoff weighs a number against a number */
      if (q[0] === 'L' && t >= T.pl - .02 && t < T.clr + .5) { var pk = cd(t, T.pl, 13), nrp = NOREC; NOREC = NOREC || pk < .97; g.save(); g.translate(e.x, e.y + 96 - (1 - pk) * 120); g.rotate(-.04 + .15 * (1 - pk) - p.th * .5); putW(g, P.plate, 0, 0); tape(g, 0, -P.plate.h / 2 + 30, 80, 24, .05); g.restore(); NOREC = nrp; }
      g.restore(); NOREC = nrk;
      /* YES / NO hover over the pans from the question's first word and slam down in the pauses */
      if (t >= T.yesH && t < (q[0] === 'L' ? T.yes : T.no)) { var hk2 = eo(seg(t, T.yesH, T.yesH + .3)), nrq = NOREC; NOREC = true; g.save(); g.globalAlpha *= .9 * hk2; g.translate(e.x, py - 160 - 20 * (1 - hk2) + 8 * Math.sin(t * 5 + (q[0] === 'L' ? 0 : 2))); g.rotate((q[0] === 'L' ? -.12 : .12) + .04 * Math.sin(t * 4)); putW(g, q[0] === 'L' ? P.yes : P.no2, 0, 0); g.restore(); NOREC = nrq; }
      if (q[0] === 'L' && t >= T.yes - .02) taped(g, P.yes, e.x, py - 70, .03 * osc(t, 9, 0), T.yes, T.seamC + 1, t, { slam: true, tape: false, dir: -1 });
      if (q[0] === 'R' && t >= T.no - .02) taped(g, P.no2, e.x, py - 70, .03 * osc(t, 9, 2), T.no, T.seamC + 1, t, { slam: true, tape: false, dir: 1 });
      /* the dish */
      g.save(); g.fillStyle = BRASS2; g.beginPath(); g.moveTo(e.x - pw / 2, py); g.quadraticCurveTo(e.x, py + 70, e.x + pw / 2, py); g.closePath(); g.fill();
      g.fillStyle = BRASS; g.beginPath(); g.moveTo(e.x - pw / 2 + 8, py); g.quadraticCurveTo(e.x, py + 56, e.x + pw / 2 - 8, py); g.closePath(); g.fill();
      g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(e.x - pw / 2, py - 3, pw, 6); g.restore();
    });
    /* the beam and the pivot */
    g.save(); g.translate(PIV.x, PIV.y); g.rotate(p.th);
    g.fillStyle = BRASS2; rr(g, -HALF - 14, -11, 2 * HALF + 28, 24, 10); g.fill(); g.fillStyle = BRASS; rr(g, -HALF - 14, -13, 2 * HALF + 28, 16, 8); g.fill();
    g.restore();
    g.fillStyle = BRASS; g.beginPath(); g.arc(PIV.x, PIV.y, 26, 0, TAU); g.fill(); g.fillStyle = BRASS2; g.beginPath(); g.arc(PIV.x, PIV.y, 10, 0, TAU); g.fill();
    /* the pointer needle */
    g.save(); g.translate(PIV.x, PIV.y); g.rotate(p.th * 1.6); g.fillStyle = HOT; g.beginPath(); g.moveTo(-7, 0); g.lineTo(7, 0); g.lineTo(0, -88); g.closePath(); g.fill(); g.restore();
    g.restore();
  }

  /* ---------- taped paper: settles onto a face, leaves by flying off ---------- */
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
  function counter(g, pc, x, y, text, landed, t, pre, line2, ta, px) {
    putW(g, pc, x, y, 0);
    g.save(); g.translate(x, y);
    var nr = NOREC; NOREC = nr || !landed;
    if (landed && pre) txt(g, pre, 0, -52, { px: 40, col: INK2, align: 'center', ls: 3, a: fin(t, ta, .1) });
    var s = landed ? kn(t, ta, .1) : 1; g.save(); g.translate(0, 0); g.scale(s, s);
    txt(g, text, 0, 0, { px: px || 66, col: landed ? INK : '#7a6a8f', align: 'center', ls: 1 });
    g.restore();
    if (landed && line2) txt(g, line2, 0, 54, { px: 40, col: HOT, align: 'center', ls: 3, a: fin(t, ta, .1) });
    NOREC = nr; g.restore();
  }

  /* ---------- the price tag (frame 0: GTA 5 · $???; the end: GTA 6 · $???) ---------- */
  function tagPos(t) {
    var x = stepv(t, lerp(640, 510, eio(seg(t, -.15, 1.1))), [[T.tagO, 510, .4], [T.dateTag, 620, .45]]);
    var s = stepv(t, lerp(.9, 1, eio(seg(t, -.15, 1.1))), [[T.dateTag, .8, .45]]);
    var y = 700;
    if (t >= T.tagO && t < T.tag6) y = 700 - 1300 * eio(seg(t, T.tagO, T.tagO + .45));
    if (t >= T.tag6) y = 700 - (1 - cd(t, T.tag6, 9)) * 900;
    return { x: x, y: y, s: s };
  }
  function drawTag(g, t) {
    if (t >= T.tagO + .5 && t < T.tag6 - .02) return;
    var p = tagPos(t), six = t >= T.tag6;
    var swing = .11 * Math.sin(t * 2.4 + .8) * Math.exp(-Math.max(0, t) * .35) + sw(t, T.rep, .06, 7, 2.5) + sw(t, T.tag6, .12, 4, 1.6) + .02 * osc(t, 6, 1);
    g.save(); g.translate(p.x, p.y);
    /* the string up to the top of the frame */
    g.strokeStyle = 'rgba(251,240,234,.7)'; g.lineWidth = 3; g.beginPath(); g.moveTo(-TGW / 2 * p.s + 64 * p.s, 0); g.lineTo(-40, -700); g.stroke();
    g.rotate(swing); g.scale(p.s, p.s);
    var nr = NOREC; NOREC = nr || (t >= T.tagO) || (six && t < T.tag6 + .4);
    put(g, P.tag, 0, 0);
    var cx = 50;
    /* the name lands on "GTA" */
    var nameT = six ? T.tag6 + .15 : T.p5;
    if (t >= nameT) { var u = t - nameT; g.save(); g.translate(cx, -110); var sc = lerp(1.4, 1, eo(clamp(u / .14, 0, 1))); g.scale(sc, sc); txt(g, six ? 'GTA 6' : 'GTA 5', 0, 0, { px: 64, col: INK, align: 'center', ls: 2 }); g.restore(); }
    if (!six && t >= T.rep) {
      var u2 = t - T.rep;
      g.save(); g.translate(cx, 0); var s2 = lerp(1.5, 1, eo(clamp(u2 / .16, 0, 1))) * kn(t, T.rep + .14, .06); g.scale(s2, s2);
      stk(g, '≈ $265M', 0, -2, 118, { col: HOT, lw: 10 }); g.restore();
      txt(g, '£170M · REPORTED', cx, 82, { px: 40, col: INK2, align: 'center', ls: 2, a: fin(t, T.rep + .3, .15) });
      txt(g, 'THE SCOTSMAN · SEPT 2013', cx, 128, { px: 36, col: INK2, align: 'center', ls: 2, a: fin(t, T.rep + .45, .15) });
      if (t >= T.circ && t < T.tagO) KIT.scribble(g, cx - 150, -2, 70, 54, eo(seg(t, T.circ, T.circ + .35)), HOT, 6, 5);
    } else {
      /* the unknown: a question, no number */
      var q = kn(t, six ? T.tag6 + .3 : -1, .12);
      g.save(); g.translate(cx, 20); g.scale(q, q); stk(g, '$ ???', 0, 0, 150, { col: HOT, lw: 12 }); g.restore();
    }
    NOREC = nr; g.restore();
  }

  /* ---------- the prop layer (screen space, clipped to the rail) ---------- */
  function props(g, t) {
    drawScale(g, t);
    /* the header: once the tag leaves, the film still says which game and which year */
    taped(g, P.hdr, 510, 240, -.015, T.tagO + .25, T.clr, t, { fromY: -160, dir: -1 });
    /* both: making + marketing, one pile, taped under the cost pan; peeled as the caveat starts */
    taped(g, P.both, 300, 1335, -.03, T.both, T.dip, t, { fromY: 60, dir: -1 });
    if (t >= T.both + .2 && t < T.dip + .2) { g.save(); g.globalAlpha *= 1 - seg(t, T.dip, T.dip + .2); KIT.arrow(g, 300, 1262, 270, 1205, eo(seg(t, T.both + .2, T.both + .5)), CREAM, 7, .2); g.restore(); }
    drawTag(g, t);
    /* Guinness: the credit slides in on "Guinness", the record stamp hovers in on "record" and slams in the pause */
    taped(g, P.gwr, 710, 1145, .02, T.gw, T.stGO, t, { tape: false, fromY: 60, dir: 1 });
    if (t >= T.stH && t < T.stG) {
      var hk = eo(seg(t, T.stH, T.stG)), nrh = NOREC; NOREC = true;
      g.save(); g.globalAlpha *= .92 * fin(t, T.stH, .2); g.translate(690, 990 - 30 * (1 - hk)); g.rotate(lerp(-.32, -.08, hk) + .02 * Math.sin(t * 6)); var hs = lerp(1.12, 1.05, hk); g.scale(hs, hs); putW(g, P.stG, 0, 0); g.restore(); NOREC = nrh;
    }
    taped(g, P.stG, 690, 1010, -.06, T.stG, T.stGO, t, { slam: true, tape: false, dir: 1 });
    if (t >= T.stG && t < T.stG + .5) KIT.impact(g, 690, 1010, t - T.stG, 1.1, HOT);
    /* the dip: NOT FROM ROCKSTAR, taped right onto the cost pile; gone before the launch */
    taped(g, P.dip, 300, 1150, -.05, T.dip, T.dipO, t, { fromY: 80, dir: -1 });
    /* launch: a close-up calendar flips DAY 1, 2, 3, then pulls back to the corner */
    if (t >= T.cal - .02 && t < T.calO + .5) {
      var ci = cd(t, T.cal, 13), pb = eio(seg(t, T.cuO, T.cuO + .45)), co = eio(seg(t, T.calO, T.calO + .4)), nr5 = NOREC; NOREC = nr5 || ci < .97 || co > 0 || (pb > 0 && pb < 1);
      var day = t >= T.d3 ? 3 : t >= T.d2 ? 2 : 1;
      if (pb < 1) { g.save(); g.globalAlpha *= .6 * ci * (1 - pb); var og = g.createRadialGradient(510, 820, 120, 510, 820, 640); og.addColorStop(0, 'rgba(3,16,11,1)'); og.addColorStop(.7, 'rgba(3,16,11,.8)'); og.addColorStop(1, 'rgba(3,16,11,0)'); g.fillStyle = og; g.fillRect(0, 0, W, H); g.restore(); }
      g.save(); g.translate(lerp(510, 240, pb) - 900 * co, lerp(800, 790, pb) - 900 * (1 - ci)); g.rotate(lerp(-.02, -.05, pb) + .02 * osc(t, 4, 2) + .15 * (1 - ci)); var cs = lerp(1.45, .72, pb); g.scale(cs, cs);
      putW(g, P.day, 0, 0);
      var fl = Math.max(seg(t, T.d2 - .2, T.d2), seg(t, T.d3 - .2, T.d3));
      g.save(); g.scale(1, fl > 0 && fl < 1 ? Math.max(.05, Math.abs(Math.cos(Math.PI * fl))) : 1); txt(g, String(day), 0, 30, { px: 200, col: INK, align: 'center' }); g.restore();
      g.restore(); NOREC = nr5;
    }
    /* billion: the sales counter rolls silently under the words and lands in the pause */
    if (t >= T.c1 - .02 && t < T.c1O + .5) {
      var ck = cd(t, T.c1, 13), c1o = eio(seg(t, T.c1O, T.c1O + .4)), landed = t >= T.c1L, v = 1000 * eio(seg(t, T.roll1, T.c1L));
      var nr = NOREC; NOREC = nr || ck < .97 || c1o > 0;
      g.save(); g.globalAlpha *= fin(t, T.c1, .06); g.translate(1100 * c1o, -(1 - ck) * 300);
      counter(g, P.cnt, 680, 620, landed ? '$1 BILLION+' : (v < 100 ? '$ …' : '$' + fmt(Math.floor(v / 100) * 100e6)), landed, t, 'IN 3 DAYS', null, T.c1L, landed ? 74 : 58);
      g.restore(); NOREC = nr;
      if (landed && t < T.c1L + .5) KIT.impact(g, 680, 620, t - T.c1L, 1.1, CREAM);
    }
    taped(g, P.tt13, 680, 752, .02, T.c1 + .35, T.c1O, t, { tape: false, fromY: 40, dir: 1 });
    /* four: on the sales side, pointing back at the reported cost on the other pan */
    if (t >= T.f4 && t < T.f4O + .4) {
      var fo = eio(seg(t, T.f4O, T.f4O + .35));
      var nrf = NOREC; NOREC = nrf || fo > 0; g.save(); g.translate(1100 * fo, 0);
      slam(g, 'NEARLY 4×', 712, 862, 84, t - T.f4, { col: HOT, rot: -.04, lw: 11 });
      txt(g, 'THE REPORTED COST', 722, 932, { px: 40, col: CREAM, align: 'center', ls: 2, a: fin(t, T.f4 + .02, .1) });
      g.globalAlpha *= 1 - fo; KIT.arrow(g, 545, 958, 392, 1040, eo(seg(t, T.f4 + .2, T.f4 + .55)), CREAM, 7, -.25);
      g.restore(); NOREC = nrf;
      if (t < T.f4 + .5) KIT.impact(g, 712, 862, t - T.f4, 1.0, HOT);
    }
    /* fast: a race strip, GTA 5 runs to the $1B flag; Take-Two's own record line, credited */
    if (t >= T.race - .02 && t < T.clr + .5) {
      var rk = cd(t, T.race, 12), ro = eio(seg(t, T.clr, T.clr + .4)), nrr = NOREC; NOREC = nrr || rk < .97 || ro > 0;
      g.save(); g.translate(-1100 * ro, -(1 - rk) * 260); g.globalAlpha *= fin(t, T.race, .08);
      stk(g, 'FASTEST TO $1B', 500, 640, 64, { col: HOT, lw: 9 });
      g.save(); g.shadowColor = 'rgba(0,0,0,.4)'; g.shadowBlur = 10; g.shadowOffsetY = 6; g.fillStyle = PADC; rr(g, 120, 712, 780, 96, 14); g.fill(); g.restore();
      g.strokeStyle = 'rgba(20,32,27,.25)'; g.lineWidth = 4; g.setLineDash([22, 16]); g.beginPath(); g.moveTo(150, 760); g.lineTo(840, 760); g.stroke(); g.setLineDash([]);
      g.fillStyle = INK2; g.fillRect(150, 718, 8, 84);
      g.fillStyle = INK2; g.fillRect(858, 676, 8, 132); g.fillStyle = HOT; g.beginPath(); g.moveTo(858, 676); var fw = 7 * Math.sin(t * 9); g.lineTo(752, 676 + fw); g.lineTo(770 + fw, 702); g.lineTo(752, 728 + fw); g.lineTo(858, 728); g.closePath(); g.fill();
      txt(g, '$1B', 812, 702, { px: 38, col: CREAM, align: 'center' });
      var rx = lerp(235, 770, eio(seg(t, T.race + .25, T.raceE))), arrived = t >= T.raceE;
      if (arrived) txt(g, 'IN 3 DAYS', 470, 760, { px: 44, col: INK, align: 'center', ls: 2, a: fin(t, T.raceE, .12) });
      var nrt = NOREC; NOREC = NOREC || !arrived; putW(g, P.tok, rx, 760 - (arrived ? 6 * Math.abs(Math.sin(t * 7)) : 0), -.03 * Math.sin(t * 14) * (arrived ? 0 : 1), arrived ? kn(t, T.raceE, .1) : 1); NOREC = nrt;
      if (!arrived) { g.strokeStyle = 'rgba(20,32,27,.35)'; g.lineWidth = 4; for (var j = 0; j < 3; j++) { g.beginPath(); g.moveTo(rx - 90 - j * 22, 742 + j * 14); g.lineTo(rx - 130 - j * 22, 742 + j * 14); g.stroke(); } }
      g.restore(); NOREC = nrr;
    }
    taped(g, P.raceC, 510, 872, .015, T.race + .05, T.clr, t, { tape: false, fromY: 40, dir: -1 });
    /* gta6: no number given */
    taped(g, P.stN, 510, 965, -.05, T.stN, T.yes + .1, t, { slam: true, tape: false, dir: 1 });
    if (t >= T.stN && t < T.stN + .5) KIT.impact(g, 510, 965, t - T.stN, 1.1, RED);
    /* date: the calendar */
    if (t >= T.cal6 - .02) {
      var c6 = cd(t, T.cal6, 13), c6o = 0, nr6 = NOREC; NOREC = nr6 || c6 < .97 || c6o > 0;
      g.save(); g.translate(225 - 900 * c6o, 780 - 900 * (1 - c6)); g.rotate(-.04 + .02 * osc(t, 4, 2) + .15 * (1 - c6)); g.scale(.68, .68); putW(g, P.cal, 0, 0); g.restore(); NOREC = nr6;
    }
  }

  /* the camera: a slow push on frame 0 so the hook is moving from its first frame; a second slow push while the sales pile up, released on the race cut */
  function cam(g, t) { var z = lerp(1.05, 1, eio(seg(t, -.3, 1.4))) * (1 + .04 * eio(seg(t, T.c1, T.race)) * (1 - eio(seg(t, T.race - .05, T.race + .3)))) * (1 + .03 * eio(seg(t, T.race + .3, T.clr + .3)) * (1 - eio(seg(t, T.clr, T.clr + .4)))); g.translate(510, 1000); g.scale(z, z); g.translate(-510, -1000); }
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
      g.save(); g.shadowColor = 'rgba(6,3,18,.55)'; g.shadowBlur = 12; g.shadowOffsetX = 4; g.shadowOffsetY = 8; g.fillStyle = '#f4d77e'; g.fill(); g.restore();
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
    if (!VIG) { VIG = mk(W, H); var q = VIG.getContext('2d'), gr = q.createRadialGradient(510, 900, 520, 510, 920, 1300); gr.addColorStop(0, 'rgba(2,10,7,0)'); gr.addColorStop(1, 'rgba(2,10,7,.6)'); q.fillStyle = gr; q.fillRect(0, 0, W, H); }
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
    g.save(); railClip(g); cam(g, st); props(g, st); g.restore();
    if (!POSTERMODE && LIVE.text) captions(g, t);
    g.save(); sweep(g, t, T.seamC, P.sweepK, .17); g.restore();
    if (LIVE.grain && NOISE && LIVE2.bg) { g.globalAlpha = .05; g.globalCompositeOperation = 'overlay'; var o = Math.floor(t * 24) * 37 % 256; g.fillStyle = g.createPattern(NOISE, 'repeat'); g.translate(-o, -o); g.fillRect(o, o, W, H); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }
  }
  function TEXTS(t) {
    var o = [];
    function Tx(id, text, a, b) { if (t >= a && t < b) o.push({ id: id, text: text, x0: 0, y0: 0, x1: 0, y1: 0 }); }
    var st = sceneT(t);
    if (st < T.tagO) Tx('p5', 'GTA 5', T.p5 + .1, T.tagO);
    Tx('v5', '≈ $265M', T.rep + .1, T.tagO); Tx('v5b', '£170M · REPORTED', T.rep + .4, T.tagO); Tx('v5c', 'THE SCOTSMAN · SEPT 2013', T.rep + .55, T.tagO);
    Tx('both', 'MAKING + MARKETING', T.both + .2, T.dip);
    Tx('gwr', 'GUINNESS WORLD RECORDS · 2013', T.gw + .2, T.stGO); Tx('stG', 'LARGEST BUDGET FOR A VIDEOGAME', T.stH + .25, T.stGO);
    Tx('dip', 'NOT FROM ROCKSTAR', T.dip + .2, T.dipO);
    Tx('hdr', 'GTA 5 · 2013', T.tagO + .55, T.clr);
    Tx('day', 'DAY', T.cal + .2, T.calO); Tx('d3', '3', T.d3 + .05, T.calO);
    Tx('pl', '≈ $265M REPORTED', T.pl + .2, T.clr);
    Tx('c1', '$1 BILLION+', T.c1L + .05, T.c1O); Tx('c1b', 'IN 3 DAYS', T.c1L + .1, T.c1O);
    Tx('tt13', 'TAKE-TWO · RETAIL SALES · SEPT 20, 2013', T.c1 + .55, T.c1O);
    Tx('f4', 'NEARLY 4×', T.f4 + .15, T.f4O); Tx('f4b', 'THE REPORTED COST', T.f4 + .1, T.f4O);
    Tx('race', 'FASTEST TO $1B', T.race + .2, T.clr); Tx('race3', 'IN 3 DAYS', T.raceE + .05, T.clr); Tx('raceC', 'TAKE-TWO · NOV 2026', T.race + .22, T.clr);
    Tx('p6', 'GTA 6', T.tag6 + .3, T.seamC);
    Tx('stN', 'NO NUMBER GIVEN', T.stN + .16, T.yes + .1);
    Tx('cal', 'NOV 19 2026', T.cal6 + .2, T.seamC);
    Tx('yes', 'YES', T.yesH + .25, T.seamC); Tx('no', 'NO', T.yesH + .25, T.seamC);
    return o;
  }

  /* ---------- times and sound events, all from the voice ---------- */
  function initTimes() {
    T.seamC = DUR - .45; T.loopCap = DUR - .15;
    function F(id, t, type, gain) { GT[id] = t; EV.push({ t: t, type: type, g: gain == null ? 1 : gain, id: id }); return t; }
    /* hook: the GTA 5 name lands on "GTA"; a swish as the tag swings in */
    T.p5 = at('hook', 'gta') - .05;
    G('in', .02, 'pin', .15, .5);
    /* paper: the number slams onto the tag in the pause; cost bundles drop silently onto the left pan */
    T.rep = G('rep', after('hook'), 'stamp', .4, 2.4);
    T.lb0 = at('paper', 'million') - .1; T.lb1 = wend('paper', 'reported') - .1;
    /* both: making + marketing under the pan */
    T.both = at('both', 'making') - .1; G('bothS', T.both + .1, 'pin', .3, 1);
    /* guin: the credit slides in on "Guinness"; the stamp hovers in on "record" and slams in the pause */
    T.gw = at('guin', 'guinness') - .05; G('gwS', T.gw - .05, 'pin', .25, .8);
    T.stH = at('guin', 'record') - .4;
    T.stG = G('stG', after('guin'), 'stamp', .35, 1.3);
    /* dip: the chip and the Guinness pair peel, the press-report card lands on the tag; the tag gets its circle in the comma */
    T.dip = start('dip') - .1; G('dipS', T.dip, 'swish', .3, 1.0);
    T.circ = G('circ', at('dip', 'not') - .12, 'thock', .25, 2.2, { m: .03 });
    /* launch: every caveat piece is gone before "Then"; the tag flies up; the calendar close-up flips 1, 2, 3, then pulls back */
    T.dipO = start('launch') - .4; T.stGO = T.dipO; T.tagO = start('launch') - .2; G('tagOS', T.tagO, 'swish', .3, 1.4);
    T.cal = start('launch') + .12; T.d2 = T.cal + .42; T.d3 = T.cal + .82; G('calS', after('launch') - .1, 'thock', .35, 1.4);
    T.cuO = start('billion') - .12; T.pl = T.cuO + .15;
    /* billion: sales bundles and the counter run silently under the words; one ratchet burst and the landing thock in the pause */
    T.rb0 = at('billion', 'over') - .1; T.rb1 = wend('billion', 'sales') - .05;
    T.c1 = at('billion', 'over') - .2; T.roll1 = at('billion', 'one');
    var b0 = G('burst', after('billion') - .1, 'tick', .3, .55, { m: .05 });
    for (var i = 1; i < 6; i++) F('burst' + i, b0 + i * .035, 'tick', .55 - i * .05);
    T.c1L = G('c1L', b0 + .24, 'thock', .3, .95, { m: .05 }); T.rbL = T.c1L;
    /* four: nearly 4x, on the sales side, the cost bundles hop as the sales pan bottoms out */
    T.calO = start('four') - .15; T.f4 = T.c1L + .19; F('f4S', T.f4 + .03, 'snap', 1.4);
    /* fast: the race strip */
    T.race = start('fast') - .12; T.c1O = T.race - .05; T.f4O = T.race + .2; G('raceS', T.race, 'swish', .3, 1.2, { m: .05 });
    T.raceE = T.race + .8;
    /* gta6: everything lifts off the scale; the GTA 6 tag swings in; NO NUMBER GIVEN */
    T.clr = after('fast') + .05; G('clrS', T.clr, 'swish', .3, 1.3);
    T.tag6 = start('gta6') + .2; G('t6S', T.tag6, 'swish', .3, 1.3);
    T.stN = G('stN', after('gta6'), 'stamp', .4, 1.45);
    /* date: the calendar; end: YES / NO onto the pans in the pauses */
    T.dateTag = start('date') - .1; T.cal6 = at('date', 'november') - .1; G('cal6S', T.cal6 + .15, 'thock', .4, 1.2);
    T.yesH = start('end') + .05;
    T.yes = G('tapY', wend('end', 'billion') + .08, 'slap', .3, 1.2, { m: .05 }) - .1; T.no = G('tapN', lastw('end') + .1, 'slap', .4, .6, { m: .05 }) - .1;
    G('seam', T.seamC - .05, 'swish', .45, .9);
    STRESS = [['hook', 'cost'], ['paper', 'reported'], ['dip', 'report'], ['billion', 'billion'], ['four', 'four'], ['end', 'billion']].map(function (p) { return at(p[0], p[1]); });
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
      var n = noise(0, DUR); n.connect(lp); lp.connect(o); o.gain.value = window.ROOM_GAIN || .02; })();
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

  window.FILM = { bare: function () { ctx.setTransform(1, 0, 0, 1, 0, 0); stage(ctx); }, W: W, H: H, DUR: DUR, POSTER: 0, SLUG: 'gta-budget', SHOTS: [], init: init, render: render, frame: frame, LIVE: LIVE, LIVE2: LIVE2, T: T, GT: GT };
  var _bt = buildTextures; buildTextures = function () { _bt(); EV.length = 0; initTimes(); window.FILM.POSTER = Math.round((T.f4 + 1.3) * 30) / 30 + 1 / 60;
    window.FILM.SHOTS = [{ id: 'hook', name: 'What did it cost?', t0: 0, t1: start('paper') }, { id: 'cost', name: 'Reported cost', t0: start('paper'), t1: start('launch') }, { id: 'sales', name: '3 days', t0: start('launch'), t1: start('fast') }, { id: 'fast', name: 'Fastest', t0: start('fast'), t1: start('gta6') }, { id: 'gta6', name: 'GTA 6', t0: start('gta6'), t1: DUR }]; };

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
    function dirty(x, y, w, h) { var d = ctx.getImageData(x, y, w, h).data, o = { c: 0, x0: 1e9, x1: -1, y0: 1e9, y1: -1 }; for (var i = 0; i < d.length; i += 4) if (Math.abs(d[i] - 0x07) + Math.abs(d[i + 1] - 0x1a) + Math.abs(d[i + 2] - 0x14) > 24) { var px = (i / 4) % w, py = Math.floor(i / 4 / w); o.c++; o.x0 = Math.min(o.x0, px); o.x1 = Math.max(o.x1, px); o.y0 = Math.min(o.y0, y + py); o.y1 = Math.max(o.y1, y + py); } return o; }
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
