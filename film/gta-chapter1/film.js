/* "Use these before Chapter 2": Delta, launch week. GTA 6 Ultimate Edition's Jason's Safehouse Vehicles (Dinka Enduro,
   Crest Kayak) and the Ganado Retro Build (rockstargames.com/VI/editions, PS Store, Xbox Store) are Chapter 1 only per
   VGC's guide (Nov 18 2026; Vice, Red Bull, outputlag agree); Rockstar's own page and the store pages never say so (no
   "chapter" on them, checked Nov 20). Jason's car is lost at the end of Chapter 1 (Game Rant, TheGamer). No "impounded".
   All drawn by us: a cut-paper garage whose roll-up door is the film's clock. Sources in BRIEF.md.
   A vertical film written in code, narrated first and cut to the voice: every beat is keyed to a word time from vo/vo.js
   (window.VO) with at(id, word); every hit sits in a pause the voice track really leaves (vo/vad.js). Pure function of t.
   Contract: window.FILM, DUR, render(t), READY, EV, TEXTS(t), SCORE(ctx). Engine from gta-heroes; set and moves new. */
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
     THE SET: Jason's safehouse garage at night, all cut paper. Pink stucco, a teal-framed opening, a roll-up door
     (the native move: rolls up on frame 0, drops a notch per beat, slams on "Chapter 2", rolls up again for the
     loop). Inside: the green dirt bike, the orange kayak on a wall rack, the worn pickup nose-out. Every item wears a
     paper claim tag. World coordinates = screen at camera 1; the camera only pushes a little (<= 1.06) so nothing
     crosses the rail; big moves are lift-outs (an item leaves the set and grows toward the camera).
     ===================================================================================================== */
  INK = '#1b1712';
  var CRM = '#fbf5e6', RED2 = '#cf2a33', PINKG = '#d81b6a', CORAL = '#e0533d', CORALD = '#b8321f';
  var MAN = '#ecd29e', LAB = '#6b4f27', MONO = '"Geist Mono"', NOTE = '#ffe066';
  var STUC = '#e48aa0', STUC2 = '#c86d86', TRIM = '#1f9e93', SLAT = '#efe6d2', SLAT2 = '#cfc2a6';
  var WALL = '#f2c674', FLOOR = '#8c7a62', GREEN = '#5e7031', GREEN2 = '#44541d', GREEN3 = '#7d8f45';
  var ORANGE = '#ff7a1a', ORANGE2 = '#d65a08', ORANGE3 = '#ffa35c', TRUCK = '#c4ad86', TRUCK2 = '#9f8a66', RUST = '#a5562b';
  var TIRE = '#1d1b1f', CHROME = '#dfe4ea', GLASS = '#2b3f63';
  var D = {};
  var OX0 = 110, OX1 = 910, OY0 = 700, OY1 = 1400;
  var BIKE = { x: 300, y: 1175 }, KAY = { x: 505, y: 826 }, TRK = { x: 712, y: 1112 };

  function mono(g, rec, s, x, y, px, col, o) {
    o = o || {}; g.save(); font(g, px, o.wt || 700, MONO); ls(g, o.ls == null ? 2 : o.ls);
    g.fillStyle = col; g.textAlign = o.align || 'left'; g.textBaseline = 'middle';
    if (o.max) while (g.measureText(s).width > o.max && px > 36) { px -= 2; font(g, px, o.wt || 700, MONO); }
    g.fillText(s, x, y);
    var w = g.measureText(s).width, x0 = o.align === 'center' ? x - w / 2 : o.align === 'right' ? x - w : x;
    if (rec) rec.push([x0, y - px * .55, x0 + w, y + px * .45, s]); g.restore(); return w;
  }
  function circ(g, x, y, r) { g.moveTo(x + r, y); g.arc(x, y, r, 0, TAU); }
  function poly(g, pts) { g.moveTo(pts[0][0], pts[0][1]); for (var i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]); g.closePath(); }
  function fillPath(g, col, f) { g.beginPath(); f(g); g.fillStyle = col; g.fill(); }

  /* ---------- the dirt bike (side view, facing right), army-fatigue green, origin = its centre, ground +118 ---------- */
  function wheel(g, x, y, r) {
    g.beginPath(); g.arc(x, y, r, 0, TAU); g.fillStyle = TIRE; g.fill();
    for (var i = 0; i < 22; i++) { var a = i / 22 * TAU; g.save(); g.translate(x + Math.cos(a) * (r - 2), y + Math.sin(a) * (r - 2)); g.rotate(a); g.fillStyle = '#2e2b31'; g.fillRect(-4, -5, 8, 10); g.restore(); }
    g.beginPath(); g.arc(x, y, r - 16, 0, TAU); g.fillStyle = '#3b3842'; g.fill();
    g.strokeStyle = 'rgba(220,226,234,.55)'; g.lineWidth = 2; for (i = 0; i < 12; i++) { var b = i / 12 * TAU; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(b) * (r - 17), y + Math.sin(b) * (r - 17)); g.stroke(); }
    g.beginPath(); g.arc(x, y, 13, 0, TAU); g.fillStyle = CHROME; g.fill(); g.beginPath(); g.arc(x, y, 5, 0, TAU); g.fillStyle = '#7d8590'; g.fill();
  }
  function buildBike() {
    var RW = [-108, 56], FW = [118, 56], R = 62;
    function path(g) {
      g.beginPath(); circ(g, RW[0], RW[1], R); circ(g, FW[0], FW[1], R);
      poly(g, [[-178, -40], [-60, -54], [30, -62], [66, -76], [84, -64], [62, -8], [28, 42], [-30, 44], [-104, 62], [-114, 48], [-44, 2], [-150, -20]]);
      poly(g, [[60, -78], [78, -82], [126, 50], [110, 58]]);
      poly(g, [[48, -108], [100, -104], [100, -92], [48, -96]]);
      poly(g, [[86, -30], [182, -30], [174, -16], [94, -14]]);
    }
    D.bike = piece([-185, -112, 185, 120], path, GREEN, { sy: 8, sx: 5, blur: 10, sc: 'rgba(0,0,0,.45)', noclip: true, extra: function (g) {
      wheel(g, RW[0], RW[1], R); wheel(g, FW[0], FW[1], R);
      /* swingarm, engine, exhaust */
      g.save(); g.strokeStyle = GREEN2; g.lineWidth = 12; g.lineCap = 'round'; g.beginPath(); g.moveTo(RW[0], RW[1]); g.lineTo(-24, 22); g.stroke(); g.restore();
      rr(g, -34, -6, 76, 52, 8); g.fillStyle = '#3c3a3f'; g.fill(); g.fillStyle = 'rgba(255,255,255,.12)'; for (var i = 0; i < 4; i++) g.fillRect(-26, 2 + i * 11, 60, 4);
      g.save(); g.strokeStyle = CHROME; g.lineWidth = 10; g.lineCap = 'round'; g.beginPath(); g.moveTo(10, 40); g.quadraticCurveTo(-60, 30, -150, -8); g.stroke(); g.restore();
      /* fork stanchions */
      g.save(); g.strokeStyle = CHROME; g.lineWidth = 9; g.lineCap = 'round'; g.beginPath(); g.moveTo(80, -60); g.lineTo(114, 44); g.stroke(); g.restore();
      /* tank + side panel tones, seat, number board */
      fillPath(g, GREEN3, function (q) { poly(q, [[-10, -58], [30, -62], [64, -74], [56, -40], [0, -36]]); });
      fillPath(g, GREEN2, function (q) { poly(q, [[-150, -20], [-60, -30], [-40, 0], [-110, 30]]); });
      fillPath(g, '#141316', function (q) { poly(q, [[-150, -44], [-50, -58], [10, -64], [8, -54], [-56, -46], [-146, -34]]); });
      rr(g, 96, -60, 42, 34, 6); g.fillStyle = '#e9e2cf'; g.fill();
      /* handlebar grip, front fender tone */
      g.save(); g.strokeStyle = '#141316'; g.lineWidth = 10; g.lineCap = 'round'; g.beginPath(); g.moveTo(52, -102); g.lineTo(96, -99); g.stroke(); g.restore();
      fillPath(g, GREEN3, function (q) { poly(q, [[94, -28], [178, -28], [174, -22], [96, -22]]); });
      /* stencilled fatigue marks: a few darker blotches */
      g.globalAlpha = .35; fillPath(g, GREEN2, function (q) { q.ellipse(-90, -26, 22, 8, -.2, 0, TAU); q.moveTo(30, -50); q.ellipse(22, -50, 14, 6, .3, 0, TAU); }); g.globalAlpha = 1;
    } });
  }
  /* ---------- the kayak (horizontal), orange ---------- */
  function buildKayak() {
    var L = 350, Hh = 46;
    function path(g) { g.beginPath(); g.moveTo(-L, 0); g.bezierCurveTo(-L * .55, -Hh * 1.05, L * .55, -Hh * 1.05, L, 0); g.bezierCurveTo(L * .55, Hh * .95, -L * .55, Hh * .95, -L, 0); g.closePath(); }
    D.kayak = piece([-L - 4, -Hh, L + 4, Hh], path, ORANGE, { sy: 8, sx: 4, blur: 10, sc: 'rgba(0,0,0,.4)', extra: function (g) {
      g.fillStyle = ORANGE2; g.beginPath(); g.moveTo(-L, 0); g.bezierCurveTo(-L * .55, Hh * .95, L * .55, Hh * .95, L, 0); g.bezierCurveTo(L * .5, Hh * .45, -L * .5, Hh * .45, -L, 0); g.fill();
      g.fillStyle = ORANGE3; g.beginPath(); g.moveTo(-L + 30, -6); g.bezierCurveTo(-L * .5, -Hh * .8, L * .5, -Hh * .8, L - 30, -6); g.bezierCurveTo(L * .5, -Hh * .55, -L * .5, -Hh * .55, -L + 30, -6); g.fill();
      g.beginPath(); g.ellipse(-10, -10, 78, 19, 0, 0, TAU); g.fillStyle = '#ffc08a'; g.fill(); g.beginPath(); g.ellipse(-10, -10, 68, 13, 0, 0, TAU); g.fillStyle = '#2a1a12'; g.fill();
      g.strokeStyle = '#1d1b1f'; g.lineWidth = 2.5; [-210, 190].forEach(function (x) { g.beginPath(); g.moveTo(x - 46, -20); g.lineTo(x + 46, 4); g.moveTo(x - 46, 4); g.lineTo(x + 46, -20); g.stroke(); });
      [[-L + 12, 0], [L - 12, 0]].forEach(function (p) { g.beginPath(); g.arc(p[0], p[1], 6, 0, TAU); g.fillStyle = '#1d1b1f'; g.fill(); });
    } });
  }
  /* ---------- the pickup, side view (the build beat), low-riding ---------- */
  function buildTruckS() {
    var WA = [-262, 94], WB = [298, 94], R = 58;
    function path(g) {
      g.beginPath();
      g.moveTo(-408, -40); g.lineTo(60, -40); g.lineTo(78, -150); g.lineTo(226, -150); g.quadraticCurveTo(250, -150, 262, -60); g.lineTo(392, -50); g.quadraticCurveTo(412, -40, 412, 10); g.lineTo(412, 84); g.lineTo(-408, 84); g.closePath();
      circ(g, WA[0], WA[1], R); circ(g, WB[0], WB[1], R);
    }
    D.truckS = piece([-412, -154, 416, 156], path, TRUCK, { sy: 10, sx: 6, blur: 14, sc: 'rgba(0,0,0,.45)', noclip: true, extra: function (g) {
      fillPath(g, GLASS, function (q) { poly(q, [[94, -136], [214, -136], [236, -66], [90, -66]]); });
      g.fillStyle = 'rgba(255,255,255,.18)'; g.beginPath(); poly(g, [[130, -136], [150, -136], [134, -66], [114, -66]]); g.fill();
      g.strokeStyle = 'rgba(60,45,25,.45)'; g.lineWidth = 3; g.beginPath(); g.moveTo(60, -40); g.lineTo(60, 80); g.moveTo(240, -60); g.lineTo(244, 80); g.moveTo(-408, -26); g.lineTo(52, -26); g.stroke();
      g.fillStyle = '#5d5145'; g.fillRect(200, -20, 26, 7);
      [WA, WB].forEach(function (p) { g.beginPath(); g.arc(p[0], p[1], R + 6, Math.PI, 0); g.fillStyle = '#2a2622'; g.fill(); wheel(g, p[0], p[1], R); });
      g.globalAlpha = .8; fillPath(g, RUST, function (q) { q.ellipse(-330, 60, 26, 12, .2, 0, TAU); q.moveTo(370, 50); q.ellipse(360, 50, 16, 20, 0, 0, TAU); q.moveTo(-120, -32); q.ellipse(-120, -32, 22, 5, 0, 0, TAU); }); g.globalAlpha = 1;
      rr(g, 396, 40, 24, 40, 6); g.fillStyle = '#b3aca0'; g.fill();
      g.beginPath(); g.arc(398, -10, 14, 0, TAU); g.fillStyle = '#fff3c4'; g.fill();
    } });
  }
  /* the retro mods, painted live over the side view: k1 two-tone stripe swipe, k2 chrome + whitewalls */
  function retroMods(g, k1, k2) {
    if (k1 > 0) {
      var xe = lerp(-408, 412, eio(k1));
      g.save(); g.beginPath(); g.rect(-410, -160, xe + 410, 320); g.clip();
      g.fillStyle = '#f6ead0'; g.beginPath(); g.moveTo(-408, 0); g.lineTo(60, 0); g.lineTo(64, -22); g.lineTo(262, -22); g.lineTo(392, -14); g.lineTo(410, 0); g.lineTo(410, 30); g.lineTo(-408, 30); g.closePath(); g.fill();
      g.fillStyle = CORAL; g.fillRect(-408, 36, 818, 7); g.fillRect(-408, -6, 470, 5);
      g.restore();
    }
    if (k2 > 0) {
      [[-262, 94], [298, 94]].forEach(function (p) {
        g.save(); g.translate(p[0], p[1]); var s = lerp(1.3, 1, eo(k2)); g.scale(s, s); g.globalAlpha *= clamp(k2 * 3, 0, 1);
        g.beginPath(); g.arc(0, 0, 44, 0, TAU); g.lineWidth = 12; g.strokeStyle = '#fbf7ec'; g.stroke();
        g.beginPath(); g.arc(0, 0, 28, 0, TAU); g.fillStyle = CHROME; g.fill(); g.beginPath(); g.arc(0, 0, 10, 0, TAU); g.fillStyle = '#8a929c'; g.fill();
        g.restore();
      });
      g.save(); g.globalAlpha *= clamp(k2 * 3, 0, 1); rr(g, 390, 34, 34, 50, 8); g.fillStyle = CHROME; g.fill(); rr(g, -420, 34, 26, 50, 8); g.fill(); g.restore();
    }
  }

  /* ---------- claim tags (manila luggage tags on a string), plain and coral ---------- */
  var TAGW = 236, TAGH = 196;
  /* L = [top (mono), main, bottom]; L === null draws the blank back face (a paper clock, no words) */
  function tagPiece(bg, fgA, fgB, L, w) {
    w = w || TAGW; var h = TAGH, rec = [];
    var pc = piece([-w / 2, -h / 2, w / 2, h / 2], function (g) { g.beginPath(); poly(g, [[-w / 2, -h / 2 + 34], [-w / 2 + 34, -h / 2], [w / 2 - 34, -h / 2], [w / 2, -h / 2 + 34], [w / 2, h / 2], [-w / 2, h / 2]]); }, bg, { sy: 7, sx: 4, blur: 9, sc: 'rgba(0,0,0,.45)', extra: function (g) {
      g.beginPath(); g.arc(0, -h / 2 + 22, 15, 0, TAU); g.fillStyle = 'rgba(255,255,255,.55)'; g.fill(); g.beginPath(); g.arc(0, -h / 2 + 22, 7, 0, TAU); g.fillStyle = '#1b1712'; g.fill();
      if (!L) {
        var cy = 22; g.beginPath(); g.arc(0, cy, 58, 0, TAU); g.lineWidth = 9; g.strokeStyle = fgB; g.stroke();
        g.lineCap = 'round'; g.lineWidth = 9; g.beginPath(); g.moveTo(0, cy); g.lineTo(0, cy - 38); g.moveTo(0, cy); g.lineTo(26, cy + 12); g.stroke();
        g.beginPath(); g.arc(0, cy, 7, 0, TAU); g.fillStyle = fgA; g.fill();
        return;
      }
      mono(g, rec, L[0], 0, -h / 2 + 64, 36, fgB, { align: 'center', ls: L[0].length > 6 ? 1 : 3, max: w - 16 });
      ptxt(g, rec, L[1], 0, -h / 2 + 112, 50, fgA, { ls: 1, max: w - 20 });
      g.fillStyle = fgB; g.globalAlpha = .4; g.fillRect(-w / 2 + 18, -h / 2 + 140, w - 36, 2); g.globalAlpha = 1;
      ptxt(g, rec, L[2], 0, -h / 2 + 168, 38, fgB, { ls: 3, max: w - 24 });
    } });
    return wordsOf(pc, rec);
  }
  /* a tag hanging from an anchor (local coords of whatever it is tied to); a = swing angle */
  /* F = { back, face, hot }; fl = flip progress 0 (blank back) .. 1 (words); the card turns edge-on halfway */
  function hangTag(g, ax, ay, a, s, hot, alpha, F, fl) {
    if (alpha <= 0) return;
    g.save(); g.globalAlpha *= alpha; g.translate(ax, ay); g.rotate(a); g.scale(s, s);
    g.strokeStyle = '#efe6d2'; g.lineWidth = 3; g.beginPath(); g.moveTo(0, 0); g.lineTo(0, 44); g.stroke();
    g.beginPath(); g.arc(0, 0, 5, 0, TAU); g.fillStyle = '#efe6d2'; g.fill();
    var sx = Math.abs(Math.cos(Math.PI * fl)), nr = NOREC; if (fl > 0 && fl < 1) NOREC = true;
    g.save(); g.scale(Math.max(.02, sx), 1);
    if (fl < .5) putW(g, F.back, 0, 44 - 22 + TAGH / 2);
    else { putW(g, F.face, 0, 44 - 22 + TAGH / 2); if (hot > 0) { g.globalAlpha *= hot; putW(g, F.hot, 0, 44 - 22 + TAGH / 2); } }
    g.restore(); NOREC = nr;
    g.restore();
  }

  /* ---------- printed cards (labels, note, chips, listing, checklist, calendar) ---------- */
  function strip(lines, w, bg, o) {
    o = o || {}; var lh = lines.map(function (L) { return L[1] * 1.12; }), h = lh.reduce(function (a, b) { return a + b; }, 0) + (o.pad || 34), rec = [];
    var tp = jag(o.seed || 31, w, 4), bt = jag((o.seed || 31) + 5, w, 4);
    var pc = piece([-w / 2, -h / 2 - 8, w / 2, h / 2 + 8], function (g) { g.beginPath(); g.moveTo(-w / 2, -h / 2 + tp[0][1]); tp.forEach(function (q) { g.lineTo(-w / 2 + q[0], -h / 2 + q[1]); }); for (var i = bt.length - 1; i >= 0; i--) g.lineTo(-w / 2 + bt[i][0], h / 2 + bt[i][1]); g.closePath(); }, bg, { sy: 8, sx: 5, blur: 12, extra: function (g) {
      var y = -h / 2 + (o.pad || 34) / 2;
      lines.forEach(function (L, i) { y += lh[i] / 2; if (L[3] === 'mono') mono(g, rec, L[0], 0, y + 2, L[1], L[2], { align: 'center', ls: 2, max: w - 40 }); else ptxt(g, rec, L[0], 0, y + 2, L[1], L[2], { ls: 1.5, max: w - 40 }); y += lh[i] / 2; });
    } });
    pc.sw = w; pc.sh = h; return wordsOf(pc, rec);
  }
  function buildNote() {
    var w = 600, h = 340, rec = [];
    D.note = piece([-w / 2, -h / 2, w / 2, h / 2], function (g) { g.beginPath(); g.moveTo(-w / 2, -h / 2); g.lineTo(w / 2, -h / 2); g.lineTo(w / 2, h / 2 - 34); g.lineTo(w / 2 - 40, h / 2); g.lineTo(-w / 2, h / 2); g.closePath(); }, NOTE, { sy: 12, sx: 6, blur: 16, sc: 'rgba(0,0,0,.5)', extra: function (g) {
      g.fillStyle = 'rgba(160,120,0,.18)'; g.fillRect(-w / 2, -h / 2, w, 46);
      mono(g, rec, 'VGC GUIDE · NOV 18', 0, -h / 2 + 24, 36, '#5a4300', { align: 'center', ls: 2 });
      ptxt(g, rec, '“…ONLY IN', 0, -h / 2 + 112, 96, INK, { ls: 1 });
      ptxt(g, rec, 'CHAPTER 1…”', 0, -h / 2 + 212, 96, INK, { ls: 1 });
      mono(g, rec, 'VIDEOGAMESCHRONICLE.COM', 0, h / 2 - 40, 36, '#5a4300', { align: 'center', ls: 0, max: w - 70 });
      g.fillStyle = 'rgba(0,0,0,.12)'; g.beginPath(); g.moveTo(w / 2, h / 2 - 34); g.lineTo(w / 2 - 40, h / 2); g.lineTo(w / 2 - 34, h / 2 - 30); g.closePath(); g.fill();
    } });
    wordsOf(D.note, rec);
  }
  var LSW = 780, LSH = 640, LSX = 510, LSY = 1022;
  function buildListing() {
    var w = LSW, h = LSH, rec = [];
    D.listing = piece([-w / 2, -h / 2, w / 2, h / 2], rectP(w, h, 14), '#f7f3ea', { sy: 14, sx: 6, blur: 20, sc: 'rgba(0,0,0,.55)', extra: function (g) {
      g.fillStyle = '#1c1a22'; g.fillRect(-w / 2, -h / 2, w, 64);
      mono(g, rec, 'ROCKSTARGAMES.COM', -w / 2 + 30, -h / 2 + 33, 36, '#e9e4d8', { ls: 2 });
      ptxt(g, rec, 'ULTIMATE EDITION', -w / 2 + 34, -h / 2 + 128, 88, INK, { align: 'left', ls: 1 });
      g.fillStyle = 'rgba(0,0,0,.12)'; g.fillRect(-w / 2 + 30, -h / 2 + 186, w - 60, 3);
      /* row 1: thumb with bike + kayak, text */
      function thumb(y, f) { rr(g, -w / 2 + 30, y - 66, 150, 132, 10); g.fillStyle = '#e4dccb'; g.fill(); g.save(); g.beginPath(); g.roundRect(-w / 2 + 30, y - 66, 150, 132, 10); g.clip(); f(); g.restore(); }
      thumb(-h / 2 + 280, function () { g.save(); g.translate(-w / 2 + 105, -h / 2 + 300); g.scale(.36, .36); g.drawImage(D.bike.c, D.bike.x0, D.bike.y0, D.bike.w, D.bike.h); g.restore(); g.save(); g.translate(-w / 2 + 105, -h / 2 + 236); g.scale(.2, .2); g.drawImage(D.kayak.c, D.kayak.x0, D.kayak.y0, D.kayak.w, D.kayak.h); g.restore(); });
      ptxt(g, rec, "JASON'S SAFEHOUSE VEHICLES", -w / 2 + 206, -h / 2 + 252, 52, INK, { align: 'left', ls: 1, max: w - 236 });
      ptxt(g, rec, 'DINKA ENDURO · CREST KAYAK', -w / 2 + 206, -h / 2 + 312, 42, '#56525e', { align: 'left', ls: 1, max: w - 236 });
      g.fillStyle = 'rgba(0,0,0,.1)'; g.fillRect(-w / 2 + 30, -h / 2 + 372, w - 60, 2);
      thumb(-h / 2 + 456, function () { g.save(); g.translate(-w / 2 + 105, -h / 2 + 462); g.scale(.17, .17); g.drawImage(D.truckS.c, D.truckS.x0, D.truckS.y0, D.truckS.w, D.truckS.h); g.restore(); });
      ptxt(g, rec, 'GANADO RETRO BUILD', -w / 2 + 206, -h / 2 + 428, 52, INK, { align: 'left', ls: 1, max: w - 236 });
      ptxt(g, rec, '“…EXCLUSIVE MODS.”', -w / 2 + 206, -h / 2 + 488, 42, '#56525e', { align: 'left', ls: 1, max: w - 236 });
    } });
    wordsOf(D.listing, rec);
    D.recreated = chipPiece([['RE-CREATED', 40, CRM, 2]], 250, CORALD, CRM, { lh: 44, pad: 18 });
    D.also = chipPiece([['PS STORE + XBOX STORE:', 40, INK, 1.5], ['ALSO 0 MATCHES', 48, CORALD, 1.5]], 560, CRM, INK, { lh: 50, pad: 18 });
    D.stamp0 = stampPiece([['0 MATCHES', 124]], '#d8331f', 640);
  }
  /* our find bar (a generic browser find-in-page box, drawn live: typing, then the count) */
  var FBX = 510, FBY = 622, FBW = 780, FBH = 150, FR = -30;
  function findBar(g, t) {
    var k = cd(t, T.fbIn, 14); if (t < T.fbIn) return;
    var nr = NOREC; NOREC = nr || k < .97;
    g.save(); g.translate(FBX, FBY - 160 * (1 - k)); g.globalAlpha *= fin(t, T.fbIn, .08);
    g.save(); g.shadowColor = 'rgba(0,0,0,.5)'; g.shadowBlur = 16; g.shadowOffsetY = 8; rr(g, -FBW / 2, -FBH / 2, FBW, FBH, 14); g.fillStyle = '#26232e'; g.fill(); g.restore();
    rr(g, -FBW / 2 + 16, FR - 38, 340, 76, 10); g.fillStyle = '#f7f3ea'; g.fill();
    /* a magnifier icon */
    g.save(); g.translate(-FBW / 2 + 52, FR); g.strokeStyle = '#56525e'; g.lineWidth = 5; g.beginPath(); g.arc(-3, -3, 13, 0, TAU); g.stroke(); g.beginPath(); g.moveTo(7, 7); g.lineTo(17, 17); g.stroke(); g.restore();
    var word = 'chapter', n = clamp(Math.floor((t - T.fbType) / .05) + 1, 0, word.length), typed = t < T.fbType ? '' : word.slice(0, n);
    g.save(); font(g, 50, 700, MONO); ls(g, 1); g.fillStyle = INK; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText(typed, -FBW / 2 + 84, FR + 3);
    var cw = g.measureText(typed).width; if (Math.floor(t * 3) % 2 === 0 || (t > T.fbType && t < T.fbType + .5)) g.fillRect(-FBW / 2 + 88 + cw, FR - 22, 4, 44); g.restore();
    /* the date we looked, under the box */
    mono(g, null, 'CHECKED NOV 20', -FBW / 2 + 24, 44, 36, '#c9c3d6', { ls: 2 });
    /* the count: searching, then 0 MATCHES */
    var CX = FBW / 2 - 196;
    if (t >= T.fbType + .3 && t < T.zero) ptxt(g, null, 'SEARCHING…', CX, FR + 2, 40, '#b8b2c4', { ls: 1 });
    if (t >= T.zero) { var kz = eo(seg(t, T.zero, T.zero + .14)), sz = lerp(1.5, 1, kz); NOREC = nr || kz < 1; g.save(); g.translate(CX, FR + 2); g.scale(sz, sz); ptxt(g, null, '0 MATCHES', 0, 0, 64, '#ff6a52', { ls: 1 }); g.restore(); NOREC = nr || k < .97; }
    /* the marker ring around the count, drawn after the stamp */
    if (t >= T.ring) { var kr = eio(seg(t, T.ring, T.ring + .32)); g.save(); g.strokeStyle = NOTE; g.lineWidth = 9; g.lineCap = 'round'; g.beginPath(); for (var i = 0; i <= 60 * kr; i++) { var a = -2.2 + i / 60 * TAU * 1.08, rr0 = 1 + .04 * Math.sin(i * .7); g.lineTo(CX + Math.cos(a) * 176 * rr0, FR + 2 + Math.sin(a) * 50 * rr0); } g.stroke(); g.restore(); }
    NOREC = nr; g.restore();
  }
  function buildChecklist() {
    var w = 400, h = 430, rec = [];
    D.check = piece([-w / 2, -h / 2, w / 2, h / 2], rectP(w, h, 10), MAN, { sy: 12, sx: 6, blur: 16, sc: 'rgba(0,0,0,.5)', extra: function (g) {
      g.fillStyle = CORAL; g.fillRect(-w / 2, -h / 2, w, 56);
      mono(g, rec, 'BEFORE CH. 2', 0, -h / 2 + 29, 36, CRM, { align: 'center', ls: 3 });
      ['RIDE', 'PADDLE', 'BUILD'].forEach(function (s, i) {
        var y = -h / 2 + 136 + i * 112;
        rr(g, -w / 2 + 34, y - 36, 72, 72, 8); g.lineWidth = 6; g.strokeStyle = INK; g.stroke();
        ptxt(g, rec, s, -w / 2 + 130, y + 4, 72, INK, { align: 'left', ls: 1, max: w - 150 });
      });
    } });
    wordsOf(D.check, rec);
  }
  function tickMark(g, x, y, k) {
    if (k <= 0) return; g.save(); g.strokeStyle = CORALD; g.lineWidth = 13; g.lineCap = 'round'; g.lineJoin = 'round';
    var p = [[x - 26, y - 2], [x - 6, y + 22], [x + 40, y - 40]], L1 = 31, L2 = 77, d = (L1 + L2) * eio(k);
    g.beginPath(); g.moveTo(p[0][0], p[0][1]);
    if (d <= L1) g.lineTo(lerp(p[0][0], p[1][0], d / L1), lerp(p[0][1], p[1][1], d / L1));
    else { g.lineTo(p[1][0], p[1][1]); g.lineTo(lerp(p[1][0], p[2][0], (d - L1) / L2), lerp(p[1][1], p[2][1], (d - L1) / L2)); }
    g.stroke(); g.restore();
  }
  /* the tear-off chapter pad: two pages prebuilt, flipped live */
  var CALW = 230, CALH = 250;
  function calPage(n) {
    var w = CALW, h = CALH, rec = [];
    var pc = piece([-w / 2, -h / 2, w / 2, h / 2], rectP(w, h, 8), CRM, { sy: 10, sx: 5, blur: 14, extra: function (g) {
      g.fillStyle = n === '2' ? CORALD : TRIM; g.fillRect(-w / 2, -h / 2, w, 58);
      [-w / 4, w / 4].forEach(function (x) { g.beginPath(); g.arc(x, -h / 2 + 18, 8, 0, TAU); g.fillStyle = '#20131a'; g.fill(); });
      mono(g, rec, 'CHAPTER', 0, -h / 2 + 88, 40, '#3b4566', { align: 'center', ls: 4 });
      ptxt(g, rec, n, 0, 42, 150, INK, { ls: 0 });
    } });
    return wordsOf(pc, rec);
  }

  /* ---------- the world backdrop: night sky, pink stucco, teal-framed opening, lit interior, driveway ---------- */
  var WBX = -220, WBY = -120, WBW = 1520, WBH = 2420;
  function buildWorld() {
    var c = mk(WBW, WBH), g = c.getContext('2d'), r = mulberry(23);
    g.translate(-WBX, -WBY);
    var sk = g.createLinearGradient(0, -120, 0, 640); sk.addColorStop(0, '#080d26'); sk.addColorStop(.7, '#1b1747'); sk.addColorStop(1, '#3a1f55'); g.fillStyle = sk; g.fillRect(WBX, WBY, WBW, 760);
    for (var i = 0; i < 70; i++) { g.fillStyle = 'rgba(255,245,220,' + (.25 + r() * .5).toFixed(2) + ')'; g.fillRect(WBX + r() * WBW, -100 + r() * 560, 2, 2); }
    /* a cut-paper moon: scissor-cut edge, a drop shadow, two pasted craters */
    (function () { var mx = 760, my = 170, R = 60, rm = mulberry(77); function cut(q, rr1) { q.beginPath(); for (var j = 0; j <= 40; j++) { var a = j / 40 * TAU, rj = rr1 * (1 + (rm() - .5) * .035); if (j === 0) q.moveTo(mx + Math.cos(a) * rj, my + Math.sin(a) * rj); else q.lineTo(mx + Math.cos(a) * rj, my + Math.sin(a) * rj); } q.closePath(); }
      g.save(); g.shadowColor = 'rgba(0,0,0,.55)'; g.shadowBlur = 10; g.shadowOffsetX = 4; g.shadowOffsetY = 7; cut(g, R); g.fillStyle = '#f3e7c4'; g.fill(); g.restore();
      g.save(); cut(g, R - 1); g.clip(); g.fillStyle = 'rgba(190,160,100,.35)'; g.beginPath(); g.arc(mx + 26, my + 6, R, 0, TAU); g.fill();
      g.fillStyle = 'rgba(170,140,90,.45)'; g.beginPath(); g.arc(mx - 18, my - 14, 11, 0, TAU); g.arc(mx + 8, my + 22, 7, 0, TAU); g.fill();
      for (var j = 0; j < 160; j++) { g.fillStyle = rm() < .5 ? 'rgba(255,255,255,.25)' : 'rgba(120,90,40,.18)'; g.fillRect(mx - R + rm() * 2 * R, my - R + rm() * 2 * R, 2, 2); }
      g.restore(); })();
    /* the house: flat roof, teal parapet, pink stucco */
    g.fillStyle = '#16807a'; g.fillRect(WBX, 586, WBW, 40);
    g.fillStyle = TRIM; g.fillRect(WBX, 586, WBW, 12);
    var st = g.createLinearGradient(0, 626, 0, 1440); st.addColorStop(0, '#d97b95'); st.addColorStop(.5, STUC); st.addColorStop(1, STUC2); g.fillStyle = st; g.fillRect(WBX, 626, WBW, 820);
    for (i = 0; i < 2600; i++) { g.fillStyle = r() < .5 ? 'rgba(255,255,255,.07)' : 'rgba(90,20,50,.08)'; g.fillRect(WBX + r() * WBW, 626 + r() * 800, 1 + r() * 3, 1 + r() * 3); }
    /* a warm wash from the lamp over the door */
    var lw = g.createRadialGradient(510, 660, 20, 510, 660, 520); lw.addColorStop(0, 'rgba(255,220,150,.45)'); lw.addColorStop(1, 'rgba(255,220,150,0)'); g.fillStyle = lw; g.fillRect(-100, 600, 1220, 700);
    /* the opening: lit interior */
    var iw = g.createLinearGradient(0, OY0, 0, OY1); iw.addColorStop(0, '#f8d892'); iw.addColorStop(.7, WALL); iw.addColorStop(1, '#d9a85a'); g.fillStyle = iw; g.fillRect(OX0, OY0, OX1 - OX0, OY1 - OY0);
    /* pegboard with tool silhouettes, a shelf with cans, kayak brackets */
    g.fillStyle = '#c99a58'; g.fillRect(140, 900, 290, 150); g.fillStyle = 'rgba(80,50,20,.35)'; for (var px = 152; px < 430; px += 18) for (var py = 912; py < 1050; py += 18) g.fillRect(px, py, 3, 3);
    g.fillStyle = 'rgba(60,40,25,.65)'; g.fillRect(170, 925, 12, 90); g.fillRect(160, 925, 32, 16); g.fillRect(230, 935, 70, 10); g.fillRect(286, 925, 14, 30); g.beginPath(); g.arc(370, 975, 26, 0, TAU); g.fill();
    g.fillStyle = '#8a5a2e'; g.fillRect(560, 900, 330, 14); [600, 650, 720, 800].forEach(function (x, j) { g.fillStyle = ['#2347c8', '#e0533d', '#f2f0e8', '#1f9e93'][j]; g.fillRect(x, 858, 36, 42); });
    g.fillStyle = '#3b2c22'; [[300, 856], [712, 856]].forEach(function (p) { g.fillRect(p[0] - 8, p[1] - 8, 16, 46); g.fillRect(p[0] - 30, p[1] + 26, 60, 12); });
    g.fillStyle = FLOOR; g.fillRect(OX0, 1296, OX1 - OX0, OY1 - 1296); g.fillStyle = 'rgba(30,20,10,.25)'; g.beginPath(); g.ellipse(640, 1350, 120, 22, 0, 0, TAU); g.fill();
    var sh = g.createLinearGradient(0, OY0, 0, OY0 + 60); sh.addColorStop(0, 'rgba(40,20,10,.35)'); sh.addColorStop(1, 'rgba(40,20,10,0)'); g.fillStyle = sh; g.fillRect(OX0, OY0, OX1 - OX0, 60);
    /* teal door frame and the roll box */
    g.fillStyle = TRIM; g.fillRect(OX0 - 22, OY0 - 30, 22, OY1 - OY0 + 30); g.fillRect(OX1, OY0 - 30, 22, OY1 - OY0 + 30); g.fillRect(OX0 - 22, OY0 - 30, OX1 - OX0 + 44, 30);
    g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(OX0 - 22, OY0 - 4, OX1 - OX0 + 44, 4);
    /* driveway */
    g.fillStyle = '#4a4652'; g.fillRect(WBX, 1400, WBW, 1000); g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(WBX, 1400, WBW, 14);
    g.strokeStyle = 'rgba(20,18,26,.5)'; g.lineWidth = 3; g.beginPath(); g.moveTo(200, 1414); g.lineTo(160, 1700); g.moveTo(860, 1414); g.lineTo(900, 1700); g.moveTo(-60, 1640); g.lineTo(1080, 1640); g.moveTo(-60, 1880); g.lineTo(1080, 1880); g.stroke();
    /* a paper crack, an oil stain, tyre tracks */
    g.strokeStyle = 'rgba(20,18,26,.55)'; g.lineWidth = 4; g.beginPath(); g.moveTo(420, 1660); g.lineTo(470, 1700); g.lineTo(455, 1745); g.lineTo(520, 1790); g.stroke();
    g.fillStyle = 'rgba(15,12,22,.45)'; g.beginPath(); g.ellipse(640, 1520, 110, 26, 0, 0, TAU); g.fill(); g.beginPath(); g.ellipse(700, 1540, 46, 12, .2, 0, TAU); g.fill();
    g.fillStyle = 'rgba(25,22,32,.35)'; g.fillRect(470, 1414, 38, 520); g.fillRect(800, 1414, 38, 520);
    /* a traffic cone (left) and a coiled garden hose (right) */
    g.save(); g.translate(170, 1600); g.save(); g.shadowColor = 'rgba(0,0,0,.5)'; g.shadowBlur = 8; g.shadowOffsetX = 4; g.shadowOffsetY = 6;
    g.fillStyle = '#ff7a1a'; g.beginPath(); g.moveTo(-14, -120); g.lineTo(14, -120); g.lineTo(46, 0); g.lineTo(-46, 0); g.closePath(); g.fill(); g.restore();
    g.fillStyle = '#f7f1e2'; g.beginPath(); g.moveTo(-26, -64); g.lineTo(26, -64); g.lineTo(32, -40); g.lineTo(-32, -40); g.closePath(); g.fill();
    g.fillStyle = '#d65a08'; g.fillRect(-64, 0, 128, 18); g.restore();
    g.save(); g.translate(860, 1620); g.lineWidth = 13; g.strokeStyle = '#2f8f4f'; for (var hh = 0; hh < 4; hh++) { g.beginPath(); g.ellipse(0, 0, 70 - hh * 13, 30 - hh * 6, 0, 0, TAU); g.stroke(); } g.strokeStyle = '#4fb06d'; g.lineWidth = 3; g.beginPath(); g.ellipse(0, -4, 70, 30, 0, Math.PI * 1.1, Math.PI * 1.7); g.stroke();
    g.lineWidth = 13; g.strokeStyle = '#2f8f4f'; g.beginPath(); g.moveTo(-60, 14); g.quadraticCurveTo(-140, 60, -110, 120); g.stroke(); g.restore();
    /* the wall lamp */
    rr(g, 486, 642, 48, 30, 6); g.fillStyle = '#2b2530'; g.fill(); g.beginPath(); g.arc(510, 672, 16, 0, Math.PI); g.fillStyle = '#fff1c2'; g.fill();
    g.globalAlpha = .22; g.fillStyle = g.createPattern(GRAIN, 'repeat'); g.fillRect(WBX, WBY, WBW, WBH); g.globalAlpha = 1;
    D.world = c;
  }
  /* palms on both sides (background), swaying, periodic in DUR */
  function palm(g, x, y, s, flip, t, ph) {
    g.save(); g.translate(x, y); g.scale(flip ? -s : s, s);
    g.fillStyle = '#0b0f24'; g.beginPath(); g.moveTo(-10, 0); g.quadraticCurveTo(10, -200, 40, -380); g.lineTo(56, -378); g.quadraticCurveTo(28, -200, 14, 0); g.closePath(); g.fill();
    g.strokeStyle = '#1c2246'; g.lineWidth = 3; for (var k2 = 1; k2 < 16; k2++) { var u = k2 / 16, yy = -380 * u, xx = lerp(2, 48, u * u); g.beginPath(); g.moveTo(xx - 10, yy + 4); g.lineTo(xx + 10, yy - 3); g.stroke(); }
    g.translate(48, -384); g.rotate(.05 * osc(t, 7, ph) + .03 * osc(t, 11, ph * 2));
    for (var i = 0; i < 7; i++) { var a = -2.9 + i * .78 + .04 * osc(t, 9, ph + i); g.save(); g.rotate(a); g.fillStyle = '#0b0f24'; g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(80, -34, 170, 20); g.quadraticCurveTo(80, -6, 0, 10); g.closePath(); g.fill();
      g.strokeStyle = '#1f2a55'; g.lineWidth = 2.5; for (var f = 0; f < 9; f++) { var fx = 20 + f * 16; g.beginPath(); g.moveTo(fx, -fx * .16 + 2); g.lineTo(fx + 10, -fx * .16 + 16); g.stroke(); } g.restore(); }
    g.restore();
  }
  /* moths around the lamp */
  function moths(g, t) { for (var i = 0; i < 3; i++) { var a = TAU * (5 + i * 2) * t / DUR + i * 2.1, rx = 40 + i * 14, ry = 18 + i * 6; g.fillStyle = 'rgba(255,244,210,.85)'; g.beginPath(); g.ellipse(510 + Math.cos(a) * rx, 662 + Math.sin(a * 1.3) * ry, 4, 2.5, a, 0, TAU); g.fill(); } }

  /* ---------- the door: slats from the top of the opening down to its bottom edge (world y) ---------- */
  /* the rise starts on "Still" and runs across the seam: frame 0 continues the same curve (kayak already in view) */
  function riseB(t) { return lerp(OY1, OY0, eio(seg(t, T.rise, DUR + T.riseOver))); }
  function doorB(t) {
    if (t < T.riseOver) return riseB(t + DUR);
    if (t >= T.rise) return riseB(t);
    var b = OY0;
    if (t >= T.n1 - .05) b = lerp(OY0, 880, eo(seg(t, T.n1 - .05, T.n1 + .08)));
    if (t >= T.n2c) b = lerp(880, 950, eio(seg(t, T.n2c, T.n2 - .02)));
    if (t >= T.n2 - .02) b = lerp(950, 990, eo(seg(t, T.n2 - .02, T.n2 + .06)));
    if (t >= T.slam - .1) { var k = seg(t, T.slam - .1, T.slam); b = lerp(990, OY1, k * k); }
    return b;
  }
  function door(g, t) {
    var b = doorB(t); if (b <= OY0 + 1) return;
    g.save(); g.beginPath(); g.rect(OX0, OY0, OX1 - OX0, b - OY0 + 2); g.clip();
    var SH = 46, off = (OY1 - b) % SH;
    for (var y = b - 22; y > OY0 - SH; y -= SH) {
      g.fillStyle = SLAT; g.fillRect(OX0, y - SH, OX1 - OX0, SH);
      g.fillStyle = SLAT2; g.fillRect(OX0, y - 8, OX1 - OX0, 8);
      g.fillStyle = 'rgba(255,255,255,.5)'; g.fillRect(OX0, y - SH, OX1 - OX0, 3);
    }
    g.globalAlpha = .3; g.fillStyle = g.createPattern(GRAIN, 'repeat'); g.fillRect(OX0, OY0, OX1 - OX0, b - OY0); g.globalAlpha = 1;
    /* bottom bar + handle */
    g.fillStyle = '#9b8f78'; g.fillRect(OX0, b - 22, OX1 - OX0, 22); g.fillStyle = '#3b3530'; rr(g, 470, b - 44, 80, 14, 6); g.fill();
    g.restore();
    /* the cast shadow under the bottom edge */
    if (b < OY1 - 2) { var sg = g.createLinearGradient(0, b, 0, b + 40); sg.addColorStop(0, 'rgba(30,15,5,.35)'); sg.addColorStop(1, 'rgba(30,15,5,0)'); g.fillStyle = sg; g.fillRect(OX0, b, OX1 - OX0, 40); }
  }

  /* ---------- camera: small pushes only (props must stay inside the rail) ---------- */
  function cam(t) {
    var s = 1 + .035 * (1 - eio(seg(t, 0, 2.6))) + .035 * eio(seg(t, DUR - 1.6, DUR));
    s += .07 * eio(seg(t, T.catchIn, T.catchIn + 1.8)) * (1 - eio(seg(t, T.lsUp - .1, T.lsUp + .3)));
    s += .08 * eio(seg(t, T.trkUp, T.trkUp + 1.4)) * (1 - eio(seg(t, T.trkDown, T.trkDown + .4)));
    s += .05 * eio(seg(t, T.kayUp, T.kayUp + 1.2)) * (1 - eio(seg(t, T.itemsBack, T.itemsBack + .3)));
    return { s: s, fx: 510, fy: 1000 };
  }

  /* ---------- items: where each one is drawn (in the garage, or lifted out toward the camera) ---------- */
  function liftState(t, home, hero, tUp, tDown, d) {
    var ku = eio(seg(t, tUp, tUp + (d || .42))), kd = tDown == null ? 0 : eio(seg(t, tDown, tDown + (d || .42))), k = ku * (1 - kd);
    var arc = Math.sin(Math.PI * k) * -60;
    return { x: lerp(home.x, hero.x, k), y: lerp(home.y, hero.y, k) + arc, s: lerp(1, hero.s, k), r: lerp(0, hero.r || 0, k), k: k, moving: (k > 0 && k < 1) };
  }
  function tagSwing(t, tl) { return .5 * osc(t, 9, tl * 3) * .06 + sw(t, tl, .32, 8.5, 3.2) + sw(t, T.kick, .26, 9, 3) + .025 * osc(t, 11, tl); }
  function tagHot(t) { return t < T.hot ? 0 : bump(t, T.hot, 1.1) * .95; }
  function tagAlpha() { return 1; }
  /* blank back until its flip, words until the slam (the door is shut then), blank again for the loop */
  function tagFlip(t, tl) { return t >= T.slam ? 0 : seg(t, tl, tl + .2); }

  function drawBike(g, t) {
    var st = liftState(t, { x: BIKE.x, y: BIKE.y }, { x: 510, y: 880, s: 2.05, r: -.03 }, T.bikeUp, T.bikeDown);
    var nr = NOREC; NOREC = nr || st.moving;
    g.save(); g.translate(st.x, st.y); g.rotate(st.r); g.scale(st.s * kn(t, T.bikeKnock, .03), st.s * kn(t, T.bikeKnock, .03)); put(g, D.bike, 0, 0);
    hangTag(g, -48, -48, tagSwing(t, T.tag0), lerp(1, 1.25 / 2.05, st.k), tagHot(t), 1, D.TB, tagFlip(t, T.tag0));
    g.restore(); NOREC = nr; return st;
  }
  function drawKayak(g, t) {
    var st = liftState(t, { x: KAY.x, y: KAY.y }, { x: 510, y: 900, s: 1.18, r: .02 }, T.kayUp, T.itemsBack);
    var nr = NOREC; NOREC = nr || st.moving;
    g.save(); g.translate(st.x, st.y); g.rotate(st.r); var kk = kn(t, T.kayKnock, .03); g.scale(st.s * kk, st.s * kk); put(g, D.kayak, 0, 0);
    hangTag(g, -160, 40, tagSwing(t, T.tag1), lerp(1, 1.2 / 1.18, st.k), tagHot(t), 1, D.TB, tagFlip(t, T.tag1));
    g.restore(); NOREC = nr; return st;
  }
  /* the Ganado: a low-riding pickup, side view, parked in the garage at TS; lifted out for the build and again for "goes" */
  var TRKH = { x: 676, y: 1218 }, TS = .56, TRKHERO = { x: 510, y: 1160, s: .98 };
  function truckLift(t) {
    var a = liftState(t, TRKH, { x: TRKHERO.x, y: TRKHERO.y, s: 1 }, T.bUp, T.bDown, .4), b = liftState(t, TRKH, { x: TRKHERO.x, y: TRKHERO.y, s: 1 }, T.trkUp, T.trkDown, .42);
    return a.k >= b.k ? a : b;
  }
  function modsK(t) { if (t >= T.slam) return [0, 0]; return [seg(t, T.mods1, T.mods1 + .35), seg(t, T.mods2, T.mods2 + .3)]; }
  function drawTruck(g, t) {
    var st = truckLift(t), s = lerp(TS, TRKHERO.s, st.k), m = modsK(t);
    var bob = st.k > .99 ? 3 * Math.sin(TAU * t * 2.2) : 0, low = 8 * eo(seg(t, T.mods2, T.mods2 + .2)) * (t < T.slam ? 1 : 0);
    var nr = NOREC; NOREC = nr || st.moving;
    g.save(); g.translate(st.x, st.y + bob + low * s); var kk = kn(t, T.trkKnock, .025) * kn(t, T.mods2, .02); g.scale(s * kk, s * kk);
    put(g, D.truckS, 0, 0); retroMods(g, m[0], m[1]);
    /* at home its tag hangs from a nail above it (the pickup stays in view); lifted, it rides the cab, until the pickup's own (Game Rant / TheGamer) label lands */
    if (t < T.lSrc || t >= T.slam) {
      var ko = t < T.slam ? eio(seg(t, T.lSrc - .2, T.lSrc)) : 0;
      if (ko < 1) { NOREC = nr || st.moving || ko > 0; g.save(); g.translate(0, -700 * ko); g.rotate(-.4 * ko); hangTag(g, lerp((750 - TRKH.x) / TS, 120, st.k), lerp((905 - TRKH.y) / TS, -150, st.k), tagSwing(t, T.tag2), 1 / s, tagHot(t), 1 - ko, D.TT, tagFlip(t, T.tag2)); g.restore(); }
    }
    g.restore(); NOREC = nr; return st;
  }

  /* =====================================================================================================
     THE PROP LAYER: the world under the camera, then the screen-space cards, clipped to the rail.
     ===================================================================================================== */
  function world(g, t) {
    var c = cam(t), dx = 2.5 * osc(t, 13, .3) + 1.5 * osc(t, 23, 1.1), dy = 2 * osc(t, 11, 2.1) + 1.5 * osc(t, 19, .7);
    g.save(); g.translate(510 + dx, 1000 + dy); g.scale(c.s, c.s); g.translate(-c.fx, -c.fy);
    g.drawImage(D.world, WBX, WBY);
    var lp = .5 + .5 * osc(t, 8, .4), gl = g.createRadialGradient(510, 670, 10, 510, 670, 200); gl.addColorStop(0, 'rgba(255,236,180,' + (.35 + .1 * lp).toFixed(3) + ')'); gl.addColorStop(1, 'rgba(255,236,180,0)'); g.fillStyle = gl; g.fillRect(300, 560, 420, 260);
    moths(g, t);
    palm(g, 60, 640, 1, false, t, .3); palm(g, 1030, 650, .92, true, t, 1.7);
    /* the items that are home, then the door over them (lifted items are drawn later, in front) */
    g.save(); g.beginPath(); g.rect(OX0, OY0, OX1 - OX0, OY1 - OY0); g.clip();
    var homeK = t < T.kayUp + .05 || t > T.itemsBack + .4, homeB = t < T.bikeUp + .05 || t > T.bikeDown + .4, homeT = !truckOut(t);
    if (homeK) drawKayak(g, t);
    if (homeT) drawTruck(g, t);
    if (homeB) drawBike(g, t);
    door(g, t);
    g.restore();
    /* the garage light spilling down the driveway, as wide as the door is open */
    var op = clamp((OY1 - doorB(t)) / (OY1 - OY0), 0, 1);
    if (op > .01) { var sp = g.createLinearGradient(0, OY1, 0, 1960); sp.addColorStop(0, 'rgba(255,214,140,' + (.42 * op).toFixed(3) + ')'); sp.addColorStop(1, 'rgba(255,214,140,0)'); g.fillStyle = sp; g.beginPath(); g.moveTo(OX0, OY1); g.lineTo(OX1, OY1); g.lineTo(OX1 + 160 * op, 1960); g.lineTo(OX0 - 160 * op, 1960); g.closePath(); g.fill(); }
    g.restore();
    return c;
  }
  function truckOut(t) { return (t >= T.bUp + .05 && t <= T.bDown + .4) || (t >= T.trkUp + .05 && t <= T.trkDown + .4); }
  function inCam(g, t, f) { var c = cam(t), dx = 2.5 * osc(t, 13, .3) + 1.5 * osc(t, 23, 1.1), dy = 2 * osc(t, 11, 2.1) + 1.5 * osc(t, 19, .7); g.save(); g.translate(510 + dx, 1000 + dy); g.scale(c.s, c.s); g.translate(-c.fx, -c.fy); f(); g.restore(); }

  function props(g, t) {
    var k;
    /* lifted items (bike, kayak in the items beat; the pickup in its beat), in front of the door */
    var liftedB = t >= T.bikeUp + .05 && t <= T.bikeDown + .4, liftedK = t >= T.kayUp + .05 && t <= T.itemsBack + .4, liftedT = truckOut(t);
    if (liftedB || liftedK) {
      inCam(g, t, function () { if (liftedB) drawBike(g, t); if (liftedK) drawKayak(g, t); });
    }
    if (liftedT) {
      inCam(g, t, function () { drawTruck(g, t); });
    }
    /* item labels (items beat) */
    slapOn(g, D.lDinka, 600, 1250, -.03, T.lDinka, T.dinkaOut, t);
    slapOn(g, D.lCrest, 660, 1070, .025, T.lCrest, T.itemsBack - .05, t);
    slapOn(g, D.lJsv, 510, 1310, -.01, T.lJsv, T.itemsBack + .1, t);
    slapOn(g, D.lGrb, 510, 880, -.02, T.lGrb, T.bDown - .1, t);
    /* the chapter pad: drops on "why", pinned top right; flips to 2 on "2", back to 1 on "1?", leaves before the seam */
    if (t >= T.calIn - .3 && t < T.calOut + .5) {
      var kcs = eio(seg(t, T.lsUp - .1, T.lsUp + .25)) * (1 - eio(seg(t, T.trkDown, T.trkDown + .35)));
      var kc = seg(t, T.calIn - .28, T.calIn), fall = (1 - kc * kc) * 900, kco = eio(seg(t, T.calOut, T.calOut + .4));
      var nrc = NOREC; NOREC = nrc || kc < 1 || kco > 0 || kcs > 0;
      g.save(); g.translate(790 + 600 * kco + 520 * kcs, 650 - fall); g.rotate(.04 + sw(t, T.calIn, .05, 9, 4) + .3 * kco); var sc0 = kn(t, T.calIn, .03); g.scale(sc0, sc0);
      var flipTo2 = t >= T.cal2, flipBack = t >= T.cal1;
      var under = flipBack ? D.cal1 : flipTo2 ? D.cal2 : D.cal1, over = flipBack ? D.cal2 : D.cal1, fk = flipBack ? seg(t, T.cal1, T.cal1 + .22) : flipTo2 ? seg(t, T.cal2, T.cal2 + .22) : 1;
      putW(g, under, 0, 0);
      if (fk < 1) { g.save(); g.translate(0, -CALH / 2); g.scale(1, Math.cos(Math.PI / 2 * fk)); g.translate(0, CALH / 2); NOREC = true; putW(g, over, 0, 0); g.restore(); NOREC = nrc || kc < 1 || kco > 0; }
      g.restore(); NOREC = nrc;
    }
    /* "?" stamp beside the pad */
    if (t >= T.qmark && t < T.qOut + .4) {
      var kq = eo(seg(t, T.qmark, T.qmark + .14)), kqo = eio(seg(t, T.qOut, T.qOut + .3)), sq = lerp(1.6, 1, kq) * (1 - kqo);
      if (sq > .02) { g.save(); g.translate(610, 640); g.rotate(-.12); g.scale(sq, sq); var nrq = NOREC; NOREC = true; stk(g, '?', 0, 0, 170, { col: CORAL }); NOREC = nrq; g.restore(); }
    }
    /* the VGC note: slaps on at the end of "rush?", stays under the listing until it is covered */
    if (t >= T.note - .02 && t < T.lsUp + .5) {
      var nr2 = NOREC; slapOn(g, D.note, 470, 880, -.03, T.note, null, t, { tape: true }); NOREC = nr2;
    }
    /* the listing (DM frame): slides up over the note, holds 3+ s: our find bar types "chapter", scans the rows, 0 MATCHES;
       in the pause a big rubber stamp slams 0 MATCHES across it, the marker rings the count, the PS/Xbox chip gets its tick */
    if (t >= T.lsUp && t < T.lsDown + .45) {
      var ku = eo(seg(t, T.lsUp, T.lsUp + .38)), kd = eio(seg(t, T.lsDown, T.lsDown + .4)), yy2 = LSY + 1100 * (1 - ku) + 1200 * kd;
      var nrl = NOREC; NOREC = nrl || ku < .999 || kd > 0;
      g.save(); g.translate(LSX, yy2); g.scale(lerp(.94, 1, ku), lerp(.94, 1, ku)); putW(g, D.listing, 0, 0);
      /* the find scan: a yellow band sweeps down the rows while it searches, finds nothing */
      var sk = seg(t, T.fbType + .3, T.zero); if (sk > 0 && sk < 1) { g.save(); g.globalCompositeOperation = 'multiply'; g.fillStyle = 'rgba(255,225,77,.85)'; var by = lerp(-LSH / 2 + 196, LSH / 2 - 40, sk); g.fillRect(-LSW / 2 + 20, by - 30, LSW - 40, 60); g.restore(); }
      g.save(); g.translate(LSW / 2 - 120, -LSH / 2 + 32); g.rotate(.06); putW(g, D.recreated, 0, 0); g.restore();
      if (t >= T.stamp) { var kst = seg(t, T.stamp - .08, T.stamp), sst = lerp(1.9, 1, kst * kst) * kn(t, T.stamp, .03); NOREC = nrl || kst < 1 || kd > 0; g.save(); g.globalAlpha *= clamp(kst * 3, 0, 1); g.translate(0, 70); g.rotate(-.09); g.scale(sst, sst); putW(g, D.stamp0, 0, 0); g.restore(); NOREC = nrl || ku < .999 || kd > 0; }
      g.restore();
      if (t >= T.also) { var ka = eo(seg(t, T.also, T.also + .14)), sa = lerp(1.35, 1, ka); g.save(); g.translate(0, 1200 * kd); g.translate(510, 1352); g.rotate(-.02); g.scale(sa, sa); g.globalAlpha *= fin(t, T.also, .05); putW(g, D.also, 0, 0); tickMark(g, 222, 30, seg(t, T.alsoTick, T.alsoTick + .18)); g.restore(); }
      NOREC = nrl;
      g.save(); g.translate(0, -900 * kd); findBar(g, t); g.restore();
    }
    /* the pickup's own label: above the lifted pickup, then rides home with it */
    if (t >= T.lLost - .02 && t < T.lostOut + .4) {
      var kh = eio(seg(t, T.trkDown, T.trkDown + .42)), lx = lerp(510, 690, kh), ly = lerp(790, 1010, kh), ls0 = lerp(1, .75, kh);
      var kl = eo(seg(t, T.lLost, T.lLost + .14)), klo = eio(seg(t, T.lostOut, T.lostOut + .35)), sl = lerp(1.4, 1, kl);
      var nrL = NOREC; NOREC = nrL || kl < 1 || klo > 0 || (kh > 0 && kh < 1);
      g.save(); g.globalAlpha *= fin(t, T.lLost, .05); g.translate(lx, ly - 1500 * klo); g.rotate(-.02 + .3 * klo); g.scale(ls0 * sl, ls0 * sl); putW(g, D.lLost, 0, 0);
      if (t >= T.lSrc) { var ks = eo(seg(t, T.lSrc, T.lSrc + .14)); g.save(); g.globalAlpha *= fin(t, T.lSrc, .05); g.translate(0, D.lLost.sh / 2 + 6); g.rotate(.03); g.scale(lerp(1.3, 1, ks), lerp(1.3, 1, ks)); putW(g, D.lSrcC, 0, 0); g.restore(); }
      g.restore(); NOREC = nrL;
    }
    /* the checklist: slaps on "Ride", ticks per word, knocked away by the slam */
    if (t >= T.chk - .02 && t < T.chkOut + .5) {
      var kk2 = eo(seg(t, T.chk, T.chk + .14)), kko = eio(seg(t, T.chkOut, T.chkOut + .45)), scc = lerp(1.35, 1, kk2);
      var nrk = NOREC; NOREC = nrk || kk2 < 1 || kko > 0;
      g.save(); g.globalAlpha *= fin(t, T.chk, .05); g.translate(300 - 800 * kko, 1010 + 120 * kko); g.rotate(-.035 - .4 * kko); g.scale(scc, scc); putW(g, D.check, 0, 0);
      T.ticks.forEach(function (tt, i) { tickMark(g, -200 + 34 + 36, -215 + 136 + i * 112, seg(t, tt, tt + .2)); });
      g.restore(); NOREC = nrk;
    }
  }

  /* the frame-0 headline and the GTA 6 pill (the hook; they come back for the loop) */
  var HLY1 = 478, HLY2 = 610;
  function headline(g, t) {
    var vis = t < T.hdOut + .4 || t >= T.hdIn - .02; if (!vis) return;
    var ko = t < DUR / 2 ? eio(seg(t, T.hdOut, T.hdOut + .36)) : 0, ki = t >= T.hdIn ? eo(seg(t, T.hdIn, T.hdIn + .16)) : (t < DUR / 2 ? 1 : 0);
    if (ki <= 0) return;
    var kn0 = kn(t, T.now, .05), nr = NOREC; NOREC = nr || ko > 0 || ki < 1;
    var s = lerp(1.35, 1, ki) * kn0, a = clamp(ki * 4, 0, 1);
    g.save(); g.globalAlpha *= a; g.translate(510, 540 - 1000 * ko); g.scale(s, s); g.translate(-510, -540);
    stk(g, 'USE BEFORE', 510, HLY1, 132, { col: CRM, rot: -.02 });
    stk(g, 'CHAPTER 2', 510, HLY2, 150, { col: '#ff6a52', rot: -.02 });
    g.restore();
    /* pill */
    g.restore(); NOREC = nr;
    var kpo = t < DUR / 2 ? eio(seg(t, T.pillOut, T.pillOut + .3)) : 0; if (kpo >= 1) return;
    NOREC = nr || kpo > 0 || ki < 1;
    g.save(); g.globalAlpha *= a; g.translate(0, -360 * kpo);
    var pw = chip(g, 'GTA 6', 240, 338, { px: 46, bg: PINKG, fg: CRM, rot: -.02 }), uw = tw('ULTIMATE EDITION', 46) + 46 * .68 + 4;
    if (t >= T.ult && t < DUR / 2) { var ku = eo(seg(t, T.ult, T.ult + .16)); NOREC = nr || ku < 1 || kpo > 0; chip(g, 'ULTIMATE EDITION', 240 + pw / 2 + 14 + uw / 2, 338, { px: 46, bg: CRM, fg: INK, rot: -.02, s: lerp(1.3, 1, ku), a: fin(t, T.ult, .05) }); }
    g.restore(); NOREC = nr;
  }

  /* ---------- captions: cream tape phrase cards, 2-4 words, >= 96 px, upper third (the hook's words are the headline) ---------- */
  var CAPDEF = { items: [3, 2, 3, 3], build: [3, 3], q: [4], 'catch': [2, 4], store: [3, 3], pickup: [3, 1, 4], 'do': [2, 2, 3], end: [4] };
  var CAPS = (function () {
    var o = [];
    VO.lines.forEach(function (l) {
      var d = CAPDEF[l.id]; if (!d) return; var i = 0;
      d.forEach(function (n) { var ws = l.words.slice(i, i + n); i += n; if (ws.length) o.push({ id: l.id, t0: ws[0].t0, t1: ws[ws.length - 1].t1, s: ws[0].t0 - .04, words: ws }); });
    });
    return o;
  })();
  var STRESS = [];
  function stressed(w) { for (var i = 0; i < STRESS.length; i++) if (Math.abs(STRESS[i] - w.t0) < .02) return true; return false; }
  var CAPY = 430, TAPE = '#f6ecd0';
  function capEnd(i) { var c = CAPS[i], nx = CAPS[i + 1]; return Math.min(c.t1 + .62, nx ? nx.s : T.hdIn - .02); }
  function captions(g, t) {
    t = tq(t);
    var card0 = null, ci = -1;
    CAPS.forEach(function (c, i) { if (t >= c.s) { card0 = c; ci = i; } });
    if (!card0) return;
    var end = capEnd(ci); if (t >= end) return;
    var k = cd(t, card0.s, 18), ko = 1 - seg(t, end - .06, end);
    g.save(); g.globalAlpha *= ko * clamp((t - card0.s) / .06, 0, 1); cond(g); var cpx = 108; font(g, cpx, 900); ls(g, 1); g.textBaseline = 'alphabetic';
    var words = card0.words, up = words.map(function (w) { return w.w.toUpperCase(); }), ws, gap, maxw = 800;
    function meas() { ws = up.map(function (u) { return g.measureText(u).width; }); gap = cpx * .24; }
    meas();
    function total(a, b) { var s = 0; for (var i = a; i < b; i++) s += ws[i] + (i > a ? gap : 0); return s; }
    var lines = [[0, up.length]];
    while (total(0, up.length) > maxw && cpx > 96) { cpx -= 4; font(g, cpx, 900); meas(); }
    if (total(0, up.length) > maxw) {
      /* two lines, split at the word that balances them, never after a weak word */
      var best = 1, bw = 1e9; for (var s = 1; s < up.length; s++) { if (GLUE[norm(words[s - 1].w)]) continue; if (/^\d/.test(up[s])) continue; var m = Math.max(total(0, s), total(s, up.length)); if (m < bw) { bw = m; best = s; } }
      lines = [[0, best], [best, up.length]];
    }
    var lh = cpx * 1.18, y0 = CAPY - (lines.length - 1) * lh / 2 + cpx * .36;
    lines.forEach(function (ln, li) {
      var tw0 = total(ln[0], ln[1]), x = 510 - tw0 / 2, y = y0 + li * lh + (1 - k) * 26, seed = Math.round(card0.t0 * 100) + li * 7;
      var r = mulberry(seed), x0 = x - 24, x1 = x + tw0 + 24, yt = y - cpx * .86, yb = y + cpx * .22, rot = (r() - .5) * .03;
      g.save(); g.translate(510, y); g.rotate(rot); g.translate(-510, -y);
      g.beginPath(); g.moveTo(x0, yt); for (var xx = x0; xx < x1; xx += 9) g.lineTo(xx, yt + (r() - .5) * 3); g.lineTo(x1, yt); for (var zz = 0; zz < 6; zz++) g.lineTo(x1 + (zz % 2 ? 7 : 0), yt + (yb - yt) * (zz + 1) / 6); for (xx = x1; xx > x0; xx -= 9) g.lineTo(xx, yb + (r() - .5) * 3); g.lineTo(x0, yb); for (zz = 0; zz < 6; zz++) g.lineTo(x0 - (zz % 2 ? 0 : 7), yb - (yb - yt) * (zz + 1) / 6); g.closePath();
      g.save(); g.shadowColor = 'rgba(0,4,20,.55)'; g.shadowBlur = 10; g.shadowOffsetX = 3; g.shadowOffsetY = 6; g.fillStyle = TAPE; g.fill(); g.restore();
      g.save(); g.clip(); g.globalAlpha *= .45; g.fillStyle = g.createPattern(GRAIN, 'repeat'); g.fillRect(x0 - 8, yt - 4, x1 - x0 + 16, yb - yt + 8); g.restore();
      for (var i = ln[0]; i < ln[1]; i++) {
        var w = words[i], nw = words[i + 1], cur = stressed(w) && t >= w.t0 - .03 && t < Math.min(w.t1 + .05, nw ? nw.t0 - .03 : 1e9) + .3;
        if (cur) { g.save(); g.globalCompositeOperation = 'multiply'; g.fillStyle = '#ffd84a'; g.fillRect(x - 6, y - cpx * .8, ws[i] + 12, cpx * 1.0); g.restore(); }
        var isG = /^GTA$/.test(up[i]) || /^VGC$/.test(up[i]);
        g.fillStyle = isG ? PINKG : INK; g.fillText(up[i], x, y); x += ws[i] + gap;
      }
      g.restore();
    });
    g.restore(); unst(g); ls(g, 0);
  }
  var GLUE = { the: 1, a: 1, an: 1, your: 1, its: 1, of: 1, at: 1, to: 1, and: 1, 'in': 1, with: 1, on: 1, by: 1, so: 1, 'for': 1, own: 1, how: 1, that: 1, 'if': 1, you: 1, no: 1, or: 1, it: 1, was: 1, will: 1, his: 1, is: 1, her: 1, from: 1, as: 1, can: 1, when: 1, why: 1, still: 1, plus: 1 };

  var NOISE, POSTERMODE = false;
  var STAGEC = '#0b1233';
  function stage(g) { g.fillStyle = STAGEC; g.fillRect(0, 0, W, H); }
  function railClip(g) { g.beginPath(); if (LIVE2.clip) g.rect(BX0, 0, BX1 - BX0, BY1); else g.rect(-500, -500, 2080, BY1 + 500); g.clip(); }
  function scrims(g, t) {
    var a = 0;
    a = Math.max(a, .55 * eio(seg(t, T.bikeUp, T.bikeUp + .3)) * (1 - eio(seg(t, T.itemsBack, T.itemsBack + .3))));
    a = Math.max(a, .5 * eio(seg(t, T.bUp - .05, T.bUp + .3)) * (1 - eio(seg(t, T.bDown, T.bDown + .35))));
    a = Math.max(a, .62 * eo(seg(t, T.lsUp, T.lsUp + .38)) * (1 - eio(seg(t, T.lsDown, T.lsDown + .4))));
    a = Math.max(a, .55 * eio(seg(t, T.trkUp, T.trkUp + .3)) * (1 - eio(seg(t, T.trkDown, T.trkDown + .3))));
    if (a > .002) { g.fillStyle = 'rgba(12,8,28,' + a.toFixed(3) + ')'; g.fillRect(0, 0, W, H); }
  }
  function frame(g, t) {
    g.setTransform(1, 0, 0, 1, 0, 0);
    stage(g);
    if (LIVE2.bg) world(g, t);
    else { /* rail scan: the world's items only */ g.save(); railClip(g); world(g, t); g.restore(); }
    if (LIVE2.bg) scrims(g, t);
    g.save(); railClip(g); props(g, t); headline(g, t); g.restore();
    if (!POSTERMODE && LIVE.text) captions(g, t);
    if (LIVE.grain && NOISE && LIVE2.bg) { g.globalAlpha = .05; g.globalCompositeOperation = 'overlay'; var o = Math.floor(t * 24) * 37 % 256; g.fillStyle = g.createPattern(NOISE, 'repeat'); g.translate(-o, -o); g.fillRect(o, o, W, H); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }
  }
  function TEXTS(t) {
    var o = [];
    function Tx(id, text, a, b) { if (t >= a && t < b) o.push({ id: id, text: text, x0: 0, y0: 0, x1: 0, y1: 0 }); }
    var LA = T.lsUp + .15, LB = T.lsDown, cover = t > T.lsUp + .3 && t < T.lsDown;
    Tx('hl1', 'USE BEFORE', 0, T.hdOut + .15); Tx('hl1', 'USE BEFORE', T.hdIn + .1, DUR + 1);
    Tx('hl2', 'CHAPTER 2', 0, T.hdOut + .15); Tx('hl2', 'CHAPTER 2', T.hdIn + .1, DUR + 1);
    Tx('pill', 'GTA 6', 0, T.pillOut + .1); Tx('pill', 'GTA 6', T.hdIn + .1, DUR + 1);
    Tx('ult', 'ULTIMATE EDITION', T.ult + .1, T.pillOut + .1); Tx('ult', 'ULTIMATE EDITION', LA, LB);
    [T.tag0, T.tag1].forEach(function (tl, i) {
      if (cover) return;
      Tx('tg' + i, 'END OF CH. 1', tl + .25, T.slam); Tx('tv' + i, 'PER VGC', tl + .25, T.slam);
    });
    if (!cover) { Tx('tr2', 'RETRO BUILD:', T.tag2 + .25, T.lSrc - .2); Tx('tg2', 'CH. 1 ONLY', T.tag2 + .25, T.lSrc - .2); Tx('tv2', 'PER VGC', T.tag2 + .25, T.lSrc - .2); }
    Tx('dinka', 'DINKA ENDURO', T.lDinka + .1, T.dinkaOut); Tx('dinka', 'DINKA ENDURO', LA, LB);
    Tx('crest', 'CREST KAYAK', T.lCrest + .1, T.itemsBack); Tx('crest', 'CREST KAYAK', LA, LB);
    Tx('jsv', "JASON'S SAFEHOUSE VEHICLES", T.lJsv + .1, T.itemsBack + .1); Tx('jsv', "JASON'S SAFEHOUSE VEHICLES", LA, LB);
    Tx('grb', 'GANADO RETRO BUILD', T.lGrb + .1, T.bDown - .1); Tx('grb', 'GANADO RETRO BUILD', LA, LB);
    /* the pad's big "2" lives 1.5 s (Chapter 2 → Still): a digit, said aloud, kept out of the dwell check */
    if (!(t > T.lsUp + .3 && t < T.trkDown + .35)) { Tx('cal', 'CHAPTER', T.calIn + .1, T.calOut); Tx('c1', '1', T.calIn + .1, T.cal2); Tx('c1', '1', T.cal1 + .22, T.calOut); }
    var NE = T.lsUp + .3;
    Tx('nh', 'VGC GUIDE · NOV 18', T.note + .05, NE); Tx('nq1', '“…ONLY IN', T.note + .05, NE); Tx('nq2', 'CHAPTER 1…”', T.note + .05, NE); Tx('nd', 'VIDEOGAMESCHRONICLE.COM', T.note + .05, NE);
    Tx('rsg', 'ROCKSTARGAMES.COM', LA, LB); Tx('rec', 'RE-CREATED', LA, LB); Tx('mods', '“…EXCLUSIVE MODS.”', LA, LB);
    Tx('also1', 'PS STORE + XBOX STORE:', T.also + .1, LB + .2); Tx('also2', 'ALSO 0 MATCHES', T.also + .1, LB + .2);
    Tx('chkd', 'CHECKED NOV 20', T.fbIn + .15, LB);
    Tx('find', 'chapter', T.fbType + .25, LB); Tx('zero', '0 MATCHES', T.zero + .05, LB);
    Tx('jp', "JASON'S PICKUP", T.lLost + .05, T.lostOut); Tx('lost', 'LOST AT END OF CH. 1', T.lLost + .05, T.lostOut); Tx('gr', 'GAME RANT · THEGAMER', T.lSrc + .05, T.lostOut);
    Tx('chk', 'BEFORE CH. 2', T.chk + .05, T.chkOut); Tx('ride', 'RIDE', T.chk + .05, T.chkOut); Tx('paddle', 'PADDLE', T.chk + .05, T.chkOut); Tx('build', 'BUILD', T.chk + .05, T.chkOut);
    return o;
  }

  /* ---------- times and sound events, all from the voice ---------- */
  function initTimes() {
    /* hook: frame 0 = headline + pill over the garage, door already half up (kayak in view), blank tags flip to words by 0.95 s */
    T.ult = at('hook', 'ultimate') - .02;
    T.tag0 = .45; T.tag1 = .6; T.tag2 = .75;
    T.now = at('hook', 'now');
    T.hdOut = G('hdOut', wend('hook', 'now') + .32, 'swish', .2, .9);
    T.kick = G('kick', T.hdOut + .24, 'tick', .15, 1);
    T.pillOut = at('items', 'bike') - .7;
    /* items: the bike lifts out on "army", the kayak (full width) on "kayak"; home in the pause after */
    T.bikeUp = at('items', 'army') - .08; T.bikeKnock = at('items', 'bike');
    T.lDinka = at('items', 'bike') + .02; T.dinkaOut = at('items', 'kayak') - .2;
    T.kayUp = at('items', 'kayak') - .12; T.bikeDown = T.kayUp - .06; T.kayKnock = at('items', 'kayak') + .3; T.lCrest = at('items', 'kayak') + .22;
    T.lJsv = at('items', "jason's") + .02;
    T.itemsBack = G('back', after('items') + .02, 'roll', .2, 1);
    /* build: the low pickup lifts out of the garage on "plus"; stripe on "retro", chrome + whitewalls on "mods"; back home */
    T.bUp = at('build', 'plus') - .1;
    T.mods1 = at('build', 'retro'); T.mods2 = at('build', 'mods') + .05; T.lGrb = at('build', 'pickup') - .05;
    T.bDown = at('q', 'so') - .25;
    /* q: the pad drops on "why", "?" on "rush", the VGC note answers at the end of the word, the door drops a notch */
    T.calIn = at('q', 'why'); T.qmark = at('q', 'rush');
    T.note = wend('q', 'rush?') - .02; T.qOut = T.note - .05;
    T.n1 = G('n1', wend('q', 'rush') + .32, 'clang', .25, 1.1);
    /* catch: the tags flash coral on "only"; a slow push */
    T.catchIn = at('catch', 'vgc') - .05; T.hot = at('catch', 'only') - .02;
    /* store: the listing slides up over the note; find types "chapter" on "page", 0 MATCHES on "doesn't";
       in the pause: the stamp, the marker ring, the tick on the PS/Xbox chip */
    T.lsUp = G('lsUp', after('catch'), 'swish', .15, .9); T.fbIn = T.lsUp + .3;
    T.fbType = at('store', 'page') - .05; T.zero = at('store', "doesn't") - .08; T.also = T.zero - .06;
    T.stamp = G('stamp', wend('store', 'that.') + .27, 'stamp', .2, 1);
    T.ring = G('ring', T.stamp + .33, 'scrib', .15, 1);
    T.alsoTick = G('alsoTick', T.ring + .36, 'tick', .2, 1);
    T.lsDown = at('pickup', 'pickup') - .15;
    /* pickup: it lifts out on "pickup" (push in), its tag pops off as the Game Rant / TheGamer label lands, home on "ends" */
    T.trkUp = at('pickup', 'pickup') - .05; T.trkKnock = at('pickup', 'pickup') + .3;
    T.lLost = at('pickup', 'goes'); T.lSrc = at('pickup', 'goes') + .18;
    T.trkDown = at('pickup', 'ends') + .05;
    T.n2c = T.trkDown + .3; T.n2 = G('n2', after('pickup'), 'clang', .25, 1.1);
    /* do: checklist ticks, pad to 2 on "Chapter", the slam in the pause */
    T.chk = at('do', 'ride') - .04; T.ticks = [at('do', 'ride') + .1, at('do', 'paddle') + .02, at('do', 'build') + .02];
    T.lostOut = at('do', 'and') + .26;
    T.cal2 = at('do', 'chapter');
    T.slam = G('slam', after('do'), 'thud', .25, 1.2); T.chkOut = T.slam;
    /* end: on "Still" the pad flips back to 1 and the door starts up (the same curve runs on into frame 0) */
    T.cal1 = at('end', 'still'); T.rise = at('end', 'still') + .05; T.riseOver = .5; T.calOut = wend('end', '1?') + .3;
    G('rattle', after('end'), 'rattle', .3, 1);
    T.hdIn = G('hdIn', DUR - .35, 'slap', .12, 1);
    STRESS = [['q', 'rush?'], ['catch', 'only'], ['store', "doesn't"], ['pickup', 'ends'], ['do', '2'], ['end', 'still']].map(function (p) { return at(p[0], p[1]); });
    EV.sort(function (a, b) { return a.t - b.t; });
  }
  function buildPieces() {
    buildBike(); buildKayak(); buildTruckS(); buildNote(); buildListing(); buildChecklist(); buildWorld();
    var LT = ['EXP:', 'END OF CH. 1', 'PER VGC'], LR = ['RETRO BUILD:', 'CH. 1 ONLY', 'PER VGC'];
    D.TB = { back: tagPiece(MAN, CORALD, LAB, null), face: tagPiece(MAN, INK, LAB, LT), hot: tagPiece(CORAL, CRM, '#ffe2d8', LT) };
    D.TT = { back: tagPiece(MAN, CORALD, LAB, null, 300), face: tagPiece(MAN, INK, LAB, LR, 300), hot: tagPiece(CORAL, CRM, '#ffe2d8', LR, 300) };
    D.cal1 = calPage('1'); D.cal2 = calPage('2');
    D.lDinka = strip([['DINKA ENDURO', 76, INK]], 440, MAN, { seed: 41 });
    D.lCrest = strip([['CREST KAYAK', 76, INK]], 400, MAN, { seed: 43 });
    D.lJsv = strip([["JASON'S SAFEHOUSE VEHICLES", 56, INK]], 720, CRM, { seed: 45 });
    D.lGrb = strip([['GANADO RETRO BUILD', 76, INK]], 640, MAN, { seed: 47 });
    D.lLost = strip([["JASON'S PICKUP", 50, LAB], ['LOST AT END OF CH. 1', 72, CORALD]], 520, CRM, { seed: 49 });
    D.lSrcC = chipPiece([['GAME RANT · THEGAMER', 38, INK, 1.5]], 420, MAN, INK, { lh: 44, pad: 16 });
  }
  function buildTextures() { GRAIN = buildGrain(); buildPieces(); }

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

  BODY.slap = .1; BODY.swish = .22; BODY.clang = .26; BODY.thud = .3; BODY.rattle = .3; BODY.scrib = .3; BODY.roll = .22; BODY.stamp = .27; BODY.tick = .06;
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
    function slap(t, g) { thump(t, .3 * g, 240); nband(t, t + .07, 2600, 1200, .14 * g, .01 * g, .9); tick(t, 1.1 * g, 2000); nband(t, t + .04, 2000, 1300, .16 * g, .02 * g, 1.4); }
    function swish(t, g) { nband(t, t + .2, 900, 3600, .2 * g, .03 * g, .8); }
    /* the roll-up door's metal: a clang = inharmonic partials over a thump and a crack */
    function clang(t, g) { [[176, .2], [412, .12], [693, .09], [1131, .06], [1587, .04]].forEach(function (p, j) { osc2('sine', p[0], t, t + .32, [[t, 0], [t + .003, p[1] * g], [t + .28 - j * .03, 0]], (j % 2 ? .15 : -.15)); }); thump(t, .45 * g, 160); tick(t, 1.3 * g, 2400); nband(t, t + .08, 3000, 1500, .12 * g, .01 * g, 1.2); }
    /* the slam: a low boom, the door's rattle and a crack */
    function thud(t, g) { boom(t, .55 * g, 110, 42, .28); thump(t, .5 * g, 200); tick(t, 1.6 * g, 1800); for (var j = 0; j < 7; j++) tick(t + .03 + j * .028, (.5 - j * .05) * g, 2600 + rnd() * 1500); nband(t, t + .1, 1800, 700, .2 * g, .01 * g, .8); }
    /* the door rolling up: a fast run of slat ticks over a low rumble */
    function rattle(t, g) { for (var j = 0; j < 10; j++) tick(t + j * .03 + rnd() * .006, (.45 + rnd() * .35) * g, 1600 + rnd() * 2400); nband(t, t + .32, 180, 260, .14 * g, .06 * g, .7, 0, 'lowpass'); }
    /* the marker ring: a squeaky felt-tip loop */
    function scrib(t, g) { nband(t, t + .3, 2400, 3400, .16 * g, .08 * g, 3); osc2('triangle', 1900, t, t + .3, [[t, 0], [t + .02, .025 * g], [t + .28, 0]]).frequency.linearRampToValueAtTime(2300, t + .28); }
    /* the pickup rolling in: tyre hiss and a low engine putter */
    function roll(t, g) { nband(t, t + .3, 500, 1600, .16 * g, .04 * g, .7); var o = osc2('sawtooth', 52, t, t + .32, [[t, 0], [t + .03, .05 * g], [t + .3, 0]]); o.frequency.linearRampToValueAtTime(70, t + .3); }
    /* the rubber stamp: crack, a heavy thump, a short low boom, a felt slap */
    function stamp(t, g) { tick(t, 1.6 * g, 2400); thump(t, .8 * g, 170); boom(t, .35 * g, 130, 60, .18); var sn = noise(t, .12), sl = ac.createBiquadFilter(); sl.type = 'lowpass'; sl.frequency.value = 1500; var so = bus(1); sn.connect(sl); sl.connect(so); env(so.gain, [[t, 0], [t + .004, .32 * g], [t + .1, 0]]); }
    /* a paper flick / pen tick: two bright clicks */
    function tk(t, g) { tick(t, 1.4 * g, 2600); tick(t + .028, .8 * g, 3400); thump(t, .12 * g, 420); }
    var LEVEL = { slap: 3, swish: 3, clang: 2, thud: 2, rattle: 3, scrib: 3, roll: 3, stamp: 1, tick: 3 };
    var TRIM = window.SFX_TRIM || {};
    var TYPE_DB = window.SFX_TYPE_DB || { slap: -19, swish: -10, clang: -19, thud: -21, rattle: -13, scrib: -8, roll: -14, stamp: -12, tick: -12 };
    EV.forEach(function (e) {
      var g = (e.g == null ? 1 : e.g) * (LEVEL[e.type] || 1) * Math.pow(10, ((TRIM[e.id] || 0) + (TYPE_DB[e.type] || 0)) / 20);
      ({ slap: slap, swish: swish, clang: clang, thud: thud, rattle: rattle, scrib: scrib, roll: roll, stamp: stamp, tick: tk })[e.type](e.t, g);
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
    return Promise.all(fonts.map(function (f) { return document.fonts.load(f, 'Aa0%°×−≈≠µ“”‘’·→…#?‹|~$+—½@&!§'); })).then(function () { return document.fonts.ready; }).then(function () {
      EV.length = 0; initTimes(); buildTextures();
      window.FILM.POSTER = Math.round((T.ring + .5) * 30) / 30 + 1 / 60;
      window.FILM.SHOTS = [{ id: 'hook', name: 'Use them', t0: 0, t1: start('items') }, { id: 'items', name: 'Bike + kayak', t0: start('items'), t1: start('build') }, { id: 'build', name: 'Retro Build', t0: start('build'), t1: start('q') }, { id: 'q', name: 'Why', t0: start('q'), t1: start('catch') }, { id: 'catch', name: 'VGC', t0: start('catch'), t1: start('store') }, { id: 'store', name: 'The page', t0: start('store'), t1: start('pickup') }, { id: 'pickup', name: 'The pickup', t0: start('pickup'), t1: start('do') }, { id: 'do', name: 'Do it', t0: start('do'), t1: start('end') }, { id: 'end', name: 'Still in 1?', t0: start('end'), t1: DUR }];
      window.READY = true;
    });
  }
  window.FILM = { bare: function () { ctx.setTransform(1, 0, 0, 1, 0, 0); stage(ctx); }, W: W, H: H, DUR: DUR, POSTER: 0, SLUG: 'gta-chapter1', SHOTS: [], init: init, render: render, frame: frame, LIVE: LIVE, LIVE2: LIVE2, T: T, GT: GT };
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
    function dirty(x, y, w, h) { var d = ctx.getImageData(x, y, w, h).data, o = { c: 0, x0: 1e9, x1: -1, y0: 1e9, y1: -1 }; for (var i = 0; i < d.length; i += 4) if (Math.abs(d[i] - 0x0b) + Math.abs(d[i + 1] - 0x12) + Math.abs(d[i + 2] - 0x33) > 24) { var px = (i / 4) % w, py = Math.floor(i / 4 / w); o.c++; o.x0 = Math.min(o.x0, px); o.x1 = Math.max(o.x1, px); o.y0 = Math.min(o.y0, y + py); o.y1 = Math.max(o.y1, y + py); } return o; }
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
