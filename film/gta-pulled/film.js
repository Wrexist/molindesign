/* "Pulled": GTA San Andreas, 2005, Delta (pillar 7, rules and ratings). A vertical film written in code, narrated
   first and cut to the voice: every visual beat is keyed to a word time from vo/vo.js (window.VO) with at(id, word).
   Pure function of t. Contract: window.FILM, DUR, render(t), READY, EV, TEXTS(t), SCORE(ctx).
   One hand-built paper prop per beat, each rising from behind a paper desk lip at y 1440: a store shelf with one
   empty slot and a PULLED tag (frame 0), a plain case GTA: SAN ANDREAS with a 2005 tile, a kraft box that stays
   locked (HIDDEN SCENE, a FAN-MADE MOD key turns its padlock), a close-up where an AO sticker slaps over a plain
   M tile (the one hero stamp), a store sign over a shelf that empties, scissors cutting the box away and the M
   coming back, a NOV 19 page, and the vote. Plain letter tiles of our own, not the ratings board's icon design;
   store names as plain text, no logos; nothing sexual on screen. Engine from film/gta-money. No music. */
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
    var pc = piece([-w / 2, -h / 2, w / 2, h / 2], o.path || function (g) { rr(g, -w / 2, -h / 2, w, h, o.r == null ? 10 : o.r); }, bg, { sy: o.sy == null ? 9 : o.sy, blur: 12, edge: o.edge, extra: function (g) {
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
     THE SET. A store wall in deep ink (faint pegboard, a low sunset glow, two palm silhouettes) and a teal
     paper desk whose cream lip sits at y 1440: every prop rises from behind that lip and sinks back behind it.
     ===================================================================================================== */
  var LIP = 1440, PAD_W = 340, PAD_H = 300;
  var DEEP = '#0f5d63', KR = '#c4935a', KR2 = '#9a6a38';
  var CASEC = [DEEP, '#7a2d6b', '#a8542a', '#24497a', '#5b2a7e', '#1f6b52'];
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
  function tagPath(w, h) { return function (g) { g.beginPath(); g.moveTo(-w / 2 + 40, -h / 2); g.lineTo(w / 2, -h / 2); g.lineTo(w / 2, h / 2); g.lineTo(-w / 2 + 40, h / 2); g.lineTo(-w / 2, h * .2); g.lineTo(-w / 2, -h * .2); g.closePath(); }; }
  function buildTextures() {
    GRAIN = buildGrain();
    P.wall = piece([-60, -60, 1140, 1980], rect(-60, -60, 1140, 1980), '#1c0f3d', { shadow: false, edge: false, grain: .9, ps: .5, extra: function (g) {
      var gr = g.createLinearGradient(0, 0, 0, 1440); gr.addColorStop(0, '#120a2c'); gr.addColorStop(1, '#2a1550'); g.fillStyle = gr; g.fillRect(-60, -60, 1200, 1500);
      g.fillStyle = 'rgba(160,110,255,.08)'; for (var y = 40; y < 1420; y += 60) for (var x = -40; x < 1140; x += 60) { g.beginPath(); g.arc(x + (y / 60 % 2) * 30, y, 4, 0, TAU); g.fill(); }
      var sg = g.createLinearGradient(0, 1150, 0, 1440); sg.addColorStop(0, 'rgba(255,79,163,0)'); sg.addColorStop(1, 'rgba(255,138,61,.28)'); g.fillStyle = sg; g.fillRect(-60, 1150, 1200, 290);
      palmSil(g, 30, 1450, 2.6, '#160b33', 30); palmSil(g, 1060, 1450, 2.3, '#160b33', -30);
      g.fillStyle = '#137f7a'; g.fillRect(-60, 1440, 1200, 600);
      var dg = g.createLinearGradient(0, 1440, 0, 1700); dg.addColorStop(0, 'rgba(0,0,0,0)'); dg.addColorStop(1, 'rgba(0,0,0,.35)'); g.fillStyle = dg; g.fillRect(-60, 1440, 1200, 600);
      g.fillStyle = CREAM; g.fillRect(-60, 1436, 1200, 9); g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(-60, 1445, 1200, 6);
    } });
    /* the shelf unit: two kraft boards on a back panel; plain cases, no art, no text */
    P.shelfBack = piece([-390, -560, 390, 560], function (g) { rr(g, -390, -560, 780, 1120, 8); }, '#2d1a55', { sx: 6, sy: 12, blur: 18, extra: function (g) { g.fillStyle = 'rgba(255,255,255,.04)'; for (var x = -380; x < 380; x += 40) g.fillRect(x, -560, 2, 1120); } });
    P.board = piece([-390, -18, 390, 18], function (g) { rr(g, -390, -18, 780, 36, 4); }, KR, { sx: 3, sy: 8, blur: 10, extra: function (g) { g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(-390, -18, 780, 6); g.fillStyle = KR2; g.fillRect(-390, 10, 780, 8); } });
    P.cases = CASEC.map(function (c, i) { return piece([-50, -75, 50, 75], function (g) { rr(g, -50, -75, 100, 150, 6); }, c, { sx: 3, sy: 6, blur: 7, extra: function (g) { g.fillStyle = 'rgba(255,255,255,.1)'; g.fillRect(-50, -75, 12, 150); g.fillStyle = i % 2 ? TEAL : HOT; g.fillRect(-30, -56, 64, 9); g.fillStyle = 'rgba(251,240,234,.5)'; g.fillRect(-30, 36, 40, 8); } }); });
    P.gtaLabel = cardPiece(250, 112, CREAM, [['GTA', 100, INK, 6]], { r: 6 });
    P.gtaCase = piece([-50, -75, 50, 75], function (g) { rr(g, -50, -75, 100, 150, 6); }, HOT, { sx: 3, sy: 6, blur: 7, extra: function (g) { g.fillStyle = 'rgba(255,255,255,.14)'; g.fillRect(-50, -75, 12, 150); g.fillStyle = INK; g.fillRect(-30, -56, 64, 9); g.fillRect(-30, 36, 40, 8); } });
    /* the PULLED tag: hero size, a hang tag on a string */
    P.pulled = cardPiece(440, 190, CREAM, [['PULLED', 138, HOT, 8, null, 18]], { path: tagPath(440, 190), after: function (g) { g.fillStyle = '#2a1850'; g.beginPath(); g.arc(-192, 0, 11, 0, TAU); g.fill(); } });
    /* the store sign: plain text, no logos */
    P.stores = cardPiece(560, 290, CREAM, [['WALMART', 78, INK, -84], ['TARGET', 78, INK, 4], ['BEST BUY', 78, INK, 92]], { r: 10, ring: TEAL });
    /* the big case: a plain cover with our own type only */
    P.bigCase = piece([-200, -270, 200, 270], function (g) { rr(g, -200, -270, 400, 540, 12); }, DEEP, { sx: 8, sy: 16, blur: 24, extra: function (g) {
      g.fillStyle = 'rgba(255,255,255,.08)'; g.fillRect(-200, -270, 30, 540);
      g.fillStyle = HOT; g.fillRect(-150, -60, 300, 12); g.fillStyle = ORG; g.fillRect(-150, 40, 220, 10);
      g.strokeStyle = 'rgba(251,240,234,.35)'; g.lineWidth = 3; rr(g, -170, -246, 350, 492, 8); g.stroke();
    } });
    P.title = cardPiece(340, 170, DEEP, [['GTA:', 66, CREAM, -40], ['SAN ANDREAS', 66, CREAM, 38]], { r: 0, sy: 0, edge: false });
    P.mTile = cardPiece(200, 200, CREAM, [['M', 120, INK, -22], ['MATURE 17+', 40, INK, 66]], { r: 8, ring: HOT });
    P.year = cardPiece(270, 140, ORG, [['2005', 112, INK, 6]], { r: 10 });
    /* the locked box: kraft paper, a cream label, a padlock; it never opens */
    P.box = piece([-290, -210, 290, 210], function (g) { rr(g, -290, -210, 580, 420, 10); }, KR, { sx: 8, sy: 16, blur: 22, extra: function (g) {
      g.fillStyle = KR2; g.fillRect(-290, -210, 580, 70); g.fillStyle = 'rgba(255,255,255,.15)'; g.fillRect(-290, -210, 580, 8);
      g.fillStyle = 'rgba(80,45,15,.35)'; g.fillRect(-12, -210, 24, 420);
    } });
    P.boxLabel = cardPiece(500, 180, CREAM, [['HIDDEN SCENE', 76, INK, -32], ['LOCKED ON THE DISC', 54, HOT, 50]], { r: 6 });
    P.lockBody = piece([-60, -50, 60, 50], function (g) { rr(g, -60, -50, 120, 100, 14); }, '#c9ccd8', { sx: 3, sy: 6, blur: 8, extra: function (g) { g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(-60, -50, 120, 12); g.fillStyle = '#2a1850'; g.beginPath(); g.arc(0, -4, 12, 0, TAU); g.fill(); g.fillRect(-5, 0, 10, 26); } });
    P.keyTag = cardPiece(450, 100, ORG, [['“HOT COFFEE” MOD', 56, INK, 4]], { r: 8 });
    P.src = cardPiece(560, 170, ORG, [['RATINGS BOARD (ESRB)', 58, INK, -36], ['JULY 20, 2005', 58, INK, 40]], { r: 8 });
    P.newv = cardPiece(430, 170, CREAM, [['NEW VERSION', 58, INK, -36], ['SCENE REMOVED', 58, HOT, 40]], { r: 8, ring: TEAL });
    P.key = piece([-120, -26, 20, 26], function (g) { g.beginPath(); g.arc(-90, 0, 26, 0, TAU); g.moveTo(-64, -7); g.lineTo(20, -7); g.lineTo(20, 7); g.lineTo(10, 7); g.lineTo(10, 18); g.lineTo(0, 18); g.lineTo(0, 7); g.lineTo(-64, 7); g.closePath(); }, '#e6b866', { sx: 3, sy: 5, blur: 6, edge: 1.4, after: function (g) { g.fillStyle = '#7a4d27'; g.beginPath(); g.arc(-90, 0, 9, 0, TAU); g.fill(); } });
    /* the one hero sticker: a plain AO letter tile of our own over the M tile (not the ratings board's icon design) */
    P.ao = cardPiece(250, 250, HOT, [['AO', 150, INK, -16], ['ADULTS ONLY', 42, INK, 90]], { r: 12, ring: CREAM, sy: 12 });
    P.blade = piece([-120, -16, 150, 16], function (g) { g.beginPath(); g.moveTo(-10, -9); g.lineTo(150, -1); g.lineTo(148, 3); g.lineTo(-10, 10); g.closePath(); g.moveTo(-14, -6); g.lineTo(-58, -10); g.lineTo(-62, 4); g.lineTo(-14, 6); g.closePath(); }, '#dfe3ea', { sx: 4, sy: 7, blur: 8, edge: 1.6 });
    P.handle = piece([-125, -36, -50, 36], function (g) { g.beginPath(); g.ellipse(-88, 0, 36, 26, 0, 0, TAU); g.ellipse(-88, 0, 22, 14, 0, 0, TAU, true); }, ORG, { sx: 4, sy: 7, blur: 8, edge: 1.6 });
    /* the end: a date page, the question card, two identical tags */
    P.padBack = piece([-PAD_W / 2, -PAD_H / 2, PAD_W / 2, PAD_H / 2], function (g) { rr(g, -PAD_W / 2, -PAD_H / 2, PAD_W, PAD_H, 12); }, '#e7d6bd', { sx: 6, sy: 12, blur: 18 });
    P.binding = piece([-PAD_W / 2 - 6, -PAD_H / 2 - 10, PAD_W / 2 + 6, -PAD_H / 2 + 52], function (g) { rr(g, -PAD_W / 2 - 6, -PAD_H / 2 - 10, PAD_W + 12, 62, 10); }, ORG, { sx: 3, sy: 6, blur: 8, extra: function (g) { [-90, 90].forEach(function (x) { g.fillStyle = '#2a1850'; g.beginPath(); g.arc(x, -PAD_H / 2 + 22, 12, 0, TAU); g.fill(); }); } });
    P.nov = cardPiece(PAD_W - 24, PAD_H - 70, CREAM, [['GTA 6', 60, HOT, -58], ['NOV 19', 110, INK, 34]], { r: 6, sy: 3 });
    P.question = cardPiece(820, 290, CREAM, [['SHOULD HIDDEN CONTENT', 76, INK, -52], ['CHANGE A RATING?', 76, INK, 46]], { r: 12, before: function (g) { g.fillStyle = HOT; g.fillRect(-410, -145, 16, 290); } });
    function tagPiece(word) { return cardPiece(290, 140, CREAM, [[word, 96, INK, 6, null, 16]], { path: tagPath(290, 140), after: function (g) { g.fillStyle = '#5a3a1a'; g.beginPath(); g.arc(-121, 0, 8, 0, TAU); g.fill(); } }); }
    P.yes = tagPiece('YES'); P.no = tagPiece('NO');
    P.pin = piece([-16, -16, 16, 16], function (g) { g.beginPath(); g.arc(0, 0, 14, 0, TAU); }, TEAL, { sx: 3, sy: 5, blur: 5, edge: 1.5 });
  }

  /* =====================================================================================================
     THE PROPS (screen space). Times live in T, set in initTimes from the voice.
     ===================================================================================================== */
  var T = {}, LIVE2 = { bg: true, clip: true };
  function seamS(t) { return t < DUR / 2 ? t : t - DUR; }
  function riseY(t, tin, tout, depth, w) { var k = cd(t, tin, w || 13), o = eio(seg(t, tout, tout + .42)); return (1 - k) * depth + o * depth; }

  /* the shelf. State A (hook, and the loop's last beat): one empty slot over a GTA label, the PULLED tag hanging
     in it. State B (pulled): a full shelf whose cases all drop away on "every copy". */
  var SH = { x: 510, y: 1000 }, ROWS = [-170, 230], SLOT = 3, GAP = { 2: 1, 3: 1 };
  function stateB(t) { return t > T.shelf2In - .1 && t < T.shelf2Out + .6; }
  function shelfY(t) {
    if (t < T.shelfOut + .5) return eio(seg(t, T.shelfOut, T.shelfOut + .42)) * 1100;
    if (t >= T.shelf2In - .02 && t < T.shelf2Out + .5) return riseY(t, T.shelf2In, T.shelf2Out, 1100, 12);
    if (t >= DUR - .55) return (1 - eio(seg(t, DUR - .5, DUR - .06))) * 1100;
    return null;
  }
  function shelf(g, t) {
    var dy = shelfY(t); if (dy === null) return;
    var B = stateB(t);
    g.save(); g.translate(SH.x, SH.y + dy);
    put(g, P.shelfBack, 0, 0);
    ROWS.forEach(function (ry, r) {
      for (var i = 0; i < 6; i++) {
        if (!B && r === 0 && GAP[i]) continue;
        var x = -312 + i * 125, fall = 0, rot = 0, a = 1;
        if (!B && r === 0 && i === 4) { var so = t < DUR / 2 ? eio(seg(t, .4, .9)) : 0; if (so >= 1) continue; g.save(); g.globalAlpha *= 1 - seg(so, .55, 1); put(g, P.gtaCase, x + so * 30, ry - 93 - so * 230, so * .25); g.restore(); continue; }
        if (B) { var t0 = T.drop0 + ((r ? 5 - i : i) * .06 + r * .1), k = seg(t, t0, t0 + .45); fall = k * k * 760; rot = k * (i % 2 ? .5 : -.45); a = 1 - seg(k, .8, 1); }
        if (a <= 0) continue;
        g.save(); g.globalAlpha *= a; put(g, P.cases[(i + r * 2) % P.cases.length], x, ry - 93 + fall, rot + ((i + r) % 3 - 1) * .015); g.restore();
      }
      put(g, P.board, 0, ry);
    });
    if (!B) { NOREC = dy > 1; putW(g, P.gtaLabel, -312 + SLOT * 125, ROWS[0] + 74); NOREC = false; }
    g.restore();
  }
  /* the PULLED tag hangs from a nail in the empty slot; it is swinging through the loop point and knocks on "pulled" */
  function pulledTag(g, t) {
    var dy = shelfY(t); if (dy === null || stateB(t)) return;
    var s = seamS(t), env = Math.exp(-Math.pow(s / 1.1, 2));
    var a = .16 * Math.sin(TAU * s / 1.3) * env + .02 * osc(t, 7) + sw(t, T.kPulled, .07, 8, 2.6);
    var hx = SH.x - 312 + 2.5 * 125, hy = SH.y - 552 + dy;
    g.save(); g.translate(hx, hy); g.rotate(a);
    g.strokeStyle = '#e9d6bd'; g.lineWidth = 3; g.beginPath(); g.moveTo(0, 0); g.lineTo(-30, 14); g.moveTo(0, 0); g.lineTo(30, 14); g.stroke();
    var k = kn(t, T.kPulled, .07);
    g.translate(0, 12 + 95); g.scale(k, k);
    NOREC = dy > 1; putW(g, P.pulled, 0, 0); NOREC = false;
    g.restore();
    g.fillStyle = '#c9ccd8'; g.beginPath(); g.arc(hx, hy, 8, 0, TAU); g.fill();
  }
  /* the big case: the year beat (title and the 2005 tile) and the fixed beat (new version, the M slaps back on) */
  function bigCase(g, t) {
    var on1 = t >= T.case1In - .02 && t < T.case1Out + .6, on2 = t >= T.case2In - .02 && t < T.case2Out + .6;
    if (!on1 && !on2) return;
    var dy = on1 ? riseY(t, T.case1In, T.case1Out, 1100, 12) : riseY(t, T.case2In, T.case2Out, 1100, 12);
    var x = 510, y = 880 + dy, CS = 1.6, drift = on1 ? .02 * seg(t, T.case1In, T.case1Out) : 0;
    NOREC = dy > 1;
    g.save(); g.translate(x, y); g.scale(1 + drift, 1 + drift); g.translate(-x, -y);
    put(g, P.bigCase, x, y, -.015 + .006 * osc(t, 5), CS);
    if (on1) putW(g, P.title, x + 8, y - 160 * CS, -.015, CS);
    if (on2 && t >= T.mBack) {
      var land = cd(t, T.mBack, 26), s = CS * lerp(1.25, 1, land) * kn(t, T.kM2, .06);
      g.save(); g.globalAlpha *= fin(t, T.mBack, .05); NOREC = NOREC || land < .98; putW(g, P.mTile, x - 110 * CS, y + 175 * CS, -.015, s); g.restore();
    }
    g.restore();
    NOREC = false;
  }
  /* the locked box: rises on "A hidden"; the key slides in with its FAN-MADE MOD tag and turns on "unlocked";
     the shackle pops in the pause; the lid never opens. In the fixed beat it comes back and the scissors cut it away. */
  function lockedBox(g, t) {
    var on1 = t >= T.boxIn - .02 && t < T.boxOut + .6, on2 = t >= T.box2In - .02 && t < T.cut + .6;
    if (!on1 && !on2) return;
    var dy, s = 1.2, x = 510, y = 900, cutK = 0, open;
    if (on1) { dy = riseY(t, T.boxIn, T.boxOut, 1100, 12); open = cd(t, T.pop, 22); }
    else { dy = (1 - cd(t, T.box2In, 13)) * 1100; s = 1; y = 860; cutK = seg(t, T.cut + .08, T.cut + .55); open = 0; }
    g.save(); g.translate(x, y + dy + cutK * cutK * 900); g.rotate(-.01 + cutK * .25); g.scale(s, s);
    put(g, P.box, 0, 0);
    NOREC = dy > 1 || cutK > 0; putW(g, P.boxLabel, 0, -40, -.01); NOREC = false;
    /* the padlock: the shackle lifts out of the body when it pops */
    g.save(); g.translate(0, 140);
    var sy = -50 - 30 * open;
    g.strokeStyle = '#9aa0b0'; g.lineWidth = 14; g.lineCap = 'round';
    g.beginPath(); g.moveTo(-34, -40); g.lineTo(-34, sy); g.arc(0, sy, 34, Math.PI, 0); g.lineTo(34, sy + 10 + 30 * (1 - open)); g.stroke();
    put(g, P.lockBody, 0, 0, open * .06);
    g.restore();
    if (on2 && t >= T.cut) { g.strokeStyle = 'rgba(251,240,234,.85)'; g.lineWidth = 4; g.beginPath(); g.moveTo(-290, -150); g.lineTo(290, -130); g.stroke(); }
    g.restore();
  }
  function keyAt(g, t) {
    if (t < T.keyIn - .02 || t > T.boxOut + .6) return;
    var dy = riseY(t, T.boxIn, T.boxOut, 1100, 12), k = cd(t, T.keyIn, 12), turn = eio(seg(t, T.turn, T.turn + .3));
    var lx = 556, ly = 900 + 168 + dy, x = lerp(lx + 260, lx, k);
    g.save(); g.translate(x, ly); g.rotate(-turn * Math.PI / 2 * .9); put(g, P.key, 20, 0); g.restore();
    g.save(); g.strokeStyle = '#e9d6bd'; g.lineWidth = 3; g.beginPath(); g.moveTo(x - 50, ly + 20); g.lineTo(x + 20, ly + 108); g.stroke(); g.restore();
    NOREC = k < .98 || dy > 1; putW(g, P.keyTag, Math.min(x + 110, 680), ly + 172, .03 + sw(t, T.keyIn + .2, .06, 8, 3)); NOREC = false;
  }
  /* the hero: a close-up on the case's rating corner. The M tile knocks on "M"; the AO sticker hovers (its shadow
     growing) through "made it AO", and slaps over the M in the written pause after "Only." */
  var CU = { S: 1.7, x: 362, y: 1080 };
  function closeUp(g, t) {
    if (t < T.cuIn - .02 || t > T.cuOut + .6) return;
    var dy = riseY(t, T.cuIn, T.cuOut, 1100, 12), push = (1 + .015 * eio(seg(t, T.cuIn, T.cuOut))) * (1 + .06 * bump(t, T.stamp, .2)), S = CU.S, tx = CU.x, ty = CU.y;
    g.save(); g.translate(0, dy); g.translate(510, 900); g.scale(push, push); g.translate(-510, -900);
    put(g, P.bigCase, tx + 110 * S, ty - 175 * S, -.015, S);
    NOREC = dy > 1 || t >= T.stamp;
    putW(g, P.mTile, tx, ty, -.015 + sw(t, T.kM, .05, 9, 3), S * kn(t, T.kM, .08));
    NOREC = false;
    if (t >= T.aoHover) {
      var hk = eio(seg(t, T.aoHover, T.stamp)), landed = t >= T.stamp, sk = landed ? cd(t, T.stamp, 30) : 0, SS = S * .92;
      var sc = landed ? lerp(1.08, 1, sk) : lerp(1.5, 1.12, hk), lift = landed ? 0 : lerp(-300, -50, hk);
      if (!landed) { g.save(); g.globalAlpha *= .45 * hk; g.fillStyle = '#05020f'; rr(g, tx - 125 * SS + 14, ty - 125 * SS + 18, 250 * SS, 250 * SS, 18); g.fill(); g.restore(); }
      /* the sticker itself is only on screen for its last quarter second of fall, so no label moves while it is read */
      if (!landed && t < T.stamp - .22) { g.restore(); return; }
      var fx = 0; if (!landed) { var fk = eio(seg(t, T.stamp - .22, T.stamp)); sc = lerp(1.25, 1.04, fk); lift = lerp(-160, 0, fk); fx = (1 - fk) * 70; }
      g.save(); g.translate(tx + fx, ty + lift); g.rotate(-.05 + (landed ? 0 : .1 * (1 - hk))); g.scale(sc * SS, sc * SS);
      NOREC = !landed || sk < .98 || dy > 1; putW(g, P.ao, 0, 0); NOREC = false; g.restore();
      /* paper dust off the slap */
      if (landed && t < T.stamp + .5) { var dk = seg(t, T.stamp, T.stamp + .5), r = mulberry(11); g.fillStyle = CREAM;
        for (var i = 0; i < 14; i++) { var an = r() * TAU, d0 = 190 + r() * 40, d = d0 + eo(dk) * (60 + r() * 90); var px = tx + Math.cos(an) * d; if (px < 150 || px > 870) continue; g.globalAlpha = (1 - dk) * .8; g.beginPath(); g.arc(px, ty + Math.sin(an) * d * .9 + dk * dk * 40, 3 + r() * 4, 0, TAU); g.fill(); }
        g.globalAlpha = 1; }
    }
    g.restore();
  }
  /* a printed card that rises a little into place and sinks away (source and version cards) */
  function cardAt(g, t, Pc, x, y, tin, tout, rot) {
    if (t < tin - .02 || t > tout + .4) return;
    var k = cd(t, tin, 14), o = eio(seg(t, tout, tout + .35));
    NOREC = k < .98 || o > 0;
    g.save(); g.globalAlpha *= fin(t, tin, .08); putW(g, Pc, x, y + (1 - k) * 50 + o * 600, (rot || 0) + .004 * osc(t, 6), kn(t, tin + .1, .04)); g.restore();
    NOREC = false;
  }
  function scissors(g, t) {
    if (t < T.cut - .7 || t > T.cut + .7) return;
    var inK = eio(seg(t, T.cut - .6, T.cut)), outK = eio(seg(t, T.cut + .15, T.cut + .6));
    var open = t < T.cut ? .55 * (.6 + .4 * Math.abs(Math.sin((t - T.cut) * 9))) : .55 * (1 - seg(t, T.cut, T.cut + .07));
    var x = lerp(760, 610, inK) + outK * 60, y = lerp(560, 732, inK) - outK * 620;
    g.save(); g.translate(x, y); g.rotate(3.0); g.scale(.95, .95);
    [-1, 1].forEach(function (k) { g.save(); g.rotate(k * open / 2); g.scale(1, k); put(g, P.handle, 0, 10); put(g, P.blade, 0, 0); g.restore(); });
    g.fillStyle = '#e6b866'; g.beginPath(); g.arc(0, 0, 8, 0, TAU); g.fill(); g.restore();
  }
  /* the store sign drops in on "Walmart" over the AO close-up, then rides the full shelf down */
  function stores(g, t) {
    if (t < T.signIn - .02 || t > T.shelf2Out + .6) return;
    var k = cd(t, T.signIn, 14), dy = t > T.shelf2Out ? eio(seg(t, T.shelf2Out, T.shelf2Out + .42)) * 1100 : 0;
    NOREC = k < .98 || dy > 1;
    g.save(); g.translate(510, lerp(-260, 470, k) + dy); g.rotate(.01 + sw(t, T.signIn + .1, .04, 7, 2.6) + .006 * osc(t, 6));
    g.strokeStyle = '#e9d6bd'; g.lineWidth = 3; g.beginPath(); g.moveTo(-200, -150); g.lineTo(-200, -420); g.moveTo(200, -150); g.lineTo(200, -420); g.stroke();
    putW(g, P.stores, 0, 0); g.restore(); NOREC = false;
  }
  function padEnd(g, t) {
    if (t < T.novIn - .02 || t > T.novOut + .6) return;
    var dy = riseY(t, T.novIn, T.novOut, 1300, 12), k = kn(t, T.kNov, .04);
    g.save(); g.translate(510, 560 + dy); g.rotate(.012 + .01 * osc(t, 5)); g.scale(1.3 * k, 1.3 * k);
    put(g, P.padBack, 0, 0); NOREC = dy > 1; putW(g, P.nov, 0, 26); NOREC = false; put(g, P.binding, 0, 0); g.restore();
  }
  function questionCard(g, t) {
    if (t < T.qIn - .02 || t > T.clear + .6) return;
    var dy = riseY(t, T.qIn, T.clear, 1100, 12);
    NOREC = dy > 1; putW(g, P.question, 510, 1000 + dy, -.01 + .005 * osc(t, 6)); NOREC = false;
  }
  /* chips and tags */
  function chipAt(g, t, text, x, y, tin, tout, o) {
    o = o || {}; if (t < tin - .02 || t > tout + .3) return;
    var k = cd(t, tin, 14); NOREC = k < .98 || t > tout;
    chip(g, text, x, y + (1 - k) * (o.from || 40) + eio(seg(t, tout, tout + .3)) * 200, { px: o.px || 48, bg: o.bg || ORG, fg: INK, a: fin(t, tin, .08), rot: o.rot || 0, s: kn(t, tin + .1, .05) });
    NOREC = false;
  }
  function dropTag(g, t, Pc, x, y, tin, tout, knock, o) {
    o = o || {}; if (t < tin - .02 || t > tout + .5) return;
    var k = cd(t, tin, 16), out = eio(seg(t, tout, tout + .4)), w2 = (Pc.w - 72) / 2;
    var yy = lerp(y - (o.from || 220), y, k) + out * 600, rot = (o.rot || 0) + sw(t, tin + .08, .08, 8, 2.8) + .015 * osc(t, 7, x) + (knock ? sw(t, knock, .05, 10, 3) : 0), s = knock ? kn(t, knock, .08) : 1;
    g.save(); g.globalAlpha *= fin(t, tin, .08); g.translate(x - w2 + 24, yy); g.rotate(rot); g.scale(s, s); g.translate(w2 - 24, 0);
    NOREC = k < .98 || out > 0; putW(g, Pc, 0, 0); NOREC = false;
    put(g, P.pin, -w2 + 24, 0);
    g.restore();
  }
  function world(g, t) {
    g.save(); if (LIVE2.bg) put(g, P.wall, 0, 0); else { g.fillStyle = BG; g.fillRect(0, 0, W, H); } g.restore();
    g.save(); g.beginPath(); if (LIVE2.clip) g.rect(BX0, 0, BX1 - BX0, LIP); else g.rect(-500, -500, 2080, LIP + 500); g.clip();
    shelf(g, t); bigCase(g, t); lockedBox(g, t); keyAt(g, t); closeUp(g, t); padEnd(g, t); questionCard(g, t);
    g.restore();
  }
  function glass(g, t) {
    pulledTag(g, t); stores(g, t);
    if (t >= T.yearIn - .02 && t < T.case1Out + .5) { var yk = cd(t, T.yearIn, 18), yo = eio(seg(t, T.case1Out, T.case1Out + .42)); NOREC = yk < .98 || yo > 0; g.save(); g.translate(745, 400 + yo * 1100); g.rotate(.05); g.scale(Math.max(.02, yk) * kn(t, T.yearIn, .1), kn(t, T.yearIn, .1)); putW(g, P.year, 0, 0); g.restore(); NOREC = false; }
    cardAt(g, t, P.src, 510, 1340, T.srcIn, T.srcOut, -.01);
    cardAt(g, t, P.newv, 600, 700, T.newIn, T.case2Out, .03);
    scissors(g, t);
    dropTag(g, t, P.yes, 330, 1300, T.vote, T.clear, T.kYes, { rot: -.02 });
    dropTag(g, t, P.no, 730, 1300, T.vote, T.clear, T.kNo, { rot: .02 });
  }
  /* ---------- captions (the voice, phrase by phrase; the hook line is carried by the picture) ---------- */
  var GLUE = { the: 1, a: 1, an: 1, your: 1, its: 1, of: 1, at: 1, to: 1, and: 1, in: 1, with: 1, on: 1, by: 1, so: 1, for: 1, own: 1, how: 1, that: 1, if: 1, you: 1, no: 1, or: 1, it: 1 };
  var NOCAP = { hook: 1, year: 1, rating: 1, pulled: 1, six: 1, end: 1 };
  var CAPS = (function () {
    var outc = [];
    VO.lines.forEach(function (l) {
      if (NOCAP[l.id]) return;   /* these lines are carried by the props (sound-off truth, two reads at most) */
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
    if (card0.t0 > at('found', 'and') - .1 && card0.t0 < start('rating')) return;
    if (card0.t0 > at('fixed', 'and') - .1) return;   /* the NEW VERSION card and the M tile carry it */   /* the key tag carries it */
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
    glass(g, t);
    g.restore();
    if (!POSTERMODE && LIVE.text) captions(g, t);
    if (LIVE.grain && NOISE && LIVE2.bg) { g.globalAlpha = .05; g.globalCompositeOperation = 'overlay'; var o = Math.floor(t * 24) * 37 % 256; g.fillStyle = g.createPattern(NOISE, 'repeat'); g.translate(-o, -o); g.fillRect(o, o, W, H); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }
  }
  function TEXTS(t) {
    var o = [];
    function Tx(id, text, a, b) { if (t >= a && t < b) o.push({ id: id, text: text, x0: 0, y0: 0, x1: 0, y1: 0 }); }
    Tx('pulled', 'PULLED', 0, T.shelfOut + .1); Tx('pulled', 'PULLED', DUR - .3, DUR + 1);
    Tx('gta', 'GTA', 0, T.shelfOut + .1); Tx('gta', 'GTA', DUR - .3, DUR + 1);
    Tx('title', 'GTA: SAN ANDREAS', T.case1In + .25, T.case1Out + .05);
    Tx('year', '2005', T.yearIn + .12, T.case1Out + .05);
    Tx('box', 'HIDDEN SCENE LOCKED ON THE DISC', T.boxIn + .25, T.boxOut + .05); Tx('box', 'HIDDEN SCENE LOCKED ON THE DISC', T.box2In + .25, T.cut + .1);
    Tx('key', '“HOT COFFEE” MOD', T.keyIn + .15, T.boxOut + .05);
    Tx('m1', 'M MATURE 17+', T.cuIn + .25, T.stamp);
    Tx('src', 'RATINGS BOARD (ESRB) JULY 20, 2005', T.srcIn + .12, T.srcOut + .05);
    Tx('ao', 'AO ADULTS ONLY', T.stamp + .1, T.cuOut + .05);
    Tx('stores', 'WALMART TARGET BEST BUY', T.signIn + .15, T.shelf2Out + .05);
    Tx('scene', 'NEW VERSION SCENE REMOVED', T.newIn + .15, T.case2Out + .05);
    Tx('m2', 'M MATURE 17+', T.mBack + .1, T.case2Out + .05);
    Tx('nov', 'GTA 6 NOV 19', T.novIn + .25, T.novOut + .05);
    Tx('q', 'SHOULD HIDDEN CONTENT CHANGE A RATING?', T.qIn + .15, T.clear + .05);
    Tx('yes', 'YES', T.vote + .15, T.clear + .05); Tx('no', 'NO', T.vote + .15, T.clear + .05);
    return o;
  }
  function need(text) { return Math.max(1.8, text.replace(/\s/g, '').length / 15 + 1.5); }

  /* ---------- events: hits placed in real pauses of the voice (vo/vad.js); beats with no free pause stay silent ---------- */
  function initTimes() {
    /* hook: frame 0 is the shelf with its empty slot and the PULLED tag swinging (it came back at the end of the last loop) */
    T.kPulled = at('hook', 'pulled');
    T.shelfOut = G('shelfS', after('hook'), 'tick', .1, .6);
    /* year: a plain case GTA: SAN ANDREAS rises; the 2005 tile pops on "2005" */
    T.case1In = T.shelfOut + .05; T.yearIn = at('year', '2005');
    T.case1Out = after('year');
    /* found: the locked box rises; the key with its FAN-MADE MOD tag slides in on "and a fan-made"; it turns on
       "unlocked"; the shackle pops in the pause. The box never opens. */
    T.boxIn = G('boxS', T.case1Out + .05, 'tick', .1, .6);
    T.keyIn = at('found', 'and') - .25; T.turn = at('found', 'unlocked');
    T.pop = G('pop', after('found'), 'thock', .3, 1);
    T.boxOut = Math.max(T.keyIn + .15 + need('“HOT COFFEE” MOD') + .12, T.pop + .35);
    /* rating: a close-up on the case's corner; M knocks on "M"; the source chip from "ratings"; the AO sticker
       hovers through "made it AO" and slaps in the written pause after "Only." (the one hero stamp) */
    G('cuS', T.boxOut, 'tick', .15, .6); T.cuIn = T.boxOut + .3;
    T.kM = at('rating', 'M');
    T.srcIn = Math.max(at('rating', 'ratings') - .1, T.cuIn + .05);
    T.aoHover = at('rating', 'made');
    T.stamp = G('stamp', after('rating'), 'stamp', .3, 1.2, { heavy: true });
    T.srcOut = Math.max(T.stamp - .05, T.srcIn + .12 + need('RATINGS BOARD (ESRB) JULY 20, 2005') + .05);
    /* pulled: the store sign drops over the AO close-up on "Walmart"; the close-up sinks, a full shelf rises,
       and every case drops away on "every copy" */
    T.signIn = G('sign', at('pulled', 'walmart') - .05, 'tick', .15, .7);
    T.cuOut = Math.max(T.stamp + .1 + need('AO ADULTS ONLY') + .1, at('pulled', 'best'));
    T.shelf2In = T.cuOut + .1;
    T.drop0 = at('pulled', 'every');
    G('land', after('pulled'), 'land', .3, 1);
    T.shelf2Out = Math.max(T.signIn + .15 + need('WALMART TARGET BEST BUY') + .1, T.drop0 + .95);
    /* fixed: the locked box comes back; the scissors cut on "cut"; a new case rises; the M slaps back on "new" */
    T.box2In = T.shelf2Out + .12;
    T.cut = Math.max(at('fixed', 'cut'), T.box2In + .55);
    T.case2In = T.cut + .3; T.newIn = T.case2In + .1;
    T.mBack = at('fixed', 'new'); T.kM2 = at('fixed', 'M');
    T.case2Out = Math.max(after('fixed'), T.mBack + .1 + need('M MATURE 17+') + .15, T.newIn + .15 + need('NEW VERSION SCENE REMOVED') + .1);
    /* six: the date page rises; the question card rises under it before "Should"; the page sinks, YES and NO drop in
       the pause; everything sinks; the shelf with the PULLED tag rises back to frame 0 */
    T.novIn = G('novS', T.case2Out + .1, 'thock', .12, .8);
    T.kNov = at('six', 'november');
    T.clear = DUR - .55;
    T.qIn = Math.min(T.clear - .15 - need('SHOULD HIDDEN CONTENT CHANGE A RATING?') - .12, at('six', 'november'));
    T.vote = G('vote', Math.min(T.clear - need('YES') - .25, at('end', 'should') - .3), 'tick', .15, .9);
    T.novOut = T.vote + .06;
    T.kYes = T.kNo = at('end', 'rating');
    G('land0', DUR - .15, 'land', .1, .7);
    STRESS = [];
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
    var TRIM = window.SFX_TRIM || { pop: -2 };
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

  window.FILM = { bare: function () { ctx.setTransform(1, 0, 0, 1, 0, 0); stage(ctx); }, W: W, H: H, DUR: DUR, POSTER: 0, SLUG: 'gta-pulled', SHOTS: [], init: init, render: render, frame: frame, LIVE: LIVE, LIVE2: LIVE2, T: T, GT: GT };
  var _bt = buildTextures; buildTextures = function () { _bt(); EV.length = 0; initTimes(); window.FILM.POSTER = Math.round((T.stamp + .6) * 30) / 30 + 1 / 60;
    window.FILM.SHOTS = [{ id: 'hook', name: 'Pulled off the shelf', t0: 0, t1: start('found') }, { id: 'found', name: 'Locked on the disc', t0: start('found'), t1: T.cuIn }, { id: 'rating', name: 'M to AO', t0: T.cuIn, t1: T.shelf2In }, { id: 'pulled', name: 'Every copy pulled', t0: T.shelf2In, t1: T.box2In }, { id: 'fixed', name: 'M back', t0: T.box2In, t1: T.novIn }, { id: 'vote', name: 'Yes or no?', t0: T.novIn, t1: DUR }]; };
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
